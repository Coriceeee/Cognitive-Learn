/** CP31 Batch 17 - standalone, explicitly synthetic council rehearsal backup.
 * Replays the real local engines before rendering a very limited, escaped view.
 * Never accesses .env, browser storage, Firebase, or observed student records.
 * Does not authorize any empirical/production claim.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {cp31ReleaseSourceSha256} from '../src/lib/nexusEvidenceBaseline.ts';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const {fingerprint}=require('./cp31_release_fingerprint.cjs');
const DEFAULT_OUTPUT=path.join(ROOT,'reports/demo/CLA_DEMO_BACKUP_SYNTHETIC.html');
const EVIDENCE={
  golden:'reports/evidence/cla_golden_path_SYNTHETIC.json',
  multicycle:'reports/evidence/cla_multicycle_SYNTHETIC.json',
  measurement:'reports/evidence/cla_measurement_SYNTHETIC.json',
};
const VALIDATORS=[
  'tools/cla_golden_path_offline.mjs',
  'tools/cla_multicycle_offline.mjs',
  'tools/cla_measurement_offline.mjs',
];
const SHA=s=>crypto.createHash('sha256').update(s).digest('hex');
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function assert(test,reason){if(!test)throw new Error(reason);}
function exactObject(item){return item!==null&&typeof item==='object'&&!Array.isArray(item);}
function assertScore(n){assert(typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=10,'Score outside accepted 0..10 domain');return n;}
function readVerifiedEvidence(){
  assert(fingerprint(ROOT).sha256===cp31ReleaseSourceSha256,'Source fingerprint drift: run original release verification first');
  for(const rel of VALIDATORS){
    const result=spawnSync(process.execPath,['--experimental-strip-types',rel,'--verify'],{cwd:ROOT,encoding:'utf8',timeout:30_000,maxBuffer:2*1024*1024});
    assert(result.status===0&&!result.error,`Local replay failed (${rel}): ${String(result.stderr||result.stdout||result.error?.message).slice(-300)}`);
  }
  const payloads={};
  for(const [key,rel] of Object.entries(EVIDENCE)){
    const data=JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'));
    assert(exactObject(data)&&exactObject(data.payload),'Malformed evidence envelope');
    assert(data.payload.sourceFingerprint===cp31ReleaseSourceSha256,'Evidence from a different source version');
    assert(data.payloadSha256===SHA(JSON.stringify(data.payload)),'Evidence digest mismatch');
    payloads[key]=data.payload;
  }
  const g=payloads.golden.replay,m=payloads.multicycle,me=payloads.measurement;
  assert(g.dataScope==='SYNTHETIC_ONLY'&&g.empiricalClaimEligible===false&&g.treatmentEffectEstimated===false&&g.independentlyVerified===false,'Golden-path scientific safety claim failed');
  assert(m.dataScope==='SYNTHETIC_ONLY'&&m.empiricalClaimEligible===false&&m.measurementEquivalenceVerified===false,'Multicycle scientific safety claim failed');
  assert(me.dataScope==='SYNTHETIC_ONLY'&&me.empiricalClaimEligible===false&&me.measurementEquivalenceVerified===false&&me.reliabilityValidated===false,'Measurement scientific safety claim failed');
  assert(g.comparison?.forecastError===null&&g.comparison?.causalEffect===null,'An unvalidated prediction/effect was introduced');
  assert(m.history?.forecastError===null&&m.history?.causalEffect===null&&me.measurementAudit?.causalEffect===null,'Longitudinal causal claim not allowed');
  assert(me.measurementAudit?.status==='DECLARED_ALIGNED_ONLY','Unexpected measurement validation status');
  assert(Array.isArray(g.stages)&&g.stages.length===7,'Expect 7 actual Golden-Path stages');
  assert(Array.isArray(m.history?.subjectTrends)&&m.history.subjectTrends.length>=1,'No multicycle trend');
  assert(m.history.reviewedCount===2,'Expected two SYNTHETIC cycles');
  assert(Array.isArray(g.comparison?.measures),'No synthetic T0/T1 observations');
  const trends=m.history.subjectTrends.map(s=>{
    assert(typeof s.key==='string'&&typeof s.label==='string'&&Array.isArray(s.points)&&s.points.length===3,'Trend shape changed');
    assert(s.points.map(p=>p.label).join('|')==='T0|T1|T2','Invalid T0/T1/T2 order');
    assert(s.points.every(p=>p.provenance==='student_self_report'),'Synthetic self-report provenance changed');
    const scores=s.points.map(p=>assertScore(p.score));
    return {key:s.key,label:s.label,scores};
  });
  assert(g.comparison.measures.length===trends.length,'Golden path and multicycle subjects differ');
  for(const item of trends){
    const c=g.comparison.measures.find(x=>x.subjectKey===item.key);
    assert(c&&c.t0Score===item.scores[0]&&c.t1Score===item.scores[1],'Golden path / longitudinal scores disagree');
  }
  return {stages:g.stages.map(s=>({id:s.id,name:s.name,source:s.source})),trends,
    compared:g.comparison.measures.length,delta:g.comparison.summary.observedAverageDelta,
    cycleCount:m.history.reviewedCount,declaredCount:me.measurementAudit.suppliedPointCount,
    sourceFingerprint:cp31ReleaseSourceSha256,
    evidenceHashes:Object.fromEntries(Object.entries(EVIDENCE).map(([key,rel])=>[key,SHA(fs.readFileSync(path.join(ROOT,rel)))]))};
}
export function renderBackupHTML(d){
  assert(exactObject(d)&&Array.isArray(d.stages)&&d.stages.length===7&&Array.isArray(d.trends)&&d.trends.length>=1,'Invalid view model');
  const x=[85,320,555],y=v=>240-v*18;
  const colors=['#26a69a','#e3aa55','#7e9be6'];
  const lines=d.trends.map((t,i)=>{
    const coords=t.scores.map((v,j)=>`${x[j]},${y(assertScore(v))}`).join(' ');
    return `<polyline points="${coords}" fill="none" stroke="${colors[i%colors.length]}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${t.scores.map((v,j)=>`<circle cx="${x[j]}" cy="${y(v)}" r="6" fill="${colors[i%colors.length]}" stroke="#101f30" stroke-width="3"/>`).join('')}`;
  }).join('');
  const stageNames={'seed-input':'Seed · dữ liệu đầu vào','orion-plan':'Orion · kế hoạch tại T0','pulse-checkin':'Pulse · check-in','pulse-reassess':'Pulse · lần đo T1','pulse-metrics':'Phân tích quan sát','evidence-record':'Evidence Record','orion-shadow':'Orion · phương án thích ứng'};
  const steps=d.stages.map((s,i)=>`<li><span class="stepno">${i+1}</span><div><strong>${escapeHTML(stageNames[s.id]??s.id)}</strong><small>Engine: ${escapeHTML(s.source)}</small></div></li>`).join('');
  const tr=d.trends.map((t,i)=>`<tr><th scope="row"><i class="dot" style="background:${colors[i%colors.length]}"></i>${escapeHTML(t.label)}</th>${t.scores.map(v=>`<td>${v.toLocaleString('vi-VN',{maximumFractionDigits:2})}</td>`).join('')}</tr>`).join('');
  const legend=d.trends.map((t,i)=>`<span><i class="dot" style="background:${colors[i%colors.length]}"></i>${escapeHTML(t.label)}</span>`).join('');
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>CLA · Dự phòng demo SYNTHETIC</title><style>
:root{color-scheme:dark;--bg:#081420;--card:#122439;--line:#274358;--muted:#a8bfd1;--text:#eff6fc;--teal:#41b9ab}*{box-sizing:border-box}body{margin:0;background:radial-gradient(ellipse at 10% 0%,#173b4b 0,transparent 40%),var(--bg);color:var(--text);font:16px/1.6 system-ui,-apple-system,'Segoe UI',sans-serif}.wrap{max-width:1100px;margin:auto;padding:34px 22px 70px}h1{font-size:clamp(29px,4.6vw,51px);line-height:1.15;margin:.4em 0}h2{font-size:21px;margin:0 0 13px}p{margin:.4em 0 1em}.top{display:flex;justify-content:space-between;gap:24px;align-items:start}.eyebrow{color:#6de1d0;font-weight:750;letter-spacing:.15em;font-size:12px}.warning{background:#493823;border:1px solid #c1904e;border-radius:12px;padding:14px 17px;color:#ffe9c8;font-size:14px}.sub{color:var(--muted);max-width:750px}.pill{display:inline-flex;border:1px solid #c1904e;color:#ffe7b7;padding:4px 10px;border-radius:99px;font-size:12px;font-weight:800;letter-spacing:.05em;white-space:nowrap}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:22px}.card{border:1px solid var(--line);border-radius:17px;background:linear-gradient(160deg,#18334b,#112437);padding:23px;min-width:0}.wide{grid-column:1/-1}.kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:23px 0}.kpi{border:1px solid var(--line);border-radius:12px;padding:14px}.kpi b{display:block;color:#6fe0cd;font-size:28px}.kpi span{font-size:12px;color:var(--muted)}ol{margin:16px 0 0;list-style:none;padding:0;display:grid;gap:10px}li{display:flex;gap:13px;align-items:center}li small{display:block;color:var(--muted);font-size:12px}.stepno{flex:0 0 28px;height:28px;line-height:28px;text-align:center;border-radius:9px;background:#224b59;color:#b6fff1;font-weight:800;font-size:13px}.svgbox{width:100%;height:auto;max-height:325px}table{width:100%;border-collapse:collapse;margin:12px 0 0}td,th{padding:11px 8px;text-align:right;border-bottom:1px solid var(--line)}th:first-child{text-align:left}.legend{display:flex;gap:18px;flex-wrap:wrap;font-size:14px;color:var(--muted)}.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px}.foot{color:var(--muted);font-size:13px;margin-top:25px}code{font-size:12px;word-break:break-all;color:#8ee3d8}details{padding:10px 0;border-bottom:1px solid var(--line)}summary{cursor:pointer;font-weight:700}.muted{color:var(--muted)}.intro{max-width:800px}.scope{display:grid;gap:8px;padding-left:18px}a{color:#7be5d4}@media(max-width:720px){.top{display:block}.grid{grid-template-columns:1fr}.kpis{grid-template-columns:1fr 1fr}.wrap{padding:22px 14px 50px}}
</style></head><body><main class="wrap"><div class="top"><div><div class="eyebrow">COGNITIVE LEARN AI · EVIDENCE REPLAY</div><h1>Demo dự phòng<br>vòng lặp học tập</h1><p class="sub intro">Bản HTML độc lập dùng khi trình diễn trực tuyến bị gián đoạn. Nội dung được trích xuất từ đầu ra engine thực và đối chiếu bằng các bài kiểm tra offline; <b>không phải giao diện website đang hoạt động</b>.</p></div><span class="pill">SYNTHETIC · OFFLINE</span></div><div class="warning"><b>Không phải dữ liệu học sinh.</b> Các điểm số, check-in, tác động và kịch bản đều là dữ liệu tổng hợp. Chưa xác minh tâm trắc, chưa có dự báo ML đã hiệu chuẩn, chưa có hiệu quả nhân quả được chứng minh. PASS offline không có nghĩa production/Emulator/E2E PASS.</div><div class="kpis"><div class="kpi"><b>${d.stages.length}</b><span>Bước phát lại thực</span></div><div class="kpi"><b>${d.cycleCount}</b><span>Chu kỳ tổng hợp</span></div><div class="kpi"><b>${d.declaredCount}</b><span>Khai báo phép đo tự báo cáo</span></div></div><div class="grid"><section class="card"><h2>01 · Chuỗi quyết định</h2><p class="muted">Seed → Orion → Pulse → Evidence → thích ứng, gọi engine offline.</p><ol>${steps}</ol></section><section class="card"><h2>02 · Dữ liệu T0 / T1 / T2</h2><p class="muted">Biến động <b>quan sát mô phỏng</b>, không phải hiệu quả của CLA.</p><svg class="svgbox" viewBox="0 0 640 290" role="img" aria-label="Đường điểm tự báo cáo tổng hợp qua ba mốc T0, T1, T2"><g stroke="#315065" stroke-width="1">${[0,2,4,6,8,10].map(v=>`<line x1="65" x2="575" y1="${y(v)}" y2="${y(v)}"/>`).join('')}</g><g fill="#aec9d8" font-size="13">${[0,2,4,6,8,10].map(v=>`<text x="42" y="${y(v)+5}" text-anchor="end">${v}</text>`).join('')}${['T0','T1','T2'].map((v,i)=>`<text x="${x[i]}" y="274" text-anchor="middle">${v}</text>`).join('')}</g>${lines}</svg><div class="legend">${legend}</div><table><thead><tr><th scope="col">Môn</th><th scope="col">T0</th><th scope="col">T1</th><th scope="col">T2</th></tr></thead><tbody>${tr}</tbody></table></section><section class="card wide"><h2>03 · Giới hạn kết luận khoa học</h2><div class="scope"><div>✓ Phát lại kết quả mô phỏng từ fixture và source cục bộ.</div><div>✓ Bảo toàn điểm <b>0</b> và phân biệt giá trị thiếu.</div><div>✓ Metadata phép đo được đối chiếu theo khai báo.</div><div>✕ <b>Không</b> xác nhận tương đương thang đo, độ tin cậy hoặc tính giá trị.</div><div>✕ <b>Không</b> tính sai số dự báo tại T0 khi chưa có dự báo hợp lệ.</div><div>✕ <b>Không</b> suy ra CLA gây ra sự thay đổi điểm số.</div></div></section><section class="card wide"><h2>04 · Kịch bản 4 phút nếu mạng gặp lỗi</h2><details open><summary>0:00–0:45 · Mô tả câu hỏi nghiên cứu</summary><p>CLA liên kết khảo sát đầu vào, kế hoạch học, theo dõi hành động, đánh giá lại và giải thích quyết định. Phân biệt hệ thống hỗ trợ quyết định với công cụ dự báo đã được kiểm định.</p></details><details><summary>0:45–1:45 · Chạy qua 7 giai đoạn</summary><p>Chỉ vào chuỗi 7 bước ở cột trái, nhấn mạnh engine phát lại dữ liệu tổng hợp và Evidence Record.</p></details><details><summary>1:45–2:45 · Giải thích T0/T1/T2</summary><p>Cho thấy giá trị 0, thay đổi số học và giới hạn tự báo cáo. Không xem thay đổi trước/sau là tác động do can thiệp.</p></details><details><summary>2:45–4:00 · Trình bày kiểm toán và hạn chế</summary><p>Nêu nguồn điểm, mã đề, thang điểm, tính bất biến T0, quyền riêng tư. Trả lời trung thực rằng đánh giá dữ liệu thật, Firestore Emulator và browser E2E vẫn cần nghiệm thu độc lập.</p></details></section></div><div class="foot">Mã fingerprint source: <code>${escapeHTML(d.sourceFingerprint)}</code><p>Dữ liệu đối chiếu với 3 Evidence Bundle synthetic. Đây là tiện ích <b>trình diễn dự phòng</b>, không phải biên bản nghiệm thu hay báo cáo thực nghiệm. HTML không gọi Firebase, không tải script ngoài và không chứa hồ sơ học sinh.</p></div></main></body></html>`;
}
export function produceBackup(mode='--generate',destination=DEFAULT_OUTPUT){
  assert(['--generate','--verify'].includes(mode),'Mode must be --generate or --verify');
  const d=readVerifiedEvidence();
  const html=renderBackupHTML(d);
  if(mode==='--generate'){
    fs.mkdirSync(path.dirname(destination),{recursive:true});
    fs.writeFileSync(destination,html,{mode:0o600});
  }else{
    assert(fs.existsSync(destination),'No backup HTML to verify');
    assert(fs.readFileSync(destination,'utf8')===html,'Backup HTML changed or does not match current evidence');
  }
  return {status:'SYNTHETIC_DEMO_BACKUP_VERIFIED',mode,htmlSha256:SHA(html),sizeBytes:Buffer.byteLength(html),
    sourceFingerprint:d.sourceFingerprint,evidenceHashes:d.evidenceHashes,measurementEquivalenceVerified:false,
    calibratedPredictionValidated:false,causalEffectEstimated:false,firestoreEmulatorChecked:false,browserE2EChecked:false};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [mode='--generate',dest,...extra]=process.argv.slice(2);
  try{
    assert(extra.length===0&&['--generate','--verify'].includes(mode),'Usage: --generate|--verify [file.html]');
    const result=produceBackup(mode,dest?path.resolve(dest):DEFAULT_OUTPUT);
    console.log(`${result.status}: ${mode}; ${result.sizeBytes} bytes; sha256=${result.htmlSha256}; ${dest?path.resolve(dest):DEFAULT_OUTPUT}`);
  }catch(err){console.error('CLA_DEMO_BACKUP_FAIL:',err.message);process.exitCode=1;}
}
