-- ============================================
-- The Lobby Beauty - Esquema de Base de Datos
-- ============================================
-- Ejecutar este script en el SQL Editor de Supabase

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: categorias
-- ============================================
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    icono VARCHAR(50), -- Nombre del icono de Lucide
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar categorías iniciales
INSERT INTO categorias (nombre, slug, descripcion, icono) VALUES
    ('Manicura', 'manicura', 'Servicios profesionales de manicura con productos naturales', 'Hand'),
    ('Pedicura', 'pedicura', 'Servicios profesionales de pedicura con productos naturales', 'Footprints'),
    ('Depilación', 'depilacion', 'Depilación con ceras naturales y técnicas suaves', 'Sparkles'),
    ('Cejas', 'cejas', 'Diseño y cuidado de cejas con productos naturales', 'Eye'),
    ('Pestañas', 'pestanas', 'Extensiones y tratamientos de pestañas', 'Eye')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- TABLA: servicios
-- ============================================
CREATE TABLE IF NOT EXISTS servicios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('manicura', 'pedicura', 'depilacion', 'cejas', 'pestanas')),
    duracion_minutos INTEGER NOT NULL CHECK (duracion_minutos >= 15 AND duracion_minutos <= 240),
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    es_libre_toxicos BOOLEAN DEFAULT TRUE,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_servicios_categoria ON servicios(categoria);
CREATE INDEX IF NOT EXISTS idx_servicios_activo ON servicios(activo);
CREATE INDEX IF NOT EXISTS idx_servicios_libre_toxicos ON servicios(es_libre_toxicos);

-- ============================================
-- TABLA: usuarios (extendida de auth.users de Supabase)
-- ============================================
CREATE TABLE IF NOT EXISTS perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    rol VARCHAR(20) DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin', 'profesional')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TABLA: reservas
-- ============================================
CREATE TABLE IF NOT EXISTS reservas (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'confirmada', 'completada', 'cancelada')),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para reservas
CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas(fecha);
CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_reservas_estado ON reservas(estado);

-- Restricción única para evitar doble reserva en mismo horario
CREATE UNIQUE INDEX IF NOT EXISTS idx_reservas_unica
ON reservas(fecha, hora)
WHERE estado != 'cancelada';

-- ============================================
-- TABLA: resenas
-- ============================================
CREATE TABLE IF NOT EXISTS resenas (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
    servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    puntuacion INTEGER NOT NULL CHECK (puntuacion >= 1 AND puntuacion <= 5),
    comentario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para reseñas por servicio
CREATE INDEX IF NOT EXISTS idx_resenas_servicio ON resenas(servicio_id);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para servicios
DROP TRIGGER IF EXISTS update_servicios_updated_at ON servicios;
CREATE TRIGGER update_servicios_updated_at
    BEFORE UPDATE ON servicios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para reservas
DROP TRIGGER IF EXISTS update_reservas_updated_at ON reservas;
CREATE TRIGGER update_reservas_updated_at
    BEFORE UPDATE ON reservas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para perfiles
DROP TRIGGER IF EXISTS update_perfiles_updated_at ON perfiles;
CREATE TRIGGER update_perfiles_updated_at
    BEFORE UPDATE ON perfiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;

-- Políticas para servicios (lectura pública, escritura admin)
CREATE POLICY "Servicios visibles para todos"
    ON servicios FOR SELECT
    USING (true);

CREATE POLICY "Solo admins pueden modificar servicios"
    ON servicios FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

-- Políticas para reservas
CREATE POLICY "Usuarios ven sus propias reservas"
    ON reservas FOR SELECT
    USING (usuario_id = auth.uid());

CREATE POLICY "Usuarios pueden crear sus reservas"
    ON reservas FOR INSERT
    WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar sus reservas"
    ON reservas FOR UPDATE
    USING (usuario_id = auth.uid());

CREATE POLICY "Admins ven todas las reservas"
    ON reservas FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol IN ('admin', 'profesional')
        )
    );

-- Políticas para perfiles
CREATE POLICY "Usuarios ven su propio perfil"
    ON perfiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar su perfil"
    ON perfiles FOR UPDATE
    USING (id = auth.uid());

-- Políticas para reseñas
CREATE POLICY "Reseñas visibles para todos"
    ON resenas FOR SELECT
    USING (true);

CREATE POLICY "Usuarios pueden crear reseñas"
    ON resenas FOR INSERT
    WITH CHECK (usuario_id = auth.uid());

COMMENT ON TABLE servicios IS 'Catálogo de servicios de belleza - The Lobby Beauty';
COMMENT ON TABLE reservas IS 'Reservas de citas de clientes';
COMMENT ON TABLE perfiles IS 'Perfiles extendidos de usuarios';
COMMENT ON TABLE resenas IS 'Reseñas y valoraciones de servicios';
