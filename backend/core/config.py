from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str
    API_PREFIX: str = "/api"
    DEBUG: bool = False
    ALLOWED_ORIGINS: str

    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    @field_validator("ALLOWED_ORIGINS")
    @classmethod
    def parse_allowed_origins(cls, value: str) ->List[str]:
        return [v.strip() for v in value.split(",") if v.strip()]

    model_config = SettingsConfigDict(
        env_file = ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

settings = Settings()