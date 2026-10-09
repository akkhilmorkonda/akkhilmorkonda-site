// PoWeR Lab: the EMG processing pipeline, run live on an illustrative signal. A perturbation hits at
// t = 0; step through raw, bandpass (20 to 450 Hz, 4th-order Butterworth as two biquad pairs), full-wave
// rectification, moving RMS envelope (75 ms), normalization to the trial maximum, and threshold onset
// detection (baseline mean + 3 SD, held 25 ms). Perturbation size scales the illustrative response.
const root = document.getElementById('emgPipe');
if (root) {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const FG = css('--fg'), MU = css('--mu'), LN = css('--ln'), AC = css('--ac'), RED = '#ff5a5a';
  const c = root.querySelector('canvas'), x = c.getContext('2d'), desc = root.querySelector('#epDesc');
  const out = { lat: root.querySelector('#epLat'), pk: root.querySelector('#epPk'), rec: root.querySelector('#epRec') };
  const FS = 2000, T0 = -.5, T1 = 1.5, N = Math.round((T1 - T0) * FS), t = i => T0 + i / FS;
  const STAGES = [
    ['Raw', 'Raw EMG from the electrode: muscle activity riding on motion artifact from the platform and 60 Hz mains hum.'],
    ['Bandpass', '20 to 450 Hz, 4th-order Butterworth. Strips the slow motion artifact and keeps the muscle band.'],
    ['Rectify', 'Full-wave rectification: absolute value, so amplitude can be measured.'],
    ['RMS envelope', '75 ms moving RMS window turns the rectified signal into a smooth activation envelope.'],
    ['Normalize', 'Scaled to the trial maximum (or the participant\'s MVC) so subjects can be compared.'],
    ['Onset', 'Threshold at baseline mean + 3 SD, held for 25 ms. Gives reflex latency, peak and recovery.'],
  ];
  let stage = 0, size = 10, data = null;

  // seeded noise so each perturbation size always draws the same trial
  let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = () => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
  // RBJ biquad (Direct Form I), forward pass
  function biquad(sig, type, f0, Q) {
    const w = 2 * Math.PI * f0 / FS, cw = Math.cos(w), al = Math.sin(w) / (2 * Q);
    let b0, b1, b2; if (type === 'hp') { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; } else { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; }
    const a0 = 1 + al, a1 = -2 * cw, a2 = 1 - al, y = new Float64Array(sig.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < sig.length; i++) { const v = (b0 * sig[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0; x2 = x1; x1 = sig[i]; y2 = y1; y1 = v; y[i] = v; }
    return y;
  }
  function build() {
    seed = size * 7919 + 3;
    const amp = { 5: .45, 10: .7, 15: 1 }[size], L = .1 + rnd() * .03, raw = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      const s = t(i), act = .07 + (s > L ? amp * (1 - Math.exp(-(s - L) / .02)) * Math.exp(-(s - L) / .28) : 0);
      const artifact = .35 * Math.sin(2 * Math.PI * 1.6 * s + 1) + (s > 0 && s < .35 ? .9 * Math.sin(Math.PI * s / .35) : 0);
      raw[i] = act * gauss() + artifact + .05 * Math.sin(2 * Math.PI * 60 * s);
    }
    let bp = raw; [['hp', 20, .5412], ['hp', 20, 1.3066], ['lp', 450, .5412], ['lp', 450, 1.3066]].forEach(([k, f, q]) => bp = biquad(bp, k, f, q));
    const rect = bp.map(Math.abs), W = Math.round(.075 * FS), env = new Float64Array(N);
    let acc = 0; for (let i = 0; i < N; i++) { acc += bp[i] * bp[i]; if (i >= W) acc -= bp[i - W] * bp[i - W]; env[i] = Math.sqrt(Math.max(0, acc) / Math.min(i + 1, W)); }
    // shift the trailing window so the envelope is centred on each sample
    const envC = new Float64Array(N); for (let i = 0; i < N; i++) envC[i] = env[Math.min(N - 1, i + (W >> 1))];
    const mx = Math.max(...envC), norm = envC.map(v => v / mx);
    const base = []; for (let i = 0; t(i) < 0; i++) base.push(norm[i]);
    const mu = base.reduce((a, b) => a + b, 0) / base.length, sd = Math.sqrt(base.reduce((a, b) => a + (b - mu) ** 2, 0) / base.length), thr = mu + 3 * sd;
    const hold = Math.round(.025 * FS); let on = -1;
    for (let i = Math.round(-T0 * FS); i < N - hold && on < 0; i++) { let ok = true; for (let k = 0; k < hold; k++) if (norm[i + k] <= thr) { ok = false; break; } if (ok) on = i; }
    let pk = on; for (let i = on; i > 0 && i < N; i++) if (norm[i] > norm[pk]) pk = i;
    let off = -1; for (let i = pk; i > 0 && i < N; i++) if (norm[i] < thr) { off = i; break; }
    data = { raw, bp, rect, env: envC, norm, thr, on, pk, off, mx };
  }

  function draw() {
    const r = c.getBoundingClientRect(), d = Math.min(2, devicePixelRatio);
    if (c.width !== Math.round(r.width * d) || c.height !== Math.round(r.height * d)) { c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); }
    x.setTransform(d, 0, 0, d, 0, 0);
    const w = r.width, h = r.height, P = { l: 16, r: 16, t: 26, b: 30 }, W = w - P.l - P.r, H = h - P.t - P.b;
    x.clearRect(0, 0, w, h); x.font = '12px JetBrains Mono, monospace';
    const fx = s => P.l + (s - T0) / (T1 - T0) * W;
    const series = [data.raw, data.bp, data.rect, data.env, data.norm, data.norm][stage];
    const signed = stage < 2, lo = signed ? -Math.max(...series.map(Math.abs)) : 0, hi = signed ? -lo : (stage >= 4 ? 1.05 : Math.max(...series) * 1.05);
    const fy = v => P.t + (1 - (v - lo) / (hi - lo)) * H;
    x.strokeStyle = LN; x.strokeRect(P.l + .5, P.t + .5, W, H);
    // perturbation marker
    x.strokeStyle = MU; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(fx(0), P.t); x.lineTo(fx(0), P.t + H); x.stroke(); x.setLineDash([]);
    x.fillStyle = MU; x.fillText('perturbation', Math.min(fx(0) + 6, w - 110), P.t - 9);
    // faint previous stage behind the current one (same scale only when both are unsigned or both signed)
    const draw1 = (arr, col, lw, alpha) => { x.strokeStyle = col; x.lineWidth = lw; x.globalAlpha = alpha; x.beginPath(); const step = Math.max(1, Math.floor(N / (W * 1.5)));
      for (let i = 0; i < N; i += step) { let v = arr[i]; if (step > 1) for (let k = 1; k < step && i + k < N; k++) if (Math.abs(arr[i + k]) > Math.abs(v)) v = arr[i + k]; const X = fx(t(i)), Y = fy(v); i ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke(); x.globalAlpha = 1; x.lineWidth = 1; };
    if (stage === 3) draw1(data.rect, MU, 1, .35);
    draw1(series, stage >= 3 ? AC : FG, stage >= 3 ? 2 : 1, stage >= 3 ? 1 : .85);
    if (stage === 5 && data.on > 0) {
      const Y = fy(data.thr); x.strokeStyle = RED; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(P.l, Y); x.lineTo(P.l + W, Y); x.stroke(); x.setLineDash([]);
      x.fillStyle = RED; x.fillText('threshold', P.l + 6, Y - 6);
      const xo = fx(t(data.on)); x.strokeStyle = FG; x.beginPath(); x.moveTo(xo, P.t); x.lineTo(xo, P.t + H); x.stroke();
      x.fillStyle = FG; x.fillText('onset', xo + 6, P.t + 16);
      // latency bracket
      const yb = P.t + H - 14; x.strokeStyle = FG; x.beginPath(); x.moveTo(fx(0), yb); x.lineTo(xo, yb); x.stroke();
      const xp = fx(t(data.pk)), yp = fy(data.norm[data.pk]); x.fillStyle = AC; x.beginPath(); x.arc(xp, yp, 4, 0, 7); x.fill();
      if (data.off > 0) { const xf = fx(t(data.off)); x.strokeStyle = MU; x.beginPath(); x.moveTo(xf, P.t); x.lineTo(xf, P.t + H); x.stroke(); x.fillStyle = MU; x.fillText('recovered', xf + 6, P.t + 16); }
    }
    x.fillStyle = MU; (w < 560 ? [0, 500, 1000] : [-500, 0, 500, 1000, 1500]).forEach(ms => { const X = fx(ms / 1000); x.fillText(ms + ' ms', Math.max(P.l, Math.min(X - 18, w - P.r - 56)), h - 9); });
    x.fillText(['volts (a.u.)', 'volts (a.u.)', '|volts| (a.u.)', 'RMS (a.u.)', 'fraction of trial max', 'fraction of trial max'][stage], P.l + 6, P.t + 16 + (stage === 5 ? 18 : 0));
  }
  function readouts() {
    const show = stage === 5 && data.on > 0, ms = i => Math.round(t(i) * 1000);
    out.lat.textContent = show ? `${ms(data.on)} ms` : '-';
    out.pk.textContent = show ? `${Math.round(data.norm[data.pk] * 100)}% at ${ms(data.pk)} ms` : '-';
    out.rec.textContent = show && data.off > 0 ? `${ms(data.off) - ms(data.on)} ms` : '-';
    desc.textContent = STAGES[stage][1];
  }
  const stBtns = [...root.querySelectorAll('#epStage button')], szBtns = [...root.querySelectorAll('#epSize button')];
  const set = () => { stBtns.forEach((b, i) => b.classList.toggle('on', i === stage)); szBtns.forEach(b => b.classList.toggle('on', +b.dataset.s === size)); readouts(); draw(); };
  stBtns.forEach((b, i) => b.addEventListener('click', () => { stage = i; set(); }));
  szBtns.forEach(b => b.addEventListener('click', () => { size = +b.dataset.s; build(); set(); }));
  root.querySelector('#epNext').addEventListener('click', () => { stage = (stage + 1) % STAGES.length; set(); });
  build(); set(); addEventListener('resize', () => draw());
  if (import.meta.env.DEV) window.__ep = { set(s, z) { stage = s; if (z) { size = z; build(); } set(); return c; } };
}
