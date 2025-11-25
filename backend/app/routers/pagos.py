"""
Router para gestión de pagos con Stripe.
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
import stripe

from app.core.config import get_settings

router = APIRouter(prefix="/pagos", tags=["pagos"])

settings = get_settings()
stripe.api_key = settings.stripe_secret_key


class ItemCarrito(BaseModel):
    """Item del carrito para checkout."""
    producto_id: int
    nombre: str
    precio: float  # En euros
    cantidad: int
    imagen_url: Optional[str] = None


class CheckoutRequest(BaseModel):
    """Request para crear sesión de checkout."""
    items: List[ItemCarrito]
    success_url: str
    cancel_url: str
    cliente_email: Optional[str] = None


class PaymentIntentRequest(BaseModel):
    """Request para crear PaymentIntent (checkout embebido)."""
    items: List[ItemCarrito]
    cliente_email: Optional[str] = None


@router.post("/create-checkout-session")
async def create_checkout_session(request: CheckoutRequest):
    """
    Crea una sesión de Stripe Checkout (redirección a página de Stripe).
    Útil para un checkout rápido sin personalización.
    """
    try:
        line_items = []
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

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            customer_email=request.cliente_email,
            locale="es",
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


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Webhook para recibir eventos de Stripe.
    Confirma pagos completados y actualiza pedidos.
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
    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        # TODO: Actualizar pedido en Supabase
        print(f"✅ Pago completado: {payment_intent['id']}")

    elif event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        # TODO: Actualizar pedido en Supabase
        print(f"✅ Checkout completado: {session['id']}")

    return {"status": "success"}


@router.get("/config")
async def get_stripe_config():
    """
    Devuelve la configuración pública de Stripe.
    """
    return {
        "publishableKey": "pk_test_51SXKIqFFPNdHRBAe44EnZdF54UW9zpjrR5t4be8cOoEGPOUhOo0Legp2RSTaQJfpRUqkUHdmogWLwVjtFKB2dKNs00G3Ldja7K"
    }
