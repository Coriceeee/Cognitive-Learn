// CP65: render actual AtlasEvidenceJourney and LumenObservationJourney TSX
// into static QA HTML with SYNTHETIC inputs; not a built React/Firebase app.
const fs = require('fs');
const path = require('path');
const ts = require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const root = process.cwd();
function h(tag, props, ...children) { return { tag, props: props || {}, children: children.flat(Infinity) }; }
function compile(rel, mocks = {}) {
  const full = path.join(root, rel);
  const src = fs.readFileSync(full, 'utf8');
  const compiled = ts.transpileModule(src, { fileName: full, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, jsxFactory: 'h' } }).outputText;
  const module = { exports: {} };
  function req(name) {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (!name.startsWith('.')) throw Error('Unexpected import ' + name);
    let dest = path.posix.normalize(path.posix.join(path.posix.dirname(rel), name));
    if (!path.extname(dest)) dest += '.ts';
    return compile(dest, mocks);
  }
  new Function('require', 'module', 'exports', 'h', compiled)(req, module, module.exports, h);
  return module.exports;
}
function esc(x) { return String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function render(n) {
  if (n == null || typeof n === 'boolean') return '';
  if (Array.isArray(n)) return n.map(render).join('');
  if (typeof n !== 'object') return esc(n);
  const attrs=[];
  for (const [k,v] of Object.entries(n.props || {})) {
    if (k==='key' || k==='children' || v===null || v===undefined || k.startsWith('on')) continue;
    const name = k==='className'?'class':k==='htmlFor'?'for':k;
    if (k==='style') { attrs.push('style="'+esc(Object.entries(v).map(([a,b])=>a.replace(/[A-Z]/g,m=>'-'+m.toLowerCase())+':'+b).join(';'))+'"'); continue; }
    if (typeof v==='boolean') { if(v) attrs.push(name); continue; }
    attrs.push(name+'="'+esc(v)+'"');
  }
  return '<'+n.tag+(attrs.length?' '+attrs.join(' '):'')+'>'+n.children.map(render).join('')+'</'+n.tag+'>';
}
const fixture = [
  ...Array.from({length:9},(_,i)=>({year:2024,universityId: i % 2?'school-a':'school-b',source:'https://example.invalid/2024',code:String(i),campus:'campus',method:'THPT'})),
  ...Array.from({length:15},(_,i)=>({year:2025,universityId:'school-a',source:'https://example.invalid/2025',code:String(i),campus:'campus',method:'THPT'})),
  ...Array.from({length:22},(_,i)=>({year:2026,universityId: i % 3?'school-a':'school-c',source:'https://example.invalid/2026',code:String(i),campus:'campus',method:'THPT'})),
];
const atlas=compile('src/page/atlas/components/AtlasEvidenceJourney.tsx',{'../../../lib/nationalAdmissionRegistry':{nationalCutoffs:fixture}}).default();
const lumen=compile('src/page/lumen/components/LumenObservationJourney.tsx').default({cognitive:{scoreAvailable:false,dimensions:[
  {code:'SCI',value:62,available:true},{code:'MAS',value:70,available:true},{code:'CSL',value:NaN,available:false},{code:'CRI',available:false,value:0}
]},growth:null,historyLoading:false});
const css=fs.readFileSync('src/styles/44-cla-atlas-lumen-journey.css','utf8');
const base=`html{font-family:Inter,Arial,system-ui,sans-serif;background:#eaf1f8;color:#17324f}body{margin:0;padding:38px 18px;box-sizing:border-box}main{max-width:1120px;margin:auto}header.qa{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 2px 24px}header.qa strong{font-size:19px}header.qa span{color:#526b82;font-size:11px}html[data-theme=dark]{background:#0c1625;color:#eef5ff}html[data-theme=dark] header.qa span{color:#c1d3e6}html[data-theme=dark] header.qa strong{color:#f1f6ff}`;
for (const [name,element] of [['atlas',atlas],['lumen',lumen]]){
  const html=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${base}\n${css}</style></head><body><main><header class="qa"><div><strong>COGNITIVE LEARN AI · ${name.toUpperCase()}</strong><div><span>KIỂM TRA BỐ CỤC ĐỘC LẬP · DỮ LIỆU MINH HỌA, KHÔNG PHẢI WEBSITE ĐANG CHẠY</span></div></div><span>UX CP65</span></header>${render(element)}</main></body></html>`;
  fs.writeFileSync('reports/cp65/isolated-'+name+'.html',html);
}
console.log('CP65 rendered two actual TSX components into QA HTML with SYNTHETIC fixture; not React website');
