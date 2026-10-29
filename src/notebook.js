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
  ks.forEach(k => [...dayLogs(k), ...dictLogs(k)].forEach(x => {
    const subj = ['kor','math','eng','dict'].includes(x.subj) ? x.subj : 'etc';
    const id = subj + '|' + x.t + '|' + x.a; let it = map.get(id);
    if (x.r !== 1) {
      if (!it) { it = { id, subj, t:x.t, a:x.a, wrongs:[], miss:0, hint:0, first:x.k }; map.set(id, it); }
      if (x.r === 2) it.hint++; else it.miss++;
      String(x.w || '').split(' / ').forEach(w => { if (w && !it.wrongs.includes(w)) it.wrongs.push(w); });
      it.last = x.k; it.fixed = null;
    } else if (it) it.fixed = x.k;   // 틀린 뒤에 한 번에 맞힘
  }));
  return [...map.values()].sort((a, b) => b.last.localeCompare(a.last) || (b.miss - a.miss));
}
/* 듣기 문제·받아쓰기는 문제 글에 정답이 들어 있어서, 화면에는 "🔊 듣기"로 가리고 버튼을 누르면 읽어 준다 */
function noteListen(x){ if (x.subj === 'dict') return x.a; const m = String(x.t).match(/🔊 ([^·\[]+)/); return m ? m[1].trim() : ''; }
function noteShow(x){ return x.subj === 'dict' ? '받아쓰기 · 🔊 들어 보고 써 보기' : String(x.t).replace(/🔊 [^·\[]+/, '🔊 듣기 '); }
function noteSay(x){ if (x.subj === 'dict') return `받아쓰기. ${x.a}`;
  const ls = noteListen(x), base = String(x.t).replace(/🔊 [^·\[]+/, '').replace(/\[보기[^\]]*\]/g, '').replace(/·/g, ',').replace(/,\s*,/g, ',').trim().replace(/,$/, '');
  return (ls ? `${base}. ${ls}` : base).replace(/\s+,/g, ','); }
VIEWS.notebook = (o) => {
  if (o && o.from) Object.assign(NOTE, { from:o.from, more:0, open:{} });
  const all = notebookItems(), kid = NOTE.from === 'home';
  const bySubj = s => s === 'all' ? all : all.filter(x => x.subj === s);
  const cur = bySubj(NOTE.subj), todo = cur.filter(x => !x.fixed), fixed = cur.filter(x => x.fixed);
  const list = NOTE.st === 'todo' ? todo : NOTE.st === 'fixed' ? fixed : cur;
  const shown = list.slice(0, 30 * (NOTE.more + 1));
  let html = '', last = '';
  shown.forEach((x, i) => {
    if (x.last !== last) { last = x.last; const [y, m, d] = x.last.split('-').map(Number); html += `<div class="pdate">${m}월 ${d}일 ${DOW[new Date(y, m - 1, d).getDay()]}요일</div>`; }
    const open = NOTE.showAll || NOTE.open[x.id], sn = { kor:'국어', math:'수학', eng:'영어', dict:'받아쓰기' }[x.subj] || '';
    const times = x.miss ? `${x.miss}번 틀림` : '힌트 보고 맞힘';
    html += `<div class="nb-card ${x.fixed ? 'fixed' : ''}">
      <div class="nb-top"><span class="nb-subj s-${x.subj}">${sn}</span><span class="muted">${times}${x.miss && x.hint ? ` · 힌트 ${x.hint}번` : ''}</span><span class="spacer"></span>${x.fixed ? '<span class="pill ok">다시 맞혔어요 ✓</span>' : '<span class="pill wait">다시 풀어 보기</span>'}</div>
      <div class="nb-q"><span>${esc(noteShow(x))}</span><button class="speak-btn" data-a="nbsay" data-i="${i}" aria-label="문제 읽어 주기">${ICON.speak}</button></div>
      ${open ? `<div class="nb-a">정답 <b>${esc(x.a)}</b>${x.wrongs.length ? `<span class="nb-w">재윤이 답 ${x.wrongs.slice(0, 3).map(w => `<s>${esc(w)}</s>`).join(' ')}</span>` : ''}</div>`
        : `<button class="btn ghost small nb-show" data-a="nbopen" data-i="${i}">정답 보기</button>`}
    </div>`;
  });
  const chip = (k, v, l) => `<button class="chip ${NOTE[k] === v ? 'on' : ''}" data-a="nbset" data-k="${k}" data-v="${v}">${l}</button>`;
  app().innerHTML = `<section class="screen notebook">
    <div class="row"><button class="icon-btn" data-a="nbback" aria-label="나가기">${ICON.back}</button><h2 style="flex:1;margin:0">📒 재윤이 오답노트</h2></div>
    ${kid ? `<div class="row" style="gap:10px;align-items:center">${stageHTML(90, { expr:'think', size:70 })}<p class="bubble" style="flex:1;font-size:18px;margin:0">틀린 문제는 보물이야! 엄마랑 같이 하나씩 다시 풀어 보자. 정답은 먼저 말해 보고 눌러 봐!</p></div>`
      : `<p class="muted" style="font-size:14px;margin:0">재윤이가 틀린 문제(힌트 보고 두 번째에 맞힌 것 포함)를 모았어요. 같은 문제는 한 장으로 묶고, 나중에 한 번에 맞히면 "다시 맞혔어요 ✓"가 붙어요. 정답을 가려 두었으니 재윤이가 먼저 말해 보게 해 주세요. 문제별 기록은 10월 22일부터 있어요.</p>`}
    <div class="row" style="gap:8px;flex-wrap:wrap">${NOTE_SUBJ.map(([v, l]) => { const c = bySubj(v).filter(x => !x.fixed).length; return `<button class="chip ${NOTE.subj === v ? 'on' : ''}" data-a="nbset" data-k="subj" data-v="${v}">${l}${c ? ` <b>${c}</b>` : ''}</button>`; }).join('')}</div>
    <div class="row" style="gap:8px;flex-wrap:wrap">${chip('st', 'todo', `다시 풀 문제 ${todo.length}`)}${chip('st', 'fixed', `다시 맞힌 문제 ${fixed.length}`)}${chip('st', 'all', `전부 ${cur.length}`)}<span class="spacer"></span><button class="chip ${NOTE.showAll ? 'on' : ''}" data-a="nbset" data-k="showAll" data-v="1">${NOTE.showAll ? '정답 가리기' : '정답 다 보기'}</button></div>
    ${shown.length ? `<div class="nb-list">${html}</div>${list.length > shown.length ? `<button class="btn ghost" data-a="nbset" data-k="more" data-v="1">${list.length - shown.length}개 더 보기</button>` : ''}`
      : `<div class="panel" style="text-align:center"><p style="font-size:18px">${NOTE.st === 'todo' ? (all.length ? '다시 풀 문제가 없어요! 다 맞혔어요 🎉' : '아직 틀린 문제가 없어요!') : '아직 없어요'}</p></div>`}
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
