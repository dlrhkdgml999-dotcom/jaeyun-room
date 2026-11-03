/* ===================== 건의함 (2026-11-03 오빠 요청) =====================
   재윤이나 엄마가 "이상해요 · 어려워요 · 이런 거 있으면 좋겠어요"를 오빠에게 보낸다. 캡처한 화면(사진첩)·목소리도 같이.
   - 재윤이: 첫 화면 "💌 오빠에게 말하기", 문제 화면 "🙋 이 문제 이상해요"(그 문제·보기·정답·고른 답·그림이 저절로 같이 감)
   - 엄마: 엄마 탭 "💌 오빠에게 건의하기"  ·  오빠: 오빠 탭 맨 위 "💌 건의함"(봤어요 · 고쳤어요 + 한마디 · 내용 복사)
   서버(Firestore 규칙 그대로):
   - families/{fid}/fb/{id}        건의 한 건 (글·문제·몇 장인지만, 작게) → 모든 기기가 목록으로 받음
   - families/{fid}/fbm/{id}_{i0|a} 사진 한 장 · 목소리 (문서 하나 1MB 아래로 줄여서) → 오빠가 "보기"를 누를 때만 받음
   - families/{fid}/fbst/{id}      오빠가 남긴 상태(seen · done)와 한마디
   보내기 전에는 기기에 모아 둠(localStorage jaeyun-fbq) → 인터넷·연결되면 보냄. 가족 연결 안 된 체험판은 이 기기에만 */
const SUG_KINDS = {
  kid:[['bug','🐞','이상해요'],['hard','😣','어려워요'],['idea','💡','이런 거 있으면 좋겠어요'],['like','😊','이거 좋아요']],
  adult:[['bug','🐞','고장 · 이상한 점'],['content','📚','문제 · 내용'],['idea','💡','바라는 점'],['etc','💬','그 밖에']],
};
const SUG_WHO = { kid:['🐰','재윤이'], mom:['💗','엄마'], oppa:['🎁','오빠'] };
const SUG_MAX_IMG = 4, SUG_MAX_REC = 90, SUG_DOC_MAX = 900000;
let SUG = null;   // 쓰는 중인 건의 (화면을 다시 그려도 남음)
let SUG_REC = null, SUG_BACK = null;   // SUG_BACK: 문제 화면에서 왔을 때 그 문제에서 틀린 횟수 (돌아가면 그대로)
const SUG_VIEW = { more:0, open:{}, keep:{} };
function sugKind(who, k){ const list = SUG_KINDS[who === 'kid' ? 'kid' : 'adult']; return list.find(x => x[0] === k) || SUG_KINDS.adult.find(x => x[0] === k) || ['etc','💬','그 밖에']; }
function sugNew(who, from, q){ SUG = { who, from, q:q || null, kind: q ? 'bug' : '', text:'', imgs:[], aud:null, audSec:0, sent:null }; }

