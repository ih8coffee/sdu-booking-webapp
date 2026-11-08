import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

// role="staff" restricts the page to staff
export default function RequireAuth({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (role && user.role !== role) {
    return (
      <section>
        <h2>Staff only</h2>
        <p className="muted">Your {user.role} account does not have access to this page.</p>
      </section>
    );
  }
  return children;
}
