/* ===================== 영어 2단계: 생활 영어 (1단계 파닉스 다음) ===================== */
/* 3학년 학교 영어를 미리 맛보는 주제: 인사·기분, 색깔, 숫자, 몸, 가족, 동물, 음식, 날씨·옷, 할 수 있어요·교실 영어.
   문장과 상황은 모두 새로 지은 것. 그림은 이모지와 색 동그라미로만 그려요 */
const PIC = (e, big) => typeof e === 'string' && e.startsWith('#')
  ? `<span class="swatch" style="background:${e};${big ? 'width:110px;height:110px;' : ''}${e === '#FFFFFF' ? 'border-color:#D9C7CF;' : ''}"></span>`
  : /^\d+$/.test(e) ? `<span class="disp" style="font-size:${big ? 88 : 46}px;color:#3E93E0">${e}</span>`
  : big ? `<span class="pic">${e}</span>` : `<span style="font-size:44px;line-height:1">${e}</span>`;
const it2 = a => a.map(([w, k, e, s, sk]) => ({ w, k, e, s, sk }));

/* ---------- 낱말 · 문장 ---------- */
const E2 = {
  greet: it2([['Hello!','안녕! (만났을 때)','👋'],['Goodbye!','잘 가! (헤어질 때)','🚪'],['Good morning!','좋은 아침! (아침 인사)','🌅'],['Good night!','잘 자! (자기 전 인사)','🌙'],['Thank you!','고마워!','🎁'],["I'm sorry.",'미안해.','🙇‍♀️'],['Nice to meet you!','만나서 반가워!','🤝']]),
  greetScene: [['친구가 생일 선물을 줬어요. 뭐라고 할까요?','Thank you!','🎁'],['아침에 일어나서 엄마를 만났어요.','Good morning!','🌅'],['잠자기 전에 오빠한테 인사해요.','Good night!','🌙'],['친구 발을 실수로 밟았어요.',"I'm sorry.",'🦶'],['학교 끝나고 친구랑 헤어져요.','Goodbye!','🚪'],['새 친구를 처음 만났어요.','Nice to meet you!','🤝'],['길에서 선생님을 만났어요.','Hello!','👋']],
  feel: it2([['happy','기쁜','😊',"I'm happy.",'나는 기뻐요.'],['sad','슬픈','😢',"I'm sad.",'나는 슬퍼요.'],['angry','화난','😠',"I'm angry.",'나는 화가 나요.'],['tired','피곤한','😩',"I'm tired.",'나는 피곤해요.'],['hungry','배고픈','🤤',"I'm hungry.",'나는 배고파요.'],['scared','무서운','😨',"I'm scared.",'나는 무서워요.'],['sleepy','졸린','😴',"I'm sleepy.",'나는 졸려요.']]),
  color: it2([['red','빨간색','#F0524F'],['orange','주황색','#FF9A3C'],['yellow','노란색','#FFD43B'],['green','초록색','#3CB371'],['blue','파란색','#3E93E0'],['pink','분홍색','#FF8FB1'],['purple','보라색','#9B6BD6'],['black','검은색','#333333'],['white','흰색','#FFFFFF'],['brown','갈색','#8B5A2B']]),
  colorObj: it2([['red','사과','🍎'],['yellow','바나나','🍌'],['green','개구리','🐸'],['purple','포도','🍇'],['orange','당근','🥕'],['brown','초콜릿','🍫'],['white','눈사람','⛄'],['pink','돼지','🐷'],['blue','고래','🐳'],['black','검은 공','🎱']]),
  teen: it2([['eleven','11','11'],['twelve','12','12'],['thirteen','13','13'],['fourteen','14','14'],['fifteen','15','15'],['sixteen','16','16'],['seventeen','17','17'],['eighteen','18','18'],['nineteen','19','19'],['twenty','20','20']]),
  face: it2([['eye','눈','👁️','Touch your eyes.','눈을 만져요.'],['ear','귀','👂','Touch your ears.','귀를 만져요.'],['nose','코','👃','Touch your nose.','코를 만져요.'],['mouth','입','👄','Touch your mouth.','입을 만져요.'],['tooth','이','🦷','Touch your teeth.','이를 만져요.']]),
  body: it2([['hand','손','✋','Clap your hands.','손뼉을 쳐요.'],['foot','발','🦶','Stamp your feet.','발을 굴러요.'],['leg','다리','🦵','Shake your legs.','다리를 흔들어요.'],['arm','팔','💪','Raise your arms.','팔을 들어요.'],['head','머리','🙆‍♀️','Touch your head.','머리를 만져요.']]),
  family: it2([['mom','엄마','👩','This is my mom.','이분은 우리 엄마예요.','She'],['dad','아빠','👨','This is my dad.','이분은 우리 아빠예요.','He'],['brother','오빠 (남자 형제)','👦','This is my brother.','이 사람은 우리 오빠예요.','He'],['sister','언니 (여자 형제)','👧','This is my sister.','이 사람은 우리 언니예요.','She'],['grandma','할머니','👵','This is my grandma.','이분은 우리 할머니예요.','She'],['grandpa','할아버지','👴','This is my grandpa.','이분은 우리 할아버지예요.','He'],['baby','아기','👶','This is my baby sister.','이 아기는 내 여동생이에요.','She']]),
  animal1: it2([['rabbit','토끼','🐰'],['bear','곰','🐻'],['monkey','원숭이','🐵'],['tiger','호랑이','🐯'],['elephant','코끼리','🐘'],['giraffe','기린','🦒']]),
  animal2: it2([['duck','오리','🦆'],['horse','말','🐴'],['cow','소','🐮'],['sheep','양','🐑'],['chicken','닭','🐔'],['penguin','펭귄','🐧']]),
  size: it2([['elephant','코끼리','🐘',"It's big.",'그것은 커요.'],['mouse','생쥐','🐭',"It's small.",'그것은 작아요.'],['whale','고래','🐳',"It's big.",'그것은 커요.'],['ant','개미','🐜',"It's small.",'그것은 작아요.'],['bear','곰','🐻',"It's big.",'그것은 커요.'],['chick','병아리','🐥',"It's small.",'그것은 작아요.']]),
  food: it2([['pizza','피자','🍕'],['bread','빵','🍞'],['milk','우유','🥛'],['water','물','💧'],['rice','밥','🍚'],['egg','달걀','🥚'],['cake','케이크','🍰'],['juice','주스','🧃'],['candy','사탕','🍬'],['soup','수프','🥣']]),
  weather: it2([['sunny','맑은','☀️',"It's sunny.",'날씨가 맑아요.'],['rainy','비 오는','🌧️',"It's rainy.",'비가 와요.'],['snowy','눈 오는','🌨️',"It's snowy.",'눈이 와요.'],['cloudy','흐린','☁️',"It's cloudy.",'날씨가 흐려요.'],['windy','바람 부는','🌬️',"It's windy.",'바람이 불어요.'],['hot','더운','🥵',"It's hot.",'날씨가 더워요.'],['cold','추운','🥶',"It's cold.",'날씨가 추워요.']]),
  clothes: it2([['coat','외투','🧥','Put on your coat.','외투를 입어요.'],['shoes','신발','👟','Put on your shoes.','신발을 신어요.'],['socks','양말','🧦','Put on your socks.','양말을 신어요.'],['gloves','장갑','🧤','Put on your gloves.','장갑을 껴요.'],['scarf','목도리','🧣','Put on your scarf.','목도리를 둘러요.'],['pants','바지','👖','Put on your pants.','바지를 입어요.'],['dress','원피스','👗','Put on your dress.','원피스를 입어요.']]),
  act: it2([['run','달리다','🏃','I can run.','나는 달릴 수 있어요.','Can you run?'],['swim','수영하다','🏊','I can swim.','나는 수영할 수 있어요.','Can you swim?'],['dance','춤추다','💃','I can dance.','나는 춤출 수 있어요.','Can you dance?'],['sing','노래하다','🎤','I can sing.','나는 노래할 수 있어요.','Can you sing?'],['jump','뛰어오르다','🤸','I can jump.','나는 높이 뛸 수 있어요.','Can you jump?'],['skate','스케이트 타다','⛸️','I can skate.','나는 스케이트를 탈 수 있어요.','Can you skate?'],['cook','요리하다','🍳','I can cook.','나는 요리할 수 있어요.','Can you cook?'],['draw','그림 그리다','🎨','I can draw.','나는 그림을 그릴 수 있어요.','Can you draw?']]),
  class: it2([['Stand up.','일어서요.','🧍'],['Sit down.','앉아요.','🪑'],['Open your book.','책을 펴요.','📖'],['Close your book.','책을 덮어요.','📕'],['Be quiet.','조용히 해요.','🤫'],['Raise your hand.','손을 들어요.','🙋'],['Listen.','잘 들어요.','👂'],['Look at me.','나를 봐요.','👀']]),
};
E2.family.forEach((x, i) => x.he = E2.family[i] && [['mom','She'],['dad','He'],['brother','He'],['sister','She'],['grandma','She'],['grandpa','He'],['baby','She']][i][1]);

