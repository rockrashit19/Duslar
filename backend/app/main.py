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

from fastapi import Request, HTTPException
from urllib.parse import parse_qsl
import logging, hmac, hashlib, time, json

log = logging.getLogger("tg-auth-debug")

@app.post("/api/v1/auth/telegram/init")
async def __debug_tg_init(req: Request):
    body = await req.json()
    init_data = body.get("init_data") or body.get("initData") or ""
    log.info("init_data_len=%s head=%s", len(init_data), init_data[:80])
    if not init_data:
        raise HTTPException(401, "missing init_data")

    pairs = dict(parse_qsl(init_data, keep_blank_values=True))
    sent_hash = pairs.pop("hash", "")
    dcs = "\n".join(f"{k}={pairs[k]}" for k in sorted(pairs))
    secret = hashlib.sha256(os.environ["TELEGRAM_BOT_TOKEN"].encode()).digest()
    calc = hmac.new(secret, dcs.encode(), hashlib.sha256).hexdigest()
    if calc != sent_hash:
        log.warning("bad_hash calc=%s sent=%s", calc[:12], sent_hash[:12])
        raise HTTPException(401, "bad_hash")

    skew = abs(int(time.time()) - int(pairs.get("auth_date", "0") or 0))
    if skew > 86400:
        log.warning("stale_init_data skew=%s", skew)
        raise HTTPException(401, "stale_init_data")

    try:
        user = json.loads(pairs.get("user", "{}"))
    except Exception as e:
        log.warning("bad_user_json %s", e)
        raise HTTPException(401, "bad_user_json")

    return {"ok": True, "user_id": user.get("id")}

app.include_router(api_router, prefix="/api/v1")