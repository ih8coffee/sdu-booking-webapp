import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { DEMO_USERS } from "../auth/demoUsers";
import Reveal from "../components/Reveal.jsx";

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

  if (user) return <Navigate to={location.state?.from || "/"} replace />;

  const switchRole = (next) => {
    setRole(next);
    setId("");
    setPassword("");
    setError("");
  };

  const submit = (e) => {
    e.preventDefault();
    const result = login(role, id.trim(), password);
    if (!result.ok) setError(result.error);
  };

  const accounts = DEMO_USERS.filter((u) => u.role === role);

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
        <button type="submit">Sign in</button>
      </form>

      <div className="card demo">
        <strong>Demo accounts</strong>
        <p className="muted">
          The backend has no login yet, so these accounts live in the frontend. Click one to fill the
          form.
        </p>
        <ul className="list">
          {accounts.map((a, i) => (
            <Reveal as="li" key={`${role}-${a.login}`} className="list-item" index={i}>
              <span>
                {a.login} <span className="muted">/ {a.password}</span>
              </span>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setId(a.login);
                  setPassword(a.password);
                  setError("");
                }}
              >
                Use
              </button>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
