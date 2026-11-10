"""11/5 오후 오빠 요청 — 엄마가 보기 쉬운 화면 검증
A) 엄마 탭 "아들에게 말하기" → 건의 화면 글자에 "오빠"가 없고 "아들"
B) 주간 리포트: 이번 주 ◀ 지난주 넘기기, 큰 한 줄 · 요일 동그라미 7개(다 함 ✓ · 조금 ½) · 과목 얼굴 · 👍/👀 한 줄, 조사(수학을/국어를), 카톡 복사 글
C) 재윤이 진도: 과목마다 게이지(학기 칸 · 🐰 자리 · %), 진도를 옮기면 %·토끼가 따라감, 진도 옮기기 같은 오빠용 칸은 엄마 칸에 없음
D) 받아쓰기: 채점 끝난 건 "11/4 받아쓰기 · 채점 완료 n/10점" 한 줄, 누르면 펼쳐지고 다시 누르면 접힘 / 채점할 것은 위 할 일에만
E) 깜짝 응원 멘트 추천: 누르면 칸에 들어가고 저장하면 응원 목록에
H) (11/9) 확인할 일 카드: EBS 못 엶·선물 적음 → 엄마·오빠 탭 위, ✓ 확인
F) 오빠 탭 바로가기 2칸(오답노트·공부 기록) + 접는 칸 중복 없음, 재윤이 문제 칸 열기 (풀 문제가 있을 때 · 없을 때) — 11/9
G) 엄마 폰 맨 위 연결 줄에 기술 글자(가족방·앱 버전) 없음 — sim_kq 쪽 가족 연결은 sim_family가 봄, 여기선 함수로 확인
폰·태블릿 가로에서 가로 넘침 없음, 캡처: out/shots3/mom2_*.png"""
import asyncio, sys, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Sim
from sim_month import FAST, DAY

