/* ===================== 영어 진도: 알파벳 → 파닉스 → 자주 쓰는 낱말 → 짧은 문장 ===================== */
/* 학교 영어는 3학년부터라서 EBS 교과 강의가 없어요. 토리 개념 카드 + 소리 듣기로 배워요 */
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const letterHTML = (L, size = 110) => `<span class="letter" style="font-size:${size}px">${L}</span>`;
/* 글자마다 첫소리 예시 낱말 */
const LETTER_WORD = {
  A:['apple','사과','🍎'], B:['ball','공','⚽'], C:['cat','고양이','🐱'], D:['dog','강아지','🐶'], E:['egg','달걀','🥚'], F:['fish','물고기','🐟'],
  G:['goat','염소','🐐'], H:['hat','모자','👒'], I:['insect','곤충','🐞'], J:['juice','주스','🧃'], K:['kite','연','🪁'], L:['lion','사자','🦁'],
  M:['moon','달','🌙'], N:['nose','코','👃'], O:['octopus','문어','🐙'], P:['pig','돼지','🐷'], Q:['queen','여왕','👸'], R:['rabbit','토끼','🐰'],
  S:['sun','해','☀️'], T:['tree','나무','🌳'], U:['umbrella','우산','☂️'], V:['violin','바이올린','🎻'], W:['watch','손목시계','⌚'], X:['fox','여우','🦊'],
  Y:['yo-yo','요요','🪀'], Z:['zebra','얼룩말','🦓'],
};
/* 짧은 모음 낱말 (그림이 확실한 것만) */
const PH = {
  a:[['cat','고양이','🐱'],['hat','모자','👒'],['bat','박쥐','🦇'],['map','지도','🗺️'],['bag','가방','🎒'],['can','깡통','🥫'],['van','승합차','🚐'],['pan','프라이팬','🍳'],['cap','야구 모자','🧢'],['rat','쥐','🐀']],
  i:[['pig','돼지','🐷'],['pin','핀','📌'],['lip','입술','👄'],['six','여섯','6'],['kid','아이','🧒'],['bin','쓰레기통','🗑️']],
  o:[['dog','강아지','🐶'],['box','상자','📦'],['fox','여우','🦊'],['pot','냄비','🍲'],['log','통나무','🪵'],['hot','뜨거운','🔥']],
  u:[['bus','버스','🚌'],['cup','컵','☕'],['sun','해','☀️'],['bug','벌레','🐛'],['nut','땅콩','🥜'],['hug','안아 주기','🤗'],['tub','욕조','🛁']],
  e:[['bed','침대','🛏️'],['hen','암탉','🐔'],['pen','펜','🖊️'],['red','빨간색','🟥'],['ten','열','10'],['net','그물','🥅'],['jet','제트기','✈️'],['leg','다리','🦵'],['web','거미줄','🕸️']],
};
const PH_ALL = Object.entries(PH).flatMap(([v, l]) => l.map(x => ({ w:x[0], k:x[1], e:x[2], v })));
const phOf = v => PH_ALL.filter(y => y.v === v);
const phPic = (e, big) => /^\d+$/.test(e) ? `<span class="disp" style="font-size:${big ? 88 : 46}px;color:#3E93E0">${e}</span>` : big ? `<span class="pic">${e}</span>` : e;
const SIGHT = {
  'e5-1':{ words:['I','a','the','is','it'], sents:[['___ am Jaeyun.','I',['It','The'],'나는 재윤이에요.','🙋‍♀️'],['It ___ a cat.','is',['I','the'],'그것은 고양이예요.','🐱'],['___ is a dog.','It',['I','The'],'그것은 강아지예요.','🐶'],['It is ___ hat.','a',['is','I'],'그것은 모자예요.','👒'],['I see ___ sun.','the',['is','I'],'나는 해를 봐요.','☀️'],['___ like apples.','I',['It','The'],'나는 사과를 좋아해요.','🍎'],['It ___ red.','is',['I','a'],'그것은 빨간색이에요.','🟥'],['I have ___ pen.','a',['is','I'],'나는 펜이 하나 있어요.','🖊️'],['Look at ___ moon.','the',['is','I'],'달을 봐요.','🌙']] },
  'e5-2':{ words:['my','you','like','see','can'], sents:[['I ___ cats.','like',['the','is'],'나는 고양이를 좋아해요.','🐱'],['This is ___ bag.','my',['is','I'],'이것은 내 가방이에요.','🎒'],['I ___ swim.','can',['the','my'],'나는 수영할 수 있어요.','🏊'],['I ___ a bird.','see',['is','my'],'나는 새를 봐요.','🐦'],['Thank ___.','you',['I','my'],'고마워요.','🎁'],['I ___ you.','like',['my','the'],'나는 너를 좋아해.','💗'],['This is ___ mom.','my',['is','I'],'이분은 우리 엄마예요.','👩'],['___ can dance.','You',['My','The'],'너는 춤출 수 있어.','💃'],['I ___ run.','can',['my','the'],'나는 달릴 수 있어요.','🏃']] },
  'e5-3':{ words:['go','he','she','we','and'], sents:[['We ___ to school.','go',['is','he'],'우리는 학교에 가요.','🏫'],['___ is my brother.','He',['She','I'],'그는 내 오빠예요.','👦'],['___ is my mom.','She',['He','I'],'그녀는 우리 엄마예요.','👩'],['___ are friends.','We',['He','She'],'우리는 친구예요.','👭'],['I like cats ___ dogs.','and',['is','go'],'나는 고양이와 강아지를 좋아해요.','🐱🐶'],['Let\'s ___ home.','go',['he','and'],'집에 가자.','🏠'],['___ is a girl.','She',['He','We'],'그 아이는 여자아이예요.','👧'],['___ is a boy.','He',['She','We'],'그 아이는 남자아이예요.','👦'],['Mom ___ I like cookies.','and',['go','he'],'엄마와 나는 쿠키를 좋아해요.','🍪']] },
};
const SENT6 = {
  'e6-1':{ frame:w => `It is a ${w}.`, ko:k => `그것은 ${k}${hasBatchim(k) ? '이에요' : '예요'}.`, items:PH_ALL.filter(x => !/^\d+$/.test(x.e) && !['hot','red','hug'].includes(x.w)).map(x => [x.w, x.k, x.e]) },
  'e6-2':{ frame:w => `I like ${w}.`, ko:k => `나는 ${k}${hasBatchim(k) ? '을' : '를'} 좋아해요.`, items:[['apples','사과','🍎'],['bananas','바나나','🍌'],['grapes','포도','🍇'],['strawberries','딸기','🍓'],['cookies','쿠키','🍪'],['carrots','당근','🥕'],['cats','고양이','🐱'],['dogs','강아지','🐶']] },
  'e6-3':{ frame:w => `I can ${w}.`, ko:k => `나는 ${k} 수 있어요.`, items:[['swim','수영할','🏊'],['run','달릴','🏃'],['dance','춤출','💃'],['sing','노래할','🎤'],['read','책을 읽을','📖'],['draw','그림을 그릴','🎨']] },
};
const eq_ = o => Object.assign({ subj:'eng', eng:true, input:'choice', cols:3, lang:'en-US' }, o, o.opts ? { opts:shuffle(o.opts) } : {});
const lettersOf = id => ({ 'e1-1':ABC.slice(0, 9), 'e1-2':ABC.slice(9, 18), 'e1-3':ABC.slice(18), 'e2-1':['B','C','D','F','G'], 'e2-2':['H','J','K','L','M'], 'e2-3':['N','P','Q','R','S'], 'e2-4':['T','V','W','Y','Z'] })[id];
const vowelsOf = id => ({ 'e3-1':['a'], 'e3-2':['i'], 'e3-3':['a','i'], 'e4-1':['o'], 'e4-2':['u'], 'e4-3':['e'] })[id];

