/* ===================== 재윤이 오답노트 (2026-10-29) =====================
   재윤이와 엄마가 나중에 같이 보는 틀린 문제 모음. 따로 저장하지 않고, 판마다 남긴 문제 기록(b.log)과 받아쓰기 채점에서 모은다
   (그래서 엄마 폰·오빠 폰·태블릿 어디서 열어도 같은 내용. 문제별 기록은 10/22부터).
   - 같은 문제는 한 장으로 묶고 몇 번 틀렸는지 센다. 그 뒤에 한 번에 맞혔으면 "다시 맞혔어요 ✓"
   - 정답은 가려 두고 눌러서 보기 → 엄마가 읽어 주고 재윤이가 먼저 말해 보기 좋게 (🔊 토리가 문제 읽어 주기)
   - 재윤이 첫 화면 "오답노트" 칸, 엄마·오빠 메뉴 "재윤이 오답노트"에서 연다 */
let NOTE = { subj:'all', st:'todo', more:0, open:{}, showAll:false, from:'home' };
const NOTE_SUBJ = [['all','전체'],['kor','국어'],['math','수학'],['eng','영어'],['dict','받아쓰기']];
function notebookItems(){
  const ks = Object.keys(S.days).sort(), map = new Map();
  ks.forEach(k => [...dayLogs(k), ...dictLogs(k), ...nbLogs(k)].forEach(x => {
    const subj = ['kor','math','eng','dict'].includes(x.subj) ? x.subj : 'etc';
    const id = subj + '|' + x.t + '|' + x.a; let it = map.get(id);
    if (x.r !== 1) {
      if (!it) { it = { id, subj, t:x.t, a:x.a, wrongs:[], miss:0, hint:0, first:x.k }; map.set(id, it); }
      if (x.r === 2) it.hint++; else it.miss++;
      String(x.w || '').split(' / ').forEach(w => { if (w && !it.wrongs.includes(w)) it.wrongs.push(w); });
      it.last = x.k; it.fixed = null;
    } else if (it && x.board === 'nb') it.fixed = x.k;   // 엄마랑 같이 풀어서 맞힘 → 오답노트에서 없어짐 (10/29 오빠: 복습 판에서 혼자 맞힌 건 그대로 둠)
  }));
  return [...map.values()].sort((a, b) => b.last.localeCompare(a.last) || (b.miss - a.miss));
}
/* 듣기 문제·받아쓰기는 문제 글에 정답이 들어 있어서, 화면에는 "🔊 듣기"로 가리고 버튼을 누르면 읽어 준다 */
function noteListen(x){ if (x.subj === 'dict') return x.a; const m = String(x.t).match(/🔊 ([^·\[]+)/); return m ? m[1].trim() : ''; }
function noteShow(x){ return x.subj === 'dict' ? '받아쓰기 · 🔊 들어 보고 써 보기' : String(x.t).replace(/🔊 [^·\[]+/, '🔊 듣기 '); }
/* 같이 풀기에서 푼 기록: 그날 d.nb = [[문제, 정답, 재윤이 답, 결과 1·0, 과목]] (공부 시간·정답률 통계에는 안 들어감) */
function nbLogs(k){ const dy = S.days[k]; return ((dy && dy.nb) || []).map(x => ({ k, board:'nb', t:x[0], a:x[1], w:x[2], r:x[3], subj:x[4] })); }
/* 오답노트 한 장 → 원래 문제(보기·그림 포함). 복습 줄(S.wrong)에 남아 있는 것만 원래 모양을 알 수 있다 */
function nbQ(x){
  if (x.subj === 'dict') return null;
  return (S.wrong.find(w => w.subj === x.subj && w.q && String(w.q.ans) === String(x.a) && qBrief(w.q) === x.t) || {}).q || null;
}
function noteSay(x){ if (x.subj === 'dict') return `받아쓰기. ${x.a}`;
  const ls = noteListen(x), base = String(x.t).replace(/🔊 [^·\[]+/, '').replace(/\[보기[^\]]*\]/g, '').replace(/·/g, ',').replace(/,\s*,/g, ',').trim().replace(/,$/, '');
  return (ls ? `${base}. ${ls}` : base).replace(/\s+,/g, ','); }
VIEWS.notebook = (o) => {
  if (o && o.from) Object.assign(NOTE, { from:o.from, more:0, open:{} });
  const all = notebookItems(), kid = NOTE.from === 'home';
  const bySubj = s => s === 'all' ? all : all.filter(x => x.subj === s);
  const cur = bySubj(NOTE.subj), todo = cur.filter(x => !x.fixed), fixed = cur.filter(x => x.fixed);
  const list = todo;
  const shown = list.slice(0, 30 * (NOTE.more + 1));
  let html = '', last = '';
  shown.forEach((x, i) => {
    if (x.last !== last) { last = x.last; const [y, m, d] = x.last.split('-').map(Number); html += `<div class="pdate">${m}월 ${d}일 ${DOW[new Date(y, m - 1, d).getDay()]}요일</div>`; }
    const open = NOTE.showAll || NOTE.open[x.id], sn = { kor:'국어', math:'수학', eng:'영어', dict:'받아쓰기' }[x.subj] || '';
    const times = x.miss ? `${x.miss}번 틀림` : '힌트 보고 맞힘';
    html += `<div class="nb-card ${x.fixed ? 'fixed' : ''}">
      <div class="nb-top"><span class="nb-subj s-${x.subj}">${sn}</span><span class="muted">${times}${x.miss && x.hint ? ` · 힌트 ${x.hint}번` : ''}</span><span class="spacer"></span></div>
      <div class="nb-q"><span>${esc(noteShow(x))}</span><button class="speak-btn" data-a="nbsay" data-i="${i}" aria-label="문제 읽어 주기">${ICON.speak}</button></div>
      ${open ? `<div class="nb-a">정답 <b>${esc(x.a)}</b>${x.wrongs.length ? `<span class="nb-w">재윤이 답 ${x.wrongs.slice(0, 3).map(w => `<s>${esc(w)}</s>`).join(' ')}</span>` : ''}</div>`
        : `<button class="btn ghost small nb-show" data-a="nbopen" data-i="${i}">정답 보기</button>`}
    </div>`;
  });
  const chip = (k, v, l) => `<button class="chip ${NOTE[k] === v ? 'on' : ''}" data-a="nbset" data-k="${k}" data-v="${v}">${l}</button>`;
  app().innerHTML = `<section class="screen notebook">
    <div class="row"><button class="icon-btn" data-a="nbback" aria-label="나가기">${ICON.back}</button><h2 style="flex:1;margin:0">📒 재윤이 오답노트</h2></div>
    ${kid ? `<div class="row" style="gap:10px;align-items:center">${stageHTML(90, { expr:'think', size:70 })}<p class="bubble" style="flex:1;font-size:18px;margin:0">틀린 문제는 보물이야! 엄마랑 같이 풀어서 맞히면 오답노트에서 사라져!</p></div>`
      : `<p class="muted" style="font-size:14px;margin:0">재윤이가 틀린 문제(힌트 보고 두 번째에 맞힌 것 포함)를 모았어요. "같이 풀기"로 재윤이와 다시 풀어서 맞히면 오답노트에서 없어져요. 또 틀리면 다시 들어와요. 문제별 기록은 10월 22일부터 있어요.</p>`}
    <div class="row" style="gap:8px;flex-wrap:wrap">${NOTE_SUBJ.map(([v, l]) => { const c = bySubj(v).filter(x => !x.fixed).length; return `<button class="chip ${NOTE.subj === v ? 'on' : ''}" data-a="nbset" data-k="subj" data-v="${v}">${l}${c ? ` <b>${c}</b>` : ''}</button>`; }).join('')}</div>
    <div class="row" style="gap:8px;flex-wrap:wrap;align-items:center"><span class="muted" style="font-size:14px">${fixed.length ? `같이 풀어서 없앤 문제 ${fixed.length}개 ✨` : '같이 풀어서 맞히면 여기서 없어져요'}</span><span class="spacer"></span><button class="chip ${NOTE.showAll ? 'on' : ''}" data-a="nbset" data-k="showAll" data-v="1">${NOTE.showAll ? '정답 가리기' : '정답 다 보기'}</button></div>
    ${todo.length ? `<button class="btn big nb-play" data-a="nbplay">📝 ${kid ? '엄마랑 같이 풀기' : '재윤이랑 같이 풀기'} <span>${Math.min(10, todo.length)}문제${todo.length > 10 ? ` (남은 ${todo.length})` : ''}</span></button>` : ''}
    ${shown.length ? `<div class="nb-list">${html}</div>${list.length > shown.length ? `<button class="btn ghost" data-a="nbset" data-k="more" data-v="1">${list.length - shown.length}개 더 보기</button>` : ''}`
      : `<div class="panel" style="text-align:center"><p style="font-size:18px">${all.length ? '오답노트가 깨끗해요! 다 같이 풀었어요 🎉' : '아직 틀린 문제가 없어요!'}</p></div>`}
  </section>`;
  VIEWS.notebook.list = shown;
};
Object.assign(ACT, {
  notebook(){ go('notebook', { from: SCREEN === 'adult' ? 'adult' : 'home' }); },
  nbback(){ go(NOTE.from === 'adult' ? 'adult' : 'home'); },
  nbset(el){ const k = el.dataset.k, v = el.dataset.v;
    if (k === 'more') NOTE.more++; else if (k === 'showAll') NOTE.showAll = !NOTE.showAll; else { NOTE[k] = v; NOTE.more = 0; }
    const y = k === 'more' ? scrollY : 0; VIEWS.notebook(); scrollTo(0, y); },
  nbopen(el){ const x = (VIEWS.notebook.list || [])[+el.dataset.i]; if (!x) return; NOTE.open[x.id] = true; SFX.tap(); const y = scrollY; VIEWS.notebook(); scrollTo(0, y); },
  nbsay(el){ const x = (VIEWS.notebook.list || [])[+el.dataset.i]; if (x) speak(noteSay(x)); },
});

/* ---------- 엄마랑 같이 풀기: 한 문제씩, 맞히면 다음으로 (10/29 오빠 요청) ----------
   - 보기 문제·숫자 문제: 재윤이가 직접 눌러서. 맞히면 "다시 맞혔어요" + 다음 문제, 두 번 틀리면 정답 보여 주고 다음에 다시
   - 10/30 오빠 요청 "태블릿으로 정답 입력": 모든 문제를 재윤이가 화면에서 직접 답한다 (nbInputQ)
     · 원래 문제 모양을 알면 그대로(보기·숫자·글자 블록)
     · 모르면 기록에서 되살림: [보기 …]가 남아 있으면 보기 문제, 숫자 답이면 숫자판, 짧은 낱말이면 글자 블록(가짜 글자 2개 섞음),
       띄어 쓴 짧은 말이면 낱말 블록
     · 받아쓰기·긴 답: 태블릿이면 펜으로 써서 "다 썼어요" → 쓴 글씨 옆에 정답 → 엄마 ⭕/❌ (폰이면 예전처럼 정답 보기 → 엄마 ⭕/❌)
   - 결과는 그날 d.nb에 남고(오답노트 "다시 맞혔어요" 판단), 복습 줄(S.wrong)도 같이 맞춘다 */
let NBP = null;
function nbStart(){
  const items = notebookItems().filter(x => !x.fixed && (NOTE.subj === 'all' || x.subj === NOTE.subj))
    .sort((a, b) => (b.miss - a.miss) || b.last.localeCompare(a.last)).slice(0, 10);
  NBP = { items, i:0, right:0, tries:0, typed:'', show:false, wrongs:[] };
}
function nbRecord(x, ok, w){
  const d = day(); d.nb = d.nb || []; d.nb.push([x.t, String(x.a).slice(0, 60), (w || []).join(' / ').slice(0, 80), ok ? 1 : 0, x.subj]);
  const q = nbQ(x), wq = q && S.wrong.find(y => y.q === q);
  if (wq) { if (ok) { wq.streak++; if (wq.streak >= 2) S.wrong = S.wrong.filter(y => y !== wq); else wq.due = addDays(todayKey(), 3); } else { wq.streak = 0; wq.misses++; wq.due = addDays(todayKey(), 1); } }
  if (x.subj === 'dict') { const wd = S.wrong.find(y => y.subj === 'dict' && y.q && y.q.w === x.a); if (wd && ok) S.wrong = S.wrong.filter(y => y !== wd); }
  save();
}
/* 같이 풀기에서 재윤이가 답을 넣는 모양 (10/30). 원래 문제(S.wrong)는 바꾸지 않고 얕은 복사본을 쓴다 */
function nbInputQ(x){
  const a = String(x.a), pen = penMode();
  const shown = String(noteShow(x)).replace(/\s*·?\s*\[보기[^\]]*\]/g, '').replace(/\s*·\s*$/, '').trim();
  if (x.subj === 'dict') return { input: pen ? 'pen' : 'mom', prompt: pen ? '잘 듣고 펜으로 써 봐요' : '불러 주는 낱말을 써 봐요' };
  const o = nbQ(x);
  if (o && ['choice', 'numpad', 'build'].includes(o.input) && (o.input !== 'choice' || (o.opts || []).map(String).includes(a))) return Object.assign({}, o, { orig:o });
  const base = { prompt: shown || '정답을 찾아봐요', subj:x.subj };
  const m = String(x.t).match(/\[보기 ([^\]]*)\]/);
  if (m) { const opts = m[1].split(' · ').map(t => t.trim()).filter(Boolean); if (opts.includes(a) && opts.length >= 2) return Object.assign(base, { input:'choice', opts, ans:a }); }
  if (/^\d{1,4}$/.test(a)) return Object.assign(base, { input:'numpad', ans:a });
  const ko = /^[가-힣]+$/.test(a), en = /^[A-Za-z]+$/.test(a);
  if ((ko && a.length >= 2 && a.length <= 6) || (en && a.length >= 2 && a.length <= 7)) {
    const parts = [...a], fakes = new Set(); let g = 0;
    while (fakes.size < 2 && g++ < 40) { const f = ko ? fakeSyl(pick(parts)) : pick('abcdefghiklmnoprstuw'.split('')); if (!parts.includes(f)) fakes.add(en && a === a.toUpperCase() ? f.toUpperCase() : f); }
    return Object.assign(base, { input:'build', parts, sep:'', tiles:shuffle([...parts, ...fakes]), ans:a, say:`${shown}. 글자 블록을 차례대로 눌러서 답을 만들어 봐요` });
  }
  const ws = a.split(/\s+/).filter(Boolean);
  if (ws.length >= 2 && ws.length <= 5 && ws.every(w => w.length <= 7) && new Set(ws).size === ws.length) {
    const others = shuffle(notebookItems().flatMap(y => String(y.a).split(/\s+/)).filter(w => w && w.length <= 7 && !ws.includes(w) && /^[가-힣A-Za-z]+$/.test(w)));
    return Object.assign(base, { input:'build', parts:ws, sep:' ', wide:true, tiles:shuffle([...ws, ...[...new Set(others)].slice(0, 1)]), ans:a, say:`${shown}. 낱말 블록을 차례대로 눌러서 답을 만들어 봐요` });
  }
  return Object.assign(base, { input: pen ? 'pen' : 'mom', prompt: shown + (pen ? ' (펜으로 답을 써 봐요)' : '') });
}
function nbBuildHTML(q, built){
  const n = q.parts ? q.parts.length : [...q.ans].length, w = q.wide ? ' w' : '';
  return `<div class="slots">${Array.from({ length:n }, (_, i) => `<span class="s${w} ${built[i] != null ? 'filled' : ''}" data-a="nbunbuild" data-i="${i}">${built[i] != null ? esc(q.tiles[built[i]]) : ''}</span>`).join('')}</div>
      <div class="tiles">${q.tiles.map((t, i) => `<button class="${w.trim()} ${built.includes(i) ? 'used' : ''}" data-a="nbtile" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
}
function nbWrongTry(){ const P = NBP; P.tries++; SFX.wrong();
  if (P.tries >= 2) return nbAfter(false);
  VIEWS.nbplay(); const fb = $('#nbfb'); if (fb) fb.innerHTML = `<div class="bubble" style="font-size:19px">음… 다시 한 번 생각해 볼까?</div>`; speak('음, 다시 한 번 생각해 볼까?'); }
