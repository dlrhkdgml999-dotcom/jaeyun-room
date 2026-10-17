/* ===================== 진도 화면 (수학 · 국어 · 영어) + EBS 강의 ===================== */
const SUBJS = ['math','kor','eng'];
/* 카드 말하기: 글자 하나면 그대로, [글, 언어] 목록이면 차례로 */
async function sayParts(say){
  if (!Array.isArray(say)) return speak(say);
  const my = ++SEQ;
  for (const [t, lang] of say) { if (my !== SEQ) return; await speak(t, lang); }
}

/* 판 시작 화면에 붙는 차시 안내 */
function lessonIntroHTML(b){
  const s = b.cur.subj || 'math', C = CURRS[s], c = curr(s);
  if (b.cur.test) {
    const u = C.units[b.cur.unit];
    const rv = u.rev && ebsOn(s) && !c.seen[u.rev] ? lectInfo(s, u.rev) : null;
    return `<div class="lesson-card"><span class="eyebrow">${SUBJ_NAME[s]} ${u.n}단원 ${esc(u.name)}</span><span class="disp" style="font-size:24px">단원 평가 도전!</span><span class="muted">12문제 중 10문제를 한 번에 맞히면 메달을 받아요 🏅</span>
      ${rv ? `<button class="btn ghost small" data-a="lecopt" data-v="${s}|${u.rev}">📺 (골라 보기) EBS ${rv.no}강 단원 정리</button>` : ''}</div>`;
  }
  const l = lessonById(b.cur.lesson);
  const lec = b.cur.lec ? lectInfo(s, b.cur.lec) : null, seenLec = lec && c.seen[b.cur.lec];
  const again = (l.ebs || []).find(n => c.seen[n]);
  return `<div class="lesson-card"><span class="eyebrow">${SUBJ_NAME[s]} ${l.unit.n}단원 ${esc(l.unit.name)} · ${l.li + 1}차시</span><span class="disp" style="font-size:24px">${esc(l.title)}</span>
    ${lec && !seenLec ? `<div class="lec-box"><span class="lec-no">${lec.no}강</span><span style="flex:1;text-align:left"><b class="disp" style="font-size:19px;font-weight:400">오늘의 강의 · EBS ${esc(C.ebs.name)}</b><br><span class="muted" style="font-size:15px">${esc(lec.desc)} · ${lec.mins}분</span></span></div>
      <span class="muted" style="font-size:15px">강의를 보고 → 개념 정리 → 문제를 풀어요</span>`
    : `<span class="muted" style="font-size:15px">개념 카드를 보고 → 문제를 풀어요</span>
      ${again ? `<button class="btn ghost small" data-a="lecopt" data-v="${s}|${again}">📺 ${lectInfo(s, again).no}강 다시 보기 (골라 보기)</button>` : ''}`}
  </div>`;
}
function waitLecHTML(k){
  return `<div class="lesson-card"><span class="disp" style="font-size:21px">오늘 ${SUBJ_NAME[k]}는 복습하는 날!</span><span class="muted" style="font-size:15px">새 강의는 하루에 하나만 봐요. ${SUBJ_NAME[k]} 새 강의는 다음 날에 봐요 📺</span></div>`;
}
function lessonResultHTML(r0){
  const s = r0.subj || 'math', C = CURRS[s];
  const r = Object.assign({}, r0, { unit:C.units[r0.unitIdx], lesson:r0.lessonId ? lessonById(r0.lessonId) : null });
  if (r.test) return r.pass
    ? `<div class="lesson-card won"><span style="font-size:54px">🏅</span><span class="disp" style="font-size:24px">${SUBJ_NAME[s]} ${r.unit.n}단원 "${esc(r.unit.name)}" 통과!</span><span>${Math.round(r.rate * 100)}점! 다음 단원으로 가자!</span></div>`
    : `<div class="lesson-card"><span class="disp" style="font-size:22px">${Math.round(r.rate * 100)}점! 아깝다</span><span>내일 한 번 더 도전하면 메달을 받을 수 있어!</span></div>`;
  const next = currentLesson(s), c = curr(s);
  if (r.pass && next && next.id === r.lesson.id && !c.test) return `<div class="lesson-card won"><span class="disp" style="font-size:22px">잘했어! "${esc(r.lesson.title)}"</span><span class="muted">내일 한 번 더 연습하면 다음 차시로 가요</span></div>`;
  return r.pass
    ? `<div class="lesson-card won"><span class="disp" style="font-size:22px">${r.lesson.li + 1}차시 "${esc(r.lesson.title)}" 통과!</span><span class="muted">다음 시간: ${c.test ? `${r.unit.n}단원 평가` : next ? esc(next.title) : '다음 단원'}</span></div>`
    : `<div class="lesson-card"><span class="disp" style="font-size:22px">조금 어려웠지?</span><span>"${esc(r.lesson.title)}"는 내일 한 번 더 연습하자!</span></div>`;
}

