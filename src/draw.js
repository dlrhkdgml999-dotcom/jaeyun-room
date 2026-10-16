/* ===================== 그림 도구 (수 모형 · 도형 · 자 · 쌓기나무) ===================== */
const C = { ink:'#5B3A4A', pink:'#FF8FB1', pinkD:'#EE5F8D', sky:'#8CC9FF', skyD:'#3E93E0', mint:'#7FD8BE', mintD:'#2FA884', butter:'#FFE08A', butterD:'#E7A500', lav:'#C3ADF2', paper:'#FFFFFF', line:'#E8D6DD' };

/* 수 모형: 백(10×10 판), 십(막대), 일(작은 정육면체) */
function baseTenSVG(h, t, o, opt = {}){
  const u = opt.unit || 9, gap = 10, pad = 6;
  const hw = u * 10, rows = [];
  let x = pad, svg = '';
  for (let i = 0; i < h; i++) {
    svg += `<g transform="translate(${x} ${pad})"><rect width="${hw}" height="${hw}" rx="3" fill="${C.skyD}" stroke="${C.ink}" stroke-width="2"/>`;
    for (let k = 1; k < 10; k++) svg += `<line x1="${k * u}" y1="0" x2="${k * u}" y2="${hw}" stroke="#BFE0FF" stroke-width="1"/><line x1="0" y1="${k * u}" x2="${hw}" y2="${k * u}" stroke="#BFE0FF" stroke-width="1"/>`;
    svg += '</g>'; x += hw + gap;
  }
  for (let i = 0; i < t; i++) {
    svg += `<g transform="translate(${x} ${pad})"><rect width="${u}" height="${hw}" rx="2" fill="${C.pink}" stroke="${C.ink}" stroke-width="2"/>`;
    for (let k = 1; k < 10; k++) svg += `<line x1="0" y1="${k * u}" x2="${u}" y2="${k * u}" stroke="#FFD0DE" stroke-width="1"/>`;
    svg += '</g>'; x += u + 5;
  }
  if (t) x += gap - 5;
  const oCols = Math.ceil(o / 5);
  for (let i = 0; i < o; i++) { const cx = x + Math.floor(i / 5) * (u + 4), cy = pad + hw - (i % 5 + 1) * (u + 4) + 4; svg += `<rect x="${cx}" y="${cy}" width="${u}" height="${u}" rx="2" fill="${C.butter}" stroke="${C.ink}" stroke-width="2"/>`; }
  x += oCols * (u + 4);
  const W = Math.max(x + pad, 40), H = hw + pad * 2;
  return `<svg class="draw" viewBox="0 0 ${W} ${H}" width="${Math.min(W * (opt.scale || 1.15), 640)}" style="max-width:100%;height:auto" role="img" aria-label="백 모형 ${h}개, 십 모형 ${t}개, 일 모형 ${o}개">${svg}</svg>`;
}

