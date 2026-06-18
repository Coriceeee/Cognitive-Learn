export type HavenRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type HavenSupportType =
  | "FINANCIAL"
  | "LEARNING"
  | "ADMISSION"
  | "WELLBEING"
  | "SCHOLARSHIP";

export type HavenSupportItem = {
  id: string;
  type: HavenSupportType;
  title: string;
  description: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
};

export type HavenScholarshipOption = {
  title: string;
  fitScore: number;
  reason: string;
  requirements: string[];
};

export type HavenResult = {
  familyPressureScore: number;
  supportReadinessScore: number;
  riskLevel: HavenRiskLevel;
  parentSummary: string;
  teacherSummary: string;
  supportItems: HavenSupportItem[];
  scholarshipOptions: HavenScholarshipOption[];
  warnings: string[];
};

function clamp(value: number, min = 0, max = 100) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function getRiskLevel(score: number): HavenRiskLevel {
  if (score >= 72) return "LOW";
  if (score >= 48) return "MEDIUM";
  return "HIGH";
}

function buildParentSummary(riskLevel: HavenRiskLevel) {
  if (riskLevel === "LOW") {
    return "Gia đình đang có mức hỗ trợ tương đối ổn định. Nên tiếp tục theo dõi học phí, học bổng và kế hoạch xét tuyển để giảm áp lực về sau.";
  }

  if (riskLevel === "MEDIUM") {
    return "Gia đình cần chuẩn bị kỹ hơn về tài chính, lịch học và phương án dự phòng. Nên ưu tiên trường/ngành có học phí phù hợp và cơ hội học bổng rõ ràng.";
  }

  return "Gia đình đang có nguy cơ áp lực cao. Nên giảm lựa chọn quá rủi ro, ưu tiên học bổng, trường có học phí phù hợp và có thêm phương án an toàn.";
}

function buildTeacherSummary(riskLevel: HavenRiskLevel) {
  if (riskLevel === "LOW") {
    return "Học sinh có điều kiện hỗ trợ khá ổn. Giáo viên có thể tập trung vào chiến lược nâng điểm và tối ưu nguyện vọng.";
  }

  if (riskLevel === "MEDIUM") {
    return "Học sinh cần được hỗ trợ theo dõi cả học tập lẫn lựa chọn tuyển sinh. Giáo viên nên phối hợp với phụ huynh để giữ mục tiêu phù hợp.";
  }

  return "Học sinh cần được hỗ trợ sớm. Giáo viên nên giúp học sinh chọn phương án thực tế, tránh áp lực quá mức và ưu tiên lộ trình khả thi.";
}

function buildSupportItems({
  riskLevel,
  tuitionPressure,
  studyPressure,
  admissionRisk,
}: {
  riskLevel: HavenRiskLevel;
  tuitionPressure: number;
  studyPressure: number;
  admissionRisk: number;
}): HavenSupportItem[] {
  const items: HavenSupportItem[] = [];

  if (tuitionPressure >= 60) {
    items.push({
      id: "financial-plan",
      type: "FINANCIAL",
      title: "Lập kế hoạch tài chính tuyển sinh",
      description:
        "So sánh học phí, chi phí sinh hoạt và khả năng học bổng trước khi chốt nhóm trường.",
      priority: tuitionPressure >= 80 ? "HIGH" : "MEDIUM",
    });
  }

  if (studyPressure >= 55) {
    items.push({
      id: "learning-support",
      type: "LEARNING",
      title: "Giảm áp lực học tập bằng kế hoạch tuần",
      description:
        "Chia nhỏ mục tiêu theo tuần, ưu tiên môn ảnh hưởng trực tiếp đến tổ hợp xét tuyển.",
      priority: studyPressure >= 78 ? "HIGH" : "MEDIUM",
    });
  }

  if (admissionRisk >= 55) {
    items.push({
      id: "admission-safety",
      type: "ADMISSION",
      title: "Bổ sung phương án tuyển sinh an toàn",
      description:
        "Cần có nhóm trường an toàn, vừa sức và bứt phá để tránh phụ thuộc vào một lựa chọn.",
      priority: admissionRisk >= 78 ? "HIGH" : "MEDIUM",
    });
  }

  items.push({
    id: "scholarship-track",
    type: "SCHOLARSHIP",
    title: "Theo dõi học bổng phù hợp",
    description:
      "Ưu tiên các trường có học bổng đầu vào, học bổng khuyến khích học tập hoặc hỗ trợ tài chính.",
    priority: riskLevel === "HIGH" ? "HIGH" : "LOW",
  });

  return items;
}

