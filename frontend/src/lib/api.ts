/**
 * API client — replaces direct Supabase calls.
 * All functions call the FastAPI backend at /api/v1/
 */

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API error ${res.status}`);
  }
  return res.json();
}

// Types
export type CategoriaServicio = "manicura" | "pedicura" | "depilacion" | "cejas" | "pestanas";
export type CategoriaProducto = "manicura" | "pedicura" | "facial" | "corporal" | "cabello" | "accesorios" | "kits";
export type EstadoPedido = "pendiente" | "pagado" | "preparando" | "enviado" | "entregado" | "cancelado";
export type EstadoReserva = "confirmada" | "cancelada" | "completada" | "no_show" | "pendiente";

export interface Servicio {
  id: number; nombre: string; descripcion: string | null; categoria: CategoriaServicio;
  duracion_minutos: number; precio: number; precio_oferta: number | null;
  es_libre_toxicos: boolean; es_interno: boolean; imagen_url: string | null;
  activo: boolean; destacado: boolean; created_at: string; updated_at: string;
}

export interface Producto {
  id: number; nombre: string; descripcion: string | null; categoria: CategoriaProducto;
  precio: number; precio_oferta: number | null; imagen_url: string | null;
  activo: boolean; destacado: boolean; en_oferta: boolean; stock: number;
  ingredientes: string | null; es_libre_toxicos: boolean;
  created_at: string; updated_at: string;
}

export interface Perfil {
  id: string; email: string; full_name: string | null; avatar_url: string | null;
  rol: string; phone: string | null; created_at: string; updated_at: string;
}

export interface Empleado {
  id: number; nombre: string; especialidades: string[]; activo: boolean;
  usuario_id: string | null; email: string | null; telefono: string | null;
  color: string | null; created_at: string; updated_at: string;
}

export interface Reserva {
  id: number; servicio_id: number; empleado_id: number | null; cliente_nombre: string;
  cliente_email: string; cliente_telefono: string | null; fecha: string; hora: string;
  estado: EstadoReserva; notas: string | null; precio_final: number | null;
  usuario_id: string | null; created_at: string; updated_at: string;
  servicio?: Servicio; empleado?: Empleado;
}

export interface Pedido {
  id: number; usuario_id: string | null; total: number; estado: EstadoPedido;
  stripe_session_id: string | null; email: string; nombre: string;
  items: any[]; created_at: string; updated_at: string;
}

export interface Horario {
  id: number; dia_semana: number; hora_apertura: string; hora_cierre: string; activo: boolean;
}

export interface User { id: string; email: string; }
export interface Session { user: User; }

// --- Servicios ---
export async function getServicios(categoria?: CategoriaServicio) {
  const params = new URLSearchParams();
  if (categoria) params.set('categoria', categoria);
  const data = await fetchAPI<any>(`/servicios/?${params}`);
  return data.items || data.servicios || data;
}

export async function getServicioById(id: number) {
  return fetchAPI<Servicio>(`/servicios/${id}`);
}

export async function getServiciosDestacados() {
  const data = await fetchAPI<any>('/servicios/?solo_activos=true');
  const items = data.items || data.servicios || data;
  return Array.isArray(items) ? items.filter((s: any) => s.destacado) : [];
}

export async function getAllServicios() {
  const data = await fetchAPI<any>('/servicios/?solo_activos=false&por_pagina=50');
  return data.items || data.servicios || data;
}

export async function crearServicio(datos: any) {
  return fetchAPI<Servicio>('/servicios/', { method: 'POST', body: JSON.stringify(datos) });
}

export async function actualizarServicio(id: number, datos: any) {
  return fetchAPI<Servicio>(`/servicios/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
}

export async function eliminarServicio(id: number) {
  return fetchAPI<any>(`/servicios/${id}`, { method: 'DELETE' });
}

// --- Productos ---
export async function getProductos(categoria?: CategoriaProducto) {
  const params = new URLSearchParams();
  if (categoria) params.set('categoria', categoria);
  const data = await fetchAPI<any>(`/productos/?${params}`);
  return data.items || data.productos || data;
}

export async function getProductoById(id: number) {
  return fetchAPI<Producto>(`/productos/${id}`);
}

export async function getProductosDestacados() {
  return fetchAPI<any>('/productos/destacados');
}

export async function getProductosEnOferta() {
  return fetchAPI<any>('/productos/ofertas');
}

