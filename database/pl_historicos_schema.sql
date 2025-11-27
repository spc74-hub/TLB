-- =====================================================
-- ESQUEMA CUENTA DE RESULTADOS - DATOS HISTÓRICOS
-- =====================================================
-- Fecha: 2025-11-27
-- Descripción: Tablas para importar datos históricos de P&L
-- desde ERP externo y calcular comparativas
-- =====================================================

-- =====================================================
-- PARTE 1: TIPOS ENUMERADOS
-- =====================================================

-- Tipo de registro P&L
CREATE TYPE tipo_registro_pl AS ENUM (
    'ingreso',
    'gasto'
);

-- Origen de los datos
CREATE TYPE origen_datos_pl AS ENUM (
    'sistema',      -- Generado automáticamente desde cash_movements
    'importado',    -- Importado desde CSV
    'manual'        -- Ingresado manualmente
);

-- =====================================================
-- PARTE 2: TABLA DE CATEGORÍAS P&L (para mapeo)
-- =====================================================

-- Categorías para el P&L (mapea las categorías del ERP externo)
CREATE TABLE pl_categories (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,  -- Código del ERP externo
    nombre VARCHAR(200) NOT NULL,
    tipo tipo_registro_pl NOT NULL,
    categoria_padre_id INTEGER REFERENCES pl_categories(id),
    orden_display INTEGER DEFAULT 0,      -- Para ordenar en el dashboard
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_pl_categories_codigo ON pl_categories(codigo);
CREATE INDEX idx_pl_categories_tipo ON pl_categories(tipo);
CREATE INDEX idx_pl_categories_activo ON pl_categories(activo);

-- =====================================================
-- PARTE 3: TABLA DE DATOS HISTÓRICOS
-- =====================================================

-- Registros históricos de P&L por mes
CREATE TABLE pl_historicos (
    id SERIAL PRIMARY KEY,

    -- Período
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),

    -- Categorización
    categoria_id INTEGER REFERENCES pl_categories(id),
    categoria_codigo VARCHAR(50),  -- Código directo si no existe en pl_categories
    categoria_nombre VARCHAR(200), -- Nombre directo si no existe en pl_categories

    -- Datos
    tipo tipo_registro_pl NOT NULL,
    importe DECIMAL(12,2) NOT NULL,
    concepto VARCHAR(500),

    -- Metadata de importación
    origen origen_datos_pl NOT NULL DEFAULT 'importado',
    lote_importacion UUID,  -- Para agrupar importaciones
    archivo_origen VARCHAR(255),
    linea_archivo INTEGER,

    -- Auditoría
    importado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Índice único para evitar duplicados
    UNIQUE(anio, mes, categoria_codigo, tipo, concepto)
);

-- Índices para rendimiento
CREATE INDEX idx_pl_historicos_periodo ON pl_historicos(anio, mes);
CREATE INDEX idx_pl_historicos_tipo ON pl_historicos(tipo);
CREATE INDEX idx_pl_historicos_categoria ON pl_historicos(categoria_id);
CREATE INDEX idx_pl_historicos_origen ON pl_historicos(origen);
CREATE INDEX idx_pl_historicos_lote ON pl_historicos(lote_importacion);

-- =====================================================
-- PARTE 4: TABLA DE IMPORTACIONES
-- =====================================================

