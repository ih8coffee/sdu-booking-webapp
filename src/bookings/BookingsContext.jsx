import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getBookings } from "../api";
import useFetch from "../useFetch";

// TODO: POST /bookings and PATCH /bookings/:id. until then reservations are "local"
// (localStorage) and merged with the backend's "server" ones. only reserve() and setStatus() change

const KEY = "sdu.localBookings";
const ACTIVE = ["pending", "confirmed"];

export const isActive = (b) => ACTIVE.includes(b.status);

function loadLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const BookingsContext = createContext(null);

export function BookingsProvider({ children }) {
  const server = useFetch(getBookings, []);
  const [local, setLocal] = useState(loadLocal);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(local));
    } catch {
      /* storage unavailable */
    }
  }, [local]);

  // { id, source, roomId, roomName, start, end, status, userLogin }
  const all = useMemo(() => {
    const fromServer = (server.data || []).map((b) => ({
      ...b,
      id: `server-${b.id}`,
      source: "server",
      userLogin: null, // api doesn't send it
    }));
    return [...fromServer, ...local];
  }, [server.data, local]);

  // active (pending/confirmed) booking for a room + time window
  const findActive = useCallback(
    (roomId, start, end) =>
      all.find(
        (b) => isActive(b) && String(b.roomId) === String(roomId) && b.start === start && b.end === end
      ),
    [all]
  );

  // students: pending, staff: confirmed
  const reserve = useCallback(
    (room, slot, user) => {
      if (findActive(room.id, slot.start, slot.end)) {
        return { ok: false, error: "Sorry, that slot was just taken." };
      }
      const booking = {
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
      setLocal((prev) => [...prev, booking]);
      return { ok: true, booking };
    },
    [findActive]
  );

  // "confirmed" | "rejected" | "cancelled", local ones only
  const setStatus = useCallback((id, status) => {
    setLocal((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  }, []);

  const value = useMemo(
    () => ({
      all,
      loading: server.loading,
      error: server.error,
      findActive,
      reserve,
      setStatus,
    }),
    [all, server.loading, server.error, findActive, reserve, setStatus]
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
}

export function useBookings() {
  return useContext(BookingsContext);
}
