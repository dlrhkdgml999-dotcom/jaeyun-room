/* ===================== 수학 단원 진도: 초1 2학기 (2022 개정 · EBS 만점왕 수학 플러스 1-2 순서) ===================== */
const NATIVE_T = ['','열','스물','서른','마흔','쉰','예순','일흔','여든','아흔'];
const NATIVE_O = ['','하나','둘','셋','넷','다섯','여섯','일곱','여덟','아홉'];
const nativeKo = n => n === 100 ? '백' : NATIVE_T[Math.floor(n / 10)] + NATIVE_O[n % 10];
const tensV = (t, o) => ({ vis:{ k:'tens', t, o } });
const FOODS = COUNT_THINGS.filter(x => ['딸기','사과','과자','컵케이크','사탕'].includes(x[1]));
const storyH = t => `<div class="sent text-q" style="font-size:22px">${esc(t)}</div>`;
const SHAPE3 = { '○':'circ', '△':'tri1', '□':'quad2' };
const shape3Opts = () => Object.fromEntries(Object.entries(SHAPE3).map(([k, id]) => [k, `<span style="display:grid;place-items:center;gap:2px">${shapeSVG(id, 64)}<span style="font-size:18px">${k} 모양</span></span>`]));
const SHAPE_THINGS = {
  '○':[['🪙','동전'],['🕒','벽시계'],['💿','시디'],['🍪','동그란 쿠키'],['🔘','단추'],['🍩','도넛'],['🛞','바퀴'],['🥏','원반']],
  '△':[['📐','삼각자'],['🍙','삼각김밥'],['⚠️','조심 표지판'],['⛺','텐트 앞모습']],
  '□':[['📒','공책'],['🖼️','액자'],['🪟','창문'],['📕','책'],['✉️','편지 봉투'],['📱','휴대 전화'],['🗓️','달력']],
};
const clockOpts = list => Object.fromEntries(list.map(([lab, h, m]) => [lab, `<span style="display:block;width:100%;max-width:110px;margin:auto">${clockSVG(h, m)}</span>`]));
const hLab = (h, m) => m ? `${h}시 30분` : `${h}시`;
function hundredChart(start, cols, rows, hole){
  let s = '<table class="pv hchart">';
  for (let r = 0; r < rows; r++) { s += '<tr>'; for (let c = 0; c < cols; c++) { const v = start + r * 10 + c; s += `<td>${r === hole[0] && c === hole[1] ? QB : v}</td>`; } s += '</tr>'; }
  return s + '</table>';
}

