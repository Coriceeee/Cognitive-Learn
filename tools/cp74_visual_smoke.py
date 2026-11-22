#!/usr/bin/env python3
"""Independent CSS smoke fixture. NEVER a React/browser E2E acceptance claim.
Checks the shipped final CSS layers with representative HTML in Chromium.
"""
from __future__ import annotations
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
import re

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / 'reports/cp74'
REPORTS.mkdir(parents=True, exist_ok=True)
HTML = '''<!doctype html><html lang="vi"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<link rel="stylesheet" href="../../src/styles.css" /></head><body>
<div class="app-root"><main class="cla-public-page"><header class="cla-public-header">
<a class="cla-public-logo" href="#"><strong>COGNITIVE LEARN AI</strong></a><div class="cla-public-actions">Giới thiệu · Liên hệ</div>
</header><div class="cla-public-shell"><section class="cla-public-hero">
<div class="cla-public-hero-copy"><span class="cla-public-eyebrow">COGNITIVE LEARN AI / DÀNH CHO HỌC SINH</span>
<h1>Một hành trình học tập có dữ liệu, có định hướng.</h1>
<p>Hiểu xuất phát điểm, lựa chọn bước tiếp theo và theo dõi sự thay đổi.</p>
<div class="cla-public-hero-actions"><a class="cla-action-button cla-action-button--primary" href="#">Vào không gian học tập</a>
<a class="cla-action-button cla-action-button--outline" href="#">Khám phá sáu phân hệ</a></div></div>
<aside class="cla-public-journey"><span class="cla-public-panel-label">HÀNH TRÌNH HỌC TẬP</span>
<ol><li><span>01</span><div><strong>Hiểu điểm xuất phát</strong><small>Seed · Lumen</small></div></li>
<li><span>02</span><div><strong>Khám phá lựa chọn</strong><small>Atlas · Haven</small></div></li>
<li><span>03</span><div><strong>Lập kế hoạch hành động</strong><small>Orion</small></div></li>
<li><span>04</span><div><strong>Theo dõi và điều chỉnh</strong><small>Pulse</small></div></li></ol></aside></section>
<section class="cla-public-section"><div class="cla-public-section-heading"><div><span class="cla-public-eyebrow">SÁU PHÂN HỆ</span><h2>Bạn muốn bắt đầu từ đâu?</h2></div><p>Mỗi phân hệ giải quyết một nhiệm vụ riêng.</p></div>
<div class="cla-public-module-grid">'''+ ''.join(f'<article class="cla-public-module"><span>{m}</span><h3>{t}</h3><p>Hỗ trợ học sinh tự tìm hiểu, lập kế hoạch và đối chiếu dữ liệu hiện có.</p><a href="#">Mở phân hệ ↗</a></article>' for m,t in [ ('Seed','Hồ sơ học tập'), ('Lumen','Hiểu dữ liệu nhận thức'),('Atlas','Khám phá ngành và trường'),('Orion','Lập chiến lược'),('Pulse','Theo dõi và điều chỉnh'),('Haven','Cân nhắc cơ hội')]) + '''</div></section>
<section class="cla-public-section"><nav class="cla-module-subnav cla-focus-nav cla-guided-workspace cla-unified-bar" aria-label="Chức năng Seed">
<div class="cla-unified-identity"><span class="cla-unified-identity-mark">S</span><strong>Seed</strong></div>
<div class="cla-module-subnav-links cla-guided-primary cla-unified-tabs" role="group">
<a class="is-active" aria-current="page" href="#">Tổng quan</a><a href="#">Hồ sơ & mục tiêu</a><a href="#">Bảng điểm & GPA</a><a href="#">Thiết lập lịch thi</a></div>
<div class="cla-guided-controls cla-unified-actions"><details class="cla-guided-more"><summary>Mục khác <span>2</span><span class="cla-guided-chevron">⌄</span></summary><div class="cla-guided-more-content"><a href="#">Lịch sử</a><a href="#">Nâng cao</a></div></details></div>
</nav><div role="alert" class="profile-page"><p class="profile-message" role="alert">Không thể tải hồ sơ từ máy chủ. Dữ liệu chưa được xác minh.</p><button class="cla-action-button cla-action-button--outline" type="button">Thử tải lại hồ sơ</button></div></section>
<section class="cla-contact-compose"><div class="cla-contact-compose-aside"><span class="cla-public-eyebrow">SOẠN YÊU CẦU</span><h2>Mô tả vấn đề để nhận hỗ trợ.</h2><p>Biểu mẫu sẽ mở ứng dụng email với nội dung được điền sẵn.</p></div>
<form class="cla-contact-form"><label for="t">Chủ đề</label><select id="t"><option>Hồ sơ & bảng điểm</option></select>
<label for="m">Mô tả vấn đề</label><textarea id="m">Tôi cần trợ giúp ở Seed.</textarea>
<div class="cla-contact-form-actions"><button type="button" class="cla-action-button cla-action-button--primary">Mở email để gửi ↗</button></div></form></section></div></main></div></body></html>'''
FIXTURE = REPORTS / 'css-smoke-fixture.html'
FIXTURE.write_text(HTML, encoding='utf-8')

