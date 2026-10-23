/* ===================== 과목 공통 진도 엔진 (수학 · 국어 · 영어) ===================== */
/* 과목마다 코스를 차례로 이어서 진행: 수학·국어는 초1 2학기 → 초2 1학기, 영어는 하나 */
const SUBJ_NAME = { math:'수학', kor:'국어', eng:'영어' };
/* ---------- EBS 강의 목록: 초2 1학기 (오빠가 보내 준 강의목록 캡처 그대로) ---------- */
/* [단원, 교재, 쪽, 분, 설명] */
const EBS_LECT_21 = {
  math:[
    [1,1,'6~11',29,'백 · 몇백'],[1,1,'12~15',29,'세 자리 수 · 자리의 숫자'],[1,1,'16~19',29,'뛰어 세기'],[1,1,'20~23',28,'수의 크기 비교'],[1,1,'24~27',28,'단원평가'],[1,2,'4~5',29,'1단원 핵심 + 문제 복습'],[1,2,'6~7',28,'학교 시험 만점왕 1회'],[1,2,'8~9',28,'학교 시험 만점왕 2회'],
    [2,1,'28~33',29,'△ · □ 알아보고 찾기'],[2,1,'34~37',29,'○ · 칠교판으로 모양 만들기'],[2,1,'38~41',28,'쌓은 모양 · 여러 가지 모양 쌓기'],[2,1,'42~45',28,'단원평가'],[2,2,'10~11',28,'2단원 핵심 + 문제 복습'],[2,2,'12~13',28,'학교 시험 만점왕 1회'],[2,2,'14~15',28,'학교 시험 만점왕 2회'],
    [3,1,'46~51',29,'일의 자리에서 받아올림이 있는 덧셈'],[3,1,'52~55',29,'십의 자리에서 받아올림이 있는 덧셈'],[3,1,'56~59',29,'뺄셈을 하는 여러 가지 방법'],[3,1,'60~63',29,'뺄셈을 해 볼까요'],[3,1,'64~67',29,'세 수의 계산'],[3,1,'68~71',29,'덧셈과 뺄셈의 관계'],[3,1,'72~75',28,'□가 사용된 덧셈식 · 뺄셈식'],[3,1,'46~75',29,'도전! 실생활 활용 문제'],[3,1,'76~79',28,'단원평가'],[3,2,'16~17',29,'3단원 핵심 + 문제 복습'],[3,2,'18~19',29,'학교 시험 만점왕 1회'],[3,2,'20~21',29,'학교 시험 만점왕 2회'],
    [4,1,'80~85',29,'길이 비교 · 여러 가지 단위'],[4,1,'86~89',29,'1 cm · 자로 재는 방법'],[4,1,'90~93',29,'자로 길이 재기 · 어림하기'],[4,1,'94~97',29,'단원평가'],[4,2,'22~23',29,'4단원 핵심 + 문제 복습'],[4,2,'24~25',29,'학교 시험 만점왕 1회'],[4,2,'26~27',29,'학교 시험 만점왕 2회'],
    [5,1,'98~103',28,'분류 · 기준에 따라 분류'],[5,1,'104~107',29,'분류하여 세기 · 결과 말하기'],[5,1,'108~111',28,'단원평가'],[5,2,'28~29',29,'5단원 핵심 + 문제 복습'],[5,2,'30~31',29,'학교 시험 만점왕 1회'],[5,2,'32~33',29,'학교 시험 만점왕 2회'],
    [6,1,'112~117',28,'여러 가지 방법으로 세기 · 묶어 세기'],[6,1,'118~121',29,'몇의 몇 배'],[6,1,'122~125',29,'곱셈 알아보기'],[6,1,'126~129',29,'곱셈식으로 나타내기'],[6,1,'130~133',29,'단원평가'],[6,2,'34~35',29,'6단원 핵심 + 문제 복습'],[6,2,'36~37',29,'학교 시험 만점왕 1회'],[6,2,'38~39',29,'학교 시험 만점왕 2회'],
  ],
  kor:[
    [1,1,'5~7',28,'발표하는 방법 · 듣는 자세'],[1,1,'8~9',28,'말차례 · 소개할 내용 정리'],[1,1,'10~12',28,'자신을 소개하는 글 쓰기'],[1,1,'13~16',29,'단원 확인 평가'],[1,1,'16~19',29,'단원 확인 평가'],[1,2,'4~7',28,'핵심 + 복습 학교 시험 만점왕'],[1,2,'4~7',29,'학교 시험 만점왕'],
    [2,1,'21~24',28,'「가랑비와 이슬비」 재미있는 말놀이'],[2,1,'25~28',28,'「어디까지 왔니」 말놀이'],[2,1,'29~32',28,'낱말로 이야기 만들기 「시원한 책」'],[2,1,'33~38',29,'국어 활동 · 단원 확인 평가'],[2,1,'39~41',29,'단원 확인 평가'],[2,2,'8~12',29,'핵심 + 복습 학교 시험 만점왕'],[2,2,'8~12',29,'학교 시험 만점왕'],
    [3,1,'43~45',29,'꾸며 주는 말 넣어 문장 쓰기'],[3,1,'46~48',28,'「식물은 어떻게 자랄까?」 꾸며 주는 말'],[3,1,'49~51',29,'일기 글감 정하기 · 일기 쓰기'],[3,1,'52~55',29,'겪은 일이 잘 드러나게 일기 쓰기'],[3,1,'59',29,'단원 확인 평가'],[3,2,'13~17',28,'핵심 + 복습 학교 시험 만점왕'],[3,2,'13~17',29,'학교 시험 만점왕'],
    [4,1,'65~68',29,'「누가 누가 잠자나」 겹받침 낱말'],[4,1,'69~71',29,'겹받침 낱말 읽고 쓰기'],[4,1,'72~75',29,'「바람은 착하지」「오늘」 시 읽기'],[4,1,'76~82',29,'국어 활동 · 단원 확인 평가'],[4,1,'83~85',28,'단원 확인 평가'],[4,2,'18~21',29,'핵심 + 복습 학교 시험 만점왕'],[4,2,'18~21',29,'학교 시험 만점왕'],
    [5,1,'87~89',28,'「자전거 타기, 성공!」 인물의 마음'],[5,1,'90~92',28,'「강아지 돌보기」 인물의 마음'],[5,1,'93~96',29,'헷갈리기 쉬운 낱말 · 띄어 읽기'],[5,1,'97~104',29,'국어 활동 · 단원 확인 평가'],[5,1,'105~107',29,'단원 확인 평가'],[5,2,'22~26',29,'핵심 + 복습 학교 시험 만점왕'],[5,2,'22~26',29,'학교 시험 만점왕'],
    [6,1,'109~111',29,'중요한 내용 찾기'],[6,1,'112~114',28,'중요한 내용 · 인물의 생각'],[6,1,'115~117',28,'자신의 생각 표현하기'],[6,1,'118~124',29,'국어 활동 · 단원 확인 평가'],[6,1,'125~127',28,'단원 확인 평가'],[6,2,'27~30',29,'핵심 + 복습 학교 시험 만점왕'],[6,2,'27~30',28,'학교 시험 만점왕'],
    [7,1,'129~132',29,'「지우와 머리핀」 고운 말'],[7,1,'133~135',29,'경험 발표 · 고운 말로 대화하기'],[7,1,'136~139',29,'「메기야, 고마워」 생각과 느낌 나누기'],[7,1,'140~146',29,'국어 활동 · 단원 확인 평가'],[7,1,'147~149',29,'단원 확인 평가'],[7,2,'31~35',28,'핵심 + 복습 학교 시험 만점왕'],[7,2,'31~35',29,'학교 시험 만점왕'],
    [8,1,'151~153',28,'「우산 사용법」 시 · 이야기 · 인형극'],[8,1,'154~155',28,'「신호」「해와 달이 된 오누이」'],[8,1,'156~159',28,'「사자와 생쥐」 인형극 · 작품 감상'],[8,1,'160~164',28,'단원 확인 평가'],[8,1,'164~166',29,'단원 확인 평가'],[8,2,'36~39',28,'핵심 + 복습 학교 시험 만점왕'],[8,2,'36~39',28,'학교 시험 만점왕'],
  ],
};
CURRICULUM.lect = EBS_LECT_21.math; KOR_CURR.lect = EBS_LECT_21.kor;
CURRICULUM.grade = '2학년 1학기'; CURRICULUM.short2 = '2-1'; KOR_CURR.grade = '2학년 1학기'; KOR_CURR.short2 = '2-1';
const COURSES = { math:[MATH12, CURRICULUM], kor:[KOR12, KOR_CURR], eng:[ENG_CURR, ENG_CURR2] };
const CURRS = {}, EBS_LECT = {};
Object.entries(COURSES).forEach(([s, list]) => {
  const units = [], lect = []; let off = 0;
  list.forEach((co, ci) => {
    co.subj = s; co.ci = ci; co.lectOff = off;
    (co.lect || []).forEach(x => lect.push({ co, u:x[0], book:x[1], pages:x[2], mins:x[3], desc:x[4] }));
    co.units.forEach(u => { u.course = co; if (u.rev) u.rev += off; u.lessons.forEach(l => { if (l.ebs) l.ebs = l.ebs.map(n => n + off); }); units.push(u); });
    off += (co.lect || []).length;
  });
  const C = { subj:s, courses:list, units, short:list[0].short };
  // 지금 하고 있는 코스의 이름 · EBS 강좌 (다 끝났으면 마지막 코스)
  Object.defineProperty(C, 'now', { get(){ const u = units[curr(s).unit]; return u ? u.course : list[list.length - 1]; } });
  Object.defineProperty(C, 'ebs', { get(){ return C.now.ebs || null; } });
  Object.defineProperty(C, 'title', { get(){ return C.now.title; } });
  C.all = units.flatMap((u, ui) => u.lessons.map((l, li) => Object.assign(l, { ui, li, unit:u, subj:s })));
  CURRS[s] = C; EBS_LECT[s] = lect;
});
const ALL_L = Object.values(CURRS).flatMap(C => C.all);
const ALL_LESSONS = CURRS.math.all;
/* 코스 이름표: "1-2 3단원" */
function unitTag(u){ return u.course && u.course.short2 && CURRS[u.course.subj].courses.length > 1 ? `${u.course.short2} ${u.n}단원` : `${u.n}단원`; }
/* ---------- EBS 강의 바로가기 ----------
   EBS 강의 재생 주소: primary.ebs.co.kr/pleasure/course/player/main/index?cid=강좌&sid=STEP…&lid=LS…
   - EBS_BUILTIN: 오빠가 보내 준 주소로 확인한 강좌는 앱에 넣어 둠 (lid가 강 번호마다 1씩 늘어남)
       수학 1-2, 국어 1-2 (2026-10-24 오빠가 보낸 첫 강·마지막 강 주소로 확인). encType은 강좌마다 달라서 같이 저장
   - S.ebsLinks[cid] = { sid, 1:'LS…', 2:'LS…' }: 오빠가 앱에 붙여 넣은 것 (넣어 둔 게 우선)
   - 붙여 넣은 강의가 3개 이상 일정한 간격이거나, 2개가 정확히 1 차이면 나머지 번호를 짐작(sure:false).
     잘못 열려도 "몇 강 봤어?"에서 걸러진다 */
