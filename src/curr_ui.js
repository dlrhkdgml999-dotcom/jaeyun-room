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
    return `<div class="lesson-card"><span class="eyebrow">${SUBJ_NAME[s]} ${unitTag(u)} ${esc(u.name)}</span><span class="disp" style="font-size:24px">단원 평가 도전!</span><span class="muted">12문제 중 10문제를 한 번에 맞히면 메달을 받아요 🏅</span>
      ${rv ? `<button class="btn ghost small" data-a="lecopt" data-v="${s}|${u.rev}">📺 (골라 보기) EBS ${rv.no}강 ${esc(rv.desc)}</button>` : ''}</div>`;
  }
  const l = lessonById(b.cur.lesson);
  const lec = b.cur.lec ? lectInfo(s, b.cur.lec) : null, seenLec = lec && c.seen[b.cur.lec];
  const again = (l.ebs || []).find(n => c.seen[n]);
  return `<div class="lesson-card"><span class="eyebrow">${SUBJ_NAME[s]} ${unitTag(l.unit)} ${esc(l.unit.name)} · ${l.li + 1}차시</span><span class="disp" style="font-size:24px">${esc(l.title)}</span>
    ${lec && !seenLec ? `<div class="lec-box"><span class="lec-no">${lec.no}강</span><span style="flex:1;text-align:left"><b class="disp" style="font-size:19px;font-weight:400">오늘의 강의 · EBS ${esc(lec.name)}</b><br><span class="muted" style="font-size:15px">${esc(lec.desc)} · ${lec.mins}분</span></span></div>
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
    ? `<div class="lesson-card won"><span style="font-size:54px">🏅</span><span class="disp" style="font-size:24px">${SUBJ_NAME[s]} ${unitTag(r.unit)} "${esc(r.unit.name)}" 통과!</span><span>${Math.round(r.rate * 100)}점! 다음 단원으로 가자!</span></div>`
    : `<div class="lesson-card"><span class="disp" style="font-size:22px">${Math.round(r.rate * 100)}점! 아깝다</span><span>내일 한 번 더 도전하면 메달을 받을 수 있어!</span></div>`;
  const next = currentLesson(s), c = curr(s);
  if (r.pass && next && next.id === r.lesson.id && !c.test) return `<div class="lesson-card won"><span class="disp" style="font-size:22px">잘했어! "${esc(r.lesson.title)}"</span><span class="muted">내일 한 번 더 연습하면 다음 차시로 가요</span></div>`;
  return r.pass
    ? `<div class="lesson-card won"><span class="disp" style="font-size:22px">${r.lesson.li + 1}차시 "${esc(r.lesson.title)}" 통과!</span><span class="muted">다음 시간: ${c.test ? `${unitTag(r.unit)} 평가` : next ? esc(next.title) : '다음 단원'}</span></div>`
    : `<div class="lesson-card"><span class="disp" style="font-size:22px">조금 어려웠지?</span><span>"${esc(r.lesson.title)}"는 내일 한 번 더 연습하자!</span></div>`;
}