/* ---------- 문제 만들기 (모두 3개 보기) ---------- */
const e2q = o => eq_(Object.assign({ type:'e2' }, o));
const others2 = (pool, x, n = 2, same = y => y.w) => shuffle(pool.filter(y => same(y) !== same(x))).slice(0, n);
// 듣고 그림 고르기
function q2Listen(pool){ const x = pick(pool), os = others2(pool, x), all = [x, ...os];
  return e2q({ key:`f:wl:${x.w}${os.map(o => o.w)}`, prompt:'잘 듣고 알맞은 그림을 골라요', say:'잘 듣고 알맞은 그림을 골라 봐요', listen:x.w, vis:{ k:'listen' }, opts:all.map(y => y.w), ans:x.w, pic:true, optHtml:Object.fromEntries(all.map(y => [y.w, PIC(y.e, false)])), hint:`${x.w}... 다시 들어 봐요`, explain:`${x.w} = ${x.k}` }); }
// 그림 보고 영어 고르기
function q2Pick(pool){ const x = pick(pool), os = others2(pool, x);
  return e2q({ key:`f:wp:${x.w}`, prompt:'그림에 맞는 영어를 골라요', say:'그림에 맞는 영어를 골라 봐요', listen:x.w, vis:{ k:'html', html:PIC(x.e, true) }, opts:[x.w, ...os.map(o => o.w)], ans:x.w, sayOpts:true, cols:1, hint:'스피커를 눌러 하나씩 들어 봐요', explain:`${x.w} = ${x.k}` }); }
