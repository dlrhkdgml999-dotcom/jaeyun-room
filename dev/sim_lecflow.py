"""11/4 오빠: "재윤이가 동영상이 없다고 뜨거나, 문제 풀 게 없어서 복습만 하게 되는 경우가 있어" → 그 경우를 세는 시뮬레이션
재윤이가 판을 여는 방법 5가지 × 40일 (매번 처음부터):
  앱 순서대로 / 늘 국어 먼저 / 늘 수학 먼저 / 아무렇게나 / 아무렇게나 + 4일에 하루 쉼
재는 것 (수학·국어 각각):
  강의 날 · "복습만" 날(새 강의가 필요한데 강의를 못 봐서 다지기 판) · 그중 새 문제(미리 맛보기)가 하나도 없는 날
  "영상 없음" = 그 과목을 먼저 열었는데 그 과목 강의를 못 본 날(그 과목도 새 강의가 필요했는데)
  나간 차시 수, 수학·국어 강의 수 차이, 하루 강의 두 편, 오류
기준: 미리 맛보기 없는 복습만 날 0 · 수학·국어 강의 수 차이 공부한 날의 1/8(최소 4) 안 · 강의 두 편 0 · 오류 0"""
import asyncio, sys, os, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Sim
from sim_month import FAST, DAY
DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 40
PROG = "(s => { const C = CURRS[s], c = curr(s); return C.all.filter(x => x.ui < c.unit || (x.ui === c.unit && x.li < c.lesson)).length; })"

async def run(mode, seed):
    rnd = random.Random(seed)
    st = {'math': {'lec': 0, 'wait': 0, 'wait_nopv': 0, 'pv': 0, 'nov': 0, 'both': 0}, 'kor': {'lec': 0, 'wait': 0, 'wait_nopv': 0, 'pv': 0, 'nov': 0, 'both': 0}}
    issues = []; two = 0; studied = 0
    async with Sim(f'L_{mode}') as s:
        await s.click('[data-a="start"]'); await s.ev(FAST)
        p0 = {k: await s.ev(f"({PROG})('{k}')") for k in ('math', 'kor')}
        for d in range(DAYS):
            await s.ev(f"S.dayOffset = {d}; RUN = null; saveLocal(); go('home')")
            if mode == 'skip' and rnd.random() < .25: continue
            if mode == 'app': order = await s.ev("orderedBoards(day()).map(b => b.k).filter(k => k !== 'rev')")
            elif mode == 'kor': order = ['kor', 'math', 'eng']
            elif mode == 'math': order = ['math', 'kor', 'eng']
            else: order = rnd.sample(['kor', 'math', 'eng'], 3)
            first = order[0]
            need = await s.ev("({ kor:!!dueLecture('kor'), math:!!dueLecture('math') })")
            await s.ev(f"window.__order = {json.dumps(order + ['rev'])}")
            log = await s.p.evaluate(f"({DAY})(0.9)")
            studied += 1
            if log['errs']: issues.append((d + 1, log['errs'][:2]))
            nlec = sum(1 for b in log['boards'].values() if b.get('lec'))
            if nlec > 1: two += 1
            info = await s.ev("Object.fromEntries(['math','kor'].map(k => { const b = day().boards[k] || {}; return [k, { wait:!!b.waitLec, pv:b.preview || 0, lec:!!(b.cur && b.cur.lec) }]; }))")
            for k in ('math', 'kor'):
                x = info[k]
                if x['lec']: st[k]['lec'] += 1
                if x['lec'] and need['math'] and need['kor']: st[k]['both'] += 1   # 두 과목 다 새 강의가 필요했던 날 누가 봤나
                if x['wait']:
                    st[k]['wait'] += 1; st[k]['pv'] += x['pv']
                    if not x['pv']: st[k]['wait_nopv'] += 1
                if k == first and need[k] and not x['lec']: st[k]['nov'] += 1
        prog = {k: await s.ev(f"({PROG})('{k}')") - p0[k] for k in ('math', 'kor')}
    return {'mode': mode, 'studied': studied, 'st': st, 'prog': prog, 'two': two, 'issues': issues}

async def main():
    # 브라우저 5개를 한꺼번에 띄우면 CPU 2개 컴퓨터에서 도구가 멈춰서(11/4 2회차 EPIPE) 2개씩
    modes = ['app', 'kor', 'math', 'random', 'skip']; res = []
    for i in range(0, len(modes), 2): res += await asyncio.gather(*[run(m, 11 + modes.index(m)) for m in modes[i:i + 2]])
    bad = []
    print(f'{DAYS}일, 판 여는 방법별 (수학 / 국어):')
    for r in res:
        m, k = r['st']['math'], r['st']['kor']
        print(f"[{r['mode']:6}] 공부 {r['studied']}일 | 강의 {m['lec']}/{k['lec']} | 복습만 날 {m['wait']}/{k['wait']} (미리 맛보기 없는 날 {m['wait_nopv']}/{k['wait_nopv']}, 미리 맛보기 문제 {m['pv']}/{k['pv']}) | 먼저 열었는데 영상 없음 {m['nov']}/{k['nov']} | 나간 차시 {r['prog']['math']}/{r['prog']['kor']} | 둘 다 필요한 날 강의 {m['both']}/{k['both']} | 강의 두 편 {r['two']}")
        if r['issues']: bad.append((r['mode'], '오류', r['issues'][:2]))
        if r['two']: bad.append((r['mode'], '강의 두 편', r['two']))
        if m['wait_nopv'] + k['wait_nopv']: bad.append((r['mode'], '미리 맛보기 없는 복습만 날', m['wait_nopv'], k['wait_nopv']))
        # 공평: 전체 강의 수 차이가 공부한 날의 1/8(최소 4) 안. (한 과목이 볼 강의가 없는 날엔 다른 과목이 보는 게 맞아서 완전히 같을 수는 없음)
        if abs(m['lec'] - k['lec']) > max(4, r['studied'] // 8): bad.append((r['mode'], '수학·국어 강의 수 차이 큼', m['lec'], k['lec']))
    print('issues:', bad or '없음')
asyncio.run(main())
