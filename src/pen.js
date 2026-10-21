/* ===================== 펜으로 받아쓰기 (태블릿) ===================== */
function penMode(){ const m = S.dictMode || 'auto'; if (m === 'pen') return true; if (m === 'paper') return false; return Math.min(screen.width, screen.height) >= 600; }
let PEN = { drawn:false };
function setupPen(nLines){
  const cv = $('#pen'); if (!cv) return;
  const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.fillStyle = '#fff'; x.fillRect(0, 0, r.width, r.height);
  const nl = nLines || 3; x.strokeStyle = '#CDEBE0'; x.lineWidth = 2; for (let i = 1; i < nl; i++) { const y = r.height * i / nl; x.beginPath(); x.moveTo(0, y); x.lineTo(r.width, y); x.stroke(); }
  x.strokeStyle = '#3A2530'; x.lineWidth = 4.5; x.lineCap = 'round'; x.lineJoin = 'round';
  PEN = { drawn:false, down:false, id:null, penSeen:PEN.penSeen || false, last:null };
  const pt = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  // 손바닥 무시: 펜을 한 번이라도 쓰면 그 뒤로는 손가락·손바닥 터치로 그리지 않는다. 그리는 중에는 처음 닿은 포인터 하나만 따라간다
  const ok = e => !(PEN.penSeen && e.pointerType === 'touch');
  const width = e => e.pointerType === 'pen' && e.pressure > 0 ? 2.8 + e.pressure * 3.4 : 4.5;   // 펜 누르는 힘에 따라 굵기
  const seg = (e, p) => { x.lineWidth = width(p); x.beginPath(); x.moveTo(PEN.last[0], PEN.last[1]); const q = pt(p); x.lineTo(q[0], q[1]); x.stroke(); PEN.last = q; };
  cv.onpointerdown = e => {
    e.preventDefault();
    if (e.pointerType === 'pen') { PEN.penSeen = true; if (PEN.down && PEN.id !== e.pointerId) PEN.down = false; }   // 손바닥이 먼저 닿았어도 펜이 이긴다
    if (!ok(e) || PEN.down) return;
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
    PEN.down = true; PEN.id = e.pointerId; PEN.last = pt(e);
    x.lineWidth = width(e); x.beginPath(); x.moveTo(PEN.last[0], PEN.last[1]); x.lineTo(PEN.last[0] + .1, PEN.last[1] + .1); x.stroke(); PEN.drawn = true;
  };
  cv.onpointermove = e => {
    if (!PEN.down || e.pointerId !== PEN.id) return; e.preventDefault();
    // 90Hz 화면: 사이사이 점까지 받아서 빠르게 쓴 획도 매끄럽게
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
    (list && list.length ? list : [e]).forEach(p => seg(e, p));
  };
  cv.onpointerup = cv.onpointercancel = e => { if (e.pointerId === PEN.id) { PEN.down = false; PEN.id = null; } };
}
function penImage(){ const cv = $('#pen'); return cv ? cv.toDataURL('image/jpeg', .6) : null; }
function composePen(dt){
  return new Promise(res => {
    const W = 760, H = 150, cv = document.createElement('canvas'); cv.width = W; cv.height = H * dt.words.length;
    const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height);
    let left = dt.words.length; if (!left) return res(null);
    dt.words.forEach((w, i) => {
      x.fillStyle = '#9B7C8B'; x.font = '22px sans-serif'; x.fillText(`${i + 1}.`, 8, i * H + 40);
      x.strokeStyle = '#EEE'; x.beginPath(); x.moveTo(0, (i + 1) * H - 1); x.lineTo(W, (i + 1) * H - 1); x.stroke();
      const src = (dt.pen || [])[i]; if (!src) { if (--left === 0) res(cv.toDataURL('image/jpeg', .6)); return; }
      const img = new Image(); img.onload = () => { const sc = Math.min((W - 50) / img.width, (H - 8) / img.height); x.drawImage(img, 46, i * H + 4, img.width * sc, img.height * sc); if (--left === 0) res(cv.toDataURL('image/jpeg', .62)); };
      img.onerror = () => { if (--left === 0) res(cv.toDataURL('image/jpeg', .62)); }; img.src = src;
    });
  });
}
