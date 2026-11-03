/* ===================== 수학 단원 진도: 초2 1학기 ===================== */
/* 문제 만들기 공통 */
const nq = (key, type, prompt, say, visHtml, ans, hint, explain, x = {}) => Object.assign({ key, subj:'math', type, prompt, say: say || prompt, vis: visHtml ? { k:'html', html:visHtml } : null, input:'numpad', ans, hint, explain }, x);
const cq = (key, type, prompt, say, visHtml, opts, ans, hint, explain, x = {}) => Object.assign({ key, subj:'math', type, prompt, say: say || prompt, vis: visHtml ? { k:'html', html:visHtml } : null, input:'choice', cols: x.cols || 3, opts: shuffle(opts), ans, hint, explain }, x);
const eqH = (s, small) => `<div class="eq" ${small ? 'style="font-size:36px"' : ''}>${s}</div>`;
const QB = '<span class="q">?</span>';
const ox = (key, stmt, ans, hint, explain) => cq(key, 'ox', '맞으면 O, 틀리면 X를 골라요', stmt, `<div class="sent text-q">${esc(stmt)}</div>`, ['O', 'X'], ans, hint, explain, { cols:2, big:true });
const shapeOpts = ids => Object.fromEntries(ids.map(id => [id, shapeSVG(id, 70)]));
const distinctDigits = () => { let n; do { n = rnd(123, 987); } while (new Set(String(n)).size < 3 || String(n).includes('0')); return n; };

