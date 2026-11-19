import { useState } from 'react';
import { nationalCutoffs, cutoffKey, getCutoff, compareNationalCutoff, nationalProgramHistory } from '../../../lib/nationalAdmissionRegistry';
import { officialUniversities, admissionYears } from '../../../data/officialAdmissionSources';

type Option = { universityId: string; year: number; key: string; score: string };
function initial(universityId: string, year=2026):Option {
 const rows=nationalCutoffs.filter(r=>r.universityId===universityId&&r.year===year&&r.scale!==null);
 const first=rows.find(r=>r.code==='7480201'&&r.method==='THPT')??rows.find(r=>r.code==='7480201')??rows[0];
 return {universityId,year,key:first?cutoffKey(first):'',score:''};
}
const universities=Array.from(new Map([...officialUniversities.map(u=>[u.id,u.name] as const),...nationalCutoffs.map(r=>[r.universityId,r.university] as const)]));
export default function AtlasDecisionComparisonPanel(){
 const [options,setOptions]=useState<Option[]>([initial('ctu'),initial('agu')]);
 function update(i:number, next:Option){setOptions(old=>old.map((x,j)=>j===i?next:x));}
 const results=options.map(o=>compareNationalCutoff(o.key,o.score));
 return <section className="cla-source-explorer" id="atlas-decision-comparison" aria-labelledby="atlas-decision-title">
  <span className="cla-eyebrow">ATLAS · SO SÁNH LIÊN TRƯỜNG CÓ NGUỒN</span>
  <h2 id="atlas-decision-title">Nếu chọn trường hoặc ngành khác thì sao?</h2>
  <p>Đối chiếu 2–3 phương án từ nhiều trường và năm tuyển sinh. Chỉ nhập điểm xét tuyển đúng phương thức và công thức của từng trường; Atlas không tự đổi thang điểm. Phạm vi điểm đã nhập: {new Set(nationalCutoffs.map(r=>r.universityId)).size} trường, {nationalCutoffs.length} bản ghi; chưa phủ toàn quốc.</p>
  <div className="cla-major-grid">{options.map((option,i)=>{const rows=nationalCutoffs.filter(r=>r.universityId===option.universityId&&r.year===option.year);const selected=getCutoff(option.key);const result=results[i];const portal=officialUniversities.find(u=>u.id===option.universityId);const yearSource=portal?.years.find(y=>y.year===option.year);return <article className="cla-major-card" key={i}>
   <strong>Phương án {i+1}</strong><div className="cla-explorer-filters">
   <label>Trường<select value={option.universityId} onChange={e=>update(i,initial(e.target.value,option.year))}>{universities.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
   <label>Năm<select value={option.year} onChange={e=>update(i,initial(option.universityId,Number(e.target.value)))}>{admissionYears.map(y=><option key={y} value={y}>{y}</option>)}</select></label>
   <label>Ngành · phương thức<select value={option.key} onChange={e=>update(i,{...option,key:e.target.value,score:''})}><option value="">Chọn bản ghi</option>{rows.map(r=><option key={cutoffKey(r)} value={cutoffKey(r)}>{r.major} ({r.code}) · {r.campus} · {r.label}</option>)}</select></label>
   <label>Điểm xét tuyển<input inputMode="decimal" disabled={!selected||selected.scale===null} value={option.score} onChange={e=>update(i,{...option,score:e.target.value})} placeholder={selected?.scale?`Thang ${selected.scale}`:'Chưa có thang xác minh'}/></label></div>
   {selected?<div className="cla-major-cutoffs" role="status"><div><span>Điểm công bố {selected.year}</span><strong>{selected.cutoff.toFixed(2)}{selected.scale===null?'':` / ${selected.scale}`}</strong><small>{selected.note}</small></div><div><span>Đối chiếu cá nhân</span><small>{result?`Chênh số học: ${result.gap>0?'+':''}${result.gap.toFixed(2)}`:selected.scale===null?'Chưa xác minh thang; không tính chênh.':option.score?'Điểm không hợp lệ.':'Chưa nhập điểm.'}</small><a href={selected.source} target="_blank" rel="noopener noreferrer">Nguồn chính thức ↗</a></div></div>:<p role="status">Chưa có bản ghi điểm phù hợp. Không đồng nghĩa trường không tuyển. {yearSource&&<a href={yearSource.cutoffUrl??yearSource.schemeUrl} target="_blank" rel="noopener noreferrer">Xem nguồn năm {option.year}</a>} {portal&&<a href={portal.portalUrl} target="_blank" rel="noopener noreferrer">Cổng trường</a>}</p>}
   {selected&&<details className="cla-major-cutoffs"><summary>Lịch sử mã xét tuyển 2024–2026</summary><p>Đối chiếu cùng mã và cơ sở; tên chương trình, thang điểm và phương thức có thể thay đổi. Không suy ra xu hướng hay xác suất từ các thang khác nhau.</p>{nationalProgramHistory(option.key).map(({year,records})=><div key={year}><strong>{year}</strong>{records.length?records.map(r=><p key={cutoffKey(r)}><small>{r.major} · {r.label}: <strong>{r.cutoff.toFixed(2)}{r.scale===null?'':`/${r.scale}`}</strong>{r.combinations?.length?` · ${r.combinations.join(', ')}`:''} · <a href={r.source} target="_blank" rel="noopener noreferrer">Nguồn ↗</a></small></p>):<small>Chưa có bản ghi, không suy ra không tuyển.</small>}</div>)}</details>}
   {i===2&&<button type="button" className="cla-study-jump" onClick={()=>setOptions(old=>old.slice(0,2))}>Bỏ phương án 3</button>}
  </article>})}</div>
  {options.length<3&&<button type="button" className="cla-study-jump" onClick={()=>setOptions(old=>[...old,initial('hust')])}>Thêm phương án 3</button>}
  <p className="cla-source-caution">Không xếp hạng bằng chênh điểm giữa các trường, phương thức hoặc năm. Không phải xác suất trúng tuyển hay xác nhận đủ điều kiện.</p>
 </section>;
}
