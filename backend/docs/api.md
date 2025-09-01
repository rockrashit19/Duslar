Проверка разных API (позитивные сценарии)

### POST /api/v1/events/{event_id}/visibility

Body: `{"is_visible": true|false}`  
200 → `{"event_id":..., "user_id":..., "is_visible":..., "status":"joined"}`  
401 без токена, 404 нет события, 409 если пользователь не joined.

- Посмотреть все мероприятия
- Присоединиться к мероприятию (передать EVENT_ID=x)
- Покинуть мероприятие (передать EVENT_ID=x)
- Поменять видимость участия (false/true внутри ссылки)
- Посмотреть свой пол
- Поменять свой пол
- Проверить с кем был на мероприятиях
- Создать/обноить заметку
- Получить заметку
- Удалить заметку (вернет 204)

```bash
curl -s http://127.0.0.1:8000/api/v1/events   -H "Authorization: Bearer $TOKEN" | jq
curl -i -X POST "http://127.0.0.1:8000/api/v1/events/$EVENT_ID/join" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data "{}"
curl -i -X POST "http://127.0.0.1:8000/api/v1/events/$EVENT_ID/leave" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data "{}"
curl -s -X POST "http://127.0.0.1:8000/api/v1/events/$EVENT_ID/visibility" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data '{"is_visible": false}' | jq
curl -s http://127.0.0.1:8000/api/v1/me -H "Authorization: Bearer $TOKEN" | jq
curl -s -X POST http://127.0.0.1:8000/api/v1/me/gender   -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json"   --data '{"gender":"male"}' | jq
curl -s http://127.0.0.1:8000/api/v1/history/people -H "Authorization: Bearer $TOKEN" | jq
curl -s -X PUT "http://127.0.0.1:8000/api/v1/users/234567891/note" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data '{"text":"Высокий, в очках, общались про обучение"}' | jq
curl -s "http://127.0.0.1:8000/api/v1/users/234567891/note" \
  -H "Authorization: Bearer $TOKEN" | jq
curl -i -X DELETE "http://127.0.0.1:8000/api/v1/users/234567891/note" \
  -H "Authorization: Bearer $TOKEN"
```

Негативные сценарии:

- Без токена (401)
- Неправильная дата (400)
- Несущестующее событие (404)
- Поменять видимость на событие, где мы не участвуем (409) (перед этим нужно сделать leave из события)
- Ограничение по полу (403)

```bash
curl -i http://127.0.0.1:8000/api/v1/events
curl -i "http://127.0.0.1:8000/api/v1/events?from=2025-08-31T00:00:00Z&to=2025-08-15T00:00:00Z" -H "Authorization: Bearer $TOKEN"
curl -i -X POST "http://127.0.0.1:8000/api/v1/events/999999/visibility" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data '{"is_visible": false}'
curl -i -X POST "http://127.0.0.1:8000/api/v1/events/$EVENT_ID/visibility" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data '{"is_visible": false}'
curl -i -X POST "http://127.0.0.1:8000/api/v1/events/$EID_F/join" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data "{}"
```

Проверка загрузки изображения

```bash
# 1) Подтянем переменные окружения (.env должен содержать BACKEND_BASE_URL=http://127.0.0.1:8000)
export $(grep -v '^#' .env | xargs)
echo "MEDIA_DIR=$MEDIA_DIR"
echo "BACKEND_BASE_URL=$BACKEND_BASE_URL"
# 2) Проверим, что файл существует на диске
test -f media/image.png && echo "OK: media/image.png exists" || echo "NOT FOUND: media/image.png"
# 3) ПРОВЕРКА РАЗДАЧИ СТАТИКИ: файл должен открываться по /media/image.png
FILE_URL="http://127.0.0.1:8000/media/image.png"
echo "$FILE_URL"
curl -I "$FILE_URL"
# ожидаем: HTTP/1.1 200 OK и Content-Type: image/png

# пару байт из файла (должен быть бинарный PNG)
curl -s "$FILE_URL" | head | xxd | head
# 4) Получим JWT токен (через mock initData)
INIT="$(python scripts/mock_init_data.py)"
BODY="$(jq -n --arg v "$INIT" '{init_data:$v}')"
TOKEN="$(curl -s -H 'Content-Type: application/json' --data "$BODY" \
  http://127.0.0.1:8000/api/v1/auth/telegram/init | jq -r '.token')"
echo "TOKEN=${TOKEN:0:16}..."
# 5) ПРОВЕРКА ЗАГРУЗКИ ФАЙЛА: отправим тот же файл через /files/upload
UPLOAD_JSON="$(curl -s -X POST http://127.0.0.1:8000/api/v1/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/Users/admin/tg_projects/muslimevent/muslimevent-backend/media/image.png")"
echo "$UPLOAD_JSON" | jq

# достанем URL из ответа (должен быть полный, т.к. BACKEND_BASE_URL задан)
PHOTO_URL="$(echo "$UPLOAD_JSON" | jq -r '.url')"
echo "PHOTO_URL=$PHOTO_URL"

# убедимся, что это реально открывается по HTTP
curl -I "$PHOTO_URL"
curl -s "$PHOTO_URL" | head | xxd | head
# 6) СОЗДАДИМ СОБЫТИЕ с этим photo_url
cat > /tmp/event_with_photo.json <<EOF
{
  "title": "Событие с фото (dev check)",
  "description": "Проверяем загрузку и раздачу фото",
  "location": "ул. Пушкина, 10",
  "city": "Kazan",
  "date_time": "2025-08-30T18:00:00Z",
  "gender_restriction": "all",
  "photo_url": "$PHOTO_URL"
}
EOF

EVENT_ID="$(curl -s -X POST http://127.0.0.1:8000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  --data @/tmp/event_with_photo.json | jq -r '.id')"
echo "EVENT_ID=$EVENT_ID"
# 7) ПРОВЕРИМ, что API отдаёт photo_url в списке и в детали
curl -s http://127.0.0.1:8000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" | jq '.[] | select(.id=='"$EVENT_ID"') | {id,title,photo_url}'

curl -s http://127.0.0.1:8000/api/v1/events/$EVENT_ID \
  -H "Authorization: Bearer $TOKEN" | jq '{id,title,photo_url}'

```

# Добавить пользователя в ивент (вводим @tg.id и номер ивента)

```bash
eval "$(./scripts/add_user_and_join_event.sh firstlast1423 20)"
echo "$USER_ID / $EID"
```
