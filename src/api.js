import * as mock from "./mockData";

const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

// mock fallback when the backend is unreachable. delay keeps the skeletons visible
const MOCK_DELAY_MS = 1200;

export const OFFLINE_EVENT = "sdu-api-offline";
let offline = false;
export const isOffline = () => offline;

function markOffline() {
  if (offline) return;
  offline = true;
  window.dispatchEvent(new Event(OFFLINE_EVENT));
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, fallback) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`);
  } catch (err) {
    // network failure only, http errors are real answers
    console.warn(`API call to ${path} failed (${err.message}), using mock data`);
    markOffline();
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return fallback();
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    // not json
  }
  if (!res.ok) {
    throw new ApiError(body?.error || `Request failed (HTTP ${res.status})`, res.status);
  }
  return body;
}

// GET /rooms (bookable only)
export const getRooms = () => request("/rooms", () => mock.rooms);

// GET /rooms/:id
export const getRoom = (id) =>
  request(`/rooms/${id}`, () => {
    const room = mock.rooms.find((r) => String(r.id) === String(id));
    if (!room) throw new ApiError("Room not found", 404);
    return room;
  });

// GET /rooms/:id/slots
export const getRoomSlots = (id) => request(`/rooms/${id}/slots`, () => mock.slots(id));

// GET /bookings (everyone's, no user info)
export const getBookings = () => request("/bookings", () => mock.bookings());