Object.assign(LESSON_GEN, {
  /* ---------- 1단원 100까지의 수 ---------- */
  'm1-1'(){ const v = rnd(0, 4), t = rnd(6, 9), o = rnd(0, 9), n = t * 10 + o;
    if (v === 0) return nq(`c12:tv${n}`, 'tens', '모두 얼마일까요?', `10개씩 묶음 ${t}개와 낱개 ${o}개는 얼마일까?`, null, n, `10개씩 묶음 ${t}개는 ${t * 10}이에요`, `${t * 10}과 ${numJosa(o, '이면', '면')} ${n}`, tensV(t, o));
    if (v === 1) return nq(`c12:tt${n}`, 'tens', `10개씩 묶음 ${t}개와 낱개 ${o}개는?`, null, null, n, `10개씩 묶음 ${t}개는 ${t * 10}`, `${n}`);
    if (v === 2) { const k = rnd(6, 9) * 10, all = [60, 70, 80, 90]; return cq(`c12:nat${k}`, 'read', `${k}을 우리말로 바르게 읽은 것은?`, `${k}을 우리말로 읽으면?`, eqH(`${k}`), shuffle(all.filter(x => x !== k)).slice(0, 2).map(nativeKo).concat(nativeKo(k)), nativeKo(k), '60 예순, 70 일흔, 80 여든, 90 아흔', `${k} = ${nativeKo(k)}`, { cols:3 }); }
    if (v === 3) return nq(`c12:wn${n}`, 'tens', `'${nativeKo(n)}'${hasBatchim(nativeKo(n)) ? '을' : '를'} 수로 쓰면?`, `${josa(nativeKo(n), '을', '를')} 수로 써 봐요`, `<div class="sent text-q"><span class="big-word">${nativeKo(n)}</span></div>`, n, '예순 60, 일흔 70, 여든 80, 아흔 90', `${nativeKo(n)} = ${n}`);
    return nq(`c12:bn${n}`, 'tens', `${numJosa(n, '은', '는')} 10개씩 묶음이 몇 개일까요?`, null, eqH(`${n}`), t, '앞자리 숫자를 봐요', `${numJosa(n, '은', '는')} 10개씩 묶음 ${t}개와 낱개 ${o}개`); },
  'm1-2'(){ const v = rnd(0, 3);
    if (v === 0) { const n = rnd(51, 98), after = Math.random() < .5; return nq(`c12:nb${n}${after}`, 'order', `${n}보다 1 ${after ? '큰' : '작은'} 수는?`, null, null, after ? n + 1 : n - 1, after ? '바로 뒤의 수예요' : '바로 앞의 수예요', `${n}보다 1 ${after ? '큰' : '작은'} 수는 ${after ? n + 1 : n - 1}`); }
    if (v === 1) { const s = rnd(50, 95), hole = rnd(1, 3), seq = [0, 1, 2, 3, 4].map(i => s + i).filter(x => x <= 100); return nq(`c12:sq${s}h${hole}`, 'order', '수의 순서대로 빈칸에 알맞은 수는?', '수의 순서대로 썼어요. 빈칸에 알맞은 수는?', eqH(seq.map((x, i) => i === hole ? QB : x).join(', '), true), seq[hole], '1씩 커져요', seq.join(', ')); }
    if (v === 2) { const f = pick([['99보다 1 큰 수는?', 100, '99 다음 수예요'], ['10개씩 묶음 10개는 얼마일까요?', 100, '10, 20, 30… 100까지 세어 봐요'], ['100보다 1 작은 수는?', 99, '100 바로 앞의 수예요'], ['90보다 10 큰 수는?', 100, '10개씩 묶음이 하나 늘어요'], ['98보다 2 큰 수는?', 100, '98, 99, 100'], ['100은 10개씩 묶음이 몇 개일까요?', 10, '10이 열 개면 100']]);
      return nq(`c12:h${f[0]}`, 'hundred', f[0], null, null, f[1], f[2], `${f[0]} → ${f[1]}`); }
    const a = rnd(51, 94), b = a + 2; return cq(`c12:bt${a}`, 'order', `${numJosa(a, '과', '와')} ${b} 사이에 있는 수는?`, null, null, [a + 1, a - 1, b + 1], a + 1, '두 수 사이에 있는 수를 차례로 세어 봐요', `${a}, ${a + 1}, ${b}`, { big:true }); },
  'm1-3'(){ const v = rnd(0, 2);
    if (v === 0) { let a = rnd(50, 99), b = rnd(50, 99); while (b === a) b = rnd(50, 99); return cq(`c12:bg${a}-${b}`, 'compare', '더 큰 수를 골라요', '두 수 중에서 더 큰 수는?', null, [a, b], Math.max(a, b), '10개씩 묶음의 수(앞자리)부터 비교해요', `${Math.max(a, b)}이 더 커요`, { cols:2, big:true }); }
    if (v === 1) { const t = rnd(5, 9); let a = t * 10 + rnd(0, 9), b = t * 10 + rnd(0, 9); if (a === b) b = a === t * 10 + 9 ? a - 1 : a + 1;
      return cq(`c12:gl${a}-${b}`, 'compare', '○ 안에 알맞은 것을 골라요', `${a}와 ${b}의 크기를 비교해요`, eqH(`${a} <span class="qbox-inline">○</span> ${b}`, true), ['>', '<'], a > b ? '>' : '<', '앞자리가 같으면 뒷자리(낱개)를 비교해요. 입을 벌린 쪽이 큰 수', `${a} ${a > b ? '>' : '<'} ${b}`, { cols:2, big:true }); }
    const s = new Set(); while (s.size < 3) s.add(rnd(50, 99)); const arr = [...s], small = Math.random() < .5;
    return cq(`c12:m3${arr}${small}`, 'compare', `가장 ${small ? '작은' : '큰'} 수를 골라요`, null, null, arr, small ? Math.min(...arr) : Math.max(...arr), '앞자리부터 차례로 비교해요', `가장 ${small ? '작은' : '큰'} 수는 ${small ? Math.min(...arr) : Math.max(...arr)}`, { big:true }); },
  'm1-4'(){ const v = rnd(0, 3);
    if (v < 2) { const even = v === 0, s = new Set(); const ans = (n => even ? n * 2 : n * 2 + 1)(rnd(1, 24)); s.add(ans); while (s.size < 3) { const x = rnd(1, 49); if ((x % 2 === 0) !== even) s.add(x); }
      return cq(`c12:eo${even}${[...s]}`, 'evenodd', `${even ? '짝수' : '홀수'}를 골라요`, null, null, [...s], ans, '끝자리가 0, 2, 4, 6, 8이면 짝수, 1, 3, 5, 7, 9이면 홀수', `${numJosa(ans, '은', '는')} ${even ? '짝수' : '홀수'}`, { big:true }); }
    if (v === 2) { const n = rnd(4, 18), [e, name] = pick(COUNT_THINGS); return cq(`c12:eoc${e}${n}`, 'evenodd', `${name}의 수는 짝수일까요, 홀수일까요?`, `${josa(name, '을', '를')} 둘씩 짝 지어 봐요. 짝수일까 홀수일까?`, null, ['짝수', '홀수'], n % 2 ? '홀수' : '짝수', '둘씩 짝을 지어서 남는 것이 없으면 짝수예요', `${n}개 → ${n % 2 ? '홀수' : '짝수'}`, { cols:2, vis:{ k:'count', e, n } }); }
    const st = pickOX([['2, 4, 6, 8, 10은 짝수예요.','O'],['1, 3, 5, 7, 9는 홀수예요.','O'],['둘씩 짝을 지을 때 하나가 남으면 짝수예요.','X'],['15는 짝수예요.','X'],['20은 짝수예요.','O'],['홀수는 둘씩 짝을 지으면 하나가 남아요.','O'],['13은 홀수예요.','O'],['짝수 바로 다음 수는 짝수예요.','X']]);
    return ox(`c12:oxeo${st[0]}`, st[0], st[1], '둘씩 짝 지어 남는 것이 없으면 짝수, 하나 남으면 홀수', `${st[0]} → ${st[1]}`); },
  'm1-5'(){ const v = rnd(0, 2);
    if (v === 0) { const ds = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3), big = Math.random() < .6, s = [...ds].sort((a, b) => b - a), ans = big ? s[0] * 10 + s[1] : s[2] * 10 + s[1];
      return nq(`c12:card${ds}${big}`, 'cards', `수 카드 2장으로 가장 ${big ? '큰' : '작은'} 몇십몇을 만들어요`, `수 카드 ${ds.join(', ')} 중 두 장으로 가장 ${big ? '큰' : '작은'} 수를 만들어 봐요`, `<div class="row" style="justify-content:center;gap:10px">${ds.map(d => `<span class="num-card">${d}</span>`).join('')}</div>`, ans, big ? '가장 큰 수를 10개씩 묶음 자리에 놓아요' : '가장 작은 수를 10개씩 묶음 자리에 놓아요', `${ans}`); }
    if (v === 1) { const a = rnd(50, 90), b = a + rnd(3, 7); return nq(`c12:btw${a}-${b}`, 'order', `${a}보다 크고 ${b}보다 작은 수는 모두 몇 개일까요?`, null, null, b - a - 1, `${a + 1}부터 ${b - 1}까지 세어 봐요`, `${Array.from({ length:b - a - 1 }, (_, i) => a + 1 + i).join(', ')} → ${b - a - 1}개`); }
    const n = rnd(55, 95), even = n % 2 === 0, wt = n % 10 === Math.floor(n / 10) || n % 10 === 0 ? Math.floor(n / 10) + 1 : n % 10; return cq(`c12:mix${n}`, 'evenodd', `${n}에 대해 바르게 말한 것은?`, null, eqH(`${n}`), [`${even ? '짝수' : '홀수'}예요`, `${even ? '홀수' : '짝수'}예요`, `10개씩 묶음이 ${wt}개예요`], `${even ? '짝수' : '홀수'}예요`, '끝자리 숫자를 봐요', `${numJosa(n, '은', '는')} ${even ? '짝수' : '홀수'}, 10개씩 묶음 ${Math.floor(n / 10)}개`, { cols:1 }); },

  /* ---------- 2단원 덧셈과 뺄셈 (1) ---------- */
  'm2-1'(){ let a, b, c; do { a = rnd(1, 6); b = rnd(1, 5); c = rnd(1, 5); } while (a + b + c > 9);
    if (Math.random() < .3) { const [e, name] = pick(FOODS); return nq(`c12:3sw${a}${b}${c}${e}`, 'three', `${josa(name, '이', '가')} 접시 세 개에 ${a}개, ${b}개, ${c}개 있어요. 모두 몇 개일까요?`, null, eqH(`${e.repeat(a)} ${e.repeat(b)} ${e.repeat(c)}`), a + b + c, '두 수를 먼저 더하고, 그 답에 나머지 수를 더해요', `${a} + ${b} + ${c} = ${a + b + c}`); }
    return nq(`c12:3a${a}+${b}+${c}`, 'three', '세 수를 더해요', `${a} 더하기 ${b} 더하기 ${c}는?`, eqH(`${a} + ${b} + ${c} = ${QB}`), a + b + c, `앞의 두 수부터 더해요. ${a} + ${b} = ${a + b}`, `${a} + ${b} = ${a + b}, ${a + b} + ${c} = ${a + b + c}`, { hintHTML:framesHTML(cellsFor(a + b, c)) }); },
  'm2-2'(){ const v = rnd(0, 2);
    if (v === 0) { let a, b, c; do { a = rnd(5, 9); b = rnd(1, 4); c = rnd(1, 4); } while (a - b - c < 0); return nq(`c12:3s${a}-${b}-${c}`, 'three', '세 수를 계산해요', `${a} 빼기 ${b} 빼기 ${c}는?`, eqH(`${a} − ${b} − ${c} = ${QB}`), a - b - c, `앞에서부터 차례로 빼요. ${a} − ${b} = ${a - b}`, `${a} − ${b} = ${a - b}, ${a - b} − ${c} = ${a - b - c}`); }
    if (v === 1) { let a, b, c; do { a = rnd(1, 6); b = rnd(1, 5); c = rnd(1, 7); } while (a + b > 9 || a + b - c < 0); return nq(`c12:3m${a}+${b}-${c}`, 'three', '세 수를 계산해요', `${a} 더하기 ${b} 빼기 ${c}는?`, eqH(`${a} + ${b} − ${c} = ${QB}`), a + b - c, `앞에서부터 차례로. ${a} + ${b} = ${a + b}`, `${a} + ${b} = ${a + b}, ${a + b} − ${c} = ${a + b - c}`); }
    let a, b, c; do { a = rnd(6, 9); b = rnd(1, 3); c = rnd(1, 3); } while (a - b - c < 1);
    const [st, unit] = pick([[`풍선 ${a}개 중에서 ${b}개가 터지고, ${c}개가 날아갔어요. 남은 풍선은 몇 개일까요?`, '개'], [`색종이 ${a}장 중에서 언니가 ${b}장, 내가 ${c}장 썼어요. 남은 색종이는 몇 장일까요?`, '장'], [`쿠키 ${a}개 중에서 아빠가 ${b}개, 엄마가 ${c}개 먹었어요. 남은 쿠키는 몇 개일까요?`, '개']]);
    return nq(`c12:3st${st}`, 'three', '이야기를 읽고 답해요', st, storyH(st), a - b - c, '두 번 빼요', `${a} − ${b} − ${c} = ${a - b - c}${unit}`); },
  'm2-3'(){ const v = rnd(0, 2), a = rnd(1, 9);
    if (v === 0) return nq(`c12:m10${a}`, 'make10', '10이 되려면 얼마를 더해야 할까요?', null, eqH(`${a} + ${QB} = 10`), 10 - a, '빈칸이 몇 개인지 세어 봐요', `${a} + ${10 - a} = 10`, { hintHTML:framesHTML(cellsFor(a)) });
    if (v === 1) return nq(`c12:j10${a}`, 'make10', `${numJosa(a, '과', '와')} 모아서 10이 되는 수는?`, null, null, 10 - a, '손가락 10개를 떠올려 봐요', `${numJosa(a, '과', '와')} ${numJosa(10 - a, '을', '를')} 모으면 10`, { vis:{ k:'split', top:10, l:a, r:'?' } });
    const right = `${a} + ${10 - a}`, w = new Set(); while (w.size < 2) { const x = rnd(1, 9), y = rnd(1, 9); if (x + y !== 10) w.add(`${x} + ${y}`); }
    return cq(`c12:p10${a}`, 'make10', '합이 10이 되는 것을 골라요', null, null, [right, ...w], right, '하나씩 더해 봐요', `${right} = 10`, { cols:1 }); },
  'm2-4'(){ const v = rnd(0, 2), b = rnd(1, 9);
    if (v === 0) return nq(`c12:s10${b}`, 'from10', '뺄셈을 해요', `10 빼기 ${b}는?`, eqH(`10 − ${b} = ${QB}`), 10 - b, `10개 중에서 ${b}개를 지우고 남은 것을 세어요`, `10 − ${b} = ${10 - b}`, { hintHTML:framesHTML(cellsFor(10, 0, b)) });
    if (v === 1) return nq(`c12:s10q${b}`, 'from10', '□에 알맞은 수는?', `10 빼기 네모는 ${10 - b}`, eqH(`10 − ${QB} = ${10 - b}`), b, `${10 - b}에 얼마를 더하면 10이 될까요?`, `10 − ${b} = ${10 - b}`);
    const [e, name] = pick(FOODS); return nq(`c12:s10w${b}${e}`, 'from10', `${josa(name, '이', '가')} 10개 있었는데 ${b}개를 먹었어요. 남은 것은 몇 개일까요?`, null, eqH(e.repeat(5) + '<br>' + e.repeat(5)), 10 - b, '10에서 빼요', `10 − ${b} = ${10 - b}`); },
  'm2-5'(){ const v = rnd(0, 2);
    if (v < 2) { const q = M.three(); return Object.assign(q, { key:'c12:' + q.key, subj:'math', prompt:'10을 만들어 세 수를 더해요', vis:{ k:'html', html:eqH(q.vis.html) } }); }
    const a = rnd(1, 9), c = rnd(1, 9); return nq(`c12:m10b${a}-${c}`, 'three', '□에 알맞은 수는?', `${a} 더하기 네모 더하기 ${c}는 ${10 + c}`, eqH(`${a} + ${QB} + ${c} = ${10 + c}`), 10 - a, `${numJosa(a, '과', '와')} 더해서 10이 되는 수를 찾아요`, `${a} + ${10 - a} = 10, 10 + ${c} = ${10 + c}`); },

  /* ---------- 3단원 모양과 시각 ---------- */
  'm3-1'(){ const sh = pick(Object.keys(SHAPE3)), [e, name] = pick(SHAPE_THINGS[sh]);
    if (Math.random() < .7) return cq(`c12:sh${name}`, 'shape3', `${josa(name, '은', '는')} 어떤 모양일까요?`, `${name}의 앞모습은 어떤 모양일까?`, `<div class="pic">${e}</div><div class="muted">${esc(name)}</div>`, Object.keys(SHAPE3), sh, '테두리를 손가락으로 따라 그려 봐요', `${name} → ${sh} 모양`, { pic:true, optHtml:shape3Opts() });
    const others = Object.keys(SHAPE3).filter(x => x !== sh).map(x => pick(SHAPE_THINGS[x])[1]);
    return cq(`c12:shf${sh}${name}`, 'shape3', `${sh} 모양인 물건을 골라요`, `${sh === '○' ? '동그라미' : sh === '△' ? '세모' : '네모'} 모양인 물건을 골라 봐요`, `<div style="width:96px;margin:auto">${shapeSVG(SHAPE3[sh], 96)}</div>`, [name, ...others], name, '물건의 테두리를 떠올려 봐요', `${josa(name, '은', '는')} ${sh} 모양`, { cols:1 }); },
  'm3-2'(){ const v = rnd(0, 3);
    if (v === 3) { const sh = pick(['△', '□']), k = rnd(2, 4), per = sh === '△' ? 3 : 4, what = pick(['뾰족한 곳', '곧은 선']);
      return nq(`c12:fsum${sh}${k}${what}`, 'shape3', `${sh} 모양 ${k}개의 ${josa(what, '은', '는')} 모두 몇 개일까요?`, null, `<div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap">${Array.from({ length:k }, () => shapeSVG(SHAPE3[sh], 96, { marks: what === '뾰족한 곳' })).join('')}</div>`, per * k, `${sh} 모양 하나에 ${what} ${per}개. ${Array(k).fill(per).join(' + ')}`, `${Array(k).fill(per).join(' + ')} = ${per * k}`); }
    if (v === 0) { const [p, a, h] = pick([['뾰족한 곳이 없는 모양은?', '○', '둥근 부분만 있어요'], ['뾰족한 곳이 3군데인 모양은?', '△', '뾰족한 곳을 세어 봐요'], ['뾰족한 곳이 4군데인 모양은?', '□', '뾰족한 곳을 세어 봐요'], ['곧은 선이 없는 모양은?', '○', '둥근 선만 있어요'], ['곧은 선이 3개인 모양은?', '△', '곧은 선을 세어 봐요'], ['곧은 선이 4개인 모양은?', '□', '곧은 선을 세어 봐요'], ['굴리면 잘 굴러가는 모양은?', '○', '둥근 모양이 잘 굴러가요']]);
      return cq(`c12:ft${p}`, 'shape3', p, null, null, Object.keys(SHAPE3), a, h, `${p} → ${a} 모양`, { pic:true, optHtml:shape3Opts() }); }
    if (v === 1) { const [sh, what, n] = pick([['△', '뾰족한 곳', 3], ['□', '뾰족한 곳', 4], ['△', '곧은 선', 3], ['□', '곧은 선', 4], ['○', '뾰족한 곳', 0], ['○', '곧은 선', 0]]);
      return nq(`c12:fc${sh}${what}`, 'shape3', `${sh} 모양에서 ${josa(what, '은', '는')} 몇 개일까요?`, `이 모양에서 ${what}은 몇 개일까?`, `<div style="width:150px;margin:auto">${shapeSVG(SHAPE3[sh], 150, { marks: what === '뾰족한 곳' && n > 0 })}</div>`, n, '손가락으로 짚으며 세어 봐요', `${sh} 모양: ${what} ${n}개`); }
    const st = pickOX([['○ 모양에는 뾰족한 곳이 없어요.','O'],['△ 모양에는 곧은 선이 4개 있어요.','X'],['□ 모양에는 뾰족한 곳이 4군데 있어요.','O'],['○ 모양은 곧은 선으로 되어 있어요.','X'],['△ 모양에는 뾰족한 곳이 3군데 있어요.','O'],['□ 모양과 △ 모양에는 둥근 부분이 있어요.','X']]);
    return ox(`c12:oxsh${st[0]}`, st[0], st[1], '○ 둥근 부분, △ 뾰족한 곳 3, □ 뾰족한 곳 4', `${st[0]} → ${st[1]}`); },
  'm3-3'(){ const items = classifySet(), counts = { '○':0, '△':0, '□':0 }; items.forEach(i => counts[{ circ:'○', tri1:'△', quad2:'□' }[i.s]]++);
    if (Math.random() < .55) { const sh = pick(Object.keys(counts)); return nq(`c12:cs${items.map(i => i.s[0]).join('')}${sh}`, 'shape3', `${sh} 모양은 몇 개일까요?`, `그림에서 ${sh === '○' ? '동그라미' : sh === '△' ? '세모' : '네모'} 모양은 몇 개일까?`, classifyHTML(items), counts[sh], '센 모양에 하나씩 표시하며 세어 봐요', `${sh} 모양 ${counts[sh]}개`); }
    const max = Math.max(...Object.values(counts)); if (Object.values(counts).filter(x => x === max).length > 1) return LESSON_GEN['m3-3']();
    const best = Object.keys(counts).find(k => counts[k] === max);
    return cq(`c12:cm${items.map(i => i.s[0]).join('')}`, 'shape3', '가장 많이 있는 모양은?', null, classifyHTML(items), Object.keys(SHAPE3), best, '모양별로 나누어 세어 봐요', `○ ${counts['○']}개, △ ${counts['△']}개, □ ${counts['□']}개`, { pic:true, optHtml:shape3Opts() }); },
  'm3-4'(){ const h = rnd(1, 12), v = rnd(0, 2);
    if (v === 0) { const c = new Set([hLab(h, 0)]); for (const x of shuffle([h % 12 + 1, h === 1 ? 12 : h - 1, (h + 5) % 12 + 1])) { if (c.size < 3) c.add(hLab(x, 0)); } return cq(`c12:ck${h}`, 'clock', '시계가 나타내는 시각은?', null, null, [...c], hLab(h, 0), '긴바늘이 12를 가리키면 "몇 시"예요. 짧은바늘이 가리키는 숫자를 읽어요', `${h}시`, { vis:{ k:'clock', h, m:0 } }); }
    if (v === 1) return nq(`c12:ckn${h}`, 'clock', '시계는 몇 시일까요?', null, null, h, '짧은바늘이 가리키는 숫자를 봐요', `${h}시`, { vis:{ k:'clock', h, m:0 } });
    const w = shuffle([h % 12 + 1, (h + 3) % 12 + 1]); return cq(`c12:cko${h}`, 'clock', `${h}시를 나타내는 시계를 골라요`, null, null, [hLab(h, 0), hLab(w[0], 0), hLab(w[1], 0)], hLab(h, 0), `짧은바늘이 ${h}, 긴바늘이 12를 가리켜요`, `${h}시`, { pic:true, grid3:true, cols:3, optHtml:clockOpts([[hLab(h, 0), h, 0], [hLab(w[0], 0), w[0], 0], [hLab(w[1], 0), w[1], 0]]) }); },
  'm3-5'(){ const h = rnd(1, 12), v = rnd(0, 3), nh = h % 12 + 1;
    if (v === 0) { const right = hLab(h, 30), c = new Set([right]); for (const x of shuffle([hLab(nh, 30), hLab(h, 0), hLab(nh, 0), hLab(h === 1 ? 12 : h - 1, 30)])) { if (c.size < 3) c.add(x); }
      return cq(`c12:ch${h}`, 'clock', '시계가 나타내는 시각은?', null, null, [...c], right, '긴바늘이 6을 가리키면 30분이에요. 짧은바늘은 두 숫자 사이에 있어요. 앞의 숫자를 읽어요', right, { vis:{ k:'clock', h, m:30 } }); }
    if (v === 1) { const w1 = hLab(nh, 30), w2 = hLab(h, 0); return cq(`c12:cho${h}`, 'clock', `${h}시 30분을 나타내는 시계를 골라요`, null, null, [hLab(h, 30), w1, w2], hLab(h, 30), `긴바늘이 6, 짧은바늘이 ${numJosa(h, '과', '와')} ${nh} 사이`, `${h}시 30분`, { pic:true, grid3:true, cols:3, optHtml:clockOpts([[hLab(h, 30), h, 30], [w1, nh, 30], [w2, h, 0]]) }); }
    if (v === 2) return nq(`c12:cht${h}`, 'clock', `짧은바늘이 ${numJosa(h, '과', '와')} ${nh} 사이, 긴바늘이 6을 가리켜요. 몇 시 30분일까요?`, null, eqH(`${QB}시 30분`), h, '짧은바늘이 지나온 숫자(앞의 숫자)를 읽어요', `${h}시 30분`);
    const m = pick([0, 30]); return cq(`c12:chm${h}${m}`, 'clock', '긴바늘이 가리키는 숫자는?', `${hLab(h, m)}에는 긴바늘이 어디를 가리킬까?`, eqH(hLab(h, m), true), ['12', '6', String(h === 6 || h === 12 ? 3 : h)], m ? '6' : '12', '"몇 시"는 12, "몇 시 30분"은 6', `${hLab(h, m)} → 긴바늘 ${m ? 6 : 12}`, { cols:3, big:true }); },

  /* ---------- 4단원 덧셈과 뺄셈 (2) ---------- */
  'm4-1'(){ let a, b; do { a = rnd(2, 9); b = rnd(2, 9); } while (a + b < 11);
    if (Math.random() < .25) { const [e, name] = pick(FOODS); return nq(`c12:4aw${a}+${b}${e}`, 'add', `${josa(name, '이', '가')} ${a}개 있는데 ${b}개를 더 받았어요. 모두 몇 개일까요?`, null, null, a + b, `10을 먼저 만들어요. ${a} + ${10 - a} = 10`, `${a} + ${b} = ${a + b}`); }
    return nq(`c12:4a${a}+${b}`, 'add', '덧셈을 해요', `${a} 더하기 ${b}는?`, eqH(`${a} + ${b} = ${QB}`), a + b, `${a}에 ${numJosa(10 - a, '을', '를')} 더하면 10, 남은 ${numJosa(b - (10 - a), '을', '를')} 더 더해요`, `${a} + ${b} = ${a + b}`, { hintHTML:framesHTML(cellsFor(a, b)) }); },
  'm4-2'(){ let a, b; do { a = rnd(5, 9); b = rnd(3, 9); } while (a + b < 11); const k = 10 - a, r = b - k;
    if (Math.random() < .5) return nq(`c12:4g${a}+${b}`, 'make10add', '10을 만들어 더해요. □에 알맞은 수는?', `${a} 더하기 ${b}. ${numJosa(b, '을', '를')} ${numJosa(k, '과', '와')} 몇으로 가르기 할까?`, null, r, `${numJosa(a, '이', '가')} 10이 되려면 ${numJosa(k, '이', '가')} 필요해요. ${b}에서 ${numJosa(k, '을', '를')} 빼면?`, `${b} = ${k} + ${r}, 10 + ${r} = ${a + b}`, { vis:{ k:'html', html:eqH(`${a} + ${b} = ${a} + ${k} + ${QB}`, true) } });
    return nq(`c12:4g2${a}+${b}`, 'make10add', '□에 알맞은 수는?', `${a} 더하기 ${b}는 10 더하기 네모`, eqH(`${a} + ${b} = 10 + ${QB}`, true), r, `${a}에 ${numJosa(k, '을', '를')} 주면 10이 돼요. ${b}에는 몇이 남을까요?`, `${a} + ${b} = 10 + ${r} = ${a + b}`); },
  'm4-3'(){ const v = rnd(0, 2);
    if (v === 0) { const a = rnd(4, 9), b = rnd(3, 6), seq = [0, 1, 2].map(i => `${a} + ${b + i} = ${a + b + i}`); return nq(`c12:4p${a}+${b}`, 'addpattern', '규칙을 찾아 □에 알맞은 수를 써요', `${a} 더하기 ${b}부터 하나씩 커져요. 네모는?`, eqH(`${seq.join('<br>')}<br>${a} + ${b + 3} = ${QB}`, true), a + b + 3, '더하는 수가 1 커지면 합도 1 커져요', `${a} + ${b + 3} = ${a + b + 3}`); }
    if (v === 1) { let a, b, c, d; do { a = rnd(3, 9); b = rnd(3, 9); c = rnd(3, 9); d = rnd(3, 9); } while (a + b === c + d || a + b < 10 || c + d < 10 || (a === c && b === d));
      const x = `${a} + ${b}`, y = `${c} + ${d}`; return cq(`c12:4cmp${x}${y}`, 'addcompare', '합이 더 큰 것을 골라요', null, null, [x, y], a + b > c + d ? x : y, '두 식을 각각 계산해 봐요', `${x} = ${a + b}, ${y} = ${c + d}`, { cols:2, big:true }); }
    const s = rnd(11, 15), list = []; for (let a = 2; a <= 9; a++) { const b = s - a; if (b >= 2 && b <= 9) list.push(`${a} + ${b}`); }
    const right = pick(list), w = new Set(); while (w.size < 2) { const a = rnd(2, 9), b = rnd(2, 9); if (a + b !== s) w.add(`${a} + ${b}`); }
    return cq(`c12:4same${s}${right}`, 'addcompare', `합이 ${s}인 것을 골라요`, null, null, [right, ...w], right, '하나씩 계산해 봐요', `${right} = ${s}`, { cols:1 }); },
  'm4-4'(){ let a, b; do { a = rnd(11, 18); b = rnd(2, 9); } while (b <= a % 10 || a - b > 9);
    if (Math.random() < .25) { const [e, name] = pick(FOODS); return nq(`c12:4sw${a}-${b}${e}`, 'sub', `${josa(name, '이', '가')} ${a}개 있었는데 ${b}개를 친구에게 주었어요. 남은 것은 몇 개일까요?`, null, null, a - b, `${a}에서 ${numJosa(a - 10, '을', '를')} 먼저 빼면 10, 그다음 10에서 남은 수를 빼요`, `${a} − ${b} = ${a - b}`); }
    return nq(`c12:4s${a}-${b}`, 'sub', '뺄셈을 해요', `${a} 빼기 ${b}는?`, eqH(`${a} − ${b} = ${QB}`), a - b, `${a}에서 ${numJosa(a - 10, '을', '를')} 빼면 10, 10에서 ${numJosa(b - (a - 10), '을', '를')} 더 빼요`, `${a} − ${b} = ${a - b}`, { hintHTML:framesHTML(cellsFor(a, 0, b)) }); },
  'm4-5'(){ let a, b; do { a = rnd(11, 18); b = rnd(2, 9); } while (b <= a % 10 || a - b > 9); const o = a - 10, r = b - o;
    if (Math.random() < .5) return nq(`c12:4sg${a}-${b}`, 'sub10', '□에 알맞은 수는?', `${a} 빼기 ${b}. ${numJosa(b, '을', '를')} ${numJosa(o, '과', '와')} 몇으로 가르기 할까?`, eqH(`${a} − ${b} = ${a} − ${o} − ${QB}`, true), r, `먼저 ${a}에서 ${numJosa(o, '을', '를')} 빼서 10을 만들어요`, `${a} − ${o} = 10, 10 − ${r} = ${a - b}`);
    return nq(`c12:4st${a}-${b}`, 'sub10', '10에서 먼저 빼요. □에 알맞은 수는?', `${numJosa(a, '을', '를')} 10과 ${o}${numRo(o)} 가르고, 10에서 ${numJosa(b, '을', '를')} 빼면 ${10 - b}. ${10 - b} 더하기 ${o}는?`, eqH(`10 − ${b} = ${10 - b}<br>${10 - b} + ${o} = ${QB}`, true), 10 - b + o, `${numJosa(a, '은', '는')} 10과 ${o}. 10에서 빼고 남은 ${numJosa(o, '을', '를')} 더해요`, `${a} − ${b} = ${a - b}`); },
  'm4-6'(){ const v = rnd(0, 2);
    if (v === 0) { const a = rnd(12, 14), bb = a - 9 + rnd(0, 1), seq = [0, 1, 2].map(i => `${a} − ${bb + i} = ${a - bb - i}`);
      return nq(`c12:4sp${a}-${bb}`, 'subpattern', '규칙을 찾아 □에 알맞은 수를 써요', `${a}에서 빼는 수가 하나씩 커져요. 네모는?`, eqH(`${seq.join('<br>')}<br>${a} − ${bb + 3} = ${QB}`, true), a - bb - 3, '빼는 수가 1 커지면 차는 1 작아져요', `${a} − ${bb + 3} = ${a - bb - 3}`); }
    if (v === 1) { let a, b, c, d; do { a = rnd(11, 18); b = rnd(2, 9); c = rnd(11, 18); d = rnd(2, 9); } while (a - b === c - d || a - b < 2 || c - d < 2 || a - b > 9 || c - d > 9 || b <= a % 10 || d <= c % 10);
      const x = `${a} − ${b}`, y = `${c} − ${d}`; return cq(`c12:4dc${x}${y}`, 'subcompare', '차가 더 큰 것을 골라요', null, null, [x, y], a - b > c - d ? x : y, '두 식을 각각 계산해 봐요', `${x} = ${a - b}, ${y} = ${c - d}`, { cols:2, big:true }); }
    const d = rnd(4, 9), list = []; for (let a = 11; a <= 18; a++) { const b = a - d; if (b >= 2 && b <= 9 && b > a % 10) list.push(`${a} − ${b}`); }
    if (!list.length) return LESSON_GEN['m4-6']();
    const right = pick(list), w = new Set(); while (w.size < 2) { const a = rnd(11, 18), b = rnd(2, 9); if (a - b !== d && a - b > 0 && a - b < 10) w.add(`${a} − ${b}`); }
    return cq(`c12:4ds${d}${right}`, 'subcompare', `차가 ${d}인 것을 골라요`, null, null, [right, ...w], right, '하나씩 계산해 봐요', `${right} = ${d}`, { cols:1 }); },

  /* ---------- 5단원 규칙 찾기 ---------- */
  'm5-1'(){ const pool = shuffle(['🍓','🍌','⭐','🌸','🐰','🍇','💖','🌙','🐥','🍩']), kind = pick(['AB','ABC','AAB','ABB','AABB']);
    const unit = kind.split('').map(ch => pool['ABC'.indexOf(ch)]), seq = []; while (seq.length < 9) seq.push(unit[seq.length % unit.length]);
    const cut = rnd(6, 8), ans = seq[cut];
    if (Math.random() < .7) { const opts = [...new Set([...unit, pool[3]])].slice(0, 3); if (!opts.includes(ans)) opts[0] = ans;
      return { key:`c12:pt${seq.slice(0, cut + 1).join('')}`, subj:'math', type:'pattern', prompt:'규칙을 찾아 ?에 알맞은 것을 골라요', say:'규칙을 찾아서 다음에 올 것을 골라 봐요', vis:{ k:'pattern', items:seq.slice(0, cut) }, input:'choice', cols:3, pic:true, optHtml:Object.fromEntries(opts.map(o => [o, `<span style="font-size:44px">${o}</span>`])), opts:shuffle(opts), ans, hint:`'${unit.join(' ')}'가 되풀이돼요`, explain:`${unit.join(' ')}이 반복돼요` }; }
    const right = unit.join(''), wrongs = new Set(); [unit.concat(unit[0]).join(''), unit.slice(0, -1).join(''), unit.concat(unit[unit.length - 1]).join(''), pool[3] + unit[0]].forEach(x => { if (x && x !== right && wrongs.size < 2) wrongs.add(x); });
    return cq(`c12:ptu${right}`, 'pattern', '되풀이되는 부분을 골라요', '무늬에서 되풀이되는 부분은 어디일까?', `<div class="pattern">${seq.slice(0, 8).map(e => `<span>${e}</span>`).join('')}</div>`, [right, ...[...wrongs].slice(0, 2)], right, '처음부터 몇 개씩 반복되는지 찾아요', `${right}가 되풀이돼요`, { cols:1, big:true }); },
  'm5-2'(){ const pool = shuffle(['🍎','🍌','🔵','🔺','⭐','🐶']), kind = pick(['AB','AAB','ABB','ABC']);
    const unit = kind.split('').map(ch => 'ABC'.indexOf(ch)), seq = []; while (seq.length < 8) seq.push(unit[seq.length % unit.length]);
    const nums = [1, 2, 3], show = seq.map(i => pool[i]), code = seq.map(i => nums[i]), hole = rnd(5, 7);
    const legend = [...new Set(unit)].map(i => `${pool[i]} = ${nums[i]}`).join(', ');
    return nq(`c12:pn${show.join('')}${hole}`, 'pattern2', '규칙을 수로 나타냈어요. ?에 알맞은 수는?', `그림을 수로 바꾸어 나타냈어요. 빈칸에 알맞은 수는?`, `<div class="pattern">${show.map(e => `<span>${e}</span>`).join('')}</div><div class="muted" style="text-align:center">${legend}</div>` + `<div class="sent text-q" style="font-family:Jua,sans-serif;font-size:34px">${code.map((x, i) => i === hole ? QB : x).slice(0, hole + 1).join(', ')}</div>`, code[hole], `${legend}로 바꾸어 봐요`, code.join(', ')); },
  'm5-3'(){ const v = rnd(0, 2), step = pick([1, 2, 5, 10]), down = Math.random() < .35;
    const start = down ? rnd(Math.max(30, step * 4 + 5), 99) : rnd(1, 99 - step * 4), seq = [0, 1, 2, 3, 4].map(i => start + (down ? -step : step) * i);
    if (v < 2) { const hole = rnd(2, 4); return nq(`c12:ns${start}${down ? '-' : '+'}${step}h${hole}`, 'npattern', '규칙을 찾아 빈칸에 알맞은 수를 써요', '수의 규칙을 찾아서 빈칸에 알맞은 수를 써 봐요', eqH(seq.map((x, i) => i === hole ? QB : x).join(', '), true), seq[hole], `수가 ${step}씩 ${down ? '작아져요' : '커져요'}`, seq.join(', ')); }
    return nq(`c12:nst${start}${down}${step}`, 'npattern', `몇씩 ${down ? '작아지는' : '커지는'} 규칙일까요?`, null, eqH(seq.join(', '), true), step, '이웃한 두 수의 차이를 봐요', `${step}씩 ${down ? '작아져요' : '커져요'}`); },
  'm5-4'(){ const v = rnd(0, 2), r0 = rnd(0, 5), c0 = rnd(1, 5), start = r0 * 10 + c0, hole = [rnd(0, 3), rnd(0, 4)], val = start + hole[0] * 10 + hole[1];
    if (v < 2) return nq(`c12:hc${start}h${hole}`, 'chart', '수 배열표에서 ?에 알맞은 수는?', '수 배열표의 일부예요. 물음표에 알맞은 수는?', hundredChart(start, 5, 4, hole), val, '→ 쪽으로 1씩, ↓ 쪽으로 10씩 커져요', `${val}`);
    const [p, a, h] = pick([['수 배열표에서 → 방향으로 가면 몇씩 커질까요?', 1, '옆으로 한 칸 가 봐요'], ['수 배열표에서 ↓ 방향으로 가면 몇씩 커질까요?', 10, '아래로 한 칸 가 봐요'], ['수 배열표에서 ↘ 방향으로 가면 몇씩 커질까요?', 11, '아래로 10, 옆으로 1']]);
    return nq(`c12:hcd${p}`, 'chart', p, null, hundredChart(start, 5, 4, [-1, -1]), a, h, `${a}씩 커져요`); },

  /* ---------- 6단원 덧셈과 뺄셈 (3) ---------- */
  'm6-1'(){ let a, b; do { a = rnd(11, 88); b = rnd(1, 8); } while ((a % 10) + b > 9 || a % 10 === 0 && Math.random() < .5);
    if (Math.random() < .3) return nq(`c12:6at${a}+${b}`, 'add2', '모두 얼마일까요?', `${a} 더하기 ${b}는?`, null, a + b, '낱개끼리 더해요', `${a} + ${b} = ${a + b}`, { vis:{ k:'html', html:`<div class="tens">${Array.from({ length:Math.floor(a / 10) }, () => `<span class="ten-bar">${'<i></i>'.repeat(10)}</span>`).join('')}<span class="ones">${'<i class="one-dot"></i>'.repeat(a % 10)}</span><span class="ones" style="opacity:.6">${'<i class="one-dot"></i>'.repeat(b)}</span></div>` + eqH(`${a} + ${b} = ${QB}`) } });
    return nq(`c12:6a${a}+${b}`, 'add2', '덧셈을 해요', `${a} 더하기 ${b}는?`, eqH(`${a} + ${b} = ${QB}`), a + b, `낱개끼리 더해요. ${a % 10} + ${b} = ${a % 10 + b}. 10개씩 묶음은 그대로`, `${a} + ${b} = ${a + b}`); },
  'm6-2'(){ let a, b; if (Math.random() < .35) { a = rnd(1, 8) * 10; b = rnd(1, 9 - a / 10) * 10; } else { do { a = rnd(11, 78); b = rnd(11, 78); } while ((a % 10) + (b % 10) > 9 || a + b > 99); }
    return nq(`c12:6b${a}+${b}`, 'add2', '덧셈을 해요', `${a} 더하기 ${b}는?`, eqH(`${a} + ${b} = ${QB}`), a + b, `낱개는 낱개끼리 ${a % 10} + ${b % 10}, 10개씩 묶음은 묶음끼리 ${Math.floor(a / 10)} + ${Math.floor(b / 10)}`, `${a} + ${b} = ${a + b}`); },
  'm6-3'(){ let a, b; do { a = rnd(12, 99); b = rnd(1, 9); } while (b > a % 10);
    return nq(`c12:6c${a}-${b}`, 'sub2', '뺄셈을 해요', `${a} 빼기 ${b}는?`, eqH(`${a} − ${b} = ${QB}`), a - b, `낱개끼리 빼요. ${a % 10} − ${b} = ${a % 10 - b}. 10개씩 묶음은 그대로`, `${a} − ${b} = ${a - b}`); },
  'm6-4'(){ let a, b; if (Math.random() < .35) { a = rnd(2, 9) * 10; b = rnd(1, a / 10 - 1) * 10; } else { do { a = rnd(21, 99); b = rnd(11, a - 10); } while ((b % 10) > (a % 10)); }
    return nq(`c12:6d${a}-${b}`, 'sub2', '뺄셈을 해요', `${a} 빼기 ${b}는?`, eqH(`${a} − ${b} = ${QB}`), a - b, `낱개끼리 ${a % 10} − ${b % 10}, 10개씩 묶음끼리 ${Math.floor(a / 10)} − ${Math.floor(b / 10)}`, `${a} − ${b} = ${a - b}`); },
  'm6-5'(){ const add = Math.random() < .5; let a, b;
    if (add) { do { a = rnd(11, 60); b = rnd(11, 38); } while ((a % 10) + (b % 10) > 9 || a + b > 99); } else { do { a = rnd(25, 99); b = rnd(11, a - 10); } while ((b % 10) > (a % 10)); }
    const st = add ? pick([`줄넘기를 오전에 ${a}번, 오후에 ${b}번 했어요. 모두 몇 번 했을까요?`, `색종이가 ${a}장 있는데 ${b}장을 더 샀어요. 모두 몇 장일까요?`, `빨간 구슬 ${a}개와 파란 구슬 ${b}개가 있어요. 구슬은 모두 몇 개일까요?`])
      : pick([`사탕 ${a}개 중에서 ${b}개를 친구들에게 나누어 주었어요. 남은 사탕은 몇 개일까요?`, `나는 동화책을 ${a}쪽까지 읽었고, 언니는 ${b}쪽까지 읽었어요. 내가 몇 쪽 더 읽었을까요?`, `운동장에 ${a}명이 있었는데 ${b}명이 교실로 들어갔어요. 운동장에 남은 사람은 몇 명일까요?`]);
    if (Math.random() < .4) { const right = add ? `${a} + ${b}` : `${a} − ${b}`, w = add ? [`${a} − ${b}`, `${a} + ${b + 10}`] : [`${a} + ${b}`, `${a} − ${b - 10}`]; return cq(`c12:6so${st}`, 'story2', '알맞은 식을 골라요', st + ' 알맞은 식은?', storyH(st), [right, ...w], right, add ? '"모두", "더"는 더하기예요' : '"남은", "더 많이"는 빼기예요', `${right} = ${add ? a + b : a - b}`, { cols:1 }); }
    return nq(`c12:6st${st}`, 'story2', '이야기를 읽고 답해요', st, storyH(st), add ? a + b : a - b, add ? '"모두"는 더하기' : '"남은", "더 많이"는 빼기', `${a} ${add ? '+' : '−'} ${b} = ${add ? a + b : a - b}`); },
});

