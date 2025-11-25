-- ============================================
-- POLÍTICAS RLS PARA PEDIDOS
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- El backend usa service_role que bypasea RLS, pero necesitamos
-- políticas para que los usuarios puedan ver sus propios pedidos

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Usuarios pueden ver sus pedidos" ON pedidos;
DROP POLICY IF EXISTS "Usuarios pueden crear pedidos" ON pedidos;
DROP POLICY IF EXISTS "Admins pueden ver todos los pedidos" ON pedidos;
DROP POLICY IF EXISTS "Admins pueden actualizar pedidos" ON pedidos;
DROP POLICY IF EXISTS "Service role puede insertar pedidos" ON pedidos;

DROP POLICY IF EXISTS "Usuarios pueden ver items de sus pedidos" ON pedido_items;
DROP POLICY IF EXISTS "Service role puede insertar items" ON pedido_items;
DROP POLICY IF EXISTS "Admins pueden ver todos los items" ON pedido_items;

-- ============================================
-- POLÍTICAS PARA PEDIDOS
-- ============================================

-- Usuarios autenticados pueden ver sus propios pedidos
CREATE POLICY "Usuarios pueden ver sus pedidos"
  ON pedidos FOR SELECT
  USING (
    auth.uid() = usuario_id
    OR
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol IN ('admin', 'profesional')
    )
  );

-- Usuarios pueden crear pedidos asociados a su ID o anónimos (NULL)
CREATE POLICY "Usuarios pueden crear pedidos"
  ON pedidos FOR INSERT
  WITH CHECK (
    usuario_id IS NULL
    OR auth.uid() = usuario_id
  );

-- Admins pueden actualizar pedidos (cambiar estado)
CREATE POLICY "Admins pueden actualizar pedidos"
  ON pedidos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol IN ('admin', 'profesional')
    )
  );

-- ============================================
-- POLÍTICAS PARA PEDIDO_ITEMS
-- ============================================

-- Usuarios pueden ver items de sus propios pedidos
-- Admins pueden ver todos los items
CREATE POLICY "Usuarios pueden ver items de sus pedidos"
  ON pedido_items FOR SELECT
  USING (
    pedido_id IN (
      SELECT id FROM pedidos
      WHERE usuario_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE perfiles.id = auth.uid()
      AND perfiles.rol IN ('admin', 'profesional')
    )
  );

-- Usuarios pueden crear items (cuando crean pedido)
CREATE POLICY "Usuarios pueden crear items de pedido"
  ON pedido_items FOR INSERT
  WITH CHECK (
    pedido_id IN (
      SELECT id FROM pedidos
      WHERE usuario_id IS NULL
      OR usuario_id = auth.uid()
    )
  );

-- ============================================
-- ÍNDICE PARA STRIPE PAYMENT ID
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pedidos_stripe_payment_id ON pedidos(stripe_payment_id);

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
