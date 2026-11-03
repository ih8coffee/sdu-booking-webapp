import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import useCampusData from "../hooks/useCampusData";
import { setReservationStatus, useReservations } from "../services/reservations";
import { buildTakenMap, roomAvailability } from "../services/availability";
import Badge, { StatusBadge } from "../components/Badge.jsx";
import Status from "../components/Status.jsx";
import Reveal from "../components/Reveal.jsx";
import { SkeletonList, SkeletonStats } from "../components/Skeleton.jsx";
import { fmtDate, fmtDateTime, fmtRange } from "../utils/format";

export default function Staff() {
  const { data, loading, error, reload } = useCampusData();
  const local = useReservations();
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Backend bookings + reservations made in this app, in one list.
  const rows = useMemo(() => {
    if (!data) return [];
    const fromBackend = data.bookings.map((b) => ({ ...b, source: "backend", userLogin: null }));
    return [...fromBackend, ...local].sort((a, b) => a.start.localeCompare(b.start));
  }, [data, local]);

  const availability = useMemo(
    () =>
      data ? roomAvailability(data.rooms, data.slotsByRoom, buildTakenMap(data.bookings, local)) : [],
    [data, local]
  );

  const pending = local
    .filter((r) => r.status === "pending")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const count = (status) => rows.filter((r) => r.status === status).length;
  const visible = rows.filter(
    (r) =>
      (statusFilter === "all" || r.status === statusFilter) &&
      (sourceFilter === "all" || r.source === sourceFilter)
  );

  return (
    <section>
      <h2>Staff dashboard</h2>
      <Status error={error} onRetry={reload} />

      {loading && (
        <>
          <SkeletonStats count={4} />
          <SkeletonList count={3} />
        </>
      )}

      {data && (
        <>
          <div className="stats">
            <Reveal className="stat" index={0}>
              <span className="stat-value">{count("pending")}</span>
              <span className="muted">Pending</span>
            </Reveal>
            <Reveal className="stat" index={1}>
              <span className="stat-value">{count("confirmed")}</span>
              <span className="muted">Confirmed</span>
            </Reveal>
            <Reveal className="stat" index={2}>
              <span className="stat-value">{count("rejected") + count("cancelled")}</span>
              <span className="muted">Rejected / cancelled</span>
            </Reveal>
            <Reveal className="stat" index={3}>
              <span className="stat-value">{availability.reduce((n, a) => n + a.free, 0)}</span>
              <span className="muted">Free slots left</span>
            </Reveal>
          </div>

          <h3>Requests awaiting approval</h3>
          {pending.length === 0 ? (
            <p className="muted">Nothing to approve right now.</p>
          ) : (
            <ul className="list">
              {pending.map((r, i) => (
                <Reveal as="li" key={r.id} className="list-item" index={i}>
                  <span>
                    <strong>{r.roomName}</strong> · {fmtDate(r.start)}, {fmtRange(r.start, r.end)}
                    <br />
                    <span className="muted small-text">
                      {r.userName} ({r.userLogin}) · requested {fmtDateTime(r.createdAt)}
                    </span>
                  </span>
                  <span className="row-actions">
                    <button className="small" onClick={() => setReservationStatus(r.id, "confirmed")}>
                      Approve
                    </button>
                    <button className="secondary small" onClick={() => setReservationStatus(r.id, "rejected")}>
                      Reject
                    </button>
                  </span>
                </Reveal>
              ))}
            </ul>
          )}

          <h3>All bookings</h3>
          <div className="filters">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} aria-label="Source">
              <option value="all">Backend + this app</option>
              <option value="backend">Backend only</option>
              <option value="local">This app only</option>
            </select>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>When</th>
                  <th>Status</th>
                  <th>Booked by</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="muted">
                      No bookings match.
                    </td>
                  </tr>
                )}
                {visible.map((r, i) => (
                  <Reveal as="tr" variant="fade" key={`${r.source}-${r.id}`} index={i}>
                    <td>
                      <Link to={`/rooms/${r.roomId}`}>{r.roomName}</Link>
                    </td>
                    <td>
                      {fmtDate(r.start)}, {fmtRange(r.start, r.end)}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>{r.userLogin || <span className="muted">not provided</span>}</td>
                    <td>
                      <Badge kind={r.source === "backend" ? "muted" : "ok"}>
                        {r.source === "backend" ? "Backend (read-only)" : "This app"}
                      </Badge>
                    </td>
                  </Reveal>
                ))}
              </tbody>
            </table>
          </div>

          <h3>Room occupancy</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Building</th>
                  <th>Floor</th>
                  <th>Seats</th>
                  <th>Free slots</th>
                </tr>
              </thead>
              <tbody>
                {availability.map(({ room, free, total }, i) => (
                  <Reveal as="tr" variant="fade" key={room.id} index={i}>
                    <td>
                      <Link to={`/rooms/${room.id}`}>{room.name}</Link>
                    </td>
                    <td>{room.building}</td>
                    <td>{room.floor}</td>
                    <td>{room.capacity}</td>
                    <td>
                      <Badge kind={free > 0 ? "ok" : "no"}>
                        {free}/{total}
                      </Badge>
                    </td>
                  </Reveal>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
