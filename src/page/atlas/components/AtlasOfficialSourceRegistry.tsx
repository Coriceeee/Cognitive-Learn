import {auditNationalCoverage} from "../../../lib/nationalCoverageAudit";
import { nationalCutoffs, normalizeNational } from "../../../lib/nationalAdmissionRegistry";
import { useMemo, useState } from "react";
import { admissionYears, methodLabels, officialUniversities } from "../../../data/officialAdmissionSources";

/** Source completeness is shown as a provenance metric, not a national coverage claim. */
export default function AtlasOfficialSourceRegistry() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("ALL");
  const universities = useMemo(() => {
    const needle = normalizeNational(query);
    return officialUniversities.filter(item =>
      (region === "ALL" || item.region === region) &&
      (!needle || normalizeNational([item.id, item.name, ...item.fieldTags].join(" ")).includes(needle)),
    );
  }, [query, region]);
  const yearRecords = officialUniversities.flatMap(university => university.years);
  const methodVerifiedCount = yearRecords.filter(record => record.detailsStatus === "institution_method_verified").length;
  const archiveOnlyCount = yearRecords.filter(record => record.detailsStatus === "official_archive_only").length;
  const missingYearCount = officialUniversities.length * admissionYears.length - yearRecords.length;
  const totalYearSlots = officialUniversities.length * admissionYears.length;
  const audit = useMemo(() => auditNationalCoverage(), []);

  return (
    <section id="atlas-source-registry" className="cla-source-explorer" aria-labelledby="atlas-source-registry-title">
      <div className="cla-explorer-heading">
        <span className="cla-eyebrow">ATLAS · SOURCE REGISTER</span>
        <h2 id="atlas-source-registry-title">Nguồn tuyển sinh có thể truy vết</h2>
        <p>Danh mục hiện có {officialUniversities.length} trường có nguồn chính thức đã đối chiếu trong CLA. Đây là danh sách đang được xây dựng, <strong>không phải toàn bộ đại học Việt Nam</strong> và không bảo đảm đủ dữ liệu ngành/phương thức của mọi năm.</p>
      </div>
      <p><a href="https://tuyensinh.moet.gov.vn/ts/" target="_blank" rel="noopener noreferrer">Tra cứu mã trường và thông tin tại cổng tuyển sinh Bộ GD&amp;ĐT ↗</a> · Nếu trường chưa có trong CLA, kiểm tra tại cổng Bộ và trang trường. CLA chưa đồng bộ được toàn bộ danh mục của Bộ.</p>
      <p><strong>{officialUniversities.length}</strong> đơn vị trong danh mục · <strong>{nationalCutoffs.length}</strong> giá trị điểm chuẩn · <strong>{yearRecords.length}</strong> nguồn theo năm. Chưa có mẫu số quốc gia đã xác nhận.</p>
      <div className="cla-source-coverage" aria-label="Biểu đồ nguồn theo từng năm trong kho cục bộ">
        <h3>Độ phủ theo mùa tuyển sinh</h3>
        {audit.summary.map(y=><div key={y.year} className="cla-source-year-list"><strong>{y.year}</strong>{([['Có nguồn',y.sourceSchools],['Nhóm phương thức',y.methodSchools],['Điểm chuẩn',y.cutoffSchools],['Mã ngành',y.programSchools],['Tổ hợp',y.combinationSchools]] as const).map(([label,n])=><div key={label} style={{display:'grid',gridTemplateColumns:'minmax(100px, 1fr) 2fr auto',alignItems:'center',gap:'8px'}}><small>{label}</small>{n===null?<small>Chưa kiểm kê</small>:<div className="cla-source-coverage-track"><span className="is-method" style={{width:`${n/y.registrySchools*100}%`}}/></div>}<small>{n===null?'—':`${n}/${y.registrySchools}`}</small></div>)}</div>)}
        <p>Các nhóm bằng chứng độc lập, có thể chồng lấp; không cộng thành tỷ lệ hoàn thành toàn quốc.</p>
      </div>
      <div className="cla-source-coverage" aria-label="Độ phủ tổ hợp trong danh mục 2026">
        <h3>Tổ hợp 2026 · nguồn và khả năng đối chiếu</h3>
        {audit.rows.filter(r=>(r.years[0].programRecords??0)>0).sort((a,b)=>(b.years[0].programRecords??0)-(a.years[0].programRecords??0)).map(r=>{const y=r.years[0],total=y.programRecords??0,mapped=y.mappedCombinationRecords??0,sourced=y.combinationRecords??0;return <div key={r.id} style={{display:'grid',gridTemplateColumns:'minmax(110px, 1.5fr) 2fr auto',alignItems:'center',gap:'8px',marginBottom:'6px'}}><small>{r.name}</small><div className="cla-source-coverage-track"><span className="is-method" style={{width:`${mapped/total*100}%`}}/><span className="is-archive" style={{width:`${(sourced-mapped)/total*100}%`}}/><span className="is-missing" style={{width:`${(total-sourced)/total*100}%`}}/></div><small>{mapped}/{sourced}/{total}</small></div>})}
        <p>Ánh xạ được ít nhất một tổ hợp / có nguồn tổ hợp / tổng mã trong kho. Một mã có tổ hợp ánh xạ được vẫn có thể có điều kiện khác hoặc tổ hợp chưa ánh xạ.</p>
        <div className="cla-source-coverage-legend"><span><i className="is-method"/> Có ánh xạ</span><span><i className="is-archive"/> Có nguồn, chưa ánh xạ</span><span><i className="is-missing"/> Chưa có tổ hợp</span></div>
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
            <option value="Trung">Miền Trung</option>
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
              <span>Miền {university.region}</span>
            </div>
            <p><strong>Lĩnh vực có thể tìm:</strong> {university.fieldTags.join(" · ")}</p>
            <div className="cla-source-links">
              <a href={university.portalUrl} target="_blank" rel="noopener noreferrer">Cổng tuyển sinh chính thức ↗</a>
              {university.applicationUrl && <a href={university.applicationUrl} target="_blank" rel="noopener noreferrer">Cổng đăng ký ↗</a>}
            </div>
            <div className="cla-source-year-list">
              {admissionYears.map(year => {
                const record = university.years.find(item => item.year === year);
                const numericCount = nationalCutoffs.filter(item => item.universityId === university.id && item.year === year).length;
                return (
                  <div key={year} className="cla-source-year-row">
                    <strong>{year}</strong>
                    {record ? <>
                      <span className={record.detailsStatus === "institution_method_verified" ? "is-verified" : "is-archive"}>
                        {record.detailsStatus === "institution_method_verified" ? "Nhóm phương thức đã đối chiếu" : "Có nguồn · cần chuẩn hóa"}
                      </span>
                      <a href={record.schemeUrl} target="_blank" rel="noopener noreferrer">{record.schemeLabel} ↗</a>
                      {record.methods.length > 0 && <small>{record.methods.map(method => methodLabels[method]).join(" · ")}</small>}
                      {record.cutoffUrl && <a href={record.cutoffUrl} target="_blank" rel="noopener noreferrer">Thông báo điểm chuẩn ↗</a>}
                      <small>{numericCount ? `${numericCount} giá trị điểm chuẩn đã nhập (không đồng nghĩa đủ mọi phương thức)` : "Chưa có giá trị điểm chuẩn chuẩn hóa"}</small>
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
