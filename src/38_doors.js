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
