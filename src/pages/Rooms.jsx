import { useMemo, useState } from "react";
import { getRooms } from "../api";
import useFetch from "../useFetch";
import RoomCard from "../components/RoomCard.jsx";
import Status from "../components/Status.jsx";
import { SkeletonCards } from "../components/Skeleton.jsx";

export default function Rooms() {
  const { data: rooms, loading, error } = useFetch(getRooms);
  const [query, setQuery] = useState("");
  const [building, setBuilding] = useState("");
  const [minCapacity, setMinCapacity] = useState(0);
  const [equipment, setEquipment] = useState([]);

  const buildings = useMemo(() => [...new Set((rooms || []).map((r) => r.building))].sort(), [rooms]);
  const allEquipment = useMemo(
    () => [...new Set((rooms || []).flatMap((r) => r.equipment || []))].sort(),
    [rooms]
  );

  const filtered = useMemo(
    () =>
      (rooms || []).filter(
        (r) =>
          r.name.toLowerCase().includes(query.trim().toLowerCase()) &&
          (!building || r.building === building) &&
          r.capacity >= minCapacity &&
          equipment.every((e) => (r.equipment || []).includes(e))
      ),
    [rooms, query, building, minCapacity, equipment]
  );

  const toggleEquipment = (item) =>
    setEquipment((prev) => (prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]));

  const reset = () => {
    setQuery("");
    setBuilding("");
    setMinCapacity(0);
    setEquipment([]);
  };

  return (
    <section>
      <h2>Rooms</h2>
      <Status error={error} />
      {loading && <SkeletonCards count={6} />}
      {rooms && (
        <>
          <div className="filters">
            <input
              placeholder="Search by room name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select value={building} onChange={(e) => setBuilding(e.target.value)}>
              <option value="">All buildings</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select value={minCapacity} onChange={(e) => setMinCapacity(Number(e.target.value))}>
              <option value={0}>Any capacity</option>
              <option value={20}>20+ seats</option>
              <option value={50}>50+ seats</option>
              <option value={100}>100+ seats</option>
            </select>
          </div>
          <div className="chips filter-chips">
            {allEquipment.map((item) => (
              <button
                key={item}
                type="button"
                className={equipment.includes(item) ? "chip chip-btn on" : "chip chip-btn"}
                onClick={() => toggleEquipment(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="muted">
            {filtered.length} of {rooms.length} rooms
          </p>
          {filtered.length === 0 ? (
            <div>
              <p>No rooms match those filters.</p>
              <button className="secondary" onClick={reset}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid">
              {filtered.map((room, i) => (
                <RoomCard key={room.id} room={room} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
