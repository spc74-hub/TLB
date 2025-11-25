import { Link } from "react-router-dom";
import { Menu, X, Leaf, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/CartContext";

const navegacion = [
  { nombre: "Inicio", href: "/" },
  { nombre: "Servicios", href: "/servicios" },
  { nombre: "Tienda", href: "/tienda" },
  { nombre: "Reservar", href: "/reservar" },
  { nombre: "Nosotros", href: "/nosotros" },
  { nombre: "Contacto", href: "/contacto" },
];

export function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { cantidadTotal } = useCart();

  return (
    <header className="bg-crudo-50 border-b border-crudo-300 sticky top-0 z-50">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-salvia-500" />
            <span className="font-display text-xl font-semibold text-carbon-800">
              The Lobby Beauty
            </span>
          </Link>

          {/* Navegación desktop */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {navegacion.map((item) => (
              <Link
                key={item.nombre}
                to={item.href}
                className="text-carbon-600 hover:text-salvia-600 font-medium transition-colors"
              >
                {item.nombre}
              </Link>
            ))}
            <Link to="/carrito" className="relative p-2 text-carbon-600 hover:text-salvia-600">
              <ShoppingCart className="h-5 w-5" />
              {cantidadTotal > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-terracota-500 text-white text-xs">
                  {cantidadTotal}
                </Badge>
              )}
            </Link>
            <Button asChild className="bg-salvia-500 hover:bg-salvia-600 text-crudo-50">
              <Link to="/reservar">Reservar Cita</Link>
            </Button>
          </div>

          {/* Botones móvil */}
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/carrito" className="relative p-2 text-carbon-600">
              <ShoppingCart className="h-5 w-5" />
              {cantidadTotal > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-terracota-500 text-white text-xs">
                  {cantidadTotal}
                </Badge>
              )}
            </Link>
            <button
              type="button"
              className="p-2 text-carbon-600"
              onClick={() => setMenuAbierto(!menuAbierto)}
            >
              {menuAbierto ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {menuAbierto && (
          <div className="md:hidden py-4 border-t border-crudo-300">
            <div className="flex flex-col gap-4">
              {navegacion.map((item) => (
                <Link
                  key={item.nombre}
                  to={item.href}
                  className="text-carbon-600 hover:text-salvia-600 font-medium py-2"
                  onClick={() => setMenuAbierto(false)}
                >
                  {item.nombre}
                </Link>
              ))}
              <Button asChild className="bg-salvia-500 hover:bg-salvia-600 text-crudo-50 w-full">
                <Link to="/reservar" onClick={() => setMenuAbierto(false)}>
                  Reservar Cita
                </Link>
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
