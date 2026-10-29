"""강의는 하루 한 편 + "지난 시간 다지기" 검증 (2026-10-29 오빠 피드백)
- 재윤이처럼: 판 순서를 날마다 섞고, 보이는 "골라 보기 · 다시 보기" 강의 버튼은 전부 눌러 보고, 가끔 다른 강의를 봤다고 고르고, 가끔 오늘 차시를 못 넘김
- 확인: 어느 날도 강의가 두 편 이상 안 나옴 / 강의가 다른 과목 날의 판("지난 시간 다지기")이 기초 문제만으로 채워지지 않음"""
import asyncio, sys, json
sys.path.insert(0, '.')
from harness import Sim
from sim_month import FAST

DAY = r"""
async (acc) => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const log = { lecs:[], wait:{}, errs:[] }; const rnd = () => Math.random();
  const watch = async (s, n, opt) => {
    LECW = { s, n, at:Date.now() - 28 * 60000, opt }; go('lecwait'); await sleep(3);
    ACT.lecdone({ dataset:{ sure:'1' } }); await sleep(3);
    if (SCREEN === 'leccheck') { const other = rnd() < .15; ACT.lecwatched({ dataset:{ v:String(other ? n + 1 : n) } }); await sleep(3); if (SCREEN !== 'eyebreak' && document.querySelector('[data-a="lecafter"]')) { ACT.lecafter(); await sleep(3); } }
    if (SCREEN === 'eyebreak') { ACT.eyedone({ dataset:{ v:document.querySelector('#eyedone').dataset.v } }); await sleep(3); }
  };
  const order = ['kor','math','eng','rev'].sort(() => rnd() - .5);
  for (const k of order) {
    if (boardState(k) === 'done') continue;
    try { ACT.board({ dataset:{ k } }); } catch (e) { log.errs.push(k + ' ' + e.message); go('home'); continue; } await sleep(5);
    if (SCREEN !== 'intro') { log.errs.push(k + ': intro 아님 ' + SCREEN); continue; }
    const b = RUN.b;
    if (b.waitLec) log.wait[k] = { n:b.qs.length, base:b.qs.filter(q => q.review11).length, lessons:[...new Set(b.qs.filter(q => q.lesson).map(q => q.lesson))] };
    // 보이는 골라 보기 · 다시 보기 버튼은 전부 눌러 본다
    const opt = document.querySelector('[data-a="lecopt"]');
    if (opt) { const [s, n] = opt.dataset.v.split('|'); log.lecs.push('opt:' + s + n); await watch(s, +n, true); ACT.board({ dataset:{ k } }); await sleep(5); }
    ACT.begin(); await sleep(5);
    const ov = document.querySelector('.eye-overlay');
    if (ov) { ov.remove(); log.lecs.push(b.cur.subj + b.cur.lec); await watch(b.cur.subj, b.cur.lec, false); }
    if (SCREEN === 'cards') { const l = lessonById(CARDS.lesson); CARDS.i = l.cards.length - 1; ACT.cardsdone(); await sleep(3); }
    let guard = 0;
    while (SCREEN === 'q' && guard++ < 60) {
      const q = RUN.q, right = q.input === 'numpad' ? Number(q.ans) : q.ans;
      const wrong = q.input === 'numpad' ? Number(q.ans) + 1 : q.input === 'choice' ? q.opts.find(o => String(o) !== String(q.ans)) : 'zzzz'.slice(0, q.ans.length);
      if (rnd() < acc) answer(right); else { answer(wrong); await sleep(2); answer(wrong); await sleep(2); nextQ(); }
      await sleep(8);
    }
    if (SCREEN === 'write') { ACT.writeskip(); await sleep(5); }
    if (SCREEN === 'dict') { day().dict.idx = 10; ACT.skipphoto(); await sleep(5); }
    go('home'); await sleep(3);
  }
  log.watched = lecturesWatchedOn();
  log.prog = [currLabel('math'), currLabel('kor')];
  return log;
}
"""
async def main():
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 40
    async with Sim('L_강의하루한편') as s:
        await s.click('[data-a="start"]'); await s.ev(FAST)
        two, waits, onlybase = [], [], []
        for d in range(days):
            await s.ev(f"S.dayOffset = {d - days}; saveLocal(); go('home')")
            if d % 7 == 3:   # 가끔 앱을 껐다 켬 (강의 보러 EBS 앱 갔다가 크롬이 닫힌 것처럼)
                await s.p.reload(); await s.p.wait_for_timeout(300); await s.ev(FAST); await s.ev(f"S.dayOffset = {d - days}; saveLocal(); go('home')")
            log = await s.p.evaluate(f"({DAY})({0.65 if d % 5 == 2 else 0.9})")
            if log['errs']: s.issues.append((d, log['errs'][:2]))
            if log['watched'] > 1 or len(log['lecs']) > 1: two.append((d, log['lecs'], log['watched']))
            for k, w in log['wait'].items():
                waits.append(w)
                if w['n'] and w['base'] / w['n'] > .5 and w['lessons']: onlybase.append((d, k, w))
            print(f"D{d+1:02d} 강의 {log['lecs'] or '-'} 다지기 {{{', '.join(f'{k}:{w[chr(110)]}문제/기초{w[chr(98)+chr(97)+chr(115)+chr(101)]}' for k, w in log['wait'].items())}}} | {log['prog'][0][:22]} / {log['prog'][1][:22]}")
        print('강의 두 편 이상인 날:', two)
        s.expect(not two, f'강의를 두 편 이상 본 날이 있음 {two[:3]}')
        if waits: print('다지기 판 평균 기초 문제 비율:', round(sum(w['base'] / max(1, w['n']) for w in waits) / len(waits), 2), '| 판 수:', len(waits))
        s.expect(not onlybase, f'지난 차시가 있는데 다지기 판이 기초 문제로 절반 넘게 채워짐 {onlybase[:2]}')

asyncio.run(main())
