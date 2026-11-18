// =====================================================================
// COCHES REALES (modelos de VW de la comunidad, reducidos): aparcados son instancias ligeras pintadas cada una de su color;
// al acercarte se cambian por el modelo completo con interior, puertas y maletero que se abren con la mano, y el volante
// del propio modelo, que gira de verdad. El selector del cambio (P R N D) está en la consola, donde va en estos coches.
// =====================================================================
const VW=[{k:'golf',w:4},{k:'passat',w:2},{k:'id3',w:2},{k:'tiguan',w:3},{k:'jetta',w:1}];
const VTPL={};
const PAINTCOL=[0xf0f0ee,0xf0f0ee,0xe2e3e0,0x18191b,0x18191b,0x9ea2a6,0x9ea2a6,0x62676c,0x2a3954,0x7a1418,0x34423a,0xc8c2b2,0x3e4b5e,0x8e9aa6];
const vGlassMat=pbr(new THREE.MeshStandardMaterial({color:0x2a3a3e,roughness:0.04,metalness:0.1,transparent:true,opacity:0.32,side:THREE.DoubleSide,depthWrite:false,envMapIntensity:1.6}));
function avgTexColor(tex){const im=tex&&tex.image;if(!im||!im.width)return null;try{const c=document.createElement('canvas');c.width=c.height=4;const g=c.getContext('2d');g.drawImage(im,0,0,4,4);const d=g.getImageData(0,0,4,4).data;let r=0,gg=0,b=0;for(let i=0;i<d.length;i+=4){r+=d[i];gg+=d[i+1];b+=d[i+2];}const n=d.length/4;return[(r/n/255)**2.2,(gg/n/255)**2.2,(b/n/255)**2.2];}catch(e){return null;}}
// versión lejana: una sola malla con color por vértice; la pintura (aPaint=1) toma el color de cada instancia
function prepLo(scene){scene.rotation.y=Math.PI;scene.updateMatrixWorld(true);const parts=[];
  scene.traverse(o=>{if(!o.isMesh)return;const g0=o.geometry;if(!g0.boundingSphere)g0.computeBoundingSphere();const sc=o.matrixWorld.getMaxScaleOnAxis();if(g0.boundingSphere.radius*sc<0.05)return;
    const m=Array.isArray(o.material)?o.material[0]:o.material;const nm=m.name||'';let g=g0.index?g0.toNonIndexed():g0.clone();g=new THREE.BufferGeometry().copy(g);
    for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);g.applyMatrix4(o.matrixWorld);if(!g.attributes.normal)g.computeVertexNormals();
    const n=g.attributes.position.count;let col=[m.color.r,m.color.g,m.color.b];const tc=avgTexColor(m.map);if(tc)col=col.map((v,i)=>v*tc[i]*1.1);let paint=0;
    if(nm==='PAINT'){col=[0.95,0.95,0.95];paint=1;}else if(/^GLASS_/.test(nm)||(m.transparent&&m.opacity<0.6)){col=[0.05,0.065,0.07];}
    const ca=new Float32Array(n*3),pa=new Float32Array(n);for(let i=0;i<n;i++){ca[i*3]=col[0];ca[i*3+1]=col[1];ca[i*3+2]=col[2];pa[i]=paint;}
    g.setAttribute('color',new THREE.BufferAttribute(ca,3));g.setAttribute('aPaint',new THREE.BufferAttribute(pa,1));parts.push(g);});
  const geo=mergeGeometries(parts);geo.computeBoundingBox();geo.computeBoundingSphere();return geo;}
const vLoMat=pbr(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.42,metalness:0.35,envMapIntensity:1.1}));
vLoMat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aPaint;')
  .replace('#include <color_vertex>','vColor=vec3(1.0);\n#ifdef USE_COLOR\nvColor*=color;\n#endif\n#ifdef USE_INSTANCING_COLOR\nvColor=mix(vColor,vColor*instanceColor,aPaint);\n#endif');};
