import { createClient, type User, type Session } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Re-export types from Supabase
export type { User, Session };

// Tipos de la base de datos
export type CategoriaServicio = "manicura" | "pedicura" | "depilacion" | "cejas" | "pestanas";
export type CategoriaProducto = "manicura" | "pedicura" | "facial" | "corporal" | "cabello" | "accesorios" | "kits";

export interface Servicio {
  id: number;
  nombre: string;
  descripcion: string | null;
  categoria: CategoriaServicio;
  duracion_minutos: number;
  precio: number;
  precio_oferta: number | null;
  es_libre_toxicos: boolean;
  es_interno: boolean;
  imagen_url: string | null;
  activo: boolean;
  destacado: boolean;
  created_at: string;
  updated_at: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  descripcion_corta: string;
  categoria: CategoriaProducto;
  precio: number;
  precio_oferta: number | null;
  imagen_url: string | null;
  imagenes_extra: string[] | null;
  stock: number;
  es_natural: boolean;
  es_vegano: boolean;
  es_cruelty_free: boolean;
  ingredientes: string[] | null;
  modo_uso: string | null;
  activo: boolean;
  destacado: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoriaServicioInfo {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  icono: string | null;
  orden: number;
  activo: boolean;
}

export interface CategoriaProductoInfo {
  id: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  icono: string | null;
  imagen_url: string | null;
  orden: number;
  activo: boolean;
}

// Funciones para obtener datos

export async function getServicios(categoria?: CategoriaServicio) {
  let query = supabase
    .from("servicios")
    .select("*")
    .eq("activo", true)
    .order("categoria")
    .order("precio");

  if (categoria) {
    query = query.eq("categoria", categoria);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Servicio[];
}

export async function getServicioById(id: number) {
  const { data, error } = await supabase
    .from("servicios")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Servicio;
}

export async function getServiciosDestacados() {
  const { data, error } = await supabase
    .from("servicios")
    .select("*")
    .eq("activo", true)
    .eq("destacado", true)
    .limit(6);

  if (error) throw error;
  return data as Servicio[];
}

export async function getProductos(categoria?: CategoriaProducto) {
  let query = supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .order("destacado", { ascending: false })
    .order("nombre");

  if (categoria) {
    query = query.eq("categoria", categoria);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Producto[];
}

export async function getProductoById(id: number) {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Producto;
}

export async function getProductosDestacados() {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .eq("destacado", true)
    .limit(8);

  if (error) throw error;
  return data as Producto[];
}

export async function getProductosEnOferta() {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .not("precio_oferta", "is", null)
    .limit(8);

  if (error) throw error;
  return data as Producto[];
}

export async function getCategoriasServicios() {
  const { data, error } = await supabase
    .from("categorias_servicios")
    .select("*")
    .eq("activo", true)
    .order("orden");

  if (error) throw error;
  return data as CategoriaServicioInfo[];
}

export async function getCategoriasProductos() {
  const { data, error } = await supabase
    .from("categorias_productos")
    .select("*")
    .eq("activo", true)
    .order("orden");

  if (error) throw error;
  return data as CategoriaProductoInfo[];
}

export async function buscarProductos(termino: string) {
  const { data, error } = await supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .or(`nombre.ilike.%${termino}%,descripcion_corta.ilike.%${termino}%`);

  if (error) throw error;
  return data as Producto[];
}

export async function getProductosPorCategoria(categoria: CategoriaProducto, excluirId?: number, limite?: number) {
  let query = supabase
    .from("productos")
    .select("*")
    .eq("activo", true)
    .eq("categoria", categoria);

  if (excluirId) {
    query = query.neq("id", excluirId);
  }

  if (limite) {
    query = query.limit(limite);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Producto[];
}

// ============== AUTENTICACIÓN ==============

export type RolUsuario = "cliente" | "admin" | "profesional";

export interface Perfil {
  id: string;
  email: string;
  nombre: string | null;
  apellidos: string | null;
  telefono: string | null;
  rol: RolUsuario;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegistroData {
  email: string;
  password: string;
  nombre: string;
  apellidos?: string;
  telefono?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Registro de usuario
export async function registrarUsuario(data: RegistroData) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        nombre: data.nombre,
        apellidos: data.apellidos || "",
      },
    },
  });

  if (authError) throw authError;
  return authData;
}

// Inicio de sesión
export async function iniciarSesion(data: LoginData) {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) throw error;
  return authData;
}

// Cerrar sesión
export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Obtener sesión actual
export async function obtenerSesion() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

// Obtener usuario actual
export async function obtenerUsuario() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Obtener perfil del usuario
export async function obtenerPerfil(userId: string) {
  const { data, error } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data as Perfil;
}

// Actualizar perfil
export async function actualizarPerfil(userId: string, datos: Partial<Perfil>) {
  const { data, error } = await supabase
    .from("perfiles")
    .update(datos)
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as Perfil;
}

// Recuperar contraseña
export async function recuperarPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;
}

// Actualizar contraseña
export async function actualizarPassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}

