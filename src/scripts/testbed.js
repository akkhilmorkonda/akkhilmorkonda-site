import { THREE } from './three-lib.js';
import { RM, AC, mkStudio, PBR, makePod, rrShape, slab } from './whoop-common.js';
/* ================= TESTBED EXPLODE =================
   Millimetre units, y up, breadboard top at y = 12.7. Parts are modelled from the Thorlabs drawings
   (MT3/M-Z9 stage, KDC101 K-Cube, MB3045/M breadboard) and Feasa datasheet sizes; no vendor CAD is shipped. */
(()=>{const cv=document.getElementById('rig'),S=new THREE.Scene();
 const cam=new THREE.PerspectiveCamera(32,1,1,6000);const P=mkStudio(cv,S,cam,{shadows:true,bloom:.5,exposure:1.1,floor:{y:0,size:2600,height:420,opacity:.95,blur:2.5,tone:.008}});
 S.add(new THREE.HemisphereLight(0xdfe8e4,0x0b0b0c,.12));const dl=new THREE.DirectionalLight(0xffffff,1.15);dl.position.set(260,480,300);dl.castShadow=true;dl.shadow.mapSize.set(2048,2048);Object.assign(dl.shadow.camera,{left:-380,right:380,top:380,bottom:-380,near:10,far:1500});dl.shadow.bias=-.0006;dl.shadow.radius=4;S.add(dl);const rl=new THREE.DirectionalLight(0x9fe8c8,.3);rl.position.set(-320,180,-220);S.add(rl);
 const V=(x,y,z)=>new THREE.Vector3(x,y,z),UP=V(0,1,0);
 const black=PBR.anodBlack(),alu=PBR.beadAlu(),steel=PBR.steel(),satin=PBR.satin(),plastic=PBR.plastic(),rubber=PBR.rubber(),hole=PBR.hole(),brass=PBR.brass();
 alu.color.setScalar(.38);
 const sh=m=>{m.castShadow=m.receiveShadow=true;return m};
 const box=(w,h,d,mat,x,y,z,r)=>{r=r??Math.min(1.6,Math.min(w,h,d)/3.2);const m=new THREE.Mesh(r>.25?new THREE.RoundedBoxGeometry(w,h,d,2,r):new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);return sh(m)};
 // cylinder along an axis; r2 gives a frustum (top radius), for chamfers and strain reliefs
 const cyl=(r,h,mat,x,y,z,ax='y',seg=32,r2=r)=>{const m=sh(new THREE.Mesh(new THREE.CylinderGeometry(r2,r,h,seg),mat));m.position.set(x,y,z);if(ax=='x')m.rotation.z=-Math.PI/2;if(ax=='z')m.rotation.x=Math.PI/2;return m};
 const aim=(o,d)=>o.quaternion.setFromUnitVectors(UP,d.clone().normalize());
 const G=n=>{const g=new THREE.Group();g.name=n;S.add(g);return g};
 // socket-head cap screws, instanced: pts are head seats, heads rise along dir
 const hG=new THREE.CylinderGeometry(1,1,1,20),kG=new THREE.CylinderGeometry(1,1,1,6);
 const screws=(g,pts,d=10,h=6,dir=UP)=>{const a=new THREE.InstancedMesh(hG,satin,pts.length),b=new THREE.InstancedMesh(kG,hole,pts.length),o=new THREE.Object3D(),q=new THREE.Quaternion().setFromUnitVectors(UP,dir);
  pts.forEach((p,i)=>{o.position.set(...p);o.quaternion.copy(q);o.translateY(h/2);o.scale.set(d/2,h,d/2);o.updateMatrix();a.setMatrixAt(i,o.matrix);o.translateY(h/2-.18);o.scale.set(d*.2,.4,d*.2);o.updateMatrix();b.setMatrixAt(i,o.matrix)});
  a.castShadow=a.receiveShadow=true;g.add(a,b)};
 // printed labels: canvas text on a transparent plane (faces +z) or a sleeve around a cylinder
 const ink=(tex)=>new THREE.MeshStandardMaterial({map:tex,transparent:true,depthWrite:false,roughness:.7,metalness:0,polygonOffset:true,polygonOffsetFactor:-4});
 const label=(lines,w,h,px=14)=>{const c=document.createElement('canvas');c.width=Math.ceil(w*px);c.height=Math.ceil(h*px);const x=c.getContext('2d');x.fillStyle='#b4b4ae';x.textAlign='center';x.textBaseline='middle';
  lines.forEach(([t,s,y,wt=700])=>{x.font=`${wt} ${s*px}px Arial, Helvetica, sans-serif`;x.fillText(t,c.width/2,y*px)});const t=new THREE.CanvasTexture(c);t.anisotropy=8;return new THREE.Mesh(new THREE.PlaneGeometry(w,h),ink(t))};
 const sleeve=(txt,r,len,deg=60,px=14)=>{const th=deg*Math.PI/180,aw=r*th,c=document.createElement('canvas');c.width=Math.ceil(aw*px);c.height=Math.ceil(len*px);const x=c.getContext('2d');x.fillStyle='#b4b4ae';x.translate(c.width/2,c.height/2);x.rotate(-Math.PI/2);x.textAlign='center';x.textBaseline='middle';x.font=`700 ${aw*.42*px}px Arial, Helvetica, sans-serif`;x.fillText(txt,0,0);
  const t=new THREE.CanvasTexture(c);t.anisotropy=8;return new THREE.Mesh(new THREE.CylinderGeometry(r+.05,r+.05,len,16,1,true,-th/2,th),ink(t))};
 // ribbed extrusion side panel: ribs run along z; profile thickness t plus rib height h, n ribs over height H
 const ribGeo=(H,D,n,t,h)=>{const s=new THREE.Shape(),p=H/n;s.moveTo(0,-H/2);s.lineTo(t,-H/2);for(let i=0;i<n;i++){const y=-H/2+i*p+p*.22;s.lineTo(t,y);s.lineTo(t+h,y+.2);s.lineTo(t+h,y+p*.56-.2);s.lineTo(t,y+p*.56)}s.lineTo(t,H/2);s.lineTo(0,H/2);s.lineTo(0,-H/2);
  const g=new THREE.ExtrudeGeometry(s,{depth:D,bevelEnabled:false});g.translate(0,0,-D/2);return g};
 const Y0=12.7;                                   // breadboard top

 // ---------- blackout enclosure: 25 mm T-slot frame, hardboard panels (the ones facing the camera cut away)
 const enc=G('enc'),EW=185,ED=275,EH=360;
 const tslot=(()=>{const s=new THREE.Shape(),a=12.5,o=3.1,d=5.5;s.moveTo(-a,-a);[[-o,-a],[-o,-a+d],[o,-a+d],[o,-a],[a,-a],[a,-o],[a-d,-o],[a-d,o],[a,o],[a,a],[o,a],[o,a-d],[-o,a-d],[-o,a],[-a,a],[-a,o],[-a+d,o],[-a+d,-o],[-a,-o],[-a,-a]].forEach(p=>s.lineTo(...p));
  const g=new THREE.ExtrudeGeometry(s,{depth:1,bevelEnabled:false});g.translate(0,0,-.5);return g})();
 const bars=[],bar=(len,x,y,z,ax)=>{const mt=PBR.anodBlack();mt.transparent=true;const m=new THREE.Mesh(tslot,mt);m.scale.z=len;if(ax=='y')m.rotation.x=Math.PI/2;if(ax=='x')m.rotation.y=Math.PI/2;m.position.set(x,y,z);enc.add(m);
  bars.push({n:V(x,0,z).normalize(),m:mt,c:Math.hypot(x,z)>1})};
 [-1,1].forEach(i=>[-1,1].forEach(j=>bar(EH,i*(EW-12.5),EH/2,j*(ED-12.5),'y')));
 [12.5,EH-12.5].forEach(y=>[-1,1].forEach(i=>{bar(2*EW-50,0,y,i*(ED-12.5),'x');bar(2*ED-50,i*(EW-12.5),y,0,'z')}));
 const panels=[[V(-1,0,0),4,2*ED-50,-(EW-12.5),0],[V(1,0,0),4,2*ED-50,EW-12.5,0],[V(0,0,-1),2*EW-50,4,0,-(ED-12.5)],[V(0,0,1),2*EW-50,4,0,ED-12.5]].map(([n,w,d,x,z])=>{
  const m=PBR.hardboard();m.transparent=true;m.envMapIntensity=.1;const p=new THREE.Mesh(new THREE.BoxGeometry(w,EH-50,d),m);p.position.set(x,EH/2,z);p.receiveShadow=true;p.userData.keepEnv=true;enc.add(p);return {n,m}});

 // ---------- MB3045/M breadboard: 300 x 450 x 12.7, M6 on 25 mm from 12.5 mm, five counterbored mounting holes
 const bb=G('board'),CB=[[-125,-200],[125,-200],[-125,200],[125,200],[0,0]];
 bb.add(slab(300,450,Y0,3,.6,PBR.breadboard(),CB.map(([x,z])=>new THREE.Path().absarc(x,-z,6.1,0,Math.PI*2))));
 const hm=new THREE.InstancedMesh(new THREE.CylinderGeometry(2.6,2.6,.2,14),hole,216);let k=0;const o=new THREE.Object3D();
 for(let i=0;i<12;i++)for(let j=0;j<18;j++){o.position.set(-137.5+i*25,Y0-.08,-212.5+j*25);o.updateMatrix();hm.setMatrixAt(k++,o.matrix)}bb.add(hm);
 screws(bb,CB.map(([x,z])=>[x,Y0-6.9,z]));

 // ---------- three KDC101 K-Cubes: 60 x 60 x 47 body on a 12.2 mm clip-on base, fronts toward the rig
 const ctrl=G('ctrl'),rib=ribGeo(43,58,12,1,.9),kRed=PBR.kRed(),plugs=[];
 const dispTex=(()=>{const c=document.createElement('canvas');c.width=300;c.height=110;const x=c.getContext('2d');x.fillStyle='#0b2a2c';x.fillRect(0,0,300,110);x.fillStyle='#7fe8e0';x.font='700 58px Arial, sans-serif';x.textAlign='right';x.textBaseline='middle';x.fillText('6.0000',270,58);return new THREE.CanvasTexture(c)})();
 const dispM=new THREE.MeshStandardMaterial({color:0x000000,emissive:0xffffff,emissiveMap:dispTex,emissiveIntensity:.3,roughness:.2});dispM.userData.lit=true;
 [-20,44,108].forEach(cx=>{const g=new THREE.Group(),cz=-170,yb=12.2,yc=yb+23.5;g.position.set(cx,Y0,cz);ctrl.add(g);
  g.add(box(62,7,64,plastic,0,3.5,0,1),box(58,5.2,60,plastic,0,9.6,0,.8));[1,-1].forEach(s=>g.add(box(12,13,2.4,PBR.anodDeep(),0,8,s*32.6,.6)));   // base + quick-release clamps
  g.add(box(56,46,57,plastic,0,yc,0,.6));
  [1,-1].forEach(s=>{const p=sh(new THREE.Mesh(rib,kRed));p.position.set(s*28,yc,0);if(s<0)p.rotation.y=Math.PI;g.add(p)});                         // ribbed red side extrusions
  [1,-1].forEach(s=>g.add(box(60,47,1.6,plastic,0,yc,s*29.2,.5)));g.add(box(60,1.6,60,plastic,0,yb+46.2,0,.6));                                       // front, back, top plates
  const d=new THREE.Mesh(new THREE.PlaneGeometry(30,11),dispM);d.rotation.x=-Math.PI/2;d.position.set(0,yb+47.02,-13);g.add(d);                         // display
  g.add(cyl(3.5,1.4,plastic,-17,yb+47.3,13),box(15,.2,9.4,hole,11,yb+47.05,13,0),cyl(8,13,rubber,11,yb+40.5,13,'x',28));                                // menu button, velocity wheel
  g.add(cyl(4.2,2,brass,-13,yc+6,30.8,'z',6),cyl(3.2,8,brass,-13,yc+6,34,'z',16),cyl(4.2,2,brass,5,yc+6,30.8,'z',6),cyl(3.2,8,brass,5,yc+6,34,'z',16));   // I/O 1, I/O 2 (SMA)
  g.add(box(4.5,7,2,PBR.redAnod(),21,yc+8,30.6,.4),box(8,3.2,1.4,steel,-14,yc-10,30.5,.3),cyl(3.8,2,plastic,19,yc-8,30.8,'z'));                          // power switch, USB, power jack
  [[[['KDC101',3.6,2]],0,yc+18.5,24],[[['I/O 1',2.2,2,600]],-13,yc+12.6,12],[[['I/O 2',2.2,2,600]],5,yc+12.6,12]].forEach(([l,x,y,w])=>{const m=label(l,w,4);m.position.set(x,y,30.02);g.add(m)});
  screws(g,[[-26,yc-19.5,30],[26,yc-19.5,30],[-26,yc+19.5,30],[26,yc+19.5,30]],3,1,V(0,0,1));
  g.add(box(17,8.5,1.6,steel,0,yc-2,-30.6,.4),box(31,15,16,plastic,0,yc-2,-38.5,1.2));                                                                  // MOTOR D-sub + cable plug
  plugs.push(V(cx,Y0+yc-2,cz-46.5))});

 // ---------- MT3/M-Z9 stage: MT401 base, two stacked MT1 axes, MT402 angle plate, vertical Z axis, three Z912B actuators
 const SX=-75,SZ=-37.5,SH=24.15;
 const mt1=()=>{const s=new THREE.Group();s.add(box(61,10.9,61,black,0,-6.6,0,.8),box(57,1.6,57,hole,0,-.4,0,0),box(61,11.7,61,black,0,6.2,0,.8));
  [[12.5,12.5,2.6],[-12.5,12.5,2.6],[12.5,-12.5,2.6],[-12.5,-12.5,2.6],[20.3,20.3,1.7],[-20.3,20.3,1.7],[20.3,-20.3,1.7],[-20.3,-20.3,1.7],[0,9.5,4],[0,-9.5,4]].forEach(([x,z,r])=>s.add(cyl(r,.2,hole,x,12.02,z,'y',16)));
  s.add(box(10,16,24,black,35.5,-5,0,.8),cyl(1.6,3,satin,-12,-6,32,'z',12));return s};               // actuator clamp (+x), locking screw
 const actuator=(g,p,dir)=>{const a=new THREE.Group();
  a.add(cyl(4.75,12,satin,0,6,0),cyl(7.5,1.2,black,0,12.6,0,'y',32,7),cyl(7.5,110,black,0,68.2,0),cyl(7.5,1.6,black,0,124,0,'y',32,6.2),cyl(3.2,8,rubber,0,128.8,0,'y',20,2.5));
  const l=sleeve('Z912B',7.5,26);l.position.y=58;a.add(l);a.position.copy(p);aim(a,dir);g.add(a);return p.clone().addScaledVector(dir,132.8)};
 const sx=G('stX');sx.add(box(61,2.9,108,black,SX,Y0+1.45,SZ,.6));[-1,1].forEach(i=>[-1,1].forEach(j=>sx.add(box(6.6,.2,16,hole,SX+i*12.5,Y0+2.92,SZ+j*44,0))));
 screws(sx,[[SX-12.5,Y0+2.9,SZ-44],[SX+12.5,Y0+2.9,SZ-44],[SX-12.5,Y0+2.9,SZ+44],[SX+12.5,Y0+2.9,SZ+44]]);
 const yX=Y0+2.9+SH/2,X=mt1();X.position.set(SX,yX,SZ);sx.add(X);const xEnd=actuator(sx,V(SX+40.5,yX-5,SZ),V(1,0,0));
 const sy=G('stY'),yY=yX+SH,Yst=mt1();Yst.rotation.y=Math.PI/2;Yst.position.set(SX,yY,SZ);sy.add(Yst);const yEnd=actuator(sy,V(SX,yY-5,SZ-40.5),V(0,0,-1));
 const sz=G('stZ'),yA=yY+SH/2,A=61.1,T=9.5,R=A-T;
 const ap=(()=>{const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(A,0);s.lineTo(A,T);s.absarc(A,A,R,-Math.PI/2,-Math.PI,true);s.lineTo(0,A);s.lineTo(0,0);
  const g=new THREE.ExtrudeGeometry(s,{depth:61,bevelEnabled:true,bevelThickness:.6,bevelSize:.6,bevelSegments:2,curveSegments:24});g.rotateY(Math.PI/2);return g})();
 const apm=sh(new THREE.Mesh(ap,black));apm.position.set(SX-30.5,yA,SZ+30.5);sz.add(apm);                                                              // MT402, concave quarter-round back
 [-15,15].forEach(dx=>{const c=cyl(4.6,.3,hole,SX+dx,yA+A-.7071*R+.1,SZ+30.5-(A-.7071*R)-.1,'y',20);aim(c,V(0,.7071,-.7071));sz.add(c)});
 const zc=SZ+30.5+SH/2,yZ=yA+30.55,Zst=mt1();Zst.setRotationFromMatrix(new THREE.Matrix4().makeBasis(V(0,1,0),V(0,0,1),V(1,0,0)));Zst.position.set(SX,yZ,zc);sz.add(Zst);
 const za=G('zAct'),zEnd=actuator(za,V(SX,yZ+40.5,zc-5),V(0,1,0));

 // ---------- precision fixture: aluminium adapter on the Z carriage, arm and clamp holding the fiber probe over the DUT
 const fx=G('fx'),ZF=zc+SH/2,BX=SX,BZ=62.5,PT=30;                                            // Z carriage face, DUT centre, probe tip height
 fx.add(box(61,61,6,alu,SX,yZ,ZF+3,.8));screws(fx,[[-20.3,-20.3],[20.3,-20.3],[-20.3,20.3],[20.3,20.3]].map(([a,b])=>[SX+a,yZ+b,ZF+6]),7,4,V(0,0,1));
 fx.add(cyl(1.5,2.4,steel,SX-24,yZ+26,ZF+7.2,'z',12),cyl(1.5,2.4,steel,SX+24,yZ+26,ZF+7.2,'z',12));                                                    // dowel pins
 fx.add(box(16,10,BZ-10-(ZF+6),alu,BX,69,(ZF+6+BZ-10)/2,.8),box(20,24,20,alu,BX,68,BZ,.8));                                                            // arm, probe clamp
 fx.add(cyl(2.4,9,steel,BX+13,72,BZ,'x',16),cyl(4.4,5,plastic,BX+19,72,BZ,'x',24));                                                                    // thumbscrew
 fx.add(cyl(2.285,50,black,BX,PT+25,BZ,'y',24),cyl(2.4,1.2,steel,BX,PT+.6,BZ,'y',24));                                                                 // Ø4.57 optical head
 fx.add(cyl(3,12,rubber,BX,PT+56,BZ,'y',20,1.9),cyl(2.6,16,rubber,BX,PT+70,BZ,'y',20));                                                                // strain relief, fiber breakout
 const fur=V(BX,PT+78,BZ);

 // ---------- base plate: counterbored to the breadboard, pocket locating the DUT
 const bp=G('baseplate'),PL=35.3,PW=24.6;
 const bsc=[[-37.5,-25],[37.5,-25],[-37.5,25],[37.5,25]];
 const bpl=slab(100,75,8,2.5,.5,black,[rrShape(PL+1,PW+1,5.9,THREE.Path),...bsc.map(([x,z])=>new THREE.Path().absarc(x,-z,6,0,Math.PI*2))]);bpl.position.set(BX,Y0,BZ);bp.add(bpl);
 const pf=slab(PL,PW,4,5.4,0,black);pf.position.set(BX,Y0,BZ);bp.add(pf);screws(bp,bsc.map(([x,z])=>[BX+x,Y0+1.4,BZ+z]));

 // ---------- Feasa analysers: LED (silver ribbed body, black caps) and IR (red body, silver flanges); fibers exit the top
 const ana=G('ana');
 const feasa=(x,z,L,H,bodyM,capM,n,txt)=>{const g=new THREE.Group(),W=57;g.position.set(x,Y0,z);ana.add(g);
  g.add(box(W-6,H-4,L-6,bodyM,0,(H-4)/2,0,.6));[1,-1].forEach(s=>{const p=sh(new THREE.Mesh(ribGeo(H-12,L-6,8,1,1.6),bodyM));p.position.set(s*(W/2-3),(H-4)/2,0);if(s<0)p.rotation.y=Math.PI;g.add(p)});
  g.add(box(W,4,L-6,plastic,0,H-2,0,.8));[1,-1].forEach(s=>g.add(box(W+1,H,3,capM,0,H/2,s*(L/2-1.5),.8)));
  const z0=-(n-1)*4.5;for(let i=0;i<n;i++){g.add(cyl(2.6,6,rubber,W/4,H+3,z0+i*9,'y',16),cyl(1.1,.2,hole,W/4,H+6.05,z0+i*9,'y',12))}
  const l=label([[txt,4.2,3]],L-14,6);l.rotation.set(-Math.PI/2,0,Math.PI/2);l.position.set(-W/5,H+.02,0);g.add(l);
  g.add(box(9,3.4,1.2,steel,-W/5,H/2,L/2+.4,.3));return i=>V(x+W/4,Y0+H+6,z+z0+i*9)};
 const ledPort=feasa(55,112.5,105,50,PBR.silverAnod(),plastic,10,'LED ANALYSER'),irPort=feasa(121,112.5,86,55,PBR.redAnod(),PBR.silverAnod(),2,'IR ANALYSER');

 // ---------- fibers and motor cables (fade out while exploded)
 const fib=G('fib'),fm=PBR.rubber();fm.roughness=.55;fm.transparent=true;
 const tube=(pts,r)=>{const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>p.isVector3?p:V(...p)),false,'centripetal'),160,r,10,false),fm);m.castShadow=true;fib.add(m)};
 const lp=ledPort(1),ip=irPort(0);
 tube([fur,fur.clone().add(V(4,26,4)),V(-20,150,110),V(lp.x-6,lp.y+46,lp.z),lp.clone().add(V(0,14,0)),lp],1.1);
 tube([fur,fur.clone().add(V(8,30,-4)),V(10,170,70),V(ip.x-4,ip.y+50,ip.z),ip.clone().add(V(0,14,0)),ip],1.1);
 const Fl=Y0+2.4;                                                                           // cable resting on the board
 tube([xEnd,xEnd.clone().add(V(10,-1,0)),V(128,Fl,-58),V(144,Fl,-110),V(144,Fl,-214),V(143,Fl,-224),V(141,8,-233),V(126,2.4,-242),V(110,16,-236),V(108,38,-222),plugs[2]],2.3);
 tube([yEnd,yEnd.clone().add(V(0,-2,-10)),V(-72,20,-236),V(-50,2.4,-243),V(-24,16,-237),V(-20,38,-222),plugs[0]],2.3);
 tube([zEnd,zEnd.clone().add(V(0,16,-4)),V(-66,280,-60),V(-30,200,-190),V(8,80,-238),V(34,4,-243),V(44,22,-236),V(44,38,-222),plugs[1]],2.3);

 // ---------- DUT: WHOOP 5.0 sensor side up in the pocket
 const dut=G('dut'),pod=makePod();pod.g.position.set(BX,Y0+4,BZ);dut.add(pod.g);const ledMats=pod.ledMats;
 const DUTP=V(BX,Y0+4+10.6,BZ);
 const glow=new THREE.PointLight(0x3dff9a,0,160,2);glow.position.set(BX,DUTP.y+14,BZ);S.add(glow);
 // coloured halo per lit LED: tone mapping turns the bright dies white, the soft sprite keeps their colour
 const halo=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
 const halos=new THREE.Group();S.add(halos);const haloMats=pod.leds.map(l=>{const c=new THREE.Color(l.userData.c),m=new THREE.SpriteMaterial({map:halo,color:c.multiplyScalar(.8),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0});
  const sp=new THREE.Sprite(m);sp.scale.setScalar(l.userData.c==0x5a0818?3:7.5);sp.position.copy(l.position).add(pod.g.position);sp.position.y+=.4;halos.add(sp);return m});
 // light cone above the LEDs (the scan the fixture performs)
 const NC=1400,cp=new Float32Array(NC*3),cs=new Float32Array(NC);for(let i=0;i<NC;i++){const h=Math.random()**.8*70,a=Math.random()*6.283,rr=Math.random()**.6*(3+h*.55);cp.set([Math.cos(a)*rr,h,Math.sin(a)*rr],i*3);cs[i]=Math.max(.05,(1-rr/(3+h*.55))*(1-h/80))}
 const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.BufferAttribute(cp,3));cg.setAttribute('size',new THREE.BufferAttribute(cs,1));
 const cmat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{op:{value:0},px:{value:Math.min(2,devicePixelRatio)}},
  vertexShader:`attribute float size;varying float vS;uniform float px;void main(){vS=size;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=(1.5+size*5.)*px*(160./-mv.z);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying float vS;uniform float op;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(mix(vec3(.05,.55,.35),vec3(.75,1.,.9),vS),op*(.25+.75*vS)*smoothstep(.5,.1,d));}`});
 const cone=new THREE.Points(cg,cmat);cone.position.set(BX,DUTP.y+1,BZ);S.add(cone);   // anchored at the LEDs so it can riseP.exclude(enc,cone,glow,halos);

 const groups=[enc,bb,ctrl,bp,sx,sy,sz,za,fx,ana,fib,dut];
 // fewer draw calls: within each explode group, merge opaque meshes that share a material into one mesh
 groups.forEach(g=>{g.updateMatrixWorld(true);const inv=g.matrixWorld.clone().invert(),bk=new Map();
  g.traverse(m=>{if(!m.isMesh||m.isInstancedMesh||m.material.transparent||ledMats.includes(m.material))return;const k=m.material.uuid+m.castShadow+m.receiveShadow;bk.has(k)?bk.get(k).push(m):bk.set(k,[m])});
  bk.forEach(ms=>{if(ms.length<2)return;const geos=ms.map(m=>{const q=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();q.applyMatrix4(inv.clone().multiply(m.matrixWorld));Object.keys(q.attributes).forEach(a=>['position','normal','uv'].includes(a)||q.deleteAttribute(a));return q});
   const mm=new THREE.Mesh(THREE.mergeBufferGeometries(geos),ms[0].material);mm.castShadow=ms[0].castShadow;mm.receiveShadow=ms[0].receiveShadow;ms.forEach(m=>{m.parent.remove(m);m.geometry.dispose()});g.add(mm)})});
 const EX={enc:[0,170,-330],ctrl:[0,40,-70],stX:[0,18,0],stY:[0,55,0],stZ:[0,100,0],zAct:[0,190,0],fx:[0,100,80],ana:[20,45,30]};
 const AW={fx:[0,340,-200],stZ:[0,220,-180],zAct:[0,280,-180],stY:[0,0,-120],stX:[0,0,-120],ana:[80,0,60],ctrl:[0,0,-60]};
 const HL=[['enc'],['board','ctrl'],['stX','stY','stZ','zAct'],['fx','baseplate'],['ana','fib'],['dut']];
 const base={};groups.forEach(g=>base[g.name]=g.position.clone());
 const glowMats=new Map();groups.filter(g=>!['enc','fib'].includes(g.name)).forEach(g=>g.traverse(m=>{if(m.isMesh&&m.material.emissive&&!ledMats.includes(m.material)&&!m.material.userData.lit){m.material=m.material.clone();glowMats.set(m.material,g.name)}}));
 const sec=document.getElementById('explode'),steps=[...document.querySelectorAll('.st')],prog=document.getElementById('prog');
 let vis=true;new IntersectionObserver(e=>vis=e[0].isIntersecting).observe(sec);
 const clamp=x=>Math.min(1,Math.max(0,x)),ease=x=>x<.5?2*x*x:1-(-2*x+2)**2/2,sm=x=>x*x*(3-2*x),lerp=(a,b,t)=>a+(b-a)*t;
 let sp=0,shSp=-1,lastT=0,warm=false;   // first frame renders everything once so no shader compiles mid-scroll
 function frame(t){requestAnimationFrame(frame);if(!vis)return;
  const r=sec.getBoundingClientRect(),tot=r.height-innerHeight;const p=clamp(-r.top/tot);sp+=(p-sp)*(RM?1:.12);prog.style.width=(sp*100)+'%';
  P.adapt(t-lastT);lastT=t;pose(sp,t);if(Math.abs(sp-shSp)>.0008||shSp<0){P.shadow();shSp=sp}P.render();warm=true}
 function pose(sp,t){
  // steps 1 to 5 share the first 70% of the scroll; the lit sensor holds the last 30%
  const step=sp<.7?Math.floor(sp/.14):5,ex=ease(clamp(sp/.58)),zm=sm(clamp((sp-.7)/.1)),hold=sm(clamp((sp-.8)/.2));
  steps.forEach((s,i)=>s.classList.toggle('on',i==step));
  groups.forEach(g=>{const e=EX[g.name]||[0,0,0],w=AW[g.name]||[0,0,0];g.position.set(base[g.name].x+e[0]*ex+w[0]*zm,base[g.name].y+e[1]*ex+w[1]*zm,base[g.name].z+e[2]*ex+w[2]*zm)});
  const fade=1-clamp(ex*3);fm.opacity=1-clamp(ex*2);P.bloom.strength=.5+zm*1.3;P.bloom.radius=.5+zm*.35;P.bloom.enabled=cone.visible=halos.visible=zm>0||!warm;   // light count stays fixed (no recompile); only the lit LEDs bloom: skip that work before the zoom
  const on=new Set(HL[step]);glowMats.forEach((n,mat)=>{mat.emissive.setHex(on.has(n)&&step<5?AC:0);mat.emissiveIntensity=on.has(n)?.028:0});
  const led=zm>0?zm*(10+(RM?0:1.5*Math.sin(t/160))):0;ledMats.forEach(m=>m.emissiveIntensity=led);haloMats.forEach(m=>m.opacity=zm*(1+(RM?0:.12*Math.sin(t/160))));glow.intensity=zm*1.6;cmat.uniforms.op.value=zm*.9;cone.scale.y=.25+.75*hold;
  const a=(RM?0:t/10000)+.75+sp*1.1,rad=lerp(1000+ex*80,150,zm);
  const orbit=new THREE.Vector3(Math.sin(a)*rad,420+ex*120,Math.cos(a)*rad),tgt=new THREE.Vector3(-5,125+ex*90,-15);
  const closeP=new THREE.Vector3(58,86,100).applyAxisAngle(UP,-hold*1.05).multiplyScalar(1-hold*.18).add(DUTP),   // slow orbit round the pod while the light field rises
   closeT=new THREE.Vector3(DUTP.x,DUTP.y+10,DUTP.z);
  cam.position.lerpVectors(orbit,closeP,zm);tgt.lerp(closeT,zm);
  // narrow (phone) canvases: pull back so the whole rig stays in frame at every orbit angle
  const k=innerWidth>900?1:Math.min(1.6,Math.max(1,1.15/cam.aspect));cam.position.sub(tgt).multiplyScalar(k).add(tgt);cam.lookAt(tgt);
  // cutaway: enclosure panels between the camera and the rig fade out
  const v=V(cam.position.x,0,cam.position.z).normalize();panels.forEach(({n,m})=>{const d=v.dot(n),op=.85*(1-sm(clamp((d+.3)/.45)))*fade;m.opacity=op;m.depthWrite=op>.84;m.visible=op>.01});
  bars.forEach(({n,m,c})=>{const op=(c?1-sm(clamp((v.dot(n)-.3)/.3)):1)*fade;m.opacity=op;m.depthWrite=op>.99;m.visible=op>.01})}
 requestAnimationFrame(frame);
 // dev-only capture hook for reviewing renders (stripped from production builds)
 if(import.meta.env.DEV)window.__tb={shot(p,t=0){sp=p;shSp=-1;pose(p,t);P.shadow();shSp=p;P.render();warm=true;return cv},
  // time n full frames at progress p (GPU-synced with a 1 px read), with draw-call counts
  bench(p,n=30){const gl=P.r.getContext(),px=new Uint8Array(4);pose(p,0);P.render();warm=true;const pr0=P.r.info.programs.length;gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);P.r.info.autoReset=false;P.r.info.reset();const t0=performance.now();
   for(let i=0;i<n;i++){pose(p,i*16);if(Math.abs(p-shSp)>.0008){P.shadow();shSp=p}P.render()}gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);const ms=(performance.now()-t0)/n;const c=P.r.info.render.calls/n;P.r.info.autoReset=true;
   return {ms:+ms.toFixed(2),calls:Math.round(c),tris:Math.round(P.r.info.render.triangles/n),programs:P.r.info.programs.length,compiledDuring:P.r.info.programs.length-pr0,px:[cv.width,cv.height]}}};
})();
