-- ============================================
-- FIX: POLÍTICAS RLS PARA AGENDA
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ============================================
-- HORARIOS: Habilitar RLS y permitir lectura pública
-- ============================================

-- Habilitar RLS (si no está habilitado)
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;

-- Permitir lectura pública de horarios
DROP POLICY IF EXISTS "Horarios visibles para todos" ON horarios;
CREATE POLICY "Horarios visibles para todos"
  ON horarios FOR SELECT
  USING (true);

-- ============================================
-- DÍAS BLOQUEADOS: Habilitar RLS y permitir lectura pública
-- ============================================

ALTER TABLE dias_bloqueados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dias bloqueados visibles para todos" ON dias_bloqueados;
CREATE POLICY "Dias bloqueados visibles para todos"
  ON dias_bloqueados FOR SELECT
  USING (true);

-- ============================================
-- CATEGORÍAS: Asegurar lectura pública
-- ============================================

-- Categorías de servicios
ALTER TABLE categorias_servicios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categorias servicios visibles para todos" ON categorias_servicios;
CREATE POLICY "Categorias servicios visibles para todos"
  ON categorias_servicios FOR SELECT
  USING (true);

-- Categorías de productos
ALTER TABLE categorias_productos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Categorias productos visibles para todos" ON categorias_productos;
CREATE POLICY "Categorias productos visibles para todos"
  ON categorias_productos FOR SELECT
  USING (true);

-- ============================================
-- VERIFICAR QUE EL USUARIO ES ADMIN
-- ============================================

-- Para verificar tu rol actual, ejecuta:
-- SELECT * FROM perfiles WHERE email = 'sergio.porcar@gmail.com';

-- Si el rol no es 'admin', actualízalo:
-- UPDATE perfiles SET rol = 'admin' WHERE email = 'sergio.porcar@gmail.com';

SELECT 'RLS policies updated successfully!' as message;
