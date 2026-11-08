// backend sends naive "YYYY-MM-DDTHH:MM" (local time, no timezone)

export const dayKey = (iso) => iso.slice(0, 10);

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });

export const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString([], {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const fmtWhen = (start, end) => `${fmtDateTime(start)} – ${fmtTime(end)}`;
