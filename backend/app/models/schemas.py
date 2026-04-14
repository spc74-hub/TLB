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


class CategoriaProducto(str, Enum):
    """Categorías de productos disponibles."""
    MANICURA = "manicura"
    PEDICURA = "pedicura"
    FACIAL = "facial"
    CORPORAL = "corporal"
    CABELLO = "cabello"
    ACCESORIOS = "accesorios"
    KITS = "kits"


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
    duracion_minutos: int = Field(..., ge=5, le=240)
    precio: float = Field(..., ge=0)
    precio_oferta: Optional[float] = Field(None, ge=0)
    es_libre_toxicos: bool = Field(default=True, description="Libre de TPO/DMPT")
    imagen_url: Optional[str] = None
    activo: bool = True
    destacado: bool = False


class ServicioCreate(ServicioBase):
    """Esquema para crear un servicio."""
    pass


class ServicioUpdate(BaseModel):
    """Esquema para actualizar un servicio."""
    nombre: Optional[str] = Field(None, min_length=2, max_length=200)
    descripcion: Optional[str] = None
    categoria: Optional[CategoriaServicio] = None
    duracion_minutos: Optional[int] = Field(None, ge=5, le=240)
    precio: Optional[float] = Field(None, ge=0)
    precio_oferta: Optional[float] = Field(None, ge=0)
    es_libre_toxicos: Optional[bool] = None
    imagen_url: Optional[str] = None
    activo: Optional[bool] = None
    destacado: Optional[bool] = None


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
    cliente_nombre: str = Field(..., min_length=2, max_length=100)
    cliente_email: Optional[str] = Field(None, max_length=255)
    cliente_telefono: Optional[str] = Field(None, max_length=20)
    acepta_marketing: bool = Field(default=False, description="Opt-in para comunicaciones de marketing")


class ReservaUpdate(BaseModel):
    """Esquema para actualizar una reserva."""
    fecha: Optional[date] = None
    hora: Optional[time] = None
    estado: Optional[EstadoReserva] = None
    notas: Optional[str] = Field(None, max_length=500)


class Reserva(ReservaBase):
    """Esquema completo de reserva."""
    id: int
    usuario_id: Optional[str] = None
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


# ============== PRODUCTOS ==============

class ProductoBase(BaseModel):
    """Esquema base para productos."""
    nombre: str = Field(..., min_length=2, max_length=200)
    descripcion: str = Field(..., min_length=10)
    descripcion_corta: str = Field(..., min_length=10, max_length=200)
    categoria: CategoriaProducto
    precio: float = Field(..., ge=0)
    precio_oferta: Optional[float] = Field(None, ge=0)
    imagen_url: Optional[str] = None
    imagenes_extra: Optional[list[str]] = None
    stock: int = Field(default=0, ge=0)
    es_natural: bool = True
    es_vegano: bool = False
    es_cruelty_free: bool = True
    ingredientes: Optional[list[str]] = None
    modo_uso: Optional[str] = None
    activo: bool = True
    destacado: bool = False


class ProductoCreate(ProductoBase):
    """Esquema para crear un producto."""
    pass


class ProductoUpdate(BaseModel):
    """Esquema para actualizar un producto."""
    nombre: Optional[str] = Field(None, min_length=2, max_length=200)
    descripcion: Optional[str] = Field(None, min_length=10)
    descripcion_corta: Optional[str] = Field(None, min_length=10, max_length=200)
    categoria: Optional[CategoriaProducto] = None
    precio: Optional[float] = Field(None, ge=0)
    precio_oferta: Optional[float] = Field(None, ge=0)
    imagen_url: Optional[str] = None
    imagenes_extra: Optional[list[str]] = None
    stock: Optional[int] = Field(None, ge=0)
    es_natural: Optional[bool] = None
    es_vegano: Optional[bool] = None
    es_cruelty_free: Optional[bool] = None
    ingredientes: Optional[list[str]] = None
    modo_uso: Optional[str] = None
    activo: Optional[bool] = None
    destacado: Optional[bool] = None


