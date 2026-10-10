import type { StudentProfile } from "../../page/seed/types";
import type { CognitiveResult } from "../cognitive/cognitiveEngine";
import { CAREER_PROFILES } from "./careerMapping";
import { scoreCareer } from "./careerScoring";
import type { CareerIntelligenceResult } from "./careerTypes";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateCareerIntelligence(
  profile: StudentProfile,
  cognitive: CognitiveResult
): CareerIntelligenceResult {
  const matches = CAREER_PROFILES
    .map((career) =>
      scoreCareer(
        profile,
        cognitive,
        career
      )
    )
    .sort(
      (a, b) =>
        b.compatibility - a.compatibility
    );

  const primaryCareer = matches[0];

  const strongestFactors =
    primaryCareer?.strengths ?? [];

  const priorityGaps =
    primaryCareer?.gaps ?? [];

  const currentReadiness =
    primaryCareer?.readiness ?? 0;

  const confidence = clamp(
    cognitive.confidenceScore * 0.5 +
      (profile.targetMajor !== "--"
        ? 100
        : 50) *
        0.2 +
      (profile.gpaOverall > 0
        ? 100
        : 40) *
        0.15 +
      (profile.studyHoursPerWeek > 0
        ? 100
        : 40) *
        0.15
  );

  const nextActions: string[] = [];

  priorityGaps
    .slice(0, 3)
    .forEach((gap) => {
      if (gap.type === "COGNITIVE") {
        nextActions.push(
          `Cải thiện ${gap.label.toLowerCase()} để tăng mức sẵn sàng nghề nghiệp.`
        );
      } else if (
        gap.type === "ACADEMIC"
      ) {
        nextActions.push(
          "Củng cố nền tảng học tập trước khi tăng độ khó mục tiêu."
        );
      } else if (
        gap.type === "BEHAVIOR"
      ) {
        nextActions.push(
          "Tăng tính nhất quán trong việc thực hiện kế hoạch."
        );
      }
    });

  if (nextActions.length === 0) {
    nextActions.push(
      "Duy trì trạng thái hiện tại và bắt đầu phát triển trải nghiệm thực tế trong lĩnh vực mục tiêu."
    );
  }

  const summary = primaryCareer
    ? `Hướng nghề nghiệp nổi bật hiện tại là ${primaryCareer.career.name}, với mức tương thích ${primaryCareer.compatibility}% và mức sẵn sàng ${primaryCareer.readiness}%.`
    : "Chưa đủ dữ liệu để xác định hướng nghề nghiệp.";

  return {
    primaryCareer,
    matches: matches.slice(0, 5),
    currentReadiness,
    strongestFactors,
    priorityGaps,
    summary,
    nextActions,
    confidence,
  };
}