function qLetterListen(id){ const set = lettersOf(id), L = pick(set), others = shuffle(ABC.filter(x => x !== L && (set.includes(x) || Math.random() < .3))).slice(0, 2);
  return eq_({ key:`e:ln:${L}`, type:'letter', prompt:'잘 듣고 알맞은 글자를 골라요', say:'잘 듣고 알맞은 글자를 골라 봐요', listen:L, vis:{ k:'listen' }, opts:[L, ...others], ans:L, big:true, optHtml:Object.fromEntries([L, ...others].map(x => [x, letterHTML(x, 46)])), hint:`${L}... 다시 들어 봐요`, explain:`${L} (${L.toLowerCase()})` }); }
function qLetterCase(id){ const set = lettersOf(id), L = pick(set), lo = L.toLowerCase();
  const conf = (LETTER_CONFUSE[lo] || '').split('').filter(x => x !== lo), pool = [...new Set([...conf, ...shuffle(set.map(x => x.toLowerCase()).filter(x => x !== lo))])].slice(0, 2);
  return eq_({ key:`e:case:${L}`, type:'letter', prompt:'큰 글자와 짝인 작은 글자를 골라요', say:'큰 글자와 짝인 작은 글자를 골라 봐요', listen:L, vis:{ k:'html', html:letterHTML(L) }, opts:[lo, ...pool], ans:lo, big:true, optHtml:Object.fromEntries([lo, ...pool].map(x => [x, letterHTML(x, 46)])), hint:'모양이 비슷한 글자가 많아요. 막대와 동그라미가 어느 쪽에 있는지 봐요', explain:`${L} ↔ ${lo}` }); }
function qLetterNext(id){ const set = lettersOf(id), L = pick(set.filter(x => ABC.indexOf(x) >= 3)) || set[set.length - 1], i = ABC.indexOf(L);
  const seq = ABC.slice(i - 3, i), others = shuffle(ABC.filter(x => x !== L && !seq.includes(x)).filter(x => Math.abs(ABC.indexOf(x) - i) <= 4)).slice(0, 2);
  return eq_({ key:`e:next:${L}`, type:'letter', prompt:'다음에 올 글자는?', say:'알파벳 순서대로! 다음에 올 글자는?', vis:{ k:'html', html:`<div class="eq" style="font-family:var(--f-body)">${seq.join(', ')}, ${QB}</div>` }, opts:[L, ...others], ans:L, big:true, optHtml:Object.fromEntries([L, ...others].map(x => [x, letterHTML(x, 46)])), hint:'알파벳 노래를 불러 봐요', explain:`${seq.join(', ')}, ${L}` }); }
