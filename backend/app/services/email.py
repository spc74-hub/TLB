"""
Servicio de emails para The Lobby Beauty.
Usa Resend para enviar emails transaccionales.
"""

import resend
from datetime import date, time
from typing import Optional

from app.core.config import get_settings

settings = get_settings()
resend.api_key = settings.resend_api_key


def _format_fecha(fecha: date) -> str:
    """Formatea una fecha en español."""
    dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    meses = [
        "enero", "febrero", "marzo", "abril", "mayo", "junio",
        "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ]
    dia_semana = dias[fecha.weekday()]
    return f"{dia_semana}, {fecha.day} de {meses[fecha.month - 1]} de {fecha.year}"


def _format_hora(hora: time) -> str:
    """Formatea una hora."""
    return hora.strftime("%H:%M")


async def enviar_confirmacion_reserva(
    email_cliente: str,
    nombre_cliente: str,
    servicio_nombre: str,
    fecha: date,
    hora: time,
    duracion: int,
    precio: float,
) -> bool:
    """
    Envía email de confirmación de reserva al cliente.

    Returns:
        True si se envió correctamente, False si hubo error.
    """
    if not settings.resend_api_key:
        print("⚠️ RESEND_API_KEY no configurada, email no enviado")
        return False

    fecha_formateada = _format_fecha(fecha)
    hora_formateada = _format_hora(hora)

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #faf9f7; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #6b8f71 0%, #5a7d60 100%); padding: 30px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; font-size: 28px; font-weight: 600; }}
            .header p {{ color: rgba(255,255,255,0.9); margin: 10px 0 0; }}
            .content {{ padding: 30px; }}
            .greeting {{ font-size: 18px; color: #2d3436; margin-bottom: 20px; }}
            .details {{ background: #f8f7f5; border-radius: 8px; padding: 20px; margin: 20px 0; }}
            .detail-row {{ display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e8e6e3; }}
            .detail-row:last-child {{ border-bottom: none; }}
            .detail-label {{ color: #636e72; font-size: 14px; }}
            .detail-value {{ color: #2d3436; font-weight: 600; }}
            .footer {{ background: #f8f7f5; padding: 20px; text-align: center; font-size: 12px; color: #636e72; }}
            .cta {{ display: inline-block; background: #6b8f71; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin-top: 20px; }}
            .icon {{ font-size: 48px; margin-bottom: 10px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">✨</div>
                <h1>The Lobby Beauty</h1>
                <p>Tu cita ha sido confirmada</p>
            </div>
            <div class="content">
                <p class="greeting">Hola {nombre_cliente},</p>
                <p>Tu reserva ha sido confirmada. Aquí tienes los detalles:</p>

                <div class="details">
                    <div class="detail-row">
                        <span class="detail-label">Servicio</span>
                        <span class="detail-value">{servicio_nombre}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Fecha</span>
                        <span class="detail-value">{fecha_formateada}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Hora</span>
                        <span class="detail-value">{hora_formateada}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Duración</span>
                        <span class="detail-value">{duracion} minutos</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Precio</span>
                        <span class="detail-value">{precio:.2f}€</span>
                    </div>
                </div>

                <p style="color: #636e72; font-size: 14px;">
                    Te esperamos en The Lobby Beauty. Si necesitas cancelar o modificar tu cita,
                    por favor contáctanos con al menos 24 horas de antelación.
                </p>
            </div>
            <div class="footer">
                <p>The Lobby Beauty</p>
                <p>Este email fue enviado porque realizaste una reserva en nuestra plataforma.</p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        params = {
            "from": settings.email_from,
            "to": [email_cliente],
            "subject": f"✨ Confirmación de tu cita - {servicio_nombre}",
            "html": html_content,
        }

        resend.Emails.send(params)
        print(f"✅ Email de confirmación enviado a {email_cliente}")
        return True
    except Exception as e:
        print(f"❌ Error enviando email: {e}")
        return False


async def enviar_recordatorio_reserva(
    email_cliente: str,
    nombre_cliente: str,
    servicio_nombre: str,
    fecha: date,
    hora: time,
) -> bool:
    """
    Envía email de recordatorio 24h antes de la cita.
    """
    if not settings.resend_api_key:
        return False

    fecha_formateada = _format_fecha(fecha)
    hora_formateada = _format_hora(hora)

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #faf9f7; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #e17055 0%, #d35400 100%); padding: 30px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; font-size: 28px; }}
            .content {{ padding: 30px; }}
            .highlight {{ background: #fff3e0; border-left: 4px solid #e17055; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }}
            .footer {{ background: #f8f7f5; padding: 20px; text-align: center; font-size: 12px; color: #636e72; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Recordatorio de cita</h1>
            </div>
            <div class="content">
                <p>Hola {nombre_cliente},</p>
                <p>Te recordamos que tienes una cita mañana:</p>

                <div class="highlight">
                    <strong>{servicio_nombre}</strong><br>
                    📅 {fecha_formateada}<br>
                    🕐 {hora_formateada}
                </div>

                <p>¡Te esperamos!</p>
            </div>
            <div class="footer">
                <p>The Lobby Beauty</p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        params = {
            "from": settings.email_from,
            "to": [email_cliente],
            "subject": f"⏰ Recordatorio: Tu cita mañana - {servicio_nombre}",
            "html": html_content,
        }

        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"❌ Error enviando recordatorio: {e}")
        return False


async def enviar_cancelacion_reserva(
    email_cliente: str,
    nombre_cliente: str,
    servicio_nombre: str,
    fecha: date,
    hora: time,
) -> bool:
    """
    Envía email de confirmación de cancelación.
    """
    if not settings.resend_api_key:
        return False

    fecha_formateada = _format_fecha(fecha)
    hora_formateada = _format_hora(hora)

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #faf9f7; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }}
            .header {{ background: #636e72; padding: 30px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; }}
            .content {{ padding: 30px; }}
            .cancelled {{ background: #f5f5f5; padding: 15px; border-radius: 8px; text-decoration: line-through; color: #999; }}
            .footer {{ background: #f8f7f5; padding: 20px; text-align: center; font-size: 12px; color: #636e72; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Cita cancelada</h1>
            </div>
            <div class="content">
                <p>Hola {nombre_cliente},</p>
                <p>Tu cita ha sido cancelada:</p>

                <div class="cancelled">
                    {servicio_nombre}<br>
                    {fecha_formateada} a las {hora_formateada}
                </div>

                <p style="margin-top: 20px;">Si deseas reservar una nueva cita, puedes hacerlo desde nuestra web.</p>
            </div>
            <div class="footer">
                <p>The Lobby Beauty</p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        params = {
            "from": settings.email_from,
            "to": [email_cliente],
            "subject": f"Cita cancelada - {servicio_nombre}",
            "html": html_content,
        }

        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"❌ Error enviando cancelación: {e}")
        return False
