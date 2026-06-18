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

export type CognitiveResult = {
  SCI: number;
  MAS: number;
  CSL: number;
  riskLevel?: string;
  trend?: number;
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
  riskLevel: "UNKNOWN",
  trend: 0,
};