const LESSON_GEN = {
  /* ---------- 1단원 세 자리 수 ---------- */
  '1-1'(){ const v = rnd(0, 3);
    if (v === 0) return nq('c:99+1', 'hundred', '99보다 1 큰 수는?', '구십구보다 1 큰 수는 얼마일까?', eqH(`99 + 1 = ${QB}`), 100, '99 다음 수를 생각해 봐요', '99보다 1 큰 수는 100 (백)');
    if (v === 1) return nq('c:10x?=100', 'hundred', '10이 몇 개이면 100일까요?', null, baseTenSVG(0, 10, 0), 10, '분홍 막대를 하나씩 세어 봐요. 10, 20, 30…', '10이 10개이면 100');
    if (v === 2) { const t = rnd(5, 9) * 10; return nq(`c:${t}+?=100`, 'hundred', `100은 ${t}보다 얼마 큰 수일까요?`, null, eqH(`${t} + ${QB} = 100`), 100 - t, `${t}에서 10씩 뛰어 세어 100까지 가 봐요`, `${t} + ${100 - t} = 100`); }
    if (Math.random() < .4) { const f = pick([[1,'작은',99],[10,'작은',90],[10,'큰',110]]); return nq(`c:100${f[1]}${f[0]}`, 'hundred', `100보다 ${f[0]} ${f[1]} 수는?`, null, null, f[2], f[1] === '작은' ? '거꾸로 세어 봐요' : '10씩 뛰어 세어 봐요', `100보다 ${f[0]} ${f[1]} 수는 ${f[2]}`); }
    const k = rnd(91, 98); return nq(`c:${k}->100`, 'hundred', `100은 ${k}보다 얼마 큰 수일까요?`, null, eqH(`${k} + ${QB} = 100`), 100 - k, `${k}에서 하나씩 세어 100까지 가 봐요`, `${k} + ${100 - k} = 100`); },
  '1-2'(){ const h = rnd(2, 9), v = rnd(0, 3);
    if (v === 0) return nq(`c:flat${h}`, 'hundreds', '모두 얼마일까요?', '백 모형이 모두 얼마일까?', baseTenSVG(h, 0, 0), h * 100, '백 모형 하나가 100이에요. 100, 200, 300…', `100이 ${h}개이면 ${h * 100}`);
    if (v === 1) return nq(`c:100x${h}`, 'hundreds', `100이 ${h}개인 수는?`, null, null, h * 100, '100, 200, 300… 하고 세어 봐요', `100이 ${h}개이면 ${h * 100}`);
    if (v === 2) return cq(`c:read${h}00`, 'hundreds', `${h * 100}을 바르게 읽은 것은?`, `${h}00을 바르게 읽은 것은?`, eqH(`${h * 100}`), [numKo(h * 100), numKo(h * 10), numKo(h * 1000)], numKo(h * 100), '0이 두 개 붙으면 "백"이에요', `${h * 100}은 ${numKo(h * 100)}`);
    return nq(`c:${h}00/100`, 'hundreds', `${h * 100}은 100이 몇 개일까요?`, null, null, h, '백의 자리 숫자를 봐요', `${h * 100}은 100이 ${h}개`); },
  '1-3'(){ const v = rnd(0, 2), h = rnd(1, 9), t = rnd(0, 9), o = rnd(0, 9), n = h * 100 + t * 10 + o;
    if (v === 0) return nq(`c:bt${n}`, 'write3', '수 모형이 나타내는 수를 써요', '수 모형이 나타내는 수는 얼마일까?', baseTenSVG(h, t, o, { scale:1 }), n, `백 모형 ${h}개, 십 모형 ${t}개, 일 모형 ${o}개예요`, `${n} (${numKo(n)})`);
    if (v === 1) { const fake = new Set(); const tries = [numKo(h * 100 + o * 10 + t), numKo(n).replace('백', '백영'), numKo(h * 100 + t * 10) + (o ? '' : '영'), numKo(n + 10 > 999 ? n - 10 : n + 10)];
      for (const f of tries) { if (f !== numKo(n) && fake.size < 2) fake.add(f); }
      return cq(`c:read${n}`, 'read3', `${n}을 바르게 읽은 것은?`, '수를 바르게 읽은 것을 골라 봐요', eqH(`${n}`), [numKo(n), ...fake], numKo(n), '0인 자리는 읽지 않아요', `${n}은 ${numKo(n)}`, { cols:1 }); }
    return nq(`c:ko${n}`, 'write3', `'${numKo(n)}'${hasBatchim(numKo(n)) ? '을' : '를'} 수로 쓰면?`, `${josa(numKo(n), '을', '를')} 수로 써 봐요`, `<div class="sent text-q"><span class="big-word">${numKo(n)}</span></div>`, n, '읽지 않은 자리에는 0을 써요', `${numKo(n)} = ${n}`); },
  '1-4'(){ const v = rnd(0, 2), n = distinctDigits(), d = String(n).split('').map(Number);
    if (v === 0) { const i = rnd(0, 2), val = d[i] * [100, 10, 1][i]; const cand = [d[i] * 100, d[i] * 10, d[i]];
      return cq(`c:pv${n}-${i}`, 'placevalue', `${n}에서 숫자 ${d[i]}는 얼마를 나타내나요?`, null, eqH(String(n).split('').map((c, j) => j === i ? `<span style="color:#EE5F8D">${c}</span>` : c).join('')), [...new Set(cand)], val, `${d[i]}가 ${['백','십','일'][i]}의 자리에 있어요`, `${['백','십','일'][i]}의 자리 숫자 ${d[i]}는 ${val}`); }
    if (v === 1) { const i = rnd(0, 2); return nq(`c:pd${n}-${i}`, 'placevalue', `${n}의 ${['백','십','일'][i]}의 자리 숫자는?`, null, eqH(`${n}`), d[i], '왼쪽부터 백, 십, 일의 자리예요', `${n}의 ${['백','십','일'][i]}의 자리 숫자는 ${d[i]}`); }
    const i = rnd(0, 2); const parts = [d[0] * 100, d[1] * 10, d[2]]; const shown = parts.map((p, j) => j === i ? QB : p).join(' + ');
    return nq(`c:ex${n}-${i}`, 'placevalue', '빈칸에 알맞은 수는?', null, eqH(`${n} = ${shown}`, true), parts[i], '각 자리 숫자가 나타내는 값으로 나눠 써요', `${n} = ${parts.join(' + ')}`); },
  '1-5'(){ const step = pick([100, 10, 1]), start = step === 100 ? rnd(1, 4) * 100 + rnd(0, 9) * 10 : rnd(110, 880), seq = [0, 1, 2, 3, 4].map(i => start + step * i);
    const hole = rnd(2, 4); const shown = seq.map((x, i) => i === hole ? QB : x).join(', ');
    return nq(`c:sk${start}+${step}h${hole}`, 'skip', `${step}씩 뛰어 세어요. 빈칸에 알맞은 수는?`, `${step}씩 뛰어 세어요`, eqH(shown, true), seq[hole], `${step === 100 ? '백' : step === 10 ? '십' : '일'}의 자리 숫자가 1씩 커져요`, seq.join(', ')); },
  '1-6'(){ const v = rnd(0, 2);
    if (v === 0) { const q = ML.cmp3(); q.subj = 'math'; return q; }
    if (v === 1) { let a = rnd(100, 999), b = Math.floor(a / 100) * 100 + rnd(0, 99); if (b === a) b = a + 1 > 999 ? a - 1 : a + 1;
      return cq(`c:gl${a}-${b}`, 'compare', '○ 안에 알맞은 것을 골라요', `${a}와 ${b}의 크기를 비교해요`, eqH(`${a} <span class="qbox-inline">○</span> ${b}`, true), ['>', '<'], a > b ? '>' : '<', '벌린 입이 큰 수 쪽을 봐요. 백의 자리가 같으면 십의 자리를 비교해요', `${a} ${a > b ? '>' : '<'} ${b}`, { cols:2, big:true }); }
    const nums = new Set(); const base = rnd(1, 8) * 100; while (nums.size < 3) nums.add(base + rnd(0, 199)); const arr = [...nums];
    return cq(`c:max${arr.join(',')}`, 'compare', '가장 큰 수를 골라요', null, null, arr, Math.max(...arr), '백의 자리부터 차례로 비교해요', `가장 큰 수는 ${Math.max(...arr)}`, { big:true }); },

  /* ---------- 2단원 여러 가지 도형 ---------- */
  '2-1'(){ const v = rnd(0, 2);
    if (v === 0) { const right = pick(['tri1','tri2','tri3']), wrong = shuffle(['quad1','circ','open3','curve3','quad3']).slice(0, 2);
      return cq(`c:pickT${right}${wrong}`, 'pickshape', '삼각형을 골라요', null, null, [right, ...wrong], right, '곧은 선 3개로 둘러싸인 모양이에요. 열린 곳이 없어야 해요', '곧은 선 3개로 둘러싸인 도형이 삼각형', { pic:true, optHtml:shapeOpts([right, ...wrong]) }); }
    if (v === 1) { const id = pick(['tri1','tri2','tri3']), what = pick(['변','꼭짓점']);
      return nq(`c:cnt${id}${what}`, 'count', `삼각형의 ${what}은 몇 개일까요?`, null, shapeSVG(id, 150, { marks: what === '꼭짓점' }), 3, what === '변' ? '곧은 선을 하나씩 세어 봐요' : '두 선이 만나는 뾰족한 점을 세어 봐요', `삼각형은 ${what}이 3개`); }
    const st = pickOX([['삼각형은 곧은 선 3개로 둘러싸여 있어요.','O'],['삼각형의 꼭짓점은 4개예요.','X'],['삼각형에는 굽은 선이 있어요.','X'],['삼각형의 변은 3개예요.','O']]);
    return ox(`c:oxT${st[0]}`, st[0], st[1], '삼각형: 변 3개, 꼭짓점 3개, 곧은 선만', `${st[0]} → ${st[1]}`); },
  '2-2'(){ const v = rnd(0, 2);
    if (v === 0) { const right = pick(['quad1','quad2','quad3']), wrong = shuffle(['tri1','circ','open4','pent','tri3']).slice(0, 2);
      return cq(`c:pickQ${right}${wrong}`, 'pickshape', '사각형을 골라요', null, null, [right, ...wrong], right, '곧은 선 4개로 둘러싸인 모양이에요', '곧은 선 4개로 둘러싸인 도형이 사각형', { pic:true, optHtml:shapeOpts([right, ...wrong]) }); }
    if (v === 1) { const id = pick(['quad1','quad2','quad3']), what = pick(['변','꼭짓점']);
      return nq(`c:cnt${id}${what}`, 'count', `사각형의 ${what}은 몇 개일까요?`, null, shapeSVG(id, 150, { marks: what === '꼭짓점' }), 4, '하나씩 짚으며 세어 봐요', `사각형은 ${what}이 4개`); }
    const st = pickOX([['사각형은 변이 4개예요.','O'],['사각형은 꼭짓점이 3개예요.','X'],['사각형은 곧은 선 4개로 둘러싸여 있어요.','O'],['네모난 모양은 모두 변이 4개예요.','O'],['사각형은 굽은 선으로 둘러싸여 있어요.','X'],['사각형의 변은 5개예요.','X'],['사각형은 꼭짓점이 4개예요.','O'],['동그라미도 사각형이에요.','X']]);
    return ox(`c:oxQ${st[0]}`, st[0], st[1], '사각형: 변 4개, 꼭짓점 4개', `${st[0]} → ${st[1]}`); },
  '2-3'(){ const v = rnd(0, 1);
    if (v === 0) { const wrong = shuffle(['oval','quad2','tri1','hex']).slice(0, 2);
      return cq(`c:pickC${wrong}`, 'pickshape', '원을 골라요', null, null, ['circ', ...wrong], 'circ', '어느 쪽에서 보아도 똑같이 동그란 모양이에요. 길쭉하면 원이 아니에요', '똑같이 동그란 모양이 원', { pic:true, optHtml:shapeOpts(['circ', ...wrong]) }); }
    const st = pickOX([['원에는 꼭짓점이 없어요.','O'],['원에는 변이 4개 있어요.','X'],['원은 뾰족한 곳이 없어요.','O'],['원은 곧은 선으로 둘러싸여 있어요.','X'],['원은 어느 쪽에서 보아도 똑같이 동그래요.','O']]);
    return ox(`c:oxC${st[0]}`, st[0], st[1], '원은 굽은 선 하나로 동그랗게 둘러싸여 있어요', `${st[0]} → ${st[1]}`); },
  '2-4'(){ const v = rnd(0, 5);
    if (v === 0) return nq('c:tgTri', 'tangram', '칠교판 조각 중에서 삼각형은 몇 개일까요?', null, tangramSVG({ nums:true }), 5, '곧은 선 3개로 둘러싸인 조각을 하나씩 세어 봐요', '삼각형 조각은 ①②③⑤⑦ 5개');
    if (v === 1) return nq('c:tgQuad', 'tangram', '칠교판 조각 중에서 사각형은 몇 개일까요?', null, tangramSVG({ nums:true }), 2, '곧은 선 4개로 둘러싸인 조각을 세어 봐요', '사각형 조각은 ④⑥ 2개');
    if (v === 2) { const p = pick(TANGRAM), nm = p.k === 'tri' ? '삼각형' : '사각형';
      return cq(`c:tgP${p.n}`, 'tangram', `색칠한 ${p.n}번 조각은 어떤 도형일까요?`, `${p.n}번 조각은 어떤 도형일까?`, tangramSVG({ nums:true, hi:p.n }), ['삼각형','사각형','원'], nm, '변이 몇 개인지 세어 봐요', `${p.n}번 조각은 변이 ${p.k === 'tri' ? 3 : 4}개라서 ${nm}`, { cols:3 }); }
    if (v === 3) return nq('c:tg7', 'tangram', '칠교판은 모두 몇 조각일까요?', null, tangramSVG({ nums:true }), 7, '번호를 하나씩 세어 봐요', '칠교판은 일곱 조각 (칠 = 7)');
    if (v === 4) { const k = pick(['square','tri']); const nm = k === 'square' ? '사각형' : '삼각형';
      return cq(`c:tg2${k}`, 'tangram', '작은 삼각형 두 조각을 붙여서 만든 모양은?', '작은 삼각형 두 조각을 붙여서 만든 모양은 무엇일까?', twoTriSVG(k, 110), ['삼각형','사각형','원'], nm, '바깥 테두리의 변을 세어 봐요', `바깥 변이 ${k === 'square' ? 4 : 3}개라서 ${nm}`, { cols:3 }); }
    const st = pickOX([['칠교판 조각에는 원 모양이 없어요.','O'],['칠교판은 일곱 조각으로 되어 있어요.','O'],['칠교판 조각은 모두 삼각형이에요.','X'],['칠교판 조각은 모두 곧은 선으로 둘러싸여 있어요.','O'],['칠교판에서 가장 큰 조각은 사각형이에요.','X'],['칠교판 조각 두 개를 붙이면 원을 만들 수 있어요.','X']]);
    return ox(`c:oxTg${st[0]}`, st[0], st[1], '칠교판: 삼각형 5조각 + 사각형 2조각, 모두 곧은 선', `${st[0]} → ${st[1]}`); },
  '2-5'(){ const v = rnd(0, 2);
    if (v === 0) { const cols = rnd(2, 4), h = Array.from({ length:cols }, () => rnd(1, 3)), n = h.reduce((a, b) => a + b, 0);
      return nq(`c:cube${h.join('')}`, 'cubes', '쌓기나무는 모두 몇 개일까요?', null, cubesSVG(h), n, '한 줄씩 위에서부터 세어 봐요', `${h.join(' + ')} = ${n}개`); }
    if (v === 1) { const [h, hi, ans] = pick([[[1,1],[0,0],'왼쪽'],[[1,1],[1,0],'오른쪽'],[[2],[0,1],'위'],[[2],[0,0],'아래']]);
      return cq(`c:pos${ans}`, 'cubepos', '빨간 쌓기나무는 노란 쌓기나무의 어느 쪽에 있나요?', null, cubesSVG(h, { hi }), ['위','아래','왼쪽','오른쪽'], ans, '내가 보는 쪽에서 빨간 쌓기나무가 어디 있는지 봐요', `빨간 쌓기나무는 노란 쌓기나무의 ${ans}에 있어요`, { cols:2 }); }
    const hh = rnd(2, 4), side = rnd(0, 2), h = side ? [hh, side] : [hh];
    return nq(`c:above${hh}-${side}`, 'cubepos', '빨간 쌓기나무 위에 쌓기나무가 몇 개 더 쌓여 있나요?', null, cubesSVG(h, { hi:[0, 0] }), hh - 1, '빨간 쌓기나무 바로 위부터 하나씩 세어 봐요', `빨간 쌓기나무 위에 ${hh - 1}개`); },

  /* ---------- 3단원 덧셈과 뺄셈 ---------- */
  '3-1'(){ let a, b; do { a = rnd(13, 89); b = rnd(2, 9); } while ((a % 10) + b < 10 || a + b > 99);
    return nq(`c:a21${a}+${b}`, 'add', '덧셈을 해요', `${a} 더하기 ${b}는?`, eqH(`${a} + ${b} = ${QB}`), a + b, `일의 자리 ${a % 10} + ${b} = ${a % 10 + b}. 10은 십의 자리로 올려요`, `${a} + ${b} = ${a + b}`, { hintHTML: baseTenSVG(0, Math.floor(a / 10), a % 10, { scale:.8 }) }); },
  '3-2'(){ const r = Math.random();
    if (r < .5) { const q = ML.add2c(); q.subj = 'math'; return q; }
    let a, b; const both = r >= .72;
    do { a = rnd(21, 89); b = rnd(14, 89); } while (both ? ((a % 10) + (b % 10) < 10 || a + b < 100 || a + b > 189) : ((a % 10) + (b % 10) >= 10 || a + b < 100 || a + b > 189));
    return nq(`c:a22${a}+${b}`, 'add', '덧셈을 해요', `${a} 더하기 ${b}는?`, eqH(`${a} + ${b} = ${QB}`), a + b,
      both ? `일의 자리부터 더해요. ${a % 10} + ${b % 10} = ${a % 10 + b % 10}, 1을 올리고 십의 자리도 10이 넘으면 백의 자리로 1을 올려요` : `십의 자리끼리 ${Math.floor(a / 10)} + ${Math.floor(b / 10)} = ${Math.floor(a / 10) + Math.floor(b / 10)}. 10이 넘으면 백의 자리로 1을 올려요`,
      `${a} + ${b} = ${a + b}`); },
  '3-3'(){ let a, b; do { a = rnd(21, 95); b = rnd(2, 9); } while ((a % 10) >= b);
    return nq(`c:s21${a}-${b}`, 'sub', '뺄셈을 해요', `${a} 빼기 ${b}는?`, eqH(`${a} − ${b} = ${QB}`), a - b, `일의 자리 ${a % 10}에서 ${numJosa(b, '을', '를')} 뺄 수 없어요. 십의 자리에서 10을 빌려 와서 ${a % 10 + 10} − ${b}`, `${a} − ${b} = ${a - b}`); },
  '3-4'(){ if (Math.random() < .3) { const a = rnd(3, 9) * 10; let b; do { b = rnd(11, a - 1); } while (b % 10 === 0);
      return nq(`c:s30${a}-${b}`, 'sub', '뺄셈을 해요', `${a} 빼기 ${b}는?`, eqH(`${a} − ${b} = ${QB}`), a - b, `일의 자리 0에서 ${numJosa(b % 10, '을', '를')} 뺄 수 없어요. 십의 자리에서 10을 빌려 와서 10 − ${b % 10}`, `${a} − ${b} = ${a - b}`); }
    const q = ML.sub2b(); q.subj = 'math'; return q; },
  '3-5'(){ let a, b, c, op1, op2, r1, ans; do { a = rnd(12, 60); b = rnd(5, 39); c = rnd(5, 30); op1 = pick(['+','−']); op2 = pick(['+','−']); r1 = op1 === '+' ? a + b : a - b; ans = op2 === '+' ? r1 + c : r1 - c; } while (r1 < 0 || r1 > 99 || ans < 0 || ans > 99);
    return nq(`c:3n${a}${op1}${b}${op2}${c}`, 'three', '세 수를 계산해요', `${a} ${op1 === '+' ? '더하기' : '빼기'} ${b} ${op2 === '+' ? '더하기' : '빼기'} ${c}는?`, eqH(`${a} ${op1} ${b} ${op2} ${c} = ${QB}`, true), ans, `앞에서부터 차례로 계산해요. 먼저 ${a} ${op1} ${b} = ${r1}`, `${a} ${op1} ${b} = ${r1}, ${r1} ${op2} ${c} = ${ans}`); },
  '3-6'(){ let a, b; do { a = rnd(6, 49); b = rnd(5, 40); } while (a === b || a + b > 89); const c = a + b, v = rnd(0, 3);
    if (v === 0) { const right = `${c} − ${b} = ${a}`; return cq(`c:rel+${a}+${b}`, 'relation', '덧셈식을 뺄셈식으로 바르게 나타낸 것은?', `${a} 더하기 ${b}는 ${c}. 뺄셈식으로 바르게 나타낸 것을 골라 봐요`, eqH(`${a} + ${b} = ${c}`, true), [right, `${c} + ${b} = ${a}`, `${b} − ${a} = ${c}`], right, '가장 큰 수에서 빼요', `${a} + ${b} = ${c} → ${c} − ${b} = ${a}`, { cols:1 }); }
    if (v === 1) { const right = `${b} + ${a} = ${c}`; return cq(`c:rel-${c}-${a}`, 'relation', '뺄셈식을 덧셈식으로 바르게 나타낸 것은?', `${c} 빼기 ${a}는 ${b}. 덧셈식으로 바르게 나타낸 것을 골라 봐요`, eqH(`${c} − ${a} = ${b}`, true), [right, `${c} + ${a} = ${b}`, `${b} − ${a} = ${c}`], right, '작은 두 수를 더하면 가장 큰 수가 돼요', `${c} − ${a} = ${b} → ${b} + ${a} = ${c}`, { cols:1 }); }
    if (v === 2) return nq(`c:rel3n${a}-${b}`, 'relation', '세 수로 뺄셈식을 만들어요', `${a}, ${b}, ${c}로 뺄셈식을 만들어요. ${c} 빼기 ${b}는?`, `<div class="sent text-q">세 수: <b>${a}</b>, <b>${b}</b>, <b>${c}</b></div>` + eqH(`${c} − ${b} = ${QB}`, true), a, `${a} + ${b} = ${c}이니까 ${c}에서 ${numJosa(b, '을', '를')} 빼면 처음 수가 남아요`, `${c} − ${b} = ${a}`);
    return nq(`c:relq${a}-${b}`, 'relation', '□에 알맞은 수는?', `${a} 더하기 ${b}는 ${c}. 그러면 ${c} 빼기 네모는 ${b}`, eqH(`${a} + ${b} = ${c}<br>${c} − ${QB} = ${b}`, true), a, '위의 덧셈식에 있는 수를 그대로 써요', `${c} − ${a} = ${b}`); },
  '3-7'(){ if (Math.random() < .25) { const [st, x, n, tot] = pick([['사탕이 몇 개 있었는데 5개를 더 받았더니 12개가 되었어요.','+',5,12],['색종이가 몇 장 있었는데 7장을 썼더니 9장이 남았어요.','−',7,9],['풍선이 몇 개 있었는데 4개가 날아가서 8개가 남았어요.','−',4,8],['구슬이 몇 개 있었는데 6개를 더 모았더니 15개가 되었어요.','+',6,15],['쿠키가 몇 개 있었는데 3개를 먹었더니 9개가 남았어요.','−',3,9]]);
      const right = `□ ${x} ${n} = ${tot}`; return cq(`c:mstory${st}`, 'missing', '처음 수를 □로 하여 식을 만들면?', st + ' 처음 수를 네모로 하여 식을 만들어 봐요', `<div class="sent text-q" style="font-size:22px">${esc(st)}</div>`, [right, `□ ${x === '+' ? '−' : '+'} ${n} = ${tot}`, `${tot} ${x} ${n} = □`], right, x === '+' ? '더 받았으면 더하기(+)예요' : '쓰거나 날아가면 빼기(−)예요', right, { cols:1 }); }
     const v = rnd(0, 3), a = rnd(6, 49), b = rnd(5, 40);
    if (v === 0) return nq(`c:mb${b}+${a}`, 'missing', '□에 알맞은 수는?', `네모 더하기 ${a}는 ${a + b}. 네모는 얼마일까?`, eqH(`${QB} + ${a} = ${a + b}`), b, `${a + b} − ${numJosa(a, '을', '를')} 계산하면 돼요`, `${a + b} − ${a} = ${b}`);
    if (v === 1) return nq(`c:ma${a}+${b}`, 'missing', '□에 알맞은 수는?', `${a} 더하기 네모는 ${a + b}. 네모는 얼마일까?`, eqH(`${a} + ${QB} = ${a + b}`), b, `${a + b} − ${numJosa(a, '을', '를')} 계산하면 돼요`, `${a + b} − ${a} = ${b}`);
    if (v === 2) return nq(`c:ms${a + b}-${a}`, 'missing', '□에 알맞은 수는?', `${a + b} 빼기 네모는 ${b}. 네모는 얼마일까?`, eqH(`${a + b} − ${QB} = ${b}`), a, `${a + b} − ${numJosa(b, '을', '를')} 계산하면 돼요`, `${a + b} − ${b} = ${a}`);
    return nq(`c:mt${a}-${b}`, 'missing', '□에 알맞은 수는?', `네모 빼기 ${a}는 ${b}. 네모는 얼마일까?`, eqH(`${QB} − ${a} = ${b}`), a + b, `${b} + ${numJosa(a, '을', '를')} 계산하면 돼요`, `${b} + ${a} = ${a + b}`); },

  /* ---------- 4단원 길이 재기 ---------- */
  '4-1'(){ const v = rnd(0, 1);
    if (v === 0) { const n = rnd(3, 8), obj = pick(['연필','크레파스','리본','색연필']); return nq(`c:clip${n}${obj}`, 'clips', `${obj}의 길이는 클립 몇 개만큼일까요?`, null, clipsSVG(n, obj), n, '클립을 하나씩 세어 봐요', `클립 ${n}개만큼`); }
    const st = pickOX([['같은 연필을 클립과 지우개로 재면, 더 작은 클립으로 잰 수가 더 커요.','O'],['재는 단위가 달라도 잰 수는 항상 같아요.','X'],['뼘으로 재면 사람마다 잰 길이가 다를 수 있어요.','O']]);
    return ox(`c:oxL${st[0]}`, st[0], st[1], '작은 단위로 재면 여러 번 재야 해요', `${st[0]} → ${st[1]}`); },
  '4-2'(){ const n = rnd(2, 15), v = rnd(0, 1);
    if (v === 0) return nq(`c:cm${n}`, 'cm', `1 cm가 ${n}번이면 몇 cm일까요?`, `1센티미터가 ${n}번이면 몇 센티미터일까?`, eqH(`1 cm × ${n}번 = ${QB} cm`, true), n, '1 cm씩 더해 가요', `${n} cm`);
    return nq(`c:cmr${n}`, 'cm', `${n} cm는 1 cm가 몇 번일까요?`, `${n}센티미터는 1센티미터가 몇 번일까?`, null, n, `${n} cm는 1 cm를 ${n}번 이은 길이예요`, `${n}번`); },
  '4-3'(){ const s = Math.random() < .55 ? 0 : rnd(1, 4), len = rnd(2, 9), obj = pick(['연필','지우개','크레파스','머리핀']);
    return nq(`c:ru${s}-${len}`, 'ruler', `${obj}의 길이는 몇 cm일까요?`, `${obj}의 길이는 몇 센티미터일까?`, rulerSVG(s, s + len, { label:obj }), len, s ? `${s}에서 시작했어요. ${s}부터 1 cm가 몇 번 들어가는지 세어 봐요` : '0에 맞추고 끝에 있는 눈금을 읽어요', s ? `${s + len} − ${s} = ${len} cm` : `${len} cm`); },
  '4-4'(){ const items = [['클립',3],['지우개',5],['크레파스',8],['연필',15],['숟가락',20],['공책 긴 쪽',25],['30 cm 자',30]]; const [name, len] = pick(items);
    if (Math.random() < .5) { const others = shuffle(items.filter(x => Math.abs(x[1] - len) >= 7)).slice(0, 2).map(x => x[0]);
      return cq(`c:estr${name}`, 'estimate', `길이가 약 ${len} cm인 것은?`, `길이가 약 ${len}센티미터인 것은 무엇일까?`, null, [name, ...others], name, '손가락 한 마디가 약 1 cm예요', `${name}은 약 ${len} cm`); }
    const far = shuffle(items.filter(x => Math.abs(x[1] - len) >= 7).map(x => x[1])).slice(0, 2);
    return cq(`c:est${name}`, 'estimate', `${name}의 길이는 약 몇 cm일까요?`, `${name}의 길이는 약 몇 센티미터일까?`, null, [len, ...far].map(x => `약 ${x} cm`), `약 ${len} cm`, '손가락 한 마디가 약 1 cm예요. 손으로 떠올려 봐요', `${name}은 약 ${len} cm`); },

  /* ---------- 5단원 분류하기 ---------- */
  '5-1'(){ const sets = [
      ['도형을 나누는 기준으로 알맞은 것은?', '모양', ['예쁜 것과 안 예쁜 것', '좋아하는 것과 싫어하는 것']],
      ['과일을 나누는 기준으로 알맞은 것은?', '색깔', ['맛있는 것과 맛없는 것', '좋아하는 순서']],
      ['동물을 나누는 기준으로 알맞은 것은?', '다리의 수', ['귀여운 것과 무서운 것', '좋아하는 동물']],
      ['옷을 나누는 기준으로 알맞은 것은?', '종류 (윗옷, 바지)', ['멋진 옷과 안 멋진 옷', '비싸 보이는 옷']],
      ['탈것을 나누는 기준으로 알맞은 것은?', '바퀴의 수', ['빠를 것 같은 것', '타고 싶은 것']],
      ['단추를 나누는 기준으로 알맞은 것은?', '구멍의 수', ['귀여운 단추', '마음에 드는 단추']],
      ['학용품을 나누는 기준으로 알맞은 것은?', '쓰임 (쓰는 것, 자르는 것)', ['새것 같은 것', '좋아하는 것']],
      ['음식을 나누는 기준으로 알맞은 것은?', '과일과 채소', ['맛있는 것', '먹고 싶은 것']],
    ];
    if (Math.random() < .4) { const bad = pick([['예쁜 것과 안 예쁜 것','색깔','모양'],['재미있는 것','바퀴의 수','색깔'],['좋아하는 것','다리의 수','사는 곳 (땅, 물)'],['멋진 것','종류','색깔']]);
      return cq(`c:critx${bad[0]}`, 'criterion', '분류 기준이 될 수 없는 것은?', null, null, bad, bad[0], '사람마다 생각이 다를 수 있는 기준을 찾아요', `"${bad[0]}"은 사람마다 달라서 기준이 될 수 없어요`, { cols:1 }); }
    const [p, ans, w] = pick(sets);
    return cq(`c:crit${p}`, 'criterion', p, null, null, [ans, ...w], ans, '누가 나누어도 결과가 똑같은 기준을 골라요', `"${ans}"은 누가 나누어도 결과가 같아요`, { cols:1 }); },
  '5-2'(){ const items = classifySet(); const by = pick(['shape','color']);
    const target = by === 'shape' ? pick(['tri1','quad2','circ']) : pick(Object.keys(CLS_COLORS));
    const n = items.filter(it => by === 'shape' ? it.s === target : it.c === target).length;
    const label = by === 'shape' ? SHAPE_NAME[SHAPES[target].k] : CLS_COLORS[target] + ' 도형';
    return nq(`c:cls${items.map(i => i.s[0] + i.c[0]).join('')}${target}`, 'classify', `${josa(label, '은', '는')} 몇 개일까요?`, null, classifyHTML(items), n, '하나씩 세면서 표시해 봐요', `${label}: ${n}개`); },
  '5-3'(){ let items, counts, max; do { items = classifySet(); counts = { tri1:0, quad2:0, circ:0 }; items.forEach(i => counts[i.s]++); max = Math.max(...Object.values(counts)); } while (Object.values(counts).filter(v => v === max).length > 1);
    const best = Object.keys(counts).find(k => counts[k] === max);
    return cq(`c:most${items.map(i => i.s[0]).join('')}`, 'classify', '가장 많은 모양은 무엇일까요?', null, classifyHTML(items), ['삼각형','사각형','원'], SHAPE_NAME[SHAPES[best].k], '모양별로 나누어 세어 봐요', `삼각형 ${counts.tri1}개, 사각형 ${counts.quad2}개, 원 ${counts.circ}개`); },

  /* ---------- 6단원 곱셈 ---------- */
  '6-1'(){ if (Math.random() < .5) { const step = pick([2, 5]), g = rnd(3, 6); const [e, name] = pick(COUNT_THINGS); return nq(`c:skg${step}x${g}${e}`, 'skip', `${step}씩 세어 보면 ${josa(name, '은', '는')} 모두 몇 개일까요?`, null, groupsHTML(e, g, step), step * g, `${Array.from({ length:g }, (_, i) => step * (i + 1)).join(', ')} 하고 세어 봐요`, `모두 ${step * g}개`); }
    const step = pick([2, 3, 4, 5, 10]), start = step, seq = [0, 1, 2, 3, 4].map(i => start + step * i), hole = rnd(3, 4);
    return nq(`c:skc${step}h${hole}`, 'skip', `${step}씩 뛰어 세어요. 빈칸에 알맞은 수는?`, `${step}씩 뛰어 세어요`, eqH(seq.map((x, i) => i === hole ? QB : x).join(', '), true), seq[hole], `${step}씩 커져요`, seq.join(', ')); },
  '6-2'(){ const q = ML.groups(); q.subj = 'math'; return q; },
  '6-3'(){ if (Math.random() < .5) { const q = ML.times2(); q.subj = 'math'; return q; }
    const a = rnd(2, 5), b = rnd(2, 5); const [e] = pick(COUNT_THINGS);
    return nq(`c:bae${a}x${b}`, 'bae', `${a}씩 ${b}묶음은 ${a}의 몇 배일까요?`, null, groupsHTML(e, b, a), b, '묶음의 수를 세어 봐요', `${a}씩 ${b}묶음은 ${a}의 ${b}배`); },
  '6-4'(){ const a = rnd(2, 6), b = rnd(2, 5); const [e] = pick(COUNT_THINGS);
    const right = `${a} × ${b}`, opts = new Set([right]); for (const w of shuffle([`${a} + ${b}`, `${a + 1} × ${b}`, `${a} × ${b + 1}`])) { if (opts.size < 3) opts.add(w); }
    return cq(`c:mx${a}x${b}`, 'mulexpr', '그림을 곱셈식으로 나타내면?', `${a}씩 ${b}묶음을 곱셈식으로 나타내 봐요`, groupsHTML(e, b, a), [...opts], right, `한 묶음에 ${a}개, ${b}묶음이에요. "${a}씩 ${b}묶음"은 ${a} × ${b}`, `${a}씩 ${b}묶음 = ${a} × ${b}`, { cols:1 }); },
  '6-5'(){ const a = rnd(2, 9), b = rnd(2, 5);
    if (Math.random() < .5) return nq(`c:ra${a}x${b}`, 'mulfromadd', '□에 알맞은 수는?', `${numJosa(a, '을', '를')} ${b}번 더한 것은 ${a} 곱하기 몇?`, eqH(`${Array(b).fill(a).join(' + ')} = ${a} × ${QB}`, true), b, `${numJosa(a, '을', '를')} 몇 번 더했는지 세어 봐요`, `${numJosa(a, '을', '를')} ${b}번 더하면 ${a} × ${b}`);
    const [e] = pick(COUNT_THINGS);
    return nq(`c:mv${a}x${b}`, 'mul', '곱셈을 해요', `${a} 곱하기 ${b}는?`, groupsHTML(e, b, a) + eqH(`${a} × ${b} = ${QB}`), a * b, `${a}씩 ${b}번 뛰어 세어 봐요`, `${a} × ${b} = ${a * b}`); },
};

