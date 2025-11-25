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


# ============================================
# EMAILS DE PEDIDOS
# ============================================

async def enviar_confirmacion_pedido(
    email_cliente: str,
    nombre_cliente: str,
    pedido_id: int,
    items: list,
    total: float,
    direccion: Optional[str] = None,
) -> bool:
    """
    Envía email de confirmación de pedido al cliente.
    """
    if not settings.resend_api_key:
        print("⚠️ RESEND_API_KEY no configurada, email no enviado")
        return False

    # Generar HTML de items
    items_html = ""
    for item in items:
        nombre = item.get("nombre", "Producto")
        cantidad = item.get("cantidad", 1)
        precio = item.get("precio", 0)
        items_html += f"""
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee;">{nombre}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center;">{cantidad}</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right;">{precio:.2f}€</td>
        </tr>
        """

    direccion_html = ""
    if direccion:
        direccion_html = f"""
        <div style="background: #f8f7f5; border-radius: 8px; padding: 15px; margin-top: 20px;">
            <strong style="color: #636e72;">Dirección de envío:</strong>
            <p style="margin: 10px 0 0; color: #2d3436;">{direccion}</p>
        </div>
        """

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
            .order-number {{ background: #6b8f71; color: white; display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; margin-bottom: 20px; }}
            table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
            th {{ text-align: left; padding: 12px 0; border-bottom: 2px solid #6b8f71; color: #636e72; font-size: 12px; text-transform: uppercase; }}
            .total-row {{ font-size: 18px; font-weight: bold; color: #6b8f71; }}
            .footer {{ background: #f8f7f5; padding: 20px; text-align: center; font-size: 12px; color: #636e72; }}
            .icon {{ font-size: 48px; margin-bottom: 10px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">🛍️</div>
                <h1>The Lobby Beauty</h1>
                <p>¡Gracias por tu pedido!</p>
            </div>
            <div class="content">
                <p>Hola {nombre_cliente},</p>
                <p>Hemos recibido tu pedido y lo estamos preparando.</p>

                <span class="order-number">Pedido #{pedido_id}</span>

                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th style="text-align: center;">Cant.</th>
                            <th style="text-align: right;">Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items_html}
                        <tr class="total-row">
                            <td colspan="2" style="padding-top: 15px;">Total</td>
                            <td style="padding-top: 15px; text-align: right;">{total:.2f}€</td>
                        </tr>
                    </tbody>
                </table>

                {direccion_html}

                <p style="color: #636e72; font-size: 14px; margin-top: 20px;">
                    Te notificaremos cuando tu pedido esté en camino.
                    Si tienes alguna pregunta, no dudes en contactarnos.
                </p>
            </div>
            <div class="footer">
                <p>The Lobby Beauty</p>
                <p>Este email fue enviado porque realizaste un pedido en nuestra tienda.</p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        params = {
            "from": settings.email_from,
            "to": [email_cliente],
            "subject": f"🛍️ Pedido #{pedido_id} confirmado - The Lobby Beauty",
            "html": html_content,
        }

        resend.Emails.send(params)
        print(f"✅ Email de pedido enviado a {email_cliente}")
        return True
    except Exception as e:
        print(f"❌ Error enviando email de pedido: {e}")
        return False


async def enviar_pedido_enviado(
    email_cliente: str,
    nombre_cliente: str,
    pedido_id: int,
    numero_seguimiento: Optional[str] = None,
) -> bool:
    """
    Envía email cuando el pedido ha sido enviado.
    """
    if not settings.resend_api_key:
        return False

    seguimiento_html = ""
    if numero_seguimiento:
        seguimiento_html = f"""
        <div style="background: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #2e7d32; font-size: 14px;">Número de seguimiento:</p>
            <p style="margin: 10px 0 0; font-size: 20px; font-weight: bold; color: #1b5e20;">{numero_seguimiento}</p>
        </div>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #faf9f7; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%); padding: 30px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; font-size: 28px; }}
            .content {{ padding: 30px; }}
            .footer {{ background: #f8f7f5; padding: 20px; text-align: center; font-size: 12px; color: #636e72; }}
            .icon {{ font-size: 48px; margin-bottom: 10px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">📦</div>
                <h1>¡Tu pedido está en camino!</h1>
            </div>
            <div class="content">
                <p>Hola {nombre_cliente},</p>
                <p>Tu pedido <strong>#{pedido_id}</strong> ha sido enviado y pronto llegará a tu dirección.</p>

                {seguimiento_html}

                <p style="color: #636e72; font-size: 14px;">
                    El tiempo estimado de entrega es de 2-5 días laborables.
                </p>
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
            "subject": f"📦 Tu pedido #{pedido_id} está en camino - The Lobby Beauty",
            "html": html_content,
        }

        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"❌ Error enviando email de envío: {e}")
        return False


# ============================================
# EMAILS ADMIN
# ============================================

async def notificar_admin_nuevo_pedido(
    pedido_id: int,
    cliente_nombre: str,
    total: float,
    admin_email: str = "sergio.porcar@gmail.com",
) -> bool:
    """
    Notifica al admin cuando hay un nuevo pedido.
    """
    if not settings.resend_api_key:
        return False

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #faf9f7; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }}
            .header {{ background: #6b8f71; padding: 20px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; font-size: 20px; }}
            .content {{ padding: 30px; }}
            .highlight {{ background: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0; }}
            .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #636e72; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔔 Nuevo Pedido</h1>
            </div>
            <div class="content">
                <div class="highlight">
                    <p style="margin: 0;"><strong>Pedido:</strong> #{pedido_id}</p>
                    <p style="margin: 10px 0 0;"><strong>Cliente:</strong> {cliente_nombre}</p>
                    <p style="margin: 10px 0 0;"><strong>Total:</strong> {total:.2f}€</p>
                </div>
                <p>Accede al panel de administración para ver los detalles y procesar el pedido.</p>
            </div>
            <div class="footer">
                <p>The Lobby Beauty - Panel Admin</p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        params = {
            "from": settings.email_from,
            "to": [admin_email],
            "subject": f"🔔 Nuevo pedido #{pedido_id} - {total:.2f}€",
            "html": html_content,
        }

        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"❌ Error notificando admin: {e}")
        return False


async def notificar_admin_nueva_cita(
    cliente_nombre: str,
    servicio_nombre: str,
    fecha: date,
    hora: time,
    admin_email: str = "sergio.porcar@gmail.com",
) -> bool:
    """
    Notifica al admin cuando hay una nueva cita.
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
            .header {{ background: #6b8f71; padding: 20px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; font-size: 20px; }}
            .content {{ padding: 30px; }}
            .highlight {{ background: #fff3e0; border-radius: 8px; padding: 20px; margin: 20px 0; }}
            .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #636e72; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📅 Nueva Cita</h1>
            </div>
            <div class="content">
                <div class="highlight">
                    <p style="margin: 0;"><strong>Cliente:</strong> {cliente_nombre}</p>
                    <p style="margin: 10px 0 0;"><strong>Servicio:</strong> {servicio_nombre}</p>
                    <p style="margin: 10px 0 0;"><strong>Fecha:</strong> {fecha_formateada}</p>
                    <p style="margin: 10px 0 0;"><strong>Hora:</strong> {hora_formateada}</p>
                </div>
                <p>Accede al panel de administración para ver la agenda.</p>
            </div>
            <div class="footer">
                <p>The Lobby Beauty - Panel Admin</p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        params = {
            "from": settings.email_from,
            "to": [admin_email],
            "subject": f"📅 Nueva cita: {servicio_nombre} - {fecha_formateada}",
            "html": html_content,
        }

        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"❌ Error notificando admin: {e}")
        return False


# ============================================
# TEST EMAIL
# ============================================

async def enviar_email_test(email_destino: str) -> dict:
    """
    Envía un email de prueba para verificar la configuración de Resend.
    Retorna un dict con el resultado y detalles del diagnóstico.
    """
    resultado = {
        "configurado": False,
        "enviado": False,
        "error": None,
        "detalles": {}
    }

    # Verificar configuración
    if not settings.resend_api_key:
        resultado["error"] = "RESEND_API_KEY no está configurada en el archivo .env"
        resultado["detalles"]["api_key_presente"] = False
        return resultado

    resultado["configurado"] = True
    resultado["detalles"]["api_key_presente"] = True
    resultado["detalles"]["email_from"] = settings.email_from

    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #faf9f7; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #6b8f71 0%, #5a7d60 100%); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 30px; text-align: center; }
            .success { background: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .success p { color: #2e7d32; margin: 0; font-size: 18px; }
            .footer { background: #f8f7f5; padding: 20px; text-align: center; font-size: 12px; color: #636e72; }
            .icon { font-size: 64px; margin-bottom: 10px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="icon">✅</div>
                <h1>The Lobby Beauty</h1>
            </div>
            <div class="content">
                <div class="success">
                    <p>¡La configuración de emails funciona correctamente!</p>
                </div>
                <p style="color: #636e72;">
                    Este es un email de prueba enviado desde el sistema de notificaciones
                    de The Lobby Beauty usando Resend.
                </p>
                <p style="color: #636e72; font-size: 12px; margin-top: 20px;">
                    Si recibes este email, todo está configurado correctamente.
                </p>
            </div>
            <div class="footer">
                <p>The Lobby Beauty - Test de configuración</p>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        params = {
            "from": settings.email_from,
            "to": [email_destino],
            "subject": "✅ Test de email - The Lobby Beauty",
            "html": html_content,
        }

        response = resend.Emails.send(params)
        resultado["enviado"] = True
        resultado["detalles"]["resend_id"] = response.get("id") if isinstance(response, dict) else str(response)
        print(f"✅ Email de test enviado a {email_destino}")
        return resultado

    except Exception as e:
        resultado["error"] = str(e)
        print(f"❌ Error enviando email de test: {e}")
        return resultado
