/* ===================== 직접 써 보기 (쓰기 차시) ===================== */
/* 차시마다 한두 문장을 펜(태블릿)이나 공책(사진)으로 써서 엄마에게 보낸다 */
const WRITE_TASKS = {
  'k1-3':{ prompt:'나를 소개하는 문장을 두 줄 써 봐요', guide:'나는 ○○○이에요.\n나는 ○○를 좋아해요.', lines:2 },
  'k2-3':{ prompt:'"토끼"를 넣어서 문장을 하나 만들어 봐요', guide:'예) 토끼가 당근을 먹어요.', lines:1 },
  'k3-1':{ prompt:'"꽃이 피었어요."를 꾸며 주는 말을 넣어 더 자세하게 써 봐요', guide:'예) 노란 꽃이 활짝 피었어요.', lines:1 },
  'k3-4':{ prompt:'오늘 있었던 일을 일기로 세 줄 써 봐요', guide:'① 오늘 한 일\n② 그때 있었던 일\n③ 내 마음 (기뻤다, 속상했다…)', lines:3 },
  'k5-2':{ prompt:'오늘 내 마음을 나타내는 말을 넣어 한 문장 써 봐요', guide:'예) 오빠가 놀아 줘서 기뻤어요.', lines:1 },
  'k6-3':{ prompt:'내 생각과 까닭을 함께 써 봐요', guide:'나는 ○○가 좋아요.\n왜냐하면 ○○ 때문이에요.', lines:2 },
  'k7-2':{ prompt:'친구에게 고운 말로 한 문장 써 봐요', guide:'예) 도와줘서 고마워. 너는 정말 좋은 친구야.', lines:1 },
  'k8-2':{ prompt:'이야기 속 인물에게 하고 싶은 말을 써 봐요', guide:'예) 생쥐야, 약속을 지켜서 멋져!', lines:2 },
  'e6-1':{ prompt:'따라 써 봐요: It is a cat.', guide:'It is a cat.', lines:1, en:true },
  'e6-2':{ prompt:'따라 써 봐요: I like apples.', guide:'I like apples.', lines:1, en:true },
  'e6-3':{ prompt:'따라 써 봐요: I can swim.', guide:'I can swim.', lines:1, en:true },
};
function writeTaskFor(b){ return b && b.cur && !b.cur.test && b.cur.lesson && WRITE_TASKS[b.cur.lesson] && !b.wrote ? WRITE_TASKS[b.cur.lesson] : null; }
let WRITE = null;
VIEWS.write = () => {
  const b = RUN.b, w = writeTaskFor(b) || WRITE_TASKS[b.cur.lesson], k = RUN.k, d = day(), have = (d.writes || {})[k];
  const pen = penMode();
  app().innerHTML = `<section class="screen">
    <div class="q-top"><button class="icon-btn" data-a="home" aria-label="나가기">${ICON.close}</button><span class="disp" style="flex:1;font-size:20px">✏️ 직접 써 보기</span></div>
    <div class="q-card">
      <div class="q-head"><p class="q-prompt">${esc(w.prompt)}</p><button class="speak-btn" data-a="writesay" aria-label="다시 듣기">${ICON.speak}</button></div>
      <div class="passage" style="${w.en ? "font-family:'Helvetica Neue',Arial,sans-serif;font-size:26px" : ''}">${esc(w.guide).replace(/\n/g, '<br>')}</div>
      ${pen ? `<div class="pen-wrap"><canvas id="pen" class="pen-canvas" style="height:${w.lines * 110 + 40}px" aria-label="쓰는 칸"></canvas><button class="btn ghost small" data-a="writeclear">지우고 다시 쓰기</button></div>`
        : have && have.img ? `<img class="photo-prev" src="${have.img}" alt="쓴 글 사진">` : `<div class="note-paper"><span class="muted">공책에 또박또박 쓰고, 다 쓰면 사진을 찍어요</span></div>`}
    </div>
    ${pen ? `<button class="btn big mint" data-a="writedone">다 썼어요! 엄마에게 보내기</button>`
      : `<label class="btn ${have && have.img ? 'ghost' : 'mint'} big file-btn">${have && have.img ? '다시 찍기' : '📷 사진 찍기'}<input type="file" accept="image/*" capture="environment" id="writeIn"></label>${have && have.img ? `<button class="btn big" data-a="writedone">엄마에게 보내기</button>` : ''}`}
    <button class="grown-up" data-a="writeskip">오늘은 다음에 쓸게요</button>
  </section>`;
  if (pen) setupPen(w.lines + 1);
  speak(w.prompt + '. 천천히, 또박또박 써 봐!');
};
function afterWrite(){
  const b = RUN.b, k = RUN.k; b.wrote = true; save();
  if (k === 'eng' && b.phase === 'eng') { b.phase = 'dict'; const d = day(); if (!d.dict) d.dict = { words:pickDict(10), idx:0, photo:null, graded:false, marks:null, sent:false }; save(); return go('dict'); }
  finishBoard(k);
}
function saveWrite(img, skipped){
  const d = day(), b = RUN.b, w = WRITE_TASKS[b.cur.lesson];
  d.writes = d.writes || {};
  d.writes[RUN.k] = { lesson:b.cur.lesson, prompt:w.prompt, img:img || null, skipped:!!skipped, at:Date.now() };
  if (!skipped) notify('mom', `✏️ 재윤이가 쓴 글이 왔어요: "${w.prompt}" 엄마 메뉴에서 보고 한마디 남겨 주세요`);
  else notify('mom', `✏️ 재윤이가 오늘 쓰기("${w.prompt}")를 다음으로 미뤘어요`);
}
/* 엄마 반응을 재윤이 태블릿에서 한 번만 알려 준다 */
function applyWriteFb(){
  if (!canWriteKid()) return false;
  let changed = false;
  Object.entries(S.writeFb || {}).forEach(([key, fb]) => {
    const [dk, k] = key.split('|'), wr = S.days[dk] && S.days[dk].writes && S.days[dk].writes[k];
    if (!wr || wr.fbShown) return;
    wr.fbShown = true; changed = true;
    S.kidNotes.unshift({ text: fb.good ? `엄마가 재윤이 글을 봤어! ${fb.text ? '"' + fb.text + '"' : '정말 잘 썼어! 💗'}` : `엄마가 재윤이 글을 봤어. ${fb.text ? '"' + fb.text + '"' : '다음엔 조금 더 또박또박 써 보자!'}`, at:Date.now() });
  });
  if (changed) S.kidNotes = S.kidNotes.slice(0, 10);
  return changed;
}
/* 엄마 메뉴: 재윤이가 쓴 글 */
function writesPanel(){
  const items = Object.entries(S.days).flatMap(([dk, dy]) => Object.entries(dy.writes || {}).map(([k, w]) => ({ dk, k, w }))).sort((a, b) => b.w.at - a.w.at).slice(0, 5);
  return `<div class="panel"><h3>✏️ 재윤이가 쓴 글</h3>
    ${items.length ? items.map(({ dk, k, w }) => { const key = `${dk}|${k}`, fb = (S.writeFb || {})[key];
      return `<div class="panel" style="padding:12px;background:var(--bg);border:0">
        <div class="row"><b class="disp" style="font-size:17px;font-weight:400;flex:1">${shortDate(dk)} · ${esc(w.prompt)}</b>${fb ? `<span class="pill ok">${fb.good ? '💗 칭찬함' : '✏️ 다시 써 보자'}</span>` : w.skipped ? '<span class="pill no">미룸</span>' : '<span class="pill wait">아직 안 봄</span>'}</div>
        ${w.img ? `<img src="${w.img}" alt="재윤이가 쓴 글" style="width:100%;border-radius:12px;background:#fff">` : w.skipped ? '<p class="muted">이날은 쓰기를 다음으로 미뤘어요.</p>' : ''}
        ${w.img && !fb ? `<div class="field"><input type="text" id="wfb-${esc(key)}" maxlength="40" placeholder="한마디 (예: 글씨가 정말 반듯해졌어!)"></div>
          <div class="row" style="flex-wrap:wrap"><button class="btn mint small" data-a="writefb" data-v="${esc(key)}|1">💗 잘 썼어</button><button class="btn ghost small" data-a="writefb" data-v="${esc(key)}|0">✏️ 다시 써 보자</button></div>` : ''}
      </div>`; }).join('') : '<p class="muted">국어 쓰기 차시(나를 소개하기, 일기 등)와 영어 문장 차시에서 재윤이가 직접 쓴 글이 여기로 와요.</p>'}
  </div>`;
}
