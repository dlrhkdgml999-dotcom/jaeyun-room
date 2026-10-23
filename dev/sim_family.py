"""시뮬레이션: 오빠 폰 · 엄마 폰 · 재윤이 태블릿 세 기기가 가족방으로 함께 쓰기"""
import asyncio, sys, json, subprocess, os, base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import CHROME, Sim, FAKE_TTS, SHOTS
from playwright.async_api import async_playwright
DEV = os.path.dirname(os.path.abspath(__file__)); SP = os.path.join(DEV, 'out')
MOCK = open(os.path.join(DEV, 'mockfb.js')).read()
STORE = {}
PAGES = []
WRITES = {'n': 0}

async def push(path):
    for p in PAGES:
        try: await p.evaluate('p => window.__fsChanged && window.__fsChanged(p)', path)
        except Exception: pass

def fs_handler(source, op, path, data):
    if op == 'set':
        STORE[path] = json.loads(data); WRITES['n'] += 1
        asyncio.get_event_loop().create_task(push(path)); return 'null'
    if op == 'get': return json.dumps(STORE.get(path))
    if op == 'list':
        pre = path + '/'
        return json.dumps([[k[len(pre):], v] for k, v in STORE.items() if k.startswith(pre) and '/' not in k[len(pre):]])

class Device(Sim):
    def __init__(self, name, browser, vw, vh, url):
        super().__init__(name); self.browser = browser; self.vw = vw; self.vh = vh; self.url = url
    async def open(self):
        self.ctx = await self.browser.new_context(viewport={'width': self.vw, 'height': self.vh}, device_scale_factor=2, is_mobile=True, has_touch=True, service_workers='block')
        await self.ctx.add_init_script(FAKE_TTS)
        await self.ctx.expose_binding('__fs', fs_handler)
        await self.ctx.route('**/firebasejs/**', lambda r: r.fulfill(body=MOCK if r.request.url.endswith('firebase-app-compat.js') else '', content_type='text/javascript'))
        await self.ctx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
        self.p = await self.ctx.new_page(); PAGES.append(self.p)
        self.p.on('pageerror', lambda e: self.errors.append(str(e)))
        await self.p.goto(self.url); await self.p.wait_for_timeout(600)
        return self
    async def report(self):
        bad = await self.ev('window.__fsBad || []')
        if bad: self.issues.append(('Firestore가 거부한 값', len(bad), bad[:2]))
        print(f'[{self.name}] 오류:', self.errors or '없음', '| 문제:', self.issues or '없음')

