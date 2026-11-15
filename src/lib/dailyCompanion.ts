/** CLA Daily Companion v1: account settings and self-reported daily check-ins.
 * This module has NO background push transport. All times are device-local.
 */
export type ReminderKind = "morning" | "study" | "checkIn";
export type ReminderSchedule = Record<ReminderKind, string>;
export type DailyCompanionData = {
  userId: string;
  schemaVersion: 1;
  enabled: boolean;
  schedule: ReminderSchedule;
  quietStart: string;
  quietEnd: string;
  completedDays: string[];
};
export const DEFAULT_COMPANION: Omit<DailyCompanionData, "userId"> = {
  schemaVersion: 1,
  enabled: false,
  schedule: { morning: "07:00", study: "19:30", checkIn: "21:00" },
  quietStart: "22:00",
  quietEnd: "06:30",
  completedDays: [],
};
export const REMINDER_LABELS: Record<ReminderKind, string> = {
  morning: "Xem kế hoạch hôm nay", study: "Đến giờ học theo lịch", checkIn: "Ghi nhận tiến độ cuối ngày",
};
export function isClock(value: unknown): value is string {
  return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}
export function localDateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
export function isDayKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const test = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(test.getTime()) && test.toISOString().slice(0, 10) === value;
}
export function isCompanionData(value: unknown, owner: string): value is DailyCompanionData {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  const schedule = data.schedule as Record<string, unknown> | null;
  return data.userId === owner && data.schemaVersion === 1 && typeof data.enabled === "boolean"
    && schedule !== null && schedule !== undefined && typeof schedule === "object" && !Array.isArray(schedule)
    && Object.keys(schedule).sort().join(",") === "checkIn,morning,study"
    && isClock(schedule.morning) && isClock(schedule.study) && isClock(schedule.checkIn)
    && isClock(data.quietStart) && isClock(data.quietEnd)
    && Array.isArray(data.completedDays) && data.completedDays.length <= 14
    && data.completedDays.every(isDayKey)
    && new Set(data.completedDays).size === data.completedDays.length;
}
function minutes(clock: string): number { const [h, m] = clock.split(":").map(Number); return h * 60 + m; }
/** Quiet periods can cross midnight; equal endpoints mean disabled. */
export function isQuietTime(clock: string, start: string, end: string): boolean {
  if (![clock, start, end].every(isClock)) return true;
  const now = minutes(clock), from = minutes(start), to = minutes(end);
  if (from === to) return false;
  return from < to ? now >= from && now < to : now >= from || now < to;
}
export function reminderDue(settings: DailyCompanionData, at: Date): ReminderKind[] {
  if (!settings.enabled || !Number.isFinite(at.getTime())) return [];
  const now = `${String(at.getHours()).padStart(2,"0")}:${String(at.getMinutes()).padStart(2,"0")}`;
  if (isQuietTime(now, settings.quietStart, settings.quietEnd)) return [];
  if (settings.completedDays.includes(localDateKey(at))) return [];
  return (["morning", "study", "checkIn"] as ReminderKind[]).filter(kind => settings.schedule[kind] === now);
}
/** Keep at most 14 daily self-check-in keys, sorted, with no duplicates. */
export function recordDailyCheckIn(days: string[], dateKey: string): string[] {
  if (!isDayKey(dateKey) || !Array.isArray(days) || !days.every(isDayKey)) throw new Error("Ngày check-in không hợp lệ.");
  return [...new Set([...days, dateKey])].sort().slice(-14);
}
export function recentDailyDates(now: Date, count = 7): string[] {
  if (!Number.isInteger(count) || count < 1 || count > 14) throw new Error("Khoảng ngày không hợp lệ.");
  return Array.from({length: count}, (_, index) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (count - index - 1), 12);
    return localDateKey(d);
  });
}
