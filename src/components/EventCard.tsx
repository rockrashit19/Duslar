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
      className="card"
      onClick={() => nav(`/events/${p.id}`)}
      // style={{
      //   display: "grid",
      //   gridTemplateColumns: "64px 1fr",
      //   gap: 12,
      //   cursor: "pointer",
      //   marginBottom: 10,
      // }}
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
          <img src={p.photo_url} alt="" className="img-fit" />
        ) : (
          "нет фото"
        )}
      </div>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontWeight: 600, flex: 1, minWidth: 140 }}>
            {p.title}
          </div>
          <span className="badge">{genderLabel(p.gender_restriction)}</span>
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
