export type UserMe = {
  id: number;
  username?: string | null;
  full_name: string;
  city?: string | null;
  role: string;
  gender: "male" | "female" | "unknown";
  avatar_url?: string | null;
  events_total: number;
};

export type EventCardOut = {
  id: number;
  title: string;
  location: string;
  city: string;
  date_time: string;
  gender_restriction: "male" | "female" | "all";
  creator_id: number | null;
  participants_count: number;
  is_user_joined: boolean;
  photo_url?: string | null;
  status: "open" | "closed" | "past";
  max_participants: number | null;
};
