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
      const img = new Image(); img.onload = () => {
        // 글씨가 있는 부분만 잘라서 줄을 꽉 채운다 (엄마가 채점할 때 크게 보이게)
        const [bx, by, bw, bh] = inkBox(img), sc = Math.min((W - 56) / bw, (H - 12) / bh, 2.2);
        x.drawImage(img, bx, by, bw, bh, 50, i * H + (H - bh * sc) / 2, bw * sc, bh * sc);
        if (--left === 0) res(cv.toDataURL('image/jpeg', .62)); };
      img.onerror = () => { if (--left === 0) res(cv.toDataURL('image/jpeg', .62)); }; img.src = src;
    });
  });
}

/* 진한 잉크(글씨)가 있는 사각형. 연한 안내선은 무시. 글씨가 없으면 그림 전체 */
function inkBox(img){
  try {
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height, c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y += 2) for (let xx = 0; xx < w; xx += 2) { const o = (y * w + xx) * 4; if (d[o] < 150 && d[o + 1] < 150) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    if (x1 < 0) return [0, 0, w, h];
    const pad = Math.round(Math.max(w, h) * .02); x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w, x1 + pad); y1 = Math.min(h, y1 + pad);
    return [x0, y0, Math.max(8, x1 - x0), Math.max(8, y1 - y0)];
  } catch (e) { return [0, 0, img.width, img.height]; }
}
