import { vi } from "vitest";

// same answers as the backend's login view: result 0 ok, 1 bad login/password, 2 wrong role
const ACCOUNTS = [
  { login: "240107001", password: "student123", role: "student", name: "Student 240107001" },
  { login: "staff01", password: "staff123", role: "staff", name: "Staff 01 (Registrar)" },
];

export function stubLoginBackend() {
  const fetchMock = vi.fn(async (url, init) => {
    const form = init.body;
    const account = ACCOUNTS.find(
      (a) => a.login === form.get("login") && a.password === form.get("password")
    );
    let result = 0;
    if (!account) result = 1;
    else if (account.role !== form.get("role")) result = 2;

    const body = {
      result,
      login: form.get("login"),
      role: form.get("role"),
      name: result === 1 ? "ERROR" : account.name,
    };
    return { ok: true, status: 200, json: async () => body };
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
