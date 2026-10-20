export type CognitiveCode = "SCI" | "MAS" | "CSL" | "GVI" | "BDI" | "FRI" | "CRI";

export type CognitiveVector = Record<CognitiveCode, number> & {
  timestamp: string;
  availableDimensions?: CognitiveCode[];
  missingDimensions?: CognitiveCode[];
  derivationNotes?: Partial<Record<CognitiveCode, string>>;
  mappingVersion?: string;
  dataCoverageScore?: number;
};

const CODES: CognitiveCode[] = ["SCI", "MAS", "CSL", "GVI", "BDI", "FRI", "CRI"];

function asObject(input: unknown): Record<string, unknown> {
  return input !== null && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
}

function validNumber(value: unknown, min = 0, max = 100): number | undefined {
  if (typeof value === "string" && value.trim() === "") return undefined;
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

function firstNumber(source: Record<string, unknown>, names: string[], min = 0, max = 100): number | undefined {
  const behavior = asObject(source.behavior);
  const metrics = asObject(source.cognitiveMetrics);
  for (const name of names) {
    for (const scope of [source, behavior, metrics]) {
      const n = validNumber(scope[name], min, max);
      if (n !== undefined) return n;
    }
  }
  return undefined;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function createCognitiveVector(state: unknown): CognitiveVector {
  const input = asObject(state);
  const availableDimensions: CognitiveCode[] = [];
  const derivationNotes: Partial<Record<CognitiveCode, string>> = {};
  const values = {} as Record<CognitiveCode, number>;

  function set(code: CognitiveCode, value: number | undefined, note: string) {
    if (value === undefined) {
      values[code] = 0; // Legacy numeric contract; marked missing below.
    } else {
      values[code] = clamp(value);
      availableDimensions.push(code);
      derivationNotes[code] = note;
    }
  }

  const consistency = firstNumber(input, ["SCI", "sci", "actionConsistency", "studyConsistency", "planCompletionRate"]);
  const motivation = firstNumber(input, ["MAS", "mas", "motivationLevel", "motivation"]);
  const strategy = firstNumber(input, ["CSL", "csl", "learningStrategy"]);
  const goalFrequency = firstNumber(input, ["goalSwitchFrequency"], 0, 10000);
  const completion = firstNumber(input, ["planCompletionRate"]);
  const previousCompletion = firstNumber(input, ["previousPlanCompletionRate"]);
  const abandonment = firstNumber(input, ["taskAbandonmentRate"]);
  const switching = firstNumber(input, ["contextSwitchRate"]);

  set("SCI", consistency, "Proxy từ độ hoàn thành/nhất quán hành động; chưa kiểm định thang đo SCI.");
  set("MAS", motivation, "Proxy tự báo cáo động lực; chưa kiểm định thang đo MAS.");
  set("CSL", strategy, "Chỉ số chiến lược được nhập/cung cấp; chưa kiểm định CSL.");

  const directGvi = firstNumber(input, ["GVI", "gvi"]);
  set("GVI", directGvi ?? (goalFrequency !== undefined ? goalFrequency * 20 : undefined),
    "Quy tắc thử nghiệm: số lần đổi mục tiêu mỗi tháng × 20; không phải hiệu ứng đã đo.");

  const directBdi = firstNumber(input, ["BDI", "bdi"]);
  set("BDI", directBdi ?? (completion !== undefined && previousCompletion !== undefined
    ? Math.abs(completion - previousCompletion) : undefined),
    "Chênh lệch hành vi giữa hai quan sát; không dùng 100 − completion để giả lập biến động.");

  const directFri = firstNumber(input, ["FRI", "fri"]);
  set("FRI", directFri ?? (abandonment !== undefined && switching !== undefined
    ? abandonment * 0.6 + switching * 0.4 : undefined),
    "Proxy quy tắc từ bỏ dở nhiệm vụ và chuyển ngữ cảnh; chưa xác nhận mệt mỏi thực tế.");

  const directCri = firstNumber(input, ["CRI", "cri"]);
  const allCore = ["SCI", "MAS", "CSL"].every(code => availableDimensions.includes(code as CognitiveCode));
  set("CRI", directCri ?? (allCore ? values.SCI * 0.5 + values.MAS * 0.3 + values.CSL * 0.2 : undefined),
    "Tổng hợp quy tắc từ SCI/MAS/CSL; chưa kiểm định CRI.");

  const missingDimensions = CODES.filter(code => !availableDimensions.includes(code));
  return {
    ...values,
    timestamp: new Date().toISOString(),
    availableDimensions,
    missingDimensions,
    derivationNotes,
    mappingVersion: "cla-cognitive-proxy-v2",
    dataCoverageScore: Math.round((availableDimensions.length / CODES.length) * 100),
  };
}
