/* ===================== 재미 더하기 (2026-11-04 오빠 요청 "재윤이가 슬슬 지겨워하는 것 같아") =====================
   1. 문제 풀이를 게임처럼: 처음에 맞히면 🥕 당근 줍기 · 연속 정답 콤보 · 단원 평가는 "당근 탑" 보스전
   2. 매일 깜짝 이벤트: 날짜로 정해서(모든 기기가 같음) 하루 하나 — 스티커 2배, 숨은 황금 당근, 콤보 도전, 단비, 친구 방문, 오빠 퀴즈 날
   3. 토리 텃밭: 판을 끝내면 물뿌리개 → 씨앗 심고 물 주기 → 수확 → 토리에게 먹이기 · 새 씨앗 · 문제에서 모은 당근 20개 = 황금 씨앗(도감 친구)
   4. 재윤이가 오빠에게 문제 내기: 덧셈·뺄셈(재윤이가 먼저 정답 확인) · 그림 퀴즈(펜) · 수수께끼 → 오빠·엄마 폰에서 풀기 → 재윤이 대 오빠 점수
   5. 오빠·엄마 깜짝 응원 녹음 여러 개: 판이 끝날 때 가끔 무작위로
   저장: S.garden(재윤이 기록 KID_KEYS) · S.cheers(어른 설정 ADULT_KEYS) · 그날 기록 d.ev
   서버: families/{fid}/kq/{id} 재윤이가 낸 문제 · kqa/{id} 오빠·엄마가 푼 답 (Firestore 규칙 그대로) */

SFX.combo = () => tone([[988,0,.1],[1319,.08,.12],[1760,.16,.25]]);
SFX.hit = () => tone([[330,0,.1,'square',.06],[220,.08,.18,'square',.05]]);
SFX.water = () => tone([[660,0,.08,'sine',.08],[880,.07,.08,'sine',.07],[1100,.14,.14,'sine',.06]]);
SFX.find = () => tone([[1175,0,.08],[1568,.07,.1],[2093,.15,.3]]);
const funDay = (k = todayKey()) => { const d = day(); d.ev = d.ev || {}; return d.ev; };
function funBonusSticker(why){ const e = pick(STICKERS), d = day(); d.earned.push(e); S.stickers.push({ e, d:todayKey(), bonus:why }); return e; }

/* ---------- 2. 매일 깜짝 이벤트 ---------- */
const FUN_EVENTS = [
  { id:'double', ic:'⭐', name:'스티커 2배 날', desc:'판을 끝낼 때마다 스티커를 하나 더 받아요!' },
  { id:'hunt', ic:'🥕', name:'숨은 황금 당근 찾기', desc:'문제 화면 어딘가에 황금 당근이 숨어 있어요. 3개 찾으면 보너스 스티커!' },
  { id:'combo', ic:'🔥', name:'콤보 도전 날', desc:'한 판에서 5개 연속으로 한 번에 맞히면 보너스 스티커!' },
  { id:'rain', ic:'🌧️', name:'단비 오는 날', desc:'텃밭 물뿌리개를 2배로 받아요!' },
  { id:'friend', ic:'🎈', name:'친구가 놀러 온 날', desc:'도감 친구가 놀러 와서 응원해 줘요!' },
  { id:'quiz', ic:'🎲', name:'오빠 퀴즈 날', desc:'오빠에게 문제를 하나 내면 보너스 스티커!' },
];
function funEventBase(k){ const h = parseInt(hashStr('ev' + k).slice(0, 6), 36); return h % FUN_EVENTS.length; }
/* 날짜마다 정해짐(모든 기기가 같음). 전날과 같으면 다음 것으로 — 전날도 같은 규칙으로 정해진 값과 비교 (20일 앞까지 따라감) */
const EV_MEMO = new Map();
function dayEventId(k, depth = 0){
  const fr = Object.keys(S.collect || {}).length > 0, mk = k + (fr ? '+' : '-');
  if (EV_MEMO.has(mk)) return EV_MEMO.get(mk);
  const prev = depth < 20 ? dayEventId(addDays(k, -1), depth + 1) : null;
  let i = funEventBase(k), id = null;
  for (let t = 0; t < FUN_EVENTS.length; t++) { const c = FUN_EVENTS[(i + t) % FUN_EVENTS.length].id; if (c === prev || (c === 'friend' && !fr)) continue; id = c; break; }   // 아직 도감 친구가 없으면 친구 방문은 건너뜀
  if (depth === 0) EV_MEMO.set(mk, id);
  return id;
}
const EV_OFF = { id:'off', ic:'', name:'', desc:'' };
function dayEvent(k = todayKey()){
  if (window.__ev === 'off') return EV_OFF;   // 시뮬레이션: 이벤트 끄기 (예전 시뮬레이션이 스티커 수를 셀 때)
  if (window.__ev) return FUN_EVENTS.find(e => e.id === window.__ev) || FUN_EVENTS[0];   // 시뮬레이션용
  return FUN_EVENTS.find(e => e.id === dayEventId(k)) || FUN_EVENTS[0];
}
function funFriend(k = todayKey()){ const own = COLLECT.filter(c => (S.collect || {})[c.id]); if (!own.length) return null; return own[parseInt(hashStr('fr' + k).slice(0, 5), 36) % own.length]; }
function funEventHTML(){
  const ev = dayEvent(), d = day(), e = d.ev || {}; if (ev.id === 'off') return '';
  let st = '';
  if (ev.id === 'hunt') st = ` <b>${e.found || 0}/3</b>${(e.found || 0) >= 3 ? ' ✓' : ''}`;
  if (ev.id === 'combo' && e.combo5) st = ' ✓';
  if (ev.id === 'quiz' && e.quiz) st = ' ✓';
  const fr = ev.id === 'friend' ? funFriend() : null;
  return `<button class="ev-banner" data-a="evtell"><span class="ic">${fr ? fr.e : ev.ic}</span><span style="flex:1"><b>오늘의 깜짝: ${esc(fr ? `${fr.n} 놀러 온 날` : ev.name)}${st}</b><small>${esc(ev.desc)}</small></span></button>`;
}