/* ---------- 문제 늘리기 (2026-11-03): 같은 차시를 며칠씩 해도 같은 문제를 덜 만나게 ----------
   curriculum.js의 moreGen·oxPic·halfOX·storyQ를 같이 씀. 예전 key·정답은 그대로, 새 문제 key는 c12:x… */
const ALL_THINGS = Object.entries(SHAPE_THINGS).flatMap(([sh, l]) => l.map(([e, n]) => ({ sh, e, n })));
const thingCard = t => `<span style="display:grid;place-items:center;gap:2px"><span style="font-size:44px">${t.e}</span><span class="muted" style="font-size:15px">${esc(t.n)}</span></span>`;
const SH_WORD = { '○':'동그라미', '△':'세모', '□':'네모' };
/* 그림(시계 등) 위에 문장을 보여 주는 O/X */
const oxVis = (key, stmt, ans, hint, explain, vis) => cq(key, 'ox', stmt, `${stmt} 맞으면 O, 틀리면 X를 골라요`, null, ['O', 'X'], ans, hint, explain, { cols:2, big:true, vis });

/* 1단원 */
moreGen('m1-3', .3, [
  () => { const t = rnd(5, 9), big = Math.random() < .5, o = big ? rnd(0, 8) : rnd(1, 9), ans = big ? o + 1 : o - 1;
    return nq(`c12:xcb${t}${o}${big}`, 'cmpbox', `□ 안에 들어갈 수 있는 수 중에서 가장 ${big ? '작은' : '큰'} 수는?`, `네모 안에 들어갈 수 있는 수 중에서 가장 ${big ? '작은' : '큰'} 수는?`, eqH(`${t}${QB} ${big ? '&gt;' : '&lt;'} ${t * 10 + o}`, true), ans, '앞자리가 같아요. 뒷자리(낱개)만 비교해요', `${t}${ans} ${big ? '>' : '<'} ${t * 10 + o}`); },
  () => { const t1 = rnd(5, 9), o1 = rnd(1, 9), n1 = t1 * 10 + o1; let n2; do { n2 = rnd(50, 99); } while (n2 === n1); const d = `10개씩 묶음 ${t1}개와 낱개 ${o1}개`;
    return cq(`c12:xct${n1}-${n2}`, 'cmptens', '더 큰 수를 골라요', null, null, [d, String(n2)], n1 > n2 ? d : String(n2), '10개씩 묶음과 낱개를 먼저 수로 바꾸어 봐요', `${d}는 ${n1}. ${n1} ${n1 > n2 ? '>' : '<'} ${n2}`, { cols:1 }); },
]);

