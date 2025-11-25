-- ============================================
-- FIX: POLÍTICAS RLS PARA RESERVAS (AGENDA)
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Eliminar políticas anteriores
DROP POLICY IF EXISTS "Admins pueden ver todas las reservas" ON reservas;
DROP POLICY IF EXISTS "Profesionales pueden ver sus citas" ON reservas;
DROP POLICY IF EXISTS "Clientes pueden ver sus reservas" ON reservas;
DROP POLICY IF EXISTS "Staff puede crear citas" ON reservas;
DROP POLICY IF EXISTS "Admins pueden actualizar citas" ON reservas;
DROP POLICY IF EXISTS "Profesionales pueden actualizar sus citas" ON reservas;
DROP POLICY IF EXISTS "Admins pueden eliminar citas" ON reservas;

-- ============================================
-- NUEVA POLÍTICA: Lectura para usuarios autenticados con rol admin
-- ============================================

-- Admins pueden ver TODAS las reservas
CREATE POLICY "Admins ven todas las reservas"
  ON reservas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- Profesionales pueden ver sus propias citas
CREATE POLICY "Profesionales ven sus citas"
  ON reservas FOR SELECT
  TO authenticated
  USING (
    empleado_id IN (
      SELECT id FROM empleados WHERE usuario_id = auth.uid()
    )
  );

-- Clientes pueden ver sus propias reservas
CREATE POLICY "Clientes ven sus reservas"
  ON reservas FOR SELECT
  TO authenticated
  USING (usuario_id = auth.uid());

-- ============================================
-- POLÍTICAS DE INSERT
-- ============================================

-- Admins y profesionales pueden crear citas
CREATE POLICY "Staff crea citas"
  ON reservas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol IN ('admin', 'profesional')
    )
  );

-- ============================================
-- POLÍTICAS DE UPDATE
-- ============================================

-- Admins pueden actualizar cualquier cita
CREATE POLICY "Admins actualizan citas"
  ON reservas FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- Profesionales pueden actualizar sus propias citas
CREATE POLICY "Profesionales actualizan sus citas"
  ON reservas FOR UPDATE
  TO authenticated
  USING (
    empleado_id IN (
      SELECT id FROM empleados WHERE usuario_id = auth.uid()
    )
  );

-- ============================================
-- POLÍTICAS DE DELETE
-- ============================================

-- Solo admins pueden eliminar citas
CREATE POLICY "Admins eliminan citas"
  ON reservas FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT 'RLS policies for reservas updated!' as message;

-- Para ver las políticas actuales:
-- SELECT * FROM pg_policies WHERE tablename = 'reservas';