/* ---------- 1. 문제 풀이를 게임처럼 ---------- */
const BOSS_LINES = ['쿵! 탑이 흔들려!', '와르르! 한 칸 무너졌다!', '좋아, 조금만 더!', '당근 탑이 비틀비틀!'];
/* 문제 화면 위: 콤보 · 당근 · (단원 평가면) 당근 탑 */
function funQHTML(b){
  if (!b) return '';
  const combo = b.combo || 0, car = b.carrots || 0;
  let boss = '';
  if (b.cur && b.cur.test) {
    const max = b.qs.length * 2, hp = Math.max(0, max - (b.boss || 0)), blocks = Math.ceil(hp / 2);
    boss = `<div class="boss" aria-label="당근 탑"><div class="boss-tower">${'<span>🥕</span>'.repeat(Math.max(0, blocks))}${hp ? '' : '<span class="boss-done">💥</span>'}</div>
      <div class="boss-info"><b>당근 탑 무너뜨리기!</b><span class="boss-hp"><i style="width:${Math.round(hp / max * 100)}%"></i></span><small>한 번에 맞히면 쾅! 두 칸, 다시 맞히면 한 칸</small></div></div>`;
  }
  return `${boss}<div class="fun-row"><span class="carrot-chip" title="한 번에 맞혀서 주운 당근">🥕 ${car}</span>${combo >= 2 ? `<span class="combo-chip ${combo >= 5 ? 'hot' : ''}">🔥 ${combo}연속</span>` : ''}</div>`;
}
/* 진행 막대에 남은 문제 자리마다 당근 (맞히면 토리가 주워 가요) */
function funAfterQ(b){
  try {
    const tr = document.querySelector('.q-top .track'); if (!tr || !b) return;
    for (let i = b.idx + 1; i < b.qs.length; i++) { const s = document.createElement('span'); s.className = 'cmark'; s.style.left = Math.round(i / b.qs.length * 100) + '%'; s.textContent = '🥕'; tr.appendChild(s); }
    funHuntMaybe(b);
  } catch (e) {}
}
function funRight(first){
  const b = RUN && RUN.b; if (!b) return;
  if (first) { b.combo = (b.combo || 0) + 1; b.maxCombo = Math.max(b.maxCombo || 0, b.combo); b.carrots = (b.carrots || 0) + 1; }
  else b.combo = 0;
  if (b.cur && b.cur.test) b.boss = (b.boss || 0) + (first ? 2 : 1);
  const fb = document.querySelector('#fb .bubble');
  if (first && b.combo >= 3 && fb) { fb.insertAdjacentHTML('beforeend', ` <b class="combo-pop">🔥 ${b.combo}연속!</b>`); setTimeout(() => SFX.combo(), 250); }
  if (b.cur && b.cur.test && fb) fb.insertAdjacentHTML('beforeend', `<br><b class="combo-pop">${pick(BOSS_LINES)}</b>`);
  const ev = dayEvent(), e = funDay();
  if (first && b.combo >= 5 && ev.id === 'combo' && !e.combo5) { e.combo5 = true; const st = funBonusSticker('combo'); toast(`🔥 5연속 성공! 보너스 스티커 ${st}`); }
  const box = document.querySelector('.fun-row'); if (box) { const tmp = document.createElement('div'); tmp.innerHTML = funQHTML(b); const nb = tmp.querySelector('.fun-row'); if (nb) box.replaceWith(nb); }
  const tw = document.querySelector('.boss'); if (tw) { const tmp = document.createElement('div'); tmp.innerHTML = funQHTML(b); const nb = tmp.querySelector('.boss'); if (nb) { nb.classList.add('shake'); tw.replaceWith(nb); } SFX.hit(); }
}
function funWrong(){ const b = RUN && RUN.b; if (b) { b.combo = 0; const c = document.querySelector('.combo-chip'); if (c) c.remove(); } }
/* 숨은 황금 당근: 이벤트 날, 문제 화면 구석에 가끔 (하루 3개까지) */
function funHuntMaybe(b){
  if (dayEvent().id !== 'hunt') return;
  const e = funDay(); if ((e.found || 0) >= 3) return;
  e.huntSeen = (e.huntSeen || 0) + 1;
  // 처음 몇 문제는 안 숨기고, 그 뒤로는 다섯 문제에 하나꼴 (하루에 다 찾을 수 있게 늦어질수록 자주)
  const p = e.huntSeen < 3 ? 0 : Math.min(.5, .18 + (e.huntSeen / 120));
  if (Math.random() >= p) return;
  // 11/4: 화면 구석에 띄웠더니 보기 버튼 위에 겹쳐서 답이 안 눌림(sim_family) → 당근·콤보 줄 안 아무 자리에 (보기와 안 겹침)
  const row = document.querySelector('.fun-row'); if (!row) return;
  row.insertAdjacentHTML('beforeend', `<button class="hunt-carrot" data-a="huntc" style="margin-left:${Math.round(Math.random() * 40) + 8}%" aria-label="숨은 황금 당근">🥕</button>`);
}
/* 판 끝: 이벤트 보너스, 물뿌리개 */
function funOnFinish(k, b, d, allDone){
  const ev = dayEvent(), out = {};
  if (ev.id === 'double') out.double = funBonusSticker('double');
  const g = gardenState(), w = (ev.id === 'rain' ? 2 : 1) + (allDone ? 1 : 0);
  g.cans += w; g.carrots = (g.carrots || 0) + (b.carrots || 0); out.cans = w;
  return out;
}
function funRewardHTML(k, b){
  const d = day(), parts = [];
  if (b.maxCombo >= 3) parts.push(`최고 <b>${b.maxCombo}연속</b> 🔥`);
  if (b.carrots) parts.push(`당근 <b>${b.carrots}개</b> 🥕`);
  if (b.cur && b.cur.test) parts.push(b.cur.result && b.cur.result.pass ? '<b>당근 탑을 무너뜨렸어! 💥</b>' : '당근 탑이 아직 버티고 있어. 다음엔 무너뜨리자!');
  const e = (d.ev || {}).fin && d.ev.fin[k] || {};
  const more = [];
  if (e.double) more.push(`⭐ 스티커 2배 날! 하나 더 ${e.double}`);
  if (e.cans) more.push(`🪣 텃밭 물뿌리개 ${e.cans}개`);
  const ev = dayEvent(), fr = ev.id === 'friend' ? funFriend() : null;
  return `${parts.length ? `<p class="score-line" style="font-size:18px">${parts.join(' · ')}</p>` : ''}${more.length ? `<p class="muted" style="text-align:center">${more.join(' · ')}</p>` : ''}${fr ? `<div class="bubble" style="display:flex;align-items:center;gap:10px"><span style="font-size:34px">${fr.e}</span><span>${esc(fr.n)}: 재윤아, 진짜 멋져! 다음 판도 응원할게!</span></div>` : ''}`;
}

