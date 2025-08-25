import { useEffect, useState } from "react";
import { api } from "../lib/api";
import EventCard from "../components/EventCard";
import FiltersBar from "../components/FiltersBar";
import SkeletonCard from "../components/SkeletonCard";

type EventCardOut = {
  id: number;
  title: string;
  location: string;
  city: string;
  date_time: string;
  gender_restriction: "male" | "female" | "all";
  creator_id: number | null;
  participants_count: number;
  is_user_joined: boolean;
  photo_url?: string | null;
};

const PAGE = 10;

export default function EventsPage() {
  const [rows, setRows] = useState<EventCardOut[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [eof, setEof] = useState(false);
  const [filters, setFilters] = useState<{
    city?: string;
    from?: string;
    to?: string;
    gender?: "male" | "female" | "all";
  }>({});
  const [offset, setOffset] = useState(0);

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
      setErr(e?.response?.data?.detail || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    load(true);
  }, [filters]);

  return (
    <div className="app">
      <h3 style={{ margin: "0 0 12px" }}>События</h3>
      <FiltersBar
        initial={filters}
        onApply={(f) =>
          setFilters({
            city: f.city || undefined,
            from: f.from,
            to: f.to,
            gender: (f.gender || "all") as any,
          })
        }
      />
      {err && (
        <div
          style={{
            padding: 12,
            background: "#ffecec",
            border: "1px solid #ffc0c0",
            borderRadius: 8,
            marginBottom: 12,
          }}
        >
          ❌ {err}
        </div>
      )}
      {rows?.length === 0 && loading && (
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {rows?.map((e) => (
        <EventCard key={e.id} {...e} />
      ))}

      <div style={{ marginTop: 12 }}>
        {!eof && (
          <button
            disabled={loading || eof}
            onClick={() => {
              const next = offset + PAGE;
              setOffset(next);
              load(false, next);
            }}
            style={{ padding: "10px 14px ", borderRadius: 10, minWidth: 140 }}
          >
            {loading ? "Загружаем..." : eof ? "" : "Показать еще"}
          </button>
        )}
      </div>
    </div>
  );
}
