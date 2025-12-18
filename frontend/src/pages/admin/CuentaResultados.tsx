import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Euro,
  Upload,
  Download,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Database,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  ShoppingBag,
  Receipt,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

// Tipos
interface PLResumenMensual {
  anio: number;
  mes: number;
  ingresos: number;
  gastos: number;
  resultado: number;
}

interface PLDesglose {
  categoria: string;
  tipo: string;
  importe: number;
  porcentaje: number;
}

interface PLDashboard {
  periodo_actual: PLResumenMensual;
  periodo_anterior_mes: PLResumenMensual | null;
  periodo_anterior_anio: PLResumenMensual | null;
  desglose_ingresos: PLDesglose[];
  desglose_gastos: PLDesglose[];
  evolucion_mensual: PLResumenMensual[];
}

interface PLResumenAnual {
  anio: number;
  ingresos: number;
  gastos: number;
  resultado: number;
  meses: PLResumenMensual[];
}

interface Importacion {
  id: number;
  lote_id: string;
  nombre_archivo: string;
  fecha_importacion: string;
  registros_totales: number;
  registros_importados: number;
  registros_error: number;
  total_ingresos: number;
  total_gastos: number;
  anio_desde: number;
  anio_hasta: number;
}

interface ImportacionResultado {
  lote_id: string;
  registros_totales: number;
  registros_importados: number;
  registros_error: number;
  errores: { linea: number; error: string }[];
}

interface MigracionEstado {
  pedidos_sin_movimiento: number;
  gastos_sin_movimiento: number;
  total_en_cash_movements: number;
}

interface MigracionResultado {
  tipo: string;
  registros_migrados: number;
  total_importe: number;
  mensaje: string;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function CuentaResultados() {
  const [dashboard, setDashboard] = useState<PLDashboard | null>(null);
  const [resumenAnual, setResumenAnual] = useState<PLResumenAnual | null>(null);
  const [importaciones, setImportaciones] = useState<Importacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth() + 1);

  // Modal importación
  const [modalImportOpen, setModalImportOpen] = useState(false);
  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState<ImportacionResultado | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado de migración
  const [migracionEstado, setMigracionEstado] = useState<MigracionEstado | null>(null);
  const [migrando, setMigrando] = useState(false);
  const [resultadosMigracion, setResultadosMigracion] = useState<MigracionResultado[]>([]);

