from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/smart_pantry"

    # JWT
    JWT_SECRET_KEY: str = "86XmtomAX9S15Ax8obcHiZCwGIMGnsfnkNI6_1TtMH8"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # Open Food Facts
    OPEN_FOOD_FACTS_URL: str = "https://world.openfoodfacts.org/api/v2/product"

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
