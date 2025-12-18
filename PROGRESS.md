# The Lobby Beauty - Progreso del Proyecto

> Última actualización: 2025-11-27 - Módulo P&L (Ingresos) y Tesorería con Cobros

## Resumen del Proyecto

Aplicación web para centro de belleza con sistema de reservas y ecommerce de productos naturales.

---

## Fase 1: Backend y Base de Datos ✅ COMPLETADO

### 1.1 Configuración Base de Datos
- [x] Configurar Supabase/PostgreSQL
- [x] Crear tablas de usuarios (perfiles)
- [x] Crear tablas de servicios y categorías
- [x] Crear tablas de productos y categorías
- [x] Crear tablas de reservas
- [x] Crear tablas de pedidos
- [x] Configurar Row Level Security (RLS)
- [x] Poblar datos de ejemplo (seed)

### 1.2 API Backend (FastAPI)
- [x] Configurar conexión a base de datos (Supabase)
- [ ] Endpoints de autenticación (registro, login, logout)
- [x] Endpoints CRUD de servicios
- [x] Endpoints CRUD de productos
- [x] Endpoints de reservas
- [ ] Endpoints de pedidos
- [x] Validación y manejo de errores

### 1.3 Frontend conectado a Supabase
- [x] Cliente Supabase configurado
- [x] Tienda carga productos desde BD
- [x] Detalle de producto desde BD
- [x] Servicios cargan desde BD
- [x] Detalle de servicio desde BD

### 1.4 Autenticación ✅ COMPLETADO
- [x] Integrar Supabase Auth
- [x] Login con email/password
- [x] Registro con confirmación por email
- [x] Protección de rutas en frontend
- [x] Estado de sesión en navbar
- [x] Página de perfil de usuario
- [x] Recuperación de contraseña (UI) ✅

---

## Fase 2: Funcionalidades de Ecommerce ✅ COMPLETADO

### 2.1 Pasarela de Pago ✅ COMPLETADO
- [x] Integrar Stripe (checkout session)
- [x] Página de pago exitoso
- [x] Redirección a Stripe Checkout
- [x] Webhook de Stripe para confirmar pagos
- [x] Crear pedido en BD cuando se paga

### 2.2 Proceso de Checkout ✅ COMPLETADO
- [x] Formulario de datos de envío (antes del pago)
- [x] Resumen de pedido (en carrito)
- [x] Confirmación de pago (página éxito)
- [x] Página de éxito/error

### 2.3 Gestión de Pedidos ✅ COMPLETADO
- [x] Crear pedido en base de datos
- [x] Estados de pedido (pendiente, pagado, enviado, entregado)
- [x] Historial de pedidos del usuario (en perfil)
- [x] Lista de pedidos en admin `/admin/pedidos`

### 2.4 Notificaciones (Resend - AL FINAL)
- [x] Sistema de emails implementado (código listo)
- [ ] Configurar cuenta Resend y API key
- [ ] Email de confirmación de pedido
- [ ] Email de confirmación de cita
- [ ] Recordatorio 24h antes de cita

---

## Fase 3: Sistema de Agenda Interna ✅ COMPLETADO

### 3.1 Backend de Agenda
- [x] Tabla de empleados en BD
- [x] Campo empleado_id en reservas
- [x] Campo es_interno en servicios (público vs interno)
- [x] Horarios 10:00-22:00 todos los días
- [x] Funciones CRUD para empleados y citas
- [x] RLS basada en roles (admin, profesional, cliente)

### 3.2 Página de Agenda
- [x] Vista semanal con calendario de horas
- [x] Crear/editar/eliminar citas
- [x] Filtro por empleado (admin)
- [x] Modal de nueva cita con selección de empleado, servicio, fecha y hora
- [x] Validación de disponibilidad por empleado
- [x] Colores por empleado en calendario
- [x] Arrastrar y soltar citas (drag & drop) ✅
- [x] Filtro por estado de cita (activas, pendientes, completadas, etc.) ✅
- [x] Cambio de estado en tiempo real desde modal ✅
- [x] Citas completadas/canceladas con texto tachado ✅
- [x] Filtro "Sin asignar" para citas sin empleado ✅
- [x] Estado "Pendiente" para nuevas citas ✅
- [ ] Vista diaria (opcional)

