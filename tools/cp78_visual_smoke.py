#!/usr/bin/env python3
"""Isolated CP78 browser style smoke of unchanged module map geometry and unified nav.
This is NOT a production React or Firebase E2E test. No real student data.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'reports'/'cp78'
OUT.mkdir(exist_ok=True,parents=True)
names=[('seed','SEED','Bản sắc học tập','#167d60'),('lumen','LUMEN','Dấu vân tay trí tuệ','#9b650d'),('atlas','ATLAS','Bản đồ tương lai','#265fc4'),('orion','ORION','Kiến trúc tương lai','#6744b8'),('pulse','PULSE','Đường cong tiến hóa','#b13d60'),('haven','HAVEN','Hành trang thế giới','#087f88')]
tab_labels={
 'seed':['Góc nhìn của tôi','Tôi muốn trở thành','Hành trình học lực','Những cột mốc'],
 'lumen':['Toàn cảnh tư duy','Phổ nhận thức','Tín hiệu của tôi','Đường nét thay đổi'],
 'atlas':['Bản đồ của tôi','Bản đồ đại học','Chạm thế giới','Quốc tế tại Việt Nam'],
 'orion':['Bàn thiết kế','Đích đến của tôi','Phòng thử chiến lược','Bản thiết kế từng tuần'],
 'pulse':['Dòng thời gian','Nhịp học hiện tại','Tín hiệu tiến độ','Nhật ký chuyển mình'],
 'haven':['Toàn cảnh cơ hội','Cơ hội học bổng','Bài toán tài chính','Hành trình chuẩn bị'],
}
slots=[(16,26),(49,18),(81,30),(81,73),(49,84),(17,72)]
style='\n'.join((ROOT/'src/styles'/x).read_text() for x in ['40-cla-exam-horizon-learning-circuit.css','48-cla-unified-navigation.css','49-cla-product-polish.css'])
# Same classes/styles/positions as components, but a stand-alone rendering, not React.
def markup(module):
    key=module[0]
    nav=''.join(f'<a href="/demo/{i}" class="{"is-active" if i==0 else ""}" {"aria-current=\"page\"" if i==0 else ""}>{label}</a>' for i,label in enumerate(tab_labels[key]))
    nodes=''.join(f'<a class="cla-circuit-node" href="#" style="left:{xy[0]}%;top:{xy[1]}%;--node-color:{t[3]}"><span class="cla-circuit-node-marker">{i+1:02}</span><strong>{t[1]}</strong><small class="cla-circuit-node-name">{t[2]}</small></a>' for i,(t,xy) in enumerate(zip(names,slots)))
    mobile=''.join(f'<a href="#" style="--node-color:{t[3]}"><span class="cla-circuit-mobile-n">{i+1:02}</span><span class="cla-circuit-mobile-copy"><small>{t[1]}</small><strong>{t[2]}</strong><span>Thông tin và lựa chọn dành cho học sinh</span></span><span class="cla-circuit-mobile-arrow">↗</span></a>' for i,t in enumerate(names))
    return f'''<!doctype html><html lang="vi"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><style>
*{{box-sizing:border-box}} body{{margin:0;font-family:Arial,sans-serif;background:#f5f8ff;color:#172b4d}}.wrap{{width:calc(100% - 32px);margin:12px auto;max-width:1440px}}.student-dash .cla-circuit{{margin-top:26px}}
{style}
</style></head><body><div class="wrap student-dash"><nav class="cla-module-subnav cla-focus-nav cla-guided-workspace cla-unified-bar" data-module="{key}">
<div class="cla-unified-identity"><span class="cla-unified-identity-mark">{module[1][0]}</span><strong>{module[1]}</strong></div>
<div class="cla-module-subnav-links cla-guided-primary cla-unified-tabs">{nav}</div><div class="cla-guided-controls cla-unified-actions"><details><summary>Mục khác</summary><div class="cla-guided-more-content"><a href="#">Chức năng thêm</a></div></details></div>
</nav><section class="cla-circuit"><div class="cla-circuit-heading"><div><span class="cla-circuit-eyebrow">COGNITIVE LEARN</span><h2>Một hành trình. Sáu hệ trí tuệ.</h2><p>Chọn phân hệ phù hợp với việc bạn đang làm.</p></div></div><div class="cla-circuit-stage"><div class="cla-circuit-map"><svg class="cla-circuit-wires" viewBox="0 0 840 500" preserveAspectRatio="none"><ellipse cx="415" cy="255" rx="300" ry="171" fill="none" stroke="#9fbff0" stroke-width="3"/></svg>{nodes}</div><aside class="cla-circuit-detail"><div class="cla-circuit-detail-top"><span>PHÂN HỆ</span></div><div class="cla-circuit-detail-core" style="--node-color:{module[3]}"><h3>{module[2]}</h3><p>Điểm nhấn rõ ràng, bố cục không thay đổi.</p></div></aside></div><div class="cla-circuit-mobile">{mobile}</div><div class="cla-circuit-foot"><span>SƠ ĐỒ HỌC TẬP</span></div></section></div></body></html>'''

def luminance(rgb):
    vals=[int(v.strip()) for v in rgb[4:-1].split(',')[:3]]
    linear=[v/255/12.92 if v/255 <= .04045 else ((v/255+.055)/1.055)**2.4 for v in vals]
    return .2126*linear[0]+.7152*linear[1]+.0722*linear[2]
def contrast(a,b):
    u=sorted([luminance(a),luminance(b)])
    return (u[1]+.05)/(u[0]+.05)
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    for w,h in [(390,844),(768,850),(1024,850),(1440,900)]:
        for module in names:
            page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
            page.set_content(markup(module),wait_until='load')
            metrics=page.evaluate('''() => {
              const nav=document.querySelector('.cla-unified-bar'), active=document.querySelector('.cla-unified-tabs .is-active'),
                a=getComputedStyle(active),bar=getComputedStyle(nav);
              const nodes=[...document.querySelectorAll('.cla-circuit-node')];
              return {width:innerWidth,scroll:document.documentElement.scrollWidth,selectedFg:a.color,selectedBg:a.backgroundColor,
                selectedCount:document.querySelectorAll('.cla-unified-tabs .is-active').length,
                accent:bar.getPropertyValue('--unav-accent').trim(),navHeight:Math.round(nav.getBoundingClientRect().height),navVisible:nav.getBoundingClientRect().width>200,
                mapVisible:getComputedStyle(document.querySelector('.cla-circuit-stage')).display!=='none',
                nodeOverflow:nodes.filter(n=>{const t=n.querySelector('small');return t.scrollHeight>t.clientHeight+1||t.scrollWidth>t.clientWidth+1}).length,
                circleHeight:document.querySelector('.cla-circuit').getBoundingClientRect().height,
                mobileVisible:getComputedStyle(document.querySelector('.cla-circuit-mobile')).display!=='none'};
            }''')
            ratio=round(contrast(metrics['selectedFg'],metrics['selectedBg']),2)
            assert metrics['scroll']<=w+1, ('page overflow',module[0],w,metrics)
            assert metrics['selectedCount']==1
            assert metrics['accent'].lower()==module[3].lower(), ('per-module accent cascade', module[0], w, metrics['accent'], module[3])
            assert metrics['navVisible'] and ratio>=4.5,('contrast',module[0],w,ratio)
            assert metrics['nodeOverflow']==0,('node text clipped',module[0],w)
            assert metrics['mapVisible'] != metrics['mobileVisible']
            row={'module':module[0],'width':w,'selectedContrast':ratio,'horizontalOverflow':False,'mapVisible':metrics['mapVisible'],'nodeOverflow':0,'status':'PASS'}
            results.append(row)
            if (w,module[0]) in [(1440,'seed'),(1440,'lumen'),(390,'seed')]:
                page.screenshot(path=str(OUT/f'visual-{module[0]}-{w}.png'),full_page=True)
            page.close()
    browser.close()
(OUT/'visual-smoke.json').write_text(json.dumps({'scope':'isolated CSS only; not React E2E','total':len(results),'passed':len(results),'cases':results},indent=2,ensure_ascii=False),encoding='utf-8')
print(f'CP78 VISUAL STYLE SMOKE PASS {len(results)}/{len(results)} (standalone CSS; NOT React E2E)')
