import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import type { VercelRequest, VercelResponse } from "@vercel/node";

loadEnv({ path: resolve(process.cwd(), ".env.local") });
loadEnv({ path: resolve(process.cwd(), ".env") });

type AdmissionReaderRequest = {
  universityName?: string;
  sourceYear?: number;
};

type UniversityAlias = {
  keywords: string[];
  officialName: string;
  shortName: string;
  hints: string[];
};

type SourceType = "official_website" | "admission_scheme" | "pdf" | "manual";

type AdmissionMethod =
  | "THPT"
  | "HOC_BA"
  | "HSA"
  | "DGNL_HCM"
  | "TSA"
  | "VSAT"
  | "V_ACT"
  | "SAT"
  | "ACT"
  | "IELTS"
  | "TOEFL"
  | "VSTEP";

const validAdmissionMethods: AdmissionMethod[] = [
  "THPT",
  "HOC_BA",
  "HSA",
  "DGNL_HCM",
  "TSA",
  "VSAT",
  "V_ACT",
  "SAT",
  "ACT",
  "IELTS",
  "TOEFL",
  "VSTEP",
];

const validSourceTypes: SourceType[] = [
  "official_website",
  "admission_scheme",
  "pdf",
  "manual",
];

const universityAliases: UniversityAlias[] = [
  {
    keywords: ["ctu", "can tho", "cần thơ", "đại học cần thơ", "dh can tho"],
    officialName: "Trường Đại học Cần Thơ",
    shortName: "CTU",
    hints: [
      "Trường đại học công lập tại Cần Thơ",
      "Có nhiều nhóm ngành như Công nghệ thông tin, Kinh tế, Nông nghiệp, Sư phạm, Thủy sản",
    ],
  },
  {
    keywords: [
      "bach khoa hcm",
      "bách khoa hcm",
      "hcmut",
      "bk hcm",
      "bku",
      "đại học bách khoa hcm",
    ],
    officialName: "Trường Đại học Bách khoa - Đại học Quốc gia TP.HCM",
    shortName: "HCMUT",
    hints: [
      "Trường thành viên của Đại học Quốc gia TP.HCM",
      "Thường có các ngành kỹ thuật, công nghệ, máy tính, điện, cơ khí, hóa học, xây dựng",
    ],
  },
  {
    keywords: [
      "bach khoa hn",
      "bách khoa hà nội",
      "hust",
      "đại học bách khoa hà nội",
    ],
    officialName: "Đại học Bách khoa Hà Nội",
    shortName: "HUST",
    hints: [
      "Đại học kỹ thuật tại Hà Nội",
      "Có các ngành máy tính, điện, cơ khí, tự động hóa, vật liệu, hóa học, toán tin",
    ],
  },
  {
    keywords: ["neu", "kinh tế quốc dân", "đại học kinh tế quốc dân"],
    officialName: "Trường Đại học Kinh tế Quốc dân",
    shortName: "NEU",
    hints: [
      "Trường khối kinh tế tại Hà Nội",
      "Có các ngành kinh tế, quản trị kinh doanh, tài chính, marketing, kế toán",
    ],
  },
  {
    keywords: ["ftu", "ngoại thương", "đại học ngoại thương"],
    officialName: "Trường Đại học Ngoại thương",
    shortName: "FTU",
    hints: [
      "Trường khối kinh tế, thương mại, kinh doanh quốc tế",
      "Có các ngành kinh tế đối ngoại, kinh doanh quốc tế, tài chính, logistics",
    ],
  },
  {
    keywords: ["ueh", "kinh tế tphcm", "đại học kinh tế tp hcm"],
    officialName: "Đại học Kinh tế TP.HCM",
    shortName: "UEH",
    hints: [
      "Đại học khối kinh tế tại TP.HCM",
      "Có các ngành kinh tế, quản trị, marketing, tài chính, logistics, công nghệ kinh doanh",
    ],
  },
  {
    keywords: [
      "hcmus",
      "khoa học tự nhiên hcm",
      "đại học khoa học tự nhiên hcm",
    ],
    officialName: "Trường Đại học Khoa học tự nhiên - Đại học Quốc gia TP.HCM",
    shortName: "HCMUS",
    hints: [
      "Trường thành viên của Đại học Quốc gia TP.HCM",
      "Có các ngành công nghệ thông tin, khoa học dữ liệu, toán, lý, hóa, sinh, môi trường",
    ],
  },
  {
    keywords: ["uel", "kinh tế luật", "đại học kinh tế luật"],
    officialName: "Trường Đại học Kinh tế - Luật - Đại học Quốc gia TP.HCM",
    shortName: "UEL",
    hints: [
      "Trường thành viên của Đại học Quốc gia TP.HCM",
      "Có các ngành kinh tế, luật, quản trị, tài chính, thương mại điện tử",
    ],
  },
  {
    keywords: ["hcmue", "sư phạm hcm", "đại học sư phạm tp hcm"],
    officialName: "Trường Đại học Sư phạm TP.HCM",
    shortName: "HCMUE",
    hints: [
      "Trường đào tạo nhóm ngành sư phạm tại TP.HCM",
      "Có các ngành Sư phạm Toán, Lý, Hóa, Sinh, Văn, Anh và các ngành ngoài sư phạm",
    ],
  },
];

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveUniversityAlias(input: string) {
  const normalizedInput = normalizeText(input);

  const matched = universityAliases.find((alias) =>
    alias.keywords.some((keyword) =>
      normalizedInput.includes(normalizeText(keyword))
    )
  );

  if (!matched) {
    return {
      originalInput: input,
      officialName: input,
      shortName: input.toUpperCase(),
      hints: [
        "Người dùng nhập tên trường dạng tự do.",
        "Cần tự hiểu tên trường nếu có thể, nếu không chắc thì ghi Chưa có dữ liệu.",
      ],
      aliasMatched: false,
    };
  }

  return {
    originalInput: input,
    officialName: matched.officialName,
    shortName: matched.shortName,
    hints: matched.hints,
    aliasMatched: true,
  };
}

