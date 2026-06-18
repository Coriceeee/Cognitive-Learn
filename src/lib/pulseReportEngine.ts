export type PulseRiskLevel = "GOOD" | "WATCH" | "RISK";

export type PulseTrend = "UP" | "STABLE" | "DOWN";

export type PulseMetric = {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  score: number;
  riskLevel: PulseRiskLevel;
  description: string;
};

export type PulseAction = {
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
};

export type PulseReportResult = {
  overallScore: number;
  riskLevel: PulseRiskLevel;
  trend: PulseTrend;
  metrics: PulseMetric[];
  studentSummary: string;
  parentSummary: string;
  teacherSummary: string;
  actions: PulseAction[];
  warnings: string[];
};

function clamp(value: number, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function getRiskLevel(score: number): PulseRiskLevel {
  if (score >= 76) return "GOOD";
  if (score >= 55) return "WATCH";
  return "RISK";
}

function getTrend({
  currentScore,
  previousScore,
}: {
  currentScore: number;
  previousScore: number;
}): PulseTrend {
  const gap = currentScore - previousScore;

  if (gap >= 4) return "UP";
  if (gap <= -4) return "DOWN";
  return "STABLE";
}

function buildMetric({
  id,
  label,
  value,
  target,
  unit,
  description,
}: {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  description: string;
}): PulseMetric {
  const score = target <= 0 ? 0 : clamp(round1((value / target) * 100));

  return {
    id,
    label,
    value,
    target,
    unit,
    score,
    riskLevel: getRiskLevel(score),
    description,
  };
}

function buildActions(metrics: PulseMetric[]): PulseAction[] {
  const actions: PulseAction[] = [];

  const riskyMetrics = metrics.filter((metric) => metric.riskLevel === "RISK");
  const watchMetrics = metrics.filter((metric) => metric.riskLevel === "WATCH");

  if (riskyMetrics.length > 0) {
    actions.push({
      title: "Ưu tiên xử lý điểm yếu trong tuần này",
      description: `Các mục cần chú ý: ${riskyMetrics
        .map((metric) => metric.label)
        .join(", ")}.`,
      priority: "HIGH",
    });
  }

  if (watchMetrics.length > 0) {
    actions.push({
      title: "Theo dõi nhóm chỉ số trung bình",
      description:
        "Các chỉ số đang ở mức cần quan sát, nên kiểm tra lại sau 7 ngày.",
      priority: "MEDIUM",
    });
  }

  actions.push({
    title: "Cập nhật hồ sơ học sinh định kỳ",
    description:
      "Nhập lại điểm, mục tiêu ngành và kết quả mô phỏng để Pulse tạo báo cáo sát hơn.",
    priority: "LOW",
  });

  return actions;
}

function buildStudentSummary(score: number, riskLevel: PulseRiskLevel) {
  if (riskLevel === "GOOD") {
    return `Bạn đang ở trạng thái tốt với điểm tổng ${score}/100. Nên tiếp tục giữ nhịp học và tối ưu nhóm nguyện vọng phù hợp.`;
  }

  if (riskLevel === "WATCH") {
    return `Bạn đang ở mức cần theo dõi với điểm tổng ${score}/100. Nên tập trung vào các môn hoặc chỉ số còn thiếu để tăng độ an toàn xét tuyển.`;
  }

  return `Bạn đang ở nhóm rủi ro với điểm tổng ${score}/100. Cần ưu tiên kế hoạch tăng điểm, cập nhật hồ sơ và chọn thêm phương án an toàn.`;
}

function buildParentSummary(score: number, riskLevel: PulseRiskLevel) {
  if (riskLevel === "GOOD") {
    return `Học sinh đang có tiến độ ổn định. Phụ huynh nên hỗ trợ duy trì lịch học, theo dõi học phí/học bổng và chuẩn bị hồ sơ tuyển sinh.`;
  }

  if (riskLevel === "WATCH") {
    return `Học sinh cần được hỗ trợ theo dõi sát hơn trong giai đoạn tới. Nên xem lại mục tiêu ngành, lịch học và phương án xét tuyển dự phòng.`;
  }

  return `Học sinh đang có dấu hiệu rủi ro. Phụ huynh nên cùng học sinh điều chỉnh mục tiêu, giảm áp lực không cần thiết và tăng phương án an toàn.`;
}

function buildTeacherSummary(score: number, riskLevel: PulseRiskLevel) {
  if (riskLevel === "GOOD") {
    return `Học sinh có nền tảng khá tốt. Giáo viên có thể giao nhiệm vụ nâng cao và định hướng thêm chiến lược xét tuyển.`;
  }

  if (riskLevel === "WATCH") {
    return `Học sinh cần được theo dõi ở một số chỉ số. Giáo viên nên ưu tiên sửa lỗi sai lặp lại và kiểm tra tiến độ theo tuần.`;
  }

  return `Học sinh cần can thiệp sớm. Giáo viên nên xác định môn trọng tâm, giảm dàn trải và tạo kế hoạch học tập ngắn hạn.`;
}

export function runPulseReport({
  cognitiveScore,
  previousCognitiveScore,
  admissionReadiness,
  orionReadiness,
  atlasProgramCount,
  aspirationCount,
  weeklyStudyHours,
  targetWeeklyHours,
}: {
  cognitiveScore: number;
  previousCognitiveScore: number;
  admissionReadiness: number;
  orionReadiness: number;
  atlasProgramCount: number;
  aspirationCount: number;
  weeklyStudyHours: number;
  targetWeeklyHours: number;
}): PulseReportResult {
  const metrics = [
    buildMetric({
      id: "cognitive",
      label: "Nhận thức học tập",
      value: clamp(cognitiveScore),
      target: 100,
      unit: "/100",
      description: "Tổng hợp từ Lumen Cognitive Engine.",
    }),
    buildMetric({
      id: "admission",
      label: "Sẵn sàng tuyển sinh",
      value: clamp(admissionReadiness),
      target: 100,
      unit: "/100",
      description: "Tổng hợp từ Atlas Admission Engine.",
    }),
    buildMetric({
      id: "orion",
      label: "Chiến lược học tập",
      value: clamp(orionReadiness),
      target: 100,
      unit: "/100",
      description: "Tổng hợp từ Orion Strategy.",
    }),
    buildMetric({
      id: "atlas",
      label: "Dữ liệu ngành",
      value: atlasProgramCount,
      target: 10,
      unit: " ngành",
      description: "Số ngành đã có trong Atlas Knowledge Base.",
    }),
    buildMetric({
      id: "aspiration",
      label: "Nguyện vọng",
      value: aspirationCount,
      target: 8,
      unit: " NV",
      description: "Số nguyện vọng đã được Admission Engine gợi ý.",
    }),
    buildMetric({
      id: "study-hours",
      label: "Giờ học/tuần",
      value: weeklyStudyHours,
      target: targetWeeklyHours,
      unit: " giờ",
      description: "Mức độ bám sát kế hoạch học tập.",
    }),
  ];

  const overallScore = round1(
    metrics.reduce((sum, metric) => sum + metric.score, 0) / metrics.length
  );

  const riskLevel = getRiskLevel(overallScore);
  const trend = getTrend({
    currentScore: cognitiveScore,
    previousScore: previousCognitiveScore,
  });

  const warnings: string[] = [];

  if (atlasProgramCount === 0) {
    warnings.push("Chưa có dữ liệu ngành trong Atlas, báo cáo tuyển sinh còn thiếu.");
  }

  if (aspirationCount === 0) {
    warnings.push("Chưa có danh sách nguyện vọng đề xuất từ Admission Engine.");
  }

  if (weeklyStudyHours < targetWeeklyHours * 0.7) {
    warnings.push("Thời lượng học hiện tại thấp hơn đáng kể so với mục tiêu.");
  }

  if (trend === "DOWN") {
    warnings.push("Chỉ số nhận thức đang giảm so với kỳ trước.");
  }

  return {
    overallScore,
    riskLevel,
    trend,
    metrics,
    studentSummary: buildStudentSummary(overallScore, riskLevel),
    parentSummary: buildParentSummary(overallScore, riskLevel),
    teacherSummary: buildTeacherSummary(overallScore, riskLevel),
    actions: buildActions(metrics),
    warnings,
  };
}

export function getPulseRiskLabel(riskLevel: PulseRiskLevel) {
  if (riskLevel === "GOOD") return "Ổn định";
  if (riskLevel === "WATCH") return "Cần theo dõi";
  return "Rủi ro";
}

export function getPulseTrendLabel(trend: PulseTrend) {
  if (trend === "UP") return "Đang tăng";
  if (trend === "DOWN") return "Đang giảm";
  return "Ổn định";
}