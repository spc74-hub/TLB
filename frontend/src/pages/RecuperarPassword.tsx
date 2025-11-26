import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Leaf, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { recuperarPassword } from "@/lib/supabase";

export function RecuperarPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await recuperarPassword(email);
      setEnviado(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el email");
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
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
          </CardHeader>
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-salvia-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-salvia-600" />
            </div>
            <h1 className="font-display text-2xl font-bold text-carbon-800 mb-2">
              Email enviado
            </h1>
            <p className="text-carbon-500 mb-6">
              Hemos enviado un enlace de recuperacion a <strong>{email}</strong>.
              Revisa tu bandeja de entrada y sigue las instrucciones.
            </p>
            <p className="text-sm text-carbon-400 mb-6">
              Si no recibes el email en unos minutos, revisa tu carpeta de spam.
            </p>
            <Button asChild className="bg-salvia-500 hover:bg-salvia-600">
              <Link to="/login">Volver al inicio de sesion</Link>
            </Button>
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
            Recuperar contrasena
          </h1>
          <p className="text-carbon-500 text-sm mt-1">
            Introduce tu email y te enviaremos un enlace para restablecer tu contrasena
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

            <Button
              type="submit"
              className="w-full bg-salvia-500 hover:bg-salvia-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar enlace de recuperacion"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-salvia-600 hover:text-salvia-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesion
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
