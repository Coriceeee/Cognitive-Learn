import type { CognitiveResult } from "../../engines/cognitive/cognitiveEngine";

export type { CognitiveResult } from "../../engines/cognitive/cognitiveEngine";

export type OrionSubjectInput = {
  subject: string;
  label: string;
  currentScore: number;
  targetScore: number;
  importance: number;
};

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

  // Optional measured behavior indicators from Seed form.
  // Undefined means not measured; it must not be silently treated as 0.
  goalSwitchFrequency?: number; // Number of goal changes per month
  taskAbandonmentRate?: number; // Percentage 0-100
  contextSwitchRate?: number; // Self-reported 0-100 (provisional)
  learningStrategy?: number; // Self-reported 0-100 (provisional)
  previousPlanCompletionRate?: number; // Previous recorded observation, if present

  orionSubjects?: OrionSubjectInput[];
  orionWeeksLeft?: number;
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
  orionSubjects: undefined,
  orionWeeksLeft: undefined,
};

export const defaultCognitiveResult: CognitiveResult = {
  SCI: 0,
  MAS: 0,
  CSL: 0,
  overallScore: 0,
  riskLevel: "UNKNOWN",
  trend: "UNKNOWN",
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
      description:
        "Mức nhất quán giữa mục tiêu, kết quả học tập và hành động hiện tại.",
    },
    {
      code: "MAS",
      name: "Meaning Alignment Score",
      value: 0,
      level: "RISK",
      description:
        "Mức gắn kết giữa động lực học tập, mục tiêu cá nhân và định hướng ngành.",
    },
    {
      code: "CSL",
      name: "Cognitive Stability Level",
      value: 0,
      level: "RISK",
      description:
        "Độ ổn định của nhịp học, luyện tập và khả năng duy trì kế hoạch.",
    },
  ],
  GVI: 0,
  BDI: 0,
  FRI: 0,
  CRI: 0,
  vector: {
    SCI: 0,
    MAS: 0,
    CSL: 0,
    GVI: 0,
    BDI: 0,
    FRI: 0,
    CRI: 0,
    timestamp: "",
  },
};