/* 개념 카드 */
let CARDS = null;
VIEWS.cards = (o) => {
  if (o) CARDS = Object.assign({ i:0 }, o);
  const l = lessonById(CARDS.lesson), cards = l.cards, i = CARDS.i, cd = cards[i], last = i === cards.length - 1;
  app().innerHTML = `<section class="screen cards-screen">
    <div class="row"><button class="icon-btn" data-a="${CARDS.fromBoard ? 'home' : 'go'}" data-v="map" data-s="${l.subj}" aria-label="나가기">${ICON.close}</button>
      <span class="eyebrow" style="flex:1">${SUBJ_NAME[l.subj]} ${l.unit.n}단원 · ${l.li + 1}차시 개념</span><span class="disp" style="font-size:18px">${i + 1}/${cards.length}</span></div>
    <h2>${esc(l.title)}</h2>
    <div class="concept">
      <div class="concept-ill">${cd.ill()}</div>
      <div class="concept-text"><p>${esc(cd.text)}</p><button class="speak-btn" data-a="cardsay" aria-label="다시 듣기">${ICON.speak}</button></div>
    </div>
    <div class="dots">${cards.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="row" style="gap:12px">
      ${i > 0 ? `<button class="btn ghost" data-a="cardmove" data-v="-1" style="flex:1">이전</button>` : ''}
      ${last ? `<button class="btn big" data-a="cardsdone" style="flex:2">${CARDS.fromBoard ? '문제 풀러 가기!' : '다 봤어요'}</button>` : `<button class="btn big" data-a="cardmove" data-v="1" style="flex:2">다음</button>`}
    </div>
  </section>`;
  sayParts(cd.say);
};

