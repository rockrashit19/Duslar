import { useEffect, useState } from "react";
import { api } from "../lib/api";
import EventCard from "../components/EventCard";

type EventCardOut = {
  id: number;
  title: string;
  location: string;
  city: string;
  date_time: string;
  gender_restriction: "Для мужчин" | "Для девушек" | "Для всех";
  creator_id: number | null;
  participants_count: number;
  is_user_joined: boolean;
  photo_url?: string | null;
};
export default function EventsPage() {
  const [rows, setRows] = useState<EventCardOut[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<EventCardOut[]>("/events", {
          params: { limit: 20 },
        });
        setRows(data);
      } catch (e: any) {
        setErr(e?.response?.data?.detail || "Ошибка загрузки");
      }
    })();
  }, []);
  if (err) return <div style={{ padding: 16 }}>❌ {err}</div>;
  if (!rows) return <div style={{ padding: 16 }}>Загружаем события...</div>;
  if (rows.length === 0)
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Событий пока нет</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>
          Загляните позже или измените фильтры
        </div>
      </div>
    );
  return (
    <div style={{ padding: 16 }}>
      <h3 style={{ margin: "0 0 12px" }}>События</h3>
      {rows.map((e) => (
        <EventCard key={e.id} {...e} />
      ))}
    </div>
  );
}
