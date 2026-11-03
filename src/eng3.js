/* ===================== 영어 3단계: 3학년 학교 영어 맛보기 (2단계 생활 영어 다음) ===================== */
/* What's this? · Where is ~? · I like ~ · How many ~? · What time is it? · 요일 · Let's ~ · 장소와 탈것 · 생일과 나이.
   문장과 상황은 모두 새로 지은 것. 그림은 이모지와 간단한 SVG로만 그려요.
   eng2.js(PIC·it2·others2·sent2·ko·en·E2)와 eng_curr.js(eq_·NUMW), app.js(clockSVG)를 같이 써요 */
const e3q = (type, o) => eq_(Object.assign({ type }, o));
const PIC3 = (e, big) => typeof e === 'function' ? e(big) : PIC(e, big);
const g3Svg = (inner, big) => `<svg viewBox="0 0 100 100" width="${big ? 140 : 66}" height="${big ? 140 : 66}" style="vertical-align:middle">${inner}</svg>`;
const g3Emo = (x, y, s, e) => `<text x="${x}" y="${y}" font-size="${s}" text-anchor="middle" dominant-baseline="central">${e}</text>`;
const g3Cap = s => s[0].toUpperCase() + s.slice(1);
const g3Num = n => n <= 10 ? NUMW[n] : E2.teen[n - 11].w;
const g3Ko = (w, a, b) => w + (hasBatchim(w) ? a : b);
const g3Clock = (h, big) => `<span style="display:block;width:100%;max-width:${big ? 170 : 96}px;margin:auto">${clockSVG(h, 0)}</span>`;
const g3Pair = (a, b) => `<div class="row" style="justify-content:center;align-items:center;gap:10px">${a}${b}</div>`;
// 그림 위에 🚫 / ✅ 겹치기
const g3Mark = (e, mark) => big => `<span style="position:relative;display:inline-block;font-size:${big ? 96 : 44}px;line-height:1.1">${e}<span style="position:absolute;right:-.25em;bottom:-.1em;font-size:.55em">${mark}</span></span>`;

/* ---------- 그림 ---------- */
const G3_ERASER = big => g3Svg('<g transform="rotate(-20 50 50)"><rect x="14" y="34" width="72" height="32" rx="7" fill="#FF9EB5" stroke="#E07A95" stroke-width="2"/><rect x="14" y="34" width="32" height="32" rx="7" fill="#5B8DEF"/><rect x="36" y="34" width="12" height="32" fill="#5B8DEF"/></g>', big);
/* 장소 그림: 상자·책상·침대·의자 + 물건 (in · on · under) */
const G3_POSK = { in:'안', on:'위', under:'아래' };
const G3_BASE = {
  box:{ k:'상자', pos:['in', 'on'], at:{ in:[50, 52, 30], on:[50, 35, 28] },
    back:p => p === 'in' ? '<polygon points="22,55 8,42 30,42 36,55" fill="#E0A96D"/><polygon points="78,55 92,42 70,42 64,55" fill="#E0A96D"/><rect x="22" y="50" width="56" height="6" fill="#8B5A2B"/>' : '',
    front:p => '<rect x="22" y="55" width="56" height="36" rx="2" fill="#C98B4F" stroke="#8B5A2B" stroke-width="2"/>' + (p === 'on' ? '<rect x="19" y="49" width="62" height="7" rx="2" fill="#B97A40" stroke="#8B5A2B" stroke-width="2"/>' : '') },
  desk:{ k:'책상', pos:['on', 'under'], at:{ on:[50, 30, 28], under:[50, 74, 26] }, back:() => '',
    front:() => '<rect x="12" y="44" width="76" height="8" rx="2" fill="#B97A40"/><rect x="17" y="52" width="6" height="40" fill="#8B5A2B"/><rect x="77" y="52" width="6" height="40" fill="#8B5A2B"/>' },
  bed:{ k:'침대', pos:['on', 'under'], at:{ on:[62, 38, 24], under:[52, 79, 18] }, back:() => '',
    front:() => '<rect x="6" y="28" width="8" height="62" rx="2" fill="#8B5A2B"/><rect x="14" y="50" width="80" height="14" rx="3" fill="#7FB3E8"/><ellipse cx="27" cy="46" rx="9" ry="5" fill="#fff" stroke="#bbb"/><rect x="15" y="64" width="5" height="26" fill="#8B5A2B"/><rect x="88" y="64" width="5" height="26" fill="#8B5A2B"/>' },
  chair:{ k:'의자', pos:['on', 'under'], at:{ on:[44, 44, 22], under:[48, 79, 18] }, back:() => '',
    front:() => '<rect x="62" y="16" width="6" height="46" rx="2" fill="#8B5A2B"/><rect x="26" y="56" width="42" height="6" rx="2" fill="#B97A40"/><rect x="28" y="62" width="5" height="30" fill="#8B5A2B"/><rect x="62" y="62" width="5" height="30" fill="#8B5A2B"/>' },
};
const G3_OBJ = [['cat','고양이','🐱'],['dog','강아지','🐶'],['ball','공','⚽'],['teddy bear','곰 인형','🧸'],['bag','가방','🎒'],['book','책','📕'],['cap','모자','🧢'],['apple','사과','🍎']];
const g3Scene = (o, b, p) => big => { const B = G3_BASE[b], [x, y, s] = B.at[p];
  return g3Svg(`<line x1="2" y1="92" x2="98" y2="92" stroke="#D9C7CF" stroke-width="2"/>${B.back(p)}${g3Emo(x, y, s, o[2])}${B.front(p)}`, big); };
const G3_SCENES = G3_OBJ.flatMap(o => Object.entries(G3_BASE).flatMap(([b, B]) => B.pos.map(p => ({
  o:o[0], ok:o[1], b, p, id:`${o[0]}|${p}|${b}`, w:`${p} the ${b}`, k:`${B.k} ${G3_POSK[p]}에`, e:g3Scene(o, b, p),
  s:`The ${o[0]} is ${p} the ${b}.`, sk:`${g3Ko(o[1], '이', '가')} ${B.k} ${G3_POSK[p]}에 있어요.` }))));
const g3ScenesOf = o => G3_SCENES.filter(x => x.o === o);

