import { useState, useEffect, useMemo } from "react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
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
  const [empleadoFiltro, setEmpleadoFiltro] = useState<number | null>(null);

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

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  // Cargar citas cuando cambia la fecha o filtro
  useEffect(() => {
    if (empleados.length > 0) {
      cargarCitas();
    }
  }, [fechaActual, empleadoFiltro, empleados]);

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
      if (empleadoFiltro) {
        citasData = await getCitasEmpleado(empleadoFiltro, desde, hasta);
      } else {
        citasData = await getCitasRango(desde, hasta);
      }
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
    return citas.filter((c) => c.fecha === fechaStr && c.hora === hora);
  };

  // Abrir modal para nueva cita
  const abrirModalNuevaCita = (fecha?: Date, hora?: string) => {
    setCitaEditando(null);
    setFormCita({
      empleado_id: empleadoFiltro?.toString() || "",
      servicio_id: "",
      fecha: fecha ? format(fecha, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      hora: hora || "",
      nombre_cliente: "",
      telefono_cliente: "",
      notas: "",
    });
    setModalAbierto(true);
  };

  // Abrir modal para editar cita
  const abrirModalEditarCita = (cita: Reserva) => {
    setCitaEditando(cita);
    setFormCita({
      empleado_id: cita.empleado_id?.toString() || "",
      servicio_id: cita.servicio_id?.toString() || "",
      fecha: cita.fecha,
      hora: cita.hora,
      nombre_cliente: cita.nombre_cliente || "",
      telefono_cliente: cita.telefono_cliente || "",
      notas: cita.notas || "",
    });
    setModalAbierto(true);
  };

  // Guardar cita
  const guardarCita = async () => {
    if (!formCita.empleado_id || !formCita.servicio_id || !formCita.fecha || !formCita.hora || !formCita.nombre_cliente) {
      alert("Por favor completa todos los campos obligatorios");
      return;
    }

    try {
      setGuardando(true);
      const servicio = servicios.find((s) => s.id === parseInt(formCita.servicio_id));

      if (citaEditando) {
        await actualizarCita(citaEditando.id, {
          empleado_id: parseInt(formCita.empleado_id),
          servicio_id: parseInt(formCita.servicio_id),
          fecha: formCita.fecha,
          hora: formCita.hora,
          nombre_cliente: formCita.nombre_cliente,
          telefono_cliente: formCita.telefono_cliente || null,
          notas: formCita.notas || null,
          precio_total: servicio?.precio || null,
        });
      } else {
        await crearCita({
          empleado_id: parseInt(formCita.empleado_id),
          servicio_id: parseInt(formCita.servicio_id),
          fecha: formCita.fecha,
          hora: formCita.hora,
          nombre_cliente: formCita.nombre_cliente,
          telefono_cliente: formCita.telefono_cliente,
          notas: formCita.notas,
          precio_total: servicio?.precio,
        });
      }

      setModalAbierto(false);
      cargarCitas();
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
      cargarCitas();
    } catch (error) {
      console.error("Error eliminando cita:", error);
      alert("Error al eliminar la cita");
    } finally {
      setGuardando(false);
    }
  };

  // Cambiar estado de cita
  const cambiarEstadoCita = async (cita: Reserva, nuevoEstado: EstadoReserva) => {
    try {
      await actualizarCita(cita.id, { estado: nuevoEstado });
      cargarCitas();
    } catch (error) {
      console.error("Error cambiando estado:", error);
    }
  };

  // Horarios disponibles para el empleado seleccionado
  const horariosDisponibles = useMemo(() => {
    if (!formCita.empleado_id || !formCita.fecha) return horasDelDia;

    const diaSemana = parseISO(formCita.fecha).getDay();
    const citasEmpleado = citas.filter(
      (c) =>
        c.fecha === formCita.fecha &&
        c.empleado_id === parseInt(formCita.empleado_id) &&
        (!citaEditando || c.id !== citaEditando.id)
    );

    return generarHorariosEmpleado(horarios, diaSemana, citasEmpleado);
  }, [formCita.empleado_id, formCita.fecha, citas, horarios, citaEditando]);

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
              <Select
                value={empleadoFiltro?.toString() || "todos"}
                onValueChange={(v) =>
                  setEmpleadoFiltro(v === "todos" ? null : parseInt(v))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos los empleados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {empleados.map((e) => (
                    <SelectItem key={e.id} value={e.id.toString()}>
                      {e.nombre} {e.apellidos}
                    </SelectItem>
                  ))}
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

      {/* Calendario semanal */}
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
                  isSameDay(dia, new Date())
                    ? "bg-salvia-50"
                    : ""
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
                  return (
                    <div
                      key={`${dia.toISOString()}-${hora}`}
                      className={`min-h-[50px] p-1 border-r border-crudo-100 last:border-r-0 cursor-pointer hover:bg-crudo-50 transition-colors ${
                        isSameDay(dia, new Date()) ? "bg-salvia-50/30" : ""
                      }`}
                      onClick={() => {
                        if (citasSlot.length === 0) {
                          abrirModalNuevaCita(dia, hora);
                        }
                      }}
                    >
                      {citasSlot.map((cita) => (
                        <div
                          key={cita.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalEditarCita(cita);
                          }}
                          className="text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            backgroundColor: cita.empleado?.color || "#8B9D83",
                            color: "white",
                          }}
                        >
                          <div className="font-medium truncate">
                            {cita.nombre_cliente}
                          </div>
                          <div className="truncate opacity-90">
                            {cita.servicio?.nombre}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

      {/* Leyenda de empleados */}
      {isAdmin && empleados.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
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
            {/* Empleado */}
            <div className="grid gap-2">
              <Label htmlFor="empleado">
                Empleado <span className="text-terracota-500">*</span>
              </Label>
              <Select
                value={formCita.empleado_id}
                onValueChange={(v) =>
                  setFormCita({ ...formCita, empleado_id: v, hora: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona empleado" />
                </SelectTrigger>
                <SelectContent>
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
                    setFormCita({ ...formCita, fecha: e.target.value, hora: "" })
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
                  disabled={!formCita.empleado_id || !formCita.fecha}
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
              <div className="flex gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant={citaEditando.estado === "confirmada" ? "default" : "outline"}
                  size="sm"
                  onClick={() => cambiarEstadoCita(citaEditando, "confirmada")}
                  className={
                    citaEditando.estado === "confirmada"
                      ? "bg-salvia-500"
                      : ""
                  }
                >
                  Confirmada
                </Button>
                <Button
                  type="button"
                  variant={citaEditando.estado === "completada" ? "default" : "outline"}
                  size="sm"
                  onClick={() => cambiarEstadoCita(citaEditando, "completada")}
                  className={
                    citaEditando.estado === "completada"
                      ? "bg-green-500"
                      : ""
                  }
                >
                  Completada
                </Button>
                <Button
                  type="button"
                  variant={citaEditando.estado === "cancelada" ? "default" : "outline"}
                  size="sm"
                  onClick={() => cambiarEstadoCita(citaEditando, "cancelada")}
                  className={
                    citaEditando.estado === "cancelada"
                      ? "bg-red-500"
                      : ""
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
