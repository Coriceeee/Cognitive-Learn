import { useEffect, useState } from "react";
import { getStudentSubmodules, type StudentModuleKey } from "../../data/moduleSubmodules";

/**
 * Shared small-module navigator. A nested workspace belongs to exactly one
 * main module. Unimplemented functionality is explicit and not clickable.
 */
export default function ModuleSectionNav({ moduleKey }: { moduleKey: StudentModuleKey }) {
  const items = getStudentSubmodules(moduleKey);
  const [expanded, setExpanded] = useState(false);
  const [selectedHash, setSelectedHash] = useState(() => window.location.hash);
  const visible = expanded ? items : items.slice(0, 3);

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash;
      setSelectedHash(hash);
      if (!hash) return;
      // Allow lazy-loaded page sections to mount before jumping to an anchor.
      window.requestAnimationFrame(() => {
        const section = document.getElementById(decodeURIComponent(hash.slice(1)));
        section?.scrollIntoView({ block: "start", behavior: "auto" });
      });
    };
    window.addEventListener("hashchange", syncHash);
    if (window.location.hash) window.requestAnimationFrame(syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  return (
    <nav className="cla-submodule-nav" aria-label="Chức năng nhỏ của module hiện tại">
      <div className="cla-submodule-head">
        <div>
          <span>KHÔNG GIAN CHỨC NĂNG</span>
          <h2>Chọn mục bạn cần</h2>
          <p>Các mục được tách riêng theo nghiệp vụ, không phải module lớn mới.</p>
        </div>
        <a className="cla-submodule-all" href="/student/modules">← Các module của học sinh</a>
      </div>
      <div className="cla-submodule-grid">
        {visible.map((item) => {
          const active = Boolean(item.href && item.href.includes("#") && item.href.endsWith(selectedHash) && selectedHash);
          return (
            <article className={`cla-submodule-card ${active ? "is-active" : ""}`} key={item.id}>
              <span className="cla-submodule-category">{item.group}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="cla-submodule-foot">
                {item.href && item.status !== "planned" ? (
                  <a href={item.href} aria-current={active ? "location" : undefined}>Mở chức năng</a>
                ) : (
                  <span className="cla-submodule-unavailable">Đang phát triển</span>
                )}
                {item.status === "partial" && <small>Đang hoàn thiện dữ liệu / kiểm thử</small>}
              </div>
            </article>
          );
        })}
      </div>
      {items.length > 3 && (
        <button type="button" className="cla-submodule-toggle" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>
          {expanded ? "Thu gọn các mục" : `Xem thêm ${items.length - 3} mục`}
        </button>
      )}
    </nav>
  );
}
