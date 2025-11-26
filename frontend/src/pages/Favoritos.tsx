import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  Trash2,
  ArrowLeft,
  Leaf,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageTransition, staggerContainer, staggerItem } from "@/components/ui/motion";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";

export function Favoritos() {
  const { items, cantidadTotal, eliminarFavorito, vaciarFavoritos } = useWishlist();
  const { agregarProducto, estaEnCarrito } = useCart();

  if (items.length === 0) {
    return (
      <PageTransition>
        <div className="bg-crudo-50 min-h-screen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-crudo-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-12 w-12 text-crudo-400" />
              </div>
              <h1 className="font-display text-2xl font-bold text-carbon-800 mb-4">
                Tu lista de favoritos esta vacia
              </h1>
              <p className="text-carbon-600 mb-8">
                Explora nuestra tienda y guarda los productos que mas te gusten.
              </p>
              <Button asChild size="lg" className="bg-salvia-500 hover:bg-salvia-600 gap-2">
                <Link to="/tienda">
                  <ArrowLeft className="h-5 w-5" />
                  Ir a la tienda
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="bg-crudo-50 min-h-screen">
        {/* Header */}
        <section className="bg-gradient-to-r from-terracota-500 to-terracota-600 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-crudo-50 mb-2">
              Mis favoritos
            </h1>
            <p className="text-crudo-100">
              {cantidadTotal} producto{cantidadTotal !== 1 ? "s" : ""} guardado{cantidadTotal !== 1 ? "s" : ""}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/tienda"
              className="text-salvia-600 hover:text-salvia-700 flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Seguir comprando
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="text-carbon-500 hover:text-terracota-600"
              onClick={vaciarFavoritos}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Vaciar lista
            </Button>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {items.map((producto) => {
              const enCarrito = estaEnCarrito(producto.id);

              return (
                <motion.div key={producto.id} variants={staggerItem}>
                  <Card className="bg-white border-crudo-200 overflow-hidden group">
                    {/* Imagen */}
                    <div className="relative aspect-square bg-crudo-100">
                      <Link to={`/tienda/${producto.id}`}>
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf className="h-16 w-16 text-crudo-300" />
                        </div>
                      </Link>

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        {producto.precio_oferta && (
                          <span className="bg-terracota-500 text-white text-xs font-medium px-2 py-1 rounded">
                            -{Math.round(((producto.precio - producto.precio_oferta) / producto.precio) * 100)}%
                          </span>
                        )}
                        {producto.es_natural && (
                          <span className="bg-salvia-500 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                            <Leaf className="h-3 w-3" />
                            Natural
                          </span>
                        )}
                      </div>

                      {/* Boton eliminar */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 bg-white/80 hover:bg-white text-terracota-500 hover:text-terracota-600"
                        onClick={() => eliminarFavorito(producto.id)}
                      >
                        <Heart className="h-5 w-5 fill-current" />
                      </Button>
                    </div>

                    <CardContent className="p-4">
                      <p className="text-xs text-salvia-600 font-medium uppercase tracking-wide mb-1">
                        {producto.categoria}
                      </p>
                      <Link to={`/tienda/${producto.id}`}>
                        <h3 className="font-display font-semibold text-carbon-800 mb-1 line-clamp-2 group-hover:text-salvia-600 transition-colors">
                          {producto.nombre}
                        </h3>
                      </Link>
                      <p className="text-sm text-carbon-500 line-clamp-2 mb-3">
                        {producto.descripcion_corta}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          {producto.precio_oferta ? (
                            <>
                              <span className="font-display text-lg font-bold text-terracota-600">
                                {producto.precio_oferta.toFixed(2)}€
                              </span>
                              <span className="text-sm text-carbon-400 line-through">
                                {producto.precio.toFixed(2)}€
                              </span>
                            </>
                          ) : (
                            <span className="font-display text-lg font-bold text-carbon-800">
                              {producto.precio.toFixed(2)}€
                            </span>
                          )}
                        </div>

                        <Button
                          size="icon"
                          className={
                            enCarrito
                              ? "bg-salvia-100 text-salvia-600 hover:bg-salvia-200"
                              : "bg-salvia-500 hover:bg-salvia-600 text-white"
                          }
                          onClick={() => agregarProducto(producto)}
                          disabled={producto.stock === 0}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>

                      {producto.stock === 0 && (
                        <p className="text-xs text-terracota-600 mt-2">Agotado</p>
                      )}
                      {producto.stock > 0 && producto.stock <= 5 && (
                        <p className="text-xs text-terracota-600 mt-2">
                          Ultimas {producto.stock} unidades
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
