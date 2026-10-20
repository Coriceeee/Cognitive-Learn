import { useMemo } from "react";

import type { StudentProfile, CognitiveResult } from "../types";
import type { CognitiveGrowthAnalytics } from "../../../engines/history/cognitiveGrowthAnalytics";
import { calculateLumenIntelligence } from "../../../engines/lumen/lumenEngine";

/** Shared, pure Lumen calculation for Student Dashboard.
 * `growth` comes from the Firestore-backed useStudentProfile hook.
 */
export function useLearningIntelligence(
  profile: StudentProfile,
  cognitive: CognitiveResult,
  growth?: CognitiveGrowthAnalytics | null
) {
  return useMemo(
    () => calculateLumenIntelligence(profile, cognitive, growth),
    [profile, cognitive, growth]
  );
}
