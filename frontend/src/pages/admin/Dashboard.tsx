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
  ShoppingCart,
  Euro,
  ShoppingBag,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getCitasRango,
  getEmpleados,
  getProductos,
  getServicios,
  type Reserva,
} from '@/lib/api';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface EstadisticasVentas {
  total_pedidos: number;
  total_ventas: number;
  pendientes: number;
  pagados: number;
  enviados: number;
  entregados: number;
  ventas_7_dias: { fecha: string; dia: string; ventas: number }[];
}

interface PedidoReciente {
  id: number;
  nombre_envio: string;
  total: number;
  estado: string;
  created_at: string;
}

const estadoStyles: Record<string, string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  pagado: "bg-blue-100 text-blue-800",
  preparando: "bg-purple-100 text-purple-800",
  enviado: "bg-cyan-100 text-cyan-800",
  entregado: "bg-green-100 text-green-800",
  cancelado: "bg-red-100 text-red-800",
};

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
  const [estadisticasVentas, setEstadisticasVentas] = useState<EstadisticasVentas | null>(null);
  const [pedidosRecientes, setPedidosRecientes] = useState<PedidoReciente[]>([]);

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

      // Proximas citas (maximo 5)
      setCitasProximas(citasSemanaData.slice(0, 5));

      // Cargar estadisticas de ventas
      try {
        const [statsRes, recientesRes] = await Promise.all([
          fetch(`${API_URL}/pedidos/stats`),
          fetch(`${API_URL}/pedidos/recientes?limit=5`),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setEstadisticasVentas(statsData);
        }

        if (recientesRes.ok) {
          const recientesData = await recientesRes.json();
          setPedidosRecientes(recientesData);
        }
      } catch (error) {
        console.error("Error cargando estadisticas de ventas:", error);
      }
    } catch (error) {
      console.error("Error cargando estadisticas:", error);
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
          Panel de Administracion
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
              Total Ventas
            </CardTitle>
            <Euro className="h-4 w-4 text-salvia-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-carbon-800">
              {estadisticasVentas?.total_ventas.toFixed(2) || "0.00"} €
            </div>
            <p className="text-xs text-carbon-500 mt-1">
              {estadisticasVentas?.total_pedidos || 0} pedidos totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-carbon-600">
              Pedidos Pendientes
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-salvia-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-carbon-800">
              {(estadisticasVentas?.pagados || 0) + (estadisticasVentas?.pendientes || 0)}
            </div>
            <p className="text-xs text-carbon-500 mt-1">
              {estadisticasVentas?.enviados || 0} enviados
            </p>
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

      {/* Revenue Chart */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-salvia-500" />
            Ingresos ultimos 7 dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {estadisticasVentas?.ventas_7_dias && estadisticasVentas.ventas_7_dias.length > 0 ? (
            <div className="h-64 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart
                  data={estadisticasVentas.ventas_7_dias}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B9D83" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8B9D83" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="dia"
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                  />
                  <YAxis
                    tick={{ fill: "#6B7280", fontSize: 12 }}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tickFormatter={(value) => `${value}€`}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)} €`, "Ventas"]}
                    labelFormatter={(label) => `Dia: ${label}`}
                    contentStyle={{
                      backgroundColor: "#FFF",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="ventas"
                    stroke="#8B9D83"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVentas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-carbon-400 bg-crudo-50 rounded-lg">
              <p>No hay datos de ventas todavia</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions, Upcoming & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">
              Acciones Rapidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between group"
              asChild
            >
              <Link to="/admin/agenda">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Ver Agenda
                </span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between group"
              asChild
            >
              <Link to="/admin/pedidos">
                <span className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Ver Pedidos
                </span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between group"
              asChild
            >
              <Link to="/admin/servicios">
                <span className="flex items-center gap-2">
                  <Scissors className="h-4 w-4" />
                  Gestionar Servicios
                </span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between group"
              asChild
            >
              <Link to="/admin/productos">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Gestionar Productos
                </span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between group"
              asChild
            >
              <Link to="/admin/empleados">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Gestionar Empleados
                </span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">
              Proximas Citas
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/agenda">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {citasProximas.length === 0 ? (
              <div className="text-center py-8 text-carbon-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay citas proximas</p>
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

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">
              Pedidos Recientes
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/pedidos">Ver todos</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pedidosRecientes.length === 0 ? (
              <div className="text-center py-8 text-carbon-500">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay pedidos recientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pedidosRecientes.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="flex items-center gap-3 p-3 bg-crudo-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-carbon-800 truncate">
                        #{pedido.id} - {pedido.nombre_envio || "Sin nombre"}
                      </p>
                      <p className="text-sm text-carbon-500">
                        {pedido.total?.toFixed(2)} €
                      </p>
                    </div>
                    <Badge className={estadoStyles[pedido.estado] || "bg-gray-100"}>
                      {pedido.estado}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