// ============== EMPLEADOS ==============

export interface Empleado {
  id: number;
  usuario_id: string | null;
  nombre: string;
  apellidos: string | null;
  email: string | null;
  telefono: string | null;
  color: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// Obtener todos los empleados activos
export async function getEmpleados() {
  const { data, error } = await supabase
    .from("empleados")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  if (error) throw error;
  return data as Empleado[];
}

// Obtener empleado por ID
export async function getEmpleadoById(id: number) {
  const { data, error } = await supabase
    .from("empleados")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Empleado;
}

// Obtener empleado por usuario_id (para vista de profesional)
export async function getEmpleadoByUsuarioId(usuarioId: string) {
  const { data, error } = await supabase
    .from("empleados")
    .select("*")
    .eq("usuario_id", usuarioId)
    .single();

  if (error) throw error;
  return data as Empleado;
}

// Crear empleado (solo admin)
export async function crearEmpleado(datos: Omit<Empleado, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("empleados")
    .insert(datos)
    .select()
    .single();

  if (error) throw error;
  return data as Empleado;
}

// Actualizar empleado (solo admin)
export async function actualizarEmpleado(id: number, datos: Partial<Empleado>) {
  const { data, error } = await supabase
    .from("empleados")
    .update(datos)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Empleado;
}

// ============== RESERVAS ==============

export type EstadoReserva = "pendiente" | "confirmada" | "completada" | "cancelada";

export interface Reserva {
  id: number;
  usuario_id: string | null;
  servicio_id: number | null;
  empleado_id: number | null;
  fecha: string;
  hora: string;
  estado: EstadoReserva;
  notas: string | null;
  nombre_cliente: string | null;
  email_cliente: string | null;
  telefono_cliente: string | null;
  precio_total: number | null;
  created_at: string;
  updated_at: string;
  // Relaciones (cuando se hace join)
  servicio?: Servicio;
  empleado?: Empleado;
}

export interface CrearReservaData {
  servicio_id: number;
  empleado_id?: number; // Opcional para reservas de clientes, obligatorio para agenda interna
  fecha: string; // formato YYYY-MM-DD
  hora: string; // formato HH:MM
  nombre_cliente: string;
  email_cliente?: string;
  telefono_cliente?: string;
  notas?: string;
  precio_total?: number;
  usuario_id?: string;
}

export interface Horario {
  id: number;
  dia_semana: number; // 0=Domingo, 1=Lunes...
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

export interface DiaBloqueado {
  id: number;
  fecha: string;
  motivo: string | null;
}

// Obtener horarios de apertura
export async function getHorarios() {
  const { data, error } = await supabase
    .from("horarios")
    .select("*")
    .eq("activo", true)
    .order("dia_semana")
    .order("hora_inicio");

  if (error) throw error;
  return data as Horario[];
}

// Obtener días bloqueados (festivos, vacaciones)
export async function getDiasBloqueados(desde?: string, hasta?: string) {
  let query = supabase.from("dias_bloqueados").select("*");

  if (desde) {
    query = query.gte("fecha", desde);
  }
  if (hasta) {
    query = query.lte("fecha", hasta);
  }

  const { data, error } = await query.order("fecha");
  if (error) throw error;
  return data as DiaBloqueado[];
}

// Obtener reservas de un día específico
export async function getReservasPorFecha(fecha: string) {
  const { data, error } = await supabase
    .from("reservas")
    .select("*")
    .eq("fecha", fecha)
    .in("estado", ["pendiente", "confirmada"]);

  if (error) throw error;
  return data as Reserva[];
}

// Crear una nueva reserva
export async function crearReserva(datos: CrearReservaData) {
  const { data, error } = await supabase
    .from("reservas")
    .insert({
      ...datos,
      estado: "pendiente",
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Este horario ya está reservado. Por favor, elige otro.");
    }
    throw error;
  }
  return data as Reserva;
}

// Obtener reservas del usuario actual
export async function getMisReservas(userId: string) {
  const { data, error } = await supabase
    .from("reservas")
    .select(`
      *,
      servicio:servicios(*)
    `)
    .eq("usuario_id", userId)
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false });

  if (error) throw error;
  return data as Reserva[];
}

