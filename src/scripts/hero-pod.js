import { THREE } from './three-lib.js';
import { RM, mkRenderer, fit, makePod } from './whoop-common.js';
// Wireframe WHOOP-style sensor pod for the homepage hero.
const cv = document.getElementById('heroPod');
if (cv) {
  const R = mkRenderer(cv), S = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 1, 1000);
  cam.position.set(0, 46, 84); cam.lookAt(0, 4, 0);
  const { g } = makePod();
  const wire = new THREE.Group();
  const lineMat = new THREE.LineBasicMaterial({ color: 0x16ec9a, transparent: true, opacity: .7 });
  const dimMat = new THREE.LineBasicMaterial({ color: 0x4a4a4e });
  g.traverse(m => {
    if (m.isMesh) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 8), m.geometry.type === 'RoundedBoxGeometry' && m.position.y < 6 ? dimMat : lineMat);
      e.position.copy(m.position); e.rotation.copy(m.rotation); e.scale.copy(m.scale); wire.add(e);
    }
  });
  S.add(wire);
  // layers for the scroll explode: shell, bezel/lens, sensors (grouped by height in the model)
  const lv = [...new Set(wire.children.map(l => Math.round(l.position.y * 2) / 2))].sort((a, b) => a - b);
  wire.children.forEach(l => { l.userData.y0 = l.position.y; l.userData.rank = lv.indexOf(Math.round(l.position.y * 2) / 2); });
  const hero = cv.closest('section');
  let ex = 0;
  let ry = -.6, drag = null, vis = true;
  new IntersectionObserver(e => vis = e[0].isIntersecting).observe(cv);
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, ry }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (drag) ry = drag.ry + (e.clientX - drag.x) / 150; });
  cv.addEventListener('pointerup', () => drag = null);
  (function frame() {
    requestAnimationFrame(frame); if (!vis) return;
    if (!drag && !RM) ry += .0025; wire.rotation.y = ry;
    // scrolling past the hero pulls the pod apart into its layers
    const r = hero.getBoundingClientRect(), p = RM ? 0 : Math.min(1, Math.max(0, -r.top / (r.height * .55)));
    ex += (p - ex) * .15; const e = ex * ex * (3 - 2 * ex);
    wire.children.forEach(l => { l.position.y = l.userData.y0 + l.userData.rank * 9 * e; });
    wire.rotation.x = e * .35;
    fit(R, cam, cv); const k = cam.aspect < 1.1 ? 1.2 : .8; const z = k * (1 + .3 * e); cam.position.set(0, 46 * z + 12 * e, 84 * z); cam.lookAt(0, 4 + 14 * e, 0); R.render(S, cam);
  })();
}
