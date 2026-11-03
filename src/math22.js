/* ===================== 수학 단원 진도: 초2 2학기 (2022 개정) =====================
   차시 id p1-1 … p6-5 (다른 코스와 안 겹치게), 문제 키는 'p22:'로 시작.
   EBS 강의 연결은 아직 없음 → ebs·lect 없음 (엔진이 강의 없는 코스로 처리, 영어 코스처럼) */
const P22_PLACE = ['천', '백', '십', '일'];
const P22_WDAY = ['일', '월', '화', '수', '목', '금', '토'];
const p22T = (h, m) => m ? `${h}시 ${m}분` : `${h}시`;
const p22Clock = (h, m, w = 170) => clockSVG(h, m).replace('<svg class="clock"', `<svg class="clock" style="width:${w}px;height:${w}px;max-width:100%"`);
const p22Box = (h, w = 170) => `<div style="width:${w}px;max-width:100%;margin:auto">${h}</div>`;
const p22Row = (...hs) => `<div class="row" style="justify-content:center;gap:14px;flex-wrap:wrap;align-items:flex-end">${hs.join('')}</div>`;
const p22Txt = (x, y, t, o = {}) => `<text x="${x}" y="${y}" font-size="${o.fs || 14}" text-anchor="${o.a || 'middle'}" dominant-baseline="central" fill="${o.c || C.ink}" font-family="Jua, sans-serif">${t}</text>`;

/* 수 모형 칩: cnt = [천, 백, 십, 일] (money면 1000원 지폐 · 100원 · 10원 · 1원) */
function p22Chips(cnt, money){
  const sty = money
    ? [{ w:66, h:34, r:4, fill:'#BFE8C8', lab:'1000원', fs:12 }, { w:34, h:34, r:17, fill:'#E4E4EC', lab:'100', fs:12 }, { w:30, h:30, r:15, fill:'#F2C9A0', lab:'10', fs:12 }, { w:24, h:24, r:12, fill:'#F7E3A1', lab:'1', fs:12 }]
    : [{ w:46, h:46, r:6, fill:C.skyD, lab:'1000', fs:13, tc:'#fff' }, { w:38, h:38, r:5, fill:C.pink, lab:'100', fs:13 }, { w:30, h:30, r:4, fill:C.mint, lab:'10', fs:13 }, { w:24, h:24, r:12, fill:C.butter, lab:'1', fs:13 }];
  let x = 6, svg = '', H = 0;
  cnt.forEach((n, k) => { if (!n) return; const s = sty[k], cols = Math.min(3, n), rows = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) { const cx = x + (i % 3) * (s.w + 4), cy = 6 + Math.floor(i / 3) * (s.h + 4);
      svg += `<rect x="${cx}" y="${cy}" width="${s.w}" height="${s.h}" rx="${s.r}" fill="${s.fill}" stroke="${C.ink}" stroke-width="2"/>` + p22Txt(cx + s.w / 2, cy + s.h / 2 + 1, s.lab, { fs:s.fs, c:s.tc }); }
    H = Math.max(H, rows * (s.h + 4)); x += cols * (s.w + 4) + 14; });
  const W = Math.max(x, 40), HH = H + 10;
  return `<svg class="draw" viewBox="0 0 ${W} ${HH}" width="${Math.min(W * 1.2, 560)}" style="max-width:100%;height:auto" role="img" aria-label="${money ? '돈' : '수 모형'}">${svg}</svg>`;
}
/* 곱셈표 · 덧셈표 일부 (hole: [행, 열] → ?, hi: 색칠할 칸 목록) */
function p22OpTable(r0, c0, rows, cols, hole, op = '×', hi = []){
  const f = op === '×' ? (a, b) => a * b : (a, b) => a + b, isHi = (r, c) => hi.some(([a, b]) => a === r && b === c);
  let s = `<table class="pv hchart" style="margin:auto"><tr><td style="background:#FFE3EC">${op}</td>`;
  for (let c = 0; c < cols; c++) s += `<td style="background:#FFF4D6">${c0 + c}</td>`;
  s += '</tr>';
  for (let r = 0; r < rows; r++) { s += `<tr><td style="background:#E6F3FF">${r0 + r}</td>`;
    for (let c = 0; c < cols; c++) s += `<td${isHi(r, c) ? ' style="background:#FFC2D4"' : ''}>${hole && hole[0] === r && hole[1] === c ? QB : f(r0 + r, c0 + c)}</td>`;
    s += '</tr>'; }
  return s + '</table>';
}
/* 줄자: 물건 끝이 n cm (한쪽 끝은 0에 맞춤) */
function p22Tape(n, label){
  const w0 = Math.max(0, Math.floor(n / 10) * 10 - 30), span = 60, px = 6, x0 = 20, W = span * px + 40, X = v => x0 + (v - w0) * px;
  let s = `<rect x="0" y="6" width="${X(n)}" height="24" rx="4" fill="${C.pink}" stroke="${C.ink}" stroke-width="2"/>`;
  if (label) s += p22Txt(Math.max(30, X(n) / 2), 18, label, { fs:13 });
  s += `<rect x="2" y="40" width="${W - 4}" height="44" rx="4" fill="#FFF3B8" stroke="${C.ink}" stroke-width="2"/>`;
  for (let v = w0; v <= w0 + span; v++) { const big = v % 10 === 0, mid = v % 5 === 0;
    s += `<line x1="${X(v)}" y1="40" x2="${X(v)}" y2="${40 + (big ? 18 : mid ? 12 : 7)}" stroke="${C.ink}" stroke-width="${big ? 2 : 1}"/>`;
    if (big) s += p22Txt(X(v), 72, v, { fs:12 }); }
  s += `<line x1="${X(n)}" y1="30" x2="${X(n)}" y2="40" stroke="${C.pinkD}" stroke-width="2" stroke-dasharray="3 2"/>`;
  return `<svg class="draw" viewBox="0 0 ${W} 88" width="${W}" style="max-width:100%;height:auto" role="img" aria-label="줄자">${s}</svg>`;
}
/* 1 m 막대 (10 cm씩 10칸) */
function p22MeterSVG(){
  let s = ''; for (let i = 0; i < 10; i++) s += `<rect x="${10 + i * 34}" y="30" width="34" height="26" fill="${i % 2 ? C.sky : '#DDF0FF'}" stroke="${C.ink}" stroke-width="1.5"/>` + p22Txt(10 + i * 34 + 17, 70, (i + 1) * 10, { fs:11 });
  s += `<path d="M10 22 Q10 12 20 12 L170 12 Q180 12 180 4 Q180 12 190 12 L340 12 Q350 12 350 22" fill="none" stroke="${C.pinkD}" stroke-width="2.5"/>` + p22Txt(180, 0, '1 m = 100 cm', { fs:15, c:C.pinkD });
  return `<svg class="draw" viewBox="0 -12 360 92" width="360" style="max-width:100%;height:auto" role="img" aria-label="1 m 막대">${s}</svg>`;
}
/* 길이 세로셈 (a, b = [m, cm], hole 0: m 칸, 1: cm 칸) */
function p22LenTab(a, b, op, hole){
  const r = op === '+' ? [a[0] + b[0], a[1] + b[1]] : [a[0] - b[0], a[1] - b[1]];
  const u = t => `<td style="border:0;font-size:18px;min-width:0;padding:6px 4px">${t}</td>`, cell = (v, q) => `<td>${q ? QB : v}</td>`;
  return `<table class="pv" style="margin:auto"><tr><td style="border:0"></td>${cell(a[0])}${u('m')}${cell(a[1])}${u('cm')}</tr>`
    + `<tr><td style="border:0">${op}</td>${cell(b[0])}${u('m')}${cell(b[1])}${u('cm')}</tr>`
    + `<tr class="sum"><td style="border:0"></td>${cell(r[0], hole === 0)}${u('m')}${cell(r[1], hole === 1)}${u('cm')}</tr></table>`;
}
/* 달력 (mo월, 1일 요일 s, 날수 dd, mark: 칠할 날) */
function p22Cal(mo, s, dd, mark){
  const td = (t, st = '') => `<td style="min-width:34px;padding:4px;font-size:16px;${st}">${t}</td>`;
  let t = `<div style="text-align:center;font-family:Jua,sans-serif;font-size:20px">${mo}월</div><table class="pv" style="margin:auto"><tr>${P22_WDAY.map((w, i) => td(w, i === 0 ? 'color:#EE5F8D' : i === 6 ? 'color:#3E93E0' : '')).join('')}</tr>`;
  let day = 1 - s; while (day <= dd) { t += '<tr>'; for (let i = 0; i < 7; i++, day++) t += td(day >= 1 && day <= dd ? day : '', mark === day ? 'background:#FFC2D4' : ''); t += '</tr>'; }
  return t + '</table>';
}
/* 하루 시간 띠 (오전 · 오후) */
function p22DaySVG(){
  let s = ''; for (let i = 0; i < 24; i++) s += `<rect x="${10 + i * 15}" y="26" width="15" height="22" fill="${i < 12 ? '#FFF3B8' : '#DDF0FF'}" stroke="${C.ink}" stroke-width="1"/>`;
  [0, 3, 6, 9, 12, 15, 18, 21, 24].forEach(i => { s += p22Txt(10 + i * 15, 60, i % 12 === 0 ? 12 : i % 12, { fs:11 }); });
  s += p22Txt(100, 12, '오전 (밤 12시 → 낮 12시)', { fs:12 }) + p22Txt(280, 12, '오후 (낮 12시 → 밤 12시)', { fs:12 });
  return `<svg class="draw" viewBox="0 0 380 70" width="380" style="max-width:100%;height:auto" role="img" aria-label="하루 시간 띠">${s}</svg>`;
}

/* ---------- 곱셈구구 재료 ---------- */
/* [그림, 이름, 세는 말, 부분, 단위] — "자전거 한 대에 바퀴가 2개" */
const P22_DAN = {
  2:[['🚲','자전거','대','바퀴','개'],['🐰','토끼','마리','귀','개'],['🦆','오리','마리','다리','개']],
  3:[['☘️','세잎클로버','개','잎','장'],['🍡','경단 꼬치','개','경단','개'],['🔺','삼각형','개','꼭짓점','개']],
  4:[['🚗','자동차','대','바퀴','개'],['🐶','강아지','마리','다리','개'],['🍀','네잎클로버','개','잎','장']],
  5:[['🌸','꽃','송이','꽃잎','장'],['🧤','장갑','짝','손가락 칸','개'],['⭐','별 모양 쿠키','개','뾰족한 곳','군데']],
  6:[['🐞','무당벌레','마리','다리','개'],['🐜','개미','마리','다리','개'],['🥚','달걀 판','개','달걀','개']],
  7:[['🧃','주스','상자','주스','병'],['🍬','사탕','봉지','사탕','개'],['🖍️','크레파스','통','크레파스','자루']],
  8:[['🐙','문어','마리','다리','개'],['🕷️','거미','마리','다리','개'],['✏️','색연필','통','색연필','자루']],
  9:[['⚾','야구팀','팀','선수','명'],['🧩','퍼즐','판','조각','개'],['🍪','과자','상자','과자','개']],
};
const P22_PROD = (() => { const m = {}; for (let a = 1; a <= 9; a++) for (let b = 1; b <= 9; b++) (m[a * b] = m[a * b] || []).push(`${a} × ${b}`); return m; })();
const p22DanSeq = (a, n) => Array.from({ length:n }, (_, i) => a * (i + 1)).join(', ');
function p22Dan(D){
  const a = pick(D), v = rnd(0, 5); let b = rnd(1, 9); const ab = a * b;
  if (v === 0) return nq(`p22:mu${a}x${b}`, 'mul', '곱셈을 해요', `${a} 곱하기 ${b}는?`, eqH(`${a} × ${b} = ${QB}`), ab, `${a}씩 ${b}번 뛰어 세어 봐요`, `${a}단: ${p22DanSeq(a, b)} → ${a} × ${b} = ${ab}`);
  if (v === 1) { const g = rnd(2, 5), [e] = pick(P22_DAN[a]);
    return nq(`p22:mg${a}x${g}`, 'mulgrp', `${a}씩 ${g}묶음은 모두 몇 개일까요?`, null, groupsHTML(e, g, a) + eqH(`${a} × ${g} = ${QB}`), a * g, `한 묶음에 ${a}개씩, ${g}묶음이에요`, `${a} × ${g} = ${a * g}`); }
  if (v === 2) { const left = Math.random() < .5;
    return left ? nq(`p22:mmr${a}x${b}`, 'mulmiss', '□에 알맞은 수는?', `${a} 곱하기 네모는 ${ab}`, eqH(`${a} × ${QB} = ${ab}`), b, `${a}단을 차례로 외우며 ${numJosa(ab, '이', '가')} 나올 때까지 세어 봐요`, `${a} × ${b} = ${ab}`)
      : nq(`p22:mml${a}x${b}`, 'mulmiss', '□에 알맞은 수는?', `네모 곱하기 ${numJosa(b, '은', '는')} ${ab}`, eqH(`${QB} × ${b} = ${ab}`), a, `몇 단에서 ${numJosa(ab, '이', '가')} 나오는지 생각해 봐요`, `${a} × ${b} = ${ab}`); }
  if (v === 3) { const [e, n, c, p, u] = pick(P22_DAN[a]); b = rnd(2, 9);
    return nq(`p22:ms${n}${b}`, 'mulstory', `${n} 한 ${c}에 ${josa(p, '이', '가')} ${a}${u} 있어요. ${n} ${b}${c}에는 ${josa(p, '이', '가')} 모두 몇 ${u} 있을까요?`, null, `<div class="pic" style="font-size:40px">${e.repeat(Math.min(b, 6))}${b > 6 ? ' …' : ''}</div>`, a * b, `${a}씩 ${b}번이에요. ${a} × ${b}`, `${a} × ${b} = ${a * b}${u}`); }
  if (v === 4) { const right = `${a} × ${b} = ${ab}`, w = shuffle([`${a} × ${b} = ${ab + a}`, b > 1 ? `${a} × ${b} = ${ab - a}` : `${a} × ${b} = ${ab + 1}`, `${a} × ${b + 1} = ${ab}`]).slice(0, 2);
    return cq(`p22:mp${a}x${b}`, 'mulpick', '바른 곱셈식을 골라요', '바른 곱셈식을 골라 봐요', null, [right, ...w], right, `${a}단을 차례로 외워 봐요: ${a}, ${a * 2}, ${a * 3} …`, right, { cols:1 }); }
  if (b < 2) b = rnd(2, 9);
  return nq(`p22:mo${a}x${b}`, 'mulmore', `${a} × ${numJosa(b, '은', '는')} ${a} × ${b - 1}보다 얼마 더 클까요?`, `${a} 곱하기 ${numJosa(b, '은', '는')} ${a} 곱하기 ${b - 1}보다 얼마 더 클까?`, eqH(`${a} × ${b} = ${a} × ${b - 1} + ${QB}`, true), a, `곱하는 수가 1 커지면 곱은 ${a}만큼 커져요`, `${a} × ${b} = ${a * b}, ${a} × ${b - 1} = ${a * (b - 1)} → ${a} 더 커요`);
}
const p22DanCard = (a, e) => ({ ill:() => groupsHTML(e, 3, a) + eqH(`${a} × 1 = ${a}<br>${a} × 2 = ${a * 2}<br>${a} × 3 = ${a * 3}`, true),
  text:`${a}단 곱셈구구는 ${a}씩 커져요. ${a} × 1 = ${a}, ${a} × 2 = ${a * 2}, ${a} × 3 = ${a * 3} … ${a} × 9 = ${a * 9}. 곱하는 수가 1 커지면 곱은 ${a}만큼 커져요.`,
  say:`${a}단은 ${a}씩 커져요. 곱하는 수가 1 커지면 곱은 ${a}만큼 커져요.` });

