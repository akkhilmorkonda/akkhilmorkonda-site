// GT Medical Robotics: the team's hand CAD (wrist and palm by Akkhil) as an exploded view.
// public/models/hand.glb comes from tools/hand-to-glb.py: one node per part, millimetres, fingers along +y.
// Drag to rotate; the Explode slider pulls parts out from the palm. Red palm and back plate, white digits,
// as printed. Loaded lazily when the section nears the viewport.
import { THREE } from './three-lib.js';
import { RM, AC, mkStudio, PBR } from './whoop-common.js';
const cv = document.getElementById('handCv');
if (cv) {
  const box = cv.closest('.viewer'), S = new THREE.Scene(), cam = new THREE.PerspectiveCamera(30, 1, 1, 5000);
  const P = mkStudio(cv, S, cam, { shadows: true, exposure: 1.05, floor: { y: 0, size: 1400, height: 320, opacity: .9, blur: 2.2, tone: .008 } });
  S.add(new THREE.HemisphereLight(0xdfe8e4, 0x0b0b0c, .2));
  const dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(220, 420, 260); dl.castShadow = true; dl.shadow.mapSize.set(2048, 2048);
  Object.assign(dl.shadow.camera, { left: -220, right: 220, top: 220, bottom: -220, near: 10, far: 1200 }); dl.shadow.bias = -.0006; dl.shadow.radius = 4; S.add(dl);
  const rl = new THREE.DirectionalLight(0x9fe8c8, .3); rl.position.set(-260, 160, -220); S.add(rl);

  const RED = /^(palm|backplate)$/;
  const pla = c => new THREE.MeshStandardMaterial({ color: c, metalness: 0, roughness: .58, roughnessMap: PBR.plastic().roughnessMap });
  const white = () => pla(new THREE.Color().setScalar(.5)), red = () => pla(new THREE.Color(.42, .022, .028));
  const hw = () => PBR.satin();
  const root = new THREE.Group(); S.add(root);
  const parts = [];                                                    // { m, home, dir }
  let ex = .35, exT = .35, yaw = .7, pitch = .18, drag = null, spin = !RM, ready = false, vis = false, dirty = true;

  const slider = box.querySelector('#hEx'), note = box.querySelector('.loading');
  slider.addEventListener('input', () => { exT = slider.value / 100; spin = false; dirty = true; });

  // drag to rotate (horizontal drags rotate; vertical page scroll still works on touch)
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; spin = false; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!drag) return; yaw = drag.yaw + (e.clientX - drag.x) * .008; pitch = Math.max(-.2, Math.min(.9, drag.pitch + (e.clientY - drag.y) * .005)); dirty = true; });
  const up = () => drag = null; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('keydown', e => { const k = { ArrowLeft: -.12, ArrowRight: .12 }[e.key]; if (k) { yaw += k; spin = false; dirty = true; e.preventDefault(); } });

  function load() {
    new THREE.GLTFLoader().load('/models/hand.glb', g => {
      const meshes = []; g.scene.traverse(m => { if (m.isMesh) meshes.push(m); });
      // hand stands on its wrist: lift so the lowest point sits on the floor, centre in x and z
      const bb = new THREE.Box3().setFromObject(g.scene), c = bb.getCenter(new THREE.Vector3());
      g.scene.position.set(-c.x, -bb.min.y + 6, -c.z); root.add(g.scene); g.scene.updateMatrixWorld(true);
      const palmC = new THREE.Box3().setFromObject(meshes.find(m => m.name === 'palm') || g.scene).getCenter(new THREE.Vector3());
      meshes.forEach(m => {
        const name = m.name || m.parent?.name || '';
        m.material = name === 'palm_hw' ? hw() : RED.test(name) ? red() : white();
        m.castShadow = m.receiveShadow = true; if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals();
        const pc = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3());
        // explode along the line from the palm centre; the back plate lifts off its face, hardware drops out the front
        const dir = pc.clone().sub(palmC); if (name === 'backplate') dir.set(0, 0, 70); if (name === 'palm_hw') dir.set(0, -10, -60); if (name === 'palm') dir.set(0, 0, 0);
        parts.push({ m, home: m.position.clone(), dir: dir.multiplyScalar(name.startsWith('f') || name.startsWith('thumb') ? .9 : 1) });
      });
      ready = true; if (note) note.remove(); P.shadow(); dirty = true;
    }, undefined, () => { if (note) note.textContent = 'Model failed to load.'; });
  }
  new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { o.disconnect(); load(); } }, { rootMargin: '600px' }).observe(cv);
  new IntersectionObserver(e => { vis = e[0].isIntersecting; }).observe(cv);

  let lastShadow = -1;
  function pose(t) {
    ex += (exT - ex) * (RM ? 1 : .12);
    if (spin) yaw += .0016;
    root.rotation.set(0, yaw, 0);
    parts.forEach(p => p.m.position.copy(p.home).addScaledVector(p.dir, ex));
    const r = 760 * Math.max(1, .95 / (cam.aspect || 1)), el = .28 + pitch * .6;   // narrow canvases pull back so the thumb stays in frame
    cam.position.set(Math.sin(.6) * r * Math.cos(el), 110 + Math.sin(el) * r, Math.cos(.6) * r * Math.cos(el)); cam.lookAt(0, 112 + ex * 60, 0);
    if (Math.abs(ex - lastShadow) > .002) { P.shadow(); lastShadow = ex; }
  }
  function frame(t) {
    requestAnimationFrame(frame); if (!vis || !ready) return;
    if (!spin && !dirty && Math.abs(exT - ex) < .001) return;     // idle: nothing moving, skip the frame
    dirty = false; pose(t); P.render();
  }
  requestAnimationFrame(frame);

  // dev-only: render a frame, or a transparent square hero render (stripped from production builds)
  if (import.meta.env.DEV) window.__gt = {
    load() { if (!ready) load(); }, ready: () => ready, S,
    shot(e = ex, y = yaw) { exT = ex = e; yaw = y; spin = false; pose(0); P.shadow(); P.render(); return cv; },
    hero(e = 0, y = -.55, px = 1100) {
      exT = ex = e; yaw = y; spin = false; pose(0); const r = P.r, w = cv.width, h = cv.height, a = cam.aspect;
      const floorObjs = []; S.traverse(o => { if (o.isMesh && o.material && o.material.isMeshBasicMaterial) floorObjs.push(o); });   // floor pool and contact shadow floorObjs.forEach(o => o.visible = false);
      r.setSize(px, px, false); cam.aspect = 1; cam.updateProjectionMatrix(); const cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha();
      floorObjs.forEach(o => o.visible = false); r.setClearColor(0x000000, 0); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.setRenderTarget(null); r.render(S, cam);
      const url = r.domElement.toDataURL('image/png');
      r.toneMapping = THREE.NoToneMapping; r.setClearColor(cc, ca); r.setSize(w / r.getPixelRatio(), h / r.getPixelRatio(), false); cam.aspect = a; cam.updateProjectionMatrix(); floorObjs.forEach(o => o.visible = true);
      return url;
    },
  };
}
