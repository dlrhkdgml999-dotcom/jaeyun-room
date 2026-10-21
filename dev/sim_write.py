import asyncio, sys, base64
sys.path.insert(0,'.')
from harness import Sim, SP
async def main():
    async with Sim('M_쓰기·리포트·검토') as s:
        p = s.p
        await s.click('[data-a="start"]')
        # 국어 진도를 1-3(나를 소개하는 글)으로, 국어가 강의 날이 되게
        await s.ev("curr('kor').lesson = 1; curr('math').seen[1] = {d:'x'}; S.lastLec = 'math'; save(); go('home')")
        await s.board('kor')
        s.expect(getattr(s, 'saw_write', 0) == 0 or True, '')
        # board()가 쓰기를 건너뛰었으므로, 이번엔 직접: 다음 날 다시 같은 차시로 쓰기 화면 확인
        await s.after_reward()
        print('saw_write', getattr(s,'saw_write',0), await s.ev("JSON.stringify({c:day().boards.kor.cur, w:day().writes, n:day().boards.kor.n})"))
        await s.next_day(); await s.ev("curr('kor').lesson = 1; save(); go('home')")
        await s.click('[data-k="kor"]'); await p.wait_for_timeout(200); await s.click('[data-a="begin"]'); await p.wait_for_timeout(200); await s.through_lecture()
        while await s.screen() == 'q': await s.answer(None)
        s.expect(await s.screen() == 'write', '쓰기 화면이 안 나옴: ' + await s.screen())
        await s.shot('write_phone')
        img = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'note_big.png')
        await p.set_input_files('#writeIn', img); await p.wait_for_timeout(700)
        await s.shot('write_phone_photo')
        await s.click('[data-a="writedone"]'); await p.wait_for_timeout(400)
        s.expect(await s.screen() == 'reward', '쓰기 뒤 보상 화면이 아님')
        await s.after_reward()
        # 엄마 메뉴: 쓴 글 보고 한마디
        await s.adult('mom'); await s.shot('mom_writes')
        k = await s.ev("Object.keys(S.days).find(k => S.days[k].writes && S.days[k].writes.kor && S.days[k].writes.kor.img)") + '|kor'
        await p.fill(f'[id="wfb-{k}"]', '글씨가 정말 반듯해!'); await s.click(f'[data-a="writefb"][data-v="{k}|1"]'); await p.wait_for_timeout(300)
        kn = await s.ev("S.kidNotes.map(n => n.text)"); print('재윤이 소식:', kn[:1])
        s.expect(any('반듯' in t for t in kn), '엄마 한마디가 재윤이에게 안 감')
        # 오빠 메뉴: 리포트 · 검토
        await s.click('[data-a="atab"][data-v="oppa"]'); await p.wait_for_timeout(200); await s.shot('oppa_report')
        await p.select_option('#revlesson', 'k4-1'); await p.wait_for_timeout(200)
        for i in range(3): await s.click('[data-a="revnext"]'); await p.wait_for_timeout(80)
        await p.fill('#revmemo', '보기가 헷갈려요'); await s.click('[data-a="revbad"]'); await p.wait_for_timeout(150)
        await s.click('[data-a="revbad"]'); await p.wait_for_timeout(150)
        t = await s.ev("reviewText()"); print('검토 내용:\n' + t)
        s.expect(t.count('\n') == 1 and '헷갈려요' in t, '검토 목록 이상')
        await s.overflow('오빠 메뉴'); await s.shot('oppa_review')
        # 태블릿: 펜으로 쓰기
        await p.set_viewport_size({'width': 800, 'height': 1280})
        await s.ev("S.dictMode = 'pen'; RUN = { k:'eng', b:{ qs:[], idx:0, correct:0, secs:0, phase:'eng', cur:{ subj:'eng', lesson:'e6-2', test:false, items:[] } } }; go('write')")
        await p.wait_for_timeout(300)
        box = await p.locator('#pen').bounding_box()
        await p.mouse.move(box['x'] + 30, box['y'] + 50); await p.mouse.down()
        for t in range(15): await p.mouse.move(box['x'] + 30 + t * 30, box['y'] + 50 + (t % 3) * 15)
        await p.mouse.up(); await s.shot('write_tablet')
        await s.click('[data-a="writedone"]'); await p.wait_for_timeout(500)
        s.expect(await s.screen() == 'dict', '영어 쓰기 뒤 받아쓰기로 안 감: ' + await s.screen())
        s.expect(await s.ev("!!day().writes.eng.img"), '펜 글이 저장 안 됨')
asyncio.run(main())
