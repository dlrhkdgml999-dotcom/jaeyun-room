'use strict';
/* ===================== 재윤이 공부방 ===================== */

/* ---------- 작은 도구들 ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DOW = ['일','월','화','수','목','금','토'];
function hasBatchim(word){ const c = word.charCodeAt(word.length - 1) - 0xAC00; return c >= 0 && c <= 11171 && c % 28 !== 0; }
function josa(word, a, b){ return word + (hasBatchim(word) ? a : b); }
function numRo(n){ return [true,false,false,true,false,false,true,false,false,false][n % 10] ? '으로' : '로'; }
function numJosa(n, a, b){ const d = n % 10; const has = [true,true,false,true,false,false,true,true,true,false][d]; return n + (has ? a : b); }

/* ---------- 저장 ---------- */
const STORE_KEY = 'jaeyun-room-v1';
let MEM = null;
function freshState(){
  return {
    v:1, started:false, bunnyName:'토리', pin:'0000', dayOffset:0,
    days:{}, stickers:[], equipped:{head:null,face:null,neck:null,bg:null}, seenItems:[],
    wrong:[], avgSec:{kor:50,math:50,eng:32,rev:45}, dictUsed:{},
    praise:null, voices:{}, notes:[], kidNotes:[],
    alarms:{on:[true,true,true,true,true,true,true], time:['10:00','16:00','16:00','16:00','16:00','16:00','10:00'], nudge:true},
    adultTab:'mom', local:null,
    level:{ kor:1, math:1, eng:0 }, mathMode:'curr', curr:null, currs:{}, modes:{ kor:'curr', eng:'curr' }, ebsOn:{ math:true, kor:true }, lastLec:null,
    tts:{ preset:'tori', voice:'', pitch:1.35, rate:.86, enVoice:'' },
    gift:{ name:'', goal:30, round:1, start:null, achieved:null, history:[] }, giftAch:{}, grades:{},
  };
}
function loadState(){
  let s = null;
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) s = JSON.parse(raw); } catch (e) {}
  if (!s) s = MEM;
  const base = freshState();
  if (!s) return base;
  return Object.assign(base, s, { alarms: Object.assign(base.alarms, s.alarms || {}), avgSec: Object.assign(base.avgSec, s.avgSec || {}), gift: Object.assign(base.gift, s.gift || {}), tts: Object.assign(base.tts, s.tts || {}), level: Object.assign(base.level, s.level || {}) });
}
let S = loadState();
let saveWarned = false;
function prunePhotos(){
  // 받아쓰기 사진은 최근 7일 것만 이 폰에 남긴다
  const cut = addDays(todayKey(), -7);
  Object.entries(S.days).forEach(([k, d]) => { if (k < cut && d.dict && d.dict.photo) d.dict.photo = null; });
}
function save(){ saveLocal(); if (!Sync.applying) Sync.schedule(); }
function saveLocal(){
  MEM = S;
  prunePhotos();
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
  catch (e) {
    // 저장 공간이 부족하면 오래된 받아쓰기 사진부터 지운다
    const keys = Object.keys(S.days).sort();
    for (const k of keys) { const d = S.days[k]; if (d.dict && d.dict.photo && gradeOf(k).graded) { d.dict.photo = null; try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); return; } catch (e2) {} } }
    if (!saveWarned) { saveWarned = true; toast('이 폰의 저장 공간이 부족해요. 녹음 파일 크기를 줄여 주세요.'); }
  }
}

