# Changelog

## 2026-04-15
- **refactor:** migración de almacenamiento — filesystem local reemplaza Supabase Storage
- **refactor:** todas las llamadas frontend a Supabase reemplazadas por API backend
- **fix:** conexiones standalone por query para evitar errores asyncpg en loops
- **fix:** compatibilidad Python 3.11 (backslash en f-strings)
- **fix:** build frontend con npm install y --legacy-peer-deps (React 19)

## 2025-11-27
- **feat:** módulo Cuenta de Resultados (P&L dashboard) con evolución mensual
- **feat:** módulo Ingresos con estadísticas de revenue
- **feat:** tracking de cobros en pedidos (método de pago, fecha cobro)
- **feat:** integración cobros con movimientos de tesorería

## 2025-11-26
- **feat:** módulo ERP de Gastos — categorías, proveedores, gastos recurrentes
- **feat:** módulo Tesorería — cuentas, movimientos, transferencias, cierres de caja
- **feat:** schema SQL para ERP y tesorería con triggers de balance automático

## 2025-11-25
- **feat:** sistema CRM completo — gestión de clientes, etiquetas, opt-in/out marketing
- **feat:** importación/exportación CSV de clientes
- **feat:** CRM automático — reservas y pedidos crean/actualizan clientes
- **feat:** vinculación cliente ↔ reservas y pedidos

## 2025-11-24
- **feat:** gestión de usuarios en panel admin (CRUD con roles)
- **feat:** enlace al panel admin para usuarios admin/profesional

## 2025-11-23
- **feat:** Dockerfiles para despliegue en VPS (backend Python + frontend Nginx)
- **refactor:** migración de Supabase client a PostgreSQL directo via asyncpg
- **feat:** QueryBuilder asyncpg como reemplazo drop-in del SDK de Supabase

## 2025-11-22
- **feat:** mejoras UX — wishlist/favoritos, reseñas de productos, SEO con React Helmet, botones de compartir
- **feat:** historial de citas del usuario, página de recuperar contraseña
- **feat:** notificaciones de reserva via backend API (email + WhatsApp)

## 2025-11-21
- **feat:** agenda mejorada con drag-drop (@dnd-kit), filtros por estado, vistas día/semana
- **feat:** sistema de reservas mejorado con disponibilidad visual
- **feat:** subida de imágenes para productos y servicios

## 2025-11-20
- **feat:** checkout e-commerce completo con Stripe (sessions + webhooks)
- **feat:** confirmaciones por email (Resend) para reservas y pedidos
- **feat:** integración de pagos Stripe con checkout session y payment intent

## 2025-11-19
- **feat:** panel admin con CRUD de empleados, servicios y productos
- **feat:** sistema de agenda interna con calendario
- **feat:** integración con Supabase Auth (login, registro, roles)

## 2025-11-18
- **feat:** sección e-commerce con catálogo de productos y carrito de compra
- **feat:** carrusel de imágenes en hero
- **feat:** optimización de imágenes (PNG → JPEG)

## 2025-11-17
- **feat:** commit inicial — estructura base React + FastAPI
- **feat:** catálogo de servicios, páginas públicas, diseño con Tailwind CSS
