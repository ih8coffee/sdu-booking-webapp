import { describe, expect, it } from "vitest";
import { dayKey, fmtDate, fmtDateTime, fmtTime, fmtWhen } from "../src/format.js";

// the backend sends naive local times like this
const START = "2026-11-03T09:30";
const END = "2026-11-03T10:20";

describe("format helpers", () => {
  it("dayKey keeps only the date part", () => {
    expect(dayKey(START)).toBe("2026-11-03");
  });

  it("fmtTime shows the hour and minute exactly as sent (no timezone shift)", () => {
    expect(fmtTime(START)).toMatch(/0?9:30/);
    expect(fmtTime(END)).toMatch(/10:20/);
  });

  it("fmtDate names the day and month", () => {
    const text = fmtDate(START);
    expect(text).toMatch(/Tuesday/);
    expect(text).toMatch(/November/);
    expect(text).toMatch(/3/);
  });

  it("fmtDateTime includes both the date and the time", () => {
    const text = fmtDateTime(START);
    expect(text).toMatch(/Nov/);
    expect(text).toMatch(/0?9:30/);
  });

  it("fmtWhen joins start and end into one range", () => {
    const text = fmtWhen(START, END);
    expect(text).toContain(" – ");
    expect(text).toMatch(/0?9:30/);
    expect(text).toMatch(/10:20/);
  });
});
