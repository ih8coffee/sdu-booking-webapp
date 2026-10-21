import { Link, useNavigate } from "react-router-dom";
import { getBookings } from "../api";
import useFetch from "../useFetch";
import Status from "../components/Status.jsx";
import { SkeletonList } from "../components/Skeleton.jsx";

const fmt = (iso) =>
  new Date(iso).toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function Bookings() {
  const navigate = useNavigate();
  const { data: bookings, loading, error } = useFetch(getBookings);

  return (
    <section>
      <h2>My bookings</h2>
      <Status error={error} />
      {loading && <SkeletonList count={3} />}
      {bookings && bookings.length === 0 && <p className="muted">No bookings yet.</p>}
      {bookings && bookings.length > 0 && (
        <ul className="list">
          {bookings.map((b) => (
            <li key={b.id} className="list-item">
              <span>
                <Link to={`/rooms/${b.roomId}`}>{b.roomName}</Link>
                <br />
                <span className="muted">
                  {fmt(b.start)} – {new Date(b.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </span>
              <span className={b.status === "confirmed" ? "badge ok" : "badge warn"}>{b.status}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="button-row">
        <button onClick={() => navigate("/rooms")}>Browse rooms</button>
      </div>
    </section>
  );
}
