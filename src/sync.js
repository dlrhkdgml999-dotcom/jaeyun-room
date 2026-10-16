/* ===================== 가족 연결 (Firebase) =====================
   - 한 가족 = families/{fid}. fid는 20자 이상 무작위 → 링크를 아는 가족만 들어올 수 있다.
   - S의 큰 칸(키)마다 문서 하나: families/{fid}/s/{key} = { v: 값 }
   - 날짜별 공부 기록: families/{fid}/days/{날짜} = { v: 그날 기록 }   (재윤이 기기만 씀)
   - 알림: families/{fid}/notes/{id}                                    (누구나 추가만)
   - 사진·녹음: families/{fid}/blobs/{해시}[_조각]                        (큰 파일은 조각내서)
   - 이 기기에만 남는 것: 역할, 가족 번호, 체험판 날짜, 탭 위치            */
const LOCAL_KEYS = ['local','dayOffset','adultTab','notes','days','v'];
const KID_KEYS = ['started','firstDay','stickers','equipped','seenItems','wrong','avgSec','dictUsed','curr','currs','lastLec','kidNotes','giftAch'];
const ADULT_KEYS = ['alarms','level','mathMode','modes','ebsOn','pace','dictMode','eyeBreak','tts','bunnyName','pin','praise','voices','grades','gift'];
const BLOB_MIN = 4000, CHUNK = 700000;
function role(){ return (S.local && S.local.role) || 'all'; }
function linked(){ return !!(S.local && S.local.fid); }
function canWriteKid(){ return !linked() || role() === 'kid'; }
function newFid(){ const a = 'abcdefghijkmnpqrstuvwxyz23456789'; let s = ''; const r = new Uint8Array(22); (crypto || window.msCrypto).getRandomValues(r); r.forEach(x => s += a[x % a.length]); return s; }
function hashStr(str){ let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36) + str.length.toString(36); }