/* ---------- 날짜 ---------- */
function now(){ const d = new Date(); d.setDate(d.getDate() + (S.dayOffset || 0)); return d; }
function keyOf(d){ return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
function todayKey(){ return keyOf(now()); }
function addDays(k, n){ const [y,m,d] = k.split('-').map(Number); const t = new Date(y, m - 1, d); t.setDate(t.getDate() + n); return keyOf(t); }
function korDate(d){ return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DOW[d.getDay()]}요일`; }
function shortDate(k){ const [, m, d] = k.split('-').map(Number); return `${m}/${d}`; }
function day(k = todayKey()){
  if (!S.days[k]) S.days[k] = { boards:{}, dict:null, earned:[], bonus:false, done:false, m2:false };
  return S.days[k];
}

/* ---------- 소리 ---------- */
let AC = null;
function tone(seq){
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    const t0 = AC.currentTime;
    seq.forEach(([f, st, dur, type = 'triangle', vol = .16]) => {
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0 + st); g.gain.linearRampToValueAtTime(vol, t0 + st + .02);
      g.gain.exponentialRampToValueAtTime(.001, t0 + st + dur);
      o.connect(g).connect(AC.destination); o.start(t0 + st); o.stop(t0 + st + dur + .05);
    });
  } catch (e) {}
}
const SFX = {
  right: () => tone([[1046,0,.18],[1318,.12,.32]]),
  wrong: () => tone([[392,0,.16,'sine',.1],[311,.14,.26,'sine',.1]]),
  tap:   () => tone([[880,0,.06,'triangle',.06]]),
  sticker: () => tone([[784,0,.15],[988,.1,.15],[1175,.2,.15],[1568,.3,.5]]),
};
let voices = [];
function loadVoices(){ try { voices = speechSynthesis.getVoices() || []; } catch (e) {} }
if ('speechSynthesis' in window) { loadVoices(); try { speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {} }
let curAudio = null, speakTimer = null, SEQ = 0;
function stopSound(){
  try { if (curAudio) { curAudio.pause(); curAudio = null; } } catch (e) {}
  try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) {}
  clearTimeout(speakTimer);
}
function speak(text, lang = 'ko-KR', rate){
  return new Promise(res => {
    try {
      if (!('speechSynthesis' in window)) return res();
      stopSound();
      const u = new SpeechSynthesisUtterance(softText(text));
      const en = lang.startsWith('en'), t = S.tts;
      u.lang = lang;
      u.rate = en ? clamp(t.rate * .9, .6, 1.2) : clamp(t.rate * (rate ? rate / .92 : 1), .5, 1.4);
      u.pitch = en ? clamp(t.pitch * .9, .8, 1.6) : t.pitch;
      const v = pickVoice(en ? 'en' : 'ko', en ? t.enVoice : t.voice);
      if (v) { u.voice = v; u.lang = v.lang || lang; }
      let done = false; const fin = () => { if (!done) { done = true; res(); } };
      u.onend = fin; u.onerror = fin;
      speechSynthesis.speak(u);
      speakTimer = setTimeout(fin, 1500 + text.length * 220);
    } catch (e) { res(); }
  });
}
/* 기계처럼 끊기지 않게: 물결표·느낌표를 부드러운 쉼으로 */
function softText(t){ return String(t).replace(/~/g, '').replace(/!+/g, '!').replace(/\s*·\s*/g, ', '); }
/* 폰에 깔린 목소리 중에서 고르기. 따로 고른 게 없으면 부드러운 여성 목소리를 먼저 찾는다 */
function langVoices(lg){ return voices.filter(v => (v.lang || '').replace('_','-').toLowerCase().startsWith(lg)); }
function pickVoice(lg, name){
  const list = langVoices(lg); if (!list.length) return null;
  if (name) { const v = list.find(v => v.name === name); if (v) return v; }
  const soft = /female|woman|여성|여자|yuna|sunhi|heami|seoyeon|jimin|sora|samantha|zira|aria|jenny|ism|kob/i;
  return list.find(v => soft.test(v.name) && !v.localService) || list.find(v => soft.test(v.name)) || list.find(v => !v.localService) || list[0];
}
const TTS_PRESETS = {
  tori:  { name:'토리 목소리 (귀엽게)', pitch:1.35, rate:.86 },
  sister:{ name:'언니 목소리 (밝게)', pitch:1.2, rate:.92 },
  teacher:{ name:'선생님 목소리 (차분하게)', pitch:1.02, rate:.85 },
};
function playClip(src){
  return new Promise(res => {
    try {
      stopSound();
      const a = new Audio(src); curAudio = a;
      let done = false; const fin = () => { if (!done) { done = true; res(true); } };
      a.onended = fin; a.onerror = () => { done = true; res(false); };
      const p = a.play(); if (p && p.catch) p.catch(() => { done = true; res(false); });
    } catch (e) { res(false); }
  });
}

/* 엄마 목소리 6개 */
const MOM_LINES = [
  {id:'m1', text:'재윤이 고생했어~', when:'한 판을 끝냈을 때'},
  {id:'m2', text:'재윤이 공부해야지', when:'공부 시간 알림이 떴을 때'},
  {id:'m3', text:'재윤이 국어 공부할까?', when:'국어 시작할 때'},
  {id:'m4', text:'재윤이 수학 공부할까?', when:'수학 시작할 때'},
  {id:'m5', text:'재윤이 영어 공부할까?', when:'영어 시작할 때'},
  {id:'m6', text:'재윤이 복습 할까?', when:'복습 시작할 때'},
];
async function playMom(id){
  const line = MOM_LINES.find(l => l.id === id);
  const src = S.voices[id] || (typeof DEFAULT_VOICES !== 'undefined' && DEFAULT_VOICES[id]);
  if (src) { const ok = await playClip(src); if (ok) return 'mom'; }
  await speak(line.text);
  return 'bunny';
}

/* ---------- 토끼 ---------- */
const INK = '#5B3A4A';
function itemSVG(id){
  switch (id) {
    case 'bow-pink': case 'bow-mint': {
      const c = id === 'bow-pink' ? '#FF8FB1' : '#7FD8BE', x = id === 'bow-pink' ? 134 : 66, r = id === 'bow-pink' ? 18 : -18;
      return `<g transform="translate(${x} 84) rotate(${r})"><path d="M0 0 L-24 -15 Q-31 0 -24 15 Z" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M0 0 L24 -15 Q31 0 24 15 Z" fill="${c}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><circle r="7.5" fill="${c}" stroke="${INK}" stroke-width="3.5"/></g>`;
    }
    case 'flower':
      return `<g transform="translate(136 86)">${[0,72,144,216,288].map(a => `<circle cx="${(10*Math.cos(a*Math.PI/180)).toFixed(1)}" cy="${(10*Math.sin(a*Math.PI/180)).toFixed(1)}" r="8" fill="#FFF" stroke="${INK}" stroke-width="3"/>`).join('')}<circle r="7" fill="#FFD43B" stroke="${INK}" stroke-width="3"/></g>`;
    case 'crown':
      return `<g transform="translate(100 74)"><path d="M-30 12 L-30 -14 L-15 0 L0 -22 L15 0 L30 -14 L30 12 Z" fill="#FFD43B" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="0" cy="3" r="4.5" fill="#FF8FB1"/><circle cx="-18" cy="5" r="3.5" fill="#8CC9FF"/><circle cx="18" cy="5" r="3.5" fill="#8CC9FF"/></g>`;
    case 'tiara':
      return `<g transform="translate(100 76)"><path d="M-34 10 Q0 -8 34 10" fill="none" stroke="#C3ADF2" stroke-width="7" stroke-linecap="round"/><path d="M0 -24 L5 -12 L18 -11 L8 -3 L11 10 L0 3 L-11 10 L-8 -3 L-18 -11 L-5 -12 Z" fill="#FFE08A" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>`;
    case 'rainbow':
      return `<g fill="none" stroke-linecap="round"><path d="M44 112 Q100 50 156 112" stroke="#F0524F" stroke-width="7"/><path d="M50 114 Q100 58 150 114" stroke="#FFD43B" stroke-width="6"/><path d="M56 116 Q100 66 144 116" stroke="#7FD8BE" stroke-width="6"/></g>`;
    case 'glasses-heart': {
      const heart = x => `<path transform="translate(${x} 128) scale(1.55)" d="M0 7 C-15 -3 -11 -16 0 -8 C11 -16 15 -3 0 7 Z" fill="rgba(255,143,177,.35)" stroke="#EE5F8D" stroke-width="2.4" stroke-linejoin="round"/>`;
      return heart(76) + heart(124) + `<path d="M92 122 Q100 116 108 122" fill="none" stroke="#EE5F8D" stroke-width="3.5"/>`;
    }
    case 'glasses-round':
      return `<circle cx="76" cy="127" r="16" fill="rgba(255,255,255,.25)" stroke="${INK}" stroke-width="3.5"/><circle cx="124" cy="127" r="16" fill="rgba(255,255,255,.25)" stroke="${INK}" stroke-width="3.5"/><path d="M92 125 Q100 119 108 125" fill="none" stroke="${INK}" stroke-width="3.5"/>`;
    case 'cheek-star': {
      const star = (x, y) => `<path transform="translate(${x} ${y})" d="M0 -9 L2.6 -2.8 L9 -2.8 L3.8 1.4 L5.6 8 L0 4 L-5.6 8 L-3.8 1.4 L-9 -2.8 L-2.6 -2.8 Z" fill="#FFD43B" stroke="${INK}" stroke-width="2"/>`;
      return star(52, 150) + star(148, 150);
    }
    case 'scarf':
      return `<path d="M62 176 Q100 198 138 176 L140 190 Q100 212 60 190 Z" fill="#F0524F" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M118 192 L126 222 L140 218 L132 188 Z" fill="#F0524F" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
    case 'bowtie':
      return `<g transform="translate(100 190)"><path d="M0 0 L-20 -12 L-20 12 Z" fill="#C3ADF2" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M0 0 L20 -12 L20 12 Z" fill="#C3ADF2" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><circle r="6" fill="#8A67D6" stroke="${INK}" stroke-width="3"/></g>`;
    case 'pearls': {
      let s = '';
      for (let i = 0; i <= 8; i++) { const t = i / 8, x = (1-t)*(1-t)*70 + 2*(1-t)*t*100 + t*t*130, y = (1-t)*(1-t)*180 + 2*(1-t)*t*204 + t*t*180; s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#FFF8F0" stroke="${INK}" stroke-width="2"/>`; }
      return s;
    }
    default: return '';
  }
}
function bunnySVG(o = {}){
  const expr = o.expr || 'normal';
  const eq = o.eq || S.equipped || {};
  const size = o.size || 140;
  let eyes, mouth;
  if (expr === 'happy') {
    eyes = `<path d="M66 129 Q76 116 86 129" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M114 129 Q124 116 134 129" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    mouth = `<path d="M90 146 Q100 160 110 146 Z" fill="#E35A7F" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  } else if (expr === 'wow') {
    eyes = `<ellipse cx="76" cy="126" rx="9" ry="11" fill="${INK}"/><circle cx="79" cy="121" r="3.5" fill="#fff"/><circle cx="73" cy="131" r="1.8" fill="#fff"/><ellipse cx="124" cy="126" rx="9" ry="11" fill="${INK}"/><circle cx="127" cy="121" r="3.5" fill="#fff"/><circle cx="121" cy="131" r="1.8" fill="#fff"/>`;
    mouth = `<ellipse cx="100" cy="150" rx="6" ry="7" fill="#E35A7F" stroke="${INK}" stroke-width="3"/>`;
  } else if (expr === 'think') {
    eyes = `<ellipse cx="76" cy="127" rx="7" ry="9" fill="${INK}"/><circle cx="78" cy="123" r="2.6" fill="#fff"/><path d="M116 128 Q124 124 132 128" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    mouth = `<path d="M93 148 Q100 144 107 148" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  } else {
    eyes = `<ellipse cx="76" cy="127" rx="7" ry="9" fill="${INK}"/><circle cx="78" cy="123" r="2.6" fill="#fff"/><ellipse cx="124" cy="127" rx="7" ry="9" fill="${INK}"/><circle cx="126" cy="123" r="2.6" fill="#fff"/>`;
    mouth = `<path d="M91 145 Q95.5 151 100 145 Q104.5 151 109 145" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  const cape = eq.neck === 'cape' ? `<path d="M66 176 L36 232 Q100 244 164 232 L134 176 Z" fill="#C3ADF2" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>` : '';
  const neck = eq.neck && eq.neck !== 'cape' ? itemSVG(eq.neck) : (eq.neck === 'cape' ? `<path d="M80 182 Q100 192 120 182" fill="none" stroke="#8A67D6" stroke-width="5" stroke-linecap="round"/><circle cx="100" cy="188" r="5" fill="#FFD43B" stroke="${INK}" stroke-width="2.5"/>` : '');
  return `<svg class="bunny ${o.cls || ''}" width="${size}" height="${Math.round(size * 1.2)}" viewBox="0 0 200 240" aria-hidden="true">
  ${cape}
  <g class="ear-l"><ellipse cx="72" cy="58" rx="20" ry="50" transform="rotate(-12 72 58)" fill="#fff" stroke="${INK}" stroke-width="4"/><ellipse cx="73" cy="64" rx="9" ry="34" transform="rotate(-12 73 64)" fill="#FFC2D4"/></g>
  <g class="ear-r"><ellipse cx="128" cy="58" rx="20" ry="50" transform="rotate(12 128 58)" fill="#fff" stroke="${INK}" stroke-width="4"/><ellipse cx="127" cy="64" rx="9" ry="34" transform="rotate(12 127 64)" fill="#FFC2D4"/></g>
  <ellipse cx="100" cy="204" rx="44" ry="27" fill="#fff" stroke="${INK}" stroke-width="4"/>
  <ellipse cx="78" cy="228" rx="15" ry="9" fill="#fff" stroke="${INK}" stroke-width="4"/><ellipse cx="122" cy="228" rx="15" ry="9" fill="#fff" stroke="${INK}" stroke-width="4"/>
  <ellipse cx="100" cy="128" rx="66" ry="56" fill="#fff" stroke="${INK}" stroke-width="4"/>
  ${eq.head === 'rainbow' ? itemSVG('rainbow') : ''}
  <ellipse cx="60" cy="146" rx="12" ry="7.5" fill="#FFB3C7" opacity=".85"/><ellipse cx="140" cy="146" rx="12" ry="7.5" fill="#FFB3C7" opacity=".85"/>
  ${eyes}
  <path d="M95.5 137 Q100 133.5 104.5 137 Q100 142 95.5 137 Z" fill="#FF8FB1" stroke="#EE5F8D" stroke-width="1.5"/>
  ${mouth}
  ${eq.face ? itemSVG(eq.face) : ''}
  ${eq.head && eq.head !== 'rainbow' ? itemSVG(eq.head) : ''}
  ${neck}
</svg>`;
}
function stageHTML(h, o = {}){ return `<div class="stage ${S.equipped.bg || 'bg-none'}" style="height:${h}px">${bunnySVG(o)}</div>`; }
const ICON = {
  speak:`<svg viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="#fff"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>`,
  close:`<svg viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  back:`<svg viewBox="0 0 24 24" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>`,
  lock:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
  paw:`<svg viewBox="0 0 40 40"><ellipse cx="20" cy="26" rx="10" ry="8.5" fill="#FF8FB1"/><ellipse cx="9" cy="16" rx="4.2" ry="5.2" fill="#FF8FB1"/><ellipse cx="16" cy="9.5" rx="4.2" ry="5.2" fill="#FF8FB1"/><ellipse cx="24" cy="9.5" rx="4.2" ry="5.2" fill="#FF8FB1"/><ellipse cx="31" cy="16" rx="4.2" ry="5.2" fill="#FF8FB1"/></svg>`,
};

/* ---------- 문제 만들기: 국어 ---------- */
function dec(ch){ const c = ch.charCodeAt(0) - 0xAC00; if (c < 0 || c > 11171) return null; return [Math.floor(c / 588), Math.floor((c % 588) / 28), c % 28]; }
function com(i, m, f){ return String.fromCharCode(0xAC00 + i * 588 + m * 28 + f); }
const FIN = [0,1,4,7,8,16,17,19,21];
const MSWAP = {0:4,4:0,1:5,5:1,8:13,13:8,18:20,20:18,6:12,12:6};
function fakeSyl(ch){
  const d = dec(ch); if (!d) return '가';
  if (Math.random() < .6 || MSWAP[d[1]] === undefined) return com(d[0], d[1], pick(FIN.filter(f => f !== d[2])));
  return com(d[0], MSWAP[d[1]], d[2]);
}
function qPic(it){
  const [e, w, d1, d2] = it;
  return { key:'kor:pic:' + w, subj:'kor', type:'pic', prompt:'그림에 맞는 낱말을 골라요', say:'그림에 맞는 낱말을 골라 봐요', vis:{k:'pic', e}, input:'choice', cols:3, opts:shuffle([w, d1, d2]), ans:w, hint:`첫 글자는 '${w[0]}'${hasBatchim(w[0]) ? '이에요' : '예요'}. 받침을 잘 봐요!`, explain:`이 그림은 '${w}'${hasBatchim(w) ? '이라고' : '라고'} 써요` };
}
function qRead(it){
  const [s, d1, d2] = it;
  return { key:'kor:read:' + s, subj:'kor', type:'read', prompt:'잘 듣고, 바르게 쓴 것을 골라요', say:'잘 듣고 바르게 쓴 것을 골라 봐요.', listen:s, vis:{k:'listen'}, input:'choice', cols:1, opts:shuffle([s, d1, d2]), ans:s, hint:'소리 나는 대로 쓰지 않아요. 받침을 살려서 쓴 것을 찾아요!', explain:`[${d1}]처럼 들려도 '${s}'${hasBatchim(s) ? '이라고' : '라고'} 써요` };
}
function qMimic(it){
  const [e, before, after, ans, d1, d2] = it;
  return { key:'kor:mimic:' + before + ans, subj:'kor', type:'mimic', prompt:'빈칸에 어울리는 말을 골라요', say:`${before}, 어떻게 ${after}? 어울리는 말을 골라 봐요`, vis:{k:'sent', e, before, after}, input:'choice', cols:3, opts:shuffle([ans, d1, d2]), ans, hint:`${josa(before.split(' ')[0].replace(/[이가]$/, ''), '이', '가')} 어떤 모습인지, 어떤 소리를 내는지 떠올려 봐요`, explain:`${before} ${ans} ${after}` };
}
function qBuild(it){
  const [e, w] = it;
  const syl = [...w];
  const fakes = new Set();
  let guard = 0;
  while (fakes.size < 2 && guard++ < 30) { const f = fakeSyl(pick(syl)); if (!syl.includes(f)) fakes.add(f); }
  return { key:'kor:build:' + w, subj:'kor', type:'build', prompt:'잘 듣고 글자 블록으로 만들어요', say:'잘 듣고 글자 블록을 차례대로 눌러 봐요', listen:w, vis:{k:'pic', e}, input:'build', tiles:shuffle([...syl, ...fakes]), ans:w, hint:`첫 글자는 '${w[0]}'${hasBatchim(w[0]) ? '이에요' : '예요'}`, explain:`정답은 '${w}'${hasBatchim(w) ? '이에요' : '예요'}` };
}
function genKorBase(n){
  const pics = shuffle(PIC_WORDS), reads = shuffle(READ_SENTS), mims = shuffle(MIMIC), builds = shuffle(PIC_WORDS.filter(p => p[1].length >= 2));
  const order = ['pic','read','mimic','build','pic','read','build','mimic'];
  const out = []; const used = new Set();
  for (let i = 0; out.length < n && i < n * 3; i++) {
    const t = order[i % order.length];
    let q;
    if (t === 'pic') q = qPic(pics.pop() || pick(PIC_WORDS));
    else if (t === 'read') q = qRead(reads.pop() || pick(READ_SENTS));
    else if (t === 'mimic') q = qMimic(mims.pop() || pick(MIMIC));
    else q = qBuild(builds.pop() || pick(PIC_WORDS));
    if (used.has(q.key)) continue;
    used.add(q.key); out.push(q);
  }
  return out;
}

/* ---------- 문제 만들기: 수학 ---------- */
function framesHTML(cells){ // cells: array of 'a'|'b'|'x'|'' , length multiple of 10
  let s = '<div class="frames">';
  for (let f = 0; f < cells.length; f += 10) s += '<div class="frame">' + cells.slice(f, f + 10).map(c => `<i class="${c}"></i>`).join('') + '</div>';
  return s + '</div>';
}
function cellsFor(a, b = 0, crossFromEnd = 0){
  const total = a + b, len = Math.max(10, Math.ceil(total / 10) * 10);
  const arr = [];
  for (let i = 0; i < len; i++) arr.push(i < a ? 'a' : i < total ? 'b' : '');
  for (let i = 0; i < crossFromEnd; i++) arr[total - 1 - i] = (arr[total - 1 - i] || 'a') + ' x';
  return arr;
}
const M = {
  count(){ const n = rnd(6, 20); const [e, name] = pick(COUNT_THINGS);
    return { key:`math:count:${e}${n}`, type:'count', prompt:`${josa(name,'은','는')} 모두 몇 개일까요?`, vis:{k:'count', e, n}, input:'numpad', ans:n, hint:'5개씩 묶어서 세어 봐요. 5, 10, 15…', explain:`모두 ${n}개예요` }; },
  split(){ const t = rnd(5, 10), a = rnd(1, t - 1);
    return { key:`math:split:${t}-${a}`, type:'split', prompt:`${numJosa(t,'을','를')} 두 수로 가르기 해요`, say:`${numJosa(t,'을','를')} 가르기 해요. 빈칸에 알맞은 수는?`, vis:{k:'split', top:t, l:a, r:'?'}, input:'numpad', ans:t - a, hintHTML:framesHTML(cellsFor(a, t - a)), hint:`분홍 ${a}개와 민트 몇 개일까요?`, explain:`${numJosa(t,'은','는')} ${numJosa(a,'과','와')} ${t - a}${numRo(t - a)} 가를 수 있어요` }; },
  join(){ const a = rnd(1, 8), b = rnd(1, 10 - a);
    return { key:`math:join:${a}+${b}`, type:'join', prompt:`${numJosa(a,'과','와')} ${numJosa(b,'을','를')} 모으면 얼마일까요?`, vis:{k:'split', top:'?', l:a, r:b}, input:'numpad', ans:a + b, hintHTML:framesHTML(cellsFor(a, b)), hint:'분홍과 민트를 모두 세어 봐요', explain:`${numJosa(a,'과','와')} ${numJosa(b,'을','를')} 모으면 ${a + b}` }; },
  make10(){ const a = rnd(1, 9);
    return { key:`math:make10:${a}`, type:'make10', prompt:'10이 되려면 얼마가 더 필요할까요?', vis:{k:'eq', html:`${a} + <span class="q">?</span> = 10`}, input:'numpad', ans:10 - a, hintHTML:framesHTML(cellsFor(a)), hint:'빈칸이 몇 개 남았는지 세어 봐요', explain:`${a} + ${10 - a} = 10` }; },
  add(){ let a, b; if (Math.random() < .35) { a = rnd(1, 8); b = rnd(1, 9 - a); } else { a = rnd(3, 9); b = rnd(11 - a, 9); }
    return { key:`math:add:${a}+${b}`, type:'add', prompt:'덧셈을 해요', say:`${a} 더하기 ${b}는?`, vis:{k:'eq', html:`${a} + ${b} = <span class="q">?</span>`}, input:'numpad', ans:a + b, hintHTML:framesHTML(cellsFor(a, b)), hint: a + b > 10 ? `먼저 10을 만들어요. ${a}에 ${numJosa(10 - a,'을','를')} 더하면 10!` : '분홍과 민트를 모두 세어 봐요', explain:`${a} + ${b} = ${a + b}` }; },
  sub(){ let a, b; if (Math.random() < .35) { a = rnd(3, 10); b = rnd(1, a - 1); } else { a = rnd(11, 18); b = rnd(a - 9, 9); if (b <= a % 10) b = Math.min(9, a % 10 + 1); if (a - b >= 10) b = a - 9; }
    return { key:`math:sub:${a}-${b}`, type:'sub', prompt:'뺄셈을 해요', say:`${a} 빼기 ${b}는?`, vis:{k:'eq', html:`${a} − ${b} = <span class="q">?</span>`}, input:'numpad', ans:a - b, hintHTML:framesHTML(cellsFor(a, 0, b)), hint:`${a}개 중에서 ${b}개를 지웠어요. 남은 것을 세어 봐요`, explain:`${a} − ${b} = ${a - b}` }; },
  three(){ const a = rnd(1, 9), b = 10 - a, c = rnd(1, 9); const arr = shuffle([[a, b, c], [a, c, b], [c, a, b]])[0];
    return { key:`math:three:${arr.join('+')}`, type:'three', prompt:'세 수를 더해요', say:`${arr[0]} 더하기 ${arr[1]} 더하기 ${arr[2]}는?`, vis:{k:'eq', html:`${arr.join(' + ')} = <span class="q">?</span>`}, input:'numpad', ans:a + b + c, hint:`합이 10이 되는 두 수(${numJosa(a,'과','와')} ${b})를 먼저 더해요`, explain:`${a} + ${b} = 10, 10 + ${c} = ${10 + c}` }; },
  twodigit(){ let a, b, op; if (Math.random() < .5) { op = '+'; a = rnd(11, 88); b = rnd(1, 9 - a % 10); if (b < 1) { a = 31; b = 4; } } else { op = '−'; a = rnd(12, 99); if (a % 10 === 0) a += 3; b = rnd(1, a % 10); }
    const ans = op === '+' ? a + b : a - b;
    return { key:`math:2d:${a}${op}${b}`, type:'twodigit', prompt:`${op === '+' ? '덧셈' : '뺄셈'}을 해요`, say:`${a} ${op === '+' ? '더하기' : '빼기'} ${b}는?`, vis:{k:'eq', html:`${a} ${op} ${b} = <span class="q">?</span>`}, input:'numpad', ans, hint:`낱개끼리 계산해요. ${a % 10} ${op === '+' ? '+' : '−'} ${b} = ${op === '+' ? a % 10 + b : a % 10 - b}`, explain:`${a} ${op} ${b} = ${ans}` }; },
  compare(){ let a = rnd(10, 99), b = rnd(10, 99); while (b === a) b = rnd(10, 99);
    return { key:`math:cmp:${a}-${b}`, type:'compare', prompt:'더 큰 수를 골라요', say:'두 수 중에서 더 큰 수를 골라 봐요', vis:null, input:'choice', cols:2, opts:[a, b], ans:Math.max(a, b), big:true, hint:'십의 자리 숫자(앞자리)를 먼저 비교해요', explain:`${numJosa(Math.max(a, b),'이','가')} ${Math.min(a, b)}보다 커요` }; },
  tens(){ const t = rnd(1, 9), o = rnd(0, 9);
    return { key:`math:tens:${t}${o}`, type:'tens', prompt:'모두 얼마일까요?', say:`10개씩 묶음 ${t}개와 낱개 ${o}개는 얼마일까요?`, vis:{k:'tens', t, o}, input:'numpad', ans:t * 10 + o, hint:`10개씩 묶음 ${t}개는 ${t * 10}이에요`, explain:`${t * 10}과 ${numJosa(o,'이면','면')} ${t * 10 + o}` }; },
  clock(){ const h = rnd(1, 12), m = pick([0, 30]); const label = (hh, mm) => mm ? `${hh}시 30분` : `${hh}시`;
    const right = label(h, m); const c = new Set([right]); const nh = h % 12 + 1, ph = h === 1 ? 12 : h - 1;
    const cand = shuffle([label(h, m ? 0 : 30), label(nh, m), label(ph, m), label(m ? nh : h, m ? 0 : 30)]);
    for (const x of cand) { if (c.size >= 3) break; c.add(x); }
    return { key:`math:clock:${h}:${m}`, type:'clock', prompt:'시계가 몇 시를 가리키나요?', vis:{k:'clock', h, m}, input:'choice', cols:3, opts:shuffle([...c]), ans:right, hint: m ? '긴바늘이 6을 가리키면 30분이에요. 짧은바늘은 두 숫자 사이에 있어요' : '긴바늘이 12를 가리키면 "몇 시"예요. 짧은바늘을 봐요', explain:`정답은 ${right}` }; },
  pattern(){
    if (Math.random() < .55) {
      const pool = shuffle(['🍓','🍌','⭐','🌸','🐰','🍇','💖','🌙']);
      const kind = pick(['AB','ABC','AAB','ABB']);
      const unit = kind.split('').map(ch => pool['ABC'.indexOf(ch)]);
      const seq = []; while (seq.length < 8) seq.push(unit[seq.length % unit.length]);
      const ans = seq[7];
      const opts = shuffle([...new Set([...unit, pool[3]])]).slice(0, 3); if (!opts.includes(ans)) opts[0] = ans;
      return { key:`math:pat:${seq.join('')}`, type:'pattern', prompt:'규칙을 찾아 ?에 알맞은 것을 골라요', vis:{k:'pattern', items:seq.slice(0, 7)}, input:'choice', cols:3, pic:true, opts:shuffle(opts), ans, hint:`'${unit.join(' ')}'가 반복돼요`, explain:`${unit.join(' ')}이 되풀이돼요` };
    }
    const step = pick([1, 2, 5, 10]), start = step === 10 ? rnd(1, 4) * 10 : rnd(1, 20);
    const seq = [0, 1, 2, 3].map(i => start + step * i);
    return { key:`math:npat:${start}+${step}`, type:'npattern', prompt:'규칙을 찾아 ?에 알맞은 수를 써요', say:'규칙을 찾아서 다음에 올 수를 써 봐요', vis:{k:'eq', html:`${seq.join(', ')}, <span class="q">?</span>`, small:true}, input:'numpad', ans:start + step * 4, hint:`수가 ${step}씩 커지고 있어요`, explain:`${step}씩 커져서 ${start + step * 4}` };
  },
};
const MATH_W = {count:1, split:1.1, join:.9, make10:1.1, add:2.2, sub:2.2, three:.8, twodigit:1, compare:.8, tens:1, clock:1.1, pattern:1};
function genMathBase(n){
  const bag = []; Object.entries(MATH_W).forEach(([k, w]) => { for (let i = 0; i < Math.round(w * 4); i++) bag.push(k); });
  const out = [], used = new Set(); let lastType = '';
  for (let i = 0; out.length < n && i < n * 10; i++) {
    const t = pick(bag); if (t === lastType) continue;
    const q = M[t](); q.subj = 'math'; if (!q.say) q.say = q.prompt;
    if (used.has(q.key)) continue;
    used.add(q.key); out.push(q); lastType = t;
  }
  return out;
}

/* ---------- 문제 만들기: 영어 ---------- */
ENG.forEach((x, i) => { x.cat = x.c ? 'color' : x.n ? 'num' : i < 12 ? 'animal' : i < 20 ? 'fruit' : i < 35 ? 'thing' : 'body'; });
function engVis(w, big){
  const x = ENG_ALL.find(e => e.w === w);
  if (x.c) return `<span class="swatch" style="background:${x.c};${big ? 'width:110px;height:110px' : ''}"></span>`;
  if (x.n) return `<span class="disp" style="font-size:${big ? 88 : 46}px;color:#3E93E0">${x.n}</span>`;
  return big ? `<span class="pic">${x.e}</span>` : x.e;
}
function qEngListen(x){
  const others = shuffle(ENG_ALL.filter(e => e.cat === x.cat && e.w !== x.w)).slice(0, 2).map(e => e.w);
  return { key:'eng:listen:' + x.w, subj:'eng', type:'elisten', prompt:'잘 듣고 알맞은 그림을 골라요', say:'잘 듣고 알맞은 그림을 골라 봐요', listen:x.w, lang:'en-US', vis:{k:'listen'}, input:'choice', cols:3, pic:true, eng:true, opts:shuffle([x.w, ...others]), ans:x.w, hint:`'${x.w}'는 ${x.k}${hasBatchim(x.k) ? '이에요' : '예요'}. 다시 들어 봐요`, explain:`${x.w} = ${x.k}` };
}
function qEngPick(x){
  const others = shuffle(ENG_ALL.filter(e => e.cat === x.cat && e.w !== x.w)).slice(0, 2).map(e => e.w);
  return { key:'eng:pick:' + x.w, subj:'eng', type:'epick', prompt:'영어로 뭐라고 할까요? 노란 버튼으로 들어 봐요', say:'이건 영어로 뭐라고 할까? 노란 버튼을 눌러서 들어 봐', vis:{k:'eng', w:x.w}, input:'choice', cols:1, sayOpts:true, eng:true, opts:shuffle([x.w, ...others]), ans:x.w, hint:'버튼마다 소리를 들어 보고 골라요', explain:`${x.w} = ${x.k}` };
}
function genEngBase(n){
  const pool = shuffle(ENG); const out = [];
  for (let i = 0; i < n && pool.length; i++) { const x = pool.pop(); out.push(i % 3 === 2 ? qEngPick(x) : qEngListen(x)); }
  return out;
}

/* ---------- 복습 ---------- */
function dueWrong(subj){ const t = todayKey(); return S.wrong.filter(w => w.subj !== 'dict' && w.due <= t && w.served !== t && (!subj || w.subj === subj)); }
/* 많이 틀린 것, 오래 기다린 것부터 */
function takeDue(list, n){
  const t = todayKey();
  const picked = list.sort((a, b) => (b.misses - a.misses) || a.due.localeCompare(b.due)).slice(0, n);
  picked.forEach(w => w.served = t);
  return picked.map(w => Object.assign(JSON.parse(JSON.stringify(w.q)), { rev:w.id }));
}
function genReview(n){
  const due = takeDue(dueWrong(), n);
  const out = [...due];
  const fill = n - out.length;
  if (fill > 0) {
    const extra = [...genKor(Math.ceil(fill / 3)), ...genMath(Math.ceil(fill / 3)), ...genEng(Math.ceil(fill / 3))];
    shuffle(extra).slice(0, fill).forEach(q => { if (!out.some(o => o.key === q.key)) out.push(q); });
  }
  return shuffle(out);
}
/* soft: 힌트 보고 두 번째에 맞힌 문제 — 한 번만 더 맞히면 목록에서 빠진다 */
function addWrong(q, soft){
  const t = todayKey();
  const id = q.rev || q.key;
  const w = S.wrong.find(x => x.id === id);
  if (w) { w.streak = 0; w.due = addDays(t, 1); w.misses = (w.misses || 1) + (soft ? 0 : 1); w.last = t; }
  else { const clean = JSON.parse(JSON.stringify(q)); delete clean.rev; S.wrong.push({ id, subj:q.subj, q:clean, due:addDays(t, soft ? 2 : 1), streak:soft ? 1 : 0, misses:soft ? 0 : 1, added:t, last:t }); }
}
function reviewRight(q){
  const w = S.wrong.find(x => x.id === q.rev); if (!w) return;
  w.streak++; if (w.streak >= 2) S.wrong = S.wrong.filter(x => x !== w); else w.due = addDays(todayKey(), 3);
}

/* ---------- 받아쓰기 ---------- */
function pickDict(n){
  const t = todayKey();
  const again = S.wrong.filter(w => w.subj === 'dict' && w.due <= t).map(w => w.q.w);
  const rest = shuffle(dictBank().filter(w => !again.includes(w))).sort((a, b) => (S.dictUsed[a] || '').localeCompare(S.dictUsed[b] || ''));
  const words = [...again, ...rest].slice(0, n);
  words.forEach(w => S.dictUsed[w] = t);
  return words;
}

/* ---------- 판 정보 ---------- */
const BOARDS = [
  { k:'kor',  name:'국어', sub:'낱말 읽기 · 흉내 내는 말', badge:'가나', cls:'k-kor', mom:'m3' },
  { k:'math', name:'수학', sub:'덧셈 · 뺄셈 · 시계 · 규칙', badge:'123', cls:'k-math', mom:'m4' },
  { k:'eng',  name:'영어 · 받아쓰기', sub:'영어 단어 듣기 + 공책 받아쓰기', badge:'ABC', cls:'k-eng', mom:'m5' },
  { k:'rev',  name:'복습', sub:'전에 틀린 문제 다시 풀기', badge:'다시', cls:'k-rev', mom:'m6' },
];
const BNAME = Object.fromEntries(BOARDS.map(b => [b.k, b.name]));
function countFor(k){ const target = k === 'eng' ? 420 : 900; return clamp(Math.round(target / (S.avgSec[k] || 45)), k === 'eng' ? 8 : 10, 24); }
function boardState(k, d = day()){
  const b = d.boards[k];
  if (!b) return 'todo';
  if (b.done) return 'done';
  return 'doing';
}
function nextBoard(d = day()){ return BOARDS.find(b => boardState(b.k, d) !== 'done'); }

/* ---------- 알림(체험판에선 화면 안 알림함) ---------- */
function notify(to, text){ const n = { to, text, at:Date.now(), d:todayKey() }; if (!(linked() && role() !== 'kid' && SCREEN !== 'adult')) Sync.addNote(n); S.notes.unshift(n); S.notes = S.notes.slice(0, 80); }
function alarmInfo(){
  const d = now(), dow = d.getDay();
  if (!S.alarms.on[dow]) return null;
  const [hh, mm] = (S.alarms.time[dow] || '16:00').split(':').map(Number);
  const at = new Date(d); at.setHours(hh, mm, 0, 0);
  const started = Object.keys(day().boards).length > 0;
  return { time:S.alarms.time[dow], passed:d >= at, late:d - at >= 30 * 60000, started };
}

/* ---------- 재윤이 맞춤 말 ---------- */
function streakDays(){
  let n = day().done ? 1 : 0, k = addDays(todayKey(), -1);
  while (S.days[k] && S.days[k].done) { n++; k = addDays(k, -1); }
  return n;
}
function friendDays(){
  if (!S.firstDay) return 1;
  const [y1, m1, d1] = S.firstDay.split('-').map(Number), [y2, m2, d2] = todayKey().split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000) + 1;
}
function greeting(d){
  const n = now(), h = n.getHours(), dow = n.getDay(), wk = dow === 0 || dow === 6;
  const done = BOARDS.filter(b => boardState(b.k, d) === 'done').length;
  if (d.done) return n.getDate() % 2 ? '오늘 공부 끝! 재윤이 최고야! 이제 신나게 놀자!' : '재윤이 오늘도 해냈다! 토리랑 꾸미기 하러 갈래?';
  if (done > 0) return `${4 - done}판만 더 하면 끝이야. 재윤이는 할 수 있어!`;
  const st = streakDays();
  if (st >= 2) return `재윤이랑 ${st}일 연속 공부했어! 오늘도 같이 하자!`;
  const y = S.days[addDays(todayKey(), -1)];
  if (y && y.done) return '어제도 다 했지? 재윤이 정말 대단해! 오늘도 같이 하자!';
  if (h < 12) return '재윤아, 좋은 아침! 오늘도 반짝반짝 공부해 볼까?';
  if (h < 18) return wk ? '재윤아, 신나는 주말이야! 공부 먼저 하고 놀자!' : '재윤아, 학교 잘 다녀왔어? 토리가 기다렸어!';
  return '재윤아, 저녁 먹었어? 토리랑 같이 공부하자!';
}

