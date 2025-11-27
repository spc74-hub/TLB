-- =====================================================
-- MIGRACIÓN: Campos de cobro para pedidos
-- =====================================================
-- Fecha: 2025-11-27
-- Descripción: Añade campos para distinguir entre
-- ingreso (P&L/devengado) y cobro (Tesorería/caja)
-- =====================================================

-- =====================================================
-- PARTE 1: TIPO ENUMERADO PARA MÉTODO DE COBRO
-- =====================================================

-- Crear tipo enum para método de cobro si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'metodo_cobro_tipo') THEN
        CREATE TYPE metodo_cobro_tipo AS ENUM (
            'efectivo',
            'transferencia',
            'tarjeta_online',  -- Stripe/Redsys online
            'tpv'              -- Datáfono físico
        );
    END IF;
END $$;

-- =====================================================
-- PARTE 2: AÑADIR CAMPOS A TABLA PEDIDOS
-- =====================================================

-- Campo: cobrado (boolean)
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS cobrado BOOLEAN DEFAULT FALSE;

-- Campo: fecha_cobro (timestamp)
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS fecha_cobro TIMESTAMPTZ;

-- Campo: metodo_cobro (enum)
-- Primero intentamos añadir la columna con el tipo correcto
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pedidos' AND column_name = 'metodo_cobro_tipo'
    ) THEN
        ALTER TABLE pedidos ADD COLUMN metodo_cobro_tipo metodo_cobro_tipo;
    END IF;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Campo: cuenta_cobro_id (FK a cash_accounts)
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS cuenta_cobro_id INTEGER REFERENCES cash_accounts(id);

-- Campo: movimiento_cobro_id (FK a cash_movements - para vincular el movimiento de caja)
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS movimiento_cobro_id INTEGER REFERENCES cash_movements(id);

-- =====================================================
-- PARTE 3: ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_pedidos_cobrado ON pedidos(cobrado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_cobro ON pedidos(fecha_cobro);
CREATE INDEX IF NOT EXISTS idx_pedidos_metodo_cobro ON pedidos(metodo_cobro_tipo);
CREATE INDEX IF NOT EXISTS idx_pedidos_cuenta_cobro ON pedidos(cuenta_cobro_id);

-- =====================================================
-- PARTE 4: ACTUALIZAR PEDIDOS EXISTENTES PAGADOS
-- =====================================================

-- Los pedidos con estado 'pagado' y stripe_payment_id se consideran cobrados online
UPDATE pedidos
SET
    cobrado = TRUE,
    fecha_cobro = updated_at,
    metodo_cobro_tipo = 'tarjeta_online'
WHERE estado IN ('pagado', 'preparando', 'enviado', 'entregado')
AND stripe_payment_id IS NOT NULL
AND cobrado IS NOT TRUE;

-- =====================================================
-- PARTE 5: COMENTARIOS EN COLUMNAS
-- =====================================================

COMMENT ON COLUMN pedidos.cobrado IS 'Indica si el pago ha sido recibido (cobrado en caja)';
COMMENT ON COLUMN pedidos.fecha_cobro IS 'Fecha y hora en que se recibió el cobro';
COMMENT ON COLUMN pedidos.metodo_cobro_tipo IS 'Método por el cual se recibió el cobro: efectivo, transferencia, tarjeta_online, tpv';
COMMENT ON COLUMN pedidos.cuenta_cobro_id IS 'Cuenta de caja donde se registró el cobro';
COMMENT ON COLUMN pedidos.movimiento_cobro_id IS 'ID del movimiento de caja asociado al cobro';

-- =====================================================
-- PARTE 6: FUNCIÓN PARA REGISTRAR COBRO
-- =====================================================

CREATE OR REPLACE FUNCTION registrar_cobro_pedido(
    p_pedido_id INTEGER,
    p_metodo metodo_cobro_tipo,
    p_cuenta_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_pedido RECORD;
    v_cuenta_id INTEGER;
    v_movimiento_id INTEGER;
BEGIN
    -- Obtener datos del pedido
    SELECT id, total, cobrado, nombre_envio
    INTO v_pedido
    FROM pedidos
    WHERE id = p_pedido_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido % no encontrado', p_pedido_id;
    END IF;

    IF v_pedido.cobrado THEN
        RAISE EXCEPTION 'Pedido % ya está cobrado', p_pedido_id;
    END IF;

    -- Determinar cuenta de destino
    IF p_cuenta_id IS NOT NULL THEN
        v_cuenta_id := p_cuenta_id;
    ELSIF p_metodo = 'efectivo' THEN
        -- Buscar cuenta de efectivo
        SELECT id INTO v_cuenta_id
        FROM cash_accounts
        WHERE tipo = 'efectivo' AND activo = TRUE
        LIMIT 1;
    ELSE
        -- Buscar cuenta banco principal
        SELECT id INTO v_cuenta_id
        FROM cash_accounts
        WHERE tipo = 'banco' AND es_principal = TRUE AND activo = TRUE
        LIMIT 1;
    END IF;

    IF v_cuenta_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró cuenta de destino para el cobro';
    END IF;

    -- Crear movimiento de caja
    INSERT INTO cash_movements (
        cuenta_id,
        tipo,
        importe,
        concepto,
        descripcion,
        fecha,
        referencia_tipo,
        pedido_id
    ) VALUES (
        v_cuenta_id,
        'ingreso',
        v_pedido.total,
        'Cobro pedido #' || p_pedido_id,
        'Cliente: ' || COALESCE(v_pedido.nombre_envio, 'Anónimo'),
        NOW(),
        'pedido',
        p_pedido_id
    ) RETURNING id INTO v_movimiento_id;

    -- Actualizar pedido
    UPDATE pedidos SET
        cobrado = TRUE,
        fecha_cobro = NOW(),
        metodo_cobro_tipo = p_metodo,
        cuenta_cobro_id = v_cuenta_id,
        movimiento_cobro_id = v_movimiento_id
    WHERE id = p_pedido_id;

    RETURN v_movimiento_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 7: VISTA DE PEDIDOS PENDIENTES DE COBRO
-- =====================================================

CREATE OR REPLACE VIEW v_pedidos_pendientes_cobro AS
SELECT
    p.id,
    p.nombre_envio as cliente,
    p.total,
    p.estado,
    p.created_at as fecha_pedido,
    p.metodo_pago,
    p.stripe_payment_id,
    CASE
        WHEN p.stripe_payment_id IS NOT NULL THEN 'Online (pendiente confirmación)'
        ELSE 'Pendiente cobro manual'
    END as tipo_cobro_esperado
FROM pedidos p
WHERE p.cobrado = FALSE
AND p.estado NOT IN ('cancelado')
ORDER BY p.created_at DESC;

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN
-- =====================================================
--
-- 1. Ejecutar este script en Supabase SQL Editor
--
-- 2. Para cobros de Stripe (online):
--    - El webhook de Stripe debe llamar a registrar_cobro_pedido
--      con metodo='tarjeta_online'
--
-- 3. Para cobros manuales (efectivo, TPV, transferencia):
--    - Usar el endpoint de API o la función registrar_cobro_pedido
--
-- 4. Flujo de tesorería:
--    - P&L: Registra el ingreso cuando se crea el pedido (devengado)
--    - Tesorería: Registra el cobro cuando se recibe el dinero (caja)
--