/* 2단원 */
moreGen('m2-1', .35, [
  () => { let a, b, c; do { a = rnd(1, 6); b = rnd(1, 5); c = rnd(1, 5); } while (a + b + c > 9); const h = rnd(0, 2), arr = [a, b, c], s = a + b + c;
    return nq(`c12:x3q${h}:${a}+${b}+${c}`, 'three2', '□에 알맞은 수는?', null, eqH(arr.map((x, i) => i === h ? QB : x).join(' + ') + ` = ${s}`), arr[h], `아는 두 수를 먼저 더하고, ${numJosa(s, '이', '가')} 되려면 얼마가 더 필요한지 생각해요`, `${a} + ${b} + ${c} = ${s}`); },
  () => { let a, b, c; do { a = rnd(1, 6); b = rnd(1, 5); c = rnd(1, 5); } while (a + b + c > 9); const i = rnd(0, 2);
    const st = [`색연필을 빨강 ${a}자루, 파랑 ${b}자루, 노랑 ${c}자루 꺼냈어요. 꺼낸 색연필은 모두 몇 자루일까요?`, `연못에 오리가 ${a}마리 있었는데 ${b}마리가 오고, 또 ${c}마리가 왔어요. 오리는 모두 몇 마리일까요?`, `칭찬 스티커를 월요일에 ${a}장, 화요일에 ${b}장, 수요일에 ${c}장 받았어요. 모두 몇 장일까요?`][i];
    return nq(`c12:x3st${i}:${a}+${b}+${c}`, 'threestory', '이야기를 읽고 답해요', st, storyBox(st), a + b + c, '세 수를 앞에서부터 차례로 더해요', `${a} + ${b} + ${c} = ${a + b + c}`); },
]);
moreGen('m2-2', .35, [() => { let a, b, c; do { a = rnd(5, 9); b = rnd(1, 4); c = rnd(1, 4); } while (a - b - c < 0); const r = a - b - c, h = rnd(0, 2), arr = [a, b, c];
  return nq(`c12:x3sq${h}:${a}-${b}-${c}`, 'three2', '□에 알맞은 수는?', null, eqH(arr.map((x, i) => i === h ? QB : x).join(' − ') + ` = ${r}`), arr[h], h === 0 ? `${r}에 빼 준 두 수를 다시 더해 봐요` : '앞에서부터 차례로 빼 보며 □를 찾아요', `${a} − ${b} − ${c} = ${r}`); }]);
