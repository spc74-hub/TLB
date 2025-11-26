-- =====================================================
-- CRM Schema para The Lobby Beauty
-- Sistema de gestión de clientes y campañas de marketing
-- =====================================================

-- Enum para origen del cliente
CREATE TYPE origen_cliente AS ENUM ('web', 'tienda', 'importacion', 'manual', 'reserva', 'pedido');

-- Enum para estado de campaña
CREATE TYPE estado_campana AS ENUM ('borrador', 'programada', 'enviando', 'completada', 'cancelada');

-- Enum para canal de comunicación
CREATE TYPE canal_comunicacion AS ENUM ('email', 'whatsapp', 'ambos');

-- Enum para estado de envío
CREATE TYPE estado_envio AS ENUM ('pendiente', 'enviado', 'entregado', 'fallido', 'rebotado');

-- =====================================================
-- TABLA: clientes (Maestro de clientes)
-- =====================================================
CREATE TABLE IF NOT EXISTS clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Vinculación con usuario registrado (opcional)
    usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Datos de contacto
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),

    -- Marketing y consentimiento
    acepta_marketing BOOLEAN DEFAULT false,
    fecha_opt_in TIMESTAMPTZ,
    fecha_opt_out TIMESTAMPTZ,

    -- Origen y metadata
    origen origen_cliente DEFAULT 'manual',
    notas TEXT,
    etiquetas TEXT[], -- Tags para segmentación: ['vip', 'frecuente', 'nuevo']

    -- Estadísticas calculadas (se actualizan con triggers)
    total_reservas INTEGER DEFAULT 0,
    total_pedidos INTEGER DEFAULT 0,
    total_gastado DECIMAL(10,2) DEFAULT 0,
    ultima_visita DATE,
    ultima_compra DATE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Restricciones
    CONSTRAINT email_or_phone CHECK (email IS NOT NULL OR telefono IS NOT NULL)
);

-- Índices para búsqueda rápida
CREATE INDEX idx_clientes_email ON clientes(email);
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_clientes_usuario_id ON clientes(usuario_id);
CREATE INDEX idx_clientes_acepta_marketing ON clientes(acepta_marketing) WHERE acepta_marketing = true;
CREATE INDEX idx_clientes_etiquetas ON clientes USING GIN(etiquetas);

-- Índice único para evitar duplicados por email (case insensitive)
CREATE UNIQUE INDEX idx_clientes_email_unique ON clientes(LOWER(email)) WHERE email IS NOT NULL;

