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
        gridTemplateRows: "auto 1fr", // Две строки: контент и кнопки
        padding: 10,
        borderRadius: 10,
        background: "var(--bg-soft)",
        margin: "0 4px 12px 4px",
        overflow: "hidden",
      }}
    >
      {/* Верхняя часть с контентом */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "100px 1fr",
          columnGap: "1rem",
          minWidth: 0,
        }}
      >
        {/* Фото (без изменений) */}
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
        <div
          style={{
            display: "grid",
            minWidth: 0,
          }}
        >
          {/* Заголовок с переносом */}
          <div
            style={{
              paddingTop: 5,
              fontWeight: 500,
              fontSize: "1rem",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              hyphens: "auto",
            }}
          >
            {event.title}
          </div>

          {/* Метаданные с прокруткой */}
          <div
            className="meta"
            style={{
              color: "color-mix(in srgb, var(--text) 75%, transparent)",
              whiteSpace: "nowrap",
              overflowX: "auto",
              overflowY: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingBottom: 2,
              WebkitOverflowScrolling: "touch",
            }}
          >
            Город: {event.city}
          </div>
          <div
            className="meta"
            style={{
              color: "color-mix(in srgb, var(--text) 75%, transparent)",
              whiteSpace: "nowrap",
              overflowX: "auto",
              overflowY: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingBottom: 2,
            }}
          >
            Когда: {fmtDt(event.date_time)}
          </div>
          <div
            className="meta"
            style={{
              color: "color-mix(in srgb, var(--text) 75%, transparent)",
              whiteSpace: "nowrap",
              overflowX: "auto",
              overflowY: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingBottom: 2,
            }}
          >
            Для кого:{" "}
            {event.gender_restriction === "all"
              ? "все"
              : event.gender_restriction === "male"
              ? "мужчины"
              : "девушки"}
          </div>
        </div>
      </div>

      {/* Нижняя часть с кнопками - занимает всю ширину */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginTop: 12,
          width: "100%",
        }}
      >
        {canJoin && !event.is_user_joined ? (
          <>
            <button
              disabled={busy}
              onClick={doJoin}
              style={{
                ...chipStylePrimary,
                width: "100%", // Занимает всю ширину колонки
              }}
            >
              Запись
            </button>
            <Link to={`/events/${event.id}`} style={{ textDecoration: "none" }}>
              <button
                style={{
                  ...chipStyleSecondary,
                  width: "100%", // Занимает всю ширину колонки
                }}
              >
                Подробнее
              </button>
            </Link>
          </>
        ) : (
          <Link
            to={`/events/${event.id}`}
            style={{
              textDecoration: "none",
              gridColumn: "span 2", // Занимает обе колонки
            }}
          >
            <button
              style={{
                ...chipStyleSecondary,
                width: "100%",
              }}
            >
              Подробнее
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}

const baseChip: React.CSSProperties = {
  border: "none",
  borderRadius: 20,
  padding: "10px 14px",
  fontSize: "0.75rem",
  fontWeight: 400,
  lineHeight: "10px",
  cursor: "pointer",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  textAlign: "center" as const,
};

const chipStylePrimary: React.CSSProperties = {
  ...baseChip,
  background: "rgba(153, 185, 164, 0.5)",
  color: "var(--text)",
};

const chipStyleSecondary: React.CSSProperties = {
  ...baseChip,
  background: "rgba(153, 185, 164, 0.3)",
  color: "var(--text)",
};