/* ---------- 표와 그래프 재료 ---------- */
const P22_TOPIC = [
  ['과일', [['🍎','사과'],['🍇','포도'],['🍓','딸기'],['🍉','수박']]],
  ['동물', [['🐶','강아지'],['🐱','고양이'],['🐰','토끼'],['🐹','햄스터']]],
  ['색깔', [['🔴','빨강'],['🟡','노랑'],['🔵','파랑'],['🟢','초록']]],
  ['계절', [['🌸','봄'],['🌊','여름'],['🍁','가을'],['⛄','겨울']]],
  ['간식', [['🍪','과자'],['🍧','빙수'],['🍩','도넛'],['🍰','케이크']]],
  ['운동', [['⚽','축구'],['🏀','농구'],['⚾','야구'],['🏊','수영']]],
];
function p22Data(uniq){
  const [topic, cats] = pick(P22_TOPIC); let cnt;
  do { cnt = cats.map(() => rnd(1, 7)); } while (uniq && (cnt.filter(x => x === Math.max(...cnt)).length > 1 || cnt.filter(x => x === Math.min(...cnt)).length > 1));
  return { topic, cats, names:cats.map(c => c[1]), cnt, sum:cnt.reduce((a, b) => a + b, 0), id:topic + cnt.join('') };
}
const p22Pic = D => `<div style="display:flex;flex-wrap:wrap;gap:4px 8px;justify-content:center;max-width:380px;margin:auto;font-size:30px">${shuffle(D.cats.flatMap((c, i) => Array(D.cnt[i]).fill(c[0]))).map(e => `<span>${e}</span>`).join('')}</div><div class="muted" style="text-align:center;font-size:15px">${D.cats.map(c => `${c[0]} ${c[1]}`).join(' · ')}</div>`;
function p22Tab(D, hole){
  const td = (v, st = '') => `<td style="font-size:17px;padding:6px 7px;min-width:0;${st}">${v}</td>`;
  return `<table class="pv" style="margin:auto"><tr>${td(D.topic, 'background:#FFF4D6')}${D.names.map(n => td(n, 'background:#FFF4D6')).join('')}${td('합계', 'background:#FFE3EC')}</tr>`
    + `<tr>${td('수(명)')}${D.cnt.map((c, i) => td(hole === i ? QB : c)).join('')}${td(hole === 'sum' ? QB : D.sum)}</tr></table>`;
}
function p22Graph(D){
  const R = Math.max(5, ...D.cnt), cw = 62, ch = 28, L = 34, T = 8, W = L + D.names.length * cw + 6, H = T + R * ch + 30;
  let s = '';
  for (let r = 0; r <= R; r++) s += `<line x1="${L}" y1="${T + r * ch}" x2="${L + D.names.length * cw}" y2="${T + r * ch}" stroke="#D9C7CF" stroke-width="1.5"/>`;
  for (let c = 0; c <= D.names.length; c++) s += `<line x1="${L + c * cw}" y1="${T}" x2="${L + c * cw}" y2="${T + R * ch}" stroke="#D9C7CF" stroke-width="1.5"/>`;
  for (let r = 1; r <= R; r++) s += p22Txt(L - 8, T + (R - r) * ch + ch / 2, r, { fs:13, a:'end' });
  D.names.forEach((nm, c) => { for (let k = 0; k < D.cnt[c]; k++) s += `<circle cx="${L + c * cw + cw / 2}" cy="${T + (R - 1 - k) * ch + ch / 2}" r="${ch / 2 - 4}" fill="none" stroke="${C.pinkD}" stroke-width="3"/>`;
    s += p22Txt(L + c * cw + cw / 2, T + R * ch + 16, nm, { fs:14 }); });
  s += p22Txt(4, T + R * ch + 16, '(명)', { fs:10, a:'start' });
  return `<svg class="draw" viewBox="0 0 ${W} ${H}" width="${Math.min(W * 1.15, 400)}" style="max-width:100%;height:auto" role="img" aria-label="${D.topic} 그래프">${s}</svg>`;
}

/* ---------- 규칙 찾기 재료 ---------- */
const P22_PAT = [['🔴','🟡','🔵'],['⭐','🌙','☀️'],['🍓','🍋','🍇'],['🐶','🐱','🐰'],['🌸','🍀','🍄'],['🟥','🟩','🟦']];
function p22PatSeq(){ const pool = pick(P22_PAT), kind = pick(['AB','ABC','AAB','ABB','AABB','ABAC']); const unit = kind.split('').map(ch => pool['ABC'.indexOf(ch)]);
  const extra = pool.find(x => !unit.includes(x)) || pick(P22_PAT.filter(p => p !== pool))[0];
  return { unit, at:i => unit[i % unit.length], uniq:[...new Set(unit)], extra }; }
const p22EmoOpts = list => Object.fromEntries(list.map(o => [o, `<span style="font-size:44px">${o}</span>`]));
const P22_STACK = { line:(s, i) => Array(s + i).fill(1), wall:(s, i) => Array(s + i).fill(2), stair:(s, i) => Array.from({ length:s + i }, (_, j) => j + 1), tower:(s, i, k) => [s + i * k] };
function p22Stages(f, s, k){
  const st = [0, 1, 2].map(i => f(s, i, k)), W = Math.max(...st.map(h => h.length * 26 + 23)), H = Math.max(...st.map(h => Math.max(...h) * 26 + 19)), sc = Math.min(2.2, 150 / H, 110 / W);
  return `<div class="row" style="justify-content:center;gap:10px;align-items:flex-end">${st.map((h, i) => `<div style="text-align:center;width:30%;max-width:130px">${cubesSVG(h).replace(/ width="[\d.]+"/, ` width="${Math.round((h.length * 26 + 23) * sc)}"`)}<div class="muted">${['첫째', '둘째', '셋째'][i]}</div></div>`).join('')}</div>`;
}
const p22Sum = a => a.reduce((x, y) => x + y, 0);

