# The Lobby Beauty — Guía del Usuario

## Introducción

The Lobby Beauty es la plataforma web de un centro de belleza especializado en tratamientos naturales y libres de tóxicos. La aplicación tiene dos partes:

1. **Zona pública** — Para las clientas: ver servicios, comprar productos, reservar citas
2. **Panel de administración** — Para la propietaria y profesionales: gestionar el negocio

---

## Zona Pública

### Página de Inicio

La página principal muestra:
- **Carrusel de imágenes** — 6 imágenes rotativas del centro
- **Categorías de servicios** — Acceso rápido a manicura, pedicura, depilación, cejas, pestañas
- **Beneficios** — Información sobre productos naturales y la filosofía del centro
- **Llamadas a la acción** — Botones para reservar cita o visitar la tienda

### Catálogo de Servicios (`/servicios`)

Muestra todos los servicios activos del centro, organizados por categoría.

**Funcionalidades:**
- Filtrar por categoría (manicura, pedicura, depilación, cejas, pestañas)
- Buscar por nombre
- Toggle "Solo productos naturales" para ver únicamente servicios libres de tóxicos
- Cada tarjeta muestra: nombre, categoría, duración, precio y badge de certificación
- Información sobre regulación europea de productos de belleza

**Detalle del servicio** (`/servicios/:id`):
- Descripción completa del servicio
- Precio y duración estimada
- Características incluidas
- Certificaciones (libre de TPO, libre de DMPT)
- Servicios relacionados
- Botones "Reservar cita" y "Consultar"

### Tienda Online (`/tienda`)

Catálogo de productos de belleza natural disponibles para compra online.

**Funcionalidades:**
- Grid de productos con imagen, precio y badges
- Filtrar por categoría (manicura, pedicura, facial, corporal, cabello, accesorios, kits)
- Buscador de productos
- Filtros adicionales: solo natural, solo vegano, en oferta
- Indicador de stock (deshabilitado si agotado)
- Botón de favoritos (corazón) en cada producto
- Botón "Añadir al carrito" con feedback visual

**Detalle del producto** (`/tienda/:id`):
- Imagen del producto con zoom
- Precio (con descuento si aplica, muestra precio original tachado)
- Badges: Natural, Vegano, Cruelty-free
- Selector de cantidad
- Ingredientes y modo de uso
- Reseñas de otros clientes (puntuación 1-5 estrellas)
- Productos relacionados
- Botones de compartir en redes sociales
- Info de envío: gratis a partir de 50€, entrega en 24-48h, devoluciones en 30 días

### Carrito de Compra (`/carrito`)

Gestión del carrito de compra antes de proceder al pago.

**Funcionalidades:**
- Lista de productos con imagen, nombre, precio y cantidad
- Modificar cantidad de cada producto (+ / -)
- Eliminar producto individual
- Vaciar carrito completo
- Cálculo automático de gastos de envío:
  - **Gratis** si el total supera 50€
  - **4,95€** en caso contrario
- Barra de progreso hacia el envío gratuito
- Resumen del pedido (subtotal + envío + total)
- Botón "Proceder al pago"
- El carrito se persiste en el navegador (no se pierde al cerrar la pestaña)

### Checkout (`/checkout`)

Proceso de pago integrado con Stripe.

**Flujo:**
1. Se muestra el resumen del pedido
2. Se introducen los datos de envío (dirección completa)
3. Se redirige a la página de pago de Stripe
4. Tras el pago exitoso, se redirige a la página de confirmación

**Página de éxito** (`/pago-exitoso`):
- Confirmación visual del pedido
- Número de referencia
- Se envía email de confirmación automáticamente (si Resend está configurado)

### Reserva de Citas (`/reservar`)

Sistema de reservas en 4 pasos.

**Paso 1 — Elegir servicio:**
- Lista de servicios activos agrupados por categoría
- Cada servicio muestra nombre, precio y duración
- Se puede preseleccionar un servicio desde la página de detalle (parámetro URL)

**Paso 2 — Elegir fecha y hora:**
- Calendario visual para seleccionar día
- Los días sin disponibilidad aparecen deshabilitados
- Horarios disponibles en franjas de 30 minutos (9:00 - 20:00)
- Los horarios ocupados aparecen deshabilitados
- Se tiene en cuenta la duración del servicio para calcular disponibilidad