/* ---------- 낱말 · 문장 ---------- */
const E3 = {
  school: it2([['pencil','연필','✏️'],['pen','펜','🖊️'],['ruler','자','📏'],['book','책','📕'],['bag','가방','🎒'],['crayon','크레파스','🖍️'],['notebook','공책','📓'],['eraser','지우개',G3_ERASER],['chair','의자','🪑'],['clock','시계','🕒']]),
  // a / an
  art: [['apple','사과','🍎','an'],['egg','달걀','🥚','an'],['eraser','지우개',G3_ERASER,'an'],['orange','오렌지','🍊','an'],['umbrella','우산','☂️','an'],['ant','개미','🐜','an'],['elephant','코끼리','🐘','an'],['octopus','문어','🐙','an'],['owl','부엉이','🦉','an'],['ice cream','아이스크림','🍦','an'],
    ['pencil','연필','✏️','a'],['ruler','자','📏','a'],['book','책','📕','a'],['bag','가방','🎒','a'],['cat','고양이','🐱','a'],['dog','강아지','🐶','a'],['banana','바나나','🍌','a'],['cup','컵','☕','a'],['ball','공','⚽','a'],['hat','모자','👒','a']],
  food: it2([['apples','사과','🍎'],['bananas','바나나','🍌'],['grapes','포도','🍇'],['strawberries','딸기','🍓'],['carrots','당근','🥕'],['tomatoes','토마토','🍅'],['cookies','쿠키','🍪'],['oranges','오렌지','🍊']]),
  pets: it2([['cats','고양이','🐱'],['dogs','강아지','🐶'],['rabbits','토끼','🐰'],['snakes','뱀','🐍'],['frogs','개구리','🐸'],['birds','새','🐦'],['fish','물고기','🐟']]),
  count: [['cat','cats','고양이','🐱'],['dog','dogs','강아지','🐶'],['apple','apples','사과','🍎'],['ball','balls','공','⚽'],['pencil','pencils','연필','✏️'],['book','books','책','📕'],['star','stars','별','⭐'],['bird','birds','새','🐦'],['duck','ducks','오리','🦆'],['car','cars','자동차','🚗'],['flower','flowers','꽃','🌷'],['egg','eggs','달걀','🥚']],
  routine: it2([['get up','일어나다','⏰','I get up.','나는 일어나요.'],['wash my face','세수하다','🧼','I wash my face.','나는 세수해요.'],['brush my teeth','이를 닦다','🪥','I brush my teeth.','나는 이를 닦아요.'],
    ['eat breakfast','아침을 먹다','🍳','I eat breakfast.','나는 아침을 먹어요.'],['go to school','학교에 가다','🏫','I go to school.','나는 학교에 가요.'],['eat lunch','점심을 먹다','🍱','I eat lunch.','나는 점심을 먹어요.'],
    ['do my homework','숙제를 하다','📝','I do my homework.','나는 숙제를 해요.'],['play with friends','친구들과 놀다','👫','I play with friends.','나는 친구들과 놀아요.'],['eat dinner','저녁을 먹다','🍲','I eat dinner.','나는 저녁을 먹어요.'],
    ['take a bath','목욕하다','🛁','I take a bath.','나는 목욕해요.'],['go to bed','잠자리에 들다','🛌','I go to bed.','나는 잠자리에 들어요.']]),
  days: it2([['Monday','월요일'],['Tuesday','화요일'],['Wednesday','수요일'],['Thursday','목요일'],['Friday','금요일'],['Saturday','토요일'],['Sunday','일요일']]),
  weekAct: it2([['swim','수영해요','🏊'],['play soccer','축구해요','⚽'],['read books','책을 읽어요','📚'],['draw pictures','그림을 그려요','🎨'],['play the piano','피아노를 쳐요','🎹'],['dance','춤을 춰요','💃'],['ride my bike','자전거를 타요','🚲']]),
  lets: it2([['play soccer','축구하자','⚽',"Let's play soccer.",'축구하자.'],['play baseball','야구하자','⚾',"Let's play baseball.",'야구하자.'],['ride bikes','자전거 타자','🚲',"Let's ride bikes.",'자전거 타자.'],
    ['fly a kite','연 날리자','🪁',"Let's fly a kite.",'연 날리자.'],['play hide-and-seek','숨바꼭질하자','🙈',"Let's play hide-and-seek.",'숨바꼭질하자.'],['sing a song','노래 부르자','🎤',"Let's sing a song.",'노래 부르자.'],
    ['dance','춤추자','💃',"Let's dance.",'춤추자.'],['swim','수영하자','🏊',"Let's swim.",'수영하자.'],['draw','그림 그리자','🎨',"Let's draw.",'그림 그리자.'],
    ['read a book','책 읽자','📖',"Let's read a book.",'책 읽자.'],['make a snowman','눈사람 만들자','⛄',"Let's make a snowman.",'눈사람 만들자.']]),
  // Let's ~ / Don't ~
  ld: [['run','🏃','달리자.','달리지 마요.'],['swim','🏊','수영하자.','수영하지 마요.'],['jump','🤸','뛰어오르자.','뛰어오르지 마요.'],['dance','💃','춤추자.','춤추지 마요.'],['sing','🎤','노래하자.','노래하지 마요.'],['eat','🍔','먹자.','먹지 마요.'],['sleep','😴','자자.','자지 마요.'],['draw','🎨','그림 그리자.','그림 그리지 마요.']],
  place: it2([['school','학교','🏫','to school'],['park','공원','🏞️','to the park'],['zoo','동물원','🦁','to the zoo'],['hospital','병원','🏥','to the hospital'],['library','도서관','📚','to the library'],
    ['store','가게','🏪','to the store'],['bank','은행','🏦','to the bank'],['home','집','🏠','home'],['beach','바닷가','🏖️','to the beach'],['playground','놀이터','🛝','to the playground']]),
  ride: it2([['bus','버스','🚌'],['car','자동차','🚗'],['bike','자전거','🚲'],['train','기차','🚆'],['taxi','택시','🚕'],['plane','비행기','✈️'],['ship','배','🚢'],['subway','지하철','🚇']]),
  bday: it2([['cake','케이크','🎂'],['candle','초','🕯️'],['present','선물','🎁'],['balloon','풍선','🎈'],['card','카드','💌'],['party','파티','🎉']]),
  bScene: [['오늘은 친구 생일이에요. 친구에게 뭐라고 할까요?','Happy birthday!','🎂','생일 축하해!'],['친구에게 선물을 주면서 말해요.','This is for you.','🎁','이건 너를 위한 거야.'],['친구가 나에게 생일 선물을 줬어요.','Thank you!','💝','고마워!'],
    ['친구가 생일 초를 끄려고 해요. 소원을 빌라고 말해요.','Make a wish!','🕯️','소원을 빌어!'],['생일 파티에 온 친구를 집 안으로 들어오게 해요.','Come in!','🚪','들어와!'],['선물을 열어 봤는데 정말 마음에 들어요.','I love it!','😍','정말 마음에 들어!']],
};
E3.school.forEach(x => { x.a = x.w === 'eraser' ? 'an' : 'a'; x.s = `It's ${x.a} ${x.w}.`; x.sk = `그것은 ${g3Ko(x.k, '이에요', '예요')}.`; });
[...E3.food, ...E3.pets].forEach(x => { x.s = `I like ${x.w}.`; x.sk = `나는 ${g3Ko(x.k, '을', '를')} 좋아해요.`; });
E3.place.forEach(x => { x.to = x.s; x.s = `I'm going ${x.to}.`; x.sk = `나는 ${x.k}에 가고 있어요.`; });
E3.ride.forEach(x => { x.s = `By ${x.w}.`; x.sk = `${x.k}${x.k === '지하철' ? '로' : g3Ko(x.k, '으로', '로')} 가요.`; });
const G3_FOOT = { w:'foot', k:'걸어서', e:'🚶', s:'On foot.', sk:'걸어서 가요.' };
const G3_ROUT_H = { 'get up':[6, 7, 8], 'wash my face':[7, 8], 'brush my teeth':[7, 8, 9], 'eat breakfast':[7, 8], 'go to school':[8, 9], 'eat lunch':[12, 1], 'do my homework':[3, 4, 5, 6], 'play with friends':[2, 3, 4, 5], 'eat dinner':[6, 7], 'take a bath':[7, 8, 9], 'go to bed':[8, 9, 10] };
const G3_KIDS = [['Mina','👧','미나'],['Leo','👦','레오'],['Sora','👧','소라'],['Ben','👦','벤'],['Yuna','👧','유나'],['Max','👦','맥스'],['Hana','👧','하나'],['Tom','👦','톰']];

/* ---------- 여러 차시에서 쓰는 문제 모양 ---------- */
// 듣고 그림 고르기
function g3Listen(pool, tag = ''){ const x = pick(pool), os = others2(pool, x), all = [x, ...os];
  return e3q('e3w', { key:`g:wl:${tag}${x.w}|${os.map(o => o.w)}`, prompt:'잘 듣고 알맞은 그림을 골라요', say:'잘 듣고 알맞은 그림을 골라 봐요', listen:x.w, vis:{ k:'listen' }, opts:all.map(y => y.w), ans:x.w, pic:true, optHtml:Object.fromEntries(all.map(y => [y.w, PIC3(y.e, false)])), hint:`${x.w}... 다시 들어 봐요`, explain:`${x.w} = ${x.k}` }); }
// 그림 보고 영어 고르기
function g3Pick(pool){ const x = pick(pool), os = others2(pool, x);
  return e3q('e3p', { key:`g:wp:${x.w}|${os.map(o => o.w)}`, prompt:'그림에 맞는 영어를 골라요', say:'그림에 맞는 영어를 골라 봐요', listen:x.w, vis:{ k:'html', html:PIC3(x.e, true) }, opts:[x.w, ...os.map(o => o.w)], ans:x.w, sayOpts:true, cols:1, hint:'스피커를 눌러 하나씩 들어 봐요', explain:`${x.w} = ${x.k}` }); }
// 듣고 뜻 고르기
function g3Mean(pool){ const x = pick(pool), os = others2(pool, x, 2, y => y.k);
  return e3q('e3w', { key:`g:wm:${x.w}|${os.map(o => o.w)}`, prompt:'잘 듣고 무슨 뜻인지 골라요', say:'잘 듣고 무슨 뜻인지 골라 봐요', listen:x.w, vis:{ k:'html', html:`<div class="sent text-q" style="font-family:var(--f-body)">${esc(x.w)}</div>` }, opts:[x.k, ...os.map(o => o.k)], ans:x.k, cols:1, hint:`${x.w}... 그림을 떠올려 봐요`, explain:`${x.w} = ${x.k}` }); }
// 글자 눌러 낱말 만들기 (짧고 같은 글자가 없는 낱말만)
function g3Build(pool){ const can = pool.filter(y => buildable(y.w)); if (!can.length) return g3Pick(pool); const x = pick(can);
  const extra = shuffle('abcdefghiklmnoprstuw'.split('').filter(c => !x.w.includes(c))).slice(0, 2);
  return e3q('e3b', { key:`g:wb:${x.w}`, prompt:'잘 듣고 글자를 순서대로 눌러요', say:'잘 듣고 글자를 순서대로 눌러서 낱말을 만들어 봐요', listen:x.w, vis:{ k:'html', html:PIC3(x.e, true) }, input:'build', opts:undefined, tiles:shuffle([...x.w.split(''), ...extra]), ans:x.w, hint:`천천히 소리 내어 봐요. ${x.w}`, explain:`${x.w} = ${x.k}` }); }
// 문장 듣고 그림 고르기 (보기 이름 = 문장)
function g3SentPic(pool, tag = ''){ const x = pick(pool), os = others2(pool, x, 2, y => y.s), all = [x, ...os];
  return e3q('e3s', { key:`g:sp:${tag}${x.s}|${os.map(o => o.s)}`, prompt:'문장을 잘 듣고 알맞은 그림을 골라요', say:'문장을 잘 듣고 알맞은 그림을 골라 봐요', listen:x.s, vis:{ k:'listen' }, opts:all.map(y => y.s), ans:x.s, pic:true, optHtml:Object.fromEntries(all.map(y => [y.s, PIC3(y.e, false)])), hint:`"${x.s}" 다시 들어 봐요`, explain:`${x.s} = ${x.sk}` }); }
// 그림 보고 문장 고르기
function g3SentChoose(pool){ const x = pick(pool), os = others2(pool, x, 2, y => y.s);
  return e3q('e3s', { key:`g:sc:${x.s}|${os.map(o => o.s)}`, prompt:'그림에 맞는 문장을 골라요', say:'그림에 맞는 문장을 골라 봐요', listen:x.s, vis:{ k:'html', html:PIC3(x.e, true) }, opts:[x.s, ...os.map(o => o.s)], ans:x.s, sayOpts:true, cols:1, hint:'스피커를 눌러 하나씩 들어 봐요', explain:`${x.s} = ${x.sk}` }); }
// 문장 듣고 뜻 고르기
function g3SentMean(pool){ const x = pick(pool), os = others2(pool, x, 2, y => y.sk);
  return e3q('e3m', { key:`g:sm:${x.s}|${os.map(o => o.s)}`, prompt:'문장을 잘 듣고 뜻을 골라요', say:'문장을 잘 듣고 무슨 뜻인지 골라 봐요', listen:x.s, vis:{ k:'html', html:`<div class="sent text-q" style="font-family:var(--f-body)">${esc(x.s)}</div>` }, opts:[x.sk, ...os.map(o => o.sk)], ans:x.sk, cols:1, hint:'낱말 하나하나 떠올려 봐요', explain:`${x.s} = ${x.sk}` }); }
