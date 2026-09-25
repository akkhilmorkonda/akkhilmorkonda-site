// Test fleet: legacy serial ATE vs DAG-scheduled parallel run across 12 fixtures. Illustrative timings.
const root = document.getElementById('fleet');
if (root) {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ST = [['F', 'Flash', 8], ['B', 'Boot', 6], ['S', 'Sensors', 10], ['P', 'Battery', 12], ['O', 'Optical', 9], ['R', 'Radio', 7]];
  const MAX = 100, N = 12;
  // legacy: every step in series, fixtures started one after another
  const legacy = i => { let t = i * 4; return ST.map(([k, , d]) => { const b = { k, x: t, w: d, lane: 0 }; t += d; return b; }); };
  // DAG: flash then boot, then sensors || battery, then optical || radio; dispatch staggered less
  const dag = i => { const s = i * 2.9, b = []; let t = s;
    b.push({ k: 'F', x: t, w: 8, lane: 0 }); t += 8; b.push({ k: 'B', x: t, w: 6, lane: 0 }); t += 6;
    b.push({ k: 'S', x: t, w: 10, lane: 1 }); b.push({ k: 'P', x: t, w: 12, lane: 2 }); t += 12;
    b.push({ k: 'O', x: t, w: 9, lane: 1 }); b.push({ k: 'R', x: t, w: 7, lane: 2 }); return b; };
  const lanes = root.querySelector('.lanes'), end = root.querySelector('.endline'), time = root.querySelector('.ftime');
  for (let i = 0; i < N; i++) {
    const row = document.createElement('div'); row.className = 'lane';
    row.innerHTML = `<span class="fx">F${String(i + 1).padStart(2, '0')}</span><div class="track">${ST.map(([k, name]) => `<i data-k="${k}" title="${name}">${k}</i>`).join('')}</div>`;
    lanes.appendChild(row);
  }
  function set(mode) {
    const fn = mode === 'dag' ? dag : legacy; let finish = 0;
    [...lanes.children].forEach((row, i) => {
      const blocks = fn(i); const els = row.querySelectorAll('i');
      blocks.forEach(b => { const el = [...els].find(e => e.dataset.k === b.k);
        el.style.left = (b.x / MAX * 100) + '%'; el.style.width = (b.w / MAX * 100) + '%';
        el.style.top = b.lane === 0 ? '10%' : b.lane === 1 ? '6%' : '54%'; el.style.height = b.lane === 0 ? '80%' : '40%';
        finish = Math.max(finish, b.x + b.w); });
    });
    end.style.left = (finish / MAX * 100) + '%';
    time.textContent = Math.round(finish / 96 * 100) + '%';
    root.querySelectorAll('.fseg button').forEach(b => b.classList.toggle('on', b.dataset.m === mode));
    root.classList.toggle('is-dag', mode === 'dag');
  }
  root.querySelectorAll('.fseg button').forEach(b => b.onclick = () => set(b.dataset.m));
  set('legacy');
  if (!RM) new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { setTimeout(() => set('dag'), 900); o.disconnect(); } }, { threshold: .5 }).observe(root);
}