/* 분류하기 재료 */
const CLS_COLORS = { pink:'분홍색', sky:'파란색', butter:'노란색' };
function classifySet(){ return Array.from({ length:rnd(7, 10) }, () => ({ s:pick(['tri1','quad2','circ']), c:pick(Object.keys(CLS_COLORS)) })); }
function classifyHTML(items){ return `<div class="cls-grid">${items.map(it => `<span>${shapeSVG(it.s, 52, { fill: C[it.c] })}</span>`).join('')}</div>`; }

/* ---------- 문제 늘리기 (2026-11-03): 같은 차시를 며칠씩 해도 같은 문제를 덜 만나게 ----------
   예전 문제의 key·정답은 그대로 두고(복습 S.wrong이 key로 찾음), 새 문제는 새 key(c:x…)로 만든다.
   moreGen(차시, 새 문제 비율, [만들기…]) — 새 문제 비율만큼 새 만들기 중 하나, 나머지는 예전 그대로. 차시 학습 목표 안에서만. */
const moreGen = (id, p, gens) => { const old = LESSON_GEN[id]; LESSON_GEN[id] = () => Math.random() < p ? pick(gens)() : old(); };
/* 그림이 있는 O/X (그림 + 문장) */
const oxPic = (key, stmt, ans, hint, explain, visHtml) => cq(key, 'ox', '맞으면 O, 틀리면 X를 골라요', stmt, visHtml + `<div class="sent text-q">${esc(stmt)}</div>`, ['O', 'X'], ans, hint, explain, { cols:2, big:true });
/* 맞는 말 / 틀린 말을 반반: 맞으면 ok, 틀리면 wrong 중 하나 */
const halfOX = (ok, wrongs) => Math.random() < .5 || !wrongs.length ? [ok, 'O'] : [pick(wrongs), 'X'];
const rowH = inner => `<div class="row" style="justify-content:center;gap:8px;flex-wrap:wrap">${inner}</div>`;
const storyBox = t => `<div class="sent text-q" style="font-size:22px">${esc(t)}</div>`;
/* 덧셈·뺄셈 이야기 (수만 바꿔 1-2·2-1 둘 다 씀) */
const ST_ADD = [
  (a, b) => `줄넘기를 어제 ${a}번, 오늘 ${b}번 했어요. 모두 몇 번 했을까요?`,
  (a, b) => `구슬이 ${a}개 있는데 ${b}개를 더 모았어요. 구슬은 모두 몇 개일까요?`,
  (a, b) => `강당에 ${a}명이 있었는데 ${b}명이 더 왔어요. 강당에 있는 사람은 모두 몇 명일까요?`,
  (a, b) => `동화책을 어제 ${a}쪽 읽고, 오늘 ${b}쪽을 더 읽었어요. 모두 몇 쪽 읽었을까요?`,
  (a, b) => `스티커를 ${a}장 모았는데 ${b}장을 더 받았어요. 스티커는 모두 몇 장일까요?`,
];
const ST_SUB = [
  (a, b) => `색종이 ${a}장 중에서 ${b}장을 썼어요. 남은 색종이는 몇 장일까요?`,
  (a, b) => `귤이 ${a}개 있었는데 ${b}개를 이웃에게 나누어 주었어요. 남은 귤은 몇 개일까요?`,
  (a, b) => `운동장에 ${a}명이 있었는데 ${b}명이 집에 갔어요. 남은 사람은 몇 명일까요?`,
  (a, b) => `줄넘기를 언니는 ${a}번, 나는 ${b}번 했어요. 언니는 나보다 몇 번 더 했을까요?`,
  (a, b) => `풍선 ${a}개 중에서 ${b}개가 터졌어요. 남은 풍선은 몇 개일까요?`,
];
const storyQ = (pre, add, a, b) => { const i = rnd(0, 4), st = (add ? ST_ADD : ST_SUB)[i](a, b), r = add ? a + b : a - b;
  return nq(`${pre}${add ? '+' : '-'}${i}:${a}${add ? '+' : '-'}${b}`, 'story', '이야기를 읽고 답해요', st, storyBox(st), r, add ? '"모두 몇"을 물으면 두 수를 더해요' : '"남은 것"이나 "몇 번 더"를 물으면 빼요', `${a} ${add ? '+' : '−'} ${b} = ${r}`); };

