import { useState } from "react";
import { dateStartZ, dateEndZ } from "../lib/format";

type Props = {
  initial: {
    city?: string;
    from?: string;
    to?: string;
    gender?: "male" | "female" | "all";
  };
  onApply: (p: {
    city?: string;
    from?: string;
    to?: string;
    gender?: "male" | "female" | "all";
  }) => void;
};

export default function FiltersBar({ initial, onApply }: Props) {
  const [city, setCity] = useState(initial?.city || "");
  const [gender, setGender] = useState<"male" | "female" | "all">(
    initial?.gender ?? "all"
  );

  const [from, setFrom] = useState<string>(
    initial?.from ? initial!.from.slice(0, 10) : ""
  );
  const [to, setTo] = useState<string>(
    initial?.to ? initial!.to.slice(0, 10) : ""
  );

  const apply = () => {
    onApply({
      city: city.trim() || undefined,
      gender,
      from: from ? dateStartZ(from) : undefined,
      to: to ? dateEndZ(to) : undefined,
    });
  };

  const reset = () => {
    setCity("");
    setGender("all");
    setFrom("");
    setTo("");
    onApply({});
  };

  return (
    <details style={{ marginBottom: 12 }}>
      <summary style={{ cursor: "pointer", marginBottom: 8 }}>Фильтры</summary>

      <div style={{ display: "grid", gap: 8 }}>
        <input
          placeholder="Город"
          inputMode="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as any)}
        >
          <option value="all">Все</option>
          <option value="male">М</option>
          <option value="female">Ж</option>
        </select>

        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Дата от</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>

        <label style={{ display: "grid", gap: 4 }}>
          <span style={{ fontSize: 12, opacity: 0.7 }}>Дата до</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={apply}>Применить</button>
          <button onClick={reset}>Сброс</button>
        </div>
      </div>
    </details>
  );
}
