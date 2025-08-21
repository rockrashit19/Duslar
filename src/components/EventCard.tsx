import { useNavigate } from "react-router-dom";
import { fmtDt, genderLabel } from "../lib/format";

type Props = {
  id: number;
  title: string;
  location: string;
  city: string;
  date_time: string;
  participants_count: number;
  is_user_joined: boolean;
  photo_url?: string | null;
  gender_restriction: "male" | "female" | "all";
};
export default function EventCard(p: Props) {
  const nav = useNavigate();
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          color: "#777",
        }}
      >
        {p.photo_url ? (
          <img
            src={p.photo_url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          "нет фото"
        )}
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontWeight: 600, flex: 1 }}>{p.title}</div>
          <span
            style={{
              fontSize: 11,
              padding: "2px 6px",
              border: "1px solid #ddd",
              borderRadius: 8,
            }}
          >
            {genderLabel(p.gender_restriction)}
          </span>
        </div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          {fmtDt(p.date_time)} • {p.city} • {p.location}
        </div>
        <div style={{ fontSize: 12, marginTop: 6 }}>
          Участников: {p.participants_count}{" "}
          {p.is_user_joined ? "• Вы участвуете" : ""}
        </div>
      </div>
    </div>
  );
}
