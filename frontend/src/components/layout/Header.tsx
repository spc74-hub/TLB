import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Leaf, ShoppingCart, Heart, User, LogOut, Loader2, Settings } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useAuth } from "@/context/AuthContext";

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
  const { cantidadTotal: favoritosTotal } = useWishlist();
  const { user, perfil, loading, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const nombreUsuario = perfil?.nombre || user?.email?.split("@")[0] || "Usuario";

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
            <Link to="/favoritos" className="relative p-2 text-carbon-600 hover:text-salvia-600">
              <Heart className="h-5 w-5" />
              {favoritosTotal > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-terracota-500 text-white text-xs">
                  {favoritosTotal}
                </Badge>
              )}
            </Link>
            <Link to="/carrito" className="relative p-2 text-carbon-600 hover:text-salvia-600">
              <ShoppingCart className="h-5 w-5" />
              {cantidadTotal > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-terracota-500 text-white text-xs">
                  {cantidadTotal}
                </Badge>
              )}
            </Link>

            {/* Auth buttons */}
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-carbon-400" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-carbon-600 hover:text-salvia-600">
                    <User className="h-5 w-5" />
                    <span className="hidden lg:inline">{nombreUsuario}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to="/perfil" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Mi perfil
                    </Link>
                  </DropdownMenuItem>
                  {(perfil?.rol === "admin" || perfil?.rol === "profesional") && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Panel Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-terracota-600">
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" className="text-carbon-600 hover:text-salvia-600">
                  <Link to="/login">Iniciar sesión</Link>
                </Button>
                <Button asChild className="bg-salvia-500 hover:bg-salvia-600 text-crudo-50 hidden lg:inline-flex">
                  <Link to="/registro">Registrarse</Link>
                </Button>
              </div>
            )}

            <Button asChild className="bg-salvia-500 hover:bg-salvia-600 text-crudo-50">
              <Link to="/reservar">Reservar Cita</Link>
            </Button>
          </div>

          {/* Botones móvil */}
          <div className="flex items-center gap-2 md:hidden">
            <Link to="/favoritos" className="relative p-2 text-carbon-600">
              <Heart className="h-5 w-5" />
              {favoritosTotal > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-terracota-500 text-white text-xs">
                  {favoritosTotal}
                </Badge>
              )}
            </Link>
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

              {/* Auth en móvil */}
              <div className="border-t border-crudo-200 pt-4 mt-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 text-carbon-700 font-medium mb-3">
                      <User className="h-5 w-5" />
                      {nombreUsuario}
                    </div>
                    <Link
                      to="/perfil"
                      className="block text-carbon-600 hover:text-salvia-600 py-2"
                      onClick={() => setMenuAbierto(false)}
                    >
                      Mi perfil
                    </Link>
                    {(perfil?.rol === "admin" || perfil?.rol === "profesional") && (
                      <Link
                        to="/admin"
                        className="block text-carbon-600 hover:text-salvia-600 py-2 flex items-center gap-2"
                        onClick={() => setMenuAbierto(false)}
                      >
                        <Settings className="h-4 w-4" />
                        Panel Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setMenuAbierto(false);
                      }}
                      className="text-terracota-600 hover:text-terracota-700 py-2 flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/login" onClick={() => setMenuAbierto(false)}>
                        Iniciar sesión
                      </Link>
                    </Button>
                    <Button asChild className="w-full bg-salvia-500 hover:bg-salvia-600">
                      <Link to="/registro" onClick={() => setMenuAbierto(false)}>
                        Registrarse
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

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
