"""
Router de productos para The Lobby Beauty.
Gestiona los endpoints relacionados con los productos de la tienda.
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import Optional
import os
import time

from app.models.schemas import (
    Producto,
    ProductoCreate,
    ProductoUpdate,
    ListaProductos,
    CategoriaProducto,
    CategoriaProductoInfo,
    MensajeRespuesta,
)
from app.core.database import init_supabase

router = APIRouter(
    prefix="/productos",
    tags=["Productos"],
    responses={404: {"description": "Producto no encontrado"}},
)


@router.get("", response_model=ListaProductos)
@router.get("/", response_model=ListaProductos, include_in_schema=False)
async def listar_productos(
    categoria: Optional[CategoriaProducto] = None,
    solo_activos: bool = True,
    solo_naturales: bool = False,
    solo_veganos: bool = False,
    solo_ofertas: bool = False,
    solo_destacados: bool = False,
    busqueda: Optional[str] = None,
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(12, ge=1, le=50),
):
    """
    Lista todos los productos disponibles.

    - **categoria**: Filtrar por categoría
    - **solo_activos**: Mostrar solo productos activos
    - **solo_naturales**: Mostrar solo productos naturales
    - **solo_veganos**: Mostrar solo productos veganos
    - **solo_ofertas**: Mostrar solo productos en oferta
    - **solo_destacados**: Mostrar solo productos destacados
    - **busqueda**: Buscar por nombre o descripción
    - **pagina**: Número de página
    - **por_pagina**: Elementos por página
    """
    supabase = init_supabase()

    # Construir query
    query = supabase.table("productos").select("*", count="exact")

    if categoria:
        query = query.eq("categoria", categoria.value)

    if solo_activos:
        query = query.eq("activo", True)

    if solo_naturales:
        query = query.eq("es_natural", True)

    if solo_veganos:
        query = query.eq("es_vegano", True)

    if solo_ofertas:
        query = query.not_.is_("precio_oferta", "null")

    if solo_destacados:
        query = query.eq("destacado", True)

    if busqueda:
        query = query.or_(f"nombre.ilike.%{busqueda}%,descripcion_corta.ilike.%{busqueda}%")

    # Paginación
    offset = (pagina - 1) * por_pagina
    query = query.range(offset, offset + por_pagina - 1)

    # Ordenar: destacados primero, luego por nombre
    query = query.order("destacado", desc=True).order("nombre")

    response = query.execute()

    return ListaProductos(
        items=response.data,
        total=response.count or 0,
        pagina=pagina,
        por_pagina=por_pagina,
    )


@router.get("/categorias", response_model=list[CategoriaProductoInfo])
async def listar_categorias():
    """Lista todas las categorías de productos activas."""
    supabase = init_supabase()

    response = (
        supabase.table("categorias_productos")
        .select("*")
        .eq("activo", True)
        .order("orden")
        .execute()
    )

    return response.data


@router.get("/destacados", response_model=list[Producto])
async def listar_destacados(limite: int = Query(8, ge=1, le=20)):
    """Lista los productos destacados."""
    supabase = init_supabase()

    response = (
        supabase.table("productos")
        .select("*")
        .eq("activo", True)
        .eq("destacado", True)
        .limit(limite)
        .execute()
    )

    return response.data


@router.get("/ofertas", response_model=list[Producto])
async def listar_ofertas(limite: int = Query(8, ge=1, le=20)):
    """Lista los productos en oferta."""
    supabase = init_supabase()

    response = (
        supabase.table("productos")
        .select("*")
        .eq("activo", True)
        .not_.is_("precio_oferta", "null")
        .limit(limite)
        .execute()
    )

    return response.data


@router.get("/{producto_id}", response_model=Producto)
async def obtener_producto(producto_id: int):
    """Obtiene un producto por su ID."""
    supabase = init_supabase()

    response = (
        supabase.table("productos")
        .select("*")
        .eq("id", producto_id)
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return response.data


@router.post("/", response_model=Producto, status_code=201)
async def crear_producto(producto: ProductoCreate):
    """
    Crea un nuevo producto.

    Solo accesible para administradores.
    """
    supabase = init_supabase()

    response = (
        supabase.table("productos")
        .insert(producto.model_dump())
        .execute()
    )

    return response.data[0]


@router.put("/{producto_id}", response_model=Producto)
async def actualizar_producto(producto_id: int, producto: ProductoUpdate):
    """
    Actualiza un producto existente.

    Solo accesible para administradores.
    """
    supabase = init_supabase()

    # Filtrar campos None
    datos = {k: v for k, v in producto.model_dump().items() if v is not None}

    if not datos:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    response = (
        supabase.table("productos")
        .update(datos)
        .eq("id", producto_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return response.data[0]


@router.delete("/{producto_id}", response_model=MensajeRespuesta)
async def eliminar_producto(producto_id: int):
    """
    Elimina (desactiva) un producto.

    Solo accesible para administradores.
    En lugar de eliminar, se marca como inactivo.
    """
    supabase = init_supabase()

    response = (
        supabase.table("productos")
        .update({"activo": False})
        .eq("id", producto_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return MensajeRespuesta(mensaje="Producto eliminado correctamente")


@router.get("/categoria/{categoria}", response_model=list[Producto])
async def listar_por_categoria(categoria: CategoriaProducto):
    """Lista todos los productos de una categoría específica."""
    supabase = init_supabase()

    response = (
        supabase.table("productos")
        .select("*")
        .eq("categoria", categoria.value)
        .eq("activo", True)
        .order("destacado", desc=True)
        .order("nombre")
        .execute()
    )

    return response.data


@router.patch("/{producto_id}/stock", response_model=Producto)
async def actualizar_stock(producto_id: int, cantidad: int):
    """
    Actualiza el stock de un producto.

    - **cantidad**: Nueva cantidad de stock (puede ser negativa para decrementar)
    """
    supabase = init_supabase()

    # Obtener producto actual
    producto_resp = (
        supabase.table("productos")
        .select("stock")
        .eq("id", producto_id)
        .single()
        .execute()
    )

    if not producto_resp.data:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    nuevo_stock = max(0, producto_resp.data["stock"] + cantidad)

    response = (
        supabase.table("productos")
        .update({"stock": nuevo_stock})
        .eq("id", producto_id)
        .execute()
    )

    return response.data[0]


@router.post("/{producto_id}/imagen")
async def subir_imagen_producto(producto_id: int, file: UploadFile = File(...)):
    """Subir imagen de un producto."""
    storage_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "storage", "imagenes", "productos")
    os.makedirs(storage_dir, exist_ok=True)

    ext = file.filename.split(".")[-1] if file.filename else "png"
    filename = f"{producto_id}_{int(time.time() * 1000)}.{ext}"
    filepath = os.path.join(storage_dir, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    imagen_url = f"/storage/imagenes/productos/{filename}"

    supabase = init_supabase()
    supabase.table("productos").update({"imagen_url": imagen_url}).eq("id", producto_id).execute()

    return {"imagen_url": imagen_url}
