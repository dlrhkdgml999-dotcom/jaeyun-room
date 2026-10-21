import asyncio, sys
sys.path.insert(0,'.')
from harness import Sim
JS = r"""
(() => { const out = []; const plain = h => String(h||'').replace(/<br>/g,' / ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,'_').replace(/\s+/g,' ').trim();
  for (const l of ALL_L.filter(l => /^[mn]\d/.test(l.id))) { const seen = new Set(); for (let i = 0; i < 60 && seen.size < 4; i++) { const q = lessonQ(l); if (seen.has(q.type + q.prompt.slice(0,8))) continue; seen.add(q.type + q.prompt.slice(0,8));
    out.push(`${l.id} | ${q.prompt} | ${plain(q.vis && (q.vis.html || q.vis.e || (q.vis.k==='clock' ? q.vis.h+':'+q.vis.m : q.vis.k==='tens' ? q.vis.t+'/'+q.vis.o : q.vis.k)))} | ${(q.opts||[]).join(' ; ')} | ANS ${q.ans} | H ${q.hint} | E ${q.explain}`); } }
  return out.join('\n'); })()
"""
async def main():
    async with Sim('sample') as s:
        await s.click('[data-a="start"]')
        print(await s.ev(JS))
asyncio.run(main())
