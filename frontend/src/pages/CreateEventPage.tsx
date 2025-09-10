import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../state/toast";
import chevronIcon from "../assets/polygon.svg";
import calendarIcon from "../assets/date.svg";
import timeIcon from "../assets/time.svg";
import { buildLocalDateTime } from "../lib/format";

type Role = "user" | "organizer" | "admin";

export default function CreateEventPage() {
  const { show } = useToast();
  const [role, setRole] = useState<Role | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ role: Role }>("/me");
        setRole(data.role);
      } catch (e: any) {
        const msg = e?.response?.data?.detail || "Ошибка загрузки профиля";
        setErr(msg);
        setRole("user");
      }
    })();
  }, [show]);

  if (err) {
    return (
      <div className="app" style={{ padding: 16 }}>
        ❌ {err}
      </div>
    );
  }
  if (role === null) {
    return (
      <div className="app" style={{ padding: 16 }}>
        Загрузка…
      </div>
    );
  }

  // ВАЖНО: порядок хуков здесь больше не меняется — ниже только условный рендер разных ДЕТЕЙ
  return role === "user" ? <CreateEventDenied /> : <CreateEventForm />;
}

/** Экран-заглушка для обычных пользователей */
function CreateEventDenied() {
  return (
    <div className="app" style={{ padding: 16 }}>
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          lineHeight: 1.6,
          fontSize: 16,
        }}
      >
        <p
          style={{
            margin: "2rem 0 0 20px",
            fontSize: "1.25rem",
            fontWeight: "400",
          }}
        >
          К сожалению, вы пока не обладаете достаточным уровнем, чтобы создавать
          мероприятия
        </p>
        <p
          style={{
            margin: "1rem 0 0 20px",
            fontSize: "1.25rem",
            fontWeight: "400",
          }}
        >
          Чтобы получить следующий уровень, напишите <br />
          <a
            href="https://t.me/hi_jemy"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "underline" }}
          >
            @hi_jemy
          </a>
        </p>
      </div>
    </div>
  );
}

