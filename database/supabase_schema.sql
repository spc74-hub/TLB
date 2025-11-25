-- ============================================
-- THE LOBBY BEAUTY - ESQUEMA DE BASE DE DATOS
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TIPOS ENUM
-- ============================================

CREATE TYPE categoria_servicio AS ENUM (
  'manicura', 'pedicura', 'depilacion', 'cejas', 'pestanas'
);

CREATE TYPE categoria_producto AS ENUM (
  'manicura', 'pedicura', 'facial', 'corporal', 'cabello', 'accesorios', 'kits'
);

CREATE TYPE estado_reserva AS ENUM (
  'pendiente', 'confirmada', 'completada', 'cancelada'
);

CREATE TYPE estado_pedido AS ENUM (
  'pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado'
);

CREATE TYPE rol_usuario AS ENUM (
  'cliente', 'admin', 'profesional'
);

-- ============================================
-- TABLA: PERFILES DE USUARIO
-- ============================================

CREATE TABLE perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT,
  apellidos TEXT,
  telefono TEXT,
  rol rol_usuario DEFAULT 'cliente',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, nombre)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TABLA: CATEGORÍAS DE SERVICIOS
-- ============================================

CREATE TABLE categorias_servicios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  icono TEXT,
  orden INT DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: SERVICIOS
-- ============================================

CREATE TABLE servicios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria categoria_servicio NOT NULL,
  duracion_minutos INT NOT NULL DEFAULT 30,
  precio DECIMAL(10,2) NOT NULL,
  precio_oferta DECIMAL(10,2),
  es_libre_toxicos BOOLEAN DEFAULT true,
  imagen_url TEXT,
  activo BOOLEAN DEFAULT true,
  destacado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: CATEGORÍAS DE PRODUCTOS
-- ============================================

CREATE TABLE categorias_productos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  icono TEXT,
  imagen_url TEXT,
  orden INT DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: PRODUCTOS
-- ============================================

CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  descripcion_corta TEXT NOT NULL,
  categoria categoria_producto NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  precio_oferta DECIMAL(10,2),
  imagen_url TEXT,
  imagenes_extra TEXT[],
  stock INT DEFAULT 0,
  es_natural BOOLEAN DEFAULT true,
  es_vegano BOOLEAN DEFAULT false,
  es_cruelty_free BOOLEAN DEFAULT true,
  ingredientes TEXT[],
  modo_uso TEXT,
  activo BOOLEAN DEFAULT true,
  destacado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: RESERVAS
-- ============================================

CREATE TABLE reservas (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  servicio_id INT REFERENCES servicios(id) ON DELETE SET NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado estado_reserva DEFAULT 'pendiente',
  notas TEXT,
  nombre_cliente TEXT,
  email_cliente TEXT,
  telefono_cliente TEXT,
  precio_total DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(fecha, hora, servicio_id)
);

-- ============================================
-- TABLA: DIRECCIONES
-- ============================================

CREATE TABLE direcciones (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  codigo_postal TEXT NOT NULL,
  provincia TEXT NOT NULL,
  pais TEXT DEFAULT 'España',
  telefono TEXT,
  es_principal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: PEDIDOS
-- ============================================

CREATE TABLE pedidos (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  direccion_id INT REFERENCES direcciones(id) ON DELETE SET NULL,
  estado estado_pedido DEFAULT 'pendiente',
  subtotal DECIMAL(10,2) NOT NULL,
  coste_envio DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  metodo_pago TEXT,
  stripe_payment_id TEXT,
  notas TEXT,
  nombre_envio TEXT,
  direccion_envio TEXT,
  ciudad_envio TEXT,
  cp_envio TEXT,
  telefono_envio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: ITEMS DE PEDIDO
-- ============================================

CREATE TABLE pedido_items (
  id SERIAL PRIMARY KEY,
  pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id INT REFERENCES productos(id) ON DELETE SET NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10,2) NOT NULL,
  precio_total DECIMAL(10,2) NOT NULL,
  nombre_producto TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: HORARIOS DISPONIBLES
-- ============================================

CREATE TABLE horarios (
  id SERIAL PRIMARY KEY,
  dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 1=Lunes...
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: DÍAS BLOQUEADOS (festivos, vacaciones)
-- ============================================

CREATE TABLE dias_bloqueados (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_servicios_categoria ON servicios(categoria);
CREATE INDEX idx_servicios_activo ON servicios(activo);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_reservas_fecha ON reservas(fecha);
CREATE INDEX idx_reservas_usuario ON reservas(usuario_id);
CREATE INDEX idx_reservas_estado ON reservas(estado);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE direcciones ENABLE ROW LEVEL SECURITY;

-- Políticas para PERFILES
CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON perfiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON perfiles FOR UPDATE
  USING (auth.uid() = id);

-- Políticas para SERVICIOS (públicos para lectura)
CREATE POLICY "Servicios visibles para todos"
  ON servicios FOR SELECT
  USING (true);

-- Políticas para PRODUCTOS (públicos para lectura)
CREATE POLICY "Productos visibles para todos"
  ON productos FOR SELECT
  USING (true);

-- Políticas para RESERVAS
CREATE POLICY "Usuarios pueden ver sus reservas"
  ON reservas FOR SELECT
  USING (auth.uid() = usuario_id OR usuario_id IS NULL);

CREATE POLICY "Usuarios pueden crear reservas"
  ON reservas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden actualizar sus reservas"
  ON reservas FOR UPDATE
  USING (auth.uid() = usuario_id);

-- Políticas para PEDIDOS
CREATE POLICY "Usuarios pueden ver sus pedidos"
  ON pedidos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden crear pedidos"
  ON pedidos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Políticas para PEDIDO_ITEMS
CREATE POLICY "Usuarios pueden ver items de sus pedidos"
  ON pedido_items FOR SELECT
  USING (
    pedido_id IN (
      SELECT id FROM pedidos WHERE usuario_id = auth.uid()
    )
  );

-- Políticas para DIRECCIONES
CREATE POLICY "Usuarios pueden ver sus direcciones"
  ON direcciones FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden crear direcciones"
  ON direcciones FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden actualizar sus direcciones"
  ON direcciones FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden eliminar sus direcciones"
  ON direcciones FOR DELETE
  USING (auth.uid() = usuario_id);

-- ============================================
-- FUNCIÓN: Actualizar updated_at automáticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_perfiles_updated_at
  BEFORE UPDATE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servicios_updated_at
  BEFORE UPDATE ON servicios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservas_updated_at
  BEFORE UPDATE ON reservas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- FIN DEL ESQUEMA
-- ============================================
