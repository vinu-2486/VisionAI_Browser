from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.session import Base
from app.database.session import engine
from app.models.forms import (
    Application,
    ConversationMessage,
    ConversationSession,
)
from app.routers import (
    conversation,
    forms,
    validation,
)


@asynccontextmanager
async def lifespan(
    app: FastAPI,
):

    Base.metadata.create_all(
        bind=engine
    )

    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description=(
        "VisionAI Browser backend for "
        "accessible government form assistance."
    ),
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/",
    tags=["System"],
)
def root():

    return {
        "name": "VisionAI Browser API",
        "version": settings.VERSION,
        "status": "online",
    }


@app.get(
    "/health",
    tags=["System"],
)
def health():

    return {
        "status": "healthy",
        "service": "visionai-backend",
    }


app.include_router(
    forms.router,
    prefix=settings.API_PREFIX,
)

app.include_router(
    conversation.router,
    prefix=settings.API_PREFIX,
)

app.include_router(
    validation.router,
    prefix=settings.API_PREFIX,
)