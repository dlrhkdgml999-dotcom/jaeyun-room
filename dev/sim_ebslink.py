"""EBS 강의 바로가기: 오빠가 주소 붙여넣기 → 저장 → 재윤이 강의 안내에서 바로 그 강의 주소로 열림, 번호 짐작 규칙"""
import asyncio, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Sim, SHOTS
U = 'https://primary.ebs.co.kr/course/view?courseId={c}&lectId=LS00000000{n}'
async def main():
    async with Sim('ebslink') as s:
        p = s.p
        await s.ev("go('home')")
        cid = await s.ev("String(CURRS.math.now.ebs.id)")
        # 1) 짐작 규칙
        g = await s.ev("""({
          one: ebsGuess({1:'LS00000000152379081'}, 3),
          two1: ebsGuess({1:'LS00000000152379081', 2:'LS00000000152379082'}, 5),
          two3: ebsGuess({1:'LS00000000152379081', 3:'LS00000000152379087'}, 5),
          three: ebsGuess({1:'LS00000000152379081', 3:'LS00000000152379087', 6:'LS00000000152379096'}, 10),
          bad: ebsGuess({1:'LS00000000152379081', 2:'LS00000000152379082', 4:'LS00000000152379099'}, 3),
          parse: parseEbsUrl('보세요 https://primary.ebs.co.kr/course/view?courseId=100006191&lectId=LS00000000152379081&x=1'),
          parse2: parseEbsUrl('https://primary.ebs.co.kr/course/view?lectId=LS0000000010952828&courseId=10033684'),
        })""")
        print('짐작:', g)
        s.expect(g['one'] is None and g['two1'] == 'LS00000000152379085' and g['two3'] is None, '짐작 2개 규칙')
        s.expect(g['three'] == 'LS00000000152379108' and g['bad'] is None, '짐작 3개 규칙')
        s.expect(g['parse'] == {'course':'100006191','lect':'LS00000000152379081'} and g['parse2']['course'] == '10033684', '주소 읽기')
        # 2) 오빠 메뉴에서 붙여넣기 (첫 강의부터 3개)
        await s.ev("S.adultTab='oppa'; go('adult')"); await p.wait_for_timeout(200)
        s.expect(await p.locator('#ebsurl').count() == 1, '바로가기 칸 없음')
        await p.locator('#ebsurl').fill('\n'.join(U.format(c=cid, n=152379081 + i * 3) for i in range(3)))
        first = await p.locator('#ebsat').input_value(); print('첫 칸:', first)
        await s.click('[data-a="ebslink"]'); await p.wait_for_timeout(200)
        links = await s.ev(f"S.ebsLinks['{cid}']"); print('저장:', links)
        s.expect(links and len(links) == 3, '3개 저장 안 됨')
        pills = await p.locator('.panel:has(#ebsurl) .pill').all_text_contents(); print('표시:', pills)
        s.expect(pills.count('바로가기 ✓') == 3 and '짐작' in pills, '바로가기/짐작 표시')
        # 3) 다른 강좌 주소는 거절
        await p.locator('#ebsurl').fill(U.format(c='999', n=1)); await s.click('[data-a="ebslink"]'); await p.wait_for_timeout(100)
        s.expect(len(await s.ev(f"Object.keys(S.ebsLinks['{cid}'])")) == 3 and '999' not in await s.ev("Object.keys(S.ebsLinks)"), '다른 강좌 주소가 들어감')
        # 4) 재윤이 강의 안내: 바로가기 주소로
        url = await s.ev("ebsCourseUrl('math', CURRS.math.now.lectOff + 1)"); print('1강 주소:', url)
        s.expect(url.endswith('lectId=LS00000000152379081'), '1강 주소')
        url4 = await s.ev("ebsCourseUrl('math', CURRS.math.now.lectOff + 4)"); print('4강(짐작):', url4)
        s.expect(url4.endswith('lectId=LS00000000152379090'), '4강 짐작 주소')
        kurl = await s.ev("ebsCourseUrl('kor', CURRS.kor.now.lectOff + 1)")
        s.expect('lectId' not in kurl, '국어는 주소 없으면 목록으로')
        await s.ev("go('home'); openLecture('math', CURRS.math.now.lectOff + 1)"); await p.wait_for_timeout(300)
        href = await p.locator('[data-lecgo]').get_attribute('href'); txt = await p.locator('.eye-list').last.text_content()
        print('안내 버튼:', href); print('안내 글:', txt[:80])
        s.expect('lectId=' in href and '바로' in txt, '강의 안내가 바로가기 아님')
        await p.screenshot(path=SHOTS + '/ebs_guard.png')
        await s.ev("S.adultTab='oppa'; go('adult')"); await p.wait_for_timeout(200)
        await p.locator('.panel:has(#ebsurl)').screenshot(path=SHOTS + '/ebs_panel.png')
        await s.overflow('ebs panel')
asyncio.run(main())
