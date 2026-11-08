import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("../src/api.js", () => ({ getRooms: vi.fn() }));

import { getRooms } from "../src/api.js";
import Rooms from "../src/pages/Rooms.jsx";

const ROOMS = [
  { id: 1, name: "H102", building: "Main Building", floor: 1, capacity: 80, equipment: ["Projector", "Whiteboard"], description: "" },
  { id: 2, name: "G108", building: "Main Building", floor: 1, capacity: 24, equipment: ["Computers", "Projector", "Whiteboard"], description: "" },
  { id: 3, name: "L001", building: "Library", floor: 0, capacity: 6, equipment: ["Whiteboard"], description: "" },
  { id: 4, name: "B010", building: "Science Block", floor: 0, capacity: 60, equipment: ["Projector", "Microphone"], description: "" },
];

async function renderRooms() {
  render(
    <MemoryRouter>
      <Rooms />
    </MemoryRouter>
  );
  await screen.findByText(/ of 4 rooms/);
}

// room cards are the level-3 headings
const shown = () => screen.queryAllByRole("heading", { level: 3 }).map((h) => h.textContent);
// [0] building, [1] minimum capacity
const selects = () => screen.getAllByRole("combobox");
const search = (text) =>
  fireEvent.change(screen.getByPlaceholderText("Search by room name"), { target: { value: text } });
const chip = (name) => screen.getByRole("button", { name });

beforeEach(() => {
  getRooms.mockReset();
  getRooms.mockResolvedValue(ROOMS);
});

describe("Rooms page", () => {
  it("shows a loading placeholder, then every room", async () => {
    render(
      <MemoryRouter>
        <Rooms />
      </MemoryRouter>
    );
    expect(screen.getAllByLabelText("Loading rooms").length).toBeGreaterThan(0);

    await screen.findByText("4 of 4 rooms");
    expect(shown()).toEqual(["H102", "G108", "L001", "B010"]);
  });

  it("filters by room name, ignoring case", async () => {
    await renderRooms();
    search("g1");
    expect(shown()).toEqual(["G108"]);
    expect(screen.getByText("1 of 4 rooms")).toBeTruthy();
  });

  it("filters by building", async () => {
    await renderRooms();
    fireEvent.change(selects()[0], { target: { value: "Library" } });
    expect(shown()).toEqual(["L001"]);
  });

  it("only lists the buildings that exist", async () => {
    await renderRooms();
    const options = [...selects()[0].querySelectorAll("option")].map((o) => o.textContent);
    expect(options).toEqual(["All buildings", "Library", "Main Building", "Science Block"]);
  });

  it("filters by minimum capacity", async () => {
    await renderRooms();
    fireEvent.change(selects()[1], { target: { value: "50" } });
    expect(shown()).toEqual(["H102", "B010"]);
  });

  it("filters by equipment, and several chips must all match", async () => {
    await renderRooms();

    fireEvent.click(chip("Computers"));
    expect(shown()).toEqual(["G108"]);

    fireEvent.click(chip("Computers")); // toggle off
    expect(shown()).toHaveLength(4);

    fireEvent.click(chip("Projector"));
    fireEvent.click(chip("Whiteboard"));
    expect(shown()).toEqual(["H102", "G108"]);
  });

  it("combines filters", async () => {
    await renderRooms();
    fireEvent.change(selects()[0], { target: { value: "Main Building" } });
    fireEvent.change(selects()[1], { target: { value: "50" } });
    expect(shown()).toEqual(["H102"]);
  });

  it("explains an empty result and lets the person clear the filters", async () => {
    await renderRooms();
    search("zzz");
    expect(screen.getByText(/no rooms match/i)).toBeTruthy();
    expect(shown()).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(shown()).toHaveLength(4);
  });

  it("shows the error when the rooms cannot be loaded", async () => {
    getRooms.mockRejectedValue(new Error("Request failed (HTTP 500)"));
    render(
      <MemoryRouter>
        <Rooms />
      </MemoryRouter>
    );
    expect(await screen.findByText("Request failed (HTTP 500)")).toBeTruthy();
  });
});
