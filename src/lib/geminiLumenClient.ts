
import { getIdToken } from "firebase/auth";
import { auth } from "./firebase";
import type { AIReasoningResult, AIStudentContext } from "../engines/ai/aiTypes";

export type GeminiLumenExplanation = {
  summary: string;
  reasons: string[];
  nextActions: string[];
  limitations: string[];
};

export type GeminiLumenRequest = {
  version: 1;
  task: "EXPLAIN_LUMEN";
  context: {
    cognitive: Partial<Record<"SCI" | "MAS" | "CSL" | "GVI" | "BDI" | "FRI" | "CRI", number>>;
    growth?: {
      status: string;
      message?: string;
    };
    behavior: {
      studyHoursPerWeek?: number;
      practiceTestsPerWeek?: number;
      motivationLevel?: number;
      planCompletionRate?: number;
    };
    goal: { targetMajor?: string };
    deterministic: {
      summary: string;
      recommendations: string[];
    };
  };
};

type GeminiLumenServerResponse = {
  ok?: boolean;
  result?: unknown;
  message?: string;
};

function safeNumber(value: unknown, min: number, max: number): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
    ? value : undefined;
}

function cleanText(value: unknown, max = 240): string | undefined {
  if (typeof value !== "string") return undefined;
  const result = value.replace(/\s+/g, " ").trim();
  return result.length ? result.slice(0, max) : undefined;
}

function cleanStrings(value: unknown, maxEntries = 4, maxLength = 350): string[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxEntries).map(item => cleanText(item, maxLength)).filter((item): item is string => Boolean(item));
}

/** Only measured dimensions are sent; a 0 placeholder is not a measurement. */
export function buildGeminiLumenRequest(
  context: AIStudentContext,
  reasoning: AIReasoningResult
): GeminiLumenRequest {
  const cognitive = context.cognitive;
  if (cognitive.scoreAvailable !== true) {
    throw new Error("Chưa đủ phép đo Cognitive hợp lệ để yêu cầu Gemini giải thích.");
  }

  const allowedCodes = ["SCI", "MAS", "CSL", "GVI", "BDI", "FRI", "CRI"] as const;
  const measured: GeminiLumenRequest["context"]["cognitive"] = {};
  for (const code of allowedCodes) {
    const dimension = cognitive.dimensions?.find(item => item.code === code);
    if (dimension?.available !== true || cognitive.missingDimensions?.includes(code)) continue;
    const value = safeNumber(cognitive[code], 0, 100);
    if (value !== undefined) measured[code] = value;
  }

  if (Object.keys(measured).length === 0) {
    throw new Error("Cognitive chưa có chỉ số đã được đo hợp lệ để gửi Gemini.");
  }

  const behavior = context.behavior;
  const status = context.history?.growthStatus;
  return {
    version: 1,
    task: "EXPLAIN_LUMEN",
    context: {
      cognitive: measured,
      ...(status ? { growth: {
        status: cleanText(status, 30) || "UNKNOWN",
        message: cleanText(context.history?.growthMessage, 250),
      } } : {}),
      behavior: {
        studyHoursPerWeek: safeNumber(behavior?.studyHoursPerWeek, 0, 168),
        practiceTestsPerWeek: safeNumber(behavior?.practiceTestsPerWeek, 0, 30),
        motivationLevel: safeNumber(behavior?.motivationLevel, 0, 100),
        planCompletionRate: safeNumber(behavior?.planCompletionRate, 0, 100),
      },
      goal: { targetMajor: cleanText(context.profile.targetMajor, 80) },
      deterministic: {
        summary: cleanText(reasoning.summary, 300) || "Phân tích nội bộ chưa có tóm tắt.",
        recommendations: reasoning.recommendations.slice(0, 4)
          .map(item => cleanText(item.action, 250)).filter((item): item is string => Boolean(item)),
      },
    },
  };
}

function parseExplanation(value: unknown): GeminiLumenExplanation {
  if (!value || typeof value !== "object") throw new Error("Phản hồi Gemini không có cấu trúc hợp lệ.");
  const data = value as Record<string, unknown>;
  const summary = cleanText(data.summary, 800);
  const reasons = cleanStrings(data.reasons, 5, 500);
  const nextActions = cleanStrings(data.nextActions, 4, 350);
  const limitations = cleanStrings(data.limitations, 4, 350);
  if (!summary || reasons.length === 0) {
    throw new Error("Gemini không trả đủ phần giải thích. Đang giữ phân tích nội bộ.");
  }
  return { summary, reasons, nextActions, limitations };
}

/**
 * The browser never calls Google Gemini directly and never stores an API key.
 * Backend response contract: { ok: true, result: { summary, reasons,
 * nextActions, limitations } }. HTTP 4xx/5xx or invalid responses throw.
 */
export async function requestGeminiLumenExplanation(
  context: AIStudentContext,
  reasoning: AIReasoningResult,
  signal?: AbortSignal
): Promise<GeminiLumenExplanation> {
  const user = auth.currentUser;
  if (!user) throw new Error("Bạn cần đăng nhập để dùng Gemini Lumen.");
  const body = buildGeminiLumenRequest(context, reasoning);
  const token = await getIdToken(user);
  const response = await fetch("/api/gemini-lumen", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal,
  });
  // Read a structured response for BOTH errors and success, so students see
  // actionable messages (permissions, rate limit, configuration).
  const responseText = await response.text();
  if (responseText.length > 20_000) {
    throw new Error("Phản hồi Gemini quá lớn để kiểm tra an toàn.");
  }
  let data: GeminiLumenServerResponse | null = null;
  try {
    data = JSON.parse(responseText) as GeminiLumenServerResponse;
  } catch {
    if (response.ok) throw new Error("API Gemini không trả JSON hợp lệ.");
  }
  if (response.status === 404) {
    throw new Error("API /api/gemini-lumen chưa triển khai trên server.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error(cleanText(data?.message, 200) || "Tài khoản chưa được xác thực hoặc không có quyền sử dụng.");
  }
  if (response.status === 429) {
    throw new Error(cleanText(data?.message, 200) || "Hệ thống đang giới hạn lượt gọi Gemini. Thử lại sau.");
  }
  if (!response.ok) {
    throw new Error(cleanText(data?.message, 200) || `Gemini tạm thời không khả dụng (HTTP ${response.status}).`);
  }
  if (!data || typeof data !== "object" || data.ok !== true) {
    throw new Error(cleanText(data?.message, 200) || "API Gemini trả kết quả không hợp lệ.");
  }
  return parseExplanation(data.result);
}
