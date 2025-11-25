import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  ArrowRight,
  Leaf,
  Truck,
  ShieldCheck,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/CartContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/api/v1";

const ENVIO_GRATIS_MINIMO = 50;
const COSTE_ENVIO = 4.95;

export function Carrito() {
  const {
    items,
    total,
    cantidadTotal,
    actualizarCantidad,
    eliminarProducto,
    vaciarCarrito,
  } = useCart();

  const [procesandoPago, setProcesandoPago] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);

  const envioGratis = total >= ENVIO_GRATIS_MINIMO;
  const costeEnvio = envioGratis ? 0 : COSTE_ENVIO;
  const totalConEnvio = total + costeEnvio;
  const faltaParaEnvioGratis = ENVIO_GRATIS_MINIMO - total;

  const handleCheckout = async () => {
    setProcesandoPago(true);
    setErrorPago(null);

    try {
      // Preparar items para Stripe
      const itemsParaStripe: Array<{
        producto_id: number;
        nombre: string;
        precio: number;
        cantidad: number;
        imagen_url: string | null;
      }> = items.map((item) => ({
        producto_id: item.producto.id,
        nombre: item.producto.nombre,
        precio: item.producto.precio_oferta ?? item.producto.precio,
        cantidad: item.cantidad,
        imagen_url: item.producto.imagen_url,
      }));

      // Añadir coste de envío si aplica
      if (!envioGratis) {
        itemsParaStripe.push({
          producto_id: 0,
          nombre: "Gastos de envío",
          precio: COSTE_ENVIO,
          cantidad: 1,
          imagen_url: null,
        });
      }

      // Crear sesión de checkout
      const response = await fetch(`${API_URL}/pagos/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: itemsParaStripe,
          success_url: `${window.location.origin}/pago-exitoso`,
          cancel_url: `${window.location.origin}/carrito`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al crear la sesión de pago");
      }

      const { url } = await response.json();

      // Redirigir a Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Error en checkout:", error);
      setErrorPago(error instanceof Error ? error.message : "Error al procesar el pago");
      setProcesandoPago(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-crudo-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-crudo-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-12 w-12 text-crudo-400" />
            </div>
            <h1 className="font-display text-2xl font-bold text-carbon-800 mb-4">
              Tu carrito está vacío
            </h1>
            <p className="text-carbon-600 mb-8">
              Explora nuestra tienda y descubre productos naturales para tu belleza y bienestar.
            </p>
            <Button asChild size="lg" className="bg-salvia-500 hover:bg-salvia-600 gap-2">
              <Link to="/tienda">
                <ArrowLeft className="h-5 w-5" />
                Ir a la tienda
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-crudo-50 min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-salvia-600 to-salvia-700 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-crudo-50 mb-2">
            Carrito de compra
          </h1>
          <p className="text-crudo-100">
            {cantidadTotal} producto{cantidadTotal !== 1 ? "s" : ""} en tu carrito
          </p>
        </div>
      </section>

      {/* Barra de progreso envío gratis */}
      {!envioGratis && (
        <div className="bg-salvia-50 border-b border-salvia-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-salvia-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-salvia-700">
                  ¡Te faltan <strong>{faltaParaEnvioGratis.toFixed(2)}€</strong> para envío gratis!
                </p>
                <div className="mt-1 h-2 bg-salvia-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-salvia-500 rounded-full transition-all"
                    style={{ width: `${Math.min((total / ENVIO_GRATIS_MINIMO) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Lista de productos */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <Link
                to="/tienda"
                className="text-salvia-600 hover:text-salvia-700 flex items-center gap-1 text-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Seguir comprando
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-carbon-500 hover:text-terracota-600"
                onClick={vaciarCarrito}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Vaciar carrito
              </Button>
            </div>

            {items.map((item) => {
              const precioUnitario = item.producto.precio_oferta ?? item.producto.precio;
              const subtotal = precioUnitario * item.cantidad;

              return (
                <Card key={item.producto.id} className="border-crudo-200">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Imagen */}
                      <Link to={`/tienda/${item.producto.id}`} className="flex-shrink-0">
                        <div className="w-24 h-24 bg-crudo-100 rounded-lg flex items-center justify-center">
                          <Leaf className="h-8 w-8 text-crudo-300" />
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link to={`/tienda/${item.producto.id}`}>
                          <h3 className="font-display font-semibold text-carbon-800 hover:text-salvia-600 transition-colors line-clamp-1">
                            {item.producto.nombre}
                          </h3>
                        </Link>
                        <p className="text-sm text-carbon-500 line-clamp-1 mt-1">
                          {item.producto.descripcion_corta}
                        </p>

                        {/* Precio unitario */}
                        <div className="flex items-baseline gap-2 mt-2">
                          {item.producto.precio_oferta ? (
                            <>
                              <span className="text-terracota-600 font-medium">
                                {item.producto.precio_oferta.toFixed(2)}€
                              </span>
                              <span className="text-sm text-carbon-400 line-through">
                                {item.producto.precio.toFixed(2)}€
                              </span>
                            </>
                          ) : (
                            <span className="text-carbon-700 font-medium">
                              {item.producto.precio.toFixed(2)}€
                            </span>
                          )}
                        </div>

                        {/* Controles móvil */}
                        <div className="flex items-center justify-between mt-3 sm:hidden">
                          <div className="flex items-center border border-crudo-300 rounded-lg">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                actualizarCantidad(item.producto.id, item.cantidad - 1)
                              }
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.cantidad}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                actualizarCantidad(item.producto.id, item.cantidad + 1)
                              }
                              disabled={item.cantidad >= item.producto.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="font-bold text-carbon-800">
                            {subtotal.toFixed(2)}€
                          </span>
                        </div>
                      </div>

                      {/* Controles desktop */}
                      <div className="hidden sm:flex items-center gap-6">
                        <div className="flex items-center border border-crudo-300 rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              actualizarCantidad(item.producto.id, item.cantidad - 1)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-10 text-center">{item.cantidad}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              actualizarCantidad(item.producto.id, item.cantidad + 1)
                            }
                            disabled={item.cantidad >= item.producto.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="text-right min-w-[80px]">
                          <p className="font-bold text-carbon-800">{subtotal.toFixed(2)}€</p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-carbon-400 hover:text-terracota-600"
                          onClick={() => eliminarProducto(item.producto.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Botón eliminar móvil */}
                    <div className="sm:hidden mt-3 pt-3 border-t border-crudo-100">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-carbon-400 hover:text-terracota-600 w-full"
                        onClick={() => eliminarProducto(item.producto.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Resumen */}
          <div className="lg:col-span-1">
            <Card className="border-crudo-200 sticky top-4">
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-bold text-carbon-800 mb-6">
                  Resumen del pedido
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-carbon-600">
                    <span>Subtotal ({cantidadTotal} productos)</span>
                    <span>{total.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-carbon-600">
                    <span>Envío</span>
                    {envioGratis ? (
                      <span className="text-salvia-600 font-medium">Gratis</span>
                    ) : (
                      <span>{costeEnvio.toFixed(2)}€</span>
                    )}
                  </div>
                  {envioGratis && (
                    <Badge className="bg-salvia-100 text-salvia-700 w-full justify-center">
                      <Truck className="h-3 w-3 mr-1" />
                      ¡Envío gratis aplicado!
                    </Badge>
                  )}
                </div>

                <div className="border-t border-crudo-200 pt-4 mb-6">
                  <div className="flex justify-between items-baseline">
                    <span className="font-display text-lg font-bold text-carbon-800">
                      Total
                    </span>
                    <span className="font-display text-2xl font-bold text-carbon-800">
                      {totalConEnvio.toFixed(2)}€
                    </span>
                  </div>
                  <p className="text-xs text-carbon-500 mt-1">IVA incluido</p>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-salvia-500 hover:bg-salvia-600 gap-2 mb-4"
                  onClick={handleCheckout}
                  disabled={procesandoPago}
                >
                  {procesandoPago ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Finalizar compra
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>

                {errorPago && (
                  <p className="text-sm text-red-600 text-center mb-4">
                    {errorPago}
                  </p>
                )}

                <p className="text-xs text-center text-carbon-500 mb-4">
                  Al realizar el pedido aceptas nuestros términos y condiciones
                </p>

                {/* Garantías */}
                <div className="space-y-3 pt-4 border-t border-crudo-200">
                  <div className="flex items-center gap-2 text-sm text-carbon-600">
                    <ShieldCheck className="h-4 w-4 text-salvia-600" />
                    <span>Pago 100% seguro</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-carbon-600">
                    <Truck className="h-4 w-4 text-salvia-600" />
                    <span>Envío en 24-48h</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-carbon-600">
                    <Leaf className="h-4 w-4 text-salvia-600" />
                    <span>Productos 100% naturales</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
