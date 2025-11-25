import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  Leaf,
  ShieldCheck,
  Calendar,
  Star,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ServiceCard } from "@/components/servicios";
import {
  getServicioById,
  getServicios,
  type Servicio,
  type CategoriaServicio,
} from "@/lib/supabase";

const categoriaLabels: Record<CategoriaServicio, string> = {
  manicura: "Manicura",
  pedicura: "Pedicura",
  depilacion: "Depilación",
  cejas: "Cejas",
  pestanas: "Pestañas",
};

export function ServicioDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [servicio, setServicio] = useState<Servicio | null>(null);
  const [serviciosRelacionados, setServiciosRelacionados] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarServicio() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const servicioData = await getServicioById(parseInt(id));
        setServicio(servicioData);

        // Cargar servicios relacionados
        if (servicioData) {
          const todosServicios = await getServicios(servicioData.categoria);
          const relacionados = todosServicios
            .filter((s) => s.id !== servicioData.id)
            .slice(0, 3);
          setServiciosRelacionados(relacionados);
        }
      } catch (err) {
        setError("Servicio no encontrado");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    cargarServicio();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-crudo-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-salvia-500 mx-auto mb-4" />
          <p className="text-carbon-600">Cargando servicio...</p>
        </div>
      </div>
    );
  }

  if (error || !servicio) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-carbon-800 mb-4">
            Servicio no encontrado
          </h1>
          <p className="text-carbon-600 mb-6">
            El servicio que buscas no existe o ha sido eliminado.
          </p>
          <Button asChild className="bg-salvia-500 hover:bg-salvia-600">
            <Link to="/servicios">Ver todos los servicios</Link>
          </Button>
        </div>
      </div>
    );
  }

  const formatPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(precio);
  };

  const formatDuracion = (minutos: number) => {
    if (minutos < 60) return `${minutos} minutos`;
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return mins > 0 ? `${horas}h ${mins}min` : `${horas} hora${horas > 1 ? "s" : ""}`;
  };

  return (
    <div className="min-h-screen bg-crudo-50">
      {/* Breadcrumb */}
      <div className="bg-crudo-100 border-b border-crudo-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-carbon-600 hover:text-salvia-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Imagen / Visual */}
            <div>
              <div className="aspect-square bg-gradient-to-br from-crudo-100 to-salvia-50 rounded-2xl overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Leaf className="h-32 w-32 text-salvia-300" />
                </div>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {servicio.es_libre_toxicos && (
                    <Badge className="bg-salvia-500 hover:bg-salvia-500 text-white">
                      <Leaf className="h-3 w-3 mr-1" />
                      Libre de tóxicos
                    </Badge>
                  )}
                  <Badge variant="secondary" className="bg-crudo-100 text-carbon-700">
                    {categoriaLabels[servicio.categoria]}
                  </Badge>
                </div>
              </div>

              {/* Certificaciones */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <Card className="bg-white border-crudo-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-salvia-100 rounded-lg">
                      <ShieldCheck className="h-5 w-5 text-salvia-600" />
                    </div>
                    <div>
                      <p className="font-medium text-carbon-800 text-sm">Sin TPO</p>
                      <p className="text-xs text-carbon-500">Regulación UE</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white border-crudo-200">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-salvia-100 rounded-lg">
                      <ShieldCheck className="h-5 w-5 text-salvia-600" />
                    </div>
                    <div>
                      <p className="font-medium text-carbon-800 text-sm">Sin DMPT</p>
                      <p className="text-xs text-carbon-500">Regulación UE</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Información */}
            <div>
              <div className="mb-6">
                <Link
                  to={`/servicios?categoria=${servicio.categoria}`}
                  className="text-sm text-salvia-600 hover:text-salvia-700 font-medium"
                >
                  {categoriaLabels[servicio.categoria]}
                </Link>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-carbon-800 mt-2">
                  {servicio.nombre}
                </h1>
              </div>

              {/* Precio y duración */}
              <div className="flex items-center gap-6 mb-8">
                <div>
                  <p className="text-sm text-carbon-500">Precio</p>
                  <p className="text-3xl font-bold text-salvia-600">
                    {formatPrecio(servicio.precio)}
                  </p>
                </div>
                <div className="h-12 w-px bg-crudo-300" />
                <div>
                  <p className="text-sm text-carbon-500">Duración</p>
                  <p className="text-xl font-semibold text-carbon-800 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-carbon-400" />
                    {formatDuracion(servicio.duracion_minutos)}
                  </p>
                </div>
              </div>

              {/* Descripción */}
              <div className="mb-8">
                <h2 className="font-display text-lg font-semibold text-carbon-800 mb-3">
                  Descripción
                </h2>
                <p className="text-carbon-600 leading-relaxed">
                  {servicio.descripcion}
                </p>
              </div>

              {/* Qué incluye */}
              <div className="mb-8">
                <h2 className="font-display text-lg font-semibold text-carbon-800 mb-3">
                  ¿Qué incluye?
                </h2>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-carbon-600">
                    <CheckCircle2 className="h-5 w-5 text-salvia-500" />
                    Productos 100% naturales
                  </li>
                  <li className="flex items-center gap-2 text-carbon-600">
                    <CheckCircle2 className="h-5 w-5 text-salvia-500" />
                    Profesionales certificados
                  </li>
                  <li className="flex items-center gap-2 text-carbon-600">
                    <CheckCircle2 className="h-5 w-5 text-salvia-500" />
                    Ambiente relajante
                  </li>
                  <li className="flex items-center gap-2 text-carbon-600">
                    <CheckCircle2 className="h-5 w-5 text-salvia-500" />
                    Asesoramiento personalizado
                  </li>
                </ul>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="flex-1 bg-salvia-500 hover:bg-salvia-600 text-lg py-6"
                >
                  <Link to={`/reservar?servicio=${servicio.id}`}>
                    <Calendar className="h-5 w-5 mr-2" />
                    Reservar ahora
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="flex-1 border-salvia-300 text-salvia-700 hover:bg-salvia-50 py-6"
                >
                  <Link to="/contacto">Consultar</Link>
                </Button>
              </div>

              {/* Valoraciones placeholder */}
              <div className="mt-8 pt-8 border-t border-crudo-200">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="h-5 w-5 fill-terracota-400 text-terracota-400"
                      />
                    ))}
                  </div>
                  <span className="font-semibold text-carbon-800">4.9</span>
                  <span className="text-carbon-500">· 127 valoraciones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Información adicional */}
      <section className="py-12 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="bg-salvia-50 rounded-2xl p-8 border border-salvia-200">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="p-4 bg-salvia-100 rounded-xl flex-shrink-0">
                <Leaf className="h-8 w-8 text-salvia-600" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-carbon-800 mb-2">
                  Nuestro compromiso con tu salud
                </h3>
                <p className="text-carbon-600 mb-4">
                  Este servicio utiliza exclusivamente productos{" "}
                  <strong>libres de TPO (óxido de trimetilbenzoildifenilfosfina)</strong>{" "}
                  y <strong>DMPT (dimetiltolilamina)</strong>, sustancias que han sido
                  prohibidas por la Unión Europea debido a sus potenciales efectos
                  nocivos para la salud.
                </p>
                <p className="text-sm text-carbon-500">
                  En The Lobby Beauty nos adelantamos a la normativa desde 2024,
                  priorizando siempre tu bienestar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios relacionados */}
      {serviciosRelacionados.length > 0 && (
        <section className="py-12 bg-crudo-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-semibold text-carbon-800">
                Servicios relacionados
              </h2>
              <Link
                to={`/servicios?categoria=${servicio.categoria}`}
                className="text-salvia-600 hover:text-salvia-700 font-medium text-sm"
              >
                Ver todos →
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviciosRelacionados.map((s) => (
                <ServiceCard key={s.id} servicio={s} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
