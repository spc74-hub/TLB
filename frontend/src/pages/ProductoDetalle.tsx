import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ShoppingCart,
  Leaf,
  Heart,
  Shield,
  Minus,
  Plus,
  Check,
  Package,
  Truck,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getProductoById,
  getCategoriasProductos,
  getProductosPorCategoria,
  type Producto,
  type CategoriaProductoInfo,
} from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { ProductReviews } from "@/components/ProductReviews";
import { SEO } from "@/components/SEO";
import { ShareButtons } from "@/components/ShareButtons";

export function ProductoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cantidad, setCantidad] = useState(1);
  const { agregarProducto, estaEnCarrito, obtenerCantidad, cantidadTotal } = useCart();

  const [producto, setProducto] = useState<Producto | null>(null);
  const [categorias, setCategorias] = useState<CategoriaProductoInfo[]>([]);
  const [productosRelacionados, setProductosRelacionados] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarProducto() {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const [productoData, categoriasData] = await Promise.all([
          getProductoById(parseInt(id)),
          getCategoriasProductos(),
        ]);
        setProducto(productoData);
        setCategorias(categoriasData);

        // Cargar productos relacionados
        if (productoData) {
          const relacionados = await getProductosPorCategoria(
            productoData.categoria,
            productoData.id,
            4
          );
          setProductosRelacionados(relacionados);
        }
      } catch (err) {
        setError("Producto no encontrado");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    cargarProducto();
  }, [id]);

  // Adaptar producto para el carrito
  const adaptarProductoParaCarrito = (prod: Producto) => ({
    id: prod.id,
    nombre: prod.nombre,
    descripcion: prod.descripcion,
    descripcion_corta: prod.descripcion_corta,
    categoria: prod.categoria,
    precio: Number(prod.precio),
    precio_oferta: prod.precio_oferta ? Number(prod.precio_oferta) : undefined,
    imagen_url: prod.imagen_url || "",
    stock: prod.stock,
    es_natural: prod.es_natural,
    es_vegano: prod.es_vegano,
    es_cruelty_free: prod.es_cruelty_free,
    activo: prod.activo,
    destacado: prod.destacado,
    created_at: prod.created_at,
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-crudo-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-salvia-500 mx-auto mb-4" />
          <p className="text-carbon-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-crudo-50">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-carbon-800 mb-4">
            Producto no encontrado
          </h1>
          <p className="text-carbon-600 mb-6">
            El producto que buscas no existe o ya no está disponible.
          </p>
          <Button asChild className="bg-salvia-500 hover:bg-salvia-600">
            <Link to="/tienda">Volver a la tienda</Link>
          </Button>
        </div>
      </div>
    );
  }

  const categoria = categorias.find((c) => c.slug === producto.categoria);

  const handleAgregarCarrito = () => {
    agregarProducto(adaptarProductoParaCarrito(producto), cantidad);
    setCantidad(1);
  };

  const descuento = producto.precio_oferta
    ? Math.round((1 - producto.precio_oferta / producto.precio) * 100)
    : 0;

  return (
    <div className="bg-crudo-50 min-h-screen">
      <SEO
        title={producto.nombre}
        url={`/tienda/${producto.id}`}
        description={producto.descripcion_corta || producto.descripcion}
        image={producto.imagen_url || undefined}
        type="product"
        keywords={`${producto.nombre}, ${producto.categoria}, productos naturales, cosmeticos`}
      />
      {/* Breadcrumb */}
      <div className="bg-white border-b border-crudo-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-carbon-500">
              <Link to="/tienda" className="hover:text-salvia-600">
                Tienda
              </Link>
              <span>/</span>
              <Link
                to={`/tienda?categoria=${producto.categoria}`}
                className="hover:text-salvia-600"
              >
                {categoria?.nombre}
              </Link>
              <span>/</span>
              <span className="text-carbon-800">{producto.nombre}</span>
            </div>
            <Link to="/carrito">
              <Button variant="outline" size="sm" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Carrito
                {cantidadTotal > 0 && (
                  <Badge className="bg-terracota-500 text-white">
                    {cantidadTotal}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          className="mb-6 text-carbon-600 hover:text-carbon-800"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Imagen */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl border border-crudo-200 overflow-hidden relative">
              {producto.imagen_url ? (
                <img
                  src={producto.imagen_url}
                  alt={producto.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-crudo-200">
                  <Leaf className="h-32 w-32" />
                </div>
              )}
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {producto.precio_oferta && (
                  <Badge className="bg-terracota-500 text-white text-sm">
                    -{descuento}%
                  </Badge>
                )}
                {producto.destacado && (
                  <Badge className="bg-salvia-500 text-white">Destacado</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Información */}
          <div>
            <p className="text-sm text-salvia-600 uppercase tracking-wide mb-2">
              {categoria?.nombre}
            </p>
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-carbon-800">
                {producto.nombre}
              </h1>
              <ShareButtons
                url={`/tienda/${producto.id}`}
                title={producto.nombre}
                description={producto.descripcion_corta || producto.descripcion}
              />
            </div>

            {/* Badges de características */}
            <div className="flex flex-wrap gap-2 mb-6">
              {producto.es_natural && (
                <Badge variant="outline" className="border-salvia-400 text-salvia-700 gap-1">
                  <Leaf className="h-3 w-3" />
                  Natural
                </Badge>
              )}
              {producto.es_vegano && (
                <Badge variant="outline" className="border-salvia-400 text-salvia-700 gap-1">
                  <Heart className="h-3 w-3" />
                  Vegano
                </Badge>
              )}
              {producto.es_cruelty_free && (
                <Badge variant="outline" className="border-salvia-400 text-salvia-700 gap-1">
                  <Shield className="h-3 w-3" />
                  Cruelty Free
                </Badge>
              )}
            </div>

            {/* Precio */}
            <div className="mb-6">
              {producto.precio_oferta ? (
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-4xl font-bold text-terracota-600">
                    {Number(producto.precio_oferta).toFixed(2)}€
                  </span>
                  <span className="text-xl text-carbon-400 line-through">
                    {Number(producto.precio).toFixed(2)}€
                  </span>
                  <Badge className="bg-terracota-100 text-terracota-700">
                    Ahorras {(Number(producto.precio) - Number(producto.precio_oferta)).toFixed(2)}€
                  </Badge>
                </div>
              ) : (
                <span className="font-display text-4xl font-bold text-carbon-800">
                  {Number(producto.precio).toFixed(2)}€
                </span>
              )}
              <p className="text-sm text-carbon-500 mt-1">IVA incluido</p>
            </div>

            {/* Descripción */}
            <p className="text-carbon-600 mb-6 leading-relaxed">
              {producto.descripcion}
            </p>

            {/* Stock */}
            <div className="mb-6">
              {producto.stock > 10 ? (
                <p className="text-salvia-600 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  En stock
                </p>
              ) : producto.stock > 0 ? (
                <p className="text-terracota-600 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  ¡Solo quedan {producto.stock} unidades!
                </p>
              ) : (
                <p className="text-carbon-400">Agotado</p>
              )}
            </div>

            {/* Selector de cantidad y botón */}
            {producto.stock > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex items-center border border-crudo-300 rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    disabled={cantidad <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{cantidad}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCantidad(Math.min(producto.stock, cantidad + 1))}
                    disabled={cantidad >= producto.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  size="lg"
                  className="flex-1 bg-salvia-500 hover:bg-salvia-600 gap-2"
                  onClick={handleAgregarCarrito}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {estaEnCarrito(producto.id)
                    ? `Añadir más (${obtenerCantidad(producto.id)} en carrito)`
                    : "Añadir al carrito"}
                </Button>
              </div>
            )}

            {/* Beneficios */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-crudo-200">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto text-salvia-600 mb-2" />
                <p className="text-xs text-carbon-600">Envío gratis +50€</p>
              </div>
              <div className="text-center">
                <Package className="h-6 w-6 mx-auto text-salvia-600 mb-2" />
                <p className="text-xs text-carbon-600">Envío 24-48h</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 mx-auto text-salvia-600 mb-2" />
                <p className="text-xs text-carbon-600">Devolución 30 días</p>
              </div>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          {producto.ingredientes && producto.ingredientes.length > 0 && (
            <Card className="border-crudo-200">
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-semibold text-carbon-800 mb-4">
                  Ingredientes
                </h3>
                <p className="text-carbon-600 text-sm">
                  {producto.ingredientes.join(", ")}
                </p>
              </CardContent>
            </Card>
          )}
          {producto.modo_uso && (
            <Card className="border-crudo-200">
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-semibold text-carbon-800 mb-4">
                  Modo de uso
                </h3>
                <p className="text-carbon-600 text-sm">{producto.modo_uso}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Reseñas de productos */}
        <div className="mt-12">
          <Card className="border-crudo-200">
            <CardContent className="p-6">
              <h2 className="font-display text-2xl font-bold text-carbon-800 mb-6">
                Opiniones de clientes
              </h2>
              <ProductReviews productoId={producto.id} />
            </CardContent>
          </Card>
        </div>

        {/* Productos relacionados */}
        {productosRelacionados.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-2xl font-bold text-carbon-800 mb-6">
              Productos relacionados
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {productosRelacionados.map((prod) => (
                <Link key={prod.id} to={`/tienda/${prod.id}`}>
                  <Card className="group bg-white border-crudo-200 hover:shadow-lg transition-all overflow-hidden h-full">
                    <div className="aspect-square bg-crudo-100 relative overflow-hidden">
                      {prod.imagen_url ? (
                        <img
                          src={prod.imagen_url}
                          alt={prod.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-crudo-300">
                          <Leaf className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-display font-semibold text-carbon-800 group-hover:text-salvia-600 transition-colors line-clamp-2 mb-2">
                        {prod.nombre}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        {prod.precio_oferta ? (
                          <>
                            <span className="font-bold text-terracota-600">
                              {Number(prod.precio_oferta).toFixed(2)}€
                            </span>
                            <span className="text-sm text-carbon-400 line-through">
                              {Number(prod.precio).toFixed(2)}€
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-carbon-800">
                            {Number(prod.precio).toFixed(2)}€
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
