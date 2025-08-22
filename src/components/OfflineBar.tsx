import { useEffect, useState } from "react";

export default function OfflineBar() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  if (online) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        padding: "8px 12px",
        background: "#fff5c2",
        borderBottom: "1px solid #f0d98a",
        textAlign: "center",
        zIndex: 1000,
      }}
    >
      Нет соединения. Действия недоступны.
    </div>
  );
}
