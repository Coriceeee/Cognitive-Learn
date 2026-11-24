/**
 * Seed profile numeric input boundary: guard against impossible/unparseable
 * values before committing profile, transcript and cognitive snapshot together.
 * Empty supplemental behavior and financial fields remain missing values; only explicit 0 is observed zero.
 */
export type SeedNumericField =
  | "studyHoursPerWeek"
  | "practiceTestsPerWeek"
  | "planCompletionRate"
  | "goalSwitchFrequency"
  | "taskAbandonmentRate"
  | "contextSwitchRate"
  | "learningStrategy"
  | "motivationLevel"
  | "educationBudget"
  | "maxTuition";

const rules: readonly {
  key: SeedNumericField;
  label: string;
  required: boolean;
  max?: number;
  integer?: boolean;
}[] = [
  { key: "studyHoursPerWeek", label: "Số giờ học mỗi tuần", required: true, max: 168 },
  { key: "practiceTestsPerWeek", label: "Số đề luyện mỗi tuần", required: true, integer: true },
  { key: "planCompletionRate", label: "Mức hoàn thành kế hoạch", required: true, max: 100 },
  { key: "goalSwitchFrequency", label: "Số lần đổi mục tiêu/tháng", required: false, integer: true },
  { key: "taskAbandonmentRate", label: "Tỷ lệ bỏ dở nhiệm vụ", required: false, max: 100 },
  { key: "contextSwitchRate", label: "Tỷ lệ chuyển đổi tác vụ", required: false, max: 100 },
  { key: "learningStrategy", label: "Mức sử dụng chiến lược học tập", required: true, max: 100 },
  { key: "motivationLevel", label: "Mức động lực", required: true, max: 100 },
  { key: "educationBudget", label: "Ngân sách giáo dục", required: false },
  { key: "maxTuition", label: "Mức học phí tối đa/năm", required: false },
];

/** Return the first actionable error or null when all fields are valid. */
export function validateSeedNumericInput(values: Record<SeedNumericField, string>): string | null {
  for (const rule of rules) {
    const raw = values[rule.key].trim();
    if (!raw) {
      if (rule.required) return `Vui lòng nhập ${rule.label.toLowerCase()}.`;
      continue;
    }
    const normalized = raw.replace(",", ".");
    // Avoid scientific notation and silent coercion of non-numeric tokens.
    if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalized)) {
      return `${rule.label} phải là số không âm hợp lệ.`;
    }
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return `${rule.label} phải là số không âm hợp lệ.`;
    }
    if (rule.integer && !Number.isSafeInteger(parsed)) {
      return `${rule.label} phải là số lần nguyên không âm.`;
    }
    if (rule.max !== undefined && parsed > rule.max) {
      return `${rule.label} không được vượt quá ${rule.max}.`;
    }
  }
  return null;
}
