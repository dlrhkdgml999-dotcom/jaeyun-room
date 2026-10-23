/* ===================== 폰 알림 (Firebase 클라우드 메시징) =====================
   - 엄마·오빠 폰에서 "이 폰으로 알림 받기"를 누르면 이 폰의 알림 주소(토큰)를 families/{fid}/push/{id}에 저장
     { token, roles:['mom'] 처럼 받을 알림 종류, at, ua }
   - 알림이 생긴 기기가 Relay로 알림 서버(Apps Script, firebase/apps_script.gs)에 보내면 서버가 roles에 맞는 폰으로 보낸다
     (functions/index.js는 Firebase 유료 요금제용 같은 일을 하는 서버 — 오빠가 요금제 안 바꾸기로 해서 안 씀)
   - 웹 푸시 키(VAPID 공개키)는 오빠가 설정 탭에 붙여 넣는다 → S.fcmKey (공개돼도 되는 값, 가족 기기에 같이 저장)
   - 알림을 받으면 sw.js가 띄운다 (push 이벤트)                                                  */
const PUSH_LS = 'jaeyun-push';
/* 알림 서버(오빠 구글 계정의 Apps Script, firebase/apps_script.gs)로 알림 보내기.
   알림이 생긴 기기가 바로 보낸다 → 서버가 엄마·오빠 폰으로 앱 알림. 인터넷이 끊겨 못 보낸 건 기기에 잠깐 쌓아 두었다가 다시 (3시간 지나면 버림) */
const RELAY_LS = 'jaeyun-relayq';
const Relay = {
  url(){ const m = S.mail || {}; return m.key && m.url && /^https:\/\/script\.google\.com\/macros\/s\/[^\s]+\/exec$/.test(m.url) ? m.url : ''; },
  q(){ try { return JSON.parse(localStorage.getItem(RELAY_LS) || '[]'); } catch (e) { return []; } },
  setQ(q){ try { localStorage.setItem(RELAY_LS, JSON.stringify(q.slice(-30))); } catch (e) {} },
  send(n){ if (!this.url() || !linked()) return; const q = this.q(); q.push({ to:n.to, text:n.text, at:n.at || Date.now() }); this.setQ(q); this.flush(); },
  flushing:false,
  async flush(){
    const url = this.url(); if (!url || this.flushing) return; this.flushing = true;
    try {
      let q = this.q().filter(x => Date.now() - x.at < 3 * 3600000);
      for (const x of q.slice()) {
        try { await fetch(url, { method:'POST', mode:'no-cors', headers:{ 'Content-Type':'text/plain' }, body:JSON.stringify({ key:S.mail.key, type:'note', to:x.to, text:x.text, at:x.at }) }); q = q.filter(y => y !== x); }
        catch (e) { break; }   // 인터넷이 안 되면 다음에
      }
      this.setQ(q);
    } finally { this.flushing = false; }
  },
};
window.addEventListener('online', () => Relay.flush());
const Push = {
  busy:false, err:'',
  key(){ return (S.fcmKey || window.FCM_VAPID_KEY || '').trim(); },
  sdk(){ return !!(window.firebase && firebase.messaging && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window); },
  mine(){ try { const x = JSON.parse(localStorage.getItem(PUSH_LS) || 'null'); return x && x.fid === (S.local && S.local.fid) ? x : null; } catch (e) { return null; } },
  setMine(x){ try { x ? localStorage.setItem(PUSH_LS, JSON.stringify(x)) : localStorage.removeItem(PUSH_LS); } catch (e) {} },
  /* off: 꺼짐 · on: 받는 중 · denied: 폰에서 막힘 · nokey: 오빠가 키를 아직 안 넣음 · unsupported: 이 브라우저는 안 됨 · nolink: 가족 연결 전 */
  state(){
    if (!this.sdk()) return 'unsupported';
    if (!linked()) return 'nolink';
    if (Notification.permission === 'denied') return 'denied';
    if (!Relay.url()) return 'noserver';
    if (!this.key()) return 'nokey';
    return this.mine() && Notification.permission === 'granted' ? 'on' : 'off';
  },
  docId(token){ return hashStr(token).slice(0, 24); },
  async token(){
    // 서비스워커가 준비 안 되면 영영 기다리지 않게 15초에서 끊는다
    const limit = (pr, msg) => Promise.race([pr, new Promise((_, no) => setTimeout(() => no(new Error(msg)), 15000))]);
    const reg = await limit(navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready), '앱 준비가 안 됐어요. 앱을 껐다 켜고 다시 해 주세요');
    return limit(firebase.messaging().getToken({ vapidKey:this.key(), serviceWorkerRegistration:reg }), '알림 서버에 연결하지 못했어요. 인터넷을 확인하고 다시 해 주세요');
  },
  async enable(roles){
    if (this.busy) return; this.busy = true; this.err = '';
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { this.err = perm === 'denied' ? '알림이 막혀 있어요. 폰 설정 → 앱(또는 인터넷 브라우저) → 알림에서 이 사이트 알림을 허용해 주세요.' : '알림 허용을 누르지 않았어요.'; return false; }
      await Sync.fs();
      const token = await this.token(); if (!token) throw new Error('알림 주소를 못 받았어요');
      const old = this.mine(); roles = roles || (old && old.roles) || [role()];
      if (old && old.id !== this.docId(token)) { try { await Sync.db.doc(`${Sync.base()}/push/${old.id}`).delete(); } catch (e) {} }
      const id = this.docId(token);
      await Sync.db.doc(`${Sync.base()}/push/${id}`).set({ token, roles, at:Date.now(), who:role(), ua:navigator.userAgent.slice(0, 120) });
      this.setMine({ fid:S.local.fid, id, roles, at:Date.now() });
      return true;
    } catch (e) { this.err = String(e && e.message || e); console.warn('push', e); return false; }
    finally { this.busy = false; }
  },
  async disable(){
    const m = this.mine(); this.setMine(null);
    try { if (m) await Sync.db.doc(`${Sync.base()}/push/${m.id}`).delete(); } catch (e) {}
    try { await firebase.messaging().deleteToken(); } catch (e) {}
  },
  async setRoles(roles){ const m = this.mine(); if (!m) return; m.roles = roles; this.setMine(m); try { await Sync.db.doc(`${Sync.base()}/push/${m.id}`).set({ roles }, { merge:true }); } catch (e) {} },
  /* 알림 주소는 가끔 바뀐다 → 앱을 열 때 하루 한 번 새로 받아서 저장 */
  async refresh(){
    const m = this.mine(); if (!m || this.state() !== 'on' || Date.now() - (m.at || 0) < 86400000) return;
    try { await this.enable(m.roles); } catch (e) {}
  },
  test(){ notify(role() === 'mom' ? 'mom' : 'oppa', '🔔 알림 테스트: 이 알림이 폰에 오면 성공이에요'); },
};

