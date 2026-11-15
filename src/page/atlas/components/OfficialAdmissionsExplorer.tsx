import { useMemo, useState } from "react";
import {
  admissionYears, findOfficialUniversities, methodLabels, officialUniversities,
  type AdmissionMethodTag, type AdmissionYear,
} from "../../../data/officialAdmissionSources";

import { verifiedPrograms, parseScore30, historicalGap } from "../../../data/verifiedAdmissionPrograms";

const methodOptions = Object.entries(methodLabels) as [AdmissionMethodTag, string][];

export default function OfficialAdmissionsExplorer() {
  const [year, setYear] = useState<AdmissionYear>(2026);
  const [field, setField] = useState("");
  const [method, setMethod] = useState<AdmissionMethodTag | "ALL">("ALL");
  const [compareAll, setCompareAll] = useState(true);
  const [scoreInput, setScoreInput] = useState("");
  const score = parseScore30(scoreInput);
  const filterTerm = field.trim().toLowerCase() === "cntt" ? "Công nghệ thông tin" : field;
  const relevantPrograms = verifiedPrograms.filter(program => !filterTerm.trim() || `${program.major} ${program.code}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(filterTerm.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
  const results = useMemo(() => findOfficialUniversities(field, year, method), [field, year, method]);
  return (
    <section className="cla-source-explorer" id="atlas-official-admissions" aria-labelledby="atlas-source-title">
      <div className="cla-explorer-heading">
        <span className="cla-eyebrow">ATLAS · NGUỒN TUYỂN SINH ĐÃ ĐỐI CHIẾU</span>
        <h2 id="atlas-source-title">Tra cứu trực tiếp 3 năm tuyển sinh 2024–2026</h2>
        <p>Chọn lĩnh vực và phương thức để tìm trường đáng tìm hiểu. Những ngành cụ thể, điểm chuẩn, chỉ tiêu và điều kiện từng tổ hợp phải đối chiếu ở đề án của chính trường theo từng năm; CLA chưa tự động suy ra xác suất đỗ.</p>
      </div>
      <div className="cla-explorer-filters">
        <label>Ngành / lĩnh vực muốn học
          <input type="search" value={field} placeholder="Ví dụ: CNTT, kỹ thuật, kinh doanh…" onChange={event => setField(event.target.value)} />
        </label>
        <label>Năm tham chiếu
          <select value={year} onChange={event => setYear(Number(event.target.value) as AdmissionYear)}>
            {admissionYears.map(value => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>
        <label>Phương thức xét tuyển
          <select value={method} onChange={event => setMethod(event.target.value as AdmissionMethodTag | "ALL")}>
            <option value="ALL">Tất cả phương thức</option>
            {methodOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
        </label>
      </div>
      <p className="cla-source-count" role="status">{results.length} / {officialUniversities.length} trường có nguồn phù hợp trong danh mục đã xác minh. Đây chưa phải danh mục toàn bộ các đại học Việt Nam.</p>
      <div className="cla-source-cards">
        {results.map(university => {
          const selected = university.years.find(item => item.year === year)!;
          return <article className="cla-source-card" key={university.id}>
            <div className="cla-source-card-head"><h3>{university.name}</h3><span>{university.region}</span></div>
            <p><strong>Lĩnh vực tham khảo:</strong> {university.fieldTags.join(" · ")}</p>
            <p><strong>Năm {year}:</strong> {selected.methodNotes}</p>
            {selected.methods.length > 0
              ? <div className="cla-source-tags" aria-label="Phương thức có trong nguồn"><span className="sr-only">Phương thức: </span>{selected.methods.map(tag => <span key={tag}>{methodLabels[tag]}</span>)}</div>
              : <p className="cla-source-caution">Chưa chuẩn hóa phương thức năm này — mở thông báo chính thức để kiểm tra.</p>}
            <div className="cla-source-links">
              <a href={selected.schemeUrl} target="_blank" rel="noopener noreferrer">Đề án / thông báo {year} ↗</a>
              {selected.cutoffUrl && <a href={selected.cutoffUrl} target="_blank" rel="noopener noreferrer">Điểm trúng tuyển {year} ↗</a>}
              <a href={university.portalUrl} target="_blank" rel="noopener noreferrer">Cổng tuyển sinh ↗</a>
              {university.applicationUrl && <a href={university.applicationUrl} target="_blank" rel="noopener noreferrer">Cổng hồ sơ (kiểm tra kỳ mở) ↗</a>}
            </div>
            <small className="cla-source-caution">Nguồn trường công bố; chưa đối chiếu riêng mã ngành / tổ hợp / điểm chuẩn trên hệ thống CLA. Cổng đăng ký có thể đóng khi hết mùa tuyển sinh.</small>
          </article>;
        })}
      </div>
      {results.length === 0 && <p className="cla-source-empty">Chưa có trường được xác minh cho bộ lọc này. Thử tìm lĩnh vực rộng hơn; không có kết quả không có nghĩa ngành/trường không tuyển.</p>}
      <div className="cla-compare-toggle">
        <label><input type="checkbox" checked={compareAll} onChange={event => setCompareAll(event.target.checked)} /> Hiển thị nguồn ba năm của từng trường để so sánh thay đổi</label>
      </div>
      {compareAll && <div className="cla-source-compare" role="region" aria-label="Bảng đối chiếu 3 năm" tabIndex={0}>
        <table><thead><tr><th scope="col">Trường</th>{admissionYears.map(y => <th scope="col" key={y}>Năm {y}</th>)}</tr></thead><tbody>
          {results.map(u => <tr key={u.id}><th scope="row">{u.name}</th>{admissionYears.map(y => {
            const record = u.years.find(item => item.year === y);
            return <td key={y}>{record ? <><a target="_blank" rel="noopener noreferrer" href={record.schemeUrl}>Xem văn bản năm {y}</a><small>{record.methods.length ? record.methods.map(tag => methodLabels[tag]).join(" · ") : "Cần đọc và chuẩn hóa đề án"}</small></> : "Chưa đối chiếu"}</td>;
          })}</tr>)}
        </tbody></table>
      </div>}
      <details className="cla-major-history-disclosure">
        <summary>Bộ dữ liệu điểm chuẩn chi tiết đã đối chiếu: PTIT BVH · 10 ngành · 2024–2025</summary>
      <section className="cla-major-history" aria-labelledby="cla-major-title">
        <h3 id="cla-major-title">Ví dụ tra điểm ngành đã xác minh tại PTIT — cơ sở Hà Nội (BVH)</h3>
        <p>Các ngành dưới đây đã đối chiếu được mã ngành và điểm lịch sử 2024–2025 trên trang trường. Không quy đổi điểm các kỳ thi TSA/HSA/SAT thành thang THPT; bảng điểm chuẩn 2026 đã được PTIT công bố chính thức nhưng CLA chưa nhập số từ bảng ảnh khi chưa đối chiếu từng dòng/thang điểm.</p>
        <p><a href="https://tuyensinh.ptit.edu.vn/thong-bao-diem-chuan-trung-tuyen-vao-dai-hoc-he-chinh-quy-nam-2026/" target="_blank" rel="noopener noreferrer">Xem bảng điểm chuẩn PTIT 2026 chính thức theo từng phương thức ↗</a></p>
        <label className="cla-score-label">Tổng điểm thi THPT của bạn (thang 30, chưa cộng ưu tiên)
          <input type="text" inputMode="decimal" value={scoreInput} onChange={event => setScoreInput(event.target.value)} placeholder="Ví dụ 25,50 (để trống nếu chưa có)" />
        </label>
        {scoreInput && score === null && <p role="alert" className="cla-source-caution">Chỉ nhập điểm 0–30, tối đa 2 chữ số thập phân. Không nhập điểm GPA 10 hay HSA/TSA.</p>}
        <div className="cla-major-grid">
          {relevantPrograms.map(program => <article className="cla-major-card" key={program.code}>
            <strong>{program.major}</strong><small>Mã {program.code} · PTIT BVH (Hà Nội)</small>
            <p><strong>Tổ hợp 2026:</strong> {program.combinations2026.join(", ")}</p>
            <p><strong>Phương thức 2026:</strong> {program.methods2026.join(" · ")}</p>
            <div className="cla-major-cutoffs">
              {program.historicalCutoffs.map(entry => <div key={entry.year}>
                <span>{entry.year} · Điểm THPT BVH</span>
                <a href={entry.source} target="_blank" rel="noopener noreferrer">{entry.cutoff.toFixed(2)} ↗</a>
                {score !== null && <small>Chênh điểm tham khảo: {historicalGap(score, entry.cutoff) > 0 ? "+" : ""}{historicalGap(score, entry.cutoff).toFixed(2)}</small>}
              </div>)}
            </div>
            <a className="cla-major-scheme" href={program.source2026} target="_blank" rel="noopener noreferrer">Xem mã ngành, tổ hợp và phương thức 2026 từ PTIT ↗</a>
          </article>)}
        </div>
        {relevantPrograms.length === 0 && <p className="cla-source-empty">Chưa có mã ngành và điểm lịch sử đã xác minh cho tên này trong danh mục thí điểm.</p>}
        <p className="cla-source-caution">Chênh lệch với điểm trúng tuyển lịch sử KHÔNG phải dự báo đỗ/trượt: năm tuyển sinh, chỉ tiêu, cách quy đổi điểm, đối tượng ưu tiên, thứ tự nguyện vọng và cách xét tuyển có thể thay đổi. Nếu xét trường khác, hãy dùng link đề án chính thức phía trên.</p>
      </section>
      </details>
      <p className="cla-source-footnote">Cập nhật kiểm tra nguồn: 08/11/2026. Dữ liệu lịch sử chỉ để tham khảo; phương thức và ngưỡng năm sau có thể thay đổi. Đề án gốc của từng trường luôn có ưu tiên cao hơn thông tin tóm tắt trong CLA.</p>
    </section>
  );
}
