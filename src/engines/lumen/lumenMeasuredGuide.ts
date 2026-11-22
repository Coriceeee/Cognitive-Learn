import type { CognitiveResult } from "../cognitive/cognitiveEngine";

const CODES = ["SCI", "MAS", "CSL", "GVI", "BDI", "FRI", "CRI"] as const;
type Code = typeof CODES[number];

type Observation = { code: Code; value: number };
export type LumenMeasuredGuide = {
  source: "CLA_MEASURED_RULES_V1";
  available: boolean;
  summary: string;
  observations: string[];
  nextActions: string[];
  limitations: string[];
};

/** Offline, deterministic study guide. Not a trained ML result or a Gemini response. */
export function buildLumenMeasuredGuide(cognitive: CognitiveResult): LumenMeasuredGuide {
  const observations: Observation[] = [];
  if (cognitive.scoreAvailable === true) {
    for (const code of CODES) {
      const dimension = cognitive.dimensions?.find(item => item.code === code);
      const value = cognitive[code];
      if (dimension?.available !== true || cognitive.missingDimensions?.includes(code)) continue;
      if (!Number.isFinite(value) || value < 0 || value > 100) continue;
      observations.push({ code, value });
    }
  }
  const measured = (code: Code) => observations.find(item => item.code === code)?.value;
  const actions: string[] = [];
  if (measured("SCI") !== undefined && measured("SCI")! < 60) {
    actions.push("Thử chia mục tiêu học tuần này thành 2–3 việc nhỏ và ghi lại việc hoàn thành.");
  }
  if (measured("CSL") !== undefined && measured("CSL")! < 60) {
    actions.push("Thử một khung giờ học ổn định trong tuần rồi quan sát mức độ duy trì.");
  }
  if (measured("FRI") !== undefined && measured("FRI")! >= 60) {
    actions.push("Tự kiểm tra lịch học và thời gian nghỉ, giảm nhiệm vụ dồn dập nếu cần.");
  }
  if (measured("GVI") !== undefined && measured("GVI")! >= 60) {
    actions.push("Ghi lại lý do điều chỉnh mục tiêu trước khi thay đổi kế hoạch tiếp theo.");
  }
  if (observations.length > 0) {
    actions.push("Ghi nhật ký học tập trong Pulse và so sánh sau ít nhất một chu kỳ mới.");
  } else {
    actions.push("Trở về Seed để bổ sung phép đo Cognitive có dữ liệu xác minh.");
  }
  return {
    source: "CLA_MEASURED_RULES_V1",
    available: observations.length > 0,
    summary: observations.length > 0
      ? `Có ${observations.length} chỉ báo proxy đã ghi nhận; hướng dẫn dưới đây được chọn theo quy tắc CLA và không cần Gemini.`
      : "Chưa có chỉ báo Cognitive hợp lệ để tạo hướng dẫn cá nhân.",
    observations: observations.map(item => `${item.code}: ${item.value}/100 (chỉ báo thử nghiệm)`),
    nextActions: actions.slice(0, 4),
    limitations: [
      "Không phải đánh giá tâm lý, kết quả mô hình ML đã kiểm định, hay dự đoán trúng tuyển.",
      "Ngưỡng gợi ý thuộc quy tắc thử nghiệm, không chứng minh hiệu quả can thiệp.",
      "Chỉ sử dụng phép đo được đánh dấu khả dụng; chỉ báo chưa đo không được xem là 0.",
    ],
  };
}
