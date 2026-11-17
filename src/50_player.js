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
function setupBody(){const tpl=TPL.p_m2||TPL_M[0]||CHAR_TPLS[0];if(!tpl)return;const h=newRec(tpl);H_.pop();charSlot--;body=h;h.type='player';h.gp={lean:0,droop:0,tilt:0,arms:'swing',limp:0,sway:1,twitch:0,speedMul:1};
  h.s=1;h.pr={};for(const k in tpl.pr){const v=tpl.pr[k];h.pr[k]=v.isVector3?v.clone():v;}for(let k=0;k<STICKS.length;k++)h.rest[k]=tpl.CB[STICKS[k][0]].distanceTo(tpl.CB[STICKS[k][1]]);h.kp.fill(1);h.kl.fill(1);h.inner.quaternion.copy(tpl.qFix);h.inner.position.set(0,-tpl.minY,0);for(const m of h.meshes)m.material=Array.isArray(m.userData.base)?m.userData.base.map(b=>charMat(b,'good',0,tpl)):charMat(m.userData.base,'good',0,tpl);
  h.y=0;h.bones.Head.scale.setScalar(0.001);h.bones.LeftArm.scale.setScalar(0.001);h.bones.RightArm.scale.setScalar(0.001);setupSleeves();h.holder.visible=false;h.phase=0;h.mode='kin';h.k=1;h.yawB=0;}
const _bw=new V3(),_bh=new V3();
// Mangas: dos tubos por brazo (hombro→codo→muñeca) que se orientan y estiran cada fotograma: la mano nunca se separa del brazo
const sleeves={};
function setupSleeves(){const mat=photoMat('fabric',{vertexColors:false,color:0x39414c,roughness:0.95,ns:0.6});
  const seg=(r0,r1,cuff)=>{const gs=[new THREE.CylinderGeometry(r1,r0,1,12,1,true).translate(0,0.5,0)];if(cuff)gs.push(new THREE.CylinderGeometry(r1+0.004,r1+0.004,0.09,12,1,false).translate(0,0.955,0));
    const g=gs.length>1?mergeGeometries(gs):gs[0];const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*2,uv.getY(i)*2.5);return g;};
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