const EBS_BUILTIN = {
  '100005137': { sid:'STEP1000010212', first:'LS00000000152376470', n:65, enc:'M05' },   // 만점왕 수학 플러스 1-2 (01강 …470 ~ 65강 …534)
  '100006226': { sid:'STEP1000011301', first:'LS00000000152384353', n:48, enc:'M10' },   // 만점왕 국어 1-2 (01강 …353 ~ 48강 …400)
};
const EBS_PLAYER = 'https://primary.ebs.co.kr/pleasure/course/player/main/index';
function ebsCourseUrl(s, n){ const li = n ? lectInfo(s, n) : null, co = li ? li.course : CURRS[s].now, lk = n ? ebsLinkOf(s, n) : null, cid = co.ebs.id;
  // 2026-10-24: 재생 주소(player)는 EBS에 로그인한 기기에서만 열리고, 로그인 안 돼 있으면 EBS 첫 화면으로 가 버림 → 기본은 강좌 화면 + 강의 번호.
  // 오빠가 "로그인된 태블릿에서 재생 주소가 바로 열림"을 확인하면 S.ebsPlayer = true로 재생 주소를 씀
  if (lk && lk.sid && S.ebsPlayer) return `${EBS_PLAYER}?cid=${cid}&sid=${lk.sid}&lid=${lk.id}&eno=1&encType=${lk.enc || 'M05'}&captionYn=N&indexPosition=`;
  return `https://primary.ebs.co.kr/course/view?courseId=${cid}${lk ? `&lectId=${lk.id}` : ''}`; }
