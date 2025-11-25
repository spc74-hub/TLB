-- ============================================
-- THE LOBBY BEAUTY - ESQUEMA DE AGENDA INTERNA
-- Ejecutar en Supabase SQL Editor DESPUÉS del esquema principal
-- ============================================

-- ============================================
-- TABLA: EMPLEADOS
-- ============================================

CREATE TABLE empleados (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  apellidos TEXT,
  email TEXT,
  telefono TEXT,
  color TEXT DEFAULT '#8B9D83', -- Color para identificar en agenda
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas
CREATE INDEX idx_empleados_activo ON empleados(activo);
CREATE INDEX idx_empleados_usuario ON empleados(usuario_id);

-- Trigger para updated_at
CREATE TRIGGER update_empleados_updated_at
  BEFORE UPDATE ON empleados
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MODIFICAR TABLA SERVICIOS: añadir campo es_interno
-- ============================================

ALTER TABLE servicios ADD COLUMN IF NOT EXISTS es_interno BOOLEAN DEFAULT false;

-- Comentario: es_interno = true significa que el servicio NO aparece en ecommerce
-- es_interno = false (default) significa que SÍ aparece públicamente

-- ============================================
-- MODIFICAR TABLA RESERVAS: añadir empleado_id
-- ============================================

-- Añadir columna empleado_id
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS empleado_id INT REFERENCES empleados(id) ON DELETE SET NULL;

-- Crear índice para búsquedas por empleado
CREATE INDEX IF NOT EXISTS idx_reservas_empleado ON reservas(empleado_id);

-- Modificar el constraint UNIQUE para permitir múltiples citas a la misma hora
-- si son de diferentes empleados
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_fecha_hora_servicio_id_key;
ALTER TABLE reservas ADD CONSTRAINT reservas_fecha_hora_empleado_key UNIQUE(fecha, hora, empleado_id);

-- ============================================
-- RLS PARA EMPLEADOS
-- ============================================

ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;

-- Admins pueden ver todos los empleados
CREATE POLICY "Admins pueden ver empleados"
  ON empleados FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol IN ('admin', 'profesional')
    )
  );

-- Solo admins pueden crear empleados
CREATE POLICY "Admins pueden crear empleados"
  ON empleados FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- Solo admins pueden modificar empleados
CREATE POLICY "Admins pueden modificar empleados"
  ON empleados FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- ============================================
-- ACTUALIZAR RLS DE RESERVAS PARA AGENDA INTERNA
-- ============================================

-- Eliminar políticas anteriores de reservas
DROP POLICY IF EXISTS "Usuarios pueden ver sus reservas" ON reservas;
DROP POLICY IF EXISTS "Usuarios pueden crear reservas" ON reservas;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus reservas" ON reservas;

-- Nuevas políticas para agenda interna

-- Admins pueden ver todas las reservas
CREATE POLICY "Admins pueden ver todas las reservas"
  ON reservas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- Profesionales pueden ver sus propias citas
CREATE POLICY "Profesionales pueden ver sus citas"
  ON reservas FOR SELECT
  USING (
    empleado_id IN (
      SELECT id FROM empleados WHERE usuario_id = auth.uid()
    )
  );

-- Clientes pueden ver sus propias reservas (si las tienen)
CREATE POLICY "Clientes pueden ver sus reservas"
  ON reservas FOR SELECT
  USING (usuario_id = auth.uid());

-- Solo admins y profesionales pueden crear citas
CREATE POLICY "Staff puede crear citas"
  ON reservas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol IN ('admin', 'profesional')
    )
  );

-- Admins pueden actualizar cualquier cita
CREATE POLICY "Admins pueden actualizar citas"
  ON reservas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- Profesionales pueden actualizar sus propias citas
CREATE POLICY "Profesionales pueden actualizar sus citas"
  ON reservas FOR UPDATE
  USING (
    empleado_id IN (
      SELECT id FROM empleados WHERE usuario_id = auth.uid()
    )
  );

-- Admins pueden eliminar citas
CREATE POLICY "Admins pueden eliminar citas"
  ON reservas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- ============================================
-- DATOS INICIALES: HORARIOS 10:00 - 22:00
-- ============================================

-- Eliminar horarios anteriores
DELETE FROM horarios;

-- Insertar horarios de 10:00 a 22:00 para todos los días
-- 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
INSERT INTO horarios (dia_semana, hora_inicio, hora_fin, activo) VALUES
(0, '10:00', '22:00', true), -- Domingo
(1, '10:00', '22:00', true), -- Lunes
(2, '10:00', '22:00', true), -- Martes
(3, '10:00', '22:00', true), -- Miércoles
(4, '10:00', '22:00', true), -- Jueves
(5, '10:00', '22:00', true), -- Viernes
(6, '10:00', '22:00', true); -- Sábado

-- ============================================
-- EMPLEADOS DE EJEMPLO
-- ============================================

INSERT INTO empleados (nombre, apellidos, email, telefono, color, activo) VALUES
('María', 'García López', 'maria@thelobbybeauty.com', '600111222', '#8B9D83', true),
('Laura', 'Martínez Ruiz', 'laura@thelobbybeauty.com', '600333444', '#C4A484', true),
('Ana', 'Fernández Soto', 'ana@thelobbybeauty.com', '600555666', '#D4A5A5', true);

-- ============================================
-- ACTUALIZAR SERVICIOS: marcar algunos como internos
-- ============================================

-- Por ejemplo, marcar servicios de retoque como internos
-- (Ejecutar después de tener servicios en la BD)
-- UPDATE servicios SET es_interno = true WHERE nombre ILIKE '%retoque%';

-- ============================================
-- FIN DEL ESQUEMA DE AGENDA
-- ============================================
