import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

const COPY = {
  student: { idLabel: "Student ID", placeholder: "e.g. 240107001" },
  staff: { idLabel: "Staff ID", placeholder: "e.g. staff01" },
};

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const [role, setRole] = useState("student");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from || "/"} replace />;

  const switchRole = (next) => {
    setRole(next);
    setId("");
    setPassword("");
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await login(role, id.trim(), password);
    setBusy(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <section className="login">
      <h1>Sign in to SDU Booking</h1>

      <div className="tabs" role="tablist">
        {["student", "staff"].map((r) => (
          <button
            key={r}
            role="tab"
            aria-selected={role === r}
            className={role === r ? "tab active" : "tab"}
            onClick={() => switchRole(r)}
            type="button"
          >
            {r === "student" ? "Student" : "Staff"}
          </button>
        ))}
      </div>

      <form className="card form" onSubmit={submit}>
        <label>
          {COPY[role].idLabel}
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder={COPY[role].placeholder}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy}>
          Sign in
        </button>
      </form>
    </section>
  );
}
