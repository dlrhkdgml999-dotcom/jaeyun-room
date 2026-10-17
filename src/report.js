/* ===================== 오빠 메뉴: 주간 리포트 · 문제 검토 ===================== */
function weekReportPanel(){
  const keys = Array.from({ length:7 }, (_, i) => addDays(todayKey(), i - 6)), from = keys[0];
  const rows = SUBJS.map(s => {
    const c = curr(s), passed = Object.values(c.done).filter(d => d.pass && d.date >= from).length;
    const medals = c.medals.filter(m => m.date >= from).length, lecs = Object.entries(c.seen || {}).filter(([, v]) => v.d >= from);
    const mins = lecs.reduce((a, [, v]) => a + (v.mins || 0), 0);
    return `<div class="li" style="flex-wrap:wrap"><span class="grow"><b class="disp" style="font-weight:400">${SUBJ_NAME[s]}</b> · ${esc(currLabel(s))}</span>
      <span class="pill ok">통과 ${passed}차시</span>${medals ? `<span class="pill ok">🏅 ${medals}</span>` : ''}${CURRS[s].ebs ? `<span class="pill ${lecs.length ? 'ok' : 'wait'}">📺 ${lecs.length}편${mins ? ` · ${mins}분` : ''}</span>` : ''}</div>`;
  }).join('');
  const writes = keys.flatMap(k => Object.values((S.days[k] || {}).writes || {}).map(w => Object.assign({ k }, w))).filter(w => w.img);
  const dictScores = keys.map(k => gradeOf(k)).filter(g => g.graded).map(g => g.score);
  return `<div class="panel"><h3>이번 주 재윤이 (${shortDate(from)} ~ ${shortDate(keys[6])})</h3>
    <div class="list">${rows}</div>
    <p style="font-size:15px">받아쓰기 ${dictScores.length ? `${dictScores.length}번 · 평균 ${Math.round(dictScores.reduce((a, b) => a + b, 0) / dictScores.length * 10) / 10}점` : '채점된 것 없음'} · 직접 쓴 글 ${writes.length}편</p>
    ${writes.length ? `<div class="row" style="gap:8px;overflow-x:auto">${writes.slice(-3).map(w => `<img src="${w.img}" alt="재윤이가 쓴 글" style="height:90px;border-radius:10px;border:2px solid var(--line);background:#fff">`).join('')}</div>` : ''}
  </div>`;
}
/* 문제 검토: 오빠가 차시별 문제를 넘겨 보며 이상한 것을 표시 → 복사해서 Claude에게 */
let REV = { lesson:'1-1', q:null };
function reviewQ(){ try { REV.q = lessonQ(lessonById(REV.lesson)); } catch (e) { REV.q = null; } }
function reviewPanel(){
  if (!REV.q) reviewQ();
  const q = REV.q, notes = S.reviewNotes || [];
  const opts = SUBJS.map(s => `<optgroup label="${SUBJ_NAME[s]}">${CURRS[s].all.map(l => `<option value="${l.id}" ${l.id === REV.lesson ? 'selected' : ''}>${l.unit.n}-${l.li + 1} ${esc(l.title)}</option>`).join('')}</optgroup>`).join('');
  const ans = q ? (q.input === 'choice' ? q.opts.map(o => `<span class="pill ${String(o) === String(q.ans) ? 'ok' : ''}">${String(o) === String(q.ans) ? '✔ ' : ''}${q.optHtml && q.optHtml[o] && !q.sayOpts ? q.optHtml[o] : esc(o)}</span>`).join(' ') : `<span class="pill ok">정답: ${esc(q.ans)}</span>`) : '';
  return `<div class="panel"><h3>문제 검토 (오빠용)</h3>
    <p class="muted" style="font-size:14px">차시를 골라 문제를 넘겨 보다가 이상한 문제는 "이상해요"를 눌러 주세요. 다 보면 "검토 내용 복사"를 눌러 Claude에게 붙여 넣으면 고쳐요. 여기서 본 건 재윤이 기록에 안 들어가요.</p>
    <div class="field"><select id="revlesson" data-ch="revlesson" aria-label="검토할 차시">${opts}</select></div>
    ${q ? `<div class="q-card" style="padding:14px">
      <p class="q-prompt" style="font-size:19px">${esc(q.prompt)}</p>
      ${q.vis ? `<div class="q-visual" style="transform:scale(.85);transform-origin:top center">${visHTML(q)}</div>` : ''}
      ${q.listen ? `<p class="muted" style="font-size:14px">🔊 읽어 주는 말: ${esc(q.listen)}</p>` : ''}
      <div class="row" style="flex-wrap:wrap;gap:6px">${ans}</div>
      <p class="muted" style="font-size:13px">힌트: ${esc(q.hint || '')}<br>풀이: ${esc(String(q.explain || ''))}</p>
    </div>` : '<p class="muted">이 차시는 문제를 만들 수 없어요</p>'}
    <div class="field"><input type="text" id="revmemo" maxlength="80" placeholder="이상한 점 한 줄 (선택)"></div>
    <div class="row" style="flex-wrap:wrap"><button class="btn small mint" data-a="revnext">괜찮아요 · 다음 문제</button><button class="btn small" data-a="revbad">이상해요</button></div>
    ${notes.length ? `<p style="font-size:15px">표시한 문제 <b>${notes.length}</b>개</p><div class="row" style="flex-wrap:wrap"><button class="btn sky small" data-a="revcopy">검토 내용 복사</button><button class="btn ghost small" data-a="revclear">목록 비우기</button></div>` : ''}
  </div>`;
}
function reviewText(){
  return (S.reviewNotes || []).map((n, i) => `${i + 1}. [${n.lesson}] ${n.prompt} | 보기: ${n.opts} | 정답: ${n.ans}${n.memo ? ` | 메모: ${n.memo}` : ''}`).join('\n');
}
