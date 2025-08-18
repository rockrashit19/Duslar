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
