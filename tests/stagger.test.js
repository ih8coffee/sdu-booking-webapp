import { describe, expect, it } from "vitest";
import { stagger, staggerDelay } from "../src/stagger.js";

describe("staggerDelay", () => {
  it("starts immediately for the first item", () => {
    expect(staggerDelay(0)).toBe(0);
    expect(staggerDelay(-3)).toBe(0);
  });

  it("increases for each of the first items", () => {
    const delays = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => staggerDelay(i));
    for (let i = 1; i < delays.length; i++) {
      expect(delays[i]).toBeGreaterThan(delays[i - 1]);
    }
  });

  it("gets tighter as the list grows", () => {
    const firstFour = staggerDelay(4) - staggerDelay(0);
    const nextFour = staggerDelay(8) - staggerDelay(4);
    expect(nextFour).toBeLessThan(firstFour);
  });

  it("never exceeds the cap, however long the list", () => {
    expect(staggerDelay(50)).toBeLessThanOrEqual(520);
    expect(staggerDelay(10_000)).toBeLessThanOrEqual(520);
  });

  it("is deterministic, so re-renders never change an item's delay", () => {
    expect(staggerDelay(7)).toBe(staggerDelay(7));
  });
});

describe("stagger", () => {
  it("returns a style object with the --delay custom property", () => {
    expect(stagger(0)).toEqual({ "--delay": "0ms" });
    expect(stagger(3)["--delay"]).toMatch(/^\d+ms$/);
  });
});
