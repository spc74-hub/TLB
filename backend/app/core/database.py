"""
Cliente de Supabase para The Lobby Beauty.
Gestiona la conexión con la base de datos PostgreSQL a través de Supabase.
"""

from supabase import create_client, Client
from app.core.config import get_settings


def get_supabase_client() -> Client:
    """
    Crea y retorna un cliente de Supabase.

    Returns:
        Client: Cliente de Supabase configurado.
    """
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


# Cliente singleton para reutilizar en toda la aplicación
supabase: Client = None


def init_supabase() -> Client:
    """
    Inicializa el cliente de Supabase como singleton.

    Returns:
        Client: Cliente de Supabase.
    """
    global supabase
    if supabase is None:
        supabase = get_supabase_client()
    return supabase
