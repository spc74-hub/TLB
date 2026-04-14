"""
The Lobby Beauty - API Principal

API para gestión de servicios de belleza, reservas y clientes.
Especializada en productos naturales libres de TPO/DMPT.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.core.database import init_supabase
from app.routers import servicios, reservas, productos, pagos, pedidos, whatsapp, clientes, gastos, tesoreria, cuenta_resultados, ingresos, usuarios


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación."""
    # Startup: inicializar conexiones
    init_supabase()
    # Initialize asyncpg pool
    from app.db.compat import get_pool
    await get_pool()
    print("🌿 The Lobby Beauty API iniciada (PostgreSQL directo)")
    yield
    # Shutdown: cerrar pool
    from app.db.compat import _pool
    if _pool:
        await _pool.close()
    print("🌿 The Lobby Beauty API detenida")


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    redirect_slashes=False,  # Evitar 307 redirects por trailing slashes
    description="""
    ## The Lobby Beauty API 🌿

    API para la gestión de servicios de belleza naturales.

    ### Características principales:
    - **Servicios**: Manicura, pedicura, depilación, cejas y pestañas
    - **Productos naturales**: Libres de TPO/DMPT y otros tóxicos
    - **Reservas online**: Sistema de citas fácil y rápido
    - **Transparencia**: Información completa sobre ingredientes

    ### Categorías de servicios:
    - 💅 Manicura
    - 🦶 Pedicura
    - ✨ Depilación
    - 👁️ Cejas
    - 👁️ Pestañas

    Todos nuestros servicios utilizan productos **libres de sustancias tóxicas**
    como TPO (óxido de trimetilbenzoildifenilfosfina) y DMPT (dimetiltolilamina),
    cumpliendo con las últimas regulaciones de la UE.
    """,
    version=settings.app_version,
    lifespan=lifespan,
)

# Configurar CORS
origins = settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(servicios.router, prefix="/api/v1")
app.include_router(reservas.router, prefix="/api/v1")
app.include_router(productos.router, prefix="/api/v1")
app.include_router(pagos.router, prefix="/api/v1")
app.include_router(pedidos.router, prefix="/api/v1")
app.include_router(whatsapp.router, prefix="/api/v1")
app.include_router(clientes.router, prefix="/api/v1")
app.include_router(gastos.router, prefix="/api/v1")
app.include_router(tesoreria.router, prefix="/api/v1")
app.include_router(cuenta_resultados.router, prefix="/api/v1")
app.include_router(ingresos.router, prefix="/api/v1")
app.include_router(usuarios.router, prefix="/api/v1")


@app.get("/")
async def root():
    """Endpoint raíz con información de la API."""
    return {
        "nombre": "The Lobby Beauty API",
        "version": settings.app_version,
        "descripcion": "Servicios de belleza con productos naturales",
        "filosofia": "Belleza sin tóxicos - Libre de TPO/DMPT",
        "documentacion": "/docs",
    }


@app.get("/health")
async def health_check():
    """Verificación de estado de la API."""
    return {
        "status": "healthy",
        "service": "The Lobby Beauty API",
    }
