"""재윤이 첫 화면 간단하게 (11/4 오후) 검증
- 태블릿 가로·세로에서 스크롤 없이 한 화면, 폰 가로 넘침 없음 (처음 · 하는 중+알림 · 다 끝낸 날)
- 알림은 한 번에 하나만, 누르면 다음 것 (공부 시간 > 엄마 한마디 > 캡슐 > 오빠 칭찬)
- 처음 누른 과목이 그날 맨 앞 (복습을 먼저 누르면 그대로), "뭐부터 할까?" 상자 없음
- 판 설명: 단원 이름만 + 작은 표 (📺 영상 보는 날 · 🔭 미리 맛보기 · 🏆 단원 평가), "차시" 같은 긴 글 없음
- 텃밭 아이콘 점(물뿌리개 · 수확), 아이콘 8개가 각각 제 화면을 엶
- 선물 한 줄 (이름 없음 · 이름 있음 · 받는 날), 뺀 칸(진도 지도 큰 칸 · 스티커 막대 · 바탕화면 놓기)이 없음
- 토끼 이름을 바꾸면 인사말도 그 이름 (받침 조사)"""
import asyncio, re
from harness import Sim

SIZES = [(1280, 800, '태블릿 가로'), (800, 1280, '태블릿 세로'), (384, 832, '폰')]

async def fit(s, tag):
    p = s.p
    for w, h, name in SIZES:
        await p.set_viewport_size({'width': w, 'height': h}); await s.ev("go('home')"); await p.wait_for_timeout(200)
        r = await s.ev("({ h: document.documentElement.scrollHeight, ov: document.documentElement.scrollWidth - innerWidth, ev: (() => { const e = document.querySelector('.ev-banner'), hs = document.querySelector('.hero-side'); return e && hs ? e.offsetWidth - hs.offsetWidth : 0; })(), n: document.querySelectorAll('.alarm-banner').length })")
        print(f'  [{tag}] {name}: 높이 {r["h"]}/{h}, 가로 넘침 {r["ov"]}, 알림 {r["n"]}개')
        s.expect(r['ov'] <= 0, f'{tag} {name}: 가로 넘침 {r["ov"]}')
        s.expect(r['ev'] <= 0, f'{tag} {name}: 깜짝 이벤트 줄이 토리 옆 칸보다 넓음')
        s.expect(r['n'] <= 1, f'{tag} {name}: 알림이 {r["n"]}개 (하나만이어야 함)')
        if name != '폰': s.expect(r['h'] <= h, f'{tag} {name}: 한 화면을 넘음 {r["h"]}/{h}')
        await s.shot(f'{tag}_{w}x{h}')
    await p.set_viewport_size({'width': 1280, 'height': 800}); await s.ev("go('home')")

