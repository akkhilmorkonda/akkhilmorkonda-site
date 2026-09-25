import { THREE } from './three-lib.js';
import { RM, AC, mkRenderer, fit, mkPipe, makePod } from './whoop-common.js';
/* ================= TESTBED EXPLODE ================= */
(()=>{const cv=document.getElementById('rig'),S=new THREE.Scene();
 const cam=new THREE.PerspectiveCamera(32,1,1,6000);const P=mkPipe(cv,S,cam,{shadows:true,bloom:.85});
 S.add(new THREE.HemisphereLight(0xdfe8e4,0x0b0b0c,.3));const dl=new THREE.DirectionalLight(0xffffff,.95);dl.position.set(260,480,300);dl.castShadow=true;dl.shadow.mapSize.set(2048,2048);Object.assign(dl.shadow.camera,{left:-320,right:320,top:320,bottom:-320,near:10,far:1400});dl.shadow.bias=-.0006;dl.shadow.radius=4;S.add(dl);const rl=new THREE.DirectionalLight(0x9fe8c8,.3);rl.position.set(-320,180,-220);S.add(rl);
 const M=(c,m=.3,r=.55)=>new THREE.MeshStandardMaterial({color:c,metalness:m,roughness:r});
 const black=()=>M(0x1b1b1d,.35,.5),anod=()=>M(0x121214,.45,.42),alu=()=>M(0xbfc2c6,.85,.3),steel=()=>M(0x8e9195,.9,.28),silver=()=>M(0xc9cbce,.8,.34);
 const box=(w,h,d,mat,x,y,z)=>{const rr=Math.min(1.6,Math.min(w,h,d)/3.2);const m=new THREE.Mesh(rr>.3?new THREE.RoundedBoxGeometry(w,h,d,2,rr):new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;return m};
 const cyl=(r,h,mat,x,y,z,ax='y',seg=32)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,seg),mat);m.position.set(x,y,z);if(ax=='x')m.rotation.z=Math.PI/2;if(ax=='z')m.rotation.x=Math.PI/2;m.castShadow=m.receiveShadow=true;return m};
 const rbox=(w,d,h,r,mat)=>{const s=new THREE.Shape(),x=-w/2,y=-d/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+d-r);s.quadraticCurveTo(x+w,y+d,x+w-r,y+d);s.lineTo(x+r,y+d);s.quadraticCurveTo(x,y+d,x,y+d-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
  const g=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelThickness:1.6,bevelSize:1.6,bevelSegments:4,curveSegments:10});g.rotateX(-Math.PI/2);return new THREE.Mesh(g,mat)};
 const G=n=>{const g=new THREE.Group();g.name=n;S.add(g);return g};

 // enclosure
 const enc=G('enc');const encM=new THREE.MeshStandardMaterial({color:0x050505,roughness:1,transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false});
 enc.add(box(340,250,4,encM,0,125,-200));enc.add(box(4,250,400,encM,170,125,0));enc.add(box(340,4,400,encM,0,252,0));
 // breadboard (25 mm hole grid)
 const bb=G('board');bb.add(box(300,12,380,anod(),0,6,0));
 const hm=new THREE.InstancedMesh(new THREE.CylinderGeometry(2.6,2.6,1,12),M(0x030303,0,1),12*15);let k=0;const o=new THREE.Object3D();
 for(let i=0;i<12;i++)for(let j=0;j<15;j++){o.position.set(-137.5+i*25,12.2,-175+j*25);o.updateMatrix();hm.setMatrixAt(k++,o.matrix)}bb.add(hm);
 // motor controllers, one per axis
 const ctrl=G('ctrl');for(let i=0;i<3;i++){const x=-20+i*70;ctrl.add(box(60,60,58,black(),x,42,-160));ctrl.add(box(48,20,2,M(0x2a2b2e,.2,.6),x,56,-130.5));ctrl.add(box(28,9,6,steel(),x,36,-129));ctrl.add(cyl(2.6,8,steel(),x-18,36,-128,'z',12));ctrl.add(cyl(2.6,8,steel(),x+18,36,-128,'z',12))}
 // base plate with DUT pocket
 const bp=G('baseplate');bp.add(box(150,10,130,black(),-60,17,62));bp.add(box(40,1,30,M(0x050505,0,1),-60,22.2,70));
 [[-128,6],[8,6],[-128,120],[8,120]].forEach(([x,z])=>bp.add(cyl(4.5,2.4,steel(),x,23,z,'y',16)));
 // Thorlabs 3-axis stage: X, Y, Z + actuators
 const sx=G('stX');sx.add(box(78,16,78,black(),-60,20,-48));sx.add(box(70,3,6,steel(),-60,29,-86));sx.add(cyl(6.5,118,black(),-60+39+59,25,-48,'x'));sx.add(cyl(8.5,14,steel(),-60+39+6,25,-48,'x'));
 const sy=G('stY');sy.add(box(78,16,78,anod(),-60,36,-48));sy.add(box(6,3,70,steel(),-20,45,-48));sy.add(cyl(6.5,118,black(),-60,41,-48-39-59,'z'));sy.add(cyl(8.5,14,steel(),-60,41,-48-39-6,'z'));
 const sz=G('stZ');sz.add(box(78,122,20,black(),-60,105,-20));sz.add(box(66,72,8,anod(),-60,96,-6));
 for(let i=0;i<3;i++)for(let j=0;j<2;j++)sz.add(cyl(2.4,1,M(0x050505,0,1),-78+i*18,150-j*16,-9.4,'z',12));
 const za=G('zAct');za.add(box(28,16,22,black(),-60,174,-20));za.add(box(16,5,1,M(0xd8d0b0,.2,.5),-60,176,-8.6));za.add(cyl(7,130,M(0x2a2b2e,.5,.4),-60,247,-20));za.add(cyl(3,12,M(0xc8a24a,.8,.3),-60,186,-20,'y',16));
 // precision fixture: aluminum L-bracket on the Z carriage, dowel pins, fiber probe head over the DUT
 const fx=G('fx');fx.add(box(72,64,10,alu(),-60,82,3));fx.add(box(94,10,74,alu(),-60,50,44));
 fx.add(cyl(4.2,28,steel(),-92,69,18,'y',20));fx.add(cyl(4.2,28,steel(),-28,69,18,'y',20));
 [[-82,98],[-38,98],[-82,70],[-38,70]].forEach(([x,y])=>fx.add(cyl(4,1,M(0x050505,0,1),x,y,8.2,'z',14)));
 fx.add(cyl(20,6,anod(),-60,58,66,'y',48));fx.add(box(34,6,9,black(),-58,64,64));fx.add(cyl(2,3,steel(),-70,68,64,'y',12));fx.add(cyl(2,3,steel(),-48,68,64,'y',12));
 fx.add(cyl(1.8,14,steel(),-60,41,70,'y',12));
 // analysers
 const ana=G('ana');[[62,0x2a6fd6,false],[134,0xb3261e,true]].forEach(([x,c,ir])=>{ana.add(box(56,30,88,silver(),x,27,118));ana.add(box(50,2,44,M(0x111111,.1,.8),x,43,110));ana.add(box(38,1,18,M(c,.1,.6),x,44.5,100));ana.add(box(30,8,2,steel(),x,20,162.5));if(ir){ana.add(box(2,26,84,M(0xb3261e,.2,.5),x-29,27,118));ana.add(box(2,26,84,M(0xb3261e,.2,.5),x+29,27,118))}});
 // fibers and motor cables (fade out while exploded)
 const fib=G('fib');const fm=new THREE.MeshStandardMaterial({color:0x0d0d0d,roughness:.7,transparent:true});
 const tube=(pts,r)=>fib.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),80,r,8,false),fm));
 tube([[-58,64,64],[-40,95,95],[10,90,120],[50,60,90],[62,45,78]],1.3);tube([[-58,64,64],[-30,110,40],[60,110,50],[120,70,70],[134,45,78]],1.3);
 tube([[-60,312,-20],[-90,330,-60],[-60,120,-140],[-20,40,-131]],1.8);tube([[57,25,-48],[80,40,-100],[50,36,-131]],1.8);tube([[-60,41,-165],[40,45,-150],[120,36,-131]],1.8);
 // DUT: WHOOP 5.0 sensor pod, sensor side up in the base-plate pocket
 const dut=G('dut');const pod=makePod();pod.g.position.set(-60,22.4,70);dut.add(pod.g);const ledMats=pod.ledMats;
 const glow=new THREE.PointLight(0x3dff9a,0,160,2);glow.position.set(-60,42,70);S.add(glow);
 // light cone above the LEDs (bridges into "What it measures")
 const NC=1400,cp=new Float32Array(NC*3),cs=new Float32Array(NC);for(let i=0;i<NC;i++){const h=Math.random()**.8*70,a=Math.random()*6.283,rr=Math.random()**.6*(3+h*.55);cp.set([-60+Math.cos(a)*rr,34+h,68+Math.sin(a)*rr],i*3);cs[i]=Math.max(.05,(1-rr/(3+h*.55))*(1-h/80))}
 const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.BufferAttribute(cp,3));cg.setAttribute('size',new THREE.BufferAttribute(cs,1));
 const cmat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{op:{value:0},px:{value:Math.min(2,devicePixelRatio)}},
  vertexShader:`attribute float size;varying float vS;uniform float px;void main(){vS=size;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=(1.5+size*5.)*px*(160./-mv.z);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying float vS;uniform float op;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(mix(vec3(.05,.55,.35),vec3(.75,1.,.9),vS),op*(.25+.75*vS)*smoothstep(.5,.1,d));}`});
 const cone=new THREE.Points(cg,cmat);S.add(cone);

 const groups=[enc,bb,ctrl,bp,sx,sy,sz,za,fx,ana,fib,dut];
 const EX={enc:[0,140,-260],ctrl:[0,24,-90],stX:[0,0,-70],stY:[0,45,-70],stZ:[0,95,-70],zAct:[0,190,-70],fx:[0,150,-10],ana:[90,20,70]};
 const HL=[['enc'],['board','ctrl'],['stX','stY','stZ','zAct'],['fx','baseplate'],['ana','fib'],['dut']];
 const base={};groups.forEach(g=>base[g.name]=g.position.clone());
 const glowMats=new Map();groups.filter(g=>!['enc','fib'].includes(g.name)).forEach(g=>g.traverse(m=>{if(m.isMesh&&m.material.emissive&&!ledMats.includes(m.material)){m.material=m.material.clone();glowMats.set(m.material,g.name)}}));
 const sec=document.getElementById('explode'),steps=[...document.querySelectorAll('.st')],prog=document.getElementById('prog');
 let vis=true;new IntersectionObserver(e=>vis=e[0].isIntersecting).observe(sec);
 const clamp=x=>Math.min(1,Math.max(0,x)),ease=x=>x<.5?2*x*x:1-(-2*x+2)**2/2,sm=x=>x*x*(3-2*x),lerp=(a,b,t)=>a+(b-a)*t;
 const DUTP=new THREE.Vector3(-60,33,70);let sp=0;
 function frame(t){requestAnimationFrame(frame);if(!vis)return;
  const r=sec.getBoundingClientRect(),tot=r.height-innerHeight;const p=clamp(-r.top/tot);sp+=(p-sp)*(RM?1:.12);prog.style.width=(sp*100)+'%';
  pose(sp,t);P.render()}
 function pose(sp,t){
  const step=Math.min(5,Math.floor(sp*6)),ex=ease(clamp(sp/.6)),zm=sm(clamp((sp-.8)/.17));
  steps.forEach((s,i)=>s.classList.toggle('on',i==step));
  const AW={fx:[0,260,-200],stZ:[0,140,-120],zAct:[0,200,-120],stY:[0,0,-80],stX:[0,0,-80],ana:[60,0,40]};
  groups.forEach(g=>{const e=EX[g.name]||[0,0,0],w=AW[g.name]||[0,0,0];g.position.set(base[g.name].x+e[0]*ex+w[0]*zm,base[g.name].y+e[1]*ex+w[1]*zm,base[g.name].z+e[2]*ex+w[2]*zm)});
  encM.opacity=.5*(1-clamp(ex*1.8));fm.opacity=1-clamp(ex*2);
  const on=new Set(HL[step]);glowMats.forEach((n,mat)=>{mat.emissive.setHex(on.has(n)&&step<5?AC:0);mat.emissiveIntensity=on.has(n)?.07:0});
  const led=zm>0?zm*(1.3+(RM?0:.35*Math.sin(t/160))):0;ledMats.forEach(m=>m.emissiveIntensity=led);glow.intensity=zm*1.6;cmat.uniforms.op.value=zm*.9;cone.rotation.y=0;
  const a=(RM?0:t/10000)+.75+sp*1.1,rad=lerp(760+ex*140,150,zm);
  const orbit=new THREE.Vector3(Math.sin(a)*rad,340+ex*170,Math.cos(a)*rad),tgt=new THREE.Vector3(0,110+ex*110,0);
  const closeP=new THREE.Vector3(DUTP.x+70,DUTP.y+105,DUTP.z+120),closeT=new THREE.Vector3(DUTP.x,DUTP.y+14,DUTP.z);
  cam.position.lerpVectors(orbit,closeP,zm);tgt.lerp(closeT,zm);
  // narrow (phone) canvases: pull back so the whole rig stays in frame at every orbit angle
  const k=innerWidth>900?1:Math.min(1.8,Math.max(1,1.35/cam.aspect));cam.position.sub(tgt).multiplyScalar(k).add(tgt);cam.lookAt(tgt)}
 requestAnimationFrame(frame);
})();

