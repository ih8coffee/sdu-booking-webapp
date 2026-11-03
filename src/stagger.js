const STEP_MS = 55;
const EXPONENT = 0.82;
const MAX_MS = 520;

// gaps shrink as the list grows, capped so long lists don't drag
export function staggerDelay(index, step = STEP_MS) {
  if (index <= 0) return 0;
  const eased = step * Math.pow(index, EXPONENT);
  const jitter = ((index * 37) % 11) - 5; // fixed jitter, not a metronome
  return Math.max(0, Math.min(MAX_MS, Math.round(eased + jitter)));
}

export const stagger = (index, step) => ({ "--delay": `${staggerDelay(index, step)}ms` });