const Sync = {
  db:null, ready:false, status:'off', last:{ s:{}, days:{} }, timer:null, blobCache:{}, blobWait:{}, unsub:[], applying:false,
  base(){ return `families/${S.local.fid}`; },
  async start(){
    if (!linked() || this.ready) return;
    if (!window.firebase || !window.FIREBASE_CONFIG) { this.status = 'nosdk'; return; }
    try {
      this.status = 'connecting';
      if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      await firebase.auth().signInAnonymously();
      this.db = firebase.firestore();
      try { this.blobCache = JSON.parse(localStorage.getItem('jaeyun-blobs') || '{}'); } catch (e) {}
      // 처음 연결할 때 기준점: 지금 이 기기 값
      [...KID_KEYS, ...ADULT_KEYS].forEach(k => this.last.s[k] = JSON.stringify(this.pack(S[k])));
      Object.keys(S.days).forEach(k => this.last.days[k] = JSON.stringify(this.pack(S.days[k])));
      this.listen();
      this.ready = true; this.status = 'on';
    } catch (e) { this.status = 'error'; this.error = String(e && e.message || e); console.warn('sync', e); }
  },
  /* 내 역할이 쓸 수 있는 칸 */
  writable(k){ return true; },   // 실제로 바뀐 칸만 보내므로 누구나 쓸 수 있게 둔다 (같은 칸을 동시에 고치면 나중 것이 남음)
  listen(){
    const b = this.base();
    this.unsub.push(this.db.collection(`${b}/s`).onSnapshot(snap => this.onState(snap)));
    this.unsub.push(this.db.collection(`${b}/days`).onSnapshot(snap => this.onDays(snap)));
    this.unsub.push(this.db.collection(`${b}/notes`).orderBy('at', 'desc').limit(80).onSnapshot(snap => this.onNotes(snap)));
  },
  onState(snap){
    let changed = false;
    snap.docs.forEach(d => { const k = d.id, raw = JSON.stringify(d.data().v);
      if (LOCAL_KEYS.includes(k)) return;
      const dirty = JSON.stringify(this.pack(S[k])) !== this.last.s[k];
      if (raw === this.last.s[k]) return;           // 내가 쓴 것이 돌아온 것
      if (dirty && this.writable(k)) return;         // 아직 못 보낸 내 변경이 우선 (곧 덮어씀)
      this.last.s[k] = raw; S[k] = this.unpack(d.data().v); changed = true; });
    if (changed) this.afterRemote();
  },
  onDays(snap){
    let changed = false;
    snap.docs.forEach(d => { const k = d.id, raw = JSON.stringify(d.data().v);
      if (raw === this.last.days[k]) return;
      const dirty = S.days[k] && JSON.stringify(this.pack(S.days[k])) !== this.last.days[k];
      if (dirty && canWriteKid()) return;
      this.last.days[k] = raw; S.days[k] = this.unpack(d.data().v); changed = true; });
    if (changed) this.afterRemote();
  },
  onNotes(snap){
    const ids = new Set(S.notes.map(n => n.id)); let changed = false;
    snap.docs.forEach(d => { const n = d.data(); if (!ids.has(d.id)) { S.notes.push(Object.assign({ id:d.id }, n)); changed = true; } });
    if (changed) { S.notes.sort((a, b) => b.at - a.at); S.notes = S.notes.slice(0, 80); this.afterRemote(); }
  },
  afterRemote(){
    this.applying = true;
    if (applyGrades()) this.schedule();
    saveLocal();
    this.applying = false;
    refreshIfIdle();
  },
  schedule(){ if (!this.ready) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.push(), 700); },
  async push(){
    if (!this.ready) return;
    const b = this.base(), jobs = [];
    for (const k of [...KID_KEYS, ...ADULT_KEYS]) {
      if (!this.writable(k)) continue;
      const v = this.pack(S[k]), raw = JSON.stringify(v);
      if (raw === this.last.s[k] || v === undefined) continue;
      this.last.s[k] = raw; jobs.push(this.db.doc(`${b}/s/${k}`).set({ v, at:Date.now(), by:role() }));
    }
    if (canWriteKid()) for (const k of Object.keys(S.days)) {
      const v = this.pack(S.days[k]), raw = JSON.stringify(v);
      if (raw === this.last.days[k]) continue;
      this.last.days[k] = raw; jobs.push(this.db.doc(`${b}/days/${k}`).set({ v, at:Date.now() }));
    }
    try { await Promise.all(jobs); this.status = 'on'; } catch (e) { this.status = 'error'; this.error = String(e && e.message || e); }
  },
  addNote(n){ if (!this.ready) return; n.id = n.id || ('n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)); this.db.doc(`${this.base()}/notes/${n.id}`).set({ to:n.to, text:n.text, at:n.at, d:n.d }).catch(() => {}); },
  /* 큰 데이터(사진·녹음)를 blobs로 빼고 짧은 표시로 바꾼다 */
  pack(v){
    if (typeof v === 'string') { if (v.startsWith('data:') && v.length > BLOB_MIN) { const h = hashStr(v); this.putBlob(h, v); return 'blobref:' + h; } return v; }
    if (Array.isArray(v)) return v.map(x => this.pack(x));
    if (v && typeof v === 'object') { const o = {}; for (const k in v) { const p = this.pack(v[k]); if (p !== undefined) o[k] = p; } return o; }
    return v;
  },
  unpack(v){
    if (typeof v === 'string' && v.startsWith('blobref:')) { const h = v.slice(8); if (this.blobCache[h]) return this.blobCache[h]; this.fetchBlob(h); return null; }
    if (Array.isArray(v)) return v.map(x => this.unpack(x));
    if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = this.unpack(v[k]); return o; }
    return v;
  },
  putBlob(h, data){
    if (this.blobCache[h] || !this.ready) { this.blobCache[h] = data; return; }
    this.blobCache[h] = data; this.saveBlobCache();
    const parts = Math.ceil(data.length / CHUNK), b = this.base();
    for (let i = 0; i < parts; i++) this.db.doc(`${b}/blobs/${h}_${i}`).set({ d:data.slice(i * CHUNK, (i + 1) * CHUNK) }).catch(() => {});
    this.db.doc(`${b}/blobs/${h}`).set({ parts }).catch(() => {});
  },
  async fetchBlob(h){
    if (this.blobWait[h]) return; this.blobWait[h] = true;
    try {
      const meta = await this.db.doc(`${this.base()}/blobs/${h}`).get(); if (!meta.exists) { this.blobWait[h] = false; return; }
      let data = ''; for (let i = 0; i < meta.data().parts; i++) { const p = await this.db.doc(`${this.base()}/blobs/${h}_${i}`).get(); data += p.data().d; }
      this.blobCache[h] = data; this.saveBlobCache();
      // 받은 값을 다시 풀어서 S에 넣는다
      for (const k of [...KID_KEYS, ...ADULT_KEYS]) if (this.last.s[k] && this.last.s[k].includes(h)) S[k] = this.unpack(JSON.parse(this.last.s[k]));
      for (const k of Object.keys(this.last.days)) if (this.last.days[k].includes(h)) S.days[k] = this.unpack(JSON.parse(this.last.days[k]));
      saveLocal(); refreshIfIdle();
    } catch (e) { this.blobWait[h] = false; }
  },
  saveBlobCache(){ try { const keys = Object.keys(this.blobCache); if (keys.length > 30) keys.slice(0, keys.length - 30).forEach(k => delete this.blobCache[k]); localStorage.setItem('jaeyun-blobs', JSON.stringify(this.blobCache)); } catch (e) {} },
  /* 가족방 만들기: 지금 이 기기 기록을 가족 기록으로 올린다 */
  async create(roleName){
    S.local = { fid:newFid(), role:roleName };
    saveLocal(); this.ready = false; await this.start();
    if (!this.ready) return false;
    [...KID_KEYS, ...ADULT_KEYS].forEach(k => this.last.s[k] = '');
    Object.keys(S.days).forEach(k => this.last.days[k] = '');
    const keep = S.local.role; S.local.role = 'all'; await this.push(); S.local.role = keep; saveLocal();
    await this.db.doc(`families/${S.local.fid}`).set({ created:Date.now() });
    return true;
  },
  async join(fid, roleName){
    const old = S.local; S.local = { fid, role:roleName }; saveLocal();
    if (!window.firebase || !window.FIREBASE_CONFIG) { this.status = 'nosdk'; return false; }
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    await firebase.auth().signInAnonymously();
    this.db = firebase.firestore();
    const fam = await this.db.doc(`families/${fid}`).get();
    if (!fam.exists) { S.local = old; saveLocal(); return false; }
    // 가족 기록을 받아서 이 기기를 맞춘다
    const st = await this.db.collection(`families/${fid}/s`).get();
    const fresh = freshState(); Object.assign(S, fresh, { local:S.local, notes:[], days:{} });
    st.docs.forEach(d => { S[d.id] = d.data().v; });
    const dy = await this.db.collection(`families/${fid}/days`).get(); dy.docs.forEach(d => { S.days[d.id] = d.data().v; });
    S.started = true;
    [...KID_KEYS, ...ADULT_KEYS].forEach(k => { if (S[k] !== undefined) S[k] = this.unpack(S[k]); });
    Object.keys(S.days).forEach(k => S.days[k] = this.unpack(S.days[k]));
    saveLocal(); this.ready = false; await this.start(); return true;
  },
  leave(){ this.unsub.forEach(f => { try { f(); } catch (e) {} }); this.unsub = []; this.ready = false; S.local = null; this.status = 'off'; saveLocal(); },
};
function familyLink(){ const base = location.href.split('#')[0].split('?')[0]; return `${base}#join=${S.local.fid}`; }
function refreshIfIdle(){
  if (['home','adult','map','gift','cal','room','alldone'].includes(SCREEN)) {
    const y = scrollY; const active = document.activeElement;
    if (active && /INPUT|TEXTAREA|SELECT/.test(active.tagName)) return;
    VIEWS[SCREEN](); scrollTo(0, y);
  }
}

