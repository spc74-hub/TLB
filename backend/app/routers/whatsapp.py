"""
Router para gestión de mensajes WhatsApp con Twilio.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.services.whatsapp import enviar_whatsapp_test

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


class TestWhatsAppRequest(BaseModel):
    """Request para enviar WhatsApp de prueba."""
    telefono: str


@router.post("/test")
async def test_whatsapp(request: TestWhatsAppRequest):
    """
    Endpoint para probar la configuración de WhatsApp con Twilio.
    Envía un mensaje de prueba al número especificado.

    IMPORTANTE (Sandbox de Twilio):
    El destinatario debe haber enviado primero "join business-rabbit"
    al número +1 415 523 8886 desde su WhatsApp.

    Uso: POST /api/v1/whatsapp/test
    Body: {"telefono": "+34607332646"} o {"telefono": "607332646"}
    """
    if not request.telefono:
        raise HTTPException(status_code=400, detail="Teléfono requerido")

    resultado = await enviar_whatsapp_test(request.telefono)

    if resultado["enviado"]:
        return {
            "success": True,
            "message": f"WhatsApp de prueba enviado correctamente a {resultado['detalles'].get('telefono_destino', request.telefono)}",
            "detalles": resultado["detalles"]
        }
    else:
        return {
            "success": False,
            "message": "No se pudo enviar el WhatsApp",
            "error": resultado["error"],
            "detalles": resultado["detalles"]
        }


@router.get("/config")
async def get_whatsapp_config():
    """
    Devuelve información sobre la configuración de WhatsApp (para debug).
    """
    from app.core.config import get_settings
    settings = get_settings()

    return {
        "configurado": bool(settings.twilio_account_sid and settings.twilio_auth_token),
        "sandbox_numero": settings.twilio_whatsapp_from,
        "instrucciones_sandbox": (
            "Para usar el sandbox de Twilio, el destinatario debe enviar "
            "'join business-rabbit' al número +1 415 523 8886 desde WhatsApp."
        )
    }
