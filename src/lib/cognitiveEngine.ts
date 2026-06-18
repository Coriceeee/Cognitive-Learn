type Profile = {
  gpa10?: number;
  gpa11?: number;
  gpa12?: number;

  studyHoursPerWeek?: number;
  practiceTestsPerWeek?: number;
  planCompletionRate?: number;
  motivationLevel?: number;
};

export function calculateCognitive(profile: Profile) {
  const gpa =
    ((profile.gpa10 || 0) +
      (profile.gpa11 || 0) +
      (profile.gpa12 || 0)) /
    3;

  const SCI = Math.min(
    100,
    Math.round(gpa * 10 + (profile.planCompletionRate || 0) * 0.7)
  );

  const MAS = Math.min(
    100,
    Math.round(
      (profile.motivationLevel || 0) * 0.8 +
        (profile.studyHoursPerWeek || 0) * 3
    )
  );

  const CSL = Math.min(
    100,
    Math.round(
      (profile.practiceTestsPerWeek || 0) * 5 +
        (profile.planCompletionRate || 0) * 0.5
    )
  );

  let riskLevel = "LOW";

  const avg = (SCI + MAS + CSL) / 3;

  if (avg < 40) riskLevel = "HIGH";
  else if (avg < 70) riskLevel = "MEDIUM";
  else riskLevel = "LOW";

  const trend =
    (profile.gpa12 || 0) - (profile.gpa10 || 0);

  return {
    SCI,
    MAS,
    CSL,
    riskLevel,
    trend: Number(trend.toFixed(2)),
  };
}