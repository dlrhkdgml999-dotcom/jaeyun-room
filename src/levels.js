/* ===================== 학년별 문제 (엄마가 고른 단계에 맞춰) ===================== */
function lv(subj){ const l = (S.level || {})[subj]; return typeof l === 'number' ? l : (subj === 'eng' ? 0 : 1); }
const qw = (w, a, b) => `'${w}'${hasBatchim(w) ? a : b}`;
const sayBlank = s => s.replace(/___/g, '음음');
const blankHTML = s => esc(s).replace('___', '<span class="blank">&nbsp;</span>');

/* ---------- 국어 ---------- */
const ISWAP = {0:15,15:0,3:16,16:3,7:17,17:7,12:14,14:12,1:0,4:3,8:7,10:9,9:10,13:12,2:5,5:2};
function fakeWord(w){
  const syl = [...w];
  for (let g = 0; g < 20; g++) {
    const i = rnd(0, syl.length - 1), d = dec(syl[i]); if (!d) continue;
    const s = [...syl];
    if (Math.random() < .5 && MSWAP[d[1]] !== undefined) s[i] = com(d[0], MSWAP[d[1]], d[2]);
    else if (ISWAP[d[0]] !== undefined) s[i] = com(ISWAP[d[0]], d[1], d[2]);
    else continue;
    const f = s.join(''); if (f !== w) return f;
  }
  return w + '요';
}
const NO_BATCHIM = PIC_WORDS.filter(p => ![...p[1]].some(ch => hasBatchim(ch)));
function qPicEasy(it){
  const [e, w] = it; const f = new Set();
  for (let g = 0; f.size < 2 && g < 40; g++) { const x = fakeWord(w); if (x !== w) f.add(x); }
  for (const x of [it[2], it[3]]) { if (f.size >= 2) break; if (x !== w) f.add(x); }
  const q = qPic([e, w, ...[...f].slice(0, 2)]); q.key = 'kor:pic0:' + w; q.hint = `첫 글자는 '${w[0]}'예요. 글자 모양을 잘 봐요!`; return q;
}
function qBuildEasy(it){
  const [e, w] = it; const syl = [...w]; const f = new Set();
  for (let g = 0; f.size < 2 && g < 30; g++) { const x = fakeWord(pick(syl)); if (!syl.includes(x) && x.length === 1) f.add(x); }
  const q = qBuild(it); q.key = 'kor:build0:' + w; q.tiles = shuffle([...syl, ...f]); return q;
}
function qSound2(it){ const q = qRead(it); q.key = 'kor:snd:' + it[0]; q.hint = '소리 나는 대로 쓰지 않아요. 원래 모양을 살려서 쓴 것을 찾아요!'; return q; }
function qTextChoice(o){
  return Object.assign({ subj:'kor', input:'choice', cols:3 }, o);
}
function qHonor(it){
  const [s, ans, d1, d2] = it;
  return qTextChoice({ read:sayBlank(s), key:'kor:honor:' + s, type:'honor', prompt:'어른께 쓰는 높임말로 빈칸을 채워요', say:sayBlank(s) + ' 어른께 쓰는 높임말을 골라 봐요', listen:null,
    vis:{k:'text', html:blankHTML(s)}, opts:shuffle([ans, d1, d2]), ans, hint:'어른께는 높여서 말해요. 밥은 진지, 집은 댁, 나이는 연세!', explain:s.replace('___', ans) });
}
function qOpposite(it){
  const [a, b] = it; const flip = Math.random() < .5; const w = flip ? b : a, ans = flip ? a : b;
  const others = shuffle(OPPOSITE.filter(p => p !== it).flat()).filter(x => x !== ans && x !== w).slice(0, 2);
  return qTextChoice({ read:w, key:'kor:opp:' + w, type:'opposite', prompt:`${qw(w, '과', '와')} 뜻이 반대인 말은?`, say:`${w}. 뜻이 반대인 말을 골라 봐요`,
    vis:{k:'text', html:`<span class="big-word">${esc(w)}</span>`}, opts:shuffle([ans, ...others]), ans, hint:`${w}의 반대를 몸으로 흉내 내 봐요`, explain:`${w} ↔ ${ans}` });
}
function qPunct(it){
  const [s, ans] = it;
  return qTextChoice({ read:s, key:'kor:punct:' + s, type:'punct', prompt:'문장 끝에 알맞은 문장 부호를 골라요', say:`${s}. 알맞은 문장 부호를 골라 봐요`,
    vis:{k:'text', html:`${esc(s)}<span class="blank" style="min-width:1.4em">&nbsp;</span>`}, opts:['.', '?', '!'], big:true, ans,
    hint:'묻는 말에는 ?, 놀라거나 느낌을 말할 때는 !, 그냥 말할 때는 . 을 써요', explain:s + ans });
}
const SPELL_TIPS = {
  '돼요':"'되어요'로 바꿔도 말이 되면 '돼요'예요", '되요':'', '안':"'아니'로 바꿀 수 있으면 '안'이에요", '않았어요':"'아니하였어요'를 줄이면 '않았어요'예요",
  '왠지':"'왜인지'를 줄인 말이 '왠지'예요", '웬':"'어찌 된'이라는 뜻일 때는 '웬'이에요", '맞혔어요':'정답을 알아낼 때는 맞히다', '맞췄어요':'조각을 서로 붙여 맞출 때는 맞추다',
  '부쳤어요':'편지나 짐을 보낼 때는 부치다', '붙였어요':'딱 달라붙게 할 때는 붙이다', '나았어요':'병이 좋아질 때는 낫다', '낳았어요':'아기나 새끼가 태어나게 할 때는 낳다',
  '가리켰어요':'손가락으로 방향을 보일 때는 가리키다', '가르쳐':'알려 줄 때는 가르치다', '달라요':'같지 않을 때는 다르다', '틀렸어요':'답이 맞지 않을 때는 틀리다',
  '이따가':"'조금 뒤에'라는 뜻이면 '이따가'예요", '할게요':"'-ㄹ게'는 소리가 [께]여도 '게'로 써요", '줄게':"'-ㄹ게'는 소리가 [께]여도 '게'로 써요",
  '깨끗이':"'깨끗하다'처럼 'ㅅ' 받침 뒤에는 '-이'를 써요", '며칠':"'몇 일'이 아니라 '며칠'로 써요", '설거지':"'설거지'가 바른 말이에요", '곰곰이':"'곰곰이'가 바른 말이에요",
};
function qSpell3(it){
  const [s, ans, wrong] = it;
  return qTextChoice({ read:sayBlank(s), key:'kor:spell:' + s, type:'spell', prompt:'바르게 쓴 말을 골라요', say:sayBlank(s) + ' 바르게 쓴 말을 골라 봐요', cols:2,
    vis:{k:'text', html:blankHTML(s)}, opts:shuffle([ans, wrong]), ans, hint:SPELL_TIPS[ans] || '문장의 뜻을 잘 생각해 봐요', explain:s.replace('___', ans) });
}
function qIdiom(it){
  const [e, ans, d1, d2] = it;
  return qTextChoice({ read:e, key:'kor:idiom:' + e, type:'idiom', prompt:`${qw(e, '은', '는')} 무슨 뜻일까요?`, say:`${e}. 무슨 뜻일까?`, cols:1,
    vis:{k:'text', html:`<span class="big-word" style="font-size:30px">${esc(e)}</span>`}, opts:shuffle([ans, d1, d2]), ans, hint:'글자 그대로가 아니라, 숨은 뜻을 생각해 봐요', explain:`${e}: ${ans}` });
}
function qBaseForm(it){
  const [w, ans, d1, d2] = it;
  return qTextChoice({ read:w, key:'kor:base:' + w, type:'base', prompt:`${qw(w, '을', '를')} 국어사전에서 찾으려면 어떤 모양으로 찾아요?`, say:`${w}. 국어사전에서는 어떤 모양으로 찾을까?`,
    vis:{k:'text', html:`<span class="big-word">${esc(w)}</span>`}, opts:shuffle([ans, d1, d2]), ans, hint:"움직임이나 모양을 나타내는 말은 끝을 '-다'로 바꿔서 찾아요", explain:`${w} → ${ans}` });
}
const KOR_PLAN = [
  { gens:{ pic:() => qPicEasy(pick(NO_BATCHIM)), mimic:() => qMimic(pick(MIMIC)), build:() => qBuildEasy(pick(NO_BATCHIM.filter(p => p[1].length >= 2))) }, order:['pic','mimic','build','pic','build','mimic'] },
  null,
  { gens:{ snd:() => qSound2(pick(SOUND2)), read:() => qRead(pick(READ_SENTS)), opp:() => qOpposite(pick(OPPOSITE)), punct:() => qPunct(pick(PUNCT)) }, order:['snd','opp','read','punct','snd','opp'] },
  { gens:{ snd:() => qSound2(pick(SOUND2)), honor:() => qHonor(pick(HONOR)), opp:() => qOpposite(pick(OPPOSITE)), punct:() => qPunct(pick(PUNCT)) }, order:['honor','snd','opp','honor','snd','punct'] },
  { gens:{ spell:() => qSpell3(pick(SPELL3)), base:() => qBaseForm(pick(BASEFORM)), honor:() => qHonor(pick(HONOR)), snd:() => qSound2(pick(SOUND2)) }, order:['spell','base','honor','spell','snd','base'] },
  { gens:{ spell:() => qSpell3(pick(SPELL3)), idiom:() => qIdiom(pick(IDIOM)), base:() => qBaseForm(pick(BASEFORM)), honor:() => qHonor(pick(HONOR)) }, order:['spell','idiom','base','spell','honor','idiom'] },
];
function genFromPlan(plan, n){
  const out = [], used = new Set();
  for (let i = 0; out.length < n && i < n * 12; i++) {
    const q = plan.gens[plan.order[i % plan.order.length]]();
    if (used.has(q.key)) continue; used.add(q.key); out.push(q);
  }
  return out;
}
function genKor(n){ const l = lv('kor'); return l === 1 ? genKorBase(n) : genFromPlan(KOR_PLAN[l], n); }

