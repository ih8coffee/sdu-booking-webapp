import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../src/auth/AuthContext.jsx";
import Login from "../src/pages/Login.jsx";
import { stubLoginBackend } from "./fakeLogin.js";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/login", state: { from: "/rooms" } }]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/rooms" element={<p>rooms page</p>} />
          <Route path="/" element={<p>home page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

function fill(label, value) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

const submit = () => fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
const openTab = (name) => fireEvent.click(screen.getByRole("tab", { name }));

beforeEach(() => {
  stubLoginBackend();
});

describe("Login page", () => {
  it("opens on the Student tab", () => {
    renderLogin();
    expect(screen.getByRole("tab", { name: "Student" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByLabelText(/Student ID/)).toBeTruthy();
  });

  it("signs a student in and returns them to the page they asked for", async () => {
    renderLogin();
    fill(/Student ID/, "240107001");
    fill("Password", "student123");
    submit();

    expect(await screen.findByText("rooms page")).toBeTruthy();
  });

  it("shows an error for a wrong password and stays on the page", async () => {
    renderLogin();
    fill(/Student ID/, "240107001");
    fill("Password", "wrong");
    submit();

    expect(await screen.findByText(/wrong id or password/i)).toBeTruthy();
    expect(screen.queryByText("rooms page")).toBeNull();
  });

  it("explains when a staff account is used on the student tab", async () => {
    renderLogin();
    fill(/Student ID/, "staff01");
    fill("Password", "staff123");
    submit();

    expect(await screen.findByText(/isn't a student account/i)).toBeTruthy();
  });

  it("signs staff in from the Staff tab", async () => {
    renderLogin();
    openTab("Staff");
    fill(/Staff ID/, "staff01");
    fill("Password", "staff123");
    submit();

    expect(await screen.findByText("rooms page")).toBeTruthy();
  });

  it("switching tabs relabels the form and clears it", () => {
    renderLogin();
    fill(/Student ID/, "240107001");
    fill("Password", "student123");

    openTab("Staff");

    expect(screen.getByLabelText(/Staff ID/).value).toBe("");
    expect(screen.getByLabelText("Password").value).toBe("");
  });

  it("skips the form entirely when already logged in", () => {
    localStorage.setItem(
      "sdu.user",
      JSON.stringify({ login: "staff01", name: "Staff 01", role: "staff" })
    );
    renderLogin();
    expect(screen.getByText("rooms page")).toBeTruthy();
  });
});