function qFirstSound(id){ const set = lettersOf(id), L = pick(set), [w, k, e] = LETTER_WORD[L];
  const others = shuffle(set.filter(x => x !== L)).slice(0, 2);
  return eq_({ key:`e:fs:${w}`, type:'phonics', prompt:'잘 듣고 첫소리 글자를 골라요', say:'잘 듣고 무슨 글자로 시작하는지 골라 봐요', listen:w, vis:{ k:'html', html:phPic(e, true) }, opts:[L, ...others], ans:L, big:true, optHtml:Object.fromEntries([L, ...others].map(x => [x, letterHTML(x, 40) + `<span class="letter" style="font-size:30px;opacity:.7">${x.toLowerCase()}</span>`])), hint:`${w}... 맨 처음 소리를 천천히 따라 해 봐요`, explain:`${w} = ${k}, ${L}로 시작해요` }); }
function qPickByLetter(id){ const set = lettersOf(id), L = pick(set), right = LETTER_WORD[L];
  const others = shuffle(ABC.filter(x => x !== L && x !== 'X' && !(['C','K'].includes(L) && ['C','K'].includes(x)))).slice(0, 2).map(x => LETTER_WORD[x]);
  const all = [right, ...others];
  return eq_({ key:`e:pb:${L}${others.map(o => o[0])}`, type:'phonics', prompt:`${L}로 시작하는 것을 골라요`, say:`${L}로 시작하는 것을 골라 봐요`, listen:L, vis:{ k:'html', html:letterHTML(L) + `<span class="letter" style="font-size:70px;opacity:.75">${L.toLowerCase()}</span>` }, opts:all.map(x => x[0]), ans:right[0], pic:true, optHtml:Object.fromEntries(all.map(x => [x[0], phPic(x[2], false)])), hint:'그림의 영어 이름을 떠올리고 첫소리를 들어 봐요', explain:`${right[0]} = ${right[1]}` }); }
/* 짧은 모음 */
const BAD_WORDS = ['sex','fuk','fak'];
function swapVowel(w, keep){ return ['a','e','i','o','u'].filter(v => v !== keep).map(v => w.replace(keep, v)).filter(x => !BAD_WORDS.includes(x)); }
function qCvcListen(id){ const vs = vowelsOf(id), v = pick(vs), x = pick(phOf(v));
  const pool = PH_ALL.filter(y => y.w !== x.w && (vs.length > 1 ? vs.includes(y.v) : y.v === v || Math.random() < .3));
  const others = shuffle(pool).slice(0, 2), all = [x, ...others];
  return eq_({ key:`e:cl:${x.w}${others.map(o => o.w)}`, type:'cvc', prompt:'잘 듣고 알맞은 그림을 골라요', say:'잘 듣고 알맞은 그림을 골라 봐요', listen:x.w, vis:{ k:'listen' }, opts:all.map(y => y.w), ans:x.w, pic:true, optHtml:Object.fromEntries(all.map(y => [y.w, phPic(y.e, false)])), hint:`${x.w}... 첫소리와 끝소리를 잘 들어 봐요`, explain:`${x.w} = ${x.k}` }); }
function qCvcSpell(id){ const v = pick(vowelsOf(id)), x = pick(phOf(v)); const wr = shuffle(swapVowel(x.w, v)).slice(0, 2);
  return eq_({ key:`e:cs:${x.w}`, type:'cvc', prompt:'그림에 맞는 낱말을 골라요', say:'그림에 맞는 영어 낱말을 골라 봐요', listen:x.w, vis:{ k:'html', html:phPic(x.e, true) }, opts:[x.w, ...wr], ans:x.w, sayOpts:true, hint:`가운데 소리를 잘 들어 봐요. ${v}는 "${{ a:'애', i:'이', o:'아', u:'어', e:'에' }[v]}" 소리예요`, explain:`${x.w} = ${x.k}` }); }
function qCvcVowel(id){ const v = pick(vowelsOf(id)), x = pick(phOf(v)); const blank = x.w.replace(v, '_'); const others = shuffle(['a','e','i','o','u'].filter(y => y !== v)).slice(0, 2);
  return eq_({ key:`e:cv:${x.w}`, type:'cvc', prompt:'빈칸에 들어갈 글자는?', say:'잘 듣고 빈칸에 들어갈 글자를 골라 봐요', listen:x.w, vis:{ k:'html', html:phPic(x.e, true) + `<div class="eq" style="font-family:var(--f-body);letter-spacing:.15em">${blank.replace('_', QB)}</div>` }, opts:[v, ...others], ans:v, big:true, optHtml:Object.fromEntries([v, ...others].map(y => [y, letterHTML(y, 46)])), hint:`${x.w}... 가운데 소리에 귀 기울여요`, explain:`${x.w}: ${blank.replace('_', v)}` }); }