/* 도형 */
const SHAPES = {
  tri1:{ k:'tri', pts:[[50,8],[92,88],[8,88]] }, tri2:{ k:'tri', pts:[[12,20],[90,60],[20,92]] }, tri3:{ k:'tri', pts:[[10,86],[90,86],[25,14]] },
  quad1:{ k:'quad', pts:[[10,20],[90,20],[90,80],[10,80]] }, quad2:{ k:'quad', pts:[[22,22],[78,22],[78,78],[22,78]] }, quad3:{ k:'quad', pts:[[28,18],[88,30],[74,86],[10,70]] },
  pent:{ k:'pent', reg:5 }, hex:{ k:'hex', reg:6 }, circ:{ k:'circ' }, oval:{ k:'circ', oval:true },
  open3:{ k:'not', path:'M50 10 L92 88 L8 88 L40 26' }, curve3:{ k:'not', path:'M50 8 Q100 60 90 88 L8 88 Z' }, open4:{ k:'not', path:'M10 30 L10 84 L88 84 L88 20 L30 20' },
};
const SHAPE_NAME = { tri:'삼각형', quad:'사각형', pent:'오각형', hex:'육각형', circ:'원' };
function regPts(n){ return Array.from({ length:n }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [50 + 42 * Math.cos(a), 52 + 42 * Math.sin(a)]; }); }
function shapePts(id){ const s = SHAPES[id]; return s.reg ? regPts(s.reg) : s.pts; }
function shapeSVG(id, size = 88, opt = {}){
  const s = SHAPES[id]; const fill = opt.fill || C.lav;
  let body;
  if (s.k === 'circ') body = s.oval ? `<ellipse cx="50" cy="50" rx="44" ry="30" fill="${fill}" stroke="${C.ink}" stroke-width="4"/>` : `<circle cx="50" cy="50" r="40" fill="${fill}" stroke="${C.ink}" stroke-width="4"/>`;
  else if (s.path) body = `<path d="${s.path}" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`;
  else {
    const pts = shapePts(id);
    body = `<polygon points="${pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="${fill}" stroke="${C.ink}" stroke-width="4" stroke-linejoin="round"/>`;
    if (opt.marks) body += pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="5.5" fill="${C.pinkD}"/>`).join('');
  }
  return `<svg class="draw" viewBox="-4 -4 108 108" width="${size}" height="${size}" aria-hidden="true">${body}</svg>`;
}

/* 쌓기나무: 한 줄로 놓인 기둥들 (모두 보이게) */
function cubesSVG(heights, opt = {}){
  const s = 26, dx = 13, dy = 9; let svg = '';
  const W = heights.length * s + dx + 10, maxH = Math.max(...heights), H = maxH * s + dy + 10;
  heights.forEach((h, i) => { for (let j = 0; j < h; j++) {
    const x = 5 + i * s, y = H - 5 - (j + 1) * s;
    const hi = opt.hi && opt.hi[0] === i && opt.hi[1] === j;
    const [top, side, front] = hi ? ['#FFC2D4', C.pinkD, C.pink] : ['#FFE9A8', C.butterD, C.butter];
    svg += `<polygon points="${x},${y} ${x + dx},${y - dy} ${x + s + dx},${y - dy} ${x + s},${y}" fill="${top}" stroke="${C.ink}" stroke-width="1.6"/>`;
    svg += `<polygon points="${x + s},${y} ${x + s + dx},${y - dy} ${x + s + dx},${y + s - dy} ${x + s},${y + s}" fill="${side}" stroke="${C.ink}" stroke-width="1.6"/>`;
    svg += `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${front}" stroke="${C.ink}" stroke-width="1.6"/>`;
  } });
  return `<svg class="draw" viewBox="0 -${dy} ${W} ${H + dy}" width="${Math.min(W * 2.2, 380)}" style="max-width:100%;height:auto" role="img" aria-label="쌓기나무">${svg}</svg>`;
}

/* 자: 0~15 cm, 물건(막대)을 start~end에 놓기 */
function rulerSVG(start, end, opt = {}){
  const cm = 22, L = opt.len || 15, W = L * cm + 30, x0 = 15;
  let svg = `<rect x="${x0 + start * cm}" y="6" width="${(end - start) * cm}" height="26" rx="6" fill="${opt.color || C.pink}" stroke="${C.ink}" stroke-width="2"/>`;
  if (opt.label) svg += `<text x="${x0 + (start + end) / 2 * cm}" y="24" font-size="13" text-anchor="middle" fill="${C.ink}" font-family="Jua, sans-serif">${opt.label}</text>`;
  svg += `<rect x="4" y="40" width="${W - 8}" height="46" rx="6" fill="#FFF8E6" stroke="${C.ink}" stroke-width="2"/>`;
  for (let i = 0; i <= L * 10; i++) { const x = x0 + i * cm / 10, big = i % 10 === 0, mid = i % 5 === 0; svg += `<line x1="${x}" y1="40" x2="${x}" y2="${40 + (big ? 20 : mid ? 14 : 8)}" stroke="${C.ink}" stroke-width="${big ? 2 : 1}"/>`; if (big) svg += `<text x="${x}" y="78" font-size="13" text-anchor="middle" fill="${C.ink}" font-family="Jua, sans-serif">${i / 10}</text>`; }
  svg += `<line x1="${x0 + start * cm}" y1="32" x2="${x0 + start * cm}" y2="40" stroke="${C.pinkD}" stroke-width="2" stroke-dasharray="3 2"/><line x1="${x0 + end * cm}" y1="32" x2="${x0 + end * cm}" y2="40" stroke="${C.pinkD}" stroke-width="2" stroke-dasharray="3 2"/>`;
  return `<svg class="draw" viewBox="0 0 ${W} 90" width="${W}" style="max-width:100%;height:auto" role="img" aria-label="자">${svg}</svg>`;
}