// 듣고 뜻 고르기
function q2Mean(pool){ const x = pick(pool), os = others2(pool, x, 2, y => y.k);
  return e2q({ key:`f:wm:${x.w}${os.map(o => o.w)}`, prompt:'잘 듣고 무슨 뜻인지 골라요', say:'잘 듣고 무슨 뜻인지 골라 봐요', listen:x.w, vis:{ k:'html', html:`<div class="sent text-q" style="font-family:var(--f-body)">${esc(x.w)}</div>` }, opts:[x.k, ...os.map(o => o.k)], ans:x.k, cols:1, hint:`${x.w}... 그림을 떠올려 봐요`, explain:`${x.w} = ${x.k}` }); }
// 글자 눌러 낱말 만들기 (짧고 같은 글자가 없는 낱말만)
const buildable = w => /^[a-z]{3,5}$/.test(w) && new Set(w).size === w.length;
function q2Build(pool){ const can = pool.filter(y => buildable(y.w)); if (!can.length) return q2Pick(pool); const x = pick(can);
  const extra = shuffle('abcdefghiklmnoprstuw'.split('').filter(c => !x.w.includes(c))).slice(0, 2);
  return e2q({ key:`f:wb:${x.w}`, prompt:'잘 듣고 글자를 순서대로 눌러요', say:'잘 듣고 글자를 순서대로 눌러서 낱말을 만들어 봐요', listen:x.w, vis:{ k:'html', html:PIC(x.e, true) }, input:'build', opts:undefined, tiles:shuffle([...x.w.split(''), ...extra]), ans:x.w, hint:`천천히 소리 내어 봐요. ${x.w}`, explain:`${x.w} = ${x.k}` }); }
// 문장 듣고 그림 고르기
function q2SentPic(pool){ const x = pick(pool), os = others2(pool, x, 2, y => y.s), all = [x, ...os];
  return e2q({ key:`f:sp:${x.s}${os.map(o => o.w)}`, prompt:'문장을 잘 듣고 알맞은 그림을 골라요', say:'문장을 잘 듣고 알맞은 그림을 골라 봐요', listen:x.s, vis:{ k:'listen' }, opts:all.map(y => y.w), ans:x.w, pic:true, optHtml:Object.fromEntries(all.map(y => [y.w, PIC(y.e, false)])), hint:`"${x.s}" 다시 들어 봐요`, explain:`${x.s} = ${x.sk}` }); }
// 그림 보고 문장 고르기
function q2SentChoose(pool){ const x = pick(pool), os = others2(pool, x, 2, y => y.s);
  return e2q({ key:`f:sc:${x.s}`, prompt:'그림에 맞는 문장을 골라요', say:'그림에 맞는 문장을 골라 봐요', listen:x.s, vis:{ k:'html', html:PIC(x.e, true) }, opts:[x.s, ...os.map(o => o.s)], ans:x.s, sayOpts:true, cols:1, hint:'스피커를 눌러 하나씩 들어 봐요', explain:`${x.s} = ${x.sk}` }); }
// 문장 듣고 뜻 고르기
function q2SentMean(pool){ const x = pick(pool), os = others2(pool, x, 2, y => y.sk);
  return e2q({ key:`f:sm:${x.s}${os.map(o => o.w)}`, prompt:'문장을 잘 듣고 뜻을 골라요', say:'문장을 잘 듣고 무슨 뜻인지 골라 봐요', listen:x.s, vis:{ k:'html', html:`<div class="sent text-q" style="font-family:var(--f-body)">${esc(x.s)}</div>` }, opts:[x.sk, ...os.map(o => o.sk)], ans:x.sk, cols:1, hint:'낱말 하나하나 떠올려 봐요', explain:`${x.s} = ${x.sk}` }); }
// 바른 순서 문장 고르기
function q2Order(pool){ const x = pick(pool.filter(y => y.s && y.s.split(' ').length >= 3)) || pick(pool); const end = x.s.slice(-1), ws = x.s.slice(0, -1).split(' ');
  const w1 = [ws[ws.length - 1], ...ws.slice(0, -1)].join(' ') + end, w2 = [ws[1], ws[0], ...ws.slice(2)].join(' ') + end;
  const opts = [...new Set([x.s, w1, w2])]; if (opts.length < 3) return q2SentChoose(pool);
  return e2q({ key:`f:so:${x.s}`, prompt:'바른 순서로 된 문장을 골라요', say:'바른 순서로 된 문장을 골라 봐요', listen:x.s, vis:{ k:'html', html:PIC(x.e, true) }, opts, ans:x.s, sayOpts:true, cols:1, hint:'스피커를 눌러 들어 보면 자연스러운 문장이 있어요', explain:`${x.s} = ${x.sk}` }); }