/* 엄마·오빠 메뉴 맨 위: 알림을 아직 안 켠 폰이면 한 줄로 권하기 */
function pushNudge(){
  if (!linked() || role() === 'kid' || Push.state() !== 'off') return '';
  try { if (localStorage.getItem('jaeyun-push-later') === todayKey()) return ''; } catch (e) {}
  return `<div class="push-nudge"><span style="font-size:26px">🔔</span><span style="flex:1">재윤이가 공부를 끝내거나 받아쓰기를 보내면 <b>이 폰으로 알림</b>을 받을 수 있어요</span>
    <button class="btn small" data-a="pushon">알림 켜기</button><button class="btn ghost small" data-a="pushlater" aria-label="오늘은 그만 보기">나중에</button></div>`;
}
function pushPanel(){
  const st = Push.state(), m = Push.mine(), rs = (m && m.roles) || [role()];
  let body;
  if (st === 'unsupported') body = `<p class="muted" style="font-size:15px">이 브라우저에서는 폰 알림을 받을 수 없어요. 안드로이드는 <b>크롬</b>이나 <b>삼성 인터넷</b>에서 열어 주세요.${/iPhone|iPad/.test(navigator.userAgent) ? ' 아이폰은 사파리에서 "홈 화면에 추가"로 설치한 앱에서만 알림이 돼요.' : ''}</p>`;
  else if (st === 'nolink') body = `<p class="muted" style="font-size:15px">가족 기기 연결을 먼저 해 주세요.</p>`;
  else if (st === 'noserver') body = `<p class="muted" style="font-size:15px">오빠가 아래 <b>알림 · 메일 서버</b> 설정을 끝내면 이 폰으로 알림을 켤 수 있어요.</p>`;
  else if (st === 'nokey') body = `<p class="muted" style="font-size:15px">오빠가 아래에 <b>웹 푸시 키</b>를 넣으면 알림을 켤 수 있어요.</p>`;
  else if (st === 'denied') body = `<p class="demo-note">이 폰에서 알림이 막혀 있어요. 폰 <b>설정 → 애플리케이션 → (크롬 또는 삼성 인터넷) → 알림</b>, 또는 주소창 옆 자물쇠 → 권한 → 알림을 "허용"으로 바꾼 뒤 다시 와 주세요.</p>`;
  else if (st === 'off') body = `<p class="muted" style="font-size:15px">재윤이가 공부를 시작하거나 끝냈을 때, 받아쓰기 사진을 보냈을 때, 알림 시간이 지났는데 시작을 안 했을 때 이 폰으로 알려 줘요.</p><button class="btn" data-a="pushon">이 폰으로 알림 받기</button>`;
  else body = `<div class="row"><span style="flex:1">이 폰으로 알림 받는 중 ✓</span><button class="btn ghost small" data-a="pushtest">테스트</button></div>
    <div class="row" style="flex-wrap:wrap;gap:8px"><span class="muted" style="font-size:15px">받을 알림:</span>${[['mom','엄마 알림'],['oppa','오빠 알림']].map(([v, l]) => `<button class="btn small ${rs.includes(v) ? '' : 'ghost'}" data-a="pushrole" data-v="${v}">${rs.includes(v) ? '✓ ' : ''}${l}</button>`).join('')}</div>
    <button class="btn ghost small" data-a="pushoff" style="justify-self:start">이 폰 알림 끄기</button>`;
  const keyField = role() !== 'mom' && st !== 'unsupported' && st !== 'nolink' && st !== 'noserver' ? `<details ${st === 'nokey' ? 'open' : ''} style="margin-top:6px"><summary class="muted" style="font-size:14px">웹 푸시 키 (오빠가 한 번만 설정)</summary>
    <p class="muted" style="font-size:13px">Firebase 콘솔 → 프로젝트 설정 → <b>클라우드 메시징</b> → 웹 구성의 "웹 푸시 인증서" → 키 쌍 생성 → 나온 긴 키를 복사해서 붙여넣기. 가족 기기에 같이 저장돼요.</p>
    <div class="field"><input type="text" id="fcmkey" value="${esc(S.fcmKey || '')}" placeholder="B로 시작하는 긴 키" autocomplete="off"></div><button class="btn sky small" data-a="savefcmkey" style="justify-self:start">키 저장</button></details>` : '';
  return `<div class="panel"><h3>폰 알림</h3>${body}${Push.err ? `<p class="demo-note">${esc(Push.err)}</p>` : ''}${keyField}</div>`;
}
const PUSH_ACTIONS = {
  async pushon(el){ el.disabled = true; el.textContent = '켜는 중…'; const ok = await Push.enable(); toast(ok ? '알림을 켰어요! 테스트 알림을 보내 볼게요' : '알림을 켜지 못했어요'); if (ok) setTimeout(() => Push.test(), 800); go('adult'); },
  pushlater(){ try { localStorage.setItem('jaeyun-push-later', todayKey()); } catch (e) {} go('adult'); },
  async pushoff(){ await Push.disable(); toast('이 폰 알림을 껐어요'); go('adult'); },
  pushtest(){ Push.test(); toast('테스트 알림을 보냈어요. 몇 초 안에 와야 해요'); },
  async pushrole(el){ const m = Push.mine(); if (!m) return; const v = el.dataset.v, rs = new Set(m.roles || []); rs.has(v) ? rs.delete(v) : rs.add(v); if (!rs.size) return toast('하나는 골라 주세요'); await Push.setRoles([...rs]); go('adult'); },
  savefcmkey(){ const v = $('#fcmkey').value.trim(); if (v && !/^[A-Za-z0-9_-]{60,}$/.test(v)) return toast('키 모양이 이상해요. 긴 키 전체를 복사해 주세요'); S.fcmKey = v; save(); toast(v ? '키를 저장했어요. 이제 알림을 켤 수 있어요' : '키를 지웠어요'); go('adult'); },
};

Object.assign(ACT, PUSH_ACTIONS);