// 바른 순서 문장 고르기 (첫 글자만 대문자로 맞춰서 대문자로 정답을 알 수 없게)
const G3_KEEP = w => w === 'I' || /^I'/.test(w) || /day$/.test(w) || G3_KIDS.some(k => k[0] === w);
function g3Order(pool){ const can = pool.filter(y => y.s.split(' ').length >= 3), x = pick(can.length ? can : pool);
  const end = /[.!?]$/.test(x.s) ? x.s.slice(-1) : '', ws = (end ? x.s.slice(0, -1) : x.s).split(' ');
  const fmt = a => { const t = a.map(w => G3_KEEP(w) ? w : w.toLowerCase()).join(' '); return t[0].toUpperCase() + t.slice(1) + end; };
  const w1 = fmt([ws[ws.length - 1], ...ws.slice(0, -1)]), w2 = fmt([ws[1], ws[0], ...ws.slice(2)]);
  const opts = [...new Set([x.s, w1, w2])]; if (opts.length < 3 || ws.length < 3) return g3SentChoose(pool);
  return e3q('e3o', { key:`g:so:${x.s}`, prompt:'바른 순서로 된 문장을 골라요', say:'바른 순서로 된 문장을 골라 봐요', listen:x.s, vis:{ k:'html', html:PIC3(x.e, true) }, opts, ans:x.s, sayOpts:true, cols:1, hint:'스피커를 눌러 들어 보면 자연스러운 문장이 있어요', explain:`${x.s} = ${x.sk}` }); }
// 듣고 그림과 맞으면 O, 틀리면 X
function g3OX(pool){ const x = pick(pool), yes = Math.random() < .5, sh = yes ? x : pick(pool.filter(y => y.s !== x.s && y.w !== x.w));
  return e3q('e3x', { key:`g:ox:${x.s}|${sh.s}`, prompt:'잘 듣고 그림과 맞으면 O, 틀리면 X를 골라요', say:'잘 듣고 그림과 맞으면 오, 틀리면 엑스를 골라 봐요', listen:x.s, vis:{ k:'html', html:PIC3(sh.e, true) }, opts:['O', 'X'], ans:yes ? 'O' : 'X', cols:2, big:true,
    hint:`"${x.s}" 다시 들어 보고 그림을 잘 봐요`, explain:yes ? `${x.s} = ${x.sk} 그림과 같아요.` : `${x.s} = ${x.sk} 그림은 "${sh.s}"예요.` }); }
const g3Mix = (...fs) => () => pick(fs)();

/* ---------- 1단원: What's this? ---------- */
function g3WhatThis(){ const x = pick(E3.school), os = others2(E3.school, x);
  return e3q('e3d', { key:`g:wt:${x.w}|${os.map(o => o.w)}`, prompt:'"What\'s this?" 알맞은 대답은?', say:"What's this? 그림을 보고 알맞은 대답을 골라 봐요", listen:"What's this?", vis:{ k:'html', html:PIC3(x.e, true) }, opts:[x.s, ...os.map(o => o.s)], ans:x.s, sayOpts:true, cols:1, hint:'그림의 영어 이름을 떠올려 봐요', explain:`${x.s} = ${x.sk}` }); }
function g3AorAn(){ const [w, k, e, a] = pick(E3.art);
  return e3q('e3f', { key:`g:aa:${w}`, prompt:'빈칸에 a와 an 중 알맞은 것을 골라요', say:'빈칸에 에이와 앤 중 알맞은 것을 골라 봐요', vis:{ k:'html', html:PIC3(e, true) + `<div class="sent text-q" style="font-family:var(--f-body)">It's <span class="blank">&nbsp;</span> ${esc(w)}.</div>` }, opts:['a', 'an'], ans:a, cols:2, big:true,
    hint:'a, e, i, o, u 소리로 시작하는 낱말 앞에는 an을 써요', explain:`It's ${a} ${w}. (${k}) ${a === 'an' ? `${w}는 ${w[0]} 소리로 시작해서 an` : `${w}는 ${w[0]} 소리로 시작해서 a`}` }); }
function g3IsIt(){ const x = pick(E3.school), yes = Math.random() < .5, asked = yes ? x : pick(E3.school.filter(y => y.w !== x.w)), q = `Is it ${asked.a} ${asked.w}?`;
  return e3q('e3d', { key:`g:ii:${x.w}|${asked.w}`, prompt:`"${q}" 그림을 보고 대답해요`, say:`${q} 그림을 보고 알맞은 대답을 골라 봐요`, listen:q, vis:{ k:'html', html:PIC3(x.e, true) }, opts:['Yes, it is.', "No, it isn't."], ans:yes ? 'Yes, it is.' : "No, it isn't.", sayOpts:true, cols:2,
    hint:'맞으면 Yes, it is. 아니면 No, it isn\'t.', explain:yes ? `그림은 ${x.w}(${x.k})예요. Yes, it is. = 응, 맞아.` : `그림은 ${x.w}(${x.k})예요. No, it isn't. = 아니, 아니야.` }); }

/* ---------- 2단원: Where is ~? in · on · under ---------- */
function g3PosWord(){ const x = pick(G3_SCENES), q = `Where is the ${x.o}?`;
  return e3q('e3p', { key:`g:pw:${x.id}`, prompt:`${g3Ko(x.ok, '은', '는')} ${G3_BASE[x.b].k}의 어디에 있어요?`, say:`${q} 안, 위, 아래 중에서 골라 봐요`, listen:q, vis:{ k:'html', html:PIC3(x.e, true) }, opts:['in', 'on', 'under'], ans:x.p, sayOpts:true, cols:3, big:true,
    hint:'in은 안, on은 위, under는 아래예요', explain:`${x.w} = ${x.k}` }); }
function g3PosListen(){ const o = pick(G3_OBJ); return g3Listen(g3ScenesOf(o[0]), o[0] + ':'); }
function g3PosMean(){ const ph = [...new Map(G3_SCENES.map(x => [x.w, x])).values()]; return g3Mean(ph); }
function g3Where(){ const x = pick(G3_SCENES), os = others2(g3ScenesOf(x.o), x).map(o => `It's ${o.w}.`), right = `It's ${x.w}.`, q = `Where is the ${x.o}?`;
  return e3q('e3d', { key:`g:wh:${x.id}|${os}`, prompt:`"${q}" 알맞은 대답은?`, say:`${q} 그림을 보고 알맞은 대답을 골라 봐요`, listen:q, vis:{ k:'html', html:PIC3(x.e, true) }, opts:[right, ...os], ans:right, sayOpts:true, cols:1, hint:'in은 안, on은 위, under는 아래예요', explain:`${right} = ${G3_BASE[x.b].k} ${G3_POSK[x.p]}에 있어요.` }); }
function g3PosFill(){ const x = pick(G3_SCENES);
  return e3q('e3f', { key:`g:pf:${x.id}`, prompt:'그림을 보고 빈칸에 알맞은 말을 골라요', say:'그림을 보고 빈칸에 알맞은 말을 골라 봐요', vis:{ k:'html', html:PIC3(x.e, true) + `<div class="sent text-q" style="font-family:var(--f-body)">The ${esc(x.o)} is <span class="blank">&nbsp;</span> the ${x.b}.</div>` }, opts:['in', 'on', 'under'], ans:x.p, sayOpts:true, cols:3, big:true,
    hint:'in은 안, on은 위, under는 아래예요', explain:`${x.s} = ${x.sk}` }); }

/* ---------- 3단원: I like ~ / Do you like ~? ---------- */
const G3_LIKE = [...E3.food, ...E3.pets];
function g3DoLike(){ const x = pick(G3_LIKE), yes = Math.random() < .5, q = `Do you like ${x.w}?`, right = yes ? 'Yes, I do.' : "No, I don't.";
  return e3q('e3d', { key:`g:dl:${x.w}|${yes}`, prompt:`"${q}" ${yes ? '나는 좋아해요!' : '나는 안 좋아해요!'}`, say:`${q} 알맞은 대답을 골라 봐요`, listen:q, vis:{ k:'html', html:`<span class="pic">${x.e}${yes ? '👍' : '👎'}</span>` }, opts:['Yes, I do.', "No, I don't."], ans:right, sayOpts:true, cols:2,
    hint:'좋아하면 Yes, I do. 안 좋아하면 No, I don\'t.', explain:`${right} = ${yes ? '응, 좋아해.' : '아니, 안 좋아해.'}` }); }
// 좋아해요 / 안 좋아해요 문장 듣고 그림
const G3_LIKE2 = G3_LIKE.flatMap(x => [{ w:x.w + '+', k:x.k, e:`${x.e}😋`, s:`I like ${x.w}.`, sk:x.sk }, { w:x.w + '-', k:x.k, e:`${x.e}🙅‍♀️`, s:`I don't like ${x.w}.`, sk:`나는 ${g3Ko(x.k, '을', '를')} 안 좋아해요.` }]);
function g3LikeListen(){ const x = pick(G3_LIKE2), twin = G3_LIKE2.find(y => y.w !== x.w && y.w.slice(0, -1) === x.w.slice(0, -1)), o = pick(G3_LIKE2.filter(y => y.w.slice(0, -1) !== x.w.slice(0, -1) && y.w.slice(-1) === x.w.slice(-1))), all = [x, twin, o];
  return e3q('e3s', { key:`g:ll:${x.s}|${o.s}`, prompt:'문장을 잘 듣고 알맞은 그림을 골라요', say:'문장을 잘 듣고 알맞은 그림을 골라 봐요', listen:x.s, vis:{ k:'listen' }, opts:all.map(y => y.s), ans:x.s, pic:true, optHtml:Object.fromEntries(all.map(y => [y.s, PIC(y.e, false)])), hint:"don't가 들리면 안 좋아하는 거예요", explain:`${x.s} = ${x.sk}` }); }
