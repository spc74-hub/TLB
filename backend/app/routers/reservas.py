"""
Router de reservas para The Lobby Beauty.
Gestiona los endpoints relacionados con las reservas de citas.
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from datetime import date, time, datetime
from typing import Optional

from app.models.schemas import (
    Reserva,
    ReservaCreate,
    ReservaUpdate,
    ReservaConDetalles,
    EstadoReserva,
    MensajeRespuesta,
)
from app.core.database import init_supabase
from app.services.email import (
    enviar_confirmacion_reserva,
    enviar_cancelacion_reserva,
)

router = APIRouter(
    prefix="/reservas",
    tags=["Reservas"],
    responses={404: {"description": "Reserva no encontrada"}},
)


@router.get("/", response_model=list[ReservaConDetalles])
async def listar_reservas(
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    estado: Optional[EstadoReserva] = None,
    usuario_id: Optional[str] = None,
):
    """
    Lista reservas con filtros opcionales.

    - **fecha_desde**: Fecha inicial del rango
    - **fecha_hasta**: Fecha final del rango
    - **estado**: Filtrar por estado de la reserva
    - **usuario_id**: Filtrar por usuario
    """
    supabase = init_supabase()

    query = supabase.table("reservas").select("*, servicios(*)")

    if fecha_desde:
        query = query.gte("fecha", fecha_desde.isoformat())

    if fecha_hasta:
        query = query.lte("fecha", fecha_hasta.isoformat())

    if estado:
        query = query.eq("estado", estado.value)

    if usuario_id:
        query = query.eq("usuario_id", usuario_id)

    query = query.order("fecha", desc=True).order("hora")

    response = query.execute()

    # Transformar respuesta para incluir servicio
    reservas = []
    for item in response.data:
        servicio = item.pop("servicios", None)
        reserva = ReservaConDetalles(**item, servicio=servicio)
        reservas.append(reserva)

    return reservas


@router.get("/disponibilidad")
async def verificar_disponibilidad(
    servicio_id: int,
    fecha: date,
):
    """
    Verifica los horarios disponibles para un servicio en una fecha.

    Retorna las horas disponibles para reservar.
    """
    supabase = init_supabase()

    # Obtener reservas existentes para esa fecha
    response = (
        supabase.table("reservas")
        .select("hora")
        .eq("fecha", fecha.isoformat())
        .neq("estado", "cancelada")
        .execute()
    )

    horas_ocupadas = [r["hora"] for r in response.data]

    # Horarios de apertura (ejemplo: 9:00 - 20:00)
    horarios_disponibles = []
    for hora in range(9, 20):
        for minuto in [0, 30]:
            hora_str = f"{hora:02d}:{minuto:02d}:00"
            if hora_str not in horas_ocupadas:
                horarios_disponibles.append(f"{hora:02d}:{minuto:02d}")

    return {
        "fecha": fecha.isoformat(),
        "servicio_id": servicio_id,
        "horarios_disponibles": horarios_disponibles,
    }


@router.get("/{reserva_id}", response_model=ReservaConDetalles)
async def obtener_reserva(reserva_id: int):
    """Obtiene una reserva por su ID."""
    supabase = init_supabase()

    response = (
        supabase.table("reservas")
        .select("*, servicios(*)")
        .eq("id", reserva_id)
        .single()
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    servicio = response.data.pop("servicios", None)
    return ReservaConDetalles(**response.data, servicio=servicio)


@router.post("/", response_model=Reserva, status_code=201)
async def crear_reserva(reserva: ReservaCreate, background_tasks: BackgroundTasks):
    """
    Crea una nueva reserva.

    Valida que el horario esté disponible antes de crear.
    Envía email de confirmación si se proporciona email del cliente.
    """
    supabase = init_supabase()

    # Verificar que el servicio existe y obtener detalles
    servicio = (
        supabase.table("servicios")
        .select("id, nombre, duracion, precio")
        .eq("id", reserva.servicio_id)
        .eq("activo", True)
        .single()
        .execute()
    )

    if not servicio.data:
        raise HTTPException(status_code=404, detail="Servicio no encontrado o inactivo")

    # Verificar disponibilidad
    hora_str = reserva.hora.strftime("%H:%M:%S")
    reserva_existente = (
        supabase.table("reservas")
        .select("id")
        .eq("fecha", reserva.fecha.isoformat())
        .eq("hora", hora_str)
        .neq("estado", "cancelada")
        .execute()
    )

    if reserva_existente.data:
        raise HTTPException(
            status_code=409,
            detail="Este horario ya está reservado"
        )

    # Crear reserva
    datos = reserva.model_dump()
    datos["fecha"] = datos["fecha"].isoformat()
    datos["hora"] = datos["hora"].strftime("%H:%M:%S")
    # TODO: Obtener usuario_id del token de autenticación
    datos["usuario_id"] = "user-placeholder"

    response = supabase.table("reservas").insert(datos).execute()
    reserva_creada = response.data[0]

    # Enviar email de confirmación en background
    if reserva.cliente_email:
        background_tasks.add_task(
            enviar_confirmacion_reserva,
            email_cliente=reserva.cliente_email,
            nombre_cliente=reserva.cliente_nombre,
            servicio_nombre=servicio.data["nombre"],
            fecha=reserva.fecha,
            hora=reserva.hora,
            duracion=servicio.data["duracion"],
            precio=float(servicio.data["precio"]),
        )

    return reserva_creada


@router.put("/{reserva_id}", response_model=Reserva)
async def actualizar_reserva(reserva_id: int, reserva: ReservaUpdate):
    """Actualiza una reserva existente."""
    supabase = init_supabase()

    # Filtrar campos None y convertir tipos
    datos = {}
    for k, v in reserva.model_dump().items():
        if v is not None:
            if k == "fecha":
                datos[k] = v.isoformat()
            elif k == "hora":
                datos[k] = v.strftime("%H:%M:%S")
            elif k == "estado":
                datos[k] = v.value
            else:
                datos[k] = v

    if not datos:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    response = (
        supabase.table("reservas")
        .update(datos)
        .eq("id", reserva_id)
        .execute()
    )

    if not response.data:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    return response.data[0]


@router.post("/{reserva_id}/cancelar", response_model=MensajeRespuesta)
async def cancelar_reserva(reserva_id: int, background_tasks: BackgroundTasks):
    """Cancela una reserva y envía email de confirmación."""
    supabase = init_supabase()

    # Obtener datos de la reserva antes de cancelar
    reserva_data = (
        supabase.table("reservas")
        .select("*, servicios(nombre)")
        .eq("id", reserva_id)
        .single()
        .execute()
    )

    if not reserva_data.data:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    # Cancelar la reserva
    response = (
        supabase.table("reservas")
        .update({"estado": "cancelada"})
        .eq("id", reserva_id)
        .execute()
    )

    # Enviar email de cancelación si hay email del cliente
    reserva = reserva_data.data
    if reserva.get("cliente_email"):
        fecha = datetime.strptime(reserva["fecha"], "%Y-%m-%d").date()
        hora = datetime.strptime(reserva["hora"], "%H:%M:%S").time()
        servicio_nombre = reserva.get("servicios", {}).get("nombre", "Servicio")

        background_tasks.add_task(
            enviar_cancelacion_reserva,
            email_cliente=reserva["cliente_email"],
            nombre_cliente=reserva.get("cliente_nombre", "Cliente"),
            servicio_nombre=servicio_nombre,
            fecha=fecha,
            hora=hora,
        )

    return MensajeRespuesta(mensaje="Reserva cancelada correctamente")
