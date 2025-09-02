from functools import lru_cache
from pydantic import AnyUrl, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal

class Settings(BaseSettings):
    database_url: str
    telegram_bot_token: SecretStr
    jwt_secret: SecretStr
    sentry_dsn: AnyUrl | None = None
    frontend_url: AnyUrl | None = None
    storage_backend: Literal["local", "s3"] = "local"
    
    media_dir: str = "media"
    backend_base_url: str | None = None
    
    jwt_issuer: str = "duslar_bot"
    jwt_audience: str = "admin"
    
    s3_bucket: str | None = None
    s3_region: str | None = None
    s3_endpoint_url: str | None = None
    s3_access_key_id: str | None = None
    s3_secret_access_key: str | None = None
    s3_public_base_url: str | None = None

    role_managers: list[int] = []

    @field_validator("role_managers", mode="before")
    @classmethod
    def _parse_role_managers(cls, v):
        if not v:
            return []
        if isinstance(v, str):
            return [int(x.strip()) for x in v.split(",") if x.strip()]
        return v
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="",          
        case_sensitive=False,
    )

@lru_cache
def get_settings() -> Settings:
    return Settings() # type: ignore

settings = get_settings()