### 3.3 Roles y Permisos
- [x] Admin: ve todas las citas, puede crear/editar/eliminar
- [x] Profesional: ve solo sus citas, puede editar las suyas
- [x] ProtectedRoute con verificación de rol
- [x] Panel de gestión de empleados `/admin/empleados`

### 3.4 Confirmaciones (Resend - AL FINAL)
- [x] Código de email de confirmación de cita (listo)
- [x] Código de email de cancelación (listo)
- [ ] Configurar API key de Resend
- [ ] Recordatorio 24h antes
- [ ] SMS de recordatorio (opcional)

---

## Fase 4: Panel de Administración ✅ COMPLETADO

### 4.1 Dashboard
- [x] Layout con sidebar colapsable
- [x] Vista general de estadísticas (citas, empleados, servicios, productos)
- [x] Citas del día/semana
- [x] Acciones rápidas
- [x] Pedidos recientes ✅
- [x] Gráfico de ingresos ✅

### 4.2 Gestión de Contenido ✅ COMPLETADO
- [x] CRUD de servicios (con campo es_interno) `/admin/servicios`
- [x] CRUD de productos `/admin/productos`
- [x] Gestión de empleados `/admin/empleados`
- [x] Subida de imágenes (productos/servicios) ✅
- [ ] Gestión de categorías

### 4.3 Gestión de Pedidos
- [ ] Lista de pedidos `/admin/pedidos`
- [ ] Actualizar estados
- [ ] Gestión de envíos

---

## Fase 5: Mejoras de UX ✅ COMPLETADO

### 5.1 Contenido Visual
- [ ] Imágenes reales de productos
- [ ] Fotos del local/equipo
- [ ] Optimización de imágenes

### 5.2 Cuenta de Usuario
- [x] Página de perfil
- [x] Historial de pedidos
- [x] Historial de citas ✅
- [x] Editar datos personales
- [x] Recuperación de contraseña (UI) ✅

### 5.3 Funcionalidades Extra ✅ COMPLETADO
- [x] Lista de favoritos/wishlist ✅
- [x] Reseñas de productos ✅
- [x] Compartir en redes sociales ✅
- [ ] Newsletter

### 5.4 UX/UI Mejorado ✅ COMPLETADO
- [x] Vista diaria en agenda ✅
- [x] Exportar datos a Excel/CSV ✅
- [x] Animaciones de transición (framer-motion) ✅
- [x] Skeleton loaders mientras carga ✅

### 5.5 SEO ✅ COMPLETADO
- [x] Meta tags dinámicos (react-helmet-async) ✅
- [x] Sitemap XML ✅
- [x] Open Graph para redes sociales ✅

---

## Fase 6: Despliegue 🔲 AL FINAL

### 6.1 Preparación
- [ ] Variables de entorno de producción
- [ ] Optimización de build
- [ ] Tests básicos

### 6.2 Opciones de Hosting (GRATIS o muy barato)

**Opción A: Todo en servicios gratuitos (RECOMENDADO)**
- Frontend: **Vercel** (gratis, dominio .vercel.app incluido)
- Backend: **Render** (gratis, se "duerme" tras 15min sin uso) o **Railway** (5$ gratis/mes)
- BD: **Supabase** (ya lo tenemos, gratis hasta 500MB)
- Dominio: Usar subdominios gratuitos o comprar dominio (~10€/año)

**Opción B: Usar hosting existente**
- Si tu hosting actual soporta Node.js o tiene acceso SSH, podríamos deployar ahí
- Necesitaría saber qué tipo de hosting tienes (cPanel, Plesk, VPS...)

**Opción C: Nuevo dominio separado**
- Comprar dominio nuevo (~10€/año en Namecheap/Porkbun)
- Usar servicios gratuitos de Opción A
- No afecta a tu web actual

### 6.3 Post-lanzamiento
- [ ] Monitorización de errores (Sentry - gratis)
- [ ] Analytics (Google Analytics / Plausible)
- [ ] SEO básico