  // Cargar datos
  const cargarDashboard = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/v1/cuenta-resultados/dashboard?anio=${anioSeleccionado}&mes=${mesSeleccionado}`
      );
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    }
  };

  const cargarResumenAnual = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/v1/cuenta-resultados/resumen-anual?anio=${anioSeleccionado}`
      );
      if (response.ok) {
        const data = await response.json();
        setResumenAnual(data);
      }
    } catch (error) {
      console.error("Error cargando resumen anual:", error);
    }
  };

  const cargarImportaciones = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/cuenta-resultados/importaciones`);
      if (response.ok) {
        const data = await response.json();
        setImportaciones(data);
      }
    } catch (error) {
      console.error("Error cargando importaciones:", error);
    }
  };

  const cargarEstadoMigracion = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/cuenta-resultados/migracion/estado`);
      if (response.ok) {
        const data = await response.json();
        setMigracionEstado(data);
      }
    } catch (error) {
      console.error("Error cargando estado migración:", error);
    }
  };

  const cargarTodo = async () => {
    setLoading(true);
    await Promise.all([cargarDashboard(), cargarResumenAnual(), cargarImportaciones(), cargarEstadoMigracion()]);
    setLoading(false);
  };

  useEffect(() => {
    cargarTodo();
  }, [anioSeleccionado, mesSeleccionado]);

  // Importar CSV
  const handleImportar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportando(true);
    setResultadoImport(null);

    const formData = new FormData();
    formData.append("archivo", file);

    try {
      const response = await fetch(`${API_URL}/api/v1/cuenta-resultados/importar`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResultadoImport(data);
        cargarTodo();
      } else {
        const error = await response.json();
        setResultadoImport({
          lote_id: "",
          registros_totales: 0,
          registros_importados: 0,
          registros_error: 1,
          errores: [{ linea: 0, error: error.detail || "Error desconocido" }],
        });
      }
    } catch (error) {
      setResultadoImport({
        lote_id: "",
        registros_totales: 0,
        registros_importados: 0,
        registros_error: 1,
        errores: [{ linea: 0, error: "Error de conexión" }],
      });
    } finally {
      setImportando(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Eliminar importación
  const eliminarImportacion = async (loteId: string) => {
    if (!confirm("¿Eliminar esta importación y todos sus registros?")) return;

    try {
      const response = await fetch(
        `${API_URL}/api/v1/cuenta-resultados/importaciones/${loteId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        cargarTodo();
      }
    } catch (error) {
      console.error("Error eliminando importación:", error);
    }
  };

  // Descargar plantilla
  const descargarPlantilla = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/cuenta-resultados/plantilla-csv`);
      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([data.plantilla], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "plantilla_pl_historicos.csv";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error descargando plantilla:", error);
    }
  };

  // Ejecutar migración
  const ejecutarMigracion = async (tipo: "pedidos" | "gastos" | "todo") => {
    setMigrando(true);
    setResultadosMigracion([]);

    try {
      const response = await fetch(`${API_URL}/api/v1/cuenta-resultados/migracion/${tipo}`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        // Si es "todo" devuelve un array, si no un objeto
        if (Array.isArray(data)) {
          setResultadosMigracion(data);
        } else {
          setResultadosMigracion([data]);
        }
        // Recargar todo después de la migración
        await cargarTodo();
      } else {
        const error = await response.json();
        setResultadosMigracion([{
          tipo: tipo,
          registros_migrados: 0,
          total_importe: 0,
          mensaje: error.detail || "Error en la migración"
        }]);
      }
    } catch (error) {
      setResultadosMigracion([{
        tipo: tipo,
        registros_migrados: 0,
        total_importe: 0,
        mensaje: "Error de conexión"
      }]);
    } finally {
      setMigrando(false);
    }
  };

  // Navegación de período
  const mesAnterior = () => {
    if (mesSeleccionado === 1) {
      setMesSeleccionado(12);
      setAnioSeleccionado(anioSeleccionado - 1);
    } else {
      setMesSeleccionado(mesSeleccionado - 1);
    }
  };

  const mesSiguiente = () => {
    if (mesSeleccionado === 12) {
      setMesSeleccionado(1);
      setAnioSeleccionado(anioSeleccionado + 1);
    } else {
      setMesSeleccionado(mesSeleccionado + 1);
    }
  };

  // Formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  // Calcular variación
  const calcularVariacion = (actual: number, anterior: number) => {
    if (anterior === 0) return null;
    return ((actual - anterior) / Math.abs(anterior)) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Cuenta de Resultados
          </h1>
          <p className="text-muted-foreground">
            Análisis de ingresos, gastos y resultados
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setModalImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Button variant="outline" onClick={descargarPlantilla}>
            <Download className="h-4 w-4 mr-2" />
            Plantilla
          </Button>
          <Button variant="outline" onClick={cargarTodo}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selector de período */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={mesAnterior}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Select
                value={mesSeleccionado.toString()}
                onValueChange={(v) => setMesSeleccionado(parseInt(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((mes, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>
                      {mes}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={anioSeleccionado.toString()}
                onValueChange={(v) => setAnioSeleccionado(parseInt(v))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(
                    (anio) => (
                      <SelectItem key={anio} value={anio.toString()}>
                        {anio}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="icon" onClick={mesSiguiente}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="anual">Vista Anual</TabsTrigger>
          <TabsTrigger value="importaciones">Importaciones</TabsTrigger>
          <TabsTrigger value="migracion" className="flex items-center gap-1">
            Migración
            {migracionEstado && (migracionEstado.pedidos_sin_movimiento > 0 || migracionEstado.gastos_sin_movimiento > 0) && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                !
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB: Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* KPIs principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Ingresos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ingresos
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(dashboard?.periodo_actual.ingresos || 0)}
                </div>
                {dashboard?.periodo_anterior_mes && (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {(() => {
                      const var_pct = calcularVariacion(
                        dashboard.periodo_actual.ingresos,
                        dashboard.periodo_anterior_mes.ingresos
                      );
                      if (var_pct === null) return <span>Sin datos previos</span>;
                      return (
                        <>
                          {var_pct >= 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                          )}
                          <span className={var_pct >= 0 ? "text-green-500" : "text-red-500"}>
                            {var_pct >= 0 ? "+" : ""}{var_pct.toFixed(1)}%
                          </span>
                          <span className="ml-1">vs mes anterior</span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gastos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Gastos
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(dashboard?.periodo_actual.gastos || 0)}
                </div>
                {dashboard?.periodo_anterior_mes && (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {(() => {
                      const var_pct = calcularVariacion(
                        dashboard.periodo_actual.gastos,
                        dashboard.periodo_anterior_mes.gastos
                      );
                      if (var_pct === null) return <span>Sin datos previos</span>;
                      return (
                        <>
                          {var_pct <= 0 ? (
                            <ArrowDownRight className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3 text-red-500 mr-1" />
                          )}
                          <span className={var_pct <= 0 ? "text-green-500" : "text-red-500"}>
                            {var_pct >= 0 ? "+" : ""}{var_pct.toFixed(1)}%
                          </span>
                          <span className="ml-1">vs mes anterior</span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resultado */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Resultado
                </CardTitle>
                <Euro className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    (dashboard?.periodo_actual.resultado || 0) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(dashboard?.periodo_actual.resultado || 0)}
                </div>
                {dashboard?.periodo_anterior_anio && (
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {(() => {
                      const var_pct = calcularVariacion(
                        dashboard.periodo_actual.resultado,
                        dashboard.periodo_anterior_anio.resultado
                      );
                      if (var_pct === null) return <span>Sin datos del año anterior</span>;
                      return (
                        <>
                          {var_pct >= 0 ? (
                            <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                          )}
                          <span className={var_pct >= 0 ? "text-green-500" : "text-red-500"}>
                            {var_pct >= 0 ? "+" : ""}{var_pct.toFixed(1)}%
                          </span>
                          <span className="ml-1">vs {MESES[mesSeleccionado - 1]} {anioSeleccionado - 1}</span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comparativa con mes/año anterior */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* vs Mes Anterior */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">vs Mes Anterior</CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.periodo_anterior_mes ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">
                          {MESES[mesSeleccionado - 2 < 0 ? 11 : mesSeleccionado - 2]}
                        </TableHead>
                        <TableHead className="text-right">
                          {MESES[mesSeleccionado - 1]}
                        </TableHead>
                        <TableHead className="text-right">Var.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Ingresos</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dashboard.periodo_anterior_mes.ingresos)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dashboard.periodo_actual.ingresos)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              dashboard.periodo_actual.ingresos >=
                              dashboard.periodo_anterior_mes.ingresos
                                ? "default"
                                : "destructive"
                            }
                          >
                            {formatCurrency(
                              dashboard.periodo_actual.ingresos -
                                dashboard.periodo_anterior_mes.ingresos
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Gastos</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dashboard.periodo_anterior_mes.gastos)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dashboard.periodo_actual.gastos)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              dashboard.periodo_actual.gastos <=
                              dashboard.periodo_anterior_mes.gastos
                                ? "default"
                                : "destructive"
                            }
                          >
                            {formatCurrency(
                              dashboard.periodo_actual.gastos -
                                dashboard.periodo_anterior_mes.gastos
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-bold">
                        <TableCell>Resultado</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dashboard.periodo_anterior_mes.resultado)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dashboard.periodo_actual.resultado)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              dashboard.periodo_actual.resultado >=
                              dashboard.periodo_anterior_mes.resultado
                                ? "default"
                                : "destructive"
                            }
                          >
                            {formatCurrency(
                              dashboard.periodo_actual.resultado -
                                dashboard.periodo_anterior_mes.resultado
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Sin datos del mes anterior
                  </p>
                )}
              </CardContent>
            </Card>

            {/* vs Mismo Mes Año Anterior */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  vs {MESES[mesSeleccionado - 1]} {anioSeleccionado - 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.periodo_anterior_anio ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">{anioSeleccionado - 1}</TableHead>
                        <TableHead className="text-right">{anioSeleccionado}</TableHead>
                        <TableHead className="text-right">Var.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Ingresos</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dashboard.periodo_anterior_anio.ingresos)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dashboard.periodo_actual.ingresos)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              dashboard.periodo_actual.ingresos >=
                              dashboard.periodo_anterior_anio.ingresos
                                ? "default"
                                : "destructive"
                            }
                          >
                            {formatCurrency(
                              dashboard.periodo_actual.ingresos -
                                dashboard.periodo_anterior_anio.ingresos
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Gastos</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dashboard.periodo_anterior_anio.gastos)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dashboard.periodo_actual.gastos)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              dashboard.periodo_actual.gastos <=
                              dashboard.periodo_anterior_anio.gastos
                                ? "default"
                                : "destructive"
                            }
                          >
                            {formatCurrency(
                              dashboard.periodo_actual.gastos -
                                dashboard.periodo_anterior_anio.gastos
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-bold">
                        <TableCell>Resultado</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dashboard.periodo_anterior_anio.resultado)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(dashboard.periodo_actual.resultado)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              dashboard.periodo_actual.resultado >=
                              dashboard.periodo_anterior_anio.resultado
                                ? "default"
                                : "destructive"
                            }
                          >
                            {formatCurrency(
                              dashboard.periodo_actual.resultado -
                                dashboard.periodo_anterior_anio.resultado
                            )}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Sin datos del año anterior
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Desglose por categorías */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Desglose Ingresos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Desglose Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.desglose_ingresos && dashboard.desglose_ingresos.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.desglose_ingresos.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm capitalize">{item.categoria}</span>
                          <Badge variant="outline" className="text-xs">
                            {parseFloat(String(item.porcentaje)).toFixed(1)}%
                          </Badge>
                        </div>
                        <span className="font-medium text-green-600">
                          {formatCurrency(item.importe)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Sin ingresos en este período
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Desglose Gastos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  Desglose Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.desglose_gastos && dashboard.desglose_gastos.length > 0 ? (
                  <div className="space-y-3">
                    {dashboard.desglose_gastos.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm capitalize">{item.categoria}</span>
                          <Badge variant="outline" className="text-xs">
                            {parseFloat(String(item.porcentaje)).toFixed(1)}%
                          </Badge>
                        </div>
                        <span className="font-medium text-red-600">
                          {formatCurrency(item.importe)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Sin gastos en este período
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Evolución mensual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Evolución últimos 12 meses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead className="text-right">Ingresos</TableHead>
                      <TableHead className="text-right">Gastos</TableHead>
                      <TableHead className="text-right">Resultado</TableHead>
                      <TableHead className="text-right">Margen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboard?.evolucion_mensual.map((mes, i) => (
                      <TableRow
                        key={i}
                        className={
                          mes.anio === anioSeleccionado && mes.mes === mesSeleccionado
                            ? "bg-muted/50"
                            : ""
                        }
                      >
                        <TableCell className="font-medium">
                          {MESES[mes.mes - 1]} {mes.anio}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(mes.ingresos)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(mes.gastos)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            mes.resultado >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(mes.resultado)}
                        </TableCell>
                        <TableCell className="text-right">
                          {mes.ingresos > 0 ? (
                            <Badge
                              variant={
                                mes.resultado / mes.ingresos >= 0.1 ? "default" : "secondary"
                              }
                            >
                              {((mes.resultado / mes.ingresos) * 100).toFixed(1)}%
                            </Badge>
                          ) : (
                            <Minus className="h-4 w-4 inline text-muted-foreground" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Vista Anual */}
        <TabsContent value="anual" className="space-y-4">
          {resumenAnual && (
            <>
              {/* KPIs anuales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">
                      Total Ingresos {anioSeleccionado}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(resumenAnual.ingresos)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">
                      Total Gastos {anioSeleccionado}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(resumenAnual.gastos)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">
                      Resultado {anioSeleccionado}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        resumenAnual.resultado >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(resumenAnual.resultado)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">
                      Margen Anual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${
                        resumenAnual.ingresos > 0 &&
                        resumenAnual.resultado / resumenAnual.ingresos >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {resumenAnual.ingresos > 0
                        ? `${((resumenAnual.resultado / resumenAnual.ingresos) * 100).toFixed(1)}%`
                        : "-"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabla mensual del año */}
              <Card>
                <CardHeader>
                  <CardTitle>Detalle mensual {anioSeleccionado}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mes</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                        <TableHead className="text-right">Gastos</TableHead>
                        <TableHead className="text-right">Resultado</TableHead>
                        <TableHead className="text-right">Margen</TableHead>
                        <TableHead className="text-right">Acumulado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resumenAnual.meses.map((mes, i) => {
                        const acumulado = resumenAnual.meses
                          .slice(0, i + 1)
                          .reduce((acc, m) => acc + m.resultado, 0);
                        return (
                          <TableRow key={i}>
                            <TableCell className="font-medium">
                              {MESES[mes.mes - 1]}
                            </TableCell>
                            <TableCell className="text-right text-green-600">
                              {formatCurrency(mes.ingresos)}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {formatCurrency(mes.gastos)}
                            </TableCell>
                            <TableCell
                              className={`text-right font-medium ${
                                mes.resultado >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {formatCurrency(mes.resultado)}
                            </TableCell>
                            <TableCell className="text-right">
                              {mes.ingresos > 0
                                ? `${((mes.resultado / mes.ingresos) * 100).toFixed(1)}%`
                                : "-"}
                            </TableCell>
                            <TableCell
                              className={`text-right font-medium ${
                                acumulado >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {formatCurrency(acumulado)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* TAB: Importaciones */}
        <TabsContent value="importaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Historial de Importaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {importaciones.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Archivo</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Registros</TableHead>
                      <TableHead className="text-right">Período</TableHead>
                      <TableHead className="text-right">Ingresos</TableHead>
                      <TableHead className="text-right">Gastos</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importaciones.map((imp) => (
                      <TableRow key={imp.lote_id}>
                        <TableCell className="font-medium">
                          {imp.nombre_archivo}
                        </TableCell>
                        <TableCell>
                          {new Date(imp.fecha_importacion).toLocaleDateString("es-ES")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={imp.registros_error > 0 ? "destructive" : "default"}>
                            {imp.registros_importados}/{imp.registros_totales}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {imp.anio_desde === imp.anio_hasta
                            ? imp.anio_desde
                            : `${imp.anio_desde}-${imp.anio_hasta}`}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(imp.total_ingresos)}
                        </TableCell>
                        <TableCell className="text-right text-red-600">
                          {formatCurrency(imp.total_gastos)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => eliminarImportacion(imp.lote_id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay importaciones registradas</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setModalImportOpen(true)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar datos históricos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Migración */}
        <TabsContent value="migracion" className="space-y-4">
          {/* Estado de integración */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Integración de Datos con P&L
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  ¿Por qué migrar datos?
                </h4>
                <p className="text-sm text-muted-foreground">
                  Los pedidos pagados y gastos marcados como pagados deben generar movimientos de caja
                  para aparecer en la Cuenta de Resultados (P&L). Este proceso migra los datos existentes
                  que aún no tienen movimiento asociado.
                </p>
              </div>

              {/* Estado actual */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${
                        migracionEstado?.pedidos_sin_movimiento === 0
                          ? "bg-green-100"
                          : "bg-yellow-100"
                      }`}>
                        <ShoppingBag className={`h-5 w-5 ${
                          migracionEstado?.pedidos_sin_movimiento === 0
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pedidos sin migrar</p>
                        <p className="text-2xl font-bold">
                          {migracionEstado?.pedidos_sin_movimiento ?? "-"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-full ${
                        migracionEstado?.gastos_sin_movimiento === 0
                          ? "bg-green-100"
                          : "bg-yellow-100"
                      }`}>
                        <Receipt className={`h-5 w-5 ${
                          migracionEstado?.gastos_sin_movimiento === 0
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Gastos sin migrar</p>
                        <p className="text-2xl font-bold">
                          {migracionEstado?.gastos_sin_movimiento ?? "-"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-blue-100">
                        <Database className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Movimientos totales</p>
                        <p className="text-2xl font-bold">
                          {migracionEstado?.total_en_cash_movements ?? "-"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Acciones de migración */}
              <div className="border rounded-lg p-4 space-y-4">
                <h4 className="font-medium">Ejecutar Migración</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => ejecutarMigracion("pedidos")}
                    disabled={migrando || migracionEstado?.pedidos_sin_movimiento === 0}
                  >
                    {migrando ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ShoppingBag className="h-5 w-5" />
                    )}
                    <span>Migrar Pedidos</span>
                    <span className="text-xs text-muted-foreground">
                      {migracionEstado?.pedidos_sin_movimiento ?? 0} pendientes
                    </span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => ejecutarMigracion("gastos")}
                    disabled={migrando || migracionEstado?.gastos_sin_movimiento === 0}
                  >
                    {migrando ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Receipt className="h-5 w-5" />
                    )}
                    <span>Migrar Gastos</span>
                    <span className="text-xs text-muted-foreground">
                      {migracionEstado?.gastos_sin_movimiento ?? 0} pendientes
                    </span>
                  </Button>

                  <Button
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => ejecutarMigracion("todo")}
                    disabled={migrando || (
                      migracionEstado?.pedidos_sin_movimiento === 0 &&
                      migracionEstado?.gastos_sin_movimiento === 0
                    )}
                  >
                    {migrando ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <PlayCircle className="h-5 w-5" />
                    )}
                    <span>Migrar Todo</span>
                    <span className="text-xs text-white/80">
                      Pedidos + Gastos
                    </span>
                  </Button>
                </div>
              </div>

              {/* Resultados de migración */}
              {resultadosMigracion.length > 0 && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Resultado de la Migración
                  </h4>
                  {resultadosMigracion.map((resultado, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg ${
                        resultado.registros_migrados > 0
                          ? "bg-green-50"
                          : "bg-muted"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium capitalize">{resultado.tipo}</span>
                        <Badge variant={resultado.registros_migrados > 0 ? "default" : "secondary"}>
                          {resultado.registros_migrados} registros
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {resultado.mensaje}
                      </p>
                      {resultado.total_importe > 0 && (
                        <p className="text-sm font-medium mt-1">
                          Total: {formatCurrency(resultado.total_importe)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Todo OK */}
              {migracionEstado?.pedidos_sin_movimiento === 0 &&
               migracionEstado?.gastos_sin_movimiento === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">
                      Todos los datos están integrados
                    </p>
                    <p className="text-sm text-green-600">
                      Los pedidos y gastos futuros se integrarán automáticamente
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Importación */}
      <Dialog open={modalImportOpen} onOpenChange={setModalImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar datos históricos</DialogTitle>
            <DialogDescription>
              Sube un archivo CSV con los datos de ingresos y gastos históricos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleImportar}
                ref={fileInputRef}
                className="hidden"
                id="csv-upload"
                disabled={importando}
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {importando ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {importando ? "Importando..." : "Haz clic para seleccionar archivo CSV"}
                </span>
              </label>
            </div>

            {resultadoImport && (
              <div
                className={`p-4 rounded-lg ${
                  resultadoImport.registros_error > 0
                    ? "bg-destructive/10"
                    : "bg-green-500/10"
                }`}
              >
                <h4 className="font-medium mb-2">Resultado de la importación</h4>
                <ul className="text-sm space-y-1">
                  <li>Registros procesados: {resultadoImport.registros_totales}</li>
                  <li className="text-green-600">
                    Importados correctamente: {resultadoImport.registros_importados}
                  </li>
                  {resultadoImport.registros_error > 0 && (
                    <li className="text-destructive">
                      Errores: {resultadoImport.registros_error}
                    </li>
                  )}
                </ul>
                {resultadoImport.errores.length > 0 && (
                  <div className="mt-2 text-xs text-destructive max-h-32 overflow-y-auto">
                    {resultadoImport.errores.map((err, i) => (
                      <div key={i}>
                        Línea {err.linea}: {err.error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Formato del CSV:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Separador: punto y coma (;)</li>
                <li>Columnas: anio, mes, tipo, categoria_codigo, categoria_nombre, importe, concepto</li>
                <li>Tipos: "ingreso" o "gasto"</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={descargarPlantilla}>
              <Download className="h-4 w-4 mr-2" />
              Descargar plantilla
            </Button>
            <Button variant="outline" onClick={() => setModalImportOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