/* ---------- 받아쓰기 채점 (엄마가 S.grades에 적고, 재윤이 기록에는 재윤이 기기가 반영) ---------- */
function gradeOf(k, create){
  if (!S.grades) S.grades = {};
  if (!S.grades[k] && create) { const dt = S.days[k] && S.days[k].dict; S.grades[k] = { marks:(dt ? dt.words : []).map(() => null), graded:false, score:0 }; }
  return S.grades[k] || { marks:[], graded:false, score:0 };
}
function applyGrades(){
  if (!canWriteKid()) return false;
  let changed = false;
  Object.entries(S.grades || {}).forEach(([k, g]) => {
    const dt = S.days[k] && S.days[k].dict; if (!g.graded || !dt || dt.applied) return;
    dt.applied = true; changed = true;
    dt.words.forEach((w, i) => { const id = 'dict:' + w; const ex = S.wrong.find(x => x.id === id);
      if (!g.marks[i]) { if (ex) { ex.misses++; ex.due = addDays(todayKey(), 1); } else S.wrong.push({ id, subj:'dict', q:{ w, subj:'dict' }, due:addDays(todayKey(), 1), streak:0, misses:1, added:todayKey() }); }
      else if (ex) S.wrong = S.wrong.filter(x => x !== ex); });
    S.kidNotes.unshift({ text: g.score === 10 ? '엄마가 받아쓰기를 채점했어. 10개 모두 맞았어! 백점이야!' : `엄마가 받아쓰기를 채점했어. 10개 중 ${g.score}개 맞았어! 틀린 건 다음에 다시 써 보자`, at:Date.now() });
    if (g.score === 10) S.stickers.push({ e:'💯', d:k, bonus:true });
    if (k !== todayKey()) dt.photo = null;
  });
  return changed;
}

/* ---------- 오빠 선물 약속 ---------- */
function giftAch(){ return (S.giftAch || {})[S.gift.round] || S.gift.achieved || null; }
function giftStart(){ if (!S.gift.start) { S.gift.start = S.firstDay || todayKey(); } return S.gift.start; }
function giftDays(){
  const st = giftStart(), end = giftAch() || '9999-12-31';
  return Object.keys(S.days).filter(k => k >= st && k <= end && S.days[k].done).sort();
}
function giftBox(size = 64, cls = ''){
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true"><rect x="14" y="42" width="72" height="48" rx="6" fill="#FF8FB1" stroke="${INK}" stroke-width="4"/><rect x="8" y="28" width="84" height="18" rx="5" fill="#FFC2D4" stroke="${INK}" stroke-width="4"/><rect x="44" y="28" width="12" height="62" fill="#FFE08A" stroke="${INK}" stroke-width="3"/><path d="M50 28 C40 8 18 12 28 26 Z" fill="#FFE08A" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><path d="M50 28 C60 8 82 12 72 26 Z" fill="#FFE08A" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="26" cy="64" r="3" fill="#fff"/><circle cx="74" cy="72" r="3" fill="#fff"/></svg>`;
}
function checkGift(){
  const g = S.gift; if (giftAch()) return false;
  if (giftDays().length >= g.goal) {
    S.giftAch = S.giftAch || {}; S.giftAch[g.round] = todayKey();
    notify('oppa', `🎁 재윤이가 ${g.goal}일 공부를 모두 해냈어요! 약속한 선물${g.name ? `(${g.name})` : ''}을 준비해 주세요`);
    notify('mom', `🎁 재윤이가 ${g.goal}일 공부를 모두 해냈어요! 오빠 선물 받는 날이에요`);
    return true;
  }
  return false;
}

/* ===================== 화면 ===================== */
const app = () => $('#app');
let SCREEN = 'home';
function go(name, arg){ ++SEQ; stopSound(); SCREEN = name; window.scrollTo(0, 0); (VIEWS[name] || VIEWS.home)(arg); }
function toast(msg){ const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }

const VIEWS = {};

/* ----- 첫 만남 ----- */
VIEWS.welcome = () => {
  app().innerHTML = `<section class="screen" style="justify-content:center;text-align:center;align-items:center">
    ${stageHTML(250, { expr:'wow', size:190, cls:'hop' })}
    <div class="bubble" style="max-width:340px">안녕, 재윤아! 나는 ${esc(josa(S.bunnyName,'이야','야'))}.<br>여기는 재윤이만을 위한 공부방이야.<br>오늘부터 재윤이랑 매일 같이 공부할 거야!</div>
    <button class="btn big" data-a="start">좋아, 같이 하자!</button>
  </section>`;
};

/* ----- 홈 ----- */
VIEWS.home = () => {
  if (!S.started) return VIEWS.welcome();
  const d = day(), nb = nextBoard(d), total = S.stickers.length;
  const doneCount = BOARDS.filter(b => boardState(b.k, d) === 'done').length;
  const al = alarmInfo();
  const greet = greeting(d);
  const g = S.gift, gd = giftDays().length;
  const nextItem = ITEMS.find(i => i.need > total);
  const prevNeed = ITEMS.filter(i => i.need <= total).reduce((m, i) => Math.max(m, i.need), 0);
  const kn = S.kidNotes[0];
  app().innerHTML = `<section class="screen">
    ${linked() && role() !== 'kid' ? `<button class="adult-peek" data-a="go" data-v="pin">${role() === 'mom' ? '엄마' : '오빠'} 폰에서 보는 재윤이 화면 (여기서 풀어 본 건 재윤이 기록에 안 들어가요) · <b>${role() === 'mom' ? '엄마' : '오빠'} 메뉴로 가기</b></button>` : ''}
    <div class="home-top">
      <span class="nameplate">재윤이 공부방</span><span class="spacer"></span>
      <span class="sticker-chip" aria-label="모은 스티커">⭐ ${total}</span>
    </div>
    <p class="muted" style="font-size:15px;margin-top:-8px">${korDate(now())} · ${esc(josa(S.bunnyName,'이랑','랑'))} 친구 된 지 ${friendDays()}일째</p>
    <div class="hero">
      <button class="stage-btn" data-a="poke" aria-label="${esc(S.bunnyName)} 쓰다듬기">${stageHTML(150, { expr: d.done ? 'happy' : 'normal', size:118 })}</button>
      <div class="bubble left" id="heroBubble">${esc(greet)}</div>
    </div>
    ${kn ? `<button class="alarm-banner" data-a="kidnote" style="width:100%;text-align:left;border-color:var(--pink);background:var(--pink-pale)"><span style="font-size:28px">💌</span><span>${esc(kn.text)}</span></button>` : ''}
    ${al && al.passed && !al.started && !d.done ? `<button class="alarm-banner" data-a="m2" style="width:100%;text-align:left"><span style="font-size:28px">⏰</span><span style="flex:1">공부할 시간이야! 엄마 목소리 들어 볼까?</span><span class="speak-btn" style="width:46px;height:46px">${ICON.speak}</span></button>` : ''}
    <div class="boards">
      ${BOARDS.map(b => { const st = boardState(b.k, d); const isNext = nb && nb.k === b.k && !d.done; const bo = d.boards[b.k];
        const label = st === 'done' ? '다 했어!' : st === 'doing' ? `${bo.phase === 'dict' ? '받아쓰기 중' : (bo.idx + 1) + '번부터'}` : isNext ? '시작!' : '';
        return `<button class="board-card ${st} ${isNext ? 'next' : ''}" data-a="board" data-k="${b.k}">
          <span class="badge ${b.cls}">${b.badge}</span>
          <span><span class="t">${b.name}</span><br><span class="s">${boardSub(b.k)}</span></span>
          ${label ? `<span class="state">${label}</span>` : '<span></span>'}</button>`; }).join('')}
    </div>
    <button class="gift-card ${giftAch() ? 'won' : ''}" data-a="go" data-v="gift">${giftBox(58, giftAch() ? 'hop' : '')}
      <span style="flex:1;display:grid;gap:6px">${giftAch() ? `<span class="disp" style="font-size:21px">오빠 선물 받는 날! 오빠한테 자랑하자!</span>` : `<span class="disp" style="font-size:19px">오빠 선물까지 <b style="color:var(--pink-deep);font-weight:400">${g.goal - gd}일</b> 남았어!</span><span class="meter"><i style="width:${Math.round(gd / g.goal * 100)}%"></i></span><span class="muted" style="font-size:14px">공부 다 한 날 ${gd} / ${g.goal}일</span>`}</span></button>
    ${mapTileHTML()}
    ${nextItem ? `<div class="next-item"><div class="row"><span class="disp" style="font-size:18px">스티커 ${nextItem.need - total}개 더 모으면 '${esc(nextItem.name)}'!</span></div><div class="meter"><i style="width:${Math.round((total - prevNeed) / (nextItem.need - prevNeed) * 100)}%"></i></div></div>` : ''}
    <div class="home-nav">
      <button class="nav-tile" data-a="go" data-v="room"><span class="ic" style="background:var(--pink-pale)">🎀</span>꾸미기</button>
      <button class="nav-tile" data-a="go" data-v="cal"><span class="ic" style="background:var(--mint-pale)">📅</span>달력</button>
    </div>
    ${isInstalled() ? '' : `<button class="install-tile" data-a="installkid"><span style="font-size:30px">📲</span><span style="flex:1">바탕화면에 공부방 놓기<br><span class="muted" style="font-family:var(--f-body);font-size:15px">엄마랑 같이 해요</span></span></button>`}
    ${d.done && (S.praise && (S.praise.audio || S.praise.text)) ? `<button class="btn lav big" data-a="go" data-v="alldone">오빠 칭찬 다시 듣기</button>` : ''}
    <button class="grown-up" data-a="go" data-v="pin">${ICON.lock}엄마 · 오빠 메뉴</button>
  </section>`;
};

