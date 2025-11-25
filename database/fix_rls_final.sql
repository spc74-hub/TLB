-- ============================================
-- FIX FINAL: POLÍTICAS RLS PARA RESERVAS
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Eliminar TODAS las políticas existentes de reservas
DROP POLICY IF EXISTS "Debug: todos autenticados pueden ver reservas" ON reservas;
DROP POLICY IF EXISTS "Staff crea citas" ON reservas;
DROP POLICY IF EXISTS "Admins actualizan citas" ON reservas;
DROP POLICY IF EXISTS "Profesionales actualizan sus citas" ON reservas;
DROP POLICY IF EXISTS "Admins eliminan citas" ON reservas;
DROP POLICY IF EXISTS "Admins ven todas las reservas" ON reservas;
DROP POLICY IF EXISTS "Profesionales ven sus citas" ON reservas;
DROP POLICY IF EXISTS "Clientes ven sus reservas" ON reservas;

-- ============================================
-- POLÍTICAS SELECT (lectura)
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
-- POLÍTICAS INSERT (crear)
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
-- POLÍTICAS UPDATE (actualizar)
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
-- POLÍTICAS DELETE (eliminar)
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

SELECT 'Políticas RLS finales aplicadas correctamente!' as mensaje;

-- Para verificar las políticas creadas:
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'reservas';
