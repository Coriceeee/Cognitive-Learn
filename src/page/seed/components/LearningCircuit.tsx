/** CP46 — accessible, chart-like route diagram; no faux scores or hidden destinations. */
import { useState } from "react";

type Link = { code: string; short: string; title: string; description: string; href: string; phase: string; x: number; y: number };
const links: Link[] = [
  { code:"SEED",short:"Dữ liệu",title:"Bản sắc học tập",description:"Điểm số, GPA và mục tiêu — nền tảng cho mọi phân tích tiếp theo.",href:"/student/profile",phase:"01 · HIỂU BẢN THÂN",x:16,y:26 },
  { code:"LUMEN",short:"Nhận thức",title:"Dấu vân tay trí tuệ",description:"Quan sát SCI, MAS, CSL cùng bằng chứng và giới hạn diễn giải.",href:"/lumen",phase:"02 · PHÂN TÍCH",x:49,y:18 },
  { code:"ATLAS",short:"Cơ hội",title:"Bản đồ tương lai",description:"Khám phá trường, ngành, phương thức xét tuyển và lộ trình quốc tế.",href:"/atlas",phase:"03 · KHÁM PHÁ",x:81,y:30 },
  { code:"ORION",short:"Lựa chọn",title:"Kiến trúc tương lai",description:"Đối chiếu các phương án và lên kế hoạch theo mục tiêu.",href:"/orion",phase:"04 · QUYẾT ĐỊNH",x:81,y:73 },
  { code:"PULSE",short:"Tiến trình",title:"Đường cong tiến hóa",description:"Theo dõi biến động học tập và những việc cần điều chỉnh.",href:"/pulse",phase:"05 · THEO DÕI",x:49,y:84 },
  { code:"HAVEN",short:"Nguồn lực",title:"Hành trang thế giới",description:"Xem điều kiện học bổng, chi phí và phương án tài chính.",href:"/haven",phase:"06 · HỖ TRỢ",x:17,y:72 },
];

export default function LearningCircuit({ profilePath }: { profilePath: string }) {
  const [active, setActive] = useState(0);
  const chosen = links[active];
  return <section className="cla-circuit" aria-labelledby="cla-circuit-title">
    <div className="cla-circuit-heading">
      <div><span className="cla-circuit-eyebrow">COGNITIVE LEARN / LEARNING NETWORK</span><h2 id="cla-circuit-title">Một hành trình. Sáu hệ trí tuệ.</h2><p>Di chuyển giữa các trạm theo mục tiêu của bạn — không cần đi theo thứ tự cố định.</p></div>
      <span className="cla-circuit-counter">06 <small>CONNECTED SPACES</small></span>
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
        {links.map((item,i)=><a key={item.code} className={`cla-circuit-node${active===i?' is-current':''}`} href={item.code==="SEED"?profilePath:item.href}
          data-module={item.code.toLowerCase()} style={{left:`${item.x}%`,top:`${item.y}%`} as React.CSSProperties}
          onMouseEnter={()=>setActive(i)} onFocus={()=>setActive(i)} aria-label={`${item.code}: ${item.title}`}>
          <span className="cla-circuit-node-marker">{String(i+1).padStart(2,"0")}</span>
          <strong>{item.code}</strong><small className="cla-circuit-node-name">{item.title}</small>
        </a>)}
      </div>
      <aside className="cla-circuit-detail" data-module={chosen.code.toLowerCase()} aria-live="polite">
        <div className="cla-circuit-detail-top"><span>PHÂN HỆ ĐANG CHỌN</span><span>{String(active+1).padStart(2,"0")} / 06</span></div>
        <div className="cla-circuit-detail-core"><span className="cla-circuit-phase">{chosen.phase}</span><h3>{chosen.title}</h3><p>{chosen.description}</p></div>
        <div className="cla-circuit-detail-links"><a href={chosen.code==="SEED"?profilePath:chosen.href}>Mở {chosen.code} <span aria-hidden="true">↗</span></a><small>Chạm vào một phân hệ để mở; đưa chuột hoặc dùng Tab để xem mô tả.</small></div>
      </aside>
    </div>
    <div className="cla-circuit-mobile" aria-label="Sáu không gian học tập">
      {links.map((item,i)=><a href={item.code==="SEED"?profilePath:item.href} key={item.code} data-module={item.code.toLowerCase()}>
        <span className="cla-circuit-mobile-n">{String(i+1).padStart(2,"0")}</span><span className="cla-circuit-mobile-copy"><small>{item.code} / {item.short}</small><strong>{item.title}</strong><span>{item.description}</span></span><span aria-hidden="true" className="cla-circuit-mobile-arrow">↗</span>
      </a>)}
    </div>
    <div className="cla-circuit-foot"><span>SƠ ĐỒ HỌC TẬP · 6 PHÂN HỆ</span><span>Chỉ các chức năng thực tế trong CLA · Không mô phỏng kết quả cá nhân</span></div>
  </section>;
}
