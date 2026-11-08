import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

vi.mock("../src/api.js", () => ({
  getRoom: vi.fn(),
  getRoomSlots: vi.fn(),
  getBookings: vi.fn(),
}));

import { getBookings, getRoom, getRoomSlots } from "../src/api.js";
import { AuthProvider } from "../src/auth/AuthContext.jsx";
import { BookingsProvider } from "../src/bookings/BookingsContext.jsx";
import RoomDetail from "../src/pages/RoomDetail.jsx";

const ROOM = {
  id: 72,
  name: "F303",
  building: "Main Building",
  floor: 3,
  capacity: 30,
  equipment: ["Projector", "Whiteboard"],
  description: "Small classroom.",
};

// 1: already booked on the backend, 2: free, 3: closed (room not bookable)
const SLOTS = [
  { id: "72-1", start: "2026-11-03T09:30", end: "2026-11-03T10:20", available: true },
  { id: "72-2", start: "2026-11-03T10:30", end: "2026-11-03T11:20", available: true },
  { id: "72-3", start: "2026-11-03T11:30", end: "2026-11-03T12:20", available: false },
];

const BACKEND_BOOKINGS = [
  { id: 1, roomId: 72, roomName: "F303", start: SLOTS[0].start, end: SLOTS[0].end, status: "confirmed" },
];

const STUDENT = { login: "240107001", name: "Student 240107001", role: "student" };
const STAFF = { login: "staff01", name: "Staff 01", role: "staff" };

async function renderRoom(user) {
  localStorage.setItem("sdu.user", JSON.stringify(user));
  render(
    <MemoryRouter initialEntries={["/rooms/72"]}>
      <AuthProvider>
        <BookingsProvider>
          <Routes>
            <Route path="/rooms/:id" element={<RoomDetail />} />
            <Route path="/rooms" element={<p>rooms list</p>} />
            <Route path="/my-bookings" element={<p>my bookings page</p>} />
          </Routes>
        </BookingsProvider>
      </AuthProvider>
    </MemoryRouter>
  );
  await screen.findAllByText("Booked"); // slots and backend bookings have both arrived
}

beforeEach(() => {
  getRoom.mockReset().mockResolvedValue(ROOM);
  getRoomSlots.mockReset().mockResolvedValue(SLOTS);
  getBookings.mockReset().mockResolvedValue(BACKEND_BOOKINGS);
});

describe("RoomDetail: what is shown", () => {
  it("shows the room's details", async () => {
    await renderRoom(STUDENT);
    expect(screen.getByRole("heading", { name: "F303" })).toBeTruthy();
    expect(screen.getByText(/Main Building · Floor 3 · Capacity 30/)).toBeTruthy();
    expect(screen.getByText("Small classroom.")).toBeTruthy();
    expect(screen.getByText("Projector")).toBeTruthy();
  });

  it("labels each slot: booked on the backend, free, or closed", async () => {
    await renderRoom(STUDENT);
    expect(screen.getAllByText("Booked")).toHaveLength(1);
    expect(screen.getAllByText("Available")).toHaveLength(1);
    expect(screen.getAllByText("Unavailable")).toHaveLength(1);
  });

  it("only offers a button on the free slot", async () => {
    await renderRoom(STUDENT);
    expect(screen.getAllByRole("button", { name: "Request" })).toHaveLength(1);
  });

  it("groups slots under their date", async () => {
    await renderRoom(STUDENT);
    expect(screen.getByRole("heading", { level: 4 }).textContent).toMatch(/Tuesday, 3 November|November 3/);
  });

  it("shows the backend's message when the room does not exist", async () => {
    getRoom.mockRejectedValue(new Error("Room not found"));
    getRoomSlots.mockResolvedValue([]);
    localStorage.setItem("sdu.user", JSON.stringify(STUDENT));
    render(
      <MemoryRouter initialEntries={["/rooms/72"]}>
        <AuthProvider>
          <BookingsProvider>
            <Routes>
              <Route path="/rooms/:id" element={<RoomDetail />} />
            </Routes>
          </BookingsProvider>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(await screen.findByText("Room not found")).toBeTruthy();
  });
});

describe("RoomDetail: reserving as a student", () => {
  it("requests the slot, which waits for staff approval", async () => {
    await renderRoom(STUDENT);
    fireEvent.click(screen.getByRole("button", { name: "Request" }));

    expect(screen.getByText(/Request sent for F303/)).toBeTruthy();
    expect(screen.getByText(/pending until staff confirm/)).toBeTruthy();
    expect(screen.getByText("pending")).toBeTruthy(); // status badge on the slot
    expect(screen.queryByRole("button", { name: "Request" })).toBeNull();
  });

  it("can cancel the request, which frees the slot again", async () => {
    await renderRoom(STUDENT);
    fireEvent.click(screen.getByRole("button", { name: "Request" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Reservation cancelled.")).toBeTruthy();
    expect(screen.getAllByText("Available")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Request" })).toBeTruthy();
  });

  it("does not offer the Book button reserved for staff", async () => {
    await renderRoom(STUDENT);
    expect(screen.queryByRole("button", { name: "Book" })).toBeNull();
  });
});

describe("RoomDetail: reserving as staff", () => {
  it("books the slot and it is confirmed straight away", async () => {
    await renderRoom(STAFF);
    fireEvent.click(screen.getByRole("button", { name: "Book" }));

    expect(screen.getByText(/It is confirmed/)).toBeTruthy();
    expect(screen.getByText("confirmed")).toBeTruthy();
  });
});

describe("RoomDetail: another person's reservation", () => {
  it("shows a slot reserved by someone else as Booked, with no cancel button", async () => {
    localStorage.setItem(
      "sdu.localBookings",
      JSON.stringify([
        {
          id: "local-1",
          source: "local",
          roomId: 72,
          roomName: "F303",
          slotId: "72-2",
          start: SLOTS[1].start,
          end: SLOTS[1].end,
          status: "confirmed",
          userLogin: "240107002",
          userName: "Student 240107002",
        },
      ])
    );
    await renderRoom(STUDENT);

    expect(screen.getAllByText("Booked")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Request" })).toBeNull();
  });
});
