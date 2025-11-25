import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, ArrowRight, ShoppingBag, Mail, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/api/v1";

export function PagoExitoso() {
  const { vaciarCarrito } = useCart();
  const [searchParams] = useSearchParams();
  const [verificando, setVerificando] = useState(true);
  const [pedidoId, setPedidoId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");

    if (sessionId) {
      // Verificar la sesión y crear el pedido
      fetch(`${API_URL}/pagos/verify-session/${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setPedidoId(data.pedido_id);
            vaciarCarrito();
          } else {
            setError(data.message || "Error verificando el pago");
          }
        })
        .catch((err) => {
          console.error("Error verificando sesión:", err);
          setError("Error de conexión");
        })
        .finally(() => setVerificando(false));
    } else {
      // Sin session_id, asumimos que viene de un pago exitoso anterior
      vaciarCarrito();
      setVerificando(false);
    }
  }, [searchParams]);

  if (verificando) {
    return (
      <div className="bg-crudo-50 min-h-screen">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
          <Card className="border-crudo-200">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-salvia-500 mx-auto mb-4" />
              <p className="text-carbon-600">Verificando tu pago...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-crudo-50 min-h-screen">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
          <Card className="border-red-200">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <h1 className="font-display text-2xl font-bold text-carbon-800 mb-4">
                Error al verificar el pago
              </h1>
              <p className="text-carbon-600 mb-6">{error}</p>
              <Button asChild className="bg-salvia-500 hover:bg-salvia-600">
                <Link to="/tienda">Volver a la tienda</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-crudo-50 min-h-screen">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
        <Card className="border-salvia-200">
          <CardContent className="p-8 text-center">
            {/* Icono de exito */}
            <div className="w-20 h-20 bg-salvia-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-salvia-600" />
            </div>

            {/* Titulo */}
            <h1 className="font-display text-3xl font-bold text-carbon-800 mb-4">
              ¡Pago completado!
            </h1>

            <p className="text-carbon-600 mb-2 max-w-md mx-auto">
              Tu pedido ha sido procesado correctamente.
            </p>

            {pedidoId && (
              <p className="text-salvia-600 font-semibold mb-6">
                Pedido #{pedidoId}
              </p>
            )}

            {/* Info adicional */}
            <div className="bg-crudo-100 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-carbon-800 mb-4">¿Que sucede ahora?</h3>
              <ul className="space-y-3 text-sm text-carbon-600">
                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-salvia-600 flex-shrink-0 mt-0.5" />
                  <span>Recibiras un email de confirmacion con el resumen del pedido</span>
                </li>
                <li className="flex items-start gap-3">
                  <ShoppingBag className="h-5 w-5 text-salvia-600 flex-shrink-0 mt-0.5" />
                  <span>Prepararemos tu pedido en las proximas 24-48 horas</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-salvia-600 flex-shrink-0 mt-0.5" />
                  <span>Te notificaremos cuando tu pedido haya sido enviado</span>
                </li>
              </ul>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/tienda">
                  <ShoppingBag className="h-5 w-5" />
                  Seguir comprando
                </Link>
              </Button>
              <Button asChild className="bg-salvia-500 hover:bg-salvia-600 gap-2">
                <Link to="/">
                  Volver al inicio
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