const M10_ST = [
  a => [`구슬이 ${a}개 있어요. 10개를 채우려면 몇 개가 더 있어야 할까요?`, '개'],
  a => [`연필이 ${a}자루 있어요. 10자루가 되려면 몇 자루를 더 사야 할까요?`, '자루'],
  a => [`스티커를 ${a}장 붙였어요. 10장을 다 붙이려면 몇 장을 더 붙여야 할까요?`, '장'],
  a => [`달걀판 10칸 중에서 ${a}칸에 달걀이 있어요. 빈칸은 몇 칸일까요?`, '칸'],
  a => [`줄넘기를 ${a}번 했어요. 10번을 채우려면 몇 번 더 해야 할까요?`, '번'],
];
moreGen('m2-3', .75, [
  () => { const a = rnd(1, 9); return nq(`c12:xm10r${a}`, 'make10', '10이 되려면 □에 얼마를 넣어야 할까요?', null, eqH(`${QB} + ${a} = 10`), 10 - a, `${numJosa(a, '과', '와')} 모아서 10이 되는 수를 찾아요`, `${10 - a} + ${a} = 10`, { hintHTML:framesHTML(cellsFor(a)) }); },
  () => { const a = rnd(1, 9), [e, name] = pick(FOODS); return nq(`c12:xm10e${a}${e}`, 'make10pic', `${josa(name, '이', '가')} ${a}개 있어요. 10개가 되려면 몇 개 더 있어야 할까요?`, null, `<div class="pic" style="font-size:38px;line-height:1.3">${e.repeat(a)}</div>`, 10 - a, '10개가 될 때까지 손가락으로 이어서 세어 봐요', `${a} + ${10 - a} = 10`); },
  () => { const a = rnd(1, 9), i = rnd(0, M10_ST.length - 1), [st, u] = M10_ST[i](a); return nq(`c12:xm10s${i}:${a}`, 'story10', '이야기를 읽고 답해요', st, storyBox(st), 10 - a, `${numJosa(a, '과', '와')} 모아서 10이 되는 수를 찾아요`, `${a} + ${10 - a} = 10 → ${10 - a}${u}`); },
  () => { const a = rnd(1, 9), ok = Math.random() < .5, b = ok ? 10 - a : pick([9 - a, 11 - a].filter(x => x >= 1 && x <= 9)), st = `${a} + ${b} = 10이에요.`;
    return ox(`c12:xm10ox${a}+${b}`, st, ok ? 'O' : 'X', '두 수를 모아서 10이 되는지 세어 봐요', `${a} + ${b} = ${a + b}`); },
]);
const S10_ST = [
  b => [`풍선 10개 중에서 ${b}개가 터졌어요. 남은 풍선은 몇 개일까요?`, '개'],
  b => [`연필 10자루 중에서 ${b}자루를 친구에게 빌려주었어요. 남은 연필은 몇 자루일까요?`, '자루'],
  b => [`색종이 10장 중에서 ${b}장을 썼어요. 남은 색종이는 몇 장일까요?`, '장'],
  b => [`참새 10마리 중에서 ${b}마리가 날아갔어요. 남은 참새는 몇 마리일까요?`, '마리'],
  b => [`동화책 10권 중에서 ${b}권을 읽었어요. 아직 안 읽은 책은 몇 권일까요?`, '권'],
];
moreGen('m2-4', .6, [
  () => { const b = rnd(1, 9), i = rnd(0, S10_ST.length - 1), [st, u] = S10_ST[i](b); return nq(`c12:xs10s${i}:${b}`, 'story10', '이야기를 읽고 답해요', st, storyBox(st), 10 - b, '10에서 빼요', `10 − ${b} = ${10 - b}${u}`); },
  () => { const b = rnd(1, 9); return nq(`c12:xs10f${b}`, 'from10pic', '10개 중에서 줄을 그어 지운 것을 빼면 몇 개가 남을까요?', null, framesHTML(cellsFor(10, 0, b)), 10 - b, '줄이 없는 동그라미를 세어 봐요', `10 − ${b} = ${10 - b}`); },
  () => { const b = rnd(1, 9), ok = Math.random() < .5, x = ok ? 10 - b : pick([9 - b, 11 - b].filter(v => v >= 0 && v <= 9)), st = `10 − ${b} = ${numJosa(x, '이에요', '예요')}.`;
    return ox(`c12:xs10ox${b}-${x}`, st, ok ? 'O' : 'X', `${x} + ${numJosa(b, '이', '가')} 10이 되는지 생각해 봐요`, `10 − ${b} = ${10 - b}`); },
]);
moreGen('m2-5', .35, [() => { let a; do { a = rnd(1, 9); } while (a === 5); const b = 10 - a; let c; do { c = rnd(1, 9); } while (c === a || c === b);
  const arr = shuffle([a, b, c]), P = [[0, 1], [1, 2], [0, 2]], lab = ([i, j]) => `${numJosa(arr[i], '과', '와')} ${arr[j]}`, k = P.findIndex(([i, j]) => arr[i] + arr[j] === 10), ans = lab(P[k]);
  return cq(`c12:xm10p${arr.join('+')}`, 'make10pick', '더해서 10이 되는 두 수를 골라요', `${arr.join(' 더하기 ')}에서 먼저 더하면 좋은 두 수는?`, eqH(arr.join(' + ')), P.map(lab), ans, '두 수씩 더해 보고 10이 되는 짝을 찾아요', `${a} + ${b} = 10, 10 + ${c} = ${10 + c}`, { cols:1 }); }]);

/* 3단원 */
moreGen('m3-1', .65, [
  () => { const t = pick(ALL_THINGS), ok = Math.random() < .5, claim = ok ? t.sh : pick(Object.keys(SHAPE3).filter(x => x !== t.sh)), st = `${josa(t.n, '은', '는')} ${claim} 모양이에요.`;
    return oxPic(`c12:xshox${t.n}${claim}`, st, ok ? 'O' : 'X', '테두리를 손가락으로 따라 그려 봐요', `${josa(t.n, '은', '는')} ${t.sh} 모양`, `<div class="pic">${t.e}</div>`); },
  () => { const sh = pick(Object.keys(SHAPE3)); let ts, n; do { ts = shuffle(ALL_THINGS).slice(0, 5); n = ts.filter(t => t.sh === sh).length; } while (!n);
    return nq(`c12:xshc${sh}${ts.map(t => t.n).sort().join('.')}`, 'shapecount', `${sh} 모양인 물건은 몇 개일까요?`, `${SH_WORD[sh]} 모양인 물건은 몇 개일까?`, rowH(ts.map(thingCard).join('')), n, '물건마다 테두리를 떠올려 봐요', `${ts.filter(t => t.sh === sh).map(t => t.n).join(', ')} → ${n}개`); },
  () => { const [A, B] = shuffle(Object.keys(SHAPE3)).slice(0, 2), two = shuffle(SHAPE_THINGS[A]).slice(0, 2).map(x => x[1]), odd = pick(SHAPE_THINGS[B])[1];
    return cq(`c12:xsho${[...two, odd].sort().join('.')}`, 'shapeodd', '모양이 다른 하나를 골라요', null, null, [...two, odd], odd, '물건마다 ○, △, □ 중 어떤 모양인지 떠올려 봐요', `${two[0]}, ${josa(two[1], '은', '는')} ${A} 모양, ${josa(odd, '은', '는')} ${B} 모양`, { cols:1 }); },
]);
const FEAT = [['뾰족한 곳이 없는 물건은?', '○'], ['뾰족한 곳이 3군데인 물건은?', '△'], ['뾰족한 곳이 4군데인 물건은?', '□'], ['곧은 선이 없는 물건은?', '○'], ['곧은 선이 3개인 물건은?', '△'], ['곧은 선이 4개인 물건은?', '□'], ['굴리면 잘 굴러가는 물건은?', '○']];
moreGen('m3-2', .65, [
  () => { const fi = rnd(0, FEAT.length - 1), [p, sh] = FEAT[fi], right = pick(SHAPE_THINGS[sh])[1], others = Object.keys(SHAPE3).filter(x => x !== sh).map(x => pick(SHAPE_THINGS[x])[1]);
    return cq(`c12:xftt${fi}-${[right, ...others].sort().join('.')}`, 'shapefeat', p, `물건의 앞모습을 떠올려 봐요. ${p}`, null, [right, ...others], right, '물건이 ○, △, □ 중 어떤 모양인지 먼저 떠올려 봐요', `${josa(right, '은', '는')} ${sh} 모양`, { cols:1 }); },
  () => { let a, b, c; do { a = rnd(0, 2); b = rnd(0, 2); c = rnd(0, 1); } while (a + b === 0 || a + b + c < 2); const what = pick(['뾰족한 곳', '곧은 선']), n = 3 * a + 4 * b;
    const ids = shuffle([...Array(a).fill('tri1'), ...Array(b).fill('quad2'), ...Array(c).fill('circ')]), parts = [...Array(a).fill(3), ...Array(b).fill(4)];
    return nq(`c12:xfmix${a}${b}${c}${what}`, 'shapesum', `${josa(what, '은', '는')} 모두 몇 ${what === '뾰족한 곳' ? '군데' : '개'}일까요?`, null, rowH(ids.map(id => shapeSVG(id, 84, { marks: what === '뾰족한 곳' })).join('')), n, '모양 하나씩 세어서 더해요. ○ 모양에는 없어요', parts.length > 1 ? `${parts.join(' + ')} = ${n}` : `${what} ${n}${what === '뾰족한 곳' ? '군데' : '개'}`); },
  () => { const st = pickOX([['□ 모양은 곧은 선이 4개예요.','O'],['○ 모양은 잘 굴러가요.','O'],['△ 모양은 곧은 선이 3개예요.','O'],['△ 모양과 □ 모양에는 곧은 선이 있어요.','O'],['○ 모양에는 둥근 부분이 있어요.','O'],['곧은 선이 없는 모양은 ○ 모양이에요.','O'],['△ 모양의 뾰족한 곳은 □ 모양보다 적어요.','O'],
      ['△ 모양은 굴리면 잘 굴러가요.','X'],['○ 모양에는 곧은 선이 2개 있어요.','X'],['□ 모양에는 뾰족한 곳이 3군데 있어요.','X'],['□ 모양은 둥근 부분만 있어요.','X'],['뾰족한 곳이 4군데인 모양은 △ 모양이에요.','X'],['○ 모양의 뾰족한 곳은 1군데예요.','X'],['□ 모양의 곧은 선은 3개예요.','X']]);
    return ox(`c12:xoxsh${st[0]}`, st[0], st[1], '○ 둥근 부분만, △ 뾰족한 곳·곧은 선 3, □ 뾰족한 곳·곧은 선 4', `${st[0]} → ${st[1]}`); },
]);
moreGen('m3-3', .3, [() => { let items, cnt, A, B; do { items = classifySet(); cnt = { '○':0, '△':0, '□':0 }; items.forEach(i => cnt[{ circ:'○', tri1:'△', quad2:'□' }[i.s]]++); [A, B] = shuffle(Object.keys(cnt)).slice(0, 2); } while (cnt[A] <= cnt[B]);
  return nq(`c12:xcd${items.map(i => i.s[0]).join('')}${A}${B}`, 'shapediff', `${A} 모양은 ${B} 모양보다 몇 개 더 많을까요?`, `${SH_WORD[A]} 모양은 ${SH_WORD[B]} 모양보다 몇 개 더 많을까?`, classifyHTML(items), cnt[A] - cnt[B], '모양별로 따로 세어서 비교해요', `${A} ${cnt[A]}개, ${B} ${cnt[B]}개 → ${cnt[A] - cnt[B]}개 더 많아요`); }]);
