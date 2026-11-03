const CLASSES = {
  confirmed: "ok",
  pending: "warn",
  rejected: "no",
  cancelled: "muted",
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${CLASSES[status] || "muted"}`}>{status}</span>;
}
