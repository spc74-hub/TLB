"""
Configuración de la aplicación The Lobby Beauty.
Gestiona variables de entorno y configuraciones globales.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Configuración de la aplicación."""

    # Aplicación
    app_name: str = "The Lobby Beauty API"
    app_version: str = "1.0.0"
    debug: bool = False

    # Supabase (requerido en producción, opcional en desarrollo)
    supabase_url: str = ""
    supabase_key: str = ""  # anon key para frontend
    supabase_service_role_key: str = ""  # service_role key para backend (bypasea RLS)

    # CORS - URLs permitidas (separadas por coma)
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # JWT (si usamos autenticación propia además de Supabase)
    secret_key: str = "tu-clave-secreta-cambiar-en-produccion"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # Email (Resend)
    resend_api_key: str = ""
    # En desarrollo usar: "The Lobby Beauty <onboarding@resend.dev>"
    # En produccion con dominio verificado: "The Lobby Beauty <noreply@thelobbybeauty.com>"
    email_from: str = "The Lobby Beauty <onboarding@resend.dev>"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Obtiene la configuración cacheada."""
    return Settings()
