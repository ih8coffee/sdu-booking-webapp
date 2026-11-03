import { useNavigate } from "react-router-dom";
import Reveal from "./Reveal.jsx";

export default function RoomCard({ room, index = 0 }) {
  const navigate = useNavigate();

  return (
    <Reveal as="article" className="card" index={index}>
      <h3>{room.name}</h3>
      <p className="muted">
        {room.building} · Floor {room.floor}
      </p>
      <p>Capacity: {room.capacity}</p>
      {room.equipment?.length > 0 && (
        <div className="chips">
          {room.equipment.map((item) => (
            <span key={item} className="chip">
              {item}
            </span>
          ))}
        </div>
      )}
      <button onClick={() => navigate(`/rooms/${room.id}`)}>View &amp; book</button>
    </Reveal>
  );
}
