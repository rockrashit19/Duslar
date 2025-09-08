import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../state/toast";
import { backButton } from "@telegram-apps/sdk";
import { isTGReady } from "../lib/telegram";

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
    if (!isTGReady() || !backButton.isSupported()) return;

    try {
      (backButton as any).mount?.();
      backButton.show();
    } catch {}

    let off: undefined | (() => void);
    try {
      off = backButton.onClick(() => nav(-1));
    } catch {}

    return () => {
      try {
        off?.();
        backButton.hide();
        (backButton as any).unmount?.();
      } catch {}
    };
  }, [nav]);

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
      {/* Имя как заголовок страницы — как в ProfilePage */}
      <h1 style={{ margin: "2rem 0 0 20px" }}>{data.full_name}</h1>

      {/* Контент с боковыми 20px — как в ProfilePage */}
      <div style={{ margin: "0 20px" }}>
        {/* Шапка как в ProfilePage: аватар 100x100 слева, текст справа */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "100px 1fr",
            columnGap: 20,
            alignItems: "center",
            marginTop: "1.5rem",
            maxWidth: 320,
          }}
        >
          <div
            style={{
              width: 100,
              height: 100,
              overflow: "hidden",
              background: "#eee",
              borderRadius: 12,
            }}
          >
            {data.avatar_url ? (
              <img
                src={data.avatar_url}
                alt=""
                width={100}
                height={100}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#999",
                  fontWeight: 600,
                }}
              >
                {(data.full_name || data.username || "?")
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="meta">
              Ник в Telegram:{" "}
              {data.username ? (
                <a
                  href={`https://t.me/${data.username}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  @{data.username}
                </a>
              ) : (
                "не указан"
              )}
            </div>
            <div className="meta">Город: {city}</div>
            <div className="meta">Событий вместе: {data.events_together}</div>
          </div>
        </div>

        {/* Личная заметка */}
        <h3
          style={{
            marginTop: 20,
            marginBottom: 10,
            fontWeight: 400,
          }}
        >
          Личная заметка
        </h3>

        <textarea
          className="textarea"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="тут вы можете внести заметку, которую видете только вы"
          style={{
            width: "100%",
            height: 250,
            borderRadius: 12,
            background: "#efe9dd",
            padding: "12px",
            marginTop: 6,
          }}
        />

        {/* Кнопки: две колонки, каждая на всю ширину, gap 1.25rem */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.25rem",
            marginTop: 12,
          }}
        >
          <button
            onClick={save}
            disabled={loading}
            className="btn"
            style={{
              height: "30px",
              width: "100%",
              background: "rgba(153,185,164,0.5)",
              borderColor: "transparent",
            }}
          >
            Сохранить
          </button>
          <button
            onClick={remove}
            disabled={loading}
            className="btn"
            style={{
              height: "30px",
              width: "100%",
              background: "rgba(153,185,164,0.25)",
              borderColor: "transparent",
              borderRadius: "20",
            }}
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
