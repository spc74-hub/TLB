-- =====================================================
-- ESQUEMA ERP Y TESORERÍA - THE LOBBY BEAUTY
-- =====================================================
-- Fecha: 2025-11-27
-- Descripción: Módulos de Control de Gestión y Tesorería
-- =====================================================

-- =====================================================
-- PARTE 1: TIPOS ENUMERADOS (ENUMs)
-- =====================================================

-- Categorías predefinidas de gastos
CREATE TYPE categoria_gasto AS ENUM (
    'nominas',
    'alquiler',
    'suministros',
    'marketing',
    'productos',
    'formacion',
    'seguros',
    'impuestos',
    'mantenimiento',
    'otros'
);

-- Tipo de cuenta de caja
CREATE TYPE tipo_cuenta AS ENUM (
    'efectivo',
    'banco'
);

-- Tipo de movimiento
CREATE TYPE tipo_movimiento AS ENUM (
    'ingreso',
    'gasto'
);

-- Referencia del movimiento (origen)
CREATE TYPE referencia_movimiento AS ENUM (
    'pedido',
    'reserva',
    'gasto',
    'ajuste',
    'cierre',
    'transferencia'
);

-- Frecuencia de gastos recurrentes
CREATE TYPE frecuencia_recurrencia AS ENUM (
    'semanal',
    'quincenal',
    'mensual',
    'bimestral',
    'trimestral',
    'semestral',
    'anual'
);

-- =====================================================
-- PARTE 2: TABLAS DE CONTROL DE GESTIÓN (GASTOS)
-- =====================================================