vLoMat.customProgramCacheKey=()=>'vlo1';
// versión cercana: datos de puertas, maletero, ruedas y volante
function prepHi(g){const s=g.scene;s.rotation.y=Math.PI;s.updateMatrixWorld(true);const T={scene:s,doors:{},wheels:[]};const N={};s.traverse(o=>{if(o.name)N[o.name]=o;});
  const clip=n=>{for(const a of g.animations)for(const t of a.tracks)if(t.name===n+'.quaternion'){const v=t.values,k=v.length-4;return new Q4(v[k],v[k+1],v[k+2],v[k+3]);}return null;};
  const bbW=o=>new THREE.Box3().setFromObject(o);
  for(const k of ['FL','FR','RL','RR']){const e=N['EXT_DOOR_'+k],i=N['INT_DOOR_'+k];if(!e)continue;const b=bbW(e);const front=k[0]==='F';const left=k[1]==='L';
    const hx=left?b.max.x-0.03:b.min.x+0.03;const hz=front?b.min.z+0.14:b.min.z+0.12;const hy=Math.min(b.max.y-0.12,0.98);// maneta: borde de atrás, a 1 m
    const hw=new V3(hx,hy,hz);const hl=e.worldToLocal(hw.clone());const hin=new V3(hx-(left?0.13:-0.13),hy-0.05,hz+0.12);const hil=e.worldToLocal(hin.clone());
    T.doors[k]={ext:e.name,int:i&&i.name,q0e:e.quaternion.clone(),q1e:clip(e.name)||e.quaternion.clone(),q0i:i?i.quaternion.clone():null,q1i:i?(clip(i.name)||i.quaternion.clone()):null,hl,hil,left,front};}
  {const e=N.EXT_TRUNK_LID,i=N.INT_TRUNK_LID;if(e){const b=bbW(e);const hw=new V3(0,b.min.y+0.06,b.min.z+0.02);T.trunk={ext:e.name,int:i&&i.name,q0e:e.quaternion.clone(),q1e:clip(e.name)||e.quaternion.clone(),q0i:i?i.quaternion.clone():null,q1i:i?(clip(i.name)||i.quaternion.clone()):null,hl:e.worldToLocal(hw.clone())};}}
  for(const k of ['FL','FR','RL','RR']){const w=N['WHEEL_'+k];if(!w)continue;const b=bbW(w);const c=b.getCenter(new V3());T.wheels.push({name:w.name,c,front:k[0]==='F',r:(b.max.y-b.min.y)/2});}
  // volante: centro y eje (componente principal más pequeña de los vértices del aro), apuntando hacia el salpicadero
  {const sw=N.INT_STEERING_WHEEL;if(sw){const P=[];sw.traverse(o=>{if(!o.isMesh)return;const pa=o.geometry.attributes.position;for(let i=0;i<pa.count;i+=Math.max(1,(pa.count/400)|0)){P.push(new V3().fromBufferAttribute(pa,i).applyMatrix4(o.matrixWorld));}});
      const c=new V3();for(const p of P)c.add(p);c.divideScalar(P.length);const C=[[0,0,0],[0,0,0],[0,0,0]];for(const p of P){const d=[p.x-c.x,p.y-c.y,p.z-c.z];for(let a=0;a<3;a++)for(let b2=0;b2<3;b2++)C[a][b2]+=d[a]*d[b2];}
      // potencia inversa aproximada: el eje es el de menor varianza
      const M=new THREE.Matrix3().set(C[0][0],C[0][1],C[0][2],C[1][0],C[1][1],C[1][2],C[2][0],C[2][1],C[2][2]);const Mi=M.clone().invert();let v=new V3(0,0.3,1).normalize();for(let it=0;it<30;it++){v.applyMatrix3(Mi).normalize();}
      if(v.z<0)v.negate();let r=0;for(const p of P){const d=p.clone().sub(c);const l=d.clone().sub(v.clone().multiplyScalar(d.dot(v))).length();if(l>r)r=l;}
      T.sw={name:sw.name,c,ax:v,r:Math.min(0.2,r*0.95)};}}
  const bb=new THREE.Box3().setFromObject(s);T.len=bb.max.z-bb.min.z;T.halfW=Math.min(0.93,(bb.max.x-bb.min.x)/2-0.12);T.h=bb.max.y;
  T.seat=T.sw?new V3(T.sw.c.x,0.3,T.sw.c.z-0.6):new V3(0.36,0.3,-0.1);T.eye=T.sw?T.sw.c.y+0.25:1.15;
  // cristales: material propio limpio; la pintura se clona por coche
  s.traverse(o=>{if(!o.isMesh)return;const m=o.material;if(/^GLASS_/.test(m.name)){o.material=vGlassMat;o.renderOrder=3;}else if(m.transparent&&m.opacity<0.25&&!/red|light|lamp/i.test(m.name)){o.material=vGlassMat;o.renderOrder=3;}
    if(m.map)m.map.anisotropy=4;o.castShadow=false;});
  return T;}