/* ---------- 수학 ---------- */
const eqQ = (key, type, html, say, ans, hint, explain, extra = {}) => Object.assign({ key, type, prompt:extra.prompt || '계산해요', say, vis:{k:'eq', html, small:extra.small}, input:'numpad', ans, hint, explain }, extra);
const Q = '<span class="q">?</span>';
const ML = {
  /* 초1 1학기 */
  count9(){ const n = rnd(3, 9); const [e, name] = pick(COUNT_THINGS); return { key:`math:c9:${e}${n}`, type:'count', prompt:`${josa(name,'은','는')} 모두 몇 개일까요?`, vis:{k:'count', e, n}, input:'numpad', ans:n, hint:'하나씩 손가락으로 짚으며 세어 봐요', explain:`모두 ${n}개예요` }; },
  split9(){ const t = rnd(3, 9), a = rnd(1, t - 1); const q = M.split(); return Object.assign(q, { key:`math:s9:${t}-${a}`, prompt:`${numJosa(t,'을','를')} 두 수로 가르기 해요`, say:`${numJosa(t,'을','를')} 가르기 해요. 빈칸에 알맞은 수는?`, vis:{k:'split', top:t, l:a, r:'?'}, ans:t - a, hintHTML:framesHTML(cellsFor(a, t - a)), hint:`분홍 ${a}개와 민트 몇 개일까요?`, explain:`${numJosa(t,'은','는')} ${numJosa(a,'과','와')} ${t - a}${numRo(t - a)} 가를 수 있어요` }); },
  join9(){ const a = rnd(1, 7), b = rnd(1, 9 - a); return { key:`math:j9:${a}+${b}`, type:'join', prompt:`${numJosa(a,'과','와')} ${numJosa(b,'을','를')} 모으면 얼마일까요?`, vis:{k:'split', top:'?', l:a, r:b}, input:'numpad', ans:a + b, hintHTML:framesHTML(cellsFor(a, b)), hint:'분홍과 민트를 모두 세어 봐요', explain:`${numJosa(a,'과','와')} ${numJosa(b,'을','를')} 모으면 ${a + b}` }; },
  add9(){ const a = rnd(1, 8), b = rnd(1, 9 - a); return eqQ(`math:a9:${a}+${b}`, 'add', `${a} + ${b} = ${Q}`, `${a} 더하기 ${b}는?`, a + b, '분홍과 민트를 모두 세어 봐요', `${a} + ${b} = ${a + b}`, { prompt:'덧셈을 해요', hintHTML:framesHTML(cellsFor(a, b)) }); },
  sub9(){ const a = rnd(2, 9), b = rnd(1, a - 1); return eqQ(`math:b9:${a}-${b}`, 'sub', `${a} − ${b} = ${Q}`, `${a} 빼기 ${b}는?`, a - b, `${a}개 중에서 ${b}개를 지웠어요. 남은 것을 세어 봐요`, `${a} − ${b} = ${a - b}`, { prompt:'뺄셈을 해요', hintHTML:framesHTML(cellsFor(a, 0, b)) }); },
  cmp50(){ let a = rnd(1, 50), b = rnd(1, 50); while (b === a) b = rnd(1, 50); return { key:`math:k50:${a}-${b}`, type:'compare', prompt:'더 큰 수를 골라요', say:'두 수 중에서 더 큰 수를 골라 봐요', vis:null, input:'choice', cols:2, opts:[a, b], ans:Math.max(a, b), big:true, hint:'10개씩 묶음이 많은 쪽이 커요', explain:`${numJosa(Math.max(a, b),'이','가')} ${Math.min(a, b)}보다 커요` }; },
  tens50(){ const t = rnd(1, 4), o = rnd(0, 9); const q = M.tens(); return Object.assign(q, { key:`math:t50:${t}${o}`, say:`10개씩 묶음 ${t}개와 낱개 ${o}개는 얼마일까요?`, vis:{k:'tens', t, o}, ans:t * 10 + o, hint:`10개씩 묶음 ${t}개는 ${t * 10}이에요`, explain:`${t * 10}과 ${numJosa(o,'이면','면')} ${t * 10 + o}` }); },

  /* 초2 1학기 */
  place3(){ const n = rnd(101, 999), h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
    if (Math.random() < .5) return eqQ(`math:p3:${n}`, 'place', `100이 ${h}개, 10이 ${t}개, 1이 ${o}개`, `백이 ${h}개, 십이 ${t}개, 일이 ${o}개인 수는?`, n, `백의 자리에 ${h}, 십의 자리에 ${t}, 일의 자리에 ${numJosa(o, '을', '를')} 써요`, `${n}`, { prompt:'모두 얼마일까요?', small:true });
    const which = pick([['백', h], ['십', t], ['일', o]]);
    return eqQ(`math:pd:${n}${which[0]}`, 'place', `${n}`, `${n}에서 ${which[0]}의 자리 숫자는?`, which[1], '왼쪽부터 백, 십, 일의 자리예요', `${n}의 ${which[0]}의 자리 숫자는 ${which[1]}`, { prompt:`${which[0]}의 자리 숫자는?` }); },
  cmp3(){ let a = rnd(100, 999), b = rnd(100, 999); if (Math.random() < .5) b = Math.floor(a / 100) * 100 + rnd(0, 99); while (b === a) b = rnd(100, 999);
    return { key:`math:k3:${a}-${b}`, type:'compare', prompt:'더 큰 수를 골라요', say:'두 수 중에서 더 큰 수를 골라 봐요', vis:null, input:'choice', cols:2, opts:[a, b], ans:Math.max(a, b), big:true, hint:'백의 자리부터 차례로 비교해요', explain:`${numJosa(Math.max(a, b),'이','가')} ${Math.min(a, b)}보다 커요` }; },
  add2c(){ let a, b; do { a = rnd(15, 79); b = rnd(11, 89 - a); } while ((a % 10) + (b % 10) < 10 || a + b > 99);
    return eqQ(`math:ac:${a}+${b}`, 'add', `${a} + ${b} = ${Q}`, `${a} 더하기 ${b}는?`, a + b, `일의 자리 ${a % 10} + ${b % 10} = ${a % 10 + b % 10}, 10은 십의 자리로 올려요`, `${a} + ${b} = ${a + b}`, { prompt:'덧셈을 해요' }); },
  sub2b(){ let a, b; do { a = rnd(31, 95); b = rnd(11, a - 10); } while ((a % 10) >= (b % 10));
    return eqQ(`math:sb:${a}-${b}`, 'sub', `${a} − ${b} = ${Q}`, `${a} 빼기 ${b}는?`, a - b, `일의 자리 ${a % 10}에서 ${b % 10}을 뺄 수 없으면 십의 자리에서 10을 빌려 와요`, `${a} − ${b} = ${a - b}`, { prompt:'뺄셈을 해요' }); },
  groups(){ const g = rnd(2, 5), each = rnd(2, 5); const [e, name] = pick(COUNT_THINGS);
    return { key:`math:gr:${g}x${each}${e}`, type:'groups', prompt:`${name} ${each}개씩 ${g}묶음은 모두 몇 개일까요?`, say:`${each}개씩 ${g}묶음은 모두 몇 개일까?`, vis:{k:'groups', e, g, each}, input:'numpad', ans:g * each, hint:`${each}씩 뛰어 세어 봐요: ${Array.from({ length:g }, (_, i) => each * (i + 1)).join(', ')}`, explain:`${each}의 ${g}배는 ${g * each}` }; },
  times2(){ const a = rnd(2, 5), b = rnd(2, 5); return eqQ(`math:bae:${a}x${b}`, 'bae', `${a}의 ${b}배`, `${a}의 ${b}배는 얼마일까?`, a * b, `${numJosa(a, '을', '를')} ${b}번 더해요: ${Array(b).fill(a).join(' + ')}`, `${a}의 ${b}배 = ${a * b}`, { prompt:'몇의 몇 배는 얼마일까요?' }); },

  /* 초2 2학기 */
  gugu(){ const a = rnd(2, 9), b = rnd(1, 9); return eqQ(`math:gg:${a}x${b}`, 'gugu', `${a} × ${b} = ${Q}`, `${a} 곱하기 ${b}는?`, a * b, `${a}단을 외워 봐요: ${Array.from({ length:Math.min(b, 9) }, (_, i) => a * (i + 1)).join(', ')}`, `${a} × ${b} = ${a * b}`, { prompt:'곱셈구구' }); },
  guguWord(){ const a = rnd(3, 9), b = rnd(2, 9); const [e, name] = pick(COUNT_THINGS);
    return eqQ(`math:gw:${a}x${b}${e}`, 'guguword', `${e} 한 접시에 ${a}개씩, ${b}접시`, `한 접시에 ${a}개씩 ${b}접시면 ${name}는 모두 몇 개일까?`, a * b, `${a} × ${numJosa(b, '을', '를')} 계산해요`, `${a} × ${b} = ${a * b}`, { prompt:'모두 몇 개일까요?', small:true }); },
  place4(){ const n = rnd(1001, 9999), th = Math.floor(n / 1000), h = Math.floor(n / 100) % 10, t = Math.floor(n / 10) % 10, o = n % 10;
    return eqQ(`math:p4:${n}`, 'place', `1000이 ${th}개, 100이 ${h}개<br>10이 ${t}개, 1이 ${o}개`, `천이 ${th}개, 백이 ${h}개, 십이 ${t}개, 일이 ${o}개인 수는?`, n, '천, 백, 십, 일의 자리에 차례로 써요', `${n}`, { prompt:'모두 얼마일까요?', small:true }); },
  clock5(){ const h = rnd(1, 12); let m = rnd(1, 11) * 5; if (m === 30) m = 25; const lab = (hh, mm) => `${hh}시 ${mm}분`;
    const right = lab(h, m), c = new Set([right]); const nh = h % 12 + 1;
    const cand = shuffle([lab(h, (m / 5) % 60 || 5), lab(nh, m), lab(h, (60 - m) % 60 || 55), lab(Math.round(m / 5) || 12, h * 5 % 60 || 5)]);
    for (const x of cand) { if (c.size >= 3) break; if (x !== right) c.add(x); }
    return { key:`math:c5:${h}:${m}`, type:'clock', prompt:'시계가 몇 시 몇 분을 가리키나요?', vis:{k:'clock', h, m}, input:'choice', cols:1, opts:shuffle([...c]), ans:right, hint:'긴바늘이 가리키는 숫자에 5를 곱하면 분이에요. 1은 5분, 2는 10분!', explain:`정답은 ${right}` }; },
  lengthM(){ const m = rnd(1, 9), cm = rnd(1, 99);
    return Math.random() < .5 ? eqQ(`math:lm:${m}m${cm}`, 'length', `${m} m ${cm} cm = ${Q} cm`, `${m}미터 ${cm}센티미터는 몇 센티미터일까?`, m * 100 + cm, '1 m는 100 cm예요', `${m} m ${cm} cm = ${m * 100 + cm} cm`, { prompt:'몇 cm일까요?', small:true })
      : eqQ(`math:ml:${m}m`, 'length', `${m} m = ${Q} cm`, `${m}미터는 몇 센티미터일까?`, m * 100, '1 m는 100 cm예요', `${m} m = ${m * 100} cm`, { prompt:'몇 cm일까요?' }); },

  /* 초3 1학기 */
  add3(){ let a, b; do { a = rnd(105, 789); b = rnd(105, 899 - a); } while (a + b > 999 || ((a % 10) + (b % 10) < 10 && (Math.floor(a / 10) % 10) + (Math.floor(b / 10) % 10) < 10));
    return eqQ(`math:a3:${a}+${b}`, 'add', `${a} + ${b} = ${Q}`, `${a} 더하기 ${b}는?`, a + b, '일의 자리부터 더하고, 10이 넘으면 윗자리로 올려요', `${a} + ${b} = ${a + b}`, { prompt:'덧셈을 해요', small:true }); },
  sub3(){ let a, b; do { a = rnd(300, 999); b = rnd(101, a - 50); } while ((a % 10) >= (b % 10) && (Math.floor(a / 10) % 10) >= (Math.floor(b / 10) % 10));
    return eqQ(`math:s3:${a}-${b}`, 'sub', `${a} − ${b} = ${Q}`, `${a} 빼기 ${b}는?`, a - b, '일의 자리부터 빼고, 모자라면 윗자리에서 10을 빌려 와요', `${a} − ${b} = ${a - b}`, { prompt:'뺄셈을 해요', small:true }); },
  div(){ const d = rnd(2, 9), q = rnd(2, 9); return eqQ(`math:dv:${d * q}/${d}`, 'div', `${d * q} ÷ ${d} = ${Q}`, `${d * q} 나누기 ${d}는?`, q, `${d}단 곱셈구구에서 ${d * q}가 나오는 곳을 찾아요`, `${d} × ${q} = ${d * q}이니까 ${d * q} ÷ ${d} = ${q}`, { prompt:'나눗셈을 해요' }); },
  divWord(){ const d = rnd(2, 6), q = rnd(2, 8); const [e, name] = pick(COUNT_THINGS);
    return eqQ(`math:dw:${d * q}/${d}${e}`, 'divword', `${e} ${d * q}개를 ${d}명이 똑같이`, `${name} ${d * q}개를 ${d}명이 똑같이 나누면 한 명에 몇 개씩일까?`, q, `${d * q} ÷ ${numJosa(d, '을', '를')} 계산해요`, `${d * q} ÷ ${d} = ${q}`, { prompt:'한 명에 몇 개씩일까요?', small:true }); },
  mul21(){ const a = rnd(12, 49), b = rnd(2, 9); return eqQ(`math:m21:${a}x${b}`, 'mul', `${a} × ${b} = ${Q}`, `${a} 곱하기 ${b}는?`, a * b, `${a % 10} × ${b}와 ${a - a % 10} × ${numJosa(b, '을', '를')} 따로 계산해서 더해요`, `${a} × ${b} = ${a * b}`, { prompt:'곱셈을 해요' }); },
  fracPic(){ const n = pick([2, 3, 4, 5, 6, 8]), k = rnd(1, n - 1); const ans = `${k}/${n}`; const c = new Set([ans]);
    for (const x of shuffle([`${n - k}/${n}`, `${k}/${n + 1}`, `${n}/${k}`, `${k + 1}/${n}`])) { if (c.size >= 3) break; if (x !== ans && !/\/0$/.test(x)) c.add(x); }
    return { key:`math:fp:${k}/${n}`, type:'frac', prompt:'색칠한 부분을 분수로 나타내요', say:'색칠한 부분은 전체의 얼마일까?', vis:{k:'frac', n, part:k}, input:'choice', cols:3, frac:true, opts:shuffle([...c]), ans, hint:`전체를 똑같이 ${n}칸으로 나눴어요. 색칠한 칸은 몇 칸일까요?`, explain:`${n}칸 중 ${k}칸이니까 ${n}분의 ${k}` }; },
  mmcm(){ const cm = rnd(1, 15), mm = rnd(1, 9); return eqQ(`math:mm:${cm}c${mm}`, 'length', `${cm} cm ${mm} mm = ${Q} mm`, `${cm}센티미터 ${mm}밀리미터는 몇 밀리미터일까?`, cm * 10 + mm, '1 cm는 10 mm예요', `${cm} cm ${mm} mm = ${cm * 10 + mm} mm`, { prompt:'몇 mm일까요?', small:true }); },

  /* 초3 2학기 */
  mul31(){ const a = rnd(102, 399), b = rnd(2, 4); return eqQ(`math:m31:${a}x${b}`, 'mul', `${a} × ${b} = ${Q}`, `${a} 곱하기 ${b}는?`, a * b, '일, 십, 백의 자리를 차례로 곱하고 올림을 더해요', `${a} × ${b} = ${a * b}`, { prompt:'곱셈을 해요', small:true }); },
  mul22(){ const a = rnd(11, 39), b = rnd(11, 29); return eqQ(`math:m22:${a}x${b}`, 'mul', `${a} × ${b} = ${Q}`, `${a} 곱하기 ${b}는?`, a * b, `${a} × ${b % 10}과 ${a} × ${b - b % 10}을 따로 구해서 더해요`, `${a} × ${b} = ${a * b}`, { prompt:'곱셈을 해요', small:true }); },
  divRem(){ const d = rnd(3, 9), q = rnd(3, 12), r = rnd(1, d - 1), a = d * q + r; const lab = (x, y) => `몫 ${x}, 나머지 ${y}`; const ans = lab(q, r);
    const c = new Set([ans]); for (const x of shuffle([lab(q + 1, r), lab(q, r + 1 < d ? r + 1 : r - 1), lab(q - 1, r + d), lab(q, 0)])) { if (c.size >= 3) break; if (x !== ans && !/-/.test(x)) c.add(x); }
    return { key:`math:dr:${a}/${d}`, type:'divrem', prompt:'몫과 나머지를 구해요', num:[a, d], say:`${a} 나누기 ${d}의 몫과 나머지는?`, vis:{k:'eq', html:`${a} ÷ ${d}`}, input:'choice', cols:1, opts:shuffle([...c]), ans, hint:`${d} × ${q} = ${d * q}. 남는 수는 ${d}보다 작아야 해요`, explain:`${a} ÷ ${d} = ${q} … ${r}` }; },
  fracOf(){ const n = pick([2, 3, 4, 5, 6]), unit = rnd(2, 6), k = rnd(1, n - 1), total = n * unit;
    return eqQ(`math:fo:${total}:${k}/${n}`, 'fracof', `${total}의 <span class="frac"><span>${k}</span><span>${n}</span></span>`, `${total}의 ${n}분의 ${k}는 얼마일까?`, unit * k, `${total}을 똑같이 ${n}묶음으로 나누면 한 묶음은 ${unit}이에요`, `${total} ÷ ${n} × ${k} = ${unit * k}`, { prompt:'얼마일까요?' }); },
};
const MATH_PLAN = [
  { count9:1.2, split9:1.2, join9:1, add9:2, sub9:2, cmp50:.8, tens50:1 },
  null,
  { place3:1.2, cmp3:.8, add2c:2, sub2b:2, groups:1.2, times2:1, clock:.6, npat:.6 },
  { gugu:2.6, guguWord:1, place4:.8, clock5:1.4, lengthM:1, add2c:.6, sub2b:.6 },
  { add3:1.6, sub3:1.6, div:1.6, divWord:.8, mul21:1.4, fracPic:1, mmcm:.6, gugu:.6 },
  { mul31:1.4, mul22:1.4, divRem:1.4, div:.8, fracOf:1, fracPic:.6, add3:.6, sub3:.6 },
];
ML.clock = () => M.clock(); ML.npat = () => { let q; do { q = M.pattern(); } while (q.type !== 'npattern'); return q; };
function genMath(n){
  const l = lv('math'); if (l === 1) return genMathBase(n);
  const bag = []; Object.entries(MATH_PLAN[l]).forEach(([k, w]) => { for (let i = 0; i < Math.round(w * 4); i++) bag.push(k); });
  const out = [], used = new Set(); let last = '';
  for (let i = 0; out.length < n && i < n * 15; i++) {
    const t = pick(bag); if (t === last) continue;
    const q = ML[t](); q.subj = 'math'; if (!q.say) q.say = q.prompt;
    if (used.has(q.key)) continue; used.add(q.key); out.push(q); last = t;
  }
  return out;
}

