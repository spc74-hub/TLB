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
import {
  getAllPedidos,
  actualizarEstadoPedido,
  type Pedido,
  type EstadoPedido,
} from "@/lib/supabase";

const ESTADOS: { valor: EstadoPedido; nombre: string; color: string; icon: React.ReactNode }[] = [
  { valor: "pendiente", nombre: "Pendiente", color: "bg-amber-100 text-amber-700", icon: <Clock className="h-3 w-3" /> },
  { valor: "pagado", nombre: "Pagado", color: "bg-blue-100 text-blue-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  { valor: "preparando", nombre: "Preparando", color: "bg-purple-100 text-purple-700", icon: <Package className="h-3 w-3" /> },
  { valor: "enviado", nombre: "Enviado", color: "bg-salvia-100 text-salvia-700", icon: <Truck className="h-3 w-3" /> },
  { valor: "entregado", nombre: "Entregado", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  { valor: "cancelado", nombre: "Cancelado", color: "bg-red-100 text-red-700", icon: <Clock className="h-3 w-3" /> },
];

export function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [pedidoDetalle, setPedidoDetalle] = useState<Pedido | null>(null);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const data = await getAllPedidos();
      setPedidos(data);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
    } finally {
      setLoading(false);
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
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-carbon-500">
                      No hay pedidos que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                ) : (
                  pedidosFiltrados.map((pedido) => {
                    const estadoConfig = getEstadoConfig(pedido.estado);
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
    </div>
  );
}