/* 클립으로 재기 */
function clipsSVG(n, label){
  const cw = 34, W = n * cw + 20; let svg = `<rect x="10" y="6" width="${n * cw}" height="22" rx="6" fill="${C.mint}" stroke="${C.ink}" stroke-width="2"/>`;
  if (label) svg += `<text x="${10 + n * cw / 2}" y="22" font-size="13" text-anchor="middle" fill="${C.ink}" font-family="Jua, sans-serif">${label}</text>`;
  for (let i = 0; i < n; i++) { const x = 10 + i * cw; svg += `<rect x="${x + 2}" y="38" width="${cw - 4}" height="14" rx="7" fill="none" stroke="${C.skyD}" stroke-width="3"/><rect x="${x + 7}" y="42" width="${cw - 14}" height="6" rx="3" fill="none" stroke="${C.skyD}" stroke-width="2"/>`; }
  return `<svg class="draw" viewBox="0 0 ${W} 58" width="${Math.min(W * 1.3, 520)}" style="max-width:100%;height:auto" role="img" aria-label="클립 ${n}개 길이">${svg}</svg>`;
}

/* 칠교판: 정사각형 하나를 일곱 조각으로 (삼각형 5, 사각형 2) */
const TANGRAM = [
  { n:1, k:'tri',  pts:[[0,0],[100,0],[50,50]],          c:'#FF8FB1' },
  { n:2, k:'tri',  pts:[[0,0],[50,50],[0,100]],          c:'#8CC9FF' },
  { n:3, k:'tri',  pts:[[100,0],[100,50],[75,25]],       c:'#FFE08A' },
  { n:4, k:'quad', pts:[[50,50],[75,25],[100,50],[75,75]], c:'#7FD8BE' },
  { n:5, k:'tri',  pts:[[50,50],[75,75],[25,75]],        c:'#C3ADF2' },
  { n:6, k:'quad', pts:[[0,100],[25,75],[75,75],[50,100]], c:'#FFB38A' },
  { n:7, k:'tri',  pts:[[100,50],[100,100],[50,100]],    c:'#F7A8C8' },
];
function tangramSVG(o = {}){
  const size = o.size || 210;
  const body = TANGRAM.map(p => {
    const cx = p.pts.reduce((s, q) => s + q[0], 0) / p.pts.length, cy = p.pts.reduce((s, q) => s + q[1], 0) / p.pts.length;
    const dim = o.hi && o.hi !== p.n;
    return `<polygon points="${p.pts.map(q => q.join(',')).join(' ')}" fill="${dim ? '#F4EEF1' : p.c}" stroke="${C.ink}" stroke-width="1.8" stroke-linejoin="round"/>` +
      (o.nums ? `<circle cx="${cx}" cy="${cy}" r="6.5" fill="#fff" stroke="${C.ink}" stroke-width="1"/><text x="${cx}" y="${cy + 3.3}" font-size="9" text-anchor="middle" font-family="Jua, sans-serif" fill="${C.ink}">${p.n}</text>` : '');
  }).join('');
  return `<svg class="draw" viewBox="-3 -3 106 106" width="${size}" height="${size}" role="img" aria-label="칠교판">${body}</svg>`;
}
/* 작은 삼각형 두 조각을 붙여 만든 모양 */
function twoTriSVG(kind, size = 90){
  const shapes = {
    square:[[[0,0],[60,0],[0,60]], [[60,0],[60,60],[0,60]]],
    tri:[[[0,60],[60,60],[60,0]], [[60,0],[60,60],[120,60]]],
    para:[[[0,60],[40,0],[40,60]], [[40,0],[80,0],[40,60]]],
  }[kind];
  const W = kind === 'tri' ? 120 : kind === 'para' ? 80 : 60;
  return `<svg class="draw" viewBox="-4 -4 ${W + 8} 68" width="${size * (W + 8) / 68}" height="${size}" aria-hidden="true">${shapes.map((p, i) => `<polygon points="${p.map(q => q.join(',')).join(' ')}" fill="${i ? '#C3ADF2' : '#FFE08A'}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>`).join('')}</svg>`;
}

/* 묶음 그림 (곱셈) */
function groupsHTML(e, g, each){ return `<div class="groups">${Array.from({ length:g }, () => `<span class="grp-box">${e.repeat(each)}</span>`).join('')}</div>`; }

/* 수를 한글로 읽기 (1~9999) */
const KDIG = ['','일','이','삼','사','오','육','칠','팔','구'];
function numKo(n){
  if (n === 0) return '영';
  const units = [[1000,'천'],[100,'백'],[10,'십'],[1,'']]; let s = '';
  for (const [u, name] of units) { const d = Math.floor(n / u) % 10; if (!d) continue; s += (d === 1 && u > 1 ? '' : KDIG[d]) + name; }
  return s;
}
