-- =====================================================
-- INTEGRACIÓN P&L - THE LOBBY BEAUTY
-- =====================================================
-- Fecha: 2025-11-27
-- Descripción: Triggers y migraciones para integrar
--              pedidos y gastos con cash_movements
-- =====================================================
-- IMPORTANTE: Las reservas NO generan movimientos.
-- Solo los PEDIDOS PAGADOS generan ingresos.
-- Los GASTOS PAGADOS generan egresos.
-- =====================================================

-- =====================================================
-- PARTE 1: FUNCIÓN PARA CREAR MOVIMIENTO DE PEDIDO
-- =====================================================

-- Función que crea movimiento de caja cuando un pedido se marca como pagado
CREATE OR REPLACE FUNCTION crear_movimiento_pedido_pagado()
RETURNS TRIGGER AS $$
DECLARE
    cuenta_principal_id INTEGER;
    nuevo_movimiento_id INTEGER;
BEGIN
    -- Solo actuar cuando el estado cambia a 'pagado'
    IF NEW.estado = 'pagado' AND (OLD.estado IS NULL OR OLD.estado != 'pagado') THEN
        -- Buscar la cuenta principal (donde van los ingresos automáticos)
        SELECT id INTO cuenta_principal_id
        FROM cash_accounts
        WHERE es_principal = TRUE AND activo = TRUE
        LIMIT 1;

        -- Si no hay cuenta principal, usar la primera cuenta activa
        IF cuenta_principal_id IS NULL THEN
            SELECT id INTO cuenta_principal_id
            FROM cash_accounts
            WHERE activo = TRUE
            ORDER BY id
            LIMIT 1;
        END IF;

        -- Si hay cuenta disponible, crear el movimiento
        IF cuenta_principal_id IS NOT NULL THEN
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
                cuenta_principal_id,
                'ingreso',
                NEW.total,
                'Pedido #' || NEW.id || ' - ' || COALESCE(NEW.nombre_envio, 'Cliente'),
                'Venta de productos - Pedido pagado',
                COALESCE(NEW.updated_at, NOW()),
                'pedido',
                NEW.id
            ) RETURNING id INTO nuevo_movimiento_id;

            -- Opcional: Guardar referencia del movimiento en el pedido
            -- (si el campo existe)
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 2: TRIGGER PARA PEDIDOS
-- =====================================================

-- Eliminar trigger si existe
DROP TRIGGER IF EXISTS trigger_pedido_pagado_movimiento ON pedidos;

-- Crear trigger que se activa después de UPDATE en pedidos
CREATE TRIGGER trigger_pedido_pagado_movimiento
    AFTER UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION crear_movimiento_pedido_pagado();

-- También crear trigger para INSERT (por si se crea directamente como pagado)
DROP TRIGGER IF EXISTS trigger_pedido_nuevo_pagado_movimiento ON pedidos;

CREATE TRIGGER trigger_pedido_nuevo_pagado_movimiento
    AFTER INSERT ON pedidos
    FOR EACH ROW
    WHEN (NEW.estado = 'pagado')
    EXECUTE FUNCTION crear_movimiento_pedido_pagado();

-- =====================================================
-- PARTE 3: MIGRACIÓN DE PEDIDOS EXISTENTES
-- =====================================================

-- Función para migrar pedidos pagados que no tienen movimiento
CREATE OR REPLACE FUNCTION migrar_pedidos_pagados_existentes()
RETURNS TABLE(pedidos_migrados INTEGER, total_importe DECIMAL) AS $$
DECLARE
    cuenta_principal_id INTEGER;
    pedidos_count INTEGER := 0;
    total_sum DECIMAL := 0;
    pedido RECORD;
