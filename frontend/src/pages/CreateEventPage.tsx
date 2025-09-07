import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../state/toast";
import chevronIcon from "../assets/polygon.png";
import calendarIcon from "../assets/date.png";
import timeIcon from "../assets/time.png";
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
      <h1 className="mt-6">Создать событие</h1>
      <div className="form-container">
        <div className="form-field">
          <span className="meta">Название:</span>
          <input
            className="input"
            placeholder="не более 15 символов"
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
            maxLength={15}
          />
        </div>
        <div className="form-field">
          <span className="meta">Описание:</span>
          <textarea
            className="textarea"
            rows={5}
            value={form.description}
            onChange={(e) => onChange("description", e.target.value)}
          />
        </div>
        <div className="form-field">
          <span className="meta">Город:</span>
          <input
            className="input"
            value={form.city}
            onChange={(e) => onChange("city", onlyRussian(e.target.value))}
          />
        </div>
        <div className="form-field">
          <span className="meta">Точный адрес:</span>
          <input
            className="input"
            value={form.location}
            onChange={(e) => onChange("location", onlyRussian(e.target.value))}
          />
        </div>
        <div className="form-field">
          <span className="meta">Количество участников:</span>
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
        </div>
        <div className="form-field">
          <span className="meta">Дата:</span>
          <div className="field--icon">
            <input
              className="input no-native-picker"
              type="date"
              value={form.date}
              onChange={(e) => onChange("date", e.target.value)}
            />
            <img className="icon" src={calendarIcon} alt="" />
          </div>
        </div>
        <div className="form-field">
          <span className="meta">Время:</span>
          <div className="field--icon">
            <input
              className="input"
              type="time"
              step={60}
              value={form.time}
              onChange={(e) => onChange("time", e.target.value)}
            />
            <img className="icon" src={timeIcon} alt="" />
          </div>
        </div>
        <div className="form-field">
          <span className="meta">Для кого:</span>
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
            <img className="icon" src={chevronIcon} alt="" />
          </div>
        </div>
        <div className="form-field">
          <div className="row">
            <span className="meta">Фотография</span>
            <span className="muted small">(опционально)</span>
          </div>
          <input
            ref={hiddenFileRef}
            type="file"
            accept="image/*"
            onChange={onPick}
            style={{ display: "none" }}
            disabled={busy}
          />
          <div className="file-upload">
            <button
              type="button"
              onClick={openPicker}
              disabled={busy}
              className="file-upload__btn"
            >
              {busy ? "Загрузка…" : "Выберите файл"}
            </button>
            <div
              className="file-upload__name"
              title={fileName || "Файл не выбран"}
            >
              {fileName || "Файл не выбран"}
            </div>
          </div>
          {preview && (
            <div className="preview-image">
              <img src={preview} alt="" className="img-fit" />
            </div>
          )}
        </div>
        <div className="mt-5">
          <button
            disabled={!canSubmit}
            onClick={submit}
            className="btn btn--primary"
          >
            {busy ? "Создаём..." : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}
