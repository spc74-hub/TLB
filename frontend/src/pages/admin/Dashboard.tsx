import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  Users,
  Package,
  Scissors,
  TrendingUp,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getCitasRango,
  getEmpleados,
  getProductos,
  getServicios,
  type Reserva,
} from "@/lib/supabase";

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    citasHoy: 0,
    citasSemana: 0,
    empleados: 0,
    productos: 0,
    servicios: 0,
  });
  const [citasProximas, setCitasProximas] = useState<Reserva[]>([]);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const hoy = format(new Date(), "yyyy-MM-dd");
      const finSemana = format(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      );

      const [citasSemanaData, empleadosData, productosData, serviciosData] =
        await Promise.all([
          getCitasRango(hoy, finSemana).catch(() => []),
          getEmpleados().catch(() => []),
          getProductos().catch(() => []),
          getServicios().catch(() => []),
        ]);

      const citasHoy = citasSemanaData.filter((c) => c.fecha === hoy).length;

      setStats({
        citasHoy,
        citasSemana: citasSemanaData.length,
        empleados: empleadosData.length,
        productos: productosData.length,
        servicios: serviciosData.length,
      });

      // Próximas citas (máximo 5)
      setCitasProximas(citasSemanaData.slice(0, 5));
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-salvia-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-carbon-800">
          Panel de Administración
        </h1>
        <p className="text-carbon-600 mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-carbon-600">
              Citas Hoy
            </CardTitle>
            <Calendar className="h-4 w-4 text-salvia-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-carbon-800">
              {stats.citasHoy}
            </div>
            <p className="text-xs text-carbon-500 mt-1">
              {stats.citasSemana} esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-carbon-600">
              Empleados
            </CardTitle>
            <Users className="h-4 w-4 text-salvia-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-carbon-800">
              {stats.empleados}
            </div>
            <p className="text-xs text-carbon-500 mt-1">activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-carbon-600">
              Servicios
            </CardTitle>
            <Scissors className="h-4 w-4 text-salvia-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-carbon-800">
              {stats.servicios}
            </div>
            <p className="text-xs text-carbon-500 mt-1">disponibles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-carbon-600">
              Productos
            </CardTitle>
            <Package className="h-4 w-4 text-salvia-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-carbon-800">
              {stats.productos}
            </div>
            <p className="text-xs text-carbon-500 mt-1">en tienda</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/agenda">
              <Button
                variant="outline"
                className="w-full justify-between group"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ver Agenda
                </span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full justify-between"
              disabled
            >
              <span className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Gestionar Servicios
              </span>
              <span className="text-xs text-carbon-400">Próximamente</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              disabled
            >
              <span className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Gestionar Productos
              </span>
              <span className="text-xs text-carbon-400">Próximamente</span>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              disabled
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Gestionar Empleados
              </span>
              <span className="text-xs text-carbon-400">Próximamente</span>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">
              Próximas Citas
            </CardTitle>
            <Link to="/admin/agenda">
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {citasProximas.length === 0 ? (
              <div className="text-center py-8 text-carbon-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay citas próximas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {citasProximas.map((cita) => (
                  <div
                    key={cita.id}
                    className="flex items-center gap-3 p-3 bg-crudo-50 rounded-lg"
                  >
                    <div
                      className="w-2 h-10 rounded-full"
                      style={{
                        backgroundColor: cita.empleado?.color || "#8B9D83",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-carbon-800 truncate">
                        {cita.nombre_cliente}
                      </p>
                      <p className="text-sm text-carbon-500 truncate">
                        {cita.servicio?.nombre}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-carbon-800">
                        {cita.hora}
                      </p>
                      <p className="text-xs text-carbon-500">
                        {format(new Date(cita.fecha), "d MMM", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue placeholder */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-salvia-500" />
            Ingresos
          </CardTitle>
          <span className="text-xs text-carbon-400 bg-crudo-100 px-2 py-1 rounded">
            Próximamente
          </span>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-carbon-400 bg-crudo-50 rounded-lg">
            <p>Gráfico de ingresos disponible próximamente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
