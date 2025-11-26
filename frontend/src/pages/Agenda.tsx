import { useState, useEffect, useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import {
  getEmpleados,
  getServiciosParaAgenda,
  getCitasRango,
  getCitasEmpleado,
  getCitasSinAsignar,
  getHorarios,
  crearCita,
  actualizarCita,
  eliminarCita,
  generarHorariosEmpleado,
  type Empleado,
  type Servicio,
  type Reserva,
  type Horario,
  type EstadoReserva,
} from "@/lib/supabase";

export function Agenda() {
  const { perfil } = useAuth();
  const isAdmin = perfil?.rol === "admin";

  // Estados principales
  const [fechaActual, setFechaActual] = useState(new Date());
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [citas, setCitas] = useState<Reserva[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(true);
  const [empleadoFiltro, setEmpleadoFiltro] = useState<string>("todos");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("activas");

  // Drag and drop
  const [citaArrastrando, setCitaArrastrando] = useState<Reserva | null>(null);

  // Modal de nueva cita
  const [modalAbierto, setModalAbierto] = useState(false);
  const [citaEditando, setCitaEditando] = useState<Reserva | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Formulario de cita
  const [formCita, setFormCita] = useState({
    empleado_id: "",
    servicio_id: "",
    fecha: "",
    hora: "",
    nombre_cliente: "",
    telefono_cliente: "",
    notas: "",
  });

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  // Cargar citas cuando cambia la fecha o filtros
  useEffect(() => {
    if (empleados.length > 0) {
      cargarCitas();
    }
  }, [fechaActual, empleadoFiltro, estadoFiltro, empleados]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [empleadosData, serviciosData, horariosData] = await Promise.all([
        getEmpleados(),
        getServiciosParaAgenda(true),
        getHorarios(),
      ]);
      setEmpleados(empleadosData);
      setServicios(serviciosData);
      setHorarios(horariosData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarCitas = async () => {
    try {
      const inicioSemana = startOfWeek(fechaActual, { weekStartsOn: 1 });
      const finSemana = addDays(inicioSemana, 6);
      const desde = format(inicioSemana, "yyyy-MM-dd");
      const hasta = format(finSemana, "yyyy-MM-dd");

      let citasData: Reserva[];
      if (empleadoFiltro === "sin_asignar") {
        citasData = await getCitasSinAsignar(desde, hasta);
      } else if (empleadoFiltro !== "todos") {
        citasData = await getCitasEmpleado(parseInt(empleadoFiltro), desde, hasta);
      } else {
        citasData = await getCitasRango(desde, hasta);
      }

      // Aplicar filtro de estado del lado cliente
      if (estadoFiltro === "activas") {
        // Activas = pendiente, confirmada (no completadas ni canceladas)
        citasData = citasData.filter(
          (c) => c.estado === "pendiente" || c.estado === "confirmada"
        );
      } else if (estadoFiltro !== "todas") {
        // Filtro específico por estado
        citasData = citasData.filter((c) => c.estado === estadoFiltro);
      }
      // Si es "todas", no filtramos

      setCitas(citasData);
    } catch (error) {
      console.error("Error cargando citas:", error);
    }
  };

  // Navegación de fechas
  const navegarSemana = (direccion: number) => {
    setFechaActual((prev) => addDays(prev, direccion * 7));
  };

  const irAHoy = () => {
    setFechaActual(new Date());
  };

  // Días de la semana actual
  const diasSemana = useMemo(() => {
    const inicio = startOfWeek(fechaActual, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(inicio, i));
  }, [fechaActual]);

  // Horas del día (10:00 - 22:00)
  const horasDelDia = useMemo(() => {
    const horas: string[] = [];
    for (let h = 10; h < 22; h++) {
      horas.push(`${h.toString().padStart(2, "0")}:00`);
      horas.push(`${h.toString().padStart(2, "0")}:30`);
    }
    return horas;
  }, []);

  // Obtener citas de una hora específica
  const getCitasHora = (fecha: Date, hora: string) => {
    const fechaStr = format(fecha, "yyyy-MM-dd");
    return citas.filter(
      (c) => c.fecha === fechaStr && c.hora.substring(0, 5) === hora
    );
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const citaId = parseInt(event.active.id as string);
    const cita = citas.find((c) => c.id === citaId);
    if (cita) {
      setCitaArrastrando(cita);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setCitaArrastrando(null);

    if (!over) return;

    const citaId = parseInt(active.id as string);
    const [nuevaFecha, nuevaHora] = (over.id as string).split("_");

    const cita = citas.find((c) => c.id === citaId);
    if (!cita) return;

    // Si es la misma posición, no hacer nada
    if (cita.fecha === nuevaFecha && cita.hora.substring(0, 5) === nuevaHora) {
      return;
    }

    try {
      await actualizarCita(citaId, {
        fecha: nuevaFecha,
        hora: nuevaHora,
      });
      await cargarCitas();
    } catch (error) {
      console.error("Error moviendo cita:", error);
      alert("Error al mover la cita");
    }
  };

  // Abrir modal para nueva cita
  const abrirModalNuevaCita = (fecha?: Date, hora?: string) => {
    setCitaEditando(null);
    setFormCita({
      empleado_id:
        empleadoFiltro !== "todos" && empleadoFiltro !== "sin_asignar"
          ? empleadoFiltro
          : "",
      servicio_id: "",
      fecha: fecha ? format(fecha, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      hora: hora || "",
      nombre_cliente: "",
      telefono_cliente: "",
      notas: "",
    });
    setModalAbierto(true);
  };

  // Abrir modal para editar cita - Pre-rellena la hora actual
  const abrirModalEditarCita = (cita: Reserva) => {
    setCitaEditando(cita);
    // Normalizar la hora a formato HH:MM
    const horaNormalizada = cita.hora.substring(0, 5);
    setFormCita({
      empleado_id: cita.empleado_id?.toString() || "",
      servicio_id: cita.servicio_id?.toString() || "",
      fecha: cita.fecha,
      hora: horaNormalizada, // Pre-rellenar con la hora actual
      nombre_cliente: cita.nombre_cliente || "",
      telefono_cliente: cita.telefono_cliente || "",
      notas: cita.notas || "",
    });
    setModalAbierto(true);
  };

  // Guardar cita - empleado_id ya no es obligatorio
  const guardarCita = async () => {
    if (
      !formCita.servicio_id ||
      !formCita.fecha ||
      !formCita.hora ||
      !formCita.nombre_cliente
    ) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      setGuardando(true);
      const servicio = servicios.find(
        (s) => s.id === parseInt(formCita.servicio_id)
      );

      const datosBase = {
        empleado_id: formCita.empleado_id ? parseInt(formCita.empleado_id) : undefined,
        servicio_id: parseInt(formCita.servicio_id),
        fecha: formCita.fecha,
        hora: formCita.hora,
        nombre_cliente: formCita.nombre_cliente,
        telefono_cliente: formCita.telefono_cliente || undefined,
        notas: formCita.notas || undefined,
        precio_total: servicio?.precio,
      };

      if (citaEditando) {
        await actualizarCita(citaEditando.id, datosBase);
      } else {
        await crearCita({
          ...datosBase,
          estado: "pendiente",
        });
      }

      setModalAbierto(false);
      await cargarCitas();
    } catch (error) {
      console.error("Error guardando cita:", error);
      alert(error instanceof Error ? error.message : "Error al guardar la cita");
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar cita
  const handleEliminarCita = async () => {
    if (!citaEditando) return;
    if (!confirm("¿Estás seguro de eliminar esta cita?")) return;

    try {
      setGuardando(true);
      await eliminarCita(citaEditando.id);
      setModalAbierto(false);
      await cargarCitas();
    } catch (error) {
      console.error("Error eliminando cita:", error);
      alert("Error al eliminar la cita");
    } finally {
      setGuardando(false);
    }
  };

  // Cambiar estado de cita - actualiza citaEditando para feedback inmediato
  const cambiarEstadoCita = async (cita: Reserva, nuevoEstado: EstadoReserva) => {
    try {
      // Actualizar estado local inmediatamente para feedback visual
      setCitaEditando((prev) => prev ? { ...prev, estado: nuevoEstado } : null);
      await actualizarCita(cita.id, { estado: nuevoEstado });
      await cargarCitas();
    } catch (error) {
      console.error("Error cambiando estado:", error);
      // Revertir si hay error
      setCitaEditando(cita);
    }
  };

  // Horarios disponibles para el empleado seleccionado
  const horariosDisponibles = useMemo(() => {
    if (!formCita.fecha) return horasDelDia;

    // Si no hay empleado seleccionado, mostrar todos los horarios
    if (!formCita.empleado_id) return horasDelDia;

    const diaSemana = parseISO(formCita.fecha).getDay();
    const citasEmpleado = citas.filter(
      (c) =>
        c.fecha === formCita.fecha &&
        c.empleado_id === parseInt(formCita.empleado_id) &&
        (!citaEditando || c.id !== citaEditando.id)
    );

    const horariosGenerados = generarHorariosEmpleado(
      horarios,
      diaSemana,
      citasEmpleado
    );

    // Si estamos editando, asegurar que la hora actual esté disponible
    if (
      citaEditando &&
      formCita.hora &&
      !horariosGenerados.includes(formCita.hora)
    ) {
      return [formCita.hora, ...horariosGenerados].sort();
    }

    return horariosGenerados;
  }, [
    formCita.empleado_id,
    formCita.fecha,
    formCita.hora,
    citas,
    horarios,
    citaEditando,
    horasDelDia,
  ]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-salvia-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-carbon-800">
            Agenda
          </h1>
          <p className="text-carbon-600">
            {format(fechaActual, "MMMM yyyy", { locale: es })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por empleado */}
          {isAdmin && (
            <Select value={empleadoFiltro} onValueChange={setEmpleadoFiltro}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos los empleados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="sin_asignar">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full" />
                    Sin asignar
                  </span>
                </SelectItem>
                {empleados.map((e) => (
                  <SelectItem key={e.id} value={e.id.toString()}>
                    {e.nombre} {e.apellidos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Filtro por estado */}
          {isAdmin && (
            <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activas">Activas</SelectItem>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="pendiente">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                    Pendientes
                  </span>
                </SelectItem>
                <SelectItem value="confirmada">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-salvia-500 rounded-full" />
                    Confirmadas
                  </span>
                </SelectItem>
                <SelectItem value="completada">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Completadas
                  </span>
                </SelectItem>
                <SelectItem value="cancelada">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    Canceladas
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Navegación */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navegarSemana(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={irAHoy}>
              Hoy
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navegarSemana(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Nueva cita */}
          <Button
            onClick={() => abrirModalNuevaCita()}
            className="bg-salvia-500 hover:bg-salvia-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva cita
          </Button>
        </div>
      </div>

      {/* Calendario semanal con drag and drop */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white rounded-xl shadow-sm border border-crudo-200 overflow-hidden">
          {/* Cabecera con días */}
          <div className="grid grid-cols-8 border-b border-crudo-200">
            <div className="p-3 text-center text-sm font-medium text-carbon-500 border-r border-crudo-200">
              Hora
            </div>
            {diasSemana.map((dia) => (
              <div
                key={dia.toISOString()}
                className={`p-3 text-center border-r border-crudo-200 last:border-r-0 ${
                  isSameDay(dia, new Date()) ? "bg-salvia-50" : ""
                }`}
              >
                <div className="text-xs text-carbon-500 uppercase">
                  {format(dia, "EEE", { locale: es })}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    isSameDay(dia, new Date())
                      ? "text-salvia-600"
                      : "text-carbon-800"
                  }`}
                >
                  {format(dia, "d")}
                </div>
              </div>
            ))}
          </div>

          {/* Cuerpo con horas */}
          <div className="max-h-[600px] overflow-y-auto">
            {horasDelDia.map((hora) => (
              <div
                key={hora}
                className="grid grid-cols-8 border-b border-crudo-100 last:border-b-0"
              >
                {/* Columna de hora */}
                <div className="p-2 text-xs text-carbon-500 text-center border-r border-crudo-200 bg-crudo-50">
                  {hora}
                </div>

                {/* Columnas de días */}
                {diasSemana.map((dia) => {
                  const citasSlot = getCitasHora(dia, hora);
                  const slotId = `${format(dia, "yyyy-MM-dd")}_${hora}`;
                  return (
                    <DroppableSlot
                      key={slotId}
                      id={slotId}
                      isToday={isSameDay(dia, new Date())}
                      onClick={() => {
                        if (citasSlot.length === 0) {
                          abrirModalNuevaCita(dia, hora);
                        }
                      }}
                    >
                      {citasSlot.map((cita) => (
                        <DraggableCita
                          key={cita.id}
                          cita={cita}
                          onClick={() => abrirModalEditarCita(cita)}
                        />
                      ))}
                    </DroppableSlot>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Overlay de arrastre */}
        <DragOverlay>
          {citaArrastrando && (
            <div
              className="text-xs p-1 rounded shadow-lg cursor-grabbing opacity-90"
              style={{
                backgroundColor: citaArrastrando.empleado?.color || "#9CA3AF",
                color: "white",
                width: "120px",
              }}
            >
              <div className="font-medium truncate">
                {citaArrastrando.nombre_cliente}
              </div>
              <div className="truncate opacity-90">
                {citaArrastrando.servicio?.nombre}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Leyenda */}
      {isAdmin && (
        <div className="mt-4 flex flex-wrap gap-3 items-center">
          <span className="text-sm text-carbon-500">Leyenda:</span>
          {empleados.map((emp) => (
            <div key={emp.id} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: emp.color }}
              />
              <span className="text-sm text-carbon-600">
                {emp.nombre} {emp.apellidos}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-crudo-300">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-sm text-carbon-600">Sin asignar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-sm text-carbon-600">Pendiente</span>
          </div>
        </div>
      )}

      {/* Modal de cita */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {citaEditando ? "Editar cita" : "Nueva cita"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Empleado - Ahora opcional */}
            <div className="grid gap-2">
              <Label htmlFor="empleado">Empleado</Label>
              <Select
                value={formCita.empleado_id || "sin_asignar"}
                onValueChange={(v) =>
                  setFormCita({
                    ...formCita,
                    empleado_id: v === "sin_asignar" ? "" : v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin_asignar">
                    <span className="text-carbon-500">Sin asignar</span>
                  </SelectItem>
                  {empleados.map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: e.color }}
                        />
                        {e.nombre} {e.apellidos}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Servicio */}
            <div className="grid gap-2">
              <Label htmlFor="servicio">
                Servicio <span className="text-terracota-500">*</span>
              </Label>
              <Select
                value={formCita.servicio_id}
                onValueChange={(v) => setFormCita({ ...formCita, servicio_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona servicio" />
                </SelectTrigger>
                <SelectContent>
                  {servicios.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {s.nombre}
                          {s.es_interno && (
                            <span className="ml-2 text-xs text-carbon-400">
                              (interno)
                            </span>
                          )}
                        </span>
                        <span className="text-carbon-500 ml-2">
                          {s.duracion_minutos} min
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha y hora */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fecha">
                  Fecha <span className="text-terracota-500">*</span>
                </Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formCita.fecha}
                  onChange={(e) =>
                    setFormCita({ ...formCita, fecha: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="hora">
                  Hora <span className="text-terracota-500">*</span>
                </Label>
                <Select
                  value={formCita.hora}
                  onValueChange={(v) => setFormCita({ ...formCita, hora: v })}
                  disabled={!formCita.fecha}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {horariosDisponibles.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cliente */}
            <div className="grid gap-2">
              <Label htmlFor="cliente">
                Nombre del cliente <span className="text-terracota-500">*</span>
              </Label>
              <Input
                id="cliente"
                value={formCita.nombre_cliente}
                onChange={(e) =>
                  setFormCita({ ...formCita, nombre_cliente: e.target.value })
                }
                placeholder="Nombre del cliente"
              />
            </div>

            {/* Teléfono */}
            <div className="grid gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                value={formCita.telefono_cliente}
                onChange={(e) =>
                  setFormCita({ ...formCita, telefono_cliente: e.target.value })
                }
                placeholder="Teléfono del cliente"
              />
            </div>

            {/* Notas */}
            <div className="grid gap-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formCita.notas}
                onChange={(e) =>
                  setFormCita({ ...formCita, notas: e.target.value })
                }
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>

            {/* Estado (solo al editar) */}
            {citaEditando && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant={
                    citaEditando.estado === "pendiente" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => cambiarEstadoCita(citaEditando, "pendiente")}
                  className={
                    citaEditando.estado === "pendiente" ? "bg-yellow-500" : ""
                  }
                >
                  Pendiente
                </Button>
                <Button
                  type="button"
                  variant={
                    citaEditando.estado === "confirmada" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => cambiarEstadoCita(citaEditando, "confirmada")}
                  className={
                    citaEditando.estado === "confirmada" ? "bg-salvia-500" : ""
                  }
                >
                  Confirmada
                </Button>
                <Button
                  type="button"
                  variant={
                    citaEditando.estado === "completada" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => cambiarEstadoCita(citaEditando, "completada")}
                  className={
                    citaEditando.estado === "completada" ? "bg-green-500" : ""
                  }
                >
                  Completada
                </Button>
                <Button
                  type="button"
                  variant={
                    citaEditando.estado === "cancelada" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => cambiarEstadoCita(citaEditando, "cancelada")}
                  className={
                    citaEditando.estado === "cancelada" ? "bg-red-500" : ""
                  }
                >
                  Cancelada
                </Button>
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex justify-between">
            {citaEditando && isAdmin && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleEliminarCita}
                disabled={guardando}
              >
                Eliminar
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalAbierto(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={guardarCita}
                disabled={guardando}
                className="bg-salvia-500 hover:bg-salvia-600"
              >
                {guardando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : citaEditando ? (
                  "Guardar cambios"
                ) : (
                  "Crear cita"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para slot donde se puede soltar
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";

function DroppableSlot({
  id,
  children,
  isToday,
  onClick,
}: {
  id: string;
  children: React.ReactNode;
  isToday: boolean;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[50px] p-1 border-r border-crudo-100 last:border-r-0 cursor-pointer hover:bg-crudo-50 transition-colors ${
        isToday ? "bg-salvia-50/30" : ""
      } ${isOver ? "bg-salvia-100 ring-2 ring-salvia-400 ring-inset" : ""}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function DraggableCita({
  cita,
  onClick,
}: {
  cita: Reserva;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: cita.id.toString(),
  });

  const isCompletada = cita.estado === "completada";
  const isCancelada = cita.estado === "cancelada";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`text-xs p-1 rounded mb-1 cursor-grab hover:opacity-80 transition-opacity relative group ${
        isDragging ? "opacity-50" : ""
      } ${isCompletada || isCancelada ? "opacity-60" : ""}`}
      style={{
        backgroundColor: cita.empleado?.color || "#9CA3AF",
        color: "white",
      }}
    >
      <div className="absolute left-0 top-0 bottom-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="h-3 w-3 text-white/70" />
      </div>
      <div className={`font-medium truncate pl-3 ${isCompletada ? "line-through" : ""} ${isCancelada ? "line-through text-white/70" : ""}`}>
        {cita.nombre_cliente}
      </div>
      <div className={`truncate opacity-90 pl-3 ${isCompletada ? "line-through" : ""} ${isCancelada ? "line-through text-white/70" : ""}`}>
        {cita.servicio?.nombre}
      </div>
      {cita.estado === "pendiente" && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full" />
      )}
      {cita.estado === "completada" && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full" />
      )}
      {cita.estado === "cancelada" && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
      )}
      {!cita.empleado_id && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}
