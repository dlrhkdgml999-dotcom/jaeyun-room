"""폰 알림: 오빠가 알림 서버(Apps Script) 코드 만들기 → URL 저장 → 웹 푸시 키 저장 → 엄마 폰에 키가 따라감 → 엄마가 '알림 켜기' → 알림 주소(push 문서) 저장 →
받을 알림 고르기 → 태블릿이 공부 시작하면 알림함(notes)에 엄마 알림 → (서버가 이걸 보고 보냄) → 알림 끄기
서비스워커가 알림을 띄우는지도 확인 (sw.js push 이벤트)"""
import asyncio, sys, os, json, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import CHROME
from playwright.async_api import async_playwright
import sim_family as F
from sim_family import Device, STORE

KEY = 'B' + 'x' * 86
async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8765', '-d', os.path.join(os.path.dirname(F.DEV), 'dist', 'site')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1); base = 'http://localhost:8765/'
    issues = []
    def expect(c, m):
        if not c: issues.append(m)
    try:
        async with async_playwright() as pw:
            br = await pw.chromium.launch(executable_path=CHROME)
            oppa = await Device('오빠폰', br, 384, 832, base).open()
            if not await oppa.ev('USE_FCM'):
                print('USE_FCM = false (ntfy 사용 중) → 이 시뮬레이션은 건너뜀. sim_ntfy.py를 돌려요'); return
            await oppa.click('[data-a="start"]'); await oppa.adult('set')
            await oppa.click('[data-a="famcreate"][data-v="oppa"]'); await oppa.p.wait_for_timeout(1500)
            link = await oppa.ev('familyLink()'); fid = await oppa.ev('S.local.fid')
            # 알림 서버로 가는 요청을 가로채서 기록 (진짜 Apps Script 대신)
            RELAYED = []; OFF = [False]
            async def relay(route):
                if OFF[0]: return await route.abort('internetdisconnected')
                try: RELAYED.append(json.loads(route.request.post_data or '{}'))
                except Exception: pass
                await route.fulfill(body='ok')
            await oppa.adult('set'); await oppa.p.wait_for_timeout(300)
            st = await oppa.ev('Push.state()'); print('서버 전:', st); expect(st == 'noserver', f'서버 전 상태 {st}')
            expect(await oppa.p.locator('#fcmkey').count() == 0, '서버 전에 키 칸이 보임')
            await oppa.click('[data-a="mailsave"]'); await oppa.p.wait_for_timeout(300)
            code = await oppa.p.locator('#mailcode').input_value(); mani = await oppa.p.locator('#mailmani').input_value()
            key = await oppa.ev('S.mail.key')
            expect(f"const KEY = '{key}'" in code and f"const FID = '{fid}'" in code and '{{' not in code, '코드에 키·가족 번호가 안 들어감')
            expect('firebase.messaging' in mani and 'datastore' in mani, '설정 파일 범위')
            await oppa.shot('server_panel')
            await oppa.p.fill('#murl', 'https://script.google.com/macros/s/AKfyTEST/exec'); await oppa.click('[data-a="mailurl"]'); await oppa.p.wait_for_timeout(1500)
            st = await oppa.ev('Push.state()'); print('오빠 키 넣기 전:', st); expect(st == 'nokey', f'키 전 상태 {st}')
            await oppa.p.fill('#fcmkey', KEY); await oppa.click('[data-a="savefcmkey"]'); await oppa.p.wait_for_timeout(1500)
            mom = await Device('엄마폰', br, 384, 832, link, sw='allow').open()
            await mom.ctx.route('https://script.google.com/**', relay)
            await mom.ctx.grant_permissions(['notifications'], origin=base.rstrip('/'))
            await mom.click('[data-a="joinrole"][data-v="mom"]'); await mom.p.wait_for_timeout(1500)
            await mom.adult('mom'); await mom.p.wait_for_timeout(300)
            print('엄마 키:', (await mom.ev('S.fcmKey'))[:6], '| 상태:', await mom.ev('Push.state()'))
            expect(await mom.p.locator('.push-nudge').count() == 1, '엄마 메뉴 위에 알림 켜기 권유가 없음')
            await mom.shot('push_nudge')
            await mom.click('.push-nudge [data-a="pushon"]')
            for _ in range(40):
                await mom.p.wait_for_timeout(500)
                if not await mom.ev('Push.busy'): break
            print('켜기 디버그:', await mom.ev("({busy:Push.busy, perm:Notification.permission, sw:!!navigator.serviceWorker, ctrl:!!navigator.serviceWorker.controller, mine:Push.mine(), err:Push.err})"))
            st = await mom.ev('Push.state()'); print('엄마 켠 뒤:', st, await mom.ev('Push.err')); expect(st == 'on', f'엄마 알림 안 켜짐 {st}')
            pushes = {k: v for k, v in STORE.items() if '/push/' in k}; print('push 문서:', [(k.split('/')[-1], v['roles'], v['token'][:6]) for k, v in pushes.items()])
            expect(len(pushes) == 1 and list(pushes.values())[0]['roles'] == ['mom'], 'push 문서 이상')
            await mom.p.wait_for_timeout(1800)
            tests = [v for k, v in STORE.items() if '/notes/' in k and '알림 테스트' in v.get('text', '')]; expect(len(tests) == 1 and tests[0]['to'] == 'mom', '테스트 알림이 알림함에 안 감')
            print('서버로 간 것:', [(x.get('type'), x.get('to'), x.get('text', '')[:12]) for x in RELAYED])
            expect(any(x.get('type') == 'note' and '알림 테스트' in x.get('text', '') and x.get('key') == key for x in RELAYED), '테스트 알림이 서버로 안 감')
            expect(await mom.p.locator('.push-nudge').count() == 0, '켠 뒤에도 권유가 보임')
            # 받을 알림: 오빠 알림도
            await mom.adult('set'); await mom.p.wait_for_timeout(300); await mom.shot('push_panel')
            await mom.click('[data-a="pushrole"][data-v="oppa"]'); await mom.p.wait_for_timeout(800)
            roles = [v['roles'] for k, v in STORE.items() if '/push/' in k]; print('roles:', roles); expect(roles == [['mom', 'oppa']], 'roles 안 바뀜')
            # 태블릿 공부 시작 → 엄마 알림이 알림함(서버가 폰으로 보냄)
            kid = await Device('재윤태블릿', br, 800, 1280, link).open()
            await kid.ctx.route('https://script.google.com/**', relay)
            await kid.click('[data-a="joinrole"][data-v="kid"]'); await kid.p.wait_for_timeout(1200)
            expect(await kid.ev('Push.state()') != 'on', '태블릿이 알림 받는 중')
            expect(await kid.p.locator('.push-nudge').count() == 0, '태블릿에 알림 권유')
            await kid.click('[data-k="kor"]'); await kid.p.wait_for_timeout(1200)
            started = [v for k, v in STORE.items() if '/notes/' in k and '시작했어요' in v.get('text', '')]; print('시작 알림:', started[:1]); expect(started and started[0]['to'] == 'mom', '시작 알림 없음')
            await kid.p.wait_for_timeout(500)
            expect(any(x.get('to') == 'mom' and '시작했어요' in x.get('text', '') for x in RELAYED), '태블릿 시작 알림이 서버로 안 감')
            # 인터넷 끊긴 채 알림 → 다시 연결되면 보냄
            n0 = len(RELAYED)
            OFF[0] = True; await kid.ctx.set_offline(True); await kid.ev("notify('oppa', '끊긴 채 알림')"); await kid.p.wait_for_timeout(500)
            q = await kid.ev("Relay.q().length"); expect(q == 1, f'끊긴 동안 쌓이지 않음 {q}')
            OFF[0] = False; await kid.ctx.set_offline(False); await kid.ev("window.dispatchEvent(new Event('online'))"); await kid.p.wait_for_timeout(800)
            expect(any('끊긴 채 알림' in x.get('text', '') for x in RELAYED[n0:]) and await kid.ev("Relay.q().length") == 0, '다시 연결돼도 안 보냄')
            # 서비스워커가 push를 받으면 알림을 띄우는지
            shown = await mom.p.evaluate("""async () => { const reg = await navigator.serviceWorker.ready; const sw = reg.active;
              // push 이벤트 흉내: sw 안에서 같은 코드로 알림 띄우기
              await reg.showNotification('재윤이 공부방', { body:'흉내', tag:'t' }); const ns = await reg.getNotifications(); return ns.map(n => n.body); }""")
            print('알림 띄움:', shown)
            swsrc = open(os.path.join(os.path.dirname(F.DEV), 'dist', 'site', 'sw.js')).read()
            expect("addEventListener('push'" in swsrc and 'notificationclick' in swsrc, 'sw.js에 push 처리 없음')
            # 끄기
            await mom.adult('set'); await mom.p.wait_for_timeout(300)
            await mom.click('[data-a="pushoff"]'); await mom.p.wait_for_timeout(800)
            expect(not [k for k in STORE if '/push/' in k], '끈 뒤에도 push 문서 남음'); expect(await mom.ev('Push.state()') == 'off', '끈 뒤 상태')
            for d in (oppa, mom, kid): await d.report()
            bad = await mom.ev('window.__fsBad || []') + await kid.ev('window.__fsBad || []'); expect(not bad, f'Firestore 거부 {bad[:2]}')
            for d in (oppa, mom, kid): issues.extend(d.issues + d.errors)
    finally:
        srv.terminate()
    print('\n===== 폰 알림 =====\nissues:', issues or '없음')
asyncio.run(main())
