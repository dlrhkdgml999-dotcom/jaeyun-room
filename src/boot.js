/* 첫 화면 (모든 내용이 준비된 뒤에) */
(function boot(){
  // 카카오톡 안의 브라우저에서는 기록이 따로 저장되고 바탕화면 설치도 안 돼요 → 크롬으로 열기 안내
  if (/KAKAOTALK/i.test(navigator.userAgent)) {
    const url = location.href;
    app().innerHTML = `<section class="screen" style="justify-content:center;align-items:center;text-align:center">
      ${stageHTML(170, { expr:'wow', size:130 })}
      <h2>크롬에서 열어 주세요!</h2>
      <p class="bubble" style="font-size:19px">카카오톡 안에서 열면 기록이 따로 저장되고<br>바탕화면에 앱을 놓을 수 없어요.</p>
      <a class="btn big" href="kakaotalk://web/openExternal?url=${encodeURIComponent(url)}">크롬(인터넷)으로 열기</a>
      <p class="muted" style="font-size:15px">버튼이 안 되면 오른쪽 위 ⋮ 를 누르고<br>"다른 브라우저로 열기"를 눌러요.</p>
    </section>`;
    return;
  }
  const m = location.hash.match(/#join=([a-z0-9]{20,})/);
  if (m && !(S.local && S.local.fid === m[1])) { JOIN_FID = m[1]; return go('join'); }
  if (linked()) { Sync.start().then(() => { if (SCREEN === 'adult' || SCREEN === 'home') refreshIfIdle(); if (role() !== 'kid') Push.refresh(); }); if (role() !== 'kid' && !wrongRoleTablet()) { S.adultTab = S.adultTab === 'set' ? 'set' : role(); return go('adult'); } }
  go('home');
})();
/* 이미 열려 있는 앱에서 가족 링크(#join=…)를 열면 주소의 # 뒤만 바뀌어 다시 시작하지 않는다 → 그때도 역할 고르기 화면으로 (10/29) */
window.addEventListener('hashchange', () => {
  const m = location.hash.match(/#join=([a-z0-9]{20,})/);
  if (m && !(S.local && S.local.fid === m[1])) { JOIN_FID = m[1]; go('join'); }
});
