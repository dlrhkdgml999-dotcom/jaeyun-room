"""폰 알림 (ntfy): 세 기기가 같은 알림 이름(토픽)을 계산하는지, 엄마 폰 맨 위 3단계 안내·연결 링크,
태블릿이 공부를 시작하면 엄마 토픽으로 보내는지, 인터넷 끊김 → 다시 보냄, 오빠가 알림 끄면 안 보냄"""
import asyncio, sys, os, json, subprocess, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import CHROME
from playwright.async_api import async_playwright
import sim_family as F
from sim_family import Device, STORE

async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8765', '-d', os.path.join(os.path.dirname(F.DEV), 'dist', 'site')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1); base = 'http://localhost:8765/'
    issues = []
    def expect(c, m):
        if not c: issues.append(m)
    SENT = []; OFF = [False]
    async def ntfy(route):
        if OFF[0]: return await route.abort('internetdisconnected')
        req = route.request
        if req.method == 'OPTIONS': return await route.fulfill(status=204, headers={'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST'})
        try: SENT.append(json.loads(req.post_data or '{}'))
        except Exception: SENT.append({'bad': req.post_data})
        await route.fulfill(status=200, body='{"id":"x"}', headers={'access-control-allow-origin': '*', 'content-type': 'application/json'})
    try:
        async with async_playwright() as pw:
            br = await pw.chromium.launch(executable_path=CHROME)
            oppa = await Device('오빠폰', br, 384, 832, base).open(); await oppa.ctx.route('https://ntfy.sh/**', ntfy)
            await oppa.click('[data-a="start"]'); await oppa.adult('set')
            await oppa.click('[data-a="famcreate"][data-v="oppa"]'); await oppa.p.wait_for_timeout(1500)
            link = await oppa.ev('familyLink()')
            mom = await Device('엄마폰', br, 384, 832, link).open(); await mom.ctx.route('https://ntfy.sh/**', ntfy)
            await mom.click('[data-a="joinrole"][data-v="mom"]'); await mom.p.wait_for_timeout(1200)
            kid = await Device('재윤태블릿', br, 800, 1280, link).open(); await kid.ctx.route('https://ntfy.sh/**', ntfy)
            await kid.click('[data-a="joinrole"][data-v="kid"]'); await kid.p.wait_for_timeout(1200)
            # 1) 같은 토픽
            tops = [await d.ev("[ntfyTopic('mom'), ntfyTopic('oppa')]") for d in (oppa, mom, kid)]
            print('토픽:', tops[0])
            expect(tops[0] == tops[1] == tops[2] and tops[0][0] != tops[0][1] and all(t.startswith('jaeyun-') and len(t) >= 24 for t in tops[0]), f'토픽 이상 {tops}')
            # 2) 엄마 폰 맨 위 3단계
            await mom.adult('mom'); await mom.p.wait_for_timeout(300)
            expect(await mom.p.locator('.push-nudge .ntfy-steps li').count() == 3, '엄마 폰에 3단계 안내 없음')
            href = await mom.p.locator('.push-nudge [data-a="ntfylink"]').get_attribute('href'); print('연결 링크:', href)
            expect(href.startswith(f'ntfy://ntfy.sh/{tops[0][0]}?display=') and '재윤이 공부방' in urllib.parse.unquote(href), '연결 링크 이상')
            expect('io.heckel.ntfy' in (await mom.p.locator('.push-nudge a[href*="play.google.com"]').get_attribute('href')), '설치 링크 이상')
            await mom.shot('ntfy_nudge')
            # 시험 알림 (엄마 폰에서)
            await mom.click('.push-nudge [data-a="ntfytest"]'); await mom.p.wait_for_timeout(800)
            t = [x for x in SENT if '시험' in x.get('message', '')]; print('시험:', t[:1])
            expect(t and t[0]['topic'] == tops[0][0] and t[0]['click'].startswith('https://dlrhkdgml999-dotcom.github.io/jaeyun-room'), '시험 알림이 엄마 토픽으로 안 감')
            await mom.click('.push-nudge [data-a="ntfyok"]'); await mom.p.wait_for_timeout(300)
            expect(await mom.p.locator('.push-nudge').count() == 0, '연결 후에도 안내가 보임')
            # 3) 태블릿 공부 시작 → 엄마 토픽
            n0 = len(SENT)
            expect(await kid.p.locator('.push-nudge').count() == 0, '태블릿에 알림 안내')
            await kid.click('[data-k="kor"]'); await kid.p.wait_for_timeout(1200)
            got = [x for x in SENT[n0:] if '시작했어요' in x.get('message', '')]; print('시작:', got[:1])
            expect(got and got[0]['topic'] == tops[0][0] and got[0]['title'] == '재윤이 공부방', '태블릿 시작 알림이 안 감')
            # 4) 끊김 → 다시
            n0 = len(SENT); OFF[0] = True; await kid.ctx.set_offline(True)
            await kid.ev("notify('oppa', '끊긴 채 알림')"); await kid.p.wait_for_timeout(500)
            expect(await kid.ev('Ntfy.q().length') == 1, '끊긴 동안 안 쌓임')
            OFF[0] = False; await kid.ctx.set_offline(False); await kid.ev("window.dispatchEvent(new Event('online'))"); await kid.p.wait_for_timeout(800)
            expect(any(x.get('topic') == tops[0][1] and '끊긴' in x.get('message', '') for x in SENT[n0:]) and await kid.ev('Ntfy.q().length') == 0, '다시 연결돼도 안 보냄')
            # 5) 오빠가 끄면 태블릿도 안 보냄
            await oppa.adult('set'); await oppa.p.wait_for_timeout(300); await oppa.shot('ntfy_panel')
            await oppa.click('[data-a="ntfytoggle"]'); await asyncio.sleep(2.5)
            expect(await kid.ev('S.ntfyOff') is True, '끄기가 태블릿에 안 옴')
            n0 = len(SENT); await kid.ev("notify('mom', '꺼진 뒤 알림')"); await kid.p.wait_for_timeout(500)
            expect(len(SENT) == n0, '끈 뒤에도 보냄')
            bad = [x for x in SENT if 'bad' in x]; expect(not bad, f'JSON 아닌 요청 {bad[:1]}')
            for d in (oppa, mom, kid): await d.report(); issues.extend(d.issues + d.errors)
    finally:
        srv.terminate()
    print('\n===== 폰 알림 (ntfy) =====\nissues:', issues or '없음')
if __name__ == '__main__': asyncio.run(main())
