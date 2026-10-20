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
          LUMEN INTELLIGENCE
        </span>

        <h1>
          Hi {fullName || "Student"}.
          <br />
          Đây là bức tranh hiện tại
          của bạn.
        </h1>

        <p>
          Lumen kết hợp trạng thái nhận thức,
          dự đoán, mô phỏng và chiến lược
          để biến dữ liệu thành những lựa chọn
          có thể hành động.
        </p>

        <div className="lumen-overview-tags">
          <span>
            {targetMajor ||
              "Chưa đặt ngành"}
          </span>

          <span>
            {targetUniversity ||
              "Chưa đặt trường"}
          </span>
        </div>

      </div>

      <div className="lumen-score-orb">
        <small>
          Cognitive state
        </small>

        <strong>
          {scoreAvailable ? Math.round(overallScore) : "—"}
        </strong>

        <span>{scoreAvailable ? "/ 100" : "Chưa đủ dữ liệu"}</span>
      </div>

    </section>
  );
}