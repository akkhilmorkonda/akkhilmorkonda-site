import { THREE } from './three-lib.js';
import { RM, AC, mkRenderer, fit, mkPipe, makePod } from './whoop-common.js';
/* ================= BRIGHTNESS VOLUME ================= */
(()=>{const cv=document.getElementById('vol'),box=document.getElementById('cv'),R=mkRenderer(cv),S=new THREE.Scene();
 const cam=new THREE.PerspectiveCamera(38,1,.1,500);cam.position.set(0,6,44);
 const root=new THREE.Group();S.add(root);root.rotation.set(.35,-.6,0);
 const N=17,SPAN=16;// mm, x/z -8..8, y 0..16
 const LED={g:{m:3.2,ox:1.6,oz:.6,name:'Green LED'},ir:{m:1.4,ox:-1.8,oz:-1.2,name:'Infrared LED'}};
 const pts=[];for(let j=0;j<N;j++)for(let i=0;i<N;i++)for(let k=0;k<N;k++){const kk=(i%2)?N-1-k:k;// serpentine
   pts.push({x:-8+i*SPAN/(N-1),y:j*SPAN/(N-1),z:-8+kk*SPAN/(N-1)})}
 function field(l){const L=LED[l];let mx=0;const v=pts.map(p=>{const dx=p.x-L.ox,dz=p.z-L.oz,y=p.y+1.5,r=Math.hypot(dx,y,dz),c=y/r;const I=Math.pow(c,L.m)/(1+(r/7)**2);if(I>mx)mx=I;return I});return v.map(x=>x/mx)}
 const ramp=[[0x0d,0x2a,0x1e],[0x0f,0x6b,0x45],[0x16,0xec,0x9a],[0xc9,0xff,0xe6]];
 const col=v=>{const s=v*(ramp.length-1),i=Math.min(ramp.length-2,Math.floor(s)),f=s-i,a=ramp[i],b=ramp[i+1];return [0,1,2].map(c=>(a[c]+(b[c]-a[c])*f)/255)};
 const geo=new THREE.BufferGeometry();const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{px:{value:Math.min(2,devicePixelRatio)}},
  vertexShader:`attribute float size;attribute vec3 color;varying vec3 vC;varying float vA;uniform float px;void main(){vC=color;vA=.45+.55*size;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=(3.+size*12.)*px*(40./-mv.z);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying vec3 vC;varying float vA;void main(){vec2 c=gl_PointCoord-.5;float d=length(c);if(d>.5)discard;gl_FragColor=vec4(vC,vA*smoothstep(.5,.2,d));}`});
 const P=new THREE.Points(geo,mat);root.add(P);
 // frame + LED marker
 const frameG=new THREE.Group();root.add(frameG);const lm=new THREE.LineBasicMaterial({color:0x3a3a3e});
 frameG.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(SPAN,SPAN,SPAN)),lm));frameG.children[0].position.y=SPAN/2;
 const pad=new THREE.Mesh(new THREE.BoxGeometry(SPAN,.3,SPAN),new THREE.MeshBasicMaterial({color:0x151517}));pad.position.y=-1.6;root.add(pad);
 const led=new THREE.Mesh(new THREE.BoxGeometry(1.4,.6,1.4),new THREE.MeshBasicMaterial({color:AC}));led.position.set(1.6,-1.2,.6);root.add(led);
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(SPAN,SPAN),new THREE.MeshBasicMaterial({color:AC,transparent:true,opacity:.06,side:THREE.DoubleSide,depthWrite:false}));plane.rotation.x=-Math.PI/2;root.add(plane);
 let st={led:'g',view:'vol',z:6,t:.08},V=field('g'),idx=[],shown=0,scanning=false;
 function rebuild(){V=field(st.led);led.position.set(LED[st.led].ox,-1.2,LED[st.led].oz);idx=[];const zy=st.z*SPAN/15;
  pts.forEach((p,i)=>{if(V[i]<st.t)return;if(st.view=='slice'&&Math.abs(p.y-zy)>.55)return;idx.push(i)});
  const pos=new Float32Array(idx.length*3),c=new Float32Array(idx.length*3),s=new Float32Array(idx.length);
  idx.forEach((i,n)=>{const p=pts[i];pos.set([p.x,p.y,p.z],n*3);c.set(col(V[i]),n*3);s[n]=V[i]});
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('color',new THREE.BufferAttribute(c,3));geo.setAttribute('size',new THREE.BufferAttribute(s,1));geo.computeBoundingSphere();
  plane.visible=st.view=='slice';plane.position.y=zy;if(!scanning)geo.setDrawRange(0,idx.length)}
 rebuild();
 const seg=(id,key)=>document.querySelectorAll('#'+id+' button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#'+id+' button').forEach(x=>x.classList.toggle('on',x==b));st[key]=b.dataset.v;rebuild()});
 seg('led','led');seg('view','view');
 const z=document.getElementById('z'),tr=document.getElementById('t');
 z.oninput=()=>{st.z=+z.value;document.getElementById('zv').textContent=(st.z*SPAN/15).toFixed(1)+' mm';if(st.view!='slice'){document.querySelector('#view [data-v=slice]').click()}else rebuild()};
 tr.oninput=()=>{st.t=tr.value/100;document.getElementById('tv').textContent=tr.value+'%';rebuild()};
 function scan(){if(RM){geo.setDrawRange(0,idx.length);return}scanning=true;shown=0}
 document.getElementById('scan').onclick=scan;
 let seen=false;new IntersectionObserver(e=>{if(e[0].isIntersecting&&!seen){seen=true;scan()}},{threshold:.4}).observe(box);
 // drag rotate
 let drag=null;box.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,rx:root.rotation.x,ry:root.rotation.y};box.setPointerCapture(e.pointerId)});
 box.addEventListener('pointerup',()=>drag=null);
 const ray=new THREE.Raycaster();ray.params.Points.threshold=.45;const mouse=new THREE.Vector2(),tip=document.getElementById('tip');let hov=null;
 box.addEventListener('pointermove',e=>{if(drag){root.rotation.y=drag.ry+(e.clientX-drag.x)/200;root.rotation.x=Math.max(-.2,Math.min(1.3,drag.rx+(e.clientY-drag.y)/200));tip.style.opacity=0;return}
  const r=cv.getBoundingClientRect();mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);hov={x:e.clientX-box.getBoundingClientRect().left,y:e.clientY-box.getBoundingClientRect().top}});
 box.addEventListener('pointerleave',()=>{hov=null;tip.style.opacity=0});
 let vis=true;new IntersectionObserver(e=>vis=e[0].isIntersecting).observe(box);
 function frame(t){requestAnimationFrame(frame);if(!vis)return;fit(R,cam,cv);
  if(scanning){shown=Math.min(idx.length,shown+Math.max(6,idx.length/150));geo.setDrawRange(0,Math.floor(shown));if(shown>=idx.length)scanning=false}
  if(!drag&&!RM)root.rotation.y+=.0012;
  cam.lookAt(0,6,0);
  if(hov){ray.setFromCamera(mouse,cam);const h=ray.intersectObject(P)[0];if(h&&h.index<geo.drawRange.count){const i=idx[h.index],p=pts[i];tip.innerHTML=`x ${p.x.toFixed(1)} mm &nbsp;y ${p.z.toFixed(1)} mm<br>height ${p.y.toFixed(1)} mm<br><b style="color:#16ec9a">${Math.round(V[i]*100)}%</b> of peak, ${LED[st.led].name}`;tip.style.left=(hov.x+14)+'px';tip.style.top=(hov.y+14)+'px';tip.style.opacity=1}else tip.style.opacity=0}
  R.render(S,cam)}requestAnimationFrame(frame);
})();