---

## Completado ✅

### Frontend Base (2025-11-25)
- [x] Estructura del proyecto React + TypeScript + Vite
- [x] Diseño con Tailwind CSS + shadcn/ui
- [x] Página Home con carrusel de imágenes
- [x] Catálogo de servicios
- [x] Página de detalle de servicio
- [x] Formulario de reservas (UI)
- [x] Página Nosotros
- [x] Página Contacto
- [x] Tienda con catálogo de productos
- [x] Página de detalle de producto
- [x] Carrito de compra con persistencia (localStorage)
- [x] Navegación responsive con menú móvil
- [x] Icono de carrito con contador

### Backend Base (2025-11-25)
- [x] Estructura FastAPI
- [x] Esquema de base de datos SQL
- [x] Datos de ejemplo (seed)

### Repositorio (2025-11-25)
- [x] Repositorio GitHub creado (privado)
- [x] .gitignore configurado
- [x] Commits iniciales

### Autenticación (2025-11-25)
- [x] AuthContext con estado global de sesión
- [x] Página de Login con validación
- [x] Página de Registro con confirmación por email
- [x] Componente ProtectedRoute para rutas privadas
- [x] Header actualizado con menú de usuario
- [x] Página de perfil con edición de datos
- [x] Traducciones de errores de Supabase al español

### Sistema de Reservas (2025-11-25)
- [x] Funciones de reservas en supabase.ts
- [x] Página Reservar conectada a Supabase
- [x] Carga servicios y categorías desde BD
- [x] Horarios dinámicos según configuración en BD
- [x] Verificación de disponibilidad (reservas existentes)
- [x] Bloqueo de días sin horario y días bloqueados
- [x] Creación de reserva en base de datos
- [x] Pre-rellenado de datos si usuario logueado
- [x] Muestra número de reserva tras confirmar

### Sistema de Agenda Interna (2025-11-25)
- [x] Esquema SQL para empleados (database/agenda_schema.sql)
- [x] Campo empleado_id en reservas
- [x] Campo es_interno en servicios
- [x] Horarios 10:00-22:00 todos los días
- [x] Tipo Empleado y funciones CRUD en supabase.ts
- [x] Funciones de agenda: getCitasRango, getCitasEmpleado, getCitasDia, crearCita, actualizarCita, eliminarCita
- [x] Página Agenda.tsx con vista semanal
- [x] Modal para crear/editar citas
- [x] Filtro por empleado (admin)
- [x] ProtectedRoute actualizado con verificación de roles
- [x] Ruta /agenda protegida para admin y profesional

### Panel de Administración (2025-11-25)
- [x] AdminLayout con sidebar colapsable (desktop/mobile)
- [x] Dashboard con estadísticas en tiempo real
- [x] Acciones rápidas y próximas citas
- [x] Rutas /admin y /admin/agenda protegidas
- [x] Navegación entre secciones admin
- [x] CRUD de empleados `/admin/empleados`
- [x] CRUD de servicios `/admin/servicios` (con campo es_interno)
- [x] CRUD de productos `/admin/productos`

### Integración Stripe (2025-11-25)
- [x] Cuenta Stripe creada y configurada
- [x] Backend: router de pagos con create-checkout-session
- [x] Frontend: botón "Finalizar compra" en carrito
- [x] Redirección a Stripe Checkout
- [x] Página de pago exitoso `/pago-exitoso`
- [x] Carrito se vacía tras pago exitoso

### Sistema de Emails (2025-11-25)
- [x] Servicio de email con Resend implementado
- [x] Plantilla HTML de confirmación de cita
- [x] Plantilla HTML de cancelación de cita
- [x] Plantilla HTML de recordatorio (para cron)
- [x] Envío en background (no bloquea API)
- [ ] Pendiente: configurar API key de Resend

