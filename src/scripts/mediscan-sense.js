// MediScan sensing stack: one NAAT channel in cross-section (blue LED -> well -> green emission -> photodiode)
// next to the four channels' amplification curves over a 20 minute run. Illustrative model: curve shapes,
// times and the channel-to-target mapping are not measured data.
const root = document.getElementById('msSense');
if (root) {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const AC = css('--ac'), FG = css('--fg'), MU = css('--mu'), LN = css('--ln'), SF = css('--sf'), RED = '#ff5a5a', BLUE = '#5b82ff';
  const cvX = root.querySelector('#msX'), cvC = root.querySelector('#msC'), tip = root.querySelector('#msTip');
  const scrub = root.querySelector('#msT'), tv = root.querySelector('#msTv'), verdict = root.querySelector('#msV');
  const CH = [
    { id: 'zika', name: 'Zika', t0: 11.5 }, { id: 'dengue', name: 'Dengue', t0: 13 },
    { id: 'malaria', name: 'Malaria', t0: 9.5 }, { id: 'ctrl', name: 'RNase P control', t0: 8 },
  ];
  const TMAX = 20, TH = .5;
  const st = { target: 'none', heat: true, t: 0, sel: 0, playing: false };
  // small fixed wobble so flat lines read as measurements, not rulers
  const wob = (i, t) => .012 * Math.sin(t * 2.3 + i * 1.7) + .008 * Math.sin(t * 5.1 + i);
  const sig = (i, t) => {
    const c = CH[i], present = c.id === 'ctrl' || c.id === st.target;
    const base = .07 + .015 * t / TMAX + wob(i, t);
    return present && st.heat ? base + .82 / (1 + Math.exp(-(t - c.t0) / 1.05)) : base;
  };
  const tPos = i => { for (let t = 0; t <= TMAX; t += .05) if (sig(i, t) > TH) return t; return null; };

  const fit = cv => { const d = Math.min(2, devicePixelRatio), w = cv.clientWidth, h = cv.clientHeight; if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); } const x = cv.getContext('2d'); x.setTransform(d, 0, 0, d, 0, 0); return [x, w, h]; };
  const mono = (x, px = 12) => { x.font = `${px}px JetBrains Mono, monospace`; };

  function drawX() {
    const [x, w, h] = fit(cvX); x.clearRect(0, 0, w, h);
    const s = sig(st.sel, st.t), on = st.t > 0 || st.playing, cx = w / 2;
    const pcbY = h * .16, wellY = h * .62, chipTop = wellY - 10, heatY = h * .8;
    const ledX = cx - w * .16, pdX = cx + w * .16;
    // light paths
    if (on) {
      x.save(); x.globalCompositeOperation = 'lighter';
      const g1 = x.createLinearGradient(0, pcbY, 0, wellY); g1.addColorStop(0, BLUE + 'aa'); g1.addColorStop(1, BLUE + '10');
      x.fillStyle = g1; x.beginPath(); x.moveTo(ledX - 6, pcbY + 14); x.lineTo(ledX + 6, pcbY + 14); x.lineTo(cx + 26, wellY); x.lineTo(cx - 34, wellY); x.fill();
      const a = Math.max(0, Math.min(1, (s - .07) / .8));
      const g2 = x.createLinearGradient(0, wellY, 0, pcbY); g2.addColorStop(0, `rgba(22,236,154,${.08 + a * .55})`); g2.addColorStop(1, `rgba(22,236,154,${a * .25})`);
      x.fillStyle = g2; x.beginPath(); x.moveTo(cx - 26, wellY); x.lineTo(cx + 34, wellY); x.lineTo(pdX + 6, pcbY + 14); x.lineTo(pdX - 6, pcbY + 14); x.fill();
      x.restore();
    }
    // sensing board, LED and photodiode facing down
    x.fillStyle = '#0f241b'; x.fillRect(w * .12, pcbY - 8, w * .76, 8);
    x.fillStyle = on ? BLUE : '#c9ccd4'; x.fillRect(ledX - 8, pcbY, 16, 12);
    x.fillStyle = '#26262b'; x.fillRect(pdX - 10, pcbY, 20, 12);
    // chip with well
    x.fillStyle = 'rgba(223,233,239,.10)'; x.strokeStyle = LN; x.fillRect(w * .1, chipTop, w * .8, 30); x.strokeRect(w * .1 + .5, chipTop + .5, w * .8 - 1, 29);
    const a = Math.max(0, Math.min(1, (s - .07) / .8));
    x.fillStyle = `rgba(22,236,154,${.12 + a * .7})`; x.fillRect(cx - 34, wellY - 6, 68, 14);
    // heating plate
    x.fillStyle = st.heat ? '#8c8f93' : '#3a3a3e'; x.fillRect(w * .1, heatY, w * .8, 8);
    // labels
    mono(x); x.fillStyle = MU; x.textBaseline = 'middle';
    x.textAlign = 'right'; x.fillText('Blue LED', ledX - 16, pcbY + 6);
    x.textAlign = 'left'; x.fillText('Photodiode', pdX + 16, pcbY + 6);
    x.fillText('Well, ' + CH[st.sel].name, w * .1 + 6, chipTop - 12);
    x.fillText('Clear PMMA chip', w * .1 + 6, chipTop + 38);
    x.fillText(st.heat ? 'Heating plate, 65 °C' : 'Heating plate, off', w * .1 + 6, heatY + 22);
    x.textAlign = 'right'; x.fillStyle = FG; x.fillText(`PD ${Math.round(s * 100)}%`, w * .9 - 6, pcbY + 30);
  }

  const P = { l: 44, r: 16, t: 16, b: 34 };
  let geo = null;
  function drawC() {
    const [x, w, h] = fit(cvC); x.clearRect(0, 0, w, h);
    const X = t => P.l + t / TMAX * (w - P.l - P.r), Y = v => h - P.b - v * (h - P.t - P.b);
    geo = { X, Y, w, h };
    mono(x); x.strokeStyle = LN; x.fillStyle = MU; x.lineWidth = 1;
    for (let m = 0; m <= TMAX; m += 5) { x.beginPath(); x.moveTo(X(m), P.t); x.lineTo(X(m), h - P.b); x.stroke(); x.textAlign = 'center'; x.fillText(m + '', X(m), h - P.b + 16); }
    x.textAlign = 'left'; x.fillText('min', w - P.r - 22, h - 6);
    x.save(); x.setLineDash([4, 4]); x.strokeStyle = MU; x.beginPath(); x.moveTo(P.l, Y(TH)); x.lineTo(w - P.r, Y(TH)); x.stroke(); x.restore();
    x.textAlign = 'right'; x.fillText('threshold', w - P.r - 4, Y(TH) - 8);
    x.save(); x.translate(14, (P.t + h - P.b) / 2); x.rotate(-Math.PI / 2); x.textAlign = 'center'; x.fillText('photodiode signal', 0, 0); x.restore();
    CH.forEach((c, i) => {
      const sel = i === st.sel;
      x.strokeStyle = sel ? AC : (c.id === 'ctrl' ? FG : MU); x.globalAlpha = sel ? 1 : .7; x.lineWidth = sel ? 2.2 : 1.2;
      if (c.id === 'ctrl') x.setLineDash([6, 4]);
      x.beginPath(); for (let t = 0; t <= st.t; t += .1) { const px = X(t), py = Y(sig(i, t)); t ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke();
      x.setLineDash([]); x.globalAlpha = 1;
      const tp = tPos(i); if (tp !== null && tp <= st.t) { x.fillStyle = sel ? AC : FG; x.beginPath(); x.arc(X(tp), Y(TH), 3.5, 0, 7); x.fill(); }
    });
    x.strokeStyle = FG; x.globalAlpha = .35; x.beginPath(); x.moveTo(X(st.t), P.t); x.lineTo(X(st.t), h - P.b); x.stroke(); x.globalAlpha = 1;
  }

  const rows = [...root.querySelectorAll('.ms-ch button')];
  function readout() {
    tv.textContent = st.t.toFixed(1) + ' min'; scrub.value = Math.round(st.t * 10);
    rows.forEach((b, i) => {
      b.classList.toggle('on', i === st.sel); b.setAttribute('aria-pressed', String(i === st.sel));
      const tp = tPos(i), done = tp !== null && tp <= st.t, out = b.querySelector('em');
      out.textContent = done ? `POS ${tp.toFixed(1)} min` : (st.t >= TMAX ? 'NEG' : '...');
      out.className = done ? 'pos' : '';
    });
    const ctl = tPos(3), ctlOk = ctl !== null && ctl <= st.t;
    const hits = CH.slice(0, 3).filter((c, i) => { const tp = tPos(i); return tp !== null && tp <= st.t; });
    let txt, cls = '';
    if (st.t >= TMAX && !ctlOk) { txt = 'INVALID: control did not amplify'; cls = 'flag'; }
    else if (hits.length) { txt = hits.map(c => c.name).join(', ') + ' detected'; cls = 'hit'; }
    else if (st.t >= TMAX) txt = 'No target detected';
    else txt = ctlOk ? 'Control passed, reading' : 'Reading';
    verdict.textContent = txt; verdict.className = 'ms-v ' + cls;
  }
  const draw = () => { drawX(); drawC(); readout(); };

  let raf = 0, t0 = 0;
  function play() {
    cancelAnimationFrame(raf); st.playing = true; st.t = 0;
    if (RM) { st.t = TMAX; st.playing = false; draw(); return; }
    t0 = performance.now();
    const tick = n => { st.t = Math.min(TMAX, (n - t0) / 6000 * TMAX); draw(); if (st.t < TMAX) raf = requestAnimationFrame(tick); else st.playing = false; };
    raf = requestAnimationFrame(tick);
  }
  const seg = (sel, key, parse) => root.querySelectorAll(sel + ' button').forEach(b => b.addEventListener('click', () => {
    root.querySelectorAll(sel + ' button').forEach(o => o.classList.toggle('on', o === b));
    st[key] = parse(b.dataset.v); play();
  }));
  seg('#msTarget', 'target', v => v); seg('#msHeat', 'heat', v => v === 'on');
  rows.forEach((b, i) => b.addEventListener('click', () => { st.sel = i; draw(); }));
  scrub.addEventListener('input', () => { cancelAnimationFrame(raf); st.playing = false; st.t = scrub.value / 10; draw(); });
  root.querySelector('#msRun').addEventListener('click', play);

  // tooltip: exact signal of the nearest curve under the pointer
  cvC.addEventListener('pointermove', e => {
    if (!geo) return; const r = cvC.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top;
    const t = Math.max(0, Math.min(st.t, (mx - P.l) / (geo.w - P.l - P.r) * TMAX));
    let best = 0, bd = 1e9; CH.forEach((c, i) => { const d = Math.abs(geo.Y(sig(i, t)) - my); if (d < bd) { bd = d; best = i; } });
    if (bd > 24 || mx < P.l) { tip.style.opacity = 0; return; }
    tip.textContent = `${CH[best].name}  ${t.toFixed(1)} min  ${Math.round(sig(best, t) * 100)}%`;
    tip.style.left = Math.min(mx + 12, geo.w - 190) + 'px'; tip.style.top = (my - 30) + 'px'; tip.style.opacity = 1;
  });
  cvC.addEventListener('pointerleave', () => tip.style.opacity = 0);

  addEventListener('resize', draw);
  new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { o.disconnect(); play(); } }, { threshold: .4 }).observe(root);
  draw();
}