/** Форма доступна organizer/admin */
function CreateEventForm() {
  const nav = useNavigate();
  const { show } = useToast();

  const [form, setForm] = useState({
    title: "",
    description: "",
    city: "",
    location: "",
    date: "",
    time: "",
    gender_restriction: "all" as "all" | "male" | "female",
    max_participants: "" as number | "",
    photo_url: "" as string | "",
  });
  const [busy, setBusy] = useState(false);

  // файл/превью
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);
  const hiddenFileRef = useRef<HTMLInputElement | null>(null);

  const onChange = (k: keyof typeof form, v: any) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canSubmit =
    !busy &&
    !!form.title.trim() &&
    !!form.city.trim() &&
    !!form.location.trim() &&
    !!form.date &&
    !!form.time;

  const openPicker = () => hiddenFileRef.current?.click();

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setPreview(URL.createObjectURL(f));

    const data = new FormData();
    data.append("file", f);

    try {
      setBusy(true);
      const { data: resp } = await api.post<{ url: string }>(
        "/files/upload",
        data,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      onChange("photo_url", resp.url);
      show("Фото загружено", "success");
    } catch (err: any) {
      show(err?.response?.data?.detail || "Ошибка загрузки фото", "error");
      setPreview(null);
      setFileName("");
      onChange("photo_url", "");
    } finally {
      setBusy(false);
      if (hiddenFileRef.current) hiddenFileRef.current.value = "";
    }
  };

  const submit = async () => {
    if (!canSubmit) {
      show(
        "Заполните обязательные поля: название, город, адрес, дату и время",
        "error"
      );
      return;
    }
    const local = buildLocalDateTime(form.date, form.time);
    if (isNaN(local.getTime())) {
      show("Некорректные дата или время", "error");
      return;
    }
    const date_time = local.toISOString();

    try {
      setBusy(true);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        city: form.city.trim(),
        location: form.location.trim(),
        date_time,
        gender_restriction: form.gender_restriction,
        max_participants:
          form.max_participants === "" ? null : Number(form.max_participants),
        photo_url: form.photo_url || null,
      };
      const { data } = await api.post("/events", payload);
      show("Событие создано", "success");
      nav(`/events/${data.id}`);
    } catch (e: any) {
      show(
        e?.response?.data?.detail ||
          "Ошибка создания (возможно, недостаточно прав)",
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  const onlyRussian = (value: string) =>
    value.replace(/[^А-Яа-яЁё0-9\s.,!?;:'"()-]/g, "");
  const onlyNumbers = (value: string) => value.replace(/[^0-9]/g, "");

  return (
    <div className="app">
      <h1 style={{ margin: "2rem 0 0 20px" }}>Создать событие</h1>

      <div style={{ margin: "0 20px" }}>
        <div className="filter">
          {/* Название */}
          <label className="col" style={{ gap: 6, marginTop: 16 }}>
            <span
              className="meta"
              style={{ fontSize: "1rem", color: "inherit" }}
            >
              Название:
            </span>
            <input
              className="input"
              placeholder="не более 15 символов"
              value={form.title}
              onChange={(e) => onChange("title", e.target.value)}
              maxLength={15}
            />
          </label>

          {/* Описание */}
          <label className="col" style={{ gap: 6, marginTop: 16 }}>
            <span
              className="meta"
              style={{ fontSize: "1rem", color: "inherit" }}
            >
              Описание:
            </span>
            <textarea
              className="textarea"
              rows={5}
              value={form.description}
              onChange={(e) => onChange("description", e.target.value)}
              style={{ padding: "10px" }}
            />
          </label>

          {/* Город */}
          <label className="col" style={{ gap: 6, marginTop: 16 }}>
            <span
              className="meta"
              style={{ fontSize: "1rem", color: "inherit" }}
            >
              Город:
            </span>
            <input
              className="input"
              value={form.city}
              onChange={(e) => onChange("city", onlyRussian(e.target.value))}
            />
          </label>

          {/* Точный адрес */}
          <label className="col" style={{ gap: 6, marginTop: 16 }}>
            <span
              className="meta"
              style={{ fontSize: "1rem", color: "inherit" }}
            >
              Точный адрес:
            </span>
            <input
              className="input"
              value={form.location}
              onChange={(e) =>
                onChange("location", onlyRussian(e.target.value))
              }
            />
          </label>

          {/* Количество участников (опц.) */}
          <label className="col" style={{ gap: 6, marginTop: 16 }}>
            <span
              className="meta"
              style={{ fontSize: "1rem", color: "inherit" }}
            >
              Количество участников:
            </span>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              placeholder="необязательно"
              value={form.max_participants as any}
              onChange={(e) =>
                onChange(
                  "max_participants",
                  onlyNumbers(e.target.value) === ""
                    ? ""
                    : Number(onlyNumbers(e.target.value))
                )
              }
            />
          </label>

          {/* Дата */}

          <label className="col" style={{ gap: 6, marginTop: 16 }}>
            <span
              className="meta"
              style={{ fontSize: "1rem", color: "inherit" }}
            >
              Дата:
            </span>
            <div className="field--icon">
              <input
                className="input no-native-picker"
                type="date"
                value={form.date}
                onChange={(e) => onChange("date", e.target.value)}
                style={{
                  borderRadius: 20,
                  fontSize: "1rem",
                  fontWeight: 400,
                  paddingLeft: 15,
                }}
              />
              <img className="icon" src={calendarIcon} alt="" />
            </div>
          </label>

          {/* Время */}
          <label className="col" style={{ gap: 6, marginTop: 16 }}>
            <span
              className="meta"
              style={{ fontSize: "1rem", color: "inherit" }}
            >
              Время:
            </span>
            <div className="field--icon">
              <input
                className="input"
                type="time"
                step={60}
                value={form.time}
                onChange={(e) => onChange("time", e.target.value)}
                style={{
                  borderRadius: 20,
                  fontSize: "1rem",
                  fontWeight: 400,
                  paddingLeft: 15,
                }}
              />
              <img className="icon" src={timeIcon} alt="" />
            </div>
          </label>

          {/* Для кого */}
          <label className="col" style={{ gap: 6, marginTop: 16 }}>
            <span
              className="meta"
              style={{ fontSize: "1rem", color: "inherit" }}
            >
              Для кого:
            </span>
            <div className="field--icon">
              <select
                className="select"
                value={form.gender_restriction}
                onChange={(e) =>
                  onChange(
                    "gender_restriction",
                    e.target.value as "all" | "male" | "female"
                  )
                }
              >
                <option value="all">все</option>
                <option value="male">мужчины</option>
                <option value="female">девушки</option>
              </select>
              <img
                className="icon"
                src={chevronIcon}
                alt=""
                style={{ width: 16, height: 7 }}
              />
            </div>
          </label>

          {/* Фото (опционально) */}
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span
                style={{ fontSize: "1rem", fontWeight: 400, color: "inherit" }}
              >
                Фотография
              </span>
              <span className="muted" style={{ fontSize: "0.875rem" }}>
                (опционально)
              </span>
            </div>

            <input
              ref={hiddenFileRef}
              type="file"
              accept="image/*"
              onChange={onPick}
              style={{ display: "none" }}
              disabled={busy}
            />

            <div style={{ display: "flex", alignItems: "center" }}>
              <button
                type="button"
                onClick={openPicker}
                disabled={busy}
                style={{
                  width: 163,
                  height: 33,
                  borderRadius: 8,
                  border: "none",
                  background: "#EFE9DD",
                  color: "rgba(11, 41, 67, 0.25)",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                {busy ? "Загрузка…" : "Выберите файл"}
              </button>

              <div
                title={fileName || "Файл не выбран"}
                style={{
                  marginLeft: 20,
                  flex: 1,
                  minWidth: 0,
                  color: "rgba(11, 41, 67, 0.25)",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textAlign: "left",
                }}
              >
                {fileName || "Файл не выбран"}
              </div>
            </div>

            {preview && (
              <div
                style={{
                  marginTop: 12,
                  borderRadius: 12,
                  padding: 0,
                  border: "1px solid rgba(0,0,0,.06)",
                }}
              >
                <img
                  src={preview}
                  alt=""
                  style={{
                    display: "block",
                    width: "100%",
                    maxHeight: 220,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Создать */}
        <div style={{ marginTop: 20 }}>
          <button
            disabled={!canSubmit}
            onClick={submit}
            className="btn btn--primary"
            style={{
              width: "100%",
              minHeight: 40,
              borderRadius: 10,
              opacity: canSubmit ? 1 : 0.3,
              cursor: canSubmit ? "pointer" : "default",
              background: "#99B9A4",
            }}
          >
            {busy ? "Создаём..." : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}
