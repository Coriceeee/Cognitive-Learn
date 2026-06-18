import {
  getSourceTypeLabel,
  getStatusClass,
  getStatusLabel,
  type AtlasAdmissionSource,
  type AtlasUniversity,
} from "../../../lib/atlasKnowledgeBase";

type AtlasReviewPanelProps = {
  sources: AtlasAdmissionSource[];
  universityMap: Record<string, AtlasUniversity>;
  onApproveSource: (sourceId: string) => void;
  onRejectSource: (sourceId: string) => void;
  onResetReviews: () => void;
};

export default function AtlasReviewPanel({
  sources,
  universityMap,
  onApproveSource,
  onRejectSource,
  onResetReviews,
}: AtlasReviewPanelProps) {
  const pendingSources = sources.filter((source) => source.status === "pending");

  return (
    <section id="atlas-review" className="atlas-review-panel">
      <div className="atlas-review-head">
        <div>
          <span>CLA AI Verification</span>
          <h2>Duyệt nguồn tuyển sinh</h2>
          <p>
            Dữ liệu do Gemini hoặc admin nhập sẽ được kiểm tra tại đây trước khi
            đưa vào Atlas Engine.
          </p>
        </div>

        <button type="button" onClick={onResetReviews}>
          Reset trạng thái
        </button>
      </div>

      {pendingSources.length === 0 ? (
        <div className="atlas-review-empty">
          <strong>Không còn nguồn chờ duyệt</strong>
          <p>
            Tất cả nguồn tuyển sinh hiện tại đã được xử lý. Bạn có thể reset để
            test lại flow duyệt dữ liệu.
          </p>
        </div>
      ) : (
        <div className="atlas-review-grid">
          {pendingSources.map((source) => {
            const university = universityMap[source.universityId];

            return (
              <article key={source.id} className="atlas-review-card">
                <div className="atlas-review-card-top">
                  <span>{getSourceTypeLabel(source.sourceType)}</span>

                  <em className={`atlas-status ${getStatusClass(source.status)}`}>
                    {getStatusLabel(source.status)}
                  </em>
                </div>

                <h3>{source.title}</h3>

                <p>
                  {university?.name || "Chưa rõ trường"} · Năm tuyển sinh{" "}
                  {source.sourceYear}
                </p>

                <div className="atlas-review-meta">
                  <span>Trích xuất: {source.extractedBy}</span>
                  <span>Cập nhật: {source.updatedAt}</span>
                  <span>Link nguồn: {source.sourceUrl === "#" ? "Chưa gắn" : "Đã gắn"}</span>
                </div>

                <div className="atlas-review-actions">
                  <button
                    type="button"
                    onClick={() => onApproveSource(source.id)}
                  >
                    Xác minh
                  </button>

                  <button
                    type="button"
                    className="danger"
                    onClick={() => onRejectSource(source.id)}
                  >
                    Từ chối
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}