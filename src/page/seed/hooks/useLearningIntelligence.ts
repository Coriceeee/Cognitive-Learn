import { useMemo } from "react";

import type {
  StudentProfile,
  CognitiveResult,
} from "../types";

import {
  calculateLumenIntelligence,
} from "../../../engines/lumen/lumenEngine";

export function useLearningIntelligence(
  profile: StudentProfile,
  cognitive: CognitiveResult
) {
  return useMemo(
    () =>
      calculateLumenIntelligence(
        profile,
        cognitive
      ),
    [profile, cognitive]
  );
}
