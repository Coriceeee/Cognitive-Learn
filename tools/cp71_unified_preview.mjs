/** Isolated UX visual-QA fixtures based on the navigation source's public catalog.
 * Do not present these as screenshots of the compiled React application. */
import { writeFileSync,mkdirSync,readFileSync } from 'node:fs';
import { getStudentSubmodules } from '../src/data/moduleSubmodules.ts';
import { planGuidedNavigation } from '../src/lib/moduleWayfinding.ts';
const root = new URL('../',import.meta.url);
const dir = new URL('../reports/cp71/',import.meta.url);
mkdirSync(dir,{recursive:true});
const baseCss=readFileSync(new URL('../src/styles/42-cla-guided-workspaces.css',import.meta.url),'utf8');
const finalCss=readFileSync(new URL('../src/styles/48-cla-unified-navigation.css',import.meta.url),'utf8');
const labels={seed:['Seed','/student','Hồ sơ học tập'],lumen:['Lumen','/lumen','Phân tích năng lực'],atlas:['Atlas','/atlas','Tuyển sinh & du học'],orion:['Orion','/orion','Chiến lược học tập'],pulse:['Pulse','/pulse','Theo dõi tiến độ'],haven:['Haven','/haven','Học bổng & tài chính']};
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const anchor=(item,active)=>`<a href="${escape(item.href)}" class="${active?'is-active':''}" ${active?'aria-current="page"':''}>${escape(item.title)}</a>`;
for(const [key,[name,home,title]] of Object.entries(labels)) {
 const menu=planGuidedNavigation(getStudentSubmodules(key),home,key==='atlas'?'/atlas/compare':key==='lumen'?'/lumen/history':home);
 const tabs=[{id:'overview',title:'Tổng quan',href:home},...menu.featured];
 const body=`<nav class="cla-module-subnav cla-focus-nav cla-guided-workspace cla-unified-bar" aria-label="Chức năng ${escape(title)}">
  <div class="cla-unified-identity"><span class="cla-unified-identity-mark">${name[0]}</span><strong>${name}</strong></div>
  <div class="cla-module-subnav-links cla-guided-primary cla-unified-tabs" role="group">
    ${tabs.map((i,n)=>anchor(i,n===0?menu.onHome:i===menu.active)).join('')}
  </div>
  <div class="cla-guided-controls cla-unified-actions">
    ${menu.more.length?`<details class="cla-guided-more"><summary>Mục khác <span>${menu.more.length}</span><span class="cla-guided-chevron">⌄</span></summary><div class="cla-guided-more-content">${menu.more.map(i=>anchor(i,false)).join('')}</div></details>`:''}
  </div>
 </nav>`;
 const html=`<!doctype html><html lang="vi" data-theme="__THEME__"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>CP71 / ${name}</title><style>
 *{box-sizing:border-box} html{font:14px system-ui,Arial,sans-serif} body{margin:0;padding:40px 22px;background:#f4f7fc;color:#17324f}html[data-theme="dark"] body{background:#0c1727;color:#ecf4ff} .frame{max-width:1130px;margin:0 auto}.lab{font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;margin-bottom:20px} .demo{background:#fff;border:1px solid #d8e4f0;border-radius:17px;padding:24px;margin-top:24px} html[data-theme="dark"] .demo{background:#14263d;border-color:#344e6b}.demo h1{font-size:26px}.demo p{font-size:14px;line-height:1.6}
${baseCss}\n${finalCss}\n@media(max-width:640px){body{padding:18px 9px}}
</style></head><body><div class="frame"><div class="lab">COGNITIVE LEARN AI · CP71 · ${escape(name)} · Isolated design QA</div>${body}<section class="demo"><h1>${escape(title)}</h1><p>Nội dung học tập của phân hệ được giữ lại; chỉ thay giao diện điều hướng. Không hiển thị dữ liệu cá nhân hoặc kết quả AI.</p></section></div></body></html>`;
 const out=new URL(`preview-${key}.html`,dir);
 writeFileSync(out,html, 'utf8');
 console.log(out.pathname);
}
