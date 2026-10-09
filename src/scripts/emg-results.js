// PoWeR Lab results: increase in mean max EMG at 10 cm and 15 cm perturbations, relative to 5 cm, for
// the phase where each muscle mattered most. Numbers are Akkhil's study results (Oct 2026 slide).
const c = document.getElementById('emgRes');
if (c) {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const FG = css('--fg'), MU = css('--mu'), LN = css('--ln'), AC = css('--ac');
  const D = [['Rectus femoris', 'swing', 13.7, 119.17], ['Biceps femoris', 'swing', 10.92, 48.65], ['Tibialis anterior', 'stance', 17.64, 42.35], ['Medial gastrocnemius', 'stance', 4.95, 11.88]];
  const x = c.getContext('2d'); let k = RM ? 1 : 0, raf = 0;
  function draw() {
    const r = c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio);
    if (c.width !== Math.round(r.width * d) || c.height !== Math.round(r.height * d)) { c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); }
    x.setTransform(d, 0, 0, d, 0, 0);
    const w = r.width, h = r.height, P = { l: 44, r: 12, t: 34, b: 62 }, W = w - P.l - P.r, H = h - P.t - P.b, MAX = 130;
    const fy = v => P.t + (1 - v / MAX) * H;
    x.clearRect(0, 0, w, h); x.font = '12px JetBrains Mono, monospace';
    [0, 40, 80, 120].forEach(v => { x.strokeStyle = LN; x.beginPath(); x.moveTo(P.l, fy(v)); x.lineTo(P.l + W, fy(v)); x.stroke(); x.fillStyle = MU; x.fillText(v + '%', 4, fy(v) + 4); });
    // legend
    x.fillStyle = MU; x.fillRect(P.l, 10, 10, 10); x.fillText('10 cm', P.l + 16, 19); x.fillStyle = AC; x.fillRect(P.l + 80, 10, 10, 10); x.fillStyle = MU; x.fillText('15 cm, vs 5 cm', P.l + 96, 19);
    const gw = W / D.length, bw = Math.min(46, gw * .3);
    D.forEach(([m, ph, a, b], i) => {
      const cx = P.l + gw * (i + .5);
      [[a, MU, -1], [b, AC, 1]].forEach(([v, col, s]) => {
        const X = cx + s * (bw / 2 + 3) - bw / 2, Y = fy(v * k);
        x.fillStyle = col; x.globalAlpha = col === MU ? .55 : 1; x.fillRect(X, Y, bw, fy(0) - Y); x.globalAlpha = 1;
        if (k > .98) { x.fillStyle = FG; const s2 = '+' + (v >= 100 ? Math.round(v) : v.toFixed(1)) + '%', tw = x.measureText(s2).width; x.fillText(s2, X + bw / 2 - tw / 2, Y - 6); }
      });
      // muscle name on one line if it fits its column, else one word per line; phase underneath
      const lines = x.measureText(m).width < gw - 10 ? [m] : m.split(' ');
      x.fillStyle = FG; lines.forEach((ln, j) => { const lw = x.measureText(ln).width; x.fillText(ln, cx - lw / 2, fy(0) + 18 + j * 15); });
      x.fillStyle = MU; const pw = x.measureText(ph).width; x.fillText(ph, cx - pw / 2, fy(0) + 18 + lines.length * 15 + 2);
    });
  }
  function grow(t0) { const step = n => { k = Math.min(1, (n - t0) / 900); k = 1 - (1 - k) ** 3; draw(); if (k < 1) raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); }
  new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { o.disconnect(); if (RM) draw(); else grow(performance.now()); } }, { threshold: .4 }).observe(c);
  draw(); addEventListener('resize', draw);
}
