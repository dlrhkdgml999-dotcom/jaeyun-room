import os
"""시뮬레이션 3: 중간에 나갔다 오기 · 앱 다시 열기 · 날짜 바뀜 · 알림 · 이름 바꾸기 · 저장공간 꽉 참"""
import asyncio, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Sim

async def main():
    async with Sim('C_중간에나가기') as s:
        p = s.p
        await s.click('[data-a="start"]')
        # 1) 국어 3문제 풀고 나가기 → 다시 열기 → 이어서
        await s.click('[data-k="kor"]'); await p.wait_for_timeout(200)
        said = await s.ev('window.__said'); s.expect('[clip]' in said, f'국어 시작 때 엄마 목소리가 안 나옴: {said}')
        await s.click('[data-a="begin"]')
        for _ in range(3): await s.answer(None)
        key4 = await s.ev('RUN.q.key')
        await s.click('[data-a="home"]'); await p.wait_for_timeout(150)
        lab = await s.ev("document.querySelector('[data-k=kor] .state').textContent"); s.expect(lab == '4번부터', f'홈 표시가 4번부터가 아님: {lab}')
        await p.reload(); await p.wait_for_timeout(400)
        s.expect(await s.screen() == 'home', '다시 열었을 때 홈이 아님')
        await s.click('[data-k="kor"]'); await p.wait_for_timeout(200)
        intro = await s.ev("document.querySelector('.screen').innerText"); s.expect('이어서' in intro, '이어서 하기 안내가 없음')
        await s.click('[data-a="begin"]'); await p.wait_for_timeout(100)
        s.expect(await s.ev('RUN.q.key') == key4, '다시 열고 이어 풀 때 다른 문제가 나옴')
        while await s.screen() == 'q': await s.answer(None)
        await s.after_reward()

        # 2) 영어 끝 → 받아쓰기 4개 하고 나가기 → 다시 열기 → 5번부터
        await s.board('eng')
        await s.dictation(stop_at=4)
        await s.click('[data-a="home"]'); await p.reload(); await p.wait_for_timeout(400)
        lab = await s.ev("document.querySelector('[data-k=eng] .state').textContent"); print('영어 판 표시:', lab)
        await s.click('[data-k="eng"]'); await p.wait_for_timeout(200); await s.click('[data-a="begin"]'); await p.wait_for_timeout(100); await s.through_lecture()
        n = await s.ev("document.querySelector('.dict-num').textContent"); s.expect(n == '5번', f'받아쓰기가 5번부터가 아님: {n}')
        await p.wait_for_timeout(950)
        i0 = await s.ev('day().dict.idx'); await s.ev("ACT.dictnext(); setTimeout(()=>document.querySelector('[data-a=dictnext]') && ACT.dictnext(), 150)"); await p.wait_for_timeout(400)
        s.expect(await s.ev('day().dict.idx') == i0 + 1, '"다 썼어요"를 빨리 두 번 누르면 한 낱말이 건너뛰어짐')
        for _ in range(5): await p.wait_for_timeout(950); await s.click('[data-a="dictnext"]')
        # 사진 화면에서 나갔다가 다시
        await s.click('[data-a="home"]'); await p.reload(); await p.wait_for_timeout(300)
        await s.click('[data-k="eng"]'); await p.wait_for_timeout(200); await s.click('[data-a="begin"]'); await p.wait_for_timeout(150)
        s.expect(await s.screen() == 'photo', f'사진 화면으로 안 돌아옴: {await s.screen()}')
        # 사진 없이 끝내기 + 버튼 두 번 눌림 대비
        before = await s.ev('S.stickers.length')
        await s.ev("ACT.skipphoto(); ACT.skipphoto();"); await p.wait_for_timeout(200)
        after = await s.ev('S.stickers.length'); s.expect(after - before == 1, f'두 번 눌렀더니 스티커가 {after-before}개 생김')
        await s.after_reward()

        # 3) 수학 2문제만 풀고 날짜가 바뀜
        await s.click('[data-k="math"]'); await p.wait_for_timeout(200); await s.click('[data-a="begin"]'); await p.wait_for_timeout(150); await s.through_lecture()
        for _ in range(2): await s.answer(None)
        await s.click('[data-a="home"]')
        await s.next_day()
        st = await s.ev("BOARDS.map(b=>boardState(b.k))"); s.expect(st == ['todo'] * 4, f'다음 날인데 판 상태가 새로 시작이 아님: {st}')
        await s.shot('day2_home')

        # 4) 비밀번호 틀림
        await s.ev("go('pin')")
        for ch in '1234': await s.click(f'[data-a="pin"][data-v="{ch}"]')
        s.expect(await s.screen() == 'pin', '틀린 비밀번호로 들어가짐')

        # 5) 공부 알림 시간이 지났는데 시작 안 함 → 재윤이 배너 + 엄마 알림
        await s.ev("const _n=now; window.now=()=>{const d=_n(); d.setHours(16,40,0,0); return d;}; S.alarms.on=[true,true,true,true,true,true,true]; S.alarms.time=S.alarms.time.map(()=>'16:00'); save(); go('home')")
        s.expect(await p.locator('[data-a="m2"]').count() == 1, '공부 알림 배너가 안 보임')
        await s.ev('window.__said=[]'); await s.click('[data-a="m2"]'); await p.wait_for_timeout(300)
        s.expect('[clip]' in await s.ev('window.__said'), '배너 눌러도 엄마 목소리 #2가 안 나옴')
        await s.adult('mom')
        txt = await s.ev("document.querySelector('.screen').innerText"); s.expect('30분이 지났는데' in txt, '엄마 알림함에 늦음 알림이 없음')
        await s.shot('mom_nudge'); await s.overflow('mom')

        # 6) 토끼 이름 바꾸기 (받침 있는 이름)
        await s.click('[data-a="atab"][data-v="set"]'); await p.fill('#bname', '몽실'); await s.click('[data-a="savename"]')
        await s.ev("go('home')"); txt = await s.ev("document.querySelector('.screen').innerText")
        s.expect('몽실이랑 친구' in txt, f'이름 조사가 어색함: {txt[:80]}')
        await s.click('[data-k="kor"]'); await p.wait_for_timeout(200); await s.click('[data-a="home"]')

        # 7) 꾸미기 잠긴 아이템 누르기, 달력 앞뒤 넘기기
        await s.click('[data-v="room"]'); await s.ev("document.querySelector('[data-v=tiara]').click()")
        s.expect(await s.ev('S.equipped.head') != 'tiara', '잠긴 아이템이 입혀짐')
        await s.click('[data-a="home"]'); await s.click('[data-v="cal"]')
        for _ in range(3): await s.click('[data-a="calmove"][data-v="1"]')
        for _ in range(14): await s.click('[data-a="calmove"][data-v="-1"]')
        print('달력:', await s.ev("document.querySelector('.disp').textContent"))
        await s.click('[data-a="home"]')

        # 8) 폰 저장공간이 거의 찼을 때
        await s.ev("""(()=>{ try{ let i=0; const big='x'.repeat(500000); while(i<20){ localStorage.setItem('junk'+i, big); i++; } }catch(e){} })()""")
        await s.ev("S.praise={text:'테스트', audio:'data:audio/mp3;base64,'+'A'.repeat(900000)}; save();")
        await p.wait_for_timeout(300)
        toast = await s.ev("[...document.querySelectorAll('.toast')].map(t=>t.textContent)"); print('저장공간 부족 안내:', toast)
        s.expect(await s.screen() == 'home', '저장공간이 꽉 차니 화면이 깨짐')
        await s.ev("for(let i=0;i<20;i++) localStorage.removeItem('junk'+i)")

        # 9) 360px 작은 폰에서 모든 화면 넘침 검사
        await p.set_viewport_size({'width': 360, 'height': 740})
        for v in ['home', 'room', 'cal', 'gift', 'adult', 'install']:
            await s.ev(f"go('{v}')"); await p.wait_for_timeout(120); await s.overflow(v + '@360')
        await s.ev("S.adultTab='oppa'; go('adult')"); await s.overflow('oppa@360')
        await s.ev("S.adultTab='set'; go('adult')"); await s.overflow('set@360')
        await s.ev("go('install',{who:'mom'})"); await s.overflow('install-mom@360')

        # 10) 처음부터 다시
        await s.ev("go('adult')"); await s.click('[data-a="reset"]'); await s.click('[data-a="reset"]')
        s.expect(await s.screen() in ('home', 'welcome') and 'start' in await s.ev("document.body.innerHTML"), '초기화 뒤 첫 만남 화면이 아님')

asyncio.run(main())
