// Avanos pump failure fixture: one test cycle drawn like a scope sweep. Top trace is pump pressure
// (must stay above its limit once it has built up), bottom is motor current (must stay under its limit
// after inrush). A failing pump stalls: pressure sags while current spikes, and the fixture calls FAIL.
// Illustrative signals and limits, not Avanos data.
const root = document.getElementById('pump');
if (root) {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const FG = css('--fg'), MU = css('--mu'), LN = css('--ln'), AC = css('--ac'), RED = '#ff5a5a';
  const c = document.getElementById('pumpC'), x = c.getContext('2d'), vd = document.getElementById('pumpVd');
  const T = 6, PMIN = .84, IMAX = .78, P_ARM = 1.1, I_ARM = .7;          // cycle seconds, limits, when each limit arms
  let fail = 0, cycle = 0, t0 = performance.now(), vis = false, raf = 0, events = [], seed = 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const noise = (t, k) => Math.sin(t * 91.7 + k) * .5 + Math.sin(t * 213.3 + k * 2.1) * .3 + Math.sin(t * 37.1 + k * 4.3) * .2;
  function newCycle() { cycle++; seed = cycle * 7919 + 17; events = fail ? [1.9 + rnd() * .5, 3.6 + rnd() * .7] : []; }
  // stall bump: 0 away from an event, 1 at its peak
  const stall = t => events.reduce((m, e) => Math.max(m, Math.exp(-(((t - e) / .13) ** 2))), 0);
  const pressure = t => { const up = 1 - Math.exp(-t / .32); return up * (1 + .018 * Math.sin(t * 2 * Math.PI * 6)) + .012 * noise(t, cycle) - .3 * stall(t) * up; };
  const current = t => .44 + .5 * Math.exp(-t / .12) + .025 * Math.sin(t * 2 * Math.PI * 18) + .015 * noise(t, cycle + 3) + .5 * stall(t);
  const P = { l: 116, r: 18, t: 22, b: 30, gap: 30 };

  function draw(now) {
    const r = c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio);
    if (c.width !== Math.round(r.width * d) || c.height !== Math.round(r.height * d)) { c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); }
    x.setTransform(d, 0, 0, d, 0, 0);
    const w = r.width, h = r.height, narrow = w < 600; P.l = narrow ? 12 : 116;   // phones: labels sit inside the lanes
    const W = w - P.l - P.r, H = (h - P.t - P.b - P.gap) / 2;
    x.clearRect(0, 0, w, h); x.font = '12px JetBrains Mono, monospace'; x.lineWidth = 1;
    const fx = t => P.l + t / T * W;
    const lanes = [
      { name: 'Pressure', f: pressure, y0: P.t, lim: PMIN, arm: P_ARM, bad: v => v < PMIN, lo: 0, hi: 1.15 },
      { name: 'Motor current', f: current, y0: P.t + H + P.gap, lim: IMAX, arm: I_ARM, bad: v => v > IMAX, lo: .2, hi: 1.05 },
    ];
    let tripped = false;
    for (const L of lanes) {
      const fy = v => L.y0 + (1 - (v - L.lo) / (L.hi - L.lo)) * H;
      x.strokeStyle = LN; x.strokeRect(P.l + .5, L.y0 + .5, W, H);
      x.fillStyle = MU; x.fillText(L.name, narrow ? P.l + 8 : 8, L.y0 + (narrow ? 17 : 14));
      // limit line, armed after the build-up / inrush window
      x.setLineDash([4, 4]); x.strokeStyle = MU; x.beginPath(); x.moveTo(fx(L.arm), fy(L.lim)); x.lineTo(P.l + W, fy(L.lim)); x.stroke(); x.setLineDash([]);
      x.fillText('limit', P.l + W - 40, fy(L.lim) + (L.bad(0) ? 16 : -6));
      // trace up to the sweep time; out-of-limit stretches in red
      const N = Math.max(2, Math.round(W)), tEnd = Math.min(T, now);
      let prevBad = null; x.lineWidth = 1.6;
      for (let i = 0; i <= N; i++) {
        const t = i / N * T; if (t > tEnd) break;
        const v = L.f(t), bad = t >= L.arm && L.bad(v); if (bad) tripped = true;
        if (bad !== prevBad) { if (prevBad !== null) { x.lineTo(fx(t), fy(v)); x.stroke(); } x.strokeStyle = bad ? RED : FG; x.beginPath(); x.moveTo(fx(t), fy(v)); prevBad = bad; }
        else x.lineTo(fx(t), fy(v));
      }
      x.stroke(); x.lineWidth = 1;
    }
    // sweep cursor and time axis
    if (now < T) { x.strokeStyle = AC; x.globalAlpha = .6; x.beginPath(); x.moveTo(fx(now), P.t); x.lineTo(fx(now), h - P.b); x.stroke(); x.globalAlpha = 1; }
    x.fillStyle = MU; [0, 2, 4, 6].forEach(s => x.fillText(s + ' s', fx(s) - (s ? 22 : 0), h - 9));
    if (!narrow) x.fillText('Cycle ' + cycle, 8, h - 9);
    return tripped;
  }

  function verdict(state) {
    vd.classList.toggle('wait', state === 'wait'); vd.classList.toggle('flag', state === 'fail');
    vd.innerHTML = state === 'fail' ? '<span class="ico">!</span><b>FAIL</b>' : state === 'pass' ? '<span class="ico">&#10003;</span><b>PASS</b>' : '<b>TESTING</b>';
  }

  function frame(n) {
    raf = requestAnimationFrame(frame); if (!vis) return;
    let t = (n - t0) / 1000;
    if (t > T + 1.4) { t0 = n; t = 0; newCycle(); }                       // hold the finished trace briefly, then rerun
    const tripped = draw(t);
    verdict(tripped ? 'fail' : t >= T ? 'pass' : 'wait');
  }

  function still() { const tripped = draw(T); verdict(tripped ? 'fail' : 'pass'); }
  const btn = [...root.querySelectorAll('#pumpUnit button')];
  btn.forEach(b => b.addEventListener('click', () => { fail = +b.dataset.f; btn.forEach(q => q.classList.toggle('on', q === b)); newCycle(); t0 = performance.now(); if (RM) still(); }));
  newCycle();
  new IntersectionObserver(e => { const was = vis; vis = e[0].isIntersecting; if (vis && !was) t0 = performance.now(); }).observe(root);
  if (RM) { still(); addEventListener('resize', still); } else raf = requestAnimationFrame(frame);
  // dev-only: render the trace at time t for a healthy (0) or failing (1) pump (stripped from production builds)
  if (import.meta.env.DEV) window.__pump = { shot(t, f) { fail = f; newCycle(); const tr = draw(t); verdict(tr ? 'fail' : t >= T ? 'pass' : 'wait'); return c; } };
}
