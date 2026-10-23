/* ===================== 가족 연결 (Firebase) =====================
   - 한 가족 = families/{fid}. fid는 20자 이상 무작위 → 링크를 아는 가족만 들어올 수 있다.
   - S의 큰 칸(키)마다 문서 하나: families/{fid}/s/{key} = { v: 값 }
   - 날짜별 공부 기록: families/{fid}/days/{날짜} = { v: 그날 기록 }   (재윤이 기기만 씀)
   - 알림: families/{fid}/notes/{id}                                    (누구나 추가만)
   - 사진·녹음: families/{fid}/blobs/{해시}[_조각]                        (큰 파일은 조각내서)
   - 이 기기에만 남는 것: 역할, 가족 번호, 체험판 날짜, 탭 위치            */
const LOCAL_KEYS = ['local','dayOffset','adultTab','notes','days','v'];
const KID_KEYS = ['started','firstDay','stickers','equipped','seenItems','wrong','avgSec','dictUsed','curr','currs','lastLec','kidNotes','giftAch','reports','collect','friends'];
const ADULT_KEYS = ['alarms','level','mathMode','modes','ebsOn','pace','dictMode','eyeBreak','tts','bunnyName','pin','praise','voices','grades','gift','writeFb','mail'];
const BLOB_MIN = 4000, CHUNK = 700000;
function role(){ return (S.local && S.local.role) || 'all'; }
function linked(){ return !!(S.local && S.local.fid); }
function canWriteKid(){ return !linked() || role() === 'kid'; }
function newFid(){ const a = 'abcdefghijkmnpqrstuvwxyz23456789'; let s = ''; const r = new Uint8Array(22); (crypto || window.msCrypto).getRandomValues(r); r.forEach(x => s += a[x % a.length]); return s; }
function hashStr(str){ str = str == null ? "" : String(str); let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36) + str.length.toString(36); }

