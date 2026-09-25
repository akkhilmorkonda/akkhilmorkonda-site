import { THREE } from './three-lib.js';
import { RM, AC, mkPipe } from './whoop-common.js';
/* ============ MEDISCAN NAAT MODULE: scroll explode of the team's PCB CAD ============
   Boards are the Altium STEP exports converted by tools/cad-to-glb.py (one mesh per part group,
   millimetres, Y up, top copper at y = 0). Chip, black PMMA and heating plate are simplified
   blocks sized from the NAAT slides; the vertical stack is a simplification (boards are cabled). */
const sec = document.getElementById('msExplode');
if (sec) {
  const cv = document.getElementById('msRig'), S = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 1, 4000);
  const P = mkPipe(cv, S, cam, { shadows: true, bloom: .6, env: .35 });
  S.add(new THREE.HemisphereLight(0xdfe8e4, 0x0b0b0c, .35));
  const dl = new THREE.DirectionalLight(0xffffff, .8); dl.position.set(120, 220, 140); dl.castShadow = true;
  dl.shadow.mapSize.set(2048, 2048); Object.assign(dl.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120, near: 10, far: 600 }); dl.shadow.bias = -.0008; S.add(dl);
  const rl = new THREE.DirectionalLight(0x9fe8c8, .35); rl.position.set(-160, -60, -120); S.add(rl);
  const M = (c, m = .2, r = .55, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, metalness: m, roughness: r }, o));

  // part group -> material. Blue is the real excitation colour of the LEDs; green is the accent.
  const MAT = {
    board: () => M(0x0f241b, .1, .45), passive: () => M(0x4a4a4e, .5, .4), boost: () => M(0x151517, .2, .5),
    inductor: () => M(0x2a2a2d, .4, .5), mosfet: () => M(0x151517, .2, .5), conn: () => M(0x8f8a7e, 0, .8),
    esp32: () => M(0xb9bcc0, .85, .3), usbc: () => M(0xc9cbce, .9, .25), uart: () => M(0x151517, .2, .5),
    button: () => M(0x1b1b1d, .2, .6), display: () => M(0x8c8570, .1, .7), power: () => M(0x202022, .3, .5),
    led: () => M(0xe8ecf5, .1, .2, { emissive: 0x3d6bff, emissiveIntensity: 0 }), pd: () => M(0x16161a, .3, .25),
  };
  const root = new THREE.Group(); S.add(root);
  const naat = new THREE.Group(), hyb = new THREE.Group(); root.add(naat, hyb);
  const parts = { naat: {}, hyb: {} }, glow = new Map();
  // one NAAT channel = one blue LED + one photodiode, 4 along the board (positions from the CAD)
  const CH = [30, 10, -10, -30], CHX = 2.2;

  // simplified stack below the sensing board
  const blk = (w, h, d, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.castShadow = m.receiveShadow = true; return m; };
  const black = blk(24, 2, 78, M(0x0b0b0c, .1, .7));
  const chipMat = new THREE.MeshPhysicalMaterial({ color: 0xdfe9ef, metalness: 0, roughness: .05, transmission: .85, thickness: 3, transparent: true, opacity: .55 });
  const chip = new THREE.Group(); chip.add(blk(20, 3, 74, chipMat));
  const wellMat = M(0x16ec9a, 0, .3, { emissive: AC, emissiveIntensity: 0, transparent: true, opacity: .8 });
  CH.forEach(z => { const w = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 1.6, 32), wellMat); w.position.set(CHX, .8, z); chip.add(w); });
  const heater = new THREE.Group(); heater.add(blk(22, 1.6, 76, M(0xb7babd, .85, .35)));
  const trace = new THREE.Mesh(new THREE.BoxGeometry(14, .2, 64), M(0x3a2a1a, .6, .4)); trace.position.y = .9; heater.add(trace);
  root.add(black, chip, heater);
  glow.set(heater.children[0].material, 'heater');

  // light path for the last step: blue excitation cone down, green emission cone back up
  const cone = (col, op) => new THREE.Mesh(new THREE.ConeGeometry(3.2, 1, 32, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  const exc = cone(0x3d6bff, 0), emi = cone(AC, 0); root.add(exc, emi);

  // assembled vs exploded offsets (y, mm)
  const Y0 = { hyb: 14, naat: 0, black: -5, chip: -8.5, heater: -11 }, Y1 = { hyb: 62, naat: 0, black: -22, chip: -36, heater: -52 };
  const LIFT = { top: 7, bottom: -7 };
  const steps = [...sec.querySelectorAll('.st')], prog = sec.querySelector('.prog'), note = sec.querySelector('.loading');
  const HL = [[], ['hyb:esp32', 'hyb:usbc', 'hyb:uart', 'hyb:button', 'hyb:display', 'hyb:power'], ['naat:boost', 'naat:inductor', 'naat:mosfet', 'naat:conn'], ['naat:led', 'naat:pd'], ['chip'], ['heater']];
  let ready = false;

  const load = (url, grp, bag) => new Promise((res, rej) => new THREE.GLTFLoader().load(url, g => {
    g.scene.traverse(m => {
      if (!m.isMesh) return;
      const name = (m.name || m.parent?.name || 'passive').replace(/_\d+$/, '');
      m.material = (MAT[name] || MAT.passive)(); m.castShadow = m.receiveShadow = true;
      if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals();
      bag[name] = m; m.userData.y0 = m.position.y;
      if (name !== 'board' && name !== 'led') glow.set(m.material, (grp === naat ? 'naat:' : 'hyb:') + name);
    });
    grp.add(g.scene); res();
  }, undefined, rej));

  // load the CAD shortly before the section scrolls into view
  new IntersectionObserver((e, o) => {
    if (!e[0].isIntersecting) return; o.disconnect();
    Promise.all([load('/models/mediscan-naat.glb', naat, parts.naat), load('/models/mediscan-hybrid.glb', hyb, parts.hyb)])
      .then(() => { ready = true; if (note) note.hidden = true; })
      .catch(() => { if (note) note.textContent = 'Could not load the CAD model.'; });
  }, { rootMargin: '900px 0px' }).observe(sec);

  let vis = true; new IntersectionObserver(e => vis = e[0].isIntersecting).observe(sec);
  const clamp = x => Math.min(1, Math.max(0, x)), ease = x => x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2, sm = x => x * x * (3 - 2 * x), lerp = (a, b, t) => a + (b - a) * t;
  const tgt = new THREE.Vector3(), pos = new THREE.Vector3(), v = new THREE.Vector3();
  let sp = 0;

  function pose(sp, t) {
    const step = Math.min(5, Math.floor(sp * 6)), ex = ease(clamp(sp / .5)), zm = sm(clamp((sp - .84) / .14));
    steps.forEach((s, i) => s.classList.toggle('on', i === step));
    const Y = k => lerp(Y0[k], Y1[k], ex);
    hyb.position.y = Y('hyb'); naat.position.y = Y('naat'); black.position.y = Y('black'); chip.position.y = Y('chip'); heater.position.y = Y('heater');
    // components lift off their boards as the stack comes apart; LEDs and photodiodes drop toward the chip
    for (const bag of [parts.naat, parts.hyb]) for (const [n, m] of Object.entries(bag)) {
      if (n === 'board') continue;
      m.position.y = m.userData.y0 + ((n === 'led' || n === 'pd') ? LIFT.bottom : LIFT.top) * ex * (bag === parts.hyb ? .8 : 1);
    }
    const on = new Set(HL[step]);
    glow.forEach((key, mat) => { mat.emissive.setHex(on.has(key) ? AC : 0); mat.emissiveIntensity = on.has(key) ? .12 : 0; });
    chip.children[0].material.opacity = step === 4 ? .75 : .5;
    // LEDs switch on for the optical step and stay on into the close-up
    const led = step >= 3 ? (RM ? 1 : .9 + .2 * Math.sin(t / 180)) : 0;
    if (parts.naat.led) parts.naat.led.material.emissiveIntensity = led;
    wellMat.emissiveIntensity = zm * 1.2 + (step >= 4 ? .15 : 0);
    // excitation and emission cones for channel 1 in the close-up
    const ly = naat.position.y + LIFT.bottom * ex - 1.2, wy = chip.position.y + 1.6, h = Math.max(.1, ly - wy);
    exc.scale.set(1, h, 1); exc.position.set(CHX - .6, wy + h / 2, CH[0] + 1.8);
    emi.scale.set(.7, h, .7); emi.position.set(CHX + .6, wy + h / 2, CH[0] - 2); emi.rotation.x = 0;
    exc.material.opacity = zm * .35; emi.material.opacity = zm * .3;
    // camera: one framing per step (target height, distance, elevation), blended between steps.
    // The optical step looks up at the underside of the sensing board; the end closes on channel 1.
    const mid = (hyb.position.y + 8 + heater.position.y) / 2;
    const CAM = [
      [mid, 230, .55], [hyb.position.y, 150, .6], [naat.position.y + 4, 120, .55],
      [naat.position.y - 6, 105, -.45], [chip.position.y, 130, .4], [heater.position.y + 8, 140, .35],
    ];
    const u = Math.min(5, Math.max(0, sp * 6 - .5)), i0 = Math.floor(u), i1 = Math.min(5, i0 + 1), f = sm(u - i0);
    const [ty, rad, el] = CAM[i0].map((x, j) => lerp(x, CAM[i1][j], f));
    const a = (RM ? 0 : t / 16000) + .8 + sp * 1.2;
    pos.set(Math.sin(a) * Math.cos(el) * rad, ty + Math.sin(el) * rad, Math.cos(a) * Math.cos(el) * rad);
    tgt.set(0, ty, 0);
    const cp = v.set(CHX + 62, (ly + wy) / 2 + 16, CH[0] + 52), ct = new THREE.Vector3(CHX, (ly + wy) / 2, CH[0]);
    pos.lerp(cp, zm); tgt.lerp(ct, zm);
    const k = innerWidth > 900 ? 1 : Math.min(1.8, Math.max(1, 1.35 / cam.aspect));
    cam.position.copy(pos.sub(tgt).multiplyScalar(k).add(tgt)); cam.lookAt(tgt);
  }

  function frame(t) {
    requestAnimationFrame(frame); if (!vis) return;
    const r = sec.getBoundingClientRect(), p = clamp(-r.top / (r.height - innerHeight));
    sp += (p - sp) * (RM ? 1 : .12); prog.style.width = (sp * 100) + '%';
    if (ready) pose(sp, t);
    P.render();
  }
  requestAnimationFrame(frame);
}
