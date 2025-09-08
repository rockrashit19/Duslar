// src/pages/EventPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { fmtDt, genderLabel, statusLabel } from "../lib/format";
import { useToast } from "../state/toast";
import { useAuth } from "../state/auth";
import JoinButton from "../components/JoinButton";
import VisibilityToggle from "../components/VisibilityToggle";

type EventOut = {
  id: number;
  title: string;
  description: string | null;
  location: string;
  city: string;
  date_time: string;
  gender_restriction: "male" | "female" | "all";
  max_participants: number | null;
  status: "open" | "closed" | "past";
  creator_id: number | null;
  participants_count: number;
  is_user_joined: boolean;
  photo_url?: string | null;
};

export default function EventPage() {
  const { id } = useParams();
  const { show } = useToast();
  const [data, setData] = useState<EventOut | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [myVisible, setMyVisible] = useState<boolean | null>(null);
  const [reloadParticipants, setReloadParticipants] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<EventOut>(`/events/${id}`);
        setData(data);
      } catch (e: any) {
        const msg = e?.response?.data?.detail || "Ошибка загрузки";
        setErr(msg);
        show(msg, "error");
      }
    })();
  }, [id, show]);

  useEffect(() => {
    (async () => {
      if (!data?.is_user_joined) {
        setMyVisible(null);
        return;
      }
      try {
        const me = await api.get<{ id: number }>("/me");
        const myId = me.data.id;
        const parts = await api.get<Array<{ id: number; is_visible: boolean }>>(
          `/events/${data.id}/participants`,
          { params: { limit: 200, offset: 0 } }
        );
        const mine = parts.data.find((p) => p.id === myId);
        setMyVisible(mine?.is_visible ?? true);
      } catch {
        setMyVisible(true);
      }
    })();
  }, [data?.id, data?.is_user_joined]);

  if (err)
    return (
      <div className="app" style={{ padding: 16 }}>
        ❌ {err}
      </div>
    );
  if (!data)
    return (
      <div className="app" style={{ padding: 16 }}>
        Загрузка…
      </div>
    );

  const label = statusLabel({
    status: data.status,
    participants_count: data.participants_count,
    max_participants: data.max_participants,
  });

  const seatsText =
    data.max_participants != null
      ? `${data.participants_count}/${data.max_participants}`
      : `${data.participants_count}`;

  const onChanged = (next: boolean) =>
    setData((d) =>
      d
        ? {
            ...d,
            is_user_joined: next,
            participants_count: Math.max(
              0,
              d.participants_count + (next ? 1 : -1)
            ),
          }
        : d
    );

  return (
    <div className="app">
      {data.photo_url ? (
        <div className="event-hero" style={{ marginTop: "2rem" }}>
          <img
            src={data.photo_url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : null}
      <div className="event-wrap">
        <section
          className="event-card"
          style={{
            minHeight: "calc(100dvh - 98px)",
            paddingBottom: 98,
            boxSizing: "border-box",
          }}
        >
          <div className="pills" style={{ marginTop: "7px" }}>
            {/* Плашка пола — центрируем содержимое */}
            <span
              className="pill"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {genderLabel(data.gender_restriction)}
            </span>
            <span
              className="pill"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {label}
            </span>
          </div>

          <div className="event-title">{data.title}</div>

          <div className="event-meta">{fmtDt(data.date_time)}</div>
          <div
            className="event-meta"
            style={{
              display: "flex",
              alignItems: "center",
              marginRight: 50,
              overflow: "hidden",
            }}
          >
            <span
              style={{
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {data.city} • {data.location}
            </span>
          </div>

          <p style={{ whiteSpace: "pre-wrap", marginTop: 12, marginBottom: 0 }}>
            {data.description || "Описание отсутствует"}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 16,
            }}
          >
            <div style={{ width: "fit-content" }}>
              <JoinButton
                eventId={data.id}
                joined={data.is_user_joined}
                onChanged={(next) => {
                  onChanged(next);
                  setReloadParticipants((x) => x + 1);
                  setMyVisible(next ? true : null);
                }}
              />
            </div>
            {data.is_user_joined && (
              <div style={{ width: "fit-content" }}>
                <VisibilityToggle
                  eventId={data.id}
                  initial={myVisible ?? true}
                  onChanged={(v: boolean) => setMyVisible(v)}
                />
              </div>
            )}
            <div
              className="meta"
              style={{
                marginLeft: "auto",
                whiteSpace: "nowrap",
                fontSize: 14,
                opacity: 0.85,
                marginTop: 1,
              }}
            >
              Мест: {seatsText}
            </div>
          </div>

          {/* Тоньше линия: 1px высотой */}
          <hr
            style={{
              height: 1,
              border: 0,
              background: "#07253F",
              margin: "12px 0 10px",
              opacity: 0.6,
            }}
          />

          <div className="participants">
            <Participants
              eventId={data.id}
              reloadKey={reloadParticipants}
              myVisible={myVisible}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- Участники ---------- */

function Participants({
  eventId,
  reloadKey,
  myVisible,
}: {
  eventId: number;
  reloadKey: number;
  myVisible: boolean | null;
}) {
  const [rows, setRows] = useState<Array<{
    id: number;
    username?: string | null;
    full_name: string;
    avatar_url?: string | null;
    is_visible: boolean;
  }> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const { show } = useToast();
  const nav = useNavigate();
  const { me } = useAuth();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/events/${eventId}/participants`, {
          params: { limit: 200, offset: 0 },
        });
        setRows(data);
      } catch (e: any) {
        const msg = e?.response?.data?.detail || "Ошибка загрузки участников";
        setErr(msg);
        show(msg, "error");
      }
    })();
  }, [eventId, reloadKey, show]);

  useEffect(() => {
    if (myVisible == null || !me) return;
    setRows((prev) =>
      prev
        ? prev.map((p) =>
            p.id === me.id ? { ...p, is_visible: myVisible } : p
          )
        : prev
    );
  }, [myVisible, me]);

  if (err) return <div>❌ {err}</div>;
  if (!rows) return <div>Загружаем участников…</div>;
  if (rows.length === 0)
    return (
      <div
        style={{
          opacity: 0.7,
          marginTop: 4,
          fontWeight: 400,
          fontSize: "0.8rem",
        }}
      >
        Вы можете стать первым участником!
      </div>
    );

  const openUser = (uid: number) => {
    if (me && uid === me.id) nav("/profile");
    else nav(`/users/${uid}`);
  };

  return (
    <div>
      {rows.map((u) => {
        const isMe = !!me && u.id === me.id;
        const meSuffix =
          isMe && u.is_visible === false ? " (вы скрыты)" : isMe ? " (вы)" : "";
        if (u.is_visible === false && !isMe) {
          return (
            <div
              key={u.id}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1fr",
                gap: "0.75rem",
                alignItems: "center",
                padding: 8,
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              <Avatar src={u.avatar_url} />
              <div>
                <div style={{ fontWeight: 400, fontSize: "0.75rem" }}>
                  {u.full_name} •{" "}
                  {u.username ? `@${u.username}` : "ник не указан"}
                  {meSuffix}
                </div>
              </div>
            </div>
          );
        }
        return (
          <div
            key={u.id}
            onClick={() => openUser(u.id)}
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr",
              gap: "0.75rem",
              alignItems: "center",
              padding: 8,
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            <Avatar src={u.avatar_url} />
            <div>
              <div style={{ fontWeight: 400, fontSize: "0.75rem" }}>
                {u.full_name} •{" "}
                {u.username ? `@${u.username}` : "ник не указан"}
                {meSuffix}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Avatar({ src, size = 32 }: { src?: string | null; size?: number }) {
  const [failed, setFailed] = useState(!src);
  useEffect(() => {
    setFailed(!src);
  }, [src]);
  if (!src || failed) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          overflow: "hidden",
          background: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          opacity: 0.6,
          border: "1px solid #99B9A4",
        }}
      >
        ?
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      style={{ objectFit: "cover", borderRadius: "50%" }}
      onError={() => setFailed(true)}
    />
  );
}
