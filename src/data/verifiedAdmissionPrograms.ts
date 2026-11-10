/**
 * Verified PTIT northern campus (BVH) official disclosures; checked 2026-11-08.
 * Cutoffs below are ONLY THPT (100) in 2024 and the school's displayed
 * "Điểm chuẩn trúng tuyển" in 2025, NOT an estimate for 2026 or 2027.
 * If comparison method scales differ in any future year, remove those figures
 * until equivalence is documented by the institution.
 */
export type MajorCutoff = { year: 2024 | 2025; cutoff: number; campus: "BVH"; admissionTrack: "THPT"; source: string };
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
};
const admission2024 = "https://tuyensinh.ptit.edu.vn/gioi-thieu/xem-diem-cac-nam-truoc/diem-trung-tuyen-2024/";
const admission2025 = "https://tuyensinh.ptit.edu.vn/gioi-thieu/xem-diem-cac-nam-truoc/diem-trung-tuyen-nam-2025/";
const scheme2026 = "https://tuyensinh.ptit.edu.vn/de-an-tuyen-sinh/thong-tin-tuyen-sinh-dai-hoc-chinh-quy-nam-2026/";
const years: Array<2024 | 2025 | 2026> = [2024, 2025, 2026];
const methods = ["1: Tài năng", "2: SAT/ACT", "3: HSA/APT/SPT/TSA", "4: IELTS/TOEFL kết hợp", "5: Thi THPT"];
const stemCombos = ["A00", "A01", "X06", "X26"];
const extraCombos = ["A00", "A01", "X06", "X26", "D01"];
function make(major: string, code: string, v2024: number, v2025: number, combos: string[]): VerifiedProgram {
  return { universityId: "ptit", campus: "BVH", major, code, availableYears: years, combinations2026: combos,
    methods2026: methods, source2026: scheme2026, historicalCutoffs: [
      { year: 2024, cutoff: v2024, campus: "BVH", admissionTrack: "THPT", source: admission2024 },
      { year: 2025, cutoff: v2025, campus: "BVH", admissionTrack: "THPT", source: admission2025 },
    ] };
}
export const verifiedPrograms: VerifiedProgram[] = [
  make("Công nghệ thông tin", "7480201", 26.4, 25.8, stemCombos),
  make("An toàn thông tin", "7480202", 25.85, 25.21, stemCombos),
  make("Công nghệ đa phương tiện", "7329001", 25.75, 24.0, extraCombos),
  make("Quản trị kinh doanh", "7340101", 25.17, 22.75, extraCombos),
  make("Marketing", "7340115", 25.85, 24.0, extraCombos),
  make("Công nghệ tài chính (Fintech)", "7340205", 25.61, 23.63, extraCombos),
  make("Kế toán", "7340301", 25.29, 22.5, extraCombos),
  make("Truyền thông đa phương tiện", "7320104", 25.94, 25.25, extraCombos),
  make("Kỹ thuật Điều khiển và tự động hóa", "7520216", 26.08, 26.19, stemCombos),
  make("Kỹ thuật Điện tử viễn thông", "7520207", 25.75, 25.1, stemCombos),
];
export function parseScore30(input: string): number | null {
  if (!input.trim()) return null;
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(input.trim())) return null;
  const value = Number(input.replace(",", "."));
  return Number.isFinite(value) && value >= 0 && value <= 30 ? value : null;
}
export function historicalGap(score: number, cutoff: number): number { return Math.round((score - cutoff) * 100) / 100; }
