import asyncio, os, json, base64, glob
from playwright.async_api import async_playwright

# 세션마다 설치된 크롬 버전이 달라서 찾아서 씀
CHROME = (sorted(glob.glob('/opt/pw-browsers/chromium-*/chrome-linux*/chrome')) or [None])[-1]
DEV = os.path.dirname(os.path.abspath(__file__)); SP = os.path.join(DEV, 'out')
SHOTS = SP + '/shots3'
os.makedirs(SHOTS, exist_ok=True)

def build_page():
    H = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dist', 'jaeyun-room.html'), encoding='utf8').read()
    doc = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + H + '</body></html>'
    pf = f'{SP}/page3_{os.getpid()}.html'   # 여러 시뮬레이션을 동시에 돌려도 안 겹치게
    open(pf, 'w', encoding='utf8').write(doc)
    return 'file://' + pf

# 음성 엔진 흉내: 무엇을 읽었는지 기록하고, 0.35초 뒤 끝난 걸로 처리
FAKE_TTS = """
(() => {
  window.__said = [];
  let cur = null, timer = null;
  const synth = {
    speaking:false,
    getVoices(){ return [{lang:'ko-KR',name:'ko'},{lang:'en-US',name:'en'}]; },
    speak(u){ window.__said.push(u.text); cur = u; clearTimeout(timer); timer = setTimeout(() => { const x = cur; cur = null; x && x.onend && x.onend(); }, window.__dur || 350); },
    cancel(){ clearTimeout(timer); const x = cur; cur = null; if (x && x.onerror) x.onerror({error:'interrupted'}); },
    set onvoiceschanged(f){}, get onvoiceschanged(){ return null; }
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable:true });
  window.SpeechSynthesisUtterance = function(t){ this.text = t; };
  // 음성 파일 재생도 바로 끝난 걸로
  HTMLMediaElement.prototype.play = function(){ window.__said.push('[clip]'); setTimeout(() => this.onended && this.onended(), 200); return Promise.resolve(); };
  HTMLMediaElement.prototype.pause = function(){};
})();
"""