**Paso 3 — Datos personales:**
- Nombre completo (obligatorio)
- Email (obligatorio)
- Teléfono (obligatorio)
- Notas adicionales (opcional)
- Checkbox de opt-in para marketing
- Si el usuario está logueado, los datos se prerellenan

**Paso 4 — Confirmación:**
- Resumen completo de la cita (servicio, fecha, hora, precio)
- Número de referencia de la reserva
- Se envía confirmación por email y WhatsApp (si están configurados)
- El cliente se crea o actualiza automáticamente en el CRM

### Favoritos (`/favoritos`)

Lista de productos marcados como favoritos.

**Funcionalidades:**
- Ver todos los productos guardados
- Eliminar de favoritos
- Añadir al carrito directamente
- Los favoritos se persisten en el navegador (localStorage)

### Perfil (`/perfil`) — Requiere login

Página de perfil del usuario autenticado.
- Ver y editar datos personales (nombre, email, teléfono)
- Historial de citas realizadas

### Mi Agenda (`/agenda`) — Requiere login

Vista de las citas del usuario.
- Próximas citas con detalle
- Opción de cancelar citas pendientes

### Login y Registro

**Login** (`/login`):
- Email y contraseña
- Mostrar/ocultar contraseña
- Enlace a recuperar contraseña
- Enlace a registro

**Registro** (`/registro`):
- Nombre, email, contraseña
- Indicador de fortaleza de contraseña
- Aceptación de términos

**Recuperar contraseña** (`/recuperar-password`):
- Introducir email para recibir enlace de reset

---

## Panel de Administración (`/admin`)

Accesible solo para usuarios con rol `admin` o `profesional`.

### Dashboard (`/admin`)

Vista general del negocio con KPIs y métricas.

**Contenido:**
- Tarjetas de KPIs: ventas del día, pedidos pendientes, citas de hoy, nuevos clientes
- Gráfico de ventas (últimos 7 días) con Recharts
- Lista de pedidos recientes
- Próximas citas del día
- Accesos rápidos a los módulos principales

### Agenda (`/admin/agenda`)

Calendario de citas del centro.

**Funcionalidades:**
- Vista por día y semana
- Arrastrar y soltar citas para reprogramar (@dnd-kit)
- Filtrar por estado (pendiente, confirmada, completada, cancelada)
- Crear nueva cita manualmente
- Ver detalle de cada cita
- Cambiar estado de citas

### Empleados (`/admin/empleados`)

Gestión de los profesionales del centro.

**Funcionalidades:**
- Listado de empleados con nombre, rol y especialidades
- Crear nuevo empleado
- Editar datos del empleado
- Asignar especialidades (categorías de servicios)

### Servicios (`/admin/servicios`)

CRUD completo de servicios.

**Funcionalidades:**
- Tabla con todos los servicios (activos e inactivos)
- Crear servicio: nombre, categoría, descripción, duración, precio, imagen, flag libre de tóxicos
- Editar servicio existente
- Activar/desactivar servicio (soft delete)
- Subir imagen del servicio

### Productos (`/admin/productos`)

CRUD completo de productos.

**Funcionalidades:**
- Tabla con todos los productos
- Crear producto: nombre, categoría, descripción, precio, stock, imagen
- Flags: natural, vegano, cruelty-free, destacado, en oferta
- Precio de oferta (si está en oferta)
- Gestión de stock
- Subir imagen del producto

### Pedidos (`/admin/pedidos`)

Gestión de pedidos e-commerce.

**Funcionalidades:**
- Lista de pedidos con filtros por estado
- Estados: pendiente, pagado, enviado, entregado, cancelado
- Ver detalle del pedido (cliente, productos, cantidades, precios)
- Cambiar estado del pedido (flujo: pendiente → pagado → enviado → entregado)
- Registrar cobro: seleccionar método de pago (efectivo, tarjeta, TPV, transferencia)
- El cobro genera automáticamente un movimiento de caja en tesorería
- Estadísticas: pedidos pendientes de cobro, total por cobrar

### Clientes / CRM (`/admin/clientes`)

Sistema de gestión de relaciones con clientes.

