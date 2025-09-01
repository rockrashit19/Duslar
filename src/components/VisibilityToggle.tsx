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
      style={{
        padding: val ? "10px 14px" : "10px 10px",
        borderRadius: 20,
        background: "#e5deccb3",
        color: "#07253F82",
        border: "none",
        width: "100%",
        minWidth: 95,
        height: 40,
      }}
    >
      {loading ? "..." : val ? "Скрыть" : "Показать"}
    </button>
  );
}
