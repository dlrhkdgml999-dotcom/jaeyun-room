"""EBS 강의 바로가기
- 수학 1-2: 앱에 들어 있음 (오빠가 보낸 1·3·4·65강 주소와 똑같이 나와야 함)
- 국어 1-2: 오빠가 재생 주소를 붙여넣기 → 저장 → 짐작 규칙, 다른 강좌·같은 주소 두 번 거절
- 강의 안내 버튼이 그 강의 재생 주소로"""
import asyncio, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Sim, SHOTS
P = 'https://primary.ebs.co.kr/pleasure/course/player/main/index?cid={c}&sid=STEP1000010212&lid=LS00000000{n}&eno=1&encType=M05&captionYn=N&indexPosition='
REAL = {1:152376470, 3:152376472, 4:152376473, 65:152376534}   # 오빠가 보낸 수학 1-2 주소
async def main():
    async with Sim('ebslink') as s:
        p = s.p
        await s.ev("go('home'); S.ebsPlayer = true")   # 재생 주소 확인 (스위치 켠 상태)
        mc = await s.ev("String(CURRS.math.now.ebs.id)"); kc = await s.ev("String(CURRS.kor.now.ebs.id)")
        # 1) 수학 1-2는 앱에 들어 있음: 보낸 주소와 똑같이
        for n, lid in REAL.items():
            u = await s.ev(f"ebsCourseUrl('math', CURRS.math.now.lectOff + {n})")
            s.expect(u == P.format(c=mc, n=lid), f'수학 {n}강 주소 다름: {u}')
        print('수학 01강:', await s.ev("ebsCourseUrl('math', CURRS.math.now.lectOff + 1)"))
        s.expect(await s.ev("ebsLinkOf('math', CURRS.math.now.lectOff + 66)") is None, '66강은 없어야 함')
        # 2) 짐작 규칙 · 주소 읽기
        g = await s.ev("""({
          two1: ebsGuess({1:'LS00000000152379081', 2:'LS00000000152379082'}, 5),
          two3: ebsGuess({1:'LS00000000152379081', 3:'LS00000000152379087'}, 5),
          three: ebsGuess({1:'LS00000000152379081', 3:'LS00000000152379087', 6:'LS00000000152379096'}, 10),
          bad: ebsGuess({1:'LS00000000152379081', 2:'LS00000000152379082', 4:'LS00000000152379099'}, 3),
          p1: parseEbsUrl('%s'),
          p2: parseEbsUrl('https://primary.ebs.co.kr/course/view?lectId=LS0000000010952828&courseId=10033684'),
          p3: parseEbsUrl('https://primary.ebs.co.kr/course/view?courseId=100005137'),
        })""" % P.format(c=mc, n=152376472))
        print('짐작·읽기:', g)
        s.expect(g['two1'] == 'LS00000000152379085' and g['two3'] is None and g['three'] == 'LS00000000152379108' and g['bad'] is None, '짐작 규칙')
        s.expect(g['p1'] == {'course': mc, 'lect': 'LS00000000152376472', 'sid': 'STEP1000010212', 'enc': 'M05'} and g['p2']['course'] == '10033684' and g['p3'] is None, '주소 읽기')
        # 3) 국어 1-2도 앱에 들어 있음 (encType M10)
        K = 'https://primary.ebs.co.kr/pleasure/course/player/main/index?cid={c}&sid=STEP1000011301&lid=LS00000000{n}&eno=1&encType=M10&captionYn=N&indexPosition='
        for n, lid in {1:152384353, 2:152384354, 3:152384355, 48:152384400}.items():
            u = await s.ev(f"ebsCourseUrl('kor', CURRS.kor.now.lectOff + {n})")
            s.expect(u == K.format(c=kc, n=lid), f'국어 {n}강 주소 다름: {u}')
        # 둘 다 들어 있으니 오빠 메뉴에 붙여넣는 칸이 안 보여야 함
        await s.ev("S.adultTab='oppa'; go('adult')"); await p.wait_for_timeout(200)
        s.expect(await p.locator('#ebsurl').count() == 0, '다 들어 있는데 붙여넣기 칸이 보임')
        # 붙여넣기 흐름(나중 강좌용): 국어 강좌로 흉내 — 넣어 둔 게 앱보다 우선
        await s.ev(f"S.ebsLinks = {{'{kc}': {{1:'LS00000000152300100', 2:'LS00000000152300101', 3:'LS00000000152300102', sid:'STEP9', enc:'M07'}}}}")
        k2 = await s.ev("ebsCourseUrl('kor', CURRS.kor.now.lectOff + 2)"); k5 = await s.ev("ebsCourseUrl('kor', CURRS.kor.now.lectOff + 5)")
        print('넣어 둔 주소 우선:', k2[-80:])
        s.expect('lid=LS00000000152300101' in k2 and 'encType=M07' in k2 and 'sid=STEP9' in k2, '넣어 둔 주소가 우선 아님')
        s.expect('lid=LS00000000152384357' in k5, '넣지 않은 강은 짐작보다 앱에 든 확인된 주소가 우선')
        await s.ev("S.ebsLinks = {}")
        # 3-1) 스위치 끄면(기본) 로그인 없어도 열리는 강좌 화면 주소 + 강의 번호, 안내는 목록에서 찾기
        await s.ev("S.ebsPlayer = false")
        u0 = await s.ev("ebsCourseUrl('math', CURRS.math.now.lectOff + 1)"); print('기본 주소:', u0)
        s.expect(u0 == f'https://primary.ebs.co.kr/course/view?courseId={mc}&lectId=LS00000000152376470', f'기본 주소 이상 {u0}')
        await s.ev("go('home'); openLecture('math', CURRS.math.now.lectOff + 1)"); await p.wait_for_timeout(300)
        s.expect(await p.locator('.eye-card .ebs-list').count() == 1, '스위치 꺼졌는데 강의목록 안내가 없음')
        await s.ev("document.querySelectorAll('.overlay').forEach(o => o.remove()); S.ebsPlayer = true")
        # 3-2) EBS 초등 앱으로 열기 (안드로이드): intent 주소, 새 창 아님, 앱 없으면 Play 스토어로
        await s.ev("window.__forceAndroid = true; S.ebsMode = 'app'; go('home'); openLecture('kor', CURRS.kor.now.lectOff + 1)"); await p.wait_for_timeout(300)
        a = p.locator('[data-lecgo]'); href = await a.get_attribute('href'); tgt = await a.get_attribute('target'); txt = await p.locator('.eye-card').text_content()
        print('앱 열기:', href[:90], '| target', tgt)
        s.expect(href.startswith('intent:#Intent;') and 'package=kr.ebs.primary.player' in href and 'S.browser_fallback_url=https%3A%2F%2Fplay.google.com' in href and href.endswith(';end'), '앱 여는 주소 이상')
        s.expect(tgt is None and '나의 학습방' in txt and 'EBS 초등 앱' in txt, '앱 안내 이상')
        await s.ev("document.querySelector('[data-lecgo]').addEventListener('click', e => e.preventDefault())"); await a.click(); await p.wait_for_timeout(200)
        s.expect(await s.screen() == 'lecwait' and (await p.locator('a:has-text("EBS 앱 다시 열기")').get_attribute('href')).startswith('intent:'), '앱 열고 기다리는 화면 이상')
        await s.ev("S.adultTab='oppa'; go('adult')"); await p.wait_for_timeout(200)
        s.expect(await p.locator('[data-a="ebsmode"]').count() == 2 and await p.locator('a[href^="intent:"]').count() == 1, '오빠 메뉴 여는 곳 고르기 없음')
        await p.locator('.panel:has([data-a="ebsmode"])').screenshot(path=SHOTS + '/ebs_mode_panel.png')
        await s.click('[data-a="ebsmode"][data-v="web"]'); await p.wait_for_timeout(150)
        s.expect(not (await s.ev("ebsOpenUrl('kor', CURRS.kor.now.lectOff + 1)")).startswith('intent:'), '인터넷으로 바꿨는데 앱으로 열림')
        await s.ev("window.__forceAndroid = false; S.ebsMode = 'app'; LECW = null; go('home')")
        s.expect(not (await s.ev("ebsOpenUrl('kor', CURRS.kor.now.lectOff + 1)")).startswith('intent:'), '안드로이드가 아닌데 앱 주소')
        # 4) 재윤이 강의 안내
        await s.ev("go('home'); openLecture('math', CURRS.math.now.lectOff + 1)"); await p.wait_for_timeout(300)
        href = await p.locator('[data-lecgo]').get_attribute('href'); txt = await p.locator('.eye-list').last.text_content()
        s.expect(href == P.format(c=mc, n=152376470) and '바로' in txt, f'강의 안내가 바로가기 아님: {href}')
        await p.screenshot(path=SHOTS + '/ebs_guard.png')
        await s.overflow('ebs panel')
asyncio.run(main())