// 상황 보고 알맞은 말 고르기
function q2Scene(){ const [k, a, e] = pick(E2.greetScene), os = shuffle(E2.greet.filter(y => y.w !== a)).slice(0, 2).map(y => y.w);
  return e2q({ key:`f:gs:${a}${os}`, prompt:k, say:k + ' 뭐라고 할까?', vis:{ k:'html', html:PIC(e, true) }, opts:[a, ...os], ans:a, sayOpts:true, cols:1, hint:'스피커를 눌러 하나씩 들어 봐요', explain:`${a} = ${E2.greet.find(y => y.w === a).k}` }); }
// 기분: How are you?
function q2How(){ const x = pick(E2.feel), os = others2(E2.feel, x).map(o => o.s);
  return e2q({ key:`f:hw:${x.w}${os}`, prompt:'"How are you?" 그림 속 친구의 대답은?', say:'How are you? 그림 속 친구는 뭐라고 대답할까?', listen:'How are you?', vis:{ k:'html', html:PIC(x.e, true) }, opts:[x.s, ...os], ans:x.s, sayOpts:true, cols:1, hint:'얼굴 표정을 잘 봐요', explain:`${x.s} = ${x.sk}` }); }
// 색깔: What color is it?
function q2Color(){ const x = pick(E2.colorObj), os = shuffle(E2.color.filter(y => y.w !== x.w)).slice(0, 2).map(y => `It's ${y.w}.`), right = `It's ${x.w}.`;
  return e2q({ key:`f:wc:${x.e}${os}`, prompt:'"What color is it?" 알맞은 대답은?', say:'What color is it? 무슨 색인지 골라 봐요', listen:'What color is it?', vis:{ k:'html', html:PIC(x.e, true) }, opts:[right, ...os], ans:right, sayOpts:true, cols:1, hint:'그림의 색을 영어로 떠올려 봐요', explain:`${right} = ${x.k}${hasBatchim(x.k) ? '은' : '는'} ${E2.color.find(y => y.w === x.w).k}이에요.` }); }
// 숫자 11~20 세기
function q2Count(){ const n = rnd(11, 20), [w, k, e] = pick([['stars','별','⭐'],['hearts','하트','💗'],['apples','사과','🍎'],['balls','공','⚽']]);
  const nums = shuffle([n - 1, n + 1, n + 2, n - 2].filter(x => x >= 11 && x <= 20)).slice(0, 2), name = x => E2.teen[x - 11].w;
  const rows = []; for (let i = 0; i < n; i += 5) rows.push(`<span class="grp">${`<span>${e}</span>`.repeat(Math.min(5, n - i))}</span>`);
  return e2q({ key:`f:ct:${n}${w}`, prompt:`"How many ${w}?" 세어 보고 골라요`, say:`How many ${w}? 세어 보고 골라 봐요`, listen:`How many ${w}?`, vis:{ k:'html', html:`<div class="count-grid" style="font-size:32px">${rows.join('')}</div>` }, opts:[n, ...nums].map(name), ans:name(n), sayOpts:true, cols:1, hint:'다섯 개씩 묶어서 세어 봐요', explain:`${name(n)} = ${n}` }); }
// 나이
function q2Age(){ const n = rnd(5, 10), w = NUMW[n], os = shuffle([n - 1, n + 1, n + 2].filter(x => x >= 4 && x <= 10)).slice(0, 2).map(x => `I'm ${NUMW[x]}.`), right = `I'm ${w}.`;
  return e2q({ key:`f:ag:${n}${os}`, prompt:'"How old are you?" 촛불 수만큼 대답해요', say:'How old are you? 촛불을 세어 보고 골라 봐요', listen:'How old are you?', vis:{ k:'html', html:`<span class="pic">🎂</span><div style="font-size:34px">${'🕯️'.repeat(n)}</div>` }, opts:[right, ...os], ans:right, sayOpts:true, cols:1, hint:'촛불을 하나씩 세어 봐요', explain:`${right} = 나는 ${n}살이에요.` }); }
