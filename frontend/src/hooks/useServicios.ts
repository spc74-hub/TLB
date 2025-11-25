/**
 * Hooks de React Query para gestión de servicios
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { serviciosAPI } from "@/services/api";
import type {
  FiltrosServicios,
  ServicioCreate,
  ServicioUpdate,
  CategoriaServicio,
} from "@/types";

// Keys para React Query
export const serviciosKeys = {
  all: ["servicios"] as const,
  lists: () => [...serviciosKeys.all, "list"] as const,
  list: (filtros: FiltrosServicios) =>
    [...serviciosKeys.lists(), filtros] as const,
  details: () => [...serviciosKeys.all, "detail"] as const,
  detail: (id: number) => [...serviciosKeys.details(), id] as const,
  categoria: (categoria: CategoriaServicio) =>
    [...serviciosKeys.all, "categoria", categoria] as const,
};

/**
 * Hook para listar servicios con filtros
 */
export function useServicios(filtros: FiltrosServicios = {}) {
  return useQuery({
    queryKey: serviciosKeys.list(filtros),
    queryFn: () => serviciosAPI.listar(filtros),
  });
}

/**
 * Hook para obtener un servicio por ID
 */
export function useServicio(id: number) {
  return useQuery({
    queryKey: serviciosKeys.detail(id),
    queryFn: () => serviciosAPI.obtener(id),
    enabled: id > 0,
  });
}

/**
 * Hook para listar servicios por categoría
 */
export function useServiciosPorCategoria(categoria: CategoriaServicio) {
  return useQuery({
    queryKey: serviciosKeys.categoria(categoria),
    queryFn: () => serviciosAPI.porCategoria(categoria),
  });
}

/**
 * Hook para crear un servicio
 */
export function useCrearServicio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (servicio: ServicioCreate) => serviciosAPI.crear(servicio),
    onSuccess: () => {
      // Invalidar todas las queries de servicios
      queryClient.invalidateQueries({ queryKey: serviciosKeys.all });
    },
  });
}

/**
 * Hook para actualizar un servicio
 */
export function useActualizarServicio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ServicioUpdate }) =>
      serviciosAPI.actualizar(id, datos),
    onSuccess: (_, variables) => {
      // Invalidar la query específica y las listas
      queryClient.invalidateQueries({
        queryKey: serviciosKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: serviciosKeys.lists() });
    },
  });
}

/**
 * Hook para eliminar un servicio
 */
export function useEliminarServicio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => serviciosAPI.eliminar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviciosKeys.all });
    },
  });
}