// What ~ do you like?
const G3_WHAT = [['color', E2.color.map(x => ({ w:x.w, k:x.k, e:x.e }))], ['animal', E3.pets], ['fruit', E3.food.filter(x => !['carrots','tomatoes','cookies'].includes(x.w))]];
function g3WhatLike(){ const [c, pool] = pick(G3_WHAT), x = pick(pool), os = others2(pool, x).map(o => `I like ${o.w}.`), right = `I like ${x.w}.`, q = `What ${c} do you like?`;
  return e3q('e3d', { key:`g:wk:${c}${x.w}|${os}`, prompt:`"${q}" 💗 그림을 보고 대답해요`, say:`${q} 하트 그림을 보고 알맞은 대답을 골라 봐요`, listen:q, vis:{ k:'html', html:g3Pair(PIC(x.e, true), '<span style="font-size:56px">💗</span>') }, opts:[right, ...os], ans:right, sayOpts:true, cols:1, hint:'I like 다음에 좋아하는 것을 말해요', explain:`${right} = 나는 ${g3Ko(x.k, '을', '를')} 좋아해요.` }); }
function g3WhichQ(){ const [c, pool] = pick(G3_WHAT), x = pick(pool), a = `I like ${x.w}.`, right = `What ${c} do you like?`;
  return e3q('e3q', { key:`g:wq:${c}${x.w}`, prompt:`"${a}" 이 대답에 맞는 질문은?`, say:`${a} 이 대답에 맞는 질문을 골라 봐요`, listen:a, vis:{ k:'html', html:PIC(x.e, true) }, opts:G3_WHAT.map(([y]) => `What ${y} do you like?`), ans:right, sayOpts:true, cols:1,
    hint:'color는 색깔, animal은 동물, fruit은 과일이에요', explain:`${right} = 무슨 ${{ color:'색깔', animal:'동물', fruit:'과일' }[c]}을 좋아해?` }); }

/* ---------- 4단원: How many ~? (하나, 여럿 -s) ---------- */
const g3Many = (n, sg, pl) => `${g3Num(n)} ${n === 1 ? sg : pl}`;
function g3Plural(){ const [sg, pl, k, e] = pick(E3.count), n = rnd(1, 10);
  const longer = shuffle([1,2,3,4,5,6,7,8,9,10].filter(m => m !== n && g3Num(m).length >= g3Num(n).length)), any = shuffle([1,2,3,4,5,6,7,8,9,10].filter(m => m !== n));
  const m = (Math.random() < .6 && longer.length ? longer : any)[0], right = g3Many(n, sg, pl), wrongS = `${g3Num(n)} ${n === 1 ? pl : sg}`, wrongN = g3Many(m, sg, pl);
  return e3q('e3p', { key:`g:pc:${n}${sg}|${m}`, prompt:'그림에 맞는 말을 골라요', say:'몇 개인지 세어 보고 알맞은 말을 골라 봐요', listen:right, vis:{ k:'count', n, e }, opts:[right, wrongS, wrongN], ans:right, sayOpts:true, cols:1,
    hint:'하나면 그대로, 둘 이상이면 끝에 s를 붙여요', explain:`${right} = ${k} ${n}${n === 1 ? '개 (하나라서 s가 없어요)' : '개 (둘 이상이라서 s를 붙여요)'}` }); }
const g3CountPic = (e, n) => `<span style="display:inline-grid;grid-template-columns:repeat(${Math.min(n, 4)},auto);gap:0 2px;font-size:${n > 6 ? 17 : 22}px;line-height:1.15">${`<span>${e}</span>`.repeat(n)}</span>`;
function g3PluralListen(){ const it = pick(E3.count), n = rnd(1, 9), ms = shuffle([n - 2, n - 1, n + 1, n + 2].filter(m => m >= 1 && m <= 9)).slice(0, 2), o = pick(E3.count.filter(y => y !== it));
  const all = [[n, it], [ms[0], it], [n, o]], lab = ([m, y]) => g3Many(m, y[0], y[1]);
  return e3q('e3w', { key:`g:pl:${lab(all[0])}|${lab(all[1])}|${lab(all[2])}`, prompt:'잘 듣고 알맞은 그림을 골라요', say:'잘 듣고 알맞은 그림을 골라 봐요', listen:lab(all[0]), vis:{ k:'listen' }, opts:all.map(lab), ans:lab(all[0]), pic:true, optHtml:Object.fromEntries(all.map(a => [lab(a), g3CountPic(a[1][3], a[0])])), hint:'몇 개인지, 무엇인지 둘 다 잘 들어 봐요', explain:`${lab(all[0])} = ${it[2]} ${n}개` }); }
function g3HowMany(){ const [sg, pl, k, e] = pick(E3.count), n = rnd(2, 15), q = `How many ${pl}?`, ms = shuffle([n - 2, n - 1, n + 1, n + 2].filter(m => m >= 2 && m <= 20)).slice(0, 2);
  const say = m => `${g3Cap(g3Num(m))} ${pl}.`;
  return e3q('e3d', { key:`g:hm:${n}${pl}|${ms}`, prompt:`"${q}" 세어 보고 대답해요`, say:`${q} 세어 보고 알맞은 대답을 골라 봐요`, listen:q, vis:{ k:'count', n, e }, opts:[n, ...ms].map(say), ans:say(n), sayOpts:true, cols:1, hint:'다섯 개씩 묶어서 세어 봐요', explain:`${say(n)} = ${k} ${n}개` }); }
function g3NumListen(){ const n = rnd(1, 20);
  return e3q('e3n', { key:`g:nl:${n}`, prompt:'잘 듣고 숫자를 눌러요', say:'영어로 숫자를 말해 줄게요. 잘 듣고 숫자를 눌러 봐요', listen:g3Num(n), vis:{ k:'listen' }, input:'numpad', ans:n, hint:`${g3Num(n)}... 다시 들어 봐요${n > 12 ? '. -teen은 10보다 큰 수예요' : ''}`, explain:`${g3Num(n)} = ${n}` }); }
function g3NumWord(){ const n = rnd(1, 20), ms = shuffle([n - 2, n - 1, n + 1, n + 2, n + 10, n - 10].filter(m => m >= 1 && m <= 20 && m !== n)).slice(0, 2);
  return e3q('e3p', { key:`g:nw:${n}|${ms}`, prompt:'숫자를 영어로 골라요', say:'이 숫자를 영어로 뭐라고 할까요? 골라 봐요', vis:{ k:'html', html:PIC(String(n), true) }, opts:[n, ...ms].map(g3Num), ans:g3Num(n), sayOpts:true, cols:1, hint:'스피커를 눌러 하나씩 들어 봐요', explain:`${n} = ${g3Num(n)}` }); }
const g3CountBig = (e, n) => `<div class="count-grid">${Array.from({ length:Math.ceil(n / 5) }, (_, g) => `<span class="grp">${`<span>${e}</span>`.repeat(Math.min(5, n - g * 5))}</span>`).join('')}</div>`;
const G3_HAVE = E3.count.flatMap(([sg, pl, k, e]) => [2, 3, 4, 5, 6].map(n => ({ w:`${n}${sg}`, n, e:big => big ? g3CountBig(e, n) : g3CountPic(e, n), s:`I have ${g3Num(n)} ${pl}.`, sk:`나는 ${k} ${n}개가 있어요.` })));
function g3HaveChoose(){ const x = pick(G3_HAVE), sg = x.w.replace(/^\d+/, ''), it = E3.count.find(y => y[0] === sg), ms = shuffle([x.n - 1, x.n + 1, x.n + 2].filter(m => m >= 2)).slice(0, 1)[0];
  const wrongN = `I have ${g3Num(ms)} ${it[1]}.`, wrongS = `I have ${g3Num(x.n)} ${it[0]}.`;
  return e3q('e3s', { key:`g:hv:${x.w}|${ms}`, prompt:'그림에 맞는 문장을 골라요', say:'몇 개인지 세어 보고 알맞은 문장을 골라 봐요', listen:x.s, vis:{ k:'count', n:x.n, e:it[3] }, opts:[x.s, wrongN, wrongS], ans:x.s, sayOpts:true, cols:1, hint:'개수와 끝의 s를 둘 다 봐요', explain:`${x.s} = ${x.sk}` }); }

/* ---------- 5단원: What time is it? · 하루 일과 ---------- */
const G3_H12 = h => g3Num(h);
function g3Time(){ const h = rnd(1, 12), os = shuffle([1,2,3,4,5,6,7,8,9,10,11,12].filter(x => x !== h)).slice(0, 2), say = x => `It's ${G3_H12(x)} o'clock.`;
  return e3q('e3d', { key:`g:tm:${h}|${os}`, prompt:'"What time is it?" 알맞은 대답은?', say:'What time is it? 시계를 보고 알맞은 대답을 골라 봐요', listen:'What time is it?', vis:{ k:'clock', h, m:0 }, opts:[h, ...os].map(say), ans:say(h), sayOpts:true, cols:1, hint:'짧은바늘이 가리키는 숫자를 봐요', explain:`${say(h)} = ${h}시예요.` }); }
const G3_CLOCKS = [1,2,3,4,5,6,7,8,9,10,11,12].map(h => ({ w:`${G3_H12(h)} o'clock`, k:`${h}시`, e:big => g3Clock(h, big), s:`It's ${G3_H12(h)} o'clock.`, sk:`${h}시예요.`, h }));
function g3TimeNum(){ const h = rnd(1, 12), t = `${G3_H12(h)} o'clock`;
  return e3q('e3n', { key:`g:tn:${h}`, prompt:'잘 듣고 몇 시인지 숫자를 눌러요', say:'잘 듣고 몇 시인지 숫자를 눌러 봐요', listen:`It's ${t}.`, vis:{ k:'listen' }, input:'numpad', ans:h, hint:`${t}... 다시 들어 봐요`, explain:`It's ${t}. = ${h}시예요.` }); }
