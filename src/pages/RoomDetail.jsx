import { useNavigate, useParams } from "react-router-dom";
import { getRoom, getRoomSlots } from "../api";
import useFetch from "../useFetch";
import Status from "../components/Status.jsx";
import { SkeletonHeader, SkeletonList } from "../components/Skeleton.jsx";

const fmt = (iso) =>
  new Date(iso).toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const room = useFetch(() => getRoom(id), [id]);
  const slots = useFetch(() => getRoomSlots(id), [id]);

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
          <p>{room.data.description}</p>
          <p>
            <strong>Equipment:</strong> {room.data.equipment?.join(", ") || "None"}
          </p>
        </>
      )}

      <h3>Availability</h3>
      <Status error={slots.error} />
      {slots.loading && <SkeletonList count={4} />}
      {slots.data && (
        <ul className="list">
          {slots.data.map((slot) => (
            <li key={slot.id} className="list-item">
              <span>
                {fmt(slot.start)} – {new Date(slot.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className={slot.available ? "badge ok" : "badge no"}>
                {slot.available ? "Available" : "Booked"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="button-row">
        <button onClick={() => navigate("/bookings")}>Go to my bookings</button>
      </div>
    </section>
  );
}
