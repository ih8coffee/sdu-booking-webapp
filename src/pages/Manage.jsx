import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useBookings } from "../bookings/BookingsContext.jsx";
import Status from "../components/Status.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Reveal from "../components/Reveal.jsx";
import { SkeletonList } from "../components/Skeleton.jsx";
import { fmtWhen } from "../format";

const STATUSES = ["pending", "confirmed", "rejected", "cancelled"];

export default function Manage() {
  const { all, loading, error, setStatus } = useBookings();
  const [filter, setFilter] = useState("pending");
  const [query, setQuery] = useState("");

  const counts = useMemo(
    () => Object.fromEntries(STATUSES.map((s) => [s, all.filter((b) => b.status === s).length])),
    [all]
  );

  const rows = useMemo(
    () =>
      all
        .filter((b) => (filter === "all" || b.status === filter) && b.roomName.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => a.start.localeCompare(b.start)),
    [all, filter, query]
  );

  return (
    <section>
      <h2>Manage bookings</h2>
      <p className="muted">
        All bookings from the backend plus reservations made in this app. Only reservations made in
        this app can be approved, rejected or cancelled, because the backend is read-only.
      </p>

      <div className="stats">
        {STATUSES.map((s, i) => (
          <Reveal
            as="button"
            key={s}
            index={i}
            className={filter === s ? "stat stat-btn on" : "stat stat-btn"}
            onClick={() => setFilter(s)}
          >
            <div className="stat-value">{counts[s]}</div>
            <div className="muted">{s}</div>
          </Reveal>
        ))}
      </div>

      <div className="filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input placeholder="Search by room" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <Status error={error} />
      {loading && <SkeletonList count={4} />}
      {!loading && rows.length === 0 && <p className="muted">No bookings match.</p>}
      {rows.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Room</th>
                <th>When</th>
                <th>Requested by</th>
                <th>Source</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b, i) => (
                <Reveal as="tr" variant="fade" key={b.id} index={i}>
                  <td>
                    <Link to={`/rooms/${b.roomId}`}>{b.roomName}</Link>
                  </td>
                  <td>{fmtWhen(b.start, b.end)}</td>
                  <td>{b.userLogin || <span className="muted">unknown</span>}</td>
                  <td>
                    <span className="muted">{b.source === "server" ? "Backend" : "This app"}</span>
                  </td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td>
                    {b.source === "local" && b.status === "pending" && (
                      <span className="slot-actions">
                        <button onClick={() => setStatus(b.id, "confirmed")}>Approve</button>
                        <button className="secondary" onClick={() => setStatus(b.id, "rejected")}>
                          Reject
                        </button>
                      </span>
                    )}
                    {b.source === "local" && b.status === "confirmed" && (
                      <button className="secondary" onClick={() => setStatus(b.id, "cancelled")}>
                        Cancel
                      </button>
                    )}
                    {b.source === "server" && <span className="muted small">read-only</span>}
                  </td>
                </Reveal>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