// 일과 + 시각
const G3_AT = E3.routine.flatMap(x => G3_ROUT_H[x.w].map(h => ({ x, h, s:`I ${x.w} at ${G3_H12(h)}.`, sk:`나는 ${h}시에 ${x.sk.replace('나는 ', '')}` })));
const g3AtPic = (a, big) => big ? g3Pair(`<span class="pic">${a.x.e}</span>`, `<div style="width:150px">${clockSVG(a.h, 0)}</div>`) : `<span style="display:grid;justify-items:center"><span style="font-size:34px;line-height:1">${a.x.e}</span>${g3Clock(a.h, false).replace('max-width:96px', 'max-width:80px')}</span>`;
function g3AtChoose(){ const a = pick(G3_AT), oh = pick(G3_AT.filter(b => b.x === a.x && b.h !== a.h)), ow = pick(G3_AT.filter(b => b.x !== a.x && b.s !== oh.s));
  return e3q('e3s', { key:`g:at:${a.s}|${oh.s}|${ow.s}`, prompt:'그림에 맞는 문장을 골라요', say:'그림과 시계를 보고 알맞은 문장을 골라 봐요', listen:a.s, vis:{ k:'html', html:g3AtPic(a, true) }, opts:[a.s, oh.s, ow.s], ans:a.s, sayOpts:true, cols:1, hint:'무엇을 하는지, 몇 시인지 둘 다 봐요', explain:`${a.s} = ${a.sk}` }); }
function g3AtListen(){ const a = pick(G3_AT), oh = pick(G3_AT.filter(b => b.x !== a.x && b.h === a.h).concat(G3_AT.filter(b => b.x === a.x && b.h !== a.h))), ow = pick(G3_AT.filter(b => b.s !== a.s && b.s !== oh.s)), all = [a, oh, ow];
  return e3q('e3w', { key:`g:al:${a.s}|${oh.s}|${ow.s}`, prompt:'문장을 잘 듣고 알맞은 그림을 골라요', say:'문장을 잘 듣고 알맞은 그림을 골라 봐요', listen:a.s, vis:{ k:'listen' }, opts:all.map(b => b.s), ans:a.s, pic:true, optHtml:Object.fromEntries(all.map(b => [b.s, g3AtPic(b, false)])), hint:`"${a.s}" 다시 들어 봐요`, explain:`${a.s} = ${a.sk}` }); }
function g3WhatTimeDo(){ const a = pick(G3_AT), q = `What time do you ${a.x.w.replace(/\bmy\b/, 'your')}?`, os = shuffle([1,2,3,4,5,6,7,8,9,10,11,12].filter(h => h !== a.h)).slice(0, 2), say = h => `At ${G3_H12(h)}.`;
  return e3q('e3d', { key:`g:wd:${a.s}|${os}`, prompt:`"${q}" 시계를 보고 대답해요`, say:`${q} 시계를 보고 알맞은 대답을 골라 봐요`, listen:q, vis:{ k:'html', html:g3AtPic(a, true) }, opts:[a.h, ...os].map(say), ans:say(a.h), sayOpts:true, cols:1, hint:'짧은바늘이 가리키는 숫자를 봐요', explain:`${say(a.h)} = ${a.h}시에. (${a.sk})` }); }

/* ---------- 6단원: 요일 ---------- */
const G3_DK = ['월','화','수','목','금','토','일'];
const g3Week = (i, tag) => `<div style="display:flex;gap:4px;justify-content:center">${G3_DK.map((d, j) => `<span style="display:inline-flex;flex-direction:column;align-items:center;justify-content:center;width:38px;height:${tag ? 58 : 46}px;border-radius:10px;font-size:20px;font-weight:700;${j === i ? 'background:#FFD43B;border:3px solid #F0A500;' : 'background:#F4EEF1;border:3px solid transparent;color:#9A8A93;'}">${j === i && tag ? `<small style="font-size:11px">${tag}</small>` : ''}${d}</span>`).join('')}</div>`;
const G3_D = E3.days.map(x => x.w);
function g3DayPick(){ const i = rnd(0, 6), x = E3.days[i], os = others2(E3.days, x).map(o => o.w);
  return e3q('e3p', { key:`g:dp:${i}|${os}`, prompt:`노란색 요일(${x.k})을 영어로 골라요`, say:`노란색 요일, ${x.k}을 영어로 골라 봐요`, vis:{ k:'html', html:g3Week(i) }, opts:[x.w, ...os], ans:x.w, sayOpts:true, cols:1, hint:'스피커를 눌러 하나씩 들어 봐요', explain:`${x.w} = ${x.k}` }); }
function g3DayNext(){ const i = rnd(0, 6), a = G3_D[(i + 7 - 2) % 7], b = G3_D[(i + 7 - 1) % 7], right = G3_D[i], os = shuffle(G3_D.filter(d => d !== right && d !== a && d !== b)).slice(0, 1).concat([a]);
  return e3q('e3f', { key:`g:dn:${i}|${os}`, prompt:'다음에 올 요일은?', say:'요일 순서대로! 다음에 올 요일을 골라 봐요', listen:`${a}, ${b}`, vis:{ k:'html', html:`<div class="sent text-q" style="font-family:var(--f-body)">${a}, ${b}, <span class="blank">&nbsp;</span></div>` }, opts:[right, ...os], ans:right, sayOpts:true, cols:1, hint:'월, 화, 수, 목, 금, 토, 일 순서를 떠올려 봐요', explain:`${a}, ${b}, ${right} (${E3.days[(i + 7 - 2) % 7].k}, ${E3.days[(i + 7 - 1) % 7].k}, ${E3.days[i].k})` }); }
function g3Today(){ const i = rnd(0, 6), os = shuffle(G3_D.filter((d, j) => j !== i)).slice(0, 2).map(d => `It's ${d}.`), right = `It's ${G3_D[i]}.`;
  return e3q('e3d', { key:`g:td:${i}|${os}`, prompt:'"What day is it today?" 알맞은 대답은?', say:'What day is it today? 오늘이 무슨 요일인지 보고 골라 봐요', listen:'What day is it today?', vis:{ k:'html', html:g3Week(i, '오늘') }, opts:[right, ...os], ans:right, sayOpts:true, cols:1, hint:'"오늘" 칸의 요일을 영어로 떠올려 봐요', explain:`${right} = 오늘은 ${E3.days[i].k}이에요.` }); }
function g3Tomorrow(){ const i = rnd(0, 6), t = (i + 1) % 7, os = shuffle([G3_D[i], G3_D[(i + 2) % 7], G3_D[(i + 6) % 7]]).slice(0, 2);
  return e3q('e3f', { key:`g:tw:${i}|${os}`, prompt:`"Today is ${G3_D[i]}." 내일은 무슨 요일?`, say:`Today is ${G3_D[i]}. 내일은 무슨 요일일까요?`, listen:`Today is ${G3_D[i]}.`, vis:{ k:'html', html:g3Week(i, '오늘') + `<div class="sent text-q" style="font-family:var(--f-body)">Tomorrow is <span class="blank">&nbsp;</span>.</div>` }, opts:[G3_D[t], ...os], ans:G3_D[t], sayOpts:true, cols:1,
    hint:'tomorrow는 "내일"이에요. 오늘 바로 다음 요일!', explain:`Tomorrow is ${G3_D[t]}. = 내일은 ${E3.days[t].k}이에요.` }); }
const G3_DAYPOOL = E3.days.map((x, i) => ({ w:x.w, k:x.k, e:() => g3Week(i), s:`It's ${x.w}.`, sk:`${x.k}이에요.` }));
// 요일 + 하는 일
const G3_WEEK = E3.weekAct.flatMap(a => E3.days.map(d => ({ w:`${a.w}|${d.w}`, a, d, s:`I ${a.w} on ${d.w}.`, sk:`나는 ${d.k}에 ${a.k}.`,
  e:big => big ? `<div style="display:grid;justify-items:center;gap:6px"><span style="background:#FFD43B;border-radius:12px;padding:4px 14px;font-size:24px;font-weight:700">${d.k}</span><span class="pic">${a.e}</span></div>`
    : `<span style="display:grid;justify-items:center;line-height:1.1"><span style="background:#FFD43B;border-radius:8px;padding:1px 6px;font-size:15px;font-weight:700">${d.k}</span><span style="font-size:36px">${a.e}</span></span>` })));
function g3OnDay(){ const x = pick(G3_WEEK), sa = pick(G3_WEEK.filter(y => y.a === x.a && y.d !== x.d)), sd = pick(G3_WEEK.filter(y => y.d === x.d && y.a !== x.a));
  return e3q('e3s', { key:`g:od:${x.s}|${sa.s}|${sd.s}`, prompt:'그림에 맞는 문장을 골라요', say:'요일과 그림을 보고 알맞은 문장을 골라 봐요', listen:x.s, vis:{ k:'html', html:x.e(true) }, opts:[x.s, sa.s, sd.s], ans:x.s, sayOpts:true, cols:1, hint:'무엇을 하는지, 무슨 요일인지 둘 다 봐요', explain:`${x.s} = ${x.sk}` }); }
function g3OnDayQ(){ const x = pick(G3_WEEK), q = `What do you do on ${x.d.w}?`, os = others2(E3.weekAct, x.a).map(o => `I ${o.w}.`), right = `I ${x.a.w}.`;
  return e3q('e3d', { key:`g:oq:${x.s}|${os}`, prompt:`"${q}" 그림을 보고 대답해요`, say:`${q} 그림을 보고 알맞은 대답을 골라 봐요`, listen:q, vis:{ k:'html', html:x.e(true) }, opts:[right, ...os], ans:right, sayOpts:true, cols:1, hint:'그림 속 하는 일을 영어로 떠올려 봐요', explain:`${right} = 나는 ${x.a.k}.` }); }

