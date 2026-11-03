import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getRooms } from "../api";
import useFetch from "../useFetch";
import { useAuth } from "../auth/AuthContext.jsx";
import { isActive, useBookings } from "../bookings/BookingsContext.jsx";
import RoomCard from "../components/RoomCard.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Status from "../components/Status.jsx";
import Reveal from "../components/Reveal.jsx";
import { SkeletonCards, SkeletonStats } from "../components/Skeleton.jsx";
import { fmtWhen } from "../format";

export default function Home() {
  const navigate = useNavigate();
  const { user, isStaff } = useAuth();
  const rooms = useFetch(getRooms);
  const { all } = useBookings();

  const mine = useMemo(
    () => all.filter((b) => b.source === "local" && b.userLogin === user.login),
    [all, user.login]
  );

  const stats = useMemo(() => {
    if (!rooms.data) return null;
    const list = [
      { label: "Bookable rooms", value: rooms.data.length },
      { label: "Buildings", value: new Set(rooms.data.map((r) => r.building)).size },
      { label: "Total seats", value: rooms.data.reduce((sum, r) => sum + r.capacity, 0) },
    ];
    if (isStaff) {
      list.push({ label: "Pending requests", value: all.filter((b) => b.status === "pending").length });
    } else {
      list.push({ label: "My active reservations", value: mine.filter(isActive).length });
    }
    return list;
  }, [rooms.data, all, mine, isStaff]);

  const upcoming = useMemo(() => {
    const source = isStaff ? all : mine;
    return source
      .filter(isActive)
      .sort((a, b) => a.start.localeCompare(b.start))
      .slice(0, 5);
  }, [all, mine, isStaff]);

  const largest = useMemo(
    () => (rooms.data ? [...rooms.data].sort((a, b) => b.capacity - a.capacity).slice(0, 3) : []),
    [rooms.data]
  );

  return (
    <section>
      <h1>Welcome, {user.name}</h1>
      <p className="muted">
        {isStaff
          ? "Review reservation requests and book rooms directly."
          : "Find a room and request a time slot. Staff will confirm your request."}
      </p>

      <div className="button-row">
        <button onClick={() => navigate("/rooms")}>Browse rooms</button>
        <button className="secondary" onClick={() => navigate("/my-bookings")}>
          My bookings
        </button>
        {isStaff && (
          <button className="secondary" onClick={() => navigate("/manage")}>
            Manage requests
          </button>
        )}
      </div>

      <Status error={rooms.error} />
      {stats ? (
        <div className="stats">
          {stats.map((s, i) => (
            <Reveal key={s.label} className="stat" index={i}>
              <div className="stat-value">{s.value}</div>
              <div className="muted">{s.label}</div>
            </Reveal>
          ))}
        </div>
      ) : (
        <SkeletonStats count={4} />
      )}

      <h2>{isStaff ? "Upcoming reservations" : "My upcoming reservations"}</h2>
      {upcoming.length === 0 ? (
        <p className="muted">Nothing booked yet.</p>
      ) : (
        <ul className="list">
          {upcoming.map((b, i) => (
            <Reveal as="li" key={b.id} className="list-item" index={i}>
              <span>
                <Link to={`/rooms/${b.roomId}`}>{b.roomName}</Link>
                <br />
                <span className="muted">{fmtWhen(b.start, b.end)}</span>
              </span>
              <StatusBadge status={b.status} />
            </Reveal>
          ))}
        </ul>
      )}

      <h2>Largest rooms</h2>
      {rooms.loading && <SkeletonCards count={3} />}
      {rooms.data && (
        <div className="grid">
          {largest.map((room, i) => (
            <RoomCard key={room.id} room={room} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
