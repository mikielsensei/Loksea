// =====================================================================
// PESO Y GRAVEDAD de los objetos sueltos: los coches los arrollan y empujan (según su masa), al andar se patean los ligeros,
// y con la mano libre (izquierda, o la derecha sin arma) se cogen del suelo y se lanzan. Los contenedores ruedan si los embiste un coche.
// =====================================================================
const DYNDEF={caja2:{m:2,r:0.3,h:0.45},cajaPlana:{m:1,r:0.42,h:0.06},bolsas:{m:4,r:0.35,h:0.45},maleta:{m:9,r:0.33,h:0.35},casco:{m:1.3,r:0.16,h:0.26},carenado:{m:0.6,r:0.25,h:0.12},
  crate:{m:14,r:0.5,h:0.7},ropa:{m:0.8,r:0.3,h:0.06},rama:{m:3,r:0.5,h:0.2},pale:{m:20,r:0.6,h:0.15},papelera:{m:6,r:0.25,h:0.8,fixed:true},
  cont_resta:{m:140,r:0.95,h:1.6,cont:true},cont_organica:{m:140,r:0.95,h:1.6,cont:true},cont_envasos:{m:110,r:0.95,h:1.6,cont:true},cont_paper:{m:110,r:0.95,h:1.6,cont:true},cont_vidre:{m:160,r:0.95,h:1.6,cont:true}};
const DYN=[];let dynFrame=0;const DYN_MAX=70;
const _dv1=new V3(),_dv2=new V3(),_dq1=new Q4(),_de=new THREE.Euler();
// listas de instancias cerca de un punto (zona normal y zonas de interior)
function dynLists(name,x,z){const I=INST[name];if(!I||!I.byKey)return[];const out=[];const k1=Math.floor((x-XMIN)/CHUNK)+'_'+Math.floor((z-ZMIN)/CHUNK);if(I.lists.has(k1))out.push([k1,I.lists.get(k1)]);
  const ix=Math.floor((x-XMIN)/CHUNKI),iz=Math.floor((z-ZMIN)/CHUNKI);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const k=(ix+a)+'_'+(iz+b)+'_i';if(I.lists.has(k))out.push([k,I.lists.get(k)]);}return out;}
function dynEach(x,z,rad,fn){for(const name in DYNDEF){const D=DYNDEF[name];if(D.fixed)continue;for(const [key,L] of dynLists(name,x,z))for(let i=0;i<L.length;i++){const t=L[i];if(t.dyn||t[4]<0.01)continue;const dx=t[0]-x,dz=t[2]-z;if(dx*dx+dz*dz<(rad+D.r)*(rad+D.r)&&fn(name,key,i,t,D)===true)return;}}}
// pasa una instancia a cuerpo con física
function dynActivate(name,key,i,vel){const I=INST[name],t=I.lists.get(key)[i],D=DYNDEF[name];t.dyn=1;hideInst([name,key,i]);
  let mat=I.mat;if(t[10]!==undefined){mat=I.mat.clone();mat.color=new THREE.Color(t[10]);}
  const o=new THREE.Mesh(I.geo,mat);o.position.set(t[0],t[1],t[2]);o.quaternion.setFromEuler(_de.set(t[9]||0,t[3],t[11]||0,'YXZ'));o.scale.set(t[4],t[5],t[6]);scene.add(o);
  if(t.vol){removeVol(t.vol);t.vol=null;}
  const b={o,v:(vel||new V3()).clone(),av:new V3(),m:D.m,r:D.r,h:D.h,cont:!!D.cont,rest:0,held:null,name};DYN.push(b);
  if(DYN.length>DYN_MAX){const k=DYN.findIndex(d=>d.rest>3&&!d.held);if(k>=0){scene.remove(DYN[k].o);DYN.splice(k,1);}}return b;}
