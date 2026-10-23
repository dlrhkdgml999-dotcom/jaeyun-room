/* ===================== 폰 알림: ntfy 앱 (무료 · 서버 없음, 2026-10-24) =====================
   - 알림이 생긴 기기(대개 재윤이 태블릿)가 ntfy.sh로 바로 보낸다 → 엄마·오빠 폰의 ntfy 앱이 알림을 띄운다
   - 받는 곳(토픽)은 가족 번호로 만든 비밀 주소: 엄마용 · 오빠용 두 개. 모든 기기가 같은 주소를 계산해서 따로 맞출 필요 없음
   - 폰에서 할 일: ntfy 앱 설치 → 앱에 있는 "알림 연결" 링크(ntfy://ntfy.sh/토픽) 한 번 누르기
   - 인터넷이 끊겨 못 보낸 알림은 기기에 쌓아 두었다가 다시 보냄 (3시간 지나면 버림)
   - 공부 알림 시간이 지났는데 시작 안 했다는 알림은 서버가 없어서 못 보냄 (태블릿이 꺼져 있으면 보낼 기기가 없음)
   - S.ntfyOff: true면 안 보냄 (ADULT_KEYS, 가족 기기에 같이 저장)                                                   */
const NTFY_HOST = 'ntfy.sh', NTFY_URL = 'https://ntfy.sh/', NTFY_APP = 'https://play.google.com/store/apps/details?id=io.heckel.ntfy';
const NTFY_LS = 'jaeyun-ntfyq', APP_LINK = 'https://dlrhkdgml999-dotcom.github.io/jaeyun-room/';
const NTFY_WHO = { mom:'엄마', oppa:'오빠' };
function ntfyTopic(who){ return linked() ? `jaeyun-${who}-${hashStr(S.local.fid + '|' + who + '|ntfy')}` : ''; }
function ntfyLink(who){ return `ntfy://${NTFY_HOST}/${ntfyTopic(who)}?display=${encodeURIComponent('재윤이 공부방' + (who === 'oppa' ? ' (오빠)' : ''))}`; }
const Ntfy = {
  on(){ return linked() && !S.ntfyOff; },
  q(){ try { return JSON.parse(localStorage.getItem(NTFY_LS) || '[]'); } catch (e) { return []; } },
  setQ(q){ try { localStorage.setItem(NTFY_LS, JSON.stringify(q.slice(-30))); } catch (e) {} },
  send(n){ if (!this.on() || !NTFY_WHO[n.to]) return; const q = this.q(); q.push({ to:n.to, text:n.text, at:n.at || Date.now() }); this.setQ(q); this.flush(); },
  busy:false,
  async flush(){
    if (!this.on() || this.busy) return; this.busy = true;
    try {
      let q = this.q().filter(x => Date.now() - x.at < 3 * 3600000);
      for (const x of q.slice()) {
        const big = /모두 끝냈어요|받아쓰기|못하고|못 보내|⚠️/.test(x.text);
        try {
          const r = await fetch(NTFY_URL, { method:'POST', headers:{ 'Content-Type':'application/json' },
            body:JSON.stringify({ topic:ntfyTopic(x.to), title:'재윤이 공부방', message:String(x.text).slice(0, 400), priority:big ? 4 : 3, click:APP_LINK }) });
          if (!r.ok && r.status !== 400) break;   // 너무 많이 보냄(429) · 서버 문제 → 다음에. 400(내용 문제)은 다시 보내도 안 되니 버림
          q = q.filter(y => y !== x);
        } catch (e) { break; }   // 인터넷이 안 되면 다음에
      }
      this.setQ(q);
    } finally { this.busy = false; }
  },
  doneKey(who){ return `jaeyun-ntfy-${who}`; },
  done(who){ try { return localStorage.getItem(this.doneKey(who)) === (S.local && S.local.fid); } catch (e) { return false; } },
  setDone(who, v){ try { v ? localStorage.setItem(this.doneKey(who), S.local.fid) : localStorage.removeItem(this.doneKey(who)); } catch (e) {} },
};
window.addEventListener('online', () => Ntfy.flush());
document.addEventListener('visibilitychange', () => { if (!document.hidden) Ntfy.flush(); });

