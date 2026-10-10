import type { CognitiveResult } from "../cognitive/cognitiveEngine";
import type { StudentProfile } from "../../page/seed/types";
import type {
  CareerProfile,
  CareerMatch,
  CareerGap,
  CareerStrength,
} from "./careerTypes";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function goalAlignment(
  targetMajor: string,
  career: CareerProfile
): number {
  const target = normalizeText(targetMajor);

  if (!target || target === "--") {
    return 50;
  }

  const matched = career.keywords.some(
    (keyword) =>
      target.includes(normalizeText(keyword)) ||
      normalizeText(keyword).includes(target)
  );

  return matched ? 100 : 45;
}

function cognitiveScore(
  cognitive: CognitiveResult,
  career: CareerProfile
): number {
  const vector = cognitive.vector;

  let weightedScore = 0;
  let totalWeight = 0;

  for (const [code, weight] of Object.entries(
    career.cognitiveWeights
  )) {
    const value =
      vector[code as keyof typeof vector];

    if (
      typeof value !== "number" ||
      typeof weight !== "number"
    ) {
      continue;
    }

    weightedScore += value * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return 50;
  }

  return clamp(weightedScore / totalWeight);
}

function academicScore(
  profile: StudentProfile
): number {
  if (profile.gpaOverall <= 0) {
    return 50;
  }

  return clamp(profile.gpaOverall * 10);
}

function behaviorScore(
  profile: StudentProfile
): number {
  const completion = clamp(
    profile.planCompletionRate
  );

  const studyHours =
    (Math.min(profile.studyHoursPerWeek, 40) /
      40) *
    100;

  const practice =
    (Math.min(profile.practiceTestsPerWeek, 10) /
      10) *
    100;

  return clamp(
    completion * 0.5 +
      studyHours * 0.3 +
      practice * 0.2
  );
}

function motivationScore(
  profile: StudentProfile
): number {
  return clamp(profile.motivationLevel);
}

function buildStrengths(
  cognitive: CognitiveResult,
  profile: StudentProfile
): CareerStrength[] {
  const strengths: CareerStrength[] = [];

  const dimensions = [
    {
      label: "Tính nhất quán học tập",
      value: cognitive.SCI,
      source: "COGNITIVE" as const,
    },
    {
      label: "Động lực học tập",
      value: cognitive.MAS,
      source: "COGNITIVE" as const,
    },
    {
      label: "Chiến lược nhận thức",
      value: cognitive.CSL,
      source: "COGNITIVE" as const,
    },
    {
      label: "Độ tin cậy nhận thức",
      value: cognitive.CRI,
      source: "COGNITIVE" as const,
    },
    {
      label: "Nền tảng học tập",
      value: academicScore(profile),
      source: "ACADEMIC" as const,
    },
    {
      label: "Tính duy trì kế hoạch",
      value: profile.planCompletionRate,
      source: "BEHAVIOR" as const,
    },
  ];

  dimensions
    .filter((item) => item.value >= 70)
    .sort((a, b) => b.value - a.value)
    .slice(0, 4)
    .forEach((item) => {
      strengths.push({
        label: item.label,
        score: Math.round(item.value),
        source: item.source,
      });
    });

  return strengths;
}

function buildGaps(
  cognitive: CognitiveResult,
  profile: StudentProfile,
  career: CareerProfile
): CareerGap[] {
  const gaps: CareerGap[] = [];
  const vector = cognitive.vector;

  for (const [code] of Object.entries(
    career.cognitiveWeights
  )) {
    const value =
      vector[code as keyof typeof vector];

    if (typeof value !== "number") {
      continue;
    }

    if (value < 60) {
      gaps.push({
        label:
          code === "SCI"
            ? "Tính nhất quán học tập"
            : code === "MAS"
            ? "Động lực học tập"
            : code === "CSL"
            ? "Chiến lược học tập"
            : code === "GVI"
            ? "Ổn định mục tiêu"
            : code === "BDI"
            ? "Ổn định hành vi"
            : code === "FRI"
            ? "Quản lý quá tải"
            : "Độ ổn định nhận thức",
        score: Math.round(value),
        type: "COGNITIVE",
        priority: value < 40 ? "HIGH" : "MEDIUM",
      });
    }
  }

  const academic = academicScore(profile);

  if (academic < 70) {
    gaps.push({
      label: "Nền tảng học tập",
      score: academic,
      type: "ACADEMIC",
      priority: academic < 55 ? "HIGH" : "MEDIUM",
    });
  }

  if (profile.planCompletionRate < 60) {
    gaps.push({
      label: "Khả năng duy trì kế hoạch",
      score: Math.round(
        profile.planCompletionRate
      ),
      type: "BEHAVIOR",
      priority:
        profile.planCompletionRate < 40
          ? "HIGH"
          : "MEDIUM",
    });
  }

  return gaps
    .sort((a, b) => {
      const priority = {
        HIGH: 3,
        MEDIUM: 2,
        LOW: 1,
      };

      return (
        priority[b.priority] -
        priority[a.priority]
      );
    })
    .slice(0, 5);
}

export function scoreCareer(
  profile: StudentProfile,
  cognitive: CognitiveResult,
  career: CareerProfile
): CareerMatch {
  const cognitiveFit = cognitiveScore(
    cognitive,
    career
  );

  const academicFit = academicScore(profile);
  const behaviorFit = behaviorScore(profile);
  const motivationFit =
    motivationScore(profile);

  const goalFit = goalAlignment(
    profile.targetMajor,
    career
  );

  const compatibility = clamp(
    cognitiveFit * 0.35 +
      academicFit * career.academicWeight +
      behaviorFit * career.behaviorWeight +
      motivationFit * career.motivationWeight +
      goalFit * 0.15
  );

  const readiness = clamp(
    cognitiveFit * 0.3 +
      academicFit * 0.25 +
      behaviorFit * 0.2 +
      motivationFit * 0.1 +
      goalFit * 0.15
  );

  const strengths = buildStrengths(
    cognitive,
    profile
  );

  const gaps = buildGaps(
    cognitive,
    profile,
    career
  );

  const readinessLevel =
    readiness >= 85
      ? "HIGHLY_READY"
      : readiness >= 70
      ? "READY"
      : readiness >= 50
      ? "DEVELOPING"
      : "EXPLORING";

  const recommended =
    compatibility >= 75;

  const explanation = recommended
    ? `Hồ sơ hiện tại có mức tương thích ${compatibility}% với hướng ${career.name}.`
    : `Hướng ${career.name} hiện có mức tương thích ${compatibility}%, cần tiếp tục phát triển các yếu tố còn thiếu.`;

  return {
    career,
    compatibility,
    readiness,
    readinessLevel,
    strengths,
    gaps,
    explanation,
    recommended,
  };
}