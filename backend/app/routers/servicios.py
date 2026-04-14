"""
Router de servicios para The Lobby Beauty.
Gestiona los endpoints relacionados con los servicios de belleza.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.models.schemas import (
    Servicio,
    ServicioCreate,
    ServicioUpdate,
    ListaServicios,
    CategoriaServicio,
    MensajeRespuesta,
)
from app.core.database import init_supabase

router = APIRouter(
    prefix="/servicios",
    tags=["Servicios"],
    responses={404: {"description": "Servicio no encontrado"}},
)


@router.get("/", response_model=ListaServicios)
async def listar_servicios(
    categoria: Optional[CategoriaServicio] = None,
    solo_activos: bool = True,
    solo_libre_toxicos: bool = False,
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(10, ge=1, le=50),
):
    """
    Lista todos los servicios disponibles.

    - **categoria**: Filtrar por categoría (manicura, pedicura, etc.)
    - **solo_activos**: Mostrar solo servicios activos
    - **solo_libre_toxicos**: Mostrar solo servicios libres de TPO/DMPT
    - **pagina**: Número de página
    - **por_pagina**: Elementos por página
    """
    supabase = init_supabase()

    # Construir query
    query = await supabase.table("servicios").select("*", count="exact")

    if categoria:
        query = await query.eq("categoria", categoria.value)

    if solo_activos:
        query = await query.eq("activo", True)

    if solo_libre_toxicos:
        query = await query.eq("es_libre_toxicos", True)

    # Paginación
    offset = (pagina - 1) * por_pagina
    query = await query.range(offset, offset + por_pagina - 1)

    # Ordenar por nombre
    query = await query.order("nombre")

    response = await query.execute()

    return ListaServicios(
        items=response.data,
        total=response.count or 0,
        pagina=pagina,
        por_pagina=por_pagina,
    )


@router.get("/{servicio_id}", response_model=Servicio)
async def obtener_servicio(servicio_id: int):
    """Obtiene un servicio por su ID."""
    supabase = init_supabase()

    response = (
        supabase.table("servicios")
        .select("*")
        .eq("id", servicio_id)
        await .single().execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    return response.data


@router.post("/", response_model=Servicio, status_code=201)
async def crear_servicio(servicio: ServicioCreate):
    """
    Crea un nuevo servicio.

    Solo accesible para administradores.
    """
    supabase = init_supabase()

    response = (
        supabase.table("servicios")
        await .insert(servicio.model_dump()).execute()
    )

    return response.data[0]


@router.put("/{servicio_id}", response_model=Servicio)
async def actualizar_servicio(servicio_id: int, servicio: ServicioUpdate):
    """
    Actualiza un servicio existente.

    Solo accesible para administradores.
    """
    supabase = init_supabase()

    # Filtrar campos None
    datos = {k: v for k, v in servicio.model_dump().items() if v is not None}

    if not datos:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    response = (
        supabase.table("servicios")
        .update(datos)
        await .eq("id", servicio_id).execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    return response.data[0]


@router.delete("/{servicio_id}", response_model=MensajeRespuesta)
async def eliminar_servicio(servicio_id: int):
    """
    Elimina (desactiva) un servicio.

    Solo accesible para administradores.
    En lugar de eliminar, se marca como inactivo.
    """
    supabase = init_supabase()

    response = (
        supabase.table("servicios")
        .update({"activo": False})
        await .eq("id", servicio_id).execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    return MensajeRespuesta(mensaje="Servicio eliminado correctamente")


@router.get("/categoria/{categoria}", response_model=list[Servicio])
async def listar_por_categoria(categoria: CategoriaServicio):
    """Lista todos los servicios de una categoría específica."""
    supabase = init_supabase()

    response = (
        supabase.table("servicios")
        .select("*")
        .eq("categoria", categoria.value)
        .eq("activo", True)
        await .order("nombre").execute()
    )

    return response.data
