/**
 * Atlas Subject Optimizer, policy 2026 (decision support, not an application).
 * A confirmed grade-12 course set is an explicit user input. School scores alone
 * do not certify that the pupil took those courses in grade 12.
 *
 * Sources: 02/VBHN-BGDĐT (2026), Articles 3 and 20, on the Government portal.
 * An admission combination in this project's nine-code *exploratory* catalog
 * is not evidence that any particular university accepts it.
 */
import type { SubjectCode, SubjectScoreMap } from "./admissionTypes";
import { admissionCombinations } from "./examMethodRules";

export type ExamElective2026 =
  | Exclude<SubjectCode, "math" | "literature" | "technology">
  | "technologyIndustry"
  | "technologyAgriculture";

export type SourceVerifiedProgram = {
  id: string;
  majorName: string;
  combinations: readonly string[];
};

export const EXAM_POLICY_2026 = {
  year: 2026,
  compulsory: ["math", "literature"] as const,
  electiveCount: 2,
  policySource: "https://xaydungchinhsach.chinhphu.vn/van-ban-hop-nhat-so-02-vbhn-bgddt-quy-che-thi-tot-nghiep-trung-hoc-pho-thong-119260419130804242.htm",
  reference: "Văn bản hợp nhất 02/VBHN-BGDĐT (2026), Điều 3 và Điều 20",
} as const;

export const EXAM_ELECTIVES_2026: ReadonlyArray<{code: ExamElective2026; label: string; scoreSubject: SubjectCode | null}> = [
  {code: "english", label: "Tiếng Anh", scoreSubject: "english"},
  {code: "physics", label: "Vật lý", scoreSubject: "physics"},
  {code: "chemistry", label: "Hóa học", scoreSubject: "chemistry"},
  {code: "biology", label: "Sinh học", scoreSubject: "biology"},
  {code: "history", label: "Lịch sử", scoreSubject: "history"},
  {code: "geography", label: "Địa lý", scoreSubject: "geography"},
  {code: "civicEducation", label: "Giáo dục kinh tế và pháp luật", scoreSubject: "civicEducation"},
  {code: "informatics", label: "Tin học", scoreSubject: "informatics"},
  {code: "technologyIndustry", label: "Công nghệ Công nghiệp", scoreSubject: null},
  {code: "technologyAgriculture", label: "Công nghệ Nông nghiệp", scoreSubject: null},
];

export type ExamChoiceOption = {
  id: string;
  electives: [ExamElective2026, ExamElective2026];
  labels: [string, string];
  bothElectiveScoresObserved: boolean;
  electiveScoreSum: number | null;
  exploratoryCombinations: string[];
  completedCombinations: { code: string; score: number }[];
  sourceVerifiedMatches: { programId: string; majorName: string; combinations: string[] }[];
  limitations: string[];
};

export type ExamChoiceReport = {
  year: 2026;
  status: "NEED_COURSE_CONFIRMATION" | "READY_FOR_EXPLORATION";
  options: ExamChoiceOption[];
  warnings: string[];
  verifiedTargetAvailable: boolean;
};

const knownElectives = new Set(EXAM_ELECTIVES_2026.map(item => item.code));
const labelFor = (code: ExamElective2026) => EXAM_ELECTIVES_2026.find(x => x.code === code)?.label ?? code;
const scoreSubjectFor = (code: ExamElective2026) => EXAM_ELECTIVES_2026.find(x => x.code === code)?.scoreSubject ?? null;
const observed = (value: number | undefined) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 10;
const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").trim().toLowerCase();

export function makeExamPairKey(pair: readonly ExamElective2026[]): string {
  return [...pair].sort().join("+");
}

/**
 * Recommends *candidate* two-elective sets. Eligibility relies on the learner's
 * explicit grade-12 confirmation; foreign-language exceptions are not inferred.
 * Numeric comparisons only compare observed points in the same input score basis.
 */
