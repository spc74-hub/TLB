import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Euro,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Loader2,
  ShoppingBag,
  Users,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface IngresosStats {
  total_mes: number;
  total_hoy: number;
  total_semana: number;
  num_transacciones_mes: number;
  ticket_medio: number;
  comparativa_mes_anterior: number;
  por_tipo: Record<string, number>;
}

interface IngresoItem {
  id: number;
  tipo: string;
  fecha: string;
  concepto: string;
  cliente: string | null;
  importe: number;
  estado: string;
  referencia_id: number | null;
}

interface IngresosPorDia {
  fecha: string;
  total: number;
  num_transacciones: number;
}

interface IngresosPorTipo {
  tipo: string;
  importe: number;
  porcentaje: number;
  label: string;
  [key: string]: string | number;
}

interface TopCliente {
  cliente: string;
  total: number;
  num_compras: number;
}

const tipoColors: Record<string, string> = {
  pedido: "#10B981",
  reserva: "#06B6D4",
  servicio: "#8B5CF6",
  otro: "#6B7280",
};

const tipoLabels: Record<string, string> = {
  pedido: "Venta Productos",
  reserva: "Reservas/Servicios",
  servicio: "Servicios",
  otro: "Otros",
};

const estadoStyles: Record<string, string> = {
  completado: "bg-green-100 text-green-800",
  pagado: "bg-blue-100 text-blue-800",
  pendiente: "bg-yellow-100 text-yellow-800",
  preparando: "bg-purple-100 text-purple-800",
  enviado: "bg-cyan-100 text-cyan-800",
  entregado: "bg-green-100 text-green-800",
};

