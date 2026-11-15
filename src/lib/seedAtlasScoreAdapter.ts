/**
 * Read-only bridge: Seed semester averages -> Atlas exploratory subject scores.
 * Never turns a partial grade into a completed grade, combines different terms,
 * or represents school marks as official THPT exam results.
 */
import type { SubjectCode, SubjectScoreMap } from "./admissionTypes";
import { admissionCombinations } from "./examMethodRules";
import type { TermGrade, TranscriptView } from "../page/seed/services/transcriptData";

export const SEED_ATLAS_SUBJECT_CODES: Readonly<Record<string, SubjectCode>> = {
  "Toán": "math",
  "Ngữ văn": "literature",
  "Tiếng Anh": "english",
  "Vật lý": "physics",
  "Hóa học": "chemistry",
  "Sinh học": "biology",
  "Lịch sử": "history",
  "Địa lý": "geography",
  "Giáo dục kinh tế và pháp luật": "civicEducation",
  "Tin học": "informatics",
  "Công nghệ": "technology",
};

export type SeedAtlasScoreSnapshot = {
  termId: string;
  termLabel: string;
  scores: SubjectScoreMap;
  completedSubjectCount: number;
  availableCombinations: string[];
  skippedPartialSubjects: string[];
  unsupportedSubjects: string[];
  source: "seed_school_transcript";
};

function termLabel(term: TermGrade): string {
  const grade = { grade10: "10", grade11: "11", grade12: "12" }[term.grade];
  const semester = term.semester === "semester1" ? "I" : "II";
  return `Lớp ${grade} · Học kỳ ${semester}`;
}

export function toSeedAtlasScoreSnapshot(term: TermGrade): SeedAtlasScoreSnapshot {
  const scores: SubjectScoreMap = {};
  const skippedPartialSubjects: string[] = [];
  const unsupportedSubjects: string[] = [];
  for (const row of term.subjects) {
    const code = SEED_ATLAS_SUBJECT_CODES[row.subject];
    if (!code) {
      if (row.provisional !== null) unsupportedSubjects.push(row.subject);
      continue;
    }
    // Only a finished semester average qualifies as a school observation.
    // 0 is valid; neither missing nor partially entered values are silently used.
    if (row.status === "COMPLETE" && row.average !== null &&
        Number.isFinite(row.average) && row.average >= 0 && row.average <= 10) {
      scores[code] = row.average;
    } else if (row.status === "PARTIAL" || row.average !== null) {
      skippedPartialSubjects.push(row.subject);
    }
  }
  const availableCombinations = admissionCombinations
    .filter(combo => combo.subjects.every(subject => scores[subject] !== undefined))
    .map(combo => combo.code);
  return {
    termId: `${term.grade}:${term.semester}`,
    termLabel: termLabel(term),
    scores,
    completedSubjectCount: Object.keys(scores).length,
    availableCombinations,
    skippedPartialSubjects,
    unsupportedSubjects,
    source: "seed_school_transcript",
  };
}

/** Prefer newest term with a fully observed supported combination; never mix terms. */
export function chooseSeedAtlasScoreSnapshot(view: TranscriptView): SeedAtlasScoreSnapshot | null {
  const candidates = [...view.terms].reverse().map(toSeedAtlasScoreSnapshot);
  return candidates.find(item => item.availableCombinations.length > 0)
    ?? candidates.find(item => item.completedSubjectCount > 0)
    ?? null;
}
