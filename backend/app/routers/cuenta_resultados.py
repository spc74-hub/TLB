"""
Router de Cuenta de Resultados (P&L) para The Lobby Beauty.
Gestiona el dashboard de P&L, importación de históricos y comparativas.
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from datetime import date, datetime
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel
import csv
import io
import uuid

from app.core.database import init_supabase


router = APIRouter(
    prefix="/cuenta-resultados",
    tags=["Cuenta de Resultados (P&L)"],
    responses={404: {"description": "No encontrado"}},
)


# ============== SCHEMAS ==============

class PLCategoria(BaseModel):
    id: int
    codigo: str
    nombre: str
    tipo: str
    orden_display: int
    activo: bool


class PLCategoriaCreate(BaseModel):
    codigo: str
    nombre: str
    tipo: str  # 'ingreso' o 'gasto'
    orden_display: int = 0


class PLHistorico(BaseModel):
    id: int
    anio: int
    mes: int
    tipo: str
    categoria_codigo: Optional[str]
    categoria_nombre: Optional[str]
    importe: Decimal
    concepto: Optional[str]
    origen: str


class PLResumenMensual(BaseModel):
    anio: int
    mes: int
    ingresos: Decimal
    gastos: Decimal
    resultado: Decimal


class PLResumenAnual(BaseModel):
    anio: int
    ingresos: Decimal
    gastos: Decimal
    resultado: Decimal
    meses: List[PLResumenMensual]


class PLComparativa(BaseModel):
    periodo_actual: PLResumenMensual
    periodo_anterior: PLResumenMensual
    variacion_ingresos: Decimal
    variacion_gastos: Decimal
    variacion_resultado: Decimal
    porcentaje_ingresos: Optional[Decimal]
    porcentaje_gastos: Optional[Decimal]
    porcentaje_resultado: Optional[Decimal]


class PLDesglose(BaseModel):
    categoria: str
    tipo: str
    importe: Decimal
    porcentaje: Optional[Decimal]


class PLDashboard(BaseModel):
    periodo_actual: PLResumenMensual
    periodo_anterior_mes: Optional[PLResumenMensual]
    periodo_anterior_anio: Optional[PLResumenMensual]
    desglose_ingresos: List[PLDesglose]
    desglose_gastos: List[PLDesglose]
    evolucion_mensual: List[PLResumenMensual]


class ImportacionResultado(BaseModel):
    lote_id: str
    registros_totales: int
    registros_importados: int
    registros_error: int
    errores: List[dict]


class MensajeRespuesta(BaseModel):
    mensaje: str


# ============== CATEGORÍAS P&L ==============

@router.get("/categorias", response_model=List[PLCategoria])
async def listar_categorias_pl(
    tipo: Optional[str] = None,
    activo: Optional[bool] = True,
):
    """Lista las categorías de P&L disponibles."""
    supabase = init_supabase()

    query = await supabase.table("pl_categories").select("*")

    if tipo:
        query = await query.eq("tipo", tipo)

    if activo is not None:
        query = await query.eq("activo", activo)

    query = await query.order("orden_display")
    response = await query.execute()

    return response.data


@router.post("/categorias", response_model=PLCategoria, status_code=201)
async def crear_categoria_pl(categoria: PLCategoriaCreate):
    """Crea una nueva categoría de P&L."""
    supabase = init_supabase()

    datos = categoria.model_dump()
    response = await supabase.table("pl_categories").insert(datos).execute()

    return response.data[0]


@router.delete("/categorias/{categoria_id}", response_model=MensajeRespuesta)
async def eliminar_categoria_pl(categoria_id: int):
    """Elimina (desactiva) una categoría de P&L."""
    supabase = init_supabase()

    # Verificar si hay registros asociados
    historicos = (
        supabase.table("pl_historicos")
        .select("id")
        .eq("categoria_id", categoria_id)
        await .limit(1).execute()
    )

    if historicos.data:
        # Soft delete
        supabase.table("pl_categories").update({"activo": False}).eq(
            "id", categoria_id
        await ).execute()
        return MensajeRespuesta(mensaje="Categoría desactivada (tiene registros asociados)")

    # Hard delete
    response = (
        await supabase.table("pl_categories").delete().eq("id", categoria_id).execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    return MensajeRespuesta(mensaje="Categoría eliminada correctamente")


# ============== DASHBOARD P&L ==============

@router.get("/dashboard", response_model=PLDashboard)
async def obtener_dashboard(
    anio: int = Query(default=None, description="Año a consultar"),
    mes: int = Query(default=None, ge=1, le=12, description="Mes a consultar"),
):
    """
    Obtiene el dashboard de P&L con:
    - Resumen del período actual
    - Comparativa con mes anterior
    - Comparativa con mismo mes año anterior
    - Desglose por categorías
    - Evolución mensual
    """
    supabase = init_supabase()

    # Fechas por defecto: mes actual
    hoy = date.today()
    anio = anio or hoy.year
    mes = mes or hoy.month

    # Calcular períodos de comparación
    if mes == 1:
        mes_anterior = 12
        anio_mes_anterior = anio - 1
    else:
        mes_anterior = mes - 1
        anio_mes_anterior = anio

    anio_anterior = anio - 1

    # Obtener datos del sistema actual (cash_movements)
    def get_datos_sistema(a: int, m: int) -> dict:
        fecha_inicio = date(a, m, 1)
        if m == 12:
            fecha_fin = date(a + 1, 1, 1)
        else:
            fecha_fin = date(a, m + 1, 1)

        response = (
            supabase.table("cash_movements")
            .select("tipo, importe, referencia_tipo")
            .gte("fecha", fecha_inicio.isoformat())
            await .lt("fecha", fecha_fin.isoformat()).execute()
        )

        ingresos = sum(float(r["importe"]) for r in response.data if r["tipo"] == "ingreso")
        gastos = sum(float(r["importe"]) for r in response.data if r["tipo"] == "gasto")

        return {
            "ingresos": ingresos,
            "gastos": gastos,
            "resultado": ingresos - gastos,
            "detalles": response.data
        }

    # Obtener datos históricos importados
    def get_datos_historicos(a: int, m: int) -> dict:
        response = (
            supabase.table("pl_historicos")
            .select("tipo, importe, categoria_codigo")
            .eq("anio", a)
            await .eq("mes", m).execute()
        )

        ingresos = sum(float(r["importe"]) for r in response.data if r["tipo"] == "ingreso")
        gastos = sum(float(r["importe"]) for r in response.data if r["tipo"] == "gasto")

        return {
            "ingresos": ingresos,
            "gastos": gastos,
            "resultado": ingresos - gastos,
            "detalles": response.data
        }

    # Combinar datos sistema + históricos
    def get_datos_periodo(a: int, m: int) -> PLResumenMensual:
        sistema = get_datos_sistema(a, m)
        historicos = get_datos_historicos(a, m)

        return PLResumenMensual(
            anio=a,
            mes=m,
            ingresos=Decimal(str(sistema["ingresos"] + historicos["ingresos"])),
            gastos=Decimal(str(sistema["gastos"] + historicos["gastos"])),
            resultado=Decimal(str(sistema["resultado"] + historicos["resultado"])),
        )

    # Período actual
    periodo_actual = get_datos_periodo(anio, mes)

    # Mes anterior
    periodo_anterior_mes = get_datos_periodo(anio_mes_anterior, mes_anterior)

    # Mismo mes año anterior
    periodo_anterior_anio = get_datos_periodo(anio_anterior, mes)

    # Desglose por categorías del período actual
    def get_desglose(a: int, m: int) -> tuple:
        # Datos del sistema
        fecha_inicio = date(a, m, 1)
        if m == 12:
            fecha_fin = date(a + 1, 1, 1)
        else:
            fecha_fin = date(a, m + 1, 1)

        sistema = (
            supabase.table("cash_movements")
            .select("tipo, importe, referencia_tipo")
            .gte("fecha", fecha_inicio.isoformat())
            await .lt("fecha", fecha_fin.isoformat()).execute()
        )

        # Datos históricos
        historicos = (
            supabase.table("pl_historicos")
            .select("tipo, importe, categoria_codigo, categoria_nombre")
            .eq("anio", a)
            await .eq("mes", m).execute()
        )

        # Agrupar ingresos
        ingresos = {}
        for r in sistema.data:
            if r["tipo"] == "ingreso":
                cat = r["referencia_tipo"] or "otros"
                ingresos[cat] = ingresos.get(cat, 0) + float(r["importe"])

        for r in historicos.data:
            if r["tipo"] == "ingreso":
                cat = r.get("categoria_nombre") or r.get("categoria_codigo") or "otros"
                ingresos[cat] = ingresos.get(cat, 0) + float(r["importe"])

        # Agrupar gastos
        gastos = {}
        for r in sistema.data:
            if r["tipo"] == "gasto":
                cat = r["referencia_tipo"] or "otros"
                gastos[cat] = gastos.get(cat, 0) + float(r["importe"])

        for r in historicos.data:
            if r["tipo"] == "gasto":
                cat = r.get("categoria_nombre") or r.get("categoria_codigo") or "otros"
                gastos[cat] = gastos.get(cat, 0) + float(r["importe"])

        # Convertir a lista con porcentajes
        total_ingresos = sum(ingresos.values()) or 1
        total_gastos = sum(gastos.values()) or 1

        desglose_ingresos = [
            PLDesglose(
                categoria=cat,
                tipo="ingreso",
                importe=Decimal(str(importe)),
                porcentaje=Decimal(str(round(importe / total_ingresos * 100, 2)))
            )
            for cat, importe in sorted(ingresos.items(), key=lambda x: -x[1])
        ]

        desglose_gastos = [
            PLDesglose(
                categoria=cat,
                tipo="gasto",
                importe=Decimal(str(importe)),
                porcentaje=Decimal(str(round(importe / total_gastos * 100, 2)))
            )
            for cat, importe in sorted(gastos.items(), key=lambda x: -x[1])
        ]

        return desglose_ingresos, desglose_gastos

    desglose_ingresos, desglose_gastos = get_desglose(anio, mes)

    # Evolución mensual (últimos 12 meses)
    evolucion = []
    for i in range(12):
        m = mes - i
        a = anio
        while m <= 0:
            m += 12
            a -= 1
        evolucion.append(get_datos_periodo(a, m))

    evolucion.reverse()

    return PLDashboard(
        periodo_actual=periodo_actual,
        periodo_anterior_mes=periodo_anterior_mes,
        periodo_anterior_anio=periodo_anterior_anio,
        desglose_ingresos=desglose_ingresos,
        desglose_gastos=desglose_gastos,
        evolucion_mensual=evolucion,
    )


@router.get("/comparativa", response_model=PLComparativa)
async def obtener_comparativa(
    anio_actual: int,
    mes_actual: int,
    anio_anterior: int,
    mes_anterior: int,
):
    """Compara dos períodos específicos."""
    supabase = init_supabase()

    def get_datos_periodo(a: int, m: int) -> PLResumenMensual:
        # Sistema
        fecha_inicio = date(a, m, 1)
        if m == 12:
            fecha_fin = date(a + 1, 1, 1)
        else:
            fecha_fin = date(a, m + 1, 1)

        sistema = (
            supabase.table("cash_movements")
            .select("tipo, importe")
            .gte("fecha", fecha_inicio.isoformat())
            await .lt("fecha", fecha_fin.isoformat()).execute()
        )

        # Históricos
        historicos = (
            supabase.table("pl_historicos")
            .select("tipo, importe")
            .eq("anio", a)
            await .eq("mes", m).execute()
        )

        ingresos = (
            sum(float(r["importe"]) for r in sistema.data if r["tipo"] == "ingreso") +
            sum(float(r["importe"]) for r in historicos.data if r["tipo"] == "ingreso")
        )
        gastos = (
            sum(float(r["importe"]) for r in sistema.data if r["tipo"] == "gasto") +
            sum(float(r["importe"]) for r in historicos.data if r["tipo"] == "gasto")
        )

        return PLResumenMensual(
            anio=a,
            mes=m,
            ingresos=Decimal(str(ingresos)),
            gastos=Decimal(str(gastos)),
            resultado=Decimal(str(ingresos - gastos)),
        )

    actual = get_datos_periodo(anio_actual, mes_actual)
    anterior = get_datos_periodo(anio_anterior, mes_anterior)

    var_ingresos = float(actual.ingresos) - float(anterior.ingresos)
    var_gastos = float(actual.gastos) - float(anterior.gastos)
    var_resultado = float(actual.resultado) - float(anterior.resultado)

    pct_ingresos = (var_ingresos / float(anterior.ingresos) * 100) if float(anterior.ingresos) > 0 else None
    pct_gastos = (var_gastos / float(anterior.gastos) * 100) if float(anterior.gastos) > 0 else None
    pct_resultado = (var_resultado / abs(float(anterior.resultado)) * 100) if float(anterior.resultado) != 0 else None

    return PLComparativa(
        periodo_actual=actual,
        periodo_anterior=anterior,
        variacion_ingresos=Decimal(str(var_ingresos)),
        variacion_gastos=Decimal(str(var_gastos)),
        variacion_resultado=Decimal(str(var_resultado)),
        porcentaje_ingresos=Decimal(str(round(pct_ingresos, 2))) if pct_ingresos is not None else None,
        porcentaje_gastos=Decimal(str(round(pct_gastos, 2))) if pct_gastos is not None else None,
        porcentaje_resultado=Decimal(str(round(pct_resultado, 2))) if pct_resultado is not None else None,
    )


@router.get("/resumen-anual", response_model=PLResumenAnual)
async def obtener_resumen_anual(anio: int):
    """Obtiene el resumen completo de un año."""
    supabase = init_supabase()

    meses = []
    total_ingresos = 0
    total_gastos = 0

    for mes in range(1, 13):
        # Sistema
        fecha_inicio = date(anio, mes, 1)
        if mes == 12:
            fecha_fin = date(anio + 1, 1, 1)
        else:
            fecha_fin = date(anio, mes + 1, 1)

        sistema = (
            supabase.table("cash_movements")
            .select("tipo, importe")
            .gte("fecha", fecha_inicio.isoformat())
            await .lt("fecha", fecha_fin.isoformat()).execute()
        )

        # Históricos
        historicos = (
            supabase.table("pl_historicos")
            .select("tipo, importe")
            .eq("anio", anio)
            await .eq("mes", mes).execute()
        )

        ingresos = (
            sum(float(r["importe"]) for r in sistema.data if r["tipo"] == "ingreso") +
            sum(float(r["importe"]) for r in historicos.data if r["tipo"] == "ingreso")
        )
        gastos = (
            sum(float(r["importe"]) for r in sistema.data if r["tipo"] == "gasto") +
            sum(float(r["importe"]) for r in historicos.data if r["tipo"] == "gasto")
        )

        meses.append(PLResumenMensual(
            anio=anio,
            mes=mes,
            ingresos=Decimal(str(ingresos)),
            gastos=Decimal(str(gastos)),
            resultado=Decimal(str(ingresos - gastos)),
        ))

        total_ingresos += ingresos
        total_gastos += gastos

    return PLResumenAnual(
        anio=anio,
        ingresos=Decimal(str(total_ingresos)),
        gastos=Decimal(str(total_gastos)),
        resultado=Decimal(str(total_ingresos - total_gastos)),
        meses=meses,
    )


# ============== IMPORTACIÓN CSV ==============

@router.post("/importar", response_model=ImportacionResultado)
async def importar_historicos(
    archivo: UploadFile = File(..., description="Archivo CSV con datos históricos"),
):
    """
    Importa datos históricos desde un archivo CSV.

    Formato esperado (separador: punto y coma):
    anio;mes;tipo;categoria_codigo;categoria_nombre;importe;concepto

    Ejemplo:
    2024;1;ingreso;ING_SERVICIOS;Ingresos por Servicios;8500.00;Servicios Enero 2024
    """
    supabase = init_supabase()

    if not archivo.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="El archivo debe ser CSV")

    lote_id = str(uuid.uuid4())
    contenido = await archivo.read()

    try:
        # Detectar encoding
        try:
            texto = contenido.decode('utf-8')
        except UnicodeDecodeError:
            texto = contenido.decode('latin-1')

        # Parsear CSV
        lector = csv.DictReader(io.StringIO(texto), delimiter=';')

        registros_totales = 0
        registros_importados = 0
        errores = []
        registros_a_insertar = []

        for i, fila in enumerate(lector, start=2):  # start=2 porque línea 1 es header
            registros_totales += 1

            try:
                # Validar campos requeridos
                if not fila.get('anio') or not fila.get('mes') or not fila.get('tipo') or not fila.get('importe'):
                    errores.append({
                        "linea": i,
                        "error": "Faltan campos requeridos (anio, mes, tipo, importe)"
                    })
                    continue

                # Validar valores
                anio = int(fila['anio'])
                mes = int(fila['mes'])
                tipo = fila['tipo'].strip().lower()
                importe = float(fila['importe'].replace(',', '.'))

                if mes < 1 or mes > 12:
                    errores.append({"linea": i, "error": f"Mes inválido: {mes}"})
                    continue

                if tipo not in ('ingreso', 'gasto'):
                    errores.append({"linea": i, "error": f"Tipo inválido: {tipo}"})
                    continue

                if importe < 0:
                    errores.append({"linea": i, "error": f"Importe negativo: {importe}"})
                    continue

                # Preparar registro
                registro = {
                    "anio": anio,
                    "mes": mes,
                    "tipo": tipo,
                    "categoria_codigo": fila.get('categoria_codigo', '').strip() or None,
                    "categoria_nombre": fila.get('categoria_nombre', '').strip() or None,
                    "importe": importe,
                    "concepto": fila.get('concepto', '').strip() or None,
                    "origen": "importado",
                    "lote_importacion": lote_id,
                    "archivo_origen": archivo.filename,
                    "linea_archivo": i,
                }

                registros_a_insertar.append(registro)

            except ValueError as e:
                errores.append({"linea": i, "error": f"Error de formato: {str(e)}"})
            except Exception as e:
                errores.append({"linea": i, "error": str(e)})

        # Insertar registros válidos
        if registros_a_insertar:
            # Insertar en lotes de 100
            for j in range(0, len(registros_a_insertar), 100):
                lote = registros_a_insertar[j:j+100]
                try:
                    await supabase.table("pl_historicos").insert(lote).execute()
                    registros_importados += len(lote)
                except Exception as e:
                    # Si falla el lote, intentar uno por uno
                    for reg in lote:
                        try:
                            await supabase.table("pl_historicos").insert(reg).execute()
                            registros_importados += 1
                        except Exception as e2:
                            errores.append({
                                "linea": reg.get("linea_archivo"),
                                "error": f"Error al insertar: {str(e2)}"
                            })

        # Registrar importación
        total_ingresos = sum(r["importe"] for r in registros_a_insertar if r["tipo"] == "ingreso")
        total_gastos = sum(r["importe"] for r in registros_a_insertar if r["tipo"] == "gasto")

        # Calcular rango de fechas
        if registros_a_insertar:
            anios = [r["anio"] for r in registros_a_insertar]
            meses = [r["mes"] for r in registros_a_insertar]
            anio_desde = min(anios)
            anio_hasta = max(anios)
            mes_desde = min(r["mes"] for r in registros_a_insertar if r["anio"] == anio_desde)
            mes_hasta = max(r["mes"] for r in registros_a_insertar if r["anio"] == anio_hasta)
        else:
            anio_desde = anio_hasta = mes_desde = mes_hasta = None

        supabase.table("pl_importaciones").insert({
            "lote_id": lote_id,
            "nombre_archivo": archivo.filename,
            "registros_totales": registros_totales,
            "registros_importados": registros_importados,
            "registros_error": len(errores),
            "anio_desde": anio_desde,
            "anio_hasta": anio_hasta,
            "mes_desde": mes_desde,
            "mes_hasta": mes_hasta,
            "total_ingresos": total_ingresos,
            "total_gastos": total_gastos,
            "errores": errores if errores else None,
        await }).execute()

        return ImportacionResultado(
            lote_id=lote_id,
            registros_totales=registros_totales,
            registros_importados=registros_importados,
            registros_error=len(errores),
            errores=errores[:20],  # Limitar errores mostrados
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando CSV: {str(e)}")


@router.get("/importaciones", response_model=List[dict])
async def listar_importaciones():
    """Lista el historial de importaciones realizadas."""
    supabase = init_supabase()

    response = (
        supabase.table("pl_importaciones")
        .select("*")
        .order("fecha_importacion", desc=True)
        await .limit(50).execute()
    )

    return response.data


@router.delete("/importaciones/{lote_id}", response_model=MensajeRespuesta)
async def eliminar_importacion(lote_id: str):
    """
    Elimina todos los registros de una importación específica.
    Útil para corregir importaciones erróneas.
    """
    supabase = init_supabase()

    # Verificar que existe la importación
    importacion = (
        supabase.table("pl_importaciones")
        .select("id, registros_importados")
        .eq("lote_id", lote_id)
        await .single().execute()
    )

    if not importacion.data:
        raise HTTPException(status_code=404, detail="Importación no encontrada")

    # Eliminar registros históricos del lote
    await supabase.table("pl_historicos").delete().eq("lote_importacion", lote_id).execute()

    # Eliminar registro de importación
    await supabase.table("pl_importaciones").delete().eq("lote_id", lote_id).execute()

    return MensajeRespuesta(
        mensaje=f"Importación eliminada ({importacion.data['registros_importados']} registros)"
    )


@router.get("/historicos", response_model=List[PLHistorico])
async def listar_historicos(
    anio: Optional[int] = None,
    mes: Optional[int] = None,
    tipo: Optional[str] = None,
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(50, ge=1, le=200),
):
    """Lista los registros históricos importados con filtros."""
    supabase = init_supabase()

    query = await supabase.table("pl_historicos").select("*", count="exact")

    if anio:
        query = await query.eq("anio", anio)

    if mes:
        query = await query.eq("mes", mes)

    if tipo:
        query = await query.eq("tipo", tipo)

    offset = (pagina - 1) * por_pagina
    query = await query.order("anio", desc=True).order("mes", desc=True).range(offset, offset + por_pagina - 1)

    response = await query.execute()

    return response.data


@router.get("/plantilla-csv")
async def descargar_plantilla():
    """
    Devuelve la plantilla CSV para importación de datos históricos.
    """
    plantilla = """anio;mes;tipo;categoria_codigo;categoria_nombre;importe;concepto