export async function getAllProductos() {
  const data = await fetchAPI<any>('/productos/?solo_activos=false&por_pagina=100');
  return data.items || data.productos || data;
}

export async function crearProducto(datos: any) {
  return fetchAPI<Producto>('/productos/', { method: 'POST', body: JSON.stringify(datos) });
}

export async function actualizarProducto(id: number, datos: any) {
  return fetchAPI<Producto>(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
}

export async function eliminarProducto(id: number) {
  return fetchAPI<any>(`/productos/${id}`, { method: 'DELETE' });
}

export async function buscarProductos(termino: string) {
  return fetchAPI<any>(`/productos/buscar?q=${encodeURIComponent(termino)}`);
}

export async function getProductosPorCategoria(categoria: CategoriaProducto, excluirId?: number, limite?: number) {
  const params = new URLSearchParams({ categoria });
  if (excluirId) params.set('excluir_id', String(excluirId));
  if (limite) params.set('limite', String(limite));
  const data = await fetchAPI<any>(`/productos/?${params}`);
  return data.items || data.productos || data;
}

// --- Categorías ---
export async function getCategoriasServicios() {
  return fetchAPI<any[]>('/servicios/categorias/');
}

export async function getCategoriasProductos() {
  return fetchAPI<any[]>('/productos/categorias/');
}

// --- Reservas ---
export async function getReservasPorFecha(fecha: string) {
  return fetchAPI<Reserva[]>(`/reservas/fecha/${fecha}`);
}

export async function crearReserva(datos: any) {
  return fetchAPI<Reserva>('/reservas/', { method: 'POST', body: JSON.stringify(datos) });
}

export async function getMisReservas(userId: string) {
  return fetchAPI<Reserva[]>(`/reservas/usuario/${userId}`);
}

export async function cancelarReserva(reservaId: number, _userId: string) {
  return fetchAPI<any>(`/reservas/${reservaId}/cancelar`, { method: 'PATCH' });
}

// --- Citas (Agenda) ---
export async function getCitasRango(desde: string, hasta: string) {
  return fetchAPI<Reserva[]>(`/reservas/?desde=${desde}&hasta=${hasta}`);
}

export async function getCitasEmpleado(empleadoId: number, desde: string, hasta: string) {
  return fetchAPI<Reserva[]>(`/reservas/?empleado_id=${empleadoId}&desde=${desde}&hasta=${hasta}`);
}

export async function getCitasSinAsignar(desde: string, hasta: string) {
  return fetchAPI<Reserva[]>(`/reservas/?sin_asignar=true&desde=${desde}&hasta=${hasta}`);
}

export async function getCitasDia(fecha: string, empleadoId?: number) {
  const params = new URLSearchParams({ fecha });
  if (empleadoId) params.set('empleado_id', String(empleadoId));
  return fetchAPI<Reserva[]>(`/reservas/fecha/${fecha}?${params}`);
}

export async function crearCita(datos: any) {
  return crearReserva(datos);
}

export async function actualizarCita(citaId: number, datos: any) {
  return fetchAPI<Reserva>(`/reservas/${citaId}`, { method: 'PUT', body: JSON.stringify(datos) });
}

export async function eliminarCita(citaId: number) {
  return fetchAPI<any>(`/reservas/${citaId}`, { method: 'DELETE' });
}

// --- Horarios ---
export async function getHorarios() {
  return fetchAPI<Horario[]>('/reservas/horarios/');
}

export async function getDiasBloqueados(desde?: string, hasta?: string) {
  const params = new URLSearchParams();
  if (desde) params.set('desde', desde);
  if (hasta) params.set('hasta', hasta);
  return fetchAPI<any[]>(`/reservas/dias-bloqueados/?${params}`);
}

// --- Empleados ---
export async function getEmpleados() {
  return fetchAPI<Empleado[]>('/usuarios/empleados/');
}

export async function getEmpleadoById(id: number) {
  return fetchAPI<Empleado>(`/usuarios/empleados/${id}`);
}

export async function getEmpleadoByUsuarioId(usuarioId: string) {
  return fetchAPI<Empleado>(`/usuarios/empleados/usuario/${usuarioId}`);
}

export async function crearEmpleado(datos: any) {
  return fetchAPI<Empleado>('/usuarios/empleados/', { method: 'POST', body: JSON.stringify(datos) });
}

export async function actualizarEmpleado(id: number, datos: any) {
  return fetchAPI<Empleado>(`/usuarios/empleados/${id}`, { method: 'PUT', body: JSON.stringify(datos) });
}

// --- Pedidos ---
export async function getMisPedidos(userId: string) {
  return fetchAPI<Pedido[]>(`/pedidos/usuario/${userId}`);
}

export async function getPedidoById(pedidoId: number) {
  return fetchAPI<Pedido>(`/pedidos/${pedidoId}`);
}

export async function getAllPedidos() {
  return fetchAPI<any>('/pedidos/');
}

export async function actualizarEstadoPedido(pedidoId: number, estado: EstadoPedido) {
  return fetchAPI<any>(`/pedidos/${pedidoId}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) });
}

// --- Perfil ---
export async function obtenerPerfil(userId: string) {
  return fetchAPI<Perfil>(`/usuarios/${userId}`);
}

export async function actualizarPerfil(userId: string, datos: Partial<Perfil>) {
  return fetchAPI<Perfil>(`/usuarios/${userId}`, { method: 'PUT', body: JSON.stringify(datos) });
}

// --- Auth (stubs — Cloudflare Access handles auth) ---
export async function registrarUsuario(_data: any) {
  return { user: null, error: 'Registration handled by Cloudflare Access' };
}

export async function iniciarSesion(_data: any) {
  return { user: null, error: 'Login handled by Cloudflare Access' };
}

export async function cerrarSesion() {}

export async function obtenerSesion() {
  return { session: null };
}

export async function obtenerUsuario() {
  return { user: null };
}

export async function recuperarPassword(_email: string) {
  return { error: 'Password reset not available — using Cloudflare Access' };
}

export async function actualizarPassword(_newPassword: string) {
  return { error: 'Password update not available — using Cloudflare Access' };
}

// --- Images (stubs — storage not migrated yet) ---
export async function subirImagenProducto(_file: File, _productoId: number): Promise<string> {
  console.warn('[Storage] Image upload not implemented yet');
  return '';
}

export async function subirImagenServicio(_file: File, _servicioId: number): Promise<string> {
  console.warn('[Storage] Image upload not implemented yet');
  return '';
}

export async function eliminarImagen(_imagenUrl: string): Promise<void> {
  console.warn('[Storage] Image delete not implemented yet');
}

// --- Utility functions (local, no API call) ---
export function generarHorariosDisponibles(
  horarios: Horario[], diasBloqueados: any[], reservas: Reserva[],
  duracionMinutos: number, fecha: string
) {
  // Keep original local logic — doesn't need API
  const diaSemana = new Date(fecha).getDay();
  const horario = horarios.find(h => h.dia_semana === diaSemana && h.activo);
  if (!horario) return [];

  const bloqueado = diasBloqueados.some(d => d.fecha === fecha);
  if (bloqueado) return [];

  const slots: string[] = [];
  const [horaInicio, minInicio] = horario.hora_apertura.split(':').map(Number);
  const [horaFin, minFin] = horario.hora_cierre.split(':').map(Number);

  let current = horaInicio * 60 + minInicio;
  const end = horaFin * 60 + minFin;

  while (current + duracionMinutos <= end) {
    const h = String(Math.floor(current / 60)).padStart(2, '0');
    const m = String(current % 60).padStart(2, '0');
    const slot = `${h}:${m}`;

    const ocupado = reservas.some(r => {
      if (r.estado === 'cancelada') return false;
      const [rH, rM] = r.hora.split(':').map(Number);
      const rStart = rH * 60 + rM;
      const rEnd = rStart + (r.servicio?.duracion_minutos || 30);
      const sStart = current;
      const sEnd = current + duracionMinutos;
      return sStart < rEnd && sEnd > rStart;
    });

    if (!ocupado) slots.push(slot);
    current += 15;
  }

  return slots;
}

export function generarTodosHorarios(horarios: Horario[], fecha: string) {
  return generarHorariosDisponibles(horarios, [], [], 15, fecha);
}

export function getServiciosParaAgenda(incluirInternos: boolean = true) {
  return getAllServicios().then(servicios =>
    incluirInternos ? servicios : servicios.filter((s: any) => !s.es_interno)
  );
}

export function generarHorariosEmpleado() {
  // Stub — will be implemented when needed
  return [];
}

// Re-export for compatibility
export const supabase = null;
