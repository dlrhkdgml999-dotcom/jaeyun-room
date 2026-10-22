"""엄마 입장 시뮬레이션: 재윤이가 10일 공부(펜 받아쓰기 포함) → 엄마가 채점하고, 기간 달력으로 공부 시간 보고, 날짜별 푼 문제 확인
폰(384×832)과 태블릿 가로(1280×800) 두 크기에서 화면 캡처"""
import asyncio, sys, json
sys.path.insert(0, '.')
from harness import Sim, SHOTS
from sim_month import FAST, DAY

PEN_DICT = r"""async (k) => {
  // 손글씨처럼 보이는 펜 그림 10장 (줄 3개짜리 칸에 첫 줄에만 씀) → 앱의 composePen으로 한 장 만들기
  const dy = S.days[k]; const words = pickDict(10);
  const pen = words.map((w, i) => { const c = document.createElement('canvas'); c.width = 1200; c.height = 380; const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 1200, 380); x.strokeStyle = '#CDEBE0'; x.lineWidth = 4; [127, 253].forEach(y => { x.beginPath(); x.moveTo(0, y); x.lineTo(1200, y); x.stroke(); });
    x.fillStyle = '#3A2530'; x.font = `${60 + (i % 3) * 8}px serif`; x.fillText(i === 4 ? w.slice(0, 3) : w, 40 + (i % 4) * 30, 90); if (i === 4) x.fillText(w.slice(3), 80, 210);
    return c.toDataURL('image/jpeg', .6); });
  dy.dict = { words, idx:10, pen, photo:null, graded:false, marks:null, sent:true };
  const img = await composePen(dy.dict); dy.dict.photo = img; dy.dict.rows = words.length; dy.dict.pen = null; save();
  return { words, size:img.length };
}"""

async def vshot(s, sel, name):
    await s.p.locator(sel).first.scroll_into_view_if_needed(); await s.p.wait_for_timeout(120)
    await s.ev(f"document.querySelector('{sel}').scrollIntoView({{block:'start'}})"); await s.p.wait_for_timeout(120)
    await s.p.screenshot(path=f'{SHOTS}/{s.name}_v_{name}.png')