-- Categorías de gastos personalizables
CREATE TABLE expense_categories (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria_base categoria_gasto NOT NULL DEFAULT 'otros',
    descripcion TEXT,
    color VARCHAR(7) DEFAULT '#6B7280', -- Color hex para UI
    icono VARCHAR(50) DEFAULT 'receipt', -- Nombre del icono Lucide
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas
CREATE INDEX idx_expense_categories_activo ON expense_categories(activo);
CREATE INDEX idx_expense_categories_categoria_base ON expense_categories(categoria_base);

-- Proveedores
CREATE TABLE vendors (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    nif_cif VARCHAR(20),
    email VARCHAR(255),
    telefono VARCHAR(20),
    direccion TEXT,
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(10),
    provincia VARCHAR(100),
    notas TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para proveedores
CREATE INDEX idx_vendors_activo ON vendors(activo);
CREATE INDEX idx_vendors_nombre ON vendors(nombre);

-- Gastos
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    categoria_id INTEGER REFERENCES expense_categories(id),
    vendor_id INTEGER REFERENCES vendors(id),
    concepto VARCHAR(500) NOT NULL,
    descripcion TEXT,
    importe DECIMAL(10,2) NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    numero_factura VARCHAR(100),
    archivo_url TEXT, -- URL del documento adjunto

    -- Campos de recurrencia
    es_recurrente BOOLEAN DEFAULT FALSE,
    frecuencia frecuencia_recurrencia,
    fecha_inicio_recurrencia DATE,
    fecha_fin_recurrencia DATE,
    gasto_padre_id INTEGER REFERENCES expenses(id), -- Para gastos generados automáticamente

    -- Campos de control
    pagado BOOLEAN DEFAULT FALSE,
    fecha_pago DATE,
    cuenta_pago_id INTEGER, -- FK a cash_accounts (se añade después)
    movimiento_id INTEGER, -- FK a cash_movements (se añade después)

    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para gastos
CREATE INDEX idx_expenses_fecha ON expenses(fecha);
CREATE INDEX idx_expenses_categoria ON expenses(categoria_id);
CREATE INDEX idx_expenses_vendor ON expenses(vendor_id);
CREATE INDEX idx_expenses_pagado ON expenses(pagado);
CREATE INDEX idx_expenses_es_recurrente ON expenses(es_recurrente);
CREATE INDEX idx_expenses_fecha_vencimiento ON expenses(fecha_vencimiento);

-- =====================================================
-- PARTE 3: TABLAS DE TESORERÍA
-- =====================================================

-- Cuentas de caja (efectivo y banco)
CREATE TABLE cash_accounts (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo tipo_cuenta NOT NULL,
    descripcion TEXT,
    balance_actual DECIMAL(12,2) DEFAULT 0.00,
    balance_inicial DECIMAL(12,2) DEFAULT 0.00,
    numero_cuenta VARCHAR(50), -- Para cuentas bancarias
    entidad_bancaria VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    es_principal BOOLEAN DEFAULT FALSE, -- Cuenta principal para ingresos automáticos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para cuentas
CREATE INDEX idx_cash_accounts_tipo ON cash_accounts(tipo);
CREATE INDEX idx_cash_accounts_activo ON cash_accounts(activo);

-- Añadir FK de expenses a cash_accounts
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_cuenta_pago
    FOREIGN KEY (cuenta_pago_id) REFERENCES cash_accounts(id);

-- Movimientos de caja
CREATE TABLE cash_movements (
    id SERIAL PRIMARY KEY,
    cuenta_id INTEGER NOT NULL REFERENCES cash_accounts(id),
    tipo tipo_movimiento NOT NULL,
    importe DECIMAL(12,2) NOT NULL,
    concepto VARCHAR(500) NOT NULL,
    descripcion TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Referencias al origen del movimiento
    referencia_tipo referencia_movimiento NOT NULL,
    pedido_id INTEGER REFERENCES pedidos(id),
    reserva_id INTEGER REFERENCES reservas(id),
    gasto_id INTEGER REFERENCES expenses(id),

    -- Para transferencias entre cuentas
    cuenta_destino_id INTEGER REFERENCES cash_accounts(id),
    movimiento_relacionado_id INTEGER REFERENCES cash_movements(id),

    -- Balance después del movimiento (para auditoría)
    balance_posterior DECIMAL(12,2),

    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para movimientos
CREATE INDEX idx_cash_movements_cuenta ON cash_movements(cuenta_id);
CREATE INDEX idx_cash_movements_fecha ON cash_movements(fecha);
CREATE INDEX idx_cash_movements_tipo ON cash_movements(tipo);
CREATE INDEX idx_cash_movements_referencia ON cash_movements(referencia_tipo);
CREATE INDEX idx_cash_movements_pedido ON cash_movements(pedido_id);
CREATE INDEX idx_cash_movements_reserva ON cash_movements(reserva_id);
CREATE INDEX idx_cash_movements_gasto ON cash_movements(gasto_id);

-- Añadir FK de expenses a cash_movements
ALTER TABLE expenses ADD CONSTRAINT fk_expenses_movimiento
    FOREIGN KEY (movimiento_id) REFERENCES cash_movements(id);

-- Cierres de caja diarios
CREATE TABLE cash_closings (
    id SERIAL PRIMARY KEY,
    cuenta_id INTEGER NOT NULL REFERENCES cash_accounts(id),
    fecha DATE NOT NULL,

    -- Balances
    balance_apertura DECIMAL(12,2) NOT NULL,
    balance_cierre_teorico DECIMAL(12,2) NOT NULL, -- Calculado por movimientos
    balance_cierre_real DECIMAL(12,2) NOT NULL, -- Contado físicamente
    diferencia DECIMAL(12,2) GENERATED ALWAYS AS (balance_cierre_real - balance_cierre_teorico) STORED,

    -- Desglose de movimientos del día
    total_ingresos DECIMAL(12,2) DEFAULT 0.00,
    total_gastos DECIMAL(12,2) DEFAULT 0.00,
    num_operaciones INTEGER DEFAULT 0,

    -- Desglose por tipo (JSON para flexibilidad)
    desglose_ingresos JSONB, -- {"pedidos": 150.00, "reservas": 200.00, "otros": 50.00}
    desglose_gastos JSONB,   -- {"proveedores": 100.00, "nominas": 0, ...}

    -- Control
    cerrado_por UUID REFERENCES auth.users(id),
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Un cierre por cuenta por día
    UNIQUE(cuenta_id, fecha)
);

-- Índices para cierres
CREATE INDEX idx_cash_closings_cuenta ON cash_closings(cuenta_id);
CREATE INDEX idx_cash_closings_fecha ON cash_closings(fecha);

-- =====================================================
-- PARTE 4: TRIGGERS Y FUNCIONES
-- =====================================================

-- Función para actualizar balance de cuenta tras movimiento
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Actualizar balance según tipo de movimiento
        IF NEW.tipo = 'ingreso' THEN
            UPDATE cash_accounts
            SET balance_actual = balance_actual + NEW.importe,
                updated_at = NOW()
            WHERE id = NEW.cuenta_id;
        ELSE -- gasto
            UPDATE cash_accounts
            SET balance_actual = balance_actual - NEW.importe,
                updated_at = NOW()
            WHERE id = NEW.cuenta_id;
        END IF;

        -- Guardar balance posterior
        SELECT balance_actual INTO NEW.balance_posterior
        FROM cash_accounts WHERE id = NEW.cuenta_id;

    ELSIF TG_OP = 'DELETE' THEN
        -- Revertir el movimiento
        IF OLD.tipo = 'ingreso' THEN
            UPDATE cash_accounts
            SET balance_actual = balance_actual - OLD.importe,
                updated_at = NOW()
            WHERE id = OLD.cuenta_id;
        ELSE
            UPDATE cash_accounts
            SET balance_actual = balance_actual + OLD.importe,
                updated_at = NOW()
            WHERE id = OLD.cuenta_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar balance
CREATE TRIGGER trigger_update_account_balance
    BEFORE INSERT OR DELETE ON cash_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance();

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_expense_categories_updated_at
    BEFORE UPDATE ON expense_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_accounts_updated_at
    BEFORE UPDATE ON cash_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PARTE 5: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_closings ENABLE ROW LEVEL SECURITY;

-- Políticas para expense_categories (solo admin)
CREATE POLICY "Admin puede ver categorías de gastos"
    ON expense_categories FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

CREATE POLICY "Admin puede gestionar categorías de gastos"
    ON expense_categories FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

-- Políticas para vendors (solo admin)
CREATE POLICY "Admin puede ver proveedores"
    ON vendors FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

CREATE POLICY "Admin puede gestionar proveedores"
    ON vendors FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

-- Políticas para expenses (solo admin)
CREATE POLICY "Admin puede ver gastos"
    ON expenses FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

CREATE POLICY "Admin puede gestionar gastos"
    ON expenses FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

-- Políticas para cash_accounts (solo admin)
CREATE POLICY "Admin puede ver cuentas de caja"
    ON cash_accounts FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

CREATE POLICY "Admin puede gestionar cuentas de caja"
    ON cash_accounts FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

-- Políticas para cash_movements (solo admin)
CREATE POLICY "Admin puede ver movimientos de caja"
    ON cash_movements FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

CREATE POLICY "Admin puede gestionar movimientos de caja"
    ON cash_movements FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

-- Políticas para cash_closings (solo admin)
CREATE POLICY "Admin puede ver cierres de caja"
    ON cash_closings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

CREATE POLICY "Admin puede gestionar cierres de caja"
    ON cash_closings FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE perfiles.id = auth.uid()
            AND perfiles.rol = 'admin'
        )
    );

-- =====================================================
-- PARTE 6: DATOS INICIALES
-- =====================================================

-- Categorías de gastos por defecto
INSERT INTO expense_categories (nombre, categoria_base, descripcion, color, icono) VALUES
('Nóminas y Seguridad Social', 'nominas', 'Salarios, seguros sociales, finiquitos', '#EF4444', 'users'),
('Alquiler Local', 'alquiler', 'Alquiler mensual del local', '#F59E0B', 'building'),
('Suministros', 'suministros', 'Luz, agua, gas, internet, teléfono', '#10B981', 'zap'),
('Marketing y Publicidad', 'marketing', 'Campañas, redes sociales, publicidad', '#8B5CF6', 'megaphone'),
('Productos y Materiales', 'productos', 'Compra de productos para servicios y venta', '#EC4899', 'package'),
('Formación', 'formacion', 'Cursos, talleres, certificaciones', '#06B6D4', 'graduation-cap'),
('Seguros', 'seguros', 'Seguro del local, RC, etc.', '#6366F1', 'shield'),
('Impuestos y Tasas', 'impuestos', 'IVA, IRPF, tasas municipales', '#DC2626', 'landmark'),
('Mantenimiento', 'mantenimiento', 'Reparaciones, limpieza, mantenimiento equipos', '#84CC16', 'wrench'),
('Otros Gastos', 'otros', 'Gastos varios no categorizados', '#6B7280', 'receipt');

-- Cuentas de caja por defecto
INSERT INTO cash_accounts (nombre, tipo, descripcion, balance_inicial, balance_actual, es_principal) VALUES
('Caja Efectivo', 'efectivo', 'Caja registradora del local', 200.00, 200.00, FALSE),
('Cuenta Banco Principal', 'banco', 'Cuenta corriente principal (Stripe)', 0.00, 0.00, TRUE);

-- =====================================================
-- PARTE 7: VISTAS ÚTILES
-- =====================================================

-- Vista de gastos con detalles
CREATE OR REPLACE VIEW v_expenses_detail AS
SELECT
    e.*,
    ec.nombre as categoria_nombre,
    ec.categoria_base,
    ec.color as categoria_color,
    ec.icono as categoria_icono,
    v.nombre as vendor_nombre,
    v.nif_cif as vendor_nif,
    ca.nombre as cuenta_nombre
FROM expenses e
LEFT JOIN expense_categories ec ON e.categoria_id = ec.id
LEFT JOIN vendors v ON e.vendor_id = v.id
LEFT JOIN cash_accounts ca ON e.cuenta_pago_id = ca.id;

-- Vista de movimientos con detalles
CREATE OR REPLACE VIEW v_cash_movements_detail AS
SELECT
    cm.*,
    ca.nombre as cuenta_nombre,
    ca.tipo as cuenta_tipo,
    cad.nombre as cuenta_destino_nombre,
    p.estado as pedido_estado,
    r.estado as reserva_estado
FROM cash_movements cm
JOIN cash_accounts ca ON cm.cuenta_id = ca.id
LEFT JOIN cash_accounts cad ON cm.cuenta_destino_id = cad.id
LEFT JOIN pedidos p ON cm.pedido_id = p.id
LEFT JOIN reservas r ON cm.reserva_id = r.id;

-- Vista resumen mensual de P&L
CREATE OR REPLACE VIEW v_pl_monthly AS
SELECT
    DATE_TRUNC('month', fecha) as mes,
    SUM(CASE WHEN tipo = 'ingreso' THEN importe ELSE 0 END) as total_ingresos,
    SUM(CASE WHEN tipo = 'gasto' THEN importe ELSE 0 END) as total_gastos,
    SUM(CASE WHEN tipo = 'ingreso' THEN importe ELSE -importe END) as resultado
FROM cash_movements
GROUP BY DATE_TRUNC('month', fecha)
ORDER BY mes DESC;

-- =====================================================
-- NOTAS DE IMPLEMENTACIÓN
-- =====================================================
--
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Los triggers actualizan automáticamente los balances
-- 3. Las políticas RLS restringen acceso solo a admins
-- 4. Para captura automática de ingresos de Stripe:
--    - Modificar el webhook de pagos para crear movimiento
-- 5. Para gastos recurrentes:
--    - Crear un cron job o función que genere gastos
--    - basados en la frecuencia configurada
--
