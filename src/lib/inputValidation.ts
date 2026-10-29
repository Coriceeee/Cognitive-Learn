/** Shared UI-only validation. Never interpret a missing or invalid value as a measured zero. */
export function readNumber(value: string, min: number, max: number, integer = false): number | null {
  if (value.trim() === "") return null;
  const normalized = value.trim().replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) return null;
  return n;
}

export function isBlankOrValid(value: string, min: number, max: number, integer = false): boolean {
  return value.trim() === "" || readNumber(value, min, max, integer) !== null;
}

export function allValid(values: Array<[string, number, number, boolean?]>): boolean {
  return values.every(([value, min, max, integer]) => readNumber(value, min, max, integer) !== null);
}
