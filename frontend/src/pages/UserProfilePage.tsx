import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../state/toast";

type UserPublic = {
  id: number;
  username: string | null;
  full_name: string;
  avatar_url: string | null;
  city: string | null;
  events_together: number;
};

export default function UserProfilePage() {
  const { id } = useParams();
  const uid = Number(id);
  const nav = useNavigate();
  const { show } = useToast();

  const [data, setData] = useState<UserPublic | null>(null);
  const [note, setNote] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<UserPublic>(`/users/${uid}`);
        setData(data);
      } catch (e: any) {
        const msg = e?.response?.data?.detail || "Ошибка загрузки профиля";
        setErr(msg);
        show(msg, "error");
      }
      try {
        const { data } = await api.get<{ text: string | null }>(
          `/users/${uid}/note`
        );
        setNote(data?.text || "");
      } catch {}
    })();
  }, [uid, show]);

  const save = async () => {
    const text = note.trim();
    if (!text) {
      show("Введите текст заметки", "error");
      return;
    }
    try {
      setLoading(true);
      await api.put(`/users/${uid}/note`, { text });
      show("Заметка сохранена", "success");
      nav(-1);
    } catch (e: any) {
      show(e?.response?.data?.detail || "Ошибка сохранения", "error");
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    try {
      setLoading(true);
      await api.delete(`/users/${uid}/note`);
      show("Заметка удалена", "success");
      nav(-1);
    } catch (e: any) {
      show(e?.response?.data?.detail || "Ошибка удаления", "error");
    } finally {
      setLoading(false);
    }
  };

  if (err)
    return (
      <div className="app" style={{ padding: 16 }}>
        ❌ {err}
      </div>
    );
  if (!data)
    return (
      <div className="app" style={{ padding: 16 }}>
        Загрузка…
      </div>
    );

  const city = data.city?.trim() ? data.city : "не указан";

  return (
    <div className="app">
      <h1 className="mt-6">{data.full_name}</h1>
      <div className="profile-container">
        <div className="profile-header">
          <div className="avatar">
            {data.avatar_url ? (
              <img src={data.avatar_url} alt="" className="img-fit" />
            ) : (
              <div className="avatar__fallback">
                {(data.full_name || data.username || "?")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </div>
          <div className="col">
            <div className="meta">
              Ник в Telegram:{" "}
              {data.username ? (
                <a href={`https://t.me/${data.username}`}>@{data.username}</a>
              ) : (
                "не указан"
              )}
            </div>
            <div className="meta">Город: {city}</div>
            <div className="meta">Событий вместе: {data.events_together}</div>
          </div>
        </div>
        <h3 className="mt-3 mb-2">Личная заметка</h3>
        <textarea
          className="textarea textarea--large"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="тут вы можете внести заметку, которую видите только вы"
        />
        <div className="btn-grid">
          <button onClick={save} disabled={loading} className="btn btn--save">
            Сохранить
          </button>
          <button
            onClick={remove}
            disabled={loading}
            className="btn btn--delete"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
