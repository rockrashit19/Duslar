import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../state/toast";
import { Link } from "react-router-dom";

type Row = {
  id: number;
  username?: string | null;
  full_name: string;
  events_together: number;
  last_seen_at: string;
};

export default function HistoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { show } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Row[]>("/history/people", {
          params: { limit: 50 },
        });
        setRows(data);
      } catch (e: any) {
        const msg = e?.response?.data?.detail || "Ошибка загрузки истории";
        setErr(msg);
        show(msg, "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [show]);

  if (err) return <div style={{ padding: 16 }}>❌ {err}</div>;
  if (loading) return <div style={{ padding: 16 }}>Загрузка...</div>;
  if (rows.length === 0)
    return <div style={{ padding: 16, opacity: 0.7 }}>Пока здесь пусто</div>;
  return (
    <div style={{ padding: 16 }}>
      <h3>С кем встречались</h3>
      <ul style={{ paddingLeft: 18 }}>
        {rows.map((r) => (
          <li key={r.id}>
            <Link to={`/users/${r.id}/note`}>{r.full_name}</Link>
            {r.username ? ` (@${r.username})` : ""} • вместе событий:{" "}
            {r.events_together}
          </li>
        ))}
      </ul>
    </div>
  );
}
