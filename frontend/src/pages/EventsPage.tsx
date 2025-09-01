import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import type { EventCardOut } from "../types";
import EventCard from "../components/EventCard";
import { useToast } from "../state/toast";

// иконки
import filterIcon from "../assets/filter.png";
import searchIcon from "../assets/search.png";
import calendarIcon from "../assets/date.png";
import polygonIcon from "../assets/polygon.png";

const PAGE = 10;

type Filters = {
  city?: string;
  from?: string;
  to?: string;
  gender?: "male" | "female" | "all";
  q?: string;
};

function isoDateStartZ(d: string) {
  return new Date(`${d}T00:00:00`).toISOString();
}
function isoDateEndZ(d: string) {
  const dt = new Date(`${d}T23:59:59.999`);
  return dt.toISOString();
}

export default function EventsPage() {
  const { show } = useToast();

  const [rows, setRows] = useState<EventCardOut[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [eof, setEof] = useState(false);

  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({});
  const [offset, setOffset] = useState(0);

  // debounce поиска -> filters.q
  useEffect(() => {
    const id = setTimeout(() => {
      setOffset(0);
      setFilters((prev) => ({ ...prev, q: q.trim() || undefined }));
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const params = useMemo(
    () => ({ ...filters, limit: PAGE, offset }),
    [filters, offset]
  );

  const load = async (reset = false, useOffset?: number) => {
    if (loading) return;
    setLoading(true);
    setErr(null);
    const off = useOffset ?? offset;
    try {
      const { data } = await api.get<EventCardOut[]>("/events", {
        params: { ...filters, limit: PAGE, offset: off },
      });
      if (reset) setRows(data);
      else {
        setRows((prev) => {
          const map = new Map<number, EventCardOut>(
            prev?.map((e) => [e.id, e])
          );
          for (const e of data) map.set(e.id, e);
          return Array.from(map.values());
        });
      }
      setEof(data.length < PAGE);
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Ошибка загрузки";
      setErr(msg);
      show(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // первичная загрузка + при изменении фильтров
  useEffect(() => {
    setOffset(0);
    load(true, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.city, params.from, params.to, params.gender, params.q]);

  // локальные контролы фильтра
  const [city, setCity] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "all">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    setCity(filters.city || "");
    setGender(filters.gender ?? "all");
    setFrom(
      filters.from ? new Date(filters.from).toISOString().slice(0, 10) : ""
    );
    setTo(filters.to ? new Date(filters.to).toISOString().slice(0, 10) : "");
  }, [filters]);

  const applyFilters = () => {
    setOffset(0);
    setFilters({
      q: filters.q,
      city: city.trim() || undefined,
      gender,
      from: from ? isoDateStartZ(from) : undefined,
      to: to ? isoDateEndZ(to) : undefined,
    });
  };
  const resetFilters = () => {
    setOffset(0);
    setCity("");
    setGender("all");
    setFrom("");
    setTo("");
    setFilters((prev) => ({ q: prev.q }));
  };

  return (
    <div className="app" style={{ paddingLeft: 20, paddingRight: 20 }}>
      {/* строка поиска + кнопка фильтра */}
      <div
        style={{
          marginTop: "2rem",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          columnGap: 8,
        }}
      >
        {/* ТОЛЬКО SearchBar: высота 40, r=10, без внешних рамок */}
        <div style={{ width: "100%" }}>
          <div
            className="field--icon"
            style={{
              width: "100%",
            }}
          >
            <input
              className="input search-input"
              value={q}
              onChange={(e) => {
                const val = e.target.value;
                setQ(val);
                if (val === "") setFilters((p) => ({ ...p, q: undefined }));
              }}
              placeholder="Найти мероприятие"
              style={{
                height: 40,
                borderRadius: 10,
                background: "#efe9dd",
                border: "none",
                boxShadow: "none",
                paddingLeft: 15,
                paddingRight: 36,
              }}
            />
          </div>
        </div>

        {/* Кнопка фильтров: без обводок, только PNG 30x15 */}
        <button
          aria-label="Фильтры"
          onClick={() => setShowFilters((v) => !v)}
          style={{
            width: 30,
            height: 15,
            padding: 0,
            border: "none",
            background: "transparent",
            display: "grid",
            placeItems: "center",
          }}
        >
          <img
            src={filterIcon}
            alt=""
            style={{ width: 30, height: 15, display: "block" }}
          />
        </button>
      </div>

      {/* ПАНЕЛЬ ФИЛЬТРОВ */}
      {showFilters && (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            borderRadius: "var(--r-md)",
            background: "var(--bg-soft)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Город */}
          <RowLine
            label="Город:"
            control={
              <div className="field--icon">
                <input
                  className="input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Казань"
                  style={{
                    borderRadius: 20,
                    fontSize: "1rem",
                    fontWeight: 400,
                    paddingLeft: 15,
                  }}
                />
                <img className="icon" src={searchIcon} alt="" />
              </div>
            }
          />

          {/* Для */}
          <RowLine
            label="Для:"
            control={
              <div className="field--icon">
                <select
                  className="select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  style={{
                    borderRadius: 20,
                    fontSize: "1rem",
                    fontWeight: 400,
                    paddingLeft: 15,
                  }}
                >
                  <option value="all">все</option>
                  <option value="male">мужчины</option>
                  <option value="female">девушки</option>
                </select>
                <img
                  className="icon"
                  src={polygonIcon}
                  alt=""
                  style={{ width: 16, height: 7 }}
                />
              </div>
            }
          />

          {/* Дата от */}
          <RowLine
            label="Дата от:"
            control={
              <div className="field--icon">
                <input
                  className="input no-native-picker"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  style={{
                    borderRadius: 20,
                    fontSize: "1rem",
                    fontWeight: 400,
                    paddingLeft: 15,
                  }}
                />
                <img className="icon" src={calendarIcon} alt="" />
              </div>
            }
          />

          {/* Дата до */}
          <RowLine
            label="Дата до:"
            control={
              <div className="field--icon">
                <input
                  className="input no-native-picker"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  style={{
                    borderRadius: 20,
                    fontSize: "1rem",
                    fontWeight: 400,
                    paddingLeft: 15,
                  }}
                />
                <img className="icon" src={calendarIcon} alt="" />
              </div>
            }
          />

          {/* Кнопки в одну строку, одинаковый фон 30%, r=20 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginTop: 8,
            }}
          >
            <button
              onClick={resetFilters}
              style={{
                height: 30,
                borderRadius: 20,
                border: "none",
                background: "rgba(153,185,164,0.3)",
                fontWeight: 400,
                fontSize: "1rem",
              }}
            >
              Сбросить
            </button>
            <button
              onClick={applyFilters}
              style={{
                height: 30,
                borderRadius: 20,
                border: "none",
                background: "rgba(153,185,164,0.3)",
                fontWeight: 400,
                fontSize: "1rem",
              }}
            >
              Применить
            </button>
          </div>
        </div>
      )}

      {/* ошибка */}
      {err && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            background: "#ffecec",
            border: "1px solid #ffc0c0",
            borderRadius: 8,
          }}
        >
          ❌ {err}
        </div>
      )}

      {/* список карточек */}
      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {rows?.map((e) => (
          <EventCard
            key={e.id}
            event={e}
            onChanged={(next) =>
              setRows((prev) =>
                (prev || []).map((r) => (r.id === next.id ? next : r))
              )
            }
          />
        ))}
        {rows && rows.length === 0 && (
          <div className="muted">Ничего не найдено</div>
        )}
      </div>

      {!eof && (
        <div style={{ marginTop: 12 }}>
          <button
            disabled={loading || eof}
            onClick={() => {
              const next = offset + PAGE;
              setOffset(next);
              load(false, next);
            }}
            style={{
              width: "100%",
              height: 36,
              borderRadius: 12,
              border: "1px solid var(--border)",
              background: "var(--bg-soft)",
            }}
          >
            {loading ? "Загружаем..." : "Показать ещё"}
          </button>
        </div>
      )}
    </div>
  );
}

function RowLine({
  label,
  control,
}: {
  label: string;
  control: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "88px 1fr",
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <span
        style={{
          fontSize: "1rem",
          fontWeight: 400,
          color: "var(--tg-text)",
        }}
      >
        {label}
      </span>
      <div>{control}</div>
    </div>
  );
}