/* ---------- 영어 ---------- */
const ENG_ALL = [...ENG, ...ENG2];
ENG2.forEach(x => { if (!x.cat) x.cat = x.n ? 'num2' : 'greet'; });
function genEng(n){
  const l = lv('eng');
  if (l === 0) { const pool = shuffle(ENG.filter(x => ['animal','fruit','color','num'].includes(x.cat))); const out = [];
    for (let i = 0; i < n && pool.length; i++) { const x = pool.pop(); out.push(i % 3 === 2 ? qEngPick(x) : qEngListen(x)); } return out; }
  if (l === 1) { const pool = shuffle([...ENG.filter(x => ['thing','body','animal','fruit'].includes(x.cat)), ...ENG2, ...ENG2]); const out = [], used = new Set();
    for (let i = 0; out.length < n && pool.length; i++) { const x = pool.pop(); if (used.has(x.w)) continue; used.add(x.w); out.push(i % 3 === 2 ? qEngPick(x) : qEngListen(x)); } return out; }
  const gens = [qAlpha, qFirstLetter, qSentence, qAlpha, qSentence, qFirstLetter];
  const out = [], used = new Set();
  for (let i = 0; out.length < n && i < n * 10; i++) { const q = gens[i % gens.length](); if (used.has(q.key)) continue; used.add(q.key); out.push(q); }
  return out;
}
function qAlpha(){
  const lo = pick(Object.keys(LETTER_CONFUSE)); const others = shuffle([...LETTER_CONFUSE[lo]]).slice(0, 2);
  return { key:'eng:abc:' + lo, subj:'eng', type:'alpha', prompt:'작은 글자와 짝인 큰 글자를 골라요', say:'작은 글자와 짝인 큰 글자를 골라 봐요', listen:lo, lang:'en-US',
    vis:{k:'text', html:`<span class="big-word" style="font-family:var(--f-body);font-size:96px">${lo}</span>`}, input:'choice', cols:3, big:true, opts:shuffle([lo, ...others].map(x => x.toUpperCase())), ans:lo.toUpperCase(), hint:`'${lo}'를 크게 쓰면 모양이 어떻게 될까요?`, explain:`${lo} ↔ ${lo.toUpperCase()}` };
}
function qFirstLetter(){
  const x = pick(ENG.filter(e => e.e && /^[a-z]/.test(e.w) && !['eye','ear'].includes(e.w)));
  const f = x.w[0]; const others = shuffle('abcdefghiklmnoprstw'.split('').filter(c => c !== f)).slice(0, 2);
  return { key:'eng:first:' + x.w, subj:'eng', type:'first', prompt:'잘 듣고 첫 글자를 골라요', say:'잘 듣고 무슨 글자로 시작하는지 골라 봐요', listen:x.w, lang:'en-US',
    vis:{k:'eng', w:x.w}, input:'choice', cols:3, big:true, opts:shuffle([f, ...others]), ans:f, hint:`${x.w}... 맨 처음 소리를 천천히 따라 해 봐요`, explain:`${x.w}는 ${f}로 시작해요` };
}
function qSentence(){
  const x = pick(ENG.filter(e => (e.e || e.c) && !['grapes','eye','ear','hand','foot','nose'].includes(e.w) && !e.n));
  const sentence = x.c ? `It's ${x.w}.` : `It's ${/^[aeiou]/.test(x.w) ? 'an' : 'a'} ${x.w}.`;
  const others = shuffle(ENG.filter(e => e.cat === x.cat && e.w !== x.w)).slice(0, 2).map(e => e.w);
  return { key:'eng:sent:' + x.w, subj:'eng', type:'esent', prompt:'잘 듣고 알맞은 그림을 골라요', say:'문장을 잘 듣고 알맞은 그림을 골라 봐요', listen:sentence, lang:'en-US',
    vis:{k:'listen'}, input:'choice', cols:3, pic:true, eng:true, opts:shuffle([x.w, ...others]), ans:x.w, hint:`"${sentence}" 마지막 낱말을 잘 들어 봐요`, explain:`${sentence} = 이건 ${x.k}${hasBatchim(x.k) ? '이에요' : '예요'}` };
}