/* 개념 카드 */
let CARDS = null;
VIEWS.cards = (o) => {
  if (o) CARDS = Object.assign({ i:0 }, o);
  const l = lessonById(CARDS.lesson), cards = l.cards, i = CARDS.i, cd = cards[i], last = i === cards.length - 1;
  app().innerHTML = `<section class="screen cards-screen">
    <div class="row"><button class="icon-btn" data-a="${CARDS.fromBoard ? 'home' : 'go'}" data-v="map" data-s="${l.subj}" aria-label="나가기">${ICON.close}</button>
      <span class="eyebrow" style="flex:1">${SUBJ_NAME[l.subj]} ${unitTag(l.unit)} · ${l.li + 1}차시 개념</span><span class="disp" style="font-size:18px">${i + 1}/${cards.length}</span></div>
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
      const head = C.courses.length > 1 && (ui === 0 || C.units[ui - 1].course !== u.course) ? `<h3 class="disp course-head">${esc(u.course.grade)}${u.course.ebs ? ` · ${esc(u.course.ebs.name)}` : ''}</h3>` : '';
      const state = ui < c.unit ? 'past' : ui === c.unit ? 'now' : 'next';
      return `${head}<div class="unit-card ${state}">
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
  const opts = C.units.flatMap((u, ui) => [...u.lessons.map((l, li) => `<option value="${ui}|${li}|0" ${c.unit === ui && c.lesson === li && !c.test ? 'selected' : ''}>${unitTag(u)} ${li + 1}차시 · ${esc(l.title)}</option>`), `<option value="${ui}|0|1" ${c.unit === ui && c.test ? 'selected' : ''}>${unitTag(u)} 평가</option>`]).join('');
  const recent = Object.entries(c.done).sort((a, b) => b[1].date.localeCompare(a[1].date)).slice(0, 4);
  const seen = Object.entries(c.seen || {}).sort((a, b) => b[1].d.localeCompare(a[1].d)).slice(0, 4);
  const modeText = { math:['단원 진도 (1학년 2학기 → 2학년 1학기 + 지난 학기 복습 30%)','자유 연습 (아래 난이도대로 섞어서)'], kor:['단원 진도 (1학년 2학기 → 2학년 1학기 + 낱말·맞춤법 복습 30%)','자유 연습 (아래 난이도대로 섞어서)'], eng:['단계 진도 (1단계 파닉스 → 2단계 생활 영어)','자유 연습 (아래 난이도대로 섞어서)'] }[s];
  return `<div class="panel"><h3>${SUBJ_NAME[s]} 진도 · ${esc(C.title)}</h3>
    <div class="field"><label for="mode-${s}">${SUBJ_NAME[s]} 방식</label><select id="mode-${s}" data-ch="cmode" data-v="${s}"><option value="curr" ${on ? 'selected' : ''}>${modeText[0]}</option><option value="free" ${on ? '' : 'selected'}>${modeText[1]}</option></select></div>
    ${on ? `
    <p><b>${esc(currLabel(s))}</b> · 메달 ${c.medals.length}개</p>
    ${s === 'math' ? `<div class="field"><label for="pace">진도 속도 (세 과목 같이)</label><select id="pace" data-ch="pace"><option value="normal" ${S.pace !== 'slow' ? 'selected' : ''}>보통: 차시를 통과하면 다음 날 다음 차시</option><option value="slow" ${S.pace === 'slow' ? 'selected' : ''}>천천히: 한 차시를 이틀 통과해야 다음 차시</option></select></div>` : ''}
    <div class="field"><label for="cjump-${s}">진도 옮기기</label><select id="cjump-${s}" data-ch="cjump" data-v="${s}">${opts}</select></div>
    ${recent.length ? `<div class="list">${recent.map(([id, d]) => { const l = lessonById(id); return `<div class="li"><span class="grow">${unitTag(l.unit)} ${l.li + 1}차시 · ${esc(l.title)}</span><span class="pill ${d.pass ? 'ok' : 'wait'}">${d.rate}%${d.tries > 1 ? ` · ${d.tries}번째` : ''}</span></div>`; }).join('')}</div>` : ''}
    ${C.ebs ? `<div class="row"><span style="flex:1">EBS 강의 함께 보기<br><span class="muted" style="font-size:13px">${esc(C.ebs.name)} · ${esc(C.ebs.teacher)} (무료)</span></span><button class="switch ${ebsOn(s) ? 'on' : ''}" data-a="ebstoggle" data-v="${s}" aria-label="EBS 강의"></button></div>
      ${seen.length ? `<div class="list">${seen.map(([n, v]) => `<div class="li"><span class="grow">📺 ${lectInfo(s, +n).course.short2 || ''} ${lectInfo(s, +n).no}강 · ${esc(lectInfo(s, +n).desc)}</span><span class="pill ${v.mins >= 20 ? 'ok' : 'wait'}">${shortDate(v.d)}${v.mins ? ` · ${v.mins}분` : ''}</span></div>`).join('')}</div>` : ''}
      <a class="btn ghost small" href="${ebsCourseUrl(s)}" target="_blank" rel="noopener">EBS ${esc(C.ebs.name)} 강좌 열기</a>` : ''}` : ''}
  </div>`;
}
function currHelpPanel(){
  return `<div class="panel"><h3>EBS 강의는 이렇게 봐요</h3>
    <p style="font-size:15px;line-height:1.6">• 강의는 <b>하루에 한 편</b>만 봐요. 수학 강의 날과 국어 강의 날이 번갈아 와요. 강의 날에는 교재를 강의와 함께 풀기 때문에 그 과목 앱 문제는 5개, 다른 과목과 복습도 절반 정도로 줄여서 하루 1시간 안팎이 되게 해요.<br>
    • 강의 한 편이 차시 두 개를 다룰 때가 많아서, 다음 날은 강의 없이 바로 문제를 풀어요.<br>
    • 강의를 보려면 <b>EBS 초등 회원 로그인</b>이 필요할 수 있어요. 태블릿 크롬에서 엄마 계정으로 한 번 로그인해 두세요.<br>
    • 강의는 교재를 펴 놓고 같이 풀어요. 지금은 <b>1학년 2학기</b>: 「만점왕 수학 플러스 1-2」(김문주 선생님) · 「만점왕 국어 1-2」(전해은 선생님). 1-2를 다 끝내면 자동으로 <b>2학년 1학기</b>(「만점왕 수학 2-1」「만점왕 국어 2-1」)로 넘어가요.<br>
    • 매일 보는 강의는 <b>개념 강의</b>만이에요. 응용·단원 평가·복습책(Book2) 강의는 단원 평가 날에 "골라 보기"로 하나 보이고, 나머지는 EBS에서 원할 때 보면 돼요.<br>
    • 재윤이가 "다 봤어요"를 누르면 몇 분 동안 봤는지 여기에 남아요. 20분이 안 되면 노란색으로 보여요.</p></div>`;
}
function mapTileHTML(){
  const on = SUBJS.filter(currOn); if (!on.length) return '';
  const row = s => { const C = CURRS[s], c = curr(s), u = C.units[c.unit];
    const dots = u ? u.lessons.map((l, li) => `<i class="${(c.done[l.id] || {}).pass ? 'ok' : li === c.lesson && !c.test ? 'cur' : ''}"></i>`).join('') + `<i class="t ${c.test ? 'cur' : ''}"></i>` : '';
    return `<span class="map-row"><b>${SUBJ_NAME[s]}</b><span class="muted">${u ? `${unitTag(u)} · ${c.test ? '평가' : `${c.lesson + 1}차시`}` : '끝!'}</span><span class="mini-dots">${dots}</span></span>`; };
  const medals = SUBJS.reduce((n, x) => n + curr(x).medals.length, 0);
  return `<button class="map-tile" data-a="go" data-v="map"><span style="font-size:30px">🗺️</span><span style="flex:1;display:grid;gap:5px;text-align:left"><span class="disp" style="font-size:18px">진도 지도</span>${on.map(row).join('')}</span><span class="sticker-chip">🏅 ${medals}</span></button>`;
}

