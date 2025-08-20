import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import JoinButton from "../components/JoinButton";

type EventOut = {
  id: number;
  title: string;
  description: string | null;
  location: string;
  city: string;
  date_time: string;
  gender_restriction: "Для мужчин" | "Для девушек" | "Для всех";
  max_participants: number | null;
  status: "Набор открыт" | "Набор завершен" | "Мероприятие прошло";
  creator_id: number | null;
  participants_count: number;
  is_user_joined: boolean;
  photo_url?: string | null;
};

export default function EventPage() {
  const { id } = useParams();
  const [data, setData] = useState<EventOut | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<EventOut>(`/events/${id}`);
        setData(data);
      } catch (e: any) {
        setErr(e?.response?.data?.detail || "Ошибка загрузки");
      }
    })();
  }, [id]);
  if (err) return <div style={{ padding: 16 }}>❌ {err}</div>;
  if (!data) return <div style={{ padding: 16 }}>Загрузка…</div>;

  const onChanged = (next: boolean) =>
    setData((d) =>
      d
        ? {
            ...d,
            is_user_joined: next,
            participants_count: Math.max(
              0,
              d.participants_count + (next ? 1 : -1)
            ),
          }
        : d
    );

  return (
    <div style={{ padding: 16 }}>
      {data.photo_url ? (
        <div
          style={{
            width: "100%",
            height: 180,
            overflow: "hidden",
            borderRadius: 12,
            marginBottom: 12,
            background: "#f5f5f5",
          }}
        >
          <img
            src={data.photo_url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : null}
      <h3 style={{ marginTop: 0 }}>{data.title}</h3>
      <div style={{ fontSize: 13, opacity: 0.7 }}>
        {new Date(data.date_time).toLocaleString()} • {data.city} •{" "}
        {data.location}
      </div>
      <p style={{ whiteSpace: "pre-wrap" }}>
        {data.description || "Описание отсутствует"}
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <JoinButton
          eventId={data.id}
          joined={data.is_user_joined}
          onChanged={onChanged}
        />
        <div style={{ fontSize: 13, opacity: 0.8 }}>
          Участников: {data.participants_count}
        </div>
      </div>

      <hr style={{ margin: "16px 0" }} />
      <Participants eventId={data.id} />
    </div>
  );
}

function Participants({ eventId }: { eventId: number }) {
  const [rows, setRows] = useState<Array<{
    id: number;
    username?: string | null;
    full_name: string;
    is_visible: boolean;
  }> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/events/${eventId}/participants`, {
          params: { limit: 50 },
        });
        setRows(data);
      } catch (e: any) {
        setErr(e?.response?.data?.detail || "Ошибка загрузки участников");
      }
    })();
  }, [eventId]);
  if (err) return <div>❌ {err}</div>;
  if (!rows) return <div>Загружаем участников…</div>;
  if (rows.length === 0)
    return <div style={{ opacity: 0.7 }}>Скоро присоединятся другие люди!</div>;
  return (
    <ul style={{ paddingLeft: 18 }}>
      {rows.map((u) => (
        <li key={u.id}>
          {u.full_name}
          {u.username ? ` (@${u.username})` : ""}
          {u.is_visible ? "" : " • вы скрыты"}
        </li>
      ))}
    </ul>
  );
}