// 가족: Who is he/she?
function q2Who(){ const x = pick(E2.family.filter(y => y.w !== 'baby')), q = x.he === 'He' ? 'Who is he?' : 'Who is she?';
  const right = `${x.he} is my ${x.w}.`, wrongP = `${x.he === 'He' ? 'She' : 'He'} is my ${x.w}.`, o = pick(E2.family.filter(y => y.he === x.he && y.w !== x.w && y.w !== 'baby')), wrongM = `${x.he} is my ${o.w}.`;
  return e2q({ key:`f:wh:${x.w}${o.w}`, prompt:`"${q}" 알맞은 대답은?`, say:`${q} 알맞은 대답을 골라 봐요`, listen:q, vis:{ k:'html', html:PIC(x.e, true) }, opts:[right, wrongP, wrongM], ans:right, sayOpts:true, cols:1, hint:'남자는 He, 여자는 She예요', explain:`${right} = ${x.he === 'He' ? '그는' : '그녀는'} 우리 ${x.k.replace(/ \(.*\)/, '')}${hasBatchim(x.k.replace(/ \(.*\)/, '')) ? '이에요' : '예요'}.` }); }
// Do you have ~? / Can you ~? 예 · 아니요
function q2YesNo(kind){
  const yes = Math.random() < .5;
  if (kind === 'have') { const x = pick([...E2.animal1, ...E2.animal2]), q = `Do you have a ${x.w}?`, right = yes ? 'Yes, I do.' : "No, I don't.";
    return e2q({ key:`f:yh:${x.w}${yes}`, prompt:`"${q}" ${yes ? '있어요!' : '없어요!'}`, say:`${q} 알맞은 대답을 골라 봐요`, listen:q, vis:{ k:'html', html:`<span class="pic">${x.e}${yes ? '👍' : '👎'}</span>` }, opts:['Yes, I do.', "No, I don't.", yes ? "No, I can't." : 'Yes, I can.'], ans:right, sayOpts:true, cols:1, hint:'Do로 물으면 do로 대답해요', explain:`${right} = ${yes ? '응, 있어.' : '아니, 없어.'}` }); }
  const x = pick(E2.act), right = yes ? 'Yes, I can.' : "No, I can't.";
  return e2q({ key:`f:yc:${x.w}${yes}`, prompt:`"${act2q(x)}" ${yes ? '할 수 있어요!' : '못 해요!'}`, say:`${act2q(x)} 알맞은 대답을 골라 봐요`, listen:act2q(x), vis:{ k:'html', html:`<span class="pic">${x.e}${yes ? '👍' : '👎'}</span>` }, opts:['Yes, I can.', "No, I can't.", yes ? "No, I don't." : 'Yes, I do.'], ans:right, sayOpts:true, cols:1, hint:'Can으로 물으면 can으로 대답해요', explain:`${right} = ${yes ? '응, 할 수 있어.' : '아니, 못 해.'}` }); }
const act2q = x => `Can you ${x.w}?`;
// 좋아해요 / 싫어해요
const pl = w => w === 'egg' ? 'eggs' : w;
function q2Like(){ const x = pick(E2.food), yes = Math.random() < .5, right = yes ? `I like ${pl(x.w)}.` : `I don't like ${pl(x.w)}.`, wrong = yes ? `I don't like ${pl(x.w)}.` : `I like ${pl(x.w)}.`, o = pick(E2.food.filter(y => y.w !== x.w));
  return e2q({ key:`f:lk:${x.w}${yes}${o.w}`, prompt:'그림에 맞는 문장을 골라요', say:'그림에 맞는 문장을 골라 봐요', listen:right, vis:{ k:'html', html:`<span class="pic">${x.e}${yes ? '😋' : '🙅‍♀️'}</span>` }, opts:[right, wrong, yes ? `I like ${pl(o.w)}.` : `I don't like ${pl(o.w)}.`], ans:right, sayOpts:true, cols:1, hint:"싫으면 don't를 넣어요", explain:`${right} = 나는 ${x.k}${hasBatchim(x.k) ? '을' : '를'} ${yes ? '좋아해요' : '안 좋아해요'}.` }); }
// I want ~.
const WANT = E2.food.map(x => Object.assign({}, x, { s:`I want ${x.w === 'egg' ? 'an egg' : x.w === 'cake' ? 'some cake' : x.w}.`, sk:`나는 ${x.k}${hasBatchim(x.k) ? '을' : '를'} 먹고(마시고) 싶어요.` }));
// 날씨 묻고 답하기
function q2Weather(){ const x = pick(E2.weather), os = others2(E2.weather, x).map(o => o.s);
  return e2q({ key:`f:ww:${x.w}${os}`, prompt:`"How's the weather?" 알맞은 대답은?`, say:"How's the weather? 알맞은 대답을 골라 봐요", listen:"How's the weather?", vis:{ k:'html', html:PIC(x.e, true) }, opts:[x.s, ...os], ans:x.s, sayOpts:true, cols:1, hint:'그림의 날씨를 영어로 떠올려 봐요', explain:`${x.s} = ${x.sk}` }); }
// 큰지 작은지
function q2Size(){ const x = pick(E2.size), right = x.s, wrong = right === "It's big." ? "It's small." : "It's big.";
  return e2q({ key:`f:sz:${x.w}`, prompt:'그림을 보고 알맞은 문장을 골라요', say:'커요? 작아요? 알맞은 문장을 골라 봐요', listen:right, vis:{ k:'html', html:PIC(x.e, true) }, opts:[right, wrong, `It's ${pick(['red','happy','sunny'])}.`], ans:right, sayOpts:true, cols:1, hint:'big은 커요, small은 작아요', explain:`${right} = ${x.k}${hasBatchim(x.k) ? '은' : '는'} ${right === "It's big." ? '커요' : '작아요'}.` }); }