/* 주소에서 강좌·강의 번호 읽기: 재생 주소(cid·sid·lid)와 강좌 주소(courseId·lectId) 둘 다 */
function parseEbsUrl(str){
  let u; try { u = new URL(String(str || '').trim()); } catch (e) { return null; }
  const q = u.searchParams, course = q.get('cid') || q.get('courseId'), lect = q.get('lid') || q.get('lectId'), sid = q.get('sid') || '';
  if (!course || !/^\d+$/.test(course) || !lect || !/^LS\d+$/.test(lect)) return null;
  const enc = q.get('encType') || '';
  return { course, lect, sid:/^STEP\w+$/.test(sid) ? sid : '', enc:/^M\d+$/.test(enc) ? enc : '' };
}
function ebsGuess(map, local){
  const pts = Object.entries(map || {}).map(([k, v]) => [+k, v]).filter(([k, v]) => k > 0 && /^LS\d+$/.test(v)).sort((a, b) => a[0] - b[0]);
  if (pts.length < 2) return null;
  const num = v => Number(v.slice(2)), W = pts[0][1].length;
  const [n0, v0] = pts[0], [n1, v1] = pts[1], step = (num(v1) - num(v0)) / (n1 - n0);
  if (!(step > 0) || step !== Math.round(step) || !Number.isSafeInteger(num(v0))) return null;
  if (pts.length === 2 && step !== 1) return null;
  if (!pts.every(([n, v]) => num(v) === num(v0) + (n - n0) * step && v.length === W)) return null;
  return 'LS' + String(num(v0) + (local - n0) * step).padStart(W - 2, '0');
}
function ebsLinkOf(s, n){
  const li = lectInfo(s, n); if (!li || !li.course.ebs) return null;
  const cid = String(li.course.ebs.id), map = (S.ebsLinks || {})[cid] || {}, bi = EBS_BUILTIN[cid];
  const sid = map.sid || (bi && bi.sid) || '', enc = map.enc || (bi && bi.enc) || '';
  if (map[li.local]) return { id:map[li.local], sure:true, sid, enc };
  if (bi && li.local >= 1 && li.local <= bi.n) { const W = bi.first.length, id = 'LS' + String(Number(bi.first.slice(2)) + li.local - 1).padStart(W - 2, '0'); return { id, sure:true, sid, enc, builtin:true }; }
  const g = ebsGuess(map, li.local); return g ? { id:g, sure:false, sid, enc } : null;
}
function lectInfo(s, n){
  const L = EBS_LECT[s], x = L[n - 1]; if (!x) return null;
  const co = x.co, local = n - co.lectOff, part = L.slice(co.lectOff, n).filter(y => y.u === x.u).length, u = co.units[x.u - 1];
  return { n, local, no:String(local).padStart(2, '0'), title: co.lectTitle === 'name' ? `${x.u}. ${u.name}` : `${x.u}. ${u.name}(${part})`, book:x.book, pages:x.pages, mins:x.mins, desc:x.desc, course:co, name:co.ebs.name };
}

