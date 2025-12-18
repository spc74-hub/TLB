import { useState, useEffect } from "react";
import {
  Loader2,
  Receipt,
  Search,
  Plus,
  Calendar,
  Euro,
  TrendingDown,
  Building2,
  Tag,
  CheckCircle2,
  Clock,
  Edit,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// Tipos
interface CategoriaGasto {
  id: number;
  nombre: string;
  descripcion?: string;
  color: string;
  icono?: string;
  activa: boolean;
}

interface Proveedor {
  id: number;
  nombre: string;
  cif?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  notas?: string;
  activo: boolean;
}

interface Gasto {
  id: number;
  concepto: string;
  importe: number;
  fecha: string;
  categoria_id: number;
  proveedor_id?: number;
  numero_factura?: string;
  notas?: string;
  pagado: boolean;
  fecha_pago?: string;
  es_recurrente: boolean;
  frecuencia_recurrencia?: string;
  created_at: string;
  categoria?: CategoriaGasto;
  proveedor?: Proveedor;
}

interface GastoStats {
  total_mes: number;
  total_pendiente: number;
  num_gastos_mes: number;
  por_categoria: { categoria: string; total: number }[];
}

const CATEGORIAS_DEFAULT = [
  { id: 1, nombre: "productos", color: "#10b981" },
  { id: 2, nombre: "alquiler", color: "#3b82f6" },
  { id: 3, nombre: "suministros", color: "#f59e0b" },
  { id: 4, nombre: "nominas", color: "#8b5cf6" },
  { id: 5, nombre: "marketing", color: "#ec4899" },
  { id: 6, nombre: "software", color: "#06b6d4" },
  { id: 7, nombre: "material", color: "#84cc16" },
  { id: 8, nombre: "otros", color: "#6b7280" },
];

const FRECUENCIAS = [
  { valor: "semanal", nombre: "Semanal" },
  { valor: "mensual", nombre: "Mensual" },
  { valor: "trimestral", nombre: "Trimestral" },
  { valor: "anual", nombre: "Anual" },
];

export function Gastos() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<CategoriaGasto[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [stats, setStats] = useState<GastoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [filtroPagado, setFiltroPagado] = useState<string>("todos");

  // Modal estados
  const [modalGastoOpen, setModalGastoOpen] = useState(false);
  const [modalProveedorOpen, setModalProveedorOpen] = useState(false);
  const [modalCategoriaOpen, setModalCategoriaOpen] = useState(false);
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null);
  const [proveedorEditando, setProveedorEditando] = useState<Proveedor | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Form gasto
  const [formGasto, setFormGasto] = useState({
    concepto: "",
    importe: "",
    fecha: new Date().toISOString().split("T")[0],
    categoria_id: "",
    proveedor_id: "",
    numero_factura: "",
    notas: "",
    pagado: false,
    es_recurrente: false,
    frecuencia_recurrencia: "",
  });

  // Form proveedor
  const [formProveedor, setFormProveedor] = useState({
    nombre: "",
    cif: "",
    email: "",
    telefono: "",
    direccion: "",
    notas: "",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [gastosRes, categoriasRes, proveedoresRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/gastos/`),
        fetch(`${API_URL}/gastos/categorias`),
        fetch(`${API_URL}/gastos/proveedores`),
        fetch(`${API_URL}/gastos/stats`),
      ]);

      if (gastosRes.ok) {
        const data = await gastosRes.json();
        // API returns paginated response with items array
        setGastos(Array.isArray(data) ? data : (data.items || []));
      }
      if (categoriasRes.ok) {
        const data = await categoriasRes.json();
        setCategorias(Array.isArray(data) && data.length > 0 ? data : CATEGORIAS_DEFAULT as CategoriaGasto[]);
      } else {
        setCategorias(CATEGORIAS_DEFAULT as CategoriaGasto[]);
      }
      if (proveedoresRes.ok) {
        const data = await proveedoresRes.json();
        setProveedores(Array.isArray(data) ? data : []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const guardarGasto = async () => {
    try {
      setGuardando(true);
      const datos = {
        ...formGasto,
        importe: parseFloat(formGasto.importe),
        categoria_id: parseInt(formGasto.categoria_id),
        proveedor_id: formGasto.proveedor_id ? parseInt(formGasto.proveedor_id) : null,
        frecuencia_recurrencia: formGasto.es_recurrente ? formGasto.frecuencia_recurrencia : null,
      };

      const url = gastoEditando
        ? `${API_URL}/gastos/${gastoEditando.id}`
        : `${API_URL}/gastos/`;

      const response = await fetch(url, {
        method: gastoEditando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (response.ok) {
        await cargarDatos();
        cerrarModalGasto();
      }
    } catch (error) {
      console.error("Error guardando gasto:", error);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarGasto = async (id: number) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    try {
      const response = await fetch(`${API_URL}/gastos/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await cargarDatos();
      }
    } catch (error) {
      console.error("Error eliminando gasto:", error);
    }
  };

  const marcarComoPagado = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/gastos/${id}/marcar-pagado`, {
        method: "POST",
      });
      if (response.ok) {
        await cargarDatos();
      }
    } catch (error) {
      console.error("Error marcando como pagado:", error);
    }
  };

  const guardarProveedor = async () => {
    try {
      setGuardando(true);
      const url = proveedorEditando
        ? `${API_URL}/gastos/proveedores/${proveedorEditando.id}`
        : `${API_URL}/gastos/proveedores`;

      // Map frontend fields to backend schema
      const datos = {
        nombre: formProveedor.nombre,
        nif_cif: formProveedor.cif || null,
        email: formProveedor.email || null,
        telefono: formProveedor.telefono || null,
        direccion: formProveedor.direccion || null,
        notas: formProveedor.notas || null,
      };

      const response = await fetch(url, {
        method: proveedorEditando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (response.ok) {
        await cargarDatos();
        cerrarModalProveedor();
      }
    } catch (error) {
      console.error("Error guardando proveedor:", error);
    } finally {
      setGuardando(false);
    }
  };

  const cerrarModalGasto = () => {
    setModalGastoOpen(false);
    setGastoEditando(null);
    setFormGasto({
      concepto: "",
      importe: "",
      fecha: new Date().toISOString().split("T")[0],
      categoria_id: "",
      proveedor_id: "",
      numero_factura: "",
      notas: "",
      pagado: false,
      es_recurrente: false,
      frecuencia_recurrencia: "",
    });
  };

  const cerrarModalProveedor = () => {
    setModalProveedorOpen(false);
    setProveedorEditando(null);
    setFormProveedor({
      nombre: "",
      cif: "",
      email: "",
      telefono: "",
      direccion: "",
      notas: "",
    });
  };

  const abrirEditarGasto = (gasto: Gasto) => {
    setGastoEditando(gasto);
    setFormGasto({
      concepto: gasto.concepto,
      importe: gasto.importe.toString(),
      fecha: gasto.fecha,
      categoria_id: gasto.categoria_id.toString(),
      proveedor_id: gasto.proveedor_id?.toString() || "",
      numero_factura: gasto.numero_factura || "",
      notas: gasto.notas || "",
      pagado: gasto.pagado,
      es_recurrente: gasto.es_recurrente,
      frecuencia_recurrencia: gasto.frecuencia_recurrencia || "",
    });
    setModalGastoOpen(true);
  };

  const abrirEditarProveedor = (proveedor: Proveedor) => {
    setProveedorEditando(proveedor);
    setFormProveedor({
      nombre: proveedor.nombre,
      cif: proveedor.cif || "",
      email: proveedor.email || "",
      telefono: proveedor.telefono || "",
      direccion: proveedor.direccion || "",
      notas: proveedor.notas || "",
    });
    setModalProveedorOpen(true);
  };

  // Filtrar gastos
  const gastosFiltrados = gastos.filter((gasto) => {
    const matchBusqueda =
      gasto.concepto.toLowerCase().includes(busqueda.toLowerCase()) ||
      gasto.numero_factura?.toLowerCase().includes(busqueda.toLowerCase()) ||
      gasto.proveedor?.nombre.toLowerCase().includes(busqueda.toLowerCase());

    const matchCategoria =
      filtroCategoria === "todas" || gasto.categoria_id.toString() === filtroCategoria;

    const matchPagado =
      filtroPagado === "todos" ||
      (filtroPagado === "pagado" && gasto.pagado) ||
      (filtroPagado === "pendiente" && !gasto.pagado);

    return matchBusqueda && matchCategoria && matchPagado;
  });

  const getCategoriaColor = (categoriaId: number) => {
    const cat = categorias.find((c) => c.id === categoriaId);
    return cat?.color || "#6b7280";
  };

  const getCategoriaNombre = (categoriaId: number) => {
    const cat = categorias.find((c) => c.id === categoriaId);
    return cat?.nombre || "Sin categoría";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-salvia-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-carbon-800">Control de Gestión</h1>
          <p className="text-carbon-500">Gestiona los gastos del negocio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setModalProveedorOpen(true)}>
            <Building2 className="h-4 w-4 mr-2" />
            Nuevo Proveedor
          </Button>
          <Button onClick={() => setModalGastoOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-crudo-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Euro className="h-4 w-4 text-salvia-500" />
              <span className="text-sm text-carbon-500">Gastos del mes</span>
            </div>
            <div className="text-2xl font-bold text-carbon-800">
              {stats?.total_mes?.toFixed(2) || "0.00"}€
            </div>
          </CardContent>
        </Card>
        <Card className="border-crudo-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-carbon-500">Pendiente pago</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.total_pendiente?.toFixed(2) || "0.00"}€
            </div>
          </CardContent>
        </Card>
        <Card className="border-crudo-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-carbon-500">Facturas mes</span>
            </div>
            <div className="text-2xl font-bold text-carbon-800">
              {stats?.num_gastos_mes || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="border-crudo-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-sm text-carbon-500">Media diaria</span>
            </div>
            <div className="text-2xl font-bold text-carbon-800">
              {stats?.total_mes ? (stats.total_mes / 30).toFixed(2) : "0.00"}€
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gastos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gastos">Gastos</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
          <TabsTrigger value="categorias">Por Categoría</TabsTrigger>
        </TabsList>

        {/* Tab Gastos */}
        <TabsContent value="gastos">
          <Card className="border-crudo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5 text-salvia-500" />
                Lista de gastos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filtros */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
                  <Input
                    placeholder="Buscar por concepto, factura o proveedor..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroPagado} onValueChange={setFiltroPagado}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pagado">Pagados</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabla */}
              <div className="border border-crudo-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-crudo-50">
                      <TableHead>Fecha</TableHead>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gastosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-carbon-500">
                          No hay gastos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      gastosFiltrados.map((gasto) => (
                        <TableRow key={gasto.id} className="hover:bg-crudo-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-carbon-400" />
                              {new Date(gasto.fecha).toLocaleDateString("es-ES")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-carbon-800">{gasto.concepto}</div>
                              {gasto.numero_factura && (
                                <div className="text-xs text-carbon-500">
                                  Factura: {gasto.numero_factura}
                                </div>
                              )}
                              {gasto.es_recurrente && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  {gasto.frecuencia_recurrencia}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              style={{ backgroundColor: getCategoriaColor(gasto.categoria_id) }}
                              className="text-white"
                            >
                              {getCategoriaNombre(gasto.categoria_id)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {gasto.proveedor?.nombre || "-"}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {gasto.importe.toFixed(2)}€
                          </TableCell>
                          <TableCell>
                            {gasto.pagado ? (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Pagado
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-700">
                                <Clock className="h-3 w-3 mr-1" />
                                Pendiente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {!gasto.pagado && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => marcarComoPagado(gasto.id)}
                                  title="Marcar como pagado"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => abrirEditarGasto(gasto)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => eliminarGasto(gasto.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Proveedores */}
        <TabsContent value="proveedores">
          <Card className="border-crudo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-salvia-500" />
                Proveedores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-crudo-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-crudo-50">
                      <TableHead>Nombre</TableHead>
                      <TableHead>CIF</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proveedores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-carbon-500">
                          No hay proveedores registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      proveedores.map((proveedor) => (
                        <TableRow key={proveedor.id} className="hover:bg-crudo-50">
                          <TableCell className="font-medium">{proveedor.nombre}</TableCell>
                          <TableCell>{proveedor.cif || "-"}</TableCell>
                          <TableCell>{proveedor.email || "-"}</TableCell>
                          <TableCell>{proveedor.telefono || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => abrirEditarProveedor(proveedor)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Categorías */}
        <TabsContent value="categorias">
          <Card className="border-crudo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Tag className="h-5 w-5 text-salvia-500" />
                Gastos por Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {stats?.por_categoria && Object.keys(stats.por_categoria).length > 0 ? (
                  Object.entries(stats.por_categoria).map(([categoria, total]) => (
                    <div
                      key={categoria}
                      className="flex items-center justify-between p-4 bg-crudo-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              categorias.find((c) => c.nombre === categoria)?.color ||
                              "#6b7280",
                          }}
                        />
                        <span className="font-medium capitalize">{categoria}</span>
                      </div>
                      <span className="font-bold text-carbon-800">{(total as number).toFixed(2)}€</span>
                    </div>
                  ))
                ) : (
                  <p className="text-carbon-500 col-span-2 text-center py-4">
                    No hay datos de categorías
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Gasto */}
      <Dialog open={modalGastoOpen} onOpenChange={(open) => !open && cerrarModalGasto()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {gastoEditando ? "Editar Gasto" : "Nuevo Gasto"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="concepto">Concepto *</Label>
              <Input
                id="concepto"
                value={formGasto.concepto}
                onChange={(e) => setFormGasto({ ...formGasto, concepto: e.target.value })}
                placeholder="Descripción del gasto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="importe">Importe (€) *</Label>
                <Input
                  id="importe"
                  type="number"
                  step="0.01"
                  value={formGasto.importe}
                  onChange={(e) => setFormGasto({ ...formGasto, importe: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formGasto.fecha}
                  onChange={(e) => setFormGasto({ ...formGasto, fecha: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoria">Categoría *</Label>
                <Select
                  value={formGasto.categoria_id}
                  onValueChange={(value) => setFormGasto({ ...formGasto, categoria_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="proveedor">Proveedor</Label>
                <Select
                  value={formGasto.proveedor_id || "none"}
                  onValueChange={(value) => setFormGasto({ ...formGasto, proveedor_id: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proveedor</SelectItem>
                    {proveedores.map((prov) => (
                      <SelectItem key={prov.id} value={prov.id.toString()}>
                        {prov.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="numero_factura">Número de Factura</Label>
              <Input
                id="numero_factura"
                value={formGasto.numero_factura}
                onChange={(e) => setFormGasto({ ...formGasto, numero_factura: e.target.value })}
                placeholder="FAC-001"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formGasto.pagado}
                  onChange={(e) => setFormGasto({ ...formGasto, pagado: e.target.checked })}
                  className="rounded border-carbon-300"
                />
                <span className="text-sm">Pagado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formGasto.es_recurrente}
                  onChange={(e) =>
                    setFormGasto({ ...formGasto, es_recurrente: e.target.checked })
                  }
                  className="rounded border-carbon-300"
                />
                <span className="text-sm">Gasto recurrente</span>
              </label>
            </div>

            {formGasto.es_recurrente && (
              <div>
                <Label htmlFor="frecuencia">Frecuencia</Label>
                <Select
                  value={formGasto.frecuencia_recurrencia}
                  onValueChange={(value) =>
                    setFormGasto({ ...formGasto, frecuencia_recurrencia: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    {FRECUENCIAS.map((freq) => (
                      <SelectItem key={freq.valor} value={freq.valor}>
                        {freq.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formGasto.notas}
                onChange={(e) => setFormGasto({ ...formGasto, notas: e.target.value })}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cerrarModalGasto}>
              Cancelar
            </Button>
            <Button
              onClick={guardarGasto}
              disabled={
                guardando || !formGasto.concepto || !formGasto.importe || !formGasto.categoria_id
              }
            >
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {gastoEditando ? "Guardar Cambios" : "Crear Gasto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Proveedor */}
      <Dialog open={modalProveedorOpen} onOpenChange={(open) => !open && cerrarModalProveedor()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {proveedorEditando ? "Editar Proveedor" : "Nuevo Proveedor"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="prov_nombre">Nombre *</Label>
              <Input
                id="prov_nombre"
                value={formProveedor.nombre}
                onChange={(e) => setFormProveedor({ ...formProveedor, nombre: e.target.value })}
                placeholder="Nombre del proveedor"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prov_cif">CIF</Label>
                <Input
                  id="prov_cif"
                  value={formProveedor.cif}
                  onChange={(e) => setFormProveedor({ ...formProveedor, cif: e.target.value })}
                  placeholder="B12345678"
                />
              </div>
              <div>
                <Label htmlFor="prov_telefono">Teléfono</Label>
                <Input
                  id="prov_telefono"
                  value={formProveedor.telefono}
                  onChange={(e) =>
                    setFormProveedor({ ...formProveedor, telefono: e.target.value })
                  }
                  placeholder="612345678"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="prov_email">Email</Label>
              <Input
                id="prov_email"
                type="email"
                value={formProveedor.email}
                onChange={(e) => setFormProveedor({ ...formProveedor, email: e.target.value })}
                placeholder="proveedor@ejemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="prov_direccion">Dirección</Label>
              <Input
                id="prov_direccion"
                value={formProveedor.direccion}
                onChange={(e) =>
                  setFormProveedor({ ...formProveedor, direccion: e.target.value })
                }
                placeholder="Dirección completa"
              />
            </div>

            <div>
              <Label htmlFor="prov_notas">Notas</Label>
              <Textarea
                id="prov_notas"
                value={formProveedor.notas}
                onChange={(e) => setFormProveedor({ ...formProveedor, notas: e.target.value })}
                placeholder="Notas adicionales..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={cerrarModalProveedor}>
              Cancelar
            </Button>
            <Button onClick={guardarProveedor} disabled={guardando || !formProveedor.nombre}>
              {guardando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {proveedorEditando ? "Guardar Cambios" : "Crear Proveedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
