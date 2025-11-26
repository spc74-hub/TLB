import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Users,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Tag,
  Upload,
  Download,
  Check,
  X,
  Calendar,
  ShoppingBag,
  Euro,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

// Tipos
type OrigenCliente = "web" | "tienda" | "importacion" | "manual" | "reserva" | "pedido";

interface Cliente {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  notas: string | null;
  etiquetas: string[] | null;
  usuario_id: string | null;
  acepta_marketing: boolean;
  fecha_opt_in: string | null;
  fecha_opt_out: string | null;
  origen: OrigenCliente;
  total_reservas: number;
  total_pedidos: number;
  total_gastado: number;
  ultima_visita: string | null;
  ultima_compra: string | null;
  created_at: string;
  updated_at: string | null;
}

interface ClienteForm {
  nombre: string;
  email: string;
  telefono: string;
  notas: string;
  etiquetas: string[];
  acepta_marketing: boolean;
  origen: OrigenCliente;
}

interface Stats {
  total_clientes: number;
  acepta_marketing: number;
  por_origen: Record<string, number>;
}

interface ResultadoImportacion {
  total_procesados: number;
  creados: number;
  actualizados: number;
  errores: number;
  detalle_errores: string[] | null;
}

const ORIGENES: { valor: OrigenCliente; nombre: string }[] = [
  { valor: "manual", nombre: "Manual" },
  { valor: "web", nombre: "Web" },
  { valor: "tienda", nombre: "Tienda" },
  { valor: "reserva", nombre: "Reserva" },
  { valor: "pedido", nombre: "Pedido" },
  { valor: "importacion", nombre: "Importación" },
];

const initialForm: ClienteForm = {
  nombre: "",
  email: "",
  telefono: "",
  notas: "",
  etiquetas: [],
  acepta_marketing: false,
  origen: "manual",
};

