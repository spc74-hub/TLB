"""
Esquemas Pydantic para The Lobby Beauty.
Define los modelos de datos para validación y serialización.
"""

from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date, time
from typing import Optional
from enum import Enum


# ============== ENUMS ==============

class CategoriaServicio(str, Enum):
    """Categorías de servicios disponibles."""
    MANICURA = "manicura"
    PEDICURA = "pedicura"
    DEPILACION = "depilacion"
    CEJAS = "cejas"
    PESTANAS = "pestanas"


class EstadoReserva(str, Enum):
    """Estados posibles de una reserva."""
    PENDIENTE = "pendiente"
    CONFIRMADA = "confirmada"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"


class RolUsuario(str, Enum):
    """Roles de usuario en el sistema."""
    CLIENTE = "cliente"
    ADMIN = "admin"
    PROFESIONAL = "profesional"


# ============== CATEGORÍAS ==============

class CategoriaBase(BaseModel):
    """Esquema base para categorías de servicios."""
    nombre: str = Field(..., min_length=2, max_length=100)
    slug: str = Field(..., min_length=2, max_length=100)
    descripcion: Optional[str] = None
    icono: Optional[str] = None  # Nombre del icono de Lucide


class CategoriaCreate(CategoriaBase):
    """Esquema para crear una categoría."""
    pass


class Categoria(CategoriaBase):
    """Esquema completo de categoría con ID."""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============== SERVICIOS ==============

class ServicioBase(BaseModel):
    """Esquema base para servicios."""
    nombre: str = Field(..., min_length=2, max_length=200)
    descripcion: Optional[str] = None
    categoria: CategoriaServicio
    duracion_minutos: int = Field(..., ge=15, le=240)
    precio: float = Field(..., ge=0)
    es_libre_toxicos: bool = Field(default=True, description="Libre de TPO/DMPT")
    imagen_url: Optional[str] = None
    activo: bool = True


class ServicioCreate(ServicioBase):
    """Esquema para crear un servicio."""
    pass


class ServicioUpdate(BaseModel):
    """Esquema para actualizar un servicio."""
    nombre: Optional[str] = Field(None, min_length=2, max_length=200)
    descripcion: Optional[str] = None
    categoria: Optional[CategoriaServicio] = None
    duracion_minutos: Optional[int] = Field(None, ge=15, le=240)
    precio: Optional[float] = Field(None, ge=0)
    es_libre_toxicos: Optional[bool] = None
    imagen_url: Optional[str] = None
    activo: Optional[bool] = None


class Servicio(ServicioBase):
    """Esquema completo de servicio con ID."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============== USUARIOS ==============

class UsuarioBase(BaseModel):
    """Esquema base para usuarios."""
    email: EmailStr
    nombre: str = Field(..., min_length=2, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)


class UsuarioCreate(UsuarioBase):
    """Esquema para crear un usuario."""
    password: str = Field(..., min_length=6)


class UsuarioUpdate(BaseModel):
    """Esquema para actualizar un usuario."""
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    telefono: Optional[str] = Field(None, max_length=20)


class Usuario(UsuarioBase):
    """Esquema completo de usuario (sin password)."""
    id: str  # UUID de Supabase
    rol: RolUsuario = RolUsuario.CLIENTE
    created_at: datetime

    class Config:
        from_attributes = True


# ============== RESERVAS ==============

class ReservaBase(BaseModel):
    """Esquema base para reservas."""
    servicio_id: int
    fecha: date
    hora: time
    notas: Optional[str] = Field(None, max_length=500)


class ReservaCreate(ReservaBase):
    """Esquema para crear una reserva."""
    pass


class ReservaUpdate(BaseModel):
    """Esquema para actualizar una reserva."""
    fecha: Optional[date] = None
    hora: Optional[time] = None
    estado: Optional[EstadoReserva] = None
    notas: Optional[str] = Field(None, max_length=500)


class Reserva(ReservaBase):
    """Esquema completo de reserva."""
    id: int
    usuario_id: str
    estado: EstadoReserva = EstadoReserva.PENDIENTE
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReservaConDetalles(Reserva):
    """Reserva con información del servicio incluida."""
    servicio: Optional[Servicio] = None


# ============== RESEÑAS ==============

class ResenaBase(BaseModel):
    """Esquema base para reseñas."""
    servicio_id: int
    puntuacion: int = Field(..., ge=1, le=5)
    comentario: Optional[str] = Field(None, max_length=1000)


class ResenaCreate(ResenaBase):
    """Esquema para crear una reseña."""
    pass


class Resena(ResenaBase):
    """Esquema completo de reseña."""
    id: int
    usuario_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# ============== RESPUESTAS API ==============

class MensajeRespuesta(BaseModel):
    """Respuesta genérica con mensaje."""
    mensaje: str
    exito: bool = True


class ListaServicios(BaseModel):
    """Lista paginada de servicios."""
    items: list[Servicio]
    total: int
    pagina: int
    por_pagina: int
