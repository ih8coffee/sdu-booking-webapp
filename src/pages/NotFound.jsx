import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <section>
      <h2>Page not found</h2>
      <button onClick={() => navigate("/")}>Back to home</button>
    </section>
  );
}
