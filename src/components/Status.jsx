export default function Status({ error }) {
  if (!error) return null;
  return <div className="msg err">{error.message}</div>;
}
