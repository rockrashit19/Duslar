import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../state/toast";
import { useNavigate } from "react-router-dom";

type Row = {
  id: number;
  username?: string | null;
  full_name: string;
  city?: string | null;
  events_together: number;
  avatar_url?: string | null;
};

export default function HistoryPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { show } = useToast();
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Row[]>("/history/people", {
          params: { limit: 100, offset: 0 },
        });
        setRows(data);
      } catch (e: any) {
        const msg = e?.response?.data?.detail || "Ошибка загрузки истории";
        setErr(msg);
        show(msg, "error");
      }
    })();
  }, [show]);

  if (err)
    return (
      <div className="app" style={{ padding: 16 }}>
        ❌ {err}
      </div>
    );
  if (!rows)
    return (
      <div className="app" style={{ padding: 16 }}>
        Загрузка…
      </div>
    );

  return (
    <div className="app history">
      <h1 className="history__title">С кем встречались</h1>

      <div className="history__list">
        {rows.length === 0 ? (
          <div className="muted">Здесь пока никого нет</div>
        ) : (
          rows.map((u) => (
            <HistoryRow
              key={u.id}
              row={u}
              onOpen={() => nav(`/users/${u.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function HistoryRow({ row, onOpen }: { row: Row; onOpen: () => void }) {
  const city = row.city?.trim() ? row.city : "не указан";
  const initial =
    (row.full_name || row.username || "?").trim().charAt(0).toUpperCase() ||
    "?";

  return (
    <div className="hrow" onClick={onOpen} role="button">
      <div className="hrow__avatar">
        {row.avatar_url ? (
          <img
            src={row.avatar_url}
            alt=""
            width={69}
            height={69}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        ) : (
          initial
        )}
      </div>

      <div>
        <div className="hrow__name">{row.full_name}</div>
        <div className="hrow__meta">
          {row.username ? (
            <a
              href={`https://t.me/${row.username}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              @{row.username}
            </a>
          ) : (
            "не указан"
          )}
        </div>
        <div className="hrow__meta">Город: {city}</div>
        <div className="hrow__meta">Событий вместе: {row.events_together}</div>
      </div>
    </div>
  );
}
