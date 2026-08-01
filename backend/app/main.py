from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.conversation import router as conversation_router
from app.routers.forms import router as forms_router
from app.routers.validation import router as validation_router

app = FastAPI(
    title='VisionAI Browser API',
    version='0.1.0',
    description='Prototype backend for accessible government form assistance.',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(forms_router)
app.include_router(conversation_router)
app.include_router(validation_router)


@app.get('/health')
def health_check() -> dict[str, str]:
    return {'status': 'ok'}
