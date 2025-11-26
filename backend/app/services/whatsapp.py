"""
Servicio de WhatsApp para The Lobby Beauty.
Usa Twilio para enviar mensajes de WhatsApp.
"""

from twilio.rest import Client
from datetime import date, time
from typing import Optional

from app.core.config import get_settings

settings = get_settings()


def _get_twilio_client() -> Optional[Client]:
    """Obtiene el cliente de Twilio si está configurado."""
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        return None
    return Client(settings.twilio_account_sid, settings.twilio_auth_token)


def _format_fecha(fecha: date) -> str:
    """Formatea una fecha en español."""
    dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ]
    dia_semana = dias[fecha.weekday()]
    return f"{dia_semana}, {fecha.day} de {meses[fecha.month - 1]}"


def _format_hora(hora: time) -> str:
    """Formatea una hora."""
    return hora.strftime("%H:%M")


def _format_telefono(telefono: str) -> str:
    """
    Formatea el número de teléfono para WhatsApp.
    Añade el prefijo whatsapp: si no lo tiene.
    """
    telefono = telefono.strip()
    if not telefono.startswith("whatsapp:"):
        # Si no tiene código de país, asumimos España (+34)
        if not telefono.startswith("+"):
            telefono = f"+34{telefono}"
        telefono = f"whatsapp:{telefono}"
    return telefono


async def enviar_confirmacion_cita(
    telefono: str,
    nombre_cliente: str,
    servicio_nombre: str,
    fecha: date,
    hora: time,
    duracion: int,
) -> bool:
    """
    Envía mensaje de WhatsApp de confirmación de cita.

    Args:
        telefono: Número de teléfono del cliente (con o sin prefijo)
        nombre_cliente: Nombre del cliente
        servicio_nombre: Nombre del servicio reservado
        fecha: Fecha de la cita
        hora: Hora de la cita
        duracion: Duración en minutos

    Returns:
        True si se envió correctamente, False si hubo error.
    """
    client = _get_twilio_client()
    if not client:
        print("⚠️ Twilio no configurado, WhatsApp no enviado")
        return False

    fecha_formateada = _format_fecha(fecha)
    hora_formateada = _format_hora(hora)
    telefono_formateado = _format_telefono(telefono)

    mensaje = f"""✨ *The Lobby Beauty*

¡Hola {nombre_cliente}!

Tu cita ha sido *confirmada*:

📋 *Servicio:* {servicio_nombre}
📅 *Fecha:* {fecha_formateada}
🕐 *Hora:* {hora_formateada}
⏱️ *Duración:* {duracion} min

Te esperamos. Si necesitas cancelar o modificar tu cita, contacta con nosotros con al menos 24h de antelación.

_The Lobby Beauty_"""

    try:
        message = client.messages.create(
            body=mensaje,
            from_=settings.twilio_whatsapp_from,
            to=telefono_formateado
        )
        print(f"✅ WhatsApp enviado a {telefono_formateado} (SID: {message.sid})")
        return True
    except Exception as e:
        print(f"❌ Error enviando WhatsApp: {e}")
        return False


async def enviar_recordatorio_cita(
    telefono: str,
    nombre_cliente: str,
    servicio_nombre: str,
    fecha: date,
    hora: time,
) -> bool:
    """
    Envía recordatorio de cita 24h antes.
    """
    client = _get_twilio_client()
    if not client:
        return False

    fecha_formateada = _format_fecha(fecha)
    hora_formateada = _format_hora(hora)
    telefono_formateado = _format_telefono(telefono)

    mensaje = f"""⏰ *Recordatorio de cita*

Hola {nombre_cliente},

Te recordamos que tienes una cita *mañana*:

📋 {servicio_nombre}
📅 {fecha_formateada}
🕐 {hora_formateada}

¡Te esperamos!

_The Lobby Beauty_"""

    try:
        message = client.messages.create(
            body=mensaje,
            from_=settings.twilio_whatsapp_from,
            to=telefono_formateado
        )
        print(f"✅ Recordatorio WhatsApp enviado (SID: {message.sid})")
        return True
    except Exception as e:
        print(f"❌ Error enviando recordatorio WhatsApp: {e}")
        return False


