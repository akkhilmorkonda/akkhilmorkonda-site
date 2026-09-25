import { THREE } from './three-lib.js';
import { RM, AC, mkRenderer, fit, mkPipe, makePod } from './whoop-common.js';
/* ================= BATTERY DIAGNOSTICS (simplified) ================= */
(()=>{const FS=1000,N=512,TWO=Math.PI*2;
 const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
 const FG=css('--fg'),MU=css('--mu'),LN=css('--ln');
 let h=1,n=0;const buf=new Float32Array(N);let bi=0;
 const gauss=()=>{let u=0;while(!u)u=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(TWO*Math.random())};
 const sample=(k,hh)=>{const t=k/FS,A=.003+1.8*Math.pow(1-hh,1.5),lp=(t*25)%1,bp=t%.5;return 14+7*Math.exp(-(((lp-.5)/.1)**2))+9*Math.exp(-(((bp-.25)/.006)**2))+1.3*A*Math.sin(TWO*260*t)+(.03+.4*(1-hh))*gauss()};
 function fftMag(x){const re=new Float64Array(N),im=new Float64Array(N);let mean=0;for(let i=0;i<N;i++)mean+=x[i];mean/=N;
  for(let i=0;i<N;i++)re[i]=(x[i]-mean)*(.5-.5*Math.cos(TWO*i/(N-1)));
  for(let i=1,j=0;i<N;i++){let b=N>>1;for(;j&b;b>>=1)j^=b;j^=b;if(i<j){[re[i],re[j]]=[re[j],re[i]]}}
  for(let len=2;len<=N;len<<=1){const a=-TWO/len;for(let i=0;i<N;i+=len)for(let k=0;k<len/2;k++){const c=Math.cos(a*k),s=Math.sin(a*k),o=i+k+len/2,vr=re[o]*c-im[o]*s,vi=re[o]*s+im[o]*c;re[o]=re[i+k]-vr;im[o]=im[i+k]-vi;re[i+k]+=vr;im[i+k]+=vi}}
  const m=new Float64Array(N/2);for(let i=0;i<N/2;i++)m[i]=Math.hypot(re[i],im[i])/N*4;return m}
 const binHz=FS/N,BAND=[245,275];
 for(let i=0;i<N;i++){buf[bi]=sample(n++,1);bi=(bi+1)%N}
 const c=document.getElementById('cF'),x=c.getContext('2d'),mag=new Float64Array(N/2),vd=document.getElementById('vd');
 {const m0=fftMag(buf);for(let i=0;i<m0.length;i++)mag[i]=m0[i]}let hov=null,energy=null,vis=false;new IntersectionObserver(e=>vis=e[0].isIntersecting).observe(document.getElementById('bat'));
 c.addEventListener('pointermove',e=>hov=e.clientX-c.getBoundingClientRect().left);c.addEventListener('pointerleave',()=>{hov=null;document.getElementById('tF').style.opacity=0});
 const btn=[...document.querySelectorAll('#dut button')];btn.forEach(b=>b.onclick=()=>{h=+b.dataset.h;btn.forEach(q=>q.classList.toggle('on',q==b))});
 const P={l:44,r:16,t:20,b:28};let fr=0;
 function draw(){const r=c.getBoundingClientRect(),d=Math.min(2,devicePixelRatio);if(c.width!==Math.round(r.width*d)){c.width=r.width*d;c.height=r.height*d;x.setTransform(d,0,0,d,0,0)}
  const w=r.width,hh=r.height,W=w-P.l-P.r,H=hh-P.t-P.b,lo=-60,hi=10,fx=f=>P.l+f/500*W,fy=db=>P.t+(1-(Math.max(lo,Math.min(hi,db))-lo)/(hi-lo))*H;x.clearRect(0,0,w,hh);
  x.fillStyle='rgba(22,236,154,.10)';x.fillRect(fx(BAND[0]),P.t,fx(BAND[1])-fx(BAND[0]),H);
  x.strokeStyle=LN;x.fillStyle=MU;x.font='11px JetBrains Mono, monospace';[-50,-30,-10].forEach(v=>{const y=fy(v);x.beginPath();x.moveTo(P.l,y);x.lineTo(w-P.r,y);x.stroke();x.fillText(v,8,y+4)});
  [[0,'0'],[100,'100'],[200,'200'],[260,'260'],[400,'400'],[500,'500 Hz']].forEach(([f,l])=>x.fillText(l,fx(f)-8,hh-8));
  x.fillText('ripple band',fx(BAND[0])+4,P.t+14);x.fillText('dB',8,P.t+4);
  x.strokeStyle=FG;x.lineWidth=1.6;x.beginPath();for(let i=1;i<N/2;i++){const X=fx(i*binHz),Y=fy(20*Math.log10(mag[i]+1e-6));i>1?x.lineTo(X,Y):x.moveTo(X,Y)}x.stroke();
  if(hov!=null){const i=Math.round((hov-P.l)/W*500/binHz);if(i>0&&i<N/2){const X=fx(i*binHz),db=20*Math.log10(mag[i]+1e-6);x.fillStyle=FG;x.beginPath();x.arc(X,fy(db),4,0,TWO);x.fill();const t=document.getElementById('tF');t.innerHTML=`${(i*binHz).toFixed(0)} Hz<br><b>${db.toFixed(1)} dB</b>`;t.style.left=Math.min(w-110,X+12)+'px';t.style.top='14px';t.style.opacity=1}}}
 function loop(){requestAnimationFrame(loop);if(!vis)return;for(let i=0;i<(RM?8:17);i++){buf[bi]=sample(n++,h);bi=(bi+1)%N}
  if(++fr%4==0){const xs=new Float32Array(N);for(let i=0;i<N;i++)xs[i]=buf[(bi+i)%N];const m=fftMag(xs);let e=0;for(let i=0;i<m.length;i++){mag[i]=mag[i]*.6+m[i]*.4;const f=i*binHz;if(f>=BAND[0]&&f<=BAND[1])e+=mag[i]*mag[i]}
   const db=10*Math.log10(e+1e-9);energy=energy==null?db:energy*.8+db*.2;const flag=energy>-10;vd.classList.toggle('flag',flag);vd.innerHTML=flag?'<span class="ico">!</span><b>FLAG</b>':'<span class="ico">&#10003;</span><b>PASS</b>'}
  draw()}requestAnimationFrame(loop);
})();
