import { useState, useEffect, useRef } from "react";
import {
  Pencil,
  Trash2,
  Loader2,
  Package,
  Search,
  Euro,
  Leaf,
  Heart,
  Upload,
  X,
  ImageIcon,
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
  getAllProductos,
  crearProducto,
  actualizarProducto,
  subirImagenProducto,
  type Producto,
  type CategoriaProducto,
} from '@/lib/api';

const CATEGORIAS: { valor: CategoriaProducto; nombre: string }[] = [
  { valor: "manicura", nombre: "Manicura" },
  { valor: "pedicura", nombre: "Pedicura" },
  { valor: "facial", nombre: "Facial" },
  { valor: "corporal", nombre: "Corporal" },
  { valor: "cabello", nombre: "Cabello" },
  { valor: "accesorios", nombre: "Accesorios" },
  { valor: "kits", nombre: "Kits" },
];

export function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<Producto | null>(null);

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    descripcion_corta: "",
    categoria: "manicura" as CategoriaProducto,
    precio: "",
    precio_oferta: "",
    stock: "0",
    es_natural: true,
    es_vegano: false,
    es_cruelty_free: true,
    activo: true,
    destacado: false,
  });

  // Estado para imagen
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const data = await getAllProductos();
      setProductos(data);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalNuevo = () => {
    setProductoEditando(null);
    setFormData({
      nombre: "",
      descripcion: "",
      descripcion_corta: "",
      categoria: "manicura",
      precio: "",
      precio_oferta: "",
      stock: "0",
      es_natural: true,
      es_vegano: false,
      es_cruelty_free: true,
      activo: true,
      destacado: false,
    });
    setImagenFile(null);
    setImagenPreview(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (producto: Producto) => {
    setProductoEditando(producto);
    setFormData({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      descripcion_corta: producto.descripcion_corta,
      categoria: producto.categoria,
      precio: producto.precio.toString(),
      precio_oferta: producto.precio_oferta?.toString() || "",
      stock: producto.stock.toString(),
      es_natural: producto.es_natural,
      es_vegano: producto.es_vegano,
      es_cruelty_free: producto.es_cruelty_free,
      activo: producto.activo,
      destacado: producto.destacado,
    });
    setImagenFile(null);
    setImagenPreview(producto.imagen_url || null);
    setModalAbierto(true);
  };

  const guardarProducto = async () => {
    if (!formData.nombre.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    if (!formData.descripcion_corta.trim()) {
      alert("La descripción corta es obligatoria");
      return;
    }

    if (!formData.descripcion.trim()) {
      alert("La descripción es obligatoria");
      return;
    }

    const precio = parseFloat(formData.precio);
    if (isNaN(precio) || precio <= 0) {
      alert("El precio debe ser un número válido mayor que 0");
      return;
    }

    try {
      setGuardando(true);

      // Mantener imagen existente si no se sube una nueva
      let imagenUrl = productoEditando?.imagen_url || null;

      const datos = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
        descripcion_corta: formData.descripcion_corta.trim(),
        categoria: formData.categoria,
        precio: precio,
        precio_oferta: formData.precio_oferta ? parseFloat(formData.precio_oferta) : null,
        stock: parseInt(formData.stock) || 0,
        es_natural: formData.es_natural,
        es_vegano: formData.es_vegano,
        es_cruelty_free: formData.es_cruelty_free,
        activo: formData.activo,
        destacado: formData.destacado,
        imagen_url: imagenUrl,
        imagenes_extra: null,
        ingredientes: null,
        modo_uso: null,
      };

      let productoId: number;

      if (productoEditando) {
        await actualizarProducto(productoEditando.id, datos);
        productoId = productoEditando.id;
      } else {
        const nuevoProducto = await crearProducto(datos);
        productoId = nuevoProducto.id;
      }

      // Subir imagen si hay una nueva seleccionada
      if (imagenFile) {
        setSubiendoImagen(true);
        try {
          const nuevaImagenUrl = await subirImagenProducto(imagenFile, productoId);
          await actualizarProducto(productoId, { imagen_url: nuevaImagenUrl });
        } catch (imgError) {
          console.error("Error subiendo imagen:", imgError);
          alert("Producto guardado, pero hubo un error al subir la imagen");
        } finally {
          setSubiendoImagen(false);
        }
      }

      setModalAbierto(false);
      cargarProductos();
    } catch (error) {
      console.error("Error guardando producto:", error);
      alert("Error al guardar el producto");
    } finally {
      setGuardando(false);
    }
  };

  // Handler para selección de imagen
  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo
      if (!file.type.startsWith("image/")) {
        alert("Solo se permiten archivos de imagen");
        return;
      }
      // Validar tamaño (5MB máx)
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen no puede superar los 5MB");
        return;
      }
      setImagenFile(file);
      setImagenPreview(URL.createObjectURL(file));
    }
  };

  const quitarImagen = () => {
    setImagenFile(null);
    setImagenPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const desactivarProducto = async (producto: Producto) => {
    try {
      await actualizarProducto(producto.id, { activo: false });
      cargarProductos();
      setConfirmandoEliminar(null);
    } catch (error) {
      console.error("Error desactivando producto:", error);
      alert("Error al desactivar el producto");
    }
  };

  const reactivarProducto = async (producto: Producto) => {
    try {
      await actualizarProducto(producto.id, { activo: true });
      cargarProductos();
    } catch (error) {
      console.error("Error reactivando producto:", error);
    }
  };

  const productosFiltrados = productos.filter((prod) => {
    const textoMatch = `${prod.nombre} ${prod.descripcion_corta}`.toLowerCase().includes(busqueda.toLowerCase());
    const categoriaMatch = filtroCategoria === "todas" || prod.categoria === filtroCategoria;
    return textoMatch && categoriaMatch;
  });

  const getNombreCategoria = (cat: CategoriaProducto) => {
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
            Productos
          </h1>
          <p className="text-carbon-600">
            Gestiona el catálogo de productos de la tienda
          </p>
        </div>
        <Button
          onClick={abrirModalNuevo}
          className="bg-salvia-500 hover:bg-salvia-600"
        >
          <Package className="h-4 w-4 mr-2" />
          Nuevo producto
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

      {/* Tabla de productos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {productosFiltrados.length} producto{productosFiltrados.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-carbon-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay productos registrados</p>
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
                    <TableHead>Precio</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Características</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productosFiltrados.map((producto) => (
                    <TableRow key={producto.id} className={!producto.activo ? "opacity-50" : ""}>
                      <TableCell className="font-medium">
                        <div>
                          {producto.nombre}
                          {producto.destacado && (
                            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                              Destacado
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-carbon-500 truncate max-w-[200px]">
                          {producto.descripcion_corta}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{getNombreCategoria(producto.categoria)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Euro className="h-3.5 w-3.5" />
                          {producto.precio_oferta ? (
                            <>
                              <span className="line-through text-carbon-400">
                                {producto.precio}
                              </span>
                              <span className="text-terracota-600 font-medium">
                                {producto.precio_oferta}
                              </span>
                            </>
                          ) : (
                            <span>{producto.precio}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${producto.stock <= 5 ? "text-red-600" : "text-carbon-700"}`}>
                          {producto.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {producto.es_natural && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700" title="Natural">
                              <Leaf className="h-3 w-3" />
                            </span>
                          )}
                          {producto.es_vegano && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700" title="Vegano">
                              V
                            </span>
                          )}
                          {producto.es_cruelty_free && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-pink-100 text-pink-700" title="Cruelty Free">
                              <Heart className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            producto.activo
                              ? "bg-green-100 text-green-800"
                              : "bg-carbon-100 text-carbon-600"
                          }`}
                        >
                          {producto.activo ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => abrirModalEditar(producto)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {producto.activo ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmandoEliminar(producto)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => reactivarProducto(producto)}
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {productoEditando ? "Editar producto" : "Nuevo producto"}
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
                placeholder="Ej: Esmalte natural rosa"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descripcion_corta">
                Descripción corta <span className="text-terracota-500">*</span>
              </Label>
              <Input
                id="descripcion_corta"
                value={formData.descripcion_corta}
                onChange={(e) => setFormData({ ...formData, descripcion_corta: e.target.value })}
                placeholder="Breve descripción para listados"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descripcion">
                Descripción completa <span className="text-terracota-500">*</span>
              </Label>
              <textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción detallada del producto..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Sección de imagen */}
            <div className="grid gap-2">
              <Label>Imagen del producto</Label>
              <div className="border-2 border-dashed border-crudo-300 rounded-lg p-4">
                {imagenPreview ? (
                  <div className="relative">
                    <img
                      src={imagenPreview}
                      alt="Vista previa"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={quitarImagen}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {imagenFile && (
                      <p className="text-xs text-carbon-500 mt-2 text-center">
                        Nueva imagen: {imagenFile.name}
                      </p>
                    )}
                  </div>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center py-6 cursor-pointer hover:bg-crudo-50 rounded-lg transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="h-12 w-12 text-carbon-300 mb-2" />
                    <p className="text-sm text-carbon-600 mb-1">
                      Haz clic para subir una imagen
                    </p>
                    <p className="text-xs text-carbon-400">
                      JPG, PNG, WebP o GIF (máx. 5MB)
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImagenChange}
                  className="hidden"
                />
                {!imagenPreview && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar imagen
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value as CategoriaProducto })}
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
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
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
              <p className="text-sm font-medium text-carbon-700 mb-3">Características</p>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="es_natural" className="cursor-pointer">
                      Natural
                    </Label>
                    <p className="text-xs text-carbon-500">
                      Producto con ingredientes naturales
                    </p>
                  </div>
                  <Switch
                    id="es_natural"
                    checked={formData.es_natural}
                    onCheckedChange={(checked) => setFormData({ ...formData, es_natural: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="es_vegano" className="cursor-pointer">
                      Vegano
                    </Label>
                    <p className="text-xs text-carbon-500">
                      Sin ingredientes de origen animal
                    </p>
                  </div>
                  <Switch
                    id="es_vegano"
                    checked={formData.es_vegano}
                    onCheckedChange={(checked) => setFormData({ ...formData, es_vegano: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="es_cruelty_free" className="cursor-pointer">
                      Cruelty Free
                    </Label>
                    <p className="text-xs text-carbon-500">
                      No testado en animales
                    </p>
                  </div>
                  <Switch
                    id="es_cruelty_free"
                    checked={formData.es_cruelty_free}
                    onCheckedChange={(checked) => setFormData({ ...formData, es_cruelty_free: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-2">
              <p className="text-sm font-medium text-carbon-700 mb-3">Opciones de visibilidad</p>

              <div className="space-y-4">
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

                {productoEditando && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="activo" className="cursor-pointer">
                        Activo
                      </Label>
                      <p className="text-xs text-carbon-500">
                        Los productos inactivos no aparecen en la tienda
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
              onClick={guardarProducto}
              disabled={guardando || subiendoImagen}
              className="bg-salvia-500 hover:bg-salvia-600"
            >
              {guardando || subiendoImagen ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {subiendoImagen ? "Subiendo imagen..." : "Guardando..."}
                </>
              ) : productoEditando ? (
                "Guardar cambios"
              ) : (
                "Crear producto"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <Dialog open={!!confirmandoEliminar} onOpenChange={() => setConfirmandoEliminar(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>¿Desactivar producto?</DialogTitle>
          </DialogHeader>
          <p className="text-carbon-600">
            El producto <strong>{confirmandoEliminar?.nombre}</strong> será
            desactivado y no aparecerá en la tienda. Podrás reactivarlo en cualquier momento.
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
              onClick={() => confirmandoEliminar && desactivarProducto(confirmandoEliminar)}
            >
              Desactivar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
