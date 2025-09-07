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
      className={`btn ${joined ? "btn--leave" : "btn--join"}`}
    >
      {loading ? "Подождите..." : joined ? "Выйти" : "Записаться"}
    </button>
  );
}
