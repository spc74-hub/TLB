# The Lobby Beauty (TLB) — Plataforma integral para centro de belleza

## Overview

The Lobby Beauty es una aplicación web completa para la gestión de un centro de belleza especializado en productos naturales y libres de tóxicos. Combina:

- **Página pública** — Catálogo de servicios, tienda online, reservas de citas
- **Panel de administración** — Dashboard, agenda, CRM, pedidos, ERP (gastos/tesorería), cuenta de resultados

Destinada a la propietaria del centro y sus clientas. El frontend es la cara pública + backoffice; el backend gestiona toda la lógica de negocio.

## Architecture

| Capa | Stack |
|------|-------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Radix UI, React Query, Framer Motion, Recharts |
| Backend | Python 3.11, FastAPI, asyncpg (PostgreSQL directo), Pydantic v2 |
| Base de datos | PostgreSQL 16 (Supabase como host, acceso directo vía asyncpg) |
| Pagos | Stripe (checkout sessions + webhooks) |
| Email | Resend (confirmaciones de reservas y pedidos) |
| WhatsApp | Twilio Sandbox (confirmaciones de citas) |
| Auth | Cloudflare Access (producción), usuario hardcodeado (desarrollo) |
| Deployment | Docker (VPS Hostinger), Nginx reverse proxy |
| Dominio | tlb.spcapps.com |

**Repositorio:** spc74-hub/TLB

### Estructura del repositorio

```
TLB/
├── frontend/          # React SPA (Vite)
│   ├── src/
│   │   ├── pages/     # 17 páginas públicas + 11 admin
│   │   ├── components/# UI components (Radix + custom)
│   │   ├── context/   # Auth, Cart, Wishlist
│   │   ├── hooks/     # React Query hooks
│   │   ├── lib/       # API client, utils
│   │   └── types/     # TypeScript types
│   ├── Dockerfile     # Multi-stage (node → nginx)
│   └── nginx.conf     # SPA routing
├── backend/           # FastAPI API
│   ├── app/
│   │   ├── routers/   # 12 routers (servicios, reservas, productos, pagos, pedidos, clientes, gastos, tesoreria, ingresos, usuarios, whatsapp, cuenta_resultados)
│   │   ├── models/    # Pydantic schemas (959 líneas)
│   │   ├── services/  # Email y WhatsApp
│   │   ├── core/      # Config, database
│   │   └── db/        # QueryBuilder asyncpg (reemplaza Supabase client)
│   └── Dockerfile     # Python 3.11 + uvicorn
├── database/          # Scripts SQL de migración
└── docs/              # Documentación
```

## Features

### Página pública
- **Home** — Hero con carrusel de imágenes, categorías de servicios, beneficios
- **Catálogo de servicios** — Filtro por categoría, búsqueda, toggle "solo naturales", info regulación UE
- **Detalle de servicio** — Precio, duración, certificaciones TPO/DMPT-free, servicios relacionados
- **Tienda online** — Grid de productos con filtros (categoría, natural, vegano, oferta), buscador
- **Detalle de producto** — Imagen con zoom, badges (natural/vegano/cruelty-free), ingredientes, reseñas, compartir
- **Carrito** — Cantidades, envío gratis >50€ (sino 4,95€), progreso hacia envío gratis
- **Checkout** — Integración Stripe (redirect o embedded)
- **Reservas** — Wizard 4 pasos: elegir servicio → fecha/hora → datos personales → confirmación
- **Favoritos** — Wishlist persistida en localStorage
- **Login/Registro** — Formularios con validación, recuperar contraseña
- **Perfil** — Datos personales, historial de citas
- **Nosotros / Contacto** — Páginas informativas

### Panel de administración
- **Dashboard** — KPIs, ventas recientes, gráficos (Recharts), próximas citas
- **Agenda** — Calendario de citas con drag-drop (@dnd-kit), vistas día/semana
- **Empleados** — CRUD de profesionales con especialidades
- **Servicios** — CRUD con categorías, precios, duración, imágenes
- **Productos** — CRUD con stock, imágenes, categorías, flags (natural/vegano)
- **Pedidos** — Lista con filtros por estado, cambio de estado, registro de cobros
- **Clientes (CRM)** — Base de clientes, etiquetas, marketing opt-in/out, importar/exportar CSV, historial
- **Usuarios** — Gestión de usuarios con roles (admin/profesional/cliente)
- **Ingresos** — Estadísticas de revenue (mensual, semanal, diario, por tipo)
- **Gastos (ERP)** — Categorías, proveedores, gastos recurrentes, marcar como pagado
- **Tesorería** — Cuentas (efectivo/banco), movimientos, transferencias, cierres de caja
- **Cuenta de Resultados** — P&L dashboard con ingresos vs gastos, márgenes

