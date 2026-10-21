import asyncio, sys, json, random
sys.path.insert(0,'.')
from harness import Sim
FAST = "(() => { const o = window.setTimeout.bind(window); window.setTimeout = (f, t, ...a) => o(f, Math.min(t || 0, 4), ...a); window.__dur = 3; })()"
DAY = r"""
async (acc) => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const log = { lec:null, boards:{}, screens:[], errs:[] };
  const rnd = () => Math.random();
  for (const k of ['kor','math','eng','rev']) {
    if (boardState(k) === 'done') continue;
    try { ACT.board({ dataset:{ k } }); } catch (e) { log.errs.push(k + ' board 오류 ' + e.message + ' ' + JSON.stringify(day().boards[k] && day().boards[k].cur) + ' ' + JSON.stringify(curr(k === 'rev' ? 'math' : k))); go('home'); continue; } await sleep(5);
    if (SCREEN !== 'intro') { log.errs.push(k + ': intro 아님 ' + SCREEN); continue; }
    const b = RUN.b; log.boards[k] = { n:b.qs.length, wait:!!b.waitLec, lec:b.cur && b.cur.lec || null, test:b.cur && b.cur.test, lesson:b.cur && b.cur.lesson };
    ACT.begin();
    await sleep(5);
    const ov = document.querySelector('.eye-overlay');
    if (ov) {
      if (!ov.querySelector('[data-lecgo]')) log.errs.push(k + ': 강의 안내에 버튼 없음');
      if (!/팔 길이/.test(ov.textContent)) log.errs.push(k + ': 거리 안내 없음');
      ov.remove(); LECW = { s:b.cur.subj, n:b.cur.lec, at:Date.now() - 28 * 60000, opt:false }; go('lecwait'); await sleep(3);
      if (SCREEN !== 'lecwait') log.errs.push('lecwait 아님');
      ACT.lecdone({ dataset:{ sure:'1' } }); await sleep(3);
      if (SCREEN !== 'eyebreak') log.errs.push('강의 뒤 눈쉬기 아님 ' + SCREEN);
      log.lec = { s:b.cur.subj, n:b.cur.lec };
      ACT.eyedone({ dataset:{ v:document.querySelector('#eyedone').dataset.v } }); await sleep(3);
    }
    if (SCREEN === 'cards') { const l = lessonById(CARDS.lesson); CARDS.i = l.cards.length - 1; ACT.cardsdone(); await sleep(3); }
    let guard = 0;
    while (SCREEN === 'q' && guard++ < 60) {
      const q = RUN.q, r = rnd();
      const right = q.input === 'numpad' ? Number(q.ans) : q.ans;
      const wrong = q.input === 'numpad' ? Number(q.ans) + 1 : q.input === 'choice' ? q.opts.find(o => String(o) !== String(q.ans)) : 'zzzz'.slice(0, q.ans.length);
      if (r < acc) { answer(right); }
      else if (r < acc + (1 - acc) / 2) { answer(wrong); await sleep(2); answer(right); }
      else { answer(wrong); await sleep(2); answer(wrong); await sleep(2); nextQ(); }
      await sleep(8);
    }
    if (SCREEN === 'write') { log.write = (log.write || 0) + 1; if (rnd() < .5) ACT.writeskip(); else { saveWrite('data:image/jpeg;base64,AAAA'); afterWrite(); } await sleep(5); }
    if (SCREEN === 'dict') { const dt = day().dict; dt.idx = 10; ACT.skipphoto(); await sleep(5); }
    if (SCREEN !== 'reward') log.errs.push(k + ': 보상 화면 아님 ' + SCREEN);
    const res = day().boards[k].cur && day().boards[k].cur.result;
    log.boards[k].res = res ? (res.test ? 'T' : '') + (res.pass ? 'pass' : 'fail') + Math.round(res.rate * 100) : null;
    log.boards[k].correct = day().boards[k].correct;
    go('home'); await sleep(3);
  }
  log.done = day().done;
  log.prog = Object.fromEntries(['math','kor','eng'].map(s => [s, currLabel(s)]));
  log.mins = Object.values(day().boards).reduce((a, b) => a + (b.n || 0), 0);
  return log;
}
"""
async def main():
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 45
    async with Sim('K_한달진도') as s:
        await s.click('[data-a="start"]')
        await s.ev(FAST)
        lecs = []; summary = []
        for d in range(days):
            acc = 0.9 if d % 7 != 3 else 0.5     # 일주일에 하루는 어려운 날
            log = await s.p.evaluate(f"({DAY})({acc})")
            if log['errs']: s.issues.append((d, log['errs']))
            if log['lec']: lecs.append(log['lec']['s'][0] + str(log['lec']['n']))
            # 강의는 하루 하나
            nlec = sum(1 for b in log['boards'].values() if b.get('lec'))
            if nlec > 1: s.issues.append((d, '강의 두 개'))
            summary.append(f"D{d+1:02d} {'L:'+lecs[-1] if log['lec'] else '     '} " + ' '.join(f"{k}:{b['n']}{'W' if b['wait'] else ''}{'['+b['res']+']' if b.get('res') else ''}" for k, b in log['boards'].items()) + f" | {log['prog']['math']} / {log['prog']['kor']} / {log['prog']['eng']}")
            await s.ev("ACT.nextday ? (S.dayOffset = (S.dayOffset || 0) + 1, RUN = null, save()) : 0")
        print(*summary, sep='\n')
        print('강의 순서:', ' '.join(lecs))
        st = await s.ev("({ m:curr('math'), k:curr('kor'), e:curr('eng'), wrong:S.wrong.length, size:JSON.stringify(S).length })")
        print('메달', len(st['m']['medals']), len(st['k']['medals']), len(st['e']['medals']), '본 강의', sorted(map(int, st['m']['seen'].keys())), sorted(map(int, st['k']['seen'].keys())), '오답', st['wrong'], '저장', st['size'])
if __name__ == '__main__': asyncio.run(main())