// versión lejana hecha a partir de los perfiles del modelo (data: car_lo.py): ~800 triángulos con color por vértice
function loBin(buf){const dv=new DataView(buf);const hl=dv.getUint32(0,true);const H0=JSON.parse(new TextDecoder().decode(new Uint8Array(buf,4,hl)));let o=4+hl;
  const P=new Float32Array(buf.slice(o,o+H0.nv*12));o+=H0.nv*12;const C=new Uint8Array(buf,o,H0.nv*3);o+=H0.nv*3;const Pa=new Uint8Array(buf,o,H0.nv);o+=H0.nv;o+=(4-(H0.nv*4)%4)%4;
  const I=new Uint16Array(buf.slice(o,o+H0.ni*2));const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(P,3));
  const cf=new Float32Array(H0.nv*3);for(let i=0;i<cf.length;i++)cf[i]=(C[i]/255)**2.2;g.setAttribute('color',new THREE.BufferAttribute(cf,3));
  const pf=new Float32Array(H0.nv);for(let i=0;i<H0.nv;i++)pf[i]=Pa[i];g.setAttribute('aPaint',new THREE.BufferAttribute(pf,1));g.setIndex(new THREE.BufferAttribute(I,1));
  g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;}
async function loadVehicles(){for(const v of VW){try{const r=await fetch('models/cars/'+v.k+'_lo.bin');if(!r.ok)continue;VTPL[v.k]={k:v.k,w:v.w,lo:loBin(await r.arrayBuffer()),hi:null,hiP:null};}catch(e){console.warn('coche',v.k,e);}}
  setLoad('v',`✔ Coches: ${Object.keys(VTPL).length} modelos reales (VW Golf, Passat, ID.3, Tiguan, Jetta)`);}
function needHi(t){if(t.hi||t.hiP)return;t.hiP=loadAny(['models/cars/'+t.k+'_hi.glb']).then(g=>{if(g)t.hi=prepHi(g);});}
// ---------- aparcar ----------
const VINST=new Map();// clave modelo|chunk -> {list:[car], im}
function pickVW(){let tot=0;for(const k in VTPL)tot+=VTPL[k].w;let a=Math.random()*tot;for(const k in VTPL){a-=VTPL[k].w;if(a<=0)return VTPL[k];}return null;}
function makeParked(x,z,yaw){const t=pickVW();if(!t)return makeCar(x,z,yaw,'proc');const lo=t.lo;const len=lo.boundingBox.max.z-lo.boundingBox.min.z;const y=surfY(x,z);
  const col=pick(PAINTCOL);const c={g:new THREE.Group(),body:null,bodyMesh:null,sw:null,swp:null,x,z,y,yaw,speed:0,vLat:0,yr:0,steer:0,wheelRot:0,roll:0,rollV:0,pitch:0,pitchV:0,fuel:R(20,90),wheels:[],
    seat:new V3(0.36,0.3,-0.1),eye:1.15,halfW:Math.min(0.92,(lo.boundingBox.max.x-lo.boundingBox.min.x)/2-0.1),len,kind:'vw',vt:t,col,searched:false,wreck:0,gear:0,shift:{gx:0,gz:0,held:null,pos:0},wheelR:0.33,lod:'lo',doorT:{FL:0,FR:0,RL:0,RR:0},trunkT:0};
  const key=t.k+'|'+chunkKey(x,z);let G=VINST.get(key);if(!G)VINST.set(key,G={t,list:[],key});c.ii=G.list.length;c.G=G;G.list.push(c);cars.push(c);return c;}
