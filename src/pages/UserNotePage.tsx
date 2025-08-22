import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useToast } from "../state/toast";

export default function UserNotePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { show } = useToast();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ text: string }>(`/users/${id}/note`);
        setText(data?.text || "");
      } catch {}
    })();
  }, [id]);

  const save = async () => {
    try {
      setLoading(true);
      await api.put(`/users/${id}/note`, { text });
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
      await api.delete(`/users/${id}/note`);
      show("Заметка удалена", "success");
      nav(-1);
    } catch (e: any) {
      show(e?.response?.data?.detail || "Ошибка удаления", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h3>Личная заметка</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        style={{ width: "100%" }}
        placeholder="Тут вы можете ввести свою заметку о человеке, которую видите только вы"
      />
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button disabled={loading} onClick={save}>
          Сохранить
        </button>
        <button disabled={loading} onClick={remove}>
          Удалить
        </button>
        <button onClick={() => nav(-1)}>Назад</button>
      </div>
    </div>
  );
}