const Suggest = {
  list:{}, st:{}, media:{}, mem:{}, loading:{}, flushing:false, retryT:null,
  /* 보낼 것 모음: [{ id, doc, media:{i0:…, a:…}, sent:[] }] */
  queue(){ try { return JSON.parse(localStorage.getItem('jaeyun-fbq') || '[]'); } catch (e) { return []; } },
  setQueue(q){
    try { q.length ? localStorage.setItem('jaeyun-fbq', JSON.stringify(q)) : localStorage.removeItem('jaeyun-fbq'); return true; }
    catch (e) {   // 기기 저장 공간이 모자라면 사진·목소리는 메모리에만 두고 글만 저장
      q.forEach(it => { if (it.media && Object.keys(it.media).length) { this.mem[it.id] = it.media; it.media = {}; it.memOnly = true; } });
      try { localStorage.setItem('jaeyun-fbq', JSON.stringify(q)); } catch (e2) {}
      return false;
    }
  },
  localSt(){ try { return JSON.parse(localStorage.getItem('jaeyun-fbst') || '{}'); } catch (e) { return {}; } },
  /* 모든 건의 (서버 + 아직 못 보낸 것), 새것부터 */
  all(){
    const m = Object.assign({}, this.list);
    this.queue().forEach(it => { if (!m[it.id]) m[it.id] = Object.assign({}, it.doc, { id:it.id, pending:true }); });
    return Object.values(m).sort((a, b) => b.at - a.at);
  },
  status(id){ return this.st[id] || this.localSt()[id] || null; },
  add(doc, media){
    const id = 'f' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const q = this.queue(); q.push({ id, doc, media, sent:[] });
    const ok = this.setQueue(q);
    this.flush();
    return { id, ok };
  },
  async flush(){
    if (!linked() || !Sync.ready || this.flushing || navigator.onLine === false) return;
    this.flushing = true; clearTimeout(this.retryT);
    try {
      for (const it of this.queue()) {
        const media = Object.assign({}, it.media || {}, this.mem[it.id] || {});
        if (it.memOnly && !this.mem[it.id]) it.doc.lost = true;   // 앱을 다시 켜서 메모리에 있던 사진이 사라짐
        for (const [mk, d] of Object.entries(media)) {
          if ((it.sent || []).includes(mk)) continue;
          await Sync.write(`${Sync.base()}/fbm/${it.id}_${mk}`, { d, at:it.doc.at });
          const q = this.queue(), x = q.find(y => y.id === it.id); if (x) { x.sent = [...(x.sent || []), mk]; this.setQueue(q); }
        }
        await Sync.write(`${Sync.base()}/fb/${it.id}`, it.doc);
        this.list[it.id] = Object.assign({ id:it.id }, it.doc);
        Object.entries(media).forEach(([mk, d]) => { (this.media[it.id] = this.media[it.id] || {})[mk] = d; });
        this.setQueue(this.queue().filter(y => y.id !== it.id)); delete this.mem[it.id];
      }
    } catch (e) { console.warn('suggest', e); this.retryT = setTimeout(() => this.flush(), 60000); }
    finally { this.flushing = false; }
    if (SCREEN === 'suggest') sugRefresh();
  },
  onList(snap){ let ch = false; snap.docs.forEach(d => { const x = Object.assign({ id:d.id }, d.data()); if (JSON.stringify(this.list[d.id]) !== JSON.stringify(x)) { this.list[d.id] = x; ch = true; } }); if (ch) sugAfterRemote(); },
  onSt(snap){ let ch = false; snap.docs.forEach(d => { const x = d.data(); if (JSON.stringify(this.st[d.id]) !== JSON.stringify(x)) { this.st[d.id] = x; ch = true; } }); if (ch) sugAfterRemote(); },
  async setSt(id, st, reply){
    const v = { st, reply:reply || '', at:Date.now(), by:role() };
    this.st[id] = v;
    if (!linked() || this.all().find(x => x.id === id && x.pending)) { const l = this.localSt(); l[id] = v; try { localStorage.setItem('jaeyun-fbst', JSON.stringify(l)); } catch (e) {} return true; }
    try { await Sync.write(`${Sync.base()}/fbst/${id}`, v); return true; } catch (e) { return false; }
  },
  /* 사진·목소리 받아 오기 (오빠가 "보기"를 눌렀을 때만) */
  async loadMedia(x){
    const id = x.id, want = sugMediaKeys(x), have = this.media[id] || {};
    const q = this.queue().find(y => y.id === id); if (q) { Object.assign(have, q.media || {}, this.mem[id] || {}); this.media[id] = have; }
    const miss = want.filter(k => !have[k]); if (!miss.length || !linked() || !Sync.db || this.loading[id]) return;
    this.loading[id] = true;
    try { for (const k of miss) { const s = await Sync.db.doc(`${Sync.base()}/fbm/${id}_${k}`).get(); if (s.exists) (this.media[id] = this.media[id] || {})[k] = s.data().d; } }
    catch (e) { toast('사진을 받아 오지 못했어요. 인터넷을 확인해 주세요'); }
    this.loading[id] = false; sugAfterRemote(true);
  },
};
function sugMediaKeys(x){ const k = []; for (let i = 0; i < (x.imgs || 0); i++) k.push('i' + i); if (x.aud) k.push('a'); return k; }
function sugAfterRemote(force){
  if (SCREEN === 'suggest') { if (!SUG_REC) sugRefresh(); return; }
  if (SCREEN === 'adult' || SCREEN === 'home') { if (force) { const y = scrollY; VIEWS[SCREEN](); scrollTo(0, y); } else refreshIfIdle(); }
}
function sugRefresh(){ const y = scrollY; VIEWS.suggest(); scrollTo(0, y); }