function buildScholarships({
  gpa,
  englishScore,
  financialNeed,
}: {
  gpa: number;
  englishScore: number;
  financialNeed: number;
}): HavenScholarshipOption[] {
  const options: HavenScholarshipOption[] = [];

  options.push({
    title: "Học bổng đầu vào theo điểm xét tuyển",
    fitScore: clamp(gpa * 9 + englishScore * 2),
    reason:
      "Phù hợp nếu học sinh có điểm học tập và điểm xét tuyển ổn định.",
    requirements: [
      "Điểm xét tuyển cao hơn ngưỡng học bổng của trường.",
      "Hồ sơ nộp đúng thời hạn.",
      "Không vi phạm điều kiện tuyển sinh.",
    ],
  });

  options.push({
    title: "Học bổng khuyến khích học tập",
    fitScore: clamp(gpa * 8),
    reason:
      "Phù hợp để duy trì hỗ trợ sau khi nhập học nếu kết quả học tập tốt.",
    requirements: [
      "Duy trì GPA theo quy định của trường.",
      "Không bị cảnh báo học vụ.",
      "Theo dõi thông báo học bổng từng học kỳ.",
    ],
  });

  if (financialNeed >= 55) {
    options.push({
      title: "Hỗ trợ tài chính / miễn giảm học phí",
      fitScore: clamp(financialNeed),
      reason:
        "Phù hợp khi gia đình cần giảm áp lực chi phí trong quá trình học đại học.",
      requirements: [
        "Minh chứng hoàn cảnh tài chính nếu trường yêu cầu.",
        "Đơn đề nghị hỗ trợ tài chính.",
        "Theo dõi chính sách từng trường.",
      ],
    });
  }

  return options.sort((a, b) => b.fitScore - a.fitScore);
}

export function runHavenSupport({
  gpa,
  englishScore,
  tuitionPressure,
  studyPressure,
  admissionRisk,
  financialNeed,
}: {
  gpa: number;
  englishScore: number;
  tuitionPressure: number;
  studyPressure: number;
  admissionRisk: number;
  financialNeed: number;
}): HavenResult {
  const familyPressureScore = clamp(
    tuitionPressure * 0.35 +
      studyPressure * 0.25 +
      admissionRisk * 0.25 +
      financialNeed * 0.15
  );

  const supportReadinessScore = clamp(
    100 - familyPressureScore + gpa * 2 + englishScore
  );

  const riskLevel = getRiskLevel(supportReadinessScore);

  const warnings: string[] = [];

  if (tuitionPressure >= 75) {
    warnings.push("Áp lực học phí cao, cần ưu tiên trường có học phí phù hợp hoặc học bổng.");
  }

  if (studyPressure >= 75) {
    warnings.push("Áp lực học tập cao, cần tránh đặt quá nhiều mục tiêu bứt phá cùng lúc.");
  }

  if (admissionRisk >= 75) {
    warnings.push("Rủi ro tuyển sinh cao, cần bổ sung phương án an toàn.");
  }

  return {
    familyPressureScore: Math.round(familyPressureScore),
    supportReadinessScore: Math.round(supportReadinessScore),
    riskLevel,
    parentSummary: buildParentSummary(riskLevel),
    teacherSummary: buildTeacherSummary(riskLevel),
    supportItems: buildSupportItems({
      riskLevel,
      tuitionPressure,
      studyPressure,
      admissionRisk,
    }),
    scholarshipOptions: buildScholarships({
      gpa,
      englishScore,
      financialNeed,
    }),
    warnings,
  };
}

export function getHavenRiskLabel(riskLevel: HavenRiskLevel) {
  if (riskLevel === "LOW") return "Ổn định";
  if (riskLevel === "MEDIUM") return "Cần theo dõi";
  return "Cần hỗ trợ";
}