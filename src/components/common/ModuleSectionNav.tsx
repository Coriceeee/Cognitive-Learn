import { getStudentSubmodules, type StudentModuleKey } from "../../data/moduleSubmodules";
import { currentFocusedPath } from "../../lib/focusedModuleRoute";

const moduleLabels: Record<StudentModuleKey, { name: string; home: string; eyebrow: string }> = {
  seed: { name: "Hồ sơ học tập", home: "/student", eyebrow: "SEED PROFILE" },
  lumen: { name: "Phân tích năng lực", home: "/lumen", eyebrow: "LUMEN INTELLIGENCE" },
  atlas: { name: "Tuyển sinh & du học", home: "/atlas", eyebrow: "ATLAS ADMISSION" },
  orion: { name: "Chiến lược học tập", home: "/orion", eyebrow: "ORION STRATEGY" },
  pulse: { name: "Theo dõi tiến độ", home: "/pulse", eyebrow: "PULSE MONITOR" },
  haven: { name: "Học bổng & tài chính", home: "/haven", eyebrow: "HAVEN SUPPORT" },
};

/** One compact navigation band, with only implemented destinations.
 * Route-scoped content is mounted by each page, not hidden using CSS.
 */
export default function ModuleSectionNav({ moduleKey }: { moduleKey: StudentModuleKey }) {
  const items = getStudentSubmodules(moduleKey);
  const module = moduleLabels[moduleKey];
  const currentPath = currentFocusedPath();
  const onHome = currentPath === module.home;
  const activeItem = items.find(item => item.href !== module.home && (currentPath === item.href ||
    (item.href === "/atlas/study-abroad" && currentPath.startsWith("/atlas/study-abroad/"))));
  const title = onHome ? module.name : activeItem?.title ?? (currentPath === "/atlas/library" ? "Kho dữ liệu Atlas · Admin" : currentPath === "/pulse/audit" ? "Kiểm tra liên thông · Admin" : module.name);
  return (
    <nav className="cla-module-subnav cla-focus-nav" aria-label={`Chức năng ${module.name}`}>
      <div className="cla-module-subnav-head">
        <span>{module.eyebrow} / {onHome ? "TỔNG QUAN" : title}</span>
        <a href="/student" className="cla-focus-home">Không gian học sinh</a>
      </div>
      <div className="cla-module-subnav-links">
        <a className={onHome ? "is-active" : ""} href={module.home} aria-current={onHome ? "page" : undefined}>Tổng quan</a>
        {items.filter(item => item.href && item.href !== module.home && item.status !== "planned").map(item => {
          const active = item === activeItem;
          return <a key={item.id} href={item.href} className={active ? "is-active" : ""}
            aria-current={active ? (currentPath === item.href ? "page" : "location") : undefined}
            title={item.status === "partial" ? `${item.description} (Đang hoàn thiện)` : item.description}>{item.title}</a>;
        })}
      </div>
      {!onHome && (moduleKey !== "seed" || currentPath === "/student/exams") && <div className="cla-focus-heading"><h1>{title}</h1>{activeItem && <p>{activeItem.description}</p>}</div>}
    </nav>
  );
}
