import { createCognitiveVector, type CognitiveVector, type CognitiveCode } from "../../lib/cognitiveAdapter";

export type CognitiveRisk = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
export type CognitiveTrend = "IMPROVING" | "STABLE" | "DECLINING" | "UNKNOWN";

export type CognitiveDimension = {
  code: CognitiveCode;
  name: string;
  value: number;
  description: string;
  level?: "GOOD" | "NORMAL" | "RISK";
  available?: boolean;
};

export type CognitiveResult = {
  summary: string;
  trendLabel: string;
  SCI: number; MAS: number; CSL: number; GVI: number; BDI: number; FRI: number; CRI: number;
  overallScore: number;
  riskLevel: CognitiveRisk;
  trend: CognitiveTrend;
  confidenceScore: number;
  vector: CognitiveVector;
  dimensions: CognitiveDimension[];
  insights: string[];
  warnings: string[];
  nextActions: string[];

  dataCoverageScore?: number;
  scoreAvailable?: boolean;
  missingDimensions?: CognitiveCode[];
  mappingVersion?: string;
};

const DESCRIPTIONS: Record<CognitiveCode, { name: string; description: string }> = {
  SCI: { name: "Study Consistency Index (proxy)", description: "Chỉ dấu nhất quán hành vi học tập; thang đo chưa được kiểm định." },
  MAS: { name: "Motivation & Attitude Score (proxy)", description: "Chỉ dấu động lực tự báo cáo; không phải điểm tâm lý đã chuẩn hóa." },
  CSL: { name: "Cognitive Strategy Level (proxy)", description: "Chỉ dấu chiến lược học tập; cần dữ liệu đo riêng." },
  GVI: { name: "Goal Volatility Index (proxy)", description: "Tần suất đổi mục tiêu; giá trị lớn là tín hiệu cần xem xét." },
  BDI: { name: "Behavior Drift Index (proxy)", description: "Biến động giữa hai lần đo có dữ liệu hợp lệ." },
  FRI: { name: "Fatigue Risk Index (proxy)", description: "Tín hiệu nguy cơ dựa trên hành vi, không dùng để chẩn đoán." },
  CRI: { name: "Cognitive Reliability Index (proxy)", description: "Chỉ dấu tổng hợp từ các thang đo cơ sở." },
};

const CODES: CognitiveCode[] = ["SCI", "MAS", "CSL", "GVI", "BDI", "FRI", "CRI"];

function level(value: number, riskDirection: boolean): "GOOD" | "NORMAL" | "RISK" {
  if (riskDirection) return value >= 60 ? "RISK" : value >= 40 ? "NORMAL" : "GOOD";
  return value >= 75 ? "GOOD" : value >= 45 ? "NORMAL" : "RISK";
}

export function calculateCognitive(profile: unknown): CognitiveResult {
  const vector = createCognitiveVector(profile);
  const { SCI, MAS, CSL, GVI, BDI, FRI, CRI } = vector;
  const available = new Set(vector.availableDimensions ?? []);
  const has = (code: CognitiveCode) => available.has(code);
  const scoreAvailable = ["SCI", "MAS", "CSL", "CRI"].every(code => has(code as CognitiveCode));

  const overallScore = scoreAvailable
    ? Math.round(SCI * 0.3 + MAS * 0.25 + CSL * 0.2 + CRI * 0.25)
    : 0;

  let riskLevel: CognitiveRisk = "UNKNOWN";
  if ((has("FRI") && FRI >= 70) || (has("BDI") && BDI >= 70)) {
    riskLevel = "HIGH";
  } else if ((has("FRI") && FRI >= 40) || (has("BDI") && BDI >= 40)) {
    riskLevel = "MEDIUM";
  } else if (has("FRI") && has("BDI")) {
    riskLevel = "LOW";
  }

  // A current snapshot is not evidence of improvement/decline over time.
  const trend: CognitiveTrend = "UNKNOWN";
  const trendLabel = "Cần ít nhất hai lần đo hợp lệ";
  const dimensions: CognitiveDimension[] = CODES.map(code => ({
    code,
    ...DESCRIPTIONS[code],
    value: vector[code],
    available: has(code),
    level: has(code) ? level(vector[code], ["GVI", "BDI", "FRI"].includes(code)) : undefined,
  }));

  const insights: string[] = [];
  const warnings: string[] = [];
  const nextActions: string[] = [];
  if (has("SCI") && SCI >= 75) insights.push("Chỉ dấu hoàn thành/nhất quán kế hoạch hiện ở mức cao.");
  if (has("MAS") && MAS >= 75) insights.push("Học sinh tự báo cáo động lực học tập ở mức cao.");
  if (has("GVI") && GVI >= 60) {
    warnings.push("Số lần điều chỉnh mục tiêu tương đối nhiều theo ngưỡng thử nghiệm.");
    nextActions.push("Trao đổi về tính ổn định của mục tiêu và kiểm tra nguyên nhân thay đổi.");
  }
  if (has("BDI") && BDI >= 60) warnings.push("Có chênh lệch hành vi lớn giữa hai lần ghi nhận.");
  if (has("FRI") && FRI >= 60) warnings.push("Các chỉ báo hành vi cho thấy nguy cơ quá tải cần được đánh giá thêm.");
  if (!has("CSL")) nextActions.push("Bổ sung phép đo chiến lược học tập để có CSL, CRI và điểm tổng hợp.");
  if (!has("BDI")) nextActions.push("Cần hai lần đo hành vi để đánh giá biến động BDI.");
  if (!has("FRI")) nextActions.push("Cần thêm phép đo chuyển ngữ cảnh trước khi diễn giải FRI.");
  if (vector.missingDimensions?.length) {
    warnings.push(`Thiếu dữ liệu cho ${vector.missingDimensions.join(", ")}; số 0 kỹ thuật không phải điểm đã đo.`);
  }
  if (!insights.length) insights.push("Chưa đủ dữ liệu để đưa ra nhận định tích cực hoặc tiêu cực.");

  const confidenceScore = 0;
  const summary = scoreAvailable
    ? `Điểm tổng hợp theo quy tắc thử nghiệm: ${overallScore}/100. Chưa được kiểm định tâm trắc hoặc hiệu chuẩn. Mức rủi ro: ${riskLevel}.`
    : `Chưa đủ phép đo hợp lệ để tính điểm Cognitive tổng hợp. Hiện có ${available.size}/7 chiều theo quy tắc thử nghiệm; không diễn giải dữ liệu thiếu thành điểm 0.`;

  return {
    summary, trendLabel, SCI, MAS, CSL, GVI, BDI, FRI, CRI,
    overallScore, riskLevel, trend, confidenceScore,
    vector, dimensions, insights, warnings, nextActions,
    dataCoverageScore: vector.dataCoverageScore ?? 0,
    scoreAvailable,
    missingDimensions: vector.missingDimensions ?? [],
    mappingVersion: vector.mappingVersion,
  };
}