### Sistema de Ecommerce Completo (2025-11-25)
- [x] Página de Checkout con formulario de datos de envío
- [x] Datos de envío se envían a Stripe metadata
- [x] Webhook de Stripe `/api/v1/pagos/webhook`
- [x] Creación automática de pedido en BD al confirmar pago
- [x] Items del pedido guardados en pedido_items
- [x] Historial de pedidos en página de perfil (expandible)
- [x] Panel admin `/admin/pedidos` con:
  - Lista de pedidos con filtros
  - Cambio de estado (pagado, preparando, enviado, entregado)
  - Estadísticas (total, pendientes, enviados, ventas)
  - Modal de detalle con productos y dirección
- [x] SQL para políticas RLS de pedidos (database/add_pedidos_rls.sql)

### Sistema de Imágenes (2025-11-26)
- [x] Configuración de Supabase Storage (database/setup_storage.sql)
- [x] Bucket 'imagenes' con políticas RLS
- [x] Funciones subirImagenProducto y subirImagenServicio en supabase.ts
- [x] UI de subida de imágenes en admin/Productos.tsx
- [x] UI de subida de imágenes en admin/Servicios.tsx
- [x] Visualización de imágenes en páginas públicas:
  - Tienda.tsx (listado de productos)
  - ProductoDetalle.tsx (detalle de producto)
  - Servicios.tsx (via ServiceCard component)
  - ServicioDetalle.tsx (detalle de servicio)
  - ServiceCard.tsx (variante featured)

### Sistema de Reservas Cliente (2025-11-26)
- [x] Página `/reservar` con flujo de 4 pasos
- [x] Selección de servicio con filtro por categoría
- [x] Calendario con días bloqueados y sin horario deshabilitados
- [x] Visualización de horarios disponibles y ocupados
  - Horarios ocupados en gris y tachados (no seleccionables)
  - Horarios disponibles seleccionables
- [x] Formulario de datos del cliente (nombre, email, teléfono, notas)
- [x] Pre-relleno de datos si usuario logueado
- [x] Confirmación de reserva con número de reserva
- [x] Función `generarTodosHorarios()` con info de disponibilidad
- [x] Scripts SQL para RLS de reservas (database/fix_reservas.sql, fix_reservas_disponibilidad.sql)

### Mejoras Agenda Admin (2025-11-26)
- [x] Drag & drop para reagendar citas (@dnd-kit/core)
- [x] Pre-rellenado automático de hora al editar cita existente
- [x] Filtro "Sin asignar" para ver citas sin empleado
- [x] Estado "Pendiente" para nuevas citas (indicador amarillo)
- [x] Filtro por estado (Activas, Todas, Pendientes, Confirmadas, Completadas, Canceladas)
- [x] Cambio de estado en tiempo real con feedback visual inmediato
- [x] Citas completadas/canceladas con texto tachado y opacidad reducida
- [x] Indicadores visuales de estado en citas (puntos de colores)
- [x] Función `getCitasSinAsignar()` en supabase.ts

### UX/UI Mejorado (2025-11-26)
- [x] Vista diaria en agenda con navegación por día
- [x] Exportar datos a Excel/CSV en panel admin (pedidos, citas, empleados)
- [x] Animaciones de transición con framer-motion
- [x] Skeleton loaders:
  - ProductSkeleton.tsx para productos
  - ServiceSkeleton.tsx para servicios
  - AgendaSkeleton.tsx para agenda
- [x] Lista de favoritos/wishlist:
  - WishlistContext.tsx con persistencia localStorage
  - Página Favoritos.tsx (`/favoritos`)
  - Botón de favoritos en ProductCard y ProductoDetalle
  - Corazón en header con contador
- [x] Reseñas de productos:
  - ProductReviews.tsx con sistema de estrellas
  - Ordenación por fecha/valoración
  - Integrado en ProductoDetalle.tsx

### SEO y Social (2025-11-26)
- [x] Meta tags dinámicos con react-helmet-async:
  - SEO.tsx componente reutilizable
  - HelmetProvider en main.tsx
  - SEO en Home, Tienda, Servicios, ProductoDetalle
- [x] Sitemap XML (`/public/sitemap.xml`)
- [x] robots.txt (`/public/robots.txt`)
- [x] Open Graph y Twitter Cards para compartir
- [x] Botones de compartir en redes sociales:
  - ShareButtons.tsx (Facebook, Twitter, WhatsApp, Email)
  - Copiar enlace al portapapeles
  - Integrado en ProductoDetalle.tsx

