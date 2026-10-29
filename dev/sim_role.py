"""2026-10-29 진짜 원인 재현: 재윤이 태블릿이 "오빠 폰"으로 연결돼 있음 (태블릿 맨 위 "오빠 폰에서 보는 재윤이 화면")
R1) 태블릿(오빠 역할)에서 사흘 공부 + 중간에 앱 껐다 켜기 → 진도·스티커가 서버 예전 값으로 되돌아가지 않는지
R2) 태블릿 첫 화면 맨 위에 경고 + "재윤이 태블릿으로 바꾸기", 앱을 켜면 엄마·오빠 메뉴가 아니라 첫 화면으로
R3) 오빠 폰 맨 위에 "재윤이가 공부하는 태블릿이 '오빠 폰'으로 연결돼 있어요"
R4) 버튼 한 번 → 재윤이 역할, 태블릿 기록(스티커·진도·날짜) 그대로 서버·오빠 폰으로, 경고 사라짐
N1) 오답노트: 첫 화면·엄마 메뉴에서 열림, 틀린 문제 수 = 기록의 틀린 문제(같은 문제 묶음), 정답 가려짐 → 누르면 보임, 듣기 문제는 정답이 안 보임, 과목·상태 거르기, 다시 맞힌 문제 표시"""
import asyncio, sys, os, json, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import CHROME
from playwright.async_api import async_playwright
from sim_sync import Device, STORE, days_on_server, DEV