/* 1단원 */
moreGen('1-1', .7, [
  () => { const t = rnd(3, 9); return nq(`c:x100t${t}`, 'hundred', '10이 몇 개 더 있으면 100이 될까요?', null, baseTenSVG(0, t, 0, { scale:.9 }), 10 - t, '10, 20, 30… 하고 세다가 100까지 몇 번 더 세는지 봐요', `10이 ${t}개면 ${t * 10}, 10이 ${10 - t}개 더 있으면 100`); },
  () => { const o = rnd(1, 9); return nq(`c:x100o${o}`, 'hundred', '1이 몇 개 더 있으면 100이 될까요?', null, baseTenSVG(0, 9, o, { scale:.9 }), 10 - o, `${90 + o}에서 하나씩 세어 100까지 가 봐요`, `${90 + o} + ${10 - o} = 100`); },
  () => { const step = pick([1, 2, 10]), hole = rnd(0, 3), seq = [4, 3, 2, 1, 0].map(i => 100 - step * i);
    return nq(`c:x100s${step}h${hole}`, 'skip100', `${step}씩 뛰어 세어요. 빈칸에 알맞은 수는?`, `${step}씩 뛰어 세어요`, eqH(seq.map((x, i) => i === hole ? QB : x).join(', '), true), seq[hole], `${step}씩 커져서 100까지 가요`, seq.join(', ')); },
  () => { const step = pick([1, 10]), hole = rnd(1, 4), seq = [0, 1, 2, 3, 4].map(i => 100 - step * i);
    return nq(`c:x100d${step}h${hole}`, 'skip100', `100부터 거꾸로 ${step}씩 뛰어 세어요. 빈칸에 알맞은 수는?`, null, eqH(seq.map((x, i) => i === hole ? QB : x).join(', '), true), seq[hole], `${step}씩 작아져요`, seq.join(', ')); },
  () => { const k = rnd(2, 9); return nq(`c:x100m${k}`, 'hundred', `100보다 ${k} 작은 수는?`, null, null, 100 - k, '100부터 거꾸로 세어 봐요. 99, 98…', `100보다 ${k} 작은 수는 ${100 - k}`); },
  () => { const st = pickOX([['100은 99보다 1 큰 수예요.','O'],['100은 10이 10개인 수예요.','O'],['100은 "백"이라고 읽어요.','O'],['10개씩 묶음 10개는 100이에요.','O'],['100은 90보다 10 큰 수예요.','O'],['100보다 1 작은 수는 99예요.','O'],['100은 98보다 2 큰 수예요.','O'],
      ['100은 "십"이라고 읽어요.','X'],['100은 10이 9개인 수예요.','X'],['100은 90보다 1 큰 수예요.','X'],['100은 99보다 작아요.','X'],['100보다 1 작은 수는 90이에요.','X'],['100은 80보다 10 큰 수예요.','X'],['10개씩 묶음 9개는 100이에요.','X']]);
    return ox(`c:x100ox${st[0]}`, st[0], st[1], '100은 99보다 1 큰 수, 10이 10개인 수예요', `${st[0]} → ${st[1]}`); },
]);
moreGen('1-2', .6, [
  () => { const s = rnd(1, 5) * 100, hole = rnd(1, 4), seq = [0, 1, 2, 3, 4].map(i => s + 100 * i);
    return nq(`c:xh100s${s}h${hole}`, 'skip100', '100씩 커져요. 빈칸에 알맞은 수는?', null, eqH(seq.map((x, i) => i === hole ? QB : x).join(', '), true), seq[hole], '백의 자리 숫자만 1씩 커져요', seq.join(', ')); },
  () => { const h = rnd(2, 9), w = numKo(h * 100); return nq(`c:xhko${h}`, 'writehund', `'${w}'${hasBatchim(w) ? '을' : '를'} 수로 쓰면?`, `${josa(w, '을', '를')} 수로 써 봐요`, `<div class="sent text-q"><span class="big-word">${w}</span></div>`, h * 100, '"백" 앞의 숫자를 쓰고, 뒤에 0을 두 개 붙여요', `${w} = ${h * 100}`); },
  () => { const a = rnd(1, 9); let b; do { b = rnd(1, 9); } while (b === a); const lo = Math.min(a, b) * 100, hi = Math.max(a, b) * 100;
    return cq(`c:xhcmp${lo}-${hi}`, 'hundcmp', '더 큰 수를 골라요', null, null, [lo, hi], hi, '100이 몇 개인지 비교해요', `${hi}은 100이 ${hi / 100}개, ${lo}은 100이 ${lo / 100}개라서 ${hi}이 더 커요`, { cols:2, big:true }); },
  () => { const h = rnd(2, 9); return nq(`c:xhcoin${h}`, 'money100', '100원짜리 동전이 모두 얼마일까요?', null, `<div class="pic" style="font-size:40px;line-height:1.3">${'🪙'.repeat(h)}</div><div class="muted">🪙 하나는 100원</div>`, h * 100, '100, 200, 300… 하고 세어 봐요', `100원이 ${h}개이면 ${h * 100}원`); },
  () => { const h = rnd(2, 9), ok = Math.random() < .5, k = ok ? h : pick([h - 1, h + 1].filter(x => x <= 9)), st = `${numJosa(h * 100, '은', '는')} 100이 ${k}개인 수예요.`;
    return ox(`c:xhox${h}-${k}`, st, ok ? 'O' : 'X', '백의 자리 숫자가 100이 몇 개인지 알려 줘요', `${numJosa(h * 100, '은', '는')} 100이 ${h}개`); },
]);
moreGen('1-4', .3, [
  () => { const d = [rnd(1, 9), rnd(0, 9), rnd(0, 9)], n = d[0] * 100 + d[1] * 10 + d[2];
    return nq(`c:xpvb${n}`, 'placebuild', '설명하는 세 자리 수를 써요', `백의 자리 숫자가 ${d[0]}, 십의 자리 숫자가 ${d[1]}, 일의 자리 숫자가 ${d[2]}인 수는?`, `<div class="sent text-q" style="font-size:22px">백의 자리 숫자 <b>${d[0]}</b><br>십의 자리 숫자 <b>${d[1]}</b><br>일의 자리 숫자 <b>${d[2]}</b></div>`, n, '왼쪽부터 백, 십, 일의 자리 숫자를 차례로 써요', `${n}`); },
]);
moreGen('1-5', .3, [
  () => { const step = pick([100, 10, 1]), start = step === 100 ? rnd(1, 5) * 100 + rnd(0, 9) * 10 + rnd(0, 9) : rnd(110, 880), seq = [0, 1, 2, 3].map(i => start + step * i);
    return nq(`c:xskw${start}+${step}`, 'skip2', '몇씩 뛰어 세었을까요?', null, eqH(seq.join(', '), true), step, '어느 자리 숫자가 1씩 커지는지 봐요', `${step === 100 ? '백' : step === 10 ? '십' : '일'}의 자리 숫자가 1씩 커져요 → ${step}씩`); },
]);
moreGen('1-6', .3, [
  () => { const h = rnd(1, 9), o = rnd(0, 9), big = Math.random() < .5, t = big ? rnd(0, 8) : rnd(1, 9), n = h * 100 + t * 10 + o, ans = big ? t + 1 : t - 1;
    return nq(`c:xcb${n}${big}`, 'cmpbox', `□ 안에 들어갈 수 있는 수 중에서 가장 ${big ? '작은' : '큰'} 수는?`, null, eqH(`${h}${QB}${o} ${big ? '&gt;' : '&lt;'} ${n}`, true), ans, '백의 자리와 일의 자리가 같아요. 십의 자리만 비교해요', `${h}${ans}${o} ${big ? '>' : '<'} ${n}`); },
]);

/* 2단원 */
const TRI_POOL = ['tri1','tri2','tri3','quad1','quad3','circ','open3','curve3'], QUAD_POOL = ['quad1','quad2','quad3','tri1','tri3','circ','open4','pent'];
const shapeRowQ = (pre, pool, kind, nm, hint) => { const isK = id => kind === 'circ' ? id === 'circ' : SHAPES[id].k === kind; let items, n; do { items = Array.from({ length:rnd(4, 6) }, () => pick(pool)); n = items.filter(isK).length; } while (!n);
  return nq(`${pre}${items.join('.')}`, 'countshape', `${josa(nm, '은', '는')} 모두 몇 개일까요?`, null, rowH(items.map(id => shapeSVG(id, 70)).join('')), n, hint, `${josa(nm, '은', '는')} ${n}개`); };
