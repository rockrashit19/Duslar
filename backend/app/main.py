from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router
from starlette.staticfiles import StaticFiles
import os

app = FastAPI(title="MuslimEvent API", version="0.1.0")

os.makedirs(settings.media_dir, exist_ok=True)

app.mount("/media", StaticFiles(directory=settings.media_dir), name="media")

origins = []
if settings.frontend_url:
    origins.append(str(settings.frontend_url))

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(settings.frontend_url)],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(api_router, prefix="/api/v1")
