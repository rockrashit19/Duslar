import { useState } from "react";

type Props = {
  initial: {
    city?: string;
    from?: string;
    to?: string;
    gender?: "male" | "female" | "all";
  };
  onApply: (v: {
    city?: string;
    from?: string;
    to?: string;
    gender?: "male" | "female" | "all";
  }) => void;
};

function normCity(s?: string) {
  return s ? s.trim().replace(/\s+/g, " ") : undefined;
}

export default function FiltersBar({ initial, onApply }: Props) {
  const [city, setCity] = useState(initial?.city || "");
  const [from, setFrom] = useState(
    initial?.from ? initial!.from.slice(0, 16) : ""
  );
  const [to, setTo] = useState(initial?.to ? initial!.to.slice(0, 16) : "");
  const [gender, setGender] = useState(initial?.gender || "all");

  return (
    <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 8,
        }}
      >
        <input
          placeholder="Город"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          type="datetime-local"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          type="datetime-local"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as any)}
        >
          <option value="all">Все</option>
          <option value="male">М</option>
          <option value="female">Ж</option>
        </select>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() =>
            onApply({
              city: normCity(city),
              from: from ? new Date(from).toISOString() : undefined,
              to: to ? new Date(to).toISOString() : undefined,
              gender,
            })
          }
        >
          Применить
        </button>
        <button
          onClick={() => {
            setCity("");
            setFrom("");
            setTo("");
            setGender("all");
            onApply({});
          }}
        >
          Сброс
        </button>
      </div>
    </div>
  );
}