/* ---------- 7단원: Let's ~ / Don't ~ ---------- */
const G3_YES = ['Okay!', 'Sounds good!', 'Good idea!'], G3_NO = ["Sorry, I can't.", 'No, thanks.'];
const G3_YNK = { 'Okay!':'좋아!', 'Sounds good!':'좋아!', 'Good idea!':'좋은 생각이야!', "Sorry, I can't.":'미안, 못 해.', 'No, thanks.':'아니, 괜찮아.' };
function g3LetsReply(){ const x = pick(E3.lets), yes = Math.random() < .5, y = pick(G3_YES), n = pick(G3_NO), right = yes ? y : n;
  return e3q('e3d', { key:`g:lr:${x.w}|${y}|${n}|${yes}`, prompt:`친구가 "${x.s}" 하고 말해요. 나는 ${yes ? '하고 싶어요!' : '지금 못 해요.'}`, say:`${x.s} 나라면 뭐라고 대답할까요? 골라 봐요`, listen:x.s, vis:{ k:'html', html:`<span class="pic">${x.e}${yes ? '😄' : '😢'}</span>` }, opts:[y, n], ans:right, sayOpts:true, cols:2,
    hint:'좋으면 Okay!, 못 하면 Sorry, I can\'t.', explain:`${right} = ${G3_YNK[right]}` }); }
const G3_LD = E3.ld.flatMap(([w, e, kl, kd]) => [{ w:`${w}+`, v:w, e:g3Mark(e, '✅'), s:`Let's ${w}.`, sk:kl }, { w:`${w}-`, v:w, e:g3Mark(e, '🚫'), s:`Don't ${w}.`, sk:kd }]);
function g3LetDont(){ const x = pick(G3_LD), twin = G3_LD.find(y => y.v === x.v && y !== x), o = pick(G3_LD.filter(y => y.v !== x.v));
  return e3q('e3s', { key:`g:ld:${x.s}|${o.s}`, prompt:'그림에 맞는 문장을 골라요 (✅ 하자 / 🚫 하지 마)', say:'초록 표시는 하자, 빨간 표시는 하지 마! 알맞은 문장을 골라 봐요', listen:x.s, vis:{ k:'html', html:x.e(true) }, opts:[x.s, twin.s, o.s], ans:x.s, sayOpts:true, cols:1, hint:"하자는 Let's, 하지 마는 Don't예요", explain:`${x.s} = ${x.sk}` }); }
function g3LdListen(){ const x = pick(G3_LD), twin = G3_LD.find(y => y.v === x.v && y !== x), o = pick(G3_LD.filter(y => y.v !== x.v && y.s.slice(0, 3) === x.s.slice(0, 3))), all = [x, twin, o];
  return e3q('e3w', { key:`g:dl3:${x.s}|${o.s}`, prompt:'잘 듣고 알맞은 그림을 골라요 (✅ 하자 / 🚫 하지 마)', say:'잘 듣고 알맞은 그림을 골라 봐요', listen:x.s, vis:{ k:'listen' }, opts:all.map(y => y.s), ans:x.s, pic:true, optHtml:Object.fromEntries(all.map(y => [y.s, y.e(false)])), hint:"Let's가 들리면 ✅, Don't가 들리면 🚫", explain:`${x.s} = ${x.sk}` }); }

/* ---------- 8단원: 장소와 탈것 ---------- */
const G3_RIDE = [...E3.ride, G3_FOOT];
const G3_RIDE2 = G3_RIDE.filter(r => !['plane', 'ship'].includes(r.w));
function g3By(){ const x = pick(G3_RIDE2), os = others2(G3_RIDE2, x).map(o => o.s);
  return e3q('e3d', { key:`g:by:${x.w}|${os}`, prompt:'"How do you go to school?" 알맞은 대답은?', say:'How do you go to school? 그림을 보고 알맞은 대답을 골라 봐요', listen:'How do you go to school?', vis:{ k:'html', html:g3Pair(`<span class="pic">${x.e}</span>`, '<span style="font-size:56px">🏫</span>') }, opts:[x.s, ...os], ans:x.s, sayOpts:true, cols:1,
    hint:'탈것은 By 다음에, 걸어가면 On foot.', explain:`${x.s} = ${x.sk}` }); }
function g3Going(){ const x = pick(E3.place), os = others2(E3.place, x).map(o => o.s), q = 'Where are you going?';
  return e3q('e3d', { key:`g:gg:${x.w}|${os}`, prompt:`"${q}" 그림을 보고 대답해요`, say:`${q} 그림을 보고 알맞은 대답을 골라 봐요`, listen:q, vis:{ k:'html', html:PIC(x.e, true) }, opts:[x.s, ...os], ans:x.s, sayOpts:true, cols:1, hint:'그림 속 장소를 영어로 떠올려 봐요', explain:`${x.s} = ${x.sk}` }); }
const G3_GOBY = E3.place.flatMap(p => E3.ride.filter(r => !['plane', 'ship'].includes(r.w)).map(r => ({ w:`${p.w}|${r.w}`, p, r, s:`I go ${p.to} by ${r.w}.`, sk:`나는 ${r.k}${r.k === '지하철' ? '로' : g3Ko(r.k, '으로', '로')} ${p.k}에 가요.`,
  e:big => big ? g3Pair(`<span class="pic">${r.e}</span>`, `<span style="font-size:40px">➡️</span><span class="pic">${p.e}</span>`) : `<span style="font-size:30px;white-space:nowrap">${r.e}➡️${p.e}</span>` })));
function g3GoBy(){ const x = pick(G3_GOBY), sp = pick(G3_GOBY.filter(y => y.p === x.p && y.r !== x.r)), sr = pick(G3_GOBY.filter(y => y.r === x.r && y.p !== x.p)), all = [x, sp, sr];
  return e3q('e3w', { key:`g:gb:${x.s}|${sp.s}|${sr.s}`, prompt:'문장을 잘 듣고 알맞은 그림을 골라요', say:'문장을 잘 듣고 알맞은 그림을 골라 봐요', listen:x.s, vis:{ k:'listen' }, opts:all.map(y => y.s), ans:x.s, pic:true, optHtml:Object.fromEntries(all.map(y => [y.s, y.e(false)])), hint:'어디에 가는지, 무엇을 타는지 둘 다 들어 봐요', explain:`${x.s} = ${x.sk}` }); }

/* ---------- 9단원: 생일 · 나이 · 나를 소개해요 ---------- */
const g3Candle = n => `<span class="pic" style="font-size:72px">🎂</span><div style="font-size:26px;max-width:230px;margin:auto">${'🕯️'.repeat(n)}</div>`;
function g3Age(){ const n = rnd(5, 12), who = pick(['you', 'he', 'she']), q = who === 'you' ? 'How old are you?' : `How old is ${who}?`, P = who === 'you' ? "I'm" : who === 'he' ? 'He is' : 'She is', W = who === 'he' ? 'She is' : 'He is';
  const m = pick([n - 1, n + 1, n + 2].filter(x => x >= 5 && x <= 13)), say = (p, x) => `${p} ${g3Num(x)}.`;
  const opts = who === 'you' ? [say(P, n), say(P, m), say(P, pick([n - 2, n + 3].filter(x => x >= 4 && x !== m)))] : [say(P, n), say(W, n), say(P, m)];
  const face = who === 'you' ? '🙋' : who === 'he' ? '👦' : '👧';
  return e3q('e3d', { key:`g:ag:${who}${n}|${opts.slice(1)}`, prompt:`"${q}" 초를 세어 보고 대답해요`, say:`${q} 초를 세어 보고 알맞은 대답을 골라 봐요`, listen:q, vis:{ k:'html', html:`<span class="pic" style="font-size:64px">${face}</span>` + g3Candle(n) }, opts, ans:opts[0], sayOpts:true, cols:1,
    hint:who === 'you' ? '초를 하나씩 세어 봐요' : '남자아이는 He, 여자아이는 She예요. 초도 세어 봐요', explain:`${opts[0]} = ${who === 'you' ? '나는' : who === 'he' ? '그는' : '그녀는'} ${n}살이에요.` }); }
function g3AgeNum(){ const n = rnd(5, 12), s = pick([`I'm ${g3Num(n)}.`, `I'm ${g3Num(n)} years old.`]);
  return e3q('e3n', { key:`g:an:${s}`, prompt:'잘 듣고 몇 살인지 숫자를 눌러요', say:'잘 듣고 몇 살인지 숫자를 눌러 봐요', listen:s, vis:{ k:'listen' }, input:'numpad', ans:n, hint:`${s} 다시 들어 봐요`, explain:`${s} = 나는 ${n}살이에요.` }); }
function g3BScene(){ const [k, a, e, ak] = pick(E3.bScene), os = shuffle(E3.bScene.filter(y => y[1] !== a)).slice(0, 2).map(y => y[1]);
  return e3q('e3d', { key:`g:bs:${a}|${os}`, prompt:k, say:k + ' 뭐라고 할까요?', vis:{ k:'html', html:PIC(e, true) }, opts:[a, ...os], ans:a, sayOpts:true, cols:1, hint:'스피커를 눌러 하나씩 들어 봐요', explain:`${a} = ${ak}` }); }
