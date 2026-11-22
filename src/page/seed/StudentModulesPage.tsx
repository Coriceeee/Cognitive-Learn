import { useMemo, useState } from "react";
import StudentHeader from "./components/StudentHeader";
import { studentSubmoduleDirectory, type StudentModuleKey } from "../../data/moduleSubmodules";
import "../../styles.css";

/** A task finder, not a second copy of the six modules already shown on Student Dashboard. */
const studentFunctions = (
  ["seed", "lumen", "atlas", "orion", "pulse", "haven"] as StudentModuleKey[]
).flatMap(moduleKey => studentSubmoduleDirectory[moduleKey].submodules.map(item => ({
  ...item,
  moduleKey,
  category: ["seed", "lumen"].includes(moduleKey) ? "Hiểu bản thân" :
    ["atlas", "haven"].includes(moduleKey) ? "Định hướng tương lai" : "Lập kế hoạch & theo dõi",
}))).filter(item => item.id !== "overview" || item.moduleKey !== "seed");

const categories = ["Tất cả", "Hiểu bản thân", "Định hướng tương lai", "Lập kế hoạch & theo dõi"] as const;

export default function StudentModulesPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("Tất cả");
  const matches = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("vi-VN");
    return studentFunctions.filter(item =>
      (category === "Tất cả" || item.category === category) &&
      (!term || [item.title, item.description, item.group, item.category].join(" ")
        .toLocaleLowerCase("vi-VN").includes(term)),
    );
  }, [query, category]);

  return (
    <main className="student-page">
      <StudentHeader isAdminPreview={false} />
      <section className="student-shell cla-task-hub">
        <nav className="cla-task-back" aria-label="Điều hướng Cognitive Path">
          <a href="/student">← Tổng quan học sinh</a>
          <a className="cla-task-guide-link" href="/student/guide">Chưa biết bắt đầu? Xem hướng dẫn vận hành CLA ↗</a>
        </nav>
        <header className="cla-task-head">
          <span>COGNITIVE PATH · TÌM NHANH CÔNG VIỆC</span>
          <h1>Bạn muốn làm việc gì?</h1>
          <p>Các module đã có ở trang tổng quan nên không hiển thị lại. Tìm trực tiếp chức năng bạn cần sử dụng, không phải chọn module hai lần.</p>
          <label htmlFor="cla-task-search">Tìm theo công việc</label>
          <input id="cla-task-search" type="search" value={query} onChange={event => setQuery(event.target.value)}
            placeholder="Ví dụ: nhập điểm, học bổng, phương thức xét tuyển, kế hoạch…" />
        </header>
        <nav className="cla-task-filters" aria-label="Nhóm công việc">
          {categories.map(item => <button key={item} type="button" className={category === item ? "is-active" : ""}
            aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}
        </nav>
        <p className="cla-task-count" role="status">{matches.length} chức năng phù hợp · Thông tin hiển thị theo quyền của tài khoản học sinh.</p>
        <div className="cla-task-results">
          {matches.map(item => <article key={`${item.moduleKey}-${item.id}`} className="cla-task-result">
            <div>
              <span className="cla-task-category">{item.category} · {item.group}</span>
              <h2>{item.title}</h2>
              <p>{item.description}</p>
              {item.status === "partial" && <small>Có thể sử dụng · đang hoàn thiện</small>}
              {item.status === "planned" && <small>Chưa khả dụng</small>}
            </div>
            {item.href && item.status !== "planned"
              ? <a href={item.href} aria-label={`Mở ${item.title}`}>Mở chức năng <span aria-hidden="true">↗</span></a>
              : <span aria-disabled="true" className="cla-task-disabled">Chưa triển khai</span>}
          </article>)}
          {matches.length === 0 && <div className="cla-task-empty">
            <strong>Chưa tìm thấy chức năng phù hợp.</strong>
            <p>Hãy thử một từ khóa ngắn hơn hoặc xem tất cả.</p>
            <button className="cla-action-button cla-action-button--outline" type="button" onClick={() => { setQuery(""); setCategory("Tất cả"); }}>Xem tất cả</button>
          </div>}
        </div>
      </section>
    </main>
  );
}
