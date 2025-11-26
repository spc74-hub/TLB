-- ============================================
-- CONFIGURACIÓN DE SUPABASE STORAGE
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Crear bucket para imágenes (público para lectura)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'imagenes',
  'imagenes',
  true,
  5242880, -- 5MB máximo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================
-- POLÍTICAS DE STORAGE
-- ============================================

-- Política: Cualquiera puede ver imágenes (público)
CREATE POLICY "Imagenes públicas para lectura"
ON storage.objects FOR SELECT
USING (bucket_id = 'imagenes');

-- Política: Solo usuarios autenticados con rol admin pueden subir
CREATE POLICY "Solo admin puede subir imagenes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'imagenes'
  AND EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
    AND rol = 'admin'
  )
);

-- Política: Solo admin puede actualizar imágenes
CREATE POLICY "Solo admin puede actualizar imagenes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'imagenes'
  AND EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
    AND rol = 'admin'
  )
);

-- Política: Solo admin puede eliminar imágenes
CREATE POLICY "Solo admin puede eliminar imagenes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'imagenes'
  AND EXISTS (
    SELECT 1 FROM public.perfiles
    WHERE id = auth.uid()
    AND rol = 'admin'
  )
);

-- ============================================
-- NOTA: Estructura de carpetas sugerida
-- ============================================
-- imagenes/
--   productos/
--     {producto_id}_{timestamp}.jpg
--   servicios/
--     {servicio_id}_{timestamp}.jpg
-- ============================================
