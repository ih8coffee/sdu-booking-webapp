import { getRooms } from "../api";
import useFetch from "../useFetch";
import RoomCard from "../components/RoomCard.jsx";
import Status from "../components/Status.jsx";
import { SkeletonCards } from "../components/Skeleton.jsx";

export default function Rooms() {
  const { data: rooms, loading, error } = useFetch(getRooms);

  return (
    <section>
      <h2>Rooms</h2>
      <Status error={error} />
      {loading && <SkeletonCards count={6} />}
      {rooms && (
        <div className="grid">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </section>
  );
}
