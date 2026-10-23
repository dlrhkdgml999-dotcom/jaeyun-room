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
    set(d){ validate(d, this.path); return (async () => { if (window.__offline) throw new Error('offline'); await call('set', this.path, d); })(); }
    async get(){ const r = JSON.parse(await call('get', this.path)); return docSnap(this.id, r); }
    onSnapshot(cb){ const l = { kind:'doc', path:this.path, cb }; listeners.push(l); this.get().then(cb); return () => listeners.splice(listeners.indexOf(l), 1); } }
  class ColRef { constructor(p, o = {}){ this.path = p; this.o = o; }
    doc(id){ return new DocRef(this.path + '/' + id); }
    orderBy(f, dir){ return new ColRef(this.path, Object.assign({}, this.o, { f, dir })); }
    limit(n){ return new ColRef(this.path, Object.assign({}, this.o, { n })); }
    async get(){ const arr = JSON.parse(await call('list', this.path)); let docs = arr.map(([id, d]) => docSnap(id, d));
      if (this.o.f) docs.sort((a, b) => (a.data()[this.o.f] - b.data()[this.o.f]) * (this.o.dir === 'desc' ? -1 : 1));
      if (this.o.n) docs = docs.slice(0, this.o.n); return { docs, size:docs.length }; }
    onSnapshot(cb){ const l = { kind:'col', path:this.path, cb, ref:this }; listeners.push(l); this.get().then(cb); return () => listeners.splice(listeners.indexOf(l), 1); } }
  window.__fsChanged = (path) => { listeners.slice().forEach(l => {
    if (l.kind === 'doc' && l.path === path) new DocRef(path).get().then(l.cb);
    if (l.kind === 'col' && path.startsWith(l.path + '/') && !path.slice(l.path.length + 1).includes('/')) l.ref.get().then(l.cb); }); };
  const db = { doc: p => new DocRef(p), collection: p => new ColRef(p) };
  window.firebase = { apps:[], initializeApp(){ this.apps.push({}); }, auth: () => ({ signInAnonymously: async () => ({ user:{ uid:'u' } }) }), firestore: () => db };
})();
