#!/usr/bin/env bash
set -euo pipefail

API="http://127.0.0.1:8000/api/v1"

PYTHON="python3"
if ! command -v "$PYTHON" >/dev/null 2>&1; then PYTHON="python"; fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: нужен jq (brew install jq / apt-get install jq)"; exit 1
fi
if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: нужен curl"; exit 1
fi
if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
  echo "ERROR: TELEGRAM_BOT_TOKEN не найден. Выполни: export \$(grep -v '^#' .env | xargs)"; exit 1
fi

iso_day_plus() {
  "$PYTHON" - "$1" <<'PY'
import sys, datetime
d = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=int(sys.argv[1]))
print(d.strftime("%Y-%m-%d"))
PY
}

gen_initdata() {
  local USER_ID="$1" USERNAME="$2" FULL_NAME="$3"
  TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" "$PYTHON" - "$USER_ID" "$USERNAME" "$FULL_NAME" <<'PY'
import sys, os, time, json, hmac, hashlib, urllib.parse, secrets
bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
if not bot_token:
    print("ERROR: TELEGRAM_BOT_TOKEN is not set", file=sys.stderr); raise SystemExit(1)
uid, username, full_name = sys.argv[1], sys.argv[2], sys.argv[3]
auth_date = int(time.time()); query_id = secrets.token_hex(12)
user_obj = {"id": int(uid), "is_bot": False, "first_name": full_name or "User", "username": username or None, "language_code": "ru"}
pairs = {"auth_date": str(auth_date), "query_id": query_id, "user": json.dumps(user_obj, separators=(",", ":"), ensure_ascii=False)}
data_check_string = "\n".join(f"{k}={pairs[k]}" for k in sorted(pairs.keys()))
secret_key = hmac.new(b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256).digest()
sig = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()
qs = {"auth_date": str(auth_date), "query_id": query_id, "user": pairs["user"], "hash": sig}
print(urllib.parse.urlencode(qs, quote_via=urllib.parse.quote))
PY
}

echo "== 1) Авторизация: получаем два РАЗНЫХ токена =="
INIT_A="$(gen_initdata 123456788 me 'Me User')"
INIT_B="$(gen_initdata 234567891 friend 'Friend User')"
TOKEN_A="$(curl -s -H 'Content-Type: application/json' --data "$(jq -n --arg v "$INIT_A" '{init_data:$v}')" "$API/auth/telegram/init" | jq -r .token)"
TOKEN_B="$(curl -s -H 'Content-Type: application/json' --data "$(jq -n --arg v "$INIT_B" '{init_data:$v}')" "$API/auth/telegram/init" | jq -r .token)"
echo "TOKEN_A=${TOKEN_A:0:24}..."
echo "TOKEN_B=${TOKEN_B:0:24}..."

echo "== 2) Загрузка фото и создание события (A создаёт) =="
PHOTO_URL=""
if [ -f "./media/image.png" ]; then
  UPLOAD_JSON="$(curl -s -H "Authorization: Bearer $TOKEN_A" -F "file=@./media/image.png" "$API/files/upload")"
  PHOTO_URL="$(echo "$UPLOAD_JSON" | jq -r .url)"
  echo "Фото загружено: $PHOTO_URL"
else
  echo "media/image.png не найден — создаём событие без фото."
fi

DAY2="$(iso_day_plus 2)"

# ВАЖНО: jq не поддерживает тернарный ?:
jq -n \
  --arg title "Интеграционный митап" \
  --arg desc  "E2E проверка" \
  --arg loc   "ул. Пушкина, 10" \
  --arg city  "Kazan" \
  --arg dt    "${DAY2}T18:30:00Z" \
  --arg gender "all" \
  --arg photo "$PHOTO_URL" \
  --argjson max 1 \
  '
  {
    title: $title,
    description: $desc,
    location: $loc,
    city: $city,
    date_time: $dt,
    gender_restriction: $gender,
    max_participants: $max
  }
  + ( if ($photo | length) > 0 then { photo_url: $photo } else {} end )
  ' > /tmp/event.json

