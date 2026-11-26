import type { CognitiveResult } from "../../../engines/cognitive/cognitiveEngine";
import type { CognitiveGrowthAnalytics } from "../../../engines/history/cognitiveGrowthAnalytics";

type Props = {
  cognitive: CognitiveResult;
  growth: CognitiveGrowthAnalytics | null;
  historyLoading: boolean;
};

export default function LumenObservationJourney({ cognitive, growth, historyLoading }: Props) {
  const observed = (cognitive.dimensions ?? []).filter((item) => item.available === true && Number.isFinite(item.value)).length;
  const canExplain = cognitive.scoreAvailable === true;
  const hasHistory = !historyLoading && growth !== null && growth.overall.previous !== null && growth.dimensions.length > 0;
  const steps = [
    {
      index: "01", title: "Quan sát", href: "/lumen/indices", ready: observed > 0,
      detail: observed > 0 ? `${observed}/7 chỉ số có dữ liệu` : "Chưa có phép đo hợp lệ",
    },
    {
      index: "02", title: "Diễn giải", href: canExplain ? "/lumen/insights" : "/student/profile", ready: canExplain,
      detail: canExplain ? "Có thể xem nhận xét có giới hạn" : "Bổ sung dữ liệu tại Seed",
    },
    {
      index: "03", title: "Theo dõi", href: "/lumen/history", ready: hasHistory,
      detail: historyLoading ? "Đang kiểm tra lịch sử" : hasHistory ? "Có dữ liệu thay đổi giữa hai lần đo" : "Chưa đủ cặp đo hợp lệ",
    },
    {
      index: "04", title: "Hành động", href: "/lumen/roadmap", ready: canExplain,
      detail: canExplain ? "Xem lộ trình tham khảo" : "Chưa thể cá nhân hóa từ dữ liệu thiếu",
    },
  ];
  return (
    <section className="cla-lumen-journey" aria-labelledby="cla-lumen-journey-title">
      <header className="cla-lumen-journey-head">
        <div><span className="cla-ux-kicker">LUMEN · HÀNH TRÌNH HIỂU DỮ LIỆU</span>
          <h2 id="cla-lumen-journey-title">Bắt đầu từ đâu trong LUMEN?</h2>
          <p>SEED cung cấp dữ liệu → LUMEN tính và giải thích 7 chỉ báo → bạn chọn điều chỉnh → theo dõi lần ghi nhận tiếp theo. Đây là các bước sử dụng, không phải bốn cấp độ năng lực.</p>
        </div>
        <a href="/lumen/advanced" className="cla-ux-heading-action">Ước lượng điểm thi <span aria-hidden="true">↗</span></a>
      </header>
      <ol className="cla-lumen-journey-list">
        {steps.map((step) => <li key={step.index}>
          <a href={step.href} className="cla-lumen-journey-link">
            <span className="cla-lumen-journey-index">{step.index}</span>
            <span className="cla-lumen-journey-main"><strong>{step.title}</strong><small>{step.detail}</small></span>
            <span className={`cla-lumen-journey-status ${step.ready ? "is-available" : "is-limited"}`}>{step.ready ? "Có dữ liệu" : "Cần thêm dữ liệu"}</span>
            <span aria-hidden="true" className="cla-lumen-journey-arrow">↗</span>
          </a>
        </li>)}
      </ol>
      <p className="cla-lumen-journey-note">Trạng thái chỉ nói về dữ liệu quan sát; không phải điểm số AI, kết luận tâm lý hay mức độ tiến bộ.</p>
    </section>
  );
}
