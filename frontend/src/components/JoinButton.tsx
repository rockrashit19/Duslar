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
        borderRadius: 20,
        background: joined ? "#e5deccb3" : "#99b9a482",
        color: joined ? "#07253F82" : "#07253F",
        border: "none",
        width: "100%",
        minWidth: joined ? 95 : 200,
        height: 40,
      }}
    >
      {loading ? "Подождите..." : joined ? "Выйти" : "Записаться"}
    </button>
  );
}
