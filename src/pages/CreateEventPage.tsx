import { useState } from "react";
import { api } from "../lib/api";
import { useToast } from "../state/toast";
import { useNavigate } from "react-router-dom";
import ImageUploader from "../components/ImageUploader";

export default function CreateEventPage() {
  const nav = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    city: "",
    date_time: "",
    gender_restriction: "all",
    max_participants: "" as number | "",
    photo_url: "" as string | "",
  });
  const [busy, setBusy] = useState(false);

  const onChange = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    try {
      setBusy(true);
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim(),
        city: form.city.trim(),
        date_time: new Date(form.date_time).toISOString(),
        gender_restriction: form.gender_restriction as
          | "male"
          | "female"
          | "all",
        max_participants:
          form.max_participants === "" ? null : Number(form.max_participants),
        photo_url: form.photo_url || null,
      };
      const { data } = await api.post("/events", payload);
      show("Событие создано", "success");
      nav(`/events/${data.id}`);
    } catch (e: any) {
      show(e?.response?.data?.detail || "Ошибка создания", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 16, display: "grid", gap: 8 }}>
      <h3>Создать событие</h3>
      <input
        placeholder="Название"
        value={form.title}
        onChange={(e) => onChange("title", e.target.value)}
      />
      <textarea
        placeholder="Описание"
        rows={5}
        value={form.description}
        onChange={(e) => onChange("description", e.target.value)}
      />
      <input
        placeholder="Точный адрес"
        value={form.location}
        onChange={(e) => onChange("location", e.target.value)}
      />
      <input
        placeholder="Город"
        value={form.city}
        onChange={(e) => onChange("city", e.target.value)}
      />
      <input
        type="datetime-local"
        value={form.date_time}
        onChange={(e) => onChange("date_time", e.target.value)}
      />
      <select
        value={form.gender_restriction}
        onChange={(e) => onChange("gender_restriction", e.target.value)}
      >
        <option value="all">Все</option>
        <option value="male">М</option>
        <option value="female">Ж</option>
      </select>
      <input
        type="number"
        placeholder="Макс. участников (опц.)"
        value={form.max_participants as any}
        onChange={(e) =>
          onChange(
            "max_participants",
            e.target.value === "" ? "" : Number(e.target.value)
          )
        }
      />
      <div>
        <label style={{ display: "block", marginBottom: 6 }}>
          Фото (опционально)
        </label>
        <ImageUploader onUploaded={(url) => onChange("photo_url", url)} />
      </div>
      <button disabled={busy} onClick={submit}>
        Создать
      </button>
    </div>
  );
}
