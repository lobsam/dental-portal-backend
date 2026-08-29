from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        str_strip_whitespace=True,
    )

    # App
    APP_NAME: str = "Dental Portal API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Database - expects asyncpg scheme, e.g.:
    # postgresql+asyncpg://user:password@host:5432/dbname
    DATABASE_URL: str

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def normalize_database_url(cls, value: object) -> object:
        # docker run --env-file keeps quotes and Windows CRLF as part of the value
        if isinstance(value, str):
            return value.strip().strip("'\"")
        return value

    # Auth
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 30

    # SMTP / outbound email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    SMTP_FROM_EMAIL: str = "no-reply@example.com"
    SMTP_FROM_NAME: str = "Dental Portal"

    # Base URL of the deployed frontend, used to build links in emails
    FRONTEND_URL: str = "https://dental-portal-frontend.sanduplobzang.workers.dev/"

    # Password reset
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30

    @property
    def sync_database_url(self) -> str:
        """Alembic requires a sync driver; swap asyncpg for psycopg2."""
        return self.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql+psycopg2://")


settings = Settings()