/* ----- 판 시작 (엄마 목소리) ----- */
let RUN = null;
function makeBoard(k){
  const n = countFor(k);
  let qs;
  if (k === 'rev') { const lec = planLecture(day()); qs = genReview(lec ? Math.max(8, Math.round(n * .55)) : n); }
  else if (k !== 'rev' && currOn(k)) return makeCurrBoard(k, n);
  else {
    // 과목 판에도 그 과목에서 전에 틀린 문제를 조금(4문제 중 1개꼴) 섞는다
    // 밀린 복습이 많으면 새 문제를 줄이고 틀린 문제를 절반까지 늘린다
    const due = dueWrong(k);
    const old = takeDue(due, Math.floor(n * (due.length > 15 ? .5 : .25)));
    const fresh = (k === 'kor' ? genKor : k === 'math' ? genMath : genEng)(n - old.length).filter(q => !old.some(o => o.key === q.key));
    qs = [...fresh];
    old.forEach((q, i) => qs.splice(Math.min(qs.length, 2 + i * 4), 0, q));
  }
  return { qs, idx:0, correct:0, secs:0, done:false, phase: k === 'eng' ? 'eng' : 'q', intro:false, startedAt:Date.now(), lvl: k === 'rev' ? undefined : lv(k) };
}
VIEWS.intro = k => {
  const d = day(); const meta = BOARDS.find(b => b.k === k); const b = d.boards[k];
  const resume = b.idx > 0 || b.phase === 'dict';
  const dueCnt = k === 'rev' ? b.qs.filter(q => q.rev).length : 0;
  app().innerHTML = `<section class="screen" style="justify-content:center;align-items:center;text-align:center">
    <div class="row" style="align-self:stretch"><button class="icon-btn" data-a="home" aria-label="처음으로">${ICON.back}</button></div>
    <span class="badge ${meta.cls}" style="width:84px;height:84px;border-radius:26px;display:grid;place-items:center;color:#fff;font-family:var(--f-display);font-size:30px">${meta.badge}</span>
    <h1>${meta.name}</h1>
    ${resume ? `<div class="bubble">하던 데부터 이어서 하자!</div>` : `
    <div class="bubble" id="momcard" style="display:flex;align-items:center;gap:12px;text-align:left">
      <span style="font-size:34px">💗</span><span style="flex:1"><span class="muted" style="font-size:15px;font-family:var(--f-body)" id="momwho">엄마의 한마디</span><br>${esc(MOM_LINES.find(l => l.id === meta.mom).text)}</span>
      <button class="speak-btn" data-a="mom" data-v="${meta.mom}" aria-label="다시 듣기">${ICON.speak}</button>
    </div>`}
    ${Object.values(day().boards).filter(x => x.intro || x.done).length <= 1 && !resume ? `<p class="eye-tip">👀 태블릿은 팔 길이만큼 떨어뜨리고, 허리 펴고 앉아요!</p>` : ''}
    ${b.cur ? lessonIntroHTML(b) : b.waitLec ? waitLecHTML(k) : ''}
    <p class="muted">${k === 'eng' ? `영어 ${b.qs.length}문제 + 받아쓰기 10개` : k === 'rev' ? (dueCnt ? `전에 틀린 문제 ${dueCnt}개를 다시 풀어요` : `여러 과목을 골고루 ${b.qs.length}문제 풀어요`) : `${b.qs.length}문제`}</p>
    ${stageHTML(160, { expr:'happy', size:120 })}
    <button class="btn big" data-a="begin">${resume ? '이어서 하기' : b.cur && !b.cur.test && !b.cardsSeen ? (boardHasLecture(b) && !b.lecSkip ? '📺 강의 보러 가기' : '개념 배우러 가기') : '시작!'}</button>
  </section>`;
  if (!resume && !b.intro) {
    b.intro = true; save();
    playMom(meta.mom).then(who => { const el = $('#momwho'); if (el && who === 'bunny') el.textContent = `엄마 대신 ${josa(S.bunnyName,'이','가')} 읽어 줬어요`; });
  }
};

/* ----- 문제 화면 ----- */
function visHTML(q){
  const v = q.vis; if (!v) return '';
  switch (v.k) {
    case 'pic': return `<span class="pic">${v.e}</span>`;
    case 'listen': return `<button class="speak-btn" data-a="replay" style="width:110px;height:110px" aria-label="다시 듣기"><svg viewBox="0 0 24 24" style="width:54px;height:54px" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="#fff"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg></button>`;
    case 'sent': return `<div><span class="pic" style="font-size:72px">${v.e}</span><div class="sent"><span style="white-space:nowrap">${esc(v.before)}</span> <span class="blank">&nbsp;</span> <span style="white-space:nowrap">${esc(v.after)}</span></div></div>`;
    case 'eng': return engVis(v.w, true);
    case 'count': {
      let s = '<div class="count-grid">';
      for (let g = 0; g < v.n; g += 5) s += `<span class="grp">${Array.from({ length:Math.min(5, v.n - g) }, () => `<span>${v.e}</span>`).join('')}</span>`;
      return s + '</div>';
    }
    case 'split': return `<div class="split"><div class="top">${v.top}</div><svg width="174" height="26" style="grid-column:1/3" aria-hidden="true"><line x1="87" y1="0" x2="36" y2="26" stroke="#3E93E0" stroke-width="4" stroke-linecap="round"/><line x1="87" y1="0" x2="138" y2="26" stroke="#3E93E0" stroke-width="4" stroke-linecap="round"/></svg><div class="leaf ${v.l === '?' ? 'q' : ''}">${v.l}</div><div class="leaf ${v.r === '?' ? 'q' : ''}">${v.r}</div></div>`;
    case 'eq': return `<div class="eq" ${v.small ? 'style="font-size:36px"' : ''}>${v.html}</div>`;
    case 'tens': return `<div class="tens">${Array.from({ length:v.t }, () => `<span class="ten-bar">${'<i></i>'.repeat(10)}</span>`).join('')}${v.o ? `<span class="ones">${'<i class="one-dot"></i>'.repeat(v.o)}</span>` : ''}</div>`;
    case 'clock': return clockSVG(v.h, v.m);
    case 'html': return `<div class="vis-html">${v.html}</div>`;
    case 'text': return `<div class="sent text-q">${v.html}</div>`;
    case 'groups': return `<div class="groups">${Array.from({ length:v.g }, () => `<span class="grp-box">${v.e.repeat(v.each)}</span>`).join('')}</div>`;
    case 'frac': return fracSVG(v.n, v.part);
    case 'pattern': return `<div class="pattern">${v.items.map(e => `<span>${e}</span>`).join('')}<span class="qbox">?</span></div>`;
  }
  return '';
}
function clockSVG(h, m){
  const cx = 95, cy = 95; let s = `<svg class="clock" viewBox="0 0 190 190" role="img" aria-label="시계"><circle cx="95" cy="95" r="86" fill="#fff" stroke="#3E93E0" stroke-width="7"/>`;
  for (let i = 0; i < 60; i++) { if (i % 5) { const a = (i * 6 - 90) * Math.PI / 180; s += `<circle cx="${(cx + 76 * Math.cos(a)).toFixed(1)}" cy="${(cy + 76 * Math.sin(a)).toFixed(1)}" r="1.4" fill="#C9B9C1"/>`; } }
  for (let i = 1; i <= 12; i++) { const a = (i * 30 - 90) * Math.PI / 180; s += `<text x="${(cx + 64 * Math.cos(a)).toFixed(1)}" y="${(cy + 64 * Math.sin(a) + 1).toFixed(1)}" font-family="Jua, sans-serif" font-size="21" fill="${INK}" text-anchor="middle" dominant-baseline="central">${i}</text>`; }
  const ha = ((h % 12) + m / 60) * 30 - 90, ma = m * 6 - 90, r = d => d * Math.PI / 180;
  s += `<line x1="95" y1="95" x2="${(cx + 40 * Math.cos(r(ha))).toFixed(1)}" y2="${(cy + 40 * Math.sin(r(ha))).toFixed(1)}" stroke="#EE5F8D" stroke-width="9" stroke-linecap="round"/>`;
  s += `<line x1="95" y1="95" x2="${(cx + 56 * Math.cos(r(ma))).toFixed(1)}" y2="${(cy + 56 * Math.sin(r(ma))).toFixed(1)}" stroke="#3E93E0" stroke-width="5.5" stroke-linecap="round"/>`;
  return s + `<circle cx="95" cy="95" r="7" fill="${INK}"/></svg>`;
}
function fracHTML(s){ const [a, b] = String(s).split('/'); return `<span class="frac"><span>${a}</span><span>${b}</span></span>`; }
function fracSVG(n, k){
  const w = 260, h = 70, cw = w / n; let s = `<svg width="${w}" height="${h + 8}" viewBox="-4 -4 ${w + 8} ${h + 8}" style="max-width:100%" role="img" aria-label="${n}칸 중 ${k}칸 색칠">`;
  for (let i = 0; i < n; i++) s += `<rect x="${(i * cw).toFixed(1)}" y="0" width="${cw.toFixed(1)}" height="${h}" fill="${i < k ? '#FF8FB1' : '#FFFFFF'}" stroke="${INK}" stroke-width="3"/>`;
  return s + '</svg>';
}
function optLabel(q, o){
  if (q.optHtml && q.optHtml[o]) return q.optHtml[o];
  if (q.frac) return fracHTML(o);
  if (q.eng && q.pic) return engVis(o, false);
  if (q.sayOpts) return `<span style="flex:1">${esc(o)}</span><span class="say" data-a="sayopt" data-v="${esc(o)}" data-l="${q.subj === 'kor' ? 'ko-KR' : 'en-US'}" role="button" aria-label="${esc(o)} 듣기">${ICON.speak}</span>`;
  return esc(o);
}
function inputHTML(q){
  if (q.input === 'choice') {
    const long = q.opts.some(o => String(o).length > 5);
    const c3 = q.cols === 3 && !long && !q.sayOpts;
    return `<div class="options ${c3 ? 'cols3' : q.cols === 2 && !q.sayOpts ? 'cols2' : ''}">${q.opts.map((o, i) => `<button class="opt ${q.pic ? 'pic-opt' : ''} ${long && !q.sayOpts ? 'text-long' : ''} ${c3 && q.opts.some(o => String(o).length >= 4 || (/[가-힣]/.test(o) && String(o).length >= 3)) ? 'four' : ''}" ${q.big ? 'style="font-size:44px;min-height:96px"' : ''} data-a="ans" data-i="${i}">${optLabel(q, o)}</button>`).join('')}</div>`;
  }
  if (q.input === 'numpad') {
    return `<div class="answer-box"><span class="slot" id="slot">${esc(RUN.typed || '')}</span></div>
      <div class="numpad">${[1,2,3,4,5,6,7,8,9].map(n => `<button data-a="num" data-v="${n}">${n}</button>`).join('')}<button class="del" data-a="num" data-v="del">지우기</button><button data-a="num" data-v="0">0</button><button class="ok" data-a="num" data-v="ok">확인</button></div>`;
  }
  if (q.input === 'build') {
    const built = RUN.built || [];
    return `<div class="slots">${[...q.ans].map((_, i) => `<span class="s ${built[i] != null ? 'filled' : ''}" data-a="unbuild" data-i="${i}">${built[i] != null ? esc(q.tiles[built[i]]) : ''}</span>`).join('')}</div>
      <div class="tiles">${q.tiles.map((t, i) => `<button class="${built.includes(i) ? 'used' : ''}" data-a="tile" data-i="${i}">${esc(t)}</button>`).join('')}</div>`;
  }
  return '';
}
VIEWS.q = () => {
  const b = RUN.b, q = b.qs[b.idx];
  RUN.q = q; RUN.tries = 0; RUN.typed = ''; RUN.built = []; RUN.t0 = Date.now(); RUN.locked = false;
  const pct = Math.round(b.idx / b.qs.length * 100);
  app().innerHTML = `<section class="screen">
    <div class="q-top">
      <button class="icon-btn" data-a="home" aria-label="그만하고 나가기">${ICON.close}</button>
      <div class="track" aria-label="${b.idx + 1}번째 문제 / ${b.qs.length}"><span class="rail"></span><span class="fill" style="width:${pct}%"></span><span class="runner" style="left:${pct}%">${bunnySVG({ size:36, eq:{} })}</span><span class="goal">🥕</span></div>
      <span class="disp" style="font-size:18px;white-space:nowrap">${b.idx + 1}/${b.qs.length}</span>
    </div>
    ${q.rev ? `<span class="pill" style="align-self:flex-start">전에 틀렸던 문제</span>` : ''}
    <div class="q-card">
      <div class="q-head"><p class="q-prompt">${esc(q.prompt)}</p><button class="speak-btn" data-a="replay" aria-label="다시 듣기">${ICON.speak}</button></div>
      ${q.vis ? `<div class="q-visual">${visHTML(q)}</div>` : ''}
      ${inputHTML(q)}
    </div>
    <div class="feedback" id="fb"></div>
  </section>`;
  sayQuestion(q);
};
async function sayQuestion(q){
  const my = ++SEQ;
  if (q.listen) { if (q.say) await speak(q.say); if (my === SEQ && RUN && RUN.q === q) await speak(q.listen, q.lang || 'ko-KR'); }
  else speak(q.say || q.prompt);
}
/* 노란 버튼: 처음 안내는 빼고 낱말(문장)만 다시 */
function replayWord(q){
  ++SEQ;
  if (q.listen) speak(q.listen, q.lang || 'ko-KR');
  else if (q.read) speak(q.read);
  else if (q.vis && q.vis.k === 'sent') speak(`${q.vis.before}, 음음, ${q.vis.after}`);
  else speak(q.say || q.prompt);
}
function rerenderInput(){ const q = RUN.q; const card = $('.q-card'); const old = card.querySelector('.options, .numpad, .tiles');
  if (q.input === 'numpad') { $('#slot').textContent = RUN.typed; return; }
  if (q.input === 'build') { const slots = card.querySelector('.slots'), tiles = card.querySelector('.tiles'); const tmp = document.createElement('div'); tmp.innerHTML = inputHTML(q); slots.replaceWith(tmp.children[0]); tiles.replaceWith(tmp.children[0]); }
}
function feedback(html, expr){ $('#fb').innerHTML = `${bunnySVG({ size:56, expr, cls: expr === 'happy' ? 'hop' : 'wiggle' })}<div class="bubble left">${html}</div>`; }
function answer(val){
  if (RUN.locked) return;
  ++SEQ;
  const q = RUN.q, b = RUN.b, k = RUN.k;
  const right = String(val) === String(q.ans);
  if (right) {
    RUN.locked = true; SFX.right();
    markOpt(q.ans, 'right');
    if (RUN.tries === 0) { b.correct++; if (q.rev) reviewRight(q); }
    else addWrong(q, true);
    if (b.cur && (q.lesson || q.unitTest) && !q.review11 && !q.rev) b.cur.items.push({ key:q.key, first:RUN.tries === 0 });
    feedback(esc(pick(PRAISE_LINES)) + (q.eng ? ` <b>${esc(q.explain)}</b>` : ''), 'happy');
    if (q.eng) speak(q.ans, 'en-US');
    setTimeout(() => nextQ(), q.eng ? 1500 : 1100);
    return;
  }
  RUN.tries++;
  SFX.wrong();
  if (q.input === 'choice') markOpt(val, 'wrong');
  if (RUN.tries === 1) {
    if (q.input === 'numpad') { RUN.typed = ''; rerenderInput(); }
    if (q.input === 'build') { RUN.built = []; rerenderInput(); }
    $('#fb').innerHTML = `${bunnySVG({ size:56, expr:'think', cls:'wiggle' })}<div class="hint-box" style="flex:1">${q.hintHTML || ''}<span>${esc(pick(TRY_LINES))}<br>${esc(q.hint)}</span></div>`;
    speak(q.hint);
  } else {
    RUN.locked = true;
    addWrong(q);
    if (b.cur && (q.lesson || q.unitTest) && !q.review11 && !q.rev) b.cur.items.push({ key:q.key, first:false });
    if (q.input === 'choice') markOpt(q.ans, 'right');
    if (q.input === 'numpad') { RUN.typed = String(q.ans); rerenderInput(); }
    if (q.input === 'build') { RUN.built = [...q.ans].map(ch => q.tiles.indexOf(ch)); rerenderInput(); }
    $('#fb').innerHTML = `${bunnySVG({ size:56, expr:'normal' })}<div class="hint-box" style="flex:1"><span>괜찮아! 정답은 <b>${esc(q.ans)}</b>.<br>${esc(q.explain || '')}<br>내일 복습에서 다시 만나자!</span><button class="btn small" data-a="nextq">다음 문제</button></div>`;
    speak(`정답은 ${q.eng ? '' : q.ans}. ${q.eng ? '' : '내일 다시 만나자!'}`).then(() => { if (q.eng) speak(q.ans, 'en-US'); });
  }
  save();
}
function markOpt(val, cls){
  const q = RUN.q; if (q.input !== 'choice') return;
  document.querySelectorAll('.opt').forEach((el, i) => { if (String(q.opts[i]) === String(val)) el.classList.add(cls); else if (cls === 'right') el.classList.add('dim'); });
}
function nextQ(){
  const b = RUN.b, k = RUN.k;
  const secs = clamp((Date.now() - RUN.t0) / 1000, 8, 120);
  b.secs += secs; S.avgSec[k] = Math.round((S.avgSec[k] * .85 + secs * .15) * 10) / 10;
  b.idx++;
  save();
  if (b.idx >= b.qs.length) {
    if (writeTaskFor(b)) return go('write');
    if (k === 'eng' && b.phase === 'eng') { b.phase = 'dict'; const d = day(); if (!d.dict) d.dict = { words:pickDict(10), idx:0, photo:null, graded:false, marks:null, sent:false }; save(); return go('dict'); }
    return finishBoard(k);
  }
  go('q');
}

