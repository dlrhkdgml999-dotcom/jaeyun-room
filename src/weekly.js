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
  subj.forEach(x => { if (x.rate !== null && x.rate >= 90) notes.push(`${x.name} 정답률 ${x.rate}%로 아주 잘하고 있어요.`); if (x.rate !== null && x.rate < 65) notes.push(`${x.name}는 ${x.rate}%로 조금 어려워해요. 같이 한 번 봐 주세요.`); if (x.failed.length) notes.push(`${x.name} "${x.failed[0]}" 차시를 다시 연습하고 있어요.`); });
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
function reportHTML(r){
  return `<div class="report">
    <div class="stat-row"><div class="stat"><b>${r.studied}일</b><span>공부한 날</span></div><div class="stat"><b>${r.mins}분</b><span>공부 시간</span></div><div class="stat"><b>${r.fullDays}일</b><span>다 끝낸 날</span></div></div>
    <div class="list">${r.subj.map(x => `<div class="li" style="flex-wrap:wrap"><span class="grow"><b class="disp" style="font-weight:400">${x.name}</b> · ${esc(x.now)}</span><span class="pill ok">통과 ${x.passed}</span>${x.rate !== null ? `<span class="pill ${x.rate >= 70 ? 'ok' : 'wait'}">${x.rate}%</span>` : ''}${x.medals ? `<span class="pill ok">🏅 ${x.medals}</span>` : ''}${x.lec.length ? `<span class="pill">📺 ${x.lec.length}편</span>` : ''}</div>`).join('')}</div>
    <p style="font-size:15px">받아쓰기 ${r.dict.length ? `${r.dict.length}번 · 평균 ${Math.round(r.dict.reduce((a, b) => a + b, 0) / r.dict.length * 10) / 10}점` : '채점 없음'} · 직접 쓴 글 ${r.writes}편${r.weak.length ? `<br>자주 틀리는 것: ${r.weak.map(esc).join(' / ')}` : ''}</p>
    <div class="bubble" style="font-family:var(--f-body);font-size:16px;line-height:1.6">💬 ${r.notes.map(esc).join(' ')}</div>
  </div>`;
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
let REP_SEL = null;
function reportPanel(){
  const list = Object.keys(S.reports || {}).sort().reverse();
  const sel = REP_SEL && S.reports[REP_SEL] ? REP_SEL : list[0];
  const r = sel ? S.reports[sel] : buildWeekReport(mondayOf(todayKey()));
  return `<div class="panel"><h3>📊 주간 리포트</h3>
    ${list.length > 1 ? `<div class="field"><select data-ch="repsel" aria-label="리포트 고르기">${list.map(k => `<option value="${k}" ${k === sel ? 'selected' : ''}>${shortDate(k)} ~ ${shortDate(addDays(k, 6))}</option>`).join('')}</select></div>` : ''}
    <p class="muted" style="font-size:14px">${sel ? `${shortDate(r.mon)} ~ ${shortDate(r.end)} 리포트` : `아직 지난주 리포트가 없어서 이번 주(${shortDate(r.mon)}~) 지금까지를 보여 드려요. 매주 월요일에 지난주 리포트가 와요.`}</p>
    ${reportHTML(r)}
    <button class="btn sky small" data-a="repshare" data-v="${sel || ''}" style="justify-self:start">카톡으로 보내기 · 복사</button>
  </div>`;
}
