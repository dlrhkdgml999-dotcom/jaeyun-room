import asyncio, sys
sys.path.insert(0,'.')
from harness import Sim
from sim_month import FAST, DAY
async def main():
    async with Sim('O_캡슐·도감·순서') as s:
        p = s.p
        await s.click('[data-a="start"]'); await p.wait_for_timeout(200)
        s.expect(await p.locator('.order-pick').count() == 1, '순서 고르기가 없음'); await s.shot('home_order')
        await s.click('[data-a="pickfirst"][data-v="eng"]'); await p.wait_for_timeout(300)
        s.expect(await s.screen() == 'intro' and await s.ev("RUN.k") == 'eng', '영어부터 시작 안 됨')
        await s.ev("go('home')"); await p.wait_for_timeout(200)
        order = await s.ev("[...document.querySelectorAll('.board-card')].map(b => b.dataset.k)"); print('순서:', order)
        s.expect(order[0] == 'eng' and order[-1] == 'rev', '홈 순서가 안 바뀜')
        await s.ev(FAST)
        seen = {}
        for d in range(14):
            log = await p.evaluate(f"({DAY})(0.9)")
            if log['errs']: s.issues.append((d, log['errs']))
            if d == 0:
                await s.ev("go('alldone')"); await p.wait_for_timeout(200)
                s.expect(await p.locator('[data-a="go"][data-v="capsule"]').count() == 1, '다 끝낸 화면에 캡슐 버튼 없음')
                await s.ev("go('home')"); await p.wait_for_timeout(200)
                s.expect(await p.locator('.alarm-banner[data-v="capsule"]').count() == 1, '홈에 캡슐 안내 없음'); await s.shot('home_capsule')
            await s.ev("go('capsule')"); await p.wait_for_timeout(100)
            if d == 0: await s.shot('capsule')
            for _ in range(3): await s.ev("ACT.captap()")
            await p.wait_for_timeout(600)
            s.expect(await s.screen() == 'capsuleOpen', '캡슐이 안 열림: ' + await s.screen())
            if d == 0: await s.shot('capsule_open')
            cid = await s.ev("day().capsule.id"); seen[cid] = seen.get(cid, 0) + 1
            # 같은 날 다시 열기 시도 → 그대로
            await s.ev("go('capsule')"); await p.wait_for_timeout(100)
            s.expect(await s.ev("day().capsule.id") == cid and await s.screen() == 'capsuleOpen', '하루에 두 번 열림')
            await s.ev("S.dayOffset = (S.dayOffset || 0) + 1; RUN = null; save(); go('home')")
        tot = await s.ev("Object.values(S.collect).reduce((a, b) => a + b, 0)"); kinds = await s.ev("Object.keys(S.collect).length")
        print('캡슐', tot, '개, 서로 다른 친구', kinds)
        s.expect(tot == 14, '캡슐 수 이상')
        await s.ev("go('book')"); await p.wait_for_timeout(200)
        ids = await s.ev("[...document.querySelectorAll('.book-cell[data-a=friend]')].map(b => b.dataset.v)")
        for i in ids[:4]: await s.click(f'[data-a="friend"][data-v="{i}"]'); await p.wait_for_timeout(80)
        fr = await s.ev("S.friends"); s.expect(len(fr) == 3, f'친구 세 명 제한 이상 {fr}')
        await s.overflow('도감'); await s.shot('book')
        await s.ev("go('home')"); await p.wait_for_timeout(200); await s.shot('home_friends')
        s.expect(await p.locator('.friends span').count() == 3, '홈에 친구가 안 보임')
        # 뽑기 확률 확인 (가상)
        dist = await s.ev("(() => { const keep = S.collect; S.collect = {}; const c = {1:0,2:0,3:0}; for (let i = 0; i < 3000; i++) c[capsulePick().r]++; S.collect = keep; return c; })()")
        print('등급 분포(새 친구 기준 3000번):', dist)
asyncio.run(main())
