-- ============================================
-- RLS para gestión de productos por admin
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Admins pueden gestionar productos" ON productos;

-- Crear política para que admin pueda insertar, actualizar y eliminar productos
CREATE POLICY "Admins pueden gestionar productos"
  ON productos
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'
    )
  );
