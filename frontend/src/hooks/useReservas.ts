/**
 * Hooks de React Query para gestión de reservas
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reservasAPI } from "@/services/api";
import type { FiltrosReservas, ReservaCreate, ReservaUpdate } from "@/types";

// Keys para React Query
export const reservasKeys = {
  all: ["reservas"] as const,
  lists: () => [...reservasKeys.all, "list"] as const,
  list: (filtros: FiltrosReservas) => [...reservasKeys.lists(), filtros] as const,
  details: () => [...reservasKeys.all, "detail"] as const,
  detail: (id: number) => [...reservasKeys.details(), id] as const,
  disponibilidad: (servicioId: number, fecha: string) =>
    [...reservasKeys.all, "disponibilidad", servicioId, fecha] as const,
};

/**
 * Hook para listar reservas con filtros
 */
export function useReservas(filtros: FiltrosReservas = {}) {
  return useQuery({
    queryKey: reservasKeys.list(filtros),
    queryFn: () => reservasAPI.listar(filtros),
  });
}

/**
 * Hook para obtener una reserva por ID
 */
export function useReserva(id: number) {
  return useQuery({
    queryKey: reservasKeys.detail(id),
    queryFn: () => reservasAPI.obtener(id),
    enabled: id > 0,
  });
}

/**
 * Hook para verificar disponibilidad de horarios
 */
export function useDisponibilidad(servicioId: number, fecha: string) {
  return useQuery({
    queryKey: reservasKeys.disponibilidad(servicioId, fecha),
    queryFn: () => reservasAPI.disponibilidad(servicioId, fecha),
    enabled: servicioId > 0 && !!fecha,
  });
}

/**
 * Hook para crear una reserva
 */
export function useCrearReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reserva: ReservaCreate) => reservasAPI.crear(reserva),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservasKeys.all });
    },
  });
}

/**
 * Hook para actualizar una reserva
 */
export function useActualizarReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: ReservaUpdate }) =>
      reservasAPI.actualizar(id, datos),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: reservasKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: reservasKeys.lists() });
    },
  });
}

/**
 * Hook para cancelar una reserva
 */
export function useCancelarReserva() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reservasAPI.cancelar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservasKeys.all });
    },
  });
}
