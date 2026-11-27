/** Shared UI-only validation. Never interpret a missing or invalid value as a measured zero. */
export function readNumber(value: unknown, min: number, max: number, integer = false): number | null {
  // Missing dynamic subject keys are normal for a newly selected Seed curriculum.
  // Treat them as incomplete input, never as a runtime exception or measured zero.
  if (typeof value !== "string" || value.trim() === "") return null;
  const normalized = value.trim().replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) return null;
  return n;
}

export function isBlankOrValid(value: unknown, min: number, max: number, integer = false): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== "string") return false;
  return value.trim() === "" || readNumber(value, min, max, integer) !== null;
}

export function allValid(values: Array<[unknown, number, number, boolean?]>): boolean {
  return values.every(([value, min, max, integer]) => readNumber(value, min, max, integer) !== null);
}