async def main():
    async with Sim('mom2') as s:
        p = s.p
        await s.click('[data-a="start"]'); await s.ev(FAST)
        # 9일 공부 (지난주 · 이번 주 걸치게), 받아쓰기 채점 몇 개
        await s.ev("S.dayOffset = -8; saveLocal(); go('home')")   # 11/9: 오늘까지 (월요일엔 이번 주가 비어서 리포트 검사가 늘 실패했음)
        for d in range(9):
            log = await p.evaluate(f"({DAY})(0.88)")
            if log['errs']: s.issues.append(('공부 오류', d, log['errs'][:2]))
            if d in (2, 5, 7):
                await s.adult('mom'); await s.grade_all((1, 4) if d == 2 else ())
            await s.ev("S.dayOffset = (S.dayOffset || 0) + 1; RUN = null; save(); go('home')"); await p.wait_for_timeout(30)
        await s.ev("S.dayOffset = 0; save()")
        for (w, h, tag) in [(384, 832, 'phone'), (1280, 800, 'tab')]:
            await p.set_viewport_size({'width': w, 'height': h})
            # ---- A
            await s.adult('mom'); await s.ev("MOM_OPEN.clear(); go('adult')"); await p.wait_for_timeout(150)
            # 11/11 엄마 탭 = 오늘 한눈에 · 받아쓰기 채점 · 오답노트, 맨 아래 작은 "아들에게 말하기"
            tile = await s.ev("[...document.querySelectorAll('.mom-quick .mq b')].map(x => x.textContent)"); son = await s.ev("(document.querySelector('.son-link')||{}).textContent || ''")
            print(f'[{tag}] 엄마 바로가기:', tile, son); s.expect(tile == ['오답노트'] and '아들에게 말하기' in son and '오빠' not in son, f'엄마 탭 바로가기 이상 {tile} {son}')
            gl = await s.ev("document.querySelector('.glance').innerText"); s.expect('📚 진도' in gl and '%' in gl, '엄마 탭 오늘 한눈에 진도 한 줄이 없음')
            fk = await s.ev("[...document.querySelectorAll('details.mom-fold')].map(d => d.dataset.k)"); s.expect(not ({'report', 'prog', 'cheer', 'kq'} & set(fk)), f'엄마 탭에 뺀 칸이 남음 {fk}')
            if tag == 'phone':
                await s.click('.son-link[data-a="sug"]'); await p.wait_for_timeout(200)
                txt = await s.ev("document.querySelector('section.sug').innerText"); print('  건의 화면:', txt[:60].replace('\n', ' '))
                s.expect('아들에게' in txt and '오빠' not in txt, '엄마 건의 화면에 "오빠"가 남아 있음')
                await s.ev("SUG = null; go('adult')"); await p.wait_for_timeout(150)
            # ---- B 주간 리포트 (11/11 오빠 탭에만)
            await s.ev("MOM_OPEN.clear()"); await s.click('[data-a="atab"][data-v="oppa"]'); await p.wait_for_timeout(200)
            await s.click('details.mom-fold[data-k="report"] summary'); await p.wait_for_timeout(250)   # 11/9 바로가기 중복 없앰 → 접는 칸에서 열기
            rep = await s.ev("""(() => { const r = document.querySelector('.rep-panel'); return { nav:r.querySelector('.rep-nav b').innerText, big:r.querySelector('.rep-big').innerText,
              dots:[...r.querySelectorAll('.rep-dot')].map(d => d.className.replace('rep-dot ', '')), subj:[...r.querySelectorAll('.rep-s')].map(x => x.innerText.replace(/\\n/g, ' ')), lines:[...r.querySelectorAll('.rep-line')].map(x => x.innerText), h:r.getBoundingClientRect().height }; })()""")
            print(f'  리포트:', rep)
            s.expect(rep['nav'].startswith('이번 주') and len(rep['dots']) == 7 and rep['dots'].count('full') + rep['dots'].count('part') >= 1, f'이번 주 리포트 이상 {rep}')
            s.expect(len(rep['subj']) >= 3 and all(re.search(r'[😀🙂😥·✏]', x) for x in rep['subj']), '과목 얼굴이 없음')
            s.expect(not any(re.search(r'수학를|국어을|영어을|수학 를', x) for x in rep['lines'] + [rep['big']]), f'조사 이상 {rep["lines"]}')
            if tag == 'phone': s.expect(rep['h'] < 832, f'리포트가 폰 한 화면을 넘음 ({rep["h"]:.0f}px)')
            await p.locator('.rep-panel').screenshot(path=f'out/shots3/mom2_report_{tag}.png')
            await s.click('[data-a="repweek"][data-v="-1"]'); await p.wait_for_timeout(200)
            nav2 = await s.ev("document.querySelector('.rep-nav b').innerText"); s.expect(nav2.startswith('지난주'), f'◀ 지난주로 안 넘어감 {nav2}')
            past = await s.ev("[...document.querySelectorAll('.rep-dot')].filter(d => d.classList.contains('future')).length"); s.expect(past == 0, '지난주에 앞으로 올 날 표시가 있음')
            await s.click('[data-a="repweek"][data-v="1"]'); await p.wait_for_timeout(200)
            txt = await s.ev("reportText(buildWeekReport(mondayOf(todayKey())))"); s.expect('재윤이 주간 리포트' in txt and 'undefined' not in txt, '카톡 복사 글 이상')
            # ---- C 진도
            await s.click('details.mom-fold[data-k="curr"] > summary'); await p.wait_for_timeout(200)   # 11/11 오빠 탭 "진도 옮기기" 칸
            g = await s.ev("""[...document.querySelectorAll('.prog')].map(x => ({ t:x.querySelector('.prog-top').innerText.replace(/\\n/g,' '), segs:[...x.querySelectorAll('.prog-seg small')].map(y => y.textContent), bunny:x.querySelector('.prog-bunny').style.left, now:(x.querySelector('.prog-now')||{}).innerText }))""")
            print('  진도:', g)
            s.expect(len(g) == 3 and all(len(x['segs']) >= 2 for x in g), f'진도 게이지 이상 {g}')
            s.expect(all(x['segs'][:3] == ['1', '2', '3'] for x in g), '학기 막대 칸이 단원(1·2·3…)이 아님')   # 11/5 저녁: 지금 학기 기준
            s.expect(all('2학년 2학기' not in x['t'] for x in g), '2학년 2학기 기준이 남음')
            await p.locator('details.mom-fold[data-k="curr"] .prog-panel').screenshot(path=f'out/shots3/mom2_prog_{tag}.png')
            s.expect(await p.locator('details.mom-fold[data-k="curr"] #cjump-math').count() == 1 and await p.locator('details.mom-fold[data-k="curr"] #mode-math').count() == 0, '오빠 진도 옮기기 칸 이상 (옮기기만, 방식은 설정 탭)')
            if tag == 'phone':
                p1 = await s.ev("progOf('math').allPct"); await s.ev("const c = curr('math'); c.unit = CURRS.math.units.findIndex(u => u.course.short2 === '2-1'); c.lesson = 0; c.test = false; save(); go('adult')")
                p2 = await s.ev("progOf('math')"); print('  진도 옮김:', p1, '→', p2['allPct'], p2['cur']['co']['short2'] if 'cur' in p2 else '')
                top = await s.ev("document.querySelector('.prog-math .prog-top').innerText.replace(/\\n/g, ' ')"); print('  2-1로 옮긴 뒤:', top)
                s.expect(p2['coursePct'] == 0 and '2학년 1학기' in top and top.strip().endswith('0%'), '진도를 2-1로 옮겼는데 게이지가 이번 학기 기준으로 안 바뀜')
                left = await s.ev("document.querySelector('.prog-math .prog-bunny').style.left"); s.expect(abs(float(left[:-1])) < 1.5, f'2-1 처음인데 토끼 자리 {left}')
            # ---- D 받아쓰기 (엄마 탭)
            await s.ev("MOM_OPEN.clear()"); await s.click('[data-a="atab"][data-v="mom"]'); await p.wait_for_timeout(200)
            await s.click('details.mom-fold[data-k="dict"] > summary'); await p.wait_for_timeout(200)
            rows = await s.ev("[...document.querySelectorAll('details.mom-fold[data-k=dict] .done-row')].map(x => x.innerText.replace(/\\n/g, ' '))")
            print('  받아쓰기 줄:', rows[:3])
            s.expect(len(rows) >= 3 and all('채점 완료' in r or '쓴' in r or '칭찬' in r or '미룸' in r or '안 봄' in r for r in rows), f'채점 완료 줄 이상 {rows}')
            s.expect(await p.locator('details.mom-fold[data-k=dict] .grade-card').count() == 0, '채점 끝난 받아쓰기가 처음부터 펼쳐져 있음')
            await p.locator('details.mom-fold[data-k=dict]').screenshot(path=f'out/shots3/mom2_dict_{tag}.png')
            await s.click('details.mom-fold[data-k=dict] .done-row'); await p.wait_for_timeout(200)
            s.expect(await p.locator('details.mom-fold[data-k=dict] .grade-card').count() == 1, '누르면 펼쳐지지 않음')
            await s.click('details.mom-fold[data-k=dict] .done-row.open'); await p.wait_for_timeout(200)
            s.expect(await p.locator('details.mom-fold[data-k=dict] .grade-card').count() == 0, '다시 누르면 접히지 않음')
            # ---- E 응원 멘트
            # ---- E 응원 멘트 (11/11 엄마 탭에서 뺌 → 오빠 탭 "깜짝 응원 · 칭찬")
            await s.ev("MOM_OPEN.clear()"); await s.click('[data-a="atab"][data-v="oppa"]'); await p.wait_for_timeout(200)
            await s.click('details.mom-fold[data-k="voice"] > summary'); await p.wait_for_timeout(200)
            n0 = await s.ev("cheerList().length")
            await s.click('[data-a="cheeridea"][data-v="oppa|5"]'); v = await s.ev("document.querySelector('#cheertxt_oppa').value")
            s.expect(v.startswith('천천히 해도 괜찮아'), f'멘트 추천을 눌러도 칸에 안 들어감 {v}')
            await p.locator('details.mom-fold[data-k="voice"]').screenshot(path=f'out/shots3/mom2_cheer_{tag}.png')
            await s.click('[data-a="cheertext"][data-v="oppa"]'); await p.wait_for_timeout(200)
            s.expect(await s.ev("cheerList().length") == n0 + 1, '추천 멘트가 응원으로 저장 안 됨')
            await s.overflow(f'엄마 탭 펼침 {tag}'); await s.shot(f'mom2_mom_{tag}')
            # ---- F 오빠 탭
            await s.ev("MOM_OPEN.clear()"); await s.click('[data-a="atab"][data-v="oppa"]'); await p.wait_for_timeout(200)
            # 11/9: 바로가기는 따로 열리는 화면(오답노트·공부 기록)만, 나머지는 "더 보기" 칸 하나씩 (같은 메뉴가 두 번 나오지 않게)
            t6 = await s.ev("[...document.querySelectorAll('.mom-quick .mq b')].map(x => x.textContent)"); print('  오빠 바로가기:', t6)
            s.expect(t6 == ['오답노트', '공부 기록'], f'오빠 바로가기 이상 {t6}')
            folds = await s.ev("[...document.querySelectorAll('details.mom-fold')].map(d => d.dataset.k)"); print('  오빠 접는 칸:', folds)
            # 11/11 "더 보기" 4칸(주간 리포트·건의함·진도 옮기기·깜짝 응원) + 위 한 줄(선물, 지난 낸 문제)
            more = [k for k in folds if k not in ('gift', 'kq')]
            s.expect(len(folds) == len(set(folds)) and more == ['report', 'sug', 'curr', 'voice'] and 'gift' in folds, f'오빠 접는 칸 이상 {folds}')
            if 'kq' in folds:
                await s.click('details.mom-fold[data-k="kq"] summary'); await p.wait_for_timeout(300)
                s.expect(await s.ev("document.querySelector('details.mom-fold[data-k=kq]').open"), '재윤이 문제 칸이 안 열림')
            await s.overflow(f'오빠 탭 {tag}'); await s.ev("scrollTo(0,0)"); await p.screenshot(path=f'out/shots3/mom2_oppatop_{tag}.png')
        # 풀 문제가 있을 때: 위에 문제 칸, 바로가기는 그 칸으로
        await p.set_viewport_size({'width': 384, 'height': 832})
        await s.ev("go('kq')"); await s.click('[data-a="kqtype"][data-v="riddle"]'); await p.fill('#kqText', '나는 누구일까요?'); await p.fill('#kqAns', '토리'); await s.click('[data-a="kqsend"]'); await p.wait_for_timeout(300)
        await s.adult('oppa'); await s.ev("MOM_OPEN.clear(); go('adult')"); await p.wait_for_timeout(150)
        s.expect(await p.locator('.kq-box [id^="kqg_"]').count() == 1, '풀 문제가 오빠 탭 위에 없음')
        s.expect(await s.ev("document.querySelector('.kq-box').getBoundingClientRect().top < 900"), '풀 문제가 오빠 탭 첫 화면 근처에 없음')
        # H (11/9) 알림함을 없앤 뒤 갈 곳 없던 "확인할 일" → 엄마·오빠 탭 위 카드, ✓ 확인하면 사라짐, 예전 글(act 없음)도 글로 알아봄
        await s.ev("notify('mom', '📺 재윤이가 EBS 강의를 열지 못했어요. 태블릿에 EBS 초등 앱이 깔려 있고 로그인돼 있는지 확인해 주세요', 'ebs'); S.notes.unshift({ to:'oppa', text:'🎁 재윤이가 30일 선물로 \"토끼 인형\"을 적었어요', at:Date.now(), d:todayKey() }); notify('mom', '재윤이가 오늘 공부를 시작했어요'); save()")
        await s.adult('mom'); await s.ev("go('adult')"); await p.wait_for_timeout(150)
        td = await s.ev("[...document.querySelectorAll('.note-todo .li')].map(x => x.innerText.replace(/\\s+/g, ' '))"); print('H 엄마 확인할 일:', td)
        s.expect(any('EBS' in x for x in td) and not any('시작했어요' in x for x in td), f'엄마 탭 확인할 일 이상 {td}')
        s.expect(await s.ev("document.querySelector('.note-todo').getBoundingClientRect().top < 832"), '확인할 일이 첫 화면에 없음')
        n0 = len(td); await s.click('.note-todo [data-a="notedone"]'); await p.wait_for_timeout(150)
        s.expect(await p.locator('.note-todo .li').count() == n0 - 1, '✓ 확인을 눌러도 안 사라짐')
        await s.adult('oppa'); await s.ev("go('adult')"); await p.wait_for_timeout(150)
        td2 = await s.ev("[...document.querySelectorAll('.note-todo .li')].map(x => x.innerText.replace(/\\s+/g, ' '))"); print("H 오빠 확인할 일:", td2)
        s.expect(any('토끼 인형' in x for x in td2), f'오빠 탭 확인할 일 이상(선물) {td2}')
        await s.overflow('확인할 일 (폰)')
        # G 엄마 폰 연결 줄: 기술 글자 없음 (가짜로 엄마 역할 + 태블릿 소식)
        g = await s.ev("""(() => { const o = { l:S.local, r:Sync.ready, k:Sync.kid, last:Sync.last }; Sync.last = { s:{ stickers:JSON.stringify(S.stickers) }, days:{} }; S.local = { fid:'testfamilytestfamily22', role:'mom' }; Sync.ready = true; Sync.kid = { at:Date.now(), ver:'20261105150000', via:'rest' };
            const a = syncAlert(); S.local = Object.assign({}, o.l, { role:'oppa', fid:'testfamilytestfamily22' }); const b = syncAlert(); S.local = o.l; Sync.ready = o.r; Sync.kid = o.k; Sync.last = o.last; return [a, b]; })()""")
        print('G 엄마 줄:', re.sub('<[^>]+>', ' ', g[0])[:80], '| 오빠 줄:', re.sub('<[^>]+>', ' ', g[1])[:90])
        s.expect('버전' not in g[0] and '가족방' not in g[0] and '버전' in g[1], '엄마 폰에 기술 글자가 보이거나 오빠 폰에 진단이 없음')

asyncio.run(main())
