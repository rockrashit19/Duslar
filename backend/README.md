Алембик:

- `alembic revision -m "init (empty)"`
- `export $(grep -v '^#' .env | xargs)`
- `alembic upgrade head`

Проверяем /health:

- `uvicorn app.main:app --reload --port 8000`
- в другом терминале `curl -s http://127.0.0.1:8000/health`
- получаем {"status":"ok"}

Проверка PostgreSQL через docker-compose

- `docker compose up -d db` поднимаем докер
- `docker ps | grep muslimevent_db` проверяем, что контейнер в списке
- `docker logs muslimevent_db | tail -n 5` проверяем, что все без ошибок
- `docker exec -it muslimevent_db psql -U postgres -d muslimevent -c "SELECT 1;"` проверяем SQL

smoke-test соединения:

- `export $(grep -v '^#' .env | xargs)`
- `python scripts/db_ping.py`

Dockerfile:

- `docker build -t muslimevent-backend:dev . `
- `docker run --rm -p 8000:8000 -e PORT=8000 --env-file .env muslimevent-backend:dev`
- `curl -s http://127.0.0.1:8000/health`

env.py подхватывает DATABASE_URL:

- `export $(grep -v '^#' .env | xargs)`
- `alembic history | tail -n 1`

Получение токена:

```bash
export $(grep -v '^#' .env | xargs)
INIT="$(python scripts/mock_init_data.py)"
BODY="$(jq -n --arg v "$INIT" '{init_data:$v}')"
TOKEN="$(curl -s -H 'Content-Type: application/json' --data "$BODY" \
  http://127.0.0.1:8000/api/v1/auth/telegram/init | jq -r '.token')"
```

Проверка фильтров событий: docs/filters.md

.env (prod)

```
STORAGE_BACKEND=s3
S3_BUCKET=muslimevent-prod
S3_REGION=ru-central1
S3_ENDPOINT_URL=https://storage.yandexcloud.net
S3_ACCESS_KEY_ID=***
S3_SECRET_ACCESS_KEY=***
S3_PUBLIC_BASE_URL=https://cdn.muslimevent.ru

```
