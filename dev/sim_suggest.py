"""2026-11-03 건의함: 태블릿(재윤이) · 엄마 폰 · 오빠 폰 3기기 + 체험판
A) 재윤이 첫 화면 "💌 오빠에게 말하기" → 고르기·글·큰 캡처 사진 2장·목소리 → 보내기 → 서버 fb 문서는 작게, 사진은 fbm 한 장씩 1MB 아래
B) 문제 화면 "🙋 이 문제 이상해요": 풀기 전 → 돌아가면 같은 문제·틀린 횟수 그대로 / 두 번 틀린 뒤 → 돌아가면 다음 문제(기록 한 번만)
   / 맞히자마자 누름 → 건의 화면에서 다음 문제로 안 넘어감, 돌아가면 다음 문제
C) 인터넷 끊긴 채 보냄 → 기기에 모아 둠 → 연결되면 저절로
D) 엄마 폰 엄마 탭 "오빠에게 건의하기" → 오빠 알림함·ntfy
E) 오빠 폰 건의함: 새 건의 수, 사진·목소리 보기(누를 때만 받음), 고쳤어요 + 한마디 → 재윤이 첫 화면 알림 → 내가 보낸 이야기에 "고쳤어요 ✓"·한마디, 엄마 건의 고치면 엄마 알림
F) 내용 복사 글에 문제·정답·고른 답·문제 키·진도·앱 버전
G) 체험판(가족 연결 없음)은 이 기기에만 저장 · 폰 화면 가로 넘침 없음"""
import asyncio, sys, os, json, subprocess, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import CHROME, SP, SHOTS
from playwright.async_api import async_playwright
from sim_sync import Device, STORE, DEV

def big_png(path, w, h, noise=6000):
    """캡처 같은 큰 사진 (점이 많아 잘 안 줄어드는 그림)"""
    import random, zlib, struct
    rnd = random.Random(w * h)
    rows = []
    for y in range(h):
        row = bytearray([0])
        for x in range(w):
            v = 255 if (x // 40 + y // 40) % 2 else 235
            row += bytes([v, v, 255 if (x * y) % 97 else 0])
        rows.append(row)
    for _ in range(noise):
        x, y = rnd.randrange(w), rnd.randrange(h); r = rows[y]; i = 1 + x * 3; r[i:i + 3] = bytes([rnd.randrange(256) for _ in range(3)])
    raw = b''.join(bytes(r) for r in rows)
    def chunk(t, d): c = struct.pack('>I', len(d)) + t + d; return c + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 6)) + chunk(b'IEND', b'')
    open(path, 'wb').write(png)

def fb_docs(fid, coll): return {k.split('/')[-1]: v for k, v in STORE.items() if k.startswith(f'families/{fid}/{coll}/')}