/* 진도 지도 (과목 탭) */
let MAP_S = 'math';
VIEWS.map = (o) => {
  if (o && o.s) MAP_S = o.s;
  const on = SUBJS.filter(currOn); if (!on.includes(MAP_S)) MAP_S = on[0] || 'math';
  const s = MAP_S, C = CURRS[s], c = curr(s);
  const medal = ui => c.medals.some(m => m.unit === ui);
  app().innerHTML = `<section class="screen">
    <div class="row"><button class="icon-btn" data-a="home" aria-label="처음으로">${ICON.back}</button><h2 style="flex:1">진도 지도</h2><span class="sticker-chip">🏅 ${SUBJS.reduce((n, x) => n + curr(x).medals.length, 0)}</span></div>
    <div class="seg">${on.map(x => `<button class="${x === s ? 'on' : ''}" data-a="go" data-v="map" data-s="${x}">${SUBJ_NAME[x]}</button>`).join('')}</div>
    <div class="bubble" style="display:flex;gap:10px;align-items:center">${bunnySVG({ size:56, expr:'happy' })}<span>${C.units[c.unit] ? `${SUBJ_NAME[s]}는 지금 ${esc(currLabel(s))}! 재윤이 진짜 잘하고 있어!` : `${esc(josa(C.title, '을', '를'))} 다 끝냈어! 최고야!`}</span></div>
    ${C.units.map((u, ui) => {
      const state = ui < c.unit ? 'past' : ui === c.unit ? 'now' : 'next';
      return `<div class="unit-card ${state}">
        <div class="row"><span class="unit-no">${u.n}</span><span class="disp" style="font-size:21px;flex:1">${esc(u.name)}</span>${medal(ui) ? '<span style="font-size:30px">🏅</span>' : state === 'next' ? `<span class="muted">${ICON.lock.replace('<svg', '<svg style="width:20px;height:20px"')}</span>` : ''}</div>
        <div class="lesson-dots">${u.lessons.map((l, li) => {
          const d = c.done[l.id], cur = ui === c.unit && li === c.lesson && !c.test, ok = d && d.pass;
          const can = ui < c.unit || (ui === c.unit && (li <= c.lesson || c.test));
          return `<button class="ldot ${ok ? 'ok' : ''} ${cur ? 'cur' : ''}" ${can ? `data-a="go" data-v="cards" data-lesson="${l.id}"` : 'disabled'} title="${esc(l.title)}">${li + 1}</button>`; }).join('')}
          <span class="ldot test ${medal(ui) ? 'ok' : ''} ${ui === c.unit && c.test ? 'cur' : ''}">평가</span></div>
        ${state === 'now' && !c.test ? `<span class="muted" style="font-size:15px">지금: ${esc(u.lessons[c.lesson].title)}</span>` : ''}
      </div>`; }).join('')}
  </section>`;
};