### Integraciones
- **Stripe** — Checkout sessions, payment intents, webhooks para confirmar pagos
- **Resend** — Emails HTML con confirmación de reserva, confirmación de pedido, notificación admin
- **Twilio** — WhatsApp sandbox para confirmación/cancelación de citas
- **CRM automático** — Cada reserva/pedido crea o actualiza cliente automáticamente

## Database schema

### Tablas principales

| Tabla | Descripción | Campos clave |
|-------|-------------|--------------|
| `servicios` | Catálogo de servicios | nombre, categoria, duracion_minutos, precio, es_libre_toxicos, activo |
| `perfiles` | Perfiles de usuario (extiende auth.users) | nombre, telefono, rol (cliente/admin/profesional) |
| `reservas` | Citas de clientes | usuario_id, servicio_id, fecha, hora, estado, notas |
| `resenas` | Valoraciones de servicios | usuario_id, servicio_id, puntuacion (1-5), comentario |
| `productos` | Catálogo de productos | nombre, categoria, precio, stock, natural, vegano, cruelty_free |
| `categorias_productos` | Categorías de productos | nombre, slug, icono, orden |
| `pedidos` | Pedidos e-commerce | email, total, estado, stripe_session_id, metodo_cobro_tipo |
| `pedido_items` | Líneas de pedido | pedido_id, producto_id, cantidad, precio_unitario |
| `clientes` | Maestro CRM | nombre, email, telefono, origen, acepta_marketing, etiquetas[], total_reservas, total_pedidos |
| `cliente_reservas_link` | Vinculación cliente↔reserva | cliente_id, reserva_id |
| `cliente_pedidos_link` | Vinculación cliente↔pedido | cliente_id, pedido_id |
| `campanas` | Campañas de marketing | nombre, canal, estado, filtros_segmentacion (JSONB) |
| `campana_envios` | Tracking de envíos | campana_id, cliente_id, estado, destinatario |
| `expense_categories` | Categorías de gastos | nombre, categoria_base (enum), color, icono |
| `vendors` | Proveedores | nombre, nif_cif, email, telefono, dirección |
| `expenses` | Gastos | concepto, importe, fecha, pagado, es_recurrente, frecuencia |
| `cash_accounts` | Cuentas de caja | nombre, tipo (efectivo/banco), balance_actual |
| `cash_movements` | Movimientos de caja | cuenta_id, tipo (ingreso/gasto), importe, referencia_tipo |
| `cash_closings` | Cierres de caja diarios | cuenta_id, fecha, balance_apertura, cierre_teorico, cierre_real, diferencia |

### Relaciones clave
- `reservas` → `perfiles` (usuario_id) + `servicios` (servicio_id)
- `pedido_items` → `pedidos` + `productos`
- `clientes` ↔ `reservas` via `cliente_reservas_link`
- `clientes` ↔ `pedidos` via `cliente_pedidos_link`
- `expenses` → `expense_categories` + `vendors` + `cash_accounts`
- `cash_movements` → `cash_accounts` + `pedidos`/`reservas`/`expenses`

## API endpoints

Base: `/api/v1`

| Router | Prefijo | Endpoints principales |
|--------|---------|----------------------|
| Servicios | `/servicios` | GET / (list+filtros), GET /:id, POST, PUT, DELETE |
| Reservas | `/reservas` | GET / (filtros fecha/estado), GET /disponibilidad, POST, PUT, POST /:id/cancelar |
| Productos | `/productos` | GET / (filtros+paginación), GET /categorias, GET /destacados, GET /ofertas, POST, PUT, DELETE, PATCH /:id/stock, POST /:id/imagen |
| Pagos | `/pagos` | POST /create-checkout-session, POST /create-payment-intent, POST /webhook, GET /config, GET /verify-session/:id |
| Pedidos | `/pedidos` | GET / (filtros estado), GET /stats, GET /recientes, GET /pendientes-cobro, PATCH /:id/estado, POST /:id/cobro |
| Clientes | `/clientes` | GET / (búsqueda+filtros), GET /stats, GET /etiquetas, POST, PUT, DELETE, POST /importar, GET /exportar/csv |
| Gastos | `/gastos` | CRUD gastos + CRUD categorías + CRUD proveedores, POST /:id/marcar-pagado, GET /stats |
| Tesorería | `/tesoreria` | CRUD cuentas, GET/POST movimientos, POST /transferencia, GET/POST cierres, GET /stats |
| Ingresos | `/ingresos` | GET /stats (revenue mensual/semanal/diario/por tipo) |
| Usuarios | `/usuarios` | GET / (filtros), POST, GET /:id, PUT, DELETE, POST /:id/reset-password |
| WhatsApp | `/whatsapp` | POST /test, GET /config |
| Cuenta Resultados | `/cuenta-resultados` | Dashboard P&L, evolución mensual |