### Funcionalidades Usuario (2025-11-26)
- [x] Historial de citas en página de perfil:
  - Sección "Mis Citas" en Perfil.tsx
  - Estado visual con badges de colores
  - Cancelación de citas futuras
  - Indica si la cita es hoy o ya pasó
- [x] Recuperación de contraseña:
  - RecuperarPassword.tsx página completa
  - Formulario de email con validación
  - Integración con Supabase resetPasswordForEmail
  - Estado de éxito con instrucciones
  - Ruta `/recuperar-password` en App.tsx

### Sistema de Notificaciones (2025-11-26)
- [x] Notificaciones de reserva vía backend API:
  - Frontend ahora llama a la API del backend en lugar de insertar directamente en Supabase
  - Corrección de mapeo de campos (cliente_email → email_cliente, etc.)
  - usuario_id ahora opcional para permitir reservas sin autenticación
- [x] Servicio de WhatsApp con Twilio:
  - `backend/app/services/whatsapp.py` - Plantillas de mensajes
  - `backend/app/routers/whatsapp.py` - Endpoints para envío
  - Confirmación de cita por WhatsApp
  - Cancelación de cita por WhatsApp
- [x] Email de confirmación con Resend (código listo)
- [x] Notificaciones se envían en background (no bloquean la respuesta)

### Sistema CRM de Clientes (2025-11-26)
- [x] Base de datos CRM:
  - `database/crm_schema.sql` - Tablas clientes, campanas, campana_envios
  - Tipos: origen_cliente, estado_campana, canal_comunicacion, estado_envio
  - Links para vincular clientes con reservas y pedidos
  - RLS policies para acceso admin
- [x] Migración de datos existentes:
  - `database/crm_migration.sql` - Script de migración
  - Importa clientes desde reservas (por email/teléfono)
  - Importa clientes desde pedidos (via perfiles)
  - Vincula usuarios registrados con clientes
  - Crea links automáticos a reservas/pedidos
- [x] Backend API:
  - `backend/app/routers/clientes.py` - Router completo
  - CRUD de clientes con búsqueda y filtros
  - Estadísticas de clientes
  - Gestión de etiquetas para segmentación
  - Opt-in/opt-out de marketing
  - Importación CSV (auto-detección de delimitador: coma, punto y coma, tabulador)
  - Exportación a CSV con filtros
  - Schemas Pydantic en `models/schemas.py`
- [x] Frontend Admin:
  - `frontend/src/pages/admin/Clientes.tsx` - Página completa
  - Lista de clientes con filtros (marketing, origen, etiquetas)
  - Búsqueda por nombre, email, teléfono
  - Estadísticas: total, acepta marketing, por origen
  - CRUD completo con modales
  - Ficha de cliente con historial
  - Importar/exportar CSV
  - Descarga de plantilla CSV

### Sistema CRM Opt-in Marketing (2025-11-27) ✅
- [x] Checkbox opt-in marketing en página de reservas (`/reservar`)
- [x] Checkbox opt-in marketing en checkout (`/checkout`)
- [x] Backend: actualizar cliente con opt-in al crear reserva/pedido
  - Función `crear_o_actualizar_cliente_crm()` en `reservas.py`
  - Se ejecuta en background task tras crear reserva
  - Crea cliente nuevo o actualiza existente (por email)
  - Vincula reserva/pedido al cliente via link tables
  - Incrementa contadores (total_reservas, total_pedidos)
- [ ] Sistema de campañas de email/WhatsApp (router + página admin) - PENDIENTE

---

## Fase 7: Ampliación ERP y Tesorería ✅ EN PROGRESO

> **Documento de especificación:** `/docs/AMPLIACION_ERP_TESORERIA.md`
> **Estimación total:** 14-19 días de desarrollo

Esta ampliación añade dos nuevos módulos al sistema:
1. **Control de Gestión (Mini-ERP):** Registro de gastos, categorías, proveedores, dashboard P&L
2. **Tesorería:** Cuentas de caja, movimientos, cierres diarios, previsión de liquidez

