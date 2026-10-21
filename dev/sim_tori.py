"""토리랑 놀기: 귀 · 얼굴 · 몸 누르기, 쓰다듬기, 연타, 수수께끼, 공부 안내, 입 움직임, 꾸미기 방"""
import asyncio, sys
sys.path.insert(0, '.')
from harness import Sim

async def tap_at(s, fx, fy):
    """토리 그림 안의 비율 위치(fx, fy)를 진짜 손가락처럼 누른다"""
    box = await s.p.locator('.tori-stage svg.bunny').first.bounding_box()
    await s.p.mouse.click(box['x'] + box['width'] * fx, box['y'] + box['height'] * fy)

async def state(s):
    return await s.ev("""(() => { const svg = document.querySelector('.tori-stage svg.bunny'); const b = document.querySelector('#heroBubble') || document.querySelector('.tori-say');
      return { cls: svg ? svg.getAttribute('class') : '', bubble: b ? b.textContent : '', said: window.__said.slice(-3), fx: document.querySelectorAll('.tori-fx').length }; })()""")

async def main():
    async with Sim('T_토리랑 놀기') as s:
        p = s.p
        await s.click('[data-a="start"]'); await p.wait_for_timeout(300)
        if await s.screen() != 'home': await s.ev("go('home')"); await p.wait_for_timeout(200)
        await s.ev("window.__dur = 700")

        # 1) 귀
        await tap_at(s, .5, .15); await p.wait_for_timeout(120)
        st = await state(s); print('귀:', st)
        s.expect('t-flap' in st['cls'], '귀를 눌렀는데 귀가 안 움직임')
        s.expect('talking' in st['cls'], '말할 때 입이 안 움직임')
        s.expect(st['bubble'] and st['bubble'] in ' '.join(st['said']), '말풍선과 목소리가 다름')
        s.expect(st['fx'] > 0, '반짝이 효과 없음')
        await p.wait_for_timeout(1500)
        s.expect('talking' not in (await state(s))['cls'], '말이 끝났는데 입이 계속 움직임')
        await s.shot('ears')

        # 2) 몸 (발)
        await tap_at(s, .5, .9); await p.wait_for_timeout(120)
        st = await state(s); print('몸:', st)
        s.expect('t-dance' in st['cls'] or 't-bigjump' in st['cls'], '몸을 눌렀는데 춤/점프 안 함')
        await p.wait_for_timeout(1500)

        # 3) 얼굴 여러 번 (천천히) → 여러 말, 수수께끼, 영어
        seen, riddle, english = set(), 0, 0
        for i in range(40):
            await s.ev("Tori._state()")
            await tap_at(s, .5, .55); await p.wait_for_timeout(150)
            st = await state(s); seen.add(st['bubble'])
            if '수수께끼' in ' '.join(st['said']) or '정답!' in st['bubble']:
                riddle += 1
                await p.wait_for_timeout(2700)   # 연타로 안 잡히게 쉬었다가
                await tap_at(s, .5, .55); await p.wait_for_timeout(150)
                ans = await state(s); s.expect('정답은' in ans['bubble'], '수수께끼 정답이 안 나옴: ' + ans['bubble'])
            if any(x.isascii() and any(c.isalpha() for c in x) for x in st['said']): english += 1
            await p.wait_for_timeout(2700)
            await s.ev("window.__said.length > 200 && (window.__said = [])")
            # 공부 안내가 나오면 기록
            if '공부 먼저' in st['bubble'] or '기다릴게' in st['bubble']:
                s.nudged = True
                card = await s.ev("!!document.querySelector('.board-card.t-call')")
                s.expect(card, '공부 안내인데 다음 판 카드가 안 반짝임')
                print('공부 안내:', st['bubble'], '| 몇 번째:', i + 3)
        print('얼굴 말 종류:', len(seen), '| 수수께끼:', riddle, '| 영어:', english)
        s.expect(len(seen) >= 12, f'말이 너무 반복됨 ({len(seen)}가지)')
        s.expect(getattr(s, 'nudged', False), '많이 놀아도 공부 안내가 안 나옴')
        bad = [b for b in seen if 'undefined' in b or 'null' in b or 'NaN' in b]
        s.expect(not bad, f'이상한 말: {bad}')
        for b in sorted(seen): print('  ·', b.replace('\n', ' / '))

        # 4) 연타 → 어지러움 (공부 안내 횟수 영향 없게 오늘 공부 끝난 상태로)
        await s.ev("day().done = true; go('home')"); await p.wait_for_timeout(200)
        for _ in range(7): await tap_at(s, .5, .55); await p.wait_for_timeout(60)
        await p.wait_for_timeout(80)
        st = await state(s); print('연타:', st['bubble'], st['cls'])
        s.expect('e-dizzy' in st['cls'] or 't-spin' in st['cls'], '연타했는데 어지러워하지 않음')
        await s.shot('dizzy')
        await p.wait_for_timeout(2600)

        # 5) 쓰다듬기: 길게 누르기
        box = await p.locator('.tori-stage svg.bunny').first.bounding_box()
        cx, cy = box['x'] + box['width'] / 2, box['y'] + box['height'] * .55
        await p.mouse.move(cx, cy); await p.mouse.down(); await p.wait_for_timeout(900)
        st = await state(s); print('쓰다듬기:', st['bubble'], st['cls'], 'fx', st['fx'])
        s.expect('e-love' in st['cls'] and 't-purr' in st['cls'], '길게 눌렀는데 하트 눈/골골이 안 됨')
        await s.shot('pet')
        await p.mouse.up(); await p.wait_for_timeout(200)
        st2 = await state(s)
        s.expect('t-purr' not in st2['cls'], '손 뗐는데 계속 골골')
        s.expect(st2['bubble'] == st['bubble'], '쓰다듬기 끝나고 클릭이 또 반응함')
        await p.wait_for_timeout(1800)

        # 6) 쓰다듬기: 문지르기
        await p.mouse.move(cx - 40, cy); await p.mouse.down()
        for k in range(8): await p.mouse.move(cx - 40 + (k % 2) * 80, cy, steps=3); await p.wait_for_timeout(40)
        st = await state(s); s.expect('e-love' in st['cls'], '문질렀는데 쓰다듬기로 안 봄')
        await p.mouse.up(); await p.wait_for_timeout(2000)
        s.expect('e-love' not in (await state(s))['cls'], '쓰다듬기 표정이 안 돌아옴')

        # 7) 혼자 꼼지락 (가만히 두면)
        await s.ev("go('home')"); await p.wait_for_timeout(100)
        moved = await s.ev("""new Promise(res => { const svg = document.querySelector('.tori-stage svg.bunny'); const seen = new Set();
          const ob = new MutationObserver(() => seen.add(svg.getAttribute('class'))); ob.observe(svg, { attributes:true });
          setTimeout(() => { ob.disconnect(); res([...seen]); }, 23000); })""")
        print('가만히 둘 때:', moved)
        s.expect(len(moved) > 0, '가만히 두면 전혀 안 움직임')
        s.expect(not any('talking' in m for m in moved), '혼자 있을 때 말을 함 (조용해야 함)')

        # 8) 꾸미기 방
        await s.ev("go('room')"); await p.wait_for_timeout(200)
        await tap_at(s, .5, .55); await p.wait_for_timeout(150)
        st = await state(s); print('꾸미기 방:', st['bubble'])
        s.expect(bool(st['bubble']), '꾸미기 방에서 말풍선이 안 나옴')
        await s.shot('room'); await s.overflow('꾸미기 방 토리')

        # 9) 표정 바뀐 그림이 깨지지 않는지 (모든 표정)
        for e in ['normal','happy','wow','think','love','dizzy','wink','sleepy']:
            h = await s.ev(f"bunnySVG({{ expr:'{e}' }})")
            s.expect('undefined' not in h and 'class="eyes"' in h, f'표정 {e} 그림 이상')
        s.expect(not s.errors, '페이지 오류')

asyncio.run(main())
