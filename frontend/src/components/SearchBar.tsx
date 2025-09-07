import { useEffect, useState } from "react";
import searchIcon from "../assets/search.png";

export default function SearchBar({
  initial = "",
  onSearch,
  delay = 300,
}: {
  initial?: string;
  onSearch: (q: string) => void;
  delay?: number;
}) {
  const [q, setQ] = useState(initial);

  useEffect(() => {
    setQ(initial || "");
  }, [initial]);

  useEffect(() => {
    const id = setTimeout(() => onSearch(q.trim()), delay);
    return () => clearTimeout(id);
  }, [q, delay, onSearch]);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSearch(q.trim());
  };

  return (
    <form onSubmit={submit} className="search__form">
      <div className="field--icon">
        <input
          className="input search-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Найти мероприятие"
        />
        <img className="icon" src={searchIcon} alt="" />
      </div>
    </form>
  );
}
