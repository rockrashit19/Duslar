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

function dateStartZ(d: string) {
  return `${d}T00:00:00.000Z`;
}
function dateEndZ(d: string) {
  return `${d}T23:59:59.999Z`;
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
    setFrom(filters.from ? filters.from.slice(0, 10) : "");
    setTo(filters.to ? filters.to.slice(0, 10) : "");
  }, [filters]);

  const applyFilters = () => {
    setOffset(0);
    setFilters({
      q: filters.q,
      city: city.trim() || undefined,
      gender,
      from: from ? dateStartZ(from) : undefined,
      to: to ? dateEndZ(to) : undefined,
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
    <div className="app">
      <div className="search-bar">
        <div className="field--icon">
          <input
            className="input search-input"
            value={q}
            onChange={(e) => {
              const val = e.target.value;
              setQ(val);
              if (val === "") setFilters((p) => ({ ...p, q: undefined }));
            }}
            placeholder="Найти мероприятие"
          />
          <img className="icon" src={searchIcon} alt="" />
        </div>
        <button
          aria-label="Фильтры"
          onClick={() => setShowFilters((v) => !v)}
          className="filter-btn"
        >
          <img src={filterIcon} alt="" />
        </button>
      </div>
      {showFilters && (
        <div className="filters-panel">
          <RowLine
            label="Город:"
            control={
              <div className="field--icon">
                <input
                  className="input"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Казань"
                />
                <img className="icon" src={searchIcon} alt="" />
              </div>
            }
          />
          <RowLine
            label="Для:"
            control={
              <div className="field--icon">
                <select
                  className="select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                >
                  <option value="all">все</option>
                  <option value="male">мужчины</option>
                  <option value="female">девушки</option>
                </select>
                <img className="icon" src={polygonIcon} alt="" />
              </div>
            }
          />
          <RowLine
            label="Дата от:"
            control={
              <div className="field--icon">
                <input
                  className="input no-native-picker"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
                <img className="icon" src={calendarIcon} alt="" />
              </div>
            }
          />
          <RowLine
            label="Дата до:"
            control={
              <div className="field--icon">
                <input
                  className="input no-native-picker"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
                <img className="icon" src={calendarIcon} alt="" />
              </div>
            }
          />
          <div className="btn-grid">
            <button onClick={resetFilters} className="btn btn--filter">
              Сбросить
            </button>
            <button onClick={applyFilters} className="btn btn--filter">
              Применить
            </button>
          </div>
        </div>
      )}
      {err && <div className="error-message mt-3">❌ {err}</div>}
      <div className="events-list">
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
        <div className="mt-3">
          <button
            disabled={loading || eof}
            onClick={() => {
              const next = offset + PAGE;
              setOffset(next);
              load(false, next);
            }}
            className="load-more-btn"
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
