"""동기화 실제 상황 재현:
A) 태블릿을 가족 연결 없이(체험판) 며칠 공부 → 오빠 폰엔 0 → 태블릿에서 가족 링크로 "재윤이" 연결 → 태블릿 기록이 지워지지 않고 올라가는지
B) 태블릿을 실수로 "오빠" 기기로 연결해 공부 → 경고 → 역할을 재윤이로 바꾸면 기록이 올라가는지
C) 인터넷 끊긴 채 공부 → 다시 연결되면 저절로 올라가는지 (예전엔 "보낸 것"으로 치고 버렸음)
D) 끊긴 채 공부하고 앱을 껐다 켜도 올라가는지
E) 연결 안 된 태블릿에서 실수로 "오빠"를 고르면 한 번 더 묻는지"""
import asyncio, sys, json, subprocess, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import CHROME, Sim, FAKE_TTS
from playwright.async_api import async_playwright
from sim_month import FAST, DAY
DEV = os.path.dirname(os.path.abspath(__file__))
MOCK = open(os.path.join(DEV, 'mockfb.js')).read()
STORE, PAGES = {}, []

async def fan(path):
    for p in PAGES:
        try: await p.evaluate('p => window.__fsChanged && window.__fsChanged(p)', path)
        except Exception: pass

def fs_handler(source, op, path, data):
    if op == 'set': STORE[path] = json.loads(data); asyncio.get_event_loop().create_task(fan(path)); return 'null'
    if op == 'del': STORE.pop(path, None); return 'null'
    if op == 'get': return json.dumps(STORE.get(path))
    if op == 'list':
        pre = path + '/'; return json.dumps([[k[len(pre):], v] for k, v in STORE.items() if k.startswith(pre) and '/' not in k[len(pre):]])

class Device(Sim):
    def __init__(self, name, browser, url, w=384, h=832):
        super().__init__(name); self.browser, self.url, self.w, self.h = browser, url, w, h; self.dialogs = []
    async def open(self):
        self.ctx = await self.browser.new_context(viewport={'width': self.w, 'height': self.h}, is_mobile=True, has_touch=True, service_workers='block')
        await self.ctx.add_init_script(FAKE_TTS); await self.ctx.expose_binding('__fs', fs_handler)
        await self.ctx.route('**/firebasejs/**', lambda r: r.fulfill(body=MOCK if r.request.url.endswith('firebase-app-compat.js') else '', content_type='text/javascript'))
        await self.ctx.route('**/fonts.googleapis.com/**', lambda r: r.fulfill(body='', content_type='text/css'))
        self.p = await self.ctx.new_page(); PAGES.append(self.p)
        self.p.on('pageerror', lambda e: self.errors.append(str(e) + ' @ ' + (getattr(e, 'stack', '') or '')[:300]))
        self.p.on('dialog', self.on_dialog)
        await self.p.goto(self.url); await self.p.wait_for_timeout(700)
        return self
    async def on_dialog(self, d):
        self.dialogs.append(d.message); await (d.accept() if getattr(self, 'accept_dialog', False) else d.dismiss())
    async def study_day(self, off):
        """FAST 로 하루 공부 (끝나면 시계를 원래대로)"""
        await self.ev(f"S.dayOffset = {off}; saveLocal(); go('home')")
        await self.ev("window.__oST = window.__oST || window.setTimeout")
        await self.ev(FAST)
        log = await self.p.evaluate(f"({DAY})(0.9)")
        await self.ev("window.setTimeout = window.__oST; window.__dur = 350")
        if log['errs']: self.issues.append(('공부 오류', log['errs'][:2]))
    async def alert(self):
        await self.ev("go('adult')"); await self.p.wait_for_timeout(200)
        return await self.ev("(document.querySelector('.sync-alert')||{}).textContent || ''")
    async def report(self):
        bad = await self.ev('window.__fsBad || []')
        if bad: self.issues.append(('Firestore가 거부한 값', len(bad), bad[:2]))
        print(f'[{self.name}] 오류:', self.errors or '없음', '| 문제:', self.issues or '없음')
    async def adult_tab(self, t):
        await self.ev(f"S.adultTab = '{t}'; go('adult')"); await self.p.wait_for_timeout(200)

