import { THREE } from './three-lib.js';

export const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
export const AC=0x16ec9a;
export function mkRenderer(cv){const r=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});r.setPixelRatio(Math.min(2,devicePixelRatio));r.outputEncoding=THREE.sRGBEncoding;return r}
export function fit(r,cam,cv,comp){const w=cv.clientWidth,h=cv.clientHeight;if(!w||!h)return;const c=r.domElement;if(c.width!==Math.floor(w*r.getPixelRatio())||c.height!==Math.floor(h*r.getPixelRatio())){r.setSize(w,h,false);if(comp)comp.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix()}}
// higher-fidelity pipeline: PBR env lighting, soft shadows, bloom on emissive LEDs
export function mkPipe(cv,S,cam,o={}){const r=mkRenderer(cv);r.physicallyCorrectLights=false;r.shadowMap.enabled=!!o.shadows;r.shadowMap.type=THREE.PCFSoftShadowMap;
 const pm=new THREE.PMREMGenerator(r);S.environment=pm.fromScene(new THREE.RoomEnvironment(),.04).texture;
 const comp=new THREE.EffectComposer(r);comp.addPass(new THREE.RenderPass(S,cam));
 r.setClearColor(new THREE.Color().setRGB(.0044,.0044,.0048),1);const bloom=new THREE.UnrealBloomPass(new THREE.Vector2(512,512),o.bloom??.7,.45,.985);comp.addPass(bloom);comp.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
 let tuned=false;return {r,comp,bloom,render(){if(!tuned){tuned=true;S.traverse(m=>{if(m.isMesh&&m.material&&'envMapIntensity' in m.material&&!m.userData.keepEnv)m.material.envMapIntensity=o.env??.45})}fit(r,cam,cv,comp);comp.render()}}}

/* ---------- studio pipeline (used by the WHOOP testbed) ----------
   Half-float, 4x MSAA scene buffer -> bloom (only HDR values above 1, i.e. lit LEDs) -> ACES filmic
   tone mapping -> sRGB. Lit by a PMREM environment of softbox strips so metal edges catch crisp
   highlights. Material colours below are linear values (r149 legacy colour mode uses them as-is). */
