/* ===================== 가족 연결 (Firebase) =====================
   - 한 가족 = families/{fid}. fid는 20자 이상 무작위 → 링크를 아는 가족만 들어올 수 있다.
   - S의 큰 칸(키)마다 문서 하나: families/{fid}/s/{key} = { v: 값 }
   - 날짜별 공부 기록: families/{fid}/days/{날짜} = { v: 그날 기록 }   (재윤이 기기만 씀)
   - 알림: families/{fid}/notes/{id}                                    (누구나 추가만)
   - 사진·녹음: families/{fid}/blobs/{해시}[_조각]                        (큰 파일은 조각내서)
   - 이 기기에만 남는 것: 역할, 가족 번호, 체험판 날짜, 탭 위치            */
const LOCAL_KEYS = ['local','dayOffset','adultTab','notes','days','v'];
const KID_KEYS = ['started','firstDay','stickers','equipped','seenItems','wrong','avgSec','dictUsed','curr','currs','lastLec','kidNotes','giftAch','reports','collect','friends'];
const ADULT_KEYS = ['alarms','level','mathMode','modes','ebsOn','pace','dictMode','eyeBreak','tts','bunnyName','pin','praise','voices','grades','gift','writeFb','mail','ebsLinks','dayGoal','fcmKey','ntfyOff','ebsPlayer','ebsMode','ebsIntent'];
const BLOB_MIN = 4000, CHUNK = 700000;
function role(){ return (S.local && S.local.role) || 'all'; }
function linked(){ return !!(S.local && S.local.fid); }
function canWriteKid(){ return !linked() || role() === 'kid'; }
function newFid(){ const a = 'abcdefghijkmnpqrstuvwxyz23456789'; let s = ''; const r = new Uint8Array(22); (crypto || window.msCrypto).getRandomValues(r); r.forEach(x => s += a[x % a.length]); return s; }
function hashStr(str){ str = str == null ? "" : String(str); let h1 = 0xdeadbeef, h2 = 0x41c6ce57; for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36) + str.length.toString(36); }

/* 공부 기록이 얼마나 있는지 (스티커 수 + 한 판이라도 끝낸 날 수) — 가족 연결할 때 어느 쪽 기록을 남길지 정한다 */
function studyScore(st){ const days = Object.values((st && st.days) || {}).filter(d => d && d.boards && Object.values(d.boards).some(b => b && b.done)).length; return ((st && st.stickers) || []).length + days; }
/* 2026-10-29: 'jaeyun-synced2'로 바꿈. 예전 지문은 서버가 받기 전(기기 안 대기 중)에도 "받았음"으로 찍혀서,
   보내기가 멈춘 동안의 기록이 앱을 다시 켜도 안 갔다 → 새 버전은 태블릿이 전부 한 번 다시 보낸다 */
const SYNCED_KEY = 'jaeyun-synced2';
try { localStorage.removeItem('jaeyun-synced'); } catch (e) {}
/* ---------- 서버에 직접 보내기 (Firestore REST) ----------
   2026-10-24~29 사고: 태블릿은 와이파이가 되는데 서버에 5일 동안 아무것도 안 갔다(연결 표시조차).
   Firebase SDK의 보내기 줄은 막혀도 오류 없이 기다리기만 해서, 앱도 우리도 몰랐다.
   → 쓰기는 HTTPS로 직접 보낸다(되거나 오류가 나거나 둘 중 하나). 안 되면 SDK로 한 번 더. 받기(엄마·오빠 폰 화면)는 그대로 SDK */
