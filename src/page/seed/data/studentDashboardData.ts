import type { LearningPlan, RecommendationCard, SubjectScore } from "../types";

export const subjectScores: SubjectScore[] = [
  {
    subject: "Toán",
    score: "7.8",
    change: "+0.6",
  },
  {
    subject: "Ngữ văn",
    score: "7.1",
    change: "+0.2",
  },
  {
    subject: "Tiếng Anh",
    score: "8.4",
    change: "+0.4",
  },
  {
    subject: "Vật lý",
    score: "7.0",
    change: "+0.5",
  },
  {
    subject: "Hóa học",
    score: "6.8",
    change: "+0.3",
  },
  {
    subject: "Sinh học",
    score: "7.4",
    change: "+0.1",
  },
];

export const learningPlans: LearningPlan[] = [
  {
    content: "Tăng 2 buổi Toán mỗi tuần để kéo điểm tổ hợp A01.",
  },
  {
    content: "Giữ nhịp Tiếng Anh vì đây là môn lợi thế hiện tại.",
  },
  {
    content: "Giảm đổi mục tiêu trong 14 ngày để tăng độ ổn định nhận thức.",
  },
];

export const recommendationCards: RecommendationCard[] = [
  {
    title: "Ngành phù hợp",
    value: "CNTT",
    desc: "Phù hợp với năng lực Toán - Anh và mục tiêu nghề nghiệp hiện tại.",
  },
  {
    title: "Tổ hợp đề xuất",
    value: "A01",
    desc: "Toán - Lý - Anh đang có tổng điểm dự báo tốt nhất.",
  },
  {
    title: "Nhóm trường",
    value: "Vừa sức",
    desc: "Ưu tiên PTIT, Bách khoa, Công nghiệp Hà Nội theo mức rủi ro.",
  },
];