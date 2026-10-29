"""2026-10-29: 태블릿과 오빠 폰이 다른 가족방에 들어가 있던 사고
방 A = 오빠 폰(+ 10/24까지 재윤이 태블릿), 방 B = 태블릿이 혼자 새로 만든 방(오빠로) → 태블릿에서 B에서 재윤이로 바꿈
→ 오빠 폰 가족 링크(A)를 태블릿에서 열고 "재윤이" → 태블릿 기록이 지워지지 않고 A로, 오빠 폰에 그대로 보이는지, 가족방 번호가 같아지는지"""
import asyncio, sys, os, json, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import CHROME
from playwright.async_api import async_playwright
from sim_sync import Device, STORE, days_on_server, DEV

async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8769', '-d', os.path.join(os.path.dirname(DEV), 'dist', 'site')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1); base = 'http://localhost:8769/'
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path=CHROME)
        oppa = await Device('오빠폰', br, base).open()
        await oppa.click('[data-a="start"]'); await oppa.adult('set')
        await oppa.click('[data-a="famcreate"][data-v="oppa"]'); await oppa.p.wait_for_timeout(1500)
        linkA, fidA = await oppa.ev("familyLink()"), await oppa.ev('S.local.fid')
        tab = await Device('태블릿', br, linkA, 1280, 800).open(); tab.accept_dialog = True
        await tab.click('[data-a="joinrole"][data-v="kid"]'); await tab.p.wait_for_timeout(1500)
        await tab.study_day(-6); await asyncio.sleep(1.5)
        # 10/24: 태블릿이 연결 끊기고 새 방 B를 "오빠"로 만듦 → 거기서 공부 → 재윤이로 바꿈
        await tab.ev("Sync.leave()"); await tab.adult('set'); await tab.click('[data-a="famcreate"][data-v="oppa"]'); await tab.p.wait_for_timeout(2000)
        fidB = await tab.ev('S.local.fid'); print('방 A', fidA[-4:], '| 방 B', fidB[-4:])
        await tab.ev("window.__forceTablet = true")
        for off in (-3, -2, -1): await tab.study_day(off)
        await tab.ev("go('home')"); await tab.click('[data-a="tokid"]'); await tab.p.wait_for_timeout(2500)
        local = await tab.ev("({role:role(), st:S.stickers.length, days:Object.keys(S.days).filter(k => Object.values(S.days[k].boards||{}).some(b => b&&b.done)).sort(), math:currLabel('math')})")
        print('B에서 재윤이로:', local, '| 방 A 서버 days:', days_on_server(fidA))
        await oppa.adult_tab('oppa'); a = await oppa.alert(); print('오빠 폰(방 A):', a[:110])
        oppa.expect(fidA[-4:].upper() in a or '가족방' in a or '마지막 연결' in a, '오빠 폰 경고에 방 번호 안내가 없음')
        # 해결: 오빠 폰 링크(A)를 태블릿에서 연다
        await tab.p.goto(linkA); await tab.p.wait_for_timeout(1200)
        tab.expect(await tab.ev('SCREEN') == 'join', '다른 방 링크를 열었는데 역할 고르기가 안 나옴')
        await tab.click('[data-a="joinrole"][data-v="kid"]'); await tab.p.wait_for_timeout(3000)
        after = await tab.ev("({fid:S.local.fid, role:role(), st:S.stickers.length, math:currLabel('math')})")
        print('A로 옮긴 뒤 태블릿:', after)
        tab.expect(after['fid'] == fidA and after['role'] == 'kid' and after['st'] == local['st'] and after['math'] == local['math'], f'방을 옮기면서 태블릿 기록이 달라짐 {local} → {after}')
        await asyncio.sleep(2)
        srvA = days_on_server(fidA); print('방 A 서버 days:', srvA)
        tab.expect(set(local['days']) <= set(srvA), '태블릿 공부한 날이 방 A로 다 안 옴')
        got = await oppa.ev("({st:S.stickers.length, done:Object.keys(S.days).filter(k => Object.values(S.days[k].boards||{}).some(b => b&&b.done)).length, math:currLabel('math')})")
        print('오빠 폰:', got)
        oppa.expect(got['st'] == local['st'] and got['done'] >= len(local['days']) and got['math'] == local['math'], '오빠 폰에 태블릿 기록이 안 보임')
        await tab.ev("Sync.beat(true)"); await asyncio.sleep(1)
        a = await oppa.alert(); print('오빠 폰 이제:', a[:60]); oppa.expect('✓' in a, '옮긴 뒤 오빠 폰에 연결 ✓가 안 뜸')
        await tab.adult_tab('set'); code = await tab.ev("(document.querySelector('.fam-code')||{}).textContent"); await oppa.adult_tab('set'); code2 = await oppa.ev("(document.querySelector('.fam-code')||{}).textContent")
        print('가족방 번호 태블릿/폰:', code, code2); tab.expect(code and code == code2, '두 기기 가족방 번호가 다르게 보임')
        for d in (oppa, tab): await d.report()
        await br.close()
    srv.terminate()

asyncio.run(main())
