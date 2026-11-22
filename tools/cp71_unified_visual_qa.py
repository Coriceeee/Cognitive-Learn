#!/usr/bin/env python3
"""Playwright checks CP71 isolated source-driven navigation; NOT a React E2E."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
DIR=ROOT/'reports'/'cp71'
def relative_luminance(rgb):
    vals=[int(v) for v in rgb.replace('rgb(', '').replace('rgba(', '').split(')')[0].split(',')[:3]]
    linear=[v/255/12.92 if v/255<=0.04045 else ((v/255+0.055)/1.055)**2.4 for v in vals]
    return 0.2126*linear[0]+0.7152*linear[1]+0.0722*linear[2]

def wcag_ratio(fg,bg):
    values=sorted([relative_luminance(fg),relative_luminance(bg)])
    return (values[1]+0.05)/(values[0]+0.05)

cases=[('atlas','light',1280,860),('lumen','dark',1280,860),('seed','light',390,844),('orion','dark',390,844)]

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for name,theme,w,h in cases:
        page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
        html=(DIR/f'preview-{name}.html').read_text('utf-8').replace('__THEME__',theme)
        page.set_content(html,wait_until='load')
        nav=page.locator('.cla-unified-bar')
        assert nav.count()==1
        metrics=page.evaluate('''() => {
          const nav=document.querySelector('.cla-unified-bar');
          const tabs=[...document.querySelectorAll('.cla-unified-tabs a')];
          const chosen=tabs.filter(a=>a.classList.contains('is-active'));
          const first=tabs[0]; const style=getComputedStyle(first);
          return {width:innerWidth, scroll:document.documentElement.scrollWidth,
            active:chosen.length,links:tabs.length,background:getComputedStyle(nav).backgroundColor,
            text:style.color,tabBackground:style.backgroundColor.endsWith(', 0)') ? getComputedStyle(nav).backgroundColor : style.backgroundColor,
            buttonHeight:first.getBoundingClientRect().height,
            tabNotClipped:tabs.every(a=> {const r=a.getBoundingClientRect();return r.width>20 && r.x>=0 && r.right<=innerWidth+1;})};
        }''')
        assert metrics['scroll']<=metrics['width']+1, ('horizontal overflow',name,theme,metrics)
        assert metrics['active']==1, ('active tab missing',name,metrics)
        assert metrics['tabNotClipped'], ('clipped tab',name,metrics)
        assert metrics['buttonHeight']>=39, ('target too small',name,metrics)
        ratio=wcag_ratio(metrics['text'],metrics['tabBackground'])
        assert ratio>=4.5, ('inadequate text contrast',name,theme,ratio)
        active_styles=page.locator('.cla-unified-tabs a.is-active').evaluate('''e => ({fg:getComputedStyle(e).color,bg:getComputedStyle(e).backgroundColor})''')
        selected_ratio=wcag_ratio(active_styles['fg'],active_styles['bg'])
        assert selected_ratio>=4.5, ('inadequate selected contrast',name,theme,selected_ratio)
        assert page.locator('.cla-guided-journey').count()==0
        if page.locator('.cla-guided-more summary').count():
            page.locator('.cla-guided-more summary').click()
            assert page.locator('.cla-guided-more-content a').count()>0
            page.locator('.cla-guided-more summary').click()
        shot=DIR/f'preview-unified-{name}-{theme}-{w}.png'
        page.screenshot(path=str(shot),full_page=True)
        print('PASS',shot.name,'no overflow / active & accessible / no duplicate dropdown / contrast >=4.5',metrics)
        page.close()
    browser.close()
