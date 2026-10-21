import os
"""시뮬레이션 4: 한 달(30일) 선물 약속 — 중간에 이틀 빠지고, 30번째 날 선물 축하, 오빠가 선물 준 뒤 다음 약속"""
import asyncio, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Sim

FAST_DAY = """(() => {
  const d = day();
  for (const k of ['kor','math','eng','rev']) {
    if (d.boards[k] && d.boards[k].done) continue;
    const b = d.boards[k] = makeBoard(k); b.intro = true;
    b.correct = Math.round(b.qs.length * .8); b.idx = b.qs.length; b.secs = 840;
    if (k === 'eng') { b.phase = 'dict'; d.dict = { words: pickDict(10), idx: 10, sent: true, graded: false, marks: null, photo: 'data:image/jpeg;base64,' + 'A'.repeat(150000) }; }
    finishBoard(k);
  }
  stopSound();
})()"""

async def main():
    async with Sim('D_한달선물') as s:
        p = s.p
        await s.click('[data-a="start"]')
        await s.adult('oppa'); await p.fill('#gname', '토끼 인형'); await s.click('[data-a="savegift"]')
        await s.ev("go('home')")
        card = await s.ev("document.querySelector('.gift-card').innerText"); print('첫날 선물 카드:', card.replace('\n', ' / '))
        done_days = 0; day_no = 0
        while done_days < 29:
            day_no += 1
            if day_no in (10, 20):   # 이틀은 공부를 못 함
                await s.ev("S.dayOffset++; save(); go('home')"); continue
            await s.ev(FAST_DAY); done_days += 1
            await s.ev("S.dayOffset++; save(); go('home')")
        g = await s.ev("({days:giftDays().length, achieved:S.gift.achieved, bytes:JSON.stringify(S).length, photos:Object.values(S.days).filter(d=>d.dict&&d.dict.photo).length})")
        print('29일 공부 뒤:', g)
        s.expect(g['days'] == 29 and not g['achieved'], f'29일째 상태가 이상함: {g}')
        s.expect(g['photos'] <= 8, f"받아쓰기 사진이 너무 많이 쌓임: {g['photos']}")
        await s.shot('home_29')
        card = await s.ev("document.querySelector('.gift-card').innerText"); print('29일 선물 카드:', card.replace('\n', ' / '))
        s.expect('1일' in card, f'선물까지 1일 남았다는 표시가 아님: {card}')
        # 30번째 날은 진짜로 눌러서
        await s.full_day(photo=True) if False else None
        for k in ['kor', 'math']:
            await s.board(k); await s.after_reward()
        await s.board('eng'); await s.dictation(True); await s.after_reward()
        await s.board('rev')
        await p.wait_for_timeout(300); await s.shot('reward_30')
        await p.locator('.btn.big').last.click(); await p.wait_for_timeout(400)
        await s.shot('alldone_30')
        txt = await s.ev("document.querySelector('.screen').innerText")
        s.expect('30일을 모두 해냈어' in txt and '토끼 인형' in txt, f'30일째 선물 축하가 안 나옴: {txt[:120]}')
        await s.click('[data-a="home"]'); await s.shot('home_30')
        await s.ev("go('gift')"); await p.wait_for_timeout(200); await s.shot('gift_30')
        notes = await s.ev("S.notes.filter(n=>n.text.includes('🎁')).map(n=>n.to+': '+n.text)"); print('선물 알림:', notes)
        s.expect(len(notes) == 2, '선물 달성 알림이 오빠·엄마에게 안 감')
        # 오빠가 선물 주고 다음 약속
        await s.adult('oppa'); await s.shot('oppa_30')
        await s.click('[data-a="giftgiven"]'); await p.wait_for_timeout(150)
        g2 = await s.ev("({round:S.gift.round, start:S.gift.start, days:giftDays().length, name:S.gift.name, hist:S.gift.history.length, today:todayKey()})"); print('다음 약속:', g2)
        s.expect(g2['round'] == 2 and g2['days'] == 0 and g2['hist'] == 1, f'다음 선물 약속이 제대로 시작 안 됨: {g2}')
        await s.next_day(); await s.ev(FAST_DAY); await s.ev("go('home')")
        g3 = await s.ev("giftDays().length"); s.expect(g3 == 1, f'새 약속 첫날이 1일로 안 셈: {g3}')
        await s.ev("go('cal')"); await s.shot('cal_month')
        print('최종 저장 크기:', await s.ev("JSON.stringify(S).length"))

asyncio.run(main())
