"""
Router para gestión de usuarios.
Permite crear, listar, actualizar y eliminar usuarios desde el panel de admin.
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime

from app.core.database import get_supabase_client


router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


# ============== SCHEMAS ==============

class RolUsuario(str, Enum):
    CLIENTE = "cliente"
    ADMIN = "admin"
    PROFESIONAL = "profesional"


class UsuarioCreate(BaseModel):
    """Esquema para crear un usuario."""
    email: EmailStr
    password: str = Field(..., min_length=6)
    nombre: str = Field(..., min_length=2, max_length=100)
    apellidos: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)
    rol: RolUsuario = RolUsuario.CLIENTE


class UsuarioUpdate(BaseModel):
    """Esquema para actualizar un usuario."""
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    apellidos: Optional[str] = Field(None, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)
    rol: Optional[RolUsuario] = None


class UsuarioResponse(BaseModel):
    """Respuesta de usuario."""
    id: str
    email: str
    nombre: Optional[str] = None
    apellidos: Optional[str] = None
    telefono: Optional[str] = None
    rol: str
    created_at: Optional[datetime] = None


class UsuarioListResponse(BaseModel):
    """Respuesta de lista de usuarios."""
    usuarios: List[UsuarioResponse]
    total: int


# ============== ENDPOINTS ==============

@router.get("/", response_model=UsuarioListResponse)
async def listar_usuarios(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(20, ge=1, le=100),
    busqueda: Optional[str] = None,
    rol: Optional[str] = None,
):
    """
    Lista todos los usuarios con filtros opcionales.
    Solo accesible por administradores.
    """
    try:
        supabase = get_supabase_client()

        # Construir query base
        query = supabase.table("perfiles").select("*", count="exact")

        # Filtro por rol
        if rol:
            query = query.eq("rol", rol)

        # Filtro por búsqueda (email o nombre)
        if busqueda:
            query = query.or_(f"email.ilike.%{busqueda}%,nombre.ilike.%{busqueda}%")

        # Ordenar por fecha de creación
        query = query.order("created_at", desc=True)

        # Paginación
        offset = (pagina - 1) * por_pagina
        query = query.range(offset, offset + por_pagina - 1)

        result = query.execute()

        usuarios = []
        for u in result.data:
            usuarios.append(UsuarioResponse(
                id=u["id"],
                email=u.get("email", ""),
                nombre=u.get("nombre"),
                apellidos=u.get("apellidos"),
                telefono=u.get("telefono"),
                rol=u.get("rol", "cliente"),
                created_at=u.get("created_at"),
            ))

        return UsuarioListResponse(
            usuarios=usuarios,
            total=result.count or len(usuarios)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al listar usuarios: {str(e)}")


@router.post("/", response_model=UsuarioResponse)
async def crear_usuario(usuario: UsuarioCreate):
    """
    Crea un nuevo usuario en Supabase Auth y en la tabla perfiles.
    Solo accesible por administradores.
    """
    try:
        supabase = get_supabase_client()

        # 1. Crear usuario en Supabase Auth
        auth_response = supabase.auth.admin.create_user({
            "email": usuario.email,
            "password": usuario.password,
            "email_confirm": True,  # Auto-confirmar email
            "user_metadata": {
                "nombre": usuario.nombre,
                "apellidos": usuario.apellidos,
            }
        })

        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Error al crear usuario en Auth")

        user_id = auth_response.user.id

        # 2. Crear/actualizar perfil en la tabla perfiles
        # (el trigger debería haberlo creado, pero actualizamos con los datos completos)
        perfil_data = {
            "id": user_id,
            "email": usuario.email,
            "nombre": usuario.nombre,
            "apellidos": usuario.apellidos,
            "telefono": usuario.telefono,
            "rol": usuario.rol.value,
        }

        supabase.table("perfiles").upsert(perfil_data).execute()

        return UsuarioResponse(
            id=user_id,
            email=usuario.email,
            nombre=usuario.nombre,
            apellidos=usuario.apellidos,
            telefono=usuario.telefono,
            rol=usuario.rol.value,
            created_at=datetime.now(),
        )

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower() or "already exists" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Ya existe un usuario con ese email")
        raise HTTPException(status_code=500, detail=f"Error al crear usuario: {error_msg}")


@router.get("/{usuario_id}", response_model=UsuarioResponse)
async def obtener_usuario(usuario_id: str):
    """
    Obtiene un usuario por su ID.
    """
    try:
        supabase = get_supabase_client()

        result = supabase.table("perfiles").select("*").eq("id", usuario_id).single().execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        u = result.data
        return UsuarioResponse(
            id=u["id"],
            email=u.get("email", ""),
            nombre=u.get("nombre"),
            apellidos=u.get("apellidos"),
            telefono=u.get("telefono"),
            rol=u.get("rol", "cliente"),
            created_at=u.get("created_at"),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener usuario: {str(e)}")


@router.put("/{usuario_id}", response_model=UsuarioResponse)
async def actualizar_usuario(usuario_id: str, usuario: UsuarioUpdate):
    """
    Actualiza los datos de un usuario.
    Solo accesible por administradores.
    """
    try:
        supabase = get_supabase_client()

        # Preparar datos a actualizar (solo los que no son None)
        update_data = {}
        if usuario.nombre is not None:
            update_data["nombre"] = usuario.nombre
        if usuario.apellidos is not None:
            update_data["apellidos"] = usuario.apellidos
        if usuario.telefono is not None:
            update_data["telefono"] = usuario.telefono
        if usuario.rol is not None:
            update_data["rol"] = usuario.rol.value

        if not update_data:
            raise HTTPException(status_code=400, detail="No hay datos para actualizar")

        update_data["updated_at"] = datetime.now().isoformat()

        # Actualizar en la tabla perfiles
        result = supabase.table("perfiles").update(update_data).eq("id", usuario_id).execute()

        if not result.data:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        u = result.data[0]
        return UsuarioResponse(
            id=u["id"],
            email=u.get("email", ""),
            nombre=u.get("nombre"),
            apellidos=u.get("apellidos"),
            telefono=u.get("telefono"),
            rol=u.get("rol", "cliente"),
            created_at=u.get("created_at"),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar usuario: {str(e)}")


@router.delete("/{usuario_id}")
async def eliminar_usuario(usuario_id: str):
    """
    Elimina un usuario de Supabase Auth y de la tabla perfiles.
    Solo accesible por administradores.
    """
    try:
        supabase = get_supabase_client()

        # 1. Eliminar de Supabase Auth (esto también eliminará el perfil por CASCADE)
        supabase.auth.admin.delete_user(usuario_id)

        return {"message": "Usuario eliminado correctamente", "id": usuario_id}

    except Exception as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        raise HTTPException(status_code=500, detail=f"Error al eliminar usuario: {error_msg}")


@router.post("/{usuario_id}/reset-password")
async def resetear_password(usuario_id: str, new_password: str = Query(..., min_length=6)):
    """
    Resetea la contraseña de un usuario.
    Solo accesible por administradores.
    """
    try:
        supabase = get_supabase_client()

        # Actualizar contraseña usando la API de admin
        supabase.auth.admin.update_user_by_id(
            usuario_id,
            {"password": new_password}
        )

        return {"message": "Contraseña actualizada correctamente"}

    except Exception as e:
        error_msg = str(e)
        if "not found" in error_msg.lower():
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        raise HTTPException(status_code=500, detail=f"Error al resetear contraseña: {error_msg}")
