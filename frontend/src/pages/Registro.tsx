import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Leaf, Mail, Lock, User, Phone, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

export function Registro() {
  const navigate = useNavigate();
  const { registro, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setValidationError(null);

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setValidationError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setValidationError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      await registro({
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        telefono: formData.telefono,
      });
      setRegistroExitoso(true);
    } catch {
      // Error ya manejado en el contexto
    }
  };

  if (registroExitoso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-crudo-50 to-salvia-50 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-crudo-200 shadow-lg">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto w-16 h-16 bg-salvia-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-salvia-600" />
            </div>
            <h2 className="font-display text-2xl font-bold text-carbon-800 mb-2">
              ¡Registro exitoso!
            </h2>
            <p className="text-carbon-600 mb-6">
              Hemos enviado un email de confirmación a <strong>{formData.email}</strong>.
              Por favor, revisa tu bandeja de entrada y confirma tu cuenta.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/login")}
                className="w-full bg-salvia-500 hover:bg-salvia-600"
              >
                Ir a iniciar sesión
              </Button>
              <p className="text-sm text-carbon-500">
                ¿No recibiste el email?{" "}
                <button className="text-salvia-600 hover:text-salvia-700 font-medium">
                  Reenviar confirmación
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            Crear cuenta
          </h1>
          <p className="text-carbon-500 text-sm mt-1">
            Únete para disfrutar de reservas y compras exclusivas
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || validationError) && (
              <div className="p-3 bg-terracota-50 border border-terracota-200 rounded-lg text-terracota-700 text-sm">
                {error || validationError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="nombre" className="text-sm font-medium text-carbon-700">
                  Nombre *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                  <Input
                    id="nombre"
                    name="nombre"
                    type="text"
                    placeholder="María"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="pl-10 border-crudo-300 focus:border-salvia-400"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="apellidos" className="text-sm font-medium text-carbon-700">
                  Apellidos
                </label>
                <Input
                  id="apellidos"
                  name="apellidos"
                  type="text"
                  placeholder="García"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className="border-crudo-300 focus:border-salvia-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-carbon-700">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 border-crudo-300 focus:border-salvia-400"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="telefono" className="text-sm font-medium text-carbon-700">
                Teléfono
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  placeholder="612 345 678"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="pl-10 border-crudo-300 focus:border-salvia-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-carbon-700">
                Contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10 border-crudo-300 focus:border-salvia-400"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-carbon-400 hover:text-carbon-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-carbon-700">
                Confirmar contraseña *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 border-crudo-300 focus:border-salvia-400"
                  required
                  autoComplete="new-password"
                />
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
                  Creando cuenta...
                </>
              ) : (
                "Crear cuenta"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-carbon-500">
              ¿Ya tienes cuenta?{" "}
              <Link
                to="/login"
                className="text-salvia-600 hover:text-salvia-700 font-medium"
              >
                Inicia sesión
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-crudo-200">
            <p className="text-xs text-carbon-400 text-center">
              Al registrarte, aceptas nuestros{" "}
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
