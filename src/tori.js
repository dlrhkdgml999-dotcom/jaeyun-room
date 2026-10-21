/* ===================== 토리랑 놀기: 누르면 말하고 움직여요 ===================== */
/* 귀 · 얼굴 · 몸을 누르면 반응이 달라요. 길게 누르거나 문지르면 쓰다듬기, 빨리 여러 번 누르면 어지러워해요.
   공부를 다 하기 전에는 너무 오래 놀지 않게, 많이 누르면 다음 판으로 안내해요.
   누른 횟수는 이 기기 메모리에만 있어요 (기록 · 동기화에 안 들어감) */
const Tori = (() => {
  const N = () => S.bunnyName || '토리';
  const SUBJ_SHORT = { kor:'국어', math:'수학', eng:'영어', rev:'복습' };
  const EAR_LINES = ['귀는 간지러워~ 히히!', '쫑긋쫑긋! 재윤이 목소리 잘 들려!', '귀를 파닥파닥! 날아갈 것 같아!', () => `${josa(N(), '이', '')} 귀 보들보들하지?`, '귀 잡으면 안 돼~ 살살 만져 줘!'];
  const BODY_LINES = ['깡충깡충! 같이 뛰자!', '빙글빙글 춤추기! 재윤이도 따라 해 봐!', () => `쿵짝쿵짝~ ${josa(N(), '이', '')} 춤 어때?`, '배 누르면 간지러워! 꺄르르!', '높이 뛰기! 재윤이도 할 수 있어?'];
  const PET_LINES = ['기분 좋아~ 재윤이 손 따뜻해!', '쓰담쓰담 최고야~', () => `${josa(N(), '이', '')} 행복해! 재윤이 사랑해!`, '음~ 포근해서 졸려질 것 같아~', '재윤이가 쓰다듬어 주면 힘이 쑥쑥 나!'];
  const DIZZY_LINES = ['어지러워~ 빙글빙글~', () => `살살 눌러 줘~ ${josa(N(), '이', '')} 눈이 핑글핑글!`, '우와와~ 세상이 빙글빙글 돌아~'];
  const EN_LINES = [['Hello, Jaeyun!', '안녕, 재윤아!'], ['I love you!', '사랑해!'], ['You are my best friend!', '너는 내 제일 친한 친구야!'], ["Let's study together!", '같이 공부하자!'], ['Good job!', '잘했어!'], ['Hop, hop, hop!', '깡충깡충깡충!'], ['You are so smart!', '너는 정말 똑똑해!']];
  /* 수수께끼: 한 번 누르면 문제, 다시 누르면 정답 */
  const RIDDLES = [
    ['하늘에서 하얗게 내려와요. 손에 닿으면 사르르 녹아요. 나는 누구게?', '눈'],
    ['아침마다 동쪽에서 떠올라요. 쳐다보면 눈이 부셔요. 나는 누구게?', '해'],
    [() => `${josa(N(), '이', '')} 제일 좋아하는 주황색 채소는? 길쭉하고 아삭아삭해!`, '당근'],
    ['다리가 여덟 개! 실로 줄을 쳐서 집을 지어요. 나는 누구게?', '거미'],
    ['비 오는 날 꼭 필요해요. 펴면 동그랗고 접으면 길쭉해요. 나는 뭐게?', '우산'],
    ['목이 아주아주 길어서 높은 나뭇잎도 냠냠 먹어요. 나는 누구게?', '기린'],
    ['숫자 열두 개가 빙 둘러 있고, 바늘 두 개가 빙글빙글 돌아요. 나는 뭐게?', '시계'],
    ['여름에 시원하게 먹어요. 겉은 초록 줄무늬, 속은 빨갛고 씨는 까매요. 나는 뭐게?', '수박'],
    ['밤하늘에서 반짝반짝! 그림으로 그리면 뾰족한 데가 다섯 개야. 나는 뭐게?', '별'],
    [() => `1 더하기 1은 뭐게? 힌트! ${josa(N(), '이', '')} 귀 개수랑 같아!`, '2! 귀가 두 개니까', true],
    ['3 더하기 4는 뭐게? 손가락으로 세어 봐!', '7', true],
    ['아침에 일어나서, 밥 먹고 나서 꼭 해요. 치카치카! 무엇을 할까?', '이 닦기'],
  ];
  const txt = l => typeof l === 'function' ? l() : l;
  const recent = [];
  function fresh(list){   // 방금 한 말은 다시 안 하게
    const cand = list.map(txt).filter(t => !recent.includes(t));
    const t = pick(cand.length ? cand : list.map(txt));
    recent.push(t); if (recent.length > 8) recent.shift();
    return t;
  }

  /* ---------- 지금 상황에 맞는 말 ---------- */
  function contextLines(){
    const out = [], d = day(), h = now().getHours();
    if (d.done) out.push(`오늘 공부 다 했지? 쪽! ${josa(N(), '이', '가')} 뽀뽀해 줄게!`, '오늘도 해냈어! 재윤이 최고야!', '이제 꾸미기 하러 갈까?');
    else { const nb = nextBoard(d); if (nb) out.push(`오늘은 ${SUBJ_SHORT[nb.k]}부터 해 볼까?`, `${SUBJ_SHORT[nb.k]} 하러 가자! ${josa(N(), '이', '가')} 응원할게!`); }
    try { const left = S.gift.goal - giftDays().length; if (!giftAch() && left > 0) out.push(`오빠 선물까지 ${left}일 남았어! 힘내자!`); } catch (e) {}
    const worn = ITEMS.filter(i => i.slot !== 'bg' && S.equipped[i.slot] === i.id);
    if (worn.length) { const it = pick(worn); out.push(`${josa(N(), '이', '')} ${it.name} 어때? 예쁘지?`); }
    const fr = (S.friends || []).map(id => COLLECT.find(c => c.id === id)).filter(Boolean);
    if (fr.length) { const c = pick(fr); out.push(`${c.n}도 재윤이가 좋대!`); }
    const st = streakDays(); if (st >= 2) out.push(`우리 ${st}일 연속 같이 공부했어! 멋지다!`);
    if (S.stickers.length >= 5) out.push(`스티커를 ${S.stickers.length}개나 모았어! 대단해!`);
    if (h < 9) out.push('하암~ 아직 조금 졸려~ 재윤이는 잘 잤어?');
    else if (h >= 20) out.push('벌써 깜깜해졌네. 일찍 자야 쑥쑥 커!');
    return out;
  }

  /* ---------- 화면 효과 ---------- */
  const timers = new WeakMap();
  function bunnyIn(el){ return el && (el.querySelector('svg.bunny')); }
  function anim(svg, cls, ms = 900){
    if (!svg) return;
    ['hop','wiggle','t-spin','t-flap','t-dance','t-shy','t-bigjump','t-nod'].forEach(c => svg.classList.remove(c));
    void svg.getBoundingClientRect(); svg.classList.add(cls);
    setTimeout(() => svg.classList.remove(cls), ms + 100);
  }
  function setExpr(svg, expr, ms = 1800){
    if (!svg) return;
    const f = faceParts(expr), e = svg.querySelector('.eyes'), m = svg.querySelector('.mouth'); if (!e || !m) return;
    e.innerHTML = f.eyes; m.innerHTML = f.mouth;
    svg.className.baseVal = svg.className.baseVal.replace(/\be-\w+/, 'e-' + expr);
    clearTimeout(timers.get(svg));
    timers.set(svg, setTimeout(() => { const base = svg.dataset.expr || 'normal', g = faceParts(base); e.innerHTML = g.eyes; m.innerHTML = g.mouth; svg.className.baseVal = svg.className.baseVal.replace(/\be-\w+/, 'e-' + base); }, ms));
  }
  function fx(stage, x, y, chars, n = 5){
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const cx = x == null ? r.width / 2 : x - r.left, cy = y == null ? r.height * .4 : y - r.top;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span'); s.className = 'tori-fx'; s.textContent = pick(chars);
      s.style.left = (cx + (Math.random() - .5) * 60) + 'px'; s.style.top = (cy + (Math.random() - .5) * 30) + 'px';
      s.style.setProperty('--dx', ((Math.random() - .5) * 70).toFixed(0) + 'px'); s.style.animationDelay = (i * 70) + 'ms';
      stage.appendChild(s); setTimeout(() => s.remove(), 1500 + i * 70);
    }
  }
  /* 말풍선: 홈은 옆 말풍선, 꾸미기 방은 토리 위에 작은 풍선 */
  function bubble(stage, text){
    const hb = $('#heroBubble');
    if (hb && stage && stage.closest('.hero')) { hb.textContent = text; hb.classList.remove('t-pop'); void hb.offsetWidth; hb.classList.add('t-pop'); return; }
    if (!stage) return;
    let b = stage.querySelector('.tori-say');
    if (!b) { b = document.createElement('span'); b.className = 'tori-say'; stage.appendChild(b); }
    b.textContent = text; b.classList.remove('t-pop'); void b.offsetWidth; b.classList.add('t-pop');
    clearTimeout(b._t); b._t = setTimeout(() => b.remove(), 4200);
  }
  /* 말하는 동안 입이 움직여요 */
  let talkSeq = 0;
  async function say(stage, parts){
    const svg = bunnyIn(stage), my = ++talkSeq, seq = ++SEQ;
    if (svg) svg.classList.add('talking');
    for (const [t, lang] of parts) { if (seq !== SEQ) break; await speak(t, lang); }
    if (my === talkSeq && svg) svg.classList.remove('talking');
  }
  function talk(stage, text){ bubble(stage, text); return say(stage, [[text, 'ko-KR']]); }

  /* ---------- 누르기 ---------- */
  let taps = [], petAt = 0, riddle = null, playN = 0, playDay = '';
  const zoneOf = (svg, ev) => {
    if (!svg || !ev || (!ev.clientX && !ev.clientY)) return 'face';
    const r = svg.getBoundingClientRect(), y = (ev.clientY - r.top) / r.height, x = (ev.clientX - r.left) / r.width;
    if (x < -.05 || x > 1.05 || y < 0 || y > 1.02) return 'body';
    return y < .4 ? 'ears' : y < .77 ? 'face' : 'body';
  };
  /* 공부 끝나기 전에는 12번쯤 놀면 다음 판을 알려 줘요 */
  function needNudge(){
    const t = todayKey(); if (playDay !== t) { playDay = t; playN = 0; }
    playN++;
    const d = day(); if (d.done || !(SCREEN === 'home')) return null;
    if (playN >= 12 && playN % 6 === 0) { const nb = nextBoard(d); return nb || null; }
    return null;
  }
  let dizzyUntil = 0;
  function tap(el, ev){
    if (Date.now() - petAt < 600) return;   // 쓰다듬기 끝난 직후 클릭은 무시
    const svg = bunnyIn(el), stage = el, t = Date.now();
    if (t < dizzyUntil) { fx(stage, ev && ev.clientX, ev && ev.clientY, ['💫'], 1); return; }   // 어지러운 동안은 별만
    taps = taps.filter(x => t - x < 2500); taps.push(t);
    if (riddle && t - riddle.at < 90000) {   // 수수께끼 정답 (공부 안내보다 먼저)
      const r = riddle; riddle = null; needNudge();
      anim(svg, 't-bigjump', 900); setExpr(svg, 'wow', 2600); fx(stage, null, null, ['🎉','⭐','✨'], 6);
      SFX.right();
      const a = r[2] ? `딩동댕! 정답은 ${r[1]}!` : `딩동댕! 정답은 ${josa(r[1], '이야', '야')}!`;
      return talk(stage, a + ' 재윤이 맞혔어?');
    }
    if (taps.length >= 6) {   // 너무 빨리 많이 누르면
      taps = []; dizzyUntil = t + 2200; needNudge();
      anim(svg, 't-spin', 1000); setExpr(svg, 'dizzy', 2200); fx(stage, null, null, ['💫','⭐'], 4);
      tone([[660,0,.12,'sine'],[523,.12,.12,'sine'],[440,.24,.2,'sine']]);
      return talk(stage, fresh(DIZZY_LINES));
    }
    const nb = needNudge();
    if (nb) {
      anim(svg, 't-nod', 700); setExpr(svg, 'wink', 2200);
      const card = document.querySelector(`.board-card[data-k="${nb.k}"]`); if (card) { card.classList.remove('t-call'); void card.offsetWidth; card.classList.add('t-call'); }
      tone([[988,0,.1],[1318,.1,.18]]);
      return talk(stage, pick([`재윤아, 공부 먼저 하고 또 놀자! 오늘은 ${SUBJ_SHORT[nb.k]}부터!`, `${josa(N(), '이', '가')} 여기서 기다릴게! ${SUBJ_SHORT[nb.k]} 하고 와서 또 놀자!`]));
    }
    const zone = zoneOf(svg, ev), x = ev && ev.clientX, y = ev && ev.clientY;
    if (zone === 'ears') {
      anim(svg, 't-flap', 900); setExpr(svg, 'happy', 1600); fx(stage, x, y, ['✨','💗'], 3);
      tone([[1568,0,.06],[1760,.07,.06],[1568,.14,.1]]);
      return talk(stage, fresh(EAR_LINES));
    }
    if (zone === 'body') {
      const dance = Math.random() < .5;
      anim(svg, dance ? 't-dance' : 't-bigjump', dance ? 1200 : 900); setExpr(svg, 'happy', 1800); fx(stage, x, y, ['🎵','🎶','⭐'], 4);
      tone(dance ? [[784,0,.1],[988,.15,.1],[1175,.3,.1],[988,.45,.14]] : [[523,0,.1],[1046,.12,.2]]);
      return talk(stage, fresh(BODY_LINES));
    }
    // 얼굴: 여러 가지 말
    const r = Math.random();
    if (r < .18) {
      riddle = Object.assign([...pick(RIDDLES)], { at:t }); riddle[0] = txt(riddle[0]);
      anim(svg, 'wiggle', 500); setExpr(svg, 'think', 3500); fx(stage, null, null, ['❓'], 2);
      tone([[880,0,.1],[1175,.12,.16]]);
      bubble(stage, '🤔 ' + riddle[0] + ` (${josa(N(), '을', '를')} 한 번 더 누르면 정답!)`);
      return say(stage, [[`${N()} 수수께끼!`, 'ko-KR'], [riddle[0], 'ko-KR']]);
    }
    if (r < .32) {
      const [e, k] = pick(EN_LINES);
      anim(svg, 'hop', 600); setExpr(svg, 'wink', 2400); fx(stage, x, y, ['💬','✨'], 3);
      tone([[1318,0,.08],[1568,.08,.12]]);
      bubble(stage, `${e}\n(${k})`);
      return say(stage, [[e, 'en-US'], [k, 'ko-KR']]);
    }
    const ctx = contextLines();
    const line = r < .62 && ctx.length ? fresh(ctx) : fresh(POKE_LINES);
    anim(svg, Math.random() < .5 ? 'hop' : 't-shy', 700); setExpr(svg, pick(['happy','wow','wink']), 1800); fx(stage, x, y, ['💗','✨','🥕'], 3);
    tone([[1318,0,.08],[1568,.08,.12]]);
    return talk(stage, line);
  }

  /* ---------- 쓰다듬기: 길게 누르거나 문지르기 ---------- */
  let hold = null;
  function pet(){
    if (!hold || hold.petted) return;
    hold.petted = true; petAt = Date.now();
    const svg = bunnyIn(hold.el);
    svg && svg.classList.add('t-purr'); setExpr(svg, 'love', 999999);
    tone([[392,0,.25,'sine',.08],[440,.25,.25,'sine',.08],[392,.5,.3,'sine',.08]]);
    talk(hold.el, fresh(PET_LINES));
    hold.heart = setInterval(() => { if (hold) fx(hold.el, hold.x, hold.y, ['💗','💕','💖'], 1); }, 260);
  }
  function endHold(){
    if (!hold) return;
    clearTimeout(hold.timer); clearInterval(hold.heart);
    if (hold.petted) { petAt = Date.now(); const svg = bunnyIn(hold.el); if (svg) { svg.classList.remove('t-purr'); setExpr(svg, 'happy', 1500); } }
    hold = null;
  }
  document.addEventListener('pointerdown', ev => {
    const el = ev.target.closest && ev.target.closest('.tori-stage'); if (!el) return;
    endHold();
    hold = { el, x:ev.clientX, y:ev.clientY, sx:ev.clientX, sy:ev.clientY, dist:0, petted:false };
    hold.timer = setTimeout(pet, 600);
  });
  document.addEventListener('pointermove', ev => {
    if (!hold) return;
    hold.dist += Math.hypot(ev.clientX - hold.x, ev.clientY - hold.y); hold.x = ev.clientX; hold.y = ev.clientY;
    if (!hold.petted && hold.dist > 70) pet();
  });
  ['pointerup','pointercancel'].forEach(t => document.addEventListener(t, endHold));
  document.addEventListener('contextmenu', ev => { if (ev.target.closest && ev.target.closest('.tori-stage')) ev.preventDefault(); });

  /* ---------- 가만히 있을 때 혼자 꼼지락 (소리 없이) ---------- */
  let lastTouch = Date.now();
  ['pointerdown','keydown'].forEach(t => document.addEventListener(t, () => lastTouch = Date.now(), true));
  setInterval(() => {
    if (!['home','room'].includes(SCREEN) || document.hidden || hold || Date.now() - lastTouch < 12000) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const svg = document.querySelector('.tori-stage svg.bunny'); if (!svg || svg.classList.contains('talking')) return;
    const h = now().getHours(), r = Math.random();
    if (h >= 21 && r < .5) { setExpr(svg, 'sleepy', 2500); anim(svg, 't-nod', 700); return; }
    if (r < .35) anim(svg, 't-flap', 900);
    else if (r < .6) anim(svg, 'wiggle', 500);
    else if (r < .8) { anim(svg, 'hop', 600); }
    else setExpr(svg, 'wink', 900);
  }, 9000);

  return { tap, talk, contextLines, RIDDLES, _state:() => ({ taps:taps.length, playN, riddle:!!riddle }) };
})();
