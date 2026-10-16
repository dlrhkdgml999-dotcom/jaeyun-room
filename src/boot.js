/* 첫 화면 (모든 내용이 준비된 뒤에) */
(function boot(){
  const m = location.hash.match(/#join=([a-z0-9]{20,})/);
  if (m && !(S.local && S.local.fid === m[1])) { JOIN_FID = m[1]; return go('join'); }
  if (linked()) { Sync.start().then(() => { if (SCREEN === 'adult' || SCREEN === 'home') refreshIfIdle(); }); if (role() !== 'kid') { S.adultTab = S.adultTab === 'set' ? 'set' : role(); return go('adult'); } }
  go('home');
})();
