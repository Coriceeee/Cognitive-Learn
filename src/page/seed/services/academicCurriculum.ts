export const NATIONAL_DEFENSE_SUBJECT = "Giáo dục quốc phòng và an ninh";

export const ELECTIVE_SUBJECTS = [
  "Vật lý",
  "Hóa học",
  "Sinh học",
  "Địa lý",
  "Giáo dục kinh tế và pháp luật",
  "Tin học",
  "Công nghệ",
  "Âm nhạc",
  "Mĩ thuật",
] as const;

export const COMPULSORY_GRADED_SUBJECTS = [
  "Toán",
  "Ngữ văn",
  "Lịch sử",
  NATIONAL_DEFENSE_SUBJECT,
] as const;

export function isValidElectiveSelection(items: readonly string[]): boolean {
  return items.length === 4
    && new Set(items).size === 4
    && items.every(item => (ELECTIVE_SUBJECTS as readonly string[]).includes(item));
}

export function getNineGradedSubjects(foreignLanguage: string, electives: readonly string[]): string[] {
  return ["Toán", "Ngữ văn", foreignLanguage, "Lịch sử", NATIONAL_DEFENSE_SUBJECT, ...electives];
}