export function Ingresos() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<IngresosStats | null>(null);
  const [ingresos, setIngresos] = useState<IngresoItem[]>([]);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [ingresosPorDia, setIngresosPorDia] = useState<IngresosPorDia[]>([]);
  const [ingresosPorTipo, setIngresosPorTipo] = useState<IngresosPorTipo[]>([]);
  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);

  // Filtros
  const [buscar, setBuscar] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarIngresos();
  }, [buscar, tipoFiltro, fechaDesde, fechaHasta]);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [statsRes, porDiaRes, porTipoRes, topClientesRes] = await Promise.all([
        fetch(`${API_URL}/ingresos/stats`),
        fetch(`${API_URL}/ingresos/por-dia?dias=30`),
        fetch(`${API_URL}/ingresos/por-tipo`),
        fetch(`${API_URL}/ingresos/top-clientes?limit=5`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (porDiaRes.ok) {
        const porDiaData = await porDiaRes.json();
        setIngresosPorDia(porDiaData);
      }

      if (porTipoRes.ok) {
        const porTipoData = await porTipoRes.json();
        setIngresosPorTipo(porTipoData);
      }

      if (topClientesRes.ok) {
        const topClientesData = await topClientesRes.json();
        setTopClientes(topClientesData);
      }

      await cargarIngresos();
    } catch (error) {
      console.error("Error cargando datos de ingresos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarIngresos = async () => {
    try {
      const params = new URLSearchParams();
      if (buscar) params.append("buscar", buscar);
      if (tipoFiltro && tipoFiltro !== "todos") params.append("tipo", tipoFiltro);
      if (fechaDesde) params.append("fecha_desde", fechaDesde);
      if (fechaHasta) params.append("fecha_hasta", fechaHasta);
      params.append("limit", "100");

      const res = await fetch(`${API_URL}/ingresos/?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setIngresos(data.items);
        setTotalIngresos(data.total_importe);
      }
    } catch (error) {
      console.error("Error cargando lista de ingresos:", error);
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
          Ingresos
        </h1>
        <p className="text-carbon-600 mt-1">
          Vista consolidada de todos los ingresos del negocio
        </p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-carbon-600">
              Total Mes
            </CardTitle>
            <Euro className="h-4 w-4 text-salvia-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-carbon-800">
              {stats?.total_mes.toFixed(2) || "0.00"} €
            </div>
            <div className="flex items-center gap-1 mt-1">
              {(stats?.comparativa_mes_anterior || 0) >= 0 ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-600">
                    +{stats?.comparativa_mes_anterior.toFixed(1)}% vs mes anterior
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                  <span className="text-xs text-red-600">
                    {stats?.comparativa_mes_anterior.toFixed(1)}% vs mes anterior
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-carbon-600">
              Hoy
            </CardTitle>
            <Calendar className="h-4 w-4 text-salvia-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-carbon-800">
              {stats?.total_hoy.toFixed(2) || "0.00"} €
            </div>
            <p className="text-xs text-carbon-500 mt-1">
              {format(new Date(), "EEEE, d MMM", { locale: es })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-carbon-600">
              Esta Semana
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-salvia-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-carbon-800">
              {stats?.total_semana.toFixed(2) || "0.00"} €
            </div>
            <p className="text-xs text-carbon-500 mt-1">
              {stats?.num_transacciones_mes || 0} transacciones este mes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-carbon-600">
              Ticket Medio
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-salvia-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-carbon-800">
              {stats?.ticket_medio.toFixed(2) || "0.00"} €
            </div>
            <p className="text-xs text-carbon-500 mt-1">
              por transaccion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Area Chart - Ingresos por dia */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-salvia-500" />
              Ingresos ultimos 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ingresosPorDia.length > 0 ? (
              <div className="h-64 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <AreaChart
                    data={ingresosPorDia}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="fecha"
                      tick={{ fill: "#6B7280", fontSize: 10 }}
                      axisLine={{ stroke: "#E5E7EB" }}
                      tickFormatter={(value) => format(new Date(value), "d MMM", { locale: es })}
                    />
                    <YAxis
                      tick={{ fill: "#6B7280", fontSize: 12 }}
                      axisLine={{ stroke: "#E5E7EB" }}
                      tickFormatter={(value) => `${value}€`}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(2)} €`, "Ingresos"]}
                      labelFormatter={(label) => format(new Date(label), "EEEE, d MMM yyyy", { locale: es })}
                      contentStyle={{
                        backgroundColor: "#FFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorIngresos)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-carbon-400 bg-crudo-50 rounded-lg">
                <p>No hay datos de ingresos</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Por tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display">
              Por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ingresosPorTipo.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={ingresosPorTipo}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="importe"
                      nameKey="label"
                    >
                      {ingresosPorTipo.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={tipoColors[entry.tipo] || "#6B7280"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(2)} €`]}
                      contentStyle={{
                        backgroundColor: "#FFF",
                        border: "1px solid #E5E7EB",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {ingresosPorTipo.map((item) => (
                    <div key={item.tipo} className="flex items-center gap-1 text-xs">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tipoColors[item.tipo] || "#6B7280" }}
                      />
                      <span className="text-carbon-600">{item.label}</span>
                      <span className="text-carbon-400">
                        ({parseFloat(String(item.porcentaje)).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-carbon-400 bg-crudo-50 rounded-lg">
                <p>Sin datos</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clientes & Lista de Ingresos */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Top Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Users className="h-5 w-5 text-salvia-500" />
              Top Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topClientes.length > 0 ? (
              <div className="space-y-3">
                {topClientes.map((cliente, index) => (
                  <div
                    key={cliente.cliente}
                    className="flex items-center gap-3 p-2 bg-crudo-50 rounded-lg"
                  >
                    <div className="w-6 h-6 rounded-full bg-salvia-200 flex items-center justify-center text-xs font-bold text-salvia-700">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-carbon-800 truncate text-sm">
                        {cliente.cliente}
                      </p>
                      <p className="text-xs text-carbon-500">
                        {cliente.num_compras} compras
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-carbon-800 text-sm">
                        {cliente.total.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-carbon-400">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sin datos de clientes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Ingresos */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg font-display">
                Detalle de Ingresos
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-carbon-600">
                <span>Total filtrado:</span>
                <span className="font-bold text-carbon-800">{totalIngresos.toFixed(2)} €</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                <Input
                  placeholder="Buscar por concepto o cliente..."
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="pedido">Pedidos</SelectItem>
                  <SelectItem value="reserva">Reservas</SelectItem>
                  <SelectItem value="servicio">Servicios</SelectItem>
                  <SelectItem value="otro">Otros</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-[150px]"
                placeholder="Desde"
              />
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-[150px]"
                placeholder="Hasta"
              />
              {(buscar || tipoFiltro !== "todos" || fechaDesde || fechaHasta) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBuscar("");
                    setTipoFiltro("todos");
                    setFechaDesde("");
                    setFechaHasta("");
                  }}
                >
                  Limpiar
                </Button>
              )}
            </div>

            {/* Tabla */}
            {ingresos.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-crudo-200">
                      <th className="text-left py-3 px-2 text-sm font-medium text-carbon-600">
                        Fecha
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-carbon-600">
                        Tipo
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-carbon-600">
                        Concepto
                      </th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-carbon-600">
                        Cliente
                      </th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-carbon-600">
                        Importe
                      </th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-carbon-600">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingresos.map((ingreso) => (
                      <tr
                        key={ingreso.id}
                        className="border-b border-crudo-100 hover:bg-crudo-50 transition-colors"
                      >
                        <td className="py-3 px-2 text-sm text-carbon-600">
                          {format(new Date(ingreso.fecha), "dd/MM/yyyy", { locale: es })}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: tipoColors[ingreso.tipo] || "#6B7280" }}
                            />
                            <span className="text-sm text-carbon-700">
                              {tipoLabels[ingreso.tipo] || ingreso.tipo}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-sm text-carbon-800 max-w-[250px] truncate">
                          {ingreso.concepto}
                        </td>
                        <td className="py-3 px-2 text-sm text-carbon-600">
                          {ingreso.cliente || "-"}
                        </td>
                        <td className="py-3 px-2 text-sm font-semibold text-green-600 text-right">
                          +{ingreso.importe.toFixed(2)} €
                        </td>
                        <td className="py-3 px-2 text-center">
                          <Badge className={estadoStyles[ingreso.estado] || "bg-gray-100"}>
                            {ingreso.estado}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-carbon-400">
                <Euro className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay ingresos que mostrar</p>
                <p className="text-sm mt-1">Ajusta los filtros o espera a tener transacciones</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
