import type { CognitiveResult } from "../types";

type CognitiveInsightPanelProps = {
  cognitive: CognitiveResult;
  hasProfile: boolean;
  onCreateProfile: () => void;
};

function getRiskText(riskLevel: CognitiveResult["riskLevel"]) {
  if (riskLevel === "LOW") return "Ổn định";
  if (riskLevel === "MEDIUM") return "Cần theo dõi";
  if (riskLevel === "HIGH") return "Nguy cơ cao";
  return "Chưa đủ dữ liệu";
}

export default function CognitiveInsightPanel({
  cognitive,
  hasProfile,
  onCreateProfile,
}: CognitiveInsightPanelProps) {
  return (
    <section className="student-insight-panel">
      <div className="student-insight-main">
        <span>PHÂN TÍCH LUMEN</span>
        <h2>{hasProfile ? "Tóm tắt trạng thái học tập" : "Lumen đang chờ hồ sơ"}</h2>
        <p>{cognitive.summary}</p>

        {!hasProfile && (
          <button type="button" onClick={onCreateProfile}>
            Nhập hồ sơ để phân tích
          </button>
        )}
      </div>

      <div className="student-insight-metrics">
        <div>
          <span>Điểm tổng</span>
          <strong>{cognitive.overallScore}</strong>
        </div>

        <div>
          <span>Rủi ro</span>
          <strong>{getRiskText(cognitive.riskLevel)}</strong>
        </div>

        <div>
          <span>Xu hướng GPA</span>
          <strong>{cognitive.trendLabel}</strong>
        </div>

        <div>
          <span>Độ tin cậy</span>
          <strong>{cognitive.confidenceScore}%</strong>
        </div>
      </div>

      <div className="student-insight-grid">
        <article>
          <h3>Điểm hệ thống phát hiện</h3>

          {cognitive.insights.length > 0 ? (
            <ul>
              {cognitive.insights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Chưa có đủ dữ liệu để tạo nhận xét chi tiết.</p>
          )}
        </article>

        <article>
          <h3>Cảnh báo</h3>

          {cognitive.warnings.length > 0 ? (
            <ul>
              {cognitive.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Chưa phát hiện cảnh báo nghiêm trọng.</p>
          )}
        </article>

        <article>
          <h3>Hành động đề xuất</h3>

          {cognitive.nextActions.length > 0 ? (
            <ul>
              {cognitive.nextActions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Tiếp tục duy trì kế hoạch hiện tại.</p>
          )}
        </article>
      </div>
    </section>
  );
}