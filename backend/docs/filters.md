# Фильтры /api/v1/events

- `city`: строка. Сравнение регистронезависимое (пример: `kAzAn` == `Kazan`).
- `from` / `to`: ISO8601 (например, `2025-08-15T00:00:00Z`).
  - Если TZ не указан, трактуем как UTC.
  - По умолчанию `from = now()` (возвращаются только будущие/текущие события).
  - Требование: `from <= to`, иначе `400`.
- Пагинация: `limit` [1..100], `offset` ≥ 0.

### Примеры

```bash
curl -s "http://127.0.0.1:8000/api/v1/events?city=Kazan" -H "Authorization: Bearer $TOKEN" | jq
curl -s "http://127.0.0.1:8000/api/v1/events?from=2025-08-15T00:00:00Z&to=2025-08-31T23:59:59Z" -H "Authorization: Bearer $TOKEN" | jq
curl -s "http://127.0.0.1:8000/api/v1/events?city=kAzAn&limit=5&offset=5" -H "Authorization: Bearer $TOKEN" | jq
```

### Негативные кейсы (401 и 400)

```bash
curl -i http://127.0.0.1:8000/api/v1/events
curl -i "http://127.0.0.1:8000/api/v1/events?from=2025-08-31T00:00:00Z&to=2025-08-15T00:00:00Z" -H "Authorization: Bearer $TOKEN"
```
