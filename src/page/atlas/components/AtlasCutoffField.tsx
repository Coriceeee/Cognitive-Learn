import {useMemo,useState} from 'react';
import {nationalCutoffs,cutoffKey,nationalProgramHistory,normalizeNational} from '../../../lib/nationalAdmissionRegistry';
import {officialUniversities} from '../../../data/officialAdmissionSources';
const keyOf=(r:{universityId:string;campus:string;code:string})=>JSON.stringify([r.universityId,r.campus,r.code]);
const catalogue=[...new Map(nationalCutoffs.map(r=>[keyOf(r),r])).values()].sort((a,b)=>a.major.localeCompare(b.major,'vi'));
export default function AtlasCutoffField(){
 const [school,setSchool]=useState(''),[query,setQuery]=useState(''),[selectedKey,setSelectedKey]=useState('');
 const list=useMemo(()=>catalogue.filter(r=>(!school||r.universityId===school)&&(!query.trim()||normalizeNational(`${r.major} ${r.code} ${r.university}`).includes(normalizeNational(query)))),[school,query]);
 const selected=list.find(r=>keyOf(r)===selectedKey);
 const history=selected?nationalProgramHistory(cutoffKey(selected)):[];
 return <section id="atlas-national-history" className="atlas-cutoff-field" aria-labelledby="atlas-cutoff-field-title">
  <div className="atlas-cutoff-field-heading"><div><span>ATLAS · NATIONAL HISTORY</span><h2 id="atlas-cutoff-field-title">Điểm công bố 2024–2026 theo từng trường và phương thức</h2><p>Chọn một mã xét tuyển tại một cơ sở. Dữ liệu từng năm lấy đúng bản ghi đã nhập, không nội suy năm thiếu.</p></div></div>
  <div className="cla-explorer-filters"><label>Trường<select value={school} onChange={e=>{setSchool(e.target.value);setSelectedKey('');}}><option value="">Tất cả trường</option>{officialUniversities.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Tìm ngành hoặc mã<input type="search" value={query} onChange={e=>{setQuery(e.target.value);setSelectedKey('');}}/></label><label>Chương trình<select value={selected?.universityId?selectedKey:''} onChange={e=>setSelectedKey(e.target.value)}><option value="">— Chọn chương trình —</option>{list.map(r=><option key={keyOf(r)} value={keyOf(r)}>{r.university} · {r.major} · {r.code} ({r.campus})</option>)}</select></label></div>
  {!list.length&&<p>Chưa có dữ liệu điểm cấp ngành cho bộ lọc. {school&&<a href={officialUniversities.find(u=>u.id===school)?.portalUrl} target="_blank" rel="noopener noreferrer">Nguồn trường ↗</a>}</p>}
  {selected&&<div className="atlas-history-years">{history.map(({year,records})=><section key={year}><h3>{year}</h3>{records.length?records.map(row=><div className="atlas-history-line" key={cutoffKey(row)}><div><strong>{row.label}</strong> · {row.cutoff.toFixed(2)}{row.scale===null?' (chưa xác minh thang)':`/${row.scale}`} <a href={row.source} target="_blank" rel="noopener noreferrer">Nguồn ↗</a></div>{row.scale!==null&&<div className="atlas-history-track" role="img" aria-label={`${row.cutoff} trên ${row.scale}, ${row.label}`}><i style={{width:`${Math.min(100,row.cutoff/row.scale*100)}%`}}/></div>}<small>{row.note}</small></div>):<p>Chưa có bản ghi năm này.</p>}</section>)}</div>}
  <p className="atlas-cutoff-method-note">Mỗi thanh dùng thang điểm riêng của bản ghi. Không nối các năm thành đường xu hướng khi chưa xác minh tính tương đương phương thức. Không so tỷ lệ thanh giữa các phương thức; không suy ra mức cạnh tranh hoặc xác suất đỗ.</p>
 </section>;
}
