import asyncio, sys
sys.path.insert(0,'.')
from harness import CHROME, Sim, FAKE_TTS, build_page, SHOTS
from playwright.async_api import async_playwright
SCRIPT = [
 ('home', "go('home')"),
 ('intro_math_lec', "ACT.board({dataset:{k:'math'}})"),
 ('guard', "ACT.begin()"),
 ('lecwait', "document.querySelector('.eye-overlay') && document.querySelector('.eye-overlay').remove(); LECW={s:'math',n:1,at:Date.now()-120000}; go('lecwait')"),
 ('cards_m11', "go('cards',{lesson:'m1-1',fromBoard:true})"),
 ('cards_m35', "go('cards',{lesson:'m3-5'})"),
 ('intro_kor_wait', "go('home'); ACT.board({dataset:{k:'kor'}})"),
 ('q_clockpick', "RUN={k:'math',b:{qs:[(()=>{let q;do{q=lessonQ(lessonById('m3-5'))}while(!q.optHtml);return q})()],idx:0,correct:0,secs:0}}; go('q')"),
 ('q_shape', "RUN.b.qs=[(()=>{let q;do{q=lessonQ(lessonById('m3-1'))}while(!q.optHtml);return q})()];go('q')"),
 ('q_chart', "RUN.b.qs=[(()=>{let q;do{q=lessonQ(lessonById('m5-4'))}while(q.prompt.indexOf('?')<0);return q})()];go('q')"),
 ('q_pat2', "RUN.b.qs=[lessonQ(lessonById('m5-2'))];go('q')"),
 ('q_pat1', "RUN.b.qs=[(()=>{let q;do{q=lessonQ(lessonById('m5-1'))}while(q.prompt.indexOf('되풀이')<0);return q})()];go('q')"),
 ('q_card', "RUN.b.qs=[(()=>{let q;do{q=lessonQ(lessonById('m1-5'))}while(q.type!=='cards');return q})()];go('q')"),
 ('q_tens', "RUN.b.qs=[(()=>{let q;do{q=lessonQ(lessonById('m1-1'))}while(!q.vis||q.vis.k!=='tens');return q})()];go('q')"),
 ('q_m61', "RUN.b.qs=[(()=>{let q;do{q=lessonQ(lessonById('m6-1'))}while(q.prompt.indexOf('모두')<0);return q})()];go('q')"),
 ('q_m42', "RUN.b.qs=[(()=>{let q;do{q=lessonQ(lessonById('m4-2'))}while(q.prompt.indexOf('10을')<0);return q})()];go('q')"),
 ('q_n11', "RUN={k:'kor',b:{qs:[(()=>{let q;do{q=lessonQ(lessonById('n1-1'))}while(q.type!=='mimic'||!q.opts.includes('소리'));return q})()],idx:0,correct:0,secs:0}}; go('q')"),
 ('q_n23', "RUN.b.qs=[lessonQ(lessonById('n2-3'))];go('q')"),
 ('q_n41', "RUN.b.qs=[(()=>{let q;do{q=lessonQ(lessonById('n4-1'))}while(q.prompt.indexOf('다음에')<0);return q})()];go('q')"),
 ('q_n62', "RUN.b.qs=[(()=>{let q;do{q=lessonQ(lessonById('n6-2'))}while(!q.optHtml);return q})()];go('q')"),
 ('q_n82', "RUN.b.qs=[(()=>{let q;do{q=lessonQ(lessonById('n8-2'))}while(q.prompt.indexOf('이런 행동')<0);return q})()];go('q')"),
 ('q_m32', "RUN.b.qs=[(()=>{let q;do{q=lessonQ(lessonById('m3-2'))}while(q.prompt.indexOf('모두')<0);return q})()];go('q')"),
 ('q_n83', "RUN.b.qs=[(()=>{let q;do{q=lessonQ(lessonById('n8-3'))}while(q.type!=='play');return q})()];go('q')"),
 ('map_math', "go('map',{s:'math'})"),
 ('adult_mom', "S.adultTab='mom'; go('adult')"),
]
async def run(w, h, tag):
    pw = await async_playwright().start(); b = await pw.chromium.launch(executable_path=CHROME)
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=1, is_mobile=True, has_touch=True)
    await ctx.add_init_script(FAKE_TTS); p = await ctx.new_page(); errs = []
    p.on('pageerror', lambda e: errs.append(str(e)))
    await p.goto(build_page()); await p.wait_for_timeout(400)
    await p.click('[data-a="start"]'); await p.wait_for_timeout(200)
    over = []
    for name, js in SCRIPT:
        try: await p.evaluate(js)
        except Exception as e: errs.append(f'{name}: {e}'); continue
        await p.wait_for_timeout(250)
        o = await p.evaluate("document.documentElement.scrollWidth - innerWidth")
        if o > 0: over.append((name, o))
        await p.screenshot(path=f'{SHOTS}/v12_{tag}_{name}.png', full_page=(name.startswith('adult')))
    print(tag, 'errors:', errs or '없음', 'overflow:', over or '없음')
    await b.close(); await pw.stop()
async def main():
    await run(384, 832, 'phone'); await run(800, 1280, 'tab')
asyncio.run(main())
