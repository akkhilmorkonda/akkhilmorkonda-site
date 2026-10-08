// Avanos pump leak-test fixture: 10 Game Ready pumps held at 75 psi for 12 hours (compressed into a few
// seconds). A pump marked leaking loses pressure; when it falls past the leak threshold the LabVIEW logic
// flags it and cuts its power. Click a pump to toggle a leak. Illustrative traces; threshold not to scale.
const root = document.getElementById('pump');
if (root) {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const FG = css('--fg'), MU = css('--mu'), LN = css('--ln'), AC = css('--ac'), RED = '#ff5a5a';
  const c = document.getElementById('pumpC'), x = c.getContext('2d'), vd = document.getElementById('pumpVd'), grid = document.getElementById('pumpGrid');
  const HRS = 12, RUN = 9, HOLD = 2.2, SET = 75, LIM = 66, LO = 40, HI = 82;   // seconds per run, psi
  const leak = new Set([3]), start = {}, rate = {};                             // pump 4 leaks by default
  let t0 = performance.now(), vis = false;
  const seedFor = i => { start[i] = 1.5 + ((i * 37) % 10) * .55; rate[i] = 2.4 + ((i * 53) % 7) * .35; };   // leak onset (h) and psi per hour
  for (let i = 0; i < 10; i++) seedFor(i);
  const wob = (h, i) => .35 * Math.sin(h * 3.1 + i * 1.7) + .2 * Math.sin(h * 11.3 + i * 4.1);
  // pressure of pump i at hour h, and the hour its power was cut (Infinity if never)
  const cutAt = i => leak.has(i) ? start[i] + (SET - LIM) / rate[i] : Infinity;
  const psi = (i, h) => { const k = cutAt(i); if (h >= k) return Math.max(0, LIM - (h - k) * 60); const d = leak.has(i) && h > start[i] ? (h - start[i]) * rate[i] : 0; return SET - d + wob(h, i) * (h > .15 ? 1 : 0) - (h < .15 ? (1 - h / .15) * SET : 0); };

  const btns = [...Array(10)].map((_, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pchan'; b.innerHTML = `<span>P${i + 1}</span><b></b>`;
    b.addEventListener('click', () => { leak.has(i) ? leak.delete(i) : leak.add(i); t0 = performance.now(); if (RM) still(); });
    grid.appendChild(b); return b;
  });

  function draw(h) {
    const r = c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio);
    if (c.width !== Math.round(r.width * d) || c.height !== Math.round(r.height * d)) { c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); }
    x.setTransform(d, 0, 0, d, 0, 0);
    const w = r.width, H = r.height, narrow = w < 600, P = { l: narrow ? 44 : 64, r: 16, t: 18, b: 30 }, W = w - P.l - P.r, Hh = H - P.t - P.b;
    const fx = hr => P.l + hr / HRS * W, fy = p => P.t + (1 - (Math.min(HI, Math.max(LO, p)) - LO) / (HI - LO)) * Hh;
    x.clearRect(0, 0, w, H); x.font = '12px JetBrains Mono, monospace'; x.lineWidth = 1;
    x.strokeStyle = LN; x.strokeRect(P.l + .5, P.t + .5, W, Hh);
    x.fillStyle = MU; x.fillText(narrow ? '75' : '75 psi', 4, fy(SET) + 4); x.fillText('psi', 4, P.t + 10);
    [0, 3, 6, 9, 12].forEach(hr => x.fillText(hr + ' h', fx(hr) - (hr ? (hr === 12 ? 30 : 12) : 0), H - 9));
    x.setLineDash([4, 4]); x.strokeStyle = RED; x.globalAlpha = .7; x.beginPath(); x.moveTo(P.l, fy(LIM)); x.lineTo(P.l + W, fy(LIM)); x.stroke(); x.setLineDash([]); x.globalAlpha = 1;
    x.fillStyle = RED; x.fillText('leak threshold', P.l + W - 112, fy(LIM) + 16);
    const N = Math.max(60, Math.round(W / 2)), cuts = [];
    for (let i = 0; i < 10; i++) {
      const k = cutAt(i), bad = leak.has(i);
      x.strokeStyle = bad ? RED : FG; x.globalAlpha = bad ? 1 : .55; x.lineWidth = bad ? 1.8 : 1.2; x.beginPath();
      for (let j = 0; j <= N; j++) { const hr = j / N * HRS; if (hr > h || hr > k + .25) break; const X = fx(hr), Y = fy(psi(i, hr)); j ? x.lineTo(X, Y) : x.moveTo(X, Y); }
      x.stroke(); x.globalAlpha = 1;
      if (h >= k) cuts.push([i, k]);
    }
    x.lineWidth = 1;
    cuts.forEach(([i, k]) => { const X = fx(k), Y = fy(LIM); x.strokeStyle = RED; x.beginPath(); x.moveTo(X - 5, Y - 5); x.lineTo(X + 5, Y + 5); x.moveTo(X + 5, Y - 5); x.lineTo(X - 5, Y + 5); x.stroke(); x.fillStyle = RED; x.fillText(`P${i + 1} power cut`, Math.min(X + 8, P.l + W - 110), Y - 8); });
    if (h < HRS) { x.strokeStyle = AC; x.globalAlpha = .6; x.beginPath(); x.moveTo(fx(h), P.t); x.lineTo(fx(h), P.t + Hh); x.stroke(); x.globalAlpha = 1; }
    return cuts.map(([i]) => i);
  }

  function status(h, cut) {
    btns.forEach((b, i) => { const isCut = cut.includes(i), lk = leak.has(i);
      b.classList.toggle('leak', lk); b.classList.toggle('cut', isCut); b.querySelector('b').textContent = isCut ? 'CUT' : lk ? 'LEAK' : 'HOLD';
      b.setAttribute('aria-pressed', String(lk)); b.setAttribute('aria-label', `Pump ${i + 1}: ${isCut ? 'leak detected, power cut' : lk ? 'leaking' : 'holding pressure'}. Press to ${lk ? 'stop the leak' : 'make it leak'}.`); });
    const n = cut.length, done = h >= HRS;
    vd.classList.toggle('wait', !n && !done); vd.classList.toggle('flag', n > 0);
    vd.innerHTML = n ? `<span class="ico">!</span><b>${n} LEAK${n > 1 ? 'S' : ''}</b>` : done ? '<span class="ico">&#10003;</span><b>ALL HOLD</b>' : `<b>${Math.floor(h)} h</b>`;
  }

  function frame(n) {
    requestAnimationFrame(frame); if (!vis) return;
    let s = (n - t0) / 1000; if (s > RUN + HOLD) { t0 = n; s = 0; }
    const h = Math.min(HRS, s / RUN * HRS); status(h, draw(h));
  }
  function still() { status(HRS, draw(HRS)); }
  new IntersectionObserver(e => { const was = vis; vis = e[0].isIntersecting; if (vis && !was) t0 = performance.now(); }).observe(root);
  if (RM) { still(); addEventListener('resize', still); } else requestAnimationFrame(frame);
  // dev-only: render the run at hour h (stripped from production builds)
  if (import.meta.env.DEV) window.__pump = { shot(h) { status(h, draw(h)); return c; }, leak };
}
