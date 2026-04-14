"""
Router de ingresos para The Lobby Beauty.
Vista consolidada de todos los ingresos: pedidos pagados, reservas, servicios.
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import date, datetime, timedelta
from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel

from app.core.database import init_supabase

router = APIRouter(
    prefix="/ingresos",
    tags=["Ingresos"],
    responses={404: {"description": "No encontrado"}},
)


# ============== MODELOS ==============

class IngresoItem(BaseModel):
    id: int
    tipo: str  # 'pedido', 'reserva', 'servicio', 'otro'
    fecha: str
    concepto: str
    cliente: Optional[str] = None
    importe: float
    estado: str
    referencia_id: Optional[int] = None


class IngresosStats(BaseModel):
    total_mes: float
    total_hoy: float
    total_semana: float
    num_transacciones_mes: int
    ticket_medio: float
    comparativa_mes_anterior: float  # porcentaje
    por_tipo: dict  # {'pedido': 500, 'reserva': 200, ...}


class IngresosListResponse(BaseModel):
    items: List[IngresoItem]
    total: int
    total_importe: float


class IngresosPorDia(BaseModel):
    fecha: str
    total: float
    num_transacciones: int


# ============== ENDPOINTS ==============

@router.get("/stats", response_model=IngresosStats)
async def get_ingresos_stats(
    mes: Optional[int] = None,
    anio: Optional[int] = None
):
    """
    Obtiene estadísticas de ingresos para el dashboard.
    Por defecto usa el mes y año actual.
    """
    supabase = init_supabase()

    hoy = date.today()
    mes = mes or hoy.month
    anio = anio or hoy.year

    # Calcular fechas
    primer_dia_mes = date(anio, mes, 1)
    if mes == 12:
        ultimo_dia_mes = date(anio + 1, 1, 1) - timedelta(days=1)
    else:
        ultimo_dia_mes = date(anio, mes + 1, 1) - timedelta(days=1)

    # Mes anterior
    if mes == 1:
        primer_dia_mes_ant = date(anio - 1, 12, 1)
        ultimo_dia_mes_ant = date(anio, 1, 1) - timedelta(days=1)
    else:
        primer_dia_mes_ant = date(anio, mes - 1, 1)
        ultimo_dia_mes_ant = primer_dia_mes - timedelta(days=1)

    inicio_semana = hoy - timedelta(days=hoy.weekday())

    # Convertir fechas a timestamps para comparar con timestamptz
    # Inicio del dia = 00:00:00, Fin del dia = 23:59:59
    primer_dia_mes_ts = f"{primer_dia_mes.isoformat()}T00:00:00"
    ultimo_dia_mes_ts = f"{ultimo_dia_mes.isoformat()}T23:59:59"
    hoy_inicio_ts = f"{hoy.isoformat()}T00:00:00"
    hoy_fin_ts = f"{hoy.isoformat()}T23:59:59"
    inicio_semana_ts = f"{inicio_semana.isoformat()}T00:00:00"
    primer_dia_mes_ant_ts = f"{primer_dia_mes_ant.isoformat()}T00:00:00"
    ultimo_dia_mes_ant_ts = f"{ultimo_dia_mes_ant.isoformat()}T23:59:59"

    # Obtener movimientos de ingreso del mes
    movimientos_mes = (
        supabase.table("cash_movements")
        .select("id, importe, fecha, concepto, referencia_tipo")
        .eq("tipo", "ingreso")
        .gte("fecha", primer_dia_mes_ts)
        await .lte("fecha", ultimo_dia_mes_ts).execute()
    )

    # Movimientos de hoy
    movimientos_hoy = (
        supabase.table("cash_movements")
        .select("id, importe")
        .eq("tipo", "ingreso")
        .gte("fecha", hoy_inicio_ts)
        await .lte("fecha", hoy_fin_ts).execute()
    )

    # Movimientos de la semana
    movimientos_semana = (
        supabase.table("cash_movements")
        .select("id, importe")
        .eq("tipo", "ingreso")
        .gte("fecha", inicio_semana_ts)
        await .lte("fecha", hoy_fin_ts).execute()
    )

    # Movimientos mes anterior (para comparativa)
    movimientos_mes_ant = (
        supabase.table("cash_movements")
        .select("id, importe")
        .eq("tipo", "ingreso")
        .gte("fecha", primer_dia_mes_ant_ts)
        await .lte("fecha", ultimo_dia_mes_ant_ts).execute()
    )

    # Calcular totales
    total_mes = sum(float(m["importe"] or 0) for m in movimientos_mes.data) if movimientos_mes.data else 0
    total_hoy = sum(float(m["importe"] or 0) for m in movimientos_hoy.data) if movimientos_hoy.data else 0
    total_semana = sum(float(m["importe"] or 0) for m in movimientos_semana.data) if movimientos_semana.data else 0
    total_mes_ant = sum(float(m["importe"] or 0) for m in movimientos_mes_ant.data) if movimientos_mes_ant.data else 0

    num_transacciones = len(movimientos_mes.data) if movimientos_mes.data else 0
    ticket_medio = total_mes / num_transacciones if num_transacciones > 0 else 0

    # Comparativa con mes anterior
    if total_mes_ant > 0:
        comparativa = ((total_mes - total_mes_ant) / total_mes_ant) * 100
    else:
        comparativa = 100 if total_mes > 0 else 0

    # Agrupar por tipo
    por_tipo = {}
    for m in (movimientos_mes.data or []):
        tipo = m.get("referencia_tipo") or "otro"
        por_tipo[tipo] = por_tipo.get(tipo, 0) + float(m["importe"] or 0)

    return IngresosStats(
        total_mes=round(total_mes, 2),
        total_hoy=round(total_hoy, 2),
        total_semana=round(total_semana, 2),
        num_transacciones_mes=num_transacciones,
        ticket_medio=round(ticket_medio, 2),
        comparativa_mes_anterior=round(comparativa, 1),
        por_tipo=por_tipo
    )


@router.get("/", response_model=IngresosListResponse)
async def get_ingresos(
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    tipo: Optional[str] = None,  # 'pedido', 'reserva', 'servicio', 'otro'
    buscar: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0
):
    """
    Lista todos los ingresos con filtros opcionales.
    Combina datos de cash_movements con información de pedidos/reservas.
    """
    supabase = init_supabase()

    # Fechas por defecto: último mes
    if not fecha_desde:
        fecha_desde = (date.today() - timedelta(days=30)).isoformat()
    if not fecha_hasta:
        fecha_hasta = date.today().isoformat()

    # Consulta base
    query = (
        supabase.table("cash_movements")
        .select("id, importe, fecha, concepto, descripcion, referencia_tipo, pedido_id, reserva_id")
        .eq("tipo", "ingreso")
        .gte("fecha", fecha_desde)
        .lte("fecha", fecha_hasta)
        .order("fecha", desc=True)
    )

    if tipo:
        query = await query.eq("referencia_tipo", tipo)

    result = await query.execute()

    if not result.data:
        return IngresosListResponse(items=[], total=0, total_importe=0)

    # Obtener información adicional de pedidos
    pedido_ids = [m["pedido_id"] for m in result.data if m.get("pedido_id")]
    pedidos_info = {}
    if pedido_ids:
        pedidos_result = (
            supabase.table("pedidos")
            .select("id, nombre_envio, estado")
            await .in_("id", pedido_ids).execute()
        )
        pedidos_info = {p["id"]: p for p in (pedidos_result.data or [])}

    # Construir lista de items
    items = []
    for m in result.data:
        cliente = None
        estado = "completado"

        if m.get("pedido_id") and m["pedido_id"] in pedidos_info:
            pedido = pedidos_info[m["pedido_id"]]
            cliente = pedido.get("nombre_envio")
            estado = pedido.get("estado", "completado")

        # Filtrar por búsqueda
        if buscar:
            buscar_lower = buscar.lower()
            if not (
                buscar_lower in (m.get("concepto") or "").lower() or
                buscar_lower in (cliente or "").lower()
            ):
                continue

        items.append(IngresoItem(
            id=m["id"],
            tipo=m.get("referencia_tipo") or "otro",
            fecha=m["fecha"],
            concepto=m.get("concepto") or "Ingreso",
            cliente=cliente,
            importe=float(m["importe"] or 0),
            estado=estado,
            referencia_id=m.get("pedido_id") or m.get("reserva_id")
        ))

    # Paginación
    total = len(items)
    total_importe = sum(i.importe for i in items)
    items_paginated = items[offset:offset + limit]

    return IngresosListResponse(
        items=items_paginated,
        total=total,
        total_importe=round(total_importe, 2)
    )


@router.get("/por-dia")
async def get_ingresos_por_dia(
    dias: int = Query(30, le=365),
):
    """
    Obtiene ingresos agrupados por día para gráficos.
    """
    supabase = init_supabase()

    fecha_desde = (date.today() - timedelta(days=dias)).isoformat()

    result = (
        supabase.table("cash_movements")
        .select("fecha, importe")
        .eq("tipo", "ingreso")
        .gte("fecha", fecha_desde)
        await .order("fecha").execute()
    )

    # Agrupar por día
    por_dia = {}
    for m in (result.data or []):
        fecha = m["fecha"]
        if fecha not in por_dia:
            por_dia[fecha] = {"total": 0, "num": 0}
        por_dia[fecha]["total"] += float(m["importe"] or 0)
        por_dia[fecha]["num"] += 1

    # Convertir a lista ordenada
    items = [
        IngresosPorDia(
            fecha=fecha,
            total=round(data["total"], 2),
            num_transacciones=data["num"]
        )
        for fecha, data in sorted(por_dia.items())
    ]

    return items


@router.get("/por-tipo")
async def get_ingresos_por_tipo(
    mes: Optional[int] = None,
    anio: Optional[int] = None
):
    """
    Obtiene desglose de ingresos por tipo (pedido, reserva, etc.)
    """
    supabase = init_supabase()

    hoy = date.today()
    mes = mes or hoy.month
    anio = anio or hoy.year

    primer_dia = date(anio, mes, 1)
    if mes == 12:
        ultimo_dia = date(anio + 1, 1, 1) - timedelta(days=1)
    else:
        ultimo_dia = date(anio, mes + 1, 1) - timedelta(days=1)

    # Convertir a timestamps
    primer_dia_ts = f"{primer_dia.isoformat()}T00:00:00"
    ultimo_dia_ts = f"{ultimo_dia.isoformat()}T23:59:59"

    result = (
        supabase.table("cash_movements")
        .select("referencia_tipo, importe")
        .eq("tipo", "ingreso")
        .gte("fecha", primer_dia_ts)
        await .lte("fecha", ultimo_dia_ts).execute()
    )

    # Agrupar por tipo
    por_tipo = {}
    total = 0
    for m in (result.data or []):
        tipo = m.get("referencia_tipo") or "otro"
        importe = float(m["importe"] or 0)
        por_tipo[tipo] = por_tipo.get(tipo, 0) + importe
        total += importe

    # Añadir porcentajes
    resultado = []
    for tipo, importe in por_tipo.items():
        resultado.append({
            "tipo": tipo,
            "importe": round(importe, 2),
            "porcentaje": round((importe / total * 100) if total > 0 else 0, 1),
            "label": {
                "pedido": "Ventas Productos",
                "reserva": "Reservas/Servicios",
                "servicio": "Servicios",
                "otro": "Otros Ingresos"
            }.get(tipo, tipo.capitalize())
        })

    return sorted(resultado, key=lambda x: x["importe"], reverse=True)


@router.get("/top-clientes")
async def get_top_clientes(
    mes: Optional[int] = None,
    anio: Optional[int] = None,
    limit: int = 10
):
    """
    Obtiene los clientes con más compras en el período.
    """
    supabase = init_supabase()

    hoy = date.today()
    mes = mes or hoy.month
    anio = anio or hoy.year

    primer_dia = date(anio, mes, 1)
    if mes == 12:
        ultimo_dia = date(anio + 1, 1, 1) - timedelta(days=1)
    else:
        ultimo_dia = date(anio, mes + 1, 1) - timedelta(days=1)

    # Convertir a timestamps
    primer_dia_ts = f"{primer_dia.isoformat()}T00:00:00"
    ultimo_dia_ts = f"{ultimo_dia.isoformat()}T23:59:59"

    # Obtener movimientos con pedido_id
    movimientos = (
        supabase.table("cash_movements")
        .select("pedido_id, importe")
        .eq("tipo", "ingreso")
        .not_.is_("pedido_id", "null")
        .gte("fecha", primer_dia_ts)
        await .lte("fecha", ultimo_dia_ts).execute()
    )

    if not movimientos.data:
        return []

    # Obtener info de pedidos
    pedido_ids = list(set(m["pedido_id"] for m in movimientos.data))
    pedidos = (
        supabase.table("pedidos")
        .select("id, nombre_envio")
        await .in_("id", pedido_ids).execute()
    )

    pedidos_info = {p["id"]: p for p in (pedidos.data or [])}

    # Agrupar por cliente
    por_cliente = {}
    for m in movimientos.data:
        pedido = pedidos_info.get(m["pedido_id"], {})
        nombre = pedido.get("nombre_envio") or "Cliente Anónimo"

        if nombre not in por_cliente:
            por_cliente[nombre] = {"total": 0, "num_compras": 0}
        por_cliente[nombre]["total"] += float(m["importe"] or 0)
        por_cliente[nombre]["num_compras"] += 1

    # Ordenar y limitar
    resultado = [
        {
            "cliente": nombre,
            "total": round(data["total"], 2),
            "num_compras": data["num_compras"]
        }
        for nombre, data in sorted(por_cliente.items(), key=lambda x: x[1]["total"], reverse=True)[:limit]
    ]

    return resultado
