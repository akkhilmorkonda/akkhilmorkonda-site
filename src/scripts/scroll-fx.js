// Scroll-driven motion shared by every page. Only runs when <html> has .fx (set in Base when
// reduced motion is off). Elements already on screen at load are left alone, so nothing flashes;
// the hero intro is plain CSS. Content is never hidden unless this script has run.
const root = document.documentElement;
if (root.classList.contains('fx')) {
  const vh = () => innerHeight;
  const below = el => el.getBoundingClientRect().top > vh() * 0.92;

  // 1. Headlines: split into words that rise out of a mask when the heading enters.
  const heads = [...document.querySelectorAll('main h2')].filter(h => below(h) && [...h.childNodes].every(n => n.nodeType === 3));
  heads.forEach(h => {
    h.setAttribute('aria-label', h.textContent.trim());
    h.innerHTML = h.textContent.trim().split(/\s+/).map((w, i) => `<span class="wr" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
    h.classList.add('split');
  });

  // 2. Blocks: fade and lift in, staggered within their group.
  const groups = ['.brief > div', '.core .pts li', '.core .core-res', '.xrows > .xrow', '.rows > .row', '.bento > .cell', '.soon > .cell', '.tiles > .t', '.labs > .lab', '.stats > div', '.beats > div', '.more > div', '.chain > div', '.ta', '.emg', '.viewer', '.bbox', '.fbox', '.vol .head p', '.bhead p', '.s-contact p', '.s-contact .h-ctas'];
  const blocks = [];
  groups.forEach(sel => {
    const els = [...document.querySelectorAll(sel)].filter(below);
    els.forEach((el, i) => { el.classList.add('rv'); el.style.setProperty('--i', String(i % 6)); blocks.push(el); });
  });

  // 3. Numbers count up from zero the first time they are seen. Real values only, parsed from the text.
  const counters = [...document.querySelectorAll('.row .st b, .t.acc b, .stats b, .bhead b.n, .more b.n, .core .n')].filter(el => /\d/.test(el.textContent));
  const count = el => {
    const txt = el.textContent.trim(), m = txt.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/);
    if (!m) return;
    const [, pre, num, post] = m, to = parseFloat(num), dec = (num.split('.')[1] || '').length, t0 = performance.now(), dur = 1300;
    el.setAttribute('aria-label', txt);
    const tick = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(2, -10 * k);
      el.textContent = pre + (k < 1 ? (to * e).toFixed(dec) : num) + post;
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    if (counters.includes(el)) count(el); else el.classList.add('in');
    io.unobserve(el);
  }), { rootMargin: '0px 0px -12% 0px' });
  [...heads, ...blocks, ...counters].forEach(el => io.observe(el));

  // 4. Scrubbed statement: words light up in reading order as it scrolls through the viewport.
  const scrubs = [...document.querySelectorAll('.statement')].map(el => {
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
    el.classList.add('scrub');
    return { el, words: [...el.querySelectorAll('.w')] };
  });

  // 5. Page progress in the nav, plus the scrub above; one passive listener, batched to a frame.
  const bar = document.querySelector('.nv-prog');
  let queued = false;
  const update = () => {
    queued = false;
    const max = root.scrollHeight - vh();
    if (bar) bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    scrubs.forEach(({ el, words }) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh()) return;
      const p = Math.min(1, Math.max(0, (vh() * 0.85 - r.top) / (r.height + vh() * 0.3)));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < lit));
    });
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
}
