"""
Router para gestión de pedidos.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_supabase_client

router = APIRouter(prefix="/pedidos", tags=["pedidos"])


class EstadoPedidoUpdate(BaseModel):
    """Request para actualizar estado de pedido."""
    estado: str


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

        query = supabase.table("pedidos").select(
            "*, pedido_items(*, producto:productos(nombre, imagen_url))"
        ).order("created_at", desc=True)

        if estado:
            query = query.eq("estado", estado)

        query = query.range(offset, offset + limit - 1)
        result = query.execute()

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
        pedidos_result = supabase.table("pedidos").select("id, total, estado, created_at").execute()
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

        result = supabase.table("pedidos").select(
            "id, nombre_envio, total, estado, created_at"
        ).order("created_at", desc=True).limit(limit).execute()

        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{pedido_id}")
async def get_pedido(pedido_id: int):
    """
    Obtiene un pedido por ID con sus items.
    """
    try:
        supabase = get_supabase_client()

        result = supabase.table("pedidos").select(
            "*, pedido_items(*, producto:productos(nombre, imagen_url))"
        ).eq("id", pedido_id).single().execute()

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

        result = supabase.table("pedidos").update({
            "estado": request.estado
        }).eq("id", pedido_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")

        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
