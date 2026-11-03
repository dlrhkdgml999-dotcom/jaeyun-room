"""2026-11-04 재미 더하기 (fun.js) — 한 기기
A) 게임처럼: 한 번에 맞히면 당근·콤보(🔥 n연속), 틀리면 콤보 0, 진행 막대 당근, 판 끝 보상 화면에 최고 콤보·당근·물뿌리개
B) 단원 평가 = 당근 탑 보스전: 탑·체력 막대가 맞힐 때마다 줄어듦
C) 매일 깜짝 이벤트: 60일 동안 이틀 연속 같은 이벤트 없음·6가지 다 나옴 / 스티커 2배 / 숨은 황금 당근 3개 → 보너스 / 콤보 5연속 보너스 / 단비 물 2배 / 친구 방문
D) 토리 텃밭: 심기 → 물 주기(물뿌리개 줄어듦) → 수확 → 바구니 → 토리에게 주기, 새 씨앗 열림, 당근 20개 → 황금 씨앗 → 도감 친구
E) 깜짝 응원: 오빠가 남긴 응원이 판 끝 보상 화면에 가끔 나옴
F) 화면 넘침 (폰)"""
import asyncio, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Sim

async def answer_right(s):
    q = await s.ev("({input:RUN.q.input, opts:RUN.q.opts, ans:RUN.q.ans, tiles:RUN.q.tiles})")
    await s.ev(f"answer({json.dumps(q['ans'], ensure_ascii=False)})")
    await s.p.wait_for_timeout(1300)

async def open_board(s, k):
    await s.ev("go('home')"); await s.click(f'[data-k="{k}"]'); await s.p.wait_for_timeout(200); await s.click('[data-a="begin"]'); await s.p.wait_for_timeout(200)
    await s.through_lecture()