### 7.1 Base de Datos (1-2 días) ✅ COMPLETADO
- [x] Crear archivo `database/erp_tesoreria_schema.sql`
- [x] Nuevos ENUMs:
  - `categoria_gasto` (nominas, alquiler, suministros, marketing, productos, formacion, otros)
  - `tipo_cuenta` (efectivo, banco)
  - `tipo_movimiento` (ingreso, gasto)
  - `referencia_movimiento` (pedido, reserva, gasto, ajuste, cierre)
  - `frecuencia_recurrencia` (semanal, quincenal, mensual, bimestral, trimestral, anual)
- [x] Tabla `expense_categories` - Categorías de gastos personalizables
- [x] Tabla `vendors` - Proveedores
- [x] Tabla `expenses` - Gastos con soporte de recurrencia
- [x] Tabla `cash_accounts` - Cuentas de caja (efectivo, banco)
- [x] Tabla `cash_movements` - Movimientos de caja
- [x] Tabla `cash_closings` - Cierres de caja diarios
- [x] Triggers para actualizar balances automáticamente
- [x] Políticas RLS para acceso admin
- [x] Índices para optimización de consultas
- [x] `database/add_cobro_fields_pedidos.sql` - Campos de cobro en pedidos

### 7.2 Modelos Backend (1 día) ✅ COMPLETADO
- [x] Schemas Pydantic en `backend/app/models/schemas.py`:
  - ExpenseCategory, ExpenseCategoryCreate, ExpenseCategoryUpdate
  - Vendor, VendorCreate, VendorUpdate
  - Expense, ExpenseCreate, ExpenseUpdate, ExpenseWithDetails
  - CashAccount, CashAccountCreate, CashAccountUpdate
  - CashMovement, CashMovementCreate, CashMovementWithDetails
  - CashClosing, CashClosingCreate, CashClosingWithDetails
  - PLDashboardData, LiquidityForecast
  - CashStats (con ingresos_mes, gastos_mes, num_movimientos_mes)

### 7.3 Backend Control de Gestión (2-3 días) ✅ COMPLETADO
- [x] Router `backend/app/routers/gastos.py`:
  - CRUD categorías de gastos
  - CRUD proveedores
  - CRUD gastos con filtros (fecha, categoría, proveedor)
  - Generación automática de gastos recurrentes
  - Estadísticas por categoría/período
- [x] Router `backend/app/routers/ingresos.py`:
  - Ingresos desde pedidos y reservas
  - Estadísticas de ingresos por período
  - Top clientes y productos
- [ ] Router `backend/app/routers/dashboard_gestion.py`:
  - Dashboard P&L (ingresos vs gastos)
  - Comparativa mensual/anual
  - Desglose por categorías
  - Métricas de ticket medio, margen, etc.
- [x] Registrar routers en `main.py`

### 7.4 Backend Tesorería (2-3 días) ✅ COMPLETADO
- [x] Router `backend/app/routers/tesoreria.py`:
  - CRUD cuentas de caja
  - CRUD movimientos de caja
  - Transferencias entre cuentas
  - Cierres de caja diarios
  - Balance por cuenta
  - Previsión de liquidez (próximos 30 días)
  - Estadísticas mensuales (cobros/pagos del mes)
- [x] Sistema de cobros en pedidos.py:
  - Endpoint POST `/{pedido_id}/cobro` para registrar cobro
  - Endpoint GET `/pendientes-cobro` para pedidos sin cobrar
  - Endpoint GET `/stats-cobro` para estadísticas de cobro
  - Distinción entre P&L (devengado) y Tesorería (caja)
- [x] Registrar router en `main.py`

### 7.5 Frontend Control de Gestión (3-4 días) ✅ COMPLETADO
- [x] Página `/admin/gastos`:
  - Lista de gastos con filtros y búsqueda
  - Modal crear/editar gasto
  - Vista de gastos recurrentes
  - Gestión de categorías (sub-modal)
  - Gestión de proveedores (sub-modal)
  - Exportación a CSV/Excel
