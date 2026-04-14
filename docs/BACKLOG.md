# The Lobby Beauty — Backlog

## Prioridad Alta
- [ ] **Configurar Resend API key** — El código de emails está listo pero falta la API key en producción para que se envíen las confirmaciones
- [ ] **Middleware JWT en backend** — No hay validación de autenticación en las rutas del backend. Actualmente se confía en Cloudflare Access pero las rutas API no verifican tokens
- [ ] **Despliegue final a VPS** — Dockerfiles listos, falta configurar docker-compose en spcapps-infra, nginx server block y Cloudflare hostname
- [ ] **Obtener usuario_id del token de autenticación** — TODO en `backend/app/routers/reservas.py:281`, actualmente hardcodeado

## Prioridad Media
- [ ] **Campañas de marketing (CRM)** — El schema de campañas está creado pero la UI y la lógica de envío masivo no están implementadas
- [ ] **Cierres de caja operativos** — El endpoint existe pero la UI necesita refinamiento para el flujo diario real
- [ ] **Previsión de liquidez** — Widget de forecast a 7-30 días diseñado pero no completamente implementado
- [ ] **Reseñas de productos** — El componente frontend existe pero el endpoint backend de creación no está conectado
- [ ] **Generación automática de gastos recurrentes** — El modelo soporta recurrencia pero falta un cron/scheduler que genere las ocurrencias
- [ ] **Recordatorios de citas** — Función `enviar_recordatorio_reserva()` parcialmente implementada, falta scheduler 24h antes
- [ ] **Gestión de stock automática** — Al confirmar pedido, decrementar stock del producto

## Prioridad Baja / Futuro
- [ ] **Rate limiting** — No hay limitación de peticiones en el backend
- [ ] **Logging de requests** — No hay middleware de logging para auditoría
- [ ] **Tests automatizados** — Sin tests unitarios ni de integración
- [ ] **Internacionalización** — Todo en español, sin soporte multi-idioma
- [ ] **PWA / App móvil** — La web es responsive pero no es installable
- [ ] **Notificaciones push** — Para recordar citas a las clientas
- [ ] **Programa de fidelización** — Puntos por compras/reservas
- [ ] **Integración Google Calendar** — Sincronizar citas con el calendario de la profesional
- [ ] **Reporting avanzado** — Exportar informes a PDF/Excel
- [ ] **Gestión de inventario** — Alertas de stock bajo, pedidos a proveedores

## Bugs Conocidos
- [ ] **RLS temporal en reservas** — Política permisiva que permite lectura a todos los autenticados (`database/debug_reservas_rls.sql:35`)
- [ ] **Stripe public key hardcodeada** — En `backend/app/routers/pagos.py` la clave pública de Stripe está en el código en vez de en variable de entorno
- [ ] **Auth hardcodeada en dev** — `AuthContext.tsx` tiene usuario fijo, funciona gracias a Cloudflare Access en producción pero no hay flujo de login real
- [ ] **Errores de tipos TypeScript** — Build configurado con `--skipLibCheck` y sin `tsc` para evitar errores pre-existentes
