"""오답노트 '엄마랑 같이 풀기' + 간단해진 엄마 화면 (2026-10-29)
- 재윤이가 닷새 공부(정답률 낮게) → 오답노트 → 같이 풀기: 보기 문제 맞힘 → 다음으로, 두 번 틀림 → 정답 보여 주고 다음, 숫자 문제, 엄마 판정(⭕/❌) 문제
- 맞힌 문제는 "다시 맞혔어요"로 옮겨 가고, 복습 줄(S.wrong)도 같이 바뀌는지, 끝 화면
- 엄마 탭: 바로가기 4칸, 접힌 칸, 바로가기로 펼치기, 다시 그려도 열린 채, 폰·태블릿 가로 넘침 없음, 할 일(받아쓰기 채점)이 맨 위"""
import asyncio, sys
sys.path.insert(0, '.')
from harness import Sim
from sim_month import FAST, DAY

async def main():
    async with Sim('N_오답노트같이풀기') as s:
        p = s.p
        await s.click('[data-a="start"]'); await s.ev(FAST)
        for d in range(5):
            await s.ev(f"S.dayOffset = {d - 5}; saveLocal(); go('home')")
            log = await p.evaluate(f"({DAY})(0.55)")
            if log['errs']: s.issues.append((d, log['errs'][:2]))
        await s.ev("window.setTimeout = window.__oST || window.setTimeout; S.dayOffset = 0; saveLocal(); go('home')")
        st = await s.ev("(() => { const it = notebookItems(); return { all:it.length, todo:it.filter(x => !x.fixed).length, withQ:it.filter(x => !x.fixed && nbQ(x)).length, modes:it.filter(x => !x.fixed).map(x => { const q = nbQ(x); return q ? q.input : 'none'; }) }; })()")
        print('오답노트:', {k: v for k, v in st.items() if k != 'modes'}, '| 문제 모양:', {m: st['modes'].count(m) for m in set(st['modes'])})
        s.expect(st['todo'] >= 5, f"틀린 문제가 너무 적음 {st}")
        s.expect(st['withQ'] >= st['todo'] * .6, f"같이 풀기에서 원래 문제 모양을 아는 게 적음 {st['withQ']}/{st['todo']}")
        await s.click('.home-nav [data-a="notebook"]'); await p.wait_for_timeout(200)
        s.expect(await s.ev("!!document.querySelector('[data-a=nbplay]')"), '오답노트에 같이 풀기 버튼이 없음')
        await s.click('[data-a="nbplay"]'); await p.wait_for_timeout(200)
        n = await s.ev("NBP.items.length"); print('같이 풀기 문제 수:', n)
        s.expect(await s.screen() == 'nbplay' and n > 0, '같이 풀기가 안 열림')
        await s.shot('play_first')
        results = []
        for i in range(n):
            await p.wait_for_timeout(100)
            mode = await s.ev("NBP.mode"); want = i % 3   # 0 맞힘, 1 두 번 틀림, 2 한 번 틀리고 맞힘
            if mode == 'choice':
                ans, opts = await s.ev("String(NBP.q.ans)"), await s.ev("NBP.q.opts.map(String)")
                wrong = [k for k, o in enumerate(opts) if o != ans]
                if want == 1 and len(wrong) >= 2:
                    await p.locator('[data-a="nbans"]').nth(wrong[0]).click(); await p.wait_for_timeout(80)
                    s.expect(await s.ev("NBP.i") == i, '보기 문제를 한 번 틀렸는데 바로 넘어감')
                    await p.locator('[data-a="nbans"]').nth(wrong[1]).click(); exp = False
                elif want == 2 and wrong:
                    await p.locator('[data-a="nbans"]').nth(wrong[0]).click(); await p.wait_for_timeout(80)
                    await p.locator('[data-a="nbans"]').nth(opts.index(ans)).click(); exp = True
                else: await p.locator('[data-a="nbans"]').nth(opts.index(ans)).click(); exp = True
            elif mode == 'numpad':
                ans = await s.ev("String(Number(NBP.q.ans))")
                if want == 1:
                    for t in range(2):
                        for ch in str(int(ans) + 1): await p.locator(f'[data-a="nbnum"][data-v="{ch}"]').click()
                        await p.locator('[data-a="nbnum"][data-v="ok"]').click(); await p.wait_for_timeout(60)
                    exp = False
                else:
                    for ch in ans: await p.locator(f'[data-a="nbnum"][data-v="{ch}"]').click()
                    await p.locator('[data-a="nbnum"][data-v="ok"]').click(); exp = True
            else:
                await s.click('[data-a="nbreveal"]'); await p.wait_for_timeout(60)
                s.expect(await s.ev("!!document.querySelector('.nb-a')"), '엄마 판정 문제에서 정답이 안 보임')
                exp = want != 1
                await s.click(f'[data-a="nbjudge"][data-v="{1 if exp else 0}"]')
            results.append((mode, exp))
            await p.wait_for_timeout(2400)   # 다음 문제로 저절로
            s.expect(await s.ev("NBP && NBP.i") == i + 1 or i == n - 1, f'{i + 1}번째 문제 뒤에 다음으로 안 넘어감')
        end = await s.ev("({screen:SCREEN, text:document.querySelector('h2') && document.querySelector('h2').textContent, right:NBP.right})")
        print('결과:', results, '| 끝 화면:', end)
        s.expect(end['right'] == sum(1 for _, e in results if e), f"맞힌 수가 다름 {end}")
        await s.shot('play_end')
        after = await s.ev("(() => { const it = notebookItems(); return { todo:it.filter(x => !x.fixed).length, fixed:it.filter(x => x.fixed).length, nb:(day().nb || []).length }; })()")
        print('같이 푼 뒤:', after, '(전 다시 풀 문제', st['todo'], ')')
        s.expect(after['todo'] == st['todo'] - end['right'] and after['fixed'] == end['right'], f"같이 풀어서 맞힌 문제가 오답노트에서 안 없어짐 {after}")
        await s.click('[data-a="nbdone"]'); await p.wait_for_timeout(150)
        cards = await s.ev("document.querySelectorAll('.nb-card').length"); shown = await s.ev("VIEWS.notebook.list.length")
        s.expect(await s.ev("VIEWS.notebook.list.every(x => !x.fixed)"), '오답노트에 같이 풀어서 맞힌 문제가 남아 있음')
        await s.ev("go('notebook')")
        s.expect(after['nb'] == n, '같이 푼 기록이 그날 기록에 다 안 남음')
        s.expect(await s.screen() == 'notebook', '끝나고 오답노트로 안 돌아감')
        # ---------- 엄마 화면 ----------
        for (w, h, tag) in [(384, 832, 'phone'), (1280, 800, 'tab')]:
            await p.set_viewport_size({'width': w, 'height': h})
            await s.adult('mom'); await p.wait_for_timeout(250)
            m = await s.ev("""(() => ({ quick:document.querySelectorAll('.mom-quick .mq').length, folds:[...document.querySelectorAll('details.mom-fold')].map(d => d.dataset.k + (d.open ? '+' : '')),
              panelsOpen:[...document.querySelectorAll('.screen > .panel')].map(x => (x.querySelector('h3')||x).textContent.trim().slice(0, 12)), height:document.documentElement.scrollHeight }))()""")
            print(f'[{tag}] 엄마 탭:', m)
            s.expect(m['quick'] == 4, '엄마 탭 바로가기 4칸이 아님')
            s.expect(set(['notes', 'report', 'curr', 'set']) <= set(x.rstrip('+') for x in m['folds']), f"접힌 칸이 모자람 {m['folds']}")
            await s.overflow(f'엄마 탭 {tag}'); await s.shot(f'mom_{tag}')
            await s.click('.mq[data-v="report"]'); await p.wait_for_timeout(300)
            s.expect(await s.ev("document.querySelector('details.mom-fold[data-k=report]').open"), '주간 리포트 바로가기가 칸을 안 펼침')
            await s.click('details.mom-fold[data-k="set"] > summary'); await p.wait_for_timeout(100)
            await s.ev("refreshIfIdle()"); await p.wait_for_timeout(100)
            s.expect(await s.ev("document.querySelector('details.mom-fold[data-k=set]').open && document.querySelector('details.mom-fold[data-k=report]').open"), '화면을 다시 그리니 열어 둔 칸이 닫힘')
            s.expect(await s.ev("!!document.querySelector('#al1')") , '공부 설정 칸 안에 알림 시간이 없음')
            await s.overflow(f'엄마 탭 펼침 {tag}'); await s.shot(f'mom_open_{tag}')
            await s.ev("document.querySelectorAll('details.mom-fold').forEach(d => d.open = false)"); await p.wait_for_timeout(50)

asyncio.run(main())