function parseBody(req: VercelRequest): AdmissionReaderRequest {
  if (!req.body) return {};

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body) as AdmissionReaderRequest;
    } catch {
      return {};
    }
  }

  return req.body as AdmissionReaderRequest;
}

function safeJsonParse(text: string) {
  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
      } catch {
        return null;
      }
    }

    return null;
  }
}

function getGeminiErrorMessage(data: any) {
  return data?.error?.message || data?.message || "Gemini API trả lỗi.";
}

function isQuotaError(data: any) {
  const message = JSON.stringify(data || {}).toLowerCase();

  return (
    message.includes("resource_exhausted") ||
    message.includes("quota exceeded") ||
    message.includes("generate_content_free_tier")
  );
}

function shouldRetryWithoutSearch(data: any) {
  const message = JSON.stringify(data || {}).toLowerCase();

  if (isQuotaError(data)) return false;

  return (
    message.includes("google_search") ||
    message.includes("tool") ||
    message.includes("not supported") ||
    message.includes("unsupported")
  );
}

function getText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function getUrl(value: unknown) {
  const text = getText(value);

  if (!text) return "";

  if (text.startsWith("http://") || text.startsWith("https://")) {
    return text;
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) {
    return `https://${text}`;
  }

  return "";
}

function normalizeSourceType(value: unknown): SourceType {
  const text = getText(value).toLowerCase();

  if (validSourceTypes.includes(text as SourceType)) {
    return text as SourceType;
  }

  if (text.includes("pdf")) return "pdf";
  if (text.includes("đề án") || text.includes("de an")) return "admission_scheme";
  if (text.includes("website") || text.includes("official")) {
    return "official_website";
  }

  return "manual";
}