/* ----- 받아쓰기 ----- */
VIEWS.dict = () => {
  const d = day(), dt = d.dict;
  if (dt.idx >= dt.words.length) return go('photo');
  const n = dt.idx + 1;
  app().innerHTML = `<section class="screen">
    <div class="q-top"><button class="icon-btn" data-a="home" aria-label="그만하고 나가기">${ICON.close}</button>
      <div class="track"><span class="rail"></span><span class="fill" style="width:${dt.idx * 10}%;background:var(--mint-deep)"></span><span class="runner" style="left:${dt.idx * 10}%">${bunnySVG({ size:36, eq:{} })}</span><span class="goal">📒</span></div>
      <span class="disp" style="font-size:18px">${n}/10</span></div>
    <div class="q-card" style="text-align:center;justify-items:center">
      <p class="q-prompt">받아쓰기! 잘 듣고 ${penMode() ? '펜으로 칸에' : '공책에'} 써요</p>
      ${penMode() ? `<div class="pen-wrap"><span class="dict-num" style="font-size:40px">${n}번</span><canvas id="pen" class="pen-canvas" aria-label="받아쓰기 쓰는 칸"></canvas><button class="btn ghost small" data-a="penclear">지우고 다시 쓰기</button></div>`
        : `<div class="note-paper" style="width:100%"><span class="dict-num">${n}번</span><span class="muted">공책에 ${n}번이라고 쓰고, 들은 말을 써요</span></div>`}
      <button class="btn ghost" data-a="dictsay">${ICON.speak.replace('<svg', '<svg style="width:26px;height:26px"')}다시 듣기</button>
    </div>
    <button class="btn mint big" data-a="dictnext">다 썼어요</button>
  </section>`;
  window.__dictShown = Date.now();
  if (penMode()) setupPen();
  sayDict();
};
async function sayDict(){
  const my = ++SEQ, dt = day().dict, w = dt.words[dt.idx];
  const alive = () => my === SEQ && SCREEN === 'dict';
  await speak(`${dt.idx + 1}번.`); if (!alive()) return;
  await new Promise(r => setTimeout(r, 400)); if (!alive()) return;
  await speak(w, 'ko-KR', .8); if (!alive()) return;
  await new Promise(r => setTimeout(r, 1500)); if (!alive()) return;
  speak(w, 'ko-KR', .8);
}
VIEWS.photo = () => {
  const dt = day().dict;
  app().innerHTML = `<section class="screen">
    <div class="row"><button class="icon-btn" data-a="home" aria-label="처음으로">${ICON.back}</button></div>
    <h2 style="text-align:center">받아쓰기 끝! 공책을 사진으로 찍어요</h2>
    <p class="muted" style="text-align:center">엄마가 사진을 보고 채점해 줄 거야</p>
    ${dt.photo ? `<img class="photo-prev" src="${dt.photo}" alt="받아쓰기 공책 사진">` : `<div class="note-paper" style="min-height:180px;place-content:center">${stageHTML(150, { expr:'wow', size:110 })}</div>`}
    <label class="btn ${dt.photo ? 'ghost' : 'mint'} big file-btn">${dt.photo ? '다시 찍기' : '📷 사진 찍기'}<input type="file" accept="image/*" capture="environment" id="photoIn"></label>
    ${dt.photo ? `<button class="btn big" data-a="sendphoto">엄마에게 보내기</button>` : `<button class="btn ghost small" data-a="skipphoto" style="align-self:center">사진은 나중에 찍을게요</button>`}
  </section>`;
};
function compressImage(file, max = 1000){
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => {
      const sc = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas');
      c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .62)); };
      img.onerror = rej; img.src = r.result; };
    r.onerror = rej; r.readAsDataURL(file);
  });
}

/* ----- 판 끝 ----- */
function finishBoard(k){
  const d = day(), b = d.boards[k];
  if (b.done) return go('home');
  b.done = true; b.endedAt = Date.now();
  const st = pick(STICKERS); d.earned.push(st); S.stickers.push({ e:st, d:todayKey() });
  const mins = Math.max(1, Math.round(b.secs / 60));
  if (b.cur) b.cur.result = judgeCurriculum(b);
  b.n = b.qs.length; b.qs = [];   // 끝난 판의 문제 목록은 지워서 폰 저장 공간을 아낀다
  notify('oppa', `재윤이가 ${josa(BNAME[k], "을", "를")} 끝냈어요 · ${b.n}문제 중 ${b.correct}개 한 번에 정답 · ${mins}분`);
  let allDone = false;
  if (BOARDS.every(x => boardState(x.k, d) === 'done') && !d.done) {
    d.done = true; allDone = true;
    const bonus = pick(STICKERS); d.earned.push(bonus); S.stickers.push({ e:bonus, d:todayKey(), bonus:true });
    const totalMin = Math.round(BOARDS.reduce((s, x) => s + d.boards[x.k].secs, 0) / 60);
    notify('oppa', `🎉 재윤이가 오늘 공부를 모두 끝냈어요 (${totalMin}분). 칭찬 녹음을 남겨 주세요!`);
    notify('mom', `🎉 재윤이가 오늘 공부를 모두 끝냈어요 (${totalMin}분)`);
    checkGift();
  }
  save();
  go('reward', { k, st, allDone });
}
VIEWS.reward = ({ k, st, allDone }) => {
  const d = day(), b = d.boards[k], total = S.stickers.length;
  const newItems = ITEMS.filter(i => i.need <= total && !S.seenItems.includes(i.id));
  newItems.forEach(i => S.seenItems.push(i.id)); save();
  const qn = b.n || b.qs.length;
  app().innerHTML = `<section class="screen reward">
    <h1>${BNAME[k]} 끝!</h1>
    <div class="big-sticker">${st}</div>
    <p class="score-line">${qn}문제 중 <b style="color:var(--pink-deep)">${b.correct}개</b> 한 번에 맞았어!<br><span class="muted">재윤이 스티커북에 쏙!</span></p>
    ${b.cur && b.cur.result ? lessonResultHTML(b.cur.result) : ''}
    ${allDone ? `<p class="score-line" style="color:var(--mint-deep)">오늘 공부 다 끝! 보너스 스티커도 받았어 ${d.earned[d.earned.length - 1]}</p>` : ''}
    ${newItems.length ? `<div class="next-item" style="align-self:stretch;border-color:var(--pink);background:var(--pink-pale)"><span class="disp" style="font-size:20px">새 꾸미기 선물: ${newItems.map(i => esc(i.name)).join(', ')}!</span><button class="btn small" data-a="go" data-v="room" style="justify-self:center">지금 꾸미러 가기</button></div>` : ''}
    <div class="bubble" style="display:flex;align-items:center;gap:10px"><span style="font-size:28px">💗</span><span>${esc(MOM_LINES[0].text)}</span><button class="speak-btn" style="width:48px;height:48px" data-a="mom" data-v="m1" aria-label="엄마 목소리 다시 듣기">${ICON.speak}</button></div>
    <button class="btn big" data-a="go" data-v="${allDone ? 'alldone' : S.eyeBreak === false ? 'home' : 'eyebreak'}">${allDone ? '오빠 칭찬 들으러 가기' : '좋아!'}</button>
  </section>`;
  SFX.sticker(); confetti();
  setTimeout(() => playMom('m1'), 900);
};
VIEWS.alldone = () => {
  const d = day(); const totalMin = Math.round(BOARDS.reduce((s, x) => s + (d.boards[x.k] ? d.boards[x.k].secs : 0), 0) / 60);
  const pr = S.praise;
  app().innerHTML = `<section class="screen reward">
    <h1>재윤아, 오늘 공부 다 끝!</h1>
    ${giftAch() === todayKey() ? `<div class="gift-card won" style="flex-direction:column;text-align:center">${giftBox(110, 'hop')}<span class="disp" style="font-size:24px">${S.gift.goal}일을 모두 해냈어!</span><span>오빠가 약속한 선물${S.gift.name ? ` "${esc(S.gift.name)}"` : ''}을 받을 수 있어! 오빠한테 자랑하자!</span></div>` : `${stageHTML(220, { expr:'happy', size:160, cls:'hop' })}<p class="score-line">오빠 선물까지 ${Math.max(0, S.gift.goal - giftDays().length)}일 남았어!</p>`}
    <p class="score-line">오늘 ${totalMin}분 동안 공부했어. 스티커 ${d.earned.length}개!</p>
    <div class="bubble" style="display:grid;gap:10px;align-self:stretch;text-align:left">
      <span class="disp" style="font-size:18px;color:var(--lav-deep)">오빠가 남긴 칭찬</span>
      ${pr && pr.text ? `<span>${esc(pr.text)}</span>` : ''}
      ${pr && pr.audio ? `<button class="btn lav" data-a="praise">▶ 오빠 목소리 듣기</button>` : (!pr || !pr.text) ? `<span class="muted" style="font-family:var(--f-body);font-size:16px">오빠가 곧 칭찬을 남겨 줄 거야!</span>` : ''}
    </div>
    <button class="btn big" data-a="home">처음으로</button>
  </section>`;
  confetti();
  if (pr && pr.audio) setTimeout(() => playClip(pr.audio), 600);
};

/* ----- 꾸미기 · 스티커북 ----- */
let ROOM_TAB = 'dress';
VIEWS.room = () => {
  const total = S.stickers.length;
  const head = `<div class="row"><button class="icon-btn" data-a="home" aria-label="처음으로">${ICON.back}</button><h2 style="flex:1">${ROOM_TAB === 'dress' ? `${esc(S.bunnyName)} 꾸미기` : '스티커북'}</h2><span class="sticker-chip">⭐ ${total}</span></div>
    <div class="tabs"><button class="${ROOM_TAB === 'dress' ? 'on' : ''}" data-a="roomtab" data-v="dress">꾸미기</button><button class="${ROOM_TAB === 'book' ? 'on' : ''}" data-a="roomtab" data-v="book">스티커북</button></div>`;
  if (ROOM_TAB === 'book') {
    const list = [...S.stickers].reverse();
    app().innerHTML = `<section class="screen">${head}
      <p class="muted">공부를 한 판 끝낼 때마다 스티커가 하나씩 생겨요. 지금까지 ${total}개!</p>
      <div class="sticker-grid">${list.map((s, i) => `<span class="stk" style="transform:rotate(${(i * 37 % 17) - 8}deg)" title="${shortDate(s.d)}">${s.e}</span>`).join('')}${'<span class="stk empty">?</span>'.repeat(Math.max(3, 12 - list.length % 12 || 0) % 13)}</div>
    </section>`;
    return;
  }
  app().innerHTML = `<section class="screen">${head}
    <div class="stage dress-stage ${S.equipped.bg || 'bg-none'}">${bunnySVG({ size:180, expr:'happy' })}</div>
    <div class="item-grid">${ITEMS.map(it => { const has = total >= it.need, on = S.equipped[it.slot] === it.id;
      const thumb = it.slot === 'bg' ? `<span class="bg-thumb ${it.id}"></span>` : bunnySVG({ size:52, eq:{ [it.slot]:it.id } });
      return `<button class="item ${on ? 'on' : ''} ${has ? '' : 'locked'}" data-a="equip" data-v="${it.id}" ${has ? '' : 'aria-disabled="true"'}><span class="thumb">${thumb}</span><span>${esc(it.name)}</span>${has ? (on ? '<span class="pill">착용 중</span>' : '') : `<span class="lock">⭐ ${it.need}개</span>`}</button>`; }).join('')}</div>
  </section>`;
};

/* ----- 오빠 선물 길 ----- */
VIEWS.gift = () => {
  const g = S.gift, days = giftDays(), n = Math.min(days.length, g.goal);
  let path = '';
  for (let i = 0; i < g.goal; i++) {
    const last = i === g.goal - 1, on = i < n;
    path += last ? `<span class="gstep gift ${giftAch() ? 'on' : ''}">${giftBox(44)}</span>`
      : `<span class="gstep ${on ? 'on' : ''}">${on ? `${ICON.paw}<small>${shortDate(days[i])}</small>` : `<b>${i + 1}</b>`}</span>`;
  }
  app().innerHTML = `<section class="screen">
    <div class="row"><button class="icon-btn" data-a="home" aria-label="처음으로">${ICON.back}</button><h2 style="flex:1">오빠랑 한 선물 약속</h2></div>
    <div class="hero">${stageHTML(140, { expr: giftAch() ? 'wow' : 'happy', size:104 })}<div class="bubble left">${giftAch() ? '재윤아, 해냈어! 오빠한테 선물 받으러 가자!' : `재윤이가 공부를 다 한 날이 ${g.goal}일 모이면 오빠가 선물을 사 준대!`}</div></div>
    <div class="gift-card ${giftAch() ? 'won' : ''}">${giftBox(64)}<span style="flex:1"><span class="muted" style="font-size:15px">오빠가 약속한 선물</span><br><span class="disp" style="font-size:22px">${g.name ? esc(g.name) : '오빠가 깜짝 선물을 준비하고 있어!'}</span></span></div>
    <p class="disp" style="font-size:20px;text-align:center">${giftAch() ? `${g.goal}일 모두 성공!` : `${n}일 했어! ${g.goal - n}일만 더 하면 선물!`}</p>
    <div class="gpath">${path}</div>
    <p class="muted" style="text-align:center;font-size:15px">4판을 다 한 날마다 발바닥 도장이 하나씩 찍혀요.<br>하루 쉬어도 괜찮아. 다음 날 이어서 하면 돼!</p>
  </section>`;
  if (giftAch()) confetti();
};

/* ----- 출석 달력 ----- */
let CAL = null;
VIEWS.cal = () => {
  const t = now(); if (!CAL) CAL = { y:t.getFullYear(), m:t.getMonth() };
  const first = new Date(CAL.y, CAL.m, 1), last = new Date(CAL.y, CAL.m + 1, 0).getDate();
  let cells = '', full = 0;
  for (let i = 0; i < first.getDay(); i++) cells += '<span class="d blank"></span>';
  for (let dd = 1; dd <= last; dd++) {
    const k = keyOf(new Date(CAL.y, CAL.m, dd)), dy = S.days[k];
    const cnt = dy ? BOARDS.filter(b => dy.boards[b.k] && dy.boards[b.k].done).length : 0;
    if (dy && dy.done) full++;
    cells += `<span class="d ${k === todayKey() ? 'today' : ''} ${cnt && !(dy && dy.done) ? 'half' : ''}">${cnt ? `<span class="stamp">${ICON.paw}</span>` : ''}<span style="position:relative">${dd}</span></span>`;
  }
  app().innerHTML = `<section class="screen">
    <div class="row"><button class="icon-btn" data-a="home" aria-label="처음으로">${ICON.back}</button><h2 style="flex:1">출석 달력</h2></div>
    <div class="row" style="justify-content:center;gap:18px"><button class="icon-btn" data-a="calmove" data-v="-1" aria-label="지난달">${ICON.back}</button><span class="disp" style="font-size:24px">${CAL.y}년 ${CAL.m + 1}월</span><button class="icon-btn" data-a="calmove" data-v="1" aria-label="다음 달" style="transform:scaleX(-1)">${ICON.back}</button></div>
    <div class="cal">${DOW.map(x => `<span class="dow">${x}</span>`).join('')}${cells}</div>
    <div class="legend"><span>진한 발바닥: 다 했어요</span><span>연한 발바닥: 조금 했어요</span></div>
    <div class="bubble" style="text-align:center">이번 달에 ${full}일 동안 공부를 다 했어!</div>
  </section>`;
};