function buildVInst(){for(const G of VINST.values()){const im=new THREE.InstancedMesh(G.t.lo,vLoMat,G.list.length);G.list.forEach((c,i)=>{vSetInst(im,i,c);im.setColorAt(i,_c.set(c.col));});
    im.computeBoundingSphere();scene.add(im);G.im=im;const ch=getChunk(G.list[0].x,G.list[0].z,G.key.split('|')[1]);ch.meshes.push(im);im.userData.name='vwcar';}}
function vSetInst(im,i,c){_m.compose(_p.set(c.x,c.y,c.z),_q.setFromAxisAngle(UP,c.yaw),_s.set(1,1,1));im.setMatrixAt(i,_m);im.instanceMatrix.needsUpdate=true;}
// ---------- cerca: modelo completo ----------
let VACTIVE=[];
function activateCar(c){const T=c.vt.hi;if(!T)return false;const g=new THREE.Group();const body=new THREE.Group();body.position.y=0.5;g.add(body);const inner=T.scene.clone(true);inner.position.y=-0.5;body.add(inner);
  const paint=new Map();inner.traverse(o=>{if(!o.isMesh)return;if(o.material.name==='PAINT'){let m=paint.get(o.material);if(!m){m=o.material.clone();m.color.set(c.col);pbr(m);paint.set(o.material,m);}o.material=m;}});
  const N={};inner.traverse(o=>{if(o.name)N[o.name]=o;});c.N=N;
  // ruedas: pivote propio (gira y se orienta)
  g.updateMatrixWorld(true);c.wheels=[];for(const w of T.wheels){const src=N[w.name];if(!src)continue;const piv=new THREE.Group();piv.position.set(w.c.x,w.c.y,w.c.z);piv.rotation.order='YXZ';g.add(piv);piv.attach(src);c.wheels.push({node:piv,front:w.front});c.wheelR=w.r||0.33;}
  // volante del modelo: lo colgamos de un pivote con su eje
  if(T.sw&&N[T.sw.name]){const swp=new THREE.Group();swp.position.copy(T.sw.c).add(_v.set(0,-0.5,0));swp.quaternion.setFromUnitVectors(_v1.set(0,0,1),T.sw.ax);body.add(swp);const sw=new THREE.Group();swp.add(sw);body.updateMatrixWorld(true);sw.attach(N[T.sw.name]);c.swp=swp;c.sw=sw;c.swR=T.sw.r;}
  // selector del cambio en la consola
  c.knob=null;{const kb=new THREE.Group();const base=T.sw?new V3(0,0,T.sw.c.z-0.32):new V3(0,0,0.1);
    const rc=new THREE.Raycaster(new V3(base.x,1.02,base.z),new V3(0,-1,0),0,0.8);const meshes=[];inner.traverse(o=>{if(o.isMesh&&o.material!==vGlassMat)meshes.push(o);});inner.updateMatrixWorld(true);const hit=rc.intersectObjects(meshes,false)[0];
    const y=hit?hit.point.y:0.62;kb.position.set(base.x,y-0.5,base.z);const k=new THREE.Mesh(DSG_GEO,trimMat);kb.add(k);const bt=new THREE.Mesh(DSG_BOOT,trimMat);kb.add(bt);body.add(kb);c.knob=kb;c.knobPos=kb.position.clone();}
  g.position.set(c.x,c.y,c.z);g.rotation.y=c.yaw;scene.add(g);c.g=g;c.body=body;c.bodyMesh=inner;c.seat=T.seat.clone();c.eye=T.eye;c.halfW=T.halfW;c.len=T.len;c.lod='hi';c.T=T;
  for(const k in c.doorT)vDoorApply(c,k);vTrunkApply(c);
  if(c.G&&c.G.im){c.G.im.setMatrixAt(c.ii,ZM);c.G.im.instanceMatrix.needsUpdate=true;}VACTIVE.push(c);return true;}
