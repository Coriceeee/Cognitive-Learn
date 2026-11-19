import { useEffect, useMemo, useState } from 'react';
import { type DiscoveryQuery } from '../../../lib/nationalProgramDiscovery';
import { cutoffKey, compareNationalCutoff, getCutoff } from '../../../lib/nationalAdmissionRegistry';
import { officialUniversities, admissionYears } from '../../../data/officialAdmissionSources';
import { matchNationalPrograms, observedCombinations, interestDomains, type InterestDomainId, type SchoolEvidence } from '../../../lib/atlasPersonalMatching';
import { useStudentTranscript } from '../../seed/hooks/useStudentTranscript';
import { chooseSeedAtlasScoreSnapshot } from '../../../lib/seedAtlasScoreAdapter';
import { auth } from '../../../lib/firebase';
import AtlasCareerExploration from './AtlasCareerExploration';
const empty: DiscoveryQuery={year:2026,interest:'',region:'ALL',combination:'',universityId:''};
export default function AtlasProgramDiscoveryPanel(){
 const [criteria,setCriteria]=useState(empty); const [limit,setLimit]=useState(12);
 const [selected,setSelected]=useState(''); const [score,setScore]=useState('');
 const transcript=useStudentTranscript();
 const [domains,setDomains]=useState<InterestDomainId[]>([]);
 const [enabledUid,setEnabledUid]=useState<string|null>(null);
 const [onlyListed,setOnlyListed]=useState(false);
 const currentUid=transcript.userId===auth.currentUser?.uid?transcript.userId:null;
 useEffect(()=>{setEnabledUid(null);setOnlyListed(false);setDomains([]);setCriteria(empty);setSelected('');setScore('');setLimit(12);},[currentUid]);
 const seed=useMemo(()=>transcript.status==='ready'&&transcript.data?chooseSeedAtlasScoreSnapshot(transcript.data):null,[transcript.status,transcript.data]);
 const evidence=useMemo<SchoolEvidence|null>(()=>currentUid&&enabledUid===currentUid&&seed&&transcript.source?{termId:seed.termId,termLabel:seed.termLabel,scores:seed.scores,source:transcript.source}:null,[currentUid,enabledUid,seed,transcript.source]);
 const matches=useMemo(()=>matchNationalPrograms(criteria,domains,evidence,!!evidence&&onlyListed),[criteria,domains,evidence,onlyListed]);
 const combos=useMemo(()=>observedCombinations(evidence),[evidence]);
 const row=getCutoff(selected); const comparison=selected?compareNationalCutoff(selected,score):null;
 function update(next:DiscoveryQuery){setCriteria(next);setLimit(12);setSelected('');setScore('');}
 return <section className="cla-source-explorer" id="atlas-personalized-discovery" aria-labelledby="atlas-personalized-title">
  <span className="cla-eyebrow">ATLAS · KHÁM PHÁ THEO TIÊU CHÍ CÁ NHÂN</span><h2 id="atlas-personalized-title">Tìm phương án ngành và trường phù hợp mục tiêu</h2>
  <p>Chọn ngành yêu thích, nhóm hoạt động, khu vực và tổ hợp. Atlas lọc các mã xét tuyển đã có đề án hoặc điểm nguồn; đây là công cụ khám phá, không phải phép đo phù hợp nghề nghiệp hay xác suất đỗ. Điểm học bạ và điểm thi là hai loại dữ liệu riêng.</p>
  <details open><summary>Khám phá nghề nghiệp theo hoạt động bạn yêu thích</summary><p>Chọn một hoặc nhiều nhóm hoạt động. Kết quả chỉ tìm các ngành có tên liên quan; không đo năng lực nghề nghiệp, không suy ra tính cách hay xếp hạng phù hợp.</p>
   <div className="cla-explorer-filters">{interestDomains.map(d=><label key={d.id}><input type="checkbox" checked={domains.includes(d.id)} onChange={e=>{setDomains(prev=>e.target.checked?[...prev,d.id]:prev.filter(x=>x!==d.id));setLimit(12);setSelected('');setScore('');}}/>{d.label}</label>)}</div>
  </details>
  <div className="cla-major-card"><h3>Đối chiếu học lực từ Seed</h3><p>Chỉ dùng điểm trung bình môn hoàn chỉnh trong cùng một học kỳ. Tổng điểm học tập không phải điểm thi hoặc điểm xét tuyển, không so trực tiếp với điểm chuẩn.</p>
   {currentUid&&seed&&transcript.status==='ready'?<button type="button" className="cla-study-jump" onClick={()=>{setEnabledUid(evidence?null:currentUid);setOnlyListed(false);setSelected('');setScore('');setLimit(12);}}>{evidence?'Ngừng sử dụng điểm Seed':'Dùng học kỳ gần nhất đủ dữ liệu'}</button>:<p role="status">{transcript.status==='error'?'Chưa xác minh được bảng điểm.':transcript.status==='loading'||transcript.status==='syncing'?'Đang xác minh bảng điểm…':'Chưa có dữ liệu học kỳ đủ điều kiện để đối chiếu.'} <a href="/student/transcript">Mở bảng điểm</a></p>}
   {evidence&&<><p>{evidence.termLabel} · {evidence.source==='legacy'?'Hồ sơ cũ đã đối soát':'Bảng điểm Seed đã đồng bộ'}</p><p>{combos.length?combos.map(c=>`${c.code}: ${c.total.toFixed(2)}/30`).join(' · '):'Chưa có tổ hợp hỗ trợ đủ ba môn.'}</p><label><input type="checkbox" checked={onlyListed} onChange={e=>{setOnlyListed(e.target.checked);setLimit(12);setSelected('');setScore('');}}/>Chỉ xem mã có tổ hợp được nguồn liệt kê và đủ điểm môn</label></>}
  </div>
  {currentUid&&<AtlasCareerExploration key={currentUid} evidence={evidence} onExplore={domain=>{setDomains([domain]);setCriteria(prev=>({...prev,interest:''}));setLimit(12);setSelected('');setScore('');}}/>}
  <div className="cla-explorer-filters">
   <label>Ngành / mã xét tuyển<input type="search" maxLength={100} value={criteria.interest} placeholder="CNTT, Luật, Y khoa, QHX21..." onChange={e=>update({...criteria,interest:e.target.value})}/></label>
   <label>Năm<select value={criteria.year} onChange={e=>update({...criteria,year:Number(e.target.value)})}>{admissionYears.map(y=><option key={y} value={y}>{y}</option>)}</select></label>
   <label>Khu vực<select value={criteria.region} onChange={e=>update({...criteria,region:e.target.value as DiscoveryQuery['region']})}>{['ALL','Bắc','Trung','Nam'].map(x=><option key={x} value={x}>{x==='ALL'?'Tất cả':x}</option>)}</select></label>
   <label>Trường<select value={criteria.universityId} onChange={e=>update({...criteria,universityId:e.target.value})}><option value="">Tất cả trường</option>{officialUniversities.map(s=><option value={s.id} key={s.id}>{s.name}</option>)}</select></label>
   <label>Tổ hợp (tùy chọn)<input maxLength={3} placeholder="D01" value={criteria.combination} onChange={e=>update({...criteria,combination:e.target.value.toUpperCase()})}/></label>
  </div>
  <p role="status">{matches.length} mã xét tuyển trong phạm vi dữ liệu đã nhập. Tổ hợp chưa xác nhận không có nghĩa không đủ điều kiện. <a href="/atlas/vietnam#atlas-official-admissions">Tìm thêm nguồn chưa có điểm ↗</a></p>
  <div className="cla-major-grid">{matches.slice(0,limit).map(m=><article className="cla-major-card" key={`${m.universityId}|${m.campus}|${m.code}`}>
   <strong>{m.major}</strong><small>{m.university} · {m.campus} · {m.code}</small>
   {criteria.combination&&<p>{m.combinationStatus==='LISTED'?'Có tổ hợp trong nguồn đã nhập: '+criteria.combination:'Chưa xác nhận mã tổ hợp này; nguồn ghi tên môn có thể vẫn phù hợp. Xem đề án gốc.'}</p>}
   {m.interestMatches.length>0&&<small>Từ khóa liên quan: {[...new Set(m.interestMatches.map(x=>x.keyword))].join(', ')}</small>}
   {evidence&&<p>{m.academicEvidence.length?`Có ${[...new Set(m.academicEvidence.map(x=>x.combination))].join(', ')} trong nguồn và đủ điểm môn ở ${evidence.termLabel}.`:'Chưa xác nhận được tổ hợp có đủ điểm môn theo nguồn; không kết luận không đủ điều kiện.'}</p>}
   {m.academicEvidence.length>0&&<details><summary>Chi tiết đối chiếu học tập</summary>{m.academicEvidence.map(x=><p key={`${x.recordKey}|${x.combination}`}>{x.combination} · tổng học kỳ {x.schoolTotal.toFixed(2)}/30 · {x.method} · <a href={x.source} target="_blank" rel="noopener noreferrer">Nguồn tổ hợp ↗</a></p>)}</details>}
   {m.publishedEvidence.length>0&&<details><summary>Tổ hợp từ danh mục / nguồn công bố 2026</summary>{Array.from(new Map(m.publishedEvidence.map(e=>[e.source,e.source])).keys()).map(src=><p key={src}>{[...new Set(m.publishedEvidence.filter(e=>e.source===src).map(e=>e.code))].join(', ')} · <a href={src} target="_blank" rel="noopener noreferrer">Nguồn tổ hợp ↗</a></p>)}<small>Không gán các tổ hợp này vào phương thức điểm chuẩn khác.</small></details>}
   <details><summary>{m.records.length?`${m.records.length} bản ghi điểm theo phương thức`:"Chưa có điểm chuẩn chuẩn hóa"}</summary>{m.records.map(r=><div key={cutoffKey(r)}><p>{r.label}: <strong>{r.cutoff.toFixed(2)}{r.scale===null?'':`/${r.scale}`}</strong>{r.combinations?.length?` · ${r.combinations.join(', ')}`:''} · <a href={r.source} target="_blank" rel="noopener noreferrer">Nguồn ↗</a></p><small>{r.note}</small>{r.scale!==null&&<p><button type="button" className="cla-study-jump" onClick={()=>{setSelected(cutoffKey(r));setScore('');}}>Đối chiếu điểm này</button></p>}</div>)}</details>
  </article>)}</div>
  {matches.length>limit&&<button type="button" className="cla-study-jump" onClick={()=>setLimit(n=>n+12)}>Xem thêm 12 mã</button>}
  {!matches.length&&<p>Không có kết quả trong bộ dữ liệu hiện có. Hãy kiểm tra lại tiêu chí hoặc mở cổng tuyển sinh chính thức.</p>}
  {row&&<div className="cla-major-card" role="region" aria-label="Đối chiếu điểm đã chọn"><h3>{row.major} · {row.university}</h3><small>{row.year} · {row.label} · {row.campus}</small><p>Điểm công bố: {row.cutoff}/{row.scale}. Nhập điểm xét tuyển đã tính theo đúng phương thức của trường; không nhập điểm GPA hoặc điểm thi khác thang.</p><label>Điểm xét tuyển<input value={score} onChange={e=>setScore(e.target.value)} inputMode="decimal" /></label><p role="status">{comparison?`Chênh lệch tham khảo: ${comparison.gap>0?'+':''}${comparison.gap.toFixed(2)} điểm; chưa đánh giá điều kiện trúng tuyển.`:score?'Điểm không hợp lệ.':'Chưa nhập điểm.'}</p><p>{row.note} <a href={row.source} target="_blank" rel="noopener noreferrer">Nguồn gốc ↗</a></p><button type="button" className="cla-study-jump" onClick={()=>{setSelected('');setScore('');}}>Bỏ đối chiếu</button></div>}
  <p className="cla-source-caution">Không tự sắp xếp nguyện vọng, không xếp hạng bằng chênh điểm giữa các trường, không ghi xác suất đỗ. Các lựa chọn ở đây không được lưu hoặc gửi đến LLM.</p>
 </section>;
}
