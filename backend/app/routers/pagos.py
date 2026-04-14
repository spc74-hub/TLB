"""
Router para gestión de pagos con Stripe.
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import stripe
import json

from app.core.config import get_settings
from app.core.database import get_supabase_client
from app.services.email import enviar_confirmacion_pedido, notificar_admin_nuevo_pedido, enviar_email_test

router = APIRouter(prefix="/pagos", tags=["pagos"])

settings = get_settings()
stripe.api_key = settings.stripe_secret_key

# Constantes de envío
ENVIO_GRATIS_MINIMO = 50.0
COSTE_ENVIO = 4.95


def crear_o_actualizar_cliente_crm_pedido(
    supabase,
    nombre: str,
    email: str,
    telefono: str = None,
    acepta_marketing: bool = False,
    pedido_id: int = None,
    total: float = 0,
):
    """
    Crea o actualiza un cliente en el CRM desde un pedido.
    """
    try:
        cliente_id = None

        # Buscar cliente existente por email
        existente = (
            supabase.table("clientes")
            .select("id, acepta_marketing, total_pedidos, total_gastado")
            await .ilike("email", email).execute()
        )

        if existente.data:
            cliente_id = existente.data[0]["id"]
            acepta_marketing_actual = existente.data[0]["acepta_marketing"]
            total_pedidos_actual = existente.data[0].get("total_pedidos", 0) or 0
            total_gastado_actual = existente.data[0].get("total_gastado", 0) or 0

            # Actualizar datos del cliente
            datos_actualizar = {
                "nombre": nombre,
                "telefono": telefono,
                "total_pedidos": total_pedidos_actual + 1,
                "total_gastado": total_gastado_actual + total,
                "ultima_compra": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }

            # Solo actualizar acepta_marketing si cambia a True
            if acepta_marketing and not acepta_marketing_actual:
                datos_actualizar["acepta_marketing"] = True
                datos_actualizar["fecha_opt_in"] = datetime.now().isoformat()

            await supabase.table("clientes").update(datos_actualizar).eq("id", cliente_id).execute()

        else:
            # Crear nuevo cliente
            datos_cliente = {
                "nombre": nombre,
                "email": email,
                "telefono": telefono,
                "acepta_marketing": acepta_marketing,
                "origen": "pedido",
                "total_reservas": 0,
                "total_pedidos": 1,
                "total_gastado": total,
                "ultima_compra": datetime.now().isoformat(),
            }

            if acepta_marketing:
                datos_cliente["fecha_opt_in"] = datetime.now().isoformat()

            response = await supabase.table("clientes").insert(datos_cliente).execute()
            cliente_id = response.data[0]["id"]

        # Vincular pedido al cliente
        if pedido_id and cliente_id:
            supabase.table("cliente_pedidos_link").insert({
                "cliente_id": cliente_id,
                "pedido_id": pedido_id,
            await }).execute()

        print(f"✅ Cliente CRM {'actualizado' if existente.data else 'creado'}: {email}")

    except Exception as e:
        print(f"⚠️ Error en CRM (pedido no afectado): {e}")


class ItemCarrito(BaseModel):
    """Item del carrito para checkout."""
    producto_id: int
    nombre: str
    precio: float  # En euros
    cantidad: int
    imagen_url: Optional[str] = None


class DatosEnvio(BaseModel):
    """Datos de envío del cliente."""
    nombre: str
    apellidos: str
    email: str
    telefono: str
    direccion: str
    ciudad: str
    codigo_postal: str
    provincia: str
    notas: Optional[str] = ""
    acepta_marketing: bool = False


class CheckoutRequest(BaseModel):
    """Request para crear sesión de checkout."""
    items: List[ItemCarrito]
    datos_envio: DatosEnvio
    success_url: str
    cancel_url: str
    cliente_email: Optional[str] = None
    usuario_id: Optional[str] = None


class PaymentIntentRequest(BaseModel):
    """Request para crear PaymentIntent (checkout embebido)."""
    items: List[ItemCarrito]
    cliente_email: Optional[str] = None


@router.post("/create-checkout-session")
async def create_checkout_session(request: CheckoutRequest):
    """
    Crea una sesión de Stripe Checkout (redirección a página de Stripe).
    Incluye datos de envío en metadata para crear el pedido al confirmar.
    """
    try:
        line_items = []
        subtotal = 0.0

        for item in request.items:
            line_items.append({
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": item.nombre,
                        "images": [item.imagen_url] if item.imagen_url else [],
                    },
                    "unit_amount": int(item.precio * 100),  # Stripe usa centavos
                },
                "quantity": item.cantidad,
            })
            subtotal += item.precio * item.cantidad

        # Calcular coste de envío
        coste_envio = 0.0 if subtotal >= ENVIO_GRATIS_MINIMO else COSTE_ENVIO

        # Añadir línea de envío si aplica
        if coste_envio > 0:
            line_items.append({
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": "Gastos de envío",
                    },
                    "unit_amount": int(coste_envio * 100),
                },
                "quantity": 1,
            })

        # Preparar metadata con datos de envío e items
        # Stripe limita metadata a 500 chars por valor, así que comprimimos
        items_meta = json.dumps([{"id": i.producto_id, "qty": i.cantidad, "precio": i.precio, "nombre": i.nombre} for i in request.items])

        metadata = {
            "usuario_id": request.usuario_id or "",
            "subtotal": str(subtotal),
            "coste_envio": str(coste_envio),
            "items": items_meta[:500],  # Limitar a 500 chars
            "envio_nombre": f"{request.datos_envio.nombre} {request.datos_envio.apellidos}",
            "envio_email": request.datos_envio.email,
            "envio_telefono": request.datos_envio.telefono,
            "envio_direccion": request.datos_envio.direccion,
            "envio_ciudad": request.datos_envio.ciudad,
            "envio_cp": request.datos_envio.codigo_postal,
            "envio_provincia": request.datos_envio.provincia,
            "envio_notas": (request.datos_envio.notas or "")[:500],
            "acepta_marketing": str(request.datos_envio.acepta_marketing),
        }

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            customer_email=request.datos_envio.email,
            locale="es",
            metadata=metadata,
        )

        return {"sessionId": session.id, "url": session.url}

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create-payment-intent")
async def create_payment_intent(request: PaymentIntentRequest):
    """
    Crea un PaymentIntent para checkout embebido (Stripe Elements).
    Permite personalizar completamente el formulario de pago.
    """
    try:
        # Calcular total
        total = sum(item.precio * item.cantidad for item in request.items)

        if total <= 0:
            raise HTTPException(status_code=400, detail="El total debe ser mayor que 0")

        # Crear PaymentIntent
        intent = stripe.PaymentIntent.create(
            amount=int(total * 100),  # Stripe usa centavos
            currency="eur",
            automatic_payment_methods={"enabled": True},
            metadata={
                "items": str([{"id": i.producto_id, "qty": i.cantidad} for i in request.items])
            },
            receipt_email=request.cliente_email,
        )

        return {
            "clientSecret": intent.client_secret,
            "paymentIntentId": intent.id,
            "amount": total,
        }

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


async def crear_pedido_desde_checkout(session: dict):
    """
    Crea un pedido en Supabase desde los datos del checkout de Stripe.
    """
    try:
        supabase = get_supabase_client()
        metadata = session.get("metadata", {})

        # Extraer datos del metadata
        usuario_id = metadata.get("usuario_id") or None
        subtotal = float(metadata.get("subtotal", 0))
        coste_envio = float(metadata.get("coste_envio", 0))
        total = subtotal + coste_envio

        # Crear el pedido principal
        pedido_data = {
            "usuario_id": usuario_id if usuario_id else None,
            "estado": "pagado",
            "subtotal": subtotal,
            "coste_envio": coste_envio,
            "total": total,
            "metodo_pago": "stripe",
            "stripe_payment_id": session.get("payment_intent") or session.get("id"),
            "notas": metadata.get("envio_notas", ""),
            "nombre_envio": metadata.get("envio_nombre", ""),
            "direccion_envio": metadata.get("envio_direccion", ""),
            "ciudad_envio": metadata.get("envio_ciudad", ""),
            "cp_envio": metadata.get("envio_cp", ""),
            "telefono_envio": metadata.get("envio_telefono", ""),
        }

        # Insertar pedido
        result = await supabase.table("pedidos").insert(pedido_data).execute()

        if not result.data:
            print(f"❌ Error creando pedido: {result}")
            return None

        pedido = result.data[0]
        pedido_id = pedido["id"]
        print(f"✅ Pedido #{pedido_id} creado")

        # Crear items del pedido
        items_json = metadata.get("items", "[]")
        try:
            items = json.loads(items_json)
        except json.JSONDecodeError:
            items = []

        for item in items:
            item_data = {
                "pedido_id": pedido_id,
                "producto_id": item.get("id"),
                "cantidad": item.get("qty", 1),
                "precio_unitario": item.get("precio", 0),
                "precio_total": item.get("precio", 0) * item.get("qty", 1),
                "nombre_producto": item.get("nombre", ""),
            }
            await supabase.table("pedido_items").insert(item_data).execute()

        print(f"✅ {len(items)} items añadidos al pedido #{pedido_id}")

        # Crear o actualizar cliente en CRM
        email_cliente = metadata.get("envio_email")
        nombre_cliente = metadata.get("envio_nombre", "Cliente")
        telefono_cliente = metadata.get("envio_telefono", "")
        acepta_marketing = metadata.get("acepta_marketing", "False") == "True"

        if email_cliente:
            try:
                crear_o_actualizar_cliente_crm_pedido(
                    supabase=supabase,
                    nombre=nombre_cliente,
                    email=email_cliente,
                    telefono=telefono_cliente,
                    acepta_marketing=acepta_marketing,
                    pedido_id=pedido_id,
                    total=total,
                )
            except Exception as e:
                print(f"⚠️ Error creando cliente CRM (pedido guardado): {e}")

        # Enviar emails de confirmación (no bloqueante - errores no afectan al pedido)
        direccion_completa = f"{metadata.get('envio_direccion', '')}, {metadata.get('envio_cp', '')} {metadata.get('envio_ciudad', '')}"

        if email_cliente:
            try:
                # Email al cliente
                await enviar_confirmacion_pedido(
                    email_cliente=email_cliente,
                    nombre_cliente=nombre_cliente,
                    pedido_id=pedido_id,
                    items=items,
                    total=total,
                    direccion=direccion_completa,
                )
            except Exception as e:
                print(f"⚠️ Error enviando email al cliente (pedido guardado): {e}")

            try:
                # Notificar al admin
                await notificar_admin_nuevo_pedido(
                    pedido_id=pedido_id,
                    cliente_nombre=nombre_cliente,
                    total=total,
                )
            except Exception as e:
                print(f"⚠️ Error notificando admin (pedido guardado): {e}")

        return pedido

    except Exception as e:
        print(f"❌ Error creando pedido: {e}")
        return None


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Webhook para recibir eventos de Stripe.
    Confirma pagos completados y crea pedidos.
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    # Si no hay webhook secret configurado, aceptar todo (solo dev)
    if not settings.stripe_webhook_secret:
        # En desarrollo, procesar sin verificar firma
        try:
            event = stripe.Event.construct_from(
                stripe.util.json.loads(payload), stripe.api_key
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid payload")
    else:
        # En producción, verificar firma
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.stripe_webhook_secret
            )
        except stripe.error.SignatureVerificationError:
            raise HTTPException(status_code=400, detail="Invalid signature")

    # Manejar eventos
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        print(f"✅ Checkout completado: {session['id']}")

        # Crear pedido en Supabase
        pedido = await crear_pedido_desde_checkout(session)
        if pedido:
            print(f"✅ Pedido #{pedido['id']} guardado en Supabase")

    elif event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        print(f"✅ PaymentIntent completado: {payment_intent['id']}")

    return {"status": "success"}


@router.get("/config")
async def get_stripe_config():
    """
    Devuelve la configuración pública de Stripe.
    """
    return {
        "publishableKey": "pk_test_51SXKIqFFPNdHRBAe44EnZdF54UW9zpjrR5t4be8cOoEGPOUhOo0Legp2RSTaQJfpRUqkUHdmogWLwVjtFKB2dKNs00G3Ldja7K"
    }


@router.get("/verify-session/{session_id}")
async def verify_session(session_id: str):
    """
    Verifica una sesión de Stripe Checkout y crea el pedido si el pago fue exitoso.
    Esto permite crear pedidos sin depender del webhook (útil en desarrollo local).
    """
    try:
        # Recuperar la sesión de Stripe
        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status != "paid":
            return {"success": False, "message": "Pago no completado"}

        # Verificar si ya existe un pedido con este payment_id
        supabase = get_supabase_client()
        payment_id = session.payment_intent or session.id

        existing = await supabase.table("pedidos").select("id").eq("stripe_payment_id", payment_id).execute()

        if existing.data and len(existing.data) > 0:
            # Ya existe el pedido (probablemente creado por webhook)
            return {"success": True, "pedido_id": existing.data[0]["id"], "already_exists": True}

        # Crear el pedido
        pedido = await crear_pedido_desde_checkout(session)

        if pedido:
            return {"success": True, "pedido_id": pedido["id"], "already_exists": False}
        else:
            return {"success": False, "message": "Error creando pedido"}

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/test-email")
async def test_email_endpoint(email: str):
    """
    Endpoint para probar la configuración de emails con Resend.
    Envía un email de prueba a la dirección especificada.

    Uso: POST /api/v1/pagos/test-email?email=tu@email.com
    """
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Email inválido")

    resultado = await enviar_email_test(email)

    if resultado["enviado"]:
        return {
            "success": True,
            "message": f"Email de prueba enviado correctamente a {email}",
            "detalles": resultado["detalles"]
        }
    else:
        return {
            "success": False,
            "message": "No se pudo enviar el email",
            "error": resultado["error"],
            "detalles": resultado["detalles"]
        }
