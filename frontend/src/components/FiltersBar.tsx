import { useEffect, useState } from "react";
import { dateStartZ, dateEndZ } from "../lib/format";
import { normalizeCyrillic } from "../lib/validate";

type Props = {
  initial: {
    city?: string;
    from?: string;
    to?: string;
    gender?: "male" | "female" | "all";
    q?: string;
  };
  onApply: (p: {
    city?: string;
    from?: string;
    to?: string;
    gender?: "male" | "female" | "all";
    q?: string;
  }) => void;
  onReset?: () => void;
};

export default function FiltersBar({ initial, onApply, onReset }: Props) {
  const [city, setCity] = useState(initial?.city || "");
  const [gender, setGender] = useState<"male" | "female" | "all">(
    initial?.gender ?? "all"
  );
  const [from, setFrom] = useState<string>(
    initial?.from ? initial.from.slice(0, 10) : ""
  );
  const [to, setTo] = useState<string>(
    initial?.to ? initial.to.slice(0, 10) : ""
  );

  useEffect(() => {
    setCity(initial?.city || "");
    setGender(initial?.gender ?? "all");
    setFrom(initial?.from ? initial.from.slice(0, 10) : "");
    setTo(initial?.to ? initial.to.slice(0, 10) : "");
  }, [initial]);

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
    if (onReset) onReset();
    else onApply({});
  };

  return (
    <details style={{ marginBottom: 12 }}>
      <summary style={{ cursor: "pointer", marginBottom: 8 }}>Фильтры</summary>
      <div className="filter">
        <div className="filters-container">
          <input
            placeholder="Город"
            inputMode="text"
            value={city}
            onChange={(e) => setCity(normalizeCyrillic(e.target.value))}
          />

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as any)}
          >
            <option value="all">все</option>
            <option value="male">мужчины</option>
            <option value="female">девушки</option>
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
      </div>
    </details>
  );
}
