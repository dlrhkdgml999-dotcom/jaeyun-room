"""11/2 오빠: "어제 강의도 다 보고 국어·수학·영어·복습 다 했는데 공부 시간이 7분"
A) 예전 기록처럼 강의가 0분으로 남은 날 → 공부 기록에 그 강의 길이(EBS 표시 분)로 들어가는지
B) 강의 보러 EBS 앱으로 간 사이 공부방 앱이 꺼졌다 켜짐(새 탭 = sessionStorage 없음) → "강의 보는 중" 화면으로 돌아오고, 다 봤다고 하면 강의 길이로 셈
C) 바로 "다 봤어요"를 두 번 눌러도(잰 시간 0분) 강의 길이로 셈
D) 받아쓰기·개념 카드 화면에 있던 시간도 판 시간(b.xs)에 들어감, 판 밖(진도 지도 카드)은 안 들어감"""
import asyncio, sys
sys.path.insert(0, '.')
from harness import Sim, FAKE_TTS
from sim_month import FAST

async def lecture_board(s):
    """오늘 강의가 붙은 판을 열어 강의 안내까지"""
    k = await s.ev("(() => { const d = day(); for (const b of BOARDS) { if (!d.boards[b.k]) d.boards[b.k] = makeBoard(b.k); if (boardHasLecture(d.boards[b.k])) return b.k; } return null; })()")
    return k