function dynImpulse(b,vx,vy,vz){b.v.x+=vx;b.v.y+=vy;b.v.z+=vz;b.rest=0;const s=Math.hypot(vx,vz)*(b.cont?0.3:2.2)/Math.max(0.3,b.r);b.av.x+=R(-1,1)*s;b.av.y+=R(-1,1)*s*0.5;b.av.z+=R(-1,1)*s;}
const _dpp=new V3(),_dpv=new V3();let _dpInit=false;
function stepDyn(dt,p){dynFrame++;if(p){if(!_dpInit){_dpp.copy(p);_dpInit=true;}_dpv.subVectors(p,_dpp).divideScalar(Math.max(dt,1e-3));_dpv.y=0;if(_dpv.length()>12)_dpv.set(0,0,0);_dpp.copy(p);}
  // coches en marcha: arrollan lo que pillan (impulso según masas)
  for(const c of cars){const sp=Math.abs(c.speed||0);if(sp<1.2)continue;const s=Math.sin(c.yaw),co=Math.cos(c.yaw);const vx=s*c.speed+co*(c.vLat||0),vz=co*c.speed-s*(c.vLat||0);const Mc=c.kind==='moto'?180:1200;
    const hit=(bx,bz,r)=>{const dx=bx-c.x,dz=bz-c.z;const lx=dx*co-dz*s,lz=dx*s+dz*co;return Math.abs(lx)<c.halfW+r&&Math.abs(lz)<c.len/2+r;};
    dynEach(c.x,c.z,c.len*0.6+2,(name,key,i,t,D)=>{if(!hit(t[0],t[2],D.cont?D.r*1.25+0.35+sp*0.04:D.r*0.8))return;const k=2*Mc/(Mc+D.m);const b=dynActivate(name,key,i);dynImpulse(b,vx*k*0.75,D.cont?0:Math.min(5,sp*0.35)+1,vz*k*0.75);c.speed*=1-Math.min(0.5,D.m/(Mc+D.m));if(D.m>20)sfx('crash',clamp(sp/15,0.2,0.8)*volAt(t[0],t[2],40));});
    for(const b of DYN){if(b.held)continue;const q=b.o.position;if(Math.abs(q.x-c.x)>4||Math.abs(q.z-c.z)>4||!hit(q.x,q.z,b.r*0.8))continue;const rel=Math.hypot(vx-b.v.x,vz-b.v.z);if(rel<0.8)continue;const k=2*Mc/(Mc+b.m);
      dynImpulse(b,(vx-b.v.x)*k*0.6,b.cont?0:Math.min(3,rel*0.25),(vz-b.v.z)*k*0.6);c.speed*=1-Math.min(0.4,b.m/(Mc+b.m));}}
  // a pie: lo ligero se patea al pasar
  if(dynFrame%2===0&&!P.inCar&&p){const pv=_dpv;const spd=Math.hypot(pv.x||0,pv.z||0);if(spd>0.6){dynEach(p.x,p.z,0.35,(name,key,i,t,D)=>{if(D.m>5)return;const b=dynActivate(name,key,i);dynImpulse(b,pv.x*1.3/Math.sqrt(D.m),0.8,pv.z*1.3/Math.sqrt(D.m));sfx('thud',0.25);return true;});
    for(const b of DYN){if(b.held||b.m>5)continue;const q=b.o.position;const dx=q.x-p.x,dz=q.z-p.z;if(dx*dx+dz*dz<(0.35+b.r)**2&&b.rest>0.2)dynImpulse(b,pv.x*1.2/Math.sqrt(b.m),0.6,pv.z*1.2/Math.sqrt(b.m));}}}
  // integración
  for(let i=DYN.length-1;i>=0;i--){const b=DYN[i];const o=b.o;if(b.held){continue;}if(b.rest>1.5)continue;
    b.v.y-=9.81*dt;const ox=o.position.x,oz=o.position.z;o.position.addScaledVector(b.v,dt);
    // paredes y muebles: rebota y pierde energía
    _cp.x=o.position.x;_cp.z=o.position.z;if(collide(_cp,b.r*0.7,o.position.y+0.05,o.position.y+Math.max(0.1,b.h))){const nx=_cp.x-o.position.x,nz=_cp.z-o.position.z,l=Math.hypot(nx,nz)||1;o.position.x=_cp.x;o.position.z=_cp.z;const vn=(b.v.x*nx+b.v.z*nz)/l;if(vn<0){b.v.x-=1.4*vn*nx/l;b.v.z-=1.4*vn*nz/l;}if(Math.abs(vn)>2&&b.m>5)sfx('thud',clamp(Math.abs(vn)/6,0.2,0.8)*volAt(ox,oz,20));}
    const gy=surfY(o.position.x,o.position.z,o.position.y-0.2)+0.005;
    if(o.position.y<=gy){o.position.y=gy;if(b.v.y<-1.2&&b.m>1.5)sfx('thud',clamp(-b.v.y/6,0.15,0.8)*volAt(o.position.x,o.position.z,18));b.v.y=b.v.y<-0.5?-b.v.y*(b.cont?0.1:0.28):0;
      const fr=Math.pow(b.cont?0.35:0.05,dt);b.v.x*=fr;b.v.z*=fr;b.av.multiplyScalar(Math.pow(0.02,dt));
      // asentarse: vuelve a apoyarse plano (se conserva el rumbo)
      _de.setFromQuaternion(o.quaternion,'YXZ');const fx=Math.abs(_de.x)>0.8?Math.sign(_de.x)*Math.PI/2:0,fz=b.cont?0:(Math.abs(_de.z)>0.8?Math.sign(_de.z)*Math.PI/2:0);_dq1.setFromEuler(_de.set(fx,_de.y,fz,'YXZ'));o.quaternion.slerp(_dq1,Math.min(1,dt*4));
      if(Math.hypot(b.v.x,b.v.z)<0.06&&Math.abs(b.v.y)<0.05)b.rest+=dt;else b.rest=0;}
    else b.rest=0;
    if(b.av.lengthSq()>1e-4){_dq1.setFromEuler(_de.set(b.av.x*dt,b.av.y*dt,b.av.z*dt));o.quaternion.multiply(_dq1);}
    if(b.rest>1.5&&b.cont){const s=o.scale;b.vol=addOBB(o.position.x,o.position.z,0.95*s.x,0.82*s.z,_de.setFromQuaternion(o.quaternion,'YXZ').y,o.position.y,o.position.y+1.6);}}}
