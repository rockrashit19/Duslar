import { NavLink } from "react-router-dom";
import addIcon from "../assets/add.svg";
import mosqueIcon from "../assets/mosque.svg";
import peopleIcon from "../assets/people.svg";
import personIcon from "../assets/person.svg";

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