VIEWS.nbplay = () => {
  const P = NBP; if (!P) return go('notebook');
  if (P.i >= P.items.length) {
    app().innerHTML = `<section class="screen" style="justify-content:center;align-items:center;text-align:center">
      ${stageHTML(180, { expr:'love', size:130, cls:'hop' })}
      <h2>${P.right} / ${P.items.length} 다시 맞혔어!</h2>
      <p class="bubble" style="font-size:19px">${P.right === P.items.length ? '전부 맞혔어! 맞힌 문제는 오답노트에서 사라졌어!' : P.right ? '잘했어! 맞힌 문제는 오답노트에서 사라졌어. 못 맞힌 건 다음에 또 해 보자.' : '괜찮아! 다음에 또 같이 해 보자.'}</p>
      <div class="row" style="gap:10px;flex-wrap:wrap;justify-content:center">${notebookItems().some(x => !x.fixed) ? '<button class="btn" data-a="nbplay">더 풀기</button>' : ''}<button class="btn ghost" data-a="nbdone">오답노트로</button></div></section>`;
    if (P.right) SFX.sticker(); speak(P.right === P.items.length ? '전부 맞혔어! 최고야!' : '잘했어! 다음에 또 같이 해 보자!');
    return;
  }
  const x = P.items[P.i], sn = { kor:'국어', math:'수학', eng:'영어', dict:'받아쓰기' }[x.subj] || '';
  if (!P.q || P.qFor !== x.id) { P.q = nbInputQ(x); P.qFor = x.id; P.built = []; }
  const q = P.q, mode = q.input;
  P.mode = mode;
  const prompt = q.prompt;
  const ink = P.ink ? `<div class="nb-ink"><img src="${P.ink}" alt="재윤이가 쓴 답"></div>` : '';
  const judge = `<div class="nb-a" style="justify-content:center">정답 <b>${esc(x.a)}</b></div>${ink}<p class="muted" style="text-align:center;margin:0">엄마가 봐 주세요. 재윤이가 맞혔나요?</p>
        <div class="row" style="gap:12px;justify-content:center"><button class="btn mint big" data-a="nbjudge" data-v="1">⭕ 맞혔어요</button><button class="btn ghost big" data-a="nbjudge" data-v="0">❌ 다음에 다시</button></div>`;
  const body = mode === 'choice' ? `<div class="options ${q.cols === 2 && !q.sayOpts ? 'cols2' : q.opts.length === 3 && !q.opts.some(o => String(o).length > 5) && !q.sayOpts && !q.pic ? 'cols3' : ''}">${q.opts.map((o, i) => `<button class="opt ${q.pic ? 'pic-opt' : ''} ${P.wrongs.includes(String(o)) ? 'nb-x' : ''}" data-a="nbans" data-i="${i}" ${P.wrongs.includes(String(o)) ? 'disabled' : ''}>${optLabel(q, o)}</button>`).join('')}</div>`
    : mode === 'numpad' ? `<div class="answer-box"><span class="slot">${esc(P.typed)}</span></div><div class="numpad">${[1,2,3,4,5,6,7,8,9].map(n => `<button data-a="nbnum" data-v="${n}">${n}</button>`).join('')}<button class="del" data-a="nbnum" data-v="del">지우기</button><button data-a="nbnum" data-v="0">0</button><button class="ok" data-a="nbnum" data-v="ok">확인</button></div>`
    : mode === 'build' ? nbBuildHTML(q, P.built)
    : P.show ? judge
    : mode === 'pen' ? `<div class="pen-wrap"><canvas id="pen" class="pen-canvas" aria-label="답 쓰는 칸"></canvas><div class="row" style="gap:10px;justify-content:center"><button class="btn ghost small" data-a="penclear">지우고 다시 쓰기</button><button class="btn mint big" data-a="nbpendone">다 썼어요</button></div></div>`
      : `<p class="muted" style="text-align:center;margin:0">${x.subj === 'dict' ? '공책에 써 보고' : '답을 말해 보고'} 정답을 눌러서 확인해요</p><button class="btn big" data-a="nbreveal">정답 보기</button>`;
  app().innerHTML = `<section class="screen">
    <div class="q-top"><button class="icon-btn" data-a="nbdone" aria-label="그만하기">${ICON.close}</button><span class="disp" style="flex:1;text-align:center;font-size:18px">📒 같이 풀기</span><span class="disp" style="font-size:18px">${P.i + 1}/${P.items.length}</span></div>
    <div class="q-card">
      <div class="nb-top"><span class="nb-subj s-${x.subj}">${sn}</span><span class="muted">${x.miss ? `전에 ${x.miss}번 틀린 문제` : '전에 힌트 보고 맞힌 문제'}</span></div>
      <div class="q-head"><p class="q-prompt">${esc(prompt)}</p><button class="speak-btn" data-a="nbqsay" aria-label="다시 듣기">${ICON.speak}</button></div>
      ${q && q.vis ? `<div class="q-visual">${visHTML(q)}</div>` : ''}
      ${body}
    </div>
    <div class="feedback" id="nbfb"></div>
  </section>`;
  if (mode === 'pen' && !P.show) setupPen(2);
  if (!P.said) { P.said = true; nbSay(); }
};
function nbSay(){ const P = NBP, x = P.items[P.i], q = P.q && P.q.orig; ++SEQ;
  if (q) { if (q.listen) { (async () => { const my = SEQ; if (q.say) await speak(q.say); if (my === SEQ) speak(q.listen, q.lang || 'ko-KR'); })(); } else speak(q.say || q.prompt); }
  else speak(noteSay(x)); }
