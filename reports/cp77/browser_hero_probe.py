"""Isolated CSS/DOM browser probe, not a React/Firebase E2E test."""
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright
root = Path(__file__).resolve().parents[2]
src=(root/'src/page/auth/LoginPage.tsx').read_text()
marker='<section className="login-left profile-showcase-left">'
start=src.index(marker)
end=src.index('</section>',start)+len('</section>')
section=src[start:end].replace('className=', 'class=')
path=root/'reports/cp77/isolated_login_hero_qa.html'
entry=root/'src/styles.css'
css='\n'.join((root/'src'/m).read_text() for m in re.findall(r'@import \"([^\"]+)\";',entry.read_text()))
html='''<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>'''+css+'''</style></head><body><main class="login-page">'''+section+'''<section class="auth-side"><div class="login-card"><h2>Đăng nhập</h2></div></section></main></body></html>'''
path.write_text(html)
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium',args=['--no-sandbox','--allow-file-access-from-files'])
    for width,height in [(390,844),(768,1024),(1093,768),(1366,768),(1680,1050)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        page.set_content(html,wait_until='load')
        page.wait_for_timeout(350)
        data=page.evaluate('''() => {
          const get=(s)=>document.querySelector(s);
          const head=get('.cla-login-manifesto'), para=get('.cla-login-manifesto-caption'), hero=get('.profile-showcase-left'), pill=get('.profile-showcase-card');
          const rect=(el)=>{const r=el.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
          const hr=rect(head),pr=rect(para),er=rect(hero),ir=rect(pill);
          const css=getComputedStyle(head);
          const v={width:innerWidth, documentWidth:document.documentElement.scrollWidth,hero:er,headline:hr,caption:pr,card:ir,headingFont:css.fontSize, headingColor:css.color,
          noHorizontalOverflow:document.documentElement.scrollWidth<=innerWidth,
          headingContained:hr.left>=er.left && hr.right<=er.right+1 && hr.top>=er.top && hr.bottom<=er.bottom,
          captionContained:pr.left>=er.left && pr.right<=er.right+1 && pr.bottom<=er.bottom,
          cardContained:ir.left>=er.left && ir.right<=er.right+1 && ir.bottom<=er.bottom,
          captionNotCovered:pr.bottom <= ir.top || ir.right <= pr.left || ir.left>=pr.right || ir.top >= pr.bottom};
          return v;
        }''')
        results.append(data)
        if width in [390,1093]: page.screenshot(path=str(root/f'reports/cp77/hero-qa-{width}.png'),full_page=True)
        page.close()
    browser.close()
report=root/'reports/cp77/browser-hero-qa.json'
report.write_text(json.dumps({'scope':'isolated static DOM + actual CSS; not React E2E', 'results':results},indent=2,ensure_ascii=False))
print(json.dumps(results,ensure_ascii=False,indent=2))
if any(not (r['noHorizontalOverflow'] and r['headingContained'] and r['captionContained'] and r['cardContained'] and r['captionNotCovered']) for r in results):
    raise SystemExit('ISOLATED_HERO_LAYOUT_FAIL')