function qCvcBuild(id){ const v = pick(vowelsOf(id)), x = pick(phOf(v).filter(y => new Set(y.w).size === y.w.length)); const extra = shuffle('bcdfghlmnprst'.split('').filter(c => !x.w.includes(c))).slice(0, 2);
  return eq_({ key:`e:cb:${x.w}`, type:'cvc', prompt:'글자를 순서대로 눌러 낱말을 만들어요', say:'잘 듣고 글자를 순서대로 눌러서 낱말을 만들어 봐요', listen:x.w, vis:{ k:'html', html:phPic(x.e, true) }, input:'build', opts:undefined, tiles:shuffle([...x.w.split(''), v === 'a' ? 'e' : 'a', ...extra]), ans:x.w, hint:`첫소리, 가운데 소리, 끝소리 차례로! ${x.w}`, explain:`${x.w} = ${x.k}` }); }
function qRhyme(id){ const vs = vowelsOf(id), v = pick(vs), fam = PH[v];
  const groups = {}; fam.forEach(y => { const r = y[0].slice(1); (groups[r] = groups[r] || []).push(y); });
  const rimes = Object.keys(groups).filter(r => groups[r].length >= 2);
  if (!rimes.length) return qCvcSpell(id);
  const r = pick(rimes), [a, b] = shuffle(groups[r]); const others = shuffle(PH_ALL.filter(y => !y.w.endsWith(r))).slice(0, 2);
  return eq_({ key:`e:rh:${a[0]}${b[0]}`, type:'cvc', prompt:`'${a[0]}'하고 끝소리가 같은 낱말은?`, say:`${a[0]}. 끝소리가 같은 낱말을 골라 봐요`, listen:a[0], vis:{ k:'html', html:phPic(a[2], true) }, opts:[b[0], ...others.map(o => o.w)], ans:b[0], sayOpts:true, hint:`-${r} 로 끝나는 낱말을 찾아요`, explain:`${a[0]}, ${b[0]} → -${r}` }); }
/* 자주 쓰는 낱말 */
function qSightListen(id){ const ws = SIGHT[id].words, w = pick(ws), others = shuffle(ws.filter(x => x !== w)).slice(0, 2);
  return eq_({ key:`e:sw:${w}`, type:'sight', prompt:'잘 듣고 알맞은 낱말을 골라요', say:'잘 듣고 알맞은 낱말을 골라 봐요', listen:w === 'a' ? 'a, a cat' : w, vis:{ k:'listen' }, opts:[w, ...others], ans:w, big:true, optHtml:Object.fromEntries([w, ...others].map(x => [x, `<span class="letter" style="font-size:40px">${x}</span>`])), hint:'버튼을 눌러 다시 들어 봐요', explain:w }); }
function qSightFill(id){ const [s, a, w, ko, e] = pick(SIGHT[id].sents);
  return eq_({ key:`e:sf:${s}`, type:'sight', prompt:'빈칸에 알맞은 낱말을 골라요', say:'잘 듣고 빈칸에 알맞은 낱말을 골라 봐요', listen:s.replace('___', a), vis:{ k:'html', html:`<span class="pic" style="font-size:64px">${e}</span><div class="sent text-q" style="font-family:var(--f-body)">${esc(s).replace('___', '<span class="blank">&nbsp;</span>')}</div>` }, opts:[a, ...w], ans:a, big:true, hint:`"${ko}" 라는 뜻이에요`, explain:`${s.replace('___', a)} = ${ko}` }); }
/* 짧은 문장 */
function qSentPic(id){ const S6 = SENT6[id], it = pick(S6.items), others = shuffle(S6.items.filter(x => x !== it)).slice(0, 2), all = [it, ...others];
  const sent = S6.frame(it[0]);
  return eq_({ key:`e:sp:${sent}${others.map(o => o[0])}`, type:'esent', prompt:'문장을 잘 듣고 알맞은 그림을 골라요', say:'문장을 잘 듣고 알맞은 그림을 골라 봐요', listen:sent, vis:{ k:'listen' }, opts:all.map(x => x[0]), ans:it[0], pic:true, optHtml:Object.fromEntries(all.map(x => [x[0], phPic(x[2], false)])), hint:`"${sent}" 마지막 낱말을 잘 들어 봐요`, explain:`${sent} = ${S6.ko(it[1])}` }); }
function qSentChoose(id){ const S6 = SENT6[id], it = pick(S6.items), others = shuffle(S6.items.filter(x => x !== it)).slice(0, 2);
  const right = S6.frame(it[0]);
  return eq_({ key:`e:sc:${right}`, type:'esent', prompt:'그림에 맞는 문장을 골라요', say:'그림에 맞는 문장을 골라 봐요', listen:right, vis:{ k:'html', html:phPic(it[2], true) }, opts:[right, ...others.map(o => S6.frame(o[0]))], ans:right, sayOpts:true, cols:1, hint:'스피커를 눌러 하나씩 들어 봐요', explain:`${right} = ${S6.ko(it[1])}` }); }
function qSentOrder(id){ const S6 = SENT6[id], it = pick(S6.items), right = S6.frame(it[0]); const w = right.replace('.', '').split(' ');
  const w1 = [w[w.length - 1], ...w.slice(0, -1)].join(' ') + '.', w2 = [w[1], w[0], ...w.slice(2)].join(' ') + '.';
  return eq_({ key:`e:so:${right}`, type:'esent', prompt:'바른 순서로 된 문장을 골라요', say:'바른 순서로 된 문장을 골라 봐요', listen:right, vis:{ k:'html', html:phPic(it[2], true) }, opts:[right, w1, w2], ans:right, sayOpts:true, cols:1, hint:'I, It 처럼 "누가"가 맨 앞에 와요', explain:`${right} = ${S6.ko(it[1])}` }); }


