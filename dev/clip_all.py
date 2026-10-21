import asyncio, sys
sys.path.insert(0,'.')
from harness import Sim
async def main():
    async with Sim('L_진도화면잘림') as s:
        p = s.p
        await s.click('[data-a="start"]')
        for w, h in ((360, 780), (800, 1280)):
            await p.set_viewport_size({'width': w, 'height': h})
            bad = await s.ev("""(async () => { const bad = []; const sleep = ms => new Promise(r => setTimeout(r, ms));
              for (const l of ALL_L) { const seen = new Set(); for (let i = 0; i < 40; i++) { const q = lessonQ(l); const sig = q.type + (q.input || '') + (q.vis ? q.vis.k : '') + (q.opts ? q.opts.join('').length > 30 : ''); if (seen.has(sig)) continue; seen.add(sig);
                RUN = { k:l.subj, b:{ qs:[q], idx:0, correct:0, secs:0 } }; go('q'); await sleep(20);
                if (document.documentElement.scrollWidth > innerWidth) bad.push(`${l.id}/${q.type}: 가로 넘침`);
                const cl = [...document.querySelectorAll('.opt, .numpad button, .tiles button, .q-visual')].filter(b => b.scrollWidth > b.clientWidth + 2).map(b => b.textContent.trim().slice(0, 20));
                if (cl.length) bad.push(`${l.id}/${q.type}: 잘림 ${cl.join('|')}`);
              }
              for (let i = 0; i < l.cards.length; i++) { go('cards', { lesson:l.id }); CARDS.i = i; go('cards'); await sleep(15); if (document.documentElement.scrollWidth > innerWidth) bad.push(`${l.id} 카드${i}: 가로 넘침`); const ill = document.querySelector('.concept-ill'); if (ill && ill.scrollWidth > ill.clientWidth + 2) bad.push(`${l.id} 카드${i}: 그림 잘림`); } }
              return bad; })()""")
            print(w, len(bad)); print(*bad[:30], sep='\n')
asyncio.run(main())
