// src/components/EventCard.tsx
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
    <div
      className="event_card"
      style={{
        display: "grid",
        gridTemplateColumns: "100px 1fr",
        columnGap: "1rem",
        padding: 10,
        borderRadius: 10,
        background: "var(--bg-soft)",
      }}
    >
      {/* Фото 69x69, r=10 */}
      <div
        style={{
          width: 100,
          height: 100,
          borderRadius: 10,
          overflow: "hidden",
          background: "#f0f0f0",
          border: "1px solid #99b9a4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#777",
          fontSize: "0.75rem",
          fontWeight: 500,
        }}
      >
        {event.photo_url ? (
          <img
            src={event.photo_url}
            alt=""
            width={100}
            height={100}
            style={{ objectFit: "cover", width: "100%", height: "100%" }}
          />
        ) : (
          "нет фото"
        )}
      </div>

      {/* Контент */}
      <div style={{ display: "grid" }}>
        {/* Заголовок */}
        <div style={{ paddingTop: 5, fontWeight: 500, fontSize: "1rem" }}>
          {event.title}
        </div>

        {/* Метаданные как в макете (маленький полупрозрачный текст) */}
        <div
          className="meta"
          style={{ color: "color-mix(in srgb, var(--text) 75%, transparent)" }}
        >
          Город: {event.city}
        </div>
        <div
          className="meta"
          style={{ color: "color-mix(in srgb, var(--text) 75%, transparent)" }}
        >
          Когда: {fmtDt(event.date_time)}
        </div>
        <div
          className="meta"
          style={{ color: "color-mix(in srgb, var(--text) 75%, transparent)" }}
        >
          Для кого:{" "}
          {event.gender_restriction === "all"
            ? "все"
            : event.gender_restriction === "male"
            ? "мужчины"
            : "девушки"}
        </div>

        {/* Чип-кнопки справа от текста (на одной строке, как в фигме) */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 10,
            alignItems: "center",
            flexWrap: "nowrap",
          }}
        >
          {canJoin && !event.is_user_joined ? (
            <>
              <button disabled={busy} onClick={doJoin} style={chipStylePrimary}>
                Записаться
              </button>
              <Link
                to={`/events/${event.id}`}
                style={{ textDecoration: "none" }}
              >
                <button style={chipStyleSecondary}>Подробнее</button>
              </Link>
            </>
          ) : (
            <Link
              to={`/events/${event.id}`}
              style={{ textDecoration: "none", flex: 1 }}
            >
              <button style={{ ...chipStyleSecondary, width: "100%" }}>
                Подробнее
              </button>
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

const chipStylePrimary: React.CSSProperties = {
  ...baseChip,
  background: "rgba(153, 185, 164, 0.5)", // #99B9A4 50%
  color: "var(--text)",
  fontWeight: 400,
  fontSize: "0.75rem",
};

const chipStyleSecondary: React.CSSProperties = {
  ...baseChip,
  background: "rgba(153, 185, 164, 0.3)", // #99B9A4 30%
  color: "var(--text)",
  fontWeight: 400,
  fontSize: "0.75rem",
};
