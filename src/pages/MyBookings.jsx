import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { isActive, useBookings } from "../bookings/BookingsContext.jsx";
import Status from "../components/Status.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Reveal from "../components/Reveal.jsx";
import { SkeletonList } from "../components/Skeleton.jsx";
import { fmtWhen } from "../format";

export default function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { all, loading, error, setStatus } = useBookings();

  const mine = useMemo(
    () =>
      all
        .filter((b) => b.source === "local" && b.userLogin === user.login)
        .sort((a, b) => a.start.localeCompare(b.start)),
    [all, user.login]
  );

  return (
    <section>
      <h2>My bookings</h2>
      <Status error={error} />
      {loading && <SkeletonList count={3} />}
      {!loading && mine.length === 0 && <p className="muted">You have no reservations yet.</p>}
      {mine.length > 0 && (
        <ul className="list">
          {mine.map((b, i) => (
            <Reveal as="li" key={b.id} className="list-item" index={i}>
              <span>
                <Link to={`/rooms/${b.roomId}`}>{b.roomName}</Link>
                <br />
                <span className="muted">{fmtWhen(b.start, b.end)}</span>
              </span>
              <span className="slot-actions">
                <StatusBadge status={b.status} />
                {isActive(b) && (
                  <button className="secondary" onClick={() => setStatus(b.id, "cancelled")}>
                    Cancel
                  </button>
                )}
              </span>
            </Reveal>
          ))}
        </ul>
      )}
      <p className="muted small">
        Reservations are saved in this browser. The backend cannot store them yet.
      </p>
      <div className="button-row">
        <button onClick={() => navigate("/rooms")}>Browse rooms</button>
      </div>
    </section>
  );
}
