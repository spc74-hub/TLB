/**
 * Tipos de datos para The Lobby Beauty
 */

// ============== ENUMS ==============

export type CategoriaServicio =
  | "manicura"
  | "pedicura"
  | "depilacion"
  | "cejas"
  | "pestanas";

export type EstadoReserva =
  | "pendiente"
  | "confirmada"
  | "completada"
  | "cancelada";

export type RolUsuario = "cliente" | "admin" | "profesional";

// ============== CATEGORÍAS ==============

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  icono?: string;
  created_at: string;
}

// ============== SERVICIOS ==============

export interface Servicio {
  id: number;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaServicio;
  duracion_minutos: number;
  precio: number;
  es_libre_toxicos: boolean;
  imagen_url?: string;
  activo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ServicioCreate {
  nombre: string;
  descripcion?: string;
  categoria: CategoriaServicio;
  duracion_minutos: number;
  precio: number;
  es_libre_toxicos?: boolean;
  imagen_url?: string;
}

export interface ServicioUpdate {
  nombre?: string;
  descripcion?: string;
  categoria?: CategoriaServicio;
  duracion_minutos?: number;
  precio?: number;
  es_libre_toxicos?: boolean;
  imagen_url?: string;
  activo?: boolean;
}

// ============== USUARIOS ==============

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  telefono?: string;
  rol: RolUsuario;
  created_at: string;
}

// ============== RESERVAS ==============

export interface Reserva {
  id: number;
  usuario_id: string;
  servicio_id: number;
  fecha: string;
  hora: string;
  estado: EstadoReserva;
  notas?: string;
  created_at: string;
  updated_at?: string;
}

export interface ReservaConDetalles extends Reserva {
  servicio?: Servicio;
}

export interface ReservaCreate {
  servicio_id: number;
  fecha: string;
  hora: string;
  notas?: string;
}

export interface ReservaUpdate {
  fecha?: string;
  hora?: string;
  estado?: EstadoReserva;
  notas?: string;
}

// ============== RESEÑAS ==============

export interface Resena {
  id: number;
  usuario_id: string;
  servicio_id: number;
  puntuacion: number;
  comentario?: string;
  created_at: string;
}

export interface ResenaCreate {
  servicio_id: number;
  puntuacion: number;
  comentario?: string;
}

// ============== RESPUESTAS API ==============

export interface ListaServicios {
  items: Servicio[];
  total: number;
  pagina: number;
  por_pagina: number;
}

export interface DisponibilidadHorario {
  fecha: string;
  servicio_id: number;
  horarios_disponibles: string[];
}

export interface MensajeRespuesta {
  mensaje: string;
  exito: boolean;
}

// ============== FILTROS ==============

export interface FiltrosServicios {
  categoria?: CategoriaServicio;
  solo_activos?: boolean;
  solo_libre_toxicos?: boolean;
  pagina?: number;
  por_pagina?: number;
}

export interface FiltrosReservas {
  fecha_desde?: string;
  fecha_hasta?: string;
  estado?: EstadoReserva;
}
