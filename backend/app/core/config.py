from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = 'VisionAI Browser API'
    environment: str = 'development'
    default_language: str = 'en'


settings = Settings()