const CK_LIFE = [['일어났어요', [6, 7, 8]], ['아침을 먹었어요', [7, 8]], ['학교에 갔어요', [8, 9]], ['점심을 먹었어요', [12, 1]], ['집에 왔어요', [2, 3, 4]], ['공부를 했어요', [4, 5, 6]], ['저녁을 먹었어요', [6, 7]], ['잠자리에 들었어요', [9, 10]]];
moreGen('m3-4', .7, [
  () => { const h = rnd(1, 12); return nq(`c12:xcks${h}`, 'clocktext', `${h}시에 짧은바늘이 가리키는 숫자는?`, null, null, h, '"몇 시"는 짧은바늘이 알려 줘요', `${h}시 → 짧은바늘 ${h}, 긴바늘 12`); },
  () => { const h = rnd(1, 11), right = `짧은바늘 ${h}, 긴바늘 12`;
    return cq(`c12:xckd${h}`, 'clockdesc', `${h}시를 시계에 바르게 나타낸 것은?`, null, null, [right, `짧은바늘 12, 긴바늘 ${h}`, `짧은바늘 ${h}, 긴바늘 6`], right, '"몇 시"에는 긴바늘이 언제나 12를 가리켜요', `${h}시: ${right}`, { cols:1 }); },
  () => { const [act, hs] = pick(CK_LIFE), h = pick(hs), w = shuffle([h % 12 + 1, (h + 3) % 12 + 1]);
    return cq(`c12:xckl${act}${h}`, 'clocklife', `재윤이는 ${h}시에 ${act}. 알맞은 시계를 골라요`, null, null, [hLab(h, 0), hLab(w[0], 0), hLab(w[1], 0)], hLab(h, 0), `짧은바늘이 ${h}, 긴바늘이 12를 가리키는 시계예요`, `${h}시`, { pic:true, grid3:true, cols:3, optHtml:clockOpts([[hLab(h, 0), h, 0], [hLab(w[0], 0), w[0], 0], [hLab(w[1], 0), w[1], 0]]) }); },
  () => { const h = rnd(1, 12), ok = Math.random() < .5, x = ok ? h : pick([h % 12 + 1, h === 1 ? 12 : h - 1]);
    return oxVis(`c12:xckox${h}-${x}`, `시계가 나타내는 시각은 ${x}시예요.`, ok ? 'O' : 'X', '짧은바늘이 가리키는 숫자를 읽어요', `${h}시`, { k:'clock', h, m:0 }); },
]);
moreGen('m3-5', .55, [
  () => { const h = rnd(1, 12), nh = h % 12 + 1, ok = Math.random() < .5, x = ok ? h : pick([nh, h === 1 ? 12 : h - 1]);
    return oxVis(`c12:xchox${h}-${x}`, `시계가 나타내는 시각은 ${x}시 30분이에요.`, ok ? 'O' : 'X', '짧은바늘이 두 숫자 사이에 있으면 앞의 숫자를 읽어요', `${h}시 30분`, { k:'clock', h, m:30 }); },
  () => { const h = rnd(1, 12), nh = h % 12 + 1, nn = nh % 12 + 1, pv = h === 1 ? 12 : h - 1, lab = (x, y) => `${numJosa(x, '과', '와')} ${y} 사이`, right = lab(h, nh);
    return cq(`c12:xchs${h}`, 'clockhand', `${h}시 30분일 때 짧은바늘은 어디에 있을까요?`, null, null, [right, lab(nh, nn), lab(pv, h)], right, `${h}시를 지나 30분 더 갔어요`, `${h}시 30분: 짧은바늘은 ${right}, 긴바늘은 6`, { cols:1 }); },
  () => { const [act, hs] = pick(CK_LIFE), h = pick(hs), nh = h % 12 + 1, w1 = hLab(nh, 30), w2 = hLab(h, 0);
    return cq(`c12:xchl${act}${h}`, 'clocklife', `재윤이는 ${h}시 30분에 ${act}. 알맞은 시계를 골라요`, null, null, [hLab(h, 30), w1, w2], hLab(h, 30), `긴바늘이 6, 짧은바늘이 ${numJosa(h, '과', '와')} ${nh} 사이`, `${h}시 30분`, { pic:true, grid3:true, cols:3, optHtml:clockOpts([[hLab(h, 30), h, 30], [w1, nh, 30], [w2, h, 0]]) }); },
]);

/* 4단원 */
moreGen('m4-1', .3, [() => { let a, b; do { a = rnd(2, 9); b = rnd(2, 9); } while (a + b < 11); return storyQ('c12:x4ast', true, a, b); }]);
moreGen('m4-2', .65, [
  () => { let a, b; do { a = rnd(2, 9); b = rnd(2, 9); } while (a + b < 11); const k = 10 - b, r = a - k;
    return nq(`c12:x4gf${a}+${b}`, 'make10add2', '앞의 수를 가르기 해서 10을 만들어요. □에 알맞은 수는?', `${a} 더하기 ${b}. ${numJosa(b, '이', '가')} 10이 되려면 ${numJosa(k, '이', '가')} 필요해요. 네모는?`, eqH(`${a} + ${b} = ${QB} + ${k} + ${b}`, true), r, `${numJosa(a, '을', '를')} 몇과 ${k}${numRo(k)} 가르기 할까요?`, `${a} = ${r} + ${k}, ${k} + ${b} = 10, ${r} + 10 = ${a + b}`); },
  () => { let a, b; do { a = rnd(5, 9); b = rnd(3, 9); } while (a + b < 11); const k = 10 - a, r = b - k;
    return nq(`c12:x4gs${a}+${b}`, 'make10sum', '10을 만들어 더해요. □에 알맞은 수는?', `${a} 더하기 ${numJosa(b, '은', '는')} ${a} 더하기 ${k} 더하기 ${r}. 10 더하기 ${numJosa(r, '은', '는')}?`, eqH(`${a} + ${b} = ${a} + ${k} + ${r}<br>10 + ${r} = ${QB}`, true), a + b, `${a} + ${k} = 10이에요. 10에 남은 ${numJosa(r, '을', '를')} 더해요`, `${a} + ${b} = 10 + ${r} = ${a + b}`); },
  () => { let a, b; do { a = rnd(5, 9); b = rnd(3, 9); } while (a + b < 11); const k = 10 - a, r = b - k, right = `${a} + ${k} + ${r}`;
    return cq(`c12:x4gc${a}+${b}`, 'make10pick', `${a} + ${numJosa(b, '을', '를')} 10을 만들어 바르게 계산한 식은?`, null, null, [right, `${a} + ${k + 1} + ${r}`, `${a} + ${k} + ${r + 1}`], right, `${a}에 ${numJosa(k, '을', '를')} 더하면 10. ${b}에서 ${numJosa(k, '을', '를')} 빼면 몇이 남을까요?`, `${b} = ${k} + ${r} → ${right}`, { cols:1, big:true }); },
]);
moreGen('m4-4', .35, [
  () => { let a, b; do { a = rnd(11, 18); b = rnd(2, 9); } while (b <= a % 10 || a - b > 9); return nq(`c12:x4sq${a}-${b}`, 'subq', '□에 알맞은 수는?', `${a} 빼기 네모는 ${a - b}`, eqH(`${a} − ${QB} = ${a - b}`), b, `${a - b}에 얼마를 더하면 ${numJosa(a, '이', '가')} 될까요?`, `${a} − ${b} = ${a - b}`); },
  () => { let a, b; do { a = rnd(11, 18); b = rnd(2, 9); } while (b <= a % 10 || a - b > 9); return storyQ('c12:x4sst', false, a, b); },
]);
moreGen('m4-5', .6, [
  () => { let a, b; do { a = rnd(11, 18); b = rnd(2, 9); } while (b <= a % 10 || a - b > 9); const o = a - 10, r = b - o;
    return nq(`c12:x4sgs${a}-${b}`, 'sub10sum', '먼저 10을 만들어 빼요. □에 알맞은 수는?', `${a} 빼기 ${numJosa(b, '은', '는')} ${a} 빼기 ${o} 빼기 ${r}. 10 빼기 ${numJosa(r, '은', '는')}?`, eqH(`${a} − ${b} = ${a} − ${o} − ${r}<br>10 − ${r} = ${QB}`, true), a - b, `${a} − ${o} = 10이에요. 10에서 ${numJosa(r, '을', '를')} 더 빼요`, `${a} − ${b} = 10 − ${r} = ${a - b}`); },
  () => { let a, b; do { a = rnd(11, 18); b = rnd(2, 9); } while (b <= a % 10 || a - b > 9); const o = a - 10, r = b - o, right = `${a} − ${o} − ${r}`;
    return cq(`c12:x4sgc${a}-${b}`, 'sub10pick', `${a} − ${numJosa(b, '을', '를')} 10을 만들어 바르게 계산한 식은?`, null, null, [right, `${a} − ${o + 1} − ${r}`, `${a} − ${o} − ${r + 1}`], right, `${a}에서 ${numJosa(o, '을', '를')} 빼면 10. ${b}에서 ${numJosa(o, '을', '를')} 빼면 몇이 남을까요?`, `${b} = ${o} + ${r} → ${right}`, { cols:1, big:true }); },
]);

/* 5단원 */
moreGen('m5-1', .3, [() => { const pool = shuffle(['🍓','🍌','⭐','🌸','🐰','🍇','💖','🌙','🐥','🍩']), kind = pick(['AB','ABC','AAB','ABB','AABB']);
  const unit = kind.split('').map(ch => pool['ABC'.indexOf(ch)]), seq = Array.from({ length:8 }, (_, i) => unit[i % unit.length]), hole = rnd(2, 6), ans = seq[hole], opts = [...new Set(unit)];
  if (opts.length < 3) opts.push(pool[3]);
  return { key:`c12:xpth${seq.join('')}${hole}`, subj:'math', type:'patternmid', prompt:'규칙을 찾아 ?에 알맞은 것을 골라요', say:'규칙을 찾아서 빈칸에 알맞은 것을 골라 봐요', vis:{ k:'html', html:`<div class="pattern">${seq.map((e, i) => i === hole ? '<span class="qbox">?</span>' : `<span>${e}</span>`).join('')}</div>` }, input:'choice', cols:3, pic:true, optHtml:Object.fromEntries(opts.map(o => [o, `<span style="font-size:44px">${o}</span>`])), opts:shuffle(opts), ans, hint:`'${unit.join(' ')}'가 되풀이돼요`, explain:`${unit.join(' ')}이 반복돼요` }; }]);
