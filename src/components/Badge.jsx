// kind: "ok" | "warn" | "no" | "muted"
export default function Badge({ kind = "muted", children }) {
  return <span className={`badge ${kind}`}>{children}</span>;
}

const STATUS_KIND = { confirmed: "ok", pending: "warn", rejected: "no", cancelled: "muted" };

export function StatusBadge({ status }) {
  return <Badge kind={STATUS_KIND[status] || "muted"}>{status}</Badge>;
}
