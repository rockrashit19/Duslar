import { useState } from "react";
import type { EventCardOut } from "../types";
import { Link } from "react-router-dom";
import { fmtDt } from "../lib/format";
import { api } from "../lib/api";
import { useToast } from "../state/toast";

export default function EventCard({
  event,
  onChanged,
}: {
  event: EventCardOut;
  onChanged?: (next: EventCardOut) => void;
}) {
  const [busy, setBusy] = useState(false);
  const { show } = useToast();

  const status = event.status ?? "open";
  const max = event.max_participants ?? null;
  const isFull = max != null && event.participants_count >= max;
  const canJoin = status === "open" && !isFull;

  const doJoin = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await api.post(`/events/${event.id}/join`, {});
      show("Вы записались", "success");
      onChanged?.({
        ...event,
        is_user_joined: true,
        participants_count: event.participants_count + 1,
      });
    } catch (e: any) {
      show(e?.response?.data?.detail || "Не удалось записаться", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="event_card">
      <div className="event-image">
        {event.photo_url ? (
          <img src={event.photo_url} alt="" className="img-fit" />
        ) : (
          "нет фото"
        )}
      </div>
      <div className="col">
        <div className="event-title">{event.title}</div>
        <div className="meta">Город: {event.city}</div>
        <div className="meta">Когда: {fmtDt(event.date_time)}</div>
        <div className="meta">
          Для кого:{" "}
          {event.gender_restriction === "all"
            ? "все"
            : event.gender_restriction === "male"
            ? "мужчины"
            : "девушки"}
        </div>
        <div className="btn-grid mt-2">
          {canJoin && !event.is_user_joined ? (
            <>
              <button
                disabled={busy}
                onClick={doJoin}
                className="chip chip--primary"
              >
                Записаться
              </button>
              <Link to={`/events/${event.id}`}>
                <button className="chip chip--secondary">Подробнее</button>
              </Link>
            </>
          ) : (
            <Link to={`/events/${event.id}`} className="grid-span-2">
              <button className="chip chip--secondary">Подробнее</button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// «Чипы» как в макете: зелёные полупрозрачные плашки с округлением
const baseChip: React.CSSProperties = {
  border: "none",
  borderRadius: 20,
  padding: "4px 10px",
  fontSize: "0.75rem",
  fontWeight: 500,
  lineHeight: 1,
  cursor: "pointer",
};

// const chipStylePrimary: React.CSSProperties = {
//   ...baseChip,
//   background: "rgba(153, 185, 164, 0.5)", // #99B9A4 50%
//   color: "var(--text)",
//   fontWeight: 400,
//   fontSize: "0.75rem",
//   lineHeight: "10px",
//   padding: "10px 14px",
// };

// const chipStyleSecondary: React.CSSProperties = {
//   ...baseChip,
//   background: "rgba(153, 185, 164, 0.3)", // #99B9A4 30%
//   color: "var(--text)",
//   fontWeight: 400,
//   fontSize: "0.75rem",
//   lineHeight: "10px",
//   padding: "10px 14px",
// };
