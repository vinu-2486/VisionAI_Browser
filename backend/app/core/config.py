from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()


BASE_DIR = Path(__file__).resolve().parents[2]


class Settings:
    APP_NAME = os.getenv(
        "VISIONAI_APP_NAME",
        "VisionAI Browser API",
    )

    VERSION = "1.0.0"

    API_PREFIX = "/api"

    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{BASE_DIR / 'visionai.db'}",
    )

    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        ).split(",")
        if origin.strip()
    ]

    DEBUG = os.getenv(
        "DEBUG",
        "true",
    ).lower() == "true"

    GROQ_API_KEY = os.getenv(
        "GROQ_API_KEY",
        "",
    )

    GROQ_MODEL = os.getenv(
        "GROQ_MODEL",
        "openai/gpt-oss-120b",
    )


settings = Settings()