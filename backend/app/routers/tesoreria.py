"""
Router de tesorería para The Lobby Beauty.
Gestiona cuentas de caja, movimientos, cierres y previsión de liquidez.
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import date, datetime, timedelta
from typing import Optional

from app.models.schemas import (
    CashAccount,
    CashAccountCreate,
    CashAccountUpdate,
    CashMovement,
    CashMovementCreate,
    CashMovementWithDetails,
    ListaCashMovements,
    CashClosing,
    CashClosingCreate,
    CashClosingWithDetails,
    ListaCashClosings,
    CashStats,
    TipoCuenta,
    TipoMovimiento,
    ReferenciaMovimiento,
    TransferenciaCreate,
    LiquidityForecastResponse,
    LiquidityForecast,
    PLDashboardData,
    MensajeRespuesta,
)
from app.core.database import init_supabase


router = APIRouter(
    prefix="/tesoreria",
    tags=["Tesorería"],
    responses={404: {"description": "No encontrado"}},
)


# ============== CUENTAS DE CAJA ==============

@router.get("/cuentas", response_model=list[CashAccount])
async def listar_cuentas(
    activo: Optional[bool] = None,
    tipo: Optional[TipoCuenta] = None,
):
    """Lista todas las cuentas de caja."""
    supabase = init_supabase()

    query = supabase.table("cash_accounts").select("*")

    if activo is not None:
        query = query.eq("activo", activo)

    if tipo:
        query = query.eq("tipo", tipo.value)

    query = query.order("es_principal", desc=True).order("nombre")
    response = query.execute()

    return response.data


@router.get("/cuentas/{cuenta_id}", response_model=CashAccount)
async def obtener_cuenta(cuenta_id: int):
    """Obtiene una cuenta por su ID."""
    supabase = init_supabase()

    response = (
        supabase.table("cash_accounts")
        .select("*")
        .eq("id", cuenta_id)
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    return response.data


@router.post("/cuentas", response_model=CashAccount, status_code=201)
async def crear_cuenta(cuenta: CashAccountCreate):
    """Crea una nueva cuenta de caja."""
    supabase = init_supabase()

    datos = cuenta.model_dump()
    datos["tipo"] = datos["tipo"].value
    datos["balance_actual"] = datos["balance_inicial"]

    # Si es principal, quitar el flag de otras cuentas
    if datos.get("es_principal"):
        supabase.table("cash_accounts").update({"es_principal": False}).eq(
            "es_principal", True
        ).execute()

    response = supabase.table("cash_accounts").insert(datos).execute()

    return response.data[0]


@router.put("/cuentas/{cuenta_id}", response_model=CashAccount)
async def actualizar_cuenta(cuenta_id: int, cuenta: CashAccountUpdate):
    """Actualiza una cuenta de caja."""
    supabase = init_supabase()

    datos = {k: v for k, v in cuenta.model_dump().items() if v is not None}

    if "tipo" in datos and datos["tipo"]:
        datos["tipo"] = datos["tipo"].value

    if not datos:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    # Si es principal, quitar el flag de otras cuentas
    if datos.get("es_principal"):
        supabase.table("cash_accounts").update({"es_principal": False}).neq(
            "id", cuenta_id
        ).execute()

    response = (
        supabase.table("cash_accounts")
        .update(datos)
        .eq("id", cuenta_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    return response.data[0]


@router.delete("/cuentas/{cuenta_id}", response_model=MensajeRespuesta)
async def eliminar_cuenta(cuenta_id: int):
    """Elimina una cuenta de caja (soft delete si tiene movimientos)."""
    supabase = init_supabase()

    # Verificar si tiene movimientos
    movimientos = (
        supabase.table("cash_movements")
        .select("id")
        .eq("cuenta_id", cuenta_id)
        .limit(1)
        .execute()
    )

    if movimientos.data:
        supabase.table("cash_accounts").update({"activo": False}).eq(
            "id", cuenta_id
        ).execute()
        return MensajeRespuesta(mensaje="Cuenta desactivada (tiene movimientos asociados)")

    response = (
        supabase.table("cash_accounts").delete().eq("id", cuenta_id).execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    return MensajeRespuesta(mensaje="Cuenta eliminada correctamente")


# ============== MOVIMIENTOS DE CAJA ==============

@router.get("/movimientos", response_model=ListaCashMovements)
async def listar_movimientos(
    cuenta_id: Optional[int] = None,
    tipo: Optional[TipoMovimiento] = None,
    referencia_tipo: Optional[ReferenciaMovimiento] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
):
    """Lista movimientos de caja con filtros y paginación."""
    supabase = init_supabase()

    query = supabase.table("cash_movements").select(
        "*, cash_accounts!cuenta_id(nombre, tipo), cuenta_destino:cash_accounts!cuenta_destino_id(nombre)",
        count="exact"
    )

    if cuenta_id:
        query = query.eq("cuenta_id", cuenta_id)

    if tipo:
        query = query.eq("tipo", tipo.value)

    if referencia_tipo:
        query = query.eq("referencia_tipo", referencia_tipo.value)

    if fecha_desde:
        query = query.gte("fecha", fecha_desde.isoformat())

    if fecha_hasta:
        fecha_hasta_fin = datetime.combine(fecha_hasta, datetime.max.time())
        query = query.lte("fecha", fecha_hasta_fin.isoformat())

    # Ordenar y paginar
    offset = (pagina - 1) * por_pagina
    query = query.order("fecha", desc=True).range(offset, offset + por_pagina - 1)

    response = query.execute()

    # Transformar respuesta
    items = []
    for item in response.data:
        cuenta = item.pop("cash_accounts", None)
        cuenta_destino = item.pop("cuenta_destino", None)

        mov = CashMovementWithDetails(
            **item,
            cuenta_nombre=cuenta.get("nombre") if cuenta else "",
            cuenta_tipo=TipoCuenta(cuenta.get("tipo")) if cuenta else TipoCuenta.EFECTIVO,
            cuenta_destino_nombre=cuenta_destino.get("nombre") if cuenta_destino else None,
        )
        items.append(mov)

    return ListaCashMovements(
        items=items,
        total=response.count or 0,
        pagina=pagina,
        por_pagina=por_pagina,
    )


@router.post("/movimientos", response_model=CashMovement, status_code=201)
async def crear_movimiento(movimiento: CashMovementCreate):
    """
    Crea un nuevo movimiento de caja.
    El balance de la cuenta se actualiza automáticamente via trigger.
    """
    supabase = init_supabase()

    datos = movimiento.model_dump()
    datos["tipo"] = datos["tipo"].value
    datos["referencia_tipo"] = datos["referencia_tipo"].value

    # Remover cuenta_destino_id si no es transferencia
    if datos["referencia_tipo"] != "transferencia":
        datos.pop("cuenta_destino_id", None)

    response = supabase.table("cash_movements").insert(datos).execute()

    return response.data[0]


@router.delete("/movimientos/{movimiento_id}", response_model=MensajeRespuesta)
async def eliminar_movimiento(movimiento_id: int):
    """
    Elimina un movimiento de caja.
    El balance se ajusta automáticamente via trigger.
    """
    supabase = init_supabase()

    # Verificar que no sea parte de un cierre
    movimiento = (
        supabase.table("cash_movements")
        .select("referencia_tipo")
        .eq("id", movimiento_id)
        .single()
        .execute()
    )

    if not movimiento.data:
        raise HTTPException(status_code=404, detail="Movimiento no encontrado")

    if movimiento.data.get("referencia_tipo") == "cierre":
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar un movimiento de cierre"
        )

    supabase.table("cash_movements").delete().eq("id", movimiento_id).execute()

    return MensajeRespuesta(mensaje="Movimiento eliminado correctamente")


@router.post("/transferencia", response_model=MensajeRespuesta)
async def crear_transferencia(transferencia: TransferenciaCreate):
    """
    Crea una transferencia entre dos cuentas.
    Genera dos movimientos: gasto en origen, ingreso en destino.
    """
    supabase = init_supabase()

    if transferencia.cuenta_origen_id == transferencia.cuenta_destino_id:
        raise HTTPException(
            status_code=400,
            detail="Las cuentas origen y destino deben ser diferentes"
        )

    # Verificar que ambas cuentas existen
    cuentas = (
        supabase.table("cash_accounts")
        .select("id, nombre")
        .in_("id", [transferencia.cuenta_origen_id, transferencia.cuenta_destino_id])
        .execute()
    )

    if len(cuentas.data) != 2:
        raise HTTPException(status_code=404, detail="Una o ambas cuentas no existen")

    cuenta_origen = next(c for c in cuentas.data if c["id"] == transferencia.cuenta_origen_id)
    cuenta_destino = next(c for c in cuentas.data if c["id"] == transferencia.cuenta_destino_id)

    # Crear movimiento de salida (gasto en origen)
    mov_salida = supabase.table("cash_movements").insert({
        "cuenta_id": transferencia.cuenta_origen_id,
        "tipo": "gasto",
        "importe": transferencia.importe,
        "concepto": f"Transferencia a {cuenta_destino['nombre']}",
        "descripcion": transferencia.concepto,
        "referencia_tipo": "transferencia",
        "cuenta_destino_id": transferencia.cuenta_destino_id,
        "notas": transferencia.notas,
    }).execute()

    # Crear movimiento de entrada (ingreso en destino)
    mov_entrada = supabase.table("cash_movements").insert({
        "cuenta_id": transferencia.cuenta_destino_id,
        "tipo": "ingreso",
        "importe": transferencia.importe,
        "concepto": f"Transferencia desde {cuenta_origen['nombre']}",
        "descripcion": transferencia.concepto,
        "referencia_tipo": "transferencia",
        "movimiento_relacionado_id": mov_salida.data[0]["id"],
        "notas": transferencia.notas,
    }).execute()

    # Actualizar movimiento de salida con referencia al de entrada
    supabase.table("cash_movements").update({
        "movimiento_relacionado_id": mov_entrada.data[0]["id"]
    }).eq("id", mov_salida.data[0]["id"]).execute()

    return MensajeRespuesta(
        mensaje=f"Transferencia de {transferencia.importe}€ realizada correctamente"
    )


# ============== CIERRES DE CAJA ==============

@router.get("/cierres", response_model=ListaCashClosings)
async def listar_cierres(
    cuenta_id: Optional[int] = None,
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
):
    """Lista cierres de caja con filtros y paginación."""
    supabase = init_supabase()

    query = supabase.table("cash_closings").select(
        "*, cash_accounts(nombre, tipo)",
        count="exact"
    )

    if cuenta_id:
        query = query.eq("cuenta_id", cuenta_id)

    if fecha_desde:
        query = query.gte("fecha", fecha_desde.isoformat())

    if fecha_hasta:
        query = query.lte("fecha", fecha_hasta.isoformat())

    offset = (pagina - 1) * por_pagina
    query = query.order("fecha", desc=True).range(offset, offset + por_pagina - 1)

    response = query.execute()

    items = []
    for item in response.data:
        cuenta = item.pop("cash_accounts", None)
        cierre = CashClosingWithDetails(
            **item,
            cuenta_nombre=cuenta.get("nombre") if cuenta else "",
            cuenta_tipo=TipoCuenta(cuenta.get("tipo")) if cuenta else TipoCuenta.EFECTIVO,
        )
        items.append(cierre)

    return ListaCashClosings(
        items=items,
        total=response.count or 0,
        pagina=pagina,
        por_pagina=por_pagina,
    )


@router.post("/cierres", response_model=CashClosing, status_code=201)
async def crear_cierre(cierre: CashClosingCreate):
    """
    Crea un cierre de caja para una cuenta en una fecha.
    Calcula automáticamente los totales del día.
    """
    supabase = init_supabase()

    # Verificar que no exista cierre para esa cuenta y fecha
    existente = (
        supabase.table("cash_closings")
        .select("id")
        .eq("cuenta_id", cierre.cuenta_id)
        .eq("fecha", cierre.fecha.isoformat())
        .execute()
    )

    if existente.data:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un cierre para esta cuenta en esta fecha"
        )

    # Obtener cuenta
    cuenta = (
        supabase.table("cash_accounts")
        .select("balance_actual")
        .eq("id", cierre.cuenta_id)
        .single()
        .execute()
    )

    if not cuenta.data:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    # Obtener el cierre anterior para calcular balance de apertura
    cierre_anterior = (
        supabase.table("cash_closings")
        .select("balance_cierre_real")
        .eq("cuenta_id", cierre.cuenta_id)
        .lt("fecha", cierre.fecha.isoformat())
        .order("fecha", desc=True)
        .limit(1)
        .execute()
    )

    if cierre_anterior.data:
        balance_apertura = cierre_anterior.data[0]["balance_cierre_real"]
    else:
        # Si no hay cierre anterior, usar el balance inicial de la cuenta
        cuenta_info = (
            supabase.table("cash_accounts")
            .select("balance_inicial")
            .eq("id", cierre.cuenta_id)
            .single()
            .execute()
        )
        balance_apertura = cuenta_info.data["balance_inicial"]

    # Calcular movimientos del día
    fecha_inicio = datetime.combine(cierre.fecha, datetime.min.time())
    fecha_fin = datetime.combine(cierre.fecha, datetime.max.time())

    movimientos = (
        supabase.table("cash_movements")
        .select("tipo, importe, referencia_tipo")
        .eq("cuenta_id", cierre.cuenta_id)
        .gte("fecha", fecha_inicio.isoformat())
        .lte("fecha", fecha_fin.isoformat())
        .execute()
    )

    total_ingresos = sum(
        float(m["importe"]) for m in movimientos.data if m["tipo"] == "ingreso"
    )
    total_gastos = sum(
        float(m["importe"]) for m in movimientos.data if m["tipo"] == "gasto"
    )
    num_operaciones = len(movimientos.data)

    # Desglose por tipo de referencia
    desglose_ingresos = {}
    desglose_gastos = {}
    for m in movimientos.data:
        ref = m["referencia_tipo"]
        importe = float(m["importe"])
        if m["tipo"] == "ingreso":
            desglose_ingresos[ref] = desglose_ingresos.get(ref, 0) + importe
        else:
            desglose_gastos[ref] = desglose_gastos.get(ref, 0) + importe

    balance_cierre_teorico = balance_apertura + total_ingresos - total_gastos

    # Crear cierre
    datos_cierre = {
        "cuenta_id": cierre.cuenta_id,
        "fecha": cierre.fecha.isoformat(),
        "balance_apertura": balance_apertura,
        "balance_cierre_teorico": balance_cierre_teorico,
        "balance_cierre_real": cierre.balance_cierre_real,
        "total_ingresos": total_ingresos,
        "total_gastos": total_gastos,
        "num_operaciones": num_operaciones,
        "desglose_ingresos": desglose_ingresos,
        "desglose_gastos": desglose_gastos,
        "notas": cierre.notas,
    }

    response = supabase.table("cash_closings").insert(datos_cierre).execute()

    return response.data[0]


# ============== ESTADÍSTICAS ==============

@router.get("/stats", response_model=CashStats)
async def obtener_estadisticas():
    """Obtiene estadísticas generales de tesorería."""
    supabase = init_supabase()

    # Balances por tipo de cuenta
    cuentas = (
        supabase.table("cash_accounts")
        .select("tipo, balance_actual")
        .eq("activo", True)
        .execute()
    )

    balance_total = sum(float(c["balance_actual"]) for c in cuentas.data)
    balance_efectivo = sum(
        float(c["balance_actual"]) for c in cuentas.data if c["tipo"] == "efectivo"
    )
    balance_banco = sum(
        float(c["balance_actual"]) for c in cuentas.data if c["tipo"] == "banco"
    )

    # Movimientos de hoy
    hoy_inicio = datetime.combine(date.today(), datetime.min.time())
    hoy_fin = datetime.combine(date.today(), datetime.max.time())

    movimientos_hoy = (
        supabase.table("cash_movements")
        .select("tipo, importe")
        .gte("fecha", hoy_inicio.isoformat())
        .lte("fecha", hoy_fin.isoformat())
        .execute()
    )

    ingresos_hoy = sum(
        float(m["importe"]) for m in movimientos_hoy.data if m["tipo"] == "ingreso"
    )
    gastos_hoy = sum(
        float(m["importe"]) for m in movimientos_hoy.data if m["tipo"] == "gasto"
    )

    # Movimientos del mes actual
    hoy = date.today()
    inicio_mes = date(hoy.year, hoy.month, 1)
    mes_inicio = datetime.combine(inicio_mes, datetime.min.time())

    movimientos_mes = (
        supabase.table("cash_movements")
        .select("tipo, importe")
        .gte("fecha", mes_inicio.isoformat())
        .lte("fecha", hoy_fin.isoformat())
        .execute()
    )

    ingresos_mes = sum(
        float(m["importe"]) for m in movimientos_mes.data if m["tipo"] == "ingreso"
    )
    gastos_mes = sum(
        float(m["importe"]) for m in movimientos_mes.data if m["tipo"] == "gasto"
    )

    # Último cierre
    ultimo_cierre = (
        supabase.table("cash_closings")
        .select("fecha")
        .order("fecha", desc=True)
        .limit(1)
        .execute()
    )

    return CashStats(
        balance_total=balance_total,
        balance_efectivo=balance_efectivo,
        balance_banco=balance_banco,
        ingresos_hoy=ingresos_hoy,
        gastos_hoy=gastos_hoy,
        movimientos_hoy=len(movimientos_hoy.data),
        ingresos_mes=ingresos_mes,
        gastos_mes=gastos_mes,
        num_movimientos_mes=len(movimientos_mes.data),
        ultimo_cierre=ultimo_cierre.data[0]["fecha"] if ultimo_cierre.data else None,
    )


@router.get("/prevision", response_model=LiquidityForecastResponse)
async def obtener_prevision_liquidez(dias: int = Query(30, ge=7, le=90)):
    """
    Obtiene previsión de liquidez para los próximos días.
    Considera gastos recurrentes y vencimientos programados.
    """
    supabase = init_supabase()

    # Balance actual total
    cuentas = (
        supabase.table("cash_accounts")
        .select("balance_actual")
        .eq("activo", True)
        .execute()
    )
    balance_actual = sum(float(c["balance_actual"]) for c in cuentas.data)

    # Gastos pendientes con vencimiento
    gastos_pendientes = (
        supabase.table("expenses")
        .select("importe, fecha_vencimiento")
        .eq("pagado", False)
        .not_.is_("fecha_vencimiento", "null")
        .lte("fecha_vencimiento", (date.today() + timedelta(days=dias)).isoformat())
        .execute()
    )

    # Gastos recurrentes activos
    gastos_recurrentes = (
        supabase.table("expenses")
        .select("importe, frecuencia")
        .eq("es_recurrente", True)
        .is_("gasto_padre_id", "null")
        .or_(f"fecha_fin_recurrencia.is.null,fecha_fin_recurrencia.gte.{date.today().isoformat()}")
        .execute()
    )

    # Calcular gasto recurrente mensual aproximado
    gasto_recurrente_mensual = 0
    for g in gastos_recurrentes.data:
        importe = float(g["importe"])
        frecuencia = g.get("frecuencia", "mensual")
        if frecuencia == "semanal":
            gasto_recurrente_mensual += importe * 4
        elif frecuencia == "quincenal":
            gasto_recurrente_mensual += importe * 2
        elif frecuencia == "mensual":
            gasto_recurrente_mensual += importe
        elif frecuencia == "bimestral":
            gasto_recurrente_mensual += importe / 2
        elif frecuencia == "trimestral":
            gasto_recurrente_mensual += importe / 3
        elif frecuencia == "semestral":
            gasto_recurrente_mensual += importe / 6
        elif frecuencia == "anual":
            gasto_recurrente_mensual += importe / 12

    # Generar previsiones diarias
    previsiones = []
    balance_proyectado = balance_actual
    alerta_liquidez = False
    fecha_alerta = None
    mensaje_alerta = None

    gastos_por_fecha = {}
    for g in gastos_pendientes.data:
        fecha = g["fecha_vencimiento"]
        gastos_por_fecha[fecha] = gastos_por_fecha.get(fecha, 0) + float(g["importe"])

    gasto_recurrente_diario = gasto_recurrente_mensual / 30

    for i in range(dias):
        fecha = date.today() + timedelta(days=i)
        gastos_programados = gastos_por_fecha.get(fecha.isoformat(), 0)
        gastos_recurrentes_dia = gasto_recurrente_diario if i > 0 else 0

        balance_proyectado -= (gastos_programados + gastos_recurrentes_dia)

        previsiones.append(LiquidityForecast(
            fecha=fecha,
            balance_proyectado=round(balance_proyectado, 2),
            gastos_programados=gastos_programados,
            gastos_recurrentes=round(gastos_recurrentes_dia, 2),
        ))

        # Detectar alerta de liquidez
        if balance_proyectado < 0 and not alerta_liquidez:
            alerta_liquidez = True
            fecha_alerta = fecha
            mensaje_alerta = f"Se prevé saldo negativo a partir del {fecha.strftime('%d/%m/%Y')}"

    return LiquidityForecastResponse(
        balance_actual=balance_actual,
        previsiones=previsiones,
        alerta_liquidez=alerta_liquidez,
        fecha_alerta=fecha_alerta,
        mensaje_alerta=mensaje_alerta,
    )


# ============== DASHBOARD P&L ==============

@router.get("/pl", response_model=PLDashboardData)
async def obtener_pl_dashboard(
    periodo: str = Query(..., description="Formato: YYYY-MM para mes, YYYY-Q1 para trimestre, YYYY para año"),
):
    """
    Obtiene datos del dashboard de Pérdidas y Ganancias.
    """
    supabase = init_supabase()

    # Parsear período
    if "-Q" in periodo:  # Trimestre: 2025-Q1
        year = int(periodo.split("-Q")[0])
        quarter = int(periodo.split("-Q")[1])
        month_start = (quarter - 1) * 3 + 1
        fecha_desde = date(year, month_start, 1)
        if quarter == 4:
            fecha_hasta = date(year, 12, 31)
        else:
            fecha_hasta = date(year, month_start + 3, 1) - timedelta(days=1)
    elif len(periodo) == 4:  # Año: 2025
        year = int(periodo)
        fecha_desde = date(year, 1, 1)
        fecha_hasta = date(year, 12, 31)
    else:  # Mes: 2025-11
        year, month = periodo.split("-")
        fecha_desde = date(int(year), int(month), 1)
        if int(month) == 12:
            fecha_hasta = date(int(year), 12, 31)
        else:
            fecha_hasta = date(int(year), int(month) + 1, 1) - timedelta(days=1)

    # Obtener ingresos de pedidos
    pedidos = (
        supabase.table("pedidos")
        .select("total")
        .eq("estado", "pagado")
        .gte("created_at", fecha_desde.isoformat())
        .lte("created_at", fecha_hasta.isoformat() + "T23:59:59")
        .execute()
    )
    ingresos_pedidos = sum(float(p["total"]) for p in pedidos.data) if pedidos.data else 0
    num_pedidos = len(pedidos.data) if pedidos.data else 0

    # Obtener ingresos de reservas (servicios completados)
    reservas = (
        supabase.table("reservas")
        .select("precio_total")
        .eq("estado", "completada")
        .gte("fecha", fecha_desde.isoformat())
        .lte("fecha", fecha_hasta.isoformat())
        .execute()
    )
    ingresos_reservas = sum(float(r.get("precio_total", 0) or 0) for r in reservas.data) if reservas.data else 0
    num_reservas = len(reservas.data) if reservas.data else 0

    # Otros ingresos (ajustes manuales)
    otros_ingresos = (
        supabase.table("cash_movements")
        .select("importe")
        .eq("tipo", "ingreso")
        .eq("referencia_tipo", "ajuste")
        .gte("fecha", fecha_desde.isoformat())
        .lte("fecha", fecha_hasta.isoformat() + "T23:59:59")
        .execute()
    )
    ingresos_otros = sum(float(o["importe"]) for o in otros_ingresos.data) if otros_ingresos.data else 0

    total_ingresos = ingresos_pedidos + ingresos_reservas + ingresos_otros

    # Obtener gastos por categoría
    gastos = (
        supabase.table("expenses")
        .select("importe, expense_categories(nombre, categoria_base)")
        .gte("fecha", fecha_desde.isoformat())
        .lte("fecha", fecha_hasta.isoformat())
        .execute()
    )

    total_gastos = sum(float(g["importe"]) for g in gastos.data) if gastos.data else 0

    gastos_por_categoria = {}
    for g in gastos.data:
        cat = g.get("expense_categories")
        if cat:
            nombre = cat.get("nombre", "Sin categoría")
        else:
            nombre = "Sin categoría"
        gastos_por_categoria[nombre] = gastos_por_categoria.get(nombre, 0) + float(g["importe"])

    resultado = total_ingresos - total_gastos
    margen_porcentaje = (resultado / total_ingresos * 100) if total_ingresos > 0 else 0

    # KPIs
    ticket_medio_pedidos = ingresos_pedidos / num_pedidos if num_pedidos > 0 else None
    ticket_medio_reservas = ingresos_reservas / num_reservas if num_reservas > 0 else None

    return PLDashboardData(
        periodo=periodo,
        total_ingresos=total_ingresos,
        total_gastos=total_gastos,
        resultado=resultado,
        margen_porcentaje=round(margen_porcentaje, 2),
        ingresos_pedidos=ingresos_pedidos,
        ingresos_reservas=ingresos_reservas,
        ingresos_otros=ingresos_otros,
        gastos_por_categoria=gastos_por_categoria,
        ticket_medio_pedidos=round(ticket_medio_pedidos, 2) if ticket_medio_pedidos else None,
        ticket_medio_reservas=round(ticket_medio_reservas, 2) if ticket_medio_reservas else None,
        num_pedidos=num_pedidos,
        num_reservas=num_reservas,
    )
