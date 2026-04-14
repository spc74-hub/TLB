"""
Router de gastos para The Lobby Beauty.
Gestiona categorías de gastos, proveedores y gastos del ERP.
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import date, datetime
from typing import Optional
from decimal import Decimal

from app.models.schemas import (
    ExpenseCategory,
    ExpenseCategoryCreate,
    ExpenseCategoryUpdate,
    Vendor,
    VendorCreate,
    VendorUpdate,
    Expense,
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseWithDetails,
    ListaExpenses,
    ExpenseStats,
    CategoriaGastoBase,
    MensajeRespuesta,
)
from app.core.database import init_supabase


router = APIRouter(
    prefix="/gastos",
    tags=["Gastos (ERP)"],
    responses={404: {"description": "No encontrado"}},
)


# ============== CATEGORÍAS DE GASTOS ==============

@router.get("/categorias", response_model=list[ExpenseCategory])
async def listar_categorias(
    activo: Optional[bool] = None,
    categoria_base: Optional[CategoriaGastoBase] = None,
):
    """Lista todas las categorías de gastos."""
    supabase = init_supabase()

    query = await supabase.table("expense_categories").select("*")

    if activo is not None:
        query = await query.eq("activo", activo)

    if categoria_base:
        query = await query.eq("categoria_base", categoria_base.value)

    query = await query.order("nombre")
    response = await query.execute()

    return response.data


@router.post("/categorias", response_model=ExpenseCategory, status_code=201)
async def crear_categoria(categoria: ExpenseCategoryCreate):
    """Crea una nueva categoría de gastos."""
    supabase = init_supabase()

    datos = categoria.model_dump()
    datos["categoria_base"] = datos["categoria_base"].value

    response = await supabase.table("expense_categories").insert(datos).execute()

    return response.data[0]


@router.put("/categorias/{categoria_id}", response_model=ExpenseCategory)
async def actualizar_categoria(categoria_id: int, categoria: ExpenseCategoryUpdate):
    """Actualiza una categoría de gastos."""
    supabase = init_supabase()

    datos = {k: v for k, v in categoria.model_dump().items() if v is not None}

    if "categoria_base" in datos and datos["categoria_base"]:
        datos["categoria_base"] = datos["categoria_base"].value

    if not datos:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    response = (
        supabase.table("expense_categories")
        .update(datos)
        .eq("id", categoria_id)
        await .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    return response.data[0]


@router.delete("/categorias/{categoria_id}", response_model=MensajeRespuesta)
async def eliminar_categoria(categoria_id: int):
    """Elimina una categoría de gastos (soft delete)."""
    supabase = init_supabase()

    # Verificar si hay gastos asociados
    gastos = (
        supabase.table("expenses")
        .select("id")
        .eq("categoria_id", categoria_id)
        .limit(1)
        await .execute()
    )

    if gastos.data:
        # Soft delete si hay gastos asociados
        supabase.table("expense_categories").update({"activo": False}).eq(
            "id", categoria_id
        await ).execute()
        return MensajeRespuesta(mensaje="Categoría desactivada (tiene gastos asociados)")

    # Hard delete si no hay gastos
    response = (
        await supabase.table("expense_categories").delete().eq("id", categoria_id).execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    return MensajeRespuesta(mensaje="Categoría eliminada correctamente")


# ============== PROVEEDORES ==============

@router.get("/proveedores", response_model=list[Vendor])
async def listar_proveedores(
    activo: Optional[bool] = None,
    busqueda: Optional[str] = None,
):
    """Lista todos los proveedores."""
    supabase = init_supabase()

    query = await supabase.table("vendors").select("*")

    if activo is not None:
        query = await query.eq("activo", activo)

    if busqueda:
        query = await query.or_(
            f"nombre.ilike.%{busqueda}%,nif_cif.ilike.%{busqueda}%,email.ilike.%{busqueda}%"
        )

    query = await query.order("nombre")
    response = await query.execute()

    return response.data


@router.get("/proveedores/{proveedor_id}", response_model=Vendor)
async def obtener_proveedor(proveedor_id: int):
    """Obtiene un proveedor por su ID."""
    supabase = init_supabase()

    response = (
        await supabase.table("vendors").select("*").eq("id", proveedor_id).single().execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    return response.data


@router.post("/proveedores", response_model=Vendor, status_code=201)
async def crear_proveedor(proveedor: VendorCreate):
    """Crea un nuevo proveedor."""
    supabase = init_supabase()

    datos = proveedor.model_dump()
    response = await supabase.table("vendors").insert(datos).execute()

    return response.data[0]


@router.put("/proveedores/{proveedor_id}", response_model=Vendor)
async def actualizar_proveedor(proveedor_id: int, proveedor: VendorUpdate):
    """Actualiza un proveedor."""
    supabase = init_supabase()

    datos = {k: v for k, v in proveedor.model_dump().items() if v is not None}

    if not datos:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    response = (
        await supabase.table("vendors").update(datos).eq("id", proveedor_id).execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    return response.data[0]


@router.delete("/proveedores/{proveedor_id}", response_model=MensajeRespuesta)
async def eliminar_proveedor(proveedor_id: int):
    """Elimina un proveedor (soft delete)."""
    supabase = init_supabase()

    # Verificar si hay gastos asociados
    gastos = (
        supabase.table("expenses")
        .select("id")
        .eq("vendor_id", proveedor_id)
        .limit(1)
        await .execute()
    )

    if gastos.data:
        supabase.table("vendors").update({"activo": False}).eq(
            "id", proveedor_id
        await ).execute()
        return MensajeRespuesta(mensaje="Proveedor desactivado (tiene gastos asociados)")

    response = await supabase.table("vendors").delete().eq("id", proveedor_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")

    return MensajeRespuesta(mensaje="Proveedor eliminado correctamente")


# ============== GASTOS ==============

@router.get("/", response_model=ListaExpenses)
async def listar_gastos(
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    categoria_id: Optional[int] = None,
    vendor_id: Optional[int] = None,
    pagado: Optional[bool] = None,
    es_recurrente: Optional[bool] = None,
    busqueda: Optional[str] = None,
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
):
    """
    Lista gastos con filtros y paginación.
    Incluye detalles de categoría y proveedor.
    """
    supabase = init_supabase()

    # Query con joins para obtener detalles
    query = await supabase.table("expenses").select(
        "*, expense_categories(nombre, color, icono), vendors(nombre), cash_accounts(nombre)",
        count="exact"
    )

    if fecha_desde:
        query = await query.gte("fecha", fecha_desde.isoformat())

    if fecha_hasta:
        query = await query.lte("fecha", fecha_hasta.isoformat())

    if categoria_id:
        query = await query.eq("categoria_id", categoria_id)

    if vendor_id:
        query = await query.eq("vendor_id", vendor_id)

    if pagado is not None:
        query = await query.eq("pagado", pagado)

    if es_recurrente is not None:
        query = await query.eq("es_recurrente", es_recurrente)

    if busqueda:
        query = await query.or_(
            f"concepto.ilike.%{busqueda}%,numero_factura.ilike.%{busqueda}%"
        )

    # Ordenar y paginar
    offset = (pagina - 1) * por_pagina
    query = await query.order("fecha", desc=True).range(offset, offset + por_pagina - 1)

    response = await query.execute()

    # Transformar respuesta
    items = []
    for item in response.data:
        categoria = item.pop("expense_categories", None)
        vendor = item.pop("vendors", None)
        cuenta = item.pop("cash_accounts", None)

        gasto = ExpenseWithDetails(
            **item,
            categoria_nombre=categoria.get("nombre") if categoria else None,
            categoria_color=categoria.get("color") if categoria else None,
            categoria_icono=categoria.get("icono") if categoria else None,
            vendor_nombre=vendor.get("nombre") if vendor else None,
            cuenta_nombre=cuenta.get("nombre") if cuenta else None,
        )
        items.append(gasto)

    return ListaExpenses(
        items=items,
        total=response.count or 0,
        pagina=pagina,
        por_pagina=por_pagina,
    )


@router.get("/stats", response_model=ExpenseStats)
async def obtener_estadisticas(
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
):
    """
    Obtiene estadísticas de gastos.
    Por defecto, del mes actual.
    """
    supabase = init_supabase()

    # Fechas por defecto: mes actual
    if not fecha_desde:
        hoy = date.today()
        fecha_desde = date(hoy.year, hoy.month, 1)
    if not fecha_hasta:
        fecha_hasta = date.today()

    # Total del período
    query_total = (
        supabase.table("expenses")
        .select("importe, pagado, categoria_id, vendor_id")
        .gte("fecha", fecha_desde.isoformat())
        .lte("fecha", fecha_hasta.isoformat())
    )
    gastos = await query_total.execute()

    total_periodo = sum(float(g["importe"]) for g in gastos.data)
    total_pagado = sum(float(g["importe"]) for g in gastos.data if g["pagado"])
    total_pendiente = total_periodo - total_pagado

    # Por categoría
    categorias = await supabase.table("expense_categories").select("id, nombre").execute()
    cat_map = {c["id"]: c["nombre"] for c in categorias.data}
    por_categoria = {}
    for g in gastos.data:
        cat_id = g.get("categoria_id")
        if cat_id and cat_id in cat_map:
            nombre = cat_map[cat_id]
            por_categoria[nombre] = por_categoria.get(nombre, 0) + float(g["importe"])

    # Por proveedor
    vendors = await supabase.table("vendors").select("id, nombre").execute()
    vendor_map = {v["id"]: v["nombre"] for v in vendors.data}
    por_proveedor = {}
    for g in gastos.data:
        v_id = g.get("vendor_id")
        if v_id and v_id in vendor_map:
            nombre = vendor_map[v_id]
            por_proveedor[nombre] = por_proveedor.get(nombre, 0) + float(g["importe"])

    # Gastos recurrentes activos
    recurrentes = (
        supabase.table("expenses")
        .select("id")
        .eq("es_recurrente", True)
        .or_("fecha_fin_recurrencia.is.null,fecha_fin_recurrencia.gte." + date.today().isoformat())
        await .execute()
    )

    # Próximos vencimientos (próximos 7 días)
    proxima_semana = date.today()
    from datetime import timedelta
    proxima_semana_fin = proxima_semana + timedelta(days=7)

    vencimientos = (
        supabase.table("expenses")
        .select("id, concepto, importe, fecha_vencimiento")
        .eq("pagado", False)
        .gte("fecha_vencimiento", proxima_semana.isoformat())
        .lte("fecha_vencimiento", proxima_semana_fin.isoformat())
        .order("fecha_vencimiento")
        await .execute()
    )

    return ExpenseStats(
        total_periodo=total_periodo,
        total_pendiente=total_pendiente,
        total_pagado=total_pagado,
        por_categoria=por_categoria,
        por_proveedor=por_proveedor,
        gastos_recurrentes_activos=len(recurrentes.data),
        proximos_vencimientos=vencimientos.data,
    )


@router.get("/{gasto_id}", response_model=ExpenseWithDetails)
async def obtener_gasto(gasto_id: int):
    """Obtiene un gasto por su ID con detalles."""
    supabase = init_supabase()

    response = (
        supabase.table("expenses")
        .select("*, expense_categories(nombre, color, icono), vendors(nombre), cash_accounts(nombre)")
        .eq("id", gasto_id)
        .single()
        await .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    item = response.data
    categoria = item.pop("expense_categories", None)
    vendor = item.pop("vendors", None)
    cuenta = item.pop("cash_accounts", None)

    return ExpenseWithDetails(
        **item,
        categoria_nombre=categoria.get("nombre") if categoria else None,
        categoria_color=categoria.get("color") if categoria else None,
        categoria_icono=categoria.get("icono") if categoria else None,
        vendor_nombre=vendor.get("nombre") if vendor else None,
        cuenta_nombre=cuenta.get("nombre") if cuenta else None,
    )


@router.post("/", response_model=Expense, status_code=201)
async def crear_gasto(gasto: ExpenseCreate):
    """Crea un nuevo gasto."""
    supabase = init_supabase()

    datos = gasto.model_dump()

    # Convertir fechas a ISO string
    if datos.get("fecha"):
        datos["fecha"] = datos["fecha"].isoformat()
    if datos.get("fecha_vencimiento"):
        datos["fecha_vencimiento"] = datos["fecha_vencimiento"].isoformat()
    if datos.get("fecha_inicio_recurrencia"):
        datos["fecha_inicio_recurrencia"] = datos["fecha_inicio_recurrencia"].isoformat()
    if datos.get("fecha_fin_recurrencia"):
        datos["fecha_fin_recurrencia"] = datos["fecha_fin_recurrencia"].isoformat()

    # Convertir enum a string
    if datos.get("frecuencia"):
        datos["frecuencia"] = datos["frecuencia"].value

    response = await supabase.table("expenses").insert(datos).execute()

    return response.data[0]


@router.put("/{gasto_id}", response_model=Expense)
async def actualizar_gasto(gasto_id: int, gasto: ExpenseUpdate):
    """Actualiza un gasto existente."""
    supabase = init_supabase()

    datos = {k: v for k, v in gasto.model_dump().items() if v is not None}

    # Convertir fechas a ISO string
    for campo in ["fecha", "fecha_vencimiento", "fecha_pago"]:
        if campo in datos and datos[campo]:
            datos[campo] = datos[campo].isoformat()

    if not datos:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    response = (
        await supabase.table("expenses").update(datos).eq("id", gasto_id).execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    return response.data[0]


@router.delete("/{gasto_id}", response_model=MensajeRespuesta)
async def eliminar_gasto(gasto_id: int):
    """Elimina un gasto."""
    supabase = init_supabase()

    # Verificar si tiene movimiento de caja asociado
    gasto = (
        supabase.table("expenses")
        .select("movimiento_id")
        .eq("id", gasto_id)
        .single()
        await .execute()
    )

    if gasto.data and gasto.data.get("movimiento_id"):
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar un gasto que ya tiene movimiento de caja asociado"
        )

    response = await supabase.table("expenses").delete().eq("id", gasto_id).execute()

    if not response.data:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    return MensajeRespuesta(mensaje="Gasto eliminado correctamente")


@router.post("/{gasto_id}/marcar-pagado", response_model=Expense)
async def marcar_gasto_pagado(
    gasto_id: int,
    cuenta_id: Optional[int] = None,
    crear_movimiento: bool = True,
):
    """
    Marca un gasto como pagado.
    Opcionalmente crea el movimiento de caja correspondiente.
    """
    supabase = init_supabase()

    # Obtener el gasto
    gasto = (
        supabase.table("expenses")
        .select("*")
        .eq("id", gasto_id)
        .single()
        await .execute()
    )

    if not gasto.data:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")

    if gasto.data.get("pagado"):
        raise HTTPException(status_code=400, detail="El gasto ya está marcado como pagado")

    # Si se debe crear movimiento
    movimiento_id = None
    if crear_movimiento and cuenta_id:
        mov_response = await supabase.table("cash_movements").insert({
            "cuenta_id": cuenta_id,
            "tipo": "gasto",
            "importe": gasto.data["importe"],
            "concepto": gasto.data["concepto"],
            "referencia_tipo": "gasto",
            "gasto_id": gasto_id,
        await }).execute()
        movimiento_id = mov_response.data[0]["id"]

    # Actualizar gasto
    update_data = {
        "pagado": True,
        "fecha_pago": date.today().isoformat(),
    }
    if cuenta_id:
        update_data["cuenta_pago_id"] = cuenta_id
    if movimiento_id:
        update_data["movimiento_id"] = movimiento_id

    response = (
        supabase.table("expenses")
        .update(update_data)
        .eq("id", gasto_id)
        await .execute()
    )

    return response.data[0]


@router.get("/recurrentes/pendientes", response_model=list[Expense])
async def obtener_gastos_recurrentes_pendientes():
    """
    Obtiene gastos recurrentes que necesitan generar su próxima ocurrencia.
    Útil para un job programado.
    """
    supabase = init_supabase()

    hoy = date.today()

    response = (
        supabase.table("expenses")
        .select("*")
        .eq("es_recurrente", True)
        .is_("gasto_padre_id", "null")  # Solo gastos padre
        .or_(f"fecha_fin_recurrencia.is.null,fecha_fin_recurrencia.gte.{hoy.isoformat()}")
        await .execute()
    )

    return response.data
