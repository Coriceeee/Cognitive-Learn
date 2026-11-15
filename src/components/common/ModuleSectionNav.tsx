import { getStudentSubmodules, type StudentModuleKey } from "../../data/moduleSubmodules";

const moduleLabels: Record<StudentModuleKey, { name: string; home: string; eyebrow: string }> = {
  seed: { name: "Hồ sơ học tập", home: "/student", eyebrow: "SEED PROFILE" },
  lumen: { name: "Phân tích năng lực", home: "/lumen", eyebrow: "LUMEN INTELLIGENCE" },
  atlas: { name: "Tuyển sinh & du học", home: "/atlas", eyebrow: "ATLAS ADMISSION" },
  orion: { name: "Chiến lược học tập", home: "/orion", eyebrow: "ORION STRATEGY" },
  pulse: { name: "Theo dõi tiến độ", home: "/pulse", eyebrow: "PULSE MONITOR" },
  haven: { name: "Học bổng & tài chính", home: "/haven", eyebrow: "HAVEN SUPPORT" },
};

/**
 * Student-facing subnavigation. Each implemented function owns a dedicated
 * route; admin/research actions live only in the Nexus console directory.
 */
export default function ModuleSectionNav({ moduleKey }: { moduleKey: StudentModuleKey }) {
  const items = getStudentSubmodules(moduleKey);
  const module = moduleLabels[moduleKey];
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  const onHome = currentPath === module.home;

  return (
    <nav className="cla-module-subnav" aria-label={`Chức năng ${module.name}`}>
      <div className="cla-module-subnav-head">
        <div>
          <span>{module.eyebrow} · KHÔNG GIAN HỌC SINH</span>
          <strong>{onHome ? "Chọn chức năng cần sử dụng" : module.name}</strong>
          <p>Mỗi chức năng mở ở một trang riêng; dữ liệu và quyền truy cập vẫn theo tài khoản của bạn.</p>
        </div>
        <a className="cla-module-overview-link" href={module.home} aria-current={onHome ? "page" : undefined}>
          Tổng quan
        </a>
      </div>
      <div className="cla-module-subnav-links">
        {items.map((item) => {
          const active = Boolean(item.href && (currentPath === item.href ||
            (item.href === "/atlas/study-abroad" && currentPath.startsWith("/atlas/study-abroad/"))));
          return item.href && item.status !== "planned" ? (
            <a key={item.id} href={item.href} className={active ? "is-active" : ""} aria-current={active ? "page" : undefined}>
              <span>{item.title}</span>
              {item.status === "partial" && <small>Đang hoàn thiện</small>}
            </a>
          ) : (
            <span key={item.id} className="is-disabled" aria-disabled="true">
              <span>{item.title}</span><small>Chưa khả dụng</small>
            </span>
          );
        })}
      </div>
    </nav>
  );
}