# WCAG ratio for opaque computed CSS samples. Disabled/commentary links excluded.
def linear(x):
    x = x / 255
    return x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4

def ratio(a,b):
    def lum(rgb): return .2126*linear(rgb[0]) + .7152*linear(rgb[1]) + .0722*linear(rgb[2])
    aa,bb = sorted([lum(a),lum(b)],reverse=True)
    return (aa+.05)/(bb+.05)

def rgb(value):
    return [int(part.strip()) for part in value.removeprefix('rgb(').removesuffix(')').split(',')[:3]]

# No local/network navigation is required: evaluate the exact imported CSS
# as an inline stylesheet in a controlled, independent HTML fixture.
entry=(ROOT/'src/styles.css').read_text(encoding='utf-8')
imports=re.findall(r'@import\s+"([^"]+\.css)";',entry)
css='\n'.join((ROOT/'src'/rel).read_text(encoding='utf-8') for rel in imports)
smoke_html=HTML.replace('<link rel="stylesheet" href="../../src/styles.css" />','<style>'+css+'</style>')
checks=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for width,height in ((1280,900),(900,860),(390,844),(360,800)):
        for theme in ('light','dark'):
            context=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,reduced_motion='reduce')
            page=context.new_page()
            page.set_content(smoke_html, wait_until='domcontentloaded')
            page.evaluate('(theme) => document.documentElement.setAttribute("data-theme", theme)',theme)
            page.wait_for_timeout(120)
            # Assertions use real loaded CSS and DOM geometry, not screenshots alone.
            metrics=page.evaluate('''() => {
              const nav=document.querySelector('.cla-unified-bar');
              const active=nav.querySelector('[aria-current="page"]');
              const note=document.querySelector('.profile-message[role="alert"]');
              const selected=getComputedStyle(active); const bar=getComputedStyle(nav);
              const alertStyle=getComputedStyle(note);
              const retry=document.querySelector('.profile-page .cla-action-button');
              const retryRect=retry.getBoundingClientRect();
              const navRect=nav.getBoundingClientRect();
              return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
                navWidth:navRect.width,retryWidth:retryRect.width,
                selectedInk:selected.color,selectedBackground:selected.backgroundColor,
                alertInk:alertStyle.color,alertBackground:alertStyle.backgroundColor,
                barInk:bar.color,barBackground:bar.backgroundColor,
                dropdownCount:nav.querySelectorAll('.cla-guided-journey').length,
                activeVisible:active.getBoundingClientRect().width>0};
            }''')
            assert metrics['scrollWidth'] <= width+2, (width,theme,metrics)
            assert metrics['dropdownCount']==0
            assert metrics['activeVisible']
            assert metrics['retryWidth'] < max(310,width-20),metrics
            selected_ratio=ratio(rgb(metrics['selectedInk']),rgb(metrics['selectedBackground']))
            alert_ratio=ratio(rgb(metrics['alertInk']),rgb(metrics['alertBackground']))
            assert selected_ratio >= 4.5,(width,theme,selected_ratio)
            assert alert_ratio >= 4.5,(width,theme,alert_ratio)
            page.locator('.cla-guided-more summary').click()
            assert page.locator('.cla-guided-more-content a').count()==2
            if width in (1280,390):
                page.screenshot(path=str(REPORTS/f'css-qa-{theme}-{width}.png'),full_page=True)
            checks.append({'viewport':width,'theme':theme,'result':'PASS','selectedContrast':round(selected_ratio,2),'alertContrast':round(alert_ratio,2),'overflow':False})
            context.close()
    browser.close()
(REPORTS/'CP74_CSS_SMOKE_RESULTS.json').write_text(json.dumps({'scope':'independent HTML/CSS fixture, not React E2E','checks':checks},ensure_ascii=False,indent=2),encoding='utf-8')
print('CP74 independent CSS smoke PASS',len(checks),'/',len(checks))
