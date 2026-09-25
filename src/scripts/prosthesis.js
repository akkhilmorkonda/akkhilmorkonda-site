// GT Medical Robotics: trans-radial prosthetic arm, exploded view + wrist stress comparison.
// Simplified geometry and an illustrative stress field until the team CAD and FEA exports are added.
import { THREE } from './three-lib.js';
import { RM, mkRenderer, fit } from './whoop-common.js';
const cv = document.getElementById('arm');
if (cv) {
  const R = mkRenderer(cv); const S = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, 1, 4000);
  S.add(new THREE.HemisphereLight(0xe6eeea, 0x0b0b0c, .75)); const dl = new THREE.DirectionalLight(0xffffff, .9); dl.position.set(200, 300, 260); S.add(dl);
  const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, metalness: .3, roughness: .5 }, o));
  const carbon = M(0x1f2023, { roughness: .35 }), shellM = M(0xcfd2d5, { transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide }),
        motorM = M(0x3a3b3f, { metalness: .7, roughness: .3 }), pcbM = M(0x123a2b, { roughness: .6 }), alu = M(0xb8bbbf, { metalness: .85, roughness: .3 }), handM = M(0x2a2b2e, { roughness: .6 });
  const X = (m) => { m.rotation.z = Math.PI / 2; return m; };
  const G = () => { const g = new THREE.Group(); S.add(g); return g; };
  // socket
  const socket = G(); socket.add(X(new THREE.Mesh(new THREE.CylinderGeometry(26, 34, 70, 48, 1, true), M(0x1f2023, { side: THREE.DoubleSide, roughness: .35 })))); socket.position.x = -150;
  // forearm shell
  const shell = G(); shell.add(X(new THREE.Mesh(new THREE.CylinderGeometry(20, 25, 120, 48, 1, true), shellM))); shell.position.x = -55;
  // actuators + electronics
  const act = G(); for (let i = 0; i < 3; i++) { const m = X(new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 46, 24), motorM)); m.position.set(-40, (i - 1) * 13, i == 1 ? 6 : -4); act.add(m); }
  const pcb = G(); const board = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 26), pcbM); board.position.set(-85, -12, 0); pcb.add(board);
  // wrist: rotator, flexion yoke, adaptor (stress-mapped)
  const wrist = G(); const stressMeshes = [];
  const rot = X(new THREE.Mesh(new THREE.CylinderGeometry(19, 19, 12, 48), alu)); rot.position.x = 12; wrist.add(rot);
  const yokeGeo = (w) => new THREE.RoundedBoxGeometry(24, 36, w, 3, 2.5);
  const mkY = (z, w) => { const m = new THREE.Mesh(yokeGeo(w), new THREE.MeshStandardMaterial({ vertexColors: true, metalness: .2, roughness: .45 })); m.position.set(30, 0, z); wrist.add(m); stressMeshes.push(m); return m; };
  const yA = mkY(12, 5), yB = mkY(-12, 5);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 34, 20), alu); pin.rotation.x = Math.PI / 2; pin.position.set(36, 0, 0); wrist.add(pin);
  const ad = X(new THREE.Mesh(new THREE.CylinderGeometry(15, 17, 10, 40), alu)); ad.position.x = 50; wrist.add(ad);
  // hand
  const hand = G(); const palm = new THREE.Mesh(new THREE.RoundedBoxGeometry(56, 18, 50, 4, 6), handM); palm.position.x = 86; hand.add(palm);
  for (let f = 0; f < 4; f++) for (let s = 0; s < 3; s++) { const seg = new THREE.Mesh(new THREE.RoundedBoxGeometry(18 - s * 2, 11, 10, 2, 3), handM); seg.position.set(124 + s * 19, 0, -18 + f * 12); hand.add(seg); }
  const th = new THREE.Mesh(new THREE.RoundedBoxGeometry(26, 11, 11, 2, 3), handM); th.position.set(84, 0, 32); th.rotation.y = -.6; hand.add(th);
  // illustrative stress field on the yoke plates: highest at the root, near the pin
  const ramp = [[.10, .10, .11], [.45, .16, .08], [1, .42, .24], [1, .93, .85]];
  const col = v => { const s = Math.min(.999, v) * 3, i = Math.floor(s), f = s - i, a = ramp[i], b = ramp[i + 1]; return [0, 1, 2].map(k => a[k] + (b[k] - a[k]) * f); };
  function paint(scale) { stressMeshes.forEach(m => { const g = m.geometry, p = g.attributes.position, c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const root = Math.max(0, (11 - x) / 22); const edge = Math.abs(y) / 15; const v = scale * (.25 + .6 * root * (.4 + .6 * edge)); c.set(col(v), i * 3); }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3)); }); }
  // UI
  const ex = document.getElementById('aEx'), peak = document.getElementById('aPk'), fos = document.getElementById('aFs');
  const setW = mode => { const after = mode === 'after'; paint(after ? .62 : 1.2); peak.textContent = after ? '74%' : '100%'; fos.textContent = after ? '+35%' : 'baseline';
    [yA, yB].forEach(m => { m.scale.z = after ? .8 : 1; }); document.querySelectorAll('#aW button').forEach(b => b.classList.toggle('on', b.dataset.w === mode)); };
  document.querySelectorAll('#aW button').forEach(b => b.onclick = () => setW(b.dataset.w)); setW('before');
  const OFF = [[socket, -70, 0], [shell, 0, 70], [act, 0, 0], [pcb, 0, -40], [wrist, 40, 0], [hand, 110, 0]];
  const base = OFF.map(([g]) => g.position.clone());
  let vis = true, yaw = 0, drag = null; new IntersectionObserver(e => vis = e[0].isIntersecting).observe(cv);
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, yaw }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (drag) yaw = drag.yaw + (e.clientX - drag.x) / 200; }); cv.addEventListener('pointerup', () => drag = null);
  let e = 0;
  (function frame(t) { requestAnimationFrame(frame); if (!vis) return;
    const target = ex.value / 100; e += (target - e) * (RM ? 1 : .15);
    OFF.forEach(([g, dx, dy], i) => g.position.set(base[i].x + dx * e, base[i].y + dy * e, base[i].z));
    const a = .9 + yaw + (RM || drag ? 0 : Math.sin(t / 5000) * .12); const r = 470 + 170 * e;
    cam.position.set(Math.sin(a) * r + 10, 170, Math.cos(a) * r); cam.lookAt(0 + 20 * e, 10 + 10 * e, 0);
    fit(R, cam, cv); R.render(S, cam); })(0);
}