function ttsSample(){ speak(`재윤아, 안녕! 나는 ${josa(S.bunnyName, '이야', '야')}. 오늘도 같이 공부하자!`); }
/* 목소리 목록이 늦게 오면 설정 화면을 다시 그린다 */
if ('speechSynthesis' in window) { try { speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', () => { loadVoices(); if (SCREEN === 'adult' && S.adultTab === 'set') go('adult'); }); } catch (e) {} }

/* ===================== 바탕화면에 설치 안내 ===================== */
let INSTALL = { who:'kid', br:'chrome' };
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (SCREEN === 'install' || SCREEN === 'home') go(SCREEN, INSTALL); });
const isInstalled = () => { try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) { return false; } };
function phoneMock(step, br){
  const top = `<div class="bar"><span class="addr"></span>${br === 'chrome' ? `<span class="dots ${step === 1 ? '' : ''}"><i></i><i></i><i></i></span>` : ''}</div>`;
  const page = `<div class="pagec"><span></span><span style="width:70%"></span><span></span><span style="width:50%"></span></div>`;
  const bottom = br === 'samsung' ? `<div class="bbar"><i></i><i></i><i></i><i></i><span class="ham"><i></i><i></i><i></i></span></div>` : '';
  const ring = (css) => `<span class="ring" style="${css}"></span>`;
  if (step === 1) return `<div class="phone">${top}${page}${bottom}${br === 'chrome' ? ring('right:0;top:1px') : ring('right:2px;bottom:0')}</div>`;
  if (step === 2) {
    const menu = br === 'chrome'
      ? `<div class="menu"><b>새 탭</b><b>북마크</b><b class="hi">홈 화면에 추가</b><b>설정</b></div>`
      : `<div class="menu bottom"><b>북마크</b><b class="hi">＋ 현재 페이지 추가</b><b>설정</b></div>`;
    return `<div class="phone">${top}${page}${bottom}${menu}</div>`;
  }
  if (step === 3) {
    if (br === 'samsung') return `<div class="phone">${top}${page}${bottom}<div class="menu bottom"><b>북마크</b><b>빠른 실행</b><b class="hi">홈 화면</b></div></div>`;
    return `<div class="phone">${top}${page}<div class="dialog"><span>홈 화면에 추가</span><span style="font-size:20px">🐰</span><span>재윤이 공부방</span><span class="btns"><b>취소</b><b class="hi">추가</b></span></div></div>`;
  }
  if (step === 4 && br === 'samsung') return `<div class="phone">${top}${page}${bottom}<div class="dialog"><span>홈 화면에 추가</span><span style="font-size:20px">🐰</span><span>재윤이 공부방</span><span class="btns"><b>취소</b><b class="hi">추가</b></span></div></div>`;
  return `<div class="phone" style="background:linear-gradient(#FFE1EA,#EFE8FF)"><div class="homegrid"><i></i><i></i><i></i><i></i><span class="app-ic">${bunnySVG({ size:26, eq:{} })}</span><i></i><i></i><i></i><i></i></div><small style="position:absolute;left:0;right:0;top:112px;text-align:center;font-size:9px">재윤이 공부방</small></div>`;
}
function installSteps(who, br){
  const kid = who === 'kid';
  if (br === 'chrome') return [
    kid ? '오른쪽 위에 있는 점 세 개(⋮)를 눌러요' : '공부방 링크를 크롬으로 열고, 오른쪽 위 점 세 개(⋮)를 눌러요',
    kid ? '"홈 화면에 추가"를 눌러요' : '메뉴에서 "홈 화면에 추가"를 눌러요. "앱 설치"라고 보이면 그걸 눌러요',
    kid ? '"추가"를 눌러요' : '창이 뜨면 "추가"(또는 "설치")를 눌러요',
    kid ? '바탕화면에 토끼가 생겼어! 이제 토끼를 누르면 공부방이 열려요' : '바탕화면에 토끼 아이콘이 생겨요. 이제 이 아이콘으로 열면 돼요',
  ];
  return [
    kid ? '오른쪽 아래 줄 세 개(≡)를 눌러요' : '공부방 링크를 삼성 인터넷으로 열고, 오른쪽 아래 줄 세 개(≡)를 눌러요',
    kid ? '"현재 페이지 추가"를 눌러요' : '"＋ 현재 페이지 추가"를 눌러요',
    kid ? '"홈 화면"을 골라요' : '추가할 곳으로 "홈 화면"을 골라요',
    kid ? '"추가"를 눌러요' : '창이 뜨면 "추가"를 눌러요',
    kid ? '바탕화면에 토끼가 생겼어! 이제 토끼를 누르면 공부방이 열려요' : '바탕화면에 토끼 아이콘이 생겨요. 이제 이 아이콘으로 열면 돼요',
  ];
}
VIEWS.install = (o) => {
  if (o && o.who) INSTALL = Object.assign(INSTALL, o);
  const { who, br } = INSTALL, kid = who === 'kid';
  const steps = installSteps(who, br);
  app().innerHTML = `<section class="screen ${kid ? '' : 'adult'}">
    <div class="row"><button class="icon-btn" data-a="${kid ? 'home' : 'go'}" data-v="adult" aria-label="돌아가기">${ICON.back}</button><h2 style="flex:1">${kid ? '바탕화면에 공부방 놓기' : '엄마 폰에 앱 설치하기'}</h2></div>
    ${isInstalled() ? `<div class="done-note">이 폰에는 벌써 설치되어 있어요!</div>` : ''}
    ${deferredInstall ? `<button class="btn mint big" data-a="installnow">버튼 한 번으로 설치하기</button><p class="muted" style="text-align:center">이 버튼이 안 되면 아래 순서대로 해요</p>` : ''}
    ${kid ? `<div class="hero">${stageHTML(140, { expr:'wow', size:104 })}<div class="bubble left">엄마랑 같이 해 봐요! 노란 버튼을 누르면 읽어 줄게</div></div>` : `<p class="muted">한 번만 해 두면, 바탕화면의 토끼 아이콘을 눌러 바로 열 수 있어요. 알림도 이 아이콘으로 설치해야 받을 수 있어요.</p>`}
    <p class="muted" style="font-size:15px">${kid ? '어떤 인터넷으로 열었나요?' : '어떤 브라우저로 열었는지 골라 주세요. 갤럭시는 보통 둘 중 하나예요.'}</p>
    <div class="tabs"><button class="${br === 'chrome' ? 'on' : ''}" data-a="instbr" data-v="chrome">크롬</button><button class="${br === 'samsung' ? 'on' : ''}" data-a="instbr" data-v="samsung">삼성 인터넷</button></div>
    ${steps.map((t, i) => `<div class="step ${kid ? 'kid' : ''}">${phoneMock(i === steps.length - 1 ? 9 : i + 1, br)}<div class="txt"><span class="num">${i + 1}</span><span class="say-line">${esc(t)}</span>${kid ? `<button class="speak-btn" style="width:48px;height:48px" data-a="saystep" data-v="${i}" aria-label="읽어 주기">${ICON.speak}</button>` : ''}</div></div>`).join('')}
    ${kid ? '' : `<div class="panel"><h3>재윤이 폰에도 설치해 주세요</h3><p class="muted" style="font-size:15px">재윤이 화면 첫 화면 아래의 "바탕화면에 공부방 놓기"를 누르면 재윤이용 그림 안내가 나와요. 같은 순서로 하면 돼요.</p></div>`}
  </section>`;
};