moreGen('m5-2', .3, [() => { const pool = shuffle(['🍎','🍌','🔵','🔺','⭐','🐶']), kind = pick(['AB','AAB','ABB','ABC','AABB']), unit = kind.split('').map(ch => pool['ABC'.indexOf(ch)]), seq = Array.from({ length:8 }, (_, i) => unit[i % unit.length]);
  return nq(`c12:xpl${seq.join('')}`, 'patternlen', '몇 개씩 되풀이될까요?', '무늬에서 되풀이되는 부분은 몇 개씩일까?', `<div class="pattern">${seq.map(e => `<span>${e}</span>`).join('')}</div>`, unit.length, '처음 모양이 다시 시작되는 곳을 찾아요', `${unit.join(' ')} → ${unit.length}개씩 되풀이돼요`); }]);
moreGen('m5-3', .3, [() => { const step = pick([1, 2, 5, 10]), down = Math.random() < .35, start = down ? rnd(Math.max(30, step * 4 + 5), 99) : rnd(1, 99 - step * 4), seq = [0, 1, 2, 3].map(i => start + (down ? -step : step) * i);
  const lab = (s, d) => `${s}씩 ${d ? '작아져요' : '커져요'}`, right = lab(step, down), other = pick([1, 2, 5, 10].filter(x => x !== step));
  return cq(`c12:xnsr${start}${down}${step}`, 'npattern2', '수의 규칙으로 알맞은 것은?', null, eqH(seq.join(', '), true), [right, lab(step, !down), lab(other, down)], right, '이웃한 두 수를 비교해 봐요', `${seq.join(', ')} → ${right}`, { cols:1 }); }]);
moreGen('m5-4', .3, [() => { const [d, v, ar] = pick([['바로 아래', 10, '↓'], ['바로 위', -10, '↑'], ['바로 오른쪽', 1, '→'], ['바로 왼쪽', -1, '←']]); let x; do { x = rnd(12, 88); } while (x % 10 < 2 || x % 10 > 8);
  return nq(`c12:xhcn${x}${d}`, 'chart2', `수 배열표에서 ${x} ${d} 칸의 수는?`, null, null, x + v, '수 배열표는 → 쪽으로 1씩, ↓ 쪽으로 10씩 커져요', `${x} ${ar} ${x + v}`); }]);

/* 6단원 */
moreGen('m6-1', .3, [() => { let a, b; do { a = rnd(11, 88); b = rnd(1, 8); } while ((a % 10) + b > 9); return storyQ('c12:x6ast', true, a, b); }]);
moreGen('m6-2', .3, [() => { let a, b; do { a = rnd(11, 78); b = rnd(11, 78); } while ((a % 10) + (b % 10) > 9 || a + b > 99); return storyQ('c12:x6bst', true, a, b); }]);
moreGen('m6-3', .3, [() => { let a, b; do { a = rnd(12, 99); b = rnd(1, 9); } while (b > a % 10); return storyQ('c12:x6cst', false, a, b); }]);
moreGen('m6-4', .3, [() => { let a, b; do { a = rnd(21, 99); b = rnd(11, a - 10); } while ((b % 10) > (a % 10)); return storyQ('c12:x6dst', false, a, b); }]);
moreGen('m6-5', .3, [() => { let a, b, c, d; do { a = rnd(11, 60); b = rnd(11, 38); c = rnd(25, 99); d = rnd(11, c - 10); } while ((a % 10) + (b % 10) > 9 || a + b > 99 || (d % 10) > (c % 10) || a + b === c - d);
  const x = `${a} + ${b}`, y = `${c} − ${d}`;
  return cq(`c12:x6cmp${x}|${y}`, 'calccompare', '계산 결과가 더 큰 것을 골라요', null, null, [x, y], a + b > c - d ? x : y, '두 식을 각각 계산해 봐요', `${x} = ${a + b}, ${y} = ${c - d}`, { cols:2, big:true }); }]);

