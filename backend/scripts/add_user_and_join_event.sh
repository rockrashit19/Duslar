#!/usr/bin/env bash
set -euo pipefail

# --- настройки по умолчанию ---
DB_CONTAINER="${DB_CONTAINER:-muslimevent_db}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-muslimevent}"

# --- парсинг аргументов ---
USERNAME="${1:-}"
EID="${2:-}"

if [[ -z "$USERNAME" || -z "$EID" ]]; then
  echo "Usage: $0 <username> <event_id>"
  echo "Example: $0 firstlast1423 7"
  exit 1
fi

# подчистим пробелы
USERNAME="$(echo -n "$USERNAME" | tr -d '[:space:]')"
EID="$(echo -n "$EID" | tr -d '[:space:]')"

# --- создаём пользователя при необходимости ---
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v uname="$USERNAME" <<'SQL'
DO $$
DECLARE
  existing_id BIGINT;
  new_id BIGINT;
BEGIN
  -- пробуем найти по username (без учёта регистра)
  SELECT id INTO existing_id
  FROM users
  WHERE lower(username) = lower(:'uname')
  ORDER BY id DESC
  LIMIT 1;

  IF existing_id IS NULL THEN
    -- берём следующий безопасный id
    SELECT COALESCE(MAX(id), 0) + 1 INTO new_id FROM users;

    -- важные not null поля: gender/role/trust_score
    INSERT INTO users (id, username, full_name, gender, role, trust_score)
    VALUES (new_id, :'uname', :'uname', 'unknown', 'user', 0)
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'created user username=% with id=%', :'uname', new_id;
  ELSE
    RAISE NOTICE 'user already exists username=% with id=%', :'uname', existing_id;
  END IF;
END$$;
SQL

# --- получаем ID пользователя ---
USER_ID="$(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A \
  -c "SELECT id FROM users WHERE lower(username)=lower('$USERNAME') ORDER BY id DESC LIMIT 1;")"
USER_ID="$(echo -n "$USER_ID" | tr -d '[:space:]')"

if [[ -z "$USER_ID" ]]; then
  echo "❌ Не удалось получить id пользователя для username=$USERNAME"
  exit 1
fi

# --- добавляем участника события (joined, visible) ---
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v eid="$EID" -v uid="$USER_ID" <<'SQL'
-- проверим, что событие есть
DO $$
DECLARE
  exists_event INT;
BEGIN
  SELECT 1 INTO exists_event FROM events WHERE id = :'eid'::BIGINT;
  IF exists_event IS NULL THEN
    RAISE EXCEPTION 'event % not found', :'eid';
  END IF;
END$$;

-- вставка/апдейт участника
INSERT INTO event_participants (event_id, user_id, status, is_visible, joined_at)
VALUES (:'eid'::BIGINT, :'uid'::BIGINT, 'joined', TRUE, NOW())
ON CONFLICT (event_id, user_id) DO UPDATE
SET status='joined', is_visible=TRUE, joined_at=NOW();
SQL

# --- печатаем экспортируемые переменные ---
echo "export USER_ID=$USER_ID"
echo "export EID=$EID"
echo "✅ Готово: USER_ID=$USER_ID, EID=$EID"
