export function fmtDt(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}
export function toISOZ(d?: Date | null) {
  if (!d) return undefined;
  const s = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return s.toISOString().replace(/\.\d{3}Z$/, "Z");
}
export function genderLabel(g: "male" | "female" | "all") {
  return g === "male" ? "мужчины" : g === "female" ? "девушки" : "все";
}
export function statusLabel(e: {
  status: "open" | "closed" | "past";
  participants_count: number;
  max_participants: number | null;
}) {
  if (e.status !== "open") return "уже прошло";
  if (
    e.max_participants != null &&
    e.participants_count >= e.max_participants
  ) {
    return "мест нет";
  }
  return "запись";
}

export function dateStartZ(dateYYYYMMDD: string) {
  // "2025-08-25" -> "2025-08-25T00:00:00Z"
  return `${dateYYYYMMDD}T00:00:00Z`;
}
export function dateEndZ(dateYYYYMMDD: string) {
  // "2025-08-25" -> "2025-08-25T23:59:59Z"
  return `${dateYYYYMMDD}T23:59:59Z`;
}

// Склеиваем локальные date + time в UTC-строку ISO8601 (с Z)
export function combineDateTimeZ(date: string, time: string): string {
  if (!date || !time) throw new Error("date/time required");
  // date: "YYYY-MM-DD", time: "HH:MM"
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  // Создаём дату в ЛОКАЛЬНОЙ зоне пользователя:
  const local = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
  // toISOString() вернёт UTC с Z:
  return local.toISOString();
}