/* 두 글자 소리 · 매직 e · 묻고 답하기 */
const DIGRAPH = {
  sh:[['ship','배','🚢'],['fish','물고기','🐟'],['shoe','신발','👟'],['shell','조개껍데기','🐚'],['sheep','양','🐑'],['brush','솔','🪥']],
  ch:[['chick','병아리','🐥'],['cheese','치즈','🧀'],['chair','의자','🪑'],['cherry','체리','🍒'],['church','교회','⛪'],['lunch','점심','🍱']],
  th:[['three','셋','3'],['thumb','엄지','👍'],['bath','목욕','🛁'],['teeth','이','🦷'],['thin','얇은','📄'],['moth','나방','🦋']],
};
const DG_ALL = Object.entries(DIGRAPH).flatMap(([d, l]) => l.map(x => ({ w:x[0], k:x[1], e:x[2], d })));
const digraphsOf = id => ({ 'e7-1':['sh'], 'e7-2':['ch'], 'e7-3':['sh','ch','th'] })[id];
function qDigraph(id){ const ds = digraphsOf(id), x = pick(DG_ALL.filter(y => ds.includes(y.d)));
  return eq_({ key:`e:dg:${x.w}`, type:'digraph', prompt:'잘 듣고 들어 있는 소리를 골라요', say:'잘 듣고 어떤 소리가 들어 있는지 골라 봐요', listen:x.w, vis:{ k:'html', html:phPic(x.e, true) }, opts:['sh','ch','th'], ans:x.d, big:true, optHtml:{ sh:letterHTML('sh', 44), ch:letterHTML('ch', 44), th:letterHTML('th', 44) }, hint:'sh는 "쉬", ch는 "취", th는 혀를 살짝 물고 내는 소리예요', explain:`${x.w} = ${x.k} (${x.d})` }); }
function qDigraphPic(id){ const ds = digraphsOf(id), x = pick(DG_ALL.filter(y => ds.includes(y.d))), others = shuffle(DG_ALL.filter(y => y.w !== x.w)).slice(0, 2), all = [x, ...others];
  return eq_({ key:`e:dgp:${x.w}${others.map(o => o.w)}`, type:'digraph', prompt:'잘 듣고 알맞은 그림을 골라요', say:'잘 듣고 알맞은 그림을 골라 봐요', listen:x.w, vis:{ k:'listen' }, opts:all.map(y => y.w), ans:x.w, pic:true, optHtml:Object.fromEntries(all.map(y => [y.w, phPic(y.e, false)])), hint:`${x.w}... 다시 들어 봐요`, explain:`${x.w} = ${x.k}` }); }
const MAGIC = {
  'e8-1':[['cake','케이크','🎂','cak'],['game','게임','🎮','gam'],['cape','망토','🦸','cap'],['lake','호수','🏞️','lak'],['gate','대문','🚪','gat'],['plane','비행기','✈️','plan']],
  'e8-2':[['bike','자전거','🚲','bik'],['kite','연','🪁','kit'],['five','다섯','5','fiv'],['nine','아홉','9','nin'],['pine','소나무','🌲','pin'],['slide','미끄럼틀','🛝','slid']],
  'e8-3':[['bone','뼈다귀','🦴','bon'],['rose','장미','🌹','ros'],['nose','코','👃','nos'],['home','집','🏠','hom'],['rope','밧줄','🪢','rop'],['note','쪽지','📝','not']],
};
function qMagic(id){ const [w, k, e, short] = pick(MAGIC[id]); const v = w.match(/[aeiou]/)[0], other = w.replace(v, v === 'a' ? 'o' : 'a');
  return eq_({ key:`e:mg:${w}`, type:'magic', prompt:'그림에 맞는 낱말을 골라요', say:'잘 듣고 그림에 맞는 낱말을 골라 봐요', listen:w, vis:{ k:'html', html:phPic(e, true) }, opts:[w, short, other], ans:w, sayOpts:true, hint:`끝에 e가 붙으면 ${v}가 "${{ a:'에이', i:'아이', o:'오우', u:'유' }[v]}" 하고 이름 소리를 내요`, explain:`${w} = ${k}` }); }
function qMagicPic(id){ const pool = MAGIC[id], x = pick(pool), others = shuffle(pool.filter(y => y !== x)).slice(0, 2), all = [x, ...others];
  return eq_({ key:`e:mgp:${x[0]}${others.map(o => o[0])}`, type:'magic', prompt:'잘 듣고 알맞은 그림을 골라요', say:'잘 듣고 알맞은 그림을 골라 봐요', listen:x[0], vis:{ k:'listen' }, opts:all.map(y => y[0]), ans:x[0], pic:true, optHtml:Object.fromEntries(all.map(y => [y[0], phPic(y[2], false)])), hint:`${x[0]}... 다시 들어 봐요`, explain:`${x[0]} = ${x[1]}` }); }
