import React, { createContext, useCallback, useContext, useState } from "react";

type Kind = "success" | "error" | "info";
type Toast = { id: number; kind: Kind; text: string };
type Ctx = { show: (text: string, kind?: Kind) => void };

const ToastCtx = createContext<Ctx>({ show: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const show = useCallback((text: string, kind: Kind = "info") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, text }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  }, []);
  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 12,
          left: 0,
          right: 0,
          display: "grid",
          gap: 8,
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        {items.map((t) => (
          <div
            key={t.id}
            style={{
              pointerEvents: "auto",
              maxWidth: "380",
              padding: "10px 12px",
              borderRadius: 10,
              background:
                t.kind === "error"
                  ? "#ffecec"
                  : t.kind === "success"
                  ? "#e8fff0"
                  : "#f5f5f5",
              border:
                "1px solid " +
                (t.kind === "error"
                  ? "ffc0c0"
                  : t.kind === "success"
                  ? "#bde5c8"
                  : "#e0e0e0"),
              boxShadow: "0 4px 12px rgba(0,0,0,.06)",
            }}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
