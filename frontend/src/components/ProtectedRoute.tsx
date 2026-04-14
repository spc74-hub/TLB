import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import type { RolUsuario } from '@/lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: RolUsuario[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, perfil, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-salvia-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar rol si se especifica
  if (roles && roles.length > 0 && perfil) {
    if (!roles.includes(perfil.rol)) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center bg-crudo-50">
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold text-terracota-500 mb-4">
              Acceso denegado
            </h1>
            <p className="text-carbon-600 mb-6">
              No tienes permisos para acceder a esta página.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-salvia-500 text-white rounded-lg hover:bg-salvia-600 transition-colors"
            >
              Volver al inicio
            </a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