/* ---------- 3. 토리 텃밭 ---------- */
const SEEDS = [
  { id:'carrot', e:'🥕', n:'당근', need:3, at:0 }, { id:'straw', e:'🍓', n:'딸기', need:4, at:2 }, { id:'corn', e:'🌽', n:'옥수수', need:5, at:5 },
  { id:'sun', e:'🌻', n:'해바라기', need:6, at:8 }, { id:'tomato', e:'🍅', n:'토마토', need:5, at:11 }, { id:'melon', e:'🍉', n:'수박', need:8, at:15 },
  { id:'pump', e:'🎃', n:'호박', need:8, at:20 }, { id:'gold', e:'🌈', n:'황금 씨앗 (무지개 꽃)', need:6, at:-1 },
];
const GOLD_COST = 20;
function gardenState(){ const g = S.garden = S.garden || {}; g.cans = g.cans || 0; g.plots = g.plots || [null, null, null, null]; g.basket = g.basket || {}; g.harvests = g.harvests || 0; g.fed = g.fed || 0; g.carrots = g.carrots || 0; g.gold = g.gold || 0;
  if (g.harvests >= 10 && g.plots.length < 6) while (g.plots.length < 6) g.plots.push(null);
  return g; }
const seedOf = id => SEEDS.find(s => s.id === id);
function plotStage(p){ if (!p) return 'empty'; const s = seedOf(p.s), r = p.w / s.need; return r >= 1 ? 'ready' : r >= .67 ? 'bud' : r >= .34 ? 'leaf' : r > 0 ? 'sprout' : 'seed'; }
const STAGE_E = { seed:'🟤', sprout:'🌱', leaf:'🌿', bud:'🌷' };
let GARDEN_PICK = null;
function gardenTileHTML(){
  const g = gardenState(), ready = g.plots.filter(p => plotStage(p) === 'ready').length, empty = g.plots.filter(p => !p).length;
  const sub = ready ? `다 자란 게 ${ready}개! 수확하러 가자` : g.cans ? `물뿌리개 ${g.cans}개가 기다려요` : empty === g.plots.length ? '씨앗을 심어 볼까?' : '판을 끝내면 물뿌리개가 생겨요';
  return `<button class="garden-tile ${ready || g.cans ? 'ping' : ''}" data-a="go" data-v="garden"><span class="plots">${g.plots.slice(0, 4).map(p => `<i>${p ? (plotStage(p) === 'ready' ? seedOf(p.s).e : STAGE_E[plotStage(p)]) : '🟫'}</i>`).join('')}</span><span style="flex:1;display:grid"><b class="disp" style="font-size:20px">토리 텃밭</b><span class="muted" style="font-size:15px">${sub}</span></span>${g.cans ? `<span class="pill">🪣 ${g.cans}</span>` : ''}</button>`;
}
VIEWS.garden = () => {
  const g = gardenState(), unlocked = SEEDS.filter(s => s.at >= 0 && g.harvests >= s.at), nextSeed = SEEDS.find(s => s.at > g.harvests);
  const bas = Object.entries(g.basket).filter(([, n]) => n > 0);
  app().innerHTML = `<section class="screen garden">
    <div class="row"><button class="icon-btn" data-a="home" aria-label="처음으로">${ICON.back}</button><h2 style="flex:1">${esc(S.bunnyName)} 텃밭</h2><span class="pill">🪣 물뿌리개 ${g.cans}</span></div>
    <div class="hero" style="min-height:0"><div class="stage-btn tori-stage" id="gTori">${stageHTML(120, { expr:'happy', size:92 })}</div><div class="bubble left" id="gSay">${GARDEN_PICK != null ? '어떤 씨앗을 심을까?' : g.cans ? '밭을 누르면 물을 줄 수 있어!' : g.plots.some(p => !p) ? '빈 밭을 누르면 씨앗을 심어요!' : '공부 한 판 끝내면 물뿌리개가 생겨!'}</div></div>
    <div class="plots-grid">${g.plots.map((p, i) => { const st = plotStage(p), s = p && seedOf(p.s);
      return `<button class="plot ${st} ${GARDEN_PICK === i ? 'pick' : ''}" data-a="plot" data-v="${i}"><span class="pe">${!p ? '' : st === 'ready' ? s.e : STAGE_E[st]}</span><span class="pl">${!p ? '빈 밭' : st === 'ready' ? '수확!' : `${s.n} ${p.w}/${s.need}`}</span>${p && st !== 'ready' ? `<span class="pw"><i style="width:${Math.round(p.w / s.need * 100)}%"></i></span>` : ''}</button>`; }).join('')}</div>
    ${GARDEN_PICK != null ? `<div class="panel"><h3>씨앗 고르기</h3><div class="seed-row">${unlocked.map(s => `<button class="seed" data-a="plant" data-v="${s.id}"><span>${s.e}</span>${s.n}<small>물 ${s.need}번</small></button>`).join('')}${g.gold ? `<button class="seed gold" data-a="plant" data-v="gold"><span>🌈</span>황금 씨앗<small>${g.gold}개 · 물 6번</small></button>` : ''}</div>
      ${nextSeed ? `<p class="muted" style="font-size:14px">${nextSeed.at - g.harvests}번 더 수확하면 새 씨앗: ${nextSeed.e} ${nextSeed.n}</p>` : ''}<button class="btn ghost small" data-a="plantcancel">안 심을래</button></div>` : ''}
    <div class="panel"><h3>🧺 수확 바구니 <small class="muted">누르면 토리에게 줘요</small></h3>
      ${bas.length ? `<div class="seed-row">${bas.map(([id, n]) => `<button class="seed" data-a="feed" data-v="${id}"><span>${seedOf(id).e}</span>${seedOf(id).n}<small>${n}개</small></button>`).join('')}</div>` : '<p class="muted">아직 비어 있어요. 다 자라면 수확해요!</p>'}
      <p class="muted" style="font-size:14px">토리에게 ${g.fed}번 줬어요${g.fed % 10 ? ` · ${10 - g.fed % 10}번 더 주면 토리가 스티커를 줘요` : ''}</p></div>
    <div class="panel"><h3>🥕 문제 풀며 주운 당근 <b>${g.carrots}</b>개</h3>
      <p class="muted" style="font-size:15px">한 번에 맞힐 때마다 당근을 하나 주워요. ${GOLD_COST}개를 모으면 황금 씨앗! 황금 씨앗을 키우면 도감 친구가 와요.</p>
      <div class="meter"><i style="width:${Math.min(100, Math.round(g.carrots / GOLD_COST * 100))}%"></i></div>
      ${g.carrots >= GOLD_COST ? `<button class="btn" data-a="goldseed">당근 ${GOLD_COST}개 → 황금 씨앗 바꾸기 ✨</button>` : ''}</div>
  </section>`;
};
function gSay(t, expr){ const b = $('#gSay'); if (b) b.textContent = t; speak(t); const st = $('#gTori'); if (st && expr) st.innerHTML = stageHTML(120, { expr, size:92, cls:'hop' }); }
function gardenFriend(){
  const own = S.collect || {}, pool = COLLECT.filter(c => !own[c.id]), c = pool.length ? pick(pool.filter(x => x.r >= 2).length ? pool.filter(x => x.r >= 2) : pool) : pick(COLLECT);
  S.collect = Object.assign({}, own, { [c.id]:(own[c.id] || 0) + 1 }); return c;
}
Object.assign(ACT, {
  plot(el){
    const g = gardenState(), i = +el.dataset.v, p = g.plots[i], st = plotStage(p);
    if (!p) { GARDEN_PICK = i; SFX.tap(); VIEWS.garden(); return; }
    if (st === 'ready') {
      const s = seedOf(p.s); g.plots[i] = null; g.harvests++;
      let msg = `${s.n} 수확! 바구니에 쏙!`;
      if (s.id === 'gold') { const c = gardenFriend(); msg = `무지개 꽃이 피었어! ${c.e} ${josa(c.n, '이', '가')} 도감 친구가 됐어!`; }
      else g.basket[s.id] = (g.basket[s.id] || 0) + 1;
      const nw = SEEDS.find(x => x.at === g.harvests); if (nw) msg += ` 새 씨앗 ${nw.e} ${josa(nw.n, '이', '가')} 생겼어!`;
      if (g.harvests === 10) msg += ' 밭도 두 칸 넓어졌어!';
      save(); SFX.sticker(); confetti(); VIEWS.garden(); gSay(msg, 'wow'); return;
    }
    if (!g.cans) { SFX.tap(); gSay('물뿌리개가 없어! 공부 한 판 끝내면 생겨.'); return; }
    g.cans--; p.w++; save(); SFX.water(); VIEWS.garden();
    const pl = document.querySelectorAll('.plot')[i]; if (pl) { pl.insertAdjacentHTML('beforeend', '<span class="drop">💧</span>'); }
    gSay(plotStage(p) === 'ready' ? '다 자랐다! 눌러서 수확해!' : pick(['쑥쑥 자라라!', '물 냠냠!', '조금만 더 크자!', '새싹이 기뻐해!']));
  },
  plant(el){ const g = gardenState(), id = el.dataset.v; if (GARDEN_PICK == null || g.plots[GARDEN_PICK]) return;
    if (id === 'gold') { if (!g.gold) return; g.gold--; }
    g.plots[GARDEN_PICK] = { s:id, w:0, at:todayKey() }; GARDEN_PICK = null; save(); SFX.tap(); VIEWS.garden(); gSay(`${seedOf(id).n} 씨앗을 심었어! 물을 주자!`); },
  plantcancel(){ GARDEN_PICK = null; VIEWS.garden(); },
  feed(el){ const g = gardenState(), id = el.dataset.v; if (!(g.basket[id] > 0)) return;
    g.basket[id]--; g.fed++; let msg = pick([`냠냠! 재윤이가 키운 ${seedOf(id).n} 최고야!`, `우와, ${seedOf(id).n} 정말 맛있다!`, '배가 든든해! 고마워 재윤아!']);
    if (g.fed % 10 === 0) { const st = funBonusSticker('feed'); msg += ` 고마워서 스티커 줄게! ${st}`; }
    save(); SFX.tap(); VIEWS.garden(); gSay(msg, 'love'); },
  goldseed(){ const g = gardenState(); if (g.carrots < GOLD_COST) return; g.carrots -= GOLD_COST; g.gold++; save(); SFX.sticker(); VIEWS.garden(); gSay('황금 씨앗이 생겼어! 빈 밭에 심어 봐!', 'wow'); },
  evtell(){ const ev = dayEvent(), fr = ev.id === 'friend' ? funFriend() : null; speak(fr ? `오늘은 ${josa(fr.n, '이', '가')} 놀러 왔어! 같이 공부하자!` : `오늘은 ${ev.name}! ${ev.desc}`); },
  huntc(el){ const e = funDay(); el.remove(); if ((e.found || 0) >= 3) return; e.found = (e.found || 0) + 1; SFX.find();
    if (e.found >= 3) { const st = funBonusSticker('hunt'); toast(`🥕 황금 당근 3개 다 찾았다! 보너스 스티커 ${st}`); } else toast(`🥕 황금 당근 찾았다! (${e.found}/3)`);
    save(); },
});