BEGIN
    -- Buscar cuenta principal
    SELECT id INTO cuenta_principal_id
    FROM cash_accounts
    WHERE es_principal = TRUE AND activo = TRUE
    LIMIT 1;

    IF cuenta_principal_id IS NULL THEN
        SELECT id INTO cuenta_principal_id
        FROM cash_accounts
        WHERE activo = TRUE
        ORDER BY id
        LIMIT 1;
    END IF;

    IF cuenta_principal_id IS NULL THEN
        RAISE EXCEPTION 'No hay cuentas de caja activas';
    END IF;

    -- Migrar pedidos pagados que no tienen movimiento asociado
    FOR pedido IN
        SELECT p.*
        FROM pedidos p
        WHERE p.estado IN ('pagado', 'preparando', 'enviado', 'entregado')
        AND NOT EXISTS (
            SELECT 1 FROM cash_movements cm
            WHERE cm.pedido_id = p.id
        )
        ORDER BY p.created_at
    LOOP
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
            cuenta_principal_id,
            'ingreso',
            pedido.total,
            'Pedido #' || pedido.id || ' - ' || COALESCE(pedido.nombre_envio, 'Cliente'),
            'Venta de productos (migración histórica)',
            COALESCE(pedido.created_at, NOW()),
            'pedido',
            pedido.id
        );

        pedidos_count := pedidos_count + 1;
        total_sum := total_sum + COALESCE(pedido.total, 0);
    END LOOP;

    pedidos_migrados := pedidos_count;
    total_importe := total_sum;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 4: MIGRACIÓN DE GASTOS EXISTENTES
-- =====================================================

-- Función para migrar gastos pagados que no tienen movimiento
CREATE OR REPLACE FUNCTION migrar_gastos_pagados_existentes()
RETURNS TABLE(gastos_migrados INTEGER, total_importe DECIMAL) AS $$
DECLARE
    cuenta_id INTEGER;
    gastos_count INTEGER := 0;
    total_sum DECIMAL := 0;
    gasto RECORD;
    nuevo_movimiento_id INTEGER;
BEGIN
    -- Para gastos, usamos la cuenta_pago_id si existe, sino la primera cuenta
    FOR gasto IN
        SELECT e.*
        FROM expenses e
        WHERE e.pagado = TRUE
        AND e.movimiento_id IS NULL
        ORDER BY e.fecha
    LOOP
        -- Usar cuenta de pago del gasto o buscar una por defecto
        cuenta_id := gasto.cuenta_pago_id;

        IF cuenta_id IS NULL THEN
            SELECT id INTO cuenta_id
            FROM cash_accounts
            WHERE activo = TRUE
            ORDER BY id
            LIMIT 1;
        END IF;

        IF cuenta_id IS NOT NULL THEN
            INSERT INTO cash_movements (
                cuenta_id,
                tipo,
                importe,
                concepto,
                descripcion,
                fecha,
                referencia_tipo,
                gasto_id
            ) VALUES (
                cuenta_id,
                'gasto',
                gasto.importe,
                gasto.concepto,
                'Gasto (migración histórica)',
                COALESCE(gasto.fecha_pago, gasto.fecha, NOW()),
                'gasto',
                gasto.id
            ) RETURNING id INTO nuevo_movimiento_id;

            -- Actualizar el gasto con la referencia al movimiento
            UPDATE expenses
            SET movimiento_id = nuevo_movimiento_id,
                cuenta_pago_id = cuenta_id
            WHERE id = gasto.id;

            gastos_count := gastos_count + 1;
            total_sum := total_sum + COALESCE(gasto.importe, 0);
        END IF;
    END LOOP;

    gastos_migrados := gastos_count;
    total_importe := total_sum;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTE 5: VISTA MEJORADA DE P&L
-- =====================================================

