export function fmtDt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString();
}
export function toISOZ(d?: Date | null) {
  if (!d) return undefined;
  const s = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return s.toISOString().replace(/\.\d{3}Z$/, "Z");
}
export function genderLabel(g: "male" | "female" | "all") {
  return g === "male" ? "м" : g === "female" ? "ж" : "все";
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