async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8768', '-d', os.path.join(os.path.dirname(DEV), 'dist', 'site')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1); base = 'http://localhost:8768/'
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path=CHROME)
        oppa = await Device('오빠폰', br, base).open()
        await oppa.click('[data-a="start"]'); await oppa.adult('set')
        await oppa.click('[data-a="famcreate"][data-v="oppa"]'); await oppa.p.wait_for_timeout(1500)
        link, fid = await oppa.ev("familyLink()"), await oppa.ev('S.local.fid')
        tab = await Device('태블릿', br, link, 1280, 800).open(); tab.accept_dialog = True
        await tab.click('[data-a="joinrole"][data-v="kid"]'); await tab.p.wait_for_timeout(1500)
        await tab.study_day(-6); await tab.study_day(-5); await asyncio.sleep(2)
        srv_before = days_on_server(fid)
        # 10/24에 일어난 일: 태블릿이 "오빠"로 바뀜
        await tab.adult_tab('set'); await tab.click('[data-a="famrole"]'); await tab.p.wait_for_timeout(300)
        await tab.click('[data-a="joinrole"][data-v="oppa"]'); await tab.p.wait_for_timeout(2000)
        print('역할:', await tab.ev('role()'), '| 서버 days:', srv_before)
        prog = []
        for off in (-3, -2, -1):
            await tab.ev("window.__forceTablet = true"); await tab.study_day(off)
            prog.append(await tab.ev("({st:S.stickers.length, math:currLabel('math'), kor:currLabel('kor')})"))
            await tab.p.reload(); await tab.p.wait_for_timeout(1500); await tab.ev("window.__forceTablet = true")
            after = await tab.ev("({st:S.stickers.length, math:currLabel('math'), kor:currLabel('kor'), screen:SCREEN})")
            print(f'R1 {off}: 공부 뒤', prog[-1], '→ 껐다 켠 뒤', after)
            tab.expect(after['st'] == prog[-1]['st'] and after['math'] == prog[-1]['math'], f'R1: 앱을 껐다 켜니 진도·스티커가 되돌아감 {prog[-1]} → {after}')
            tab.expect(after['screen'] == 'home', f'R2: 앱을 켜면 첫 화면이 아니라 {after["screen"]}')
        await tab.ev("go('home')"); await tab.p.wait_for_timeout(200)
        warn = await tab.ev("(document.querySelector('.role-warn')||{}).textContent || ''"); print('R2 태블릿 첫 화면:', warn[:60])
        tab.expect('오빠 폰' in warn and await tab.ev("!!document.querySelector('[data-a=tokid]')"), 'R2: 태블릿 첫 화면에 역할 경고·바꾸기 버튼이 없음')
        await tab.shot('R2_warn')
        print('R3 서버 days (바꾸기 전):', days_on_server(fid))
        await oppa.adult_tab('oppa'); await asyncio.sleep(1); a = await oppa.alert(); print('R3 오빠 폰:', a[:70])
        oppa.expect('오빠 폰"으로 연결돼 있어요' in a, 'R3: 오빠 폰에 역할이 잘못된 태블릿 경고가 없음')
        await oppa.shot('R3_alert')
        local = await tab.ev("({st:S.stickers.length, days:Object.keys(S.days).sort(), math:currLabel('math'), kor:currLabel('kor')})")
        await tab.click('[data-a="tokid"]'); await tab.p.wait_for_timeout(3000)
        now = await tab.ev("({role:role(), st:S.stickers.length, math:currLabel('math'), kor:currLabel('kor'), warn:!!document.querySelector('.role-warn')})"); print('R4 바꾼 뒤 태블릿:', now)
        tab.expect(now['role'] == 'kid' and now['st'] == local['st'] and now['math'] == local['math'] and not now['warn'], f'R4: 바꾸면서 태블릿 기록이 달라짐 {local} → {now}')
        await asyncio.sleep(2)
        print('R4 서버 days:', days_on_server(fid), '| 태블릿 days:', local['days'])
        tab.expect(set(local['days']) <= set(days_on_server(fid)), 'R4: 태블릿 날짜 기록이 서버에 다 안 감')
        got = await oppa.ev("({st:S.stickers.length, days:Object.keys(S.days).length, math:currLabel('math')})"); print('R4 오빠 폰:', got)
        oppa.expect(got['st'] == local['st'] and got['math'] == local['math'], 'R4: 오빠 폰 기록이 태블릿과 다름')
        await tab.ev("Sync.beat(true)"); await asyncio.sleep(1.5)
        await oppa.adult_tab('oppa'); a = await oppa.alert(); print('R4 오빠 폰 경고:', a[:60])
        oppa.expect('연결돼 있어요' not in a and '✓' in a, f'R4: 고친 뒤에도 오빠 폰 경고가 그대로 {a[:60]}')

        # ---------- N1 오답노트 ----------
        await tab.ev("go('home')"); await tab.p.wait_for_timeout(200)
        await tab.click('.home-nav [data-a="notebook"]'); await tab.p.wait_for_timeout(300)
        nb = await tab.ev("""(() => { const items = notebookItems(); const wrongLogs = Object.keys(S.days).flatMap(k => dayLogs(k)).filter(x => x.r !== 1);
          const ids = new Set(wrongLogs.map(x => x.subj + '|' + x.t + '|' + x.a));
          return { screen:SCREEN, items:items.length, uniq:ids.size, todo:items.filter(x => !x.fixed).length, cards:document.querySelectorAll('.nb-card').length,
            answersShown:document.querySelectorAll('.nb-a').length, showBtns:document.querySelectorAll('[data-a=nbopen]').length,
            leak:[...document.querySelectorAll('.nb-card')].filter((c, i) => { const x = VIEWS.notebook.list[i]; const ls = noteListen(x); return ls && ls === x.a && c.querySelector('.nb-q').textContent.replace(/\[보기[^\]]*\]/g, '').includes(ls); }).length }; })()""")
        print('N1 오답노트:', nb)
        tab.expect(nb['screen'] == 'notebook', 'N1: 첫 화면에서 오답노트가 안 열림')
        tab.expect(nb['items'] == nb['uniq'] and nb['items'] > 0, f"N1: 오답노트 문제 수({nb['items']})가 기록의 틀린 문제({nb['uniq']})와 다름")
        tab.expect(nb['answersShown'] == 0 and nb['showBtns'] == nb['cards'], 'N1: 정답이 처음부터 보임')
        tab.expect(nb['leak'] == 0, f"N1: 듣기 문제 정답이 문제 글에 보임 ({nb['leak']}개)")
        await tab.shot('N1_kid')
        await tab.p.locator('[data-a="nbopen"]').first.click(); await tab.p.wait_for_timeout(150)
        tab.expect(await tab.ev("document.querySelectorAll('.nb-a').length") == 1, 'N1: 정답 보기를 눌러도 안 보임')
        await tab.p.locator('[data-a="nbsay"]').first.click(); said = await tab.ev("window.__said.slice(-1)[0] || ''"); print('N1 읽어 준 말:', said[:50])
        tab.expect(said and '[보기' not in said and '🔊' not in said, 'N1: 문제 읽어 주기가 이상함')
        for subj in ['math', 'kor', 'eng']:
            await tab.click(f'[data-a="nbset"][data-k="subj"][data-v="{subj}"]'); await tab.p.wait_for_timeout(120)
            ok = await tab.ev(f"VIEWS.notebook.list.every(x => x.subj === '{subj}')"); tab.expect(ok, f'N1: {subj}만 거르기가 안 맞음')
        await tab.click('[data-a="nbset"][data-k="subj"][data-v="all"]')
        # 규칙(10/29): 복습 판에서 혼자 맞힌 건 남고, 엄마랑 같이 풀어서 맞힌 것만 오답노트에서 없어진다
        fx = await tab.ev("""(() => { const x = notebookItems().find(i => !i.fixed && i.subj !== 'dict'); if (!x) return null; const dy = day();
          dy.boards.rev = dy.boards.rev || { done:true, log:[] }; (dy.boards.rev.log = dy.boards.rev.log || []).push([x.t, x.a, '', 1, 5, x.subj]);
          const solo = !!notebookItems().find(i => i.id === x.id).fixed;
          dy.nb = (dy.nb || []).concat([[x.t, x.a, '', 1, x.subj]]); const together = !!notebookItems().find(i => i.id === x.id).fixed;
          VIEWS.notebook(); return { solo, together, shown:VIEWS.notebook.list.some(i => i.id === x.id) }; })()""")
        print('N1 혼자 맞힘 / 같이 맞힘 / 아직 보임:', fx); tab.expect(fx and not fx['solo'] and fx['together'] and not fx['shown'], f'N1: 오답노트 없어지는 규칙이 다름 {fx}')
        await tab.overflow('오답노트 태블릿')
        # 엄마 메뉴(오빠 폰)에서도
        await oppa.adult_tab('mom'); await oppa.click('.nb-tile'); await oppa.p.wait_for_timeout(300)
        on = await oppa.ev("({screen:SCREEN, cards:document.querySelectorAll('.nb-card').length})"); print('N1 폰 오답노트:', on)
        oppa.expect(on['screen'] == 'notebook' and on['cards'] > 0, 'N1: 폰 엄마 메뉴에서 오답노트가 안 열리거나 비어 있음')
        await oppa.overflow('오답노트 폰'); await oppa.shot('N1_phone')
        await oppa.click('[data-a="nbback"]'); oppa.expect(await oppa.ev('SCREEN') == 'adult', 'N1: 폰에서 나가기가 엄마 메뉴로 안 감')
        for d in (oppa, tab): await d.report()
        await br.close()
    srv.terminate()

asyncio.run(main())
