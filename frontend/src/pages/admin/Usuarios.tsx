import { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  Loader2,
  UserPlus,
  Search,
  Shield,
  User,
  Briefcase,
  Key,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface Usuario {
  id: string;
  email: string;
  nombre: string | null;
  apellidos: string | null;
  telefono: string | null;
  rol: string;
  created_at: string | null;
}

const ROLES = [
  { value: "admin", label: "Administrador", icon: Shield, color: "bg-red-100 text-red-800" },
  { value: "profesional", label: "Profesional", icon: Briefcase, color: "bg-blue-100 text-blue-800" },
  { value: "cliente", label: "Cliente", icon: User, color: "bg-gray-100 text-gray-800" },
];

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<string>("todos");

  // Modal estados
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<Usuario | null>(null);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [usuarioPassword, setUsuarioPassword] = useState<Usuario | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nombre: "",
    apellidos: "",
    telefono: "",
    rol: "cliente",
  });

  useEffect(() => {
    cargarUsuarios();
  }, [pagina, filtroRol]);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        pagina: pagina.toString(),
        por_pagina: "20",
      });

      if (busqueda) params.append("busqueda", busqueda);
      if (filtroRol && filtroRol !== "todos") params.append("rol", filtroRol);

      const response = await fetch(`${API_URL}/usuarios/?${params}`);
      if (!response.ok) throw new Error("Error al cargar usuarios");

      const data = await response.json();
      setUsuarios(data.usuarios);
      setTotal(data.total);
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = () => {
    setPagina(1);
    cargarUsuarios();
  };

  const abrirModalNuevo = () => {
    setUsuarioEditando(null);
    setFormData({
      email: "",
      password: "",
      nombre: "",
      apellidos: "",
      telefono: "",
      rol: "cliente",
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setFormData({
      email: usuario.email,
      password: "",
      nombre: usuario.nombre || "",
      apellidos: usuario.apellidos || "",
      telefono: usuario.telefono || "",
      rol: usuario.rol,
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setUsuarioEditando(null);
  };

  const guardarUsuario = async () => {
    try {
      setGuardando(true);

      if (usuarioEditando) {
        // Actualizar usuario existente
        const response = await fetch(`${API_URL}/usuarios/${usuarioEditando.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: formData.nombre || null,
            apellidos: formData.apellidos || null,
            telefono: formData.telefono || null,
            rol: formData.rol,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || "Error al actualizar usuario");
        }
      } else {
        // Crear nuevo usuario
        if (!formData.password) {
          alert("La contraseña es obligatoria para crear un usuario");
          return;
        }

        const response = await fetch(`${API_URL}/usuarios/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.detail || "Error al crear usuario");
        }
      }

      cerrarModal();
      cargarUsuarios();
    } catch (error) {
      console.error("Error guardando usuario:", error);
      alert(error instanceof Error ? error.message : "Error al guardar usuario");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarUsuario = async () => {
    if (!confirmandoEliminar) return;

    try {
      const response = await fetch(`${API_URL}/usuarios/${confirmandoEliminar.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al eliminar usuario");
      }

      setConfirmandoEliminar(null);
      cargarUsuarios();
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      alert(error instanceof Error ? error.message : "Error al eliminar usuario");
    }
  };

  const resetearPassword = async () => {
    if (!usuarioPassword || !newPassword) return;

    try {
      const response = await fetch(
        `${API_URL}/usuarios/${usuarioPassword.id}/reset-password?new_password=${encodeURIComponent(newPassword)}`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Error al resetear contraseña");
      }

      alert("Contraseña actualizada correctamente");
      setModalPasswordAbierto(false);
      setUsuarioPassword(null);
      setNewPassword("");
    } catch (error) {
      console.error("Error reseteando contraseña:", error);
      alert(error instanceof Error ? error.message : "Error al resetear contraseña");
    }
  };

  const getRolBadge = (rol: string) => {
    const rolInfo = ROLES.find((r) => r.value === rol) || ROLES[2];
    return (
      <Badge className={`${rolInfo.color} font-medium`}>
        <rolInfo.icon className="w-3 h-3 mr-1" />
        {rolInfo.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-carbon-800">
            Gestión de Usuarios
          </h1>
          <p className="text-carbon-500 mt-1">
            Administra los usuarios del sistema y sus roles
          </p>
        </div>
        <Button onClick={abrirModalNuevo} className="bg-salvia-500 hover:bg-salvia-600">
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-salvia-100 rounded-lg">
                <User className="w-5 h-5 text-salvia-600" />
              </div>
              <div>
                <p className="text-sm text-carbon-500">Total Usuarios</p>
                <p className="text-xl font-bold text-carbon-800">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-carbon-500">Administradores</p>
                <p className="text-xl font-bold text-carbon-800">
                  {usuarios.filter((u) => u.rol === "admin").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-carbon-500">Profesionales</p>
                <p className="text-xl font-bold text-carbon-800">
                  {usuarios.filter((u) => u.rol === "profesional").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-carbon-500">Clientes</p>
                <p className="text-xl font-bold text-carbon-800">
                  {usuarios.filter((u) => u.rol === "cliente").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Buscar</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Email o nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
                />
                <Button variant="outline" onClick={handleBuscar}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="w-[200px]">
              <Label>Rol</Label>
              <Select value={filtroRol} onValueChange={setFiltroRol}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todos los roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los roles</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="profesional">Profesional</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={cargarUsuarios}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de usuarios */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-salvia-500" />
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-12 text-carbon-500">
              No se encontraron usuarios
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="font-medium text-carbon-800">
                        {usuario.nombre || "-"} {usuario.apellidos || ""}
                      </div>
                    </TableCell>
                    <TableCell className="text-carbon-600">{usuario.email}</TableCell>
                    <TableCell className="text-carbon-600">
                      {usuario.telefono || "-"}
                    </TableCell>
                    <TableCell>{getRolBadge(usuario.rol)}</TableCell>
                    <TableCell className="text-carbon-500">
                      {formatDate(usuario.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUsuarioPassword(usuario);
                            setNewPassword("");
                            setModalPasswordAbierto(true);
                          }}
                          title="Cambiar contraseña"
                        >
                          <Key className="w-4 h-4 text-amber-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirModalEditar(usuario)}
                        >
                          <Pencil className="w-4 h-4 text-salvia-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmandoEliminar(usuario)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal Crear/Editar Usuario */}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {usuarioEditando ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!usuarioEditando}
                placeholder="correo@ejemplo.com"
              />
            </div>

            {!usuarioEditando && (
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  placeholder="Apellidos"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+34 600 000 000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <Select
                value={formData.rol}
                onValueChange={(value) => setFormData({ ...formData, rol: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((rol) => (
                    <SelectItem key={rol.value} value={rol.value}>
                      <div className="flex items-center gap-2">
                        <rol.icon className="w-4 h-4" />
                        {rol.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={cerrarModal}>
              Cancelar
            </Button>
            <Button
              onClick={guardarUsuario}
              disabled={guardando || !formData.email}
              className="bg-salvia-500 hover:bg-salvia-600"
            >
              {guardando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {usuarioEditando ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Reset Password */}
      <Dialog open={modalPasswordAbierto} onOpenChange={setModalPasswordAbierto}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-carbon-600">
              Establecer nueva contraseña para: <strong>{usuarioPassword?.email}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPasswordAbierto(false)}>
              Cancelar
            </Button>
            <Button
              onClick={resetearPassword}
              disabled={newPassword.length < 6}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Cambiar Contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación eliminar */}
      <AlertDialog
        open={!!confirmandoEliminar}
        onOpenChange={() => setConfirmandoEliminar(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente al usuario{" "}
              <strong>{confirmandoEliminar?.email}</strong> y todos sus datos asociados.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={eliminarUsuario}
              className="bg-red-500 hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
