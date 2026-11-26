/** CP95 — student-first admissions journey; preserves the six module destinations. */
import { useState } from "react";
import seedLogo from "../../../assets/modules/seed-profile.png";
import lumenLogo from "../../../assets/modules/lumen-intelligence.png";
import atlasLogo from "../../../assets/modules/atlas-admission.png";
import orionLogo from "../../../assets/modules/orion-strategy.png";
import pulseLogo from "../../../assets/modules/pulse-monitor.png";
import havenLogo from "../../../assets/modules/haven-support.png";

type Link = {
  code: string;
  phase: string;
  title: string;
  description: string;
  href: string;
  icon: string;
};

const links: Link[] = [
  { code:"SEED",icon:seedLogo,phase:"BƯỚC 01 · NHẬP DỮ LIỆU",title:"Bản sắc học tập",description:"Nhập hồ sơ, bảng điểm, môn lựa chọn và mục tiêu. Đây là dữ liệu đầu vào cho toàn bộ quá trình phân tích và tư vấn.",href:"/student/profile" },
  { code:"LUMEN",icon:lumenLogo,phase:"BƯỚC 02 · PHÂN TÍCH",title:"Dấu vân tay trí tuệ",description:"Phân tích 7 chỉ số Cognitive thử nghiệm; ước lượng điểm từng môn bằng trung bình của hai bài thi thử (chưa phải dự báo ML đã kiểm định), đồng thời nêu rõ dữ liệu thiếu và giới hạn.",href:"/lumen" },
  { code:"ATLAS",icon:atlasLogo,phase:"BƯỚC 03 · KHÁM PHÁ",title:"Bản đồ tương lai",description:"Dùng điểm ước lượng để khám phá tổ hợp xét tuyển; tra cứu ngành và trường theo sở thích, hồ sơ học tập và dữ liệu tuyển sinh có nguồn. Không suy ra xác suất đỗ.",href:"/atlas" },
  { code:"ORION",icon:orionLogo,phase:"BƯỚC 04 · HÀNH ĐỘNG",title:"Kiến trúc tương lai",description:"Xây dựng lộ trình học tập theo tuần, xác định khoảng cách tới mục tiêu và những việc cần làm để cải thiện khả năng đạt nguyện vọng.",href:"/orion" },
  { code:"PULSE",icon:pulseLogo,phase:"THEO DÕI",title:"Đường cong tiến hóa",description:"Theo dõi tiến độ và điều chỉnh kế hoạch theo dữ liệu mới.",href:"/pulse" },
  { code:"HAVEN",icon:havenLogo,phase:"HỖ TRỢ",title:"Hành trang thế giới",description:"Tìm hiểu học bổng, chi phí và điều kiện cần chuẩn bị.",href:"/haven" },
];

const quickLinks = [
  { label:"Công cụ tư vấn tuyển sinh", href:"/atlas#atlas-engine" },
  { label:"Tìm nhanh chức năng", href:"/student/modules" },
  { label:"Hướng dẫn sử dụng", href:"/student/guide" },
  { label:"Nhật ký học tập", href:"/student/companion" },
];

export default function LearningCircuit({ profilePath }: { profilePath: string }) {
  // Keep all six destinations accessible; guide first-time students through the core four-step outcome.
  const [active, setActive] = useState(0);
  const selected = links[active] ?? links[0];
  const primaryLinks = links.slice(0, 4);
  const supportLinks = links.slice(4);

  return <>
    <section className="cla-primary-journey" data-network-label="LEARNING NETWORK" data-module={selected.code.toLowerCase()} aria-label="Sơ đồ sáu không gian học tập" aria-labelledby="cla-circuit-title">
      <header className="cla-primary-journey__header">
        <div>
          <span className="cla-primary-journey__eyebrow">LỘ TRÌNH TƯ VẤN TUYỂN SINH CÁ NHÂN</span>
          <h2 id="cla-circuit-title">Từ hồ sơ đến nguyện vọng phù hợp</h2>
          <p>Sáu hệ trí tuệ hỗ trợ toàn hành trình; lần đầu sử dụng, hãy bắt đầu từ SEED → LUMEN → ATLAS. Sau đó dùng ORION để biến mục tiêu thành kế hoạch hành động.</p>
        </div>
        <div className="cla-primary-journey__count" aria-label="Bốn bước chính">
          04 <small>BƯỚC CHÍNH</small>
        </div>
      </header>

      <ol className="cla-primary-journey__steps">
        {primaryLinks.map((item,i) => {
          const isActive = active === i;
          return <li key={item.code}>
            <a
              className={`cla-primary-journey__step cla-primary-journey__step--${item.code.toLowerCase()}`}
              href={item.code==="SEED"?profilePath:item.href}
              onFocus={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              aria-current={isActive ? "step" : undefined}
              data-module={item.code.toLowerCase()}
            >
              <span className="cla-primary-journey__number">{String(i+1).padStart(2,"0")}</span>
              <span className="cla-primary-journey__code">{item.code} · {item.phase}</span>
              <strong className="cla-circuit-node-name">{item.title}</strong>
              <span className="cla-primary-journey__description">{item.description}</span>
              <span className="cla-primary-journey__action">{item.code === "SEED" ? "Nhập hồ sơ" : item.code === "LUMEN" ? "Xem phân tích" : item.code === "ATLAS" ? "Khám phá ngành, trường" : "Lập kế hoạch"} <span aria-hidden="true">↗</span></span>
            </a>
          </li>;
        })}
      </ol>

      <footer className="cla-primary-journey__footer">
        <span>KHÔNG GIAN HỖ TRỢ</span>
        {supportLinks.map(item=><a href={item.href} key={item.code} data-module={item.code.toLowerCase()}>{item.code} · {item.title} ↗</a>)}
        <span>Trợ giúp nhanh</span>
        {quickLinks.map(item=><a href={item.href} key={item.href}>{item.label} ↗</a>)}
      </footer>
      <span className="cla-route-announcement" aria-live="polite">Đang chọn {selected.code}: {selected.title}</span>
    </section>
  </>;
}
