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
    // Сбиваем предыдущий таймер, если был
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Показать новый тост (перезапишет прошлый)
    const id = Date.now();
    setToast({ id, kind, text });

    // Спрятать через 2.5s
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
          <div key={toast.id} className={`toast-message toast--${toast.kind}`}>
            {toast.text}
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}
