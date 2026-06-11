export type SubjectScore = {
  subject: string;
  currentScore: number;
  targetScore: number;
  weeklyHours: number;
};

export type CognitiveMetrics = {
  actionConsistency: number;
  goalSwitchFrequency: number;
  taskAbandonmentRate: number;
  decisionLatency: number;
  contextSwitchRate: number;
};

export type CognitiveState = {
  sci: number;
  mas: number;
  csl: number;
};

export type StudentProfile = {
  id: string;
  fullName: string;
  grade: 10 | 11 | 12;
  province: string;
  desiredMajor?: string;
  desiredUniversity?: string;
  subjects: SubjectScore[];
  cognitiveMetrics: CognitiveMetrics;
};
