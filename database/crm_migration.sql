-- =====================================================
-- Migración de datos existentes al sistema CRM
-- Ejecutar DESPUÉS de crm_schema.sql
-- =====================================================

-- =====================================================
-- PASO 1: Migrar clientes desde reservas
-- =====================================================
-- Primero insertamos clientes nuevos (que no existen por email)
INSERT INTO clientes (nombre, email, telefono, origen, total_reservas, ultima_visita, created_at)
SELECT DISTINCT ON (COALESCE(LOWER(email_cliente), telefono_cliente))
    COALESCE(nombre_cliente, 'Cliente') as nombre,
    email_cliente as email,
    telefono_cliente as telefono,
    'reserva'::origen_cliente as origen,
    COUNT(*) OVER (PARTITION BY COALESCE(LOWER(email_cliente), telefono_cliente)) as total_reservas,
    MAX(fecha) OVER (PARTITION BY COALESCE(LOWER(email_cliente), telefono_cliente)) as ultima_visita,
    MIN(created_at) OVER (PARTITION BY COALESCE(LOWER(email_cliente), telefono_cliente)) as created_at
FROM reservas r
WHERE (email_cliente IS NOT NULL OR telefono_cliente IS NOT NULL)
AND NOT EXISTS (
    SELECT 1 FROM clientes c
    WHERE r.email_cliente IS NOT NULL AND LOWER(c.email) = LOWER(r.email_cliente)
);

-- Actualizar clientes existentes con datos de reservas
UPDATE clientes c SET
    telefono = COALESCE(c.telefono, sub.telefono),
    total_reservas = c.total_reservas + sub.total_reservas,
    ultima_visita = GREATEST(c.ultima_visita, sub.ultima_visita),
    updated_at = NOW()
FROM (
    SELECT DISTINCT ON (LOWER(email_cliente))
        email_cliente,
        telefono_cliente as telefono,
        COUNT(*) OVER (PARTITION BY LOWER(email_cliente)) as total_reservas,
        MAX(fecha) OVER (PARTITION BY LOWER(email_cliente)) as ultima_visita
    FROM reservas
    WHERE email_cliente IS NOT NULL
) sub
WHERE LOWER(c.email) = LOWER(sub.email_cliente);

-- =====================================================
-- PASO 2: Migrar clientes desde pedidos (via perfiles)
-- =====================================================
-- Los pedidos no tienen email directo, hay que obtenerlo via usuario_id -> perfiles
-- Primero insertamos clientes nuevos (que no existen por email)
INSERT INTO clientes (nombre, email, telefono, origen, total_pedidos, total_gastado, ultima_compra, created_at)
SELECT DISTINCT ON (LOWER(pf.email))
    COALESCE(p.nombre_envio, pf.nombre, 'Cliente') as nombre,
    pf.email as email,
    COALESCE(p.telefono_envio, pf.telefono) as telefono,
    'pedido'::origen_cliente as origen,
    COUNT(*) OVER (PARTITION BY LOWER(pf.email)) as total_pedidos,
    SUM(p.total) OVER (PARTITION BY LOWER(pf.email)) as total_gastado,
    (MAX(p.created_at) OVER (PARTITION BY LOWER(pf.email)))::DATE as ultima_compra,
    MIN(p.created_at) OVER (PARTITION BY LOWER(pf.email)) as created_at
FROM pedidos p
JOIN perfiles pf ON p.usuario_id = pf.id
WHERE p.usuario_id IS NOT NULL AND p.estado != 'cancelado'
AND NOT EXISTS (
    SELECT 1 FROM clientes c WHERE LOWER(c.email) = LOWER(pf.email)
);

-- Actualizar clientes existentes con datos de pedidos
UPDATE clientes c SET
    total_pedidos = c.total_pedidos + sub.total_pedidos,
    total_gastado = c.total_gastado + sub.total_gastado,
    ultima_compra = GREATEST(c.ultima_compra, sub.ultima_compra),
    updated_at = NOW()
FROM (
    SELECT DISTINCT ON (LOWER(pf.email))
        pf.email,
        COUNT(*) OVER (PARTITION BY LOWER(pf.email)) as total_pedidos,
        SUM(p.total) OVER (PARTITION BY LOWER(pf.email)) as total_gastado,
        (MAX(p.created_at) OVER (PARTITION BY LOWER(pf.email)))::DATE as ultima_compra
    FROM pedidos p
    JOIN perfiles pf ON p.usuario_id = pf.id
    WHERE p.usuario_id IS NOT NULL AND p.estado != 'cancelado'
) sub
WHERE LOWER(c.email) = LOWER(sub.email);

-- =====================================================
-- PASO 3: Vincular usuarios registrados con clientes
-- =====================================================
UPDATE clientes c SET
    usuario_id = p.id,
    nombre = COALESCE(p.nombre, c.nombre)
FROM perfiles p
WHERE LOWER(c.email) = LOWER(p.email)
AND c.usuario_id IS NULL;

-- =====================================================
-- PASO 4: Crear links de reservas a clientes
-- =====================================================
INSERT INTO cliente_reservas_link (cliente_id, reserva_id, vinculado_automaticamente)
SELECT DISTINCT
    c.id as cliente_id,
    r.id as reserva_id,
    true as vinculado_automaticamente
FROM reservas r
JOIN clientes c ON (
    (r.email_cliente IS NOT NULL AND LOWER(r.email_cliente) = LOWER(c.email))
    OR
    (r.telefono_cliente IS NOT NULL AND r.telefono_cliente = c.telefono AND c.email IS NULL)
)
ON CONFLICT (cliente_id, reserva_id) DO NOTHING;

-- =====================================================
-- PASO 5: Crear links de pedidos a clientes (via perfiles)
-- =====================================================
INSERT INTO cliente_pedidos_link (cliente_id, pedido_id, vinculado_automaticamente)
SELECT DISTINCT
    c.id as cliente_id,
    p.id as pedido_id,
    true as vinculado_automaticamente
FROM pedidos p
JOIN perfiles pf ON p.usuario_id = pf.id
JOIN clientes c ON LOWER(pf.email) = LOWER(c.email)
WHERE p.usuario_id IS NOT NULL
ON CONFLICT (cliente_id, pedido_id) DO NOTHING;

-- =====================================================
-- PASO 6: Recalcular estadísticas de todos los clientes
-- =====================================================
DO $$
DECLARE
    cliente_record RECORD;
BEGIN
    FOR cliente_record IN SELECT id FROM clientes LOOP
        PERFORM actualizar_stats_cliente(cliente_record.id);
    END LOOP;
END $$;

-- =====================================================
-- Verificación de la migración
-- =====================================================
SELECT
    'Clientes totales' as metrica,
    COUNT(*) as valor
FROM clientes
UNION ALL
SELECT
    'Clientes con email',
    COUNT(*) FILTER (WHERE email IS NOT NULL)
FROM clientes
UNION ALL
SELECT
    'Clientes con teléfono',
    COUNT(*) FILTER (WHERE telefono IS NOT NULL)
FROM clientes
UNION ALL
SELECT
    'Clientes con usuario vinculado',
    COUNT(*) FILTER (WHERE usuario_id IS NOT NULL)
FROM clientes
UNION ALL
SELECT
    'Reservas vinculadas',
    COUNT(*)
FROM cliente_reservas_link
UNION ALL
SELECT
    'Pedidos vinculados',
    COUNT(*)
FROM cliente_pedidos_link;