// el coche choca con algo: si es un contenedor u objeto suelto, se lo lleva por delante en vez de frenar en seco
function dynCarBlock(car,nx,nz){const s=Math.sin(car.yaw),co=Math.cos(car.yaw);const sp=Math.abs(car.speed);const vx=s*car.speed,vz=co*car.speed;const Mc=car.kind==='moto'?180:1200;let any=false;
  dynEach(nx,nz,car.len*0.6+2,(name,key,i,t,D)=>{const dx=t[0]-nx,dz=t[2]-nz;const lx=dx*co-dz*s,lz=dx*s+dz*co;if(Math.abs(lx)>car.halfW+D.r*1.3+0.2||Math.abs(lz)>car.len/2+D.r*1.3+0.6)return;
    const k=2*Mc/(Mc+D.m);const b=dynActivate(name,key,i);dynImpulse(b,vx*k*0.7,D.cont?0.3:Math.min(5,sp*0.35)+1,vz*k*0.7);car.speed*=1-Math.min(0.5,D.m/(Mc+D.m));any=true;if(D.m>20)sfx('crash',clamp(sp/15,0.2,0.8)*volAt(t[0],t[2],40));});
  return any;}
// disparo: empuja lo suelto que encuentre la bala (devuelve la distancia del impacto o -1)
const _ro=new V3();function dynShot(o,d,tmax){let best=-1,bt=tmax,bb=null,bi=null;
  const hitS=(cx,cy,cz,r)=>{_ro.set(cx-o.x,cy-o.y,cz-o.z);const t=_ro.dot(d);if(t<0||t>bt)return -1;const d2=_ro.lengthSq()-t*t;return d2<r*r?t:-1;};
  for(const b of DYN){if(b.held)continue;const q=b.o.position;const t=hitS(q.x,q.y+b.h*0.5,q.z,Math.max(0.15,b.r*0.7));if(t>=0&&t<bt){bt=t;bb=b;bi=null;}}
  for(let s=0;s<Math.min(tmax,40);s+=1.5){const x=o.x+d.x*s,z=o.z+d.z*s;dynEach(x,z,0.8,(name,key,i,t,D)=>{if(D.m>40)return;const tt=hitS(t[0],t[1]+D.h*0.5,t[2],Math.max(0.15,D.r*0.7));if(tt>=0&&tt<bt){bt=tt;bi=[name,key,i];bb=null;}});}
  if(bi)bb=dynActivate(...bi);if(bb){const k=5/Math.sqrt(bb.m);dynImpulse(bb,d.x*k,d.y*k+0.6,d.z*k);best=bt;}return best;}
// coger con la mano (VR): devuelve el cuerpo agarrado
function dynGrab(handP){let best=null,bd=0.32;for(const b of DYN){if(b.held||b.m>16)continue;const d=b.o.position.distanceTo(handP)-b.r*0.5;if(d<bd){bd=d;best=b;}}
  if(!best){let pick=null,pd=0.45;dynEach(handP.x,handP.z,0.4,(name,key,i,t,D)=>{if(D.m>16||D.cont)return;const d=Math.hypot(t[0]-handP.x,t[2]-handP.z,(t[1]+D.h*0.5)-handP.y);if(d<pd){pd=d;pick=[name,key,i];}});if(pick)best=dynActivate(...pick);}
  if(best){best.held=true;best.rest=0;}return best;}
function dynHold(b,handP,handQ,dt){const o=b.o;b.v.subVectors(handP,o.position).divideScalar(Math.max(dt,0.008));o.position.copy(handP);if(handQ)o.quaternion.slerp(handQ,Math.min(1,dt*12));}
function dynThrow(b,vel){b.held=false;b.v.copy(vel).multiplyScalar(1/Math.max(1,Math.sqrt(b.m)*0.5));b.av.set(R(-6,6),R(-6,6),R(-6,6));b.rest=0;}
