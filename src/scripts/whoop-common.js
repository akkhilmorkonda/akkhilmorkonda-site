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
// WHOOP 5.0 sensor pod, sensor side up. Public specs: 5 LEDs (3 green, 1 red, 1 IR) and 4 photodiodes;
// footprint approximated from WHOOP 4.0 (about 34 x 24 mm) scaled 7% smaller. Layout approximated.
export function makePod(){const g=new THREE.Group(),ledMats=[];
 const shell=new THREE.MeshStandardMaterial({color:0x151618,metalness:.3,roughness:.38});
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