function fsVal(v){
  if (v === null || v === undefined) return { nullValue:null };
  if (typeof v === 'boolean') return { booleanValue:v };
  if (typeof v === 'number') return Number.isSafeInteger(v) ? { integerValue:String(v) } : { doubleValue: Number.isFinite(v) ? v : String(v) };
  if (typeof v === 'string') return { stringValue:v };
  if (Array.isArray(v)) return { arrayValue: v.length ? { values:v.map(fsVal) } : {} };
  return { mapValue:{ fields:fsFields(v) } };
}
function fsFields(o){ const f = {}; for (const k in o) if (o[k] !== undefined && typeof o[k] !== 'function') f[k] = fsVal(o[k]); return f; }
const SEND_WAIT = 40000;
/* ---------- 역할이 잘못된 기기 찾기 (2026-10-29 사고: 재윤이 태블릿이 "오빠 폰"으로 연결돼 5일 동안 공부가 미리보기로만 남음) ---------- */
const BOARD_SCREENS = ['intro','q','cards','write','dict','photo','reward','lecwait','leccheck','eyebreak'];
function devId(){ try { let d = localStorage.getItem('jaeyun-dev'); if (!d) { d = 'd' + Math.random().toString(36).slice(2, 10); localStorage.setItem('jaeyun-dev', d); } return d; } catch (e) { return 'dx'; } }
function isTabletDev(){ return window.__forceTablet || Math.min(screen.width, screen.height) >= 600; }
/* 최근 3일 동안 이 기기에서 판을 끝낸 날 수 */
function localStudyDays(n = 3){ let c = 0; for (let i = 0; i < n; i++) { const d = S.days[addDays(todayKey(), -i)]; if (d && d.boards && Object.values(d.boards).some(b => b && b.done)) c++; } return c; }
/* 엄마·오빠 역할인데 태블릿에서 재윤이가 실제로 공부하고 있는 것 같은 기기 */
function wrongRoleTablet(){ return linked() && role() !== 'kid' && isTabletDev() && S.started && localStudyDays() > 0; }
const Sync = {
  db:null, ready:false, status:'off', last:{ s:{}, days:{} }, timer:null, blobCache:{}, blobWait:{}, unsub:[], applying:false,
  kid:null, devs:{}, devAt:0, kidDayAt:0, okAt:0, beatAt:0, sy:null, syT:null, retryT:null,
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
    // 전에 로그인한 기기는 인터넷이 없어도 그 로그인을 그대로 쓴다 (처음 한 번만 인터넷으로 로그인)
    const auth = firebase.auth();
    if (!auth.currentUser && auth.onAuthStateChanged) await new Promise(res => { const off = auth.onAuthStateChanged(() => { try { off(); } catch (e) {} res(); }); setTimeout(res, 3000); });
    if (!auth.currentUser) await auth.signInAnonymously();
    // 2026-10-29: 기기 안 저장(enablePersistence)은 끔. 못 보낸 기록은 우리 지문(jaeyun-synced2)이 기억했다가 다시 보낸다.
    // 켜 두면 SDK가 보낼 것을 IndexedDB에 쌓아 두고 조용히 멈출 수 있어서, 확인할 수 없는 단계를 하나 줄였다
    if (!this.db) this.db = firebase.firestore();
    return this.db;
  },
  /* 문서 하나 쓰기: ① HTTPS(REST)로 직접 → ② 안 되면 SDK (40초 기다림). 둘 다 안 되면 오류(다음에 다시 보냄) */
  via:'', sendErr:'', failSince:0, sdkWait:{},
  async rest(path, data){
    const u = firebase.auth().currentUser; if (!u || !u.getIdToken) throw new Error('로그인 전');
    // Firebase 웹 SDK(Lite)가 쓰는 것과 같은 방식: documents:commit 에 update(updateMask 없음 = 문서 통째로 바꾸기 = set)
    const db = `projects/${FIREBASE_CONFIG.projectId}/databases/(default)`, url = `https://firestore.googleapis.com/v1/${db}/documents:commit`;
    const body = JSON.stringify({ writes:[{ update:{ name:`${db}/documents/${path}`, fields:fsFields(data) } }] });
    const go = async fresh => { const tok = await u.getIdToken(fresh);
      return fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer ' + tok }, body }); };
    let r = await go(false); if (r.status === 401 || r.status === 403) r = await go(true);
    if (!r.ok) { let t = ''; try { t = (await r.text()).replace(/\s+/g, ' ').slice(0, 140); } catch (e) {} throw new Error(`서버 ${r.status} ${t}`); }
  },
  sdkSet(path, data){
    if (this.sdkWait[path]) return Promise.reject(new Error('SDK 기다리는 중'));   // 멈춘 SDK에 같은 문서를 계속 쌓지 않는다
    this.sdkWait[path] = true; let to;
    const p = Promise.resolve().then(() => this.db.doc(path).set(data)), wait = window.__sendWait || SEND_WAIT;
    p.then(() => { this.sdkWait[path] = false; }, () => { this.sdkWait[path] = false; });
    return Promise.race([p, new Promise((_, rej) => { to = setTimeout(() => rej(new Error('SDK 답 없음')), wait); })]).finally(() => clearTimeout(to));
  },
  async write(path, data){
    try { await this.rest(path, data); this.via = 'rest'; }
    catch (e1) {
      try { await this.sdkSet(path, data); this.via = 'sdk'; }
      catch (e2) { throw new Error(`${String(e1 && e1.message || e1).slice(0, 150)} | ${String(e2 && e2.message || e2).slice(0, 60)}`); }
    }
  },
  sentOk(){ this.okAt = Date.now(); this.failSince = 0; this.sendErr = ''; },
  sentBad(e){ this.sendErr = String(e && e.message || e).slice(0, 200); if (!this.failSince) this.failSince = Date.now(); this.warnOppa(); },
  /* 30분 넘게 못 보내면 오빠 폰(ntfy, 다른 길)으로 한 번 알린다 (6시간에 한 번까지) */
  warnOppa(){
    if (role() !== 'kid' || !this.failSince || Date.now() - this.failSince < 30 * 60000 || navigator.onLine === false || typeof Ntfy === 'undefined') return;
    let last = 0; try { last = +localStorage.getItem('jaeyun-syncwarn') || 0; } catch (e) {}
    if (Date.now() - last < 6 * 3600000) return;
    try { localStorage.setItem('jaeyun-syncwarn', String(Date.now())); } catch (e) {}
    try { Ntfy.send({ to:'oppa', text:`⚠️ 재윤이 태블릿이 공부 기록을 엄마·오빠 폰으로 못 보내고 있어요 (${agoText(this.failSince)}부터). 이유: ${this.sendErr}`, at:Date.now() }); } catch (e) {}
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
      this.schedule(); this.beat(); this.devBeat(true); this.flushNotes();
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
    this.unsub.push(this.db.collection(`${b}/s`).onSnapshot({ includeMetadataChanges:true }, snap => this.onState(snap)));
    this.unsub.push(this.db.collection(`${b}/days`).onSnapshot({ includeMetadataChanges:true }, snap => this.onDays(snap)));
    this.unsub.push(this.db.collection(`${b}/notes`).orderBy('at', 'desc').limit(120).onSnapshot(snap => this.onNotes(snap)));
    // 재윤이 태블릿이 마지막으로 연결된 때 (엄마·오빠 폰에서 보여 줌)
    // 기기들 상태(meta/dev-…): 엄마·오빠 역할로 연결된 태블릿에서 재윤이가 공부하고 있으면 폰에서 알려 준다
    try { this.unsub.push(this.db.collection(`${b}/meta`).onSnapshot(snap => { const devs = {}; let k = null;
      snap.docs.forEach(d => { if (d.id === 'kid') k = d.data(); else if (d.id.startsWith('dev-')) devs[d.id.slice(4)] = d.data(); });
      if (JSON.stringify([k, devs]) !== JSON.stringify([this.kid, this.devs])) { this.kid = k; this.devs = devs; if (SCREEN === 'adult') refreshIfIdle(); } })); } catch (e) {}
  },
  onState(snap){
    let changed = false; const sy = this.synced();
    snap.docs.forEach(d => { const k = d.id, raw = JSON.stringify(d.data().v);
      if (LOCAL_KEYS.includes(k)) return;
      const dirty = JSON.stringify(this.pack(S[k])) !== this.last.s[k];
      // 내가 쓴 것이 돌아온 것: 서버가 받은 것일 때만 "보냄"으로 친다 (기기 안에서 기다리는 것은 hasPendingWrites)
      if (raw === this.last.s[k]) { if (!(d.metadata && d.metadata.hasPendingWrites)) sy.s[k] = hashStr(raw); return; }
      if (dirty && this.writable(k) && (!KID_KEYS.includes(k) || canWriteKid())) return;   // 아직 못 보낸 내 변경이 우선 (곧 덮어씀)
      // 엄마·오빠 역할로 잘못 연결된 태블릿: 재윤이 진도·스티커를 서버의 예전 값으로 되돌리지 않는다 ("재윤이 태블릿으로 바꾸기"를 누르면 그대로 올라감)
      if (KID_KEYS.includes(k) && wrongRoleTablet()) return;
      this.last.s[k] = raw; sy.s[k] = hashStr(raw); S[k] = this.unpack(d.data().v); changed = true; });
    this.saveSynced();
    if (changed) this.afterRemote();
  },
  onDays(snap){
    let changed = false; const sy = this.synced();
    snap.docs.forEach(d => { const k = d.id, data = d.data(), raw = JSON.stringify(data.v);
      if (data.at > this.kidDayAt && !(d.metadata && d.metadata.hasPendingWrites)) this.kidDayAt = data.at;
      if (raw === this.last.days[k]) { if (!(d.metadata && d.metadata.hasPendingWrites)) sy.d[k] = hashStr(raw); return; }
      const dirty = S.days[k] && JSON.stringify(this.pack(S.days[k])) !== this.last.days[k];
      if (dirty && canWriteKid()) return;
      // 엄마·오빠 역할 기기에서 판을 푸는 중이면 그날 기록을 서버 것으로 바꾸지 않는다.
      // (10/29: 오빠로 잘못 연결된 태블릿에서 푸는 도중 서버의 예전 기록이 덮어써서 판이 사라지고 오류가 났음)
      if (S.days[k] && (wrongRoleTablet() || (k === todayKey() && BOARD_SCREENS.includes(SCREEN)))) return;
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
    if (navigator.onLine === false) { this.status = 'offline'; return; }   // 인터넷이 돌아오면('online') 다시
    const job = (path, data, raw, getLast, setLast, mark) => { const prev = getLast(); setLast(raw);
      jobs.push(this.write(path, data).then(() => { mark(); this.saveSynced(); }, e => { if (getLast() === raw) setLast(prev); console.warn('sync', path, e); throw e; })); };
    for (const k of [...KID_KEYS, ...ADULT_KEYS]) {
      if (!this.writable(k)) continue;
      const v = this.pack(S[k]), raw = JSON.stringify(v);
      if (raw === this.last.s[k] || v === undefined) continue;
      this.touched.delete(k);
      job(`${b}/s/${k}`, { v, at:Date.now(), by:role() }, raw, () => this.last.s[k], x => this.last.s[k] = x, () => sy.s[k] = hashStr(raw));
    }
    if (canWriteKid()) for (const k of Object.keys(S.days)) {
      const v = this.pack(S.days[k]), raw = JSON.stringify(v);
      if (raw === this.last.days[k]) continue;
      job(`${b}/days/${k}`, { v, at:Date.now() }, raw, () => this.last.days[k], x => this.last.days[k] = x, () => sy.d[k] = hashStr(raw));
    }
    if (jobs.length) this.beat();
    const res = await Promise.allSettled(jobs), bad = res.find(r => r.status === 'rejected');
    if (!bad) { this.tries = 0; if (jobs.length) { this.status = 'on'; this.error = ''; this.sentOk(); if (this.beatErr || this.beatUnsent) this.beat(true); } }
    else { this.status = 'error'; this.error = String(bad.reason && bad.reason.message || bad.reason); this.sentBad(this.error); if (res.some(r => r.status === 'fulfilled')) this.okAt = Date.now();
      // 다시 보내기: 20초, 40초, 80초 … 최대 5분 간격
      this.tries = (this.tries || 0) + 1; clearTimeout(this.retryT); this.retryT = setTimeout(() => this.push(), Math.min(300000, 20000 * 2 ** (this.tries - 1)));
      if (this.beatErr !== this.error.slice(0, 160)) this.beat(true); }
  },
  /* 재윤이 태블릿: "나 연결됐어요" 표시 (1분에 한 번까지) */
  beat(force){
    if (!this.ready || role() !== 'kid') return;
    const t = Date.now(); if (!force && t - this.beatAt < 60000) return; this.beatAt = t;
    // 보내기 실패 중이면 그 이유도 같이 (엄마·오빠 폰 맨 위에 보여 줌)
    const err = this.status === 'error' ? String(this.error || '').slice(0, 160) : ''; this.beatErr = err;
    // 오빠 폰에서 원인을 볼 수 있게: 앱 버전, 보낸 길, 못 보낸 기록 수, 기기 저장 공간, 마지막으로 공부한 날
    let ls = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls += k.length + (localStorage.getItem(k) || '').length; } } catch (e) {}
    const days = Object.keys(S.days), sy = this.synced(), unsent = days.filter(k => !sy.d[k]).length; this.beatUnsent = unsent;
    const info = { at:t, stickers:S.stickers.length, days:days.length, last:days.sort().pop() || '', err, okAt:this.okAt || 0, ver:String(window.APP_VERSION || ''), via:this.via || '', unsent, ls, lf:(() => { try { return +localStorage.getItem('jaeyun-lecfill-n') || 0; } catch (e) { return 0; } })(), ld:lecDiag(), online:navigator.onLine !== false, failSince:this.failSince || 0 };
    this.write(`${this.base()}/meta/kid`, info).then(() => { if (!this.okAt) this.okAt = Date.now(); }, e => { this.beatAt = 0; this.sentBad(e); });
  },
  /* 엄마·오빠 기기: 30분에 한 번 "이 기기는 무슨 역할 · 태블릿인지 · 여기서 공부한 날"을 올린다 */
  devBeat(force){
    if (!this.ready || role() === 'kid') return;
    const t = Date.now(); if (!force && t - this.devAt < 30 * 60000) return; this.devAt = t;
    this.write(`${this.base()}/meta/dev-${devId()}`, { role:role(), at:t, tab:isTabletDev(), study3:localStudyDays(), stickers:S.stickers.length, ver:String(window.APP_VERSION || '') }).catch(() => { this.devAt = 0; });
  },
  kidSeenAt(){ return Math.max((this.kid && this.kid.at) || 0, this.kidDayAt || 0); },
  /* 알림함: 인터넷이 없거나 아직 연결 전에 생긴 알림은 기기에 모아 두었다가(jaeyun-noteq, 7일까지) 연결되면 올린다 */
  noteQ(){ try { return JSON.parse(localStorage.getItem('jaeyun-noteq') || '[]'); } catch (e) { return []; } },
  setNoteQ(q){ try { q.length ? localStorage.setItem('jaeyun-noteq', JSON.stringify(q.slice(-80))) : localStorage.removeItem('jaeyun-noteq'); } catch (e) {} },
  addNote(n){
    if (!linked()) return;
    n.id = n.id || ('n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    const q = this.noteQ(); q.push({ id:n.id, to:n.to, text:n.text, at:n.at, d:n.d }); this.setNoteQ(q);
    this.flushNotes();
  },
  flushNotes(){
    if (!this.ready) return;
    const q = this.noteQ().filter(x => Date.now() - x.at < 7 * 86400000); this.setNoteQ(q);
    q.forEach(x => this.write(`${this.base()}/notes/${x.id}`, { to:x.to, text:x.text, at:x.at, d:x.d })
      .then(() => this.setNoteQ(this.noteQ().filter(y => y.id !== x.id)), () => {}));
  },
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
    for (let i = 0; i < parts; i++) w.push(this.write(`${b}/blobs/${h}_${i}`, { d:data.slice(i * CHUNK, (i + 1) * CHUNK) }));
    Promise.all(w).then(() => this.write(`${b}/blobs/${h}`, { parts })).then(() => { sy.b[h] = 1; this.saveSynced(); }, () => {}).finally(() => { this.upping[h] = false; });
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
    if (S.started) { try { const bk = Object.assign({}, S, { days:{} }); Object.keys(S.days).forEach(k => { const d = Object.assign({}, S.days[k]); if (d.dict) d.dict = Object.assign({}, d.dict, { photo:null, pen:null }); if (d.writes) d.writes = Object.fromEntries(Object.entries(d.writes).map(([wk, w]) => [wk, Object.assign({}, w, { img:null })])); /* 백업엔 사진·글씨 그림 빼기 (기기 저장 공간 5MB) */ bk.days[k] = d; }); localStorage.setItem('jaeyun-backup', JSON.stringify({ at:Date.now(), S:bk })); } catch (e) {} }
    const mine = { kid:Object.fromEntries(KID_KEYS.map(k => [k, S[k]])), days:S.days, score:S.started ? studyScore(S) : 0 };
    // 같은 가족방에서 이 기기만 "재윤이"로 바꾸는 경우(엄마·오빠로 잘못 연결된 태블릿 고치기): 서버에서 받을 것 없이 바로.
    // 이 기기가 가진 재윤이 기록이 원본이라 전부 올린다. (서버 읽기가 막혀도 멈추지 않게 — 10/29)
    if (roleName === 'kid' && S.local && S.local.fid === fid && S.local.role !== 'kid') {
      this.unsub.forEach(f => { try { f(); } catch (e) {} }); this.unsub = []; this.ready = false;
      S.local = { fid, role:'kid' }; this.resetSynced(); this.kept = mine.score;
      const sy = this.synced(); ADULT_KEYS.forEach(k => sy.s[k] = hashStr(JSON.stringify(this.pack(S[k]))));   // 어른 설정은 서버에서 받은 그대로
      delete sy.fresh; this.saveSynced(); saveLocal();
      await this.start(); this.beat(true); this.devAt = 0;
      this.write(`${this.base()}/meta/dev-${devId()}`, { role:'kid', at:Date.now() }).catch(() => {});
      return true;
    }
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
    // 서버에서 받은 그대로인 것만 "보냄"으로 친다. 나머지(이 태블릿에만 있는 것)는 start()가 올린다
    const srvDays = {}; Object.keys(S.days).forEach(k => srvDays[k] = JSON.stringify(this.pack(S.days[k])));
    const takeMine = roleName === 'kid' && mine.score > studyScore(S);
    if (takeMine) {
      // 이 기기(태블릿)의 재윤이 기록(진도·스티커)이 더 많다 → 그대로 남기고 가족 기록으로 올린다
      KID_KEYS.forEach(k => { if (mine.kid[k] !== undefined) S[k] = mine.kid[k]; });
      this.kept = mine.score;
    }
    if (roleName === 'kid') {
      // 날짜별 공부 기록은 어느 쪽이든 합친다: 그날 더 많이 한 쪽을 남긴다 (태블릿에서 공부한 날이 지워지지 않게)
      const doneN = x => x && x.boards ? Object.values(x.boards).filter(b => b && b.done).length : 0;
      Object.entries(mine.days || {}).forEach(([k, d]) => { const f = S.days[k]; if (!f || doneN(d) >= doneN(f)) S.days[k] = d; });
    }
    const sy = this.synced();
    [...KID_KEYS, ...ADULT_KEYS].forEach(k => { if (!(takeMine && KID_KEYS.includes(k))) sy.s[k] = hashStr(JSON.stringify(this.pack(S[k]))); });
    Object.keys(S.days).forEach(k => { const raw = JSON.stringify(this.pack(S.days[k])); if (srvDays[k] === raw) sy.d[k] = hashStr(raw); });
    delete sy.fresh; this.saveSynced();
    saveLocal(); await this.start(); if (roleName === 'kid') this.beat(true);
    // 이 기기의 예전 역할 표시(meta/dev-…)를 바로 고친다 (오빠 폰에 남은 "역할이 잘못된 태블릿" 경고가 사라지게)
    this.devAt = 0; if (roleName === 'kid') this.write(`${this.base()}/meta/dev-${devId()}`, { role:'kid', at:Date.now() }).catch(() => {}); else this.devBeat(true);
    return true;
  },
  leave(){ this.unsub.forEach(f => { try { f(); } catch (e) {} }); this.unsub = []; this.ready = false; S.local = null; this.status = 'off'; saveLocal(); },
};
/* 인터넷이 다시 되거나, 앱을 다시 볼 때 · 끌 때 바로 보낸다 */
window.addEventListener('online', () => { if (!Sync.ready) Sync.start(); else { Sync.push(); Sync.flushNotes(); } });
document.addEventListener('visibilitychange', () => { if (!linked()) return; if (!Sync.ready) { if (!document.hidden) Sync.start(); return; } Sync.push(); if (!document.hidden) { Sync.beat(); Sync.devBeat(); Sync.flushNotes(); } });
/* 가족방 번호 4자리: 태블릿·엄마 폰·오빠 폰이 같은 방인지 눈으로 비교 (10/29: 태블릿만 다른 방에 들어가 있던 사고) */
function famCode(){ return linked() ? S.local.fid.slice(-4).toUpperCase() : ''; }
function familyLink(){ const base = location.href.split('#')[0].split('?')[0]; return `${base}#join=${S.local.fid}`; }
function refreshIfIdle(){
  if (['home','adult','map','gift','cal','room','alldone','book','study','notebook'].includes(SCREEN)) {
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
  const offline = navigator.onLine === false, waiting = Sync.noteQ().length;
  const st = offline ? '인터넷 없음' : ({ on:'연결됨 ✓', connecting:'연결 중…', error:'보내기 실패', offline:'인터넷 없음', nosdk:'서버를 못 불러왔어요', off:'꺼짐' }[Sync.status] || Sync.status);
  return `<div class="panel"><h3>가족 기기 연결</h3>
    <div class="row"><span class="grow" style="flex:1">이 기기: <b>${who}</b> · 가족방 <b class="fam-code">${famCode()}</b></span><span class="pill ${Sync.status === 'on' && !offline ? 'ok' : 'wait'}">${st}</span></div>
    ${offline ? `<p class="demo-note">지금 인터넷이 없어요. 공부한 기록은 이 기기에 그대로 있고, 인터넷이 연결되면 저절로 엄마·오빠 폰으로 보내요.</p>`
      : Sync.status === 'error' ? `<p class="demo-note">${esc(Sync.error || '')}<br>인터넷이 되면 저절로 다시 보내요. 계속 이러면 Firebase 보안 규칙을 확인해 주세요.</p>` : ''}
    ${waiting && role() === 'kid' ? `<p class="muted" style="font-size:14px">아직 못 보낸 알림 ${waiting}개 (연결되면 보내요)</p>` : ''}
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
  const have = Object.keys(S.days).length;
  const bad = Object.entries(Sync.devs || {}).find(([id, d]) => id !== devId() && d && d.role !== 'kid' && d.tab && d.study3 > 0 && Date.now() - (d.at || 0) < 3 * 86400000);
  if (bad) { const d = bad[1], who = d.role === 'mom' ? '엄마 폰' : '오빠 폰';
    return box(`<b>⚠️ 재윤이가 공부하는 태블릿이 "${who}"으로 연결돼 있어요</b><br>그래서 재윤이가 푼 게 미리보기로만 남고 엄마·오빠 폰에 안 와요 (그 태블릿 스티커 ${d.stickers || 0}개, 마지막 ${agoText(d.at)}).<br>태블릿 첫 화면 맨 위의 <b>"재윤이 태블릿으로 바꾸기"</b>를 눌러 주세요. 태블릿 기록은 지워지지 않고 그대로 올라와요.`); }
  // 태블릿이 보낸 상태 한 줄: 앱 버전, 못 보낸 날 수 (원인 찾을 때 오빠가 봄)
  const diag = kid.at ? `<br><span class="muted" style="font-size:12px">가족방 ${famCode()} · 태블릿 앱 ${kidVer(kid.ver)}${kid.unsent ? ` · 못 보낸 날 ${kid.unsent}일` : ''}${kid.via ? ` · ${kid.via === 'rest' ? '직접 보냄' : 'SDK'}` : ''}${kid.ld ? ` · 강의 기록 ${kid.ld}` : ''}</span>` : '';
  if (kid.err) return box(`<b>⚠️ 재윤이 태블릿이 공부 기록을 보내지 못하고 있어요</b><br>태블릿 마지막 연결: ${agoText(kid.at)}${kid.okAt ? ` · 마지막으로 보낸 때: ${agoText(kid.okAt)}` : ''}<br><span class="muted" style="font-size:13px">${esc(kid.err)}</span><br>이 화면을 오빠에게 캡처해서 보내 주세요.${diag}`);
  if (kid.days && kid.days > have + 1 && Date.now() - (kid.at || 0) < 2 * 86400000) return box(`<b>재윤이 태블릿 기록을 받는 중이에요</b> (태블릿 ${kid.days}일 · 이 폰 ${have}일)<br>태블릿 마지막 연결: ${agoText(kid.at)}. 몇 분 지나도 그대로면 오빠에게 알려 주세요.${diag}`, 'soft');
  if (!seen) return box(`<b>재윤이 태블릿에서 아직 기록이 한 번도 오지 않았어요</b><br>태블릿에서 <b>엄마·오빠 메뉴 → 설정 → 가족 기기 연결</b>을 확인해 주세요. "이 기기: 재윤이 태블릿 · 연결됨"이어야 해요. 아니면 가족 링크를 태블릿에서 열고 "재윤이"를 고르세요 (태블릿 기록은 지워지지 않고 올라가요).`);
  // 하루 넘게 소식이 없으면: 인터넷 탓이라고만 하지 않고, 태블릿에서 무엇을 보면 되는지 알려 준다
  if (Date.now() - seen > 26 * 3600000) return box(`<b>재윤이 태블릿 마지막 연결: ${agoText(seen)}</b><br>재윤이가 그 뒤에도 공부했다면, 태블릿에서 공부방 앱을 열고 <b>엄마·오빠 메뉴 → 설정 → 가족 기기 연결</b>을 봐 주세요.<br>· 거기 <b>가족방 번호</b>가 이 폰(<b>${famCode()}</b>)과 다르면 → 이 폰 설정의 <b>가족 링크</b>를 태블릿 크롬에서 열고 <b>"재윤이"</b> 고르기 (태블릿 기록은 그대로 이 방으로 와요)<br>· "이 기기: 재윤이 태블릿"이 아니거나 가족방 만들기 화면이 보이면 → 가족 링크를 태블릿에서 열고 <b>"재윤이"</b> 고르기 (태블릿 기록은 지워지지 않아요)<br>· 빨간 글씨(보내기 실패)가 있으면 → 그 화면을 오빠에게 캡처${diag}`, 'warn');
  return box(`재윤이 태블릿 마지막 연결: ${agoText(seen)} ✓${kid.unsent ? ` · 보내는 중 ${kid.unsent}일` : ''}${diag}`, 'ok');
}
function kidVer(v){ if (!v) return '예전 버전(10/28 이전)'; const m = String(v).match(/^\d{4}(\d\d)(\d\d)(\d\d)(\d\d)/); return m ? `${+m[1]}/${+m[2]} ${m[3]}:${m[4]} 버전` : v; }
/* 재윤이 태블릿 첫 화면 아래: 기록이 가족에게 안 가고 있으면 엄마가 알아볼 수 있게 작게 표시 (재윤이는 신경 안 써도 되는 말투) */
function kidSyncNote(){
  if (!(window.firebase && window.FIREBASE_CONFIG) || !S.started) return '';
  const note = t => `<button class="kid-sync-note" data-a="go" data-v="pin">⚠️ ${t} <span>엄마 · 오빠가 볼게요</span></button>`;
  if (!linked()) return studyScore(S) > 0 ? note('이 태블릿은 아직 엄마·오빠 폰과 연결되지 않았어요') : '';
  if (role() !== 'kid') return '';   // 엄마·오빠 역할 태블릿은 첫 화면 맨 위(wrongRoleHTML)에서 크게 알려 줌
  if (navigator.onLine === false) return '';
  if (Sync.failSince && Date.now() - Sync.failSince > 10 * 60000) return note('공부 기록이 엄마·오빠 폰으로 안 가고 있어요');
  return '';
}

/* 재윤이 첫 화면 맨 위: 이 태블릿이 엄마·오빠 역할이면 크게 알리고 한 번에 고치기 */
function wrongRoleHTML(){
  if (!wrongRoleTablet()) return '';
  const who = role() === 'mom' ? '엄마 폰' : '오빠 폰';
  return `<div class="role-warn"><b>⚠️ 이 태블릿은 "${who}"으로 연결돼 있어요</b><span>그래서 재윤이가 공부한 게 엄마·오빠 폰에 안 가요. 재윤이 태블릿이면 아래 버튼을 눌러 주세요. 공부한 기록은 지워지지 않고 그대로 올라가요.</span>
    <button class="btn small" data-a="tokid">재윤이 태블릿으로 바꾸기</button></div>`;
}
ACT.tokid = async () => {
  if (!linked()) return;
  if (!confirm('이 태블릿을 "재윤이" 기기로 바꿀까요?\n이 태블릿에서 공부한 기록은 지워지지 않고 엄마·오빠 폰으로 올라가요.')) return;
  toast('바꾸는 중이에요…');
  const ok = await Sync.join(S.local.fid, 'kid').catch(e => { console.warn(e); return false; });
  if (!ok) return toast('바꾸지 못했어요. 인터넷이 되는지 확인하고 다시 눌러 주세요');
  toast(`재윤이 태블릿이 됐어요! 공부 기록(스티커 ${S.stickers.length}개)을 엄마·오빠 폰으로 보내요`); go('home');
};

/* 지난 강의 시간 되살리기 (10/29): 오빠 역할이던 동안 진도(seen)가 되돌아가서 그날 본 강의가 공부 시간에서 빠졌다.
   태블릿 알림함에 남은 "📺 … n강을 봤어요 (m분)" 글로 날짜별 기록(d.lm)을 채운다. 재윤이 기기에서 한 번만 */
function backfillLectures(){
  if (!S.started || (linked() && role() !== 'kid')) return 0;
  // v2(10/29 14:40): 판에 붙은 강의로도 찾음 → 이미 한 번 돈 기기도 한 번 더
  try { if (localStorage.getItem('jaeyun-lecfill2') === '1') return 0; } catch (e) {}
  let added = 0;
  const courseByName = name => { for (const s of ['math','kor']) for (const co of CURRS[s].courses) if (co.ebs && co.ebs.name === name) return { s, co }; return null; };
  S.notes.forEach(n => {
    const t = String(n.text || ''), dk = n.d || (n.at ? keyOf(new Date(n.at)) : ''); if (!dk || !S.days[dk]) return;
    let s = null, no = 0, mins = 0, co = null, m;
    if ((m = t.match(/EBS (.+?) (\d+)강을 봤어요 \((\d+)분\)/))) { const c = courseByName(m[1]); if (!c) return; s = c.s; co = c.co; no = +m[2]; mins = +m[3]; }
    else if ((m = t.match(/(수학|국어) (\d+)강 대신 (\d+)강을 봤어요 \((\d+)분\)/))) { s = m[1] === '수학' ? 'math' : 'kor'; no = +m[3]; mins = +m[4]; }
    else if ((m = t.match(/(수학|국어) (\d+)강 ".*"을 봤어요 \((\d+)분\)/))) { s = m[1] === '수학' ? 'math' : 'kor'; no = +m[2]; mins = +m[3]; }
    else return;
    if (!co) co = CURRS[s].courses[0];   // 강좌 이름이 없는 글: 지금은 1-2 강좌
    const gn = co.lectOff + no, key = s + gn, dy = S.days[dk];
    dy.lm = Object.assign({}, dy.lm); if (!(dy.lm[key] >= mins)) { dy.lm[key] = mins; added++; }
    dy.lw = [...new Set([...(dy.lw || []), key])];
  });
  // 알림함 글이 없는 날(가족방을 옮기면서 알림함이 바뀜): 그날 본 강의를 날짜 기록에서 찾아 그 강의 길이(EBS 표시 시간)로 센다
  //  ① 그날 정해진 강의(d.lec)를 "다 봤어요"로 끝냄  ② 그날 강의가 붙은 판(b.cur.lec)을 강의 건너뛰기 없이 풀었음
  const put = (dk, dy, s, n) => { const key = s + n, li = lectInfo(s, n); if (!li) return;
    if (Object.keys(dy.lm || {}).some(k => k.startsWith(s))) return;   // 그 과목 강의 시간이 이미 있으면 그대로
    if (curr(s).seen[n] && curr(s).seen[n].d === dk) return;
    dy.lm = Object.assign({}, dy.lm, { [key]:Math.min(40, li.mins || 28) }); dy.lw = [...new Set([...(dy.lw || []), key])]; added++; };
  Object.entries(S.days).forEach(([dk, dy]) => {
    if (!dy) return;
    const L = dy.lec;
    if (L && L.s && L.n && (L.done || L.missed !== undefined)) { const n = L.missed > 0 ? L.missed : L.missed === undefined ? L.n : 0; if (n) put(dk, dy, L.s, n); }
    Object.values(dy.boards || {}).forEach(b => { if (b && b.cur && b.cur.lec && !b.lecSkip && (b.done || b.idx > 0)) put(dk, dy, b.cur.subj, b.cur.lec); });
  });
  try { localStorage.setItem('jaeyun-lecfill2', '1'); localStorage.setItem('jaeyun-lecfill-n', String(added)); } catch (e) {}
  if (added) save();
  return added;
}

/* 강의 기록 진단 (오빠 폰 맨 위 작은 글씨): 날짜 기록에 강의 흔적이 얼마나 있는지
   "정한날 a(끝냄 b) · 강의판 c · 분기록 d · 본목록 e · 되살림 f" */
function lecDiag(){
  let a = 0, b = 0, c = 0, d = 0;
  Object.values(S.days).forEach(dy => { if (!dy) return; if (dy.lec && dy.lec.s) { a++; if (dy.lec.done) b++; }
    Object.values(dy.boards || {}).forEach(x => { if (x && x.cur && x.cur.lec) c++; }); d += Object.keys(dy.lm || {}).length; });
  const e = ['math','kor'].reduce((t, s) => t + Object.keys(curr(s).seen || {}).length, 0);
  let f = 0; try { f = +localStorage.getItem('jaeyun-lecfill-n') || 0; } catch (x) {}
  return `정한날 ${a}(끝냄 ${b}) · 강의판 ${c} · 분기록 ${d} · 본목록 ${e} · 되살림 ${f}`;
}