function deactivateCar(c){if(c.lod!=='hi')return;scene.remove(c.g);c.g=new THREE.Group();c.body=null;c.sw=c.swp=null;c.knob=null;c.wheels=[];c.lod='lo';c.N=null;
  if(c.G&&c.G.im)vSetInst(c.G.im,c.ii,c);VACTIVE=VACTIVE.filter(x=>x!==c);}
function vDoorApply(c,k){const D=c.T&&c.T.doors[k];if(!D||!c.N)return;const t=c.doorT[k];const e=c.N[D.ext];if(e)e.quaternion.slerpQuaternions(D.q0e,D.q1e,t);const i=D.int&&c.N[D.int];if(i&&D.q0i)i.quaternion.slerpQuaternions(D.q0i,D.q1i,t);}
function vTrunkApply(c){const D=c.T&&c.T.trunk;if(!D||!c.N)return;const e=c.N[D.ext];if(e)e.quaternion.slerpQuaternions(D.q0e,D.q1e,c.trunkT);const i=D.int&&c.N[D.int];if(i&&D.q0i)i.quaternion.slerpQuaternions(D.q0i,D.q1i,c.trunkT);}
// punto de agarre (maneta) en el mundo para una apertura t
function vHandle(c,k,t,inside,out){const D=k==='T'?c.T.trunk:c.T.doors[k];const e=c.N[D.ext];const save=e.quaternion.clone();e.quaternion.slerpQuaternions(D.q0e,D.q1e,t);e.updateMatrixWorld(true);out.copy(inside&&D.hil?D.hil:D.hl);e.localToWorld(out);e.quaternion.copy(save);e.updateMatrixWorld(true);return out;}
// selector DSG: fuelle de cuero y pomo con la botonera
const DSG_GEO=mkG([[cy(0.016,0.02,0.07,0,0.035,0,10),0x1a1a1b],[ell(0.03,0.045,0.05,0,0.1,0.005,12),0x141415],[bx(0.036,0.012,0.04,0,0.142,-0.004),0x2a2b2d],[bx(0.012,0.006,0.012,-0.012,0.149,0.008),0xb8bcc0]]);
const DSG_BOOT=mkG([[cy(0.03,0.055,0.035,0,0.012,0,12),0x0e0e0f],[bx(0.11,0.006,0.15,0,0.0,0),0x232426]]);
// gestión cada poco: los cercanos pasan a modelo completo, los lejanos vuelven a instancia
let vT=0;
function stepVehicles(dt,p){vT-=dt;if(vT>0)return;vT=0.3;
  for(const c of cars){if(c.kind!=='vw')continue;const d=Math.hypot(c.x-p.x,c.z-p.z);
    if(c.lod==='lo'&&(d<(inVR?13:15)||Math.abs(c.speed)>0.05)){needHi(c.vt);if(c.vt.hi&&VACTIVE.length<6)activateCar(c);}
    else if(c.lod==='hi'&&d>28&&c!==P.inCar&&Math.abs(c.speed)<0.05){for(const k in c.doorT)c.doorT[k]=0;c.trunkT=0;deactivateCar(c);}}
  if(VACTIVE.length>6){VACTIVE.sort((a,b)=>Math.hypot(b.x-p.x,b.z-p.z)-Math.hypot(a.x-p.x,a.z-p.z));for(const c of VACTIVE.slice(0,VACTIVE.length-6))if(c!==P.inCar)deactivateCar(c);}}