export function optimizeExamChoices2026(input: {
  confirmedGrade12Subjects: readonly ExamElective2026[];
  subjectScores: SubjectScoreMap;
  targetMajor?: string;
  verifiedPrograms?: readonly SourceVerifiedProgram[];
}): ExamChoiceReport {
  const warnings: string[] = [];
  const confirmed = Array.from(new Set(input.confirmedGrade12Subjects))
    .filter(code => knownElectives.has(code));
  if (confirmed.length !== input.confirmedGrade12Subjects.length) {
    warnings.push("Môn bị trùng/không thuộc danh mục năm 2026 đã được bỏ qua.");
  }
  if (confirmed.includes("technologyIndustry") && confirmed.includes("technologyAgriculture")) {
    warnings.push("Đã chọn cả hai định hướng Công nghệ. Hãy kiểm tra định hướng thực tế trong hồ sơ lớp 12.");
  }
  if (confirmed.length < 2) {
    warnings.push("Cần xác nhận ít nhất hai môn tự chọn học ở lớp 12; điểm học bạ không tự chứng minh môn đã học.");
    return {year: 2026, status: "NEED_COURSE_CONFIRMATION", options: [], warnings, verifiedTargetAvailable: false};
  }
  const target = normalize(input.targetMajor ?? "");
  const verifiedMatches = (input.verifiedPrograms ?? []).filter(
    program => !target || normalize(program.majorName).includes(target)
  );
  if (target && verifiedMatches.length === 0) {
    warnings.push("Chưa có chương trình đã được duyệt nguồn khớp ngành mục tiêu; không khẳng định trường nào nhận tổ hợp.");
  }
  warnings.push("Chỉ so sánh 9 tổ hợp trong danh mục thử nghiệm; chưa đại diện cho mọi tổ hợp tuyển sinh 2026.");
  warnings.push("Điểm học bạ/thi thử chỉ dùng khám phá; không phải xác suất trúng tuyển hoặc điều kiện xét tuyển chính thức.");
  const choices: ExamChoiceOption[] = [];
  for (let i = 0; i < confirmed.length; i++) {
    for (let j = i + 1; j < confirmed.length; j++) {
      const pair = [confirmed[i], confirmed[j]] as [ExamElective2026, ExamElective2026];
      const subjects = new Set<SubjectCode>(["math", "literature"]);
      const scoreSubjects = pair.map(scoreSubjectFor);
      for (const code of scoreSubjects) if (code) subjects.add(code);
      const validCombinations = admissionCombinations.filter(c => c.subjects.every(s => subjects.has(s)));
      const completedCombinations = validCombinations.flatMap(combo => {
        if (!combo.subjects.every(s => observed(input.subjectScores[s]))) return [];
        return [{code: combo.code, score: Math.round(combo.subjects.reduce((sum, s) => sum + input.subjectScores[s]!, 0) * 100) / 100}];
      });
      const bothElectiveScoresObserved = scoreSubjects.every(code => code && observed(input.subjectScores[code]));
      const electiveScoreSum = bothElectiveScoresObserved
        ? Math.round(scoreSubjects.reduce((sum, code) => sum + input.subjectScores[code!]!, 0) * 100) / 100
        : null;
      const sourceVerifiedMatches = verifiedMatches.flatMap(program => {
        const matches = validCombinations.filter(combo => program.combinations.includes(combo.code)).map(combo => combo.code);
        return matches.length ? [{programId: program.id, majorName: program.majorName, combinations: matches}] : [];
      });
      const limitations = [
        ...(bothElectiveScoresObserved ? [] : ["Thiếu điểm quan sát của một hoặc cả hai môn tự chọn."]),
        ...(validCombinations.length ? [] : ["Chưa có tổ hợp phù hợp trong danh mục 9 mã thử nghiệm; không có nghĩa là không được xét tuyển."]),
        ...((pair.includes("technologyIndustry") || pair.includes("technologyAgriculture")) ? ["Chưa có điểm tách theo định hướng Công nghệ; không lấy điểm Công nghệ chung để quy đổi."] : []),
      ];
      choices.push({
        id: makeExamPairKey(pair), electives: pair, labels: pair.map(labelFor) as [string, string],
        bothElectiveScoresObserved, electiveScoreSum,
        exploratoryCombinations: validCombinations.map(c => c.code),
        completedCombinations, sourceVerifiedMatches, limitations,
      });
    }
  }
  choices.sort((a, b) =>
    b.sourceVerifiedMatches.length - a.sourceVerifiedMatches.length ||
    b.exploratoryCombinations.length - a.exploratoryCombinations.length ||
    Number(b.bothElectiveScoresObserved) - Number(a.bothElectiveScoresObserved) ||
    (b.electiveScoreSum ?? -1) - (a.electiveScoreSum ?? -1) ||
    a.id.localeCompare(b.id)
  );
  return {year: 2026, status: "READY_FOR_EXPLORATION", options: choices, warnings,
    verifiedTargetAvailable: verifiedMatches.length > 0};
}
