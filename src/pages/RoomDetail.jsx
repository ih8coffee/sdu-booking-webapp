import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRoom, getRoomSlots } from "../api";
import useFetch from "../useFetch";
import { useAuth } from "../auth/AuthContext.jsx";
import { useBookings } from "../bookings/BookingsContext.jsx";
import Status from "../components/Status.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Reveal from "../components/Reveal.jsx";
import { SkeletonHeader, SkeletonList } from "../components/Skeleton.jsx";
import { dayKey, fmtDate, fmtTime } from "../format";

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isStaff } = useAuth();
  const { findActive, reserve, setStatus } = useBookings();
  const room = useFetch(() => getRoom(id), [id]);
  const slots = useFetch(() => getRoomSlots(id), [id]);
  const [notice, setNotice] = useState(null);

  // group slots by day
  const days = useMemo(() => {
    const groups = new Map();
    [...(slots.data || [])]
      .sort((a, b) => a.start.localeCompare(b.start))
      .forEach((s) => {
        const key = dayKey(s.start);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(s);
      });
    return [...groups.entries()];
  }, [slots.data]);

  const handleReserve = (slot) => {
    const result = reserve(room.data, slot, user);
    if (result.ok) {
      setNotice({
        type: "ok",
        text: isStaff
          ? `Booked ${room.data.name} at ${fmtTime(slot.start)}. It is confirmed.`
          : `Request sent for ${room.data.name} at ${fmtTime(slot.start)}. It is pending until staff confirm it.`,
      });
    } else {
      setNotice({ type: "error", text: result.error });
    }
  };

  const handleCancel = (booking) => {
    setStatus(booking.id, "cancelled");
    setNotice({ type: "ok", text: "Reservation cancelled." });
  };

  const renderSlot = (slot, index) => {
    const booking = findActive(room.data.id, slot.start, slot.end);
    const isMine = booking && booking.source === "local" && booking.userLogin === user.login;

    let state;
    let action = null;
    if (!slot.available) {
      state = <span className="badge muted">Unavailable</span>;
    } else if (isMine) {
      state = <StatusBadge status={booking.status} />;
      action = (
        <button className="secondary" onClick={() => handleCancel(booking)}>
          Cancel
        </button>
      );
    } else if (booking) {
      state = (
        <span
          className="badge no"
          title={isStaff && booking.userLogin ? `Reserved by ${booking.userLogin}` : undefined}
        >
          Booked
        </span>
      );
    } else {
      state = <span className="badge ok">Available</span>;
      action = <button onClick={() => handleReserve(slot)}>{isStaff ? "Book" : "Request"}</button>;
    }

    return (
      <Reveal as="li" key={slot.id} className="list-item" index={index}>
        <span>
          {fmtTime(slot.start)} – {fmtTime(slot.end)}
        </span>
        <span className="slot-actions">
          {state}
          {action}
        </span>
      </Reveal>
    );
  };

  return (
    <section>
      <button className="secondary" onClick={() => navigate("/rooms")}>
        ← Back to rooms
      </button>

      <Status error={room.error} />
      {room.loading && <SkeletonHeader />}
      {room.data && (
        <>
          <h2>{room.data.name}</h2>
          <p className="muted">
            {room.data.building} · Floor {room.data.floor} · Capacity {room.data.capacity}
          </p>
          {room.data.description && <p>{room.data.description}</p>}
          {room.data.equipment?.length > 0 && (
            <div className="chips">
              {room.data.equipment.map((item) => (
                <span key={item} className="chip">
                  {item}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      <h3>Availability</h3>
      {notice && <div className={notice.type === "ok" ? "notice ok" : "notice no"}>{notice.text}</div>}
      <Status error={slots.error} />
      {slots.loading && <SkeletonList count={4} />}
      {room.data && slots.data && days.length === 0 && <p className="muted">No time slots published.</p>}
      {room.data &&
        days.map(([day, daySlots]) => (
          <div key={day}>
            <h4>{fmtDate(daySlots[0].start)}</h4>
            <ul className="list">{daySlots.map(renderSlot)}</ul>
          </div>
        ))}

      <div className="button-row">
        <button onClick={() => navigate("/my-bookings")}>Go to my bookings</button>
      </div>
    </section>
  );
}