/* ---------- 4. 재윤이가 오빠에게 문제 내기 ---------- */
const KQ = { list:{}, ans:{}, flushing:false, mem:[], err:'' };
let KQP = null;   // 만드는 중인 문제
/* 11/5 "재윤이가 문제 냈는데 오빠한테 안 왔어": 보낼 문제를 localStorage에만 두었는데, 태블릿 저장 공간이 차 있으면
   조용히 못 쓰고 사라질 수 있었다(화면은 "보냈어!"). 보내기가 멈춰도(fetch가 끝없이 기다림) 다시 안 보냈다.
   → 보낼 문제는 메모리에도 두고, 한 문제씩 따로 보내고(하나가 막혀도 나머지는 감), 그날 공부 기록(d.kq, 늘 잘 가는 길)에도 글을 남긴다 */
function kqQueue(){ let st = []; try { st = JSON.parse(localStorage.getItem('jaeyun-kqq') || '[]'); } catch (e) {}
  const m = {}; st.concat(KQ.mem).forEach(x => { if (x && x.id && !KQ.list[x.id]) m[x.id] = x; }); return Object.values(m); }
function kqSetQueue(q){ KQ.mem = q.slice(); try { q.length ? localStorage.setItem('jaeyun-kqq', JSON.stringify(q)) : localStorage.removeItem('jaeyun-kqq'); } catch (e) {
  try { localStorage.setItem('jaeyun-kqq', JSON.stringify(q.map(x => Object.assign({}, x, { img:'' })))); } catch (e2) {} } }
