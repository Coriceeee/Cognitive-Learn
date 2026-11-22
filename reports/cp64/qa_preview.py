from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    for name,w,h,dark in [('desktop-light',1200,940,False),('desktop-dark',1200,940,True),('mobile-light',390,950,False)]:
        page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
        page.set_content((root/'isolated-orion.html').read_text())
        if dark: page.evaluate("document.documentElement.dataset.theme='dark'")
        page.screenshot(path=str(root/f'preview-{name}.png'),full_page=True)
        vals=page.evaluate("({body:document.documentElement.scrollWidth,viewport:window.innerWidth,panels:document.querySelectorAll('.cla-input-observatory').length,meter:document.querySelector('[role=meter]').getAttribute('aria-valuenow'),invalid:document.querySelectorAll('.is-invalid').length})")
        print(name,vals)
        assert vals['body']<=vals['viewport'],f'horizontal overflow in {name}'
        assert vals['panels']==1 and vals['meter']=='7'
        page.close()
    browser.close()
