/** Admission into programmes hosted in Viet Nam belongs to Atlas, not Haven international destinations.
 * Programme names/fees/eligibility MUST be checked at each university for the current intake.
 */
export type DomesticInternationalProgram = {
  institution: string;
  intakeYear: number;
  admissionsUrl: string;
  note: string;
};
export const domesticInternationalPrograms: DomesticInternationalProgram[] = [
  {
    institution: "HUTECH — Viện Đào tạo Quốc tế",
    intakeYear: 2026,
    admissionsUrl: "https://www.hutech.edu.vn/quocte/tuyen-sinh/phuong-thuc-tuyen-sinh",
    note: "Kiểm tra từng ngành, hình thức đào tạo, văn bằng, điều kiện ngoại ngữ và học phí trên thông báo chính thức.",
  },
  {
    institution: "UEF — chương trình liên kết đào tạo quốc tế",
    intakeYear: 2026,
    admissionsUrl: "https://www.uef.edu.vn/vienquocte/thong-tin-tuyen-sinh/thong-tin-tuyen-sinh-chuong-trinh-lien-ket-quoc-te-uef-nam-2026-35432",
    note: "Kiểm tra cách tuyển sinh và thông tin chuyển tiếp riêng từng đối tác; link năm 2026 không bảo đảm còn mở hồ sơ.",
  },
];
