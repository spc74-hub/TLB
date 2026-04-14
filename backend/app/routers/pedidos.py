"""
Router para gestión de pedidos.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime, timedelta
from enum import Enum

from app.core.database import get_supabase_client

router = APIRouter(prefix="/pedidos", tags=["pedidos"])


# ============== ENUMS ==============

class MetodoCobro(str, Enum):
    efectivo = "efectivo"
    transferencia = "transferencia"
    tarjeta_online = "tarjeta_online"
    tpv = "tpv"


# ============== MODELOS ==============

class EstadoPedidoUpdate(BaseModel):
    """Request para actualizar estado de pedido."""
    estado: str


class RegistrarCobroRequest(BaseModel):
    """Request para registrar un cobro de pedido."""
    metodo_cobro: MetodoCobro
    cuenta_id: Optional[int] = None  # Si no se especifica, se usa la cuenta por defecto


class CobroResponse(BaseModel):
    """Response al registrar un cobro."""
    pedido_id: int
    cobrado: bool
    fecha_cobro: str
    metodo_cobro: str
    cuenta_cobro_id: int
    movimiento_id: int


@router.get("")
async def get_pedidos(
    estado: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    Obtiene lista de pedidos con filtro opcional por estado.
    """
    try:
        supabase = get_supabase_client()

        query = await supabase.table("pedidos").select(
            "*, pedido_items(*, producto:productos(nombre, imagen_url))"
        ).order("created_at", desc=True)

        if estado:
            query = await query.eq("estado", estado)

        query = await query.range(offset, offset + limit - 1)
        result = await query.execute()

        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_estadisticas():
    """
    Obtiene estadísticas de ventas para el dashboard.
    """
    try:
        supabase = get_supabase_client()

        # Total de pedidos y ventas
        pedidos_result = await supabase.table("pedidos").select("id, total, estado, created_at").execute()
        pedidos = pedidos_result.data or []

        total_pedidos = len(pedidos)
        total_ventas = sum(p.get("total", 0) or 0 for p in pedidos)

        # Pedidos por estado
        pendientes = len([p for p in pedidos if p.get("estado") == "pendiente"])
        pagados = len([p for p in pedidos if p.get("estado") == "pagado"])
        enviados = len([p for p in pedidos if p.get("estado") == "enviado"])
        entregados = len([p for p in pedidos if p.get("estado") == "entregado"])

        # Ventas últimos 7 días (para gráfico)
        hoy = datetime.now().date()
        ventas_7_dias = []

        for i in range(6, -1, -1):  # De hace 6 días hasta hoy
            fecha = hoy - timedelta(days=i)
            fecha_str = fecha.isoformat()

            ventas_dia = sum(
                p.get("total", 0) or 0
                for p in pedidos
                if p.get("created_at", "").startswith(fecha_str)
            )

            ventas_7_dias.append({
                "fecha": fecha_str,
                "dia": fecha.strftime("%a"),  # Lun, Mar, etc.
                "ventas": ventas_dia
            })

        return {
            "total_pedidos": total_pedidos,
            "total_ventas": total_ventas,
            "pendientes": pendientes,
            "pagados": pagados,
            "enviados": enviados,
            "entregados": entregados,
            "ventas_7_dias": ventas_7_dias
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recientes")
async def get_pedidos_recientes(limit: int = 5):
    """
    Obtiene los pedidos más recientes para el dashboard.
    """
    try:
        supabase = get_supabase_client()

        result = await supabase.table("pedidos").select(
            "id, nombre_envio, total, estado, created_at"
        await ).order("created_at", desc=True).limit(limit).execute()

        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== ENDPOINTS DE COBRO (rutas estáticas ANTES de /{pedido_id}) ==============

@router.get("/pendientes-cobro")
async def get_pedidos_pendientes_cobro():
    """
    Obtiene pedidos que están pagados pero no tienen cobro registrado en caja.
    Útil para Tesorería y conciliación.
    """
    try:
        supabase = get_supabase_client()

        # Pedidos no cancelados y no cobrados
        result = await supabase.table("pedidos").select(
            "id, nombre_envio, total, estado, metodo_pago, stripe_payment_id, created_at, cobrado, metodo_cobro_tipo"
        await ).eq("cobrado", False).neq("estado", "cancelado").order("created_at", desc=True).execute()

        pedidos = result.data or []

        # Añadir info de tipo de cobro esperado
        for p in pedidos:
            if p.get("stripe_payment_id"):
                p["tipo_cobro_esperado"] = "Online (Stripe)"
            else:
                p["tipo_cobro_esperado"] = "Manual"

        return pedidos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats-cobro")
async def get_estadisticas_cobro():
    """
    Obtiene estadísticas de cobros para Tesorería.
    """
    try:
        supabase = get_supabase_client()

        # Todos los pedidos no cancelados
        pedidos_result = await supabase.table("pedidos").select(
            "id, total, estado, cobrado, metodo_cobro_tipo, stripe_payment_id"
        await ).neq("estado", "cancelado").execute()

        pedidos = pedidos_result.data or []

        total_pedidos = len(pedidos)
        total_ventas = sum(float(p.get("total") or 0) for p in pedidos)

        # Cobrados
        cobrados = [p for p in pedidos if p.get("cobrado")]
        total_cobrado = sum(float(p.get("total") or 0) for p in cobrados)

        # Pendientes de cobro
        pendientes = [p for p in pedidos if not p.get("cobrado")]
        total_pendiente = sum(float(p.get("total") or 0) for p in pendientes)

        # Por método de cobro
        por_metodo = {}
        for p in cobrados:
            metodo = p.get("metodo_cobro_tipo") or "sin_especificar"
            if metodo not in por_metodo:
                por_metodo[metodo] = {"count": 0, "total": 0}
            por_metodo[metodo]["count"] += 1
            por_metodo[metodo]["total"] += float(p.get("total") or 0)

        return {
            "total_pedidos": total_pedidos,
            "total_ventas": round(total_ventas, 2),
            "cobrados": len(cobrados),
            "total_cobrado": round(total_cobrado, 2),
            "pendientes_cobro": len(pendientes),
            "total_pendiente": round(total_pendiente, 2),
            "por_metodo_cobro": por_metodo
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== RUTAS CON PARÁMETROS DINÁMICOS ==============

@router.get("/{pedido_id}")
async def get_pedido(pedido_id: int):
    """
    Obtiene un pedido por ID con sus items.
    """
    try:
        supabase = get_supabase_client()

        result = await supabase.table("pedidos").select(
            "*, pedido_items(*, producto:productos(nombre, imagen_url))"
        await ).eq("id", pedido_id).single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")

        return result.data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{pedido_id}/estado")
async def update_estado_pedido(pedido_id: int, request: EstadoPedidoUpdate):
    """
    Actualiza el estado de un pedido.
    """
    estados_validos = ["pendiente", "pagado", "preparando", "enviado", "entregado", "cancelado"]

    if request.estado not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail=f"Estado inválido. Debe ser uno de: {', '.join(estados_validos)}"
        )

    try:
        supabase = get_supabase_client()

        result = await supabase.table("pedidos").update({
            "estado": request.estado
        await }).eq("id", pedido_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{pedido_id}/cobro", response_model=CobroResponse)
async def registrar_cobro(pedido_id: int, request: RegistrarCobroRequest):
    """
    Registra el cobro de un pedido en tesorería.
    Crea un movimiento de caja (ingreso) asociado al pedido.
    """
    try:
        supabase = get_supabase_client()

        # 1. Obtener el pedido
        pedido_result = await supabase.table("pedidos").select(
            "id, total, cobrado, nombre_envio, estado"
        await ).eq("id", pedido_id).single().execute()

        if not pedido_result.data:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")

        pedido = pedido_result.data

        if pedido.get("cobrado"):
            raise HTTPException(status_code=400, detail="El pedido ya está cobrado")

        # 2. Determinar cuenta de destino
        cuenta_id = request.cuenta_id
        if not cuenta_id:
            # Buscar cuenta por defecto según método de cobro
            if request.metodo_cobro == MetodoCobro.efectivo:
                cuenta_result = await supabase.table("cash_accounts").select("id").eq(
                    "tipo", "efectivo"
                await ).eq("activo", True).limit(1).execute()
            else:
                cuenta_result = await supabase.table("cash_accounts").select("id").eq(
                    "tipo", "banco"
                await ).eq("es_principal", True).eq("activo", True).limit(1).execute()

            if not cuenta_result.data:
                raise HTTPException(
                    status_code=400,
                    detail="No se encontró cuenta de destino para el cobro"
                )
            cuenta_id = cuenta_result.data[0]["id"]

        # 3. Crear movimiento de caja
        fecha_cobro = datetime.now().isoformat()
        movimiento_data = {
            "cuenta_id": cuenta_id,
            "tipo": "ingreso",
            "importe": float(pedido["total"]),
            "concepto": f"Cobro pedido #{pedido_id}",
            "descripcion": f"Cliente: {pedido.get('nombre_envio') or 'Anónimo'}",
            "fecha": fecha_cobro,
            "referencia_tipo": "pedido",
            "pedido_id": pedido_id
        }

        movimiento_result = await supabase.table("cash_movements").insert(
            movimiento_data
        await ).execute()

        if not movimiento_result.data:
            raise HTTPException(
                status_code=500,
                detail="Error al crear movimiento de caja"
            )

        movimiento_id = movimiento_result.data[0]["id"]

        # 4. Actualizar pedido con datos de cobro
        update_data = {
            "cobrado": True,
            "fecha_cobro": fecha_cobro,
            "metodo_cobro_tipo": request.metodo_cobro.value,
            "cuenta_cobro_id": cuenta_id,
            "movimiento_cobro_id": movimiento_id
        }

        pedido_update_result = await supabase.table("pedidos").update(
            update_data
        await ).eq("id", pedido_id).execute()

        if not pedido_update_result.data:
            raise HTTPException(
                status_code=500,
                detail="Error al actualizar pedido"
            )

        return CobroResponse(
            pedido_id=pedido_id,
            cobrado=True,
            fecha_cobro=fecha_cobro,
            metodo_cobro=request.metodo_cobro.value,
            cuenta_cobro_id=cuenta_id,
            movimiento_id=movimiento_id
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
