import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Leaf,
  Heart,
  ShoppingCart,
  X,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import { PageTransition, staggerContainer, staggerItem } from "@/components/ui/motion";
import { ProductGridSkeleton } from "@/components/skeletons/ProductCardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getProductos,
  getCategoriasProductos,
  type Producto,
  type CategoriaProductoInfo,
  type CategoriaProducto,
} from '@/lib/api';
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { SEO } from "@/components/SEO";

export function Tienda() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoriaParam = searchParams.get("categoria") as CategoriaProducto | null;

  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaProductoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaProducto | null>(
    categoriaParam
  );
  const [soloNaturales, setSoloNaturales] = useState(false);
  const [soloVeganos, setSoloVeganos] = useState(false);
  const [soloOfertas, setSoloOfertas] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const { agregarProducto, estaEnCarrito, cantidadTotal } = useCart();
  const { toggleFavorito, esFavorito } = useWishlist();

  // Cargar datos de Supabase
  useEffect(() => {
    let cancelled = false;

    async function cargarDatos() {
      try {
        setLoading(true);
        setError(null);

        const [productosData, categoriasData] = await Promise.all([
          getProductos(),
          getCategoriasProductos()
        ]);

        if (!cancelled) {
          setProductos(productosData);
          setCategorias(categoriasData);
        }
      } catch (err) {
        console.error("Error cargando productos:", err);
        if (!cancelled) {
          setError("Error al cargar los productos. Pulsa Reintentar.");
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

  // Filtrar productos
  const productosFiltrados = productos.filter((producto) => {
    if (!producto.activo) return false;
    if (categoriaSeleccionada && producto.categoria !== categoriaSeleccionada) return false;
    if (soloNaturales && !producto.es_natural) return false;
    if (soloVeganos && !producto.es_vegano) return false;
    if (soloOfertas && !producto.precio_oferta) return false;
    if (busqueda) {
      const terminoLower = busqueda.toLowerCase();
      return (
        producto.nombre.toLowerCase().includes(terminoLower) ||
        producto.descripcion_corta.toLowerCase().includes(terminoLower)
      );
    }
    return true;
  });

  const handleCategoriaClick = (slug: CategoriaProducto | null) => {
    setCategoriaSeleccionada(slug);
    if (slug) {
      setSearchParams({ categoria: slug });
    } else {
      setSearchParams({});
    }
  };

  const limpiarFiltros = () => {
    setCategoriaSeleccionada(null);
    setSoloNaturales(false);
    setSoloVeganos(false);
    setSoloOfertas(false);
    setBusqueda("");
    setSearchParams({});
  };

  const hayFiltrosActivos = categoriaSeleccionada || soloNaturales || soloVeganos || soloOfertas || busqueda;

  // Adaptar producto para el carrito
  const adaptarProductoParaCarrito = (producto: Producto) => ({
    id: producto.id,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    descripcion_corta: producto.descripcion_corta,
    categoria: producto.categoria,
    precio: Number(producto.precio),
    precio_oferta: producto.precio_oferta ? Number(producto.precio_oferta) : undefined,
    imagen_url: producto.imagen_url || "",
    stock: producto.stock,
    es_natural: producto.es_natural,
    es_vegano: producto.es_vegano,
    es_cruelty_free: producto.es_cruelty_free,
    activo: producto.activo,
    destacado: producto.destacado,
    created_at: producto.created_at,
  });

  if (loading) {
    return (
      <div className="bg-crudo-50 min-h-screen">
        {/* Header skeleton */}
        <section className="bg-gradient-to-r from-salvia-600 to-salvia-700 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <Skeleton className="h-10 w-32 bg-white/20 mb-2" />
                <Skeleton className="h-5 w-64 bg-white/20" />
              </div>
              <Skeleton className="h-10 w-28 bg-white/20" />
            </div>
          </div>
        </section>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Barra de búsqueda skeleton */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-28" />
          </div>
          {/* Categorías skeleton */}
          <div className="flex flex-wrap gap-2 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
          {/* Contador skeleton */}
          <Skeleton className="h-5 w-40 mb-6" />
          {/* Grid skeleton */}
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-crudo-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-terracota-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Reintentar</Button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <SEO
        title="Tienda"
        url="/tienda"
        description="Descubre nuestra seleccion de productos naturales para el cuidado personal. Cremas, aceites, cosmeticos naturales y mas."
        keywords="productos naturales, cosmeticos naturales, cremas, aceites, cuidado personal, belleza natural"
      />
    <div className="bg-crudo-50 min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-salvia-600 to-salvia-700 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-crudo-50 mb-2">
                Tienda
              </h1>
              <p className="text-crudo-100">
                Productos naturales para tu belleza y bienestar
              </p>
            </div>
            <Link to="/carrito">
              <Button className="bg-crudo-50 text-salvia-700 hover:bg-crudo-100 gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrito
                {cantidadTotal > 0 && (
                  <Badge className="bg-terracota-500 text-white ml-1">
                    {cantidadTotal}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-carbon-400" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10 bg-white border-crudo-300"
            />
          </div>
          <Button
            variant="outline"
            className="gap-2 border-crudo-300"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            <SlidersHorizontal className="h-5 w-5" />
            Filtros
            {hayFiltrosActivos && (
              <Badge className="bg-salvia-500 text-white">!</Badge>
            )}
          </Button>
        </div>

        {/* Panel de filtros */}
        {mostrarFiltros && (
          <Card className="mb-6 border-crudo-200">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soloNaturales}
                    onChange={(e) => setSoloNaturales(e.target.checked)}
                    className="rounded border-crudo-300 text-salvia-600 focus:ring-salvia-500"
                  />
                  <Leaf className="h-4 w-4 text-salvia-600" />
                  <span className="text-sm">Solo naturales</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soloVeganos}
                    onChange={(e) => setSoloVeganos(e.target.checked)}
                    className="rounded border-crudo-300 text-salvia-600 focus:ring-salvia-500"
                  />
                  <Heart className="h-4 w-4 text-terracota-500" />
                  <span className="text-sm">Solo veganos</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={soloOfertas}
                    onChange={(e) => setSoloOfertas(e.target.checked)}
                    className="rounded border-crudo-300 text-salvia-600 focus:ring-salvia-500"
                  />
                  <span className="text-sm">En oferta</span>
                </label>
                {hayFiltrosActivos && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={limpiarFiltros}
                    className="text-carbon-500 hover:text-carbon-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categorías */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Button
            variant={categoriaSeleccionada === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoriaClick(null)}
            className={
              categoriaSeleccionada === null
                ? "bg-salvia-500 hover:bg-salvia-600"
                : "border-crudo-300 hover:border-salvia-400"
            }
          >
            Todos
          </Button>
          {categorias.map((cat) => (
            <Button
              key={cat.slug}
              variant={categoriaSeleccionada === cat.slug ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoriaClick(cat.slug as CategoriaProducto)}
              className={
                categoriaSeleccionada === cat.slug
                  ? "bg-salvia-500 hover:bg-salvia-600"
                  : "border-crudo-300 hover:border-salvia-400"
              }
            >
              {cat.nombre}
            </Button>
          ))}
        </div>

        {/* Resultados */}
        <p className="text-carbon-600 mb-6">
          {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? "s" : ""} encontrado{productosFiltrados.length !== 1 ? "s" : ""}
        </p>

        {/* Grid de productos */}
        {productosFiltrados.length > 0 ? (
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            key={`${categoriaSeleccionada}-${busqueda}-${soloNaturales}-${soloVeganos}-${soloOfertas}`}
          >
            {productosFiltrados.map((producto) => (
              <motion.div key={producto.id} variants={staggerItem}>
              <Card
                className="group bg-white border-crudo-200 hover:shadow-lg transition-all overflow-hidden h-full"
              >
                <Link to={`/tienda/${producto.id}`}>
                  <div className="aspect-square bg-crudo-100 relative overflow-hidden">
                    {producto.imagen_url ? (
                      <img
                        src={producto.imagen_url}
                        alt={producto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-crudo-300">
                        <Leaf className="h-16 w-16" />
                      </div>
                    )}
                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {producto.precio_oferta && (
                        <Badge className="bg-terracota-500 text-white">Oferta</Badge>
                      )}
                      {producto.es_vegano && (
                        <Badge className="bg-salvia-500 text-white">Vegano</Badge>
                      )}
                    </div>
                    {/* Boton favorito */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`absolute top-2 right-2 bg-white/80 hover:bg-white ${
                        esFavorito(producto.id)
                          ? "text-terracota-500 hover:text-terracota-600"
                          : "text-carbon-400 hover:text-terracota-500"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleFavorito(adaptarProductoParaCarrito(producto));
                      }}
                    >
                      <Heart className={`h-5 w-5 ${esFavorito(producto.id) ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link to={`/tienda/${producto.id}`}>
                    <p className="text-xs text-salvia-600 uppercase tracking-wide mb-1">
                      {categorias.find((c) => c.slug === producto.categoria)?.nombre}
                    </p>
                    <h3 className="font-display text-lg font-semibold text-carbon-800 mb-2 group-hover:text-salvia-600 transition-colors line-clamp-2">
                      {producto.nombre}
                    </h3>
                    <p className="text-sm text-carbon-500 mb-3 line-clamp-2">
                      {producto.descripcion_corta}
                    </p>
                  </Link>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      {producto.precio_oferta ? (
                        <>
                          <span className="font-bold text-lg text-terracota-600">
                            {Number(producto.precio_oferta).toFixed(2)}€
                          </span>
                          <span className="text-sm text-carbon-400 line-through">
                            {Number(producto.precio).toFixed(2)}€
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-lg text-carbon-800">
                          {Number(producto.precio).toFixed(2)}€
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => agregarProducto(adaptarProductoParaCarrito(producto))}
                      disabled={producto.stock === 0}
                      className={
                        estaEnCarrito(producto.id)
                          ? "bg-salvia-100 text-salvia-700 hover:bg-salvia-200"
                          : "bg-salvia-500 hover:bg-salvia-600 text-white"
                      }
                    >
                      {estaEnCarrito(producto.id) ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <ShoppingCart className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {producto.stock < 10 && producto.stock > 0 && (
                    <p className="text-xs text-terracota-600 mt-2">
                      ¡Solo quedan {producto.stock} unidades!
                    </p>
                  )}
                  {producto.stock === 0 && (
                    <p className="text-xs text-carbon-400 mt-2">Agotado</p>
                  )}
                </CardContent>
              </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <Filter className="h-12 w-12 text-crudo-300 mx-auto mb-4" />
            <h3 className="font-display text-xl font-semibold text-carbon-800 mb-2">
              No se encontraron productos
            </h3>
            <p className="text-carbon-500 mb-4">
              Prueba a cambiar los filtros o buscar otro término
            </p>
            <Button variant="outline" onClick={limpiarFiltros}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
