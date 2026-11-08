"""2026-11-04 재윤이가 오빠에게 문제 내기 — 태블릿(재윤이) · 오빠 폰 · 엄마 폰
A) 계산 문제: 숫자 고르기 → 뺄셈에서 작은 수 − 큰 수 막기 → 재윤이가 먼저 정답(한 번 틀리고 다시) → 보내기
B) 그림 퀴즈: 펜으로 그리기 → 정답·힌트 → 보내기 (그림이 서버에 1MB 아래로)
C) 수수께끼: 글 → 보내기
D) 오빠 폰: 풀 문제 3개·그림 보임 → 계산 맞힘, 그림 틀림, 수수께끼는 엄마 폰에서 맞힘 → 서버 kqa
E) 태블릿: 첫 화면 "재윤이 승" 알림 → 내가 낸 문제 상태(맞혔어/재윤이 승) · 점수 1 : 2
F) 인터넷 끊긴 채 낸 문제 → 연결되면 저절로 / 오빠 알림함 · 오퀴즈 날 보너스 스티커 / Firestore가 거부한 값 없음
H) 11/5 "재윤이가 문제 냈는데 안 왔어": 태블릿 저장 공간이 꽉 참 + kq 문서 보내기가 막힘 → 그래도 오빠 폰에 문제가 보이고(그날 기록 d.kq) 답할 수 있음,
   오빠 폰 맨 위에 "못 보낸 문제 내기 n개", 막힘이 풀리면 저절로 서버 kq까지 / 서버가 답을 안 하는(fetch가 끝없이 기다리는) 태블릿도 25초(시험에선 0.6초) 뒤 SDK로 감"""
import asyncio, sys, os, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import CHROME
from playwright.async_api import async_playwright
from sim_sync import Device, STORE, DEV

def docs(fid, coll): return {k.split('/')[-1]: v for k, v in STORE.items() if k.startswith(f'families/{fid}/{coll}/')}

async def calc(tab, a, b, op, wrong_first):
    await tab.click('[data-a="kqtype"][data-v="calc"]'); await tab.p.wait_for_timeout(150)
    for ch in str(a): await tab.click(f'.kq-pad [data-v="{ch}"]')
    await tab.click('[data-a="kqfocus"][data-v="b"]')
    for ch in str(b): await tab.click(f'.kq-pad [data-v="{ch}"]')
    if op == '-': await tab.click('[data-a="kqop"]')
    await tab.click('.kq-pad [data-v="ok"]'); await tab.p.wait_for_timeout(150)