/* 엄마 메뉴: 과목별 진도 */
function currPanel(s){
  const C = CURRS[s], c = curr(s), on = currOn(s);
  const opts = C.units.flatMap((u, ui) => [...u.lessons.map((l, li) => `<option value="${ui}|${li}|0" ${c.unit === ui && c.lesson === li && !c.test ? 'selected' : ''}>${u.n}단원 ${li + 1}차시 · ${esc(l.title)}</option>`), `<option value="${ui}|0|1" ${c.unit === ui && c.test ? 'selected' : ''}>${u.n}단원 평가</option>`]).join('');
  const recent = Object.entries(c.done).sort((a, b) => b[1].date.localeCompare(a[1].date)).slice(0, 4);
  const seen = Object.entries(c.seen || {}).sort((a, b) => b[1].d.localeCompare(a[1].d)).slice(0, 4);
  const modeText = { math:['단원 진도 (초2 1학기 선행 + 초1 2학기 복습 30%)','자유 연습 (아래 난이도대로 섞어서)'], kor:['단원 진도 (초2 1학기 국어 + 맞춤법·낱말 복습 30%)','자유 연습 (아래 난이도대로 섞어서)'], eng:['단계 진도 (알파벳 → 파닉스 → 문장)','자유 연습 (아래 난이도대로 섞어서)'] }[s];
  return `<div class="panel"><h3>${SUBJ_NAME[s]} 진도 · ${esc(C.title)}</h3>
    <div class="field"><label for="mode-${s}">${SUBJ_NAME[s]} 방식</label><select id="mode-${s}" data-ch="cmode" data-v="${s}"><option value="curr" ${on ? 'selected' : ''}>${modeText[0]}</option><option value="free" ${on ? '' : 'selected'}>${modeText[1]}</option></select></div>
    ${on ? `
    <p><b>${esc(currLabel(s))}</b> · 메달 ${c.medals.length}개</p>
    ${s === 'math' ? `<div class="field"><label for="pace">진도 속도 (세 과목 같이)</label><select id="pace" data-ch="pace"><option value="normal" ${S.pace !== 'slow' ? 'selected' : ''}>보통: 차시를 통과하면 다음 날 다음 차시</option><option value="slow" ${S.pace === 'slow' ? 'selected' : ''}>천천히: 한 차시를 이틀 통과해야 다음 차시</option></select></div>` : ''}
    <div class="field"><label for="cjump-${s}">진도 옮기기</label><select id="cjump-${s}" data-ch="cjump" data-v="${s}">${opts}</select></div>
    ${recent.length ? `<div class="list">${recent.map(([id, d]) => { const l = lessonById(id); return `<div class="li"><span class="grow">${l.unit.n}단원 ${l.li + 1}차시 · ${esc(l.title)}</span><span class="pill ${d.pass ? 'ok' : 'wait'}">${d.rate}%${d.tries > 1 ? ` · ${d.tries}번째` : ''}</span></div>`; }).join('')}</div>` : ''}
    ${C.ebs ? `<div class="row"><span style="flex:1">EBS 강의 함께 보기<br><span class="muted" style="font-size:13px">${esc(C.ebs.name)} · ${esc(C.ebs.teacher)} (무료)</span></span><button class="switch ${ebsOn(s) ? 'on' : ''}" data-a="ebstoggle" data-v="${s}" aria-label="EBS 강의"></button></div>
      ${seen.length ? `<div class="list">${seen.map(([n, v]) => `<div class="li"><span class="grow">📺 ${lectInfo(s, +n).no}강 · ${esc(lectInfo(s, +n).desc)}</span><span class="pill ${v.mins >= 20 ? 'ok' : 'wait'}">${shortDate(v.d)}${v.mins ? ` · ${v.mins}분` : ''}</span></div>`).join('')}</div>` : ''}
      <a class="btn ghost small" href="${ebsCourseUrl(s)}" target="_blank" rel="noopener">EBS ${esc(C.ebs.name)} 강좌 열기</a>` : ''}` : ''}
  </div>`;
}
function currHelpPanel(){
  return `<div class="panel"><h3>EBS 강의는 이렇게 봐요</h3>
    <p style="font-size:15px;line-height:1.6">• 강의는 <b>하루에 한 편</b>만 봐요. 수학 강의 날과 국어 강의 날이 번갈아 와요. 강의 날에는 교재를 강의와 함께 풀기 때문에 그 과목 앱 문제는 5개, 다른 과목과 복습도 절반 정도로 줄여서 하루 1시간 안팎이 되게 해요.<br>
    • 강의 한 편이 차시 두 개를 다룰 때가 많아서, 다음 날은 강의 없이 바로 문제를 풀어요.<br>
    • 강의를 보려면 <b>EBS 초등 회원 로그인</b>이 필요할 수 있어요. 태블릿 크롬에서 엄마 계정으로 한 번 로그인해 두세요.<br>
    • 강의는 교재를 펴 놓고 같이 풀어요. 「EBS 만점왕 수학 2-1」「만점왕 국어 2-1」(2026) 교재가 있으면 좋아요. 없어도 볼 수 있어요.<br>
    • 재윤이가 "다 봤어요"를 누르면 몇 분 동안 봤는지 여기에 남아요. 20분이 안 되면 노란색으로 보여요.</p></div>`;
}
function mapTileHTML(){
  const on = SUBJS.filter(currOn); if (!on.length) return '';
  const row = s => { const C = CURRS[s], c = curr(s), u = C.units[c.unit];
    const dots = u ? u.lessons.map((l, li) => `<i class="${(c.done[l.id] || {}).pass ? 'ok' : li === c.lesson && !c.test ? 'cur' : ''}"></i>`).join('') + `<i class="t ${c.test ? 'cur' : ''}"></i>` : '';
    return `<span class="map-row"><b>${SUBJ_NAME[s]}</b><span class="muted">${u ? `${u.n}단원 · ${c.test ? '평가' : `${c.lesson + 1}차시`}` : '끝!'}</span><span class="mini-dots">${dots}</span></span>`; };
  const medals = SUBJS.reduce((n, x) => n + curr(x).medals.length, 0);
  return `<button class="map-tile" data-a="go" data-v="map"><span style="font-size:30px">🗺️</span><span style="flex:1;display:grid;gap:5px;text-align:left"><span class="disp" style="font-size:18px">진도 지도</span>${on.map(row).join('')}</span><span class="sticker-chip">🏅 ${medals}</span></button>`;
}

