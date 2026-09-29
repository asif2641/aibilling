from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_DEFAULT_DB = os.path.join(_BACKEND_DIR, "bill_intelligence.db").replace("\\", "/")
_DEFAULT_STORAGE = os.path.join(_BACKEND_DIR, "uploads")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[".env", os.path.join(_BACKEND_DIR, ".env")], 
        env_file_encoding="utf-8", 
        case_sensitive=True,
        extra="ignore"
    )

    APP_NAME: str = "AI Bill Intelligence"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    
    # Security & Tokens
    SECRET_KEY: str = "ai-bill-intelligence-super-secret-development-key-change-in-prod-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    # Supports SQLite (default) and PostgreSQL
    DATABASE_URL: str = f"sqlite:///{_DEFAULT_DB}"
    
    # File Storage
    STORAGE_PROVIDER: str = "local"  # "local" | "s3"
    STORAGE_LOCAL_PATH: str = _DEFAULT_STORAGE
    MAX_UPLOAD_SIZE_MB: int = 20
    ALLOWED_MIME_TYPES: List[str] = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf"
    ]
    
    # AI Processing Provider
    AI_PROVIDER: str = "mock"  # "mock" | "gemini"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    # Confidence Score Thresholds (PRD Section 12)
    CONFIDENCE_HIGH: float = 0.90
    CONFIDENCE_MEDIUM: float = 0.70
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
        ]

settings = Settings()
