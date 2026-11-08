import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { AuthProvider, useAuth } from "../src/auth/AuthContext.jsx";
import { stubLoginBackend } from "./fakeLogin.js";

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
const setup = () => renderHook(() => useAuth(), { wrapper });

async function login(hook, role, id, password) {
  let outcome;
  await act(async () => {
    outcome = await hook.result.current.login(role, id, password);
  });
  return outcome;
}

let fetchMock;
beforeEach(() => {
  fetchMock = stubLoginBackend();
});

describe("AuthContext", () => {
  it("starts logged out", () => {
    const hook = setup();
    expect(hook.result.current.user).toBeNull();
    expect(hook.result.current.isStaff).toBe(false);
    expect(hook.result.current.isStudent).toBe(false);
  });

  it("posts the login to the backend as a form", async () => {
    const hook = setup();
    await login(hook, "student", "240107001", "student123");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/login$/);
    expect(init.method).toBe("POST");
    expect(init.body.get("login")).toBe("240107001");
    expect(init.body.get("password")).toBe("student123");
    expect(init.body.get("role")).toBe("student");
  });

  it("logs a student in and remembers them", async () => {
    const hook = setup();
    const outcome = await login(hook, "student", "240107001", "student123");

    expect(outcome).toEqual({ ok: true });
    expect(hook.result.current.user).toEqual({
      login: "240107001",
      name: "Student 240107001",
      role: "student",
    });
    expect(hook.result.current.isStudent).toBe(true);
    expect(JSON.parse(localStorage.getItem("sdu.user")).login).toBe("240107001");
  });

  it("logs a staff member in", async () => {
    const hook = setup();
    expect((await login(hook, "staff", "staff01", "staff123")).ok).toBe(true);
    expect(hook.result.current.isStaff).toBe(true);
    expect(hook.result.current.isStudent).toBe(false);
  });

  it("never stores the password", async () => {
    const hook = setup();
    await login(hook, "student", "240107001", "student123");
    expect(localStorage.getItem("sdu.user")).not.toContain("student123");
  });

  it("rejects a wrong password", async () => {
    const hook = setup();
    const outcome = await login(hook, "student", "240107001", "nope");
    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/wrong id or password/i);
    expect(hook.result.current.user).toBeNull();
    expect(localStorage.getItem("sdu.user")).toBeNull();
  });

  it("rejects an unknown id", async () => {
    const hook = setup();
    expect((await login(hook, "student", "999999999", "student123")).ok).toBe(false);
  });

  it("wrong tab: a staff account on the student tab", async () => {
    const hook = setup();
    const outcome = await login(hook, "student", "staff01", "staff123");
    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/isn't a student account/i);
    expect(hook.result.current.user).toBeNull();
  });

  it("wrong tab: a student account on the staff tab", async () => {
    const hook = setup();
    const outcome = await login(hook, "staff", "240107001", "student123");
    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/isn't a staff account/i);
  });

  it("says so when the backend can't be reached", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const hook = setup();
    const outcome = await login(hook, "student", "240107001", "student123");
    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/can't reach/i);
    expect(hook.result.current.user).toBeNull();
  });

  it("an http error (403, 500...) is a failed login", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => {
        throw new Error("not json");
      },
    });
    const hook = setup();
    const outcome = await login(hook, "student", "240107001", "student123");
    expect(outcome.ok).toBe(false);
    expect(outcome.error).toMatch(/HTTP 403/);
    expect(hook.result.current.user).toBeNull();
  });

  it("logout clears the user and the saved session", async () => {
    const hook = setup();
    await login(hook, "student", "240107001", "student123");
    act(() => hook.result.current.logout());

    expect(hook.result.current.user).toBeNull();
    expect(localStorage.getItem("sdu.user")).toBeNull();
  });

  it("restores a saved session on load", () => {
    localStorage.setItem(
      "sdu.user",
      JSON.stringify({ login: "staff01", name: "Staff 01", role: "staff" })
    );
    const hook = setup();
    expect(hook.result.current.user.login).toBe("staff01");
    expect(hook.result.current.isStaff).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("ignores a corrupted saved session", () => {
    localStorage.setItem("sdu.user", "{not json");
    const hook = setup();
    expect(hook.result.current.user).toBeNull();
  });
});
