import { describe, expect, it } from "vitest";
import * as mock from "../src/mockData.js";

// shapes from DATA_STRUCTURE.md, checked on the mock data and on the real backend if it's running

const DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const STATUSES = ["pending", "confirmed", "rejected", "cancelled"];

const isNumber = (v) => typeof v === "number";
const isString = (v) => typeof v === "string";
const isDateTime = (v) => isString(v) && DATETIME.test(v);

const SCHEMAS = {
  room: {
    id: isNumber,
    name: isString,
    building: isString,
    floor: isNumber,
    capacity: isNumber,
    equipment: (v) => Array.isArray(v) && v.every(isString),
    description: isString,
  },
  slot: {
    id: isString,
    start: isDateTime,
    end: isDateTime,
    available: (v) => typeof v === "boolean",
  },
  booking: {
    id: isNumber,
    roomId: isNumber,
    roomName: isString,
    start: isDateTime,
    end: isDateTime,
    status: (v) => STATUSES.includes(v),
  },
};

function problems(item, schema) {
  return Object.entries(schema).flatMap(([key, ok]) => {
    if (!(key in item)) return [`missing "${key}"`];
    return ok(item[key]) ? [] : [`bad "${key}": ${JSON.stringify(item[key])}`];
  });
}

function expectAll(items, schema) {
  expect(items.length).toBeGreaterThan(0);
  items.forEach((item) => expect(problems(item, schema)).toEqual([]));
}

describe("mock data follows the documented shapes", () => {
  it("rooms", () => expectAll(mock.rooms, SCHEMAS.room));
  it("slots", () => expectAll(mock.slots(1), SCHEMAS.slot));
  it("bookings", () => expectAll(mock.bookings(), SCHEMAS.booking));

  it("slot ids start with their room id", () => {
    mock.slots(7).forEach((s) => expect(s.id.startsWith("7-")).toBe(true));
  });

  it("slots end after they start", () => {
    mock.slots(1).forEach((s) => expect(s.end > s.start).toBe(true));
  });
});

const CONFIGURED = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace(/\/$/, "");

// localhost can resolve to ::1 while the server only listens on 127.0.0.1
const CANDIDATES = [...new Set([CONFIGURED, CONFIGURED.replace("//localhost", "//127.0.0.1")])];

// no AbortSignal, jsdom's version breaks fetch on node 24+
const withTimeout = (promise, ms) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no answer after ${ms}ms`)), ms);
    promise.then(
      (value) => (clearTimeout(timer), resolve(value)),
      (error) => (clearTimeout(timer), reject(error))
    );
  });

async function findBackend() {
  const reasons = [];
  for (const base of CANDIDATES) {
    try {
      const res = await withTimeout(fetch(`${base}/rooms`), 5000);
      if (res.ok) return { base };
      reasons.push(`${base}/rooms answered HTTP ${res.status}`);
    } catch (error) {
      reasons.push(`${base}/rooms: ${error.cause?.code || error.name} ${error.cause?.message || error.message}`);
    }
  }
  return { reasons };
}

const found = await findBackend();
const live = Boolean(found.base);
const BASE = found.base;

if (!live) {
  console.warn(`[contract] live backend tests skipped, could not reach the backend:\n  ${found.reasons.join("\n  ")}`);
}

// skipped when the backend isn't running
describe.skipIf(!live)("live backend follows the documented shapes", () => {
  const get = async (path) => {
    const res = await fetch(`${BASE}${path}`);
    return { status: res.status, body: await res.json() };
  };

  it("GET /rooms", async () => {
    const { status, body } = await get("/rooms");
    expect(status).toBe(200);
    expectAll(body, SCHEMAS.room);
  });

  it("GET /rooms/:id", async () => {
    const { body: rooms } = await get("/rooms");
    const { status, body } = await get(`/rooms/${rooms[0].id}`);
    expect(status).toBe(200);
    expect(problems(body, SCHEMAS.room)).toEqual([]);
    expect(body.id).toBe(rooms[0].id);
  });

  it("GET /rooms/:id/slots", async () => {
    const { body: rooms } = await get("/rooms");
    const { status, body } = await get(`/rooms/${rooms[0].id}/slots`);
    expect(status).toBe(200);
    expectAll(body, SCHEMAS.slot);
    body.forEach((s) => expect(s.id.startsWith(`${rooms[0].id}-`)).toBe(true));
  });

  it("GET /bookings", async () => {
    const { status, body } = await get("/bookings");
    expect(status).toBe(200);
    expectAll(body, SCHEMAS.booking);
  });

  it("an unknown room is a 404 with an error message", async () => {
    const { status, body } = await get("/rooms/999999");
    expect(status).toBe(404);
    expect(isString(body.error)).toBe(true);
  });
});
