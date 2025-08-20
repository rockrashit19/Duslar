import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "./state/auth";
import EventsPage from "./pages/EventsPage";
import EventPage from "./pages/EventPage";

export default function App() {
  const { ready, error } = useAuth();
  if (!ready) return <div style={{ padding: 160 }}>Загрузка...</div>;
  if (error) return <div style={{ padding: 16 }}>❌ {error}</div>;
  return (
    <Routes>
      <Route path="/" element={<EventsPage />} />
      <Route path="/events/:id" element={<EventPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
