// Scrolling EMG strip: raw signal -> rectified, low-passed envelope -> thresholded control output.
const cv = document.getElementById('emgC');
if (cv) {
  const btn = document.getElementById('emgFlex');
  const x = cv.getContext('2d');
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const AC = css('--ac'), FG = css('--fg'), MU = css('--mu'), LN = css('--ln');
  const N = 900, raw = new Float32Array(N), env = new Float32Array(N), ctl = new Uint8Array(N);
  let head = 0, e = 0, act = 0, target = 0, held = false, auto = 0, on = 0;
  const TH = 0.32;
  const g = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2832 * Math.random()); };
  function step() {
    // auto bursts when idle so the strip is never flat
    if (!held) { auto--; if (auto < 0) { target = target ? 0 : 0.55 + Math.random() * 0.4; auto = target ? 90 + Math.random() * 80 : 160 + Math.random() * 140; } }
    else target = 1;
    act += (target - act) * 0.06;
    const r = g() * (0.04 + 0.9 * act);
    e += (Math.abs(r) - e) * 0.035;            // rectify + first-order low-pass
    const envv = Math.min(1, e * 1.15);
    on = on ? (envv > TH * 0.8 ? 1 : 0) : (envv > TH ? 1 : 0); // hysteresis
    raw[head] = r; env[head] = envv; ctl[head] = on; head = (head + 1) % N;
  }
  for (let i = 0; i < N; i++) step();
  function size() {
    const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio);
    if (cv.width !== Math.round(r.width * d)) { cv.width = r.width * d; cv.height = r.height * d; x.setTransform(d, 0, 0, d, 0, 0); }
    return [r.width, r.height];
  }
  function draw() {
    const [w, h] = size(); x.clearRect(0, 0, w, h);
    const narrow = w < 560, L = narrow ? 12 : 72, W = w - L - 12, lane = h / 3;
    x.font = '12px JetBrains Mono, monospace'; x.fillStyle = MU; x.strokeStyle = LN; x.lineWidth = 1;
    ['raw', 'envelope', 'control'].forEach((t, i) => { x.fillText(t, 12, narrow ? lane * i + 14 : lane * i + lane / 2 + 4); if (i) { x.beginPath(); x.moveTo(0, lane * i); x.lineTo(w, lane * i); x.stroke(); } });
    const X = i => L + (i / (N - 1)) * W;
    // raw
    x.strokeStyle = FG; x.globalAlpha = .75; x.beginPath();
    for (let i = 0; i < N; i++) { const v = raw[(head + i) % N], y = lane / 2 - Math.max(-1, Math.min(1, v)) * lane * 0.42; i ? x.lineTo(X(i), y) : x.moveTo(X(i), y); }
    x.stroke(); x.globalAlpha = 1;
    // envelope + threshold
    const ey = v => lane * 2 - 8 - v * (lane - 30);
    x.setLineDash([4, 4]); x.strokeStyle = MU; x.beginPath(); x.moveTo(L, ey(TH)); x.lineTo(L + W, ey(TH)); x.stroke(); x.setLineDash([]);
    
    x.strokeStyle = AC; x.lineWidth = 1.5; x.beginPath();
    for (let i = 0; i < N; i++) { const y = ey(env[(head + i) % N]); i ? x.lineTo(X(i), y) : x.moveTo(X(i), y); }
    x.stroke();
    // control
    const lo = lane * 3 - 12, hi = lane * 2 + 22;
    x.beginPath();
    for (let i = 0; i < N; i++) { const y = ctl[(head + i) % N] ? hi : lo; i ? x.lineTo(X(i), y) : x.moveTo(X(i), y); }
    x.stroke();
    const g1 = ctl[(head + N - 1) % N]; x.fillStyle = g1 ? AC : MU; x.textAlign = 'right'; x.fillText(g1 ? 'GRIP' : 'OPEN', w - 12, lane * 2 + 14); x.textAlign = 'left';
  }
  let vis = false;
  new IntersectionObserver(en => vis = en[0].isIntersecting).observe(cv);
  (function loop() { requestAnimationFrame(loop); if (!vis) return; for (let i = 0; i < (RM ? 1 : 3); i++) step(); draw(); })();
  const set = v => { held = v; btn.setAttribute('aria-pressed', v); if (!v) { target = 0; auto = 120; } };
  btn.addEventListener('pointerdown', e => { e.preventDefault(); set(true); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, () => held && set(false)));
  btn.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); set(true); } });
  btn.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') set(false); });
  addEventListener('resize', draw);
}