-- =====================================================
-- TABLA: campanas (Campañas de marketing)
-- =====================================================
CREATE TABLE IF NOT EXISTS campanas (
    id SERIAL PRIMARY KEY,

    -- Información de la campaña
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,

    -- Contenido del mensaje
    asunto VARCHAR(200), -- Para emails
    mensaje TEXT NOT NULL,
    mensaje_html TEXT, -- Versión HTML para emails

    -- Configuración
    canal canal_comunicacion DEFAULT 'email',
    estado estado_campana DEFAULT 'borrador',

    -- Segmentación (filtros JSON)
    -- Ejemplo: {"etiquetas": ["vip"], "min_compras": 2, "ultimo_mes": true}
    filtros_segmentacion JSONB DEFAULT '{}',

    -- Programación
    fecha_programada TIMESTAMPTZ,
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,

    -- Estadísticas
    total_destinatarios INTEGER DEFAULT 0,
    total_enviados INTEGER DEFAULT 0,
    total_entregados INTEGER DEFAULT 0,
    total_fallidos INTEGER DEFAULT 0,
    total_abiertos INTEGER DEFAULT 0, -- Solo email
    total_clicks INTEGER DEFAULT 0, -- Si hay links

    -- Metadata
    creado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLA: campana_envios (Historial de envíos)
-- =====================================================
CREATE TABLE IF NOT EXISTS campana_envios (
    id SERIAL PRIMARY KEY,

    campana_id INTEGER REFERENCES campanas(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,

    -- Estado del envío
    estado estado_envio DEFAULT 'pendiente',
    canal canal_comunicacion NOT NULL,

    -- Datos de envío
    destinatario VARCHAR(255) NOT NULL, -- Email o teléfono usado

    -- Tracking
    fecha_enviado TIMESTAMPTZ,
    fecha_entregado TIMESTAMPTZ,
    fecha_abierto TIMESTAMPTZ,
    fecha_click TIMESTAMPTZ,

    -- Error si falló
    error_mensaje TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Evitar envíos duplicados
    UNIQUE(campana_id, cliente_id, canal)
);

-- Índices para tracking
CREATE INDEX idx_campana_envios_campana ON campana_envios(campana_id);
CREATE INDEX idx_campana_envios_cliente ON campana_envios(cliente_id);
CREATE INDEX idx_campana_envios_estado ON campana_envios(estado);

-- =====================================================
-- TABLA: cliente_reservas_link (Para vincular reservas existentes)
-- =====================================================
-- Esta tabla permite vincular reservas antiguas con clientes
-- cuando se identifica que el email/teléfono corresponde a un cliente
CREATE TABLE IF NOT EXISTS cliente_reservas_link (
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    reserva_id INTEGER REFERENCES reservas(id) ON DELETE CASCADE,
    vinculado_automaticamente BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (cliente_id, reserva_id)
);

-- =====================================================
-- TABLA: cliente_pedidos_link (Para vincular pedidos existentes)
-- =====================================================
CREATE TABLE IF NOT EXISTS cliente_pedidos_link (
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
    vinculado_automaticamente BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (cliente_id, pedido_id)
);

-- =====================================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_clientes_updated_at
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campanas_updated_at
    BEFORE UPDATE ON campanas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCIÓN: Buscar o crear cliente por email/teléfono
-- =====================================================
CREATE OR REPLACE FUNCTION buscar_o_crear_cliente(
    p_nombre VARCHAR,
    p_email VARCHAR DEFAULT NULL,
    p_telefono VARCHAR DEFAULT NULL,
    p_origen origen_cliente DEFAULT 'manual',
    p_acepta_marketing BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    v_cliente_id UUID;
BEGIN
    -- Buscar por email primero
    IF p_email IS NOT NULL THEN
        SELECT id INTO v_cliente_id FROM clientes WHERE LOWER(email) = LOWER(p_email);
    END IF;

    -- Si no encontró por email, buscar por teléfono
    IF v_cliente_id IS NULL AND p_telefono IS NOT NULL THEN
        SELECT id INTO v_cliente_id FROM clientes WHERE telefono = p_telefono;
    END IF;

    -- Si no existe, crear nuevo
    IF v_cliente_id IS NULL THEN
        INSERT INTO clientes (nombre, email, telefono, origen, acepta_marketing, fecha_opt_in)
        VALUES (
            p_nombre,
            p_email,
            p_telefono,
            p_origen,
            p_acepta_marketing,
            CASE WHEN p_acepta_marketing THEN NOW() ELSE NULL END
        )
        RETURNING id INTO v_cliente_id;
    ELSE
        -- Actualizar datos si el nombre está más completo
        UPDATE clientes SET
            nombre = CASE WHEN LENGTH(p_nombre) > LENGTH(nombre) THEN p_nombre ELSE nombre END,
            telefono = COALESCE(telefono, p_telefono),
            acepta_marketing = CASE WHEN p_acepta_marketing AND NOT acepta_marketing THEN true ELSE acepta_marketing END,
            fecha_opt_in = CASE WHEN p_acepta_marketing AND NOT acepta_marketing THEN NOW() ELSE fecha_opt_in END,
            updated_at = NOW()
        WHERE id = v_cliente_id;
    END IF;

    RETURN v_cliente_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Actualizar estadísticas de cliente
-- =====================================================
CREATE OR REPLACE FUNCTION actualizar_stats_cliente(p_cliente_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE clientes SET
        total_reservas = (
            SELECT COUNT(*) FROM cliente_reservas_link WHERE cliente_id = p_cliente_id
        ),
        total_pedidos = (
            SELECT COUNT(*) FROM cliente_pedidos_link WHERE cliente_id = p_cliente_id
        ),
        total_gastado = COALESCE((
            SELECT SUM(p.total)
            FROM pedidos p
            JOIN cliente_pedidos_link cpl ON p.id = cpl.pedido_id
            WHERE cpl.cliente_id = p_cliente_id AND p.estado != 'cancelado'
        ), 0),
        ultima_visita = (
            SELECT MAX(r.fecha)
            FROM reservas r
            JOIN cliente_reservas_link crl ON r.id = crl.reserva_id
            WHERE crl.cliente_id = p_cliente_id AND r.estado = 'completada'
        ),
        ultima_compra = (
            SELECT MAX(p.created_at)::DATE
            FROM pedidos p
            JOIN cliente_pedidos_link cpl ON p.id = cpl.pedido_id
            WHERE cpl.cliente_id = p_cliente_id AND p.estado = 'entregado'
        ),
        updated_at = NOW()
    WHERE id = p_cliente_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE campana_envios ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_reservas_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_pedidos_link ENABLE ROW LEVEL SECURITY;

-- Políticas para clientes (solo admin)
CREATE POLICY "Admin puede ver todos los clientes"
    ON clientes FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Admin puede crear clientes"
    ON clientes FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Admin puede actualizar clientes"
    ON clientes FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Admin puede eliminar clientes"
    ON clientes FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas para campañas (solo admin)
CREATE POLICY "Admin puede gestionar campañas"
    ON campanas FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas para envíos (solo admin)
CREATE POLICY "Admin puede gestionar envíos"
    ON campana_envios FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- Políticas para links (solo admin)
CREATE POLICY "Admin puede gestionar links reservas"
    ON cliente_reservas_link FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

CREATE POLICY "Admin puede gestionar links pedidos"
    ON cliente_pedidos_link FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE clientes IS 'Maestro de clientes unificado para CRM y marketing';
COMMENT ON TABLE campanas IS 'Campañas de marketing por email o WhatsApp';
COMMENT ON TABLE campana_envios IS 'Historial y tracking de envíos de campañas';
COMMENT ON COLUMN clientes.etiquetas IS 'Array de tags para segmentación: vip, frecuente, nuevo, etc.';
COMMENT ON COLUMN campanas.filtros_segmentacion IS 'Filtros JSON para segmentar destinatarios';
