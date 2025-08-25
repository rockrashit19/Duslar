import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import JoinButton from "../components/JoinButton";
import VisibilityToggle from "../components/VisibilityToggle";
import { fmtDt, genderLabel, statusLabel } from "../lib/format";
import { useToast } from "../state/toast";

type EventOut = {
  id: number;
  title: string;
  description: string | null;
  location: string;
  city: string;
  date_time: string;
  gender_restriction: "male" | "female" | "all";
  max_participants: number | null;
  status: "open" | "closed" | "past";
  creator_id: number | null;
  participants_count: number;
  is_user_joined: boolean;
  photo_url?: string | null;
};

export default function EventPage() {
  const { id } = useParams();
  const [data, setData] = useState<EventOut | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { show } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<EventOut>(`/events/${id}`);
        setData(data);
      } catch (e: any) {
        const msg = e?.response?.data?.detail || "Ошибка загрузки";
        setErr(msg);
        show(msg, "error");
      }
    })();
  }, [id, show]);

  if (err) return <div style={{ padding: 16 }}>❌ {err}</div>;
  if (!data) return <div style={{ padding: 16 }}>Загрузка…</div>;

  const label = statusLabel({
    status: data.status,
    participants_count: data.participants_count,
    max_participants: data.max_participants,
  });

  const seatsText =
    data.max_participants != null
      ? `${data.participants_count}/${data.max_participants}`
      : `${data.participants_count}`;

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
    <div className="app">
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

      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <h3 style={{ margin: "0 8px 0 0" }}>{data.title}</h3>
        <Badge>{genderLabel(data.gender_restriction)}</Badge>
        <Badge>{label}</Badge>
      </div>

      <div style={{ fontSize: 13, opacity: 0.7, marginTop: 6 }}>
        {fmtDt(data.date_time)} • {data.city} • {data.location}
      </div>

      <p style={{ whiteSpace: "pre-wrap" }}>
        {data.description || "Описание отсутствует"}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <JoinButton
          eventId={data.id}
          joined={data.is_user_joined}
          onChanged={(next) => {
            onChanged(next);
          }}
        />
        <div style={{ fontSize: 13, opacity: 0.8 }}>Места: {seatsText}</div>
        <VisibilityToggle
          eventId={data.id}
          initial={true}
          onChanged={() => {}}
        />
      </div>

      <hr style={{ margin: "16px 0" }} />
      <Participants eventId={data.id} />
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 11,
        padding: "2px 6px",
        border: "1px solid #ddd",
        borderRadius: 8,
        background: "#fafafa",
      }}
    >
      {children}
    </span>
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
  const { show } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/events/${eventId}/participants`, {
          params: { limit: 50 },
        });
        setRows(data);
      } catch (e: any) {
        const msg = e?.response?.data?.detail || "Ошибка загрузки участников";
        setErr(msg);
        show(msg, "error");
      }
    })();
  }, [eventId, show]);

  if (err) return <div>❌ {err}</div>;
  if (!rows) return <div>Загружаем участников…</div>;
  if (rows.length === 0)
    return (
      <div style={{ opacity: 0.7 }}>Вы можете стать первым участником!</div>
    );
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
