/** CP46 — accessible, chart-like route diagram; no faux scores or hidden destinations. */
import { useState } from "react";
import seedLogo from "../../../assets/modules/seed-profile.png";
import lumenLogo from "../../../assets/modules/lumen-intelligence.png";
import atlasLogo from "../../../assets/modules/atlas-admission.png";
import orionLogo from "../../../assets/modules/orion-strategy.png";
import pulseLogo from "../../../assets/modules/pulse-monitor.png";
import havenLogo from "../../../assets/modules/haven-support.png";

type Link = {
  code: string;
  short: string;
  phase: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  x: number;
  y: number;
};

const links: Link[] = [
  { code:"SEED",icon:seedLogo,short:"Dữ liệu",phase:"KHỞI TẠO",title:"Bản sắc học tập",description:"Điểm số, GPA và mục tiêu — nền tảng cho mọi phân tích tiếp theo.",href:"/student/profile",x:16,y:26 },
  { code:"LUMEN",icon:lumenLogo,short:"Nhận thức",phase:"THẤU HIỂU",title:"Dấu vân tay trí tuệ",description:"Quan sát SCI, MAS, CSL cùng bằng chứng và giới hạn diễn giải.",href:"/lumen",x:49,y:18 },
  { code:"ATLAS",icon:atlasLogo,short:"Cơ hội",phase:"KHÁM PHÁ",title:"Bản đồ tương lai",description:"Khám phá trường, ngành, phương thức xét tuyển và lộ trình quốc tế.",href:"/atlas",x:81,y:30 },
  { code:"ORION",icon:orionLogo,short:"Lựa chọn",phase:"HOẠCH ĐỊNH",title:"Kiến trúc tương lai",description:"Đối chiếu các phương án và lên kế hoạch theo mục tiêu.",href:"/orion",x:81,y:73 },
  { code:"PULSE",icon:pulseLogo,short:"Tiến trình",phase:"THEO DÕI",title:"Đường cong tiến hóa",description:"Theo dõi biến động học tập và những việc cần điều chỉnh.",href:"/pulse",x:49,y:84 },
  { code:"HAVEN",icon:havenLogo,short:"Nguồn lực",phase:"HỖ TRỢ",title:"Hành trang thế giới",description:"Xem điều kiện học bổng, chi phí và phương án tài chính.",href:"/haven",x:17,y:72 },
];

const quickLinks = [
  { label:"Tìm nhanh chức năng", href:"/student/modules" },
  { label:"Hướng dẫn sử dụng", href:"/student/guide" },
  { label:"Đồng hành mỗi ngày", href:"/student/companion" },
];