class Producto(ProductoBase):
    """Esquema completo de producto con ID."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ListaProductos(BaseModel):
    """Lista paginada de productos."""
    items: list[Producto]
    total: int
    pagina: int
    por_pagina: int


# ============== CATEGORÍAS DE PRODUCTOS ==============

class CategoriaProductoInfo(BaseModel):
    """Información de categoría de producto."""
    id: int
    nombre: str
    slug: str
    descripcion: Optional[str] = None
    icono: Optional[str] = None
    imagen_url: Optional[str] = None
    orden: int = 0
    activo: bool = True

    class Config:
        from_attributes = True


# ============== CRM - CLIENTES ==============

class OrigenCliente(str, Enum):
    """Origen del cliente en el sistema."""
    WEB = "web"
    TIENDA = "tienda"
    IMPORTACION = "importacion"
    MANUAL = "manual"
    RESERVA = "reserva"
    PEDIDO = "pedido"


class EstadoCampana(str, Enum):
    """Estados posibles de una campaña."""
    BORRADOR = "borrador"
    PROGRAMADA = "programada"
    ENVIANDO = "enviando"
    COMPLETADA = "completada"
    CANCELADA = "cancelada"


class CanalComunicacion(str, Enum):
    """Canales de comunicación disponibles."""
    EMAIL = "email"
    WHATSAPP = "whatsapp"
    AMBOS = "ambos"


class EstadoEnvio(str, Enum):
    """Estados posibles de un envío."""
    PENDIENTE = "pendiente"
    ENVIADO = "enviado"
    ENTREGADO = "entregado"
    FALLIDO = "fallido"
    REBOTADO = "rebotado"


class ClienteBase(BaseModel):
    """Esquema base para clientes."""
    nombre: str = Field(..., min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, max_length=20)
    notas: Optional[str] = None
    etiquetas: Optional[list[str]] = None


class ClienteCreate(ClienteBase):
    """Esquema para crear un cliente."""
    acepta_marketing: bool = False
    origen: OrigenCliente = OrigenCliente.MANUAL


class ClienteUpdate(BaseModel):
    """Esquema para actualizar un cliente."""
    nombre: Optional[str] = Field(None, min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, max_length=20)
    notas: Optional[str] = None
    etiquetas: Optional[list[str]] = None
    acepta_marketing: Optional[bool] = None


class Cliente(ClienteBase):
    """Esquema completo de cliente."""
    id: str  # UUID
    usuario_id: Optional[str] = None
    acepta_marketing: bool = False
    fecha_opt_in: Optional[datetime] = None
    fecha_opt_out: Optional[datetime] = None
    origen: OrigenCliente = OrigenCliente.MANUAL
    total_reservas: int = 0
    total_pedidos: int = 0
    total_gastado: float = 0
    ultima_visita: Optional[date] = None
    ultima_compra: Optional[date] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ClienteConHistorial(Cliente):
    """Cliente con historial de reservas y pedidos."""
    reservas: Optional[list] = None
    pedidos: Optional[list] = None


class ListaClientes(BaseModel):
    """Lista paginada de clientes."""
    items: list[Cliente]
    total: int
    pagina: int
    por_pagina: int


# ============== CRM - CAMPAÑAS ==============

class FiltrosSegmentacion(BaseModel):
    """Filtros para segmentar destinatarios de campañas."""
    etiquetas: Optional[list[str]] = None
    min_compras: Optional[int] = None
    max_compras: Optional[int] = None
    min_reservas: Optional[int] = None
    min_gastado: Optional[float] = None
    ultimo_mes: Optional[bool] = None
    sin_actividad_dias: Optional[int] = None


class CampanaBase(BaseModel):
    """Esquema base para campañas."""
    nombre: str = Field(..., min_length=2, max_length=200)
    descripcion: Optional[str] = None
    asunto: Optional[str] = Field(None, max_length=200)  # Para emails
    mensaje: str = Field(..., min_length=10)
    mensaje_html: Optional[str] = None
    canal: CanalComunicacion = CanalComunicacion.EMAIL
    filtros_segmentacion: Optional[FiltrosSegmentacion] = None


class CampanaCreate(CampanaBase):
    """Esquema para crear una campaña."""
    fecha_programada: Optional[datetime] = None


class CampanaUpdate(BaseModel):
    """Esquema para actualizar una campaña."""
    nombre: Optional[str] = Field(None, min_length=2, max_length=200)
    descripcion: Optional[str] = None
    asunto: Optional[str] = Field(None, max_length=200)
    mensaje: Optional[str] = Field(None, min_length=10)
    mensaje_html: Optional[str] = None
    canal: Optional[CanalComunicacion] = None
    filtros_segmentacion: Optional[FiltrosSegmentacion] = None
    fecha_programada: Optional[datetime] = None
    estado: Optional[EstadoCampana] = None


class Campana(CampanaBase):
    """Esquema completo de campaña."""
    id: int
    estado: EstadoCampana = EstadoCampana.BORRADOR
    fecha_programada: Optional[datetime] = None
    fecha_inicio: Optional[datetime] = None
    fecha_fin: Optional[datetime] = None
    total_destinatarios: int = 0
    total_enviados: int = 0
    total_entregados: int = 0
    total_fallidos: int = 0
    total_abiertos: int = 0
    total_clicks: int = 0
    creado_por: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ListaCampanas(BaseModel):
    """Lista paginada de campañas."""
    items: list[Campana]
    total: int
    pagina: int
    por_pagina: int


# ============== CRM - ENVÍOS ==============

class CampanaEnvio(BaseModel):
    """Registro de envío de campaña a un cliente."""
    id: int
    campana_id: int
    cliente_id: str
    estado: EstadoEnvio = EstadoEnvio.PENDIENTE
    canal: CanalComunicacion
    destinatario: str
    fecha_enviado: Optional[datetime] = None
    fecha_entregado: Optional[datetime] = None
    fecha_abierto: Optional[datetime] = None
    fecha_click: Optional[datetime] = None
    error_mensaje: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ============== IMPORTACIÓN EXCEL ==============

class ClienteImportacion(BaseModel):
    """Esquema para importar clientes desde Excel."""
    nombre: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    etiquetas: Optional[str] = None  # Separadas por coma
    acepta_marketing: Optional[bool] = True
    notas: Optional[str] = None


class ResultadoImportacion(BaseModel):
    """Resultado de importación de clientes."""
    total_procesados: int
    creados: int
    actualizados: int
    errores: int
    detalle_errores: Optional[list[str]] = None


# ============== ERP - ENUMS ==============

class CategoriaGastoBase(str, Enum):
    """Categorías base de gastos."""
    NOMINAS = "nominas"
    ALQUILER = "alquiler"
    SUMINISTROS = "suministros"
    MARKETING = "marketing"
    PRODUCTOS = "productos"
    FORMACION = "formacion"
    SEGUROS = "seguros"
    IMPUESTOS = "impuestos"
    MANTENIMIENTO = "mantenimiento"
    OTROS = "otros"


class TipoCuenta(str, Enum):
    """Tipo de cuenta de caja."""
    EFECTIVO = "efectivo"
    BANCO = "banco"


class TipoMovimiento(str, Enum):
    """Tipo de movimiento de caja."""
    INGRESO = "ingreso"
    GASTO = "gasto"


class ReferenciaMovimiento(str, Enum):
    """Origen del movimiento."""
    PEDIDO = "pedido"
    RESERVA = "reserva"
    GASTO = "gasto"
    AJUSTE = "ajuste"
    CIERRE = "cierre"
    TRANSFERENCIA = "transferencia"


class FrecuenciaRecurrencia(str, Enum):
    """Frecuencia de gastos recurrentes."""
    SEMANAL = "semanal"
    QUINCENAL = "quincenal"
    MENSUAL = "mensual"
    BIMESTRAL = "bimestral"
    TRIMESTRAL = "trimestral"
    SEMESTRAL = "semestral"
    ANUAL = "anual"


# ============== ERP - CATEGORÍAS DE GASTOS ==============

class ExpenseCategoryBase(BaseModel):
    """Esquema base para categorías de gastos."""
    nombre: str = Field(..., min_length=2, max_length=100)
    categoria_base: CategoriaGastoBase = CategoriaGastoBase.OTROS
    descripcion: Optional[str] = None
    color: str = Field(default="#6B7280", max_length=7)
    icono: str = Field(default="receipt", max_length=50)
    activo: bool = True


class ExpenseCategoryCreate(ExpenseCategoryBase):
    """Esquema para crear una categoría de gastos."""
    pass


class ExpenseCategoryUpdate(BaseModel):
    """Esquema para actualizar una categoría de gastos."""
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    categoria_base: Optional[CategoriaGastoBase] = None
    descripcion: Optional[str] = None
    color: Optional[str] = Field(None, max_length=7)
    icono: Optional[str] = Field(None, max_length=50)
    activo: Optional[bool] = None


class ExpenseCategory(ExpenseCategoryBase):
    """Esquema completo de categoría de gastos."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============== ERP - PROVEEDORES ==============

