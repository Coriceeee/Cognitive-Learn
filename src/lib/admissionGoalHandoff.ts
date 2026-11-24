/** Explicit, short-lived in-memory handoff. No database writes, URL parameters or browser storage.
 * A preference is not an eligibility result or a score target. */
export type AdmissionGoal = { majorName: string; universityName: string; majorCode: string; year: number };
type PendingGoal = { uid: string; goal: AdmissionGoal; createdAt: number; expires: number };
let pending: PendingGoal | null = null;
export function stageAdmissionGoal(uid: string, goal: AdmissionGoal, now = Date.now()): boolean {
  pending = null;
  if (!uid || !Number.isFinite(now) || !Number.isInteger(goal.year) || goal.year < 2000 || goal.year > 2100) return false;
  const majorName = goal.majorName.trim().slice(0, 120), universityName = goal.universityName.trim().slice(0, 120), majorCode = goal.majorCode.trim().slice(0, 30);
  if (!majorName || !universityName || !majorCode) return false;
  pending = { uid, goal: { majorName, universityName, majorCode, year: goal.year }, createdAt: now, expires: now + 5 * 60_000 };
  return true;
}
export function readAdmissionGoal(uid: string, now = Date.now()): AdmissionGoal | null {
  if (!pending) return null;
  if (!uid || pending.uid !== uid || !Number.isFinite(now) || now < pending.createdAt || now >= pending.expires) { pending = null; return null; }
  return { ...pending.goal };
}
export function clearAdmissionGoal(): void { pending = null; }
export function formatAdmissionGoal(goal: AdmissionGoal): string {
  const suffix = ` (${goal.majorCode}, ${goal.year})`;
  const available = 120 - suffix.length;
  const name = `${goal.majorName} · ${goal.universityName}`;
  return (name.length > available ? name.slice(0, available - 1) + "…" : name) + suffix;
}
