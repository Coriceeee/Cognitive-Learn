import type { CognitiveResult } from "../../lib/cognitiveEngine";

export type { CognitiveResult } from "../../lib/cognitiveEngine";

export type StudentProfile = {
  fullName: string;
  className: string;

  targetMajor: string;
  targetUniversity: string;

  gpa10: number;
  gpa11: number;
  gpa12: number;
  gpaOverall: number;

  studyHoursPerWeek: number;
  practiceTestsPerWeek: number;
  planCompletionRate: number;
  motivationLevel: number;
};

export type SubjectScore = {
  subject: string;
  score: string;
  change: string;
};

export type LearningPlan = {
  content: string;
};

export type RecommendationCard = {
  title: string;
  value: string;
  desc: string;
};

export const defaultStudentProfile: StudentProfile = {
  fullName: "Chưa có dữ liệu",
  className: "--",
  targetMajor: "--",
  targetUniversity: "--",
  gpa10: 0,
  gpa11: 0,
  gpa12: 0,
  gpaOverall: 0,
  studyHoursPerWeek: 0,
  practiceTestsPerWeek: 0,
  planCompletionRate: 0,
  motivationLevel: 0,
};

export const defaultCognitiveResult: CognitiveResult = {
  SCI: 0,
  MAS: 0,
  CSL: 0,
  overallScore: 0,
  riskLevel: "UNKNOWN",
  trend: 0,
  trendLabel: "Chưa có dữ liệu",
  confidenceScore: 0,
  summary: "Lumen chưa có đủ dữ liệu để đánh giá trạng thái học tập.",
  insights: [],
  warnings: [],
  nextActions: [],
  dimensions: [
    {
      code: "SCI",
      name: "Self Coherence Index",
      value: 0,
      level: "RISK",
      description: "Mức nhất quán giữa mục tiêu, kết quả học tập và hành động hiện tại.",
    },
    {
      code: "MAS",
      name: "Meaning Alignment Score",
      value: 0,
      level: "RISK",
      description: "Mức gắn kết giữa động lực học tập, mục tiêu cá nhân và định hướng ngành.",
    },
    {
      code: "CSL",
      name: "Cognitive Stability Level",
      value: 0,
      level: "RISK",
      description: "Độ ổn định của nhịp học, luyện tập và khả năng duy trì kế hoạch.",
    },
  ],
};