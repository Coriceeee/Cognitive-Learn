export type Timestamped = {
  createdAt: string;
  updatedAt: string;
};


export interface AcademicRecord {
  year: number;

  semester?: string;

  subjects: {
    name: string;
    score: number;
  }[];

  gpa?: number;

  source?: string;

  confidence?: number;
}


export interface ExamRecord {
  type:
    | "THPT"
    | "DGNL"
    | "HSA"
    | "TSA"
    | "VSAT"
    | "SAT"
    | "ACT";

  score: number;

  scale: number;

  year: number;

  percentile?: number;

  source?: string;

  confidence?: number;
}


export interface CertificateRecord {
  type:
    | "IELTS"
    | "TOEFL"
    | "VSTEP"
    | "TOPIK"
    | "JLPT";

  score: number;

  level?: string;

  obtainedAt?: string;

  expiredAt?: string;
}


export interface BehaviorEvent {
  date: string;

  type:
    | "STUDY_TIME"
    | "TASK_COMPLETE"
    | "TASK_DROP"
    | "GOAL_CHANGE"
    | "MOOD_CHANGE";

  value: number;

  note?: string;
}


export interface CognitiveHistory {
  date: string;

  SCI: number;

  MAS: number;

  CSL: number;

  GVI?: number;

  BDI?: number;

  FRI?: number;

  CRI?: number;
}


export interface StudentGoal {

  university?: string;

  major?: string;

  country?: string;

  targetYear?: number;

}


export interface FinancialProfile {

  yearlyBudget?: number;

  scholarshipRequired?: boolean;

  familySupportLevel?:
    | "LOW"
    | "MEDIUM"
    | "HIGH";

}


export interface StudentProfile extends Timestamped {

  id: string;


  personal: {

    name: string;

    grade: number;

    school?: string;

  };


  academics: AcademicRecord[];


  exams: ExamRecord[];


  certificates: CertificateRecord[];


  behaviors: BehaviorEvent[];


  cognitiveHistory: CognitiveHistory[];


  goals: StudentGoal[];


  achievements: string[];


  financial?: FinancialProfile;


  targetUniversities?: string[];


  targetMajors?: string[];

}