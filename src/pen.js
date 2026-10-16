/* ===================== 펜으로 받아쓰기 (태블릿) ===================== */
function penMode(){ const m = S.dictMode || 'auto'; if (m === 'pen') return true; if (m === 'paper') return false; return Math.min(screen.width, screen.height) >= 600; }
let PEN = { drawn:false };
function setupPen(){
  const cv = $('#pen'); if (!cv) return;
  const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  const x = cv.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.fillStyle = '#fff'; x.fillRect(0, 0, r.width, r.height);
  x.strokeStyle = '#CDEBE0'; x.lineWidth = 2; [r.height * .33, r.height * .66].forEach(y => { x.beginPath(); x.moveTo(0, y); x.lineTo(r.width, y); x.stroke(); });
  x.strokeStyle = '#3A2530'; x.lineWidth = 4.5; x.lineCap = 'round'; x.lineJoin = 'round';
  PEN = { drawn:false, down:false };
  const pt = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  cv.onpointerdown = e => { e.preventDefault(); cv.setPointerCapture && cv.setPointerCapture(e.pointerId); PEN.down = true; const [a, b] = pt(e); x.beginPath(); x.moveTo(a, b); x.lineTo(a + .1, b + .1); x.stroke(); PEN.drawn = true; };
  cv.onpointermove = e => { if (!PEN.down) return; e.preventDefault(); const [a, b] = pt(e); x.lineTo(a, b); x.stroke(); };
  cv.onpointerup = cv.onpointercancel = () => { PEN.down = false; };
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
