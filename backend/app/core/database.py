"""
Cliente de Supabase para The Lobby Beauty.
Gestiona la conexión con la base de datos PostgreSQL a través de Supabase.
"""

from supabase import create_client, Client
from app.core.config import get_settings


def get_supabase_client() -> Client:
    """
    Crea y retorna un cliente de Supabase con service_role key.
    Esto permite al backend bypassear RLS para operaciones como crear pedidos.

    Returns:
        Client: Cliente de Supabase configurado con service_role.
    """
    settings = get_settings()
    # Usar service_role key si está disponible, sino usar anon key
    key = settings.supabase_service_role_key or settings.supabase_key
    return create_client(settings.supabase_url, key)


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
