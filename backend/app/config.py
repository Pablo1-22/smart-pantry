from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/smart_pantry"

    # JWT
    JWT_SECRET_KEY: str = "86XmtomAX9S15Ax8obcHiZCwGIMGnsfnkNI6_1TtMH8"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS — accepts comma-separated string or JSON array in env var
    # Example: CORS_ORIGINS=https://frontend.up.railway.app,http://localhost:5173
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: object) -> object:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Open Food Facts
    OPEN_FOOD_FACTS_URL: str = "https://world.openfoodfacts.org/api/v2/product"

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
