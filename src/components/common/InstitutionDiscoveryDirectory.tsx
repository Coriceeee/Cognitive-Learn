import {useMemo,useState} from 'react';
import {institutionDiscoverySource} from '../../data/institutionDiscovery2026';
import {institutionDiscoverySummary,searchInstitutions,institutionQueryText,type DiscoveryInstitution} from '../../lib/institutionDiscovery';
const summary=institutionDiscoverySummary();
const PAGE=12;
/** Public names only. Selection fills the query, never submits it or creates an aspiration. */
export default function InstitutionDiscoveryDirectory({onChoose,disabled}:{onChoose:(row:DiscoveryInstitution)=>void;disabled:boolean}){
 const [query,setQuery]=useState(''),[scope,setScope]=useState<'ALL'|'REGISTRY_SOURCE'|'DISCOVERY_ONLY'>('ALL'),[page,setPage]=useState(0);
 const rows=useMemo(()=>searchInstitutions(query,scope),[query,scope]);const pages=Math.max(1,Math.ceil(rows.length/PAGE));const current=Math.min(page,pages-1);
 return <details className="cla-evidence-sample"><summary>Danh mục khám phá trường · {summary.entries} mục tra cứu</summary>
 <p>Có {summary.surveyEntries} tên trong danh sách khảo sát của Bộ tháng 10/2026, đối chiếu với kho CLA. Đây không phải danh mục mã tuyển sinh chính thức đầy đủ; một số mục là đại học mẹ hoặc cơ sở nghiên cứu.</p>
 <div className="cla-source-coverage-track" role="img" aria-label={`${summary.registryEntries} mục liên kết kho tuyển sinh, ${summary.discoveryOnly} mục mới chỉ có tên cơ sở`}><span className="is-method" style={{width:`${summary.registryEntries/summary.entries*100}%`}}/><span className="is-archive" style={{width:`${summary.discoveryOnly/summary.entries*100}%`}}/></div>
 <div className="cla-source-coverage-legend"><span><i className="is-method"/> {summary.registryEntries} mục có nguồn tuyển sinh trong kho</span><span><i className="is-archive"/> {summary.discoveryOnly} mục chỉ có tên để tìm nguồn</span></div>
 <div className="cla-explorer-filters"><label>Lọc danh mục<input type="search" maxLength={120} value={query} placeholder="Tên trường (có/không dấu), mã đã biết" onChange={e=>{setQuery(e.target.value);setPage(0);}}/></label><label>Trạng thái nguồn<select value={scope} onChange={e=>{setScope(e.target.value as typeof scope);setPage(0);}}><option value="ALL">Tất cả</option><option value="REGISTRY_SOURCE">Có nguồn trong kho</option><option value="DISCOVERY_ONLY">Chỉ có tên cơ sở</option></select></label></div>
 <p role="status">{rows.length} mục phù hợp · Trang {current+1}/{pages}</p>
 <ul style={{listStyle:'none',padding:0,margin:0}}>{rows.slice(current*PAGE,(current+1)*PAGE).map(row=><li key={row.id} style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:'6px',padding:'8px 0',borderBottom:'1px solid var(--cla-border, #8884)'}}><div><strong>{row.name}</strong>{row.admissionCode&&<small> · {row.admissionCode} (mã ghi trong kho)</small>}<br/><small>{row.status==='REGISTRY_SOURCE'?'Có liên kết nguồn tuyển sinh · chưa chắc đủ ba năm':'Chỉ có tên cơ sở · chưa đối chiếu ngành, mã hoặc mùa tuyển sinh'}</small></div><div className="cla-study-actions">{row.portal&&<a href={row.portal} target="_blank" rel="noopener noreferrer">Cổng trường ↗</a>}<button type="button" disabled={disabled||institutionQueryText(row).length>120} onClick={()=>onChoose(row)}>Chọn để tra cứu</button></div></li>)}</ul>
 {rows.length===0&&<p>Không thấy trong danh mục từng phần. Vẫn có thể nhập trực tiếp tên trường hoặc ngành vào ô tra cứu.</p>}
 <div className="cla-study-actions"><button type="button" disabled={current===0} onClick={()=>setPage(current-1)}>Trang trước</button><button type="button" disabled={current+1>=pages} onClick={()=>setPage(current+1)}>Trang sau</button></div>
 <p><a href={institutionDiscoverySource.url} target="_blank" rel="noopener noreferrer">Nguồn danh sách tên cơ sở · trang {institutionDiscoverySource.pages} ↗</a>. Không dùng danh sách này làm mẫu số toàn quốc hoặc xác nhận trường đang tuyển.</p></details>;
}
