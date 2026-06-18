export type CognitiveRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";

export type CognitiveDimensionCode = "SCI" | "MAS" | "CSL";

export type CognitiveDimension = {
  code: CognitiveDimensionCode;
  name: string;
  value: number;
  level: "STRONG" | "STABLE" | "WATCH" | "RISK";
  description: string;
};

export type CognitiveProfile = {
  fullName?: string;
  className?: string;

  targetMajor?: string;
  targetUniversity?: string;

  gpa10?: number;
  gpa11?: number;
  gpa12?: number;
  gpaOverall?: number;

  studyHoursPerWeek?: number;
  practiceTestsPerWeek?: number;
  planCompletionRate?: number;
  motivationLevel?: number;
};

export type CognitiveResult = {
  SCI: number;
  MAS: number;
  CSL: number;

  overallScore: number;
  riskLevel: CognitiveRiskLevel;
  trend: number;
  trendLabel: string;
  confidenceScore: number;

  summary: string;
  insights: string[];
  warnings: string[];
  nextActions: string[];

  dimensions: CognitiveDimension[];
};

function clamp(value: number, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

function toNumber(value?: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return value;
}

function getValidGpas(profile: CognitiveProfile) {
  return [profile.gpa10, profile.gpa11, profile.gpa12]
    .map(toNumber)
    .filter((value) => value > 0);
}

function average(values: number[]) {
  if (values.length === 0) return 0;

  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
}

function getGpaOverall(profile: CognitiveProfile) {
  const gpaOverall = toNumber(profile.gpaOverall);

  if (gpaOverall > 0) {
    return gpaOverall;
  }

  return average(getValidGpas(profile));
}

function getTrend(profile: CognitiveProfile) {
  const gpa10 = toNumber(profile.gpa10);
  const gpa12 = toNumber(profile.gpa12);

  if (gpa10 <= 0 || gpa12 <= 0) return 0;

  return Number((gpa12 - gpa10).toFixed(2));
}

function getTrendScore(trend: number) {
  if (trend >= 0.8) return 100;
  if (trend >= 0.4) return 88;
  if (trend >= 0.1) return 76;
  if (trend >= -0.1) return 64;
  if (trend >= -0.4) return 48;
  return 32;
}

function getTrendLabel(trend: number) {
  if (trend >= 0.4) return "Tăng trưởng tốt";
  if (trend >= 0.1) return "Có tiến bộ";
  if (trend >= -0.1) return "Ổn định";
  if (trend >= -0.4) return "Có dấu hiệu giảm";
  return "Giảm rõ rệt";
}

function getTargetClarity(profile: CognitiveProfile) {
  const hasMajor =
    typeof profile.targetMajor === "string" &&
    profile.targetMajor.trim() !== "" &&
    profile.targetMajor !== "--";

  const hasUniversity =
    typeof profile.targetUniversity === "string" &&
    profile.targetUniversity.trim() !== "" &&
    profile.targetUniversity !== "--";

  if (hasMajor && hasUniversity) return 100;
  if (hasMajor || hasUniversity) return 70;
  return 35;
}

function getPracticeScore(practiceTestsPerWeek: number) {
  if (practiceTestsPerWeek >= 6) return 100;
  if (practiceTestsPerWeek >= 4) return 86;
  if (practiceTestsPerWeek >= 2) return 68;
  if (practiceTestsPerWeek >= 1) return 48;
  return 25;
}

function getStudyHourScore(studyHoursPerWeek: number) {
  if (studyHoursPerWeek >= 18) return 100;
  if (studyHoursPerWeek >= 14) return 86;
  if (studyHoursPerWeek >= 9) return 68;
  if (studyHoursPerWeek >= 5) return 48;
  return 28;
}

function getLevel(value: number): CognitiveDimension["level"] {
  if (value >= 82) return "STRONG";
  if (value >= 68) return "STABLE";
  if (value >= 50) return "WATCH";
  return "RISK";
}

function getRiskLevel(overallScore: number): CognitiveRiskLevel {
  if (overallScore <= 0) return "UNKNOWN";
  if (overallScore < 45) return "HIGH";
  if (overallScore < 68) return "MEDIUM";
  return "LOW";
}

function getConfidenceScore(profile: CognitiveProfile) {
  const fields = [
    profile.gpa10,
    profile.gpa11,
    profile.gpa12,
    profile.gpaOverall,
    profile.studyHoursPerWeek,
    profile.practiceTestsPerWeek,
    profile.planCompletionRate,
    profile.motivationLevel,
  ];

  const filledNumberCount = fields.filter(
    (value) => typeof value === "number" && Number.isFinite(value) && value > 0
  ).length;

  const hasTarget =
    getTargetClarity(profile) >= 70;

  const rawScore = (filledNumberCount / fields.length) * 82 + (hasTarget ? 18 : 0);

  return clamp(round(rawScore));
}

function buildSummary(overallScore: number, riskLevel: CognitiveRiskLevel) {
  if (riskLevel === "UNKNOWN") {
    return "Lumen chưa có đủ dữ liệu để đánh giá trạng thái học tập.";
  }

  if (riskLevel === "LOW") {
    return "Trạng thái học tập hiện tại khá ổn định, có thể tiếp tục tối ưu chiến lược để tăng xác suất đạt mục tiêu.";
  }

  if (riskLevel === "MEDIUM") {
    return "Hệ thống phát hiện một số tín hiệu cần theo dõi, đặc biệt ở mức duy trì kế hoạch và độ ổn định hành vi học tập.";
  }

  return "Hồ sơ đang có rủi ro học tập cao, cần ưu tiên ổn định lịch học, tăng luyện tập và làm rõ mục tiêu trong ngắn hạn.";
}

function buildInsights(
  profile: CognitiveProfile,
  SCI: number,
  MAS: number,
  CSL: number,
  trend: number
) {
  const insights: string[] = [];

  if (SCI >= 75) {
    insights.push("Mục tiêu, kết quả học tập và mức hoàn thành kế hoạch đang tương đối nhất quán.");
  } else {
    insights.push("Mức nhất quán giữa mục tiêu và hành động học tập chưa cao.");
  }

  if (MAS >= 75) {
    insights.push("Động lực học tập đang hỗ trợ tốt cho mục tiêu hiện tại.");
  } else {
    insights.push("Động lực hoặc mức gắn kết với mục tiêu còn cần được củng cố.");
  }

  if (CSL >= 75) {
    insights.push("Nhịp học và hành vi luyện tập đang khá ổn định.");
  } else {
    insights.push("Độ ổn định học tập chưa cao, dễ bị ảnh hưởng khi mục tiêu thay đổi hoặc lịch học không đều.");
  }

  if (trend > 0.2) {
    insights.push("Điểm GPA có xu hướng tăng, đây là tín hiệu tích cực cho dự báo dài hạn.");
  }

  if (trend < -0.2) {
    insights.push("Điểm GPA có xu hướng giảm, cần kiểm tra lại môn đang kéo điểm xuống.");
  }

  if (toNumber(profile.practiceTestsPerWeek) <= 1) {
    insights.push("Số đề luyện tập mỗi tuần còn thấp so với nhu cầu dự báo và tuyển sinh.");
  }

  return insights;
}

function buildWarnings(profile: CognitiveProfile, SCI: number, MAS: number, CSL: number) {
  const warnings: string[] = [];

  if (SCI < 50) {
    warnings.push("SCI thấp: mục tiêu và hành động học tập có thể đang lệch nhau.");
  }

  if (MAS < 50) {
    warnings.push("MAS thấp: động lực học tập chưa đủ mạnh để duy trì mục tiêu dài hạn.");
  }

  if (CSL < 50) {
    warnings.push("CSL thấp: nhịp học chưa ổn định, cần giảm tình trạng học ngắt quãng.");
  }

  if (toNumber(profile.planCompletionRate) < 50) {
    warnings.push("Tỉ lệ hoàn thành kế hoạch dưới 50%, dễ làm giảm xác suất đạt mục tiêu.");
  }

  if (toNumber(profile.studyHoursPerWeek) < 5) {
    warnings.push("Số giờ học mỗi tuần còn thấp, dữ liệu dự báo có thể chưa đủ mạnh.");
  }

  return warnings;
}

function buildNextActions(profile: CognitiveProfile, SCI: number, MAS: number, CSL: number) {
  const actions: string[] = [];

  if (SCI < 68) {
    actions.push("Viết lại mục tiêu học tập trong 14 ngày tới và gắn với 1 tổ hợp xét tuyển chính.");
  }

  if (MAS < 68) {
    actions.push("Chọn một lý do học tập cụ thể cho ngành mục tiêu để tăng mức gắn kết động lực.");
  }

  if (CSL < 68) {
    actions.push("Cố định lịch học tối thiểu 5 ngày liên tục để tăng độ ổn định nhận thức.");
  }

  if (toNumber(profile.practiceTestsPerWeek) < 3) {
    actions.push("Tăng số đề luyện tập lên tối thiểu 3 đề mỗi tuần.");
  }

  if (toNumber(profile.planCompletionRate) < 75) {
    actions.push("Chia kế hoạch học thành nhiệm vụ nhỏ theo ngày để tăng tỉ lệ hoàn thành.");
  }

  if (actions.length === 0) {
    actions.push("Duy trì nhịp học hiện tại và bắt đầu thử mô phỏng mục tiêu tuyển sinh ở Atlas/Orion.");
  }

  return actions.slice(0, 4);
}

export function calculateCognitive(profile: CognitiveProfile): CognitiveResult {
  const gpaOverall = getGpaOverall(profile);
  const gpaScore = clamp(gpaOverall * 10);

  const planCompletionRate = clamp(toNumber(profile.planCompletionRate));
  const motivationLevel = clamp(toNumber(profile.motivationLevel));
  const studyHourScore = getStudyHourScore(toNumber(profile.studyHoursPerWeek));
  const practiceScore = getPracticeScore(toNumber(profile.practiceTestsPerWeek));
  const targetClarity = getTargetClarity(profile);

  const trend = getTrend(profile);
  const trendScore = getTrendScore(trend);

  const SCI = clamp(
    round(gpaScore * 0.42 + planCompletionRate * 0.32 + trendScore * 0.16 + targetClarity * 0.1)
  );

  const MAS = clamp(
    round(motivationLevel * 0.48 + targetClarity * 0.26 + studyHourScore * 0.26)
  );

  const CSL = clamp(
    round(planCompletionRate * 0.38 + practiceScore * 0.28 + studyHourScore * 0.22 + trendScore * 0.12)
  );

  const overallScore = clamp(round((SCI + MAS + CSL) / 3));
  const riskLevel = getRiskLevel(overallScore);
  const confidenceScore = getConfidenceScore(profile);

  return {
    SCI,
    MAS,
    CSL,
    overallScore,
    riskLevel,
    trend,
    trendLabel: getTrendLabel(trend),
    confidenceScore,
    summary: buildSummary(overallScore, riskLevel),
    insights: buildInsights(profile, SCI, MAS, CSL, trend),
    warnings: buildWarnings(profile, SCI, MAS, CSL),
    nextActions: buildNextActions(profile, SCI, MAS, CSL),
    dimensions: [
      {
        code: "SCI",
        name: "Self Coherence Index",
        value: SCI,
        level: getLevel(SCI),
        description: "Mức nhất quán giữa mục tiêu, kết quả học tập và hành động hiện tại.",
      },
      {
        code: "MAS",
        name: "Meaning Alignment Score",
        value: MAS,
        level: getLevel(MAS),
        description: "Mức gắn kết giữa động lực học tập, mục tiêu cá nhân và định hướng ngành.",
      },
      {
        code: "CSL",
        name: "Cognitive Stability Level",
        value: CSL,
        level: getLevel(CSL),
        description: "Độ ổn định của nhịp học, luyện tập và khả năng duy trì kế hoạch.",
      },
    ],
  };
}