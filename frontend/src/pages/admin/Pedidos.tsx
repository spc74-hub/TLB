import { useState, useEffect } from "react";
import {
  Loader2,
  Package,
  Search,
  Truck,
  Clock,
  CheckCircle2,
  Eye,
  MapPin,
  Phone,
  Banknote,
  CreditCard,
  Wallet,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  getAllPedidos,
  actualizarEstadoPedido,
  type Pedido,
  type EstadoPedido,
} from '@/lib/api';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/api/v1";

type MetodoCobro = "efectivo" | "transferencia" | "tarjeta_online" | "tpv";

interface PedidoConCobro extends Pedido {
  cobrado?: boolean;
  fecha_cobro?: string;
  metodo_cobro_tipo?: MetodoCobro | null;
}

const METODOS_COBRO: { valor: MetodoCobro; nombre: string; icon: React.ReactNode }[] = [
  { valor: "efectivo", nombre: "Efectivo", icon: <Banknote className="h-4 w-4" /> },
  { valor: "tarjeta_online", nombre: "Tarjeta Online", icon: <CreditCard className="h-4 w-4" /> },
  { valor: "tpv", nombre: "TPV/Datafono", icon: <Wallet className="h-4 w-4" /> },
  { valor: "transferencia", nombre: "Transferencia", icon: <Building2 className="h-4 w-4" /> },
];

