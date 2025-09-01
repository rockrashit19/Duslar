import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setToken } from "../lib/api";
import { getInitData } from "../lib/telegram";
import { useToast } from "./toast";

export type Me = {
  id: number;
  username: string | null;
  full_name: string;
  city: string | null;
  role: string;
  gender: "male" | "female" | "unknown";
  avatar_url?: string | null;
};

type AuthCtx = {
  ready: boolean;
  error: string | null;
  me: Me | null;
  refreshMe: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  ready: false,
  error: null,
  me: null,
  refreshMe: async () => {},
});

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const { show } = useToast();

  const refreshMe = async () => {
    try {
      const { data } = await api.get<Me>("/me");
      setMe(data);
    } catch (e: any) {
      setMe(null);
      throw e;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        if (!sessionStorage.getItem("token")) {
          const { data } = await api.post("/auth/telegram/init", {
            init_data: getInitData(),
          });
          setToken(data.token);
        }
        await refreshMe();
      } catch (e: any) {
        const msg = e?.response?.data?.detail || "Ошибка аутентификации";
        setError(msg);
        show(msg, "error");
      } finally {
        setReady(true);
      }
    })();
  }, [show]);

  return (
    <Ctx.Provider value={{ ready, error, me, refreshMe }}>
      {children}
    </Ctx.Provider>
  );
}
