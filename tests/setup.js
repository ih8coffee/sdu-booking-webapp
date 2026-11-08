import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// node 25 has its own empty localStorage and jsdom doesn't replace it, so use a simple one
if (typeof localStorage?.setItem !== "function") {
  const store = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    writable: true,
    value: {
      getItem: (key) => (store.has(String(key)) ? store.get(String(key)) : null),
      setItem: (key, value) => void store.set(String(key), String(value)),
      removeItem: (key) => void store.delete(String(key)),
      clear: () => store.clear(),
      key: (index) => [...store.keys()][index] ?? null,
      get length() {
        return store.size;
      },
    },
  });
}

// hide the react-router v7 warnings
const warn = console.warn;
vi.spyOn(console, "warn").mockImplementation((...args) => {
  if (String(args[0]).includes("React Router Future Flag Warning")) return;
  warn(...args);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});
