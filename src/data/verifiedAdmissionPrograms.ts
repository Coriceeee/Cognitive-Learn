/**
 * Verified PTIT northern campus (BVH) official disclosures; checked 2026-11-08.
 * 2024 THPT (method code 100), 2025 published common cutoff and 2026
 * method-specific cutoffs, each independently labelled. Code 100 is NOT a scale.
 * Different years/methods are not interchangeable; no probability is implied.
 * 2026 data reviewed on 2026-11-17 against the official 10/08 notice.
 */
export type MajorCutoff = { year: 2024 | 2025; cutoff: number; campus: "BVH"; admissionTrack: "THPT" | "PUBLISHED_COMMON"; source: string; tieBreak: string };
export const ptit2026MethodScales = {
  THPT: { label: "Thi THPT", scale: 30 },
  TALENT: { label: "Xét tuyển tài năng", scale: 100 },
  SAT: { label: "SAT", scale: 1600 },
  ACT: { label: "ACT", scale: 36 },
  TSA: { label: "TSA", scale: 100 },
  HSA: { label: "HSA", scale: 150 },
  VACT: { label: "V-ACT", scale: 1200 },
  SPT: { label: "SPT", scale: 30 },
  COMBINED: { label: "Xét tuyển kết hợp", scale: 30 },
} as const;
export type Ptit2026Method = keyof typeof ptit2026MethodScales;
export type Ptit2026Cutoffs = {
  values: Readonly<Record<Ptit2026Method, number>>;
  source: string;
  publishedAt: "2026-08-10";
  reviewedAt: "2026-11-17";
  tieBreak: string | null;
};
export type VerifiedProgram = {
  universityId: "ptit";
  campus: "BVH";
  major: string;
  code: string;
  availableYears: Array<2024 | 2025 | 2026>;
  combinations2026: string[];
  methods2026: string[];
  historicalCutoffs: MajorCutoff[];
  source2026: string;
  cutoffs2026: Ptit2026Cutoffs;
};
const admission2024 = "https://tuyensinh.ptit.edu.vn/gioi-thieu/xem-diem-cac-nam-truoc/diem-trung-tuyen-2024/";
const admission2025 = "https://tuyensinh.ptit.edu.vn/gioi-thieu/xem-diem-cac-nam-truoc/diem-trung-tuyen-nam-2025/";
const cutoff2026 = "https://tuyensinh.ptit.edu.vn/thong-bao-diem-chuan-trung-tuyen-vao-dai-hoc-he-chinh-quy-nam-2026/";
const scheme2026 = "https://tuyensinh.ptit.edu.vn/de-an-tuyen-sinh/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026/";
const years: Array<2024 | 2025 | 2026> = [2024, 2025, 2026];
const methods = ["1: Tài năng", "2: SAT/ACT", "3: HSA/APT/SPT/TSA", "4: IELTS/TOEFL kết hợp", "5: Thi THPT"];
const stemCombos = ["A00", "A01", "X06", "X26"];
const extraCombos = ["A00", "A01", "X06", "X26", "D01"];
function make(major: string, code: string, v2024: number, tie2024: string, v2025: number, tie2025: string, combos: string[], values: readonly [number, number, number, number, number, number, number, number, number], tie2026: string | null): VerifiedProgram {
  const [THPT, TALENT, SAT, ACT, TSA, HSA, VACT, SPT, COMBINED] = values;
  return { universityId: "ptit", campus: "BVH", major, code, availableYears: years, combinations2026: combos,
    methods2026: methods, source2026: scheme2026, historicalCutoffs: [
      { year: 2024, cutoff: v2024, campus: "BVH", admissionTrack: "THPT", source: admission2024, tieBreak: tie2024 },
      { year: 2025, cutoff: v2025, campus: "BVH", admissionTrack: "PUBLISHED_COMMON", source: admission2025, tieBreak: tie2025 },
    ], cutoffs2026: { values: { THPT, TALENT, SAT, ACT, TSA, HSA, VACT, SPT, COMBINED }, source: cutoff2026,
      publishedAt: "2026-08-10", reviewedAt: "2026-11-17", tieBreak: tie2026 } };
}
export const verifiedPrograms: VerifiedProgram[] = [
  make("Công nghệ thông tin", "7480201", 26.4, "TTNV ≤ 5", 25.8, "TTNV ≤ 3", stemCombos, [23.00,64.70,1169.61,26.00,52.48,81.64,762.73,17.82,27.14], null),
  make("An toàn thông tin", "7480202", 25.85, "TTNV ≤ 2", 25.21, "TTNV ≤ 2", stemCombos, [25.22,83.41,1319.43,29.39,59.04,95.34,887.82,22.89,28.50], "ĐC ≤ 1,75; TTNV ≤ 3"),
  make("Công nghệ đa phương tiện", "7329001", 25.75, "TTNV ≤ 2", 24.0, "TTNV ≤ 2", extraCombos, [22.75,60.75,1149.61,25.50,51.86,80.31,749.23,16.90,26.97], "ĐC = 0; TTNV = 1"),
  make("Quản trị kinh doanh", "7340101", 25.17, "TTNV ≤ 13", 22.75, "TTNV ≤ 13", extraCombos, [21.93,56.80,1130.00,25.00,50.97,78.09,704.72,15.78,25.31], "ĐC = 0; TTNV ≤ 12"),
  make("Marketing", "7340115", 25.85, "TTNV ≤ 3", 24.0, "TTNV ≤ 5", extraCombos, [22.75,60.75,1149.61,25.50,51.86,80.31,749.23,16.90,26.97], "ĐC = 0; TTNV ≤ 4"),
  make("Công nghệ tài chính (Fintech)", "7340205", 25.61, "TTNV ≤ 10", 23.63, "TTNV = 1", extraCombos, [23.23,68.34,1188.00,26.45,53.04,82.87,775.15,18.66,27.29], "ĐC ≤ 1,5; TTNV ≤ 4"),
  make("Kế toán", "7340301", 25.29, "TTNV ≤ 16", 22.5, "TTNV ≤ 6", extraCombos, [22.47,56.80,1130.00,25.00,51.24,78.95,734.10,15.99,26.73], "ĐC = 0; TTNV ≤ 14"),
  make("Truyền thông đa phương tiện", "7320104", 25.94, "TTNV ≤ 6", 25.25, "TTNV ≤ 3", extraCombos, [24.54,81.79,1280.58,28.62,56.76,90.67,848.19,22.12,28.11], "ĐC ≤ 1; TTNV ≤ 8"),
  make("Kỹ thuật Điều khiển và tự động hóa", "7520216", 26.08, "TTNV ≤ 3", 26.19, "TTNV ≤ 6", stemCombos, [26.91,92.48,1452.62,33.06,65.03,105.79,972.06,24.60,29.51], "ĐC = 0; TTNV ≤ 2"),
  make("Kỹ thuật Điện tử viễn thông", "7520207", 25.75, "TTNV = 1", 25.1, "TTNV ≤ 2", stemCombos, [25.18,83.32,1317.15,29.35,58.91,95.06,885.49,22.85,28.48], "ĐC = 0; TTNV ≤ 4"),
];
export function parseScore30(input: string): number | null {
  if (!input.trim()) return null;
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(input.trim())) return null;
  const value = Number(input.replace(",", "."));
  return Number.isFinite(value) && value >= 0 && value <= 30 ? value : null;
}
export function historicalGap(score: number, cutoff: number): number { return Math.round((score - cutoff) * 100) / 100; }