moreGen('2-1', .35, [() => shapeRowQ('c:xtcnt', TRI_POOL, 'tri', '삼각형', '곧은 선 3개로 둘러싸인 것만 세어요. 열려 있거나 굽은 선이 있으면 안 돼요')]);
moreGen('2-2', .35, [() => shapeRowQ('c:xqcnt', QUAD_POOL, 'quad', '사각형', '곧은 선 4개로 둘러싸인 것만 세어요. 열려 있으면 안 돼요')]);
const ROUND_THINGS = ['동전', '단추', '접시', '바퀴', '훌라후프', '시디', '동그란 거울', '컵 바닥'], NOT_ROUND = ['공책', '삼각자', '액자', '지우개', '편지 봉투', '삼각김밥', '책', '휴대 전화'];
moreGen('2-3', .7, [
  () => shapeRowQ('c:xccnt', ['circ', 'circ', 'oval', 'quad2', 'tri1', 'hex'], 'circ', '원', '어느 쪽에서 보아도 똑같이 동그란 것만 세어요. 길쭉한 것은 원이 아니에요'),
  () => { const r = pick(ROUND_THINGS), w = shuffle(NOT_ROUND).slice(0, 2);
    return cq(`c:xcth${r}|${[...w].sort()}`, 'circthing', '원 모양을 찾을 수 있는 물건은?', '테두리를 따라 그리면 원이 되는 물건은 무엇일까?', null, [r, ...w], r, '뾰족한 곳 없이 동그란 물건을 찾아요', `${josa(r, '은', '는')} 테두리가 동그래서 원 모양을 찾을 수 있어요`, { cols:1 }); },
  () => { const st = pickOX([['원은 굽은 선으로 둘러싸여 있어요.','O'],['원에는 변이 없어요.','O'],['동전의 테두리를 따라 그리면 원이 돼요.','O'],['원은 크기가 달라도 모두 동그래요.','O'],['컵 바닥을 대고 그리면 원을 그릴 수 있어요.','O'],['원에는 곧은 선이 없어요.','O'],
      ['원은 꼭짓점이 1개예요.','X'],['길쭉한 달걀 모양도 원이에요.','X'],['원에는 뾰족한 곳이 2군데 있어요.','X'],['삼각자를 대고 따라 그리면 원이 돼요.','X'],['원은 삼각형처럼 변이 3개예요.','X'],['원은 크기가 다르면 원이 아니에요.','X']]);
    return ox(`c:xcox${st[0]}`, st[0], st[1], '원: 굽은 선 하나, 변·꼭짓점 없음, 똑같이 동그래요', `${st[0]} → ${st[1]}`); },
  () => { const what = pick(['변', '꼭짓점']); return nq(`c:xc0${what}`, 'countshape', `원의 ${what}은 몇 개일까요?`, null, `<div style="width:130px;margin:auto">${shapeSVG('circ', 130)}</div>`, 0, '원은 굽은 선 하나로 되어 있어요', `원에는 ${what}이 없어요 → 0개`); },
]);
const TG_TRI = TANGRAM.filter(p => p.k === 'tri').map(p => p.n), TG_QUAD = TANGRAM.filter(p => p.k === 'quad').map(p => p.n);
moreGen('2-4', .75, [
  () => { const p = pick(TANGRAM), what = pick(['변', '꼭짓점']), n = p.k === 'tri' ? 3 : 4;
    return nq(`c:xtg${p.n}${what}`, 'tangram2', `색칠한 ${p.n}번 조각의 ${what}은 몇 개일까요?`, null, tangramSVG({ nums:true, hi:p.n }), n, what === '변' ? '곧은 선을 하나씩 세어 봐요' : '뾰족한 점을 하나씩 세어 봐요', `${p.n}번 조각은 ${p.k === 'tri' ? '삼각형' : '사각형'}이라서 ${what} ${n}개`); },
  () => { const ids = shuffle([1, 2, 3, 4, 5, 6, 7]).slice(0, 3).sort((a, b) => a - b), n = ids.filter(x => TG_TRI.includes(x)).length;
    return nq(`c:xtgc${ids.join('')}`, 'tangram2', `${ids.join('번, ')}번 조각 중에서 삼각형은 몇 개일까요?`, null, tangramSVG({ nums:true }), n, '번호를 찾아 변을 세어 봐요. 변이 3개면 삼각형', `${ids.map(x => `${x}번 ${TG_TRI.includes(x) ? '삼각형' : '사각형'}`).join(', ')} → 삼각형 ${n}개`); },
  () => { const t = pick(TG_TRI), q = pick(TG_QUAD), want = pick(['삼각형', '사각형']), [a, b] = shuffle([t, q]), ans = `${want === '삼각형' ? t : q}번`;
    return cq(`c:xtgp${t}-${q}${want}`, 'tangram2', `${a}번과 ${b}번 중에서 ${want} 조각은?`, null, tangramSVG({ nums:true }), [`${a}번`, `${b}번`], ans, '두 조각의 변을 각각 세어 봐요', `${t}번은 삼각형, ${q}번은 사각형`, { cols:2, big:true }); },
  () => { const p = pick(TANGRAM), right = p.k === 'tri' ? '삼각형' : '사각형', [st, a] = halfOX(`${p.n}번 조각은 ${right}이에요.`, [`${p.n}번 조각은 ${right === '삼각형' ? '사각형' : '삼각형'}이에요.`]);
    return oxPic(`c:xtgox${st}`, st, a, '변이 3개면 삼각형, 4개면 사각형', `${p.n}번 조각은 ${right}`, tangramSVG({ nums:true, hi:p.n, size:170 })); },
  () => nq('c:xtgdiff', 'tangram2', '칠교판에서 삼각형 조각은 사각형 조각보다 몇 개 더 많을까요?', null, tangramSVG({ nums:true }), 3, '삼각형 조각과 사각형 조각을 따로 세어 봐요', '삼각형 5개, 사각형 2개 → 3개 더 많아요'),
  () => cq('c:xtg2para', 'tangram', '작은 삼각형 두 조각을 붙여서 만든 모양은?', '작은 삼각형 두 조각을 붙여서 만든 모양은 무엇일까?', twoTriSVG('para', 110), ['삼각형', '사각형', '원'], '사각형', '바깥 테두리의 변을 세어 봐요', '바깥 변이 4개라서 사각형', { cols:3 }),
]);

/* 3단원 */
moreGen('3-1', .3, [() => { let a, b; do { a = rnd(13, 89); b = rnd(2, 9); } while ((a % 10) + b < 10 || a + b > 99); return storyQ('c:xst1', true, a, b); }]);
moreGen('3-2', .3, [() => { let a, b; do { a = rnd(21, 89); b = rnd(14, 89); } while ((a % 10) + (b % 10) < 10 || a + b > 99 || b % 10 === 0); return storyQ('c:xst2', true, a, b); }]);
moreGen('3-3', .3, [() => { let a, b; do { a = rnd(21, 95); b = rnd(2, 9); } while ((a % 10) >= b); return storyQ('c:xst3', false, a, b); }]);
moreGen('3-4', .3, [() => { let a, b; do { a = rnd(31, 95); b = rnd(12, a - 10); } while ((a % 10) >= (b % 10) || b % 10 === 0); return storyQ('c:xst4', false, a, b); }]);
const ST3 = [
  (a, o1, b, o2, c) => `버스에 ${a}명이 타고 있었어요. 첫째 정류장에서 ${b}명이 ${o1 === '+' ? '타고' : '내리고'}, 둘째 정류장에서 ${c}명이 ${o2 === '+' ? '탔어요' : '내렸어요'}. 지금 버스에 탄 사람은 몇 명일까요?`,
  (a, o1, b, o2, c) => `구슬이 ${a}개 있었어요. 언니에게 ${b}개를 ${o1 === '+' ? '받고' : '주고'}, 동생에게 ${c}개를 ${o2 === '+' ? '받았어요' : '주었어요'}. 지금 구슬은 몇 개일까요?`,
  (a, o1, b, o2, c) => `주차장에 자동차가 ${a}대 있었어요. ${b}대가 ${o1 === '+' ? '들어오고' : '나가고'}, ${c}대가 ${o2 === '+' ? '들어왔어요' : '나갔어요'}. 지금 주차장에 있는 자동차는 몇 대일까요?`,
];
moreGen('3-5', .3, [() => { let a, b, c, o1, o2, r1, ans; do { a = rnd(12, 60); b = rnd(5, 39); c = rnd(5, 30); o1 = pick(['+', '−']); o2 = pick(['+', '−']); r1 = o1 === '+' ? a + b : a - b; ans = o2 === '+' ? r1 + c : r1 - c; } while (r1 < 0 || r1 > 99 || ans < 0 || ans > 99);
  const i = rnd(0, 2), st = ST3[i](a, o1, b, o2, c);
  return nq(`c:xst3n${i}:${a}${o1}${b}${o2}${c}`, 'story3', '이야기를 읽고 답해요', st, storyBox(st), ans, '타거나 받으면 더하기, 내리거나 주면 빼기. 앞에서부터 차례로 계산해요', `${a} ${o1} ${b} = ${r1}, ${r1} ${o2} ${c} = ${ans}`); }]);
moreGen('3-6', .3, [() => { let a, b; do { a = rnd(6, 49); b = rnd(5, 40); } while (a === b || a + b > 89); const c = a + b;
  const [st, ans] = halfOX(`${a} + ${b} = ${numJosa(c, '이면', '면')} ${c} − ${a} = ${numJosa(b, '이에요', '예요')}.`, [`${a} + ${b} = ${numJosa(c, '이면', '면')} ${c} − ${a} = ${numJosa(a, '이에요', '예요')}.`, `${a} + ${b} = ${numJosa(c, '이면', '면')} ${c} + ${a} = ${numJosa(b, '이에요', '예요')}.`, `${a} + ${b} = ${numJosa(c, '이면', '면')} ${a} − ${b} = ${numJosa(c, '이에요', '예요')}.`]);
  return ox(`c:xrelox${st}`, st, ans, '덧셈식의 가장 큰 수에서 한 수를 빼면 다른 한 수가 남아요', `${a} + ${b} = ${c} → ${c} − ${a} = ${b}, ${c} − ${b} = ${a}`); }]);
moreGen('3-7', .3, [() => { const a = rnd(6, 49); let b; do { b = rnd(5, 40); } while (b === a); const c = a + b, v = rnd(0, 2);
  const shown = v === 0 ? `${QB} + ${a} = ${c}` : v === 1 ? `${a} + ${QB} = ${c}` : `${c} − ${QB} = ${b}`, ans = v === 2 ? a : b;
  const opts = [ans, ...shuffle([c + a, ans + 10, ans - 10, ans + 1, ans - 1].filter(x => x > 0)).slice(0, 2)];
  return cq(`c:xmc${v}:${a}-${b}`, 'missing2', '□에 알맞은 수를 골라요', null, eqH(shown, true), opts, ans, v === 2 ? `${c} − ${numJosa(b, '을', '를')} 계산해요` : `${c} − ${numJosa(a, '을', '를')} 계산해요`, v === 2 ? `${c} − ${b} = ${a}` : `${c} − ${a} = ${b}`, { cols:3, big:true }); }]);

