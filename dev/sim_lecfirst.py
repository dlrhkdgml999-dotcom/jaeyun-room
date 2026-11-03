"""11/3 오빠 "어제 재윤이가 국어 영상 보기 눌렀는데 영상이 더 없대 → 문제만 풀었대" 재현 · 검증
- 어제 국어 강의를 봤고 오늘 수학·국어 둘 다 새 강의가 필요할 때 재윤이가 국어 판을 먼저 열면:
  예전 → 오늘 강의는 번갈아 순서로 수학에 미리 정해져 있어서 국어는 "지난 시간 다지기 · 새 강의는 내일"
  지금 → 먼저 연 국어가 오늘 강의를 가져감, 수학이 "지난 시간 다지기"(어느 과목 강의 날인지 글로 보임)
- 하루 한 편은 그대로, 한 과목이 강의를 3일 연속 독차지하지 않음
- 매일 국어부터 여는 재윤이 30일: 수학 진도도 멈추지 않고 나감
- 11/4: 최근 강의 날 6번 중 국어가 더 많으면 국어가 못 가져감(번갈아) → 국어·수학 강의 수 차이 작게, 강의 없는 과목은 "연습 + 미리 맛보기"(새 문제)"""
import asyncio, sys, re
sys.path.insert(0, '.')
from harness import Sim
from sim_month import FAST

DAY = re.search(r'DAY = r"""(.*?)"""', open('sim_lecday.py').read(), re.S).group(1)
DAY = DAY.replace("const order = ['kor','math','eng','rev'].sort(() => rnd() - .5);", "const order = window.__order || ['kor','math','eng','rev'];")
DAY = DAY.replace("const other = rnd() < .15;", "const other = false;")

PROBE = r"""(k) => ({ sub: boardSub(k), lec: day().lec ? Object.assign({}, day().lec) : null })"""

async def main():
    async with Sim('L_먼저연과목강의') as s:
        await s.click('[data-a="start"]'); await s.ev(FAST)
        days = 30; kor_lec = math_lec = 0; streak = []; issues = []
        math_start = await s.ev("currLabel('math')")
        for d in range(days):
            await s.ev(f"S.dayOffset = {d - days}; saveLocal(); go('home')")
            before = {k: await s.p.evaluate(f"({PROBE})('{k}')") for k in ('kor', 'math')}
            need = await s.ev("[!!dueLecture('kor'), !!dueLecture('math')]")
            recent = await s.ev("recentLecSubjs(6)")
            await s.ev("window.__order = ['kor','math','eng','rev']")
            log = await s.p.evaluate(f"({DAY})(0.95)")
            if log['errs']: issues.append((d, log['errs'][:2]))
            lecs = [x for x in log['lecs'] if not x.startswith('opt:')]
            subj = lecs[0][:4].rstrip('0123456789') if lecs else '-'
            if subj == 'kor' and need[1]: kor_lec += 1
            if subj == 'math' and need[0]: math_lec += 1   # 둘 다 강의가 필요했던 날만 세어 공평한지 봄
            streak.append(subj + ('' if need[1] else '*'))   # *: 그날 수학은 볼 강의가 없었음(단원 평가 등) → 국어가 보는 게 맞음
            # 국어가 강의가 필요하고, 최근 강의 날에 국어가 수학보다 많지 않으면 → 국어가 먼저 열었으니 국어 강의
            if need[0] and recent.count('kor') < recent.count('math'):
                if subj != 'kor': issues.append((d, f'국어 먼저 열었는데 국어 강의 아님: {lecs}, 첫 화면 {before["kor"]["sub"]}'))
                if '미리 맛보기' in before['kor']['sub']: issues.append((d, '첫 화면 국어 칸이 "새 강의는 내일"'))
            if len(lecs) > 1 or log['watched'] > 1: issues.append((d, f'강의 두 편 {lecs}'))
            print(f"D{d+1:02d} 필요(국,수)={need} 앞={recent} 국어칸='{before['kor']['sub'][:26]}' 수학칸='{before['math']['sub'][:26]}' → 강의 {lecs or '-'} | {log['prog'][0][:20]} / {log['prog'][1][:20]}")
        runs = re.findall(r'(kor(?:,kor)+)', ','.join(x for x in streak if x != '-' and not x.endswith('*')))   # 수학도 강의가 필요했던 날만
        print('국어 강의', kor_lec, '수학 강의', math_lec, '| 연속:', max((r.count('kor') for r in runs), default=1))
        s.expect(not issues, f'문제 {issues[:4]}')
        s.expect(all(r.count('kor') <= 2 for r in runs), '국어 강의가 3일 연속')
        s.expect(abs(kor_lec - math_lec) <= 4, f'국어부터 여는 재윤이 30일 동안 수학·국어 강의 수 차이가 큼 ({kor_lec}/{math_lec})')
        math_end = await s.ev("currLabel('math')")
        s.expect(math_end != math_start, '수학 진도가 안 나감')

        # 화면 글: 국어가 강의를 가져간 날 수학 판 "지난 시간 다지기"에 국어 강의 날이라고 보이는지
        await s.ev(f"S.dayOffset = 1; saveLocal(); go('home')")
        need = await s.ev("[!!dueLecture('kor'), !!dueLecture('math'), recentLecSubjs(2)]")
        print('마지막 날 상태', need)
        await s.ev("ACT.board({ dataset:{ k:'kor' } })"); await s.p.wait_for_timeout(50)
        await s.ev("go('home')"); await s.ev("ACT.board({ dataset:{ k:'math' } })"); await s.p.wait_for_timeout(50)
        txt = await s.ev("document.querySelector('.lesson-card') ? document.querySelector('.lesson-card').innerText : ''")
        print('수학 판 안내:', txt.replace('\n', ' / '))
        if await s.ev("!!(RUN.b.waitLec)"):
            s.expect('오늘 강의는 국어' in txt and '미리 맛보기' in txt, '연습 판에 오늘 강의 과목·미리 맛보기 안내가 안 보임')
            s.expect(await s.ev("RUN.b.qs.filter(q => q.preview).length") >= 3, '연습 판에 미리 맛보기 문제가 없음')
        await s.shot('math_wait')

asyncio.run(main())
