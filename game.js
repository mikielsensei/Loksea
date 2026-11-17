import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {Sky} from 'three/addons/objects/Sky.js';
import {XRHandModelFactory} from 'three/addons/webxr/XRHandModelFactory.js';
const DEBUG=new URLSearchParams(location.search);

// =====================================================================
// UTILIDADES
// =====================================================================
const V3=THREE.Vector3,Q4=THREE.Quaternion,M4=THREE.Matrix4;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const R=(a,b)=>a+(b-a)*Math.random();
const RIm=(a,b)=>Math.floor(R(a,b+1));
const pick=a=>a[(Math.random()*a.length)|0];
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rnd=mulberry32(20261115);
const RR=(a,b)=>a+(b-a)*rnd();
const RI=(a,b)=>Math.floor(RR(a,b+1));
const rpick=a=>a[(rnd()*a.length)|0];
const UP=new V3(0,1,0);
const _v=new V3(),_v1=new V3(),_v2=new V3(),_v3=new V3(),_v4=new V3(),_q=new Q4(),_q1=new Q4(),_m=new M4(),_m1=new M4(),_m2=new M4(),_s=new V3(),_p=new V3(),_c=new THREE.Color();
const ZM=new M4().makeScale(0,0,0);
function yn(v){return v?'Sí':'No';}
const loadEl=document.getElementById('load');
const loadLines={};function setLoad(k,t){loadLines[k]=t;loadEl.textContent=Object.values(loadLines).join('\n');}

// =====================================================================
// AJUSTES (sandbox tipo Zomboid)
// =====================================================================
const SET_DEFS=[
  {k:'dayMin',l:'Duración del día',o:[6,12,24,48,96],d:24,f:v=>v+' min reales'},
  {k:'hunger',l:'Hambre',o:[0.25,0.5,1,1.5,2,3],d:1},
  {k:'thirst',l:'Sed',o:[0.25,0.5,1,1.5,2,3],d:1},
  {k:'physio',l:'Vejiga e intestino',o:[0.25,0.5,1,1.5,2,3],d:1},
  {k:'fatigue',l:'Cansancio',o:[0.25,0.5,1,1.5,2,3],d:1},
  {k:'zombies',l:'Zombis alrededor',o:[0,10,16,22,30,40,55],d:22,f:v=>String(v)},
  {k:'runners',l:'Zombis corredores',o:[0,10,25,50,100],d:10,f:v=>v+'%'},
  {k:'zStr',l:'Fuerza zombi',o:[0.5,1,1.5,2],d:1},
  {k:'zTough',l:'Resistencia zombi',o:[0.5,1,1.5,2],d:1},
  {k:'zSense',l:'Vista y oído zombi',o:[0.5,1,1.5],d:1},
  {k:'infection',l:'Infección por mordisco',o:[0,1],d:1,f:yn},
  {k:'spoil',l:'La comida se pudre',o:[0,1],d:1,f:yn},
  {k:'loot',l:'Botín',o:[0.5,1,1.5,2.5],d:1,f:v=>({0.5:'Escaso',1:'Normal',1.5:'Abundante',2.5:'Muy abundante'})[v]},
  {k:'reanimate',l:'Los muertos se levantan',o:[0,1],d:1,f:yn},
  {k:'bandits',l:'Bandidos',o:[0,1],d:1,f:v=>v?'Agresivos':'Pacíficos'},
  {k:'gore',l:'Sangre y heridas',o:[0,1,2],d:2,f:v=>['Sin sangre','Moderada','Total'][v]},
  {k:'turn',l:'Giro con el joystick',o:['snap','smooth'],d:'snap',f:v=>v==='snap'?'Por saltos (30°)':'Suave'},
  {k:'view',l:'Distancia de visión',o:[100,200,300,500,1000,0],d:300,f:v=>v?(v>=1000?v/1000+' km':v+' m'):'Infinita'},
  {k:'haze',l:'Bruma apocalíptica',o:[0,1,2,3,4],d:3,f:v=>['No','Ligera','Media','Densa','Muy densa'][v]},
  {k:'filter',l:'Filtro de color',o:[0,1,2,3],d:1,f:v=>['Ninguno','Sepia (A ciegas)','Frío','Desaturado'][v]},
  {k:'clouds',l:'Nubes',o:[0,1,2],d:2,f:v=>['Despejado','Nubes sueltas','Cielo cubierto'][v]},
  {k:'startHour',l:'Hora inicial',o:[6,8,12,18,22],d:8,f:v=>String(v).padStart(2,'0')+':00',start:true},
];
const S={};for(const d of SET_DEFS)S[d.k]=d.d;
try{const sv=JSON.parse(localStorage.getItem('loksea_settings')||'{}');for(const d of SET_DEFS)if(d.o.includes(sv[d.k]))S[d.k]=sv[d.k];}catch(e){}
const saveS=()=>{try{localStorage.setItem('loksea_settings',JSON.stringify(S));}catch(e){}};
const fmtS=d=>d.f?d.f(S[d.k]):'x'+S[d.k];
{const grid=document.getElementById('sgrid');
  for(const d of SET_DEFS){const lab=document.createElement('label');lab.textContent=d.l;const sel=document.createElement('select');
    d.o.forEach((v,i)=>{const op=document.createElement('option');op.value=i;op.textContent=d.f?d.f(v):'x'+v;if(v===S[d.k])op.selected=true;sel.appendChild(op);});
    sel.onchange=()=>{S[d.k]=d.o[+sel.value];saveS();};lab.appendChild(sel);grid.appendChild(lab);}}
const HC={pitch:0,yaw:0,roll:0,fwd:0,up:0};
try{Object.assign(HC,JSON.parse(localStorage.getItem('loksea_hands')||'{}'));}catch(e){}
const saveHC=()=>{try{localStorage.setItem('loksea_hands',JSON.stringify(HC));}catch(e){}};

// =====================================================================
// RENDER, CIELO, LUCES, AGUA
// =====================================================================
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:DEBUG.has('shot')});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.xr.enabled=true;
renderer.xr.setReferenceSpaceType('local-floor');
// tono y filtro de color en el propio sombreador (funciona en VR, sin posprocesado): la exposición lleva codificado el filtro (parte entera/10)
THREE.ShaderChunk.tonemapping_pars_fragment=THREE.ShaderChunk.tonemapping_pars_fragment.replace('vec3 CustomToneMapping( vec3 color ) { return color; }',`
vec3 RRTAndODTFitG( vec3 v ){vec3 a=v*(v+0.0245786)-0.000090537;vec3 b=v*(0.983729*v+0.4329510)+0.238081;return a/b;}
vec3 CustomToneMapping( vec3 color ){float f=floor(toneMappingExposure/10.0);float e=toneMappingExposure-f*10.0;
  const mat3 IM=mat3(vec3(0.59719,0.07600,0.02840),vec3(0.35458,0.90834,0.13383),vec3(0.04823,0.01566,0.83777));const mat3 OM=mat3(vec3(1.60475,-0.10208,-0.00327),vec3(-0.53108,1.10813,-0.07276),vec3(-0.07367,-0.00605,1.07602));
  color*=e/0.6;color=IM*color;color=RRTAndODTFitG(color);color=OM*color;color=clamp(color,0.0,1.0);
  float l=dot(color,vec3(0.299,0.587,0.114));
  if(f>0.5&&f<1.5){vec3 sp=vec3(l*1.07+0.03,l*0.93+0.01,l*0.70);color=mix(color,sp,0.78);color=mix(vec3(0.5),color,1.08);}
  else if(f>1.5&&f<2.5){color=mix(color,vec3(l)*vec3(0.85,0.95,1.08),0.55);}
  else if(f>2.5){color=mix(color,vec3(l),0.7);color=(color-0.5)*1.18+0.5;}
  return clamp(color,0.0,1.0);}`);
renderer.toneMapping=THREE.CustomToneMapping;renderer.toneMappingExposure=0.95;
document.body.prepend(renderer.domElement);
const scene=new THREE.Scene();
scene.fog=new THREE.Fog(0xa9bdd0,30,260);
scene.background=new THREE.Color(0x0a0c14);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,0.07,1500);
const rig=new THREE.Group();scene.add(rig);rig.add(camera);camera.position.set(0,1.65,0);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),0.04).texture;
const sky=new Sky();sky.scale.setScalar(1200);scene.add(sky);const su=sky.material.uniforms;
su.turbidity.value=5;su.rayleigh.value=1.5;su.mieCoefficient.value=0.004;su.mieDirectionalG.value=0.8;
// estrellas: tamaños muy distintos (pocas brillantes, muchas tenues), colores reales de estrella (azuladas, blancas, amarillentas, alguna anaranjada o rojiza) y halo suave que titila
const starMat=new THREE.ShaderMaterial({uniforms:{opacity:{value:0},uT:{value:0},uPx:{value:1}},transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,
  vertexShader:`attribute float aS;attribute vec3 aC;attribute float aP;varying vec3 vC;varying float vTw;uniform float uT,uPx;void main(){vC=aC;vTw=0.75+0.25*sin(uT*(1.5+aP*3.0)+aP*40.0);vec4 mv=modelViewMatrix*vec4(position,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=aS*uPx;}`,
  fragmentShader:`varying vec3 vC;varying float vTw;uniform float opacity;void main(){vec2 d=gl_PointCoord-0.5;float r=length(d)*2.0;float core=smoothstep(0.35,0.0,r);float halo=exp(-r*r*5.0)*0.45;float a=(core+halo)*vTw*opacity;if(a<0.004)discard;gl_FragColor=vec4(vC*(core*1.4+halo),a);}`});
const stars=new THREE.Points(new THREE.BufferGeometry(),starMat);stars.frustumCulled=false;
{const a=[],sz=[],col=[],ph=[];const pal=[[0.7,0.8,1.0],[0.85,0.9,1.0],[1,1,1],[1,0.96,0.86],[1,0.88,0.7],[1,0.72,0.55],[1,0.6,0.5]];const pw=[3,4,6,4,2,1,0.5];
  for(let i=0;i<2600;i++){_v.randomDirection();_v.y=Math.abs(_v.y)*0.95+0.03;_v.normalize();a.push(_v.x,_v.y,_v.z);const r=Math.random();sz.push(r<0.006?11:r<0.04?6:r<0.2?3.6:2.2);
    let t=Math.random()*21,k=0;while(t>pw[k]&&k<pw.length-1){t-=pw[k];k++;}const c=pal[k];const b=r<0.2?1:0.55+Math.random()*0.4;col.push(c[0]*b,c[1]*b,c[2]*b);ph.push(Math.random());}
  stars.geometry.setAttribute('position',new THREE.Float32BufferAttribute(a,3));stars.geometry.setAttribute('aS',new THREE.Float32BufferAttribute(sz,1));stars.geometry.setAttribute('aC',new THREE.Float32BufferAttribute(col,3));stars.geometry.setAttribute('aP',new THREE.Float32BufferAttribute(ph,1));}
// luna con halo
const moon=new THREE.Sprite(new THREE.SpriteMaterial({map:cTexMoon(),transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,opacity:0}));scene.add(moon);
function cTexMoon(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');const h=g.createRadialGradient(128,128,0,128,128,128);h.addColorStop(0,'rgba(220,228,255,0.55)');h.addColorStop(0.18,'rgba(200,210,240,0.35)');h.addColorStop(0.5,'rgba(140,160,210,0.08)');h.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=h;g.fillRect(0,0,256,256);
  g.fillStyle='#e8ecf4';g.beginPath();g.arc(128,128,22,0,7);g.fill();g.fillStyle='rgba(150,155,170,0.45)';for(const [x,y,r] of [[120,122,6],[134,131,4],[126,138,3],[137,119,3]]){g.beginPath();g.arc(x,y,r,0,7);g.fill();}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
scene.add(stars);
const hemi=new THREE.HemisphereLight(0xcfe3ff,0x4a4030,0.9);
const sun=new THREE.DirectionalLight(0xfff4e0,2);scene.add(hemi,sun,sun.target);
const flashlight=new THREE.SpotLight(0xfff0d0,0,45,0.42,0.45,1);const flT=new THREE.Object3D();flT.position.set(0,0,-1);flashlight.target=flT;camera.add(flashlight,flT);
const vrFlash=new THREE.SpotLight(0xfff0d0,0,45,0.42,0.45,1);const vrFlT=new THREE.Object3D();vrFlT.position.set(0,-1,-0.3);vrFlash.target=vrFlT;
const headlight=new THREE.SpotLight(0xfff6dd,0,70,0.55,0.4,1);const hlT=new THREE.Object3D();headlight.target=hlT;scene.add(headlight,hlT);
let nightF=0;

// =====================================================================
// SONIDO: gemidos reales (OpenGameArt, CC0) + síntesis
// =====================================================================
let AC=null,noiseBuf=null,engine=null,seaGain=null;
function initAudio(){if(AC)return;try{AC=new(window.AudioContext||window.webkitAudioContext)();noiseBuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const o=AC.createOscillator(),f=AC.createBiquadFilter(),g=AC.createGain();o.type='sawtooth';o.frequency.value=40;f.type='lowpass';f.frequency.value=300;g.gain.value=0;o.connect(f).connect(g).connect(AC.destination);o.start();engine={o,g};
  const sn=AC.createBufferSource();sn.buffer=noiseBuf;sn.loop=true;const sf=AC.createBiquadFilter();sf.type='lowpass';sf.frequency.value=500;seaGain=AC.createGain();seaGain.gain.value=0;sn.connect(sf).connect(seaGain).connect(AC.destination);sn.start();
  initZombieAudio();}catch(e){AC=null;}}
function env(node,vol,dur,delay=0){const g=AC.createGain();const t=AC.currentTime+delay;g.gain.setValueAtTime(0.0001,AC.currentTime);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);node.connect(g).connect(AC.destination);return g;}
function noiseSrc(dur=1,delay=0){const s=AC.createBufferSource();s.buffer=noiseBuf;s.loop=dur>2;s.start(AC.currentTime+delay);s.stop(AC.currentTime+delay+dur);return s;}
function osc(type,f0,f1,dur,delay=0){const o=AC.createOscillator();o.type=type;const t=AC.currentTime+delay;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+dur);o.start(t);o.stop(t+dur+0.05);return o;}
function filt(type,f,q=1){const x=AC.createBiquadFilter();x.type=type;x.frequency.value=f;x.Q.value=q;return x;}
// gemido sintético con formantes de voz ronca (varía cada vez)
function synthGroan(vol,kind){const t=AC.currentTime;const dur=kind==='attack'?R(0.5,0.9):R(0.9,2.0);const f0=kind==='attack'?R(110,170):R(65,110);
  const src=AC.createOscillator();src.type='sawtooth';src.frequency.setValueAtTime(f0,t);src.frequency.linearRampToValueAtTime(f0*R(0.6,0.95),t+dur);
  const vib=AC.createOscillator();vib.frequency.value=R(4,9);const vg=AC.createGain();vg.gain.value=R(2,9);vib.connect(vg).connect(src.frequency);vib.start(t);vib.stop(t+dur);
  const n=noiseSrc(dur);const ng=AC.createGain();ng.gain.value=kind==='attack'?0.6:0.35;n.connect(ng);
  const mix=AC.createGain();src.connect(mix);ng.connect(mix);
  const vowels=[[700,1100],[500,900],[400,800],[600,1000],[300,700]];const [a,b]=pick(vowels);
  const out=AC.createGain();for(const [fq,q,gn] of [[a,6,1],[b,8,0.6],[2500,4,0.15]]){const bp=filt('bandpass',fq,q);bp.frequency.linearRampToValueAtTime(fq*R(0.8,1.2),t+dur);const g=AC.createGain();g.gain.value=gn;mix.connect(bp).connect(g).connect(out);}
  src.start(t);src.stop(t+dur+0.05);const g=env(out,0.0001,dur);g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(0.0001,t);g.gain.linearRampToValueAtTime(0.5*vol,t+dur*0.25);g.gain.linearRampToValueAtTime(0.35*vol,t+dur*0.7);g.gain.linearRampToValueAtTime(0.0001,t+dur);}
const ZFILES=['assets/snd/darsycho__zombie-moans.ogg','assets/snd/enemy_sounds.ogg'];
const zAudio=[];let zAudioOK=0;
function initZombieAudio(){for(let k=0;k<6;k++){const a=new Audio();a.preload='auto';a.src=ZFILES[k%ZFILES.length];a.addEventListener('canplaythrough',()=>{a.ok=true;},{once:true});a.addEventListener('error',()=>{a.bad=true;},{once:true});zAudio.push(a);}}
function zombieSound(vol,kind='groan'){if(vol<0.02)return;const ready=zAudio.filter(a=>a.ok&&!a.bad&&(a.paused||a.ended));
  if(ready.length&&Math.random()<0.6){const a=pick(ready);try{const d=isFinite(a.duration)?a.duration:4;a.currentTime=R(0,Math.max(0,d-2));a.volume=clamp(vol*0.9,0,1);a.playbackRate=R(0.8,1.1);a.play().catch(()=>{});
      clearTimeout(a._t);a._t=setTimeout(()=>{try{a.pause();}catch(e){}},R(1200,2200));return;}catch(e){}}
  if(AC)synthGroan(vol,kind);}
function sfx(type,vol=1){if(!AC||vol<=0.01)return;try{
  if(type==='shot'){const f=filt('lowpass',2600);noiseSrc(0.4).connect(f);env(f,0.8*vol,0.32);env(osc('sine',120,40,0.15),0.6*vol,0.15);}
  else if(type==='hit'){env(osc('sine',150,45,0.16),0.7*vol,0.16);const f=filt('bandpass',800);noiseSrc(0.1).connect(f);env(f,0.4*vol,0.08);}
  else if(type==='hithead'){env(osc('sine',220,60,0.12),0.8*vol,0.12);const f=filt('highpass',1200);noiseSrc(0.1).connect(f);env(f,0.5*vol,0.1);const f2=filt('lowpass',400);noiseSrc(0.2).connect(f2);env(f2,0.5*vol,0.15);}
  else if(type==='swish'){const f=filt('bandpass',1800);noiseSrc(0.2).connect(f);env(f,0.15*vol,0.18);}
  else if(type==='hurt'){env(osc('square',220,90,0.25),0.13*vol,0.25);}
  else if(type==='loot'){env(osc('sine',660,0,0.12),0.12,0.12);env(osc('sine',990,0,0.12,0.09),0.12,0.12,0.09);}
  else if(type==='click'){env(osc('square',1800,0,0.03),0.08,0.03);}
  else if(type==='magout'){env(osc('square',900,300,0.06),0.12,0.07);const f=filt('bandpass',2500);noiseSrc(0.1).connect(f);env(f,0.15,0.06);}
  else if(type==='magin'){env(osc('square',600,1200,0.05),0.15,0.06);const f=filt('bandpass',3000);noiseSrc(0.1).connect(f);env(f,0.25,0.05);}
  else if(type==='rack'){const f=filt('bandpass',2200,2);noiseSrc(0.1).connect(f);env(f,0.35,0.06);const f2=filt('bandpass',3200,2);noiseSrc(0.1,0.12).connect(f2);env(f2,0.35,0.06,0.12);}
  else if(type==='clink'){env(osc('sine',R(3000,4500),0,0.08),0.06*vol,0.08);}
  else if(type==='thud'){const f=filt('lowpass',500);noiseSrc(0.15).connect(f);env(f,0.3*vol,0.12);}
  else if(type==='pee'){const f=filt('bandpass',3000,1.5);noiseSrc(5).connect(f);env(f,0.08,5);}
  else if(type==='drink'){for(let i=0;i<4;i++)env(osc('sine',R(300,500),R(150,250),0.1,i*0.25),0.15,0.1,i*0.25);}
  else if(type==='vomit'){const o=osc('sawtooth',160,70,0.9);const f=filt('lowpass',600);o.connect(f);env(f,0.25,0.9);}
  else if(type==='crash'){const f=filt('lowpass',800);noiseSrc(0.6).connect(f);env(f,0.9*vol,0.5);}
  else if(type==='glass'){for(let i=0;i<9;i++)env(osc('sine',R(2500,6500),R(1500,4000),0.15,i*0.025),0.12*vol,0.15,i*0.025);const f=filt('highpass',3000);noiseSrc(0.4).connect(f);env(f,0.5*vol,0.35);}
  else if(type==='rattle'){for(let i=0;i<4;i++){const f=filt('bandpass',900+i*120,3);noiseSrc(0.06,i*0.07).connect(f);env(f,0.3,0.05,i*0.07);}}
  else if(type==='step'){const f=filt('lowpass',300);noiseSrc(0.08).connect(f);env(f,0.05*vol,0.06);}
}catch(e){}}
const camW=new V3();
const volAt=(x,z,range=60)=>clamp(1-Math.hypot(x-camW.x,z-camW.z)/range,0,1);

// =====================================================================
// TEXTURAS Y MATERIALES (todo local, en assets/tex: fotos CC0 de Poly Haven y ambientCG + generadas)
// =====================================================================
function cTex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);
  const t=new THREE.CanvasTexture(c);if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;}
function speckle(g,w,h,n,a){for(let i=0;i<n;i++){const v=Math.random()<0.5?0:255;g.fillStyle=`rgba(${v},${v},${v},${Math.random()*a})`;g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);}}
function line(g,x0,y0,x1,y1){g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();}
const texLoader=new THREE.TextureLoader();
let texPending=0,texDone=0;
const TEXCACHE={};
// carga una textura local; devuelve el objeto Texture ya (se rellena al llegar)
function ltex(name,srgb=true,repeat=true){const key=name+(srgb?'':'#l');if(TEXCACHE[key])return TEXCACHE[key];texPending++;
  const t=texLoader.load('assets/tex/'+name,()=>{texDone++;setLoad('t',`Texturas: ${texDone}/${texPending}`);},undefined,()=>{texDone++;console.warn('tex fail',name);});
  if(srgb)t.colorSpace=THREE.SRGBColorSpace;if(repeat)t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;TEXCACHE[key]=t;return t;}
const PBR=new Set();const pbr=m=>{if(m&&(m.isMeshStandardMaterial||m.isMeshPhysicalMaterial))PBR.add(m);return m;};
// material de foto: name -> assets/tex/name_diff.jpg (+_nor.jpg). Las UV de la geometría están en metros*us
function photoMat(name,o={}){const{ns,normal,...rest}=o;const m=new THREE.MeshStandardMaterial(Object.assign({map:ltex(name+'_diff.jpg'),roughness:0.9,metalness:0,vertexColors:true},rest));
  if(normal!==false){m.normalMap=ltex(name+'_nor.jpg',false);m.normalScale=new THREE.Vector2(ns||0.8,ns||0.8);}return pbr(m);}
// metros por repetición de cada textura (escala UV)
const TEXM={asphalt:5,asphalt_cracked:5,panot4:0.8,panotflor:0.8,panotbotons:0.8,granite:1.2,plaster_cream:3,plaster_grey:3,plaster_ochre:3,stone_blocks:2.4,stone_dark:3,brick:2,
  shutter:2.2,shutter_rust:2.2,wood_dark:1.2,wood_door:1.5,rust:1.5,floor_hidraulic:1.6,floor_terrazo:1.6,floor_super:2.4,floor_wood:2,concrete:3,concrete_wall:3,bark_platanus:1.4,bark_palm:1.2,llambordes:1.6};
const US=k=>1/(TEXM[k]||1);
// texturas de detalle (siempre procedurales)
// charco de sangre: borde nítido e irregular (lóbulos) con gotas sueltas alrededor
const texBlood=cTex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);const c=128;g.fillStyle='rgb(70,4,3)';g.beginPath();const N=40,ph=[R(0,6),R(0,6),R(0,6)];
  for(let i=0;i<=N;i++){const a=i/N*6.283;const r=62+Math.sin(a*3+ph[0])*12+Math.sin(a*5+ph[1])*8+Math.sin(a*9+ph[2])*4;g.lineTo(c+Math.cos(a)*r,c+Math.sin(a)*r);}g.fill();
  for(let i=0;i<7;i++){const a=R(0,6.28),d=R(55,80);g.beginPath();g.arc(c+Math.cos(a)*d,c+Math.sin(a)*d,R(10,22),0,7);g.fill();}
  for(let i=0;i<40;i++){const a=R(0,6.28),d=R(85,122);g.beginPath();g.arc(c+Math.cos(a)*d,c+Math.sin(a)*d,R(1.5,5),0,7);g.fill();}
  const gr=g.createRadialGradient(c-20,c-20,4,c,c,90);gr.addColorStop(0,'rgba(0,0,0,0.35)');gr.addColorStop(1,'rgba(0,0,0,0)');g.globalCompositeOperation='source-atop';g.fillStyle=gr;g.fillRect(0,0,w,h);g.globalCompositeOperation='source-over';},{});
texBlood.wrapS=texBlood.wrapT=THREE.ClampToEdgeWrapping;
const texShadow=cTex(64,64,(g)=>{const gr=g.createRadialGradient(32,32,2,32,32,30);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);});


// =====================================================================
// MUNDO: Eixample de Barcelona. x = paralelo al mar (este +), z = hacia el mar (+). Sube suave hacia la montaña.
// =====================================================================
const BP=133.3;// distancia entre ejes de calles de Cerdà (manzana de 113,3 m + calle de 20 m)
const NXS=7,NZS=5;// calles jugables
const SX0=-3.5*BP,SZ0=-2*BP;// eje de la primera calle
const XMIN=SX0-40,XMAX=SX0+(NXS-1)*BP+40,ZMIN=SZ0-40,ZMAX=SZ0+(NZS-1)*BP+40;
const H=(x,z)=>-z*0.012;
// =====================================================================
// COLISIONES 3D: cajas y prismas convexos con altura
// =====================================================================
const VOL=[],VG=new Map(),VCG=16,VEMPTY=[];
const vk=(i,j)=>i*10007+j;
function insertVol(v){VOL.push(v);if(DEBUG.has('volsrc'))v.src=(new Error().stack||'').split('\n').slice(2,6).join('|');const i0=Math.floor((v.x0-2.5)/VCG),i1=Math.floor((v.x1+2.5)/VCG),j0=Math.floor((v.z0-2.5)/VCG),j1=Math.floor((v.z1+2.5)/VCG);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=vk(i,j);let a=VG.get(k);if(!a)VG.set(k,a=[]);a.push(v);}return v;}
function addBoxV(x0,x1,z0,z1,y0,y1){if(x1<x0){const t=x0;x0=x1;x1=t;}if(z1<z0){const t=z0;z0=z1;z1=t;}return insertVol({k:0,x0,x1,z0,z1,y0,y1});}
function addPolyV(pts,y0,y1){let area=0;for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];area+=a[0]*b[1]-b[0]*a[1];}
  const P=area<0?pts.slice().reverse():pts.slice();const E=[];let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;
  for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];const ex=b[0]-a[0],ez=b[1]-a[1],l=Math.hypot(ex,ez)||1e-6;E.push([a[0],a[1],ez/l,-ex/l,b[0],b[1]]);
    x0=Math.min(x0,a[0]);x1=Math.max(x1,a[0]);z0=Math.min(z0,a[1]);z1=Math.max(z1,a[1]);}
  return insertVol({k:1,P,E,x0,x1,z0,z1,y0,y1});}
// rectángulo orientado (pared, mueble) como prisma
function addOBB(cx,cz,hw,hd,yaw,y0,y1){const c=Math.cos(yaw),s=Math.sin(yaw);const pts=[[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]].map(([a,b])=>[cx+a*c+b*s,cz-a*s+b*c]);return addPolyV(pts,y0,y1);}
const volsAt=(x,z)=>VG.get(vk(Math.floor(x/VCG),Math.floor(z/VCG)))||VEMPTY;
function pushVol(v,p,r){if(v.k===0){const cx=clamp(p.x,v.x0,v.x1),cz=clamp(p.z,v.z0,v.z1);const dx=p.x-cx,dz=p.z-cz,d2=dx*dx+dz*dz;if(d2>=r*r)return false;
    if(d2>1e-9){const d=Math.sqrt(d2);p.x=cx+dx/d*r;p.z=cz+dz/d*r;}else{const l=p.x-v.x0,rr=v.x1-p.x,t=p.z-v.z0,bt=v.z1-p.z,m=Math.min(l,rr,t,bt);if(m===l)p.x=v.x0-r;else if(m===rr)p.x=v.x1+r;else if(m===t)p.z=v.z0-r;else p.z=v.z1+r;}return true;}
  let maxD=-1e9,mi=0;for(let i=0;i<v.E.length;i++){const e=v.E[i];const d=(p.x-e[0])*e[2]+(p.z-e[1])*e[3];if(d>maxD){maxD=d;mi=i;}}
  if(maxD>=r)return false;
  if(maxD<=0){const e=v.E[mi];p.x+=e[2]*(r-maxD);p.z+=e[3]*(r-maxD);return true;}
  let bd=1e9,bx=0,bz=0;for(const e of v.E){const ex=e[4]-e[0],ez=e[5]-e[1];const L=ex*ex+ez*ez||1e-9;const t=clamp(((p.x-e[0])*ex+(p.z-e[1])*ez)/L,0,1);const qx=e[0]+ex*t,qz=e[1]+ez*t;const d=(p.x-qx)**2+(p.z-qz)**2;if(d<bd){bd=d;bx=qx;bz=qz;}}
  if(bd>=r*r)return false;const d=Math.sqrt(bd)||1e-6;p.x=bx+(p.x-bx)/d*r;p.z=bz+(p.z-bz)/d*r;return true;}
function collide(p,r,ya,yb){if(yb===undefined)yb=ya;let hit=false;const L=volsAt(p.x,p.z);
  for(let n=0;n<L.length;n++){const v=L[n];if(yb<v.y0||ya>v.y1)continue;if(p.x<v.x0-r||p.x>v.x1+r||p.z<v.z0-r||p.z>v.z1+r)continue;if(pushVol(v,p,r))hit=true;}
  if(p.x<XMIN){p.x=XMIN;hit=true}if(p.x>XMAX){p.x=XMAX;hit=true}if(p.z<ZMIN){p.z=ZMIN;hit=true}if(p.z>ZMAX){p.z=ZMAX;hit=true}return hit;}
function insideVol(x,y,z){for(const v of volsAt(x,z)){if(y<v.y0||y>v.y1)continue;if(v.k===0){if(x>v.x0&&x<v.x1&&z>v.z0&&z<v.z1)return true;}
    else{let inside=true;for(const e of v.E)if((x-e[0])*e[2]+(z-e[1])*e[3]>0){inside=false;break;}if(inside)return true;}}return false;}
function rayVol(o,d,v){let t0=0,t1=1e9;
  if(Math.abs(d.y)<1e-9){if(o.y<v.y0||o.y>v.y1)return -1;}else{let a=(v.y0-o.y)/d.y,b=(v.y1-o.y)/d.y;if(a>b){const t=a;a=b;b=t;}t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)return -1;}
  if(v.k===0){for(const [lo,hi,oo,dd] of [[v.x0,v.x1,o.x,d.x],[v.z0,v.z1,o.z,d.z]]){if(Math.abs(dd)<1e-9){if(oo<lo||oo>hi)return -1;continue;}let a=(lo-oo)/dd,b=(hi-oo)/dd;if(a>b){const t=a;a=b;b=t;}t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)return -1;}return t0;}
  for(const e of v.E){const num=(o.x-e[0])*e[2]+(o.z-e[1])*e[3],den=d.x*e[2]+d.z*e[3];if(Math.abs(den)<1e-9){if(num>0)return -1;continue;}const t=-num/den;if(den<0)t0=Math.max(t0,t);else t1=Math.min(t1,t);if(t0>t1)return -1;}return t0;}
function rayWorld(o,d,maxT){let best=maxT;const seen=new Set();for(let s=0;s<=maxT+VCG;s+=VCG*0.5){const t=Math.min(s,maxT);
    for(const v of volsAt(o.x+d.x*t,o.z+d.z*t)){if(seen.has(v))continue;seen.add(v);const tt=rayVol(o,d,v);if(tt>=0&&tt<best)best=tt;}}
  for(let t=0;t<best;t+=1.5){if(o.y+d.y*t<H(o.x+d.x*t,o.z+d.z*t)-0.1){best=Math.max(0,t-0.75);break;}}return best;}

// =====================================================================
// SUPERFICIES: terreno + aceras (+12 cm) + suelos interiores
// =====================================================================
const CURB=0.13;const SWG=new Map(),FLOORS=new Map();
function insidePoly(x,z,P){let inside=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if(((a[1]>z)!==(b[1]>z))&&(x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0]))inside=!inside;}return inside;}
function polyBBox(P){let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const p of P){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);z0=Math.min(z0,p[1]);z1=Math.max(z1,p[1]);}return{x0,x1,z0,z1};}
function gridInsert(G,obj,bb){for(let i=Math.floor(bb.x0/VCG);i<=Math.floor(bb.x1/VCG);i++)for(let j=Math.floor(bb.z0/VCG);j<=Math.floor(bb.z1/VCG);j++){const k=vk(i,j);let a=G.get(k);if(!a)G.set(k,a=[]);a.push(obj);}}
function addSidewalk(P){gridInsert(SWG,{P,bb:polyBBox(P)},polyBBox(P));}
// suelo interior: y constante, o rampa (escaleras) con y=f(x,z)
function addFloor(P,y,fn){const f={P,y,fn,bb:polyBBox(P)};gridInsert(FLOORS,f,f.bb);return f;}
function onSidewalk(x,z){const L=SWG.get(vk(Math.floor(x/VCG),Math.floor(z/VCG)));if(!L)return false;for(const s of L){if(x<s.bb.x0||x>s.bb.x1||z<s.bb.z0||z>s.bb.z1)continue;if(insidePoly(x,z,s.P))return true;}return false;}
function surfY(x,z,ref){let y=H(x,z);if(onSidewalk(x,z))y+=CURB;
  const L=FLOORS.get(vk(Math.floor(x/VCG),Math.floor(z/VCG)));
  if(L){const lim=(ref===undefined?y:ref)+0.55;let best=-1e9;for(const f of L){if(x<f.bb.x0||x>f.bb.x1||z<f.bb.z0||z>f.bb.z1)continue;const fy=f.fn?f.fn(x,z):f.y;if(fy<=lim&&fy>best&&insidePoly(x,z,f.P))best=fy;}if(best>-1e8)y=best;}
  return y;}

// =====================================================================
// BUFFERS DE GEOMETRÍA POR ZONAS (para ocultar lo lejano)
// =====================================================================
const CHUNK=190,CHUNKI=48;const chunks=new Map();
let INTERIOR=false;
const chunkKey=(x,z)=>INTERIOR?Math.floor((x-XMIN)/CHUNKI)+'_'+Math.floor((z-ZMIN)/CHUNKI)+'_i':Math.floor((x-XMIN)/CHUNK)+'_'+Math.floor((z-ZMIN)/CHUNK);
function getChunk(x,z,key){const k=key||chunkKey(x,z);let c=chunks.get(k);if(!c){const inner=k.endsWith('_i'),sz=inner?CHUNKI:CHUNK;c={k,inner,buf:{},inst:{},meshes:[],cx:XMIN+(Math.floor((x-XMIN)/sz)+0.5)*sz,cz:ZMIN+(Math.floor((z-ZMIN)/sz)+0.5)*sz};chunks.set(k,c);}return c;}
function GB(){return{p:[],n:[],u:[],c:[]};}
function bufOf(x,z,mat){const c=getChunk(x,z);return c.buf[mat]||(c.buf[mat]=GB());}
let TINT=[1,1,1];
function pushV(b,x,y,z,nx,ny,nz,u,v){b.p.push(x,y,z);b.n.push(nx,ny,nz);b.u.push(u,v);b.c.push(TINT[0],TINT[1],TINT[2]);}
// pared vertical entre (x0,z0)-(x1,z1), normal hacia fuera (nx,nz); u,v en metros/escala
function wallQ(b,x0,z0,x1,z1,ya0,yb0,ya1,yb1,nx,nz,us,u0=0){const ex=x1-x0,ez=z1-z0,L=Math.hypot(ex,ez);
  if((-ez*nx+ex*nz)<0){let t=x0;x0=x1;x1=t;t=z0;z0=z1;z1=t;t=ya0;ya0=ya1;ya1=t;t=yb0;yb0=yb1;yb1=t;}
  const uA=u0*us,uB=(u0+L)*us;
  pushV(b,x0,ya0,z0,nx,0,nz,uA,ya0*us);pushV(b,x1,ya1,z1,nx,0,nz,uB,ya1*us);pushV(b,x1,yb1,z1,nx,0,nz,uB,yb1*us);
  pushV(b,x0,ya0,z0,nx,0,nz,uA,ya0*us);pushV(b,x1,yb1,z1,nx,0,nz,uB,yb1*us);pushV(b,x0,yb0,z0,nx,0,nz,uA,yb0*us);}
function wall(b,x0,z0,x1,z1,y0,y1,nx,nz,us,u0){wallQ(b,x0,z0,x1,z1,y0,y1,y0,y1,nx,nz,us,u0);}
function capPoly(b,P,y,us,down){let area=0;for(let i=0;i<P.length;i++){const a=P[i],c=P[(i+1)%P.length];area+=a[0]*c[1]-c[0]*a[1];}
  let Q=area>0?P.slice().reverse():P;if(down)Q=Q.slice().reverse();const ny=down?-1:1;
  for(let i=1;i<Q.length-1;i++)for(const q of [Q[0],Q[i],Q[i+1]])pushV(b,q[0],typeof y==='function'?y(q[0],q[1]):y,q[1],0,ny,0,q[0]*us,q[1]*us);}
function boxGeoInto(b,cx,cy,cz,w,h,d,yaw,us){const c=Math.cos(yaw),s=Math.sin(yaw);const X=(a,bb)=>[cx+a*c+bb*s,cz-a*s+bb*c];const hw=w/2,hd=d/2;
  const P=[X(-hw,-hd),X(hw,-hd),X(hw,hd),X(-hw,hd)];for(let i=0;i<4;i++){const a=P[i],q=P[(i+1)%4];const ex=q[0]-a[0],ez=q[1]-a[1],l=Math.hypot(ex,ez);let nx=ez/l,nz=-ex/l;
    const mx=(a[0]+q[0])/2-cx,mz=(a[1]+q[1])/2-cz;if(nx*mx+nz*mz<0){nx=-nx;nz=-nz;}wall(b,a[0],a[1],q[0],q[1],cy-h/2,cy+h/2,nx,nz,us);}
  capPoly(b,P,cy+h/2,us);capPoly(b,P,cy-h/2,us,true);}
const MATS={};
function buildChunks(){for(const c of chunks.values()){for(const name in c.buf){const b=c.buf[name];if(!b.p.length)continue;const g=new THREE.BufferGeometry();
      g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(b.u,2));
      g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));g.computeBoundingSphere();const me=new THREE.Mesh(g,MATS[name]);me.matrixAutoUpdate=false;scene.add(me);c.meshes.push(me);}
    c.buf=null;}}
// instancias por zona con atlas (ventanas, escaparates, rótulos…)
function atlasMat(map,emis,cols,rows,o={}){const m=new THREE.MeshLambertMaterial(Object.assign({map,emissiveMap:emis||null,emissive:emis?0xffffff:0x000000,emissiveIntensity:0},o));
  m.userData.atlas=[1/cols,1/rows];
  m.onBeforeCompile=sh=>{sh.uniforms.uAtlas={value:new THREE.Vector2(1/cols,1/rows)};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 aOff;attribute float aLit;uniform vec2 uAtlas;varying float vLit;')
      .replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv=vMapUv*uAtlas+aOff;\n#endif\n#ifdef USE_EMISSIVEMAP\nvEmissiveMapUv=vEmissiveMapUv*uAtlas+aOff;\n#endif\nvLit=aLit;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vLit;').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance*=vLit;');};
  return m;}
const atlasOff=(k,cols,rows)=>[(k%cols)/cols,1-(Math.floor(k/cols)+1)/rows];
const INST={};// nombre → {geo, mat, cols, rows, perChunk:Map(chunk→[]) }
function defInst(name,geo,mat,cols=1,rows=1,global=false){INST[name]={geo,mat,cols,rows,global,lists:new Map()};}
function addInst(name,x,y,z,yaw,sx=1,sy=1,sz=1,k=0,lit=0,pitch=0,col){const I=INST[name];if(I.parts)for(const pn of I.parts)addInst(pn,x,y,z,yaw,sx,sy,sz,k,lit,pitch,col);const key=I.global?'g':chunkKey(x,z);let L=I.lists.get(key);if(!L)I.lists.set(key,L=[]);L.push([x,y,z,yaw,sx,sy,sz,k,lit,pitch,col]);return[name,key,L.length-1];}
const instMeshes=[];const _eu=new THREE.Euler();
function buildInst(){for(const name in INST){const I=INST[name];for(const [key,L] of I.lists){const im=new THREE.InstancedMesh(I.geo,I.mat,L.length);const off=new Float32Array(L.length*2),lit=new Float32Array(L.length);
      L.forEach((t,i)=>{_eu.set(t[9],t[3],t[11]||0,'YXZ');_m.compose(_p.set(t[0],t[1],t[2]),_q.setFromEuler(_eu),_s.set(t[4],t[5],t[6]));im.setMatrixAt(i,_m);const o=atlasOff(t[7],I.cols,I.rows);off[i*2]=o[0];off[i*2+1]=o[1];lit[i]=t[8];if(t[10]!==undefined)im.setColorAt(i,_c.set(t[10]));});
      if(I.mat.userData.atlas){im.geometry=I.geo.clone();im.geometry.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,2));im.geometry.setAttribute('aLit',new THREE.InstancedBufferAttribute(lit,1));}
      im.computeBoundingSphere();scene.add(im);im.userData.name=name;im.userData.list=L;
      if(key==='g')instMeshes.push(im);else{const c=chunks.get(key)||getChunk(L[0][0],L[0][2],key);c.meshes.push(im);}
      I.meshes=I.meshes||[];I.meshes.push(im);I.byKey=I.byKey||{};I.byKey[key]=im;}}}
function instRef(name,x,z){const I=INST[name];const key=I.global?'g':chunkKey(x,z);const L=I.lists.get(key);return[name,key,L?L.length-1:0];}
function hideInst(ref){const I=INST[ref[0]];const im=I.byKey&&I.byKey[ref[1]];if(!im)return;im.setMatrixAt(ref[2],ZM);im.instanceMatrix.needsUpdate=true;}


// =====================================================================
// GEOMETRÍA AUXILIAR Y MOBILIARIO URBANO DE BARCELONA (instanciado)
// =====================================================================
const hexTint=h=>{const c=new THREE.Color(h);return[c.r,c.g,c.b];};
function colorize(geo,hex){const c=new THREE.Color(hex);const n=geo.attributes.position.count;const a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;}geo.setAttribute('color',new THREE.BufferAttribute(a,3));return geo;}
function mkG(parts){return mergeGeometries(parts.map(([g,col])=>{let q=(g.index?g.toNonIndexed():g);for(const k of Object.keys(q.attributes))if(!['position','normal','uv'].includes(k))q.deleteAttribute(k);
  if(q.attributes.uv===undefined)q.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(q.attributes.position.count*2),2));return colorize(q,col);}));}
const bx=(w,h,d,x,y,z,rx=0,ry=0,rz=0)=>{const g=new THREE.BoxGeometry(w,h,d);if(rx||ry||rz)g.applyMatrix4(new M4().makeRotationFromEuler(new THREE.Euler(rx,ry,rz)));g.translate(x,y,z);return g;};
const cy=(r0,r1,h,x,y,z,seg=8,rx=0,rz=0)=>{const g=new THREE.CylinderGeometry(r0,r1,h,seg);if(rx||rz)g.applyMatrix4(new M4().makeRotationFromEuler(new THREE.Euler(rx,0,rz)));g.translate(x,y,z);return g;};
const sp=(r,x,y,z,seg=8)=>{const g=new THREE.SphereGeometry(r,seg,Math.max(4,seg/2|0));g.translate(x,y,z);return g;};
const tor=(r,t,x,y,z,ry=0,seg=14)=>{const g=new THREE.TorusGeometry(r,t,5,seg);g.rotateY(ry);g.translate(x,y,z);return g;};
// tubo entre dos puntos
const tube=(a,b,r,seg=6)=>{const A=new V3(...a),B=new V3(...b);const d=B.clone().sub(A);const g=new THREE.CylinderGeometry(r,r,d.length(),seg);g.applyQuaternion(new Q4().setFromUnitVectors(UP,d.clone().normalize()));const m=A.add(B).multiplyScalar(0.5);g.translate(m.x,m.y,m.z);return g;};
// materiales del mobiliario: el color va por vértice y encima una foto de detalle (grano del metal/plástico, relieve y brillo irregular)
function detMat(name,rough,metal,ns){const m=new THREE.MeshStandardMaterial({vertexColors:true,map:ltex(name+'_diff.jpg'),normalMap:ltex(name+'_nor.jpg',false),roughnessMap:ltex(name+'_rough.jpg',false),roughness:rough,metalness:metal});m.normalScale=new THREE.Vector2(ns,ns);return pbr(m);}
const metalMat=detMat('det_metal',1.35,0.55,0.9);
const paintMat=detMat('det_metal',1.7,0.12,0.7);
const plasticMat=detMat('det_plastic',2.0,0,0.8);
// torneado (perfil [radio,altura]) y perfil 2D [z,y] extruido a lo ancho (x)
const lathe=(pts,seg=16,x=0,y=0,z=0)=>{const g=new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg);g.translate(x,y,z);return g;};
const prof=(pts,w,x=0)=>{const sh=new THREE.Shape();pts.forEach((p,i)=>i?sh.lineTo(p[0],p[1]):sh.moveTo(p[0],p[1]));sh.closePath();const g=new THREE.ExtrudeGeometry(sh,{depth:w,bevelEnabled:false});g.translate(0,0,-w/2);g.rotateY(-Math.PI/2);g.translate(x,0,0);return g;};
const ell=(rx,ry,rz,x,y,z,seg=10)=>{const g=new THREE.SphereGeometry(1,seg,Math.max(6,seg*0.7|0));g.scale(rx,ry,rz);g.translate(x,y,z);return g;};
const woodPropMat=photoMat('wood_dark',{ns:0.5});
const glassMat=pbr(new THREE.MeshStandardMaterial({color:0xa9c0c8,roughness:0.04,metalness:0.1,transparent:true,opacity:0.28,depthWrite:false,side:THREE.DoubleSide,envMapIntensity:1.5}));
const emisMat=new THREE.MeshBasicMaterial({vertexColors:true});
const IRON=0x2b302d,GREY=0x6a6f73,DGREY=0x2e3236,LAMPG=0x33403b,WOOD=0x8a5a32;
const PLANE=new THREE.PlaneGeometry(1,1);

// ---------- atlas de señales de tráfico (normativa española) ----------
const texSigns=cTex(1024,512,(g)=>{const C=256;const cell=(i,f)=>{const x=(i%4)*C,y=Math.floor(i/4)*C;g.save();g.translate(x,y);f();g.restore();};
  const disc=(fill,ring)=>{g.fillStyle=ring;g.beginPath();g.arc(128,128,118,0,7);g.fill();g.fillStyle=fill;g.beginPath();g.arc(128,128,96,0,7);g.fill();};
  // 0 sentido obligatorio/única (azul con flecha)
  cell(0,()=>{g.fillStyle='#fff';g.fillRect(8,8,240,240);g.fillStyle='#1d56a8';g.fillRect(16,16,224,224);g.fillStyle='#fff';g.beginPath();g.moveTo(40,128);g.lineTo(150,60);g.lineTo(150,100);g.lineTo(216,100);g.lineTo(216,156);g.lineTo(150,156);g.lineTo(150,196);g.closePath();g.fill();});
  // 1 dirección prohibida
  cell(1,()=>{g.fillStyle='#fff';g.beginPath();g.arc(128,128,122,0,7);g.fill();g.fillStyle='#c8102e';g.beginPath();g.arc(128,128,114,0,7);g.fill();g.fillStyle='#fff';g.fillRect(40,106,176,44);});
  // 2 paso de peatones
  cell(2,()=>{g.fillStyle='#fff';g.fillRect(8,8,240,240);g.fillStyle='#1d56a8';g.fillRect(16,16,224,224);g.fillStyle='#fff';g.beginPath();g.moveTo(128,30);g.lineTo(226,214);g.lineTo(30,214);g.closePath();g.fill();
    g.fillStyle='#111';for(let i=0;i<4;i++)g.fillRect(70+i*30,180,18,24);g.beginPath();g.arc(128,92,10,0,7);g.fill();g.lineWidth=9;g.strokeStyle='#111';line(g,128,104,122,140);line(g,122,140,108,170);line(g,122,140,138,168);line(g,126,114,106,130);line(g,126,114,146,126);});
  // 3 limitación 30
  cell(3,()=>{disc('#fff','#c8102e');g.fillStyle='#111';g.font='bold 110px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('30',128,134);});
  // 4 stop
  cell(4,()=>{g.fillStyle='#fff';g.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;g.lineTo(128+124*Math.cos(a),128+124*Math.sin(a));}g.fill();g.fillStyle='#c8102e';g.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;g.lineTo(128+114*Math.cos(a),128+114*Math.sin(a));}g.fill();
    g.fillStyle='#fff';g.font='bold 78px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('STOP',128,132);});
  // 5 ceda el paso
  cell(5,()=>{g.fillStyle='#c8102e';g.beginPath();g.moveTo(10,30);g.lineTo(246,30);g.lineTo(128,236);g.closePath();g.fill();g.fillStyle='#fff';g.beginPath();g.moveTo(46,50);g.lineTo(210,50);g.lineTo(128,194);g.closePath();g.fill();});
  // 6 carga y descarga
  cell(6,()=>{g.fillStyle='#fff';g.fillRect(8,8,240,240);g.fillStyle='#1d56a8';g.fillRect(16,16,224,224);g.fillStyle='#fff';g.font='bold 54px Arial';g.textAlign='center';g.fillText('C/D',128,96);g.font='bold 30px Arial';g.fillText('8-20h',128,150);g.fillText('Màx 30 min',128,196);});
  // 7 prohibido estacionar
  cell(7,()=>{disc('#1d56a8','#c8102e');g.strokeStyle='#c8102e';g.lineWidth=22;line(g,60,60,196,196);});
},{});
texSigns.wrapS=texSigns.wrapT=THREE.ClampToEdgeWrapping;
const signMat=atlasMat(texSigns,null,4,2,{side:THREE.DoubleSide,alphaTest:0.5});
// cara de señal (plano de 0.6 m) + palo
defInst('signFace',(()=>{const g=new THREE.PlaneGeometry(0.6,0.6);return g;})(),signMat,4,2,true);
const SIGNBACK=pbr(new THREE.MeshStandardMaterial({color:0x9a9ea2,roughness:0.5,metalness:0.6}));
// trasera de la señal (chapa gris) y abrazaderas al poste
defInst('signBackS',(()=>{const g=new THREE.BoxGeometry(0.6,0.6,0.012);g.translate(0,0,-0.008);return g;})(),SIGNBACK,1,1,false);
defInst('signBackC',(()=>{const g=new THREE.CylinderGeometry(0.3,0.3,0.012,24);g.rotateX(Math.PI/2);g.translate(0,0,-0.008);return g;})(),SIGNBACK,1,1,false);
defInst('signPole',mkG([[cy(0.03,0.03,3.1,0,1.55,0,6),0x8d9194]]),metalMat,1,1,false);

// ---------- farola del Eixample (fanal alto con brazo) ----------
{const p=[[cy(0.16,0.2,0.6,0,0.3,0,10),LAMPG],[cy(0.09,0.13,8.2,0,4.4,0,10),LAMPG],[cy(0.11,0.11,0.12,0,1.2,0,10),LAMPG]];
  const arc=[];for(let i=0;i<6;i++){const a0=i/6*Math.PI/2,a1=(i+1)/6*Math.PI/2;arc.push([tube([0,8.4+Math.sin(a0)*0.6,(1-Math.cos(a0))*0.9],[0,8.4+Math.sin(a1)*0.6,(1-Math.cos(a1))*0.9],0.05),LAMPG]);}
  p.push(...arc,[tube([0,9.0,0.9],[0,9.0,1.6],0.045),LAMPG],[bx(0.42,0.16,0.75,0,8.92,1.75),LAMPG],[bx(0.36,0.03,0.66,0,8.83,1.75),0xe8e2cc]);
  defInst('fanal',mkG(p),paintMat,1,1,false);}
// farola peatonal de rambla (fanal de 5 brazos simplificado)
defInst('fanalR',mkG([[cy(0.12,0.16,4.2,0,2.1,0,10),LAMPG],[sp(0.22,0,4.5,0,10),0xf0ead8],[cy(0.05,0.05,0.3,0,4.2,0),LAMPG],[sp(0.16,0.55,4.1,0,8),0xf0ead8],[sp(0.16,-0.55,4.1,0,8),0xf0ead8],[tube([0,3.9,0],[0.55,3.95,0],0.03),LAMPG],[tube([0,3.9,0],[-0.55,3.95,0],0.03),LAMPG]]),paintMat,1,1,false);
// papelera de Barcelona: cubo gris abatible colgado de un poste con aro
defInst('papelera',mkG([[cy(0.04,0.04,1.02,0,0.51,-0.02,10),0x6d7276],[sp(0.042,0,1.02,-0.02,8),0x6d7276],[tube([0,0.92,-0.02],[0,0.92,0.12],0.018),0x6d7276],
  [lathe([[0.001,0.34],[0.15,0.35],[0.185,0.42],[0.215,0.96],[0.228,0.965],[0.228,0.99],[0.2,0.99],[0.195,0.5],[0.001,0.46]],18,0,0,0.33),0x868b8f],[tor(0.222,0.013,0,0.99,0.33,0,18).rotateX(0),0x55595c],
  [bx(0.2,0.13,0.012,0,0.72,0.545),0xe8e8e2]]),metalMat,1,1,false);
// banco Barcelona: listones de madera sobre dos patas de fundición de aluminio
{const WD=0xb07a48,AL=0x9da2a6;const w=[],m=[];
  // listones siguiendo la curva del asiento y del respaldo
  for(const [z,y,a] of [[-0.215,0.43,0.1],[-0.135,0.425,0.04],[-0.055,0.42,0],[0.025,0.42,-0.04],[0.105,0.425,-0.1],[0.185,0.44,-0.22]])w.push([bx(1.8,0.03,0.068,0,y,z,a),WD]);
  for(const [z,y,a] of [[0.262,0.545,-1.22],[0.292,0.635,-1.25],[0.32,0.725,-1.28],[0.345,0.815,-1.31]])w.push([bx(1.8,0.03,0.07,0,y,z,a),WD]);
  for(const x of [-0.72,0.72]){m.push([tube([x,0,-0.2],[x,0.405,-0.2],0.024,8),AL],[tube([x,0.405,-0.2],[x,0.405,0.2],0.024,8),AL],[tube([x,0,0.3],[x,0.41,0.21],0.024,8),AL],[tube([x,0.41,0.21],[x,0.86,0.335],0.022,8),AL],
      [tube([x,0.2,-0.2],[x,0.2,0.255],0.016,6),AL],[cy(0.04,0.045,0.02,x,0.01,-0.2,10),AL],[cy(0.04,0.045,0.02,x,0.01,0.3,10),AL],[sp(0.026,x,0.86,0.335,8),AL]);}
  defInst('banc',mkG(m),metalMat,1,1,false);defInst('bancWood',mkG(w),woodPropMat,1,1,false);INST.banc.parts=['bancWood'];}
// pilona Barcelona (C-42P): fundición negra, cuello con anilla y cabeza redondeada
defInst('pilona',mkG([[lathe([[0.074,0],[0.07,0.03],[0.058,0.06],[0.054,0.8],[0.047,0.815],[0.047,0.835],[0.06,0.85],[0.062,0.9],[0.055,0.945],[0.035,0.972],[0.001,0.98]],9),0x1e2021]]),metalMat,1,1,false);
// alcorque Barcelona: marco cuadrado con reja circular de fundición (anillos y ranuras radiales)
const texGrate=cTex(256,256,(g,w,h)=>{g.fillStyle='#3a332b';g.fillRect(0,0,w,h);const c=w/2;g.fillStyle='#24211e';g.beginPath();g.arc(c,c,118,0,7);g.fill();
  g.fillStyle='#2b2d2c';g.fillRect(0,0,w,h);g.globalCompositeOperation='destination-out';g.globalCompositeOperation='source-over';
  // tierra del centro y ranuras
  g.fillStyle='#4a3c2c';g.beginPath();g.arc(c,c,40,0,7);g.fill();
  g.strokeStyle='#0c0c0b';g.lineCap='round';for(const [r0,r1,n,lw] of [[50,74,28,5],[82,106,40,5]])for(let i=0;i<n;i++){const a=i/n*6.283;g.lineWidth=lw;g.beginPath();g.moveTo(c+Math.cos(a)*r0,c+Math.sin(a)*r0);g.lineTo(c+Math.cos(a)*r1,c+Math.sin(a)*r1);g.stroke();}
  g.strokeStyle='#454746';g.lineWidth=3;for(const r of [44,78,110,120])  {g.beginPath();g.arc(c,c,r,0,7);g.stroke();}
  g.strokeStyle='#17181a';g.lineWidth=2;line(g,c,4,c,h-4);line(g,4,c,w-4,c);g.strokeStyle='#4a4c4b';g.lineWidth=6;g.strokeRect(3,3,w-6,h-6);
  const d=g.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const n=(Math.random()-0.5)*18;d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n;}g.putImageData(d,0,0);},{});
defInst('alcorque',(()=>{const g=new THREE.PlaneGeometry(1.25,1.25);g.rotateX(-Math.PI/2);g.translate(0,0.006,0);return g;})(),new THREE.MeshLambertMaterial({map:texGrate,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),1,1,false);
// contenedores de Barcelona (carga lateral): cuerpo gris troncocónico, tapa abombada y franja del color de la fracción
const CONT=[['resta',0x5d6164],['organica',0x7c4a22],['envasos',0xf0c000],['paper',0x1b63b5],['vidre',0x2c8a3a]];
{const BODY=0x9a9d9c,LID=0x7e8283,DK=0x1b1c1d;const dome=[];for(let k=0;k<=10;k++){const a=k/10*Math.PI;dome.push([Math.cos(a)*0.69,1.14+Math.pow(Math.sin(a),0.75)*0.4]);}dome.push([-0.69,1.08],[0.69,1.08]);
  for(const [k,col] of CONT){const p=[[prof([[-0.5,0.13],[0.5,0.13],[0.6,0.5],[0.66,1.1],[-0.66,1.1],[-0.6,0.5]],1.82),BODY],[prof(dome,1.9),LID],
      [bx(1.9,0.085,0.03,0,1.125,0.695),col],[bx(1.3,0.2,0.03,0,1.36,0.555,-0.95),col],[bx(1.1,0.11,0.02,0,1.36,0.575,-0.95),DK],
      [bx(0.56,0.34,0.012,0,0.78,0.632,-0.15),0xf1f1ec],[bx(0.5,0.1,0.014,0,0.86,0.624,-0.15),col],
      [tube([-0.78,0.1,0.64],[0.78,0.1,0.64],0.02,8),DK],[tube([-0.78,0.1,0.64],[-0.78,0.2,0.5],0.02,6),DK],[tube([0.78,0.1,0.64],[0.78,0.2,0.5],0.02,6),DK],
      [bx(1.7,0.13,0.9,0,0.065,0),DK]];
    for(const x of [-0.925,0.925])p.push([bx(0.03,0.42,0.5,x,0.82,0),0x6c7071],[cy(0.045,0.045,0.09,x*1.03,1.0,0,10,0,Math.PI/2),DK]);
    if(k==='vidre')p.push([cy(0.11,0.11,0.05,-0.45,1.4,0.5,12,0.62),DK],[cy(0.11,0.11,0.05,0.45,1.4,0.5,12,0.62),DK]);
    defInst('cont_'+k,mkG(p),plasticMat,1,1,false);}}
// Bicing: anclaje y bicicleta roja con guardabarros trasero blanco
defInst('bicingDock',mkG([[cy(0.065,0.075,0.74,0,0.37,0,14),0x73787c],[cy(0.08,0.08,0.13,0,0.8,0,14),0xd0202a],[sp(0.079,0,0.865,0,10),0xd0202a],[bx(0.05,0.1,0.1,0,0.72,0.07),0x1b1c1d],[bx(0.34,0.035,0.2,0,0.018,0),0x55595c]]),paintMat,1,1,false);
{const W=0xf3f3f1,RD=0xd0202a,BK=0x141414,AL=0xa9adb0;const p=[];
  for(const z of [-0.52,0.55]){p.push([tor(0.31,0.03,0,0.34,z,Math.PI/2,22),BK],[tor(0.276,0.011,0,0.34,z,Math.PI/2,22),AL],[cy(0.035,0.035,0.09,0,0.34,z,10,0,Math.PI/2),AL]);for(let k=0;k<6;k++)p.push([bx(0.005,0.54,0.008,0,0.34,z,k*Math.PI/6),AL]);}
  // cuadro de barra baja
  p.push([tube([0,0.6,0.43],[0,1.02,0.33],0.03,10),RD],[tube([0,0.92,0.36],[0,0.5,0.16],0.042,10),RD],[tube([0,0.5,0.16],[0,0.36,-0.12],0.042,10),RD],[sp(0.043,0,0.5,0.16,8),RD],[tube([0,0.36,-0.12],[0,0.92,-0.3],0.03,10),RD],
    [cy(0.05,0.05,0.12,0,0.36,-0.12,10,0,Math.PI/2),AL],[tube([0,0.36,-0.12],[0.16,0.24,-0.06],0.012,6),BK],[tube([0,0.36,-0.12],[-0.16,0.48,-0.18],0.012,6),BK],[bx(0.08,0.02,0.05,0.2,0.24,-0.06),BK],[bx(0.08,0.02,0.05,-0.2,0.48,-0.18),BK]);
  for(const x of [-0.055,0.055])p.push([tube([x,0.36,-0.12],[x,0.34,-0.52],0.016,6),RD],[tube([x,0.74,-0.25],[x,0.34,-0.52],0.014,6),RD],[tube([x,0.6,0.43],[x,0.34,0.55],0.017,6),BK],[bx(0.008,0.24,0.5,x*1.25,0.6,-0.52),W]);
  // guardabarros: trasero blanco y ancho, delantero rojo
  {const g=new THREE.TorusGeometry(0.352,0.022,5,14,Math.PI*0.95);g.rotateZ(0.1);g.rotateY(Math.PI/2);g.scale(3.2,1,1);g.translate(0,0.34,-0.52);p.push([g,W]);
   const g2=new THREE.TorusGeometry(0.35,0.02,5,10,Math.PI*0.6);g2.rotateZ(0.5);g2.rotateY(Math.PI/2);g2.scale(2.2,1,1);g2.translate(0,0.34,0.55);p.push([g2,RD]);}
  // sillín, tija, potencia, manillar con puños y cesta-anclaje delantero
  p.push([tube([0,0.92,-0.3],[0,1.02,-0.33],0.016,8),AL],[ell(0.085,0.03,0.14,0,1.045,-0.35,10),BK],[tube([0,1.02,0.33],[0,1.1,0.27],0.02,8),AL],[tube([-0.3,1.11,0.25],[0.3,1.11,0.25],0.013,8),BK],
    [tube([-0.31,1.11,0.25],[-0.2,1.11,0.25],0.02,8),BK],[tube([0.2,1.11,0.25],[0.31,1.11,0.25],0.02,8),BK],[tube([0,1.1,0.27],[0,1.11,0.25],0.02,6),AL],
    [bx(0.22,0.16,0.22,0,0.9,0.6),RD],[bx(0.24,0.02,0.3,0,0.99,0.62),BK],[bx(0.12,0.07,0.012,0,0.9,0.716),W],[tube([-0.13,0.99,0.48],[-0.13,1.08,0.48],0.008,5),BK],[tube([0.13,0.99,0.48],[0.13,1.08,0.48],0.008,5),BK],[tube([-0.13,1.08,0.48],[0.13,1.08,0.48],0.008,5),BK],
    [tube([-0.13,0.99,0.76],[-0.13,1.08,0.76],0.008,5),BK],[tube([0.13,0.99,0.76],[0.13,1.08,0.76],0.008,5),BK],[tube([-0.13,1.08,0.76],[0.13,1.08,0.76],0.008,5),BK],[tube([-0.13,1.08,0.48],[-0.13,1.08,0.76],0.008,5),BK],[tube([0.13,1.08,0.48],[0.13,1.08,0.76],0.008,5),BK]);
  defInst('bicingBike',mkG(p),paintMat,1,1,false);}
defInst('bicingTotem',mkG([[bx(0.5,2.1,0.2,0,1.05,0),0xd0202a],[bx(0.51,0.4,0.21,0,1.92,0),0xf3f3f1],[bx(0.36,0.3,0.015,0,1.35,0.105),0x101315],[bx(0.56,0.05,0.26,0,0.025,0),0x33373a]]),paintMat,1,1,false);
// marquesina TMB: cubierta con la cara inferior amarilla, fondo de vidrio, panel publicitario y banco
{const ST=0x62686c,YE=0xf2c400;const p=[[bx(4.5,0.07,1.75,0,2.52,0.05),0x4d5357],[bx(4.42,0.035,1.68,0,2.47,0.05),YE],[bx(4.5,0.1,0.05,0,2.5,0.92),ST],
    [bx(0.09,2.5,0.09,-2.1,1.25,-0.74),ST],[bx(0.09,2.5,0.09,0.75,1.25,-0.74),ST],[bx(0.09,2.5,0.09,2.1,1.25,-0.74),ST],[bx(4.3,0.06,0.06,0,0.32,-0.74),ST],[bx(4.3,0.06,0.06,0,2.2,-0.74),ST],
    [bx(1.32,1.95,0.16,1.42,1.28,-0.74),0x2c3033],[bx(1.32,0.08,0.2,1.42,2.3,-0.74),ST],
    [bx(2.3,0.035,0.34,-0.75,0.47,-0.45),0x8d9296],[tube([-1.75,0,-0.45],[-1.75,0.46,-0.45],0.028,8),ST],[tube([0.25,0,-0.45],[0.25,0.46,-0.45],0.028,8),ST],[bx(2.3,0.05,0.04,-0.75,0.44,-0.3),ST]];
  defInst('marquesina',mkG(p),paintMat,1,1,false);
  const gl=mkG([[bx(2.75,1.8,0.02,-0.68,1.27,-0.74),0xffffff]]);defInst('marquesinaGlass',gl,glassMat,1,1,false);
  // cartel del mupi: anuncios descoloridos, algunos rotos o tapados con avisos
  const texMupi=cTex(1024,1024,(g)=>{const W=256,Hh=512;const ads=[['#0d3b66','#faf0ca','CONCERT','PALAU SANT JORDI · 14 MARÇ'],['#e63946','#f1faee','REBAIXES','-50% EN TOT'],['#2a9d8f','#e9f5f2','BCN NETA','Recicla. Cada dia.'],['#1d1d1d','#f2c94c','ESTRENA','Al cinema aquest divendres'],
      ['#f4a261','#264653','FESTA MAJOR','Gràcia · agost'],['#6a4c93','#ffffff','MUSEU','Exposició temporal'],['#ffffff','#c1121f','AVÍS','ZONA EVACUADA\nNO ENTREU'],['#3a5a40','#dad7cd','TMB','Servei suspès']];
    ads.forEach(([bg,fg,t1,t2],k)=>{const x=(k%4)*W,y=Math.floor(k/4)*Hh;g.fillStyle=bg;g.fillRect(x,y,W,Hh);g.fillStyle=fg;g.textAlign='center';g.font='bold 44px Arial,sans-serif';g.fillText(t1,x+W/2,y+170);
      g.font='18px Arial,sans-serif';t2.split('\n').forEach((l,i)=>g.fillText(l,x+W/2,y+230+i*26));g.fillRect(x+40,y+300,W-80,6);
      for(let i=0;i<14;i++){g.fillStyle=`rgba(255,255,240,${R(0.05,0.2)})`;g.fillRect(x+R(0,W),y,R(4,30),Hh);}// descolorido
      if(k%3===1){g.fillStyle='#d8d2c0';g.beginPath();g.moveTo(x+W*R(0.3,0.7),y+Hh);g.lineTo(x+W,y+Hh*R(0.5,0.8));g.lineTo(x+W,y+Hh);g.fill();}// roto
      g.strokeStyle='rgba(30,30,30,.8)';g.lineWidth=4;g.strokeRect(x+2,y+2,W-4,Hh-4);});},{});
  const mupiMat=atlasMat(texMupi,texMupi,4,2,{});mupiMat.emissiveIntensity=0.15;
  defInst('mupi',PLANE.clone().scale(1.12,1.62,1),mupiMat,4,2,false);}
// poste de parada TMB: cabecera roja y cuadrados de color con las líneas
const texBus=cTex(256,512,(g)=>{g.fillStyle='#f4f4f2';g.fillRect(0,0,256,512);g.fillStyle='#d8202a';g.fillRect(0,0,256,120);g.fillStyle='#fff';g.font='bold 70px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('Bus',128,64);
  const L=[['H10','#0d4f9e'],['V13','#5a9b2c'],['D40','#7a2b82'],['7','#d8202a'],['22','#d8202a'],['24','#d8202a']];L.forEach(([t,c],i)=>{const x=22+(i%2)*110,y=140+Math.floor(i/2)*118;g.fillStyle=c;g.beginPath();g.roundRect(x,y,100,100,14);g.fill();g.fillStyle='#fff';g.font='bold '+(t.length>2?42:54)+'px Arial';g.fillText(t,x+50,y+54);});},{});
defInst('busPole',mkG([[cy(0.045,0.05,2.95,0,1.47,0,12),0x62686c],[bx(0.46,0.9,0.04,0,2.45,0),0xd8202a]]),paintMat,1,1,false);
defInst('busPlate',(()=>{const a=new THREE.PlaneGeometry(0.42,0.84);a.translate(0,2.45,0.025);const b=new THREE.PlaneGeometry(0.42,0.84);b.rotateY(Math.PI);b.translate(0,2.45,-0.025);return mergeGeometries([a,b]);})(),new THREE.MeshLambertMaterial({map:texBus}),1,1,false);
// semáforos de Barcelona: cabezas con carcasa amarilla y frontal negro, montadas a un lado del poste con abrazaderas;
// en los cruces, báculo curvo que vuela sobre la calzada con otra cabeza colgada. Peatonal más bajo, de lado.
{const YE=0xd9a400,PO=0x7f8488,BK=0x101112;
  const head=(x,y,z)=>{const p=[[bx(0.3,0.86,0.2,x,y,z),YE],[bx(0.32,0.88,0.015,x,y,z+0.105),BK]];
    [[0.28,0x6a1410],[0,0x6a5208],[-0.28,0x0b4f26]].forEach(([dy,c])=>{p.push([cy(0.1,0.1,0.02,x,y+dy,z+0.118,16,Math.PI/2),c]);
      const v=new THREE.CylinderGeometry(0.125,0.125,0.16,12,1,true,Math.PI/2+0.3,Math.PI-0.6);v.rotateX(Math.PI/2);v.translate(x,y+dy,z+0.19);p.push([v,BK]);});return p;};
  const ped=(x,y,z,ry)=>{const p=[[bx(0.24,0.5,0.18,0,0,0),YE],[bx(0.26,0.52,0.012,0,0,0.095),BK],[bx(0.15,0.15,0.01,0,0.12,0.103),0x5a1010],[bx(0.15,0.15,0.01,0,-0.12,0.103),0x0b4a24]];
    return p.map(([g,c])=>{g.rotateY(ry);g.translate(x,y,z);return[g,c];});};
  const pole=h=>[[lathe([[0.1,0],[0.09,0.05],[0.072,0.12],[0.06,0.9],[0.054,h],[0.001,h+0.02]],14),PO]];
  // simple (calles de un carril o salida): cabeza al lado del poste y peatonal de lado
  {const p=pole(3.3);p.push(...head(0.24,2.75,0.02),[bx(0.2,0.05,0.06,0.12,3.05,0),PO],[bx(0.2,0.05,0.06,0.12,2.45,0),PO],...ped(-0.17,2.0,0,-Math.PI/2),[bx(0.1,0.05,0.06,-0.06,2.0,0),PO]);defInst('semafor',mkG(p),paintMat,1,1,false);}
  // báculo: brazo curvo de 3,6 m sobre la calzada (dos versiones, hacia la izquierda o la derecha del poste)
  for(const sg of [1,-1]){const p=pole(5.0);const pts=[];for(let k=0;k<=8;k++){const a=k/8*Math.PI/2;pts.push([sg*(1-Math.cos(a))*0.9,4.6+Math.sin(a)*0.55]);}
    for(let k=0;k<8;k++)p.push([tube([pts[k][0],pts[k][1],0],[pts[k+1][0],pts[k+1][1],0],0.05,8),PO]);p.push([tube([sg*0.9,5.15,0],[sg*4.6,5.55,0],0.042,8),PO],[cy(0.06,0.06,0.12,sg*2.4,5.31,0,8,0,Math.PI/2-0.1*sg),0x2a2c2e]);
    p.push([tube([sg*4.5,5.54,0],[sg*4.5,5.4,0],0.02,6),PO],...head(sg*4.5,4.95,0.0));
    p.push(...head(sg*0.24,2.75,0.02),[bx(0.2,0.05,0.06,sg*0.12,3.05,0),PO],[bx(0.2,0.05,0.06,sg*0.12,2.45,0),PO],...ped(-sg*0.17,2.0,0,-sg*Math.PI/2),[bx(0.1,0.05,0.06,-sg*0.06,2.0,0),PO]);
    defInst(sg>0?'semaforBR':'semaforBL',mkG(p),paintMat,1,1,false);}}
// placa de dirección de calle (en el poste del semáforo): banda azul con el nombre y flecha con la numeración
const VSTR_N=['C. Villarroel','C. Casanova','C. Muntaner','C. Aribau','C. Enric Granados','C. Balmes','Rbla. Catalunya'],HSTR_N=['C. Provença','C. Mallorca','C. València','C. Aragó','C. Consell de Cent'];
const texStPlate=cTex(1024,512,(g)=>{const W=256,Hh=64;let k=0;for(const s of [...VSTR_N,...HSTR_N])for(const dir of [1,-1]){const x=(k%4)*W,y=Math.floor(k/4)*Hh;k++;
  g.fillStyle='#f4f4f2';g.fillRect(x+2,y+2,W-4,Hh-4);g.fillStyle='#1b3d7a';g.fillRect(x+2,y+2,W-4,Hh*0.5);g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';
  let fs=22;g.font=`bold ${fs}px Arial,sans-serif`;while(g.measureText(s).width>W-20&&fs>11){fs--;g.font=`bold ${fs}px Arial,sans-serif`;}g.fillText(s,x+W/2,y+Hh*0.27);
  g.fillStyle='#1b1b1b';g.font='bold 15px Arial,sans-serif';const n=10+(k*37)%180;g.fillText(`${n}/${n+6}`,x+W*0.42,y+Hh*0.76);
  g.beginPath();const ax=x+W*0.72,ay=y+Hh*0.76;g.moveTo(ax-24*dir,ay-3);g.lineTo(ax+8*dir,ay-3);g.lineTo(ax+8*dir,ay-9);g.lineTo(ax+22*dir,ay);g.lineTo(ax+8*dir,ay+9);g.lineTo(ax+8*dir,ay+3);g.lineTo(ax-24*dir,ay+3);g.closePath();g.fill();}},{});
texStPlate.wrapS=texStPlate.wrapT=THREE.ClampToEdgeWrapping;
defInst('stPlate',(()=>{const a=new THREE.PlaneGeometry(0.62,0.155);a.translate(0,0,0.075);const b=new THREE.BoxGeometry(0.64,0.17,0.02);b.translate(0,0,0.062);b.deleteAttribute('uv');b.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(b.attributes.position.count*2).fill(0.999),2));
  return mergeGeometries([a,b.toNonIndexed().index?b:b.toNonIndexed()].map(g=>g.index?g.toNonIndexed():g));})(),atlasMat(texStPlate,null,4,8),4,8,false);
// moto aparcada: scooter tipo «SH» (lo que más hay en Barcelona); las piezas blancas toman el color de cada moto
const MOTOCOL=[0xf2f2f0,0xf2f2f0,0x1a1a1c,0x1a1a1c,0x8e9296,0xb01818,0x22325a,0x6a6e72];
// perfiles laterales extruidos con bisel (z hacia delante, y arriba): carrocería redondeada de verdad, no cajas
function xS(pts,w,bev,x=0){const g=extrudeX(shapeFrom(pts),w,bev);g.translate(x,0,0);return g;}
function wheelParts(p,z,r,tw,BK,RIM,disc){p.push([tor(r,tw,0,r+tw,z,Math.PI/2,20),BK],[cy(r-0.02,r-0.02,0.07,0,r+tw,z,16,0,Math.PI/2),RIM],[cy(0.05,0.05,0.16,0,r+tw,z,8,0,Math.PI/2),0x8a8e92]);
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2;p.push([bx(0.035,r*0.9,0.075,0,r+tw+Math.cos(a)*r*0.45,z+Math.sin(a)*r*0.45,a),RIM]);}
  if(disc)p.push([cy(0.11,0.11,0.006,0.075,r+tw,z,16,0,Math.PI/2),0xb8bcc0]);}
function scooterParts(top){const W=0xffffff,BK=0x161616,GR=0x2c2c2e,CH=0xa8acb0,RIM=0x3a3c3e;const p=[];
  wheelParts(p,0.68,0.235,0.072,BK,RIM,true);wheelParts(p,-0.66,0.235,0.072,BK,RIM,false);
  // escudo delantero y frontal
  p.push([xS([[0.3,0.4],[0.52,0.44],[0.64,0.62,0.68,0.8],[0.66,0.97],[0.6,1.02],[0.5,1.0],[0.44,0.86,0.36,0.62],[0.3,0.5]],0.38,0.035),W]);
  p.push([xS([[0.34,0.42],[0.44,0.82],[0.46,0.92],[0.42,0.93],[0.3,0.52]],0.3,0.02,0),GR]);// contraescudo interior
  // plataforma (piso plano del SH) y faldón
  p.push([xS([[-0.2,0.34],[0.36,0.34],[0.38,0.43],[-0.2,0.43]],0.36,0.02),GR],[xS([[-0.2,0.24],[0.34,0.26],[0.36,0.36],[-0.2,0.36]],0.3,0.03),W]);
  // carenado trasero
  p.push([xS([[-0.22,0.36],[-0.08,0.42],[0.02,0.58,0.06,0.76],[-0.2,0.8],[-0.7,0.84],[-0.92,0.83],[-0.98,0.78],[-0.9,0.64],[-0.62,0.48],[-0.36,0.38]],0.33,0.04),W]);
  for(const sx of [-1,1])p.push([xS([[-0.86,0.66],[-0.3,0.47],[-0.28,0.49],[-0.84,0.69]],0.01,0,sx*0.168),0xb8bcc0]);
  // sillín biplaza
  p.push([xS([[0.06,0.77],[0.02,0.84,-0.08,0.87],[-0.34,0.885],[-0.42,0.9],[-0.66,0.915],[-0.8,0.9],[-0.84,0.86],[-0.78,0.83],[0.04,0.76]],0.3,0.035),0x2a2420]);
  // horquilla, guardabarros y amortiguador trasero
  for(const sx of [-1,1])p.push([tube([sx*0.075,0.31,0.68],[sx*0.06,0.86,0.56],0.022,8),CH]);
  p.push([xS([[0.48,0.47],[0.62,0.6,0.78,0.6],[0.92,0.5],[0.9,0.47],[0.77,0.565,0.62,0.565],[0.5,0.44]],0.15,0.012),W]);
  p.push([tube([-0.12,0.32,-0.66],[-0.13,0.66,-0.48],0.028,8),0xb02020],[tube([-0.12,0.32,-0.66],[-0.12,0.42,-0.2],0.05,8),0x5a5c5e]);// muelle rojo y basculante/motor
  p.push([xS([[-0.18,0.24],[0.0,0.26],[0.04,0.42],[-0.3,0.45],[-0.62,0.4],[-0.66,0.28],[-0.5,0.2]],0.12,0.02,-0.1),0x4a4c4e]);// cárter del motor
  p.push([cy(0.055,0.06,0.42,0.16,0.4,-0.62,10,Math.PI/2-0.12),0x3a3a3a],[cy(0.062,0.062,0.08,0.16,0.42,-0.82,10,Math.PI/2-0.12),CH]);// escape
  // cubremanillar con faro, manillar, puños, maneta y retrovisores
  p.push([xS([[0.42,1.0],[0.5,1.08],[0.64,1.1],[0.72,1.04],[0.7,0.98],[0.58,0.96],[0.44,0.96]],0.5,0.03),W]);
  p.push([xS([[0.66,1.0],[0.72,1.03],[0.735,1.0],[0.7,0.975]],0.24,0.01),0xe6edf2]);// faro
  p.push([tube([-0.38,1.05,0.46],[0.38,1.05,0.46],0.017,8),BK]);for(const sx of [-1,1]){p.push([tube([sx*0.3,1.05,0.46],[sx*0.42,1.05,0.46],0.023,8),BK],[tube([sx*0.2,1.07,0.5],[sx*0.36,1.06,0.53],0.008,4),0x8a8e92]);
    p.push([tube([sx*0.2,1.08,0.5],[sx*0.27,1.22,0.47],0.008,4),BK],[ell(0.075,0.05,0.02,sx*0.29,1.25,0.47,10),BK],[ell(0.065,0.042,0.004,sx*0.29,1.25,0.458,10),0xc8d0d6]);}
  // intermitentes, piloto, matrícula y caballete
  for(const sx of [-1,1])p.push([ell(0.03,0.02,0.035,sx*0.2,1.0,0.64,6),0xe89a20],[ell(0.025,0.018,0.03,sx*0.12,0.76,-0.97,6),0xe89a20]);
  p.push([xS([[-0.92,0.74],[-0.99,0.77],[-1.0,0.72],[-0.93,0.7]],0.22,0.008),0xb81010],[bx(0.2,0.14,0.01,0,0.58,-0.97,0.25),0xf2f2ee],[bx(0.22,0.02,0.04,0,0.66,-0.95),BK]);
  p.push([tube([-0.1,0.3,-0.05],[-0.2,0.02,-0.14],0.012,4),BK]);
  if(top){p.push([xS([[-0.68,0.93],[-0.62,1.12,-0.72,1.24],[-1.0,1.25],[-1.08,1.12],[-1.04,0.93]],0.4,0.05),BK],[bx(0.25,0.03,0.012,0,1.08,-1.08),0xb81010],[bx(0.3,0.03,0.42,0,0.92,-0.86),GR]);}
  return p;}
const motoMat=pbr(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.42,metalness:0.12}));// plástico pintado brillante
defInst('moto',mkG(scooterParts(false)),motoMat,1,1,false);defInst('motoT',mkG(scooterParts(true)),motoMat,1,1,false);
// casco tirado y trozos de carenado (junto a las motos caídas)
defInst('casco',mkG([[ell(0.14,0.13,0.16,0,0.13,0,12),0xffffff],[ell(0.12,0.06,0.02,0,0.14,0.15,10),0x1a1e22],[bx(0.2,0.02,0.05,0,0.03,0.08),0x141414]]),motoMat,1,1,false);
defInst('carenado',mkG([[xS([[0,0],[0.25,0.02],[0.32,0.1],[0.1,0.14]],0.12,0.01),0xffffff],[xS([[0.4,0],[0.55,0.03],[0.5,0.08]],0.08,0.006,0.25),0xffffff],[xS([[0.1,0],[0.2,0.01],[0.18,0.05]],0.04,0.004,-0.2),0xb81010]]),motoMat,1,1,false);
// moto naked (tipo MT-07) y maxiscooter (tipo TMAX), las otras motos que más se ven en Barcelona
{const W=0xffffff,BK=0x141414,CH=0xa8acb0,EN=0x3a3a3c,RIM=0x2a2a2c;const p=[];
  wheelParts(p,0.72,0.24,0.075,BK,RIM,true);wheelParts(p,-0.7,0.24,0.085,BK,RIM,true);
  p.push([xS([[0.02,0.86],[0.12,0.98],[0.38,0.99],[0.48,0.9],[0.44,0.8],[0.08,0.78]],0.34,0.05),W]);// depósito
  for(const sx of [-1,1])p.push([xS([[0.3,0.82],[0.46,0.88],[0.5,0.74],[0.36,0.66]],0.02,0.008,sx*0.16),W]);// tapas laterales del depósito
  p.push([xS([[0.02,0.86],[-0.1,0.88],[-0.42,0.89],[-0.48,0.86],[-0.4,0.82],[0.04,0.8]],0.26,0.04),0x1c1a18]);// asiento
  p.push([xS([[-0.42,0.84],[-0.6,0.9],[-0.86,0.96],[-0.88,0.92],[-0.62,0.84],[-0.46,0.78]],0.16,0.02),W]);// colín
  p.push([xS([[-0.08,0.32],[0.32,0.34],[0.38,0.62],[0.3,0.76],[0.0,0.76],[-0.16,0.6]],0.3,0.03),EN]);// motor
  for(let k=0;k<2;k++)p.push([cy(0.04,0.04,0.22,-0.04+k*0.09,0.7,0.32,8),0x6a6c6e]);// cilindros
  for(const sx of [-1,1])p.push([tube([sx*0.12,0.86,0.42],[sx*0.12,0.42,-0.1],0.016,6),0x8a1a1a],[tube([sx*0.12,0.86,0.42],[sx*0.1,0.8,-0.3],0.016,6),0x8a1a1a],[tube([sx*0.08,0.36,0.72],[sx*0.07,0.92,0.52],0.026,8),0xc8a040]);// chasis tubular y horquilla dorada
  p.push([tube([0,0.34,-0.7],[0.1,0.45,-0.1],0.03,6),CH],[tube([0.12,0.3,0.2],[0.16,0.28,-0.3],0.035,8),0x4a4a4a],[cy(0.06,0.07,0.3,0.16,0.3,-0.42,10,Math.PI/2),0x2a2a2a]);// basculante y escape
  p.push([xS([[0.5,0.92],[0.6,0.98],[0.66,0.92],[0.62,0.84],[0.52,0.84]],0.2,0.02),BK],[xS([[0.6,0.91],[0.665,0.93],[0.67,0.88],[0.63,0.86]],0.14,0.008),0xe6edf2]);// faro
  p.push([tube([-0.36,1.04,0.44],[0.36,1.04,0.44],0.014,6),BK]);for(const sx of [-1,1])p.push([tube([sx*0.28,1.04,0.44],[sx*0.38,1.04,0.44],0.022,8),BK],[tube([sx*0.22,1.05,0.44],[sx*0.26,1.22,0.42],0.008,4),BK],[ell(0.06,0.04,0.015,sx*0.27,1.25,0.42,8),BK]);
  p.push([xS([[0.56,0.58],[0.72,0.64],[0.88,0.58],[0.86,0.55],[0.72,0.6],[0.58,0.55]],0.13,0.01),W],[bx(0.18,0.13,0.01,0,0.72,-0.9,0.3),0xf2f2ee],[xS([[-0.86,0.93],[-0.9,0.95],[-0.91,0.91],[-0.87,0.9]],0.14,0.006),0xb81010]);
  defInst('motoN',mkG(p),motoMat,1,1,false);}
{const W=0xffffff,BK=0x141414,GR=0x2a2a2c,CH=0xa8acb0,RIM=0x2c2c2e;const p=[];
  wheelParts(p,0.76,0.22,0.075,BK,RIM,true);wheelParts(p,-0.72,0.22,0.08,BK,RIM,false);
  p.push([xS([[0.22,0.42],[0.56,0.44],[0.74,0.6,0.8,0.86],[0.76,1.02],[0.62,1.1],[0.42,1.08],[0.4,0.86],[0.34,0.6]],0.6,0.05),W]);// carenado frontal ancho
  p.push([xS([[0.62,1.08],[0.72,1.22],[0.66,1.36],[0.6,1.34],[0.56,1.12]],0.42,0.01),0x5a6a74]);// cúpula ahumada
  for(const sx of [-1,1])p.push([xS([[0.74,0.88],[0.8,0.92],[0.81,0.86],[0.76,0.84]],0.12,0.008,sx*0.15),0xe6edf2]);// doble faro
  p.push([xS([[-0.3,0.4],[0.36,0.42],[0.38,0.5],[-0.3,0.5]],0.44,0.02),GR],[xS([[-0.2,0.48],[0.3,0.5],[0.34,0.72],[0.1,0.76],[-0.2,0.7]],0.2,0.04),W]);// piso y túnel central
  p.push([xS([[-0.24,0.42],[-0.1,0.5],[-0.04,0.8],[-0.4,0.86],[-0.86,0.9],[-1.06,0.86],[-1.02,0.7],[-0.7,0.52],[-0.4,0.42]],0.42,0.05),W]);// cola
  p.push([xS([[-0.04,0.79],[-0.12,0.87],[-0.36,0.88],[-0.46,0.94],[-0.78,0.97],[-0.88,0.94],[-0.82,0.89],[-0.04,0.77]],0.36,0.04),0x1c1a18]);// asiento escalonado
  p.push([tube([0.08,0.3,-0.72],[0.1,0.44,-0.1],0.05,8),0x4a4c4e],[cy(0.05,0.06,0.46,0.2,0.38,-0.64,10,Math.PI/2-0.15),0x3a3a3a]);
  for(const sx of [-1,1])p.push([tube([sx*0.08,0.3,0.76],[sx*0.07,0.92,0.58],0.024,8),CH],[tube([sx*0.24,1.06,0.46],[sx*0.38,1.06,0.46],0.022,8),BK],[tube([sx*0.28,1.0,0.6],[sx*0.36,1.14,0.58],0.008,4),BK],[ell(0.07,0.045,0.016,sx*0.37,1.16,0.58,8),BK]);
  p.push([tube([-0.26,1.06,0.46],[0.26,1.06,0.46],0.016,6),BK],[xS([[0.5,0.48],[0.66,0.58,0.82,0.58],[0.96,0.5],[0.94,0.47],[0.8,0.55,0.66,0.55],[0.52,0.45]],0.14,0.01),W]);
  p.push([bx(0.2,0.14,0.01,0,0.62,-1.04,0.25),0xf2f2ee],[xS([[-1.0,0.82],[-1.07,0.85],[-1.08,0.8],[-1.02,0.78]],0.3,0.008),0xb81010]);
  defInst('motoX',mkG(p),motoMat,1,1,false);}
// basura de calle abandonada: cajas de cartón, bolsas, ropa, ramas, tronco caído, contenedor quemado y volcado, colchón, maleta
{const C=0xa8845a,T=0xc8b58a;defInst('caja2',mkG([[bx(0.55,0.4,0.42,0,0.2,0),C],[bx(0.56,0.05,0.12,0,0.4,0),T],[bx(0.5,0.3,0.36,0.05,0.55,0.03,0,0.3,0.1),0x9a7a50]]),plasticMat,1,1,false);
 defInst('cajaPlana',mkG([[bx(0.9,0.04,0.65,0,0.02,0),C],[bx(0.6,0.04,0.5,0.1,0.06,0.05,0,0.4),0xb8946a]]),plasticMat,1,1,false);
 defInst('bolsas',mkG([[ell(0.28,0.24,0.26,0,0.22,0,8),0x161616],[ell(0.24,0.2,0.22,0.36,0.18,0.12,8),0x1d1d1f],[ell(0.2,0.18,0.2,-0.2,0.16,0.3,8),0x22303a],[ell(0.18,0.2,0.18,0.12,0.45,0.05,8),0x141414]]),plasticMat,1,1,false);
 defInst('ropa',mkG([[bx(0.55,0.02,0.7,0,0.012,0,0,0.3),0xffffff],[bx(0.25,0.02,0.45,0.35,0.02,0.1,0,-0.6),0xffffff],[bx(0.3,0.06,0.12,-0.35,0.03,-0.3,0,0.8),0x222222]]),photoMat('fabric',{roughness:0.95,ns:0.6}),1,1,false);
 defInst('maleta',mkG([[bx(0.45,0.65,0.24,0,0.12,0,Math.PI/2),0x2a3a5a],[bx(0.18,0.03,0.03,0,0.25,0.36),0x111111]]),plasticMat,1,1,false);
 defInst('colchon',mkG([[bx(1.4,0.18,1.95,0,0.09,0),0xd8d0c0],[bx(1.42,0.02,1.97,0,0.18,0),0xc0b8a8]]),photoMat('fabric',{roughness:0.95,ns:0.6}),1,1,false);
 const bark=photoMat('bark_platanus',{ns:1.0});const br=[];const lim=(a,b,r)=>br.push([tube(a,b,r,6),0x8a7a66]);
 lim([0,0.08,0],[1.4,0.18,0.2],0.045);lim([0.6,0.12,0.08],[1.0,0.45,-0.4],0.02);lim([1.0,0.16,0.15],[1.5,0.3,0.6],0.018);lim([0.3,0.1,0.03],[0.4,0.35,0.5],0.015);defInst('rama',mkG(br),bark,1,1,false);
 const tr=[];tr.push([cy(0.24,0.3,7.5,0,0.27,0,10,0,Math.PI/2),0x9a8a76]);tr[0][0].translate(3.6,0,0);
 for(const [x,a,l] of [[5.2,0.6,2.2],[6.3,-0.7,1.8],[4.4,-0.4,1.6],[6.9,0.3,1.5]]){const g=tube([x,0.35,0],[x+Math.cos(a)*l*0.6,0.35+l*0.55,Math.sin(a)*l],0.07,6);tr.push([g,0x9a8a76]);}
 defInst('tronco',mkG(tr),bark,1,1,false);
 const BUR=0x1a1816,AS=0x3a3530;for(const [k,lid] of [['contQuemado',0x0e0d0c]]){const dome=[];for(let i=0;i<=10;i++){const a=i/10*Math.PI;dome.push([Math.cos(a)*0.69,1.14+Math.pow(Math.sin(a),0.75)*0.32]);}dome.push([-0.69,1.08],[0.69,1.08]);
   defInst(k,mkG([[prof([[-0.5,0.13],[0.5,0.13],[0.6,0.5],[0.66,1.0],[-0.62,1.05],[-0.6,0.5]],1.82),BUR],[prof(dome,1.5),lid],[bx(1.7,0.13,0.9,0,0.065,0),AS],[bx(1.5,0.2,0.4,0.2,1.0,0.3,0.4,0,0.1),0x2a2420]]),plasticMat,1,1,false);}}
// parquímetro (àrea verda)
defInst('parquimetre',mkG([[bx(0.32,1.35,0.22,0,0.67,0),0x5d6266],[bx(0.33,0.12,0.23,0,1.2,0),0x2f9a48],[bx(0.2,0.14,0.02,0,1.0,0.12),0x111111]]),metalMat,1,1,false);
// armario eléctrico
defInst('armari',mkG([[bx(0.9,1.25,0.38,0,0.62,0),0x9a9a8e],[bx(0.92,0.06,0.42,0,1.27,0),0x7a7a70]]),plasticMat,1,1,false);
// quiosco de prensa (verde)
defInst('kiosk',mkG([[bx(3,2.5,2,0,1.25,0),0x2f4f3a],[bx(3.4,0.12,2.4,0,2.56,0),0x23392b],[bx(2.7,1.4,0.04,0,1.5,1.02),0x6e7a72]]),paintMat,1,1,false);
// fuente de Barcelona (fundición verde oscuro, torneada)
defInst('font',mkG([[lathe([[0.2,0],[0.2,0.06],[0.15,0.1],[0.13,0.16],[0.105,0.22],[0.095,0.9],[0.12,0.96],[0.125,1.02],[0.1,1.08],[0.11,1.14],[0.15,1.2],[0.15,1.26],[0.09,1.34],[0.05,1.4],[0.06,1.46],[0.03,1.52],[0.001,1.54]],16),0x24352b],
  [tube([0,1.0,0.1],[0,1.0,0.24],0.016,8),0xb09a4a],[tube([0,1.0,0.24],[0,0.94,0.26],0.016,8),0xb09a4a],[sp(0.028,0,1.06,0.1,8),0xb09a4a],
  [lathe([[0.001,0.02],[0.24,0.02],[0.3,0.1],[0.32,0.2],[0.3,0.21],[0.26,0.12],[0.001,0.1]],16,0,0,0.3),0x24352b]]),paintMat,1,1,false);
// jardinera Barcelona: cuenco negro de fundición sobre tres pies, con tierra y arbusto
defInst('jardinera',mkG([[lathe([[0.001,0.16],[0.3,0.17],[0.52,0.3],[0.66,0.5],[0.72,0.62],[0.8,0.63],[0.8,0.67],[0.68,0.67],[0.6,0.52],[0.001,0.5]],22),0x1c1d1e],[cy(0.62,0.62,0.02,0,0.6,0,18),0x3a2e22],
  ...[0,1,2].map(k=>[bx(0.14,0.2,0.2,Math.cos(k*2.094)*0.3,0.1,Math.sin(k*2.094)*0.3,0,-k*2.094),0x1c1d1e]),
  [ell(0.42,0.3,0.4,-0.1,0.85,0.05,9),0x3f5a2c],[ell(0.3,0.26,0.32,0.26,0.82,-0.12,8),0x4b6a31],[ell(0.24,0.2,0.26,0.02,1.02,0.16,8),0x36502a]]),plasticMat,1,1,false);
// mesa y sillas de terraza (aluminio)
defInst('terrassa',mkG([[cy(0.35,0.35,0.03,0,0.73,0,10),0xb9bec2],[cy(0.025,0.025,0.72,0,0.36,0,5),0x9aa0a4],[cy(0.2,0.2,0.02,0,0.01,0,8),0x9aa0a4],
  ...[0,1,2].flatMap(i=>{const a=i*2.1,x=Math.cos(a)*0.62,z=Math.sin(a)*0.62;return[[bx(0.42,0.03,0.42,x,0.45,z,0,-a),0xb9bec2],[bx(0.42,0.4,0.03,x+Math.cos(a)*0.2,0.65,z+Math.sin(a)*0.2,0,-a+Math.PI/2),0xb9bec2],[cy(0.015,0.015,0.45,x,0.22,z,5),0x9aa0a4]];})]),metalMat,1,1,false);
// barrera de hormigón (new jersey) y valla militar (límite del mapa)
defInst('jersey',mkG([[bx(2.0,0.25,0.6,0,0.12,0),0xb4b0a6],[bx(2.0,0.6,0.25,0,0.55,0),0xb4b0a6],[bx(2.0,0.1,0.18,0,0.9,0),0xc8c4ba]]),plasticMat,1,1,false);
const texFence=cTex(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#8a8f92';g.lineWidth=2;for(let i=-w;i<w*2;i+=12){line(g,i,0,i+h,h);line(g,i,h,i+h,0);}g.lineWidth=6;g.strokeRect(2,2,w-4,h-4);},{});
defInst('valla',(()=>{const g=new THREE.PlaneGeometry(3.4,2.0);g.translate(0,1.15,0);return g;})(),new THREE.MeshLambertMaterial({map:texFence,alphaTest:0.4,side:THREE.DoubleSide}),1,1,false);
defInst('vallaBase',mkG([[bx(0.6,0.15,0.35,-1.7,0.07,0),0x9a968c],[bx(0.6,0.15,0.35,1.7,0.07,0),0x9a968c],[cy(0.02,0.02,2.1,-1.7,1.1,0,5),0x8a8f92],[cy(0.02,0.02,2.1,1.7,1.1,0,5),0x8a8f92]]),metalMat,1,1,false);
// palé y sacos (barricadas)
defInst('pale',mkG([[bx(1.2,0.03,0.12,0,0.13,-0.5),0xb08a5a],[bx(1.2,0.03,0.12,0,0.13,0),0xb08a5a],[bx(1.2,0.03,0.12,0,0.13,0.5),0xb08a5a],[bx(0.1,0.1,1.1,-0.55,0.06,0),0x8a6a40],[bx(0.1,0.1,1.1,0,0.06,0),0x8a6a40],[bx(0.1,0.1,1.1,0.55,0.06,0),0x8a6a40]]),woodPropMat,1,1,false);
defInst('sacos',mkG([[bx(1.4,0.3,0.5,0,0.15,0),0x9a8a62],[bx(1.3,0.28,0.48,0.1,0.44,0,0,0.1),0x8e7e58],[bx(1.2,0.26,0.46,-0.05,0.71,0,0,-0.08),0xa2926a]]),plasticMat,1,1,false);
defInst('tablon',mkG([[bx(1,0.18,0.03,0,0,0),0xb89a72]]),woodPropMat,1,1,false);
// cajas de cartón / productos caídos
defInst('caja',mkG([[bx(0.5,0.38,0.4,0,0.19,0),0xb08a5a]]),plasticMat,1,1,false);
// carrito de la compra
{const M=0xb8bcc0;const p=[[bx(0.55,0.03,0.85,0,0.55,0),M],[bx(0.03,0.45,0.85,-0.28,0.78,0),M],[bx(0.03,0.45,0.85,0.28,0.78,0),M],[bx(0.55,0.45,0.03,0,0.78,0.42),M],[bx(0.55,0.45,0.03,0,0.78,-0.42),M],[bx(0.6,0.04,0.04,0,1.05,-0.5),0xd8202a],
  ...[[-0.24,0.36],[0.24,0.36],[-0.22,-0.38],[0.22,-0.38]].flatMap(([x,z])=>[[cy(0.012,0.012,0.5,x,0.3,z,5),M],[cy(0.05,0.05,0.04,x,0.05,z,8,0,Math.PI/2),0x222222]])];
  defInst('carro',mkG(p),metalMat,1,1,false);}
// cristales rotos en el suelo
const texShards=cTex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<70;i++){g.fillStyle=`rgba(${200+R(0,40)|0},${220+R(0,30)|0},235,${R(0.35,0.75)})`;g.beginPath();const x=R(10,w-10),y=R(10,h-10),s=R(3,16);g.moveTo(x,y);g.lineTo(x+R(-s,s),y+R(-s,s));g.lineTo(x+R(-s,s),y+R(-s,s));g.fill();}},{});
defInst('shards',(()=>{const g=new THREE.PlaneGeometry(1.6,1.2);g.rotateX(-Math.PI/2);g.translate(0,0.012,0);return g;})(),new THREE.MeshLambertMaterial({map:texShards,transparent:true,depthWrite:false}),1,1,false);
// grafitis (fotos CC0, atlas 4x4 con alfa)
const texGraff=ltex('graffiti.png',true,false);
const graffMat=atlasMat(texGraff,null,4,4,{transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
defInst('graffiti',PLANE,graffMat,4,4,true);
// basura / bolsas
defInst('bolsa',mkG([[sp(0.25,0,0.22,0,7),0x1a1a1a],[sp(0.2,0.3,0.18,0.1,7),0x2a2a2a]]),plasticMat,1,1,false);

// =====================================================================
// PLÁTANOS DE SOMBRA (Platanus x hispanica): tronco con corteza real y copa de tarjetas de hojas fotográficas + viento
// =====================================================================
const windU={value:0};
function leafMat(map,extra={}){const m=new THREE.MeshLambertMaterial(Object.assign({map,alphaTest:0.45,side:THREE.DoubleSide,vertexColors:true},extra));
  m.onBeforeCompile=sh=>{sh.uniforms.uTime=windU;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;')
    .replace('#include <begin_vertex>',`#include <begin_vertex>
      float hg=max(0.0,position.y-3.0);
      #ifdef USE_INSTANCING
      vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);
      #else
      vec3 ip=vec3(0.0);
      #endif
      float ph=uTime*1.6+ip.x*0.13+ip.z*0.17;
      transformed.x+=sin(ph+position.y*0.7+position.z)*0.03*hg;transformed.z+=cos(ph*1.27+position.x*0.6)*0.025*hg;transformed.y+=sin(ph*2.3+position.x*2.0)*0.012*hg;`);};return m;}
function cardGeo(w,h,cx,cyy,cz,yaw,tilt,center){const g=new THREE.PlaneGeometry(w,h);g.rotateX(tilt);g.rotateY(yaw);g.translate(cx,cyy,cz);
  const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){_v.set(p.getX(i)-center[0],p.getY(i)-center[1],p.getZ(i)-center[2]).normalize();_v.y=Math.abs(_v.y)*0.6+0.4;_v.normalize();n.setXYZ(i,_v.x,_v.y,_v.z);}
  const c=[];const s=0.72+0.28*Math.random();for(let i=0;i<p.count;i++)c.push(s,s,s);g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));return g;}
// tronco curvado: serie de tramos que se van inclinando
function limb(p0,dir,len,r0,r1,segs,bend,texM){const parts=[];let p=p0.clone(),d=dir.clone().normalize();const step=len/segs;
  for(let i=0;i<segs;i++){const ra=r0+(r1-r0)*i/segs,rb=r0+(r1-r0)*(i+1)/segs;const q=p.clone().addScaledVector(d,step);
    const g=new THREE.CylinderGeometry(rb,ra,step*1.04,9,1,true);const uv=g.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*(2*Math.PI*ra)/texM,(uv.getY(k)*step+i*step)/texM);
    g.applyQuaternion(_q.setFromUnitVectors(UP,d));const m=p.clone().add(q).multiplyScalar(0.5);g.translate(m.x,m.y,m.z);parts.push(g);
    p=q;d.add(_v.set(R(-bend,bend),R(-bend*0.3,bend*0.2),R(-bend,bend))).normalize();}
  return{parts,end:p,dir:d};}
const TREEG={};
function buildTreeVariant(seed){const tm=TEXM.bark_platanus;const t=[];
  const trunk=limb(new V3(0,-0.1,0),new V3(R(-0.06,0.06),1,R(-0.06,0.06)),R(3.6,4.4),0.3,0.22,4,0.05,tm);t.push(...trunk.parts);
  const L=[];const C=[0,7.5,0];const nl=R(3,5)|0;
  for(let i=0;i<nl;i++){const a=i/nl*Math.PI*2+R(-0.3,0.3);const d=new V3(Math.cos(a)*0.75,1,Math.sin(a)*0.75);
    const lb=limb(trunk.end,d,R(3.2,4.4),0.16,0.07,3,0.18,tm);t.push(...lb.parts);
    for(let k=0;k<2;k++){const d2=lb.dir.clone().add(new V3(R(-0.6,0.6),R(0,0.3),R(-0.6,0.6)));const sb=limb(lb.end,d2,R(1.4,2.4),0.07,0.03,2,0.25,tm);t.push(...sb.parts);
      for(let n=0;n<4;n++){const e=sb.end;L.push(cardGeo(R(2.2,3.0),R(2.0,2.8),e.x+R(-1.2,1.2),e.y+R(-0.6,0.9),e.z+R(-1.2,1.2),R(0,6.28),R(-0.7,0.7),C));}}
    const e=lb.end;for(let n=0;n<4;n++)L.push(cardGeo(R(2.4,3.2),R(2.2,3.0),e.x+R(-1.5,1.5),e.y+R(-0.4,1.2),e.z+R(-1.5,1.5),R(0,6.28),-Math.PI/2+R(-0.5,0.5),C));}
  // relleno superior de la copa
  for(let n=0;n<22;n++){const a=Math.random()*6.28,r=Math.sqrt(Math.random())*3.2;L.push(cardGeo(R(2.6,3.4),R(2.6,3.4),Math.cos(a)*r,R(7.6,9.4),Math.sin(a)*r,R(0,6.28),-Math.PI/2+R(-0.4,0.4),C));}
  const trunkG=mergeGeometries(t.map(g=>{const q=g.index?g.toNonIndexed():g;const c=[];for(let i=0;i<q.attributes.position.count;i++)c.push(1,1,1);q.setAttribute('color',new THREE.Float32BufferAttribute(c,3));return q;}));
  return{trunk:trunkG,leaves:mergeGeometries(L.map(g=>g.toNonIndexed()))};}
const barkMat=photoMat('bark_platanus',{ns:1.2,roughness:0.95});
const leavesPlatanMat=leafMat(ltex('leaves_platan.png',true,false));
for(let v=0;v<3;v++){const g=buildTreeVariant(v);defInst('trunk'+v,g.trunk,barkMat);defInst('leaves'+v,g.leaves,leavesPlatanMat);}
const TREES=[];
function tree(x,z,s=1,y){y=y===undefined?surfY(x,z):y;const v=(Math.random()*3)|0;const yaw=R(0,6.28);const sc=s*R(1.35,1.7);
  addInst('trunk'+v,x,y,z,yaw,sc,sc,sc);addInst('leaves'+v,x,y,z,yaw,sc,sc*R(0.9,1.08),sc,0,0,0,new THREE.Color().setHSL(R(0.22,0.28),R(0.25,0.45),R(0.62,0.78)).getHex());
  addBoxV(x-0.28*sc,x+0.28*sc,z-0.28*sc,z+0.28*sc,y-1,y+4);addInst('alcorque',x,y,z,0);TREES.push({x,z,y});}

// =====================================================================
// EIXAMPLE: CALLES REALES, ACERAS DE PANOT, BORDILLOS DE GRANITO, PINTURA VIAL Y MOBILIARIO
// =====================================================================
// Calles verticales (a lo largo de z, de Llobregat a Besòs) y horizontales (paralelas al mar)
const VSTR=[{n:'C. de Villarroel',w:20,dir:1},{n:'C. de Casanova',w:20,dir:-1},{n:'C. de Muntaner',w:20,dir:1,bus:1},{n:"C. d'Aribau",w:20,dir:-1},{n:"C. d'Enric Granados",w:20,type:'ped'},{n:'C. de Balmes',w:20,dir:1,bus:1},{n:'Rambla de Catalunya',w:30,type:'rambla'}];
const HSTR=[{n:'C. de Provença',w:20,dir:1},{n:'C. de Mallorca',w:20,dir:-1,bus:1},{n:'C. de València',w:20,dir:1},{n:"C. d'Aragó",w:30,dir:-1,type:'wide',bus:1},{n:'C. del Consell de Cent',w:20,type:'superilla'}];
for(const s of VSTR){s.ax='v';s.sw=s.type==='rambla'?4.5:s.type==='ped'||s.type==='superilla'?0:5;}
for(const s of HSTR){s.ax='h';s.sw=s.type==='ped'||s.type==='superilla'?0:5;}
VSTR.forEach((s,i)=>s.pos=SX0+i*BP);HSTR.forEach((s,j)=>s.pos=SZ0+j*BP);
const DEFSTR={w:20,sw:5,dir:1,n:''};
const vs=i=>VSTR[i]||Object.assign({},DEFSTR,{ax:'v',pos:SX0+i*BP,outer:true});
const hs=j=>HSTR[j]||Object.assign({},DEFSTR,{ax:'h',pos:SZ0+j*BP,outer:true});
const CHAMF=14.14;// el xamfrà de Cerdà: corte de 20 m a 45°
const PAINTW=0xefefe8,PAINTY=0xe8b820;
// ---------- materiales de la ciudad ----------

MATS.asphalt=photoMat('asphalt',{ns:0.6,color:0x6a6a6a,roughness:0.95});MATS.asphaltc=photoMat('asphalt_cracked',{ns:0.6,color:0x707070});
MATS.panot4=photoMat('panot4',{ns:1.0,color:0xc8c8c8});MATS.panotflor=photoMat('panotflor',{ns:1.0,color:0xc8c8c8});MATS.panotbotons=photoMat('panotbotons',{ns:1.2});
MATS.granite=photoMat('granite',{ns:0.6,roughness:0.75});MATS.llambordes=photoMat('llambordes',{ns:1.0});
// pintura vial: blanca y limpia, con grano y algún desconchón (se ve el asfalto, no manchas negras)
// pintura vial gastada: zonas peladas por las rodadas, desconchones y grano (se ve el asfalto a través)
const texPaint=cTex(512,512,(g,w,h)=>{g.fillStyle='#ecebe4';g.fillRect(0,0,w,h);const d=g.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const n=(Math.random()-0.5)*30;d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n;}g.putImageData(d,0,0);
  g.globalCompositeOperation='destination-out';
  for(let i=0;i<26;i++){const x=R(0,w),y=R(0,h),r=R(10,46);const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(0,0,0,0.95)');gr.addColorStop(0.6,'rgba(0,0,0,0.55)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();}
  for(let i=0;i<5;i++){const x=R(0,w);g.fillStyle=`rgba(0,0,0,${R(0.25,0.55)})`;g.fillRect(x,0,R(18,40),h);}
  for(let i=0;i<900;i++){g.fillStyle=`rgba(0,0,0,${R(0.5,1)})`;g.beginPath();g.arc(R(0,w),R(0,h),R(0.6,3.2),0,7);g.fill();}
  g.globalCompositeOperation='source-over';},{});
MATS.paint=new THREE.MeshLambertMaterial({map:texPaint,vertexColors:true,alphaTest:0.3,alphaToCoverage:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-6});
// ---------- utilidades de polígonos ----------
function polyArea(P){let a=0;for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length];a+=p[0]*q[1]-q[0]*p[1];}return a/2;}
function centroid(P){let x=0,z=0;for(const p of P){x+=p[0];z+=p[1];}return[x/P.length,z/P.length];}
// desplaza cada lado de un polígono convexo hacia fuera una distancia propia
function offsetPoly(P,D){const c=centroid(P);const n=P.length;const L=[];
  for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n];let nx=b[1]-a[1],nz=-(b[0]-a[0]);const l=Math.hypot(nx,nz)||1;nx/=l;nz/=l;const mx=(a[0]+b[0])/2-c[0],mz=(a[1]+b[1])/2-c[1];if(nx*mx+nz*mz<0){nx=-nx;nz=-nz;}
    const d=typeof D==='number'?D:D[i];L.push([a[0]+nx*d,a[1]+nz*d,b[0]-a[0],b[1]-a[1]]);}
  const out=[];for(let i=0;i<n;i++){const A=L[(i+n-1)%n],B=L[i];const den=A[2]*B[3]-A[3]*B[2];if(Math.abs(den)<1e-9){out.push([B[0],B[1]]);continue;}
    const t=((B[0]-A[0])*B[3]-(B[1]-A[1])*B[2])/den;out.push([A[0]+A[2]*t,A[1]+A[3]*t]);}return out;}
// rectángulo con xamfrans: 8 vértices empezando por el lado norte (z0) de oeste a este
function chamfRect(x0,x1,z0,z1,c){return[[x0+c,z0],[x1-c,z0],[x1,z0+c],[x1,z1-c],[x1-c,z1],[x0+c,z1],[x0,z1-c],[x0,z0+c]];}
// cuadrilátero horizontal en un buffer (y por vértice)
function quadH(b,a,bq,c,d,y,us){const Y=typeof y==='function'?y:()=>y;for(const q of [a,bq,c,a,c,d])pushV(b,q[0],Y(q[0],q[1]),q[1],0,1,0,q[0]*us,q[1]*us);}
function quadHUp(b,a,bq,c,d,y,us){// garantiza normal hacia arriba
  const cr=(bq[0]-a[0])*(c[1]-a[1])-(bq[1]-a[1])*(c[0]-a[0]);if(cr>0)quadH(b,a,d,c,bq,y,us);else quadH(b,a,bq,c,d,y,us);}
// pintura vial: rectángulo orientado (centro, eje u, largo, ancho)
function paintRect(cx,cz,ux,uz,len,wid,col,y){const b=bufOf(cx,cz,'paint');TINT=hexTint(col);const vx=-uz,vz=ux;const hl=len/2,hw=wid/2;
  const A=[cx-ux*hl-vx*hw,cz-uz*hl-vz*hw],B=[cx+ux*hl-vx*hw,cz+uz*hl-vz*hw],C=[cx+ux*hl+vx*hw,cz+uz*hl+vz*hw],D=[cx-ux*hl+vx*hw,cz-uz*hl+vz*hw];
  const Y=(x,z)=>(y===undefined?H(x,z):y)+0.012;quadHUp(b,A,B,C,D,Y,0.25);TINT=[1,1,1];}
function paintDashes(x0,z0,x1,z1,dash,gap,wid,col){const L=Math.hypot(x1-x0,z1-z0);const ux=(x1-x0)/L,uz=(z1-z0)/L;for(let t=gap/2;t+dash<L;t+=dash+gap)paintRect(x0+ux*(t+dash/2),z0+uz*(t+dash/2),ux,uz,dash,wid,col);}
// ---------- placas con el nombre de la calle (mármol blanco, letras negras) ----------
const ALLSTR=[...VSTR,...HSTR];
// placa de Barcelona: losa de mármol blanco con vetas y letras negras grabadas («Carrer de» pequeño y el nombre grande)
const plaqueLines=n=>{const m=/^(C\.|Rambla|Pg\.|Av\.)\s+(de la |de les |del |de |d')?(.*)$/.exec(n);if(!m)return['',n];const t={'C.':'Carrer','Rambla':'Rambla','Pg.':'Passeig','Av.':'Avinguda'}[m[1]];const pre=(m[2]||'').trim();
  return pre.endsWith("'")?[t,pre+m[3]]:[t+(pre?' '+pre:''),m[3]];};
const texPlaques=cTex(1024,1024,(g)=>{const W=256,Hh=128;ALLSTR.forEach((s,i)=>{const x=(i%4)*W,y=Math.floor(i/4)*Hh;
  g.fillStyle='#ecebe5';g.fillRect(x,y,W,Hh);
  for(let k=0;k<5;k++){g.strokeStyle=`rgba(120,120,125,${R(0.08,0.22)})`;g.lineWidth=R(0.6,2.2);g.beginPath();let px=x+R(0,W),py=y;g.moveTo(px,py);for(let q=0;q<10;q++){px+=R(-14,14);py+=Hh/10;g.lineTo(px,py);}g.stroke();}
  const d=g.getImageData(x,y,W,Hh);for(let k=0;k<d.data.length;k+=4){const n=(Math.random()-0.5)*10;d.data[k]+=n;d.data[k+1]+=n;d.data[k+2]+=n;}g.putImageData(d,x,y);
  const [l1,l2]=plaqueLines(s.n);g.textAlign='center';g.textBaseline='middle';
  const eng=(t,cy,font)=>{g.font=font;g.fillStyle='rgba(255,255,255,0.7)';g.fillText(t,x+W/2+1,cy+1.2);g.fillStyle='#16171a';g.fillText(t,x+W/2,cy);};
  if(l1)eng(l1,y+Hh*0.27,'500 24px Georgia,"Times New Roman",serif');let fs=46;g.font=`bold ${fs}px Georgia,"Times New Roman",serif`;while(g.measureText(l2).width>W-26&&fs>18){fs--;g.font=`bold ${fs}px Georgia,"Times New Roman",serif`;}
  eng(l2,y+Hh*(l1?0.63:0.5),`bold ${fs}px Georgia,"Times New Roman",serif`);g.fillStyle='#8c1c22';g.font='bold 13px Arial';g.textAlign='right';g.fillText('2',x+W-10,y+Hh-11);});},{});
defInst('plaqueSlab',mkG([[bx(0.64,0.34,0.03,0,0,0),0xdedcd4]]),plasticMat,1,1,true);
defInst('plaque',(()=>{const g=new THREE.PlaneGeometry(0.6,0.3);return g;})(),(()=>{const m=atlasMat(texPlaques,null,4,8);m.polygonOffset=true;m.polygonOffsetFactor=-2;m.polygonOffsetUnits=-6;return m;})(),4,8,true);
// ---------- registros ----------
const BLOCKS=[],CARSPOTS=[],LOOT=[],TOILETS=[],FOUNTAINS=[],BEDS=[],SHOPS=[],BASES=[];
const MAPD={roads:[],blocks:[],shops:[],pois:[],peds:[]};
const solidBox=(x,z,hw,hd,yaw,y0,y1)=>addOBB(x,z,hw,hd,yaw,y0,y1);
// coloca un objeto instanciado sobre la superficie con su colisión opcional
function put(name,x,z,yaw,col,hw,hd,hh,yo=0){const y=surfY(x,z)+yo;addInst(name,x,y,z,yaw);if(col)solidBox(x,z,hw,hd,yaw,y,y+hh);return y;}

// ---------- suelo: un plano de asfalto inclinado para todo el barrio ----------
function buildGround(){const x0=XMIN-260,x1=XMAX+260,z0=ZMIN-260,z1=ZMAX+260;const g=new THREE.BufferGeometry();const us=US('asphalt');
  const P=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];const pos=[],uv=[],nor=[],col=[];for(const i of [0,3,2,0,2,1]){const p=P[i];pos.push(p[0],H(p[0],p[1]),p[1]);uv.push(p[0]*us,p[1]*us);nor.push(0,1,0);col.push(1,1,1);}
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const m=new THREE.Mesh(g,MATS.asphalt);m.matrixAutoUpdate=false;scene.add(m);}

// ---------- manzanas: acera en anillo (panot + bordillo de granito) ----------
function blockGeom(i,j){const A=vs(i),B=vs(i+1),Cc=hs(j),Dd=hs(j+1);
  const x0=A.pos+A.w/2,x1=B.pos-B.w/2,z0=Cc.pos+Cc.w/2,z1=Dd.pos-Dd.w/2;const bp=chamfRect(x0,x1,z0,z1,CHAMF);
  // aceras por lado: N, NE(xamfrà), E, SE, S, SO, O, NO
  const sN=Cc.sw,sE=B.sw,sS=Dd.sw,sW=A.sw;const D=[sN,(sN+sE)/2,sE,(sE+sS)/2,sS,(sS+sW)/2,sW,(sW+sN)/2];
  const cp=offsetPoly(bp,D);return{i,j,x0,x1,z0,z1,bp,cp,D,str:[Cc,B,Dd,A],outer:i<0||j<0||i>=NXS-1||j>=NZS-1};}
function sidewalkRing(bk){const{bp,cp,D}=bk;const cin=offsetPoly(cp,D.map(d=>d>0.4?-0.32:0));// banda de bordillo
  const sideStr=[bk.str[0],null,bk.str[1],null,bk.str[2],null,bk.str[3],null];
  for(let e=0;e<8;e++){const n=(e+1)%8;const s=sideStr[e]||sideStr[(e+7)%8]||sideStr[(e+1)%8];
    if(D[e]<0.05)continue;
    const mat=(s&&(s.n.includes('Muntaner')||s.n.includes('Rambla')||s.n.includes('Aragó')))?'panotflor':'panot4';
    const y=(x,z)=>H(x,z)+CURB;
    let b=bufOf((bp[e][0]+cp[e][0])/2,(bp[e][1]+cp[e][1])/2,mat);TINT=[1,1,1];quadHUp(b,bp[e],bp[n],cin[n],cin[e],y,US(mat));
    b=bufOf((cp[e][0]+cp[n][0])/2,(cp[e][1]+cp[n][1])/2,'granite');TINT=[0.95,0.95,0.95];quadHUp(b,cin[e],cin[n],cp[n],cp[e],y,US('granite'));
    // cara vertical del bordillo
    const ex=cp[n][0]-cp[e][0],ez=cp[n][1]-cp[e][1],l=Math.hypot(ex,ez);let nx=ez/l,nz=-ex/l;const c=centroid(bp);if(nx*((cp[e][0]+cp[n][0])/2-c[0])+nz*((cp[e][1]+cp[n][1])/2-c[1])<0){nx=-nx;nz=-nz;}
    wallQ(b,cp[e][0],cp[e][1],cp[n][0],cp[n][1],H(cp[e][0],cp[e][1])-0.05,H(cp[e][0],cp[e][1])+CURB,H(cp[n][0],cp[n][1])-0.05,H(cp[n][0],cp[n][1])+CURB,nx,nz,US('granite'));}
  TINT=[1,1,1];addSidewalk(cp);}

// ---------- calles peatonales / superilla: plataforma única ----------
// calle pacificada (superilla / eje verde): plataforma única que baja en rampa suave hasta la calzada del cruce,
// con una rigola de granito y embornales en el borde, en vez de un escalón
const RAMP=2.4;
function pedStrip(s,a0,a1){const hw=s.w/2;const rect=(l0,l1,b0,b1)=>s.ax==='v'?[[s.pos+l0,b0],[s.pos+l1,b0],[s.pos+l1,b1],[s.pos+l0,b1]]:[[b0,s.pos+l0],[b1,s.pos+l0],[b1,s.pos+l1],[b0,s.pos+l1]];
  const P=rect(-hw,hw,a0,a1);const c=centroid(P);
  const along=(x,z)=>s.ax==='v'?z:x;const yR=(x,z)=>{const t=along(x,z);return H(x,z)+CURB*clamp(Math.min(t-a0,a1-t)/RAMP,0,1);};
  const bands=[[-hw,-2.2,s.ax==='v'?'panot4':'panotflor'],[-2.2,2.2,s.ax==='v'?'llambordes':'granite'],[2.2,hw,s.ax==='v'?'panot4':'panotflor']];
  const segs=[[a0+0.45,a0+RAMP],[a0+RAMP,a1-RAMP],[a1-RAMP,a1-0.45]];
  for(const [l0,l1,mat] of bands)for(const [b0,b1] of segs){const Q=rect(l0,l1,b0,b1);const cc=centroid(Q);quadHUp(bufOf(cc[0],cc[1],mat),...Q,yR,US(mat));}
  // rigola (franja de granito oscuro a nivel de calzada) y embornales cada 4 m
  for(const [b0,b1] of [[a0,a0+0.45],[a1-0.45,a1]]){const Q=rect(-hw,hw,b0,b1);const cc=centroid(Q);TINT=[0.55,0.55,0.55];quadHUp(bufOf(cc[0],cc[1],'granite'),...Q,(x,z)=>H(x,z)+0.008,US('granite'));TINT=[1,1,1];
    for(let l=-hw+1.5;l<hw-1;l+=4){const m=(b0+b1)/2;const x=s.ax==='v'?s.pos+l:m,z=s.ax==='v'?m:s.pos+l;addInst('embornal',x,H(x,z)+0.012,z,s.ax==='v'?0:Math.PI/2);}}
  addSidewalk(P);addFloor(rect(-hw,hw,a0,a0+RAMP),0,yR);addFloor(rect(-hw,hw,a1-RAMP,a1),0,yR);MAPD.peds.push(P);return P;}
// reja de embornal (fundición con ranuras)
const texEmb=cTex(128,64,(g,w,h)=>{g.fillStyle='#2a2b2c';g.fillRect(0,0,w,h);g.fillStyle='#0a0a0a';for(let x=8;x<w-6;x+=10)g.fillRect(x,8,5,h-16);g.strokeStyle='#4a4b4c';g.lineWidth=4;g.strokeRect(2,2,w-4,h-4);},{});
defInst('embornal',(()=>{const g=new THREE.PlaneGeometry(0.8,0.36);g.rotateX(-Math.PI/2);return g;})(),new THREE.MeshLambertMaterial({map:texEmb,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),1,1,false);
// ---------- calzada: carriles, pasos de cebra, líneas de detención ----------
// devuelve la descripción de la calzada de un tramo: lista de [d0,d1] (offset transversal desde el eje) por sentido
function roadBands(s){const hw=s.w/2;if(s.type==='rambla')return[{d0:-hw+s.sw,d1:-5,dir:-1,lanes:2,park:true},{d0:5,d1:hw-s.sw,dir:1,lanes:2,park:true}];
  if(s.type==='ped'||s.type==='superilla')return[];return[{d0:-hw+s.sw,d1:hw-s.sw,dir:s.dir||1,lanes:s.type==='wide'?6:3,park:true}];}
// punto en coordenadas de calle: a = a lo largo, d = transversal
const SP=(s,a,d)=>s.ax==='v'?[s.pos+d,a]:[a,s.pos+d];
function roadSegment(s,a0,a1,crossA,crossB){const bands=roadBands(s);const ua=s.ax==='v'?[0,1]:[1,0];
  for(const B of bands){const W=B.d1-B.d0;const parkW=B.park?2.3:0;// carril de aparcamiento a la derecha del sentido
    const parkSide=B.dir>0?(s.ax==='v'?-1:1):(s.ax==='v'?1:-1);// lado del aparcamiento
    const p0=parkSide<0?B.d0:B.d1-parkW,p1=parkSide<0?B.d0+parkW:B.d1;const t0=parkSide<0?B.d0+parkW:B.d0,t1=parkSide<0?B.d1:B.d1-parkW;
    const lanes=B.lanes;const lw=(t1-t0)/lanes;
    const za=a0+8.5,zb=a1-8.5;// los cruces quedan fuera
    // separación de carriles discontinua
    for(let k=1;k<lanes;k++){const d=t0+k*lw;const A=SP(s,za,d),Bq=SP(s,zb,d);paintDashes(A[0],A[1],Bq[0],Bq[1],4,5,0.12,PAINTW);}
    // línea continua del carril de aparcamiento
    {const d=parkSide<0?p1:p0;const A=SP(s,za,d),Bq=SP(s,zb,d);const m=[(A[0]+Bq[0])/2,(A[1]+Bq[1])/2];paintRect(m[0],m[1],ua[0],ua[1],zb-za,0.1,PAINTW);}
    // pasos de cebra en ambos extremos + línea de detención antes del cruce (según el sentido)
    for(const [aZ,isEnd] of [[a0+5,false],[a1-5,true]]){const ss=4,dz=W;for(let d=B.d0+0.3;d<B.d1-0.3;d+=1.0){const q=SP(s,aZ,d+0.25);paintRect(q[0],q[1],ua[0],ua[1],ss,0.5,PAINTW);}
      const approaching=(B.dir>0)===isEnd;if(approaching){const aS=isEnd?aZ-3.2:aZ+3.2;const q=SP(s,aS,(t0+t1)/2);paintRect(q[0],q[1],ua[0],ua[1],0.4,t1-t0,PAINTW);
        // flechas de dirección
        for(let k=0;k<lanes;k++){const d=t0+(k+0.5)*lw;const aa=isEnd?aS-9:aS+9;const q2=SP(s,aa,d);arrowPaint(q2[0],q2[1],ua[0]*B.dir,ua[1]*B.dir);}}}
    // contenido del carril de aparcamiento
    parkingLane(s,B,a0,a1,p0,p1,parkSide);}
  MAPD.roads.push([SP(s,a0,0),SP(s,a1,0),s.w]);}
// flecha de carril reglamentaria (5 m): fuste largo y punta maciza
function paintTri(A,B,C){const c=[(A[0]+B[0]+C[0])/3,(A[1]+B[1]+C[1])/3];const b=bufOf(c[0],c[1],'paint');TINT=hexTint(PAINTW);quadHUp(b,A,B,C,C,(x,z)=>H(x,z)+0.012,0.25);TINT=[1,1,1];}
function arrowPaint(cx,cz,ux,uz){const vx=-uz,vz=ux;paintRect(cx-ux*0.9,cz-uz*0.9,ux,uz,3.5,0.16,PAINTW);
  const P=(a,b)=>[cx+ux*a+vx*b,cz+uz*a+vz*b];paintTri(P(0.82,-0.33),P(0.82,0.33),P(2.5,0));paintTri(P(0.82,-0.08),P(0.82,0.08),P(0.6,0));}
// aparcamiento: contenedores con su caja amarilla, Bicing, carga y descarga, coches
const CONTSET=['resta','resta','organica','envasos','paper','vidre'];
let bicingCount=0;
function parkingLane(s,B,a0,a1,p0,p1,side){const ua=s.ax==='v'?[0,1]:[1,0];const dm=(p0+p1)/2;const yawAlong=s.ax==='v'?0:Math.PI/2;const facing=s.ax==='v'?(side<0?Math.PI/2:-Math.PI/2):(side<0?0:Math.PI);
  let a=a0+16;let end_=a1-16;
  // zona de carga y descarga junto al xamfrà (zigzag amarillo)
  {const q=SP(s,a0+11,dm);paintRect(q[0],q[1],ua[0],ua[1],6,0.12,PAINTY);for(let t=0;t<6;t+=1.2){const qq=SP(s,a0+8.6+t,dm);paintRect(qq[0],qq[1],ua[0],ua[1],1.2,0.1,PAINTY);}}
  // aparcamiento de motos en la calzada (rayas blancas) junto al cruce del otro extremo, lleno de motos en batería
  if(Math.random()<0.75){const e0=a1-22,e1=a1-15;for(let t=e0;t<=e1+0.01;t+=0.9){const q=SP(s,t,dm);paintRect(q[0],q[1],ua[1],ua[0],p1-p0-0.2,0.1,PAINTW);}
    for(let t=e0+0.45;t<e1;t+=0.9){if(Math.random()<0.6){const q=SP(s,t+R(-0.25,0.25),dm+R(-0.35,0.35));const yb=H(q[0],q[1]);placeMoto(q[0],yb,q[1],facing+R(-0.55,0.55)+(Math.random()<0.15?Math.PI:0),Math.random()<0.22);}}end_=e0-1;}
  const plan=[];
  const L=end_-a;
  // contenedores en mitad del tramo (en la calzada, con caja amarilla)
  plan.push({k:'cont',at:a+L*R(0.25,0.6),len:CONTSET.length*2.05+1});
  if(Math.random()<0.28&&bicingCount<6){plan.push({k:'bicing',at:a+L*R(0.05,0.15),len:16});bicingCount++;}
  plan.sort((x,y)=>x.at-y.at);let cur=a;
  for(const it of plan){fillCars(s,cur,it.at-1,dm,yawAlong,B.dir);cur=it.at+it.len+1;
    if(it.k==='cont'){const z0=it.at;CONTSET.forEach((ty,k)=>{const q=SP(s,z0+1+k*2.05+1,dm);const y=H(q[0],q[1]);addInst('cont_'+ty,q[0],y,q[1],facing);solidBox(q[0],q[1],0.95,0.82,facing,y,y+1.8);});
      const q=SP(s,z0+it.len/2,p0+0.05),q2=SP(s,z0+it.len/2,p1-0.05);paintRect(q[0],q[1],ua[0],ua[1],it.len,0.14,PAINTY);paintRect(q2[0],q2[1],ua[0],ua[1],it.len,0.14,PAINTY);
      for(const e of [z0,z0+it.len]){const qq=SP(s,e,dm);paintRect(qq[0],qq[1],ua[1],ua[0],p1-p0,0.14,PAINTY);}
      {const qc=SP(s,z0+it.len/2,dm);lootSpot(qc[0],qc[1],H(qc[0],qc[1]),'bin','los contenedores');}
      if(Math.random()<0.5){const qq=SP(s,z0+R(1,it.len-1),dm+R(-0.5,0.5)*side+side*1.6);addInst('bolsa',qq[0],H(qq[0],qq[1]),qq[1],R(0,6));}}
    else if(it.k==='bicing'){const z0=it.at;const q=SP(s,z0+1,dm);put('bicingTotem',q[0],q[1],facing+Math.PI,true,0.3,0.15,2.2,-CURB*0);
      for(let k=0;k<12;k++){const qq=SP(s,z0+2.6+k*1.05,dm-side*0.55);const y=H(qq[0],qq[1]);addInst('bicingDock',qq[0],y,qq[1],yawAlong+Math.PI/2);
        if(Math.random()<0.55){const qb=SP(s,z0+2.6+k*1.05,dm+side*0.25);if(Math.random()<0.1)addInst('bicingBike',qb[0],y+0.12,qb[1],facing+R(-0.6,0.6),1,1,1,0,0,1.45);else addInst('bicingBike',qb[0],y,qb[1],facing+R(-0.04,0.04));}solidBox(qq[0],qq[1],0.12,0.9,yawAlong,y,y+1.0);}
      const qa=SP(s,z0+it.len/2,p0+0.05),qb2=SP(s,z0+it.len/2,p1-0.05);paintRect(qa[0],qa[1],ua[0],ua[1],it.len,0.12,PAINTW);paintRect(qb2[0],qb2[1],ua[0],ua[1],it.len,0.12,PAINTW);}}
  fillCars(s,cur,end_,dm,yawAlong,B.dir);}
// moto aparcada: modelo al azar, a veces tirada; las que están en pie y enteras se pueden coger
const MOTOS=[];
function placeMoto(x,y,z,yaw,fallen){const model=pick(['moto','motoT','motoT','moto','motoN','motoX']);const col=pick(MOTOCOL);const side=Math.random()<0.5?1:-1;
  const ref=addInst(model,x,y+(fallen?0.22:0),z,yaw,1,1,1,0,0,fallen?0:0,col);if(fallen){const L=INST[model].lists.get(ref[1]);const t=L[ref[2]];t[9]=0;t[3]=yaw;t.roll=side;}
  if(fallen){const L=INST[model].lists.get(ref[1]);L[ref[2]][11]=side*1.45;}else if(model==='moto'||model==='motoT'){const L=INST[model].lists.get(ref[1]);L[ref[2]][11]=-0.09;}// apoyada en la pata de cabra
  if(fallen){for(let k=0;k<3;k++)addInst('shards',x+R(-1,1),y+0.01,z+R(-1.2,1.2),R(0,6.28));addInst('carenado',x+R(-1.2,1.2),y,z+R(-1.5,1.5),R(0,6.28),1,1,1,0,0,0,col);if(Math.random()<0.5)addInst('casco',x+R(-2,2),y,z+R(-2,2),R(0,6.28),1,1,1,0,R(-1.2,1.2),0,pick([0xffffff,0x1a1a1a,0xb01818,0x2a4a8a]));}
  else solidBox(x,z,0.3,0.9,yaw,y,y+1.1);MOTOS.push({x,y,z,yaw,model,col,ref,fallen,ok:!fallen&&Math.random()<0.6});}
function fillCars(s,a,b,dm,yaw,dir){for(let t=a+3;t<b-3;t+=5.4){if(Math.random()<0.42){const q=SP(s,t,dm+R(-0.15,0.15));CARSPOTS.push({x:q[0],z:q[1],yaw:(dir>0?0:Math.PI)+(s.ax==='v'?0:Math.PI/2)+R(-0.05,0.05)});}}}

// ---------- mobiliario de acera a lo largo de cada lado de manzana ----------
function sidewalkFurniture(bk){const sides=[[0,1,bk.str[0]],[2,3,bk.str[1]],[4,5,bk.str[2]],[6,7,bk.str[3]]];const c=centroid(bk.bp);
  for(const [e,n,s] of sides){if(!s||s.outer&&bk.outer&&false)continue;const sw=bk.D[e];const a=bk.cp[e],b=bk.cp[n];const ex=b[0]-a[0],ez=b[1]-a[1],L=Math.hypot(ex,ez);const ux=ex/L,uz=ez/L;
    let nx=-uz,nz=ux;if(nx*((a[0]+b[0])/2-c[0])+nz*((a[1]+b[1])/2-c[1])<0){nx=-nx;nz=-nz;}// normal hacia la calle
    const ped=s.type==='ped'||s.type==='superilla';
    const at=(t,d)=>[a[0]+ux*t-nx*d,a[1]+uz*t-nz*d];// d = metros hacia dentro desde el bordillo
    const yawSt=Math.atan2(nx,nz);// mirando a la calle
    if(sw<0.5&&!ped)continue;
    if(ped){// en calles de plataforma única el mobiliario va pegado a la fachada, árboles en la línea de 3 m
      for(let t=6;t<L-6;t+=9){const p=at(t,-3.2);tree(p[0],p[1],0.9);}
      for(let t=10;t<L-8;t+=22){const p=at(t,-1.4);put('fanal',p[0],p[1],yawSt+Math.PI,true,0.12,0.12,8);}
      if(s.type==='superilla')for(let t=14;t<L-10;t+=20){const p=at(t,-6.5);put('jardinera',p[0],p[1],Math.atan2(ux,uz)+Math.PI/2,true,1.2,0.55,0.8);const p2=at(t+6,-6.5);put('banc',p2[0],p2[1],yawSt+Math.PI,true,0.9,0.3,0.9);}
      continue;}
    // árboles cada ~8 m a 1 m del bordillo, farolas cada 3 árboles
    const busT=s.bus&&((bk.i+bk.j)%2===0)?L*0.45:-99;
    let k=0;for(let t=7;t<L-7;t+=R(7.5,8.8),k++){if(Math.abs(t-busT)<4.5||Math.abs(t-busT-4.2)<1)continue;const p=at(t,1.0);if(k%3===1){const pl=at(t,0.5);put('fanal',pl[0],pl[1],yawSt+Math.PI,true,0.12,0.12,8);}else tree(p[0],p[1]);
      if(k%4===2){const pp=at(t+2.2,0.45);put('papelera',pp[0],pp[1],yawSt+Math.PI,true,0.22,0.22,1.1);}}
    {const p=at(L*R(0.35,0.65),0.6);put('parquimetre',p[0],p[1],yawSt+Math.PI,true,0.18,0.12,1.4);}
    if(Math.random()<0.5){const p=at(R(10,L-10),sw-0.35);put('armari',p[0],p[1],yawSt,true,0.45,0.2,1.3);}
    if(Math.random()<0.35){const p=at(R(12,L-12),sw*0.55);put('banc',p[0],p[1],yawSt+Math.PI*(Math.random()<0.5?0:1),true,0.9,0.3,0.9);}
    // parada de bus TMB a mitad de tramo
    if(s.bus&&((bk.i+bk.j)%2===0)){const t=L*0.45;const p=at(t,1.3);const y=put('marquesina',p[0],p[1],yawSt,false);addInst('marquesinaGlass',p[0],y,p[1],yawSt);{const lx=[Math.cos(yawSt),-Math.sin(yawSt)],lz=[Math.sin(yawSt),Math.cos(yawSt)];for(const [dz,yy] of [[-0.74+0.085,yawSt],[-0.74-0.085,yawSt+Math.PI]]){const mx=p[0]+lx[0]*1.42+lz[0]*dz,mz=p[1]+lx[1]*1.42+lz[1]*dz;addInst('mupi',mx,y+1.28,mz,yy,1,1,1,RI(0,7),1);}}solidBox(p[0]-nx*0.6,p[1]-nz*0.6,2.2,0.15,yawSt,y,y+2.6);
      const pp=at(t+4.2,0.35);addInst('busPole',pp[0],surfY(pp[0],pp[1]),pp[1],yawSt);addInst('busPlate',pp[0],surfY(pp[0],pp[1]),pp[1],yawSt);solidBox(pp[0],pp[1],0.06,0.06,0,y,y+3);}
    // motos aparcadas en la acera junto al xamfrà
    if(Math.random()<0.55){const t0=R(3,5);for(let q=0;q<R(3,8);q++){const p=at(t0+q*0.95,sw*0.5);{const y=surfY(p[0],p[1]);placeMoto(p[0]+R(-0.3,0.3),y,p[1]+R(-0.3,0.3),Math.atan2(nx,nz)+R(-0.6,0.6),Math.random()<0.2);}}}}
  // xamfrans: pilonas en el bordillo, señales, semáforos, placas de calle
  for(let e=1;e<8;e+=2){const a=bk.cp[e],b=bk.cp[(e+1)%8];if(bk.D[e]<0.5)continue;const L=Math.hypot(b[0]-a[0],b[1]-a[1]);const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;let nx=-uz,nz=ux;if(nx*((a[0]+b[0])/2-c[0])+nz*((a[1]+b[1])/2-c[1])<0){nx=-nx;nz=-nz;}
    for(let t=1;t<L-0.5;t+=1.6){const p=[a[0]+ux*t-nx*0.3,a[1]+uz*t-nz*0.3];put('pilona',p[0],p[1],0,true,0.09,0.09,0.85);}
    if(Math.random()<0.3){const p=[(a[0]+b[0])/2-nx*3,(a[1]+b[1])/2-nz*3];put('font',p[0],p[1],Math.atan2(nx,nz),true,0.25,0.25,1.5);FOUNTAINS.push({x:p[0],z:p[1]});}
    else if(Math.random()<0.25){const p=[(a[0]+b[0])/2-nx*4,(a[1]+b[1])/2-nz*4];put('kiosk',p[0],p[1],Math.atan2(nx,nz),true,1.5,1.0,2.6);}
    // en cada extremo del xamfrà: semáforo mirando a los coches que llegan por esa calle y señales para los que cruzan
    for(const [p,t,si] of [[a,1,(e-1)/2],[b,-1,((e+1)/2)%4]]){const st=bk.str[si];if(!st||st.type==='ped'||st.type==='superilla')continue;
      // dirección de la calle junto a esta esquina y sentido hacia el cruce
      const sx=st.ax==='v'?0:1,sz=st.ax==='v'?1:0;const tox=-ux*t,toz=-uz*t;let toward=Math.sign(sx*tox+sz*toz)||1;
      const q=[p[0]-nx*0.45+ux*t*0.5,p[1]-nz*0.45+uz*t*0.5];const y=surfY(q[0],q[1]);
      const approach=!st.dir||(st.dir===toward);
      if(approach){const yaw=Math.atan2(-sx*toward,-sz*toward);const cy0=Math.cos(yaw),sy0=Math.sin(yaw);
        // báculo hacia el centro de la calzada de esta calle
        const lat=st.ax==='v'?[Math.sign(st.pos-q[0]),0]:[0,Math.sign(st.pos-q[1])];const side=lat[0]*cy0-lat[1]*sy0;const big=st.w>=20;
        addInst(big?(side>0?'semaforBR':'semaforBL'):'semafor',q[0],y,q[1],yaw);solidBox(q[0],q[1],0.08,0.08,0,y,y+3.5);
        // placa con el nombre de la calle que cruza y hacia dónde se puede girar
        const oi=si===(e-1)/2?((e+1)/2)%4:(e-1)/2;const os=bk.str[oi];
        if(os&&os.n&&os.dir&&os.type!=='ped'&&os.type!=='superilla'){const k=ALLSTR.indexOf(os);if(k>=0){const ox=os.ax==='v'?0:1,oz=os.ax==='v'?1:0;const dvx=sx*toward,dvz=sz*toward;const rx=-dvz,rz=dvx;const right=(ox*os.dir*rx+oz*os.dir*rz)>0;
          addInst('stPlate',q[0],y+3.42,q[1],yaw,1,1,1,k*2+(right?0:1));}}
        if(st.dir&&Math.random()<0.5)signOn(q[0]+sy0*0.075,y+3.8,q[1]+cy0*0.075,yaw,3,true);}
      else if(st.dir){// salida del cruce: dirección prohibida mirando al cruce
        const yaw=Math.atan2(sx*toward,sz*toward);addInst('signPole',q[0],y,q[1],0);signOn(q[0]+sx*toward*0.06,y+2.75,q[1]+sz*toward*0.06,yaw,1,true);solidBox(q[0],q[1],0.05,0.05,0,y,y+3);
        // sentido único (flecha) para los que pasan por la otra calle: dos caras
        const oyaw=Math.atan2(sz,sx);const ar=Math.atan2(-Math.cos(oyaw),Math.sin(oyaw));
        for(const sg of [1,-1]){const yw=oyaw+(sg<0?Math.PI:0);const axx=-Math.cos(yw),azz=Math.sin(yw);const flip=(axx*sx+azz*sz)*(st.dir)<0;signOn(q[0]+Math.sin(yw)*0.05,y+2.1,q[1]+Math.cos(yw)*0.05,yw,0,false,flip);}}}}
  // placas con el nombre de la calle en las esquinas de los edificios
  for(let e=1;e<8;e+=2){const a=bk.bp[e],b=bk.bp[(e+1)%8];const L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<3)continue;const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;let nx=-uz,nz=ux;
    if(nx*((a[0]+b[0])/2-c[0])+nz*((a[1]+b[1])/2-c[1])<0){nx=-nx;nz=-nz;}
    for(const [t,si] of [[0.62,(e-1)/2],[L-0.62,((e+1)/2)%4]]){const s=bk.str[si];if(!s||!s.n)continue;const idx=ALLSTR.indexOf(s);if(idx<0)continue;const x=a[0]+ux*t+nx*0.02,z=a[1]+uz*t+nz*0.02;const y=H(x,z)+CURB+2.95;
      addInst('plaqueSlab',x,y,z,Math.atan2(nx,nz));addInst('plaque',x+nx*0.016,y,z+nz*0.016,Math.atan2(nx,nz),1,1,1,idx);}}
  // señales de sentido único en las esquinas (en el poste del semáforo / poste propio)
}
function trafficSignsOld(){for(let i=0;i<NXS;i++)for(let j=0;j<NZS;j++){const V=VSTR[i],Hh=HSTR[j];
  for(const [s,o] of [[V,Hh],[Hh,V]]){if(!s.dir||s.type==='rambla')continue;const ua=s.ax==='v'?[0,1]:[1,0];
    // señal de sentido obligatorio en la esquina de salida y dirección prohibida en la de entrada
    const cx=V.pos,cz=Hh.pos;const off=o.w/2+2,side=s.w/2-s.sw+0.6;
    for(const sg of [-1,1]){const a=sg*off;const along=s.ax==='v'?cz:cx;const q=SP(s,along+a,(s.w/2-0.6)*(sg>0?1:-1));const y=surfY(q[0],q[1]);
      const yaw=(s.ax==='v'?(sg>0?0:Math.PI):(sg>0?Math.PI/2:-Math.PI/2));addInst('signPole',q[0],y,q[1],0);
      const prohib=(sg>0)!==(s.dir>0);addInst('signFace',q[0],y+2.75,q[1],yaw+Math.PI,1,1,1,prohib?1:0);if(!prohib)addInst('signFace',q[0],y+2.75,q[1],yaw,1,1,1,0);
      addInst('signFace',q[0],y+2.1,q[1],yaw+Math.PI,1,1,1,3);solidBox(q[0],q[1],0.05,0.05,0,y,y+3);}}}}

function trafficSigns(){}
// señal en un poste: k = celda del atlas (0 sentido obligatorio, 1 prohibido, 3 «30»...), redonda o cuadrada; flip invierte la flecha
function signOn(x,y,z,yaw,k,round,flip){addInst('signFace',x,y,z,yaw,flip?-1:1,1,1,k);addInst(round?'signBackC':'signBackS',x,y,z,yaw);}
// ---------- límite del mapa: barreras militares al final de cada calle ----------
function mapLimits(){const put2=(x,z,yaw)=>{const y=surfY(x,z);addInst('jersey',x,y,z,yaw);addInst('valla',x,y+0.9,z,yaw);};
  for(let i=0;i<NXS;i++){const s=VSTR[i];for(const z of [ZMIN+10,ZMAX-10])for(let d=-s.w/2+1;d<s.w/2;d+=2.05)put2(s.pos+d,z,0);}
  for(let j=0;j<NZS;j++){const s=HSTR[j];for(const x of [XMIN+10,XMAX-10])for(let d=-s.w/2+1;d<s.w/2;d+=2.05)put2(x,s.pos+d,Math.PI/2);}
  addBoxV(XMIN-50,XMAX+50,ZMIN-10,ZMIN+10.5,-50,50);addBoxV(XMIN-50,XMAX+50,ZMAX-10.5,ZMAX+10,-50,50);addBoxV(XMIN-10,XMIN+10.5,ZMIN-50,ZMAX+50,-50,50);addBoxV(XMAX-10.5,XMAX+10,ZMIN-50,ZMAX+50,-50,50);}

// ---------- rambla central (Rambla de Catalunya) ----------
function ramblaCenter(s,a0,a1){const hw=5;const P=s.ax==='v'?[[s.pos-hw,a0],[s.pos+hw,a0],[s.pos+hw,a1],[s.pos-hw,a1]]:[[a0,s.pos-hw],[a1,s.pos-hw],[a1,s.pos+hw],[a0,s.pos+hw]];
  const c=centroid(P);const y=(x,z)=>H(x,z)+CURB;quadHUp(bufOf(c[0],c[1],'panotflor'),...P,y,US('panotflor'));
  const b=bufOf(c[0],c[1],'granite');for(let k=0;k<4;k++){const p=P[k],q=P[(k+1)%4];const ex=q[0]-p[0],ez=q[1]-p[1],l=Math.hypot(ex,ez);let nx=ez/l,nz=-ex/l;if(nx*((p[0]+q[0])/2-c[0])+nz*((p[1]+q[1])/2-c[1])<0){nx=-nx;nz=-nz;}
    wallQ(b,p[0],p[1],q[0],q[1],H(p[0],p[1])-0.05,H(p[0],p[1])+CURB,H(q[0],q[1])-0.05,H(q[0],q[1])+CURB,nx,nz,US('granite'));}
  addSidewalk(P);
  for(let a=a0+5;a<a1-4;a+=8){for(const d of [-3.4,3.4]){const q=SP(s,a,d);tree(q[0],q[1]);}const q=SP(s,a+4,0);if(((a-a0)/8|0)%3===0)put('fanalR',q[0],q[1],0,true,0.15,0.15,4.4);
    else if(Math.random()<0.5)put('banc',q[0],q[1],s.ax==='v'?Math.PI/2:0,true,0.9,0.3,0.9);else{for(let k=0;k<2;k++){const t=SP(s,a+3+k*1.6,R(-1,1));put('terrassa',t[0],t[1],R(0,6),true,0.6,0.6,1);}}}
  const qk=SP(s,(a0+a1)/2,0);put('kiosk',qk[0],qk[1],s.ax==='v'?Math.PI/2:0,true,1.5,1.0,2.6);}

function buildStreets(){buildGround();
  for(let i=-1;i<NXS;i++)for(let j=-1;j<NZS;j++){const bk=blockGeom(i,j);BLOCKS.push(bk);sidewalkRing(bk);MAPD.blocks.push(bk.bp);if(!bk.outer)sidewalkFurniture(bk);}
  // tramos de calle entre cruces
  for(let i=0;i<NXS;i++){const s=VSTR[i];for(let j=-1;j<NZS;j++){const a0=hs(j).pos+hs(j).w/2,a1=hs(j+1).pos-hs(j+1).w/2;if(j<0||j>=NZS-1)continue;
      if(s.type==='ped')pedStrip(s,a0,a1);else{roadSegment(s,a0,a1);if(s.type==='rambla')ramblaCenter(s,a0,a1);}}}
  for(let j=0;j<NZS;j++){const s=HSTR[j];for(let i=-1;i<NXS;i++){const a0=vs(i).pos+vs(i).w/2,a1=vs(i+1).pos-vs(i+1).w/2;if(i<0||i>=NXS-1)continue;
      if(s.type==='superilla'||s.type==='ped')pedStrip(s,a0,a1);else roadSegment(s,a0,a1);}}
  // cruces de la superilla con calles peatonales: plaza
  for(let i=0;i<NXS;i++)for(let j=0;j<NZS;j++){const V=VSTR[i],Hh=HSTR[j];if((V.type==='ped')&&(Hh.type==='superilla'||Hh.type==='ped')){const P=[[V.pos-V.w/2,Hh.pos-Hh.w/2],[V.pos+V.w/2,Hh.pos-Hh.w/2],[V.pos+V.w/2,Hh.pos+Hh.w/2],[V.pos-V.w/2,Hh.pos+Hh.w/2]];
      const c=centroid(P);quadHUp(bufOf(c[0],c[1],'llambordes'),...P,(x,z)=>H(x,z)+CURB,US('llambordes'));addSidewalk(P);put('font',c[0],c[1],0,true,0.25,0.25,1.5);FOUNTAINS.push({x:c[0],z:c[1]});
      for(const [dx,dz] of [[-6,-6],[6,-6],[-6,6],[6,6]])tree(c[0]+dx,c[1]+dz);}}
  trafficSigns();mapLimits();}

// =====================================================================
// FACHADAS DEL EIXAMPLE: atlas de ventanas/balcones, molduras, balcones de hierro, persianas
// =====================================================================
const SHUTC=['#46624a','#5c4630','#3f5446','#6a5236','#4d4d47','#7a6c58','#355a4a','#8a7a60'];
// celda de puerta-balcón (1:2). st: 0 persiana de llibret cerrada, 1 abierta con cortina, 2 enrollable media, 3 cristal roto, 4 tapiada, 5 quemada
function drawBalcDoor(g,x,y,w,h,st,lit){const sh=pick(SHUTC);g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
  g.fillStyle='#d8d0bf';g.fillRect(x,y,w,h);const fx=x+w*0.07,fw=w*0.86,fy=y+h*0.03,fh=h*0.95;
  const glass=()=>{g.fillStyle=lit?'#ffcf86':'#1d2329';g.fillRect(fx,fy,fw,fh);if(!lit){const gr=g.createLinearGradient(fx,fy,fx+fw,fy+fh);gr.addColorStop(0,'rgba(170,190,210,.4)');gr.addColorStop(0.5,'rgba(60,70,80,.1)');gr.addColorStop(1,'rgba(150,170,190,.25)');g.fillStyle=gr;g.fillRect(fx,fy,fw,fh);}
    g.strokeStyle='#e8e2d4';g.lineWidth=w*0.035;g.strokeRect(fx,fy,fw,fh);line(g,fx+fw/2,fy,fx+fw/2,fy+fh);line(g,fx,fy+fh*0.62,fx+fw,fy+fh*0.62);};
  const slats=(sx,sw,sy,shh,col)=>{g.fillStyle=col;g.fillRect(sx,sy,sw,shh);g.strokeStyle='rgba(0,0,0,.38)';g.lineWidth=2;for(let yy=sy+5;yy<sy+shh;yy+=7)line(g,sx+3,yy,sx+sw-3,yy);g.strokeStyle='rgba(255,255,255,.12)';for(let yy=sy+7;yy<sy+shh;yy+=7)line(g,sx+3,yy,sx+sw-3,yy);
    g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=3;g.strokeRect(sx+1,sy+1,sw-2,shh-2);};
  if(st===0){slats(fx,fw/2,fy,fh,sh);slats(fx+fw/2,fw/2,fy,fh,sh);if(lit){g.fillStyle='rgba(255,200,120,.5)';for(let yy=fy+6;yy<fy+fh;yy+=7)g.fillRect(fx+4,yy,fw-8,1.5);}}
  else if(st===1){glass();if(!lit){g.fillStyle=pick(['rgba(235,228,210,.85)','rgba(210,200,180,.8)','rgba(190,160,140,.75)']);g.fillRect(fx+fw*0.06,fy+fh*0.04,fw*0.3,fh*0.9);g.fillRect(fx+fw*0.64,fy+fh*0.04,fw*0.3,fh*0.9);}
    slats(x,w*0.08,fy,fh,sh);slats(x+w*0.92,w*0.08,fy,fh,sh);}
  else if(st===2){glass();const k=R(0.3,0.75);slats(fx,fw,fy,fh*k,pick(['#cfc4ae','#b8ad98','#8a7a62']));}
  else if(st===3){glass();g.fillStyle='#0b0d0f';g.beginPath();g.moveTo(fx+fw*R(0.1,0.4),fy+fh*0.15);for(let i=0;i<9;i++)g.lineTo(fx+fw*R(0.05,0.95),fy+fh*R(0.1,0.85));g.fill();g.strokeStyle='rgba(220,230,240,.7)';g.lineWidth=1.5;for(let i=0;i<8;i++)line(g,fx+fw*0.5,fy+fh*0.45,fx+fw*R(0,1),fy+fh*R(0,1));}
  else if(st===4){g.fillStyle='#1a1a1a';g.fillRect(fx,fy,fw,fh);for(let i=0;i<5;i++){g.save();g.translate(fx+fw/2,fy+fh*(0.15+i*0.18));g.rotate(R(-0.25,0.25));g.fillStyle=pick(['#9a7a52','#8a6a44','#a8865a']);g.fillRect(-fw*0.6,-h*0.035,fw*1.2,h*0.07);g.restore();}}
  else{glass();const gr=g.createRadialGradient(x+w/2,y+h*0.2,4,x+w/2,y+h*0.2,h*0.7);gr.addColorStop(0,'rgba(10,8,6,.95)');gr.addColorStop(1,'rgba(20,16,12,0)');g.fillStyle=gr;g.fillRect(x,y-h*0.1,w,h);}
  g.restore();}
const texWin=cTex(2048,1024,(g)=>{for(let r=0;r<2;r++)for(let c=0;c<8;c++){const st=[0,0,1,1,2,3,4,5,0,1,1,2,0,3,1,2][r*8+c];drawBalcDoor(g,c*256,r*512,256,512,st,false);}},{});
const texWinL=cTex(2048,1024,(g)=>{g.fillStyle='#000';g.fillRect(0,0,2048,1024);for(let r=0;r<2;r++)for(let c=0;c<8;c++){const st=[0,0,1,1,2,3,4,5,0,1,1,2,0,3,1,2][r*8+c];if(st===4||st===5||st===3)continue;g.save();g.globalCompositeOperation='source-over';drawBalcDoor(g,c*256,r*512,256,512,st,true);g.restore();
  g.fillStyle='rgba(0,0,0,1)';g.fillRect(c*256,r*512,256*0.07,512);g.fillRect(c*256+256*0.93,r*512,256*0.07,512);}},{});
const winMat=atlasMat(texWin,texWinL,8,2);winMat.polygonOffset=true;winMat.polygonOffsetFactor=-2;winMat.polygonOffsetUnits=-6;texWin.anisotropy=4;
defInst('win',(()=>{const g=new THREE.PlaneGeometry(1,1);g.translate(0,0.5,0);return g;})(),winMat,8,2);
// marco de ventana con alféizar y dintel (color de la fachada vía instanceColor)
{const p=[[bx(1.3,0.07,0.16,0,-0.03,0.07),0xffffff],[bx(1.25,0.16,0.12,0,1.12,0.06),0xffffff]];
  defInst('winFrame',mkG(p),new THREE.MeshLambertMaterial({vertexColors:true}));}
// balcón: losa de piedra + barandilla de hierro forjado (textura con alfa)
const texRail=cTex(512,256,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#141514';g.fillRect(0,0,w,12);g.fillRect(0,h-10,w,10);g.fillRect(0,28,w,5);g.fillRect(0,h-34,w,5);
  for(let x=6;x<w;x+=24){g.fillRect(x,0,5,h);}g.strokeStyle='#141514';g.lineWidth=5;for(let x=0;x<w;x+=96){g.beginPath();g.arc(x+48,h/2,26,0,7);g.stroke();g.beginPath();g.arc(x+48,h/2,10,0,7);g.stroke();
    g.beginPath();g.moveTo(x+18,h/2);g.bezierCurveTo(x+18,h/2-40,x+78,h/2-40,x+78,h/2);g.stroke();}},{});
{const slab=mkG([[bx(1,0.15,1,0,0.06,0.5),0xffffff]]);defInst('balcSlab',slab,new THREE.MeshLambertMaterial({vertexColors:true}));
  const f=new THREE.PlaneGeometry(1,1);f.translate(0,0.5,1);const l=new THREE.PlaneGeometry(1,1);l.rotateY(Math.PI/2);l.translate(-0.5,0.5,0.5);const r=l.clone();r.translate(1,0,0);
  const railM=new THREE.MeshLambertMaterial({map:texRail,alphaTest:0.18,alphaToCoverage:true,side:THREE.DoubleSide});defInst('balcRail',mergeGeometries([f,l,r]),railM);
  const fF=new THREE.PlaneGeometry(1,1);fF.translate(0,0.5,1);defInst('balcRailF',fF,railM);const sS=new THREE.PlaneGeometry(1,1);sS.rotateY(Math.PI/2);sS.translate(0,0.5,0.5);defInst('balcRailS',sS,railM);}
// macetas y ropa tendida y aire acondicionado
defInst('maceta',mkG([[cy(0.14,0.1,0.25,0,0.12,0,5),0xa0522d],[sp(0.22,0,0.42,0,5),0x3f6a2a]]),plasticMat);
const texLaundry=cTex(256,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#444';g.lineWidth=2;line(g,0,6,w,6);let x=6;while(x<w-20){const ww=R(22,46),hh=R(40,100);g.fillStyle=pick(['#e8e8e8','#6a8ab8','#b84a4a','#e8d86a','#4a4a4a','#8ab86a','#d8a0c0']);g.fillRect(x,6,ww,hh);x+=ww+R(4,10);}},{});
defInst('laundry',(()=>{const g=new THREE.PlaneGeometry(1.4,0.7);g.translate(0,-0.35,0);return g;})(),new THREE.MeshLambertMaterial({map:texLaundry,alphaTest:0.5,side:THREE.DoubleSide}));
defInst('ac',mkG([[bx(0.8,0.55,0.3,0,0,0.15),0xd8d8d4]]),plasticMat);
// materiales de fachada
MATS.plaster_cream=photoMat('plaster_cream',{ns:0.5});MATS.plaster_grey=photoMat('plaster_grey',{ns:0.5});MATS.plaster_ochre=photoMat('plaster_ochre',{ns:0.5});
MATS.stone_blocks=photoMat('stone_blocks',{ns:0.8});MATS.stone_dark=photoMat('stone_dark',{ns:0.8});MATS.brick=photoMat('brick',{ns:0.8});MATS.concrete_wall=photoMat('concrete_wall',{ns:0.6});
MATS.trim=new THREE.MeshLambertMaterial({vertexColors:true});
// años sin mantenimiento: regueros de lluvia bajo cornisas y ventanas, mugre y humedad a pie de calle, manchas de hollín y desconchones
function weatherMat(m,k=1){m.onBeforeCompile=sh=>{sh.uniforms.uWk={value:k};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;uniform float uWk;\n'+NOISE_GLSL)
    .replace('#include <map_fragment>',`#include <map_fragment>
      vec3 w=vWP;float gy=w.y+w.z*0.012;float hz=w.x+w.z;
      float streak=zn(vec3(hz*3.1,gy*0.18,0.0))*0.65+zn(vec3(hz*9.0,gy*0.5,3.0))*0.35;
      float stain=smoothstep(0.55,0.85,streak)*smoothstep(1.2,4.5,gy);
      float blot=smoothstep(0.58,0.82,zn(w*0.35)*0.7+zn(w*1.3)*0.3);
      float ground=1.0-smoothstep(0.0,1.6+zn(vec3(hz*0.6,0.0,0.0))*1.2,gy);
      float soot=smoothstep(0.62,0.9,zn(vec3(hz*0.15,gy*0.08,7.0)));
      vec3 c=diffuseColor.rgb;
      c*=1.0-uWk*(stain*0.32+blot*0.18+soot*0.22);
      c=mix(c,c*vec3(0.62,0.6,0.52),ground*0.55*uWk);
      // desconchones: aparece el ladrillo/mortero
      float chip=smoothstep(0.86,0.875,zn(w*3.5+11.0)*0.8+zn(w*14.0)*0.2)*step(0.95,uWk);c=mix(c,c*vec3(0.78,0.68,0.6),chip*0.55);
      diffuseColor.rgb=c;`);};m.customProgramCacheKey=()=>'weather'+k;return m;}
for(const k of ['plaster_cream','plaster_grey','plaster_ochre','stone_blocks','stone_dark','brick','concrete_wall'])weatherMat(MATS[k],1);
weatherMat(MATS.trim,0.8);
const FACADE_STY=[// combinaciones reales del Eixample: zócalo de piedra + estuco de color, ladrillo visto, piedra entera
  {pb:'stone_blocks',up:'plaster_cream',tints:['#f1e6cf','#e8d6b5','#f2e2c8','#e6d2c0','#efe4d2']},
  {pb:'stone_dark',up:'plaster_ochre',tints:['#e8c98f','#dcb57f','#e2c290','#d9b98a']},
  {pb:'stone_blocks',up:'plaster_grey',tints:['#e2e0d9','#d8d4cb','#ece8df','#c9c6bd','#e6d9cf']},
  {pb:'stone_blocks',up:'brick',tints:['#ffffff','#f0e0d8']},
  {pb:'stone_blocks',up:'stone_blocks',tints:['#ffffff','#f4ead8']},
  {pb:'stone_dark',up:'plaster_cream',tints:['#f0d8c8','#e8c8b8','#dccab8','#f2d6c2']},
];
// pared con huecos (planta baja): huecos [u0,u1,y0,y1] en metros desde el inicio del segmento y desde la base; con jambas de profundidad dep
function wallHoles(mat,a,b,nx,nz,yb,yt,holes,dep,us,tint){const L=Math.hypot(b[0]-a[0],b[1]-a[1]);const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;const B=bufOf((a[0]+b[0])/2,(a[1]+b[1])/2,mat);TINT=tint||[1,1,1];
  const P=t=>[a[0]+ux*t,a[1]+uz*t];holes=holes.slice().sort((p,q)=>p[0]-q[0]);let cur=0;
  const seg=(t0,t1,y0,y1)=>{if(t1-t0<0.01||y1-y0<0.01)return;const p=P(t0),q=P(t1);wall(B,p[0],p[1],q[0],q[1],yb+y0,yb+y1,nx,nz,us,t0);};
  for(const h of holes){seg(cur,h[0],0,yt-yb);seg(h[0],h[1],h[3],yt-yb);if(h[2]>0)seg(h[0],h[1],0,h[2]);cur=h[1];
    // jambas, dintel y alféizar hacia dentro
    const p=P(h[0]),q=P(h[1]);const ix=-nx*dep,iz=-nz*dep;
    wall(B,p[0],p[1],p[0]+ix,p[1]+iz,yb+h[2],yb+h[3],ux,uz,us);wall(B,q[0],q[1],q[0]+ix,q[1]+iz,yb+h[2],yb+h[3],-ux,-uz,us);
    capPoly(B,[p,q,[q[0]+ix,q[1]+iz],[p[0]+ix,p[1]+iz]],yb+h[3],us,true);if(h[2]>0)capPoly(B,[p,q,[q[0]+ix,q[1]+iz],[p[0]+ix,p[1]+iz]],yb+h[2],us);}
  seg(cur,L,0,yt-yb);TINT=[1,1,1];}
// moldura horizontal (imposta, cornisa) como caja a lo largo de la fachada
function moldStrip(a,b,nx,nz,y,h,out,tint){const L=Math.hypot(b[0]-a[0],b[1]-a[1]);const cx=(a[0]+b[0])/2+nx*out/2,cz=(a[1]+b[1])/2+nz*out/2;const yaw=Math.atan2(b[0]-a[0],b[1]-a[1]);
  const B=bufOf(cx,cz,'trim');TINT=tint;boxGeoInto(B,cx,y+h/2,cz,out,h,L+out*0.5,yaw,1);TINT=[1,1,1];}

// comercios reales del Eixample (OpenStreetMap, ODbL): [i, j fraccionarios en la cuadrícula de calles, tipo, nombre, categoría OSM]
const POIS=[[5.5126,2.9508,"ferre","Servei Estació","doityourself"],[3.5931,3.2321,"restaurant","Hanibishi","restaurant"],[3.9256,0.9984,"banc","Caixabank","bank"],[1.9933,2.6605,"restaurant","Cinc Sentits","restaurant"],[5.7533,3.315,"roba","Levi's","clothes"],[5.5228,3.6979,"roba","Sala Dalmau","art"],[5.1962,3.7169,"bar","Il Caffè di Francesco","cafe"],[5.5083,4.3332,"banc","BBVA","bank"],[5.4089,4.6328,"roba","Tumi","bag"],[4.4414,4.9843,"restaurant","Pans","fast_food"],[4.5514,4.4269,"banc","Caixabank","bank"],[4.7766,3.2302,"banc","Banco Santander","bank"],[4.7611,3.3398,"restaurant","Taller de Tapas","restaurant"],[1.5641,0.8736,"super","Jespac","supermarket"],[1.8887,0.817,"restaurant","Cubeliña","restaurant"],[1.647,0.8665,"restaurant","Tsukimi","restaurant"],[2.0504,0.4345,"bar","La Cuineta","pub"],[1.9243,-0.1241,"restaurant","Pamboli","restaurant"],[2.0553,0.6412,"bar","Bistronuo","pub"],[2.0477,0.5102,"roba","Schlecker","chemist"],[0.8442,1.0829,"farmacia","Farmàcia Bosch de Basea Cusc","pharmacy"],[0.8873,0.42,"restaurant","El bodegón de l’eixample","restaurant"],[0.8647,0.8417,"banc","Banco Santander","bank"],[1.019,0.6671,"bar","Can Pen","cafe"],[1.1091,-0.1016,"bar","Napoca","pub"],[0.6467,0.9375,"roba","VW","car_repair"],[0.4705,-0.0846,"roba","Biking Point Provença","bicycle"],[0.1081,0.4485,"super","BonÀrea","supermarket"],[1.1438,2.1212,"bar","La Pausa","pub"],[1.5681,4.0158,"super","Jespac Supermercats","supermarket"],[1.8669,2.1847,"restaurant","The Dutch","restaurant"],[1.5547,2.0998,"restaurant","Albarakah","restaurant"],[4.4395,0.8524,"roba","La Central","books"],[2.7876,2.2183,"restaurant","Piola","restaurant"],[1.1267,1.5688,"restaurant","L'Adelita Botaner","restaurant"],[3.2431,1.849,"restaurant","Yakumanka","restaurant"],[2.3995,0.8781,"banc","Banco Caixa Geral","bank"],[0.069,3.1562,"roba","Moeve Aragó Casanova","fuel"],[5.0058,1.0273,"restaurant","Cervecería Catalana","restaurant"],[0.9189,1.1814,"restaurant","Le Romane","restaurant"],[2.9373,0.5627,"restaurant","Arko","restaurant"],[5.1789,2.6937,"roba","Señor","clothes"],[4.107,-0.6137,"restaurant","Balmes / Rosselló","restaurant"],[5.5898,-0.8223,"banc","Banco Sabadell","bank"],[5.5107,-0.322,"roba","Casas","shoes"],[5.5487,-0.4647,"perruqueria","Cebado","hairdresser"],[5.3509,-0.109,"optica","Cottet","optician"],[5.5211,-0.3731,"roba","La Selecta","haberdashery"],[5.4878,-0.2438,"roba","Mad","clothes"],[5.5304,-0.4148,"roba","Mar Bessas","shoes"],[5.5587,-0.5011,"roba","Misako","bag"],[5.5701,-0.5621,"roba","NKN Nekane","clothes"],[4.0796,-0.1626,"roba","Gina","clothes"],[4.0934,-0.2937,"roba","Ananda cases i nines","toys"],[3.9767,-0.1132,"bar","VIVARI","cafe"],[4.1557,-0.8367,"roba","Come in","books"],[3.4535,-0.0825,"roba","Freixanet llibres","books"],[3.7438,-0.0953,"restaurant","Ginza","restaurant"],[3.6934,-0.1329,"restaurant","Ginza Sushi","restaurant"],[3.3145,-0.1023,"farmacia","Farmàcia Garrido Blanch, Mar","pharmacy"],[4.1272,-0.5282,"roba","Milenium Provença","clinic"],[3.8476,-0.1018,"restaurant","Nostrum","fast_food"],[4.1059,-0.1865,"roba","Pellicer","jewelry"],[3.7957,-0.0947,"roba","Polo","motorcycle"],[3.5036,-0.0982,"immo","gestió inmobiliaria alfa","estate_agent"],[4.1345,-0.2187,"roba","rigual","paint"],[3.9184,-0.1068,"optica","Óptica Tarragón","optician"],[3.2689,-0.7923,"roba","Auto Rossellón","car_parts"],[2.4391,-0.0882,"super","Bonpreu","supermarket"],[2.3134,-0.0859,"roba","Dada flor","florist"],[3.2627,-0.6966,"bar","El petit forn","cafe"],[3.2584,-0.6696,"roba","Fins de siecles","antiques"],[3.2382,-0.6017,"fruteria","Mas Bacus","deli"],[3.3252,-0.838,"roba","Rosell","clothes"],[3.2748,-0.7473,"roba","Temps d'Oci Viatges","travel_agency"],[3.5719,-0.8895,"restaurant","Igueldo","restaurant"],[2.7065,3.5077,"restaurant","Flamant","restaurant"],[2.0961,3.051,"restaurant","Restaurant Gaig","restaurant"],[5.5156,0.6529,"roba","Mango","clothes"],[3.1,2.6288,"restaurant","Restaurante Hanoi","restaurant"],[2.9493,0.2881,"restaurant","Wow!","restaurant"],[5.5932,2.6996,"restaurant","Burger King","fast_food"],[2.9393,0.3653,"restaurant","Ali","restaurant"],[5.54,0.5523,"bar","Café & Té GR Compañia del Tr","cafe"],[2.3597,-0.874,"restaurant","Bodega Joan","restaurant"],[-0.4999,4.7901,"restaurant","The Pink Elephant","restaurant"],[-0.7103,3.8548,"bar","Casa Pardo Marcelino","cafe"],[3.1598,0.3553,"bar","Linea 6,25","bar"],[2.8346,1.6188,"restaurant","L'Enric","restaurant"],[1.4271,-0.8743,"restaurant","Semproniana","restaurant"],[2.9487,3.3259,"super","Bonpreu","supermarket"],[2.427,3.0549,"restaurant","Busan BBQ","restaurant"],[2.0761,4.9774,"bar","Belladona","bar"],[2.424,4.7867,"roba","PuzzleMania","games"],[1.9537,0.8003,"restaurant","Foc i Oli","restaurant"],[1.9873,4.2835,"restaurant","Gyoza House","restaurant"],[1.4721,2.8037,"restaurant","El Último Agave","restaurant"],[5.4803,4.4542,"roba","Max Mara","clothes"],[5.591,3.9816,"roba","Kenzo","clothes"],[5.6707,3.5964,"roba","Loewe","clothes"],[5.697,3.4968,"roba","Sephora","cosmetics"],[0.1458,4.8337,"bar","Boxer Bar","bar"],[4.8908,2.5831,"fruteria","Colmado Quilez","deli"],[5.1666,1.1109,"optica","General Optica","optician"],[-0.731,3.6158,"restaurant","La Bella Napoli","restaurant"],[2.8697,1.1542,"restaurant","Robata Sushi & Grill","restaurant"],[2.2559,1.8371,"restaurant","Buenos Aires","restaurant"],[5.8784,-0.4472,"restaurant","El Passatge del Murmuri","restaurant"],[1.4365,4.8351,"bugaderia","Splash","laundry"],[1.5308,4.8249,"restaurant","Racó D'en Cesc","restaurant"],[2.9695,0.2399,"restaurant","Ramplax","restaurant"],[0.9875,4.4211,"roba","Diotronic S.A.","radiotechnics"],[3.0463,2.0475,"bar","Bar Cleries","bar"],[1.7495,1.863,"restaurant","El Rincón Maya Restaurant","restaurant"],[2.8639,3.5244,"restaurant","Futami","restaurant"],[0.2771,2.4379,"bar","Pub Fiction","bar"],[4.5143,3.7199,"restaurant","Vinitus","restaurant"],[1.8187,4.3323,"restaurant","La Flauta","restaurant"],[1.3372,1.7665,"restaurant","Taktika Berri","restaurant"],[5.3747,3.851,"restaurant","Garriga","restaurant"],[0.1824,1.7556,"bar","Cal Oksana","bar"],[5.2737,0.6336,"restaurant","La Flauta Rambla","restaurant"],[5.6409,0.1358,"restaurant","La Bodegueta","restaurant"],[2.8983,0.7978,"restaurant","La Palmera","restaurant"],[2.8866,3.7288,"restaurant","4 latas","restaurant"],[5.9025,-0.2218,"restaurant","Mauri","restaurant"],[2.2045,0.6501,"restaurant","Pescadea","restaurant"],[3.2866,3.0218,"restaurant","La Pastisseria Barcelona","restaurant"],[5.0353,3.7094,"restaurant","Bar Nolla","restaurant"],[0.863,1.8443,"restaurant","Bosque Palermo","restaurant"],[4.3289,1.8116,"bar","Hummus","cafe"],[3.5837,2.006,"restaurant","Al Baraka","restaurant"],[4.3525,1.7987,"forn","Nou Joanet","bakery"],[0.395,2.7222,"roba","Erotixx Sexshop & Cruising","gift"],[5.3056,0.0809,"roba","Loja Nanos","clothes"],[5.5157,-0.2804,"roba","Gocco Rambla","clothes"],[5.27,2.3641,"roba","Mango","clothes"],[4.975,3.3391,"roba","Lush","cosmetics"],[5.2056,4.2372,"roba","COS","clothes"],[5.9059,4.2931,"roba","Mango","clothes"],[2.6883,3.7017,"restaurant","Brunch & Cake","restaurant"],[2.1765,1.4057,"bar","Tandem Cocktail Bar","bar"],[1.5687,-0.0855,"bar","La Fira","bar"],[4.5397,4.5101,"restaurant","Cachitos Rambla","restaurant"],[2.6576,4.2797,"roba","Sea You - Tactic Spot","sports"],[4.9625,3.423,"forn","forn de sant","bakery"],[5.767,3.2233,"bar","Faborit","cafe"],[2.1088,3.5405,"restaurant","el puma","restaurant"],[0.9031,1.7682,"perruqueria","Barbershop","beauty"],[0.171,1.5946,"forn","Turris","bakery"],[1.4947,3.8481,"bar","Garage Beer Co","pub"],[5.5765,4.0452,"roba","Mango","clothes"],[5.9832,2.4947,"roba","Liu Jo","clothes"],[0.9766,3.5072,"bar","Crossfit Distrito 080","cafe"],[3.5183,3.6876,"restaurant","Restaurant L'Olive","restaurant"],[0.5761,4.8414,"roba","Letamendi Motor","car"],[0.3155,4.4806,"bar","Bacon Bear Bar","bar"],[0.9755,3.5645,"bar","La Chapelle","bar"],[0.9778,3.6426,"bar","Punto BCN","bar"],[1.3574,3.8526,"bar","Dmen's","bar"],[2.3094,3.0637,"restaurant","El Argentino","restaurant"],[4.3582,3.733,"restaurant","Lateral","restaurant"],[5.3632,3.7017,"bar","Il Caffè di Francesco","cafe"],[0.0534,3.1288,"fruteria","Carrefour Express","convenience"],[1.1639,0.8269,"bar","SandwiChez","cafe"],[-0.1598,0.7453,"restaurant","Cuina El Ninot","restaurant"],[3.9267,4.7121,"restaurant","La Cabrera","restaurant"],[0.5769,1.8964,"restaurant","la Hacienda","restaurant"],[4.8013,3.0884,"roba","Intimissi","clothes"],[4.6733,-0.1023,"roba","Selfier","gift"],[4.4725,-0.8336,"roba","Tizana","beverages"],[-0.5942,3.0967,"restaurant","Creperie Les 3 Pommes","restaurant"],[2.5981,1.8475,"restaurant","Bo di Napoli","restaurant"],[-0.4362,3.9225,"restaurant","Shushi Yaki","restaurant"],[0.0797,3.8837,"restaurant","Oma Bistró","restaurant"],[4.6228,4.2257,"roba","Casa del Libro","books"],[1.1446,2.4075,"restaurant","Indochine Ly Leap","restaurant"],[4.7257,2.9679,"fruteria","Reserva Ibérica","deli"],[5.2008,3.8583,"roba","Natura","gift"],[4.3645,3.9019,"roba","Cacao sampaka","chocolate"],[4.7331,3.5453,"roba","New Balance","shoes"],[5.0331,1.699,"restaurant","Casa Moritz","restaurant"],[4.9086,4.8562,"restaurant","El Charrito","restaurant"],[4.008,4.7105,"super","Veritas","supermarket"],[4.3445,-0.1451,"restaurant","I'll Pomo d'Oro","restaurant"],[0.138,3.7934,"bar","Brewdog","pub"],[0.1177,3.4453,"super","Lidl","supermarket"],[-0.4287,0.6673,"super","Mercadona","supermarket"],[1.9803,4.7146,"farmacia","Farmàcia Feriche Bartra, Ivo","pharmacy"],[2.0142,4.0677,"farmacia","Farmàcia Urgellés Esquerra -","pharmacy"],[1.8174,4.6291,"fruteria","Supermercat Express","convenience"],[2.5061,3.7989,"forn","Forn de Pa L'Eixample","bakery"],[5.1294,3.7114,"roba","Flying Tiger Copenhagen","variety_store"],[2.6352,4.6296,"bar","Índigo Café","cafe"],[-0.7473,3.4189,"restaurant","Little Corea","restaurant"],[2.1774,1.0722,"restaurant","Granja Petitbo","restaurant"],[4.2853,1.9974,"restaurant","Supra","restaurant"],[0.0579,0.3614,"super","Veritas","supermarket"],[5.2793,3.8548,"roba","Crocs","shoes"],[2.3194,1.075,"restaurant","Albé Barcelona","restaurant"],[3.3961,-0.8475,"restaurant","Auto Rosselló","restaurant"],[0.779,2.0531,"bar","Roast Club Cafè","coffee"],[2.264,2.7903,"restaurant","Quinoa Aragó Vegetarià","restaurant"],[4.195,0.1797,"restaurant","Petit Bangkok","restaurant"],[3.6363,2.0036,"restaurant","Kamiya","restaurant"],[3.1418,0.6259,"restaurant","Bol","restaurant"],[-0.685,2.3285,"roba","Müving","motorcycle"],[3.2099,2.0292,"restaurant","Thai Noodles","restaurant"],[2.002,3.4673,"roba","Casals Llibreria antiquària","books"],[4.3848,-0.5488,"restaurant","El Dorado Chicken","restaurant"],[5.1738,-0.1206,"bar","Forn de pa Boldú","cafe"],[-0.9776,1.6935,"bar","Vivari","cafe"],[4.6411,2.0016,"bar","Granja València","cafe"],[-0.8657,1.1999,"bar","Plaza Café","cafe"],[5.6552,1.7731,"restaurant","Viena","fast_food"],[4.7546,0.8285,"restaurant","El Mercader de L'Eixample","restaurant"],[3.8293,3.0403,"bar","seven7seven","bar"],[3.7579,3.1692,"fruteria","Carrefour Express","convenience"],[3.1322,2.6555,"restaurant","Teleferic","restaurant"],[-0.7107,3.3259,"roba","La Sirena","frozen_food"],[2.0562,2.3159,"restaurant","Yamadori","restaurant"],[0.872,-0.1525,"roba","Mil 959","gift"],[2.129,1.1255,"restaurant","Floripa","restaurant"],[3.917,2.9916,"restaurant","Taquerías Tamarindo","restaurant"],[4.2964,3.7388,"roba","CoCo Fresh Tea & Juice","tea"],[1.6311,2.7544,"restaurant","Restaurant Xinès","restaurant"],[2.9977,1.7277,"restaurant","Saffron Bar Restaurant","restaurant"],[2.8361,0.0709,"restaurant","Gresca","restaurant"],[5.7842,-0.2213,"farmacia","Farmàcia Rbla de Catalunya, ","pharmacy"],[5.5191,1.0369,"farmacia","Farmàcia Jaume Enrich Murt","pharmacy"],[5.5711,1.0226,"roba","Lindt","chocolate"],[4.9275,2.004,"farmacia","Bolos","pharmacy"],[5.1509,2.3685,"farmacia","Farmàcia Gelabert Colom-Nogu","pharmacy"],[5.1372,2.957,"forn","Casa Vives","bakery"],[0.9407,2.2447,"roba","Scalextric. Slotmania","model"],[0.9752,3.5326,"farmacia","Farmàcia Focardell Berenguer","pharmacy"],[0.3077,4.2466,"roba","Antinous","books"],[4.0606,1.2352,"restaurant","Rio Azul Restaurant","restaurant"],[4.4415,4.7342,"roba","Kiosc","newsagent"],[1.195,4.0765,"electro","Monsó i Benet","electronics"],[0.0002,4.8813,"restaurant","Sabor de ciudad natal","restaurant"],[-0.2779,4.8912,"fruteria","Supermercado 161","convenience"],[-0.3732,4.8837,"restaurant","Panda & Smile","restaurant"],[0.8604,3.8567,"forn","Santanach","bakery"],[0.834,3.8582,"roba","Deutsche ZK","dentist"],[0.5359,3.8513,"roba","63 [bis]","clothes"],[0.3186,3.7984,"roba","Bio-energy Sport","nutrition_supplements"],[-0.629,3.3341,"forn","Panarras","bakery"],[0.5493,2.0681,"super","Ca l'Atmetller","supermarket"],[2.0124,2.491,"farmacia","Farmàcia Torres","pharmacy"],[-0.3391,0.7901,"bar","O Retorno","cafe"],[4.0353,2.7546,"restaurant","Gaudim","restaurant"],[2.488,0.0858,"restaurant","Koko Restaurant Barcelona","restaurant"],[1.1558,2.3036,"super","Spar","supermarket"],[1.9021,1.714,"bar","Esprit Chupitos","bar"],[1.9158,1.436,"bar","La Taberna del ESPIT","bar"],[1.8173,2.0658,"restaurant","QCuvo! Barcelona","restaurant"],[1.9846,-0.2453,"restaurant","Goiko Grill","restaurant"],[1.9163,1.5256,"bar","ESPIT Chupitos","bar"],[1.903,0.5365,"bar","DECODE","bar"],[3.5972,3.0989,"bar","365","cafe"],[2.1285,0.3025,"restaurant","Out of China","restaurant"],[4.9177,2.4394,"bar","Nespresso","coffee"],[5.1327,2.6268,"roba","Tezenis","clothes"],[5.0215,3.0625,"roba","Calzedonia","clothes"],[4.2167,2.0062,"forn","Baluard Barceloneta","bakery"],[-0.8594,2.479,"restaurant","Restaurant de L'Anna","restaurant"],[1.138,3.399,"restaurant","Son Hao","restaurant"],[0.4601,-0.8786,"restaurant","A'palloza","restaurant"],[3.3292,3.7762,"restaurant","Chongging Liuyishou Hotpot","restaurant"],[1.8532,3.4315,"restaurant","Miss Sushi","restaurant"],[1.067,0.3622,"roba","Ashi Running Barcelona","sports"],[5.0718,1.545,"roba","ese O ese","clothes"],[-0.8396,1.4919,"restaurant","Saiko","restaurant"],[-0.4977,4.3701,"restaurant","Sushi Yaki II","restaurant"],[2.662,4.2007,"restaurant","Cheese's art","restaurant"],[3.4643,-0.9018,"super","Condis","supermarket"],[3.835,-0.8798,"restaurant","Sun Market","restaurant"],[4.5713,-0.8937,"bar","365","cafe"],[4.5935,-0.896,"bar","365","cafe"],[4.7341,-0.8718,"bar","Level","bar"],[5.9011,-0.6345,"roba","Swarovski","jewelry"],[5.6235,0.2085,"roba","Panama Jack","shoes"],[5.9246,0.035,"roba","Serra Claret","clothes"],[2.3906,0.0874,"forn","elFornet","bakery"],[2.3124,0.0941,"perruqueria","Extraordinari","hairdresser"],[0.874,-0.8168,"farmacia","Farmàcia Vives Pal, Maria Ca","pharmacy"],[0.4255,-0.9002,"restaurant","Lagarín","restaurant"],[0.1996,-0.8941,"bar","Vivari","cafe"],[3.3107,0.085,"bar","Colmado","bar"],[5.9629,-0.1269,"roba","Sebago","shoes"],[2.109,1.1899,"restaurant","La Papa","restaurant"],[4.1878,0.2299,"forn","Jansana Gluten Free Bakery","bakery"],[3.302,0.8665,"forn","Vivari","bakery"],[4.9252,0.0693,"roba","Tomates Fritos","clothes"],[5.7979,-0.2621,"optica","Sunglass Hut","optician"],[3.2467,-0.2805,"restaurant","La Piamontesa","restaurant"],[-0.0308,1.552,"roba","Clarel","chemist"],[4.4813,0.0768,"restaurant","SandwiChez","fast_food"],[3.4968,0.0853,"fruteria","EuroSol","convenience"],[2.6973,0.8728,"bar","Cellare de Vino","bar"],[2.2347,0.0892,"immo","1001 pisos","estate_agent"],[-0.3131,-0.2204,"fruteria","Maria Supermercat","convenience"],[5.5363,-0.896,"bar","Al sur","cafe"],[5.4094,1.2198,"roba","Uno de 50","jewelry"],[3.3042,2.7634,"restaurant","Kawamura","restaurant"],[4.2564,1.795,"restaurant","Compartir","restaurant"],[2.6612,1.843,"restaurant","Restaurante Cafetería La Isl","restaurant"],[1.8641,3.6903,"restaurant","Nikkei 103","restaurant"],[3.6925,2.2991,"roba","Oryx","books"],[3.5753,1.0834,"roba","Copisteria Elemental","copyshop"],[3.1398,1.1317,"super","Mi Alcampo","supermarket"],[3.6711,1.0731,"restaurant","La Soca 2","restaurant"],[3.1028,1.3144,"restaurant","Creps Barcelona","restaurant"],[3.7298,2.238,"roba","Casa Luthier","musical_instrument"],[5.2804,3.7053,"bar","Starbucks","cafe"],[4.9912,3.7027,"restaurant","Bitte! wurst","restaurant"],[1.8204,4.1852,"restaurant","Vigo Restaurant","restaurant"],[3.0011,2.4985,"bar","Bar Bágoa","bar"],[4.8576,2.576,"restaurant","El Glop De La Rambla","restaurant"],[4.8245,1.991,"roba","Des petits hauts","clothes"],[5.0145,3.1507,"roba","Pikolinos","shoes"],[5.4852,1.1006,"roba","Mascaró","shoes"],[0.3455,0.0846,"ferre","Mon Clau","hardware"],[5.8142,3.2303,"roba","Bagués - Masriera","jewelry"],[1.6651,4.8208,"restaurant","Takkosu","restaurant"],[1.3991,4.8383,"restaurant","Bodega La Capitana","restaurant"],[2.0031,4.9957,"bar","Massamara","cafe"],[3.6227,4.711,"restaurant","Charrito","restaurant"],[1.5621,4.9989,"restaurant","Wild beef","fast_food"],[4.4902,4.6778,"bar","Forn de pa Rambla 31","cafe"],[1.8572,3.5747,"restaurant","La Maroteca, Restaurant de P","restaurant"],[4.0195,2.7555,"super","Taste of America","supermarket"],[3.5886,3.0894,"restaurant","Ramen Kitchen Takumi Barcelo","fast_food"],[2.1204,3.0545,"restaurant","Angle","restaurant"],[5.6963,2.6949,"restaurant","Mussol","restaurant"],[4.3786,2.7423,"restaurant","TGB The Good Burger","restaurant"],[3.9817,2.7572,"restaurant","La Taska","restaurant"],[3.9546,3.005,"restaurant","Takumi Tonkatsu Ramen","restaurant"],[3.5357,3.0263,"bar","Francesco Cafè","cafe"],[2.323,2.7934,"restaurant","inti & chaska","restaurant"],[4.6358,2.9862,"restaurant","Reserva Iberica The Kitchen","restaurant"],[4.3343,2.9936,"super","Express","supermarket"],[4.5098,4.6002,"roba","Parfois","fashion_accessories"],[1.9735,4.6113,"restaurant","Micu Maku","restaurant"],[2.8032,0.0708,"restaurant","Gresca","restaurant"],[0.9697,2.431,"restaurant","Cocoroco","restaurant"],[0.1969,-0.7213,"restaurant","Crosmas","restaurant"],[2.6195,3.9996,"bar","DelaCrem","ice_cream"],[2.9729,0.2043,"roba","Valiño","jewelry"],[4.9843,3.2708,"roba","kaotiko","clothes"],[2.4939,3.975,"roba","Al-lots, llibreria infantil ","books"],[5.8437,2.696,"roba","Emporio Armani","clothes"],[3.5277,1.8062,"super","Sorli","supermarket"],[1.3094,3.8521,"restaurant","Mako","restaurant"],[4.8531,4.085,"forn","MacxiPan","bakery"],[4.839,4.1523,"forn","Granja la Catalana","bakery"],[3.8876,2.9997,"restaurant","Poke Sí","fast_food"],[4.7942,3.051,"roba","L’occitane","clothes"],[3.6975,3.9648,"roba","Pepa Paper Design","stationery"],[5.5688,0.4081,"roba","Lovestore","clothes"],[5.3893,0.2021,"roba","Aramis","shoes"],[5.3662,0.1652,"perruqueria","Bomboneria","beauty"],[5.301,0.3791,"roba","Perfumeria Julia","perfumery"],[5.8979,-0.6697,"roba","Yamamay","clothes"],[5.8994,-0.684,"roba","Systemaction","clothes"],[5.5895,0.4332,"restaurant","Gioelia Creameria Italiana","restaurant"],[5.9057,-0.7054,"roba","Apodemia","jewelry"],[5.3644,0.2899,"perruqueria","Raffel Pages","hairdresser"],[5.8097,-0.3464,"roba","Punt Roma","clothes"],[5.4528,-0.172,"roba","Florencia","clothes"],[5.8777,-0.5674,"roba","Geox","shoes"],[5.8309,-0.3212,"roba","Le Creuset","houseware"],[5.4176,0.3727,"bar","MasQMenos","pub"],[3.6524,1.8359,"bar","San Fermin La Teresina","cafe"],[1.813,4.6951,"perruqueria","Z.uñas","beauty"],[5.4457,4.5425,"roba","Samsonite","bag"],[4.6856,2.9662,"farmacia","Farmacia Aragó 260","pharmacy"],[4.6975,2.7284,"roba","Gadgets&Cuina","houseware"],[4.6536,2.704,"roba","Blue Box Sex Shop","erotic"],[4.3076,2.7444,"super","Condis","supermarket"],[-0.1528,0.5535,"restaurant","Tierra","restaurant"],[0.3049,4.3342,"restaurant","Argentinisimo","restaurant"],[3.8898,3.9239,"bar","Fleca & Cafe","cafe"],[3.6546,1.8251,"bar","San Fermín","bar"],[2.1214,0.4799,"restaurant","Sergi de Meià","restaurant"],[2.7258,2.0219,"farmacia","Farmàcia Gimeno Fité, Merced","pharmacy"],[1.8384,0.8688,"farmacia","Farmàcia Serralta Baquero, M","pharmacy"],[4.0294,1.1369,"farmacia","Farmàcia de Mir Tubert, M.J ","pharmacy"],[0.0412,0.4234,"farmacia","Farmàcia Fiol Belart, Jaume","pharmacy"],[2.1791,2.807,"farmacia","Farmàcia Castell Fores, M. C","pharmacy"],[-0.482,4.821,"farmacia","Farmàcia Cutillas Bou, Marti","pharmacy"],[1.2079,3.8211,"farmacia","Farmàcia Marrugat Fontanals,","pharmacy"],[0.9447,2.2159,"farmacia","Farmàcia Costa Miralbell, Er","pharmacy"],[0.0522,2.4922,"farmacia","Farmàcia Anna M. Àlvarez Can","pharmacy"],[2.8076,1.7689,"roba","Gina Debona","jewelry"],[5.7558,0.7937,"restaurant","Restaurante Solomillo","restaurant"],[5.0188,3.107,"restaurant","Rovica","restaurant"],[1.963,-0.8624,"restaurant","Tapas Season","restaurant"],[3.4165,-0.125,"roba","Freixanet llibres","books"],[1.7361,0.1163,"roba","Hospital Veterinari Provença","veterinary"],[3.1408,3.7904,"restaurant","Gonzalez & Co","restaurant"],[2.5977,4.7204,"bar","Lilo brunch","cafe"],[2.6708,4.1118,"restaurant","Bellillo","restaurant"],[0.9236,1.6952,"roba","Galevory. centre especialitz","toys"],[2.8914,3.3986,"restaurant","Champanillo Barcelona","restaurant"],[1.1283,-0.2791,"roba","Ortopèdia Hugué","medical_supply"],[0.9744,4.5681,"super","Aldi","supermarket"],[2.0412,4.9785,"roba","Racó Verd","florist"],[0.6445,2.8277,"roba","Control94 BMW: Ventas","motorcycle"],[-0.2187,3.0669,"roba","Control94 Honda: Ventas","motorcycle"],[-0.3075,2.5447,"roba","Control94 BMW: Taller","motorcycle_repair"],[3.5859,3.2848,"roba","Dae Do","sports"],[3.7529,3.2274,"restaurant","Marhaba","restaurant"],[2.544,3.1952,"roba","Oficina de Correos","post_office"],[4.4231,2.7349,"super","La Fuente","supermarket"],[5.9758,1.0235,"bar","Buenas Migas","cafe"],[3.8481,2.4844,"roba","Adonia","cosmetics"],[4.9887,3.8875,"roba","Helly Hansen","clothes"],[5.2541,3.7057,"roba","Party Fiesta","party"],[5.1653,3.8858,"roba","Alquimia store & spa","cosmetics"],[3.8944,3.7523,"roba","Vilaró Serveis Integrals d'I","copyshop"],[4.4253,3.7245,"roba","ace & tate","fashion_accessories"],[3.7981,3.7524,"restaurant","Little India","restaurant"],[3.9569,3.7472,"bar","Verdis.co","bar"],[4.7842,3.1562,"banc","Deutsche Bank","bank"],[4.0873,3.7494,"restaurant","Ramen Shifu","restaurant"],[4.2202,3.7357,"fruteria","Discount2 Market","convenience"],[5.5621,2.7024,"fruteria","Trady's","convenience"],[4.5166,2.9977,"perruqueria","Marco Aldany","hairdresser"],[5.2031,2.9788,"roba","Taimo","furniture"],[4.4923,3.0264,"bar","Pannus","cafe"],[4.0121,3.0131,"roba","Loterías y Apuestas del Esta","lottery"],[3.8909,2.2982,"restaurant","Yamato Yakiniku","restaurant"],[0.2193,2.5122,"restaurant","La Patsa Lab","restaurant"],[1.2969,4.8395,"roba","Mironous","agrarian"],[5.9406,-0.9146,"bar","Tomàs Enrique","pub"],[0.9874,4.1655,"bar","BierCaB","pub"],[0.5756,4.048,"restaurant","Casa Jaime","restaurant"],[3.6686,2.5274,"roba","Miscota","pet"],[4.1656,4.7067,"roba","Llibreria Finestres","books"],[1.2758,3.8553,"bar","Brew Wild","pub"],[2.2713,1.0536,"bar","Curtis audiophile cafe recor","cafe"],[2.0202,4.7694,"locutori","Phone shop","mobile_phone"],[2.1317,4.7944,"roba","Ananda Spa","massage"],[2.1834,4.9687,"roba","Egea Sex Shop","erotic"],[-0.1567,0.6093,"restaurant","Barra Perelló 1898","restaurant"],[-0.3516,0.6305,"restaurant","La Bikineria","restaurant"],[2.4829,4.7853,"restaurant","Banh Mio","restaurant"],[2.2103,4.7945,"bar","Miles","pub"],[2.1706,4.7979,"fruteria","Mini Supermercat","convenience"],[0.736,4.7715,"super","Aldi","supermarket"],[2.7165,3.4128,"restaurant","Boa-Bao","restaurant"],[1.9723,4.6491,"forn","Forn La Llibreria","bakery"],[1.8301,4.277,"fruteria","Basar Amic","convenience"],[1.8249,4.4044,"roba","Kiwoko","pet"],[1.8283,4.4598,"roba","Kivet Clíniques Veterinàries","veterinary"],[1.8226,4.6621,"optica","C4 Óptics Eixample","optician"],[0.7511,-0.0884,"roba","Basar Angel","variety_store"],[0.6791,-0.0817,"bar","Aloha","bar"],[0.5081,-0.0919,"super","Coaliment","supermarket"],[0.232,-0.0837,"bar","Bar La Barra","bar"],[4.5709,3.7317,"restaurant","Tapas 2254","restaurant"],[2.8913,0.0707,"roba","La Impossible","books"],[0.429,4.8598,"bugaderia","Speedywash","laundry"],[0.2233,2.5864,"restaurant","Piazze D'Italia","restaurant"],[0.2344,2.6947,"restaurant","Marina","restaurant"],[0.0672,0.7433,"restaurant","Shiro","restaurant"],[0.0485,0.2481,"carnisseria","Escofet Oliver","butcher"],[0.1345,1.1679,"bar","El Ninot","cafe"],[0.0545,0.2958,"forn","Macxipa","bakery"],[0.0381,0.1887,"bar","Bonsai Coffee","cafe"],[0.1249,1.2817,"super","EsNaturalBcn","supermarket"],[0.2125,1.0901,"carnisseria","mónibèric","butcher"],[0.0794,0.1442,"roba","Via Dolça","confectionery"],[0.1558,1.5347,"bugaderia","La Wash","laundry"],[0.1932,-0.804,"restaurant","Komo","restaurant"],[0.1877,-0.4304,"bar","el Formet","cafe"],[0.9654,3.4148,"roba","69 Barcelona","clothes"],[3.2149,2.0188,"fruteria","Supermercat Luna","convenience"],[0.2425,1.8843,"fruteria","Bona Fruita","greengrocer"],[2.1726,1.849,"restaurant","Buenos Aires","restaurant"],[3.665,2.0031,"bugaderia","La Wash","laundry"],[4.7365,1.8123,"roba","nice things","clothes"],[2.7792,2.0881,"restaurant","Bodega Picarol","restaurant"],[4.3306,1.9957,"perruqueria","Hello Nails","beauty"],[2.7992,2.1291,"bar","HolyMadre","ice_cream"],[3.7306,2.0929,"fruteria","Supermercat 24h","convenience"],[2.551,2.0356,"restaurant","Al Jaima","restaurant"],[-0.5935,1.9183,"restaurant","Latin Brunch","restaurant"],[-0.958,2.1635,"restaurant","Tiago la Pizza","restaurant"],[3.6464,1.991,"restaurant","Kanada-Ya","restaurant"],[-0.6456,1.9176,"roba","Mallart","dentist"],[1.2043,2.0628,"fruteria","GP Morgon","convenience"],[-0.7335,2.1312,"roba","Basar Roma","variety_store"],[1.8628,3.6238,"roba","Iglú Aribau 35","outdoor"],[1.1512,4.4237,"bar","El Meu Mon","cafe"],[1.1597,4.7504,"perruqueria","Aristo","hairdresser"],[0.9633,4.7456,"roba","J. Martí","lighting"],[1.1722,4.7649,"roba","Kokedamas Angus","florist"],[1.1588,4.5341,"roba","Centre Médic MAPFRE Salut","clinic"],[1.1214,-0.6942,"restaurant","Casa Masala","restaurant"],[-0.5303,2.1039,"restaurant","Podonamu","restaurant"],[1.3527,2.0564,"restaurant","SITAKE YA","restaurant"],[2.0687,1.4448,"roba","Fabre","books"],[2.2258,-0.1289,"restaurant","Soma","restaurant"],[5.0584,0.0544,"bar","El Fornet","cafe"],[3.5888,0.0624,"roba","Linverd - Supermercado ecoló","greengrocer;health_food"],[1.3388,3.8073,"restaurant","Burger World","fast_food"],[0.0281,2.5872,"restaurant","The Fish & Chips Shop","fast_food"],[3.9736,2.2936,"fruteria","Licencia actividad Barcelona","convenience"],[2.205,-0.1508,"bar","Sirvent gelateria","cafe"],[1.4061,-0.0966,"roba","Humana","clothes"],[4.3106,-0.1894,"perruqueria","Manolo Díaz","hairdresser"],[0.6511,0.0903,"ferre","Ferretería Provenza","hardware"],[5.0866,-0.1259,"restaurant","La Bodegueta","restaurant"],[0.7654,0.0917,"roba","Dentsalut","dentist"],[4.5162,-0.8569,"roba","Maria Padilla","clinic"],[-0.5747,0.1195,"banc","Caixabank","bank"],[1.9877,4.2388,"restaurant","Han In","restaurant"],[3.2379,-0.2345,"restaurant","Salut!","restaurant"],[1.8093,4.7493,"restaurant","La Fábrica","fast_food"],[3.0339,1.4813,"restaurant","Sumac & Mambo","restaurant"],[4.6124,3.953,"ferre","Bolibar ferreteria","hardware"],[4.6119,4.1599,"super","MiAlcampo","supermarket"],[3.9665,-0.8808,"restaurant","Yü Sushi","restaurant"],[-0.6305,3.2214,"roba","bang.mamut fábrica de cómics","books"],[0.0623,0.6894,"roba","Robledor","doors"],[0.3649,2.0672,"roba","Smile Home","variety_store"],[2.3106,3.7993,"restaurant","Tulsi","restaurant"],[-0.5271,0.9937,"roba","Motorsol Volkswagen","car"],[-0.3066,1.075,"restaurant","El Rincón del Ángel","restaurant"],[-0.2422,0.9628,"banc","BBVA","bank"],[-0.2927,1.5631,"restaurant","O'Tubo","restaurant"],[4.3951,3.8931,"roba","Casa Viva","furniture"],[5.3355,4.8556,"roba","Diesel","clothes"],[5.0566,1.6227,"roba","Júlia","perfumery"],[5.352,1.489,"roba","Parfois","fashion_accessories"],[5.3295,1.5749,"roba","Etam","clothes"],[5.317,1.6289,"roba","Mango","clothes"],[5.3675,1.4297,"roba","Brownie","clothes"],[4.7611,3.0075,"roba","tuc tuc","clothes"],[4.933,3.617,"bar","Café de Francesco","cafe"],[4.9451,3.5381,"optica","miller & marc","optician"],[5.0057,3.2082,"roba","Salomon","clothes"],[4.9366,3.5798,"roba","Tea Shop","tea"],[4.806,4.862,"roba","Audi City Rambla","car"],[1.5496,-0.8983,"restaurant","Bidega Sant Miquel","restaurant"],[1.1222,-0.4362,"roba","Ortopèdia Hugué","medical_supply"],[2.6515,4.3631,"restaurant","Mízzica","restaurant"],[2.5551,4.7696,"roba","Objeto de Deseo","interior_decoration"],[2.6388,4.5862,"roba","Cruising Barcelona Bike Tour","rental"],[2.6409,4.5464,"roba","Norman Vilalta","shoes"],[2.6618,4.235,"restaurant","A Vocados","restaurant"],[2.5462,1.0509,"bar","Karamba","bar"],[1.2767,2.8122,"restaurant","Catering Chef","restaurant"],[1.1305,1.3017,"bar","Sips","bar"],[1.6836,2.0999,"restaurant","Pötstot","restaurant"],[4.8784,4.676,"bar","La Central - Cerveseria","cafe"],[0.7279,3.8592,"bar","La Sastrería","bar"],[2.656,3.7392,"roba","Surarquía","bag"],[2.5775,3.8014,"roba","Viatges El Corte Inglés","travel_agency"],[2.5475,3.8011,"perruqueria","La Suite","hairdresser"],[2.5619,3.976,"bar","Espit Chupitos","bar"],[2.5264,3.976,"fruteria","TotalEnergies","convenience"],[1.9941,4.1012,"roba","JC Moda","clothes"],[1.9896,4.1928,"roba","Halcón viatges","travel_agency"],[1.9836,4.3293,"bar","Revolución 30","bar"],[1.9779,4.4567,"perruqueria","Barberia Xavi Cuba","hairdresser"],[1.9808,4.4886,"perruqueria","Ivette Larriviere","beauty"],[1.9742,4.5597,"roba","Baseiria","clothes"],[0.9122,0.6376,"restaurant","Messié Pizza Sin Gluten","restaurant"],[2.9659,2.4631,"carnisseria","Delicatessen Argentina","butcher"],[2.0603,4.0135,"restaurant","Kūmi Café","restaurant"],[2.22,3.991,"bar","Lick","ice_cream"],[2.2452,3.9881,"bar","Myka","ice_cream"],[2.2967,3.987,"perruqueria","Isabel Alcaide","hairdresser"],[2.4557,3.9809,"roba","Lab-art","art"],[5.9347,2.6208,"roba","MAX&Co.","clothes"],[5.9634,2.5657,"roba","Maje","clothes"],[5.9929,2.4604,"roba","Hackett London","clothes"],[5.4819,4.4004,"roba","Marina Rinaldi","clothes"],[5.7306,3.4197,"roba","Brandy Melville","clothes"],[5.8807,4.4051,"roba","Punt Roma","clothes"],[-0.3262,0.1815,"roba","MEDIAactive","copyshop"],[3.1437,3.1001,"restaurant","Chin Chin","restaurant"],[4.8442,4.1193,"restaurant","Creps Barcelona","restaurant"],[4.0438,1.1794,"roba","Vinalium","alcohol"],[3.8012,1.5596,"bar","New Fizz","bar"],[4.1139,-0.6605,"bar","El Medi (Pub Mediterraneo)","bar"],[3.4429,3.7659,"farmacia","Farmàcia González-Meneses","pharmacy"],[4.5472,4.4757,"roba","Nudie Jeans","clothes"],[5.3696,4.6499,"roba","Muji","department_store"],[-0.2845,0.1501,"bar","COYOTE D7 POOL","bar"],[-0.2435,0.8072,"electro","Calbet","electronics"],[2.8426,0.8433,"restaurant","La gula argentina","fast_food"],[0.2752,2.707,"perruqueria","Carlos","hairdresser"],[-0.9008,2.4238,"roba","Turo Urban","clothes"],[-0.6958,2.4731,"forn","365","bakery"],[3.3924,3.7755,"roba","Marino Barcelona","clothes"],[2.9721,3.7915,"bar","Ripa Coffee","cafe"],[2.7027,0.8561,"restaurant","Darvaza","restaurant"],[3.7535,3.9301,"bar","On y Va Coffe","coffee"],[0.7974,3.8572,"bar","HB","bar"],[-0.2478,4.8916,"bar","Syra Coffee","coffee"],[1.2058,-0.9035,"bar","Syra Coffee","coffee"],[5.9162,1.9459,"roba","Beatriz Furest","clothes"],[5.8394,1.7841,"roba","celmència peris","jewelry"],[5.9262,1.7798,"roba","Camper","shoes"],[5.3867,1.9602,"roba","indi & cold","clothes"],[5.7381,1.9575,"roba","Castañer","shoes"],[5.4253,1.958,"roba","Sabon","cosmetics"],[5.8047,1.9473,"roba","Gerard Darel","clothes"],[5.3831,1.7941,"roba","Mikakus","shoes"],[5.4263,1.791,"roba","Platadepalo","clothes"],[5.4996,1.9559,"roba","Brindisi","clothes"],[5.543,1.9577,"roba","Florentino","clothes"],[5.6818,1.9581,"roba","Chocolat Factory","chocolate"],[5.9565,1.9465,"roba","Andres Sarda","clothes"],[5.7714,1.7814,"roba","Clínica dental grup Baldé","dentist"],[5.4746,1.7872,"roba","david valls","clothes"],[5.8698,1.7847,"optica","Mykita","optician"],[1.4687,4.0283,"restaurant","Hideout Burger","restaurant"],[-0.4898,3.9089,"bar","Xurreria San Roman","cafe"],[4.1893,4.4593,"bar","Bar Watson","cafe"],[0.3414,4.5727,"bar","Conese Beer Barcelona","bar"],[3.2438,2.759,"perruqueria","Hair Cut Day","hairdresser"],[2.982,2.0974,"bar","Oakberry Açai","ice_cream"],[5.1189,4.8318,"bar","Hi Cream","cafe"],[5.0587,4.8364,"roba","DHL","post_office"],[-0.0999,1.1521,"bar","Cafes Caracas","cafe"],[2.4806,1.0541,"roba","Taller Cai","car_repair"],[2.4836,0.0932,"restaurant","Pocha Barcelona","restaurant"],[2.9857,0.1723,"restaurant","Pibä","restaurant"],[1.0759,0.7198,"bar","Hemingway","bar"],[4.2248,2.731,"restaurant","Barna Bites","restaurant"],[2.3403,3.7997,"bar","Caua","cafe"],[1.9905,4.1559,"roba","Mundana","yes"],[1.0933,-0.6593,"restaurant","The Moment","restaurant"],[0.9086,-0.6813,"restaurant","La Tasqueta","restaurant"],[1.0899,-0.7436,"fruteria","Speed Express","convenience"],[0.3532,4.8253,"roba","Next","clothes"],[3.1854,3.7867,"restaurant","Los Tortillez","restaurant"],[3.7556,3.7227,"bar","Bar Stop","bar"],[3.7258,3.6834,"bar","Pink Corner","bar"],[1.8063,0.8699,"forn","Areca Bakery","bakery"],[-0.884,0.7939,"perruqueria","Xènia Barceló","beauty"],[2.1708,0.8602,"bar","Parodia","bar"],[0.5922,0.8549,"roba","Land Rover","car"],[2.7019,0.7805,"roba","Zabriskie Natura-outlet","gift"],[5.9958,3.9663,"roba","Ototech","clinic"],[0.6057,1.1834,"restaurant","Jobs","restaurant"],[4.4234,2.6723,"roba","Drim","toys"],[4.3184,2.7083,"fruteria","Colmado Quilez","deli"],[4.5879,2.7107,"fruteria","Supermercat 24","convenience"],[4.3528,2.7197,"restaurant","The Chicken Bar","fast_food"],[3.6813,2.3605,"bar","Carita Bonita","bar"],[3.8422,2.4571,"roba","Palau","collector"],[2.2803,3.8015,"perruqueria","The Beauty Fabrik","beauty"],[2.22,3.8062,"bar","Slay","bar"],[2.1844,3.8094,"bar","Elvira","cafe"],[2.1521,3.8134,"bar","Priscilla Cafè","bar"],[2.1149,3.8162,"fruteria","Alcaley","convenience"],[2.0537,3.7891,"restaurant","Lexi’s Restaurant & Cocktail","restaurant"],[2.3987,3.8009,"roba","Lalu & You Art","jewelry"],[5.95,4.2203,"roba","Art","art"],[2.1555,3.9916,"restaurant","Nomo","restaurant"],[2.3457,3.9845,"roba","Boxdepo","storage_rental"],[5.8332,1.2027,"roba","Ambrosia Spa","massage"],[-0.7137,2.1599,"perruqueria","Maria Izquierdo","beauty"],[-0.875,2.9241,"perruqueria","P&P Heaven Beauty","hairdresser"],[-0.7675,3.2436,"fruteria","Noel Supermercat","convenience"],[-0.7519,3.3345,"perruqueria","Nova Sensació Perruqueria","hairdresser"],[-0.758,3.2931,"perruqueria","Cris & Mon","hairdresser"],[-0.7771,3.1262,"bar","Nou Cent Quinze","bar"],[-0.6231,3.2712,"restaurant","El pescadito frito","restaurant"],[-0.274,3.537,"super","Foodcoop BCN","supermarket"],[0.1878,2.4615,"locutori","Right Way Mobile","mobile_phone"],[2.4561,4.7847,"roba","Viabizzuno","lighting"],[2.0464,1.7423,"forn","Santagloria","bakery"],[3.8073,1.5284,"forn","Pa amb Lola","bakery"],[0.5936,4.4841,"roba","Central Bike Barcelona","bicycle"],[4.3915,0.0741,"roba","Llibreria papereria Lamas","stationery"],[4.3175,0.0927,"restaurant","Por Sant","restaurant"],[4.4324,-0.7061,"bar","Syra","cafe"],[5.6365,0.8393,"roba","Simón Coll xocolaters","chocolate"],[3.2686,3.7824,"super","Primaprix","supermarket"],[-0.8429,1.4366,"restaurant","Croq & Roll Croqueteria","restaurant"],[2.9869,3.7938,"restaurant","Moimo","fast_food"],[2.8653,3.4745,"restaurant","Rincón de Vietnam","restaurant"],[4.3689,4.7036,"roba","Dormity.com","bed"],[4.2943,4.7061,"roba","Món Vínic","alcohol"],[2.936,0.6726,"bar","Hellosoft","ice_cream"],[2.9276,0.7232,"bar","Casa Florita","cafe"],[2.779,0.8682,"bar","Tellarer","bar"],[2.8113,1.0645,"bar","Cerveseria DNI","bar"],[2.8389,1.5054,"perruqueria","Llongueras","hairdresser"],[2.7273,2.4651,"banc","Caixabank","bank"],[3.3725,3.0152,"restaurant","Mama Chula","fast_food"],[2.4799,3.1207,"perruqueria","Angel Nails","beauty"],[2.6331,3.3035,"roba","Argila","lighting"],[3.0855,3.1736,"roba","Policlinica Letamendi","clinic"],[3.9847,4.8891,"optica","Óptica Universitaria","optician"],[1.8316,4.1461,"perruqueria","Javier Moreno","hairdresser"],[1.8232,4.0855,"restaurant","Bruma","restaurant"],[1.4223,4.0235,"restaurant","Picardia","restaurant"],[1.3416,4.0244,"roba","Mowgli","florist"],[0.4888,4.0573,"restaurant","Dionisos","restaurant"],[0.3937,3.8759,"roba","Barcode","clothes"],[-0.0378,3.902,"bar","Coffee with Bread","cafe"],[-0.0898,3.9088,"bar","Flor","ice_cream"],[-0.3658,3.9174,"roba","Casa Sors","musical_instrument"],[-0.5471,3.8574,"perruqueria","La Poupée","hairdresser"],[-0.3049,1.1195,"fruteria","Sinthia Super Alientació","convenience"],[-0.3068,0.7358,"restaurant","Grupo O'Retorno","restaurant"],[-0.5043,0.5289,"roba","Sant Joan de Déu","clinic"],[-0.8531,1.2672,"roba","Bio Pompas","chemist"],[-0.8149,1.6837,"perruqueria","Al Hassan","hairdresser"],[-0.0495,2.1226,"roba","Matea","clothes"],[0.1852,2.1577,"bar","Wen Zhang Bar","pub"],[0.171,2.1921,"roba","Leonidas","chocolate"],[3.2258,3.0255,"restaurant","Kevabrö","fast_food"],[4.9448,3.9041,"roba","TwoJeys","jewelry"],[3.7993,3.9347,"roba","Matiz de Color","paint"],[-0.6274,3.3275,"super","Wuakal","supermarket"],[-0.6749,4.8946,"restaurant","Vereda Bar","restaurant"],[4.1591,4.8797,"roba","Finestres","books"],[3.9356,2.7557,"fruteria","Supermercat","convenience"],[4.8311,1.7989,"fruteria","Supermercat","convenience"],[4.8893,1.7895,"roba","Montse Interiors","houseware"],[4.0457,1.803,"banc","Arquia Banca - Caixa Advocat","bank"],[4.8743,1.9864,"roba","Crisso","watches"],[4.4136,1.7996,"roba","LLENAS","clothes"],[4.9385,1.7844,"roba","Jacadi","clothes"],[4.726,1.7685,"roba","Quiromassatgista Jaume Campd","massage"],[4.6299,1.815,"perruqueria","Cinc Estetica","beauty"],[4.4958,1.8026,"restaurant","Mama","fast_food"],[4.1619,1.7029,"roba","imagine","clinic"],[4.9202,2.334,"bar","Starbucks","cafe"],[4.9643,2.0702,"roba","The Are","clothes"],[4.6878,3.6499,"roba","Aragaza","clothes"],[4.9279,2.2774,"banc","Banco Sabadell","bank"],[4.9555,2.1372,"roba","Women'secret","clothes"],[4.7964,2.6908,"roba","Nino Alvarez","clothes"],[4.9442,2.2019,"roba","algo bonito","clothes"],[5.2044,2.1958,"restaurant","Tapería Catalana","restaurant"],[3.8273,3.7572,"restaurant","La Bona Vida","restaurant"],[3.9581,3.926,"bar","Bilmonte gelato","ice_cream"],[2.3881,1.8588,"bar","Amo Brunch & Wine","cafe"],[3.2929,2.0021,"restaurant","Souvenir","restaurant"],[-0.6008,3.4965,"super","Rossmann","supermarket"],[2.1248,0.1734,"roba","texpartners","clothes"],[0.4561,3.8503,"roba","Addicted BCN New Experience","sports"],[0.3468,4.0772,"roba","Ad Fetish - Ad Party Store","clothes"],[1.987,3.664,"bar","GinGin Gay Queer Bar","bar"],[0.3602,3.8473,"bar","Plata Cocktail Bar","bar"],[1.586,4.7959,"bar","Honey Bears Barcelona","bar"],[1.1184,1.3722,"restaurant","Mundo Vegan","restaurant"],[2.655,4.321,"restaurant","SeaYou","fast_food"],[0.4076,3.8812,"restaurant","233 Grill & Wine","restaurant"],[0.8938,3.855,"roba","Espacio Zero","clothes"],[0.9207,3.8326,"perruqueria","Icus","hairdresser"],[0.9496,3.7954,"bar","delaCrem","ice_cream"],[0.9489,4.1032,"carnisseria","La Granja","butcher"],[1.225,3.8478,"locutori","recambiosmovil.com","mobile_phone"],[-0.0674,3.9104,"perruqueria","Salon 223","hairdresser"],[0.9324,1.5849,"restaurant","Pizzamarket","restaurant"],[4.0046,3.9157,"roba","Clínica Dental Lćpez Giménez","dentist"],[-0.6618,0.7552,"restaurant","El Punto","restaurant"],[2.7454,1.8152,"restaurant","Desoriente","restaurant"],[-0.4323,2.3909,"bar","Voyager Cocktail Bar | by CO","bar"],[1.3733,4.9991,"roba","Nostromo","erotic"],[5.074,3.708,"restaurant","Tapas Nolla","restaurant"],[0.9503,2.5034,"restaurant","Corgi cafe","restaurant"],[0.9503,2.5422,"roba","Corbacho","paint"],[0.9525,2.6857,"forn","Levaduramadre","bakery"],[0.9334,2.7589,"roba","Jewels and wine","fashion_accessories"],[0.8901,2.8128,"roba","Lovesexing.com","erotic"],[0.0938,3.2484,"restaurant","Bodega Borràs Restaurant","restaurant"],[1.8639,2.2434,"restaurant","Mad Mad Vegan - Barcelona","restaurant"],[2.7573,2.0653,"restaurant","Desoriente Eixample","restaurant"],[0.1997,-0.588,"roba","Clover","clothes"],[0.1914,-0.6524,"roba","Zeeman","clothes"],[2.7774,1.8006,"restaurant","Desoriente Eixample","restaurant"],[5.5083,0.7435,"roba","Thomas Sabo","jewelry"],[1.9159,0.7718,"restaurant","Smash","fast_food"],[1.9152,0.7881,"roba","Tea Lo\\ers Boutique","tea"],[1.7168,4.8238,"bar","Tentea","cafe"],[3.3359,4.9339,"roba","Vilardell","car_parts"],[0.8581,4.8499,"bar","Guten free lab","cafe"],[1.6007,1.0573,"restaurant","CHILA","restaurant"],[3.0517,2.5701,"roba","Luxdor","electrical"],[3.0241,2.5383,"restaurant","Pampero","restaurant"],[3.1532,2.6878,"bar","Petit Muu","pub"],[-0.8458,1.3543,"roba","Afrodita Masajes Eróticos Ba","massage"],[2.053,1.666,"roba","Daniel Chong","clothes"],[4.9108,2.3823,"roba","Skechers","shoes"],[4.8948,2.5072,"roba","IQOS","e-cigarette"],[4.221,3.9426,"restaurant","Blau i Verd","restaurant"],[5.4209,1.28,"roba","Bóboli","clothes"],[4.9537,2.0399,"roba","Jo Malone","perfumery"],[5.4207,1.3223,"roba","La Comet","clothes"],[5.4177,1.2988,"forn","elFornet","pastry"],[5.5858,0.8275,"roba","Novecento","jewelry"],[5.4272,1.1637,"roba","Bimba y Lola","clothes"],[5.3753,1.3853,"restaurant","Mar Terra","restaurant"],[5.61,1.0161,"roba","Infinity Dubai","jewelry"],[5.5317,4.1855,"roba","Isdin","cosmetics"],[5.6674,1.0143,"roba","sita murt/","clothes"],[5.1786,4.8391,"roba","Anjara","gift"],[4.7529,4.9113,"roba","Bexley","clothes"],[5.0868,4.8357,"fruteria","Super Drinks","convenience"],[5.5139,4.2617,"roba","Onitsuka Tiger","shoes"],[4.6379,4.0517,"super","DayDayGo","supermarket"],[-0.9618,2.389,"roba","La Malinche","books"],[1.5792,4.989,"perruqueria","Champions - Centro de Estéti","beauty"],[-0.3258,0.4752,"restaurant","Sushi He VI","restaurant"],[1.841,3.3758,"bar","Pepa Bar a Vins","bar"],[1.2301,4.8397,"bar","L'Ube Kape","cafe"],[1.6286,4.0359,"perruqueria","Barcelona Barber Shop","hairdresser"],[5.1517,4.8268,"bar","Charlie's Tea","cafe"],[5.1747,0.0609,"roba","Subdued Vintage","clothes"],[2.7036,3.6275,"roba","T.R.I.","collector"],[2.4845,1.848,"super","Kim Market","supermarket"],[0.9499,4.7996,"bar","Bar-Granja la Crema","bar"],[4.236,0.8527,"perruqueria","Minore Barber Eixample","hairdresser"],[1.6862,4.0628,"fruteria","Mercat Fresh","greengrocer"],[1.7219,4.0318,"bar","La Cova de la Mari","bar"],[1.7643,4.0431,"perruqueria","Minore Barber","hairdresser"],[1.7497,4.1117,"roba","Mineral del Urugay","jewelry"],[1.4349,3.7894,"perruqueria","Shalom Beauty Salon","hairdresser"],[1.4506,3.7265,"bar","Mito","cafe"],[0.2557,3.5035,"roba","Epsilon","books"],[3.1049,-0.679,"restaurant","Ponsa Restaurant","restaurant"],[0.9188,0.5982,"restaurant","koi koi restaurante japonés ","restaurant"],[0.8964,1.139,"bar","Bar Cafetería Saviq's","cafe"],[0.939,2.1501,"optica","Opticalia","optician"],[0.6645,2.0544,"roba","Navarro","herbalist"],[-0.4558,2.2037,"forn","L'Obrador","bakery"],[-0.4953,3.0959,"bugaderia","Tele Lavo","dry_cleaning"],[5.952,-0.8138,"bar","Good News","cafe"],[4.9808,3.304,"roba","Casas","shoes"],[0.8004,0.1057,"restaurant","Bar Gros","restaurant"],[3.1097,1.087,"restaurant","Silan","restaurant"],[-0.5249,0.6581,"roba","Mercat del Ninot","marketplace"],[1.7535,1.821,"restaurant","El Rincón Maya Restaurant","restaurant"],[1.2709,3.5053,"bar","Billy Brunch & Garden","cafe"],[5.9919,4.037,"roba","Philipp Plein","clothes"],[-0.7047,1.0491,"roba","Motorsol Volkswagen","car_repair"],[-0.1237, 3.1457, "super", "Carrefour Express", "convenience"],[-0.8604, 3.0979, "restaurant", "Creperie Les 3 Pommes", "restaurant"],[-0.7623, 3.929, "restaurant", "Shushi Yaki", "restaurant"],[-0.1451, 3.9056, "restaurant", "Oma Bistró", "restaurant"],[-0.0699, 3.8165, "bar", "Brewdog", "pub"],[-0.071, 3.4656, "super", "Lidl", "supermarket"],[-0.8757, 2.3277, "roba", "Müving", "motorcycle"],[-0.9316, 1.1977, "bar", "Plaza Café", "cafe"],[-0.9411, 1.4895, "restaurant", "Saiko", "restaurant"],[-0.1018, 1.5589, "farmacia", "Clarel", "chemist"],[-0.0805, 2.5054, "farmacia", "Farmàcia Anna M. Àlvarez Candau", "pharmacy"],[-0.4293, 3.077, "roba", "Control94 Honda: Ventas", "motorcycle"],[-0.4825, 2.5512, "roba", "Control94 BMW: Taller", "motorcycle_repair"],[-0.7309, 1.9189, "restaurant", "Latin Brunch", "restaurant"],[-0.7866, 1.9174, "roba", "Mallart", "dentist"],[-0.6829, 2.1057, "restaurant", "Podonamu", "restaurant"],[-0.1139, 2.6004, "restaurant", "The Fish & Chips Shop", "fast_food"],[-0.9157, 3.2219, "roba", "bang.mamut fábrica de cómics", "books"],[-0.9043, 2.4721, "forn", "365", "bakery"],[-0.8248, 3.9137, "bar", "Xurreria San Roman", "cafe"],[-0.1425, 1.1565, "bar", "Cafes Caracas", "cafe"],[-0.8875, 2.1587, "perruqueria", "Maria Izquierdo", "beauty"],[-0.9127, 3.2718, "restaurant", "El pescadito frito", "restaurant"],[-0.5345, 3.5473, "super", "Foodcoop BCN", "supermarket"],[-0.9376, 1.4342, "restaurant", "Croq & Roll Croqueteria", "restaurant"],[-0.2862, 3.9205, "bar", "Coffee with Bread", "cafe"],[-0.3486, 3.9257, "bar", "Flor", "ice_cream"],[-0.678, 3.926, "roba", "Casa Sors", "musical_instrument"],[-0.8876, 3.8605, "perruqueria", "La Poupée", "hairdresser"],[-0.9271, 1.265, "farmacia", "Bio Pompas", "chemist"],[-0.9388, 1.6814, "perruqueria", "Al Hassan", "hairdresser"],[-0.1647, 2.1321, "roba", "Matea", "clothes"],[-0.9239, 3.328, "super", "Wuakal", "supermarket"],[-0.322, 3.928, "perruqueria", "Salon 223", "hairdresser"],[-0.0856, 3.2669, "restaurant", "Bodega Borràs Restaurant", "restaurant"],[-0.7475, 3.0995, "bugaderia", "Tele Lavo", "dry_cleaning"]];

// =====================================================================
// EDIFICIOS: parcelas alrededor de cada manzana (fachada, planta baja con locales, medianeras, colisiones)
// =====================================================================
const BDEPTH=20;// profundidad edificable alrededor del patio de manzana
// ---------- rótulos: atlas 4x16 celdas de 512x128 ----------
// atlas de rótulos: 8x32 celdas de 384x96 (se dibujan como si fueran de 512x128)
const SG_COLS=16,SG_ROWS=40,SG_W=256,SG_H=64;// 640 celdas de 256x64 (4096x2560)
const SIGNC=document.createElement('canvas');SIGNC.width=SG_COLS*SG_W;SIGNC.height=SG_ROWS*SG_H;const sgc=SIGNC.getContext('2d');let signN=0;const SIGNIDX={};
function signCell(key,draw){if(SIGNIDX[key]!==undefined)return SIGNIDX[key];if(signN>=SG_COLS*SG_ROWS)return undefined;const i=signN++;const x=(i%SG_COLS)*SG_W,y=Math.floor(i/SG_COLS)*SG_H;sgc.save();sgc.translate(x,y);sgc.beginPath();sgc.rect(0,0,SG_W,SG_H);sgc.clip();sgc.scale(SG_W/512,SG_H/128);draw(sgc,512,128);sgc.restore();SIGNIDX[key]=i;return i;}
function textSign(key,text,bg,fg,o={}){return signCell(key,(g,w,h)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);if(o.stripe){g.fillStyle=o.stripe;g.fillRect(0,h-16,w,16);}
  if(o.border){g.strokeStyle=o.border;g.lineWidth=8;g.strokeRect(6,6,w-12,h-12);}
  g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';let fs=o.fs||74;const font=o.font||'Arial';g.font=`${o.weight||'bold'} ${fs}px ${font}`;while(g.measureText(text).width>w-(o.pad||50)&&fs>20){fs-=2;g.font=`${o.weight||'bold'} ${fs}px ${font}`;}
  if(o.cross){g.fillStyle='#19a347';const cx=70,cy=h/2;g.fillRect(cx-14,cy-40,28,80);g.fillRect(cx-40,cy-14,80,28);g.fillStyle=fg;g.fillText(text,w/2+40,h/2+4);}
  else g.fillText(text,w/2,h/2+(o.stripe?-6:4));
  // suciedad
  for(let i=0;i<40;i++){g.fillStyle=`rgba(40,30,20,${R(0.03,0.12)})`;g.beginPath();g.arc(R(0,w),R(0,h),R(4,30),0,7);g.fill();}});}
// ---------- comercios reales (OpenStreetMap): cada local toma el comercio que hay de verdad en ese punto de la calle ----------
let POIG=null;const POIUSED=new Set();
function poiGrid(){POIG=new Map();POIS.forEach((p,k)=>{const x=SX0+(p[0]+1)*BP,z=SZ0+p[1]*BP;p.x=x;p.z=z;p.k=k;const key=Math.floor(x/20)+','+Math.floor(z/20);let L=POIG.get(key);if(!L)POIG.set(key,L=[]);L.push(p);});}
function realShop(u,cx,cz,ux,uz,nx,nz,w){if(!POIG)poiGrid();let best=null,bd=1e9;const gx=Math.floor(cx/20),gz=Math.floor(cz/20);
  for(let i=gx-1;i<=gx+1;i++)for(let j=gz-1;j<=gz+1;j++){const L=POIG.get(i+','+j);if(!L)continue;for(const p of L){if(POIUSED.has(p.k))continue;const dx=p.x-cx,dz=p.z-cz;const along=dx*ux+dz*uz,inw=-(dx*nx+dz*nz);
      if(Math.abs(along)>w/2+4||inw<-9||inw>24)continue;const d=Math.abs(along)*1.5+Math.abs(inw-3)*0.5;if(d<bd){bd=d;best=p;}}}
  if(!best)return;const idx=poiSign(best);if(idx===undefined)return;POIUSED.add(best.k);u.shop.type=best[2]==='super'?'fruteria':best[2];u.shop.name=best[3];u.shop.signIdx=idx;
  u.shop.awning=['bar','restaurant','fruteria'].includes(u.shop.type)&&Math.random()<0.45;}
// rótulo de un comercio real: marcas conocidas con sus colores; el resto con estilos variados de rótulo de barrio (caja, letras sueltas, madera, neón apagado...)
const BRANDS=[[/caixabank|la caixa/i,'#ffffff','#007eae'],[/bbva/i,'#004481','#ffffff'],[/sabadell/i,'#ffffff','#0099cc'],[/santander/i,'#ec0000','#ffffff'],[/bankinter/i,'#ff6600','#ffffff'],[/\bing\b/i,'#ff6200','#ffffff'],[/ibercaja/i,'#003a70','#ffffff'],
  [/mercadona/i,'#ffffff','#0b8a3e','#f39200'],[/lidl/i,'#0050aa','#fff000'],[/bon ?preu/i,'#ffffff','#d50f25','#ffcc00'],[/condis/i,'#ffffff','#e3001b','#e3001b'],[/caprabo/i,'#d6001c','#ffffff'],[/consum/i,'#ffffff','#f07d00','#f07d00'],[/bon[àa]rea/i,'#ffffff','#2e8b3a','#2e8b3a'],
  [/aldi/i,'#00005f','#ffffff','#f8a71b'],[/spar/i,'#ffffff','#e2001a','#007a3d'],[/veritas/i,'#ffffff','#5c8a2b'],[/sorli/i,'#ffffff','#d3122a','#2b6cb0'],[/carrefour/i,'#ffffff','#1e4fa0','#e1001a'],[/dia\b/i,'#e3001b','#ffffff'],[/alcampo/i,'#ffffff','#e2001a','#009640'],
  [/zara\b/i,'#000000','#ffffff'],[/mango/i,'#ffffff','#000000'],[/starbucks/i,'#00704a','#ffffff'],[/mcdonald/i,'#da291c','#ffc72c'],[/burger king/i,'#502314','#ff8732'],[/telepizza/i,'#e30613','#ffffff'],[/rossmann/i,'#c3002f','#ffffff'],[/druni/i,'#1a1a1a','#e4007c'],
  [/farggi/i,'#5a2d1a','#f2e6c8'],[/caf[eè] de l.?ateneu/i,'#1a1a1a','#d8b86a'],[/365/,'#ffffff','#e2001a'],[/granier/i,'#4a2a17','#f2d39c'],[/fornet/i,'#7a1e1e','#ffffff']];
const SIGNSTY=[{bg:'#1a1a1a',fg:'#f2f2f2',font:'Georgia,serif',w:''},{bg:'#f4f1e8',fg:'#1a1a1a',font:'Georgia,serif',w:'bold'},{bg:'#0f3b5f',fg:'#ffffff',font:'Arial,sans-serif',w:'bold'},{bg:'#7a1e1e',fg:'#f2e6c8',font:'Georgia,serif',w:'bold'},
  {bg:null,fg:'#f0f0ea',font:'Arial,sans-serif',w:'bold',sh:true},{bg:null,fg:'#1c1c1c',font:'Georgia,serif',w:'',sh:true},{bg:null,fg:'#d8b86a',font:'Georgia,serif',w:'bold',sh:true},{bg:'#2e4a3a',fg:'#e8dcc0',font:'"Times New Roman",serif',w:'italic bold'},
  {bg:'wood',fg:'#f2e6c8',font:'Georgia,serif',w:'bold'},{bg:'#e8e4da',fg:'#b0302a',font:'Arial,sans-serif',w:'900'},{bg:'#111',fg:'#ff4fa0',font:'Arial,sans-serif',w:'bold',neon:true},{bg:'#c8a96a',fg:'#2a1a10',font:'Georgia,serif',w:'bold'},
  {bg:'#ffffff',fg:'#2a6db0',font:'Verdana,sans-serif',w:'bold'},{bg:'#3a3a3a',fg:'#f2c23a',font:'Arial,sans-serif',w:'bold'},{bg:null,fg:'#ffffff',font:'cursive',w:'bold',sh:true},{bg:'#5b2a4a',fg:'#f2e6f0',font:'Georgia,serif',w:''}];
const hashStr=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
function poiSign(p){const name=p[3],ty=p[2],h=hashStr(name);
  return signCell('poi:'+name,(g,w,hh)=>{const br=BRANDS.find(b=>b[0].test(name));let st,txt=name;
    if(br)st={bg:br[1],fg:br[2],font:'Arial Black,Arial,sans-serif',w:'900',stripe:br[3]};
    else if(ty==='farmacia')st={bg:'#ffffff',fg:'#19a347',font:'Arial,sans-serif',w:'bold',pharm:true};
    else{st=SIGNSTY[h%SIGNSTY.length];if(ty==='bar'&&h%3===0)txt=name.toUpperCase();if(h%5===0&&!st.neon)txt=txt.toUpperCase();}
    if(st.bg==='wood'){g.fillStyle='#5a3a22';g.fillRect(0,0,w,hh);for(let i=0;i<40;i++){g.strokeStyle=`rgba(30,15,5,${R(0.1,0.35)})`;g.lineWidth=R(1,3);g.beginPath();g.moveTo(0,R(0,hh));g.bezierCurveTo(w*0.3,R(0,hh),w*0.6,R(0,hh),w,R(0,hh));g.stroke();}}
    else if(st.bg){g.fillStyle=st.bg;g.fillRect(0,0,w,hh);}else g.clearRect(0,0,w,hh);
    if(st.stripe){g.fillStyle=st.stripe;g.fillRect(0,hh-16,w,16);}
    g.textAlign='center';g.textBaseline='middle';
    if(st.pharm){g.fillStyle='#19a347';g.fillRect(56,24,24,80);g.fillRect(28,52,80,24);g.font='bold 54px Arial,sans-serif';g.fillText('FARMÀCIA',w/2+50,hh*0.4);g.fillStyle='#1a1a1a';let f=26;g.font=`${f}px Arial,sans-serif`;g.fillText(txt.replace(/^farm[àa]cia\s*/i,'').slice(0,26),w/2+50,hh*0.78);return;}
    let fs=st.neon?70:84;const F=()=>`${st.w} ${fs}px ${st.font}`;g.font=F();while(g.measureText(txt).width>w-44&&fs>18){fs-=2;g.font=F();}
    if(st.sh){g.fillStyle='rgba(0,0,0,0.55)';g.fillText(txt,w/2+3,hh/2+6);}
    if(st.neon){g.shadowColor=st.fg;g.shadowBlur=14;}
    g.fillStyle=st.fg;g.fillText(txt,w/2,hh/2+(st.stripe?-4:3));g.shadowBlur=0;
    if(st.bg&&!st.neon)for(let i=0;i<30;i++){g.fillStyle=`rgba(40,30,20,${R(0.03,0.1)})`;g.beginPath();g.arc(R(0,w),R(0,hh),R(4,26),0,7);g.fill();}});}
// supermercados reales de Barcelona (solo el nombre con sus colores, sin logotipos)
const SUPERS=[
  {n:'Mercadona',s:()=>textSign('mercadona','MERCADONA','#ffffff','#0b8a3e',{stripe:'#f39200',font:'Arial Black'})},
  {n:'Lidl',s:()=>textSign('lidl','LIDL','#0050aa','#fff000',{border:'#e60a14',font:'Arial Black',fs:90})},
  {n:'Bonpreu',s:()=>textSign('bonpreu','bonpreu','#ffffff','#d50f25',{font:'Arial Black',weight:'',fs:84,stripe:'#ffcc00'})},
  {n:'Esclat',s:()=>textSign('esclat','esclat','#ffffff','#e85a0c',{font:'Arial Black',weight:'',fs:84,stripe:'#d50f25'})},
  {n:'Caprabo',s:()=>textSign('caprabo','Caprabo','#d6001c','#ffffff',{font:'Arial Black',weight:''})},
  {n:'Condis',s:()=>textSign('condis','Condis','#ffffff','#e3001b',{font:'Arial Black',weight:'',stripe:'#e3001b'})},
  {n:'Dia',s:()=>textSign('dia','Dia','#e3001b','#ffffff',{font:'Arial Black',fs:96})},
  {n:'Consum',s:()=>textSign('consum','Consum','#ffffff','#f07d00',{font:'Arial Black',weight:'',stripe:'#f07d00'})},
  {n:'Ametller Origen',s:()=>textSign('ametller','Ametller Origen','#1e3b2a','#ffffff',{font:'Georgia',fs:62})},
  {n:'Carrefour Express',s:()=>textSign('carrefour','Carrefour Express','#ffffff','#1e4fa0',{font:'Arial',stripe:'#e1001a',fs:60})},
  {n:'bonÀrea',s:()=>textSign('bonarea','bonÀrea','#ffffff','#2e8b3a',{font:'Arial Black',weight:'',stripe:'#2e8b3a'})},
  {n:'Sorli',s:()=>textSign('sorli','SORLI','#ffffff','#d3122a',{font:'Arial Black',fs:84,stripe:'#2b6cb0'})},
];
// comercios de barrio (nombres genéricos de rótulo, en catalán, como en la calle)
const SMALL=[
  {t:'farmacia',w:[4,6],sign:()=>textSign('farm','FARMÀCIA','#ffffff','#19a347',{cross:true,font:'Arial'}),enter:0.8},
  {t:'forn',w:[3.5,6],sign:()=>textSign('forn'+(Math.random()*3|0),pick(['FORN DE PA','FLECA','FORN I PASTISSERIA']),pick(['#6b3e1e','#f3e3c3','#3a2a1a']),pick(['#f6e7c8','#6b3e1e','#e8c67a']),{font:'Georgia'}),enter:0.75},
  {t:'bar',w:[4,8],sign:()=>textSign('bar'+(Math.random()*4|0),pick(['BAR','BAR · CAFETERIA','BAR RESTAURANT','CERVESERIA']),pick(['#1d2b3a','#7a1e1e','#2e3a2a','#111']),pick(['#f2e6c8','#ffffff','#e8c67a']),{font:'Georgia'}),enter:0.8},
  {t:'fruteria',w:[3.5,6],sign:()=>textSign('fruit','FRUITES I VERDURES','#2e6b2a','#ffffff'),enter:0.75},
  {t:'ferre',w:[4,7],sign:()=>textSign('ferre','FERRETERIA','#c8102e','#ffffff'),enter:0.8},
  {t:'estanc',w:[3,4.5],sign:()=>signCell('estanc',(g,w,h)=>{g.fillStyle='#8a4b12';g.fillRect(0,0,w,h);g.fillStyle='#f2c23a';g.fillRect(24,20,88,88);g.fillStyle='#8a4b12';g.font='bold 76px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('T',68,68);g.fillStyle='#f2c23a';g.font='bold 60px Arial';g.fillText('ESTANC',300,68);}),enter:0.7},
  {t:'carnisseria',w:[3.5,6],sign:()=>textSign('carn','CARNISSERIA','#8a1c1c','#ffffff',{font:'Georgia'}),enter:0.7},
  {t:'perruqueria',w:[3.5,6],sign:()=>textSign('perr','PERRUQUERIA','#111111','#e8c0d0',{font:'Georgia',weight:''}),enter:0.4},
  {t:'banc',w:[6,10],sign:()=>pick([()=>textSign('caixa','CaixaBank','#ffffff','#007eae'),()=>textSign('bbva','BBVA','#004481','#ffffff',{fs:90}),()=>textSign('sabadell','Banc Sabadell','#ffffff','#0099cc'),()=>textSign('santander','Santander','#ec0000','#ffffff')])(),enter:0.3},
  {t:'locutori',w:[3.5,5],sign:()=>textSign('locu','LOCUTORI · ENVIAMENTS','#f2d01e','#1a1a1a'),enter:0.4},
  {t:'bugaderia',w:[3.5,5],sign:()=>textSign('buga','BUGADERIA','#2b6cb0','#ffffff'),enter:0.4},
  {t:'optica',w:[3.5,5],sign:()=>textSign('opt','ÒPTICA','#ffffff','#1a1a1a',{font:'Georgia',weight:''}),enter:0.3},
  {t:'immo',w:[3.5,5],sign:()=>textSign('immo','IMMOBILIÀRIA','#0f3b5f','#ffffff'),enter:0.2},
  {t:'roba',w:[4,8],sign:()=>textSign('roba'+(Math.random()*2|0),pick(['MODA','BOTIGA']),'#1a1a1a','#ffffff',{font:'Georgia',weight:''}),enter:0.5},
  {t:'electro',w:[4,7],sign:()=>textSign('elec','ELECTRODOMÈSTICS','#ffffff','#e85a0c'),enter:0.5},
  {t:'restaurant',w:[5,9],sign:()=>textSign('rest'+(Math.random()*2|0),pick(['RESTAURANT','PIZZERIA']),pick(['#2a1a10','#7a1e1e']),'#f2e6c8',{font:'Georgia'}),enter:0.7},
];
const SMALLW=[['farmacia',6],['forn',6],['bar',12],['fruteria',6],['ferre',3],['estanc',3],['carnisseria',3],['perruqueria',4],['banc',4],['locutori',3],['bugaderia',2],['optica',2],['immo',3],['roba',4],['electro',2],['restaurant',4]];
function pickSmall(){let tot=0;for(const w of SMALLW)tot+=w[1];let r=Math.random()*tot;for(const w of SMALLW){r-=w[1];if(r<=0)return SMALL.find(s=>s.t===w[0]);}return SMALL[0];}
// planificación de supermercados por lado de manzana
const SUPERPLAN=new Map();
// ---------- materiales e instancias de planta baja ----------
MATS.shutter=photoMat('shutter',{ns:1,roughness:0.6,metalness:0.4});MATS.shutter_rust=photoMat('shutter_rust',{ns:1,roughness:0.7,metalness:0.3});
MATS.wood_door=photoMat('wood_door',{ns:0.6,roughness:0.6});MATS.wood_dark=photoMat('wood_dark',{ns:0.6,roughness:0.6});
for(const k of ['shutter','shutter_rust','wood_door','wood_dark'])weatherMat(MATS[k],0.7);
const signMatS=new THREE.MeshLambertMaterial({map:null,emissive:0xffffff,emissiveIntensity:0,side:THREE.DoubleSide});
// toldo
const texAwn=cTex(256,128,(g,w,h)=>{const c=pick(['#2e6b2a','#8a1c1c','#1d4f8a','#c8661a']);for(let x=0;x<w;x+=32){g.fillStyle=(x/32)%2?c:'#efe8d8';g.fillRect(x,0,32,h);}g.fillStyle='rgba(0,0,0,.18)';for(let i=0;i<30;i++){g.beginPath();g.arc(R(0,w),R(0,h),R(3,18),0,7);g.fill();}},{});
// relleno de huecos de planta baja: plano a la profundidad del hueco
function fillQuad(mat,a,ux,uz,nx,nz,u0,u1,y0,y1,dep,tint,usOverride){const p=[a[0]+ux*u0-nx*dep,a[1]+uz*u0-nz*dep],q=[a[0]+ux*u1-nx*dep,a[1]+uz*u1-nz*dep];const B=bufOf((p[0]+q[0])/2,(p[1]+q[1])/2,mat);TINT=tint||[1,1,1];
  wall(B,p[0],p[1],q[0],q[1],y0,y1,nx,nz,usOverride||US(mat==='shutter'||mat==='shutter_rust'?'shutter':mat==='wood_door'?'wood_door':mat==='wood_dark'?'wood_dark':'concrete'),u0);TINT=[1,1,1];}
const LOTS=[];
// ---------- generación de una fachada (segmento) ----------
// F: pisos sobre la planta baja; st: estilo; seg {a,b,nx,nz}; base y; units: planta baja [{u0,u1,kind,...}]
function buildFacade(lot,seg,units){const{a,b,nx,nz}=seg;const L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<0.5)return;const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;const st=lot.st,yb=lot.yb,gf=lot.gf,fh=lot.fh,F=lot.F;
  const top=yb+gf+F*fh+0.6;const yaw=Math.atan2(nx,nz);const tint=hexTint(lot.tint);const tPB=lot.pbTint;
  // planta baja con huecos
  const holes=units.map(u=>[u.u0,u.u1,u.y0||0,u.y1]);wallHoles(st.pb,a,b,nx,nz,yb-0.25,yb+gf,holes.map(h=>[h[0],h[1],h[2]+0.25,h[3]+0.25]),0.35,US(st.pb),tPB);
  // pisos superiores
  {const B=bufOf((a[0]+b[0])/2,(a[1]+b[1])/2,st.up);TINT=tint;wall(B,a[0],a[1],b[0],b[1],yb+gf,top,nx,nz,US(st.up));TINT=[1,1,1];}
  moldStrip(a,b,nx,nz,yb+gf-0.05,0.35,0.16,tint.map(v=>v*0.92));moldStrip(a,b,nx,nz,top-0.55,0.5,0.45,tint.map(v=>v*0.9));moldStrip(a,b,nx,nz,top-0.05,0.25,0.2,tint.map(v=>v*0.85));
  // ventanas y balcones por crujía
  const n=Math.max(1,Math.round(L/3.6));const bay=L/n;const contPrinc=lot.contBalc&&L>6;
  const lite=lot.bk.outer;
  for(let f=0;f<F;f++){const fy=yb+gf+f*fh;const topFloor=f===F-1;const wh=topFloor?1.75:(f===0?2.55:2.35),ww=topFloor?1.05:1.2;
    if(f===0&&contPrinc&&!lite){// balcón corrido del principal
      const cx=(a[0]+b[0])/2,cz=(a[1]+b[1])/2;addInst('balcSlab',cx,fy-0.02,cz,yaw,L-0.6,1,0.85,0,0,0,lot.tint);const nr=Math.max(1,Math.round((L-0.6)/1.6)),rw=(L-0.6)/nr;
      for(let r=0;r<nr;r++){const t=0.3+(r+0.5)*rw;addInst('balcRailF',a[0]+ux*t,fy+0.12,a[1]+uz*t,yaw,rw,1.0,0.85);}addInst('balcRailS',a[0]+ux*0.3,fy+0.12,a[1]+uz*0.3,yaw,1,1.0,0.85);addInst('balcRailS',a[0]+ux*(L-0.3),fy+0.12,a[1]+uz*(L-0.3),yaw,1,1.0,0.85);}
    for(let k=0;k<n;k++){const t=(k+0.5)*bay;const x=a[0]+ux*t+nx*0.015,z=a[1]+uz*t+nz*0.015;const wy=topFloor?fy+0.85:fy+0.06;
      let cell=(Math.random()*16)|0;if(Math.random()<0.55)cell=pick([0,1,8,12,2,3]);const lit=(cell===6||cell===7||cell===5||cell===13)?0:(Math.random()<0.18?1:0);
      addInst('win',x,wy,z,yaw,ww,wh,1,cell,lit);if(lite)continue;addInst('winFrame',x,wy,z,yaw,ww,wh,1,0,0,0,lot.trimHex);
      const balc=!topFloor&&!(f===0&&contPrinc)&&(lot.balcAll||f===0||Math.random()<0.75);
      if(balc){const bw=ww+0.55,bd=f===0?0.85:R(0.5,0.7);addInst('balcSlab',x,fy-0.02,z,yaw,bw,1,bd,0,0,0,lot.tint);addInst('balcRail',x,fy+0.12,z,yaw,bw,1.0,bd);
        if(Math.random()<0.18)addInst('maceta',x+ux*R(-0.4,0.4)+nx*bd*0.6,fy+0.12,z+uz*R(-0.4,0.4)+nz*bd*0.6,0);
        if(Math.random()<0.06)addInst('laundry',x+nx*(bd-0.05),fy+2.0,z+nz*(bd-0.05),yaw);}
      if(Math.random()<0.07)addInst('ac',x+ux*(ww/2+0.5)+nx*0.02,fy+1.6,z+uz*(ww/2+0.5)+nz*0.02,yaw);}}
  // grafitis en la planta baja (en pared y persianas)
  {const occ=units.map(u=>[u.u0-0.12,u.u1+0.12]).sort((p,q)=>p[0]-q[0]);let c0=0.35;const free=[];for(const [o0,o1] of occ){if(o0-c0>0)free.push([c0,o0]);c0=Math.max(c0,o1);}if(L-0.35-c0>0)free.push([c0,L-0.35]);
    for(const [f0,f1] of free){const fw=f1-f0;if(fw<1.1||Math.random()>0.5)continue;const s=Math.min(R(1.0,2.2),fw-0.15);const t=f0+fw/2+R(-1,1)*(fw-s)/2;const x=a[0]+ux*t+nx*0.02,z=a[1]+uz*t+nz*0.02;addInst('graffiti',x,yb+R(0.5,0.9)+s*0.5,z,yaw,s,s,1,(Math.random()*16)|0);}}
  // planta baja: unidades
  for(const u of units)buildUnit(lot,seg,u,ux,uz,L);
  lot.facades.push({a,b,nx,nz,L});FACADES.push({a,b,nx,nz,L,yb,gf,F:lot.F,fh:lot.fh,outer:lot.bk.outer});}
const FACADES=[];
// ---------- unidades de planta baja: portal, local (persiana / cristal / roto / tapiado), garaje ----------
function buildUnit(lot,seg,u,ux,uz,L){const{a,nx,nz}=seg;const yb=lot.yb;const yaw=Math.atan2(nx,nz);const mid=(u.u0+u.u1)/2;const cx=a[0]+ux*mid,cz=a[1]+uz*mid;const w=u.u1-u.u0;
  if(u.kind==='shop'&&u.shop&&!u.shop.brand)realShop(u,cx,cz,ux,uz,nx,nz,w);
  const sign=(idx,y)=>{if(idx===undefined)return;{const sw=Math.min(w*0.85,3.4);addInst('shopSign',cx+nx*0.08,y,cz+nz*0.08,yaw,sw,sw/4,1,idx);}};
  if(u.kind==='passage'){lot.bk.passage=passageInterior(lot,seg,u,ux,uz);addInst('shopSign',cx+nx*0.08,yb+u.y1+0.5,cz+nz*0.08,yaw,4.2,1.05,1,signCell('ninot'+lot.bk.i,(g,w,h)=>{g.fillStyle='#2c3a30';g.fillRect(0,0,w,h);g.fillStyle='#f2e6c8';g.font='bold 56px Georgia';g.textAlign='center';g.textBaseline='middle';g.fillText(lot.passageHere.name.toUpperCase(),w/2,h/2);}));}
  else if(u.kind==='portal'){fillQuad('wood_dark',a,ux,uz,nx,nz,u.u0,u.u1,yb,yb+u.y1,0.34);// portal de madera doble
    const dx=cx-nx*0.3,dz=cz-nz*0.3;addInst('portalDeco',dx,yb,dz,yaw,w/2.4,u.y1/3.6,1);
    if(Math.random()<0.6){const x=a[0]+ux*(u.u1+0.35)+nx*0.03,z=a[1]+uz*(u.u1+0.35)+nz*0.03;addInst('buzzer',x,yb+1.3,z,yaw);}}
  else if(u.kind==='garage'){fillQuad(Math.random()<0.5?'shutter':'shutter_rust',a,ux,uz,nx,nz,u.u0,u.u1,yb,yb+u.y1,0.3);addInst('vado',cx+nx*0.03,yb+u.y1+0.25,cz+nz*0.03,yaw);}
  else if(u.kind==='shop'){const s=u.shop;sign(s.signIdx,yb+u.y1+0.42);
    // banderolas perpendiculares a la fachada: cruz verde de farmacia, la «T» del estanco, cerveza en los bares
    {const bt=s.type==='farmacia'?'banCreu':s.type==='estanc'?'banEstanc':(s.type==='bar'||s.type==='restaurant')&&Math.random()<0.35?'banBirra':null;
      if(bt){const ed=Math.random()<0.5?u.u0+0.25:u.u1-0.25;addInst(bt,a[0]+ux*ed,yb+u.y1+0.95,a[1]+uz*ed,yaw);}}
    if(u.state==='closed'||u.state==='half'){const top=yb+u.y1;const half=u.state==='half'&&u.room;const y0=half?yb+1.15:yb;const sd=half?0.1:0.3;fillQuad(Math.random()<0.7?'shutter':'shutter_rust',a,ux,uz,nx,nz,u.u0,u.u1,y0,top,sd);
      if(Math.random()<0.75){const gh=Math.min(w*0.8*0.8,2.1,(top-y0)*0.86),gw=gh/0.8;addInst('graffiti',cx-nx*(sd-0.025),y0+(top-y0)*0.5,cz-nz*(sd-0.025),yaw,gw,gh,1,(Math.random()*16)|0);}
      if(half){solidBox(cx-nx*sd,cz-nz*sd,w/2,0.05,yaw,y0,top);makeShopInterior(lot,seg,u,ux,uz);}
      else solidBox(cx-nx*0.3,cz-nz*0.3,w/2,0.06,yaw+Math.PI/2*0,yb,top);}
    else if(u.state==='boarded'){fillQuad('wood_dark',a,ux,uz,nx,nz,u.u0,u.u1,yb,yb+u.y1,0.32,[0.5,0.45,0.4]);
      for(let y=yb+0.3;y<yb+u.y1-0.2;y+=R(0.35,0.6)){addInst('tablon',cx-nx*0.12,y,cz-nz*0.12,yaw+R(-0.15,0.15)*0+0,w*1.05,1,1,0,0,R(-0.12,0.12));}
      solidBox(cx-nx*0.2,cz-nz*0.2,w/2,0.12,yaw,yb,yb+u.y1);if(u.room)makeShopInterior(lot,seg,u,ux,uz,true);}
    else makeShopInterior(lot,seg,u,ux,uz);
    if(u.sup&&u.sup.bandit){const P2=(uu,ww)=>[a[0]+ux*uu-nx*ww,a[1]+uz*uu-nz*ww];u.sup.built={out:P2(mid,-3),in:P2(mid,(u.room.d)/2),ux,uz,nx,nz};}
    if(s.awning&&u.state!=='boarded'){addInst('toldo',cx+nx*0.05,yb+u.y1+0.05,cz+nz*0.05,yaw,w,1,1);}}}
// instancias de planta baja
defInst('shopSign',PLANE,new THREE.MeshLambertMaterial(),SG_COLS,SG_ROWS);// el material se crea al final con el atlas
const texBan=cTex(256,128,(g,w,h)=>{// celda 0: estanco; celda 1: cerveza
  g.fillStyle='#7a4210';g.fillRect(0,0,128,128);g.strokeStyle='#f2c23a';g.lineWidth=6;g.strokeRect(8,8,112,112);g.fillStyle='#f2c23a';g.font='bold 92px Georgia';g.textAlign='center';g.textBaseline='middle';g.fillText('T',64,70);
  g.fillStyle='#b8141c';g.fillRect(128,0,128,128);g.fillStyle='#f4ead2';g.beginPath();g.arc(192,64,50,0,7);g.fill();g.fillStyle='#b8141c';g.font='bold 30px Arial';g.fillText('CERVESA',192,58);g.font='bold 22px Arial';g.fillText('BAR',192,88);
  g.fillStyle='rgba(50,35,20,0.35)';for(let i=0;i<40;i++)g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*20,1+Math.random()*8);},{});
const banMat=new THREE.MeshLambertMaterial({map:texBan});
{const plate=(u0)=>{const g=new THREE.BoxGeometry(0.03,0.62,0.62);g.translate(0,0,0.45);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,u0+uv.getX(i)*0.5);return g;};
  const brk=new THREE.BoxGeometry(0.04,0.04,0.2);brk.translate(0,0.25,0.1);const brk2=brk.clone().translate(0,-0.5,0);const z=(g)=>{const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,0.02,0.02);return g;};
  defInst('banEstanc',mergeGeometries([plate(0),z(brk),z(brk2)]),banMat,1,1,false);defInst('banBirra',mergeGeometries([plate(0.5),z(brk),z(brk2)]),banMat,1,1,false);}
defInst('banCreu',mkG([[bx(0.06,0.62,0.2,0,0,0.42),0xffffff],[bx(0.06,0.2,0.62,0,0,0.42),0xffffff],[bx(0.08,0.66,0.24,0,0,0.42),0x0f6e2c],[bx(0.08,0.24,0.66,0,0,0.42),0x0f6e2c],[bx(0.04,0.04,0.12,0,0,0.06),0x333333]].map(([g,c],k)=>[k<2?g.scale(1.4,1,1):g,k<2?0x2fd25a:c])),new THREE.MeshLambertMaterial({vertexColors:true,emissive:0x0a3a14}),1,1,false);
defInst('portalDeco',mkG([[bx(0.06,3.2,0.04,0,1.6,0.02),0x2a1a10],[bx(2.4,0.08,0.05,0,3.2,0.02),0x2a1a10],[bx(0.18,0.05,0.05,-0.22,1.1,0.06),0xc9a227],[bx(0.18,0.05,0.05,0.22,1.1,0.06),0xc9a227],[bx(1.9,0.9,0.02,0,2.55,0.03),0x0c0e10]]),metalMat);
defInst('buzzer',mkG([[bx(0.16,0.32,0.04,0,0,0.02),0xa8a8a0],[bx(0.1,0.03,0.02,0,0.1,0.045),0x222222]]),metalMat);
defInst('vado',mkG([[bx(0.5,0.3,0.02,0,0,0.01),0x1d56a8],[bx(0.36,0.12,0.025,0,0.03,0.012),0xffffff]]),paintMat);
defInst('toldo',(()=>{const g=new THREE.PlaneGeometry(1,1.1);g.rotateX(-Math.PI/2+0.45);g.translate(0,-0.2,0.5);return g;})(),new THREE.MeshLambertMaterial({map:texAwn,side:THREE.DoubleSide}));

// ---------- parcelas de una manzana ----------
function lotStyle(){const st=pick(FACADE_STY);const tint=pick(st.tints);const c=new THREE.Color(tint);const trim=c.clone().lerp(new THREE.Color(1,1,1),0.35);
  return{st,tint,trimHex:'#'+trim.getHexString(),pbTint:hexTint(st.pb==='stone_dark'?'#d8d0c4':'#f2ede2'),F:RI(5,6),gf:R(4.4,4.9),fh:R(3.05,3.3),contBalc:Math.random()<0.55,balcAll:Math.random()<0.6};}
function buildBlock(bk){const{x0,x1,z0,z1}=bk;const D=BDEPTH,c=CHAMF;
  // lados: N (z0, normal -z), E (x1, +x), S (z1, +z), W (x0, -x). Cada uno: [inicio, fin] a lo largo de la fachada
  const sides=[{k:0,a:[x0+D,z0],b:[x1-D,z0],n:[0,-1],inw:[0,1],str:bk.str[0]},{k:1,a:[x1,z0+D],b:[x1,z1-D],n:[1,0],inw:[-1,0],str:bk.str[1]},
    {k:2,a:[x1-D,z1],b:[x0+D,z1],n:[0,1],inw:[0,-1],str:bk.str[2]},{k:3,a:[x0,z1-D],b:[x0,z0+D],n:[-1,0],inw:[1,0],str:bk.str[3]}];
  const vis=s=>!bk.outer||(s.str&&!s.str.outer&&s.str.n);
  const NIN=BASEPLAN.find(b=>b.kind==='mercat'&&b.bi===bk.i&&b.bj===bk.j);// el Mercat del Ninot ocupa la mitad de Mallorca de su manzana
  if(NIN){sides[1].b=[x1,z1-NINOT_CUT];sides[3].a=[x0,z1-NINOT_CUT];}
  const lots=[];
  for(const s of sides){if(!vis(s)||(NIN&&s.k===2))continue;const L=Math.hypot(s.b[0]-s.a[0],s.b[1]-s.a[1]);const ux=(s.b[0]-s.a[0])/L,uz=(s.b[1]-s.a[1])/L;
    // trocear en parcelas de 12-22 m
    const cuts=[0];let t=0;while(L-t>26){t+=R(12,21);cuts.push(t);}cuts.push(L);
    const sp=SUPERPLAN.get(bk.i+','+bk.j+','+s.k);
    for(let q=0;q<cuts.length-1;q++){const u0=cuts[q],u1=cuts[q+1];const A=[s.a[0]+ux*u0,s.a[1]+uz*u0],B=[s.a[0]+ux*u1,s.a[1]+uz*u1];
      const lot=Object.assign(lotStyle(),{bk,side:s,u0,u1,facades:[],rooms:[],A,B,ux,uz,n:s.n,inw:s.inw,corner:false});
      lot.yb=Math.max(H(A[0],A[1]),H(B[0],B[1]))+CURB+0.02;
      lot.superHere=sp&&q===Math.min(sp.lotIdx,cuts.length-2)?sp:null;
      const bpl=BASEPLAN.find(b=>b.bi===bk.i&&b.bj===bk.j&&b.side===s.k);lot.passageHere=bpl&&bpl.kind!=='mercat'&&q===Math.floor((cuts.length-1)/2)?bpl:null;if(lot.passageHere)lot.superHere=null;lots.push(lot);}}
  // esquinas (xamfrà): N-E, S-E, S-W, N-W
  const corners=[{a:[x1-D,z0],m1:[x1-c,z0],m2:[x1,z0+c],b:[x1,z0+D],sN:0,sE:1},{a:[x1,z1-D],m1:[x1,z1-c],m2:[x1-c,z1],b:[x1-D,z1],sN:1,sE:2},
    {a:[x0+D,z1],m1:[x0+c,z1],m2:[x0,z1-c],b:[x0,z1-D],sN:2,sE:3},{a:[x0,z0+D],m1:[x0,z0+c],m2:[x0+c,z0],b:[x0+D,z0],sN:3,sE:0}];
  for(const C of corners){const s1=sides[C.sN],s2=sides[C.sE];if(!vis(s1)&&!vis(s2))continue;if(NIN&&(C.sN===1||C.sN===2))continue;const lot=Object.assign(lotStyle(),{bk,corner:true,C,facades:[],rooms:[]});lot.F=RI(6,7);
    lot.yb=Math.max(H(C.m1[0],C.m1[1]),H(C.m2[0],C.m2[1]))+CURB+0.02;lots.push(lot);}
  // alturas similares entre vecinos, con alguna discordante (medianeras a la vista)
  for(const lot of lots)if(Math.random()<0.15)lot.F+=pick([-2,-1,1]);
  for(const lot of lots){LOTS.push(lot);if(lot.corner)buildCornerLot(lot);else buildSideLot(lot);}
  if(NIN)bk.ninot=buildNinot(bk);
  // medianeras: entre parcelas contiguas de distinta altura
  for(const lot of lots){if(lot.corner)continue;const top=l=>l.yb+l.gf+l.F*l.fh+0.6;}
}
function lotTop(l){return l.yb+l.gf+l.F*l.fh+0.6;}
function buildSideLot(lot){const s=lot.side;const L=lot.u1-lot.u0;const{A,B,ux,uz}=lot;const nx=s.n[0],nz=s.n[1];const D=BDEPTH;
  const P=(u,w)=>[A[0]+ux*u+s.inw[0]*w,A[1]+uz*u+s.inw[1]*w];const yb=lot.yb,gf=lot.gf;
  // planta baja: portal + locales (o supermercado)
  const units=[];const openH=Math.min(3.3,gf-0.9);
  if(lot.passageHere){const pw=4.2,pu=(L-pw)/2;units.push({u0:pu,u1:pu+pw,y1:Math.min(4.0,gf-0.4),kind:'passage'});
    for(const [f,t] of [[0.6,pu-0.6],[pu+pw+0.6,L-0.5]])if(t-f>2.5)units.push({u0:f,u1:t,y1:openH,kind:'shop',state:'closed',shop:{type:'x',signIdx:pickSmall().sign()}});}
  else if(lot.superHere){const sup=lot.superHere;const w=Math.min(L-1.2,sup.w||L-1.2);const u0=(L-w)/2;
    units.push({u0:u0,u1:u0+w,y1:openH,kind:'shop',state:sup.state,shop:{type:'super',name:sup.brand.n,signIdx:sup.brand.s(),brand:sup.brand,big:true},room:{d:Math.min(D-1.5,18)},sup});}
  else{const pw=R(2.2,2.6);const pu=R(0.15,0.75)*(L-pw);let cur=0.6;
    const addShops=(from,to)=>{let t=from;while(to-t>2.8){const sm=pickSmall();let w=Math.min(to-t-0.5,R(sm.w[0],sm.w[1]));if(to-t-w<3)w=to-t-0.5;if(w<2.4)break;
        const r=Math.random();const ent=Math.random()<sm.enter;const state=!ent?(r<0.75?'closed':'boarded'):(r<0.4?'glass':r<0.8?'broken':'half');
        const unit={u0:t,u1:t+w,y1:openH,kind:Math.random()<0.06?'garage':'shop',state,shop:{type:sm.t,signIdx:sm.sign(),awning:['bar','fruteria','forn','restaurant'].includes(sm.t)&&Math.random()<0.55},room:ent?{d:R(7,Math.min(14,D-2))}:null};
        if(unit.kind==='garage'){unit.y1=2.6;}units.push(unit);t+=w+R(0.6,1.2);}};
    addShops(cur,pu);units.push({u0:pu,u1:pu+pw,y1:Math.min(3.6,gf-0.5),kind:'portal'});addShops(pu+pw+0.6,L-0.5);}
  buildFacade(lot,{a:A,b:B,nx,nz},units);
  // colisión: parcela maciza salvo los locales con interior
  const rooms=units.filter(u=>u.roomBuilt).map(u=>[u.u0,u.u1,u.roomBuilt.d]);rooms.sort((p,q)=>p[0]-q[0]);
  const top=lotTop(lot);let cur=0;const box=(u0,u1,w0,w1)=>{if(u1-u0<0.05||w1-w0<0.05)return;const c0=P((u0+u1)/2,(w0+w1)/2);solidBox(c0[0],c0[1],(u1-u0)/2,(w1-w0)/2,Math.atan2(nx,nz),yb-2,top);};
  for(const r of rooms){box(cur,r[0],0,D);box(r[0],r[1],r[2],D);cur=r[1];}box(cur,L,0,D);
  // medianeras visibles (si el vecino de al lado es más bajo, se ve la pared lateral)
  for(const end of [0,L]){const p0=P(end,0),p1=P(end,D);const B2=bufOf(p0[0],p0[1],'concrete_wall');TINT=[0.92,0.9,0.86];const sx=end===0?-ux:ux,sz=end===0?-uz:uz;
    wall(B2,p0[0],p0[1],p1[0],p1[1],yb+gf,top,sx,sz,US('concrete_wall'));TINT=[1,1,1];}
  // tejado (losa con pretil) para que desde lo alto no se vea hueco
  {const Bq=bufOf(A[0],A[1],'concrete_wall');TINT=[0.7,0.68,0.64];capPoly(Bq,[P(0,0),P(L,0),P(L,D),P(0,D)],top,0.3);TINT=[1,1,1];}
  lot.units=units;}
function buildCornerLot(lot){const C=lot.C;const pts=[C.a,C.m1,C.m2,C.b];const yb=lot.yb;const c=centroid([...pts,[C.a[0]+(C.b[0]-C.m2[0])*0,0]]);
  // polígono de la parcela: a, m1, m2, b, esquina interior
  const inner=[C.a[0]+C.b[0]-((C.m1[0]+C.m2[0])/2-((C.m1[0]+C.m2[0])/2-C.a[0]))-C.a[0]+C.a[0],0];
  const ic=[C.b[0]===C.m2[0]?C.a[0]:C.b[0],C.a[1]===C.m1[1]?C.b[1]:C.a[1]];// esquina interior del cuadrado de esquina
  const poly=[C.a,C.m1,C.m2,C.b,ic];const cen=centroid(poly);
  const segs=[[C.a,C.m1],[C.m1,C.m2],[C.m2,C.b]];
  for(const [p,q] of segs){const ex=q[0]-p[0],ez=q[1]-p[1],l=Math.hypot(ex,ez);if(l<0.5)continue;let nx=ez/l,nz=-ex/l;if(nx*((p[0]+q[0])/2-cen[0])+nz*((p[1]+q[1])/2-cen[1])<0){nx=-nx;nz=-nz;}
    const units=[];const L=l;const openH=Math.min(3.3,lot.gf-0.9);
    if(L>12){// el xamfrà suele tener un local grande en la esquina: bar, banco o farmacia
      const sm=pick([SMALL.find(s=>s.t==='bar'),SMALL.find(s=>s.t==='banc'),SMALL.find(s=>s.t==='farmacia'),SMALL.find(s=>s.t==='restaurant')]);
      units.push({u0:1.2,u1:L/2-0.8,y1:openH,kind:'shop',state:pick(['closed','closed','boarded']),shop:{type:sm.t,signIdx:sm.sign()}},{u0:L/2+0.8,u1:L-1.2,y1:openH,kind:'shop',state:pick(['closed','boarded','closed']),shop:{type:sm.t,signIdx:sm.sign()}});}
    else if(L>4)units.push({u0:0.8,u1:L-0.8,y1:openH,kind:'shop',state:'closed',shop:{type:'x',signIdx:undefined}});
    buildFacade(lot,{a:p,b:q,nx,nz},units);}
  addPolyV(poly,yb-2,lotTop(lot));
  const Bq=bufOf(cen[0],cen[1],'concrete_wall');TINT=[0.7,0.68,0.64];capPoly(Bq,poly,lotTop(lot),0.3);TINT=[1,1,1];}
function finishSigns(){const t=new THREE.CanvasTexture(SIGNC);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;const m=atlasMat(t,t,SG_COLS,SG_ROWS,{alphaTest:0.4});m.polygonOffset=true;m.polygonOffsetFactor=-2;m.polygonOffsetUnits=-6;INST.shopSign.mat=m;SIGN_MAT=m;}
let SIGN_MAT=null;

// =====================================================================
// INTERIORES DE LOCALES: supermercados, farmacias, bares, hornos, fruterías, ferreterías...
// =====================================================================
MATS.floor_super=photoMat('floor_super',{ns:0.5,roughness:0.5});MATS.floor_hidraulic=photoMat('floor_hidraulic',{ns:0.4,roughness:0.6});MATS.floor_terrazo=photoMat('floor_terrazo',{ns:0.4,roughness:0.45});
MATS.floor_wood=photoMat('floor_wood',{ns:0.5});MATS.concrete=photoMat('concrete',{ns:0.5});
MATS.inner=new THREE.MeshLambertMaterial({vertexColors:true,map:ltex('plaster_grey_diff.jpg')});MATS.ceil=new THREE.MeshLambertMaterial({vertexColors:true,color:0xf4f1ea});
MATS.lightp=new THREE.MeshBasicMaterial({vertexColors:true});MATS.metal=metalMat;MATS.furn=new THREE.MeshLambertMaterial({vertexColors:true});MATS.woodf=photoMat('wood_dark',{ns:0.4});
MATS.glassb=glassMat;
const products=['ARRÒS','LLET','TONYINA','GALETES','AIGUA','CERVESA','OLI','PASTA','CAFÈ','SUC','LLEGUMS','XOCOLATA','CONSERVES','CEREALS','TOMÀQUET','SOPA'];
const texProducts=cTex(1024,1024,(g)=>{for(let k=0;k<16;k++){const x=(k%4)*256,y=Math.floor(k/4)*256;const hue=(k*47)%360;g.fillStyle=`hsl(${hue},55%,45%)`;g.fillRect(x,y,256,256);
  g.fillStyle=`hsl(${(hue+180)%360},60%,85%)`;g.fillRect(x+16,y+60,224,90);g.fillStyle='#111';g.font='bold 34px sans-serif';g.textAlign='center';g.fillText(products[k],x+128,y+118,210);
  g.fillStyle='#fff';g.font='bold 22px sans-serif';g.fillText(pick(['Hacendado','Nostrum','Bon Gust','La Masia','Ca l\'Avi','Estel','Delta','Gallo']),x+128,y+40);g.fillStyle=`hsl(${hue},50%,30%)`;g.fillRect(x,y+200,256,56);g.fillStyle='#fff';g.font='18px sans-serif';g.fillText(pick(['1 kg','500 g','1 L','6 x 33 cl']),x+128,y+235);}},{});
const prodMat=atlasMat(texProducts,null,4,4);
defInst('prodBox',(()=>{const g=new THREE.BoxGeometry(0.2,0.28,0.14);g.translate(0,0.14,0);return g;})(),prodMat,4,4);
defInst('prodCan',(()=>{const g=new THREE.CylinderGeometry(0.045,0.045,0.12,6);g.translate(0,0.06,0);return g;})(),prodMat,4,4);
defInst('prodBottle',(()=>{const g=new THREE.CylinderGeometry(0.04,0.045,0.3,5);g.translate(0,0.15,0);return g;})(),pbr(new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.15,metalness:0.1})));
const texFruit=cTex(256,256,(g,w,h)=>{g.fillStyle='#6b4a2a';g.fillRect(0,0,w,h);const c=pick(['#c8261a','#e8a020','#8ac83a','#e8d020','#6a2a6a']);for(let i=0;i<70;i++){const x=R(10,w-10),y=R(10,h-10),r=R(12,20);const gr=g.createRadialGradient(x-r*0.3,y-r*0.3,2,x,y,r);gr.addColorStop(0,'#fff8');gr.addColorStop(0.25,c);gr.addColorStop(1,'#0006');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();}},{});
defInst('fruit',(()=>{const g=new THREE.BoxGeometry(0.55,0.14,0.38);g.translate(0,0.07,0);return g;})(),new THREE.MeshLambertMaterial({map:texFruit}));
defInst('lightPanel',(()=>{const g=new THREE.PlaneGeometry(0.6,1.2);g.rotateX(Math.PI/2);return g;})(),new THREE.MeshBasicMaterial({color:0xe8eef0}));
function lootSpot(x,z,y,sub,label,refs){LOOT.push({x,z,y,kind:'cont',sub,label,looted:false,refs:refs||[]});}
// mueble: caja en un buffer con colisión
function furn(mat,x,y,z,w,h,d,yaw,col,coll=true,us){const B=bufOf(x,z,mat);TINT=hexTint(col);boxGeoInto(B,x,y+h/2,z,w,h,d,yaw,us||(mat==='woodf'?US('wood_dark'):1));TINT=[1,1,1];if(coll)addOBB(x,z,w/2,d/2,yaw,y,y+h);}
// ---------- construir el local detrás del hueco ----------
function makeShopInterior(lot,seg,u,ux,uz,boarded){INTERIOR=true;try{makeShopInterior2(lot,seg,u,ux,uz,boarded);}finally{INTERIOR=false;}}
function makeShopInterior2(lot,seg,u,ux,uz,boarded){const{a,nx,nz}=seg;const yb=lot.yb;const ix=-nx,iz=-nz;const d=u.room.d;const w=u.u1-u.u0;
  const P=(uu,ww)=>[a[0]+ux*uu+ix*ww,a[1]+uz*uu+iz*ww];const yF=yb+0.03;const ceil=yb+Math.min(lot.gf-0.25,4.0);const U0=u.u0-0.0,U1=u.u1+0.0;
  const ru0=u.u0-Math.min(0.6,u.u0),ru1=u.u1+0.4;// la sala es algo más ancha que el hueco
  const rp=[P(ru0,0.35),P(ru1,0.35),P(ru1,d),P(ru0,d)];const c=centroid(rp);const t=u.shop.type;
  // suelo, techo y paredes interiores
  const fm=t==='super'?'floor_super':t==='bar'||t==='restaurant'?'floor_hidraulic':t==='ferre'||t==='electro'?'concrete':pick(['floor_terrazo','floor_hidraulic','floor_terrazo']);
  {const B=bufOf(c[0],c[1],fm);TINT=[1,1,1];capPoly(B,rp,yF,US(fm));const Bc=bufOf(c[0],c[1],'ceil');capPoly(Bc,rp,ceil,0.5,true);}
  const Bi=bufOf(c[0],c[1],'inner');TINT=hexTint(t==='farmacia'?'#f4f6f2':t==='bar'?'#e8d8b8':'#efece4');
  const L1=P(ru0,0.35),L2=P(ru0,d),R1=P(ru1,0.35),R2=P(ru1,d);
  wall(Bi,L1[0],L1[1],L2[0],L2[1],yF,ceil,ux,uz,US('plaster_grey'));wall(Bi,R1[0],R1[1],R2[0],R2[1],yF,ceil,-ux,-uz,US('plaster_grey'));wall(Bi,L2[0],L2[1],R2[0],R2[1],yF,ceil,nx,nz,US('plaster_grey'));
  // cara interior del muro de fachada con el hueco
  wallHoles('inner',L1,R1,nx*-1,nz*-1,yF,ceil,[[u.u0-ru0,u.u1-ru0,0,u.y1]],0,US('plaster_grey'),hexTint('#efece4'));
  TINT=[1,1,1];addFloor(rp,yF);
  // luces del techo (paneles)
  for(let uu=ru0+1.2;uu<ru1-0.6;uu+=2.4)for(let ww=1.5;ww<d-0.5;ww+=2.8){const p=P(uu,ww);addInst('lightPanel',p[0],ceil-0.01,p[1],Math.atan2(ux,uz));}
  // frente: cristal + puerta
  const doorW=u.shop.big?2.0:1.0;const front=0.2;const doorU0=u.shop.big?(u.u0+u.u1)/2-doorW:u.u1-doorW-0.15;
  if(!boarded&&u.state!=='closed'){const broken=u.state==='broken'||u.state==='half';
    // escaparates fijos a ambos lados de la puerta
    const pw=[[u.u0+0.05,doorU0-0.05],[doorU0+doorW*(u.shop.big?2:1)+0.05,u.u1-0.05]];
    for(const [p0,p1] of pw){if(p1-p0<0.3)continue;const A=P(p0,front),B=P(p1,front);// zócalo + cristal
      furn('metal',(A[0]+B[0])/2,yb,(A[1]+B[1])/2,0.08,0.35,p1-p0,Math.atan2(ux,uz),'#3a3d40');
      makePane(A,B,yb+0.35,yb+u.y1-0.05,nx,nz,broken&&Math.random()<0.8);}
    // puerta (corredera doble en el súper, abatible de cristal en los demás)
    if(u.shop.big){const hp=P(doorU0,front);const dd1=makeSlideDoor({hx:hp[0],hz:hp[1],ux,uz,w:doorW,h:u.y1-0.1,y:yb,off:broken?doorW*R(0.3,0.9):0});
      const hp2=P(doorU0+doorW,front);const dd2=makeSlideDoor({hx:hp2[0],hz:hp2[1],ux,uz,w:doorW,h:u.y1-0.1,y:yb,off:0});dd2.ux=ux;dd2.uz=uz;dd2.mirror=true;
      if(u.state==='broken'){for(const d2 of [dd1,dd2]){d2.locked=false;}}}
    else{const hp=P(u.u1-0.15,front);const dr=makeDoor({hx:hp[0],hz:hp[1],ux:-ux,uz:-uz,w:doorW,h:Math.min(2.3,u.y1-0.05),y:yb,kind:'glass',sign:1,ang:broken?R(0.4,1.4):0,maxA:1.75});
      if(u.state==='glass'&&Math.random()<0.35)dr.locked=true;}
    if(broken){const p=P((u.u0+u.u1)/2,-0.6);addInst('shards',p[0],surfY(p[0],p[1])+0.003,p[1],R(0,6));const p2=P((u.u0+u.u1)/2,1.2);addInst('shards',p2[0],yF+0.003,p2[1],R(0,6));}}
  else if(u.state==='closed'){/* persiana: ya está puesta en la fachada */}
  u.roomBuilt={d};
  furnishShop(u,P,yF,ceil,ux,uz,nx,nz,ru0,ru1,d,c);
  SHOPS.push({x:P((u.u0+u.u1)/2,-1)[0],z:P((u.u0+u.u1)/2,-1)[1],type:t,name:u.shop.name||t,nx,nz});MAPD.shops.push({x:c[0],z:c[1],type:t});shopCount++;}
let shopCount=0;
// ---------- mobiliario según el tipo de comercio ----------
function furnishShop(u,P,yF,ceil,ux,uz,nx,nz,u0,u1,d,c){const t=u.shop.type;const yawF=Math.atan2(nx,nz),yawU=Math.atan2(ux,uz);const W=u1-u0;
  const looted=Math.random()<0.4;
  const shelf=(uu,ww,len,alongD,sub,label,prod)=>{// estantería doble de supermercado
    const p=P(uu,ww);const yaw=alongD?yawU:yawF;const sw=alongD?0.9:len,sd=alongD?len:0.9;
    furn('metal',p[0],yF,p[1],alongD?0.08:len,1.9,alongD?len:0.08,yawF,'#8a9096');
    for(let lv=0;lv<4;lv++){const B=bufOf(p[0],p[1],'metal');TINT=hexTint('#c8ccd0');boxGeoInto(B,p[0],yF+0.14+lv*0.46,p[1],alongD?0.9:len,0.03,alongD?len:0.9,yawF,1);}
    {const B=bufOf(p[0],p[1],'metal');TINT=hexTint('#e8eaec');boxGeoInto(B,p[0],yF+0.06,p[1],alongD?0.92:len,0.12,alongD?len:0.92,yawF,1);}
    addOBB(p[0],p[1],(alongD?0.9:len)/2,(alongD?len:0.9)/2,yawF,yF,yF+1.95);TINT=[1,1,1];
    const refs=[];const n=Math.max(2,Math.floor(len/0.24));const fill=looted?0.35:0.8;
    for(let lv=0;lv<4;lv++)for(let side=-1;side<=1;side+=2)for(let i=0;i<n;i++){if(Math.random()>fill)continue;const s=(i+0.5)/n-0.5;const ou=alongD?side*0.25:s*len,ow=alongD?s*len:side*0.25;
      const q=P(uu+ou,ww+ow);const py=yF+0.155+lv*0.46;const kind=prod==='bottle'?'prodBottle':prod==='can'?'prodCan':'prodBox';
      refs.push(addInst(kind,q[0],py,q[1],yawF+(side<0?Math.PI:0)+(alongD?Math.PI/2:0),1,1,1,(Math.random()*16)|0,0,0,kind==='prodBottle'?pick([0x2a7a3a,0xd8e8f0,0x6a3a1a,0xc8a040,0xb8d0e8]):undefined));}
    lootSpot(p[0],p[1],yF,sub,label,refs);
    // productos tirados por el suelo si está saqueado
    if(looted)for(let k=0;k<6;k++){const q=P(uu+R(-1.2,1.2),ww+R(-len/2,len/2));addInst(pick(['prodBox','prodCan']),q[0],yF,q[1],R(0,6),1,1,1,(Math.random()*16)|0,0,R(-1.5,1.5));}};
  if(t==='super'){const aisles=Math.max(1,Math.floor((W-2.5)/2.7));const len=Math.max(3,d-6.5);
    const subs=[['super_conservas','estantería de conservas','can'],['super_bebidas','estantería de bebidas','bottle'],['super_dulces','estantería de galletas y dulces','box'],['super_basicos','estantería de arroz, pasta y legumbres','box'],['super_higiene','estantería de higiene y limpieza','box']];
    for(let r=0;r<aisles;r++){const uu=u0+1.8+r*2.7;if(uu>u1-1.4)break;const sb=subs[r%subs.length];shelf(uu,3.4+len/2,len,true,sb[0],sb[1],sb[2]);}
    // neveras murales al fondo
    for(let uu=u0+0.6;uu<u1-1.6;uu+=2.1){const p=P(uu+1,d-0.45);furn('metal',p[0],yF,p[1],2.0,2.0,0.8,yawF,'#dfe3e5');const Bq=bufOf(p[0],p[1],'lightp');TINT=[0.82,0.92,1];
      const A=P(uu+0.08,d-0.86),B=P(uu+1.92,d-0.86);wall(Bq,A[0],A[1],B[0],B[1],yF+0.35,yF+1.85,nx,nz,1);TINT=[1,1,1];lootSpot(p[0],p[1],yF,'nevera_super','nevera');}
    // cajas registradoras junto a la entrada
    for(let k=0;k<Math.min(3,Math.floor(W/4));k++){const p=P(u0+1.6+k*2.6,1.9);furn('metal',p[0],yF,p[1],0.6,0.9,1.7,yawF,'#5a6066');const p2=P(u0+1.6+k*2.6,1.9);furn('furn',p2[0],yF+0.9,p2[1],0.4,0.25,0.35,yawF,'#222222',false);}
    for(let k=0;k<3;k++){const p=P(R(u0+1,u1-1),R(1.2,2.8));addInst('carro',p[0],yF,p[1],R(0,6));}
    for(let k=0;k<5;k++){const p=P(R(u0+0.8,u1-0.8),R(2.5,d-1.5));addInst('caja',p[0],yF,p[1],R(0,6));}}
  else if(t==='farmacia'){const p=P((u0+u1)/2,d*0.45);furn('woodf',p[0],yF,p[1],0.6,1.0,W-2.2,yawU,'#e8e4dc');const p2=P((u0+u1)/2,d-0.3);furn('furn',p2[0],yF,p2[1],W-0.6,2.4,0.4,yawF,'#f4f6f2');
    for(let lv=0;lv<5;lv++)for(let k=0;k<(W-0.8)/0.22;k++){if(Math.random()<(looted?0.6:0.2))continue;const q=P(u0+0.5+k*0.22,d-0.55);addInst('prodBox',q[0],yF+0.2+lv*0.45,q[1],yawF+Math.PI,0.6,0.5,0.6,(Math.random()*16)|0);}
    lootSpot(p2[0],p2[1],yF,'farmacia','estanterías de la farmacia');lootSpot(p[0],p[1],yF,'farmacia_mostrador','mostrador de la farmacia');}
  else if(t==='bar'||t==='restaurant'){const len=Math.max(2.5,d-3);const p=P(u0+1.2,1.6+len/2);furn('woodf',p[0],yF,p[1],0.65,1.1,len,yawF,'#7a4a28');
    const sh=P(u0+0.3,1.6+len/2);furn('woodf',sh[0],yF+1.0,sh[1],0.28,0.04,len,yawF,'#5a3a22',false);const refs=[];
    for(let i=0;i<len/0.2;i++){const q=P(u0+0.3,1.7+i*0.2);if(Math.random()<0.75)refs.push(addInst('prodBottle',q[0],yF+1.04,q[1],0,1,1,1,0,0,0,pick([0x2a7a3a,0x6a3a1a,0xc8a040,0xd8e8f0])));}
    lootSpot(p[0],p[1],yF,'bar','barra del bar',refs);
    for(let i=0;i<len/1.0;i++){const q=P(u0+2.0,2+i*1.0);furn('metal',q[0],yF,q[1],0.32,0.75,0.32,0,'#333333');}
    for(let ww=2.4;ww<d-1;ww+=2.4)for(let uu=u0+3.4;uu<u1-0.8;uu+=2.2){const q=P(uu,ww);if(Math.random()<0.3){addInst('terrassa',q[0],yF,q[1],R(0,6),1,1,1,0,0,Math.random()<0.4?R(1,1.4):0);}else addInst('terrassa',q[0],yF,q[1],R(0,6));}
    const k=P(u0+0.4,d-0.6);furn('metal',k[0],yF,k[1],0.6,0.9,1.6,yawF,'#c8ccd0');lootSpot(k[0],k[1],yF,'nevera','cámara del bar');}
  else if(t==='forn'||t==='carnisseria'){const p=P((u0+u1)/2,2.2);furn('woodf',p[0],yF,p[1],0.7,1.0,W-1.6,yawU,t==='forn'?'#c8b8a0':'#e8e8e8');
    const Bq=bufOf(p[0],p[1],'glassb');const A=P(u0+0.8,1.85),B=P(u1-0.8,1.85);wall(Bq,A[0],A[1],B[0],B[1],yF+1.0,yF+1.35,nx,nz,1);
    const p2=P((u0+u1)/2,d-0.35);furn('woodf',p2[0],yF,p2[1],W-0.6,2.0,0.45,yawF,'#b8a080');lootSpot(p[0],p[1],yF,t==='forn'?'forn_mostrador':'carnisseria','mostrador');lootSpot(p2[0],p2[1],yF,t==='forn'?'forn':'carnisseria','estantes');}
  else if(t==='fruteria'){for(let r=0;r<3;r++){const p=P(u0+1+r*((W-2)/2),d/2);furn('woodf',p[0],yF,p[1],0.9,0.8,d-3,yawF,'#8a6a42');
      for(let i=0;i<(d-3)/0.42;i++){if(Math.random()<(looted?0.6:0.1))continue;const q=P(u0+1+r*((W-2)/2),d/2-(d-3)/2+0.2+i*0.42);addInst('fruit',q[0],yF+0.8,q[1],yawF+Math.PI/2,1,1,1,0,0,0,pick([0xffffff,0xffe0d0,0xe0ffd0]));}
      lootSpot(p[0],p[1],yF,'fruteria','cajas de fruta');}}
  else if(t==='ferre'||t==='electro'){shelf(u0+1.0,d/2,Math.max(2,d-2.5),true,t==='ferre'?'ferre':'electro','estanterías','box');if(W>5)shelf(u1-1.0,d/2,Math.max(2,d-2.5),true,'ferre','estanterías','box');
    const p=P((u0+u1)/2,1.6);furn('woodf',p[0],yF,p[1],2.2,1.0,0.7,yawF,'#7a6a50');lootSpot(p[0],p[1],yF,'ferre_mostrador','mostrador');}
  else if(t==='banc'){// oficina bancaria: mostrador con mampara, mesas de gestor, cajero y sillas
    const p=P((u0+u1)/2,d*0.55);furn('woodf',p[0],yF,p[1],Math.max(1.5,W-2),1.05,0.7,yawU===yawU?yawF:yawF,'#e4e2dc');const Bq=bufOf(p[0],p[1],'glassb');const A=P(u0+1,d*0.55-0.3),B=P(u1-1,d*0.55-0.3);wall(Bq,A[0],A[1],B[0],B[1],yF+1.05,yF+1.9,nx,nz,1);
    for(let uu=u0+1.2;uu<u1-1;uu+=2.4){const q=P(uu,1.9);furn('woodf',q[0],yF,q[1],1.4,0.74,0.75,yawF,'#d8d4cc');const c2=P(uu,1.3);furn('metal',c2[0],yF,c2[1],0.45,0.85,0.45,yawF,'#1d4a8a');}
    const at=P(u0+0.35,0.9);furn('metal',at[0],yF,at[1],0.35,1.6,0.6,yawU,'#5a6066');lootSpot(p[0],p[1],yF,'mesita','mostrador del banco');}
  else if(t==='roba'){// tienda de ropa: burras con prendas y mostrador
    for(let ww=1.6;ww<d-1;ww+=1.6){const q=P((u0+u1)/2,ww);furn('metal',q[0],yF+1.4,q[1],Math.max(1,W-2.5),0.04,0.04,yawF,'#9a9ea2',false);
      for(let uu=u0+1.4;uu<u1-1.2;uu+=0.12){if(Math.random()<(looted?0.6:0.15))continue;const g=P(uu,ww);furn('furn',g[0],yF+0.75,g[1],0.08,0.62,0.42,yawU,pick(['#2a3a5a','#8a1a1a','#d8d0c0','#3a3a3a','#5a6a3a','#c8a080']),false);}}
    const p=P(u1-1.2,d-1.2);furn('woodf',p[0],yF,p[1],1.6,1.0,0.6,yawU,'#e8e4dc');lootSpot(p[0],p[1],yF,'mesita','mostrador');}
  else if(t==='perruqueria'){// sillones frente a espejos y lavacabezas
    for(let ww=1.5;ww<d-1.5;ww+=1.3){const m=P(u0+0.25,ww);furn('furn',m[0],yF+0.9,m[1],0.04,0.9,0.9,yawF,'#c8d4dc',false);const t2=P(u0+0.4,ww);furn('woodf',t2[0],yF+0.75,t2[1],0.35,0.05,1.0,yawF,'#e8e4dc');
      const c2=P(u0+1.2,ww);furn('metal',c2[0],yF,c2[1],0.55,0.95,0.55,yawF,'#1a1a1a');}lootSpot(P(u0+0.4,1.5)[0],P(u0+0.4,1.5)[1],yF,'mesita','tocador');}
  else if(t==='optica'||t==='immo'||t==='locutori'){// mesas con sillas y vitrinas en la pared
    for(let ww=1.8;ww<d-1;ww+=2.2){const q=P((u0+u1)/2,ww);furn('woodf',q[0],yF,q[1],1.3,0.74,0.75,yawF,'#d8d4cc');const c2=P((u0+u1)/2,ww-0.7);furn('metal',c2[0],yF,c2[1],0.45,0.85,0.45,yawF,'#3a3a3a');}
    const p2=P(u1-0.25,d/2);furn('furn',p2[0],yF,p2[1],0.35,2.0,d-2,yawF,'#f0eee8');lootSpot(p2[0],p2[1],yF,'mesita','vitrinas');}
  else if(t==='bugaderia'){// lavadoras en batería
    for(let ww=1.2;ww<d-0.8;ww+=0.7){const q=P(u0+0.4,ww);furn('metal',q[0],yF,q[1],0.65,0.9,0.6,yawF,'#e8e8e4');const q2=P(u1-0.4,ww);furn('metal',q2[0],yF,q2[1],0.65,0.9,0.6,yawF,'#e8e8e4');}}
  else{// genérico: mostrador + estantes
    const p=P((u0+u1)/2,Math.min(2.4,d*0.4));furn('woodf',p[0],yF,p[1],Math.max(1.2,W-2.2),1.0,0.6,yawF,'#a89070');const p2=P((u0+u1)/2,d-0.35);furn('furn',p2[0],yF,p2[1],W-0.6,2.1,0.4,yawF,'#d8d4cc');
    lootSpot(p[0],p[1],yF,t==='estanc'?'estanc':'mesita','mostrador');if(Math.random()<0.5)lootSpot(p2[0],p2[1],yF,'cocina','armario del fondo');}
  // un aseo al fondo en casi todos los locales
  if(d>8&&W>4&&t!=='super'){const p=P(u1-0.6,d-0.5);furn('furn',p[0],yF,p[1],0.42,0.42,0.6,yawF,'#f4f4f4');TOILETS.push({x:p[0],z:p[1],y:yF,kind:'baño'});}
  if(t==='super'){const p=P(u1-0.8,d-1.6);TOILETS.push({x:p[0],z:p[1],y:yF,kind:'baño'});}}

// =====================================================================
// LA CIUDAD ABANDONADA: hojas secas, basura, malas hierbas, hiedra en las fachadas y mobiliario volcado
// =====================================================================
// hojas de plátano secas (dibujadas con lóbulos, en ocres y marrones) con transparencia
const texLeafLitter=cTex(512,512,(g,w,h)=>{g.clearRect(0,0,w,h);const cols=['#8a5a24','#a8742e','#6e4a22','#b58a3e','#5a3e1c','#9a6a2a','#7a6a3a'];
  for(let i=0;i<70;i++){const x=R(30,w-30),y=R(30,h-30),s=R(10,24),a=R(0,6.28);g.save();g.translate(x,y);g.rotate(a);g.fillStyle=pick(cols);g.beginPath();
    for(let k=0;k<=10;k++){const t=k/10*Math.PI*2;const r=s*(0.55+0.45*Math.abs(Math.sin(t*2.5)));g.lineTo(Math.cos(t)*r,Math.sin(t)*r*0.9);}g.closePath();g.fill();
    g.strokeStyle='rgba(50,30,10,.6)';g.lineWidth=1.2;g.beginPath();g.moveTo(0,0);g.lineTo(s*0.9,0);g.moveTo(0,0);g.lineTo(-s*0.4,s*0.6);g.moveTo(0,0);g.lineTo(-s*0.4,-s*0.6);g.stroke();
    g.strokeStyle='#4a3014';g.beginPath();g.moveTo(0,0);g.lineTo(-s*1.2,0);g.stroke();g.restore();}},{});
texLeafLitter.wrapS=texLeafLitter.wrapT=THREE.ClampToEdgeWrapping;
const leafLitterMat=new THREE.MeshLambertMaterial({map:texLeafLitter,alphaTest:0.5,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
defInst('leafLitter',(()=>{const g=new THREE.PlaneGeometry(1.4,1.4);g.rotateX(-Math.PI/2);g.translate(0,0.008,0);return g;})(),leafLitterMat,1,1,false);
// malas hierbas: matas de hierba en cruz
const texWeed=cTex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<90;i++){const x=R(30,w-30),l=R(60,220);g.strokeStyle=pick(['#4a6a24','#5f7f2c','#3a5a1c','#7a8a3a','#8a8a4a']);g.lineWidth=R(2,5);
  g.beginPath();g.moveTo(x,h);g.quadraticCurveTo(x+R(-30,30),h-l*0.6,x+R(-50,50),h-l);g.stroke();}},{});
texWeed.wrapS=texWeed.wrapT=THREE.ClampToEdgeWrapping;
defInst('weed',(()=>{const a=new THREE.PlaneGeometry(0.7,0.5);a.translate(0,0.25,0);const b=a.clone();b.rotateY(Math.PI/2);return mergeGeometries([a,b]);})(),new THREE.MeshLambertMaterial({map:texWeed,alphaTest:0.45,side:THREE.DoubleSide}),1,1,false);
// hiedra colgando de las fachadas
const texIvy=cTex(256,512,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<9;i++){let x=R(20,w-20),y=0;g.strokeStyle='#3a2e1c';g.lineWidth=2;g.beginPath();g.moveTo(x,y);const pts=[];while(y<h*R(0.55,1)){x+=R(-14,14);y+=R(8,18);g.lineTo(x,y);pts.push([x,y]);}g.stroke();
  for(const [px,py] of pts)for(let k=0;k<3;k++){g.fillStyle=pick(['#2e4a1c','#3e5e24','#4a6a2a','#253e16','#5a6a2a']);g.beginPath();const lx=px+R(-14,14),ly=py+R(-8,8),s=R(5,10);g.moveTo(lx,ly-s);g.lineTo(lx+s,ly);g.lineTo(lx,ly+s*0.8);g.lineTo(lx-s,ly);g.closePath();g.fill();}}},{});
texIvy.wrapS=texIvy.wrapT=THREE.ClampToEdgeWrapping;
defInst('ivy',(()=>{const g=new THREE.PlaneGeometry(1,1);g.translate(0,-0.5,0);return g;})(),new THREE.MeshLambertMaterial({map:texIvy,alphaTest:0.5,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),1,1,false);
// papeles y plásticos
defInst('paper',(()=>{const g=new THREE.PlaneGeometry(0.28,0.2);g.rotateX(-Math.PI/2);g.translate(0,0.01,0);return g;})(),new THREE.MeshLambertMaterial({color:0xffffff}),1,1,false);
const LEAFCOL=[0xffffff,0xe8d8b8,0xd8c8a0,0xf0e0c0];
function decayWorld(){
  // hojas: alrededor de cada árbol y amontonadas junto al bordillo
  for(const t of TREES){const n=RI(3,7);for(let k=0;k<n;k++){const a=R(0,6.28),r=R(0.5,4.5);const x=t.x+Math.cos(a)*r,z=t.z+Math.sin(a)*r;addInst('leafLitter',x,surfY(x,z),z,R(0,6.28),R(0.7,1.6),1,R(0.7,1.6),0,0,0,pick(LEAFCOL));}
    if(Math.random()<0.6){const a=R(0,6.28);addInst('weed',t.x+Math.cos(a)*0.45,t.y,t.z+Math.sin(a)*0.45,R(0,6),R(0.6,1.3),R(0.6,1.4),R(0.6,1.3));}}
  // fachadas: hierba en la base, hiedra en algunas, papeles y bolsas en la acera
  for(const f of FACADES){if(f.outer)continue;const ux=(f.b[0]-f.a[0])/f.L,uz=(f.b[1]-f.a[1])/f.L;const yaw=Math.atan2(f.nx,f.nz);
    for(let t=R(1,5);t<f.L-1;t+=R(3,9)){const x=f.a[0]+ux*t+f.nx*0.15,z=f.a[1]+uz*t+f.nz*0.15;if(Math.random()<0.5)addInst('weed',x,surfY(x,z),z,R(0,6),R(0.5,1.2),R(0.4,1.1),R(0.5,1.2));
      if(Math.random()<0.3){const x2=f.a[0]+ux*t+f.nx*R(0.6,3),z2=f.a[1]+uz*t+f.nz*R(0.6,3);addInst('leafLitter',x2,surfY(x2,z2),z2,R(0,6),R(0.6,1.3),1,R(0.6,1.3),0,0,0,pick(LEAFCOL));}
      if(Math.random()<0.25){const x3=f.a[0]+ux*(t+R(-1,1))+f.nx*R(0.4,4),z3=f.a[1]+uz*(t+R(-1,1))+f.nz*R(0.4,4);addInst('paper',x3,surfY(x3,z3),z3,R(0,6),R(0.7,1.4),1,R(0.7,1.4),0,0,0,pick([0xf2f0e8,0xe8e0d0,0xd8e8f0,0xc8d8c0]));}}
    if(Math.random()<0.22&&f.L>6){const t=R(2,f.L-2),w=R(1.6,4),hh=R(3,Math.min(10,f.gf+f.fh*2));const top=Math.random()<0.5?f.yb+f.gf+f.fh*RI(0,2)+0.2:f.yb+hh;
      const x=f.a[0]+ux*t+f.nx*0.04,z=f.a[1]+uz*t+f.nz*0.04;addInst('ivy',x,top,z,yaw,w,Math.min(hh,top-f.yb),1);}}
  // mobiliario volcado o movido: papeleras tiradas, motos caídas
  for(const name of ['papelera']){const I=INST[name];for(const L of I.lists.values())for(const t of L){if(Math.random()<0.18){t[9]=R(1.3,1.6);t[1]+=0.22;t[3]+=R(-1,1);}}}
  for(const k of ['cont_resta','cont_organica','cont_envasos','cont_paper','cont_vidre']){const I=INST[k];if(!I)continue;for(const L of I.lists.values())for(const t of L){t[3]+=R(-0.25,0.25);t[0]+=R(-0.3,0.3);t[2]+=R(-0.3,0.3);}}
  // contenedores quemados o volcados, basura alrededor
  for(const k of ['cont_resta','cont_organica','cont_envasos','cont_paper','cont_vidre']){const I=INST[k];if(!I)continue;for(const L of I.lists.values())for(const t of L){const r=Math.random();
      if(r<0.12){addInst('contQuemado',t[0],t[1],t[2],t[3]);t[4]=t[5]=t[6]=0.0001;}else if(r<0.2){t[11]=(Math.random()<0.5?1:-1)*1.5;t[1]+=0.85;t[0]+=R(-0.4,0.4);}
      if(Math.random()<0.6){for(let n=0;n<RI(1,3);n++){const a=R(0,6.28),d=R(0.9,2.2);const x=t[0]+Math.cos(a)*d,z=t[2]+Math.sin(a)*d;addInst(pick(['bolsas','caja2','cajaPlana','bolsas']),x,surfY(x,z),z,R(0,6.28),R(0.8,1.2),R(0.8,1.2),R(0.8,1.2));}}}}
  // en aceras y calzadas: cajas, bolsas, ropa, maletas, colchones, ramas y algún árbol caído
  for(const bk of BLOCKS){if(bk.outer)continue;for(let e=0;e<8;e+=2){const a=bk.cp[e],b=bk.cp[(e+1)%8];const L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<10)continue;const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;const c=centroid(bk.bp);let nx=-uz,nz=ux;if(nx*((a[0]+b[0])/2-c[0])+nz*((a[1]+b[1])/2-c[1])<0){nx=-nx;nz=-nz;}
    for(let t=R(1,4);t<L-2;t+=R(1.8,5)){const d=R(-6,2.8);const x=a[0]+ux*t+nx*d,z=a[1]+uz*t+nz*d;const y=surfY(x,z);const r=Math.random();
      const k=r<0.22?'caja2':r<0.36?'cajaPlana':r<0.52?'bolsas':r<0.7?'ropa':r<0.76?'maleta':r<0.8?'colchon':'rama';addInst(k,x,y+(k==='colchon'?0.0:0),z,R(0,6.28),R(0.8,1.25),1,R(0.8,1.25));}
    if(Math.random()<0.18){const t=R(10,L-10);const x=a[0]+ux*t+nx*R(1,4),z=a[1]+uz*t+nz*R(1,4);addInst('tronco',x,H(x,z)+0.02,z,Math.atan2(-nz,nx)+R(-0.7,0.7));}}}
  // hojas acumuladas en la calzada junto al bordillo
  for(const bk of BLOCKS){if(bk.outer)continue;for(let e=0;e<8;e+=2){const a=bk.cp[e],b=bk.cp[(e+1)%8];const L=Math.hypot(b[0]-a[0],b[1]-a[1]);const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;const c=centroid(bk.bp);let nx=-uz,nz=ux;if(nx*((a[0]+b[0])/2-c[0])+nz*((a[1]+b[1])/2-c[1])<0){nx=-nx;nz=-nz;}
    for(let t=R(1,4);t<L;t+=R(2,6)){const x=a[0]+ux*t+nx*R(0.3,1.1),z=a[1]+uz*t+nz*R(0.3,1.1);addInst('leafLitter',x,H(x,z),z,R(0,6),R(0.8,1.8),1,R(0.6,1.2),0,0,0,pick(LEAFCOL));}}}}
// ---------- humo: columnas que salen de algunos edificios incendiados (billboards instanciados, baratos) ----------
const SMOKE_N=34,SMOKES=[];let smokeMesh=null;
const smokeMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uFog:{value:new THREE.Color()},uFar:{value:300},uDay:{value:1}},
  vertexShader:`attribute vec4 aP;attribute float aR;varying vec2 vUv;varying float vA;varying float vD;void main(){vUv=uv;vec4 mv=viewMatrix*vec4(aP.xyz,1.0);float c=cos(aR),s=sin(aR);vec2 q=mat2(c,-s,s,c)*position.xy;mv.xy+=q*aP.w;vD=-mv.z;vA=clamp(aR*0.0+1.0,0.0,1.0);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying vec2 vUv;varying float vD;uniform vec3 uFog;uniform float uFar,uDay;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    void main(){vec2 d=vUv-0.5;float r=length(d)*2.0;float m=n(vUv*4.0+vD*0.01)*0.6+n(vUv*9.0)*0.4;float a=smoothstep(1.0,0.2,r+(m-0.5)*0.6)*0.5;if(a<0.01)discard;
      vec3 c=mix(vec3(0.05,0.05,0.055),vec3(0.28,0.27,0.26),uDay)*(0.75+m*0.4);float f=clamp(vD/uFar,0.0,1.0);c=mix(c,uFog,f*0.85);gl_FragColor=vec4(c,a*(1.0-f*0.5));}`});
function setupSmoke(){const src=FACADES.filter(f=>!f.outer&&f.L>8);for(let k=0;k<6&&src.length;k++){const f=src.splice(RI(0,src.length-1),1)[0];const t=R(2,f.L-2);const ux=(f.b[0]-f.a[0])/f.L,uz=(f.b[1]-f.a[1])/f.L;
    SMOKES.push({x:f.a[0]+ux*t-f.nx*4,z:f.a[1]+uz*t-f.nz*4,y:f.yb+f.gf+f.fh*f.F+0.5,p:[]});}
  const g=new THREE.InstancedBufferGeometry();const pl=new THREE.PlaneGeometry(1,1);g.index=pl.index;g.attributes.position=pl.attributes.position;g.attributes.uv=pl.attributes.uv;
  const n=SMOKES.length*SMOKE_N;g.instanceCount=n;g.setAttribute('aP',new THREE.InstancedBufferAttribute(new Float32Array(n*4),4));g.setAttribute('aR',new THREE.InstancedBufferAttribute(new Float32Array(n),1));
  smokeMesh=new THREE.Mesh(g,smokeMat);smokeMesh.frustumCulled=false;smokeMesh.renderOrder=2;scene.add(smokeMesh);
  for(const s of SMOKES)for(let i=0;i<SMOKE_N;i++)s.p.push({t:Math.random()*14,o:R(0,6.28),sp:R(0.9,1.3)});}
function stepSmoke(dt,fogC,far,day){if(!smokeMesh)return;const P_=smokeMesh.geometry.attributes.aP,R_=smokeMesh.geometry.attributes.aR;let k=0;const wx=1.6,wz=0.6;
  for(const s of SMOKES)for(const q of s.p){q.t+=dt*q.sp;if(q.t>14)q.t-=14;const t=q.t;P_.setXYZW(k,s.x+wx*t*t*0.08+Math.sin(q.o+t*0.3)*0.6,s.y+t*2.2,s.z+wz*t*t*0.08+Math.cos(q.o+t*0.3)*0.6,2+t*1.5);R_.setX(k,q.o+t*0.15);k++;}
  P_.needsUpdate=true;R_.needsUpdate=true;smokeMat.uniforms.uFog.value.copy(fogC);smokeMat.uniforms.uFar.value=far;smokeMat.uniforms.uDay.value=day;}

// =====================================================================
// PUERTAS REALES (bisagra o corredera) Y CRISTALES QUE SE ROMPEN
// =====================================================================
const DOORS=[],PANES=[];
const doorFrameMat=pbr(new THREE.MeshStandardMaterial({color:0x3a3d40,roughness:0.4,metalness:0.7}));
const handleMat=pbr(new THREE.MeshStandardMaterial({color:0xc8c8c4,roughness:0.25,metalness:0.95}));
const doorWoodMat=photoMat('wood_door',{ns:0.5,roughness:0.55,vertexColors:false});
const doorPaintMat=pbr(new THREE.MeshStandardMaterial({color:0xe8e4da,roughness:0.5}));
// volumen dinámico (prisma de 4 lados) que se actualiza al moverse
function dynVol(){const v={k:1,P:[[0,0],[0,0],[0,0],[0,0]],E:[],x0:0,x1:0,z0:0,z1:0,y0:0,y1:0,dyn:true};return v;}
function setVolOBB(v,cx,cz,hw,hd,yaw,y0,y1){const c=Math.cos(yaw),s=Math.sin(yaw);const pts=[[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]].map(([a,b])=>[cx+a*c+b*s,cz-a*s+b*c]);
  let area=0;for(let i=0;i<4;i++){const a=pts[i],b=pts[(i+1)%4];area+=a[0]*b[1]-b[0]*a[1];}const P=area<0?pts.reverse():pts;v.P=P;v.E=[];v.x0=1e9;v.x1=-1e9;v.z0=1e9;v.z1=-1e9;
  for(let i=0;i<4;i++){const a=P[i],b=P[(i+1)%4];const ex=b[0]-a[0],ez=b[1]-a[1],l=Math.hypot(ex,ez)||1e-6;v.E.push([a[0],a[1],ez/l,-ex/l,b[0],b[1]]);v.x0=Math.min(v.x0,a[0]);v.x1=Math.max(v.x1,a[0]);v.z0=Math.min(v.z0,a[1]);v.z1=Math.max(v.z1,a[1]);}
  v.y0=y0;v.y1=y1;}
function insertDyn(v,cx,cz,r){VOL.push(v);const i0=Math.floor((cx-r-2.5)/VCG),i1=Math.floor((cx+r+2.5)/VCG),j0=Math.floor((cz-r-2.5)/VCG),j1=Math.floor((cz+r+2.5)/VCG);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=vk(i,j);let a=VG.get(k);if(!a)VG.set(k,a=[]);a.push(v);}}
// puerta: hinge (bisagra) en el suelo; u = dirección del panel cerrado; inward = lado hacia el que abre; kind: glass|wood|apt
function makeDoor(o){const{hx,hz,ux,uz,w,h,y,kind}=o;const g=new THREE.Group();g.position.set(hx,y,hz);const t=kind==='glass'?0.05:0.06;
  if(kind==='glass'){const fr=new THREE.Mesh(mkG([[bx(w,0.09,t,w/2,0.045,0),0xffffff],[bx(w,0.09,t,w/2,h-0.045,0),0xffffff],[bx(0.07,h,t,0.035,h/2,0),0xffffff],[bx(0.07,h,t,w-0.035,h/2,0),0xffffff],[bx(w,0.3,t,w/2,0.2,0),0xffffff]]),doorFrameMat);
    const gl=new THREE.Mesh(new THREE.PlaneGeometry(w-0.14,h-0.4),glassMat);gl.position.set(w/2,h/2+0.1,0);g.add(fr,gl);
    const hb=new THREE.Mesh(mkG([[cy(0.016,0.016,0.9,w-0.14,1.05,0.07,8),0xffffff],[bx(0.03,0.03,0.07,w-0.14,1.45,0.035),0xffffff],[bx(0.03,0.03,0.07,w-0.14,0.65,0.035),0xffffff],
      [cy(0.016,0.016,0.9,w-0.14,1.05,-0.07,8),0xffffff],[bx(0.03,0.03,0.07,w-0.14,1.45,-0.035),0xffffff],[bx(0.03,0.03,0.07,w-0.14,0.65,-0.035),0xffffff]]),handleMat);g.add(hb);}
  else{const pm=kind==='apt'?doorWoodMat:doorWoodMat;const p=new THREE.Mesh(new THREE.BoxGeometry(w,h,t),pm);p.position.set(w/2,h/2,0);g.add(p);
    // molduras (puerta de piso actual: lisa con 3 líneas; portal: cuarterones)
    const mold=[];if(kind==='apt'){for(const yy of [0.45,1.2,1.95])mold.push([bx(w-0.2,0.012,0.012,w/2,yy,t/2+0.006),0x3a2414],[bx(w-0.2,0.012,0.012,w/2,yy,-t/2-0.006),0x3a2414]);mold.push([cy(0.008,0.008,0.02,w-0.45,1.55,t/2+0.01,8,Math.PI/2),0xc0c0c0]);}
    else for(const yy of [0.6,1.6,2.6])mold.push([bx(w-0.25,0.7,0.025,w/2,yy,t/2+0.012),0x4a2e1a],[bx(w-0.25,0.7,0.025,w/2,yy,-t/2-0.012),0x4a2e1a]);
    if(mold.length)g.add(new THREE.Mesh(mkG(mold),paintMat));
    // manilla de palanca a ambos lados + escudo
    const hd=new THREE.Mesh(mkG([[bx(0.05,0.16,0.012,w-0.09,1.02,t/2+0.006),0xffffff],[cy(0.01,0.01,0.05,w-0.09,1.05,t/2+0.03,8,Math.PI/2),0xffffff],[bx(0.13,0.022,0.022,w-0.15,1.05,t/2+0.055),0xffffff],
      [bx(0.05,0.16,0.012,w-0.09,1.02,-t/2-0.006),0xffffff],[cy(0.01,0.01,0.05,w-0.09,1.05,-t/2-0.03,8,Math.PI/2),0xffffff],[bx(0.13,0.022,0.022,w-0.15,1.05,-t/2-0.055),0xffffff]]),handleMat);g.add(hd);}
  const base=Math.atan2(-uz,ux);const d={g,hx,hz,ux,uz,w,h,y,kind,base,sign:o.sign||1,ang:o.ang||0,vel:0,maxA:o.maxA||1.9,locked:!!o.locked,vol:dynVol(),held:null,target:null,handleU:w-0.1,lastSnd:0,slide:false};
  g.rotation.y=base+d.sign*d.ang;scene.add(g);insertDyn(d.vol,hx,hz,w+0.5);updateDoorVol(d);DOORS.push(d);return d;}
// corredera (súper): el panel se desplaza a lo largo de u
function makeSlideDoor(o){const d=makeDoor(Object.assign({},o,{kind:'glass'}));d.slide=true;d.off=o.off||0;d.maxOff=o.w*0.95;d.ang=0;d.sx=o.hx;d.sz=o.hz;applyDoor(d);return d;}
function applyDoor(d){if(d.slide){d.g.position.set(d.sx+d.ux*d.off,d.y,d.sz+d.uz*d.off);d.g.rotation.y=d.base;}else d.g.rotation.y=d.base+d.sign*d.ang;updateDoorVol(d);}
function updateDoorVol(d){const yaw=d.slide?d.base:d.base+d.sign*d.ang;const c=Math.cos(yaw),s=Math.sin(yaw);const px=d.slide?d.sx+d.ux*d.off:d.hx,pz=d.slide?d.sz+d.uz*d.off:d.hz;
  setVolOBB(d.vol,px+c*d.w/2,pz-s*d.w/2,d.w/2,0.05,yaw,d.y,d.y+d.h);}
function doorHandleWorld(d,out){const yaw=d.slide?d.base:d.base+d.sign*d.ang;const px=d.slide?d.sx+d.ux*d.off:d.hx,pz=d.slide?d.sz+d.uz*d.off:d.hz;return out.set(px+Math.cos(yaw)*d.handleU,d.y+1.05,pz-Math.sin(yaw)*d.handleU);}
// empuja una puerta cuando un cuerpo (jugador, zombi, mano) la toca
function pushDoorsAt(x,z,y,r,vx,vz,strength){for(const d of DOORS){if(d.locked||d.held)continue;const dx=x-d.hx,dz=z-d.hz;if(dx*dx+dz*dz>(d.w+r+0.6)**2)continue;if(y<d.y-0.3||y>d.y+d.h)continue;
    const yaw=d.slide?d.base:d.base+d.sign*d.ang;const c=Math.cos(yaw),s=-Math.sin(yaw);const px=d.slide?d.sx+d.ux*d.off:d.hx,pz=d.slide?d.sz+d.uz*d.off:d.hz;
    const t=clamp((x-px)*c+(z-pz)*s,0,d.w);const qx=px+c*t,qz=pz+s*t;const ex=x-qx,ez=z-qz,dist=Math.hypot(ex,ez);if(dist>r+0.08)continue;
    // normal del panel y sentido del empuje
    const nx=-s,nz=c;const side=Math.sign(ex*nx+ez*nz)||1;const into=-(vx*nx+vz*nz)*side;// velocidad hacia el panel
    if(d.slide)continue;// las correderas sin corriente solo se abren agarrándolas
    const push=Math.max(into,0.25)*strength*(t/d.w+0.3);d.vel+=-side*d.sign*push*1.2;}}
function stepDoors(dt){for(const d of DOORS){if(d.slide)continue;if(d.held)continue;
    if(d.target!==null){const e=d.target-d.ang;d.vel=e*5;if(Math.abs(e)<0.01){d.target=null;}}
    if(Math.abs(d.vel)<0.002&&d.target===null)continue;d.ang+=d.vel*dt;d.vel*=Math.pow(0.12,dt);
    if(d.ang<0){d.ang=0;if(Math.abs(d.vel)>0.6&&clockT-d.lastSnd>0.3){sfx('thud',clamp(Math.abs(d.vel)/3,0.2,0.8)*volAt(d.hx,d.hz,20));d.lastSnd=clockT;}d.vel=-d.vel*0.25;}
    if(d.ang>d.maxA){d.ang=d.maxA;d.vel=-d.vel*0.3;}applyDoor(d);}}
// cristal fijo (escaparate) que se puede romper con un golpe o un disparo
const paneMatBroken=new THREE.MeshLambertMaterial({map:null,color:0xffffff});
function makePane(a,b,y0,y1,nx,nz,broken){const L=Math.hypot(b[0]-a[0],b[1]-a[1]);const cx=(a[0]+b[0])/2,cz=(a[1]+b[1])/2;const yaw=Math.atan2(nx,nz);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(L,y1-y0),glassMat);m.position.set(cx,(y0+y1)/2,cz);m.rotation.y=yaw;scene.add(m);
  const v=addOBB(cx,cz,L/2,0.04,Math.atan2(b[0]-a[0],b[1]-a[1])-Math.PI/2,y0,y1);const p={m,v,cx,cz,y0,y1,L,yaw,nx,nz,broken:false,ax:a[0],az:a[1],bx:b[0],bz:b[1]};PANES.push(p);if(broken)breakPane(p,true);return p;}
function breakPane(p,silent){if(p.broken)return;p.broken=true;p.v.y0=p.v.y1=-9999;
  // quedan picos de cristal en el marco
  p.m.geometry.dispose();const sh=new THREE.Shape();const w=p.L/2,h=(p.y1-p.y0)/2;sh.moveTo(-w,-h);sh.lineTo(w,-h);sh.lineTo(w,-h+R(0.1,0.4));for(let i=0;i<6;i++)sh.lineTo(w-(i+0.5)*p.L/6,-h+R(0.05,0.35));sh.lineTo(-w,-h+R(0.1,0.4));sh.closePath();
  const sh2=new THREE.Shape();sh2.moveTo(-w,h);sh2.lineTo(w,h);sh2.lineTo(w,h-R(0.1,0.5));for(let i=0;i<5;i++)sh2.lineTo(w-(i+0.5)*p.L/5,h-R(0.05,0.45));sh2.lineTo(-w,h-R(0.1,0.4));sh2.closePath();
  p.m.geometry=new THREE.ShapeGeometry([sh,sh2]);
  addInstLive('shards',p.cx-p.nx*R(0.3,0.9),surfY(p.cx,p.cz)+0.002,p.cz-p.nz*R(0.3,0.9),R(0,6),Math.min(2,p.L*0.6));
  if(!silent){sfx('glass',volAt(p.cx,p.cz,40));makeNoise(p.cx,p.cz,30);for(let k=0;k<10;k++){const s=new THREE.Mesh(new THREE.PlaneGeometry(R(0.05,0.16),R(0.05,0.2)),glassMat);
      const pos=new V3(p.cx+(Math.random()-0.5)*p.L*0.8*Math.cos(p.yaw),R(p.y0,p.y1),p.cz-(Math.random()-0.5)*p.L*0.8*Math.sin(p.yaw));dropObj(s,pos,new V3(-p.nx*R(0.5,2)+R(-0.5,0.5),R(0,1.5),-p.nz*R(0.5,2)+R(-0.5,0.5)),false);}}}
// rayo contra cristales y puertas (para disparos)
function rayPanes(o,d,maxT){let best=null,bt=maxT;for(const p of PANES){if(p.broken)continue;const dx=p.cx-o.x,dz=p.cz-o.z;if(dx*dx+dz*dz>(maxT+p.L)**2)continue;const t=rayVol(o,d,p.v);if(t>=0&&t<bt){bt=t;best=p;}}return best?{p:best,t:bt}:null;}
// instancias añadidas en tiempo de juego (cristales en el suelo, casquillos...)
const LIVE={};function addInstLive(name,x,y,z,yaw,s=1){const I=INST[name];let L=LIVE[name];if(!L){L=LIVE[name]={im:new THREE.InstancedMesh(I.geo,I.mat,64),n:0};L.im.count=0;L.im.frustumCulled=false;scene.add(L.im);}
  const i=L.n++%64;_m.compose(_p.set(x,y,z),_q.setFromAxisAngle(UP,yaw),_s.set(s,s,s));L.im.setMatrixAt(i,_m);L.im.count=Math.min(64,L.n);L.im.instanceMatrix.needsUpdate=true;}

// =====================================================================
// MERCAT DEL NINOT (C. Mallorca 133-157, entre Villarroel y Casanova)
// Nave de 1933 (Antoni de Falguera) reformada en 2015 (Josep Lluís Mateo): cuerpo central alto con fachadas de ladrillo
// visto y un enorme vitral en arco (a Mallorca y al pasaje interior), tres cuerpos más bajos a cada lado cerrados con
// lamas metálicas perforadas que se abren abajo en paradas exteriores; dos patios a los lados a los que se entra por los
// xamfrans. Dentro, estructura metálica y paradas en dos ejes ortogonales. Aquí: abandonado, sucio y saqueado.
// =====================================================================
MATS.rust=photoMat('rust',{ns:0.9,roughness:0.75,metalness:0.35});weatherMat(MATS.rust,0.8);
const NINOT_DEPTH=48,NINOT_HW=37,NINOT_CUT=56;
// triángulos de una forma 2D (s a lo largo de U, t hacia arriba) a un buffer de la zona
function shapeInto(b,shape,ox,oz,ux,uz,y0,nx,nz,us){const g=new THREE.ShapeGeometry(shape,20);const p=g.attributes.position,ix=g.index.array;
  const flip=(-uz*nx+ux*nz)<0;// la normal de la forma (+Z local) apunta a U×Y=(-uz,0,ux)
  for(let i=0;i<ix.length;i+=3){const tri=flip?[ix[i],ix[i+2],ix[i+1]]:[ix[i],ix[i+1],ix[i+2]];
    for(const k of tri){const s=p.getX(k),t=p.getY(k);pushV(b,ox+ux*s,y0+t,oz+uz*s,nx,0,nz,s*us,(y0+t)*us);}}g.dispose();}
// cuadrilátero inclinado (tejados)
function quad3(b,A,B,C,D,us,down){const e1=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],e2=[D[0]-A[0],D[1]-A[1],D[2]-A[2]];let n=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];const l=Math.hypot(...n)||1;n=n.map(v=>v/l);
  let P=[A,B,C,D];if((n[1]<0)!==!!down){P=[A,D,C,B];n=n.map(v=>-v);}
  const L1=Math.hypot(...e1);const uv=q=>{const d=[q[0]-A[0],q[1]-A[1],q[2]-A[2]];return[(d[0]*e1[0]+d[1]*e1[1]+d[2]*e1[2])/L1*us,Math.hypot(d[0]-(d[0]*e1[0]+d[1]*e1[1]+d[2]*e1[2])/L1/L1*e1[0],d[1]-(d[0]*e1[0]+d[1]*e1[1]+d[2]*e1[2])/L1/L1*e1[1],d[2]-(d[0]*e1[0]+d[1]*e1[1]+d[2]*e1[2])/L1/L1*e1[2])*us];};
  for(const q of [P[0],P[1],P[2],P[0],P[2],P[3]]){const t=uv(q);pushV(b,q[0],q[1],q[2],n[0],n[1],n[2],t[0],t[1]);}}
// vitral en arco: retícula de hierro, cristal lechoso sucio, paneles rotos
const texNinotArch=cTex(512,512,(g,w,h)=>{g.clearRect(0,0,w,h);const cols=10,rows=11;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const x=c*w/cols,y=r*h/rows;const br=Math.random();if(br<0.16)continue;
    const a=br<0.24?0.35:0.82;const v=150+Math.random()*40;g.fillStyle=`rgba(${v+20|0},${v+10|0},${v-10|0},${a})`;g.fillRect(x,y,w/cols,h/rows);
    const gr=g.createLinearGradient(0,y,0,y+h/rows);gr.addColorStop(0,'rgba(60,50,35,0)');gr.addColorStop(1,`rgba(60,48,30,${0.25+Math.random()*0.4})`);g.fillStyle=gr;g.fillRect(x,y,w/cols,h/rows);
    if(br<0.35){g.strokeStyle='rgba(255,255,255,0.55)';g.lineWidth=1;g.beginPath();const cx=x+Math.random()*w/cols,cy=y+Math.random()*h/rows;for(let k=0;k<5;k++){g.moveTo(cx,cy);g.lineTo(cx+(Math.random()-0.5)*60,cy+(Math.random()-0.5)*60);}g.stroke();}}
  g.fillStyle='rgba(30,30,28,1)';for(let c=0;c<=cols;c++)g.fillRect(c*w/cols-3,0,6,h);for(let r=0;r<=rows;r++)g.fillRect(0,r*h/rows-3,w,6);
  g.fillStyle='rgba(40,42,40,1)';for(let c=0;c<=cols;c+=5)g.fillRect(c*w/cols-6,0,12,h);
  for(let i=0;i<40;i++){g.fillStyle=`rgba(40,30,20,${Math.random()*0.35})`;g.beginPath();g.arc(Math.random()*w,Math.random()*h,8+Math.random()*30,0,7);g.fill();}});
const ninotArchMat=new THREE.MeshLambertMaterial({map:texNinotArch,transparent:true,alphaTest:0.04,side:THREE.DoubleSide,depthWrite:false});
const texNinotLetters=cTex(1024,96,(g,w,h)=>{g.clearRect(0,0,w,h);g.font='bold 74px Helvetica, Arial, sans-serif';g.textBaseline='middle';
  const txt='MERCAT DEL NINOT';let x=40;for(const ch of txt){const cw=g.measureText(ch).width;if(ch!==' '&&Math.random()<0.1){x+=cw+6;continue;}// letras arrancadas
    const tilt=Math.random()<0.12?R(-0.25,0.25):0;g.save();g.translate(x+cw/2,h/2+(tilt?8:0));g.rotate(tilt);g.fillStyle='#2a2622';g.fillText(ch,-cw/2+3,3);g.fillStyle=pick(['#8a8478','#7d776c','#6f5a44']);g.fillText(ch,-cw/2,0);g.restore();x+=cw+6;}});
const ninotLetMat=new THREE.MeshLambertMaterial({map:texNinotLetters,transparent:true,alphaTest:0.3});
const ninotSkyMat=new THREE.MeshLambertMaterial({color:0xd8d4c8,emissive:0x4a4840,transparent:true,opacity:0.78,side:THREE.DoubleSide,depthWrite:false});
const NINOT_STALLS=[['Barra Perelló 1898','bar'],['La Bikineria','bar'],['Tierra','bar'],['Cuina El Ninot','bar'],['Fruites i Verdures Montse','fruta'],['Peix Fresc Ninot','peix'],['Carns Ramon','carn'],['Xarcuteria Pujol','carn'],
  ['Formatges i Embotits','carn'],['Ous i Aviram','ous'],['Bacallaneria','peix'],['Olives i Conserves','olives'],['Llegums Cuits','olives'],['Fleca del Mercat','fleca'],['Herbes i Espècies','olives'],['Congelats','peix'],['Marisc Gallec','peix'],['Fruites Tropicals','fruta']];
const STALLCOL={bar:'#3b2a1e',fruta:'#3e6b2a',peix:'#1f5a7a',carn:'#8a2a22',ous:'#c79a2a',olives:'#5e6a2a',fleca:'#9a6a2a'};
function ninotSign(name,type){return signCell('ninotst_'+name,(g,w,h)=>{g.fillStyle='#262829';g.fillRect(0,0,w,h);g.fillStyle=STALLCOL[type]||'#555';g.fillRect(0,h-16,w,16);
  g.fillStyle='#ece6d8';g.textAlign='center';g.textBaseline='middle';let fs=46;g.font=`bold ${fs}px Helvetica, Arial, sans-serif`;while(g.measureText(name).width>w-30&&fs>20){fs-=2;g.font=`bold ${fs}px Helvetica, Arial, sans-serif`;}g.fillText(name,w/2,h/2-6);
  g.fillStyle='rgba(60,45,30,0.35)';for(let i=0;i<14;i++)g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*30,1+Math.random()*12);});}

// geometría completa; bk = manzana, devuelve datos del campamento
function buildNinot(bk){const{x0,x1,z0,z1}=bk;const cx=(x0+x1)/2,F=z1,zb=F-NINOT_DEPTH,zc=F-NINOT_CUT;const yF=H(cx,F)+CURB+0.02;const D=BDEPTH,c=CHAMF;
  const naves=[[-37,-28,6.4,8.4],[-28,-19,7.2,9.3],[-19,-10,8.0,10.2],[-10,10,11.5,16.5],[10,19,8.0,10.2],[19,28,7.2,9.3],[28,37,6.4,8.4]];// [x0,x1,alero,cumbrera]
  const BRICK=hexTint('#c98a64'),SLAT=[0.86,0.88,0.87],ROOF=[0.62,0.58,0.54];
  // ---------- suelos exteriores: patios, pasaje y patio de manzana ----------
  const yG=(x,z)=>H(x,z)+CURB+0.01;
  const patios=[[[x0,zc],[cx-NINOT_HW,zc],[cx-NINOT_HW,F],[x0+c,F],[x0,F-c]],[[cx+NINOT_HW,zc],[x1,zc],[x1,F-c],[x1-c,F],[cx+NINOT_HW,F]],
    [[cx-NINOT_HW,zc],[cx+NINOT_HW,zc],[cx+NINOT_HW,zb],[cx-NINOT_HW,zb]],[[x0+D,z0+D],[x1-D,z0+D],[x1-D,zc],[x0+D,zc]]];
  patios.forEach((P,k)=>{const ctr=centroid(P);const m=k===2?'llambordes':k===3?'concrete':'panot4';TINT=k===3?[0.8,0.78,0.74]:[0.86,0.84,0.8];capPoly(bufOf(ctr[0],ctr[1],m),P,yG,US(m));TINT=[1,1,1];addFloor(P,0,yG);});
  // paredes traseras de las casas que dan al patio de manzana y testeros de las de Villarroel y Casanova
  {const tint=hexTint('#ddd2be');TINT=tint;const B=bufOf(cx,z0+D,'plaster_cream');
    wall(B,x0+D,z0+D,x1-D,z0+D,yG(cx,z0+D)-0.3,yG(cx,z0+D)+21,0,1,US('plaster_cream'));
    wall(B,x0+D,z0+D,x0+D,zc,yG(x0,zc)-0.3,yG(x0,zc)+19,1,0,US('plaster_cream'));wall(B,x1-D,z0+D,x1-D,zc,yG(x1,zc)-0.3,yG(x1,zc)+19,-1,0,US('plaster_cream'));
    TINT=[0.9,0.88,0.84];const Bc=bufOf(cx,zc,'concrete_wall');wall(Bc,x0,zc+0.02,x0+D,zc+0.02,yG(x0,zc)-0.3,yG(x0,zc)+4.95,0,1,US('concrete_wall'));wall(Bc,x1-D,zc+0.02,x1,zc+0.02,yG(x1,zc)-0.3,yG(x1,zc)+4.95,0,1,US('concrete_wall'));TINT=[1,1,1];
    for(const [xa,xb,zz,nx,nz] of [[x0+D,x1-D,z0+D,0,1]]){const L=xb-xa,n=Math.floor(L/3.3);for(let f=1;f<6;f++)for(let q=0;q<n;q++){const x=xa+(q+0.5)*L/n;addInst('win',x,yG(x,zz)+4.6+(f-1)*3.15,zz+0.02,Math.atan2(nx,nz),1.0,1.5,1,pick([2,3,4,0,1]),Math.random()<0.1?1:0);}}
    for(const [xx,nx] of [[x0+D,1],[x1-D,-1]]){const L=zc-(z0+D),n=Math.floor(L/3.3);for(let f=1;f<6;f++)for(let q=0;q<n;q++){const z=z0+D+(q+0.5)*L/n;addInst('win',xx+nx*0.02,yG(xx,z)+4.6+(f-1)*3.15,z,Math.atan2(nx,0),1.0,1.5,1,pick([2,3,4,0,1]),0);}}}
  // ---------- fachadas ----------
  const B=bufOf(cx,F,'brick'),Bs=bufOf(cx,F,'shutter'),Bsr=bufOf(cx,F,'shutter_rust'),Br=bufOf(cx,F-24,'rust');
  for(const [zz,nz,front] of [[F,1,true],[zb,-1,false]]){
    for(const [a,b2,E,Rr] of naves){const xa=cx+a,xb=cx+b2,xm=(xa+xb)/2,w=xb-xa;
      if(a===-10){// cuerpo central: ladrillo con el vitral en arco (el hueco baja hasta el suelo: la entrada)
        const s=new THREE.Shape();s.moveTo(-10,-0.8);s.lineTo(-7,-0.8);s.lineTo(-7,7.5);s.absarc(0,7.5,7,Math.PI,0,true);s.lineTo(7,-0.8);s.lineTo(10,-0.8);s.lineTo(10,E);s.lineTo(0,Rr);s.lineTo(-10,E);s.lineTo(-10,-0.8);
        TINT=BRICK;shapeInto(B,s,xm,zz,nz>0?1:-1,0,yF,0,nz,US('brick'));TINT=[0.78,0.6,0.5];shapeInto(B,s,xm,zz-nz*0.3,nz>0?1:-1,0,yF,0,-nz,US('brick'));TINT=[1,1,1];
        // pilastras, impostas y cornisa de piedra
        for(const px of [-10,-7.2,7.2,10])furn('stone_blocks',xm+px,yF-0.5,zz+nz*0.18,0.7,E+0.5+(Math.abs(px)<8?-3.5:0),0.36,0,'#d8cfc0',false);
        furn('stone_blocks',xm,yF+E-0.2,zz+nz*0.2,21,0.45,0.42,0,'#cfc6b6',false);
        // vitral (de 4 m hasta el arco) y travesaño con las letras
        const sg=new THREE.Shape();sg.moveTo(-7,4.4);sg.lineTo(7,4.4);sg.lineTo(7,7.5);sg.absarc(0,7.5,7,0,Math.PI,false);sg.lineTo(-7,4.4);
        const gg=new THREE.ShapeGeometry(sg,24);const uv=gg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)+7)/14,(uv.getY(i)-4.4)/10.1);
        const gm=new THREE.Mesh(gg,ninotArchMat);gm.position.set(xm,yF,zz-nz*0.12);gm.rotation.y=nz>0?0:Math.PI;gm.renderOrder=2;scene.add(gm);
        furn('stone_blocks',xm,yF+3.9,zz,14.2,0.55,0.5,0,'#c9c0b0',false);
        for(let k=-2;k<=2;k++){furn('woodf',xm+k*3.3,yF,zz-nz*0.15,0.14,3.9,0.14,0,'#2b2e2c',false);}// montantes de las puertas
        if(front){const lg=new THREE.PlaneGeometry(13,1.2);const lm=new THREE.Mesh(lg,ninotLetMat);lm.position.set(xm,yF+4.95,zz+nz*0.3);scene.add(lm);
          // persiana medio arrancada y puertas de cristal rotas
          for(let i=0;i<14;i++)addInst('shards',xm+R(-6,6),yF+0.02,zz+nz*R(-1.5,2),R(0,6.28));}
        else{TINT=[0.7,0.68,0.64];shapeInto(Bsr,(()=>{const q=new THREE.Shape();q.moveTo(-7,-0.8);q.lineTo(7,-0.8);q.lineTo(7,3.9);q.lineTo(-7,3.9);q.lineTo(-7,-0.8);return q;})(),xm,zz+nz*0.05,nz>0?1:-1,0,yF,0,nz,US('shutter_rust'));TINT=[1,1,1];}
        continue;}
      // cuerpos laterales: lamas metálicas (ahora mugrientas) y persianas de las paradas exteriores abajo
      const s=new THREE.Shape();s.moveTo(-w/2,-0.8);s.lineTo(w/2,-0.8);s.lineTo(w/2,E);s.lineTo(0,Rr);s.lineTo(-w/2,E);s.lineTo(-w/2,-0.8);
      TINT=SLAT;shapeInto(Bs,s,xm,zz,nz>0?1:-1,0,yF,0,nz,US('shutter')*0.6);TINT=[0.55,0.56,0.55];shapeInto(Bs,s,xm,zz-nz*0.12,nz>0?1:-1,0,yF,0,-nz,US('shutter')*0.6);TINT=[1,1,1];
      const sh=new THREE.Shape();sh.moveTo(-w/2+0.4,0);sh.lineTo(w/2-0.4,0);sh.lineTo(w/2-0.4,3.1);sh.lineTo(-w/2+0.4,3.1);sh.lineTo(-w/2+0.4,0);
      TINT=[0.82,0.8,0.76];shapeInto(Bsr,sh,xm,zz+nz*0.07,nz>0?1:-1,0,yF,0,nz,US('shutter_rust'));TINT=[1,1,1];
      furn('woodf',xm,yF+3.1,zz+nz*0.25,w-0.4,0.25,0.5,0,'#3a3c3a',false);// marquesina de la parada exterior
      if(Math.random()<0.8)addInst('graffiti',xm+R(-1.5,1.5),yF+1.6,zz+nz*0.1,nz>0?0:Math.PI,R(2,3.4),R(1.3,2),1,(Math.random()*16)|0);}}
  // fachadas laterales a los patios (lamas, persianas abajo y una puerta a cada patio)
  for(const sx of [-1,1]){const xx=cx+sx*NINOT_HW;const E=6.4;const dz0=F-9,dz1=F-4.6;
    for(const [za,zb2] of [[zb,dz0],[dz1,F]]){TINT=SLAT;wall(Bs,xx,za,xx,zb2,yF-0.8,yF+E,sx,0,US('shutter')*0.6);TINT=[0.55,0.56,0.55];wall(Bs,xx-sx*0.12,za,xx-sx*0.12,zb2,yF-0.8,yF+E,-sx,0,US('shutter')*0.6);TINT=[1,1,1];addOBB(xx,(za+zb2)/2,0.15,(zb2-za)/2,0,yF-1,yF+E);}
    TINT=SLAT;wall(Bs,xx,dz0,xx,dz1,yF+3.3,yF+E,sx,0,US('shutter')*0.6);TINT=[0.55,0.56,0.55];wall(Bs,xx-sx*0.12,dz0,xx-sx*0.12,dz1,yF+3.3,yF+E,-sx,0,US('shutter')*0.6);TINT=[1,1,1];
    for(let z=zb+2;z<dz0-3;z+=6){TINT=[0.8,0.78,0.74];wall(Bsr,xx+sx*0.07,z,xx+sx*0.07,z+4.6,yF,yF+3.0,sx,0,US('shutter_rust'));TINT=[1,1,1];if(Math.random()<0.6)addInst('graffiti',xx+sx*0.1,yF+1.5,z+2.3,sx>0?Math.PI/2:-Math.PI/2,R(2,3.2),R(1.2,1.9),1,(Math.random()*16)|0);}
    furn('woodf',xx+sx*0.2,yF+3.3,(dz0+dz1)/2,0.4,0.3,dz1-dz0+0.6,0,'#2b2e2c',false);}
  // colisión: frente (menos la entrada), fondo
  addOBB(cx-(NINOT_HW+7)/2,F-0.15,(NINOT_HW-7)/2,0.2,0,yF-1,yF+12);addOBB(cx+(NINOT_HW+7)/2,F-0.15,(NINOT_HW-7)/2,0.2,0,yF-1,yF+12);addOBB(cx,zb+0.15,NINOT_HW,0.2,0,yF-1,yF+12);
  // ---------- tejados ----------
  for(const [a,b2,E,Rr] of naves){const xa=cx+a,xb=cx+b2,xm=(xa+xb)/2;const za=zb-0.5,zz=F+0.5;
    for(const [xe,xr] of [[xa,xm],[xb,xm]]){const xe2=xe+(xe<xm?-0.3:0.3);
      const A=[xe2,yF+E-0.15,za],Bq=[xe2,yF+E-0.15,zz],C=[xr,yF+Rr,zz],Dq=[xr,yF+Rr,za];TINT=ROOF;quad3(Br,A,Bq,C,Dq,US('rust'));TINT=[0.32,0.3,0.28];quad3(Br,[xe,yF+E-0.25,za],[xe,yF+E-0.25,zz],[xr,yF+Rr-0.1,zz],[xr,yF+Rr-0.1,za],US('rust'),true);TINT=[1,1,1];}
    // claraboya lechosa a lo largo de la cumbrera
    const sg=new THREE.PlaneGeometry(2.2,NINOT_DEPTH-4);sg.rotateX(-Math.PI/2);const sm=new THREE.Mesh(sg,ninotSkyMat);sm.position.set(xm,yF+Rr-0.35,(zb+F)/2);scene.add(sm);}
  // paños entre naves de distinta altura (lucernarios)
  for(let k=0;k<naves.length-1;k++){const A=naves[k],Bn=naves[k+1];const x=cx+A[1];const lo=Math.min(A[2],Bn[2]),hi=Math.max(A[2],Bn[2]);if(hi-lo<0.3)continue;
    const g=new THREE.PlaneGeometry(NINOT_DEPTH,hi-lo);g.rotateY(Math.PI/2);const m=new THREE.Mesh(g,ninotSkyMat);m.position.set(x,yF+(hi+lo)/2,(zb+F)/2);scene.add(m);}
  // ---------- estructura metálica (una sola malla) ----------
  {const parts=[],GR=0x34463c;const rows=[];for(let z=F-4;z>zb+1;z-=8)rows.push(z);
    for(const [a,b2,E,Rr] of naves){const xa=a,xb=b2,xm=(a+b2)/2,w=b2-a;const ang=Math.atan2(Rr-E,w/2),rl=Math.hypot(w/2,Rr-E);
      for(const z of rows){const lz=z-(zb+F)/2;
        parts.push([bx(w,0.16,0.12,xm,E-0.6,lz),GR],[bx(rl,0.18,0.12,(xa+xm)/2,(E+Rr)/2-0.25,lz,0,0,ang),GR],[bx(rl,0.18,0.12,(xb+xm)/2,(E+Rr)/2-0.25,lz,0,0,-ang),GR],[bx(0.1,Rr-E+0.4,0.1,xm,(E+Rr)/2-0.6,lz),GR]);
        for(const f of [0.25,0.75]){const x=xa+w*f,top=E+(Rr-E)*(1-Math.abs(f-0.5)*2)-0.3;parts.push([bx(0.06,top-(E-0.6),0.06,x,(top+E-0.6)/2,lz,0,0,f<0.5?0.35:-0.35),GR]);}}
      parts.push([bx(0.14,0.2,NINOT_DEPTH,xm,Rr-0.45,0),GR],[bx(0.14,0.2,NINOT_DEPTH,xa+0.2,E-0.5,0),GR],[bx(0.14,0.2,NINOT_DEPTH,xb-0.2,E-0.5,0),GR]);}
    for(const x of [-28,-19,-10,10,19,28])for(const z of rows){const lz=z-(zb+F)/2;const E=Math.max(...naves.filter(n=>n[0]===x||n[1]===x).map(n=>n[2]));
      parts.push([cy(0.13,0.16,E,x,E/2,lz,8),GR],[bx(0.42,0.3,0.42,x,0.15,lz),0x5a5a54],[bx(0.6,0.12,0.6,x,E-0.65,lz),GR]);addBoxV(cx+x-0.16,cx+x+0.16,z-0.16,z+0.16,yF,yF+E);}
    const m=landmarkMesh(mkG(parts),paintMat);m.position.set(cx,yF,(zb+F)/2);}
  // ---------- suelo interior ----------
  {const P=[[cx-NINOT_HW,zb],[cx+NINOT_HW,zb],[cx+NINOT_HW,F],[cx-NINOT_HW,F]];INTERIOR=true;TINT=[0.66,0.62,0.56];capPoly(bufOf(cx,F-24,'floor_terrazo'),P,yF,US('floor_terrazo'));TINT=[1,1,1];INTERIOR=false;addFloor(P,yF);}
  // ---------- paradas: islas en dos ejes ortogonales ----------
  INTERIOR=true;let si=0;const nameOf=()=>NINOT_STALLS[(si++)%NINOT_STALLS.length];
  const xb2=[[2.6,9.4],[12.6,19.4],[22.6,29.4]],zb3=[[10,18],[21,29],[33,41]];
  for(const sx of [-1,1])for(const [u0,u1] of xb2)for(const [v0,v1] of zb3){const ix=cx+sx*(u0+u1)/2,iz=F-(v0+v1)/2,W=u1-u0,Dd=v1-v0;
    addOBB(ix,iz,W/2,Dd/2,0,yF,yF+1.2);// la isla es maciza a la altura de los mostradores
    furn('floor_super',ix,yF,iz,0.25,2.3,Dd-0.4,0,'#d9d4c8',false,3.3);furn('floor_super',ix,yF,iz,W-0.4,2.3,0.25,0,'#d9d4c8',false,3.3);// tabiques de azulejo entre paradas
    for(const qx of [-1,1])for(const qz of [-1,1]){const [nm,ty]=nameOf();const px=ix+qx*W/4,pz=iz+qz*Dd/4;const fx=ix+qx*(W/2-0.4),fz=iz+qz*(Dd/2-0.4);
      const col=ty==='peix'?'#c9cfd2':ty==='bar'?'#5a3a24':'#bdb6a8';const mat=ty==='bar'?'woodf':'floor_super';
      const tipped=Math.random()<0.12;
      const us2=mat==='woodf'?undefined:3.3;furn(mat,fx,yF,pz,0.7,tipped?0.5:0.95,Dd/2-0.5,tipped?0.4:0,col,false,us2);furn(mat,px,yF,fz,W/2-0.5,0.95,0.7,0,col,false,us2);// mostrador en L hacia los dos pasillos
      furn('granite',fx,yF+0.95,pz,0.8,0.05,Dd/2-0.45,0,'#8a8680',false);
      const sign=ninotSign(nm,ty);if(sign!==undefined){addInst('shopSign',fx+qx*0.45,yF+2.75,pz,qx>0?Math.PI/2:-Math.PI/2,2.6,0.65,1,sign);addInst('shopSign',px,yF+2.75,fz+qz*0.45,qz>0?0:Math.PI,2.6,0.65,1,sign);}
      furn('woodf',fx,yF+2.4,pz,0.08,0.08,Dd/2-0.3,0,'#2b2e2c',false);addInst('lightPanel',px,yF+2.95,pz,0);
      // género podrido, cajas, bolsas
      if(ty==='fruta'||ty==='olives')for(let k=0;k<4;k++)addInst('fruit',fx+R(-0.2,0.2),yF+0.98,pz+R(-1.4,1.4),R(0,6));
      if(Math.random()<0.6)addInst(pick(['crate','caja2','cajaPlana','bolsas']),fx+qx*R(0.7,1.4),yF,pz+R(-1.5,1.5),R(0,6.28));
      if(Math.random()<0.25)addInst('carro',fx+qx*R(1,1.6),yF,pz+R(-1,1),R(0,6.28));
      if(Math.random()<0.5)lootSpot(fx+qx*0.6,pz,yF,'mercat',ty==='bar'?'barra del mercado':'parada del mercado');
      if(ty==='peix'&&Math.random()<0.5)addInst('prodBox',fx,yF+0.98,pz+R(-1,1),0);}}
  // paradas adosadas a las fachadas laterales
  for(const sx of [-1,1])for(let v=11;v<44;v+=4.2){const px=cx+sx*(NINOT_HW-1.6),pz=F-v-2;const [nm,ty]=nameOf();
    furn('floor_super',px-sx*0.9,yF,pz,0.7,0.95,3.6,0,'#c4beb2',true,3.3);furn('granite',px-sx*0.9,yF+0.95,pz,0.8,0.05,3.7,0,'#8a8680',false);furn('floor_super',px+sx*0.5,yF,pz,0.4,2.4,3.8,0,'#d6d0c4',false,3.3);
    const sign=ninotSign(nm,ty);if(sign!==undefined)addInst('shopSign',px-sx*1.3,yF+2.75,pz,sx>0?-Math.PI/2:Math.PI/2,2.8,0.7,1,sign);
    if(Math.random()<0.5)lootSpot(px-sx*1.4,pz,yF,'mercat','parada del mercado');}
  INTERIOR=false;
  // suciedad: hojas, papeles y basura que entran por la puerta rota, cristales
  for(let i=0;i<70;i++){const x=cx+R(-NINOT_HW+1,NINOT_HW-1),z=F-R(1,NINOT_DEPTH-1);if(Math.abs(x-cx)<2.5||Math.random()<0.5)addInst(pick(['leafLitter','paper','paper','leafLitter']),x,yF+0.01,z,R(0,6.28));}
  for(let i=0;i<10;i++)addInst(pick(['bolsas','caja2','ropa']),cx+R(-2.3,2.3),yF,F-R(10,44),R(0,6.28));
  // patios: furgonetas y coches de los paradistas, palés y cajas
  for(const sx of [-1,1]){const px=cx+sx*(NINOT_HW+9);CARSPOTS.push({x:px,z:F-22,yaw:R(-0.3,0.3)},{x:px+sx*2,z:F-36,yaw:Math.PI+R(-0.3,0.3)});
    for(let k=0;k<5;k++){const x=px+R(-6,6),z=F-R(8,50);addInst(pick(['pale','crate','caja2','sacos']),x,yG(x,z),z,R(0,6.28));}}
  // la figura del ninot (mascarón de proa) sobre su peana junto a la entrada
  furn('stone_blocks',cx+8.6,yF,F+0.9,0.9,1.2,0.9,0,'#cfc6b6',true);
  return{cx,cz:F-5,y:yF,gate:[cx,F+5],F};}

// =====================================================================
// GASOLINERA MOEVE (antes Cepsa) en el xamfrà de Aragó con Casanova (lado Villarroel): surtidores bajo marquesina
// =====================================================================
const texMoeve=cTex(512,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#0e5a5e');gr.addColorStop(1,'#123c66');g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.fillStyle='#f2f4f2';g.font='bold 92px Helvetica, Arial, sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('moeve',w/2,h/2+4);
  g.fillStyle='rgba(40,30,20,0.4)';for(let i=0;i<30;i++)g.fillRect(Math.random()*w,Math.random()*h,3+Math.random()*40,2+Math.random()*10);});
const texPrices=cTex(256,512,(g,w,h)=>{g.fillStyle='#16191c';g.fillRect(0,0,w,h);g.drawImage(texMoeve.image,0,0,w,64);
  const rows=[['Gasolina 95','1,6__'],['Gasolina 98','1,7_9'],['Diésel','1,5_9'],['Diésel+','_,__9']];rows.forEach(([n,p],k)=>{const y=110+k*96;g.fillStyle='#e8e4da';g.font='bold 26px Arial';g.textAlign='left';g.fillText(n,14,y);
    g.fillStyle='#d23a1e';g.font='bold 46px monospace';g.fillText(p,14,y+48);});
  g.fillStyle='rgba(60,40,20,0.5)';for(let i=0;i<50;i++)g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*30,1+Math.random()*12);});
function buildMoeve(){const lot=LOTS.find(l=>l.corner&&l.bk.i===0&&l.bk.j===3&&l.C.sN===0);if(!lot)return;const C=lot.C;
  const ex=C.m2[0]-C.m1[0],ez=C.m2[1]-C.m1[1],L=Math.hypot(ex,ez);const ux=ex/L,uz=ez/L;const cen=centroid(lot.bk.bp);let nx=uz,nz=-ux;const mx=(C.m1[0]+C.m2[0])/2,mz=(C.m1[1]+C.m2[1])/2;
  if(nx*(mx-cen[0])+nz*(mz-cen[1])<0){nx=-nx;nz=-nz;}const yaw=Math.atan2(nx,nz);const y=surfY(mx+nx*3,mz+nz*3);
  const at=(u,w)=>[mx+ux*u+nx*w,mz+uz*u+nz*w];
  // marquesina (losa blanca con canto de marca) apoyada en la fachada y en dos pilares
  const parts=[[bx(L+2,0.55,6.2,0,4.75,3.1),0xd8d8d2],[bx(L+2.1,0.45,0.08,0,4.7,6.22),0x0e5a5e],[bx(0.08,0.45,6.2,(L+2)/2+0.02,4.7,3.1),0x0e5a5e],[bx(0.08,0.45,6.2,-(L+2)/2-0.02,4.7,3.1),0x0e5a5e]];
  for(const s of [-1,1])parts.push([bx(0.35,4.5,0.35,s*(L/2-1),2.25,5.3),0xcfcfc8]);
  for(const s of [-1,1]){const px=s*2.6;parts.push([bx(1.6,0.2,0.7,px,0.1,3.4),0x9a968c],[bx(0.95,1.75,0.5,px,1.07,3.4),0xe6e6e0],[bx(0.97,0.3,0.52,px,1.85,3.4),0x0e5a5e],[bx(0.4,0.25,0.02,px,1.45,3.66),0x1a2024],[bx(0.4,0.25,0.02,px,1.45,3.14),0x1a2024],[bx(0.08,0.9,0.08,px+0.6,0.7,3.4),0x333333]);
    addOBB(at(px,3.4)[0],at(px,3.4)[1],0.55,0.3,yaw,y,y+1.9);}
  for(const s of [-1,1]){const p=at(s*(L/2-1),5.3);addOBB(p[0],p[1],0.2,0.2,yaw,y,y+4.5);}
  const m=landmarkMesh(mkG(parts),paintMat);m.position.set(mx,y,mz);m.rotation.y=yaw;
  // rótulo en el canto y tótem de precios
  const sg=new THREE.Mesh(new THREE.PlaneGeometry(3.2,0.8),new THREE.MeshLambertMaterial({map:texMoeve}));{const q=at(0,6.27);sg.position.set(q[0],y+4.72,q[1]);}sg.rotation.y=yaw;scene.add(sg);
  const tp=at(L/2+2.5,6.5);const tot=landmarkMesh(mkG([[bx(1.3,0.4,0.4,0,0.2,0),0x7a7670],[bx(1.1,4.4,0.3,0,2.6,0),0xd8d8d2]]),paintMat);tot.position.set(tp[0],surfY(tp[0],tp[1]),tp[1]);tot.rotation.y=yaw+0.6;
  for(const f of [1,-1]){const pm=new THREE.Mesh(new THREE.PlaneGeometry(1.0,2.0),new THREE.MeshLambertMaterial({map:texPrices}));pm.position.set(0,3.4,f*0.16);if(f<0)pm.rotation.y=Math.PI;tot.add(pm);}
  addOBB(tp[0],tp[1],0.65,0.25,yaw+0.6,surfY(tp[0],tp[1]),surfY(tp[0],tp[1])+4.8);
  // un coche abandonado repostando y manchas
  CARSPOTS.push({x:at(-2.6,4.6)[0],z:at(-2.6,4.6)[1],yaw:Math.atan2(ux,uz)});
  for(let i=0;i<4;i++){const p=at(R(-4,4),R(2,5.5));addInst(pick(['caja2','bolsas','paper']),p[0],surfY(p[0],p[1]),p[1],R(0,6.28));}}

// =====================================================================
// BASES: Mercat del Ninot (aliados), escuela en el interior de manzana (aliados) y un Mercadona tomado por bandidos
// =====================================================================
defInst('tent',mkG([[(()=>{const g=new THREE.ConeGeometry(1.5,1.6,4);g.rotateY(Math.PI/4);g.translate(0,0.8,0);return g;})(),0xffffff]]),new THREE.MeshLambertMaterial({vertexColors:true}),1,1,true);
defInst('mattress',mkG([[bx(0.9,0.18,1.9,0,0.09,0),0xd8d0c0],[bx(0.6,0.12,0.4,0,0.22,-0.7),0xf0f0f0],[bx(0.85,0.05,1.2,0,0.2,0.3),0x5a6a8a]]),plasticMat,1,1,true);
defInst('firebarrel',mkG([[cy(0.32,0.3,0.9,0,0.45,0,12),0x5a3a2a],[cy(0.26,0.26,0.05,0,0.88,0,12),0xff7a20]]),paintMat,1,1,true);
defInst('crate',mkG([[bx(0.9,0.7,0.9,0,0.35,0),0x6b5434],[bx(0.92,0.06,0.92,0,0.68,0),0x5a4528]]),woodPropMat,1,1,true);
defInst('latrina',mkG([[bx(1.2,2.3,1.2,0,1.15,0),0x5a6a4a],[bx(1.3,0.08,1.3,0,2.34,0),0x3a4a2a],[bx(0.7,1.9,0.03,0,0.95,0.61),0x4a5a3a]]),plasticMat,1,1,true);
defInst('mesa',mkG([[bx(1.8,0.05,0.8,0,0.75,0),0x8a6a42],[bx(0.05,0.75,0.05,-0.85,0.37,-0.35),0x555555],[bx(0.05,0.75,0.05,0.85,0.37,-0.35),0x555555],[bx(0.05,0.75,0.05,-0.85,0.37,0.35),0x555555],[bx(0.05,0.75,0.05,0.85,0.37,0.35),0x555555]]),woodPropMat,1,1,true);
defInst('olla',mkG([[cy(0.25,0.22,0.3,0,0.15,0,12),0x444444],[cy(0.3,0.3,0.03,0,0.0,0,12),0x222222]]),metalMat,1,1,true);
defInst('canasta',mkG([[cy(0.06,0.06,3.0,0,1.5,0,8),0x555555],[bx(1.2,0.9,0.05,0,3.2,0.2),0xf0f0f0],[tor(0.23,0.015,0,2.95,0.5,0,12),0xd85a20]]),metalMat,1,1,true);
// --- plan: qué manzanas tienen base y en qué lado está la entrada ---
const BASEPLAN=[{name:'Mercat del Ninot',type:'good',bi:0,bj:0,side:2,kind:'mercat'},{name:"Escola de l'Eixample",type:'good',bi:4,bj:3,side:2,kind:'escola'}];
function planSupers(){const brands=SUPERS.slice();const spots=[];
  for(let i=0;i<NXS-1;i++)for(let j=0;j<NZS-1;j++)for(let k=0;k<4;k++)spots.push([i,j,k]);
  for(let n=spots.length-1;n>0;n--){const m=(Math.random()*(n+1))|0;[spots[n],spots[m]]=[spots[m],spots[n]];}
  // Mercadona de los bandidos: en Aragó (lado sur de la manzana 1,2)
  SUPERPLAN.set('2,2,2',{brand:SUPERS[0],state:'broken',bandit:true,lotIdx:1,w:16});brands.shift();
  let used=0;for(const [i,j,k] of spots){if(used>=brands.length)break;if(BASEPLAN.some(b=>b.bi===i&&b.bj===j))continue;const key=i+','+j+','+k;if(SUPERPLAN.has(key))continue;
    const b=brands[used++];SUPERPLAN.set(key,{brand:b,state:pick(['broken','broken','glass','boarded','half']),lotIdx:0,w:R(12,17)});}}
// patio de manzana con muros y ventanas
function courtyard(bk){const D=BDEPTH;const x0=bk.x0+D,x1=bk.x1-D,z0=bk.z0+D,z1=bk.z1-D;const P=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];const c=centroid(P);
  quadHUp(bufOf(c[0],c[1],'concrete'),...P,(x,z)=>H(x,z)+CURB+0.01,US('concrete'));
  const tint=hexTint('#e6dccb');for(let k=0;k<4;k++){const a=P[k],b=P[(k+1)%4];const ex=b[0]-a[0],ez=b[1]-a[1],L=Math.hypot(ex,ez);let nx=ez/L,nz=-ex/L;if(nx*((a[0]+b[0])/2-c[0])+nz*((a[1]+b[1])/2-c[1])>0){nx=-nx;nz=-nz;}
    const y0=H((a[0]+b[0])/2,(a[1]+b[1])/2)+CURB;const B=bufOf((a[0]+b[0])/2,(a[1]+b[1])/2,'plaster_cream');TINT=tint;wall(B,a[0],a[1],b[0],b[1],y0-0.2,y0+21,nx,nz,US('plaster_cream'));TINT=[1,1,1];
    const n=Math.floor(L/3.2);for(let f=1;f<6;f++)for(let q=0;q<n;q++){const t=(q+0.5)*L/n;const x=a[0]+ex/L*t+nx*0.02,z=a[1]+ez/L*t+nz*0.02;addInst('win',x,y0+4.6+(f-1)*3.15,z,Math.atan2(nx,nz),1.0,1.5,1,pick([2,3,4,0,1]),Math.random()<0.1?1:0);}}
  return{x0,x1,z0,z1,c};}
function baseCamp(base){const{x,z}=base;const y=surfY(x,z);addInst('firebarrel',x,y,z,0);addBoxV(x-0.35,x+0.35,z-0.35,z+0.35,y,y+0.9);base.fire=[x,z,y];
  addInst('olla',x+1.2,y+0.75,z,0);addInst('mesa',x+1.2,y,z,0);addOBB(x+1.2,z,0.9,0.4,0,y,y+0.8);
  for(let i=0;i<base.n;i++){const a=i/base.n*Math.PI*2+0.4;const bx2=x+Math.cos(a)*base.r*0.6,bz2=z+Math.sin(a)*base.r*0.6;const by=surfY(bx2,bz2);
    if(i%2)addInst('tent',bx2,by,bz2,a,1,1,1,0,0,0,base.type==='good'?pick([0x4d6a3a,0x3a5a6a,0x6a5a3a]):pick([0x3a3030,0x4a3a2a]));else addInst('mattress',bx2,by,bz2,a);base.beds.push([bx2,bz2,by]);BEDS.push({x:bx2,z:bz2,y:by+0.5});}
  for(let i=0;i<6;i++){const a=R(0,6.28);const px=x+Math.cos(a)*R(2,base.r*0.75),pz=z+Math.sin(a)*R(2,base.r*0.75);const py=surfY(px,pz);addInst('crate',px,py,pz,R(0,3));addOBB(px,pz,0.45,0.45,0,py,py+0.7);if(i<2)lootSpot(px,pz,py,'base_caja','caja de suministros');}
  {const lx=x+base.r*0.85,lz=z+1;const ly=surfY(lx,lz);addInst('latrina',lx,ly,lz,0);addOBB(lx,lz,0.6,0.6,0,ly,ly+2.3);TOILETS.push({x:lx,z:lz+1,y:ly,kind:'letrina'});}
  BASES.push(base);MAPD.pois.push({x,z,t:base.type,n:base.name});}
// pasaje desde la calle hasta el patio, con barricada de sacos
function passageInterior(lot,seg,u,ux,uz){const{a,nx,nz}=seg;const ix=-nx,iz=-nz;const P=(uu,ww)=>[a[0]+ux*uu+ix*ww,a[1]+uz*uu+iz*ww];const yF=lot.yb+0.02,ceil=lot.yb+u.y1;
  const rp=[P(u.u0,0),P(u.u1,0),P(u.u1,BDEPTH+0.1),P(u.u0,BDEPTH+0.1)];const c=centroid(rp);capPoly(bufOf(c[0],c[1],'llambordes'),rp,yF,US('llambordes'));capPoly(bufOf(c[0],c[1],'ceil'),rp,ceil,0.5,true);
  const Bi=bufOf(c[0],c[1],'stone_blocks');const L1=P(u.u0,0),L2=P(u.u0,BDEPTH),R1=P(u.u1,0),R2=P(u.u1,BDEPTH);wall(Bi,L1[0],L1[1],L2[0],L2[1],yF,ceil,ux,uz,US('stone_blocks'));wall(Bi,R1[0],R1[1],R2[0],R2[1],yF,ceil,-ux,-uz,US('stone_blocks'));
  addFloor(rp,yF);u.roomBuilt={d:BDEPTH};
  // sacos y palés dejando un paso
  for(const t of [0.6,u.u1-u.u0-0.6]){const p=P(u.u0+t,1.2);addInst('sacos',p[0],yF,p[1],Math.atan2(ux,uz));addOBB(p[0],p[1],0.7,0.3,Math.atan2(ux,uz)+Math.PI/2,yF,yF+1);}
  return{gate:P((u.u0+u.u1)/2,-2),inside:P((u.u0+u.u1)/2,BDEPTH+3)};}
// el mercado en el patio: nave de hierro con paradas
function mercatHall(cy0){const{x0,x1,z0,z1}=cy0;const cx=(x0+x1)/2,cz=(z0+z1)/2;const W=Math.min(40,x1-x0-8),Dd=Math.min(30,z1-z0-8);const y=H(cx,cz)+CURB;
  const parts=[];for(let u=-W/2;u<=W/2+0.01;u+=W/6)for(const v of [-Dd/2,Dd/2])parts.push([cy(0.14,0.16,6,u,3,v,8),0x2c3a30]);for(let v=-Dd/2;v<=Dd/2+0.01;v+=Dd/4)for(const u of [-W/2,W/2])parts.push([cy(0.14,0.16,6,u,3,v,8),0x2c3a30]);
  parts.push([bx(W+1,0.3,Dd+1,0,6.1,0),0x3a4a40],[bx(W*0.6,1.2,Dd*0.4,0,6.9,0),0x2c3a30]);landmarkMesh(mkG(parts),paintMat).position.set(cx,y,cz);
  {const g=new THREE.PlaneGeometry(W+1,Dd+1);g.rotateX(Math.PI/2);const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0xb8c4c0,emissive:0x8a9490,side:THREE.DoubleSide,transparent:true,opacity:0.85}));m.position.set(cx,y+5.95,cz);scene.add(m);}
  for(let u=-W/2+4;u<W/2-3;u+=7)for(const v of [-Dd/4,Dd/4]){const px=cx+u,pz=cz+v;furn('woodf',px,y,pz,3.2,0.95,1.2,0,'#8a6a42');lootSpot(px,pz,y,'mercat','parada del mercado');
    for(let k=0;k<5;k++)addInst('fruit',px-1.2+k*0.6,y+0.95,pz,0);}
  for(const u of [-W/2,W/2])for(let v=-Dd/2;v<=Dd/2+0.01;v+=Dd/4)addBoxV(cx+u-0.18,cx+u+0.18,cz+v-0.18,cz+v+0.18,y,y+6);
  return{cx,cz,y};}
function landmarkMesh(geo,mat){const m=new THREE.Mesh(geo,mat);m.matrixAutoUpdate=true;scene.add(m);return m;}
// escuela: edificio de dos plantas en el patio + pista
function escola(cy0){const{x0,x1,z0,z1}=cy0;const cx=(x0+x1)/2;const W=Math.min(44,x1-x0-6);const bz=z0+6;const y=H(cx,bz)+CURB;
  const P=[[cx-W/2,z0+2],[cx+W/2,z0+2],[cx+W/2,z0+11],[cx-W/2,z0+11]];const tint=hexTint('#e8d8b8');
  for(let k=0;k<4;k++){const a=P[k],b=P[(k+1)%4];const ex=b[0]-a[0],ez=b[1]-a[1],L=Math.hypot(ex,ez);let nx=ez/L,nz=-ex/L;const c=[cx,z0+6.5];if(nx*((a[0]+b[0])/2-c[0])+nz*((a[1]+b[1])/2-c[1])<0){nx=-nx;nz=-nz;}
    const B=bufOf(c[0],c[1],'plaster_ochre');TINT=tint;wall(B,a[0],a[1],b[0],b[1],y-0.2,y+7.4,nx,nz,US('plaster_ochre'));TINT=[1,1,1];
    if(k===2){const n=Math.floor(L/3);for(let f=0;f<2;f++)for(let q=0;q<n;q++){const t=(q+0.5)*L/n;addInst('win',a[0]+ex/L*t+nx*0.02,y+1.0+f*3.4,a[1]+ez/L*t+nz*0.02,Math.atan2(nx,nz),1.6,1.6,1,pick([2,3,1]),0);}}}
  addPolyV(P,y-2,y+7.5);capPoly(bufOf(cx,z0+6,'concrete_wall'),P,y+7.4,0.3);
  addInst('canasta',cx-10,y,z1-4,Math.PI);addInst('canasta',cx+10,y,z1-4,Math.PI);
  const sign=signCell('escola',(g,w,h)=>{g.fillStyle='#f4efe2';g.fillRect(0,0,w,h);g.fillStyle='#7a2a1a';g.font='bold 54px Georgia';g.textAlign='center';g.textBaseline='middle';g.fillText("ESCOLA DE L'EIXAMPLE",w/2,h/2);});
  addInst('shopSign',cx,y+5,z0+11.05,0,6,1.5,1,sign);
  return{cx,cz:(z0+11+z1)/2,y};}
function buildBases(){for(const bp of BASEPLAN){const bk=BLOCKS.find(b=>b.i===bp.bi&&b.j===bp.bj);if(bk&&bk.ninot){const m=bk.ninot;baseCamp({name:bp.name,type:'good',x:m.cx,z:m.cz,r:7,n:8,beds:[],gate:m.gate,posts:[[m.cx-5,m.F+2],[m.cx+5,m.F+2],[m.cx,m.F-20]]});continue;}if(!bk||!bk.passage)continue;const cyd=courtyard(bk);const pas=bk.passage;
    if(bp.kind==='mercat'){const m=mercatHall(cyd);baseCamp({name:bp.name,type:'good',x:m.cx,z:m.cz+4,r:11,n:8,beds:[],gate:pas.gate,posts:[pas.inside,pas.gate,[m.cx-12,m.cz]]});}
    else{const s=escola(cyd);baseCamp({name:bp.name,type:'good',x:s.cx,z:s.cz,r:10,n:7,beds:[],gate:pas.gate,posts:[pas.inside,pas.gate]});}}
  // Mercadona de los bandidos en Aragó: barricada de sacos, palés y coches cruzados
  const sp=[...SUPERPLAN.entries()].find(([k,v])=>v.bandit);if(sp&&sp[1].built){const u=sp[1].built;const g=u.out;const y=surfY(g[0],g[1]);
    for(let k=-3;k<=3;k++){const px=g[0]+u.ux*k*1.5,pz=g[1]+u.uz*k*1.5;if(Math.abs(k)<1)continue;addInst(k%2?'sacos':'pale',px,surfY(px,pz),pz,Math.atan2(u.ux,u.uz)+Math.PI/2);addOBB(px,pz,0.7,0.35,Math.atan2(u.ux,u.uz)+Math.PI/2,y,y+1);}
    CARSPOTS.push({x:g[0]+u.nx*6+u.ux*4,z:g[1]+u.nz*6+u.uz*4,yaw:Math.atan2(u.ux,u.uz)+0.3,crash:true},{x:g[0]+u.nx*6-u.ux*4,z:g[1]+u.nz*6-u.uz*4,yaw:Math.atan2(u.ux,u.uz)-0.25,crash:true});
    const inside=u.in;baseCamp({name:'Els Corbs (Mercadona d\'Aragó)',type:'bandit',x:inside[0],z:inside[1],r:5,n:6,beds:[],gate:g,posts:[[g[0]+u.ux*2,g[1]+u.uz*2],[g[0]-u.ux*2,g[1]-u.uz*2]]});}}


// =====================================================================
// MODELOS EXTERNOS
// =====================================================================
const gl=new GLTFLoader();
const TJS=['assets/models/'];
const HAND_BASE=['assets/models/hand_'];
async function loadAny(urls){for(const u of urls){try{return await gl.loadAsync(u);}catch(e){console.warn('No carga',u);}}return null;}
const HEAD=0,CHEST=1,PELVIS=2,LSH=3,RSH=4,LHIP=5,RHIP=6,LELB=7,LHAND=8,RELB=9,RHAND=10,LKNEE=11,LFOOT=12,RKNEE=13,RFOOT=14,NP=15;
const BN=['Head','Neck','Hips','LeftArm','RightArm','LeftUpLeg','RightUpLeg','LeftForeArm','LeftHand','RightForeArm','RightHand','LeftLeg','LeftFoot','RightLeg','RightFoot'];
const EXTRA=['Spine','Spine1','Spine2','LeftShoulder','RightShoulder'];
const BIPMAP={'Pelvis':'Hips','Spine':'Spine','Spine1':'Spine1','Spine2':'Spine2','Neck':'Neck','Head':'Head','L Clavicle':'LeftShoulder','L UpperArm':'LeftArm','L Forearm':'LeftForeArm','L Hand':'LeftHand','L Thigh':'LeftUpLeg','L Calf':'LeftLeg','L Foot':'LeftFoot',
  'R Clavicle':'RightShoulder','R UpperArm':'RightArm','R Forearm':'RightForeArm','R Hand':'RightHand','R Thigh':'RightUpLeg','R Calf':'RightLeg','R Foot':'RightFoot'};
const cleanName=n=>{n=n.replace(/^mixamorig[:_]?/i,'');const m=/^Bip01[ _](.*)$/.exec(n);if(m){const k=m[1].replace(/_/g,' ');return BIPMAP[k]||('bip_'+k);}return n;};
const TPL={};let CHAR_TPLS=[];let ferrariTpl=null;const HANDTPL={};let CARTPL=null;
const _fx=new V3(),_fy=new V3(),_fz=new V3(),_fm=new M4();
function frameQ(up,side,out){_fy.copy(up).normalize();_fx.copy(side).addScaledVector(_fy,-side.dot(_fy));if(_fx.lengthSq()<1e-8)_fx.set(1,0,0);_fx.normalize();_fz.crossVectors(_fx,_fy);_fm.makeBasis(_fx,_fy,_fz);return out.setFromRotationMatrix(_fm);}
function prepTpl(gltf,name){if(!gltf)return null;const root=gltf.scene;root.updateMatrixWorld(true);const bones={};
  root.traverse(o=>{if(o.isBone)bones[cleanName(o.name)]=o;if(o.isMesh)o.frustumCulled=false;});
  for(const b of BN.concat(EXTRA))if(!bones[b])return null;
  // esqueletos tipo Biped (Rocketbox): muslos cuelgan de Spine y clavículas de Neck → se recolocan sin mover nada
  for(const [c,pn] of [['LeftUpLeg','Hips'],['RightUpLeg','Hips'],['LeftShoulder','Spine2'],['RightShoulder','Spine2']])if(bones[c].parent!==bones[pn])bones[pn].attach(bones[c]);
  root.updateMatrixWorld(true);
  const par=(c,p)=>bones[c].parent===bones[p];
  if(!(par('Spine','Hips')&&par('Spine1','Spine')&&par('Spine2','Spine1')&&par('Neck','Spine2')&&par('LeftShoulder','Spine2')&&par('LeftArm','LeftShoulder')&&par('LeftForeArm','LeftArm')&&par('LeftUpLeg','Hips')&&par('LeftLeg','LeftUpLeg')&&par('LeftFoot','LeftLeg')))return null;
  const inv=new M4().copy(root.matrixWorld).invert();const bp={},bq={},lq={};
  for(const n of BN.concat(EXTRA,['Head'])){const b=bones[n];const m=new M4().multiplyMatrices(inv,b.matrixWorld);const p=new V3(),q=new Q4(),s=new V3();m.decompose(p,q,s);bp[n]=p;bq[n]=q;lq[n]=b.quaternion.clone();}
  const arm=bones.Hips.parent;const armM=new M4().multiplyMatrices(inv,arm.matrixWorld);const armQ=new Q4();armM.decompose(_v,armQ,_s);
  const minY=Math.min(bp.LeftFoot.y,bp.RightFoot.y)-0.08;const height=bp.Head.y-minY+0.14;if(!(height>0.8&&height<3))return null;
  const Lv=bp.LeftUpLeg.clone().sub(bp.RightUpLeg);const f=new V3().crossVectors(Lv,UP);const yawFix=-Math.atan2(f.x,f.z);const qFix=new Q4().setFromAxisAngle(UP,yawFix);
  const CB=BN.map(n=>bp[n].clone().applyQuaternion(qFix));const pel=CB[PELVIS].clone();for(const p of CB){p.x-=pel.x;p.z-=pel.z;p.y-=minY;}
  const d=(a,b)=>CB[a].distanceTo(CB[b]);
  const pr={thigh:d(LHIP,LKNEE),shin:d(LKNEE,LFOOT),upper:d(LSH,LELB),fore:d(LELB,LHAND),pelH:CB[PELVIS].y,footH:Math.max(0.05,CB[LFOOT].y),
    hipOff:CB[LHIP].clone().sub(CB[PELVIS]),chestOff:CB[CHEST].clone().sub(CB[PELVIS]),shOff:CB[LSH].clone().sub(CB[PELVIS]),headOff:CB[HEAD].clone().sub(CB[CHEST])};
  pr.hipOff.x=Math.abs(pr.hipOff.x);pr.shOff.x=Math.abs(pr.shOff.x);pr.stride=(pr.thigh+pr.shin)*0.75;
  const inv2=q=>q.clone().invert();
  const dirB=(par,a,b)=>bp[b].clone().sub(bp[a]).applyQuaternion(inv2(bq[par])).normalize();
  const Fh=frameQ(bp.Neck.clone().sub(bp.Hips),bp.LeftUpLeg.clone().sub(bp.RightUpLeg),new Q4());const Fs=frameQ(bp.Neck.clone().sub(bp.Hips),bp.LeftArm.clone().sub(bp.RightArm),new Q4());
  const T={name,scene:root,height,minY,yawFix,qFix,CB,pr,armM,armQ,bq,lq,
    C_hips:inv2(Fh).multiply(bq.Hips),C_sp2:inv2(Fs).multiply(bq.Spine2),
    dNeck:dirB('Spine2','Neck','Head'),dLA:dirB('LeftShoulder','LeftArm','LeftForeArm'),dLF:dirB('LeftArm','LeftForeArm','LeftHand'),dRA:dirB('RightShoulder','RightArm','RightForeArm'),dRF:dirB('RightArm','RightForeArm','RightHand'),
    dLU:dirB('Hips','LeftUpLeg','LeftLeg'),dLL:dirB('LeftUpLeg','LeftLeg','LeftFoot'),dRU:dirB('Hips','RightUpLeg','RightLeg'),dRL:dirB('RightUpLeg','RightLeg','RightFoot'),rootQ:root.quaternion.clone()};
  // cara y manos en el espacio local de la malla (para el aspecto zombi) y eje de la mandíbula
  let sm=null;root.traverse(o=>{if(o.isSkinnedMesh&&!sm)sm=o;});
  if(sm&&bones.bip_LEye&&bones.bip_REye){const mi=new M4().copy(sm.matrixWorld).invert();const L=n=>bones[n].getWorldPosition(new V3()).applyMatrix4(mi);
    const rq=new Q4().setFromRotationMatrix(new M4().extractRotation(mi));const ls=new V3().setFromMatrixScale(mi).x;const fu=1/(height*ls);
    const mouth=bones.bip_MUpperLip&&bones.bip_MBottomLip?L('bip_MUpperLip').add(L('bip_MBottomLip')).multiplyScalar(0.5):L('Head');
    const hand=(a,b)=>{const w=bones[b].getWorldPosition(new V3()),e=bones[a].getWorldPosition(new V3());return w.add(w.clone().sub(e).normalize().multiplyScalar(0.045*height)).applyMatrix4(mi);};
    T.face={rq,eyeL:L('bip_LEye'),eyeR:L('bip_REye'),mouth,hl:hand('LeftForeArm','LeftHand'),hr:hand('RightForeArm','RightHand'),up:UP.clone().applyQuaternion(rq).normalize(),fwd:f.clone().normalize().applyQuaternion(rq).normalize(),side:Lv.clone().normalize().applyQuaternion(rq).normalize(),fu};}
  if(bones.bip_MJaw){const jb=bones.bip_MJaw;const jq=jb.getWorldQuaternion(new Q4());const sideW=Lv.clone().normalize();const lip=(bones.bip_MBottomLip||jb).getWorldPosition(new V3()).sub(jb.getWorldPosition(new V3()));
    if(lip.lengthSq()<1e-6)lip.copy(f).normalize();const t=lip.clone().applyAxisAngle(sideW,0.3);T.jawAx=sideW.clone().applyQuaternion(jq.invert()).normalize();T.jawSign=t.y<lip.y?1:-1;T.jawRest=jb.quaternion.clone();}
  return T;}
// coche de la comunidad (CC0, «Low Poly Car - Randomness A02 City» de kaytomasu): utilitario tipo Panda, el coche más típico de Barcelona
function prepCarTpl(root,sc){root.scale.setScalar(sc);root.updateMatrixWorld(true);const wheels=[];const parts={};
  root.traverse(o=>{if(o.isMesh){o.castShadow=false;parts[o.name]=o;if(o.material&&o.material.map)o.material.map.anisotropy=4;}});
  for(const n of ['Front_Left_Wheel','Front_Right_Wheel','Rear_Left_Wheel','Rear_Right_Wheel']){const m=parts[n];if(!m)continue;const b=new THREE.Box3().setFromObject(m);const c=b.getCenter(new V3());wheels.push({name:n,c,r:(b.max.y-b.min.y)/2,front:n.startsWith('Front')});}
  const box=new THREE.Box3().setFromObject(root);const ws=parts.Windshield?new THREE.Box3().setFromObject(parts.Windshield):null,mir=parts.Mirrors?new THREE.Box3().setFromObject(parts.Mirrors):null;
  for(const k of ['Windshield','Windows','RearWindow'])if(parts[k]){parts[k].geometry.computeBoundingBox();}
  return{root,wheels,box,ws,mir,wsLocal:parts.Windshield?parts.Windshield.geometry.boundingBox.clone():null,len:box.max.z-box.min.z,halfW:(parts.Car?new THREE.Box3().setFromObject(parts.Car):box).getSize(new V3()).x/2};}
function prepFerrari(g){if(!g)return null;const root=g.scene;const wn=['wheel_fl','wheel_fr','wheel_rl','wheel_rr'];const w=wn.map(n=>root.getObjectByName(n));if(w.some(x=>!x))return null;
  root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root);const sz=box.getSize(new V3());
  const fr=w[0].getWorldPosition(new V3()).add(w[1].getWorldPosition(new V3())).multiplyScalar(0.5);const re=w[2].getWorldPosition(new V3()).add(w[3].getWorldPosition(new V3())).multiplyScalar(0.5);
  const f=fr.sub(re);return{root,yawFix:-Math.atan2(f.x,f.z),scale:4.5/Math.max(sz.x,sz.z),minY:box.min.y};}
let modelsReady=false;
const TPL_M=[],TPL_F=[];
async function loadModels(){setLoad('m','Descargando personajes…');
  const list=['p_m1','p_m2','p_m3','p_m4','p_m5','p_f1','p_f2','p_f3','p_f4'];let done=0;
  await Promise.all(list.map(async key=>{const g=await loadAny(TJS.map(b=>b+key+'.glb'));const t=prepTpl(g,key);if(t){TPL[key]=t;t.female=key.startsWith('p_f');(t.female?TPL_F:TPL_M).push(t);
      t.scene.traverse(o=>{if(o.isMesh){const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){m.metalness=0;m.roughness=0.9;m.envMapIntensity=0.3;if(m.map)m.map.anisotropy=2;}}});}
    done++;setLoad('m',`Personajes: ${done}/${list.length}`);}));
  CHAR_TPLS=[...TPL_M,...TPL_F];
  if(!CHAR_TPLS.length){setLoad('m','❌ No se han podido descargar los personajes. Revisa la conexión de las gafas y recarga.');return;}
  setLoad('m',`✔ Personajes listos: ${TPL_M.length} hombres y ${TPL_F.length} mujeres`);
  setLoad('h','Descargando manos…');for(const side of ['left','right']){const g=await loadAny(HAND_BASE.map(b=>b+side+'.glb'));HANDTPL[side]=g?g.scene:null;}
  setupHands();setLoad('h',HANDTPL.left&&HANDTPL.right?'✔ Manos listas':'⚠ Manos sencillas');
  {const g=await loadAny(['assets/models/car_panda.glb']);CARTPL=g?prepCarTpl(g.scene,1.14):null;}
  {const g=await loadAny(['assets/models/rifle.glb']);if(g){g.scene.updateMatrixWorld(true);let mm=null;g.scene.traverse(o=>{if(o.isMesh&&!mm)mm=o;});
    if(mm){const geo=mm.geometry.clone();geo.applyMatrix4(mm.matrixWorld);for(const k of ['skinIndex','skinWeight'])geo.deleteAttribute(k);geo.computeBoundingBox();const bb=geo.boundingBox;
      // culata hacia -z, cañón hacia +z; el origen en la empuñadura (mano derecha)
      const len=bb.max.z-bb.min.z;geo.translate(-(bb.min.x+bb.max.x)/2,-bb.max.y+0.04,-(bb.min.z+len*0.3));const m=mm.material;const mat=new THREE.MeshStandardMaterial({map:m.map,normalMap:m.normalMap,roughnessMap:m.roughnessMap,metalnessMap:m.metalnessMap,roughness:1,metalness:1});
      RIFLE_T={geo,mat};}}}
  for(const sd in gripBySide){const hr=hands[sd];if(hr&&!hr.handRoot.parent)gripBySide[sd].add(hr.handRoot);}
  modelsReady=true;enableStart();}

// =====================================================================
// PIEL ZOMBI (shader: piel grisácea, suciedad y sangre seca)
// =====================================================================
const NOISE_GLSL=`float zh(vec3 p){p=fract(p*0.3183099+0.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float zn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);return mix(mix(mix(zh(i),zh(i+vec3(1,0,0)),f.x),mix(zh(i+vec3(0,1,0)),zh(i+vec3(1,1,0)),f.x),f.y),mix(mix(zh(i+vec3(0,0,1)),zh(i+vec3(1,0,1)),f.x),mix(zh(i+vec3(0,1,1)),zh(i+vec3(1,1,1)),f.x),f.y),f.z);}`;
const matCache=new Map();
// Material por personaje: los zombis con piel cadavérica; todos con heridas pintadas sobre la propia piel (sin calcomanías flotando)
const WOUND_GLSL=`
        for(int i=0;i<8;i++){vec4 W=uW[i];if(W.w==0.0)continue;
          if(W.w<0.0){float rb=-W.w;float db=length((vZP-W.xyz)*uFU);float nb=zn(zp*12.0+float(i));float br=smoothstep(rb*1.1,rb*0.3,db+(nb-0.5)*rb*0.6);
            zc=mix(zc,zc*vec3(0.55,0.45,0.72)*vec3(0.85,0.7,1.0),br*0.75);zc=mix(zc,vec3(0.25,0.05,0.06)*(0.6+l),br*smoothstep(0.62,0.8,nb)*0.6);continue;}
          float ag=clamp((uTime-uWT[i])/6.0,0.1,1.0);
          vec3 dv=(vZP-W.xyz)*uFU;float dd=length(dv);if(dd>W.w*8.0)continue;
          float n=zn(zp*34.0+float(i)*7.3),n2=zn(zp*9.0+float(i)*3.1);
          float stain=smoothstep(W.w*(0.6+ag*0.6),W.w*(0.3+ag*0.4),dd+(n2-0.5)*W.w*1.1+(n-0.5)*W.w*0.35);
          float core=smoothstep(W.w*0.24,W.w*0.17,dd);
          vec3 gU=-normalize(uWD[i]);float dy=dot(dv,gU);vec3 lt=dv-gU*dy;float lat=length(lt+cross(gU,uFw)*(n2-0.5)*W.w*0.6);float L=W.w*(3.0+n2*4.0)*ag;
          float wd=W.w*0.32*clamp(1.0+dy/L,0.15,1.0);
          float drip=step(dy,0.0)*smoothstep(-L,-L*0.6,dy)*smoothstep(wd,wd*0.35,lat);
          float b=max(max(stain*0.92,drip*0.85),core);
          zc=mix(zc,mix(vec3(0.13,0.008,0.006)*(0.55+l*0.8),vec3(0.03,0.0,0.0),core)*(0.8+n*0.4),b*uGore);}`;
function charMat(base,type,variant,tpl,h){const key=base.uuid+type+variant+(h?'_'+h.slot:'');let m=matCache.get(key);if(m)return m;m=base.clone();m.metalness=0;m.roughness=0.95;m.envMapIntensity=0.25;
  const tint={zombie:[[1,1,1]],bandit:[[0.82,0.74,0.7],[0.7,0.7,0.72]],good:[[1,1,1],[0.94,0.98,1],[1,0.96,0.92]],wanderer:[[0.95,0.92,0.86],[0.9,0.92,0.95]]}[type]||[[1,1,1]];
  const t=tint[variant%tint.length];m.color.setRGB(t[0],t[1],t[2]);
  const F=tpl&&tpl.face;const zom=type==='zombie';
  if(F&&(zom||h)){const gore=S.gore;const isHead=/head/i.test(base.name)?1:0;m.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,{uFU:{value:F.fu},uSeed:{value:variant*3.7+1.3},uGore:{value:gore/2},uEL:{value:F.eyeL},uER:{value:F.eyeR},uMo:{value:F.mouth},uHL:{value:F.hl},uHR:{value:F.hr},uUp:{value:F.up},uFw:{value:F.fwd},uSd:{value:F.side},
      uHead:{value:isHead},uMK:{value:[1,0.55,1,0.2][variant%4]},uHK:{value:[1,0.2,0.7,1][variant%4]},uW:{value:h?h.woundU:WOUND0},uWT:{value:h?h.woundT:WOUNDT0},uWD:{value:h?h.woundD:WOUNDD0},uTime:WTIME});
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vZP;uniform vec4 uW[8];uniform float uFU;').replace('#include <begin_vertex>','#include <begin_vertex>\nvZP=position;for(int i=0;i<8;i++){vec4 W=uW[i];if(W.w==0.0)continue;float r=abs(W.w);float d=length((position-W.xyz)*uFU);transformed-=objectNormal*(W.w<0.0?smoothstep(r*1.2,0.0,d)*r*0.5:smoothstep(r*0.45,0.0,d)*r*0.35)/uFU;}');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vZP;uniform float uFU,uSeed,uGore,uHead,uMK,uHK;uniform vec3 uEL,uER,uMo,uHL,uHR,uUp,uFw,uSd;uniform vec4 uW[8];uniform float uWT[8];uniform vec3 uWD[8];uniform float uTime;\n'+NOISE_GLSL)
      .replace('#include <map_fragment>','#include <map_fragment>\n        vec3 c0=diffuseColor.rgb;vec3 zp=vZP*uFU*1.75+uSeed;float l=dot(c0,vec3(0.3,0.59,0.11));vec3 zc=c0;\n'+(zom?ZOMBIE_GLSL:'')+WOUND_GLSL+'\n        diffuseColor.rgb=zc;');};
    m.customProgramCacheKey=()=>(zom?'zomb7_':'wnd7_')+gore;}
  matCache.set(key,m);return m;}
const WOUND0=Array.from({length:8},()=>new THREE.Vector4());const WOUNDT0=new Float32Array(8).fill(-99);const WOUNDD0=Array.from({length:8},()=>new V3(0,-1,0));const WTIME={value:0};
const ZOMBIE_GLSL=`
        float sk=smoothstep(0.015,0.09,c0.r-c0.g)*smoothstep(-0.01,0.05,c0.g-c0.b)*smoothstep(0.2,0.38,c0.r);sk=max(sk,uHead*0.55*smoothstep(0.12,0.3,l));
        vec3 cloth=mix(vec3(l),c0,0.5)*vec3(0.84,0.86,0.80);
        vec3 skin=vec3(l)*vec3(0.86,0.90,0.78)*1.08;skin=mix(skin,c0,0.14);
        float nec=zn(zp*9.0)*0.6+zn(zp*23.0)*0.4;skin*=mix(vec3(1.0),vec3(0.60,0.50,0.58),smoothstep(0.52,0.72,nec));
        zc=mix(cloth,skin,sk);
        float d=zn(zp*2.6)*0.65+zn(zp*7.0)*0.35;zc*=mix(1.0,0.55,smoothstep(0.5,0.8,d));
        float de=min(length(vZP-uEL),length(vZP-uER))*uFU;
        zc*=mix(vec3(0.34,0.26,0.30),vec3(1.0),smoothstep(0.009,0.027,de));
        zc=mix(vec3(0.80,0.80,0.74),zc,smoothstep(0.0062,0.0082,de));
        vec3 dm=(vZP-uMo)*uFU;float dy=dot(dm,uUp),dx=dot(dm,uSd),dz=dot(dm,uFw);
        float nb=zn(zp*14.0+5.0)*0.6+zn(zp*38.0)*0.4;
        float lips=smoothstep(0.024,0.009,length(vec3(dx*0.75,dy*1.25,dz*0.5)));
        float tt=clamp(-dy/0.2,0.0,1.0);float w=mix(0.015,0.075,tt);
        float drip=smoothstep(0.006,-0.012,dy)*smoothstep(-0.23,-0.09,dy)*smoothstep(w,w*0.3,abs(dx+(zn(zp*5.0)-0.5)*0.035))*step(-0.05,dz);
        float mb=max(lips*smoothstep(0.2,0.5,nb+0.25),drip*smoothstep(0.3,0.58,nb+(1.0-tt)*0.35))*uMK;
        float dh=min(length(vZP-uHL),length(vZP-uHR))*uFU;float hb=smoothstep(0.085,0.03,dh)*smoothstep(0.3,0.6,nb+0.2)*uHK;
        float b=zn(zp*3.1+17.0)*0.6+zn(zp*9.0+3.0)*0.25+nb*0.15;float bm=smoothstep(0.66,0.72,b)*smoothstep(0.2,0.5,nb+0.2);
        float blood=clamp(max(max(mb,hb),bm),0.0,1.0)*uGore;
        zc=mix(zc,vec3(0.105,0.012,0.008)*(0.5+l*0.7)*(0.75+nb*0.5),blood*0.94);`;

// =====================================================================
// PERSONAJES
// =====================================================================
const STICKS=[[HEAD,CHEST],[HEAD,LSH],[HEAD,RSH],[HEAD,PELVIS],[CHEST,LSH],[CHEST,RSH],[LSH,RSH],[CHEST,PELVIS],[CHEST,LHIP],[CHEST,RHIP],
  [LSH,LHIP],[RSH,RHIP],[LSH,RHIP],[RSH,LHIP],[LHIP,RHIP],[PELVIS,LHIP],[PELVIS,RHIP],[PELVIS,LSH],[PELVIS,RSH],
  [LSH,LELB],[LELB,LHAND],[RSH,RELB],[RELB,RHAND],[LHIP,LKNEE],[LKNEE,LFOOT],[RHIP,RKNEE],[RKNEE,RFOOT]];
const PR=[0.12,0.1,0.11,0.08,0.08,0.09,0.09,0.05,0.045,0.05,0.045,0.06,0.05,0.06,0.05];
const NBW=[];{const adj=[...Array(NP)].map(()=>[]);for(const [a,b] of STICKS){adj[a].push(b);adj[b].push(a);}
  for(let s=0;s<NP;s++){const d=new Array(NP).fill(9);d[s]=0;const q=[s];while(q.length){const u=q.shift();for(const v of adj[u])if(d[v]>d[u]+1){d[v]=d[u]+1;q.push(v);}}NBW[s]=Float32Array.from(d.map(x=>x===0?1:x===1?0.45:x===2?0.15:0.04));}
  // brazos y piernas: el golpe se queda en la extremidad
  for(const [a,b,c] of [[LSH,LELB,LHAND],[RSH,RELB,RHAND],[LHIP,LKNEE,LFOOT],[RHIP,RKNEE,RFOOT]]){NBW[c][b]=0.6;NBW[c][a]=0.2;NBW[b][c]=0.7;NBW[b][a]=0.4;}
  NBW[HEAD].fill(0.03);NBW[HEAD][HEAD]=1;NBW[HEAD][CHEST]=0.3;NBW[HEAD][LSH]=NBW[HEAD][RSH]=0.12;}
const HIT_SEGS=[[CHEST,PELVIS,0.19,'body'],[LSH,LELB,0.07,'lArm'],[LELB,LHAND,0.06,'lArm'],[RSH,RELB,0.07,'rArm'],[RELB,RHAND,0.06,'rArm'],
  [LHIP,LKNEE,0.09,'lLeg'],[LKNEE,LFOOT,0.075,'lLeg'],[RHIP,RKNEE,0.09,'rLeg'],[RKNEE,RFOOT,0.075,'rLeg']];
const LIMB_PTS={lArm:[LELB,LHAND],rArm:[RELB,RHAND],lLeg:[LKNEE,LFOOT],rLeg:[RKNEE,RFOOT]};
const PART_BONE={head:'Head',body:'Spine1',lArm:'LeftForeArm',rArm:'RightForeArm',lLeg:'LeftLeg',rLeg:'RightLeg'};
const NAMES_M=['Jordi','Pau','Marc','Sergi','Toni','Xavi','Manel','Joan','Carles','Albert','Rafa','Dani','Ramon','Íker','Hassan','Óscar'],NAMES_F=['Montse','Laia','Núria','Marta','Anna','Carme','Rosa','Mireia','Fàtima','Sílvia','Júlia','Lucía'];
const H_=[];const MAXC=90;let charSlot=0;
function newRec(tpl){const model=SkeletonUtils.clone(tpl.scene);const inner=new THREE.Group();inner.add(model);const holder=new THREE.Group();holder.add(inner);scene.add(holder);
  const bones={},meshes=[];model.traverse(o=>{if(o.isBone)bones[cleanName(o.name)]=o;if(o.isMesh){o.frustumCulled=false;o.userData.base=o.material;meshes.push(o);}});
  const h={tpl,holder,inner,model,bones,meshes,arm:bones.Hips.parent,sim:[],prev:[],tgt:[],rest:new Float32Array(STICKS.length),kp:new Float32Array(NP),kl:new Float32Array(NP),slot:charSlot++,active:false,wounds:[],prop:null};
  for(let i=0;i<NP;i++){h.sim.push(new V3());h.prev.push(new V3());h.tgt.push(new V3());}H_.push(h);return h;}
function spawnChar(type,x,z,o={}){if(!CHAR_TPLS.length)return null;const female=o.female!==undefined?o.female:Math.random()<0.45;
  const pool=(female?TPL_F:TPL_M).length?(female?TPL_F:TPL_M):CHAR_TPLS;const tpl=o.tpl||pick(pool);
  let h=H_.find(q=>!q.active&&q.tpl===tpl);if(!h){if(H_.length<MAXC)h=newRec(tpl);else{h=H_.find(q=>!q.active);if(!h)return null;}}
  const height=(female?R(1.58,1.72):R(1.68,1.86));const s=height/h.tpl.height;h.s=s;h.inner.scale.setScalar(s);h.inner.quaternion.copy(h.tpl.qFix);h.inner.position.set(0,-h.tpl.minY*s,0);
  const variant=o.variant!==undefined?o.variant:(Math.random()*4)|0;
  if(!h.woundU){h.woundU=Array.from({length:8},()=>new THREE.Vector4());h.woundT=new Float32Array(8);h.woundD=Array.from({length:8},()=>new V3());h.woundB=[];}for(const w of h.woundU)w.set(0,0,0,0);h.woundT.fill(-99);h.woundI=0;h.bleeds=[];
  for(const m of h.meshes){m.material=Array.isArray(m.userData.base)?m.userData.base.map(b=>charMat(b,type,variant,h.tpl,h)):charMat(m.userData.base,type,variant,h.tpl,h);}
  {const jb=h.bones.bip_MJaw;if(jb&&h.tpl.jawAx){jb.quaternion.copy(h.tpl.jawRest);if(type==='zombie')jb.quaternion.multiply(_q.setFromAxisAngle(h.tpl.jawAx,h.tpl.jawSign*R(0.1,0.42)));}}
  const zt=type==='zombie';h.pr={};for(const k in h.tpl.pr){const v=h.tpl.pr[k];h.pr[k]=v.isVector3?v.clone().multiplyScalar(s):v*s;}
  for(let k=0;k<STICKS.length;k++)h.rest[k]=h.tpl.CB[STICKS[k][0]].distanceTo(h.tpl.CB[STICKS[k][1]])*s;
  Object.assign(h,{active:true,type,x,z,y:surfY(x,z),yaw:Math.random()*6.28,vx:0,vz:0,speed:0,phase:Math.random()*6,mode:'kin',k:1,down:0,dead:false,deadT:0,getup:-1,permPhys:false,crawler:false,sleep:0,
    rig:1,headHp:zt?100*S.zTough:60,bodyHp:zt?200*S.zTough:110,limb:{lArm:60,rArm:60,lLeg:60,rLeg:60},broken:{},think:Math.random()*0.3,target:null,goal:null,atk:0,atkAnim:0,
    shootT:R(0.5,1.5),runner:false,base:null,role:null,hostile:false,angry:false,reanimate:false,lastHitT:-9,idle:0,groanT:R(3,12),aim:0,searched:false,acc:0,lod:0,crawlT:0,wd:null,stepT:0,
    act:'stand',actT:0,look:0,eatT:0,name:h.tpl.female?pick(NAMES_F):pick(NAMES_M),female:!!h.tpl.female,armed:zt?false:(type!=='wanderer'?true:Math.random()<0.5),pack:zt&&Math.random()<0.22,lastMoveT:0,
    gp:{lean:zt?R(0.14,0.38):R(0,0.06),droop:zt?R(0.2,0.55):0,tilt:zt?R(-0.35,0.35):0,arms:zt?(Math.random()<0.55?'forward':Math.random()<0.6?'hang':'mixed'):'swing',limp:zt&&Math.random()<0.55?R(0.2,0.75)*(Math.random()<0.5?1:-1):0,sway:zt?R(1.4,2.6):1,twitch:zt?R(0.3,1):0,speedMul:zt?R(0.75,1.15):1}},o);
  h.kp.fill(1);h.kl.fill(1);h.holder.visible=true;for(const w of h.wounds)w.parent&&w.parent.remove(w);h.wounds=[];
  if(h.prop){h.prop.visible=h.armed;}else if(h.armed){h.prop=makeRifle();scene.add(h.prop);}
  poseTargets(h,0);for(let i=0;i<NP;i++){h.sim[i].copy(h.tgt[i]);h.prev[i].copy(h.tgt[i]);}driveBones(h);return h;}
function despawn(h){h.active=false;h.holder.visible=false;if(h.prop)h.prop.visible=false;for(const w of h.wounds)w.parent&&w.parent.remove(w);h.wounds=[];if(h.base){const i=h.base.members.indexOf(h);if(i>=0)h.base.members.splice(i,1);}}
let RIFLE_T=null;
function makeRifle(){if(RIFLE_T){const m=new THREE.Mesh(RIFLE_T.geo,RIFLE_T.mat);m.castShadow=false;return m;}const g=mkG([[bx(0.05,0.07,0.75,0,0,0.2),0x222426],[bx(0.045,0.12,0.25,0,-0.03,-0.25),0x4a3424],[bx(0.03,0.12,0.05,0,-0.08,0.05),0x1a1a1a],[cy(0.012,0.012,0.35,0,0.015,0.7,6,Math.PI/2),0x111111]]);return new THREE.Mesh(g,metalMat);}

// ---------- IK y poses procedurales ----------
const _ia=new V3(),_ib=new V3(),_ic=new V3(),_id=new V3();
function ik2(A,T,l1,l2,pole,outM,outT){_ia.subVectors(T,A);let d=_ia.length();const mx=l1+l2-0.002,mn=Math.abs(l1-l2)+0.01;if(d<1e-5){_ia.set(0,-1,0);d=mn;}_ia.divideScalar(d);d=clamp(d,mn,mx);
  outT.copy(A).addScaledVector(_ia,d);const a=(l1*l1-l2*l2+d*d)/(2*d);const hh=Math.sqrt(Math.max(0,l1*l1-a*a));
  _ib.copy(pole).addScaledVector(_ia,-pole.dot(_ia));if(_ib.lengthSq()<1e-8)_ib.set(0,0,1).addScaledVector(_ia,-_ia.z);_ib.normalize();outM.copy(A).addScaledVector(_ia,a).addScaledVector(_ib,hh);}
const LP=Array.from({length:NP},()=>new V3());const _e1=new THREE.Euler(),_qt1=new Q4(),_tmpA=new V3(),_tmpB=new V3(),_pole=new V3();
// cuerpo local a partir de parámetros (pelvis, inclinación, pies y manos)
function bodyLocal(pr,o){const L=LP;L[PELVIS].copy(o.pel);_e1.set(o.pitch||0,o.twist||0,o.roll||0,'YXZ');_qt1.setFromEuler(_e1);
  L[CHEST].copy(pr.chestOff).applyQuaternion(_qt1).add(o.pel);
  L[LSH].set(pr.shOff.x,pr.shOff.y,pr.shOff.z).applyQuaternion(_qt1).add(o.pel);L[RSH].set(-pr.shOff.x,pr.shOff.y,pr.shOff.z).applyQuaternion(_qt1).add(o.pel);
  _e1.set((o.pitch||0)+(o.headPitch||0),(o.twist||0)+(o.headYaw||0),(o.roll||0)+(o.headRoll||0),'YXZ');_qt1.setFromEuler(_e1);L[HEAD].copy(pr.headOff).applyQuaternion(_qt1).add(L[CHEST]);
  _e1.set((o.pelPitch||0),(o.twist||0)*0.4,(o.roll||0)*0.4,'YXZ');_qt1.setFromEuler(_e1);
  L[LHIP].set(pr.hipOff.x,pr.hipOff.y,pr.hipOff.z).applyQuaternion(_qt1).add(o.pel);L[RHIP].set(-pr.hipOff.x,pr.hipOff.y,pr.hipOff.z).applyQuaternion(_qt1).add(o.pel);
  ik2(L[LHIP],o.lf,pr.thigh,pr.shin,o.kpL||_pole.set(0,0,1),L[LKNEE],L[LFOOT]);ik2(L[RHIP],o.rf,pr.thigh,pr.shin,o.kpR||_pole.set(0,0,1),L[RKNEE],L[RFOOT]);
  ik2(L[LSH],o.lh,pr.upper,pr.fore,o.epL||_tmpA.set(0.2,-0.4,-1),L[LELB],L[LHAND]);ik2(L[RSH],o.rh,pr.upper,pr.fore,o.epR||_tmpB.set(-0.2,-0.4,-1),L[RELB],L[RHAND]);}
const _o={pel:new V3(),lf:new V3(),rf:new V3(),lh:new V3(),rh:new V3()};
function armTarget(pr,side,mode,ph,amp,sh,out,h){const s=side>0?1:-1;const al=(pr.upper+pr.fore);
  if(mode==='forward'){out.set(sh.x*0.8+s*0.03,sh.y-0.22+Math.sin(ph*0.5+side)*0.06,sh.z+al*0.82);}
  else if(mode==='hang'){out.set(sh.x+s*0.08,sh.y-al*0.97,sh.z+0.08+Math.sin(ph+side)*0.05);}
  else if(mode==='reach'){out.set(sh.x*0.6,sh.y+0.08,sh.z+al*0.96);}
  else if(mode==='aim'){out.set(s>0?0.05:-0.12,sh.y-0.12,sh.z+(s>0?0.55:0.3));}
  else{const sw=-Math.sin(ph+(side>0?Math.PI:0))*0.45*amp;out.set(sh.x+s*0.05,sh.y-al*0.95*Math.cos(sw),sh.z+al*0.95*Math.sin(sw));}
  return out;}
function poseTargets(h,dt){const pr=h.pr,g=h.gp,o=_o;const v=h.speed;const amp=clamp(v/1.3,0,1.5);const z=h.type==='zombie';
  if(v>0.03)h.phase+=dt*v/pr.stride*Math.PI*(z?1.15:1);else h.phase+=dt*0.6;const ph=h.phase;h.actT+=dt;
  const act=h.act;let lean=g.lean,headP=g.droop,headR=g.tilt+(z?Math.sin(clockT*0.7*g.twitch+h.slot)*0.1*g.twitch:0),headY=z?Math.sin(clockT*0.4+h.slot)*0.2:Math.sin(clockT*0.3+h.slot)*0.5*(v<0.1?1:0.2);
  if(act==='lie'||act==='sleep'){// tumbado boca arriba
    o.pel.set(0,0.14,0);bodyLocal(pr,Object.assign(o,{pitch:-Math.PI/2,roll:0,twist:0,headPitch:-0.2,headRoll:0,headYaw:0,pelPitch:-Math.PI/2}));
    o.lf.set(pr.hipOff.x,0.1,-(pr.thigh+pr.shin));o.rf.set(-pr.hipOff.x,0.1,-(pr.thigh+pr.shin));o.lh.set(0.35,0.08,0.1);o.rh.set(-0.35,0.08,0.1);bodyLocal(pr,o);}
  else if(act==='squat'||act==='eat'||act==='loot'){const d=act==='eat'?0.9:0.55;o.pel.set(0,pr.pelH*0.46,-0.05);o.lf.set(pr.hipOff.x+0.06,pr.footH,0.18);o.rf.set(-pr.hipOff.x-0.06,pr.footH,act==='eat'?-0.25:0.12);
    const sh=_tmpA.copy(pr.shOff);sh.y+=o.pel.y;const hy=act==='eat'?0.12+Math.abs(Math.sin(clockT*6+h.slot))*0.08:0.45+Math.sin(clockT*3+h.slot)*0.05;
    o.lh.set(0.18,hy,0.45);o.rh.set(-0.18,hy+0.03,0.42);bodyLocal(pr,Object.assign(o,{pitch:d,roll:0,twist:0,headPitch:act==='eat'?0.5+Math.sin(clockT*7)*0.15:0.3,headRoll:0,headYaw:0,pelPitch:0.3,kpL:_pole.set(0,0.3,1),kpR:_tmpB.set(0,0.3,1)}));}
  else if(act==='sit'){o.pel.set(0,0.18,0);o.lf.set(pr.hipOff.x+0.08,pr.footH,0.55);o.rf.set(-pr.hipOff.x-0.08,pr.footH,0.5);o.lh.set(0.25,0.2,0.3);o.rh.set(-0.25,0.2,0.3);
    bodyLocal(pr,Object.assign(o,{pitch:0.15,roll:0,twist:0,headPitch:0.1,headRoll:0,headYaw:headY,pelPitch:0,kpL:_pole.set(0,1,0.3),kpR:_tmpB.set(0,1,0.3)}));}
  else if(act==='getup'){getupLocal(h,clamp(h.getup,0,1));}
  else if(act==='crawl'){const t=ph;o.pel.set(Math.sin(t)*0.06,0.16,-0.55);o.lf.set(pr.hipOff.x,0.08,-0.55-pr.thigh-pr.shin+0.1);o.rf.set(-pr.hipOff.x,0.08,-0.5-pr.thigh-pr.shin+0.1);
    o.lh.set(0.25,0.06,0.45+Math.sin(t)*0.25);o.rh.set(-0.25,0.06,0.45-Math.sin(t)*0.25);bodyLocal(pr,Object.assign(o,{pitch:Math.PI/2-0.25,roll:Math.sin(t)*0.12,twist:0,headPitch:-1.0,headRoll:0,headYaw:Math.sin(t*0.5)*0.3,pelPitch:Math.PI/2,
      kpL:_pole.set(0,-1,0),kpR:_tmpB.set(0,-1,0),epL:_v3.set(0.5,-0.5,0),epR:_v4.set(-0.5,-0.5,0)}));}
  else{// de pie / caminando (gait)
    const bob=Math.abs(Math.cos(ph))*0.035*amp,sway=Math.sin(ph)*0.025*amp*g.sway;let pelY=pr.pelH-0.025-0.03*amp-bob;if(h.crouchK){pelY-=pr.pelH*h.crouchK;lean+=h.crouchK*0.5;}
    if(h.atkAnim>0){lean+=0.25;headP-=0.2;}if(act==='aim')lean=0.08;
    o.pel.set(sway,pelY,0);
    for(const side of [1,-1]){const lp=ph+(side>0?0:Math.PI);const limp=g.limp*side>0?Math.abs(g.limp):0;const st=pr.stride*0.5*amp*(1-limp*0.6);
      const lift=Math.max(0,Math.cos(lp))*0.12*amp*(1-limp*0.85)*(z?0.75:1);const f=side>0?o.lf:o.rf;f.set(side*(pr.hipOff.x+0.02)+(z?side*0.04:0),pr.footH+lift,Math.sin(lp)*st);
      if(limp>0&&Math.cos(lp)>0)pelY-=0.04*limp;}
    o.pel.y=pelY;
    const shL=_tmpA.set(pr.shOff.x,pr.shOff.y+pelY,pr.shOff.z),shR=_tmpB.set(-pr.shOff.x,pr.shOff.y+pelY,pr.shOff.z);
    let am=g.arms;if(h.atkAnim>0)am='reach';if(act==='aim'||(h.aim&&h.armed))am='aim';
    armTarget(pr,1,am==='mixed'?'forward':am,ph,amp,shL,o.lh,h);armTarget(pr,-1,am==='mixed'?'hang':am,ph,amp,shR,o.rh,h);
    if(z&&g.twitch){o.lh.x+=Math.sin(clockT*9+h.slot)*0.02*g.twitch;o.rh.y+=Math.sin(clockT*7.3+h.slot*2)*0.03*g.twitch;}
    bodyLocal(pr,Object.assign(o,{pitch:lean+Math.cos(ph*2)*0.02*amp,roll:Math.sin(ph)*0.03*amp*g.sway+(z?g.tilt*0.2:0),twist:Math.sin(ph)*0.08*amp,headPitch:headP,headRoll:headR,headYaw:headY,pelPitch:0,kpL:null,kpR:null,epL:null,epR:null}));}
  // a mundo
  const c=Math.cos(h.yaw),s=Math.sin(h.yaw);const gy=surfY(h.x,h.z,h.y+0.5);h.y=gy;
  for(let i=0;i<NP;i++){const l=LP[i];h.tgt[i].set(h.x+l.x*c+l.z*s,gy+l.y,h.z-l.x*s+l.z*c);}}
// levantarse: boca abajo → manos al suelo → rodilla → de pie (con torpeza zombi)
function getupLocal(h,t){const pr=h.pr,o=_o;const leg=pr.thigh+pr.shin;const z=h.type==='zombie';const wob=z?Math.sin(clockT*5+h.slot)*0.05:0;
  if(t<0.33){const u=t/0.33;const th=lerp(0.05,0.9,u*u);o.pel.set(0,0.14+u*0.06,-0.15);o.lf.set(pr.hipOff.x,0.08,-leg*0.95);o.rf.set(-pr.hipOff.x,0.08,-leg*0.95);
    o.lh.set(0.24,0.06,0.25+0.2*(1-u));o.rh.set(-0.24,0.06,0.25+0.2*(1-u));bodyLocal(pr,Object.assign(o,{pitch:Math.PI/2-th,roll:wob,twist:0,headPitch:-0.9+u*0.5,headRoll:0,headYaw:0,pelPitch:Math.PI/2-th*0.3,kpL:_pole.set(0,-1,0.2),kpR:_tmpB.set(0,-1,0.2),epL:_v3.set(0.6,0,-0.3),epR:_v4.set(-0.6,0,-0.3)}));}
  else if(t<0.66){const u=(t-0.33)/0.33;o.pel.set(0,lerp(0.2,pr.thigh+0.12,u),lerp(-0.15,-0.05,u));o.lf.set(pr.hipOff.x,0.08,lerp(-leg*0.95,0.35,clamp(u*1.6-0.4,0,1)));o.rf.set(-pr.hipOff.x,0.06,lerp(-leg*0.95,-pr.shin,u));
    o.lh.set(0.24,lerp(0.06,0.45,u),lerp(0.35,0.4,u));o.rh.set(-0.24,0.06+u*0.1,0.4);bodyLocal(pr,Object.assign(o,{pitch:lerp(0.7,0.45,u),roll:wob,twist:0,headPitch:-0.2,headRoll:0,headYaw:0,pelPitch:lerp(0.9,0.2,u),kpL:_pole.set(0,0.4,1),kpR:_tmpB.set(0,-0.6,1),epL:null,epR:null}));}
  else{const u=(t-0.66)/0.34;const e=u*u*(3-2*u);o.pel.set(0,lerp(pr.thigh+0.12,pr.pelH-0.03,e),0);o.lf.set(pr.hipOff.x,pr.footH,lerp(0.35,0.05,e));o.rf.set(-pr.hipOff.x,pr.footH,lerp(-pr.shin*0.7,0,e));
    o.lh.set(0.24,lerp(0.45,pr.pelH-0.1,e),lerp(0.4,0.1,e));o.rh.set(-0.24,lerp(0.3,pr.pelH-0.15,e),lerp(0.35,0.1,e));bodyLocal(pr,Object.assign(o,{pitch:lerp(0.45,h.gp.lean,e),roll:wob,twist:0,headPitch:h.gp.droop*e,headRoll:h.gp.tilt*e,headYaw:0,pelPitch:lerp(0.2,0,e),kpL:null,kpR:null}));}}

// ---------- huesos a partir de los puntos ----------
const _Mq=new Q4(),_Wh=new Q4(),_Ws1=new Q4(),_Ws2=new Q4(),_Wn=new Q4(),_Wls=new Q4(),_Wla=new Q4(),_Wrs=new Q4(),_Wra=new Q4(),_Wlu=new Q4(),_Wru=new Q4(),_Wll=new Q4(),_Wrl=new Q4(),_Fq=new Q4(),_ql=new Q4(),_qi=new Q4(),_dv=new V3(),_yawQ=new Q4();
const _Mh=new M4(),_Mi=new M4(),_Ma=new M4();
function limbLocal(W_par,dB,a,b,lq,out){_qi.copy(W_par).invert();_dv.subVectors(b,a).applyQuaternion(_qi).normalize();_ql.setFromUnitVectors(dB,_dv);return out.copy(_ql).multiply(lq);}
function driveBones(h){const T=h.tpl,s=h.sim,B=h.bones;_yawQ.setFromAxisAngle(UP,h.yaw);_Mq.copy(_yawQ).multiply(T.qFix).multiply(h.model.quaternion);
  frameQ(_v1.subVectors(s[CHEST],s[PELVIS]),_v2.subVectors(s[LHIP],s[RHIP]),_Fq);_Wh.copy(_Fq).multiply(T.C_hips);
  _qi.copy(_Mq).multiply(T.armQ).invert();B.Hips.quaternion.copy(_qi).multiply(_Wh);
  B.Spine.quaternion.copy(T.lq.Spine);B.Spine1.quaternion.copy(T.lq.Spine1);_Ws1.copy(_Wh).multiply(T.lq.Spine).multiply(T.lq.Spine1);
  frameQ(_v1.subVectors(s[CHEST],s[PELVIS]),_v2.subVectors(s[LSH],s[RSH]),_Fq);_Ws2.copy(_Fq).multiply(T.C_sp2);B.Spine2.quaternion.copy(_Ws1).invert().multiply(_Ws2);
  limbLocal(_Ws2,T.dNeck,s[CHEST],s[HEAD],T.lq.Neck,B.Neck.quaternion);_Wn.copy(_Ws2).multiply(B.Neck.quaternion);B.Head.quaternion.copy(T.lq.Head);
  B.LeftShoulder.quaternion.copy(T.lq.LeftShoulder);_Wls.copy(_Ws2).multiply(T.lq.LeftShoulder);limbLocal(_Wls,T.dLA,s[LSH],s[LELB],T.lq.LeftArm,B.LeftArm.quaternion);_Wla.copy(_Wls).multiply(B.LeftArm.quaternion);
  limbLocal(_Wla,T.dLF,s[LELB],s[LHAND],T.lq.LeftForeArm,B.LeftForeArm.quaternion);
  B.RightShoulder.quaternion.copy(T.lq.RightShoulder);_Wrs.copy(_Ws2).multiply(T.lq.RightShoulder);limbLocal(_Wrs,T.dRA,s[RSH],s[RELB],T.lq.RightArm,B.RightArm.quaternion);_Wra.copy(_Wrs).multiply(B.RightArm.quaternion);
  limbLocal(_Wra,T.dRF,s[RELB],s[RHAND],T.lq.RightForeArm,B.RightForeArm.quaternion);
  limbLocal(_Wh,T.dLU,s[LHIP],s[LKNEE],T.lq.LeftUpLeg,B.LeftUpLeg.quaternion);_Wlu.copy(_Wh).multiply(B.LeftUpLeg.quaternion);limbLocal(_Wlu,T.dLL,s[LKNEE],s[LFOOT],T.lq.LeftLeg,B.LeftLeg.quaternion);
  limbLocal(_Wh,T.dRU,s[RHIP],s[RKNEE],T.lq.RightUpLeg,B.RightUpLeg.quaternion);_Wru.copy(_Wh).multiply(B.RightUpLeg.quaternion);limbLocal(_Wru,T.dRL,s[RKNEE],s[RFOOT],T.lq.RightLeg,B.RightLeg.quaternion);
  if(h.mode==='kin'||h.k>0.5){_Wll.copy(_Wlu).multiply(B.LeftLeg.quaternion);_Wrl.copy(_Wru).multiply(B.RightLeg.quaternion);
    B.LeftFoot.quaternion.copy(_Wll).invert().multiply(_ql.copy(_Mq).multiply(T.bq.LeftFoot));B.RightFoot.quaternion.copy(_Wrl).invert().multiply(_ql.copy(_Mq).multiply(T.bq.RightFoot));}
  // posición de la cadera
  h.holder.position.set(h.x,h.y,h.z);h.holder.quaternion.copy(_yawQ);_Mh.compose(h.holder.position,_yawQ,_s.set(1,1,1));_Mi.compose(h.inner.position,h.inner.quaternion,h.inner.scale);
  _Ma.multiplyMatrices(_Mh,_Mi).multiply(h.model.matrix).multiply(T.armM).invert();B.Hips.position.copy(s[PELVIS]).applyMatrix4(_Ma);
  if(h.prop&&h.prop.visible){const aiming=h.aim||h.act==='aim';h.prop.position.copy(s[RHAND]);if(aiming)_dv.subVectors(s[LHAND],s[RHAND]);else _dv.set(Math.sin(h.yaw)*0.4,-1,Math.cos(h.yaw)*0.4);if(_dv.lengthSq()>1e-6)h.prop.quaternion.setFromUnitVectors(_v.set(0,0,1),_dv.normalize());}}

// ---------- física (ragdoll activo con límites articulares) ----------
const FDT=1/60;
// distancias mínimas entre puntos (fracción de la pierna): [a,b,flácido,con tono muscular]. El «tono» (h.rig) evita que el cuerpo se pliegue como un trapo
const MINC=[[LHIP,LFOOT,0.42,0.9],[RHIP,RFOOT,0.42,0.9],[LSH,LHAND,0.3,0.56],[RSH,RHAND,0.3,0.56],[LFOOT,RFOOT,0.14,0.2],[LKNEE,RKNEE,0.11,0.16],[HEAD,PELVIS,0.82,0.96],[LHAND,RHAND,0.08,0.2],
  [HEAD,LKNEE,0.5,0.98],[HEAD,RKNEE,0.5,0.98],[CHEST,LKNEE,0.3,0.7],[CHEST,RKNEE,0.3,0.7],[HEAD,LFOOT,0.6,1.5],[HEAD,RFOOT,0.6,1.5],[LHAND,LHIP,0.05,0.16],[RHAND,RHIP,0.05,0.16]];
function enterPhys(h){if(h.mode==='phys')return;for(let i=0;i<NP;i++){h.prev[i].copy(h.sim[i]);h.prev[i].x-=h.vx*FDT;h.prev[i].z-=h.vz*FDT;}h.mode='phys';h.k=1;h.acc=0;h.sleep=0;}
function applyImp(h,imp,pi){if(!imp)return;const w=NBW[pi<0?CHEST:pi];for(let i=0;i<NP;i++)h.prev[i].addScaledVector(imp,-FDT*w[i]);h.sleep=0;}
const _cp={x:0,z:0},_kf=new V3(),_km=new V3();
// pares de segmentos (muslos, espinillas, brazos y tronco) que no pueden atravesarse: [a0,a1,b0,b1,distancia mínima]
const LIMBX=[[LHIP,LKNEE,RHIP,RKNEE,0.15],[LKNEE,LFOOT,RKNEE,RFOOT,0.13],[LHIP,LKNEE,RKNEE,RFOOT,0.14],[LKNEE,LFOOT,RHIP,RKNEE,0.14],
  [LSH,LELB,CHEST,PELVIS,0.16],[LELB,LHAND,CHEST,PELVIS,0.15],[RSH,RELB,CHEST,PELVIS,0.16],[RELB,RHAND,CHEST,PELVIS,0.15],[LELB,LHAND,LHIP,LKNEE,0.12],[RELB,RHAND,RHIP,RKNEE,0.12]];
const _sideN=new V3();
// cuerpos caídos que no se atraviesan entre sí
function sepBodies(){const L=[];for(const h of H_)if(h.active&&h.mode==='phys')L.push(h);
  for(let a=0;a<L.length;a++)for(let b=a+1;b<L.length;b++){const A=L[a].sim,B=L[b].sim;if(Math.abs(A[PELVIS].x-B[PELVIS].x)>2||Math.abs(A[PELVIS].z-B[PELVIS].z)>2)continue;
    for(let i=0;i<NP;i++)for(let j=0;j<NP;j++){const p=A[i],q=B[j];const r=PR[i]+PR[j];const dx=q.x-p.x,dy=q.y-p.y,dz=q.z-p.z;const d2=dx*dx+dy*dy+dz*dz;if(d2>=r*r||d2<1e-8)continue;const d=Math.sqrt(d2),k=(r-d)/d*0.5;
      p.x-=dx*k;p.y-=dy*k*0.5;p.z-=dz*k;q.x+=dx*k;q.y+=dy*k*0.5;q.z+=dz*k;L[a].sleep=0;L[b].sleep=0;}}}
function segSep(a0,a1,b0,b1,mn){const ux=a1.x-a0.x,uy=a1.y-a0.y,uz=a1.z-a0.z,vx=b1.x-b0.x,vy=b1.y-b0.y,vz=b1.z-b0.z,wx=a0.x-b0.x,wy=a0.y-b0.y,wz=a0.z-b0.z;
  const A=ux*ux+uy*uy+uz*uz,B=ux*vx+uy*vy+uz*vz,C=vx*vx+vy*vy+vz*vz,D=ux*wx+uy*wy+uz*wz,E=vx*wx+vy*wy+vz*wz;const den=A*C-B*B;
  let s=den>1e-9?clamp((B*E-C*D)/den,0,1):0;let t=C>1e-9?clamp((B*s+E)/C,0,1):0;s=A>1e-9?clamp((B*t-D)/A,0,1):0;
  const dx=(a0.x+ux*s)-(b0.x+vx*t),dy=(a0.y+uy*s)-(b0.y+vy*t),dz=(a0.z+uz*s)-(b0.z+vz*t);const d=Math.sqrt(dx*dx+dy*dy+dz*dz);if(d>=mn)return;
  let nx,ny,nz;if(d<1e-5){nx=uy*vz-uz*vy;ny=uz*vx-ux*vz;nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;}else{nx=dx/d;ny=dy/d;nz=dz/d;}
  const c=(mn-d)*0.5;const wa0=1-s,wa1=s,wb0=1-t,wb1=t;const ka=c/(wa0*wa0+wa1*wa1),kb=c/(wb0*wb0+wb1*wb1);
  a0.x+=nx*ka*wa0;a0.y+=ny*ka*wa0;a0.z+=nz*ka*wa0;a1.x+=nx*ka*wa1;a1.y+=ny*ka*wa1;a1.z+=nz*ka*wa1;
  b0.x-=nx*kb*wb0;b0.y-=ny*kb*wb0;b0.z-=nz*kb*wb0;b1.x-=nx*kb*wb1;b1.y-=ny*kb*wb1;b1.z-=nz*kb*wb1;}
function verlet(h){const p=h.sim,q=h.prev,t=h.tgt;const k=h.dead?0:h.k;if(h.dead)h.rig=Math.max(0.5,h.rig-FDT*0.5);const rg=h.dead?h.rig:Math.max(0.55,k);const damp=k>0.05?0.93:0.985;const legL=h.pr.thigh+h.pr.shin;
  for(let i=0;i<NP;i++){const a=p[i],b=q[i];const vx=(a.x-b.x)*damp,vy=(a.y-b.y)*damp,vz=(a.z-b.z)*damp;b.copy(a);a.x+=vx;a.y+=vy-9.81*FDT*FDT;a.z+=vz;}
  const brace=h.brace>0&&!h.dead;if(k>0||brace)for(let i=0;i<NP;i++){const s=brace?(ARMPT[i]?0.42*h.kp[i]:0):k*h.kp[i]*h.kl[i]*0.3;if(s>0){p[i].x+=(t[i].x-p[i].x)*s;p[i].y+=(t[i].y-p[i].y)*s;p[i].z+=(t[i].z-p[i].z)*s;}}
  for(let it=0;it<5;it++){for(let s=0;s<STICKS.length;s++){const a=p[STICKS[s][0]],b=p[STICKS[s][1]];const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;const d=Math.sqrt(dx*dx+dy*dy+dz*dz)||1e-4;const f=(d-h.rest[s])/d*0.5;
      a.x+=dx*f;a.y+=dy*f;a.z+=dz*f;b.x-=dx*f;b.y-=dy*f;b.z-=dz*f;}
    for(const [ia,ib,f0,f1] of MINC){const a=p[ia],b=p[ib];const mn=(f0+(f1-f0)*rg)*(ia===HEAD&&ib===PELVIS?h.rest[3]:legL*(ia===LSH||ia===RSH?0.75:1));const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;const d=Math.sqrt(dx*dx+dy*dy+dz*dz)||1e-4;
      if(d<mn){const f=(d-mn)/d*0.5;a.x+=dx*f;a.y+=dy*f;a.z+=dz*f;b.x-=dx*f;b.y-=dy*f;b.z-=dz*f;}}
    // rodillas hacia delante, codos hacia atrás
    _fx.subVectors(p[LHIP],p[RHIP]);_fy.subVectors(p[CHEST],p[PELVIS]);_kf.crossVectors(_fx,_fy).normalize();_sideN.copy(_fx).normalize();
    for(const [hp,kn,ft,sg] of [[LHIP,LKNEE,LFOOT,1],[RHIP,RKNEE,RFOOT,1],[LSH,LELB,LHAND,-1],[RSH,RELB,RHAND,-1]]){_km.addVectors(p[hp],p[ft]).multiplyScalar(0.5);const dd=_v.subVectors(p[kn],_km).dot(_kf)*sg;
      if(dd<-0.01){p[kn].addScaledVector(_kf,-dd*sg*0.6);p[ft].addScaledVector(_kf,dd*sg*0.2);}
      if(sg>0){_v.subVectors(p[kn],_km);const lat=_v.dot(_sideN);p[kn].addScaledVector(_sideN,-lat*0.75);}}
    for(const [a0,a1,b0,b1,rr] of LIMBX)segSep(p[a0],p[a1],p[b0],p[b1],rr);
    for(let i=0;i<NP;i++){const gy=surfY(p[i].x,p[i].z,p[i].y)+PR[i];if(p[i].y<gy)p[i].y=gy;}}
  let mv=0;for(let i=0;i<NP;i++){const a=p[i],b=q[i];const gy=surfY(a.x,a.z,a.y)+PR[i];
    if(a.y<=gy+0.005){b.x=a.x-(a.x-b.x)*0.5;b.z=a.z-(a.z-b.z)*0.5;if(b.y<a.y)b.y=a.y-(a.y-b.y)*0.15;}
    _cp.x=a.x;_cp.z=a.z;if(collide(_cp,PR[i],a.y)){b.x+=_cp.x-a.x;b.z+=_cp.z-a.z;a.x=_cp.x;a.z=_cp.z;}mv+=Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+Math.abs(a.z-b.z);}
  return mv;}
function carBodies(h){const pv=h.sim[PELVIS];for(const c of cars){const dx0=pv.x-c.x,dz0=pv.z-c.z;if(dx0*dx0+dz0*dz0>16)continue;const s=Math.sin(c.yaw),co=Math.cos(c.yaw);const vx=s*c.speed+co*c.vLat,vz=co*c.speed-s*c.vLat;const hl=c.len/2,hw=c.halfW;
    for(let i=0;i<NP;i++){const p=h.sim[i],q=h.prev[i];const dx=p.x-c.x,dz=p.z-c.z;const lx=dx*co-dz*s,lz=dx*s+dz*co,ly=p.y-c.y;const r=PR[i];
      const top=lz>hl*0.36?0.95:lz<-hl*0.82?1.05:1.5;if(Math.abs(lx)>hw+r||Math.abs(lz)>hl+r||ly>top+r||ly<0.15)continue;
      const dT=top+r-ly,dS=hw+r-Math.abs(lx),dF=hl+r-Math.abs(lz);
      if(dT<dS&&dT<dF){p.y+=dT;const ux=p.x-q.x,uz=p.z-q.z;q.x=p.x-(ux+(vx*FDT-ux)*0.12);q.z=p.z-(uz+(vz*FDT-uz)*0.12);if(q.y<p.y)q.y=p.y-0.001;}
      else if(dS<dF){const sg=Math.sign(lx)||1;p.x+=co*sg*dS;p.z-=s*sg*dS;q.x=p.x-vx*FDT;q.z=p.z-vz*FDT;}
      else{const sg=Math.sign(lz)||1;p.x+=s*sg*dF;p.z+=co*sg*dF;q.x=p.x-vx*FDT*1.05;q.z=p.z-vz*FDT*1.05;const sp=Math.abs(c.speed);if(sp>3&&ly>0.3)q.y=Math.min(q.y,p.y-sp*0.22*FDT*(ly>0.7?1:0.5));}h.sleep=0;}}}
const _wq=new Q4(),_wv=new V3();
function updateWoundGravity(h){if(!h.woundB||!h.tpl.face)return;const rq=h.tpl.face.rq;for(let k=0;k<8;k++){const n=h.woundB[k];if(!n||!h.woundU[k].w)continue;const b=h.bones[n];if(!b)continue;
  b.getWorldQuaternion(_wq);_wv.set(0,-1,0).applyQuaternion(_wq.invert()).applyQuaternion(h.tpl.bq[n]).applyQuaternion(rq);h.woundD[k].copy(_wv);}}
function physStep(h,dt){h.acc+=dt;let n=0,mv=0;while(h.acc>=FDT&&n<3){h.acc-=FDT;n++;mv=verlet(h);carBodies(h);}if(h.acc>FDT*3)h.acc=0;return mv;}
function startGetUp(h){const s=h.sim;h.x=s[PELVIS].x;h.z=s[PELVIS].z;_cp.x=h.x;_cp.z=h.z;collide(_cp,0.3,h.y+0.3);h.x=_cp.x;h.z=_cp.z;
  _v.subVectors(s[HEAD],s[PELVIS]);if(Math.abs(_v.x)+Math.abs(_v.z)>0.2)h.yaw=Math.atan2(_v.x,_v.z);h.down=0;h.act='getup';h.getup=0;h.k=0.25;}
// ---------- heridas visibles (calcomanías de sangre pegadas al hueso) ----------
const woundMat=new THREE.MeshLambertMaterial({map:texBlood,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4});const woundGeo=new THREE.PlaneGeometry(1,1);
const poolMat=pbr(new THREE.MeshStandardMaterial({map:texBlood,transparent:true,alphaTest:0.4,roughness:0.12,metalness:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}));
const _wr=new THREE.Raycaster(),_wa=new V3(),_wb=new V3(),_wc=new V3(),_wl=new V3(),_wbc=new V3();
// la herida se busca sobre la malla tal y como está ahora y se guarda en la pose de reposo: así se queda pegada a la piel y se mueve con ella
function addWound(h,part,pos,dir,size){if(!S.gore||!h.woundU)return;h.holder.updateMatrixWorld(true);for(const m of h.meshes)m.boundingSphere=null;
  _wr.set(_v.copy(pos).addScaledVector(dir,-0.7),dir);_wr.far=1.6;const hit=_wr.intersectObjects(h.meshes,false)[0];if(!hit||!hit.face)return;const m=hit.object,f=hit.face;
  m.getVertexPosition(f.a,_wa);m.getVertexPosition(f.b,_wb);m.getVertexPosition(f.c,_wc);m.worldToLocal(_wl.copy(hit.point));THREE.Triangle.getBarycoord(_wl,_wa,_wb,_wc,_wbc);
  const P=m.geometry.attributes.position;const x=P.getX(f.a)*_wbc.x+P.getX(f.b)*_wbc.y+P.getX(f.c)*_wbc.z,y=P.getY(f.a)*_wbc.x+P.getY(f.b)*_wbc.y+P.getY(f.c)*_wbc.z,z=P.getZ(f.a)*_wbc.x+P.getZ(f.b)*_wbc.y+P.getZ(f.c)*_wbc.z;
  const k=h.woundI++%8;const blunt=HITKIND==='blunt';{let bi=CHEST,bd=1e9;for(let i=0;i<NP;i++){const d=h.sim[i].distanceToSquared(hit.point);if(d<bd){bd=d;bi=i;}}h.woundB[k]=BN[bi];}h.woundU[k].set(x,y,z,(blunt?-size*0.5:size*0.35)/(h.tpl.height*h.s));h.woundT[k]=clockT;
  if(!blunt){let bi=CHEST,bd=1e9;for(let i=0;i<NP;i++){const d=h.sim[i].distanceToSquared(hit.point);if(d<bd){bd=d;bi=i;}}(h.bleeds||(h.bleeds=[])).push({i:bi,o:hit.point.clone().sub(h.sim[bi]),until:clockT+R(5,9),t:0});if(h.bleeds.length>4)h.bleeds.shift();}}
let HITKIND='';
const pools=[];function bloodPool(x,z,y){if(S.gore<2||pools.length>40)return;y=surfY(x,z,y+0.3);let mx=0;for(let k=0;k<8;k++){const a=k*0.785;for(const r of [0.4,0.8,1.2]){if(Math.abs(surfY(x+Math.cos(a)*r,z+Math.sin(a)*r,y+0.3)-y)>0.04){mx=mx?Math.min(mx,r):r;break;}}}const m=new THREE.Mesh(woundGeo,poolMat);m.rotation.x=-Math.PI/2;m.rotation.z=R(0,6);m.position.set(x,y+0.015,z);m.scale.setScalar(0.2);scene.add(m);pools.push({m,s:0.2,max:mx?Math.max(0.3,mx*1.4):R(1.2,2),t:180});}

// ---------- daño por zonas y reacciones ----------
function anger(h){if(h.type==='zombie')return;if(h.base){if(!h.base.angry&&h.base.type==='good')toast(`¡Has atacado a ${h.base.name}! Ahora son hostiles.`);h.base.angry=true;}else h.angry=true;}
const ARMPT=[0,0,0,0,0,0,0,1,1,1,1,0,0,0,0];
// pierna rota: cae apoyando las manos, se levanta y cojea arrastrándola; con las dos rotas, se arrastra
function breakLimb(h,part){h.broken[part]=true;
  if(part==='lLeg'||part==='rLeg'){const other=part==='lLeg'?'rLeg':'lLeg';
    if(h.broken[other]){for(const i of LIMB_PTS[part])h.kp[i]=0.02;h.permPhys=true;h.crawler=true;h.down=1e9;h.act='crawl';return;}
    h.gp.limp=(part==='lLeg'?1:-1)*1.0;h.gp.speedMul*=0.45;h.gp.drag=part;knockDown(h,null,R(2.5,4));return;}
  for(const i of LIMB_PTS[part])h.kp[i]=0.02;h.permPhys=true;}
function knockDown(h,imp,t){h.k=0;h.down=t||R(1.4,3);h.act='stand';h.brace=0.75;const c=h.sim[CHEST],pv=h.prev[CHEST];let dx=imp?imp.x:c.x-pv.x,dz=imp?imp.z:c.z-pv.z;const l=Math.hypot(dx,dz);
  if(l<1e-4){dx=Math.sin(h.yaw);dz=Math.cos(h.yaw);}else{dx/=l;dz/=l;}h.braceDir=[dx,dz];}
// manos por delante al caer
function braceTargets(h){const p=h.sim,t=h.tgt;const d=h.braceDir||[Math.sin(h.yaw),Math.cos(h.yaw)];const g=surfY(p[PELVIS].x,p[PELVIS].z,p[PELVIS].y)+0.06;
  for(const [sh,el,ha,sd] of [[LSH,LELB,LHAND,1],[RSH,RELB,RHAND,-1]]){const s=p[sh];const px=-d[1]*sd*0.18,pz=d[0]*sd*0.18;
    t[ha].set(s.x+d[0]*0.55+px,Math.max(g,s.y-0.75),s.z+d[1]*0.55+pz);t[el].set((s.x+t[ha].x)/2+px*0.5,(s.y+t[ha].y)/2,(s.z+t[ha].z)/2+pz*0.5);}}
function die(h,by){h.dead=true;h.deadT=0;h.k=0;h.sleep=0;h.rig=1;
  // cae a plomo, como un árbol: el tronco se va en la dirección del golpe (o hacia atrás) y los pies se quedan
  {const c=h.sim[CHEST],pc=h.prev[CHEST];let dx=c.x-pc.x,dz=c.z-pc.z;const l=Math.hypot(dx,dz);if(l<0.004){const a=h.yaw+Math.PI+R(-0.9,0.9);dx=Math.sin(a);dz=Math.cos(a);}else{dx/=l;dz/=l;}
    const fy=Math.min(h.sim[LFOOT].y,h.sim[RFOOT].y);for(let i=0;i<NP;i++){const w=clamp((h.sim[i].y-fy)/1.5,0,1.1)*1.5;h.prev[i].x-=dx*w*FDT;h.prev[i].z-=dz*w*FDT;}}
h.reanimate=!!S.reanimate&&by==='zombie'&&h.type!=='zombie';h.aim=0;
  if(h.type==='zombie'&&by==='player')P.kills++;if(h.type!=='zombie'){h.searched=false;if(h.base){const i=h.base.members.indexOf(h);if(i>=0)h.base.members.splice(i,1);}}
  if(h.prop&&h.prop.visible){const pr=h.prop;h.prop=null;dropObj(pr,pr.position.clone(),_v.set(R(-1,1),1,R(-1,1)),true);}
  setTimeout(()=>{if(h.active&&h.dead)bloodPool(h.sim[CHEST].x,h.sim[CHEST].z,h.sim[CHEST].y-0.1);},1500);}
function hitChar(h,part,dmg,imp,pi,by,pos,dir){if(!h.active)return;if(by==='player')anger(h);
  enterPhys(h);applyImp(h,imp,pi);if(pos&&dir)addWound(h,part,pos,dir,part==='head'?R(0.1,0.16):R(0.12,0.22));if(h.dead)return;h.lastHitT=clockT;
  if(part==='head')h.headHp-=dmg;else if(part==='body')h.bodyHp-=dmg;
  else if(h.limb[part]!==undefined){h.limb[part]-=dmg;h.bodyHp=Math.max(1,h.bodyHp-dmg*0.1);if(h.limb[part]<=0&&!h.broken[part])breakLimb(h,part);}
  if(h.headHp<=0||h.bodyHp<=0){die(h,by);return;}
  const mag=imp?imp.length():0;// golpes flojos: solo cede la zona golpeada; golpes fuertes: tambaleo; muy fuertes: al suelo
  const loc=clamp(mag/5,0.35,1);const w=NBW[pi<0?CHEST:pi];for(let i=0;i<NP;i++)h.kl[i]=Math.min(h.kl[i],1-w[i]*loc);
  h.k=Math.max(0,h.k-Math.max(0,(mag-3.2)/(h.type==='zombie'?7:5.5)));
  if(h.k<0.12&&h.down<=0&&!h.crawler)knockDown(h,imp,R(1.4,3)*(h.type==='zombie'?1:1.3));
  // golpe en una pierna sin romperla: cojea más y puede tropezar
  if((part==='lLeg'||part==='rLeg')&&!h.broken[part]&&!h.dead){const sg=part==='lLeg'?1:-1;h.gp.limp=clamp((Math.sign(h.gp.limp)===sg?Math.abs(h.gp.limp):0)+dmg/70,0,0.9)*sg;h.gp.speedMul=Math.max(0.35,h.gp.speedMul*0.9);
    if(h.down<=0&&Math.random()<clamp(dmg/90,0.15,0.6))knockDown(h,imp,R(1.2,2.2));}
  if(h.type!=='zombie'&&by==='player'&&!h.target)h.target='player';}
const charPoints=h=>h.sim;
const headC=(pts,out)=>out.subVectors(pts[HEAD],pts[CHEST]).normalize().multiplyScalar(0.09).add(pts[HEAD]);

// =====================================================================
// CONSTRUCCIÓN DEL MUNDO Y MAPA
// =====================================================================
const MAPS=1.4;const mapC=document.createElement('canvas');mapC.width=Math.ceil((XMAX-XMIN+80)*MAPS);mapC.height=Math.ceil((ZMAX-ZMIN+80)*MAPS);
const mtx=x=>(x-XMIN+40)*MAPS,mtz=z=>(z-ZMIN+40)*MAPS;
function drawMap(){const g=mapC.getContext('2d');g.fillStyle='#3a3c40';g.fillRect(0,0,mapC.width,mapC.height);
  for(const b of BLOCKS){g.fillStyle='#8f8a82';g.beginPath();b.cp.forEach((p,k)=>k?g.lineTo(mtx(p[0]),mtz(p[1])):g.moveTo(mtx(p[0]),mtz(p[1])));g.closePath();g.fill();
    g.fillStyle=b.outer?'#55555a':'#6e6a66';g.beginPath();b.bp.forEach((p,k)=>k?g.lineTo(mtx(p[0]),mtz(p[1])):g.moveTo(mtx(p[0]),mtz(p[1])));g.closePath();g.fill();}
  g.fillStyle='#8f8a82';for(const P of MAPD.peds){g.beginPath();P.forEach((p,k)=>k?g.lineTo(mtx(p[0]),mtz(p[1])):g.moveTo(mtx(p[0]),mtz(p[1])));g.closePath();g.fill();}
  for(const s of MAPD.shops){g.fillStyle={super:'#ff7a3a',bar:'#f1c40f',restaurant:'#f1c40f',farmacia:'#2ecc71',forn:'#e8c090',ferre:'#b08060',fruteria:'#9be05a'}[s.type]||'#d0d0d0';g.fillRect(mtx(s.x)-3,mtz(s.z)-3,6,6);}
  for(const p of MAPD.pois){g.fillStyle={good:'#4cd964',bandit:'#ff4444'}[p.t]||'#fff';g.beginPath();g.arc(mtx(p.x),mtz(p.z),9,0,7);g.fill();}
  g.font='bold 15px sans-serif';g.fillStyle='rgba(255,255,255,.85)';g.textAlign='center';
  for(const s of VSTR){g.save();g.translate(mtx(s.pos),mtz(0));g.rotate(-Math.PI/2);g.fillText(s.n,0,5);g.restore();}
  for(const s of HSTR){g.fillText(s.n,mtx(SX0+BP*0.5),mtz(s.pos)+5);}}
let worldBuilt=false;
function buildWorld(){if(worldBuilt)return;worldBuilt=true;const t0=performance.now();
  planSupers();buildStreets();
  for(const bk of BLOCKS)buildBlock(bk);
  finishSigns();buildBases();buildMoeve();decayWorld();buildChunks();buildInst();drawMap();
  console.log('mundo',(performance.now()-t0)|0,'ms',BLOCKS.length,'manzanas',shopCount,'locales',LOOT.length,'botín',DOORS.length,'puertas');}

const HFIT={kx:0.034,ky:-0.032,kz:0.02,fx:-0.15,fy:-1,fz:0.1,gr:-1.27,gy:-0.014,gz:0.026};

// =====================================================================
// OBJETOS E INVENTARIO
// =====================================================================
const ITEMS={
  judias:{n:'Lata de judías',t:'food',food:30,water:-3,w:0.45},atun:{n:'Lata de atún',t:'food',food:24,w:0.2},olivas:{n:'Lata de olivas',t:'food',food:12,water:-4,w:0.25},
  sopa:{n:'Sopa en lata',t:'food',food:22,water:10,w:0.4},galletas:{n:'Galletas',t:'food',food:18,w:0.25},choco:{n:'Chocolatina',t:'food',food:10,mood:6,w:0.1},
  patatas:{n:'Bolsa de patatas',t:'food',food:12,water:-6,w:0.1},cereales:{n:'Cereales',t:'food',food:20,w:0.3},
  pan:{n:'Pan',t:'food',food:20,w:0.3,perish:1},manzana:{n:'Manzana',t:'food',food:12,water:6,w:0.2,perish:1},bocata:{n:'Bocadillo',t:'food',food:34,w:0.3,perish:1},
  magdalenas:{n:'Magdalenas',t:'food',food:16,mood:3,w:0.2,perish:1},yogur:{n:'Yogur',t:'food',food:10,water:4,w:0.13,perish:1},embutido:{n:'Fuet',t:'food',food:26,w:0.2,perish:1},
  agua:{n:'Botella de agua',t:'drink',water:40,w:0.5},refresco:{n:'Refresco',t:'drink',water:25,mood:4,w:0.35},zumo:{n:'Zumo',t:'drink',water:30,food:4,w:0.35,perish:1},
  cerveza:{n:'Cerveza',t:'drink',water:15,mood:10,w:0.35},leche:{n:'Leche',t:'drink',water:25,food:6,w:1,perish:1},
  vendas:{n:'Venda',t:'med',hp:22,w:0.05},analgesicos:{n:'Analgésicos',t:'med',hp:5,mood:8,w:0.05},antibioticos:{n:'Antibióticos',t:'med',sick:-60,w:0.05},
  papel:{n:'Papel higiénico',t:'misc',w:0.1},gasolina:{n:'Bidón de gasolina',t:'misc',w:4},balas:{n:'Balas 9 mm',t:'ammo',w:0.012},mochila:{n:'Mochila',t:'bag',w:0.6},
};
const CONDN=['fresco','rancio','podrido'];
const P={};
const G={mag:12,chamber:true,locked:false,kick:0};let BELT=[12,12];let leftHold=null,slideGrab=null;
function resetPlayer(){Object.assign(P,{hp:100,food:80,water:80,bladder:20,bowels:20,energy:90,mood:70,sick:0,infected:false,infT:0,
  items:[],bag:false,weapon:'bate',alive:true,inCar:null,light:false,sleeping:false,sleepLeft:0,kills:0,yaw:0,pitch:0,carYaw:0,sprinting:false,crouch:false,crouchToggle:false,crouchOff:0,feetY:undefined,hOff:0,deadT:0,accT:0,peeT:0,stepT:0,vomitT:2,lastSafe:new V3()});
  addItem('judias',1,'gift');addItem('agua',2,'gift');addItem('vendas',1,'gift');addItem('balas',14,'gift');addItem('papel',1,'gift');
  G.mag=12;G.chamber=true;G.locked=false;BELT=[12,12];leftHold=null;slideGrab=null;
  const b=BASES.find(x=>x.name&&x.name.includes('Ninot'))||BASES.find(x=>x.type==='good')||{x:0,z:0,r:10};const g0=b.gate||[b.x,b.z-26];let sx=g0[0],sz=g0[1];
  for(let k=0;k<80;k++){const a=k*2.4,r=1.5+k*0.15;const x=g0[0]+Math.sin(a)*r,z=g0[1]-Math.cos(a)*r;const y=surfY(x,z);if(!collide({x,z},0.45,y+0.3,y+1.7)&&!insideVol(x,y+1,z)){sx=x;sz=z;break;}}
  rig.position.set(sx,surfY(sx,sz),sz);P.yaw=Math.atan2(sx-b.x,sz-b.z);rig.rotation.set(0,0,0);P.lastSafe.set(sx,surfY(sx,sz)+1.6,sz);}
const effCond=e=>(!ITEMS[e.id].perish||!S.spoil)?e.c0:Math.min(2,e.c0+Math.floor((dayNum()-e.day)/2));
function rollCond(id,src){if(!ITEMS[id].perish||!S.spoil)return 0;const r=Math.random();if(src==='out')return r<0.7?2:r<0.95?1:0;if(src==='in')return r<0.35?0:r<0.8?1:2;if(src==='fridge')return r<0.1?0:r<0.45?1:2;return 0;}
const invWeight=()=>P.items.reduce((a,e)=>a+ITEMS[e.id].w*e.n,0);const invCap=()=>10+(P.bag?15:0);
function countItem(id){return P.items.filter(e=>e.id===id).reduce((a,e)=>a+e.n,0);}
function takeItem(id,n){let left=n;for(const e of P.items){if(e.id!==id||left<=0)continue;const t=Math.min(e.n,left);e.n-=t;left-=t;}P.items=P.items.filter(e=>e.n>0);return n-left;}
function addItem(id,n,src){const def=ITEMS[id];if(!def)return 0;if(invWeight()+def.w*n>invCap()+6){toast('Vas demasiado cargado');return 0;}
  if(id==='mochila'&&!P.bag){P.bag=true;toast('Te equipas la mochila: +15 kg de capacidad');return n;}
  const c0=rollCond(id,src);const day=dayNum();let e=P.items.find(x=>x.id===id&&x.c0===c0&&x.day===day);if(!e){e={id,c0,day,n:0};P.items.push(e);}e.n+=n;return n;}
function itemLabel(e){const d=ITEMS[e.id];const c=d.perish&&S.spoil?` (${CONDN[effCond(e)]})`:'';return `${d.n}${c} ×${e.n}`;}
function useEntry(e){const d=ITEMS[e.id];const c=effCond(e);
  if(d.t==='food'){if(P.food>97)return toast('Estás lleno');const mult=[1,0.8,0.5][c];P.food=Math.min(100,P.food+d.food*mult);P.water=clamp(P.water+(d.water||0),0,100);P.mood=clamp(P.mood+(d.mood||0)-(c===2?8:0),0,100);P.bowels=Math.min(100,P.bowels+6);
    if(c===2){P.sick=Math.min(100,P.sick+55);toast(`¡${d.n} estaba podrido! Te encuentras fatal`);}else if(c===1&&Math.random()<0.45){P.sick=Math.min(100,P.sick+25);toast(`${d.n} sabía raro… te duele la tripa`);}else toast(`Comes: ${d.n}`);}
  else if(d.t==='drink'){if(P.water>97)return toast('No tienes sed');P.water=Math.min(100,P.water+d.water);P.food=Math.min(100,P.food+(d.food||0));P.mood=Math.min(100,P.mood+(d.mood||0));P.bladder=Math.min(100,P.bladder+14);
    if(c===2){P.sick=Math.min(100,P.sick+40);toast(`¡${d.n} estaba cortado!`);}else toast(`Bebes: ${d.n}`);sfx('drink');}
  else if(d.t==='med'){if(d.hp){if(P.hp>=100&&!d.mood)return toast('No estás herido');P.hp=Math.min(100,P.hp+d.hp);}if(d.mood)P.mood=Math.min(100,P.mood+d.mood);if(d.sick)P.sick=Math.max(0,P.sick+d.sick);toast(`Usas: ${d.n}`);}
  else if(e.id==='papel')return toast('El papel se usa al cagar');else if(e.id==='gasolina')return toast('Acércate a un coche y usa «Repostar» en el menú');
  else if(e.id==='balas')return toast('Las balas rellenan los cargadores del cinturón');else return;
  e.n--;P.items=P.items.filter(x=>x.n>0);}
function dropEntry(e){e.n--;P.items=P.items.filter(x=>x.n>0);toast(`Tiras: ${ITEMS[e.id].n}`);}
let gameMin=8*60;const dayNum=()=>Math.floor(gameMin/1440)+1;const hourF=()=>(gameMin%1440)/60;const playerPos=()=>camW;
const nearToilet=()=>TOILETS.find(t=>Math.hypot(t.x-camW.x,t.z-camW.z)<2.2&&(t.y===undefined||Math.abs(camW.y-1.6-t.y)<1.5));
// botín: qué hay en cada sitio
const LT={super_conservas:[['judias',0.6,1,3],['atun',0.6,1,3],['olivas',0.4,1,2],['sopa',0.4,1,2]],super_bebidas:[['agua',0.7,1,3],['refresco',0.5,1,2],['cerveza',0.4,1,3],['zumo',0.3,1,1]],
  super_dulces:[['galletas',0.6,1,2],['choco',0.6,1,3],['patatas',0.5,1,2],['cereales',0.4,1,1],['magdalenas',0.3,1,1]],super_basicos:[['cereales',0.4,1,1],['pan',0.3,1,1],['judias',0.3,1,2]],
  super_higiene:[['papel',0.8,1,2],['vendas',0.25,1,2],['analgesicos',0.15,1,1]],nevera_super:[['yogur',0.6,1,3],['leche',0.5,1,1],['embutido',0.5,1,2],['zumo',0.4,1,2]],
  farmacia:[['vendas',0.9,1,3],['analgesicos',0.7,1,2],['antibioticos',0.5,1,1],['papel',0.3,1,1]],farmacia_mostrador:[['analgesicos',0.5,1,1],['vendas',0.5,1,1],['agua',0.3,1,1]],
  bar:[['cerveza',0.7,1,3],['refresco',0.6,1,2],['olivas',0.5,1,2],['patatas',0.5,1,2],['agua',0.4,1,2],['bocata',0.25,1,1]],
  forn:[['pan',0.8,1,2],['magdalenas',0.6,1,2],['bocata',0.4,1,1]],forn_mostrador:[['pan',0.5,1,1],['choco',0.3,1,1],['agua',0.3,1,1]],
  ferre:[['gasolina',0.5,1,1],['mochila',0.2,1,1],['papel',0.3,1,1]],ferre_mostrador:[['vendas',0.3,1,1],['agua',0.3,1,1]],
  cocina:[['judias',0.5,1,2],['atun',0.4,1,2],['galletas',0.4,1,1],['cereales',0.3,1,1],['agua',0.4,1,2]],nevera:[['leche',0.4,1,1],['yogur',0.5,1,2],['embutido',0.4,1,1],['cerveza',0.4,1,2],['manzana',0.4,1,2]],
  botiquin:[['vendas',0.7,1,2],['analgesicos',0.6,1,1],['antibioticos',0.2,1,1],['papel',0.5,1,1]],mesita:[['analgesicos',0.3,1,1],['choco',0.3,1,1],['balas',0.06,2,6]],
  poli_recepcion:[['agua',0.4,1,1],['vendas',0.3,1,1],['balas',0.4,4,10]],poli_mesa:[['balas',0.5,3,8],['choco',0.3,1,1],['refresco',0.3,1,1]],armeria:[['balas',0.95,20,40],['vendas',0.6,2,3],['mochila',0.4,1,1]],
  mercat:[['manzana',0.5,1,3],['embutido',0.4,1,2],['olivas',0.4,1,2],['pan',0.3,1,1]],base_caja:[['judias',0.4,1,2],['agua',0.5,1,2],['vendas',0.3,1,1],['balas',0.3,3,8]],
  bin:[['papel',0.15,1,1],['vendas',0.04,1,1]],trunk:[['agua',0.4,1,2],['gasolina',0.3,1,1],['vendas',0.2,1,1],['papel',0.2,1,1],['mochila',0.08,1,1],['choco',0.3,1,1]],
  fruteria:[['manzana',0.8,1,4],['zumo',0.3,1,1]],carnisseria:[['embutido',0.7,1,2]],estanc:[['choco',0.4,1,2],['papel',0.3,1,1],['refresco',0.3,1,1]],electro:[['papel',0.2,1,1],['mochila',0.1,1,1]],
  corpse:[['balas',0.6,3,10],['judias',0.3,1,1],['agua',0.3,1,1],['vendas',0.25,1,1],['choco',0.2,1,1]]};
const SRCOF=sub=>sub.startsWith('nevera')?'fridge':['bin','corpse'].includes(sub)?'out':'in';
function lootRoll(table){const got=[];for(const [id,p,a,b] of (LT[table]||[]))if(Math.random()<Math.min(0.95,p*S.loot)){const n=addItem(id,RIm(a,b),SRCOF(table));if(n)got.push(`${ITEMS[id].n} ×${n}`);}
  if(got.length){sfx('loot');toast('Encuentras: '+got.join(', '),4);}else toast(table==='bin'?'Solo hay basura podrida':'No queda nada útil');return got.length;}

// =====================================================================
// PISTOLA DETALLADA, BATE, CARGADORES
// =====================================================================
const texStipple=cTex(128,128,(g,w,h)=>{g.fillStyle='#808080';g.fillRect(0,0,w,h);for(let i=0;i<1600;i++){const v=R(60,200)|0;g.fillStyle=`rgb(${v},${v},255)`;g.fillRect(R(0,w),R(0,h),2,2);}},{srgb:false});
const texBrushed=cTex(256,64,(g,w,h)=>{g.fillStyle='#3e4246';g.fillRect(0,0,w,h);for(let i=0;i<500;i++){g.strokeStyle=`rgba(${R(80,140)|0},${R(80,140)|0},${R(90,150)|0},${R(0.05,0.2)})`;line(g,R(0,w),R(0,h),R(0,w)+R(40,120),R(0,h)+R(-1,1));}});
const gunMetalMat=pbr(new THREE.MeshStandardMaterial({color:0xffffff,map:texBrushed,roughness:0.34,metalness:0.92}));
const polyMat=pbr(new THREE.MeshStandardMaterial({color:0x1a1b1d,roughness:0.78,metalness:0.08,normalMap:texStipple,normalScale:new THREE.Vector2(0.35,0.35)}));
const polySmooth=pbr(new THREE.MeshStandardMaterial({color:0x1d1e20,roughness:0.6,metalness:0.1}));
const brassMat=pbr(new THREE.MeshStandardMaterial({color:0xc8a040,roughness:0.28,metalness:1}));
const dotMat=new THREE.MeshBasicMaterial({color:0xf2f2f2});
function shapeFrom(pts,curves){const sh=new THREE.Shape();sh.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++){const p=pts[i];if(p.length===4)sh.quadraticCurveTo(p[0],p[1],p[2],p[3]);else sh.lineTo(p[0],p[1]);}return sh;}
function extrudeX(sh,width,bev=0.0015){const g=new THREE.ExtrudeGeometry(sh,{depth:width-2*bev,bevelEnabled:bev>0,bevelThickness:bev,bevelSize:bev,bevelSegments:2,curveSegments:10});g.rotateY(-Math.PI/2);g.translate((width-2*bev)/2,0,0);return g;}
function makeMag(){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(0.021,0.11,0.031),gunMetalMat);body.position.y=-0.055;g.add(body);
  const base=new THREE.Mesh(new THREE.BoxGeometry(0.025,0.012,0.037),polySmooth);base.position.y=-0.112;g.add(base);
  const lips=new THREE.Mesh(new THREE.BoxGeometry(0.016,0.006,0.026),gunMetalMat);lips.position.y=0.003;g.add(lips);
  const bul=new THREE.Mesh(new THREE.CylinderGeometry(0.0045,0.0045,0.018,10),brassMat);bul.rotation.x=Math.PI/2;bul.position.set(0,0.006,-0.004);g.add(bul);
  const tip=new THREE.Mesh(new THREE.SphereGeometry(0.0045,8,6),brassMat);tip.position.set(0,0.006,-0.013);g.add(tip);g.userData.bullet=bul;g.userData.tip=tip;return g;}
// Pistola tipo Glock 17: armazón de polímero con punteado, corredera de acero con estrías, gatillo curvo con seguro
function makeGun(){const g=new THREE.Group();
  const frame=shapeFrom([[-0.128,0.046],[-0.128,0.066],[0.046,0.066],[0.058,0.06],[0.062,0.044],[0.052,0.03],[0.046,0.0],[0.031,-0.072],[0.029,-0.081],[0.024,-0.086],[-0.011,-0.086],[-0.016,-0.08],[-0.012,-0.06],[-0.006,-0.03],[-0.009,-0.018],[-0.003,-0.01],[0.002,0.002],[-0.002,0.006],
    [-0.012,0.009],[-0.068,0.009,-0.077,0.02],[-0.077,0.03],[-0.074,0.046]]);
  const hole=new THREE.Path();hole.moveTo(-0.064,0.018);hole.quadraticCurveTo(-0.066,0.04,-0.05,0.042);hole.lineTo(-0.012,0.042);hole.lineTo(-0.008,0.016);hole.quadraticCurveTo(-0.03,0.014,-0.064,0.018);frame.holes.push(hole);
  const fm=new THREE.Mesh(extrudeX(frame,0.028,0.0022),polyMat);g.add(fm);
  const rail=new THREE.Mesh(new THREE.BoxGeometry(0.022,0.006,0.05),polySmooth);rail.position.set(0,0.043,-0.1);g.add(rail);
  const trig=shapeFrom([[0,0],[0.004,-0.004,0.003,-0.012],[0.001,-0.02],[-0.003,-0.02],[-0.002,-0.011,-0.004,-0.003],[-0.004,0.002]]);const tm=new THREE.Mesh(extrudeX(trig,0.006,0.0006),polySmooth);tm.position.set(0,0.039,-0.034);g.add(tm);
  const safe=new THREE.Mesh(new THREE.BoxGeometry(0.0015,0.012,0.003),gunMetalMat);safe.position.set(0,0.03,-0.033);g.add(safe);
  const mrel=new THREE.Mesh(new THREE.BoxGeometry(0.031,0.008,0.008),polySmooth);mrel.position.set(0,0.035,-0.004);g.add(mrel);
  const sstop=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.004,0.016),gunMetalMat);sstop.position.set(0,0.062,-0.02);g.add(sstop);
  const slide=new THREE.Group();g.add(slide);
  const ss=shapeFrom([[-0.15,0.066],[-0.15,0.093],[-0.146,0.099],[0.049,0.099],[0.055,0.094],[0.055,0.066]]);const sm=new THREE.Mesh(extrudeX(ss,0.0255,0.0022),gunMetalMat);slide.add(sm);
  for(let i=0;i<8;i++)for(const sx of [-1,1]){const s=new THREE.Mesh(new THREE.BoxGeometry(0.002,0.022,0.0022),polySmooth);s.position.set(sx*0.0129,0.082,0.018+i*0.0043);slide.add(s);}
  for(let i=0;i<5;i++)for(const sx of [-1,1]){const s=new THREE.Mesh(new THREE.BoxGeometry(0.002,0.018,0.0022),polySmooth);s.position.set(sx*0.0129,0.082,-0.142+i*0.0043);slide.add(s);}
  const port=new THREE.Mesh(new THREE.BoxGeometry(0.004,0.013,0.032),new THREE.MeshStandardMaterial({color:0x0a0a0a,roughness:0.9}));port.position.set(-0.0115,0.093,-0.028);slide.add(port);
  const hood=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.004,0.03),brassMat);hood.position.set(-0.004,0.0975,-0.028);slide.add(hood);
  const fs=new THREE.Mesh(new THREE.BoxGeometry(0.0035,0.006,0.004),polySmooth);fs.position.set(0,0.102,-0.141);slide.add(fs);const fd=new THREE.Mesh(new THREE.SphereGeometry(0.0013,6,4),dotMat);fd.position.set(0,0.1035,-0.1435);slide.add(fd);
  const rs=new THREE.Mesh(new THREE.BoxGeometry(0.019,0.007,0.005),polySmooth);rs.position.set(0,0.102,0.046);slide.add(rs);for(const sx of [-0.006,0.006]){const d=new THREE.Mesh(new THREE.SphereGeometry(0.0012,6,4),dotMat);d.position.set(sx,0.1035,0.0435);slide.add(d);}
  const muzzle=new THREE.Mesh(new THREE.CylinderGeometry(0.0062,0.0062,0.006,14,1,true),gunMetalMat);muzzle.rotation.x=Math.PI/2;muzzle.position.set(0,0.082,-0.151);slide.add(muzzle);
  const bore=new THREE.Mesh(new THREE.CircleGeometry(0.0045,12),new THREE.MeshBasicMaterial({color:0x050505}));bore.position.set(0,0.082,-0.1515);bore.rotation.y=Math.PI;slide.add(bore);
  const mag=makeMag();mag.position.set(0,0.004,0.014);mag.rotation.x=0.27;g.add(mag);
  const flash=new THREE.Mesh(new THREE.SphereGeometry(0.03,8,6),new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:0}));flash.position.set(0,0.082,-0.18);g.add(flash);
  const mk=(x,y,z)=>{const o=new THREE.Object3D();o.position.set(x,y,z);g.add(o);return o;};
  g.userData={slide,mag,flash,muzzle:mk(0,0.082,-0.16),magwell:mk(0,-0.084,0.032),slideRear:mk(0,0.085,0.055),port:mk(-0.014,0.093,-0.028)};return g;}
function makeBat(){const g=new THREE.Group();const pts=[];const prof=[[0,0.0],[0.026,0.0],[0.028,0.008],[0.016,0.02],[0.014,0.12],[0.015,0.25],[0.022,0.4],[0.031,0.55],[0.034,0.68],[0.033,0.8],[0.026,0.835],[0,0.84]];
  for(const [r,y] of prof)pts.push(new THREE.Vector2(r,y));const geo=new THREE.LatheGeometry(pts,16);geo.translate(0,-0.09,0);
  const bt=ltex('wood_door_diff.jpg').clone();bt.needsUpdate=true;bt.repeat.set(0.6,2.5);bt.wrapS=bt.wrapT=THREE.RepeatWrapping;const wm=pbr(new THREE.MeshStandardMaterial({map:bt,color:0xd8b888,roughness:0.5}));const m=new THREE.Mesh(geo,wm);m.rotation.x=-Math.PI/2;g.add(m);
  const tape=new THREE.Mesh(new THREE.CylinderGeometry(0.0165,0.0155,0.2,14,1,true),polyMat);tape.rotation.x=-Math.PI/2;tape.position.z=0.0;g.add(tape);
  for(let i=0;i<5;i++){const n=new THREE.Mesh(new THREE.CylinderGeometry(0.0022,0.0012,0.09,5),gunMetalMat);n.position.set(R(-0.012,0.012),R(-0.01,0.01),-0.55-i*0.05);n.rotation.set(R(-0.3,0.3),0,Math.PI/2+R(-0.5,0.5));g.add(n);}
  const mk=z=>{const o=new THREE.Object3D();o.position.z=z;g.add(o);return o;};g.userData={tip:mk(-0.73),mid:mk(-0.45)};return g;}
// En el espacio del grip WebXR: −Z va hacia el pulgar (a lo largo de la empuñadura) y −Y hacia los nudillos
const vrGun=makeGun(),vrBat=makeBat();const vrWeapon=new THREE.Group();vrWeapon.add(vrGun,vrBat);
vrGun.rotation.x=HFIT.gr;vrGun.position.set(0,HFIT.gy,HFIT.gz);vrBat.position.set(0,0,0.03);
const vmGun=makeGun(),vmBat=makeBat();const viewModel=new THREE.Group();viewModel.add(vmGun,vmBat);viewModel.position.set(0.22,-0.24,-0.42);vmBat.rotation.set(0.9,0.25,0);vmGun.scale.setScalar(1.6);camera.add(viewModel);
const leftMag=makeMag();leftMag.visible=false;leftMag.rotation.x=-Math.PI/2;leftMag.position.set(0,0,-0.03);
const beltPouch=new THREE.Group();const beltMags=[];for(let i=0;i<2;i++){const p=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.075,0.04),pbr(new THREE.MeshStandardMaterial({color:0x2a2a22,roughness:0.9})));p.position.set(0,0,i*0.06-0.03);beltPouch.add(p);
  const m=makeMag();m.position.set(0,0.075,i*0.06-0.03);m.scale.setScalar(0.95);beltPouch.add(m);beltMags.push(m);}
scene.add(beltPouch);beltPouch.visible=false;
// objetos sueltos con física simple (cargadores, casquillos, armas que caen)
const dropped=[];const _dq=new Q4();
function dropObj(obj,pos,vel,keep,rounds){if(!obj.parent||obj.parent!==scene){scene.add(obj);}obj.position.copy(pos);dropped.push({o:obj,v:vel.clone(),av:new V3(R(-8,8),R(-8,8),R(-8,8)),t:keep?120:6,rounds,rest:false});}
function stepDropped(dt){for(let i=dropped.length-1;i>=0;i--){const d=dropped[i];d.t-=dt;if(d.t<=0){scene.remove(d.o);dropped.splice(i,1);continue;}if(d.rest)continue;
  d.v.y-=9.81*dt;d.o.position.addScaledVector(d.v,dt);const gy=surfY(d.o.position.x,d.o.position.z,d.o.position.y)+0.012;
  _cp.x=d.o.position.x;_cp.z=d.o.position.z;if(collide(_cp,0.02,d.o.position.y)){const nx=_cp.x-d.o.position.x,nz=_cp.z-d.o.position.z,l=Math.hypot(nx,nz)||1;d.o.position.x=_cp.x;d.o.position.z=_cp.z;const vn=(d.v.x*nx+d.v.z*nz)/l;d.v.x-=1.6*vn*nx/l;d.v.z-=1.6*vn*nz/l;}
  if(d.o.position.y<gy){d.o.position.y=gy;if(Math.abs(d.v.y)>0.6){sfx(d.rounds!==undefined?'thud':'clink',clamp(Math.abs(d.v.y)/4,0.2,1)*volAt(d.o.position.x,d.o.position.z,15));}
    d.v.y=-d.v.y*0.35;d.v.x*=0.6;d.v.z*=0.6;d.av.multiplyScalar(0.5);if(Math.abs(d.v.y)<0.3&&Math.hypot(d.v.x,d.v.z)<0.15){d.rest=true;_e1.setFromQuaternion(d.o.quaternion);d.o.rotation.set(Math.PI/2*Math.round(_e1.x/(Math.PI/2)),_e1.y,Math.PI/2*(Math.round(_e1.z/(Math.PI/2))||1));}}
  _dq.setFromEuler(_e1.set(d.av.x*dt,d.av.y*dt,d.av.z*dt));d.o.quaternion.multiply(_dq);}}
const casingGeo=new THREE.CylinderGeometry(0.0045,0.0045,0.019,8);
function ejectCasing(gun){gun.userData.port.getWorldPosition(_v);const m=new THREE.Mesh(casingGeo,brassMat);gun.getWorldQuaternion(m.quaternion);
  _v1.set(-1,0.6,0.2).applyQuaternion(m.quaternion).multiplyScalar(R(1.6,2.6));dropObj(m,_v,_v1,false);}

// =====================================================================
// MANOS (orientadas según el espacio de grip WebXR)
// =====================================================================
let HSIGN=1;
const handMat=pbr(new THREE.MeshStandardMaterial({color:0xc58d6a,roughness:0.62,metalness:0}));
// piel de las manos a partir de fotos reales (dorso con vello y venas, palma con líneas); proyectada en el espacio de la mano
const skinMat=(()=>{const m=pbr(new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.55,metalness:0}));const tb=ltex('skin_back.jpg'),tp=ltex('skin_palm.jpg');
  m.onBeforeCompile=sh=>{sh.uniforms.tB={value:tb};sh.uniforms.tP={value:tp};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vHP;varying vec3 vHN;').replace('#include <begin_vertex>','#include <begin_vertex>\nvHP=position;vHN=normal;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vHP;varying vec3 vHN;uniform sampler2D tB;uniform sampler2D tP;')
      .replace('#include <map_fragment>',`
        vec3 n=normalize(vHN);vec3 w=abs(n);w=pow(w,vec3(3.0));w/=(w.x+w.y+w.z);float S=1.0/0.055;
        vec3 cBx=texture2D(tB,vHP.zy*S).rgb,cBy=texture2D(tB,vHP.xz*S).rgb,cBz=texture2D(tB,vHP.xy*S).rgb;
        vec3 cPy=texture2D(tP,vHP.xz*S*0.8).rgb;
        vec3 back=cBx*w.x+cBy*w.y+cBz*w.z;vec3 palm=cBx*w.x+cPy*w.y+cBz*w.z;
        float isPalm=smoothstep(0.15,-0.25,n.y*HSIGN);
        diffuseColor.rgb*=mix(back,palm,isPalm);
        // nudillos y uñas algo más rosados
        diffuseColor.rgb*=vec3(1.0,0.97,0.96);`);
    sh.fragmentShader='#define HSIGN '+HSIGN.toFixed(1)+'\n'+sh.fragmentShader;};m.customProgramCacheKey=()=>'skin'+HSIGN;return m;})();
const FINGERS={thumb:['thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip'],
  index:['index-finger-metacarpal','index-finger-phalanx-proximal','index-finger-phalanx-intermediate','index-finger-phalanx-distal','index-finger-tip'],
  middle:['middle-finger-metacarpal','middle-finger-phalanx-proximal','middle-finger-phalanx-intermediate','middle-finger-phalanx-distal','middle-finger-tip'],
  ring:['ring-finger-metacarpal','ring-finger-phalanx-proximal','ring-finger-phalanx-intermediate','ring-finger-phalanx-distal','ring-finger-tip'],
  pinky:['pinky-finger-metacarpal','pinky-finger-phalanx-proximal','pinky-finger-phalanx-intermediate','pinky-finger-phalanx-distal','pinky-finger-tip']};
function buildProcHand(side){const sx=side==='right'?1:-1;const root=new THREE.Group();const wrist=new THREE.Object3D();wrist.name='wrist';root.add(wrist);
  const palm=new THREE.Mesh(new THREE.BoxGeometry(0.075,0.024,0.085),handMat);palm.position.set(0,0,-0.045);wrist.add(palm);
  const def={index:[-0.028,0.105,0.045,0.028,0.022],middle:[-0.008,0.11,0.05,0.031,0.024],ring:[0.012,0.105,0.046,0.029,0.022],pinky:[0.03,0.098,0.036,0.022,0.019]};
  for(const f in def){const [x,l0,l1,l2,l3]=def[f];let parent=wrist;let prev=new V3();const pos=[new V3(x*sx,0,-0.01),new V3(x*sx,0,-0.01-l0+0.02),null,null,null];
    pos[2]=pos[1].clone().add(new V3(0,0,-l1));pos[3]=pos[2].clone().add(new V3(0,0,-l2));pos[4]=pos[3].clone().add(new V3(0,0,-l3));
    FINGERS[f].forEach((n,i)=>{const o=new THREE.Object3D();o.name=n;o.position.copy(pos[i]).sub(prev);parent.add(o);
      if(i>0&&i<4){const len=pos[i+1].distanceTo(pos[i]);const c=new THREE.Mesh(new THREE.CapsuleGeometry(0.0085,len,3,6),handMat);c.rotation.x=Math.PI/2;c.position.z=-len/2;o.add(c);}prev=pos[i];parent=o;});}
  {const pos=[new V3(-0.025*sx,-0.008,-0.02),new V3(-0.048*sx,-0.012,-0.048),new V3(-0.058*sx,-0.012,-0.078),new V3(-0.064*sx,-0.012,-0.1)];let parent=wrist,prev=new V3();
    FINGERS.thumb.forEach((n,i)=>{const o=new THREE.Object3D();o.name=n;o.position.copy(pos[i]).sub(prev);parent.add(o);
      if(i<3){const nx=pos[i+1];const len=nx.distanceTo(pos[i]);const c=new THREE.Mesh(new THREE.CapsuleGeometry(0.01,len,3,6),handMat);c.position.copy(nx).sub(pos[i]).multiplyScalar(0.5);c.quaternion.setFromUnitVectors(UP,_v.copy(nx).sub(pos[i]).normalize());o.add(c);}prev=pos[i];parent=o;});}
  return root;}
function prepHand(root,side){root.updateMatrixWorld(true);const J={};root.traverse(o=>{if(o.name)J[o.name]=o;if(o.isSkinnedMesh||o.isMesh){o.frustumCulled=false;if(o.isSkinnedMesh)o.material=skinMat;}});
  if(!J['wrist']||!J['middle-finger-phalanx-proximal']||!J['thumb-phalanx-proximal'])return null;
  const inv=new M4().copy(root.matrixWorld).invert();const bind={};
  for(const n in J){if(n==='wrist'||Object.values(FINGERS).some(a=>a.includes(n))){const m=new M4().multiplyMatrices(inv,J[n].matrixWorld);const p=new V3(),q=new Q4(),s=new V3();m.decompose(p,q,s);bind[n]={p,q,s};}}
  for(const f in FINGERS)for(const n of FINGERS[f])if(!bind[n])return null;
  const W=bind['wrist'].p,K=bind['middle-finger-phalanx-proximal'].p,Ix=bind['index-finger-phalanx-proximal'].p,Px=bind['pinky-finger-phalanx-proximal'].p,T=bind['thumb-phalanx-distal'].p;
  const f=K.clone().sub(W).normalize();const across=Ix.clone().sub(Px);across.addScaledVector(f,-across.dot(f)).normalize();// del meñique al índice
  const palm=new V3().crossVectors(across,f).multiplyScalar(side==='right'?1:-1).normalize();// lado de la palma según la mano
  const chains={};for(const fn in FINGERS){const names=FINGERS[fn];const piv=bind[names[1]].p,tip=bind[names[names.length-1]].p;const dir=tip.clone().sub(piv).normalize();
    let ax=fn==='thumb'?new V3().crossVectors(dir,palm).normalize():across.clone();const rel=tip.clone().sub(piv);const rot=rel.clone().applyAxisAngle(ax,0.3);if(rot.sub(rel).dot(palm)<0)ax.negate();chains[fn]={names,ax};}
  // destino en el grip: nudillos hacia −Y, palma hacia el centro (−X derecha, +X izquierda), índice hacia −Z (pulgar)
  const fT=new V3(HFIT.fx*(side==='right'?1:-1),HFIT.fy,HFIT.fz).normalize();const pT=new V3(side==='right'?-1:1,0,0);const aT=new V3(0,0,-1);
  const mb=new M4().makeBasis(f,palm,across),mt=new M4().makeBasis(fT,pT,aT);const qa=new Q4().setFromRotationMatrix(mt.multiply(mb.invert()));
  const align=new THREE.Group();align.add(root);align.quaternion.copy(qa);
  const C=K.clone().applyQuaternion(qa);const target=new V3((side==='right'?1:-1)*HFIT.kx,HFIT.ky,HFIT.kz);align.position.copy(target).sub(C);
  const handRoot=new THREE.Group();handRoot.add(align);const wristObj=new THREE.Object3D();wristObj.position.copy(W).applyQuaternion(qa).add(align.position);handRoot.add(wristObj);
  return{side,handRoot,align,root,J,bind,chains,wristObj,curl:{thumb:0.2,index:0.1,middle:0.2,ring:0.2,pinky:0.2},off:new V3()};}
const _hq=new Q4(),_hq2=new Q4(),_hp=new V3(),_hd=new V3(),_hm=new M4(),_hm2=new M4();
const CURLMUL={thumb:[0.25,0.55,0.75],index:[0,1.3,1.5,1.0],middle:[0,1.35,1.55,1.05],ring:[0,1.35,1.55,1.05],pinky:[0,1.35,1.55,1.05]};
function poseHand(hr){const root=hr.root;root.updateWorldMatrix(true,true);
  for(const fn in hr.chains){const ch=hr.chains[fn],names=ch.names,mul=CURLMUL[fn],c=hr.curl[fn];_hq.identity();
    for(let i=0;i<names.length;i++){const bn=hr.bind[names[i]];const th=(mul[i]||0)*c;if(th)_hq.multiply(_hq2.setFromAxisAngle(ch.ax,th));
      if(i===0)_hp.copy(bn.p);_hd.copy(_hp);const q=_hq2.copy(_hq).multiply(bn.q);
      const j=hr.J[names[i]];_hm.compose(_hd,q,bn.s);_hm2.multiplyMatrices(root.matrixWorld,_hm);_m1.copy(j.parent.matrixWorld).invert().multiply(_hm2);_m1.decompose(j.position,j.quaternion,j.scale);j.updateMatrixWorld(true);
      if(i<names.length-1){const nb=hr.bind[names[i+1]];_v.subVectors(nb.p,bn.p).applyQuaternion(_hq);_hp.copy(_hd).add(_v);}}}}
const hands={left:null,right:null};const gripBySide={};
function setupHands(){for(const side of ['left','right']){let root=HANDTPL[side]?SkeletonUtils.clone(HANDTPL[side]):null;let hr=root?prepHand(root,side):null;if(!hr)hr=prepHand(buildProcHand(side),side);if(!hr){const handRoot=new THREE.Group(),wristObj=new THREE.Object3D();handRoot.add(wristObj);hr={side,handRoot,align:handRoot,root:handRoot,J:{},bind:{},chains:{},wristObj,curl:{thumb:0.2,index:0.1,middle:0.2,ring:0.2,pinky:0.2},off:new V3()};}hands[side]=hr;
    if(side==='right')hr.handRoot.add(vrWeapon);else hr.handRoot.add(leftMag);}applyHC();}
function applyHC(){for(const side of ['left','right']){const hr=hands[side];if(!hr)continue;const m=side==='right'?1:-1;hr.handRoot.rotation.set(HC.pitch,HC.yaw*m,HC.roll*m);hr.handRoot.position.set(HC.up*0,HC.up,HC.fwd).add(hr.off);}}

// =====================================================================
// CUERPO DEL JUGADOR: piernas que caminan y brazos que llegan a tus manos (IK)
// =====================================================================
let body=null;
// ropa del avatar: textura original + microdetalle fotográfico de tejido (vaquero, Poly Haven CC0) a escala real
const texFabDet=ltex('fabric_det.jpg',false);
function fabricBodyMat(b){const m=new THREE.MeshStandardMaterial({map:b&&b.map||null,color:b&&b.color?b.color.clone():0xffffff,roughness:0.95,metalness:0});
  m.onBeforeCompile=sh=>{sh.uniforms.uDet={value:texFabDet};sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uDet;')
    .replace('#include <map_fragment>','#include <map_fragment>\n#ifdef USE_MAP\n{float d=texture2D(uDet,vMapUv*18.0).r;diffuseColor.rgb*=0.68+0.64*d;}\n#endif');};m.customProgramCacheKey=()=>'fabdet1';return m;}
function setupBody(){const tpl=TPL.p_m2||TPL_M[0]||CHAR_TPLS[0];if(!tpl)return;const h=newRec(tpl);H_.pop();charSlot--;body=h;h.type='player';h.gp={lean:0,droop:0,tilt:0,arms:'swing',limp:0,sway:1,twitch:0,speedMul:1};
  h.s=1;h.pr={};for(const k in tpl.pr){const v=tpl.pr[k];h.pr[k]=v.isVector3?v.clone():v;}for(let k=0;k<STICKS.length;k++)h.rest[k]=tpl.CB[STICKS[k][0]].distanceTo(tpl.CB[STICKS[k][1]]);h.kp.fill(1);h.kl.fill(1);h.inner.quaternion.copy(tpl.qFix);h.inner.position.set(0,-tpl.minY,0);for(const m of h.meshes)m.material=Array.isArray(m.userData.base)?m.userData.base.map(fabricBodyMat):fabricBodyMat(m.userData.base);
  h.y=0;h.bones.Head.scale.setScalar(0.001);h.bones.LeftArm.scale.setScalar(0.001);h.bones.RightArm.scale.setScalar(0.001);setupSleeves();h.holder.visible=false;h.phase=0;h.mode='kin';h.k=1;h.yawB=0;}
const _bw=new V3(),_bh=new V3();
// Mangas: dos tubos por brazo (hombro→codo→muñeca) que se orientan y estiran cada fotograma: la mano nunca se separa del brazo
const sleeves={};
function setupSleeves(){const mat=photoMat('jacket',{vertexColors:false,roughness:0.97,ns:0.9});// algodón de camisa (foto Poly Haven, CC0) a juego con el torso, con mugre y sangre seca
  const seg=(r0,r1,cuff)=>{const gs=[new THREE.CylinderGeometry(r1,r0,1,12,1,true).translate(0,0.5,0)];if(cuff)gs.push(new THREE.CylinderGeometry(r1+0.004,r1+0.004,0.09,12,1,false).translate(0,0.955,0));
    const g=gs.length>1?mergeGeometries(gs):gs[0];const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*1.2,uv.getY(i)*1.6);return g;};
  const gU=seg(0.062,0.05,false),gF=seg(0.05,0.037,true),gJ=new THREE.SphereGeometry(0.051,10,8);
  for(const side of ['left','right']){const up=new THREE.Mesh(gU,mat),fo=new THREE.Mesh(gF,mat),el=new THREE.Mesh(gJ,mat),sh=new THREE.Mesh(gJ,mat);sh.scale.setScalar(1.22);
    for(const m of [up,fo,el,sh]){m.frustumCulled=false;m.visible=false;scene.add(m);}sleeves[side]={up,fo,el,sh};}}
const _sd=new V3();
function setSeg(m,a,b){_sd.subVectors(b,a);const l=_sd.length()||1e-4;m.position.copy(a);m.quaternion.setFromUnitVectors(UP,_sd.divideScalar(l));m.scale.set(1,l,1);}
function showSleeves(v){for(const k in sleeves){const s=sleeves[k];s.up.visible=s.fo.visible=s.el.visible=s.sh.visible=v;}}
function updateBody(dt){if(!body)return;const show=!P.inCar&&P.alive&&!P.sleeping;body.holder.visible=show;showSleeves(false);if(!show)return;const h=body;
  camera.getWorldPosition(_v);camera.getWorldDirection(_v1);_v1.y=0;if(_v1.lengthSq()<1e-6)_v1.set(0,0,-1);_v1.normalize();const hy=Math.atan2(_v1.x,_v1.z);
  let dy=hy-h.yawB;dy=Math.atan2(Math.sin(dy),Math.cos(dy));const moving=Math.abs(IN.mx)+Math.abs(IN.my)>0.1;if(Math.abs(dy)>0.7||moving)h.yawB+=dy*Math.min(1,dt*5);
  const gy=surfY(_v.x,_v.z,rig.position.y+P.crouchOff+0.3);const eyeR=Math.max(0.45,_v.y-gy);const eye=Math.max(0.8,eyeR+P.crouchOff);P.standEye=Math.max((P.standEye||1.6)*0.9995,eye);h.crouchK=clamp(1-eyeR/P.standEye,0,0.62)*0.95;const tH=h.tpl.height;const sc=clamp(P.standEye/1.6,0.7,1.2)*(1.75/tH);
  if(Math.abs(sc-h.s)>0.02){h.s=sc;h.inner.scale.setScalar(sc);h.inner.position.y=-h.tpl.minY*sc;h.pr={};for(const k in h.tpl.pr){const v=h.tpl.pr[k];h.pr[k]=v.isVector3?v.clone().multiplyScalar(sc):v*sc;}}
  if(!h.pr.thigh){h.pr={};for(const k in h.tpl.pr){const v=h.tpl.pr[k];h.pr[k]=v.isVector3?v.clone().multiplyScalar(sc):v*sc;}}
  h.yaw=h.yawB;h.x=_v.x-Math.sin(h.yawB)*0.17;h.z=_v.z-Math.cos(h.yawB)*0.17;h.speed=moving?(P.sprinting?4.4:P.crouch?1.1:2.1):0;h.act='stand';h.atkAnim=0;h.aim=0;h.armed=false;
  poseTargets(h,dt);const pr=h.pr;
  if(inVR){for(const [side,sh,el,hd] of [['left',LSH,LELB,LHAND],['right',RSH,RELB,RHAND]]){const hr=hands[side];if(!hr||!hr.handRoot.parent)continue;hr.wristObj.getWorldPosition(_bw);
      _bh.copy(h.tgt[sh]);_pole.set(side==='left'?0.6:-0.6,-1,-0.4).applyAxisAngle(UP,h.yawB);ik2(_bh,_bw,pr.upper,pr.fore,_pole,h.tgt[el],h.tgt[hd]);
      const sl=sleeves[side];if(sl){const E=h.tgt[el];_v2.subVectors(_bw,E).normalize();_v3.copy(_bw).addScaledVector(_v2,0.018);setSeg(sl.up,_bh,E);setSeg(sl.fo,E,_v3);sl.el.position.copy(E);sl.sh.position.copy(_bh);sl.up.visible=sl.fo.visible=sl.el.visible=sl.sh.visible=true;}}}
  for(let i=0;i<NP;i++)h.sim[i].copy(h.tgt[i]);driveBones(h);}

// =====================================================================
// COMBATE DEL JUGADOR
// =====================================================================
function closestSegT(o,d,a,b){const ux=b.x-a.x,uy=b.y-a.y,uz=b.z-a.z,wx=o.x-a.x,wy=o.y-a.y,wz=o.z-a.z;const B=d.x*ux+d.y*uy+d.z*uz,C=ux*ux+uy*uy+uz*uz,D=d.x*wx+d.y*wy+d.z*wz,E=ux*wx+uy*wy+uz*wz;
  const den=C-B*B;let t=den>1e-8?(E-B*D)/den:0;t=clamp(t,0,1);const s=Math.max(0,t*B-D);const px=o.x+d.x*s-(a.x+ux*t),py=o.y+d.y*s-(a.y+uy*t),pz=o.z+d.z*s-(a.z+uz*t);return[px*px+py*py+pz*pz,s,t];}
function pointSegD2(p,a,b){const ux=b.x-a.x,uy=b.y-a.y,uz=b.z-a.z;const C=ux*ux+uy*uy+uz*uz||1e-6;const t=clamp(((p.x-a.x)*ux+(p.y-a.y)*uy+(p.z-a.z)*uz)/C,0,1);
  const x=a.x+ux*t-p.x,y=a.y+uy*t-p.y,z=a.z+uz*t-p.z;return[x*x+y*y+z*z,t];}
const _hc=new V3();
function rayChars(o,d,maxT,skip){let best=null,bt=maxT,bp=-1,part=null;
  for(const h of H_){if(!h.active||h===skip||(!h.holder.visible&&h.mode!=='phys'))continue;const hx=h.sim[PELVIS].x-o.x,hz=h.sim[PELVIS].z-o.z;
    const along=hx*d.x+hz*d.z;if(along<-1||along>bt+2)continue;if(hx*hx+hz*hz-along*along>9)continue;const pts=h.sim;
    headC(pts,_hc);_v.subVectors(_hc,o);const ta=_v.dot(d);if(ta>0&&ta<bt&&_v.lengthSq()-ta*ta<0.0144){bt=ta;best=h;bp=HEAD;part='head';}
    for(const [a,b,r,pp] of HIT_SEGS){const [d2,s,t]=closestSegT(o,d,pts[a],pts[b]);if(d2<r*r&&s<bt){bt=s;best=h;bp=t<0.5?a:b;part=pp;}}}
  return{h:best,t:bt,pi:bp,part};}
const _o2=new V3(),_d2=new V3(),_e2=new V3(),_imp=new V3();
function fireGun(o,d){if(!G.chamber){sfx('click');if(!inVR)toast(G.mag>0?'Pulsa R para recargar':'Sin balas');return;}
  G.chamber=false;G.kick=0.028;sfx('shot');makeNoise(o.x,o.z,75);haptic(srcR,1,70);const gun=inVR?vrGun:vmGun;gun.userData.flash.material.opacity=1;ejectCasing(gun);
  if(G.mag>0){G.mag--;G.chamber=true;}else G.locked=true;
  let tb=rayWorld(o,d,150);const pn=rayPanes(o,d,tb);if(pn&&pn.t<tb){breakPane(pn.p);tb=pn.t+0.05;tb=rayWorld(o,d,150);}const r=rayChars(o,d,tb);_e2.copy(o).addScaledVector(d,r.h?r.t:tb);tracer(o,_e2);
  if(r.h){const head=r.part==='head';const dmg=head?999:r.part==='body'?(r.h.type==='zombie'?30:45):50;
    hitChar(r.h,r.part,dmg,_imp.copy(d).multiplyScalar(head?6:4.5),r.pi,'player',_e2,d);spray(_e2,d,head?18:8);sfx(head?'hithead':'hit',0.6);}
  else impactPuff(_e2);}
function ejectMag(drop){if(G.mag<0)return null;const n=G.mag;G.mag=-1;sfx('magout');const gun=inVR?vrGun:vmGun;
  if(drop){gun.userData.magwell.getWorldPosition(_v);const m=makeMag();m.userData.bullet.visible=m.userData.tip.visible=n>0;gun.getWorldQuaternion(m.quaternion);dropObj(m,_v,_v1.set(0,-1.2,0),true,n);if(!inVR&&n>0)addItem('balas',n,'gift');}
  return n;}
function insertMag(n){G.mag=n;sfx('magin');haptic(srcL,0.6,40);haptic(srcR,0.6,40);}
function rack(){sfx('rack');haptic(srcL,0.7,50);haptic(srcR,0.5,40);if(G.chamber){/* la bala de la recámara sale */ejectCasing(inVR?vrGun:vmGun);G.chamber=false;}if(G.mag>0){G.mag--;G.chamber=true;}G.locked=false;}
function refillBelt(){for(let i=0;i<2;i++)if(BELT[i]===null||BELT[i]===0){const n=takeItem('balas',12);if(n)BELT[i]=n;else if(BELT[i]===0)BELT[i]=null;}}
function reloadFlat(){if(G.mag>=12&&G.chamber)return;if(G.mag>0)addItem('balas',G.mag,'gift');G.mag=-1;const n=takeItem('balas',12);if(!n){toast('No te quedan balas');return;}
  G.mag=n;if(!G.chamber&&G.mag>0){G.mag--;G.chamber=true;}G.locked=false;sfx('magin');setTimeout(()=>sfx('rack'),300);toast(`Recargas (${G.mag}+${G.chamber?1:0})`);}
let swingT=0;
function meleeFlat(){swingT=0.28;sfx('swish');camera.getWorldPosition(_o2);camera.getWorldDirection(_d2);const r=rayChars(_o2,_d2,2.4);
  if(r.h){const s=P.weapon==='bate'?7.5:3;const moodF=0.75+P.mood/400;_imp.copy(_d2).multiplyScalar(s*0.75).add(_v.set(0,0.6,0));
    const dmg=(r.part==='head'?s*6:r.part==='body'?s*3:s*4)*moodF*(P.weapon==='manos'?0.3:1);_e2.copy(_o2).addScaledVector(_d2,r.t);
    HITKIND='blunt';hitChar(r.h,r.part,dmg,_imp,r.pi,'player',_e2,_d2);HITKIND='';sfx(r.part==='head'?'hithead':'hit');spray(_e2,_d2,8);}}
const tipPrev=new V3(),tipNow=new V3(),midNow=new V3(),tipVel=new V3();let tipInit=false;
function vrMelee(dt){if(!hands.right||!hands.right.handRoot.parent||P.weapon==='pistola')return;
  if(P.weapon==='bate'){vrBat.userData.tip.getWorldPosition(tipNow);vrBat.userData.mid.getWorldPosition(midNow);}else{hands.right.wristObj.getWorldPosition(tipNow);midNow.copy(tipNow);}
  if(!tipInit){tipPrev.copy(tipNow);tipInit=true;return;}tipVel.subVectors(tipNow,tipPrev).divideScalar(Math.max(dt,0.008));tipPrev.copy(tipNow);
  const sp=Math.min(14,tipVel.length());if(sp<2.2)return;
  // golpear cristales: se rompen con un buen golpe de bate (o de puño muy fuerte)
  for(const pn of PANES){if(pn.broken)continue;if(Math.abs(pn.cx-tipNow.x)>pn.L/2+0.5||Math.abs(pn.cz-tipNow.z)>pn.L/2+0.5)continue;if(tipNow.y<pn.y0||tipNow.y>pn.y1)continue;
    const dpl=(tipNow.x-pn.cx)*pn.nx+(tipNow.z-pn.cz)*pn.nz;const along=Math.abs((tipNow.x-pn.cx)*pn.nz-(tipNow.z-pn.cz)*pn.nx);if(Math.abs(dpl)<0.12&&along<pn.L/2&&sp>(P.weapon==='bate'?3.5:7)){breakPane(pn);haptic(srcR,1,60);}}
  for(const h of H_){if(!h.active)continue;const hx=h.sim[CHEST].x,hz=h.sim[CHEST].z;if(Math.abs(hx-tipNow.x)>2||Math.abs(hz-tipNow.z)>2)continue;if(clockT-h.lastHitT<0.3)continue;
    const pts=h.sim;let hit=-1,part=null,best=1;headC(pts,_hc);let hp=null;
    for(const pnt of [tipNow,midNow]){const d2=pnt.distanceToSquared(_hc);if(d2<0.04&&d2<best){best=d2;hit=HEAD;part='head';hp=pnt;}
      for(const [a,b,r,pp] of HIT_SEGS){const [dd,t]=pointSegD2(pnt,pts[a],pts[b]);const rr=(r+0.07)*(r+0.07);if(dd<rr&&dd<best){best=dd;hit=t<0.5?a:b;part=pp;hp=pnt;}}}
    if(hit>=0){const moodF=0.75+P.mood/400;const hand=P.weapon==='manos';_imp.copy(tipVel).multiplyScalar(hand?0.45:0.55);if(_imp.length()>12)_imp.setLength(12);_imp.y+=0.6;
      const dmg=(part==='head'?sp*6:part==='body'?sp*3:sp*4)*moodF*(hand?0.25:1);_d2.copy(tipVel).normalize();hitChar(h,part,dmg,_imp,hit,'player',hp,_d2);h.lastHitT=clockT;
      sfx(part==='head'?'hithead':'hit',clamp(sp/8,0.4,1));haptic(srcR,clamp(sp/8,0.4,1),60);spray(hp,_d2,hand?3:8);}}}
function damagePlayer(n,from,bite){if(!P.alive)return;if(from==='zombi')n*=S.zStr;P.hp-=n;hurtFx=Math.min(0.6,hurtFx+0.25+n/60);sfx('hurt');
  if(P.sleeping){P.sleeping=false;toast('¡Te despiertan a mordiscos!');}haptic(srcL,0.8,80);haptic(srcR,0.8,80);
  if(bite&&S.infection&&!P.infected&&Math.random()<0.12){P.infected=true;P.infT=0;toast('¡Te ha mordido!',3);}
  if(P.hp<=0){P.hp=0;P.alive=false;P.deadT=0;closePanel();if(P.inCar){P.inCar.speed=0;P.inCar=null;headlight.intensity=0;}toast(`HAS MUERTO (${from}). Sobreviviste ${dayNum()} días y abatiste ${P.kills} zombis.`,6);}}


// =====================================================================
// HUD, PANELES Y MENSAJES
// =====================================================================
const hudC=document.getElementById('hud');const hg=hudC.getContext('2d');const hudTex=new THREE.CanvasTexture(hudC);hudTex.colorSpace=THREE.SRGBColorSpace;
const wrist=new THREE.Mesh(new THREE.PlaneGeometry(0.13,0.1625),new THREE.MeshBasicMaterial({map:hudTex,transparent:true}));wrist.visible=false;wrist.renderOrder=999;wrist.material.depthTest=false;scene.add(wrist);let hudOn=true;
const pnlC=document.getElementById('pnl');const pg=pnlC.getContext('2d');const pnlTex=new THREE.CanvasTexture(pnlC);pnlTex.colorSpace=THREE.SRGBColorSpace;
const pnlMesh=new THREE.Mesh(new THREE.PlaneGeometry(0.96,0.72),new THREE.MeshBasicMaterial({map:pnlTex,transparent:true,depthTest:false}));pnlMesh.renderOrder=1001;pnlMesh.visible=false;scene.add(pnlMesh);
const toastC=document.createElement('canvas');toastC.width=900;toastC.height=96;const tg=toastC.getContext('2d');const toastTex=new THREE.CanvasTexture(toastC);toastTex.colorSpace=THREE.SRGBColorSpace;
const toastPlane=new THREE.Mesh(new THREE.PlaneGeometry(0.9,0.096),new THREE.MeshBasicMaterial({map:toastTex,transparent:true,depthTest:false}));toastPlane.renderOrder=1000;toastPlane.position.set(0,-0.2,-0.95);toastPlane.visible=false;camera.add(toastPlane);
const toastDiv=document.getElementById('toast');let toastT=0;const log=[];
function toast(msg,keep=3){log.unshift(msg);if(log.length>5)log.pop();toastT=keep;toastDiv.textContent=msg;toastDiv.style.display=inVR?'none':'block';
  tg.clearRect(0,0,900,96);tg.fillStyle='rgba(0,0,0,.72)';tg.beginPath();tg.roundRect(4,8,892,80,14);tg.fill();tg.fillStyle='#fff';tg.font='bold 32px sans-serif';tg.textAlign='center';tg.textBaseline='middle';tg.fillText(msg,450,48,870);toastTex.needsUpdate=true;toastPlane.visible=inVR;}
let prompt='';
function bar(y,label,v,col,inv){hg.fillStyle='#ccc';hg.font='21px sans-serif';hg.textAlign='left';hg.fillText(label,14,y+19);hg.fillStyle='#333';hg.fillRect(150,y+4,346,18);hg.fillStyle=col;hg.fillRect(150,y+4,346*clamp(v,0,100)/100,18);
  if(inv?v>80:v<20){hg.strokeStyle='#ff4040';hg.lineWidth=2;hg.strokeRect(149,y+3,348,20);}}
function drawHUD(){const g=hg;g.clearRect(0,0,512,640);g.fillStyle='rgba(10,12,14,0.84)';g.beginPath();g.roundRect(0,0,512,640,22);g.fill();
  const h=hourF();const hh=String(Math.floor(h)).padStart(2,'0'),mm=String(Math.floor((h%1)*60)).padStart(2,'0');
  g.fillStyle='#f0e0b0';g.font='bold 28px sans-serif';g.textAlign='left';g.fillText(`Día ${dayNum()}  ${hh}:${mm}  ${nightF>0.5?'☾':'☀'}`,14,34);
  g.textAlign='right';g.font='20px sans-serif';g.fillStyle='#aaa';g.fillText(`Bajas ${P.kills}`,498,32);
  bar(46,'Salud',P.hp,'#d33');bar(72,'Hambre',P.food,'#e8902a');bar(98,'Sed',P.water,'#3a8ee8');bar(124,'Vejiga',P.bladder,'#d8c83a',true);bar(150,'Intestino',P.bowels,'#8a5a2a',true);
  bar(176,'Energía',P.energy,'#4cc04c');bar(202,'Ánimo',P.mood,'#b070d0');
  g.textAlign='left';g.font='bold 21px sans-serif';g.fillStyle='#fff';
  const wn={manos:'Manos',bate:'Bate',pistola:`Pistola ${G.mag>=0?G.mag:'—'}+${G.chamber?1:0}`}[P.weapon];
  g.fillText(`${wn} · Cinturón ${BELT.map(b=>b===null?'—':b).join('/')} · Balas ${countItem('balas')}${P.light?' · Luz':''}`,14,250,490);
  const st=[];if(P.sick>20)st.push('Intoxicado');if(P.infected&&P.infT>6)st.push('Fiebre');if(invWeight()>invCap())st.push('Sobrecargado');if(P.crouch)st.push('Agachado');
  if(P.inCar)st.push(`Coche ${Math.abs(P.inCar.speed*3.6)|0} km/h · gasolina ${P.inCar.fuel|0}%`);const zn=zoneName(camW.x,camW.z);if(zn)st.push(zn);
  g.fillStyle='#ff9a6a';g.font='20px sans-serif';g.fillText(st.join(' · '),14,276,490);
  if(prompt){g.fillStyle='#ffd84a';g.font='bold 21px sans-serif';g.fillText(prompt,14,302,490);}
  g.font='18px sans-serif';log.slice(0,2).forEach((m,i)=>{g.fillStyle=i===0?'#fff':'#999';g.fillText(m,14,328+i*22,490);});
  const mx=136,my=372,ms=240,range=100;const p=camW;g.save();g.beginPath();g.rect(mx,my,ms,ms);g.clip();g.fillStyle='#111';g.fillRect(mx,my,ms,ms);
  g.drawImage(mapC,mtx(p.x-range),mtz(p.z-range),range*2*MAPS,range*2*MAPS,mx,my,ms,ms);
  const k=ms/(range*2);const toM=(x,z)=>[mx+(x-p.x+range)*k,my+(z-p.z+range)*k];
  for(const c of cars){if(Math.abs(c.x-p.x)>range||Math.abs(c.z-p.z)>range)continue;const [a,b]=toM(c.x,c.z);g.fillStyle='#fff';g.fillRect(a-2,b-2,4,4);}
  for(const q of H_){if(!q.active||q.dead)continue;const d=Math.hypot(q.x-p.x,q.z-p.z);if(q.type==='zombie'&&d>35)continue;if(d>range)continue;const [a,b]=toM(q.x,q.z);
    g.fillStyle=q.type==='zombie'?'#ff3030':hostileToPlayer(q)?'#ff9a20':'#4cd964';g.fillRect(a-2.5,b-2.5,5,5);}
  camera.getWorldDirection(_v4);const ang=Math.atan2(_v4.x,_v4.z);g.translate(mx+ms/2,my+ms/2);g.rotate(-ang);g.fillStyle='#ffd84a';g.beginPath();g.moveTo(0,9);g.lineTo(-6,-6);g.lineTo(6,-6);g.closePath();g.fill();g.restore();
  g.strokeStyle='#555';g.lineWidth=2;g.strokeRect(mx,my,ms,ms);g.fillStyle='#888';g.font='16px sans-serif';g.textAlign='center';g.fillText('N',mx+ms/2,my-5);}
function zoneName(x,z){let best='',bd=1e9;for(const st of VSTR){const d=Math.abs(x-st.pos);if(d<st.w/2+2&&d<bd){bd=d;best=st.n;}}for(const st of HSTR){const d=Math.abs(z-st.pos);if(d<st.w/2+2&&d<bd){bd=d;best=st.n;}}
  if(!best){for(const b of BASES)if(Math.hypot(b.x-x,b.z-z)<b.r+8)return b.name;return 'Eixample';}return best;}
// ---------- paneles ----------
let panel=null,panelStack=[];
const MAIN=[{l:()=>'Inventario',a:()=>pushPanel('inv')},{l:()=>'Estado de salud',a:()=>pushPanel('status')},{l:()=>'Mapa',a:()=>pushPanel('map')},
  {l:()=>'Mear',a:()=>{closePanel();doPee();}},{l:()=>'Cagar',a:()=>{closePanel();doPoop();}},{l:()=>'Dormir 8 horas',a:()=>doSleep()},
  {l:()=>`Repostar coche (bidones: ${countItem('gasolina')})`,a:()=>doRefuel()},{l:()=>'Ajustes de partida',a:()=>pushPanel('set')},{l:()=>'Ajustar posición de las manos',a:()=>pushPanel('hands')},{l:()=>'Recolocar altura y vista',a:()=>{closePanel();recenter();}},{l:()=>'Desatascar jugador (volver a la calle)',a:()=>{closePanel();unstick();}},{l:()=>'Cerrar',a:()=>closePanel()}];
function panelItems(){if(!panel)return[];const m=panel.mode;if(m==='main')return MAIN;
  if(m==='inv'){if(!P.items.length)return[{l:()=>'(Inventario vacío)'}];return P.items.map(e=>({l:()=>itemLabel(e),a:()=>useEntry(e),adj:d=>{if(d<0)dropEntry(e);}}));}
  if(m==='set')return SET_DEFS.filter(d=>!d.start).map(d=>({l:()=>`◀ ▶  ${d.l}: ${fmtS(d)}`,adj:dd=>{const i=d.o.indexOf(S[d.k]);S[d.k]=d.o[clamp(i+dd,0,d.o.length-1)];saveS();}}));
  if(m==='hands'){const it=(k,lab,st,unit)=>({l:()=>`◀ ▶  ${lab}: ${(HC[k]/(unit||1)).toFixed(unit?0:2)}${unit?'°':' m'}`,adj:d=>{HC[k]=+(HC[k]+d*st).toFixed(4);saveHC();applyHC();}});
    return[it('pitch','Inclinar',Math.PI/36,Math.PI/180),it('yaw','Girar',Math.PI/36,Math.PI/180),it('roll','Rotar',Math.PI/36,Math.PI/180),it('fwd','Adelante/atrás',0.01),it('up','Arriba/abajo',0.01),
      {l:()=>'Restablecer',a:()=>{Object.assign(HC,{pitch:0,yaw:0,roll:0,fwd:0,up:0});saveHC();applyHC();}}];}
  return[];}
function openPanel(mode){panel={mode,sel:0};panelStack=[];if(inVR){camera.getWorldPosition(_v);camera.getWorldDirection(_v1);_v1.y=0;_v1.normalize();pnlMesh.position.copy(_v).addScaledVector(_v1,0.85);pnlMesh.position.y-=0.12;pnlMesh.lookAt(_v);pnlMesh.visible=true;}else pnlC.style.display='block';drawPanel();}
function pushPanel(mode){panelStack.push(panel);panel={mode,sel:0};drawPanel();}
function backPanel(){if(panelStack.length){panel=panelStack.pop();drawPanel();}else closePanel();}
function closePanel(){panel=null;panelStack=[];pnlMesh.visible=false;pnlC.style.display='none';}
const TITLES={main:'MENÚ',inv:'INVENTARIO',status:'ESTADO',map:'MAPA DE BARCELONA',set:'AJUSTES DE PARTIDA',hands:'POSICIÓN DE LAS MANOS'};
function drawPanel(){if(!panel)return;const g=pg;g.clearRect(0,0,1024,768);g.fillStyle='rgba(12,13,16,.93)';g.beginPath();g.roundRect(0,0,1024,768,28);g.fill();g.strokeStyle='#5a2a2a';g.lineWidth=3;g.stroke();
  g.fillStyle='#f0e0b0';g.font='bold 40px sans-serif';g.textAlign='left';g.fillText(TITLES[panel.mode],36,60);
  g.fillStyle='#888';g.font='22px sans-serif';g.fillText(inVR?'Stick izq: moverte/ajustar · Gatillo der: elegir · X: volver':'Flechas: moverte/ajustar · Enter: elegir · Retroceso: volver',36,744);
  if(panel.mode==='status'){const L=[`Salud: ${P.hp|0}%`,`Hambre: ${P.food|0}%   Sed: ${P.water|0}%`,`Vejiga: ${P.bladder|0}%   Intestino: ${P.bowels|0}%`,`Energía: ${P.energy|0}%   Ánimo: ${P.mood|0}%`,
      `Intoxicación: ${P.sick<5?'ninguna':P.sick<35?'leve':P.sick<70?'moderada':'grave'}`,`Temperatura: ${P.infected&&P.infT>6?(P.infT>30?'fiebre muy alta':'fiebre'):'normal'}`,
      `Peso: ${invWeight().toFixed(1)} / ${invCap()} kg${P.bag?' (mochila)':''}`,`Días sobrevividos: ${dayNum()}   Zombis abatidos: ${P.kills}`];g.font='30px sans-serif';L.forEach((t,i)=>{g.fillStyle='#ddd';g.fillText(t,50,130+i*62);});return;}
  if(panel.mode==='map'){const s=Math.min(940/mapC.width,640/mapC.height);const w=mapC.width*s,hh=mapC.height*s;const ox=(1024-w)/2,oy=80;g.drawImage(mapC,ox,oy,w,hh);
    const [a,b]=[ox+mtx(camW.x)*s,oy+mtz(camW.z)*s];g.fillStyle='#ffd84a';g.beginPath();g.arc(a,b,8,0,7);g.fill();g.font='16px sans-serif';
    for(const bs of BASES){g.fillStyle=bs.type==='good'&&!bs.angry?'#4cd964':'#ff5050';g.fillText(bs.name,ox+mtx(bs.x)*s+10,oy+mtz(bs.z)*s+5);}
    g.fillStyle='#ccc';g.font='17px sans-serif';g.fillText('Verde: bases aliadas · Rojo: bandidos · Azul: comisarías · Naranja: súper · Verde claro: farmacias · Amarillo: bares',36,712);return;}
  const items=panelItems();const per=15;const start=Math.max(0,Math.min(panel.sel-7,items.length-per));
  for(let i=start;i<Math.min(items.length,start+per);i++){const y=110+(i-start)*40;if(i===panel.sel){g.fillStyle='rgba(255,216,74,.22)';g.fillRect(24,y-28,976,38);}g.fillStyle=i===panel.sel?'#ffd84a':'#ddd';g.font='28px sans-serif';g.fillText(items[i].l(),40,y,940);}
  if(panel.mode==='inv'){g.fillStyle='#aaa';g.font='22px sans-serif';g.fillText(`Peso ${invWeight().toFixed(1)}/${invCap()} kg · Elegir = usar/comer/beber · ◀ = tirar uno`,36,712);}}
function panelInput(){if(!panel)return;const items=panelItems();let ch=false;if(IN.back){backPanel();return;}
  if(IN.up&&items.length){panel.sel=(panel.sel+items.length-1)%items.length;ch=true;}if(IN.down&&items.length){panel.sel=(panel.sel+1)%items.length;ch=true;}
  const it=items[panel.sel];if(it){if(IN.left&&it.adj){it.adj(-1);ch=true;}if(IN.right&&it.adj){it.adj(1);ch=true;}if(IN.ok){if(it.a)it.a();else if(it.adj)it.adj(1);ch=true;}}
  if(ch&&panel){const n=panelItems().length;if(panel.sel>=n)panel.sel=Math.max(0,n-1);drawPanel();}}

// =====================================================================
// ACCIONES: mear (con chorro), cagar (en el baño o el ánimo baja), dormir, repostar, beber
// =====================================================================
const peeMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.011,0),new THREE.MeshBasicMaterial({color:0xe8d24a,transparent:true,opacity:0.75}),260);peeMesh.frustumCulled=false;
for(let i=0;i<260;i++)peeMesh.setMatrixAt(i,ZM);scene.add(peeMesh);const peeP=[];let peeI=0;const puddles=[];
function doPee(){if(P.bladder<12)return toast('No tienes ganas de mear');if(P.peeT>0)return;P.peeT=Math.min(6,1.5+P.bladder/18);P.peeStart=P.bladder;sfx('pee');const t=nearToilet();toast(t?'Meas en el váter. Qué alivio.':'Meas en plena calle…');P.peeToilet=!!t;}
function doPoop(){if(P.bowels<18)return toast('No tienes ganas');const t=nearToilet();P.bowels=0;
  if(t){if(countItem('papel')>0){takeItem('papel',1);P.mood=Math.min(100,P.mood+8);toast(`Usas ${t.kind==='letrina'?'la letrina':'el váter'}. Civilizado.`);}else{P.mood=Math.max(0,P.mood-4);toast('Cagas en el váter, pero sin papel… Ánimo -4');}}
  else{const pen=countItem('papel')>0?20:32;if(countItem('papel')>0)takeItem('papel',1);P.mood=Math.max(0,P.mood-pen);toast(`Cagas en la calle. Te sientes fatal. Ánimo -${pen}`);}fadeBlack(2.5);}
function doSleep(bed){if(P.energy>75)return toast('No tienes sueño');if(P.inCar&&Math.abs(P.inCar.speed)>0.5)return toast('Para el coche primero');
  const danger=H_.some(h=>h.active&&!h.dead&&hostileToPlayer(h)&&Math.hypot(h.x-camW.x,h.z-camW.z)<28);if(danger)return toast('No puedes dormir con enemigos cerca');
  P.sleeping=true;P.sleepLeft=480;P.bedSleep=!!bed;closePanel();toast(bed?'Te metes en la cama…':'Te echas a dormir en el suelo…',4);}
function doRefuel(){const c=nearestCar(4);if(!c)return toast('No hay ningún coche cerca');if(countItem('gasolina')<=0)return toast('No tienes gasolina');takeItem('gasolina',1);c.fuel=Math.min(100,c.fuel+40);toast(`Repostas. Depósito: ${c.fuel|0}%`);}
let blackT=0;const fadeBlack=t=>{blackT=t;};

// =====================================================================
// EFECTOS
// =====================================================================
// gotas de sangre: esferas que se estiran con la velocidad y, al tocar el suelo, quedan como una salpicadura plana
const NBL=420;const blood=new THREE.InstancedMesh(new THREE.SphereGeometry(1,7,5),pbr(new THREE.MeshStandardMaterial({color:0x4a0303,roughness:0.22,metalness:0,envMapIntensity:0.8})),NBL);blood.frustumCulled=false;for(let i=0;i<NBL;i++)blood.setMatrixAt(i,ZM);scene.add(blood);
const parts=[];let partI=0;function spray(pos,dir,n=10){if(!S.gore)n=0;n=Math.round(n*2.2);for(let k=0;k<n;k++){const i=partI++%NBL;const sp=R(0.6,1)*(k<n*0.3?3.5:1.8);
    parts[i]={p:pos.clone().addScaledVector(dir,0.03),v:new V3(dir.x*sp*R(0.6,1.4)+R(-0.9,0.9),dir.y*sp+R(-0.3,1.6),dir.z*sp*R(0.6,1.4)+R(-0.9,0.9)),life:R(0.6,1.2),r:R(0.0025,k<n*0.3?0.005:0.008),ground:false};}}
const _bq=new Q4(),_bs=new V3(),_bv=new V3();
const dust=new THREE.InstancedMesh(new THREE.BoxGeometry(0.03,0.03,0.03),new THREE.MeshBasicMaterial({color:0x9a948a}),60);dust.frustumCulled=false;for(let i=0;i<60;i++)dust.setMatrixAt(i,ZM);scene.add(dust);const dps=[];let dpi=0;
function impactPuff(p){for(let k=0;k<6;k++){const i=dpi++%60;dps[i]={p:p.clone(),v:new V3(R(-1,1),R(0.5,2),R(-1,1)),life:R(0.3,0.6)};}}
const tracers=[];for(let i=0;i<16;i++){const g=new THREE.BufferGeometry().setFromPoints([new V3(),new V3()]);const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xffe28a,transparent:true,opacity:0}));l.frustumCulled=false;scene.add(l);tracers.push({l,t:0});}
let trI=0;function tracer(a,b){const t=tracers[trI++%tracers.length];const pa=t.l.geometry.attributes.position;pa.setXYZ(0,a.x,a.y,a.z);pa.setXYZ(1,b.x,b.y,b.z);pa.needsUpdate=true;t.t=0.09;t.l.material.opacity=1;}
const noises=[];const makeNoise=(x,z,r)=>noises.push({x,z,r,t:3});
const blobs=new THREE.InstancedMesh((()=>{const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);return g;})(),new THREE.MeshBasicMaterial({map:texShadow,transparent:true,depthWrite:false}),MAXC+2);blobs.frustumCulled=false;for(let i=0;i<MAXC+2;i++)blobs.setMatrixAt(i,ZM);scene.add(blobs);
const fxSphere=new THREE.Mesh(new THREE.SphereGeometry(0.3,10,8),new THREE.MeshBasicMaterial({color:0x990000,transparent:true,opacity:0,side:THREE.BackSide,depthTest:false}));fxSphere.renderOrder=999;camera.add(fxSphere);let hurtFx=0;
const fxDiv=document.getElementById('fx');

// =====================================================================
// ENTRADA (teclado, ratón, táctil, mandos Quest)
// =====================================================================
const keys={},pressed=new Set();let mouseDown=false,lookDX=0,lookDY=0,rightDown=false;
addEventListener('keydown',e=>{if(!started)return;if(['Tab','ArrowUp','ArrowDown','Space','Backspace'].includes(e.code))e.preventDefault();if(!keys[e.code])pressed.add(e.code);keys[e.code]=true;});
addEventListener('keyup',e=>{keys[e.code]=false;});
const cv=renderer.domElement;cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('mousedown',e=>{if(!started||inVR)return;initAudio();if(e.button===2){rightDown=true;return;}if(document.pointerLockElement!==cv){try{const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(err){}}mouseDown=true;pressed.add('Mouse0');});
addEventListener('mouseup',e=>{if(e.button===2)rightDown=false;else mouseDown=false;});
addEventListener('mousemove',e=>{if(document.pointerLockElement===cv||rightDown){lookDX+=e.movementX;lookDY+=e.movementY;}});
const touchUI=document.getElementById('touch'),stickEl=document.getElementById('stick'),knob=document.getElementById('knob');
let tStick=null,tLook=null,tjx=0,tjy=0,tAtk=false,tRun=false;const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
touchUI.addEventListener('touchstart',e=>{initAudio();for(const t of e.changedTouches){if(t.target.tagName==='BUTTON')continue;
  if(t.clientX<innerWidth*0.45&&!tStick){tStick={id:t.identifier,x:t.clientX,y:t.clientY};stickEl.style.display='block';stickEl.style.left=(t.clientX-55)+'px';stickEl.style.top=(t.clientY-55)+'px';}else if(!tLook)tLook={id:t.identifier,x:t.clientX,y:t.clientY};}e.preventDefault();},{passive:false});
touchUI.addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(tStick&&t.identifier===tStick.id){const dx=clamp(t.clientX-tStick.x,-50,50),dy=clamp(t.clientY-tStick.y,-50,50);tjx=dx/50;tjy=-dy/50;knob.style.left=(35+dx)+'px';knob.style.top=(35+dy)+'px';}
  if(tLook&&t.identifier===tLook.id){lookDX+=(t.clientX-tLook.x)*1.6;lookDY+=(t.clientY-tLook.y)*1.6;tLook.x=t.clientX;tLook.y=t.clientY;}}e.preventDefault();},{passive:false});
const tEnd=e=>{for(const t of e.changedTouches){if(tStick&&t.identifier===tStick.id){tStick=null;tjx=tjy=0;stickEl.style.display='none';knob.style.left=knob.style.top='35px';}if(tLook&&t.identifier===tLook.id)tLook=null;}};
touchUI.addEventListener('touchend',tEnd);touchUI.addEventListener('touchcancel',tEnd);
const tbtn=(id,down,up)=>{const b=document.getElementById(id);b.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();initAudio();down();},{passive:false});if(up)b.addEventListener('touchend',e=>{e.preventDefault();up();});};
tbtn('t_atk',()=>{tAtk=true;pressed.add('Mouse0');},()=>{tAtk=false;});tbtn('t_run',()=>{tRun=!tRun;document.getElementById('t_run').style.background=tRun?'rgba(255,216,74,.4)':'';});
tbtn('t_use',()=>pressed.add('KeyE'));tbtn('t_wpn',()=>pressed.add('KeyQ'));tbtn('t_light',()=>pressed.add('KeyF'));tbtn('t_menu',()=>pressed.add('KeyM'));tbtn('t_inv',()=>pressed.add('KeyI'));tbtn('t_rel',()=>pressed.add('KeyR'));
tbtn('t_up',()=>pressed.add('ArrowUp'));tbtn('t_down',()=>pressed.add('ArrowDown'));tbtn('t_left',()=>pressed.add('ArrowLeft'));tbtn('t_right',()=>pressed.add('ArrowRight'));tbtn('t_ok',()=>pressed.add('Enter'));tbtn('t_back',()=>pressed.add('Backspace'));
let padL=null,padR=null,srcL=null,srcR=null;const prevB={},BS={};const IN={};
function edge(name,now){const was=prevB[name];prevB[name]=now;return now&&!was;}
function press(name,down,dt){const s=BS[name]||(BS[name]={d:false,t:0,f:false});let ev=null;if(down){if(!s.d){s.d=true;s.t=0;s.f=false;}else{s.t+=dt;if(!s.f&&s.t>0.5){s.f=true;ev='hold';}}}else if(s.d){s.d=false;if(!s.f)ev='tap';}return ev;}
function readInput(dt){Object.assign(IN,{mx:0,my:0,sprint:false,attack:false,attackP:false,use:false,weapon:false,eject:false,light:false,pee:false,inv:false,menu:false,map:false,status:false,crouch:false,reload:false,hud:false,recenter:false,
    back:false,up:false,down:false,left:false,right:false,ok:false,gas:0,brake:0,steer:0,snap:0,turn:0,lgDown:false,lgHeld:false});
  const pk=c=>pressed.has(c);
  if(keys.KeyW)IN.my+=1;if(keys.KeyS)IN.my-=1;if(keys.KeyA)IN.mx-=1;if(keys.KeyD)IN.mx+=1;IN.my+=tjy;IN.mx+=tjx;
  IN.sprint=!!keys.ShiftLeft||!!keys.ShiftRight||tRun;IN.attack=mouseDown||tAtk;IN.attackP=pk('Mouse0');IN.use=pk('KeyE');IN.weapon=pk('KeyQ');IN.light=pk('KeyF');IN.pee=pk('KeyP');
  IN.inv=pk('KeyI');IN.menu=pk('KeyM')||pk('Tab');IN.map=pk('KeyN');IN.status=pk('KeyH');IN.crouch=pk('KeyC');IN.recenter=pk('KeyV');IN.reload=pk('KeyR');
  IN.up=pk('ArrowUp');IN.down=pk('ArrowDown');IN.left=pk('ArrowLeft');IN.right=pk('ArrowRight');IN.ok=pk('Enter')||pk('Space');IN.back=pk('Backspace')||pk('Escape');
  IN.gas=Math.max(0,IN.my);IN.brake=Math.max(0,-IN.my);IN.steer=-IN.mx;pressed.clear();
  padL=padR=srcL=srcR=null;const ses=renderer.xr.getSession();
  if(ses)for(const s of ses.inputSources){if(!s.gamepad)continue;if(s.handedness==='left'){padL=s.gamepad;srcL=s;}else if(s.handedness==='right'){padR=s.gamepad;srcR=s;}}
  const ax=(g,i)=>g&&g.axes.length>i?g.axes[i]:0;const bt=(g,i)=>!!(g&&g.buttons[i]&&g.buttons[i].pressed);const bv=(g,i)=>g&&g.buttons[i]?g.buttons[i].value:0;
  if(padL||padR){const lx=ax(padL,2)||ax(padL,0),ly=ax(padL,3)||ax(padL,1),rx=ax(padR,2)||ax(padR,0);const dz=v=>Math.abs(v)<0.15?0:v;
    if(!panel){IN.mx+=dz(lx);IN.my+=-dz(ly);}IN.sprint=IN.sprint||bv(padL,0)>0.5;IN.attack=IN.attack||bt(padR,0);
    const trig=edge('rt',bt(padR,0));if(panel)IN.ok=IN.ok||trig;else IN.attackP=IN.attackP||trig;IN.use=IN.use||edge('rg',bt(padR,1));IN.rgHeld=bt(padR,1);
    const lg=bt(padL,1);IN.lgDown=edge('lg',lg);IN.lgHeld=lg;
    const a=press('A',bt(padR,4),dt),b=press('B',bt(padR,5),dt),x=press('X',bt(padL,4),dt),y=press('Y',bt(padL,5),dt);
    if(panel){if(x==='tap'||b==='tap')IN.back=true;}
    else{if(a==='tap')IN.weapon=true;if(a==='hold')IN.eject=true;if(b==='tap')IN.light=true;if(b==='hold')IN.pee=true;if(x==='tap')IN.inv=true;if(x==='hold')IN.menu=true;if(y==='tap')IN.map=true;if(y==='hold')IN.status=true;}
    if(edge('rs',bt(padR,3)))IN.crouch=true;{const ls=press('LS',bt(padL,3),dt);if(ls==='tap')IN.hud=true;if(ls==='hold')IN.recenter=true;}
    IN.up=IN.up||edge('lsu',ly<-0.6);IN.down=IN.down||edge('lsd',ly>0.6);IN.left=IN.left||edge('lsl',lx<-0.6);IN.right=IN.right||edge('lsr',lx>0.6);
    if(S.turn==='smooth'){IN.turn=Math.abs(rx)>0.18?rx:0;}else{if(edge('snapR',rx>0.7))IN.snap=1;if(edge('snapL',rx<-0.7))IN.snap=-1;}
    IN.gas=Math.max(IN.gas,bv(padR,0));IN.brake=Math.max(IN.brake,bv(padL,0));IN.steer+=-dz(lx);if(panel){IN.mx=0;IN.my=0;IN.gas=0;IN.steer=0;}}
  IN.mx=clamp(IN.mx,-1,1);IN.my=clamp(IN.my,-1,1);IN.steer=clamp(IN.steer,-1,1);}
function haptic(src,i=0.7,ms=50){try{const a=src&&src.gamepad&&src.gamepad.hapticActuators&&src.gamepad.hapticActuators[0];if(a&&a.pulse)a.pulse(i,ms);}catch(e){}}
const grips=[renderer.xr.getControllerGrip(0),renderer.xr.getControllerGrip(1)];const handFactory=new XRHandModelFactory();
grips.forEach((g,i)=>{rig.add(g);g.addEventListener('connected',e=>{const side=e.data.handedness;if(e.data.hand)return;gripBySide[side]=g;const hr=hands[side];if(hr)g.add(hr.handRoot);if(side==='left')g.add(vrFlash,vrFlT);});
  g.addEventListener('disconnected',()=>{for(const s of ['left','right'])if(gripBySide[s]===g)delete gripBySide[s];g.clear();});
  const hand=renderer.xr.getHand(i);try{hand.add(handFactory.createHandModel(hand,'mesh'));}catch(e){}rig.add(hand);});

// =====================================================================
// INTERACCIÓN
// =====================================================================
function nearestCar(r){let best=null,bd=r;for(const c of cars){const d=Math.hypot(c.x-camW.x,c.z-camW.z);if(d<bd){bd=d;best=c;}}return best;}
const ROLEN={leader:'líder',guard:'guardia',cook:'cocinera',medic:'médico',scavenger:'buscador',resident:'superviviente',raider:'saqueador'};
function findInteract(){const p=camW;if(P.inCar)return{type:'exit',text:inVR?'A: bajar del coche · agarra el volante con los grips':'Usar: bajar del coche'};const fy=p.y-1.6;
  let best=null,bd=9;const consider=(d,lim,o)=>{if(d<lim&&d<bd){bd=d;best=o;}};
  for(const l of lootNear(p.x,p.z)){if(l.looted)continue;if(l.y!==undefined&&Math.abs(l.y-fy)>1.6)continue;const d=Math.hypot(l.x-p.x,l.z-p.z);consider(d,l.sub==='bin'?2.6:1.9,{type:'loot',obj:l,text:`Usar: registrar ${l.label}`});}
  for(const f of FOUNTAINS){const d=Math.hypot(f.x-p.x,f.z-p.z);consider(d,1.5,{type:'fountain',obj:f,text:'Usar: beber agua de la fuente'});}
  for(const d of DOORS){const dx=d.hx-p.x,dz=d.hz-p.z;if(dx*dx+dz*dz>9)continue;doorHandleWorld(d,_v);if(Math.abs(_v.y-p.y+0.5)>1.2)continue;const dd=Math.hypot(_v.x-p.x,_v.z-p.z);consider(dd,1.5,{type:'door',obj:d,text:d.locked?'Usar: probar la puerta':(d.slide?(d.off>0.4?'Usar: cerrar la puerta':'Usar: abrir la puerta'):(d.ang>0.3?'Usar: cerrar la puerta':'Usar: abrir la puerta'))});}
  for(const b of BEDS){const d=Math.hypot(b.x-p.x,b.z-p.z);if(Math.abs(b.y-0.5-fy)<1.5)consider(d,1.6,{type:'bed',obj:b,text:'Usar: dormir en la cama'});}
  for(const h of H_){if(!h.active)continue;const d=Math.hypot(h.sim[PELVIS].x-p.x,h.sim[PELVIS].z-p.z);
    if(h.dead&&h.type!=='zombie'&&!h.searched)consider(d,2,{type:'corpse',obj:h,text:'Usar: registrar cadáver'});
    else if(!h.dead&&h.type!=='zombie'&&!hostileToPlayer(h))consider(d,3,{type:'talk',obj:h,text:`Usar: hablar con ${h.name}${h.role?' ('+ROLEN[h.role]+')':''}`});}
  if(!best){let bm=null,bmd=1.6;for(const m of MOTOS){if(m.taken)continue;const d=Math.hypot(m.x-p.x,m.z-p.z);if(d<bmd){bmd=d;bm=m;}}if(bm)return bm.fallen?{type:'moto',obj:bm,text:'Usar: levantar la moto'}:{type:'moto',obj:bm,text:bm.ok?'Usar: subir a la moto':'Usar: probar la moto'};}
  const car=nearestCar(3.4);if(car&&!best){const lx=(camW.x-car.x)*Math.sin(car.yaw)+(camW.z-car.z)*Math.cos(car.yaw);
    if(lx<-1.6&&!car.searched)return{type:'trunk',obj:car,text:'Usar: registrar maletero'};return{type:'car',obj:car,text:`Usar: subir al coche (gasolina ${car.fuel|0}%)`};}
  return best;}
const LOOTG=new Map();function buildLootGrid(){for(const l of LOOT){const k=vk(Math.floor(l.x/VCG),Math.floor(l.z/VCG));let a=LOOTG.get(k);if(!a)LOOTG.set(k,a=[]);a.push(l);}}
function lootNear(x,z){const out=[];const i=Math.floor(x/VCG),j=Math.floor(z/VCG);for(let a=i-1;a<=i+1;a++)for(let b=j-1;b<=j+1;b++){const L=LOOTG.get(vk(a,b));if(L)out.push(...L);}return out;}
function doInteract(){const it=findInteract();if(!it)return;
  if(it.type==='loot'){const l=it.obj;l.looted=true;lootRoll(l.sub);for(const r of l.refs)hideInst(r);}
  else if(it.type==='fountain'){P.water=Math.min(100,P.water+35);P.bladder=Math.min(100,P.bladder+10);sfx('drink');if(Math.random()<0.06&&S.spoil){P.sick=Math.min(100,P.sick+20);toast('El agua sabía rara…');}else toast('Bebes agua fresca');}
  else if(it.type==='door'){const d=it.obj;if(inVR&&gripBySide.right&&!d.locked)return;if(d.locked){sfx('rattle');toast('Está cerrada con llave',1.5);}else if(d.slide){d.off=d.off>0.4?0:d.maxOff*0.9;applyDoor(d);sfx('thud',0.4);}else{d.target=d.ang>0.3?0:Math.min(d.maxA,1.55);sfx('click');}}
  else if(it.type==='bed')doSleep(true);
  else if(it.type==='corpse'){it.obj.searched=true;lootRoll('corpse');}
  else if(it.type==='trunk'){it.obj.searched=true;lootRoll('trunk');}
  else if(it.type==='talk')talkTo(it.obj);
  else if(it.type==='moto'){const m=it.obj;if(m.fallen){m.fallen=false;const L=INST[m.model].lists.get(m.ref[1]);const t=L[m.ref[2]];t[11]=0;t[1]=m.y;const im=INST[m.model].byKey[m.ref[1]];if(im){_m.compose(_p.set(t[0],t[1],t[2]),_q.setFromEuler(_eu2.set(0,t[3],0,'YXZ')),_s.set(1,1,1));im.setMatrixAt(m.ref[2],_m);im.instanceMatrix.needsUpdate=true;}sfx('thud');toast(m.ok?'Levantas la moto. Parece que arranca.':'Levantas la moto. No arranca.');return;}
    if(!m.ok){sfx('click');toast('No arranca: sin batería');return;}hideInst(m.ref);m.taken=true;const c=makeMoto(m);P.inCar=c;P.carYaw=0;P.carGun=false;toast(inVR?'Subes a la moto · agarra el manillar con los dos grips · gatillo: gas':'Subes a la moto');}
  else if(it.type==='car'){if(it.obj.flip){toast('Está volcado');return;}P.inCar=it.obj;P.carYaw=0;P.carGun=false;carInterior(it.obj);toast(inVR?'Subes al coche · palanca con el grip derecho · B: modo disparo':'Subes al coche');}
  else if(it.type==='exit')exitCar();}
function talkTo(h){const b=h.base,day=dayNum();
  if(!b){toast(`${h.name}: «${pick(['Cuidado, en el Castell de Montjuïc hay bandidos.','De noche no ven bien, pero oyen muy bien.','En las comisarías de los Mossos aún quedan balas.','Las farmacias tienen antibióticos, si llegas.','El Mercat del Raval es seguro. Pregunta por el líder.'])}»`,5);return;}
  const r=h.role;h.talkT=clockT;
  if(r==='leader'){if(b.lastHelpDay===day)return toast(`${h.name}: «Ya te hemos ayudado hoy. Vuelve mañana.»`,4);b.lastHelpDay=day;for(const [id,n] of [['bocata',1],['agua',2],['vendas',1],['balas',8],['papel',1]])addItem(id,n,'gift');P.mood=Math.min(100,P.mood+10);sfx('loot');toast(`${h.name} (${b.name}): «Toma provisiones. Aquí puedes dormir tranquilo.»`,5);}
  else if(r==='medic'){if(b.lastMedDay===day)return toast(`${h.name}: «Hoy ya no me quedan vendas para ti.»`,4);b.lastMedDay=day;P.hp=Math.min(100,P.hp+40);P.sick=Math.max(0,P.sick-40);toast(`${h.name} te cura las heridas.`,4);}
  else if(r==='cook'){if(b.lastFoodDay===day)return toast(`${h.name}: «La olla está vacía hasta mañana.»`,4);b.lastFoodDay=day;P.food=Math.min(100,P.food+35);P.mood=Math.min(100,P.mood+6);toast(`${h.name} te sirve un plato de lentejas calientes.`,4);}
  else if(r==='guard')toast(`${h.name}: «${pick(['Mantente alerta, ayer entraron tres por la puerta norte.','Si oyes disparos, no corras hacia ellos.','Los corredores son los peores. Apunta a la cabeza.'])}»`,4);
  else if(r==='scavenger')toast(`${h.name}: «${h.lastLoot?'Vengo de '+h.lastLoot+'. Está casi vacío.':'Ahora salgo a buscar comida por el barrio.'}»`,4);
  else toast(`${h.name}: «${pick(['¿Has visto a mi hermano? Se llama Pere.','Echo de menos el ruido del metro.','Dicen que en Montjuïc hay gente armada.'])}»`,4);}
function exitCar(){const c=P.inCar;if(!c)return;if(Math.abs(c.speed)>3)return toast('Vas demasiado rápido para bajar');P.inCar=null;c.speed=0;headlight.intensity=0;
  const s=Math.sin(c.yaw),co=Math.cos(c.yaw);const pt={x:c.x+co*2.3,z:c.z-s*2.3};collide(pt,0.4,surfY(pt.x,pt.z)+0.2,surfY(pt.x,pt.z)+1.7);rig.position.set(pt.x,surfY(pt.x,pt.z),pt.z);P.feetY=rig.position.y;P.yaw=c.yaw+Math.PI;toast('Bajas del coche');}
// desatascar: si te has quedado bajo el suelo o dentro de algo, vuelves al punto libre más cercano en la acera (o al inicio)
function unstick(){if(P.inCar)exitCar();camera.getWorldPosition(_v);let best=null,bd=1e9;for(const bk of BLOCKS){if(bk.outer)continue;for(const p of bk.cp){const c=centroid(bk.bp);const x=p[0]+(p[0]-c[0])*0.02,z=p[1]+(p[1]-c[1])*0.02;const d=Math.hypot(x-_v.x,z-_v.z);if(d<bd&&!insideVol(x,surfY(x,z)+1,z)){bd=d;best=[x,z];}}}
  P.feetY=undefined;P.hOff=0;P.crouchOff=0;P.crouchToggle=false;if(best){const y=surfY(best[0],best[1]);rig.position.set(best[0]-(_v.x-rig.position.x),y,best[1]-(_v.z-rig.position.z));P.feetY=y;}P.lastSafe.copy(camW);toast('Te recolocas en la calle',1.5);}
// recolocar altura y vista (mantener pulsado el joystick izquierdo, o V)
function recenter(){camera.getWorldPosition(_v);P.feetY=surfY(_v.x,_v.z,_v.y+0.2);P.crouchToggle=false;P.crouchOff=0;P.hOff=inVR?clamp(1.62-camera.position.y,-0.4,1.1):0;P.standEye=1.6;
  if(inVR){camera.getWorldDirection(_v1);const look=Math.atan2(-_v1.x,-_v1.z);P.yaw+=-(look-P.yaw)*0+0;}rig.position.y=P.feetY+(P.hOff||0);toast('Altura y vista recolocadas',1.5);}

// =====================================================================
// IA: zombis y supervivientes con roles
// =====================================================================
const hostileToPlayer=h=>h.type==='zombie'||(h.type==='bandit'&&S.bandits)||h.hostile||h.angry||(h.base&&h.base.angry);
function moveH(h,dx,dz,speed,dt){const l=Math.hypot(dx,dz);if(l<1e-4||speed<=0){h.speed*=0.85;h.vx=h.vz=0;return;}dx/=l;dz/=l;
  if(h.avoidT>0){h.avoidT-=dt;const s=h.avoidS;const tx=-dz*s,tz=dx*s;dx=dx*0.3+tx;dz=dz*0.3+tz;const l2=Math.hypot(dx,dz);dx/=l2;dz/=l2;}
  const ty=Math.atan2(dx,dz);let dy=ty-h.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));h.yaw+=dy*Math.min(1,dt*5);
  const ox=h.x,oz=h.z;h.vx=dx*speed;h.vz=dz*speed;_cp.x=h.x+h.vx*dt;_cp.z=h.z+h.vz*dt;collide(_cp,0.3,h.y+0.3,h.y+1.7);
  for(const c of cars){const ex=_cp.x-c.x,ez=_cp.z-c.z,d=Math.hypot(ex,ez);if(d<c.halfW+0.9&&d>0){_cp.x=c.x+ex/d*(c.halfW+0.9);_cp.z=c.z+ez/d*(c.halfW+0.9);}}
  h.x=_cp.x;h.z=_cp.z;const moved=Math.hypot(h.x-ox,h.z-oz);h.speed=moved/Math.max(dt,1e-3);
  if(moved<speed*dt*0.3){h.stuckT=(h.stuckT||0)+dt;if(h.stuckT>0.8){h.avoidT=R(1.2,2.5);h.avoidS=Math.random()<0.5?1:-1;h.stuckT=0;}}else h.stuckT=0;}
function faceTo(h,x,z,dt){const ty=Math.atan2(x-h.x,z-h.z);let dy=ty-h.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));h.yaw+=dy*Math.min(1,dt*7);}
function zombieAI(h,dt,p){h.think-=dt;
  if(h.think<=0){h.think=0.3+Math.random()*0.25;let det=(nightF>0.5?16:28)*S.zSense;let best=null,bd=1e9;const dp=Math.hypot(h.x-p.x,h.z-p.z);
    const dpl=det*(P.crouch?0.5:1)+(P.light&&nightF>0.5?14:0)+(P.sprinting?8:0)+(P.inCar&&Math.abs(P.inCar.speed)>1?14:0);if(P.alive&&dp<dpl&&Math.abs(p.y-1.6-h.y)<3){best='player';bd=dp;}
    for(const o of H_){if(!o.active||o.dead||o.type==='zombie')continue;const d=Math.hypot(o.x-h.x,o.z-h.z);if(d<det&&d<bd){best=o;bd=d;}}
    if(h.target!==best&&best){if(Math.random()<0.7)zombieSound(volAt(h.x,h.z,35),'groan');}h.target=best;
    if(!best){for(const n of noises){if(Math.hypot(n.x-h.x,n.z-h.z)<n.r*S.zSense){h.goal={x:n.x+R(-4,4),z:n.z+R(-4,4)};break;}}
      if(!h.goal&&!h.meal&&Math.random()<0.1){for(const o of H_){if(o.active&&o.dead&&o.type!=='zombie'&&Math.hypot(o.sim[CHEST].x-h.x,o.sim[CHEST].z-h.z)<18){h.meal=o;break;}}}}}
  let tx,tz;const t=h.target;if(t==='player'){tx=p.x;tz=p.z;}else if(t&&t.active&&!t.dead){tx=t.x;tz=t.z;}else if(t)h.target=null;
  if(h.crawler){h.act='crawl';if(tx!==undefined){const dx=tx-h.x,dz=tz-h.z,d=Math.hypot(dx,dz);if(d>0.8)moveH(h,dx,dz,0.35,dt);else{h.speed=0;h.atk-=dt;if(h.atk<=0){h.atk=1.6;if(t==='player')damagePlayer(5,'zombi',true);}}}else h.speed=0;return;}
  if(h.mode==='phys'&&(h.k<0.6||h.down>0||h.act==='getup')){h.speed*=0.85;return;}
  if(Math.abs(h.gp.limp)>0.6&&h.speed>0.3&&Math.random()<dt*(h.gp.drag?0.12:0.05)){enterPhys(h);knockDown(h,null,R(1.2,2.5));return;}
  h.act='stand';
  if(tx!==undefined){h.meal=null;const dx=tx-h.x,dz=tz-h.z,d=Math.hypot(dx,dz);
    if(d>0.95)moveH(h,dx,dz,(h.runner?3.8:0.95)*h.gp.speedMul*(h.broken.lArm||h.broken.rArm?0.85:1),dt);
    else{h.speed*=0.8;h.vx=h.vz=0;faceTo(h,tx,tz,dt);h.atk-=dt;
      if(h.atk<=0){h.atk=1.3;h.atkAnim=0.45;zombieSound(volAt(h.x,h.z,20),'attack');
        if(t==='player'){if(!(P.inCar&&Math.abs(P.inCar.speed)>2))damagePlayer(8,'zombi',true);}
        else{t.bodyHp-=16;if(t.bodyHp<=0)hitChar(t,'body',1,_imp.set(dx,0.5,dz).normalize().multiplyScalar(3),CHEST,'zombie');else if(!t.target)t.target=h;}}}}
  else if(h.meal&&h.meal.active&&h.meal.dead){const m=h.meal.sim[CHEST];const dx=m.x-h.x,dz=m.z-h.z,d=Math.hypot(dx,dz);if(d>0.9)moveH(h,dx,dz,0.8,dt);else{h.speed=0;faceTo(h,m.x,m.z,dt);h.act='eat';h.eatT+=dt;if(h.eatT>25){h.meal=null;h.eatT=0;}}}
  else if(h.goal){const dx=h.goal.x-h.x,dz=h.goal.z-h.z;if(Math.hypot(dx,dz)<2)h.goal=null;else moveH(h,dx,dz,0.85*h.gp.speedMul,dt);}
  else{h.idle-=dt;if(h.idle<=0){h.idle=R(2,7);h.wd=Math.random()<0.45?null:Math.random()*6.28;}if(h.wd!=null)moveH(h,Math.sin(h.wd),Math.cos(h.wd),0.4*h.gp.speedMul,dt);else{h.speed*=0.9;h.vx=h.vz=0;}}
  h.groanT-=dt;if(h.groanT<=0){h.groanT=R(4,12)*(t?0.5:1);zombieSound(volAt(h.x,h.z,32),'groan');}}
function isNight(){const hr=hourF();return hr>=22||hr<7;}
function survivorAI(h,dt,p){h.think-=dt;const b=h.base;
  if(h.think<=0){h.think=0.4+Math.random()*0.3;let best=null,bd=30;
    for(const o of H_){if(!o.active||o.dead||o.type!=='zombie')continue;const d=Math.hypot(o.x-h.x,o.z-h.z);if(d<bd){bd=d;best=o;}}
    if(P.alive&&hostileToPlayer(h)){const d=Math.hypot(p.x-h.x,p.z-h.z);if(d<34&&d<bd+6){best='player';bd=d;}}
    if(h.act==='sleep'&&best&&bd>10)best=null;h.target=best;}
  if(h.mode==='phys'&&(h.k<0.6||h.down>0||h.act==='getup')){h.speed*=0.85;return;}
  const t=h.target;let tx,tz,tpos=null;
  if(t==='player'){tx=p.x;tz=p.z;tpos=_e2.set(p.x,p.y-0.35,p.z);}else if(t&&t.active&&!t.dead){tx=t.x;tz=t.z;tpos=t.sim[CHEST];}else h.target=null;
  if(tpos){h.act='stand';const dx=tx-h.x,dz=tz-h.z,d=Math.hypot(dx,dz);
    if(!h.armed){h.aim=0;if(b)moveH(h,b.x-h.x,b.z-h.z,3,dt);else moveH(h,-dx,-dz,3,dt);return;}
    h.aim=1;if(d>20&&h.role!=='guard')moveH(h,dx,dz,2.8,dt);else if(d<4&&t!=='player')moveH(h,-dx,-dz,2.5,dt);else{h.speed*=0.8;h.vx=h.vz=0;faceTo(h,tx,tz,dt);}
    h.shootT-=dt;if(h.shootT<=0){h.shootT=R(0.9,1.9);npcFire(h,t,tpos,d);}return;}
  h.aim=0;
  // rutinas según el rol y la hora
  if(!b){wanderAI(h,dt);return;}
  const night=isNight();const idx=b.members.indexOf(h);
  let goal=null,act='stand',face=null;
  if(night&&!(h.role==='guard'&&idx%2===0)){const bed=b.beds[idx%Math.max(1,b.beds.length)];if(bed){goal=bed;act='sleep';}}
  else if(h.role==='guard'){const post=b.posts[idx%b.posts.length];goal=post;act='aim';face=[post[0]*2-b.x,post[1]*2-b.z];}
  else if(h.role==='cook'){goal=[b.fire[0]+1.2,b.fire[1]];act='squat';face=b.fire;}
  else if(h.role==='leader'){goal=h.lgoal||(h.lgoal=[b.fire[0]+R(-3,3),b.fire[1]+R(2,4)]);act=(clockT-(h.talkT||-99))<4?'stand':'stand';face=[camW.x,camW.z];}
  else if(h.role==='medic'){goal=b.beds[0]||b.fire;act='stand';}
  else if(h.role==='scavenger'||h.role==='raider'){scavAI(h,dt,b);return;}
  else{if(!h.rgoal||h.actT>R(12,30)){h.rgoal=[b.x+R(-b.r*0.6,b.r*0.6),b.z+R(-b.r*0.6,b.r*0.6)];h.actT=0;h.ract=Math.random()<0.4?'sit':'stand';}goal=h.rgoal;act=h.ract;}
  if(goal){const dx=goal[0]-h.x,dz=goal[1]-h.z,d=Math.hypot(dx,dz);if(d>0.8){h.act='stand';moveH(h,dx,dz,night?1.0:1.2,dt);}else{h.speed*=0.8;h.vx=h.vz=0;h.act=act;if(face)faceTo(h,face[0],face[1],dt);}}}
function wanderAI(h,dt){if(!h.goal||Math.hypot(h.goal.x-h.x,h.goal.z-h.z)<1.5){h.idle-=dt;h.speed*=0.9;if(h.idle<=0){h.idle=R(2,8);h.goal={x:clamp(h.x+R(-60,60),XMIN+20,XMAX-20),z:clamp(h.z+R(-60,60),ZMIN+20,340)};}}
  else{h.act='stand';moveH(h,h.goal.x-h.x,h.goal.z-h.z,1.4,dt);}}
// buscadores: salen de día a registrar tiendas cercanas y vuelven
function scavAI(h,dt,b){const night=isNight();
  if(!h.task){if(night){const bed=b.beds[0];h.act='stand';if(bed){const dx=bed[0]-h.x,dz=bed[1]-h.z;if(Math.hypot(dx,dz)>1)moveH(h,dx,dz,1.2,dt);else{h.act='sleep';h.speed=0;}}return;}
    h.waitT=(h.waitT||R(10,40))-dt;if(h.waitT>0){h.act='stand';h.speed*=0.9;return;}
    const cands=LOOT.filter(l=>!l.looted&&l.kind==='cont'&&l.sub!=='bin'&&l.sub!=='base_caja'&&Math.hypot(l.x-b.x,l.z-b.z)<170&&Math.hypot(l.x-b.x,l.z-b.z)>b.r+5);
    if(!cands.length){h.waitT=60;return;}const l=pick(cands);h.task={l,phase:'go',t:0};}
  const T=h.task;T.t+=dt;
  if(T.phase==='go'){const dx=T.l.x-h.x,dz=T.l.z-h.z,d=Math.hypot(dx,dz);h.act='stand';if(d>1.4)moveH(h,dx,dz,1.5,dt);else{T.phase='loot';T.t=0;}if(T.t>180){T.phase='back';T.t=0;}}
  else if(T.phase==='loot'){h.speed=0;h.act='loot';faceTo(h,T.l.x,T.l.z,dt);if(T.t>6){if(!T.l.looted){T.l.looted=true;for(const r of T.l.refs)hideInst(r);}const s=SHOPS.find(s=>Math.hypot(s.x-T.l.x,s.z-T.l.z)<20);h.lastLoot=s?s.name:'unas casas';T.phase='back';T.t=0;}}
  else{const dx=b.x-h.x,dz=b.z-h.z,d=Math.hypot(dx,dz);h.act='stand';if(d>3)moveH(h,dx,dz,1.5,dt);else{h.task=null;h.waitT=R(60,180);}if(T.t>200){h.task=null;}}}
function npcFire(h,t,tpos,d){const pts=h.sim;_o2.copy(pts[CHEST]);_o2.y+=0.08;_d2.subVectors(tpos,_o2).normalize();_o2.addScaledVector(_d2,0.45);const dist=_o2.distanceTo(tpos);
  if(rayWorld(_o2,_d2,dist)<dist-0.5)return;let acc=clamp(0.9-d*0.02,0.22,0.9)*(nightF>0.5?0.7:1);if(t==='player')acc*=P.crouch?0.5:0.7;
  sfx('shot',volAt(h.x,h.z,90));makeNoise(h.x,h.z,55);const hit=Math.random()<acc;_e2.copy(tpos);if(!hit){_e2.x+=R(-1.5,1.5);_e2.y+=R(-0.5,1);_e2.z+=R(-1.5,1.5);}tracer(_o2,_e2);
  if(hit){if(t==='player')damagePlayer(9,h.type==='bandit'?'bandidos':'disparo');
    else{const r=Math.random();const part=r<0.22?'head':r<0.8?'body':pick(['lArm','rArm','lLeg','rLeg']);const pi=part==='head'?HEAD:part==='body'?CHEST:LIMB_PTS[part][0];
      hitChar(t,part,part==='head'?999:35,_imp.copy(_d2).multiplyScalar(4.5),pi,'npc',_e2,_d2);spray(_e2,_d2,6);}}}
function inBaseZone(x,z,r=45){return BASES.some(b=>Math.hypot(b.x-x,b.z-z)<r);}
function spawnZombieNear(p,minR,maxR){for(let tries=0;tries<14;tries++){const a=Math.random()*6.28,r=R(minR,maxR);const x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;
  if(x<XMIN+5||x>XMAX-5||z<ZMIN+5||z>350||inBaseZone(x,z))continue;const y=surfY(x,z);const c={x,z};if(collide(c,0.5,y+0.3,y+1.7))continue;if(insideVol(x,y+1,z))continue;
  return spawnChar('zombie',x,z,{runner:Math.random()*100<S.runners});}return null;}
let popT=0;
function managePop(p,first){popT-=1;if(popT>0&&!first)return;popT=120;let n=0;
  for(const h of H_){if(!h.active||h.type!=='zombie')continue;const d=Math.hypot(h.x-p.x,h.z-p.z);if(d>210&&h.target!=='player'){despawn(h);continue;}if(!h.dead)n++;}
  let need=S.zombies-n,budget=first?S.zombies:3;while(need>0&&budget>0){if(!spawnZombieNear(p,first?25:70,first?140:150))break;need--;budget--;}
  if(n>S.zombies+5)for(const h of H_){if(n<=S.zombies)break;if(h.active&&h.type==='zombie'&&!h.dead&&Math.hypot(h.x-p.x,h.z-p.z)>60){despawn(h);n--;}}}
function populateNPCs(){for(const b of BASES){b.members=[];const roles=b.type==='good'?['leader','guard','guard','cook','medic','scavenger','scavenger','resident']:['leader','guard','guard','raider','raider','resident','resident'];
    for(let k=0;k<Math.min(b.n+1,roles.length);k++){const x=b.x+R(-b.r*0.5,b.r*0.5),z=b.z+R(-b.r*0.5,b.r*0.5);const h=spawnChar(b.type,x,z,{base:b,role:roles[k],armed:b.type==='bandit'||['leader','guard','scavenger'].includes(roles[k])});
      if(h){h.headHp=70;h.bodyHp=140;b.members.push(h);}}}
  for(let k=0;k<6;k++){let x,z,tries=0;do{x=R(XMIN+30,XMAX-30);z=R(ZMIN+30,330);tries++;}while((inBaseZone(x,z,60)||collide({x,z},0.5,surfY(x,z)+0.3,surfY(x,z)+1.7))&&tries<40);spawnChar('wanderer',x,z,{hostile:Math.random()<0.4});}}

// =====================================================================
// COCHES
// =====================================================================
// ---------- coche: carrocería continua (secciones a lo largo del coche), lunas de verdad e interior ----------
// perfiles (z del maletero al morro): bajos, línea de cintura, techo, anchura y anchura del techo
const CARZ=[-2.13,-2.06,-1.9,-1.72,-1.4,-1.0,-0.5,-0.05,0.3,0.62,0.86,1.2,1.6,1.9,2.06,2.13];
const CARP={yt:[0.86,1.0,1.3,1.42,1.45,1.46,1.46,1.43,1.27,1.07,0.93,0.89,0.84,0.76,0.66,0.58],yb:[0.66,0.8,0.92,0.97,0.98,0.97,0.95,0.93,0.92,0.91,0.9,0.88,0.84,0.76,0.66,0.58],
  w:[0.7,0.82,0.86,0.87,0.875,0.875,0.875,0.875,0.875,0.87,0.865,0.86,0.84,0.8,0.72,0.62],wr:[0.6,0.66,0.66,0.67,0.68,0.68,0.68,0.68,0.66,0.62,0.6,0.6,0.6,0.6,0.6,0.55]};
const WB=1.3,WR=0.31;// semibatalla y radio de rueda
const CARGEO=(()=>{const NZ=48,z0=CARZ[0],z1=CARZ[CARZ.length-1];const lerpP=(arr,z)=>{for(let i=0;i<CARZ.length-1;i++)if(z<=CARZ[i+1]){const t=(z-CARZ[i])/(CARZ[i+1]-CARZ[i]);const u=t*t*(3-2*t)*0.35+t*0.65;return arr[i]+(arr[i+1]-arr[i])*u;}return arr[arr.length-1];};
  const y0=z=>{let y=0.27;for(const zc of [-WB,WB]){const d=z-zc;if(Math.abs(d)<0.44)y=Math.max(y,0.37+Math.sqrt(0.44*0.44-d*d));}if(Math.abs(z)>1.95)y=Math.max(y,0.27+(Math.abs(z)-1.95)*0.6);return y;};
  // media sección: [x,y,zona] de abajo-centro a arriba-centro; zona 0 = chapa, 1 = luna lateral, 2 = techo/luna delantera-trasera
  const half=(z)=>{const yt=lerpP(CARP.yt,z),yb=Math.min(lerpP(CARP.yb,z),yt),w=lerpP(CARP.w,z),wr=Math.min(lerpP(CARP.wr,z),w),b=y0(z);const P=[];
    P.push([0,b,0],[w*0.8,b,0],[w*0.96,b+0.05,0],[w,b+0.16,0],[w*1.005,(b+yb)*0.5,0],[w,yb-0.06,0],[w*0.985,yb,0]);
    const gh=yt-yb;P.push([w*0.975,yb+0.005,1],[wr+(w-wr)*0.55,yb+gh*0.45,1],[wr+(w-wr)*0.12,yb+gh*0.9,1],[wr*0.94,yt-0.012,2],[wr*0.6,yt,2],[0,yt+0.005,2]);return P;};
  const NP=13;const pos=[],uv=[],idx=[],zone=[];
  for(let i=0;i<=NZ;i++){const z=z0+(z1-z0)*i/NZ;const H=half(z);for(const sg of [1,-1])for(let jj=0;jj<NP;jj++){const p=H[jj];pos.push(p[0]*sg,p[1],z);uv.push(i/NZ,jj/(NP-1));}}
  const vid=(i,sg,jj)=>i*NP*2+(sg>0?0:NP)+jj;
  // grupo por cara: 0 chapa, 1 cristal, 2 negro (marcos)
  const groups=[[],[],[]];const zw0=0.86,zw1=-0.05,zr0=-1.72,zr1=-2.06;
  for(let i=0;i<NZ;i++){const zm=z0+(z1-z0)*(i+0.5)/NZ;for(const sg of [1,-1])for(let jj=0;jj<NP-1;jj++){
      let g=0;if(jj>=7&&jj<=9){// ventanillas laterales con pilares A, B y C
        const inGlass=zm<zw0-0.05&&zm>zr0+0.02;const pillar=Math.abs(zm-(-0.62))<0.07||(zm<zw0&&zm>zw0-0.1)||(zm>zr0&&zm<zr0+0.12);g=inGlass?(pillar?2:1):0;if(jj===7&&inGlass)g=2;}
      else if(jj>=10){if((zm<zw0-0.02&&zm>zw1+0.04)||(zm<zr0-0.03&&zm>zr1+0.03))g=1;}// parabrisas y luneta
      const a=vid(i,sg,jj),b=vid(i+1,sg,jj),c=vid(i+1,sg,jj+1),d=vid(i,sg,jj+1);const f=sg>0?[a,d,c,a,c,b]:[a,b,c,a,c,d];groups[g].push(...f);}}
  // tapas delantera y trasera
  for(const [i,fl] of [[0,true],[NZ,false]]){for(let jj=0;jj<NP-1;jj++){for(const sg of [1,-1]){const a=vid(i,sg,jj),b=vid(i,sg,jj+1),c=vid(i,1,0);const f=(sg>0)!==fl?[a,b,c]:[a,c,b];groups[0].push(...f);}}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  const all=[];groups.forEach((g,n)=>{geo.addGroup(all.length,g.length,n);all.push(...g);});geo.setIndex(all);geo.computeVertexNormals();
  // detalles exteriores y habitáculo (color por vértice)
  const P=[];const B=(w,h,d,x,y,z,c,rx=0,ry=0,rz=0)=>P.push([bx(w,h,d,x,y,z,rx,ry,rz),c]);const C=(r0,r1,h,x,y,z,c,seg=12,rx=0,rz=0)=>P.push([cy(r0,r1,h,x,y,z,seg,rx,rz),c]);
  // paragolpes, rejilla, faros, pilotos, matrículas (blancas con franja azul), retrovisores, manetas, bajos
  B(1.5,0.2,0.1,0,0.42,2.1,0x1b1c1e,0.1);B(1.5,0.22,0.1,0,0.42,-2.1,0x1b1c1e,-0.1);B(0.86,0.16,0.04,0,0.6,2.12,0x0e0f10);
  for(const sx of [1,-1]){B(0.34,0.1,0.08,sx*0.55,0.72,2.03,0xe8eef2,0.25,sx*0.25);B(0.3,0.1,0.06,sx*0.6,0.86,-2.05,0x8a0d10,-0.3,-sx*0.25);B(0.12,0.08,0.06,sx*0.68,0.76,-2.08,0xd85a10);
    B(0.04,0.09,0.17,sx*0.95,1.0,0.66,0x15161a);B(0.06,0.11,0.2,sx*0.93,1.0,0.7,0x15161a);B(0.03,0.025,0.13,sx*0.885,0.88,-0.15,0x2a2c30);B(0.03,0.025,0.13,sx*0.885,0.88,-1.05,0x2a2c30);
    B(0.04,0.08,2.0,sx*0.875,0.31,0,0x18191b);}
  for(const zc of [-WB,WB]){B(1.36,0.46,0.9,0,0.6,zc,0x0b0b0c);}
  B(0.52,0.12,0.01,0,0.47,2.165,0xf2f2f0);B(0.04,0.12,0.012,-0.24,0.47,2.17,0x1f45a8);B(0.52,0.12,0.01,0,0.62,-2.16,0xf2f2f0);B(0.04,0.12,0.012,0.24,0.62,-2.165,0x1f45a8);
  // salpicadero, consola, asientos de tela, volante aparte
  B(1.6,0.2,0.42,0,0.88,0.62,0x1c1d20,-0.25);B(1.55,0.08,0.3,0,0.99,0.52,0x26272a,-0.1);B(0.36,0.16,0.04,0.38,0.97,0.42,0x0c0c0d,-0.5);B(0.24,0.16,0.03,0,1.0,0.5,0x101820,-0.4);
  B(0.24,0.36,0.62,0,0.5,0.1,0x1e1f22);B(0.05,0.09,0.05,0,0.72,0.05,0x111111);
  B(0.38,0.13,0.11,0.38,1.04,0.52,0x111214);
  const S=[];const SB=(w,h,d,x,y,z,rx=0)=>S.push([bx(w,h,d,x,y,z,rx),0x55585e]);
  for(const sx of [0.38,-0.38]){SB(0.5,0.12,0.52,sx,0.5,-0.2);SB(0.5,0.62,0.13,sx,0.84,-0.5,-0.18);SB(0.28,0.18,0.1,sx,1.21,-0.58,-0.18);SB(0.08,0.16,0.5,sx+0.22,0.6,-0.2);SB(0.08,0.16,0.5,sx-0.22,0.6,-0.2);}
  SB(1.45,0.14,0.5,0,0.52,-1.15);B(1.62,0.04,1.1,0,0.29,0.35,0x141416);B(1.5,0.5,0.04,0,0.55,0.86,0x141416);SB(1.45,0.55,0.12,0,0.82,-1.42,-0.2);B(1.62,0.04,1.2,0,0.29,-0.4,0x141416);
  for(const sx of [1,-1]){B(0.05,0.36,2.0,sx*0.83,0.72,-0.35,0x2a2b2f);B(0.08,0.06,1.6,sx*0.81,0.86,-0.35,0x3a3b40);}
  const trim=mkG(P);const seats=mkG(S);
  // volante: aro, tres radios y buje (gira alrededor de su eje)
  // volante moderno (como el de un Ibiza o un Mégane): aro grueso de cuero, airbag central redondeado, tres radios con mandos y costura
  const ring=new THREE.TorusGeometry(0.185,0.024,10,40);ring.scale(1,1,1.15);const stitch=new THREE.TorusGeometry(0.185,0.0245,4,40,Math.PI*0.9);stitch.rotateZ(Math.PI*0.05);stitch.scale(1,1,0.4);
  const swHub=ell(0.075,0.062,0.032,0,-0.008,-0.03,16);const hubRim=new THREE.TorusGeometry(0.07,0.008,6,24);hubRim.scale(1.07,0.88,1);hubRim.translate(0,-0.008,-0.012);
  const spL=bx(0.11,0.035,0.022,-0.115,-0.012,-0.012),spR=bx(0.11,0.035,0.022,0.115,-0.012,-0.012),spB=bx(0.045,0.1,0.022,0,-0.12,-0.012);
  const pads=[];for(const sx of [-1,1])for(const [dx,dy] of [[0,0.012],[0.022,0.012],[0,-0.012],[0.022,-0.012]])pads.push([cy(0.006,0.006,0.006,sx*(0.105+dx),-0.012+dy,0.0,8,Math.PI/2),0x2a2a2c]);
  const sw=mkG([[ring,0x161617],[stitch,0x5a1a1a],[swHub,0x1b1b1d],[hubRim,0x8a8e92],[spL,0x202022],[spR,0x202022],[spB,0x202022],[bx(0.03,0.018,0.004,0,-0.0,0.024),0xb8bcc0],...pads,[bx(0.035,0.012,0.022,0,-0.165,-0.012),0x8a8e92]]);
  const col=mkG([[cy(0.035,0.045,0.16,0,0,0,12,Math.PI/2),0x18191b],[bx(0.11,0.07,0.1,0,0,0.05),0x1d1e20],[bx(0.09,0.012,0.012,-0.1,0.01,0.03),0x2a2a2c],[bx(0.09,0.012,0.012,0.1,0.01,0.03),0x2a2a2c]]);
  // rueda: neumático con perfil, llanta de radios
  const tire=new THREE.TorusGeometry(WR-0.07,0.075,8,22);tire.rotateY(Math.PI/2);tire.scale(1.35,1,1);
  const rim=[];for(let k=0;k<5;k++){const g=bx(0.03,0.18,0.04,0,0.1,0);g.rotateX(k*Math.PI*2/5);g.translate(0.09,0,0);rim.push([g,0xb5b9bd]);}
  const disc=new THREE.CylinderGeometry(0.205,0.205,0.04,18);disc.rotateZ(Math.PI/2);disc.translate(0.06,0,0);const hub=new THREE.CylinderGeometry(0.05,0.05,0.07,10);hub.rotateZ(Math.PI/2);hub.translate(0.1,0,0);
  const wheel=mkG([[tire,0x141414],[disc,0x2a2c2e],...rim,[hub,0xc8ccd0]]);
  return{body:geo,trim,sw,col,wheel,seats};})();
const seatMat=photoMat('fabric',{color:0x6a6e76,roughness:0.95,ns:0.7});
const trimMat=pbr(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.6,metalness:0.2}));const carGlassMat=pbr(new THREE.MeshStandardMaterial({color:0x1a2228,roughness:0.05,metalness:0.7,transparent:true,opacity:0.5,side:THREE.FrontSide,envMapIntensity:1.6,depthWrite:false}));
const carBlackMat=pbr(new THREE.MeshStandardMaterial({color:0x0d0e10,roughness:0.35,metalness:0.3,side:THREE.DoubleSide}));
// cuadro de instrumentos: velocímetro y cuentarrevoluciones
const texGauges=cTex(512,192,(g,w,h)=>{g.fillStyle='#07080a';g.fillRect(0,0,w,h);for(const [cx,mx,lab] of [[128,220,'km/h'],[384,8,'x1000']]){g.strokeStyle='#3a3d42';g.lineWidth=6;g.beginPath();g.arc(cx,100,82,0,7);g.stroke();
  g.fillStyle='#e8e8e8';g.font='bold 15px Arial';g.textAlign='center';g.textBaseline='middle';for(let k=0;k<=10;k++){const a=Math.PI*0.75+k/10*Math.PI*1.5;g.strokeStyle=k>7&&mx<20?'#d03030':'#d8d8d8';g.lineWidth=3;g.beginPath();g.moveTo(cx+Math.cos(a)*70,100+Math.sin(a)*70);g.lineTo(cx+Math.cos(a)*80,100+Math.sin(a)*80);g.stroke();
    if(k%2===0)g.fillText(String(Math.round(mx*k/10)),cx+Math.cos(a)*56,100+Math.sin(a)*56);}g.font='12px Arial';g.fillText(lab,cx,140);g.strokeStyle='#ff5a1a';g.lineWidth=4;g.beginPath();g.moveTo(cx,100);g.lineTo(cx+Math.cos(Math.PI*0.8)*62,100+Math.sin(Math.PI*0.8)*62);g.stroke();}},{});
const gaugeMat=new THREE.MeshBasicMaterial({map:texGauges});
const wheelMat=pbr(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.75,metalness:0.3}));const cars=[];
const CARCOL=[0xe9e9e6,0xe9e9e6,0xa9adb1,0xa9adb1,0x5d6266,0x111214,0x111214,0x1c2b4a,0x8c1218,0x2d3f2f,0xcfc6b0];
// carrocería: color de serie y años de abandono encima (polvo en las superficies de arriba, mugre, óxido abajo y en los bordes)
function wearMat(base,col,seed,wreck){const m=base.clone();m.color.set(col);m.roughness=0.5;m.metalness=0.25;m.envMapIntensity=0.9;
  m.onBeforeCompile=sh=>{sh.uniforms.uSeed={value:seed};sh.uniforms.uWr={value:wreck};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCP;varying vec3 vCN;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCP=position;vCN=normal;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vCP;varying vec3 vCN;uniform float uSeed,uWr;\n'+NOISE_GLSL)
      .replace('#include <map_fragment>',`#include <map_fragment>
        vec3 p=vCP*3.0+uSeed;float n1=zn(p*1.3),n2=zn(p*4.0+7.0),n3=zn(p*11.0);float l=dot(diffuseColor.rgb,vec3(0.3,0.59,0.11));
        float paint=step(0.5,l);// solo la chapa pintada (el texto blanco de la textura)
        vec3 c=diffuseColor.rgb;
        // mugre general y regueros
        c*=mix(1.0,0.72,smoothstep(0.4,0.8,n1*0.7+n3*0.3));
        // óxido: abajo, en pasos de rueda y manchas sueltas (mucho más en los siniestros)
        float rr=smoothstep(0.62-uWr*0.35,0.78-uWr*0.3,n2*0.6+n3*0.4+(0.55-vCP.y)*0.35*paint);
        c=mix(c,vec3(0.36,0.17,0.08)*(0.6+n3*0.6),rr*paint);
        // polvo y hojas en las superficies horizontales
        float up=smoothstep(0.55,0.9,vCN.y);c=mix(c,vec3(0.55,0.5,0.42),up*smoothstep(0.3,0.7,n1)*0.75);
        // quemado
        c=mix(c,vec3(0.05,0.045,0.04)*(0.6+n2),uWr>0.9?0.85:0.0);
        diffuseColor.rgb=c;`);};m.customProgramCacheKey=()=>'carwear';return m;}
// interior (salpicadero, relojes, asientos, consola, palanca) para el coche de la comunidad
const CARINT=(()=>{const P=[],S=[];const B=(w,h,d,x,y,z,c,rx=0,ry=0,rz=0)=>P.push([bx(w,h,d,x,y,z,rx,ry,rz),c]);const SB=(w,h,d,x,y,z,rx=0)=>S.push([bx(w,h,d,x,y,z,rx),0x55585e]);
  B(1.3,0.22,0.36,0,0.86,1.04,0x1c1d20,-0.25);B(1.28,0.06,0.28,0,0.98,0.93,0x26272a,-0.1);B(0.32,0.12,0.1,0.33,1.03,0.9,0x111214);B(0.22,0.15,0.03,0,0.97,0.9,0x101820,-0.4);
  B(0.22,0.3,0.55,0,0.46,0.45,0x1e1f22);B(0.12,0.012,0.14,0,0.62,0.4,0x0c0c0d);
  for(const sx of [0.32,-0.32]){SB(0.44,0.12,0.48,sx,0.48,0.12);SB(0.44,0.58,0.12,sx,0.8,-0.15,-0.18);SB(0.26,0.17,0.09,sx,1.15,-0.22,-0.18);}
  SB(1.22,0.13,0.45,0,0.5,-0.72);SB(1.22,0.5,0.11,0,0.78,-0.96,-0.2);
  // carrocería vista desde dentro: paneles de puerta, techo, pilares, piso y mampara trasera
  for(const sx of [1,-1]){B(0.04,0.5,1.75,sx*0.71,0.68,0.1,0x2a2b2f);B(0.06,0.06,1.7,sx*0.69,0.94,0.1,0x3a3b40);
    P.push([tube([sx*0.66,0.97,1.15],[sx*0.6,1.42,0.52],0.035,6),0x2c2d31],[tube([sx*0.66,0.95,-0.32],[sx*0.62,1.43,-0.3],0.05,6),0x2c2d31],[tube([sx*0.66,0.95,-1.0],[sx*0.58,1.42,-0.85],0.06,6),0x2c2d31]);}
  B(1.28,0.02,1.55,0,1.44,-0.2,0x8a8780);B(1.3,0.03,2.3,0,0.3,0.05,0x141416);B(1.3,0.5,0.03,0,0.55,1.18,0x141416);B(1.2,0.3,0.03,0,1.1,-1.15,0x2a2b2f);
  for(const x of [-0.12,0.12,-0.58,0.6])B(0.14,0.06,0.02,x,0.93,0.92,0x0c0c0d,-0.2);B(1.2,0.012,0.012,0,0.9,0.86,0x9a9ea2);
  for(const sx of [1,-1]){B(0.02,0.012,0.6,sx*0.69,0.82,0.15,0x9a9ea2);B(0.025,0.05,0.12,sx*0.69,0.86,0.35,0x2a2b2f);}
  P.push([ell(0.06,0.05,0.07,0,0.6,0.4,10),0x101011]);B(0.24,0.06,0.02,0,1.36,0.6,0x1a1a1b,0.3);
  return{trim:mkG(P),seats:mkG(S)};})();
const texScreen=cTex(256,320,(g,w,h)=>{g.fillStyle='#05070a';g.fillRect(0,0,w,h);g.fillStyle='#16324a';g.fillRect(10,10,w-20,60);g.fillStyle='#d8e4f0';g.font='bold 28px Arial';g.fillText('16:58',20,52);
  for(let i=0;i<4;i++){g.fillStyle=['#2a5a7a','#3a3a4a','#4a2a5a','#2a4a3a'][i];g.fillRect(14+(i%2)*120,90+Math.floor(i/2)*100,110,88);}g.fillStyle='#a02020';g.font='bold 18px Arial';g.fillText('SIN SEÑAL',70,300);},{});
const screenMat=new THREE.MeshBasicMaterial({map:texScreen,color:0x8a8a8a});
// matrículas españolas (4 cifras + 3 consonantes, banda azul de la UE con la «E»)
const PLATEN=32;const texPlates=cTex(2048,896,(g)=>{const L='BCDFGHJKLMNPRSTVWXYZ';for(let k=0;k<PLATEN;k++){const x=(k%4)*512,y=Math.floor(k/4)*112;
  g.fillStyle='#f6f6f2';g.fillRect(x+4,y+4,504,104);g.strokeStyle='#111';g.lineWidth=4;g.strokeRect(x+5,y+5,502,102);g.fillStyle='#003399';g.fillRect(x+6,y+6,56,100);
  g.fillStyle='#ffcc00';for(let i=0;i<12;i++){const a=i/12*6.283;g.beginPath();g.arc(x+34+Math.cos(a)*15,y+40+Math.sin(a)*15,2.6,0,7);g.fill();}g.fillStyle='#fff';g.font='bold 30px Arial,sans-serif';g.textAlign='center';g.fillText('E',x+34,y+96);
  const num=String(RI(0,9999)).padStart(4,'0'),let3=[0,1,2].map(()=>L[RI(0,L.length-1)]).join('');g.save();g.translate(x+290,y+58);g.scale(0.74,1);g.fillStyle='#111';g.font='bold 92px "DIN Condensed","Arial Narrow",Arial,sans-serif';g.textBaseline='middle';g.fillText(num+'  '+let3,0,4);g.restore();}},{});
const plateMat=new THREE.MeshLambertMaterial({map:texPlates,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
function plateGeo(k,front,back){const u0=(k%4)/4,v1=1-Math.floor(k/4)/8,v0=v1-1/8;const gs=[];for(const [z,ry] of [[front,0],[back,Math.PI]]){const g=new THREE.PlaneGeometry(0.52,0.11);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,u0+uv.getX(i)/4,v0+uv.getY(i)/8);g.rotateY(ry);g.translate(0,z[1],z[0]);gs.push(g);}return mergeGeometries(gs);}
const shiftKnobGeo=mkG([[cy(0.009,0.009,0.2,0,0.1,0,6),0x2a2a2a],[sp(0.032,0,0.21,0,10),0x111111]]);
// cristal sucio: polvo y mugre (más en los bordes), arañazos, motas y, en el parabrisas, los dos abanicos que dejan limpios los limpiaparabrisas; tiñe de sepia lo que se ve a través
function dirtyGlass(box,wipers){const m=new THREE.MeshStandardMaterial({color:0x7a6e5c,roughness:0.15,metalness:0.3,transparent:true,opacity:1,side:THREE.DoubleSide,depthWrite:false,envMapIntensity:1.4});
  const mn=box?box.min.clone():new V3(-1,-1,-1),mx=box?box.max.clone():new V3(1,1,1);
  m.onBeforeCompile=sh=>{sh.uniforms.uMn={value:mn};sh.uniforms.uMx={value:mx};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vGP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvGP=position;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vGP;uniform vec3 uMn,uMx;\n'+NOISE_GLSL)
      .replace('#include <map_fragment>',`
        vec3 q=(vGP-uMn)/max(uMx-uMn,vec3(1e-3));vec3 p=vGP*7.0;
        float dirt=zn(p*0.8)*0.55+zn(p*2.6)*0.3+zn(p*9.0)*0.15;
        float edge=1.0-smoothstep(0.0,0.18,min(min(q.x,1.0-q.x),min(q.y,1.0-q.y)+0.05));
        float d=clamp((dirt-0.35)*1.4+edge*0.6+(1.0-q.y)*0.15,0.0,1.0);
        ${wipers?`vec2 w=vec2(q.x,q.y*0.75);float a1=length(w-vec2(0.27,0.0)),a2=length(w-vec2(0.70,0.0));
        float clean=max(smoothstep(0.47,0.44,a1),smoothstep(0.47,0.44,a2))*step(0.06,q.y);float rim=max(smoothstep(0.02,0.0,abs(a1-0.455)),smoothstep(0.02,0.0,abs(a2-0.455)))*step(0.06,q.y);
        d=mix(d,d*0.25,clean)+rim*0.4;`:''}
        float sc=0.0;for(int i=0;i<3;i++){float an=float(i)*1.9+0.4;vec2 dir=vec2(cos(an),sin(an));float l=dot(vGP.xy+vGP.zz,dir)*60.0;float k=zn(vec3(floor(l),float(i),0.0)*3.1);sc+=step(0.93,k)*smoothstep(0.08,0.0,abs(fract(l)-0.5))*0.6;}
        float spk=step(0.82,zn(p*28.0));
        diffuseColor.rgb=mix(vec3(0.42,0.38,0.31),vec3(0.62,0.56,0.46),d)+sc*0.3;
        diffuseColor.a=clamp(0.16+d*0.5+sc*0.25+spk*0.18,0.0,0.85);`);};m.customProgramCacheKey=()=>'dglass'+(wipers?1:0);return pbr(m);}
let WS_MAT=null,WIN_MAT=null;
const WIPER_GEO=mkG([[bx(0.46,0.012,0.012,0.23,0.012,0.0),0x111111],[bx(0.42,0.004,0.02,0.24,0.02,0.0),0x0a0a0a],[cy(0.016,0.016,0.03,0,0.01,0,8),0x111111]]);
const MIRROR_GEO=new THREE.PlaneGeometry(0.13,0.085);const mirrorMat=pbr(new THREE.MeshStandardMaterial({color:0x8a9aa8,metalness:1,roughness:0.06,envMapIntensity:2}));
function makeCar(x,z,yaw,kind,o={}){const T=CARTPL;if(!T)return makeCarProc(x,z,yaw,kind);
  const g=new THREE.Group();const body=new THREE.Group();body.position.y=0.5;g.add(body);const wheels=[];const wreck=o.wreck||0;
  const inner=T.root.clone(true);inner.position.y=-0.5;body.add(inner);const taxi=!wreck&&Math.random()<0.12;const col=taxi?0x111214:wreck>0.9?0x222222:pick(CARCOL);
  let bodyMesh=null,winMesh=[];inner.traverse(q=>{if(!q.isMesh)return;if(q.name==='Car'){q.material=wearMat(q.material,col,Math.random()*50,wreck);q.material.side=THREE.FrontSide;bodyMesh=q;}else if(/Window|Windshield/.test(q.name)){if(!WS_MAT){WS_MAT=dirtyGlass(T.wsLocal,true);WIN_MAT=dirtyGlass(null,false);}q.material=q.name==='Windshield'?WS_MAT:WIN_MAT;q.renderOrder=3;winMesh.push(q);}else if(q.material.side!==THREE.FrontSide){q.material=q.material.clone();q.material.side=THREE.FrontSide;}});
  if(taxi){const tp=new THREE.Mesh(mkG([[bx(0.02,0.36,1.5,0.8,0.62,0.0),0xf2c400],[bx(0.02,0.36,1.5,-0.8,0.62,0.0),0xf2c400],[bx(0.36,0.11,0.14,0,1.52,0.1),0xf2f2f0],[bx(0.07,0.05,0.04,0.55,1.04,1.0),0x22c040]]),trimMat);tp.position.y=-0.5;body.add(tp);}
  {const pm=new THREE.Mesh(plateGeo(RI(0,PLATEN-1),[T.box.max.z+0.012,0.4-0.5],[T.box.min.z-0.012,0.62-0.5]),plateMat);body.add(pm);}
  if(T.ws){const W=T.ws;const by=W.min.y-0.5+0.02,bz=W.max.z-0.03;const dy=W.max.y-W.min.y,dz=W.max.z-W.min.z;const ang=Math.atan2(dy,dz);
    for(const px of [-0.4,0.06]){const g=new THREE.Group();g.position.set(px,by,bz);g.rotation.x=-ang;const arm=new THREE.Mesh(WIPER_GEO,carBlackMat);g.add(arm);g.rotation.z=0;body.add(g);}}
  if(T.mir){const M=T.mir;for(const sx of [-1,1]){const gm=new THREE.Mesh(MIRROR_GEO,mirrorMat);gm.position.set(sx*(M.max.x-0.07),(M.min.y+M.max.y)/2-0.5,M.min.z-0.005);gm.rotation.y=Math.PI;body.add(gm);}}
  if(wreck&&Math.random()<0.6)for(const w of winMesh)w.visible=false;// lunas reventadas
  // ruedas: cada una en su pivote
  for(const w of T.wheels){const src=inner.getObjectByName(w.name);if(!src)continue;const piv=new THREE.Group();piv.position.set(w.c.x,w.c.y,w.c.z);piv.rotation.order='YXZ';g.add(piv);piv.attach(src);
    if(wreck&&Math.random()<0.4){piv.rotation.z=R(-0.3,0.3);piv.position.y-=0.08;}wheels.push({node:piv,front:w.front});}
  const y=surfY(x,z);g.position.set(x,y,z);g.rotation.y=yaw;scene.add(g);
  const car={g,body,bodyMesh,sw:null,swp:null,x,z,y,yaw,speed:0,vLat:0,yr:0,steer:0,wheelRot:0,roll:0,rollV:0,pitch:0,pitchV:0,fuel:wreck?0:R(5,60),wheels,seat:new V3(0.32,0.3,0.12),eye:1.17,halfW:T.halfW,len:T.len,kind:'panda',searched:false,wreck,gear:0,shift:{gx:0,gz:0,held:null},wheelR:0.29};cars.push(car);return car;}
// el interior y el volante solo se montan cuando te subes (ahorra triángulos en los coches aparcados)
function carInterior(car){if(car.swp||!car.bodyMesh)return;const b=car.body;const tm=new THREE.Mesh(CARINT.trim,plasticMat),sm=new THREE.Mesh(CARINT.seats,seatMat);tm.position.y=sm.position.y=-0.5;b.add(tm,sm);
  const sc=new THREE.Mesh(new THREE.PlaneGeometry(0.16,0.2),screenMat);sc.position.set(0,1.02-0.5,0.86);sc.rotation.set(-0.25,Math.PI,0);b.add(sc);
  const gm=new THREE.Mesh(new THREE.PlaneGeometry(0.28,0.105),gaugeMat);gm.position.set(0.33,1.035-0.5,0.845);gm.rotation.set(0,Math.PI,0);b.add(gm);
  const swp=new THREE.Group();swp.position.set(0.33,0.9-0.5,0.6);swp.rotation.x=-0.38;const swm=new THREE.Mesh(CARGEO.sw,trimMat);swp.add(swm);const colm=new THREE.Mesh(CARGEO.col,trimMat);colm.position.z=0.1;swp.add(colm);b.add(swp);car.sw=swm;car.swp=swp;
  const kp=new THREE.Group();kp.position.set(0,0.62-0.5,0.4);const kn=new THREE.Mesh(shiftKnobGeo,trimMat);kp.add(kn);b.add(kp);car.knob=kp;
}
function makeCarProc(x,z,yaw,kind){const g=new THREE.Group();const body=new THREE.Group();body.position.y=0.5;g.add(body);const wheels=[];
  const taxi=Math.random()<0.15;const bodyM=pbr(new THREE.MeshStandardMaterial({color:taxi?0x0f1012:pick(CARCOL),metalness:0.45,roughness:0.32,envMapIntensity:1.3,side:THREE.DoubleSide}));
  const bm=new THREE.Mesh(CARGEO.body,[bodyM,carGlassMat,carBlackMat]);const tm=new THREE.Mesh(CARGEO.trim,plasticMat);const sm=new THREE.Mesh(CARGEO.seats,seatMat);bm.position.y=tm.position.y=sm.position.y=-0.5;body.add(bm,tm,sm);
  if(taxi){const tp=new THREE.Mesh(mkG([[bx(0.02,0.42,2.0,0.885,0.66,-0.4),0xf2c400],[bx(0.02,0.42,2.0,-0.885,0.66,-0.4),0xf2c400],[bx(0.42,0.12,0.16,0,1.52,-0.3),0xf2f2f0],[bx(0.08,0.06,0.05,0.62,1.0,0.75),0x22c040]]),trimMat);tp.position.y=-0.5;body.add(tp);}
  // volante del conductor (a la izquierda: +x); su eje apunta hacia el conductor
  const gm=new THREE.Mesh(new THREE.PlaneGeometry(0.3,0.112),gaugeMat);gm.position.set(0.38,1.045-0.5,0.462);gm.rotation.set(0,Math.PI,0);body.add(gm);
  const swp=new THREE.Group();swp.position.set(0.38,0.98-0.5,0.3);swp.rotation.x=-0.42;const swm=new THREE.Mesh(CARGEO.sw,trimMat);swp.add(swm);const colm=new THREE.Mesh(CARGEO.col,trimMat);colm.position.z=0.13;swp.add(colm);body.add(swp);
  for(const [wx,wz] of [[0.76,WB],[-0.76,WB],[0.76,-WB],[-0.76,-WB]]){const piv=new THREE.Group();piv.position.set(wx,WR,wz);piv.rotation.order='YXZ';const wm=new THREE.Mesh(CARGEO.wheel,wheelMat);if(wx<0)wm.scale.x=-1;piv.add(wm);g.add(piv);wheels.push({node:piv,front:wz>0});}
  const y=surfY(x,z);g.position.set(x,y,z);g.rotation.y=yaw;scene.add(g);
  const car={g,body,sw:swm,swp,x,z,y,yaw,speed:0,vLat:0,yr:0,steer:0,wheelRot:0,roll:0,rollV:0,pitch:0,pitchV:0,fuel:R(5,60),wheels,seat:new V3(0.38,0.3,-0.22),eye:1.13,halfW:0.92,len:4.3,kind,searched:false};cars.push(car);return car;}
const _eu2=new THREE.Euler();
// moto como vehículo: carrocería del mismo modelo que la aparcada, se inclina en las curvas
function makeMoto(m){const g=new THREE.Group();const body=new THREE.Group();g.add(body);const mat=(INST[m.model].mat||paintMat).clone();mat.color.set(m.col);const me=new THREE.Mesh(INST[m.model].geo,mat);body.add(me);
  g.position.set(m.x,m.y,m.z);g.rotation.y=m.yaw;scene.add(g);const c={g,body,sw:null,swp:null,x:m.x,z:m.z,y:m.y,yaw:m.yaw,speed:0,vLat:0,yr:0,steer:0,wheelRot:0,roll:0,rollV:0,pitch:0,pitchV:0,fuel:R(15,60),wheels:[],
    seat:new V3(0,0,-0.18),eye:1.42,halfW:0.35,len:1.9,kind:'moto',searched:true,wreck:0,gear:1,shift:{gx:0,gz:0,held:null},wheelR:0.27,auto:true};cars.push(c);return c;}
function steerMoto(car){if(!inVR)return null;const gl=gripBySide.left,gr=gripBySide.right;if(!gl||!gr||!IN.lgHeld||!IN.rgHeld)return null;gl.getWorldPosition(_v);gr.getWorldPosition(_v1);
  const dx=_v1.x-_v.x,dz=_v1.z-_v.z;const a=Math.atan2(dz,dx);const rel=Math.atan2(Math.sin(a+car.yaw),Math.cos(a+car.yaw));return clamp(-rel*3.2,-2.4,2.4);}
function placeCars(){const spots=CARSPOTS.slice();for(let i=spots.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[spots[i],spots[j]]=[spots[j],spots[i]];}
  spots.sort((a,b)=>(b.crash?1:0)-(a.crash?1:0));let n=0;for(const s of spots){if(n>=70)break;if(cars.some(c=>Math.hypot(c.x-s.x,c.z-s.z)<5.2))continue;const c=makeCar(s.x,s.z,s.yaw,'proc');if(s.crash){c.crashed=true;c.fuel=0;}n++;}
  const b=BASES.find(x=>x.type==='good');if(b)makeCar(b.x+8,b.z-30,Math.PI/2,'proc').fuel=55;}
// coches abandonados y siniestrados en mitad de la calzada (algunos volcados o quemados)
function placeWrecks(){let n=0;for(let tries=0;tries<120&&n<26;tries++){const v=Math.random()<0.5;const L=v?VSTR:HSTR;const st=pick(L);if(st.type==='ped'||st.type==='superilla')continue;const k=RI(0,(v?NZS:NXS)-2);
    const a0=(v?HSTR[k]:VSTR[k]).pos+14,a1=(v?HSTR[k+1]:VSTR[k+1]).pos-14;const along=R(a0,a1);const lat=R(-1,1)*(st.w/2-st.sw-1.6);const x=v?st.pos+lat:along,z=v?along:st.pos+lat;
    if(cars.some(c=>Math.hypot(c.x-x,c.z-z)<5))continue;const wreck=Math.random()<0.35?1:R(0.5,0.85);const c=makeCar(x,z,R(0,6.28),'proc',{wreck});if(!c)continue;
    const r=Math.random();c.flip=r<0.1?Math.PI:r<0.22?Math.PI/2*(Math.random()<0.5?1:-1):0;if(c.flip){c.g.rotation.z=c.flip;c.g.position.y+=Math.abs(c.flip)>3?1.5:c.halfW;c.y=c.g.position.y;c.fixedY=true;}
    solidBox(x,z,c.halfW,c.len/2,c.yaw,c.y-0.2,c.y+1.5);n++;}}
// cadáveres de atrezo repartidos por las calles (caen con física, luego se quedan quietos; se pueden registrar)
function placeCorpses(){let n=0;for(let tries=0;tries<300&&n<32;tries++){const bk=pick(BLOCKS);if(bk.outer)continue;const e=RI(0,7);const A=bk.cp[e],B=bk.cp[(e+1)%8];const t=Math.random();const c=centroid(bk.bp);
    let x=A[0]+(B[0]-A[0])*t,z=A[1]+(B[1]-A[1])*t;const dx=x-c[0],dz=z-c[1],l=Math.hypot(dx,dz);const off=R(-2.5,3.5);x+=dx/l*off;z+=dz/l*off;
    const h=spawnChar('wanderer',x,z,{armed:false});if(!h)continue;h.corpse=true;h.yaw=R(0,6.28);enterPhys(h);die(h,'x');for(let i=0;i<NP;i++){h.prev[i].x-=R(-1,1)*0.02;h.prev[i].z-=R(-1,1)*0.02;}n++;}}
// volante: se agarra con el grip (una o dos manos) y se gira de verdad; si no, el joystick. La mano se queda pegada al aro mientras lo agarras
const swGrab={left:null,right:null};const _swl=new V3();
function steerByHands(car){if(!inVR||!car.swp)return null;let sum=0,n=0;car.swp.updateMatrixWorld(true);
  for(const side of ['left','right']){const g=gripBySide[side];const held=side==='left'?IN.lgHeld:IN.rgHeld;if(!g||!held||(side==='right'&&car.shift.held)){swGrab[side]=null;continue;}
    g.updateMatrixWorld(true);g.getWorldPosition(_swl);car.swp.worldToLocal(_swl);const r=Math.hypot(_swl.x,_swl.y);const ang=Math.atan2(_swl.y,_swl.x);
    if(!swGrab[side]){if(Math.abs(r-0.185)<0.12&&Math.abs(_swl.z)<0.15){swGrab[side]={a:ang,w:car.wheelRot,loc:ang-car.wheelRot};haptic(side==='left'?srcL:srcR,0.4,30);}else continue;}
    let d=ang-swGrab[side].a;d=Math.atan2(Math.sin(d),Math.cos(d));sum+=swGrab[side].w+d;swGrab[side].w+=d;swGrab[side].a=ang;n++;}
  return n?sum/n:null;}
// mano pegada al volante o a la palanca: se mueve el mando virtual hasta el punto agarrado
function snapHandTo(side,world){const g=gripBySide[side];if(!g)return;rig.getWorldQuaternion(_q).invert();g.getWorldPosition(_v);_v1.subVectors(world,_v).applyQuaternion(_q);const e=g.matrix.elements;e[12]+=_v1.x;e[13]+=_v1.y;e[14]+=_v1.z;g.position.set(e[12],e[13],e[14]);g.updateMatrixWorld(true);}
function handsOnControls(car){if(!car.swp)return;for(const side of ['left','right']){const G=swGrab[side];if(G){const a=car.wheelRot+G.loc;_v.set(Math.cos(a)*0.185,Math.sin(a)*0.185,0);car.swp.localToWorld(_v);snapHandTo(side,_v.clone());}}
  if(car.shift.held&&car.knob){car.knob.updateMatrixWorld(true);_v.set(0,0.21,0);car.knob.children[0].localToWorld(_v);snapHandTo('right',_v.clone());}}
// cambio manual en H con la palanca (grip derecho): 1 izquierda-arriba, 2 izquierda-abajo, 3 centro-arriba, 4 centro-abajo, 5 derecha-arriba, R derecha-abajo
const GEARS=[{v:0,a:0},{v:13,a:6.2},{v:22,a:4.4},{v:32,a:3.2},{v:41,a:2.4},{v:50,a:1.8}];const GEARNAME=['N','1','2','3','4','5','R'];
function shiftByHand(car){const S=car.shift;if(!inVR||!car.knob){return;}const g=gripBySide.right;if(!g)return;g.updateMatrixWorld(true);const hp=g.getWorldPosition(_v2);
  car.knob.parent.updateMatrixWorld(true);_v3.copy(hp);car.knob.parent.worldToLocal(_v3);const bx0=car.knob.userData.base||(car.knob.userData.base=car.knob.position.clone());
  if(!S.held){if(IN.rgHeld&&!swGrab.right&&Math.hypot(_v3.x-bx0.x-S.gx*0.06,_v3.y-(bx0.y+0.2),_v3.z-bx0.z+S.gz*0.07)<0.13&&!S.wasHeld){S.held=true;haptic(srcR,0.3,25);}S.wasHeld=IN.rgHeld;}
  if(S.held&&!IN.rgHeld){S.held=false;S.wasHeld=false;}
  if(S.held){// la mano a la izquierda del conductor es +x en el coche
    const tx=clamp((_v3.x-bx0.x)/0.06,-1,1),tz=clamp(-(_v3.z-bx0.z)/0.07,-1,1);const cols=[1,0,-1];
    if(Math.abs(S.gz)<0.25){S.gx+=(tx-S.gx)*0.5;S.gz+=(tz-S.gz)*0.5;const col=cols.reduce((a,c)=>Math.abs(c-S.gx)<Math.abs(a-S.gx)?c:a,0);if(Math.abs(S.gz)>0.15)S.gx=col;}
    else{const col=cols.reduce((a,c)=>Math.abs(c-S.gx)<Math.abs(a-S.gx)?c:a,0);S.gx=col;S.gz+=(tz-S.gz)*0.5;}
    S.gz=clamp(S.gz,-1,1);}
  else if(Math.abs(S.gz)<0.8)S.gz*=0.8;
  car.knob.position.set(bx0.x+S.gx*0.06,bx0.y,bx0.z-S.gz*0.07);car.knob.rotation.set(-S.gz*0.3,0,-S.gx*0.25);
  let gear=0;if(Math.abs(S.gz)>0.75){const up=S.gz>0;gear=S.gx>0.5?(up?1:2):S.gx<-0.5?(up?5:6):(up?3:4);}
  if(gear!==car.gear){if(gear&&car.gear===0){sfx('click');haptic(srcR,0.5,40);}if(gear)toast('Marcha '+GEARNAME[gear],0.8);car.gear=gear;}}
function driveCar(car,dt){if(!car.swp&&car.kind!=='moto')carInterior(car);let thr=IN.gas;const brk=IN.brake;if(car.fuel<=0||car.wreck){thr=0;if(Math.random()<0.004)toast(car.wreck?'Este coche está destrozado':'Sin gasolina');}
  if(P.carGun){thr=0;}
  shiftByHand(car);
  // sin gafas: cambio automático
  if(!inVR||car.auto){if(thr>0.05)car.gear=car.speed<GEARS[1].v*0.85?1:car.speed<GEARS[2].v*0.85?2:car.speed<GEARS[3].v*0.85?3:car.speed<GEARS[4].v*0.85?4:5;if(brk>0.05&&car.speed<0.3)car.gear=6;}
  const v=car.speed;const G=car.gear===6?{v:-7,a:3.5}:GEARS[car.gear]||GEARS[0];
  if(thr>0.05&&car.gear){if(car.gear===6){if(v>-7)car.speed-=thr*3.5*dt;}else{const lug=clamp(v/(G.v*0.3),0.25,1);if(v<G.v)car.speed+=thr*G.a*lug*dt;}}
  if(car.gear&&car.gear!==6&&v>G.v)car.speed-=(v-G.v)*0.8*dt;// freno motor por encima del régimen
  if(brk>0.05){if(Math.abs(car.speed)>0.3)car.speed-=Math.sign(car.speed)*brk*16*dt;else if(!inVR&&car.gear===6)car.speed-=brk*3.5*dt;else car.speed=0;}
  car.speed-=car.speed*0.06*dt;if(thr<0.05&&brk<0.05)car.speed-=Math.sign(car.speed)*Math.min(Math.abs(car.speed),0.8*dt);car.speed=clamp(car.speed,-7,50);
  const LOCK=2.4;const hw=car.kind==='moto'?steerMoto(car):steerByHands(car);if(hw!==null)car.wheelRot=clamp(hw,-LOCK,LOCK);else car.wheelRot+=(-IN.steer*LOCK-car.wheelRot)*Math.min(1,dt*6);
  car.steer=-car.wheelRot/LOCK*0.58;moveCar(car,dt,true);handsOnControls(car);car.fuel=Math.max(0,car.fuel-Math.abs(car.speed)*dt*0.012);
  if(engine){const rpm=car.gear&&car.gear!==6?clamp(Math.abs(car.speed)/GEARS[car.gear].v,0.15,1.1):clamp(thr,0.12,1);engine.o.frequency.value=34+rpm*95;engine.g.gain.value=0.05+Math.min(0.06,thr*0.06);}
  if(nightF>0.3){const s=Math.sin(car.yaw),c=Math.cos(car.yaw);headlight.position.set(car.x+s*2.3,car.y+0.9,car.z+c*2.3);hlT.position.set(car.x+s*20,car.y,car.z+c*20);headlight.intensity=45;}else headlight.intensity=0;}
// física: modelo de bicicleta con agarre limitado (si te pasas de velocidad en una curva cerrada, derrapa) y carrocería con balanceo y cabeceo sobre muelles
function moveCar(car,dt,player){const vs=car.speed;const grip=9;const yl=grip*1.12/Math.max(Math.abs(car.speed),1);const yrT=clamp(car.speed*Math.tan(car.steer)/(WB*2),-yl,yl);
  car.yr+=(yrT-car.yr)*Math.min(1,dt*(Math.abs(car.vLat)>1.5?2.5:7));
  // al girar, la velocidad se queda «atrás» en el sistema del coche (aparece velocidad lateral) y las ruedas la frenan hasta su límite de agarre
  const dLat=-car.speed*car.yr*dt;let vl=car.vLat+dLat;const cap=grip*(Math.abs(vl)>2?0.75:1)*dt;vl-=clamp(vl,-cap,cap);
  // al derrapar la cola se va un poco más y se pierde velocidad
  car.yr+=-vl*0.06*dt*Math.sign(car.speed||1);car.speed-=Math.sign(car.speed)*Math.min(Math.abs(car.speed),Math.abs(vl)*0.6*dt);car.vLat=vl*Math.pow(0.6,dt);
  const latA=car.speed*car.yr,lonA=(car.speed-vs)/Math.max(dt,1e-3);
  // balanceo realista: ~3° a 0,8 g, amortiguado casi crítico (coche con peso: no se levanta al girar)
  const moto=car.kind==='moto';car.latS=(car.latS||0)+(latA-(car.latS||0))*Math.min(1,dt*4);car.lonS=(car.lonS||0)+(lonA-(car.lonS||0))*Math.min(1,dt*3);
  const rT=moto?clamp(latA*0.09,-0.75,0.75):clamp(-car.latS*0.0055,-0.055,0.055);const kR=moto?55:38,cR=moto?7:2*Math.sqrt(38)*0.95;car.rollV+=((rT-car.roll)*kR-car.rollV*cR)*dt;car.roll+=car.rollV*dt;if(!moto)car.roll=clamp(car.roll,-0.07,0.07);
  car.pitchV+=((clamp(car.lonS*0.0035,-0.035,0.035)-car.pitch)*42-car.pitchV*12.5)*dt;car.pitch+=car.pitchV*dt;car.pitch=clamp(car.pitch,-0.05,0.05);
  car.yaw+=car.yr*dt;const s=Math.sin(car.yaw),c=Math.cos(car.yaw);const vx=s*car.speed+c*car.vLat,vz=c*car.speed-s*car.vLat;const nx=car.x+vx*dt,nz=car.z+vz*dt;let blocked=false;
  for(const off of [-1.5,0,1.5]){const pt={x:nx+s*off,z:nz+c*off};if(collide(pt,car.halfW+0.05,car.y+0.4,car.y+1.3)){blocked=true;break;}}
  for(const o of cars){if(o===car)continue;const dn=Math.hypot(o.x-nx,o.z-nz);if(dn<3.4&&dn<Math.hypot(o.x-car.x,o.z-car.z)){blocked=true;o.speed+=vs*0.35;o.vLat+=car.vLat*0.3;}}
  if(blocked){const hit=Math.hypot(vs,car.vLat);if(hit>7&&player){sfx('crash',clamp(hit/20,0.3,1));damagePlayer(hit*0.8,'accidente');toast('¡Choque!');}car.speed=-vs*0.25;car.vLat*=-0.2;car.yr*=0.3;car.rollV+=clamp(car.vLat*0.04,-0.15,0.15);car.pitchV-=clamp(vs*0.012,-0.25,0.25);}else{car.x=nx;car.z=nz;}
  if(!car.fixedY)car.y+=(surfY(car.x,car.z)-car.y)*Math.min(1,dt*8);
  if(Math.abs(car.speed)>2.2)for(const h of H_){if(!h.active)continue;const hx=h.sim[PELVIS].x,hz=h.sim[PELVIS].z;const dx=hx-car.x,dz=hz-car.z;if(dx*dx+dz*dz>9)continue;
    const lx=dx*c-dz*s,lz=dx*s+dz*c;if(Math.abs(lx)<car.halfW+0.2&&Math.abs(lz)<car.len/2+0.1&&clockT-h.lastHitT>0.4){const sp=Math.abs(car.speed);
      _imp.set(s*car.speed,0,c*car.speed).multiplyScalar(1.15);_imp.y=1+sp*0.12;_e2.copy(h.sim[LKNEE]);hitChar(h,'body',sp*5,_imp,LKNEE,player?'player':'car',_e2,_v.set(s,0,c));applyImp(h,_imp.set(s*car.speed*0.9,1+sp*0.1,c*car.speed*0.9),RKNEE);applyImp(h,_imp.set(s*car.speed*0.25,sp*0.18,c*car.speed*0.25),CHEST);h.k=0;
      if(!h.dead){h.headHp-=sp*1.5;if(h.headHp<=0)die(h,player?'player':'car');}h.lastHitT=clockT;sfx('hit',volAt(hx,hz,50));spray(h.sim[CHEST],_v.set(s,0,c),10);car.speed*=0.9;}}
  car.g.position.set(car.x,car.y,car.z);car.g.rotation.y=car.yaw;if(car.body){const bd=car.body;if(bd.userData.p0===undefined)bd.userData.p0=bd.position.clone();const hp=car.kind==='moto'?0:0.55;bd.rotation.set(-car.pitch,0,car.roll);bd.position.set(bd.userData.p0.x+hp*Math.sin(car.roll),bd.userData.p0.y+hp*(2-Math.cos(car.roll)-Math.cos(car.pitch)),bd.userData.p0.z+hp*Math.sin(car.pitch));if(car.sw)car.sw.rotation.z=car.wheelRot;}if(car.wreck)car.g.rotation.z=car.flip||0;
  for(const w of car.wheels){w.node.rotation.x+=car.speed*dt/(car.wheelR||WR);if(w.front)w.node.rotation.y=car.steer;}}

// =====================================================================
// NECESIDADES
// =====================================================================
function updateNeeds(hrs){P.food=Math.max(0,P.food-4.2*S.hunger*hrs);P.water=Math.max(0,P.water-6*S.thirst*hrs);P.bladder=Math.min(100,P.bladder+11*S.physio*hrs);P.bowels=Math.min(100,P.bowels+4.2*S.physio*hrs);
  if(P.sleeping)P.energy=Math.min(100,P.energy+(P.bedSleep?16:11)*hrs);else P.energy=Math.max(0,P.energy-(P.sprinting?14:5)*S.fatigue*hrs);
  if(P.food<=0)P.hp-=5*hrs;if(P.water<=0)P.hp-=8*hrs;if(P.food>45&&P.water>45&&P.sick<20&&!(P.infected&&P.infT>24)&&P.hp<100)P.hp=Math.min(100,P.hp+(P.sleeping?4:1.5)*hrs);
  if(P.sick>0){P.hp-=P.sick*0.05*hrs;P.mood=Math.max(0,P.mood-2*hrs);P.sick=Math.max(0,P.sick-6*hrs);P.vomitT-=hrs;if(P.sick>40&&P.vomitT<=0){P.vomitT=R(1,2.5);P.food=Math.max(0,P.food-15);P.water=Math.max(0,P.water-15);sfx('vomit');toast('Vomitas…');}}
  if(P.infected){P.infT+=hrs;if(P.infT>6&&P.infT-hrs<=6)toast('Te sientes febril…',4);if(P.infT>24)P.hp-=2*hrs;if(P.infT>48)P.hp-=6*hrs;}
  const sad=(P.food<20)+(P.water<20)+(P.energy<20)+(P.hp<30);P.mood=clamp(P.mood+(sad?-3*sad:0.8)*hrs,0,100);
  if(P.bladder>=100){P.bladder=0;P.mood=Math.max(0,P.mood-18);toast('Te has meado encima… Ánimo -18');}if(P.bowels>=100){P.bowels=0;P.mood=Math.max(0,P.mood-30);toast('Te has cagado encima. Qué asco. Ánimo -30');}
  if(P.hp<=0&&P.alive){P.hp=0.01;damagePlayer(1,P.infected&&P.infT>24?'infección':'hambre, sed o enfermedad');}
  P.accT-=hrs;if(P.accT<=0){P.accT=2;if(P.bladder>80)toast('Necesitas mear urgentemente');else if(P.bowels>80)toast('Necesitas cagar (busca un baño)');else if(P.food<15)toast('Te mueres de hambre');else if(P.water<15)toast('Te mueres de sed');else if(P.energy<12)toast('Estás agotado. Necesitas dormir');}}

// =====================================================================
// CIELO
// =====================================================================
const cNight=new THREE.Color(0x0e131c),cDay=new THREE.Color(0xa9bdd0),cDusk=new THREE.Color(0xd49a72),cFog=new THREE.Color(),_sunDir=new V3();
const cHaze=new THREE.Color(0.66,0.6,0.5),cHazeN=new THREE.Color(0.045,0.05,0.058),_cHz=new THREE.Color();
// nubes con volumen aparente: cúpula alrededor de la cámara que proyecta cada dirección sobre una capa a 600 m y la rellena con ruido fractal que avanza con el viento
const CU={uTime:{value:0},uSun:{value:new V3(0,1,0)},uDay:{value:1},uCov:{value:0.6},uFog:{value:new THREE.Color()}};
const clouds=new THREE.Mesh(new THREE.SphereGeometry(1,32,12,0,Math.PI*2,0,Math.PI*0.5),new THREE.ShaderMaterial({uniforms:CU,transparent:true,depthWrite:false,side:THREE.BackSide,fog:false,
  vertexShader:`varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`varying vec3 vD;uniform float uTime,uDay,uCov;uniform vec3 uSun,uFog;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*n(p);p=mat2(1.6,1.2,-1.2,1.6)*p+vec2(1.7,9.2);a*=0.5;}return v;}
    float dens(vec2 p){vec2 q=vec2(fbm(p*0.7+uTime*0.002),fbm(p*0.7+vec2(5.2,1.3)));float c=fbm(p*1.3+q*1.4);return smoothstep(1.0-uCov,1.0-uCov+0.32,c);}
    void main(){vec3 d=normalize(vD);if(d.y<0.0)discard;float hy=max(d.y,0.03);vec2 p=d.xz/hy*0.75+vec2(uTime*0.005,uTime*0.002);
      float c=dens(p);if(c<0.005)discard;
      // luz: cuánto se aclara la nube hacia el sol (bordes plateados) y transluciencia cerca del sol
      vec2 sd=normalize(uSun.xz+1e-4)*0.06;float cs=dens(p+sd);float edge=clamp((c-cs)*3.0+0.35,0.0,1.0);
      float toSun=max(dot(d,normalize(uSun)),0.0);float glow=pow(toSun,6.0)*(1.0-c*0.6)+pow(toSun,40.0)*1.5;
      float lowSun=1.0-smoothstep(0.0,0.45,uSun.y);
      vec3 under=mix(vec3(0.05,0.05,0.07),vec3(0.24,0.24,0.27),uDay);
      vec3 lit=mix(vec3(0.75,0.74,0.72),vec3(1.0,0.66,0.38),lowSun)*mix(0.25,1.25,uDay);
      vec3 col=mix(under,lit,edge*edge)+vec3(1.0,0.62,0.3)*glow*uDay*(0.6+lowSun);
      col*=1.0-c*0.35;
      float hor=smoothstep(0.0,0.22,d.y);col=mix(uFog*mix(1.0,1.3,glow),col,hor);
      gl_FragColor=vec4(col,clamp(c*1.15,0.0,1.0)*mix(0.75,1.0,hor));}`}));
clouds.renderOrder=-1;clouds.frustumCulled=false;scene.add(clouds);
function updateSky(){const h=hourF();const ang=(h-6)/24*Math.PI*2;const sy=Math.sin(ang),sx=Math.cos(ang);const day=THREE.MathUtils.smoothstep(sy,-0.1,0.2);nightF=1-day;
  _sunDir.set(sx*0.9,sy,0.35).normalize();su.sunPosition.value.copy(_sunDir);su.rayleigh.value=0.5+day*0.9;su.turbidity.value=9+(1-day)*4;su.mieCoefficient.value=0.012+(S.haze||0)*0.004;su.mieDirectionalG.value=0.88;
  sky.position.copy(camW);stars.position.copy(camW);starMat.uniforms.opacity.value=clamp(nightF*1.3-0.3,0,1)*(1-0.6*clamp(((S.clouds??2)-1)*0.6+(S.haze||0)*0.1,0,0.9));starMat.uniforms.uT.value=clockT;starMat.uniforms.uPx.value=inVR?1.6:1;
  {const fr=Math.min(1100,camera.far*0.8);stars.scale.setScalar(fr);moon.position.copy(camW).addScaledVector(_v4.set(-_sunDir.x,Math.max(0.25,-_sunDir.y),-_sunDir.z).normalize(),fr*0.95);moon.scale.setScalar(fr*0.16);moon.material.opacity=clamp(nightF*1.4-0.2,0,1);}
  sun.position.copy(rig.position).addScaledVector(_sunDir,150);sun.target.position.copy(rig.position);sun.intensity=day*2.3;sun.color.setRGB(1,0.8+0.2*day,0.62+0.38*day);
  hemi.intensity=0.08+day*0.9;cFog.copy(cNight).lerp(cDay,day);cFog.lerp(cDusk,clamp(1-Math.abs(sy)/0.28,0,1)*0.5);{const hz=S.haze||0;_cHz.copy(cHazeN).lerp(cHaze,day);cFog.lerp(_cHz,[0,0.35,0.55,0.75,0.85][hz]);scene.fog.color.copy(cFog);const vf=S.view||6000;const hf=[6000,420,200,110,70][hz];const far=Math.min(vf,Math.max(hz?28:900,hf*(0.28+day*0.72)),vf);scene.fog.far=far;scene.fog.near=far*(hz?0.05:0.3);
    const cf=(S.view||3000)+60;if(Math.abs(camera.far-cf)>1){camera.far=cf;camera.updateProjectionMatrix();}sky.scale.setScalar(Math.min(1200,cf*0.85));
    clouds.position.copy(camW);clouds.scale.setScalar(Math.min(900,cf*0.8));CU.uTime.value=clockT;CU.uSun.value.copy(_sunDir);CU.uDay.value=day;CU.uCov.value=[0,0.45,0.8][S.clouds??2]+hz*0.03;CU.uFog.value.copy(cFog);clouds.visible=(S.clouds??2)>0;}
  renderer.toneMappingExposure=(0.72+day*0.2)*(S.filter===1?1.08:1)+10*(S.filter||0);winMat.emissiveIntensity=nightF*1.0;if(SIGN_MAT)SIGN_MAT.emissiveIntensity=0.05+nightF*0.35;for(const m of PBR)m.envMapIntensity=0.1+0.9*day;
  flashlight.intensity=P.light&&!inVR?32:0;vrFlash.intensity=P.light&&inVR?32:0;windU.value=clockT;}

// =====================================================================
// BUCLE PRINCIPAL
// =====================================================================
let started=false,inVR=false,clockT=0,last=performance.now()/1000,hudT=0,promptT=0,frameNo=0,chunkT=0;
const frustum=new THREE.Frustum(),_pm=new M4(),_sph=new THREE.Sphere();
function updateChars(dt,p){camera.updateMatrixWorld();_pm.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(_pm);
  for(const h of H_){if(!h.active)continue;const kin=h.mode==='kin'&&!h.dead;const hx=kin?h.x:h.sim[PELVIS].x,hz=kin?h.z:h.sim[PELVIS].z;const d=Math.hypot(hx-p.x,hz-p.z);
    for(let i=0;i<NP;i++)if(h.kl[i]<1)h.kl[i]=Math.min(1,h.kl[i]+dt*1.8);
    if(h.dead){h.deadT+=dt;if(h.sleep<1){const mv=physStep(h,dt);h.sleep=mv<0.003?h.sleep+dt:0;driveBones(h);}
      if(h.reanimate&&h.deadT>12){h.reanimate=false;h.type='zombie';h.dead=false;h.headHp=80;h.bodyHp=140;h.base=null;h.role=null;h.armed=false;h.k=0;h.down=0.01;h.gp=Object.assign(h.gp,{lean:R(0.15,0.35),droop:R(0.2,0.5),arms:'forward',limp:R(-0.6,0.6),twitch:0.7,speedMul:R(0.8,1.1)});
        for(const m of h.meshes)m.material=charMat(m.userData.base,'zombie',0,1/h.tpl.height);if(d<40)toast(`${h.name} se levanta convertido en zombi…`);}
      else if(h.deadT>90&&d>25)despawn(h);
      _m.compose(_p.set(hx,surfY(hx,hz,h.sim[PELVIS].y)+0.02,hz),_q.identity(),_s.set(1.3,1,1.3));blobs.setMatrixAt(h.slot,_m);continue;}
    if(d>140&&h.mode==='kin'){h.holder.visible=false;if(h.prop)h.prop.visible=false;blobs.setMatrixAt(h.slot,ZM);if(h.target==='player'&&h.type==='zombie'&&frameNo%4===0)moveH(h,p.x-h.x,p.z-h.z,h.runner?3.7:1,dt*4);continue;}
    h.holder.visible=true;if(h.prop)h.prop.visible=h.armed;if(h.atkAnim>0)h.atkAnim-=dt;
    if(h.type==='zombie')zombieAI(h,dt,p);else survivorAI(h,dt,p);
    _sph.center.set(h.x,h.y+1,h.z);_sph.radius=2.2;const vis=(frustum.intersectsSphere(_sph)&&d<(inVR?75:110))||h.mode==='phys';const lodN=d>60?4:d>30?2:1;h.holder.visible=vis||d<3;if(h.prop)h.prop.visible=h.armed&&h.holder.visible;
    h.lodAcc=(h.lodAcc||0)+dt;
    if(h.mode==='phys'){if(h.act==='getup'){h.getup+=dt/(h.type==='zombie'?R(2.6,3.4):2.2);h.k=Math.min(0.9,0.25+h.getup*0.8);if(h.getup>=1){h.act='stand';h.getup=-1;}}
      poseTargets(h,dt);if(h.brace>0){h.brace-=dt;braceTargets(h);}
      if(h.crawler){h.k=0.35;h.down=1e9;}else if(h.down>0){h.down-=dt;h.k=0;if(h.down<=0)startGetUp(h);}
      else if(h.act!=='getup'){h.k=Math.min(1,h.k+dt*1.4);const tp=h.tgt[PELVIS],spp=h.sim[PELVIS];h.x+=(spp.x-tp.x)*Math.min(1,dt*3);h.z+=(spp.z-tp.z)*Math.min(1,dt*3);
        if(h.k>=1&&!h.permPhys){let err=0,klm=1;for(let i=0;i<NP;i++){err+=h.sim[i].distanceTo(h.tgt[i]);klm=Math.min(klm,h.kl[i]);}if(err/NP<0.05&&klm>0.98)h.mode='kin';}}
      physStep(h,dt);driveBones(h);}
    else if(vis&&(frameNo+h.slot)%lodN===0){poseTargets(h,h.lodAcc);h.lodAcc=0;for(let i=0;i<NP;i++)h.sim[i].copy(h.tgt[i]);driveBones(h);}
    else if(!vis){h.lodAcc=Math.min(h.lodAcc,0.2);h.holder.position.set(h.x,h.y,h.z);}
    _m.compose(_p.set(hx,h.y+0.02,hz),_q.identity(),_s.set(0.9,1,0.9));blobs.setMatrixAt(h.slot,_m);
    if(h.mode==='kin'&&d<40&&frameNo%2===0)for(const o of H_){if(o===h||!o.active||o.dead||o.mode!=='kin')continue;const ex=h.x-o.x,ez=h.z-o.z,dd=ex*ex+ez*ez;if(dd<0.3&&dd>1e-6){const l=Math.sqrt(dd);h.x+=ex/l*(0.55-l)*0.5;h.z+=ez/l*(0.55-l)*0.5;}}
    if(h.type==='zombie'&&d<14&&h.speed>0.3){h.stepT-=dt*h.speed;if(h.stepT<=0){h.stepT=0.7;sfx('step',volAt(h.x,h.z,14));}}}
  blobs.instanceMatrix.needsUpdate=true;}
function updateWeapons(dt){const vrOn=inVR&&!!gripBySide.right;
  vrBat.visible=P.weapon==='bate';vrGun.visible=P.weapon==='pistola';vmBat.visible=P.weapon==='bate'&&!P.inCar&&!inVR;vmGun.visible=P.weapon==='pistola'&&!P.inCar&&!inVR;
  for(const gun of [vrGun,vmGun]){const u=gun.userData;u.slide.position.z=(G.locked?0.03:0)+G.kick+(gun===vrGun&&slideGrab?slideGrab.off:0);u.mag.visible=G.mag>=0;u.mag.userData.bullet.visible=u.mag.userData.tip.visible=G.mag>0;u.flash.material.opacity=Math.max(0,u.flash.material.opacity-dt*25);}
  G.kick=Math.max(0,G.kick-dt*0.4);
  if(swingT>0){swingT-=dt;const k=1-swingT/0.28;vmBat.rotation.set(0.9-Math.sin(k*Math.PI)*1.6,0.25+Math.sin(k*Math.PI)*0.9,0);}else vmBat.rotation.set(0.9,0.25,0);
  if(inVR&&!P.inCar&&P.alive)vrMelee(dt);
  refillBelt();
  const lhr=hands.left;const showBelt=vrOn&&P.weapon==='pistola'&&!P.inCar;camera.getWorldPosition(_v);camera.getWorldDirection(_v1);_v1.y=0;_v1.normalize();const rx=-_v1.z,rz=_v1.x;
  beltPouch.visible=showBelt;if(showBelt){const by=Math.max(surfY(_v.x,_v.z,_v.y-1.6)+0.6,_v.y-0.68);beltPouch.position.set(_v.x-rx*0.2+_v1.x*0.04,by,_v.z-rz*0.2+_v1.z*0.04);beltPouch.rotation.y=Math.atan2(_v1.x,_v1.z);
    for(let i=0;i<2;i++){beltMags[i].visible=BELT[i]!==null;beltMags[i].userData.bullet.visible=beltMags[i].userData.tip.visible=(BELT[i]||0)>0;}}
  leftMag.visible=!!leftHold;if(leftHold)leftMag.userData.bullet.visible=leftMag.userData.tip.visible=leftHold.n>0;
  if(vrOn&&lhr&&lhr.handRoot.parent&&!P.inCar){lhr.wristObj.getWorldPosition(_v2);_v2.addScaledVector(_v1.set(0,0,0),0);leftMag.getWorldPosition(_v3);const handP=_v3.clone();
    if(IN.lgDown&&!leftHold){
      if(P.weapon==='pistola'&&G.mag>=0){vrGun.userData.magwell.getWorldPosition(_v4);if(handP.distanceTo(_v4)<0.09){leftHold={n:ejectMag(false),armed:false};haptic(srcL,0.6,40);}}
      if(!leftHold&&P.weapon==='pistola'){vrGun.userData.slideRear.getWorldPosition(_v4);if(handP.distanceTo(_v4)<0.09){vrGun.worldToLocal(_v4.copy(handP));slideGrab={z0:_v4.z,off:0,done:false};}}
      if(!leftHold&&!slideGrab&&showBelt){for(let i=0;i<2;i++){beltMags[i].getWorldPosition(_v4);if(BELT[i]!==null&&handP.distanceTo(_v4)<0.16){leftHold={n:BELT[i],armed:true};BELT[i]=null;sfx('click');haptic(srcL,0.5,30);break;}}}
      if(!leftHold&&!slideGrab){for(const d of dropped){if(d.rounds===undefined)continue;if(d.o.position.distanceTo(handP)<0.18){leftHold={n:d.rounds,armed:true};d.t=0;sfx('click');break;}}}}
    if(leftHold&&P.weapon==='pistola'&&G.mag<0){vrGun.userData.magwell.getWorldPosition(_v4);const dm=handP.distanceTo(_v4);if(dm>0.14)leftHold.armed=true;if(leftHold.armed&&dm<0.06){insertMag(leftHold.n);leftHold=null;haptic(srcL,0.8,40);}}
    if(slideGrab&&IN.lgHeld){vrGun.worldToLocal(_v4.copy(handP));slideGrab.off=clamp(_v4.z-slideGrab.z0,0,0.045);if(slideGrab.off>0.032&&!slideGrab.done){slideGrab.done=true;rack();}}
    if(!IN.lgHeld){if(leftHold){const m=makeMag();m.userData.bullet.visible=m.userData.tip.visible=leftHold.n>0;leftMag.getWorldQuaternion(m.quaternion);
        const vel=lhr.vel||_v4.set(0,0,0);dropObj(m,handP,vel,true,leftHold.n);leftHold=null;}slideGrab=null;}
    // velocidad de la mano izquierda para lanzar el cargador
    lhr.prevP=lhr.prevP||handP.clone();lhr.vel=(lhr.vel||new V3()).subVectors(handP,lhr.prevP).divideScalar(Math.max(dt,0.008));lhr.prevP.copy(handP);}
  else if(leftHold&&!IN.lgHeld){addItem('balas',leftHold.n,'gift');leftHold=null;}}
function updateHands(){for(const side of ['left','right']){const hr=hands[side];if(!hr||!hr.handRoot.parent)continue;const gp=side==='left'?padL:padR;
    const bv=i=>gp&&gp.buttons[i]?gp.buttons[i].value:0,tch=i=>!!(gp&&gp.buttons[i]&&(gp.buttons[i].touched||gp.buttons[i].pressed));const c=hr.curl;const thumb=(tch(3)||tch(4)||tch(5))?0.85:0.3;
    if(side==='right'&&P.weapon!=='manos'&&!P.inCar){c.middle=c.ring=c.pinky=1;c.thumb=P.weapon==='pistola'?1.0:0.85;c.index=P.weapon==='pistola'?(tch(0)?0.62+bv(0)*0.3:0.42):0.95;}
    else if(side==='left'&&leftHold){c.middle=c.ring=c.pinky=0.95;c.index=0.85;c.thumb=0.75;}
    else{const g=bv(1);c.middle=c.ring=c.pinky=0.15+g*0.85;c.index=tch(0)?0.35+bv(0)*0.65:0.05;c.thumb=thumb;}
    if(window.__CURL)Object.assign(c,window.__CURL);
    // las manos (y lo que llevan) no atraviesan lo sólido: el mando se frena donde el rayo pecho→mano toca pared, puerta, persiana o mueble
    {const g=hr.handRoot.parent;g.getWorldPosition(_v);hr.real=(hr.real||new V3()).copy(_v);if(inVR&&!P.inCar&&g.matrixAutoUpdate===false){camera.getWorldPosition(_v1);_v1.y-=0.18;_v2.subVectors(_v,_v1);const d=_v2.length();
        if(d>0.08){_v2.divideScalar(d);const pad=0.075;const t=rayWorld(_v1,_v2,d+pad);if(t>0.03&&t<d+pad){_v3.copy(_v2).multiplyScalar(t-pad-d);rig.getWorldQuaternion(_q).invert();_v3.applyQuaternion(_q);const e=g.matrix.elements;e[12]+=_v3.x;e[13]+=_v3.y;e[14]+=_v3.z;
            g.position.set(e[12],e[13],e[14]);g.updateMatrixWorld(true);if(!hr.blocked){hr.blocked=true;haptic(side==='left'?srcL:srcR,0.35,25);}}else hr.blocked=false;}}}
    hr.off.set(0,0,0);applyHC();poseHand(hr);
    // puertas: agarrar la manilla con el grip; con la mano libre se empujan
    const hp=hr.handRoot.parent.getWorldPosition(_v5);const free=side==='left'?!leftHold:(P.weapon==='manos');
    if(free||doorGrab[side])handDoors(side,hp,side==='left'?IN.lgDown:IN.use,side==='left'?IN.lgHeld:IN.rgHeld,frameDt);
    hr.pv=hr.pv||hp.clone();const vx=(hp.x-hr.pv.x)/Math.max(frameDt,0.008),vz=(hp.z-hr.pv.z)/Math.max(frameDt,0.008);hr.pv.copy(hp);
    if(!doorGrab[side])pushDoorsAt(hr.real.x,hr.real.z,hr.real.y,0.09,vx,vz,0.5);
    // tocar a alguien: la mano es sólida, desplaza el punto del cuerpo que toca (vivo o muerto) y el resto del cuerpo reacciona
    for(const h of H_){if(!h.active)continue;const c=h.sim[CHEST];if(Math.abs(c.x-hp.x)>1.1||Math.abs(c.z-hp.z)>1.1||Math.abs(c.y-hp.y)>1.6)continue;let hit=-1;
      for(let i=0;i<NP;i++){const q=h.sim[i];const rr=PR[i]+0.065;const dx=q.x-hp.x,dy=q.y-hp.y,dz=q.z-hp.z;const d2=dx*dx+dy*dy+dz*dz;if(d2>=rr*rr||d2<1e-7)continue;const d=Math.sqrt(d2),push=rr-d;
        if(hit<0){hit=i;if(!h.dead&&h.mode!=='phys'){enterPhys(h);}h.sleep=0;}q.x+=dx/d*push;q.y+=dy/d*push*0.4;q.z+=dz/d*push;}
      if(hit>=0){const sp=Math.hypot(vx,vz);if(sp>0.25&&sp<3)applyImp(h,_imp.set(vx*0.3,0.05,vz*0.3),hit);if(!h.dead)for(let k=0;k<NP;k++)h.kl[k]=Math.min(h.kl[k],0.6+0.4*(k!==hit));
        if(clockT-(h.touchT||0)>0.2){h.touchT=clockT;haptic(side==='left'?srcL:srcR,0.3,25);}}}}}
function placeHud(){const g=gripBySide.left;const on=inVR&&hudOn&&g&&!panel&&P.alive;wrist.visible=!!on;if(!on)return;g.getWorldPosition(_v);camera.getWorldPosition(_v1);
  // panel flotante encima de la mano izquierda, siempre mirando a la cara; se enciende y apaga pulsando el joystick izquierdo
  _v2.subVectors(_v1,_v);_v2.y=0;const l=_v2.length()||1;wrist.position.set(_v.x+_v2.x/l*0.03,_v.y+0.17,_v.z+_v2.z/l*0.03);wrist.lookAt(_v1);}
const doorGrab={left:null,right:null};const _v5=new V3(),_v6=new V3();let frameDt=0.016;
function handAng(d,hp){if(d.slide)return (hp.x-d.sx)*d.ux+(hp.z-d.sz)*d.uz;const th=Math.atan2(-(hp.z-d.hz),hp.x-d.hx);let a=(th-d.base)*d.sign;return Math.atan2(Math.sin(a),Math.cos(a));}
function handDoors(side,hp,down,held,dt){let g=doorGrab[side];const src=side==='left'?srcL:srcR;
  if(down&&!g){for(const d of DOORS){const dx=d.hx-hp.x,dz=d.hz-hp.z;if(dx*dx+dz*dz>6)continue;doorHandleWorld(d,_v6);if(_v6.distanceTo(hp)>0.3)continue;
      if(d.locked){sfx('rattle');haptic(src,0.6,80);toast('Está cerrada con llave',1.2);break;}g=doorGrab[side]={d,a0:handAng(d,hp)-(d.slide?d.off:d.ang)};d.held=side;haptic(src,0.4,30);sfx('click');break;}}
  if(!g)return;const d=g.d;if(!held){d.held=null;doorGrab[side]=null;return;}
  const prev=d.slide?d.off:d.ang;const tgt=handAng(d,hp)-g.a0;if(d.slide)d.off=clamp(tgt,0,d.maxOff);else{d.ang=clamp(tgt,0,d.maxA);d.vel=(d.ang-prev)/Math.max(dt,0.008);d.target=null;}applyDoor(d);
  if(doorHandleWorld(d,_v6).distanceTo(hp)>0.8){d.held=null;doorGrab[side]=null;}}
function update(dt){frameNo++;frameDt=dt;readInput(dt);camera.getWorldPosition(camW);const p=camW;
  if(panel)panelInput();else if(P.alive&&!P.sleeping){if(IN.inv)openPanel('inv');else if(IN.menu)openPanel('main');else if(IN.map)openPanel('map');else if(IN.status)openPanel('status');}
  if(!inVR&&!P.sleeping){const sens=0.0024;if(P.inCar)P.carYaw-=lookDX*sens;else P.yaw-=lookDX*sens;P.pitch=clamp(P.pitch-lookDY*sens,-1.35,1.35);}lookDX=lookDY=0;
  if(IN.turn&&!P.sleeping&&!panel){const a=IN.turn*dt*2.3;camera.getWorldPosition(_v);if(P.inCar)P.carYaw-=a;else P.yaw-=a;rig.rotation.y=P.inCar?P.inCar.yaw+Math.PI+P.carYaw:P.yaw;rig.updateMatrixWorld(true);camera.getWorldPosition(_v1);if(!P.inCar){rig.position.x+=_v.x-_v1.x;rig.position.z+=_v.z-_v1.z;}}
  if(IN.snap&&!P.sleeping){camera.getWorldPosition(_v);if(P.inCar)P.carYaw-=IN.snap*Math.PI/6;else P.yaw-=IN.snap*Math.PI/6;rig.rotation.y=P.inCar?P.inCar.yaw+Math.PI+P.carYaw:P.yaw;rig.updateMatrixWorld(true);camera.getWorldPosition(_v1);if(!P.inCar){rig.position.x+=_v.x-_v1.x;rig.position.z+=_v.z-_v1.z;}}
  if(P.alive&&!P.sleeping&&!panel){if(IN.use&&!(inVR&&(doorGrab.right||doorGrab.left||P.inCar)))doInteract();if(IN.weapon&&P.inCar&&inVR)exitCar();
    if(IN.light&&P.inCar){IN.light=false;P.carGun=!P.carGun;toast(P.carGun?'Modo disparo: el gatillo dispara':'Modo conducción: el gatillo acelera',1.5);}
    if(IN.weapon&&!P.inCar){P.weapon=P.weapon==='manos'?'bate':P.weapon==='bate'?'pistola':'manos';toast({manos:'Manos libres',bate:'Bate',pistola:'Pistola'}[P.weapon],1.5);}
    if(IN.eject&&P.weapon==='pistola')ejectMag(true);if(IN.reload&&P.weapon==='pistola')reloadFlat();if(IN.light){P.light=!P.light;sfx('click');}if(IN.pee)doPee();
    if(IN.crouch){P.crouchToggle=!P.crouchToggle;toast(P.crouchToggle?'Te agachas':'Te levantas',1.2);}if(IN.hud){hudOn=!hudOn;sfx('click');}if(IN.recenter&&!P.inCar)recenter();
    if((!P.inCar||P.carGun)&&IN.attackP){if(P.weapon==='pistola'){if(inVR&&gripBySide.right){vrGun.userData.muzzle.getWorldPosition(_o2);_d2.set(0,0,-1).applyQuaternion(vrGun.getWorldQuaternion(_q));fireGun(_o2,_d2);}else{camera.getWorldPosition(_o2);camera.getWorldDirection(_d2);_o2.addScaledVector(_d2,0.3);fireGun(_o2,_d2);}}else meleeFlat();}}
  P.crouchOff+=((inVR&&P.crouchToggle&&!P.inCar?0.75:0)-P.crouchOff)*Math.min(1,dt*7);if(P.crouchOff<0.004)P.crouchOff=0;P.crouch=P.crouchToggle||(inVR&&camera.position.y<1.12);
  if(P.alive&&!P.sleeping){if(P.inCar)driveCar(P.inCar,panel?0:dt);
    else if(!panel){camera.getWorldDirection(_d2);_d2.y=0;if(_d2.lengthSq()<1e-6)_d2.set(0,0,-1);_d2.normalize();const rx=-_d2.z,rz=_d2.x;let mx=IN.mx,my=IN.my;const ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml;}
      const spr=IN.sprint&&P.energy>5&&my>0.3&&!P.crouch;P.sprinting=spr&&ml>0.2;const sp=(spr?4.8:P.crouch?1.2:2.3)*(P.energy<12?0.6:1)*(P.hp<25?0.75:1)*(invWeight()>invCap()?0.65:1);
      const fy=P.feetY!==undefined?P.feetY:rig.position.y;P.vx=(_d2.x*my+rx*mx)*sp;P.vz=(_d2.z*my+rz*mx)*sp;const pt={x:p.x+P.vx*dt,z:p.z+P.vz*dt};collide(pt,0.3,fy+0.35,fy+(inVR?clamp(p.y-fy+0.08,0.6,1.95):(P.crouch?1.0:1.75)));
      for(const c of cars){const ex=pt.x-c.x,ez=pt.z-c.z,d=Math.hypot(ex,ez);if(d<c.halfW+1&&d>0){pt.x=c.x+ex/d*(c.halfW+1);pt.z=c.z+ez/d*(c.halfW+1);}}
      rig.position.x+=pt.x-p.x;rig.position.z+=pt.z-p.z;if(ml>0.2){P.stepT-=dt*sp;if(P.stepT<=0){P.stepT=0.8;makeNoise(p.x,p.z,P.crouch?2:P.sprinting?14:6);}}}}
  if(P.inCar){const c=P.inCar;const s=Math.sin(c.yaw),co=Math.cos(c.yaw);const lx=c.seat.x,lz=c.seat.z;const camY=inVR?camera.position.y:1.2;rig.position.set(c.x+lx*co+lz*s,c.y+c.eye-camY,c.z-lx*s+lz*co);rig.rotation.y=c.yaw+Math.PI+P.carYaw;}
  else{rig.rotation.y=P.yaw;let fy=P.feetY===undefined?rig.position.y:P.feetY;const gy=surfY(p.x,p.z,fy);if(gy-fy<0.7)fy+=(gy-fy)*Math.min(1,dt*12);P.feetY=fy;rig.position.y=fy-P.crouchOff+(P.hOff||0);if(engine)engine.g.gain.value*=0.9;
    // cabeza dentro de una pared: atrás y oscuro
    if(!P.inCar&&insideVol(p.x,p.y,p.z)){rig.position.x+=P.lastSafe.x-p.x;rig.position.z+=P.lastSafe.z-p.z;blackT=Math.max(blackT,0.25);}else P.lastSafe.copy(p);}
  if(!inVR){camera.position.set(0,P.inCar?1.2:(P.crouch?1.05:1.65),0);camera.rotation.set(P.pitch,0,0);}
  const gmps=P.sleeping?80:1440/(S.dayMin*60);const gm=dt*gmps;gameMin+=gm;if(P.alive)updateNeeds(gm/60);
  if(P.sleeping){P.sleepLeft-=gm;if(P.sleepLeft<=0||P.energy>=100){P.sleeping=false;toast('Te despiertas descansado');P.mood=Math.min(100,P.mood+(P.bedSleep?14:6));}}
  if(P.peeT>0){P.peeT-=dt;P.bladder=Math.max(0,P.bladder-P.peeStart/6*dt*1.6);camera.getWorldPosition(_v);camera.getWorldDirection(_v1);const fx=_v1.x,fz=_v1.z,fl=Math.hypot(fx,fz)||1;
    for(let k=0;k<4;k++){const i=peeI++%260;const gy=surfY(_v.x,_v.z,_v.y-1.5);peeP[i]={p:new V3(_v.x+fx/fl*0.2,gy+Math.max(0.7,(_v.y-gy)*0.55),_v.z+fz/fl*0.2),v:new V3(fx/fl*2.1+R(-0.08,0.08),0.5+clamp(_v1.y,-0.6,0.4)*1.5+R(-0.05,0.05),fz/fl*2.1+R(-0.08,0.08)),life:1.2};}
    if(P.peeT<=0){P.bladder=0;P.mood=Math.min(100,P.mood+(P.peeToilet?5:1));if(!P.peeToilet)makeNoise(p.x,p.z,6);}}
  for(let i=0;i<peeP.length;i++){const q=peeP[i];if(!q)continue;if(q.life<=0){peeMesh.setMatrixAt(i,ZM);continue;}q.life-=dt;q.v.y-=9.81*dt;q.p.addScaledVector(q.v,dt);const gy=surfY(q.p.x,q.p.z,q.p.y);
    if(q.p.y<gy){q.life=0;if(Math.random()<0.04){let pd=puddles.find(u=>u.p.distanceTo(q.p)<0.4);if(!pd&&puddles.length<8){const m=new THREE.Mesh(new THREE.CircleGeometry(1,14),new THREE.MeshBasicMaterial({color:0xc9b03a,transparent:true,opacity:0.45,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(q.p.x,gy+0.012,q.p.z);m.scale.setScalar(0.05);scene.add(m);pd={p:m.position,m,s:0.05,t:90};puddles.push(pd);}if(pd){pd.s=Math.min(0.5,pd.s+0.02);pd.m.scale.setScalar(pd.s);}}}
    _m.makeTranslation(q.p.x,q.p.y,q.p.z);peeMesh.setMatrixAt(i,q.life>0?_m:ZM);}peeMesh.instanceMatrix.needsUpdate=true;
  for(let i=puddles.length-1;i>=0;i--){puddles[i].t-=dt;if(puddles[i].t<=0){scene.remove(puddles[i].m);puddles.splice(i,1);}}
  for(const pl of pools){if(pl.s<pl.max){pl.s+=dt*0.08;pl.m.scale.setScalar(pl.s);}}
  updateChars(dt,p);sepBodies();managePop(p,false);
  for(const c of cars)if(c!==P.inCar&&(Math.abs(c.speed)>0.05||Math.abs(c.vLat||0)>0.05||Math.abs(c.rollV||0)>0.01)){c.speed*=Math.pow(0.3,dt);c.vLat=(c.vLat||0)*Math.pow(0.2,dt);c.steer=0;moveCar(c,dt,false);}
  chunkT-=dt;if(chunkT<=0){chunkT=0.4;const VD=(S.view||3000)+40;for(const c of chunks.values()){const v=Math.hypot(c.cx-p.x,c.cz-p.z)<(c.inner?(inVR?60:75):Math.min(VD,inVR?2000:3000));for(const m of c.meshes)m.visible=v;}for(const c of cars)c.g.visible=Math.hypot(c.x-p.x,c.z-p.z)<(inVR?90:130);
    for(const d of DOORS)d.g.visible=Math.abs(d.hx-p.x)<38&&Math.abs(d.hz-p.z)<38;for(const pn of PANES)pn.m.visible=Math.abs(pn.cx-p.x)<45&&Math.abs(pn.cz-p.z)<45;}
  updateWeapons(dt);updateHands();placeHud();updateBody(dt);stepDropped(dt);
  WTIME.value=clockT;if(S.gore)for(const h of H_){if(!h.active||!h.holder.visible)continue;if(h.woundI)updateWoundGravity(h);if(!h.bleeds||!h.bleeds.length)continue;for(const b of h.bleeds){if(clockT>b.until)continue;b.t-=dt;if(b.t<=0){b.t=R(0.12,0.35)*(1+(clockT-(b.until-8))*0.1);_v.copy(h.sim[b.i]).add(b.o);spray(_v,_v1.set(R(-0.1,0.1),-0.3,R(-0.1,0.1)),0.5);}}}
  for(let i=0;i<parts.length;i++){const q=parts[i];if(!q)continue;if(q.life<=0){blood.setMatrixAt(i,ZM);continue;}q.life-=dt;
    if(!q.ground){q.v.y-=9.81*dt;q.v.multiplyScalar(1-dt*0.6);q.p.addScaledVector(q.v,dt);const gy=surfY(q.p.x,q.p.z,q.p.y)+0.004;
      if(q.p.y<gy){q.p.y=gy;q.ground=true;q.life=R(25,40);q.rot=R(0,6.28);q.r*=R(2.4,3.6);}
      const sp=q.v.length();_bv.copy(q.v).divideScalar(sp||1);_bq.setFromUnitVectors(UP,sp>0.01?_bv:UP);_bs.set(q.r,q.r*(1+Math.min(sp,5)*0.35),q.r);}
    else{_bq.setFromAxisAngle(UP,q.rot);_bs.set(q.r*1.3,0.0012,q.r);}
    _m.compose(q.p,_bq,_bs);blood.setMatrixAt(i,_m);}blood.instanceMatrix.needsUpdate=true;
  for(let i=0;i<dps.length;i++){const q=dps[i];if(!q)continue;if(q.life<=0){dust.setMatrixAt(i,ZM);continue;}q.life-=dt;q.v.y-=4*dt;q.p.addScaledVector(q.v,dt);_m.makeTranslation(q.p.x,q.p.y,q.p.z);dust.setMatrixAt(i,q.life>0?_m:ZM);}dust.instanceMatrix.needsUpdate=true;
  stepSmoke(dt,scene.fog.color,scene.fog.far,1-nightF);
  for(const t of tracers)if(t.t>0){t.t-=dt;t.l.material.opacity=Math.max(0,t.t/0.09);}
  for(let i=noises.length-1;i>=0;i--){noises[i].t-=dt;if(noises[i].t<=0)noises.splice(i,1);}
  stepDoors(dt);if(!P.inCar)pushDoorsAt(p.x,p.z,rig.position.y+0.9,0.34,P.vx||0,P.vz||0,1);
  for(const h of H_){if(!h.active||h.dead||h.mode!=='kin'||h.speed<0.2)continue;if(Math.abs(h.x-p.x)>25||Math.abs(h.z-p.z)>25)continue;pushDoorsAt(h.x,h.z,h.y+0.9,0.32,h.vx||0,h.vz||0,0.7);}
  hurtFx=Math.max(0,hurtFx-dt*0.8);if(blackT>0)blackT-=dt;
  const dark=P.sleeping?0.92:(!P.alive?0.75:blackT>0?0.95:0);fxSphere.material.color.setHex(dark>0?0x000000:0x990000);
  fxSphere.material.opacity=Math.max(dark,hurtFx+(P.hp<25?0.12+Math.sin(clockT*4)*0.05:0)+(P.sick>50?0.05:0));fxSphere.visible=fxSphere.material.opacity>0.01;
  fxDiv.style.background=dark>0?'#000':'#900';fxDiv.style.opacity=inVR?0:fxSphere.material.opacity;
  if(!P.alive){P.deadT+=dt;if(P.deadT>6){resetPlayer();toast('Vuelves a empezar junto al Mercat del Ninot.',4);}}
  if(toastT>0){toastT-=dt;if(toastT<=0){toastDiv.style.display='none';toastPlane.visible=false;}}
  if(panel&&inVR){camera.getWorldPosition(_v);pnlMesh.lookAt(_v);}
  promptT-=dt;if(promptT<=0){promptT=0.2;const it=P.alive?findInteract():null;prompt=it?it.text:'';}
  hudT-=dt;if(hudT<=0){hudT=0.16;drawHUD();if(inVR)hudTex.needsUpdate=true;if(panel&&(panel.mode==='status'||panel.mode==='map'))drawPanel();if(inVR&&panel)pnlTex.needsUpdate=true;}
  if(!inVR&&panel)pnlTex.needsUpdate=true;}
function loop(){if(DEBUG.has('shot')&&!window.__go)return;const now=performance.now()/1000;const dt=Math.min(0.05,now-last);last=now;clockT+=dt;
  if(started)update(dt);else{P.yaw+=dt*0.05;rig.rotation.y=P.yaw;camera.position.set(0,14,0);camera.rotation.set(-0.12,0,0);camera.getWorldPosition(camW);}
  if(window.__freeCam){const f=window.__freeCam;if(body)body.holder.visible=false;viewModel.visible=false;fxSphere.visible=false;blackT=0;rig.position.set(f.x,f.y,f.z);rig.rotation.y=f.yaw;camera.position.set(0,0,0);camera.rotation.set(f.pitch,0,0);camera.getWorldPosition(camW);}
  updateSky();renderer.render(scene,camera);}

// =====================================================================
// INICIO
// =====================================================================
const startEl=document.getElementById('start'),vrmsg=document.getElementById('vrmsg'),bvr=document.getElementById('bvr'),bflat=document.getElementById('bflat');
let worldReady=false;
function enableStart(){if(!modelsReady)return;bflat.disabled=false;bvr.disabled=!navigator.xr;}
function begin(vr){initAudio();started=true;startEl.style.display='none';gameMin=S.startHour*60;
  if(!worldReady){worldReady=true;setupBody();placeCars();placeWrecks();populateNPCs();placeCorpses();setupSmoke();}
  resetPlayer();camera.getWorldPosition(camW);managePop(camW,true);
  if(!vr){hudC.style.display='block';document.getElementById('cross').style.display='block';if(isTouch){touchUI.style.display='block';document.querySelectorAll('.mn').forEach(b=>b.style.display='block');}}
  toast('Día 1. Eixample de Barcelona. Al lado tienes el Mercat del Ninot: una base de supervivientes. Habla con su líder.',7);}
bflat.onclick=()=>begin(false);
if(!navigator.xr)vrmsg.textContent='Este navegador no tiene WebXR. Abre esta página en el navegador de las Quest 3.';
else navigator.xr.isSessionSupported('immersive-vr').then(ok=>{if(!ok)vrmsg.textContent='Aquí no hay visor VR. En las Quest 3 este botón entra en realidad virtual.';}).catch(()=>{});
bvr.onclick=async()=>{initAudio();try{const ses=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor','hand-tracking']});
    renderer.xr.setFoveation(0.5);await renderer.xr.setSession(ses);inVR=true;camera.position.set(0,0,0);camera.rotation.set(0,0,0);viewModel.visible=false;
    ses.addEventListener('end',()=>{inVR=false;viewModel.visible=true;hudC.style.display='block';document.getElementById('cross').style.display='block';closePanel();});begin(true);}
  catch(e){vrmsg.innerHTML='No se ha podido abrir la VR ('+(e&&e.name||'error')+'). Si estás dentro de claude.ai, la página bloquea la VR: abre el juego desde tu enlace de GitHub Pages.';}};
// arranque: construir Barcelona y descargar recursos
setLoad('w','Construyendo Barcelona…');
setTimeout(()=>{try{buildWorld();buildLootGrid();setLoad('w',`✔ Barcelona generada: ${BLOCKS.length} manzanas, ${shopCount} locales con interior, ${BASES.length} bases`);}catch(e){console.error(e);setLoad('w','❌ Error generando la ciudad: '+e.message);}
  resetPlayer();camera.getWorldPosition(camW);renderer.setAnimationLoop(loop);loadModels();},50);
// ---- ganchos de depuración (solo con ?shot=1) ----
if(DEBUG.has('shot')){window.__T={VOL,SIGNIDX,setHour:h=>{gameMin=Math.floor(gameMin/1440)*1440+h*60;},addWound,SHOPS,physStep,driveBones,carInterior,chunks,BLOCKS,spray,makeCar,moveCar,get poiUsed(){return POIUSED.size},get signN(){return signN},THREE,scene,camera,rig,renderer,P,G,S,BELT,H_,BASES,SHOPS,LOOT,DOORS,PANES,cars,INST,surfY,collide,insideVol,begin,hands,gripBySide,setVR:v=>{inVR=v;},keys,pressed,IN,
  get started(){return started},get modelsReady(){return modelsReady},get leftHold(){return leftHold},spawnChar,hitChar,doInteract,findInteract,vrGun,vrBat,beltMags,leftMag,setGame:m=>{gameMin=m},get gameMin(){return gameMin},
  applyDoor,TPL,poseHand,gl,viewModel,updateBody,get body(){return body},setupHands,applyImp,enterPhys,despawn,BLOCKS,VSTR,HSTR,toast};
  window.__ready=()=>texDone>=texPending&&modelsReady;}
