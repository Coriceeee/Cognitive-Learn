from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for name,width,height,dark in [('atlas-desktop-light',1200,880,False),('atlas-desktop-dark',1200,880,True),('atlas-mobile',390,860,False),('lumen-desktop-light',1200,900,False),('lumen-desktop-dark',1200,900,True),('lumen-mobile',390,940,False)]:
        module=name.split('-')[0]
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        page.set_content((root/f'isolated-{module}.html').read_text())
        if dark: page.evaluate("document.documentElement.dataset.theme='dark'")
        page.screenshot(path=str(root/f'preview-{name}.png'),full_page=True)
        metrics=page.evaluate("""({body:document.documentElement.scrollWidth,viewport:window.innerWidth,links:document.querySelectorAll('main a[href]').length,bodyHeight:document.body.scrollHeight,steps:document.querySelectorAll('.cla-atlas-journey-step,.cla-lumen-journey-link').length})""")
        print(name,metrics)
        assert metrics['body'] <= metrics['viewport'],f'overflow in {name}: {metrics}'
        assert metrics['steps'] == 4
        assert metrics['links'] >= 5
        page.close()
    browser.close()