/* 4단원 */
const LEN_THINGS = ['연필', '크레파스', '리본', '색연필', '막대', '붓'];
moreGen('4-1', .7, [
  () => { const [o1, o2] = shuffle(LEN_THINGS).slice(0, 2), n = rnd(3, 8); let m; do { m = rnd(3, 8); } while (m === n); const L = n > m ? o1 : o2;
    return cq(`c:xlcmp${o1}${n}-${o2}${m}`, 'unitcmp', '더 긴 것은 무엇일까요?', `${josa(o1, '은', '는')} 클립 ${n}개, ${josa(o2, '은', '는')} 클립 ${m}개만큼이에요. 더 긴 것은?`, clipsSVG(n, o1) + clipsSVG(m, o2), [o1, o2], L, '같은 클립으로 쟀으니 클립 수가 많은 쪽이 더 길어요', `${o1} 클립 ${n}개, ${o2} 클립 ${m}개 → ${josa(L, '이', '가')} 더 길어요`, { cols:2 }); },
  () => { const [o1, o2] = shuffle(LEN_THINGS).slice(0, 2), m = rnd(2, 6), n = rnd(m + 1, 9);
    return nq(`c:xldif${o1}${n}-${o2}${m}`, 'clipdiff', `${josa(o1, '은', '는')} ${o2}보다 클립 몇 개만큼 더 길까요?`, null, clipsSVG(n, o1) + clipsSVG(m, o2), n - m, '두 줄의 클립 수를 각각 세어 봐요', `${n} − ${m} = ${n - m} → 클립 ${n - m}개만큼 더 길어요`); },
  () => { const n = rnd(3, 9); let m; do { m = rnd(3, 9); } while (m === n); const L = n < m ? '빨간 막대' : '파란 막대';
    return cq(`c:xlunit${n}-${m}`, 'unitcmp', '더 긴 막대는 어느 것일까요?', null, storyBox(`같은 리본을 빨간 막대로 재면 ${n}번, 파란 막대로 재면 ${m}번이에요.`), ['빨간 막대', '파란 막대'], L, '긴 막대로 재면 적은 번수로 다 잴 수 있어요', `${Math.min(n, m)}번만 잰 ${josa(L, '이', '가')} 더 길어요`, { cols:2 }); },
  () => { const st = pickOX([['길이를 잴 때 쓰는 클립, 뼘 같은 것을 단위라고 해요.','O'],['같은 길이를 긴 단위로 재면 잰 횟수가 더 적어요.','O'],['클립으로 잴 때는 빈틈 없이 이어서 재요.','O'],['모두 같은 단위로 재면 길이를 비교하기 쉬워요.','O'],['뼘은 손을 쫙 펴서 엄지부터 새끼손가락까지의 길이예요.','O'],
      ['발걸음으로 재면 누가 재어도 똑같은 수가 나와요.','X'],['같은 길이를 짧은 단위로 재면 잰 횟수가 더 적어요.','X'],['사람마다 뼘의 길이는 모두 똑같아요.','X'],['클립으로 잴 때 클립을 띄엄띄엄 놓아도 돼요.','X'],['단위가 다르면 길이를 비교하기가 더 쉬워요.','X']]);
    return ox(`c:xlox${st[0]}`, st[0], st[1], '단위가 짧을수록 여러 번 재야 해요', `${st[0]} → ${st[1]}`); },
]);
moreGen('4-2', .7, [
  () => { const n = rnd(2, 10); return nq(`c:xcmb${n}`, 'cmblock', '쌓기나무 한 개의 길이가 1 cm예요. 모두 몇 cm일까요?', '쌓기나무 한 개의 길이가 1센티미터예요. 모두 몇 센티미터일까?', cubesSVG(Array(n).fill(1)), n, '1 cm가 몇 번인지 세어 봐요', `1 cm가 ${n}번이면 ${n} cm`); },
  () => { const a = rnd(2, 15); let b; do { b = rnd(2, 15); } while (b === a); const lo = Math.min(a, b), hi = Math.max(a, b);
    return cq(`c:xcmc${lo}-${hi}`, 'cmcmp', '더 긴 길이를 골라요', `${lo}센티미터와 ${hi}센티미터 중에서 더 긴 것은?`, null, [`${lo} cm`, `${hi} cm`], `${hi} cm`, '1 cm가 더 많이 들어가는 쪽이 더 길어요', `${hi} cm는 1 cm가 ${hi}번이라서 더 길어요`, { cols:2, big:true }); },
  () => { const n = rnd(2, 12), ok = Math.random() < .5, x = ok ? n : pick([n - 1, n + 1, n + 10].filter(v => v >= 1)), st = `1 cm가 ${n}번이면 ${x} cm예요.`;
    return ox(`c:xcmox${n}-${x}`, st, ok ? 'O' : 'X', '1 cm가 ■번이면 ■ cm', `1 cm가 ${n}번이면 ${n} cm`); },
]);
moreGen('4-3', .6, [
  () => { const [o1, o2] = shuffle(['연필', '지우개', '크레파스', '머리핀', '리본', '색연필']).slice(0, 2), l1 = rnd(3, 9); let l2; do { l2 = rnd(3, 9); } while (l2 === l1);
    const s1 = Math.random() < .5 ? 0 : rnd(1, 4), s2 = rnd(1, 4), L = l1 > l2 ? o1 : o2;
    return cq(`c:xrucmp${s1}-${l1}|${s2}-${l2}${o1}${o2}`, 'rulercmp', '더 긴 것은 무엇일까요?', '자로 잰 두 물건 중에서 더 긴 것은 무엇일까?', rulerSVG(s1, s1 + l1, { label:o1 }) + rulerSVG(s2, s2 + l2, { label:o2, color:C.sky }), [o1, o2], L, '끝 눈금만 보면 안 돼요. 시작한 곳부터 1 cm가 몇 번인지 세어요', `${o1} ${l1} cm, ${o2} ${l2} cm → ${josa(L, '이', '가')} 더 길어요`, { cols:2 }); },
  () => { const s = rnd(1, 4), len = rnd(2, 9), obj = pick(['연필', '지우개', '크레파스', '머리핀']), ok = Math.random() < .5, x = ok ? len : s + len, st = `${obj}의 길이는 ${x} cm예요.`;
    return oxPic(`c:xruox${s}-${len}-${x}`, st, ok ? 'O' : 'X', `${s}에서 시작했어요. 끝 눈금이 아니라 1 cm가 몇 번인지 세어요`, `${s + len} − ${s} = ${len} → ${len} cm`, rulerSVG(s, s + len, { label:obj })); },
  () => { const s = rnd(0, 3), len = rnd(10, 12), obj = pick(['붓', '리본', '색연필']);
    return nq(`c:xru${s}-${len}`, 'ruler', `${obj}의 길이는 몇 cm일까요?`, `${obj}의 길이는 몇 센티미터일까?`, rulerSVG(s, s + len, { label:obj }), len, s ? `${s}에서 시작했어요. ${s}부터 1 cm가 몇 번 들어가는지 세어 봐요` : '0에 맞추고 끝에 있는 눈금을 읽어요', s ? `${s + len} − ${s} = ${len} cm` : `${len} cm`); },
]);
moreGen('4-4', .75, [
  () => { const obj = pick(['연필', '크레파스', '리본', '색연필', '붓']), L = rnd(4, 14); let a, b; do { a = L + rnd(-4, 4); b = L + rnd(-4, 4); } while (a < 2 || b < 2 || a === b || Math.abs(a - L) === Math.abs(b - L)); const win = Math.abs(a - L) < Math.abs(b - L) ? '재윤' : '지호';
    return cq(`c:xestc${L}-${a}-${b}`, 'estcmp', '자로 잰 길이에 더 가깝게 어림한 사람은?', `${obj}의 길이를 재윤이는 약 ${a}센티미터, 지호는 약 ${b}센티미터로 어림했어요. 자로 잰 길이와 더 가까운 사람은?`, rulerSVG(0, L, { label:obj }) + storyBox(`재윤: 약 ${a} cm · 지호: 약 ${b} cm`), ['재윤', '지호'], win, '자로 잰 길이를 먼저 읽고, 누구 어림이 더 가까운지 봐요', `잰 길이 ${L} cm. 재윤 ${Math.abs(a - L)} cm 차이, 지호 ${Math.abs(b - L)} cm 차이 → ${win}`, { cols:2, big:true }); },
  () => { const obj = pick(['연필', '크레파스', '리본', '색연필', '붓']), L = rnd(4, 14); let a; do { a = L + rnd(-4, 4); } while (a === L || a < 2);
    return nq(`c:xestd${L}-${a}`, 'estdiff', `약 ${a} cm로 어림했어요. 자로 잰 길이와 몇 cm 차이가 날까요?`, `약 ${a}센티미터로 어림했어요. 자로 잰 길이와 몇 센티미터 차이가 날까?`, rulerSVG(0, L, { label:obj }), Math.abs(a - L), '자로 잰 길이를 읽고, 큰 수에서 작은 수를 빼요', `잰 길이 ${L} cm, 어림 ${a} cm → ${Math.max(a, L)} − ${Math.min(a, L)} = ${Math.abs(a - L)} cm`); },
  () => { const st = pickOX([['자를 쓰지 않고 길이를 짐작하는 것을 어림이라고 해요.','O'],['어림한 길이를 말할 때는 "약"을 붙여요.','O'],['손가락 한 마디는 약 1 cm예요.','O'],['30 cm 자는 연필보다 길어요.','O'],['어림을 잘하면 잰 길이와 차이가 작아요.','O'],
      ['어림한 길이는 자로 잰 길이와 언제나 똑같아요.','X'],['연필의 길이는 약 1 cm예요.','X'],['클립의 길이는 약 30 cm예요.','X'],['지우개의 길이는 약 50 cm예요.','X'],['숟가락의 길이는 약 2 cm예요.','X']]);
    return ox(`c:xestox${st[0]}`, st[0], st[1], '어림: 자 없이 짐작, "약"을 붙여요', `${st[0]} → ${st[1]}`); },
]);

/* 5단원 */
const CRIT_GOOD = ['색깔', '모양', '다리의 수', '바퀴의 수', '구멍의 수', '사는 곳', '날개가 있는지', '재료'], CRIT_BAD = ['예쁜 것', '좋아하는 것', '귀여운 것', '멋있는 것', '맛있는 것', '재미있는 것', '무서운 것', '갖고 싶은 것'];
const CRIT_SCENES = [
  ['🍎🍓🍒', '🍌🍋🌽', '색깔', ['다리의 수', '바퀴의 수']], ['🐶🐱🐰', '🐔🦆🐧', '다리의 수', ['색깔', '바퀴의 수']], ['🚲🛵', '🚗🚕🚌', '바퀴의 수', ['다리의 수', '사는 곳']],
  ['🐟🐙🐬', '🐶🐮🐷', '사는 곳', ['바퀴의 수', '구멍의 수']], ['🔴🟠⚪', '🟥🟧⬜', '모양', ['다리의 수', '사는 곳']], ['🐝🦋🐦', '🐌🐛🐢', '날개가 있는지', ['바퀴의 수', '구멍의 수']],
  ['🟦🔷💙', '🟨⭐💛', '색깔', ['날개가 있는지', '다리의 수']], ['🍎🍐🍊', '🥕🥦🌽', '과일과 채소', ['다리의 수', '날개가 있는지']],
];
moreGen('5-1', .75, [
  () => { const bad = pick(CRIT_BAD), good = shuffle(CRIT_GOOD).slice(0, 2);
    return cq(`c:xcritx${bad}|${[...good].sort()}`, 'criterion', '분류 기준이 될 수 없는 것은?', null, null, [bad, ...good], bad, '사람마다 생각이 다를 수 있는 기준을 찾아요', `"${bad}"${hasBatchim(bad) ? '은' : '는'} 사람마다 생각이 달라서 기준이 될 수 없어요`, { cols:1 }); },
  () => { const good = pick(CRIT_GOOD), bad = shuffle(CRIT_BAD).slice(0, 2);
    return cq(`c:xcrit${good}|${[...bad].sort()}`, 'criterion', '분류 기준으로 알맞은 것은?', null, null, [good, ...bad], good, '누가 나누어도 결과가 똑같은 기준을 골라요', `"${good}"${hasBatchim(good) ? '은' : '는'} 누가 나누어도 결과가 같아요`, { cols:1 }); },
  () => { const i = rnd(0, CRIT_SCENES.length - 1), [g1, g2, ans, w] = CRIT_SCENES[i];
    return cq(`c:xcritg${i}`, 'critscene', '어떤 기준으로 나누었을까요?', '두 묶음으로 나누었어요. 어떤 기준으로 나누었을까?', rowH(`<span class="grp-box" style="font-size:36px">${g1}</span><span class="grp-box" style="font-size:36px">${g2}</span>`), [ans, ...w], ans, '두 묶음이 서로 어떻게 다른지 찾아봐요', `${ans}에 따라 나누었어요`, { cols:1 }); },
  () => { const good = Math.random() < .5, w = good ? pick(CRIT_GOOD) : pick(CRIT_BAD), j = hasBatchim(w) ? '은' : '는', st = `"${w}"${j} 누가 나누어도 결과가 같은 분류 기준이에요.`;
    return ox(`c:xcritox${w}`, st, good ? 'O' : 'X', '사람마다 생각이 다르면 분류 기준이 될 수 없어요', good ? `"${w}"${j} 누가 나누어도 결과가 같아요` : `"${w}"${j} 사람마다 생각이 달라요`); },
]);
moreGen('5-2', .3, [() => { let items, s, c, n; do { items = classifySet(); s = pick(['tri1', 'quad2', 'circ']); c = pick(Object.keys(CLS_COLORS)); n = items.filter(it => it.s === s && it.c === c).length; } while (!n);
  const label = `${CLS_COLORS[c]} ${SHAPE_NAME[SHAPES[s].k]}`;
  return nq(`c:xcls2${items.map(i => i.s[0] + i.c[0]).join('')}${s}${c}`, 'classify2', `${josa(label, '은', '는')} 몇 개일까요?`, null, classifyHTML(items), n, '색깔과 모양이 둘 다 맞는 것만 세어요', `${label}: ${n}개`); }]);
moreGen('5-3', .3, [() => { let items, counts, a, b; do { items = classifySet(); counts = { tri1:0, quad2:0, circ:0 }; items.forEach(i => counts[i.s]++); [a, b] = shuffle(Object.keys(counts)).slice(0, 2); } while (counts[a] <= counts[b]);
  const na = SHAPE_NAME[SHAPES[a].k], nb = SHAPE_NAME[SHAPES[b].k];
  return nq(`c:xclsd${items.map(i => i.s[0]).join('')}${a}${b}`, 'classifydiff', `${josa(na, '은', '는')} ${nb}보다 몇 개 더 많을까요?`, null, classifyHTML(items), counts[a] - counts[b], '모양별로 나누어 센 다음, 큰 수에서 작은 수를 빼요', `${na} ${counts[a]}개, ${nb} ${counts[b]}개 → ${counts[a]} − ${counts[b]} = ${counts[a] - counts[b]}`); }]);

/* 6단원 */
moreGen('6-1', .35, [() => { const step = pick([2, 3, 4, 5, 10]), start = step * rnd(1, 4), seq = [0, 1, 2, 3].map(i => start + step * i);
  return nq(`c:xskst${step}-${start}`, 'skip2', '몇씩 뛰어 세었을까요?', null, eqH(seq.join(', '), true), step, '이웃한 두 수의 차이를 봐요', `${seq.join(', ')} → ${step}씩 커져요`); }]);
