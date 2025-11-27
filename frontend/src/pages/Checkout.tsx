import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Truck,
  CreditCard,
  Loader2,
  ShieldCheck,
  Leaf,
  MapPin,
  User,
  Mail,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/api/v1";

const ENVIO_GRATIS_MINIMO = 50;
const COSTE_ENVIO = 4.95;

interface DatosEnvio {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  codigoPostal: string;
  provincia: string;
  notas: string;
  aceptaMarketing: boolean;
}

export function Checkout() {
  const navigate = useNavigate();
  const { items, total, cantidadTotal } = useCart();
  const { user } = useAuth();

  const [procesandoPago, setProcesandoPago] = useState(false);
  const [errorPago, setErrorPago] = useState<string | null>(null);
  const [datosEnvio, setDatosEnvio] = useState<DatosEnvio>({
    nombre: user?.user_metadata?.nombre || "",
    apellidos: user?.user_metadata?.apellidos || "",
    email: user?.email || "",
    telefono: user?.user_metadata?.telefono || "",
    direccion: "",
    ciudad: "",
    codigoPostal: "",
    provincia: "",
    notas: "",
    aceptaMarketing: false,
  });

  const envioGratis = total >= ENVIO_GRATIS_MINIMO;
  const costeEnvio = envioGratis ? 0 : COSTE_ENVIO;
  const totalConEnvio = total + costeEnvio;

  // Redirigir si el carrito está vacío
  if (items.length === 0) {
    navigate("/carrito");
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDatosEnvio((prev) => ({ ...prev, [name]: value }));
  };

  const validarFormulario = (): boolean => {
    if (!datosEnvio.nombre.trim()) {
      setErrorPago("Por favor, introduce tu nombre");
      return false;
    }
    if (!datosEnvio.apellidos.trim()) {
      setErrorPago("Por favor, introduce tus apellidos");
      return false;
    }
    if (!datosEnvio.email.trim() || !datosEnvio.email.includes("@")) {
      setErrorPago("Por favor, introduce un email válido");
      return false;
    }
    if (!datosEnvio.telefono.trim()) {
      setErrorPago("Por favor, introduce tu teléfono");
      return false;
    }
    if (!datosEnvio.direccion.trim()) {
      setErrorPago("Por favor, introduce tu dirección");
      return false;
    }
    if (!datosEnvio.ciudad.trim()) {
      setErrorPago("Por favor, introduce tu ciudad");
      return false;
    }
    if (!datosEnvio.codigoPostal.trim()) {
      setErrorPago("Por favor, introduce tu código postal");
      return false;
    }
    if (!datosEnvio.provincia.trim()) {
      setErrorPago("Por favor, introduce tu provincia");
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validarFormulario()) return;

    setProcesandoPago(true);
    setErrorPago(null);

    try {
      // Preparar items para Stripe (solo productos, el backend calcula el envío)
      const itemsParaStripe = items.map((item) => ({
        producto_id: item.producto.id,
        nombre: item.producto.nombre,
        precio: item.producto.precio_oferta ?? item.producto.precio,
        cantidad: item.cantidad,
        imagen_url: item.producto.imagen_url,
      }));

      // Preparar datos de envío para el backend
      const datosEnvioBackend = {
        nombre: datosEnvio.nombre,
        apellidos: datosEnvio.apellidos,
        email: datosEnvio.email,
        telefono: datosEnvio.telefono,
        direccion: datosEnvio.direccion,
        ciudad: datosEnvio.ciudad,
        codigo_postal: datosEnvio.codigoPostal,
        provincia: datosEnvio.provincia,
        notas: datosEnvio.notas,
        acepta_marketing: datosEnvio.aceptaMarketing,
      };

      // Crear sesión de checkout
      const response = await fetch(`${API_URL}/pagos/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: itemsParaStripe,
          datos_envio: datosEnvioBackend,
          success_url: `${window.location.origin}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/checkout`,
          usuario_id: user?.id || null,
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

  return (
    <div className="bg-crudo-50 min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-salvia-600 to-salvia-700 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              to="/carrito"
              className="text-crudo-100 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="h-5 w-5" />
              Volver al carrito
            </Link>
          </div>
          <h1 className="font-display text-3xl font-bold text-crudo-50 mt-4">
            Finalizar compra
          </h1>
          <p className="text-crudo-100 mt-1">
            Introduce tus datos de envío
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulario de datos de envío */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-crudo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-carbon-800">
                  <User className="h-5 w-5 text-salvia-600" />
                  Datos personales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      placeholder="Tu nombre"
                      value={datosEnvio.nombre}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apellidos">Apellidos *</Label>
                    <Input
                      id="apellidos"
                      name="apellidos"
                      placeholder="Tus apellidos"
                      value={datosEnvio.apellidos}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-1">
                      <Mail className="h-4 w-4" /> Email *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      value={datosEnvio.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono" className="flex items-center gap-1">
                      <Phone className="h-4 w-4" /> Teléfono *
                    </Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      placeholder="612 345 678"
                      value={datosEnvio.telefono}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-crudo-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-carbon-800">
                  <MapPin className="h-5 w-5 text-salvia-600" />
                  Dirección de envío
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección *</Label>
                  <Input
                    id="direccion"
                    name="direccion"
                    placeholder="Calle, número, piso, puerta..."
                    value={datosEnvio.direccion}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigoPostal">Código postal *</Label>
                    <Input
                      id="codigoPostal"
                      name="codigoPostal"
                      placeholder="46001"
                      value={datosEnvio.codigoPostal}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">Ciudad *</Label>
                    <Input
                      id="ciudad"
                      name="ciudad"
                      placeholder="Valencia"
                      value={datosEnvio.ciudad}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provincia">Provincia *</Label>
                    <Input
                      id="provincia"
                      name="provincia"
                      placeholder="Valencia"
                      value={datosEnvio.provincia}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notas">Notas del pedido (opcional)</Label>
                  <Input
                    id="notas"
                    name="notas"
                    placeholder="Instrucciones especiales de entrega, código del portal..."
                    value={datosEnvio.notas}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Opt-in Marketing */}
                <div className="flex items-start space-x-3 pt-2">
                  <input
                    type="checkbox"
                    id="acepta-marketing"
                    checked={datosEnvio.aceptaMarketing}
                    onChange={(e) =>
                      setDatosEnvio((prev) => ({
                        ...prev,
                        aceptaMarketing: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 rounded border-crudo-300 text-salvia-600 focus:ring-salvia-500"
                  />
                  <label
                    htmlFor="acepta-marketing"
                    className="text-sm text-carbon-600 cursor-pointer"
                  >
                    Acepto recibir comunicaciones comerciales y promociones de The Lobby Beauty
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1">
            <Card className="border-crudo-200 sticky top-4">
              <CardHeader>
                <CardTitle className="text-carbon-800">Resumen del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lista de productos */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {items.map((item) => {
                    const precio = item.producto.precio_oferta ?? item.producto.precio;
                    return (
                      <div key={item.producto.id} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <span className="text-carbon-700">{item.producto.nombre}</span>
                          <span className="text-carbon-400 ml-1">x{item.cantidad}</span>
                        </div>
                        <span className="text-carbon-700 font-medium">
                          {(precio * item.cantidad).toFixed(2)}€
                        </span>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Subtotales */}
                <div className="space-y-2">
                  <div className="flex justify-between text-carbon-600">
                    <span>Subtotal ({cantidadTotal} productos)</span>
                    <span>{total.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between text-carbon-600">
                    <span className="flex items-center gap-1">
                      <Truck className="h-4 w-4" /> Envío
                    </span>
                    {envioGratis ? (
                      <span className="text-salvia-600 font-medium">Gratis</span>
                    ) : (
                      <span>{costeEnvio.toFixed(2)}€</span>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-baseline">
                  <span className="font-display text-lg font-bold text-carbon-800">
                    Total
                  </span>
                  <span className="font-display text-2xl font-bold text-carbon-800">
                    {totalConEnvio.toFixed(2)}€
                  </span>
                </div>
                <p className="text-xs text-carbon-500">IVA incluido</p>

                {/* Botón de pago */}
                <Button
                  size="lg"
                  className="w-full bg-salvia-500 hover:bg-salvia-600 gap-2"
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
                      Pagar {totalConEnvio.toFixed(2)}€
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>

                {errorPago && (
                  <p className="text-sm text-red-600 text-center">{errorPago}</p>
                )}

                <p className="text-xs text-center text-carbon-500">
                  Al realizar el pedido aceptas nuestros términos y condiciones
                </p>

                {/* Garantías */}
                <div className="space-y-2 pt-4 border-t border-crudo-200">
                  <div className="flex items-center gap-2 text-sm text-carbon-600">
                    <ShieldCheck className="h-4 w-4 text-salvia-600" />
                    <span>Pago 100% seguro con Stripe</span>
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
