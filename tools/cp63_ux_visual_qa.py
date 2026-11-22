#!/usr/bin/env python3
"""CP63 optional offline CSS/DOM screenshots. Requires Python Playwright + Chromium.
These are isolated QA previews of source-driven navigation, NOT production screenshots.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT / 'reports' / 'cp63'
CASES=[('atlas','light','more',1280,860),('lumen','dark','journey',1280,880),('orion','light','none',390,844)]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for module,theme,open_state,w,h in CASES:
        page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
        page.set_content((BASE/f'preview-{module}-{theme}-{open_state}.html').read_text(encoding='utf-8'),wait_until='load')
        screenshot=BASE/f'preview-{module}-{theme}-{open_state}.png'
        page.screenshot(path=str(screenshot),full_page=True)
        metrics=page.evaluate('''() => ({width: innerWidth, scrollWidth:document.documentElement.scrollWidth,
          nav: !!document.querySelector('.cla-guided-workspace'),
          links: document.querySelectorAll('.cla-guided-primary a').length,
          active: document.querySelectorAll('.cla-guided-primary .is-active').length})''')
        assert metrics['scrollWidth'] <= metrics['width']+1, f'horizontal overflow: {module}'
        assert metrics['nav'] and metrics['links'] <= 4 and metrics['active'] == 1, f'nav semantics: {module}'
        print(f'PASS {screenshot.name}: no overflow, active visible, links={metrics["links"]}')
        page.close()
    browser.close()
