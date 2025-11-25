import { useState } from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Instagram,
  Facebook,
  Send,
  CheckCircle2,
  Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const infoContacto = [
  {
    icono: MapPin,
    titulo: "Dirección",
    contenido: "Calle de la Belleza 123",
    extra: "28001 Madrid, España",
  },
  {
    icono: Phone,
    titulo: "Teléfono",
    contenido: "+34 612 345 678",
    href: "tel:+34612345678",
  },
  {
    icono: Mail,
    titulo: "Email",
    contenido: "hola@thelobbybeauty.com",
    href: "mailto:hola@thelobbybeauty.com",
  },
  {
    icono: Clock,
    titulo: "Horario",
    contenido: "Lun - Sáb: 10:00 - 20:00",
    extra: "Domingos: Cerrado",
  },
];

export function Contacto() {
  const [formEnviado, setFormEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEnviando(true);

    // Simular envío
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setEnviando(false);
    setFormEnviado(true);
  };

  return (
    <div className="min-h-screen bg-crudo-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-crudo-100 to-salvia-50 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-carbon-800 mb-4">
              Contacta con nosotros
            </h1>
            <p className="text-lg text-carbon-600">
              ¿Tienes alguna pregunta o quieres reservar una cita? Estamos aquí
              para ayudarte.
            </p>
          </div>
        </div>
      </section>

      {/* Contenido */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Información de contacto */}
            <div>
              <h2 className="font-display text-2xl font-semibold text-carbon-800 mb-6">
                Información de contacto
              </h2>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {infoContacto.map((info) => (
                  <Card key={info.titulo} className="bg-white border-crudo-200">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-salvia-100 rounded-lg flex-shrink-0">
                          <info.icono className="h-5 w-5 text-salvia-600" />
                        </div>
                        <div>
                          <p className="text-sm text-carbon-500 mb-1">
                            {info.titulo}
                          </p>
                          {info.href ? (
                            <a
                              href={info.href}
                              className="font-medium text-carbon-800 hover:text-salvia-600 transition-colors"
                            >
                              {info.contenido}
                            </a>
                          ) : (
                            <p className="font-medium text-carbon-800">
                              {info.contenido}
                            </p>
                          )}
                          {info.extra && (
                            <p className="text-sm text-carbon-500">{info.extra}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Redes sociales */}
              <div className="mb-8">
                <h3 className="font-display text-lg font-semibold text-carbon-800 mb-4">
                  Síguenos
                </h3>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-crudo-300 rounded-lg text-carbon-700 hover:border-salvia-400 hover:text-salvia-600 transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                    <span>Instagram</span>
                  </a>
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-crudo-300 rounded-lg text-carbon-700 hover:border-salvia-400 hover:text-salvia-600 transition-colors"
                  >
                    <Facebook className="h-5 w-5" />
                    <span>Facebook</span>
                  </a>
                </div>
              </div>

              {/* Mapa placeholder */}
              <div className="aspect-video bg-crudo-200 rounded-xl overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-salvia-400 mx-auto mb-2" />
                    <p className="text-carbon-600">Mapa interactivo</p>
                    <p className="text-sm text-carbon-500">
                      Calle de la Belleza 123, Madrid
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario de contacto */}
            <div>
              <Card className="bg-white border-crudo-200">
                <CardContent className="p-6 lg:p-8">
                  <h2 className="font-display text-2xl font-semibold text-carbon-800 mb-6">
                    Envíanos un mensaje
                  </h2>

                  {formEnviado ? (
                    <div className="text-center py-8">
                      <div className="inline-flex p-4 bg-salvia-100 rounded-full mb-4">
                        <CheckCircle2 className="h-12 w-12 text-salvia-600" />
                      </div>
                      <h3 className="font-display text-xl font-semibold text-carbon-800 mb-2">
                        ¡Mensaje enviado!
                      </h3>
                      <p className="text-carbon-600 mb-6">
                        Gracias por contactarnos. Te responderemos lo antes
                        posible.
                      </p>
                      <Button
                        onClick={() => setFormEnviado(false)}
                        variant="outline"
                        className="border-salvia-300 text-salvia-700 hover:bg-salvia-50"
                      >
                        Enviar otro mensaje
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nombre">Nombre *</Label>
                          <Input
                            id="nombre"
                            name="nombre"
                            required
                            placeholder="Tu nombre"
                            className="border-crudo-300 focus:border-salvia-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            required
                            placeholder="tu@email.com"
                            className="border-crudo-300 focus:border-salvia-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                          id="telefono"
                          name="telefono"
                          type="tel"
                          placeholder="+34 600 000 000"
                          className="border-crudo-300 focus:border-salvia-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="asunto">Asunto *</Label>
                        <Input
                          id="asunto"
                          name="asunto"
                          required
                          placeholder="¿En qué podemos ayudarte?"
                          className="border-crudo-300 focus:border-salvia-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mensaje">Mensaje *</Label>
                        <Textarea
                          id="mensaje"
                          name="mensaje"
                          required
                          rows={5}
                          placeholder="Escribe tu mensaje..."
                          className="border-crudo-300 focus:border-salvia-400 resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={enviando}
                        className="w-full bg-salvia-500 hover:bg-salvia-600"
                      >
                        {enviando ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar mensaje
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-carbon-500 text-center">
                        Al enviar este formulario, aceptas nuestra política de
                        privacidad.
                      </p>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ rápido */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-salvia-50 rounded-2xl p-8 border border-salvia-200">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="p-4 bg-salvia-100 rounded-xl flex-shrink-0">
                <Leaf className="h-8 w-8 text-salvia-600" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-carbon-800 mb-3">
                  Preguntas frecuentes
                </h3>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-carbon-800">
                      ¿Necesito cita previa?
                    </p>
                    <p className="text-carbon-600">
                      Sí, recomendamos reservar con antelación para garantizar tu
                      hora.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-carbon-800">
                      ¿Qué métodos de pago aceptáis?
                    </p>
                    <p className="text-carbon-600">
                      Efectivo, tarjeta y Bizum.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-carbon-800">
                      ¿Puedo cancelar mi cita?
                    </p>
                    <p className="text-carbon-600">
                      Sí, con al menos 24 horas de antelación sin coste.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-carbon-800">
                      ¿Tenéis parking?
                    </p>
                    <p className="text-carbon-600">
                      Hay parking público a 2 minutos andando.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
