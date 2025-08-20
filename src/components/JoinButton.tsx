import { useAsyncAction } from "../hooks/useAsyncAction";
import { api } from "../lib/api";

export default function JoinButton({
  eventId,
  joined,
  onChanged,
}: {
  eventId: number;
  joined: boolean;
  onChanged: (next: boolean) => void;
}) {
  const { run, loading } = useAsyncAction(async () => {
    const path = joined ? `events/${eventId}/leave` : `events/${eventId}/join`;
    await api.post(path, {});
    onChanged(!joined);
  });
  return (
    <button
      onClick={run}
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
