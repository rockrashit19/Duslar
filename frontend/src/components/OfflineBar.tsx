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
    <div>
      {!online && (
        <div className="offline-bar">Нет соединения. Действия недоступны.</div>
      )}
    </div>
  );
}
