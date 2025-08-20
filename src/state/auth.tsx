import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setToken } from "../lib/api";
import { getInitData } from "../lib/telegram";

type AuthCtx = { ready: boolean; error: string | null };
const Ctx = createContext<AuthCtx>({ ready: false, error: null });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post("/auth/telegram/init", {
          init_data: getInitData(),
        });
        setToken(data.token);
      } catch (e: any) {
        setError(e?.response?.data?.detail || "Ошибка аутентификации");
      } finally {
        setReady(true);
      }
    })();
  }, []);
  return <Ctx.Provider value={{ ready, error }}>{children}</Ctx.Provider>;
}
