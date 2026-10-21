import asyncio, sys, json
sys.path.insert(0,'.')
from harness import Sim
JS = r"""
(() => {
  const bad = [], stats = {};
  const plain = h => String(h).replace(/<br>/g,'\n').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/[ \t]+/g,' ').trim();
  const ev = e => Function('return (' + e.replace(/−/g,'-').replace(/×/g,'*') + ')')();
  const eqTrue = t => { const [L, R] = t.split('='); return ev(L) === ev(R); };
  const isEq = t => /^[\d\s+−×=]+$/.test(t) && t.includes('=');
  for (const l of ALL_L) {
    const keys = new Set();
    for (let i = 0; i < 500; i++) {
      let q; try { q = lessonQ(l); } catch (e) { bad.push(`${l.id}: 오류 ${e.message}`); break; }
      keys.add(q.key); stats[l.id + ':' + q.type] = (stats[l.id + ':' + q.type] || 0) + 1;
      const id = `${l.id}/${q.type}/${q.key}`;
      const blob = [q.prompt, q.say, q.hint, q.explain, q.read, q.listen, JSON.stringify(q.opts || []), q.vis ? (q.vis.html || '') : ''].join('|');
      if (/undefined|NaN|\bnull\b|\[object/.test(blob)) bad.push(`${id}: undefined/NaN ${blob.slice(0,160)}`);
      if (!q.prompt || !q.hint || q.explain === undefined) bad.push(`${id}: prompt/hint/explain 빠짐`);
      if (q.input === 'choice') {
        if (!q.opts.map(String).includes(String(q.ans))) bad.push(`${id}: 정답이 보기에 없음 ${JSON.stringify(q.opts)} / ${q.ans}`);
        if (new Set(q.opts.map(String)).size !== q.opts.length) bad.push(`${id}: 보기 중복 ${JSON.stringify(q.opts)}`);
        if (q.opts.length < 2) bad.push(`${id}: 보기 부족`);
        if (q.optHtml) q.opts.forEach(o => { if (!q.optHtml[o]) bad.push(`${id}: 그림 보기 없음 ${o}`); });
        if (q.pic && !q.optHtml) bad.push(`${id}: pic인데 optHtml 없음`);
        const eqs = q.opts.map(String).filter(isEq);
        if (eqs.length === q.opts.length) { const tr = q.opts.filter(o => eqTrue(String(o))); if (tr.length !== 1 || String(tr[0]) !== String(q.ans)) bad.push(`${id}: 식 보기 참 ${JSON.stringify(tr)} 정답 ${q.ans}`); }
      } else if (q.input === 'numpad') { if (!Number.isInteger(q.ans) || q.ans < 0 || String(q.ans).length > 4) bad.push(`${id}: 숫자 정답 이상 ${q.ans}`); }
      else if (q.input === 'build') { const t = [...q.tiles]; for (const ch of q.ans) { const k = t.indexOf(ch); if (k < 0) bad.push(`${id}: 타일 부족 ${ch}`); else t.splice(k, 1); } if (new Set(q.ans).size !== q.ans.length) bad.push(`${id}: build 정답에 같은 글자`); }
      if (q.vis && q.vis.k === 'html' && q.input === 'numpad' && /class="eq"/.test(q.vis.html)) {
        const lines = plain(q.vis.html.match(/class="eq"[^>]*>([\s\S]*?)<\/div>/)[1]).split('\n').map(x => x.trim()).filter(x => x.includes('?'));
        lines.forEach(t => { const r = t.replace('?', String(q.ans)); if (isEq(r) && !eqTrue(r)) bad.push(`${id}: 검산 틀림 ${r}`); if (/,/.test(t)) { const a = r.split(',').map(Number); const d = a[1] - a[0]; if (!a.every((x, i) => i === 0 || x - a[i - 1] === d)) bad.push(`${id}: 뛰어세기 ${r}`); } });
      }
      if (q.type === 'read3' || q.type === 'hundreds' && q.input === 'choice') { const n = Number(plain(q.vis.html)); if (numKo(n) !== q.ans) bad.push(`${id}: 읽기 ${n} ${q.ans}`); }
      if (q.lang === 'en-US' && q.listen && /[가-힣]/.test(q.listen)) bad.push(`${id}: 영어 듣기에 한글`);
      if (q.subj === 'kor' && /(이이|가가)\s/.test(q.prompt)) bad.push(`${id}: 조사 이상 ${q.prompt}`);
    }
    const need = l.subj === 'math' ? 6 : 5;
    if (keys.size < need) bad.push(`${l.id}: 문제 종류가 ${keys.size}개뿐 (반복 심함)`);
    stats[l.id + ':서로 다른 문제'] = keys.size;
    l.cards.forEach((cd, i) => { try { const h = cd.ill(); if (!h || /undefined/.test(h)) bad.push(`${l.id} 카드${i}: 그림 이상`); } catch (e) { bad.push(`${l.id} 카드${i}: ${e.message}`); } if (!cd.text || !cd.say) bad.push(`${l.id} 카드${i}: 글 없음`); });
    (l.ebs || []).forEach(n => { const li = lectInfo(l.subj, n); if (!li || li.title.indexOf(l.unit.name) < 0) bad.push(`${l.id}: 강의 ${n} 단원 불일치 ${li && li.title}`); });
  }
  Object.values(CURRS).forEach(C => C.units.forEach(u => { if (u.rev && C.ebs) { const li = lectInfo(C.subj, u.rev); if (!li || !/핵심|단원 평가/.test(li.desc) || li.title.indexOf(u.name) < 0) bad.push(`${C.subj} ${u.n}단원 복습 강의 이상 ${li && li.desc}`); } }));
  if (EBS_LECT.math.length !== 113 || EBS_LECT.kor.length !== 104) bad.push('강의 수 이상 ' + EBS_LECT.math.length + '/' + EBS_LECT.kor.length);
  // 판 구성
  for (const s of ['math','kor','eng']) {
    const C = CURRS[s]; const save_ = JSON.stringify(curr(s)); const c = curr(s);
    for (let u = 0; u < C.units.length; u++) for (let le = 0; le <= C.units[u].lessons.length; le++) {
      c.unit = u; c.lesson = Math.min(le, C.units[u].lessons.length - 1); c.test = le === C.units[u].lessons.length;
      for (const n of [20, 8]) {
        const qs = genCurriculum(s, n); const ks = new Set(qs.map(q => q.key));
        if (ks.size !== qs.length) bad.push(`${s} 판 ${u}-${le}: 중복`);
        if (!c.test && qs.length !== n) bad.push(`${s} 판 ${u}-${le} n=${n}: ${qs.length}문제`);
        if (!c.test && n === 20) { const lc = qs.filter(q => q.lesson === currentLesson(s).id).length; if (lc < 12) bad.push(`${s} 판 ${u}-${le}: 이번 차시 ${lc}문제뿐`); }
        if (c.test && qs.length !== 12) bad.push(`${s} 평가 ${u}: ${qs.length}문제`);
      }
      const rv = genCurrReview(s, 12); if (rv.length < 8) bad.push(`${s} 복습판 ${u}-${le}: ${rv.length}`);
    }
    if (s === 'math') S.curr = JSON.parse(save_); else S.currs[s] = JSON.parse(save_);
  }
  return { bad:[...new Set(bad)].slice(0, 60), n:bad.length, stats };
})()
"""
async def main():
    async with Sim('J_전과목검산') as s:
        await s.click('[data-a="start"]')
        r = await s.ev(JS)
        print({k:v for k,v in r['stats'].items() if '서로 다른' in k})
        print('이상:', r['n']); print(*r['bad'], sep='\n')
asyncio.run(main())