2024;1;ingreso;ING_SERVICIOS;Ingresos por Servicios;8500.00;Servicios Enero 2024
2024;1;ingreso;ING_PRODUCTOS;Venta de Productos;1200.00;Venta productos Enero 2024
2024;1;gasto;GAST_NOMINAS;Nóminas y SS;4500.00;Nóminas Enero 2024
2024;1;gasto;GAST_ALQUILER;Alquiler;1800.00;Alquiler local Enero 2024
2024;1;gasto;GAST_SUMINISTROS;Suministros;350.00;Luz, agua, internet Enero 2024"""

    return {
        "plantilla": plantilla,
        "instrucciones": {
            "separador": "punto y coma (;)",
            "encoding": "UTF-8 preferido, también acepta Latin-1",
            "campos_requeridos": ["anio", "mes", "tipo", "importe"],
            "campos_opcionales": ["categoria_codigo", "categoria_nombre", "concepto"],
            "tipos_validos": ["ingreso", "gasto"],
            "formato_importe": "decimal con punto (ej: 1234.56)",
            "categorias_disponibles": {
                "ingresos": ["ING_SERVICIOS", "ING_PRODUCTOS", "ING_RESERVAS", "ING_OTROS"],
                "gastos": ["GAST_NOMINAS", "GAST_ALQUILER", "GAST_SUMINISTROS", "GAST_MARKETING",
                          "GAST_PRODUCTOS", "GAST_FORMACION", "GAST_SEGUROS", "GAST_IMPUESTOS",
                          "GAST_MANTENIMIENTO", "GAST_OTROS"]
            }
        }
    }


# ============== MIGRACIÓN DE DATOS EXISTENTES ==============

class MigracionResultado(BaseModel):
    tipo: str
    registros_migrados: int
    total_importe: Decimal
    mensaje: str


class MigracionEstado(BaseModel):
    pedidos_sin_movimiento: int
    gastos_sin_movimiento: int
    total_en_cash_movements: int


@router.get("/migracion/estado", response_model=MigracionEstado)
async def obtener_estado_migracion():
    """
    Obtiene el estado actual de los datos para determinar si se necesita migración.
    Muestra cuántos pedidos/gastos no tienen movimiento de caja asociado.
    """
    supabase = init_supabase()

    # Pedidos pagados sin movimiento
    pedidos_query = """
        SELECT COUNT(*) as count
        FROM pedidos p
        WHERE p.estado IN ('pagado', 'preparando', 'enviado', 'entregado')
        AND NOT EXISTS (
            SELECT 1 FROM cash_movements cm
            WHERE cm.pedido_id = p.id
        )
    """
    # Usar query directa desde Python
    pedidos_sin_mov = (
        supabase.table("pedidos")
        .select("id", count="exact")
        await .in_("estado", ["pagado", "preparando", "enviado", "entregado"]).execute()
    )

    # Verificar cuáles tienen movimiento
    pedidos_ids = [p["id"] for p in pedidos_sin_mov.data] if pedidos_sin_mov.data else []
    pedidos_con_mov = 0
    if pedidos_ids:
        mov_check = (
            supabase.table("cash_movements")
            .select("pedido_id")
            await .in_("pedido_id", pedidos_ids).execute()
        )
        pedidos_con_mov = len(set(m["pedido_id"] for m in mov_check.data)) if mov_check.data else 0

    # Gastos pagados sin movimiento
    gastos_result = (
        supabase.table("expenses")
        .select("id", count="exact")
        .eq("pagado", True)
        await .is_("movimiento_id", "null").execute()
    )

    # Total en cash_movements
    movimientos_result = (
        supabase.table("cash_movements")
        await .select("id", count="exact").execute()
    )

    return MigracionEstado(
        pedidos_sin_movimiento=len(pedidos_ids) - pedidos_con_mov,
        gastos_sin_movimiento=gastos_result.count or 0,
        total_en_cash_movements=movimientos_result.count or 0,
    )


@router.post("/migracion/pedidos", response_model=MigracionResultado)
async def migrar_pedidos_existentes():
    """
    Migra todos los pedidos pagados que no tienen movimiento de caja.
    Crea movimientos de ingreso en la cuenta principal.

    IMPORTANTE: Solo ejecutar una vez o cuando haya nuevos datos sin migrar.
    """
    supabase = init_supabase()

    # Buscar cuenta principal
    cuenta = (
        supabase.table("cash_accounts")
        .select("id")
        .eq("es_principal", True)
        .eq("activo", True)
        await .limit(1).execute()
    )

    if not cuenta.data:
        cuenta = (
            supabase.table("cash_accounts")
            .select("id")
            .eq("activo", True)
            .order("id")
            await .limit(1).execute()
        )

    if not cuenta.data:
        raise HTTPException(
            status_code=400,
            detail="No hay cuentas de caja activas. Crea una cuenta primero."
        )

    cuenta_id = cuenta.data[0]["id"]

    # Obtener pedidos pagados
    pedidos_result = (
        supabase.table("pedidos")
        .select("id, total, nombre_envio, created_at, estado")
        .in_("estado", ["pagado", "preparando", "enviado", "entregado"])
        await .order("created_at").execute()
    )

    if not pedidos_result.data:
        return MigracionResultado(
            tipo="pedidos",
            registros_migrados=0,
            total_importe=Decimal("0"),
            mensaje="No hay pedidos pagados para migrar"
        )

    # Verificar cuáles ya tienen movimiento
    pedidos_ids = [p["id"] for p in pedidos_result.data]
    mov_existentes = (
        supabase.table("cash_movements")
        .select("pedido_id")
        await .in_("pedido_id", pedidos_ids).execute()
    )
    ids_con_movimiento = set(m["pedido_id"] for m in mov_existentes.data) if mov_existentes.data else set()

    # Filtrar pedidos que necesitan migración
    pedidos_a_migrar = [p for p in pedidos_result.data if p["id"] not in ids_con_movimiento]

    if not pedidos_a_migrar:
        return MigracionResultado(
            tipo="pedidos",
            registros_migrados=0,
            total_importe=Decimal("0"),
            mensaje="Todos los pedidos ya tienen movimiento de caja"
        )

    # Crear movimientos
    total_importe = Decimal("0")
    registros_migrados = 0

    for pedido in pedidos_a_migrar:
        try:
            movimiento_data = {
                "cuenta_id": cuenta_id,
                "tipo": "ingreso",
                "importe": float(pedido["total"]) if pedido["total"] else 0,
                "concepto": f"Pedido #{pedido['id']} - {pedido.get('nombre_envio', 'Cliente')}",
                "descripcion": "Venta de productos (migración histórica)",
                "fecha": pedido.get("created_at") or datetime.now().isoformat(),
                "referencia_tipo": "pedido",
                "pedido_id": pedido["id"],
            }

            await supabase.table("cash_movements").insert(movimiento_data).execute()
            total_importe += Decimal(str(pedido["total"])) if pedido["total"] else Decimal("0")
            registros_migrados += 1

        except Exception as e:
            print(f"Error migrando pedido {pedido['id']}: {e}")

    return MigracionResultado(
        tipo="pedidos",
        registros_migrados=registros_migrados,
        total_importe=total_importe,
        mensaje=f"Migrados {registros_migrados} pedidos correctamente"
    )


@router.post("/migracion/gastos", response_model=MigracionResultado)
async def migrar_gastos_existentes():
    """
    Migra todos los gastos pagados que no tienen movimiento de caja.
    Usa la cuenta de pago del gasto o la primera cuenta activa.

    IMPORTANTE: Solo ejecutar una vez o cuando haya nuevos datos sin migrar.
    """
    supabase = init_supabase()

    # Obtener cuenta por defecto
    cuenta_default = (
        supabase.table("cash_accounts")
        .select("id")
        .eq("activo", True)
        .order("id")
        await .limit(1).execute()
    )

    cuenta_default_id = cuenta_default.data[0]["id"] if cuenta_default.data else None

    if not cuenta_default_id:
        raise HTTPException(
            status_code=400,
            detail="No hay cuentas de caja activas. Crea una cuenta primero."
        )

    # Obtener gastos pagados sin movimiento
    gastos_result = (
        supabase.table("expenses")
        .select("id, importe, concepto, fecha, fecha_pago, cuenta_pago_id")
        .eq("pagado", True)
        .is_("movimiento_id", "null")
        await .order("fecha").execute()
    )

    if not gastos_result.data:
        return MigracionResultado(
            tipo="gastos",
            registros_migrados=0,
            total_importe=Decimal("0"),
            mensaje="No hay gastos pagados para migrar"
        )

    # Crear movimientos
    total_importe = Decimal("0")
    registros_migrados = 0

    for gasto in gastos_result.data:
        try:
            cuenta_id = gasto.get("cuenta_pago_id") or cuenta_default_id

            movimiento_data = {
                "cuenta_id": cuenta_id,
                "tipo": "gasto",
                "importe": float(gasto["importe"]) if gasto["importe"] else 0,
                "concepto": gasto.get("concepto", "Gasto"),
                "descripcion": "Gasto (migración histórica)",
                "fecha": gasto.get("fecha_pago") or gasto.get("fecha") or datetime.now().isoformat(),
                "referencia_tipo": "gasto",
                "gasto_id": gasto["id"],
            }

            mov_result = await supabase.table("cash_movements").insert(movimiento_data).execute()

            if mov_result.data:
                # Actualizar el gasto con el movimiento_id
                supabase.table("expenses").update({
                    "movimiento_id": mov_result.data[0]["id"],
                    "cuenta_pago_id": cuenta_id,
                await }).eq("id", gasto["id"]).execute()

                total_importe += Decimal(str(gasto["importe"])) if gasto["importe"] else Decimal("0")
                registros_migrados += 1

        except Exception as e:
            print(f"Error migrando gasto {gasto['id']}: {e}")

    return MigracionResultado(
        tipo="gastos",
        registros_migrados=registros_migrados,
        total_importe=total_importe,
        mensaje=f"Migrados {registros_migrados} gastos correctamente"
    )


@router.post("/migracion/todo", response_model=List[MigracionResultado])
async def migrar_todos_los_datos():
    """
    Ejecuta la migración completa: pedidos y gastos.
    Conveniente para ejecutar toda la migración de una vez.
    """
    resultados = []

    # Migrar pedidos
    resultado_pedidos = await migrar_pedidos_existentes()
    resultados.append(resultado_pedidos)

    # Migrar gastos
    resultado_gastos = await migrar_gastos_existentes()
    resultados.append(resultado_gastos)

    return resultados