- [x] Página `/admin/ingresos`:
  - Lista de ingresos (pedidos + reservas)
  - Estadísticas de ingresos
  - Filtros por período y fuente
- [ ] Página `/admin/dashboard-gestion` (Cuenta de Resultados):
  - Gráfico P&L (ingresos vs gastos)
  - Selector de período (mes/trimestre/año)
  - KPIs: margen bruto, ticket medio, gastos por categoría
  - Comparativa con período anterior
  - Top gastos del período
- [x] Actualizar `AdminLayout.tsx` con nuevas rutas
- [x] Actualizar `App.tsx` con rutas protegidas

### 7.6 Frontend Tesorería (3-4 días) ✅ COMPLETADO
- [x] Página `/admin/tesoreria`:
  - Panel de cuentas con balances actuales
  - Lista de movimientos con filtros
  - Modal crear movimiento manual
  - Modal transferencia entre cuentas
  - KPIs: Cobros Mes, Pagos Mes, Pte. Cobrar, Movimientos
  - Modal de cobro desde pedidos pendientes
- [ ] Página `/admin/cierres`:
  - Calendario de cierres
  - Proceso de cierre diario
  - Historial de cierres con detalles
  - Validación de descuadres
- [ ] Widget de previsión de liquidez:
  - Gráfico de balance proyectado
  - Alertas de liquidez baja
  - Gastos recurrentes pendientes
- [x] Actualizar `AdminLayout.tsx` y `App.tsx`
- [x] Cobro desde página de Pedidos:
  - Columna "Cobrado" en tabla de pedidos
  - Botón "Cobrar" para pedidos pendientes
  - Modal de registro de cobro (efectivo, tarjeta, TPV, transferencia)
  - Estado de cobro en detalle de pedido

### 7.7 Testing e Integración (2 días) 🔲
- [ ] Tests de endpoints de gastos
- [ ] Tests de endpoints de tesorería
- [ ] Tests de triggers de balance
- [ ] Verificar integración con webhook Stripe
- [ ] Verificar captura de ingresos de reservas
- [ ] Tests E2E de flujos principales
- [ ] Documentación de APIs nuevas

---

## Tareas Pendientes (Backlog Anterior)

### Emails (Resend) - PENDIENTE
- [ ] Crear cuenta Resend
- [ ] Configurar API key
- [ ] Activar emails de confirmación de citas
- [ ] Email de confirmación de pedido
- [ ] Recordatorio 24h antes de cita

### CRM - PENDIENTE
- [ ] Sistema de campañas de email/WhatsApp (router + página admin)

### Despliegue - PENDIENTE
- [ ] Elegir opción de hosting
- [ ] Configurar variables de entorno producción
- [ ] Deploy frontend y backend
- [ ] Configurar dominio

---

## Notas y Decisiones

### Stack Tecnológico
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** FastAPI (Python)
- **Base de datos:** PostgreSQL (Supabase)
- **Autenticación:** Supabase Auth
- **Pagos:** Stripe ✅
- **Email:** Resend (código listo, pendiente API key)
- **Hosting:** Por decidir (ver opciones en Fase 6)

### Paleta de Colores
- Salvia (verde): Principal
- Terracota: Acentos/ofertas
- Crudo: Fondos
- Carbon: Textos

### Rutas de Administración
- `/admin` - Dashboard principal ✅
- `/admin/agenda` - Gestión de citas ✅
- `/admin/servicios` - CRUD servicios ✅
- `/admin/productos` - CRUD productos ✅
- `/admin/empleados` - CRUD empleados ✅
- `/admin/pedidos` - Gestión de pedidos ✅
- `/admin/clientes` - CRM de clientes ✅
- `/admin/gastos` - Gestión de gastos (ERP) 🔲
- `/admin/dashboard-gestion` - Dashboard P&L (ERP) 🔲
- `/admin/tesoreria` - Cuentas y movimientos 🔲
- `/admin/cierres` - Cierres de caja 🔲
- `/admin/configuracion` - (próximamente)

---

## Plan de Trabajo Actual

