from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.events import router as events_router
from app.api.v1.users import router as user_router
from app.api.v1.history import router as history_router
from app.api.v1.notes import router as notes_router
from app.api.v1.files import router as files_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(events_router)
api_router.include_router(user_router)
api_router.include_router(history_router)
api_router.include_router(notes_router)
api_router.include_router(files_router)
