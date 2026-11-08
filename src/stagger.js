// delay in ms for the i-th list item: gaps shrink as i grows, capped at MAX_MS
// (index 1 -> 54, 2 -> 100, 4 -> 171, 8 -> 308, 16+ -> 520)
const STEP_MS = 55;
const EXPONENT = 0.82;
const MAX_MS = 520;

export function staggerDelay(index, step = STEP_MS) {
  if (index <= 0) return 0;
  const eased = step * Math.pow(index, EXPONENT);
  const jitter = ((index * 37) % 11) - 5; // -5..+5 ms, deterministic
  return Math.max(0, Math.min(MAX_MS, Math.round(eased + jitter)));
}

// for things that mount together (skeletons)
export const stagger = (index, step) => ({ "--delay": `${staggerDelay(index, step)}ms` });