/* ---------- 단원 · 차시 ---------- */
const MATH12 = {
  title:'초1 2학기 수학', grade:'1학년 2학기', short2:'1-2', subj:'math', short:'수학', lectTitle:'name',
  ebs:{ id:'100005137', name:'만점왕 수학 플러스 1-2', teacher:'김문주 선생님' },
  /* EBS 강의 목록 (오빠가 보내 준 캡처 그대로): [단원, 교재(1=본책, 2=복습책), 쪽, 분, 내용] */
  lect:[
    [1,1,'6~10',29,'99까지의 수 · 수의 순서 · 100'],[1,1,'11~13',29,'수의 크기 비교 · 짝수와 홀수'],[1,1,'14~16',29,'교과서 넘어 보기'],[1,1,'17~21',29,'응용력 높이기'],[1,1,'22~24',29,'단원 평가 (1)'],[1,1,'25~27',29,'단원 평가 (2)'],[1,2,'4~5',29,'기본 문제 복습'],[1,2,'6~7',29,'응용 문제 복습'],[1,2,'8~10',29,'복습책 단원 평가'],
    [2,1,'29~32',28,'세 수의 덧셈 · 세 수의 뺄셈'],[2,1,'32~34',28,'세 수의 덧셈과 뺄셈 활용'],[2,1,'35~37',29,'10이 되는 더하기 · 10에서 빼기'],[2,1,'38~39',28,'세 수 계산 · 10이 되는 덧셈'],[2,1,'39~41',28,'10을 만들어 더하기'],[2,1,'42~45',28,'응용력 높이기'],[2,1,'46~48',29,'단원 평가 (1)'],[2,1,'49~51',29,'단원 평가 (2)'],[2,2,'11~12',28,'기본 문제 복습'],[2,2,'13~14',28,'응용 문제 복습'],[2,2,'15~17',28,'복습책 단원 평가'],
    [3,1,'53~56',28,'뾰족한 곳 · 곧은 선 · 둥근 부분'],[3,1,'57~59',28,'○, △, □ 모양 알아보기'],[3,1,'59~61',28,'모양 찾기 · 모양 꾸미기'],[3,1,'62~65',29,'몇 시 · 몇 시 30분'],[3,1,'65~67',28,'시각 읽고 나타내기'],[3,1,'67~71',28,'응용력 높이기'],[3,1,'72~74',29,'단원 평가 (1)'],[3,1,'75~77',28,'단원 평가 (2)'],[3,2,'18~19',28,'기본 문제 복습'],[3,2,'20~21',28,'응용 문제 복습'],[3,2,'22~24',29,'복습책 단원 평가'],
    [4,1,'79~81',28,'(몇)+(몇)=(십몇)'],[4,1,'82~84',28,'여러 가지 덧셈'],[4,1,'84~86',28,'덧셈 · 합의 크기 비교'],[4,1,'87~88',28,'(십몇)−(몇)=(몇)'],[4,1,'89~91',29,'여러 가지 뺄셈'],[4,1,'91~93',28,'뺄셈 · 차의 크기 비교'],[4,1,'94~97',29,'응용력 높이기'],[4,1,'98~100',28,'단원 평가 (1)'],[4,1,'100~102',29,'단원 평가 (2)'],[4,1,'102~103',28,'단원 평가 (3)'],[4,2,'25~26',29,'기본 문제 복습'],[4,2,'27~28',28,'응용 문제 복습'],[4,2,'29~31',28,'복습책 단원 평가'],
    [5,1,'105~108',28,'무늬에서 규칙 찾기'],[5,1,'109~111',28,'수 배열 · 수 배열표'],[5,1,'112~114',28,'규칙 찾기 넘어 보기'],[5,1,'115~119',28,'응용력 높이기'],[5,1,'120~122',29,'단원 평가 (1)'],[5,1,'123~125',29,'단원 평가 (2)'],[5,2,'32~33',28,'기본 문제 복습'],[5,2,'34~35',28,'응용 문제 복습'],[5,2,'36~38',28,'복습책 단원 평가'],
    [6,1,'126~131',29,'두 자리 수 덧셈'],[6,1,'131~133',28,'덧셈 넘어 보기'],[6,1,'134~136',28,'두 자리 수 뺄셈 · 덧셈 이야기 · 뺄셈 이야기'],[6,1,'137~138',28,'뺄셈 넘어 보기'],[6,1,'139~140',28,'덧셈과 뺄셈 활용'],[6,1,'141~144',28,'응용력 높이기'],[6,1,'145~147',28,'단원 평가 (1)'],[6,1,'147~148',28,'단원 평가 (2)'],[6,1,'148~150',29,'단원 평가 (3)'],[6,2,'39~40',29,'기본 문제 복습'],[6,2,'41~42',28,'응용 문제 복습'],[6,2,'43~45',29,'복습책 단원 평가'],
  ],
  units:[
    { n:1, name:'100까지의 수', rev:5, lessons:[
      { id:'m1-1', ebs:[1], title:'99까지의 수를 알아볼까요', cards:[
        { ill:() => `<div class="tens">${Array.from({ length:6 }, () => `<span class="ten-bar">${'<i></i>'.repeat(10)}</span>`).join('')}</div>` + eqH('60 예순 · 70 일흔<br>80 여든 · 90 아흔', true), text:'10개씩 묶음 6개는 60이에요. 60은 "육십" 또는 "예순", 70은 "칠십" 또는 "일흔", 80은 "팔십" 또는 "여든", 90은 "구십" 또는 "아흔"이라고 읽어요.', say:'육십은 예순, 칠십은 일흔, 팔십은 여든, 구십은 아흔이라고도 읽어요.' },
        { ill:() => `<div class="tens">${Array.from({ length:7 }, () => `<span class="ten-bar">${'<i></i>'.repeat(10)}</span>`).join('')}<span class="ones">${'<i class="one-dot"></i>'.repeat(4)}</span></div>`, text:'10개씩 묶음 7개와 낱개 4개는 74예요. "칠십사" 또는 "일흔넷"이라고 읽어요.', say:'십 개씩 묶음 일곱 개와 낱개 네 개는 칠십사, 일흔넷이에요.' } ] },
      { id:'m1-2', title:'수의 순서 · 100을 알아볼까요', cards:[
        { ill:() => eqH('97, 98, 99, 100', true), text:'99보다 1 큰 수를 100이라고 해요. "백"이라고 읽어요. 10개씩 묶음 10개도 100이에요.', say:'구십구보다 1 큰 수는 백이에요.' },
        { ill:() => eqH('72 ← 73 → 74', true), text:'1 작은 수는 바로 앞의 수, 1 큰 수는 바로 뒤의 수예요.', say:'일 작은 수는 바로 앞의 수, 일 큰 수는 바로 뒤의 수예요.' } ] },
      { id:'m1-3', ebs:[2], title:'수의 크기를 비교해 볼까요', cards:[
        { ill:() => eqH('<span style="color:#EE5F8D">8</span>2 &gt; <span style="color:#EE5F8D">6</span>9', true), text:'10개씩 묶음의 수(앞자리)가 클수록 큰 수예요. 82가 69보다 커요.', say:'앞자리 숫자가 큰 수가 더 커요.' },
        { ill:() => eqH('7<span style="color:#EE5F8D">5</span> &lt; 7<span style="color:#EE5F8D">8</span>', true), text:'앞자리가 같으면 낱개의 수를 비교해요. 입을 벌린 쪽이 큰 수예요.', say:'앞자리가 같으면 낱개를 비교해요.' } ] },
      { id:'m1-4', title:'짝수와 홀수를 알아볼까요', cards:[
        { ill:() => `<div class="pic" style="font-size:40px">🧦🧦 🧦🧦 🧦🧦</div>`, text:'둘씩 짝을 지을 때 남는 것이 없으면 짝수, 하나가 남으면 홀수예요.', say:'둘씩 짝 지어 남는 것이 없으면 짝수, 하나 남으면 홀수예요.' },
        { ill:() => eqH('짝수: 2, 4, 6, 8, 10<br>홀수: 1, 3, 5, 7, 9', true), text:'끝자리가 0, 2, 4, 6, 8이면 짝수, 1, 3, 5, 7, 9이면 홀수예요.', say:'끝자리가 영, 이, 사, 육, 팔이면 짝수예요.' } ] },
      { id:'m1-5', ebs:[3], title:'100까지의 수 넘어 보기', cards:[
        { ill:() => `<div class="row" style="justify-content:center;gap:10px"><span class="num-card">3</span><span class="num-card">8</span><span class="num-card">5</span></div>`, text:'수 카드로 가장 큰 수를 만들 때는 가장 큰 숫자를 앞자리(10개씩 묶음 자리)에 놓아요. 85!', say:'가장 큰 숫자를 앞자리에 놓으면 가장 큰 수가 돼요.' } ] },
    ] },
    { n:2, name:'덧셈과 뺄셈 (1)', rev:16, lessons:[
      { id:'m2-1', ebs:[10], title:'세 수의 덧셈을 해 볼까요', cards:[
        { ill:() => eqH('2 + 3 + 1<br>= 5 + 1<br>= 6', true), text:'세 수의 덧셈은 앞의 두 수를 먼저 더하고, 그 답에 나머지 수를 더해요.', say:'앞의 두 수를 먼저 더하고, 나머지 수를 더해요.' } ] },
      { id:'m2-2', ebs:[11], title:'세 수의 뺄셈을 해 볼까요', cards:[
        { ill:() => eqH('8 − 3 − 2<br>= 5 − 2<br>= 3', true), text:'세 수의 뺄셈도 앞에서부터 차례로 계산해요. 순서를 바꾸면 안 돼요!', say:'세 수의 뺄셈도 앞에서부터 차례로 계산해요.' } ] },
      { id:'m2-3', ebs:[12], title:'10이 되는 더하기를 해 볼까요', cards:[
        { ill:() => framesHTML(cellsFor(7, 3)) + eqH('7 + 3 = 10', true), text:'10칸을 채우려면 몇 개가 더 필요한지 세어요. 1과 9, 2와 8, 3과 7, 4와 6, 5와 5가 10을 만들어요.', say:'일과 구, 이와 팔, 삼과 칠, 사와 육, 오와 오가 십을 만들어요.' } ] },
      { id:'m2-4', ebs:[13], title:'10에서 빼기를 해 볼까요', cards:[
        { ill:() => framesHTML(cellsFor(10, 0, 4)) + eqH('10 − 4 = 6', true), text:'10개 중에서 4개를 지우면 6개가 남아요. 10이 되는 더하기를 거꾸로 생각하면 쉬워요.', say:'십 빼기 사는 육. 육 더하기 사가 십이니까요.' } ] },
      { id:'m2-5', ebs:[14], title:'10을 만들어 더해 볼까요', cards:[
        { ill:() => eqH('<u>6 + 4</u> + 5<br>= 10 + 5 = 15', true), text:'세 수 중에서 더해서 10이 되는 두 수를 먼저 더하면 계산이 쉬워요.', say:'더해서 십이 되는 두 수를 먼저 더하면 쉬워요.' } ] },
    ] },
    { n:3, name:'모양과 시각', rev:27, lessons:[
      { id:'m3-1', ebs:[21], title:'○, △, □ 모양을 찾아볼까요', cards:[
        { ill:() => `<div class="row" style="justify-content:center;gap:14px">${shapeSVG('circ', 80)}${shapeSVG('tri1', 80)}${shapeSVG('quad2', 80)}</div>`, text:'동전·시계는 ○ 모양, 삼각자·삼각김밥은 △ 모양, 공책·액자는 □ 모양이에요.', say:'동전은 동그라미, 삼각자는 세모, 공책은 네모 모양이에요.' } ] },
      { id:'m3-2', ebs:[22], title:'모양의 특징을 알아볼까요', cards:[
        { ill:() => `<div class="row" style="justify-content:center;gap:14px">${shapeSVG('tri1', 90, { marks:true })}${shapeSVG('quad2', 90, { marks:true })}</div>`, text:'△ 모양은 뾰족한 곳이 3군데, 곧은 선이 3개예요. □ 모양은 뾰족한 곳이 4군데, 곧은 선이 4개예요.', say:'세모는 뾰족한 곳이 세 군데, 네모는 네 군데예요.' },
        { ill:() => `<div style="width:110px;margin:auto">${shapeSVG('circ', 110)}</div>`, text:'○ 모양은 뾰족한 곳도, 곧은 선도 없어요. 둥근 부분만 있어서 잘 굴러가요.', say:'동그라미는 뾰족한 곳이 없고 둥글어요.' } ] },
      { id:'m3-3', ebs:[23], title:'여러 가지 모양으로 꾸며 볼까요', cards:[
        { ill:() => classifyHTML([{ s:'tri1', c:'pink' }, { s:'quad2', c:'sky' }, { s:'circ', c:'butter' }, { s:'circ', c:'pink' }, { s:'tri1', c:'sky' }]), text:'○, △, □ 모양으로 꾸민 그림에서 모양을 셀 때는 한 모양씩 표시하면서 세어요.', say:'모양을 셀 때는 한 가지 모양씩 표시하면서 세어요.' } ] },
      { id:'m3-4', ebs:[24], title:'몇 시를 알아볼까요', cards:[
        { ill:() => `<div style="width:170px;margin:auto">${clockSVG(3, 0)}</div>`, text:'긴바늘이 12를 가리키고 짧은바늘이 3을 가리키면 "3시"예요. 짧은바늘이 "몇 시"를 알려 줘요.', say:'긴바늘이 십이, 짧은바늘이 삼을 가리키면 세 시예요.' } ] },
      { id:'m3-5', ebs:[25], title:'몇 시 30분을 알아볼까요', cards:[
        { ill:() => `<div style="width:170px;margin:auto">${clockSVG(4, 30)}</div>`, text:'긴바늘이 6을 가리키면 "30분"이에요. 짧은바늘이 4와 5 사이에 있으면 "4시 30분"이에요.', say:'긴바늘이 육을 가리키면 삼십 분. 짧은바늘이 사와 오 사이면 네 시 삼십 분이에요.' } ] },
    ] },
    { n:4, name:'덧셈과 뺄셈 (2)', rev:39, lessons:[
      { id:'m4-1', ebs:[32], title:'(몇)+(몇)=(십몇)을 해 볼까요', cards:[
        { ill:() => framesHTML(cellsFor(8, 5)) + eqH('8 + 5 = 13', true), text:'8에 2를 먼저 더해 10을 채우고, 남은 3을 더하면 13이에요.', say:'팔에 이를 더해 십을 만들고, 남은 삼을 더하면 십삼이에요.' } ] },
      { id:'m4-2', ebs:[33], title:'10을 만들어 더해 볼까요', cards:[
        { ill:() => eqH('8 + 5<br>= 8 + 2 + 3<br>= 10 + 3 = 13', true), text:'더하는 수를 가르기 해서 10을 먼저 만들어요. 5를 2와 3으로 가르면 8 + 2 = 10, 10 + 3 = 13!', say:'오를 이와 삼으로 갈라서 십을 먼저 만들어요.' } ] },
      { id:'m4-3', ebs:[34], title:'여러 가지 덧셈을 해 볼까요', cards:[
        { ill:() => eqH('7 + 5 = 12<br>7 + 6 = 13<br>7 + 7 = 14', true), text:'더하는 수가 1씩 커지면 합도 1씩 커져요. 규칙을 찾으면 계산이 빨라요.', say:'더하는 수가 일씩 커지면 합도 일씩 커져요.' } ] },
      { id:'m4-4', ebs:[35], title:'(십몇)−(몇)=(몇)을 해 볼까요', cards:[
        { ill:() => framesHTML(cellsFor(13, 0, 5)) + eqH('13 − 5 = 8', true), text:'13에서 5를 뺄 때는 먼저 3을 빼서 10을 만들고, 10에서 2를 더 빼요. 답은 8!', say:'십삼에서 삼을 빼서 십, 십에서 이를 더 빼면 팔이에요.' } ] },
      { id:'m4-5', ebs:[36], title:'여러 가지 방법으로 빼 볼까요', cards:[
        { ill:() => eqH('14 − 6<br>10 − 6 = 4<br>4 + 4 = 8', true), text:'14를 10과 4로 가르고, 10에서 6을 빼면 4. 남아 있던 4를 더하면 8이에요.', say:'십사를 십과 사로 갈라서, 십에서 육을 빼고 사를 더해요.' } ] },
      { id:'m4-6', ebs:[37], title:'뺄셈의 규칙 · 차의 크기를 비교해 볼까요', cards:[
        { ill:() => eqH('15 − 6 = 9<br>15 − 7 = 8<br>15 − 8 = 7', true), text:'빼는 수가 1씩 커지면 차는 1씩 작아져요.', say:'빼는 수가 일씩 커지면 차는 일씩 작아져요.' } ] },
    ] },
    { n:5, name:'규칙 찾기', rev:49, lessons:[
      { id:'m5-1', ebs:[45], title:'무늬에서 규칙을 찾아볼까요', cards:[
        { ill:() => `<div class="pattern"><span>🍓</span><span>🍌</span><span>🍓</span><span>🍌</span><span>🍓</span><span>🍌</span></div>`, text:'딸기, 바나나가 계속 되풀이돼요. 되풀이되는 부분을 찾으면 다음에 올 것을 알 수 있어요.', say:'딸기, 바나나가 계속 되풀이돼요.' } ] },
      { id:'m5-2', title:'규칙을 수로 나타내 볼까요', cards:[
        { ill:() => `<div class="pattern"><span>🍎</span><span>🍌</span><span>🍌</span><span>🍎</span><span>🍌</span><span>🍌</span></div>` + eqH('1, 2, 2, 1, 2, 2', true), text:'사과를 1, 바나나를 2로 바꾸면 규칙을 수로 나타낼 수 있어요. 모양이나 몸동작으로도 나타낼 수 있어요.', say:'사과는 일, 바나나는 이. 규칙을 수로 나타낼 수 있어요.' } ] },
      { id:'m5-3', ebs:[46], title:'수 배열에서 규칙을 찾아볼까요', cards:[
        { ill:() => eqH('5, 10, 15, 20, 25', true), text:'수가 5씩 커지는 규칙이에요. 이웃한 두 수가 얼마나 차이 나는지 보면 규칙을 알 수 있어요.', say:'오씩 커지는 규칙이에요.' } ] },
      { id:'m5-4', ebs:[47], title:'수 배열표에서 규칙을 찾아볼까요', cards:[
        { ill:() => hundredChart(31, 5, 3, [-1, -1]), text:'수 배열표에서 → 쪽으로 가면 1씩, ↓ 쪽으로 가면 10씩 커져요.', say:'옆으로 가면 일씩, 아래로 가면 십씩 커져요.' } ] },
    ] },
    { n:6, name:'덧셈과 뺄셈 (3)', rev:60, lessons:[
      { id:'m6-1', ebs:[54], title:'(몇십몇)+(몇)을 해 볼까요', cards:[
        { ill:() => `<table class="pv"><tr><td></td><td>3</td><td>4</td></tr><tr><td>+</td><td></td><td>5</td></tr><tr class="sum"><td></td><td>3</td><td>9</td></tr></table>`, text:'낱개는 낱개끼리 더하고(4 + 5 = 9), 10개씩 묶음은 그대로 내려 써요. 34 + 5 = 39.', say:'낱개끼리 더하고, 십 개씩 묶음은 그대로 써요.' } ] },
      { id:'m6-2', ebs:[55], title:'(몇십)+(몇십), (몇십몇)+(몇십몇)', cards:[
        { ill:() => `<table class="pv"><tr><td></td><td>2</td><td>3</td></tr><tr><td>+</td><td>4</td><td>5</td></tr><tr class="sum"><td></td><td>6</td><td>8</td></tr></table>`, text:'자리를 맞추어 쓰고, 낱개끼리, 10개씩 묶음끼리 더해요. 23 + 45 = 68.', say:'낱개끼리, 십 개씩 묶음끼리 더해요.' } ] },
      { id:'m6-3', ebs:[56], title:'(몇십몇)−(몇)을 해 볼까요', cards:[
        { ill:() => `<table class="pv"><tr><td></td><td>5</td><td>8</td></tr><tr><td>−</td><td></td><td>3</td></tr><tr class="sum"><td></td><td>5</td><td>5</td></tr></table>`, text:'낱개는 낱개끼리 빼요(8 − 3 = 5). 10개씩 묶음은 그대로! 58 − 3 = 55.', say:'낱개끼리 빼고, 십 개씩 묶음은 그대로 써요.' } ] },
      { id:'m6-4', ebs:[57], title:'(몇십)−(몇십), (몇십몇)−(몇십몇)', cards:[
        { ill:() => `<table class="pv"><tr><td></td><td>7</td><td>6</td></tr><tr><td>−</td><td>2</td><td>4</td></tr><tr class="sum"><td></td><td>5</td><td>2</td></tr></table>`, text:'낱개끼리, 10개씩 묶음끼리 빼요. 76 − 24 = 52.', say:'낱개끼리, 십 개씩 묶음끼리 빼요.' } ] },
      { id:'m6-5', ebs:[58], title:'덧셈 이야기 · 뺄셈 이야기', cards:[
        { ill:() => storyH('구슬 23개가 있는데 14개를 더 받았어요.'), text:'"모두", "더 받았어요"는 덧셈, "남은", "몇 개 더 많은"은 뺄셈으로 식을 세워요.', say:'모두는 덧셈, 남은 것은 뺄셈으로 식을 세워요.' } ] },
    ] },
  ],
};
