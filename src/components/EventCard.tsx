import { useNavigate } from "react-router-dom";
type Props = {
  id: number;
  title: string;
  location: string;
  city: string;
  date_time: string;
  participants_count: number;
  is_user_joined: boolean;
  photo_url?: string | null;
};
export default function EventCard(p: Props) {
  const nav = useNavigate();
  const dt = new Date(p.date_time).toLocaleString();
  return (
    <div
      onClick={() => nav(`/events/${p.id}`)}
      style={{
        display: "grid",
        gridTemplateColumns: "64px 1fr",
        gap: 12,
        padding: 12,
        border: "1px solid #eee",
        borderRadius: 12,
        marginBottom: 10,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          overflow: "hidden",
          borderRadius: 8,
          background: "#f3f3f3",
        }}
      >
        {p.photo_url ? (
          <img
            src={p.photo_url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : null}
      </div>
      <div>
        <div style={{ fontWeight: 600 }}>{p.title}</div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {dt} • {p.city} • {p.location}
        </div>
        <div style={{ fontSize: 12, marginTop: 6 }}>
          Участников: {p.participants_count}{" "}
          {p.is_user_joined ? "• Вы участвуете" : ""}
        </div>
      </div>
    </div>
  );
}
