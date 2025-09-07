import { useState } from "react";
import { api } from "../lib/api";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { useToast } from "../state/toast";

export default function VisibilityToggle({
  eventId,
  initial,
  onChanged,
}: {
  eventId: number;
  initial: boolean;
  onChanged: (v: boolean) => void;
}) {
  const [val, setVal] = useState(initial);
  const { show } = useToast();

  const { run, loading } = useAsyncAction(async () => {
    const next = !val;
    await api.post(`/events/${eventId}/visibility`, { is_visible: next });
    setVal(next);
    onChanged(next);
  });

  const onClick = async () => {
    try {
      await run();
      show(val ? "Вы скрыли себя" : "Вы показываете себя", "success");
    } catch (e: any) {
      const msg = e?.response?.data?.detial || "Ошибка переключения видимости";
      show(msg, "error");
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="btn btn--visibility"
    >
      {loading ? "..." : val ? "Скрыть" : "Показать"}
    </button>
  );
}
