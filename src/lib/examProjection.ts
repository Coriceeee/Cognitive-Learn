/** Transparent two-mock-exam baseline; NOT a validated ML forecast.
 * Equal weighting avoids extrapolating a trend from just two observations.
 * Missing marks remain missing, and zero is valid. */
import { parseSubjectScore } from './scoreConversionEngine.ts';
export const EXAM_PROJECTION_VERSION = 'mock-mean-v1';
export function projectExamScore(previous: unknown, latest: unknown): number | undefined {
  const a = parseSubjectScore(previous), b = parseSubjectScore(latest);
  if (a === undefined || b === undefined) return undefined;
  return Math.round((a + b) * 50) / 100;
}
