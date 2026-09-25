// Guitar amp head: Fender-style bass/mid/treble tone stack response (Yeh and Smith closed form, '59 Bassman values).
const cv = document.getElementById('tone');
if (cv) {
  const R1 = 250e3, R2 = 1e6, R3 = 25e3, R4 = 56e3, C1 = 250e-12, C2 = 20e-9, C3 = 20e-9, K = C1 * C2 * C3;
  function H(f, t, m, l) {
    const b1 = t*C1*R1 + m*C3*R3 + l*(C1*R2 + C2*R2) + (C1*R3 + C2*R3);
    const b2 = t*(C1*C2*R1*R4 + C1*C3*R1*R4) - m*m*(C1*C3*R3*R3 + C2*C3*R3*R3) + m*(C1*C3*R1*R3 + C1*C3*R3*R3 + C2*C3*R3*R3) + l*(C1*C2*R1*R2 + C1*C2*R2*R4 + C1*C3*R2*R4) + l*m*(C1*C3*R2*R3 + C2*C3*R2*R3) + (C1*C2*R1*R3 + C1*C2*R3*R4 + C1*C3*R3*R4);
    const b3 = l*m*(K*R1*R2*R3 + K*R2*R3*R4) - m*m*(K*R1*R3*R3 + K*R3*R3*R4) + m*(K*R1*R3*R3 + K*R3*R3*R4) + t*K*R1*R3*R4 - t*m*K*R1*R3*R4 + t*l*K*R1*R2*R4;
    const a1 = (C1*R1 + C1*R3 + C2*R3 + C2*R4 + C3*R4) + m*C3*R3 + l*(C1*R2 + C2*R2);
    const a2 = m*(C1*C3*R1*R3 - C2*C3*R3*R4 + C1*C3*R3*R3 + C2*C3*R3*R3) + l*m*(C1*C3*R2*R3 + C2*C3*R2*R3) - m*m*(C1*C3*R3*R3 + C2*C3*R3*R3) + l*(C1*C2*R2*R4 + C1*C2*R1*R2 + C1*C3*R2*R4 + C2*C3*R2*R4) + (C1*C2*R1*R4 + C1*C3*R1*R4 + C1*C2*R3*R4 + C1*C2*R1*R3 + C1*C3*R3*R4 + C2*C3*R3*R4);
    const a3 = l*m*(K*R1*R2*R3 + K*R2*R3*R4) - m*m*(K*R1*R3*R3 + K*R3*R3*R4) + m*(K*R3*R3*R4 + K*R1*R3*R3 - K*R1*R3*R4) + l*K*R1*R2*R4 + K*R1*R3*R4;
    const w = 2 * Math.PI * f, nr = -b2*w*w, ni = b1*w - b3*w*w*w, dr = 1 - a2*w*w, di = a1*w - a3*w*w*w;
    return 20 * Math.log10(Math.hypot(nr, ni) / Math.hypot(dr, di));
  }
  const x = cv.getContext('2d'), css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const AC = css('--ac'), MU = css('--mu'), LN = css('--ln'), FG = css('--fg');
  const knobs = [...document.querySelectorAll('.aknob')]; const val = { bass: .5, mid: .5, treble: .5 };
  knobs.forEach(k => { const key = k.dataset.k; let sy = null, sv = 0;
    const set = v => { val[key] = Math.min(1, Math.max(0, v)); k.style.setProperty('--rot', (-135 + 270 * val[key]) + 'deg'); k.setAttribute('aria-valuenow', Math.round(val[key] * 10)); k.nextElementSibling.querySelector('b').textContent = (val[key] * 10).toFixed(1); draw(); };
    k.addEventListener('pointerdown', e => { sy = e.clientY; sv = val[key]; k.setPointerCapture(e.pointerId); });
    k.addEventListener('pointermove', e => { if (sy != null) set(sv + (sy - e.clientY) / 140); });
    k.addEventListener('pointerup', () => sy = null);
    k.addEventListener('keydown', e => { if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { set(val[key] + .05); e.preventDefault(); } if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { set(val[key] - .05); e.preventDefault(); } });
    k.addEventListener('wheel', e => { e.preventDefault(); set(val[key] - e.deltaY / 900); }, { passive: false });
    k._set = set; });
  const P = { l: 44, r: 16, t: 16, b: 28 }, fmin = 20, fmax = 20000, lo = -30, hi = 0;
  let hov = null; cv.addEventListener('pointermove', e => { hov = e.clientX - cv.getBoundingClientRect().left; draw(); }); cv.addEventListener('pointerleave', () => { hov = null; draw(); });
  function draw() {
    const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio); if (cv.width !== Math.round(r.width * d)) { cv.width = r.width * d; cv.height = r.height * d; x.setTransform(d, 0, 0, d, 0, 0); }
    const w = r.width, h = r.height, W = w - P.l - P.r, Hh = h - P.t - P.b;
    const fx = f => P.l + Math.log10(f / fmin) / Math.log10(fmax / fmin) * W, fy = db => P.t + (1 - (Math.max(lo, Math.min(hi, db)) - lo) / (hi - lo)) * Hh, xf = X => fmin * Math.pow(fmax / fmin, (X - P.l) / W);
    x.clearRect(0, 0, w, h); x.strokeStyle = LN; x.fillStyle = MU; x.font = '11px JetBrains Mono, monospace'; x.lineWidth = 1;
    [0, -10, -20, -30].forEach(v => { const y = fy(v); x.beginPath(); x.moveTo(P.l, y); x.lineTo(w - P.r, y); x.stroke(); x.fillText(v + ' dB', 2, y + 4); });
    [[20, '20'], [100, '100'], [1000, '1k'], [10000, '10k'], [20000, '20k Hz']].filter(([f]) => w > 560 || f !== 10000).forEach(([f, l]) => x.fillText(l, Math.min(w - 44, fx(f) - 6), h - 8));
    // flat reference: all knobs at 5
    x.strokeStyle = '#3a3a3e'; x.setLineDash([4, 4]); x.beginPath(); for (let X = P.l; X <= w - P.r; X += 2) { const y = fy(H(xf(X), .5, .5, .5)); X === P.l ? x.moveTo(X, y) : x.lineTo(X, y); } x.stroke(); x.setLineDash([]);
    x.strokeStyle = AC; x.lineWidth = 2.2; x.beginPath(); for (let X = P.l; X <= w - P.r; X += 2) { const y = fy(H(xf(X), val.treble, val.mid, val.bass)); X === P.l ? x.moveTo(X, y) : x.lineTo(X, y); } x.stroke();
    if (hov != null && hov > P.l && hov < w - P.r) { const f = xf(hov), db = H(f, val.treble, val.mid, val.bass); x.fillStyle = FG; x.beginPath(); x.arc(hov, fy(db), 4, 0, 7); x.fill();
      const t = document.getElementById('tTone'); t.innerHTML = `${f < 1000 ? Math.round(f) + ' Hz' : (f / 1000).toFixed(1) + ' kHz'}<br><b>${db.toFixed(1)} dB</b>`; t.style.left = Math.min(w - 110, hov + 12) + 'px'; t.style.top = '12px'; t.style.opacity = 1; }
    else document.getElementById('tTone').style.opacity = 0;
  }
  document.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => { const p = { flat: [.5, .5, .5], scoop: [.8, .1, .8], mids: [.4, 1, .4] }[b.dataset.preset]; knobs.forEach((k, i) => k._set(p[i])); document.querySelectorAll('[data-preset]').forEach(o => o.classList.toggle('on', o === b)); });
  knobs.forEach(k => k._set(.5)); addEventListener('resize', draw);
}
document.querySelectorAll('.aknob').forEach(k => ['pointerdown', 'keydown'].forEach(ev => k.addEventListener(ev, () => document.querySelectorAll('[data-preset]').forEach(o => o.classList.remove('on')))));
