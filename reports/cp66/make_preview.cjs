// Render the real CP66 ModuleStateNotice TSX into standalone QA HTML.
// Synthetic status fixtures; NOT a screenshot of a running React/Firebase app.
const fs=require('node:fs');
const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const source=fs.readFileSync('src/components/common/ModuleStateNotice.tsx','utf8');
const compiled=ts.transpileModule(source,{fileName:'ModuleStateNotice.tsx',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.React,jsxFactory:'h'}}).outputText;
const h=(tag,props,...children)=>({tag,props:props||{},children:children.flat(Infinity)});
const record={exports:{}};
new Function('module','exports','h',compiled)(record,record.exports,h);
const ModuleStateNotice=record.exports.default;
function escape(s){return String(s).replace(/[&<>\"]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]));}
function render(o){if(o==null||typeof o==='boolean')return '';if(Array.isArray(o))return o.map(render).join('');if(typeof o!=='object')return escape(o);
 const a=Object.entries(o.props).filter(([k,v])=>k!=='children'&&!k.startsWith('on')&&v!=null).map(([k,v])=>` ${k==='className'?'class':k}="${escape(v)}"`).join('');return `<${o.tag}${a}>${o.children.map(render).join('')}</${o.tag}>`;}
const sample=[
 ['SEED · BẢNG ĐIỂM','loading','Đang xác minh bảng điểm','Đang nhận dữ liệu học tập; chưa sử dụng dữ liệu cache.'],
 ['LUMEN · NHẬN THỨC','neutral','Chưa đủ phép đo','Cần bổ sung phép đo trong Seed trước khi giải thích các chỉ số nhận thức.'],
 ['ATLAS · TUYỂN SINH','warning','Đối chiếu nguồn tuyển sinh','Kiểm tra trường, năm và phương thức từ thông báo chính thức trước khi ra quyết định.'],
 ['ORION · CHIẾN LƯỢC','warning','Chưa lưu thay đổi','Bạn có chỉnh sửa mới chưa được xác nhận lưu trên máy chủ.'],
 ['PULSE · TIẾN ĐỘ','success','Đã đồng bộ','Bản nháp đã được Firestore xác minh từ máy chủ.'],
 ['HAVEN · HỖ TRỢ','error','Xung đột dữ liệu','Có thay đổi từ thiết bị khác. Bản nháp trên máy này vẫn được giữ để bạn quyết định.'],
 ];
const css=fs.readFileSync('src/styles/45-cla-module-state-system.css','utf8');
const blocks=sample.map(([name,tone,label,message])=>`<section class="module"><h2>${escape(name)}</h2>${render(ModuleStateNotice({tone,label,message,children:tone==='error'?h('a',{href:'#'},'Xem phương án xử lý'):null}))}</section>`).join('');
const base=`*{box-sizing:border-box}html{font-family:Inter,system-ui,Arial,sans-serif;background:#e9f0f7;color:#142e4d}body{margin:0;padding:36px 22px}main{max-width:1050px;margin:auto}header{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin:0 0 24px}header small{font-weight:800;letter-spacing:.14em;color:#2859a0}header h1{font-size:clamp(24px,3vw,34px);margin:9px 0 5px}header p{font-size:13px;color:#52677d;margin:0}header span{font-size:11px;color:#52677d}.qa-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.module{background:#fff;border:1px solid #d9e3ee;border-radius:15px;padding:18px;min-width:0}.module h2{margin:0 0 6px;font-size:12px;color:#335474;letter-spacing:.06em}.module .cla-module-state{margin:8px 0 0}footer{margin-top:20px;color:#52677d;font-size:11px}html[data-theme="dark"]{background:#0c1929;color:#e8f3ff}html[data-theme="dark"] header p,html[data-theme="dark"] header span,html[data-theme="dark"] footer{color:#bdd1e5}html[data-theme="dark"] header small{color:#b1d2fb}html[data-theme="dark"] .module{background:#14273b;border-color:#2f4865}html[data-theme="dark"] .module h2{color:#bdcee5}@media(max-width:720px){body{padding:18px 12px}.qa-grid{grid-template-columns:1fr}.module{padding:13px}header{display:block}header span{display:block;margin-top:9px}}`;
fs.writeFileSync('reports/cp66/preview-isolated.html',`<!doctype html><html lang="vi"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>${base}\n${css}</style></head><body><main><header><div><small>COGNITIVE LEARN AI · UX CP66</small><h1>Một ngôn ngữ trạng thái · Sáu phân hệ</h1><p>Trạng thái luôn có tên, mô tả và hướng xử lý; không chỉ khác màu.</p></div><span>ẢNH QA ĐỘC LẬP · DỮ LIỆU MINH HỌA</span></header><div class="qa-grid">${blocks}</div><footer>Chỉ để kiểm tra bố cục bằng Chromium. Không phải ảnh website React/Firebase đang chạy.</footer></main></body></html>`);
console.log('Rendered actual CP66 component from TSX to isolated QA preview.');