/* ===================== EBS 강의 보기 ===================== */
let LECW = null;   // { s, n, at, opt }
/* 같은 강좌 안의 앞 · 오늘 · 다음 강의 (EBS 강의목록과 같은 순서) */
function lecNeighbors(s, n){
  const me = lectInfo(s, n); if (!me) return [];
  return [n - 1, n, n + 1].map(m => lectInfo(s, m)).filter(x => x && x.course === me.course);
}
function lecRowHTML(x, mark){
  return `<div class="ebs-row ${mark ? 'me' : ''}"><span class="ebs-no">${x.no}강</span><span class="ebs-t">${esc(x.title)}<small>${esc(x.desc)}</small></span>${mark ? '<span class="ebs-pick">👉 이거!</span>' : '<span class="ebs-play">▶</span>'}</div>`;
}
function lecFinderHTML(s, n){
  return `<div class="ebs-list" aria-label="EBS 강의목록에서 찾을 강의"><div class="ebs-head">EBS 강의목록에서 이렇게 찾아요</div>${lecNeighbors(s, n).map(x => lecRowHTML(x, x.n === n)).join('')}</div>`;
}
function lectureGuardHTML(s, n){
  const li = lectInfo(s, n), app = ebsUseApp(), direct = !app && !!ebsLinkOf(s, n) && !!S.ebsPlayer;
  // 바로가기가 있으면 강의목록 찾는 그림은 필요 없어서 빼고 짧게 (버튼이 화면 안에 들어오게)
  return `${distanceArt()}<p class="disp" style="font-size:21px;line-height:1.4">강의 보기 전에! 태블릿을 팔 길이만큼 떨어뜨려 놓고, 허리 펴고 바르게 앉아서 봐요.</p>
    <div class="lec-today"><span class="lec-big">${li.no}<small>강</small></span><span style="flex:1;text-align:left"><b class="disp" style="font-size:20px;font-weight:400">오늘은 ${li.no}강!</b><br><span style="font-size:15px">EBS ${esc(li.name)}</span><br><span style="font-size:15px">${esc(li.title)}</span></span></div>
    ${direct ? '' : lecFinderHTML(s, n)}
    ${app ? `<ol class="eye-list" style="list-style:decimal;padding-left:22px"><li>아래 버튼을 누르면 <b>EBS 초등 앱</b>이 열려요</li><li><b>나의 학습방</b> → <b>${esc(li.name)}</b> → <b>${li.no}강</b> ▶ <span class="muted">(${lectInfo(s, n + 1) && lectInfo(s, n + 1).course === li.course ? `${lectInfo(s, n + 1).no}강 말고!` : ''})</span></li><li>다 보면 재윤이 공부방으로 돌아와서 <b>"다 봤어요!"</b></li></ol>`
    : direct ? `<ol class="eye-list" style="list-style:decimal;padding-left:22px"><li>아래 버튼을 누르면 <b>바로 ${li.no}강</b>이 나와요</li><li>다 보면 이 화면으로 돌아와서 <b>"다 봤어요!"</b></li></ol>`
    : `<ol class="eye-list" style="list-style:decimal;padding-left:22px"><li>EBS 화면이 열리면 아래로 내려서 <b>강의목록</b>을 찾아요</li><li><b>${li.no}강</b>을 찾아서 주황색 ▶ 를 눌러요 <span class="muted">(${lectInfo(s, n + 1) && lectInfo(s, n + 1).course === li.course ? `${lectInfo(s, n + 1).no}강 말고!` : ''})</span></li><li>다 보면 이 화면으로 돌아와서 "다 봤어요!"</li></ol>`}
    <p class="muted" style="font-size:14px">📘 교재가 있으면 Book${li.book} ${li.pages}쪽을 펴 놓아요</p>
    <a class="btn big lec-go" ${ebsOpenAttrs(s, n)} data-close data-lecgo="1">${app ? `EBS 앱 열고 ${li.no}강 보러 갈게` : `알겠어! ${li.no}강 보러 갈게`}</a>`;
}
function openLecture(s, n, opt){
  eyeOverlay(lectureGuardHTML(s, n), o => {
    const a = o.querySelector('[data-lecgo]');
    a.addEventListener('click', () => { LECW = { s, n, at:Date.now(), opt:!!opt }; try { sessionStorage.setItem('lecw', JSON.stringify(LECW)); } catch (e) {} setTimeout(() => go('lecwait'), 50); });
  });
  { const li = lectInfo(s, n); speak(ebsUseApp() ? `강의 보기 전에! 태블릿을 팔 길이만큼 떨어뜨려 놓고, 바르게 앉아서 봐요. 오늘은 ${li.local}강이야. 이 에스 앱이 열리면 나의 학습방에서 ${li.local}강을 찾아서 눌러!` : ebsLinkOf(s, n) && S.ebsPlayer ? `강의 보기 전에! 태블릿을 팔 길이만큼 떨어뜨려 놓고, 바르게 앉아서 봐요. 오늘은 ${li.local}강이야. 버튼을 누르면 바로 나와!` : `강의 보기 전에! 태블릿을 팔 길이만큼 떨어뜨려 놓고, 바르게 앉아서 봐요. 오늘은 숫자 ${li.local}, ${li.local}강이야. 목록에서 ${li.local}강을 찾아서 눌러!`); }
}
VIEWS.lecwait = () => {
  if (!LECW) { try { LECW = JSON.parse(sessionStorage.getItem('lecw') || 'null'); } catch (e) {} }
  if (!LECW) return go('home');
  const li = lectInfo(LECW.s, LECW.n), mins = Math.floor((Date.now() - LECW.at) / 60000);
  app().innerHTML = `<section class="screen" style="justify-content:center;align-items:center;text-align:center">
    <span style="font-size:64px">📺</span>
    <h1>${li.no}강 보는 중</h1>
    <p class="muted">${esc(li.name)} · ${esc(li.desc)} · ${li.mins}분</p>
    ${LECW.opt ? stageHTML(150, { expr:'happy', size:110 }) : lecFinderHTML(LECW.s, LECW.n)}
    <div class="bubble">강의를 끝까지 다 보고 나서 눌러 줘!${mins >= 1 ? `<br><span class="muted" style="font-size:15px">지금까지 ${mins}분</span>` : ''}</div>
    <button class="btn big mint" data-a="lecdone">다 봤어요!</button>
    <a class="btn ghost small" ${ebsOpenAttrs(LECW.s, LECW.n)}>${ebsUseApp() ? 'EBS 앱 다시 열기' : '강의 화면 다시 열기'}</a>
    <button class="grown-up" data-a="lecfail">강의가 안 열려요</button>
  </section>`;
};
document.addEventListener('visibilitychange', () => { if (!document.hidden && SCREEN === 'lecwait') go('lecwait'); });
/* 다 봤어요 → 몇 강을 봤는지 직접 고르기. 오늘 강의가 아니면 오늘 강의는 내일 다시 나온다 */
VIEWS.leccheck = () => {
  if (!LECW) return go('home');
  const w = LECW, opts = lecNeighbors(w.s, w.n);
  app().innerHTML = `<section class="screen" style="justify-content:center;align-items:center;text-align:center">
    ${stageHTML(140, { expr:'think', size:104 })}
    <h2>재윤아, 몇 강을 봤어?</h2>
    <p class="muted">방금 본 강의를 눌러 줘</p>
    <div class="lec-pick">${opts.map(x => `<button class="ebs-row big" data-a="lecwatched" data-v="${x.n}"><span class="ebs-no">${x.no}강</span><span class="ebs-t">${esc(x.title)}<small>${esc(x.desc)}</small></span></button>`).join('')}
      <div class="row" style="gap:10px"><button class="ebs-row big other" data-a="lecwatched" data-v="-1" style="flex:1"><span class="ebs-no">✋</span><span class="ebs-t">다른 강의를 봤어요</span></button>
      <button class="ebs-row big other" data-a="lecwatched" data-v="0" style="flex:1"><span class="ebs-no">?</span><span class="ebs-t">잘 모르겠어요</span></button></div></div>
  </section>`;
  speak('재윤아, 몇 강을 봤어? 방금 본 강의를 눌러 줘');
};
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