const ACES = x => { x /= .6; const a = x * (x + .0245786) - .000090537, b = x * (.983729 * x + .432951) + .238081; return Math.max(0, a / b); };
// linear clear value that lands on the page background (#0e0e0f) after exposure + ACES + sRGB
function bgFor(exposure) {
  const lin = c => { c /= 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
  const solve = t => { let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; ACES(m * exposure) < t ? lo = m : hi = m; } return lo; };
  return new THREE.Color().setRGB(solve(lin(14)), solve(lin(14)), solve(lin(15)));
}
function studioEnv(r) {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(24, 24, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color().setScalar(.012), side: THREE.BackSide }));
  s.add(room);
  const box = (w, h, v, pos, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * v, tint[1] * v, tint[2] * v), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  box(9, 3.2, 5.5, [0, 9, 1]);                        // overhead key softbox
  box(1.1, 9, 28, [-8, 2.5, 3], [.96, .98, 1]);       // left strip: long vertical edge highlights on dark metal
  box(1.1, 9, 22, [8, 2.5, -2], [1, .98, .95]);       // right strip
  box(10, .9, 14, [0, 3, -9]);                        // rim strip behind: separates black parts from the background
  box(4, 4, .6, [0, -9, 0]);                          // faint floor bounce
  const pm = new THREE.PMREMGenerator(r); const t = pm.fromScene(s, .015).texture; pm.dispose(); return t;
}
// soft contact shadow on a floor plane: depth-render from below, blur, show on a plane (after the three.js contact-shadow example)
function contactShadow(S, r, o) {
  const P = o.size, RES = 512, g = new THREE.Group(); g.position.y = o.y; S.add(g);
  const rt = new THREE.WebGLRenderTarget(RES, RES), rtB = new THREE.WebGLRenderTarget(RES, RES);
  rt.texture.generateMipmaps = rtB.texture.generateMipmaps = false;
  const geo = new THREE.PlaneGeometry(P, P).rotateX(Math.PI / 2);
  const plane = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: rt.texture, transparent: true, opacity: o.opacity ?? .9, depthWrite: false }));
  plane.renderOrder = 1; plane.scale.y = -1; g.add(plane);
  const blurPlane = new THREE.Mesh(geo); blurPlane.visible = false; g.add(blurPlane);
  const cam = new THREE.OrthographicCamera(-P / 2, P / 2, P / 2, -P / 2, 0, o.height); cam.rotation.x = Math.PI / 2; g.add(cam);
  const depth = new THREE.MeshDepthMaterial(); depth.userData.darkness = { value: o.darkness ?? 1.2 };
  depth.onBeforeCompile = sh => { sh.uniforms.darkness = depth.userData.darkness; sh.fragmentShader = 'uniform float darkness;\n' + sh.fragmentShader.replace('gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );', 'gl_FragColor = vec4( vec3( 0.0 ), ( 1.0 - fragCoordZ ) * darkness );'); };
  depth.depthTest = depth.depthWrite = false;
  const hB = new THREE.ShaderMaterial(THREE.HorizontalBlurShader), vB = new THREE.ShaderMaterial(THREE.VerticalBlurShader); hB.depthTest = vB.depthTest = false;
  const blur = a => { blurPlane.visible = true; blurPlane.material = hB; hB.uniforms.tDiffuse.value = rt.texture; hB.uniforms.h.value = a / 256; r.setRenderTarget(rtB); r.render(blurPlane, cam);
    blurPlane.material = vB; vB.uniforms.tDiffuse.value = rtB.texture; vB.uniforms.v.value = a / 256; r.setRenderTarget(rt); r.render(blurPlane, cam); blurPlane.visible = false; };
  return function update() {
    const hide = (o.exclude || []).filter(m => m.visible); hide.forEach(m => m.visible = false); plane.visible = false;
    const cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha(); r.setClearColor(0x000000, 0);
    S.overrideMaterial = depth; r.setRenderTarget(rt); r.clear(); r.render(S, cam); S.overrideMaterial = null;
    blur(o.blur ?? 2.5); blur((o.blur ?? 2.5) * .4);
    r.setRenderTarget(null); r.setClearColor(cc, ca); plane.visible = true; hide.forEach(m => m.visible = true);
  };
}
// shared fine noise, used as a roughness map so surfaces are never perfectly uniform
let _noise;
export function noiseTex() {
  if (_noise) return _noise;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) { const v = 205 + Math.random() * 50; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); x.filter = 'blur(1px)'; x.drawImage(c, 0, 0);
  _noise = new THREE.CanvasTexture(c); _noise.wrapS = _noise.wrapT = THREE.RepeatWrapping; _noise.repeat.set(3, 3); return _noise;
}
const lin = (r, g = r, b = r) => new THREE.Color().setRGB(r, g, b);
const std = (o, noise = true) => new THREE.MeshStandardMaterial(Object.assign(noise ? { roughnessMap: noiseTex() } : {}, o));
// physically based recipes (base colours from physicallybased.info; black anodize modelled as a dark metal)
export const PBR = {
  anodBlack:   () => std({ color: lin(.028), metalness: 1, roughness: .48 }),
  anodDeep:    () => std({ color: lin(.018), metalness: 1, roughness: .5 }),
  breadboard:  () => std({ color: lin(.022), metalness: 1, roughness: .62 }),
  beadAlu:     () => std({ color: lin(.6), metalness: 1, roughness: .45 }),
  steel:       () => std({ color: lin(.67, .64, .6), metalness: 1, roughness: .14 }, false),
  silverAnod:  () => std({ color: lin(.55), metalness: 1, roughness: .38 }),
  redAnod:     () => std({ color: lin(.3, .018, .02), metalness: 1, roughness: .38 }),
  maroon:      () => std({ color: lin(.075, .012, .016), metalness: 0, roughness: .5 }),
  plastic:     () => std({ color: lin(.02), metalness: 0, roughness: .45 }),
  rubber:      () => std({ color: lin(.012), metalness: 0, roughness: .85 }, false),
  brass:       () => std({ color: lin(.9, .64, .3), metalness: 1, roughness: .3 }, false),
  hole:        () => new THREE.MeshStandardMaterial({ color: lin(.002), metalness: 0, roughness: 1 }),
  satin:       () => std({ color: lin(.6, .58, .55), metalness: 1, roughness: .3 }),
  kRed:        () => std({ color: lin(.2, .012, .016), metalness: 1, roughness: .42 }),   // K-Cube side extrusion
  hardboard:   () => std({ color: lin(.01), metalness: 0, roughness: .92 }),
};
// rounded rectangle centred on the origin (a Shape, or a Path when used as a hole)
export function rrShape(w, d, r, T = THREE.Shape) {
  const s = new T(), x = w / 2, y = d / 2; r = Math.max(.01, Math.min(r, x, y));
  s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0);
  s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2);
  s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI);
  s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5);
  return s;
}
// rounded-rectangle prism: outer size w x h x d (x, y, z), plan corner radius r, edges softened by b,
// bottom at y = 0. Holes are Paths in plan coordinates (x, -z).
export function slab(w, d, h, r, b, mat, holes = []) {
  const s = rrShape(w - 2 * b, d - 2 * b, r - b); s.holes.push(...holes);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(.01, h - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 12 });
  g.rotateX(-Math.PI / 2); g.translate(0, b, 0);
  const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; return m;
}
export function mkStudio(cv, S, cam, o = {}) {
  const pr = Math.min(2, devicePixelRatio), exposure = o.exposure ?? 1;
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(pr); r.outputEncoding = THREE.sRGBEncoding; r.physicallyCorrectLights = false;
  r.shadowMap.enabled = !!o.shadows; r.shadowMap.autoUpdate = false; r.shadowMap.type = THREE.PCFShadowMap;   // PCF so shadow.radius softens (it is ignored by PCFSoft in r149)
  r.setClearColor(bgFor(exposure), 1);
  S.environment = studioEnv(r);
  const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: r.capabilities.isWebGL2 ? 4 : 0 });
  const comp = new THREE.EffectComposer(r, rt); comp.setPixelRatio(pr);
  comp.addPass(new THREE.RenderPass(S, cam));
  // threshold far above any lit surface (a softbox reflected in metal reaches ~3) so only the LEDs, driven to ~8, bloom
  const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(512, 512), o.bloom ?? .55, .5, o.threshold ?? 4.5); comp.addPass(bloom);
  // ACES tone mapping and sRGB output in one full-screen pass
  const A = THREE.ACESFilmicToneMappingShader, aces = new THREE.ShaderPass({ ...A, fragmentShader: A.fragmentShader.replace('gl_FragColor = vec4( ACESFilmicToneMapping( tex.rgb ), tex.a );', 'gl_FragColor = LinearTosRGB( vec4( ACESFilmicToneMapping( tex.rgb ), tex.a ) );') });
  aces.uniforms.exposure.value = exposure; comp.addPass(aces);
  let tuned = false, shadow = null; const ex = [];
  if (o.floor) {
    // faint studio floor pool under the rig, fading out to the page background
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 1], [.2, .6], [.45, .2], [.7, .05], [.9, 0]].forEach(([p, a]) => gr.addColorStop(p, `rgba(255,255,255,${a})`));   // fades out well before the plane edge: no horizon line
    x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(o.floor.size, o.floor.size).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: lin(o.floor.tone ?? .02), alphaMap: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    floor.position.y = o.floor.y - .5; floor.renderOrder = 0; S.add(floor);
    ex.push(floor); shadow = contactShadow(S, r, { ...o.floor, exclude: ex });
  }
  // adaptive resolution: only if frames stay slow (after warm-up) step the pixel ratio down, never below 1
  let prNow = pr, ema = 16, n = 0;
  const adapt = dt => {
    if (!(dt > 0 && dt < 250)) return; ema += (dt - ema) * .05;
    if (++n > 90 && ema > 24 && prNow > 1) { prNow = Math.max(1, prNow - .25); r.setPixelRatio(prNow); comp.setPixelRatio(prNow); n = 60; ema = 16; }
  };
  return {
    r, comp, bloom, adapt,
    shadow: () => { r.shadowMap.needsUpdate = true; shadow && shadow(); },   // call when parts move (the shadow map is not redrawn every frame)
    exclude: (...m) => ex.push(...m),        // objects kept out of the contact shadow (glass, fades, glows)
    render() {
      if (!tuned) { tuned = true; S.traverse(m => { if (m.isMesh && m.material && 'envMapIntensity' in m.material && !m.userData.keepEnv) m.material.envMapIntensity = o.env ?? 1; }); }
      fit(r, cam, cv, comp); comp.render();
    },
  };
}