async def main():
    async with Sim('H_첫화면') as s:
        p = s.p
        await s.ev("window.__ev = 'hunt'")   # 깜짝 이벤트 줄이 보이는 날
        await s.click('[data-a="start"]'); await p.wait_for_timeout(200)
        await p.set_viewport_size({'width': 1280, 'height': 800})

        # ---------- J) 뺀 칸 ----------
        await s.ev("go('home')")
        gone = await s.ev("['.order-pick', '.install-tile', '.next-item', '.map-tile', '.home > p.muted'].filter(q => document.querySelector(q))")
        s.expect(not gone, f'첫 화면에서 뺀 칸이 남아 있음 {gone}')
        s.expect(await s.ev("!!document.querySelector('.hero-side .ev-banner')"), '깜짝 이벤트가 토리 말풍선 아래에 없음')

        # ---------- A) 처음 ----------
        await fit(s, '처음')

        # ---------- D) 판 설명 ----------
        cards = await s.ev("[...document.querySelectorAll('.board-card')].map(b => ({ k: b.dataset.k, s: b.querySelector('.s').textContent, tag: (b.querySelector('.tag') || {}).textContent || '', full: boardSub(b.dataset.k) }))")
        for c in cards: print(f"  {c['k']}: {c['s']} | {c['tag']}   (엄마용: {c['full']})")
        s.expect(not any('차시' in c['s'] or '단원' in c['s'] for c in cards), '판 설명에 "n단원 · n차시" 같은 긴 글이 남음')
        s.expect(all(len(c['s']) <= 22 for c in cards), '판 설명이 너무 김')
        for c in cards:
            if '평가' in c['full']: s.expect(c['tag'] == '🏆 단원 평가', f"{c['k']}: 단원 평가인데 표가 {c['tag']!r}")
            elif '보는 날' in c['full']: s.expect(c['tag'] == '📺 영상 보는 날', f"{c['k']}: 강의 날인데 표가 {c['tag']!r}")
            elif '미리 맛보기' in c['full']: s.expect(c['tag'] == '🔭 미리 맛보기', f"{c['k']}: 미리 맛보기인데 표가 {c['tag']!r}")
        s.expect(any(c['tag'] == '📺 영상 보는 날' for c in cards), '오늘 강의가 있는데 어느 판에도 영상 표가 없음')
        tt = await s.ev("(() => { const c = curr('math'), keep = c.test; c.test = true; const r = boardKid('math'); c.test = keep; return r; })()")
        s.expect(tt['tag'] == '🏆 단원 평가', f'단원 평가 날 표 이상 {tt}')

        # ---------- C) 처음 누른 과목이 맨 앞 ----------
        first = await s.ev("[...document.querySelectorAll('.board-card')].map(b => b.dataset.k)")
        pick = 'eng' if first[0] != 'eng' else 'kor'
        await s.click(f'.board-card[data-k="rev"]'); await p.wait_for_timeout(200)
        s.expect(await s.ev("!day().order"), '복습을 먼저 눌렀는데 순서가 바뀜')
        await s.ev("delete day().boards.rev; RUN = null; go('home')")
        await s.click(f'.board-card[data-k="{pick}"]'); await p.wait_for_timeout(200)
        await s.ev("go('home')"); await p.wait_for_timeout(150)
        order = await s.ev("[...document.querySelectorAll('.board-card')].map(b => b.dataset.k)")
        print('  처음 순서', first, '→', pick, '먼저 누른 뒤', order)
        s.expect(order[0] == pick and order[-1] == 'rev', f'처음 누른 과목이 맨 앞으로 안 옴 {order}')
        s.expect(await s.ev(f"(document.querySelector('.board-card[data-k={pick}] .state') || {{}}).textContent") in ('1번부터', '시작!'), '누른 판 표시 이상')

        # ---------- B) 알림 하나씩 ----------
        await s.ev("""(() => { const _n = now; window.now = () => { const d = _n(); d.setHours(16, 40, 0, 0); return d; };
          S.alarms.on = [true,true,true,true,true,true,true]; S.alarms.time = S.alarms.time.map(() => '16:00');
          for (const k of Object.keys(day().boards)) delete day().boards[k]; delete day().order; RUN = null;
          S.kidNotes = [{ text:'엄마가 받아쓰기 채점했어! 10개 중 9개 맞았어' }, { text:'오늘도 화이팅! 엄마가' }]; save(); go('home'); })()""")
        seq = []
        for _ in range(6):
            await p.wait_for_timeout(120)
            n = await p.locator('.alarm-banner').count(); s.expect(n <= 1, f'알림이 {n}개 한꺼번에')
            if not n: break
            a = await p.locator('.alarm-banner').get_attribute('data-a'); v = await p.locator('.alarm-banner').get_attribute('data-v'); seq.append(f'{a}:{v}' if v else a)
            if a == 'm2':   # 공부 시간 알림은 공부를 시작하면 사라짐
                await s.click('.alarm-banner'); await p.wait_for_timeout(200)
                await s.ev("ACT.board({ dataset:{ k:'kor' } }); go('home')")
            else: await s.click('.alarm-banner'); await p.wait_for_timeout(150); await s.ev("go('home')")
        print('  알림 순서:', seq)
        s.expect(seq[:2] == ['kidnote', 'kidnote'] and 'm2' not in seq, f'알림 순서 이상 {seq}')   # 11/5: 공부 시간 배너(m2) 없앰
        await fit(s, '하는 중')

        # 다 끝낸 날: 캡슐 → (열고 나면) 오빠 칭찬 다시 듣기
        await s.ev("window.now = (() => { const f = window.now; return () => { const d = f(); d.setHours(19, 0, 0, 0); return d; }; })(); const d = day(); BOARDS.forEach(b => { d.boards[b.k] = d.boards[b.k] || makeBoard(b.k); d.boards[b.k].done = true; }); d.done = true; S.praise = { text:'재윤아 오늘도 최고!' }; save(); go('home')")
        await p.wait_for_timeout(150)
        s.expect(await s.ev("(document.querySelector('.alarm-banner') || {}).dataset?.v") == 'capsule', '다 끝낸 날 캡슐 알림이 먼저 안 나옴')
        await s.ev("day().capsule = { opened:true, id:'c01' }; go('home')"); await p.wait_for_timeout(120)
        s.expect(await s.ev("(document.querySelector('.alarm-banner') || {}).dataset?.v") == 'alldone', '캡슐을 연 뒤 "오빠 칭찬 다시 듣기"가 없음')
        done_state = await s.ev("[...document.querySelectorAll('.board-card .state')].map(x => x.textContent)")
        s.expect(all('다 했어' in x for x in done_state) and await s.ev("document.querySelectorAll('.board-card .tag').length") == 0, f'다 끝낸 판 표시 이상 {done_state}')
        await fit(s, '다 한 날')

        # ---------- E) 놀이터 점 (11/9: 텃밭은 놀이터 안으로 — 할 게 있으면 놀이터 아이콘에 점) ----------
        await s.ev("gardenState().cans = 3; go('home')")
        g = await s.ev("(() => { const t = document.querySelector('.home-nav .play-tile'); return { dot: (t.querySelector('.dot') || {}).textContent, ping: t.classList.contains('ping') }; })()")
        s.expect(g['dot'] == '🪣3' and g['ping'], f'물뿌리개 점 이상 {g}')
        await s.ev("const g = gardenState(); g.cans = 0; g.plots[0] = { s:'carrot', w:99 }; go('home')")
        g = await s.ev("(document.querySelector('.home-nav .play-tile .dot') || {}).textContent")
        s.expect(g == '수확!', f'수확 점 이상 {g}'); await s.ev("gardenState().plots[0] = null; save()")

        # ---------- F) 아이콘마다 제 화면 (11/9: 8개 → 5개, 놀이 4개는 놀이터 안) ----------
        tiles = await s.ev("[...document.querySelectorAll('.home-nav .nav-tile')].map(t => t.querySelector('.nm').textContent)")
        print('  아이콘:', tiles); s.expect(len(tiles) == 5, f'아이콘 수 {len(tiles)}')
        want = {'놀이터':'play', '달력':'cal', '진도 지도':'map', '오답노트':'notebook', '오빠에게 말하기':'suggest'}
        for name, scr in want.items():
            for w, h, _ in SIZES[:2]:
                await p.set_viewport_size({'width': w, 'height': h}); await s.ev("go('home')"); await p.wait_for_timeout(120)
                await p.locator('.home-nav .nav-tile', has_text=name).first.click(); await p.wait_for_timeout(200)
                got = await s.screen(); s.expect(got == scr, f'"{name}" → {got} (기대 {scr})')
                await s.overflow(f'{name} 화면 {w}x{h}')
        for name, scr in {'텃밭':'garden', '꾸미기':'room', '도감':'book', '오빠에게 문제 내기':'kq'}.items():
            for w, h, _ in SIZES[:2]:
                await p.set_viewport_size({'width': w, 'height': h}); await s.ev("go('play')"); await p.wait_for_timeout(120)
                await p.locator('.play-card', has_text=name).first.click(); await p.wait_for_timeout(200)
                got = await s.screen(); s.expect(got == scr, f'놀이터 "{name}" → {got} (기대 {scr})')
                await s.overflow(f'{name} 화면 {w}x{h}')
                await p.locator('section .row .icon-btn').first.click(); await p.wait_for_timeout(150)
                s.expect(await s.screen() == 'play', f'{name}에서 ← 가 놀이터로 안 감 ({await s.screen()})')
        await p.set_viewport_size({'width': 1280, 'height': 800})

        # ---------- G) 선물 한 줄 ----------
        async def gift(): await s.ev("go('home')"); await p.wait_for_timeout(100); return await s.ev("document.querySelector('.home .gift-card').innerText.replace(/\\s+/g, ' ')")
        await s.ev("S.gift.name = ''; S.giftAch = {}; S.gift.achieved = null")
        t = await gift(); print('  선물(이름 없음):', t); s.expect('오빠 선물까지' in t and '남았어' in t and '선물 적기' in t, f'이름 없는 선물 줄 이상 {t}')
        await s.ev("S.gift.name = '색연필 세트'")
        t = await gift(); print('  선물(이름):', t); s.expect('색연필 세트까지' in t and '남았어' in t and '선물 적기' not in t, f'선물 이름 줄 이상 {t}')
        await s.ev("S.giftAch = { [S.gift.round]: todayKey() }")
        t = await gift(); print('  선물(받는 날):', t); s.expect('받는 날' in t and '색연필 세트' in t, f'선물 받는 날 줄 이상 {t}')
        await s.ev("S.giftAch = {}; save()")

        # ---------- H) 토끼 이름 ----------
        bad = []
        for hr in (8, 15, 20):
            for nm in ('몽실', '토리'):
                txt = await s.ev(f"""(() => {{ S.bunnyName = '{nm}'; const keep = window.now; window.now = () => {{ const d = new Date(); d.setDate(d.getDate() + (S.dayOffset || 0) + 30); d.setHours({hr}, 0, 0, 0); while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1); return d; }};
                  const t = greeting({{ boards:{{}}, done:false }}) + ' / ' + greeting({{ boards:{{}}, done:true }}); window.now = keep; return t; }})()""")
                wrong = (nm + '가 ', nm + '랑 ') if nm == '몽실' else (nm + '이가', nm + '이랑')   # 받침 있으면 이가·이랑, 없으면 가·랑
                if any(x in txt for x in wrong) or (nm != '토리' and '토리' in txt): bad.append((nm, txt))
        s.expect(not bad, f'인사말 조사·이름 이상 {bad[:2]}')
        await s.ev("S.bunnyName = '토리'; save()")
        s.expect(not s.errors, '오류')

asyncio.run(main())