/* ===================== 가족 연결 화면 ===================== */
let JOIN_FID = null;
VIEWS.join = (fid) => {
  if (fid) JOIN_FID = fid;
  app().innerHTML = `<section class="screen" style="justify-content:center;text-align:center;align-items:center">
    ${stageHTML(200, { expr:'wow', size:150, cls:'hop' })}
    <h1>재윤이 공부방 가족이 됐어요!</h1>
    <p class="muted">이 기기는 누가 쓰나요? 한 번만 고르면 돼요.</p>
    <div class="role-grid">
      <button class="role-btn" data-a="joinrole" data-v="kid"><span style="font-size:44px">🐰</span><b>재윤이</b><span class="muted">공부하는 태블릿</span></button>
      <button class="role-btn" data-a="joinrole" data-v="mom"><span style="font-size:44px">💗</span><b>엄마</b><span class="muted">채점 · 알림 시간</span></button>
      <button class="role-btn" data-a="joinrole" data-v="oppa"><span style="font-size:44px">🎁</span><b>오빠</b><span class="muted">칭찬 · 기록 · 선물</span></button>
    </div>
    ${S.started && !linked() ? `<p class="demo-note">이 기기에 있던 체험판 기록은 가족 기록으로 바뀌어요.</p>` : ''}
    <p class="muted" id="joinmsg"></p>
  </section>`;
};
function familyPanel(){
  if (!linked()) return `<div class="panel"><h3>가족 기기 연결</h3>
    <p class="muted" style="font-size:15px">재윤이 태블릿, 엄마 폰, 오빠 폰이 같은 기록을 쓰게 해요. 이 기기에서 가족방을 만들고, 나오는 링크를 카톡으로 보내서 다른 기기에서 열면 돼요.</p>
    ${window.firebase && window.FIREBASE_CONFIG ? `<div class="row" style="flex-wrap:wrap;gap:8px"><span class="muted" style="font-size:15px">이 기기는</span>
      <button class="btn small" data-a="famcreate" data-v="oppa">오빠 폰으로 만들기</button><button class="btn ghost small" data-a="famcreate" data-v="mom">엄마 폰으로</button><button class="btn ghost small" data-a="famcreate" data-v="kid">재윤이 태블릿으로</button></div>`
      : `<p class="demo-note">가족 연결은 진짜 주소(github.io)에서 열었을 때만 돼요. 지금 화면은 체험판이에요.</p>`}
    <p class="muted" id="fammsg"></p></div>`;
  const who = { kid:'재윤이 태블릿', mom:'엄마 폰', oppa:'오빠 폰', all:'공용' }[role()];
  const st = { on:'연결됨 ✓', connecting:'연결 중…', error:'연결 오류', nosdk:'서버를 못 불러왔어요', off:'꺼짐' }[Sync.status] || Sync.status;
  return `<div class="panel"><h3>가족 기기 연결</h3>
    <div class="row"><span class="grow" style="flex:1">이 기기: <b>${who}</b></span><span class="pill ${Sync.status === 'on' ? 'ok' : 'wait'}">${st}</span></div>
    ${Sync.status === 'error' ? `<p class="demo-note">${esc(Sync.error || '')}<br>Firebase 보안 규칙을 붙여넣었는지 확인해 주세요.</p>` : ''}
    <div class="field"><label for="famlink">가족 링크 (카톡으로 보내서 다른 기기에서 열기)</label><input type="text" id="famlink" readonly value="${esc(familyLink())}"></div>
    <div class="row" style="flex-wrap:wrap"><button class="btn small" data-a="famcopy">링크 복사</button><button class="btn ghost small" data-a="famrole">이 기기 역할 바꾸기</button></div>
    <p class="muted" style="font-size:13px">링크를 아는 사람은 기록을 볼 수 있으니 가족끼리만 나눠 주세요.</p>
  </div>`;
}
