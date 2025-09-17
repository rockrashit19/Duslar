import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

type Kind = "success" | "error" | "info";
type Toast = { id: number; kind: Kind; text: string };
type Ctx = { show: (text: string, kind?: Kind) => void };

const ToastCtx = createContext<Ctx>({ show: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timerRef = useRef<number | null>(null);

  const show = useCallback((text: string, kind: Kind = "info") => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const id = Date.now();
    setToast({ id, kind, text });

    timerRef.current = window.setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, 2500);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="toast">
        {toast && (
          <div
            key={toast.id}
            style={{
              pointerEvents: "auto",
              maxWidth: 500,
              minWidth: 200,
              padding: "10px 12px",
              borderRadius: 10,
              background:
                toast.kind === "error"
                  ? "#ffecec"
                  : toast.kind === "success"
                  ? "#e8fff0"
                  : "#f5f5f5",
              border:
                "1px solid " +
                (toast.kind === "error"
                  ? "#ffc0c0"
                  : toast.kind === "success"
                  ? "#bde5c8"
                  : "#e0e0e0"),
              boxShadow: "0 4px 12px rgba(0,0,0,.06)",
              wordWrap: "break-word",
              overflowWrap: "break-word",
              whiteSpace: "pre-wrap",
              textAlign: "center",
            }}
          >
            {toast.text}
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}