function normalizeAdmissionMethod(value: unknown): AdmissionMethod | null {
  const raw = getText(value);
  const upper = raw.toUpperCase().replace(/\s+/g, "_");
  const normalized = normalizeText(raw);

  if (validAdmissionMethods.includes(upper as AdmissionMethod)) {
    return upper as AdmissionMethod;
  }

  if (normalized.includes("thpt")) return "THPT";
  if (normalized.includes("hoc ba")) return "HOC_BA";
  if (normalized.includes("hsa")) return "HSA";
  if (normalized.includes("dgnl") && normalized.includes("hcm")) {
    return "DGNL_HCM";
  }
  if (normalized.includes("tsa")) return "TSA";
  if (normalized.includes("vsat")) return "VSAT";
  if (normalized.includes("v act") || normalized.includes("vact")) return "V_ACT";
  if (normalized.includes("sat")) return "SAT";
  if (normalized.includes("act")) return "ACT";
  if (normalized.includes("ielts")) return "IELTS";
  if (normalized.includes("toefl")) return "TOEFL";
  if (normalized.includes("vstep")) return "VSTEP";

  return null;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => getText(item))
        .filter(Boolean)
        .map((item) => item.toUpperCase())
    )
  );
}

function normalizeMethodArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => normalizeAdmissionMethod(item))
        .filter(Boolean) as AdmissionMethod[]
    )
  );
}

function normalizeConfidence(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) return 0;

  return Math.min(100, Math.max(0, Math.round(numberValue)));
}

function extractFirstGroundingUrl(data: any) {
  const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks;

  if (!Array.isArray(chunks)) return "";

  const firstWebChunk = chunks.find((chunk) => chunk?.web?.uri);

  return firstWebChunk?.web?.uri || "";
}

function extractFirstGroundingTitle(data: any) {
  const chunks = data?.candidates?.[0]?.groundingMetadata?.groundingChunks;

  if (!Array.isArray(chunks)) return "";

  const firstWebChunk = chunks.find((chunk) => chunk?.web?.title);

  return firstWebChunk?.web?.title || "";
}