const mix = (...fs) => () => pick(fs)();

/* ---------- 차시별 문제 ---------- */
Object.assign(LESSON_GEN, {
  'f1-1':mix(() => q2Mean(E2.greet), () => q2Pick(E2.greet), q2Scene, q2Scene),
  'f1-2':mix(() => q2Listen(E2.feel), () => q2Pick(E2.feel), () => q2Mean(E2.feel), () => q2SentChoose(E2.feel)),
  'f1-3':mix(q2How, q2How, () => q2SentMean(E2.feel), () => q2SentPic(E2.feel), q2Scene),
  'f2-1':mix(() => q2Listen(E2.color.slice(0, 5)), () => q2Pick(E2.color.slice(0, 5)), () => q2Build(E2.color.slice(0, 5)), () => q2Mean(E2.color.slice(0, 5))),
  'f2-2':mix(() => q2Listen(E2.color.slice(5)), () => q2Pick(E2.color.slice(5)), () => q2Build(E2.color), () => q2Listen(E2.color)),
  'f2-3':mix(q2Color, q2Color, () => q2Listen(E2.color), () => q2Mean(E2.color)),
  'f3-1':mix(() => q2Listen(E2.teen), () => q2Pick(E2.teen), () => q2Mean(E2.teen)),
  'f3-2':mix(q2Count, q2Count, () => q2Listen(E2.teen)),
  'f3-3':mix(q2Age, q2Age, q2Count),
  'f4-1':mix(() => q2Listen(E2.face), () => q2Pick(E2.face), () => q2Build(E2.face), () => q2Mean(E2.face)),
  'f4-2':mix(() => q2Listen(E2.body), () => q2Pick(E2.body), () => q2Build(E2.body), () => q2Listen([...E2.face, ...E2.body])),
  'f4-3':mix(() => q2SentPic([...E2.face, ...E2.body]), () => q2SentMean([...E2.face, ...E2.body]), () => q2SentChoose([...E2.face, ...E2.body])),
  'f5-1':mix(() => q2Listen(E2.family), () => q2Pick(E2.family), () => q2Mean(E2.family), () => q2Build(E2.family)),
  'f5-2':mix(() => q2SentPic(E2.family), () => q2SentChoose(E2.family), () => q2Order(E2.family), () => q2SentMean(E2.family)),
  'f5-3':mix(q2Who, q2Who, () => q2SentPic(E2.family)),
  'f6-1':mix(() => q2Listen(E2.animal1), () => q2Pick(E2.animal1), () => q2Mean(E2.animal1), () => q2Build(E2.animal1)),
  'f6-2':mix(() => q2Listen(E2.animal2), () => q2Pick(E2.animal2), () => q2Build(E2.animal2), () => q2Listen([...E2.animal1, ...E2.animal2])),
  'f6-3':mix(q2Size, q2Size, () => q2YesNo('have'), () => q2YesNo('have')),
  'f7-1':mix(() => q2Listen(E2.food), () => q2Pick(E2.food), () => q2Build(E2.food), () => q2Mean(E2.food)),
  'f7-2':mix(() => q2SentPic(WANT), () => q2SentChoose(WANT), () => q2Order(WANT)),
  'f7-3':mix(q2Like, q2Like, () => q2SentPic(WANT)),
  'f8-1':mix(() => q2Listen(E2.weather), () => q2Pick(E2.weather), () => q2Mean(E2.weather), () => q2Build(E2.weather)),
  'f8-2':mix(q2Weather, q2Weather, () => q2SentPic(E2.weather), () => q2SentMean(E2.weather)),
  'f8-3':mix(() => q2Listen(E2.clothes), () => q2Pick(E2.clothes), () => q2SentPic(E2.clothes), () => q2Order(E2.clothes)),
  'f9-1':mix(() => q2Listen(E2.act), () => q2Pick(E2.act), () => q2Mean(E2.act), () => q2Build(E2.act)),
  'f9-2':mix(() => q2YesNo('can'), () => q2YesNo('can'), () => q2SentPic(E2.act), () => q2SentChoose(E2.act)),
  'f9-3':mix(() => q2Listen(E2.class), () => q2Mean(E2.class), () => q2Pick(E2.class)),
});