const QA_ITEMS = PH_ALL.filter(x => !/^\d+$/.test(x.e) && !['hot','red','hug'].includes(x.w));
const NUMW = ['zero','one','two','three','four','five','six','seven','eight','nine','ten'];
function qWhat(){ const x = pick(QA_ITEMS), others = shuffle(QA_ITEMS.filter(y => y.w !== x.w)).slice(0, 2); const right = `It is a ${x.w}.`;
  return eq_({ key:`e:wh:${x.w}`, type:'qa', prompt:'"What is it?" 알맞은 대답을 골라요', say:'왓 이즈 잇? 알맞은 대답을 골라 봐요', listen:'What is it?', vis:{ k:'html', html:phPic(x.e, true) }, opts:[right, ...others.map(o => `It is a ${o.w}.`)], ans:right, sayOpts:true, cols:1, hint:'그림의 이름을 넣어 대답해요', explain:`${right} = 그것은 ${x.k}${hasBatchim(x.k) ? '이에요' : '예요'}.` }); }
function qLike(){ const it = pick(SENT6['e6-2'].items), yes = Math.random() < .5; const right = yes ? 'Yes, I do.' : "No, I don't.";
  return eq_({ key:`e:lk:${it[0]}${yes}`, type:'qa', prompt:`"Do you like ${it[0]}?" ${yes ? '좋아해요!' : '안 좋아해요!'}`, say:`Do you like ${it[0]}? 알맞은 대답을 골라 봐요`, listen:`Do you like ${it[0]}?`, vis:{ k:'html', html:`<span class="pic">${it[2]}${yes ? '👍' : '👎'}</span>` }, opts:['Yes, I do.', "No, I don't.", 'It is a cat.'], ans:right, sayOpts:true, cols:1, hint:'좋아하면 Yes, 안 좋아하면 No', explain:`${right} = ${yes ? '응, 좋아해.' : '아니, 안 좋아해.'}` }); }
function qHowMany(){ const n = rnd(2, 9), [w, k, e] = pick([['apples','사과','🍎'],['stars','별','⭐'],['cats','고양이','🐱'],['balls','공','⚽'],['ducks','오리','🦆']]); const others = shuffle([n - 1, n + 1, n + 2].filter(x => x > 0 && x <= 10)).slice(0, 2);
  return eq_({ key:`e:hm:${n}${w}`, type:'qa', prompt:`"How many ${w}?" 알맞은 대답을 골라요`, say:`How many ${w}? 세어 보고 골라 봐요`, listen:`How many ${w}?`, vis:{ k:'html', html:`<div class="count-grid"><span class="grp">${e.repeat(Math.min(n, 5))}</span>${n > 5 ? `<span class="grp">${e.repeat(n - 5)}</span>` : ''}</div>` }, opts:[n, ...others].map(x => NUMW[x]), ans:NUMW[n], sayOpts:true, cols:3, hint:'하나씩 세어 봐요. one, two, three…', explain:`${NUMW[n]} ${w} = ${k} ${n}개` }); }

Object.assign(LESSON_GEN, Object.fromEntries([
  ...['e1-1','e1-2','e1-3'].map(id => [id, () => pick([qLetterListen, qLetterListen, qLetterCase, qLetterCase, qLetterNext])(id)]),
  ...['e2-1','e2-2','e2-3','e2-4'].map(id => [id, () => pick([qFirstSound, qFirstSound, qPickByLetter, qLetterCase])(id)]),
  ...['e3-1','e3-2','e3-3','e4-1','e4-2','e4-3'].map(id => [id, () => pick([qCvcListen, qCvcSpell, qCvcVowel, qCvcBuild, qRhyme])(id)]),
  ...['e5-1','e5-2','e5-3'].map(id => [id, () => pick([qSightListen, qSightFill, qSightFill])(id)]),
  ...['e6-1','e6-2','e6-3'].map(id => [id, () => pick([qSentPic, qSentChoose, qSentOrder])(id)]),
  ...['e7-1','e7-2','e7-3'].map(id => [id, () => pick([qDigraph, qDigraphPic])(id)]),
  ...['e8-1','e8-2','e8-3'].map(id => [id, () => pick([qMagic, qMagic, qMagicPic])(id)]),
  ['e9-1', () => pick([qWhat, qWhat, qSentPic.bind(null, 'e6-1')])()], ['e9-2', () => pick([qLike, qLike, qSentPic.bind(null, 'e6-2')])()], ['e9-3', () => qHowMany()],
]));