async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8771', '-d', os.path.join(os.path.dirname(DEV), 'dist', 'site')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1); base = 'http://localhost:8771/'
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path=CHROME)
        oppa = await Device('오빠폰', br, base).open()
        await oppa.click('[data-a="start"]'); await oppa.adult('set')
        await oppa.click('[data-a="famcreate"][data-v="oppa"]'); await oppa.p.wait_for_timeout(1500)
        link, fid = await oppa.ev("familyLink()"), await oppa.ev('S.local.fid')
        tab = await Device('태블릿', br, link, 1280, 800).open(); tab.accept_dialog = True
        await tab.click('[data-a="joinrole"][data-v="kid"]'); await tab.p.wait_for_timeout(1500)
        mom = await Device('엄마폰', br, link).open(); await mom.click('[data-a="joinrole"][data-v="mom"]'); await mom.p.wait_for_timeout(1500)
        await tab.ev("window.__ev = 'quiz'; go('home')"); await tab.p.wait_for_timeout(200)
        # 11/9 문제 내기는 놀이터 안 (한 판 끝내야 열림 → 판 하나를 끝낸 걸로)
        await tab.ev("(() => { const d = day(); d.boards.rev = d.boards.rev || makeBoard('rev'); d.boards.rev.done = true; save(); go('home'); })()"); await tab.p.wait_for_timeout(150)
        tab.expect(await tab.p.locator('.play-tile').is_visible(), '첫 화면에 놀이터가 없음')
        await tab.click('.play-tile'); await tab.p.wait_for_timeout(200)
        await tab.click('.play-card.c-kq'); await tab.p.wait_for_timeout(200)
        tab.expect(await tab.screen() == 'kq', '문제 내기 화면이 안 열림')
        await tab.overflow('문제 내기 첫 화면 (태블릿)')
        # A) 뺄셈 작은 수 − 큰 수 → 막힘
        await calc(tab, 5, 12, '-', False)
        tab.expect(await tab.ev("KQP.step") == 'make', '작은 수에서 큰 수를 빼는 문제가 통과됨')
        await tab.click('[data-a="kqop"]'); await tab.click('.kq-pad [data-v="ok"]'); await tab.p.wait_for_timeout(150)   # 덧셈으로 바꿔서 5 + 12
        s0 = await tab.ev("S.stickers.length")
        for ch in '18': await tab.click(f'.kq-pad [data-v="{ch}"]')
        await tab.click('.kq-pad [data-v="ok"]'); await tab.p.wait_for_timeout(150)
        tab.expect(await tab.ev("KQP.step") == 'check' and not await tab.ev("!!KQP.sent"), '틀린 정답인데 보내짐')
        for ch in '17': await tab.click(f'.kq-pad [data-v="{ch}"]')
        await tab.click('.kq-pad [data-v="ok"]'); await tab.p.wait_for_timeout(600)
        tab.expect(await tab.ev("!!KQP.sent"), '정답을 맞혔는데 안 보내짐')
        tab.expect(await tab.ev("S.stickers.length") == s0 + 1, '오빠 퀴즈 날인데 보너스 스티커 없음')
        # B) 그림 퀴즈
        await tab.click('[data-a="kqnew"]'); await tab.click('[data-a="kqtype"][data-v="draw"]'); await tab.p.wait_for_timeout(250)
        await tab.click('[data-a="kqdrawn"]'); tab.expect(await tab.ev("KQP.step") == 'draw', '안 그렸는데 넘어감')
        bx = await tab.p.locator('#pen').bounding_box()
        await tab.p.mouse.move(bx['x'] + 60, bx['y'] + 60); await tab.p.mouse.down()
        for i in range(20): await tab.p.mouse.move(bx['x'] + 60 + i * 15, bx['y'] + 60 + (i % 5) * 20)
        await tab.p.mouse.up()
        await tab.click('[data-a="kqdrawn"]'); await tab.p.wait_for_timeout(200)
        await tab.p.fill('#kqAns', '토끼'); await tab.p.fill('#kqHint', '귀가 길어요')
        await tab.click('[data-a="kqsend"]'); await tab.p.wait_for_timeout(600)
        # C) 수수께끼 (인터넷 끊긴 채)
        await tab.ev("localStorage.setItem('__mockOffline', '1')")
        await tab.click('[data-a="kqnew"]'); await tab.click('[data-a="kqtype"][data-v="riddle"]'); await tab.p.wait_for_timeout(150)
        await tab.p.fill('#kqText', '나는 밤에만 반짝여요. 나는 누구일까요?'); await tab.p.fill('#kqAns', '별')
        await tab.click('[data-a="kqsend"]'); await tab.p.wait_for_timeout(800)
        q_off = await tab.ev("kqQueue().length"); print('끊긴 채 낸 문제 기기에 모음:', q_off); tab.expect(q_off == 1, '끊긴 채 낸 문제가 기기에 안 모임')
        await tab.ev("localStorage.removeItem('__mockOffline'); window.dispatchEvent(new Event('online'))"); await asyncio.sleep(3)
        kq = docs(fid, 'kq'); print('서버 kq:', [(v['type'], v['ans']) for v in kq.values()], '그림 크기', [len(v.get('img', '')) for v in kq.values()])
        tab.expect(len(kq) == 3 and await tab.ev("kqQueue().length") == 0, f'서버에 문제 3개가 안 감 ({len(kq)})')
        tab.expect(all(len(v.get('img', '')) < 900000 for v in kq.values()), '그림이 너무 큼')
        await tab.shot('kq_list')
        # D) 오빠 폰
        await asyncio.sleep(1); await oppa.adult_tab('oppa'); await asyncio.sleep(.5); await oppa.adult_tab('oppa')
        todo = await oppa.p.locator('.kq-item').count(); print('오빠 폰 풀 문제:', todo)
        oppa.expect(todo == 3, f'오빠 폰 풀 문제 {todo}')
        oppa.expect(await oppa.p.locator('.kq-item img').count() == 1, '오빠 폰에 재윤이 그림이 안 보임')
        notes = await oppa.ev("S.notes.filter(n => n.to === 'oppa' && /문제를 냈어요/.test(n.text)).length"); oppa.expect(notes >= 3, f'오빠 알림함 문제 알림 {notes}')
        await oppa.overflow('오빠 탭 문제 풀기'); await oppa.shot('kq_oppa')
        ids = await oppa.ev("Object.fromEntries(kqAll().map(x => [x.type, x.id]))")
        await oppa.p.fill(f'#kqg_{ids["calc"]}', '17'); await oppa.click(f'[data-a="kqguess"][data-id="{ids["calc"]}"]'); await oppa.p.wait_for_timeout(300)
        await oppa.p.fill(f'#kqg_{ids["draw"]}', '고양이'); await oppa.p.fill(f'#kqm_{ids["draw"]}', '어렵다! 재윤이 그림 최고'); await oppa.click(f'[data-a="kqguess"][data-id="{ids["draw"]}"]'); await oppa.p.wait_for_timeout(300)
        await mom.adult('mom'); await asyncio.sleep(.5); await mom.adult('mom')
        mom.expect(await mom.p.locator(f'#kqg_{ids["riddle"]}').count() == 1, '엄마 폰에 풀 문제가 안 보임')
        await mom.p.fill(f'#kqg_{ids["riddle"]}', ' 별 '); await mom.click(f'[data-a="kqguess"][data-id="{ids["riddle"]}"]'); await mom.p.wait_for_timeout(300)
        await asyncio.sleep(1.5)
        kqa = docs(fid, 'kqa'); print('서버 kqa:', {k: (v['guess'], v['right'], v['by']) for k, v in kqa.items()})
        oppa.expect(len(kqa) == 3 and kqa[ids['calc']]['right'] and not kqa[ids['draw']]['right'] and kqa[ids['riddle']]['right'] and kqa[ids['riddle']]['by'] == 'mom', 'kqa 결과 이상')
        # E) 태블릿
        # 11/4 오후: 첫 화면 알림은 하나만 → 공부 알림 시간이 지났는데 아직 시작 안 했으면 "공부할 시간"이 먼저라 결과 알림이 그 뒤로 감
        #   (오후 4시 넘어 돌리면 그래서 실패했음) → 여기서는 공부 알림을 꺼 두고 결과 알림만 본다
        await tab.ev("S.alarms.on = S.alarms.on.map(() => false); go('home')"); await tab.p.wait_for_timeout(300)
        ban = await tab.p.locator('[data-a="kqseen"]').count()
        other = await tab.ev("[...document.querySelectorAll('.alarm-banner')].map(x => x.dataset.a + ' ' + x.innerText)")
        print('첫 화면 알림:', ban, other); tab.expect(ban == 1, f'첫 화면에 결과 알림이 없음 (대신: {other})')
        if ban:
            tab.expect('재윤이 승' in await tab.p.locator('[data-a="kqseen"]').inner_text(), '알림에 "재윤이 승"이 없음')
            await tab.click('[data-a="kqseen"]'); await tab.p.wait_for_timeout(300)
        body = await tab.p.locator('section.kq').inner_text()
        tab.expect('재윤이 승' in body and '맞혔어' in body and '엄마가 맞혔어' in body and '재윤이 그림 최고' in body, '내가 낸 문제 결과가 안 보임')
        sc = await tab.ev("kqScore()"); print('점수:', sc); tab.expect(sc == {'kid': 1, 'op': 2}, f'점수 이상 {sc}')
        await tab.ev("go('home')"); await tab.p.wait_for_timeout(150)
        tab.expect(await tab.p.locator('[data-a="kqseen"]').count() == 0, '본 결과 알림이 계속 뜸')
        await tab.shot('kq_home')
        # G) 11/4: 30일 선물은 재윤이가 직접 적고 고치기 → 오빠 폰에 보이고 알림
        await tab.ev("go('gift')"); await tab.p.wait_for_timeout(200)
        await tab.click('[data-a="giftwish"]'); await tab.p.fill('#giftWishIn', '토끼 인형'); await tab.click('[data-a="giftwishsave"]'); await tab.p.wait_for_timeout(300)
        await tab.click('[data-a="giftwish"]'); await tab.p.fill('#giftWishIn', '색연필 세트'); await tab.click('[data-a="giftwishsave"]'); await asyncio.sleep(2)
        tab.expect('색연필 세트' in await tab.p.locator('.gift-card').inner_text(), '고친 선물이 재윤이 화면에 안 보임')
        await tab.ev("go('home')"); await tab.p.wait_for_timeout(150)
        tab.expect('색연필 세트' in await tab.p.locator('.gift-card').inner_text(), '첫 화면 선물 칸에 선물 이름이 없음')
        await oppa.adult_tab('oppa'); await asyncio.sleep(.5)
        g = await oppa.ev("({ name:S.gift.name, by:S.gift.wishBy, n:S.notes.filter(n => n.to === 'oppa' && /선물로/.test(n.text)).length, field:(document.querySelector('#gname')||{}).value })"); print('오빠 폰 선물:', g)
        oppa.expect(g['name'] == '색연필 세트' and g['by'] == 'kid' and g['field'] == '색연필 세트', '재윤이가 적은 선물이 오빠 폰에 안 옴')
        oppa.expect(g['n'] >= 2, '재윤이가 선물을 적었는데 오빠 알림이 없음')
        # H) 저장 공간 꽉 참 + kq 문서 막힘
        await tab.ev(r"""(() => { window.__oSet = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v){ if (k === 'jaeyun-kqq') throw new DOMException('full', 'QuotaExceededError'); return window.__oSet.call(this, k, v); };
          window.__oW = Sync.write.bind(Sync); Sync.write = (path, data) => /\/kq\//.test(path) ? Promise.reject(new Error('시험: kq 막힘')) : window.__oW(path, data); return 1; })()""")
        await tab.ev("KQP = null; go('kq')"); await tab.p.wait_for_timeout(150)
        await calc(tab, 30, 4, '+', False)
        for ch in '34': await tab.click(f'.kq-pad [data-v="{ch}"]')
        await tab.click('.kq-pad [data-v="ok"]'); await tab.p.wait_for_timeout(500)
        hid = await tab.ev("(kqQueue().find(x => x.a === 30) || {}).id || ''"); print('H 막힌 문제(메모리 큐):', hid)
        tab.expect(hid, 'H: 저장 공간이 꽉 차니 낸 문제가 사라짐')
        await tab.ev("Sync.beat && (Sync.beatAt = 0, Sync.beat())"); await asyncio.sleep(2.5)
        await oppa.adult_tab('oppa'); await asyncio.sleep(.5); await oppa.adult_tab('oppa')
        seen = await oppa.p.locator(f'#kqg_{hid}').count(); al = await oppa.ev("(document.querySelector('.sync-alert')||{}).textContent || ''")
        print('H 오빠 폰: 문제 보임', seen, '| 맨 위:', al[-80:])
        oppa.expect(seen == 1, 'H: kq 문서가 막히니 오빠 폰에 문제가 안 보임 (그날 기록으로 와야 함)')
        oppa.expect('못 보낸 문제 내기 1개' in al, 'H: 오빠 폰 맨 위에 못 보낸 문제 수가 없음')
        await oppa.p.fill(f'#kqg_{hid}', '34'); await oppa.click(f'[data-a="kqguess"][data-id="{hid}"]'); await asyncio.sleep(1.5)
        oppa.expect(hid in docs(fid, 'kqa'), 'H: 그날 기록으로 온 문제에 답이 서버로 안 감')
        tab.expect(await tab.ev(f"!!kqAns('{hid}')"), 'H: 오빠 답이 태블릿에 안 옴')
        # 풀림 → 저절로 (앱 다시 보기)
        await tab.ev("Storage.prototype.setItem = window.__oSet; Sync.write = window.__oW; document.dispatchEvent(new Event('visibilitychange'))"); await asyncio.sleep(2)
        tab.expect(hid in docs(fid, 'kq') and await tab.ev("kqQueue().length") == 0, 'H: 막힘이 풀렸는데 kq 문서가 안 감')
        # 서버가 답을 안 함 (fetch 끝없이) → 짧게 끊고 SDK로
        await tab.ev(r"""(() => { window.__restWait = 600; window.__oF = window.fetch; window.fetch = (u, o) => /firestore\.googleapis/.test(String(u)) ? new Promise((res, rej) => o && o.signal && o.signal.addEventListener('abort', () => rej(new DOMException('a', 'AbortError')))) : window.__oF(u, o); return 1; })()""")
        await tab.ev("KQP = null; go('kq')"); await tab.click('[data-a="kqtype"][data-v="riddle"]'); await tab.p.wait_for_timeout(150)
        await tab.p.fill('#kqText', '귀가 길고 깡충깡충 뛰어요'); await tab.p.fill('#kqAns', '토끼'); await tab.click('[data-a="kqsend"]'); await asyncio.sleep(3)
        via = await tab.ev("Sync.via"); n2 = [v for v in docs(fid, 'kq').values() if v.get('ans') == '토끼' and v.get('type') == 'riddle']
        print('H fetch 멈춤 →', via, len(n2)); tab.expect(n2 and via == 'sdk', 'H: fetch가 멈추니 문제가 안 감')
        await tab.ev("window.fetch = window.__oF")
        for d in (oppa, tab, mom): await d.report()
        await br.close()
    srv.terminate()
asyncio.run(main())