/* ---------- 진도 상태 ---------- */
/* v:2 = 코스가 이어진 진도 (초1 2학기부터). 그 전 진도(2학년 1학기로 시작한 시험 기록)는 처음부터 다시 */
function blankCurr(){ return { v:2, unit:0, lesson:0, test:false, done:{}, tests:[], medals:[], seen:{} }; }
function curr(s = 'math'){
  let c;
  if (s === 'math') { if (!S.curr || (S.curr.v !== 2)) S.curr = blankCurr(); c = S.curr; }
  else { if (!S.currs) S.currs = {}; if (!S.currs[s] || (s !== 'eng' && S.currs[s].v !== 2)) S.currs[s] = blankCurr(); c = S.currs[s]; }
  if (!c.seen) c.seen = {}; if (!c.done) c.done = {}; if (!c.tests) c.tests = []; if (!c.medals) c.medals = [];
  return c;
}
function currOn(s){ return (s === 'math' ? S.mathMode : (S.modes || {})[s]) !== 'free'; }
function mathCurrOn(){ return currOn('math'); }
function lessonById(id){ return ALL_L.find(l => l.id === id); }
function currentLesson(s = 'math'){ const c = curr(s), u = CURRS[s].units[c.unit]; return u ? u.lessons[c.lesson] : null; }
function currLabel(s = 'math'){ const c = curr(s), u = CURRS[s].units[c.unit]; if (!u) return `${josa(CURRS[s].title.replace(/ \(.*\)$/, ''), '을', '를')} 모두 끝냈어요!`; return c.test ? `${unitTag(u)} ${u.name} · 단원 평가` : `${unitTag(u)} ${u.name} · ${c.lesson + 1}차시`; }
function lessonQ(l){ const q = LESSON_GEN[l.id](); q.subj = l.subj; q.lesson = l.id; if (!q.say) q.say = q.prompt; return q; }
/* 기초 복습: 지금 코스보다 한 학기 앞 내용 (초1 2학기 코스면 초1 1학기, 초2 1학기 코스면 초1 2학기) */
function baseGen(s, n){
  const first = CURRS[s].now.ci === 0 && CURRS[s].courses.length > 1;
  if (s === 'math') return first ? genMathLv(0, n) : genMathBase(n);
  if (s === 'kor') return first ? genKorBase(n) : genKor(n);
  return genEngBase(n);
}
function genMathLv(l, n){
  const bag = []; Object.entries(MATH_PLAN[l]).forEach(([k, w]) => { for (let i = 0; i < Math.round(w * 4); i++) bag.push(k); });
  const out = [], used = new Set(); let last = '';
  for (let i = 0; out.length < n && i < n * 15; i++) { const t = pick(bag); if (t === last) continue; const q = ML[t](); q.subj = 'math'; if (!q.say) q.say = q.prompt; if (used.has(q.key)) continue; used.add(q.key); out.push(q); last = t; }
  return out;
}