/* ===================== 어른 화면 ===================== */
let PIN = '';
VIEWS.pin = () => {
  if (linked() && role() !== 'kid') { S.adultTab = S.adultTab === 'set' ? 'set' : role(); return go('adult'); }
  app().innerHTML = `<section class="screen adult" style="align-items:center;text-align:center">
    <div class="row" style="align-self:stretch"><button class="icon-btn" data-a="home" aria-label="처음으로">${ICON.back}</button></div>
    <h2>엄마 · 오빠 메뉴</h2>
    <p class="muted">비밀번호 4자리를 눌러 주세요</p>
    <div class="pin-dots">${[0,1,2,3].map(i => `<i class="${PIN.length > i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="numpad" style="width:100%;max-width:320px">${[1,2,3,4,5,6,7,8,9].map(n => `<button data-a="pin" data-v="${n}">${n}</button>`).join('')}<button class="del" data-a="pin" data-v="del">지우기</button><button data-a="pin" data-v="0">0</button><span></span></div>
    ${S.pin === '0000' ? `<p class="demo-note">체험판 처음 비밀번호는 0000이에요. 설정에서 바꿀 수 있어요.</p>` : ''}
  </section>`;
};
function levelPanel(){
  const adv = levelAdvice();
  const NAMES = { kor:'국어', math:'수학', eng:'영어' };
  const row = (k) => {
    const opts = (k === 'eng' ? ENG_LEVELS : LEVELS).map((l, i) => `<option value="${i}" ${lv(k) === i ? 'selected' : ''}>${l}</option>`).join('');
    return `<div class="lvl-row"><span class="disp" style="font-size:18px">${NAMES[k]}</span><select id="lv_${k}" data-ch="level" data-v="${k}" aria-label="${NAMES[k]} 난이도">${opts}</select></div>
      <p class="muted" style="font-size:13px;margin-top:-6px">${k === 'eng' ? BOARD_SUB.eng[lv('eng')] : BOARD_SUB[k][lv(k)]}</p>`;
  };
  return `<div class="panel"><h3>난이도 (학년 · 학기)</h3>
    ${adv.map(a => { const max = a.s === 'eng' ? 2 : 5, to = clamp(lv(a.s) + a.dir, 0, max), lab = a.s === 'eng' ? ENG_LEVELS[to].split(' ')[0] : LEVELS[to];
      return `<div class="lvl-tip ${a.dir > 0 ? 'up' : 'down'}"><span style="flex:1">${a.dir > 0 ? `${josa(NAMES[a.s], '을', '를')} 최근 ${Math.round(a.r * 100)}% 한 번에 맞혔어요. 너무 쉬운가 봐요!` : `${josa(NAMES[a.s], '은', '는')} ${Math.round(a.r * 100)}%만 한 번에 맞혔어요. 조금 어려워해요.`}</span><button class="btn small ${a.dir > 0 ? 'mint' : 'ghost'}" data-a="lvlset" data-v="${a.s}|${to}">${esc(lab)}로 ${a.dir > 0 ? '올리기' : '내리기'}</button></div>`; }).join('')}
    ${['kor','math','eng'].filter(x => !currOn(x)).map(row).join('') || '<p class="muted" style="font-size:15px">세 과목 모두 진도 방식이에요. 기초 복습(30%)은 아래 단계에서 나와요.</p>' + row('kor')}
    <p class="muted" style="font-size:14px">받아쓰기는 국어 단계를 따라가요. 바꾸면 다음에 시작하는 판부터 적용돼요. 한 번에 90% 넘게 맞히는 날이 이어지면 여기서 올리자고 알려 드려요.</p>
  </div>`;
}
function minutesOf(dy){ return dy ? Math.round(BOARDS.reduce((s, b) => s + (dy.boards[b.k] ? dy.boards[b.k].secs : 0), 0) / 60) : 0; }
function adultHead(){
  return `<div class="row"><button class="icon-btn" data-a="home" aria-label="재윤이 화면으로">${ICON.back}</button><h2 style="flex:1">엄마 · 오빠 메뉴</h2></div>
  <div class="tabs">${[['mom','엄마'],['oppa','오빠'],['set','설정']].map(([v, l]) => `<button class="${S.adultTab === v ? 'on' : ''}" data-a="atab" data-v="${v}">${l}</button>`).join('')}</div>`;
}
function todayPanel(){
  const d = day();
  return `<div class="panel"><h3>오늘 재윤이 (${korDate(now())})</h3><div class="list">${BOARDS.map(b => { const bo = d.boards[b.k], st = boardState(b.k, d);
    return `<div class="li"><span class="grow">${b.name}</span>${st === 'done' ? `<span class="muted" style="font-size:14px">${bo.correct}/${bo.n || bo.qs.length} · ${Math.max(1, Math.round(bo.secs / 60))}분</span><span class="pill ok">완료</span>` : st === 'doing' ? `<span class="pill wait">하는 중</span>` : `<span class="pill no">아직</span>`}</div>`; }).join('')}</div>
    <p class="muted" style="font-size:15px">오늘 공부 시간 ${minutesOf(d)}분 · 받은 스티커 ${d.earned.length}개</p></div>`;
}
function notesPanel(to, title){
  const al = alarmInfo(); const extra = [];
  if (to === 'mom' && S.alarms.nudge && al && al.late && !al.started) extra.push({ text:`⏰ ${al.time} 공부 알림 뒤 30분이 지났는데 재윤이가 아직 시작하지 않았어요`, at:Date.now() });
  const list = [...extra, ...S.notes.filter(n => n.to === to)].slice(0, 12);
  return `<div class="panel"><h3>${title}</h3>${list.length ? `<div class="list">${list.map(n => `<div class="li"><span class="grow">${esc(n.text)}</span><span class="muted" style="font-size:13px;white-space:nowrap">${new Date(n.at).getHours()}:${String(new Date(n.at).getMinutes()).padStart(2,'0')}</span></div>`).join('')}</div>` : '<p class="muted">아직 알림이 없어요</p>'}
  <p class="demo-note">체험판에서는 알림이 여기에만 쌓여요. 서버를 연결하면 이 내용이 폰 푸시 알림으로 가요.</p></div>`;
}
VIEWS.adult = () => {
  const tab = S.adultTab;
  let body = '';
  if (tab === 'mom') {
    const pend = Object.entries(S.days).filter(([k, dy]) => dy.dict && (dy.dict.sent || gradeOf(k).graded)).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5);
    body = `<button class="install-tile" data-a="installmom"><span style="font-size:30px">📲</span><span style="flex:1">엄마 폰에 앱 설치하기<br><span class="muted" style="font-family:var(--f-body);font-size:15px">바탕화면에 토끼 아이콘 만들기 · 그림 안내</span></span></button>` + todayPanel() + writesPanel() + currPanel('math') + currPanel('kor') + currPanel('eng') + currHelpPanel() + levelPanel() + `
      <div class="panel"><h3>받아쓰기 채점</h3>
        ${pend.length ? pend.map(([k, dy]) => { const dt = Object.assign({}, dy.dict, gradeOf(k)); const marks = (dt.marks && dt.marks.length ? dt.marks : dt.words.map(() => null));
          return `<div class="panel" style="padding:12px;background:var(--bg);border:0">
            <div class="row"><b class="disp" style="font-size:18px;font-weight:400">${shortDate(k)} 받아쓰기</b><span class="spacer"></span>${dt.graded ? `<span class="pill ok">${dt.score}/10점</span>` : `<span class="pill wait">채점 기다리는 중</span>`}</div>
            ${dt.photo ? `<img src="${dt.photo}" alt="받아쓰기 사진" style="width:100%;border-radius:12px;cursor:zoom-in" data-a="zoom" data-v="${k}">` : `<p class="muted">사진이 없어요. 공책을 직접 보고 채점해 주세요.</p>`}
            ${dt.graded ? '' : `<div class="list">${dt.words.map((w, i) => `<div class="li" style="background:#fff"><span class="grow"><b class="muted" style="font-weight:400">${i + 1}.</b> ${esc(w)}</span><span class="ox"><button class="o ${marks[i] === true ? 'on' : ''}" data-a="mark" data-v="${k}|${i}|1" aria-label="${i + 1}번 맞음">O</button><button class="x ${marks[i] === false ? 'on' : ''}" data-a="mark" data-v="${k}|${i}|0" aria-label="${i + 1}번 틀림">X</button></span></div>`).join('')}</div>
            <button class="btn mint" data-a="grade" data-v="${k}" ${marks.some(m => m === null) ? 'disabled' : ''}>채점 완료</button>
            <p class="muted" style="font-size:14px">틀린 낱말은 다음 받아쓰기에 다시 나와요.</p>`}
          </div>`; }).join('') : '<p class="muted">재윤이가 받아쓰기를 끝내면 여기에 사진이 와요.</p>'}
      </div>
      <div class="panel"><h3>눈 건강</h3><div class="row"><span style="flex:1">판이 끝날 때마다 20초 눈 쉬는 시간</span><button class="switch ${S.eyeBreak === false ? '' : 'on'}" data-a="eyetoggle" aria-label="눈 쉬는 시간"></button></div>
        <p class="muted" style="font-size:13px">강의를 볼 때는 "팔 길이만큼 떨어져서 보기" 안내가 먼저 나와요.</p></div>
      <div class="panel"><h3>받아쓰기 쓰는 곳</h3><div class="field"><select id="dictmode" data-ch="dictmode" aria-label="받아쓰기 쓰는 곳">
        <option value="auto" ${(S.dictMode || 'auto') === 'auto' ? 'selected' : ''}>자동 (태블릿은 펜, 폰은 공책)</option><option value="pen" ${S.dictMode === 'pen' ? 'selected' : ''}>항상 화면에 펜으로</option><option value="paper" ${S.dictMode === 'paper' ? 'selected' : ''}>항상 공책에 쓰고 사진</option></select></div>
        <p class="muted" style="font-size:13px">펜으로 쓰면 10개를 한 장으로 모아서 엄마에게 보내요. 연필로 쓰는 연습도 중요하니 가끔은 공책을 써 보세요.</p></div>
      <div class="panel"><h3>공부 알림 시간</h3><p class="muted" style="font-size:15px">정한 시간이 지나면 재윤이 화면 맨 위에 "공부할 시간!"이 뜨고 엄마 목소리 #2가 나와요. 앱이 닫혀 있을 때 폰으로 가는 알림은 아직 없어서, 그 시간에 태블릿 알람을 같이 맞춰 두면 좋아요.</p>
        ${[1,2,3,4,5,6,0].map(i => `<div class="alarm-row"><span class="dn">${DOW[i]}</span><input type="time" id="al${i}" value="${S.alarms.time[i]}" data-ch="altime" data-v="${i}" ${S.alarms.on[i] ? '' : 'disabled'}><button class="switch ${S.alarms.on[i] ? 'on' : ''}" data-a="alon" data-v="${i}" aria-label="${DOW[i]}요일 알림 켜기"></button></div>`).join('')}
        <div class="row"><span class="grow" style="flex:1">30분 지나도 시작 안 하면 엄마에게 알림</span><button class="switch ${S.alarms.nudge ? 'on' : ''}" data-a="nudge" aria-label="늦으면 알림"></button></div>
      </div>` + notesPanel('mom', '엄마 알림함');
  } else if (tab === 'oppa') {
    const keys = Array.from({ length:7 }, (_, i) => addDays(todayKey(), i - 6));
    const mins = keys.map(k => minutesOf(S.days[k])); const maxM = Math.max(60, ...mins);
    const studyDays = keys.filter(k => S.days[k] && Object.keys(S.days[k].boards).length).length;
    const acc = {}; ['kor','math','eng','rev'].forEach(s => acc[s] = [0, 0]);
    keys.forEach(k => { const dy = S.days[k]; if (!dy) return; Object.entries(dy.boards).forEach(([s, bo]) => { const n = bo.done ? (bo.n || bo.qs.length) : bo.idx; acc[s][0] += bo.correct; acc[s][1] += n; }); });
    const totC = Object.values(acc).reduce((s, a) => s + a[0], 0), totN = Object.values(acc).reduce((s, a) => s + a[1], 0);
    const top = [...S.wrong].filter(w => w.misses > 0).sort((a, b) => b.misses - a.misses).slice(0, 6);
    const qText = w => w.subj === 'dict' ? `받아쓰기 '${w.q.w}'` : w.q.vis && w.q.vis.k === 'eq' ? w.q.vis.html.replace(/<[^>]+>/g, '') : w.q.subj === 'eng' ? `영어 ${w.q.ans}` : w.q.type === 'clock' ? `시계 ${w.q.ans}` : w.q.subj === 'kor' ? `국어 '${w.q.ans}'` : `${w.q.prompt} (${w.q.ans})`;
    const pr = S.praise || {};
    const g = S.gift, gd = giftDays().length;
    body = weekReportPanel() + `
      <div class="panel"><h3>한 달 선물 약속 ${g.round > 1 ? `(${g.round}번째)` : ''}</h3>
        ${giftAch() ? `<div class="done-note">🎁 ${shortDate(giftAch())}에 ${g.goal}일을 모두 해냈어요! 선물을 주고 아래 버튼을 눌러 주세요.</div>` : `<p>공부를 다 한 날 <b>${gd}</b> / ${g.goal}일</p><div class="meter"><i style="width:${Math.round(gd / g.goal * 100)}%"></i></div>`}
        <div class="field"><label for="gname">약속한 선물 (재윤이 화면에 보여요)</label><input type="text" id="gname" maxlength="30" value="${esc(g.name)}" placeholder="예: 토끼 인형, 색연필 세트"></div>
        <div class="row" style="flex-wrap:wrap"><span class="muted" style="font-size:15px">목표</span>${[20, 25, 30].map(v => `<button class="btn small ${g.goal === v ? '' : 'ghost'}" data-a="giftgoal" data-v="${v}">${v}일</button>`).join('')}</div>
        <button class="btn sky small" data-a="savegift" style="justify-self:start">선물 저장</button>
        ${giftAch() ? `<button class="btn mint" data-a="giftgiven">선물 줬어요 · 다음 약속 시작</button>` : ''}
        <p class="muted" style="font-size:14px">하루 4판을 다 한 날만 세요. 빠진 날이 있어도 이어서 셀 수 있어요. ${g.start ? `${shortDate(g.start)}부터 세는 중.` : ''}</p>
        ${g.history.length ? `<div class="list">${g.history.map(h => `<div class="li"><span class="grow">${h.round}번째 · ${esc(h.name || '깜짝 선물')}</span><span class="pill ok">${shortDate(h.achieved)} 달성</span></div>`).join('')}</div>` : ''}
      </div>
      <div class="panel"><h3>오늘의 칭찬 녹음</h3><p class="muted" style="font-size:15px">재윤이가 하루 공부를 다 끝내면 이 목소리가 나와요.</p>
        <div class="row" style="justify-content:center;gap:16px"><button class="rec-btn ${RECORDING === 'praise' ? 'on' : ''}" data-a="rec" data-v="praise">${RECORDING === 'praise' ? '멈추기' : '녹음'}</button>
        <label class="btn ghost small file-btn">파일 올리기<input type="file" accept="audio/*" data-ch="audio" data-v="praise"></label></div>
        ${pr.audio ? `<audio controls src="${pr.audio}"></audio><button class="btn ghost small" data-a="delpraise" style="justify-self:start">녹음 지우기</button>` : ''}
        <div class="field"><label for="ptext">글로 남기는 칭찬</label><input type="text" id="ptext" maxlength="60" value="${esc(pr.text || '')}" placeholder="재윤아, 오늘도 끝까지 해서 정말 멋져!"></div>
        <button class="btn sky small" data-a="savepraise" style="justify-self:start">칭찬 저장</button>
      </div>
      <div class="panel"><h3>엄마 목소리 6개</h3><p class="muted" style="font-size:15px">엄마가 보내 준 녹음 6개가 들어 있어요. 새로 녹음하면 "바꾸기"로 올려요. 카톡 음성(amr)은 폰에서 재생이 안 되니, 녹음 앱에서 m4a나 mp3로 저장한 파일을 올려 주세요.</p>
        <div class="list">${MOM_LINES.map((l, i) => { const own = !!S.voices[l.id], def = typeof DEFAULT_VOICES !== 'undefined' && !!DEFAULT_VOICES[l.id];
          return `<div class="li" style="flex-wrap:wrap"><span class="grow"><b class="disp" style="font-weight:400">#${i + 1}</b> ${esc(l.text)}<br><span class="muted" style="font-size:13px">${l.when}</span></span>
          ${own || def ? `<span class="pill ok">${own ? '새로 올림' : '엄마 녹음'}</span><button class="btn ghost small" data-a="mom" data-v="${l.id}">듣기</button>${own ? `<button class="btn ghost small" data-a="delvoice" data-v="${l.id}">되돌리기</button>` : ''}` : `<span class="pill no">토끼가 대신</span>`}
          <label class="btn small file-btn ghost">바꾸기<input type="file" accept="audio/*,.m4a,.mp3" data-ch="audio" data-v="${l.id}"></label></div>`; }).join('')}</div>
      </div>
      <div class="panel"><h3>최근 7일</h3>
        <div class="stat-row"><div class="stat"><b>${studyDays}일</b><span>공부한 날</span></div><div class="stat"><b>${Math.round(mins.reduce((a, b) => a + b, 0) / 7)}분</b><span>하루 평균</span></div><div class="stat"><b>${totN ? Math.round(totC / totN * 100) : 0}%</b><span>한 번에 정답</span></div><div class="stat"><b>${S.stickers.length}</b><span>모은 스티커</span></div></div>
        <div class="bars">${keys.map((k, i) => `<div class="bcol"><span class="v">${mins[i] || ''}</span><span class="bar ${mins[i] ? '' : 'zero'}" style="height:${Math.round(mins[i] / maxM * 90)}px"></span><small>${DOW[new Date(k).getDay()]}</small></div>`).join('')}</div>
        <div class="subj-acc">${[['kor','국어','var(--pink)'],['math','수학','var(--sky-deep)'],['eng','영어','var(--mint-deep)'],['rev','복습','var(--lav-deep)']].map(([s, l, c]) => { const p = acc[s][1] ? Math.round(acc[s][0] / acc[s][1] * 100) : 0; return `<div class="r"><span>${l}</span><span class="m"><i style="width:${p}%;background:${c}"></i></span><span style="text-align:right;font-variant-numeric:tabular-nums">${acc[s][1] ? p + '%' : '-'}</span></div>`; }).join('')}</div>
      </div>
      <div class="panel"><h3>자주 틀리는 문제</h3>${top.length ? `<div class="list">${top.map(w => `<div class="li"><span class="grow">${esc(qText(w))}</span><span class="pill">${w.misses}번</span></div>`).join('')}</div>` : '<p class="muted">아직 없어요</p>'}<p class="muted" style="font-size:14px">복습 판에서 두 번 연속 맞히면 목록에서 빠져요. 지금 복습 대기 ${S.wrong.filter(w => w.subj !== 'dict').length}문제.</p></div>
      ${reviewPanel()}
      ${notesPanel('oppa', '오빠 알림함')}`;
  } else {
    body = familyPanel() + `
      <div class="panel"><h3>토리 목소리</h3>
        <p class="muted" style="font-size:15px">폰에 들어 있는 음성으로 읽어 줘요. 재윤이가 좋아하는 소리로 골라 주세요.</p>
        <div class="list">${Object.entries(TTS_PRESETS).map(([k, pr]) => `<button class="li" style="text-align:left;${S.tts.preset === k ? 'outline:3px solid var(--pink)' : ''}" data-a="ttspreset" data-v="${k}"><span class="grow">${pr.name}</span>${S.tts.preset === k ? '<span class="pill">사용 중</span>' : ''}</button>`).join('')}</div>
        <div class="field"><label for="ttspitch">목소리 높이 <b id="pv">${S.tts.pitch.toFixed(2)}</b></label><input type="range" id="ttspitch" min="0.8" max="1.8" step="0.05" value="${S.tts.pitch}" data-ch="tts"></div>
        <div class="field"><label for="ttsrate">말 빠르기 <b id="rv">${S.tts.rate.toFixed(2)}</b></label><input type="range" id="ttsrate" min="0.6" max="1.2" step="0.02" value="${S.tts.rate}" data-ch="tts"></div>
        ${langVoices('ko').length > 1 ? `<div class="field"><label>한국어 목소리 고르기 (${langVoices('ko').length}개)</label><div class="list">${langVoices('ko').map(v => { const on = pickVoice('ko', S.tts.voice) === v; return `<div class="li" style="${on ? 'outline:3px solid var(--pink)' : ''}"><span class="grow" style="font-size:14px">${esc(v.name)}${v.localService ? '' : ' · 온라인'}</span><button class="btn ghost small" data-a="ttsvoice" data-v="${esc(v.name)}">${on ? '듣기' : '고르기'}</button></div>`; }).join('')}</div></div>` : `<p class="muted" style="font-size:14px">이 폰에서 고를 수 있는 한국어 목소리가 ${langVoices('ko').length ? '하나뿐이에요' : '아직 안 보여요'}. 갤럭시 설정에서 "TTS"를 검색하면 다른 목소리를 내려받을 수 있어요.</p>`}
        <button class="btn sky" data-a="ttstest">들어 보기</button>
      </div>
      <div class="panel"><h3>토끼 친구 이름</h3><div class="field"><input type="text" id="bname" maxlength="8" value="${esc(S.bunnyName)}"></div><button class="btn small" data-a="savename" style="justify-self:start">이름 저장</button></div>
      <div class="panel"><h3>비밀번호 바꾸기</h3><div class="field"><input type="password" inputmode="numeric" id="newpin" maxlength="4" placeholder="숫자 4자리"></div><button class="btn small" data-a="savepin" style="justify-self:start">바꾸기</button></div>
      <div class="panel"><h3>한 판 문제 수</h3><p class="muted" style="font-size:15px">재윤이가 푸는 속도를 보고 하루 1시간 안에 끝나도록 자동으로 맞춰요. 지금 기준: 국어 ${countFor('kor')}문제, 수학 ${countFor('math')}문제, 영어 ${countFor('eng')}문제 + 받아쓰기 10개, 복습 ${countFor('rev')}문제.</p></div>
      <div class="panel"><h3>체험판 도구</h3>
        <p class="muted" style="font-size:15px">지금 보는 날짜: ${korDate(now())}</p>
        <button class="btn sky small" data-a="nextday" style="justify-self:start">하루 넘기기 (내일로)</button>
        <button class="btn ghost small" data-a="reset" style="justify-self:start">${RESET_ARMED ? '정말 처음부터? 한 번 더 누르면 지워져요' : '모든 기록 지우고 처음부터'}</button>
        <p class="demo-note">지금은 이 폰 하나에 재윤이·엄마·오빠 화면이 함께 들어 있는 체험판이에요. 서버를 연결하면 세 폰이 같은 기록을 나눠 써요.</p>
      </div>`;
  }
  app().innerHTML = `<section class="screen adult">${adultHead()}${body}</section>`;
};
let RESET_ARMED = false;

/* ----- 녹음 ----- */
let RECORDING = null, REC = null, CHUNKS = [];
async function startRec(target){
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    CHUNKS = []; REC = new MediaRecorder(stream);
    REC.ondataavailable = e => CHUNKS.push(e.data);
    REC.onstop = () => { stream.getTracks().forEach(t => t.stop()); const blob = new Blob(CHUNKS, { type:REC.mimeType || 'audio/webm' }); blobToData(blob).then(data => { setAudio(target, data); }); };
    REC.start(); RECORDING = target; go('adult');
  } catch (e) {
    toast('이 화면에서는 바로 녹음이 안 돼요. "파일 올리기"로 녹음 파일을 올려 주세요.');
  }
}
function stopRec(){ try { REC && REC.stop(); } catch (e) {} RECORDING = null; }
function blobToData(blob){ return new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); }); }
function setAudio(target, data){
  if (target === 'praise') { S.praise = Object.assign(S.praise || {}, { audio:data, at:Date.now() }); toast('칭찬 녹음을 저장했어요'); }
  else { S.voices[target] = data; toast(`엄마 목소리 #${MOM_LINES.findIndex(l => l.id === target) + 1}을 저장했어요`); }
  save(); go('adult');
}

/* ----- 꽃가루 ----- */
function confetti(){
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('canvas.confetti').forEach(x => x.remove());
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
  setTimeout(() => c.remove(), 3500);
  const ctx = c.getContext('2d'); const W = c.width = innerWidth, H = c.height = innerHeight;
  const cols = ['#FF8FB1','#7FD8BE','#8CC9FF','#FFE08A','#C3ADF2'];
  const ps = Array.from({ length:90 }, () => ({ x:W / 2 + (Math.random() - .5) * 80, y:H * .35, vx:(Math.random() - .5) * 9, vy:-Math.random() * 11 - 3, r:Math.random() * 6 + 4, c:pick(cols), a:Math.random() * 6, s:Math.random() < .5 }));
  let f = 0;
  (function tick(){ ctx.clearRect(0, 0, W, H); ps.forEach(p => { p.vy += .32; p.x += p.vx; p.y += p.vy; p.a += .15; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = p.c; if (p.s) { ctx.beginPath(); ctx.arc(0, 0, p.r / 1.6, 0, 7); ctx.fill(); } else ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); ctx.restore(); });
    if (++f < 110) requestAnimationFrame(tick); else c.remove(); })();
}

