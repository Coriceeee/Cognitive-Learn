#!/usr/bin/env python3
"""CP68 isolated route planner verification. Not the running React website.

The QA-only fixture uses a JSON debug <output> that can overflow on mobile;
we wrap this debug string for this isolated test. No application CSS changes.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

root = Path(__file__).resolve().parents[2]
fixture = (root / 'reports/cp67/route-isolated.html').read_text(encoding='utf8')
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for name, width, height in [('desktop', 1280, 800), ('mobile', 390, 844)]:
        page = browser.new_page(viewport={'width': width, 'height': height})
        page.set_content(fixture, wait_until='load')
        page.add_style_tag(content='output{display:block;overflow-wrap:anywhere}')
        page.wait_for_function('window.qaReady === true')
        page.evaluate("window.testNavigate('/orion/inputs','push')")
        page.evaluate('window.scrollTo(0,500)')
        before = page.evaluate('scrollY')
        assert before >= 400, 'Fixture did not have a useful scroll offset'
        decision = page.evaluate("window.testNavigate('/lumen/history','pop')")
        assert decision == {'scroll': 'preserve', 'anchor': None, 'focusContent': True}, decision
        assert page.evaluate('scrollY') == before, 'Pop changed scroll position'
        assert page.evaluate('document.activeElement.id') == 'cla-page-content', 'Pop focus was not restored'
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), 'Fixture overflows horizontally'
        print(f'CP68_ISOLATED_POP_{name.upper()}_PASS (not React E2E)')
        page.close()
    browser.close()
