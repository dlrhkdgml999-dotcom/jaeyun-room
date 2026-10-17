/* ===================== 매일 뽑기 캡슐 · 도감 · 오늘 순서 고르기 ===================== */
/* 하루 공부를 다 끝내면 캡슐 하나. 안에는 토리 친구가 랜덤으로 (보통 · 반짝 · 무지개) */
const COLLECT = [
  // 보통 (r:1)
  { id:'c01', e:'🐣', n:'병아리 삐약이', r:1 }, { id:'c02', e:'🐰', n:'토끼 친구 솜이', r:1 }, { id:'c03', e:'🐱', n:'고양이 나비', r:1 }, { id:'c04', e:'🐶', n:'강아지 콩이', r:1 },
  { id:'c05', e:'🐹', n:'햄스터 도토리', r:1 }, { id:'c06', e:'🐼', n:'판다 대나무', r:1 }, { id:'c07', e:'🐨', n:'코알라 쿨쿨', r:1 }, { id:'c08', e:'🐧', n:'펭귄 뒤뚱이', r:1 },
  { id:'c09', e:'🐢', n:'거북이 느릿', r:1 }, { id:'c10', e:'🐞', n:'무당벌레 점박이', r:1 }, { id:'c11', e:'🍓', n:'딸기 새콤이', r:1 }, { id:'c12', e:'🍩', n:'도넛 동글이', r:1 },
  { id:'c13', e:'🧁', n:'컵케이크 포근이', r:1 }, { id:'c14', e:'🍭', n:'막대사탕 빙글이', r:1 }, { id:'c15', e:'🌷', n:'튤립 봄이', r:1 }, { id:'c16', e:'🌻', n:'해바라기 해님', r:1 },
  { id:'c17', e:'🍄', n:'버섯 뽀송이', r:1 }, { id:'c18', e:'🎈', n:'풍선 둥실이', r:1 },
  // 반짝 (r:2)
  { id:'c19', e:'🦋', n:'나비 팔랑이', r:2 }, { id:'c20', e:'🐬', n:'돌고래 퐁당이', r:2 }, { id:'c21', e:'🦊', n:'여우 꼬리별', r:2 }, { id:'c22', e:'🐿️', n:'다람쥐 볼빵빵', r:2 },
  { id:'c23', e:'🍰', n:'케이크 생일이', r:2 }, { id:'c24', e:'🌈', n:'무지개 일곱빛', r:2 }, { id:'c25', e:'⭐', n:'별 반짝이', r:2 }, { id:'c26', e:'🎀', n:'리본 사랑이', r:2 },
  { id:'c27', e:'🍀', n:'네잎클로버 행운이', r:2 }, { id:'c28', e:'🫧', n:'비눗방울 퐁퐁이', r:2 },
  // 무지개 (r:3, 아주 가끔)
  { id:'c29', e:'🦄', n:'유니콘 꿈꾸미', r:3 }, { id:'c30', e:'👑', n:'왕관 재윤공주', r:3 }, { id:'c31', e:'🐉', n:'아기 용 불꽃이', r:3 }, { id:'c32', e:'🧚', n:'요정 반짝날개', r:3 },
];
const RARE = { 1:{ name:'보통', cls:'r1' }, 2:{ name:'반짝', cls:'r2' }, 3:{ name:'무지개', cls:'r3' } };
function capsulePick(){
  const own = S.collect || {};
  const roll = Math.random(), r = roll < .06 ? 3 : roll < .32 ? 2 : 1;
  let pool = COLLECT.filter(c => c.r === r && !own[c.id]);
  if (!pool.length) pool = COLLECT.filter(c => !own[c.id]);       // 그 등급을 다 모았으면 아직 없는 친구 아무나
  if (!pool.length) pool = COLLECT.filter(c => c.r === r);          // 다 모았으면 중복
  return pick(pool);
}
function capsuleWaiting(d = day()){ return d.done && !(d.capsule && d.capsule.opened); }
let CAP = null;
VIEWS.capsule = () => {
  const d = day();
  if (!d.done) return go('home');
  if (d.capsule && d.capsule.opened) return go('capsuleOpen', d.capsule.id);
  CAP = { taps:0 };
  app().innerHTML = `<section class="screen reward" style="justify-content:center">
    <h1>오늘의 캡슐!</h1>
    <p class="score-line">오늘 공부를 다 끝낸 선물이야.<br>캡슐을 세 번 톡톡 두드려 봐!</p>
    <button class="capsule" data-a="captap" aria-label="캡슐 두드리기">${capsuleSVG()}</button>
    <div class="cap-dots"><i></i><i></i><i></i></div>
  </section>`;
  speak('오늘의 캡슐! 세 번 톡톡 두드려 봐!');
};
VIEWS.capsuleOpen = (id) => {
  const isNew = (day().capsule || {}).isNew;
  const c = COLLECT.find(x => x.id === id), own = S.collect || {}, total = COLLECT.filter(x => own[x.id]).length;
  app().innerHTML = `<section class="screen reward" style="justify-content:center">
    <span class="rare-tag ${RARE[c.r].cls}">${RARE[c.r].name}</span>
    <div class="cap-item ${RARE[c.r].cls}">${c.e}</div>
    <h1>${esc(c.n)}</h1>
    <p class="score-line">${isNew ? '새 친구가 생겼어! 도감에 쏙!' : '이미 있는 친구네! 대신 스티커 하나 더 줄게 ⭐'}<br><span class="muted">도감 ${total} / ${COLLECT.length}</span></p>
    <div class="row" style="gap:12px;align-self:stretch"><button class="btn ghost big" data-a="go" data-v="book" style="flex:1">도감 보기</button><button class="btn big" data-a="home" style="flex:1">처음으로</button></div>
  </section>`;
};
function capsuleSVG(){
  return `<svg viewBox="0 0 160 170" width="190" height="200" aria-hidden="true"><g class="cap-top"><path d="M20 85 A60 60 0 0 1 140 85 Z" fill="#FF8FB1" stroke="${INK}" stroke-width="5"/><circle cx="55" cy="55" r="9" fill="#fff" opacity=".7"/></g><g class="cap-bot"><path d="M20 90 A60 60 0 0 0 140 90 Z" fill="#fff" stroke="${INK}" stroke-width="5"/></g><rect x="14" y="82" width="132" height="11" rx="5" fill="#FFE08A" stroke="${INK}" stroke-width="4"/><text x="80" y="128" text-anchor="middle" font-size="26" font-family="Jua, sans-serif" fill="${INK}">?</text></svg>`;
}
function openCapsule(){
  const d = day(); if (!d.done || (d.capsule && d.capsule.opened)) return;
  const c = capsulePick(); S.collect = S.collect || {};
  const isNew = !S.collect[c.id]; S.collect[c.id] = (S.collect[c.id] || 0) + 1;
  if (!isNew) { const st = pick(STICKERS); d.earned.push(st); S.stickers.push({ e:st, d:todayKey(), bonus:true }); }
  d.capsule = { id:c.id, opened:true, isNew };
  if (c.r === 3) { notify('oppa', `🦄 재윤이가 캡슐에서 무지개 친구 "${c.n}"를 뽑았어요!`); notify('mom', `🦄 재윤이가 캡슐에서 무지개 친구 "${c.n}"를 뽑았어요!`); }
  save();
  SFX.sticker(); confetti();
  go('capsuleOpen', c.id);
  speak(isNew ? `우와! ${c.n}! 새 친구가 생겼어!` : `${c.n}! 이미 있는 친구네. 대신 스티커 하나 더!`);
}
/* 도감: 가진 친구는 눌러서 토리 옆에 두기 (세 명까지) */
VIEWS.book = () => {
  const own = S.collect || {}, fr = S.friends || [], total = COLLECT.filter(x => own[x.id]).length;
  app().innerHTML = `<section class="screen">
    <div class="row"><button class="icon-btn" data-a="home" aria-label="처음으로">${ICON.back}</button><h2 style="flex:1">토리 친구 도감</h2><span class="sticker-chip">${total} / ${COLLECT.length}</span></div>
    <div class="bubble" style="font-size:18px">공부를 다 끝낸 날마다 캡슐에서 친구가 나와요. 친구를 누르면 ${esc(S.bunnyName)} 옆에 같이 놀 수 있어요 (세 명까지)!</div>
    ${[3, 2, 1].map(r => `<h3 class="disp" style="font-weight:400;margin:4px 0 0"><span class="rare-tag ${RARE[r].cls}">${RARE[r].name}</span></h3>
      <div class="book-grid">${COLLECT.filter(c => c.r === r).map(c => own[c.id]
        ? `<button class="book-cell ${RARE[r].cls} ${fr.includes(c.id) ? 'on' : ''}" data-a="friend" data-v="${c.id}"><span class="e">${c.e}</span><span class="n">${esc(c.n)}</span>${own[c.id] > 1 ? `<span class="cnt">×${own[c.id]}</span>` : ''}</button>`
        : `<span class="book-cell empty"><span class="e">❔</span><span class="n">???</span></span>`).join('')}</div>`).join('')}
  </section>`;
};
function friendsHTML(){ const fr = (S.friends || []).map(id => COLLECT.find(c => c.id === id)).filter(Boolean); return fr.length ? `<span class="friends">${fr.map(c => `<span>${c.e}</span>`).join('')}</span>` : ''; }

/* 오늘 순서 고르기: 국어 · 수학 · 영어 중 무엇부터 (복습은 늘 마지막) */
function orderedBoards(d = day()){
  const ord = d.order || ['kor','math','eng'];
  return [...ord.map(k => BOARDS.find(b => b.k === k)), BOARDS.find(b => b.k === 'rev')];
}
function orderPickHTML(d = day()){
  if (d.order || Object.keys(d.boards).length) return '';
  return `<div class="order-pick"><span class="disp" style="font-size:20px">오늘은 뭐부터 할까?</span>
    <div class="row" style="gap:10px">${BOARDS.filter(b => b.k !== 'rev').map(b => `<button class="order-btn" data-a="pickfirst" data-v="${b.k}"><span class="badge ${b.cls}">${b.badge}</span>${b.k === 'eng' ? '영어' : b.name}</button>`).join('')}</div></div>`;
}