Object.assign(LESSON_GEN, {
  /* ---------- 1단원 네 자리 수 ---------- */
  'p1-1'(){ const v = rnd(0, 3);
    if (v === 0) { const a = pick([rnd(1, 9) * 100, rnd(90, 99) * 10, rnd(990, 999)]);
      return nq(`p22:to1k${a}`, 'thousand', `1000은 ${a}보다 얼마 큰 수일까요?`, `천은 ${a}보다 얼마 큰 수일까?`, eqH(`${a} + ${QB} = 1000`), 1000 - a, a % 100 === 0 ? '100씩 뛰어 세어 1000까지 가 봐요' : a % 10 === 0 ? '10씩 뛰어 세어 1000까지 가 봐요' : '하나씩 세어 1000까지 가 봐요', `${a} + ${1000 - a} = 1000`); }
    if (v === 1) { const f = pick([['100이 몇 개이면 1000일까요?', 10, '100, 200, 300… 하고 1000까지 세어 봐요'], ['999보다 1 큰 수는?', 1000, '999 바로 다음 수예요'], ['900보다 100 큰 수는?', 1000, '100씩 뛰어 세어 봐요'], ['990보다 10 큰 수는?', 1000, '10씩 뛰어 세어 봐요'], ['1000보다 1 작은 수는?', 999, '1000 바로 앞의 수예요'], ['1000보다 100 작은 수는?', 900, '100씩 거꾸로 세어 봐요'], ['1000보다 10 작은 수는?', 990, '10씩 거꾸로 세어 봐요'], ['800보다 200 큰 수는?', 1000, '100씩 두 번 뛰어 세어 봐요']]);
      return nq(`p22:kf${f[0]}`, 'thousand', f[0], null, null, f[1], f[2], `${f[0]} → ${f[1]}`); }
    if (v === 2) { const R = ['100이 10개인 수', '999보다 1 큰 수', '900보다 100 큰 수', '990보다 10 큰 수'], Wr = ['100이 9개인 수', '10이 10개인 수', '99보다 1 큰 수', '900보다 10 큰 수', '800보다 100 큰 수', '999보다 10 큰 수'];
      const r = pick(R), w = shuffle(Wr).slice(0, 2);
      return cq(`p22:kc${r}|${[...w].sort()}`, 'thousand-c', '1000을 나타내는 것을 골라요', '천을 나타내는 것을 골라 봐요', eqH('1000'), [r, ...w], r, '하나씩 계산해서 1000이 되는지 봐요', `${r}는 1000이에요`, { cols:1 }); }
    const k = rnd(1, 9);
    return nq(`p22:km${k}`, 'money', `100원짜리 동전이 ${k}개 있어요. 1000원이 되려면 100원짜리 동전이 몇 개 더 있어야 할까요?`, null, p22Chips([0, k, 0, 0], true), 10 - k, '100원짜리 동전 10개가 1000원이에요', `${k}개 + ${10 - k}개 = 10개 → 1000원`); },
  'p1-2'(){ const k = rnd(2, 9), v = rnd(0, 5), n = k * 1000, w = numKo(n);
    if (v === 0) return nq(`p22:kt${k}`, 'thousands', '모두 얼마일까요?', '천 모형이 모두 얼마일까?', p22Chips([k, 0, 0, 0]), n, '천 모형 하나가 1000이에요. 1000, 2000, 3000…', `1000이 ${k}개이면 ${n}`);
    if (v === 1) return cq(`p22:kr${k}`, 'read4', `${numJosa(n, '을', '를')} 바르게 읽은 것은?`, '수를 바르게 읽은 것을 골라 봐요', eqH(`${n}`), [w, numKo(k * 100), numKo(k * 10)], w, '0이 세 개 붙으면 "천"이에요', `${numJosa(n, '은', '는')} ${w}`);
    if (v === 2) return nq(`p22:kw${k}`, 'word4', `'${w}'${hasBatchim(w) ? '을' : '를'} 수로 쓰면?`, `${josa(w, '을', '를')} 수로 써 봐요`, `<div class="sent text-q"><span class="big-word">${w}</span></div>`, n, '천의 자리 뒤에 0을 세 개 써요', `${w} = ${n}`);
    if (v === 3) return Math.random() < .5 ? nq(`p22:kn${k}`, 'thousands', `1000이 ${k}개인 수는?`, null, null, n, '1000, 2000, 3000… 하고 세어 봐요', `1000이 ${k}개이면 ${n}`)
      : nq(`p22:kq${k}`, 'thousands', `${numJosa(n, '은', '는')} 1000이 몇 개일까요?`, null, null, k, '천의 자리 숫자를 봐요', `${numJosa(n, '은', '는')} 1000이 ${k}개`);
    if (v === 4) return nq(`p22:kb${k}`, 'money', `1000원짜리 지폐 ${k}장은 모두 얼마일까요?`, null, p22Chips([k, 0, 0, 0], true), n, '1000원, 2000원, 3000원… 하고 세어 봐요', `${n}원`);
    const j = rnd(1, 8); return nq(`p22:kp${j}`, 'thousands', `${j * 1000}보다 1000 큰 수는?`, null, null, j * 1000 + 1000, '천의 자리 숫자가 1 커져요', `${j * 1000} + 1000 = ${j * 1000 + 1000}`); },
  'p1-3'(){ const v = rnd(0, 3), th = rnd(1, 9), h = rnd(0, 9), t = rnd(0, 9), o = rnd(0, 9), n = th * 1000 + h * 100 + t * 10 + o, w = numKo(n);
    if (v === 0) return nq(`p22:w4${n}`, 'write4', '수 모형이 나타내는 수를 써요', '수 모형이 나타내는 수는 얼마일까?', p22Chips([th, h, t, o]), n, `천 모형 ${th}개, 백 모형 ${h}개, 십 모형 ${t}개, 일 모형 ${o}개예요${[h, t, o].includes(0) ? '. 없는 자리에는 0을 써요' : ''}`, `${n} (${w})`);
    if (v === 1) { const ds = [th, h, t, o], cands = [];
      for (let i = 0; i < 3; i++) if (ds[i] !== ds[i + 1]) { const s = [...ds]; [s[i], s[i + 1]] = [s[i + 1], s[i]]; if (s[0]) cands.push(+s.join('')); }
      cands.push(n + 1000 <= 9999 ? n + 1000 : n - 1000, n + 10 <= 9999 ? n + 10 : n - 10);
      const fake = [...new Set(shuffle(cands).map(numKo))].filter(x => x !== w).slice(0, 2);
      return cq(`p22:r4${n}`, 'read4', `${numJosa(n, '을', '를')} 바르게 읽은 것은?`, '수를 바르게 읽은 것을 골라 봐요', eqH(`${n}`), [w, ...fake], w, '천, 백, 십, 일의 자리 차례로 읽고, 0인 자리는 읽지 않아요', `${numJosa(n, '은', '는')} ${w}`, { cols:1 }); }
    if (v === 2) return nq(`p22:o4${n}`, 'word4', `'${w}'${hasBatchim(w) ? '을' : '를'} 수로 쓰면?`, `${josa(w, '을', '를')} 수로 써 봐요`, `<div class="sent text-q"><span class="big-word">${w}</span></div>`, n, '읽지 않은 자리에는 0을 써요', `${w} = ${n}`);
    const a = rnd(1, 6), b = rnd(0, 9), c = rnd(1, 9), m = a * 1000 + b * 100 + c * 10;
    return nq(`p22:m4${a}${b}${c}`, 'money4', '돈은 모두 얼마일까요?', '돈을 모두 세어 봐요', p22Chips([a, b, c, 0], true), m, `1000원 ${a}장, 100원 ${b}개, 10원 ${c}개예요`, `${a * 1000} + ${b * 100} + ${c * 10} = ${m}원`); },
  'p1-4'(){ const v = rnd(0, 3); let n; do { n = rnd(1234, 9876); } while (new Set(String(n)).size < 4 || String(n).includes('0'));
    const d = String(n).split('').map(Number), i = rnd(0, 3), vals = [d[0] * 1000, d[1] * 100, d[2] * 10, d[3]];
    const hi = String(n).split('').map((c, j) => j === i ? `<span style="color:#EE5F8D">${c}</span>` : c).join('');
    if (v === 0) return cq(`p22:pv${n}-${i}`, 'placevalue4', `${n}에서 빨간 숫자 ${numJosa(d[i], '은', '는')} 얼마를 나타낼까요?`, null, eqH(hi), [d[i] * 1000, d[i] * 100, d[i] * 10, d[i]], vals[i], `${numJosa(d[i], '이', '가')} ${P22_PLACE[i]}의 자리에 있어요`, `${P22_PLACE[i]}의 자리 숫자 ${numJosa(d[i], '은', '는')} ${vals[i]}`, { cols:2, big:true });
    if (v === 1) return nq(`p22:pd${n}-${i}`, 'placedigit', `${n}의 ${P22_PLACE[i]}의 자리 숫자는?`, null, eqH(`${n}`), d[i], '왼쪽부터 천, 백, 십, 일의 자리예요', `${n}의 ${P22_PLACE[i]}의 자리 숫자는 ${d[i]}`);
    if (v === 2) return nq(`p22:px${n}-${i}`, 'expand4', '빈칸에 알맞은 수는?', null, eqH(`${n} = ${vals.map((x, j) => j === i ? QB : x).join(' + ')}`, true), vals[i], '각 자리 숫자가 나타내는 값으로 나누어 써요', `${n} = ${vals.join(' + ')}`);
    return nq(`p22:pc${n}`, 'expand4', `1000이 ${d[0]}개, 100이 ${d[1]}개, 10이 ${d[2]}개, 1이 ${d[3]}개인 수는?`, null, null, n, '천, 백, 십, 일의 자리에 차례로 써요', `${n}`); },
  'p1-5'(){ const v = rnd(0, 2), step = pick([1000, 100, 10, 1]), down = Math.random() < .3;
    const start = rnd(1000 + (down ? step * 4 : 0), 9999 - (down ? 0 : step * 4)), seq = [0, 1, 2, 3, 4].map(i => start + (down ? -step : step) * i), pl = P22_PLACE[[1000, 100, 10, 1].indexOf(step)];
    if (v === 0) { const hole = rnd(1, 4); return nq(`p22:sk${start}${down ? '-' : '+'}${step}h${hole}`, 'skip4', '규칙에 맞게 빈칸에 알맞은 수는?', `${step}씩 ${down ? '거꾸로 ' : ''}뛰어 세었어요. 빈칸에 알맞은 수는?`, eqH(seq.map((x, i) => i === hole ? QB : x).join(', '), true), seq[hole], `${step}씩 ${down ? '작아져요' : '커져요'}. ${pl}의 자리 숫자를 봐요`, seq.join(', ')); }
    if (v === 1) return nq(`p22:sw${start}${down ? '-' : '+'}${step}`, 'skipstep', `몇씩 ${down ? '거꾸로 ' : ''}뛰어 세었을까요?`, null, eqH(seq.join(', '), true), step, '어느 자리 숫자가 바뀌는지 봐요', `${step}씩 ${down ? '작아져요' : '커져요'}`);
    const k = rnd(2, 4), ans = start + (down ? -step : step) * k;
    return nq(`p22:sn${start}${down ? '-' : '+'}${step}k${k}`, 'skipstep', `${start}에서 ${step}씩 ${k}번 ${down ? '거꾸로 ' : ''}뛰어 센 수는?`, null, null, ans, `${pl}의 자리 숫자가 ${k}번 바뀌어요`, seq.slice(0, k + 1).join(', ')); },
  'p1-6'(){ const v = rnd(0, 2);
    if (v === 0) { const a = rnd(1000, 9999); let b; do { const s = String(a).split(''), k = rnd(0, 3); s[k] = String(rnd(k ? 0 : 1, 9)); b = +s.join(''); } while (b === a);
      const [x, y] = Math.random() < .5 ? [a, b] : [b, a];
      return cq(`p22:cp${x}-${y}`, 'cmp4', '○ 안에 알맞은 것을 골라요', `${numJosa(x, '과', '와')} ${y}의 크기를 비교해요`, eqH(`${x} <span class="qbox-inline">○</span> ${y}`, true), ['>', '<'], x > y ? '>' : '<', '천의 자리부터 차례로 비교해요. 입을 벌린 쪽이 큰 수예요', `${x} ${x > y ? '>' : '<'} ${y}`, { cols:2, big:true }); }
    if (v === 1) { const base = rnd(1, 9) * 1000, same = Math.random() < .6, s = new Set(); while (s.size < 3) s.add(same ? base + rnd(0, 999) : rnd(1000, 9999));
      const arr = [...s], small = Math.random() < .5, ans = small ? Math.min(...arr) : Math.max(...arr);
      return cq(`p22:cm${[...arr].sort()}${small}`, 'cmp4b', `가장 ${small ? '작은' : '큰'} 수를 골라요`, null, null, arr, ans, '천의 자리부터 차례로 비교해요', `가장 ${small ? '작은' : '큰'} 수는 ${ans}`, { big:true }); }
    const zero = Math.random() < .35, ds = zero ? [0, ...shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3)] : shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4), big = Math.random() < .55;
    const srt = [...ds].sort((a, b) => a - b); let res = big ? [...srt].reverse() : [...srt]; if (!big && res[0] === 0) [res[0], res[1]] = [res[1], res[0]];
    const ans = +res.join('');
    return nq(`p22:cd${srt.join('')}${big}`, 'cards4', `수 카드 4장을 한 번씩 모두 써서 가장 ${big ? '큰' : '작은'} 네 자리 수를 만들어요`, null, `<div class="row" style="justify-content:center;gap:10px">${shuffle(ds).map(d => `<span class="num-card">${d}</span>`).join('')}</div>`, ans, big ? '큰 숫자부터 천의 자리에 차례로 놓아요' : '작은 숫자부터 놓되, 0은 천의 자리에 올 수 없어요', `${ans}`); },

  /* ---------- 2단원 곱셈구구 ---------- */
  'p2-1'(){ return p22Dan([2, 5]); },
  'p2-2'(){ return p22Dan([3, 6]); },
  'p2-3'(){ return p22Dan([4, 8]); },
  'p2-4'(){ return p22Dan([7, 9]); },
  'p2-5'(){ const v = rnd(0, 5);
    if (v === 0) { const n = rnd(1, 9), first = Math.random() < .5, L = first ? `1 × ${n}` : `${n} × 1`;
      return nq(`p22:o1${L}`, 'mul1', '곱셈을 해요', first ? `1 곱하기 ${n}는?` : `${n} 곱하기 1은?`, eqH(`${L} = ${QB}`), n, first ? '1을 몇 번 더했는지 생각해 봐요' : '어떤 수에 1을 곱하면 그 수 그대로예요', `${L} = ${n}`); }
    if (v === 1) { const n = rnd(1, 9), first = Math.random() < .5, L = first ? `0 × ${n}` : `${n} × 0`;
      return nq(`p22:o0${L}`, 'mul0', '곱셈을 해요', first ? `0 곱하기 ${n}는?` : `${n} 곱하기 0은?`, eqH(`${L} = ${QB}`), 0, first ? '0을 몇 번 더해도 0이에요' : '어떤 수에 0을 곱하면 항상 0이에요', `${L} = 0`); }
    if (v === 2) { const n = rnd(2, 9), first = Math.random() < .5;
      return first ? nq(`p22:o1r${n}`, 'mul01m', '□에 알맞은 수는?', `1 곱하기 네모는 ${n}`, eqH(`1 × ${QB} = ${n}`), n, '1에 어떤 수를 곱하면 그 수가 돼요', `1 × ${n} = ${n}`)
        : nq(`p22:o1l${n}`, 'mul01m', '□에 알맞은 수는?', `네모 곱하기 1은 ${n}`, eqH(`${QB} × 1 = ${n}`), n, '어떤 수에 1을 곱하면 그 수 그대로예요', `${n} × 1 = ${n}`); }
    if (v === 3) { const t = rnd(4, 6), y = rnd(0, t), x = t - y;
      return nq(`p22:ring${x}-${y}`, 'ring', `고리를 ${t}번 던졌어요. 0점 칸에 ${x}개, 1점 칸에 ${y}개 들어갔어요. 점수는 모두 몇 점일까요?`, null, `<div class="pic" style="font-size:36px">${'⭕'.repeat(t)}</div>`, y, '0점 칸은 몇 개가 들어가도 0점이에요', `0 × ${x} = 0, 1 × ${y} = ${y} → 0 + ${y} = ${y}점`); }
    if (v === 4) { const b = rnd(2, 9), empty = Math.random() < .5;
      return empty ? nq(`p22:oe${b}`, 'story01', `빈 바구니가 ${b}개 있어요. 바구니에 들어 있는 사과는 모두 몇 개일까요?`, null, `<div class="pic" style="font-size:36px">${'🧺'.repeat(Math.min(b, 6))}</div>`, 0, '바구니 하나에 사과가 0개씩이에요', `0 × ${b} = 0`)
        : nq(`p22:of${b}`, 'story01', `꽃병 ${b}개에 꽃이 1송이씩 꽂혀 있어요. 꽃은 모두 몇 송이일까요?`, null, `<div class="pic" style="font-size:36px">${'🌷'.repeat(Math.min(b, 6))}${b > 6 ? ' …' : ''}</div>`, b, '1씩 몇 번인지 세어 봐요', `1 × ${b} = ${b}`); }
    const st = pickOX([['1 × 6 = 6이에요.','O'],['0 × 8 = 8이에요.','X'],['어떤 수에 0을 곱하면 항상 0이에요.','O'],['어떤 수에 1을 곱하면 항상 1이에요.','X'],['5 × 0 = 0이에요.','O'],['1 × 1 = 2예요.','X'],['0 × 0 = 0이에요.','O'],['7 × 1 = 1이에요.','X'],['1 × 9와 9 × 1은 곱이 같아요.','O'],['0 × 3은 3이에요.','X']]);
    return ox(`p22:oox${st[0]}`, st[0], st[1], '1을 곱하면 그대로, 0을 곱하면 0이에요', `${st[0]} → ${st[1]}`); },
  'p2-6'(){ const v = rnd(0, 4);
    if (v === 0) { const r0 = rnd(1, 7), c0 = rnd(1, 7), hole = [rnd(0, 2), rnd(0, 2)], ans = (r0 + hole[0]) * (c0 + hole[1]);
      return nq(`p22:gt${r0}-${c0}-${hole}`, 'gtable', '곱셈표에서 ?에 알맞은 수는?', '곱셈표의 일부예요. 물음표에 알맞은 수는?', p22OpTable(r0, c0, 3, 3, hole), ans, `세로줄 수 ${numJosa(r0 + hole[0], '과', '와')} 가로줄 수 ${numJosa(c0 + hole[1], '을', '를')} 곱해요`, `${r0 + hole[0]} × ${c0 + hole[1]} = ${ans}`); }
    if (v === 1) { const p = +pick(Object.keys(P22_PROD).filter(k => P22_PROD[k].length >= 2)), L = P22_PROD[p];
      return nq(`p22:gc${p}`, 'gcount', `1단부터 9단까지의 곱셈표에서 곱이 ${p}인 칸은 모두 몇 개일까요?`, null, eqH(`□ × □ = ${p}`, true), L.length, `${numJosa(p, '이', '가')} 나오는 곱셈구구를 1단부터 차례로 찾아봐요`, `${L.join(', ')} → ${L.length}개`); }
    if (v === 2) { let a, b; do { a = rnd(2, 9); b = rnd(2, 9); } while (a === b); const right = `${b} × ${a}`, w = new Set();
      while (w.size < 2) { const x = rnd(2, 9), y = rnd(2, 9); if (x * y !== a * b) w.add(`${x} × ${y}`); }
      return cq(`p22:gs${a}x${b}`, 'gswap', `${a} × ${numJosa(b, '과', '와')} 곱이 같은 것을 골라요`, `${a} 곱하기 ${numJosa(b, '과', '와')} 곱이 같은 것은?`, null, [right, ...w], right, '곱하는 두 수의 순서를 바꾸어도 곱은 같아요', `${a} × ${b} = ${right} = ${a * b}`, { big:true }); }
    if (v === 3) { const a = rnd(3, 9), b = rnd(2, 6), c = rnd(1, a - 1), [e, name] = pick(FOODS), tpl = rnd(0, 1);
      const st = tpl ? `${josa(name, '을', '를')} 한 접시에 ${a}개씩 ${b}접시 담고, ${c}개가 남았어요. ${josa(name, '은', '는')} 모두 몇 개일까요?` : `한 상자에 ${name} ${a}개씩 ${b}상자가 있고, 낱개로 ${c}개가 더 있어요. ${josa(name, '은', '는')} 모두 몇 개일까요?`;
      return nq(`p22:gy${tpl}${a}x${b}+${c}`, 'gstory', st, null, `<div class="sent text-q" style="font-size:22px">${esc(st)}</div>`, a * b + c, `먼저 ${a} × ${numJosa(b, '을', '를')} 구하고, ${numJosa(c, '을', '를')} 더해요`, `${a} × ${b} = ${a * b}, ${a * b} + ${c} = ${a * b + c}`); }
    const prs = new Map(); while (prs.size < 3) { const x = rnd(2, 9), y = rnd(2, 9), p = x * y; if (![...prs.values()].includes(p)) prs.set(`${x} × ${y}`, p); }
    const opts = [...prs.keys()], ans = opts.reduce((m, o) => prs.get(o) > prs.get(m) ? o : m);
    return cq(`p22:gb${[...opts].sort()}`, 'gbig', '곱이 가장 큰 것을 골라요', null, null, opts, ans, '하나씩 곱을 구해 봐요', opts.map(o => `${o} = ${prs.get(o)}`).join(', '), { cols:1, big:true }); },

  /* ---------- 3단원 길이 재기 ---------- */
  'p3-1'(){ const v = rnd(0, 4), m = rnd(1, 9);
    if (v === 0) return nq(`p22:mc${m}`, 'm2cm', `${m} m는 몇 cm일까요?`, `${m}미터는 몇 센티미터일까?`, eqH(`${m} m = ${QB} cm`), m * 100, '1 m는 100 cm예요', `${m} m = ${m * 100} cm`);
    if (v === 1) return nq(`p22:cmm${m}`, 'cm2m', `${m * 100} cm는 몇 m일까요?`, `${m * 100}센티미터는 몇 미터일까?`, eqH(`${m * 100} cm = ${QB} m`), m, '100 cm가 1 m예요', `${m * 100} cm = ${m} m`);
    const mm = rnd(1, 4), c = rnd(1, 99), n = mm * 100 + c;
    if (v === 2) return nq(`p22:mx${mm}-${c}`, 'mcm', `${mm} m ${c} cm는 몇 cm일까요?`, `${mm}미터 ${c}센티미터는 몇 센티미터일까?`, eqH(`${mm} m ${c} cm = ${QB} cm`, true), n, `${mm} m는 ${mm * 100} cm예요. 거기에 ${c} cm를 더해요`, `${mm * 100} cm + ${c} cm = ${n} cm`);
    if (v === 3) { const which = rnd(0, 1);
      return nq(`p22:cx${n}-${which}`, 'mcm', '□에 알맞은 수는?', `${n}센티미터는 몇 미터 몇 센티미터일까?`, eqH(which ? `${n} cm = ${mm} m ${QB} cm` : `${n} cm = ${QB} m ${c} cm`, true), which ? c : mm, `100 cm는 1 m예요. ${n} cm에 100 cm가 몇 번 들어 있는지 봐요`, `${n} cm = ${mm} m ${c} cm`); }
    const st = pickOX([['1 m는 100 cm예요.','O'],['1 m는 10 cm예요.','X'],['2 m는 200 cm예요.','O'],['150 cm는 1 m 50 cm예요.','O'],['105 cm는 1 m 50 cm예요.','X'],['1 m 5 cm는 105 cm예요.','O'],['300 cm는 30 m예요.','X'],['m는 미터라고 읽어요.','O'],['cm는 미터라고 읽어요.','X'],['4 m 20 cm는 420 cm예요.','O'],['2 m 7 cm는 270 cm예요.','X']]);
    return ox(`p22:mox${st[0]}`, st[0], st[1], '1 m = 100 cm예요', `${st[0]} → ${st[1]}`); },
  'p3-2'(){ const v = rnd(0, 2);
    if (v === 0) { let n; do { n = rnd(101, 249); } while (n % 100 === 0); const obj = pick(['끈', '리본', '막대', '줄', '털실']), mcm = Math.random() < .5, mm = Math.floor(n / 100), c = n % 100;
      return nq(`p22:tp${n}${mcm}`, 'tape', `${obj}의 한쪽 끝을 줄자의 0에 맞추고 재었어요. ${mcm ? '몇 m 몇 cm일까요? □에 알맞은 수는?' : '길이는 몇 cm일까요?'}`, `${obj}의 길이를 줄자로 재었어요. ${mcm ? '몇 미터 몇 센티미터일까?' : '몇 센티미터일까?'}`, p22Tape(n, obj) + (mcm ? eqH(`${mm} m ${QB} cm`, true) : ''), mcm ? c : n, '끝이 닿은 곳의 눈금을 읽어요. 큰 눈금 사이에 작은 눈금이 1 cm씩이에요', `${n} cm = ${mm} m ${c} cm`); }
    if (v === 1) { const [thing, val, u] = pick([['연필', 15, 'cm'], ['지우개', 4, 'cm'], ['공책 긴 쪽', 25, 'cm'], ['내 손 한 뼘', 13, 'cm'], ['교실 문의 높이', 2, 'm'], ['버스의 길이', 10, 'm'], ['칠판의 긴 쪽', 4, 'm'], ['운동장 한쪽', 80, 'm'], ['수영장의 긴 쪽', 25, 'm'], ['색연필', 17, 'cm'], ['침대의 긴 쪽', 2, 'm'], ['기차 한 칸', 20, 'm'], ['숟가락', 20, 'cm'], ['줄넘기 줄', 2, 'm'], ['필통', 20, 'cm'], ['복도의 길이', 50, 'm'], ['책상의 높이', 70, 'cm'], ['아파트의 높이', 40, 'm']]);
      return cq(`p22:up${thing}`, 'unitpick', `${thing}의 길이는 약 ${val} □예요. □에 알맞은 단위는?`, `${thing}의 길이는 약 ${val} 무엇일까?`, null, ['cm', 'm'], u, '1 m는 어른 양팔을 벌린 길이쯤, 1 cm는 손톱 너비쯤이에요', `${thing}: 약 ${val} ${u}`, { cols:2, big:true }); }
    const a = [rnd(1, 3), rnd(0, 99)], av = a[0] * 100 + a[1]; let b; do { b = av + pick([-1, 1]) * rnd(1, 60); } while (b < 100 || b > 399 || b === av);
    const la = `${a[0]} m ${a[1]} cm`, lb = `${b} cm`;
    return cq(`p22:cl${av}-${b}`, 'cmplen', '더 긴 길이를 골라요', null, null, [la, lb], av > b ? la : lb, `${la}를 cm로 바꾸어 비교해요`, `${la} = ${av} cm, ${av > b ? `${av} > ${b}` : `${av} < ${b}`}`, { cols:2 }); },
  'p3-3'(){ const v = rnd(0, 3), a = [rnd(1, 5), rnd(10, 60)], b = [rnd(1, 4), 0]; b[1] = rnd(10, 89 - a[1]); const r = [a[0] + b[0], a[1] + b[1]];
    const la = `${a[0]} m ${a[1]} cm`, lb = `${b[0]} m ${b[1]} cm`, lr = `${r[0]} m ${r[1]} cm`;
    if (v === 0) { const hole = rnd(0, 1); return nq(`p22:la${a}+${b}h${hole}`, 'lenadd', '길이의 합을 구해요. ?에 알맞은 수는?', `${la} 더하기 ${lb}를 계산해요`, p22LenTab(a, b, '+', hole), r[hole], 'm는 m끼리, cm는 cm끼리 더해요', `${la} + ${lb} = ${lr}`); }
    if (v === 1) { const tpl = rnd(0, 2), st = [`빨간 리본 ${la}와 파란 리본 ${lb}를 겹치지 않게 이었어요. 이은 리본의 길이는 몇 cm일까요?`, `막대 두 개의 길이가 ${la}, ${lb}예요. 두 막대를 겹치지 않게 이어 붙이면 몇 cm일까요?`, `오늘 줄넘기 줄을 ${la} 썼고, 동생은 ${lb} 썼어요. 두 줄의 길이를 더하면 몇 cm일까요?`][tpl];
      return nq(`p22:las${tpl}${a}+${b}`, 'lenaddst', st, null, `<div class="sent text-q" style="font-size:22px">${esc(st)}</div>`, r[0] * 100 + r[1], `먼저 m끼리, cm끼리 더해서 ${lr}를 구하고 cm로 바꾸어요`, `${la} + ${lb} = ${lr} = ${r[0] * 100 + r[1]} cm`); }
    if (v === 2) { const c = rnd(10, 99 - a[1]); return nq(`p22:lac${a}+${c}`, 'lenaddcm', '□에 알맞은 수는?', `${la} 더하기 ${c}센티미터는?`, eqH(`${la} + ${c} cm = ${a[0]} m ${QB} cm`, true), a[1] + c, 'cm끼리 더해요. m는 그대로예요', `${a[1]} + ${c} = ${a[1] + c} → ${a[0]} m ${a[1] + c} cm`); }
    const w1 = `${r[0] + 1} m ${r[1]} cm`, w2 = `${r[0]} m ${r[1] + (r[1] + 10 <= 99 ? 10 : -10)} cm`;
    return cq(`p22:lap${a}+${b}`, 'lenaddpick', '길이의 합을 골라요', '길이의 합을 골라 봐요', eqH(`${la} + ${lb}`, true), [lr, w1, w2], lr, 'm는 m끼리, cm는 cm끼리 더해요', `${la} + ${lb} = ${lr}`, { cols:1 }); },
  'p3-4'(){ const v = rnd(0, 3), a = [rnd(3, 9), rnd(30, 99)], b = [0, 0]; b[0] = rnd(1, a[0] - 1); b[1] = rnd(10, a[1] - 10); const r = [a[0] - b[0], a[1] - b[1]];
    const la = `${a[0]} m ${a[1]} cm`, lb = `${b[0]} m ${b[1]} cm`, lr = `${r[0]} m ${r[1]} cm`;
    if (v === 0) { const hole = rnd(0, 1); return nq(`p22:ls${a}-${b}h${hole}`, 'lensub', '길이의 차를 구해요. ?에 알맞은 수는?', `${la} 빼기 ${lb}를 계산해요`, p22LenTab(a, b, '−', hole), r[hole], 'm는 m끼리, cm는 cm끼리 빼요', `${la} − ${lb} = ${lr}`); }
    if (v === 1) { if (Math.random() < .5) { const da = rnd(70, 85), me = rnd(15, 30); const st = `아빠의 키는 1 m ${da} cm이고, 내 키는 1 m ${me} cm예요. 아빠는 나보다 몇 cm 더 클까요?`;
        return nq(`p22:lsh${da}-${me}`, 'lensubst', st, null, `<div class="sent text-q" style="font-size:22px">${esc(st)}</div>`, da - me, 'm는 같으니까 cm끼리 빼요', `${da} − ${me} = ${da - me} cm`); }
      const st = `끈 ${la} 중에서 ${lb}를 잘라 썼어요. 남은 끈은 몇 cm일까요?`;
      return nq(`p22:lss${a}-${b}`, 'lensubst', st, null, `<div class="sent text-q" style="font-size:22px">${esc(st)}</div>`, r[0] * 100 + r[1], `m끼리, cm끼리 빼서 ${lr}를 구하고 cm로 바꾸어요`, `${la} − ${lb} = ${lr} = ${r[0] * 100 + r[1]} cm`); }
    if (v === 2) { const c = rnd(10, a[1]); return nq(`p22:lsc${a}-${c}`, 'lensubcm', '□에 알맞은 수는?', `${la} 빼기 ${c}센티미터는?`, eqH(`${la} − ${c} cm = ${a[0]} m ${QB} cm`, true), a[1] - c, 'cm끼리 빼요. m는 그대로예요', `${a[1]} − ${c} = ${a[1] - c} → ${a[0]} m ${a[1] - c} cm`); }
    const w1 = `${r[0] + 1} m ${r[1]} cm`, w2 = `${r[0]} m ${r[1] + (r[1] + 10 <= 89 ? 10 : -10)} cm`;
    return cq(`p22:lsp${a}-${b}`, 'lensubpick', '길이의 차를 골라요', '길이의 차를 골라 봐요', eqH(`${la} − ${lb}`, true), [lr, w1, w2], lr, 'm는 m끼리, cm는 cm끼리 빼요', `${la} − ${lb} = ${lr}`, { cols:1 }); },
  'p3-5'(){ const v = rnd(0, 2);
    if (v === 0) { const kind = rnd(0, 2);
      if (kind === 0) { const s = rnd(10, 15), k = rnd(2, 6); return nq(`p22:bh${s}-${k}`, 'body', `내 한 뼘은 약 ${s} cm예요. 책상의 긴 쪽을 재었더니 ${k}뼘이었어요. 책상의 긴 쪽은 약 몇 cm일까요?`, null, `<div class="pic" style="font-size:44px">✋</div>`, s * k, `${s} cm씩 ${k}번이에요`, `${s} × ${k} = ${s * k} → 약 ${s * k} cm`); }
      if (kind === 1) { const s = pick([40, 50, 60]), k = rnd(2, 9); return nq(`p22:bs${s}-${k}`, 'body', `내 한 걸음은 약 ${s} cm예요. 교실 앞에서 뒤까지 ${k}걸음이었어요. 약 몇 cm일까요?`, null, `<div class="pic" style="font-size:44px">👣</div>`, s * k, `${s} cm씩 ${k}번 뛰어 세어 봐요`, `${s} × ${k} = ${s * k} → 약 ${s * k} cm`); }
      const k = rnd(2, 6), what = pick(['칠판의 긴 쪽', '교실 창문', '복도 게시판']);
      return nq(`p22:ba${what}${k}`, 'body', `양팔을 벌린 길이가 약 1 m예요. ${josa(what, '을', '를')} 재었더니 양팔로 ${k}번이었어요. 약 몇 m일까요?`, null, `<div class="pic" style="font-size:44px">🙆</div>`, k, '1 m씩 몇 번인지 세어요', `1 m씩 ${k}번 → 약 ${k} m`); }
    if (v === 1) { const L = rnd(2, 15) * 10, ns = shuffle(['지우', '민호', '서연', '하준', '유나', '도윤']).slice(0, 2); let d1, d2; do { d1 = rnd(1, 20); d2 = rnd(1, 20); } while (d1 === d2);
      const e1 = L + pick([-1, 1]) * d1, e2 = L + pick([-1, 1]) * d2, obj = pick(['줄넘기 줄', '털실', '리본', '나무 막대']);
      return cq(`p22:ce${L}|${ns[0]}${e1}|${ns[1]}${e2}`, 'closer', `${obj}의 실제 길이는 ${L} cm예요. ${josa(ns[0], '은', '는')} 약 ${e1} cm, ${josa(ns[1], '은', '는')} 약 ${e2} cm로 어림했어요. 실제 길이에 더 가깝게 어림한 사람은?`, null, null, ns, d1 < d2 ? ns[0] : ns[1], '실제 길이와의 차이가 더 작은 사람을 찾아요', `${ns[0]}: ${d1} cm 차이, ${ns[1]}: ${d2} cm 차이`, { cols:2 }); }
    const st = pickOX([['교실 문의 높이는 약 2 m예요.','O'],['연필의 길이는 약 2 m예요.','X'],['버스의 길이는 약 10 cm예요.','X'],['숟가락의 길이는 약 20 cm예요.','O'],['운동장 한쪽은 약 50 cm예요.','X'],['어림한 길이를 말할 때는 "약"을 붙여요.','O'],['지우개의 길이는 약 1 m예요.','X'],['침대의 긴 쪽은 약 2 m예요.','O'],['컵의 높이는 약 10 m예요.','X'],['양팔을 벌린 길이로 약 몇 m인지 어림할 수 있어요.','O']]);
    return ox(`p22:eox${st[0]}`, st[0], st[1], '1 m, 1 cm가 얼마쯤인지 떠올려 봐요', `${st[0]} → ${st[1]}`); },

  /* ---------- 4단원 시각과 시간 ---------- */
  'p4-1'(){ const v = rnd(0, 3), h = rnd(1, 12), m = rnd(1, 11) * 5, lab = p22T(h, m);
    if (v === 0) { const askH = Math.random() < .35;
      return nq(`p22:t5${h}:${m}${askH}`, 'clock5', `시계가 나타내는 시각은 몇 시 몇 분일까요? □에 알맞은 수를 써요`, '시계를 보고 시각을 읽어 봐요', p22Box(p22Clock(h, m)) + eqH(askH ? `${QB}시 ${m}분` : `${h}시 ${QB}분`, true), askH ? h : m, askH ? '짧은바늘이 지나온 숫자를 읽어요' : `긴바늘이 가리키는 숫자에 5를 곱해요. 1은 5분, 2는 10분…`, lab); }
    if (v === 1) { const c = new Set([lab]); for (const x of shuffle([p22T(h % 12 + 1, m), p22T(h, m === 55 ? 50 : m + 5), p22T(h, m === 5 ? 10 : m - 5)])) if (c.size < 3) c.add(x);
      return cq(`p22:tc${h}:${m}`, 'clock5c', '시계가 나타내는 시각은?', null, null, [...c], lab, '짧은바늘로 "몇 시", 긴바늘로 "몇 분"을 읽어요', lab, { vis:{ k:'clock', h, m } }); }
    if (v === 2) { const sw = [m / 5, (h * 5) % 60], c = new Map([[lab, [h, m]]]);
      [[sw[0] === 0 ? 12 : sw[0], sw[1]], [h, (m + 30) % 60 || 30], [h % 12 + 1, m], [h, m > 10 ? m - 10 : m + 10]].forEach(([x, y]) => { const L = p22T(x, y); if (c.size < 3 && !c.has(L)) c.set(L, [x, y]); });
      return cq(`p22:tk${h}:${m}`, 'clock5pic', `${lab}을 나타내는 시계를 골라요`, null, null, [...c.keys()], lab, `짧은바늘은 ${numJosa(h, '과', '와')} ${h % 12 + 1} 사이, 긴바늘은 ${numJosa(m / 5, '을', '를')} 가리켜요`, lab, { pic:true, grid3:true, cols:3, optHtml:clockOpts([...c].map(([L, [x, y]]) => [L, x, y])) }); }
    const k = rnd(1, 11);
    return Math.random() < .5 ? nq(`p22:tm${k}`, 'minhand', `긴바늘이 ${numJosa(k, '을', '를')} 가리키면 몇 분일까요?`, null, null, k * 5, '긴바늘이 숫자 한 칸을 가면 5분이에요', `${k} × 5 = ${k * 5}분`)
      : nq(`p22:tn${k}`, 'minhand', `${k * 5}분일 때 긴바늘은 어떤 숫자를 가리킬까요?`, null, null, k, '5분, 10분, 15분… 하고 5씩 세어 봐요', `${k * 5}분 → ${k}`); },
  'p4-2'(){ const v = rnd(0, 3), h = rnd(1, 12); let m; do { m = rnd(1, 59); } while (m % 5 === 0); const lab = p22T(h, m), big = Math.floor(m / 5) || 12;
    if (v === 0) return nq(`p22:t1${h}:${m}`, 'clock1', '시계가 나타내는 시각은 몇 시 몇 분일까요? 분을 써요', '시계를 보고 몇 분인지 읽어 봐요', p22Box(p22Clock(h, m, 190), 190) + eqH(`${h}시 ${QB}분`, true), m, `긴바늘이 ${big} 다음 작은 눈금 몇 칸을 더 갔는지 세어 봐요`, `${Math.floor(m / 5) * 5}분 + ${m % 5}분 = ${m}분 → ${lab}`);
    if (v === 1) { const k = rnd(1, 11), j = rnd(1, 4);
      return nq(`p22:tj${k}-${j}`, 'clock1k', `긴바늘이 ${k}에서 작은 눈금 ${j}칸 더 간 곳을 가리켜요. 몇 분일까요?`, null, null, k * 5 + j, `${numJosa(k, '은', '는')} ${k * 5}분이에요. 작은 눈금 한 칸은 1분`, `${k * 5} + ${j} = ${k * 5 + j}분`); }
    if (v === 2) { const c = new Map([[lab, [h, m]]]); [[h, 60 - m], [h, m + 10 < 60 ? m + 10 : m - 10], [h % 12 + 1, m]].forEach(([x, y]) => { const L = p22T(x, y); if (c.size < 3 && !c.has(L)) c.set(L, [x, y]); });
      return cq(`p22:tq${h}:${m}`, 'clock1pic', `${lab}을 나타내는 시계를 골라요`, null, null, [...c.keys()], lab, `긴바늘이 ${big} 근처에서 작은 눈금 ${m % 5}칸 더 간 곳을 찾아요`, lab, { pic:true, grid3:true, cols:3, optHtml:clockOpts([...c].map(([L, [x, y]]) => [L, x, y])) }); }
    const c = new Set([lab]); for (const x of shuffle([p22T(h, m + 5 < 60 ? m + 5 : m - 5), p22T(h, m - 1 > 0 ? m - 1 : m + 1), p22T(h % 12 + 1, m)])) if (c.size < 3) c.add(x);
    return cq(`p22:tr${h}:${m}`, 'clock1c', '시계가 나타내는 시각은?', null, null, [...c], lab, '작은 눈금 한 칸이 1분이에요', lab, { vis:{ k:'clock', h, m } }); },
  'p4-3'(){ const v = rnd(0, 3), h = rnd(1, 12), nh = h % 12 + 1;
    if (v === 0) { const m = rnd(7, 11) * 5;
      return nq(`p22:tb${h}:${m}`, 'before', `시계의 시각은 ${p22T(nh, 0)} 몇 분 전일까요?`, '몇 시 몇 분 전인지 말해 봐요', p22Box(p22Clock(h, m)) + eqH(`${nh}시 ${QB}분 전`, true), 60 - m, `긴바늘이 12까지 가려면 몇 분이 더 필요한지 세어 봐요`, `${p22T(h, m)} = ${nh}시 ${60 - m}분 전`); }
    if (v === 1) { const k = rnd(1, 25);
      return nq(`p22:tbb${nh}-${k}`, 'before2', '□에 알맞은 수는?', `${nh}시 ${k}분 전은 ${h}시 몇 분일까?`, eqH(`${nh}시 ${k}분 전 = ${h}시 ${QB}분`, true), 60 - k, `${nh}시에서 ${k}분 거꾸로 가요. 60 − ${k}`, `${nh}시 ${k}분 전 = ${h}시 ${60 - k}분`); }
    if (v === 2) { const m = rnd(7, 11) * 5, k = 60 - m, right = `${nh}시 ${k}분 전`;
      return cq(`p22:tbc${h}:${m}`, 'beforec', `${p22T(h, m)}과 같은 시각은?`, null, null, [right, `${h}시 ${k}분 전`, `${nh}시 ${m}분 전`], right, `${h}시 ${m}분에서 ${k}분이 지나면 ${nh}시예요`, `${p22T(h, m)} = ${right}`, { cols:1 }); }
    const k = pick([5, 10, 15, 20]), L = `${h}시 ${60 - k}분`, opts = [[L, h, 60 - k], [`${nh}시 ${k}분`, nh, k], [`${h}시 ${k}분`, h, k]];
    return cq(`p22:tbp${nh}-${k}`, 'beforepic', `${nh}시 ${k}분 전을 나타내는 시계를 골라요`, null, null, opts.map(o => o[0]), L, `${nh}시 ${k}분 전은 ${h}시 ${60 - k}분이에요`, `${nh}시 ${k}분 전 = ${L}`, { pic:true, grid3:true, cols:3, optHtml:clockOpts(opts) }); },
  'p4-4'(){ const v = rnd(0, 3);
    if (v === 0) { const kind = rnd(0, 2);
      if (kind === 0) { const m = rnd(1, 59); return nq(`p22:hm${m}`, 'hmin', '□에 알맞은 수는?', `1시간 ${m}분은 몇 분일까?`, eqH(`1시간 ${m}분 = ${QB}분`, true), 60 + m, '1시간은 60분이에요', `60분 + ${m}분 = ${60 + m}분`); }
      if (kind === 1) { const n = rnd(61, 119); return nq(`p22:mh${n}`, 'hmin', '□에 알맞은 수는?', `${n}분은 1시간 몇 분일까?`, eqH(`${n}분 = 1시간 ${QB}분`, true), n - 60, '60분이 1시간이에요', `${n}분 = 60분 + ${n - 60}분 = 1시간 ${n - 60}분`); }
      const k = rnd(1, 3), m = pick([0, 10, 20, 30, 40, 50]); return nq(`p22:hk${k}-${m}`, 'hmin', '□에 알맞은 수는?', `${k}시간${m ? ` ${m}분` : ''}은 몇 분일까?`, eqH(`${k}시간${m ? ` ${m}분` : ''} = ${QB}분`, true), k * 60 + m, '1시간은 60분이에요', `${Array(k).fill(60).join(' + ')}${m ? ` + ${m}` : ''} = ${k * 60 + m}분`); }
    const h = rnd(1, 10), m0 = rnd(0, 5) * 10, d = rnd(1, 9) * 10, e = h * 60 + m0 + d, h2 = Math.floor(e / 60), m2 = e % 60;
    if (v === 1) return nq(`p22:el${h}:${m0}+${d}`, 'elapsed', '시작한 시각부터 끝난 시각까지 몇 분 걸렸을까요?', null, p22Row(`<div style="width:46%;max-width:150px;text-align:center">${p22Clock(h, m0, 150)}<div class="muted">시작</div></div>`, `<div style="width:46%;max-width:150px;text-align:center">${p22Clock(h2, m2, 150)}<div class="muted">끝</div></div>`), d, `시작 ${p22T(h, m0)}, 끝 ${p22T(h2, m2)}. 10분씩 세어 봐요`, `${p22T(h, m0)} → ${p22T(h2, m2)}: ${d}분${d > 60 ? ` (1시간 ${d - 60}분)` : d === 60 ? ' (1시간)' : ''}`);
    if (v === 2) { const a = rnd(1, 11) * 5; let b; do { b = 60 + a + pick([-1, 1]) * rnd(1, 4) * 5; } while (b <= 0 || b === 60 + a); const la = `1시간 ${a}분`, lb = `${b}분`;
      return cq(`p22:hc${a}-${b}`, 'hmcmp', '더 긴 시간을 골라요', null, null, [la, lb], 60 + a > b ? la : lb, '1시간은 60분이에요. 분으로 바꾸어 비교해요', `${la} = ${60 + a}분`, { cols:2 }); }
    const act = pick(['그림 그리기', '줄넘기', '책 읽기', '피아노 연습', '블록 놀이', '종이접기']);
    const st = `${josa(act, '을', '를')} ${p22T(h, m0)}에 시작해서 ${p22T(h2, m2)}에 끝냈어요. 몇 분 동안 했을까요?`;
    return nq(`p22:es${act}${h}:${m0}+${d}`, 'elapsedst', st, null, `<div class="sent text-q" style="font-size:22px">${esc(st)}</div>`, d, '시작한 시각부터 10분씩 세어 봐요. 1시간은 60분', `${p22T(h, m0)} → ${p22T(h2, m2)}: ${d}분`); },
  'p4-5'(){ const v = rnd(0, 3);
    if (v === 0) { const kind = rnd(0, 2);
      if (kind === 0) { const h = rnd(1, 23); return nq(`p22:dh${h}`, 'dayhour', '□에 알맞은 수는?', `1일 ${h}시간은 몇 시간일까?`, eqH(`1일 ${h}시간 = ${QB}시간`, true), 24 + h, '하루(1일)는 24시간이에요', `24 + ${h} = ${24 + h}시간`); }
      if (kind === 1) { const n = rnd(25, 47); return nq(`p22:hd${n}`, 'dayhour', '□에 알맞은 수는?', `${n}시간은 1일 몇 시간일까?`, eqH(`${n}시간 = 1일 ${QB}시간`, true), n - 24, '24시간이 1일이에요', `${n} − 24 = ${n - 24} → 1일 ${n - 24}시간`); }
      const d = rnd(1, 3); return nq(`p22:dd${d}`, 'dayhour', '□에 알맞은 수는?', `${d}일은 몇 시간일까?`, eqH(`${d}일 = ${QB}시간`, true), d * 24, '1일은 24시간이에요', `${Array(d).fill(24).join(' + ')} = ${d * 24}시간`); }
    if (v === 1) { const want = Math.random() < .5 ? '오전' : '오후', L = [['아침밥을 먹는 7시', '오전'], ['학교에 가는 8시 30분', '오전'], ['저녁밥을 먹는 6시', '오후'], ['잠자리에 드는 9시', '오후'], ['간식을 먹는 3시 30분', '오후'], ['아침에 일어나는 7시 20분', '오전'], ['점심을 먹는 12시 30분', '오후'], ['태권도에 가는 4시', '오후'], ['새벽 5시', '오전'], ['밤 10시', '오후'], ['낮 2시', '오후'], ['아침 9시', '오전'], ['해가 뜨는 6시', '오전'], ['수업이 시작되는 9시', '오전']].filter(x => x[1] === want), [t, a] = pick(L);
      return cq(`p22:ap${t}`, 'ampm', `${josa(t, '은', '는')} 오전일까요, 오후일까요?`, null, null, ['오전', '오후'], a, '밤 12시부터 낮 12시까지는 오전, 낮 12시부터 밤 12시까지는 오후예요', `${t} → ${a}`, { cols:2, big:true }); }
    if (v === 2) { if (Math.random() < .65) { const a = rnd(6, 11), b = rnd(1, 6); return nq(`p22:ph${a}-${b}`, 'hours', `오전 ${a}시부터 오후 ${b}시까지는 몇 시간일까요?`, null, p22DaySVG(), 12 - a + b, `오전 ${a}시부터 낮 12시까지 ${12 - a}시간, 낮 12시부터 오후 ${b}시까지 ${b}시간`, `${12 - a} + ${b} = ${12 - a + b}시간`); }
      const a = rnd(1, 8), b = rnd(a + 1, 11), ap = pick(['오전', '오후']); return nq(`p22:pp${ap}${a}-${b}`, 'hours', `${ap} ${a}시부터 ${ap} ${b}시까지는 몇 시간일까요?`, null, p22DaySVG(), b - a, '한 시간씩 세어 봐요', `${b} − ${a} = ${b - a}시간`); }
    const st = pickOX([['하루는 24시간이에요.','O'],['하루는 12시간이에요.','X'],['밤 12시부터 낮 12시까지를 오전이라고 해요.','O'],['낮 12시부터 밤 12시까지를 오전이라고 해요.','X'],['시계의 짧은바늘은 하루에 두 바퀴 돌아요.','O'],['시계의 짧은바늘은 하루에 한 바퀴 돌아요.','X'],['저녁 7시는 오후예요.','O'],['아침 8시는 오후예요.','X']]);
    return ox(`p22:aox${st[0]}`, st[0], st[1], '하루는 오전 12시간, 오후 12시간이에요', `${st[0]} → ${st[1]}`); },
  'p4-6'(){ const v = rnd(0, 2);
    if (v === 0) { const kind = rnd(0, 3);
      if (kind === 0) { const w = rnd(2, 5); return nq(`p22:wk${w}`, 'weekday', '□에 알맞은 수는?', `${w}주일은 며칠일까?`, eqH(`${w}주일 = ${QB}일`, true), 7 * w, '1주일은 7일이에요', `${Array(w).fill(7).join(' + ')} = ${7 * w}일`); }
      if (kind === 1) { const w = rnd(1, 3), d = rnd(1, 6); return nq(`p22:wd${w}-${d}`, 'weekday', '□에 알맞은 수는?', `${w}주일 ${d}일은 며칠일까?`, eqH(`${w}주일 ${d}일 = ${QB}일`, true), 7 * w + d, '1주일은 7일이에요', `${7 * w} + ${d} = ${7 * w + d}일`); }
      if (kind === 2) { const mo = pick([1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]), dd = [4, 6, 9, 11].includes(mo) ? 30 : 31; return nq(`p22:md${mo}`, 'month', `${mo}월은 며칠까지 있을까요?`, null, null, dd, '주먹을 쥐고 손등의 볼록한 곳은 31일, 들어간 곳은 30일(2월 빼고)', `${mo}월은 ${dd}일까지`); }
      const y = rnd(1, 2), m = rnd(0, 11); return nq(`p22:ym${y}-${m}`, 'month', '□에 알맞은 수는?', `${y}년${m ? ` ${m}개월` : ''}은 몇 개월일까?`, eqH(`${y}년${m ? ` ${m}개월` : ''} = ${QB}개월`, true), 12 * y + m, '1년은 12개월이에요', `${Array(y).fill(12).join(' + ')}${m ? ` + ${m}` : ''} = ${12 * y + m}개월`); }
    const dd = Math.random() < .55 ? 31 : 30, mo = pick(dd === 31 ? [1, 3, 5, 7, 8, 10, 12] : [4, 6, 9, 11]), s = rnd(0, 6);
    const wd = x => (s + x - 1) % 7;
    if (v === 1) { const x = rnd(1, dd), right = P22_WDAY[wd(x)] + '요일', o = new Set([right]); while (o.size < 3) o.add(pick(P22_WDAY) + '요일');
      return cq(`p22:cy${s}-${x}`, 'calday', `이달의 ${x}일은 무슨 요일일까요?`, null, p22Cal(mo, s, dd), [...o], right, '날짜를 찾아서 맨 위 칸의 요일을 봐요', `${mo}월 ${x}일은 ${right}`); }
    if (Math.random() < .5) { const x = rnd(1, dd - 7); return nq(`p22:cw${x}`, 'calweek', `이달의 ${x}일부터 1주일 뒤는 며칠일까요?`, null, p22Cal(mo, s, dd, x), x + 7, '1주일은 7일이에요. 달력에서 바로 아래 칸을 봐요', `${x} + 7 = ${x + 7}일`); }
    const w = rnd(0, 6), n = Array.from({ length:dd }, (_, i) => i + 1).filter(x => wd(x) === w).length;
    return nq(`p22:cn${s}-${dd}-${w}`, 'calweek', `이달에 ${P22_WDAY[w]}요일은 모두 몇 번 있을까요?`, null, p22Cal(mo, s, dd), n, `${P22_WDAY[w]}요일 줄의 날짜를 세어 봐요`, `${Array.from({ length:dd }, (_, i) => i + 1).filter(x => wd(x) === w).join(', ')} → ${n}번`); },

  /* ---------- 5단원 표와 그래프 ---------- */
  'p5-1'(){ const v = rnd(0, 3), D = p22Data(false), i = rnd(0, 3), nm = D.names[i];
    if (v === 0) return nq(`p22:dc${D.id}-${i}`, 'tcount', `친구들이 좋아하는 ${josa(D.topic, '을', '를')} 조사했어요. ${josa(nm, '을', '를')} 좋아하는 친구는 몇 명일까요?`, null, p22Pic(D), D.cnt[i], `${D.cats[i][0]}에 하나씩 표시하며 세어 봐요`, `${nm} ${D.cnt[i]}명`);
    if (v === 1) return nq(`p22:ts${D.id}`, 'ttotal', '조사한 친구는 모두 몇 명일까요? 표의 ?에 알맞은 수를 써요', null, p22Tab(D, 'sum'), D.sum, '합계는 종류별 수를 모두 더한 수예요', `${D.cnt.join(' + ')} = ${D.sum}`);
    if (v === 2) return nq(`p22:tb${D.id}-${i}`, 'tblank', '표의 ?에 알맞은 수는?', null, p22Tab(D, i), D.cnt[i], `합계 ${D.sum}에서 나머지 수를 빼 봐요`, `${D.sum} − ${D.cnt.filter((_, j) => j !== i).join(' − ')} = ${D.cnt[i]}`);
    const st = pickOX([['표로 나타내면 종류별 수를 알아보기 쉬워요.','O'],['표를 보면 누가 무엇을 좋아하는지 알 수 있어요.','X'],['조사한 자료를 보면 누가 무엇을 좋아하는지 알 수 있어요.','O'],['표의 합계는 조사한 사람 수와 같아요.','O'],['표의 합계는 가장 많은 것의 수예요.','X'],['자료를 셀 때 표시를 하면서 세면 빠뜨리지 않아요.','O'],['자료를 셀 때 같은 것을 두 번 세어도 괜찮아요.','X'],['표를 만들 때 종류마다 몇 명인지 써요.','O']]);
    return ox(`p22:tox${st[0]}`, st[0], st[1], '표는 종류별 수와 합계를 알려 줘요', `${st[0]} → ${st[1]}`); },
  'p5-2'(){ const v = rnd(0, 3);
    if (v === 0) { const D = p22Data(false), i = rnd(0, 3); return nq(`p22:gr${D.id}-${i}`, 'gread', `그래프에서 ${josa(D.names[i], '을', '를')} 좋아하는 친구는 몇 명일까요?`, null, p22Graph(D), D.cnt[i], '○의 수를 아래에서부터 세어 봐요', `${D.names[i]} ${D.cnt[i]}명`); }
    if (v === 1) { const D = p22Data(true), mx = Math.max(...D.cnt), a = D.names[D.cnt.indexOf(mx)];
      return cq(`p22:gm${D.id}`, 'gmost', `가장 많은 친구가 좋아하는 ${josa(D.topic, '은', '는')}?`, null, p22Graph(D), D.names, a, '○가 가장 높이 올라간 것을 찾아요', `${a} ${mx}명`, { cols:2 }); }
    if (v === 2) { const D = p22Data(false), mx = Math.max(...D.cnt);
      return nq(`p22:gx${D.id}`, 'gmake', `표를 보고 그래프에 ○로 나타내요. ○를 가장 많이 그려야 하는 칸에는 ○를 몇 개 그릴까요?`, null, p22Tab(D), mx, '표에서 가장 큰 수를 찾아요', `가장 많은 수: ${mx} → ○ ${mx}개`); }
    const st = pickOX([['그래프에서 ○는 아래에서부터 빈칸 없이 그려요.','O'],['그래프에서 ○는 위에서부터 그려요.','X'],['그래프를 보면 가장 많은 것을 한눈에 알 수 있어요.','O'],['이 그래프에서 ○ 하나는 친구 한 명을 나타내요.','O'],['그래프에서 ○를 띄엄띄엄 그려도 돼요.','X'],['그래프를 보면 누가 무엇을 좋아하는지 알 수 있어요.','X'],['그래프에서 ○가 높을수록 수가 많아요.','O'],['그래프에서 ○ 대신 다른 표시를 쓸 수 없어요.','X']]);
    return ox(`p22:gox${st[0]}`, st[0], st[1], '그래프는 ○를 아래에서부터 한 칸에 하나씩 그려요', `${st[0]} → ${st[1]}`); },
  'p5-3'(){ const v = rnd(0, 3);
    if (v === 0) { let D, i, j; do { D = p22Data(false); i = rnd(0, 3); j = rnd(0, 3); } while (D.cnt[i] <= D.cnt[j]);
      return nq(`p22:gd${D.id}-${i}-${j}`, 'gdiff', `${josa(D.names[i], '을', '를')} 좋아하는 친구는 ${josa(D.names[j], '을', '를')} 좋아하는 친구보다 몇 명 더 많을까요?`, null, Math.random() < .5 ? p22Graph(D) : p22Tab(D), D.cnt[i] - D.cnt[j], '두 수를 찾아서 큰 수에서 작은 수를 빼요', `${D.cnt[i]} − ${D.cnt[j]} = ${D.cnt[i] - D.cnt[j]}명`); }
    if (v === 1) { const D = p22Data(true), mn = Math.min(...D.cnt), a = D.names[D.cnt.indexOf(mn)];
      return cq(`p22:gl${D.id}`, 'gleast', `가장 적은 친구가 좋아하는 ${josa(D.topic, '은', '는')}?`, null, p22Graph(D), D.names, a, '○가 가장 낮은 것을 찾아요', `${a} ${mn}명`, { cols:2 }); }
    if (v === 2) { const D = p22Data(false), k = rnd(2, 5), n = D.cnt.filter(x => x > k).length;
      return nq(`p22:gk${D.id}-${k}`, 'gmore', `${k}명보다 많은 친구가 좋아하는 ${josa(D.topic, '은', '는')} 몇 가지일까요?`, null, p22Graph(D), n, `○가 ${k}칸보다 높이 올라간 것을 세어요`, `${D.names.filter((_, j) => D.cnt[j] > k).join(', ') || '없음'} → ${n}가지`); }
    const [p, a] = pick([['조사한 친구가 모두 몇 명인지 바로 알 수 있는 것은?', '표'], ['가장 많은 것을 한눈에 알아보기 쉬운 것은?', '그래프'], ['많고 적은 것을 ○의 높이로 비교할 수 있는 것은?', '그래프'], ['합계 칸이 있어서 전체 수를 알기 쉬운 것은?', '표']]);
    return cq(`p22:gw${p}`, 'gwhich', p, null, null, ['표', '그래프'], a, '표에는 합계가 있고, 그래프는 많고 적음을 한눈에 보여 줘요', `${p} → ${a}`, { cols:2, big:true }); },

  /* ---------- 6단원 규칙 찾기 ---------- */
  'p6-1'(){ const v = rnd(0, 3);
    if (v === 2) { const ar = ['⬆️', '➡️', '⬇️', '⬅️'], st = rnd(0, 3), cw = Math.random() < .5, n = rnd(4, 6), seq = Array.from({ length:n + 1 }, (_, i) => ar[(st + (cw ? i : -i) + 40) % 4]);
      return cq(`p22:rot${st}${cw}${n}`, 'rotate', '규칙을 찾아 ?에 알맞은 것을 골라요', '화살표가 도는 규칙을 찾아 다음에 올 것을 골라 봐요', null, ar, seq[n], cw ? '화살표가 시곗바늘이 도는 방향으로 한 번씩 돌아요' : '화살표가 시곗바늘이 도는 방향과 반대로 한 번씩 돌아요', seq.join(' '), { vis:{ k:'pattern', items:seq.slice(0, n) }, pic:true, cols:2, optHtml:p22EmoOpts(ar) }); }
    const P = p22PatSeq(), opts = P.uniq.length >= 3 ? P.uniq.slice(0, 3) : [...P.uniq, P.extra], U = P.unit.join('');
    if (v === 0) { const cut = rnd(6, 8), items = Array.from({ length:cut }, (_, i) => P.at(i));
      return cq(`p22:pn${U}${cut}`, 'pattern', '규칙을 찾아 ?에 알맞은 것을 골라요', '규칙을 찾아서 다음에 올 것을 골라 봐요', null, opts, P.at(cut), `'${P.unit.join(' ')}'가 되풀이돼요`, `${P.unit.join(' ')} 순서로 되풀이돼요`, { vis:{ k:'pattern', items }, pic:true, cols:3, optHtml:p22EmoOpts(opts) }); }
    if (v === 1) { const N = rnd(10, 15), E = pick(P.uniq), n = Array.from({ length:N }, (_, i) => P.at(i)).filter(x => x === E).length;
      return nq(`p22:pc${U}${N}${E}`, 'patcount', `규칙에 따라 ${N}개를 늘어놓으면 ${E}는 모두 몇 개일까요?`, `규칙에 따라 ${N}개를 늘어놓으면 이것은 모두 몇 개일까?`, `<div class="pattern">${Array.from({ length:8 }, (_, i) => `<span>${P.at(i)}</span>`).join('')}<span style="font-size:28px">…</span></div>`, n, `${P.unit.length}개씩 되풀이돼요. ${N}번째까지 이어서 그려 봐요`, `${Array.from({ length:N }, (_, i) => P.at(i)).join('')} → ${n}개`); }
    const pos = rnd(10, 16);
    return cq(`p22:pp${U}${pos}`, 'patpos', `규칙에 따라 늘어놓을 때 ${pos}번째에 올 것은?`, null, `<div class="pattern">${Array.from({ length:8 }, (_, i) => `<span>${P.at(i)}</span>`).join('')}<span style="font-size:28px">…</span></div>`, opts, P.at(pos - 1), `${P.unit.length}개씩 되풀이돼요. 이어서 세어 봐요`, `${pos}번째: ${P.at(pos - 1)}`, { pic:true, cols:3, optHtml:p22EmoOpts(opts) }); },
  'p6-2'(){ const rule = pick(['line', 'wall', 'stair', 'tower']), s = rnd(1, 3), k = rule === 'tower' ? rnd(1, 3) : 1, f = P22_STACK[rule];
    const inc = rule === 'stair' ? null : p22Sum(f(s, 1, k)) - p22Sum(f(s, 0, k)), qk = rule !== 'stair' && Math.random() < .35 ? 'inc' : pick([4, 5]);
    const how = { line:'오른쪽에 1개씩', wall:'오른쪽에 2개씩', stair:'오른쪽에 한 줄씩 더 높게', tower:`위에 ${k}개씩` }[rule];
    if (qk === 'inc') return nq(`p22:sti${rule}${s}${k}`, 'stackinc', '쌓기나무를 규칙에 따라 쌓았어요. 쌓기나무가 몇 개씩 늘어날까요?', null, p22Stages(f, s, k), inc, '첫째, 둘째, 셋째 모양의 쌓기나무 수를 세어 비교해요', `${[0, 1, 2].map(i => p22Sum(f(s, i, k))).join(', ')} → ${inc}개씩 늘어나요`);
    const n = p22Sum(f(s, qk - 1, k));
    return nq(`p22:stn${rule}${s}${k}${qk}`, 'stackn', `규칙에 따라 쌓았어요. ${qk === 4 ? '넷째' : '다섯째'} 모양에 쌓을 쌓기나무는 모두 몇 개일까요?`, null, p22Stages(f, s, k), n, `쌓기나무가 ${how} 늘어나요`, `${Array.from({ length:qk }, (_, i) => p22Sum(f(s, i, k))).join(', ')} → ${n}개`); },
  'p6-3'(){ const v = rnd(0, 3), r0 = rnd(1, 7), c0 = rnd(1, 7);
    if (v === 0) { const hole = [rnd(0, 2), rnd(0, 2)], ans = r0 + hole[0] + c0 + hole[1];
      return nq(`p22:at${r0}-${c0}-${hole}`, 'atable', '덧셈표에서 ?에 알맞은 수는?', '덧셈표의 일부예요. 물음표에 알맞은 수는?', p22OpTable(r0, c0, 3, 3, hole, '+'), ans, '세로줄 수와 가로줄 수를 더해요. → 쪽으로 1씩 커져요', `${r0 + hole[0]} + ${c0 + hole[1]} = ${ans}`); }
    if (v === 1) { const dir = pick(['down', 'right', 'diag', 'anti']), hi = { down:[[0, 1], [1, 1], [2, 1]], right:[[1, 0], [1, 1], [1, 2]], diag:[[0, 0], [1, 1], [2, 2]], anti:[[0, 2], [1, 1], [2, 0]] }[dir], a = { down:'1씩 커져요', right:'1씩 커져요', diag:'2씩 커져요', anti:'모두 같아요' }[dir];
      return cq(`p22:ad${dir}${r0}-${c0}`, 'arule', '색칠한 칸의 수에는 어떤 규칙이 있을까요?', null, p22OpTable(r0, c0, 3, 3, null, '+', hi), ['1씩 커져요', '2씩 커져요', '모두 같아요'], a, '색칠한 칸의 수를 차례로 읽어 봐요', `${hi.map(([r, c]) => r0 + r + c0 + c).join(', ')} → ${a}`, { cols:1 }); }
    if (v === 2) { const a = rnd(1, 8), b = rnd(2, 9);
      return nq(`p22:ae${a}+${b}`, 'asame', '덧셈표에서 ↙ 방향의 수는 모두 같아요. □에 알맞은 수는?', `${a} 더하기 ${numJosa(b, '과', '와')} ${a + 1} 더하기 네모가 같아요`, eqH(`${a} + ${b} = ${a + 1} + ${QB}`, true), b - 1, '더하는 수 하나가 1 커지면 다른 수는 1 작아져야 합이 같아요', `${a} + ${b} = ${a + b}, ${a + 1} + ${b - 1} = ${a + b}`); }
    const n = rnd(2, 18), cnt = n <= 10 ? n - 1 : 19 - n;
    return nq(`p22:ac${n}`, 'acount', `1부터 9까지의 덧셈표에서 합이 ${n}인 칸은 모두 몇 개일까요?`, null, eqH(`□ + □ = ${n}`, true), cnt, '더하는 두 수를 1부터 차례로 찾아봐요', `${Array.from({ length:9 }, (_, i) => i + 1).filter(x => n - x >= 1 && n - x <= 9).map(x => `${x} + ${n - x}`).join(', ')} → ${cnt}개`); },
  'p6-4'(){ const v = rnd(0, 3), r0 = rnd(2, 7), c0 = rnd(2, 7);
    if (v === 0) { const hole = [rnd(0, 2), rnd(0, 2)], ans = (r0 + hole[0]) * (c0 + hole[1]);
      return nq(`p22:mt${r0}-${c0}-${hole}`, 'mtable', '곱셈표의 규칙을 생각하며 ?에 알맞은 수를 써요', '곱셈표의 일부예요. 물음표에 알맞은 수는?', p22OpTable(r0, c0, 3, 3, hole), ans, `→ 쪽으로 ${r0 + hole[0]}씩 커져요`, `${r0 + hole[0]} × ${c0 + hole[1]} = ${ans}`); }
    if (v === 1) { const row = Math.random() < .5, i = rnd(0, 2), k = (row ? r0 : c0) + i, hi = [0, 1, 2].map(j => row ? [i, j] : [j, i]);
      const opts = [`${k}씩 커져요`, `${k + 1}씩 커져요`, `${k - 1}씩 커져요`];
      return cq(`p22:mr${row}${r0}-${c0}-${i}`, 'mrule', `색칠한 칸의 수는 ${row ? '→' : '↓'} 쪽으로 몇씩 커질까요?`, null, p22OpTable(r0, c0, 3, 3, null, '×', hi), opts, opts[0], '이웃한 두 수의 차이를 구해 봐요', `${hi.map(([r, c]) => (r0 + r) * (c0 + c)).join(', ')} → ${k}씩 커져요 (${k}단)`, { cols:1 }); }
    if (v === 2) { let a, b; do { a = rnd(2, 9); b = rnd(2, 9); } while (a === b);
      return nq(`p22:ms${a}x${b}`, 'mswap', '곱셈표에서 곱이 같은 칸을 찾아요. □에 알맞은 수는?', `${a} 곱하기 ${numJosa(b, '은', '는')} ${b} 곱하기 네모와 같아요`, eqH(`${a} × ${b} = ${b} × ${QB}`, true), a, '곱하는 두 수의 순서를 바꾸어도 곱은 같아요', `${a} × ${b} = ${b} × ${a} = ${a * b}`); }
    const st = pickOX([['5단 곱셈구구의 곱은 일의 자리 숫자가 5, 0이 번갈아 나와요.','O'],['2단 곱셈구구의 곱은 모두 짝수예요.','O'],['곱셈표에서 3 × 4와 4 × 3의 곱은 달라요.','X'],['곱셈표에서 ↓ 쪽으로 갈수록 곱이 작아져요.','X'],['4단 곱셈구구의 곱은 4씩 커져요.','O'],['9단 곱셈구구의 곱은 모두 홀수예요.','X'],['곱셈표를 ↘ 점선을 따라 접으면 만나는 수는 같아요.','O'],['1단 곱셈구구의 곱은 모두 1이에요.','X']]);
    return ox(`p22:mox${st[0]}`, st[0], st[1], '곱셈표를 떠올리며 하나씩 확인해 봐요', `${st[0]} → ${st[1]}`); },
  'p6-5'(){ const v = rnd(0, 2);
    if (v === 0) { if (Math.random() < .15) return nq('p22:cdown', 'calwin', '달력에서 ↓ 쪽으로 한 칸 가면 날짜는 몇씩 커질까요?', null, p22Cal(5, 3, 31), 7, '1주일은 며칠인지 떠올려 봐요', '1주일 = 7일 → 7씩 커져요');
      const d0 = rnd(1, 10), hole = [rnd(0, 2), rnd(0, 2)], td = t => `<td style="min-width:40px">${t}</td>`;
      const tb = `<table class="pv hchart" style="margin:auto">${[0, 1, 2].map(r => `<tr>${[0, 1, 2].map(c => td(r === hole[0] && c === hole[1] ? QB : d0 + r * 7 + c)).join('')}</tr>`).join('')}</table>`;
      return nq(`p22:cwin${d0}-${hole}`, 'calwin', '달력의 일부예요. ?에 알맞은 날짜는?', null, tb, d0 + hole[0] * 7 + hole[1], '→ 쪽으로 1씩, ↓ 쪽으로 7씩 커져요', `${d0 + hole[0] * 7 + hole[1]}일`); }
    if (v === 1) { const w = rnd(5, 7), ri = rnd(1, 3), k = rnd(1, w), rows = ['가', '나', '다', '라'], td = (t, st = '') => `<td style="min-width:32px;padding:5px;font-size:17px;${st}">${t}</td>`;
      const tb = `<table class="pv" style="margin:auto">${rows.map((nm, r) => `<tr>${td(nm + '열', 'background:#FFF4D6')}${Array.from({ length:w }, (_, c) => td(r === 0 ? c + 1 : r === ri && c === k - 1 ? QB : '')).join('')}</tr>`).join('')}</table>`;
      return nq(`p22:seat${w}-${ri}-${k}`, 'seat', `공연장 의자에 규칙에 따라 번호를 붙였어요. ?에 알맞은 번호는?`, null, tb, ri * w + k, `한 줄에 ${w}자리예요. 아래 줄로 가면 ${w}씩 커져요`, `${rows[ri]}열 ${k}번째: ${ri * w + k}번`); }
    const h = rnd(7, 10), m0 = pick([0, 5, 10]), k = pick([10, 15, 20]), nMax = Math.floor((55 - m0) / k) + 1, n = rnd(2, Math.min(4, nMax)), ans = m0 + k * (n - 1);
    return nq(`p22:bus${h}:${m0}+${k}x${n}`, 'bus', `버스가 ${p22T(h, m0)}부터 ${k}분마다 출발해요. ${['', '', '둘째', '셋째', '넷째'][n]} 버스는 몇 시 몇 분에 출발할까요?`, null, `<div class="pic" style="font-size:40px">🚌</div>` + eqH(`${h}시 ${QB}분`, true), ans, `${p22T(h, m0)}부터 ${k}분씩 더해 가요`, Array.from({ length:n }, (_, i) => p22T(h, m0 + k * i)).join(' → ')); },
});

