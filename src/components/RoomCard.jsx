import { useNavigate } from "react-router-dom";

export default function RoomCard({ room }) {
  const navigate = useNavigate();

  return (
    <article className="card">
      <h3>{room.name}</h3>
      <p className="muted">
        {room.building} · Floor {room.floor}
      </p>
      <p>Capacity: {room.capacity}</p>
      <button onClick={() => navigate(`/rooms/${room.id}`)}>View details</button>
    </article>
  );
}
