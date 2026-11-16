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
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=0.95;
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
const starMat=new THREE.PointsMaterial({color:0xffffff,size:2,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false});
const stars=new THREE.Points(new THREE.BufferGeometry(),starMat);
{const a=[];for(let i=0;i<1200;i++){_v.randomDirection();_v.y=Math.abs(_v.y)*0.9+0.05;_v.normalize().multiplyScalar(1100);a.push(_v.x,_v.y,_v.z);}stars.geometry.setAttribute('position',new THREE.Float32BufferAttribute(a,3));}
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
