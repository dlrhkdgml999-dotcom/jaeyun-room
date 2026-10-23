"""강의 안내 창(눈 거리 안내)에서 '보러 갈게' 버튼이 화면 안에 보이고 진짜 눌리는지
폰 · 태블릿 가로(크롬 주소창 빼면 높이 약 700) · 태블릿 세로 · 작은 폰, 바로가기 있을 때 / 없을 때 (2026-10-24 버튼이 화면 밖으로 밀려 아무것도 못 누르던 사고)"""
import asyncio, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Sim, SHOTS
SIZES = [('폰', 384, 832), ('작은폰', 360, 640), ('태블릿가로', 1280, 700), ('태블릿세로', 800, 1180)]
async def main():
    async with Sim('overlay') as s:
        p = s.p
        await s.click('[data-a="start"]'); await p.wait_for_timeout(200)
        for name, w, h in SIZES:
            await p.set_viewport_size({'width': w, 'height': h})
            for mode in ('바로가기', '목록'):
                await s.ev("document.querySelectorAll('.overlay').forEach(o => o.remove()); LECW = null; go('home')")
                await s.ev("S.ebsPlayer = true")
                if mode == '목록': await s.ev("window.__bi = window.__bi || Object.assign({}, EBS_BUILTIN); for (const k in EBS_BUILTIN) delete EBS_BUILTIN[k]")
                else: await s.ev("if (window.__bi) Object.assign(EBS_BUILTIN, window.__bi)")
                await s.ev("openLecture('kor', CURRS.kor.now.lectOff + 1)"); await p.wait_for_timeout(250)
                r = await s.ev("""(() => { const b = document.querySelector('.eye-card [data-lecgo]'); const r = b.getBoundingClientRect();
                  const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                  return { top:r.top, bottom:r.bottom, vh:innerHeight, hit:!!(top && top.closest('[data-lecgo]')), card:document.querySelector('.eye-card').getBoundingClientRect().height,
                    list:!!document.querySelector('.eye-card .ebs-list') }; })()""")
                ok = r['top'] >= 0 and r['bottom'] <= r['vh'] + 1 and r['hit']
                print(f"{name} {w}x{h} {mode}: 버튼 {int(r['top'])}~{int(r['bottom'])} / 화면 {r['vh']} 눌림 {r['hit']} 창 높이 {int(r['card'])} 목록 {r['list']}")
                s.expect(ok, f'{name} {mode}: 보러 갈게 버튼이 안 보이거나 안 눌림')
                s.expect(r['list'] == (mode == '목록'), f'{name} {mode}: 강의목록 그림 표시가 이상')
                await p.screenshot(path=f'{SHOTS}/overlay_{name}_{mode}.png')
                # 진짜로 누르기 (새 창으로 열리는 건 막고)
                await s.ev("document.querySelector('[data-lecgo]').setAttribute('target', '_self'); document.querySelector('[data-lecgo]').addEventListener('click', e => e.preventDefault())")
                await p.locator('[data-lecgo]').click()
                await p.wait_for_timeout(200)
                s.expect(await s.ev('!!LECW') and await s.ev("document.querySelectorAll('.overlay').length") == 0, f'{name} {mode}: 눌렀는데 강의 보는 중으로 안 감')
        await s.ev("if (window.__bi) Object.assign(EBS_BUILTIN, window.__bi)")
asyncio.run(main())
