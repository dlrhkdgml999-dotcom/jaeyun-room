"""EBS 강의: 오늘 강의 찾기 안내, 다른 강의를 봤을 때 (2강 날 3강을 봄) → 오늘 강의는 내일 다시, 오늘은 문제로"""
import asyncio, sys
sys.path.insert(0, '.')
from harness import Sim
from sim_month import FAST, DAY

async def to_lecture(s):
    """오늘 강의 있는 과목 판을 열고 강의 안내까지"""
    k = await s.ev("(planLecture(day()) || {}).s")
    await s.click(f'[data-k="{k}"]'); await s.p.wait_for_timeout(250)
    await s.click('[data-a="begin"]'); await s.p.wait_for_timeout(300)
    return k

async def main():
    async with Sim('R_강의 고르기') as s:
        p = s.p
        await s.click('[data-a="start"]'); await p.wait_for_timeout(200)
        # 이틀 동안 강의 보며 공부 (수학 1강 · 국어 1강) → 사흘째는 수학 2강 날
        await s.ev("window.__oST = window.setTimeout"); await s.ev(FAST)
        for d in range(2):
            await s.ev(f"S.dayOffset = {d}; saveLocal(); go('home')"); log = await p.evaluate(f"({DAY})(0.95)")
            if log['errs']: s.issues.append(log['errs'][:2])
        await s.ev("window.setTimeout = window.__oST; window.__dur = 350")
        await s.ev("S.dayOffset = 2; saveLocal(); go('home')"); await p.wait_for_timeout(200)
        print('본 강의:', await s.ev("({ m:Object.keys(curr('math').seen), k:Object.keys(curr('kor').seen) })"))
        k = await to_lecture(s)
        n = await s.ev("RUN.b.cur.lec"); no = await s.ev(f"lectInfo('{k}', {n}).no")
        print('오늘 강의:', k, n, no + '강')
        g = await s.ev("""(() => { const o = document.querySelector('.eye-overlay'); return o ? { me:o.querySelector('.ebs-row.me .ebs-no').textContent, rows:[...o.querySelectorAll('.ebs-row')].map(r => r.querySelector('.ebs-no').textContent), btn:o.querySelector('[data-lecgo]').textContent, said:window.__said.slice(-1)[0] } : null; })()""")
        print('강의 안내:', g)
        s.expect(g and g['me'] == no + '강', '오늘 강의가 목록에서 짚어지지 않음')
        s.expect(g and len(g['rows']) == 3, '앞 · 뒤 강의가 같이 안 나옴')
        s.expect(g and no + '강' in g['btn'] and f"{int(no)}강" in g['said'], '버튼 · 목소리에 몇 강인지 없음')
        await p.screenshot(path='out/shots3/R_guard.png')
        await s.ev(f"(() => {{ document.querySelector('.eye-overlay').remove(); LECW = {{ s:'{k}', n:{n}, at:Date.now() - 27 * 60000, opt:false }}; go('lecwait'); }})()")
        s.expect(await p.locator('.ebs-row.me').count() == 1, '강의 보는 중 화면에 찾는 법이 없음')
        await s.click('[data-a="lecdone"]'); await p.wait_for_timeout(200)
        s.expect(await s.screen() == 'leccheck', '다 봤어요 뒤에 몇 강 봤는지 안 물음')
        opts = await s.ev("[...document.querySelectorAll('[data-a=\"lecwatched\"]')].map(b => b.dataset.v)")
        print('고르기 보기:', opts)
        s.expect(str(n + 1) in opts and str(n) in opts and '0' in opts, '보기가 이상함')
        s.expect(await p.locator('.lec-pick .ebs-row.me').count() == 0, '고르기에서 정답을 미리 알려 줌')
        await p.screenshot(path='out/shots3/R_check.png')
        # 3강을 봤다고 고름
        await s.click(f'[data-a="lecwatched"][data-v="{n + 1}"]'); await p.wait_for_timeout(300)
        st = await s.ev(f"({{ seenN:!!curr('{k}').seen[{n}], seenNext:curr('{k}').seen[{n + 1}], skip:RUN.b.lecSkip, notes:S.notes.slice(0, 2).map(x => x.to + ':' + x.text) }})")
        print('3강을 봤을 때:', st)
        s.expect(not st['seenN'] and st['seenNext'] and st['seenNext'].get('early'), '오늘 강의/본 강의 기록이 이상함')
        s.expect(st['skip'], '이번 판이 다시 강의를 요구할 수 있음')
        s.expect(any('대신' in x for x in st['notes']), '엄마에게 다른 강의 봤다는 알림이 없음')
        await p.screenshot(path='out/shots3/R_wrong.png')
        await s.click('[data-a="lecafter"]'); await p.wait_for_timeout(250)
        if await s.screen() == 'eyebreak': await s.ev("ACT.eyedone({ dataset:{ v:document.querySelector('#eyedone').dataset.v } })"); await p.wait_for_timeout(200)
        print('그다음 화면:', await s.screen())
        s.expect(await s.screen() in ('cards', 'q', 'intro'), '강의 뒤 문제로 안 감')
        # 그날 판을 끝내고 다음 날 → 같은 과목 같은 강의가 다시
        g2 = 0
        while await s.screen() == 'cards' and g2 < 8:
            g2 += 1
            if await p.locator('[data-a="cardsdone"]').count(): await s.click('[data-a="cardsdone"]')
            else: await s.click('[data-a="cardmove"][data-v="1"]')
            await p.wait_for_timeout(100)
        if await s.screen() == 'intro': await s.click('[data-a="begin"]'); await p.wait_for_timeout(150)
        while await s.screen() == 'q': await s.answer(None)
        await s.ev("S.dayOffset = 3; saveLocal(); go('home')")
        lec2 = await s.ev("planLecture(day())"); print('다음 날 강의:', lec2)
        s.expect(lec2 and lec2['s'] == k and lec2['n'] == n, '다음 날 못 본 강의가 다시 안 나옴')
        # 다음 날 제대로 보면 → 그다음은 이미 본 3강 건너뜀
        await s.ev(f"(() => {{ markLectureSeen('{k}', {n}, 28); }})()")
        nxt = await s.ev(f"(() => {{ const c = curr('{k}'); return Object.keys(c.seen).map(Number).sort((a, b) => a - b); }})()")
        print('본 강의:', nxt)
        # 잘 모르겠어요 → 오늘 강의로 치고 엄마에게 확인 알림
        await s.ev("S.dayOffset = 5; saveLocal(); go('home')")
        lec3 = await s.ev("planLecture(day())")
        if lec3:
            k3 = await to_lecture(s); n3 = await s.ev("RUN.b.cur.lec")
            await s.ev(f"(() => {{ document.querySelector('.eye-overlay').remove(); LECW = {{ s:'{k3}', n:{n3}, at:Date.now() - 27 * 60000, opt:false }}; go('lecwait'); }})()")
            await s.click('[data-a="lecdone"]'); await p.wait_for_timeout(150)
            await s.click('[data-a="lecwatched"][data-v="0"]'); await p.wait_for_timeout(200)
            ok = await s.ev(f"!!curr('{k3}').seen[{n3}]"); nt = await s.ev("S.notes[0].text"); print('잘 모르겠어요:', ok, nt)
            s.expect(ok and '모르겠' in nt, '잘 모르겠어요 처리 이상')
        # 다른 강의를 봤어요 → 오늘 강의는 안 본 걸로, 다음 날 다시
        found = False
        for off in range(6, 20):
            await s.ev(f"S.dayOffset = {off}; saveLocal(); go('home')")
            if await s.ev("planLecture(day())"): found = True; break
            await s.ev(FAST); await p.evaluate(f"({DAY})(0.95)"); await s.ev("window.setTimeout = window.__oST; window.__dur = 350")
        s.expect(found, '강의 날을 못 찾음')
        if found:
            k4 = await to_lecture(s); n4 = await s.ev("RUN.b.cur.lec")
            await s.ev(f"(() => {{ document.querySelector('.eye-overlay').remove(); LECW = {{ s:'{k4}', n:{n4}, at:Date.now() - 27 * 60000, opt:false }}; go('lecwait'); }})()")
            await s.click('[data-a="lecdone"]'); await p.wait_for_timeout(150)
            await p.screenshot(path='out/shots3/R_check2.png')
            await s.click('[data-a="lecwatched"][data-v="-1"]'); await p.wait_for_timeout(200)
            r = await s.ev(f"({{ seen:!!curr('{k4}').seen[{n4}], missed:curr('{k4}').missed, note:S.notes[0].text }})"); print('다른 강의:', r)
            s.expect(not r['seen'] and n4 in r['missed'] and '다른 강' in r['note'], '다른 강의를 봤어요 처리 이상')
        await s.overflow('강의 고르기')

asyncio.run(main())