// WHOOP 5.0 sensor pod, sensor side up (+y), long axis along x. Official size 34.7 x 24 x 10.6 mm
// (WHOOP support). Underside from review photos: a raised glossy plateau with one recessed window;
// along the length 2 photodiodes, a line of 5 LEDs (3 green, 1 red, 1 IR) across the width, 2 photodiodes.
// Component sizes and LED order are approximated.
export function makePod() {
  const g = new THREE.Group(), ledMats = [], leds = [], L = 34.7, W = 24, HB = 9.6;
  g.add(slab(L, W, HB, 5.4, 1.6, std({ color: lin(.012), metalness: 0, roughness: .55 })));   // matte black body
  const dark = new THREE.MeshStandardMaterial({ color: lin(.002), roughness: 1 });
  [1, -1].forEach(sd => { const m = new THREE.Mesh(new THREE.BoxGeometry(L - 12, .8, .14), dark); m.position.set(0, 7.3, sd * (W / 2 + .02)); g.add(m); });   // band rail groove
  // glossy plateau with the window cut through it (hole oversized by the bevel)
  const WL = 20.4, WW = 9.8, gloss = new THREE.MeshPhysicalMaterial({ color: lin(.006), metalness: .5, roughness: .12, clearcoat: 1, clearcoatRoughness: .04 });
  const plat = slab(30.4, 19.6, 1, 4.2, .3, gloss, [rrShape(WL + .6, WW + .6, 3.3, THREE.Path)]); plat.position.y = HB - .02; g.add(plat);
  const floor = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(WL + .4, WW + .4, 3.2)).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: lin(.004), roughness: .5 }));
  floor.position.y = HB + .2; g.add(floor);
  // photodiodes: dark violet dies with a gold pad strip on the outer edge
  const pd = new THREE.MeshStandardMaterial({ color: lin(.03, .012, .06), metalness: .3, roughness: .22 }), gold = new THREE.MeshStandardMaterial({ color: lin(.9, .64, .3), metalness: 1, roughness: .3 });
  [-7.3, -3.9, 3.9, 7.3].forEach(x => {
    const d = new THREE.Mesh(new THREE.BoxGeometry(2.6, .3, 6.4), pd); d.position.set(x, HB + .35, 0); g.add(d);
    const s = new THREE.Mesh(new THREE.BoxGeometry(.5, .32, 6.4), gold); s.position.set(x + Math.sign(x) * 1.05, HB + .36, 0); g.add(s);
  });
  // LEDs: pale dies when off, driven emissive by the scene
  [0x12ff4a, 0x12ff4a, 0xff1424, 0x5a0818, 0x12ff4a].forEach((c, i) => {   // saturated so the lit dies read as colour, not white
    const m = new THREE.MeshStandardMaterial({ color: lin(.25), emissive: c, emissiveIntensity: 0, roughness: .3 }); ledMats.push(m);
    const s = new THREE.Mesh(new THREE.BoxGeometry(1.1, .3, 1.1), m); s.position.set(0, HB + .35, (i - 2) * 1.55); s.userData.c = c; leds.push(s); g.add(s);
  });
  // window glass, flush just under the plateau top
  const glass = new THREE.Mesh(new THREE.ShapeGeometry(rrShape(WL + .4, WW + .4, 3.2)).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: lin(.01), metalness: 0, roughness: .04, clearcoat: 1, transparent: true, opacity: .3, depthWrite: false }));
  glass.position.y = HB + .8; g.add(glass);
  const loz = slab(2.8, 6, .14, 1.35, .05, std({ color: lin(.05), metalness: .8, roughness: .35 })); loz.position.set(12.8, HB + .96, 0); g.add(loz);   // plain lozenge at the clasp end
  return { g, ledMats, leds };
}
