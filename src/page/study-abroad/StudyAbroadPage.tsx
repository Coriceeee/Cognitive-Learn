import { useEffect, useMemo, useState } from "react";
import appLogo from "../../assets/logo cla.png";
import UserMenu from "../../components/common/UserMenu";
import ModuleSectionNav from "../../components/common/ModuleSectionNav";
import { countryCatalog, findCountry, searchCountries } from "../../data/globalCountryCatalog";
import { internationalRoutes } from "../../data/internationalPathways";
import "../../styles.css";

/**
 * Atlas owns domestic and international admission / study-abroad exploration.
 * Haven owns scholarships, affordability and financial support.
 * ISO country selection is global; curated institution-level information is deliberately
 * limited to destinations with known source links. Missing destinations NEVER inherit
 * academic/financial requirements from another country.
 */
export default function StudyAbroadPage() {
  useEffect(() => {
    // Preserve legacy bookmarks while keeping study-abroad routes under Atlas.
    if (window.location.pathname === "/study-abroad" || window.location.pathname === "/haven/study-abroad") {
      window.history.replaceState(window.history.state, "", `/atlas/study-abroad${window.location.search}${window.location.hash}`);
    }
  }, []);
  const [countryCode, setCountryCode] = useState(() => new URLSearchParams(window.location.search).get("country") || "");
  const [countrySearch, setCountrySearch] = useState("");
  const [fieldSearch, setFieldSearch] = useState("");
  const [checked, setChecked] = useState<string[]>([]);
  const selectedCountry = findCountry(countryCode);
  const selectedRoute = internationalRoutes.find(item => item.isoCode === countryCode);
  const countriesFound = useMemo(() => searchCountries(countrySearch), [countrySearch]);
  const countriesToShow = useMemo(() => {
    if (countriesFound.some(item => item.code === countryCode)) return countriesFound;
    const current = findCountry(countryCode);
    return current ? [current, ...countriesFound] : countriesFound;
  }, [countriesFound, countryCode]);
  const curatedMatches = useMemo(() => internationalRoutes.filter(route =>
    !fieldSearch.trim() || route.studyFields.some(tag => tag.toLocaleLowerCase("vi").includes(fieldSearch.trim().toLocaleLowerCase("vi")))
  ), [fieldSearch]);
  const requirements = selectedRoute ? [
    ...selectedRoute.academic,
    ...selectedRoute.certificates,
    ...selectedRoute.scholarshipDocuments,
  ] : [];

  function chooseCountry(code: string) {
    setCountryCode(code);
    setChecked([]);
    const url = new URL(window.location.href);
    if (code) url.searchParams.set("country", code);
    else url.searchParams.delete("country");
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }
  function renderRequirement(item: string) {
    return <li key={item}><label><input type="checkbox" checked={checked.includes(item)} onChange={event => setChecked(current => event.target.checked ? [...current, item] : current.filter(value => value !== item))}/><span>{item}</span></label></li>;
  }

  return <main className="cla-study-abroad-page">
    <header className="cla-study-header"><a href="/atlas" aria-label="Về Atlas Admission"><img src={appLogo} alt="CLA" /></a><UserMenu /></header>
    <section className="cla-study-shell">
      <div className="cla-study-hero">
        <span className="cla-eyebrow">ATLAS ADMISSION · DU HỌC TOÀN CẦU</span>
        <h1>Tra cứu quốc gia, chương trình du học và điều kiện chuẩn bị</h1>
        <p>Chọn bất kỳ quốc gia/vùng lãnh thổ nào trong danh mục ISO 3166-1. Với những điểm đến đã có nguồn tham khảo, Atlas hiển thị trường, hướng nộp hồ sơ và danh sách chứng chỉ cần kiểm tra. Nơi chưa có dữ liệu xác minh sẽ được ghi rõ, không tạo trường, học phí, yêu cầu hay học bổng giả.</p>
        <nav className="cla-study-actions" aria-label="Các trang tra cứu du học">
          <a href={`/atlas/study-abroad${countryCode ? `?country=${countryCode}` : ""}`}>Chọn quốc gia</a>
          <a href={`/atlas/study-abroad/programs${countryCode ? `?country=${countryCode}` : ""}`}>Trường & chương trình</a>
          <a href={`/atlas/study-abroad/requirements${countryCode ? `?country=${countryCode}` : ""}`}>Điều kiện & chứng chỉ</a>
          <a href={`/atlas/study-abroad/sources${countryCode ? `?country=${countryCode}` : ""}`}>Nguồn & quy trình</a>
        </nav>
      </div>
      <ModuleSectionNav moduleKey="atlas" />

      <section id="study-destinations" className="cla-study-panel" aria-label="Bộ lọc điểm đến du học">
        <div className="cla-explorer-filters">
          <label>Tìm quốc gia/vùng lãnh thổ
            <input type="search" value={countrySearch} onChange={event => setCountrySearch(event.target.value)} placeholder="Gõ tên tiếng Việt, tiếng Anh hoặc mã ISO (ví dụ: Canada, CA)" />
          </label>
          <label>Chọn điểm đến ({countryCatalog.length} mục ISO)
            <select aria-label="Quốc gia hoặc vùng lãnh thổ du học" value={countryCode} onChange={event => chooseCountry(event.target.value)}>
              <option value="">Chọn quốc gia/vùng lãnh thổ…</option>
              {countriesToShow.map(entry => <option key={entry.code} value={entry.code}>{entry.name} ({entry.code}){internationalRoutes.some(route => route.isoCode === entry.code) ? " · Đã có nguồn" : " · Chờ dữ liệu"}</option>)}
            </select>
          </label>
          <label>Lĩnh vực cần học (lọc lộ trình tham khảo)
            <input type="search" value={fieldSearch} onChange={event => setFieldSearch(event.target.value)} placeholder="Ví dụ: kỹ thuật, kinh tế, CNTT" />
          </label>
        </div>
        {countriesFound.length === 0 && <p role="status">Không tìm thấy tên trong danh mục. Hãy thử tên tiếng Anh hoặc mã quốc gia ISO.</p>}
        <p className="cla-source-count">Danh mục {countryCatalog.length} quốc gia/vùng lãnh thổ · {internationalRoutes.length} điểm đến có hồ sơ nguồn minh họa · các nơi còn lại chưa có dữ liệu chi tiết xác minh.</p>
        <div className="cla-source-tags" aria-label="Các điểm đến có nguồn tham khảo">
          {curatedMatches.map(route => <button type="button" aria-pressed={countryCode === route.isoCode} key={route.isoCode} onClick={() => chooseCountry(route.isoCode)}>{route.country}</button>)}
        </div>
        {curatedMatches.length === 0 && <p>Chưa có điểm đến đã xác minh theo từ khóa ngành này. Danh mục quốc gia vẫn có thể tra cứu; không suy ra mọi quốc gia đều đào tạo ngành đã nhập.</p>}
      </section>

      <div className="cla-study-columns">
        <section id="study-programs" className="cla-study-panel" aria-live="polite">
          <span className="cla-eyebrow">TRƯỜNG / CHƯƠNG TRÌNH / NGUỒN</span>
          <h2>{selectedCountry?.name ?? "Chưa chọn điểm đến"}</h2>
          {!countryCode ? <div className="cla-unverified-destination" role="status"><strong>Chọn một quốc gia để bắt đầu.</strong><p>CLA không tự chọn quốc gia thay bạn. Chỉ các điểm đến có hồ sơ nguồn mới hiển thị thông tin chi tiết; các điểm đến còn lại được ghi rõ là chưa có dữ liệu xác minh.</p></div> : selectedRoute ? <>
            <p className="cla-source-count">Có danh sách nguồn tham khảo ban đầu; chưa kiểm định đủ điều kiện theo chương trình hoặc năm nhập học.</p>
            <p><strong>Nhóm ngành tham khảo:</strong> {selectedRoute.studyFields.join(" · ")}</p>
            {selectedRoute.targetInstitutions.map(inst => <article key={inst.name} className="cla-study-school">
              <h3>{inst.name}</h3>
              <a href={inst.admissionsUrl} target="_blank" rel="noopener noreferrer">Mở trang tuyển sinh của trường ↗</a>
              {inst.scholarshipUrl && <a href={inst.scholarshipUrl} target="_blank" rel="noopener noreferrer">Mở nguồn học bổng ↗</a>}
            </article>)}
            <a className="cla-study-official" href={selectedRoute.governmentSource} target="_blank" rel="noopener noreferrer">{selectedRoute.sourceLabel} ↗</a>
            <p className="cla-source-caution">{selectedRoute.note}</p>
          </> : <div className="cla-unverified-destination" role="status">
            <strong>Chưa có hồ sơ nguồn được xác minh cho điểm đến này.</strong>
            <p>CLA chưa có danh sách trường, yêu cầu IELTS/TOEFL, SAT/ACT, ngôn ngữ địa phương, chi phí, visa hay học bổng chính thức theo từng chương trình ở {selectedCountry?.name}. Các trường này được để trống thay vì sao chép thông số của nước khác.</p>
            <a href="https://whed.net/home.php" target="_blank" rel="noopener noreferrer">Tra cứu hệ thống giáo dục và trường được công nhận qua IAU WHED ↗</a>
            <p>Tiếp theo cần đối chiếu website cơ quan giáo dục nước sở tại, trường, đại sứ quán và đơn vị cấp học bổng trước khi gắn nguồn vào CLA.</p>
          </div>}
        </section>

        <section id="study-requirements" className="cla-study-panel">
          <span className="cla-eyebrow">ĐIỀU KIỆN & CHỨNG CHỈ</span>
          <h2>Danh sách chuẩn bị hồ sơ</h2>
          {selectedRoute ? <>
            <p>Đánh dấu việc đã tự kiểm tra. Checklist chỉ tồn tại trong phiên trang và không xác nhận bạn đủ điều kiện trúng tuyển.</p>
            <h3>Điều kiện học thuật cần kiểm tra</h3><ul className="cla-requirement-list">{selectedRoute.academic.map(renderRequirement)}</ul>
            <h3>Chứng chỉ quốc tế / ngoại ngữ</h3><ul className="cla-requirement-list">{selectedRoute.certificates.map(renderRequirement)}</ul>
            <h3>Hồ sơ học bổng / tài chính</h3><ul className="cla-requirement-list">{selectedRoute.scholarshipDocuments.map(renderRequirement)}</ul>
            <p role="status" className="cla-source-count">Đã tự kiểm: {checked.length}/{requirements.length} mục. Không đồng nghĩa được trường hoặc học bổng chấp thuận.</p>
            <button type="button" onClick={() => setChecked([])}>Đặt lại checklist</button>
          </> : <>
            <p>Chưa có yêu cầu cụ thể được xác minh cho quốc gia này. Không hiển thị ngưỡng IELTS, GPA, chứng chỉ, ngân sách hoặc deadline suy đoán.</p>
            <h3>Các thông tin cần tra từ nguồn chính thức</h3>
            <ul className="cla-requirement-list">
              <li>Tên trường và chương trình được công nhận</li>
              <li>Điều kiện văn bằng THPT, môn tiên quyết và chứng chỉ ngoại ngữ</li>
              <li>Học phí, chi phí sinh hoạt, bảo hiểm và hồ sơ thị thực</li>
              <li>Học bổng, điều kiện quốc tịch, mức tài trợ và hạn nộp</li>
              <li>Ngày/năm hiệu lực, trang tuyển sinh và phương thức nộp chính thức</li>
            </ul>
          </>}
        </section>
      </div>

      <section id="study-sources" className="cla-source-explorer" aria-label="Quy trình kiểm tra thông tin">
        <h2>Quy trình kiểm tra hồ sơ theo từng quốc gia và trường</h2>
        <div className="cla-study-checkpoints">
          <article><strong>01 · Tư cách chương trình</strong><p>Trường được công nhận, bậc học, ngôn ngữ giảng dạy và văn bằng.</p></article>
          <article><strong>02 · Chứng chỉ</strong><p>Kiểm tra từng ngành: IELTS/TOEFL, SAT/ACT, JLPT, TOPIK, TestDaF hoặc chứng chỉ khác — chỉ khi nguồn yêu cầu.</p></article>
          <article><strong>03 · Chi phí & thị thực</strong><p>Học phí theo năm, chỗ ở, sinh hoạt, bảo hiểm, visa và thông tin chứng minh tài chính.</p></article>
          <article><strong>04 · Học bổng</strong><p>Mức tài trợ, điều kiện, giấy tờ, deadline và đường dẫn cấp học bổng chính thức.</p></article>
        </div>
      </section>
      <p className="cla-source-footnote">Tra cứu học bổng và khả năng tài chính chi tiết tại <a href="/haven/scholarships">Haven Support</a>. Atlas không tự xác nhận đủ điều kiện nộp hồ sơ. Danh mục điểm đến: mã ISO 3166-1, tên hiển thị tiếng Việt. IAU WHED là nguồn tra hệ thống giáo dục và các cơ sở giáo dục được công nhận, không thay thế cổng nộp hồ sơ. Các lộ trình có nguồn minh họa được tích hợp từ ngày 08/11/2026, không tự động cập nhật; cần kiểm tra lại năm tuyển sinh khi nộp đơn.</p>
    </section>
  </main>;
}