-- Vista de P&L que combina ingresos y gastos con detalles
CREATE OR REPLACE VIEW v_pl_detallado AS
SELECT
    cm.id,
    cm.fecha,
    EXTRACT(YEAR FROM cm.fecha)::INTEGER as anio,
    EXTRACT(MONTH FROM cm.fecha)::INTEGER as mes,
    cm.tipo,
    cm.importe,
    cm.concepto,
    cm.referencia_tipo,
    -- Categoría para gastos
    CASE
        WHEN cm.referencia_tipo = 'gasto' THEN ec.nombre
        WHEN cm.referencia_tipo = 'pedido' THEN 'Ventas de Productos'
        WHEN cm.referencia_tipo = 'reserva' THEN 'Ventas de Servicios'
        ELSE 'Otros'
    END as categoria,
    -- Color de categoría
    CASE
        WHEN cm.referencia_tipo = 'gasto' THEN COALESCE(ec.color, '#6B7280')
        WHEN cm.referencia_tipo = 'pedido' THEN '#10B981'
        WHEN cm.referencia_tipo = 'reserva' THEN '#06B6D4'
        ELSE '#6B7280'
    END as categoria_color,
    ca.nombre as cuenta_nombre
FROM cash_movements cm
JOIN cash_accounts ca ON cm.cuenta_id = ca.id
LEFT JOIN expenses e ON cm.gasto_id = e.id
LEFT JOIN expense_categories ec ON e.categoria_id = ec.id
ORDER BY cm.fecha DESC;

-- Vista resumen mensual mejorada
CREATE OR REPLACE VIEW v_pl_resumen_mensual_nuevo AS
SELECT
    EXTRACT(YEAR FROM fecha)::INTEGER as anio,
    EXTRACT(MONTH FROM fecha)::INTEGER as mes,
    TO_CHAR(DATE_TRUNC('month', fecha), 'YYYY-MM') as periodo,
    TO_CHAR(DATE_TRUNC('month', fecha), 'TMMonth YYYY') as periodo_nombre,
    COUNT(*) as num_movimientos,
    SUM(CASE WHEN tipo = 'ingreso' THEN importe ELSE 0 END) as total_ingresos,
    SUM(CASE WHEN tipo = 'gasto' THEN importe ELSE 0 END) as total_gastos,
    SUM(CASE WHEN tipo = 'ingreso' THEN importe ELSE 0 END) -
    SUM(CASE WHEN tipo = 'gasto' THEN importe ELSE 0 END) as resultado,
    -- Desglose de ingresos
    SUM(CASE WHEN tipo = 'ingreso' AND referencia_tipo = 'pedido' THEN importe ELSE 0 END) as ingresos_pedidos,
    SUM(CASE WHEN tipo = 'ingreso' AND referencia_tipo = 'reserva' THEN importe ELSE 0 END) as ingresos_reservas,
    SUM(CASE WHEN tipo = 'ingreso' AND referencia_tipo NOT IN ('pedido', 'reserva') THEN importe ELSE 0 END) as ingresos_otros
FROM cash_movements
GROUP BY
    EXTRACT(YEAR FROM fecha),
    EXTRACT(MONTH FROM fecha),
    DATE_TRUNC('month', fecha)
ORDER BY anio DESC, mes DESC;

-- =====================================================
-- PARTE 6: EJECUTAR MIGRACIONES
-- =====================================================

-- NOTA: Ejecutar estas funciones manualmente después de revisar:
-- SELECT * FROM migrar_pedidos_pagados_existentes();
-- SELECT * FROM migrar_gastos_pagados_existentes();

-- =====================================================
-- INSTRUCCIONES DE USO
-- =====================================================
--
-- 1. Ejecutar este script completo en Supabase SQL Editor
-- 2. Revisar si hay pedidos pagados para migrar:
--    SELECT COUNT(*) FROM pedidos WHERE estado IN ('pagado', 'preparando', 'enviado', 'entregado')
--    AND NOT EXISTS (SELECT 1 FROM cash_movements WHERE pedido_id = pedidos.id);
-- 3. Si hay datos, ejecutar migración:
--    SELECT * FROM migrar_pedidos_pagados_existentes();
-- 4. Revisar gastos pagados sin movimiento:
--    SELECT COUNT(*) FROM expenses WHERE pagado = TRUE AND movimiento_id IS NULL;
-- 5. Si hay datos, ejecutar migración:
--    SELECT * FROM migrar_gastos_pagados_existentes();
-- 6. A partir de ahora, los pedidos que se marquen como pagados
--    generarán automáticamente movimientos de caja.
--
