import { useMemo, useState } from "react";
import { officialScholarships, searchScholarships } from "../../data/officialScholarships";

/** Sourced opportunities only; does not imply eligibility, admission or award probabilities. */
export default function HavenScholarshipExplorer() {
  const [query, setQuery] = useState("");
  const [countryCode, setCountryCode] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, string[]>>({});
  const matches = useMemo(() => searchScholarships(query, countryCode), [query, countryCode]);
  return (
    <section className="cla-scholarship-explorer" aria-labelledby="cla-scholarship-title">
      <header className="cla-scholarship-heading">
        <div>
          <span>HAVEN · HỌC BỔNG CÓ NGUỒN</span>
          <h2 id="cla-scholarship-title">Thư viện học bổng bậc đại học</h2>
          <p>Mỗi học bổng có đơn vị cấp, đường dẫn nguồn, điều kiện cần kiểm tra và tình trạng kỳ tuyển. Đây là danh mục cơ hội, <strong>không phải kết quả xét đủ điều kiện hoặc xác suất nhận học bổng.</strong></p>
        </div>
        <div className="cla-scholarship-summary"><strong>{officialScholarships.length}</strong><span>hồ sơ nguồn ban đầu</span></div>
      </header>
      <div className="cla-scholarship-controls">
        <label>Tìm theo tên học bổng / lĩnh vực
          <input value={query} onChange={event => setQuery(event.target.value)} type="search" placeholder="Ví dụ: ASEAN, công nghệ, MEXT…" />
        </label>
        <label>Quốc gia
          <select value={countryCode} onChange={event => setCountryCode(event.target.value)}>
            <option value="ALL">Tất cả điểm đến đã có nguồn</option>
            <option value="SG">Singapore</option>
            <option value="JP">Nhật Bản</option>
            <option value="KR">Hàn Quốc</option>
            <option value="AU">Úc</option>
          </select>
        </label>
      </div>
      <div className="cla-scholarship-track" aria-label="Phạm vi nguồn học bổng">
        <div><strong>{matches.length}</strong><small>hồ sơ phù hợp bộ lọc</small></div>
        <div><strong>4</strong><small>quốc gia có nguồn thí điểm</small></div>
        <div><strong>0</strong><small>học bổng đã xác nhận đang nhận hồ sơ</small></div>
      </div>
      <p className="cla-scholarship-hint" role="status">Ngày rà soát nguồn: 11/11/2026. Hạn nộp và tính mở của kỳ tuyển phải kiểm tra trực tiếp tại nguồn; một số hồ sơ là đợt đã qua.</p>
      <div className="cla-scholarship-list">
        {matches.map(item => {
          const isExpanded = expandedId === item.id;
          const checklist = checked[item.id] || [];
          return <article className="cla-scholarship-item" key={item.id}>
            <div className="cla-scholarship-item-top">
              <div>
                <span className="cla-scholarship-country">{item.country} · {item.level}</span>
                <h3>{item.name}</h3>
                <p>{item.provider}</p>
              </div>
              <span className={item.availability === "archive-cycle" ? "cla-scholarship-state is-archive" : "cla-scholarship-state"}>
                {item.availability === "archive-cycle" ? "Tham khảo đợt công bố" : "Cần kiểm tra kỳ đang mở"}
              </span>
            </div>
            <p>{item.focus}</p>
            <div className="cla-scholarship-source">
              <strong>Căn cứ nguồn:</strong> <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.sourceLabel} ↗</a>
              <span>Đã rà soát {item.reviewedDate}</span>
            </div>
            <button className="cla-scholarship-expand" type="button" aria-expanded={isExpanded}
              onClick={() => setExpandedId(isExpanded ? null : item.id)}>
              {isExpanded ? "Thu gọn điều kiện" : "Xem điều kiện, chứng chỉ và hồ sơ cần chuẩn bị"}
            </button>
            {isExpanded && <div className="cla-scholarship-details">
              <h4>Điều kiện cần đối chiếu tại nguồn</h4>
              <ul>{item.conditions.map(condition => <li key={condition}>{condition}</li>)}</ul>
              <h4>Danh sách tự kiểm tra hồ sơ</h4>
              <ul className="cla-scholarship-checks">{item.documentChecks.map(condition => <li key={condition}>
                <label><input type="checkbox" checked={checklist.includes(condition)} onChange={event => setChecked(current => {
                  const active = current[item.id] || [];
                  return { ...current, [item.id]: event.target.checked ? [...active, condition] : active.filter(value => value !== condition) };
                })} /><span>{condition}</span></label>
              </li>)}</ul>
              <p className="cla-scholarship-check-progress">Đã tự đánh dấu {checklist.length}/{item.documentChecks.length} mục – không xác nhận bạn đạt điều kiện.</p>
              <p><strong>Chứng chỉ:</strong> {item.credentialNote}</p>
              <p><strong>Quy trình:</strong> {item.applicationPath}</p>
              <p><strong>Kỳ tuyển và hạn nộp:</strong> {item.intakeNote}</p>
              <p><strong>Hỗ trợ:</strong> {item.benefitNote}</p>
            </div>}
          </article>;
        })}
        {matches.length === 0 && <div className="cla-scholarship-empty" role="status">Chưa có học bổng nào trong danh mục thí điểm khớp bộ lọc. Điều này không có nghĩa quốc gia đó không có học bổng.</div>}
      </div>
      <p className="cla-scholarship-hint">Danh sách tự đánh dấu chỉ tồn tại trong phiên trang. CLA chưa thu thập/chấm điểm khả năng trúng học bổng; điều kiện ngoại ngữ và deadline luôn cần kiểm tra tại nguồn của từng chương trình và kỳ tuyển.</p>
    </section>
  );
}
