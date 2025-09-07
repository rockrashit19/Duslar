import { useEffect, useMemo, useRef, useState } from "react";
import { getMe, updateMe, getMyEvents } from "../api/users";
import type { UserMe, EventCardOut } from "../types";
import EventCard from "../components/EventCard";
import { useToast } from "../state/toast";
import { normalizeCyrillic } from "../lib/validate";
import searchIcon from "../assets/search.png";
import polygonIcon from "../assets/polygon.png";
import { clip17 } from "../lib/format";

/** Лёгкий debounce без внешних зависимостей */
function useDebounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  const t = useRef<number | undefined>(undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return (...args: Parameters<T>) => {
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => fn(...args), ms);
  };
}

export default function ProfilePage() {
  const { show } = useToast();

  const [me, setMe] = useState<UserMe | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Локальные поля формы
  const [city, setCity] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "unknown">(
    "unknown"
  );
  const [savingCity, setSavingCity] = useState(false);
  const [savingGender, setSavingGender] = useState(false);

  // История моих событий
  const [rows, setRows] = useState<EventCardOut[]>([]);

  // Стартовая загрузка профиля и записей
  useEffect(() => {
    (async () => {
      try {
        const meRes = await getMe();
        setMe(meRes.data);
        setCity(meRes.data.city || "");
        setGender(meRes.data.gender);

        const evRes = await getMyEvents({
          status: "all",
          limit: 20,
          offset: 0,
        });
        setRows(evRes.data);
      } catch (e: any) {
        const msg = e?.response?.data?.detail || "Ошибка загрузки профиля";
        setErr(msg);
        show(msg, "error");
      }
    })();
  }, [show]);

  // Картинка аватара (или fallback-буква)
  const avatarSrc = useMemo(() => me?.avatar_url || undefined, [me]);

  // --- Сохранение города (debounced) ---
  const saveCity = async (value: string) => {
    setSavingCity(true);
    try {
      const { data } = await updateMe({ city: value.trim() || null });
      setMe(data);
      show("Город сохранён", "success");
    } catch (e: any) {
      show(e?.response?.data?.detail || "Не удалось сохранить город", "error");
    } finally {
      setSavingCity(false);
    }
  };
  const saveCityDebounced = useDebounce(saveCity, 600);

  const onCityChange = (v: string) => {
    const norm = normalizeCyrillic(v);
    setCity(norm);
    saveCityDebounced(norm);
  };
  const onCityBlur = () => saveCity(city);

  // --- Сохранение пола ---
  const onGenderChange = async (v: "male" | "female" | "unknown") => {
    setGender(v);
    setSavingGender(true);
    try {
      const { data } = await updateMe({ gender: v });
      setMe(data);
      show("Пол сохранён", "success");
    } catch (e: any) {
      show(e?.response?.data?.detail || "Не удалось сохранить пол", "error");
    } finally {
      setSavingGender(false);
    }
  };

  // Патч карточки события после действий в дочерних компонентах
  const patchEvent = (next: EventCardOut) => {
    setRows((prev) => prev.map((r) => (r.id === next.id ? next : r)));
  };

  // Состояния загрузки/ошибок
  if (err)
    return (
      <div className="app" style={{ padding: 16 }}>
        ❌ {err}
      </div>
    );
  if (!me)
    return (
      <div className="app" style={{ padding: 16 }}>
        Загрузка…
      </div>
    );

  return (
    <div className="app">
      <h1 className="mt-6">Мой профиль</h1>
      <div className="profile-container">
        <section className="mt-5">
          <div className="profile-header">
            <div className="avatar">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="avatar"
                  className="img-fit"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              ) : (
                <div className="avatar__fallback">
                  {me?.full_name?.[0]?.toUpperCase() ||
                    me?.username?.[0]?.toUpperCase() ||
                    "?"}
                </div>
              )}
            </div>
            <div className="col">
              <h2 className="mt-2 mb-1">{me.full_name}</h2>
              <div className="meta">@{clip17(me.username || "—")}</div>
              <div className="meta">Всего событий: {me.events_total ?? 0}</div>
              <div className="meta">Роль: {me.role || "user"}</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="field-label">Город</div>
            <div className="field--icon">
              <input
                className="input input--small"
                value={city}
                onChange={(e) => onCityChange(e.target.value)}
                onBlur={onCityBlur}
                placeholder="Например, Казань"
              />
              <img className="icon" src={searchIcon} alt="" />
            </div>
            {savingCity && <div className="small muted mt-1">Сохранение…</div>}
          </div>
          <div className="mt-3">
            <div className="field-label">Мой пол</div>
            <div className="field--icon">
              <select
                className="select no-focus-ring select--small"
                value={gender}
                onChange={(e) =>
                  onGenderChange(
                    e.target.value as "male" | "female" | "unknown"
                  )
                }
              >
                <option value="unknown">Не указан</option>
                <option value="male">Мужчина</option>
                <option value="female">Девушка</option>
              </select>
              <img className="icon" src={polygonIcon} alt="" />
            </div>
            {savingGender && (
              <div className="small muted mt-1">Сохранение…</div>
            )}
          </div>
        </section>
        <section className="mt-5">
          <h2 className="mb-1">Список событий</h2>
          <div className="grid gap-2">
            {rows.map((ev) => (
              <EventCard key={ev.id} event={ev} onChanged={patchEvent} />
            ))}
            {rows.length === 0 && (
              <div className="muted">Пока нет посещённых событий</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
