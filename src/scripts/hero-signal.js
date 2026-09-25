// Homepage hero: one trace that morphs between a signature signal from each project.
// Chips switch the signal; the label links to that project's deep dive. Illustrative signals.
const cv = document.getElementById('heroSig');
if (cv) {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const AC = css('--ac'), MU = css('--mu'), LN = css('--ln');
  const chips = [...document.querySelectorAll('#heroChips button')], name = document.getElementById('heroSigName'), link = document.getElementById('heroSigLink');
  const N = 240, nz = i => { const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s) - .5; };
  const g = (u, c, w) => Math.exp(-(((u - c) / w) ** 2));
  const SIG = [
    { n: 'EMG burst', p: 'Wearable Robotics Lab', href: '/research/wearable-robotics', f: i => .5 + nz(i) * (.1 + g(i / N, .5, .14) * .85) },
    { n: 'Battery current spectrum', p: 'WHOOP', href: '/experience/whoop', f: i => { const u = i / N; return .1 + .55 * g(u, .18, .012) + .3 * g(u, .42, .015) + .16 * g(u, .66, .02) + Math.abs(nz(i)) * .04; } },
    { n: 'LAMP amplification', p: 'MediScan', href: '/projects/mediscan', f: i => .12 + .72 / (1 + Math.exp(-(i / N - .55) / .05)) + nz(i) * .01 },
    { n: 'Tone stack response', p: 'Guitar amp head', href: '/projects/amp-head', f: i => { const u = i / N; return .72 - .38 * g(u, .5, .16) + .05 * Math.sin(u * 3); } },
    { n: 'Plantar load, two steps', p: 'PWB Smart Insole', href: '/projects/pwb-insole', f: i => { const u = (i / N * 2) % 1; return .12 + .6 * g(u, .18, .08) + .5 * g(u, .52, .1); } },
  ];
  const D = SIG.map(s => Float32Array.from({ length: N }, (_, i) => Math.min(1, Math.max(0, s.f(i)))));
  let cur = 0, from = 0, t0 = performance.now(), hold = 0, vis = true;
  const go = (i, user) => {
    from = cur; cur = i; t0 = performance.now(); if (user) hold = t0 + 8000;
    chips.forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-pressed', String(j === i)); });
    name.textContent = SIG[i].n; link.textContent = SIG[i].p; link.href = SIG[i].href;
  };
  chips.forEach((b, i) => b.addEventListener('click', () => go(i, true)));
  go(0);
  new IntersectionObserver(e => vis = e[0].isIntersecting).observe(cv);
  const fit = () => { const d = Math.min(2, devicePixelRatio), w = cv.clientWidth, h = cv.clientHeight; if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); } const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return [x, w, h]; };
  function frame(t) {
    requestAnimationFrame(frame); if (!vis) return;
    if (!RM && t > hold && t - t0 > 3400) go((cur + 1) % SIG.length);
    const [x, w, h] = fit(); x.clearRect(0, 0, w, h);
    const k = RM ? 1 : Math.min(1, (t - t0) / 900), e = k < .5 ? 4 * k * k * k : 1 - ((-2 * k + 2) ** 3) / 2;
    x.strokeStyle = LN; x.lineWidth = 1;
    for (let i = 1; i < 10; i++) { x.beginPath(); x.moveTo(i * w / 10, 0); x.lineTo(i * w / 10, h); x.stroke(); }
    for (let j = 1; j < 4; j++) { x.beginPath(); x.moveTo(0, j * h / 4); x.lineTo(w, j * h / 4); x.stroke(); }
    x.strokeRect(.5, .5, w - 1, h - 1);
    const pad = 10, H = h - pad * 2;
    x.strokeStyle = AC; x.lineWidth = 1.6; x.beginPath();
    for (let i = 0; i < N; i++) { const v = D[from][i] + (D[cur][i] - D[from][i]) * e, px = i / (N - 1) * w, py = pad + H - v * H; i ? x.lineTo(px, py) : x.moveTo(px, py); }
    x.stroke();
    if (!RM) { const hi = Math.floor((t / 14) % N), v = D[cur][hi]; x.fillStyle = AC; x.beginPath(); x.arc(hi / (N - 1) * w, pad + H - v * H, 3, 0, 7); x.fill(); }
  }
  requestAnimationFrame(frame);
}