/* ---------- 단원 · 차시 ---------- */
const MATH22 = {
  title:'초2 2학기 수학', grade:'2학년 2학기', short2:'2-2', subj:'math', short:'수학',
  units:[
    { n:1, name:'네 자리 수', lessons:[
      { id:'p1-1', title:'1000을 알아볼까요', cards:[
        { ill:() => p22Chips([0, 9, 0, 0]) + eqH('900 + 100 = 1000', true), text:'100이 10개이면 1000이에요. 1000은 "천"이라고 읽어요. 999보다 1 큰 수, 900보다 100 큰 수, 990보다 10 큰 수도 모두 1000이에요.', say:'백이 열 개이면 천이에요. 구백구십구보다 1 큰 수도 천이에요.' } ] },
      { id:'p1-2', title:'몇천을 알아볼까요', cards:[
        { ill:() => p22Chips([3, 0, 0, 0]) + eqH('3000 (삼천)', true), text:'1000이 3개이면 3000이에요. "삼천"이라고 읽어요. 1000이 하나씩 늘면 2000, 3000, 4000 … 9000이 돼요.', say:'천이 세 개이면 삼천이에요.' } ] },
      { id:'p1-3', title:'네 자리 수를 쓰고 읽어 볼까요', cards:[
        { ill:() => p22Chips([2, 4, 0, 7]) + eqH('2407 (이천사백칠)', true), text:'1000이 2개, 100이 4개, 10이 0개, 1이 7개이면 2407이에요. "이천사백칠"이라고 읽어요. 0인 자리는 읽지 않지만, 쓸 때는 꼭 0을 써요.', say:'이천사백칠. 영인 자리는 읽지 않지만 쓸 때는 영을 써요.' } ] },
      { id:'p1-4', title:'각 자리 숫자는 얼마를 나타낼까요', cards:[
        { ill:() => `<table class="pv" style="margin:auto"><tr><th>천</th><th>백</th><th>십</th><th>일</th></tr><tr><td>5</td><td>3</td><td>7</td><td>2</td></tr></table>` + eqH('5372 = 5000 + 300 + 70 + 2', true), text:'5372에서 5는 천의 자리 숫자라서 5000, 3은 백의 자리라서 300, 7은 십의 자리라서 70, 2는 일의 자리라서 2를 나타내요.', say:'같은 숫자라도 어느 자리에 있느냐에 따라 나타내는 값이 달라요.' } ] },
      { id:'p1-5', title:'뛰어 세어 볼까요', cards:[
        { ill:() => eqH('1000씩: 2350, 3350, 4350<br>100씩: 2350, 2450, 2550<br>10씩: 2350, 2360, 2370', true), text:'1000씩 뛰어 세면 천의 자리 숫자가, 100씩 뛰어 세면 백의 자리 숫자가, 10씩 뛰어 세면 십의 자리 숫자가 1씩 커져요.', say:'몇씩 뛰어 세는지에 따라 바뀌는 자리가 달라요.' } ] },
      { id:'p1-6', title:'수의 크기를 비교해 볼까요', cards:[
        { ill:() => eqH('3<span style="color:#EE5F8D">5</span>48 &gt; 3<span style="color:#EE5F8D">2</span>91', true), text:'네 자리 수는 천의 자리부터 차례로 비교해요. 천의 자리가 같으면 백의 자리, 백의 자리도 같으면 십의 자리를 비교해요.', say:'천의 자리부터 차례로 비교해요.' } ] },
    ] },
    { n:2, name:'곱셈구구', lessons:[
      { id:'p2-1', title:'2단, 5단 곱셈구구', cards:[p22DanCard(2, '🚲'), p22DanCard(5, '🌸')] },
      { id:'p2-2', title:'3단, 6단 곱셈구구', cards:[p22DanCard(3, '🍡'), p22DanCard(6, '🐞')] },
      { id:'p2-3', title:'4단, 8단 곱셈구구', cards:[p22DanCard(4, '🚗'), p22DanCard(8, '🐙')] },
      { id:'p2-4', title:'7단, 9단 곱셈구구', cards:[p22DanCard(7, '🧃'), p22DanCard(9, '🧩')] },
      { id:'p2-5', title:'1단 곱셈구구와 0의 곱', cards:[
        { ill:() => `<div class="pic" style="font-size:36px">🌷🌷🌷🌷 · 🧺🧺🧺</div>` + eqH('1 × 4 = 4<br>0 × 3 = 0', true), text:'1에 어떤 수를 곱하거나 어떤 수에 1을 곱하면 그 수 그대로예요. 0에 어떤 수를 곱하거나 어떤 수에 0을 곱하면 항상 0이에요.', say:'1을 곱하면 그대로, 0을 곱하면 항상 0이에요.' } ] },
      { id:'p2-6', title:'곱셈표를 만들고 활용해 볼까요', cards:[
        { ill:() => p22OpTable(2, 2, 4, 4, null, '×', [[0, 1], [1, 0]]), text:'곱셈표에서 세로줄 수와 가로줄 수를 곱한 값을 칸에 써요. 2 × 3과 3 × 2처럼 곱하는 두 수의 순서를 바꾸어도 곱은 같아요.', say:'곱하는 두 수의 순서를 바꾸어도 곱은 같아요.' } ] },
    ] },
    { n:3, name:'길이 재기', lessons:[
      { id:'p3-1', title:'cm보다 더 큰 단위 m', cards:[
        { ill:() => p22MeterSVG(), text:'100 cm는 1 m예요. 1 m는 "1 미터"라고 읽어요. 130 cm는 1 m보다 30 cm 더 길어서 1 m 30 cm라고 써요.', say:'백 센티미터는 1미터예요.' } ] },
      { id:'p3-2', title:'자로 길이를 재어 볼까요', cards:[
        { ill:() => p22Tape(130, '끈'), text:'긴 길이는 줄자로 재요. 물건의 한쪽 끝을 줄자의 0에 맞추고, 다른 쪽 끝의 눈금을 읽어요. 130 cm = 1 m 30 cm예요.', say:'한쪽 끝을 영에 맞추고, 다른 쪽 끝의 눈금을 읽어요.' } ] },
      { id:'p3-3', title:'길이의 합을 구해 볼까요', cards:[
        { ill:() => p22LenTab([1, 20], [2, 35], '+'), text:'m는 m끼리, cm는 cm끼리 더해요. 1 m 20 cm + 2 m 35 cm = 3 m 55 cm예요.', say:'미터는 미터끼리, 센티미터는 센티미터끼리 더해요.' } ] },
      { id:'p3-4', title:'길이의 차를 구해 볼까요', cards:[
        { ill:() => p22LenTab([3, 75], [1, 40], '−'), text:'m는 m끼리, cm는 cm끼리 빼요. 3 m 75 cm − 1 m 40 cm = 2 m 35 cm예요.', say:'미터는 미터끼리, 센티미터는 센티미터끼리 빼요.' } ] },
      { id:'p3-5', title:'길이를 어림해 볼까요', cards:[
        { ill:() => `<div class="pic" style="font-size:52px">✋ 👣 🙆</div>`, text:'한 뼘, 한 걸음, 양팔을 벌린 길이로 길이를 어림할 수 있어요. 양팔을 벌린 길이가 약 1 m라면, 양팔로 3번 잰 길이는 약 3 m예요. 어림한 길이는 "약"을 붙여 말해요.', say:'몸의 일부로 길이를 어림해요. 어림한 길이는 약을 붙여 말해요.' } ] },
    ] },
    { n:4, name:'시각과 시간', lessons:[
      { id:'p4-1', title:'몇 시 몇 분을 읽어 볼까요 (5분 단위)', cards:[
        { ill:() => p22Box(p22Clock(2, 25)), text:'긴바늘이 1을 가리키면 5분, 2는 10분, 3은 15분이에요. 긴바늘이 5, 짧은바늘이 2와 3 사이에 있으면 2시 25분이에요.', say:'긴바늘이 숫자 한 칸을 가면 5분이에요. 이 시계는 두 시 이십오 분이에요.' } ] },
      { id:'p4-2', title:'몇 시 몇 분을 읽어 볼까요 (1분 단위)', cards:[
        { ill:() => p22Box(p22Clock(4, 13, 190), 190), text:'시계의 작은 눈금 한 칸은 1분이에요. 긴바늘이 2(10분)에서 작은 눈금 3칸 더 갔으면 13분이에요. 이 시계는 4시 13분이에요.', say:'작은 눈금 한 칸은 1분이에요. 이 시계는 네 시 십삼 분이에요.' } ] },
      { id:'p4-3', title:'여러 가지 방법으로 시각을 읽어 볼까요', cards:[
        { ill:() => p22Box(p22Clock(2, 55)) + eqH('2시 55분 = 3시 5분 전', true), text:'2시 55분에서 5분이 지나면 3시예요. 그래서 2시 55분을 "3시 5분 전"이라고도 해요.', say:'두 시 오십오 분은 세 시 오 분 전이라고도 해요.' } ] },
      { id:'p4-4', title:'1시간과 걸린 시간을 알아볼까요', cards:[
        { ill:() => p22Row(`<div style="width:46%;max-width:140px">${p22Clock(3, 0, 140)}</div>`, `<div style="width:46%;max-width:140px">${p22Clock(4, 0, 140)}</div>`) + eqH('1시간 = 60분', true), text:'긴바늘이 한 바퀴 도는 데 60분이 걸려요. 60분은 1시간이에요. 3시부터 4시까지는 1시간이에요. 1시간 20분은 80분이에요.', say:'긴바늘이 한 바퀴 돌면 육십 분, 한 시간이에요.' } ] },
      { id:'p4-5', title:'하루의 시간을 알아볼까요', cards:[
        { ill:() => p22DaySVG(), text:'하루는 24시간이에요. 밤 12시부터 낮 12시까지를 오전, 낮 12시부터 밤 12시까지를 오후라고 해요. 짧은바늘은 하루에 두 바퀴 돌아요.', say:'하루는 이십사 시간이에요. 낮 열두 시 전은 오전, 후는 오후예요.' } ] },
      { id:'p4-6', title:'달력을 알아볼까요', cards:[
        { ill:() => p22Cal(11, 0, 30, 3), text:'1주일은 7일이에요. 1년은 12개월이에요. 1월, 3월, 5월, 7월, 8월, 10월, 12월은 31일까지, 4월, 6월, 9월, 11월은 30일까지 있고, 2월은 28일이나 29일까지 있어요.', say:'일주일은 칠 일, 일 년은 열두 달이에요.' } ] },
    ] },
    { n:5, name:'표와 그래프', lessons:[
      { id:'p5-1', title:'자료를 분류하여 표로 나타내 볼까요', cards:[
        { ill:() => { const D = { topic:'과일', cats:P22_TOPIC[0][1], names:P22_TOPIC[0][1].map(c => c[1]), cnt:[4, 2, 5, 3], sum:14 }; return p22Pic(D) + p22Tab(D); }, text:'친구들이 좋아하는 과일을 조사했어요. 종류별로 하나씩 표시하며 세어 표로 나타내면 종류별 수와 합계를 한눈에 알 수 있어요.', say:'자료를 종류별로 세어 표로 나타내요.' } ] },
      { id:'p5-2', title:'자료를 그래프로 나타내 볼까요', cards:[
        { ill:() => p22Graph({ topic:'과일', names:['사과', '포도', '딸기', '수박'], cnt:[4, 2, 5, 3] }), text:'그래프는 ○를 아래에서부터 한 칸에 하나씩, 빈칸 없이 그려요. ○가 높을수록 그것을 좋아하는 친구가 많아요.', say:'그래프는 아래에서부터 빈칸 없이 동그라미를 그려요.' } ] },
      { id:'p5-3', title:'표와 그래프를 보고 알아볼까요', cards:[
        { ill:() => p22Graph({ topic:'계절', names:['봄', '여름', '가을', '겨울'], cnt:[3, 6, 2, 4] }), text:'표를 보면 조사한 전체 수(합계)를 쉽게 알 수 있고, 그래프를 보면 가장 많은 것과 가장 적은 것을 한눈에 알 수 있어요.', say:'표는 합계를, 그래프는 많고 적음을 한눈에 보여 줘요.' } ] },
    ] },
    { n:6, name:'규칙 찾기', lessons:[
      { id:'p6-1', title:'무늬에서 규칙을 찾아볼까요', cards:[
        { ill:() => `<div class="pattern"><span>🔴</span><span>🟡</span><span>🟡</span><span>🔴</span><span>🟡</span><span>🟡</span></div><div class="pattern"><span>⬆️</span><span>➡️</span><span>⬇️</span><span>⬅️</span></div>`, text:'빨강, 노랑, 노랑이 되풀이돼요. 화살표는 시곗바늘이 도는 방향으로 한 번씩 돌아요. 되풀이되는 부분을 찾으면 다음에 올 것을 알 수 있어요.', say:'되풀이되는 부분을 찾으면 다음에 올 것을 알 수 있어요.' } ] },
      { id:'p6-2', title:'쌓은 모양에서 규칙을 찾아볼까요', cards:[
        { ill:() => p22Stages(P22_STACK.stair, 1, 1), text:'쌓기나무가 오른쪽에 한 줄씩 더 높게 늘어나요. 1개, 3개, 6개 … 다음 모양은 10개예요.', say:'쌓기나무가 어떻게 늘어나는지 찾아봐요.' } ] },
      { id:'p6-3', title:'덧셈표에서 규칙을 찾아볼까요', cards:[
        { ill:() => p22OpTable(1, 1, 4, 4, null, '+', [[0, 3], [1, 2], [2, 1], [3, 0]]), text:'덧셈표에서 → 쪽, ↓ 쪽으로 가면 1씩 커져요. ↘ 쪽으로 가면 2씩 커지고, 색칠한 ↙ 쪽의 수는 모두 같아요.', say:'덧셈표에서 옆으로, 아래로 가면 1씩 커져요.' } ] },
      { id:'p6-4', title:'곱셈표에서 규칙을 찾아볼까요', cards:[
        { ill:() => p22OpTable(3, 1, 3, 5, null, '×', [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]), text:'곱셈표에서 3단의 수는 3씩, 4단의 수는 4씩 커져요. 2단, 4단, 6단, 8단의 곱은 모두 짝수예요.', say:'3단은 3씩, 4단은 4씩 커져요.' } ] },
      { id:'p6-5', title:'생활에서 규칙을 찾아볼까요', cards:[
        { ill:() => p22Cal(5, 3, 31, 15), text:'달력에서 → 쪽으로 가면 1씩, ↓ 쪽으로 가면 7씩 커져요. 공연장 의자 번호, 버스 출발 시각에도 규칙이 있어요.', say:'달력에서 아래로 가면 칠씩 커져요.' } ] },
    ] },
  ],
};
