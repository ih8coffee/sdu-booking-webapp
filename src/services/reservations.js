// Reservations made in this app.
//
// The backend has no way to create a reservation yet (POST /bookings is not implemented),
// so reservations are kept in the browser's localStorage and layered on top of the
// backend's data. Everything the UI needs goes through the functions below; when the
// backend gets real endpoints, replace the bodies of these functions with fetch calls.
import { useSyncExternalStore } from "react";
import { isActive } from "./availability";

const KEY = "sdu-booking.reservations.v1";
const listeners = new Set();

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let cache = read();

function commit(next) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: reservations then live only until reload */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (e) => {
    if (e.key === KEY) {
      cache = read();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// React hook: all local reservations, re-renders when they change.
export const useReservations = () => useSyncExternalStore(subscribe, () => cache);

// Students' requests start as "pending"; staff reservations are confirmed immediately.
export function createReservation({ room, slot, user }) {
  const clash = cache.find(
    (r) => isActive(r) && r.roomId === room.id && r.start === slot.start && r.end === slot.end
  );
  if (clash) throw new Error("Someone just reserved this slot. Please pick another one.");

  const reservation = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source: "local",
    roomId: room.id,
    roomName: room.name,
    slotId: slot.id,
    start: slot.start,
    end: slot.end,
    status: user.role === "staff" ? "confirmed" : "pending",
    userLogin: user.login,
    userName: user.name,
    createdAt: new Date().toISOString(),
  };
  commit([...cache, reservation]);
  return reservation;
}

export function setReservationStatus(id, status) {
  commit(cache.map((r) => (r.id === id ? { ...r, status } : r)));
}

export const cancelReservation = (id) => setReservationStatus(id, "cancelled");
