/* ===================== 수학 진도 화면 ===================== */
function mathCurrOn(){ return S.mathMode !== 'free'; }
function lessonById(id){ return ALL_LESSONS.find(l => l.id === id); }

function lessonIntroHTML(b){
  const c = curr();
  if (b.cur.test) { const u = CURRICULUM.units[b.cur.unit]; return `<div class="lesson-card"><span class="eyebrow">${u.n}단원 ${esc(u.name)}</span><span class="disp" style="font-size:24px">단원 평가 도전!</span><span class="muted">12문제 중 10문제를 한 번에 맞히면 메달을 받아요 🏅</span></div>`; }
  const l = lessonById(b.cur.lesson), link = (c.links || {})[l.ui];
  return `<div class="lesson-card"><span class="eyebrow">${l.unit.n}단원 ${esc(l.unit.name)} · ${l.li + 1}차시</span><span class="disp" style="font-size:24px">${esc(l.title)}</span>
    ${link ? `<button class="btn sky small" data-a="lecture">📺 강의 먼저 보기</button>` : ''}
    <span class="muted" style="font-size:15px">개념 카드를 보고 → 문제를 풀어요</span></div>`;
}
function lessonResultHTML(r0){
  const r = Object.assign({}, r0, { unit:CURRICULUM.units[r0.unitIdx], lesson:r0.lessonId ? lessonById(r0.lessonId) : null });
  if (r.test) return r.pass
    ? `<div class="lesson-card won"><span style="font-size:54px">🏅</span><span class="disp" style="font-size:24px">${r.unit.n}단원 "${esc(r.unit.name)}" 통과!</span><span>${Math.round(r.rate * 100)}점! 다음 단원으로 가자!</span></div>`
    : `<div class="lesson-card"><span class="disp" style="font-size:22px">${Math.round(r.rate * 100)}점! 아깝다</span><span>내일 한 번 더 도전하면 메달을 받을 수 있어!</span></div>`;
  const next = currentLesson(), c = curr();
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
    <div class="row"><button class="icon-btn" data-a="${CARDS.fromBoard ? 'home' : 'go'}" data-v="map" aria-label="나가기">${ICON.close}</button>
      <span class="eyebrow" style="flex:1">${l.unit.n}단원 · ${l.li + 1}차시 개념</span><span class="disp" style="font-size:18px">${i + 1}/${cards.length}</span></div>
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
  speak(cd.say);
};

