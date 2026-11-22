/** Offline, source-driven design preview. Not a screenshot of the running React app. */
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { getStudentSubmodules } from '../src/data/moduleSubmodules.ts';
import { planGuidedNavigation } from '../src/lib/moduleWayfinding.ts';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'reports/cp63');mkdirSync(out,{recursive:true});
const css = readFileSync(resolve(root,'src/styles/42-cla-guided-workspaces.css'),'utf8');
const labels={seed:['SEED PROFILE','Hồ sơ học tập','Hồ sơ','/student'],lumen:['LUMEN INTELLIGENCE','Phân tích năng lực','Phân tích','/lumen'],atlas:['ATLAS ADMISSION','Tuyển sinh & du học','Tuyển sinh','/atlas'],orion:['ORION STRATEGY','Chiến lược học tập','Kế hoạch','/orion'],pulse:['PULSE MONITOR','Theo dõi tiến độ','Tiến độ','/pulse'],haven:['HAVEN SUPPORT','Học bổng & tài chính','Học bổng','/haven']};
const safe = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const a=(item,active)=>`<a href="${safe(item.href)}" class="${active?'is-active':''}" ${active?'aria-current="page"':''}>${safe(item.title)}</a>`;
function makePage(key,path,theme,open) {
 const [eyebrow,name,,home]=labels[key]; const g=planGuidedNavigation(getStudentSubmodules(key),home,path);
 const title=g.onHome?name:g.active?.title??name;
 const journey=Object.entries(labels).map(([id,[,title,short,href]],i)=>`<a href="${href}" ${id===key?'class="is-current" aria-current="location"':''}><span>${String(i+1).padStart(2,'0')}</span><strong>${id.toUpperCase()}</strong><small>${safe(short)}</small></a>`).join('');
 const html=`<!doctype html><html lang="vi" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CP63 UX — ${safe(name)}</title><style>
 *{box-sizing:border-box}html{font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif}body{background:${theme==='dark'?'#0c1727':'#f5f8fc'};color:${theme==='dark'?'#ecf4ff':'#17324f'};margin:0;padding:32px 26px}a{color:inherit}button{font:inherit}.frame{max-width:1180px;margin:0 auto}.preview-caption{font-size:12px;letter-spacing:.08em;font-weight:750;color:${theme==='dark'?'#a5c0dd':'#526c86'};padding:9px 0 18px}.demo-content{padding:24px 25px 28px;background:${theme==='dark'?'#14263d':'white'};border:1px solid ${theme==='dark'?'#36516e':'#dce7f2'};border-radius:20px}.demo-content h2{margin:0 0 11px;font-size:23px}.demo-content p{max-width:80ch;line-height:1.65;font-size:14px}.demo-rule{height:16px;border-radius:8px;margin:19px 0;background:${theme==='dark'?'#273c57':'#e9f1fa'};width:80%}.demo-rule.short{width:56%}.cla-focus-nav{width:100%}.cla-module-subnav-head strong{display:block}.cla-module-subnav-links a{display:inline-block}.cla-focus-home{text-decoration:none;border:1px solid transparent;border-radius:99px;padding:8px 12px}.cla-guided-controls details{display:block}.cla-focus-heading h1{margin:6px 0 0}.cla-focus-heading p{margin:8px 0 0}.cla-guided-journey-grid a strong{font-size:12px}
 ${css}
 @media(max-width:640px){body{padding:14px 11px}.preview-caption{font-size:10px}.demo-content{padding:18px}.demo-content h2{font-size:19px}}
 </style></head><body><div class="frame"><div class="preview-caption">COGNITIVE LEARN AI / CP63 / ${safe(eyebrow)} / ISOLATED CSS PREVIEW</div>
 <nav class="cla-module-subnav cla-focus-nav cla-guided-workspace" aria-label="Chức năng ${safe(name)}">
  <div class="cla-module-subnav-head"><div class="cla-guided-identity"><span>${safe(eyebrow)} / ${safe(title)}</span><strong>${safe(name)}</strong></div><a href="/student" class="cla-focus-home">Không gian học sinh</a></div>
  <div class="cla-guided-topline"><span class="cla-guided-caption">KHÔNG GIAN LÀM VIỆC</span><span class="cla-guided-position">${String(g.step).padStart(2,'0')} / ${String(g.total).padStart(2,'0')} <small>mục điều hướng</small></span></div>
  <div class="cla-module-subnav-links cla-guided-primary" role="group"><a class="${g.onHome?'is-active':''}" href="${home}">Tổng quan</a>${g.featured.map(item=>a(item,item===g.active)).join('')}</div>
  <div class="cla-guided-controls">${g.more.length?`<details class="cla-guided-more" ${open==='more'?'open':''}><summary>Khám phá thêm <span>${g.more.length} mục</span><span class="cla-guided-chevron">⌄</span></summary><div class="cla-guided-more-content">${g.more.map(i=>a(i,false)).join('')}</div></details>`:''}
  <details class="cla-guided-journey" ${open==='journey'?'open':''}><summary>Chuyển phân hệ <span class="cla-guided-chevron">⌄</span></summary><div class="cla-guided-journey-grid">${journey}</div><p class="cla-guided-journey-note">Đây là sơ đồ truy cập các phân hệ, không phải chỉ số tiến bộ hay thứ tự bắt buộc.</p></details></div>
  ${g.onHome?`<div class="cla-guided-start"><span>Chọn một nội dung để bắt đầu.</span><a href="${g.next?.href}">Bắt đầu: ${g.next?.title} →</a></div>`:`<div class="cla-focus-heading cla-guided-heading"><div><span class="cla-guided-caption">ĐANG XEM</span><h1>${safe(title)}</h1><p>${safe(g.active?.description??'')}</p></div><div class="cla-guided-pager">${g.previous?`<a href="${g.previous.href}">← Trước</a>`:''}${g.next?`<a href="${g.next.href}">Tiếp theo →</a>`:''}</div></div>`}
 </nav><section class="demo-content"><h2>${safe(title)}</h2><p>Không gian nội dung của ${safe(name)}. Phần minh họa này chỉ dùng để đánh giá tính dễ đọc, tương phản và bố cục điều hướng; không hiển thị dữ liệu học sinh, điểm số hay kết quả nghiên cứu.</p><div class="demo-rule"></div><div class="demo-rule short"></div></section></div></body></html>`;
 const dest=resolve(out,`preview-${key}-${theme}-${open}.html`); writeFileSync(dest,html);console.log(dest);
}
makePage('atlas','/atlas/subjects','light','more');
makePage('lumen','/lumen/history','dark','journey');
makePage('orion','/orion/scenarios','light','none');
