from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database — Railway provides postgres:// or postgresql://, we need postgresql+asyncpg://
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/smart_pantry"

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def fix_db_url(cls, v: str) -> str:
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # JWT
    JWT_SECRET_KEY: str = "86XmtomAX9S15Ax8obcHiZCwGIMGnsfnkNI6_1TtMH8"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS — plain string, parsed in main.py
    # Example: CORS_ORIGINS=https://frontend.up.railway.app,http://localhost:5173
    CORS_ORIGINS: str = "http://localhost:5173"

    # Open Food Facts
    OPEN_FOOD_FACTS_URL: str = "https://world.openfoodfacts.org/api/v2/product"

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
