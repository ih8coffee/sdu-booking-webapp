import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

vi.mock("../src/api.js", () => ({ getBookings: vi.fn() }));

import { getBookings } from "../src/api.js";
import { BookingsProvider, useBookings } from "../src/bookings/BookingsContext.jsx";

const ROOM = { id: 72, name: "F303" };
const TAKEN = { id: "72-1", start: "2026-11-03T09:30", end: "2026-11-03T10:20" };
const REJECTED = { id: "72-2", start: "2026-11-03T10:30", end: "2026-11-03T11:20" };
const FREE = { id: "72-3", start: "2026-11-03T11:30", end: "2026-11-03T12:20" };

const SERVER_BOOKINGS = [
  { id: 1, roomId: 72, roomName: "F303", ...pick(TAKEN), status: "confirmed" },
  { id: 2, roomId: 72, roomName: "F303", ...pick(REJECTED), status: "rejected" },
];

const student = { login: "240107001", name: "Student 240107001", role: "student" };
const staff = { login: "staff01", name: "Staff 01", role: "staff" };

function pick({ start, end }) {
  return { start, end };
}

const wrapper = ({ children }) => <BookingsProvider>{children}</BookingsProvider>;

async function setup() {
  const hook = renderHook(() => useBookings(), { wrapper });
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

function reserve(hook, slot, user) {
  let outcome;
  act(() => {
    outcome = hook.result.current.reserve(ROOM, slot, user);
  });
  return outcome;
}

beforeEach(() => {
  getBookings.mockReset();
  getBookings.mockResolvedValue(SERVER_BOOKINGS);
});

describe("BookingsContext: loading", () => {
  it("merges the backend's bookings and labels them as server bookings", async () => {
    const { result } = await setup();

    expect(result.current.all).toHaveLength(2);
    expect(result.current.all[0]).toMatchObject({
      id: "server-1",
      source: "server",
      userLogin: null,
      status: "confirmed",
    });
  });

  it("still works with local reservations when the backend call fails", async () => {
    getBookings.mockRejectedValue(new Error("backend down"));
    const hook = await setup();

    expect(hook.result.current.error.message).toBe("backend down");
    expect(reserve(hook, FREE, student).ok).toBe(true);
    expect(hook.result.current.all).toHaveLength(1);
  });
});

describe("BookingsContext: finding what is taken", () => {
  it("finds an active backend booking by room, start and end", async () => {
    const { result } = await setup();
    const found = result.current.findActive(72, TAKEN.start, TAKEN.end);
    expect(found.id).toBe("server-1");
  });

  it("treats the room id as equal whether it is a number or a string", async () => {
    const { result } = await setup();
    expect(result.current.findActive("72", TAKEN.start, TAKEN.end)).toBeDefined();
  });

  it("ignores rejected bookings, so that slot counts as free", async () => {
    const { result } = await setup();
    expect(result.current.findActive(72, REJECTED.start, REJECTED.end)).toBeUndefined();
  });

  it("returns nothing for a free slot or another room", async () => {
    const { result } = await setup();
    expect(result.current.findActive(72, FREE.start, FREE.end)).toBeUndefined();
    expect(result.current.findActive(99, TAKEN.start, TAKEN.end)).toBeUndefined();
  });
});

describe("BookingsContext: reserving", () => {
  it("a student's reservation starts as pending", async () => {
    const hook = await setup();
    const outcome = reserve(hook, FREE, student);

    expect(outcome.ok).toBe(true);
    expect(outcome.booking).toMatchObject({
      source: "local",
      status: "pending",
      userLogin: "240107001",
      roomId: 72,
      roomName: "F303",
      start: FREE.start,
      end: FREE.end,
    });
    expect(hook.result.current.all).toHaveLength(3);
  });

  it("a staff reservation is confirmed immediately", async () => {
    const hook = await setup();
    expect(reserve(hook, FREE, staff).booking.status).toBe("confirmed");
  });

  it("the reserved slot is then reported as taken", async () => {
    const hook = await setup();
    reserve(hook, FREE, student);
    expect(hook.result.current.findActive(72, FREE.start, FREE.end)).toBeDefined();
  });

  it("refuses to double-book a slot", async () => {
    const hook = await setup();
    reserve(hook, FREE, student);
    const second = reserve(hook, FREE, staff);

    expect(second.ok).toBe(false);
    expect(second.error).toMatch(/taken/i);
    expect(hook.result.current.all).toHaveLength(3);
  });

  it("refuses a slot already booked on the backend", async () => {
    const hook = await setup();
    expect(reserve(hook, TAKEN, student).ok).toBe(false);
  });

  it("allows a slot whose backend booking was rejected", async () => {
    const hook = await setup();
    expect(reserve(hook, REJECTED, student).ok).toBe(true);
  });
});

describe("BookingsContext: changing status", () => {
  it("approving moves a pending reservation to confirmed", async () => {
    const hook = await setup();
    const { booking } = reserve(hook, FREE, student);
    act(() => hook.result.current.setStatus(booking.id, "confirmed"));

    const updated = hook.result.current.all.find((b) => b.id === booking.id);
    expect(updated.status).toBe("confirmed");
  });

  it("cancelling frees the slot so it can be booked again", async () => {
    const hook = await setup();
    const { booking } = reserve(hook, FREE, student);
    act(() => hook.result.current.setStatus(booking.id, "cancelled"));

    expect(hook.result.current.findActive(72, FREE.start, FREE.end)).toBeUndefined();
    expect(reserve(hook, FREE, staff).ok).toBe(true);
  });

  it("rejecting also frees the slot", async () => {
    const hook = await setup();
    const { booking } = reserve(hook, FREE, student);
    act(() => hook.result.current.setStatus(booking.id, "rejected"));
    expect(hook.result.current.findActive(72, FREE.start, FREE.end)).toBeUndefined();
  });

  it("cannot change a backend booking (the backend is read-only)", async () => {
    const { result } = await setup();
    act(() => result.current.setStatus("server-1", "cancelled"));

    const serverBooking = result.current.all.find((b) => b.id === "server-1");
    expect(serverBooking.status).toBe("confirmed");
  });
});

describe("BookingsContext: persistence", () => {
  it("saves reservations in the browser", async () => {
    const hook = await setup();
    reserve(hook, FREE, student);

    const saved = JSON.parse(localStorage.getItem("sdu.localBookings"));
    expect(saved).toHaveLength(1);
    expect(saved[0].userLogin).toBe("240107001");
  });

  it("a fresh page load still has them", async () => {
    const first = await setup();
    reserve(first, FREE, student);
    first.unmount();

    const second = await setup();
    const local = second.result.current.all.filter((b) => b.source === "local");
    expect(local).toHaveLength(1);
    expect(local[0].start).toBe(FREE.start);
  });

  it("survives corrupted saved data", async () => {
    localStorage.setItem("sdu.localBookings", "{broken");
    const { result } = await setup();
    expect(result.current.all).toHaveLength(2);
  });
});
