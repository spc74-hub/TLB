"""
Router de reservas para The Lobby Beauty.
Gestiona los endpoints relacionados con las reservas de citas.
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from datetime import date, time, datetime
from typing import Optional
import uuid

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
from app.services.whatsapp import (
    enviar_confirmacion_cita,
    enviar_cancelacion_cita,
)


def crear_o_actualizar_cliente_crm(
    supabase,
    nombre: str,
    email: str = None,
    telefono: str = None,
    acepta_marketing: bool = False,
    origen: str = "reserva",
    reserva_id: int = None,
    pedido_id: int = None,
):
    """
    Crea o actualiza un cliente en el CRM.
    Si el cliente ya existe (por email), actualiza sus datos.
    Si no existe, lo crea como nuevo cliente.
    Vincula la reserva/pedido al cliente.
    """
    try:
        cliente_id = None

        # Buscar cliente existente por email
        if email:
            existente = (
                supabase.table("clientes")
                .select("id, acepta_marketing, total_reservas")
                await .ilike("email", email).execute()
            )
            if existente.data:
                cliente_id = existente.data[0]["id"]
                acepta_marketing_actual = existente.data[0]["acepta_marketing"]
                total_reservas_actual = existente.data[0].get("total_reservas", 0) or 0

                # Actualizar datos del cliente
                datos_actualizar = {
                    "nombre": nombre,
                    "telefono": telefono,
                    "updated_at": datetime.now().isoformat(),
                }

                # Solo actualizar acepta_marketing si cambia a True
                if acepta_marketing and not acepta_marketing_actual:
                    datos_actualizar["acepta_marketing"] = True
                    datos_actualizar["fecha_opt_in"] = datetime.now().isoformat()

                # Incrementar contador de reservas directamente
                if reserva_id:
                    datos_actualizar["total_reservas"] = total_reservas_actual + 1
                    datos_actualizar["ultima_visita"] = datetime.now().date().isoformat()

                await supabase.table("clientes").update(datos_actualizar).eq("id", cliente_id).execute()

        # Si no existe, crear nuevo cliente
        if not cliente_id:
            datos_cliente = {
                "nombre": nombre,
                "email": email,
                "telefono": telefono,
                "acepta_marketing": acepta_marketing,
                "origen": origen,
                "total_reservas": 1 if reserva_id else 0,
                "total_pedidos": 1 if pedido_id else 0,
            }

            if acepta_marketing:
                datos_cliente["fecha_opt_in"] = datetime.now().isoformat()

            if reserva_id:
                datos_cliente["ultima_visita"] = datetime.now().date().isoformat()

            response = await supabase.table("clientes").insert(datos_cliente).execute()
            cliente_id = response.data[0]["id"]

        # Vincular reserva al cliente
        if reserva_id and cliente_id:
            # Usar upsert para evitar duplicados
            supabase.table("cliente_reservas_link").upsert({
                "cliente_id": cliente_id,
                "reserva_id": reserva_id,
            await }, on_conflict="cliente_id,reserva_id").execute()

        # Vincular pedido al cliente
        if pedido_id and cliente_id:
            supabase.table("cliente_pedidos_link").upsert({
                "cliente_id": cliente_id,
                "pedido_id": pedido_id,
            await }, on_conflict="cliente_id,pedido_id").execute()

        return cliente_id

    except Exception as e:
        # Log del error pero no fallar la reserva/pedido
        print(f"Error al crear/actualizar cliente CRM: {e}")
        import traceback
        traceback.print_exc()
        return None


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

    query = await supabase.table("reservas").select("*, servicios(*)")

    if fecha_desde:
        query = await query.gte("fecha", fecha_desde.isoformat())

    if fecha_hasta:
        query = await query.lte("fecha", fecha_hasta.isoformat())

    if estado:
        query = await query.eq("estado", estado.value)

    if usuario_id:
        query = await query.eq("usuario_id", usuario_id)

    query = await query.order("fecha", desc=True).order("hora")

    response = await query.execute()

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
        await .neq("estado", "cancelada").execute()
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
        await .single().execute()
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
        .select("id, nombre, duracion_minutos, precio")
        .eq("id", reserva.servicio_id)
        .eq("activo", True)
        await .single().execute()
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
        await .neq("estado", "cancelada").execute()
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
    # Por ahora no incluimos usuario_id para permitir reservas sin autenticación
    # datos["usuario_id"] = str(uuid.uuid4())

    # Mapear nombres de campos del schema a nombres de columnas de la BD
    if "cliente_nombre" in datos:
        datos["nombre_cliente"] = datos.pop("cliente_nombre")
    if "cliente_email" in datos:
        datos["email_cliente"] = datos.pop("cliente_email")
    if "cliente_telefono" in datos:
        datos["telefono_cliente"] = datos.pop("cliente_telefono")

    # Extraer acepta_marketing antes de insertar (no es columna de reservas)
    acepta_marketing = datos.pop("acepta_marketing", False)

    response = await supabase.table("reservas").insert(datos).execute()
    reserva_creada = response.data[0]

    # Crear o actualizar cliente en CRM si hay email o teléfono
    if reserva.cliente_email or reserva.cliente_telefono:
        background_tasks.add_task(
            crear_o_actualizar_cliente_crm,
            supabase=supabase,
            nombre=reserva.cliente_nombre,
            email=reserva.cliente_email,
            telefono=reserva.cliente_telefono,
            acepta_marketing=acepta_marketing,
            origen="reserva",
            reserva_id=reserva_creada["id"],
        )

    # Enviar email de confirmación en background
    if reserva.cliente_email:
        background_tasks.add_task(
            enviar_confirmacion_reserva,
            email_cliente=reserva.cliente_email,
            nombre_cliente=reserva.cliente_nombre,
            servicio_nombre=servicio.data["nombre"],
            fecha=reserva.fecha,
            hora=reserva.hora,
            duracion=servicio.data["duracion_minutos"],
            precio=float(servicio.data["precio"]),
        )

    # Enviar WhatsApp de confirmación si hay teléfono
    if reserva.cliente_telefono:
        background_tasks.add_task(
            enviar_confirmacion_cita,
            telefono=reserva.cliente_telefono,
            nombre_cliente=reserva.cliente_nombre,
            servicio_nombre=servicio.data["nombre"],
            fecha=reserva.fecha,
            hora=reserva.hora,
            duracion=servicio.data["duracion_minutos"],
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
        await .eq("id", reserva_id).execute()
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
        await .single().execute()
    )

    if not reserva_data.data:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    # Cancelar la reserva
    response = (
        supabase.table("reservas")
        .update({"estado": "cancelada"})
        await .eq("id", reserva_id).execute()
    )

    # Enviar notificaciones de cancelación
    reserva = reserva_data.data
    fecha = datetime.strptime(reserva["fecha"], "%Y-%m-%d").date()
    hora = datetime.strptime(reserva["hora"], "%H:%M:%S").time()
    servicio_nombre = reserva.get("servicios", {}).get("nombre", "Servicio")

    # Email de cancelación
    if reserva.get("cliente_email"):
        background_tasks.add_task(
            enviar_cancelacion_reserva,
            email_cliente=reserva["cliente_email"],
            nombre_cliente=reserva.get("cliente_nombre", "Cliente"),
            servicio_nombre=servicio_nombre,
            fecha=fecha,
            hora=hora,
        )

    # WhatsApp de cancelación
    if reserva.get("cliente_telefono"):
        background_tasks.add_task(
            enviar_cancelacion_cita,
            telefono=reserva["cliente_telefono"],
            nombre_cliente=reserva.get("cliente_nombre", "Cliente"),
            servicio_nombre=servicio_nombre,
            fecha=fecha,
            hora=hora,
        )

    return MensajeRespuesta(mensaje="Reserva cancelada correctamente")
