import { getIdToken } from "firebase/auth";
import { auth } from "./firebase";
/** Backend runs on Vercel while the SPA is hosted by Firebase Hosting. */
function getApiBaseUrl(): string {
  const value = (import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/+$/, "");
  if (!value && import.meta.env.PROD) {
    throw new Error("Chưa cấu hình VITE_API_BASE_URL cho website Firebase trước khi build.");
  }
  if (value && !/^https:\/\/[^/?#]+$/i.test(value)) {
    throw new Error("VITE_API_BASE_URL phải là URL HTTPS dạng https://domain, không kèm đường dẫn.");
  }
  return value; 
}

export type GeminiAdmissionProgramDraft = {
  majorName?: string;
  majorCode?: string;
  combinations?: string[];
  methods?: string[];
  tuitionLabel?: string;
  scholarshipLabel?: string;
  notes?: string;
  missingFields?: string[];
};

export type GeminiAdmissionDraft = {
  universityName?: string;
  recognizedFrom?: string;
  shortName?: string;
  sourceYear?: number;
  sourceUrl?: string;
  sourceTitle?: string;
  sourceType?: string;
  confidence?: number;
  programs?: GeminiAdmissionProgramDraft[];
  warnings?: string[];
  requiresHumanReview?: boolean;
  requiresAiVerification?: boolean;
  verificationMode?: string;
};

export type GeminiAdmissionReaderInput = {
  universityName: string;
  sourceYear?: number;
};

export type GeminiAdmissionReaderResponse = {
  ok: boolean;
  usedSearch?: boolean;
  draft?: GeminiAdmissionDraft;
  rawText?: string;
  message?: string;
  detail?: unknown;
  groundingMetadata?: unknown;
};

function stringifyDetail(detail: unknown) {
  if (!detail) return "";

  if (typeof detail === "string") {
    return detail;
  }

  try {
    return JSON.stringify(detail, null, 2);
  } catch {
    return String(detail);
  }
}

function isQuotaMessage(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("resource_exhausted") ||
    normalized.includes("quota exceeded") ||
    normalized.includes("generate_content_free_tier") ||
    normalized.includes("too many requests")
  );
}

export async function extractAdmissionData(
  input: GeminiAdmissionReaderInput
): Promise<GeminiAdmissionReaderResponse> {
  const user = auth.currentUser;
  if (!user) throw new Error("Bạn cần đăng nhập để dùng Gemini tuyển sinh.");
  const token = await getIdToken(user);
  const response = await fetch(`${getApiBaseUrl()}/api/gemini-admission-reader`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      "API không trả dữ liệu. Nếu test local, hãy chạy bằng npx vercel dev."
    );
  }

  let data: GeminiAdmissionReaderResponse;

  try {
    data = JSON.parse(text) as GeminiAdmissionReaderResponse;
  } catch {
    throw new Error("API trả về dữ liệu không phải JSON hợp lệ.");
  }

  if (!response.ok || !data.ok) {
    const detail = stringifyDetail(data.detail);
    const fullMessage = `${data.message || ""}\n${detail}`;

    if (response.status === 429 || isQuotaMessage(fullMessage)) {
      throw new Error(
        "Gemini đã hết quota hoặc project chưa được cấp quota cho model hiện tại. Hãy đổi GEMINI_MODEL sang gemini-2.5-flash, gemini-2.5-flash-lite, tạo API key/project mới hoặc bật billing rồi thử lại."
      );
    }

    throw new Error(
      detail
        ? `${data.message}\n${detail}`
        : data.message || "Không thể trích xuất dữ liệu tuyển sinh."
    );
  }

  return data;
}