def days_on_server(fid): return sorted(k.split('/')[-1] for k in STORE if k.startswith(f'families/{fid}/days/'))

async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8766', '-d', os.path.join(os.path.dirname(DEV), 'dist', 'site')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1); base = 'http://localhost:8766/'
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path=CHROME)
        # ---------- A ----------
        oppa = await Device('A_오빠폰', br, base).open()
        await oppa.click('[data-a="start"]'); await oppa.adult('set')
        await oppa.click('[data-a="famcreate"][data-v="oppa"]'); await oppa.p.wait_for_timeout(1500)
        link, fid = await oppa.ev("familyLink()"), await oppa.ev('S.local.fid')
        tab = await Device('A_태블릿(연결 안 됨)', br, base, 800, 1280).open()
        await tab.click('[data-a="start"]'); await tab.p.wait_for_timeout(300)
        for off in range(3): await tab.study_day(off - 2)
        st0 = await tab.ev("({st:S.stickers.length, days:Object.keys(S.days).length, kor:currLabel('kor'), math:currLabel('math')})")
        print('A 태블릿 (연결 전):', st0)
        a = await tab.alert(); print('A 태블릿 경고:', a[:60])
        tab.expect('아직 가족과 연결되지 않았어요' in a, '연결 안 된 태블릿에 경고가 없음')
        await oppa.adult_tab('oppa'); a = await oppa.alert(); print('A 오빠폰 경고:', a[:50])
        oppa.expect('한 번도 오지 않았어요' in a, '오빠 폰에 "태블릿 기록 안 옴" 경고가 없음')
        await oppa.shot('A_oppa_warn')
        # E) 실수로 오빠를 고르면 한 번 더 묻기 (취소)
        await tab.adult_tab('set'); await tab.p.fill('#joinpaste', link); await tab.click('[data-a="joinpaste"]'); await tab.p.wait_for_timeout(300)
        tab.expect(await tab.screen() == 'join', '링크 붙여넣기로 연결 화면이 안 열림')
        await tab.shot('A_join')
        await tab.click('[data-a="joinrole"][data-v="oppa"]'); await tab.p.wait_for_timeout(500)
        tab.expect(len(tab.dialogs) == 1 and not await tab.ev('linked()'), '공부 기록 있는 기기를 오빠로 고를 때 확인을 안 물음')
        # 재윤이로 연결
        await tab.click('[data-a="joinrole"][data-v="kid"]'); await tab.p.wait_for_timeout(2500)
        st1 = await tab.ev("({st:S.stickers.length, days:Object.keys(S.days).length, kor:currLabel('kor'), math:currLabel('math')})")
        print('A 태블릿 (연결 후):', st1)
        tab.expect(st1 == st0, '연결하면서 태블릿 기록이 바뀜/지워짐')
        await asyncio.sleep(2)
        got = await oppa.ev("({st:S.stickers.length, days:Object.keys(S.days).length, kor:currLabel('kor'), math:currLabel('math')})")
        print('A 오빠폰 (받은 것):', got, '| 서버 days:', days_on_server(fid))
        oppa.expect(got == st0, '태블릿 기록이 오빠 폰에 안 옴')
        await oppa.adult_tab('oppa'); a = await oppa.alert(); print('A 오빠폰 이제:', a)
        oppa.expect('마지막 연결' in a and '✓' in a, '오빠 폰에 태블릿 연결 시간이 안 보임')
        wk = await oppa.ev("(document.querySelector('.panel .stat, .panel') || {}).textContent.slice(0, 80)")
        await oppa.shot('A_oppa_ok')

        # ---------- C) 인터넷 끊긴 채 공부 → 다시 연결 ----------
        await tab.ev("window.__offline = true")
        await tab.study_day(1)
        await asyncio.sleep(1.5)
        tab.expect(await tab.ev("Sync.status") == 'error', '끊겼는데 오류 표시가 없음')
        await tab.ev("window.__offline = false; window.dispatchEvent(new Event('online'))"); await asyncio.sleep(2)
        today1 = await tab.ev("todayKey()")
        oppa.expect(today1 in days_on_server(fid), '다시 연결됐는데 끊겼을 때 공부한 날이 서버에 안 올라감')
        same = await oppa.ev("S.stickers.length") == await tab.ev("S.stickers.length")
        oppa.expect(same, '다시 연결 뒤 스티커 수가 다름')
        print('C 끊김→재연결:', today1 in days_on_server(fid), same)

        # ---------- D) 끊긴 채 공부하고 앱 껐다 켜기 ----------
        await tab.ev("window.__offline = true"); await tab.study_day(2); await asyncio.sleep(1)
        today2 = await tab.ev("todayKey()")
        await tab.p.reload(); await tab.p.wait_for_timeout(2500)
        print('D 다시 켠 뒤 Sync:', await tab.ev("({status:Sync.status, role:role()})"))
        oppa.expect(today2 in days_on_server(fid), '끊긴 채 공부하고 앱을 다시 켰는데 안 올라감')
        oppa.expect(await oppa.ev("S.stickers.length") == await tab.ev("S.stickers.length"), '다시 켠 뒤 스티커 수가 다름')
        print('D 껐다 켜기:', today2 in days_on_server(fid))

        # ---------- F) 인터넷 없이 앱을 켜서 이틀 공부 (중간에 앱 껐다 켬) → 나중에 연결 ----------
        await tab.ev("localStorage.setItem('__mockOffline', '1')")
        await tab.p.reload(); await tab.p.wait_for_timeout(2000)
        f0 = await tab.ev("({status:Sync.status, ready:Sync.ready})"); print('F 끊긴 채 켬:', f0)
        # (기억된 로그인으로 앱은 켜질 수 있음. 대신 보내기가 안 된다는 게 보여야 함 → 공부한 뒤 확인)
        fdays = []
        for off in (3, 4):
            await tab.study_day(off); fdays.append(await tab.ev("todayKey()"))
            await tab.p.reload(); await tab.p.wait_for_timeout(1500)   # 하루 끝나고 앱 껐다 켬 (여전히 끊김)
        await tab.study_day(5); fdays.append(await tab.ev("todayKey()"))   # 마지막 날은 앱을 안 끄고 바로 확인
        fst = await tab.ev("Sync.status"); tab.expect(fst == 'error', f'끊긴 채 공부했는데 못 보냈다는 표시가 없음 ({fst})')
        fq = await tab.ev("Sync.noteQ().length"); print('F 쌓인 알림:', fq, '| 서버에 있나:', [d in days_on_server(fid) for d in fdays])
        tab.expect(fq >= 2, '끊긴 동안 생긴 알림이 기기에 안 쌓임')
        tab.expect(not any(d in days_on_server(fid) for d in fdays), '끊겼는데 서버에 올라감 (시험이 이상)')
        # 인터넷 연결
        await tab.ev("localStorage.removeItem('__mockOffline'); window.dispatchEvent(new Event('online'))"); await asyncio.sleep(3)
        print('F 연결 뒤:', await tab.ev("({status:Sync.status, ready:Sync.ready, q:Sync.noteQ().length})"), '| 서버 days:', [d in days_on_server(fid) for d in fdays])
        oppa.expect(all(d in days_on_server(fid) for d in fdays), '끊긴 채 공부한 날이 연결 뒤에 안 올라감')
        tab.expect(await tab.ev("Sync.noteQ().length") == 0, '쌓인 알림을 연결 뒤에 안 보냄')
        await asyncio.sleep(1)
        od = await oppa.ev(f"{json.dumps(fdays)}.map(k => !!(S.days[k] && Object.values(S.days[k].boards || {{}}).some(b => b.done)))"); print('F 오빠 폰 그날 기록:', od)
        oppa.expect(all(od), '오빠 폰에 끊긴 채 공부한 날 기록이 안 보임')
        notes_srv = [v for k, v in STORE.items() if k.startswith(f'families/{fid}/notes/') and v.get('d') in fdays]
        print('F 서버 알림함(그날):', len(notes_srv), [n['text'][:14] for n in notes_srv[:3]])
        oppa.expect(any('끝냈어요' in n['text'] for n in notes_srv), '끊긴 채 끝낸 날의 "다 끝냈어요" 알림이 알림함에 안 옴')
        on = await oppa.ev(f"S.notes.filter(n => {json.dumps(fdays)}.includes(n.d)).length"); oppa.expect(on >= 1, '오빠 폰 알림함에 끊긴 날 알림이 안 보임')
        same = await oppa.ev("S.stickers.length") == await tab.ev("S.stickers.length"); oppa.expect(same, 'F 스티커 수가 다름')
        print('F 결과: 오빠 폰 알림', on, '스티커 같음', same)

        # ---------- B) 실수로 오빠 기기로 연결된 태블릿 ----------
        oppa2 = await Device('B_오빠폰', br, base).open()
        await oppa2.click('[data-a="start"]'); await oppa2.adult('set')
        await oppa2.click('[data-a="famcreate"][data-v="oppa"]'); await oppa2.p.wait_for_timeout(1500)
        link2, fid2 = await oppa2.ev("familyLink()"), await oppa2.ev('S.local.fid')
        tab2 = await Device('B_태블릿(오빠로 잘못 연결)', br, link2, 800, 1280).open()
        await tab2.click('[data-a="joinrole"][data-v="oppa"]'); await tab2.p.wait_for_timeout(1500)
        for off in range(2): await tab2.study_day(off)
        await asyncio.sleep(1)
        b0 = await tab2.ev("({st:S.stickers.length, days:Object.keys(S.days).length})"); print('B 태블릿:', b0, '| 서버 days:', days_on_server(fid2))
        a = await tab2.alert(); print('B 태블릿 경고:', a[:60], await tab2.ev("({ready:Sync.ready, status:Sync.status, last:Sync.last.s.stickers, st:S.stickers.length, role:role(), linked:linked()})"))
        tab2.expect('오빠 폰"으로 연결돼 있어요' in a, '잘못된 역할 경고가 없음')
        await tab2.shot('B_warn')
        await tab2.adult_tab('set'); await tab2.click('[data-a="famrole"]'); await tab2.p.wait_for_timeout(300)
        await tab2.click('[data-a="joinrole"][data-v="kid"]'); await tab2.p.wait_for_timeout(2500)
        b1 = await tab2.ev("({st:S.stickers.length, days:Object.keys(S.days).length, role:role()})"); print('B 역할 바꾼 뒤:', b1)
        tab2.expect(b1['st'] == b0['st'], '역할을 바꾸면서 태블릿 기록이 지워짐')
        await asyncio.sleep(2)
        g2 = await oppa2.ev("({st:S.stickers.length, days:Object.keys(S.days).length})"); print('B 오빠폰 받은 것:', g2)
        oppa2.expect(g2['st'] == b0['st'] and g2['days'] == b0['days'], '역할을 바꾼 뒤 기록이 오빠 폰에 안 옴')

        # ---------- 사진 (받아쓰기) 이 연결 전에 생겨도 올라가는지 ----------
        blobs = [k for k in STORE if '/blobs/' in k]
        print('서버 사진 조각 수:', len(blobs))
        for d in (oppa, tab, oppa2, tab2): await d.report()
        await br.close()
    srv.terminate()

if __name__ == '__main__':
    asyncio.run(main())