/* 오늘 판: 차시 연습 70% + 앞 차시 조금 + 기초 복습 30% / 단원 평가 날은 평가 12문제 */
function genCurriculum(s, n){
  const C = CURRS[s], c = curr(s), u = C.units[c.unit];
  if (!u) return baseGen(s, n);
  const used = new Set(), out = [];
  const add = q => { if (q && !used.has(q.key)) { used.add(q.key); out.push(q); return true; } return false; };
  if (c.test) {
    let g = 0; while (out.length < 12 && g++ < 400) { const l = u.lessons[out.length % u.lessons.length]; const q = lessonQ(l); q.unitTest = true; add(q); }
    return out;
  }
  const l = u.lessons[c.lesson], main = Math.round(n * .7);
  let g = 0; while (out.length < main && g++ < 400) add(lessonQ(l));
  const prev = C.all.filter(x => x.ui < c.unit || (x.ui === c.unit && x.li < c.lesson));
  const sameUnit = prev.filter(x => x.ui === c.unit);
  if (prev.length) { g = 0; while (out.length < main + 2 && g++ < 80) add(lessonQ(pick(sameUnit.length && Math.random() < .7 ? sameUnit : prev))); }
  // 기초 복습: 수학은 초1 2학기, 국어는 엄마가 고른 단계의 낱말·맞춤법, 영어는 그림 단어
  const fill = n - out.length;
  if (fill > 0) { const rv = baseGen(s, fill + 4).map(q => Object.assign(q, { review11:true })); for (const q of rv) { if (out.length >= n) break; add(q); } }
  g = 0; while (out.length < n && g++ < 200) add(lessonQ(l));
  return out.slice(0, 2).concat(shuffle(out.slice(2)));
}
/* 강의를 내일로 미룬 날: 지난 차시 + 기초로 복습만 (진도는 그대로) */
function genCurrReview(s, n){
  const C = CURRS[s], c = curr(s);
  const prev = C.all.filter(x => (x.ui < c.unit || (x.ui === c.unit && x.li < c.lesson)) && LESSON_GEN[x.id]);
  const out = [], used = new Set(); const add = q => { if (q && !used.has(q.key)) { used.add(q.key); out.push(q); } };
  if (prev.length) { let g = 0; while (out.length < Math.round(n * .6) && g++ < 300) add(lessonQ(pick(prev))); }
  baseGen(s, n - out.length + 4).forEach(q => { if (out.length < n) add(Object.assign(q, { review11:true })); });
  return shuffle(out);
}
/* 판이 끝났을 때 진도 판정 */
function judgeCurriculum(b){
  const s = b.cur.subj || 'math', C = CURRS[s], c = curr(s), u = C.units[c.unit]; if (!u || !b.cur) return null;
  // 판을 만든 뒤에 엄마가 진도를 옮겼으면 판정하지 않는다
  if (b.cur.unit !== c.unit || (!b.cur.test && b.cur.lesson !== (u.lessons[c.lesson] || {}).id) || !!b.cur.test !== !!c.test) return null;
  const qs = b.cur.items; const right = qs.filter(x => x.first).length, total = qs.length || 1, rate = right / total;
  const t = todayKey(), nm = SUBJ_NAME[s];
  if (b.cur.test) {
    const pass = rate >= .8; c.tests.push({ unit:c.unit, rate:Math.round(rate * 100), date:t, pass });
    if (pass) { c.medals.push({ unit:c.unit, date:t }); c.unit++; c.lesson = 0; c.test = false; notify('oppa', `🏅 재윤이가 ${nm} ${unitTag(u)} 평가를 통과했어요 (${Math.round(rate * 100)}점)`); notify('mom', `🏅 재윤이가 ${nm} ${unitTag(u)} "${u.name}" 평가를 통과했어요`);
      const nu = C.units[c.unit];
      if (nu && nu.course !== u.course) { const msg = `🎉 재윤이가 ${josa(u.course.title, '을', '를')} 모두 끝냈어요! 내일부터 ${nu.course.title} 시작${nu.course.ebs ? ` (EBS ${nu.course.ebs.name})` : ''}`; notify('mom', msg); notify('oppa', msg); }
      if (!C.units[c.unit]) { notify('mom', `🎉 재윤이가 ${josa(C.title, '을', '를')} 모두 끝냈어요! 이제 ${nm}는 엄마 메뉴의 난이도대로 복습해요`); notify('oppa', `🎉 재윤이가 ${josa(C.title, '을', '를')} 모두 끝냈어요!`); } }
    return { subj:s, test:true, pass, rate:Math.round(rate * 100) / 100, unitIdx:C.units.indexOf(u) };
  }
  const l = u.lessons[c.lesson];
  const pass = rate >= .7, prev = c.done[l.id] || {};
  const passN = (prev.passN || 0) + (pass ? 1 : 0), need = S.pace === 'slow' ? 2 : 1;
  c.done[l.id] = { date:t, rate:Math.round(rate * 100), tries:(prev.tries || 0) + 1, pass, passN };
  if (pass && passN >= need) { if (c.lesson + 1 < u.lessons.length) c.lesson++; else c.test = true; }
  return { subj:s, test:false, pass, rate:Math.round(rate * 100) / 100, lessonId:l.id, unitIdx:C.units.indexOf(u) };
}

