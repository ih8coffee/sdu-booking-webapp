import * as mock from "./mockData";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const MOCK_DELAY_MS = 600;
// Fake delay

// Fetch JSON from the backend; if it fails, use the mock fallback so the
// frontend can still be demoed without a running API.
async function request(path, fallback) {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`API call to ${path} failed, using mock data:`, err.message);
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return fallback();
  }
}

export const getRooms = () => request("/rooms", () => mock.rooms);

export const getRoom = (id) =>
  request(`/rooms/${id}`, () => mock.rooms.find((r) => String(r.id) === String(id)));

export const getRoomSlots = (id) => request(`/rooms/${id}/slots`, () => mock.slots(id));

export const getBookings = () => request("/bookings", () => mock.bookings);
