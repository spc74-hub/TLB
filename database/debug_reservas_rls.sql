-- ============================================
-- DEBUG: Ver estado actual de RLS en reservas
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Ver todas las políticas actuales de reservas
SELECT
  policyname,
  cmd,
  qual as condicion_using,
  with_check
FROM pg_policies
WHERE tablename = 'reservas';

-- 2. Ver si RLS está habilitado
SELECT
  relname as tabla,
  relrowsecurity as rls_habilitado
FROM pg_class
WHERE relname = 'reservas';

-- 3. Ver cuántas reservas hay en total (como superuser)
SELECT COUNT(*) as total_reservas FROM reservas;

-- 4. Ver los datos de las reservas (incluye estado y empleado_id)
SELECT id, fecha, hora, estado, empleado_id, servicio_id, usuario_id, nombre_cliente
FROM reservas
ORDER BY created_at DESC
LIMIT 10;

-- 5. Ver el perfil del usuario admin actual
SELECT id, email, rol FROM perfiles WHERE email = 'sergio.porcar@gmail.com';

-- ============================================
-- FIX TEMPORAL: Política que permite lectura a TODOS los autenticados
-- (solo para debug - remover después)
-- ============================================

-- Primero eliminar todas las políticas SELECT existentes
DROP POLICY IF EXISTS "Admins ven todas las reservas" ON reservas;
DROP POLICY IF EXISTS "Profesionales ven sus citas" ON reservas;
DROP POLICY IF EXISTS "Clientes ven sus reservas" ON reservas;
DROP POLICY IF EXISTS "Admins pueden ver todas las reservas" ON reservas;
DROP POLICY IF EXISTS "Profesionales pueden ver sus citas" ON reservas;
DROP POLICY IF EXISTS "Clientes pueden ver sus reservas" ON reservas;

-- Crear UNA política permisiva temporal para debug
CREATE POLICY "Debug: todos autenticados pueden ver reservas"
  ON reservas FOR SELECT
  TO authenticated
  USING (true);

SELECT 'Política debug creada - todos los usuarios autenticados pueden ver todas las reservas' as mensaje;
