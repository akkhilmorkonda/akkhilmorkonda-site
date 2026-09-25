// Homepage hero: engineering-drawing callouts around the headline (width dimension over the
// first line, a leader to the last word, datum A under the last line). Word boxes are measured
// live, so the marks follow whatever line breaks the browser picks. Decorative: aria-hidden.
const wrap = document.querySelector('.h-draw');
if (wrap) {
  const h1 = wrap.querySelector('h1'), svg = wrap.querySelector('svg');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; };
  let first = true;
  function draw() {
    svg.innerHTML = '';
    const W = wrap.getBoundingClientRect(), o = r => ({ l: r.left - W.left, t: r.top - W.top, r: r.right - W.left, b: r.bottom - W.top });
    const ws = [...h1.querySelectorAll('.w')].map(w => o(w.getBoundingClientRect()));
    if (!ws.length) return;
    const lines = []; ws.forEach(r => { const L = lines.find(l => Math.abs(l.t - r.t) < 4); L ? (L.r = Math.max(L.r, r.r), L.b = Math.max(L.b, r.b)) : lines.push({ ...r, first: r }); });
    const animate = first && !RM; first = false;
    const line = (x1, y1, x2, y2, cls, delay = 0) => {
      const p = el('path', { d: `M${x1} ${y1}L${x2} ${y2}`, class: cls });
      if (!animate) return;
      const L = Math.hypot(x2 - x1, y2 - y1) || 1; p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
      p.getBoundingClientRect(); p.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.16,1,.3,1)';
      setTimeout(() => p.style.strokeDashoffset = 0, 500 + delay);
    };
    const txt = (s, x, y, cls = '', anchor = 'middle') => {
      const t = el('text', { x, y, 'text-anchor': anchor, class: cls }); t.textContent = s;
      if (animate) { t.style.opacity = 0; t.style.transition = 'opacity .6s'; setTimeout(() => t.style.opacity = 1, 1200); }
    };
    // overall width of the first line
    const L1 = lines[0], y0 = L1.t - 14;
    line(L1.l, y0 - 5, L1.l, L1.t - 3, 'ln'); line(L1.r, y0 - 5, L1.r, L1.t - 3, 'ln'); line(L1.l, y0, L1.r, y0, 'lnA', 150);
    txt(`${Math.round(L1.r - L1.l)} ±0.5`, (L1.l + L1.r) / 2, y0 - 6, 'a');
    // leader and revision stamp below-right of the last word, flipped left when there is no room on the right
    const last = ws[ws.length - 1], ly = last.b + 16;
    let x1 = last.r - 6, ex = last.r + 28, sx = ex + 104;               // room on the right
    if (W.width - last.r <= 150) {
      if (last.l > 150) { x1 = last.l + 6; ex = last.l - 28; sx = ex - 104; }                       // room on the left
      else { x1 = ex = Math.min(last.r - 8, W.width - 112); sx = ex + 104; }                          // straight down
    }
    line(x1, last.b - 10, ex, ly, 'ln', 350); line(ex, ly, sx, ly, 'ln', 500);
    txt('TESTED  REV B', (ex + sx) / 2, ly - 6, 'a');
    // datum A under the start of the last line
    const LL = lines[lines.length - 1], dx = LL.first.l + 10, dy = LL.b + 14;
    line(dx, LL.b + 2, dx, dy, 'ln', 250); el('rect', { x: dx - 8, y: dy, width: 16, height: 15, class: 'ln' }); txt('A', dx, dy + 11);
  }
  document.fonts.ready.then(draw);
  let q; addEventListener('resize', () => { clearTimeout(q); q = setTimeout(draw, 120); });
}
