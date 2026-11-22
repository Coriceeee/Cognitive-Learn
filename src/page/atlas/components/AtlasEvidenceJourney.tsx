import { nationalCutoffs } from "../../../lib/nationalAdmissionRegistry";
import { summarizeAtlasEvidence } from "../../../lib/atlasEvidenceOverview";

const steps = [
  { step: "01", name: "Tìm nguồn", note: "Mở cổng tuyển sinh và kiểm tra năm áp dụng", href: "/atlas/sources" },
  { step: "02", name: "Lọc lựa chọn", note: "Xem ngành, trường và phương thức xét tuyển", href: "/atlas/vietnam" },
  { step: "03", name: "Đối chiếu", note: "So sánh bản ghi có cùng thang và phương thức", href: "/atlas/compare" },
  { step: "04", name: "Lập nguyện vọng", note: "Chuẩn bị phương án theo điểm thực tế của bạn", href: "/atlas/subjects" },
] as const;

/** Display only provenance-based inventory, not an index of every university. */
export default function AtlasEvidenceJourney() {
  const years = summarizeAtlasEvidence(nationalCutoffs);
  const maxRecords = Math.max(1, ...years.map((item) => item.records));
  const total = years.reduce((sum, item) => sum + item.records, 0);
  return (
    <section className="cla-atlas-journey" aria-labelledby="cla-atlas-journey-title">
      <div className="cla-atlas-journey-heading">
        <div>
          <span className="cla-ux-kicker">ATLAS · ĐỌC NGUỒN TRƯỚC KHI QUYẾT ĐỊNH</span>
          <h2 id="cla-atlas-journey-title">Bốn bước để chọn ngành và trường</h2>
          <p>Đi từ thông báo tuyển sinh đến phương án của bạn; không suy ra xác suất đỗ từ điểm chuẩn.</p>
        </div>
        <a href="/atlas/vietnam" className="cla-ux-heading-action">Bắt đầu tra cứu <span aria-hidden="true">↗</span></a>
      </div>
      <nav aria-label="Hành trình tra cứu Atlas" className="cla-atlas-journey-steps">
        {steps.map(({ step, name, note, href }) => (
          <a key={step} href={href} className="cla-atlas-journey-step">
            <span className="cla-atlas-journey-index">{step}</span>
            <strong>{name}</strong>
            <small>{note}</small>
            <span className="cla-atlas-journey-arrow" aria-hidden="true">↗</span>
          </a>
        ))}
      </nav>
      <div className="cla-atlas-evidence-summary" aria-labelledby="cla-atlas-evidence-title">
        <div className="cla-atlas-evidence-intro">
          <span className="cla-ux-kicker">DỮ LIỆU HIỆN CÓ</span>
          <h3 id="cla-atlas-evidence-title">Bản ghi điểm công bố theo năm</h3>
          <p>Đếm bản ghi đã đưa vào kho của ứng dụng, không phải số trường toàn quốc. Năm có nhiều bản ghi hơn không có nghĩa tuyển sinh rộng hơn.</p>
          <strong className="cla-atlas-evidence-total">{total.toLocaleString("vi-VN")} <small>bản ghi của ba năm</small></strong>
        </div>
        <div className="cla-atlas-evidence-years" aria-label="Số bản ghi điểm đã nhập trong kho theo từng năm">
          {years.map((item) => (
            <div className="cla-atlas-evidence-year" key={item.year}>
              <div className="cla-atlas-evidence-year-caption"><strong>{item.year}</strong><span>{item.records} bản ghi · {item.universities} trường</span></div>
              <div className="cla-atlas-evidence-track" role="img" aria-label={`${item.year}: ${item.records} bản ghi, ${item.universities} trường; so sánh số bản ghi, không so sánh điểm`}>
                <i style={{ width: `${(item.records / maxRecords) * 100}%` }} />
              </div>
            </div>
          ))}
          <p className="cla-atlas-evidence-note">Dữ liệu theo năm có thể thiếu; từng nguồn phải được mở và kiểm tra lại trước khi sử dụng.</p>
        </div>
      </div>
    </section>
  );
}
