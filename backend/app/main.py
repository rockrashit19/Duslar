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

from fastapi import Request, HTTPException
from urllib.parse import parse_qsl
import os, hmac, hashlib, time, json

@app.post("/api/v1/auth/telegram/init")
async def __debug_tg_init(req: Request):
    body = await req.json()
    init_data = body.get("init_data") or body.get("initData") or ""
    print("[tg-init] len(init_data)=", len(init_data), " head=", init_data[:120])

    if not init_data:
        print("[tg-init] ERROR missing init_data")
        raise HTTPException(401, "missing init_data")

    pairs = dict(parse_qsl(init_data, keep_blank_values=True))
    sent_hash = pairs.pop("hash", "")
    dcs = "\n".join(f"{k}={pairs[k]}" for k in sorted(pairs))

    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    print("[tg-init] token_tail=...", token[-6:])  # чтобы убедиться, что тот самый токен
    secret = hashlib.sha256(token.encode()).digest()
    calc = hmac.new(secret, dcs.encode(), hashlib.sha256).hexdigest()

    if calc != sent_hash:
        print("[tg-init] ERROR bad_hash calc=", calc[:12], " sent=", sent_hash[:12])
        print("[tg-init] dcs_head=", dcs[:160])
        raise HTTPException(401, "bad_hash")

    auth_date = int(pairs.get("auth_date", "0") or 0)
    skew = abs(int(time.time()) - auth_date)
    print("[tg-init] auth_date=", auth_date, " skew=", skew)
    if skew > 86400:  # 24 часа
        print("[tg-init] ERROR stale_init_data skew=", skew)
        raise HTTPException(401, "stale_init_data")

    try:
        user = json.loads(pairs.get("user", "{}"))
        print("[tg-init] user_id=", user.get("id"))
    except Exception as e:
        print("[tg-init] ERROR bad_user_json:", e)
        raise HTTPException(401, "bad_user_json")

    return {"ok": True, "user_id": user.get("id")}