async def enviar_cancelacion_cita(
    telefono: str,
    nombre_cliente: str,
    servicio_nombre: str,
    fecha: date,
    hora: time,
) -> bool:
    """
    Envía notificación de cita cancelada.
    """
    client = _get_twilio_client()
    if not client:
        return False

    fecha_formateada = _format_fecha(fecha)
    hora_formateada = _format_hora(hora)
    telefono_formateado = _format_telefono(telefono)

    mensaje = f"""❌ *Cita cancelada*

Hola {nombre_cliente},

Tu cita ha sido cancelada:

~{servicio_nombre}~
~{fecha_formateada} a las {hora_formateada}~

Si deseas reservar una nueva cita, puedes hacerlo desde nuestra web.

_The Lobby Beauty_"""

    try:
        message = client.messages.create(
            body=mensaje,
            from_=settings.twilio_whatsapp_from,
            to=telefono_formateado
        )
        print(f"✅ Cancelación WhatsApp enviada (SID: {message.sid})")
        return True
    except Exception as e:
        print(f"❌ Error enviando cancelación WhatsApp: {e}")
        return False


async def enviar_confirmacion_pedido(
    telefono: str,
    nombre_cliente: str,
    pedido_id: int,
    total: float,
) -> bool:
    """
    Envía confirmación de pedido por WhatsApp.
    """
    client = _get_twilio_client()
    if not client:
        return False

    telefono_formateado = _format_telefono(telefono)

    mensaje = f"""🛍️ *Pedido confirmado*

¡Hola {nombre_cliente}!

Tu pedido *#{pedido_id}* ha sido recibido.

💰 *Total:* {total:.2f}€

Te notificaremos cuando esté en camino.

¡Gracias por tu compra!

_The Lobby Beauty_"""

    try:
        message = client.messages.create(
            body=mensaje,
            from_=settings.twilio_whatsapp_from,
            to=telefono_formateado
        )
        print(f"✅ Confirmación pedido WhatsApp enviada (SID: {message.sid})")
        return True
    except Exception as e:
        print(f"❌ Error enviando confirmación pedido WhatsApp: {e}")
        return False


# ============================================
# TEST WHATSAPP
# ============================================

async def enviar_whatsapp_test(telefono: str) -> dict:
    """
    Envía un mensaje de prueba para verificar la configuración de Twilio.

    IMPORTANTE: En el sandbox de Twilio, el destinatario debe haber
    enviado primero "join <código>" al número de sandbox.

    Returns:
        dict con resultado y detalles del diagnóstico.
    """
    resultado = {
        "configurado": False,
        "enviado": False,
        "error": None,
        "detalles": {}
    }

    # Verificar configuración
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        resultado["error"] = "Twilio no está configurado. Configura TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN en .env"
        resultado["detalles"]["account_sid_presente"] = bool(settings.twilio_account_sid)
        resultado["detalles"]["auth_token_presente"] = bool(settings.twilio_auth_token)
        return resultado

    resultado["configurado"] = True
    resultado["detalles"]["account_sid_presente"] = True
    resultado["detalles"]["auth_token_presente"] = True
    resultado["detalles"]["whatsapp_from"] = settings.twilio_whatsapp_from

    telefono_formateado = _format_telefono(telefono)
    resultado["detalles"]["telefono_destino"] = telefono_formateado

    mensaje = """✅ *Test de WhatsApp - The Lobby Beauty*

¡La configuración de WhatsApp funciona correctamente!

Este es un mensaje de prueba enviado desde el sistema de notificaciones de The Lobby Beauty usando Twilio.

_Si recibes este mensaje, todo está configurado correctamente._"""

    try:
        client = _get_twilio_client()
        message = client.messages.create(
            body=mensaje,
            from_=settings.twilio_whatsapp_from,
            to=telefono_formateado
        )
        resultado["enviado"] = True
        resultado["detalles"]["message_sid"] = message.sid
        resultado["detalles"]["status"] = message.status
        print(f"✅ WhatsApp de test enviado a {telefono_formateado} (SID: {message.sid})")
        return resultado

    except Exception as e:
        resultado["error"] = str(e)
        print(f"❌ Error enviando WhatsApp de test: {e}")
        return resultado
