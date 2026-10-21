import os
"""시뮬레이션 1: 잘하는 재윤이 — 3일 연속 다 맞히기 + 다시 듣기 버튼 확인"""
import asyncio, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Sim

async def main():
    async with Sim('A_잘하는날') as s:
        await s.click('[data-a="start"]'); await s.p.wait_for_timeout(200)
        await s.shot('home_day1'); await s.overflow('home')
        greet = await s.ev("$('#heroBubble').textContent"); print('인사 1일차:', greet)
        # 토리 쓰다듬기
        await s.click('[data-a="poke"]'); await s.p.wait_for_timeout(100)
        poke = await s.ev("$('#heroBubble').textContent"); s.expect(poke != greet, '토리 쓰다듬어도 말이 안 바뀜')

        # ---- 다시 듣기 확인: 듣기 문제가 나올 때까지 국어를 풀면서 확인
        await s.click('[data-k="kor"]'); await s.p.wait_for_timeout(200); await s.click('[data-a="begin"]'); await s.p.wait_for_timeout(100)
        checked = 0
        while await s.screen() == 'q':
            q = await s.ev('({listen:RUN.q.listen||"", say:RUN.q.say||"", type:RUN.q.type})')
            if q['listen'] and checked < 2:
                await s.ev('window.__said=[]; window.__dur=1500; void sayQuestion(RUN.q)')  # 안내 읽기 시작
                await s.p.wait_for_timeout(300)                                          # 안내 읽는 중간에
                await s.ev("document.querySelector('.q-head [data-a=replay]').click()")  # 노란 버튼
                await s.p.wait_for_timeout(3500); await s.ev('window.__dur=350')
                said = await s.ev('window.__said')
                print(' 듣기 문제', q['type'], '읽은 순서:', said)
                s.expect(said.count(q['say']) == 1, f'다시 듣기 때 안내를 또 읽음: {said}')
                s.expect(said[-1] == q['listen'], f'다시 듣기 마지막이 낱말이 아님: {said}')
                s.expect(said.count(q['listen']) == 1, f'낱말이 겹쳐서 두 번 읽힘: {said}')
                checked += 1
            await s.answer(None)
        s.expect(checked >= 1, '듣기 문제를 못 만나서 다시 듣기 확인 못 함')
        await s.after_reward()
        await s.board('math'); await s.after_reward()
        await s.board('eng'); await s.dictation(True); await s.after_reward()
        await s.board('rev')
        await s.p.wait_for_timeout(300); await s.p.locator('.btn.big').last.click(); await s.p.wait_for_timeout(300)
        await s.shot('alldone_day1')
        s.expect(await s.screen() == 'alldone', '마지막 판 뒤 칭찬 화면으로 안 감')
        await s.click('[data-a="home"]')
        await s.adult('mom'); await s.grade_all(()); await s.ev("go('home')")
        await s.shot('home_day1_done')
        # 2, 3일차
        for dnum in (2, 3):
            await s.next_day()
            g = await s.ev("$('#heroBubble').textContent"); print(f'인사 {dnum}일차:', g)
            if dnum == 3: s.expect('연속' in g, f'3일째 연속 인사가 안 나옴: {g}')
            if await s.p.locator('[data-a="kidnote"]').count(): await s.click('[data-a="kidnote"]')
            await s.full_day()
            await s.adult('mom'); await s.grade_all(()); await s.ev("go('home')")
        st = await s.ev("({gift:giftDays().length, goal:S.gift.goal, stickers:S.stickers.length, wrong:S.wrong.length, counts:['kor','math','eng','rev'].map(countFor), streak:streakDays(), friend:friendDays(), bytes:JSON.stringify(S).length})")
        print('3일 뒤 상태:', st)
        s.expect(st['gift'] == 3, f"선물 칸이 3이 아님: {st['gift']}")
        s.expect(st['wrong'] == 0, '다 맞혔는데 오답이 남음')
        await s.ev("go('gift')"); await s.p.wait_for_timeout(200); await s.shot('gift'); await s.overflow('gift')
        await s.ev("go('home')"); await s.shot('home_day3')
        await s.adult('oppa'); await s.shot('oppa'); await s.overflow('oppa')

asyncio.run(main())