async def main():
    async with Sim('Q_엄마가 보는 화면') as s:
        p = s.p
        await s.click('[data-a="start"]'); await p.wait_for_timeout(200)
        await s.ev(FAST)
        # 1) 재윤이 10일 공부 (하루는 쉼, 하루는 반만)
        for d in range(10):
            await s.ev(f"S.dayOffset = {d - 9}; saveLocal(); go('home')")
            if d == 3: continue          # 쉰 날
            if d == 6:                   # 국어만 한 날
                await s.ev("day().order = ['kor','math','eng']")
            log = await p.evaluate(f"({DAY})(0.82)")
            if log['errs']: s.issues.append((d, log['errs'][:2]))
            if d == 6: await s.ev("(() => { const dy = day(); ['math','eng','rev'].forEach(k => delete dy.boards[k]); dy.done = false; save(); })()")
        await s.ev("window.setTimeout = window.__oST || window.setTimeout")
        await s.ev("S.dayOffset = 0; saveLocal()")
        # 펜 받아쓰기 2번 (오늘, 어제) — 엄마가 채점할 것
        for k in ['todayKey()', "addDays(todayKey(), -1)"]:
            r = await p.evaluate(PEN_DICT, await s.ev(k)); print('펜 받아쓰기 사진 크기:', r['size'])
        st = await s.ev("""(() => { const all = Object.keys(S.days).flatMap(k => dayLogs(k)); return { days:Object.keys(S.days).length, logs:all.length,
          wrong:all.filter(x => x.r !== 1).length, size:JSON.stringify(S).length, logBytes:JSON.stringify(Object.values(S.days).map(d => Object.values(d.boards || {}).map(b => b.log || []))).length,
          sample:all.slice(0, 3).map(x => [x.t, x.a, x.w, x.r]) }; })()""")
        print('기록:', json.dumps(st, ensure_ascii=False))
        s.expect(st['logs'] > 300, f"문제 기록이 적음 {st['logs']}")
        bad = await s.ev("Object.keys(S.days).flatMap(k => dayLogs(k)).filter(x => /undefined|NaN|\\[object|null/.test(x.t + x.a + x.w) || !x.t).map(x => x.t).slice(0, 5)")
        s.expect(not bad, f'이상한 문제 기록: {bad}')

        for (w, h, tag) in [(384, 832, 'phone'), (1280, 800, 'tab')]:
            await p.set_viewport_size({'width': w, 'height': h})
            # 2) 엄마 메뉴: 채점이 맨 위 근처에 있는지
            await s.adult('mom'); await p.wait_for_timeout(300)
            order = await s.ev("[...document.querySelectorAll('.screen > .panel, .screen > .install-tile, .screen > .sync-alert')].slice(0, 4).map(e => (e.querySelector('h3') || e).textContent.trim().slice(0, 14))")
            print(f'[{tag}] 엄마 탭 위에서부터:', order)
            if tag == 'phone': s.expect(any('받아쓰기 채점' in o for o in order[:3]), '채점할 게 있는데 받아쓰기 채점이 위쪽에 없음')
            rows = await s.ev("document.querySelectorAll('.grade-card .grade-row .crop').length")
            s.expect(rows >= 10, f'펜 글씨 줄마다 자른 그림이 없음 ({rows})')
            await vshot(s, '.grade-card', f'grade_{tag}')
            if tag == 'phone':
                # 실제로 눌러서 채점: 스크롤이 그대로인지, 버튼이 글씨 옆에 있는지
                card = p.locator('.grade-card').first
                await card.scroll_into_view_if_needed()
                gap = await s.ev("""(() => { const r = document.querySelector('.grade-card .grade-row'); const c = r.querySelector('.crop').getBoundingClientRect(), o = r.querySelector('.ox').getBoundingClientRect(); return Math.round(o.top - c.bottom); })()""")
                print('글씨 그림 아래 → O·X 버튼 거리(px):', gap); s.expect(gap < 60, f'O·X 버튼이 글씨에서 멀리 있음 ({gap}px)')
                for i in range(4):
                    y0 = await s.ev('scrollY')
                    await card.locator('.grade-row').nth(i).locator('.x' if i == 1 else '.o').click(); await p.wait_for_timeout(80)
                    y1 = await s.ev('scrollY'); s.expect(abs(y1 - y0) < 2, f'O/X 누르면 화면이 움직임 {y0}→{y1}')
                await vshot(s, '.grade-card', 'grade_marked_phone')
                await card.locator('[data-a="markrest"]').click(); await p.wait_for_timeout(100)
                dis = await card.locator('[data-a="grade"]').is_disabled(); s.expect(not dis, '다 골랐는데 채점 완료가 안 눌림')
                await card.locator('[data-a="grade"]').click(); await p.wait_for_timeout(300)
                g = await s.ev("gradeOf(todayKey())"); print('채점 결과:', g['score'], g['marks'])
                s.expect(g['graded'] and g['score'] == 9, '채점이 저장 안 됨')
                kn = await s.ev("S.kidNotes[0] && S.kidNotes[0].text"); s.expect(kn and '9개' in kn, '재윤이에게 채점 결과가 안 감')
            # 3) 공부 기록: 이번 달 → 최근 30일
            await s.click('[data-a="study"]'); await p.wait_for_timeout(300)
            s.expect(await s.screen() == 'study', '공부 기록 화면이 안 열림')
            await s.click('[data-a="studyset"][data-preset="30"]'); await p.wait_for_timeout(200)
            summ = await s.ev("""(() => { const sm = studySummary(); const cells = [...document.querySelectorAll('button.sd')]; return { days:sm.days, mins:sm.mins, full:sm.full,
              cellSum:cells.reduce((a, c) => a + (+c.querySelector('b').textContent || 0), 0), cells:cells.length, html:document.querySelector('.study').innerHTML.length }; })()""")
            print(f'[{tag}] 30일 요약:', summ)
            s.expect(summ['days'] == 9, f"공부한 날 수가 이상함 {summ['days']}")
            s.expect(summ['cellSum'] == summ['mins'], f"달력 분 합계({summ['cellSum']})와 총 시간({summ['mins']})이 다름")
            await s.overflow(f'공부 기록 {tag}'); await s.ev('scrollTo(0,0)'); await s.p.screenshot(path=f'{SHOTS}/{s.name}_v_top_{tag}.png'); await vshot(s, '.scal', f'cal_{tag}')
            # 쉰 날, 반만 한 날, 다 한 날 색이 다른지
            lv = await s.ev("[-6, -3, -1].map(n => { const el = document.querySelector(`button.sd[data-day='${addDays(todayKey(), n)}']`); return el ? el.className : null; })")
            print('쉰 날 / 국어만 / 다 한 날:', lv)
            s.expect('h0' in (lv[0] or ''), '쉰 날이 비어 보이지 않음')
            s.expect(lv[1] and 'part' in lv[1] and 'part' not in (lv[2] or ''), '반만 한 날과 다 한 날이 구별 안 됨')
            # 날짜 누르기 → 그날 푼 문제
            k = await s.ev("addDays(todayKey(), -2)")
            await s.click(f'button.sd[data-day="{k}"]'); await p.wait_for_timeout(500)
            det = await s.ev("""(() => { const d = document.querySelector('#dayDetail'); const r = d.getBoundingClientRect(); return { top:Math.round(r.top), boards:d.querySelectorAll('.sboard').length, q:d.querySelectorAll('.lq').length,
              should:dayLogs(STUDY.sel).length, text:d.textContent.slice(0, 80) }; })()""")
            print(f'[{tag}] 날짜 누른 뒤:', det)
            s.expect(det['q'] == det['should'] and det['q'] > 30, f"그날 푼 문제가 다 안 나옴 {det['q']}/{det['should']}")
            s.expect(-5 < det['top'] < 140, f"날짜를 눌렀는데 그날 기록으로 안 내려감 (top {det['top']})")
            await vshot(s, '#dayDetail', f'day_{tag}')
            # 과목 · 틀린 것만
            await s.click('[data-a="studyset"][data-subj="math"]'); await p.wait_for_timeout(150)
            await s.click('[data-a="studyset"][data-only="1"]'); await p.wait_for_timeout(150)
            m = await s.ev("""(() => ({ shown:document.querySelectorAll('#dayDetail .lq').length, should:dayLogs(STUDY.sel).filter(x => x.board === 'math' && x.r !== 1).length }))()""")
            print(f'[{tag}] 그날 수학 · 틀린 것만:', m)
            s.expect(m['shown'] == m['should'], '수학 틀린 것만 거르기가 맞지 않음')
            await vshot(s, '#dayDetail', f'mathwrong_{tag}')
            # 과목별 맞은 · 틀린 문제 (기간 전체)
            await s.click('.subj-acc .r.tap[data-psubj="kor"]'); await p.wait_for_timeout(500)
            top = await s.ev("Math.round(document.querySelector('#subjProblems').getBoundingClientRect().top)")
            s.expect(-5 < top < 120, f'요약에서 국어를 눌렀는데 과목별 문제로 안 내려감 ({top})')
            for subj in ['kor', 'math', 'eng', 'dict']:
                await s.click(f'.ptab[data-psubj="{subj}"]'); await p.wait_for_timeout(120)
                r = {}
                for pres in ['wrong', 'right', 'all']:
                    await s.click(f'[data-a="studyset"][data-pres="{pres}"]'); await p.wait_for_timeout(100)
                    r[pres] = await s.ev("""(() => { const sm = studySummary(), all = [...sm.logs, ...sm.ks.flatMap(dictLogs)].filter(x => x.subj === STUDY.psubj);
                      const want = STUDY.pres === 'wrong' ? all.filter(x => x.r !== 1) : STUDY.pres === 'right' ? all.filter(x => x.r === 1) : all;
                      const rows = document.querySelectorAll('#subjProblems .lq').length; return { rows, want:Math.min(40, want.length), total:want.length,
                        tab:document.querySelector('.ptab.on span').textContent.trim(), bad:[...document.querySelectorAll('#subjProblems .lq')].some(e => (e.classList.contains('okb')) !== (STUDY.pres !== 'wrong' && e.querySelector('.lr.ok') !== null) && STUDY.pres !== 'all') }; })()""")
                    s.expect(r[pres]['rows'] == r[pres]['want'], f"{subj} {pres}: {r[pres]['rows']}줄, 기대 {r[pres]['want']}")
                    s.expect(not r[pres]['bad'], f'{subj} {pres}: 맞은/틀린 문제가 섞여 나옴')
                s.expect(r['wrong']['total'] + r['right']['total'] == r['all']['total'], f'{subj}: 맞음 + 틀림 ≠ 전부')
                print(f"[{tag}] {subj}: 탭 '{r['all']['tab']}' · 틀림 {r['wrong']['total']} · 맞음 {r['right']['total']}")
                if subj == 'dict': s.expect(r['right']['total'] >= 9 and r['wrong']['total'] >= 1, '받아쓰기 채점 결과가 과목별 문제에 안 나옴')
            await s.click('.ptab[data-psubj="math"]'); await s.click('[data-a="studyset"][data-pres="wrong"]'); await p.wait_for_timeout(150)
            await vshot(s, '#subjProblems', f'subj_math_wrong_{tag}')
            await s.click('[data-a="studyset"][data-pres="right"]'); await p.wait_for_timeout(150)
            await vshot(s, '#subjProblems', f'subj_math_right_{tag}')
            if await p.locator('[data-a="studyset"][data-pmore="1"]').count():
                n0 = await s.ev("document.querySelectorAll('#subjProblems .lq').length"); await s.click('[data-a="studyset"][data-pmore="1"]'); await p.wait_for_timeout(120)
                n1 = await s.ev("document.querySelectorAll('#subjProblems .lq').length"); print('더 보기:', n0, '→', n1); s.expect(n1 > n0, '더 보기가 안 됨')
            await s.click('[data-a="studyset"][data-pres="wrong"]')
            await s.click('[data-a="studyset"][data-only="1"]'); await s.click('[data-a="studyset"][data-subj="all"]')
            # 직접 기간: 지난주
            await s.click('[data-a="studyset"][data-preset="lastweek"]'); await p.wait_for_timeout(150)
            lw = await s.ev("({ from:STUDY.from, to:STUDY.to, months:document.querySelectorAll('.scal-m').length })"); print('지난주:', lw)
            await p.fill('#sfrom', await s.ev("addDays(todayKey(), -5)")); await p.fill('#sto', await s.ev("addDays(todayKey(), -2)"))
            await s.click('[data-a="studyset"][data-range="1"]'); await p.wait_for_timeout(150)
            cr = await s.ev("({ from:STUDY.from, to:STUDY.to, cells:document.querySelectorAll('button.sd').length })"); print('직접 고른 기간:', cr)
            s.expect(cr['cells'] == 4, f"고른 4일만 누를 수 있어야 함 ({cr['cells']})")
            html = await s.ev("document.querySelector('.study').innerHTML")
            s.expect(not any(x in html for x in ['undefined', 'NaN', '[object']), '공부 기록 화면에 이상한 글자')
            await s.click('[data-a="studyset"][data-preset="month"]')
            await s.ev("go('adult')")
        # 4) 오빠 탭에도 바로가기
        await s.adult('oppa'); s.expect(await p.locator('[data-a="study"]').count() == 1, '오빠 탭에 공부 기록 바로가기 없음')
        # 5) 저장 크기: 100일이면?
        per_day = st['logBytes'] / 9
        print(f'문제 기록 하루 약 {per_day/1000:.1f}KB → 180일 보관 약 {per_day*180/1e6:.2f}MB')
        s.expect(per_day * 180 < 2.2e6, '문제 기록이 너무 커서 폰 저장 공간이 부족해질 수 있음')

asyncio.run(main())
