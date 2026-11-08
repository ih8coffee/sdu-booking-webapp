import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const okResponse = (body) => ({ ok: true, status: 200, json: async () => body });
const errorResponse = (status, body) => ({
  ok: false,
  status,
  json: async () => {
    if (body === undefined) throw new Error("not json");
    return body;
  },
});

// fresh module each time, api.js remembers if the backend was offline
async function loadApi() {
  vi.resetModules();
  return import("../src/api.js");
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("api: successful responses", () => {
  it("returns the parsed JSON and calls the right endpoint", async () => {
    fetch.mockResolvedValue(okResponse([{ id: 1, name: "H102" }]));
    const api = await loadApi();

    expect(await api.getRooms()).toEqual([{ id: 1, name: "H102" }]);
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/rooms$/));
  });

  it("builds the nested slots URL from the room id", async () => {
    fetch.mockResolvedValue(okResponse([]));
    const api = await loadApi();

    await api.getRoomSlots(72);
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/rooms\/72\/slots$/));
  });

  it("calls /bookings", async () => {
    fetch.mockResolvedValue(okResponse([]));
    const api = await loadApi();

    await api.getBookings();
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/bookings$/));
  });
});

describe("api: HTTP errors are real answers, not outages", () => {
  it("throws ApiError with the backend's own message on a 404", async () => {
    fetch.mockResolvedValue(errorResponse(404, { error: "Room not found" }));
    const api = await loadApi();

    const error = await api.getRoom(999).catch((e) => e);
    expect(error).toBeInstanceOf(api.ApiError);
    expect(error.message).toBe("Room not found");
    expect(error.status).toBe(404);
  });

  it("falls back to a generic message when the error body is not JSON", async () => {
    fetch.mockResolvedValue(errorResponse(502, undefined));
    const api = await loadApi();

    const error = await api.getRooms().catch((e) => e);
    expect(error.message).toBe("Request failed (HTTP 502)");
  });

  it("does not switch to mock data or flag the backend as offline", async () => {
    fetch.mockResolvedValue(errorResponse(500, { error: "boom" }));
    const api = await loadApi();

    await api.getRooms().catch(() => {});
    expect(api.isOffline()).toBe(false);
  });
});

describe("api: backend unreachable", () => {
  it("falls back to mock data after a short delay and announces it", async () => {
    vi.useFakeTimers();
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const api = await loadApi();
    const onOffline = vi.fn();
    window.addEventListener(api.OFFLINE_EVENT, onOffline);

    const pending = api.getRooms();
    await vi.advanceTimersByTimeAsync(2000);
    const rooms = await pending;

    expect(rooms.length).toBeGreaterThan(0);
    expect(rooms[0]).toHaveProperty("name");
    expect(api.isOffline()).toBe(true);
    expect(onOffline).toHaveBeenCalledTimes(1);
    window.removeEventListener(api.OFFLINE_EVENT, onOffline);
  });

  it("an unknown room is still a 404 in mock mode", async () => {
    vi.useFakeTimers();
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const api = await loadApi();

    const assertion = expect(api.getRoom(123456)).rejects.toMatchObject({ status: 404 });
    await vi.advanceTimersByTimeAsync(2000);
    await assertion;
  });
});

describe("api: postLogin", () => {
  it("posts login, password and role as a form to /login", async () => {
    fetch.mockResolvedValue(okResponse({ result: 0, login: "staff01", role: "staff", name: "Staff 01" }));
    const api = await loadApi();

    const data = await api.postLogin("staff01", "staff123", "staff");
    const [url, init] = fetch.mock.calls[0];

    expect(url).toMatch(/\/login$/);
    expect(init.method).toBe("POST");
    expect(init.body.toString()).toBe("login=staff01&password=staff123&role=staff");
    expect(data.result).toBe(0);
  });

  it("wrong password is still a normal 200 answer, result 1", async () => {
    fetch.mockResolvedValue(okResponse({ result: 1, name: "ERROR" }));
    const api = await loadApi();

    expect((await api.postLogin("x", "y", "student")).result).toBe(1);
  });

  it("throws on an http error without falling back to mock data", async () => {
    fetch.mockResolvedValue(errorResponse(403, undefined));
    const api = await loadApi();

    const error = await api.postLogin("x", "y", "student").catch((e) => e);
    expect(error).toBeInstanceOf(api.ApiError);
    expect(error.status).toBe(403);
    expect(api.isOffline()).toBe(false);
  });

  it("throws when the backend can't be reached", async () => {
    fetch.mockRejectedValue(new TypeError("Failed to fetch"));
    const api = await loadApi();

    const error = await api.postLogin("x", "y", "student").catch((e) => e);
    expect(error.message).toMatch(/can't reach/i);
  });
});