/* ---------- 강의는 하루 한 편 ---------- */
function ebsOn(s){ return !!CURRS[s].ebs && (S.ebsOn || {})[s] !== false; }
function dueLecture(s){
  if (!CURRS[s].ebs || !currOn(s) || !ebsOn(s)) return null;
  const c = curr(s); if (c.test) return null;
  // 다른 강의를 봐서 놓친 강의가 있으면 그것부터 (진도가 넘어갔어도)
  const miss = (c.missed || []).find(n => !c.seen[n]); if (miss) return miss;
  const l = currentLesson(s); if (!l || !l.ebs) return null;
  return l.ebs.find(n => !c.seen[n]) || null;
}
/* 수학과 국어 둘 다 새 강의가 필요하면 번갈아 가며 하나만 */
function planLecture(d = day()){
  if (d.lec !== undefined) return d.lec;
  const cand = ['math','kor'].filter(s => dueLecture(s) && !(d.boards[s]));
  let s = null;
  if (cand.length === 2) s = S.lastLec === 'math' ? 'kor' : 'math';
  else if (cand.length === 1) s = cand[0];
  d.lec = s ? { s, n:dueLecture(s), done:false } : null;
  return d.lec;
}
function boardHasLecture(b){ return b && b.cur && b.cur.lec && !curr(b.cur.subj).seen[b.cur.lec]; }