async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8770', '-d', os.path.join(os.path.dirname(DEV), 'dist', 'site')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1); base = 'http://localhost:8770/'
    shot1, shot2 = SP + '/sug_shot1.png', SP + '/sug_shot2.png'
    big_png(shot1, 2560, 1600, 400000); big_png(shot2, 800, 1280, 2000)
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path=CHROME, args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])
        oppa = await Device('오빠폰', br, base).open()
        await oppa.click('[data-a="start"]'); await oppa.adult('set')
        await oppa.click('[data-a="famcreate"][data-v="oppa"]'); await oppa.p.wait_for_timeout(1500)
        link, fid = await oppa.ev("familyLink()"), await oppa.ev('S.local.fid')
        tab = await Device('태블릿', br, link, 1280, 800).open(); tab.accept_dialog = True
        await tab.ctx.grant_permissions(['microphone'], origin=base.rstrip('/'))
        await tab.click('[data-a="joinrole"][data-v="kid"]'); await tab.p.wait_for_timeout(1500)
        mom = await Device('엄마폰', br, link).open()
        await mom.click('[data-a="joinrole"][data-v="mom"]'); await mom.p.wait_for_timeout(1500)
        await tab.ev("go('home')"); await tab.p.wait_for_timeout(200)

        # ---------- A) 첫 화면에서 ----------
        tab.expect(await tab.p.locator('.sug-kid').is_visible(), '재윤이 첫 화면에 "오빠에게 말하기"가 안 보임')
        await tab.click('.sug-kid'); await tab.p.wait_for_timeout(300)
        tab.expect(await tab.screen() == 'suggest', '건의 화면이 안 열림')
        dis = await tab.ev("document.querySelector('[data-a=sugsend]').getAttribute('aria-disabled')")
        tab.expect(dis == 'true', '아무것도 안 넣었는데 보내기가 눌림')
        await tab.click('[data-a="sugkind"][data-v="idea"]'); await tab.p.wait_for_timeout(150)
        await tab.p.fill('#sugText', '토리가 춤추는 거 더 보고 싶어요'); await tab.p.wait_for_timeout(100)
        await tab.p.set_input_files('#sugImg', [shot1, shot2]); await tab.p.wait_for_timeout(4000)
        n_img = await tab.ev("SUG.imgs.length"); sizes = await tab.ev("SUG.imgs.map(s => s.length)")
        print('올린 사진:', n_img, '장, 크기', sizes)
        tab.expect(n_img == 2 and max(sizes) < 900000, f'사진이 안 올라가거나 너무 큼 {sizes}')
        tab.expect(await tab.ev("SUG.text") == '토리가 춤추는 거 더 보고 싶어요' and await tab.ev("SUG.kind") == 'idea', '사진을 올리고 나니 글·고른 것이 사라짐')
        # 목소리 2초
        await tab.click('[data-a="sugrec"]'); await tab.p.wait_for_timeout(2300)
        rec_on = await tab.ev("!!SUG_REC")
        await tab.click('[data-a="sugrec"]'); await tab.p.wait_for_timeout(1200)
        aud = await tab.ev("SUG.aud ? SUG.aud.length : 0"); print('목소리:', rec_on, aud, '글자')
        tab.expect(rec_on and aud > 100, '목소리 녹음이 안 됨')
        await tab.shot('sug_tab_write')
        await tab.click('[data-a="sugsend"]'); await asyncio.sleep(2.5)
        tab.expect(await tab.p.locator('.sug-done').count() == 1, '보낸 뒤 "보냈어" 화면이 안 나옴')
        docs, media = fb_docs(fid, 'fb'), fb_docs(fid, 'fbm')
        print('서버 fb', len(docs), '개 · fbm', sorted(media), [len(v['d']) for v in media.values()])
        tab.expect(len(docs) == 1, f'서버 건의 문서 수 {len(docs)}')
        d0 = next(iter(docs.values()), {})
        tab.expect(d0.get('imgs') == 2 and d0.get('aud', 0) >= 1 and d0.get('who') == 'kid' and len(json.dumps(d0, ensure_ascii=False)) < 3000, f'건의 문서 내용 이상 {str(d0)[:200]}')
        tab.expect(len(media) == 3 and all(len(v['d']) < 1000000 for v in media.values()), '사진·목소리가 서버에 따로 안 올라감')
        tab.expect(await tab.ev("Suggest.queue().length") == 0, '보냈는데 기기 모음에 남음')
        await tab.click('[data-a="sugback"]'); await tab.p.wait_for_timeout(200)

        # ---------- B) 문제 화면에서 ----------
        await tab.click('[data-k="math"]'); await tab.p.wait_for_timeout(250); await tab.click('[data-a="begin"]'); await tab.p.wait_for_timeout(200)
        await tab.through_lecture()
        tab.expect(await tab.screen() == 'q', f'수학 판이 문제로 안 감 ({await tab.screen()})')
        tab.expect(await tab.p.locator('.sug-flag').is_visible(), '문제 화면에 "이 문제 이상해요"가 안 보임')
        before = await tab.ev("({idx:RUN.b.idx, key:RUN.q.key, prompt:RUN.q.prompt, log:(RUN.b.log||[]).length})")
        # 한 번 틀리고 → 이상해요 → 돌아가면 같은 문제, 틀린 횟수 1 그대로
        q = await tab.ev("({input:RUN.q.input, opts:RUN.q.opts, ans:RUN.q.ans})")
        if q['input'] == 'choice':
            wi = [i for i, o in enumerate(q['opts']) if str(o) != str(q['ans'])][0]; await tab.p.locator('.opt').nth(wi).click()
        else:
            for ch in str(int(q['ans']) + 1) if q['input'] == 'numpad' else '': await tab.p.locator(f'.numpad button[data-v="{ch}"]').click()
            if q['input'] == 'numpad': await tab.p.locator('.numpad .ok').click()
        await tab.p.wait_for_timeout(200)
        tries1 = await tab.ev("RUN.tries")
        await tab.click('.sug-flag'); await tab.p.wait_for_timeout(300)
        snap = await tab.ev("SUG && SUG.q")
        tab.expect(snap and snap['prompt'] == before['prompt'] and snap['key'] == before['key'] and snap['ans'] == str(q['ans']), '문제가 건의에 안 붙음')
        tab.expect(await tab.p.locator('.sug-q').count() == 1, '건의 화면에 문제가 안 보임')
        tab.expect('정답' not in (await tab.p.locator('.sug-q').inner_text()), '재윤이 건의 화면에 정답이 보임')
        await tab.p.fill('#sugText', '그림이랑 숫자가 달라요'); await tab.click('[data-a="sugsend"]'); await tab.p.wait_for_timeout(600)
        await tab.click('[data-a="sugback"]'); await tab.p.wait_for_timeout(300)
        after = await tab.ev("({scr:SCREEN, idx:RUN.b.idx, key:RUN.q.key, tries:RUN.tries})")
        tab.expect(after['scr'] == 'q' and after['idx'] == before['idx'] and after['key'] == before['key'] and after['tries'] == tries1, f'풀던 문제로 안 돌아감 {before} → {after}')
        # 이 문제는 맞히고 다음 문제: 두 번 틀려서 정답이 나온 뒤 → 이상해요 → 돌아가면 다음 문제
        await tab.answer(); await tab.p.wait_for_timeout(200)
        b2 = await tab.ev("({idx:RUN.b.idx, log:(RUN.b.log||[]).length, n:RUN.b.qs.length})")
        q = await tab.ev("({input:RUN.q.input, opts:RUN.q.opts, ans:RUN.q.ans, tiles:RUN.q.tiles})")
        for t in range(2):
            if q['input'] == 'choice':
                wr = [i for i, o in enumerate(q['opts']) if str(o) != str(q['ans'])]; await tab.p.locator('.opt').nth(wr[t % len(wr)]).click()
            elif q['input'] == 'numpad':
                for ch in str(int(q['ans']) + 1 + t): await tab.p.locator(f'.numpad button[data-v="{ch}"]').click()
                await tab.p.locator('.numpad .ok').click()
            await tab.p.wait_for_timeout(250)
        locked = await tab.ev("RUN.locked")
        if locked:
            await tab.click('.sug-flag'); await tab.p.wait_for_timeout(300)
            w = await tab.ev("SUG.q.wrongs.length"); tab.expect(w == 2, f'고른 답 두 개가 안 붙음 ({w})')
            await tab.click('[data-a="sugkind"][data-v="hard"]'); await tab.click('[data-a="sugsend"]'); await tab.p.wait_for_timeout(500)
            await tab.click('[data-a="sugback"]'); await tab.p.wait_for_timeout(300)
            b3 = await tab.ev("({scr:SCREEN, idx:RUN.b.idx, log:(RUN.b.log||[]).length})")
            tab.expect(b3['idx'] == b2['idx'] + 1 and b3['log'] == b2['log'] + 1, f'정답 본 뒤 이상해요 → 다음 문제로 안 감/기록 이상 {b2} → {b3}')
        else: print('  (이 문제는 보기가 하나뿐이라 두 번 틀리기 건너뜀)')
        # 맞히자마자 이상해요 → 건의 화면에서 다음 문제로 안 넘어감
        if await tab.screen() == 'q':
            b4 = await tab.ev("({idx:RUN.b.idx, log:(RUN.b.log||[]).length, correct:RUN.b.correct})")
            q = await tab.ev("({input:RUN.q.input, opts:RUN.q.opts, ans:RUN.q.ans, tiles:RUN.q.tiles})")
            if q['input'] == 'choice':
                await tab.p.locator('.opt').nth([str(o) for o in q['opts']].index(str(q['ans']))).click()
                await tab.p.wait_for_timeout(150); await tab.click('.sug-flag'); await tab.p.wait_for_timeout(2200)
                tab.expect(await tab.screen() == 'suggest', '맞힌 뒤 이상해요를 눌렀는데 건의 화면이 다음 문제로 덮임')
                await tab.click('[data-a="sugback"]'); await tab.p.wait_for_timeout(300)
                b5 = await tab.ev("({scr:SCREEN, idx:RUN.b.idx, log:(RUN.b.log||[]).length, correct:RUN.b.correct})")
                tab.expect(b5['idx'] == b4['idx'] + 1 and b5['log'] == b4['log'] + 1 and b5['correct'] == b4['correct'] + 1, f'맞힌 뒤 이상해요 → 돌아가기 이상 {b4} → {b5}')
        # 판 끝까지
        while await tab.screen() == 'q': await tab.answer()
        tab.expect(not tab.errors, '판 도중 오류')
        await tab.after_reward()

        # ---------- C) 인터넷 끊긴 채 ----------
        await tab.ev("localStorage.setItem('__mockOffline', '1'); go('home')"); await tab.p.wait_for_timeout(200)
        await tab.click('.sug-kid'); await tab.p.wait_for_timeout(200)
        await tab.p.fill('#sugText', '받아쓰기 소리가 작아요'); await tab.click('[data-a="sugkind"][data-v="bug"]')
        await tab.p.set_input_files('#sugImg', [shot2]); await tab.p.wait_for_timeout(1500)
        await tab.click('[data-a="sugsend"]'); await tab.p.wait_for_timeout(1500)
        qn = await tab.ev("Suggest.queue().length"); n_srv = len(fb_docs(fid, 'fb'))
        pill = await tab.p.locator('.sug .pill').first.inner_text()
        print('끊긴 채 보냄: 기기에 모음', qn, '· 서버', n_srv, '·', pill)
        tab.expect(qn == 1, '인터넷 없을 때 기기에 안 모아 둠')
        tab.expect('보내는 중' in pill, f'보내는 중 표시가 없음 ({pill})')
        await tab.ev("localStorage.removeItem('__mockOffline'); window.dispatchEvent(new Event('online'))"); await asyncio.sleep(3)
        tab.expect(await tab.ev("Suggest.queue().length") == 0 and len(fb_docs(fid, 'fb')) == n_srv + 1, '연결된 뒤 저절로 안 감')
        await tab.click('[data-a="sugback"]'); await tab.p.wait_for_timeout(200)

        # ---------- D) 엄마 폰 ----------
        await mom.adult('mom')
        mom.expect(await mom.p.locator('.son-link[data-a="sug"]').is_visible(), '엄마 탭에 "아들에게 말하기"가 안 보임')
        await mom.click('.son-link[data-a="sug"]'); await mom.p.wait_for_timeout(300)
        mom.expect(await mom.ev("SUG.who") == 'mom', f'엄마 건의가 엄마로 안 들어감 ({await mom.ev("SUG.who")})')
        await mom.click('[data-a="sugkind"][data-v="content"]'); await mom.p.fill('#sugText', '국어 문제가 너무 쉬워요. 조금 어렵게 해 주세요')
        await mom.overflow('엄마 건의 화면'); await mom.shot('sug_mom_write')
        await mom.click('[data-a="sugsend"]'); await asyncio.sleep(2)
        await mom.click('[data-a="sugback"]'); await mom.p.wait_for_timeout(200)
        mom.expect(await mom.screen() == 'adult', '엄마 건의 뒤 엄마 메뉴로 안 돌아감')
        await asyncio.sleep(1)

        # ---------- E) 오빠 폰 ----------
        await oppa.adult_tab('oppa'); await asyncio.sleep(1); await oppa.adult_tab('oppa')
        all_n = await oppa.ev("Suggest.all().length"); fresh = await oppa.p.locator('.sug-box h3 .pill').count()
        notes = await oppa.ev("S.notes.filter(n => n.to === 'oppa' && /건의/.test(n.text)).length")
        print('오빠 폰 건의', all_n, '개 · 새 건의 표시', fresh, '· 알림함', notes)
        sent_n = await tab.ev("Suggest.all().filter(x => x.who === 'kid').length") + 1   # 태블릿이 보낸 것 + 엄마 1
        oppa.expect(all_n == sent_n and all_n >= 4, f'오빠 폰 건의 수 {all_n} (태블릿+엄마 {sent_n})')
        oppa.expect(fresh == 1, '새 건의 표시가 없음')
        oppa.expect(notes >= 5, f'오빠 알림함에 건의 알림이 모자람 ({notes})')
        mloaded0 = await oppa.ev("Object.keys(Suggest.media).length")
        oppa.expect(mloaded0 == 0, '오빠가 누르기 전에 사진을 받음 (목록이 무거워짐)')
        first_kid = await oppa.ev("Suggest.all().find(x => x.who === 'kid' && x.imgs === 2).id")
        await oppa.click(f'[data-a="sugopen"][data-id="{first_kid}"]'); await oppa.p.wait_for_timeout(1500)
        imgs = await oppa.p.locator(f'.sug-media img').count(); auds = await oppa.p.locator('.sug-media audio').count()
        print('오빠가 연 사진', imgs, '목소리', auds); oppa.expect(imgs == 2 and auds == 1, '오빠 폰에서 사진·목소리가 안 보임')
        await oppa.overflow('오빠 건의함'); await oppa.shot('sug_oppa_box')
        await oppa.p.fill(f'#sugrp_{first_kid}', '토리 춤 더 넣었어!'); await oppa.click(f'[data-a="sugst"][data-id="{first_kid}"][data-v="done"]'); await asyncio.sleep(1.5)
        mom_id = await oppa.ev("Suggest.all().find(x => x.who === 'mom').id")
        await oppa.click(f'[data-a="sugst"][data-id="{mom_id}"][data-v="done"]'); await asyncio.sleep(1.5)
        qid = await oppa.ev("Suggest.all().find(x => x.q && x.q.wrongs && x.q.wrongs.length === 2) ? Suggest.all().find(x => x.q && x.q.wrongs.length === 2).id : Suggest.all().find(x => x.q).id")
        await oppa.click(f'[data-a="sugst"][data-id="{qid}"][data-v="seen"]'); await asyncio.sleep(1)
        st = fb_docs(fid, 'fbst'); print('서버 상태', {k: v['st'] for k, v in st.items()})
        oppa.expect(len(st) == 3 and st[first_kid]['reply'] == '토리 춤 더 넣었어!', '오빠 상태·한마디가 서버에 안 감')
        # F) 복사 글
        txt = await oppa.ev(f"sugCopyText(Suggest.all().find(x => x.id === '{qid}'))"); print('복사 글:\n' + txt)
        for need in ['문제:', '정답:', '문제 키:', '진도:', '앱 ']:
            oppa.expect(need in txt, f'복사 글에 "{need}" 없음')
        # 재윤이 태블릿: 첫 화면 알림 → 내가 보낸 이야기
        await asyncio.sleep(1); await tab.ev("go('home')"); await tab.p.wait_for_timeout(300)
        ban = await tab.p.locator('[data-a="sugkidseen"]').count()
        tab.expect(ban == 1, '오빠가 고쳤는데 재윤이 첫 화면에 알림이 없음')
        if ban:
            tab.expect('토리 춤 더 넣었어' in await tab.p.locator('[data-a="sugkidseen"]').inner_text(), '첫 화면 알림에 오빠 한마디가 없음')
            await tab.click('[data-a="sugkidseen"]'); await tab.p.wait_for_timeout(300)
            body = await tab.p.locator('.sug').inner_text()
            tab.expect('고쳤어요 ✓' in body and '토리 춤 더 넣었어' in body and '오빠가 봤어요' in body, '내가 보낸 이야기에 상태·한마디가 안 보임')
            await tab.shot('sug_tab_list')
            await tab.click('[data-a="sugback"]'); await tab.p.wait_for_timeout(200)
            tab.expect(await tab.p.locator('[data-a="sugkidseen"]').count() == 0, '한 번 본 알림이 계속 뜸')
        await asyncio.sleep(1)
        mn = await mom.ev("S.notes.filter(n => n.to === 'mom' && /건의를 고쳤어요/.test(n.text)).length")
        mom.expect(mn == 1, f'엄마 건의를 고쳤는데 엄마 알림이 없음 ({mn})')
        # 같은 기록 검사 (Firestore가 거부한 값)
        for d in (oppa, tab, mom): await d.report()

        # ---------- G) 체험판 ----------
        demo = await Device('체험판폰', br, base).open()
        await demo.click('[data-a="start"]'); await demo.p.wait_for_timeout(200)
        await demo.overflow('폰 첫 화면'); await demo.click('.sug-kid'); await demo.p.wait_for_timeout(200)
        await demo.p.fill('#sugText', '체험판 건의'); await demo.p.set_input_files('#sugImg', [shot1]); await demo.p.wait_for_timeout(2500)
        await demo.overflow('폰 건의 화면 (사진)'); await demo.shot('sug_phone_write')
        await demo.click('[data-a="sugsend"]'); await demo.p.wait_for_timeout(500)
        dq = await demo.ev("Suggest.queue().length"); pill = await demo.p.locator('.sug .pill').first.inner_text()
        demo.expect(dq == 1 and '이 기기에만' in pill, f'체험판 저장 이상 {dq} {pill}')
        await demo.click('[data-a="sugback"]'); await demo.adult('oppa')
        demo.expect(await demo.ev("Suggest.all().length") == 1 and await demo.p.locator('.sug-item').count() == 1, '체험판 오빠 탭에 건의가 안 보임')
        await demo.click('[data-a="sugopen"]'); await demo.p.wait_for_timeout(300)
        demo.expect(await demo.p.locator('.sug-media img').count() == 1, '체험판에서 사진이 안 보임')
        await demo.click('[data-a="sugst"][data-v="done"]'); await demo.p.wait_for_timeout(300)
        demo.expect('고쳤어요' in await demo.p.locator('.sug-item').inner_text(), '체험판 상태 표시 안 됨')
        await demo.overflow('폰 오빠 건의함')
        await demo.report()
        await br.close()
    srv.terminate()

asyncio.run(main())
