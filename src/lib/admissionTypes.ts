export type AdmissionMethod =
  | "THPT"
  | "HOC_BA"
  | "HSA"
  | "DGNL_HCM"
  | "TSA"
  | "VSAT"
  | "V_ACT"
  | "SAT"
  | "ACT"
  | "IELTS"
  | "TOEFL"
  | "VSTEP";

export type SubjectCode =
  | "math"
  | "literature"
  | "english"
  | "physics"
  | "chemistry"
  | "biology"
  | "history"
  | "geography"
  | "civicEducation"
  | "informatics"
  | "technology";

export type SubjectScoreMap = Partial<Record<SubjectCode, number>>;

export type AdmissionCombination = {
  code: string;
  label: string;
  subjects: SubjectCode[];
};

export type ExamMethodRule = {
  method: AdmissionMethod;
  label: string;
  rawScaleMax: number;
  normalizedScaleMax: number;
  canConvertToScale30: boolean;
  requiresOfficialRule: boolean;
};

export type ExternalExamScore = {
  method: AdmissionMethod;
  rawScore: number;
  maxScore?: number;
  sourceYear?: number;
  verified?: boolean;
};

export type CombinationScoreResult = {
  combinationCode: string;
  combinationLabel: string;
  subjects: SubjectCode[];
  rawScore: number;
  convertedScore: number;
  normalizedScore: number;
  missingSubjects: SubjectCode[];
  warnings: string[];
};

export type ExternalScoreResult = {
  method: AdmissionMethod;
  methodLabel: string;
  rawScore: number;
  maxScore: number;
  normalizedScore: number;
  convertedScore: number | null;
  sourceYear?: number;
  verified: boolean;
  warnings: string[];
};

export type ScoreConversionReport = {
  combinationOptions: CombinationScoreResult[];
  externalOptions: ExternalScoreResult[];
  bestOption: {
    label: string;
    method: AdmissionMethod | "COMBINATION";
    score: number;
    normalizedScore: number;
  } | null;
  warnings: string[];
};