/* 개념 카드: 한국어 설명 + 영어 소리 */
const en = t => [t, 'en-US'], ko = t => [t, 'ko-KR'];
const letterRow = ls => `<div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap">${ls.map(L => `<span class="letter-chip"><b>${L}</b>${L.toLowerCase()}</span>`).join('')}</div>`;
const wordRow = ws => `<div class="row" style="justify-content:center;gap:14px;flex-wrap:wrap">${ws.map(([w, , e]) => `<span class="word-chip"><span style="font-size:40px">${phPic(e, false)}</span><b>${w}</b></span>`).join('')}</div>`;
const lettersCard = ls => ({ ill:() => letterRow(ls), text:`${ls[0]}부터 ${ls[ls.length - 1]}까지 큰 글자와 작은 글자를 짝지어 봐요. 글자 이름을 소리 내어 따라 해요.`, say:[ko('따라 해 봐요.'), en(ls.join(', '))] });
const soundCard = ls => ({ ill:() => wordRow(ls.map(L => LETTER_WORD[L])), text:ls.map(L => `${L}는 ${LETTER_WORD[L][0]}의 첫소리`).join(', ') + '. 낱말의 맨 처음 소리를 잘 들어 봐요.', say:[ko('첫소리를 잘 들어 봐요.'), en(ls.map(L => `${L}, ${LETTER_WORD[L][0]}`).join('. '))] });
const vowelCard = v => ({ ill:() => wordRow(PH[v].slice(0, 4)), text:`${v}는 짧게 "${{ a:'애', i:'이', o:'아', u:'어', e:'에' }[v]}" 하고 소리 나요. 첫소리 + ${v} + 끝소리를 이어 읽어요. ${PH[v].slice(0, 4).map(x => x[0]).join(', ')}.`, say:[ko(`${v}는 짧게 소리 나요.`), en(PH[v].slice(0, 4).map(x => x[0]).join(', '))] });
const ENG_CURR = {
  title:'영어 첫걸음 (파닉스)', subj:'eng', short:'영어',
  units:[
    { n:1, name:'알파벳 친구들', lessons:[
      { id:'e1-1', title:'A부터 I까지', cards:[lettersCard(ABC.slice(0, 9))] },
      { id:'e1-2', title:'J부터 R까지', cards:[lettersCard(ABC.slice(9, 18))] },
      { id:'e1-3', title:'S부터 Z까지', cards:[lettersCard(ABC.slice(18)), { ill:() => `<div class="row" style="justify-content:center;gap:16px">${['b','d','p','q'].map(x => letterHTML(x, 70)).join('')}</div>`, text:'b, d, p, q는 모양이 비슷해서 헷갈려요. 동그라미가 어느 쪽에 붙어 있는지 잘 봐요.', say:[ko('비슷한 글자를 잘 봐요.'), en('b, d, p, q')] }] },
    ] },
    { n:2, name:'글자의 소리', lessons:[
      { id:'e2-1', title:'B C D F G 소리', cards:[soundCard(['B','C','D','F','G'])] },
      { id:'e2-2', title:'H J K L M 소리', cards:[soundCard(['H','J','K','L','M'])] },
      { id:'e2-3', title:'N P Q R S 소리', cards:[soundCard(['N','P','Q','R','S'])] },
      { id:'e2-4', title:'T V W Y Z 소리', cards:[soundCard(['T','V','W','Y','Z'])] },
    ] },
    { n:3, name:'짧은 모음 a · i', lessons:[
      { id:'e3-1', title:'a 소리 낱말 (cat, hat)', cards:[vowelCard('a')] },
      { id:'e3-2', title:'i 소리 낱말 (pig, pin)', cards:[vowelCard('i')] },
      { id:'e3-3', title:'a와 i 구별하기', cards:[{ ill:() => wordRow([PH.a[0], PH.i[0], PH.a[5], PH.i[1]]), text:'cat과 pig처럼 가운데 소리가 a인지 i인지 잘 들어요. 끝소리가 같은 cat, hat, bat은 리듬이 같아요.', say:[ko('가운데 소리를 잘 들어요.'), en('cat, pig, can, pin. cat, hat, bat.')] }] },
    ] },
    { n:4, name:'짧은 모음 o · u · e', lessons:[
      { id:'e4-1', title:'o 소리 낱말 (dog, box)', cards:[vowelCard('o')] },
      { id:'e4-2', title:'u 소리 낱말 (bus, cup)', cards:[vowelCard('u')] },
      { id:'e4-3', title:'e 소리 낱말 (bed, hen)', cards:[vowelCard('e')] },
    ] },
    { n:5, name:'자주 쓰는 낱말', lessons:[
      { id:'e5-1', title:'I · a · the · is · it', cards:[{ ill:() => `<div class="sent text-q" style="font-family:var(--f-body)">I am Jaeyun.<br>It is a cat. 🐱</div>`, text:'I(나), a(하나의), the(그), is(~이다), it(그것)은 문장에 아주 자주 나와요. 보자마자 읽을 수 있게 익혀요.', say:[ko('자주 나오는 낱말이에요.'), en('I am Jaeyun. It is a cat.')] }] },
      { id:'e5-2', title:'my · you · like · see · can', cards:[{ ill:() => `<div class="sent text-q" style="font-family:var(--f-body)">I like cats. 🐱<br>I can swim. 🏊</div>`, text:'my(나의), you(너), like(좋아하다), see(보다), can(~할 수 있다).', say:[ko('따라 해 봐요.'), en('I like cats. I can swim. Thank you.')] }] },
      { id:'e5-3', title:'go · he · she · we · and', cards:[{ ill:() => `<div class="sent text-q" style="font-family:var(--f-body)">She is my mom. 👩<br>We go to school. 🏫</div>`, text:'go(가다), he(그 남자), she(그 여자), we(우리), and(그리고).', say:[ko('따라 해 봐요.'), en('She is my mom. We go to school.')] }] },
    ] },
    { n:6, name:'짧은 문장', lessons:[
      { id:'e6-1', title:'It is a ___.', cards:[{ ill:() => `<div class="sent text-q" style="font-family:var(--f-body)">🦊 It is a fox.</div>`, text:'"It is a ○○."는 "그것은 ○○예요."라는 뜻이에요.', say:[ko('그것은 여우예요.'), en('It is a fox.')] }] },
      { id:'e6-2', title:'I like ___.', cards:[{ ill:() => `<div class="sent text-q" style="font-family:var(--f-body)">🍓 I like strawberries.</div>`, text:'"I like ○○."는 "나는 ○○를 좋아해요."라는 뜻이에요.', say:[ko('나는 딸기를 좋아해요.'), en('I like strawberries.')] }] },
      { id:'e6-3', title:'I can ___.', cards:[{ ill:() => `<div class="sent text-q" style="font-family:var(--f-body)">🏊 I can swim.</div>`, text:'"I can ○○."는 "나는 ○○할 수 있어요."라는 뜻이에요.', say:[ko('나는 수영할 수 있어요.'), en('I can swim.')] }] },
    ] },
    { n:7, name:'두 글자 소리 sh · ch · th', lessons:[
      { id:'e7-1', title:'sh 소리 (ship, fish)', cards:[{ ill:() => wordRow(DIGRAPH.sh.slice(0, 4)), text:'s와 h가 만나면 "쉬" 하는 새 소리가 돼요. ship, fish, shoe.', say:[ko('s와 h가 만나면 쉬 소리가 나요.'), en('ship, fish, shoe, sheep')] }] },
      { id:'e7-2', title:'ch 소리 (chick, cheese)', cards:[{ ill:() => wordRow(DIGRAPH.ch.slice(0, 4)), text:'c와 h가 만나면 "취" 하는 소리가 돼요. chick, cheese, chair.', say:[ko('c와 h가 만나면 취 소리가 나요.'), en('chick, cheese, chair, cherry')] }] },
      { id:'e7-3', title:'th 소리와 모아 듣기', cards:[{ ill:() => wordRow(DIGRAPH.th.slice(0, 4)), text:'t와 h가 만나면 혀끝을 이 사이에 살짝 물고 내는 소리가 돼요. three, thumb, bath.', say:[ko('혀를 살짝 물고 소리 내요.'), en('three, thumb, bath, teeth')] }] },
    ] },
    { n:8, name:'매직 e (긴 소리)', lessons:[
      { id:'e8-1', title:'a_e (cake, game)', cards:[{ ill:() => `<div class="sent text-q" style="font-family:var(--f-body)">cap 🧢 → cape 🦸</div>`, text:'낱말 끝에 e가 붙으면 e는 소리를 안 내고, 앞의 a가 "에이" 하고 자기 이름 소리를 내요. cap → cape.', say:[ko('끝에 e가 붙으면 a가 에이 소리를 내요.'), en('cap, cape. cake, game.')] }] },
      { id:'e8-2', title:'i_e (bike, kite)', cards:[{ ill:() => `<div class="sent text-q" style="font-family:var(--f-body)">kit → kite 🪁</div>`, text:'끝에 e가 붙으면 i가 "아이" 하고 소리 나요. kit → kite, pin → pine.', say:[ko('끝에 e가 붙으면 i가 아이 소리를 내요.'), en('kit, kite. bike, five.')] }] },
      { id:'e8-3', title:'o_e (bone, home)', cards:[{ ill:() => `<div class="sent text-q" style="font-family:var(--f-body)">not → note 📝</div>`, text:'끝에 e가 붙으면 o가 "오우" 하고 소리 나요. not → note, rob → robe.', say:[ko('끝에 e가 붙으면 o가 오우 소리를 내요.'), en('not, note. bone, home.')] }] },
    ] },
    { n:9, name:'묻고 답하기', lessons:[
      { id:'e9-1', title:'What is it?', cards:[{ ill:() => `<div class="sent text-q" style="font-family:var(--f-body)">What is it? 🦊<br>It is a fox.</div>`, text:'"What is it?"은 "그게 뭐야?"라는 뜻이에요. "It is a ○○."로 대답해요.', say:[ko('그게 뭐야? 하고 물어요.'), en('What is it? It is a fox.')] }] },
      { id:'e9-2', title:'Do you like ~?', cards:[{ ill:() => `<div class="sent text-q" style="font-family:var(--f-body)">Do you like apples? 🍎<br>Yes, I do. 👍 / No, I don't. 👎</div>`, text:'"Do you like ○○?"는 "○○ 좋아해?"라는 뜻이에요. 좋아하면 "Yes, I do.", 아니면 "No, I don\'t."', say:[ko('좋아하냐고 물어요.'), en("Do you like apples? Yes, I do. No, I don't.")] }] },
      { id:'e9-3', title:'How many ~?', cards:[{ ill:() => `<div class="sent text-q" style="font-family:var(--f-body)">How many apples? 🍎🍎🍎<br>Three apples.</div>`, text:'"How many ○○?"는 "○○ 몇 개야?"라는 뜻이에요. 세어서 숫자로 대답해요.', say:[ko('몇 개냐고 물어요.'), en('How many apples? Three apples.')] }] },
    ] },
  ],
};