// 나를 소개해요: 소개 글 읽고(또는 듣고) 답하기
const G3_INLIKE = [...E3.food.slice(0, 5), ...E3.pets.slice(0, 5)], G3_INCAN = E2.act.map(x => ({ w:x.w, k:x.k, e:x.e, sk:x.sk }));
function g3Intro(listen){ const [name, face, kname] = pick(G3_KIDS), age = rnd(7, 11), like = pick(G3_INLIKE), can = pick(G3_INCAN), qk = pick(['age', 'like', 'can']);
  const text = `Hi! I'm ${name}. I'm ${g3Num(age)}. I like ${like.w}. I can ${can.w}.`, nm = g3Ko(kname, '이는', '는');
  let o = {};
  if (qk === 'age') { const ms = shuffle([age - 1, age + 1, age + 2].filter(x => x >= 6)).slice(0, 2); o = { prompt:`${nm} 몇 살이에요?`, opts:[age, ...ms].map(x => `${x}살`), ans:`${age}살`, cols:3, big:true, hint:`I'm 다음에 나오는 숫자를 찾아요`, explain:`I'm ${g3Num(age)}. = 나는 ${age}살이에요.` }; }
  else { const pool = qk === 'like' ? G3_INLIKE : G3_INCAN, x = qk === 'like' ? like : can, os = others2(pool, x), all = [x, ...os];
    o = { prompt:`${nm} ${qk === 'like' ? '무엇을 좋아해요?' : '무엇을 할 수 있어요?'}`, opts:all.map(y => y.w), ans:x.w, pic:true, optHtml:Object.fromEntries(all.map(y => [y.w, PIC(y.e, false)])),
      hint:qk === 'like' ? 'I like 다음 낱말을 찾아요' : 'I can 다음 낱말을 찾아요', explain:qk === 'like' ? `I like ${like.w}. = 나는 ${g3Ko(like.k, '을', '를')} 좋아해요.` : `I can ${can.w}. = ${can.sk}` }; o.key = `|${os.map(y => y.w)}`; }
  const card = `<div style="display:flex;gap:10px;align-items:center;justify-content:center"><span style="font-size:60px">${face}</span>${listen ? '' : `<div class="sent" style="font-family:var(--f-body);text-align:left;font-size:22px;line-height:1.45;white-space:nowrap">${text.replace(/\. /g, '.<br>').replace('! ', '!<br>')}</div>`}</div>`;
  return e3q(listen ? 'e3w' : 'e3r', Object.assign(o, { key:`g:in:${listen ? 'L' : 'R'}${name}${age}${like.w}${can.w}${qk}${o.key || ''}`, say:listen ? `잘 듣고 대답해 봐요. ${o.prompt}` : `소개 글을 읽고 대답해 봐요. ${o.prompt}`, vis:{ k:'html', html:card }, prompt:(listen ? '잘 듣고 답해요. ' : '읽고 답해요. ') + o.prompt },
    listen ? { listen:text } : {})); }
// 이름 · 나이 묻는 말에 알맞은 대답
const G3_ASK = [['What\'s your name?', n => `I'm ${n[0]}.`, '이름'], ['How old are you?', (n, a) => `I'm ${g3Num(a)}.`, '나이'], ['Do you like cats?', () => 'Yes, I do.', '좋아하는지'], ['Can you swim?', () => 'Yes, I can.', '할 수 있는지']];
function g3Ask(){ const kid = pick(G3_KIDS), age = rnd(7, 11), [q, f] = pick(G3_ASK), right = f(kid, age), os = shuffle(G3_ASK.filter(y => y[0] !== q)).slice(0, 2).map(y => y[1](kid, age));
  return e3q('e3d', { key:`g:ak:${q}${right}|${os}`, prompt:`"${q}" 알맞은 대답은?`, say:`${q} 알맞은 대답을 골라 봐요`, listen:q, vis:{ k:'html', html:`<span class="pic">${kid[1]}</span><div class="sent" style="font-size:20px">${kid[2]} · ${age}살</div>` }, opts:[right, ...os], ans:right, sayOpts:true, cols:1,
    hint:'묻는 말의 첫 낱말(What, How, Do, Can)을 잘 들어 봐요', explain:`${q} → ${right}` }); }

/* ---------- 차시별 문제 ---------- */
Object.assign(LESSON_GEN, {
  'g1-1':g3Mix(() => g3Listen(E3.school), () => g3Pick(E3.school), () => g3Mean(E3.school), () => g3Build(E3.school)),
  'g1-2':g3Mix(g3WhatThis, g3WhatThis, () => g3SentPic(E3.school), () => g3OX(E3.school)),
  'g1-3':g3Mix(g3AorAn, g3AorAn, g3IsIt, g3IsIt),
  'g2-1':g3Mix(g3PosWord, g3PosWord, g3PosListen, g3PosMean),
  'g2-2':g3Mix(g3Where, g3Where, g3PosFill, g3PosFill),
  'g2-3':g3Mix(() => g3SentPic(G3_SCENES), () => g3OX(G3_SCENES), () => g3Order(G3_SCENES), g3Where),
  'g3-1':g3Mix(() => g3Listen(G3_LIKE), () => g3SentChoose(G3_LIKE), () => g3SentPic(G3_LIKE), () => g3Mean(G3_LIKE)),
  'g3-2':g3Mix(g3DoLike, g3DoLike, g3LikeListen, () => g3Order(G3_LIKE2)),
  'g3-3':g3Mix(g3WhatLike, g3WhatLike, g3WhichQ),
  'g4-1':g3Mix(g3Plural, g3Plural, g3PluralListen, g3NumWord),
  'g4-2':g3Mix(g3HowMany, g3HowMany, g3NumListen, g3NumWord),
  'g4-3':g3Mix(g3HaveChoose, () => g3SentPic(G3_HAVE), () => g3OX(G3_HAVE), g3HowMany),
  'g5-1':g3Mix(g3Time, g3Time, () => g3SentPic(G3_CLOCKS), g3TimeNum),
  'g5-2':g3Mix(() => g3Listen(E3.routine), () => g3Pick(E3.routine), () => g3SentMean(E3.routine), () => g3Order(E3.routine)),
  'g5-3':g3Mix(g3AtChoose, g3AtListen, g3WhatTimeDo, g3Time),
  'g6-1':g3Mix(g3DayPick, g3DayPick, () => g3Mean(E3.days), g3DayNext),
  'g6-2':g3Mix(g3Today, g3Today, g3Tomorrow, () => g3OX(G3_DAYPOOL)),
  'g6-3':g3Mix(g3OnDay, g3OnDayQ, () => g3SentPic(G3_WEEK), () => g3SentMean(G3_WEEK)),
  'g7-1':g3Mix(() => g3SentPic(E3.lets), () => g3SentChoose(E3.lets), () => g3SentMean(E3.lets), () => g3Order(E3.lets)),
  'g7-2':g3Mix(g3LetsReply, g3LetsReply, () => g3OX(E3.lets), () => g3SentPic(E3.lets)),
  'g7-3':g3Mix(g3LetDont, g3LetDont, g3LdListen, () => g3SentMean(G3_LD)),
  'g8-1':g3Mix(() => g3Listen(E3.place), () => g3Pick(E3.place), () => g3Mean(E3.place), () => g3Build(E3.place)),
  'g8-2':g3Mix(() => g3Listen(E3.ride), () => g3Pick(E3.ride), g3By, g3By),
  'g8-3':g3Mix(g3Going, g3Going, g3GoBy, () => g3OX(E3.place)),
  'g9-1':g3Mix(g3Age, g3Age, g3AgeNum, g3NumWord),
  'g9-2':g3Mix(() => g3Listen(E3.bday), () => g3Pick(E3.bday), g3BScene, g3BScene),
  'g9-3':g3Mix(() => g3Intro(false), () => g3Intro(false), () => g3Intro(true), g3Ask),
});