/* ===================== EBS 강의 보기 ===================== */
let LECW = null;   // { s, n, at, opt }
function lectureGuardHTML(s, n){
  const li = lectInfo(s, n), C = CURRS[s];
  return `${distanceArt()}<p class="disp" style="font-size:21px;line-height:1.4">강의 보기 전에! 태블릿을 팔 길이만큼 떨어뜨려 놓고, 허리 펴고 바르게 앉아서 봐요.</p>
    <div class="lec-box" style="align-self:stretch"><span class="lec-no">${li.no}강</span><span style="flex:1;text-align:left"><b>EBS ${esc(C.ebs.name)}</b><br><span style="font-size:15px">${esc(li.title)} · ${esc(li.desc)}</span></span></div>
    <ol class="eye-list" style="list-style:decimal;padding-left:22px"><li>EBS 화면이 열리면 아래로 내려서 <b>강의목록</b>을 찾아요</li><li><b>${li.no}강</b> 옆의 주황색 ▶ 를 눌러요</li><li>다 보면 이 화면으로 돌아와서 "다 봤어요!"</li></ol>
    <p class="muted" style="font-size:14px">📘 교재가 있으면 Book${li.book} ${li.pages}쪽을 펴 놓아요</p>
    <a class="btn big" href="${ebsCourseUrl(s)}" target="_blank" rel="noopener" data-close data-lecgo="1">알겠어! 보러 갈게</a>`;
}
function openLecture(s, n, opt){
  eyeOverlay(lectureGuardHTML(s, n), o => {
    const a = o.querySelector('[data-lecgo]');
    a.addEventListener('click', () => { LECW = { s, n, at:Date.now(), opt:!!opt }; try { sessionStorage.setItem('lecw', JSON.stringify(LECW)); } catch (e) {} setTimeout(() => go('lecwait'), 50); });
  });
  speak(`강의 보기 전에! 태블릿을 팔 길이만큼 떨어뜨려 놓고, 바르게 앉아서 봐요. ${lectInfo(s, n).no}강이에요.`);
}
VIEWS.lecwait = () => {
  if (!LECW) { try { LECW = JSON.parse(sessionStorage.getItem('lecw') || 'null'); } catch (e) {} }
  if (!LECW) return go('home');
  const li = lectInfo(LECW.s, LECW.n), mins = Math.floor((Date.now() - LECW.at) / 60000);
  app().innerHTML = `<section class="screen" style="justify-content:center;align-items:center;text-align:center">
    <span style="font-size:64px">📺</span>
    <h1>${li.no}강 보는 중</h1>
    <p class="muted">${esc(CURRS[LECW.s].ebs.name)} · ${esc(li.desc)} · ${li.mins}분</p>
    ${stageHTML(150, { expr:'happy', size:110 })}
    <div class="bubble">강의를 끝까지 다 보고 나서 눌러 줘!${mins >= 1 ? `<br><span class="muted" style="font-size:15px">지금까지 ${mins}분</span>` : ''}</div>
    <button class="btn big mint" data-a="lecdone">다 봤어요!</button>
    <a class="btn ghost small" href="${ebsCourseUrl(LECW.s)}" target="_blank" rel="noopener">강의 화면 다시 열기</a>
    <button class="grown-up" data-a="lecfail">강의가 안 열려요</button>
  </section>`;
};
document.addEventListener('visibilitychange', () => { if (!document.hidden && SCREEN === 'lecwait') go('lecwait'); });
function afterLecture(opt){
  const b = RUN && RUN.b;
  const next = !b || b.done ? 'home' : opt ? 'intro' : b.cur && !b.cur.test && b.idx === 0 ? 'lesson' : 'intro';
  if (S.eyeBreak === false) return next === 'lesson' ? go('cards', { lesson:b.cur.lesson, fromBoard:true }) : next === 'intro' ? go('intro', RUN.k) : go('home');
  go('eyebreak', next);
}

