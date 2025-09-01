import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { getInitData } from "./telegram";

let token: string | null = sessionStorage.getItem("token");
export const setToken = (t: string | null) => {
  token = t;
  if (t) sessionStorage.setItem("token", t);
  else sessionStorage.removeItem("token");
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: false,
});

let refreshing = false;
let waiters: Array<(t: string | null) => void> = [];

async function reauth(): Promise<string | null> {
  if (refreshing) {
    return new Promise((r) => waiters.push(r));
  }
  refreshing = true;
  try {
    const { data } = await api.post("/auth/telegram/init", {
      init_data: getInitData(),
    });
    setToken(data.token);
    waiters.forEach((w) => w(data.token));
    return data.token as string;
  } catch {
    setToken(null);
    waiters.forEach((w) => w(null));
    return null;
  } finally {
    refreshing = false;
    waiters = [];
  }
}

api.interceptors.request.use((cfg) => {
  if (token) {
    cfg.headers = cfg.headers || {};
    (cfg.headers as any).Authorization = `Bearer ${token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const cfg = error.config as AxiosRequestConfig & { _retried?: boolean };
    const status = error.response?.status;

    if (status === 401 && !cfg._retried) {
      cfg._retried = true;
      const t = await reauth();
      if (t) {
        cfg.headers = cfg.headers || {};
        (cfg.headers as any).Authorization = `Bearer ${t}`;
        return api.request(cfg);
      }
    }
    throw error;
  }
);
