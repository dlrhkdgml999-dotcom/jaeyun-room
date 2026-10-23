import asyncio, sys, re
sys.path.insert(0,'.')
from harness import Sim
from sim_month import FAST, DAY
async def main():
    async with Sim('N_주간리포트') as s:
        p = s.p
        await s.click('[data-a="start"]'); await s.ev(FAST)
        await s.ev("(() => { window.__mails = []; const of = window.fetch; window.fetch = (u, o) => { if (String(u).includes('script.google.com')) { window.__mails.push(JSON.parse(o.body)); return Promise.resolve({}); } return of(u, o); }; return 1; })()")
        # 메일 설정 (설정 탭)
        await s.ev("S.local = { fid:'testfamilytestfamily22', role:'kid' }; saveLocal()")   # 실제처럼 가족 연결된 태블릿 (서버 없음)
        await s.adult('set'); await p.fill('#mmom', 'mom@example.com'); await p.fill('#moppa', 'oppa@example.com'); await s.click('[data-a="mailsave"]'); await p.wait_for_timeout(200)
        code = await s.ev("document.querySelector('#mailcode').value"); s.expect('mom@example.com,oppa@example.com' in code and 'KEY' in code, '메일 코드 이상')
        await p.fill('#murl', 'https://script.google.com/macros/s/AKfyTEST123/exec'); await s.click('[data-a="mailurl"]'); await p.wait_for_timeout(200)
        await s.click('[data-a="mailtest"]'); await p.wait_for_timeout(200)
        m = await s.ev("window.__mails.filter(x => x.type !== 'note')"); s.expect(len(m) == 1 and m[0]['subject'].startswith('[테스트]'), f'테스트 메일 이상 {m}')
        await s.overflow('메일 설정'); await s.shot('mail_settings')
        await s.ev("go('home')")
        for d in range(9):
            log = await p.evaluate(f"({DAY})(0.85)")
            if log['errs']: s.issues.append((d, log['errs']))
            await s.ev("S.dayOffset = (S.dayOffset || 0) + 1; RUN = null; save(); go('home')")
            await p.wait_for_timeout(50)
            r = await s.ev("[todayKey(), Object.keys(S.reports || {})]")
            print(r)
        m = await s.ev("window.__mails.filter(x => x.type !== 'note').map(x => x.subject)"); print('메일:', m)
        nrep = await s.ev("Object.keys(S.reports || {}).length")   # 9일이면 월요일을 1~2번 지난다 (오늘 날짜에 따라)
        s.expect(nrep >= 1 and len([x for x in m if not x.startswith('[테스트]')]) == nrep, f'주간 메일이 안 감 (리포트 {nrep}개, 메일 {m})')
        notes = await s.ev("S.notes.filter(n => n.text.includes('리포트')).map(n => n.to + ':' + n.text)"); print(notes)
        s.expect(len(notes) == 2 * nrep, f'엄마·오빠 알림 이상 ({len(notes)}개, 리포트 {nrep}개)')
        txt = await s.ev("reportText(S.reports[Object.keys(S.reports)[0]])"); print(txt)
        await s.adult('mom'); await s.overflow('엄마 리포트'); await s.shot('mom_report')
        await s.click('[data-a="atab"][data-v="oppa"]'); await p.wait_for_timeout(200); await s.overflow('오빠 리포트')
asyncio.run(main())
