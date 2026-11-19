import { useMemo, useState } from "react";
import {
  admissionYears, findOfficialUniversities, methodLabels, officialUniversities,
  type AdmissionMethodTag, type AdmissionYear,
} from "../../../data/officialAdmissionSources";

const methodOptions = Object.entries(methodLabels) as [AdmissionMethodTag, string][];

export default function OfficialAdmissionsExplorer() {
  const [year, setYear] = useState<AdmissionYear>(2026);
  const [field, setField] = useState("");
  const [method, setMethod] = useState<AdmissionMethodTag | "ALL">("ALL");
  const [compareAll, setCompareAll] = useState(true);
  const results = useMemo(() => findOfficialUniversities(field, year, method), [field, year, method]);
  return (
    <section className="cla-source-explorer" id="atlas-official-admissions" aria-labelledby="atlas-source-title">
      <div className="cla-explorer-heading">
        <span className="cla-eyebrow">ATLAS · NGUỒN TUYỂN SINH ĐÃ ĐỐI CHIẾU</span>
        <h2 id="atlas-source-title">Tra cứu trực tiếp 3 năm tuyển sinh 2024–2026</h2>
        <p>Chọn lĩnh vực và phương thức để tìm trường đáng tìm hiểu. Những ngành cụ thể, điểm chuẩn, chỉ tiêu và điều kiện từng tổ hợp phải đối chiếu ở đề án của chính trường theo từng năm; CLA chưa tự động suy ra xác suất đỗ.</p>
      </div>
      <p><a href="https://tuyensinh.moet.gov.vn/ts/thong-tin" target="_blank" rel="noopener noreferrer">Tra cứu danh mục cơ sở đào tạo toàn quốc trên cổng Bộ GD&amp;ĐT ↗</a> · Các trường chưa có trong CLA vẫn có thể tra cứu tại đây.</p>
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
      <div className="cla-major-history-disclosure"><a href="/atlas/compare#atlas-decision-comparison">So sánh điểm cấp ngành 2024–2026 giữa các trường ↗</a><p>Dữ liệu điểm đã nhập không đại diện toàn bộ tuyển sinh Việt Nam. Chọn năm, mã xét tuyển, cơ sở và phương thức riêng trong bộ so sánh; không quy đổi các thang điểm khác nhau.</p></div>
      <p className="cla-source-footnote">Danh mục trường: nguồn đã ghi nhận trong kho Atlas; dữ liệu cấp ngành có nguồn riêng. Dữ liệu lịch sử chỉ để tham khảo; phương thức và ngưỡng năm sau có thể thay đổi. Đề án gốc của từng trường luôn có ưu tiên cao hơn thông tin tóm tắt trong CLA.</p>
    </section>
  );
}