/* ---------- 받아쓰기 ---------- */
function dictBank(){ const l = lv('kor'); return l <= 1 ? DICTATION : l <= 3 ? DICT2 : DICT3; }

/* ---------- 판 설명 ---------- */
const BOARD_SUB = {
  kor:['받침 없는 낱말 · 흉내 내는 말','낱말 읽기 · 흉내 내는 말','소리와 다른 글자 · 반대말 · 문장 부호','높임말 · 소리와 다른 글자 · 반대말','맞춤법 · 기본형 · 높임말','맞춤법 · 관용 표현 · 기본형'],
  math:['9까지의 수 · 모으기 가르기 · 50까지의 수','덧셈 · 뺄셈 · 시계 · 규칙','세 자리 수 · 받아올림 덧셈 · 곱셈 준비','곱셈구구 · 네 자리 수 · 시각 · 길이','세 자리 덧셈 뺄셈 · 나눗셈 · 분수','곱셈 · 나머지 있는 나눗셈 · 분수'],
  eng:['동물 · 과일 · 색깔 · 숫자','단어 · 인사말 · 20까지 숫자','알파벳 · 첫 글자 · 짧은 문장'],
};
function levelLabel(subj){ return subj === 'eng' ? ENG_LEVELS[lv('eng')].split(' ')[0] : LEVELS[lv(subj)]; }
function boardSub(k){
  if (k === 'rev') return '전에 틀린 문제 다시 풀기';
  if (currOn(k)) { const d = day(), b = d.boards[k];
    const lec = !b || !b.done ? planLecture(d) : null;
    // 오늘 강의가 다른 과목이고 이 과목도 새 강의가 필요하면: 판을 열기 전에도 같은 말로
    if ((b && b.waitLec) || (!b && lec && lec.s !== k && dueLecture(k))) return '지난 시간 다지기 · 새 강의는 내일 📺';
    const tag = lec && lec.s === k && !lec.done ? `📺 ${lectInfo(k, lec.n).no}강 보는 날 · ` : '';
    return `${tag}${currLabel(k)}${k === 'eng' ? ' + 받아쓰기' : ''}`; }
  if (k === 'eng') return `${levelLabel('eng')} · ${BOARD_SUB.eng[lv('eng')]} + 받아쓰기`;
  return `${levelLabel(k)} · ${BOARD_SUB[k][lv(k)]}`;
}
/* 최근 7일 정답률로 엄마에게 단계 바꾸기 제안 */
function levelAdvice(){
  const keys = Array.from({ length:7 }, (_, i) => addDays(todayKey(), -i));
  const out = [];
  ['kor','math','eng'].filter(s => !currOn(s)).forEach(s => {
    let c = 0, n = 0, boards = 0;
    keys.forEach(k => { const b = S.days[k] && S.days[k].boards[s]; if (b && b.done && (b.lvl === undefined || b.lvl === lv(s))) { c += b.correct; n += b.n || b.qs.length; boards++; } });
    if (boards < 2 || n < 15) return;
    const r = c / n, max = s === 'eng' ? 2 : 5;
    if (r >= .9 && lv(s) < max) out.push({ s, dir:1, r });
    else if (r <= .5 && lv(s) > 0) out.push({ s, dir:-1, r });
  });
  return out;
}

