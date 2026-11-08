import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AuthProvider } from "../src/auth/AuthContext.jsx";
import RequireAuth from "../src/components/RequireAuth.jsx";

const STUDENT = { login: "240107001", name: "Student 240107001", role: "student" };
const STAFF = { login: "staff01", name: "Staff 01", role: "staff" };

function LoginStub() {
  const { state } = useLocation();
  return <p>login page (came from {state?.from ?? "nowhere"})</p>;
}

function renderAt(path, user) {
  if (user) localStorage.setItem("sdu.user", JSON.stringify(user));
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginStub />} />
          <Route
            path="/rooms"
            element={
              <RequireAuth>
                <p>rooms page</p>
              </RequireAuth>
            }
          />
          <Route
            path="/manage"
            element={
              <RequireAuth role="staff">
                <p>manage page</p>
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("RequireAuth", () => {
  it("sends a logged-out visitor to /login", () => {
    renderAt("/rooms");
    expect(screen.getByText(/login page/)).toBeTruthy();
    expect(screen.queryByText("rooms page")).toBeNull();
  });

  it("remembers which page they were trying to open", () => {
    renderAt("/manage");
    expect(screen.getByText("login page (came from /manage)")).toBeTruthy();
  });

  it("lets any logged-in user into a normal page", () => {
    renderAt("/rooms", STUDENT);
    expect(screen.getByText("rooms page")).toBeTruthy();
  });

  it("blocks a student from a staff-only page", () => {
    renderAt("/manage", STUDENT);
    expect(screen.getByText("Staff only")).toBeTruthy();
    expect(screen.queryByText("manage page")).toBeNull();
  });

  it("lets staff into a staff-only page", () => {
    renderAt("/manage", STAFF);
    expect(screen.getByText("manage page")).toBeTruthy();
  });
});
