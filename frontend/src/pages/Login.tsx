import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Loader2, Leaf, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, error, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Obtener la URL de redirección si existe
  const from = (location.state as { from?: string })?.from || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch {
      // Error ya manejado en el contexto
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-crudo-50 to-salvia-50 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-crudo-200 shadow-lg">
        <CardHeader className="text-center pb-2">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-salvia-100 rounded-full">
              <Leaf className="h-6 w-6 text-salvia-600" />
            </div>
            <span className="font-display text-xl font-bold text-carbon-800">
              The Lobby Beauty
            </span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-carbon-800">
            Iniciar sesión
          </h1>
          <p className="text-carbon-500 text-sm mt-1">
            Accede a tu cuenta para gestionar tus reservas y pedidos
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-terracota-50 border border-terracota-200 rounded-lg text-terracota-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-carbon-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-crudo-300 focus:border-salvia-400"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-carbon-700">
                  Contraseña
                </label>
                <Link
                  to="/recuperar-password"
                  className="text-xs text-salvia-600 hover:text-salvia-700"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 border-crudo-300 focus:border-salvia-400"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-carbon-400 hover:text-carbon-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-salvia-500 hover:bg-salvia-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-carbon-500">
              ¿No tienes cuenta?{" "}
              <Link
                to="/registro"
                className="text-salvia-600 hover:text-salvia-700 font-medium"
              >
                Regístrate gratis
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-crudo-200">
            <p className="text-xs text-carbon-400 text-center">
              Al iniciar sesión, aceptas nuestros{" "}
              <Link to="/terminos" className="underline hover:text-carbon-600">
                Términos de servicio
              </Link>{" "}
              y{" "}
              <Link to="/privacidad" className="underline hover:text-carbon-600">
                Política de privacidad
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