async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8765', '-d', os.path.join(os.path.dirname(DEV), 'dist', 'site')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1)
    base = 'http://localhost:8765/'
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path=CHROME)
        oppa = await Device('오빠폰', br, 384, 832, base).open()
        # 1) 오빠가 가족방 만들기
        await oppa.click('[data-a="start"]')
        await oppa.adult('set'); await oppa.shot('fam_before')
        await oppa.click('[data-a="famcreate"][data-v="oppa"]'); await oppa.p.wait_for_timeout(1500)
        link = await oppa.ev("familyLink()"); fid = await oppa.ev('S.local.fid')
        print('가족 링크:', link, '| 저장된 문서 수:', len(STORE))
        oppa.expect(len(fid) >= 20, '가족 번호가 짧음')
        await oppa.shot('fam_after')
        # 2) 엄마·재윤이가 링크로 들어오기
        mom = await Device('엄마폰', br, 384, 832, link.replace('http://localhost:8765/', base)).open()
        await mom.shot('join'); await mom.click('[data-a="joinrole"][data-v="mom"]'); await mom.p.wait_for_timeout(1200)
        mom.expect(await mom.screen() == 'adult' and await mom.ev('S.adultTab') == 'mom', '엄마 폰이 엄마 메뉴로 안 감')
        kid = await Device('재윤태블릿', br, 800, 1280, link.replace('http://localhost:8765/', base)).open()
        await kid.click('[data-a="joinrole"][data-v="kid"]'); await kid.p.wait_for_timeout(1200)
        kid.expect(await kid.screen() == 'home', '태블릿이 재윤이 화면으로 안 감')
        await kid.shot('home_tablet')
        # 3) 오빠가 선물 이름·칭찬, 엄마가 수학 강의 주소 → 태블릿에 보이나
        await oppa.adult('oppa'); await oppa.p.fill('#gname', '토끼 인형'); await oppa.click('[data-a="savegift"]')
        await oppa.p.fill('#ptext', '재윤아 오늘도 최고였어!'); await oppa.click('[data-a="savepraise"]')
        await mom.adult('mom'); await mom.p.select_option('#pace', 'slow'); await mom.p.wait_for_timeout(300)
        await asyncio.sleep(2.5)
        g = await kid.ev('S.gift.name'); kid.expect(g == '토끼 인형', f'선물 이름이 태블릿에 안 옴: {g}')
        pc = await kid.ev('S.pace'); kid.expect(pc == 'slow', f'진도 속도가 태블릿에 안 옴: {pc}')
        await mom.p.select_option('#pace', 'normal'); await asyncio.sleep(2.5)
        # 4) 재윤이 하루 공부 (수학 강의 날: 거리 안내 → EBS → 다 봤어요 → 눈 쉬기 → 개념 카드)
        await kid.click('[data-k="math"]'); await kid.p.wait_for_timeout(400); await kid.shot('math_intro')
        kid.expect(await kid.p.locator('.lec-box').count() == 1, '오늘의 강의 안내가 없음')
        await kid.click('[data-a="begin"]'); await kid.p.wait_for_timeout(300); await kid.shot('lecture_guard')
        kid.expect(await kid.p.locator('.eye-card a[href*="ebs.co.kr"]').count() == 1, '강의 전 거리 안내가 안 나옴')
        await kid.through_lecture()
        kid.expect(await kid.screen() == 'q', '강의 뒤 문제로 안 감: ' + await kid.screen())
        kid.expect(await kid.ev("!!curr('math').seen[1]"), '강의 본 기록이 없음')
        i = 0
        while await kid.screen() == 'q':
            if i == 2: await kid.shot('math_q_tablet')
            await kid.answer('twice' if i in (1, 4) else None); i += 1
        await kid.p.wait_for_timeout(300); await kid.shot('math_reward')
        res = await kid.ev("day().boards.math.cur.result"); print('수학 차시 결과:', {k: res[k] for k in ('pass','rate')})
        await kid.after_reward()
        await kid.board('kor'); await kid.after_reward()
        await kid.board('eng')
        # 펜으로 받아쓰기
        for n in range(10):
            await kid.p.wait_for_timeout(950)
            box = await kid.p.locator('#pen').bounding_box()
            await kid.p.mouse.move(box['x'] + 40, box['y'] + 60); await kid.p.mouse.down()
            for t in range(12): await kid.p.mouse.move(box['x'] + 40 + t * 25, box['y'] + 60 + (t % 3) * 20)
            await kid.p.mouse.up()
            if n == 0: await kid.shot('pen')
            await kid.click('[data-a="dictnext"]')
        await kid.p.wait_for_timeout(1200); await kid.shot('pen_photo')
        kid.expect(await kid.screen() == 'photo' and (await kid.ev("!!day().dict.photo")), '펜으로 쓴 받아쓰기가 사진으로 안 모임')
        await kid.click('[data-a="sendphoto"]'); await kid.p.wait_for_timeout(300); await kid.after_reward()
        await kid.board('rev'); await kid.p.wait_for_timeout(300); await kid.p.locator('.btn.big').last.click(); await kid.p.wait_for_timeout(500)
        await kid.shot('alldone')
        await asyncio.sleep(3)
        # 5) 엄마: 알림 · 사진 · 채점
        await mom.ev("go('adult')"); await mom.p.wait_for_timeout(500)
        notes = await mom.ev("S.notes.filter(n=>n.to==='mom').map(n=>n.text)"); print('엄마 알림:', notes[:4])
        mom.expect(any('받아쓰기' in n for n in notes), '엄마에게 받아쓰기 알림이 안 옴')
        photo = await mom.ev("(()=>{const d=S.days[todayKey()]; return d && d.dict && d.dict.photo ? d.dict.photo.slice(0,30) : null})()")
        mom.expect(photo and photo.startswith('data:image'), f'엄마 폰에 받아쓰기 사진이 안 옴: {photo}')
        await mom.shot('mom_grade')
        dk = [k for k in STORE if '/days/' in k]; print('서버 days 문서:', dk)
        for k in dk: v = STORE[k]['v']; print('  ', k.split('/')[-1], {b: (x.get('done'), x.get('idx')) for b, x in v.get('boards', {}).items()}, (v.get('dict') or {}).get('sent'))
        print('재윤 Sync:', await kid.ev("({ready:Sync.ready, status:Sync.status, applying:Sync.applying, err:Sync.error||'', diff: JSON.stringify(Sync.pack(S.days[todayKey()])) === Sync.last.days[todayKey()], role:role()})"))
        print('엄마 S.days:', await mom.ev("JSON.stringify(Object.fromEntries(Object.entries(S.days).map(([k,v])=>[k,Object.keys(v.boards||{})])))"))
        print('엄마 last.days:', await mom.ev("Object.keys(Sync.last.days)"), '| 재윤 last.days 길이:', await kid.ev("Object.values(Sync.last.days).map(x=>x.length)"))
        print('재윤 S.days 키:', await kid.ev("Object.keys(S.days)"), '오늘:', await kid.ev("todayKey()"), await mom.ev("todayKey()"))
        for n in range(10):
            v = '0' if n in (2, 6) else '1'
            await mom.p.locator(f'[data-a="mark"][data-v$="|{n}|{v}"]').click()
        await mom.click('[data-a="grade"]'); await asyncio.sleep(3)
        # 6) 태블릿이 채점 결과를 반영했나
        await kid.ev("go('home')"); await kid.p.wait_for_timeout(300)
        kn = await kid.ev("S.kidNotes.map(n=>n.text)"); dw = await kid.ev("S.wrong.filter(w=>w.subj==='dict').length")
        print('재윤이 소식:', kn[:1], '| 다시 쓸 받아쓰기:', dw)
        kid.expect(any('8개' in t for t in kn) and dw == 2, '채점 결과가 태블릿에 반영 안 됨')
        await kid.shot('home_after_grade')
        # 6-1) 오빠 폰에서 재윤이 화면으로 풀어 보기 → 재윤이 기록은 그대로여야
        before = await kid.ev("JSON.stringify({c:curr('kor'), st:S.stickers.length, w:S.wrong.length})")
        nbefore = await kid.ev("S.notes.length")
        await oppa.ev("S.dayOffset = 1; go('home')"); await oppa.p.wait_for_timeout(300)
        oppa.expect('기록에 안 들어가요' in (await oppa.ev("document.querySelector('.adult-peek') ? document.querySelector('.adult-peek').textContent : ''")), '오빠 폰 미리보기 안내 없음')
        await oppa.ev("ACT.board({dataset:{k:'eng'}})"); await oppa.p.wait_for_timeout(200)
        await oppa.ev("(async()=>{ ACT.begin(); })()"); await oppa.p.wait_for_timeout(200); await oppa.through_lecture()
        n = 0
        while await oppa.screen() == 'q' and n < 40: await oppa.answer(None); n += 1
        await asyncio.sleep(3)
        after = await kid.ev("JSON.stringify({c:curr('kor'), st:S.stickers.length, w:S.wrong.length})")
        kid.expect(before == after, '오빠 폰 미리보기가 재윤이 기록을 바꿈')
        kid.expect(await kid.ev("S.notes.length") == nbefore, '오빠 폰 미리보기 알림이 가족에게 감')
        await oppa.ev("S.dayOffset = 0; go('home')")
        # 6-2) 엄마가 진도 옮기기 → 태블릿에 반영
        await mom.adult('mom'); await mom.p.select_option('#cjump-eng', '1|0|0'); await asyncio.sleep(3)
        kid.expect(await kid.ev("curr('eng').unit") == 1, '엄마가 옮긴 영어 진도가 태블릿에 안 옴')
        print('미리보기 문제 수:', n, '| 엄마 진도 옮기기 반영:', await kid.ev("currLabel('eng')"))
        # 7) 오빠 화면: 알림·통계, 세 기기 기록이 같은지
        await asyncio.sleep(2)
        await oppa.adult('oppa'); await oppa.shot('oppa_report')
        on = await oppa.ev("S.notes.filter(n=>n.to==='oppa').length"); oppa.expect(on >= 5, f'오빠 알림이 적음: {on}')
        same = {}
        for k in ('curr', 'stickers', 'wrong', 'gift', 'grades'):
            vals = [json.dumps(await d.ev(f'S.{k}'), sort_keys=True) for d in (oppa, mom, kid)]
            same[k] = len(set(vals)) == 1
        print('세 기기 기록 일치:', same)
        for k, v in same.items(): oppa.expect(v, f'{k} 기록이 기기마다 다름')
        dk = [json.dumps(await d.ev("(()=>{const x=JSON.parse(JSON.stringify(S.days[todayKey()]||{})); if(x.dict) x.dict.photo=!!x.dict.photo; return x})()"), sort_keys=True) for d in (oppa, mom, kid)]
        oppa.expect(len(set(dk)) == 1, '오늘 공부 기록이 기기마다 다름')
        # 8) 엄마 폰 다시 열기 (새로고침해도 엄마 메뉴, 연결 유지)
        await mom.p.reload(); await mom.p.wait_for_timeout(1200)
        mom.expect(await mom.screen() == 'adult' and await mom.ev('Sync.status') == 'on', '엄마 폰을 다시 열면 연결이 풀림')
        # 9) 오프라인에서 공부 → 다시 연결되면 올라가는지
        await kid.ev("window.__offline = true")
        await kid.ev("S.dayOffset = 1; saveLocal(); go('home')")
        for d in (oppa, mom): await d.ev("S.dayOffset = 1; saveLocal()")
        await kid.board('kor'); await kid.after_reward()
        await kid.ev("window.__offline = false; Sync.last.days = {}; Sync.schedule()"); await asyncio.sleep(2.5)
        okor = await mom.ev("(()=>{const d=S.days[todayKey()]; return d && d.boards.kor ? d.boards.kor.done : false})()")
        mom.expect(okor, '인터넷이 끊겼을 때 한 공부가 나중에 엄마 폰에 안 옴')
        print('Firestore 쓰기 횟수:', WRITES['n'], '| 문서 수:', len(STORE))
        sizes = sorted(((len(json.dumps(v)), k) for k, v in STORE.items()), reverse=True)[:3]; print('가장 큰 문서:', [(k.split('/', 2)[-1], s) for s, k in sizes])
        for d in (oppa, mom, kid): await d.report()
        await br.close()
    srv.terminate()

asyncio.run(main())
