// The backend's slot.available only says whether the ROOM is bookable, not whether
// the slot is already taken. We work out the real state here by matching slots
// against bookings (backend bookings + reservations made in this app).

export const isActive = (booking) => booking.status === "pending" || booking.status === "confirmed";

export const slotKey = (roomId, start, end) => `${roomId}|${start}|${end}`;

// Map of slotKey -> booking, for every pending/confirmed booking in the given lists.
export function buildTakenMap(...lists) {
  const map = new Map();
  for (const list of lists) {
    for (const b of list) {
      if (isActive(b)) map.set(slotKey(b.roomId, b.start, b.end), b);
    }
  }
  return map;
}

// -> { state: "free" | "taken" | "past" | "closed", booking? }
export function slotState(room, slot, takenMap, now = new Date()) {
  const booking = takenMap.get(slotKey(room.id, slot.start, slot.end));
  if (booking) return { state: "taken", booking };
  if (!slot.available) return { state: "closed" };
  if (new Date(slot.start) <= now) return { state: "past" };
  return { state: "free" };
}

// -> [{ room, free, total }] where total counts slots that are not in the past
export function roomAvailability(rooms, slotsByRoom, takenMap, now = new Date()) {
  return rooms.map((room) => {
    const slots = slotsByRoom[room.id] || [];
    let free = 0;
    let total = 0;
    for (const slot of slots) {
      const { state } = slotState(room, slot, takenMap, now);
      if (state === "past") continue;
      total += 1;
      if (state === "free") free += 1;
    }
    return { room, free, total };
  });
}
