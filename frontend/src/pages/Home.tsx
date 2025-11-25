import { Link } from "react-router-dom";
import {
  Leaf,
  ShieldCheck,
  Heart,
  Sparkles,
  Hand,
  Eye,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const categorias = [
  {
    nombre: "Manicura",
    descripcion: "Uñas perfectas con esmaltes naturales",
    icono: Hand,
    href: "/servicios?categoria=manicura",
    color: "bg-terracota-100 text-terracota-700",
  },
  {
    nombre: "Pedicura",
    descripcion: "Cuidado completo para tus pies",
    icono: Sparkles,
    href: "/servicios?categoria=pedicura",
    color: "bg-salvia-100 text-salvia-700",
  },
  {
    nombre: "Depilación",
    descripcion: "Ceras naturales y suaves",
    icono: Sparkles,
    href: "/servicios?categoria=depilacion",
    color: "bg-crudo-300 text-crudo-800",
  },
  {
    nombre: "Cejas",
    descripcion: "Diseño personalizado para tu rostro",
    icono: Eye,
    href: "/servicios?categoria=cejas",
    color: "bg-terracota-100 text-terracota-700",
  },
  {
    nombre: "Pestañas",
    descripcion: "Mirada impactante y natural",
    icono: Eye,
    href: "/servicios?categoria=pestanas",
    color: "bg-salvia-100 text-salvia-700",
  },
];

const beneficios = [
  {
    icono: Leaf,
    titulo: "100% Natural",
    descripcion:
      "Todos nuestros productos son de origen natural, sin ingredientes sintéticos dañinos.",
  },
  {
    icono: ShieldCheck,
    titulo: "Libre de Tóxicos",
    descripcion:
      "Sin TPO ni DMPT. Cumplimos con las nuevas regulaciones de la UE para tu seguridad.",
  },
  {
    icono: Heart,
    titulo: "Cuidamos de Ti",
    descripcion:
      "Profesionales certificados que priorizan tu salud y bienestar en cada servicio.",
  },
];

export function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-crudo-100 via-crudo-50 to-salvia-50 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="badge-toxin-free mb-6">
                <Leaf className="h-4 w-4" />
                Libre de TPO y DMPT
              </Badge>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-carbon-800 mb-6">
                Belleza Natural,{" "}
                <span className="text-salvia-600">Sin Compromisos</span>
              </h1>
              <p className="text-lg text-carbon-600 mb-8 max-w-xl">
                En The Lobby Beauty nos especializamos en realzar tu belleza y
                bienestar con servicios profesionales y productos 100% naturales.
                Tu salud es nuestra prioridad.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-salvia-500 hover:bg-salvia-600 text-crudo-50"
                >
                  <Link to="/reservar">
                    Reservar Cita
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-salvia-500 text-salvia-600 hover:bg-salvia-50"
                >
                  <Link to="/servicios">Ver Servicios</Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-salvia-200 rounded-3xl rotate-3"></div>
                <div className="relative bg-crudo-200 rounded-3xl p-8 -rotate-3 shadow-xl">
                  <div className="aspect-square bg-gradient-to-br from-salvia-100 to-terracota-100 rounded-2xl flex items-center justify-center">
                    <Leaf className="h-32 w-32 text-salvia-500 opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alerta sobre regulación */}
      <section className="bg-salvia-600 text-crudo-50 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-center">
            <ShieldCheck className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm sm:text-base">
              <strong>Cumplimos con la nueva regulación de la UE:</strong> Todos
              nuestros productos están libres de TPO y DMPT desde 2024
            </p>
          </div>
        </div>
      </section>

      {/* Categorías de servicios */}
      <section className="py-20 bg-crudo-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-carbon-800 mb-4">
              Nuestros Servicios
            </h2>
            <p className="text-carbon-600 max-w-2xl mx-auto">
              Ofrecemos una amplia gama de servicios de belleza con productos
              naturales y técnicas profesionales.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {categorias.map((categoria) => (
              <Link key={categoria.nombre} to={categoria.href}>
                <Card className="h-full hover:shadow-lg transition-shadow bg-white border-crudo-200 hover:border-salvia-300">
                  <CardContent className="p-6 text-center">
                    <div
                      className={`inline-flex p-3 rounded-full ${categoria.color} mb-4`}
                    >
                      <categoria.icono className="h-6 w-6" />
                    </div>
                    <h3 className="font-display text-lg font-semibold text-carbon-800 mb-2">
                      {categoria.nombre}
                    </h3>
                    <p className="text-sm text-carbon-500">
                      {categoria.descripcion}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-salvia-500 text-salvia-600 hover:bg-salvia-50"
            >
              <Link to="/servicios">
                Ver todos los servicios
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-carbon-800 mb-4">
              ¿Por qué elegirnos?
            </h2>
            <p className="text-carbon-600 max-w-2xl mx-auto">
              Nos diferenciamos por nuestro compromiso con tu salud y el medio
              ambiente.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {beneficios.map((beneficio) => (
              <Card
                key={beneficio.titulo}
                className="bg-crudo-50 border-crudo-200"
              >
                <CardContent className="p-8 text-center">
                  <div className="inline-flex p-4 rounded-full bg-salvia-100 text-salvia-600 mb-6">
                    <beneficio.icono className="h-8 w-8" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-carbon-800 mb-3">
                    {beneficio.titulo}
                  </h3>
                  <p className="text-carbon-600">{beneficio.descripcion}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-salvia-600 to-salvia-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-crudo-50 mb-4">
            ¿Lista para cuidarte?
          </h2>
          <p className="text-crudo-100 max-w-2xl mx-auto mb-8">
            Reserva tu cita hoy y descubre la diferencia de los productos
            naturales. Tu belleza, nuestra pasión.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-crudo-50 text-salvia-700 hover:bg-crudo-100"
          >
            <Link to="/reservar">
              Reservar Ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