-- Registro de importaciones realizadas
CREATE TABLE pl_importaciones (
    id SERIAL PRIMARY KEY,
    lote_id UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    nombre_archivo VARCHAR(255) NOT NULL,
    fecha_importacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Estadísticas
    registros_totales INTEGER DEFAULT 0,
    registros_importados INTEGER DEFAULT 0,
    registros_error INTEGER DEFAULT 0,

    -- Período cubierto
    anio_desde INTEGER,
    anio_hasta INTEGER,
    mes_desde INTEGER,
    mes_hasta INTEGER,

    -- Totales importados
    total_ingresos DECIMAL(14,2) DEFAULT 0,
    total_gastos DECIMAL(14,2) DEFAULT 0,

    -- Errores
    errores JSONB,  -- Array de errores: [{linea: 5, error: "..."}]

    -- Auditoría
    importado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_pl_importaciones_fecha ON pl_importaciones(fecha_importacion);
CREATE INDEX idx_pl_importaciones_lote ON pl_importaciones(lote_id);

-- =====================================================
-- PARTE 5: TRIGGERS
-- =====================================================

-- Trigger para updated_at en pl_categories
CREATE TRIGGER update_pl_categories_updated_at
    BEFORE UPDATE ON pl_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PARTE 6: ROW LEVEL SECURITY
-- =====================================================

-- Habilitar RLS
ALTER TABLE pl_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE pl_historicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pl_importaciones ENABLE ROW LEVEL SECURITY;

-- Políticas para pl_categories (solo admin)
CREATE POLICY "Admin puede ver categorías PL"
    ON pl_categories FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

CREATE POLICY "Admin puede gestionar categorías PL"
    ON pl_categories FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

-- Políticas para pl_historicos (solo admin)
CREATE POLICY "Admin puede ver históricos PL"
    ON pl_historicos FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

CREATE POLICY "Admin puede gestionar históricos PL"
    ON pl_historicos FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

-- Políticas para pl_importaciones (solo admin)
CREATE POLICY "Admin puede ver importaciones PL"
    ON pl_importaciones FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

CREATE POLICY "Admin puede gestionar importaciones PL"
    ON pl_importaciones FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

-- =====================================================
-- PARTE 7: CATEGORÍAS P&L POR DEFECTO
-- =====================================================

-- Categorías de ingresos
INSERT INTO pl_categories (codigo, nombre, tipo, orden_display) VALUES
('ING_SERVICIOS', 'Ingresos por Servicios', 'ingreso', 10),
('ING_PRODUCTOS', 'Venta de Productos', 'ingreso', 20),
('ING_RESERVAS', 'Ingresos por Reservas', 'ingreso', 30),
('ING_OTROS', 'Otros Ingresos', 'ingreso', 90);

-- Categorías de gastos (mapeadas a las del ERP)
INSERT INTO pl_categories (codigo, nombre, tipo, orden_display) VALUES
('GAST_NOMINAS', 'Nóminas y SS', 'gasto', 100),
('GAST_ALQUILER', 'Alquiler', 'gasto', 110),
('GAST_SUMINISTROS', 'Suministros', 'gasto', 120),
('GAST_MARKETING', 'Marketing y Publicidad', 'gasto', 130),
('GAST_PRODUCTOS', 'Compra de Productos', 'gasto', 140),
('GAST_FORMACION', 'Formación', 'gasto', 150),
('GAST_SEGUROS', 'Seguros', 'gasto', 160),
('GAST_IMPUESTOS', 'Impuestos y Tasas', 'gasto', 170),
('GAST_MANTENIMIENTO', 'Mantenimiento', 'gasto', 180),
('GAST_OTROS', 'Otros Gastos', 'gasto', 190);

-- =====================================================
-- PARTE 8: VISTAS PARA DASHBOARD
-- =====================================================

-- Vista resumen mensual combinando datos actuales e históricos
CREATE OR REPLACE VIEW v_pl_resumen_mensual AS
WITH datos_actuales AS (
    -- Datos del sistema actual (cash_movements)
    SELECT
        EXTRACT(YEAR FROM fecha)::INTEGER as anio,
        EXTRACT(MONTH FROM fecha)::INTEGER as mes,
        tipo::text as tipo,
        referencia_tipo::text as categoria,
        SUM(importe) as importe,
        'sistema' as origen
    FROM cash_movements
    GROUP BY
        EXTRACT(YEAR FROM fecha),
        EXTRACT(MONTH FROM fecha),
        tipo,
        referencia_tipo
),
datos_historicos AS (
    -- Datos importados
    SELECT
        anio,
        mes,
        tipo::text,
        COALESCE(categoria_codigo, 'OTROS') as categoria,
        SUM(importe) as importe,
        'importado' as origen
    FROM pl_historicos
    GROUP BY anio, mes, tipo, categoria_codigo
)
SELECT * FROM datos_actuales
UNION ALL
SELECT * FROM datos_historicos;

-- Vista de comparativa interanual
CREATE OR REPLACE VIEW v_pl_comparativa_anual AS
SELECT
    mes,
    anio,
    SUM(CASE WHEN tipo = 'ingreso' THEN importe ELSE 0 END) as ingresos,
    SUM(CASE WHEN tipo = 'gasto' THEN importe ELSE 0 END) as gastos,
    SUM(CASE WHEN tipo = 'ingreso' THEN importe ELSE -importe END) as resultado
FROM v_pl_resumen_mensual
GROUP BY anio, mes
ORDER BY anio DESC, mes DESC;

-- Vista de desglose por categoría
CREATE OR REPLACE VIEW v_pl_por_categoria AS
SELECT
    anio,
    mes,
    tipo,
    categoria,
    SUM(importe) as importe
FROM v_pl_resumen_mensual
GROUP BY anio, mes, tipo, categoria
ORDER BY anio DESC, mes DESC, tipo, importe DESC;

-- =====================================================
-- PARTE 9: FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener resumen de un período
CREATE OR REPLACE FUNCTION get_pl_periodo(
    p_anio INTEGER,
    p_mes INTEGER DEFAULT NULL
)
RETURNS TABLE (
    total_ingresos DECIMAL(14,2),
    total_gastos DECIMAL(14,2),
    resultado DECIMAL(14,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN importe ELSE 0 END), 0)::DECIMAL(14,2),
        COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN importe ELSE 0 END), 0)::DECIMAL(14,2),
        COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN importe ELSE -importe END), 0)::DECIMAL(14,2)
    FROM v_pl_resumen_mensual
    WHERE anio = p_anio
    AND (p_mes IS NULL OR mes = p_mes);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para comparar dos períodos
