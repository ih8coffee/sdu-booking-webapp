import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import useTheme from "../theme";

export default function Navbar() {
  const { user, isStaff, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          SDU Booking
        </Link>
        {user && (
          <nav>
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/rooms">Rooms</NavLink>
            <NavLink to="/my-bookings">My bookings</NavLink>
            {isStaff && <NavLink to="/manage">Manage</NavLink>}
          </nav>
        )}
        <div className="user-box">
          {user && (
            <>
              <span>{user.name}</span>
              <span className="badge role">{user.role}</span>
              <button className="secondary" onClick={handleLogout}>
                Log out
              </button>
            </>
          )}
          <button
            className="secondary theme-toggle"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
        </div>
      </div>
    </header>
  );
}
