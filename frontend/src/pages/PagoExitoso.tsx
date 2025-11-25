import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowRight, ShoppingBag, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/context/CartContext";

export function PagoExitoso() {
  const { vaciarCarrito } = useCart();

  // Vaciar el carrito al llegar a esta página
  useEffect(() => {
    vaciarCarrito();
  }, [vaciarCarrito]);

  return (
    <div className="bg-crudo-50 min-h-screen">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
        <Card className="border-salvia-200">
          <CardContent className="p-8 text-center">
            {/* Icono de éxito */}
            <div className="w-20 h-20 bg-salvia-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-12 w-12 text-salvia-600" />
            </div>

            {/* Título */}
            <h1 className="font-display text-3xl font-bold text-carbon-800 mb-4">
              ¡Pago completado!
            </h1>

            <p className="text-carbon-600 mb-8 max-w-md mx-auto">
              Tu pedido ha sido procesado correctamente. En breve recibirás un email con los detalles de tu compra.
            </p>

            {/* Info adicional */}
            <div className="bg-crudo-100 rounded-lg p-6 mb-8 text-left">
              <h3 className="font-semibold text-carbon-800 mb-4">¿Qué sucede ahora?</h3>
              <ul className="space-y-3 text-sm text-carbon-600">
                <li className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-salvia-600 flex-shrink-0 mt-0.5" />
                  <span>Recibirás un email de confirmación con el resumen del pedido</span>
                </li>
                <li className="flex items-start gap-3">
                  <ShoppingBag className="h-5 w-5 text-salvia-600 flex-shrink-0 mt-0.5" />
                  <span>Prepararemos tu pedido en las próximas 24-48 horas</span>
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