// Cancelar una reserva
export async function cancelarReserva(reservaId: number, userId: string) {
  const { data, error } = await supabase
    .from("reservas")
    .update({ estado: "cancelada" })
    .eq("id", reservaId)
    .eq("usuario_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as Reserva;
}

// Generar slots de horarios disponibles para un día
export function generarHorariosDisponibles(
  horarios: Horario[],
  diaSemana: number,
  reservasDelDia: Reserva[],
  duracionServicio: number = 30
): string[] {
  // Encontrar el horario del día
  const horarioDelDia = horarios.filter((h) => h.dia_semana === diaSemana);

  if (horarioDelDia.length === 0) return [];

  const slots: string[] = [];
  const horasOcupadas = new Set(reservasDelDia.map((r) => r.hora));

  for (const horario of horarioDelDia) {
    const [inicioHora, inicioMin] = horario.hora_inicio.split(":").map(Number);
    const [finHora, finMin] = horario.hora_fin.split(":").map(Number);

    let horaActual = inicioHora * 60 + inicioMin;
    const horaFin = finHora * 60 + finMin;

    while (horaActual + duracionServicio <= horaFin) {
      const horas = Math.floor(horaActual / 60);
      const minutos = horaActual % 60;
      const horaStr = `${horas.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")}`;

      if (!horasOcupadas.has(horaStr)) {
        slots.push(horaStr);
      }

      horaActual += 30; // Incremento de 30 minutos
    }
  }

  return slots.sort();
}

// ============== AGENDA INTERNA ==============

// Obtener todas las citas de un rango de fechas (para admin)
export async function getCitasRango(desde: string, hasta: string) {
  const { data, error } = await supabase
    .from("reservas")
    .select(`
      *,
      servicio:servicios(*),
      empleado:empleados(*)
    `)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .in("estado", ["pendiente", "confirmada", "completada"])
    .order("fecha")
    .order("hora");

  if (error) throw error;
  return data as Reserva[];
}

// Obtener citas de un empleado específico
export async function getCitasEmpleado(empleadoId: number, desde: string, hasta: string) {
  const { data, error } = await supabase
    .from("reservas")
    .select(`
      *,
      servicio:servicios(*),
      empleado:empleados(*)
    `)
    .eq("empleado_id", empleadoId)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .in("estado", ["pendiente", "confirmada", "completada"])
    .order("fecha")
    .order("hora");

  if (error) throw error;
  return data as Reserva[];
}

// Obtener citas de un día específico con empleado
export async function getCitasDia(fecha: string, empleadoId?: number) {
  let query = supabase
    .from("reservas")
    .select(`
      *,
      servicio:servicios(*),
      empleado:empleados(*)
    `)
    .eq("fecha", fecha)
    .in("estado", ["pendiente", "confirmada", "completada"]);

  if (empleadoId) {
    query = query.eq("empleado_id", empleadoId);
  }

  const { data, error } = await query.order("hora");

  if (error) throw error;
  return data as Reserva[];
}

// Datos para crear cita desde agenda (empleado obligatorio)
export interface CrearCitaData extends Omit<CrearReservaData, "empleado_id"> {
  empleado_id: number;
}

// Crear cita desde agenda (admin/profesional)
export async function crearCita(datos: CrearCitaData) {
  const { data, error } = await supabase
    .from("reservas")
    .insert({
      ...datos,
      estado: "confirmada", // Las citas creadas desde agenda se confirman directamente
    })
    .select(`
      *,
      servicio:servicios(*),
      empleado:empleados(*)
    `)
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Este empleado ya tiene una cita a esa hora.");
    }
    throw error;
  }
  return data as Reserva;
}

// Actualizar cita
export async function actualizarCita(citaId: number, datos: Partial<Reserva>) {
  const { data, error } = await supabase
    .from("reservas")
    .update(datos)
    .eq("id", citaId)
    .select(`
      *,
      servicio:servicios(*),
      empleado:empleados(*)
    `)
    .single();

  if (error) throw error;
  return data as Reserva;
}

// Eliminar cita (solo admin)
export async function eliminarCita(citaId: number) {
  const { error } = await supabase
    .from("reservas")
    .delete()
    .eq("id", citaId);

  if (error) throw error;
}

// Obtener servicios (incluyendo internos para agenda)
export async function getServiciosParaAgenda(incluirInternos: boolean = true) {
  let query = supabase
    .from("servicios")
    .select("*")
    .eq("activo", true)
    .order("categoria")
    .order("nombre");

  if (!incluirInternos) {
    query = query.eq("es_interno", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Servicio[];
}

// Generar slots disponibles para un empleado específico
export function generarHorariosEmpleado(
  horarios: Horario[],
  diaSemana: number,
  reservasEmpleado: Reserva[],
  duracionServicio: number = 30
): string[] {
  const horarioDelDia = horarios.filter((h) => h.dia_semana === diaSemana);

  if (horarioDelDia.length === 0) return [];

  const slots: string[] = [];
  const horasOcupadas = new Set(reservasEmpleado.map((r) => r.hora));

  for (const horario of horarioDelDia) {
    const [inicioHora, inicioMin] = horario.hora_inicio.split(":").map(Number);
    const [finHora, finMin] = horario.hora_fin.split(":").map(Number);

    let horaActual = inicioHora * 60 + inicioMin;
    const horaFin = finHora * 60 + finMin;

    while (horaActual + duracionServicio <= horaFin) {
      const horas = Math.floor(horaActual / 60);
      const minutos = horaActual % 60;
      const horaStr = `${horas.toString().padStart(2, "0")}:${minutos.toString().padStart(2, "0")}`;

      if (!horasOcupadas.has(horaStr)) {
        slots.push(horaStr);
      }

      horaActual += 30;
    }
  }

  return slots.sort();
}