async def main():
    async with Sim('M_강의0분') as s:
        p = s.p
        await s.click('[data-a="start"]'); await s.ev(FAST)
        # A) 강의를 본 날인데 기록에 0분
        await s.ev("S.dayOffset = -1; saveLocal()")
        k = await lecture_board(s); s.expect(k, 'A: 강의 판이 없음')
        info = await s.ev(f"(() => {{ const b = day().boards['{k}']; const li = lectInfo(b.cur.subj, b.cur.lec); markLectureSeen(b.cur.subj, b.cur.lec, 0); return {{ s:b.cur.subj, n:b.cur.lec, mins:li.mins }}; }})()")
        y = await s.ev("todayKey()")
        dm = await s.ev(f"dayMins('{y}')"); print('A 0분으로 남은 강의:', info, '→', dm)
        s.expect(dm['lec'] == min(40, info['mins']), f'A: 0분 강의가 강의 길이로 안 셈 {dm}')
        # 기록(seen·lm)이 아예 없고 "다 봤어요"(d.lec.done)만 남은 날
        await s.ev(f"(() => {{ const d = S.days['{y}']; delete d.lm; delete d.lw; curr('{info['s']}').seen = {{}}; saveLocal(); }})()")
        dm2 = await s.ev(f"dayMins('{y}')"); print('A 기록 없이 다 봤어요만:', dm2)
        s.expect(dm2['lec'] == min(40, info['mins']), f'A: 다 봤어요만 남은 날 강의 시간 없음 {dm2}')
        # 강의 건너뛴(강의가 안 열려요) 판은 안 셈
        await s.ev(f"(() => {{ const d = S.days['{y}']; d.lec.done = false; d.boards['{k}'].lecSkip = true; d.boards['{k}'].idx = 3; saveLocal(); }})()")
        dm3 = await s.ev(f"dayMins('{y}')"); print('A 강의 건너뛴 날:', dm3); s.expect(dm3['lec'] == 0, 'A: 건너뛴 강의가 공부 시간에 들어감')

        # B) 오늘: 강의 보러 나감 → 앱이 꺼졌다 켜짐
        await s.ev("S.dayOffset = 0; saveLocal(); go('home')")
        k = await lecture_board(s); s.expect(k, 'B: 강의 판이 없음')
        sub, n, mins = (await s.ev(f"(() => {{ const b = day().boards['{k}']; return [b.cur.subj, b.cur.lec, lectInfo(b.cur.subj, b.cur.lec).mins]; }})()"))
        await s.ev(f"RUN = {{ k:'{k}', b:day().boards['{k}'] }}; save(); go('intro', '{k}')")
        await s.ev("ACT.begin()"); await p.wait_for_timeout(300)
        await p.evaluate("document.querySelector('[data-lecgo]').removeAttribute('href')")
        await s.click('[data-lecgo]'); await p.wait_for_timeout(300)
        print('B 강의 보러 감:', await s.screen())
        # 25분 전에 나간 걸로
        await s.ev("(() => { const w = JSON.parse(localStorage.getItem('jaeyun-lecw')); w.at -= 25 * 60000; localStorage.setItem('jaeyun-lecw', JSON.stringify(w)); })()")
        p2 = await s.ctx.new_page(); p2.on('pageerror', lambda e: s.errors.append(str(e)))
        await p2.goto(s.url); await p2.wait_for_timeout(700)
        await s.p.close(); s.p = p = p2
        await s.ev(FAST)
        scr = await s.screen(); print('B 앱 다시 켬:', scr); s.expect(scr == 'lecwait', f'B: 앱이 꺼졌다 켜지면 강의 보는 중 화면이 아님 ({scr})')
        await s.click('[data-a="lecdone"]'); await p.wait_for_timeout(200)
        await s.click(f'[data-a="lecwatched"][data-v="{n}"]'); await p.wait_for_timeout(400)
        dm = await s.ev("dayMins(todayKey())"); seen = await s.ev(f"curr('{sub}').seen[{n}]")
        print('B 다 봤어요:', dm, seen, '강의 길이', mins, '| 화면', await s.screen())
        s.expect(dm['lec'] == min(40, mins), f'B: 강의 시간 {dm["lec"]} ≠ {mins}')
        s.expect(await s.ev("localStorage.getItem('jaeyun-lecw')") is None, 'B: 강의 기록이 안 지워짐')
        s.expect(await s.ev(f"!boardHasLecture(day().boards['{k}'])"), 'B: 강의를 봤는데 판에서 또 강의가 나옴')

        # C) 다음 날: 나가자마자 다 봤어요 두 번
        await s.ev("S.dayOffset = 1; saveLocal(); go('home')")
        k = await lecture_board(s)
        if k:
            sub, n, mins = (await s.ev(f"(() => {{ const b = day().boards['{k}']; return [b.cur.subj, b.cur.lec, lectInfo(b.cur.subj, b.cur.lec).mins]; }})()"))
            await s.ev(f"RUN = {{ k:'{k}', b:day().boards['{k}'] }}; save(); go('intro', '{k}')")
            await s.ev("ACT.begin()"); await p.wait_for_timeout(300)
            await p.evaluate("document.querySelector('[data-lecgo]').removeAttribute('href')")
            await s.click('[data-lecgo]'); await p.wait_for_timeout(300)
            await s.click('[data-a="lecdone"]'); await s.click('[data-a="lecdone"]'); await p.wait_for_timeout(200)
            await s.click(f'[data-a="lecwatched"][data-v="{n}"]'); await p.wait_for_timeout(300)
            dm = await s.ev("dayMins(todayKey())"); print('C 바로 다 봤어요:', dm, '강의 길이', mins)
            s.expect(dm['lec'] == min(40, mins), f'C: 강의 시간 {dm["lec"]} ≠ {mins}')
        else: print('C: 다음 날 강의 없음 (건너뜀)')

        # D) 받아쓰기·카드 시간
        await s.ev("S.dayOffset = 2; saveLocal(); go('home')")
        await s.ev("(() => { const d = day(); d.boards.eng = d.boards.eng || makeBoard('eng'); RUN = { k:'eng', b:d.boards.eng }; d.boards.eng.phase = 'dict'; d.dict = { words:pickDict(10), idx:0, photo:null, graded:false, marks:null, sent:false }; go('dict'); })()")
        x0 = await s.ev("RUN.b.xs || 0")
        await s.ev("SCR_AT = Date.now() - 90000; day().dict.idx = 10; go('dict')")
        x1 = await s.ev("RUN.b.xs || 0"); print('D 받아쓰기 90초:', x0, '→', x1); s.expect(85 <= x1 - x0 <= 95, f'D: 받아쓰기 시간이 안 들어감 {x1 - x0}')
        await s.ev("SCR_AT = Date.now() - 7200000; go('home')")
        x2 = await s.ev("day().boards.eng.xs"); s.expect(x2 - x1 <= 600, f'D: 한 화면 시간이 10분을 넘게 들어감 {x2 - x1}')
        await s.ev("go('cards', { lesson:CURRS.math.units[0].lessons[0].id }); SCR_AT = Date.now() - 60000; go('home')")
        x3 = await s.ev("day().boards.eng.xs"); s.expect(x3 == x2, 'D: 판 밖 개념 카드 시간이 판에 들어감')
        mm = await s.ev("dayMins(todayKey())"); print('D 공부 시간:', mm, x2)
        s.expect(mm['app'] >= round(x2 / 60) - 1, 'D: 받아쓰기 시간이 공부 시간에 안 보임')

asyncio.run(main())
