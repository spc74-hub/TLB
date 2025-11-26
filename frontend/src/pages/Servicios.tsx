import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Leaf, Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ServiceCard, CategoryFilter } from "@/components/servicios";
import {
  getServicios,
  type Servicio,
  type CategoriaServicio,
} from "@/lib/supabase";
import { SEO } from "@/components/SEO";

const categoriaLabels: Record<CategoriaServicio, string> = {
  manicura: "Manicura",
  pedicura: "Pedicura",
  depilacion: "Depilación",
  cejas: "Cejas",
  pestanas: "Pestañas",
};

export function Servicios() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoriaParam = searchParams.get("categoria") as CategoriaServicio | null;

  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoriaActiva, setCategoriaActiva] = useState<CategoriaServicio | "todas">(
    categoriaParam || "todas"
  );
  const [busqueda, setBusqueda] = useState("");
  const [soloNaturales, setSoloNaturales] = useState(false);

  // Cargar datos de Supabase
  useEffect(() => {
    let cancelled = false;

    async function cargarDatos() {
      try {
        setLoading(true);
        setError(null);

        const serviciosData = await getServicios();

        if (!cancelled) {
          setServicios(serviciosData);
        }
      } catch (err) {
        console.error("Error cargando servicios:", err);
        if (!cancelled) {
          setError("Error al cargar los servicios. Pulsa Reintentar.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    cargarDatos();

    return () => { cancelled = true; };
  }, []);

  // Filtrar servicios
  const serviciosFiltrados = useMemo(() => {
    return servicios.filter((servicio) => {
      // Filtro por categoría
      if (categoriaActiva !== "todas" && servicio.categoria !== categoriaActiva) {
        return false;
      }

      // Filtro por búsqueda
      if (busqueda) {
        const searchLower = busqueda.toLowerCase();
        const matchNombre = servicio.nombre.toLowerCase().includes(searchLower);
        const matchDesc = servicio.descripcion?.toLowerCase().includes(searchLower);
        if (!matchNombre && !matchDesc) return false;
      }

      // Filtro por productos naturales
      if (soloNaturales && !servicio.es_libre_toxicos) {
        return false;
      }

      // Solo activos
      return servicio.activo;
    });
  }, [servicios, categoriaActiva, busqueda, soloNaturales]);

  // Agrupar por categoría cuando se muestran todos
  const serviciosAgrupados = useMemo(() => {
    if (categoriaActiva !== "todas") {
      return { [categoriaActiva]: serviciosFiltrados };
    }

    return serviciosFiltrados.reduce(
      (acc, servicio) => {
        const cat = servicio.categoria;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(servicio);
        return acc;
      },
      {} as Record<string, typeof serviciosFiltrados>
    );
  }, [serviciosFiltrados, categoriaActiva]);

  const handleCategoriaChange = (categoria: CategoriaServicio | "todas") => {
    setCategoriaActiva(categoria);
    if (categoria === "todas") {
      searchParams.delete("categoria");
    } else {
      searchParams.set("categoria", categoria);
    }
    setSearchParams(searchParams);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-crudo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-salvia-500 mx-auto mb-4" />
          <p className="text-carbon-600">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-crudo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-terracota-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-salvia-500 text-white px-4 py-2 rounded-lg hover:bg-salvia-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-crudo-50">
      <SEO
        title="Servicios"
        url="/servicios"
        description="Descubre nuestros servicios de belleza: manicura, pedicura, depilacion, cejas y pestanas. Tratamientos naturales y profesionales."
        keywords="manicura, pedicura, depilacion, cejas, pestanas, servicios de belleza, tratamientos naturales"
      />
      {/* Header de la página */}
      <section className="bg-gradient-to-br from-crudo-100 to-salvia-50 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="badge-toxin-free mb-4">
              <Leaf className="h-4 w-4" />
              100% Libres de TPO y DMPT
            </Badge>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-carbon-800 mb-4">
              Nuestros Servicios
            </h1>
            <p className="text-lg text-carbon-600">
              Descubre nuestra amplia gama de servicios de belleza con productos
              naturales. Tu bienestar y salud son nuestra prioridad.
            </p>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="sticky top-16 z-40 bg-crudo-50/95 backdrop-blur-sm border-b border-crudo-200 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Filtro de categorías */}
            <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
              <CategoryFilter
                categoriaActiva={categoriaActiva}
                onCategoriaChange={handleCategoriaChange}
              />
            </div>

            {/* Búsqueda y filtros adicionales */}
            <div className="flex gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                <Input
                  type="text"
                  placeholder="Buscar servicios..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10 bg-white border-crudo-300 focus:border-salvia-400"
                />
              </div>

              <button
                onClick={() => setSoloNaturales(!soloNaturales)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  soloNaturales
                    ? "bg-salvia-100 border-salvia-400 text-salvia-700"
                    : "bg-white border-crudo-300 text-carbon-600 hover:border-salvia-400"
                }`}
              >
                <Leaf className="h-4 w-4" />
                <span className="hidden sm:inline">Natural</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Listado de servicios */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {serviciosFiltrados.length === 0 ? (
            <div className="text-center py-16">
              <SlidersHorizontal className="h-12 w-12 text-carbon-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-carbon-700 mb-2">
                No se encontraron servicios
              </h3>
              <p className="text-carbon-500">
                Prueba a cambiar los filtros o la búsqueda
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(serviciosAgrupados).map(([categoria, items]) => (
                <div key={categoria}>
                  {categoriaActiva === "todas" && (
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="font-display text-2xl font-semibold text-carbon-800">
                        {categoriaLabels[categoria as CategoriaServicio]}
                      </h2>
                      <div className="h-px flex-1 bg-crudo-300" />
                      <span className="text-sm text-carbon-500">
                        {items.length} servicios
                      </span>
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((servicio) => (
                      <ServiceCard key={servicio.id} servicio={servicio} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Info sobre productos naturales */}
          <div className="mt-16 bg-salvia-50 rounded-2xl p-8 border border-salvia-200">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="p-4 bg-salvia-100 rounded-xl">
                <Leaf className="h-8 w-8 text-salvia-600" />
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-carbon-800 mb-2">
                  Compromiso con tu salud
                </h3>
                <p className="text-carbon-600 mb-4">
                  Todos nuestros servicios utilizan productos{" "}
                  <strong>libres de TPO y DMPT</strong>, cumpliendo con las
                  últimas regulaciones de la Unión Europea. Estas sustancias han
                  sido clasificadas como potencialmente carcinógenas y
                  disruptores endocrinos.
                </p>
                <p className="text-sm text-carbon-500">
                  En The Lobby Beauty, tu belleza nunca compromete tu salud.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
