import { Link } from "react-router-dom";
import { Leaf, Instagram, Facebook, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-carbon-800 text-crudo-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Leaf className="h-8 w-8 text-salvia-400" />
              <span className="font-display text-xl font-semibold text-crudo-50">
                The Lobby Beauty
              </span>
            </Link>
            <p className="text-crudo-300 text-sm">
              Servicios de belleza con productos naturales, libres de TPO y DMPT.
              Tu bienestar es nuestra prioridad.
            </p>
            <div className="flex gap-4 mt-4">
              <a
                href="#"
                className="text-crudo-300 hover:text-salvia-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-crudo-300 hover:text-salvia-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Servicios */}
          <div>
            <h3 className="font-display text-lg font-semibold text-crudo-50 mb-4">
              Servicios
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/servicios?categoria=manicura"
                  className="text-crudo-300 hover:text-salvia-400 transition-colors"
                >
                  Manicura
                </Link>
              </li>
              <li>
                <Link
                  to="/servicios?categoria=pedicura"
                  className="text-crudo-300 hover:text-salvia-400 transition-colors"
                >
                  Pedicura
                </Link>
              </li>
              <li>
                <Link
                  to="/servicios?categoria=depilacion"
                  className="text-crudo-300 hover:text-salvia-400 transition-colors"
                >
                  Depilación
                </Link>
              </li>
              <li>
                <Link
                  to="/servicios?categoria=cejas"
                  className="text-crudo-300 hover:text-salvia-400 transition-colors"
                >
                  Cejas
                </Link>
              </li>
              <li>
                <Link
                  to="/servicios?categoria=pestanas"
                  className="text-crudo-300 hover:text-salvia-400 transition-colors"
                >
                  Pestañas
                </Link>
              </li>
            </ul>
          </div>

          {/* Enlaces útiles */}
          <div>
            <h3 className="font-display text-lg font-semibold text-crudo-50 mb-4">
              Información
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/nosotros"
                  className="text-crudo-300 hover:text-salvia-400 transition-colors"
                >
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link
                  to="/nosotros#ingredientes"
                  className="text-crudo-300 hover:text-salvia-400 transition-colors"
                >
                  Nuestros ingredientes
                </Link>
              </li>
              <li>
                <Link
                  to="/nosotros#libre-toxicos"
                  className="text-crudo-300 hover:text-salvia-400 transition-colors"
                >
                  Libres de tóxicos
                </Link>
              </li>
              <li>
                <Link
                  to="/privacidad"
                  className="text-crudo-300 hover:text-salvia-400 transition-colors"
                >
                  Política de privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-display text-lg font-semibold text-crudo-50 mb-4">
              Contacto
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-crudo-300">
                <MapPin className="h-4 w-4 text-salvia-400 flex-shrink-0" />
                <span>Calle Example 123, Madrid</span>
              </li>
              <li className="flex items-center gap-2 text-crudo-300">
                <Phone className="h-4 w-4 text-salvia-400 flex-shrink-0" />
                <a href="tel:+34612345678" className="hover:text-salvia-400 transition-colors">
                  +34 612 345 678
                </a>
              </li>
              <li className="flex items-center gap-2 text-crudo-300">
                <Mail className="h-4 w-4 text-salvia-400 flex-shrink-0" />
                <a
                  href="mailto:hola@thelobbybeauty.com"
                  className="hover:text-salvia-400 transition-colors"
                >
                  hola@thelobbybeauty.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-carbon-700 mt-8 pt-8 text-center text-sm text-crudo-400">
          <p>
            &copy; {new Date().getFullYear()} The Lobby Beauty. Todos los derechos
            reservados.
          </p>
          <p className="mt-2 flex items-center justify-center gap-1">
            <Leaf className="h-4 w-4 text-salvia-400" />
            <span>Productos 100% libres de TPO y DMPT</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
