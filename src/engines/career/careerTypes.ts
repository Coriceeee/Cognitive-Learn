export type CareerDomain =
  | "TECHNOLOGY"
  | "ENGINEERING"
  | "MEDICINE"
  | "BUSINESS"
  | "SOCIAL_SCIENCE"
  | "EDUCATION"
  | "CREATIVE"
  | "NATURAL_SCIENCE"
  | "LAW"
  | "OTHER";

export type CareerReadinessLevel =
  | "EXPLORING"
  | "DEVELOPING"
  | "READY"
  | "HIGHLY_READY";

export type CareerGapType =
  | "COGNITIVE"
  | "ACADEMIC"
  | "BEHAVIOR"
  | "MOTIVATION"
  | "GOAL_ALIGNMENT";

export type CareerStrength = {
  label: string;
  score: number;
  source:
    | "COGNITIVE"
    | "ACADEMIC"
    | "BEHAVIOR"
    | "GOAL";
};

export type CareerGap = {
  label: string;
  score: number;
  type: CareerGapType;
  priority: "LOW" | "MEDIUM" | "HIGH";
};

export type CareerProfile = {
  id: string;
  name: string;
  domain: CareerDomain;
  description: string;
  keywords: string[];
  cognitiveWeights: Partial<
    Record<
      "SCI" | "MAS" | "CSL" | "GVI" | "BDI" | "FRI" | "CRI",
      number
    >
  >;
  academicWeight: number;
  behaviorWeight: number;
  motivationWeight: number;
};

export type CareerMatch = {
  career: CareerProfile;
  compatibility: number;
  readiness: number;
  readinessLevel: CareerReadinessLevel;
  strengths: CareerStrength[];
  gaps: CareerGap[];
  explanation: string;
  recommended: boolean;
};

export type CareerIntelligenceResult = {
  primaryCareer: CareerMatch;
  matches: CareerMatch[];
  currentReadiness: number;
  strongestFactors: CareerStrength[];
  priorityGaps: CareerGap[];
  summary: string;
  nextActions: string[];
  confidence: number;
};