/* 판 만들기 (진도 과목) */
function makeCurrBoard(k, n){
  const d = day(), lec = planLecture(d), need = dueLecture(k);
  const base = { idx:0, correct:0, secs:0, done:false, phase: k === 'eng' ? 'eng' : 'q', intro:false, startedAt:Date.now() };
  // 강의 보는 날은 다른 판을 줄여서 하루 1시간 안팎으로
  if (lec && lec.s !== k) n = Math.max(7, Math.round(n * .5));
  const c0 = curr(k);
  if (!CURRS[k].units[c0.unit]) return Object.assign(base, { qs:baseGen(k, n), finished:true });   // 이 과목 진도를 다 끝낸 뒤
  if (need && !(lec && lec.s === k)) {
    // 오늘 강의는 다른 과목 차례 → 이 과목은 복습하는 날
    return Object.assign(base, { qs:genCurrReview(k, Math.min(n, 12)), waitLec:true });
  }
  const c = curr(k), isLec = !!(lec && lec.s === k);
  const qs = genCurriculum(k, isLec ? Math.min(n, 5) : n);   // 강의 날은 교재로 같이 풀었으니 앱은 5문제만
  if (!c.test) { const due = dueWrong(k); const old = takeDue(due, Math.min(isLec ? 1 : 3, Math.floor(n / 6))); old.forEach((q, i) => qs.splice(Math.min(qs.length, 4 + i * 5), 0, q)); }
  const cl = currentLesson(k);
  return Object.assign(base, { qs, cur:{ subj:k, test:c.test, unit:c.unit, lesson: c.test || !cl ? null : cl.id, items:[], lec: isLec ? lec.n : null } });
}
function markLectureSeen(s, n, mins){
  const c = curr(s); c.seen[n] = { d:todayKey(), mins };
  S.lastLec = s; const d = day(); if (d.lec && d.lec.s === s) d.lec.done = true;
  const li = lectInfo(s, n);
  notify('mom', `📺 재윤이가 EBS ${li.name} ${li.no}강을 봤어요${mins ? ` (${mins}분)` : ''}`);
  notify('oppa', `📺 재윤이가 ${SUBJ_NAME[s]} ${li.no}강 "${li.desc}"을 봤어요${mins ? ` (${mins}분)` : ''}`);
  save();
}
