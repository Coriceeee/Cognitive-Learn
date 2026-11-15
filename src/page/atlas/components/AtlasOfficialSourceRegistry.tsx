import { useMemo, useState } from "react";
import { admissionYears, methodLabels, officialUniversities } from "../../../data/officialAdmissionSources";

/** Source completeness is shown as a provenance metric, not a national coverage claim. */
export default function AtlasOfficialSourceRegistry() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("ALL");
  const universities = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("vi-VN");
    return officialUniversities.filter(item =>
      (region === "ALL" || item.region === region) &&
      (!needle || [item.name, ...item.fieldTags].join(" ").toLocaleLowerCase("vi-VN").includes(needle)),
    );
  }, [query, region]);
  const yearRecords = officialUniversities.flatMap(university => university.years);
  const methodVerifiedCount = yearRecords.filter(record => record.detailsStatus === "institution_method_verified").length;
  const archiveOnlyCount = yearRecords.filter(record => record.detailsStatus === "official_archive_only").length;
  const missingYearCount = officialUniversities.length * admissionYears.length - yearRecords.length;
  const totalYearSlots = officialUniversities.length * admissionYears.length;

  return (
    <section id="atlas-source-registry" className="cla-source-explorer" aria-labelledby="atlas-source-registry-title">
      <div className="cla-explorer-heading">
        <span className="cla-eyebrow">ATLAS · SOURCE REGISTER</span>
        <h2 id="atlas-source-registry-title">Nguồn tuyển sinh có thể truy vết</h2>
        <p>Danh mục hiện có {officialUniversities.length} trường có nguồn chính thức đã đối chiếu trong CLA. Đây là danh sách đang được xây dựng, <strong>không phải toàn bộ đại học Việt Nam</strong> và không bảo đảm đủ dữ liệu ngành/phương thức của mọi năm.</p>
      </div>
      <div className="cla-source-registry-metrics" aria-label="Phạm vi dữ liệu nguồn">
        <article><strong>{officialUniversities.length}</strong><span>trường trong danh mục</span></article>
        <article><strong>{yearRecords.length}</strong><span>bản ghi nguồn theo năm</span></article>
        <article><strong>{methodVerifiedCount}</strong><span>bản ghi đã đối chiếu nhóm phương thức</span></article>
        <article><strong>{missingYearCount}</strong><span>năm còn thiếu bản ghi</span></article>
      </div>
      <div className="cla-source-coverage" role="img" aria-label={`${methodVerifiedCount} bản ghi nhóm phương thức, ${archiveOnlyCount} bản ghi nguồn lưu trữ, ${missingYearCount} năm còn thiếu trên ${totalYearSlots} cặp trường-năm trong danh mục`}>
        <div className="cla-source-coverage-track" aria-hidden="true">
          <span className="is-method" style={{ width: `${methodVerifiedCount / totalYearSlots * 100}%` }} />
          <span className="is-archive" style={{ width: `${archiveOnlyCount / totalYearSlots * 100}%` }} />
          <span className="is-missing" style={{ width: `${missingYearCount / totalYearSlots * 100}%` }} />
        </div>
        <div className="cla-source-coverage-legend">
          <span><i className="is-method" /> Đã đối chiếu nhóm phương thức: {methodVerifiedCount}</span>
          <span><i className="is-archive" /> Có nguồn, còn chuẩn hóa: {archiveOnlyCount}</span>
          <span><i className="is-missing" /> Chưa đối chiếu: {missingYearCount}</span>
        </div>
        <p>Độ đầy đủ của <strong>{totalYearSlots} cặp trường–năm trong danh mục hiện có</strong>, không phải tỷ lệ bao phủ tuyển sinh quốc gia.</p>
      </div>
      <div className="cla-source-registry-search">
        <label>Tìm tên trường hoặc lĩnh vực
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ví dụ: khoa học dữ liệu, kỹ thuật, UEH…" />
        </label>
        <label>Khu vực
          <select value={region} onChange={event => setRegion(event.target.value)}>
            <option value="ALL">Tất cả khu vực trong danh mục</option>
            <option value="Bắc">Miền Bắc</option>
            <option value="Nam">Miền Nam</option>
          </select>
        </label>
      </div>
      <p className="cla-source-count" role="status">Hiển thị {universities.length}/{officialUniversities.length} trường phù hợp.</p>
      <div className="cla-source-cards">
        {universities.map(university => (
          <article className="cla-source-card" key={university.id}>
            <div className="cla-source-card-head">
              <h3>{university.name}</h3>
              <span>{university.region === "Bắc" ? "Miền Bắc" : "Miền Nam"}</span>
            </div>
            <p><strong>Lĩnh vực có thể tìm:</strong> {university.fieldTags.join(" · ")}</p>
            <div className="cla-source-links">
              <a href={university.portalUrl} target="_blank" rel="noopener noreferrer">Cổng tuyển sinh chính thức ↗</a>
              {university.applicationUrl && <a href={university.applicationUrl} target="_blank" rel="noopener noreferrer">Cổng đăng ký ↗</a>}
            </div>
            <div className="cla-source-year-list">
              {admissionYears.map(year => {
                const record = university.years.find(item => item.year === year);
                return (
                  <div key={year} className="cla-source-year-row">
                    <strong>{year}</strong>
                    {record ? <>
                      <span className={record.detailsStatus === "institution_method_verified" ? "is-verified" : "is-archive"}>
                        {record.detailsStatus === "institution_method_verified" ? "Nhóm phương thức đã đối chiếu" : "Có nguồn · cần chuẩn hóa"}
                      </span>
                      <a href={record.schemeUrl} target="_blank" rel="noopener noreferrer">{record.schemeLabel} ↗</a>
                      {record.methods.length > 0 && <small>{record.methods.map(method => methodLabels[method]).join(" · ")}</small>}
                      <small>{record.methodNotes}</small>
                    </> : <span className="is-archive">Chưa có bản ghi theo năm</span>}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
        {universities.length === 0 && <p role="status" className="cla-source-empty">Chưa có trường khớp từ khóa trong danh mục hiện tại. Không có kết quả không có nghĩa trường đó không tuyển sinh.</p>}
      </div>
      <p className="cla-source-footnote">Nguồn được dẫn đến cổng tuyển sinh/trang thông báo chính thức. Một nguồn năm không đồng nghĩa đã chuẩn hóa mã ngành, điểm chuẩn, tổ hợp, chỉ tiêu hoặc điều kiện đủ tiêu chuẩn. Hãy xem đề án gốc theo năm trước khi nộp hồ sơ.</p>
    </section>
  );
}
