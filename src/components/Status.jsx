export default function Status({ error }) {
  if (error) return <p className="error">Something went wrong: {error.message}</p>;
  return null;
}
