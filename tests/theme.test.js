import { afterEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import useTheme from "../src/theme.js";

function setOsDark(dark) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: () => ({
      matches: dark,
      addEventListener() {},
      removeEventListener() {},
    }),
  });
}

afterEach(() => {
  delete window.matchMedia;
});

describe("useTheme", () => {
  it("is light when the OS has no dark preference and nothing was saved", () => {
    setOsDark(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });

  it("follows the OS when nothing was saved", () => {
    setOsDark(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
  });

  it("a saved choice wins over the OS", () => {
    setOsDark(true);
    localStorage.setItem("sdu.theme", "light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("toggle flips the theme, sets data-theme and remembers the choice", () => {
    setOsDark(false);
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggle());
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem("sdu.theme")).toBe("dark");

    act(() => result.current.toggle());
    expect(result.current.theme).toBe("light");
    expect(localStorage.getItem("sdu.theme")).toBe("light");
  });

  it("ignores garbage in storage", () => {
    setOsDark(false);
    localStorage.setItem("sdu.theme", "purple");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
  });
});