export default function LearningCircuit({ profilePath }: { profilePath: string }) {
  // ATLAS is selected initially to mirror the reference menu. Hover and keyboard
  // focus update the information panel; activating a node opens that module.
  const [active, setActive] = useState(2);
  const selected = links[active] ?? links[0];
  const selectedHref = selected.code === "SEED" ? profilePath : selected.href;

  return <>
    <section className="cla-circuit" aria-labelledby="cla-circuit-title">
      <div className="cla-circuit-heading">
        <div>
          <span className="cla-circuit-eyebrow">COGNITIVE LEARN / LEARNING NETWORK</span>
          <h2 id="cla-circuit-title">Một hành trình. Sáu hệ trí tuệ.</h2>
          <p>Di chuyển giữa các trạm theo mục tiêu của bạn — không cần đi theo thứ tự cố định.</p>
        </div>
        <div className="cla-circuit-counter" aria-label="Sáu phân hệ đã kết nối">
          <span>06</span><small>CONNECTED SPACES</small>
        </div>
      </div>

      <div className="cla-circuit-stage">
        <div className="cla-circuit-map" aria-label="Sơ đồ sáu không gian học tập">
          <svg className="cla-circuit-wires" viewBox="0 0 840 500" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="claRouteInk" x1="0" x2="1"><stop offset="0" stopColor="#74B8FF"/><stop offset=".54" stopColor="#67D3E8"/><stop offset="1" stopColor="#A998FF"/></linearGradient></defs>
            {[100,210,320,430,540,650,760].map(x=><line key={`x-${x}`} x1={x} x2={x} y1="12" y2="488" stroke="#D9E3F2" strokeWidth=".8" strokeDasharray="2 11"/>)}
            {[85,170,255,340,425].map(y=><line key={`y-${y}`} x1="12" x2="828" y1={y} y2={y} stroke="#D9E3F2" strokeWidth=".8" strokeDasharray="2 11"/>)}
            <path d="M134 130 C217 63 301 64 412 90 C513 58 607 70 680 150 C739 217 740 300 680 365 C598 431 520 439 412 420 C298 460 212 423 142 360 C85 289 91 201 134 130Z" fill="none" stroke="#DBE6F2" strokeWidth="17" strokeLinecap="round" opacity=".4"/>
            <path d="M134 130 C217 63 301 64 412 90 C513 58 607 70 680 150 C739 217 740 300 680 365 C598 431 520 439 412 420 C298 460 212 423 142 360 C85 289 91 201 134 130Z" fill="none" stroke="url(#claRouteInk)" strokeWidth="2.6" strokeLinecap="round"/>
            <circle cx="415" cy="255" r="88" fill="none" stroke="#D8E5F2" strokeWidth="1" strokeDasharray="3 8"/>
            <circle cx="415" cy="255" r="60" fill="#F4F8FE" stroke="#DEE9F5"/>
            <text x="415" y="246" textAnchor="middle" fill="#143959" fontSize="29" fontWeight="700" letterSpacing="-2">CLA</text>
            <text x="415" y="266" textAnchor="middle" fill="#57718E" fontSize="9" letterSpacing="2">LEARNING LOOP</text>
          </svg>

          {links.map((item,i)=><a
            key={item.code}
            className={`cla-circuit-node${active===i?" is-current":""}`}
            href={item.code==="SEED"?profilePath:item.href}
            data-module={item.code.toLowerCase()}
            style={{left:`${item.x}%`,top:`${item.y}%`} as React.CSSProperties}
            onMouseEnter={()=>setActive(i)}
            onFocus={()=>setActive(i)}
            aria-label={`${item.code}: ${item.title}. Mở phân hệ`}
          >
            <span className="cla-circuit-node-logo"><img src={item.icon} alt="" aria-hidden="true"/></span>
            <strong>{item.code}</strong>
            <small className="cla-circuit-node-name">{item.title}</small>
          </a>)}
        </div>

        <aside className="cla-circuit-detail" data-module={selected.code.toLowerCase()} aria-label="Thông tin phân hệ đang chọn" aria-live="polite">
          <div className="cla-circuit-detail-top">
            <span>PHÂN HỆ ĐANG CHỌN</span>
            <span>{String(active+1).padStart(2,"0")} / 06</span>
          </div>
          <div className="cla-circuit-detail-core">
            <div className="cla-circuit-detail-identity">
              <img src={selected.icon} alt="" aria-hidden="true"/>
              <span className="cla-circuit-phase">{String(active+1).padStart(2,"0")} · {selected.phase}</span>
            </div>
            <h3>{selected.title}</h3>
            <p>{selected.description}</p>
          </div>
          <div className="cla-circuit-detail-links">
            <a href={selectedHref}>MỞ {selected.code}<span aria-hidden="true">↗</span></a>
            <small>Chạm vào một phân hệ để mở; đưa chuột hoặc dùng Tab để xem mô tả.</small>
          </div>
        </aside>
      </div>

      <div className="cla-circuit-mobile" aria-label="Sáu không gian học tập">
        {links.map(item=><a href={item.code==="SEED"?profilePath:item.href} key={item.code} data-module={item.code.toLowerCase()}>
          <span className="cla-circuit-mobile-logo"><img src={item.icon} alt="" aria-hidden="true"/></span>
          <span className="cla-circuit-mobile-copy"><small>{item.code} / {item.short}</small><strong>{item.title}</strong><span>{item.description}</span></span>
          <span aria-hidden="true" className="cla-circuit-mobile-arrow">↗</span>
        </a>)}
      </div>
      <div className="cla-circuit-foot">
        <span>SƠ ĐỒ HỌC TẬP · 6 PHÂN HỆ</span>
        <span>Chỉ các chức năng thực tế trong CLA · Không mô phỏng kết quả cá nhân</span>
      </div>
    </section>

    <nav className="student-dash-extra-links" aria-label="Lối tắt dành cho học sinh">
      {quickLinks.map(item=><a href={item.href} key={item.href}>{item.label}<span aria-hidden="true">↗</span></a>)}
    </nav>
  </>;
}
