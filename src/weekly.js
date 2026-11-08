/* ===================== 주간 리포트 (엄마 · 오빠에게) ===================== */
/* 한 주 = 월~일. 새 주가 되면 재윤이 태블릿이 지난주 리포트를 만들어 가족 기록에 남기고,
   엄마·오빠 알림함에 알린다. 메일 주소를 설정해 두면 메일로도 보낸다 (오빠 구글 계정의 Apps Script로). */
function wrongLabel(w){
  const q = w.q || {}; const strip = h => String(h || '').replace(/<br>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  if (w.subj === 'dict') return `받아쓰기 '${q.w}'`;
  if (q.vis && /eq/.test(q.vis.k || '') ) return `${strip(q.vis.html).replace('?', '□')} (답 ${q.ans})`;
  if (q.vis && q.vis.k === 'html' && /class="eq"/.test(q.vis.html)) return `${strip(q.vis.html).replace('?', '□').slice(0, 30)} (답 ${q.ans})`;
  return `${String(q.prompt || '').slice(0, 24)} → ${String(q.ans).slice(0, 20)}`;
}
function mondayOf(k){ const [y, m, d] = k.split('-').map(Number); const t = new Date(y, m - 1, d); const dow = (t.getDay() + 6) % 7; return addDays(k, -dow); }
function buildWeekReport(mon){
  const keys = Array.from({ length:7 }, (_, i) => addDays(mon, i)), end = keys[6];
  const inWeek = k => k >= mon && k <= end;
  const days = keys.map(k => S.days[k]).filter(Boolean);
  const studied = keys.filter(k => S.days[k] && Object.values(S.days[k].boards || {}).some(b => b.done)).length;
  const fullDays = keys.filter(k => S.days[k] && S.days[k].done).length;
  const mins = keys.reduce((a, k) => a + dayMins(k).total, 0);   // 문제 + EBS 강의
  const acc = {}; ['kor','math','eng','rev'].forEach(s => acc[s] = [0, 0]);
  days.forEach(dy => Object.entries(dy.boards || {}).forEach(([s, bo]) => { if (!acc[s] || !bo.done) return; acc[s][0] += bo.correct; acc[s][1] += bo.n || (bo.qs || []).length; }));
  const subj = SUBJS.map(s => {
    const c = curr(s), passed = Object.entries(c.done).filter(([, d]) => d.pass && inWeek(d.date)).map(([id]) => id);
    const failed = Object.entries(c.done).filter(([, d]) => !d.pass && inWeek(d.date)).map(([id]) => id);
    const lec = keys.flatMap(k => lecturesOn(k).filter(x => x.s === s)).map(x => ({ n:x.info ? +x.info.no : x.n, mins:x.mins }));
    return { s, name:SUBJ_NAME[s], now:currLabel(s), passed:passed.length, failed:failed.filter(id => !passed.includes(id)).map(id => lessonById(id).title), medals:c.medals.filter(m => inWeek(m.date)).length, lec, rate:acc[s][1] ? Math.round(acc[s][0] / acc[s][1] * 100) : null };
  });
  const dict = keys.map(k => gradeOf(k)).filter(g => g.graded).map(g => g.score);
  const writes = keys.flatMap(k => Object.values((S.days[k] || {}).writes || {})).filter(w => w.img).length;
  const weak = [...S.wrong].filter(w => w.misses >= 2).sort((a, b) => b.misses - a.misses).slice(0, 3).map(wrongLabel);
  // 한 줄 총평
  const notes = [];
  const avail = keys.filter(k => k >= (S.firstDay || mon)).length;
  if (avail < 7 && studied >= avail - 1) notes.push(`${shortDate(S.firstDay)}에 시작해서 ${studied}일 공부했어요. 좋은 출발이에요!`);
  else if (studied >= 6) notes.push('거의 매일 공부했어요. 정말 꾸준해요!'); else if (studied >= 4) notes.push(`${studied}일 공부했어요.`); else notes.push(`이번 주는 ${studied}일만 공부했어요. 공부 시간 알람을 확인해 주세요.`);
  subj.forEach(x => { if (x.rate !== null && x.rate >= 90) notes.push(`${x.name} 정답률 ${x.rate}%로 아주 잘하고 있어요.`); if (x.rate !== null && x.rate < 65) notes.push(`${josa(x.name, "은", "는")} ${x.rate}%로 조금 어려워해요. 같이 한 번 봐 주세요.`); if (x.failed.length) notes.push(`${x.name} "${x.failed[0]}" 차시를 다시 연습하고 있어요.`); });
  const shortLec = subj.flatMap(x => x.lec.filter(l => l.mins && l.mins < 20).map(l => `${x.name} ${l.n}강`));
  if (shortLec.length) notes.push(`${shortLec.join(', ')}은 20분보다 짧게 봤어요.`);
  return { mon, end, studied, fullDays, mins, subj, rev:acc.rev[1] ? Math.round(acc.rev[0] / acc.rev[1] * 100) : null, dict, writes, weak, notes, gift:{ name:S.gift.name, done:giftDays().length, goal:S.gift.goal }, at:Date.now() };
}
function reportTitle(r){ return `재윤이 주간 리포트 (${shortDate(r.mon)} ~ ${shortDate(r.end)})`; }
function reportText(r){
  return [`📊 ${reportTitle(r)}`, `공부한 날 ${r.studied}일 (다 끝낸 날 ${r.fullDays}일) · 총 ${r.mins}분`,
    ...r.subj.map(x => `• ${x.name}: ${x.now} / 통과 ${x.passed}차시${x.medals ? ` · 메달 ${x.medals}` : ''}${x.rate !== null ? ` · 정답률 ${x.rate}%` : ''}${x.lec.length ? ` · 강의 ${x.lec.length}편` : ''}`),
    `• 받아쓰기: ${r.dict.length ? `${r.dict.length}번 · 평균 ${Math.round(r.dict.reduce((a, b) => a + b, 0) / r.dict.length * 10) / 10}점` : '채점 없음'} · 직접 쓴 글 ${r.writes}편`,
    r.weak.length ? `• 자주 틀리는 것: ${r.weak.join(' / ')}` : '', `💬 ${r.notes.join(' ')}`, r.gift.name ? `🎁 ${r.gift.name}까지 ${r.gift.done}/${r.gift.goal}일` : ''].filter(Boolean).join('\n');
}
function mailHTML(r){
  return `<div style="font-family:sans-serif;max-width:560px;line-height:1.6;color:#5B3A4A"><h2 style="color:#EE5F8D">📊 ${esc(reportTitle(r))}</h2>${esc(reportText(r)).split('\n').slice(1).map(l => `<p style="margin:6px 0">${l}</p>`).join('')}<p style="color:#9B7C8B;font-size:13px">재윤이 공부방에서 자동으로 보낸 메일이에요. 자세한 내용은 앱의 엄마·오빠 메뉴에서 볼 수 있어요.</p></div>`;
}
function sendReportMail(r, test){
  const m = S.mail || {}; if (!m.url || !/^https:\/\/script\.google\.com\//.test(m.url)) return false;
  try { fetch(m.url, { method:'POST', mode:'no-cors', headers:{ 'Content-Type':'text/plain' }, body:JSON.stringify({ key:m.key, subject:(test ? '[테스트] ' : '') + reportTitle(r), html:mailHTML(r) }) }).catch(() => {}); } catch (e) {}
  return true;
}
/* 재윤이 태블릿(또는 혼자 쓰는 기기)에서 새 주가 되면 지난주 리포트를 만든다 */
function maybeWeeklyReport(){
  if (!canWriteKid() || !S.started || !S.firstDay) return;
  const lastMon = addDays(mondayOf(todayKey()), -7);
  if (addDays(lastMon, 6) < S.firstDay) return;            // 지난주에는 아직 시작 전
  S.reports = S.reports || {};
  if (S.reports[lastMon]) return;
  const r = buildWeekReport(lastMon); S.reports[lastMon] = r;
  Object.keys(S.reports).sort().slice(0, -8).forEach(k => delete S.reports[k]);
  notify('mom', `📊 ${reportTitle(r)}가 도착했어요. 엄마 메뉴에서 볼 수 있어요`);
  notify('oppa', `📊 ${reportTitle(r)}가 도착했어요`);
  sendReportMail(r);
  save();
}
/* 11/5 오빠 "주간 리포트 보기 너무 안 좋아. 엄마가 자주 눌러 볼 수 있게 핵심만" →
   이번 주부터 ◀ ▶로 넘겨 보기, 큰 한 줄 · 요일 동그라미 · 과목별 얼굴 · 칭찬 한 줄 · 챙길 것 한 줄 */
let REP_W = 0;   // 0 = 이번 주, -1 = 지난주 …
const REP_FACE = r => r == null ? ['·', '아직 없음', 'none'] : r >= 85 ? ['😀', '잘해요', 'good'] : r >= 70 ? ['🙂', '괜찮아요', 'ok'] : ['😥', '어려워해요', 'hard'];
function repMinutes(m){ return m >= 60 ? `${Math.floor(m / 60)}시간${m % 60 ? ` ${m % 60}분` : ''}` : `${m}분`; }
function repLines(r, live){
  const good = [], care = [];
  const rated = r.subj.filter(x => x.rate != null).sort((a, b) => b.rate - a.rate);
  if (r.fullDays >= 5) good.push(`하루 공부를 ${r.fullDays}일이나 끝까지 했어요`);
  if (rated.length && rated[0].rate >= 85) good.push(`${josa(rated[0].name, '을', '를')} 아주 잘해요 (한 번에 정답 ${rated[0].rate}%)`);
  const moved = r.subj.filter(x => x.passed).map(x => `${x.name} ${x.passed}차시`);
  if (moved.length) good.push(`새로 배운 것: ${moved.join(' · ')}`);
  const hard = rated.filter(x => x.rate < 70).pop();
  if (hard) care.push(`${josa(hard.name, '을', '를')} 조금 어려워해요. 오답노트를 같이 풀어 주세요`);
  const again = r.subj.find(x => x.failed.length);
  if (!hard && again) care.push(`${again.name} "${again.failed[0]}" 차시를 다시 연습하는 중이에요`);
  const past = live ? Math.min(7, Math.round((new Date(todayKey()) - new Date(r.mon)) / 86400000) + 1) : 7;
  if (r.studied < past - 2) care.push(`${past}일 중 ${r.studied}일만 공부했어요. 공부 시간을 정해 두면 좋아요`);
  return { good:good[0] || (r.studied ? '꾸준히 하고 있어요' : ''), care:care[0] || '' };
}
function reportHTML(r, live){
  const keys = Array.from({ length:7 }, (_, i) => addDays(r.mon, i)), t = todayKey();
  const dot = k => { const dy = S.days[k], full = dy && dy.done, part = dy && Object.values(dy.boards || {}).some(b => b && b.done);
    const st = k > t ? 'future' : full ? 'full' : part ? 'part' : 'none';
    return `<span class="rep-dot ${st}"><i>${st === 'full' ? '✓' : st === 'part' ? '½' : ''}</i><small>${DOW[new Date(k).getDay()]}</small></span>`; };
  const L = repLines(r, live), head = r.studied ? `${r.studied}일 공부했어요<small>모두 ${repMinutes(r.mins)} (EBS 강의 포함)</small>` : (live ? '이번 주는 아직 공부 전이에요' : '이 주에는 공부 기록이 없어요');
  const dict = r.dict.length ? Math.round(r.dict.reduce((a, b) => a + b, 0) / r.dict.length * 10) / 10 : null;
  return `<div class="report rep2">
    <div class="rep-big">${r.studied >= 5 ? '🌟' : r.studied >= 3 ? '😊' : r.studied ? '🙂' : '🌙'} ${head}</div>
    <div class="rep-days">${keys.map(dot).join('')}</div>
    <div class="rep-subj">${r.subj.map(x => { const f = REP_FACE(x.rate); return `<div class="rep-s ${f[2]}"><b>${x.name}</b><span class="face">${f[0]}</span><span>${f[1]}${x.rate != null ? ` <small>${x.rate}%</small>` : ''}</span></div>`; }).join('')}
      ${dict != null ? `<div class="rep-s ${dict >= 8 ? 'good' : dict >= 6 ? 'ok' : 'hard'}"><b>받아쓰기</b><span class="face">✏️</span><span>평균 ${dict}점 <small>${r.dict.length}번</small></span></div>` : ''}</div>
    ${L.good ? `<p class="rep-line good">👍 ${esc(L.good)}</p>` : ''}${L.care ? `<p class="rep-line care">👀 ${esc(L.care)}</p>` : ''}
  </div>`;
}
function reportPanel(){
  const first = [S.firstDay || todayKey(), ...Object.keys(S.days || {})].sort()[0], minW = Math.min(0, Math.round((new Date(mondayOf(first)) - new Date(mondayOf(todayKey()))) / (7 * 86400000)));
  REP_W = clamp(REP_W, minW, 0);
  const mon = addDays(mondayOf(todayKey()), REP_W * 7), r = buildWeekReport(mon), live = REP_W === 0;
  return `<div class="panel rep-panel"><div class="rep-nav"><button class="icon-btn" data-a="repweek" data-v="-1" ${REP_W <= minW ? 'disabled' : ''} aria-label="지난주">◀</button>
      <b>${live ? '이번 주' : REP_W === -1 ? '지난주' : `${-REP_W}주 전`} <small>${shortDate(r.mon)}~${shortDate(r.end)}</small></b>
      <button class="icon-btn" data-a="repweek" data-v="1" ${live ? 'disabled' : ''} aria-label="다음 주">▶</button></div>
    ${reportHTML(r, live)}
    <button class="btn ghost small" data-a="repshare" data-v="${mon}" style="justify-self:start">카톡으로 보내기 · 복사</button>
  </div>`;
}