/* ---------- 오빠 메뉴: EBS 강의 바로가기 주소 넣기 ---------- */
function ebsUpcoming(s, k = 4){
  if (!CURRS[s] || !CURRS[s].ebs || !ebsOn(s)) return [];
  const c = curr(s), co = CURRS[s].now, from = co.lectOff + 1, to = co.lectOff + (co.lect || []).length, out = [];
  const due = dueLecture(s); if (due) out.push(due);
  for (let n = from; n <= to && out.length < k; n++) if (!c.seen[n] && !out.includes(n)) out.push(n);
  return out.sort((a, b) => a - b).map(n => lectInfo(s, n)).filter(Boolean);
}
function ebsLinkPanel(){
  // 앱에 다 들어 있는 강좌(수학 1-2 등)는 넣을 필요가 없어서 빼고 보여 준다
  const subs = ['math','kor'].filter(s => ebsUpcoming(s).some(li => { const lk = ebsLinkOf(s, li.n); return !lk || !lk.builtin; }));
  const mode = S.ebsMode || 'app';
  const playerSw = `<div class="panel"><h3>EBS 강의 여는 곳</h3>
    <div class="row" style="flex-wrap:wrap;gap:8px">${[['app','EBS 초등 앱 (추천)'],['web','인터넷 사이트']].map(([v, l]) => `<button class="btn small ${mode === v ? '' : 'ghost'}" data-a="ebsmode" data-v="${v}">${mode === v ? '✓ ' : ''}${l}</button>`).join('')}</div>
    ${mode === 'app' ? `<p class="muted" style="font-size:14px">재윤이 태블릿에 <b>EBS 초등</b> 앱을 깔고 로그인한 뒤, 앱에서 <b>${esc(CURRS.math.now.ebs ? CURRS.math.now.ebs.name : '')}</b>, <b>${esc(CURRS.kor.now.ebs ? CURRS.kor.now.ebs.name : '')}</b>을 학습신청해 두세요. 앱은 로그인이 계속 유지돼요. 강의 버튼을 누르면 앱이 열리고, 앱이 없으면 설치 화면이 나와요.</p>
      <div class="row" style="flex-wrap:wrap;gap:8px"><a class="btn ghost small" href="${EBS_APP_STORE}" target="_blank" rel="noopener">EBS 초등 앱 설치</a>${isAndroid() ? `<a class="btn ghost small" href="${ebsAppUrl()}">시험: EBS 앱 열기</a>` : ''}</div>`
    : `<div class="row"><span style="flex:1">버튼 한 번에 강의 바로 재생<br><span class="muted" style="font-size:13px">재윤이 태블릿에서 EBS에 <b>로그인</b>하고 이 강좌를 <b>학습신청</b>해 둔 뒤에 켜 주세요. 로그인이 안 돼 있으면 EBS 첫 화면으로 가 버려요. 꺼져 있으면 강좌 화면을 열고 강의목록에서 찾게 안내해요.</span></span><button class="switch ${S.ebsPlayer ? 'on' : ''}" data-a="ebsplayer" aria-label="강의 바로 재생"></button></div>
    ${S.ebsPlayer ? `<a class="btn ghost small" href="${ebsCourseUrl('kor', CURRS.kor.now.lectOff + 1)}" target="_blank" rel="noopener" style="justify-self:start">시험: 국어 01강 열어 보기</a>` : ''}
    <p class="muted" style="font-size:13px">인터넷 EBS는 브라우저를 닫으면 로그인이 풀려서, 로그인 안 된 상태로 열면 EBS 첫 화면이 나와요.</p>`}</div>`;
  if (!subs.length) return playerSw;
  const SN = { math:'수학', kor:'국어' };
  const rows = subs.flatMap(s => ebsUpcoming(s).map(li => ({ s, li, lk:ebsLinkOf(s, li.n) })));
  const first = rows.find(r => !r.lk || !r.lk.sure) || rows[0];
  const known = subs.reduce((a, s) => a + Object.keys((S.ebsLinks || {})[CURRS[s].now.ebs.id] || {}).length, 0);
  return `<div class="panel"><h3>EBS 강의 바로가기</h3>
    <p class="muted" style="font-size:15px">강의 주소를 넣어 두면 재윤이가 목록에서 찾지 않고 <b>버튼 한 번에 그 강의</b>로 가요. 같은 강좌에서 서너 개만 넣으면 나머지 강의도 번호를 짐작해서 열어 줘요.</p>
    <ol class="eye-list" style="list-style:decimal;padding-left:22px;font-size:15px"><li>폰에서 EBS 초등 강좌를 열고 강의 하나를 재생해요</li><li>강의가 재생되는 화면의 주소창 주소를 복사해요 (<b>lid=LS…</b>가 들어 있어야 해요)</li><li>아래에 붙여넣고 몇 강인지 고른 뒤 저장</li></ol>
    <div class="field"><label for="ebsurl">강의 주소 (여러 개면 줄마다 하나씩, 강 순서대로)</label><textarea id="ebsurl" rows="2" style="width:100%;border:2px solid var(--line);border-radius:12px;padding:8px;font-size:14px" placeholder="https://primary.ebs.co.kr/pleasure/course/player/main/index?cid=…&sid=…&lid=LS…"></textarea></div>
    <div class="field"><label for="ebsat">이 주소는 (여러 개면 첫 번째가)</label><select id="ebsat">${rows.map(r => `<option value="${r.s}|${r.li.n}" ${r === first ? 'selected' : ''}>${SN[r.s]} ${r.li.no}강 · ${esc(r.li.title)}</option>`).join('')}</select></div>
    <button class="btn sky small" data-a="ebslink" style="justify-self:start">저장</button>
    <div class="list">${rows.map(r => `<div class="li"><span class="grow" style="font-size:15px">${SN[r.s]} ${r.li.no}강 <span class="muted" style="font-size:13px">${esc(r.li.title)}</span></span>${r.lk ? `<span class="pill ${r.lk.sure ? 'ok' : 'wait'}">${r.lk.sure ? '바로가기 ✓' : '짐작'}</span>` : '<span class="pill no">목록에서 찾기</span>'}</div>`).join('')}</div>
    ${known ? `<button class="btn ghost small" data-a="ebsclear" style="justify-self:start">넣은 주소 모두 지우기</button>` : ''}
  </div>` + playerSw;
}
