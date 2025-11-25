import { Link } from "react-router-dom";
import {
  Leaf,
  Heart,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Users,
  Award,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const valores = [
  {
    icono: Leaf,
    titulo: "Naturaleza",
    descripcion:
      "Utilizamos exclusivamente productos de origen natural, respetando tu piel y el medio ambiente.",
  },
  {
    icono: ShieldCheck,
    titulo: "Seguridad",
    descripcion:
      "Tu salud es nuestra prioridad. Todos nuestros productos están libres de sustancias tóxicas.",
  },
  {
    icono: Heart,
    titulo: "Bienestar",
    descripcion:
      "Creemos que la belleza debe hacerte sentir bien por dentro y por fuera, sin comprometer tu salud.",
  },
  {
    icono: Award,
    titulo: "Excelencia",
    descripcion:
      "Profesionales certificados y formación continua para ofrecerte el mejor servicio.",
  },
];

const sustanciasToxicas = [
  {
    nombre: "TPO",
    nombreCompleto: "Óxido de trimetilbenzoildifenilfosfina",
    uso: "Acelerador del secado con luz LED/UV",
    riesgos: [
      "Clasificado como carcinógeno potencial",
      "Posible disruptor endocrino",
      "Riesgo de problemas hepáticos",
    ],
  },
  {
    nombre: "DMPT",
    nombreCompleto: "Dimetiltolilamina",
    uso: "Agente de curado en esmaltes en gel",
    riesgos: [
      "Toxicidad reproductiva potencial",
      "Posibles efectos mutagénicos",
      "Riesgo de dermatitis por contacto",
    ],
  },
];

export function Nosotros() {
  return (
    <div className="min-h-screen bg-crudo-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-crudo-100 via-crudo-50 to-salvia-50 py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="badge-toxin-free mb-6">
              <Leaf className="h-4 w-4" />
              Desde 2024 libres de tóxicos
            </Badge>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-carbon-800 mb-6">
              Belleza consciente,{" "}
              <span className="text-salvia-600">sin compromisos</span>
            </h1>
            <p className="text-lg text-carbon-600">
              En The Lobby Beauty creemos que cuidar tu belleza no debería poner
              en riesgo tu salud. Por eso, nos especializamos en servicios de
              belleza con productos 100% naturales y libres de sustancias tóxicas.
            </p>
          </div>
        </div>
      </section>

      {/* Nuestra Historia */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-3xl font-bold text-carbon-800 mb-6">
                Nuestra Historia
              </h2>
              <div className="space-y-4 text-carbon-600">
                <p>
                  The Lobby Beauty nació de una convicción profunda: la belleza y
                  el bienestar deben ir de la mano. Cuando comenzamos a investigar
                  los ingredientes de los productos de belleza convencionales,
                  descubrimos una realidad preocupante.
                </p>
                <p>
                  Muchos esmaltes, geles y productos de uso común contenían
                  sustancias potencialmente dañinas para la salud. Decidimos que
                  había una forma mejor de hacer las cosas.
                </p>
                <p>
                  Hoy, nos enorgullece ofrecer servicios de belleza de alta calidad
                  utilizando exclusivamente productos naturales, libres de TPO,
                  DMPT y otras sustancias tóxicas. Nos adelantamos a la regulación
                  de la UE porque creemos que tu salud no puede esperar.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-salvia-100 to-terracota-100 rounded-2xl flex items-center justify-center">
                <Users className="h-24 w-24 text-salvia-400" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg border border-crudo-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-salvia-100 rounded-lg">
                    <Award className="h-6 w-6 text-salvia-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-carbon-800">+5 años</p>
                    <p className="text-sm text-carbon-500">de experiencia</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestros Valores */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-carbon-800 mb-4">
              Nuestros Valores
            </h2>
            <p className="text-carbon-600 max-w-2xl mx-auto">
              Cada decisión que tomamos está guiada por estos principios
              fundamentales.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {valores.map((valor) => (
              <Card key={valor.titulo} className="bg-crudo-50 border-crudo-200">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-3 rounded-full bg-salvia-100 text-salvia-600 mb-4">
                    <valor.icono className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-carbon-800 mb-2">
                    {valor.titulo}
                  </h3>
                  <p className="text-sm text-carbon-600">{valor.descripcion}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sección sobre tóxicos */}
      <section id="libre-toxicos" className="py-16 bg-crudo-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium mb-4">
              <AlertTriangle className="h-4 w-4" />
              Información importante
            </div>
            <h2 className="font-display text-3xl font-bold text-carbon-800 mb-4">
              ¿Por qué evitamos estas sustancias?
            </h2>
            <p className="text-carbon-600 max-w-2xl mx-auto">
              La Unión Europea ha prohibido estas sustancias a partir de
              septiembre de 2025. En The Lobby Beauty, nos adelantamos porque tu
              salud no puede esperar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {sustanciasToxicas.map((sustancia) => (
              <Card
                key={sustancia.nombre}
                className="bg-white border-crudo-200 overflow-hidden"
              >
                <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                  <h3 className="font-display text-xl font-bold text-red-800">
                    {sustancia.nombre}
                  </h3>
                  <p className="text-sm text-red-600">{sustancia.nombreCompleto}</p>
                </div>
                <CardContent className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-carbon-500 mb-1">Uso común:</p>
                    <p className="text-carbon-700">{sustancia.uso}</p>
                  </div>
                  <div>
                    <p className="text-sm text-carbon-500 mb-2">
                      Riesgos potenciales:
                    </p>
                    <ul className="space-y-2">
                      {sustancia.riesgos.map((riesgo, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-carbon-700"
                        >
                          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                          {riesgo}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Nuestra alternativa */}
          <div className="mt-12 bg-salvia-50 rounded-2xl p-8 border border-salvia-200">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="p-4 bg-salvia-100 rounded-xl flex-shrink-0">
                <CheckCircle2 className="h-8 w-8 text-salvia-600" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-carbon-800 mb-3">
                  Nuestra alternativa: productos 100% seguros
                </h3>
                <p className="text-carbon-600 mb-4">
                  Trabajamos exclusivamente con marcas que han desarrollado
                  fórmulas innovadoras sin estas sustancias nocivas. Nuestros
                  esmaltes y productos utilizan:
                </p>
                <ul className="grid sm:grid-cols-2 gap-2">
                  {[
                    "Fotoiniciadores de base vegetal",
                    "Pigmentos naturales certificados",
                    "Resinas de origen orgánico",
                    "Aceites esenciales puros",
                    "Ingredientes hipoalergénicos",
                    "Fórmulas sin formaldehído",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-sm text-carbon-700"
                    >
                      <Leaf className="h-4 w-4 text-salvia-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-salvia-600 to-salvia-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-bold text-crudo-50 mb-4">
            ¿Lista para cuidarte de forma natural?
          </h2>
          <p className="text-crudo-100 max-w-2xl mx-auto mb-8">
            Descubre nuestros servicios y experimenta la diferencia de la belleza
            consciente.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="bg-crudo-50 text-salvia-700 hover:bg-crudo-100"
            >
              <Link to="/servicios">
                Ver Servicios
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-crudo-100 text-crudo-50 hover:bg-salvia-500"
            >
              <Link to="/contacto">Contactar</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
