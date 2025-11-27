# The Lobby Beauty - Documentación Técnica Completa

> **Versión:** 1.0
> **Fecha:** Noviembre 2025
> **Proyecto:** Sistema integral de gestión para centro de belleza

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Modelo de Datos](#5-modelo-de-datos)
6. [API REST - Endpoints](#6-api-rest---endpoints)
7. [Frontend - Páginas y Componentes](#7-frontend---páginas-y-componentes)
8. [Integraciones Externas](#8-integraciones-externas)
9. [Flujos de Negocio](#9-flujos-de-negocio)
10. [Seguridad](#10-seguridad)
11. [Variables de Entorno](#11-variables-de-entorno)

---

## 1. Resumen Ejecutivo

**The Lobby Beauty** es una aplicación web completa para la gestión de un centro de belleza que incluye:

- **Sistema de Reservas Online** - Citas con calendario, disponibilidad en tiempo real
- **E-commerce** - Tienda online con carrito, favoritos y pagos con Stripe
- **Panel de Administración** - Gestión de servicios, productos, pedidos y agenda
- **CRM** - Base de datos de clientes con segmentación y campañas de marketing
- **Notificaciones** - Email (Resend) y WhatsApp (Twilio) automáticas

### Funcionalidades Principales

| Módulo | Funcionalidades |
|--------|-----------------|
| **Reservas** | Selección de servicio, fecha/hora, confirmación automática, recordatorios |
| **E-commerce** | Catálogo de productos, carrito persistente, wishlist, checkout con Stripe |
| **Admin** | Dashboard, CRUD de servicios/productos, gestión de pedidos, agenda interna |
| **CRM** | Gestión de clientes, etiquetas, opt-in marketing, importar/exportar CSV |
| **Notificaciones** | Confirmación de citas, cancelaciones, confirmación de pedidos |

---

## 2. Stack Tecnológico

### Frontend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React | 19.2.0 | Framework UI |
| TypeScript | 5.9.3 | Tipado estático |
| Vite | 6.3.5 | Build tool y dev server |
| Tailwind CSS | 3.4.18 | Estilos utility-first |
| shadcn/ui | - | Componentes Radix UI |
| React Router | 7.9.6 | Navegación SPA |
| TanStack Query | 5.90.10 | Cache y estado servidor |
| Framer Motion | 12.23.24 | Animaciones |
| Recharts | 3.5.0 | Gráficos del dashboard |
| Lucide React | 0.554.0 | Iconografía |

### Backend

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Python | 3.11+ | Lenguaje principal |
| FastAPI | 0.115.5 | Framework API REST |
| Uvicorn | 0.32.1 | Servidor ASGI |
| Pydantic | 2.10.2 | Validación de datos |
| Supabase Client | 2.10.0 | Conexión a base de datos |

### Base de Datos y Servicios

| Servicio | Uso |
|----------|-----|
| **Supabase** | PostgreSQL + Auth + Storage + Realtime |
| **Stripe** | Procesamiento de pagos |
| **Resend** | Emails transaccionales |
| **Twilio** | Mensajes WhatsApp |

---

## 3. Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                         │
│  React 19 + TypeScript + Vite + Tailwind CSS                    │
│  ├── Páginas públicas (Home, Tienda, Reservar, etc.)            │
│  ├── Panel Admin (Dashboard, Agenda, Productos, etc.)           │
│  └── Contextos (Auth, Cart, Wishlist)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST + JSON
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI)                            │
│  Python 3.11 + Pydantic + Uvicorn                               │
│  ├── /api/v1/servicios    → CRUD servicios                      │
│  ├── /api/v1/productos    → CRUD productos                      │
│  ├── /api/v1/reservas     → Sistema de citas                    │
│  ├── /api/v1/pagos        → Integración Stripe                  │
│  ├── /api/v1/pedidos      → Gestión de órdenes                  │
│  ├── /api/v1/clientes     → CRM completo                        │
│  └── /api/v1/whatsapp     → Notificaciones Twilio               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Supabase Client
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Cloud)                            │
│  ├── PostgreSQL         → Base de datos relacional              │
│  ├── Auth               → Autenticación JWT                     │
│  ├── Storage            → Almacenamiento de imágenes            │
│  └── Row Level Security → Seguridad a nivel de fila             │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌─────────┐    ┌─────────┐    ┌─────────┐
        │ Stripe  │    │ Resend  │    │ Twilio  │
        │ (Pagos) │    │ (Email) │    │(WhatsApp)│
        └─────────┘    └─────────┘    └─────────┘
```

---

## 4. Estructura del Proyecto

```
TLB/
├── frontend/                          # Aplicación React
│   ├── src/
│   │   ├── assets/                    # Imágenes y recursos
│   │   ├── components/
│   │   │   ├── ui/                    # Componentes shadcn/ui (17)
│   │   │   ├── layout/                # Header, Footer, Layout
│   │   │   ├── admin/                 # AdminLayout
│   │   │   └── skeletons/             # Loading states
│   │   ├── context/
│   │   │   ├── AuthContext.tsx        # Autenticación
│   │   │   ├── CartContext.tsx        # Carrito
│   │   │   └── WishlistContext.tsx    # Favoritos
│   │   ├── hooks/
│   │   │   ├── useServicios.ts        # Queries de servicios
│   │   │   └── useReservas.ts         # Queries de reservas
│   │   ├── lib/
│   │   │   ├── supabase.ts            # Cliente Supabase
│   │   │   └── utils.ts               # Utilidades
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Servicios.tsx
│   │   │   ├── Tienda.tsx
│   │   │   ├── Reservar.tsx
│   │   │   ├── Checkout.tsx
│   │   │   ├── admin/                 # Páginas de administración
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Agenda.tsx
│   │   │   │   ├── Productos.tsx
│   │   │   │   ├── Pedidos.tsx
│   │   │   │   └── Clientes.tsx
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.ts                 # Cliente HTTP
│   │   ├── types/
│   │   │   └── index.ts               # Tipos TypeScript
│   │   ├── App.tsx                    # Router principal
│   │   └── main.tsx                   # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                           # API FastAPI
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py              # Configuración
│   │   │   └── database.py            # Conexión Supabase
│   │   ├── models/
│   │   │   └── schemas.py             # Modelos Pydantic
│   │   ├── routers/
│   │   │   ├── servicios.py           # /api/v1/servicios
│   │   │   ├── productos.py           # /api/v1/productos
│   │   │   ├── reservas.py            # /api/v1/reservas
│   │   │   ├── pagos.py               # /api/v1/pagos
│   │   │   ├── pedidos.py             # /api/v1/pedidos
│   │   │   ├── clientes.py            # /api/v1/clientes
│   │   │   └── whatsapp.py            # /api/v1/whatsapp
│   │   ├── services/
│   │   │   ├── email.py               # Integración Resend
│   │   │   └── whatsapp.py            # Integración Twilio
│   │   └── main.py                    # Aplicación FastAPI
│   ├── requirements.txt
│   └── .env
│
├── database/                          # Scripts SQL
│   ├── 001_schema.sql                 # Schema principal
│   ├── crm_schema.sql                 # Tablas CRM
│   ├── crm_migration.sql              # Migración datos CRM
│   └── agenda_schema.sql              # Tabla agenda
│
└── docs/                              # Documentación
    └── DOCUMENTACION_TECNICA.md
```

---

## 5. Modelo de Datos

### 5.1 Diagrama Entidad-Relación

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   auth.users    │       │    perfiles     │       │    clientes     │
│─────────────────│       │─────────────────│       │─────────────────│
│ id (UUID) PK    │──1:1──│ id (UUID) PK/FK │──1:1──│ id (UUID) PK    │
│ email           │       │ nombre          │       │ usuario_id FK   │
│ created_at      │       │ apellidos       │       │ nombre          │
└─────────────────┘       │ telefono        │       │ email           │
                          │ rol             │       │ telefono        │
                          └─────────────────┘       │ acepta_marketing│
                                                    │ etiquetas[]     │
                                                    │ total_reservas  │
                                                    │ total_pedidos   │
                                                    │ total_gastado   │
                                                    └────────┬────────┘
                                                             │
              ┌──────────────────────────────────────────────┼──────────────────────────────────────────────┐
              │                                              │                                              │
              ▼                                              ▼                                              ▼
┌─────────────────┐                           ┌─────────────────────────┐                    ┌─────────────────┐
│   servicios     │                           │ cliente_reservas_link   │                    │    pedidos      │
│─────────────────│                           │─────────────────────────│                    │─────────────────│
│ id (SERIAL) PK  │◄──┐                       │ cliente_id FK           │                    │ id (SERIAL) PK  │
│ nombre          │   │                       │ reserva_id FK           │                    │ usuario_id FK   │
│ descripcion     │   │                       └─────────────────────────┘                    │ estado          │
│ categoria       │   │                                   │                                  │ total           │
│ duracion_min    │   │                                   │                                  │ direccion_envio │
│ precio          │   │                                   ▼                                  │ created_at      │
│ precio_oferta   │   │                       ┌─────────────────┐                            └────────┬────────┘
│ activo          │   │                       │    reservas     │                                     │
│ destacado       │   │                       │─────────────────│                                     │
└─────────────────┘   │                       │ id (SERIAL) PK  │                                     │
                      └───────────────────────│ servicio_id FK  │                                     │
                                              │ usuario_id FK   │                                     │
                                              │ fecha           │                                     ▼
                                              │ hora            │                         ┌─────────────────────┐
                                              │ estado          │                         │   pedido_items      │
                                              │ nombre_cliente  │                         │─────────────────────│
                                              │ email_cliente   │                         │ id (SERIAL) PK      │
                                              │ telefono_cliente│                         │ pedido_id FK        │
                                              └─────────────────┘                         │ producto_id FK      │
                                                                                          │ cantidad            │
                                                                                          │ precio_unitario     │
┌─────────────────┐                                                                       └──────────┬──────────┘
│   productos     │                                                                                  │
│─────────────────│◄─────────────────────────────────────────────────────────────────────────────────┘
│ id (SERIAL) PK  │
│ nombre          │
│ descripcion     │
│ categoria       │
│ precio          │
│ precio_oferta   │
│ stock           │
│ es_natural      │
│ es_vegano       │
│ activo          │
│ destacado       │
└─────────────────┘
```

### 5.2 Tablas Principales

#### **servicios**
```sql
CREATE TABLE servicios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria categoria_servicio NOT NULL,  -- ENUM
    duracion_minutos INTEGER NOT NULL CHECK (duracion_minutos BETWEEN 15 AND 240),
    precio DECIMAL(10,2) NOT NULL,
    precio_oferta DECIMAL(10,2),
    es_libre_toxicos BOOLEAN DEFAULT false,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorías: manicura, pedicura, depilacion, cejas, pestanas
```

#### **productos**
```sql
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    descripcion_corta VARCHAR(200),
    categoria categoria_producto NOT NULL,  -- ENUM
    precio DECIMAL(10,2) NOT NULL,
    precio_oferta DECIMAL(10,2),
    imagen_url TEXT,
    imagenes_extra TEXT[],
    stock INTEGER DEFAULT 0,
    es_natural BOOLEAN DEFAULT false,
    es_vegano BOOLEAN DEFAULT false,
    es_cruelty_free BOOLEAN DEFAULT false,
    ingredientes TEXT[],
    modo_uso TEXT,
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorías: manicura, pedicura, facial, corporal, cabello, accesorios, kits
```

#### **reservas**
```sql
CREATE TABLE reservas (
    id SERIAL PRIMARY KEY,
    servicio_id INTEGER REFERENCES servicios(id),
    usuario_id UUID REFERENCES auth.users(id),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado estado_reserva DEFAULT 'pendiente',  -- ENUM
    nombre_cliente VARCHAR(100),
    email_cliente VARCHAR(255),
    telefono_cliente VARCHAR(20),
    notas TEXT,
    precio_total DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estados: pendiente, confirmada, completada, cancelada
```

#### **pedidos**
```sql
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id),
    estado estado_pedido DEFAULT 'pendiente',  -- ENUM
    total DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2),
    coste_envio DECIMAL(10,2) DEFAULT 0,

    -- Datos de envío
    nombre_envio VARCHAR(100),
    email_envio VARCHAR(255),
    telefono_envio VARCHAR(20),
    direccion_envio TEXT,
    ciudad_envio VARCHAR(100),
    codigo_postal_envio VARCHAR(10),
    provincia_envio VARCHAR(100),
    notas TEXT,

    -- Stripe
    stripe_session_id VARCHAR(255),
    stripe_payment_intent VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Estados: pendiente, pagado, enviado, entregado, cancelado
```

#### **clientes** (CRM)
```sql
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),

    -- Marketing
    acepta_marketing BOOLEAN DEFAULT false,
    fecha_opt_in TIMESTAMPTZ,
    fecha_opt_out TIMESTAMPTZ,

    -- Segmentación
    origen origen_cliente DEFAULT 'manual',  -- ENUM
    notas TEXT,
    etiquetas TEXT[],

    -- Estadísticas
    total_reservas INTEGER DEFAULT 0,
    total_pedidos INTEGER DEFAULT 0,
    total_gastado DECIMAL(10,2) DEFAULT 0,
    ultima_visita DATE,
    ultima_compra DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT email_o_telefono CHECK (email IS NOT NULL OR telefono IS NOT NULL)
);

-- Orígenes: web, tienda, importacion, manual, reserva, pedido
```

### 5.3 Enumeraciones (ENUMs)

```sql
-- Categorías de servicio
CREATE TYPE categoria_servicio AS ENUM (
    'manicura', 'pedicura', 'depilacion', 'cejas', 'pestanas'
);

-- Categorías de producto
CREATE TYPE categoria_producto AS ENUM (
    'manicura', 'pedicura', 'facial', 'corporal', 'cabello', 'accesorios', 'kits'
);

-- Estados de reserva
CREATE TYPE estado_reserva AS ENUM (
    'pendiente', 'confirmada', 'completada', 'cancelada'
);

-- Estados de pedido
CREATE TYPE estado_pedido AS ENUM (
    'pendiente', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado'
);

-- Roles de usuario
CREATE TYPE rol_usuario AS ENUM (
    'cliente', 'admin', 'profesional'
);

-- Origen de cliente (CRM)
CREATE TYPE origen_cliente AS ENUM (
    'web', 'tienda', 'importacion', 'manual', 'reserva', 'pedido'
);
```

---

## 6. API REST - Endpoints

**URL Base:** `http://localhost:8001/api/v1`

### 6.1 Servicios (`/servicios`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/servicios` | Listar servicios con filtros | No |
| GET | `/servicios/{id}` | Obtener servicio por ID | No |
| POST | `/servicios` | Crear servicio | Admin |
| PUT | `/servicios/{id}` | Actualizar servicio | Admin |
| DELETE | `/servicios/{id}` | Eliminar servicio | Admin |

**Parámetros GET /servicios:**
- `categoria` - Filtrar por categoría
- `solo_activos` - Solo servicios activos (default: true)
- `solo_libre_toxicos` - Solo libre de tóxicos
- `pagina` - Número de página
- `por_pagina` - Items por página

### 6.2 Productos (`/productos`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/productos` | Listar productos con filtros | No |
| GET | `/productos/{id}` | Obtener producto por ID | No |
| GET | `/productos/categorias` | Listar categorías con conteo | No |
| POST | `/productos` | Crear producto | Admin |
| PUT | `/productos/{id}` | Actualizar producto | Admin |
| DELETE | `/productos/{id}` | Eliminar producto | Admin |

**Parámetros GET /productos:**
- `categoria`, `busqueda`, `solo_activos`
- `solo_naturales`, `solo_veganos`
- `solo_ofertas`, `solo_destacados`
- `pagina`, `por_pagina`

### 6.3 Reservas (`/reservas`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/reservas` | Listar reservas | Admin |
| GET | `/reservas/disponibilidad` | Horarios disponibles | No |
| GET | `/reservas/{id}` | Obtener reserva | Usuario |
| POST | `/reservas` | Crear reserva | No |
| PUT | `/reservas/{id}` | Actualizar reserva | Admin |
| POST | `/reservas/{id}/cancelar` | Cancelar reserva | Usuario |

**Parámetros GET /reservas/disponibilidad:**
- `servicio_id` - ID del servicio (requerido)
- `fecha` - Fecha a consultar (requerido)

**Retorna:** Lista de horarios disponibles (ej: ["09:00", "09:30", "10:00", ...])

### 6.4 Pagos (`/pagos`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/pagos/create-checkout-session` | Crear sesión Stripe | No |
| POST | `/pagos/webhook` | Webhook de Stripe | Stripe |
| GET | `/pagos/session/{session_id}` | Estado de sesión | No |

**Body POST /pagos/create-checkout-session:**
```json
{
  "items": [
    {
      "producto_id": 1,
      "nombre": "Esmalte Natural",
      "precio": 12.50,
      "cantidad": 2,
      "imagen_url": "https://..."
    }
  ],
  "datos_envio": {
    "nombre": "Juan",
    "apellidos": "García",
    "email": "juan@email.com",
    "telefono": "612345678",
    "direccion": "Calle Mayor 1",
    "ciudad": "Valencia",
    "codigo_postal": "46001",
    "provincia": "Valencia",
    "notas": "Dejar en portería",
    "acepta_marketing": true
  },
  "success_url": "https://thelobbybeauty.com/pago-exitoso?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://thelobbybeauty.com/checkout"
}
```

### 6.5 Pedidos (`/pedidos`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/pedidos` | Listar pedidos | Admin |
| GET | `/pedidos/stats` | Estadísticas de ventas | Admin |
| GET | `/pedidos/{id}` | Obtener pedido | Admin/Usuario |
| PUT | `/pedidos/{id}` | Actualizar estado | Admin |

**Respuesta GET /pedidos/stats:**
```json
{
  "total_pedidos": 156,
  "total_ventas": 4523.50,
  "pedidos_pendientes": 5,
  "pedidos_hoy": 3,
  "ventas_7_dias": [
    {"fecha": "2025-11-21", "total": 245.00},
    {"fecha": "2025-11-22", "total": 380.50},
    ...
  ]
}
```

### 6.6 Clientes - CRM (`/clientes`)

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/clientes` | Listar clientes | Admin |
| GET | `/clientes/stats` | Estadísticas CRM | Admin |
| GET | `/clientes/etiquetas` | Listar etiquetas | Admin |
| GET | `/clientes/{id}` | Cliente con historial | Admin |
| POST | `/clientes` | Crear cliente | Admin |
| PUT | `/clientes/{id}` | Actualizar cliente | Admin |
| DELETE | `/clientes/{id}` | Eliminar cliente | Admin |
| POST | `/clientes/{id}/opt-in` | Activar marketing | Admin |
| POST | `/clientes/{id}/opt-out` | Desactivar marketing | Admin |
| POST | `/clientes/importar` | Importar CSV | Admin |
| GET | `/clientes/exportar/csv` | Exportar a CSV | Admin |
| GET | `/clientes/exportar/plantilla` | Descargar plantilla | Admin |

**Parámetros GET /clientes:**
- `busqueda` - Buscar por nombre, email o teléfono
- `acepta_marketing` - true/false
- `etiqueta` - Filtrar por etiqueta
- `origen` - Filtrar por origen
- `pagina`, `por_pagina`

---

## 7. Frontend - Páginas y Componentes

### 7.1 Rutas Públicas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | Home | Página principal con servicios destacados |
| `/servicios` | Servicios | Catálogo de servicios con filtros |
| `/servicios/:id` | ServicioDetalle | Detalle de un servicio |
| `/tienda` | Tienda | Catálogo de productos |
| `/tienda/:id` | ProductoDetalle | Detalle de un producto |
| `/carrito` | Carrito | Carrito de compras |
| `/favoritos` | Favoritos | Lista de deseos |
| `/checkout` | Checkout | Proceso de pago |
| `/pago-exitoso` | PagoExitoso | Confirmación de compra |
| `/reservar` | Reservar | Sistema de reservas |
| `/nosotros` | Nosotros | Información de la empresa |
| `/contacto` | Contacto | Formulario de contacto |
| `/login` | Login | Inicio de sesión |
| `/registro` | Registro | Registro de usuarios |
| `/perfil` | Perfil | Perfil del usuario (protegida) |
| `/agenda` | Agenda | Mis citas (protegida) |

### 7.2 Rutas de Administración

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/admin` | Dashboard | Panel principal con métricas |
| `/admin/agenda` | Agenda | Gestión de citas del día |
| `/admin/empleados` | Empleados | Gestión de personal |
| `/admin/servicios` | Servicios | CRUD de servicios |
| `/admin/productos` | Productos | CRUD de productos |
| `/admin/pedidos` | Pedidos | Gestión de pedidos |
| `/admin/clientes` | Clientes | CRM completo |

### 7.3 Componentes UI (shadcn/ui)

- `Button`, `Input`, `Label`, `Textarea`
- `Card`, `Dialog`, `AlertDialog`
- `Select`, `Switch`, `Checkbox`
- `Table`, `Badge`, `Separator`
- `Calendar`, `Popover`, `DropdownMenu`
- `Progress`, `Skeleton`

### 7.4 Contextos de Estado

#### AuthContext
```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  perfil: Perfil | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registro: (data: RegistroData) => Promise<void>;
  logout: () => Promise<void>;
}
```

#### CartContext
```typescript
interface CartContextType {
  items: CartItem[];
  total: number;
  cantidadTotal: number;
  agregarProducto: (producto: Producto, cantidad?: number) => void;
  eliminarProducto: (productoId: number) => void;
  actualizarCantidad: (productoId: number, cantidad: number) => void;
  vaciarCarrito: () => void;
}
```

#### WishlistContext
```typescript
interface WishlistContextType {
  items: Producto[];
  agregarALista: (producto: Producto) => void;
  eliminarDeLista: (productoId: number) => void;
  estaEnLista: (productoId: number) => boolean;
}
```

---

## 8. Integraciones Externas

### 8.1 Stripe (Pagos)

**Funcionalidades:**
- Crear sesiones de Checkout
- Procesar webhooks de pago completado
- Crear pedidos automáticamente tras pago exitoso

**Flujo de pago:**
1. Frontend envía items y datos de envío a `/pagos/create-checkout-session`
2. Backend crea sesión en Stripe y devuelve URL
3. Usuario completa pago en Stripe Checkout
4. Stripe envía webhook a `/pagos/webhook`
5. Backend crea pedido y envía confirmación

### 8.2 Resend (Email)

**Funciones disponibles:**
```python
enviar_confirmacion_reserva(email, nombre, servicio, fecha, hora, duracion, precio)
enviar_cancelacion_reserva(email, nombre, servicio, fecha, hora)
enviar_confirmacion_pedido(email, nombre, numero_pedido, items, total)
```

**Plantillas HTML incluidas con estilos de la marca.**

### 8.3 Twilio (WhatsApp)

**Funciones disponibles:**
```python
enviar_confirmacion_cita(telefono, nombre, servicio, fecha, hora, duracion)
enviar_cancelacion_cita(telefono, nombre, servicio, fecha, hora)
```

**Nota:** Requiere sandbox de Twilio configurado. Los usuarios deben enviar "join business-rabbit" a +1 415 523 8886 antes de recibir mensajes.

---

## 9. Flujos de Negocio

### 9.1 Flujo de Reserva

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Selecciona  │───▶│  Elige fecha │───▶│   Datos de   │───▶│  Confirmación│
│   Servicio   │    │    y hora    │    │   contacto   │    │    de cita   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                   │
                    ┌──────────────────────────────────────────────┘
                    ▼
            ┌───────────────┐
            │ Notificaciones│
            │───────────────│
            │ • Email       │
            │ • WhatsApp    │
            │ • CRM update  │
            └───────────────┘
```

### 9.2 Flujo de Compra

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Agregar    │───▶│   Revisar    │───▶│   Checkout   │───▶│    Stripe    │
│  al carrito  │    │    carrito   │    │  (datos env) │    │   Checkout   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                   │
                    ┌──────────────────────────────────────────────┘
                    ▼
            ┌───────────────┐         ┌───────────────┐
            │    Webhook    │────────▶│ Crear pedido  │
            │    Stripe     │         │  + CRM update │
            └───────────────┘         └───────────────┘
                                              │
                                              ▼
                                      ┌───────────────┐
                                      │ Email confirm │
                                      └───────────────┘
```

### 9.3 Flujo CRM (Opt-in Marketing)

```
                    ┌─────────────────────────────────┐
                    │     Cliente marca checkbox      │
                    │   "Acepto comunicaciones..."    │
                    └────────────────┬────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    Reservar     │       │    Checkout     │       │   Admin CRM     │
│  /reservar page │       │  /checkout page │       │ /admin/clientes │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   ▼
                    ┌─────────────────────────────────┐
                    │  crear_o_actualizar_cliente_crm │
                    │─────────────────────────────────│
                    │ • Busca cliente por email       │
                    │ • Si existe: actualiza datos    │
                    │   - Solo cambia marketing F→T   │
                    │ • Si no: crea nuevo cliente     │
                    │ • Vincula reserva/pedido        │
                    └─────────────────────────────────┘
```

---

## 10. Seguridad

### 10.1 Autenticación

- **Supabase Auth** con JWT tokens
- Sesiones persistentes con refresh automático
- Protección de rutas en frontend con `ProtectedRoute`

### 10.2 Autorización

- **Roles:** cliente, admin, profesional
- Verificación de rol en rutas de admin
- RLS (Row Level Security) en Supabase

### 10.3 Row Level Security (RLS)

```sql
-- Ejemplo: usuarios solo ven sus propias reservas
CREATE POLICY "Usuarios ven sus reservas" ON reservas
    FOR SELECT USING (auth.uid() = usuario_id);

-- Admins ven todo
CREATE POLICY "Admins ven todas las reservas" ON reservas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM perfiles
            WHERE id = auth.uid() AND rol = 'admin'
        )
    );
```

### 10.4 CORS

Configurado en FastAPI:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://thelobbybeauty.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 11. Variables de Entorno

### Backend (.env)

```env
# Supabase
SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxx

# Resend (Email)
RESEND_API_KEY=re_xxxxxx

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=xxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# CORS
CORS_ORIGINS=http://localhost:5173,https://thelobbybeauty.com
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8001/api/v1
VITE_SUPABASE_URL=https://xxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxx
```

---

## Anexo: Comandos de Desarrollo

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

### URLs de desarrollo

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8001/api/v1
- **API Docs:** http://localhost:8001/docs
- **Health Check:** http://localhost:8001/health

---

> Documento generado automáticamente para The Lobby Beauty
> Última actualización: Noviembre 2025
