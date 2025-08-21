import { useAsyncAction } from "../hooks/useAsyncAction";
import { api } from "../lib/api";
import { useToast } from "../state/toast";

export default function JoinButton({
  eventId,
  joined,
  onChanged,
}: {
  eventId: number;
  joined: boolean;
  onChanged: (next: boolean) => void;
}) {
  const { show } = useToast();

  const doCall = async () => {
    const path = joined ? `events/${eventId}/leave` : `events/${eventId}/join`;
    await api.post(path, {});
  };

  const { run, loading } = useAsyncAction(doCall);

  const onClick = async () => {
    try {
      await run();
      onChanged(!joined);
      show(joined ? "Вы вышли из события" : "Вы записались", "success");
    } catch (e: any) {
      const msg = e?.response?.data?.detail || "Ошибка действия";
      show(msg, "error");
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        background: joined ? "#eee" : "#2ea44f",
        color: joined ? "#111" : "#fff",
        border: "none",
        minWidth: 120,
      }}
    >
      {loading ? "Подождите..." : joined ? "Выйти" : "Записаться"}
    </button>
  );
}
