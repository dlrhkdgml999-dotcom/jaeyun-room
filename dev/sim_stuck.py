"""2026-10-29 사고 재현: 태블릿은 와이파이가 되는데 5일 동안 서버에 아무것도 안 감 (오빠 폰: "마지막 연결 5일 전")
G1) SDK 보내기 줄이 조용히 멈춤(__sdkHang) → 직접 보내기(REST)로 기록·연결 표시가 가는지
G2) 직접 보내기가 막힘(__restDown) → SDK로 가는지
G3) 둘 다 막힘 → 태블릿 설정·첫 화면·오빠 폰에 이유가 보이는지, 풀리면 저절로 다 가는지
G4) 예전 버전에서 올라온 태블릿: 예전 지문(jaeyun-synced)이 "다 보냄"이라고 해도 서버에 없는 날을 전부 다시 보내는지
G5) REST로 보낸 값이 SDK로 보낸 값과 똑같이 저장되는지 (숫자·빈 배열·null·한글·문제 기록 b.log)"""
import asyncio, sys, os, json, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import CHROME
from playwright.async_api import async_playwright
from sim_sync import Device, STORE, days_on_server, DEV

def meta(fid): return STORE.get(f'families/{fid}/meta/kid') or {}

async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8767', '-d', os.path.join(os.path.dirname(DEV), 'dist', 'site')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1); base = 'http://localhost:8767/'
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path=CHROME)
        oppa = await Device('오빠폰', br, base).open()
        await oppa.click('[data-a="start"]'); await oppa.adult('set')
        await oppa.click('[data-a="famcreate"][data-v="oppa"]'); await oppa.p.wait_for_timeout(1500)
        link, fid = await oppa.ev("familyLink()"), await oppa.ev('S.local.fid')
        tab = await Device('태블릿', br, link, 1280, 800).open()
        await tab.click('[data-a="joinrole"][data-v="kid"]'); await tab.p.wait_for_timeout(1500)
        await tab.ev("window.__sendWait = 1500")

        # ---------- G1 SDK가 조용히 멈춤 ----------
        await tab.ev("window.__sdkHang = true")
        await tab.study_day(-4); await asyncio.sleep(2.5)
        await tab.ev("Sync.beat(true)"); await asyncio.sleep(1)
        d1 = await tab.ev("todayKey()")
        m = meta(fid); print('G1 서버 days:', days_on_server(fid), '| 연결 표시:', {k: m.get(k) for k in ('via', 'unsent', 'err', 'ver')}, '| SDK 멈춘 쓰기:', await tab.ev('window.__hung || 0'))
        tab.expect(d1 in days_on_server(fid), 'G1: SDK가 멈추면 기록이 서버에 안 감')
        tab.expect(m.get('via') == 'rest' and not m.get('err'), f'G1: 연결 표시가 직접 보내기로 안 옴 {m}')
        await oppa.adult_tab('oppa'); a = await oppa.alert(); print('G1 오빠 폰:', a[:60])
        oppa.expect('✓' in a, 'G1: 오빠 폰에 연결 ✓가 안 뜸')

        # ---------- G2 직접 보내기 막힘, SDK는 됨 ----------
        await tab.ev("window.__sdkHang = false; window.__restDown = true")
        await tab.study_day(-3); await asyncio.sleep(2.5)
        d2 = await tab.ev("todayKey()"); print('G2 서버 days:', days_on_server(fid), '| via:', await tab.ev('Sync.via'))
        tab.expect(d2 in days_on_server(fid), 'G2: REST가 막히면 SDK로도 안 감')

        # ---------- G3 둘 다 막힘 → 이유가 보이고, 풀리면 다 감 ----------
        await tab.ev("window.__sdkHang = true; window.__restDown = true")
        await tab.study_day(-2); await asyncio.sleep(4)
        d3 = await tab.ev("todayKey()")
        st = await tab.ev("({status:Sync.status, err:Sync.error, fail:!!Sync.failSince})"); print('G3 태블릿:', st)
        tab.expect(st['status'] == 'error' and st['fail'], 'G3: 둘 다 막혔는데 태블릿이 실패를 모름')
        tab.expect(d3 not in days_on_server(fid), 'G3: (흉내 확인) 막혔는데 서버에 감')
        await tab.adult_tab('set'); txt = await tab.ev("document.querySelector('.screen').textContent")
        tab.expect('보내기 실패' in txt, 'G3: 태블릿 설정에 "보내기 실패"가 안 보임')
        await tab.shot('G3_set')
        # 10분 넘게 실패 → 재윤이 첫 화면 아래 작은 안내, 30분 넘으면 오빠 폰 알림(ntfy) 한 번
        await tab.ev("Sync.failSince = Date.now() - 40 * 60000; localStorage.removeItem('jaeyun-syncwarn'); Sync.sentBad(new Error('시험'))")
        await tab.ev("go('home')"); await tab.p.wait_for_timeout(200)
        note = await tab.ev("(document.querySelector('.kid-sync-note')||{}).textContent || ''"); print('G3 태블릿 첫 화면:', note)
        tab.expect('안 가고 있어요' in note, 'G3: 재윤이 첫 화면에 안내가 없음')
        await tab.shot('G3_home')
        q = await tab.ev("JSON.parse(localStorage.getItem('jaeyun-ntfyq') || '[]').concat(window.__ntfySent || []).map(x => x.text || x.message || '').filter(t => /못 보내고/.test(t)).length")
        print('G3 오빠 ntfy 알림:', q); tab.expect(q >= 1, 'G3: 오래 못 보내도 오빠에게 ntfy 알림이 안 감')
        # 풀림 → 다음 재시도에서 저절로
        await tab.ev("window.__sdkHang = false; window.__restDown = false; Sync.tries = 0; Sync.push()"); await asyncio.sleep(2.5)
        st = await tab.ev("({status:Sync.status, fail:Sync.failSince})"); print('G3 풀린 뒤:', st, days_on_server(fid))
        tab.expect(d3 in days_on_server(fid) and st['status'] == 'on' and not st['fail'], 'G3: 풀렸는데 못 보낸 날이 안 감')
        await tab.ev("Sync.beat(true)"); await asyncio.sleep(1)
        await oppa.adult_tab('oppa'); a = await oppa.alert(); print('G3 오빠 폰:', a[:70])
        oppa.expect('✓' in a and '못하고' not in a, 'G3: 풀렸는데 오빠 폰 경고가 그대로')
        await tab.ev("go('home')"); note = await tab.ev("(document.querySelector('.kid-sync-note')||{}).textContent || ''")
        tab.expect(not note, 'G3: 풀렸는데 첫 화면 안내가 그대로')

        # ---------- G4 예전 버전 지문 ----------
        days_before = days_on_server(fid)
        await tab.ev("""(() => { const x = { fid:S.local.fid, s:{}, d:{}, b:{} }; Object.keys(S.days).forEach(k => x.d[k] = 'x'); [...KID_KEYS, ...ADULT_KEYS].forEach(k => x.s[k] = 'x');
          localStorage.setItem('jaeyun-synced', JSON.stringify(x)); localStorage.removeItem('jaeyun-synced2'); })()""")
        for k in list(STORE):
            if k.startswith(f'families/{fid}/days/'): del STORE[k]
        await tab.p.reload(); await tab.p.wait_for_timeout(2500)
        print('G4 다시 켠 뒤 서버 days:', days_on_server(fid), '(전:', len(days_before), ')', '| 예전 지문 남음:', await tab.ev("!!localStorage.getItem('jaeyun-synced')"))
        tab.expect(days_on_server(fid) == days_before, 'G4: 예전 지문 때문에 못 보낸 날이 다시 안 감')

        # ---------- G5 REST로 보낸 값 = 기기 값 ----------
        same = await tab.ev("""(() => { const bad = []; for (const k of Object.keys(S.days)) { const a = JSON.stringify(Sync.pack(S.days[k])), b = Sync.last.days[k]; if (a !== b) bad.push(k); } return bad; })()""")
        srv_vs = await tab.ev("Object.keys(S.days)")
        diff = []
        for k in srv_vs:
            v = STORE.get(f'families/{fid}/days/{k}', {}).get('v')
            mine = await tab.ev(f"Sync.pack(S.days['{k}'])")
            if json.dumps(v, sort_keys=True, ensure_ascii=False) != json.dumps(mine, sort_keys=True, ensure_ascii=False): diff.append(k)
        print('G5 서버 값 ≠ 태블릿 값:', diff, same)
        tab.expect(not diff, f'G5: 직접 보낸 값이 서버에서 달라짐 {diff}')
        # 오빠 폰이 받은 공부 기록 (b.log 문제 기록까지)
        got = await oppa.ev("Object.keys(S.days).map(k => [k, Object.values(S.days[k].boards || {}).reduce((a, b) => a + ((b && b.log) || []).length, 0)])")
        mine = await tab.ev("Object.keys(S.days).map(k => [k, Object.values(S.days[k].boards || {}).reduce((a, b) => a + ((b && b.log) || []).length, 0)])")
        print('G5 문제 기록 수 (오빠 폰 / 태블릿):', sorted(got), sorted(mine))
        oppa.expect(sorted(got) == sorted(mine), 'G5: 오빠 폰 문제 기록이 태블릿과 다름')
        for d in (oppa, tab): await d.report()
        await br.close()
    srv.terminate()

asyncio.run(main())
