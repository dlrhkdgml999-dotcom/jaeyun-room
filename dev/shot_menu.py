"""엄마·오빠 메뉴 캡처 (11/5): 가족 연결 → 태블릿 이틀 공부 + 문제 하나 내기 → 오빠 폰·엄마 폰 탭마다 전체 화면 캡처, 화면 높이 출력
사용: python3 shot_menu.py [이름]   → dev/out/shots3/menu_[이름]_*.png"""
import asyncio, sys, os, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import CHROME
from playwright.async_api import async_playwright
from sim_sync import Device, DEV

TAG = sys.argv[1] if len(sys.argv) > 1 else 'now'

async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8797', '-d', os.path.join(os.path.dirname(DEV), 'dist', 'site')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1); base = 'http://localhost:8797/'
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path=CHROME)
        oppa = await Device('오빠폰', br, base).open()
        await oppa.click('[data-a="start"]'); await oppa.adult('set')
        await oppa.click('[data-a="famcreate"][data-v="oppa"]'); await oppa.p.wait_for_timeout(1500)
        link = await oppa.ev("familyLink()")
        tab = await Device('태블릿', br, link, 1280, 800).open(); tab.accept_dialog = True
        await tab.click('[data-a="joinrole"][data-v="kid"]'); await tab.p.wait_for_timeout(1500)
        mom = await Device('엄마폰', br, link).open(); await mom.click('[data-a="joinrole"][data-v="mom"]'); await mom.p.wait_for_timeout(1500)
        for off in (-1, 0): await tab.study_day(off)
        await tab.ev("go('kq')"); await tab.p.wait_for_timeout(200)
        await tab.click('[data-a="kqtype"][data-v="riddle"]'); await tab.p.wait_for_timeout(150)
        await tab.p.fill('#kqText', '나는 밤에만 반짝여요. 나는 누구일까요?'); await tab.p.fill('#kqAns', '별')
        await tab.click('[data-a="kqsend"]'); await asyncio.sleep(3)
        for d, tabs in ((oppa, ('oppa', 'mom', 'set')), (mom, ('mom', 'set'))):
            for t in tabs:
                await d.ev(f"S.adultTab = '{t}'; go('adult')"); await d.p.wait_for_timeout(400)
                h = await d.ev("document.documentElement.scrollHeight")
                heads = await d.ev("[...document.querySelectorAll('section.adult h3, section.adult summary, section.adult .mq b, section.adult .install-tile')].map(x => x.innerText.split('\\n')[0].slice(0, 30))")
                print(f'[{d.name} {t}] 높이 {h}px ({h / 832:.1f}화면)'); print('   ', ' | '.join(heads))
                await d.p.screenshot(path=f'{DEV}/out/shots3/menu_{TAG}_{d.name}_{t}.png', full_page=True)
        for d in (oppa, tab, mom): await d.report()
        await br.close()
    srv.terminate()
asyncio.run(main())
