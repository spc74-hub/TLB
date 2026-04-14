import { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  Loader2,
  UserPlus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getEmpleados,
  crearEmpleado,
  actualizarEmpleado,
  type Empleado,
} from '@/lib/api';

const COLORES_DISPONIBLES = [
  { nombre: "Salvia", valor: "#8B9D83" },
  { nombre: "Terracota", valor: "#C4A484" },
  { nombre: "Rosa", valor: "#D4A5A5" },
  { nombre: "Lavanda", valor: "#9B8AA5" },
  { nombre: "Azul", valor: "#7BA3A8" },
  { nombre: "Coral", valor: "#E8998D" },
  { nombre: "Menta", valor: "#98C1B9" },
  { nombre: "Dorado", valor: "#C9A959" },
];

export function Empleados() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState<Empleado | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<Empleado | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    telefono: "",
    color: "#8B9D83",
    activo: true,
  });

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      const data = await getEmpleados();
      setEmpleados(data);
    } catch (error) {
      console.error("Error cargando empleados:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNuevo = () => {
    setEmpleadoEditando(null);
    setFormData({
      nombre: "",
      apellidos: "",
      email: "",
      telefono: "",
      color: "#8B9D83",
      activo: true,
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (empleado: Empleado) => {
    setEmpleadoEditando(empleado);
    setFormData({
      nombre: empleado.nombre,
      apellidos: empleado.apellidos || "",
      email: empleado.email || "",
      telefono: empleado.telefono || "",
      color: empleado.color,
      activo: empleado.activo,
    });
    setModalAbierto(true);
  };

  const guardarEmpleado = async () => {
    if (!formData.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    try {
      setGuardando(true);

      if (empleadoEditando) {
        await actualizarEmpleado(empleadoEditando.id, {
          nombre: formData.nombre.trim(),
          apellidos: formData.apellidos.trim() || null,
          email: formData.email.trim() || null,
          telefono: formData.telefono.trim() || null,
          color: formData.color,
          activo: formData.activo,
        });
      } else {
        await crearEmpleado({
          nombre: formData.nombre.trim(),
          apellidos: formData.apellidos.trim() || null,
          email: formData.email.trim() || null,
          telefono: formData.telefono.trim() || null,
          color: formData.color,
          activo: formData.activo,
          usuario_id: null,
        });
      }

      setModalAbierto(false);
      cargarEmpleados();
    } catch (error) {
      console.error("Error guardando empleado:", error);
      alert("Error al guardar el empleado");
    } finally {
      setGuardando(false);
    }
  };

  const desactivarEmpleado = async (empleado: Empleado) => {
    try {
      await actualizarEmpleado(empleado.id, { activo: false });
      cargarEmpleados();
      setConfirmandoEliminar(null);
    } catch (error) {
      console.error("Error desactivando empleado:", error);
      alert("Error al desactivar el empleado");
    }
  };

  const reactivarEmpleado = async (empleado: Empleado) => {
    try {
      await actualizarEmpleado(empleado.id, { activo: true });
      cargarEmpleados();
    } catch (error) {
      console.error("Error reactivando empleado:", error);
    }
  };

  const empleadosFiltrados = empleados.filter((emp) => {
    const texto = `${emp.nombre} ${emp.apellidos || ""} ${emp.email || ""}`.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-salvia-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-carbon-800">
            Empleados
          </h1>
          <p className="text-carbon-600">
            Gestiona el equipo de profesionales
          </p>
        </div>
        <Button
          onClick={abrirModalNuevo}
          className="bg-salvia-500 hover:bg-salvia-600"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo empleado
        </Button>
      </div>

      {/* Búsqueda */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
            <Input
              placeholder="Buscar por nombre, apellidos o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de empleados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {empleadosFiltrados.length} empleado{empleadosFiltrados.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {empleadosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-carbon-500">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay empleados registrados</p>
              <Button
                variant="link"
                onClick={abrirModalNuevo}
                className="mt-2"
              >
                Añadir el primero
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Color</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empleadosFiltrados.map((empleado) => (
                    <TableRow key={empleado.id} className={!empleado.activo ? "opacity-50" : ""}>
                      <TableCell>
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white shadow"
                          style={{ backgroundColor: empleado.color }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {empleado.nombre} {empleado.apellidos}
                      </TableCell>
                      <TableCell>{empleado.email || "-"}</TableCell>
                      <TableCell>{empleado.telefono || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            empleado.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-carbon-100 text-carbon-600"
                          }`}
                        >
                          {empleado.activo ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirModalEditar(empleado)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {empleado.activo ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmandoEliminar(empleado)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => reactivarEmpleado(empleado)}
                              className="text-green-600"
                            >
                              Reactivar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de crear/editar */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {empleadoEditando ? "Editar empleado" : "Nuevo empleado"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">
                  Nombre <span className="text-terracota-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                  placeholder="Nombre"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos}
                  onChange={(e) =>
                    setFormData({ ...formData, apellidos: e.target.value })
                  }
                  placeholder="Apellidos"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@ejemplo.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData({ ...formData, telefono: e.target.value })
                }
                placeholder="600 000 000"
              />
            </div>

            <div className="grid gap-2">
              <Label>Color en agenda</Label>
              <div className="flex flex-wrap gap-2">
                {COLORES_DISPONIBLES.map((color) => (
                  <button
                    key={color.valor}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.valor })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === color.valor
                        ? "border-carbon-800 scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.valor }}
                    title={color.nombre}
                  />
                ))}
              </div>
            </div>

            {empleadoEditando && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) =>
                    setFormData({ ...formData, activo: e.target.checked })
                  }
                  className="rounded border-carbon-300"
                />
                <Label htmlFor="activo" className="cursor-pointer">
                  Empleado activo
                </Label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setModalAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={guardarEmpleado}
              disabled={guardando}
              className="bg-salvia-500 hover:bg-salvia-600"
            >
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : empleadoEditando ? (
                "Guardar cambios"
              ) : (
                "Crear empleado"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={!!confirmandoEliminar} onOpenChange={() => setConfirmandoEliminar(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>¿Desactivar empleado?</DialogTitle>
          </DialogHeader>
          <p className="text-carbon-600">
            El empleado <strong>{confirmandoEliminar?.nombre} {confirmandoEliminar?.apellidos}</strong> será
            desactivado y no aparecerá en la agenda. Podrás reactivarlo en cualquier momento.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmandoEliminar(null)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmandoEliminar && desactivarEmpleado(confirmandoEliminar)}
            >
              Desactivar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