const GE_THINGS = COUNT_THINGS.filter(x => ['딸기','사과','별','과자','컵케이크','사탕','풍선'].includes(x[1]));
moreGen('6-2', .35, [() => { const g = rnd(2, 5), k = rnd(2, 5), [e, name] = pick(GE_THINGS);
  return nq(`c:xgrp${e}${g}x${k}`, 'groupcount', `${josa(name, '을', '를')} ${g}개씩 묶으면 몇 묶음일까요?`, null, `<div class="pic" style="font-size:34px;line-height:1.35;max-width:420px;margin:auto">${e.repeat(g * k)}</div>`, k, `${g}개씩 손가락으로 묶어 가며 세어 봐요`, `${g * k}개를 ${g}개씩 묶으면 ${k}묶음`); }]);
moreGen('6-3', .65, [
  () => { const a = rnd(2, 6), b = rnd(2, 5), [e] = pick(COUNT_THINGS);
    return nq(`c:xbaev${a}x${b}${e}`, 'baeval', `${a}의 ${b}배는 얼마일까요?`, null, groupsHTML(e, b, a), a * b, `${a}씩 ${b}묶음을 세어 봐요. ${Array.from({ length:b }, (_, i) => a * (i + 1)).join(', ')}`, `${a}의 ${b}배는 ${a * b}`); },
  () => { const a = rnd(2, 5), b = rnd(2, 5), [e] = pick(COUNT_THINGS), [st, ans] = halfOX(`${a}씩 ${b}묶음은 ${a}의 ${b}배예요.`, [`${a}씩 ${b}묶음은 ${a}의 ${b + 1}배예요.`, ...(b > 2 ? [`${a}씩 ${b}묶음은 ${a}의 ${b - 1}배예요.`] : []), ...(a !== b ? [`${a}씩 ${b}묶음은 ${a}의 ${a}배예요.`] : [])]);
    return oxPic(`c:xbaeox${st}`, st, ans, '묶음의 수가 몇 배인지 알려 줘요', `${a}씩 ${b}묶음은 ${a}의 ${b}배`, groupsHTML(e, b, a)); },
]);
moreGen('6-4', .75, [
  () => { let a, b; do { a = rnd(2, 6); b = rnd(2, 5); } while (a + b === a * b); const c = a * b, x = pick([c + a, c + 1, c - 1]);
    const right = `${a} 곱하기 ${numJosa(b, '은', '는')} ${numJosa(c, '과', '와')} 같습니다`;
    return cq(`c:xmrd${a}x${b}`, 'mulread', `${a} × ${b} = ${numJosa(c, '을', '를')} 바르게 읽은 것은?`, null, eqH(`${a} × ${b} = ${c}`, true), [right, `${a} 더하기 ${numJosa(b, '은', '는')} ${numJosa(a + b, '과', '와')} 같습니다`, `${a} 곱하기 ${numJosa(b, '은', '는')} ${numJosa(x, '과', '와')} 같습니다`], right, '×는 "곱하기", =는 "같습니다"라고 읽어요', right, { cols:1 }); },
  () => { const a = rnd(2, 6), b = rnd(2, 5), right = `${a} × ${b}`;
    return cq(`c:xmxb${a}x${b}`, 'mulexpr', `${a}의 ${b}배를 곱셈식으로 나타내면?`, null, null, [right, `${a} + ${b}`, `${a} × ${b + 1}`], right, `${a}의 ${b}배는 ${a} × ${b}라고 써요`, `${a}의 ${b}배 = ${a} × ${b}`, { cols:3, big:true }); },
  () => { const a = rnd(2, 6), b = rnd(2, 5), [e] = pick(COUNT_THINGS);
    return nq(`c:xmxv${a}x${b}${e}`, 'mul', '그림을 보고 □에 알맞은 수를 써요', `${a}씩 ${b}묶음이에요. ${a} 곱하기 ${numJosa(b, '은', '는')}?`, groupsHTML(e, b, a) + eqH(`${a} × ${b} = ${QB}`), a * b, `${a}씩 ${b}번 뛰어 세어 봐요`, `${a} × ${b} = ${a * b}`); },
]);
const ST_MUL = [
  (a, b) => [`한 접시에 쿠키가 ${a}개씩 있어요. ${b}접시에 있는 쿠키는 모두 몇 개일까요?`, '개'],
  (a, b) => [`꽃병 하나에 꽃을 ${a}송이씩 꽂았어요. 꽃병 ${b}개에 꽂은 꽃은 모두 몇 송이일까요?`, '송이'],
  (a, b) => [`한 상자에 연필이 ${a}자루씩 들어 있어요. ${b}상자에 든 연필은 모두 몇 자루일까요?`, '자루'],
  (a, b) => [`의자 한 줄에 ${a}명씩 앉았어요. ${b}줄에 앉은 사람은 모두 몇 명일까요?`, '명'],
];
moreGen('6-5', .4, [() => { const a = rnd(2, 9), b = rnd(2, 5), i = rnd(0, ST_MUL.length - 1), [st, u] = ST_MUL[i](a, b);
  return nq(`c:xmst${i}:${a}x${b}`, 'mulstory', '이야기를 읽고 곱셈식으로 구해요', st, storyBox(st), a * b, `${a}씩 ${b}묶음이에요. ${a} × ${b}`, `${a} × ${b} = ${a * b}${u}`); }]);

