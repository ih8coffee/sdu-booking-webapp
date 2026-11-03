// The backend sends naive "YYYY-MM-DDTHH:MM" strings (wall-clock time).
export const dayKey = (iso) => iso.slice(0, 10);

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });

export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

export const fmtRange = (start, end) => `${fmtTime(start)}–${fmtTime(end)}`;

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
