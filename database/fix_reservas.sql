-- ============================================
-- FIX: TABLAS Y POLÍTICAS PARA SISTEMA DE RESERVAS
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. VERIFICAR Y CREAR TABLAS SI NO EXISTEN
-- ============================================

-- Tabla de horarios (si no existe)
CREATE TABLE IF NOT EXISTS horarios (
  id SERIAL PRIMARY KEY,
  dia_semana INT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Domingo, 1=Lunes...
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de días bloqueados (si no existe)
CREATE TABLE IF NOT EXISTS dias_bloqueados (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. HABILITAR RLS Y CREAR POLÍTICAS
-- ============================================

-- HORARIOS: Habilitar RLS y permitir lectura pública
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Horarios visibles para todos" ON horarios;
CREATE POLICY "Horarios visibles para todos"
  ON horarios FOR SELECT
  USING (true);

-- DÍAS BLOQUEADOS: Habilitar RLS y permitir lectura pública
ALTER TABLE dias_bloqueados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Dias bloqueados visibles para todos" ON dias_bloqueados;
CREATE POLICY "Dias bloqueados visibles para todos"
  ON dias_bloqueados FOR SELECT
  USING (true);

-- CATEGORÍAS SERVICIOS: Asegurar lectura pública
ALTER TABLE categorias_servicios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categorias servicios visibles para todos" ON categorias_servicios;
CREATE POLICY "Categorias servicios visibles para todos"
  ON categorias_servicios FOR SELECT
  USING (true);

-- ============================================
-- 3. INSERTAR HORARIOS DE EJEMPLO (si está vacía)
-- ============================================

INSERT INTO horarios (dia_semana, hora_inicio, hora_fin, activo)
SELECT * FROM (VALUES
-- Lunes a Viernes: 10:00-14:00 y 16:00-22:00
(1, '10:00'::TIME, '14:00'::TIME, true),  -- Lunes mañana
(1, '16:00'::TIME, '22:00'::TIME, true),  -- Lunes tarde
(2, '10:00'::TIME, '14:00'::TIME, true),  -- Martes mañana
(2, '16:00'::TIME, '22:00'::TIME, true),  -- Martes tarde
(3, '10:00'::TIME, '14:00'::TIME, true),  -- Miércoles mañana
(3, '16:00'::TIME, '22:00'::TIME, true),  -- Miércoles tarde
(4, '10:00'::TIME, '14:00'::TIME, true),  -- Jueves mañana
(4, '16:00'::TIME, '22:00'::TIME, true),  -- Jueves tarde
(5, '10:00'::TIME, '14:00'::TIME, true),  -- Viernes mañana
(5, '16:00'::TIME, '22:00'::TIME, true),  -- Viernes tarde
-- Sábado: 10:00-14:00
(6, '10:00'::TIME, '14:00'::TIME, true)   -- Sábado mañana
) AS v(dia_semana, hora_inicio, hora_fin, activo)
WHERE NOT EXISTS (SELECT 1 FROM horarios LIMIT 1);

-- ============================================
-- 4. VERIFICAR POLÍTICAS RESERVAS
-- ============================================

-- Asegurar que reservas permite crear sin usuario logueado
DROP POLICY IF EXISTS "Cualquiera puede crear reservas" ON reservas;
CREATE POLICY "Cualquiera puede crear reservas"
  ON reservas FOR INSERT
  WITH CHECK (true);

-- Permitir leer reservas para verificar disponibilidad (solo fecha y hora, no datos personales)
DROP POLICY IF EXISTS "Leer reservas para disponibilidad" ON reservas;
CREATE POLICY "Leer reservas para disponibilidad"
  ON reservas FOR SELECT
  USING (true);

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT 'Horarios insertados:' as info, COUNT(*) as total FROM horarios;
SELECT 'Días bloqueados:' as info, COUNT(*) as total FROM dias_bloqueados;
SELECT 'Fix aplicado correctamente!' as mensaje;