/* 사진 줄이기: 글씨가 읽히게 긴 쪽 1600px부터, 문서 하나(1MB)에 들어갈 때까지 */
function shrinkShot(file){
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => {
      let side = 1600, qy = .78, out = '';
      for (let t = 0; t < 8; t++) {
        const sc = Math.min(1, side / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * sc)); c.height = Math.max(1, Math.round(img.height * sc));
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        out = c.toDataURL('image/jpeg', qy);
        if (out.length <= SUG_DOC_MAX - 2000) break;
        if (qy > .5) qy -= .12; else side = Math.round(side * .8);
      }
      out.length <= SUG_DOC_MAX - 2000 ? res(out) : rej(new Error('too big')); };
      img.onerror = rej; img.src = r.result; };
    r.onerror = rej; r.readAsDataURL(file);
  });
}
/* 문제 화면에서 연 경우: 그 문제를 그대로 남긴다 (오빠가 같은 모양으로 볼 수 있게) */
function sugSnapQ(){
  if (!RUN || !RUN.q) return null;
  const q = RUN.q, b = RUN.b;
  let vis = ''; try { vis = q.vis ? visHTML(q) : ''; } catch (e) {}
  if (vis.length > 120000) vis = '';
  return { subj:q.subj || RUN.k || '', lesson:q.lesson || (b && b.cur && b.cur.lesson) || '', type:q.type || '', key:String(q.key || '').slice(0, 200),
    prompt:String(q.prompt || ''), read:String(q.read || q.listen || ''), input:q.input || '', opts:q.input === 'choice' ? (q.opts || []).map(String) : [],
    ans:String(q.ans), wrongs:(RUN.wrongs || []).map(String), tries:RUN.tries || 0, vis, board:RUN.k || '', no:b ? `${b.idx + 1}/${b.qs.length}` : '' };
}
function sugCtx(){
  const parts = [];
  try { ['math','kor','eng'].forEach(s => parts.push(`${SUBJ_NAME[s]} ${currLabel(s)}`)); } catch (e) {}
  return parts.join(' · ');
}
function sugQHTML(q, showAns = true){
  if (!q) return '';
  const lab = (q.lesson ? `${q.lesson} · ` : '') + (SUBJ_NAME[q.subj] || q.subj || '') + (q.no ? ` · ${q.no}번째` : '');
  return `<div class="sug-q"><div class="muted" style="font-size:13px">📎 ${esc(lab)}</div>
    <p class="sug-q-p">${esc(q.prompt)}${q.read && q.read !== q.prompt ? ` <span class="muted">(🔊 ${esc(q.read)})</span>` : ''}</p>
    ${q.vis ? `<div class="sug-q-vis">${q.vis}</div>` : ''}
    ${q.opts && q.opts.length ? `<div class="sug-q-opts">${q.opts.map(o => `<span class="${showAns && o === q.ans ? 'ok' : ''} ${(q.wrongs || []).includes(o) ? 'no' : ''}">${esc(o)}</span>`).join('')}</div>` : ''}
    ${showAns ? `<div class="muted" style="font-size:13px">정답 ${esc(q.ans)}${q.wrongs && q.wrongs.length ? ` · 재윤이가 고른 답 ${q.wrongs.map(esc).join(', ')}` : ''}</div>` : ''}</div>`;
}
function sugStatusPill(x){
  const s = Suggest.status(x.id);
  if (s && s.st === 'done') return `<span class="pill ok">고쳤어요 ✓</span>`;
  if (s && s.st === 'seen') return `<span class="pill">오빠가 봤어요 👀</span>`;
  if (x.pending) return `<span class="pill wait">${linked() ? '보내는 중…' : '이 기기에만 저장'}</span>`;
  return `<span class="pill wait">오빠한테 갔어요</span>`;
}

