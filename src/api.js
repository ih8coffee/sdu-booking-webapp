import * as mock from "./mockData";

// Django backend under /api, GET only for now (see DATA_STRUCTURE.md)
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

// backend unreachable -> mock data, delay keeps the skeletons visible
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
    // network failure only, HTTP errors are real answers
    console.warn(`API call to ${path} failed (${err.message}), using mock data`);
    markOffline();
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    return fallback();
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON body */
  }
  if (!res.ok) {
    throw new ApiError(body?.error || `Request failed (HTTP ${res.status})`, res.status);
  }
  return body;
}

// GET /rooms -> Room[] (only bookable = true)
export const getRooms = () => request("/rooms", () => mock.rooms);

// GET /rooms/:id -> Room | 404 { error }
export const getRoom = (id) =>
  request(`/rooms/${id}`, () => {
    const room = mock.rooms.find((r) => String(r.id) === String(id));
    if (!room) throw new ApiError("Room not found", 404);
    return room;
  });

// GET /rooms/:id/slots -> Slot[] | 404 { error }
export const getRoomSlots = (id) => request(`/rooms/${id}/slots`, () => mock.slots(id));

// GET /bookings -> Booking[] (everyone's, no user info)
export const getBookings = () => request("/bookings", () => mock.bookings());
