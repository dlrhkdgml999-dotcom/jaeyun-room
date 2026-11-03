"""11/3 오빠 질문: "가끔 재윤이가 하루 공부를 안 하고 다음 날 하면, 강의·문제가 정상 루틴으로 나와?"
60일 동안 하루씩·이틀씩·사흘씩 쉬는 날을 섞음 (쉬는 날 중 절반은 앱만 열고 아무것도 안 함) →
 · 강의: 하루 한 편, 같은 강의 두 번 안 나옴, 건너뛴 강의 없음(번호 순서대로), 쉰 다음 날 그 다음 강의가 나옴
 · 진도: 쉰 날엔 그대로, 공부한 날만 나감 / 틀린 문제 복습: 쉬어서 밀린 것도 다음 공부하는 날 나옴
 · 오류 없음"""
import asyncio, sys, random
sys.path.insert(0, '.')
from harness import Sim
from sim_month import FAST, DAY
random.seed(7)
async def main():
    async with Sim('S_쉬는날') as s:
        await s.click('[data-a="start"]'); await s.ev(FAST)
        plan = []
        while len(plan) < 60:
            r = random.random()
            plan += ['study'] if r < .6 else ['skip'] if r < .8 else ['skip', 'skip'] if r < .93 else ['skip', 'skip', 'skip']
        plan = plan[:60]
        lec = {'math': [], 'kor': []}; last_prog = None; prev_kind = None; studied = 0
        for i, kind in enumerate(plan):
            prog0 = await s.ev("JSON.stringify(['math','kor','eng'].map(x => [curr(x).unit, curr(x).lesson, curr(x).test]))")
            if kind == 'skip':
                if random.random() < .5: await s.ev("go('home')")   # 앱만 열고 끔
                prog1 = await s.ev("JSON.stringify(['math','kor','eng'].map(x => [curr(x).unit, curr(x).lesson, curr(x).test]))")
                s.expect(prog0 == prog1, f'D{i+1} 쉬는 날인데 진도가 바뀜')
            else:
                due0 = await s.ev("dueWrong().length")
                log = await s.p.evaluate(f"({DAY})(0.8)")
                studied += 1
                if log['errs']: s.issues.append((i + 1, log['errs'][:2]))
                n = sum(1 for b in log['boards'].values() if b.get('lec'))
                s.expect(n <= 1, f'D{i+1} 강의 두 편')
                if log['lec']: lec[log['lec']['s']].append(log['lec']['n'])
                if prev_kind == 'skip':
                    print(f"D{i+1:02d} 쉰 다음 날: 강의 {log['lec']} · 밀린 복습 {due0}개 · 판 {[k + ':' + str(b['n']) for k, b in log['boards'].items()]} · {log['prog']['math'][:22]} / {log['prog']['kor'][:22]}")
                done = await s.ev("day().done"); s.expect(done, f'D{i+1} 하루 공부를 다 못 끝냄')
            prev_kind = kind
            await s.ev("S.dayOffset = (S.dayOffset || 0) + 1; RUN = null; save()")
        for sub, ns in lec.items():
            gl = await s.ev(f"Object.keys(curr('{sub}').seen).map(Number).sort((a,b)=>a-b)")
            s.expect(len(ns) == len(set(ns)), f'{sub} 같은 강의 두 번 {ns}')
            s.expect(ns == sorted(ns), f'{sub} 강의 순서가 뒤바뀜 {ns}')
            # 차시에 붙은 강의 중 지금 진도 앞의 것은 다 봤는지
            missing = await s.ev(f"""(() => {{ const C = CURRS['{sub}'], c = curr('{sub}'), out = [];
              C.all.forEach(l => {{ const before = l.ui < c.unit || (l.ui === c.unit && l.li < c.lesson); if (before) (l.ebs || []).forEach(n => {{ if (!c.seen[n]) out.push(n); }}); }}); return out; }})()""")
            s.expect(not missing, f'{sub} 건너뛴 강의 {missing}')
            print(f'{sub} 강의 순서:', ns)
        rv = await s.ev("S.wrong.filter(w => w.due < todayKey()).length")
        print(f'60일 중 공부한 날 {studied}일 · 쉰 날 {60 - studied}일 · 지금 날짜보다 오래 밀린 복습 {rv}개')
asyncio.run(main())
