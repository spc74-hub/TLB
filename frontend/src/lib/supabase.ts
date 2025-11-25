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