/* ===================== 눈 건강 ===================== */
function eyeOverlay(html, onShow){
  const o = document.createElement('div'); o.className = 'overlay eye-overlay'; o.innerHTML = `<div class="eye-card">${html}</div>`;
  o.addEventListener('click', e => { if (e.target === o || e.target.closest('[data-close]')) o.remove(); });
  document.body.appendChild(o); if (onShow) onShow(o); return o;
}
function distanceArt(){
  return `<svg viewBox="0 0 300 130" width="300" style="max-width:100%;height:auto" aria-hidden="true">
    <rect x="200" y="20" width="70" height="96" rx="10" fill="#fff" stroke="${INK}" stroke-width="4"/><rect x="208" y="30" width="54" height="74" rx="4" fill="#E3F2FF"/>
    <g transform="translate(6 4) scale(.48)">${bunnySVG({ size:200, expr:'happy', eq:{} }).replace(/<svg[^>]*>/, '').replace('</svg>', '')}</g>
    <line x1="116" y1="112" x2="196" y2="112" stroke="${C.pinkD}" stroke-width="4" stroke-dasharray="6 5"/><path d="M112 104 L104 112 L112 120 M196 104 L204 112 L196 120" fill="none" stroke="${C.pinkD}" stroke-width="4" stroke-linecap="round"/>
    <text x="156" y="100" text-anchor="middle" font-family="Jua, sans-serif" font-size="15" fill="${INK}">팔 길이만큼!</text></svg>`;
}
/* 판 사이 · 강의 뒤 눈 쉬는 시간 (20초 동안 먼 곳 보기) */
VIEWS.eyebreak = (next) => {
  const secs = 20;
  app().innerHTML = `<section class="screen reward">
    <h1>눈 쉬는 시간</h1>
    <div class="eye-timer"><svg viewBox="0 0 120 120" width="180" height="180"><circle cx="60" cy="60" r="52" fill="#fff" stroke="${C.line}" stroke-width="10"/><circle id="eyering" cx="60" cy="60" r="52" fill="none" stroke="${C.mint}" stroke-width="10" stroke-linecap="round" stroke-dasharray="327" stroke-dashoffset="0" transform="rotate(-90 60 60)"/></svg><span class="disp" id="eyesec">${secs}</span></div>
    <p class="disp" style="font-size:24px;line-height:1.4">창밖이나 방 끝, 먼 곳을 바라보며<br>눈을 천천히 깜빡깜빡!</p>
    <button class="btn big mint" id="eyedone" data-a="eyedone" data-v="${next || 'home'}" disabled>${secs}초만 쉬어요</button>
  </section>`;
  speak('잠깐! 눈 쉬는 시간이야. 창밖 먼 곳을 바라보면서 눈을 깜빡깜빡 해 봐.');
  let left = secs; const ring = $('#eyering');
  clearInterval(window.__eyeT); window.__eyeT = setInterval(() => {
    if (SCREEN !== 'eyebreak') return clearInterval(window.__eyeT);
    left--; const el = $('#eyesec'); if (el) el.textContent = Math.max(0, left);
    if (ring) ring.setAttribute('stroke-dashoffset', String(327 * (1 - left / secs)));
    if (left <= 0) { clearInterval(window.__eyeT); const b = $('#eyedone'); if (b) { b.disabled = false; b.textContent = '다 쉬었어요!'; } tone([[880,0,.12],[1175,.12,.2]]); speak('잘 쉬었어! 이제 다음 공부 하러 가자!'); }
  }, 1000);
};
