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
export function genderLabel(g: "male" | "female" | "all") {
  return g === "male" ? "мужчины" : g === "female" ? "девушки" : "все";
}
export function statusLabel(e: {
  status: "open" | "closed" | "past";
  participants_count: number;
  max_participants: number | null;
}) {
  if (e.status == "past") return "прошло";
  if (
    e.max_participants != null &&
    e.participants_count >= e.max_participants
  ) {
    return "мест нет";
  }
  return "запись";
}

export function dateStartZ(dateYYYYMMDD: string) {
  return `${dateYYYYMMDD}T00:00:00Z`;
}
export function dateEndZ(dateYYYYMMDD: string) {
  return `${dateYYYYMMDD}T23:59:59Z`;
}

export const clip17 = (s?: string) =>
  !s ? "" : s.length > 17 ? s.slice(0, 17) + "..." : s;

export function parseLocalDate(yyyy_mm_dd: string) {
  const [y, m, d] = yyyy_mm_dd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toInputDateValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function buildLocalDateTime(dateStr: string, timeStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}