/* ---------- 쓰는 화면 ---------- */
VIEWS.suggest = arg => {
  if (arg && arg.who) sugNew(arg.who, arg.from || 'home', arg.q);
  if (!SUG) sugNew('kid', 'home');
  const P = SUG, kid = P.who === 'kid', kinds = SUG_KINDS[kid ? 'kid' : 'adult'];
  const mine = Suggest.all().filter(x => x.who === P.who).slice(0, 8);
  const can = P.text.trim() || P.imgs.length || P.aud || P.q;
  const isTab = isTabletDev();
  const shotHelp = isTab ? '태블릿 화면 캡처: <b>전원 버튼 + 소리 줄이기 버튼</b>을 같이 꾹 누르면 사진첩에 저장돼요' : '폰 화면 캡처: <b>전원 버튼 + 소리 줄이기 버튼</b>을 같이 누르면 사진첩에 저장돼요';
  app().innerHTML = `<section class="screen sug">
    <div class="row"><button class="icon-btn" data-a="sugback" aria-label="돌아가기">${ICON.back}</button><h2 style="flex:1">${kid ? '💌 오빠에게 말하기' : '💌 오빠에게 건의하기'}</h2></div>
    ${P.sent ? `<div class="sug-done">${stageHTML(150, { expr:'love', size:110, cls:'hop' })}<b class="disp">${kid ? '고마워! 오빠한테 보냈어 💌' : '오빠에게 보냈어요 💌'}</b>
        <span class="muted">${linked() ? (P.sent.ok === false ? '사진이 커서 이 기기에 다 못 담았어요. 앱을 끄기 전에 인터넷을 연결해 주세요.' : '오빠 폰으로 알림이 가요. 오빠가 보면 여기에 표시돼요.') : '체험판이라 이 기기에만 저장했어요.'}</span>
        <div class="row" style="justify-content:center;flex-wrap:wrap">${P.from === 'q' ? `<button class="btn big" data-a="sugback">문제로 돌아가기</button>` : `<button class="btn" data-a="sugback">돌아가기</button>`}<button class="btn ghost" data-a="sugagain">하나 더 말하기</button></div></div>`
    : `${kid ? `<div class="hero" style="min-height:0">${stageHTML(120, { expr:'think', size:92 })}<div class="bubble left">${P.q ? '어떤 게 이상했어? 말로 해도 돼!' : '오빠한테 하고 싶은 말이 있어? 말로 해도 되고, 사진을 보내도 돼!'}</div></div>` : `<p class="muted" style="font-size:15px">불편한 점, 이상한 문제, 있으면 좋겠는 것을 적어 주세요. 화면을 캡처해서 같이 보내면 오빠가 바로 알아볼 수 있어요.</p>`}
    ${P.q ? `<div class="panel">${sugQHTML(P.q, !kid)}<button class="btn ghost small" data-a="sugdropq" style="justify-self:start">이 문제 빼기</button></div>` : ''}
    <div class="panel"><h3>${kid ? '어떤 이야기야?' : '어떤 내용인가요?'}</h3>
      <div class="sug-kinds">${kinds.map(([k, ic, l]) => `<button class="sug-kind ${P.kind === k ? 'on' : ''}" data-a="sugkind" data-v="${k}"><span class="ic">${ic}</span>${l}</button>`).join('')}</div></div>
    <div class="panel"><h3>${kid ? '하고 싶은 말' : '내용'}</h3>
      <div class="field"><textarea id="sugText" rows="${kid ? 3 : 4}" maxlength="1000" placeholder="${kid ? '글로 써도 되고, 아래 🎤로 말해도 돼' : '예: 받아쓰기 3번은 소리가 안 나와요 / 수학 문제 그림이 잘려요'}">${esc(P.text)}</textarea></div>
      <div class="sug-rec">
        <button class="rec-btn ${SUG_REC ? 'on' : ''}" data-a="sugrec">${SUG_REC ? '멈추기' : '🎤'}</button>
        <span class="grow" style="flex:1">${SUG_REC ? `<b>듣고 있어요…</b> <span id="sugRecT">0</span>초 (끝나면 멈추기)` : P.aud ? `<audio controls src="${P.aud}"></audio><button class="btn ghost small" data-a="sugdelaud">목소리 지우기</button>` : `<span class="muted">${kid ? '눌러서 말로 하기' : '말로 남기기 (최대 90초)'}</span>`}</span>
      </div></div>
    <div class="panel"><h3>📷 사진 · 캡처 화면 <small class="muted">${P.imgs.length}/${SUG_MAX_IMG}</small></h3>
      ${P.imgs.length ? `<div class="sug-thumbs">${P.imgs.map((s, i) => `<div class="sug-thumb"><img src="${s}" alt="올린 사진 ${i + 1}"><button data-a="sugdelimg" data-v="${i}" aria-label="사진 빼기">✕</button></div>`).join('')}</div>` : ''}
      ${P.imgs.length < SUG_MAX_IMG ? `<label class="btn ${P.imgs.length ? 'ghost' : 'sky'} file-btn">${P.imgs.length ? '사진 더 올리기' : '사진첩에서 고르기'}<input type="file" accept="image/*" multiple id="sugImg"></label>` : ''}
      <p class="muted" style="font-size:13px">${shotHelp}. 그다음 여기서 "사진첩에서 고르기"를 눌러요.</p></div>
    <button class="btn big ${can ? '' : 'off'}" data-a="sugsend" ${can ? '' : 'aria-disabled="true"'}>${kid ? '오빠한테 보내기 💌' : '오빠에게 보내기'}</button>`}
    ${mine.length ? `<div class="panel"><h3>${kid ? '내가 보낸 이야기' : '보낸 건의'}</h3><div class="list">${mine.map(x => { const s = Suggest.status(x.id), k = sugKind(x.who, x.kind);
      return `<div class="li" style="flex-wrap:wrap"><span class="grow" style="flex:1;min-width:60%">${k[1]} ${esc(x.text || (x.q ? '이 문제가 이상해요' : x.aud ? '(목소리)' : x.imgs ? `(사진 ${x.imgs}장)` : ''))}<br><span class="muted" style="font-size:13px">${agoText(x.at)}</span>${s && s.reply ? `<br><span class="sug-reply">🎁 오빠: ${esc(s.reply)}</span>` : ''}</span>${sugStatusPill(x)}</div>`; }).join('')}</div></div>` : ''}
  </section>`;
  if (!P.sent && kid && arg && arg.who) speak(P.q ? '어떤 게 이상했어? 말로 해도 돼!' : '오빠한테 하고 싶은 말이 있어? 말로 해도 되고, 사진을 보내도 돼!');
};
document.addEventListener('input', e => { if (e.target && e.target.id === 'sugText' && SUG) { SUG.text = e.target.value; const b = document.querySelector('[data-a="sugsend"]'); if (b) { const can = SUG.text.trim() || SUG.imgs.length || SUG.aud || SUG.q; b.classList.toggle('off', !can); can ? b.removeAttribute('aria-disabled') : b.setAttribute('aria-disabled', 'true'); } } });
document.addEventListener('change', async e => {
  const el = e.target; if (!el || el.id !== 'sugImg' || !el.files || !SUG) return;
  const files = [...el.files].slice(0, SUG_MAX_IMG - SUG.imgs.length); if (!files.length) return;
  toast('사진을 올리는 중이에요…');
  let bad = 0; for (const f of files) { try { SUG.imgs.push(await shrinkShot(f)); } catch (x) { bad++; } }
  if (bad) toast('사진 하나를 불러오지 못했어요. 다른 사진으로 해 주세요');
  if (el.files.length > files.length) toast(`사진은 ${SUG_MAX_IMG}장까지 보낼 수 있어요`);
  sugRefresh();
});
async function sugRecStart(){
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    const chunks = [], rec = new MediaRecorder(stream), t0 = Date.now();
    SUG_REC = { rec, stream, t0, tick:setInterval(() => { const s = Math.round((Date.now() - t0) / 1000), el = document.getElementById('sugRecT'); if (el) el.textContent = s; if (s >= SUG_MAX_REC) sugRecStop(); }, 500) };
    rec.ondataavailable = ev => chunks.push(ev.data);
    rec.onstop = () => { stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunks, { type:rec.mimeType || 'audio/webm' });
      blobToData(blob).then(d => { if (!SUG) return; if (d.length > SUG_DOC_MAX - 2000) { toast('목소리가 너무 길어요. 짧게 다시 말해 줘요'); } else { SUG.aud = d; SUG.audSec = Math.round((Date.now() - t0) / 1000); } if (SCREEN === 'suggest') sugRefresh(); }); };
    rec.start(); sugRefresh();
  } catch (x) { SUG_REC = null; toast('여기서는 녹음이 안 돼요. 글이나 사진으로 보내 주세요'); }
}
function sugRecStop(){ if (!SUG_REC) return; const r = SUG_REC; SUG_REC = null; clearInterval(r.tick); try { r.rec.stop(); } catch (x) { try { r.stream.getTracks().forEach(t => t.stop()); } catch (y) {} } }
function sugSubmit(){
  const P = SUG; if (!P || P.sent) return;
  if (!(P.text.trim() || P.imgs.length || P.aud || P.q)) { toast('하고 싶은 말을 적거나 사진을 골라 주세요'); return; }
  sugRecStop();
  const kind = P.kind || (P.q ? 'bug' : P.who === 'kid' ? 'idea' : 'etc');
  const doc = { who:P.who, kind, text:P.text.trim().slice(0, 1000), at:Date.now(), d:todayKey(), ver:String(window.APP_VERSION || ''), dev:devId(), tab:isTabletDev(), from:P.from || '', ctx:sugCtx(), imgs:P.imgs.length, aud:P.aud ? (P.audSec || 1) : 0 };
  if (P.q) doc.q = P.q;
  const media = {}; P.imgs.forEach((s, i) => media['i' + i] = s); if (P.aud) media.a = P.aud;
  const r = Suggest.add(doc, media);
  // 오빠 폰 알림 (알림함 + ntfy). 오빠가 스스로 남긴 메모는 알리지 않음
  if (P.who !== 'oppa') {
    const k = sugKind(P.who, kind), extra = [doc.imgs ? `사진 ${doc.imgs}장` : '', doc.aud ? `목소리 ${doc.aud}초` : '', P.q ? `문제 ${P.q.lesson || ''}` : ''].filter(Boolean).join(' · ');
    const n = { to:'oppa', text:`💌 ${SUG_WHO[P.who][1]} 건의 · ${k[1]} ${k[2]}${doc.text ? `: "${doc.text.slice(0, 60)}${doc.text.length > 60 ? '…' : ''}"` : ''}${extra ? ` (${extra})` : ''}`, at:Date.now(), d:todayKey() };
    S.notes.unshift(n); trimNotes(); Sync.addNote(n); try { Ntfy.send(n); } catch (x) {}
    save();
  }
  P.sent = r; SFX.right && SFX.right();
  if (P.who === 'kid') speak('고마워! 오빠한테 보냈어');
  sugRefresh();
}
Object.assign(ACT, {
  sug(el){ const who = el.dataset.v || 'kid'; go('suggest', { who, from: SCREEN === 'adult' ? 'adult' : 'home' }); },
  sugq(){ if (!RUN || !RUN.q) return; const snap = sugSnapQ(); SUG_BACK = { tries:RUN.tries, wrongs:[...(RUN.wrongs || [])], done:!!RUN.locked, el:Date.now() - (RUN.t0 || Date.now()), q:RUN.q }; go('suggest', { who: linked() && role() !== 'kid' ? (role() === 'oppa' ? 'oppa' : 'mom') : 'kid', from:'q', q:snap }); },
  sugkind(el){ if (!SUG) return; SUG.kind = SUG.kind === el.dataset.v ? '' : el.dataset.v; SFX.tap(); sugRefresh(); },
  sugdropq(){ if (SUG) { SUG.q = null; sugRefresh(); } },
  sugrec(){ if (SUG_REC) sugRecStop(); else sugRecStart(); },
  sugdelaud(){ if (SUG) { SUG.aud = null; SUG.audSec = 0; sugRefresh(); } },
  sugdelimg(el){ if (SUG) { SUG.imgs.splice(+el.dataset.v, 1); sugRefresh(); } },
  sugsend(){ sugSubmit(); },
  sugagain(){ if (SUG) { sugNew(SUG.who, SUG.from === 'q' ? 'home' : SUG.from); sugRefresh(); } },
  sugback(){ sugRecStop(); const from = SUG ? SUG.from : 'home'; SUG = null;
    if (from === 'q' && RUN && RUN.b && RUN.b.qs[RUN.b.idx]) { const bk = SUG_BACK; SUG_BACK = null;
      // 이미 맞혔거나 정답을 본 문제(답이 기록됨)면 다음 문제로, 아니면 그 문제를 틀린 횟수 그대로 다시. 건의 화면에 있던 시간은 문제 시간에서 뺌
      if (bk && bk.done && RUN.b.qs[RUN.b.idx] === bk.q) { SCREEN = 'q'; RUN.t0 = Date.now() - bk.el; nextQ(); return; }
      go('q'); if (bk && RUN.b.qs[RUN.b.idx] === bk.q) { RUN.tries = bk.tries; RUN.wrongs = bk.wrongs; RUN.t0 = Date.now() - bk.el; } return; }
    go(from === 'adult' ? 'adult' : 'home'); },
  /* 오빠: 상태 바꾸기 · 한마디 · 복사 · 사진 보기 */
  sugst(el){ const id = el.dataset.id, st = el.dataset.v; SUG_VIEW.keep[id] = true; const inp = document.getElementById('sugrp_' + id), reply = inp ? inp.value.trim() : ((Suggest.status(id) || {}).reply || '');
    Suggest.setSt(id, st, reply).then(ok => { toast(ok ? (st === 'done' ? '고쳤어요로 표시했어요. 보낸 사람 화면에 보여요' : '봤어요로 표시했어요') : '저장하지 못했어요. 인터넷을 확인해 주세요'); const x = Suggest.all().find(y => y.id === id);
      if (ok && st === 'done' && x && x.who === 'mom') { const n = { to:'mom', text:`💌 오빠가 건의를 고쳤어요: "${(x.text || '사진 건의').slice(0, 40)}"${reply ? ` · ${reply}` : ''}`, at:Date.now(), d:todayKey() }; Sync.addNote(n); try { Ntfy.send(n); } catch (e) {} }
      const y = scrollY; VIEWS.adult(); scrollTo(0, y); }); },
  sugopen(el){ const id = el.dataset.id; SUG_VIEW.open[id] = !SUG_VIEW.open[id]; const x = Suggest.all().find(y => y.id === id); if (SUG_VIEW.open[id] && x) Suggest.loadMedia(x); const y = scrollY; VIEWS.adult(); scrollTo(0, y); },
  sugkeep(el){ SUG_VIEW.keep[el.dataset.id] = true; const y = scrollY; VIEWS.adult(); scrollTo(0, y); },
  sugmore(){ SUG_VIEW.more++; const y = scrollY; VIEWS.adult(); scrollTo(0, y); },
  sugcopy(el){ const x = Suggest.all().find(y => y.id === el.dataset.id); if (!x) return; const t = sugCopyText(x);
    const fb = () => { const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('내용을 복사했어요'); } catch (e) { toast('복사하지 못했어요'); } ta.remove(); };
    try { navigator.clipboard.writeText(t).then(() => toast('내용을 복사했어요. Claude에게 붙여 넣으면 돼요'), fb); } catch (e) { fb(); } },
  sugkidseen(){ try { localStorage.setItem('jaeyun-fbseen', String(Date.now())); } catch (e) {} go('suggest', { who:'kid', from:'home' }); },
});
function sugCopyText(x){
  const k = sugKind(x.who, x.kind), d = new Date(x.at), s = Suggest.status(x.id);
  const L = [`[재윤이 공부방 건의] ${d.getMonth() + 1}/${d.getDate()}(${DOW[d.getDay()]}) ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')} · ${SUG_WHO[x.who] ? SUG_WHO[x.who][1] : x.who} · ${k[1]} ${k[2]}`];
  if (x.text) L.push('내용: ' + x.text);
  if (x.q) { const q = x.q; L.push(`문제: [${SUBJ_NAME[q.subj] || q.subj} ${q.lesson || ''} · ${q.type}${q.no ? ` · ${q.no}` : ''}] ${q.prompt}${q.read && q.read !== q.prompt ? ` (읽기: ${q.read})` : ''}`);
    if (q.opts && q.opts.length) L.push(`보기: ${q.opts.join(' / ')}`); L.push(`정답: ${q.ans}${q.wrongs && q.wrongs.length ? ` · 재윤이가 고른 답: ${q.wrongs.join(', ')}` : ''}`); L.push(`문제 키: ${q.key}`); }
  if (x.imgs || x.aud) L.push(`첨부: ${x.imgs ? `사진 ${x.imgs}장` : ''}${x.imgs && x.aud ? ' · ' : ''}${x.aud ? `목소리 ${x.aud}초` : ''} (사진은 길게 눌러 저장해서 같이 보내기)`);
  L.push(`진도: ${x.ctx || '-'}`);
  L.push(`기기: ${x.tab ? '태블릿' : '폰'} · ${{ q:'문제 풀다가', home:'첫 화면에서', adult:'엄마·오빠 메뉴에서' }[x.from] || '-'} · 앱 ${kidVer(x.ver)}`);
  if (s && s.st) L.push(`상태: ${s.st === 'done' ? '고침' : '봄'}${s.reply ? ` · ${s.reply}` : ''}`);
  return L.join('\n');
}
/* 오빠 탭: 건의함 */
function suggestPanel(){
  const every = Suggest.all(), fresh = every.filter(x => !Suggest.status(x.id) && x.who !== 'oppa');
  // 고친 건의는 아래 접는 칸으로 (오빠 탭이 길어지지 않게). 방금 고친 것(열어 둔 것)은 그 자리에
  const isDone = x => { const s = Suggest.status(x.id); return s && s.st === 'done' && !SUG_VIEW.open[x.id] && !SUG_VIEW.keep[x.id]; };
  const all = every.filter(x => !isDone(x)), done = every.filter(isDone);
  const show = all.slice(0, 6 + SUG_VIEW.more * 10);
  return `<div class="panel sug-box"><h3>💌 건의함 ${fresh.length ? `<span class="pill">새 건의 ${fresh.length}</span>` : ''}</h3>
    ${all.length ? `<div class="list">${show.map(x => { const k = sugKind(x.who, x.kind), s = Suggest.status(x.id), open = SUG_VIEW.open[x.id], md = Suggest.media[x.id] || {}, w = SUG_WHO[x.who] || ['💬', x.who];
      return `<div class="li sug-item ${s ? '' : 'new'}"><div class="grow" style="flex:1;min-width:0">
        <div class="row" style="gap:6px;flex-wrap:wrap"><b>${w[0]} ${w[1]}</b><span>${k[1]} ${k[2]}</span><span class="spacer"></span><span class="muted" style="font-size:13px">${agoText(x.at)}</span>${sugStatusPill(x)}</div>
        ${x.text ? `<p class="sug-text">${esc(x.text)}</p>` : ''}
        ${x.q ? sugQHTML(x.q) : ''}
        ${x.lost ? `<p class="muted" style="font-size:13px">사진·목소리는 보내기 전에 앱이 꺼져서 못 왔어요</p>` : ''}
        ${x.imgs || x.aud ? (open ? `<div class="sug-media">${Array.from({ length:x.imgs || 0 }, (_, i) => md['i' + i] ? `<a href="${md['i' + i]}" download="재윤이건의_${x.id}_${i + 1}.jpg" target="_blank"><img src="${md['i' + i]}" alt="건의 사진 ${i + 1}"></a>` : `<span class="muted">사진 받는 중…</span>`).join('')}${x.aud ? (md.a ? `<audio controls src="${md.a}"></audio>` : `<span class="muted">목소리 받는 중…</span>`) : ''}</div><p class="muted" style="font-size:12px">사진을 누르면 크게 열려요 · 길게 눌러 저장</p>`
          : `<button class="btn ghost small" data-a="sugopen" data-id="${x.id}">${x.imgs ? `📷 사진 ${x.imgs}장` : ''}${x.imgs && x.aud ? ' · ' : ''}${x.aud ? `🎤 목소리 ${x.aud}초` : ''} 보기</button>`) : ''}
        <p class="muted" style="font-size:12px">${esc(x.ctx || '')}</p>
        ${x.who !== 'oppa' ? `<div class="field"><input type="text" id="sugrp_${x.id}" maxlength="80" placeholder="${x.who === 'kid' ? '재윤이에게 한마디 (예: 고쳤어! 알려 줘서 고마워)' : '엄마에게 한마디'}" value="${esc((s && s.reply) || '')}"></div>` : ''}
        <div class="row" style="flex-wrap:wrap;gap:6px">${s ? '' : `<button class="btn ghost small" data-a="sugst" data-id="${x.id}" data-v="seen">👀 봤어요</button>`}<button class="btn small ${s && s.st === 'done' ? 'ghost' : 'mint'}" data-a="sugst" data-id="${x.id}" data-v="done">${s && s.st === 'done' ? '한마디 고치기' : '✓ 고쳤어요'}</button><button class="btn ghost small" data-a="sugcopy" data-id="${x.id}">📋 내용 복사</button>${open ? `<button class="btn ghost small" data-a="sugopen" data-id="${x.id}">사진 접기</button>` : ''}</div>
      </div></div>`; }).join('')}</div>
      ${all.length > show.length ? `<button class="btn ghost small" data-a="sugmore">${all.length - show.length}개 더 보기</button>` : ''}`
    : every.length ? `<p class="muted">새 건의가 없어요 ✓</p>` : `<p class="muted">아직 건의가 없어요. 재윤이 첫 화면 "💌 오빠에게 말하기", 문제 화면 "🙋 이 문제 이상해요", 엄마 탭 "💌 오빠에게 건의하기"로 보낼 수 있어요.</p>`}
    ${done.length ? `<details class="sug-done-list"><summary>고친 건의 ${done.length}개</summary><div class="list">${done.slice(0, 40).map(x => { const k = sugKind(x.who, x.kind), s = Suggest.status(x.id), w = SUG_WHO[x.who] || ['💬', x.who];
      return `<button class="li" data-a="sugkeep" data-id="${x.id}" style="text-align:left"><span class="grow" style="flex:1;min-width:0">${w[0]} ${k[1]} ${esc((x.text || (x.q ? x.q.prompt : '사진 건의')).slice(0, 50))}${s.reply ? `<br><span class="sug-reply">🎁 ${esc(s.reply)}</span>` : ''}</span><span class="muted" style="font-size:12px;white-space:nowrap">${shortDate(x.d || todayKey())}</span></button>`; }).join('')}</div></details>` : ''}
    <p class="muted" style="font-size:13px">"📋 내용 복사"를 누르면 문제·진도·앱 버전까지 한 번에 복사돼요. Claude에게 붙여 넣고 캡처 사진을 같이 보내면 바로 고칠 수 있어요.</p>
    <button class="btn ghost small" data-a="sug" data-v="oppa" style="justify-self:start">✏️ 오빠 메모 남기기</button></div>`;
}
/* 재윤이 첫 화면: 오빠가 고쳐 준 게 있으면 알려 준다 (한 번 보면 사라짐) */
function sugKidBanner(){
  let seen = 0; try { seen = +localStorage.getItem('jaeyun-fbseen') || 0; } catch (e) {}
  const x = Suggest.all().find(y => y.who === 'kid' && Suggest.status(y.id) && Suggest.status(y.id).st === 'done' && Suggest.status(y.id).at > seen && Date.now() - Suggest.status(y.id).at < 7 * 86400000);
  if (!x) return '';
  const s = Suggest.status(x.id);
  return `<button class="alarm-banner" data-a="sugkidseen" style="width:100%;text-align:left;border-color:var(--mint-deep);background:var(--mint-pale)"><span style="font-size:28px">💌</span><span style="flex:1">오빠가 재윤이 이야기를 듣고 고쳤대!${s.reply ? ` "${esc(s.reply)}"` : ''}</span></button>`;
}
window.addEventListener('online', () => Suggest.flush());
document.addEventListener('visibilitychange', () => { if (!document.hidden) Suggest.flush(); });
