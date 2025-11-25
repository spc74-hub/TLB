/**
 * Cliente API para The Lobby Beauty
 * Gestiona las llamadas al backend FastAPI
 */

import type {
  Servicio,
  ServicioCreate,
  ServicioUpdate,
  ListaServicios,
  Reserva,
  ReservaCreate,
  ReservaUpdate,
  ReservaConDetalles,
  DisponibilidadHorario,
  MensajeRespuesta,
  FiltrosServicios,
  FiltrosReservas,
  CategoriaServicio,
} from "@/types";

// URL base de la API
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

/**
 * Cliente HTTP base con manejo de errores
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Construye query string desde un objeto de parámetros
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

// ============== SERVICIOS ==============

export const serviciosAPI = {
  /**
   * Lista servicios con filtros opcionales
   */
  listar: (filtros: FiltrosServicios = {}): Promise<ListaServicios> => {
    const query = buildQueryString(filtros as Record<string, unknown>);
    return fetchAPI<ListaServicios>(`/servicios${query}`);
  },

  /**
   * Obtiene un servicio por ID
   */
  obtener: (id: number): Promise<Servicio> => {
    return fetchAPI<Servicio>(`/servicios/${id}`);
  },

  /**
   * Lista servicios por categoría
   */
  porCategoria: (categoria: CategoriaServicio): Promise<Servicio[]> => {
    return fetchAPI<Servicio[]>(`/servicios/categoria/${categoria}`);
  },

  /**
   * Crea un nuevo servicio (admin)
   */
  crear: (servicio: ServicioCreate): Promise<Servicio> => {
    return fetchAPI<Servicio>("/servicios", {
      method: "POST",
      body: JSON.stringify(servicio),
    });
  },

  /**
   * Actualiza un servicio existente (admin)
   */
  actualizar: (id: number, servicio: ServicioUpdate): Promise<Servicio> => {
    return fetchAPI<Servicio>(`/servicios/${id}`, {
      method: "PUT",
      body: JSON.stringify(servicio),
    });
  },

  /**
   * Elimina (desactiva) un servicio (admin)
   */
  eliminar: (id: number): Promise<MensajeRespuesta> => {
    return fetchAPI<MensajeRespuesta>(`/servicios/${id}`, {
      method: "DELETE",
    });
  },
};

// ============== RESERVAS ==============

export const reservasAPI = {
  /**
   * Lista reservas con filtros opcionales
   */
  listar: (filtros: FiltrosReservas = {}): Promise<ReservaConDetalles[]> => {
    const query = buildQueryString(filtros as Record<string, unknown>);
    return fetchAPI<ReservaConDetalles[]>(`/reservas${query}`);
  },

  /**
   * Obtiene una reserva por ID
   */
  obtener: (id: number): Promise<ReservaConDetalles> => {
    return fetchAPI<ReservaConDetalles>(`/reservas/${id}`);
  },

  /**
   * Verifica disponibilidad de horarios
   */
  disponibilidad: (
    servicioId: number,
    fecha: string
  ): Promise<DisponibilidadHorario> => {
    const query = buildQueryString({ servicio_id: servicioId, fecha });
    return fetchAPI<DisponibilidadHorario>(`/reservas/disponibilidad${query}`);
  },

  /**
   * Crea una nueva reserva
   */
  crear: (reserva: ReservaCreate): Promise<Reserva> => {
    return fetchAPI<Reserva>("/reservas", {
      method: "POST",
      body: JSON.stringify(reserva),
    });
  },

  /**
   * Actualiza una reserva existente
   */
  actualizar: (id: number, reserva: ReservaUpdate): Promise<Reserva> => {
    return fetchAPI<Reserva>(`/reservas/${id}`, {
      method: "PUT",
      body: JSON.stringify(reserva),
    });
  },

  /**
   * Cancela una reserva
   */
  cancelar: (id: number): Promise<MensajeRespuesta> => {
    return fetchAPI<MensajeRespuesta>(`/reservas/${id}/cancelar`, {
      method: "POST",
    });
  },
};

// Export por defecto
export default {
  servicios: serviciosAPI,
  reservas: reservasAPI,
};
