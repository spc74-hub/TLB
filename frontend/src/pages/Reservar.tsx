import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  Leaf,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  Mail,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getServicios,
  getCategoriasServicios,
  getHorarios,
  getDiasBloqueados,
  getReservasPorFecha,
  crearReserva,
  generarTodosHorarios,
  type Servicio,
  type CategoriaServicioInfo,
  type Horario,
  type DiaBloqueado,
  type Reserva,
  type SlotHorario,
} from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type PasoReserva = "servicio" | "fecha" | "datos" | "confirmacion";

export function Reservar() {
  const [searchParams] = useSearchParams();
  const servicioIdParam = searchParams.get("servicio");
  const { user, perfil } = useAuth();

  // Estado de datos
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServicioInfo[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [diasBloqueados, setDiasBloqueados] = useState<DiaBloqueado[]>([]);
  const [reservasDelDia, setReservasDelDia] = useState<Reserva[]>([]);
  const [refreshKey, setRefreshKey] = useState(0); // Para forzar recarga de reservas
  const [loading, setLoading] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado del formulario
  const [pasoActual, setPasoActual] = useState<PasoReserva>("servicio");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("");
  const [servicioSeleccionado, setServicioSeleccionado] = useState<Servicio | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | undefined>();
  const [horaSeleccionada, setHoraSeleccionada] = useState<string>("");
  const [datosCliente, setDatosCliente] = useState({
    nombre: "",
    email: "",
    telefono: "",
    notas: "",
    aceptaMarketing: false,
  });
  const [reservaConfirmada, setReservaConfirmada] = useState(false);
  const [reservaId, setReservaId] = useState<number | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);
        setError(null);

        console.log("Cargando datos de reserva...");

        // Cargar cada recurso por separado para mejor diagnóstico
        const serviciosData = await getServicios();
        console.log("Servicios cargados:", serviciosData?.length || 0);

        let categoriasData: CategoriaServicioInfo[] = [];
        try {
          categoriasData = await getCategoriasServicios();
          console.log("Categorías cargadas:", categoriasData?.length || 0);
        } catch (catErr) {
          console.warn("Error cargando categorías (no crítico):", catErr);
        }

        let horariosData: Horario[] = [];
        try {
          horariosData = await getHorarios();
          console.log("Horarios cargados:", horariosData?.length || 0);
        } catch (horErr) {
          console.warn("Error cargando horarios:", horErr);
        }

        let diasBloqueadosData: DiaBloqueado[] = [];
        try {
          diasBloqueadosData = await getDiasBloqueados(
            format(new Date(), "yyyy-MM-dd"),
            format(addDays(new Date(), 60), "yyyy-MM-dd")
          );
          console.log("Días bloqueados cargados:", diasBloqueadosData?.length || 0);
        } catch (diasErr) {
          console.warn("Error cargando días bloqueados (no crítico):", diasErr);
        }

        setServicios(serviciosData || []);
        setCategorias(categoriasData || []);
        setHorarios(horariosData || []);
        setDiasBloqueados(diasBloqueadosData || []);

        // Si hay servicio preseleccionado
        if (servicioIdParam && serviciosData) {
          const servicio = serviciosData.find((s) => s.id === parseInt(servicioIdParam));
          if (servicio) {
            setServicioSeleccionado(servicio);
            setPasoActual("fecha");
          }
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("Error al cargar los datos. Inténtalo de nuevo.");
      } finally {
        setLoading(false);
      }
    }

    cargarDatos();
  }, [servicioIdParam]);

  // Pre-rellenar datos del usuario si está logueado
  useEffect(() => {
    if (user && perfil) {
      setDatosCliente((prev) => ({
        ...prev,
        nombre: `${perfil.nombre || ""} ${perfil.apellidos || ""}`.trim(),
        email: user.email || "",
        telefono: perfil.telefono || "",
      }));
    }
  }, [user, perfil]);

  // Cargar reservas cuando se selecciona una fecha o cuando refreshKey cambia
  useEffect(() => {
    async function cargarReservasDelDia() {
      if (!fechaSeleccionada) return;

      try {
        setLoadingHorarios(true);
        const fechaStr = format(fechaSeleccionada, "yyyy-MM-dd");
        console.log("Cargando reservas para:", fechaStr, "refreshKey:", refreshKey);
        const reservas = await getReservasPorFecha(fechaStr);
        console.log("Reservas encontradas:", reservas.length, reservas.map(r => r.hora));
        setReservasDelDia(reservas);
      } catch (err) {
        console.error("Error cargando reservas:", err);
      } finally {
        setLoadingHorarios(false);
      }
    }

    cargarReservasDelDia();
    setHoraSeleccionada(""); // Reset hora al cambiar fecha
  }, [fechaSeleccionada, refreshKey]);

  // Servicios filtrados por categoría
  const serviciosFiltrados = useMemo(() => {
    if (!categoriaSeleccionada) return servicios.filter((s) => s.activo);
    return servicios.filter(
      (s) => s.categoria === categoriaSeleccionada && s.activo
    );
  }, [categoriaSeleccionada, servicios]);

  // Todos los horarios del día (disponibles y ocupados)
  const todosHorarios = useMemo((): SlotHorario[] => {
    if (!fechaSeleccionada || horarios.length === 0) return [];

    const diaSemana = fechaSeleccionada.getDay();
    const duracion = servicioSeleccionado?.duracion_minutos || 30;

    return generarTodosHorarios(horarios, diaSemana, reservasDelDia, duracion);
  }, [fechaSeleccionada, horarios, reservasDelDia, servicioSeleccionado]);

  // Set de fechas bloqueadas
  const fechasBloqueadasSet = useMemo(() => {
    return new Set(diasBloqueados.map((d) => d.fecha));
  }, [diasBloqueados]);

  // Días de la semana sin horario configurado
  const diasSinHorario = useMemo(() => {
    const diasConHorario = new Set(horarios.map((h) => h.dia_semana));
    const diasSin: number[] = [];
    for (let i = 0; i <= 6; i++) {
      if (!diasConHorario.has(i)) {
        diasSin.push(i);
      }
    }
    return diasSin;
  }, [horarios]);

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(precio);
  };

  const formatDuracion = (minutos: number) => {
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
  };

  const handleSeleccionarServicio = (servicio: Servicio) => {
    setServicioSeleccionado(servicio);
    setPasoActual("fecha");
  };

  const handleSeleccionarHora = (hora: string) => {
    setHoraSeleccionada(hora);
  };

  const handleContinuarADatos = () => {
    if (fechaSeleccionada && horaSeleccionada) {
      setPasoActual("datos");
    }
  };

  const handleConfirmarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!servicioSeleccionado || !fechaSeleccionada || !horaSeleccionada) return;

    try {
      setSubmitting(true);
      setError(null);

      const reserva = await crearReserva({
        servicio_id: servicioSeleccionado.id,
        fecha: format(fechaSeleccionada, "yyyy-MM-dd"),
        hora: horaSeleccionada,
        nombre_cliente: datosCliente.nombre,
        email_cliente: datosCliente.email,
        telefono_cliente: datosCliente.telefono,
        notas: datosCliente.notas || undefined,
        precio_total: servicioSeleccionado.precio_oferta || servicioSeleccionado.precio,
        usuario_id: user?.id,
        acepta_marketing: datosCliente.aceptaMarketing,
      });

      setReservaId(reserva.id);
      setReservaConfirmada(true);
      setPasoActual("confirmacion");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear la reserva";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNuevaReserva = () => {
    setServicioSeleccionado(null);
    setFechaSeleccionada(undefined);
    setHoraSeleccionada("");
    setReservasDelDia([]); // Limpiar reservas del día para forzar recarga
    setRefreshKey((prev) => prev + 1); // Incrementar para forzar recarga cuando se seleccione fecha
    setDatosCliente({
      nombre: perfil ? `${perfil.nombre || ""} ${perfil.apellidos || ""}`.trim() : "",
      email: user?.email || "",
      telefono: perfil?.telefono || "",
      notas: "",
      aceptaMarketing: false,
    });
    setReservaConfirmada(false);
    setReservaId(null);
    setError(null);
    setPasoActual("servicio");
  };

  // Deshabilitar fechas pasadas, días bloqueados y días sin horario
  const disabledDays = (date: Date) => {
    // Fecha pasada
    if (isBefore(date, startOfDay(new Date()))) return true;

    // Día de la semana sin horario
    if (diasSinHorario.includes(date.getDay())) return true;

    // Día bloqueado
    const fechaStr = format(date, "yyyy-MM-dd");
    if (fechasBloqueadasSet.has(fechaStr)) return true;

    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-crudo-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-salvia-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crudo-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-crudo-100 to-salvia-50 py-8 lg:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-carbon-800 mb-4">
              Reserva tu cita
            </h1>
            <p className="text-carbon-600">
              Selecciona el servicio, fecha y hora que mejor te convenga
            </p>
          </div>

          {/* Indicador de pasos */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2 sm:gap-4">
              {["servicio", "fecha", "datos", "confirmacion"].map(
                (paso, index) => {
                  const pasos: PasoReserva[] = [
                    "servicio",
                    "fecha",
                    "datos",
                    "confirmacion",
                  ];
                  const indexActual = pasos.indexOf(pasoActual);
                  const isActive = pasoActual === paso;
                  const isCompleted = index < indexActual;

                  return (
                    <div key={paso} className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-salvia-500 text-white"
                            : isCompleted
                              ? "bg-salvia-200 text-salvia-700"
                              : "bg-crudo-200 text-carbon-500"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      {index < 3 && (
                        <div
                          className={`w-8 sm:w-12 h-0.5 ${
                            isCompleted ? "bg-salvia-300" : "bg-crudo-200"
                          }`}
                        />
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contenido principal */}
      <section className="py-8 lg:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Error global */}
          {error && (
            <div className="mb-6 p-4 bg-terracota-50 border border-terracota-200 rounded-lg text-terracota-700">
              {error}
            </div>
          )}

          {/* Paso 1: Selección de servicio */}
          {pasoActual === "servicio" && (
            <div>
              <div className="mb-6">
                <Label className="text-base">Filtrar por categoría</Label>
                <Select
                  value={categoriaSeleccionada || "todas"}
                  onValueChange={(value) => setCategoriaSeleccionada(value === "todas" ? "" : value)}
                >
                  <SelectTrigger className="w-full sm:w-64 mt-2 bg-white border-crudo-300">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las categorías</SelectItem>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {serviciosFiltrados.map((servicio) => (
                  <Card
                    key={servicio.id}
                    className={`cursor-pointer transition-all bg-white border-crudo-200 hover:border-salvia-400 hover:shadow-md ${
                      servicioSeleccionado?.id === servicio.id
                        ? "ring-2 ring-salvia-500"
                        : ""
                    }`}
                    onClick={() => handleSeleccionarServicio(servicio)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-carbon-800">
                          {servicio.nombre}
                        </h3>
                        {servicio.es_libre_toxicos && (
                          <Leaf className="h-4 w-4 text-salvia-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-carbon-500 line-clamp-2 mb-3">
                        {servicio.descripcion}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-carbon-500">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuracion(servicio.duracion_minutos)}
                        </span>
                        <div className="text-right">
                          {servicio.precio_oferta ? (
                            <>
                              <span className="text-carbon-400 line-through text-xs mr-2">
                                {formatPrecio(servicio.precio)}
                              </span>
                              <span className="font-semibold text-terracota-600">
                                {formatPrecio(servicio.precio_oferta)}
                              </span>
                            </>
                          ) : (
                            <span className="font-semibold text-salvia-600">
                              {formatPrecio(servicio.precio)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {serviciosFiltrados.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-carbon-500">No hay servicios disponibles en esta categoría.</p>
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Selección de fecha y hora */}
          {pasoActual === "fecha" && servicioSeleccionado && (
            <div>
              {/* Resumen del servicio seleccionado */}
              <Card className="mb-6 bg-salvia-50 border-salvia-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-salvia-600 mb-1">
                        Servicio seleccionado
                      </p>
                      <p className="font-semibold text-carbon-800">
                        {servicioSeleccionado.nombre}
                      </p>
                      <p className="text-sm text-carbon-600">
                        {formatDuracion(servicioSeleccionado.duracion_minutos)} ·{" "}
                        {formatPrecio(servicioSeleccionado.precio_oferta || servicioSeleccionado.precio)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPasoActual("servicio")}
                      className="text-salvia-700 hover:text-salvia-800"
                    >
                      Cambiar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Calendario */}
                <div>
                  <Label className="text-base mb-3 block">
                    Selecciona una fecha
                  </Label>
                  <Card className="bg-white border-crudo-200">
                    <CardContent className="p-4">
                      <Calendar
                        mode="single"
                        selected={fechaSeleccionada}
                        onSelect={setFechaSeleccionada}
                        disabled={disabledDays}
                        locale={es}
                        fromDate={new Date()}
                        toDate={addDays(new Date(), 60)}
                        className="rounded-md"
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Horarios */}
                <div>
                  <Label className="text-base mb-3 block">
                    Selecciona una hora
                  </Label>
                  {fechaSeleccionada ? (
                    <Card className="bg-white border-crudo-200">
                      <CardContent className="p-4">
                        <p className="text-sm text-carbon-600 mb-4">
                          Horarios disponibles para el{" "}
                          <strong>
                            {format(fechaSeleccionada, "d 'de' MMMM", {
                              locale: es,
                            })}
                          </strong>
                        </p>
                        {loadingHorarios ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-salvia-500" />
                          </div>
                        ) : todosHorarios.length > 0 ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {todosHorarios.map((slot) => (
                              <button
                                key={slot.hora}
                                onClick={() => slot.disponible && handleSeleccionarHora(slot.hora)}
                                disabled={!slot.disponible}
                                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                                  !slot.disponible
                                    ? "bg-crudo-100 border-crudo-200 text-carbon-400 line-through cursor-not-allowed"
                                    : horaSeleccionada === slot.hora
                                      ? "bg-salvia-500 text-white border-salvia-500"
                                      : "bg-white border-crudo-300 text-carbon-700 hover:border-salvia-400"
                                }`}
                              >
                                {slot.hora}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-carbon-500">
                              No hay horarios disponibles para este día.
                            </p>
                            <p className="text-sm text-carbon-400 mt-1">
                              Prueba con otra fecha.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="bg-crudo-100 border-crudo-200">
                      <CardContent className="p-8 text-center">
                        <CalendarIcon className="h-12 w-12 text-crudo-400 mx-auto mb-3" />
                        <p className="text-carbon-600">
                          Selecciona primero una fecha
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Botones de navegación */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPasoActual("servicio")}
                  className="border-crudo-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Atrás
                </Button>
                <Button
                  onClick={handleContinuarADatos}
                  disabled={!fechaSeleccionada || !horaSeleccionada}
                  className="bg-salvia-500 hover:bg-salvia-600"
                >
                  Continuar
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Paso 3: Datos del cliente */}
          {pasoActual === "datos" && servicioSeleccionado && fechaSeleccionada && (
            <div>
              {/* Resumen */}
              <Card className="mb-6 bg-salvia-50 border-salvia-200">
                <CardContent className="p-4">
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-salvia-600">Servicio</p>
                      <p className="font-semibold text-carbon-800">
                        {servicioSeleccionado.nombre}
                      </p>
                    </div>
                    <div>
                      <p className="text-salvia-600">Fecha</p>
                      <p className="font-semibold text-carbon-800">
                        {format(fechaSeleccionada, "d 'de' MMMM, yyyy", {
                          locale: es,
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-salvia-600">Hora</p>
                      <p className="font-semibold text-carbon-800">
                        {horaSeleccionada}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-crudo-200">
                <CardHeader>
                  <CardTitle className="font-display text-xl">
                    Tus datos de contacto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleConfirmarReserva} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nombre">
                          <User className="h-4 w-4 inline mr-1" />
                          Nombre completo *
                        </Label>
                        <Input
                          id="nombre"
                          required
                          value={datosCliente.nombre}
                          onChange={(e) =>
                            setDatosCliente({
                              ...datosCliente,
                              nombre: e.target.value,
                            })
                          }
                          placeholder="Tu nombre"
                          className="border-crudo-300"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="telefono">
                          <Phone className="h-4 w-4 inline mr-1" />
                          Teléfono *
                        </Label>
                        <Input
                          id="telefono"
                          type="tel"
                          required
                          value={datosCliente.telefono}
                          onChange={(e) =>
                            setDatosCliente({
                              ...datosCliente,
                              telefono: e.target.value,
                            })
                          }
                          placeholder="+34 600 000 000"
                          className="border-crudo-300"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        <Mail className="h-4 w-4 inline mr-1" />
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={datosCliente.email}
                        onChange={(e) =>
                          setDatosCliente({
                            ...datosCliente,
                            email: e.target.value,
                          })
                        }
                        placeholder="tu@email.com"
                        className="border-crudo-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notas">Notas adicionales (opcional)</Label>
                      <Textarea
                        id="notas"
                        value={datosCliente.notas}
                        onChange={(e) =>
                          setDatosCliente({
                            ...datosCliente,
                            notas: e.target.value,
                          })
                        }
                        placeholder="¿Hay algo que debamos saber?"
                        className="border-crudo-300 resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Opt-in Marketing */}
                    <div className="flex items-start space-x-3 py-2">
                      <input
                        type="checkbox"
                        id="acepta-marketing"
                        checked={datosCliente.aceptaMarketing}
                        onChange={(e) =>
                          setDatosCliente({
                            ...datosCliente,
                            aceptaMarketing: e.target.checked,
                          })
                        }
                        className="mt-1 h-4 w-4 rounded border-crudo-300 text-salvia-600 focus:ring-salvia-500"
                      />
                      <label
                        htmlFor="acepta-marketing"
                        className="text-sm text-carbon-600 cursor-pointer"
                      >
                        Acepto recibir comunicaciones comerciales y promociones de The Lobby Beauty
                      </label>
                    </div>

                    {/* Total */}
                    <div className="bg-crudo-100 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-carbon-600">Total a pagar</span>
                        <span className="text-2xl font-bold text-salvia-600">
                          {formatPrecio(servicioSeleccionado.precio_oferta || servicioSeleccionado.precio)}
                        </span>
                      </div>
                      <p className="text-xs text-carbon-500 mt-1">
                        El pago se realiza en el establecimiento
                      </p>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPasoActual("fecha")}
                        className="border-crudo-300"
                        disabled={submitting}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Atrás
                      </Button>
                      <Button
                        type="submit"
                        className="bg-salvia-500 hover:bg-salvia-600"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Confirmando...
                          </>
                        ) : (
                          <>
                            Confirmar reserva
                            <CheckCircle2 className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Paso 4: Confirmación */}
          {pasoActual === "confirmacion" && reservaConfirmada && (
            <Card className="bg-white border-crudo-200 text-center">
              <CardContent className="py-12 px-6">
                <div className="inline-flex p-4 bg-salvia-100 rounded-full mb-6">
                  <CheckCircle2 className="h-16 w-16 text-salvia-600" />
                </div>

                <h2 className="font-display text-2xl font-bold text-carbon-800 mb-4">
                  ¡Reserva confirmada!
                </h2>
                <p className="text-carbon-600 mb-2">
                  Tu número de reserva es: <strong>#{reservaId}</strong>
                </p>
                <p className="text-carbon-600 mb-8 max-w-md mx-auto">
                  Hemos enviado un email de confirmación a{" "}
                  <strong>{datosCliente.email}</strong> con todos los detalles de
                  tu cita.
                </p>

                <Card className="bg-crudo-50 border-crudo-200 text-left max-w-md mx-auto mb-8">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-carbon-800 mb-4">
                      Resumen de tu reserva
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-carbon-500">Servicio</span>
                        <span className="font-medium text-carbon-800">
                          {servicioSeleccionado?.nombre}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-carbon-500">Fecha</span>
                        <span className="font-medium text-carbon-800">
                          {fechaSeleccionada &&
                            format(fechaSeleccionada, "d 'de' MMMM, yyyy", {
                              locale: es,
                            })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-carbon-500">Hora</span>
                        <span className="font-medium text-carbon-800">
                          {horaSeleccionada}
                        </span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-crudo-200">
                        <span className="text-carbon-500">Total</span>
                        <span className="font-bold text-salvia-600">
                          {servicioSeleccionado &&
                            formatPrecio(servicioSeleccionado.precio_oferta || servicioSeleccionado.precio)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={handleNuevaReserva}
                    variant="outline"
                    className="border-salvia-300 text-salvia-700 hover:bg-salvia-50"
                  >
                    Nueva reserva
                  </Button>
                  <Button asChild className="bg-salvia-500 hover:bg-salvia-600">
                    <Link to="/">Volver al inicio</Link>
                  </Button>
                </div>

                <p className="text-xs text-carbon-500 mt-8">
                  ¿Necesitas cancelar o modificar tu cita? Contáctanos al menos 24
                  horas antes.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
