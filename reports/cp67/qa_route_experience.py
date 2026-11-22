#!/usr/bin/env python3
"""Chromium smoke of CP67 pure transition logic and skip-link CSS.
This is an isolated harness, NOT live React/Firebase E2E or a production screenshot.
"""
from __future__ import annotations
from pathlib import Path
import subprocess
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
REPORT = ROOT / 'reports' / 'cp67'
css = (ROOT / 'src/styles/46-cla-route-accessibility.css').read_text()
fixture = '''<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>CP67 | Isolated QA</title><style>CSS_HERE</style><style>
body{font:15px/1.65 system-ui,sans-serif;background:#f2f7fc;color:#163453;margin:0}
header{background:#fff;border-bottom:1px solid #c3d3e6;padding:18px max(16px,calc((100vw - 1050px)/2))}
header a{color:#17477e;font-weight:bold;margin-right:14px}
main{padding:24px;max-width:900px;margin:auto}
.tour{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}
button{border:1px solid #9dbbdb;background:#fff;color:#164d82;border-radius:10px;padding:12px 15px;font-weight:bold;cursor:pointer}
section{border-radius:18px;background:#fff;border:1px solid #cdddf0;padding:20px;max-width:800px}
.graph{height:150px;display:flex;align-items:end;gap:15px;padding:16px 5px;border-bottom:1px solid #abc}
.graph b{width:30%;border-radius:8px 8px 0 0;background:#5282bd}
small{color:#4b6178}
</style></head><body><a class="cla-skip-to-content" href="#cla-page-content">Bỏ qua điều hướng, đến nội dung</a>
<span class="cla-route-announcement" role="status" aria-live="polite">Đã mở: Du học quốc tế · Atlas</span>
<header><strong>CP67 · QA điều hướng (không phải React)</strong><nav aria-label="Mô phỏng sáu phân hệ"><a href="#atlas">Atlas</a><a href="#lumen">Lumen</a><a href="#orion">Orion</a><a href="#pulse">Pulse</a><a href="#haven">Haven</a><a href="#seed">Seed</a></nav></header>
<main id="cla-page-content" tabindex="-1"><section><small>ISOLATED ROUTE EXPERIENCE · A11Y</small><h1 id="route-heading">Du học quốc tế · Atlas</h1><p>Minh họa kiểm thử CSS và kế hoạch chuyển trang. Không chứa dữ liệu học sinh và không phải ảnh chụp website thật.</p>
<div class="graph" aria-hidden="true"><b style="height:70%"></b><b style="height:40%"></b><b style="height:100%"></b></div><div class="tour"><button id="filter" type="button">Đổi quốc gia (giữ vị trí)</button><button id="route" type="button">Mở Orion (về đầu, focus)</button></div><output id="status">Chưa điều hướng</output></section><div style="height:950px"></div></main>
<script type="module">
import {planRouteExperience,getRouteDisplayTitle} from './routeExperience-preview.js';
let href='/atlas/study-abroad?country=vn';
window.testNavigate=(destination,kind='push')=>{
 const decision=planRouteExperience(href,destination,kind); href=destination;
 document.getElementById('status').textContent=JSON.stringify(decision);
 document.querySelector('.cla-route-announcement').textContent='Đã mở: '+getRouteDisplayTitle(new URL(href,'https://cla.local').pathname);
 if(decision.scroll==='top') window.scrollTo(0,0);
 if(decision.focusContent) document.getElementById('cla-page-content').focus({preventScroll:true});
 document.getElementById('route-heading').textContent=getRouteDisplayTitle(new URL(href,'https://cla.local').pathname);
 return decision;
};
document.getElementById('filter').addEventListener('click',()=>window.testNavigate('/atlas/study-abroad?country=jp'));
document.getElementById('route').addEventListener('click',()=>window.testNavigate('/orion/inputs'));
window.qaReady=true;
</script></body></html>'''.replace('CSS_HERE',css)
(REPORT / 'route-isolated.html').write_text(fixture)
js = f'''const ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript');
const fs=require('fs');
fs.writeFileSync({str(REPORT/'routeExperience-preview.js')!r},ts.transpileModule(fs.readFileSync({str(ROOT/'src/lib/routeExperience.ts')!r},'utf8'),{{compilerOptions:{{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}}}).outputText);
'''
subprocess.run(['node','-e',js],check=True)
# Render everything in-memory; the runner blocks localhost HTTP, and this
# smoke does not require network access or a fake server pretending to be CLA.
compiled = (REPORT/'routeExperience-preview.js').read_text().replace('export ', '')
fixture = fixture.replace("<script type=\"module\">\nimport {planRouteExperience,getRouteDisplayTitle} from './routeExperience-preview.js';", '<script>\n'+compiled)
(REPORT / 'route-isolated.html').write_text(fixture)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for name,width,height in [('desktop',1160,800),('mobile',390,760)]:
  page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
  page.set_content(fixture,wait_until='load');page.wait_for_function('window.qaReady === true')
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'{name}: overflow'
  page.locator('.cla-skip-to-content').focus()
  page.wait_for_timeout(230)
  bbox=page.locator('.cla-skip-to-content').bounding_box()
  assert bbox and bbox['y'] >= 0, f'{name}: skip link is not visible on focus'
  page.screenshot(path=str(REPORT/f'preview-skip-{name}.png'),full_page=False)
  page.evaluate('window.scrollTo(0,450)')
  before=page.evaluate('scrollY')
  query=page.evaluate("window.testNavigate('/atlas/study-abroad?country=jp')")
  assert query['scroll']=='preserve' and query['focusContent']==False
  assert page.evaluate('scrollY') == before, f'{name}: query changed scroll position'
  route=page.evaluate("window.testNavigate('/orion/inputs')")
  assert route['scroll']=='top' and route['focusContent']
  assert page.evaluate('scrollY') == 0, f'{name}: route failed to scroll top'
  assert page.evaluate('document.activeElement.id')=='cla-page-content',f'{name}: focus missing'
  assert 'Orion' in page.locator('.cla-route-announcement').inner_text()
  print(f'{name}: PASS, skip link visible, query preserved scroll, route focused, no overflow')
  page.close()
 browser.close()
