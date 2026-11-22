/** CP62 — Data-source availability for the student homepage.
 * These are binary prerequisites, NOT scores, diagnostics or validated indices.
 * Keep evidence semantics separate from research SCI / MAS / CSL measures.
 */
export type StudentDataSignal = {
  id: "profile" | "cognitive" | "growth";
  label: string;
  available: boolean;
  status: string;
  detail: string;
};

export function studentDataSignals(input: {
  hasProfile: boolean;
  hasCognitiveScore: boolean;
  hasComparableGrowth: boolean;
}): StudentDataSignal[] {
  // No child signal is shown as available if the parent profile is absent.
  const cognitiveAvailable = input.hasProfile && input.hasCognitiveScore;
  const growthAvailable = input.hasProfile && input.hasComparableGrowth;
  return [
    {
      id: "profile",
      label: "Hồ sơ Seed",
      available: input.hasProfile,
      status: input.hasProfile ? "Đã có dữ liệu" : "Chưa có hồ sơ",
      detail: input.hasProfile ? "Hồ sơ học tập đã được tải" : "Tạo hoặc hoàn thiện hồ sơ học tập",
    },
    {
      id: "cognitive",
      label: "Quan sát Cognitive",
      available: cognitiveAvailable,
      status: cognitiveAvailable ? "Có chỉ báo" : "Chưa có phép đo",
      detail: cognitiveAvailable ? "Chỉ báo thử nghiệm, không phải chẩn đoán" : "Cần thực hiện phép đo phù hợp",
    },
    {
      id: "growth",
      label: "Lịch sử Growth",
      available: growthAvailable,
      status: growthAvailable ? "Có thể so sánh" : "Chưa đủ lịch sử",
      detail: growthAvailable ? "Có ít nhất hai lần quan sát đủ điều kiện" : "Cần thêm quan sát hợp lệ ở thời điểm khác",
    },
  ];
}

export function countAvailableSignals(signals: readonly StudentDataSignal[]): number {
  return signals.filter((signal) => signal.available).length;
}