class VendorBase(BaseModel):
    """Esquema base para proveedores."""
    nombre: str = Field(..., min_length=2, max_length=200)
    nif_cif: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, max_length=20)
    direccion: Optional[str] = None
    ciudad: Optional[str] = Field(None, max_length=100)
    codigo_postal: Optional[str] = Field(None, max_length=10)
    provincia: Optional[str] = Field(None, max_length=100)
    notas: Optional[str] = None
    activo: bool = True


class VendorCreate(VendorBase):
    """Esquema para crear un proveedor."""
    pass


class VendorUpdate(BaseModel):
    """Esquema para actualizar un proveedor."""
    nombre: Optional[str] = Field(None, min_length=2, max_length=200)
    nif_cif: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = Field(None, max_length=20)
    direccion: Optional[str] = None
    ciudad: Optional[str] = Field(None, max_length=100)
    codigo_postal: Optional[str] = Field(None, max_length=10)
    provincia: Optional[str] = Field(None, max_length=100)
    notas: Optional[str] = None
    activo: Optional[bool] = None


class Vendor(VendorBase):
    """Esquema completo de proveedor."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============== ERP - GASTOS ==============

class ExpenseBase(BaseModel):
    """Esquema base para gastos."""
    categoria_id: Optional[int] = None
    vendor_id: Optional[int] = None
    concepto: str = Field(..., min_length=2, max_length=500)
    descripcion: Optional[str] = None
    importe: float = Field(..., gt=0)
    fecha: date = Field(default_factory=date.today)
    fecha_vencimiento: Optional[date] = None
    numero_factura: Optional[str] = Field(None, max_length=100)
    archivo_url: Optional[str] = None
    notas: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    """Esquema para crear un gasto."""
    es_recurrente: bool = False
    frecuencia: Optional[FrecuenciaRecurrencia] = None
    fecha_inicio_recurrencia: Optional[date] = None
    fecha_fin_recurrencia: Optional[date] = None


class ExpenseUpdate(BaseModel):
    """Esquema para actualizar un gasto."""
    categoria_id: Optional[int] = None
    vendor_id: Optional[int] = None
    concepto: Optional[str] = Field(None, min_length=2, max_length=500)
    descripcion: Optional[str] = None
    importe: Optional[float] = Field(None, gt=0)
    fecha: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    numero_factura: Optional[str] = Field(None, max_length=100)
    archivo_url: Optional[str] = None
    notas: Optional[str] = None
    pagado: Optional[bool] = None
    fecha_pago: Optional[date] = None
    cuenta_pago_id: Optional[int] = None


class Expense(ExpenseBase):
    """Esquema completo de gasto."""
    id: int
    es_recurrente: bool = False
    frecuencia: Optional[FrecuenciaRecurrencia] = None
    fecha_inicio_recurrencia: Optional[date] = None
    fecha_fin_recurrencia: Optional[date] = None
    gasto_padre_id: Optional[int] = None
    pagado: bool = False
    fecha_pago: Optional[date] = None
    cuenta_pago_id: Optional[int] = None
    movimiento_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExpenseWithDetails(Expense):
    """Gasto con detalles de categoría y proveedor."""
    categoria_nombre: Optional[str] = None
    categoria_color: Optional[str] = None
    categoria_icono: Optional[str] = None
    vendor_nombre: Optional[str] = None
    cuenta_nombre: Optional[str] = None


class ListaExpenses(BaseModel):
    """Lista paginada de gastos."""
    items: list[ExpenseWithDetails]
    total: int
    pagina: int
    por_pagina: int


# ============== TESORERÍA - CUENTAS ==============

class CashAccountBase(BaseModel):
    """Esquema base para cuentas de caja."""
    nombre: str = Field(..., min_length=2, max_length=100)
    tipo: TipoCuenta
    descripcion: Optional[str] = None
    numero_cuenta: Optional[str] = Field(None, max_length=50)
    entidad_bancaria: Optional[str] = Field(None, max_length=100)
    activo: bool = True
    es_principal: bool = False


class CashAccountCreate(CashAccountBase):
    """Esquema para crear una cuenta de caja."""
    balance_inicial: float = Field(default=0.00)


class CashAccountUpdate(BaseModel):
    """Esquema para actualizar una cuenta de caja."""
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    tipo: Optional[TipoCuenta] = None
    descripcion: Optional[str] = None
    numero_cuenta: Optional[str] = Field(None, max_length=50)
    entidad_bancaria: Optional[str] = Field(None, max_length=100)
    activo: Optional[bool] = None
    es_principal: Optional[bool] = None


class CashAccount(CashAccountBase):
    """Esquema completo de cuenta de caja."""
    id: int
    balance_actual: float = 0.00
    balance_inicial: float = 0.00
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============== TESORERÍA - MOVIMIENTOS ==============

class CashMovementBase(BaseModel):
    """Esquema base para movimientos de caja."""
    cuenta_id: int
    tipo: TipoMovimiento
    importe: float = Field(..., gt=0)
    concepto: str = Field(..., min_length=2, max_length=500)
    descripcion: Optional[str] = None
    notas: Optional[str] = None


class CashMovementCreate(CashMovementBase):
    """Esquema para crear un movimiento de caja."""
    referencia_tipo: ReferenciaMovimiento = ReferenciaMovimiento.AJUSTE
    pedido_id: Optional[int] = None
    reserva_id: Optional[int] = None
    gasto_id: Optional[int] = None
    cuenta_destino_id: Optional[int] = None  # Para transferencias


class CashMovement(CashMovementBase):
    """Esquema completo de movimiento de caja."""
    id: int
    fecha: datetime
    referencia_tipo: ReferenciaMovimiento
    pedido_id: Optional[int] = None
    reserva_id: Optional[int] = None
    gasto_id: Optional[int] = None
    cuenta_destino_id: Optional[int] = None
    movimiento_relacionado_id: Optional[int] = None
    balance_posterior: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CashMovementWithDetails(CashMovement):
    """Movimiento con detalles de cuenta."""
    cuenta_nombre: str
    cuenta_tipo: TipoCuenta
    cuenta_destino_nombre: Optional[str] = None


class ListaCashMovements(BaseModel):
    """Lista paginada de movimientos."""
    items: list[CashMovementWithDetails]
    total: int
    pagina: int
    por_pagina: int


# ============== TESORERÍA - CIERRES ==============

class CashClosingBase(BaseModel):
    """Esquema base para cierres de caja."""
    cuenta_id: int
    fecha: date
    balance_cierre_real: float


class CashClosingCreate(CashClosingBase):
    """Esquema para crear un cierre de caja."""
    notas: Optional[str] = None


class CashClosing(BaseModel):
    """Esquema completo de cierre de caja."""
    id: int
    cuenta_id: int
    fecha: date
    balance_apertura: float
    balance_cierre_teorico: float
    balance_cierre_real: float
    diferencia: float
    total_ingresos: float = 0.00
    total_gastos: float = 0.00
    num_operaciones: int = 0
    desglose_ingresos: Optional[dict] = None
    desglose_gastos: Optional[dict] = None
    cerrado_por: Optional[str] = None
    notas: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CashClosingWithDetails(CashClosing):
    """Cierre con detalles de cuenta."""
    cuenta_nombre: str
    cuenta_tipo: TipoCuenta


class ListaCashClosings(BaseModel):
    """Lista paginada de cierres."""
    items: list[CashClosingWithDetails]
    total: int
    pagina: int
    por_pagina: int


# ============== DASHBOARD P&L ==============

class PLDashboardData(BaseModel):
    """Datos para el dashboard de P&L (Pérdidas y Ganancias)."""
    periodo: str  # "2025-11" o "2025-Q4" o "2025"
    total_ingresos: float
    total_gastos: float
    resultado: float
    margen_porcentaje: float

    # Desglose de ingresos
    ingresos_pedidos: float = 0.00
    ingresos_reservas: float = 0.00
    ingresos_otros: float = 0.00

    # Desglose de gastos por categoría
    gastos_por_categoria: dict = {}  # {"nominas": 1500.00, "alquiler": 800.00, ...}

    # Comparativa con periodo anterior
    variacion_ingresos: Optional[float] = None  # Porcentaje
    variacion_gastos: Optional[float] = None
    variacion_resultado: Optional[float] = None

    # KPIs
    ticket_medio_pedidos: Optional[float] = None
    ticket_medio_reservas: Optional[float] = None
    num_pedidos: int = 0
    num_reservas: int = 0


class LiquidityForecast(BaseModel):
    """Previsión de liquidez."""
    fecha: date
    balance_proyectado: float
    ingresos_esperados: float = 0.00
    gastos_programados: float = 0.00
    gastos_recurrentes: float = 0.00
    notas: Optional[str] = None


class LiquidityForecastResponse(BaseModel):
    """Respuesta de previsión de liquidez."""
    balance_actual: float
    previsiones: list[LiquidityForecast]
    alerta_liquidez: bool = False
    fecha_alerta: Optional[date] = None
    mensaje_alerta: Optional[str] = None


# ============== ESTADÍSTICAS ERP ==============

class ExpenseStats(BaseModel):
    """Estadísticas de gastos."""
    total_periodo: float
    total_pendiente: float
    total_pagado: float
    por_categoria: dict = {}
    por_proveedor: dict = {}
    gastos_recurrentes_activos: int = 0
    proximos_vencimientos: list = []


class CashStats(BaseModel):
    """Estadísticas de tesorería."""
    balance_total: float
    balance_efectivo: float
    balance_banco: float
    ingresos_hoy: float = 0.00
    gastos_hoy: float = 0.00
    movimientos_hoy: int = 0
    ingresos_mes: float = 0.00
    gastos_mes: float = 0.00
    num_movimientos_mes: int = 0
    ultimo_cierre: Optional[date] = None


# ============== TRANSFERENCIA ENTRE CUENTAS ==============

class TransferenciaCreate(BaseModel):
    """Esquema para crear una transferencia entre cuentas."""
    cuenta_origen_id: int
    cuenta_destino_id: int
    importe: float = Field(..., gt=0)
    concepto: str = Field(default="Transferencia entre cuentas", max_length=500)
    notas: Optional[str] = None
