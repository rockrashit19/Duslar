import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "./state/auth";
import EventsPage from "./pages/EventsPage";
import EventPage from "./pages/EventPage";
import HistoryPage from "./pages/HistoryPage";
import UserNotePage from "./pages/UserNotePage";
import CreateEventPage from "./pages/CreateEventPage";
import MainLayout from "./layouts/MainLayout";

export default function App() {
  const { ready, error } = useAuth();
  if (!ready) return <div style={{ padding: 160 }}>Загрузка...</div>;
  if (error) return <div style={{ padding: 16 }}>❌ {error}</div>;
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/users/:id/note" element={<UserNotePage />} />
        <Route path="/create" element={<CreateEventPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
