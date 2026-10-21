import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <h1>Book a room at SDU</h1>
      <p className="muted">
        Browse lecture halls, classrooms and study spaces, and check when they are free.
      </p>
      <div className="button-row">
        <button onClick={() => navigate("/rooms")}>Browse rooms</button>
        <button className="secondary" onClick={() => navigate("/bookings")}>
          My bookings
        </button>
      </div>
    </section>
  );
}
