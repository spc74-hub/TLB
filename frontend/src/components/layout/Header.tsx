import { Link } from "react-router-dom";
import { Menu, X, Leaf } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navegacion = [
  { nombre: "Inicio", href: "/" },
  { nombre: "Servicios", href: "/servicios" },
  { nombre: "Reservar", href: "/reservar" },
  { nombre: "Nosotros", href: "/nosotros" },
  { nombre: "Contacto", href: "/contacto" },
];

export function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);

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
            <Button className="bg-salvia-500 hover:bg-salvia-600 text-crudo-50">
              Reservar Cita
            </Button>
          </div>

          {/* Botón menú móvil */}
          <button
            type="button"
            className="md:hidden p-2 text-carbon-600"
            onClick={() => setMenuAbierto(!menuAbierto)}
          >
            {menuAbierto ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
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
              <Button className="bg-salvia-500 hover:bg-salvia-600 text-crudo-50 w-full">
                Reservar Cita
              </Button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
