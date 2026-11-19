/** CP29 C4/D3: independent client-side guard; server Rules remain authoritative. */
import { getNineGradedSubjects, isValidElectiveSelection } from "./academicCurriculum.ts";

export type AcademicIdentity = Readonly<{foreignLanguage: string; selectedElectives: readonly string[]}>;

export function parseAcademicIdentity(value: unknown): AcademicIdentity | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const curriculum = value as Record<string, unknown>;
  const foreignLanguage = curriculum.foreignLanguage;
  const electives = curriculum.selectedElectives;
  const graded = curriculum.gradedSubjects;
  if (curriculum.program !== "GDPT 2018"
    || typeof foreignLanguage !== "string" || foreignLanguage.trim() !== foreignLanguage
    || foreignLanguage.length === 0 || foreignLanguage.length > 60
    || !Array.isArray(electives) || !electives.every(item => typeof item === "string")
    || !isValidElectiveSelection(electives) || electives.includes(foreignLanguage)
    || !Array.isArray(graded)) return null;
  const expected = getNineGradedSubjects(foreignLanguage, electives);
  if (graded.length !== expected.length || expected.some((subject, i) => graded[i] !== subject)) return null;
  return {foreignLanguage, selectedElectives: [...electives]};
}

export function sameAcademicIdentity(a: AcademicIdentity, b: AcademicIdentity): boolean {
  return a.foreignLanguage === b.foreignLanguage
    && a.selectedElectives.length === 4 && b.selectedElectives.length === 4
    && a.selectedElectives.every((subject, i) => subject === b.selectedElectives[i]);
}

/** Refuse to persist a historical subject not in the locked 9-subject catalogue. */
export function findForeignTranscriptSubject(
  transcript: unknown, identity: AcademicIdentity,
): string | null {
  if (!transcript || typeof transcript !== "object" || Array.isArray(transcript)) return "transcript";
  const allowed = new Set(getNineGradedSubjects(identity.foreignLanguage, identity.selectedElectives));
  for (const [grade, terms] of Object.entries(transcript)) {
    if (!["grade10", "grade11", "grade12"].includes(grade)
      || !terms || typeof terms !== "object" || Array.isArray(terms)) return grade;
    for (const [term, rows] of Object.entries(terms)) {
      if (!["semester1", "semester2"].includes(term)
        || !rows || typeof rows !== "object" || Array.isArray(rows)) return `${grade}/${term}`;
      for (const subject of Object.keys(rows)) {
        if (!allowed.has(subject)) return `${grade}/${term}/${subject}`;
      }
    }
  }
  return null;
}