/* 공부 기록이 얼마나 있는지 (스티커 수 + 한 판이라도 끝낸 날 수) — 가족 연결할 때 어느 쪽 기록을 남길지 정한다 */
function studyScore(st){ const days = Object.values((st && st.days) || {}).filter(d => d && d.boards && Object.values(d.boards).some(b => b && b.done)).length; return ((st && st.stickers) || []).length + days; }
const SYNCED_KEY = 'jaeyun-synced';
const Sync = {
  db:null, ready:false, status:'off', last:{ s:{}, days:{} }, timer:null, blobCache:{}, blobWait:{}, unsub:[], applying:false,
  kid:null, kidDayAt:0, okAt:0, beatAt:0, sy:null, syT:null, retryT:null,
  base(){ return `families/${S.local.fid}`; },
  /* 서버가 받았다고 확인해 준 값의 지문: 앱을 껐다 켜도 남아서, 못 보낸 것만 다시 보낸다 */
  synced(){
    if (!this.sy || this.sy.fid !== (S.local && S.local.fid)) {
      let x = null; try { x = JSON.parse(localStorage.getItem(SYNCED_KEY) || 'null'); } catch (e) {}
      this.sy = x && x.fid === (S.local && S.local.fid) ? Object.assign({ s:{}, d:{}, b:{} }, x) : { fid:S.local && S.local.fid, s:{}, d:{}, b:{}, fresh:true };
    }
    return this.sy;
  },
  saveSynced(){ clearTimeout(this.syT); this.syT = setTimeout(() => { try { const x = Object.assign({}, this.sy); delete x.fresh; localStorage.setItem(SYNCED_KEY, JSON.stringify(x)); } catch (e) {} }, 800); },
  resetSynced(){ this.sy = { fid:S.local && S.local.fid, s:{}, d:{}, b:{}, fresh:true }; try { localStorage.removeItem(SYNCED_KEY); } catch (e) {} },
  async fs(){
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    await firebase.auth().signInAnonymously();
    if (!this.db) {
      this.db = firebase.firestore();
      // 인터넷이 끊겨도 보낼 기록을 기기에 쌓아 두었다가, 다시 연결되면 보낸다 (앱을 껐다 켜도 유지)
      if (this.db.enablePersistence) { try { await this.db.enablePersistence({ synchronizeTabs:true }); } catch (e) {} }
    }
    return this.db;
  },
  async start(){
    if (!linked() || this.ready) return;
    if (!window.firebase || !window.FIREBASE_CONFIG) { this.status = 'nosdk'; return; }
    try {
      this.status = 'connecting';
      await this.fs();
      // 사진·녹음 보관함은 메모리에만: 기록(S)에 이미 원본이 있으니 따로 저장하지 않는다 (예전 보관함은 지워서 저장 공간 확보)
      try { localStorage.removeItem('jaeyun-blobs'); } catch (e) {}
      // 기준점: 서버가 받았다고 확인한 값. 그 뒤에 이 기기에서 바뀐 것(인터넷 없을 때 공부한 것 포함)은 다시 보낸다.
      // 재윤이 태블릿은 확인 기록이 없으면 전부 한 번 보낸다 (재윤이 기록의 원본은 태블릿)
      const sy = this.synced(), kid = canWriteKid();
      [...KID_KEYS, ...ADULT_KEYS].forEach(k => { const raw = JSON.stringify(this.pack(S[k]));
        const mine = this.writable(k) && (!KID_KEYS.includes(k) || kid);
        this.last.s[k] = !mine ? raw : sy.s[k] === undefined ? (kid && KID_KEYS.includes(k) ? '' : raw) : sy.s[k] === hashStr(raw) ? raw : ''; });
      Object.keys(S.days).forEach(k => { const raw = JSON.stringify(this.pack(S.days[k])); this.last.days[k] = kid && sy.d[k] !== hashStr(raw) ? '' : raw; });
      this.listen();
      this.ready = true; this.status = 'on';
      // 태블릿: 아직 서버에 없는 사진(예전에 올리다 실패한 것)도 다시 올린다
      if (kid) Object.entries(this.blobCache).forEach(([h, d]) => this.putBlob(h, d));
      this.schedule(); this.beat();
    } catch (e) { this.status = 'error'; this.error = String(e && e.message || e); console.warn('sync', e); clearTimeout(this.retryT); this.retryT = setTimeout(() => this.start(), 30000); }
  },
  /* 내 역할이 쓸 수 있는 칸 */
  /* 엄마·오빠 폰에서 재윤이 화면으로 풀어 본 것은 미리보기라서 재윤이 기록(진도·스티커·오답)으로 보내지 않는다.
     엄마 메뉴에서 진도를 옮긴 것처럼 어른이 일부러 바꾼 칸만 보낸다 */
  touched:new Set(),
  writable(k){ if (linked() && role() !== 'kid' && KID_KEYS.includes(k)) return this.touched.has(k); return true; },
  touch(k){ if (linked() && role() !== 'kid' && this.last.s[k]) { try { S[k] = this.unpack(JSON.parse(this.last.s[k])); } catch (e) {} } this.touched.add(k); },
  listen(){
    const b = this.base();
    this.unsub.forEach(f => { try { f(); } catch (e) {} }); this.unsub = [];
    this.unsub.push(this.db.collection(`${b}/s`).onSnapshot(snap => this.onState(snap)));
    this.unsub.push(this.db.collection(`${b}/days`).onSnapshot(snap => this.onDays(snap)));
    this.unsub.push(this.db.collection(`${b}/notes`).orderBy('at', 'desc').limit(120).onSnapshot(snap => this.onNotes(snap)));
    // 재윤이 태블릿이 마지막으로 연결된 때 (엄마·오빠 폰에서 보여 줌)
    try { this.unsub.push(this.db.doc(`${b}/meta/kid`).onSnapshot(d => { const k = d && d.exists ? d.data() : null; if (JSON.stringify(k) !== JSON.stringify(this.kid)) { this.kid = k; if (SCREEN === 'adult') refreshIfIdle(); } })); } catch (e) {}
  },
  onState(snap){
    let changed = false; const sy = this.synced();
    snap.docs.forEach(d => { const k = d.id, raw = JSON.stringify(d.data().v);
      if (LOCAL_KEYS.includes(k)) return;
      const dirty = JSON.stringify(this.pack(S[k])) !== this.last.s[k];
      if (raw === this.last.s[k]) { sy.s[k] = hashStr(raw); return; }   // 내가 쓴 것이 돌아온 것
      if (dirty && this.writable(k) && (!KID_KEYS.includes(k) || canWriteKid())) return;   // 아직 못 보낸 내 변경이 우선 (곧 덮어씀)
      this.last.s[k] = raw; sy.s[k] = hashStr(raw); S[k] = this.unpack(d.data().v); changed = true; });
    this.saveSynced();
    if (changed) this.afterRemote();
  },
  onDays(snap){
    let changed = false; const sy = this.synced();
    snap.docs.forEach(d => { const k = d.id, data = d.data(), raw = JSON.stringify(data.v);
      if (data.at > this.kidDayAt) this.kidDayAt = data.at;
      if (raw === this.last.days[k]) { sy.d[k] = hashStr(raw); return; }
      const dirty = S.days[k] && JSON.stringify(this.pack(S.days[k])) !== this.last.days[k];
      if (dirty && canWriteKid()) return;
      this.last.days[k] = raw; sy.d[k] = hashStr(raw); S.days[k] = this.unpack(data.v); changed = true; });
    this.saveSynced();
    if (changed) this.afterRemote();
  },
  onNotes(snap){
    const ids = new Set(S.notes.map(n => n.id)); let changed = false;
    snap.docs.forEach(d => { const n = d.data(); if (!ids.has(d.id)) { S.notes.push(Object.assign({ id:d.id }, n)); changed = true; } });
    if (changed) { S.notes.sort((a, b) => b.at - a.at); trimNotes(); this.afterRemote(); }
  },
  afterRemote(){
    this.applying = true;
    if (applyGrades() | applyWriteFb()) this.schedule();
    saveLocal();
    this.applying = false;
    refreshIfIdle();
  },
  schedule(){ if (!this.ready) return; clearTimeout(this.timer); this.timer = setTimeout(() => this.push(), 700); },
  /* 보내기: 실패하면 "보낸 것"으로 치지 않고 20초 뒤 다시 보낸다 */
  async push(){
    if (!this.ready) return;
    clearTimeout(this.timer);
    const b = this.base(), jobs = [], sy = this.synced();
    // Firestore는 잘못된 값이면 set()에서 바로 던진다 → 한 문서가 던져도 나머지는 보내고, 못 보낸 건 "보낸 것"으로 치지 않는다
    const job = (ref, data, raw, getLast, setLast, mark) => { const prev = getLast(); setLast(raw);
      jobs.push(Promise.resolve().then(() => ref.set(data)).then(() => { mark(); this.saveSynced(); }, e => { if (getLast() === raw) setLast(prev); console.warn('sync', ref.path, e); throw e; })); };
    for (const k of [...KID_KEYS, ...ADULT_KEYS]) {
      if (!this.writable(k)) continue;
      const v = this.pack(S[k]), raw = JSON.stringify(v);
      if (raw === this.last.s[k] || v === undefined) continue;
      this.touched.delete(k);
      job(this.db.doc(`${b}/s/${k}`), { v, at:Date.now(), by:role() }, raw, () => this.last.s[k], x => this.last.s[k] = x, () => sy.s[k] = hashStr(raw));
    }
    if (canWriteKid()) for (const k of Object.keys(S.days)) {
      const v = this.pack(S.days[k]), raw = JSON.stringify(v);
      if (raw === this.last.days[k]) continue;
      job(this.db.doc(`${b}/days/${k}`), { v, at:Date.now() }, raw, () => this.last.days[k], x => this.last.days[k] = x, () => sy.d[k] = hashStr(raw));
    }
    if (jobs.length) this.beat();
    const res = await Promise.allSettled(jobs), bad = res.find(r => r.status === 'rejected');
    if (!bad) { if (jobs.length) { this.status = 'on'; this.error = ''; this.okAt = Date.now(); if (this.beatErr) this.beat(true); } }
    else { this.status = 'error'; this.error = String(bad.reason && bad.reason.message || bad.reason); if (res.some(r => r.status === 'fulfilled')) this.okAt = Date.now(); clearTimeout(this.retryT); this.retryT = setTimeout(() => this.push(), 20000); if (this.beatErr !== this.error.slice(0, 160)) this.beat(true); }
  },
  /* 재윤이 태블릿: "나 연결됐어요" 표시 (1분에 한 번까지) */
  beat(force){
    if (!this.ready || role() !== 'kid') return;
    const t = Date.now(); if (!force && t - this.beatAt < 60000) return; this.beatAt = t;
    // 보내기 실패 중이면 그 이유도 같이 (엄마·오빠 폰 맨 위에 보여 줌)
    const err = this.status === 'error' ? String(this.error || '').slice(0, 160) : ''; this.beatErr = err;
    this.db.doc(`${this.base()}/meta/kid`).set({ at:t, stickers:S.stickers.length, days:Object.keys(S.days).length, err, okAt:this.okAt || 0 }).catch(() => { this.beatAt = 0; });
  },
  kidSeenAt(){ return Math.max((this.kid && this.kid.at) || 0, this.kidDayAt || 0); },
  addNote(n){ if (!this.ready) return; n.id = n.id || ('n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)); this.db.doc(`${this.base()}/notes/${n.id}`).set({ to:n.to, text:n.text, at:n.at, d:n.d }).catch(() => {}); },
  /* 큰 데이터(사진·녹음)를 blobs로 빼고 짧은 표시로 바꾼다 */
  pack(v){
    if (typeof v === 'string') { if (v.startsWith('data:') && v.length > BLOB_MIN) { const h = hashStr(v); this.putBlob(h, v); return 'blobref:' + h; } return v; }
    // Firestore는 배열 안의 배열과 undefined를 못 받는다 → 안쪽 배열은 {_arr:[…]}로 싸고, 빈 칸은 null로
    if (Array.isArray(v)) return Array.from(v, x => { const p = this.pack(x); return p === undefined ? null : Array.isArray(p) ? { _arr:p } : p; });
    if (v && typeof v === 'object') { const o = {}; for (const k in v) { const p = this.pack(v[k]); if (p !== undefined && typeof p !== 'function') o[k] = p; } return o; }
    if (typeof v === 'function') return undefined;
    return v;
  },
  unpack(v){
    if (typeof v === 'string' && v.startsWith('blobref:')) { const h = v.slice(8); if (this.blobCache[h]) return this.blobCache[h]; this.fetchBlob(h); return null; }
    if (Array.isArray(v)) return v.map(x => x && typeof x === 'object' && !Array.isArray(x) && Array.isArray(x._arr) && Object.keys(x).length === 1 ? this.unpack(x._arr) : this.unpack(x));
    if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = this.unpack(v[k]); return o; }
    return v;
  },
  /* 사진·녹음 올리기: 연결 전에 생긴 것도 연결되면 올린다 (올린 것은 기억해 두고 다시 안 올림) */
  putBlob(h, data){
    if (!this.blobCache[h]) { this.blobCache[h] = data; this.saveBlobCache(); }
    if (!this.ready || !linked()) return;
    const sy = this.synced(); if (sy.b[h] || (this.upping || (this.upping = {}))[h]) return;
    this.upping[h] = true;
    const parts = Math.ceil(data.length / CHUNK), b = this.base(), w = [];
    for (let i = 0; i < parts; i++) w.push(this.db.doc(`${b}/blobs/${h}_${i}`).set({ d:data.slice(i * CHUNK, (i + 1) * CHUNK) }));
    Promise.all(w).then(() => this.db.doc(`${b}/blobs/${h}`).set({ parts })).then(() => { sy.b[h] = 1; this.saveSynced(); }, () => {}).finally(() => { this.upping[h] = false; });
  },
  async fetchBlob(h){
    if (this.blobWait[h]) return; this.blobWait[h] = true;
    try {
      const meta = await this.db.doc(`${this.base()}/blobs/${h}`).get(); if (!meta.exists) { this.blobWait[h] = false; return; }
      let data = ''; for (let i = 0; i < meta.data().parts; i++) { const p = await this.db.doc(`${this.base()}/blobs/${h}_${i}`).get(); data += p.data().d; }
      this.blobCache[h] = data; this.synced().b[h] = 1; this.saveSynced(); this.saveBlobCache();
      // 받은 값을 다시 풀어서 S에 넣는다
      for (const k of [...KID_KEYS, ...ADULT_KEYS]) if (this.last.s[k] && this.last.s[k].includes(h)) S[k] = this.unpack(JSON.parse(this.last.s[k]));
      for (const k of Object.keys(this.last.days)) if (this.last.days[k].includes(h)) S.days[k] = this.unpack(JSON.parse(this.last.days[k]));
      saveLocal(); refreshIfIdle();
    } catch (e) { this.blobWait[h] = false; }
  },
  saveBlobCache(){ const keys = Object.keys(this.blobCache); if (keys.length > 60) keys.slice(0, keys.length - 60).forEach(k => delete this.blobCache[k]); },
  /* 가족방 만들기: 지금 이 기기 기록을 가족 기록으로 올린다 */
  async create(roleName){
    S.local = { fid:newFid(), role:roleName };
    saveLocal(); this.resetSynced(); this.ready = false; await this.start();
    if (!this.ready) return false;
    [...KID_KEYS, ...ADULT_KEYS].forEach(k => this.last.s[k] = '');
    Object.keys(S.days).forEach(k => this.last.days[k] = '');
    const keep = S.local.role; S.local.role = 'all'; await this.push(); S.local.role = keep; saveLocal();
    await this.db.doc(`families/${S.local.fid}`).set({ created:Date.now() });
    return true;
  },
  /* 가족방 들어가기.
     재윤이 기기로 들어갈 때 이 기기에 공부 기록이 더 많으면(연결 안 된 채로 공부한 태블릿) 이 기기 기록을 남기고 가족 기록으로 올린다.
     그 밖에는 가족 기록을 받아 이 기기를 맞춘다. 어느 경우든 들어가기 전 기록은 백업해 둔다 */
  async join(fid, roleName){
    const old = S.local;
    if (!window.firebase || !window.FIREBASE_CONFIG) { this.status = 'nosdk'; return false; }
    if (S.started) { try { const bk = Object.assign({}, S, { days:{} }); Object.keys(S.days).forEach(k => { const d = Object.assign({}, S.days[k]); if (d.dict) d.dict = Object.assign({}, d.dict, { photo:null }); bk.days[k] = d; }); localStorage.setItem('jaeyun-backup', JSON.stringify({ at:Date.now(), S:bk })); } catch (e) {} }
    const mine = { kid:Object.fromEntries(KID_KEYS.map(k => [k, S[k]])), days:S.days, score:S.started ? studyScore(S) : 0 };
    this.unsub.forEach(f => { try { f(); } catch (e) {} }); this.unsub = []; this.ready = false;
    S.local = { fid, role:roleName }; saveLocal();
    await this.fs();
    const fam = await this.db.doc(`families/${fid}`).get();
    if (!fam.exists) { S.local = old; saveLocal(); return false; }
    // 가족 기록을 받는다
    const st = await this.db.collection(`families/${fid}/s`).get();
    const fresh = freshState(); Object.assign(S, fresh, { local:S.local, notes:[], days:{} });
    st.docs.forEach(d => { S[d.id] = d.data().v; });
    const dy = await this.db.collection(`families/${fid}/days`).get(); dy.docs.forEach(d => { S.days[d.id] = d.data().v; });
    S.started = true;
    [...KID_KEYS, ...ADULT_KEYS].forEach(k => { if (S[k] !== undefined) S[k] = this.unpack(S[k]); });
    Object.keys(S.days).forEach(k => S.days[k] = this.unpack(S.days[k]));
    this.resetSynced();
    this.kept = 0;
    if (roleName === 'kid' && mine.score > studyScore(S)) {
      // 이 기기(태블릿)의 재윤이 기록이 더 많다 → 그대로 남기고 가족 기록으로 올린다
      KID_KEYS.forEach(k => { if (mine.kid[k] !== undefined) S[k] = mine.kid[k]; });
      Object.entries(mine.days).forEach(([k, d]) => { const f = S.days[k]; const doneN = x => x && x.boards ? Object.values(x.boards).filter(b => b && b.done).length : 0; if (!f || doneN(d) >= doneN(f)) S.days[k] = d; });
      this.kept = mine.score;
    } else {
      // 받은 값이 곧 서버 값
      const sy = this.synced();
      [...KID_KEYS, ...ADULT_KEYS].forEach(k => sy.s[k] = hashStr(JSON.stringify(this.pack(S[k]))));
      Object.keys(S.days).forEach(k => sy.d[k] = hashStr(JSON.stringify(this.pack(S.days[k]))));
      delete sy.fresh; this.saveSynced();
    }
    saveLocal(); await this.start(); if (roleName === 'kid') this.beat(true);
    return true;
  },
  leave(){ this.unsub.forEach(f => { try { f(); } catch (e) {} }); this.unsub = []; this.ready = false; S.local = null; this.status = 'off'; saveLocal(); },
};
/* 인터넷이 다시 되거나, 앱을 다시 볼 때 · 끌 때 바로 보낸다 */
window.addEventListener('online', () => { if (!Sync.ready) Sync.start(); else Sync.push(); });
document.addEventListener('visibilitychange', () => { if (!linked()) return; if (!Sync.ready) { if (!document.hidden) Sync.start(); return; } Sync.push(); if (!document.hidden) Sync.beat(); });
function familyLink(){ const base = location.href.split('#')[0].split('?')[0]; return `${base}#join=${S.local.fid}`; }
function refreshIfIdle(){
  if (['home','adult','map','gift','cal','room','alldone','book','study'].includes(SCREEN)) {
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
    ${S.started && studyScore(S) > 0 ? `<p class="demo-note">이 기기에 재윤이 공부 기록(스티커 ${S.stickers.length}개)이 있어요. 재윤이 태블릿이면 <b>재윤이</b>를 골라 주세요. 기록은 지워지지 않고 가족 기록으로 올라가요.</p>` : ''}
    <p class="muted" id="joinmsg"></p>
  </section>`;
};
function familyPanel(){
  if (!linked()) return `<div class="panel"><h3>가족 기기 연결</h3>
    <p class="muted" style="font-size:15px">재윤이 태블릿, 엄마 폰, 오빠 폰이 같은 기록을 쓰게 해요. 이 기기에서 가족방을 만들고, 나오는 링크를 카톡으로 보내서 다른 기기에서 열면 돼요.</p>
    ${window.firebase && window.FIREBASE_CONFIG ? `<div class="row" style="flex-wrap:wrap;gap:8px"><span class="muted" style="font-size:15px">이 기기는</span>
      <button class="btn small" data-a="famcreate" data-v="oppa">오빠 폰으로 만들기</button><button class="btn ghost small" data-a="famcreate" data-v="mom">엄마 폰으로</button><button class="btn ghost small" data-a="famcreate" data-v="kid">재윤이 태블릿으로</button></div>`
      : `<p class="demo-note">가족 연결은 진짜 주소(github.io)에서 열었을 때만 돼요. 지금 화면은 체험판이에요.</p>`}
    ${window.firebase && window.FIREBASE_CONFIG ? `<div class="field" style="margin-top:6px"><label for="joinpaste">이미 가족방이 있으면: 가족 링크를 붙여넣고 연결</label><input type="text" id="joinpaste" placeholder="https://…#join=…" autocomplete="off"></div><button class="btn small" data-a="joinpaste" style="justify-self:start">이 링크로 연결하기</button>` : ''}
    <p class="muted" id="fammsg"></p></div>`;
  const who = { kid:'재윤이 태블릿', mom:'엄마 폰', oppa:'오빠 폰', all:'공용' }[role()];
  const st = { on:'연결됨 ✓', connecting:'연결 중…', error:'연결 오류', nosdk:'서버를 못 불러왔어요', off:'꺼짐' }[Sync.status] || Sync.status;
  return `<div class="panel"><h3>가족 기기 연결</h3>
    <div class="row"><span class="grow" style="flex:1">이 기기: <b>${who}</b></span><span class="pill ${Sync.status === 'on' ? 'ok' : 'wait'}">${st}</span></div>
    ${Sync.status === 'error' ? `<p class="demo-note">${esc(Sync.error || '')}<br>인터넷이 되면 저절로 다시 보내요. 계속 이러면 Firebase 보안 규칙을 확인해 주세요.</p>` : ''}
    ${role() === 'kid' ? `<p class="muted" style="font-size:14px">${Sync.okAt ? `마지막으로 보낸 때: ${agoText(Sync.okAt)}` : '이 기기 기록을 가족에게 보내는 중이에요'}</p>` : `<p class="muted" style="font-size:14px">${Sync.kidSeenAt() ? `재윤이 태블릿 마지막 연결: ${agoText(Sync.kidSeenAt())}` : '재윤이 태블릿에서 아직 기록이 오지 않았어요'}</p>`}
    <div class="field"><label for="famlink">가족 링크 (카톡으로 보내서 다른 기기에서 열기)</label><input type="text" id="famlink" readonly value="${esc(familyLink())}"></div>
    <div class="row" style="flex-wrap:wrap"><button class="btn small" data-a="famcopy">링크 복사</button><button class="btn ghost small" data-a="famrole">이 기기 역할 바꾸기</button></div>
    <p class="muted" style="font-size:13px">링크를 아는 사람은 기록을 볼 수 있으니 가족끼리만 나눠 주세요.</p>
  </div>`;
}

function agoText(t){
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 2) return '방금'; if (m < 60) return `${m}분 전`;
  const d = new Date(t), today = todayKey(), dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hm = `${d.getHours() < 12 ? '오전' : '오후'} ${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (dk === today) return `오늘 ${hm}`; if (dk === addDays(today, -1)) return `어제 ${hm}`;
  return `${Math.max(2, Math.round((Date.now() - t) / 86400000))}일 전 (${d.getMonth() + 1}/${d.getDate()})`;
}
/* 엄마·오빠 메뉴 맨 위: 기록이 가족에게 안 가고 있으면 알려 준다 */
function syncAlert(){
  const box = (html, tone = 'warn') => `<div class="sync-alert ${tone}">${html}</div>`;
  const sc = S.started ? studyScore(S) : 0;
  if (!linked()) {
    if (!sc || !(window.firebase && window.FIREBASE_CONFIG)) return '';
    return box(`<b>⚠️ 이 기기는 아직 가족과 연결되지 않았어요</b><br>이 기기에서 공부한 기록(스티커 ${S.stickers.length}개)이 엄마·오빠 폰으로 가지 않고 이 기기에만 있어요.<br>재윤이 태블릿이라면: 오빠 폰 <b>설정 → 가족 링크</b>를 이 기기에서 열거나 아래 <b>설정</b> 탭에 붙여넣고 <b>"재윤이"</b>를 고르세요. 이 기기 기록이 그대로 가족 기록으로 올라가요.`);
  }
  if (role() === 'kid') {
    if (Sync.status === 'error') return box(`<b>⚠️ 기록을 보내지 못하고 있어요</b><br>${esc(Sync.error || '')}<br>인터넷이 되면 저절로 다시 보내요.`);
    return '';
  }
  // 엄마 · 오빠 폰
  let remoteSt = 0; try { remoteSt = (JSON.parse(Sync.last.s.stickers || '[]') || []).length; } catch (e) {}
  if (Sync.ready && S.stickers.length >= remoteSt + 3) return box(`<b>⚠️ 이 기기는 "${role() === 'mom' ? '엄마' : '오빠'} 폰"으로 연결돼 있어요</b><br>그런데 여기서 공부한 기록(스티커 ${S.stickers.length}개)이 있어요. 엄마·오빠 폰에서 푼 건 미리보기라 재윤이 기록에 안 들어가요.<br>재윤이 태블릿이라면 <b>설정 → 이 기기 역할 바꾸기 → 재윤이</b>를 눌러 주세요. 이 기기 기록이 그대로 올라가요.`);
  if (!Sync.ready) return '';
  const seen = Sync.kidSeenAt(), kid = Sync.kid || {};
  if (kid.err && Date.now() - (kid.at || 0) < 2 * 86400000) return box(`<b>⚠️ 재윤이 태블릿이 공부 기록을 보내지 못하고 있어요</b><br>태블릿 마지막 연결: ${agoText(kid.at)}${kid.okAt ? ` · 마지막으로 보낸 때: ${agoText(kid.okAt)}` : ''}<br><span class="muted" style="font-size:13px">${esc(kid.err)}</span><br>이 화면을 오빠에게 캡처해서 보내 주세요.`);
  const have = Object.keys(S.days).length;
  if (kid.days && kid.days > have + 1 && Date.now() - (kid.at || 0) < 2 * 86400000) return box(`<b>재윤이 태블릿 기록을 받는 중이에요</b> (태블릿 ${kid.days}일 · 이 폰 ${have}일)<br>태블릿 마지막 연결: ${agoText(kid.at)}. 몇 분 지나도 그대로면 오빠에게 알려 주세요.`, 'soft');
  if (!seen) return box(`<b>재윤이 태블릿에서 아직 기록이 한 번도 오지 않았어요</b><br>태블릿에서 <b>엄마·오빠 메뉴 → 설정 → 가족 기기 연결</b>을 확인해 주세요. "이 기기: 재윤이 태블릿 · 연결됨"이어야 해요. 아니면 가족 링크를 태블릿에서 열고 "재윤이"를 고르세요 (태블릿 기록은 지워지지 않고 올라가요).`);
  if (Date.now() - seen > 2 * 86400000) return box(`재윤이 태블릿 마지막 연결: <b>${agoText(seen)}</b><br>태블릿이 인터넷에 연결돼 있는지 확인해 주세요.`, 'soft');
  return box(`재윤이 태블릿 마지막 연결: ${agoText(seen)} ✓`, 'ok');
}
