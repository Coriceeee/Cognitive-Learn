import { useState } from 'react';
import { getClaApiBaseUrl } from "../../lib/claApiBase";
import { getIdToken } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { externalSourceSearch, parsePublicCandidates, parsePublicQuery, PUBLIC_TOPICS, type PublicCandidate, type PublicTopic, type PublicQuery } from '../../lib/publicSourceSearch';
import { officialUniversities } from '../../data/officialAdmissionSources';
import { officialScholarships } from '../../data/officialScholarships';
import { internationalRoutes } from '../../data/internationalPathways';

const fold=(s:string)=>s.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
function relevantSources(q:PublicQuery) {
  const match=(s:string)=>fold(s).includes(fold(q.subject));
  if(q.topic==='admission')return officialUniversities.filter(u=>match(u.name)||match(u.id)).flatMap(u=>{const year=u.years.find(y=>y.year===q.year);return [{title:u.name,url:u.portalUrl},...(year?[{title:year.schemeLabel,url:year.schemeUrl},...(year.cutoffUrl?[{title:`Điểm chuẩn ${year.year}`,url:year.cutoffUrl}]:[])]:[])];}).slice(0,8);
  if(q.topic==='study')return internationalRoutes.filter(r=>match(r.country)||match(r.isoCode)||r.targetInstitutions.some(t=>match(t.name))).flatMap(r=>[{title:r.sourceLabel,url:r.governmentSource},...r.targetInstitutions.map(t=>({title:t.name,url:t.admissionsUrl}))]).slice(0,8);
  return officialScholarships.filter(s=>match(s.name)||match(s.provider)||match(s.country)||match(s.countryCode)).map(s=>({title:s.name,url:s.sourceUrl})).slice(0,8);
}
export default function PublicSourceSearchPanel({topic}:{topic:PublicTopic}) {
  const [subject,setSubject]=useState(''); const [year,setYear]=useState(String(new Date().getFullYear()));const [confirmed,setConfirmed]=useState(false);
  const [submitted,setSubmitted]=useState<PublicQuery|null>(null); const [results,setResults]=useState<PublicCandidate[]>([]);const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
  const q=parsePublicQuery({version:1,topic,subject,year:year?Number(year):null,confirmedPublic:confirmed});
  async function search(){if(!q||busy)return;setBusy(true);setSubmitted(q);setResults([]);setNotice('Đang tìm nguồn công khai…');try{
    const user=auth.currentUser;if(!user)throw new Error('Yêu cầu đăng nhập.');const token=await getIdToken(user);
    const res=await fetch(`${getClaApiBaseUrl()}/api/public-source-search`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(q),cache:'no-store',signal:AbortSignal.timeout(45000)});
    if(!res.ok)throw new Error('Dịch vụ không khả dụng.');const payload=await res.json();const items=parsePublicCandidates(payload);setResults(items);
    setNotice(items.length?'Nguồn ứng viên — cần mở tài liệu gốc để xác minh.':payload.status==='PROVIDER_NOT_CONFIGURED'?'Nhà cung cấp AI chưa được cấu hình/phê duyệt. Dùng liên kết chính thức hoặc tìm kiếm trực tiếp bên dưới.':'Chưa tìm được nguồn qua nhà cung cấp. Hãy thử mở nguồn trực tiếp.');
  }catch{setNotice('Không thể truy xuất qua AI. Bạn vẫn có thể mở nguồn trực tiếp bên dưới.');}finally{setBusy(false);}}
  return <section className="cla-study-panel" id="public-source-search" aria-label="Tra cứu nguồn công khai theo yêu cầu">
    <h2>Tra cứu nguồn trực tuyến · {PUBLIC_TOPICS[topic]}</h2><p>Tìm bất kỳ trường, ngành, quốc gia hoặc học bổng. Chỉ nhập tên công khai; không nhập tên học sinh, điểm cá nhân, số điện thoại, giấy tờ hay ngân sách.</p>
    <form onSubmit={e=>{e.preventDefault();void search();}}><div className="cla-explorer-filters"><label>Tên công khai<input value={subject} onChange={e=>setSubject(e.target.value)} maxLength={120} disabled={busy} placeholder={topic==='admission'?'Đại học Y Hà Nội':topic==='study'?'Canada Computer Science':'MEXT Nhật Bản'}/></label><label>Năm / kỳ tuyển sinh<select value={year} onChange={e=>setYear(e.target.value)} disabled={busy}><option value="">Không giới hạn</option>{Array.from({length:7},(_,i)=>new Date().getFullYear()+1-i).map(y=><option key={y} value={y}>{y}</option>)}</select></label></div>
    <label><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)} disabled={busy}/> Tôi chỉ gửi thông tin công khai; không có hồ sơ cá nhân.</label><div className="cla-study-actions"><button type="submit" disabled={!q||busy}>{busy?'Đang tìm…':'Tìm nguồn qua AI khi khả dụng'}</button>{q&&<a href={externalSourceSearch(q)} target="_blank" rel="noopener noreferrer">Tìm trực tiếp trên web ↗</a>}</div></form>
    <p role="status" aria-live="polite">{notice}</p>
    {submitted&&<div><h3>Nguồn trong danh mục CLA</h3>{relevantSources(submitted).length? <ul>{relevantSources(submitted).map((s,i)=><li key={`${s.url}-${i}`}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title} ↗</a></li>)}</ul>:<p>Chưa có nguồn tương ứng trong danh mục cục bộ.</p>}<a href={externalSourceSearch(submitted)} target="_blank" rel="noopener noreferrer">Mở kết quả tìm kiếm công khai ↗</a></div>}
    {results.length>0&&<div><h3>Kết quả tìm thấy (chưa xác minh)</h3><ul>{results.map(r=><li key={r.url}><a href={r.url} target="_blank" rel="noopener noreferrer">{r.title} ↗</a><p>{r.snippet}</p><small>{new URL(r.url).hostname} · Chưa xác minh nội dung</small></li>)}</ul></div>}
    <p>Không lưu tự động vào Firestore, không chuyển kết quả AI thành điểm chuẩn, xác suất trúng tuyển hoặc dữ liệu huấn luyện. Kiểm tra đúng năm, chương trình và phương thức tại nguồn gốc.</p>
  </section>;
}