class Sim:
    def __init__(self, name):
        self.name = name; self.errors = []; self.issues = []; self.log = []
    async def __aenter__(self):
        self.pw = await async_playwright().start()
        self.b = await self.pw.chromium.launch(executable_path=CHROME)
        self.ctx = await self.b.new_context(viewport={'width': 384, 'height': 832}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await self.ctx.add_init_script(FAKE_TTS)
        self.p = await self.ctx.new_page()
        self.p.on('pageerror', lambda e: self.errors.append(str(e)))
        self.url = build_page()
        await self.p.goto(self.url); await self.p.wait_for_timeout(500)
        return self
    async def __aexit__(self, *a):
        await self.b.close(); await self.pw.stop()
        print(f'\n===== {self.name} =====')
        print('page errors:', self.errors or '없음')
        print('issues:', self.issues or '없음')
    def expect(self, cond, msg):
        if not cond: self.issues.append(msg)
    async def ev(self, js): return await self.p.evaluate(js)
    async def click(self, sel): await self.p.locator(sel).first.click()
    async def shot(self, n): await self.p.screenshot(path=f'{SHOTS}/{self.name}_{n}.png', full_page=True)
    async def screen(self): return await self.ev('SCREEN')
    async def overflow(self, where):
        o = await self.ev('document.documentElement.scrollWidth > innerWidth')
        self.expect(not o, f'가로 넘침: {where}')

    async def answer(self, mode=None):
        p = self.p
        q = await self.ev('({input:RUN.q.input, opts:RUN.q.opts, ans:RUN.q.ans, tiles:RUN.q.tiles, type:RUN.q.type, key:RUN.q.key, rev:RUN.q.rev||""})')
        tries = {'once': 1, 'twice': 2}.get(mode, 0)
        if q['input'] == 'choice': tries = min(tries, len(q['opts']) - 1)
        for t in range(tries):
            if q['input'] == 'choice':
                wrong = [i for i, o in enumerate(q['opts']) if str(o) != str(q['ans'])]
                await p.locator('.opt').nth(wrong[t % len(wrong)]).click()
            elif q['input'] == 'numpad':
                for ch in str(int(q['ans']) + 1): await p.locator(f'.numpad button[data-v="{ch}"]').click()
                await p.locator('.numpad .ok').click()
            else:
                ans = list(q['ans']); fake = [i for i, x in enumerate(q['tiles']) if x not in ans]
                order = [fake[0]]
                for k in range(1, len(ans)):
                    order.append(next(j for j, x in enumerate(q['tiles']) if x == ans[k] and j not in order))
                for i in order: await p.locator('.tiles button').nth(i).click()
                await p.wait_for_timeout(320)
            await p.wait_for_timeout(120)
        if tries == 2:
            await p.locator('[data-a="nextq"]').click(); await p.wait_for_timeout(80)
            return q
        if q['input'] == 'choice':
            await p.locator('.opt').nth([str(o) for o in q['opts']].index(str(q['ans']))).click()
        elif q['input'] == 'numpad':
            for ch in str(q['ans']): await p.locator(f'.numpad button[data-v="{ch}"]').click()
            await p.locator('.numpad .ok').click()
        else:
            used = []
            for ch in q['ans']:
                i = next(j for j, x in enumerate(q['tiles']) if x == ch and j not in used); used.append(i)
                await p.locator('.tiles button').nth(i).click()
            await p.wait_for_timeout(300)
        await p.wait_for_timeout(1650)
        return q

    async def board(self, k, pattern=lambda i: None, stop_after=None):
        await self.click(f'[data-k="{k}"]'); await self.p.wait_for_timeout(250)
        await self.click('[data-a="begin"]'); await self.p.wait_for_timeout(150)
        await self.through_lecture()
        i = 0
        while await self.screen() == 'q':
            if stop_after is not None and i >= stop_after: return i
            q = await self.answer(pattern(i)); self.log.append((k, q['type'], pattern(i), q['rev'])); i += 1
        if await self.screen() == 'write':
            self.saw_write = getattr(self, 'saw_write', 0) + 1
            await self.click('[data-a="writeskip"]'); await self.p.wait_for_timeout(200)
        return i

    async def through_lecture(self):
        # 강의 안내 → 강의 보는 중 → 다 봤어요 → 눈 쉬기 → 개념 카드 → 문제
        if await self.p.locator('.eye-overlay [data-lecgo]').count():
            self.saw_lecture = getattr(self, 'saw_lecture', 0) + 1
            await self.ev("(() => { const b = RUN.b; document.querySelector('.eye-overlay').remove(); LECW = { s:b.cur.subj, n:b.cur.lec, at:Date.now() - 28 * 60000, opt:false }; go('lecwait'); })()")
            await self.p.wait_for_timeout(100)
            await self.click('[data-a="lecdone"]'); await self.p.wait_for_timeout(150)
            if await self.screen() == 'leccheck': await self.click(f'[data-a="lecwatched"][data-v="{await self.ev("RUN.b.cur.lec")}"]'); await self.p.wait_for_timeout(150)
            if await self.screen() == 'eyebreak': await self.ev("ACT.eyedone({ dataset:{ v:document.querySelector('#eyedone').dataset.v } })"); await self.p.wait_for_timeout(150)
        g = 0
        while await self.screen() == 'cards' and g < 8:
            g += 1
            if await self.p.locator('[data-a="cardsdone"]').count(): await self.click('[data-a="cardsdone"]')
            else: await self.click('[data-a="cardmove"][data-v="1"]')
            await self.p.wait_for_timeout(120)

    async def dictation(self, photo=True, stop_at=None):
        for n in range(10):
            if stop_at is not None and n == stop_at: return
            await self.p.wait_for_timeout(950); await self.click('[data-a="dictnext"]')
        if photo:
            data = await self.ev("""(() => { const c=document.createElement('canvas'); c.width=1500;c.height=2000; const x=c.getContext('2d'); x.fillStyle='#fff';x.fillRect(0,0,1500,2000); for(let i=0;i<4000;i++){x.fillStyle=`hsl(${i%360},60%,60%)`;x.fillRect(Math.random()*1500,Math.random()*2000,8,8);} return c.toDataURL('image/png'); })()""")
            f = SP + '/note_big.png'; open(f, 'wb').write(base64.b64decode(data.split(',')[1]))
            await self.p.set_input_files('#photoIn', f); await self.p.wait_for_timeout(700)
            await self.click('[data-a="sendphoto"]')
        else:
            await self.click('[data-a="skipphoto"]')
        await self.p.wait_for_timeout(400)

    async def after_reward(self):
        await self.p.wait_for_timeout(300)
        await self.p.locator('.btn.big').last.click(); await self.p.wait_for_timeout(250)
        if await self.screen() == 'eyebreak':
            self.saw_eyebreak = True; await self.ev("go('home')"); await self.p.wait_for_timeout(100)
        if await self.screen() == 'alldone':
            await self.click('[data-a="home"]'); await self.p.wait_for_timeout(150)

    async def full_day(self, pattern=lambda i: None, photo=True):
        for k in ['kor', 'math']:
            await self.board(k, pattern); await self.after_reward()
        await self.board('eng', pattern); await self.dictation(photo); await self.after_reward()
        await self.board('rev', pattern); await self.after_reward()

    async def adult(self, tab):
        await self.ev("go('pin')")
        if await self.screen() == 'pin':
            for _ in range(4): await self.click('[data-a="pin"][data-v="0"]')
        await self.p.wait_for_timeout(150)
        await self.click(f'[data-a="atab"][data-v="{tab}"]'); await self.p.wait_for_timeout(150)

    async def grade_all(self, wrong_idx=()):
        while await self.p.locator('[data-a="grade"]').count():
            k = await self.p.locator('[data-a="grade"]').first.get_attribute('data-v')
            for i in range(10):
                v = '0' if i in wrong_idx else '1'
                await self.p.locator(f'[data-a="mark"][data-v="{k}|{i}|{v}"]').click()
            await self.p.locator(f'[data-a="grade"][data-v="{k}"]').click(); await self.p.wait_for_timeout(150)

    async def next_day(self):
        await self.adult('set'); await self.click('[data-a="nextday"]'); await self.p.wait_for_timeout(100)
        await self.ev("go('home')"); await self.p.wait_for_timeout(100)
