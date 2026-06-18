import type {
  AdmissionCombination,
  AdmissionMethod,
  ExamMethodRule,
} from "./admissionTypes";

export const admissionMethodRules: Record<AdmissionMethod, ExamMethodRule> = {
  THPT: {
    method: "THPT",
    label: "Điểm thi THPT",
    rawScaleMax: 30,
    normalizedScaleMax: 100,
    canConvertToScale30: true,
    requiresOfficialRule: false,
  },
  HOC_BA: {
    method: "HOC_BA",
    label: "Học bạ",
    rawScaleMax: 30,
    normalizedScaleMax: 100,
    canConvertToScale30: true,
    requiresOfficialRule: false,
  },
  HSA: {
    method: "HSA",
    label: "HSA ĐHQG Hà Nội",
    rawScaleMax: 150,
    normalizedScaleMax: 100,
    canConvertToScale30: false,
    requiresOfficialRule: true,
  },
  DGNL_HCM: {
    method: "DGNL_HCM",
    label: "ĐGNL ĐHQG TP.HCM",
    rawScaleMax: 1200,
    normalizedScaleMax: 100,
    canConvertToScale30: false,
    requiresOfficialRule: true,
  },
  TSA: {
    method: "TSA",
    label: "TSA Bách khoa",
    rawScaleMax: 100,
    normalizedScaleMax: 100,
    canConvertToScale30: false,
    requiresOfficialRule: true,
  },
  VSAT: {
    method: "VSAT",
    label: "VSAT",
    rawScaleMax: 150,
    normalizedScaleMax: 100,
    canConvertToScale30: false,
    requiresOfficialRule: true,
  },
  V_ACT: {
    method: "V_ACT",
    label: "V-ACT",
    rawScaleMax: 150,
    normalizedScaleMax: 100,
    canConvertToScale30: false,
    requiresOfficialRule: true,
  },
  SAT: {
    method: "SAT",
    label: "SAT",
    rawScaleMax: 1600,
    normalizedScaleMax: 100,
    canConvertToScale30: false,
    requiresOfficialRule: true,
  },
  ACT: {
    method: "ACT",
    label: "ACT",
    rawScaleMax: 36,
    normalizedScaleMax: 100,
    canConvertToScale30: false,
    requiresOfficialRule: true,
  },
  IELTS: {
    method: "IELTS",
    label: "IELTS",
    rawScaleMax: 9,
    normalizedScaleMax: 100,
    canConvertToScale30: false,
    requiresOfficialRule: true,
  },
  TOEFL: {
    method: "TOEFL",
    label: "TOEFL",
    rawScaleMax: 120,
    normalizedScaleMax: 100,
    canConvertToScale30: false,
    requiresOfficialRule: true,
  },
  VSTEP: {
    method: "VSTEP",
    label: "VSTEP",
    rawScaleMax: 10,
    normalizedScaleMax: 100,
    canConvertToScale30: false,
    requiresOfficialRule: true,
  },
};

export const admissionCombinations: AdmissionCombination[] = [
  {
    code: "A00",
    label: "A00 - Toán, Vật lý, Hóa học",
    subjects: ["math", "physics", "chemistry"],
  },
  {
    code: "A01",
    label: "A01 - Toán, Vật lý, Tiếng Anh",
    subjects: ["math", "physics", "english"],
  },
  {
    code: "A02",
    label: "A02 - Toán, Vật lý, Sinh học",
    subjects: ["math", "physics", "biology"],
  },
  {
    code: "B00",
    label: "B00 - Toán, Hóa học, Sinh học",
    subjects: ["math", "chemistry", "biology"],
  },
  {
    code: "C00",
    label: "C00 - Ngữ văn, Lịch sử, Địa lý",
    subjects: ["literature", "history", "geography"],
  },
  {
    code: "C01",
    label: "C01 - Ngữ văn, Toán, Vật lý",
    subjects: ["literature", "math", "physics"],
  },
  {
    code: "D01",
    label: "D01 - Toán, Ngữ văn, Tiếng Anh",
    subjects: ["math", "literature", "english"],
  },
  {
    code: "D07",
    label: "D07 - Toán, Hóa học, Tiếng Anh",
    subjects: ["math", "chemistry", "english"],
  },
  {
    code: "D08",
    label: "D08 - Toán, Sinh học, Tiếng Anh",
    subjects: ["math", "biology", "english"],
  },
];

export function getAdmissionMethodRule(method: AdmissionMethod) {
  return admissionMethodRules[method];
}

export function getAdmissionCombination(code: string) {
  return admissionCombinations.find(
    (combination) => combination.code.toUpperCase() === code.toUpperCase()
  );
}