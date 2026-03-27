from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.database import engine, Base
from app.middleware.error_handler import global_exception_handler, integrity_error_handler
from app.routers import auth, pantry, products, barcode, shopping_list, sync

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (dev convenience — use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="Smart Pantry API",
    description="API do zarządzania domową spiżarnią",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handlers
app.add_exception_handler(Exception, global_exception_handler)
app.add_exception_handler(IntegrityError, integrity_error_handler)

# Routers
app.include_router(auth.router)
app.include_router(pantry.router)
app.include_router(products.router)
app.include_router(barcode.router)
app.include_router(shopping_list.router)
app.include_router(sync.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
