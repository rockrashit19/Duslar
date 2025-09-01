from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from app.api.deps import get_current_user
from app.services.storage import get_storage

router = APIRouter()
ALLOWED  = {".jpg", ".jpeg", ".png", ".webp"}
MAX = 10 * 1024 * 1024

@router.post("/files/upload")
async def upload_image(
    file: UploadFile = File(...),
    current = Depends(get_current_user),
):
    ct = (file.content_type or "").lower()
    if not ct.startswith("image/"):
        raise HTTPException(415, "only images are allowed")
    import os
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED:
        raise HTTPException(415, f"allowed: {', '.join(sorted(ALLOWED))}")
    
    read = 0
    CHUNK = 1024 * 1024
    file.file.seek(0)
    while True:
        chunk = await file.read(CHUNK)
        if not chunk: break
        read += len(chunk)
        if read > MAX:
            raise HTTPException(413, "file too large")
    file.file.seek(0)
    
    storage = get_storage()
    url = storage.save(file.file, file.filename or "image", ct)
    return {"url": str(url)}