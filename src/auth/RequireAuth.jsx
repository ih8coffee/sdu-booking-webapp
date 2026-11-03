import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

// Wraps a page: redirects to /login when logged out, blocks other roles.
export default function RequireAuth({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <section>
        <h2>Not allowed</h2>
        <p className="muted">This page is only for {roles.join(" / ")} accounts.</p>
        <button onClick={() => navigate("/")}>Back to home</button>
      </section>
    );
  }

  return children;
}