## Auth

- **Producción:** Cloudflare Access protege el dominio completo. No hay login propio.
- **Desarrollo:** Usuario hardcodeado en `AuthContext.tsx` (sergio.porcar@gmail.com, rol admin).
- **Roles:** `cliente`, `admin`, `profesional` — almacenados en tabla `perfiles`.
- **Rutas protegidas:** `ProtectedRoute` componente que valida auth + rol antes de renderizar.
- **Backend:** JWT configurado (HS256, 30min) pero sin middleware de validación activo — la auth se delega a Cloudflare Access.

## Deployment

- **Tipo:** Docker en VPS Hostinger (72.62.26.203)
- **Contenedores:** Frontend (nginx:1.27-alpine, puerto 80), Backend (python:3.11-slim, uvicorn puerto 8000)
- **Dominio:** tlb.spcapps.com (Cloudflare Tunnel)
- **Proxy:** Nginx reverse proxy (infraestructura centralizada spcapps-infra)
- **Base de datos:** PostgreSQL 16 compartido (container spcapps-postgres)
- **Auto-deploy:** Webhook en GitHub → pull + build + restart
- **Variables de entorno:** DATABASE_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, CORS_ORIGINS

## Key files

| Fichero | Descripción |
|---------|-------------|
| `backend/app/main.py` | Entry point FastAPI, registro de routers, CORS, static files |
| `backend/app/db/compat.py` | QueryBuilder asyncpg (reemplaza Supabase client SDK) |
| `backend/app/models/schemas.py` | Todos los modelos Pydantic (959 líneas) |
| `backend/app/routers/reservas.py` | Lógica de reservas con validación disponibilidad + notificaciones |
| `backend/app/routers/pagos.py` | Integración Stripe (checkout + webhooks) |
| `backend/app/routers/clientes.py` | CRM completo con import/export CSV |
| `backend/app/routers/tesoreria.py` | Tesorería: cuentas, movimientos, cierres (805 líneas) |
| `backend/app/routers/cuenta_resultados.py` | P&L dashboard (1063 líneas) |
| `frontend/src/App.tsx` | Definición de rutas (públicas + admin) |
| `frontend/src/lib/api.ts` | Cliente API tipado (todas las llamadas al backend) |
| `frontend/src/context/AuthContext.tsx` | Estado de autenticación |
| `frontend/src/context/CartContext.tsx` | Carrito con persistencia localStorage |
| `frontend/src/pages/Reservar.tsx` | Wizard de reservas 4 pasos |
| `frontend/src/pages/admin/Dashboard.tsx` | Dashboard principal con KPIs |
| `database/001_schema.sql` | Schema principal (servicios, reservas, perfiles, reseñas) |
| `database/erp_tesoreria_schema.sql` | Schema ERP y tesorería |

## Backlog

Resumen de tareas pendientes. Ver [docs/BACKLOG.md](docs/BACKLOG.md) para detalle completo.

**Prioridad Alta:** Configurar Resend API key, middleware de autenticación JWT en backend, despliegue final a VPS.
**Prioridad Media:** Campañas de marketing (CRM), cierres de caja operativos, previsión de liquidez, sistema de reseñas de productos.
**Prioridad Baja:** Rate limiting, logging de requests, tests automatizados, internacionalización.

## Conventions

- Commits en inglés, comunicación y documentación en español
- When making changes, update this CLAUDE.md
- Al completar items del backlog, marcar en docs/BACKLOG.md y documentar en docs/CHANGELOG.md
- Frontend: componentes en PascalCase, hooks con `use` prefix, API calls en `lib/api.ts`
- Backend: routers por módulo en `app/routers/`, schemas en `app/models/schemas.py`
- Nombres de tablas y campos en español (excepto tablas ERP que usan inglés)
- Colores del diseño: crudo (beige), salvia (verde), terracota, carbon
- Fuentes: Playfair Display (títulos), Inter (cuerpo)

## Documentation

Ver `docs/` para documentación detallada:
- [docs/USER_GUIDE.md](docs/USER_GUIDE.md) — Guía funcional del usuario
- [docs/PROCESSES.md](docs/PROCESSES.md) — Flujos de negocio con diagramas mermaid
- [docs/CHANGELOG.md](docs/CHANGELOG.md) — Historial de cambios
- [docs/BACKLOG.md](docs/BACKLOG.md) — Tareas pendientes por prioridad
- [docs/AMPLIACION_ERP_TESORERIA.md](docs/AMPLIACION_ERP_TESORERIA.md) — Especificación módulos ERP
- [docs/DOCUMENTACION_TECNICA.md](docs/DOCUMENTACION_TECNICA.md) — Documentación técnica legacy
