// CP64 layout QA from the actual TSX component, transpiled with a tiny JSX-only
// DOM serializer. No React app/Firebase is started; values below are SYNTHETIC.
const fs = require('fs'), path = require('path'), ts = require('typescript');
const root=process.cwd();
function load(rel) {
  const full=path.join(root,rel);
  const src=fs.readFileSync(full,'utf8');
  const compiled=ts.transpileModule(src,{fileName:full,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.React,jsxFactory:'h'}}).outputText;
  const m={exports:{}};
  const req=(name)=>{
    if(!name.startsWith('.')) throw Error('Unexpected require: '+name);
    let dest=path.posix.normalize(path.posix.join(path.posix.dirname(rel),name));
    if(!path.extname(dest)) dest+='.ts';
    return load(dest);
  };
  new Function('require','module','exports','h',compiled)(req,m,m.exports,h);
  return m.exports;
}
function h(tag,props,...children){return {tag,props:props||{},children:children.flat(Infinity)}}
function esc(x){return String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function render(n){
  if(n==null||typeof n==='boolean')return '';
  if(Array.isArray(n))return n.map(render).join('');
  if(typeof n!=='object')return esc(n);
  let attrs=[];
  for(const [key,value] of Object.entries(n.props||{})) {
    if(key==='key'||value==null||key.startsWith('on'))continue;
    const name=key==='className'?'class':key==='htmlFor'?'for':key;
    if(key==='style') {attrs.push('style="'+esc(Object.entries(value).map(([k,v])=>k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())+':'+v).join(';'))+'"');continue}
    if(typeof value==='boolean'){if(value)attrs.push(name);continue}
    attrs.push(name+'="'+esc(value)+'"');
  }
  return '<'+n.tag+(attrs.length?' '+attrs.join(' '):'')+'>'+n.children.map(render).join('')+'</'+n.tag+'>';
}
const {default:Component}=load('src/components/common/ModuleInputObservatory.tsx');
const grade=(key,value)=>({key,label:key,value,min:0,max:10});
const groups=[
  {key:'now',title:'Điểm hiện tại (0–10)',fields:[grade('Toán','8.2'),grade('Văn','7.5'),grade('Anh',''),grade('Lý','6.8'),grade('Hóa','12'),grade('Sinh','')]},
  {key:'target',title:'Điểm mục tiêu (0–10)',fields:[grade('T-Toán','9'),grade('T-Văn',''),grade('T-Anh','8'),grade('T-Lý',''),grade('T-Hóa',''),grade('T-Sinh','')]},
  {key:'planning',title:'Thời hạn & ngành định hướng',fields:[{key:'weeks',label:'Số tuần còn lại',value:'16',min:1,max:104,integer:true},{key:'major',label:'Ngành mục tiêu',value:'Công nghệ thông tin'}]},
];
const element=Component({moduleName:'Orion',groups,editHref:'/orion/inputs',resultHref:'/orion/scenarios',resultLabel:'Mở mô phỏng',canSimulate:false,note:'Dữ liệu minh họa chỉ dùng kiểm tra bố cục. Không sử dụng cho báo cáo kết quả học sinh.'});
const css=fs.readFileSync('src/styles/43-cla-input-observatory.css','utf8');
const html=`<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
html{font-family:Arial,system-ui,sans-serif;background:#e9eff6;color:#173250}body{margin:0;padding:40px 16px;box-sizing:border-box}main{max-width:1050px;margin:auto}header{padding:15px 8px 24px;display:flex;justify-content:space-between;align-items:center;gap:15px}header strong{font-size:20px;color:#173250}header span{font-size:11px;color:#52677d}body:has(:root[data-theme=dark]){background:#091527}html[data-theme=dark]{background:#091527;color:#edf6ff}html[data-theme=dark] header strong{color:#eef6ff}html[data-theme=dark] header span{color:#bdd3ec}
${css}
</style><body><main><header><div><strong>ORION · Trạm mô phỏng</strong><div><span>KIỂM TRA BỐ CỤC ĐỘC LẬP · DỮ LIỆU MINH HỌA</span></div></div><span>UX CP64</span></header>${render(element)}</main></body></html>`;
fs.writeFileSync('reports/cp64/isolated-orion.html',html);
console.log('Markup generated from actual ModuleInputObservatory.tsx, not a running React website');
