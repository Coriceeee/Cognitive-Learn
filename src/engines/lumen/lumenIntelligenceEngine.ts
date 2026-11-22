import type { CognitiveResult } from "../cognitive/cognitiveEngine";
import type { LumenInsight, LumenDecision } from "./lumenTypes";

// CP72: Never treat metadata (overallScore, confidenceScore, etc.) or a missing
// dimension's technical zero as an observed cognitive measurement.
const CODES = ["SCI", "MAS", "CSL", "GVI", "BDI", "FRI", "CRI"] as const;
const RISK_DIRECTION = new Set<string>(["GVI", "BDI", "FRI"]);

export function analyzeCognitiveProfile(cognitive: CognitiveResult): LumenInsight[] {
  if (cognitive.scoreAvailable !== true) return [];

  const insights: LumenInsight[] = [];
  for (const code of CODES) {
    const dimension = cognitive.dimensions?.find(item => item.code === code);
    if (dimension?.available !== true || cognitive.missingDimensions?.includes(code)) continue;
    const value = cognitive[code];
    if (!Number.isFinite(value) || value < 0 || value > 100) continue;

    const riskIndicator = RISK_DIRECTION.has(code);
    // High FRI/BDI/GVI means a larger risk indicator, not a strength.
    const level: LumenInsight["level"] = riskIndicator
      ? value >= 60 ? "RISK" : "BALANCED"
      : value >= 80 ? "STRENGTH" : value < 60 ? "RISK" : "BALANCED";

    insights.push({
      dimension: code,
      score: value,
      level,
      title: riskIndicator
        ? `${code}: ${level === "RISK" ? "Tín hiệu cần theo dõi" : "Chưa vượt ngưỡng cảnh báo thử nghiệm"}`
        : `${code}: ${level === "STRENGTH" ? "Tín hiệu tương đối cao" : level === "RISK" ? "Tín hiệu cần xem xét" : "Tín hiệu trung gian"}`,
      description: `Giá trị ${value}/100 theo phép đo proxy thử nghiệm; không phải chẩn đoán hay kết luận về năng lực.`,
      recommendation: level === "RISK"
        ? "Kiểm tra dữ liệu đầu vào và theo dõi thêm qua các chu kỳ học tập."
        : "Theo dõi thêm dữ liệu trước khi đưa ra quyết định quan trọng.",
    });
  }
  return insights;
}

export function buildLumenDecision(insights: LumenInsight[]): LumenDecision {
  const strengths = insights.filter(item => item.level === "STRENGTH").map(item => item.title);
  const risks = insights.filter(item => item.level === "RISK").map(item => item.title);
  return {
    strengths,
    risks,
    learningStrategy: [
      "Đối chiếu các tín hiệu đã đo với kế hoạch học thực tế",
      "Thử một thay đổi nhỏ rồi ghi lại kết quả",
      "Theo dõi nhiều chu kỳ trước khi đánh giá xu hướng",
    ],
    summary: insights.length > 0
      ? `Có ${insights.length} chỉ báo proxy đủ điều kiện hiển thị; chưa phải kết luận tâm trắc hoặc xác suất dự báo.`
      : "Chưa có chỉ báo đã xác minh để diễn giải; không suy luận từ số 0 kỹ thuật.",
  };
}
