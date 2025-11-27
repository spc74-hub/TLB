import { useState, useEffect } from "react";
import {
  Loader2,
  Wallet,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Calendar,
  Euro,
  TrendingUp,
  TrendingDown,
  Building,
  CreditCard,
  Banknote,
  Eye,
  Lock,
  CheckCircle2,
  Clock,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8001";
const API_URL = `${API_BASE}/api/v1`;

// Tipos
interface CuentaCaja {
  id: number;
  nombre: string;
  tipo: "efectivo" | "banco" | "tpv";
  balance_actual: number;
  balance_inicial: number;
  activa: boolean;
  created_at: string;
}

interface MovimientoCaja {
  id: number;
  cuenta_id: number;
  tipo: "ingreso" | "gasto";
  importe: number;
  concepto: string;
  referencia_tipo?: string;
  referencia_id?: number;
  balance_posterior: number;
  fecha: string;
  notas?: string;
  created_at: string;
  cuenta?: CuentaCaja;
}

interface CierreCaja {
  id: number;
  cuenta_id: number;
  fecha: string;
  balance_inicial: number;
  total_ingresos: number;
  total_gastos: number;
  balance_final: number;
  balance_real?: number;
  diferencia?: number;
  cerrado: boolean;
  cerrado_por?: string;
  notas?: string;
  cuenta?: CuentaCaja;
}

interface CashStats {
  balance_total: number;
  ingresos_mes: number;
  gastos_mes: number;
  num_movimientos_mes: number;
}

interface PLData {
  periodo: string;
  ingresos: {
    reservas: number;
    pedidos: number;
    otros: number;
    total: number;
  };
  gastos: {
    por_categoria: { categoria: string; total: number }[];
    total: number;
  };
  resultado: number;
  margen: number;
}

interface PedidoPendienteCobro {
  id: number;
  nombre_envio: string;
  total: number;
  estado: string;
  metodo_pago: string;
  stripe_payment_id: string | null;
  created_at: string;
  cobrado: boolean;
  metodo_cobro_tipo: string | null;
  tipo_cobro_esperado: string;
}

interface CobroStats {
  total_pedidos: number;
  total_ventas: number;
  cobrados: number;
  total_cobrado: number;
  pendientes_cobro: number;
  total_pendiente: number;
  por_metodo_cobro: Record<string, { count: number; total: number }>;
}

const TIPOS_CUENTA = [
  { valor: "efectivo", nombre: "Efectivo", icon: Banknote },
  { valor: "banco", nombre: "Banco", icon: Building },
  { valor: "tpv", nombre: "TPV", icon: CreditCard },
];

export function Tesoreria() {
  const [cuentas, setCuentas] = useState<CuentaCaja[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoCaja[]>([]);
  const [cierres, setCierres] = useState<CierreCaja[]>([]);
  const [stats, setStats] = useState<CashStats | null>(null);
  const [plData, setPLData] = useState<PLData | null>(null);
  const [pedidosPendientes, setPedidosPendientes] = useState<PedidoPendienteCobro[]>([]);
  const [cobroStats, setCobroStats] = useState<CobroStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCuenta, setFiltroCuenta] = useState<string>("todas");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  // Modal cobro
  const [modalCobroOpen, setModalCobroOpen] = useState(false);
  const [pedidoACobrar, setPedidoACobrar] = useState<PedidoPendienteCobro | null>(null);
  const [formCobro, setFormCobro] = useState({
    metodo_cobro: "efectivo",
    cuenta_id: "",
  });
  const [registrandoCobro, setRegistrandoCobro] = useState(false);

  // Modal estados
  const [modalCuentaOpen, setModalCuentaOpen] = useState(false);
  const [modalMovimientoOpen, setModalMovimientoOpen] = useState(false);
  const [modalTransferenciaOpen, setModalTransferenciaOpen] = useState(false);
  const [modalCierreOpen, setModalCierreOpen] = useState(false);
  const [movimientoDetalle, setMovimientoDetalle] = useState<MovimientoCaja | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Form cuenta
  const [formCuenta, setFormCuenta] = useState({
    nombre: "",
    tipo: "efectivo",
    balance_inicial: "0",
  });

  // Form movimiento
  const [formMovimiento, setFormMovimiento] = useState({
    cuenta_id: "",
    tipo: "ingreso",
    importe: "",
    concepto: "",
    notas: "",
  });

  // Form transferencia
  const [formTransferencia, setFormTransferencia] = useState({
    cuenta_origen_id: "",
    cuenta_destino_id: "",
    importe: "",
    concepto: "Transferencia entre cuentas",
  });

  // Form cierre
  const [formCierre, setFormCierre] = useState({
    cuenta_id: "",
    balance_real: "",
    notas: "",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      // Obtener el periodo actual en formato YYYY-MM
      const now = new Date();
      const periodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const [cuentasRes, movimientosRes, cierresRes, statsRes, plRes, pendientesRes, cobroStatsRes] = await Promise.all([
        fetch(`${API_URL}/tesoreria/cuentas`),
        fetch(`${API_URL}/tesoreria/movimientos`),
        fetch(`${API_URL}/tesoreria/cierres`),
        fetch(`${API_URL}/tesoreria/stats`),
        fetch(`${API_URL}/tesoreria/pl?periodo=${periodo}`),
        fetch(`${API_URL}/pedidos/pendientes-cobro`),
        fetch(`${API_URL}/pedidos/stats-cobro`),
      ]);

      if (cuentasRes.ok) {
        const data = await cuentasRes.json();
        // cuentas returns array directly
        setCuentas(Array.isArray(data) ? data : []);
      }
      if (movimientosRes.ok) {
        const data = await movimientosRes.json();
        // movimientos returns paginated response with items array
        setMovimientos(Array.isArray(data) ? data : (data.items || []));
      }
      if (cierresRes.ok) {
        const data = await cierresRes.json();
        // cierres returns paginated response with items array
        setCierres(Array.isArray(data) ? data : (data.items || []));
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (plRes.ok) {
        const data = await plRes.json();
        setPLData(data);
      }
      if (pendientesRes.ok) {
        const data = await pendientesRes.json();
        setPedidosPendientes(Array.isArray(data) ? data : []);
      }
      if (cobroStatsRes.ok) {
        const data = await cobroStatsRes.json();
        setCobroStats(data);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const guardarCuenta = async () => {
    try {
      setGuardando(true);
      const response = await fetch(`${API_URL}/tesoreria/cuentas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formCuenta,
          balance_inicial: parseFloat(formCuenta.balance_inicial),
        }),
      });

      if (response.ok) {
        await cargarDatos();
        cerrarModalCuenta();
      }
    } catch (error) {
      console.error("Error guardando cuenta:", error);
    } finally {
      setGuardando(false);
    }
  };

  const guardarMovimiento = async () => {
    try {
      setGuardando(true);
      const response = await fetch(`${API_URL}/tesoreria/movimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formMovimiento,
          cuenta_id: parseInt(formMovimiento.cuenta_id),
          importe: parseFloat(formMovimiento.importe),
        }),
      });

      if (response.ok) {
        await cargarDatos();
        cerrarModalMovimiento();
      }
    } catch (error) {
      console.error("Error guardando movimiento:", error);
    } finally {
      setGuardando(false);
    }
  };

  const realizarTransferencia = async () => {
    try {
      setGuardando(true);
      const response = await fetch(`${API_URL}/tesoreria/transferencia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuenta_origen_id: parseInt(formTransferencia.cuenta_origen_id),
          cuenta_destino_id: parseInt(formTransferencia.cuenta_destino_id),
          importe: parseFloat(formTransferencia.importe),
          concepto: formTransferencia.concepto,
        }),
      });

      if (response.ok) {
        await cargarDatos();
        cerrarModalTransferencia();
      }
    } catch (error) {
      console.error("Error realizando transferencia:", error);
    } finally {
      setGuardando(false);
    }
  };

  const crearCierre = async () => {
    try {
      setGuardando(true);
      const response = await fetch(`${API_URL}/tesoreria/cierres`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cuenta_id: parseInt(formCierre.cuenta_id),
          balance_real: formCierre.balance_real ? parseFloat(formCierre.balance_real) : null,
          notas: formCierre.notas || null,
        }),
      });

      if (response.ok) {
        await cargarDatos();
        cerrarModalCierre();
      }
    } catch (error) {
      console.error("Error creando cierre:", error);
    } finally {
      setGuardando(false);
    }
  };

  const cerrarModalCuenta = () => {
    setModalCuentaOpen(false);
    setFormCuenta({ nombre: "", tipo: "efectivo", balance_inicial: "0" });
  };

  const cerrarModalMovimiento = () => {
    setModalMovimientoOpen(false);
    setFormMovimiento({
      cuenta_id: "",
      tipo: "ingreso",
      importe: "",
      concepto: "",
      notas: "",
    });
  };

  const cerrarModalTransferencia = () => {
    setModalTransferenciaOpen(false);
    setFormTransferencia({
      cuenta_origen_id: "",
      cuenta_destino_id: "",
      importe: "",
      concepto: "Transferencia entre cuentas",
    });
  };

  const cerrarModalCierre = () => {
    setModalCierreOpen(false);
    setFormCierre({ cuenta_id: "", balance_real: "", notas: "" });
  };

  const abrirModalCobro = (pedido: PedidoPendienteCobro) => {
    setPedidoACobrar(pedido);
    setFormCobro({ metodo_cobro: "efectivo", cuenta_id: "" });
    setModalCobroOpen(true);
  };

  const cerrarModalCobro = () => {
    setModalCobroOpen(false);
    setPedidoACobrar(null);
    setFormCobro({ metodo_cobro: "efectivo", cuenta_id: "" });
  };

  const registrarCobro = async () => {
    if (!pedidoACobrar) return;

    try {
      setRegistrandoCobro(true);
      const response = await fetch(`${API_URL}/pedidos/${pedidoACobrar.id}/cobro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metodo_cobro: formCobro.metodo_cobro,
          cuenta_id: formCobro.cuenta_id ? parseInt(formCobro.cuenta_id) : null,
        }),
      });

      if (response.ok) {
        await cargarDatos();
        cerrarModalCobro();
      } else {
        const error = await response.json();
        alert(error.detail || "Error al registrar cobro");
      }
    } catch (error) {
      console.error("Error registrando cobro:", error);
      alert("Error al registrar cobro");
    } finally {
      setRegistrandoCobro(false);
    }
  };

  // Filtrar movimientos
  const movimientosFiltrados = movimientos.filter((mov) => {
    const matchBusqueda = mov.concepto.toLowerCase().includes(busqueda.toLowerCase());
    const matchCuenta = filtroCuenta === "todas" || mov.cuenta_id.toString() === filtroCuenta;
    const matchTipo = filtroTipo === "todos" || mov.tipo === filtroTipo;
    return matchBusqueda && matchCuenta && matchTipo;
  });

  const getCuentaNombre = (cuentaId: number) => {
    return cuentas.find((c) => c.id === cuentaId)?.nombre || "Cuenta";
  };

  const getTipoCuentaIcon = (tipo: string) => {
    const tipoConfig = TIPOS_CUENTA.find((t) => t.valor === tipo);
    return tipoConfig?.icon || Wallet;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-salvia-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-carbon-800">Tesorería</h1>
          <p className="text-carbon-500">Gestiona las cuentas y movimientos de caja</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setModalCuentaOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cuenta
          </Button>
          <Button variant="outline" onClick={() => setModalTransferenciaOpen(true)}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            Transferencia
          </Button>
          <Button variant="outline" onClick={() => setModalCierreOpen(true)}>
            <Lock className="h-4 w-4 mr-2" />
            Cierre de Caja
          </Button>
          <Button onClick={() => setModalMovimientoOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Movimiento
          </Button>
        </div>
      </div>

      {/* Stats generales - Flujo de Caja */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="border-crudo-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-salvia-500" />
              <span className="text-sm text-carbon-500">Balance Total</span>
            </div>
            <div className="text-2xl font-bold text-carbon-800">
              {stats?.balance_total?.toFixed(2) || "0.00"}€
            </div>
          </CardContent>
        </Card>
        <Card className="border-crudo-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownLeft className="h-4 w-4 text-green-500" />
              <span className="text-sm text-carbon-500">Cobros Mes</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              +{stats?.ingresos_mes?.toFixed(2) || "0.00"}€
            </div>
          </CardContent>
        </Card>
        <Card className="border-crudo-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowUpRight className="h-4 w-4 text-red-500" />
              <span className="text-sm text-carbon-500">Pagos Mes</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              -{stats?.gastos_mes?.toFixed(2) || "0.00"}€
            </div>
          </CardContent>
        </Card>
        <Card className={`border-crudo-200 ${(cobroStats?.pendientes_cobro || 0) > 0 ? "border-amber-300 bg-amber-50/30" : ""}`}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-carbon-500">Pte. Cobrar</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {cobroStats?.total_pendiente?.toFixed(2) || "0.00"}€
            </div>
            <div className="text-xs text-carbon-500">
              {cobroStats?.pendientes_cobro || 0} pedidos
            </div>
          </CardContent>
        </Card>
        <Card className="border-crudo-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-carbon-500">Pte. Pagar</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              0.00€
            </div>
            <div className="text-xs text-carbon-500">
              0 gastos
            </div>
          </CardContent>
        </Card>
        <Card className="border-crudo-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Euro className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-carbon-500">Movimientos</span>
            </div>
            <div className="text-2xl font-bold text-carbon-800">
              {stats?.num_movimientos_mes || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cuentas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cuentas.map((cuenta) => {
          const TipoCuentaIcon = getTipoCuentaIcon(cuenta.tipo);
          return (
            <Card key={cuenta.id} className="border-crudo-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-salvia-100 rounded-lg">
                      <TipoCuentaIcon className="h-5 w-5 text-salvia-600" />
                    </div>
                    <div>
                      <div className="font-medium text-carbon-800">{cuenta.nombre}</div>
                      <div className="text-xs text-carbon-500 capitalize">{cuenta.tipo}</div>
                    </div>
                  </div>
                  {!cuenta.activa && (
                    <Badge variant="outline" className="text-carbon-400">
                      Inactiva
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-bold text-carbon-800">
                  {cuenta.balance_actual.toFixed(2)}€
                </div>
              </CardContent>
            </Card>
          );
        })}
        {cuentas.length === 0 && (
          <Card className="border-crudo-200 col-span-3">
            <CardContent className="pt-6 text-center text-carbon-500">
              No hay cuentas creadas. Crea una cuenta para comenzar.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="movimientos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
          <TabsTrigger value="pendientes" className="relative">
            Pendientes Cobro
            {pedidosPendientes.length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs rounded-full px-2 py-0.5">
                {pedidosPendientes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cierres">Cierres de Caja</TabsTrigger>
          <TabsTrigger value="pl">P&L Dashboard</TabsTrigger>
        </TabsList>

        {/* Tab Movimientos */}
        <TabsContent value="movimientos">
          <Card className="border-crudo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ArrowLeftRight className="h-5 w-5 text-salvia-500" />
                Movimientos de Caja
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                  <Input
                    placeholder="Buscar por concepto..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filtroCuenta} onValueChange={setFiltroCuenta}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {cuentas.map((cuenta) => (
                      <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                        {cuenta.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ingreso">Ingresos</SelectItem>
                    <SelectItem value="gasto">Gastos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabla */}
              <div className="border border-crudo-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-crudo-50">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movimientosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-carbon-500">
                          No hay movimientos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      movimientosFiltrados.map((mov) => (
                        <TableRow key={mov.id} className="hover:bg-crudo-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-carbon-400" />
                              {new Date(mov.fecha).toLocaleDateString("es-ES")}
                            </div>
                          </TableCell>
                          <TableCell>
                            {mov.tipo === "ingreso" ? (
                              <Badge className="bg-green-100 text-green-700">
                                <ArrowDownLeft className="h-3 w-3 mr-1" />
                                Ingreso
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700">
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                Gasto
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-carbon-800">{mov.concepto}</div>
                              {mov.referencia_tipo && (
                                <div className="text-xs text-carbon-500">
                                  Ref: {mov.referencia_tipo} #{mov.referencia_id}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getCuentaNombre(mov.cuenta_id)}</TableCell>
                          <TableCell
                            className={`text-right font-bold ${
                              mov.tipo === "ingreso" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {mov.tipo === "ingreso" ? "+" : "-"}
                            {mov.importe.toFixed(2)}€
                          </TableCell>
                          <TableCell className="text-right text-carbon-600">
                            {mov.balance_posterior?.toFixed(2) || "-"}€
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setMovimientoDetalle(mov)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Pendientes de Cobro */}
        <TabsContent value="pendientes">
          <div className="space-y-6">
            {/* Stats de cobro */}
            {cobroStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-crudo-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-carbon-500">Total Ventas</span>
                    </div>
                    <div className="text-2xl font-bold text-carbon-800">
                      {cobroStats.total_ventas.toFixed(2)}€
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-crudo-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-carbon-500">Cobrado</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {cobroStats.total_cobrado.toFixed(2)}€
                    </div>
                    <div className="text-xs text-carbon-500 mt-1">
                      {cobroStats.cobrados} pedidos
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-crudo-200 border-amber-300">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="text-sm text-carbon-500">Pendiente</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">
                      {cobroStats.total_pendiente.toFixed(2)}€
                    </div>
                    <div className="text-xs text-carbon-500 mt-1">
                      {cobroStats.pendientes_cobro} pedidos
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-crudo-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Euro className="h-4 w-4 text-salvia-500" />
                      <span className="text-sm text-carbon-500">% Cobrado</span>
                    </div>
                    <div className="text-2xl font-bold text-carbon-800">
                      {cobroStats.total_ventas > 0
                        ? ((cobroStats.total_cobrado / cobroStats.total_ventas) * 100).toFixed(1)
                        : 0}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Lista de pedidos pendientes de cobro */}
            <Card className="border-crudo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Pedidos Pendientes de Cobro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border border-crudo-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-crudo-50">
                        <TableHead>Pedido</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Tipo Esperado</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedidosPendientes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-carbon-500">
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                            No hay pedidos pendientes de cobro
                          </TableCell>
                        </TableRow>
                      ) : (
                        pedidosPendientes.map((pedido) => (
                          <TableRow key={pedido.id} className="hover:bg-crudo-50">
                            <TableCell>
                              <span className="font-mono font-medium">#{pedido.id}</span>
                            </TableCell>
                            <TableCell>
                              {pedido.nombre_envio || "Sin nombre"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-carbon-400" />
                                {new Date(pedido.created_at).toLocaleDateString("es-ES")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  pedido.estado === "pagado"
                                    ? "bg-blue-100 text-blue-700"
                                    : pedido.estado === "preparando"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-100 text-gray-700"
                                }
                              >
                                {pedido.estado}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  pedido.stripe_payment_id
                                    ? "border-blue-300 text-blue-700"
                                    : "border-amber-300 text-amber-700"
                                }
                              >
                                {pedido.tipo_cobro_esperado}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-carbon-800">
                              {pedido.total.toFixed(2)}€
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => abrirModalCobro(pedido)}
                              >
                                <Euro className="h-4 w-4 mr-1" />
                                Cobrar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Cierres */}
        <TabsContent value="cierres">
          <Card className="border-crudo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="h-5 w-5 text-salvia-500" />
                Cierres de Caja
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-crudo-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-crudo-50">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cuenta</TableHead>
                      <TableHead className="text-right">Balance Inicial</TableHead>
                      <TableHead className="text-right">Ingresos</TableHead>
                      <TableHead className="text-right">Gastos</TableHead>
                      <TableHead className="text-right">Balance Final</TableHead>
                      <TableHead className="text-right">Diferencia</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cierres.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-carbon-500">
                          No hay cierres registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      cierres.map((cierre) => (
                        <TableRow key={cierre.id} className="hover:bg-crudo-50">
                          <TableCell>
                            {new Date(cierre.fecha).toLocaleDateString("es-ES")}
                          </TableCell>
                          <TableCell>{getCuentaNombre(cierre.cuenta_id)}</TableCell>
                          <TableCell className="text-right">
                            {cierre.balance_inicial.toFixed(2)}€
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            +{cierre.total_ingresos.toFixed(2)}€
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            -{cierre.total_gastos.toFixed(2)}€
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {cierre.balance_final.toFixed(2)}€
                          </TableCell>
                          <TableCell
                            className={`text-right font-bold ${
                              cierre.diferencia === 0
                                ? "text-green-600"
                                : cierre.diferencia && cierre.diferencia > 0
                                ? "text-blue-600"
                                : "text-red-600"
                            }`}
                          >
                            {cierre.diferencia !== null && cierre.diferencia !== undefined
                              ? `${cierre.diferencia >= 0 ? "+" : ""}${cierre.diferencia.toFixed(
                                  2
                                )}€`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {cierre.cerrado ? (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Cerrado
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700">
                                <Lock className="h-3 w-3 mr-1" />
                                Pendiente
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab P&L */}
        <TabsContent value="pl">
          <div className="grid gap-6">
            {/* Resumen P&L */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-crudo-200">
                <CardContent className="pt-4">
                  <div className="text-sm text-carbon-500 mb-1">Ingresos Totales</div>
                  <div className="text-2xl font-bold text-green-600">
                    +{plData?.ingresos?.total?.toFixed(2) || "0.00"}€
                  </div>
                </CardContent>
              </Card>
              <Card className="border-crudo-200">
                <CardContent className="pt-4">
                  <div className="text-sm text-carbon-500 mb-1">Gastos Totales</div>
                  <div className="text-2xl font-bold text-red-600">
                    -{plData?.gastos?.total?.toFixed(2) || "0.00"}€
                  </div>
                </CardContent>
              </Card>
              <Card className="border-crudo-200">
                <CardContent className="pt-4">
                  <div className="text-sm text-carbon-500 mb-1">Resultado</div>
                  <div
                    className={`text-2xl font-bold ${
                      (plData?.resultado || 0) >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {(plData?.resultado || 0) >= 0 ? "+" : ""}
                    {plData?.resultado?.toFixed(2) || "0.00"}€
                  </div>
                </CardContent>
              </Card>
              <Card className="border-crudo-200">
                <CardContent className="pt-4">
                  <div className="text-sm text-carbon-500 mb-1">Margen</div>
                  <div
                    className={`text-2xl font-bold ${
                      (plData?.margen || 0) >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {plData?.margen?.toFixed(1) || "0"}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Desglose */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ingresos */}
              <Card className="border-crudo-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-green-700">
                    <TrendingUp className="h-5 w-5" />
                    Ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-crudo-50 rounded-lg">
                      <span>Reservas (servicios)</span>
                      <span className="font-bold">
                        {plData?.ingresos?.reservas?.toFixed(2) || "0.00"}€
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-crudo-50 rounded-lg">
                      <span>Pedidos (tienda)</span>
                      <span className="font-bold">
                        {plData?.ingresos?.pedidos?.toFixed(2) || "0.00"}€
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-crudo-50 rounded-lg">
                      <span>Otros ingresos</span>
                      <span className="font-bold">
                        {plData?.ingresos?.otros?.toFixed(2) || "0.00"}€
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gastos */}
              <Card className="border-crudo-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-red-700">
                    <TrendingDown className="h-5 w-5" />
                    Gastos por Categoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {plData?.gastos?.por_categoria?.map((item) => (
                      <div
                        key={item.categoria}
                        className="flex justify-between items-center p-3 bg-crudo-50 rounded-lg"
                      >
                        <span className="capitalize">{item.categoria}</span>
                        <span className="font-bold">{item.total.toFixed(2)}€</span>
                      </div>
                    )) || (
                      <p className="text-carbon-500 text-center py-4">
                        No hay datos de gastos
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Nueva Cuenta */}
      <Dialog open={modalCuentaOpen} onOpenChange={(open) => !open && cerrarModalCuenta()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Cuenta de Caja</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cuenta_nombre">Nombre *</Label>
              <Input
                id="cuenta_nombre"
                value={formCuenta.nombre}
                onChange={(e) => setFormCuenta({ ...formCuenta, nombre: e.target.value })}
                placeholder="Ej: Caja Principal"
              />
            </div>

            <div>
              <Label htmlFor="cuenta_tipo">Tipo *</Label>
              <Select
                value={formCuenta.tipo}
                onValueChange={(value) => setFormCuenta({ ...formCuenta, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CUENTA.map((tipo) => (
                    <SelectItem key={tipo.valor} value={tipo.valor}>
                      {tipo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="balance_inicial">Balance Inicial (€)</Label>
              <Input
                id="balance_inicial"
                type="number"
                step="0.01"
                value={formCuenta.balance_inicial}
                onChange={(e) =>
                  setFormCuenta({ ...formCuenta, balance_inicial: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cerrarModalCuenta}>
              Cancelar
            </Button>
            <Button onClick={guardarCuenta} disabled={guardando || !formCuenta.nombre}>
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crear Cuenta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nuevo Movimiento */}
      <Dialog
        open={modalMovimientoOpen}
        onOpenChange={(open) => !open && cerrarModalMovimiento()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Movimiento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="mov_cuenta">Cuenta *</Label>
              <Select
                value={formMovimiento.cuenta_id}
                onValueChange={(value) =>
                  setFormMovimiento({ ...formMovimiento, cuenta_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {cuentas.map((cuenta) => (
                    <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                      {cuenta.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mov_tipo">Tipo *</Label>
              <Select
                value={formMovimiento.tipo}
                onValueChange={(value) => setFormMovimiento({ ...formMovimiento, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="gasto">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mov_importe">Importe (€) *</Label>
              <Input
                id="mov_importe"
                type="number"
                step="0.01"
                value={formMovimiento.importe}
                onChange={(e) =>
                  setFormMovimiento({ ...formMovimiento, importe: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="mov_concepto">Concepto *</Label>
              <Input
                id="mov_concepto"
                value={formMovimiento.concepto}
                onChange={(e) =>
                  setFormMovimiento({ ...formMovimiento, concepto: e.target.value })
                }
                placeholder="Descripción del movimiento"
              />
            </div>

            <div>
              <Label htmlFor="mov_notas">Notas</Label>
              <Textarea
                id="mov_notas"
                value={formMovimiento.notas}
                onChange={(e) =>
                  setFormMovimiento({ ...formMovimiento, notas: e.target.value })
                }
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cerrarModalMovimiento}>
              Cancelar
            </Button>
            <Button
              onClick={guardarMovimiento}
              disabled={
                guardando ||
                !formMovimiento.cuenta_id ||
                !formMovimiento.importe ||
                !formMovimiento.concepto
              }
            >
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crear Movimiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Transferencia */}
      <Dialog
        open={modalTransferenciaOpen}
        onOpenChange={(open) => !open && cerrarModalTransferencia()}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transferencia entre Cuentas</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="trans_origen">Cuenta Origen *</Label>
              <Select
                value={formTransferencia.cuenta_origen_id}
                onValueChange={(value) =>
                  setFormTransferencia({ ...formTransferencia, cuenta_origen_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {cuentas.map((cuenta) => (
                    <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                      {cuenta.nombre} ({cuenta.balance_actual.toFixed(2)}€)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="trans_destino">Cuenta Destino *</Label>
              <Select
                value={formTransferencia.cuenta_destino_id}
                onValueChange={(value) =>
                  setFormTransferencia({ ...formTransferencia, cuenta_destino_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {cuentas
                    .filter((c) => c.id.toString() !== formTransferencia.cuenta_origen_id)
                    .map((cuenta) => (
                      <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                        {cuenta.nombre} ({cuenta.balance_actual.toFixed(2)}€)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="trans_importe">Importe (€) *</Label>
              <Input
                id="trans_importe"
                type="number"
                step="0.01"
                value={formTransferencia.importe}
                onChange={(e) =>
                  setFormTransferencia({ ...formTransferencia, importe: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="trans_concepto">Concepto</Label>
              <Input
                id="trans_concepto"
                value={formTransferencia.concepto}
                onChange={(e) =>
                  setFormTransferencia({ ...formTransferencia, concepto: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cerrarModalTransferencia}>
              Cancelar
            </Button>
            <Button
              onClick={realizarTransferencia}
              disabled={
                guardando ||
                !formTransferencia.cuenta_origen_id ||
                !formTransferencia.cuenta_destino_id ||
                !formTransferencia.importe
              }
            >
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Realizar Transferencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Cierre de Caja */}
      <Dialog open={modalCierreOpen} onOpenChange={(open) => !open && cerrarModalCierre()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cierre de Caja</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="cierre_cuenta">Cuenta *</Label>
              <Select
                value={formCierre.cuenta_id}
                onValueChange={(value) => setFormCierre({ ...formCierre, cuenta_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  {cuentas.map((cuenta) => (
                    <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                      {cuenta.nombre} ({cuenta.balance_actual.toFixed(2)}€)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="balance_real">Balance Real (€)</Label>
              <Input
                id="balance_real"
                type="number"
                step="0.01"
                value={formCierre.balance_real}
                onChange={(e) => setFormCierre({ ...formCierre, balance_real: e.target.value })}
                placeholder="Conteo de caja real (opcional)"
              />
              <p className="text-xs text-carbon-500 mt-1">
                Introduce el conteo real para detectar diferencias
              </p>
            </div>

            <div>
              <Label htmlFor="cierre_notas">Notas</Label>
              <Textarea
                id="cierre_notas"
                value={formCierre.notas}
                onChange={(e) => setFormCierre({ ...formCierre, notas: e.target.value })}
                placeholder="Observaciones del cierre..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cerrarModalCierre}>
              Cancelar
            </Button>
            <Button onClick={crearCierre} disabled={guardando || !formCierre.cuenta_id}>
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Crear Cierre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle Movimiento */}
      <Dialog
        open={!!movimientoDetalle}
        onOpenChange={(open) => !open && setMovimientoDetalle(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle del Movimiento</DialogTitle>
          </DialogHeader>

          {movimientoDetalle && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-carbon-500">Fecha</div>
                  <div className="font-medium">
                    {new Date(movimientoDetalle.fecha).toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-carbon-500">Tipo</div>
                  <Badge
                    className={
                      movimientoDetalle.tipo === "ingreso"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {movimientoDetalle.tipo === "ingreso" ? "Ingreso" : "Gasto"}
                  </Badge>
                </div>
              </div>

              <div>
                <div className="text-sm text-carbon-500">Concepto</div>
                <div className="font-medium">{movimientoDetalle.concepto}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-carbon-500">Importe</div>
                  <div
                    className={`text-xl font-bold ${
                      movimientoDetalle.tipo === "ingreso" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {movimientoDetalle.tipo === "ingreso" ? "+" : "-"}
                    {movimientoDetalle.importe.toFixed(2)}€
                  </div>
                </div>
                <div>
                  <div className="text-sm text-carbon-500">Saldo posterior</div>
                  <div className="text-xl font-bold text-carbon-800">
                    {movimientoDetalle.balance_posterior?.toFixed(2) || "-"}€
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm text-carbon-500">Cuenta</div>
                <div className="font-medium">{getCuentaNombre(movimientoDetalle.cuenta_id)}</div>
              </div>

              {movimientoDetalle.referencia_tipo && (
                <div>
                  <div className="text-sm text-carbon-500">Referencia</div>
                  <div className="font-medium">
                    {movimientoDetalle.referencia_tipo} #{movimientoDetalle.referencia_id}
                  </div>
                </div>
              )}

              {movimientoDetalle.notas && (
                <div>
                  <div className="text-sm text-carbon-500">Notas</div>
                  <div className="text-carbon-700">{movimientoDetalle.notas}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Registrar Cobro */}
      <Dialog open={modalCobroOpen} onOpenChange={(open) => !open && cerrarModalCobro()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Cobro</DialogTitle>
          </DialogHeader>

          {pedidoACobrar && (
            <div className="space-y-4">
              {/* Info del pedido */}
              <div className="bg-crudo-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-carbon-500">Pedido</div>
                    <div className="font-bold">#{pedidoACobrar.id}</div>
                  </div>
                  <div>
                    <div className="text-sm text-carbon-500">Importe</div>
                    <div className="text-xl font-bold text-green-600">
                      {pedidoACobrar.total.toFixed(2)}€
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-carbon-500">Cliente</div>
                    <div className="font-medium">
                      {pedidoACobrar.nombre_envio || "Sin nombre"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Método de cobro */}
              <div>
                <Label htmlFor="cobro_metodo">Método de Cobro *</Label>
                <Select
                  value={formCobro.metodo_cobro}
                  onValueChange={(value) =>
                    setFormCobro({ ...formCobro, metodo_cobro: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        Efectivo
                      </div>
                    </SelectItem>
                    <SelectItem value="tarjeta_online">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Tarjeta Online (Stripe)
                      </div>
                    </SelectItem>
                    <SelectItem value="tpv">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        TPV (Datáfono)
                      </div>
                    </SelectItem>
                    <SelectItem value="transferencia">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Transferencia
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Cuenta destino (opcional) */}
              <div>
                <Label htmlFor="cobro_cuenta">Cuenta de Destino (opcional)</Label>
                <Select
                  value={formCobro.cuenta_id}
                  onValueChange={(value) =>
                    setFormCobro({ ...formCobro, cuenta_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Automática según método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Automática según método</SelectItem>
                    {cuentas.map((cuenta) => (
                      <SelectItem key={cuenta.id} value={cuenta.id.toString()}>
                        {cuenta.nombre} ({cuenta.balance_actual.toFixed(2)}€)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-carbon-500 mt-1">
                  Si no seleccionas cuenta, se usará la cuenta por defecto según el método
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={cerrarModalCobro}>
              Cancelar
            </Button>
            <Button
              onClick={registrarCobro}
              disabled={registrandoCobro || !pedidoACobrar}
            >
              {registrandoCobro ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Confirmar Cobro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
