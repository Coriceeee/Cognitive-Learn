from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parent
html=(root/'preview-isolated.html').read_text()
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    for name,width,height,dark in [('desktop-light',1160,890,False),('desktop-dark',1160,890,True),('mobile-light',390,900,False),('mobile-dark',390,900,True)]:
        page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
        page.set_content(html)
        if dark:page.evaluate("document.documentElement.dataset.theme='dark'")
        result=page.evaluate("""() => ({viewport:window.innerWidth,scrollWidth:document.documentElement.scrollWidth,states:document.querySelectorAll('.cla-module-state').length,alerts:document.querySelectorAll('[role=alert]').length,statuses:document.querySelectorAll('[role=status]').length})""")
        assert result['scrollWidth']<=result['viewport'],(name,result)
        assert result['states']==6,(name,result)
        assert result['alerts']==1,(name,result)
        assert result['statuses']==5,(name,result)
        page.screenshot(path=str(root/f'preview-{name}.png'),full_page=True)
        print(name,result)
        page.close()
    browser.close()
