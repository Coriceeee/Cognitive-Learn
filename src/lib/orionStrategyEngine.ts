export type OrionRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type OrionSubjectScore = {
  subject: string;
  label: string;
  currentScore: number;
  targetScore: number;
  importance: number;
};

export type OrionScenario = {
  id: string;
  title: string;
  description: string;
  expectedGain: number;
  feasibility: number;
  riskLevel: OrionRiskLevel;
  focusSubjects: string[];
  weeklyHours: number;
};

export type OrionMilestone = {
  week: number;
  title: string;
  target: string;
  actions: string[];
};

export type OrionStrategyResult = {
  overallGap: number;
  readinessScore: number;
  riskLevel: OrionRiskLevel;
  bestScenario: OrionScenario;
  scenarios: OrionScenario[];
  focusSubjects: OrionSubjectScore[];
  milestones: OrionMilestone[];
  warnings: string[];
  summary: string;
};

function clamp(value: number, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function normalizeScore(value: number) {
  return clamp((value / 10) * 100);
}

function getRiskLevel(readinessScore: number): OrionRiskLevel {
  if (readinessScore >= 76) return "LOW";
  if (readinessScore >= 55) return "MEDIUM";
  return "HIGH";
}

function getRiskLabel(riskLevel: OrionRiskLevel) {
  if (riskLevel === "LOW") return "Ổn định";
  if (riskLevel === "MEDIUM") return "Cần tăng tốc";
  return "Rủi ro cao";
}

function sortFocusSubjects(subjects: OrionSubjectScore[]) {
  return [...subjects].sort((a, b) => {
    const gapA = Math.max(0, a.targetScore - a.currentScore) * a.importance;
    const gapB = Math.max(0, b.targetScore - b.currentScore) * b.importance;

    return gapB - gapA;
  });
}

function buildScenarios({
  focusSubjects,
  weeksLeft,
}: {
  focusSubjects: OrionSubjectScore[];
  weeksLeft: number;
}): OrionScenario[] {
  const topFocus = sortFocusSubjects(focusSubjects).slice(0, 3);
  const topSubjectLabels = topFocus.map((subject) => subject.label);

  return [
    {
      id: "balanced",
      title: "Chiến lược cân bằng",
      description:
        "Duy trì các môn đang ổn, đồng thời tăng đều các môn còn thiếu điểm.",
      expectedGain: round1(Math.min(1.2, weeksLeft * 0.05)),
      feasibility: 82,
      riskLevel: "LOW",
      focusSubjects: topSubjectLabels,
      weeklyHours: 10,
    },
    {
      id: "focused",
      title: "Chiến lược tập trung",
      description:
        "Dồn lực vào 2–3 môn ảnh hưởng trực tiếp đến tổ hợp/ngành mục tiêu.",
      expectedGain: round1(Math.min(1.8, weeksLeft * 0.075)),
      feasibility: 70,
      riskLevel: "MEDIUM",
      focusSubjects: topSubjectLabels.slice(0, 2),
      weeklyHours: 14,
    },
    {
      id: "breakthrough",
      title: "Chiến lược bứt phá",
      description:
        "Tăng cường luyện đề, sửa lỗi sai và đẩy mạnh môn yếu trong thời gian ngắn.",
      expectedGain: round1(Math.min(2.4, weeksLeft * 0.1)),
      feasibility: 55,
      riskLevel: "HIGH",
      focusSubjects: topSubjectLabels,
      weeklyHours: 18,
    },
  ];
}

function buildMilestones({
  bestScenario,
  weeksLeft,
}: {
  bestScenario: OrionScenario;
  weeksLeft: number;
}): OrionMilestone[] {
  const safeWeeks = Math.max(4, weeksLeft);

  return [
    {
      week: 1,
      title: "Ổn định nền điểm",
      target: "Xác định môn cần ưu tiên và lỗi sai lặp lại.",
      actions: [
        "Làm bài kiểm tra đầu vào cho từng môn trọng tâm.",
        "Ghi lại nhóm lỗi sai theo chương.",
        "Chốt lịch học cố định mỗi tuần.",
      ],
    },
    {
      week: Math.max(2, Math.floor(safeWeeks * 0.35)),
      title: "Tăng tốc theo tổ hợp",
      target: `Tập trung vào ${bestScenario.focusSubjects.join(", ") || "môn trọng tâm"}.`,
      actions: [
        "Luyện đề theo từng chuyên đề.",
        "Ưu tiên câu dễ mất điểm nhưng có khả năng cải thiện nhanh.",
        "Theo dõi điểm sau mỗi tuần.",
      ],
    },
    {
      week: Math.max(3, Math.floor(safeWeeks * 0.7)),
      title: "Mô phỏng xét tuyển",
      target: "Chạy lại Atlas Admission Engine bằng điểm mới.",
      actions: [
        "Làm đề mô phỏng có giới hạn thời gian.",
        "So sánh điểm với nhóm ngành an toàn/vừa sức/bứt phá.",
        "Điều chỉnh danh sách nguyện vọng.",
      ],
    },
    {
      week: safeWeeks,
      title: "Chốt chiến lược",
      target: "Tối ưu nguyện vọng và phương thức xét tuyển.",
      actions: [
        "Chọn nhóm trường an toàn, vừa sức, bứt phá.",
        "Kiểm tra lại học phí, học bổng và nguồn tuyển sinh.",
        "Chuẩn bị hồ sơ theo từng phương thức xét tuyển.",
      ],
    },
  ];
}

export function runOrionStrategy({
  subjects,
  weeksLeft,
  targetMajor,
}: {
  subjects: OrionSubjectScore[];
  weeksLeft: number;
  targetMajor?: string;
}): OrionStrategyResult {
  const focusSubjects = sortFocusSubjects(subjects);

  const averageCurrent =
    subjects.reduce((sum, subject) => sum + subject.currentScore, 0) /
    Math.max(1, subjects.length);

  const averageTarget =
    subjects.reduce((sum, subject) => sum + subject.targetScore, 0) /
    Math.max(1, subjects.length);

  const overallGap = round1(Math.max(0, averageTarget - averageCurrent));

  const readinessScore = clamp(
    round1(normalizeScore(averageCurrent) - overallGap * 4 + weeksLeft * 0.6)
  );

  const riskLevel = getRiskLevel(readinessScore);

  const scenarios = buildScenarios({
    focusSubjects,
    weeksLeft,
  });

  const bestScenario =
    riskLevel === "LOW"
      ? scenarios[0]
      : riskLevel === "MEDIUM"
        ? scenarios[1]
        : scenarios[2];

  const warnings: string[] = [];

  if (overallGap >= 1.5) {
    warnings.push("Khoảng cách điểm còn lớn, cần ưu tiên chiến lược tăng tốc.");
  }

  if (weeksLeft < 8) {
    warnings.push("Thời gian còn ít, nên ưu tiên luyện đề và sửa lỗi sai trọng tâm.");
  }

  if (!targetMajor?.trim()) {
    warnings.push("Chưa nhập ngành mục tiêu, Orion đang tạo chiến lược tổng quát.");
  }

  const summary = `Orion đánh giá mức sẵn sàng hiện tại là ${readinessScore}/100 (${getRiskLabel(
    riskLevel
  )}). Chiến lược đề xuất: ${bestScenario.title}.`;

  return {
    overallGap,
    readinessScore,
    riskLevel,
    bestScenario,
    scenarios,
    focusSubjects,
    milestones: buildMilestones({
      bestScenario,
      weeksLeft,
    }),
    warnings,
    summary,
  };
}