/* ---------- 단원 · 차시 ---------- */
const CURRICULUM = {
  title:'초2 1학기 수학', subj:'math', short:'수학',
  ebs:{ id:'100006191', name:'만점왕 수학 2-1', teacher:'정소현 선생님' },
  units:[
    { n:1, name:'세 자리 수', rev:6, lessons:[
      { id:'1-1', ebs:[1], title:'100을 알아볼까요', cards:[
        { ill:() => baseTenSVG(0, 9, 9, { scale:1 }), text:'10개씩 묶음 9개와 낱개 9개는 99예요.', say:'십 모형 아홉 개와 일 모형 아홉 개는 구십구예요.' },
        { ill:() => baseTenSVG(1, 0, 0, { scale:1.4 }), text:'99보다 1 큰 수가 100이에요. "백"이라고 읽어요. 10이 10개 모이면 100이 돼요.', say:'구십구보다 1 큰 수를 백이라고 해요. 십이 열 개 모이면 백이 돼요.' } ] },
      { id:'1-2', title:'몇백을 알아볼까요', cards:[
        { ill:() => baseTenSVG(3, 0, 0, { scale:1 }), text:'100이 3개이면 300이에요. "삼백"이라고 읽어요.', say:'백이 세 개이면 삼백이에요.' },
        { ill:() => eqH('100, 200, 300, 400, 500 …', true), text:'100씩 커지면 백의 자리 숫자만 1씩 커져요.', say:'백, 이백, 삼백, 사백, 오백. 백씩 커져요.' } ] },
      { id:'1-3', ebs:[2], title:'세 자리 수를 쓰고 읽어 볼까요', cards:[
        { ill:() => baseTenSVG(2, 4, 7, { scale:1 }), text:'100이 2개, 10이 4개, 1이 7개이면 247이에요. "이백사십칠"이라고 읽어요.', say:'백이 두 개, 십이 네 개, 일이 일곱 개이면 이백사십칠이에요.' },
        { ill:() => eqH('305 → 삼백오'), text:'0이 있는 자리는 읽지 않아요. 305는 "삼백오"예요.', say:'영이 있는 자리는 읽지 않아요. 삼백오.' } ] },
      { id:'1-4', title:'각 자리의 숫자는 얼마를 나타낼까요', cards:[
        { ill:() => `<table class="pv"><tr><th>백의 자리</th><th>십의 자리</th><th>일의 자리</th></tr><tr><td>5</td><td>6</td><td>8</td></tr><tr><td>500</td><td>60</td><td>8</td></tr></table>`, text:'568에서 5는 500, 6은 60, 8은 8을 나타내요.', say:'오백육십팔에서 5는 오백, 6은 육십, 8은 팔을 나타내요.' },
        { ill:() => eqH('568 = 500 + 60 + 8', true), text:'그래서 568 = 500 + 60 + 8 로 나눠 쓸 수 있어요.', say:'오백육십팔은 오백 더하기 육십 더하기 팔이에요.' } ] },
      { id:'1-5', ebs:[3], title:'뛰어 세어 볼까요', cards:[
        { ill:() => eqH('120, 220, 320, 420', true), text:'100씩 뛰어 세면 백의 자리 숫자가 1씩 커져요.', say:'백씩 뛰어 세면 백의 자리 숫자가 하나씩 커져요.' },
        { ill:() => eqH('345, 355, 365, 375', true), text:'10씩 뛰어 세면 십의 자리 숫자가, 1씩 뛰어 세면 일의 자리 숫자가 1씩 커져요.', say:'십씩 뛰어 세면 십의 자리 숫자가 커지고, 일씩 뛰어 세면 일의 자리 숫자가 커져요.' } ] },
      { id:'1-6', ebs:[4], title:'두 수의 크기를 비교해 볼까요', cards:[
        { ill:() => eqH('<span style="color:#EE5F8D">4</span>27 &gt; <span style="color:#EE5F8D">3</span>98', true), text:'백의 자리 숫자부터 비교해요. 4가 3보다 크니까 427이 더 커요.', say:'백의 자리 숫자부터 비교해요.' },
        { ill:() => eqH('5<span style="color:#EE5F8D">6</span>1 &gt; 5<span style="color:#EE5F8D">2</span>9', true), text:'백의 자리가 같으면 십의 자리를, 십의 자리도 같으면 일의 자리를 비교해요. 입을 벌린 쪽이 큰 수예요.', say:'백의 자리가 같으면 십의 자리를 비교해요. 입을 벌린 쪽이 더 큰 수예요.' } ] },
    ] },
    { n:2, name:'여러 가지 도형', rev:13, lessons:[
      { id:'2-1', ebs:[9], title:'삼각형(△)을 알아볼까요', cards:[
        { ill:() => shapeSVG('tri1', 170, { marks:true }), text:'곧은 선 3개로 둘러싸인 도형을 삼각형이라고 해요. 곧은 선을 "변", 두 변이 만나는 점을 "꼭짓점"이라고 해요.', say:'곧은 선 세 개로 둘러싸인 도형을 삼각형이라고 해요. 곧은 선은 변, 만나는 점은 꼭짓점이에요.' },
        { ill:() => `<div class="row" style="justify-content:center;gap:16px">${shapeSVG('open3', 100)}${shapeSVG('curve3', 100)}</div>`, text:'열려 있거나 굽은 선이 있으면 삼각형이 아니에요.', say:'열려 있거나 굽은 선이 있으면 삼각형이 아니에요.' } ] },
      { id:'2-2', title:'사각형(□)을 알아볼까요', cards:[
        { ill:() => `<div class="row" style="justify-content:center;gap:16px">${shapeSVG('quad1', 120, { marks:true })}${shapeSVG('quad3', 120, { marks:true })}</div>`, text:'곧은 선 4개로 둘러싸인 도형을 사각형이라고 해요. 변이 4개, 꼭짓점이 4개예요.', say:'곧은 선 네 개로 둘러싸인 도형을 사각형이라고 해요. 변도 네 개, 꼭짓점도 네 개예요.' } ] },
      { id:'2-3', ebs:[10], title:'원(○)을 알아볼까요', cards:[
        { ill:() => shapeSVG('circ', 170), text:'어느 쪽에서 보아도 똑같이 동그란 모양을 원이라고 해요. 원에는 곧은 선도, 꼭짓점도 없어요.', say:'어느 쪽에서 보아도 똑같이 동그란 모양을 원이라고 해요. 원에는 꼭짓점이 없어요.' },
        { ill:() => `<div class="row" style="justify-content:center;gap:16px">${shapeSVG('circ', 100)}${shapeSVG('oval', 100)}</div>`, text:'길쭉한 모양은 똑같이 동그랗지 않아서 원이 아니에요.', say:'길쭉한 모양은 원이 아니에요.' } ] },
      { id:'2-4', title:'칠교판으로 모양을 만들어 볼까요', cards:[
        { ill:() => tangramSVG({ nums:true, size:200 }), text:'칠교판은 정사각형 하나를 일곱 조각으로 나눈 놀잇감이에요. 삼각형 조각이 5개, 사각형 조각이 2개예요.', say:'칠교판은 일곱 조각이에요. 삼각형 조각이 다섯 개, 사각형 조각이 두 개예요.' },
        { ill:() => `<div class="row" style="justify-content:center;gap:18px">${twoTriSVG('square', 90)}${twoTriSVG('tri', 90)}</div>`, text:'작은 삼각형 두 조각을 붙이면 사각형도, 더 큰 삼각형도 만들 수 있어요. 조각을 돌리고 뒤집어서 여러 모양을 만들어 봐요.', say:'작은 삼각형 두 개를 붙이면 사각형도 되고, 큰 삼각형도 돼요.' } ] },
      { id:'2-5', ebs:[11], title:'쌓은 모양을 알아볼까요', cards:[
        { ill:() => cubesSVG([2, 1, 3]), text:'쌓기나무는 한 줄씩, 아래에서 위로 세면 빠뜨리지 않아요. 2 + 1 + 3 = 6개예요.', say:'쌓기나무는 한 줄씩 세어요. 이 더하기 일 더하기 삼은 여섯 개예요.' },
        { ill:() => cubesSVG([1, 2], { hi:[0, 0] }), text:'빨간 쌓기나무의 오른쪽에 쌓기나무가 있고, 그 위에 하나가 더 있어요. 위, 아래, 왼쪽, 오른쪽으로 자리를 말해요.', say:'빨간 쌓기나무 오른쪽에 하나, 그 위에 하나 더 있어요. 위, 아래, 왼쪽, 오른쪽으로 말해요.' } ] },
    ] },
    { n:3, name:'덧셈과 뺄셈', rev:25, lessons:[
      { id:'3-1', ebs:[16], title:'받아올림이 있는 (두 자리 수) + (한 자리 수)', cards:[
        { ill:() => baseTenSVG(0, 2, 7, { scale:1 }) + eqH('27 + 8', true), text:'27 + 8에서 일의 자리끼리 7 + 8 = 15예요.', say:'이십칠 더하기 팔. 먼저 일의 자리끼리 칠 더하기 팔은 십오예요.' },
        { ill:() => baseTenSVG(0, 3, 5, { scale:1 }) + eqH('27 + 8 = 35', true), text:'15에서 10은 십의 자리로 올려 보내고 5만 남겨요. 그래서 35예요.', say:'십오에서 십은 십의 자리로 올려요. 그래서 삼십오예요.' } ] },
      { id:'3-2', ebs:[17], title:'받아올림이 있는 (두 자리 수) + (두 자리 수)', cards:[
        { ill:() => `<table class="pv"><tr><td></td><td class="carry">1</td><td></td></tr><tr><td></td><td>3</td><td>8</td></tr><tr><td>+</td><td>2</td><td>5</td></tr><tr class="sum"><td></td><td>6</td><td>3</td></tr></table>`, text:'세로로 쓰고 일의 자리부터 더해요. 8 + 5 = 13에서 1을 십의 자리 위에 작게 쓰고 같이 더해요.', say:'일의 자리부터 더해요. 팔 더하기 오는 십삼. 일을 십의 자리로 올려요.' },
        { ill:() => `<table class="pv"><tr><td class="carry">1</td><td class="carry">1</td><td></td></tr><tr><td></td><td>6</td><td>8</td></tr><tr><td>+</td><td>5</td><td>7</td></tr><tr class="sum"><td>1</td><td>2</td><td>5</td></tr></table>`, text:'68 + 57: 8 + 7 = 15, 1을 올려요. 십의 자리는 1 + 6 + 5 = 12. 십의 자리에서도 10이 넘으면 백의 자리로 1을 올려요. 답은 125예요.', say:'십의 자리끼리 더해서 십이 넘으면 백의 자리로 일을 올려요. 육십팔 더하기 오십칠은 백이십오.' } ] },
      { id:'3-3', ebs:[18], title:'받아내림이 있는 (두 자리 수) − (한 자리 수)', cards:[
        { ill:() => baseTenSVG(0, 3, 2, { scale:1 }) + eqH('32 − 7', true), text:'32 − 7에서 일의 자리 2에서 7을 뺄 수 없어요.', say:'삼십이 빼기 칠. 이에서 칠을 뺄 수 없어요.' },
        { ill:() => baseTenSVG(0, 2, 12, { scale:1 }) + eqH('12 − 7 = 5 → 25', true), text:'십 모형 1개를 일 모형 10개로 바꿔요. 12 − 7 = 5, 남은 십 모형은 2개. 그래서 25예요.', say:'십 모형 하나를 일 모형 열 개로 바꿔요. 십이 빼기 칠은 오. 그래서 이십오예요.' } ] },
      { id:'3-4', ebs:[19], title:'받아내림이 있는 (두 자리 수) − (두 자리 수)', cards:[
        { ill:() => `<table class="pv"><tr><td></td><td class="carry">4</td><td class="carry">10</td></tr><tr><td></td><td><s>5</s></td><td>2</td></tr><tr><td>−</td><td>1</td><td>7</td></tr><tr class="sum"><td></td><td>3</td><td>5</td></tr></table>`, text:'52 − 17: 일의 자리 2에서 7을 뺄 수 없으니 십의 자리에서 10을 빌려와요. 12 − 7 = 5, 4 − 1 = 3. 답은 35예요.', say:'일의 자리에서 뺄 수 없으면 십의 자리에서 십을 빌려 와요.' },
        { ill:() => eqH('50 − 23 = 27', true), text:'50 − 23처럼 일의 자리가 0이어도 십의 자리에서 10을 빌려 와요. 10 − 3 = 7, 4 − 2 = 2. 답은 27이에요.', say:'오십 빼기 이십삼. 영에서 삼을 뺄 수 없으니 십을 빌려 와요. 답은 이십칠.' } ] },
      { id:'3-5', ebs:[20], title:'세 수를 계산해 볼까요', cards:[
        { ill:() => eqH('25 + 16 − 8<br>= 41 − 8<br>= 33', true), text:'세 수의 계산은 앞에서부터 차례로 해요.', say:'세 수의 계산은 앞에서부터 차례로 계산해요.' } ] },
      { id:'3-6', ebs:[21], title:'덧셈과 뺄셈의 관계를 알아볼까요', cards:[
        { ill:() => eqH('8 + 7 = 15<br>15 − 7 = 8<br>15 − 8 = 7', true), text:'8, 7, 15는 한 가족이에요. 덧셈식 하나로 뺄셈식 두 개를 만들 수 있어요. 가장 큰 수에서 빼면 돼요.', say:'팔 더하기 칠은 십오. 십오 빼기 칠은 팔, 십오 빼기 팔은 칠. 세 수가 한 가족이에요.' } ] },
      { id:'3-7', ebs:[22], title:'□의 값을 구해 볼까요', cards:[
        { ill:() => eqH('□ + 7 = 15<br>15 − 7 = □', true), text:'모르는 수는 □로 써요. □ + 7 = 15이면 □ = 15 − 7 = 8이에요.', say:'네모 더하기 칠은 십오. 네모는 십오 빼기 칠, 팔이에요.' },
        { ill:() => eqH('□ − 6 = 9<br>9 + 6 = □', true), text:'□ − 6 = 9이면 거꾸로 더해요. 9 + 6 = 15, □는 15예요.', say:'네모 빼기 육은 구. 거꾸로 구 더하기 육은 십오. 네모는 십오예요.' } ] },
    ] },
    { n:4, name:'길이 재기', rev:32, lessons:[
      { id:'4-1', ebs:[28], title:'여러 가지 단위로 길이를 재 볼까요', cards:[
        { ill:() => clipsSVG(5, '연필'), text:'연필의 길이는 클립 5개만큼이에요. 클립처럼 길이를 잴 때 쓰는 것을 "단위"라고 해요.', say:'연필은 클립 다섯 개만큼이에요.' },
        { ill:() => '<div class="pic">✋</div>', text:'뼘이나 발걸음으로 재면 사람마다 길이가 달라서 정확하지 않아요. 그래서 모두 같은 단위를 써요.', say:'뼘으로 재면 사람마다 달라요. 그래서 모두가 똑같은 단위를 써요.' } ] },
      { id:'4-2', ebs:[29], title:'1 cm를 알아볼까요', cards:[
        { ill:() => rulerSVG(0, 1, { len:5, label:'' }), text:'자에서 큰 눈금 한 칸의 길이를 1 cm라고 써요. "1 센티미터"라고 읽어요.', say:'큰 눈금 한 칸을 일 센티미터라고 해요.' },
        { ill:() => rulerSVG(0, 4, { len:6 }), text:'1 cm가 4번이면 4 cm예요.', say:'일 센티미터가 네 번이면 사 센티미터예요.' } ] },
      { id:'4-3', ebs:[30], title:'자로 길이를 재 볼까요', cards:[
        { ill:() => rulerSVG(0, 6, { label:'연필' }), text:'물건의 한쪽 끝을 0에 맞추고, 다른 쪽 끝의 눈금을 읽어요. 6 cm예요.', say:'한쪽 끝을 영에 맞추고 다른 끝의 눈금을 읽어요.' },
        { ill:() => rulerSVG(2, 7, { label:'지우개' }), text:'0이 아닌 곳에서 시작하면 1 cm가 몇 번 들어가는지 세어요. 2부터 7까지는 5 cm예요.', say:'영이 아닌 곳에서 시작하면 한 칸씩 세어요. 이부터 칠까지는 오 센티미터.' } ] },
      { id:'4-4', title:'길이를 어림해 볼까요', cards:[
        { ill:() => '<div class="pic">✏️</div>', text:'자를 쓰지 않고 짐작하는 것을 "어림"이라고 해요. 연필은 약 15 cm, 클립은 약 3 cm예요. "약"을 붙여 말해요.', say:'자 없이 짐작하는 것을 어림이라고 해요. 연필은 약 십오 센티미터예요.' } ] },
    ] },
    { n:5, name:'분류하기', rev:38, lessons:[
      { id:'5-1', ebs:[35], title:'분류는 어떻게 할까요', cards:[
        { ill:() => `<div class="row" style="justify-content:center;gap:10px">${shapeSVG('tri1', 70, { fill:C.pink })}${shapeSVG('circ', 70, { fill:C.sky })}${shapeSVG('quad2', 70, { fill:C.butter })}</div>`, text:'"예쁜 것"처럼 사람마다 다른 기준은 안 돼요. "모양", "색깔"처럼 누가 해도 같은 기준으로 나눠요.', say:'누가 나누어도 똑같은 기준으로 나눠야 해요. 모양이나 색깔처럼요.' } ] },
      { id:'5-2', title:'기준에 따라 분류해 볼까요', cards:[
        { ill:() => classifyHTML([{s:'tri1',c:'pink'},{s:'circ',c:'sky'},{s:'tri1',c:'butter'},{s:'quad2',c:'pink'},{s:'circ',c:'pink'}]), text:'색깔로 나누면 분홍 3개, 파랑 1개, 노랑 1개예요. 센 것에 표시를 하면 빠뜨리지 않아요.', say:'색깔로 나누어 세어 봐요. 센 것에 표시하면 빠뜨리지 않아요.' } ] },
      { id:'5-3', ebs:[36], title:'분류하여 세어 볼까요', cards:[
        { ill:() => `<table class="pv"><tr><th>모양</th><th>삼각형</th><th>사각형</th><th>원</th></tr><tr><td>수</td><td>4</td><td>2</td><td>3</td></tr></table>`, text:'분류해서 센 것을 표로 나타내면 어느 것이 가장 많은지 한눈에 보여요.', say:'세어서 표로 나타내면 가장 많은 것을 한눈에 알 수 있어요.' } ] },
    ] },
    { n:6, name:'곱셈', rev:46, lessons:[
      { id:'6-1', ebs:[41], title:'여러 가지 방법으로 세어 볼까요', cards:[
        { ill:() => eqH('2, 4, 6, 8, 10', true), text:'하나씩 세는 것보다 2씩, 5씩 뛰어 세면 더 빨라요.', say:'둘씩, 다섯씩 뛰어 세면 더 빨리 셀 수 있어요.' } ] },
      { id:'6-2', title:'묶어 세어 볼까요', cards:[
        { ill:() => groupsHTML('🍓', 3, 4), text:'딸기를 4개씩 묶으면 3묶음이에요. 4, 8, 12. 모두 12개예요.', say:'네 개씩 세 묶음. 사, 팔, 십이. 모두 열두 개예요.' } ] },
      { id:'6-3', ebs:[42], title:'몇의 몇 배를 알아볼까요', cards:[
        { ill:() => groupsHTML('🍪', 3, 2), text:'2씩 3묶음을 "2의 3배"라고 해요. 2의 3배는 6이에요.', say:'둘씩 세 묶음을 이의 세 배라고 해요. 이의 세 배는 육이에요.' } ] },
      { id:'6-4', ebs:[43], title:'곱셈식을 알아볼까요', cards:[
        { ill:() => groupsHTML('⭐', 4, 3) + eqH('3 × 4 = 12', true), text:'3의 4배를 3 × 4라고 써요. "3 곱하기 4는 12와 같습니다"라고 읽어요.', say:'삼의 네 배를 삼 곱하기 사라고 써요. 삼 곱하기 사는 십이와 같습니다.' } ] },
      { id:'6-5', ebs:[44], title:'곱셈식으로 나타내 볼까요', cards:[
        { ill:() => eqH('5 + 5 + 5 = 15<br>5 × 3 = 15', true), text:'같은 수를 여러 번 더하는 것은 곱셈식으로 짧게 쓸 수 있어요.', say:'같은 수를 여러 번 더하면 곱셈식으로 짧게 쓸 수 있어요.' } ] },
    ] },
  ],
};