function nbAfter(ok){
  const P = NBP, x = P.items[P.i];
  nbRecord(x, ok, P.wrongs);
  if (ok) P.right++;
  const fb = $('#nbfb');
  if (fb) fb.innerHTML = ok ? `<div class="bubble" style="font-size:20px">⭕ 맞았어! 다음 문제로 가자!</div>` : `<div class="bubble" style="font-size:20px">정답은 <b>${esc(x.a)}</b>. 다음에 또 해 보자!</div>`;
  if (ok) { SFX.right(); speak(pick(['맞았어! 잘했어!', '와, 이제 알겠지?', '정답! 멋지다!'])); } else speak(`정답은 ${x.subj === 'dict' ? x.a : String(x.a)}. 다음에 또 해 보자!`);
  document.querySelectorAll('[data-a^="nb"]').forEach(b => { if (b.dataset.a !== 'nbdone') b.disabled = true; });
  setTimeout(() => { if (SCREEN !== 'nbplay' || NBP !== P) return; P.i++; P.tries = 0; P.typed = ''; P.show = false; P.wrongs = []; P.said = false; P.ink = null; P.q = null; P.built = []; VIEWS.nbplay(); }, ok ? 1300 : 2200);
}
Object.assign(ACT, {
  nbplay(){ nbStart(); if (!NBP.items.length) return go('notebook'); SFX.tap(); go('nbplay'); },
  nbdone(){ NBP = null; go('notebook'); },
  nbqsay(){ nbSay(); },
  nbreveal(){ NBP.show = true; SFX.tap(); VIEWS.nbplay(); },
  nbjudge(el){ nbAfter(el.dataset.v === '1'); },
  nbans(el){ const P = NBP, q = P.q, o = q.opts[+el.dataset.i];
    if (String(o) === String(q.ans)) return nbAfter(true);
    P.wrongs.push(String(o)); P.tries++; SFX.wrong();
    if (P.tries >= 2) return nbAfter(false);
    el.classList.add('nb-x', 'shake'); el.disabled = true; const fb = $('#nbfb'); if (fb) fb.innerHTML = `<div class="bubble" style="font-size:19px">음… 다시 한 번 생각해 볼까?</div>`; speak('음, 다시 한 번 생각해 볼까?'); },
  nbtile(el){ const P = NBP, q = P.q, i = +el.dataset.i, n = q.parts ? q.parts.length : [...q.ans].length;
    if (P.locked || P.built.includes(i) || P.built.length >= n) return;
    SFX.tap(); P.built.push(i); VIEWS.nbplay();
    if (P.built.length === n) { P.locked = true; setTimeout(() => { P.locked = false; if (NBP !== P || SCREEN !== 'nbplay') return;
      const got = P.built.map(k => q.tiles[k]).join(q.sep || '');
      if (got === String(q.ans)) return nbAfter(true);
      P.wrongs.push(got); P.built = []; nbWrongTry(); }, 280); } },
  nbunbuild(el){ const P = NBP, i = +el.dataset.i; if (P.locked || P.built[i] == null) return; P.built = P.built.slice(0, i); SFX.tap(); VIEWS.nbplay(); },
  nbpendone(){ const P = NBP; if (!PEN.drawn) { toast('칸에 먼저 써 주세요'); speak('칸에 먼저 써 볼까?'); return; }
    P.ink = penImage(); P.show = true; SFX.tap(); VIEWS.nbplay(); speak('다 썼구나! 엄마, 정답이랑 맞는지 봐 주세요'); },
  nbnum(el){ const P = NBP, v = el.dataset.v;
    if (v === 'del') P.typed = P.typed.slice(0, -1);
    else if (v === 'ok') { if (!P.typed) return; if (Number(P.typed) === Number(P.q.ans)) return nbAfter(true);
      P.wrongs.push(P.typed); P.typed = ''; return nbWrongTry(); }
    else if (P.typed.length < 4) P.typed += v;
    SFX.tap(); const sl = document.querySelector('.answer-box .slot'); if (sl) sl.textContent = P.typed; },
});
/* 엄마 탭 바로가기 → 접힌 칸 펼치기 (ACT는 app.js 맨 아래에서 만들어져서 여기서 붙인다) */
ACT.momfold = el => { const k = el.dataset.v; MOM_OPEN.add(k); const d = document.querySelector(`details.mom-fold[data-k="${k}"]`); if (d) { d.open = true; d.scrollIntoView({ behavior:'smooth', block:'start' }); } };