export function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [etiquetasDisponibles, setEtiquetasDisponibles] = useState<string[]>([]);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroMarketing, setFiltroMarketing] = useState<string>("todos");
  const [filtroOrigen, setFiltroOrigen] = useState<string>("todos");
  const [filtroEtiqueta, setFiltroEtiqueta] = useState<string>("todos");
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const porPagina = 20;

  // Modales
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalImportar, setModalImportar] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [clienteEliminar, setClienteEliminar] = useState<Cliente | null>(null);

  // Formulario
  const [form, setForm] = useState<ClienteForm>(initialForm);
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Importación
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importando, setImportando] = useState(false);
  const [resultadoImportacion, setResultadoImportacion] = useState<ResultadoImportacion | null>(null);

  useEffect(() => {
    cargarClientes();
    cargarStats();
    cargarEtiquetas();
  }, [pagina, filtroMarketing, filtroOrigen, filtroEtiqueta]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagina === 1) {
        cargarClientes();
      } else {
        setPagina(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("pagina", pagina.toString());
      params.append("por_pagina", porPagina.toString());
      if (busqueda) params.append("busqueda", busqueda);
      if (filtroMarketing !== "todos") params.append("acepta_marketing", filtroMarketing);
      if (filtroOrigen !== "todos") params.append("origen", filtroOrigen);
      if (filtroEtiqueta !== "todos") params.append("etiqueta", filtroEtiqueta);

      const response = await fetch(`${API_URL}/clientes/?${params}`);
      if (!response.ok) throw new Error("Error cargando clientes");
      const data = await response.json();
      setClientes(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const cargarStats = async () => {
    try {
      const response = await fetch(`${API_URL}/clientes/stats`);
      if (!response.ok) throw new Error("Error cargando estadísticas");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const cargarEtiquetas = async () => {
    try {
      const response = await fetch(`${API_URL}/clientes/etiquetas`);
      if (!response.ok) throw new Error("Error cargando etiquetas");
      const data = await response.json();
      setEtiquetasDisponibles(data);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const abrirDetalle = async (cliente: Cliente) => {
    try {
      const response = await fetch(`${API_URL}/clientes/${cliente.id}`);
      if (!response.ok) throw new Error("Error cargando cliente");
      const data = await response.json();
      setClienteSeleccionado(data);
      setModalDetalle(true);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const abrirEditar = (cliente: Cliente) => {
    setForm({
      nombre: cliente.nombre,
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      notas: cliente.notas || "",
      etiquetas: cliente.etiquetas || [],
      acepta_marketing: cliente.acepta_marketing,
      origen: cliente.origen,
    });
    setClienteSeleccionado(cliente);
    setModalEditar(true);
  };

  const guardarCliente = async (esNuevo: boolean) => {
    setError(null);
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (!form.email && !form.telefono) {
      setError("Debe proporcionar email o teléfono");
      return;
    }

    try {
      setGuardando(true);
      const url = esNuevo
        ? `${API_URL}/clientes/`
        : `${API_URL}/clientes/${clienteSeleccionado?.id}`;
      const method = esNuevo ? "POST" : "PUT";

      const body = {
        nombre: form.nombre.trim(),
        email: form.email.trim() || null,
        telefono: form.telefono.trim() || null,
        notas: form.notas.trim() || null,
        etiquetas: form.etiquetas.length > 0 ? form.etiquetas : null,
        acepta_marketing: form.acepta_marketing,
        ...(esNuevo && { origen: form.origen }),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error guardando cliente");
      }

      setModalCrear(false);
      setModalEditar(false);
      setForm(initialForm);
      cargarClientes();
      cargarStats();
      cargarEtiquetas();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error guardando cliente");
    } finally {
      setGuardando(false);
    }
  };

  const eliminarCliente = async () => {
    if (!clienteEliminar) return;
    try {
      const response = await fetch(`${API_URL}/clientes/${clienteEliminar.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error eliminando cliente");
      setClienteEliminar(null);
      cargarClientes();
      cargarStats();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const toggleMarketing = async (cliente: Cliente, activar: boolean) => {
    try {
      const endpoint = activar ? "opt-in" : "opt-out";
      const response = await fetch(`${API_URL}/clientes/${cliente.id}/${endpoint}`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Error actualizando marketing");
      cargarClientes();
      cargarStats();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const agregarEtiqueta = () => {
    if (nuevaEtiqueta.trim() && !form.etiquetas.includes(nuevaEtiqueta.trim())) {
      setForm({ ...form, etiquetas: [...form.etiquetas, nuevaEtiqueta.trim()] });
      setNuevaEtiqueta("");
    }
  };

  const quitarEtiqueta = (etiqueta: string) => {
    setForm({ ...form, etiquetas: form.etiquetas.filter((e) => e !== etiqueta) });
  };

  const importarCSV = async (file: File) => {
    try {
      setImportando(true);
      const formData = new FormData();
      formData.append("archivo", file);

      const response = await fetch(`${API_URL}/clientes/importar`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error importando archivo");
      }

      const resultado = await response.json();
      setResultadoImportacion(resultado);
      cargarClientes();
      cargarStats();
      cargarEtiquetas();
    } catch (err) {
      setResultadoImportacion({
        total_procesados: 0,
        creados: 0,
        actualizados: 0,
        errores: 1,
        detalle_errores: [err instanceof Error ? err.message : "Error desconocido"],
      });
    } finally {
      setImportando(false);
    }
  };

  const descargarPlantilla = () => {
    window.open(`${API_URL}/clientes/exportar/plantilla`, "_blank");
  };

  const exportarCSV = () => {
    const params = new URLSearchParams();
    if (filtroMarketing !== "todos") params.append("acepta_marketing", filtroMarketing);
    if (filtroEtiqueta !== "todos") params.append("etiqueta", filtroEtiqueta);
    window.open(`${API_URL}/clientes/exportar/csv?${params}`, "_blank");
  };

  const totalPaginas = Math.ceil(total / porPagina);

  if (loading && clientes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-salvia-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-carbon-800">CRM - Clientes</h1>
          <p className="text-carbon-500">Gestión de base de datos de clientes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setModalImportar(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" onClick={exportarCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            onClick={() => {
              setForm(initialForm);
              setModalCrear(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo cliente
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-crudo-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-carbon-800">{stats.total_clientes}</div>
              <div className="text-sm text-carbon-500">Total clientes</div>
            </CardContent>
          </Card>
          <Card className="border-crudo-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-salvia-600">{stats.acepta_marketing}</div>
              <div className="text-sm text-carbon-500">Acepta marketing</div>
            </CardContent>
          </Card>
          <Card className="border-crudo-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-purple-600">
                {stats.por_origen?.reserva || 0}
              </div>
              <div className="text-sm text-carbon-500">Desde reservas</div>
            </CardContent>
          </Card>
          <Card className="border-crudo-200">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-amber-600">
                {stats.por_origen?.pedido || 0}
              </div>
              <div className="text-sm text-carbon-500">Desde pedidos</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="border-crudo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-salvia-500" />
            Lista de clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-carbon-400" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filtroMarketing} onValueChange={setFiltroMarketing}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Marketing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="true">Acepta marketing</SelectItem>
                <SelectItem value="false">No acepta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroOrigen} onValueChange={setFiltroOrigen}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Origen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los orígenes</SelectItem>
                {ORIGENES.map((origen) => (
                  <SelectItem key={origen.valor} value={origen.valor}>
                    {origen.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroEtiqueta} onValueChange={setFiltroEtiqueta}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Etiqueta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las etiquetas</SelectItem>
                {etiquetasDisponibles.map((etiqueta) => (
                  <SelectItem key={etiqueta} value={etiqueta}>
                    {etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabla */}
          <div className="border border-crudo-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-crudo-50">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Etiquetas</TableHead>
                  <TableHead className="text-center">Marketing</TableHead>
                  <TableHead className="text-center">Actividad</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-carbon-500">
                      No hay clientes que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((cliente) => (
                    <TableRow key={cliente.id} className="hover:bg-crudo-50">
                      <TableCell>
                        <div className="font-medium text-carbon-800">{cliente.nombre}</div>
                        <div className="text-xs text-carbon-400">
                          {ORIGENES.find((o) => o.valor === cliente.origen)?.nombre || cliente.origen}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {cliente.email && (
                            <div className="flex items-center gap-1 text-carbon-600">
                              <Mail className="h-3 w-3" />
                              {cliente.email}
                            </div>
                          )}
                          {cliente.telefono && (
                            <div className="flex items-center gap-1 text-carbon-600">
                              <Phone className="h-3 w-3" />
                              {cliente.telefono}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {cliente.etiquetas?.slice(0, 3).map((etiqueta) => (
                            <Badge key={etiqueta} variant="outline" className="text-xs">
                              {etiqueta}
                            </Badge>
                          ))}
                          {cliente.etiquetas && cliente.etiquetas.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{cliente.etiquetas.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMarketing(cliente, !cliente.acepta_marketing)}
                          className={cliente.acepta_marketing ? "text-green-600" : "text-carbon-400"}
                        >
                          {cliente.acepta_marketing ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          <span className="text-salvia-600 font-medium">{cliente.total_reservas}</span>
                          <span className="text-carbon-400 mx-1">/</span>
                          <span className="text-amber-600 font-medium">{cliente.total_pedidos}</span>
                        </div>
                        {cliente.total_gastado > 0 && (
                          <div className="text-xs text-carbon-500">
                            {cliente.total_gastado.toFixed(2)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => abrirDetalle(cliente)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => abrirEditar(cliente)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setClienteEliminar(cliente)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-carbon-500">
                Mostrando {(pagina - 1) * porPagina + 1} -{" "}
                {Math.min(pagina * porPagina, total)} de {total}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagina === 1}
                  onClick={() => setPagina(pagina - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagina === totalPaginas}
                  onClick={() => setPagina(pagina + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Crear/Editar Cliente */}
      <Dialog
        open={modalCrear || modalEditar}
        onOpenChange={(open) => {
          if (!open) {
            setModalCrear(false);
            setModalEditar(false);
            setError(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{modalCrear ? "Nuevo cliente" : "Editar cliente"}</DialogTitle>
            <DialogDescription>
              {modalCrear
                ? "Añade un nuevo cliente a la base de datos"
                : "Modifica los datos del cliente"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>
            )}

            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="+34 612 345 678"
                />
              </div>
            </div>

            {modalCrear && (
              <div>
                <Label htmlFor="origen">Origen</Label>
                <Select
                  value={form.origen}
                  onValueChange={(value) => setForm({ ...form, origen: value as OrigenCliente })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORIGENES.map((origen) => (
                      <SelectItem key={origen.valor} value={origen.valor}>
                        {origen.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Etiquetas</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={nuevaEtiqueta}
                  onChange={(e) => setNuevaEtiqueta(e.target.value)}
                  placeholder="Nueva etiqueta"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), agregarEtiqueta())}
                />
                <Button type="button" variant="outline" onClick={agregarEtiqueta}>
                  <Tag className="h-4 w-4" />
                </Button>
              </div>
              {form.etiquetas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.etiquetas.map((etiqueta) => (
                    <Badge key={etiqueta} variant="secondary" className="gap-1">
                      {etiqueta}
                      <button
                        type="button"
                        onClick={() => quitarEtiqueta(etiqueta)}
                        className="hover:text-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                placeholder="Notas sobre el cliente..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="marketing"
                checked={form.acepta_marketing}
                onCheckedChange={(checked) => setForm({ ...form, acepta_marketing: checked })}
              />
              <Label htmlFor="marketing">Acepta recibir comunicaciones de marketing</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModalCrear(false);
                setModalEditar(false);
                setError(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={() => guardarCliente(modalCrear)} disabled={guardando}>
              {guardando && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {modalCrear ? "Crear cliente" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalle Cliente */}
      <Dialog open={modalDetalle} onOpenChange={setModalDetalle}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ficha de cliente</DialogTitle>
          </DialogHeader>

          {clienteSeleccionado && (
            <div className="space-y-6">
              {/* Info principal */}
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-salvia-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-salvia-600">
                    {clienteSeleccionado.nombre.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-carbon-800">
                    {clienteSeleccionado.nombre}
                  </h2>
                  <p className="text-sm text-carbon-500">
                    Cliente desde{" "}
                    {new Date(clienteSeleccionado.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                    })}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge
                      variant={clienteSeleccionado.acepta_marketing ? "default" : "outline"}
                      className={clienteSeleccionado.acepta_marketing ? "bg-green-100 text-green-700" : ""}
                    >
                      {clienteSeleccionado.acepta_marketing ? "Acepta marketing" : "No marketing"}
                    </Badge>
                    <Badge variant="outline">
                      {ORIGENES.find((o) => o.valor === clienteSeleccionado.origen)?.nombre}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contacto */}
              <div className="grid sm:grid-cols-2 gap-4 p-4 bg-crudo-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-salvia-600" />
                  <div>
                    <div className="text-xs text-carbon-500">Email</div>
                    <div className="font-medium">{clienteSeleccionado.email || "-"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-salvia-600" />
                  <div>
                    <div className="text-xs text-carbon-500">Teléfono</div>
                    <div className="font-medium">{clienteSeleccionado.telefono || "-"}</div>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 border border-crudo-200 rounded-lg">
                  <Calendar className="h-5 w-5 mx-auto text-salvia-600 mb-1" />
                  <div className="text-2xl font-bold text-carbon-800">
                    {clienteSeleccionado.total_reservas}
                  </div>
                  <div className="text-xs text-carbon-500">Reservas</div>
                  {clienteSeleccionado.ultima_visita && (
                    <div className="text-xs text-carbon-400 mt-1">
                      Última: {new Date(clienteSeleccionado.ultima_visita).toLocaleDateString("es-ES")}
                    </div>
                  )}
                </div>
                <div className="text-center p-4 border border-crudo-200 rounded-lg">
                  <ShoppingBag className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                  <div className="text-2xl font-bold text-carbon-800">
                    {clienteSeleccionado.total_pedidos}
                  </div>
                  <div className="text-xs text-carbon-500">Pedidos</div>
                  {clienteSeleccionado.ultima_compra && (
                    <div className="text-xs text-carbon-400 mt-1">
                      Última: {new Date(clienteSeleccionado.ultima_compra).toLocaleDateString("es-ES")}
                    </div>
                  )}
                </div>
                <div className="text-center p-4 border border-crudo-200 rounded-lg">
                  <Euro className="h-5 w-5 mx-auto text-green-600 mb-1" />
                  <div className="text-2xl font-bold text-carbon-800">
                    {clienteSeleccionado.total_gastado.toFixed(2)}
                  </div>
                  <div className="text-xs text-carbon-500">Total gastado</div>
                </div>
              </div>

              {/* Etiquetas */}
              {clienteSeleccionado.etiquetas && clienteSeleccionado.etiquetas.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-carbon-600 mb-2">Etiquetas</div>
                  <div className="flex flex-wrap gap-2">
                    {clienteSeleccionado.etiquetas.map((etiqueta) => (
                      <Badge key={etiqueta} variant="secondary">
                        {etiqueta}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notas */}
              {clienteSeleccionado.notas && (
                <div>
                  <div className="text-sm font-medium text-carbon-600 mb-2">Notas</div>
                  <p className="text-sm text-carbon-700 bg-crudo-50 p-3 rounded-lg">
                    {clienteSeleccionado.notas}
                  </p>
                </div>
              )}

              {/* Historial (simplificado) */}
              {((clienteSeleccionado as any).reservas?.length > 0 ||
                (clienteSeleccionado as any).pedidos?.length > 0) && (
                <div>
                  <div className="text-sm font-medium text-carbon-600 mb-2">Historial reciente</div>
                  <div className="text-sm text-carbon-500">
                    Ver historial completo en las secciones de Agenda y Pedidos
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Importar */}
      <Dialog
        open={modalImportar}
        onOpenChange={(open) => {
          if (!open) {
            setModalImportar(false);
            setResultadoImportacion(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Importar clientes</DialogTitle>
            <DialogDescription>
              Importa clientes desde un archivo CSV
            </DialogDescription>
          </DialogHeader>

          {!resultadoImportacion ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-crudo-300 rounded-lg p-8 text-center">
                <Upload className="h-10 w-10 mx-auto text-carbon-400 mb-4" />
                <p className="text-sm text-carbon-600 mb-4">
                  Selecciona un archivo CSV con los datos de clientes
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importarCSV(file);
                  }}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importando}
                >
                  {importando ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {importando ? "Importando..." : "Seleccionar archivo"}
                </Button>
              </div>

              <div className="text-sm text-carbon-500">
                <p className="font-medium mb-2">Formato esperado (con cabeceras):</p>
                <code className="text-xs bg-crudo-100 p-2 rounded block">
                  nombre,email,telefono,etiquetas,acepta_marketing,notas
                </code>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>- etiquetas: separadas por punto y coma (;)</li>
                  <li>- acepta_marketing: true/false, si/no, 1/0</li>
                </ul>
              </div>

              <Button variant="outline" className="w-full" onClick={descargarPlantilla}>
                <Download className="h-4 w-4 mr-2" />
                Descargar plantilla CSV
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg ${
                  resultadoImportacion.errores > 0 ? "bg-amber-50" : "bg-green-50"
                }`}
              >
                <h3
                  className={`font-medium ${
                    resultadoImportacion.errores > 0 ? "text-amber-700" : "text-green-700"
                  }`}
                >
                  Importación completada
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-crudo-50 rounded-lg">
                  <div className="text-2xl font-bold text-carbon-800">
                    {resultadoImportacion.total_procesados}
                  </div>
                  <div className="text-xs text-carbon-500">Procesados</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {resultadoImportacion.creados}
                  </div>
                  <div className="text-xs text-carbon-500">Creados</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {resultadoImportacion.actualizados}
                  </div>
                  <div className="text-xs text-carbon-500">Actualizados</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {resultadoImportacion.errores}
                  </div>
                  <div className="text-xs text-carbon-500">Errores</div>
                </div>
              </div>

              {resultadoImportacion.detalle_errores &&
                resultadoImportacion.detalle_errores.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-carbon-600 mb-2">
                      Detalle de errores:
                    </div>
                    <div className="max-h-32 overflow-y-auto bg-red-50 p-3 rounded-lg text-xs text-red-700 space-y-1">
                      {resultadoImportacion.detalle_errores.map((error, i) => (
                        <div key={i}>{error}</div>
                      ))}
                    </div>
                  </div>
                )}

              <Button
                className="w-full"
                onClick={() => {
                  setModalImportar(false);
                  setResultadoImportacion(null);
                }}
              >
                Cerrar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmación eliminar */}
      <AlertDialog open={!!clienteEliminar} onOpenChange={() => setClienteEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a{" "}
              <strong>{clienteEliminar?.nombre}</strong>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={eliminarCliente}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
