import { getStudentSubmodules, type StudentModuleKey } from "../../data/moduleSubmodules";
import { currentFocusedPath } from "../../lib/focusedModuleRoute";
import { planGuidedNavigation, type GuidedSection } from "../../lib/moduleWayfinding";

const moduleLabels: Record<StudentModuleKey, { name: string; home: string; short: string }> = {
  seed: { name: "Bản sắc học tập", home: "/student", short: "Seed" },
  lumen: { name: "Dấu vân tay trí tuệ", home: "/lumen", short: "Lumen" },
  atlas: { name: "Bản đồ tương lai", home: "/atlas", short: "Atlas" },
  orion: { name: "Kiến trúc tương lai", home: "/orion", short: "Orion" },
  pulse: { name: "Đường cong tiến hóa", home: "/pulse", short: "Pulse" },
  haven: { name: "Hành trang thế giới", home: "/haven", short: "Haven" },
};

function SectionLink({ item, active }: { item: GuidedSection; active: boolean }) {
  return <a href={item.href} className={active ? "is-active" : ""}
    aria-current={active ? "page" : undefined}
    title={item.status === "partial" ? `${item.description} (Đang hoàn thiện)` : item.description}>
    {item.title}
  </a>;
}

const homeTabLabels: Record<StudentModuleKey, string> = {
  seed: "Góc nhìn của tôi",
  lumen: "Toàn cảnh tư duy",
  atlas: "Bản đồ của tôi",
  orion: "Bàn thiết kế",
  pulse: "Dòng thời gian",
  haven: "Toàn cảnh cơ hội",
};

/** The four study-abroad destinations belong to the SAME navigation bar, not
 * a second, conflicting set of tabs rendered inside the study-abroad page. */
function studyAbroadSections(): GuidedSection[] {
  const country = new URLSearchParams(window.location.search).get("country");
  const suffix = country ? `?country=${encodeURIComponent(country)}` : "";
  return [
    { id: "destination", title: "Chọn điểm đến", href: `/atlas/study-abroad${suffix}`, description: "Tìm điểm đến du học", group: "Du học", status: "partial" },
    { id: "programs", title: "Trường & chương trình", href: `/atlas/study-abroad/programs${suffix}`, description: "Tìm chương trình và trường có nguồn", group: "Du học", status: "partial" },
    { id: "requirements", title: "Hành trang đầu vào", href: `/atlas/study-abroad/requirements${suffix}`, description: "Đối chiếu điều kiện hồ sơ", group: "Du học", status: "partial" },
    { id: "sources", title: "Đường đến hồ sơ", href: `/atlas/study-abroad/sources${suffix}`, description: "Kiểm tra nguồn và các bước nộp hồ sơ", group: "Du học", status: "partial" },
  ];
}

/** One student-only navigation component and one visual bar across all
 * six workspaces. Preserve every implemented destination, with no admin links.
 * Works with existing SPA anchors and unsaved-draft navigation guard.
 * No duplicate cross-module dropdown: the student dashboard owns that journey. */
export default function ModuleSectionNav({ moduleKey }: { moduleKey: StudentModuleKey }) {
  const items = getStudentSubmodules(moduleKey);
  const module = moduleLabels[moduleKey];
  const currentPath = currentFocusedPath();
  const guide = planGuidedNavigation(items, module.home, currentPath);
  const inStudyAbroad = moduleKey === "atlas" &&
    (currentPath === "/atlas/study-abroad" || currentPath.startsWith("/atlas/study-abroad/"));
  const tabs = inStudyAbroad ? studyAbroadSections() : guide.featured;
  const more = inStudyAbroad ? guide.available.filter(item => item.id !== "abroad") : guide.more;

  return (
    <nav className="cla-module-subnav cla-focus-nav cla-guided-workspace cla-unified-bar"
      data-module={moduleKey} aria-label={`Chức năng ${module.name}`}>
      <div className="cla-unified-identity" aria-label={`Đang ở phân hệ ${module.name}`}>
        <span className="cla-unified-identity-mark" aria-hidden="true">{module.short.slice(0, 1)}</span>
        <strong>{module.short}</strong>
      </div>

      <div className="cla-module-subnav-links cla-guided-primary cla-unified-tabs" role="group"
        aria-label={inStudyAbroad ? "Các mục du học" : `Các mục ${module.name}`}>
        <a className={!inStudyAbroad && guide.onHome ? "is-active" : ""} href={module.home}
          aria-current={!inStudyAbroad && guide.onHome ? "page" : undefined}>
          {inStudyAbroad ? "← Atlas" : homeTabLabels[moduleKey]}
        </a>
        {tabs.map(item => <SectionLink key={item.id} item={item}
          active={inStudyAbroad ? currentPath === item.href?.split("?")[0] : item === guide.active} />)}
      </div>

      <div className="cla-guided-controls cla-unified-actions">
        {more.length > 0 && <details className="cla-guided-more">
          <summary aria-label="Xem các mục chức năng khác">Mục khác <span>{more.length}</span><span aria-hidden="true" className="cla-guided-chevron">⌄</span></summary>
          <div className="cla-guided-more-content" role="group" aria-label="Các mục khác trong phân hệ">
            {more.map(item => <SectionLink key={item.id} item={item} active={false} />)}
          </div>
        </details>}

      </div>
    </nav>
  );
}
