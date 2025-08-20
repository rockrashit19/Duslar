import axios from "axios";
let token: string | null = null;
export const setToken = (t: string) => {
  token = t;
};
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE });
api.interceptors.request.use((cfg) => {
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
