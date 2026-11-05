/* ===================== 엄마가 보기 쉬운 화면 (11/5 오빠 요청) =====================
   - 진도: 과목마다 게이지 하나 (1-2 → 2-1 → 2-2 칸, 토끼가 지금 자리). 진도 옮기기·EBS 설정 같은 것은 오빠 탭에만
   - 받아쓰기 · 쓴 글: 다 본 것은 "11/4 채점 완료 9/10점" 한 줄, 누르면 펼침
   - 깜짝 응원: 멘트 추천 (누르면 칸에 들어감) */

/* ---------- 진도 게이지 ---------- */
function progOf(s){
  const C = CURRS[s], c = curr(s), units = C.units;
  let pos = 0; units.forEach((u, ui) => { if (ui < c.unit) pos += u.lessons.length; else if (ui === c.unit) pos += c.test ? u.lessons.length : c.lesson; });
  const total = C.all.length; if (c.unit >= units.length) pos = total;
  let start = 0; const segs = C.courses.map(co => { const n = units.filter(u => u.course === co).reduce((a, u) => a + u.lessons.length, 0), x = { co, start, n }; start += n; return x; });
  const cur = segs.find(g => pos < g.start + g.n) || segs[segs.length - 1];
  return { pos, total, segs, cur, coursePct:Math.round(Math.min(cur.n, pos - cur.start) / cur.n * 100), allPct:Math.round(pos / total * 100), done:pos >= total };
}
function progLabel(co){ return co.grade ? co.grade.replace(/ · .*/, '') : co.short2 || ''; }
function progGauge(s){
  const P = progOf(s), u = CURRS[s].units[curr(s).unit], last = P.segs[P.segs.length - 1].co;
  const unitName = u ? `${u.n}단원 「${u.name}」` : '';
  return `<div class="prog prog-${s}">
    <div class="prog-top"><b>${SUBJ_NAME[s]}</b><span class="prog-pct">${P.allPct}<small>%</small></span></div>
    <p class="prog-say">${P.done ? `${progLabel(last)}까지 모두 끝냈어요! 🎉` : `${progLabel(last)}까지 가는 길의 <b>${P.allPct}%</b> 왔어요`}</p>
    <div class="prog-bar">${P.segs.map(g => { const fill = clamp((P.pos - g.start) / g.n, 0, 1);
      return `<div class="prog-seg ${g === P.cur && !P.done ? 'now' : fill >= 1 ? 'done' : ''}" style="flex:${g.n}"><i style="width:${(fill * 100).toFixed(1)}%"></i><small>${esc(g.co.short2 || '')}</small></div>`; }).join('')}
      <span class="prog-bunny" style="left:${(P.pos / P.total * 100).toFixed(1)}%">🐰</span></div>
    ${P.done ? '' : `<p class="prog-now">지금 <b>${esc(progLabel(P.cur.co))}</b> 과정 ${P.coursePct}% · ${esc(unitName)}</p>`}
  </div>`;
}
function progressPanel(){
  const on = SUBJS.filter(currOn);
  return `<div class="panel prog-panel"><h3>재윤이가 어디까지 왔을까요?</h3>
    ${on.length ? on.map(progGauge).join('') : '<p class="muted">지금은 진도 없이 자유 연습만 하고 있어요.</p>'}
    <p class="muted" style="font-size:13px">🐰가 재윤이 자리예요. 칸 하나가 한 학기(영어는 한 단계)예요. 차시를 통과하면 한 칸씩 나가요.</p></div>`;
}

/* ---------- 다 본 받아쓰기 · 쓴 글은 한 줄로 ---------- */
const DONE_OPEN = new Set();
function dictDoneList(pend){
  const done = pend.filter(([k]) => gradeOf(k).graded);
  if (!done.length) return '<p class="muted">채점한 받아쓰기가 아직 없어요.</p>';
  return `<div class="done-list">${done.map(([k, dy]) => { const g = gradeOf(k), open = DONE_OPEN.has('d' + k);
    return `<button class="done-row ${open ? 'open' : ''}" data-a="doneopen" data-v="d${k}"><span>${shortDate(k)} 받아쓰기</span><span class="pill ok">채점 완료 ${g.score}/10점</span><span class="chev">${open ? '▴' : '▾'}</span></button>
      ${open ? gradeCard(k, dy) : ''}`; }).join('')}</div>`;
}
function writesDoneList(){
  const items = Object.entries(S.days).flatMap(([dk, dy]) => Object.entries(dy.writes || {}).map(([k, w]) => ({ dk, k, w }))).filter(x => x.w && (x.w.img || x.w.skipped)).sort((a, b) => b.w.at - a.w.at).slice(0, 8);
  if (!items.length) return '';
  return `<div class="done-list">${items.map(({ dk, k, w }) => { const key = `${dk}|${k}`, fb = (S.writeFb || {})[key], open = DONE_OPEN.has('w' + key);
    return `<button class="done-row ${open ? 'open' : ''}" data-a="doneopen" data-v="w${esc(key)}"><span>${shortDate(dk)} ${esc(String(w.prompt || '쓴 글').slice(0, 18))}</span><span class="pill ${fb ? 'ok' : w.skipped ? 'no' : 'wait'}">${fb ? (fb.good ? '💗 칭찬함' : '✏️ 다시 써 보자') : w.skipped ? '미룸' : '아직 안 봄'}</span><span class="chev">${open ? '▴' : '▾'}</span></button>
      ${open && w.img ? `<img src="${w.img}" alt="재윤이가 쓴 글" class="done-img">` : ''}`; }).join('')}</div>`;
}
ACT.doneopen = el => { const k = el.dataset.v; if (DONE_OPEN.has(k)) DONE_OPEN.delete(k); else DONE_OPEN.add(k); const y = scrollY; go('adult'); scrollTo(0, y); };

/* ---------- 깜짝 응원 멘트 추천 ---------- */
const CHEER_IDEAS = {
  mom:['재윤아, 오늘도 끝까지 해서 엄마는 정말 뿌듯해!', '틀려도 괜찮아. 다시 해 보는 재윤이가 최고야!', '받아쓰기 글씨가 점점 예뻐지고 있어!', '공부 끝나면 엄마랑 꼭 안아 주자 🤗', '재윤이 머리가 쑥쑥 자라는 소리가 들려!', '오늘 저녁은 재윤이가 좋아하는 거 해 줄게!'],
  oppa:['재윤아, 오빠가 다 보고 있었지롱! 최고야!', '어려운 문제도 포기 안 했네? 진짜 멋지다!', '이대로 30일 채우면 선물이 기다린다 🎁', '오늘 맞힌 문제, 오빠도 깜짝 놀랐어!', '재윤이는 오빠 문제 맞히기 대장이야!', '천천히 해도 괜찮아. 오빠는 재윤이 편!'],
};
function cheerIdeasHTML(who){
  return `<div class="cheer-ideas"><span class="muted" style="font-size:13px">멘트 추천 (누르면 아래 칸에 들어가요 · 녹음할 때 읽어도 좋아요)</span>
    ${(CHEER_IDEAS[who] || CHEER_IDEAS.mom).map((t, i) => `<button class="chip" data-a="cheeridea" data-v="${who}|${i}">${esc(t)}</button>`).join('')}</div>`;
}
ACT.cheeridea = el => { const [who, i] = el.dataset.v.split('|'), t = (CHEER_IDEAS[who] || [])[+i], inp = $('#cheertxt_' + who); if (inp && t) { inp.value = t; inp.focus(); } SFX.tap(); };
