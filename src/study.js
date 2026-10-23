/* ===================== 엄마 · 오빠: 재윤이 공부 기록 (기간 달력 · 날짜별 푼 문제) + 받아쓰기 채점 ===================== */

/* ---------- 문제 기록: 판마다 b.log = [[문제, 정답, 재윤이가 고른 오답, 결과(1 한 번에 · 2 두 번째에 · 0 틀림), 걸린 초, 과목]] ---------- */
const stripTags = h => String(h || '').replace(/<br\s*\/?>/g, ' / ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
function qBrief(q){
  const v = q.vis || {}; let x = '';
  try {
    if (v.k === 'clock') x = `🕐 시계 ${v.h}시${v.m ? ` ${v.m}분` : ''}`;
    else if (v.k === 'count') x = `${v.e} ${v.n}개`;
    else if (v.k === 'tens') x = `10개씩 묶음 ${v.t}개${v.o ? ` + 낱개 ${v.o}개` : ''}`;
    else if (v.k === 'groups') x = `${v.e} ${v.each}개씩 ${v.g}묶음`;
    else if (v.k === 'pic') x = v.e;
    else if (!['listen', 'eng', 'frac'].includes(v.k)) x = stripTags(visHTML(q));
  } catch (e) {}
  if (x.length > 70) x = x.slice(0, 68) + '…';
  if (x && (q.prompt || '').includes(x)) x = '';
  const listen = q.listen && (v.k === 'listen' || q.eng) ? `🔊 ${q.listen}` : '';
  const opts = q.input === 'choice' && q.opts && q.opts.map(String).join('').length <= 48 ? `[보기 ${q.opts.join(' · ')}]` : '';
  return [q.prompt || '', x, listen, opts].filter(Boolean).join(' · ').slice(0, 200);
}
function logQ(b, q, r){
  try {
    const secs = Math.round(clamp((Date.now() - RUN.t0) / 1000, 1, 300));
    (b.log = b.log || []).push([qBrief(q), String(q.ans).slice(0, 60), [...new Set(RUN.wrongs || [])].map(x => String(x).slice(0, 40)).join(' / '), r, secs, q.subj || '']);
  } catch (e) {}
}

/* ---------- 받아쓰기 채점: 재윤이 글씨 바로 옆에 O · X ---------- */
const ROWS_GUESS = {};   // 예전 펜 받아쓰기 사진(줄 수 기록이 없는 것)을 보고 줄을 나눌 수 있는지 이 기기에서만 기억
function dictRows(k, dt){
  if (dt.rows) return dt.rows;
  if (ROWS_GUESS[k] !== undefined) return ROWS_GUESS[k];
  if (!dt.photo) return 0;
  ROWS_GUESS[k] = 0;
  const im = new Image();
  im.onload = () => { if (im.naturalWidth === 760 && im.naturalHeight === 150 * dt.words.length) { ROWS_GUESS[k] = dt.words.length; if (SCREEN === 'adult') { const y = scrollY; VIEWS.adult(); scrollTo(0, y); } } };
  im.src = dt.photo;
  return 0;
}
function oxHTML(k, i, m){ return `<span class="ox"><button class="o ${m === true ? 'on' : ''}" data-a="mark" data-v="${k}|${i}|1" aria-label="${i + 1}번 맞음">O</button><button class="x ${m === false ? 'on' : ''}" data-a="mark" data-v="${k}|${i}|0" aria-label="${i + 1}번 틀림">X</button></span>`; }
function gradeCard(k, dy){
  const dt = Object.assign({}, dy.dict, gradeOf(k)), marks = (dt.marks && dt.marks.length ? dt.marks : dt.words.map(() => null));
  const left = marks.filter(m => m === null).length, rows = dt.photo ? dictRows(k, dy.dict) : 0;
  const head = `<div class="row"><b class="disp" style="font-size:18px;font-weight:400">${shortDate(k)} 받아쓰기</b><span class="spacer"></span>${dt.graded ? `<span class="pill ok">${dt.score}/10점</span>` : `<span class="pill wait" data-left="${k}">${left ? `${left}개 남음` : '다 골랐어요'}</span>`}</div>`;
  if (dt.graded) return `<div class="grade-card" data-k="${k}">${head}
    <div class="dict-result">${dt.words.map((w, i) => `<span class="${dt.marks[i] ? 'ok' : 'no'}">${dt.marks[i] ? '⭕' : '❌'} ${esc(w)}</span>`).join('')}</div>
    ${dt.photo ? `<button class="btn ghost small" data-a="zoom" data-v="${k}" style="justify-self:start">쓴 글씨 보기</button>` : ''}</div>`;
  const foot = `<div class="row grade-foot" style="flex-wrap:wrap;gap:8px"><button class="btn ghost small" data-a="markrest" data-v="${k}" ${left ? '' : 'disabled'}>남은 것 모두 O</button><span class="spacer"></span>
      <button class="btn mint" data-a="grade" data-v="${k}" ${left ? 'disabled' : ''}>채점 완료</button></div>
    <p class="muted" style="font-size:14px">틀린 낱말은 다음 받아쓰기에 다시 나와요.</p>`;
  // 펜으로 쓴 것: 줄마다 잘라서 글씨 옆에 정답과 O · X
  if (rows === dt.words.length) return `<div class="grade-card" data-k="${k}" style="--img:url('${dt.photo}')">${head}
    <div class="grade-rows">${dt.words.map((w, i) => `<div class="grade-row ${marks[i] === true ? 'is-o' : marks[i] === false ? 'is-x' : ''}" data-row="${i}">
      <span class="gn">${i + 1}</span>
      <div class="gw"><span class="crop" style="background-position:0 ${rows > 1 ? (i / (rows - 1) * 100).toFixed(3) : 0}%;background-size:100% ${rows * 100}%"></span><span class="gans">정답 <b>${esc(w)}</b></span></div>
      ${oxHTML(k, i, marks[i])}</div>`).join('')}</div>${foot}</div>`;
  // 공책 사진: 넓은 화면은 사진과 채점을 나란히, 폰은 사진을 위에 붙여 두고 아래에서 채점
  return `<div class="grade-card" data-k="${k}">${head}
    <div class="grade-split">
      <div class="grade-photo">${dt.photo ? `<img src="${dt.photo}" alt="받아쓰기 사진" data-a="zoom" data-v="${k}">` : `<p class="muted">사진이 없어요. 공책을 직접 보고 채점해 주세요.</p>`}</div>
      <div class="grade-list">${dt.words.map((w, i) => `<div class="grade-row ${marks[i] === true ? 'is-o' : marks[i] === false ? 'is-x' : ''}" data-row="${i}"><span class="gn">${i + 1}</span><span class="gw"><b>${esc(w)}</b></span>${oxHTML(k, i, marks[i])}</div>`).join('')}</div>
    </div>${foot}</div>`;
}
function dictGradePanel(pend){
  const todo = pend.filter(([k]) => !gradeOf(k).graded), done = pend.filter(([k]) => gradeOf(k).graded);
  return `<div class="panel" id="gradePanel"><h3>받아쓰기 채점${todo.length ? ` <span class="pill wait" style="vertical-align:middle">${todo.length}개 기다려요</span>` : ''}</h3>
    ${pend.length ? [...todo, ...done].map(([k, dy]) => gradeCard(k, dy)).join('') : '<p class="muted">재윤이가 받아쓰기를 끝내면 여기에 와요.</p>'}</div>`;
}
/* O · X를 누르면 화면 전체를 다시 그리지 않고 그 줄만 바꾼다 (스크롤 그대로) */
function markRefresh(k){
  const card = document.querySelector(`.grade-card[data-k="${k}"]`); if (!card) { const y = scrollY; go('adult'); scrollTo(0, y); return; }
  const g = gradeOf(k), left = g.marks.filter(m => m === null).length;
  card.querySelectorAll('.grade-row').forEach(r => { const i = +r.dataset.row, m = g.marks[i];
    r.classList.toggle('is-o', m === true); r.classList.toggle('is-x', m === false);
    r.querySelector('.o').classList.toggle('on', m === true); r.querySelector('.x').classList.toggle('on', m === false); });
  const pill = card.querySelector(`[data-left="${k}"]`); if (pill) pill.textContent = left ? `${left}개 남음` : '다 골랐어요';
  const gb = card.querySelector('[data-a="grade"]'); if (gb) gb.disabled = !!left;
  const rb = card.querySelector('[data-a="markrest"]'); if (rb) rb.disabled = !left;
  SFX.tap();
}

/* ---------- 공부 기록 화면 ---------- */
let STUDY = null;
const SUBJ_ALL = [['all','전체'],['kor','국어'],['math','수학'],['eng','영어'],['rev','복습']];
const SUBJ_COLOR = { kor:'var(--pink-deep)', math:'var(--sky-deep)', eng:'var(--mint-deep)', rev:'var(--lav-deep)', dict:'var(--butter-deep)' };
function monthStart(k){ return k.slice(0, 8) + '01'; }
function monthEnd(k){ const [y, m] = k.split('-').map(Number); return keyOf(new Date(y, m, 0)); }
function studyPreset(p){
  const t = todayKey(), mon = mondayOf(t), first = S.firstDay || Object.keys(S.days).sort()[0] || t;
  switch (p) {
    case 'today': return [t, t];
    case 'week': return [mon, t];
    case 'lastweek': return [addDays(mon, -7), addDays(mon, -1)];
    case 'month': return [monthStart(t), t];
    case 'lastmonth': { const e = addDays(monthStart(t), -1); return [monthStart(e), e]; }
    case '30': return [addDays(t, -29), t];
    default: return [first < t ? first : t, t];
  }
}
/* 하루 공부 시간: 앱에서 푼 시간 + EBS 강의 본 시간 (강의는 한 편 최대 40분까지만 셈) */
function lecturesOn(k){ return SUBJS.flatMap(s => Object.entries(curr(s).seen || {}).filter(([, v]) => v.d === k).map(([n, v]) => ({ s, n:+n, mins:Math.min(40, v.mins || 0), info:lectInfo(s, +n) }))); }
function dayMins(k){ const dy = S.days[k], app = minutesOf(dy), lec = lecturesOn(k).reduce((a, x) => a + x.mins, 0); return { app, lec, total:app + lec }; }
function dayLogs(k){ const dy = S.days[k]; if (!dy || !dy.boards) return []; return BOARDS.flatMap(b => ((dy.boards[b.k] || {}).log || []).map(x => ({ k, board:b.k, t:x[0], a:x[1], w:x[2], r:x[3], s:x[4], subj:x[5] || b.k }))); }
const logSubj = x => x.board === 'rev' ? 'rev' : x.subj;
function heat(m){ return m <= 0 ? 0 : m < 20 ? 1 : m < 40 ? 2 : m < 60 ? 3 : 4; }
function studyRange(){ const out = []; for (let k = STUDY.from; k <= STUDY.to; k = addDays(k, 1)) out.push(k); return out; }
function studySummary(){
  const ks = studyRange(), t = todayKey();
  const days = ks.filter(k => S.days[k] && Object.values(S.days[k].boards || {}).some(b => b && (b.done || b.secs > 30)));
  const mins = ks.reduce((a, k) => a + dayMins(k).total, 0), full = ks.filter(k => S.days[k] && S.days[k].done).length;
  const acc = {}; ['kor','math','eng','rev'].forEach(s => acc[s] = { c:0, n:0, m:0 });
  ks.forEach(k => { const dy = S.days[k]; if (!dy) return; Object.entries(dy.boards || {}).forEach(([s, b]) => { if (!acc[s] || !b) return; acc[s].m += b.secs || 0; if (b.done) { acc[s].c += b.correct; acc[s].n += b.n || (b.qs || []).length; } }); });
  const logs = ks.flatMap(dayLogs);
  const avail = ks.filter(k => k <= t && k >= (S.firstDay || ks[0])).length;
  return { ks, days:days.length, mins, full, acc, logs, avail };
}
function fmtMin(m){ return m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ''}` : `${m}분`; }
function calHTML(){
  const t = todayKey(), [fy, fm, fd] = STUDY.from.split('-').map(Number), start = addDays(STUDY.from, -new Date(fy, fm - 1, fd).getDay());
  const [ty, tm, td] = STUDY.to.split('-').map(Number), end = addDays(STUDY.to, 6 - new Date(ty, tm - 1, td).getDay());
  let cells = '';
  for (let k = start; k <= end; k = addDays(k, 1)) {
    const [, m, dd] = k.split('-').map(Number), inR = k >= STUDY.from && k <= STUDY.to, fut = k > t;
    const lab = dd === 1 || k === start ? `${m}/${dd}` : dd;
    if (!inR || fut) { cells += `<span class="sd out ${fut ? 'fut' : ''}"><span class="n">${lab}</span></span>`; continue; }
    const dm = dayMins(k), dy = S.days[k], lv = heat(dm.total), done = dy && dy.done, part = !done && dm.total > 0;
    cells += `<button class="sd h${lv} ${part ? 'part' : ''} ${k === STUDY.sel ? 'sel' : ''} ${k === t ? 'today' : ''}" data-a="studyset" data-day="${k}" aria-label="${m}월 ${dd}일 ${dm.total}분${done ? ' 다 함' : part ? ' 조금 함' : ''}"><span class="n">${lab}</span><b>${dm.total || ''}</b>${done ? '<span class="ck">✓</span>' : ''}</button>`;
  }
  return `<div class="scal">${DOW.map(x => `<span class="dow">${x}</span>`).join('')}${cells}</div>`;
}
function logRowHTML(x, showDate){
  const sj = logSubj(x), lab = x.board === 'rev' ? `복습 · ${SUBJ_NAME[x.subj] || ''}` : SUBJ_NAME[x.subj] || BNAME[x.board];
  const sub = showDate ? `<span class="lsub" style="color:${SUBJ_COLOR[sj] || 'inherit'}">${shortDate(x.k)} · ${lab}</span>` : x.board === 'rev' ? `<span class="lsub" style="color:${SUBJ_COLOR[x.subj] || 'inherit'}">${SUBJ_NAME[x.subj] || ''}</span>` : '';
  if (x.r === 1 && !showDate) return `<div class="lq ok"><span class="lr ok" title="한 번에 정답">✓</span><div class="lt">${sub}<span>${esc(x.t)} <span class="la">→ <b>${esc(x.a)}</b></span></span></div></div>`;
  const icon = x.r === 2 ? '<span class="lr re" title="두 번째에 정답">△</span>' : x.r === 1 ? '<span class="lr ok">✓</span>' : '<span class="lr no" title="틀림">✗</span>';
  return `<div class="lq ${x.r === 2 ? 're' : x.r === 1 ? 'ok' : 'no'}">${icon}<div class="lt">${sub}${esc(x.t)}
    <span class="la">정답 <b>${esc(x.a)}</b>${x.w ? ` · 재윤이 답 <s>${esc(x.w)}</s>` : ''}<span class="ls">${x.s}초</span></span></div></div>`;
}
function dayDetailHTML(k){
  const dy = S.days[k], dm = dayMins(k), [y, m, d] = k.split('-').map(Number), dt = new Date(y, m - 1, d);
  const head = `<h3>${m}월 ${d}일 ${DOW[dt.getDay()]}요일 <span class="muted" style="font-size:16px;font-weight:400">· ${fmtMin(dm.total)}${dm.lec ? ` (문제 ${dm.app}분 + 강의 ${dm.lec}분)` : ''}${dy && dy.done ? ' · 다 했어요 ✓' : ''}</span></h3>`;
  if (!dy || !Object.keys(dy.boards || {}).length) return `<div class="panel" id="dayDetail">${head}<p class="muted">이날은 공부 기록이 없어요.</p></div>`;
  const f = STUDY.subj, only = STUDY.only;
  const boards = BOARDS.filter(b => dy.boards[b.k] && (f === 'all' || f === b.k)).map(b => {
    const bo = dy.boards[b.k], n = bo.n || (bo.qs || []).length, res = bo.cur && bo.cur.result, l = bo.cur && bo.cur.lesson && lessonById(bo.cur.lesson);
    const uu = bo.cur && CURRS[bo.cur.subj] && CURRS[bo.cur.subj].units[bo.cur.unit];
    const what = bo.cur ? (bo.cur.test ? (uu ? `${unitTag(uu)} ${uu.name} · 단원 평가` : '단원 평가') : l ? `${unitTag(l.unit)} ${l.li + 1}차시 · ${l.title}` : '') : b.k === 'rev' ? '전에 틀린 문제 다시 풀기' : '';
    const logs = (bo.log || []).map(x => ({ k, board:b.k, t:x[0], a:x[1], w:x[2], r:x[3], s:x[4], subj:x[5] || b.k })).filter(x => !only || x.r !== 1);
    const firstN = (bo.log || []).filter(x => x[3] === 1).length;
    return `<div class="sboard"><div class="row" style="gap:8px;flex-wrap:wrap"><span class="sbadge ${b.cls}">${b.badge}</span><b style="font-size:18px">${b.name}</b>
        <span class="spacer"></span><span class="muted" style="font-size:14px">${bo.done ? `${bo.correct}/${n} 한 번에 · ` : `${bo.idx || 0}/${n} 푸는 중 · `}${Math.max(1, Math.round((bo.secs || 0) / 60))}분</span>
        ${res ? `<span class="pill ${res.pass ? 'ok' : 'wait'}">${res.test ? '평가 ' : ''}${res.pass ? '통과' : '다시'} ${Math.round(res.rate * 100)}%</span>` : ''}</div>
      ${what ? `<p class="muted" style="font-size:14px;margin:4px 0 0">${esc(what)}</p>` : ''}
      ${bo.log ? (logs.length ? `<div class="lqs">${logs.map(x => logRowHTML(x)).join('')}</div>` : `<p class="muted" style="font-size:14px">틀린 문제가 없어요! (${firstN}문제 모두 한 번에 정답)</p>`)
        : !(bo.idx || bo.done) ? `<p class="muted" style="font-size:14px">아직 푼 문제가 없어요.</p>` : k < '2026-10-22' ? `<p class="muted" style="font-size:14px">문제별 기록은 10월 22일부터 남아요. 이날은 점수만 있어요.</p>` : ''}</div>`;
  }).join('');
  const lecs = lecturesOn(k).filter(x => f === 'all' || f === x.s);
  const g = gradeOf(k), dd = dy.dict, showDict = dd && (f === 'all' || f === 'eng');
  const writes = Object.values(dy.writes || {});
  return `<div class="panel" id="dayDetail">${head}
    ${lecs.length ? `<div class="list">${lecs.map(x => `<div class="li"><span class="grow">📺 ${SUBJ_NAME[x.s]} ${x.info ? `${x.info.course.short2 || ''} ${x.info.no}강 · ${esc(x.info.desc)}` : x.n + '강'}</span><span class="pill ${x.mins >= 20 ? 'ok' : 'wait'}">${x.mins}분</span></div>`).join('')}</div>` : ''}
    ${boards || '<p class="muted">이 과목은 이날 공부하지 않았어요.</p>'}
    ${showDict ? `<div class="sboard"><div class="row"><b style="font-size:18px">📒 받아쓰기</b><span class="spacer"></span>${g.graded ? `<span class="pill ok">${g.score}/10점</span>` : dd.sent ? `<button class="btn small" data-a="gotograde">채점하러 가기</button>` : `<span class="pill no">${dd.idx >= dd.words.length ? '사진 안 보냄' : '하는 중'}</span>`}</div>
      <div class="dict-result">${dd.words.map((w, i) => `<span class="${g.graded ? (g.marks[i] ? 'ok' : 'no') : ''}">${g.graded ? (g.marks[i] ? '⭕ ' : '❌ ') : ''}${esc(w)}</span>`).join('')}</div></div>` : ''}
    ${writes.length && f === 'all' ? `<div class="sboard"><b style="font-size:18px">✏️ 직접 쓴 글</b>${writes.map(w => `<p style="margin:6px 0 2px">${esc(w.prompt)}</p>${w.img ? `<img src="${w.img}" alt="쓴 글" style="max-width:100%;border-radius:10px;border:2px solid var(--line)">` : '<p class="muted">다음에 쓰기로 했어요</p>'}`).join('')}</div>` : ''}
  </div>`;
}
VIEWS.study = (arg) => {
  if (!STUDY) { const [a, b] = studyPreset('month'); STUDY = { from:a, to:b, sel:todayKey(), subj:'all', only:false, preset:'month', wrongAll:false, psubj:'math', pres:'wrong', pmore:0 }; }
  if (arg && arg.sel) { STUDY.sel = arg.sel; if (STUDY.sel < STUDY.from || STUDY.sel > STUDY.to) { const [a, b] = studyPreset('month'); Object.assign(STUDY, { from:a, to:b, preset:'month' }); } }
  const sm = studySummary(), f = STUDY.subj;
  const presets = [['today','오늘'],['week','이번 주'],['lastweek','지난주'],['month','이번 달'],['lastmonth','지난달'],['30','최근 30일'],['all','처음부터']];
  const subjRows = [['kor','국어'],['math','수학'],['eng','영어'],['rev','복습']].map(([s, l]) => { const a = sm.acc[s], p = a.n ? Math.round(a.c / a.n * 100) : null;
    return `<div class="r tap" data-a="studyset" data-psubj="${s === 'rev' ? 'all' : s}" role="button"><span>${l}</span><span class="m"><i style="width:${p || 0}%;background:${SUBJ_COLOR[s]}"></i></span><span style="text-align:right">${p === null ? '-' : p + '%'}</span><span class="muted" style="text-align:right">${fmtMin(Math.round(a.m / 60))}</span></div>`; }).join('');
  const avgDay = sm.days ? Math.round(sm.mins / sm.days) : 0;
  app().innerHTML = `<section class="screen adult study">
    <div class="row"><button class="icon-btn" data-a="go" data-v="adult" aria-label="엄마 · 오빠 메뉴로">${ICON.back}</button><h2 style="flex:1">재윤이 공부 기록</h2></div>
    <div class="panel">
      <div class="chips">${presets.map(([v, l]) => `<button class="chip ${STUDY.preset === v ? 'on' : ''}" data-a="studyset" data-preset="${v}">${l}</button>`).join('')}</div>
      <div class="row date-row"><input type="date" id="sfrom" value="${STUDY.from}" max="${todayKey()}" aria-label="시작 날짜"><span>~</span><input type="date" id="sto" value="${STUDY.to}" max="${todayKey()}" aria-label="끝 날짜"><button class="btn small" data-a="studyset" data-range="1">보기</button></div>
      <div class="stat-row">
        <div class="stat"><b>${sm.days}<small>/${sm.avail}일</small></b><span>공부한 날</span></div>
        <div class="stat"><b>${fmtMin(sm.mins)}</b><span>총 공부 시간</span></div>
        <div class="stat"><b>${avgDay}분</b><span>하루 평균</span></div>
        <div class="stat"><b>${sm.full}일</b><span>다 끝낸 날</span></div>
      </div>
      <div class="subj-acc s4"><div class="r head"><span></span><span class="muted">한 번에 정답</span><span></span><span class="muted" style="text-align:right">시간</span></div>${subjRows}</div>
    </div>
    <div class="panel">
      <h3>공부 시간 달력 <span class="muted" style="font-size:15px;font-weight:400">(분)</span></h3>
      <p class="muted" style="font-size:14px;margin:-4px 0 8px">숫자는 그날 공부한 분이에요 (문제 + EBS 강의). 날짜를 누르면 그날 푼 문제가 나와요.</p>
      ${calHTML()}
      <div class="heat-legend"><span class="sw h0"></span>안 함<span class="sw h1"></span>~20<span class="sw h2"></span>~40<span class="sw h3"></span>~60<span class="sw h4"></span>60분+ <span class="lg-ck">✓ 다 함</span><span class="lg-part">점선 = 다 못 함</span></div>
    </div>
    <p class="muted" style="font-size:14px;margin:6px 2px -4px">고른 날짜에 푼 문제</p><div class="chips sticky-chips">${SUBJ_ALL.map(([v, l]) => `<button class="chip ${f === v ? 'on' : ''}" data-a="studyset" data-subj="${v}">${l}</button>`).join('')}<button class="chip ${STUDY.only ? 'on warn' : ''}" data-a="studyset" data-only="1">틀린 것만</button></div>
    ${dayDetailHTML(STUDY.sel)}
    ${subjProblemsPanel(sm)}
  </section>`;
};
function studySet(el){
  const ds = el.dataset;
  if (ds.preset) { const [a, b] = studyPreset(ds.preset); Object.assign(STUDY, { from:a, to:b, preset:ds.preset, wrongAll:false, pmore:0 }); if (STUDY.sel < a || STUDY.sel > b) STUDY.sel = b; }
  else if (ds.range) { let a = $('#sfrom').value, b = $('#sto').value; if (!a || !b) return; if (a > b) [a, b] = [b, a]; if (b > todayKey()) b = todayKey(); Object.assign(STUDY, { from:a, to:b, preset:'', wrongAll:false, pmore:0 }); if (STUDY.sel < a || STUDY.sel > b) STUDY.sel = b; }
  else if (ds.day) { STUDY.sel = ds.day; const y = scrollY; VIEWS.study(); scrollTo(0, y); const el2 = $('#dayDetail'); if (el2) el2.scrollIntoView({ behavior:'smooth', block:'start' }); return; }
  else if (ds.subj) STUDY.subj = ds.subj;
  else if (ds.only) STUDY.only = !STUDY.only;
  else if (ds.wrongall) STUDY.wrongAll = true;
  else if (ds.psubj) { STUDY.psubj = ds.psubj; STUDY.pmore = 0; if (el.classList.contains('tap')) { const y0 = scrollY; VIEWS.study(); scrollTo(0, y0); const pp = $('#subjProblems'); if (pp) pp.scrollIntoView({ behavior:'smooth', block:'start' }); return; } }
  else if (ds.pres) { STUDY.pres = ds.pres; STUDY.pmore = 0; }
  else if (ds.pmore) STUDY.pmore++;
  const y = scrollY; VIEWS.study(); scrollTo(0, y);
}
ACT.gotograde = () => { S.adultTab = 'mom'; go('adult'); setTimeout(() => { const p = $('#gradePanel'); if (p) p.scrollIntoView({ behavior:'smooth', block:'start' }); }, 60); };

/* ---------- 과목별 맞은 문제 · 틀린 문제 (기간 전체) ---------- */
/* 복습 판에서 푼 문제도 원래 과목으로 센다. 받아쓰기는 엄마가 채점한 것만 */
function dictLogs(k){
  const dy = S.days[k], g = gradeOf(k); if (!dy || !dy.dict || !g.graded) return [];
  return dy.dict.words.map((w, i) => ({ k, board:'eng', t:`받아쓰기 '${w}'`, a:w, w:'', r:g.marks[i] ? 1 : 0, s:0, subj:'dict' }));
}
function subjProblemsPanel(sm){
  const all = [...sm.logs, ...sm.ks.flatMap(dictLogs)];
  const tabs = [['kor','국어'],['math','수학'],['eng','영어'],['dict','받아쓰기'],['all','전체']];
  const cnt = s => { const xs = s === 'all' ? all : all.filter(x => x.subj === s); return { ok:xs.filter(x => x.r === 1).length, no:xs.filter(x => x.r !== 1).length, xs }; };
  const ps = STUDY.psubj, cur = cnt(ps), pres = STUDY.pres;
  const list = (pres === 'wrong' ? cur.xs.filter(x => x.r !== 1) : pres === 'right' ? cur.xs.filter(x => x.r === 1) : cur.xs).slice().reverse();
  const shown = list.slice(0, 40 * (STUDY.pmore + 1));
  // 날짜별로 묶기
  let html = '', last = '';
  shown.forEach(x => { if (x.k !== last) { last = x.k; const [y, m, d] = x.k.split('-').map(Number); html += `<div class="pdate">${m}월 ${d}일 ${DOW[new Date(y, m - 1, d).getDay()]}</div>`; } html += probRowHTML(x); });
  const nm = { kor:'국어', math:'수학', eng:'영어', dict:'받아쓰기', all:'전체' }[ps];
  const rate = cur.ok + cur.no ? Math.round(cur.ok / (cur.ok + cur.no) * 100) : null;
  return `<div class="panel" id="subjProblems"><h3>과목별 맞은 문제 · 틀린 문제</h3>
    <div class="ptabs">${tabs.map(([v, l]) => { const c = cnt(v); return `<button class="ptab ${ps === v ? 'on' : ''}" data-a="studyset" data-psubj="${v}"><b>${l}</b><span><i class="ok">⭕ ${c.ok}</i> <i class="no">❌ ${c.no}</i></span></button>`; }).join('')}</div>
    <div class="row" style="gap:8px;flex-wrap:wrap;margin:10px 0 4px">
      ${[['wrong',`틀린 문제 ${cur.no}`],['right',`맞은 문제 ${cur.ok}`],['all',`전부 ${cur.ok + cur.no}`]].map(([v, l]) => `<button class="chip ${pres === v ? 'on' : ''} ${v === 'wrong' && pres === v ? 'warn' : ''}" data-a="studyset" data-pres="${v}">${l}</button>`).join('')}
      <span class="spacer"></span>${rate === null ? '' : `<span class="muted" style="font-size:14px">${nm} 한 번에 맞힘 <b style="color:var(--ink)">${rate}%</b></span>`}</div>
    <p class="muted" style="font-size:13px;margin:0 0 6px">⭕ 한 번에 맞힘 · ❌ 틀림 (△ 힌트 보고 두 번째에 맞힌 것 포함). 복습 판에서 푼 문제도 원래 과목에 들어가요. 받아쓰기는 채점한 것만.</p>
    ${shown.length ? `<div class="lqs">${html}</div>${list.length > shown.length ? `<button class="btn ghost small" data-a="studyset" data-pmore="1" style="margin-top:8px">${list.length - shown.length}개 더 보기</button>` : ''}`
      : `<p class="muted">${pres === 'wrong' ? '이 기간에 틀린 문제가 없어요!' : '이 기간에 기록이 없어요.'}</p>`}
  </div>`;
}
function probRowHTML(x){
  const icon = x.r === 1 ? '<span class="lr ok">⭕</span>' : x.r === 2 ? '<span class="lr re" title="두 번째에 맞힘">△</span>' : '<span class="lr no">❌</span>';
  const tag = x.board === 'rev' ? '<span class="ptag">복습</span>' : '';
  return `<div class="lq ${x.r === 1 ? 'okb' : x.r === 2 ? 're' : 'no'}">${icon}<div class="lt"><span>${tag}${esc(x.t)}</span>
    <span class="la">정답 <b>${esc(x.a)}</b>${x.w ? ` · 재윤이 답 <s>${esc(x.w)}</s>` : ''}${x.r === 2 ? ' · 힌트 보고 두 번째에 맞힘' : ''}</span></div></div>`;
}
