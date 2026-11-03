import { getBookings, getRoomSlots, getRooms } from "../api";
import useFetch from "../useFetch";

// Loads everything the overview pages need in one go:
// all bookable rooms, every room's slots, and the backend's bookings.
export default function useCampusData() {
  return useFetch(async () => {
    const [rooms, bookings] = await Promise.all([getRooms(), getBookings()]);
    const slotLists = await Promise.all(rooms.map((r) => getRoomSlots(r.id)));
    const slotsByRoom = {};
    rooms.forEach((r, i) => {
      slotsByRoom[r.id] = slotLists[i];
    });
    return { rooms, bookings, slotsByRoom };
  });
}
