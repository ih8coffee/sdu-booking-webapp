import { NavLink, Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          SDU Booking
        </Link>
        <nav>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/rooms">Rooms</NavLink>
          <NavLink to="/bookings">My bookings</NavLink>
        </nav>
      </div>
    </header>
  );
}
