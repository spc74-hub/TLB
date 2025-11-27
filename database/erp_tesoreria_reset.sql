-- =====================================================
-- RESET Y RECREACIÓN - ERP Y TESORERÍA
-- =====================================================
-- Ejecutar este script para eliminar y recrear todo
-- =====================================================

-- Eliminar vistas
DROP VIEW IF EXISTS v_pl_monthly CASCADE;
DROP VIEW IF EXISTS v_cash_movements_detail CASCADE;
DROP VIEW IF EXISTS v_expenses_detail CASCADE;

-- Eliminar triggers
DROP TRIGGER IF EXISTS trigger_update_account_balance ON cash_movements;
DROP TRIGGER IF EXISTS update_expense_categories_updated_at ON expense_categories;
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
DROP TRIGGER IF EXISTS update_cash_accounts_updated_at ON cash_accounts;

-- Eliminar funciones
DROP FUNCTION IF EXISTS update_account_balance() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Eliminar tablas (en orden por dependencias)
DROP TABLE IF EXISTS cash_closings CASCADE;
DROP TABLE IF EXISTS cash_movements CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS cash_accounts CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;

-- Eliminar tipos enumerados
DROP TYPE IF EXISTS frecuencia_recurrencia CASCADE;
DROP TYPE IF EXISTS referencia_movimiento CASCADE;
DROP TYPE IF EXISTS tipo_movimiento CASCADE;
DROP TYPE IF EXISTS tipo_cuenta CASCADE;
DROP TYPE IF EXISTS categoria_gasto CASCADE;

-- =====================================================
-- Ahora ejecuta erp_tesoreria_schema.sql
-- =====================================================
