"""
Database client for The Lobby Beauty.
Drop-in replacement for Supabase — uses direct PostgreSQL via asyncpg.
"""

from app.db.compat import CompatClient, init_supabase, get_supabase_client

# Re-export for backwards compatibility with all routers
__all__ = ["init_supabase", "get_supabase_client", "supabase"]

supabase: CompatClient = None
