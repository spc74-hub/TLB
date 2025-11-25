import { useState } from "react";
import { User, Mail, Phone, Loader2, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { actualizarPerfil } from "@/lib/supabase";

export function Perfil() {
  const { user, perfil, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: perfil?.nombre || "",
    apellidos: perfil?.apellidos || "",
    telefono: perfil?.telefono || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      await actualizarPerfil(user.id, formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-salvia-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-crudo-50 to-salvia-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-carbon-800 mb-8">
          Mi Perfil
        </h1>

        <div className="space-y-6">
          <Card className="border-crudo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-salvia-500" />
                Información personal
              </CardTitle>
              <CardDescription>
                Actualiza tus datos personales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-terracota-50 border border-terracota-200 rounded-lg text-terracota-700 text-sm">
                    {error}
                  </div>
                )}

                {saved && (
                  <div className="p-3 bg-salvia-50 border border-salvia-200 rounded-lg text-salvia-700 text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Cambios guardados correctamente
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="nombre" className="text-sm font-medium text-carbon-700">
                      Nombre
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                      <Input
                        id="nombre"
                        name="nombre"
                        type="text"
                        placeholder="Tu nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className="pl-10 border-crudo-300 focus:border-salvia-400"
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
                      placeholder="Tus apellidos"
                      value={formData.apellidos}
                      onChange={handleChange}
                      className="border-crudo-300 focus:border-salvia-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-carbon-700">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="pl-10 border-crudo-300 bg-crudo-100 text-carbon-500"
                    />
                  </div>
                  <p className="text-xs text-carbon-500">
                    El email no se puede cambiar
                  </p>
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

                <Button
                  type="submit"
                  className="w-full sm:w-auto bg-salvia-500 hover:bg-salvia-600"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar cambios
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
