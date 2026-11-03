"""커리큘럼 정밀 점검 (2026-11-03) — check_all이 안 보는 것
모든 코스(수학 1-2·2-1, 국어 1-2·2-1, 영어 1·2단계)의 모든 차시에서 2000문제씩 만들어:
 ① 서로 다른 문제 수 · 문제 모양 수 (반복이 심한 차시)
 ② 같은 문제(키)인데 정답이 다름 → 복습(S.wrong)이 엉뚱한 답으로 채점
 ③ 같은 글·같은 보기인데 정답이 다름 → 문제가 애매함
 ④ 찍기 쏠림: 정답 자리(첫째·둘째…)가 한쪽으로 몰림, O/X 한쪽으로 몰림, 정답이 가장 긴(짧은) 보기인 때가 3분의 2 넘음(보기 3개면 우연히 33%) — 50% 넘으면 주의
 ⑤ 조사: '낱말' 뒤 을/를·이/가·은/는·과/와·으로/로·이에요/예요 받침과 안 맞음
 ⑥ 듣기 문제인데 화면 글(문제·그림)에 정답이 그대로 보임
 ⑦ 개념 카드·EBS 강의 연결 (강의 번호가 코스 안에서 앞으로만 감, 빠진 강의 목록)
"이상: 0"이어야 함. 주의(쏠림·적은 문제 수)는 따로 보여 줌"""
import asyncio, sys, json
sys.path.insert(0, '.')
from harness import Sim
N = int(sys.argv[1]) if len(sys.argv) > 1 else 2000
JS = r"""
(N) => {
  const bad = [], warn = [], rows = [];
  const plain = h => String(h || '').replace(/<br>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
  const fin = ch => { const d = dec(ch); return d ? d[2] : -1; };   // 받침 번호 (0 없음, 8 ㄹ)
  const PAIRS = [['을','를'],['이','가'],['은','는'],['과','와'],['으로','로'],['이에요','예요'],['이랑','랑'],['이나','나'],['이고','고']];
  const josaBad = t => {
    const out = []; const re = /['‘“"]([가-힣]+)['’”"](이에요|예요|으로|이랑|이나|이고|을|를|이|가|은|는|과|와|로|랑|나|고)(?![가-힣])/g; let m;
    while ((m = re.exec(t))) { const w = m[1], p = m[2], f = fin(w[w.length - 1]);
      for (const [a, b] of PAIRS) {
        if (p !== a && p !== b) continue;
        const want = a === '으로' ? (f > 0 && f !== 8 ? '으로' : '로') : (f > 0 ? a : b);
        if (p !== want) out.push(`'${w}'${p} → '${w}'${want}`);
      }
    }
    return out;
  };
  for (const C of Object.values(CURRS)) for (const l of C.all) {
    const keys = new Map(), sig = new Map(), types = new Set(); const posN = {}; let ox = [0, 0], longest = 0, nLong = 0, shortest = 0; let _u = 0;
    const jb = new Set(), leak = new Set();
    for (let i = 0; i < N; i++) {
      let q; try { q = lessonQ(l); } catch (e) { bad.push(`${l.id}: 오류 ${e.message}`); break; }
      types.add(q.type);
      const a = String(q.ans);
      if (keys.has(q.key) && keys.get(q.key) !== a) bad.push(`${l.id}: 같은 키 다른 정답 ${q.key} (${keys.get(q.key)} / ${a})`);
      keys.set(q.key, a);
      if (q.input === 'choice') {
        let visR = ''; try { visR = q.vis ? visHTML(q) : ''; } catch (e) {}
        const visT = plain(visR);
        const s = [q.prompt, q.listen || '', q.read || '', visR, [...q.opts].map(String).sort().join('|')].join('#');
        if (sig.has(s) && sig.get(s) !== a) bad.push(`${l.id}: 같은 문제·보기인데 정답이 다름 "${q.prompt}" ${visT.slice(0, 40)} (${sig.get(s)} / ${a})`);
        sig.set(s, a);
        const opts = q.opts.map(String), ix = opts.indexOf(a);
        if (opts.length === 2 && opts.includes('O') && opts.includes('X')) ox[a === 'O' ? 0 : 1]++;
        else if (!q.pic && !q.optHtml) { const P = posN[opts.length] = posN[opts.length] || Array(opts.length).fill(0); P[ix]++;
          if (opts.length >= 3 && /[가-힣a-zA-Z]/.test(a)) { nLong++; const L = opts.map(o => o.length), mx = Math.max(...L), mn = Math.min(...L);
            if (a.length === mx && L.filter(x => x === mx).length === 1) longest++;
            if (a.length === mn && L.filter(x => x === mn).length === 1) shortest++; } }
        // 듣기: 소리로만 들려줘야 하는 말이 화면에 보이면 안 됨
        if (q.listen && a.length >= 2 && !/^\d+$/.test(a)) { const shown = q.prompt + ' ' + visT; if (shown.includes(a) && !String(q.listen).includes(shown.trim())) leak.add(`${q.type}: "${q.prompt}" ${visT.slice(0, 30)} → ${a}`); }
      }
      [q.prompt, q.hint, q.explain, q.say].forEach(t => josaBad(String(t || '')).forEach(x => jb.add(`${q.type}: ${x}  ⟵ ${String(t).slice(0, 50)}`)));
    }
    const nKeys = keys.size;
    rows.push([l.id, l.title, nKeys, types.size]);
    if (nKeys < 15) warn.push(`${l.id} "${l.title}": 서로 다른 문제 ${nKeys}개 (금방 반복)`);
    Object.entries(posN).forEach(([n, P]) => { const tot = P.reduce((a, b) => a + b, 0); if (tot < 60) return; const k = Math.max(...P) / tot, mn = Math.min(...P) / tot, e = 1 / n;
      if (k > e + .2 || mn < e - .2) bad.push(`${l.id}: 정답 자리 쏠림 (보기 ${n}개) ${P.join('/')}`); else if (k > e + .1 || mn < e - .1) warn.push(`${l.id}: 정답 자리 약간 쏠림 (보기 ${n}개) ${P.join('/')}`); });
    if (ox[0] + ox[1] >= 60) { const r = ox[0] / (ox[0] + ox[1]); if (r > .72 || r < .28) bad.push(`${l.id}: O/X 쏠림 O ${ox[0]} · X ${ox[1]}`); else if (r > .65 || r < .35) warn.push(`${l.id}: O/X 약간 쏠림 O ${ox[0]} · X ${ox[1]}`); }
    if (nLong >= 80) { if (longest / nLong > .66) bad.push(`${l.id}: 정답이 가장 긴 보기인 때가 ${Math.round(longest / nLong * 100)}% (긴 걸 고르면 맞음)`); else if (longest / nLong > .5) warn.push(`${l.id}: 정답이 가장 긴 보기 ${Math.round(longest / nLong * 100)}%`);
      if (shortest / nLong > .66) bad.push(`${l.id}: 정답이 가장 짧은 보기인 때가 ${Math.round(shortest / nLong * 100)}%`); else if (shortest / nLong > .5) warn.push(`${l.id}: 정답이 가장 짧은 보기인 때가 ${Math.round(shortest / nLong * 100)}%`); }
    jb.forEach(x => bad.push(`${l.id}: 조사 ${x}`));
    leak.forEach(x => bad.push(`${l.id}: 듣기 정답이 화면에 보임 ${x}`));
    // 개념 카드
    if (!l.cards || !l.cards.length) warn.push(`${l.id}: 개념 카드 없음`);
  }
  // 강의 연결: 코스 안에서 강의 번호가 앞으로만 가는지, 어느 차시에도 안 붙은 강의
  const lect = {};
  for (const C of Object.values(CURRS)) {
    let last = 0; const used = new Set();
    C.all.forEach(l => (l.ebs || []).forEach(n => { if (n < last) bad.push(`${C.subj} ${l.id}: 강의 번호가 뒤로 감 (${last} → ${n})`); last = Math.max(last, n); used.add(n); }));
    C.units.forEach(u => { if (u.rev) used.add(u.rev); });
    C.courses.forEach(co => { if (!co.lect) return; const miss = []; co.lect.forEach((x, i) => { const n = co.lectOff + i + 1; if (!used.has(n)) miss.push(i + 1); }); lect[`${C.subj} ${co.short || co.title}`] = { 전체: co.lect.length, 차시에_안_붙은_강: miss.length }; });
  }
  return { bad:[...new Set(bad)], warn:[...new Set(warn)], rows, lect };
}
"""
async def main():
    async with Sim('Q_커리큘럼정밀') as s:
        await s.click('[data-a="start"]')
        r = await s.p.evaluate(JS, N)
        cur = None
        print('차시별 서로 다른 문제 수 (문제 모양 수):')
        line = []
        for lid, title, n, t in r['rows']:
            line.append(f'{lid}:{n}({t})')
            if len(line) == 8: print('  ' + '  '.join(line)); line = []
        if line: print('  ' + '  '.join(line))
        print('강의 연결:', json.dumps(r['lect'], ensure_ascii=False))
        print(f"주의 {len(r['warn'])}개:"); print(*['  ' + w for w in r['warn']], sep='\n')
        # 같은 종류는 묶어서 (차시 · 종류 · 몇 건 · 예)
        import re, collections
        grp = collections.OrderedDict()
        for b in r['bad']:
            m = re.match(r"(\S+): (조사 \S+|듣기 정답이 화면에 보임 \S+|같은 키 다른 정답|같은 문제·보기인데 정답이 다름|[^0-9(]+)", b)
            k = (m.group(1), m.group(2).strip()) if m else ('?', b[:60])
            grp.setdefault(k, []).append(b)
        print('이상:', len(r['bad']))
        for (lid, kind), v in grp.items(): print(f'  [{len(v)}건] {v[0][:230]}')
asyncio.run(main())
