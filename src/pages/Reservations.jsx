import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { cancelReservation, useReservations } from "../services/reservations";
import { isActive } from "../services/availability";
import { StatusBadge } from "../components/Badge.jsx";
import Reveal from "../components/Reveal.jsx";
import { fmtDate, fmtDateTime, fmtRange } from "../utils/format";

export default function Reservations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const all = useReservations();

  const mine = all
    .filter((r) => r.userLogin === user.login)
    .sort((a, b) => b.start.localeCompare(a.start));
  const now = new Date();

  return (
    <section>
      <h2>My reservations</h2>

      {mine.length === 0 ? (
        <div className="empty">
          <p>You have no reservations yet.</p>
          <button onClick={() => navigate("/rooms")}>Browse rooms</button>
        </div>
      ) : (
        <ul className="list">
          {mine.map((r, i) => {
            const cancellable = isActive(r) && new Date(r.start) > now;
            return (
              <Reveal as="li" key={r.id} className="list-item" index={i}>
                <span>
                  <Link to={`/rooms/${r.roomId}`}>
                    <strong>{r.roomName}</strong>
                  </Link>
                  <br />
                  <span className="muted">
                    {fmtDate(r.start)} · {fmtRange(r.start, r.end)}
                  </span>
                  <br />
                  <span className="muted small-text">Requested {fmtDateTime(r.createdAt)}</span>
                </span>
                <span className="row-actions">
                  <StatusBadge status={r.status} />
                  {cancellable && (
                    <button className="secondary small" onClick={() => cancelReservation(r.id)}>
                      Cancel
                    </button>
                  )}
                </span>
              </Reveal>
            );
          })}
        </ul>
      )}
    </section>
  );
}
