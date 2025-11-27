# The Lobby Beauty - Ampliación ERP y Tesorería

> **Versión:** 1.0  
> **Fecha:** Noviembre 2025  
> **Tipo:** Especificación técnica para implementación  
> **Dependencia:** DOCUMENTACION_TECNICA.md (proyecto base)

---

## Índice

1. [Resumen de la Ampliación](#1-resumen-de-la-ampliación)
2. [Estado Actual del Proyecto](#2-estado-actual-del-proyecto)
3. [Nuevos Módulos a Implementar](#3-nuevos-módulos-a-implementar)
4. [Modelo de Datos - Nuevas Tablas](#4-modelo-de-datos---nuevas-tablas)
5. [API REST - Nuevos Endpoints](#5-api-rest---nuevos-endpoints)
6. [Frontend - Nuevas Páginas](#6-frontend---nuevas-páginas)
7. [Integración con Módulos Existentes](#7-integración-con-módulos-existentes)
8. [Plan de Trabajo](#8-plan-de-trabajo)
9. [Consideraciones Técnicas](#9-consideraciones-técnicas)

---

## 1. Resumen de la Ampliación

### Objetivo

Extender la plataforma The Lobby Beauty con dos nuevos módulos de gestión empresarial:

1. **Control de Gestión (Mini-ERP):** Cuenta de resultados con registro de gastos y visibilidad de márgenes
2. **Tesorería:** Gestión de caja, posición de liquidez y arqueos diarios

### Alcance

| Módulo | Funcionalidades Principales |
|--------|----------------------------|
| **Control de Gestión** | Registro de gastos, categorías, proveedores, dashboard P&L, alertas |
| **Tesorería** | Cuentas/cajas, movimientos, arqueos, previsión de liquidez |

### Principios de Diseño

- **Integración nativa:** Los nuevos módulos se alimentan de datos existentes (pedidos, reservas)
- **Mínima fricción:** Los ingresos se capturan automáticamente; solo gastos requieren entrada manual
- **Control de gestión, no contabilidad oficial:** Complementa al gestor, no lo sustituye
- **Mobile-first:** Consistente con el diseño actual de la plataforma

---

## 2. Estado Actual del Proyecto

### Stack Tecnológico (sin cambios)

```
Frontend:  React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
Backend:   Python 3.11 + FastAPI + Pydantic
Database:  Supabase (PostgreSQL + Auth + Storage)
Pagos:     Stripe
Email:     Resend
WhatsApp:  Twilio
```

### Estructura de Carpetas Actual

```
TLB/
├── frontend/src/
│   ├── pages/admin/          # Páginas de administración
│   ├── components/           # Componentes UI
│   ├── context/              # AuthContext, CartContext, WishlistContext
│   ├── hooks/                # useServicios, useReservas
│   └── services/api.ts       # Cliente HTTP
│
├── backend/app/
│   ├── routers/              # servicios, productos, reservas, pagos, pedidos, clientes, whatsapp
│   ├── models/schemas.py     # Modelos Pydantic
│   ├── services/             # email.py, whatsapp.py
│   └── core/                 # config.py, database.py
│
└── database/                 # Scripts SQL
```

### Tablas Existentes Relevantes

| Tabla | Campos Clave para Integración |
|-------|------------------------------|
| `pedidos` | id, total, estado, created_at, stripe_payment_intent |
| `pedido_items` | pedido_id, producto_id, cantidad, precio_unitario |
| `reservas` | id, servicio_id, fecha, hora, estado, precio_total |
| `servicios` | id, nombre, precio |
| `productos` | id, nombre, precio, stock |

---

## 3. Nuevos Módulos a Implementar

### 3.1 Módulo Control de Gestión

**Propósito:** Visibilidad de la cuenta de resultados (P&L) del negocio en tiempo real.

**Funcionalidades:**

| Función | Descripción |
|---------|-------------|
| Registro de gastos | Formulario con fecha, importe, categoría, proveedor, justificante |
| Categorías de gasto | Personal, Local, Producto, Marketing, Tecnología, Financieros, Otros |
| Maestro de proveedores | Autocompletado, NIF, categoría por defecto |
| Dashboard P&L | Ingresos vs Gastos, margen bruto/neto, comparativas |
| Alertas | Gastos sobre umbral, categoría sobre presupuesto, margen bajo |
| Gastos recurrentes | Programación mensual/trimestral/anual |

**Ingresos (captura automática):**
- Pedidos pagados → suma de `pedidos.total` donde `estado = 'pagado'`
- Reservas completadas → suma de `reservas.precio_total` donde `estado = 'completada'`

### 3.2 Módulo Tesorería

**Propósito:** Control de la posición de caja y flujos de efectivo.

**Funcionalidades:**

| Función | Descripción |
|---------|-------------|
| Cuentas/Cajas | Banco, caja física por local, pasarelas (Stripe) |
| Movimientos | Cobros, pagos, traspasos entre cuentas |
| Dashboard posición | Saldo por cuenta, posición global, movimientos recientes |
| Arqueo de caja | Cierre diario de cajas físicas con control de descuadre |
| Previsión | Cobros/pagos esperados próximos 7-30 días |

**Movimientos automáticos:**
- Pedido pagado → +movimiento en cuenta Stripe
- Reserva pagada anticipadamente → +movimiento en cuenta Stripe
- Gasto registrado con pago → -movimiento en cuenta seleccionada

---

## 4. Modelo de Datos - Nuevas Tablas

### 4.1 Nuevos ENUMs

```sql
-- Categorías de gasto
CREATE TYPE categoria_gasto AS ENUM (
    'personal',      -- Nóminas, SS, comisiones
    'local',         -- Alquiler, suministros, limpieza
    'producto',      -- Mercancía, materiales
    'marketing',     -- Publicidad, eventos
    'tecnologia',    -- Hosting, software, pasarelas
    'financieros',   -- Comisiones bancarias, intereses
    'profesionales', -- Gestoría, asesoría
    'otros'
);

-- Tipos de cuenta de tesorería
CREATE TYPE tipo_cuenta AS ENUM (
    'bank',            -- Cuenta bancaria
    'cash_register',   -- Caja física
    'payment_gateway', -- Stripe, Redsys
    'other'
);

-- Tipos de movimiento de tesorería
CREATE TYPE tipo_movimiento AS ENUM (
    'income',       -- Cobro
    'expense',      -- Pago
    'transfer_in',  -- Entrada por traspaso
    'transfer_out'  -- Salida por traspaso
);

-- Referencia de movimiento
CREATE TYPE referencia_movimiento AS ENUM (
    'order',    -- Pedido
    'booking',  -- Reserva
    'expense',  -- Gasto
    'transfer', -- Traspaso
    'manual'    -- Manual
);

-- Frecuencia de recurrencia
CREATE TYPE frecuencia_recurrencia AS ENUM (
    'monthly',    -- Mensual
    'quarterly',  -- Trimestral
    'yearly'      -- Anual
);
```

### 4.2 Tablas Control de Gestión

#### **expense_categories** (Categorías de gasto)

```sql
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type categoria_gasto NOT NULL,
    parent_id UUID REFERENCES expense_categories(id),
    budget_monthly DECIMAL(10,2),  -- Presupuesto mensual para alertas
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales
INSERT INTO expense_categories (name, type) VALUES
    ('Nóminas', 'personal'),
    ('Seguridad Social', 'personal'),
    ('Comisiones', 'personal'),
    ('Alquiler', 'local'),
    ('Electricidad', 'local'),
    ('Agua', 'local'),
    ('Internet', 'local'),
    ('Limpieza', 'local'),
    ('Mercancía reventa', 'producto'),
    ('Esmaltes y geles', 'producto'),
    ('Material fungible', 'producto'),
    ('Publicidad online', 'marketing'),
    ('Hosting y dominio', 'tecnologia'),
    ('Comisiones Stripe', 'financieros'),
    ('Comisiones bancarias', 'financieros'),
    ('Gestoría', 'profesionales'),
    ('Seguros', 'otros');
```

#### **vendors** (Proveedores)

```sql
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    tax_id VARCHAR(20),  -- NIF/CIF
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    default_category_id UUID REFERENCES expense_categories(id),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **expenses** (Gastos)

```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,           -- Importe sin IVA
    amount_with_vat DECIMAL(10,2),           -- Importe con IVA
    vat_rate DECIMAL(4,2) DEFAULT 21.00,     -- Tipo IVA
    category_id UUID REFERENCES expense_categories(id) NOT NULL,
    vendor_id UUID REFERENCES vendors(id),
    description TEXT,
    receipt_url TEXT,                        -- URL del justificante en Supabase Storage
    
    -- Recurrencia
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule frecuencia_recurrencia,
    next_occurrence DATE,
    
    -- Vinculación con tesorería
    cash_movement_id UUID,                   -- Se rellena al crear movimiento de pago
    is_paid BOOLEAN DEFAULT false,
    
    -- Auditoría
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_vendor ON expenses(vendor_id);
```

### 4.3 Tablas Tesorería

#### **cash_accounts** (Cuentas/Cajas)

```sql
CREATE TABLE cash_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type tipo_cuenta NOT NULL,
    initial_balance DECIMAL(12,2) DEFAULT 0,
    current_balance DECIMAL(12,2) DEFAULT 0,  -- Se actualiza con trigger
    minimum_balance DECIMAL(12,2),             -- Para alertas de saldo bajo
    local_id INTEGER,                          -- Para cajas físicas (futuro: FK a locales)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datos iniciales
INSERT INTO cash_accounts (name, type, initial_balance, current_balance) VALUES
    ('Banco Principal', 'bank', 0, 0),
    ('Caja Local', 'cash_register', 0, 0),
    ('Stripe', 'payment_gateway', 0, 0);
```

#### **cash_movements** (Movimientos)

```sql
CREATE TABLE cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES cash_accounts(id) NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,  -- + entrada, - salida
    type tipo_movimiento NOT NULL,
    concept VARCHAR(255),
    
    -- Vinculación con origen
    reference_type referencia_movimiento,
    reference_id UUID,                        -- ID del pedido, reserva, gasto o traspaso
    
    -- Para traspasos
    transfer_account_id UUID REFERENCES cash_accounts(id),
    
    -- Control
    reconciled BOOLEAN DEFAULT false,
    
    -- Auditoría
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_cash_movements_account ON cash_movements(account_id);
CREATE INDEX idx_cash_movements_date ON cash_movements(date);
CREATE INDEX idx_cash_movements_reference ON cash_movements(reference_type, reference_id);

-- Trigger para actualizar saldo de cuenta
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE cash_accounts 
        SET current_balance = current_balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE cash_accounts 
        SET current_balance = current_balance - OLD.amount,
            updated_at = NOW()
        WHERE id = OLD.account_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Revertir el anterior y aplicar el nuevo
        UPDATE cash_accounts 
        SET current_balance = current_balance - OLD.amount + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.account_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_account_balance
AFTER INSERT OR UPDATE OR DELETE ON cash_movements
FOR EACH ROW EXECUTE FUNCTION update_account_balance();
```

#### **cash_closings** (Arqueos de caja)

```sql
CREATE TABLE cash_closings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES cash_accounts(id) NOT NULL,
    date DATE NOT NULL,
    theoretical_balance DECIMAL(12,2) NOT NULL,  -- Saldo según movimientos
    counted_balance DECIMAL(12,2) NOT NULL,      -- Efectivo contado
    difference DECIMAL(12,2) NOT NULL,           -- counted - theoretical
    notes TEXT,
    closed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_closing_per_day UNIQUE (account_id, date)
);

-- Índice
CREATE INDEX idx_cash_closings_account_date ON cash_closings(account_id, date);
```

### 4.4 Diagrama Relacional Ampliado

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MÓDULOS EXISTENTES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            │
│  │  pedidos    │         │  reservas   │         │  productos  │            │
│  │─────────────│         │─────────────│         │─────────────│            │
│  │ total       │         │ precio_total│         │ stock       │            │
│  │ estado      │         │ estado      │         │ precio      │            │
│  └──────┬──────┘         └──────┬──────┘         └─────────────┘            │
│         │                       │                                            │
│         │ (automático)          │ (automático)                               │
│         │                       │                                            │
└─────────┼───────────────────────┼────────────────────────────────────────────┘
          │                       │
          ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NUEVOS MÓDULOS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      CONTROL DE GESTIÓN                              │    │
│  │                                                                      │    │
│  │  ┌──────────────────┐    ┌─────────────┐    ┌─────────────┐         │    │
│  │  │expense_categories│◄───│  expenses   │───▶│   vendors   │         │    │
│  │  │──────────────────│    │─────────────│    │─────────────│         │    │
│  │  │ name             │    │ date        │    │ name        │         │    │
│  │  │ type             │    │ amount      │    │ tax_id      │         │    │
│  │  │ budget_monthly   │    │ category_id │    │ email       │         │    │
│  │  └──────────────────┘    │ vendor_id   │    └─────────────┘         │    │
│  │                          │ receipt_url │                             │    │
│  │                          │ is_paid     │───────────────┐             │    │
│  │                          └─────────────┘               │             │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                           │                  │
│                                                           │ (vinculación)    │
│                                                           ▼                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         TESORERÍA                                    │    │
│  │                                                                      │    │
│  │  ┌───────────────┐    ┌────────────────┐    ┌───────────────┐       │    │
│  │  │ cash_accounts │◄───│ cash_movements │    │ cash_closings │       │    │
│  │  │───────────────│    │────────────────│    │───────────────│       │    │
│  │  │ name          │    │ account_id     │    │ account_id    │       │    │
│  │  │ type          │    │ date           │    │ date          │       │    │
│  │  │ current_balance│   │ amount         │    │ theoretical   │       │    │
│  │  └───────────────┘    │ type           │    │ counted       │       │    │
│  │         ▲             │ reference_type │    │ difference    │       │    │
│  │         │             │ reference_id   │───▶│               │       │    │
│  │         │             └────────────────┘    └───────────────┘       │    │
│  │         │                    ▲                                       │    │
│  │         └────────────────────┘ (trigger actualiza saldo)            │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. API REST - Nuevos Endpoints

**URL Base:** `http://localhost:8001/api/v1`

### 5.1 Control de Gestión

#### Categorías de Gasto (`/gestion/categorias`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/gestion/categorias` | Listar categorías | Admin |
| POST | `/gestion/categorias` | Crear categoría | Admin |
| PUT | `/gestion/categorias/{id}` | Actualizar categoría | Admin |
| DELETE | `/gestion/categorias/{id}` | Eliminar categoría | Admin |

#### Proveedores (`/gestion/proveedores`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/gestion/proveedores` | Listar proveedores | Admin |
| GET | `/gestion/proveedores/{id}` | Obtener proveedor | Admin |
| POST | `/gestion/proveedores` | Crear proveedor | Admin |
| PUT | `/gestion/proveedores/{id}` | Actualizar proveedor | Admin |
| DELETE | `/gestion/proveedores/{id}` | Eliminar proveedor | Admin |

**Parámetros GET:**
- `busqueda` - Buscar por nombre o NIF
- `solo_activos` - Solo activos (default: true)

#### Gastos (`/gestion/gastos`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/gestion/gastos` | Listar gastos con filtros | Admin |
| GET | `/gestion/gastos/{id}` | Obtener gasto | Admin |
| POST | `/gestion/gastos` | Crear gasto | Admin |
| PUT | `/gestion/gastos/{id}` | Actualizar gasto | Admin |
| DELETE | `/gestion/gastos/{id}` | Eliminar gasto | Admin |
| POST | `/gestion/gastos/{id}/pagar` | Marcar como pagado + crear movimiento | Admin |

**Parámetros GET:**
- `fecha_desde`, `fecha_hasta` - Rango de fechas
- `categoria_id` - Filtrar por categoría
- `vendor_id` - Filtrar por proveedor
- `is_paid` - Filtrar por estado de pago
- `pagina`, `por_pagina`

**Body POST /gestion/gastos:**
```json
{
  "date": "2025-11-27",
  "amount": 150.00,
  "amount_with_vat": 181.50,
  "vat_rate": 21.00,
  "category_id": "uuid-categoria",
  "vendor_id": "uuid-proveedor",
  "description": "Factura mensual electricidad",
  "is_recurring": true,
  "recurrence_rule": "monthly"
}
```

**Body POST /gestion/gastos/{id}/pagar:**
```json
{
  "account_id": "uuid-cuenta",
  "date": "2025-11-27"
}
```

#### Dashboard P&L (`/gestion/dashboard`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/gestion/dashboard` | Métricas principales | Admin |
| GET | `/gestion/dashboard/pl` | Cuenta de resultados detallada | Admin |
| GET | `/gestion/dashboard/evolucion` | Evolución mensual | Admin |

**Parámetros:**
- `periodo` - month, quarter, year (default: month)
- `fecha_desde`, `fecha_hasta` - Rango personalizado

**Respuesta GET /gestion/dashboard:**
```json
{
  "periodo": {
    "desde": "2025-11-01",
    "hasta": "2025-11-30"
  },
  "ingresos": {
    "total": 8500.00,
    "por_tipo": {
      "pedidos": 3200.00,
      "reservas": 5300.00
    }
  },
  "gastos": {
    "total": 4200.00,
    "por_categoria": {
      "personal": 2000.00,
      "local": 1200.00,
      "producto": 500.00,
      "marketing": 300.00,
      "otros": 200.00
    }
  },
  "margen_bruto": 4300.00,
  "margen_porcentaje": 50.6,
  "comparativa_mes_anterior": {
    "ingresos_variacion": 12.5,
    "gastos_variacion": -3.2,
    "margen_variacion": 18.4
  },
  "alertas": [
    {
      "tipo": "categoria_sobre_presupuesto",
      "mensaje": "Marketing ha superado el presupuesto mensual",
      "valor": 300.00,
      "limite": 250.00
    }
  ]
}
```

### 5.2 Tesorería

#### Cuentas (`/tesoreria/cuentas`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/tesoreria/cuentas` | Listar cuentas con saldos | Admin |
| GET | `/tesoreria/cuentas/{id}` | Detalle de cuenta | Admin |
| POST | `/tesoreria/cuentas` | Crear cuenta | Admin |
| PUT | `/tesoreria/cuentas/{id}` | Actualizar cuenta | Admin |
| DELETE | `/tesoreria/cuentas/{id}` | Desactivar cuenta | Admin |

#### Movimientos (`/tesoreria/movimientos`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/tesoreria/movimientos` | Listar movimientos | Admin |
| GET | `/tesoreria/movimientos/{id}` | Detalle de movimiento | Admin |
| POST | `/tesoreria/movimientos` | Crear movimiento manual | Admin |
| POST | `/tesoreria/movimientos/traspaso` | Crear traspaso entre cuentas | Admin |
| DELETE | `/tesoreria/movimientos/{id}` | Eliminar movimiento | Admin |

**Parámetros GET:**
- `account_id` - Filtrar por cuenta
- `fecha_desde`, `fecha_hasta`
- `type` - income, expense, transfer_in, transfer_out
- `reconciled` - true/false
- `pagina`, `por_pagina`

**Body POST /tesoreria/movimientos:**
```json
{
  "account_id": "uuid-cuenta",
  "date": "2025-11-27",
  "amount": 500.00,
  "type": "income",
  "concept": "Cobro en efectivo",
  "reference_type": "manual"
}
```

**Body POST /tesoreria/movimientos/traspaso:**
```json
{
  "from_account_id": "uuid-cuenta-origen",
  "to_account_id": "uuid-cuenta-destino",
  "date": "2025-11-27",
  "amount": 1000.00,
  "concept": "Ingreso recaudación en banco"
}
```

#### Arqueos (`/tesoreria/arqueos`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/tesoreria/arqueos` | Listar arqueos | Admin |
| GET | `/tesoreria/arqueos/pendiente/{account_id}` | Datos para arqueo del día | Admin |
| POST | `/tesoreria/arqueos` | Registrar arqueo | Admin |

**Respuesta GET /tesoreria/arqueos/pendiente/{account_id}:**
```json
{
  "account_id": "uuid-cuenta",
  "account_name": "Caja Local",
  "date": "2025-11-27",
  "theoretical_balance": 450.00,
  "movimientos_dia": [
    {
      "hora": "10:30",
      "concept": "Pago servicio manicura",
      "amount": 35.00
    },
    {
      "hora": "12:15",
      "concept": "Pago servicio pedicura",
      "amount": 45.00
    }
  ],
  "ultimo_arqueo": {
    "date": "2025-11-26",
    "difference": 0.00
  }
}
```

**Body POST /tesoreria/arqueos:**
```json
{
  "account_id": "uuid-cuenta",
  "date": "2025-11-27",
  "counted_balance": 448.50,
  "notes": "Falta 1.50€, posible error en cambio"
}
```

#### Dashboard Tesorería (`/tesoreria/dashboard`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/tesoreria/dashboard` | Posición global y por cuenta | Admin |
| GET | `/tesoreria/dashboard/prevision` | Previsión próximos días | Admin |

**Respuesta GET /tesoreria/dashboard:**
```json
{
  "posicion_global": 12450.00,
  "cuentas": [
    {
      "id": "uuid",
      "name": "Banco Principal",
      "type": "bank",
      "current_balance": 8200.00,
      "is_below_minimum": false
    },
    {
      "id": "uuid",
      "name": "Caja Local",
      "type": "cash_register",
      "current_balance": 450.00,
      "is_below_minimum": false
    },
    {
      "id": "uuid",
      "name": "Stripe",
      "type": "payment_gateway",
      "current_balance": 3800.00,
      "is_below_minimum": false
    }
  ],
  "movimientos_hoy": {
    "ingresos": 580.00,
    "gastos": 150.00,
    "neto": 430.00
  },
  "movimientos_semana": {
    "ingresos": 3200.00,
    "gastos": 1800.00,
    "neto": 1400.00
  }
}
```

**Respuesta GET /tesoreria/dashboard/prevision:**
```json
{
  "periodo_dias": 7,
  "cobros_esperados": [
    {
      "fecha": "2025-11-28",
      "concepto": "Reservas confirmadas",
      "importe": 280.00
    },
    {
      "fecha": "2025-11-29",
      "concepto": "Reservas confirmadas",
      "importe": 450.00
    }
  ],
  "pagos_esperados": [
    {
      "fecha": "2025-12-01",
      "concepto": "Alquiler (recurrente)",
      "importe": 1200.00
    }
  ],
  "resumen": {
    "cobros_total": 1200.00,
    "pagos_total": 3500.00,
    "posicion_prevista": 10150.00
  },
  "alerta_liquidez": false
}
```

---

## 6. Frontend - Nuevas Páginas

### 6.1 Estructura de Carpetas (ampliación)

```
frontend/src/
├── pages/admin/
│   ├── gestion/                    # NUEVO - Control de Gestión
│   │   ├── Dashboard.tsx           # Dashboard P&L principal
│   │   ├── Gastos.tsx              # Listado y CRUD de gastos
│   │   ├── GastoForm.tsx           # Formulario de gasto
│   │   ├── Proveedores.tsx         # Maestro de proveedores
│   │   └── Categorias.tsx          # Gestión de categorías
│   │
│   └── tesoreria/                  # NUEVO - Tesorería
│       ├── Dashboard.tsx           # Posición de caja
│       ├── Cuentas.tsx             # Gestión de cuentas
│       ├── Movimientos.tsx         # Listado de movimientos
│       ├── MovimientoForm.tsx      # Formulario de movimiento
│       ├── Traspaso.tsx            # Formulario de traspaso
│       └── Arqueo.tsx              # Arqueo de caja
│
├── hooks/
│   ├── useGastos.ts                # NUEVO - Queries de gastos
│   ├── useProveedores.ts           # NUEVO - Queries de proveedores
│   ├── useTesoreria.ts             # NUEVO - Queries de tesorería
│   └── ...
│
└── types/
    └── index.ts                    # Añadir nuevos tipos
```

### 6.2 Nuevas Rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/admin/gestion` | gestion/Dashboard | Dashboard P&L |
| `/admin/gestion/gastos` | gestion/Gastos | Listado de gastos |
| `/admin/gestion/gastos/nuevo` | gestion/GastoForm | Crear gasto |
| `/admin/gestion/gastos/:id` | gestion/GastoForm | Editar gasto |
| `/admin/gestion/proveedores` | gestion/Proveedores | Maestro proveedores |
| `/admin/gestion/categorias` | gestion/Categorias | Gestión categorías |
| `/admin/tesoreria` | tesoreria/Dashboard | Posición de caja |
| `/admin/tesoreria/cuentas` | tesoreria/Cuentas | Gestión de cuentas |
| `/admin/tesoreria/movimientos` | tesoreria/Movimientos | Listado movimientos |
| `/admin/tesoreria/movimientos/nuevo` | tesoreria/MovimientoForm | Crear movimiento |
| `/admin/tesoreria/traspaso` | tesoreria/Traspaso | Traspaso entre cuentas |
| `/admin/tesoreria/arqueo` | tesoreria/Arqueo | Arqueo de caja |

### 6.3 Navegación Admin (actualizar)

Añadir al menú lateral de administración:

```tsx
// En AdminLayout.tsx o componente de navegación

const menuItems = [
  // ... items existentes ...
  
  // Separador
  { type: 'separator', label: 'Finanzas' },
  
  // Control de Gestión
  {
    label: 'Control de Gestión',
    icon: TrendingUp,
    children: [
      { label: 'Dashboard P&L', path: '/admin/gestion' },
      { label: 'Gastos', path: '/admin/gestion/gastos' },
      { label: 'Proveedores', path: '/admin/gestion/proveedores' },
      { label: 'Categorías', path: '/admin/gestion/categorias' },
    ]
  },
  
  // Tesorería
  {
    label: 'Tesorería',
    icon: Wallet,
    children: [
      { label: 'Posición de Caja', path: '/admin/tesoreria' },
      { label: 'Cuentas', path: '/admin/tesoreria/cuentas' },
      { label: 'Movimientos', path: '/admin/tesoreria/movimientos' },
      { label: 'Arqueo de Caja', path: '/admin/tesoreria/arqueo' },
    ]
  },
];
```

### 6.4 Nuevos Tipos TypeScript

```typescript
// En types/index.ts

// ============ CONTROL DE GESTIÓN ============

export interface ExpenseCategory {
  id: string;
  name: string;
  type: 'personal' | 'local' | 'producto' | 'marketing' | 'tecnologia' | 'financieros' | 'profesionales' | 'otros';
  parent_id?: string;
  budget_monthly?: number;
  is_active: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  tax_id?: string;
  email?: string;
  phone?: string;
  address?: string;
  default_category_id?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  amount_with_vat?: number;
  vat_rate: number;
  category_id: string;
  category?: ExpenseCategory;
  vendor_id?: string;
  vendor?: Vendor;
  description?: string;
  receipt_url?: string;
  is_recurring: boolean;
  recurrence_rule?: 'monthly' | 'quarterly' | 'yearly';
  is_paid: boolean;
  cash_movement_id?: string;
  created_at: string;
}

export interface PLDashboard {
  periodo: { desde: string; hasta: string };
  ingresos: {
    total: number;
    por_tipo: { pedidos: number; reservas: number };
  };
  gastos: {
    total: number;
    por_categoria: Record<string, number>;
  };
  margen_bruto: number;
  margen_porcentaje: number;
  comparativa_mes_anterior: {
    ingresos_variacion: number;
    gastos_variacion: number;
    margen_variacion: number;
  };
  alertas: Array<{
    tipo: string;
    mensaje: string;
    valor: number;
    limite: number;
  }>;
}

// ============ TESORERÍA ============

export interface CashAccount {
  id: string;
  name: string;
  type: 'bank' | 'cash_register' | 'payment_gateway' | 'other';
  initial_balance: number;
  current_balance: number;
  minimum_balance?: number;
  local_id?: number;
  is_active: boolean;
}

export interface CashMovement {
  id: string;
  account_id: string;
  account?: CashAccount;
  date: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer_in' | 'transfer_out';
  concept?: string;
  reference_type?: 'order' | 'booking' | 'expense' | 'transfer' | 'manual';
  reference_id?: string;
  transfer_account_id?: string;
  reconciled: boolean;
  created_at: string;
}

export interface CashClosing {
  id: string;
  account_id: string;
  account?: CashAccount;
  date: string;
  theoretical_balance: number;
  counted_balance: number;
  difference: number;
  notes?: string;
  closed_by?: string;
  created_at: string;
}

export interface TreasuryDashboard {
  posicion_global: number;
  cuentas: Array<CashAccount & { is_below_minimum: boolean }>;
  movimientos_hoy: { ingresos: number; gastos: number; neto: number };
  movimientos_semana: { ingresos: number; gastos: number; neto: number };
}

export interface TreasuryForecast {
  periodo_dias: number;
  cobros_esperados: Array<{ fecha: string; concepto: string; importe: number }>;
  pagos_esperados: Array<{ fecha: string; concepto: string; importe: number }>;
  resumen: {
    cobros_total: number;
    pagos_total: number;
    posicion_prevista: number;
  };
  alerta_liquidez: boolean;
}
```

---

## 7. Integración con Módulos Existentes

### 7.1 Flujo de Ingresos Automáticos

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CAPTURA AUTOMÁTICA DE INGRESOS                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐                                                        │
│  │   Pedido    │                                                        │
│  │   pagado    │                                                        │
│  └──────┬──────┘                                                        │
│         │                                                                │
│         │ webhook Stripe (existente)                                     │
│         ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  routers/pagos.py → handle_checkout_completed()                  │    │
│  │                                                                  │    │
│  │  AÑADIR: Crear movimiento en tesorería                          │    │
│  │  ─────────────────────────────────────────────────────────────  │    │
│  │  cash_movement = {                                               │    │
│  │      account_id: cuenta_stripe,                                  │    │
│  │      amount: pedido.total,                                       │    │
│  │      type: 'income',                                             │    │
│  │      reference_type: 'order',                                    │    │
│  │      reference_id: pedido.id                                     │    │
│  │  }                                                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────┐                                                        │
│  │  Reserva    │                                                        │
│  │ completada  │                                                        │
│  └──────┬──────┘                                                        │
│         │                                                                │
│         │ cambio de estado (existente o nuevo endpoint)                  │
│         ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  routers/reservas.py → actualizar_estado()                       │    │
│  │                                                                  │    │
│  │  AÑADIR: Si estado='completada' y tiene precio_total             │    │
│  │  ─────────────────────────────────────────────────────────────  │    │
│  │  cash_movement = {                                               │    │
│  │      account_id: cuenta_segun_metodo_pago,                       │    │
│  │      amount: reserva.precio_total,                               │    │
│  │      type: 'income',                                             │    │
│  │      reference_type: 'booking',                                  │    │
│  │      reference_id: reserva.id                                    │    │
│  │  }                                                               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Modificaciones en Routers Existentes

#### routers/pagos.py

```python
# Añadir import
from app.services.tesoreria import crear_movimiento_ingreso

# En handle_checkout_completed, después de crear el pedido:

async def handle_checkout_completed(session: dict):
    # ... código existente para crear pedido ...
    
    # NUEVO: Crear movimiento en tesorería
    try:
        await crear_movimiento_ingreso(
            account_type='payment_gateway',  # Stripe
            amount=pedido.total,
            reference_type='order',
            reference_id=str(pedido.id),
            concept=f'Pedido #{pedido.id}'
        )
    except Exception as e:
        # Log pero no fallar - el pedido ya está creado
        logger.error(f"Error creando movimiento tesorería: {e}")
```

#### routers/reservas.py

```python
# Añadir función para marcar reserva como completada con pago

@router.post("/{id}/completar")
async def completar_reserva(
    id: int,
    datos: CompletarReservaRequest,  # metodo_pago: 'efectivo' | 'tarjeta'
    current_user: User = Depends(get_current_admin)
):
    # Actualizar estado a 'completada'
    reserva = await actualizar_reserva_estado(id, 'completada')
    
    # Crear movimiento en tesorería
    account_type = 'cash_register' if datos.metodo_pago == 'efectivo' else 'payment_gateway'
    
    await crear_movimiento_ingreso(
        account_type=account_type,
        amount=reserva.precio_total,
        reference_type='booking',
        reference_id=str(reserva.id),
        concept=f'Reserva #{reserva.id} - {reserva.servicio.nombre}'
    )
    
    return reserva
```

### 7.3 Queries para Dashboard P&L

```python
# En services/gestion.py

async def obtener_ingresos_periodo(fecha_desde: date, fecha_hasta: date) -> dict:
    """Obtiene ingresos de pedidos y reservas en el período"""
    
    # Ingresos por pedidos pagados
    pedidos = await supabase.table('pedidos')\
        .select('total')\
        .eq('estado', 'pagado')\
        .gte('created_at', fecha_desde.isoformat())\
        .lte('created_at', fecha_hasta.isoformat())\
        .execute()
    
    total_pedidos = sum(p['total'] for p in pedidos.data) if pedidos.data else 0
    
    # Ingresos por reservas completadas
    reservas = await supabase.table('reservas')\
        .select('precio_total')\
        .eq('estado', 'completada')\
        .gte('fecha', fecha_desde.isoformat())\
        .lte('fecha', fecha_hasta.isoformat())\
        .execute()
    
    total_reservas = sum(r['precio_total'] for r in reservas.data if r['precio_total']) if reservas.data else 0
    
    return {
        'total': total_pedidos + total_reservas,
        'por_tipo': {
            'pedidos': total_pedidos,
            'reservas': total_reservas
        }
    }
```

---

## 8. Plan de Trabajo

### Fase 1: Base de Datos (1-2 días)

**Tareas:**

1. [ ] Crear archivo `database/erp_tesoreria_schema.sql` con:
   - ENUMs nuevos
   - Tabla `expense_categories` con datos iniciales
   - Tabla `vendors`
   - Tabla `expenses`
   - Tabla `cash_accounts` con datos iniciales
   - Tabla `cash_movements` con trigger
   - Tabla `cash_closings`

2. [ ] Ejecutar migraciones en Supabase
3. [ ] Configurar RLS para nuevas tablas

**Entregable:** Todas las tablas creadas y funcionando en Supabase

---

### Fase 2: Backend - Modelos y Schemas (1 día)

**Tareas:**

1. [ ] Crear `app/models/gestion.py`:
   - Schemas Pydantic para categorías, proveedores, gastos
   - Request/Response models

2. [ ] Crear `app/models/tesoreria.py`:
   - Schemas Pydantic para cuentas, movimientos, arqueos
   - Request/Response models

**Entregable:** Modelos Pydantic completos con validaciones

---

### Fase 3: Backend - Routers Control de Gestión (2-3 días)

**Tareas:**

1. [ ] Crear `app/routers/gestion_categorias.py`:
   - CRUD de categorías

2. [ ] Crear `app/routers/gestion_proveedores.py`:
   - CRUD de proveedores
   - Búsqueda y autocompletado

3. [ ] Crear `app/routers/gestion_gastos.py`:
   - CRUD de gastos
   - Filtros avanzados
   - Upload de justificantes a Supabase Storage
   - Endpoint de marcar como pagado

4. [ ] Crear `app/routers/gestion_dashboard.py`:
   - Dashboard P&L con métricas
   - Consultas de ingresos desde pedidos y reservas
   - Comparativas

5. [ ] Actualizar `app/main.py` con nuevos routers

**Entregable:** API de control de gestión completa y documentada en /docs

---

### Fase 4: Backend - Routers Tesorería (2-3 días)

**Tareas:**

1. [ ] Crear `app/routers/tesoreria_cuentas.py`:
   - CRUD de cuentas

2. [ ] Crear `app/routers/tesoreria_movimientos.py`:
   - CRUD de movimientos
   - Traspasos entre cuentas
   - Filtros

3. [ ] Crear `app/routers/tesoreria_arqueos.py`:
   - Obtener datos para arqueo
   - Registrar arqueo

4. [ ] Crear `app/routers/tesoreria_dashboard.py`:
   - Posición global
   - Previsión de tesorería

5. [ ] Crear `app/services/tesoreria.py`:
   - Función `crear_movimiento_ingreso()` para uso desde otros módulos

6. [ ] **Modificar** `app/routers/pagos.py`:
   - Añadir creación de movimiento en webhook

7. [ ] **Modificar** `app/routers/reservas.py`:
   - Añadir endpoint completar reserva con pago

**Entregable:** API de tesorería completa e integrada con módulos existentes

---

### Fase 5: Frontend - Control de Gestión (3-4 días)

**Tareas:**

1. [ ] Crear hooks:
   - `hooks/useGastos.ts`
   - `hooks/useProveedores.ts`
   - `hooks/useCategorias.ts`
   - `hooks/useGestionDashboard.ts`

2. [ ] Crear páginas:
   - `pages/admin/gestion/Dashboard.tsx` - Gráficos Recharts, KPIs
   - `pages/admin/gestion/Gastos.tsx` - Tabla con filtros, acciones
   - `pages/admin/gestion/GastoForm.tsx` - Formulario completo
   - `pages/admin/gestion/Proveedores.tsx` - CRUD proveedores
   - `pages/admin/gestion/Categorias.tsx` - Gestión categorías

3. [ ] Actualizar `App.tsx` con nuevas rutas
4. [ ] Actualizar navegación admin

**Entregable:** Módulo de control de gestión funcional en frontend

---

### Fase 6: Frontend - Tesorería (3-4 días)

**Tareas:**

1. [ ] Crear hooks:
   - `hooks/useTesoreria.ts`
   - `hooks/useCuentas.ts`
   - `hooks/useMovimientos.ts`
   - `hooks/useArqueos.ts`

2. [ ] Crear páginas:
   - `pages/admin/tesoreria/Dashboard.tsx` - Posición, gráficos
   - `pages/admin/tesoreria/Cuentas.tsx` - CRUD cuentas
   - `pages/admin/tesoreria/Movimientos.tsx` - Listado con filtros
   - `pages/admin/tesoreria/MovimientoForm.tsx` - Formulario
   - `pages/admin/tesoreria/Traspaso.tsx` - Traspaso entre cuentas
   - `pages/admin/tesoreria/Arqueo.tsx` - Proceso de arqueo

3. [ ] Actualizar rutas y navegación

**Entregable:** Módulo de tesorería funcional en frontend

---

### Fase 7: Testing e Integración (2 días)

**Tareas:**

1. [ ] Probar flujo completo:
   - Crear pedido → verificar movimiento automático
   - Completar reserva → verificar movimiento automático
   - Registrar gasto → marcar pagado → verificar movimiento

2. [ ] Verificar dashboards con datos reales
3. [ ] Probar arqueo de caja
4. [ ] Revisar alertas y notificaciones
5. [ ] Corregir bugs encontrados

**Entregable:** Sistema integrado y probado

---

### Resumen de Tiempos

| Fase | Descripción | Días Estimados |
|------|-------------|----------------|
| 1 | Base de Datos | 1-2 |
| 2 | Backend - Modelos | 1 |
| 3 | Backend - Control de Gestión | 2-3 |
| 4 | Backend - Tesorería | 2-3 |
| 5 | Frontend - Control de Gestión | 3-4 |
| 6 | Frontend - Tesorería | 3-4 |
| 7 | Testing e Integración | 2 |
| **Total** | | **14-19 días** |

---

## 9. Consideraciones Técnicas

### 9.1 Sin Cambios en Stack

El stack actual es completamente adecuado para esta ampliación:

- **React + TypeScript + Vite:** Soporta los nuevos componentes sin problemas
- **FastAPI + Pydantic:** Ideal para los nuevos endpoints RESTful
- **Supabase PostgreSQL:** Soporta los nuevos tipos ENUM y triggers
- **Recharts:** Ya disponible para los dashboards (usado en Dashboard.tsx existente)

### 9.2 Nuevas Dependencias (ninguna)

No se requieren nuevas dependencias. Todo lo necesario ya está en el proyecto:

- Gráficos: `recharts` ✓
- Tablas: `@tanstack/react-table` o componente Table de shadcn ✓
- Formularios: shadcn/ui ✓
- Upload de archivos: Supabase Storage ✓

### 9.3 Estructura de Archivos Backend

```python
# Organización recomendada para nuevos routers

backend/app/
├── routers/
│   ├── gestion/
│   │   ├── __init__.py
│   │   ├── categorias.py
│   │   ├── proveedores.py
│   │   ├── gastos.py
│   │   └── dashboard.py
│   │
│   └── tesoreria/
│       ├── __init__.py
│       ├── cuentas.py
│       ├── movimientos.py
│       ├── arqueos.py
│       └── dashboard.py
│
├── models/
│   ├── gestion.py      # Schemas control de gestión
│   └── tesoreria.py    # Schemas tesorería
│
└── services/
    ├── gestion.py      # Lógica de negocio P&L
    └── tesoreria.py    # Lógica movimientos automáticos
```

### 9.4 Patrones de Código

Mantener consistencia con el código existente:

```python
# Backend - Ejemplo de router siguiendo patrón existente

from fastapi import APIRouter, Depends, HTTPException
from app.core.database import get_supabase
from app.models.gestion import ExpenseCreate, ExpenseResponse

router = APIRouter(prefix="/gestion/gastos", tags=["Control de Gestión"])

@router.get("", response_model=list[ExpenseResponse])
async def listar_gastos(
    fecha_desde: date = None,
    fecha_hasta: date = None,
    categoria_id: str = None,
    pagina: int = 1,
    por_pagina: int = 20
):
    supabase = get_supabase()
    query = supabase.table('expenses').select('*, category:expense_categories(*), vendor:vendors(*)')
    
    if fecha_desde:
        query = query.gte('date', fecha_desde.isoformat())
    if fecha_hasta:
        query = query.lte('date', fecha_hasta.isoformat())
    if categoria_id:
        query = query.eq('category_id', categoria_id)
    
    # Paginación
    offset = (pagina - 1) * por_pagina
    query = query.range(offset, offset + por_pagina - 1)
    query = query.order('date', desc=True)
    
    result = query.execute()
    return result.data
```

```typescript
// Frontend - Ejemplo de hook siguiendo patrón existente

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Expense, ExpenseCreate } from '@/types';

export function useGastos(filters?: {
  fecha_desde?: string;
  fecha_hasta?: string;
  categoria_id?: string;
}) {
  return useQuery({
    queryKey: ['gastos', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.fecha_desde) params.append('fecha_desde', filters.fecha_desde);
      if (filters?.fecha_hasta) params.append('fecha_hasta', filters.fecha_hasta);
      if (filters?.categoria_id) params.append('categoria_id', filters.categoria_id);
      
      const response = await api.get(`/gestion/gastos?${params}`);
      return response.data as Expense[];
    }
  });
}

export function useCrearGasto() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: ExpenseCreate) => {
      const response = await api.post('/gestion/gastos', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] });
      queryClient.invalidateQueries({ queryKey: ['gestion-dashboard'] });
    }
  });
}
```

---

## Anexo: Comandos de Desarrollo

### Ejecutar migraciones

```bash
# Conectar a Supabase y ejecutar SQL
# Opción 1: Desde Supabase Dashboard → SQL Editor
# Opción 2: Usando supabase CLI
supabase db push
```

### Iniciar desarrollo

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8001

# Frontend
cd frontend
npm run dev
```

### Verificar nuevos endpoints

```bash
# Abrir documentación API
open http://localhost:8001/docs
```

---

> **Documento generado para The Lobby Beauty**  
> **Ampliación: Control de Gestión + Tesorería**  
> **Fecha:** Noviembre 2025