### PASO 1: Completar Ecommerce ✅ COMPLETADO
1. [x] Formulario de datos de envío antes del checkout
2. [x] Webhook de Stripe para confirmar pagos
3. [x] Crear pedido en BD cuando pago confirmado
4. [x] Historial de pedidos del usuario
5. [x] Lista de pedidos en `/admin/pedidos`

### PASO 2: Mejoras Admin Panel ✅ COMPLETADO
6. [x] Subida de imágenes (productos/servicios)
7. [x] Gráfico de ingresos en dashboard ✅
8. [x] Pedidos recientes en dashboard ✅

### PASO 3: UX/Cuenta de Usuario ✅ COMPLETADO
9. [x] Historial de citas del usuario ✅
10. [x] Recuperación de contraseña (UI) ✅

### PASO 4: Despliegue (AL FINAL)
11. [ ] Elegir opción de hosting
12. [ ] Configurar variables de entorno
13. [ ] Deploy frontend y backend
14. [ ] Configurar dominio

---

## Backlog (Funcionalidades Opcionales)

### Agenda
- [x] Vista diaria en agenda ✅
- [x] Arrastrar y soltar citas (drag & drop) ✅
- [ ] Recordatorios SMS (24h antes)

### Dashboard Admin
- [x] Exportar datos a Excel/CSV ✅

### UX/UI
- [ ] Modo oscuro
- [x] Animaciones de transición ✅
- [x] Skeleton loaders mientras carga ✅

### Clientes
- [x] Lista de favoritos/wishlist ✅
- [x] Reseñas de productos ✅
- [ ] Newsletter con suscripción

### SEO y Marketing
- [x] Meta tags dinámicos ✅
- [x] Sitemap XML ✅
- [x] Open Graph para redes sociales ✅
- [x] Compartir en redes sociales ✅

### Integraciones
- [ ] Google Calendar sync
- [x] WhatsApp Business API (Twilio)
- [ ] Google Analytics / Plausible

### Emails (Resend)
- [ ] Crear cuenta Resend
- [ ] Configurar API key
- [ ] Activar emails de confirmación de citas
- [ ] Email de confirmación de pedido
- [ ] Recordatorio 24h antes de cita

---

## Estadísticas del Proyecto

### Líneas de Código (2025-11-27)
| Componente | Líneas |
|------------|--------|
| Frontend (React/TypeScript) | 22,023 |
| Backend (Python/FastAPI) | 7,399 |
| Database (SQL) | 3,929 |
| CSS | 126 |
| **TOTAL** | **33,477** |

### Estimación de Esfuerzo

**Cálculo basado en productividad de desarrollador full-stack nivel medio:**
- Productividad estimada: ~100-150 líneas de código funcional/día (incluyendo debugging, testing, documentación)
- Se considera: diseño, implementación, integración de APIs, configuración BD, etc.

| Métrica | Valor |
|---------|-------|
| Líneas totales | 33,477 |
| Días estimados (a 125 LOC/día) | **~268 días** |
| Jornadas de 8h | **~268 jornadas** |
| Semanas laborales (5 días) | **~54 semanas** |
| Meses (22 días/mes) | **~12.2 meses** |

### Estimación de Costes (50 EUR/hora)

| Concepto | Cálculo | Coste |
|----------|---------|-------|
| Jornadas totales | 268 días × 8h = 2,144 horas | |
| **Coste total estimado** | 2,144h × 50€/h | **107,200 EUR** |

> **Nota:** Esta estimación incluye:
> - Sistema completo de ecommerce con Stripe
> - Sistema de reservas con agenda interna
> - Panel de administración completo
> - Autenticación y roles de usuario
> - Integración con Supabase, Stripe, Resend, Twilio
> - SEO, PWA-ready, diseño responsive
> - Notificaciones por email y WhatsApp
> - **Sistema CRM completo con importación CSV**
> - **Módulo de Gastos con proveedores y recurrencia**
> - **Módulo de Tesorería con cuentas, movimientos y cobros**
> - **Módulo de Ingresos (P&L) con tracking de pedidos/reservas**
