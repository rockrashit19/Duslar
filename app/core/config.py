from functools import lru_cache
from pydantic import AnyUrl, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str
    telegram_bot_token: SecretStr
    jwt_secret: SecretStr
    sentry_dsn: AnyUrl | None = None
    frontend_url: AnyUrl | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="",          # имена 1-в-1 как в .env
        case_sensitive=False,
    )

@lru_cache
def get_settings() -> Settings:
    return Settings() # type: ignore

settings = get_settings()
