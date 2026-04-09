import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.database import engine, Base
from app.middleware.error_handler import global_exception_handler, integrity_error_handler
from app.routers import auth, pantry, products, barcode, shopping_list, sync

settings = get_settings()


# ── loguru setup ───────────────────────────────────────────────────────────────

class _InterceptHandler(logging.Handler):
    """Przekierowuje logi ze stdlib logging (SQLAlchemy, uvicorn itp.) do loguru."""

    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back  # type: ignore[assignment]
            depth += 1
        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def setup_logging() -> None:
    logger.remove()
    logger.add(
        sys.stdout,
        level="INFO",
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level:<8}</level> | <cyan>{name}</cyan> — <level>{message}</level>",
        colorize=True,
    )
    logging.basicConfig(handlers=[_InterceptHandler()], level=0, force=True)
    for noisy in ("uvicorn.access",):
        logging.getLogger(noisy).setLevel(logging.WARNING)


setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Smart Pantry API — startuje (env: dev)")
    # Create tables on startup (dev convenience — use Alembic in production)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()
    logger.info("Smart Pantry API — zatrzymano")


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