const ESTADOS: { valor: EstadoPedido; nombre: string; color: string; icon: React.ReactNode }[] = [
  { valor: "pendiente", nombre: "Pendiente", color: "bg-amber-100 text-amber-700", icon: <Clock className="h-3 w-3" /> },
  { valor: "pagado", nombre: "Pagado", color: "bg-blue-100 text-blue-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  { valor: "preparando", nombre: "Preparando", color: "bg-purple-100 text-purple-700", icon: <Package className="h-3 w-3" /> },
  { valor: "enviado", nombre: "Enviado", color: "bg-salvia-100 text-salvia-700", icon: <Truck className="h-3 w-3" /> },
  { valor: "entregado", nombre: "Entregado", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  { valor: "cancelado", nombre: "Cancelado", color: "bg-red-100 text-red-700", icon: <Clock className="h-3 w-3" /> },
];

export function Pedidos() {
  const [pedidos, setPedidos] = useState<PedidoConCobro[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [pedidoDetalle, setPedidoDetalle] = useState<PedidoConCobro | null>(null);
  const [actualizando, setActualizando] = useState(false);

  // Estados para modal de cobro
  const [modalCobroOpen, setModalCobroOpen] = useState(false);
  const [pedidoACobrar, setPedidoACobrar] = useState<PedidoConCobro | null>(null);
  const [metodoCobro, setMetodoCobro] = useState<MetodoCobro>("efectivo");
  const [registrandoCobro, setRegistrandoCobro] = useState(false);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const data = await getAllPedidos();
      setPedidos(data as PedidoConCobro[]);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCobro = (pedido: PedidoConCobro) => {
    setPedidoACobrar(pedido);
    setMetodoCobro("efectivo");
    setModalCobroOpen(true);
  };

  const cerrarModalCobro = () => {
    setModalCobroOpen(false);
    setPedidoACobrar(null);
  };

  const registrarCobro = async () => {
    if (!pedidoACobrar) return;

    try {
      setRegistrandoCobro(true);
      const response = await fetch(`${API_URL}/pedidos/${pedidoACobrar.id}/cobro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodo_cobro: metodoCobro }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al registrar cobro");
      }

      // Actualizar pedido localmente
      setPedidos((prev) =>
        prev.map((p) =>
          p.id === pedidoACobrar.id
            ? { ...p, cobrado: true, metodo_cobro_tipo: metodoCobro, fecha_cobro: new Date().toISOString() }
            : p
        )
      );

      // Actualizar detalle si está abierto
      if (pedidoDetalle?.id === pedidoACobrar.id) {
        setPedidoDetalle((prev) =>
          prev ? { ...prev, cobrado: true, metodo_cobro_tipo: metodoCobro, fecha_cobro: new Date().toISOString() } : null
        );
      }

      cerrarModalCobro();
    } catch (error) {
      console.error("Error registrando cobro:", error);
      alert(error instanceof Error ? error.message : "Error al registrar cobro");
    } finally {
      setRegistrandoCobro(false);
    }
  };

  const cambiarEstado = async (pedidoId: number, nuevoEstado: EstadoPedido) => {
    try {
      setActualizando(true);
      await actualizarEstadoPedido(pedidoId, nuevoEstado);
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
      );
      if (pedidoDetalle?.id === pedidoId) {
        setPedidoDetalle((prev) => (prev ? { ...prev, estado: nuevoEstado } : null));
      }
    } catch (error) {
      console.error("Error actualizando estado:", error);
    } finally {
      setActualizando(false);
    }
  };

  const getEstadoConfig = (estado: EstadoPedido) => {
    return ESTADOS.find((e) => e.valor === estado) || ESTADOS[0];
  };

  // Filtrar pedidos
  const pedidosFiltrados = pedidos.filter((pedido) => {
    const matchBusqueda =
      pedido.id.toString().includes(busqueda) ||
      pedido.nombre_envio?.toLowerCase().includes(busqueda.toLowerCase()) ||
      pedido.stripe_payment_id?.toLowerCase().includes(busqueda.toLowerCase());

    const matchEstado = filtroEstado === "todos" || pedido.estado === filtroEstado;

    return matchBusqueda && matchEstado;
  });

  // Estadísticas
  const stats = {
    total: pedidos.length,
    pendientes: pedidos.filter((p) => p.estado === "pagado" || p.estado === "preparando").length,
    enviados: pedidos.filter((p) => p.estado === "enviado").length,
    totalVentas: pedidos
      .filter((p) => p.estado !== "cancelado" && p.estado !== "pendiente")
      .reduce((sum, p) => sum + p.total, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-salvia-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-carbon-800">Pedidos</h1>
        <p className="text-carbon-500">Gestiona los pedidos de la tienda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-crudo-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-carbon-800">{stats.total}</div>
            <div className="text-sm text-carbon-500">Total pedidos</div>
          </CardContent>
        </Card>
        <Card className="border-crudo-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{stats.pendientes}</div>
            <div className="text-sm text-carbon-500">Por procesar</div>
          </CardContent>
        </Card>
        <Card className="border-crudo-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-salvia-600">{stats.enviados}</div>
            <div className="text-sm text-carbon-500">En camino</div>
          </CardContent>
        </Card>
        <Card className="border-crudo-200">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-carbon-800">{stats.totalVentas.toFixed(2)}€</div>
            <div className="text-sm text-carbon-500">Ventas totales</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="border-crudo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-salvia-500" />
            Lista de pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
              <Input
                placeholder="Buscar por ID, cliente o Stripe ID..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroEstado} onValueChange={setFiltroEstado}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                {ESTADOS.map((estado) => (
                  <SelectItem key={estado.valor} value={estado.valor}>
                    {estado.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabla */}
          <div className="border border-crudo-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-crudo-50">
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Cobrado</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-carbon-500">
                      No hay pedidos que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                ) : (
                  pedidosFiltrados.map((pedido) => {
                    const estadoConfig = getEstadoConfig(pedido.estado);
                    const metodoCobrado = METODOS_COBRO.find(m => m.valor === pedido.metodo_cobro_tipo);
                    return (
                      <TableRow key={pedido.id} className="hover:bg-crudo-50">
                        <TableCell className="font-medium">#{pedido.id}</TableCell>
                        <TableCell>
                          {new Date(pedido.created_at).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium text-carbon-800">
                              {pedido.nombre_envio || "Sin nombre"}
                            </div>
                            <div className="text-carbon-500">
                              {pedido.ciudad_envio || "Sin ciudad"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={pedido.estado}
                            onValueChange={(value) => cambiarEstado(pedido.id, value as EstadoPedido)}
                            disabled={actualizando}
                          >
                            <SelectTrigger className="w-36 h-8">
                              <Badge className={`${estadoConfig.color} flex items-center gap-1`}>
                                {estadoConfig.icon}
                                {estadoConfig.nombre}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {ESTADOS.map((estado) => (
                                <SelectItem key={estado.valor} value={estado.valor}>
                                  <div className="flex items-center gap-2">
                                    {estado.icon}
                                    {estado.nombre}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          {pedido.cobrado ? (
                            <Badge className="bg-green-100 text-green-700 flex items-center gap-1 justify-center">
                              {metodoCobrado?.icon || <CheckCircle2 className="h-3 w-3" />}
                              {metodoCobrado?.nombre || "Cobrado"}
                            </Badge>
                          ) : pedido.estado === "cancelado" ? (
                            <Badge variant="outline" className="text-carbon-400">
                              -
                            </Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-amber-600 border-amber-300 hover:bg-amber-50"
                              onClick={() => abrirModalCobro(pedido)}
                            >
                              <Banknote className="h-3 w-3 mr-1" />
                              Cobrar
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {pedido.total.toFixed(2)}€
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPedidoDetalle(pedido)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalle */}
      <Dialog open={!!pedidoDetalle} onOpenChange={(open) => !open && setPedidoDetalle(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pedido #{pedidoDetalle?.id}</DialogTitle>
          </DialogHeader>

          {pedidoDetalle && (
            <div className="space-y-6">
              {/* Info general */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-carbon-500">Fecha</div>
                  <div className="font-medium">
                    {new Date(pedidoDetalle.created_at).toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-carbon-500">Estado</div>
                  <Select
                    value={pedidoDetalle.estado}
                    onValueChange={(value) => cambiarEstado(pedidoDetalle.id, value as EstadoPedido)}
                    disabled={actualizando}
                  >
                    <SelectTrigger className="w-40 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS.map((estado) => (
                        <SelectItem key={estado.valor} value={estado.valor}>
                          {estado.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Datos de envío */}
              <div className="bg-crudo-50 p-4 rounded-lg">
                <h3 className="font-semibold text-carbon-800 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-salvia-600" />
                  Datos de envío
                </h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-carbon-500">Nombre</div>
                    <div className="font-medium">{pedidoDetalle.nombre_envio || "-"}</div>
                  </div>
                  <div>
                    <div className="text-carbon-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> Teléfono
                    </div>
                    <div className="font-medium">{pedidoDetalle.telefono_envio || "-"}</div>
                  </div>
                  <div className="sm:col-span-2">
                    <div className="text-carbon-500">Dirección</div>
                    <div className="font-medium">
                      {pedidoDetalle.direccion_envio}<br />
                      {pedidoDetalle.cp_envio} {pedidoDetalle.ciudad_envio}
                    </div>
                  </div>
                  {pedidoDetalle.notas && (
                    <div className="sm:col-span-2">
                      <div className="text-carbon-500">Notas</div>
                      <div className="font-medium">{pedidoDetalle.notas}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Productos */}
              <div>
                <h3 className="font-semibold text-carbon-800 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-salvia-600" />
                  Productos
                </h3>
                <div className="border border-crudo-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-crudo-50">
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedidoDetalle.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.nombre_producto || "Producto"}</TableCell>
                          <TableCell className="text-center">{item.cantidad}</TableCell>
                          <TableCell className="text-right">
                            {item.precio_unitario.toFixed(2)}€
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.precio_total.toFixed(2)}€
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Resumen */}
              <div className="border-t border-crudo-200 pt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-carbon-500">Subtotal</span>
                  <span>{pedidoDetalle.subtotal.toFixed(2)}€</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-carbon-500">Envío</span>
                  <span>
                    {pedidoDetalle.coste_envio > 0
                      ? `${pedidoDetalle.coste_envio.toFixed(2)}€`
                      : "Gratis"}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{pedidoDetalle.total.toFixed(2)}€</span>
                </div>
              </div>

              {/* Estado de cobro */}
              <div className="bg-crudo-50 p-4 rounded-lg">
                <h3 className="font-semibold text-carbon-800 mb-3 flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-salvia-600" />
                  Estado de Cobro
                </h3>
                {pedidoDetalle.cobrado ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Cobrado
                    </Badge>
                    <span className="text-sm text-carbon-600">
                      {METODOS_COBRO.find(m => m.valor === pedidoDetalle.metodo_cobro_tipo)?.nombre || pedidoDetalle.metodo_cobro_tipo}
                    </span>
                    {pedidoDetalle.fecha_cobro && (
                      <span className="text-xs text-carbon-400">
                        ({new Date(pedidoDetalle.fecha_cobro).toLocaleDateString("es-ES")})
                      </span>
                    )}
                  </div>
                ) : pedidoDetalle.estado === "cancelado" ? (
                  <Badge variant="outline" className="text-carbon-400">No aplica</Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-100 text-amber-700">
                      <Clock className="h-3 w-3 mr-1" />
                      Pendiente de cobro
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPedidoDetalle(null);
                        abrirModalCobro(pedidoDetalle);
                      }}
                    >
                      <Banknote className="h-3 w-3 mr-1" />
                      Registrar Cobro
                    </Button>
                  </div>
                )}
              </div>

              {/* Stripe ID */}
              {pedidoDetalle.stripe_payment_id && (
                <div className="text-xs text-carbon-400">
                  Stripe Payment ID: {pedidoDetalle.stripe_payment_id}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Cobro */}
      <Dialog open={modalCobroOpen} onOpenChange={(open) => !open && cerrarModalCobro()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-salvia-600" />
              Registrar Cobro
            </DialogTitle>
          </DialogHeader>

          {pedidoACobrar && (
            <div className="space-y-6">
              {/* Info del pedido */}
              <div className="bg-crudo-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-carbon-500">Pedido</span>
                  <span className="font-bold">#{pedidoACobrar.id}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-carbon-500">Cliente</span>
                  <span className="font-medium">{pedidoACobrar.nombre_envio || "Sin nombre"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-carbon-500">Importe</span>
                  <span className="text-lg font-bold text-salvia-600">
                    {pedidoACobrar.total.toFixed(2)}€
                  </span>
                </div>
              </div>

              {/* Selección de método de cobro */}
              <div className="space-y-2">
                <Label>Método de cobro</Label>
                <div className="grid grid-cols-2 gap-2">
                  {METODOS_COBRO.map((metodo) => (
                    <Button
                      key={metodo.valor}
                      type="button"
                      variant={metodoCobro === metodo.valor ? "default" : "outline"}
                      className={`h-auto py-3 flex flex-col items-center gap-1 ${
                        metodoCobro === metodo.valor
                          ? "bg-salvia-500 hover:bg-salvia-600 text-white"
                          : "hover:bg-salvia-50"
                      }`}
                      onClick={() => setMetodoCobro(metodo.valor)}
                    >
                      {metodo.icon}
                      <span className="text-xs">{metodo.nombre}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cerrarModalCobro}
                  disabled={registrandoCobro}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={registrarCobro}
                  disabled={registrandoCobro}
                  className="bg-salvia-500 hover:bg-salvia-600"
                >
                  {registrandoCobro ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirmar Cobro
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
