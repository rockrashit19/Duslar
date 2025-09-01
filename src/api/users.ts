import { api } from "../lib/api";
import type { UserMe, EventCardOut } from "../types";

export const getMe = () => api.get<UserMe>("/me");

export const updateMe = (payload: {
  city?: string | null;
  gender?: "male" | "female" | "unknown";
}) => api.put<UserMe>("/users/me", payload);

export const getMyEvents = (params?: {
  status?: "past" | "future" | "all";
  limit?: number;
  offset?: number;
}) => api.get<EventCardOut[]>("/users/me/events", { params });
