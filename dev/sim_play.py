"""2026-11-09 🎮 놀이터 (오빠: "재윤이 게임들을 게임 목록으로", 열리는 때 = 3번 "한 판 끝내면")
A) 아침(아직 한 판도 안 끝냄): 첫 화면 아이콘 5개, 놀이터는 🔒 · 누르면 첫 화면 그대로 + 토리가 "한 판 끝내면 열려" · go('play')로 들어가도 첫 화면으로
   - 잠겨 있을 때는 텃밭 물뿌리개가 있어도 점이 안 뜸 (공부 전에 놀이로 끌지 않게)
B) 한 판(국어)을 진짜로 끝냄 → 놀이터 열림(🎮), 물뿌리개 점 → 들어가면 카드 4장(텃밭·꾸미기·도감·문제 내기)과 상태 글
C) 카드마다 제 화면 → ← 누르면 놀이터, 놀이터 ← 는 첫 화면 / 문제 내기 "돌아가기"도 놀이터
D) 텃밭에서 물 주고 수확 → 놀이터 카드 글이 바뀜, 점 사라짐 / 오빠가 문제에 답함 → 놀이터 아이콘·카드에 "새 답!" → 누르면 결과 화면
E) 다음 날 아침 → 다시 잠김, 판을 열기만 하고 안 끝내면 그대로 잠김
F) 화면 넘침·한 화면: 태블릿 가로·세로·폰에서 놀이터, 첫 화면 한 화면 (태블릿 가로·세로)"""
import asyncio, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Sim

SIZES = [(1280, 800, '태블릿 가로'), (800, 1280, '태블릿 세로'), (384, 832, '폰')]

async def answer_right(s):
    q = await s.ev("({ans:RUN.q.ans})")
    await s.ev(f"answer({json.dumps(q['ans'], ensure_ascii=False)})")
    await s.p.wait_for_timeout(1250)

async def finish_board(s, k):
    p = s.p
    await s.ev("go('home')"); await s.click(f'[data-k="{k}"]'); await p.wait_for_timeout(200)
    await s.click('[data-a="begin"]'); await p.wait_for_timeout(200)
    await s.through_lecture()
    for _ in range(80):
        sc = await s.screen()
        if sc == 'q': await answer_right(s)
        elif sc == 'write': await s.click('[data-a="writeskip"]'); await p.wait_for_timeout(200)
        elif sc in ('cards',):
            await s.ev("(() => { const b = document.querySelector('[data-a=cardnext],[data-a=cardsdone],[data-a=next]'); if (b) b.click(); })()"); await p.wait_for_timeout(150)
        else: break
    return await s.ev(f"!!(day().boards['{k}'] && day().boards['{k}'].done)")

