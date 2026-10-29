export type ScoreRow = {
  regular: string[];
  midterm: string;
  final: string;
};

export type SemesterDataStatus = "MISSING" | "PARTIAL" | "COMPLETE";

export type SemesterScoreSummary = {
  status: SemesterDataStatus;
  completedSubjects: number;
  observedSubjects: number;
  expectedSubjects: number;
  gpa: number | null;
  provisionalAverage: number | null;
};

export function parseEnteredScore(value: string): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 10
    ? number
    : null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function average(values: number[]): number | null {
  return values.length
    ? round2(values.reduce((sum, value) => sum + value, 0) / values.length)
    : null;
}

/** Term average based only on observed weights; NOT a finalized term grade. */
export function calculateProvisionalAverage(row: ScoreRow): number | null {
  const regular = row.regular
    .map(parseEnteredScore)
    .filter((x): x is number => x !== null);
  const midterm = parseEnteredScore(row.midterm);
  const final = parseEnteredScore(row.final);
  const weight = regular.length + (midterm !== null ? 2 : 0) + (final !== null ? 3 : 0);
  if (!weight) return null;
  const weightedSum = regular.reduce((sum, x) => sum + x, 0)
    + (midterm ?? 0) * 2 + (final ?? 0) * 3;
  return round2(weightedSum / weight);
}

/** Only calculate a complete term result when TX, GK and CK are all present. */
export function calculateSemesterAverage(row: ScoreRow): number | null {
  const regular = row.regular
    .map(parseEnteredScore)
    .filter((x): x is number => x !== null);
  const midterm = parseEnteredScore(row.midterm);
  const final = parseEnteredScore(row.final);
  if (regular.length === 0 || midterm === null || final === null) return null;
  return round2((regular.reduce((sum, x) => sum + x, 0)
    + midterm * 2 + final * 3) / (regular.length + 5));
}

export function summarizeSemesterScores(rows: ScoreRow[]): SemesterScoreSummary {
  const complete = rows.map(calculateSemesterAverage);
  const observed = rows.map(calculateProvisionalAverage);
  const completedSubjects = complete.filter((x): x is number => x !== null).length;
  const observedSubjects = observed.filter((x): x is number => x !== null).length;
  const expectedSubjects = rows.length;
  const status: SemesterDataStatus = observedSubjects === 0
    ? "MISSING"
    : completedSubjects === expectedSubjects
      ? "COMPLETE"
      : "PARTIAL";
  return {
    status,
    completedSubjects,
    observedSubjects,
    expectedSubjects,
    gpa: status === "COMPLETE" ? average(complete as number[]) : null,
    provisionalAverage: average(observed.filter((x): x is number => x !== null)),
  };
}

/** Requires BOTH completed semester summaries; the second term has weight 2. */
export function calculateYearAverage(
  firstSemester: SemesterScoreSummary,
  secondSemester: SemesterScoreSummary,
): number | null {
  if (firstSemester.gpa === null || secondSemester.gpa === null) return null;
  return round2((firstSemester.gpa + 2 * secondSemester.gpa) / 3);
}

/** Describes completed years only, never the final 3-year GPA until all are present. */
export function calculateCompletedYearsAverage(yearAverages: Array<number | null>): number | null {
  return average(yearAverages.filter((x): x is number => x !== null));
}
