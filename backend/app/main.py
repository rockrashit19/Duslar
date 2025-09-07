from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router
from starlette.staticfiles import StaticFiles
import os
from app.services.maintenance import sync_event_statuses
from apscheduler.schedulers.asyncio import AsyncIOScheduler

app = FastAPI(title="MuslimEvent API", version="0.1.0")

os.makedirs(settings.media_dir, exist_ok=True)

scheduler = AsyncIOScheduler(timezone="UTC")

@app.on_event("startup")
async def _startup():
    from anyio.to_thread import run_sync
    await run_sync(sync_event_statuses)

    scheduler.add_job(lambda: sync_event_statuses(), "interval", minutes=2, id="sync-status")
    scheduler.start()

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
