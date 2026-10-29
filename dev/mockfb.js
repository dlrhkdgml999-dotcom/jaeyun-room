(function(){
  const listeners = [];
  const call = (op, path, data) => window.__fs(op, path, data === undefined ? null : JSON.stringify(data));
  const clone = x => x == null ? x : JSON.parse(JSON.stringify(x));
  function validate(d, path){
    const bad = m => { window.__fsBad = (window.__fsBad || []).concat(path + ': ' + m); throw new Error('Function DocumentReference.set() called with invalid data. ' + m + ' (document ' + path + ')'); };
    let size = 0;
    const walk = (v, inArr, at) => {
      if (v === undefined) bad('Unsupported field value: undefined (found in field ' + at + ')');
      if (typeof v === 'function') bad('Unsupported field value: a function (found in field ' + at + ')');
      if (Array.isArray(v)) { if (inArr) bad('Nested arrays are not supported (found in field ' + at + ')'); for (let i = 0; i < v.length; i++) walk(v[i], true, at); size += 1; return; }
      if (v && typeof v === 'object') { for (const k in v) { if (k === '' || /^__.*__$/.test(k)) bad('Invalid field name "' + k + '"'); size += k.length + 1; walk(v[k], false, at ? at + '.' + k : k); } size += 32; return; }
      size += typeof v === 'string' ? v.length + 1 : 8;
    };
    walk(d, false, '');
    if (size > 1048487) bad('Document is too large (' + size + ' bytes)');
  }
  function docSnap(id, data){ return { id, exists: data != null, data: () => clone(data), metadata:{ hasPendingWrites:false } }; }
  class DocRef { constructor(p){ this.path = p; this.id = p.split('/').pop(); }
    // 진짜 Firestore처럼: 잘못된 값이면 set()을 부르는 순간 바로 던진다 (배열 안 배열, undefined, 함수, 1MB 넘는 문서)
    set(d, opt){ validate(d, this.path);
      // __sdkHang: 진짜 사고 흉내 — SDK 보내기 줄이 막히면 set()이 오류 없이 영원히 기다린다
      if (window.__sdkHang || localStorage.getItem('__sdkHang') === '1') { window.__hung = (window.__hung || 0) + 1; return new Promise(() => {}); }
      return (async () => { if (window.__mockIsOffline()) throw new Error('offline');
      if (opt && opt.merge) { const cur = JSON.parse(await call('get', this.path)) || {}; d = Object.assign(cur, d); } await call('set', this.path, d); })(); }
    async delete(){ if (window.__mockIsOffline()) throw new Error('offline'); await call('del', this.path); }
    async get(){ const r = JSON.parse(await call('get', this.path)); return docSnap(this.id, r); }
    onSnapshot(a, b){ const cb = typeof a === 'function' ? a : b; const l = { kind:'doc', path:this.path, cb }; listeners.push(l); this.get().then(cb); return () => listeners.splice(listeners.indexOf(l), 1); } }
  class ColRef { constructor(p, o = {}){ this.path = p; this.o = o; }
    doc(id){ return new DocRef(this.path + '/' + id); }
    orderBy(f, dir){ return new ColRef(this.path, Object.assign({}, this.o, { f, dir })); }
    limit(n){ return new ColRef(this.path, Object.assign({}, this.o, { n })); }
    async get(){ const arr = JSON.parse(await call('list', this.path)); let docs = arr.map(([id, d]) => docSnap(id, d));
      if (this.o.f) docs.sort((a, b) => (a.data()[this.o.f] - b.data()[this.o.f]) * (this.o.dir === 'desc' ? -1 : 1));
      if (this.o.n) docs = docs.slice(0, this.o.n); return { docs, size:docs.length }; }
    onSnapshot(a, b){ const cb = typeof a === 'function' ? a : b; const l = { kind:'col', path:this.path, cb, ref:this }; listeners.push(l); this.get().then(cb); return () => listeners.splice(listeners.indexOf(l), 1); } }
  window.__fsChanged = (path) => { listeners.slice().forEach(l => {
    if (l.kind === 'doc' && l.path === path) new DocRef(path).get().then(l.cb);
    if (l.kind === 'col' && path.startsWith(l.path + '/') && !path.slice(l.path.length + 1).includes('/')) l.ref.get().then(l.cb); }); };
  const db = { doc: p => new DocRef(p), collection: p => new ColRef(p) };
  // 폰 알림(FCM) 흉내: 알림 주소는 기기마다 하나
  const msg = { async getToken(o){ if (!o || !o.vapidKey) throw new Error('no vapid'); return window.__fcmTok || (window.__fcmTok = 'tok' + Math.random().toString(36).slice(2, 10)); }, async deleteToken(){ window.__fcmTok = null; return true; } };
  // 인터넷 끊김 흉내: window.__offline 또는 localStorage '__mockOffline' (앱을 다시 켜도 끊긴 채로)
  const offline = () => window.__offline || localStorage.getItem('__mockOffline') === '1';
  window.__mockIsOffline = offline;
  // 로그인: 한 번 로그인한 기기는 기억 (인터넷 없어도 그대로), 처음 로그인은 인터넷이 있어야 함
  const auth = { get currentUser(){ return localStorage.getItem('__mockUser') ? { uid:localStorage.getItem('__mockUser'), getIdToken: async () => { if (offline()) throw new Error('auth/network-request-failed'); return 'tok-' + localStorage.getItem('__mockUser'); } } : null; },
    onAuthStateChanged(cb){ setTimeout(() => cb(this.currentUser), 10); return () => {}; },
    async signInAnonymously(){ if (offline()) throw new Error('auth/network-request-failed'); localStorage.setItem('__mockUser', 'u' + Math.random().toString(36).slice(2, 8)); return { user:this.currentUser }; } };
  // Firestore REST(직접 보내기) 흉내: PATCH …/documents/{경로} {fields} → 같은 가짜 서버에 저장 (SDK와 똑같이 검사)
  const fromVal = v => 'nullValue' in v ? null : 'booleanValue' in v ? v.booleanValue : 'integerValue' in v ? Number(v.integerValue) : 'doubleValue' in v ? Number(v.doubleValue) : 'stringValue' in v ? v.stringValue
    : 'arrayValue' in v ? (v.arrayValue.values || []).map(fromVal) : 'mapValue' in v ? fromFields(v.mapValue.fields || {}) : (() => { throw new Error('bad value ' + JSON.stringify(v)); })();
  const fromFields = f => { const o = {}; for (const k in f) o[k] = fromVal(f[k]); return o; };
  const realFetch = window.fetch.bind(window);
  window.__rest = 0;
  window.fetch = async (url, opt) => {
    const m = String(url).match(/^https:\/\/firestore\.googleapis\.com\/v1\/projects\/[^/]+\/databases\/\(default\)\/documents:commit$/);
    if (!m) return realFetch(url, opt);
    if (opt.method !== 'POST') return new Response('{}', { status:405 });
    if (offline() || window.__restDown || localStorage.getItem('__restDown') === '1') throw new TypeError('Failed to fetch');
    if (!/^Bearer tok-/.test((opt.headers || {}).Authorization || '')) return new Response('{"error":{"status":"UNAUTHENTICATED"}}', { status:401 });
    const w = JSON.parse(opt.body).writes[0].update, path = w.name.replace(/^projects\/[^/]+\/databases\/\(default\)\/documents\//, '');
    const d = fromFields(w.fields || {});
    try { validate(d, path); } catch (e) { return new Response(JSON.stringify({ error:{ message:e.message } }), { status:400 }); }
    window.__rest++; await call('set', path, d); return new Response('{}', { status:200 });
  };
  window.firebase = { apps:[], initializeApp(){ this.apps.push({}); }, auth: () => auth, firestore: () => db, messaging: () => msg };
})();
