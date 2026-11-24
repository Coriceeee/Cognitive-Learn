import type { PulseLinkedSignal } from '../../lib/pulseLinkedSourceModel';
import '../../styles/44-pulse-linked.css';

type Props={signals:PulseLinkedSignal[];ready:number;errors:string[];loading:boolean;compact?:boolean};
const title:Record<string,string>={lumen:'LUMEN · Phân tích học tập',atlas:'ATLAS · Tuyển sinh',orion:'ORION · Chiến lược',seed:'SEED · Hồ sơ học sinh'};
const sourceHome:Record<string,string>={lumen:'/lumen',atlas:'/atlas',orion:'/orion',seed:'/student/profile'};
export default function PulseLinkedPanel({signals,ready,errors,loading,compact=false}:Props){
  const groups=['lumen','atlas','orion','seed'];
  return <section className="pulse-linked-panel" aria-label="Dữ liệu PULSE được đồng bộ từ các phân hệ">
    <div className="pulse-linked-header"><div>
      <span className="pulse-linked-eyebrow">PULSE · DỮ LIỆU LIÊN THÔNG</span>
      <h2>{compact?'Tín hiệu mới nhất từ các phân hệ':'Tiến độ học tập từ dữ liệu đã lưu'}</h2>
      <p>Không nhập lại tại PULSE. Mỗi số liệu được đọc từ tài khoản Firebase hiện tại; thiếu nguồn sẽ để trống, không điền số 0 giả.</p>
    </div><div className="pulse-linked-count"><strong>{ready}<small>/{signals.length}</small></strong><span>tín hiệu có dữ liệu</span></div></div>
    {loading && <p className="pulse-linked-status" role="status">Đang xác minh các nguồn dữ liệu trên Firestore…</p>}
    {errors.length>0 && <div className="pulse-linked-errors" role="alert">{errors.map((error,index)=><p key={index}>{error}</p>)}</div>}
    <div className="pulse-linked-groups">
      {groups.map(group=>{const items=signals.filter(item=>item.group===group);return <div className="pulse-linked-group" key={group}>
        <div className="pulse-linked-group-head"><strong>{title[group]}</strong><a href={sourceHome[group]}>Mở phân hệ ↗</a></div>
        <div className="pulse-linked-signals">{items.map(item=>{
          const known=item.value!==null;
          const pct=known?Math.min(100,Math.max(0,(item.value! / item.max)*100)):0;
          return <div className={`pulse-linked-item ${known?'is-verified':'is-missing'}`} key={item.key}>
            <div className="pulse-linked-item-head"><span>{item.label}</span><strong>{known?`${item.value}${item.unit}`:'Chưa có dữ liệu'}</strong></div>
            <div className="pulse-linked-bar" role="img" aria-label={`${item.label}: ${known?`${item.value}${item.unit}`:'chưa có dữ liệu'}`}>
              <span style={{width:`${pct}%`}} />
            </div><div className="pulse-linked-item-foot"><span>{item.note}</span>{!known&&<a href={item.href}>Bổ sung tại {item.source} ↗</a>}</div>
          </div>;
        })}</div>
      </div>})}
    </div>
    <p className="pulse-linked-disclaimer">Các thanh thể hiện giá trị so với mốc hiển thị (không phải xác suất thành công). Điểm LUMEN/ORION là chỉ số quy tắc thử nghiệm, không phải phép đo tâm lý đã được kiểm định. Số lượng ATLAS chỉ là số bản ghi đã lưu.</p>
  </section>;
}
