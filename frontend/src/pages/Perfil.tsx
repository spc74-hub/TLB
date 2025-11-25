import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Loader2,
  Save,
  CheckCircle2,
  Package,
  ShoppingBag,
  Truck,
  Clock,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { actualizarPerfil, getMisPedidos, type Pedido, type EstadoPedido } from "@/lib/supabase";

// Helper para mostrar estado de pedido
const estadoConfig: Record<EstadoPedido, { label: string; color: string; icon: React.ReactNode }> = {
  pendiente: { label: "Pendiente", color: "bg-amber-100 text-amber-700", icon: <Clock className="h-3 w-3" /> },
  pagado: { label: "Pagado", color: "bg-blue-100 text-blue-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  preparando: { label: "Preparando", color: "bg-purple-100 text-purple-700", icon: <Package className="h-3 w-3" /> },
  enviado: { label: "Enviado", color: "bg-salvia-100 text-salvia-700", icon: <Truck className="h-3 w-3" /> },
  entregado: { label: "Entregado", color: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: <Clock className="h-3 w-3" /> },
};

export function Perfil() {
  const { user, perfil, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [pedidoExpandido, setPedidoExpandido] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    nombre: perfil?.nombre || "",
    apellidos: perfil?.apellidos || "",
    telefono: perfil?.telefono || "",
  });

  useEffect(() => {
    if (user) {
      getMisPedidos(user.id)
        .then(setPedidos)
        .catch(console.error)
        .finally(() => setLoadingPedidos(false));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      await actualizarPerfil(user.id, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-salvia-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-crudo-50 to-salvia-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-carbon-800 mb-8">
          Mi Perfil
        </h1>

        <div className="space-y-6">
          <Card className="border-crudo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-salvia-500" />
                Información personal
              </CardTitle>
              <CardDescription>
                Actualiza tus datos personales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-terracota-50 border border-terracota-200 rounded-lg text-terracota-700 text-sm">
                    {error}
                  </div>
                )}

                {saved && (
                  <div className="p-3 bg-salvia-50 border border-salvia-200 rounded-lg text-salvia-700 text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Cambios guardados correctamente
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="nombre" className="text-sm font-medium text-carbon-700">
                      Nombre
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                      <Input
                        id="nombre"
                        name="nombre"
                        type="text"
                        placeholder="Tu nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className="pl-10 border-crudo-300 focus:border-salvia-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="apellidos" className="text-sm font-medium text-carbon-700">
                      Apellidos
                    </label>
                    <Input
                      id="apellidos"
                      name="apellidos"
                      type="text"
                      placeholder="Tus apellidos"
                      value={formData.apellidos}
                      onChange={handleChange}
                      className="border-crudo-300 focus:border-salvia-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-carbon-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="pl-10 border-crudo-300 bg-crudo-100 text-carbon-500"
                    />
                  </div>
                  <p className="text-xs text-carbon-500">
                    El email no se puede cambiar
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="telefono" className="text-sm font-medium text-carbon-700">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                    <Input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      placeholder="612 345 678"
                      value={formData.telefono}
                      onChange={handleChange}
                      className="pl-10 border-crudo-300 focus:border-salvia-400"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-salvia-500 hover:bg-salvia-600"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Historial de Pedidos */}
          <Card className="border-crudo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-salvia-500" />
                Mis Pedidos
              </CardTitle>
              <CardDescription>
                Historial de tus compras
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPedidos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-salvia-500" />
                </div>
              ) : pedidos.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-crudo-300 mx-auto mb-3" />
                  <p className="text-carbon-500">Aún no has realizado ningún pedido</p>
                  <Button asChild className="mt-4 bg-salvia-500 hover:bg-salvia-600">
                    <Link to="/tienda">Ir a la tienda</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pedidos.map((pedido) => {
                    const estado = estadoConfig[pedido.estado];
                    const isExpanded = pedidoExpandido === pedido.id;

                    return (
                      <div
                        key={pedido.id}
                        className="border border-crudo-200 rounded-lg overflow-hidden"
                      >
                        {/* Cabecera del pedido */}
                        <div
                          className="p-4 bg-crudo-50 cursor-pointer hover:bg-crudo-100 transition-colors"
                          onClick={() => setPedidoExpandido(isExpanded ? null : pedido.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-sm">
                                <span className="font-medium text-carbon-800">
                                  Pedido #{pedido.id}
                                </span>
                                <span className="text-carbon-500 ml-2">
                                  {new Date(pedido.created_at).toLocaleDateString("es-ES", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              <Badge className={`${estado.color} flex items-center gap-1`}>
                                {estado.icon}
                                {estado.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-carbon-800">
                                {pedido.total.toFixed(2)}€
                              </span>
                              <Eye className={`h-4 w-4 text-carbon-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </div>
                          </div>
                        </div>

                        {/* Detalles del pedido (expandible) */}
                        {isExpanded && (
                          <div className="p-4 border-t border-crudo-200">
                            {/* Productos */}
                            <div className="space-y-2 mb-4">
                              <h4 className="text-sm font-medium text-carbon-700">Productos:</h4>
                              {pedido.items?.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                  <span className="text-carbon-600">
                                    {item.nombre_producto || "Producto"} x{item.cantidad}
                                  </span>
                                  <span className="text-carbon-700">
                                    {item.precio_total.toFixed(2)}€
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Resumen */}
                            <div className="border-t border-crudo-200 pt-3 space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-carbon-500">Subtotal</span>
                                <span>{pedido.subtotal.toFixed(2)}€</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-carbon-500">Envío</span>
                                <span>
                                  {pedido.coste_envio > 0 ? `${pedido.coste_envio.toFixed(2)}€` : "Gratis"}
                                </span>
                              </div>
                              <div className="flex justify-between font-medium">
                                <span>Total</span>
                                <span>{pedido.total.toFixed(2)}€</span>
                              </div>
                            </div>

                            {/* Dirección de envío */}
                            {pedido.direccion_envio && (
                              <div className="mt-4 pt-3 border-t border-crudo-200">
                                <h4 className="text-sm font-medium text-carbon-700 mb-1">
                                  Dirección de envío:
                                </h4>
                                <p className="text-sm text-carbon-600">
                                  {pedido.nombre_envio}<br />
                                  {pedido.direccion_envio}<br />
                                  {pedido.cp_envio} {pedido.ciudad_envio}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
