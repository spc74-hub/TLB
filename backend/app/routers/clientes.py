"""
Router de clientes para The Lobby Beauty.
Gestiona el CRM y la base de datos de clientes.
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import Optional
from datetime import datetime
import io
import csv

from app.models.schemas import (
    Cliente,
    ClienteCreate,
    ClienteUpdate,
    ClienteConHistorial,
    ListaClientes,
    OrigenCliente,
    ResultadoImportacion,
    MensajeRespuesta,
)
from app.core.database import init_supabase

router = APIRouter(
    prefix="/clientes",
    tags=["CRM - Clientes"],
    responses={404: {"description": "Cliente no encontrado"}},
)


@router.get("/", response_model=ListaClientes)
async def listar_clientes(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
    busqueda: Optional[str] = None,
    acepta_marketing: Optional[bool] = None,
    etiqueta: Optional[str] = None,
    origen: Optional[OrigenCliente] = None,
    orden: str = Query("created_at", description="Campo de ordenación"),
    desc: bool = True,
):
    """
    Lista clientes con filtros y paginación.

    - **busqueda**: Buscar por nombre, email o teléfono
    - **acepta_marketing**: Filtrar por opt-in de marketing
    - **etiqueta**: Filtrar por etiqueta específica
    - **origen**: Filtrar por origen del cliente
    """
    supabase = init_supabase()

    # Construir query base
    query = await supabase.table("clientes").select("*", count="exact")

    # Aplicar filtros
    if busqueda:
        # Búsqueda en nombre, email o teléfono
        query = await query.or_(
            f"nombre.ilike.%{busqueda}%,"
            f"email.ilike.%{busqueda}%,"
            f"telefono.ilike.%{busqueda}%"
        )

    if acepta_marketing is not None:
        query = await query.eq("acepta_marketing", acepta_marketing)

    if etiqueta:
        query = await query.contains("etiquetas", [etiqueta])

    if origen:
        query = await query.eq("origen", origen.value)

    # Ordenación
    query = await query.order(orden, desc=desc)

    # Paginación
    offset = (pagina - 1) * por_pagina
    query = await query.range(offset, offset + por_pagina - 1)

    response = await query.execute()

    return ListaClientes(
        items=response.data,
        total=response.count or 0,
        pagina=pagina,
        por_pagina=por_pagina,
    )


@router.get("/stats")
async def obtener_estadisticas():
    """Obtiene estadísticas generales de clientes."""
    supabase = init_supabase()

    # Total de clientes
    total = await supabase.table("clientes").select("id", count="exact").execute()

    # Con opt-in de marketing
    marketing = (
        supabase.table("clientes")
        .select("id", count="exact")
        .eq("acepta_marketing", True)
        await .execute()
    )

    # Por origen
    origenes = {}
    for origen in ["web", "tienda", "importacion", "manual", "reserva", "pedido"]:
        count = (
            supabase.table("clientes")
            .select("id", count="exact")
            .eq("origen", origen)
            await .execute()
        )
        origenes[origen] = count.count or 0

    # Clientes activos (con actividad en últimos 30 días)
    # Este cálculo se haría mejor con una consulta SQL directa

    return {
        "total_clientes": total.count or 0,
        "acepta_marketing": marketing.count or 0,
        "por_origen": origenes,
    }


@router.get("/etiquetas")
async def listar_etiquetas():
    """Lista todas las etiquetas únicas de clientes."""
    supabase = init_supabase()

    # Obtener todos los arrays de etiquetas
    response = (
        supabase.table("clientes")
        .select("etiquetas")
        .not_.is_("etiquetas", "null")
        await .execute()
    )

    # Extraer etiquetas únicas
    etiquetas = set()
    for item in response.data:
        if item.get("etiquetas"):
            etiquetas.update(item["etiquetas"])

    return sorted(list(etiquetas))


@router.get("/{cliente_id}", response_model=ClienteConHistorial)
async def obtener_cliente(cliente_id: str):
    """Obtiene un cliente con su historial de reservas y pedidos."""
    supabase = init_supabase()

    # Obtener cliente
    response = (
        supabase.table("clientes")
        .select("*")
        .eq("id", cliente_id)
        .single()
        await .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    cliente = response.data

    # Obtener reservas vinculadas
    reservas_response = (
        supabase.table("cliente_reservas_link")
        .select("reserva_id, reservas(*)")
        .eq("cliente_id", cliente_id)
        await .execute()
    )

    reservas = [r["reservas"] for r in reservas_response.data if r.get("reservas")]

    # Obtener pedidos vinculados
    pedidos_response = (
        supabase.table("cliente_pedidos_link")
        .select("pedido_id, pedidos(*)")
        .eq("cliente_id", cliente_id)
        await .execute()
    )

    pedidos = [p["pedidos"] for p in pedidos_response.data if p.get("pedidos")]

    return ClienteConHistorial(
        **cliente,
        reservas=reservas,
        pedidos=pedidos,
    )


@router.post("/", response_model=Cliente, status_code=201)
async def crear_cliente(cliente: ClienteCreate):
    """Crea un nuevo cliente."""
    supabase = init_supabase()

    # Verificar si ya existe por email
    if cliente.email:
        existente = (
            supabase.table("clientes")
            .select("id")
            .ilike("email", cliente.email)
            await .execute()
        )
        if existente.data:
            raise HTTPException(
                status_code=409,
                detail="Ya existe un cliente con este email"
            )

    # Preparar datos
    datos = cliente.model_dump()
    datos["origen"] = datos["origen"].value if datos.get("origen") else "manual"

    if cliente.acepta_marketing:
        datos["fecha_opt_in"] = datetime.now().isoformat()

    response = await supabase.table("clientes").insert(datos).execute()

    return response.data[0]


@router.put("/{cliente_id}", response_model=Cliente)
async def actualizar_cliente(cliente_id: str, cliente: ClienteUpdate):
    """Actualiza un cliente existente."""
    supabase = init_supabase()

    # Verificar que existe
    existente = (
        supabase.table("clientes")
        .select("id, acepta_marketing")
        .eq("id", cliente_id)
        .single()
        await .execute()
    )

    if not existente.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # Filtrar campos no None
    datos = {k: v for k, v in cliente.model_dump().items() if v is not None}

    if not datos:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    # Gestionar opt-in/opt-out
    if "acepta_marketing" in datos:
        if datos["acepta_marketing"] and not existente.data["acepta_marketing"]:
            datos["fecha_opt_in"] = datetime.now().isoformat()
            datos["fecha_opt_out"] = None
        elif not datos["acepta_marketing"] and existente.data["acepta_marketing"]:
            datos["fecha_opt_out"] = datetime.now().isoformat()

    datos["updated_at"] = datetime.now().isoformat()

    response = (
        supabase.table("clientes")
        .update(datos)
        .eq("id", cliente_id)
        await .execute()
    )

    return response.data[0]


@router.delete("/{cliente_id}", response_model=MensajeRespuesta)
async def eliminar_cliente(cliente_id: str):
    """Elimina un cliente."""
    supabase = init_supabase()

    # Verificar que existe
    existente = (
        supabase.table("clientes")
        .select("id")
        .eq("id", cliente_id)
        .single()
        await .execute()
    )

    if not existente.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # Eliminar (las relaciones se eliminan en cascada)
    await supabase.table("clientes").delete().eq("id", cliente_id).execute()

    return MensajeRespuesta(mensaje="Cliente eliminado correctamente")


@router.post("/{cliente_id}/opt-in", response_model=Cliente)
async def activar_marketing(cliente_id: str):
    """Activa el consentimiento de marketing para un cliente."""
    supabase = init_supabase()

    response = (
        supabase.table("clientes")
        .update({
            "acepta_marketing": True,
            "fecha_opt_in": datetime.now().isoformat(),
            "fecha_opt_out": None,
            "updated_at": datetime.now().isoformat(),
        })
        .eq("id", cliente_id)
        await .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return response.data[0]


@router.post("/{cliente_id}/opt-out", response_model=Cliente)
async def desactivar_marketing(cliente_id: str):
    """Desactiva el consentimiento de marketing para un cliente."""
    supabase = init_supabase()

    response = (
        supabase.table("clientes")
        .update({
            "acepta_marketing": False,
            "fecha_opt_out": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        })
        .eq("id", cliente_id)
        await .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return response.data[0]


@router.post("/importar", response_model=ResultadoImportacion)
async def importar_clientes(archivo: UploadFile = File(...)):
    """
    Importa clientes desde un archivo CSV.

    Formato esperado (con cabeceras):
    nombre,email,telefono,etiquetas,acepta_marketing,notas

    - etiquetas: separadas por punto y coma (;)
    - acepta_marketing: true/false, si/no, 1/0
    """
    supabase = init_supabase()

    if not archivo.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="El archivo debe ser CSV"
        )

    contenido = await archivo.read()

    try:
        # Intentar UTF-8 con BOM primero
        texto = contenido.decode('utf-8-sig')
    except UnicodeDecodeError:
        try:
            texto = contenido.decode('utf-8')
        except UnicodeDecodeError:
            texto = contenido.decode('latin-1')

    # Detectar delimitador automáticamente
    primera_linea = texto.split('\n')[0]
    if '\t' in primera_linea:
        delimitador = '\t'
    elif ';' in primera_linea:
        delimitador = ';'
    else:
        delimitador = ','

    reader = csv.DictReader(io.StringIO(texto), delimiter=delimitador)

    creados = 0
    actualizados = 0
    errores = 0
    detalle_errores = []
    fila = 1

    for row in reader:
        fila += 1
        try:
            # Normalizar keys del diccionario (minúsculas y sin espacios)
            row_normalizado = {k.lower().strip(): v for k, v in row.items() if k}

            nombre = row_normalizado.get('nombre', '').strip()
            email = row_normalizado.get('email', '').strip() or None
            telefono = row_normalizado.get('telefono', '').strip() or None

            if not nombre:
                detalle_errores.append(f"Fila {fila}: nombre es requerido")
                errores += 1
                continue

            if not email and not telefono:
                detalle_errores.append(f"Fila {fila}: se requiere email o teléfono")
                errores += 1
                continue

            # Parsear etiquetas
            etiquetas_str = row_normalizado.get('etiquetas', '').strip()
            etiquetas = [e.strip() for e in etiquetas_str.split(';') if e.strip()] if etiquetas_str else None

            # Parsear acepta_marketing
            marketing_str = row_normalizado.get('acepta_marketing', '').strip().lower()
            acepta_marketing = marketing_str in ['true', 'si', 'sí', '1', 'yes']

            notas = row_normalizado.get('notas', '').strip() or None

            # Buscar si ya existe
            existente = None
            if email:
                result = (
                    supabase.table("clientes")
                    .select("id")
                    .ilike("email", email)
                    await .execute()
                )
                if result.data:
                    existente = result.data[0]["id"]

            datos = {
                "nombre": nombre,
                "email": email,
                "telefono": telefono,
                "etiquetas": etiquetas,
                "acepta_marketing": acepta_marketing,
                "notas": notas,
                "origen": "importacion",
            }

            if acepta_marketing:
                datos["fecha_opt_in"] = datetime.now().isoformat()

            if existente:
                # Actualizar
                datos["updated_at"] = datetime.now().isoformat()
                await supabase.table("clientes").update(datos).eq("id", existente).execute()
                actualizados += 1
            else:
                # Crear
                await supabase.table("clientes").insert(datos).execute()
                creados += 1

        except Exception as e:
            detalle_errores.append(f"Fila {fila}: {str(e)}")
            errores += 1

    return ResultadoImportacion(
        total_procesados=fila - 1,
        creados=creados,
        actualizados=actualizados,
        errores=errores,
        detalle_errores=detalle_errores if detalle_errores else None,
    )


@router.get("/exportar/plantilla")
async def descargar_plantilla():
    """Descarga una plantilla CSV para importar clientes."""
    from fastapi.responses import StreamingResponse

    plantilla = "nombre,email,telefono,etiquetas,acepta_marketing,notas\n"
    plantilla += "María García,maria@ejemplo.com,+34612345678,vip;frecuente,true,Cliente desde 2023\n"
    plantilla += "Juan López,juan@ejemplo.com,+34698765432,nuevo,false,\n"

    return StreamingResponse(
        io.StringIO(plantilla),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=plantilla_clientes.csv"}
    )


@router.get("/exportar/csv")
async def exportar_clientes_csv(
    acepta_marketing: Optional[bool] = None,
    etiqueta: Optional[str] = None,
):
    """Exporta clientes a CSV con filtros opcionales."""
    from fastapi.responses import StreamingResponse

    supabase = init_supabase()

    query = await supabase.table("clientes").select("*")

    if acepta_marketing is not None:
        query = await query.eq("acepta_marketing", acepta_marketing)

    if etiqueta:
        query = await query.contains("etiquetas", [etiqueta])

    response = await query.order("nombre").execute()

    # Generar CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Cabeceras
    writer.writerow([
        "nombre", "email", "telefono", "etiquetas", "acepta_marketing",
        "origen", "total_reservas", "total_pedidos", "total_gastado",
        "ultima_visita", "ultima_compra", "notas"
    ])

    for cliente in response.data:
        etiquetas = ";".join(cliente.get("etiquetas") or [])
        writer.writerow([
            cliente.get("nombre"),
            cliente.get("email"),
            cliente.get("telefono"),
            etiquetas,
            "si" if cliente.get("acepta_marketing") else "no",
            cliente.get("origen"),
            cliente.get("total_reservas", 0),
            cliente.get("total_pedidos", 0),
            cliente.get("total_gastado", 0),
            cliente.get("ultima_visita"),
            cliente.get("ultima_compra"),
            cliente.get("notas"),
        ])

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=clientes_export.csv"}
    )
