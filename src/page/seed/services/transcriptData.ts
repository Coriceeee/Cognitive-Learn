import {
  calculateProvisionalAverage,
  calculateSemesterAverage,
  summarizeSemesterScores,
  calculateYearAverage,
  type ScoreRow,
  type SemesterScoreSummary,
} from "../../../engines/academic-semester-engine";

export type GradeKey = "grade10" | "grade11" | "grade12";
export type SemesterKey = "semester1" | "semester2";
export const GRADES: { key: GradeKey; name: string }[] = [
  { key: "grade10", name: "Lớp 10" },
  { key: "grade11", name: "Lớp 11" },
  { key: "grade12", name: "Lớp 12" },
];
export const SEMESTERS: { key: SemesterKey; name: string }[] = [
  { key: "semester1", name: "Học kỳ I" },
  { key: "semester2", name: "Học kỳ II" },
];
export type SubjectGrade = {
  subject: string;
  row: ScoreRow;
  average: number | null;
  provisional: number | null;
  status: "MISSING" | "PARTIAL" | "COMPLETE";
};
export type TermGrade = {
  grade: GradeKey;
  semester: SemesterKey;
  summary: SemesterScoreSummary;
  subjects: SubjectGrade[];
};
export type TranscriptView = {
  terms: TermGrade[];
  subjects: string[];
  yearly: Record<GradeKey, number | null>;
  updatedAt: Date | null;
};

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
function scoreString(value: unknown): string {
  // Preserve a real zero; do not turn missing or invalid values into zero.
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}
function safeRow(value: unknown): ScoreRow {
  const row = asObject(value);
  return {
    regular: Array.isArray(row.regular) ? row.regular.slice(0, 5).map(scoreString) : [],
    midterm: scoreString(row.midterm),
    final: scoreString(row.final),
  };
}
function timestampToDate(value: unknown): Date | null {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const result = value.toDate();
    return result instanceof Date && !Number.isNaN(result.getTime()) ? result : null;
  }
  return null;
}

/** Read the exact existing learning_profiles/{uid}.transcript structure.
 * No migration, duplicated collection, inferred grades or mock values.
 */
export function buildTranscriptView(raw: unknown): TranscriptView {
  const doc = asObject(raw);
  const curriculum = asObject(doc.curriculum);
  const transcript = asObject(doc.transcript);
  const chosen = Array.isArray(curriculum.gradedSubjects)
    ? curriculum.gradedSubjects.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const discovered = GRADES.flatMap(({ key }) => SEMESTERS.flatMap(({ key: term }) =>
    Object.keys(asObject(asObject(transcript[key])[term]))));
  const subjects = [...new Set([...chosen, ...discovered])];
  const terms = GRADES.flatMap(({ key: grade }) => SEMESTERS.map(({ key: semester }): TermGrade => {
    const storedRows = asObject(asObject(transcript[grade])[semester]);
    const rows = subjects.map((subject): SubjectGrade => {
      const row = safeRow(storedRows[subject]);
      const average = calculateSemesterAverage(row);
      const provisional = calculateProvisionalAverage(row);
      return { subject, row, average, provisional,
        status: average !== null ? "COMPLETE" : provisional !== null ? "PARTIAL" : "MISSING" };
    });
    return { grade, semester, subjects: rows, summary: summarizeSemesterScores(rows.map(item => item.row)) };
  }));
  const yearly = {} as Record<GradeKey, number | null>;
  GRADES.forEach(({ key }) => {
    const s1 = terms.find(t => t.grade === key && t.semester === "semester1")!;
    const s2 = terms.find(t => t.grade === key && t.semester === "semester2")!;
    yearly[key] = calculateYearAverage(s1.summary, s2.summary);
  });
  return { terms, subjects, yearly, updatedAt: timestampToDate(doc.updatedAt) };
}

/** Select observed grades from newest available term; do not invent deltas. */
export function getLatestSubjectGrades(view: TranscriptView): Array<SubjectGrade & { label: string }> {
  const newestFirst = [...view.terms].reverse();
  return view.subjects.flatMap(subject => {
    const term = newestFirst.find(t => t.subjects.some(row => row.subject === subject && row.provisional !== null));
    if (!term) return [];
    const row = term.subjects.find(r => r.subject === subject)!;
    const grade = GRADES.find(g => g.key === term.grade)!.name;
    const semester = SEMESTERS.find(s => s.key === term.semester)!.name;
    return [{ ...row, label: `${grade} · ${semester}${row.status === "PARTIAL" ? " · tạm tính" : ""}` }];
  });
}
