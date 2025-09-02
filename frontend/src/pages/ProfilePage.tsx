import { useEffect, useMemo, useRef, useState } from "react";
import { getMe, updateMe, getMyEvents } from "../api/users";
import type { UserMe, EventCardOut } from "../types";
import EventCard from "../components/EventCard";
import { useToast } from "../state/toast";
import { normalizeCyrillic } from "../lib/validate";
import searchIcon from "../assets/search.png";
import polygonIcon from "../assets/polygon.png";

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
      {/* Заголовок страницы */}
      <h1 style={{ margin: "2rem 0 0 20px" }}>Мой профиль</h1>

      {/* Контейнер содержимого */}
      <div style={{ marginLeft: 20, marginRight: 20 }}>
        {/* Шапка профиля */}
        <section style={{ marginTop: "1.5rem" }}>
          <div
            className="grid"
            style={{
              gridTemplateRows: "100px auto auto",
              gridTemplateColumns: "100px 1fr",
              columnGap: 16,
              rowGap: 12,
              width: "100%",
              maxWidth: 320,
            }}
          >
            {/* Аватар */}
            <div style={{ gridRow: 1, gridColumn: 1 }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  overflow: "hidden",
                  background: "#eee",
                  borderRadius: 12,
                }}
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="avatar"
                    width={100}
                    height={100}
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                    }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div
                    className="center"
                    style={{ height: "100%", color: "#999", fontWeight: 600 }}
                  >
                    {me?.full_name?.[0]?.toUpperCase() ||
                      me?.username?.[0]?.toUpperCase() ||
                      "?"}
                  </div>
                )}
              </div>
            </div>

            {/* Имя + мета */}
            <div style={{ gridRow: 1, gridColumn: 2 }}>
              <h2 style={{ margin: "10px 0 3px 0" }}>{me.full_name}</h2>
              <div className="meta">@{me.username || "—"}</div>
              <div className="meta">Всего событий: {me.events_total ?? 0}</div>
              <div className="meta">Роль: {me.role || "user"}</div>
            </div>

            {/* Поле «Город» */}
            <div style={{ gridRow: 2, gridColumn: "1 / span 2" }}>
              <div className="meta" style={{ marginBottom: 4 }}>
                Город
              </div>
              <div className="field--icon">
                <input
                  className="input"
                  value={city}
                  onChange={(e) => onCityChange(e.target.value)}
                  onBlur={onCityBlur}
                  placeholder="Например, Казань"
                  style={{
                    fontSize: "0.85rem",
                    height: 28,
                    paddingLeft: 8,
                  }}
                />
                <img className="icon" src={searchIcon} alt="" />
              </div>
              {savingCity && (
                <div className="small muted" style={{ marginTop: 4 }}>
                  Сохранение…
                </div>
              )}
            </div>

            {/* Поле «Пол» */}
            <div style={{ gridRow: 3, gridColumn: "1 / span 2" }}>
              <div className="meta" style={{ marginBottom: 4 }}>
                Мой пол
              </div>
              <div className="field--icon">
                <select
                  className="select no-focus-ring"
                  value={gender}
                  onChange={(e) =>
                    onGenderChange(
                      e.target.value as "male" | "female" | "unknown"
                    )
                  }
                  style={{
                    fontSize: "0.85rem",
                    height: 28,
                    padding: "0 28px 0 8px",
                    lineHeight: "18px",
                  }}
                >
                  <option value="unknown">Не указан</option>
                  <option value="male">Мужчина</option>
                  <option value="female">Девушка</option>
                </select>
                <img
                  className="icon"
                  src={polygonIcon}
                  alt=""
                  style={{ width: 16, height: 7 }}
                />
              </div>
              {savingGender && (
                <div className="small muted" style={{ marginTop: 4 }}>
                  Сохранение…
                </div>
              )}
            </div>
          </div>
        </section>

        <section style={{ marginTop: "1.5rem" }}>
          <h2 style={{ margin: "0 0 .2rem 0" }}>Список событий</h2>
          <div className="grid" style={{ gap: 8 }}>
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
