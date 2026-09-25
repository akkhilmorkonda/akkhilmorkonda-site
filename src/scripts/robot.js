// Avanos: 6-axis robot tracing an interpolated trajectory. Illustrative kinematics, not the production code.
import { THREE } from './three-lib.js';
import { RM, mkRenderer, fit } from './whoop-common.js';
const cv = document.getElementById('robot');
if (cv) {
  const R = mkRenderer(cv); R.setClearColor(0x000000, 0);
  const S = new THREE.Scene(), cam = new THREE.PerspectiveCamera(34, 1, 1, 3000);
  cam.position.set(210, 190, 260); cam.lookAt(0, 70, 0);
  S.add(new THREE.HemisphereLight(0xe6eeea, 0x0b0b0c, .7));
  const dl = new THREE.DirectionalLight(0xffffff, .9); dl.position.set(200, 400, 200); S.add(dl);
  const M = (c, m = .3, r = .5) => new THREE.MeshStandardMaterial({ color: c, metalness: m, roughness: r });
  const shell = M(0xd9dbdd, .15, .45), joint = M(0x2a2b2e, .4, .4), acc = M(0x16ec9a, .1, .5);
  const cyl = (r, h, m) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32), m);
  const rbox = (w, h, d, m) => new THREE.Mesh(new THREE.RoundedBoxGeometry(w, h, d, 3, Math.min(w, h, d) / 4), m);
  // floor grid + work part (generic pump body)
  const grid = new THREE.GridHelper(400, 20, 0x2a2a2d, 0x1a1a1c); S.add(grid);
  const part = new THREE.Group(); const pb = rbox(40, 16, 34, M(0x6f7378, .8, .3)); pb.position.y = 8; part.add(pb);
  const port = cyl(8, 14, M(0x8e9195, .9, .25)); port.rotation.z = Math.PI / 2; port.position.set(26, 9, 0); part.add(port);
  part.position.set(118, 0, 30); S.add(part);
  // arm chain: base yaw J1 -> shoulder J2 -> elbow J3 -> wrist J4 (roll) -> J5 (pitch) -> J6 (flange roll)
  const base = cyl(22, 18, joint); base.position.y = 9; S.add(base);
  const j1 = new THREE.Group(); j1.position.y = 18; S.add(j1);
  const col = cyl(14, 34, shell); col.position.y = 17; j1.add(col);
  const j2 = new THREE.Group(); j2.position.y = 40; j1.add(j2);
  const sh = cyl(15, 26, joint); sh.rotation.x = Math.PI / 2; j2.add(sh);
  const up = rbox(18, 70, 18, shell); up.position.y = 35; j2.add(up);
  const j3 = new THREE.Group(); j3.position.y = 70; j2.add(j3);
  const el = cyl(12, 22, joint); el.rotation.x = Math.PI / 2; j3.add(el);
  const fa = rbox(14, 60, 14, shell); fa.position.y = 30; j3.add(fa);
  const j4 = new THREE.Group(); j4.position.y = 60; j3.add(j4);
  const w1 = cyl(9, 12, joint); w1.position.y = 6; j4.add(w1);
  const j5 = new THREE.Group(); j5.position.y = 14; j4.add(j5);
  const w2 = cyl(8, 16, joint); w2.rotation.x = Math.PI / 2; j5.add(w2);
  const j6 = new THREE.Group(); j6.position.y = 10; j5.add(j6);
  const fl = cyl(7, 6, joint); fl.position.y = 3; j6.add(fl);
  const tool = cyl(2.2, 14, acc); tool.position.y = 13; j6.add(tool);
  const tip = new THREE.Object3D(); tip.position.y = 20; j6.add(tip);
  // trajectory: smooth joint-space interpolation over one cycle
  const J = u => { const w = u * Math.PI * 2;
    const a1 = -.2 + .35 * Math.sin(w), a2 = -.8 + .15 * Math.sin(2 * w + .6), a3 = -1.3 + .2 * Math.cos(w);
    return [a1, a2, a3, .35 * Math.sin(w + 1), -Math.PI - a2 - a3 + .15 * Math.sin(2 * w), w]; };
  const joints = [[j1, 'y'], [j2, 'z'], [j3, 'z'], [j4, 'y'], [j5, 'z'], [j6, 'y']];
  const pose = u => { J(u).forEach((a, i) => { const [g, ax] = joints[i]; g.rotation.set(0, 0, 0); g.rotation[ax] = a; }); S.updateMatrixWorld(true); };
  // precompute the full path
  const P = []; for (let k = 0; k <= 240; k++) { pose(k / 240); P.push(tip.getWorldPosition(new THREE.Vector3())); }
  const pathGeo = new THREE.BufferGeometry().setFromPoints(P);
  const ghost = new THREE.Line(pathGeo, new THREE.LineDashedMaterial({ color: 0x4a4a4f, dashSize: 3, gapSize: 3 })); ghost.computeLineDistances(); S.add(ghost);
  const trailGeo = new THREE.BufferGeometry().setFromPoints(P); const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: 0x16ec9a })); S.add(trail);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(2.6, 16, 16), new THREE.MeshBasicMaterial({ color: 0x16ec9a })); S.add(dot);
  // UI
  const sl = document.getElementById('rT'), pb2 = document.getElementById('rPlay'), out = [...document.querySelectorAll('#rJ b')];
  let u = 0, playing = !RM, vis = true, last = null;
  pb2.onclick = () => { playing = !playing; pb2.textContent = playing ? 'Pause' : 'Play'; }; pb2.textContent = playing ? 'Pause' : 'Play';
  sl.oninput = () => { u = sl.value / 1000; playing = false; pb2.textContent = 'Play'; };
  new IntersectionObserver(e => vis = e[0].isIntersecting).observe(cv);
  let drag = null, yaw = 0; cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, yaw }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (drag) yaw = drag.yaw + (e.clientX - drag.x) / 200; }); cv.addEventListener('pointerup', () => drag = null);
  (function frame(t) {
    requestAnimationFrame(frame); if (!vis) { last = null; return; }
    if (playing && last != null) { u = (u + (t - last) / 9000) % 1; sl.value = Math.round(u * 1000); } last = t;
    pose(u); dot.position.copy(tip.getWorldPosition(new THREE.Vector3()));
    trailGeo.setDrawRange(0, Math.max(2, Math.round(u * 240) + 1));
    J(u).forEach((a, i) => out[i].textContent = ((a * 180 / Math.PI + 540) % 360 - 180).toFixed(1) + '°');
    const r = 330; cam.position.set(Math.sin(.7 + yaw) * r, 200, Math.cos(.7 + yaw) * r); cam.lookAt(45, 55, 0);
    fit(R, cam, cv); R.render(S, cam);
  })(0);
}
