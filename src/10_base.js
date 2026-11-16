// =====================================================================
// MUNDO: Eixample de Barcelona. x = paralelo al mar (este +), z = hacia el mar (+). Sube suave hacia la montaña.
// =====================================================================
const BP=113.3;// distancia entre ejes de calles de Cerdà
const NXS=6,NZS=5;// calles jugables
const SX0=-2.5*BP,SZ0=-2*BP;// eje de la primera calle
const XMIN=SX0-40,XMAX=SX0+(NXS-1)*BP+40,ZMIN=SZ0-40,ZMAX=SZ0+(NZS-1)*BP+40;
const H=(x,z)=>-z*0.012;
// =====================================================================
// COLISIONES 3D: cajas y prismas convexos con altura
// =====================================================================
const VOL=[],VG=new Map(),VCG=16,VEMPTY=[];
const vk=(i,j)=>i*10007+j;
function insertVol(v){VOL.push(v);const i0=Math.floor((v.x0-2.5)/VCG),i1=Math.floor((v.x1+2.5)/VCG),j0=Math.floor((v.z0-2.5)/VCG),j1=Math.floor((v.z1+2.5)/VCG);
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
function addInst(name,x,y,z,yaw,sx=1,sy=1,sz=1,k=0,lit=0,pitch=0,col){const I=INST[name];const key=I.global?'g':chunkKey(x,z);let L=I.lists.get(key);if(!L)I.lists.set(key,L=[]);L.push([x,y,z,yaw,sx,sy,sz,k,lit,pitch,col]);return[name,key,L.length-1];}
const instMeshes=[];const _eu=new THREE.Euler();
function buildInst(){for(const name in INST){const I=INST[name];for(const [key,L] of I.lists){const im=new THREE.InstancedMesh(I.geo,I.mat,L.length);const off=new Float32Array(L.length*2),lit=new Float32Array(L.length);
      L.forEach((t,i)=>{_eu.set(t[9],t[3],0,'YXZ');_m.compose(_p.set(t[0],t[1],t[2]),_q.setFromEuler(_eu),_s.set(t[4],t[5],t[6]));im.setMatrixAt(i,_m);const o=atlasOff(t[7],I.cols,I.rows);off[i*2]=o[0];off[i*2+1]=o[1];lit[i]=t[8];if(t[10]!==undefined)im.setColorAt(i,_c.set(t[10]));});
      if(I.mat.userData.atlas){im.geometry=I.geo.clone();im.geometry.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,2));im.geometry.setAttribute('aLit',new THREE.InstancedBufferAttribute(lit,1));}
      im.computeBoundingSphere();scene.add(im);im.userData.name=name;im.userData.list=L;
      if(key==='g')instMeshes.push(im);else{const c=chunks.get(key)||getChunk(L[0][0],L[0][2],key);c.meshes.push(im);}
      I.meshes=I.meshes||[];I.meshes.push(im);I.byKey=I.byKey||{};I.byKey[key]=im;}}}
function instRef(name,x,z){const I=INST[name];const key=I.global?'g':chunkKey(x,z);const L=I.lists.get(key);return[name,key,L?L.length-1:0];}
function hideInst(ref){const I=INST[ref[0]];const im=I.byKey&&I.byKey[ref[1]];if(!im)return;im.setMatrixAt(ref[2],ZM);im.instanceMatrix.needsUpdate=true;}