**Funcionalidades:**
- Base de datos de clientes unificada
- Búsqueda por nombre, email o teléfono
- Filtrar por origen (web, tienda, importación, manual, reserva, pedido)
- Filtrar por marketing opt-in/opt-out
- Ver historial de cada cliente (reservas + pedidos vinculados)
- Crear y editar clientes manualmente
- Sistema de etiquetas para segmentación (vip, frecuente, nuevo, etc.)
- Marketing opt-in/opt-out con timestamps
- Importar clientes desde CSV (con validación)
- Exportar a CSV
- Descargar plantilla CSV para importación
- Estadísticas: total clientes, opt-in marketing, distribución por origen

**CRM automático:**
- Cada reserva nueva crea o actualiza un cliente (por email/teléfono)
- Cada pedido nuevo crea o actualiza un cliente
- Se actualizan contadores: total_reservas, total_pedidos, ultima_visita, ultima_compra

### Usuarios (`/admin/usuarios`)

Gestión de cuentas de usuario del sistema.

**Funcionalidades:**
- Lista de usuarios con búsqueda y filtro por rol
- Crear usuario con rol (admin, profesional, cliente)
- Editar datos y rol
- Reset de contraseña
- Eliminar usuario

### Ingresos (`/admin/ingresos`)

Analítica de ingresos del negocio.

**Métricas disponibles:**
- Ingresos totales por período (mensual, semanal, diario)
- Desglose por tipo (servicios vs productos)
- Gráficos de evolución
- Comparativa con períodos anteriores

### Gastos (`/admin/gastos`)

Módulo ERP de control de gastos.

**Funcionalidades:**
- **Categorías de gastos:** CRUD de categorías con color e icono (nóminas, alquiler, suministros, marketing, productos, formación, seguros, impuestos, mantenimiento, otros)
- **Proveedores:** CRUD con datos fiscales (NIF/CIF, dirección, contacto)
- **Gastos:** Registro de gastos con categoría, proveedor, importe, fecha, nº factura
- **Gastos recurrentes:** Configurar frecuencia (semanal a anual) con fecha inicio/fin
- **Marcar como pagado:** Registra pago y opcionalmente crea movimiento de caja
- **Estadísticas:** Gasto por categoría, por proveedor, pendientes de pago, recurrentes activos

### Tesorería (`/admin/tesoreria`)

Control de flujo de caja del negocio.

**Funcionalidades:**
- **Cuentas:** Gestión de cuentas de efectivo y banco (nombre, tipo, balance inicial)
- **Movimientos:** Registro de ingresos y gastos con referencia al origen (pedido, reserva, gasto, ajuste)
- **Transferencias:** Mover dinero entre cuentas (genera dos movimientos vinculados)
- **Cierres de caja:** Cierre diario con balance apertura, cierre teórico (calculado), cierre real (contado), diferencia
- **Estadísticas:** Balance total, desglose por cuenta, movimientos del día/mes

### Cuenta de Resultados (`/admin/cuenta-resultados`)

Dashboard de Pérdidas y Ganancias.

**Contenido:**
- Ingresos totales vs gastos totales
- Resultado neto (beneficio/pérdida)
- Margen bruto y neto
- Evolución mensual con gráfico
- Desglose de ingresos por fuente
- Desglose de gastos por categoría
- Previsión de liquidez

---

## Datos y restricciones

### Horarios de reserva
- Franjas de 30 minutos
- Horario: 9:00 a 20:00
- No se permiten reservas dobles en el mismo horario

### Envíos
- Envío gratuito para pedidos superiores a 50€
- Coste de envío estándar: 4,95€
- Plazo de entrega: 24-48 horas
- Devoluciones: 30 días

### Roles de usuario
| Rol | Acceso |
|-----|--------|
| cliente | Zona pública, perfil, agenda personal |
| profesional | Todo lo de cliente + panel admin |
| admin | Acceso completo (incluyendo gestión de usuarios) |

### Categorías de servicios
Manicura, Pedicura, Depilación, Cejas, Pestañas

### Categorías de productos
Manicura, Pedicura, Facial, Corporal, Cabello, Accesorios, Kits

### Estados de reserva
pendiente → confirmada → completada | cancelada

### Estados de pedido
pendiente → pagado → enviado → entregado | cancelado