/* ---------- 개념 카드 ---------- */
const row2 = xs => `<div class="row" style="justify-content:center;gap:14px;flex-wrap:wrap">${xs.map(x => `<span class="word-chip"><span style="font-size:40px">${PIC(x.e, false)}</span><b>${esc(x.w)}</b></span>`).join('')}</div>`;
const sent2 = (lines) => `<div class="sent text-q" style="font-family:var(--f-body)">${lines.join('<br>')}</div>`;
const card2 = (xs, text, ko0, enText) => ({ ill:() => row2(xs), text, say:[ko(ko0), en(enText || xs.map(x => x.w).join(', '))] });
const ENG_CURR2 = {
  title:'영어 두걸음 (생활 영어)', subj:'eng', short:'영어', grade:'2단계 · 생활 영어', short2:'2단계',
  units:[
    { n:1, name:'인사와 기분', lessons:[
      { id:'f1-1', title:'Hello! Thank you!', cards:[card2(E2.greet.slice(0, 4), '만날 때는 Hello!, 헤어질 때는 Goodbye!, 고마울 때는 Thank you!, 미안할 때는 I\'m sorry. 라고 해요.', '상황에 맞게 인사해요.', 'Hello! Goodbye! Thank you! I\'m sorry.')] },
      { id:'f1-2', title:'기분을 말해요 (happy, sad)', cards:[card2(E2.feel.slice(0, 5), '"I\'m happy."는 "나는 기뻐요."라는 뜻이에요. happy 자리에 기분 낱말을 넣어요.', '내 기분을 말해요.', "I'm happy. I'm sad. I'm hungry.")] },
      { id:'f1-3', title:'How are you?', cards:[{ ill:() => sent2(['How are you? 🙂', "I'm happy. 😊"]), text:'"How are you?"는 "기분 어때?"라는 뜻이에요. 내 기분으로 대답해요.', say:[ko('기분이 어떠냐고 물어요.'), en("How are you? I'm happy. I'm fine, thank you.")] }] },
    ] },
    { n:2, name:'색깔', lessons:[
      { id:'f2-1', title:'red · orange · yellow · green · blue', cards:[card2(E2.color.slice(0, 5), '무지개 색을 영어로 말해 봐요. red(빨강), orange(주황), yellow(노랑), green(초록), blue(파랑).', '색깔을 따라 말해요.')] },
      { id:'f2-2', title:'pink · purple · black · white · brown', cards:[card2(E2.color.slice(5), 'pink(분홍), purple(보라), black(검정), white(하양), brown(갈색).', '색깔을 따라 말해요.')] },
      { id:'f2-3', title:'What color is it?', cards:[{ ill:() => sent2(['🍎 What color is it?', "It's red."]), text:'"What color is it?"은 "무슨 색이야?"라는 뜻이에요. "It\'s red."처럼 색깔로 대답해요.', say:[ko('무슨 색이냐고 물어요.'), en("What color is it? It's red.")] }] },
    ] },
    { n:3, name:'숫자 11~20', lessons:[
      { id:'f3-1', title:'eleven부터 twenty까지', cards:[card2(E2.teen.slice(0, 5), '11부터 20까지 영어로 세어 봐요. 13부터 19까지는 끝이 -teen 으로 끝나요.', '따라 세어 봐요.', E2.teen.map(x => x.w).join(', '))] },
      { id:'f3-2', title:'How many? 세어 봐요', cards:[{ ill:() => sent2(['How many stars?', '⭐⭐⭐⭐⭐ ⭐⭐⭐⭐⭐ ⭐⭐', 'Twelve stars.']), text:'"How many ○○?"는 "○○ 몇 개야?"예요. 다섯 개씩 묶어 세면 쉬워요.', say:[ko('몇 개인지 세어요.'), en('How many stars? Twelve stars.')] }] },
      { id:'f3-3', title:'How old are you?', cards:[{ ill:() => sent2(['🎂 How old are you?', "I'm eight."]), text:'"How old are you?"는 "몇 살이야?"예요. 재윤이는 "I\'m eight."이라고 대답해요.', say:[ko('몇 살이냐고 물어요.'), en("How old are you? I'm eight.")] }] },
    ] },
    { n:4, name:'내 몸', lessons:[
      { id:'f4-1', title:'eye · ear · nose · mouth', cards:[card2(E2.face.slice(0, 4), '얼굴을 영어로 말해요. 하나씩 손으로 짚으며 따라 해요.', '얼굴을 짚으며 따라 해요.')] },
      { id:'f4-2', title:'hand · foot · leg · arm', cards:[card2(E2.body.slice(0, 4), '몸을 영어로 말해요. hand(손), foot(발), leg(다리), arm(팔).', '몸을 짚으며 따라 해요.')] },
      { id:'f4-3', title:'Touch your nose!', cards:[{ ill:() => sent2(['Touch your nose. 👃', 'Clap your hands. 👏']), text:'듣고 그대로 몸으로 따라 해 봐요! "Touch your nose."는 "코를 만져요."예요.', say:[ko('듣고 따라 해 봐요.'), en('Touch your nose. Clap your hands.')] }] },
    ] },
    { n:5, name:'우리 가족', lessons:[
      { id:'f5-1', title:'mom · dad · sister · brother', cards:[card2(E2.family.slice(0, 6), '가족을 영어로 말해요. mom(엄마), dad(아빠), sister(언니), brother(오빠), grandma(할머니), grandpa(할아버지).', '가족을 따라 말해요.')] },
      { id:'f5-2', title:'This is my mom.', cards:[{ ill:() => sent2(['👩 This is my mom.']), text:'"This is my ○○."는 "이분은 우리 ○○예요."라는 뜻이에요. 가족을 소개할 때 써요.', say:[ko('가족을 소개해요.'), en('This is my mom. This is my brother.')] }] },
      { id:'f5-3', title:'Who is she?', cards:[{ ill:() => sent2(['👵 Who is she?', 'She is my grandma.']), text:'"누구야?"는 남자면 "Who is he?", 여자면 "Who is she?"예요.', say:[ko('누구냐고 물어요.'), en('Who is she? She is my grandma. Who is he? He is my dad.')] }] },
    ] },
    { n:6, name:'동물 친구들', lessons:[
      { id:'f6-1', title:'rabbit · bear · tiger', cards:[card2(E2.animal1.slice(0, 5), '동물원 친구들을 영어로 말해요.', '동물 이름을 따라 말해요.')] },
      { id:'f6-2', title:'duck · cow · sheep', cards:[card2(E2.animal2.slice(0, 5), '농장 친구들을 영어로 말해요.', '동물 이름을 따라 말해요.')] },
      { id:'f6-3', title:"It's big! Do you have a cat?", cards:[{ ill:() => sent2(["🐘 It's big.", "🐭 It's small.", 'Do you have a cat? Yes, I do.']), text:'big은 "커요", small은 "작아요". "Do you have ○○?"는 "○○ 있어?"예요.', say:[ko('크다, 작다를 말해요.'), en("It's big. It's small. Do you have a cat? Yes, I do.")] }] },
    ] },
    { n:7, name:'맛있는 음식', lessons:[
      { id:'f7-1', title:'pizza · milk · bread', cards:[card2(E2.food.slice(0, 5), '음식을 영어로 말해요.', '음식 이름을 따라 말해요.')] },
      { id:'f7-2', title:'I want milk.', cards:[{ ill:() => sent2(['🥛 I want milk.']), text:'"I want ○○."는 "나는 ○○를 원해요(먹고 싶어요)."라는 뜻이에요.', say:[ko('먹고 싶은 것을 말해요.'), en('I want milk. I want pizza.')] }] },
      { id:'f7-3', title:"I like ~ / I don't like ~", cards:[{ ill:() => sent2(["🍕😋 I like pizza.", "🥚🙅‍♀️ I don't like eggs."]), text:'좋아하면 "I like ○○.", 안 좋아하면 "I don\'t like ○○." 라고 해요.', say:[ko('좋아하는 것과 싫어하는 것을 말해요.'), en("I like pizza. I don't like eggs.")] }] },
    ] },
    { n:8, name:'날씨와 옷', lessons:[
      { id:'f8-1', title:'sunny · rainy · snowy', cards:[card2(E2.weather.slice(0, 5), '날씨를 영어로 말해요. 창밖을 보고 오늘 날씨도 말해 봐요!', '날씨를 따라 말해요.')] },
      { id:'f8-2', title:"How's the weather?", cards:[{ ill:() => sent2(["How's the weather?", "☀️ It's sunny."]), text:'"How\'s the weather?"는 "날씨 어때?"예요. "It\'s sunny."처럼 대답해요.', say:[ko('날씨를 묻고 답해요.'), en("How's the weather? It's sunny. It's rainy.")] }] },
      { id:'f8-3', title:'Put on your coat.', cards:[card2(E2.clothes.slice(0, 5), '"Put on your ○○."는 "○○를 입어요(신어요)."예요. 추운 날엔 coat와 gloves!', '옷 이름을 따라 말해요.', 'coat, shoes, socks, gloves, scarf. Put on your coat.')] },
    ] },
    { n:9, name:'할 수 있어요 · 교실 영어', lessons:[
      { id:'f9-1', title:'run · swim · dance', cards:[card2(E2.act.slice(0, 5), '움직이는 말을 영어로 해 봐요. 하나씩 몸으로 흉내 내요!', '흉내 내며 따라 해요.')] },
      { id:'f9-2', title:'Can you swim?', cards:[{ ill:() => sent2(['🏊 Can you swim?', 'Yes, I can. 👍 / No, I can\'t. 👎']), text:'"Can you ○○?"는 "○○할 수 있어?"예요. 할 수 있으면 "Yes, I can.", 못 하면 "No, I can\'t."', say:[ko('할 수 있는지 물어요.'), en("Can you swim? Yes, I can. No, I can't.")] }] },
      { id:'f9-3', title:'Stand up! Sit down!', cards:[card2(E2.class.slice(0, 4), '3학년 영어 시간에 선생님이 자주 하는 말이에요. 듣고 몸으로 따라 해요.', '선생님 말을 듣고 따라 해요.', 'Stand up. Sit down. Open your book. Close your book.')] },
    ] },
  ],
};
ENG_CURR.grade = '1단계 · 파닉스'; ENG_CURR.short2 = '1단계';
