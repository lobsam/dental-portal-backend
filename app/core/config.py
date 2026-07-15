from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    APP_NAME: str = "Dental Portal API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Database - expects asyncpg scheme, e.g.:
    # postgresql+asyncpg://user:password@host:5432/dbname
    DATABASE_URL: str

    # Auth
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30

    @property
    def sync_database_url(self) -> str:
        """Alembic requires a sync driver; swap asyncpg for psycopg2."""
        return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://")


settings = Settings()