function normalizeDraft({
  draft,
  requestedYear,
  resolvedUniversity,
  groundingUrl,
  groundingTitle,
}: {
  draft: any;
  requestedYear: number;
  resolvedUniversity: ReturnType<typeof resolveUniversityAlias>;
  groundingUrl: string;
  groundingTitle: string;
}) {
  const sourceUrl = getUrl(draft?.sourceUrl) || getUrl(groundingUrl);
  const sourceTitle =
    getText(draft?.sourceTitle) ||
    getText(groundingTitle) ||
    "Nguồn tuyển sinh do Gemini đề xuất";

  const sourceYear = Number(draft?.sourceYear) || requestedYear;
  const warnings = Array.isArray(draft?.warnings)
    ? draft.warnings.map((item: unknown) => getText(item)).filter(Boolean)
    : [];

  if (!resolvedUniversity.aliasMatched) {
    warnings.push(
      "Tên trường được nhập tự do, Atlas đã để Gemini tự nhận diện. Cần ưu tiên nguồn chính thức."
    );
  }

  if (sourceYear < requestedYear) {
    warnings.push(
      `Chưa có dữ liệu chính thức năm ${requestedYear}, đang dùng dữ liệu gần nhất trước đó.`
    );
  }

  if (!sourceUrl) {
    warnings.push(
      "Gemini chưa trả về link nguồn. Confidence bị giới hạn vì thiếu liên kết kiểm chứng."
    );
  }

  const programsInput = Array.isArray(draft?.programs) ? draft.programs : [];

  const programs = programsInput
    .map((program: any) => {
      const majorName = getText(program?.majorName, "Chưa có dữ liệu");
      const majorCode = getText(program?.majorCode, "Chưa có dữ liệu");
      const combinations = normalizeStringArray(program?.combinations);
      const methods = normalizeMethodArray(program?.methods);
      const tuitionLabel = getText(program?.tuitionLabel, "Chưa có dữ liệu");
      const scholarshipLabel = getText(
        program?.scholarshipLabel,
        "Chưa có dữ liệu"
      );
      const notes = getText(program?.notes, "Dữ liệu do Gemini đề xuất.");

      const missingFields: string[] = [];

      if (majorName === "Chưa có dữ liệu") missingFields.push("majorName");
      if (majorCode === "Chưa có dữ liệu") missingFields.push("majorCode");
      if (combinations.length === 0) missingFields.push("combinations");
      if (methods.length === 0) missingFields.push("methods");
      if (tuitionLabel === "Chưa có dữ liệu") missingFields.push("tuitionLabel");
      if (scholarshipLabel === "Chưa có dữ liệu") {
        missingFields.push("scholarshipLabel");
      }

      return {
        majorName,
        majorCode,
        combinations,
        methods,
        tuitionLabel,
        scholarshipLabel,
        notes,
        missingFields,
      };
    })
    .filter((program: any) => program.majorName !== "Chưa có dữ liệu");

  if (programs.length === 0) {
    warnings.push(
      "Gemini chưa trả về ngành đủ rõ. Hãy thử nhập tên trường đầy đủ hơn hoặc đổi model Gemini."
    );
  }

  let confidence = normalizeConfidence(draft?.confidence);

  if (!confidence) {
    confidence = sourceUrl ? 55 : 35;
  }

  if (!sourceUrl) {
    confidence = Math.min(confidence, 35);
  }

  if (programs.length === 0) {
    confidence = Math.min(confidence, 25);
  }

  return {
    universityName:
      getText(draft?.universityName) || resolvedUniversity.officialName,
    recognizedFrom: resolvedUniversity.originalInput,
    shortName: resolvedUniversity.shortName,
    sourceYear,
    sourceUrl,
    sourceTitle,
    sourceType: normalizeSourceType(draft?.sourceType),
    confidence,
    programs,
    warnings: Array.from(new Set(warnings)),
    requiresHumanReview: false,
    requiresAiVerification: false,
    verificationMode: "SOURCE_CONSTRAINED_GEMINI",
  };
}

function buildPrompt({
  rawInput,
  officialName,
  shortName,
  hints,
  requestedYear,
}: {
  rawInput: string;
  officialName: string;
  shortName: string;
  hints: string[];
  requestedYear: number;
}) {
  return `
Bạn là Gemini Admission Reader của hệ thống Cognitive Learn AI.

Người dùng nhập: "${rawInput}"
Hệ thống hiểu là: "${officialName}"
Tên viết tắt: "${shortName}"

Gợi ý nhận diện trường:
${hints.map((hint) => `- ${hint}`).join("\n")}

Nhiệm vụ:
- Tìm và trích xuất dữ liệu tuyển sinh của trường trên.
- Người dùng có thể nhập rất ngắn như "ctu", "hcmut", "neu", "ftu", hãy tự hiểu theo trường phổ biến ở Việt Nam.
- Ưu tiên nguồn chính thức: website tuyển sinh của trường, đề án tuyển sinh, file PDF tuyển sinh, thông báo tuyển sinh.
- Năm người dùng cần: ${requestedYear}.
- Nếu chưa có dữ liệu năm ${requestedYear}, dùng năm gần nhất trước đó, ví dụ ${requestedYear - 1} hoặc ${requestedYear - 2}.
- Trường "sourceYear" PHẢI là năm dữ liệu thực tế được dùng, không bắt buộc bằng ${requestedYear}.
- Nếu dùng năm cũ hơn ${requestedYear}, thêm cảnh báo rõ ràng.
- Không tự suy đoán điểm chuẩn.
- Không tự quy đổi điểm nếu không có bảng chính thức.
- Không để trống học phí/học bổng. Nếu không tìm thấy thì ghi "Chưa có dữ liệu".
- Nếu không tìm thấy mã ngành thì ghi "Chưa có dữ liệu".
- Nếu không tìm thấy tổ hợp thì để mảng rỗng, không tự đoán.
- Nếu không tìm thấy phương thức xét tuyển thì để mảng rỗng, không tự đoán.
- Cố gắng trả ít nhất 5 ngành nếu nguồn có đủ dữ liệu.
- Nếu không có sourceUrl, confidence tối đa là 35.
- Nếu có sourceUrl chính thức và dữ liệu ngành đầy đủ, confidence có thể từ 60 đến 85.
- Chỉ trả về JSON hợp lệ, không markdown, không giải thích ngoài JSON.

Schema JSON bắt buộc:
{
  "universityName": "${officialName}",
  "recognizedFrom": "${rawInput}",
  "shortName": "${shortName}",
  "sourceYear": ${requestedYear},
  "sourceUrl": "",
  "sourceTitle": "",
  "sourceType": "official_website",
  "confidence": 0,
  "programs": [
    {
      "majorName": "",
      "majorCode": "",
      "combinations": [],
      "methods": [],
      "tuitionLabel": "",
      "scholarshipLabel": "",
      "notes": ""
    }
  ],
  "warnings": [],
  "requiresHumanReview": false
}

Giá trị methods hợp lệ:
["THPT","HOC_BA","HSA","DGNL_HCM","TSA","VSAT","V_ACT","SAT","ACT","IELTS","TOEFL","VSTEP"]

Giá trị sourceType hợp lệ:
"official_website", "admission_scheme", "pdf", "manual"
`;
}