async def main():
    async with Sim('P_놀이터') as s:
        p = s.p
        await s.click('[data-a="start"]'); await p.wait_for_timeout(200)
        await s.ev("window.__ev = 'off'; S.ebsOn = { math:false, kor:false }; delete day().lec; gardenState().cans = 3; save(); go('home')")
        # ---------- A) 잠김 ----------
        tiles = await s.ev("[...document.querySelectorAll('.home-nav .nav-tile')].map(t => t.querySelector('.nm').textContent)")
        print('A 아이콘:', tiles); s.expect(tiles[0] == '놀이터' and len(tiles) == 5, f'아이콘 이상 {tiles}')
        a = await s.ev("(() => { const t = document.querySelector('.play-tile'); return { locked:t.classList.contains('locked'), ic:t.querySelector('.ic').textContent, dot:!!t.querySelector('.dot'), open:playOpen() }; })()")
        print('A 놀이터 칸:', a); s.expect(a['locked'] and a['ic'] == '🔒' and not a['dot'] and not a['open'], f'아침 놀이터가 안 잠김 {a}')
        await s.click('.play-tile'); await p.wait_for_timeout(250)
        bub = await s.ev("document.querySelector('#heroBubble').textContent"); said = await s.ev("window.__said.slice(-1)[0] || ''")
        print('A 잠김 누름:', await s.screen(), '|', bub)
        s.expect(await s.screen() == 'home' and '한 판' in bub and '한 판' in said, '잠긴 놀이터를 눌렀을 때 안내가 없음')
        await s.ev("go('play')"); await p.wait_for_timeout(150)
        s.expect(await s.screen() == 'home', '잠겼는데 go("play")로 들어가짐')
        await s.ev("go('garden')"); await p.wait_for_timeout(150)
        s.expect(await s.ev("document.querySelector('section .row .icon-btn').dataset.a") == 'home', '잠겼을 때 텃밭 ← 가 첫 화면이 아님')
        # ---------- B) 한 판 끝 → 열림 ----------
        ok = await finish_board(s, 'kor'); print('B 국어 판 끝:', ok, await s.screen())
        s.expect(ok, '국어 판을 못 끝냄')
        await s.ev("go('home')"); await p.wait_for_timeout(150)
        b = await s.ev("(() => { const t = document.querySelector('.play-tile'); return { locked:t.classList.contains('locked'), ic:t.querySelector('.ic').textContent, dot:(t.querySelector('.dot')||{}).textContent || '' }; })()")
        print('B 놀이터 칸:', b); s.expect(not b['locked'] and b['ic'] == '🎮' and b['dot'].startswith('🪣'), f'한 판 끝냈는데 놀이터 이상 {b}')
        await s.click('.play-tile'); await p.wait_for_timeout(200)
        s.expect(await s.screen() == 'play', '놀이터가 안 열림')
        cards = await s.ev("[...document.querySelectorAll('.play-card')].map(c => ({ n:c.querySelector('b').textContent, sub:c.querySelector('small').textContent, dot:(c.querySelector('.dot')||{}).textContent || '' }))")
        print('B 카드:', cards); s.expect([c['n'] for c in cards] == ['텃밭', '꾸미기', '도감', '오빠에게 문제 내기'] and all(c['sub'] for c in cards), f'카드 이상 {cards}')
        s.expect(cards[0]['dot'].startswith('🪣') and '물뿌리개' in cards[0]['sub'], '텃밭 카드에 물뿌리개 표시 없음')
        s.expect('⭐' in cards[1]['sub'] and '/' in cards[2]['sub'] and ':' in cards[3]['sub'], f'카드 상태 글 이상 {cards}')
        await s.shot('play_tab')
        # ---------- C) 카드 → 화면 → ← 놀이터 → ← 첫 화면 ----------
        for name, scr in [('텃밭', 'garden'), ('꾸미기', 'room'), ('도감', 'book'), ('오빠에게 문제 내기', 'kq')]:
            await s.ev("go('play')"); await p.wait_for_timeout(120)
            await p.locator('.play-card', has_text=name).first.click(); await p.wait_for_timeout(200)
            s.expect(await s.screen() == scr, f'{name} → {await s.screen()}')
            await p.locator('section .row .icon-btn').first.click(); await p.wait_for_timeout(150)
            s.expect(await s.screen() == 'play', f'{name} ← 가 놀이터로 안 감 ({await s.screen()})')
        await s.ev("go('kq')"); await s.click('[data-a="kqtype"][data-v="riddle"]'); await p.wait_for_timeout(100)
        await s.click('[data-a="kqback"]'); await s.click('[data-a="kqback"]'); await p.wait_for_timeout(150)
        s.expect(await s.screen() == 'play', f'문제 만들다 돌아가기 두 번 → 놀이터가 아님 ({await s.screen()})')
        await p.locator('section .row .icon-btn').first.click(); await p.wait_for_timeout(150)
        s.expect(await s.screen() == 'home', '놀이터 ← 가 첫 화면이 아님')
        # ---------- D) 텃밭 → 카드 글·점 / 오빠 답 → 새 답 ----------
        await s.ev("go('garden')"); await s.click('[data-a="plot"][data-v="0"]'); await s.click('[data-a="plant"][data-v="carrot"]')
        for _ in range(4): await s.click('[data-a="plot"][data-v="0"]'); await p.wait_for_timeout(100)
        st = await s.ev("({cans:gardenState().cans, plot:S.garden.plots[0], harv:S.garden.harvests})"); print('D 텃밭:', st)
        s.expect(st['harv'] == 1 and not st['plot'], f'텃밭 수확 이상 {st}')
        await s.ev("go('home')"); await p.wait_for_timeout(100)
        dot = await s.ev("(document.querySelector('.play-tile .dot') || {}).textContent || ''")
        s.expect(dot == '' if st['cans'] == 0 else dot.startswith('🪣'), f'물뿌리개를 다 썼는데 점이 남음 {dot!r}')
        # 오빠가 답함 (가짜: 재윤이 문제 하나 + 답)
        await s.ev("(() => { const id = 'kqtest1'; KQ.list[id] = { id, type:'riddle', text:'나는 누구일까요?', ans:'토리', at:Date.now() - 60000 }; KQ.ans[id] = { guess:'곰', right:false, at:Date.now() }; go('home'); })()"); await p.wait_for_timeout(150)
        d2 = await s.ev("(document.querySelector('.play-tile .dot') || {}).textContent || ''"); print('D 오빠 답 뒤 점:', d2)
        s.expect(d2 == '새 답!' or d2.startswith('🪣'), f'오빠 답이 와도 놀이터 점이 없음 {d2!r}')
        await s.ev("go('play')"); await p.wait_for_timeout(100)
        kc = await s.ev("(() => { const c = document.querySelector('.play-card.c-kq'); return { dot:(c.querySelector('.dot')||{}).textContent || '', act:c.dataset.a, sub:c.querySelector('small').textContent }; })()")
        print('D 문제 카드:', kc); s.expect(kc['dot'] == '새 답!' and kc['act'] == 'kqseen' and '답했어' in kc['sub'], f'문제 내기 카드에 새 답 표시 없음 {kc}')
        await s.click('.play-card.c-kq'); await p.wait_for_timeout(200)
        s.expect(await s.screen() == 'kq', '새 답 카드 → 문제 화면이 아님')
        await s.ev("go('play')"); await p.wait_for_timeout(100)
        s.expect(await s.ev("(document.querySelector('.play-card.c-kq .dot') || {}).textContent || ''") == '', '결과를 본 뒤에도 새 답 점이 남음')
        # ---------- F) 넘침 · 한 화면 ----------
        for w, h, tag in SIZES:
            await p.set_viewport_size({'width': w, 'height': h})
            await s.ev("go('play')"); await p.wait_for_timeout(150); await s.overflow(f'놀이터 {tag}')
            ph = await s.ev("document.documentElement.scrollHeight"); print(f'F 놀이터 {tag} 높이 {ph}')
            s.expect(ph <= h + 2, f'놀이터가 한 화면을 넘음 ({tag} {ph}px)')
            await s.ev("go('home')"); await p.wait_for_timeout(150); await s.overflow(f'첫 화면 {tag}')
            hh = await s.ev("document.documentElement.scrollHeight"); print(f'F 첫 화면 {tag} 높이 {hh}')
            if tag != '폰': s.expect(hh <= h + 2, f'첫 화면이 한 화면을 넘음 ({tag} {hh}px)')
            await s.shot(f'play_home_{w}x{h}')
            await s.ev("go('play')"); await p.wait_for_timeout(100); await s.shot(f'play_{w}x{h}')
        await p.set_viewport_size({'width': 1280, 'height': 800})
        # ---------- E) 다음 날 → 다시 잠김, 판을 열기만 하면 그대로 ----------
        await s.ev("S.dayOffset = (S.dayOffset || 0) + 1; RUN = null; save(); go('home')"); await p.wait_for_timeout(150)
        s.expect(not await s.ev("playOpen()") and await s.ev("document.querySelector('.play-tile').classList.contains('locked')"), '다음 날 아침 놀이터가 안 잠김')
        await s.click('[data-k="math"]'); await p.wait_for_timeout(150); await s.click('[data-a="begin"]'); await p.wait_for_timeout(200)
        await s.ev("go('home')"); await p.wait_for_timeout(100)
        s.expect(not await s.ev("playOpen()"), '판을 열기만 했는데 놀이터가 열림')
        ok = await finish_board(s, 'math'); print('E 수학 판 끝:', ok)
        s.expect(ok and await s.ev("playOpen()"), '다음 날 한 판 끝냈는데 놀이터가 안 열림')

asyncio.run(main())