/* 그날 공부 기록에 남긴 문제 (그림 빼고) — 서버 kq 문서가 아직 없어도 오빠·엄마 폰에 보이게 */
function kqFromDays(){ const out = []; Object.values(S.days || {}).forEach(d => (d && d.kq || []).forEach(x => { if (x && x.id) out.push(x); })); return out; }
function kqLocalAns(){ try { return JSON.parse(localStorage.getItem('jaeyun-kqa') || '{}'); } catch (e) { return {}; } }
function kqAll(){ const m = Object.assign({}, KQ.list); kqQueue().forEach(x => { if (!m[x.id]) m[x.id] = Object.assign({ pending:true }, x); });
  kqFromDays().forEach(x => { if (!m[x.id]) m[x.id] = Object.assign({ viaDay:true }, x); }); return Object.values(m).sort((a, b) => b.at - a.at); }
function kqAns(id){ return KQ.ans[id] || kqLocalAns()[id] || null; }
async function kqFlush(){
  if (!linked() || !Sync.ready || KQ.flushing || navigator.onLine === false) return;
  KQ.flushing = true; let bad = 0;
  try { for (const x of kqQueue()) {
    try { const doc = Object.assign({}, x); delete doc.id; delete doc.pending; await Sync.write(`${Sync.base()}/kq/${x.id}`, doc); KQ.list[x.id] = x; kqSetQueue(kqQueue().filter(y => y.id !== x.id)); KQ.err = ''; }
    catch (e) { bad++; KQ.err = String(e && e.message || e).slice(0, 120); } } }
  finally { KQ.flushing = false; }
  if (bad) { clearTimeout(KQ.t); KQ.t = setTimeout(kqFlush, 30000); }
}
function kqOnList(snap){ let ch = false; snap.docs.forEach(d => { const x = Object.assign({ id:d.id }, d.data()); if (JSON.stringify(KQ.list[d.id]) !== JSON.stringify(x)) { KQ.list[d.id] = x; ch = true; } }); if (ch) kqRefresh(); }
function kqOnAns(snap){ let ch = false; snap.docs.forEach(d => { const x = d.data(); if (JSON.stringify(KQ.ans[d.id]) !== JSON.stringify(x)) { KQ.ans[d.id] = x; ch = true; } }); if (ch) kqRefresh(); }
function kqRefresh(){ if (SCREEN === 'kq' && !(KQP && KQP.step === 'draw')) { const y = scrollY; VIEWS.kq(); scrollTo(0, y); } else if (['home','adult'].includes(SCREEN)) refreshIfIdle(); }
function kqScore(){ let kid = 0, op = 0; kqAll().forEach(x => { const a = kqAns(x.id); if (a) { if (a.right) op++; else kid++; } }); return { kid, op }; }
const kqNorm = s => String(s || '').replace(/[\s.!?~,'"]/g, '').toLowerCase();
function kqQText(x){ return x.type === 'calc' ? `${x.a} ${x.op === '-' ? '−' : '+'} ${x.b} = ?` : x.type === 'riddle' ? x.text : '그림을 보고 무엇인지 맞혀 봐요'; }
VIEWS.kq = () => {
  const P = KQP, sc = kqScore(), mine = kqAll().slice(0, 10);
  const numpad = t => `<div class="numpad kq-pad">${[1,2,3,4,5,6,7,8,9].map(n => `<button data-a="kqnum" data-v="${n}">${n}</button>`).join('')}<button data-a="kqnum" data-v="del">지우기</button><button data-a="kqnum" data-v="0">0</button><button class="ok" data-a="kqnum" data-v="ok">${t}</button></div>`;
  let body = '';
  if (!P) body = `<div class="hero" style="min-height:0">${stageHTML(120, { expr:'wow', size:92 })}<div class="bubble left">오빠한테 문제를 내 볼까? 오빠가 틀리면 재윤이가 이기는 거야!</div></div>
    <div class="kq-score"><span>🐰 재윤이 <b>${sc.kid}</b></span><span>:</span><span><b>${sc.op}</b> 오빠 🎁</span></div>
    <div class="kq-types"><button data-a="kqtype" data-v="calc"><span>➕</span><b>덧셈 · 뺄셈 문제</b><small>숫자를 골라서 계산 문제 내기</small></button>
      <button data-a="kqtype" data-v="draw"><span>🎨</span><b>그림 퀴즈</b><small>그림을 그리면 오빠가 맞히기</small></button>
      <button data-a="kqtype" data-v="riddle"><span>🤔</span><b>수수께끼</b><small>글로 문제 내기</small></button></div>`;
  else if (P.type === 'calc') {
    const slot = (k, v) => `<button class="kq-slot ${P.focus === k ? 'on' : ''}" data-a="kqfocus" data-v="${k}">${v === '' ? '?' : v}</button>`;
    body = P.step === 'make' ? `<div class="bubble">숫자 칸을 누르고 아래에서 숫자를 골라요. 0부터 99까지!</div>
      <div class="kq-eq">${slot('a', P.a)}<button class="kq-op" data-a="kqop">${P.op === '-' ? '−' : '+'}</button>${slot('b', P.b)}<span>=</span><span class="kq-q">?</span></div>
      <p class="muted" style="text-align:center;font-size:14px">+ − 를 누르면 바뀌어요</p>${numpad('다 골랐어')}`
      : `<div class="bubble">문제를 내려면 재윤이가 먼저 정답을 알아야 해! ${esc(kqQText(P))}</div>
      <div class="kq-eq"><span>${P.a}</span><span>${P.op === '-' ? '−' : '+'}</span><span>${P.b}</span><span>=</span><span class="kq-slot on">${P.my === '' ? '?' : P.my}</span></div>${numpad('정답 확인')}`;
  } else if (P.type === 'draw') {
    body = P.step === 'draw' ? `<div class="bubble">오빠가 맞힐 그림을 그려요! 다 그리면 "다 그렸어"</div>
      <div class="pen-wrap"><canvas id="pen" class="pen-canvas kq-canvas" aria-label="그림 그리는 칸"></canvas><button class="btn ghost small" data-a="kqclear">지우고 다시</button></div>
      <button class="btn mint big" data-a="kqdrawn">다 그렸어</button>`
      : `${P.img ? `<img class="photo-prev" src="${P.img}" alt="재윤이 그림" style="max-height:220px;object-fit:contain;background:#fff">` : ''}
      <div class="field"><label for="kqAns">이 그림의 정답은? (오빠한테는 안 보여요)</label><input type="text" id="kqAns" maxlength="20" value="${esc(P.ans || '')}" placeholder="예: 토끼"></div>
      <div class="field"><label for="kqHint">힌트 (안 써도 돼요)</label><input type="text" id="kqHint" maxlength="40" value="${esc(P.hint || '')}" placeholder="예: 귀가 길어요"></div>
      <button class="btn big" data-a="kqsend">오빠한테 보내기 🎲</button>`;
  } else if (P.type === 'riddle') {
    body = `<div class="field"><label for="kqText">수수께끼 문제</label><textarea id="kqText" rows="3" maxlength="120" placeholder="예: 나는 낮에는 안 보이고 밤에만 반짝여요. 나는 누구일까요?">${esc(P.text || '')}</textarea></div>
      <div class="field"><label for="kqAns">정답 (오빠한테는 안 보여요)</label><input type="text" id="kqAns" maxlength="20" value="${esc(P.ans || '')}" placeholder="예: 별"></div>
      <button class="btn big" data-a="kqsend">오빠한테 보내기 🎲</button>`;
  }
  if (P && P.sent) body = `<div class="sug-done">${stageHTML(140, { expr:'love', size:100, cls:'hop' })}<b class="disp">오빠한테 문제를 보냈어! 🎲</b><span class="muted">오빠가 풀면 여기서 결과를 볼 수 있어.</span><button class="btn" data-a="kqnew">문제 하나 더 내기</button></div>`;
  app().innerHTML = `<section class="screen kq">
    <div class="row"><button class="icon-btn" data-a="kqback" aria-label="돌아가기">${ICON.back}</button><h2 style="flex:1">🎲 오빠에게 문제 내기</h2></div>
    ${body}
    ${mine.length ? `<div class="panel"><h3>내가 낸 문제</h3><div class="list">${mine.map(x => { const a = kqAns(x.id);
      return `<div class="li" style="flex-wrap:wrap"><span class="grow" style="flex:1;min-width:55%">${x.type === 'draw' ? '🎨 그림 퀴즈' : esc(kqQText(x))} <span class="muted">(정답 ${esc(x.ans)})</span>${a ? `<br><span class="muted" style="font-size:14px">${a.by === 'mom' ? '엄마' : '오빠'} 답: ${esc(a.guess)}${a.msg ? ` · "${esc(a.msg)}"` : ''}</span>` : ''}</span>
        ${a ? (a.right ? `<span class="pill">${a.by === 'mom' ? '엄마' : '오빠'}가 맞혔어 ✓</span>` : `<span class="pill ok">${a.by === 'mom' ? '엄마' : '오빠'}가 틀렸어! 재윤이 승 🎉</span>`) : `<span class="pill wait">${x.pending ? (linked() ? '보내는 중…' : '이 기기에만') : '기다리는 중'}</span>`}</div>`; }).join('')}</div></div>` : ''}
  </section>`;
  if (P && P.type === 'draw' && P.step === 'draw') setupPen(1);
};
/* 그림은 긴 쪽 720px · jpeg로 줄여서 보낸다 (태블릿 화면 그대로면 커서 저장·보내기가 무거움) */
function kqShrink(){ const cv = $('#pen'); if (!cv) return null; const sc = Math.min(1, 720 / Math.max(cv.width, cv.height));
  const c = document.createElement('canvas'); c.width = Math.round(cv.width * sc); c.height = Math.round(cv.height * sc);
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(cv, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', .7); }
function kqStart(type){ KQP = { type, step: type === 'calc' ? 'make' : type === 'draw' ? 'draw' : 'write', a:'', b:'', op:'+', focus:'a', my:'', tries:0 }; }
function kqSave(){ const a = $('#kqAns'), h = $('#kqHint'), t = $('#kqText'); if (KQP) { if (a) KQP.ans = a.value.trim(); if (h) KQP.hint = h.value.trim(); if (t) KQP.text = t.value.trim(); } }
function kqSubmit(){
  const P = KQP; if (!P || P.sent) return;
  const doc = { type:P.type, ans:String(P.ans), at:Date.now(), d:todayKey() };
  if (P.type === 'calc') Object.assign(doc, { a:+P.a, b:+P.b, op:P.op });
  if (P.type === 'draw') Object.assign(doc, { img:P.img || '', hint:P.hint || '' });
  if (P.type === 'riddle') doc.text = P.text;
  const id = 'q' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  const q = kqQueue(); q.push(Object.assign({ id }, doc)); kqSetQueue(q);
  // 그날 공부 기록에도 (그림은 빼고): 공부 기록과 같은 길로 가서, kq 문서가 막혀도 오빠·엄마 폰에 문제가 보인다
  const dk = day(); dk.kq = (dk.kq || []).concat(Object.assign({ id }, doc, { img:'' })).slice(-20);
  kqFlush();
  const n = { to:'oppa', text:`🎲 재윤이가 오빠에게 문제를 냈어요! ${P.type === 'draw' ? '(그림 퀴즈)' : `"${kqQText(doc).slice(0, 40)}"`} 오빠 탭에서 풀어 주세요`, at:Date.now(), d:todayKey() };
  if (role() === 'kid' || !linked()) { S.notes.unshift(n); trimNotes(); Sync.addNote(n); }
  const e = funDay(); let st = '';
  if (dayEvent().id === 'quiz' && !e.quiz) { e.quiz = true; st = funBonusSticker('quiz'); }
  save(); P.sent = true; SFX.sticker();
  VIEWS.kq(); speak('오빠한테 문제를 보냈어! 오빠가 맞힐 수 있을까?'); if (st) toast(`🎲 오빠 퀴즈 날 보너스 스티커 ${st}`);
}
Object.assign(ACT, {
  kq(){ KQP = null; go('kq'); },
  kqtype(el){ kqStart(el.dataset.v); SFX.tap(); VIEWS.kq(); },
  kqback(){ if (KQP && !KQP.sent) { KQP = null; VIEWS.kq(); return; } KQP = null; go('home'); },
  kqnew(){ KQP = null; VIEWS.kq(); },
  kqfocus(el){ KQP.focus = el.dataset.v; VIEWS.kq(); },
  kqop(){ KQP.op = KQP.op === '+' ? '-' : '+'; SFX.tap(); VIEWS.kq(); },
  kqnum(el){
    const P = KQP, v = el.dataset.v; if (!P) return;
    if (P.step === 'make') {
      if (v === 'del') P[P.focus] = String(P[P.focus]).slice(0, -1);
      else if (v === 'ok') {
        if (P.a === '' || P.b === '') { toast('숫자 두 개를 다 골라 주세요'); return; }
        if (P.op === '-' && +P.a < +P.b) { toast('뺄셈은 큰 수에서 작은 수를 빼요!'); speak('뺄셈은 큰 수에서 작은 수를 빼야 해!'); return; }
        P.step = 'check'; P.my = ''; speak('이제 재윤이가 먼저 정답을 맞혀 봐!'); }
      else { const cur = String(P[P.focus]); P[P.focus] = (cur === '0' ? '' : cur).length < 2 ? (cur === '0' ? '' : cur) + v : cur; if (String(P[P.focus]).length >= 2 && P.focus === 'a') P.focus = 'b'; }
    } else {
      if (v === 'del') P.my = P.my.slice(0, -1);
      else if (v === 'ok') { if (P.my === '') return; const ans = P.op === '-' ? +P.a - +P.b : +P.a + +P.b;
        if (+P.my === ans) { P.ans = String(ans); SFX.right(); speak('딩동댕! 이제 오빠한테 보내자!'); kqSubmit(); return; }
        P.tries++; SFX.wrong(); P.my = '';
        if (P.tries >= 3) { toast(`정답은 ${ans}이야. 같이 확인했으니 이제 보내자!`); P.ans = String(ans); kqSubmit(); return; }
        speak(P.tries === 1 ? '앗, 다시 계산해 볼까?' : '손가락이나 그림으로 천천히 세어 봐!'); }
      else if (P.my.length < 3) P.my += v;
    }
    SFX.tap(); VIEWS.kq();
  },
  kqclear(){ setupPen(1); },
  kqdrawn(){ if (!PEN.drawn) { toast('먼저 그림을 그려 주세요'); return; } KQP.img = kqShrink(); KQP.step = 'write'; VIEWS.kq(); speak('이 그림의 정답을 써 줘. 오빠한테는 안 보여!'); },
  kqsend(){ kqSave(); const P = KQP;
    if (P.type === 'riddle' && !P.text) { toast('수수께끼 문제를 써 주세요'); return; }
    if (!P.ans) { toast('정답을 써 주세요'); return; }
    kqSubmit(); },
  /* 오빠·엄마: 재윤이 문제 풀기 */
  kqguess(el){ const id = el.dataset.id, x = kqAll().find(y => y.id === id), inp = $('#kqg_' + id); if (!x || !inp) return;
    const g = inp.value.trim(); if (!g) { toast('답을 써 주세요'); return; }
    const right = x.type === 'calc' ? Number(g) === Number(x.ans) : kqNorm(g) === kqNorm(x.ans);
    const msg = ($('#kqm_' + id) || {}).value || '';
    const v = { guess:g, right, at:Date.now(), by: role() === 'mom' || (role() === 'all' && S.adultTab === 'mom') ? 'mom' : 'oppa', msg:msg.trim().slice(0, 60) };
    KQ.ans[id] = v;
    if (!linked() || x.pending) { const l = kqLocalAns(); l[id] = v; try { localStorage.setItem('jaeyun-kqa', JSON.stringify(l)); } catch (e) {} }
    else Sync.write(`${Sync.base()}/kqa/${id}`, v).catch(() => toast('보내지 못했어요. 인터넷을 확인해 주세요'));
    toast(right ? '정답! 재윤이에게 "맞혔어"로 보여요' : `땡! 정답은 "${x.ans}". 재윤이가 이겼어요 🎉`);
    const y = scrollY; VIEWS.adult(); scrollTo(0, y); },
  kqseen(){ try { localStorage.setItem('jaeyun-kqseen', String(Date.now())); } catch (e) {} KQP = null; go('kq'); },
});
document.addEventListener('input', e => { if (KQP && e.target && ['kqAns','kqHint','kqText'].includes(e.target.id)) kqSave(); });
function kqPanel(){
  const all = kqAll(), todo = all.filter(x => !kqAns(x.id)), sc = kqScore(), done = all.filter(x => kqAns(x.id)).slice(0, 5);
  return `<div class="panel kq-box"><h3>🎲 재윤이가 낸 문제 ${todo.length ? `<span class="pill">풀 문제 ${todo.length}</span>` : ''}</h3>
    <p class="muted" style="font-size:14px">재윤이 ${sc.kid} : ${sc.op} 오빠·엄마 · 틀려 주면 재윤이가 아주 좋아해요 😉</p>
    ${todo.length ? todo.map(x => `<div class="li kq-item" style="display:grid;gap:6px">
      <b>${x.type === 'calc' ? '➕ 계산 문제' : x.type === 'draw' ? '🎨 그림 퀴즈' : '🤔 수수께끼'} <span class="muted" style="font-size:13px">${agoText(x.at)}</span></b>
      ${x.type === 'draw' && x.img ? `<img src="${x.img}" alt="재윤이 그림" style="max-width:100%;max-height:220px;object-fit:contain;background:#fff;border-radius:10px;border:2px solid var(--line)">` : x.type === 'draw' ? `<span class="muted">🎨 그림은 재윤이 태블릿에서 오는 중이에요. 태블릿에서 공부방 앱을 열면 와요.</span>` : `<span class="disp" style="font-size:22px">${esc(kqQText(x))}</span>`}
      ${x.hint ? `<span class="muted">힌트: ${esc(x.hint)}</span>` : ''}
      <div class="row" style="gap:6px;flex-wrap:wrap"><input type="${x.type === 'calc' ? 'number' : 'text'}" id="kqg_${x.id}" placeholder="답" style="flex:1;min-width:90px;border:2px solid var(--line);border-radius:12px;padding:8px"><input type="text" id="kqm_${x.id}" placeholder="재윤이에게 한마디" maxlength="60" style="flex:2;min-width:140px;border:2px solid var(--line);border-radius:12px;padding:8px"><button class="btn small" data-a="kqguess" data-id="${x.id}">답하기</button></div></div>`).join('')
      : `<p class="muted">${all.length ? '다 풀었어요 ✓' : '아직 재윤이가 낸 문제가 없어요. 재윤이 첫 화면 "🎲 오빠에게 문제 내기"에서 낼 수 있어요.'}</p>`}
    ${done.length ? `<div class="list">${done.map(x => { const a = kqAns(x.id); return `<div class="li"><span class="grow">${x.type === 'draw' ? '🎨' : esc(kqQText(x))} → ${esc(a.guess)}</span><span class="pill ${a.right ? '' : 'ok'}">${a.right ? '맞힘' : '재윤이 승'}</span></div>`; }).join('')}</div>` : ''}</div>`;
}
/* 재윤이 첫 화면: 오빠가 풀었으면 결과 보러 가기 */
function kqKidBanner(){
  let seen = 0; try { seen = +localStorage.getItem('jaeyun-kqseen') || 0; } catch (e) {}
  const news = kqAll().filter(x => { const a = kqAns(x.id); return a && a.at > seen; });
  if (!news.length) return '';
  const win = news.filter(x => !kqAns(x.id).right).length;
  return `<button class="alarm-banner" data-a="kqseen" style="width:100%;text-align:left;border-color:var(--sky);background:var(--sky-pale, #E4F1FB)"><span style="font-size:28px">🎲</span><span style="flex:1">${win ? `오빠가 재윤이 문제를 틀렸대! 재윤이 승 🎉` : '오빠가 재윤이 문제를 풀었어! 결과 보러 가자'}</span></button>`;
}

/* ---------- 5. 오빠·엄마 깜짝 응원 (판이 끝날 때 가끔) ---------- */
function cheerList(){ return (S.cheers || []).filter(c => c && (c.audio || c.text)); }
function cheerPick(){
  const L = cheerList(); if (!L.length || Math.random() > .55) return null;
  let last = ''; try { last = localStorage.getItem('jaeyun-cheerlast') || ''; } catch (e) {}
  const pool = L.length > 1 ? L.filter(c => c.id !== last) : L, c = pick(pool);
  try { localStorage.setItem('jaeyun-cheerlast', c.id); } catch (e) {}
  return c;
}
function cheerRewardHTML(c){ if (!c) return ''; const who = c.who === 'mom' ? '엄마' : '오빠';
  return `<div class="bubble cheer-box" style="display:flex;align-items:center;gap:10px;align-self:stretch"><span style="font-size:30px">💌</span><span style="flex:1"><b>${who}의 깜짝 응원이 왔어!</b>${c.text ? `<br>${esc(c.text)}` : ''}</span>${c.audio ? `<button class="speak-btn" style="width:48px;height:48px" data-a="cheerplay" data-v="${c.id}" aria-label="${who} 응원 듣기">${ICON.speak}</button>` : ''}</div>`; }
function cheersPanel(who){
  const L = cheerList().filter(c => (c.who || 'oppa') === who), name = who === 'mom' ? '엄마' : '오빠', recKey = 'cheer:' + who;
  return `<div class="panel"><h3>💌 ${name}의 깜짝 응원 <small class="muted">${L.length}개</small></h3>
    <p class="muted" style="font-size:15px">여러 개 남겨 두면 재윤이가 판을 끝낼 때 가끔 하나씩 무작위로 나와요. "재윤아, 받아쓰기 연습한 거 다 봤어!"처럼 짧게.</p>
    <div class="row" style="justify-content:center;gap:16px"><button class="rec-btn ${RECORDING === recKey ? 'on' : ''}" data-a="rec" data-v="${recKey}">${RECORDING === recKey ? '멈추기' : '녹음'}</button>
      <label class="btn ghost small file-btn">파일 올리기<input type="file" accept="audio/*,.m4a,.mp3" data-ch="audio" data-v="${recKey}"></label></div>
    ${cheerIdeasHTML(who)}
    <div class="field"><label for="cheertxt_${who}">글로 남기는 응원</label><input type="text" id="cheertxt_${who}" maxlength="60" placeholder="재윤아, 오늘도 화이팅!"></div>
    <button class="btn sky small" data-a="cheertext" data-v="${who}" style="justify-self:start">응원 글 저장</button>
    ${L.length ? `<div class="list">${L.map(c => `<div class="li"><span class="grow">${c.audio ? '🎤 녹음' : '✏️'} ${esc(c.text || '')} <span class="muted" style="font-size:12px">${shortDate(keyOf(new Date(c.at)))}</span></span>${c.audio ? `<button class="btn ghost small" data-a="cheerplay" data-v="${c.id}">듣기</button>` : ''}<button class="btn ghost small" data-a="cheerdel" data-v="${c.id}">지우기</button></div>`).join('')}</div>` : ''}</div>`;
}
function cheerAdd(who, audio, text){ S.cheers = [...(S.cheers || []), { id:'c' + Date.now().toString(36), who, audio:audio || null, text:text || '', at:Date.now() }].slice(-30); save(); }
Object.assign(ACT, {
  cheerplay(el){ const c = cheerList().find(x => x.id === el.dataset.v); if (c && c.audio) { stopSound(); playClip(c.audio); } else if (c) speak(c.text); },
  cheerdel(el){ S.cheers = (S.cheers || []).filter(x => x.id !== el.dataset.v); save(); const y = scrollY; go('adult'); scrollTo(0, y); },
  cheertext(el){ const who = el.dataset.v, inp = $('#cheertxt_' + who), t = inp && inp.value.trim(); if (!t) { toast('응원 글을 써 주세요'); return; } cheerAdd(who, null, t); toast('응원을 저장했어요. 재윤이가 판을 끝낼 때 가끔 나와요'); const y = scrollY; go('adult'); scrollTo(0, y); },
});
window.addEventListener('online', () => kqFlush());
document.addEventListener('visibilitychange', () => { if (!document.hidden) kqFlush(); });
