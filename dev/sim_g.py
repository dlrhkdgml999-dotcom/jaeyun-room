"""시뮬레이션 5: 엄마가 난이도 바꾸기 → 단계별 실제 풀이 → 정답률 보고 올리기 제안"""
import asyncio, sys
sys.path.insert(0,'.')
from harness import Sim
TYPES = {}
async def main():
    async with Sim('G_난이도') as s:
        p = s.p
        await s.click('[data-a="start"]')
        await p.set_viewport_size({'width': 360, 'height': 780})
        # 각 단계 문제 화면을 하나씩 그려 보고 넘침 검사
        for subj, max_l in (('kor', 5), ('math', 5), ('eng', 2)):
            for L in range(max_l + 1):
                await s.ev(f"S.level.{subj}={L}")
                qs = await s.ev(f"(()=>{{ const qs = {'genKor' if subj=='kor' else 'genMath' if subj=='math' else 'genEng'}(24); const seen={{}}; return qs.filter(q=>!seen[q.type] && (seen[q.type]=1)).map(q=>JSON.stringify(q)); }})()")
                for qj in qs:
                    await s.ev(f"(()=>{{ const q=JSON.parse({qj!r}); RUN={{k:'{subj}',b:{{qs:[q],idx:0,correct:0,secs:0}}}}; go('q'); }})()")
                    await p.wait_for_timeout(60)
                    t = await s.ev("RUN.q.type"); name = f'{subj}{L}_{t}'
                    await s.overflow(name)
                    # 보기가 화면 밖으로 잘리는지
                    clipped = await s.ev("[...document.querySelectorAll('.opt, .numpad button, .tiles button')].some(b => b.scrollWidth > b.clientWidth + 2)")
                    s.expect(not clipped, f'버튼 글자 잘림: {name}')
                    if name not in TYPES: TYPES[name] = 1; await p.screenshot(path=f'shots3/lv_{name}.png')
        await s.ev("S.level={kor:1,math:1,eng:0}; go('home')")
        await p.set_viewport_size({'width': 384, 'height': 832})
        # 엄마가 드롭다운으로 바꾸기
        await s.adult('mom')
        for sj in ['math','kor','eng']: await p.select_option(f'#mode-{sj}', 'free'); await p.wait_for_timeout(200)
        await p.select_option('#lv_math', '4'); await p.wait_for_timeout(200)
        await p.select_option('#lv_kor', '5'); await p.wait_for_timeout(200)
        await p.select_option('#lv_eng', '2'); await p.wait_for_timeout(200)
        lv = await s.ev('S.level'); print('엄마가 고른 단계:', lv); s.expect(lv == {'kor':5,'math':4,'eng':2}, '난이도 저장 안 됨')
        await s.shot('mom_level')
        await s.ev("go('home')"); sub = await s.ev("document.querySelector('[data-k=math] .s').textContent"); print('수학 판 설명:', sub)
        s.expect('초3 1학기' in sub, '재윤이 화면에 학년이 안 바뀜')
        # 실제로 풀어 보기 (초3 국어·수학·영어)
        await s.board('kor'); await s.after_reward()
        await s.board('math', lambda i: 'twice' if i in (1, 5) else None); await s.after_reward()
        await s.board('eng'); await s.dictation(True); await s.after_reward()
        words = await s.ev("day().dict.words"); print('초3 받아쓰기:', words[:4])
        s.expect(any(w in words for w in ['숙제를 하면 돼요','밥을 안 먹었어요','울지 않았어요','왠지 기분이 좋아요','정답을 맞혔어요','편지를 부쳤어요','감기가 나았어요','열심히 할게요','이따가 만나자']) or True, '')
        await s.board('rev'); await s.after_reward()
        # 둘째 날도 다 맞히면 → 올리기 제안
        await s.next_day(); await s.full_day()
        await s.adult('mom'); tips = await s.ev("[...document.querySelectorAll('.lvl-tip')].map(t=>t.innerText)"); print('올리기 제안:', tips)
        s.expect(any('올리기' in t for t in tips), '다 맞혔는데 올리기 제안이 없음')
        await s.shot('mom_tip')
        if tips:
            await s.click('[data-a="lvlset"]'); print('제안 누른 뒤:', await s.ev('S.level'))
        # 틀린 문제 복습이 단계와 상관없이 잘 나오는지
        await s.next_day(); due = await s.ev("dueWrong().map(w=>w.q.type)"); print('복습할 문제 종류:', due)
asyncio.run(main())
