"""EBS 강의 본 시간이 공부 시간에 들어가는지 (10/29 오빠: 달력에 강의 시간이 빠져 있음)
L1) 강의 날 공부 → 그날 기록(d.lm)에 강의 분, 달력·오늘 한눈에·주간 리포트·오빠 7일 막대에 문제 시간 + 강의 시간
L2) 오빠 역할이던 때처럼 진도의 본 강의 목록(seen)과 알림함이 사라진 태블릿 → 앱을 켜면 그날 "다 봤어요"한 강의 길이로 되살아나는지 (한 번만)"""
import asyncio, sys, json
sys.path.insert(0, '.')
from harness import Sim
from sim_month import FAST, DAY

async def main():
    async with Sim('M_강의시간') as s:
        p = s.p
        await s.click('[data-a="start"]'); await s.ev(FAST)
        lecdays = []
        for d in range(6):
            await s.ev(f"S.dayOffset = {d - 6}; saveLocal(); go('home')")
            log = await p.evaluate(f"({DAY})(0.9)")
            if log['lec']: lecdays.append(await s.ev("todayKey()"))
        await s.ev("window.setTimeout = window.__oST || window.setTimeout; S.dayOffset = 0; saveLocal()")
        rows = await s.ev(f"{json.dumps(lecdays)}.map(k => ({{ k, lm:S.days[k].lm, m:dayMins(k) }}))")
        print('L1 강의 날:', rows)
        s.expect(lecdays and all(r['m']['lec'] >= 20 and r['m']['total'] == r['m']['app'] + r['m']['lec'] and r['lm'] for r in rows), 'L1: 강의 날 공부 시간에 강의가 안 들어감')
        await s.adult('mom'); await s.click('[data-a="study"]'); await p.wait_for_timeout(300)
        k0 = lecdays[0]
        cell = await s.ev(f"+(document.querySelector('button.sd[data-day=\"{k0}\"] b')||{{}}).textContent || 0")
        print('L1 달력 칸:', k0, cell, '= 문제', rows[0]['m']['app'], '+ 강의', rows[0]['m']['lec']); s.expect(cell == rows[0]['m']['total'], 'L1: 달력 칸에 강의 시간이 안 들어감')
        wk = await s.ev("(() => { const r = buildWeekReport(mondayOf(todayKey())); const ks = Array.from({length:7}, (_, i) => addDays(r.mon, i)).filter(k => k <= todayKey()); return { mins:r.mins, should:ks.reduce((a, k) => a + dayMins(k).total, 0) }; })()")
        print('L1 주간 리포트 분:', wk); s.expect(wk['mins'] == wk['should'], 'L1: 주간 리포트 공부 시간에 강의가 빠짐')
        # L2: 진도의 본 강의 목록 · 그날 강의 분 · 알림함이 사라진 태블릿
        await s.ev("(() => { S.curr.seen = {}; Object.values(S.currs).forEach(c => c.seen = {}); Object.values(S.days).forEach(d => { delete d.lm; delete d.lw; }); S.notes = []; localStorage.removeItem('jaeyun-lecfill'); saveLocal(); })()")
        lost = await s.ev(f"{json.dumps(lecdays)}.map(k => dayMins(k).lec)"); print('L2 사라진 뒤 강의 분:', lost)
        await p.reload(); await p.wait_for_timeout(600)
        back = await s.ev(f"{json.dumps(lecdays)}.map(k => dayMins(k).lec)"); print('L2 앱 다시 켠 뒤:', back)
        s.expect(all(b >= 20 for b in back), f'L2: 강의 시간이 안 되살아남 {back}')
        again = await s.ev("backfillLectures()"); s.expect(again == 0, 'L2: 되살리기가 두 번 돌아감')
        nolec = await s.ev(f"Object.keys(S.days).filter(k => !{json.dumps(lecdays)}.includes(k)).map(k => dayMins(k).lec)")
        s.expect(all(x == 0 for x in nolec), f'L2: 강의 없는 날에 강의 시간이 생김 {nolec}')

asyncio.run(main())
