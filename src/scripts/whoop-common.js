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
};
export function mkStudio(cv, S, cam, o = {}) {
  const pr = Math.min(2, devicePixelRatio), exposure = o.exposure ?? 1;
  const r = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, powerPreference: 'high-performance' });
  r.setPixelRatio(pr); r.outputEncoding = THREE.sRGBEncoding; r.physicallyCorrectLights = false;
  r.shadowMap.enabled = !!o.shadows; r.shadowMap.type = THREE.PCFShadowMap;   // PCF so shadow.radius softens (it is ignored by PCFSoft in r149)
  r.setClearColor(bgFor(exposure), 1);
  S.environment = studioEnv(r);
  const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: r.capabilities.isWebGL2 ? 4 : 0 });
  const comp = new THREE.EffectComposer(r, rt); comp.setPixelRatio(pr);
  comp.addPass(new THREE.RenderPass(S, cam));
  // threshold far above any lit surface (a softbox reflected in metal reaches ~3) so only the LEDs, driven to ~8, bloom
  const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(512, 512), o.bloom ?? .55, .5, o.threshold ?? 4.5); comp.addPass(bloom);
  const aces = new THREE.ShaderPass(THREE.ACESFilmicToneMappingShader); aces.uniforms.exposure.value = exposure; comp.addPass(aces);
  comp.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
  let tuned = false, shadow = null; const ex = [];
  if (o.floor) {
    // faint studio floor pool under the rig, fading out to the page background
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 1], [.25, .55], [.45, .15], [.62, 0]].forEach(([p, a]) => gr.addColorStop(p, `rgba(255,255,255,${a})`));   // fades out well before the plane edge: no horizon line x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(o.floor.size, o.floor.size).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: lin(o.floor.tone ?? .02), alphaMap: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    floor.position.y = o.floor.y - .5; floor.renderOrder = 0; S.add(floor);
    ex.push(floor); shadow = contactShadow(S, r, { ...o.floor, exclude: ex });
  }
  return {
    r, comp, bloom,
    shadow: () => shadow && shadow(),
    exclude: (...m) => ex.push(...m),        // objects kept out of the contact shadow (glass, fades, glows)
    render() {
      if (!tuned) { tuned = true; S.traverse(m => { if (m.isMesh && m.material && 'envMapIntensity' in m.material && !m.userData.keepEnv) m.material.envMapIntensity = o.env ?? 1; }); }
      fit(r, cam, cv, comp); comp.render();
    },
  };
}

// WHOOP 5.0 sensor pod, sensor side up. Public specs: 5 LEDs (3 green, 1 red, 1 IR) and 4 photodiodes;
// footprint approximated from WHOOP 4.0 (about 34 x 24 mm) scaled 7% smaller. Layout approximated.
export function makePod(){const g=new THREE.Group(),ledMats=[];
 const shell=new THREE.MeshStandardMaterial({color:0x0c0c0d,metalness:.1,roughness:.5});
 const body=new THREE.Mesh(new THREE.RoundedBoxGeometry(32.6,9.6,23.4,6,4.2),shell);body.position.y=4.8;body.castShadow=body.receiveShadow=true;g.add(body);
 const lens=new THREE.Mesh(new THREE.RoundedBoxGeometry(21,1.6,13.5,5,3),new THREE.MeshPhysicalMaterial({color:0x0a0b0d,metalness:.1,roughness:.08,clearcoat:1,clearcoatRoughness:.05,envMapIntensity:1.3}));lens.position.y=9.9;g.add(lens);
 const ring=new THREE.Mesh(new THREE.RoundedBoxGeometry(22.6,.9,15.1,5,3.4),new THREE.MeshStandardMaterial({color:0x2a2b2f,metalness:.6,roughness:.35}));ring.position.y=9.4;g.add(ring);
 // LED row: G G R IR G ; photodiodes at the four corners of the window
 [[0x3dff9a,-6.4],[0x3dff9a,-3.2],[0xff3040,0],[0x7a1030,3.2],[0x3dff9a,6.4]].forEach(([c,x])=>{const m=new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0,roughness:.3});ledMats.push(m);const s=new THREE.Mesh(new THREE.RoundedBoxGeometry(1.8,.5,1.8,2,.3),m);s.position.set(x,10.8,0);g.add(s)});
 const pdM=new THREE.MeshStandardMaterial({color:0x2c3a4a,metalness:.5,roughness:.2});
 [[-7.8,4],[7.8,4],[-7.8,-4],[7.8,-4]].forEach(([x,z])=>{const s=new THREE.Mesh(new THREE.RoundedBoxGeometry(3.2,.4,2.6,2,.3),pdM);s.position.set(x,10.75,z);g.add(s)});
 // strap clasp slots on the short ends
 [-17.2,17.2].forEach(x=>{const s=new THREE.Mesh(new THREE.BoxGeometry(1.2,4,16),new THREE.MeshStandardMaterial({color:0x0c0c0d,roughness:.8}));s.position.set(x,4.8,0);g.add(s)});
 return {g,ledMats}}

