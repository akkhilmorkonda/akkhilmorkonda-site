// WHOOP ATE test software: a live test DAG. Steps run as soon as their dependencies pass
// (DAG) or strictly one after another (legacy serial). Click a step to make it fail on the
// next run: the DAG skips only its dependents, serial aborts everything after it.
// Illustrative steps and timings, sized so DAG finishes in 70% of the serial time.
const root = document.getElementById('ateDag');
if (root) {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const STEPS = {
    flash:   { n: 'Flash firmware', d: 8,  deps: [] },
    boot:    { n: 'Boot check',     d: 6,  deps: ['flash'] },
    sensors: { n: 'Sensors',        d: 12, deps: ['boot'] },
    battery: { n: 'Battery',        d: 10, deps: ['boot'] },
    optical: { n: 'Optical',        d: 9,  deps: ['sensors'] },
    radio:   { n: 'Radio',          d: 5,  deps: ['battery'] },
  };
  const ORDER = Object.keys(STEPS);                       // topological, and the legacy serial order
  const graph = root.querySelector('.dag-graph'), svg = graph.querySelector('svg');
  const clock = root.querySelector('#dagT'), status = root.querySelector('#dagStatus');
  const bars = { serial: root.querySelector('[data-bar="serial"] .fill'), dag: root.querySelector('[data-bar="dag"] .fill') };
  const fail = new Set();
  let mode = 'dag', raf = 0;

  // nodes
  const node = {};
  ORDER.forEach(k => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'dag-n'; b.dataset.k = k;
    b.innerHTML = `<span class="dn-t">${STEPS[k].n}</span><span class="dn-d">${STEPS[k].d} s</span><span class="dn-s" aria-hidden="true"></span>`;
    b.setAttribute('aria-label', `${STEPS[k].n}, ${STEPS[k].d} seconds. Press to make it fail on the next run.`);
    b.addEventListener('click', () => { fail.has(k) ? fail.delete(k) : fail.add(k); b.classList.toggle('armed', fail.has(k)); b.setAttribute('aria-pressed', String(fail.has(k))); run(); });
    b.setAttribute('aria-pressed', 'false');
    graph.appendChild(b); node[k] = b;
  });

  // schedule: start/end/state per step for a mode and a set of failing steps
  function schedule(m, f) {
    const s = {}; let t = 0, abortAt = null;
    for (const k of ORDER) {
      const st = STEPS[k];
      if (m === 'serial') {
        if (abortAt !== null) { s[k] = { state: 'skipped', at: abortAt }; continue; }
        s[k] = { start: t, end: t + st.d, state: f.has(k) ? 'failed' : 'passed' };
        t += st.d; if (f.has(k)) abortAt = t;
      } else {
        const blocked = st.deps.find(dk => s[dk].state !== 'passed');
        if (blocked) { s[k] = { state: 'skipped', at: s[blocked].end ?? s[blocked].at }; continue; }
        const start = Math.max(0, ...st.deps.map(dk => s[dk].end));
        s[k] = { start, end: start + st.d, state: f.has(k) ? 'failed' : 'passed' };
      }
    }
    const total = Math.max(...Object.values(s).map(x => x.end ?? 0));
    return { s, total };
  }
  const base = { serial: schedule('serial', new Set()).total, dag: schedule('dag', new Set()).total };
  root.querySelector('[data-bar="serial"] b').textContent = base.serial + ' s';
  root.querySelector('[data-bar="dag"] b').textContent = `${base.dag} s, ${Math.round((1 - base.dag / base.serial) * 100)}% faster`;
  // both tracks share one time scale: the DAG track is shorter because the run is
  root.querySelector('[data-bar="dag"] .trk').style.width = `${base.dag / base.serial * 100}%`;

  // edges, drawn from the laid-out node boxes (horizontal on desktop, vertical on phones)
  function edges(plan, t) {
    const g = graph.getBoundingClientRect(); svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
    svg.innerHTML = '';
    ORDER.forEach(k => STEPS[k].deps.forEach(dk => {
      const a = node[dk].getBoundingClientRect(), b = node[k].getBoundingClientRect();
      const horiz = b.left >= a.right - 1;
      let p;
      if (horiz) { const x1 = a.right - g.left, y1 = a.top + a.height / 2 - g.top, x2 = b.left - g.left, y2 = b.top + b.height / 2 - g.top, mx = (x1 + x2) / 2; p = `M${x1} ${y1}H${mx}V${y2}H${x2}`; }
      else { const x1 = a.left + a.width / 2 - g.left, y1 = a.bottom - g.top, x2 = b.left + b.width / 2 - g.left, y2 = b.top - g.top, my = (y1 + y2) / 2; p = `M${x1} ${y1}V${my}H${x2}V${y2}`; }
      const src = plan?.s[dk], lit = src && src.state === 'passed' && t >= src.end;
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('d', p); el.setAttribute('class', lit ? 'on' : ''); svg.appendChild(el);
    }));
  }

  function paint(plan, t) {
    ORDER.forEach(k => {
      const x = plan.s[k], b = node[k];
      let st = 'idle', pct = 0;
      if (x.state === 'skipped') st = t >= x.at ? 'skipped' : 'idle';
      else if (t >= x.end) st = x.state;
      else if (t >= x.start) { st = 'running'; pct = (t - x.start) / STEPS[k].d; }
      b.dataset.s = st; b.style.setProperty('--p', pct);
      b.querySelector('.dn-s').textContent = { idle: '', running: '', passed: 'PASS', failed: 'FAIL', skipped: 'SKIPPED' }[st];
    });
    clock.textContent = `${Math.min(t, plan.total).toFixed(t < plan.total ? 1 : 0)} s`;
    bars.serial.style.width = mode === 'serial' ? `${Math.min(1, t / base.serial) * 100}%` : '0%';
    bars.dag.style.width = mode === 'dag' ? `${Math.min(1, t / base.dag) * 100}%` : '0%';
    edges(plan, t);
  }

  function describe(plan) {
    const failed = ORDER.filter(k => plan.s[k].state === 'failed'), skipped = ORDER.filter(k => plan.s[k].state === 'skipped');
    const names = ks => { const n = ks.map(k => STEPS[k].n); return n.length < 2 ? n.join('') : n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1]; };
    if (!failed.length) return `All 6 steps passed in ${plan.total} s. ${mode === 'dag' ? 'Independent steps ran side by side.' : 'Every step waited for the one before it.'}`;
    if (mode === 'serial') return `${names(failed)} failed and the run stopped: ${skipped.length} step${skipped.length === 1 ? '' : 's'} never ran.`;
    const ran = ORDER.filter(k => plan.s[k].state === 'passed');
    return `${names(failed)} failed. Only ${failed.length > 1 ? 'their' : 'its'} dependents were skipped${skipped.length ? ` (${names(skipped)})` : ''}; ${names(ran)} still ran.`;
  }

  function run() {
    cancelAnimationFrame(raf);
    const plan = schedule(mode, fail);
    status.textContent = 'Running';
    if (RM) { paint(plan, plan.total); status.textContent = describe(plan); return; }
    const t0 = performance.now(), MS = 90;                        // 90 ms per illustrative second
    const tick = n => { const t = (n - t0) / MS; paint(plan, t); if (t < plan.total) raf = requestAnimationFrame(tick); else status.textContent = describe(plan); };
    raf = requestAnimationFrame(tick);
  }

  root.querySelectorAll('#dagMode button').forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.m; root.querySelectorAll('#dagMode button').forEach(o => o.classList.toggle('on', o === b)); run();
  }));
  root.querySelector('#dagRun').addEventListener('click', run);
  addEventListener('resize', () => edges(schedule(mode, fail), Infinity));

  paint(schedule(mode, fail), 0);
  new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { o.disconnect(); run(); } }, { threshold: .5 }).observe(root);
}
