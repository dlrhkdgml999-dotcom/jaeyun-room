import os
"""시뮬레이션 2: 많이 틀리는 재윤이 — 3일 동안 절반 가까이 틀리고, 복습·받아쓰기 다시 쓰기가 제대로 도는지"""
import asyncio, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Sim
random.seed(7)
def pattern(i):
    r = random.random()
    return 'twice' if r < .3 else 'once' if r < .5 else None

async def main():
    async with Sim('B_많이틀림') as s:
        await s.click('[data-a="start"]')
        prev_wrong = 0
        for dnum in (1, 2, 3):
            if dnum > 1:
                await s.next_day()
                due = await s.ev("dueWrong().length"); dict_due = await s.ev("(()=>{const t=todayKey();return S.wrong.filter(w=>w.subj==='dict'&&w.due<=t).map(w=>w.q.w)})()")
                print(f'{dnum}일차 시작: 복습할 문제 {due}개, 다시 쓸 받아쓰기 {dict_due}')
                s.expect(due > 0, f'{dnum}일차인데 복습할 문제가 없음')
                if await s.p.locator('[data-a="kidnote"]').count():
                    note = await s.ev("S.kidNotes[0].text"); print('  엄마 채점 소식:', note); await s.click('[data-a="kidnote"]')
            for k in ['kor', 'math']:
                await s.board(k, pattern); await s.after_reward()
            await s.board('eng', pattern)
            if dnum > 1:
                words = await s.ev("day().dict.words")
                s.expect(all(w in words for w in dict_due), f'틀린 받아쓰기가 다시 안 나옴: {dict_due} / {words}')
            await s.dictation(photo=(dnum != 2)); await s.after_reward()
            await s.click('[data-k="rev"]'); await s.p.wait_for_timeout(200)
            rq = await s.ev("RUN.b.qs.filter(q=>q.rev).length"); n = await s.ev("RUN.b.qs.length")
            keys = await s.ev("RUN.b.qs.map(q=>q.key)")
            s.expect(len(keys) == len(set(keys)), f'{dnum}일차 복습에 같은 문제가 두 번 나옴')
            print(f'  {dnum}일차 복습판: {n}문제 중 전에 틀린 문제 {rq}개')
            await s.shot(f'rev_intro_d{dnum}')
            await s.ev("go('home')")
            await s.board('rev', pattern); await s.after_reward()
            await s.adult('mom'); await s.shot(f'mom_d{dnum}'); await s.grade_all(wrong_idx=(1, 4, 8)); await s.ev("go('home')")
            w = await s.ev("({total:S.wrong.length, dict:S.wrong.filter(x=>x.subj==='dict').length, maxMiss:Math.max(0,...S.wrong.map(x=>x.misses)), dupIds:S.wrong.length-new Set(S.wrong.map(x=>x.id)).size})")
            print(f'  {dnum}일차 끝 오답 목록:', w)
            s.expect(w['dupIds'] == 0, '오답 목록에 같은 문제가 겹쳐 들어감')
        await s.adult('oppa'); await s.shot('oppa'); await s.overflow('oppa')
        top = await s.ev("[...document.querySelectorAll('.panel')].find(p=>p.textContent.includes('자주 틀리는')).innerText")
        print('오빠 화면 자주 틀리는 문제:\n', top)
        stats = await s.ev("[...document.querySelectorAll('.stat')].map(x=>x.innerText.replace('\\n',' '))"); print('7일 통계:', stats)
        await s.adult('mom'); await s.shot('mom_last')
        notes = await s.ev("S.notes.slice(0,6).map(n=>n.to+': '+n.text)"); print('최근 알림:', *notes, sep='\n  ')
        b = await s.ev("JSON.stringify(S).length"); print('저장 크기', b)

asyncio.run(main())
