import { useState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  Loader2,
  Scissors,
  Search,
  Eye,
  EyeOff,
  Clock,
  Euro,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  getAllServicios,
  crearServicio,
  actualizarServicio,
  type Servicio,
  type CategoriaServicio,
} from "@/lib/supabase";

const CATEGORIAS: { valor: CategoriaServicio; nombre: string }[] = [
  { valor: "manicura", nombre: "Manicura" },
  { valor: "pedicura", nombre: "Pedicura" },
  { valor: "depilacion", nombre: "Depilación" },
  { valor: "cejas", nombre: "Cejas" },
  { valor: "pestanas", nombre: "Pestañas" },
];

const DURACIONES = [15, 30, 45, 60, 75, 90, 120];

export function Servicios() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [servicioEditando, setServicioEditando] = useState<Servicio | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<Servicio | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    categoria: "manicura" as CategoriaServicio,
    duracion_minutos: 30,
    precio: "",
    precio_oferta: "",
    es_libre_toxicos: true,
    es_interno: false,
    activo: true,
    destacado: false,
  });

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      setLoading(true);
      const data = await getAllServicios();
      setServicios(data);
    } catch (error) {
      console.error("Error cargando servicios:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNuevo = () => {
    setServicioEditando(null);
    setFormData({
      nombre: "",
      descripcion: "",
      categoria: "manicura",
      duracion_minutos: 30,
      precio: "",
      precio_oferta: "",
      es_libre_toxicos: true,
      es_interno: false,
      activo: true,
      destacado: false,
    });
    setModalAbierto(true);
  };

  const abrirModalEditar = (servicio: Servicio) => {
    setServicioEditando(servicio);
    setFormData({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion || "",
      categoria: servicio.categoria,
      duracion_minutos: servicio.duracion_minutos,
      precio: servicio.precio.toString(),
      precio_oferta: servicio.precio_oferta?.toString() || "",
      es_libre_toxicos: servicio.es_libre_toxicos,
      es_interno: servicio.es_interno,
      activo: servicio.activo,
      destacado: servicio.destacado,
    });
    setModalAbierto(true);
  };

  const guardarServicio = async () => {
    if (!formData.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    const precio = parseFloat(formData.precio);
    if (isNaN(precio) || precio <= 0) {
      alert("El precio debe ser un número válido mayor que 0");
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        categoria: formData.categoria,
        duracion_minutos: formData.duracion_minutos,
        precio: precio,
        precio_oferta: formData.precio_oferta ? parseFloat(formData.precio_oferta) : null,
        es_libre_toxicos: formData.es_libre_toxicos,
        es_interno: formData.es_interno,
        activo: formData.activo,
        destacado: formData.destacado,
        imagen_url: null,
      };

      if (servicioEditando) {
        await actualizarServicio(servicioEditando.id, datos);
      } else {
        await crearServicio(datos);
      }

      setModalAbierto(false);
      cargarServicios();
    } catch (error) {
      console.error("Error guardando servicio:", error);
      alert("Error al guardar el servicio");
    } finally {
      setGuardando(false);
    }
  };

  const desactivarServicio = async (servicio: Servicio) => {
    try {
      await actualizarServicio(servicio.id, { activo: false });
      cargarServicios();
      setConfirmandoEliminar(null);
    } catch (error) {
      console.error("Error desactivando servicio:", error);
      alert("Error al desactivar el servicio");
    }
  };

  const reactivarServicio = async (servicio: Servicio) => {
    try {
      await actualizarServicio(servicio.id, { activo: true });
      cargarServicios();
    } catch (error) {
      console.error("Error reactivando servicio:", error);
    }
  };

  const serviciosFiltrados = servicios.filter((serv) => {
    const textoMatch = `${serv.nombre} ${serv.descripcion || ""}`.toLowerCase().includes(busqueda.toLowerCase());
    const categoriaMatch = filtroCategoria === "todas" || serv.categoria === filtroCategoria;
    return textoMatch && categoriaMatch;
  });

  const getNombreCategoria = (cat: CategoriaServicio) => {
    return CATEGORIAS.find((c) => c.valor === cat)?.nombre || cat;
  };

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
            Servicios
          </h1>
          <p className="text-carbon-600">
            Gestiona los servicios del centro
          </p>
        </div>
        <Button
          onClick={abrirModalNuevo}
          className="bg-salvia-500 hover:bg-salvia-600"
        >
          <Scissors className="h-4 w-4 mr-2" />
          Nuevo servicio
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
              <Input
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {CATEGORIAS.map((cat) => (
                  <SelectItem key={cat.valor} value={cat.valor}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de servicios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {serviciosFiltrados.length} servicio{serviciosFiltrados.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serviciosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-carbon-500">
              <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay servicios registrados</p>
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
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviciosFiltrados.map((servicio) => (
                    <TableRow key={servicio.id} className={!servicio.activo ? "opacity-50" : ""}>
                      <TableCell className="font-medium">
                        <div>
                          {servicio.nombre}
                          {servicio.destacado && (
                            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                              Destacado
                            </span>
                          )}
                        </div>
                        {servicio.descripcion && (
                          <p className="text-xs text-carbon-500 truncate max-w-[200px]">
                            {servicio.descripcion}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{getNombreCategoria(servicio.categoria)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-carbon-600">
                          <Clock className="h-3.5 w-3.5" />
                          {servicio.duracion_minutos} min
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Euro className="h-3.5 w-3.5" />
                          {servicio.precio_oferta ? (
                            <>
                              <span className="line-through text-carbon-400">
                                {servicio.precio}
                              </span>
                              <span className="text-terracota-600 font-medium">
                                {servicio.precio_oferta}
                              </span>
                            </>
                          ) : (
                            <span>{servicio.precio}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {servicio.es_interno ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <EyeOff className="h-3 w-3" />
                            Interno
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Eye className="h-3 w-3" />
                            Público
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            servicio.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-carbon-100 text-carbon-600"
                          }`}
                        >
                          {servicio.activo ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirModalEditar(servicio)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {servicio.activo ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmandoEliminar(servicio)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => reactivarServicio(servicio)}
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
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {servicioEditando ? "Editar servicio" : "Nuevo servicio"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">
                Nombre <span className="text-terracota-500">*</span>
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Manicura clásica"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción del servicio..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value as CategoriaServicio })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((cat) => (
                      <SelectItem key={cat.valor} value={cat.valor}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duracion">Duración</Label>
                <Select
                  value={formData.duracion_minutos.toString()}
                  onValueChange={(value) => setFormData({ ...formData, duracion_minutos: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURACIONES.map((dur) => (
                      <SelectItem key={dur} value={dur.toString()}>
                        {dur} minutos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="precio">
                  Precio (€) <span className="text-terracota-500">*</span>
                </Label>
                <Input
                  id="precio"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="precio_oferta">Precio oferta (€)</Label>
                <Input
                  id="precio_oferta"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_oferta}
                  onChange={(e) => setFormData({ ...formData, precio_oferta: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium text-carbon-700 mb-3">Opciones</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="es_interno" className="cursor-pointer">
                      Servicio interno
                    </Label>
                    <p className="text-xs text-carbon-500">
                      Solo visible en la agenda, no en la web pública
                    </p>
                  </div>
                  <Switch
                    id="es_interno"
                    checked={formData.es_interno}
                    onCheckedChange={(checked) => setFormData({ ...formData, es_interno: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="es_libre_toxicos" className="cursor-pointer">
                      Libre de tóxicos
                    </Label>
                    <p className="text-xs text-carbon-500">
                      Indicar si usa productos libre de tóxicos
                    </p>
                  </div>
                  <Switch
                    id="es_libre_toxicos"
                    checked={formData.es_libre_toxicos}
                    onCheckedChange={(checked) => setFormData({ ...formData, es_libre_toxicos: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="destacado" className="cursor-pointer">
                      Destacado
                    </Label>
                    <p className="text-xs text-carbon-500">
                      Mostrar en sección de destacados
                    </p>
                  </div>
                  <Switch
                    id="destacado"
                    checked={formData.destacado}
                    onCheckedChange={(checked) => setFormData({ ...formData, destacado: checked })}
                  />
                </div>

                {servicioEditando && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="activo" className="cursor-pointer">
                        Activo
                      </Label>
                      <p className="text-xs text-carbon-500">
                        Los servicios inactivos no aparecen en ningún lugar
                      </p>
                    </div>
                    <Switch
                      id="activo"
                      checked={formData.activo}
                      onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setModalAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={guardarServicio}
              disabled={guardando}
              className="bg-salvia-500 hover:bg-salvia-600"
            >
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : servicioEditando ? (
                "Guardar cambios"
              ) : (
                "Crear servicio"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={!!confirmandoEliminar} onOpenChange={() => setConfirmandoEliminar(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>¿Desactivar servicio?</DialogTitle>
          </DialogHeader>
          <p className="text-carbon-600">
            El servicio <strong>{confirmandoEliminar?.nombre}</strong> será
            desactivado y no aparecerá en la web ni en la agenda. Podrás reactivarlo en cualquier momento.
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
              onClick={() => confirmandoEliminar && desactivarServicio(confirmandoEliminar)}
            >
              Desactivar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