/* 수학 진도 지도 */
VIEWS.map = () => {
  const c = curr();
  const medal = ui => c.medals.some(m => m.unit === ui);
  app().innerHTML = `<section class="screen">
    <div class="row"><button class="icon-btn" data-a="home" aria-label="처음으로">${ICON.back}</button><h2 style="flex:1">수학 진도 지도</h2><span class="sticker-chip">🏅 ${c.medals.length}</span></div>
    <div class="bubble" style="display:flex;gap:10px;align-items:center">${bunnySVG({ size:56, expr:'happy' })}<span>${CURRICULUM.units[c.unit] ? `지금은 ${esc(currLabel())}! 재윤이 진짜 잘하고 있어!` : '초2 1학기 수학을 다 끝냈어! 최고야!'}</span></div>
    ${CURRICULUM.units.map((u, ui) => {
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

/* 엄마 메뉴: 수학 진도 */
function mathCurrPanel(){
  const c = curr();
  const opts = CURRICULUM.units.flatMap((u, ui) => [...u.lessons.map((l, li) => `<option value="${ui}|${li}|0" ${c.unit === ui && c.lesson === li && !c.test ? 'selected' : ''}>${u.n}단원 ${l.li + 1}차시 · ${esc(l.title)}</option>`), `<option value="${ui}|0|1" ${c.unit === ui && c.test ? 'selected' : ''}>${u.n}단원 평가</option>`]).join('');
  const recent = Object.entries(c.done).sort((a, b) => b[1].date.localeCompare(a[1].date)).slice(0, 5);
  const u = CURRICULUM.units[c.unit];
  return `<div class="panel"><h3>수학 진도 (${CURRICULUM.title})</h3>
    <div class="field"><label for="mmode">수학 방식</label><select id="mmode" data-ch="mmode"><option value="curr" ${mathCurrOn() ? 'selected' : ''}>단원 진도 (초2 1학기 선행 + 초1 2학기 복습 30%)</option><option value="free" ${mathCurrOn() ? '' : 'selected'}>자유 연습 (아래 난이도대로 섞어서)</option></select></div>
    ${mathCurrOn() ? `
    <p><b>${esc(currLabel())}</b> · 메달 ${c.medals.length}개</p>
    <div class="field"><label for="cjump">진도 옮기기</label><select id="cjump" data-ch="cjump">${opts}</select></div>
    ${recent.length ? `<div class="list">${recent.map(([id, d]) => `<div class="li"><span class="grow">${id.replace('-', '단원 ')}차시 · ${esc(lessonById(id).title)}</span><span class="pill ${d.pass ? 'ok' : 'wait'}">${d.rate}%${d.tries > 1 ? ` · ${d.tries}번째` : ''}</span></div>`).join('')}</div>` : ''}
    ${u ? `<div class="field"><label for="ebslink">${u.n}단원 강의 주소 (EBS 등)</label><input type="text" id="ebslink" placeholder="https:// 로 시작하는 주소를 붙여넣기" value="${esc((c.links || {})[c.unit] || '')}"></div>
    <div class="row" style="flex-wrap:wrap"><button class="btn small" data-a="savelink">강의 주소 저장</button><a class="btn ghost small" href="${EBS_HOME}" target="_blank" rel="noopener">EBS 초등 열기</a></div>
    <p class="muted" style="font-size:13px">EBS 초등에서 "2학년 1학기 수학 ${esc(u.name)}" 강의를 찾아 주소를 붙여넣으면, 재윤이 화면에 "강의 먼저 보기" 버튼이 생겨요.</p>` : ''}
    <p class="muted" style="font-size:13px">한 차시에서 70% 넘게 한 번에 맞히면 다음 차시로, 단원 평가는 80% 넘으면 통과예요. 못 넘으면 다음 날 같은 차시를 한 번 더 해요.</p>` : ''}
  </div>`;
}

function mapTileHTML(){
  const c = curr(), u = CURRICULUM.units[c.unit];
  const dots = u ? u.lessons.map((l, li) => `<i class="${(c.done[l.id] || {}).pass ? 'ok' : li === c.lesson && !c.test ? 'cur' : ''}"></i>`).join('') + `<i class="t ${c.test ? 'cur' : ''}"></i>` : '';
  return `<button class="map-tile" data-a="go" data-v="map"><span style="font-size:30px">🗺️</span><span style="flex:1;display:grid;gap:4px;text-align:left"><span class="disp" style="font-size:18px">수학 진도 지도</span><span class="muted" style="font-size:14px">${esc(currLabel())}</span><span class="mini-dots">${dots}</span></span><span class="sticker-chip">🏅 ${c.medals.length}</span></button>`;
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
function lectureGuard(link){
  const line = '강의 보기 전에! 태블릿을 팔 길이만큼 떨어뜨려 놓고, 허리 펴고 바르게 앉아서 봐요.';
  eyeOverlay(`${distanceArt()}<p class="disp" style="font-size:22px;line-height:1.4">${line}</p>
    <ul class="eye-list"><li>👀 화면에 얼굴을 너무 가까이 대지 않기</li><li>💡 방을 밝게 켜고 보기</li><li>⏰ 다 보면 먼 곳을 잠깐 바라보기</li></ul>
    <a class="btn big" href="${esc(link)}" target="_blank" rel="noopener" data-close>알겠어! 강의 보러 가기</a>`);
  speak('강의 보기 전에! 태블릿을 팔 길이만큼 떨어뜨려 놓고, 바르게 앉아서 봐요.');
}
/* 판 사이 눈 쉬는 시간 (20초 동안 먼 곳 보기) */
VIEWS.eyebreak = (next) => {
  const secs = 20;
  app().innerHTML = `<section class="screen reward">
    <h1>눈 쉬는 시간</h1>
    <div class="eye-timer"><svg viewBox="0 0 120 120" width="180" height="180"><circle cx="60" cy="60" r="52" fill="#fff" stroke="${C.line}" stroke-width="10"/><circle id="eyering" cx="60" cy="60" r="52" fill="none" stroke="${C.mint}" stroke-width="10" stroke-linecap="round" stroke-dasharray="327" stroke-dashoffset="0" transform="rotate(-90 60 60)"/></svg><span class="disp" id="eyesec">${secs}</span></div>
    <p class="disp" style="font-size:24px;line-height:1.4">창밖이나 방 끝, 먼 곳을 바라보며<br>눈을 천천히 깜빡깜빡!</p>
    <button class="btn big mint" id="eyedone" data-a="eyedone" data-v="${next}" disabled>${secs}초만 쉬어요</button>
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