"$PYTHON" - <<'PY'
import json; json.load(open("/tmp/event.json"))
PY

RESP="$(curl -s -X POST "$API/events" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" --data @/tmp/event.json)"
echo "$RESP" | jq '.' || true
EVENT_ID="$(echo "$RESP" | jq -r '.id')"
if [ -z "$EVENT_ID" ] || [ "$EVENT_ID" = "null" ]; then
  echo "❌ Создание события не вернуло id. Ответ выше." >&2; exit 1
fi
echo "Создано событие: id=$EVENT_ID"

echo "== 4) Листинг без фильтров (from=now по умолчанию) =="
curl -s "$API/events" -H "Authorization: Bearer $TOKEN_A" | jq '.[0]'

echo "== 5) Фильтр по городу + даты по ДНЯМ =="
FROM="$(iso_day_plus 0)T00:00:00Z"
TO="$(iso_day_plus 7)T23:59:59Z"
curl -s "$API/events?city=Kazan%20&from=$FROM&to=$TO" -H "Authorization: Bearer $TOKEN_A" | jq '.[].id'

echo "== 6) Пагинация (limit=1, offset=0/1) =="
curl -s "$API/events?limit=1&offset=0" -H "Authorization: Bearer $TOKEN_A" | jq '.[].id'
curl -s "$API/events?limit=1&offset=1" -H "Authorization: Bearer $TOKEN_A" | jq '.[].id'

echo "== 7) Деталь события =="
curl -s "$API/events/$EVENT_ID" -H "Authorization: Bearer $TOKEN_A" | jq '{id,title,date_time,participants_count,is_user_joined,photo_url}'

echo "== 8) Конкурентный join: A и B одновременно (max_participants=1) =="
( curl -s -X POST "$API/events/$EVENT_ID/join" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" --data '{}' & )
( curl -s -X POST "$API/events/$EVENT_ID/join" -H "Authorization: Bearer $TOKEN_B" -H "Content-Type: application/json" --data '{}' & )
wait
echo
echo "Проверяем участников/состояние:"
curl -s "$API/events/$EVENT_ID" -H "Authorization: Bearer $TOKEN_A" | jq '{participants_count,is_user_joined}'
curl -s "$API/events/$EVENT_ID/participants?limit=50" -H "Authorization: Bearer $TOKEN_A" | jq '.'

echo "== 9) Видимость участника (A скрывает себя) =="
curl -s -X POST "$API/events/$EVENT_ID/visibility" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" --data '{"is_visible":false}' | jq
echo "Список участников глазами B:"
curl -s "$API/events/$EVENT_ID/participants" -H "Authorization: Bearer $TOKEN_B" | jq '.'

echo "== 10) История A =="
curl -s "$API/history/people" -H "Authorization: Bearer $TOKEN_A" | jq '.'

echo "== 11) Заметка о B (A пишет/читает/удаляет) =="
curl -s -X PUT "$API/users/234567891/note" -H "Authorization: Bearer $TOKEN_A" -H "Content-Type: application/json" --data '{"text":"Отличный собеседник"}' | jq
curl -s "$API/users/234567891/note" -H "Authorization: Bearer $TOKEN_A" | jq
curl -s -X DELETE "$API/users/234567891/note" -H "Authorization: Bearer $TOKEN_A" | jq

echo "== 12) Негативные проверки =="
echo "Без токена:"; curl -i "$API/events" | head -n 1
echo "Неверный интервал дат:"; curl -i "$API/events?from=2025-08-21T00:00:00Z&to=2025-08-20T00:00:00Z" -H "Authorization: Bearer $TOKEN_A" | head -n 1

echo "== 13) Медиа доступность (если фото было) =="
if [ -n "$PHOTO_URL" ]; then
  echo "HEAD $PHOTO_URL"; curl -I "$PHOTO_URL" | head -n 5
fi

echo "== ГОТОВО =="
