import os
from dataclasses import dataclass

from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()


@dataclass(frozen=True)
class RedisConfig:
    host: str = os.getenv("REDIS_HOST", "localhost")
    port: int = int(os.getenv("REDIS_PORT", 6379))
    health_check_interval: int = 30
    socket_timeout: int = 60
    socket_connect_timeout: int = 15


@dataclass(frozen=True)
class DatabaseConfig:
    host: str = os.getenv("POSTGRES_HOST", "localhost")
    port: int = int(os.getenv("POSTGRES_PORT", 5432))
    database: str = os.getenv("POSTGRES_DB", "")
    user: str = os.getenv("POSTGRES_USER", "")
    password: str = os.getenv("POSTGRES_PASSWORD", "")


@dataclass(frozen=True)
class StorageConfig:
    endpoint: str = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
    access_key: str = os.getenv("MINIO_ACCESS_KEY", "")
    secret_key: str = os.getenv("MINIO_SECRET_KEY", "")
    bucket_name: str = os.getenv("MINIO_BUCKET_NAME", "finguard-documents")


@dataclass(frozen=True)
class OCRConfig:
    language: list = None

    def __post_init__(self):
        object.__setattr__(self, "language", ["en"])


@dataclass(frozen=True)
class AIConfig:
    """
    Configuration for all AI-related components.
    """

    gemini_api_key: str = os.getenv(
        "GEMINI_API_KEY",
        ""
    )

    gemini_model: str = os.getenv(
        "GEMINI_MODEL",
        "gemini-2.5-flash"
    )

    tamper_threshold: float = 35.0

    confidence_threshold: float = 0.80

REDIS = RedisConfig()
DATABASE = DatabaseConfig()
STORAGE = StorageConfig()
OCR = OCRConfig()
AI = AIConfig()