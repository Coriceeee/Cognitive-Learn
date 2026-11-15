/** CLA Exam Calendar V1 — student-selected dates, never invented by AI.
 * Dates are civil YYYY-MM-DD dates; countdowns do not use elapsed milliseconds
 * (DST and timezone changes must not add/subtract a day).
 */
export const EXAM_CATALOG = [
  { code: "HSA", label: "HSA", detail: "ĐGNL · ĐHQG Hà Nội", portal: "https://www.hsa.edu.vn/trang-chu" },
  { code: "VACT", label: "V-ACT", detail: "ĐGNL · ĐHQG TP.HCM", portal: "" },
  { code: "TSA", label: "TSA", detail: "Đánh giá tư duy · ĐH Bách khoa Hà Nội", portal: "" },
  { code: "VSAT", label: "V-SAT", detail: "Đánh giá đầu vào · theo trường/đợt", portal: "https://www.v-sat.edu.vn/" },
  { code: "THPT", label: "THPT", detail: "Tốt nghiệp THPT", portal: "" },
  { code: "IELTS", label: "IELTS", detail: "Chứng chỉ tiếng Anh", portal: "" },
  { code: "TOEFL", label: "TOEFL", detail: "Chứng chỉ tiếng Anh", portal: "" },
  { code: "SAT", label: "SAT", detail: "Chứng chỉ quốc tế", portal: "" },
  { code: "ACT", label: "ACT", detail: "Chứng chỉ quốc tế", portal: "" },
  { code: "OTHER", label: "Kỳ thi khác", detail: "Tự đặt tên và nhập lịch", portal: "" },
] as const;

export type ExamCode = typeof EXAM_CATALOG[number]["code"];
export const EXAM_CALENDAR_STORAGE_VERSION = 1;
export const EXAM_CALENDAR_MAX_ITEMS = 20;
export type ExamReminder = {
  id: string;
  code: ExamCode;
  title: string;
  examDate: string; // empty means unconfirmed; never auto-fill an exam date
  registrationDeadline: string;
  registrationDone: boolean;
  sourceUrl: string; // supplied by student, NOT verified by CLA
};
export type ExamCalendarDocument = {
  schemaVersion: 1;
  userId: string;
  events: ExamReminder[];
};
export type ExamMilestone = {
  eventId: string;
  kind: "registration" | "exam";
  day: string;
  days: number;
  label: string;
  title: string;
};

const DAY_MS = 86_400_000;
const DAY_PATTERN = /^(20\d\d)-(\d\d)-(\d\d)$/;
const ID_PATTERN = /^[A-Za-z0-9_-]{6,90}$/;

export function isValidDay(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = DAY_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 2020 || year > 2099 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const result = new Date(Date.UTC(year, month - 1, day));
  return result.getUTCFullYear() === year && result.getUTCMonth() === month - 1 && result.getUTCDate() === day;
}

export function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function utcDay(key: string): number {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysUntil(day: string, today: string): number | null {
  if (!isValidDay(day) || !isValidDay(today)) return null;
  return Math.round((utcDay(day) - utcDay(today)) / DAY_MS);
}

export function safeExamUrl(raw: unknown): string {
  if (typeof raw !== "string" || raw.length > 600) return "";
  if (!raw.trim()) return "";
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
}

export function isExamReminder(raw: unknown): raw is ExamReminder {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const item = raw as Record<string, unknown>;
  if (typeof item.id !== "string" || !ID_PATTERN.test(item.id)) return false;
  if (!EXAM_CATALOG.some(option => option.code === item.code)) return false;
  if (typeof item.title !== "string" || item.title.length > 100) return false;
  if (item.code === "OTHER" && !item.title.trim()) return false;
  if (typeof item.examDate !== "string" || (item.examDate !== "" && !isValidDay(item.examDate))) return false;
  if (typeof item.registrationDeadline !== "string" || (item.registrationDeadline !== "" && !isValidDay(item.registrationDeadline))) return false;
  if (item.examDate && item.registrationDeadline && item.registrationDeadline > item.examDate) return false;
  if (typeof item.registrationDone !== "boolean") return false;
  if (typeof item.sourceUrl !== "string" || item.sourceUrl.length > 600) return false;
  if (item.sourceUrl && !safeExamUrl(item.sourceUrl)) return false;
  return true;
}

export function isExamCalendarDocument(raw: unknown, uid: string): raw is ExamCalendarDocument {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const data = raw as Record<string, unknown>;
  if (data.schemaVersion !== EXAM_CALENDAR_STORAGE_VERSION || data.userId !== uid ||
      !Array.isArray(data.events) || data.events.length > EXAM_CALENDAR_MAX_ITEMS) return false;
  const ids = new Set<string>();
  for (const event of data.events) {
    if (!isExamReminder(event) || ids.has(event.id)) return false;
    ids.add(event.id);
  }
  return true;
}

export function createExamReminder(code: ExamCode, id: string): ExamReminder {
  const option = EXAM_CATALOG.find(x => x.code === code);
  if (!option || !ID_PATTERN.test(id)) throw new Error("Kỳ thi hoặc mã bản ghi không hợp lệ.");
  return { id, code, title: code === "OTHER" ? "Kỳ thi của tôi" : option.label,
    examDate: "", registrationDeadline: "", registrationDone: false, sourceUrl: "" };
}

export function upsertExamReminder(items: ExamReminder[], next: ExamReminder): ExamReminder[] {
  if (!isExamReminder(next)) throw new Error("Ngày, tên hoặc đường dẫn không hợp lệ. Hạn đăng ký không được sau ngày thi.");
  const index = items.findIndex(x => x.id === next.id);
  if (index < 0 && items.length >= EXAM_CALENDAR_MAX_ITEMS) throw new Error("Đã đạt tối đa 20 đợt thi.");
  return index < 0 ? [...items, next] : items.map(x => x.id === next.id ? next : x);
}

export function examMilestones(items: ExamReminder[], today: string): ExamMilestone[] {
  if (!isValidDay(today)) return [];
  const result: ExamMilestone[] = [];
  for (const item of items) {
    if (!isExamReminder(item)) continue;
    const name = item.title.trim() || EXAM_CATALOG.find(x => x.code === item.code)?.label || "Kỳ thi";
    for (const [kind, day] of [["registration", item.registrationDone ? "" : item.registrationDeadline], ["exam", item.examDate]] as const) {
      const days = daysUntil(day, today);
      if (days === null) continue;
      result.push({ eventId: item.id, kind, day, days, label: kind === "registration" ? "Hạn đăng ký" : "Ngày thi", title: name });
    }
  }
  return result.sort((a,b) => {
    const aRank = a.days >= 0 ? a.days : Number.MAX_SAFE_INTEGER;
    const bRank = b.days >= 0 ? b.days : Number.MAX_SAFE_INTEGER;
    return aRank - bRank || a.day.localeCompare(b.day) || a.title.localeCompare(b.title);
  });
}

export function nextExamMilestone(items: ExamReminder[], today: string): ExamMilestone | null {
  return examMilestones(items, today).find(m => m.days >= 0) ?? null;
}

/** In-app messages, no background push or misleading claims of official dates. */
export function examAlerts(items: ExamReminder[], today: string): ExamMilestone[] {
  return examMilestones(items, today).filter(m => m.days >= 0 && m.days <= 14);
}

export function formatExamDate(value: string): string {
  if (!isValidDay(value)) return "Chưa nhập ngày";
  const [year,month,day] = value.split("-");
  return `${day}/${month}/${year}`;
}
