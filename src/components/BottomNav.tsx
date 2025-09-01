// BottomNav.tsx
import { NavLink } from "react-router-dom";
import addIcon from "../assets/add.png";
import mosqueIcon from "../assets/mosque.png";
import peopleIcon from "../assets/people.png";
import personIcon from "../assets/person.png";

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <Tab to="/" icon={mosqueIcon} />
      <Tab to="/create" icon={addIcon} />
      <Tab to="/history" icon={peopleIcon} />
      <Tab to="/profile" icon={personIcon} />
    </nav>
  );
}

function Tab({ to, icon }: { to: string; icon: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        "bottom-nav__link" + (isActive ? " active" : "")
      }
      end={to === "/"}
    >
      <img className="bottom-nav__icon" src={icon} alt="" />
    </NavLink>
  );
}