async def main():
    async with Sim('F_재미') as s:
        p = s.p
        await s.click('[data-a="start"]'); await p.wait_for_timeout(200)
        await s.ev("S.ebsOn = { math:false, kor:false }; delete day().lec; save(); go('home')")   # 강의 날은 판이 5문제라 콤보를 못 봄 → 강의 끔
        # ---------- C) 이벤트 달력 ----------
        await s.ev("window.__ev = null")
        evs = await s.ev("Array.from({ length:60 }, (_, i) => dayEvent(addDays('2026-11-04', i)).id)")
        same = [i for i in range(1, 60) if evs[i] == evs[i - 1]]
        print('60일 이벤트:', {e: evs.count(e) for e in set(evs)})
        s.expect(not same, f'이틀 연속 같은 이벤트 {same[:3]}')
        s.expect(len(set(evs)) >= 5, f'이벤트 종류가 적음 {set(evs)}')   # 친구 방문은 도감 친구가 없으면 스티커 2배로 바뀜
        # ---------- A) 콤보 · 당근 ----------
        await s.ev("window.__ev = 'combo'")
        await s.ev("go('home')"); await p.wait_for_timeout(100)
        s.expect(await p.locator('.ev-banner').count() == 1 and '콤보' in await p.locator('.ev-banner').inner_text(), '첫 화면 이벤트 알림 없음')
        s.expect(await p.locator('.garden-tile').count() == 1, '첫 화면 텃밭 칸 없음')
        await open_board(s, 'math')
        s.expect(await s.screen() == 'q', f'수학 판이 문제로 안 감 {await s.screen()}')
        n = await s.ev("RUN.b.qs.length"); marks = await p.locator('.track .cmark').count()
        s.expect(marks == n - 1, f'진행 막대 당근 {marks} (남은 문제 {n - 1})')
        st0 = await s.ev("S.stickers.length")
        for i in range(5):
            await answer_right(s)
        c = await s.ev("({combo:RUN.b.combo, max:RUN.b.maxCombo, car:RUN.b.carrots, c5:!!(day().ev||{}).combo5})")
        print('5개 맞힌 뒤:', c, '| 콤보 칩:', await p.locator('.combo-chip').count())
        s.expect(c['combo'] == 5 and c['car'] == 5 and c['c5'], f'콤보·당근 이상 {c}')
        s.expect(await s.ev("S.stickers.length") == st0 + 1, '콤보 5연속 보너스 스티커 없음')
        s.expect(await p.locator('.combo-chip.hot').count() == 1, '5연속 콤보 칩이 안 보임')
        await s.shot('fun_combo')
        # 틀리면 콤보 0
        q = await s.ev("({opts:RUN.q.opts, ans:RUN.q.ans, input:RUN.q.input})")
        wrong = (int(q['ans']) + 1) if q['input'] == 'numpad' else next((o for o in (q['opts'] or []) if str(o) != str(q['ans'])), None)
        if wrong is not None:
            await s.ev(f"answer({json.dumps(wrong, ensure_ascii=False)})"); await p.wait_for_timeout(200)
            s.expect(await s.ev("RUN.b.combo") == 0, '틀렸는데 콤보가 그대로')
            await answer_right(s)
        while await s.screen() == 'q': await answer_right(s)
        if await s.screen() == 'write': await s.click('[data-a="writeskip"]'); await p.wait_for_timeout(200)
        s.expect(await s.screen() == 'reward', f'보상 화면 아님 {await s.screen()}')
        rw = await p.locator('section.reward').inner_text()
        print('보상 화면:', rw.replace('\n', ' ')[:160])
        s.expect('연속' in rw and '당근' in rw and '물뿌리개' in rw, '보상 화면에 콤보·당근·물뿌리개 없음')
        g = await s.ev("({cans:S.garden.cans, car:S.garden.carrots})"); print('텃밭:', g)
        s.expect(g['cans'] == 1 and g['car'] >= 5, f'판 끝 물뿌리개·당근 이상 {g}')
        # ---------- C) 스티커 2배 · 단비 ----------
        await s.ev("window.__ev = 'double'"); st0 = await s.ev("S.stickers.length")
        await open_board(s, 'kor')
        while await s.screen() == 'q': await answer_right(s)
        if await s.screen() == 'write': await s.click('[data-a="writeskip"]'); await p.wait_for_timeout(200)
        s.expect(await s.ev("S.stickers.length") == st0 + 2, '스티커 2배 날인데 스티커가 2개가 아님')
        s.expect('2배' in await p.locator('section.reward').inner_text(), '보상 화면에 2배 안내 없음')
        await s.ev("window.__ev = 'rain'"); c0 = await s.ev("S.garden.cans")
        await open_board(s, 'eng')
        while await s.screen() == 'q': await answer_right(s)
        await s.dictation(photo=False)
        s.expect(await s.ev("S.garden.cans") == c0 + 2, f'단비 날 물뿌리개 2배 아님 {c0} → {await s.ev("S.garden.cans")}')
        # ---------- C) 숨은 황금 당근 ----------
        await s.ev("window.__ev = 'hunt'"); st0 = await s.ev("S.stickers.length")
        await s.ev("S.dayOffset = (S.dayOffset||0) + 1; RUN = null; save()")
        for k in ['kor', 'math', 'rev']:
            await open_board(s, k); guard = 0
            while await s.screen() == 'q' and guard < 40:
                guard += 1
                if await p.locator('.hunt-carrot').count(): await p.locator('.hunt-carrot').first.click(force=True); await p.wait_for_timeout(150)
                await answer_right(s)
            if await s.screen() == 'write': await s.click('[data-a="writeskip"]'); await p.wait_for_timeout(200)
        found = await s.ev("(day().ev||{}).found || 0")
        print('황금 당근 찾음:', found, '(판 3개에서)'); s.expect(found >= 3, f'하루에 황금 당근 3개를 다 못 찾음 ({found})')
        # 한 판에서 못 다 찾았으면 다른 날 판으로 더 (하루 4판이면 다 찾을 수 있어야 함): 숨는 확률 직접 확인
        prob = await s.ev("(() => { let tmp = null; if (!document.querySelector('.fun-row')) { tmp = document.createElement('div'); tmp.className = 'fun-row'; document.body.appendChild(tmp); } const e = funDay(); const keep = [e.found, e.huntSeen]; let n = 0; e.found = 0; for (let i = 0; i < 400; i++) { e.huntSeen = 5 + i % 40; document.querySelectorAll('.hunt-carrot').forEach(x => x.remove()); funHuntMaybe(RUN.b || {}); if (document.querySelector('.hunt-carrot')) n++; } document.querySelectorAll('.hunt-carrot').forEach(x => x.remove()); [e.found, e.huntSeen] = keep; if (tmp) tmp.remove(); return n / 400; })()")
        print('숨는 확률(문제마다):', round(prob, 2)); s.expect(.15 < prob < .6, f'황금 당근이 너무 드물거나 잦음 {prob}')
        if found >= 3: s.expect(await s.ev("S.stickers.filter(x => x.bonus === 'hunt').length") == 1, '황금 당근 3개 보너스 없음')
        # ---------- C) 친구 방문 ----------
        await s.ev("S.collect = { c05:1 }; window.__ev = 'friend'; go('home')"); await p.wait_for_timeout(100)
        s.expect('도토리' in await p.locator('.ev-banner').inner_text(), '친구 방문 날인데 첫 화면에 친구가 없음')
        # ---------- D) 텃밭 ----------
        await s.ev("window.__ev = null; S.garden.cans = 12; S.garden.carrots = 20; save(); go('garden')"); await p.wait_for_timeout(150)
        await s.overflow('텃밭 화면')
        await s.click('[data-a="plot"][data-v="0"]'); await p.wait_for_timeout(100)
        s.expect(await p.locator('[data-a="plant"]').count() >= 1, '빈 밭을 눌렀는데 씨앗 고르기가 안 나옴')
        await s.click('[data-a="plant"][data-v="carrot"]'); await p.wait_for_timeout(100)
        for _ in range(3): await s.click('[data-a="plot"][data-v="0"]'); await p.wait_for_timeout(120)
        s.expect(await s.ev("plotStage(S.garden.plots[0])") == 'ready', '물 3번 줬는데 당근이 안 자람')
        s.expect(await s.ev("S.garden.cans") == 9, '물뿌리개가 안 줄어듦')
        await s.click('[data-a="plot"][data-v="0"]'); await p.wait_for_timeout(150)
        s.expect(await s.ev("S.garden.basket.carrot") == 1 and await s.ev("S.garden.plots[0]") is None, '수확이 안 됨')
        await s.click('[data-a="feed"][data-v="carrot"]'); await p.wait_for_timeout(150)
        s.expect(await s.ev("S.garden.fed") == 1 and await s.ev("S.garden.basket.carrot") == 0, '토리에게 주기가 안 됨')
        # 두 번째 수확 → 딸기 씨앗 열림
        await s.ev("S.garden.plots[1] = { s:'carrot', w:3, at:todayKey() }; save(); VIEWS.garden()"); await s.click('[data-a="plot"][data-v="1"]'); await p.wait_for_timeout(120)
        await s.click('[data-a="plot"][data-v="1"]'); await p.wait_for_timeout(120)
        s.expect(await p.locator('[data-a="plant"][data-v="straw"]').count() == 1, '수확 2번 뒤 딸기 씨앗이 안 열림')
        await s.click('[data-a="plantcancel"]')
        # 황금 씨앗 → 도감 친구
        own0 = await s.ev("Object.keys(S.collect).length")
        await s.click('[data-a="goldseed"]'); await p.wait_for_timeout(120)
        s.expect(await s.ev("S.garden.gold") == 1 and await s.ev("S.garden.carrots") == 0, '황금 씨앗 바꾸기 안 됨')
        await s.click('[data-a="plot"][data-v="2"]'); await s.click('[data-a="plant"][data-v="gold"]'); await p.wait_for_timeout(100)
        await s.ev("S.garden.cans = 6; save(); VIEWS.garden()")
        for _ in range(6): await s.click('[data-a="plot"][data-v="2"]'); await p.wait_for_timeout(80)
        await s.click('[data-a="plot"][data-v="2"]'); await p.wait_for_timeout(150)
        s.expect(await s.ev("Object.keys(S.collect).length") == own0 + 1, '황금 씨앗 수확했는데 도감 친구가 안 늘어남')
        await s.shot('fun_garden')
        # ---------- E) 깜짝 응원 ----------
        await s.adult('oppa')
        await p.fill('#cheertxt_oppa', '재윤아 받아쓰기 연습한 거 다 봤어!'); await s.click('[data-a="cheertext"][data-v="oppa"]'); await p.wait_for_timeout(150)
        s.expect(await s.ev("cheerList().length") == 1, '응원 글이 저장 안 됨')
        await s.overflow('오빠 탭 (응원·문제)')
        seen = 0
        for i in range(8):
            await s.ev("go('home'); S.dayOffset = (S.dayOffset||0) + 1; RUN = null; save()")
            await open_board(s, 'math')
            while await s.screen() == 'q': await answer_right(s)
            if await s.screen() == 'write': await s.click('[data-a="writeskip"]'); await p.wait_for_timeout(200)
            if await p.locator('.cheer-box').count(): seen += 1
        print('깜짝 응원 나온 판:', seen, '/ 8'); s.expect(seen >= 1, f'깜짝 응원이 한 번도 안 나옴 ({seen}/8)')
        ratio = await s.ev("(() => { let n = 0; for (let i = 0; i < 400; i++) if (cheerPick()) n++; return n / 400; })()")
        print('깜짝 응원 확률(400번 뽑기):', ratio); s.expect(.4 < ratio < .7, f'깜짝 응원 확률 이상 {ratio}')
        # ---------- 넘침 (폰) ----------
        await s.ev("go('home')"); await p.wait_for_timeout(100); await s.overflow('첫 화면'); await s.shot('fun_home')
        await s.ev("window.__ev = 'combo'"); await open_board(s, 'kor'); await s.overflow('문제 화면')
        # 보스전
        await s.ev("(() => { const c = curr('math'); c.test = true; go('home'); })()")
        await s.ev("S.dayOffset = (S.dayOffset||0) + 1; RUN = null; save(); go('home')")
        await open_board(s, 'math')
        if await s.screen() == 'q':
            s.expect(await p.locator('.boss').count() == 1, '단원 평가인데 당근 탑이 안 보임')
            hp0 = await s.ev("RUN.b.boss || 0"); await answer_right(s)
            s.expect(await s.ev("RUN.b.boss") == hp0 + 2, '한 번에 맞혔는데 탑이 두 칸 안 무너짐')
            await s.overflow('보스전'); await s.shot('fun_boss')
            while await s.screen() == 'q': await answer_right(s)
            if await s.screen() == 'write': await s.click('[data-a="writeskip"]'); await p.wait_for_timeout(200)
            s.expect('탑' in await p.locator('section.reward').inner_text(), '단원 평가 보상 화면에 당근 탑 결과 없음')
        else: s.issues.append(f'단원 평가 판이 문제로 안 감 {await s.screen()}')
asyncio.run(main())
