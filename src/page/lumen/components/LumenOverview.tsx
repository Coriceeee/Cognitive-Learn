type Props = {
  fullName: string;
  targetMajor: string;
  targetUniversity: string;
  overallScore: number;
  scoreAvailable?: boolean;
};

export default function LumenOverview({
  fullName,
  targetMajor,
  targetUniversity,
  overallScore,
  scoreAvailable = true,
}: Props) {
  return (
    <section className="lumen-overview-card">

      <div className="lumen-overview-copy">

        <span className="lumen-eyebrow">
          LUMEN · DẤU VÂN TAY TRÍ TUỆ
        </span>

        <p className="lumen-overview-greeting">Xin chào, {fullName || "bạn"}.</p>
        <h1>
          Hiểu dữ liệu học tập của bạn,
          <br />
          biết nên làm gì tiếp theo.
        </h1>

        <p>
          Lumen đọc thông tin bạn đã cung cấp ở Seed, hiển thị 7 chỉ báo học tập
          theo quy tắc thử nghiệm và gợi ý việc có thể thử tiếp.
          Đây không phải bài kiểm tra IQ, chẩn đoán tâm lý hay dự báo chắc chắn.
        </p>

        <div className="lumen-overview-next">
          <a className="lumen-overview-start" href="/lumen/indices">Hiểu 7 chỉ số của tôi <span aria-hidden="true">↗</span></a>
          <small>Nhập dữ liệu ở SEED → LUMEN tính và giải thích → bạn chọn bước tiếp theo</small>
        </div>

        <div className="lumen-overview-tags" aria-label="Định hướng hiện tại từ hồ sơ SEED">
          <div className="lumen-overview-tag">
            <span>Ngành quan tâm</span>
            <strong>{targetMajor || "Chưa chọn ngành"}</strong>
          </div>
          <div className="lumen-overview-tag">
            <span>Trường dự kiến</span>
            <strong>{targetUniversity || "Chưa chọn trường"}</strong>
          </div>
        </div>

      </div>

      <div className="lumen-score-orb">
        <small>
          Tổng hợp thử nghiệm
        </small>

        <strong>
          {scoreAvailable ? Math.round(overallScore) : "—"}
        </strong>

        <span>{scoreAvailable ? "/ 100 · Không phải IQ" : "Chưa đủ dữ liệu"}</span>
      </div>

    </section>
  );
}