async function callGemini({
  apiKey,
  model,
  prompt,
  useSearch,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  useSearch: boolean;
}) {
  const body: Record<string, unknown> = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      topP: 0.85,
      maxOutputTokens: 8192,
    },
  };

  if (useSearch) {
    body.tools = [{ google_search: {} }];
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response.json();

  return { response, data };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    return res.status(200).json({ ok: true });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      message: "Method not allowed",
    });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      message: "Thiếu GEMINI_API_KEY trên server Vercel.",
    });
  }

  const body = parseBody(req);
  const rawInput = body.universityName?.trim() || "";
  const requestedYear = Number(body.sourceYear) || new Date().getFullYear();

  if (!rawInput) {
    return res.status(400).json({
      ok: false,
      message: "Cần nhập tên trường.",
    });
  }

  const resolvedUniversity = resolveUniversityAlias(rawInput);

  const prompt = buildPrompt({
    rawInput,
    officialName: resolvedUniversity.officialName,
    shortName: resolvedUniversity.shortName,
    hints: resolvedUniversity.hints,
    requestedYear,
  });

  try {
    let result = await callGemini({
      apiKey,
      model,
      prompt,
      useSearch: true,
    });

    let usedSearch = true;

    if (!result.response.ok && shouldRetryWithoutSearch(result.data)) {
      result = await callGemini({
        apiKey,
        model,
        prompt,
        useSearch: false,
      });

      usedSearch = false;
    }

    if (!result.response.ok) {
      return res.status(result.response.status).json({
        ok: false,
        message: getGeminiErrorMessage(result.data),
        detail: result.data,
      });
    }

    const rawText =
      result.data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || "")
        .join("\n")
        .trim() || "";

    const draft = safeJsonParse(rawText);

    if (!draft) {
      return res.status(200).json({
        ok: false,
        message: "Gemini trả về nội dung không parse được JSON.",
        rawText,
      });
    }

    const normalizedDraft = normalizeDraft({
      draft,
      requestedYear,
      resolvedUniversity,
      groundingUrl: extractFirstGroundingUrl(result.data),
      groundingTitle: extractFirstGroundingTitle(result.data),
    });

    return res.status(200).json({
      ok: true,
      usedSearch,
      draft: normalizedDraft,
      rawText,
      groundingMetadata:
        result.data?.candidates?.[0]?.groundingMetadata || null,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Không gọi được Gemini API.",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}