// ---------- puertas y maletero con las manos (VR) o con «usar» (pantalla) ----------
const vGrab={left:null,right:null};const _vh=new V3(),_vh2=new V3();
function vehHandDoors(side,hp,down,held){let G=vGrab[side];const src=side==='left'?srcL:srcR;
  if(down&&!G){let best=null,bd=0.22;for(const c of VACTIVE){if(Math.abs(c.x-hp.x)>4||Math.abs(c.z-hp.z)>4)continue;const inside=P.inCar===c;
      for(const k of [...Object.keys(c.T.doors),...(c.T.trunk&&!inside?['T']:[])]){const t=k==='T'?c.trunkT:c.doorT[k];vHandle(c,k,t,inside&&k!=='T',_vh);const d=_vh.distanceTo(hp);if(d<bd){bd=d;best={c,k,inside};}}}
    if(best){G=vGrab[side]=best;haptic(src,0.45,35);sfx('click',0.5);if(best.k!=='T'&&best.c.doorT[best.k]<0.02)sfx('thud',0.25);}}
  if(!G)return false;if(!held){vGrab[side]=null;return true;}
  const c=G.c,k=G.k;const cur=k==='T'?c.trunkT:c.doorT[k];let bt=cur,bd=1e9;// apertura que deja la maneta más cerca de la mano
  for(let s=-6;s<=6;s++){const t=clamp(cur+s*0.03,0,1);vHandle(c,k,t,G.inside&&k!=='T',_vh2);const d=_vh2.distanceTo(hp);if(d<bd){bd=d;bt=t;}}
  if(bd>0.6){vGrab[side]=null;return true;}
  if(cur>0.02&&bt<=0.02){sfx('thud',0.6);haptic(src,0.8,60);}// portazo
  if(k==='T'){c.trunkT=bt;vTrunkApply(c);}else{c.doorT[k]=bt;vDoorApply(c,k);}return true;}
function vToggleDoor(c,k){c.vAnim=c.vAnim||{};const cur=k==='T'?c.trunkT:c.doorT[k];c.vAnim[k]=cur>0.5?0:1;sfx(cur>0.5?'thud':'click',0.6);}
function stepVehAnim(dt){for(const c of VACTIVE){if(!c.vAnim)continue;for(const k in c.vAnim){const tg=c.vAnim[k];const cur=k==='T'?c.trunkT:c.doorT[k];const n=cur+clamp(tg-cur,-dt*1.6,dt*1.6);
      if(k==='T'){c.trunkT=n;vTrunkApply(c);}else{c.doorT[k]=n;vDoorApply(c,k);}if(Math.abs(n-tg)<1e-3)delete c.vAnim[k];}}}
// puerta más cercana a un punto (para «usar»)
function vNearDoor(p){let best=null,bd=1.4;for(const c of VACTIVE){if(Math.abs(c.x-p.x)>4||Math.abs(c.z-p.z)>4)continue;for(const k of [...Object.keys(c.T.doors),...(c.T.trunk?['T']:[])]){const t=k==='T'?c.trunkT:c.doorT[k];vHandle(c,k,t,false,_vh);const d=Math.hypot(_vh.x-p.x,_vh.z-p.z);if(d<bd){bd=d;best={c,k};}}}return best;}
// choque con la caja del coche (rectángulo girado), para ti y para la gente
function carPush(pt,r){for(const c of cars){if(c===P.inCar)continue;const dx=pt.x-c.x,dz=pt.z-c.z;if(dx*dx+dz*dz>16)continue;const s=Math.sin(c.yaw),co=Math.cos(c.yaw);
    const lx=dx*co-dz*s,lz=dx*s+dz*co;const hx=c.halfW+r,hz=c.len/2+r;if(Math.abs(lx)>=hx||Math.abs(lz)>=hz)continue;
    let nx=lx,nz=lz;if(hx-Math.abs(lx)<hz-Math.abs(lz))nx=Math.sign(lx)*hx;else nz=Math.sign(lz)*hz;pt.x=c.x+nx*co+nz*s;pt.z=c.z-nx*s+nz*co;}}