/* ---------- 개념 카드 ---------- */
const g3Row = xs => `<div class="row" style="justify-content:center;gap:12px;flex-wrap:wrap">${xs.map(x => `<span class="word-chip"><span style="font-size:40px">${PIC3(x.e, false)}</span><b>${esc(x.w)}</b></span>`).join('')}</div>`;
const card3 = (xs, text, ko0, enText) => ({ ill:() => g3Row(xs), text, say:[ko(ko0), en(enText || xs.map(x => x.w).join(', '))] });
const card3s = (lines, text, ko0, enText) => ({ ill:() => sent2(lines), text, say:[ko(ko0), en(enText)] });
const g3SceneRow = xs => `<div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap">${xs.map(x => `<span class="word-chip">${x.e(false)}<b>${esc(x.w)}</b></span>`).join('')}</div>`;
const ENG_CURR3 = {
  title:'영어 세걸음 (3학년 영어 맛보기)', subj:'eng', short:'영어', grade:'3단계 · 3학년 영어 맛보기', short2:'3단계',
  units:[
    { n:1, name:'교실 물건', lessons:[
      { id:'g1-1', title:'pencil · ruler · eraser', cards:[card3(E3.school.slice(0, 8), '교실에서 쓰는 물건을 영어로 말해요. 내 필통 속 물건도 하나씩 꺼내 영어로 말해 봐요!', '교실 물건을 따라 말해요.')] },
      { id:'g1-2', title:"What's this? It's a pencil.", cards:[card3s(["✏️ What's this?", "It's a pencil."], '"What\'s this?"는 "이건 뭐야?"예요. "It\'s a ○○."는 "그건 ○○야."라는 뜻이에요.', '이게 뭔지 묻고 답해요.', "What's this? It's a pencil. It's a ruler.")] },
      { id:'g1-3', title:'a? an? Is it a pen?', cards:[card3s(['🍎 an apple · 🥚 an egg', '📕 a book · 🎒 a bag', 'Is it a pen? Yes, it is.'], 'a, e, i, o, u 소리로 시작하는 낱말 앞에는 a 대신 an을 써요. "Is it a ○○?"에는 Yes, it is. / No, it isn\'t.로 대답해요.', 'a와 an을 알아봐요.', "an apple, an egg, a book, a bag. Is it a pen? Yes, it is. No, it isn't.")] },
    ] },
    { n:2, name:'어디에 있어요?', lessons:[
      { id:'g2-1', title:'in · on · under', cards:[{ ill:() => g3SceneRow([G3_SCENES.find(x => x.id === 'cat|in|box'), G3_SCENES.find(x => x.id === 'cat|on|box'), G3_SCENES.find(x => x.id === 'cat|under|desk')]), text:'in은 "안에", on은 "위에", under는 "아래에"예요. 손으로 상자 안, 위, 아래를 가리키며 말해 봐요.', say:[ko('어디에 있는지 말해요.'), en('in the box, on the box, under the desk')] }] },
      { id:'g2-2', title:'Where is the cat?', cards:[card3s(['🐱 Where is the cat?', "It's on the bed."], '"Where is ○○?"는 "○○ 어디 있어?"예요. "It\'s on the bed."처럼 in, on, under로 대답해요.', '어디 있는지 묻고 답해요.', "Where is the cat? It's on the bed.")] },
      { id:'g2-3', title:'The ball is under the chair.', cards:[{ ill:() => g3SceneRow([G3_SCENES.find(x => x.id === 'ball|under|chair'), G3_SCENES.find(x => x.id === 'book|on|desk')]), text:'"The ball is under the chair."는 "공이 의자 아래에 있어요."예요. 무엇이, 어디에 있는지 잘 들어요.', say:[ko('문장으로 말해요.'), en('The ball is under the chair. The book is on the desk.')] }] },
    ] },
    { n:3, name:'좋아하는 것', lessons:[
      { id:'g3-1', title:'I like grapes.', cards:[card3(E3.food.slice(0, 6), '"I like ○○."는 "나는 ○○를 좋아해요."예요. 여러 개를 좋아할 땐 apples, grapes처럼 끝에 s가 붙어요.', '좋아하는 것을 말해요.', 'I like apples. I like grapes. I like cats.')] },
      { id:'g3-2', title:'Do you like cats?', cards:[card3s(['🐱 Do you like cats?', 'Yes, I do. 👍', "No, I don't. 👎"], '"Do you like ○○?"는 "○○ 좋아해?"예요. 좋아하면 "Yes, I do.", 안 좋아하면 "No, I don\'t."', '좋아하는지 묻고 답해요.', "Do you like cats? Yes, I do. No, I don't.")] },
      { id:'g3-3', title:'What color do you like?', cards:[card3s(['What color do you like?', 'I like blue. 💙', 'What animal do you like?', 'I like rabbits. 🐰'], 'color는 색깔, animal은 동물, fruit은 과일이에요. 무엇을 좋아하는지 묻고 "I like ○○."로 대답해요.', '무엇을 좋아하는지 물어요.', 'What color do you like? I like blue. What animal do you like? I like rabbits.')] },
    ] },
    { n:4, name:'몇 개예요?', lessons:[
      { id:'g4-1', title:'a cat, two cats', cards:[card3s(['🐱 one cat', '🐱🐱 two cats', '🍎🍎🍎 three apples'], '하나일 때는 cat, 둘 이상이면 cats처럼 끝에 s를 붙여요.', '하나와 여럿을 말해요.', 'one cat, two cats, three apples')] },
      { id:'g4-2', title:'How many ducks?', cards:[card3s(['How many ducks?', '🦆🦆🦆🦆🦆 🦆🦆', 'Seven ducks.'], '"How many ○○?"는 "○○ 몇 개야?"예요. 1부터 20까지 영어 숫자로 대답해요.', '몇 개인지 세어요.', 'How many ducks? Seven ducks.')] },
      { id:'g4-3', title:'I have three books.', cards:[card3s(['📕📕📕', 'I have three books.'], '"I have ○○."는 "나는 ○○가 있어요."예요. 몇 개인지 숫자를 넣어 말해요.', '가진 것을 세어 말해요.', 'I have three books. I have five balls.')] },
    ] },
    { n:5, name:'시각과 하루', lessons:[
      { id:'g5-1', title:"What time is it?", cards:[{ ill:() => `<div style="width:150px;margin:auto">${clockSVG(7, 0)}</div>` + sent2(['What time is it?', "It's seven o'clock."]), text:'"What time is it?"는 "몇 시야?"예요. 정각은 "It\'s ○ o\'clock."이라고 해요.', say:[ko('몇 시인지 묻고 답해요.'), en("What time is it? It's seven o'clock.")] }] },
      { id:'g5-2', title:'I get up. I go to school.', cards:[card3(E3.routine.slice(0, 6), '하루에 하는 일을 영어로 말해요. 아침에 일어나서 하는 일을 순서대로 따라 해 봐요.', '하루 일과를 따라 말해요.', 'I get up. I wash my face. I brush my teeth. I eat breakfast. I go to school.')] },
      { id:'g5-3', title:'I get up at seven.', cards:[card3s(['⏰ I get up at seven.', '🛌 I go to bed at nine.'], '"at seven"은 "7시에"예요. 하는 일 다음에 at과 시각을 붙여요.', '몇 시에 하는지 말해요.', 'I get up at seven. I go to bed at nine.')] },
    ] },
    { n:6, name:'요일', lessons:[
      { id:'g6-1', title:'Monday부터 Sunday까지', cards:[{ ill:() => sent2(['Monday 월 · Tuesday 화', 'Wednesday 수 · Thursday 목', 'Friday 금 · Saturday 토', 'Sunday 일']), text:'요일은 모두 -day로 끝나요. 월요일부터 일요일까지 노래하듯 따라 해 봐요.', say:[ko('요일을 따라 말해요.'), en(G3_D.join(', '))] }] },
      { id:'g6-2', title:'What day is it today?', cards:[{ ill:() => g3Week(4, '오늘') + sent2(['What day is it today?', "It's Friday."]), text:'"What day is it today?"는 "오늘 무슨 요일이야?"예요. tomorrow는 "내일"이에요.', say:[ko('오늘이 무슨 요일인지 말해요.'), en("What day is it today? It's Friday. Tomorrow is Saturday.")] }] },
      { id:'g6-3', title:'I swim on Monday.', cards:[{ ill:() => g3Row(G3_WEEK.filter(x => x.d.w === 'Monday' && x.a.w === 'swim' || x.d.w === 'Wednesday' && x.a.w === 'dance').map(x => ({ e:x.e, w:x.s }))), text:'"on Monday"는 "월요일에"예요. 요일 앞에는 on을 써요.', say:[ko('요일마다 하는 일을 말해요.'), en('I swim on Monday. I dance on Wednesday.')] }] },
    ] },
    { n:7, name:"함께 해요 (Let's)", lessons:[
      { id:'g7-1', title:"Let's play soccer.", cards:[card3(E3.lets.slice(0, 5).map(x => ({ e:x.e, w:x.s })), '"Let\'s ○○."는 "○○하자."예요. 친구에게 같이 하자고 말할 때 써요.', '같이 하자고 말해요.', "Let's play soccer. Let's ride bikes. Let's fly a kite.")] },
      { id:'g7-2', title:'Okay! / Sorry, I can\'t.', cards:[card3s(["⚽ Let's play soccer!", 'Okay! 😄', "Sorry, I can't. 😢"], '좋으면 "Okay!", "Sounds good!", 못 하면 "Sorry, I can\'t."라고 대답해요.', '하자는 말에 대답해요.', "Let's play soccer! Okay! Sounds good! Sorry, I can't.")] },
      { id:'g7-3', title:"Let's swim. / Don't swim.", cards:[{ ill:() => g3Row([G3_LD[2], G3_LD[3]].map(x => ({ e:x.e, w:x.s }))), text:'"Don\'t ○○."는 "○○하지 마요."예요. Let\'s는 하자, Don\'t는 하지 말자예요.', say:[ko('하자와 하지 마를 구별해요.'), en("Let's swim. Don't swim. Don't run.")] }] },
    ] },
    { n:8, name:'장소와 탈것', lessons:[
      { id:'g8-1', title:'school · park · zoo', cards:[card3(E3.place.slice(0, 6), '우리 동네 장소를 영어로 말해요. 내가 자주 가는 곳은 어디인가요?', '장소를 따라 말해요.')] },
      { id:'g8-2', title:'By bus. On foot.', cards:[card3(G3_RIDE.slice(0, 5).concat([G3_FOOT]), '"How do you go to school?"는 "학교에 어떻게 가?"예요. "By bus."처럼 by + 탈것, 걸어가면 "On foot."', '탈것을 따라 말해요.', 'bus, car, bike, train, taxi. By bus. On foot.')] },
      { id:'g8-3', title:"I'm going to the park.", cards:[card3s(['Where are you going?', "🏞️ I'm going to the park.", '🚌➡️🦁 I go to the zoo by bus.'], '"Where are you going?"은 "어디 가?"예요. "I\'m going to the ○○."로 대답해요. 집은 "home"만 써요.', '어디 가는지 말해요.', "Where are you going? I'm going to the park. I go to the zoo by bus.")] },
    ] },
    { n:9, name:'생일과 나', lessons:[
      { id:'g9-1', title:'How old are you?', cards:[card3s(['🎂 How old are you?', "I'm eight.", '👦 How old is he? He is ten.'], '"How old are you?"는 "몇 살이야?"예요. 다른 사람은 "How old is he(she)?"로 물어요.', '몇 살인지 묻고 답해요.', "How old are you? I'm eight. How old is he? He is ten.")] },
      { id:'g9-2', title:'Happy birthday!', cards:[card3(E3.bday.slice(0, 5), '생일에는 "Happy birthday!", 선물을 줄 땐 "This is for you.", 받으면 "Thank you!"', '생일에 하는 말을 따라 해요.', 'Happy birthday! This is for you. Thank you! Make a wish!')] },
      { id:'g9-3', title:"Hi! I'm Mina.", cards:[card3s(["👧 Hi! I'm Mina.", "I'm nine.", 'I like dogs.', 'I can swim.'], '나를 소개할 때는 이름, 나이, 좋아하는 것, 할 수 있는 것을 말해요. 재윤이도 영어로 소개해 봐요!', '나를 소개해요.', "Hi! I'm Mina. I'm nine. I like dogs. I can swim.")] },
    ] },
  ],
};