/* 폰 하나에서 할 3단계 (who = 엄마 / 오빠 알림) */
function ntfyStepsHTML(who, big){
  const sz = big ? '' : 'small';
  return `<ol class="ntfy-steps">
    <li><span>Play 스토어에서 <b>ntfy</b> 앱 설치</span><a class="btn ${sz} ghost" href="${NTFY_APP}" target="_blank" rel="noopener">설치하러 가기</a></li>
    <li><span>설치가 끝나면 이 버튼 → <b>ntfy로 열기</b> → <b>구독(Subscribe)</b></span><a class="btn ${sz}" href="${ntfyLink(who)}" data-a="ntfylink" data-v="${who}">알림 연결하기</a></li>
    <li><span>시험 알림이 이 폰에 오면 끝!</span><button class="btn ${sz} mint" data-a="ntfytest" data-v="${who}">시험 알림 보내기</button></li>
  </ol>`;
}
/* 엄마·오빠 메뉴 맨 위: 이 폰을 아직 연결 안 했으면 권하기 */
function ntfyNudge(){
  if (!linked() || role() === 'kid' || !NTFY_WHO[role()] || !Ntfy.on() || Ntfy.done(role())) return '';
  try { if (localStorage.getItem('jaeyun-ntfy-later') === todayKey()) return ''; } catch (e) {}
  return `<div class="push-nudge" style="display:grid;gap:8px"><div class="row" style="gap:8px"><span style="font-size:26px">🔔</span><span style="flex:1"><b>이 폰으로 재윤이 소식 알림 받기</b><br><span class="muted" style="font-size:14px">공부 시작 · 다 끝냄 · 받아쓰기 채점할 것 (2분이면 돼요)</span></span></div>
    ${ntfyStepsHTML(role(), false)}
    <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn small" data-a="ntfyok" data-v="${role()}">알림 잘 와요 ✓</button><button class="btn ghost small" data-a="ntfylater">나중에</button></div></div>`;
}
function ntfyPanel(){
  if (!linked()) return '';
  const me = role();
  return `<div class="panel"><h3>🔔 폰 알림 <span class="muted" style="font-size:14px">(ntfy 앱 · 무료)</span></h3>
    <p class="muted" style="font-size:15px">재윤이가 공부를 시작하거나 끝냈을 때, 받아쓰기를 보냈을 때, 주간 리포트가 왔을 때 폰으로 알려 줘요. 폰마다 아래 3단계를 한 번만 하면 돼요.</p>
    ${['mom','oppa'].map(w => `<details class="ntfy-who" ${w === me && !Ntfy.done(w) ? 'open' : ''}><summary><b>${NTFY_WHO[w]} 알림</b> 받기${w === me ? ' <span class="pill">이 폰</span>' : ''}${Ntfy.done(w) ? ' <span class="pill ok">연결됨 ✓</span>' : ''}</summary>
      ${ntfyStepsHTML(w, false)}
      <p class="muted" style="font-size:13px">${w === 'mom' ? '엄마 폰에서 하면 돼요. 오빠 폰에서도 하면 엄마 알림을 오빠도 같이 받아요.' : '오빠 폰에서 하면 돼요.'} 링크가 안 열리면 ntfy 앱에서 <b>+</b> → 아래 이름을 넣고 구독.</p>
      <div class="row" style="gap:8px"><input type="text" readonly value="${esc(ntfyTopic(w))}" style="flex:1;min-width:0;font-size:13px;border:2px solid var(--line);border-radius:10px;padding:6px 8px" aria-label="${NTFY_WHO[w]} 알림 이름"><button class="btn ghost small" data-a="ntfycopy" data-v="${w}">복사</button></div>
      ${Ntfy.done(w) ? `<button class="btn ghost small" data-a="ntfyok" data-v="${w}" data-off="1" style="justify-self:start">이 폰 "연결됨" 표시 지우기</button>` : `<button class="btn ghost small" data-a="ntfyok" data-v="${w}" style="justify-self:start">이 폰에 알림 잘 와요 ✓</button>`}
    </details>`).join('')}
    <div class="row" style="margin-top:6px"><span style="flex:1">알림 보내기 ${S.ntfyOff ? '<b>꺼짐</b>' : '켜짐'}<br><span class="muted" style="font-size:13px">끄면 가족 모든 폰에 알림이 안 가요</span></span><button class="switch ${S.ntfyOff ? '' : 'on'}" data-a="ntfytoggle" aria-label="폰 알림 보내기"></button></div>
    <p class="muted" style="font-size:13px">알림이 늦게 오면: ntfy 앱 → 해당 알림 → 설정에서 <b>즉시 전달(Instant delivery)</b>을 켜 주세요. 알림 이름은 가족 링크처럼 비밀이니 다른 사람에게 알려 주지 마세요.</p>
  </div>`;
}
Object.assign(ACT, {
  ntfylink(el){ /* 링크는 그대로 열리고, 눌렀다는 것만 기억 */ try { sessionStorage.setItem('jaeyun-ntfy-tapped', el.dataset.v); } catch (e) {} },
  ntfytest(el){ const w = el.dataset.v; if (!Ntfy.on()) return toast('알림 보내기가 꺼져 있어요'); notify(w, `🔔 ${NTFY_WHO[w]} 알림 시험: 이 알림이 보이면 연결 성공이에요!`); toast('시험 알림을 보냈어요. 몇 초 안에 와야 해요'); },
  ntfyok(el){ const w = el.dataset.v; Ntfy.setDone(w, !el.dataset.off); if (!el.dataset.off) toast('좋아요! 이제 이 폰으로 알림이 와요'); go('adult'); },
  ntfylater(){ try { localStorage.setItem('jaeyun-ntfy-later', todayKey()); } catch (e) {} go('adult'); },
  ntfycopy(el){ const t = ntfyTopic(el.dataset.v); try { navigator.clipboard.writeText(t).then(() => toast('복사했어요'), () => toast(t)); } catch (e) { toast(t); } },
  ntfytoggle(){ S.ntfyOff = !S.ntfyOff; save(); toast(S.ntfyOff ? '폰 알림을 껐어요' : '폰 알림을 켰어요'); go('adult'); },
});
