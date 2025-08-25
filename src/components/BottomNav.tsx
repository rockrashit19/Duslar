import { NavLink } from "react-router-dom";

const itemStyle: React.CSSProperties = {
  flex: 1,
  textAlign: "center",
  padding: "10px 6px",
  minHeight: 44,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 4,
  fontSize: 12,
};

export default function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        inset: "auto 0 0 0",
        height: "calc(var(--nav-h) + env(safe-area-inset-bottom, 0px))",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        borderTop: "1px solid rgba(0,0,0,.08)",
        background: "var(--tg-bg, #fff)",
        display: "flex",
        zIndex: 1000,
        width: "100%",
      }}
    >
      <Tab to="/" label="События" />
      <Tab to="/create" label="Создать" />
      <Tab to="/history" label="История" />
    </nav>
  );
}

function Tab({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...itemStyle,
        color: isActive ? "var(---tg-link, #2ea44f)" : "inherit",
        fontWeight: isActive ? 600 : 500,
        textDecoration: "none",
      })}
      end={to === "/"}
    >
      <span aria-hidden="true" style={{ lineHeight: 1.1 }}>
        {to === "/" ? "🗓️" : to === "/create" ? "➕" : "👥"}
      </span>
      <span>{label}</span>
    </NavLink>
  );
}