/* ===================== 동작 연결 ===================== */
const ACT = {
  start(){ S.started = true; S.firstDay = S.firstDay || todayKey(); giftStart(); save(); SFX.tap(); go('home'); },
  home(){ go('home'); },
  go(el){ go(el.dataset.v, el.dataset.lesson ? { lesson:el.dataset.lesson } : el.dataset.s ? { s:el.dataset.s } : undefined); },
  board(el){
    const k = el.dataset.k, d = day();
    if (boardState(k, d) === 'done') { speak(`${josa(BNAME[k], "은", "는")} 오늘 다 했어!`); toast(`${josa(BNAME[k], "은", "는")} 오늘 다 했어요!`); return; }
    if (!d.boards[k]) { d.boards[k] = makeBoard(k); if (Object.keys(d.boards).length === 1) notify('mom', '재윤이가 오늘 공부를 시작했어요'); save(); }
    RUN = { k, b:d.boards[k] }; go('intro', k);
  },
  begin(){ const b = RUN.b; SFX.tap(); if (b.phase === 'dict') return go('dict'); if (b.idx >= b.qs.length) return writeTaskFor(b) ? go('write') : afterWrite();
    if (b.cur && !b.cur.test && !b.cardsSeen && b.idx === 0) { if (boardHasLecture(b) && !b.lecSkip) return openLecture(b.cur.subj, b.cur.lec); return go('cards', { lesson:b.cur.lesson, fromBoard:true }); }
    go('q'); },
  lecopt(el){ const [s, n] = el.dataset.v.split('|'); openLecture(s, +n, true); },
  lecdone(el){ const w = LECW; if (!w) return go('home'); const mins = Math.round((Date.now() - w.at) / 60000), li = lectInfo(w.s, w.n);
    if (mins < 10 && !el.dataset.sure) { el.dataset.sure = '1'; el.textContent = '정말 끝까지 다 봤어요!'; speak(`벌써 다 봤어? ${li.no}강은 ${li.mins}분짜리야. 끝까지 봤으면 한 번 더 눌러 줘!`); return; }
    if (w.opt) { const c = curr(w.s); if (!c.seen[w.n]) c.seen[w.n] = { d:todayKey(), mins }; notify('mom', `📺 재윤이가 EBS ${li.no}강(${li.desc})을 골라서 봤어요 (${mins}분)`); save(); }
    else markLectureSeen(w.s, w.n, mins);
    LECW = null; try { sessionStorage.removeItem('lecw'); } catch (e) {}
    SFX.sticker(); afterLecture(w.opt); },
  lecfail(){ const w = LECW; LECW = null; try { sessionStorage.removeItem('lecw'); } catch (e) {}
    notify('mom', '📺 재윤이가 EBS 강의를 열지 못했어요. 태블릿 크롬에서 EBS 초등 로그인이 되어 있는지 확인해 주세요');
    const b = RUN && RUN.b; if (b && b.cur) { b.lecSkip = true; save(); }
    speak('괜찮아! 엄마한테 알려 둘게. 오늘은 토리랑 개념을 배우자!');
    if (w && !w.opt && b && b.cur && !b.done && !b.cur.test) return go('cards', { lesson:b.cur.lesson, fromBoard:true });
    if (RUN) return go('intro', RUN.k); go('home'); },
  ebstoggle(el){ const s = el.dataset.v; S.ebsOn = S.ebsOn || {}; S.ebsOn[s] = !ebsOn(s); save(); const y = scrollY; go('adult'); scrollTo(0, y); },
  mom(el){ playMom(el.dataset.v); },
  m2(){ const d = day(); d.m2 = true; save(); playMom('m2'); },
  kidnote(){ S.kidNotes.shift(); save(); go('home'); },
  replay(){ if (RUN && RUN.q) replayWord(RUN.q); },
  sayopt(el, ev){ ev.stopPropagation(); ++SEQ; speak(el.dataset.v, el.dataset.l || 'en-US'); },
  ans(el){ const q = RUN.q; if (el.classList.contains('wrong') || el.classList.contains('dim')) return; answer(q.opts[+el.dataset.i]); },
  num(el){
    if (RUN.locked) return; const v = el.dataset.v; SFX.tap();
    if (v === 'del') RUN.typed = RUN.typed.slice(0, -1);
    else if (v === 'ok') { if (RUN.typed) answer(Number(RUN.typed)); return; }
    else if (RUN.typed.length < Math.min(5, Math.max(3, String(RUN.q.ans).length + 1))) RUN.typed = (RUN.typed === '0' ? '' : RUN.typed) + v;
    rerenderInput();
  },
  tile(el){
    if (RUN.locked) return; const i = +el.dataset.i, q = RUN.q;
    if (RUN.built.includes(i) || RUN.built.length >= q.ans.length) return;
    SFX.tap(); RUN.built.push(i); rerenderInput();
    if (RUN.built.length === q.ans.length) setTimeout(() => answer(RUN.built.map(x => q.tiles[x]).join('')), 250);
  },
  unbuild(el){ if (RUN.locked) return; const i = +el.dataset.i; if (RUN.built[i] == null) return; RUN.built = RUN.built.slice(0, i); rerenderInput(); },
  nextq(){ nextQ(); },
  eyetoggle(){ S.eyeBreak = S.eyeBreak === false ? true : false; save(); const y = scrollY; go('adult'); scrollTo(0, y); },
  eyedone(el){ const v = el.dataset.v; if (v === 'lesson' && RUN && RUN.b && RUN.b.cur) return go('cards', { lesson:RUN.b.cur.lesson, fromBoard:true }); if (v === 'intro' && RUN) return go('intro', RUN.k); go('home'); },
  async joinrole(el){ const m = $('#joinmsg'); if (m) m.textContent = '연결하는 중이에요…'; const ok = await Sync.join(JOIN_FID, el.dataset.v).catch(e => { console.warn(e); return false; });
    if (!ok) { if (m) m.textContent = '연결하지 못했어요. 인터넷이 되는지, 링크가 맞는지 확인해 주세요.'; return; }
    history.replaceState(null, '', location.pathname); toast('가족과 연결됐어요!'); if (el.dataset.v === 'kid') go('home'); else { S.adultTab = el.dataset.v; go('adult'); } },
  async famcreate(el){ const m = $('#fammsg'); if (m) m.textContent = '가족방을 만드는 중이에요…'; const ok = await Sync.create(el.dataset.v).catch(e => { console.warn(e); return false; });
    if (!ok) { if (m) m.textContent = '만들지 못했어요. ' + (Sync.error || '인터넷 연결과 Firebase 보안 규칙을 확인해 주세요.'); S.local = null; saveLocal(); return; }
    toast('가족방을 만들었어요. 링크를 카톡으로 보내 주세요'); go('adult'); },
  famcopy(){ const v = familyLink(); try { navigator.clipboard.writeText(v).then(() => toast('링크를 복사했어요'), () => { $('#famlink').select(); toast('링크를 길게 눌러 복사해 주세요'); }); } catch (e) { $('#famlink').select(); } },
  famrole(){ JOIN_FID = S.local.fid; go('join'); },
  cardsay(){ const l = lessonById(CARDS.lesson); sayParts(l.cards[CARDS.i].say); },
  cardmove(el){ CARDS.i = clamp(CARDS.i + +el.dataset.v, 0, lessonById(CARDS.lesson).cards.length - 1); SFX.tap(); go('cards'); },
  cardsdone(){ if (CARDS.fromBoard && RUN && RUN.b) { RUN.b.cardsSeen = true; save(); go('q'); } else go('map', { s:lessonById(CARDS.lesson).subj }); },
  lvlset(el){ const [k, v] = el.dataset.v.split('|'); S.level[k] = +v; save(); toast('난이도를 바꿨어요. 다음 판부터 적용돼요'); const y = scrollY; go('adult'); scrollTo(0, y); },
  ttspreset(el){ const pr = TTS_PRESETS[el.dataset.v]; S.tts.preset = el.dataset.v; S.tts.pitch = pr.pitch; S.tts.rate = pr.rate; save(); const y = scrollY; go('adult'); scrollTo(0, y); ttsSample(); },
  ttsvoice(el){ S.tts.voice = el.dataset.v; save(); const y = scrollY; go('adult'); scrollTo(0, y); ttsSample(); },
  ttstest(){ ttsSample(); },
  poke(){
    const line = pick(POKE_LINES); const b = $('#heroBubble'); if (b) b.textContent = line;
    const svg = $('.stage-btn .bunny'); if (svg) { svg.classList.remove('hop'); void svg.getBoundingClientRect(); svg.classList.add('hop'); }
    tone([[1318,0,.08],[1568,.08,.12]]); speak(line);
  },
  giftgoal(el){ if (giftAch()) { toast('이번 약속은 이미 달성했어요'); return; } S.gift.goal = +el.dataset.v; S.gift.name = $('#gname').value.trim(); checkGift(); save(); const y = scrollY; go('adult'); scrollTo(0, y); },
  savegift(){ S.gift.name = $('#gname').value.trim(); save(); toast('선물 약속을 저장했어요. 재윤이 화면에 보여요'); },
  giftgiven(){ const g = S.gift, ach = giftAch(); g.history.unshift({ round:g.round, name:g.name, achieved:ach }); S.gift = { name:'', goal:g.goal, round:g.round + 1, start:addDays(ach, 1), achieved:null, history:g.history }; if (S.gift.start > todayKey()) S.gift.start = addDays(todayKey(), day().done ? 1 : 0); save(); toast('다음 선물 약속을 시작했어요'); go('adult'); },
  instbr(el){ INSTALL.br = el.dataset.v; go('install'); },
  saystep(el){ speak(installSteps('kid', INSTALL.br)[+el.dataset.v]); },
  async installnow(){ if (!deferredInstall) return; deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch (e) {} deferredInstall = null; go('install'); },
  installkid(){ go('install', { who:'kid' }); },
  installmom(){ go('install', { who:'mom' }); },
  dictsay(){ ++SEQ; const dt = day().dict; speak(dt.words[dt.idx], 'ko-KR', .8); },
  dictnext(){ if (Date.now() - (window.__dictShown || 0) < 900) return; const dt = day().dict; if (penMode()) { if (!PEN.drawn) { toast('칸에 먼저 써 주세요'); speak('칸에 먼저 써 볼까?'); return; } dt.pen = dt.pen || []; dt.pen[dt.idx] = penImage(); } SFX.tap(); dt.idx++; if (penMode() && dt.idx >= dt.words.length) { composePen(dt).then(img => { dt.photo = img; dt.pen = null; save(); go('photo'); }); return; } save(); go(dt.idx >= dt.words.length ? 'photo' : 'dict'); },
  penclear(){ setupPen(); },
  revnext(){ reviewQ(); const y = scrollY; go('adult'); scrollTo(0, y); },
  revbad(){ const q = REV.q; if (!q) return; S.reviewNotes = S.reviewNotes || []; S.reviewNotes.push({ lesson:REV.lesson, prompt:q.prompt + (q.vis && q.vis.html ? ' / ' + q.vis.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120) : '') + (q.listen ? ' / 듣기: ' + q.listen : ''), opts:(q.opts || []).join(', '), ans:String(q.ans), memo:($('#revmemo') || {}).value || '' }); saveLocal(); toast('표시했어요'); reviewQ(); const y = scrollY; go('adult'); scrollTo(0, y); },
  revcopy(){ const t = reviewText(); try { navigator.clipboard.writeText(t).then(() => toast('복사했어요. Claude에게 붙여 넣어 주세요'), () => toast('복사가 안 됐어요')); } catch (e) { toast('복사가 안 됐어요'); } },
  revclear(){ S.reviewNotes = []; saveLocal(); const y = scrollY; go('adult'); scrollTo(0, y); },
  writeclear(){ const w = WRITE_TASKS[RUN.b.cur.lesson]; setupPen(w.lines + 1); },
  writesay(){ const w = WRITE_TASKS[RUN.b.cur.lesson]; speak(w.prompt); },
  writedone(){ if (RUN.b.wrote) return; if (penMode()) { if (!PEN.drawn) { toast('칸에 먼저 써 주세요'); speak('칸에 먼저 써 볼까?'); return; } saveWrite(penImage()); } else { const have = (day().writes || {})[RUN.k]; if (!have || !have.img) return; saveWrite(have.img); } SFX.sticker(); speak('멋지다! 엄마한테 보냈어!'); afterWrite(); },
  writeskip(){ if (RUN.b.wrote) return; saveWrite(null, true); afterWrite(); },
  writefb(el){ const parts = el.dataset.v.split('|'), good = parts.pop() === '1', key = parts.join('|'); const inp = document.getElementById('wfb-' + key); S.writeFb = S.writeFb || {}; S.writeFb[key] = { good, text:(inp && inp.value.trim()) || '', at:Date.now() }; applyWriteFb(); save(); toast('재윤이에게 한마디를 보냈어요'); notify('oppa', `엄마가 재윤이 글에 ${good ? '💗 칭찬' : '✏️ 다시 써 보자'}를 남겼어요`); const y = scrollY; go('adult'); scrollTo(0, y); },
  sendphoto(){ const d = day(); if (d.boards.eng && d.boards.eng.done) return; d.dict.sent = true; notify('mom', '📒 재윤이가 받아쓰기 사진을 보냈어요. 채점해 주세요!'); save(); finishBoard('eng'); },
  skipphoto(){ const d = day(); if (d.boards.eng && d.boards.eng.done) return; d.dict.sent = true; notify('mom', '📒 재윤이가 받아쓰기를 끝냈어요 (사진 없음). 공책을 보고 채점해 주세요'); save(); finishBoard('eng'); },
  roomtab(el){ ROOM_TAB = el.dataset.v; go('room'); },
  equip(el){
    const it = ITEMS.find(i => i.id === el.dataset.v);
    if (S.stickers.length < it.need) { speak(`스티커 ${it.need - S.stickers.length}개 더 모으면 받을 수 있어!`); return; }
    S.equipped[it.slot] = S.equipped[it.slot] === it.id ? null : it.id; SFX.tap(); save(); go('room');
    const st = $('.dress-stage .bunny'); if (st) st.classList.add('hop');
  },
  calmove(el){ CAL.m += +el.dataset.v; if (CAL.m < 0) { CAL.m = 11; CAL.y--; } if (CAL.m > 11) { CAL.m = 0; CAL.y++; } go('cal'); },
  praise(){ if (S.praise && S.praise.audio) playClip(S.praise.audio); },
  pin(el){
    const v = el.dataset.v; SFX.tap();
    if (v === 'del') PIN = PIN.slice(0, -1); else if (PIN.length < 4) PIN += v;
    if (PIN.length === 4) { if (PIN === S.pin) { PIN = ''; return go('adult'); } PIN = ''; toast('비밀번호가 달라요'); }
    go('pin');
  },
  atab(el){ S.adultTab = el.dataset.v; RESET_ARMED = false; save(); go('adult'); },
  mark(el){ const [k, i, v] = el.dataset.v.split('|'); const g = gradeOf(k, true); g.marks[+i] = v === '1'; save(); const y = scrollY; go('adult'); scrollTo(0, y); },
  grade(el){
    const k = el.dataset.v, g = gradeOf(k, true); if (g.marks.some(m => m === null)) return;
    g.graded = true; g.score = g.marks.filter(Boolean).length; g.at = Date.now();
    notify('oppa', `엄마가 ${shortDate(k)} 받아쓰기를 채점했어요: ${g.score}/10`);
    applyGrades();   // 이 기기가 재윤이 기록을 가진 경우 바로 반영 (가족 연결 때는 재윤이 태블릿이 반영)
    save(); toast('채점을 저장했어요'); go('adult');
  },
  zoom(el){ const dt = S.days[el.dataset.v].dict; const o = document.createElement('div'); o.className = 'overlay'; o.innerHTML = `<img src="${dt.photo}" alt="받아쓰기 사진 크게 보기">`; o.onclick = () => o.remove(); document.body.appendChild(o); },
  alon(el){ const i = +el.dataset.v; S.alarms.on[i] = !S.alarms.on[i]; save(); const y = scrollY; go('adult'); scrollTo(0, y); },
  nudge(){ S.alarms.nudge = !S.alarms.nudge; save(); const y = scrollY; go('adult'); scrollTo(0, y); },
  rec(el){ if (RECORDING) { stopRec(); } else startRec(el.dataset.v); },
  delpraise(){ if (S.praise) S.praise.audio = null; save(); go('adult'); },
  savepraise(){ S.praise = Object.assign(S.praise || {}, { text:$('#ptext').value.trim(), at:Date.now() }); save(); toast('칭찬을 저장했어요'); },
  delvoice(el){ delete S.voices[el.dataset.v]; save(); go('adult'); },
  savename(){ const v = $('#bname').value.trim(); if (!v) return; S.bunnyName = v; save(); toast(`토끼 친구 이름: ${v}`); },
  savepin(){ const v = $('#newpin').value.trim(); if (!/^\d{4}$/.test(v)) { toast('숫자 4자리로 적어 주세요'); return; } S.pin = v; save(); toast('비밀번호를 바꿨어요'); $('#newpin').value = ''; },
  nextday(){ S.dayOffset = (S.dayOffset || 0) + 1; RUN = null; CAL = null; save(); toast(`${korDate(now())}로 넘어갔어요`); go('adult'); },
  reset(){ if (!RESET_ARMED) { RESET_ARMED = true; go('adult'); return; } RESET_ARMED = false; if (linked()) Sync.leave(); S = freshState(); saveLocal(); go('home'); },
};
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]'); if (!el) return;
  if (el.getAttribute('aria-disabled') === 'true' && el.dataset.a !== 'equip') return;
  const fn = ACT[el.dataset.a]; if (fn) fn(el, ev);
});
document.addEventListener('change', async ev => {
  const el = ev.target;
  if (el.id === 'writeIn' && el.files && el.files[0]) {
    try { const d = day(); d.writes = d.writes || {}; const w = WRITE_TASKS[RUN.b.cur.lesson]; d.writes[RUN.k] = { lesson:RUN.b.cur.lesson, prompt:w.prompt, img:await compressImage(el.files[0]), at:Date.now() }; save(); go('write'); } catch (e) { toast('사진을 불러오지 못했어요. 다시 찍어 주세요'); }
  } else if (el.id === 'photoIn' && el.files && el.files[0]) {
    try { day().dict.photo = await compressImage(el.files[0]); save(); go('photo'); } catch (e) { toast('사진을 불러오지 못했어요. 다시 찍어 주세요'); }
  } else if (el.dataset.ch === 'audio' && el.files && el.files[0]) {
    const f = el.files[0];
    if (f.size > 1.5 * 1024 * 1024) { toast('파일이 너무 커요 (1.5MB 이하로 올려 주세요)'); return; }
    if (/\.amr$/i.test(f.name) || f.type === 'audio/amr') { toast('카톡 음성(amr)은 폰에서 재생이 안 돼요. m4a나 mp3 파일로 올려 주세요'); el.value = ''; return; }
    setAudio(el.dataset.v, await blobToData(f));
  } else if (el.dataset.ch === 'tts') {
    S.tts.pitch = +$('#ttspitch').value; S.tts.rate = +$('#ttsrate').value; S.tts.preset = 'custom'; save();
    $('#pv').textContent = S.tts.pitch.toFixed(2); $('#rv').textContent = S.tts.rate.toFixed(2); ttsSample();
  } else if (el.dataset.ch === 'dictmode') {
    S.dictMode = el.value; save(); toast('받아쓰기 쓰는 곳을 바꿨어요');
  } else if (el.dataset.ch === 'cmode') {
    const s = el.dataset.v; if (s === 'math') S.mathMode = el.value; else { S.modes = S.modes || {}; S.modes[s] = el.value; }
    save(); toast(`${SUBJ_NAME[s]}: ${el.value === 'curr' ? '진도 방식' : '자유 연습'}으로 바꿨어요. 다음에 시작하는 판부터 적용돼요`); const y = scrollY; go('adult'); scrollTo(0, y);
  } else if (el.dataset.ch === 'pace') {
    S.pace = el.value; save(); toast(el.value === 'slow' ? '천천히: 한 차시를 이틀 연습해요' : '보통 속도로 바꿨어요');
  } else if (el.dataset.ch === 'revlesson') {
    REV.lesson = el.value; reviewQ(); const y = scrollY; go('adult'); scrollTo(0, y);
  } else if (el.dataset.ch === 'cjump') {
    const s = el.dataset.v, [u, l, t] = el.value.split('|').map(Number); Sync.touch(s === 'math' ? 'curr' : 'currs'); const c = curr(s); c.unit = u; c.lesson = l; c.test = !!t; save(); toast(`${SUBJ_NAME[s]} 진도를 옮겼어요: ${currLabel(s)}`); const y = scrollY; go('adult'); scrollTo(0, y);
  } else if (el.dataset.ch === 'level') {
    S.level[el.dataset.v] = +el.value; save(); toast(`${{kor:'국어',math:'수학',eng:'영어'}[el.dataset.v]}: ${el.options[el.selectedIndex].text}로 바꿨어요`); const y = scrollY; go('adult'); scrollTo(0, y);
  } else if (el.dataset.ch === 'altime') { S.alarms.time[+el.dataset.v] = el.value; save(); }
});

