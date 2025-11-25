-- ============================================
-- Añadir campo es_interno a la tabla servicios
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Añadir columna es_interno (servicios que solo aparecen en la agenda interna)
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS es_interno BOOLEAN DEFAULT false;

-- Comentario explicativo
COMMENT ON COLUMN servicios.es_interno IS 'Si es true, el servicio solo aparece en la agenda interna y no en la web pública';

-- Actualizar políticas RLS para que admin pueda gestionar servicios
-- Primero eliminar la política existente si existe
DROP POLICY IF EXISTS "Admins pueden gestionar servicios" ON servicios;

-- Crear política para que admin pueda insertar, actualizar y eliminar
CREATE POLICY "Admins pueden gestionar servicios"
  ON servicios
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
