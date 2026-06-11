import { useMemo, useState } from "react";
import {
  getModulesByRole,
  type ModuleKey,
  type UserRole,
} from "../../data/moduleClusters";

type ModuleClusterGridProps = {
  role: UserRole;
  title: string;
  subtitle: string;
  isAdminPreview?: boolean;
};

export default function ModuleClusterGrid({
  role,
  title,
  subtitle,
  isAdminPreview = false,
}: ModuleClusterGridProps) {
  const modules = useMemo(() => getModulesByRole(role), [role]);
  const [activeKey, setActiveKey] = useState<ModuleKey>(
    modules[0]?.key || "seed"
  );

  const activeModule =
    modules.find((module) => module.key === activeKey) || modules[0];

  function getPath(path: string) {
    if (!isAdminPreview) {
      return path;
    }

    if (path.includes("?")) {
      return `${path}&from=admin`;
    }

    return `${path}?from=admin`;
  }

  function goTo(path: string) {
    window.location.href = getPath(path);
  }

  if (!activeModule) {
    return null;
  }

  return (
    <section className="module-gateway">
      <div className="module-gateway-head">
        <div>
          <span>COGNITIVE PATH</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>

        <strong>{modules.length} cụm</strong>
      </div>

      <div className="module-gateway-body">
        <div className="module-orbit-grid">
          {modules.map((module) => (
            <button
              key={module.key}
              type="button"
              className={`module-node-card ${
                activeModule.key === module.key ? "active" : ""
              }`}
              onClick={() => setActiveKey(module.key)}
            >
              <div className="module-node-logo">
                <img src={module.icon} alt={module.name} />
              </div>

              <div>
                <strong>{module.name}</strong>
                <p>{module.subtitle}</p>
              </div>
            </button>
          ))}
        </div>

        <article className="module-detail-panel">
          <div className="module-detail-main">
            <div className="module-detail-logo">
              <img src={activeModule.icon} alt={activeModule.name} />
            </div>

            <div>
              <span>{activeModule.subtitle}</span>
              <h3>{activeModule.name}</h3>
              <p>{activeModule.meaning}</p>
            </div>
          </div>

          <div className="module-action-list">
            {activeModule.actions.map((action) => (
              <div key={action.label} className="module-action-item">
                <div>
                  <strong>{action.label}</strong>
                  <p>{action.description}</p>
                </div>

                {action.path ? (
                  <button type="button" onClick={() => goTo(action.path!)}>
                    Mở
                  </button>
                ) : (
                  <button type="button" disabled>
                    Sau
                  </button>
                )}
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}