CREATE OR REPLACE FUNCTION get_pl_comparativa(
    p_anio_actual INTEGER,
    p_mes_actual INTEGER,
    p_anio_anterior INTEGER,
    p_mes_anterior INTEGER
)
RETURNS TABLE (
    periodo TEXT,
    ingresos DECIMAL(14,2),
    gastos DECIMAL(14,2),
    resultado DECIMAL(14,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        'actual'::TEXT,
        COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN importe ELSE 0 END), 0)::DECIMAL(14,2),
        COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN importe ELSE 0 END), 0)::DECIMAL(14,2),
        COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN importe ELSE -importe END), 0)::DECIMAL(14,2)
    FROM v_pl_resumen_mensual
    WHERE anio = p_anio_actual AND mes = p_mes_actual

    UNION ALL

    SELECT
        'anterior'::TEXT,
        COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN importe ELSE 0 END), 0)::DECIMAL(14,2),
        COALESCE(SUM(CASE WHEN tipo = 'gasto' THEN importe ELSE 0 END), 0)::DECIMAL(14,2),
        COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN importe ELSE -importe END), 0)::DECIMAL(14,2)
    FROM v_pl_resumen_mensual
    WHERE anio = p_anio_anterior AND mes = p_mes_anterior;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- NOTAS DE USO
-- =====================================================
--
-- 1. Ejecutar este script DESPUÉS de erp_tesoreria_schema.sql
-- 2. Para importar datos históricos:
--    - Usar la plantilla CSV proporcionada
--    - El backend procesará el CSV y insertará en pl_historicos
-- 3. Las vistas combinan datos del sistema con históricos
-- 4. Las categorías pueden personalizarse según tu ERP
--
-- =====================================================
