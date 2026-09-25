// PWB Smart Insole: illustrative gait cycle over five force-sensor sites, with a partial-weight-bearing limit.
const cv = document.getElementById('foot');
if (cv) {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const x = cv.getContext('2d');
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const AC = css('--ac'), FG = css('--fg'), MU = css('--mu'), LN = css('--ln');
  // sensor sites in foot coordinates (0..1 across, 0..1 heel to toe)
  const S = [
    { n: 'Heel', u: .5, v: .1, ph: .06 },
    { n: 'Lateral midfoot', u: .7, v: .42, ph: .28 },
    { n: '5th met head', u: .76, v: .7, ph: .45 },
    { n: '1st met head', u: .32, v: .72, ph: .5 },
    { n: 'Hallux', u: .3, v: .92, ph: .62 },
  ];
  const lim = document.getElementById('lim'), limV = document.getElementById('limV'), loadV = document.getElementById('loadV'), st = document.getElementById('pwbState'), bar = document.getElementById('loadBar'), mark = document.getElementById('limMark');
  let limit = +lim.value; const setL = () => { limit = +lim.value; limV.textContent = limit + '%'; mark.style.left = limit + '%'; }; lim.oninput = setL; setL();
  const weight = document.getElementById('wt'); let wscale = +weight.value / 100; weight.oninput = () => { wscale = weight.value / 100; document.getElementById('wtV').textContent = weight.value + '%'; };
  // per-site load over one stance phase (0..1): gaussian bumps rolling heel to toe
  const siteLoad = (s, p) => Math.exp(-(((p - s.ph) / .11) ** 2));
  let vis = true, p = 0, last = null, peak = 0; new IntersectionObserver(e => vis = e[0].isIntersecting).observe(cv);
  // plantar outline: closed Catmull-Rom spline through hand-placed points, plus five toes
  const OUT = [[.5, 0], [.72, .04], [.8, .14], [.8, .3], [.83, .46], [.9, .6], [.94, .72], [.9, .79], [.72, .85], [.47, .875], [.22, .87], [.1, .78], [.1, .66], [.2, .55], [.3, .42], [.28, .28], [.22, .16], [.28, .04]];
  const TOES = [[.27, .9, .11, .07], [.47, .885, .065, .05], [.615, .87, .055, .045], [.74, .845, .05, .04], [.85, .81, .042, .034]];
  function foot(w, h) {
    const cx = w / 2, top = h * .06, H = h * .88, W = H * .38; const P = (u, v) => [cx - W / 2 + u * W, top + (1 - v) * H];
    const pts = OUT.map(([u, v]) => P(u, v)), n = pts.length;
    x.beginPath(); x.moveTo(...pts[0]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      x.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    x.closePath(); x.fillStyle = '#1b1d20'; x.fill(); x.beginPath();
    TOES.forEach(([u, v, rx, ry]) => { const [X, Y] = P(u, v); x.moveTo(X + rx * W, Y); x.ellipse(X, Y, rx * W, ry * H, 0, 0, Math.PI * 2); });
    x.fillStyle = '#1b1d20'; x.fill('nonzero'); return P; }
  (function frame(t) { requestAnimationFrame(frame); if (!vis) { last = null; return; }
    if (last != null && !RM) p = (p + (t - last) / 1400) % 1; if (RM) p = .45; last = t;
    const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio); if (cv.width !== Math.round(r.width * d)) { cv.width = r.width * d; cv.height = r.height * d; x.setTransform(d, 0, 0, d, 0, 0); }
    const w = r.width, h = r.height; x.clearRect(0, 0, w, h); const P = foot(w, h);
    const stance = p < .75 ? p / .75 : null; let total = 0;
    S.forEach(s => { const L = stance == null ? 0 : siteLoad(s, stance); total += L; const [X, Y] = P(s.u, s.v);
      x.beginPath(); x.arc(X, Y, 10 + 22 * L, 0, Math.PI * 2); x.fillStyle = `rgba(22,236,154,${.08 + .5 * L})`; x.fill();
      x.beginPath(); x.arc(X, Y, 6, 0, Math.PI * 2); x.fillStyle = L > .05 ? AC : '#3a3a3e'; x.fill();
      x.fillStyle = MU; x.font = '11px JetBrains Mono, monospace'; x.fillText(s.n, X + (s.u > .5 ? 18 : -18 - x.measureText(s.n).width), Y + 4); });
    // total load as % body weight: peaks at the scenario weight scale
    const bw = Math.min(100, (total / 1.25) * 100 * wscale); peak = stance == null ? peak * .98 : Math.max(peak * .995, bw);
    loadV.textContent = Math.round(bw) + '%'; bar.style.width = bw + '%';
    const over = peak > limit; st.textContent = over ? 'Over limit' : 'Within limit'; st.className = 'pwb ' + (over ? 'over' : 'ok'); bar.classList.toggle('over', bw > limit);
  })(0);
}
