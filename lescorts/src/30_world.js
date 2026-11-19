// =====================================================================
// LES CORTS: mundo construido con los datos reales del AMB (IFC + ortofoto 2021): calzada, aceras con bordillo,
// terreno con sus cuestas, edificios con su huella y altura, árboles y farolas en su sitio, marcas viales de la ortofoto.
// =====================================================================
const BLOCKS=[],CARSPOTS=[],LOOT=[],TOILETS=[],FOUNTAINS=[],BEDS=[],SHOPS=[],BASES=[],MOTOS=[];
const VSTR=[],HSTR=[];const CHAMF=0;let POIS=[];
const MAPD={roads:[],blocks:[],shops:[],pois:[],peds:[]};
const solidBox=(x,z,hw,hd,yaw,y0,y1)=>addOBB(x,z,hw,hd,yaw,y0,y1);
function centroid(P){let x=0,z=0;for(const p of P){x+=p[0];z+=p[1];}return[x/P.length,z/P.length];}
function polyArea(P){let a=0;for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length];a+=p[0]*q[1]-q[0]*p[1];}return a/2;}
function setupSmoke(){}function stepSmoke(){}
defInst('armari',new THREE.BoxGeometry(0.5,1.55,0.4).translate(0,0.775,0),paintMat,1,1,false);
const LC_SPAWN={x:-37,z:1.5,dx:0.77,dz:-0.64};// esquina Travessera de les Corts / Vallespir, mirando hacia Numància
const PAINTW=0xf2f1ea,PAINTY=0xe8b820;
let WD=null,MARKS=null,KERBS=[],CUSTOM=null;const BCOL=[];
async function loadWorldData(){setLoad('w','Descargando Les Corts (datos del AMB)…');
  const [w,hb,mk,kb,sp,shp,cus,bcol]=await Promise.all([fetch('data/world.json').then(r=>r.json()),fetch('data/hm.bin').then(r=>r.arrayBuffer()),fetch('data/lanesfinal.json').then(r=>r.json()),fetch('data/kerbs.json').then(r=>r.json()),fetch('data/spots.json').then(r=>r.json()),fetch('data/shops.json').then(r=>r.json()).catch(()=>[]),fetch('data/custom.json').then(r=>r.json()).catch(()=>({add:[],styles:[],shops:[]})),fetch('data/bcolors.json').then(r=>r.json()).catch(()=>({}))]);CUSTOM=cus;for(const k in bcol){const [x,z]=k.split(',').map(Number);BCOL.push([x,z,bcol[k]]);}SPOTS=sp;
  {const TM={mercat:'fruteria',super:'super',taller:'ferre',mobles:'electro',floristeria:'fruteria',drogueria:'farmacia',clinica:'farmacia',joieria:'optica',oficina:'immo',motos:'electro'};POIS=shp.concat(cus.shops||[]).map(q=>[q[0],q[1],TM[q[2]]||q[2],q[3]]);}
  // edificios que faltan en el modelo del AMB (vistos en tus fotos): sustituyen a los trozos que hubiera dentro
  {const inside=(p,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
    for(const A of cus.add||[]){w.build=w.build.filter(b=>!inside(centroid(b.r),A.r));const c=centroid(A.r);const y0=H0(c[0],c[1]);w.build.push({r:A.r,h:[],y0,y1:y0+A.h,rc:[150,90,70],sty:A.sty,name:A.name});}}
  const hd=new DataView(hb);const x0=hd.getFloat32(0,true),z0=hd.getFloat32(4,true),res=hd.getFloat32(8,true),nx=hd.getInt32(16,true),nz=hd.getInt32(20,true);
  const u16=new Uint16Array(hb,24,nx*nz);const h=new Float32Array(nx*nz);for(let i=0;i<h.length;i++)h[i]=u16[i]/100-10;
  HMD={x0,z0,res,nx,nz,h,k:new Uint8Array(hb,24+nx*nz*2,nx*nz)};WD=w;MARKS=mk;KERBS=kb;prepVados();
  for(const [k,f,sc,rot] of [['papelera','papelera',1.0,0],['armari','armari',1.0,0]]){try{const g=await gl.loadAsync('models/props/'+f+'.glb');const G=propGeo(g.scene,k==='papelera'?1.05:1.55);if(G){INST[k].geo=G.geo;INST[k].mat=G.mat;}}catch(e){console.warn('prop',k,e);}}}
// un modelo de la comunidad convertido en una geometría por instancias (alto real en metros, apoyado en el suelo)
function propGeo(root,height){root.updateMatrixWorld(true);const parts=[],mats=[];root.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.clone();for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);g.applyMatrix4(o.matrixWorld);if(g.index)g=g.toNonIndexed();parts.push(g);const m=o.material.clone();if(m.map)m.map.anisotropy=4;mats.push(pbr(m));});
  if(!parts.length)return null;const geo=mergeGeometries(parts,true);geo.computeBoundingBox();const b=geo.boundingBox;const s=height/(b.max.y-b.min.y);geo.translate(-(b.min.x+b.max.x)/2,-b.min.y,-(b.min.z+b.max.z)/2);geo.scale(s,s,s);geo.computeBoundingSphere();return{geo,mat:mats.length>1?mats:mats[0]};}
// ---------- materiales propios ----------
const texPaint=cTex(256,256,(g,w,h)=>{g.fillStyle='#ecebe4';g.fillRect(0,0,w,h);const d=g.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const n=Math.random();const v=n<0.06?-60:n<0.2?-22:0;d.data[i]+=v;d.data[i+1]+=v;d.data[i+2]+=v;}g.putImageData(d,0,0);});
MATS.asphalt=photoMat('asphalt',{ns:0.6,color:0x5c5c5c,roughness:0.92});MATS.asphaltc=photoMat('asphalt_cracked',{ns:0.6,color:0x666666});
MATS.panot4=photoMat('panot4',{ns:1.0,color:0xc4c2be});MATS.panotflor=photoMat('panotflor',{ns:1.0,color:0xc8c8c8});MATS.panotbotons=photoMat('panotbotons',{ns:1.2});
MATS.granite=photoMat('granite',{ns:0.6,roughness:0.75});MATS.concrete=MATS.concrete||photoMat('concrete',{ns:0.5});MATS.llambordes=photoMat('llambordes',{ns:1.0});MATS.rust=photoMat('rust',{ns:0.9,roughness:0.75,metalness:0.35});
MATS.darkglass=pbr(new THREE.MeshStandardMaterial({color:0x2a3036,roughness:0.06,metalness:0.55,vertexColors:true,envMapIntensity:1.2}));
MATS.paint=new THREE.MeshLambertMaterial({map:texPaint,vertexColors:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
const orthoTex=texLoader.load('data/ortho.jpg');orthoTex.colorSpace=THREE.SRGBColorSpace;orthoTex.anisotropy=4;
MATS.ortho=pbr(new THREE.MeshStandardMaterial({map:orthoTex,vertexColors:true,roughness:0.95,metalness:0}));
const OU=(x,z)=>[(x+350.69)/701.38,1-(z+234.8)/469.6];// uv de la ortofoto (flipY de three)
// ---------- suelo ----------
function triInto(mat,A,B,C,nUp,uvf,dy=0){const cx=(A[0]+B[0]+C[0])/3,cz=(A[2]+B[2]+C[2])/3;const b=bufOf(cx,cz,mat);
  const e1=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],e2=[C[0]-A[0],C[1]-A[1],C[2]-A[2]];let n=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];const l=Math.hypot(...n)||1;n=n.map(v=>v/l);
  let P=[A,B,C];if(nUp&&n[1]<0){P=[A,C,B];n=n.map(v=>-v);}
  for(const q of P){const uv=uvf(q,n);pushV(b,q[0],q[1]+dy,q[2],n[0],n[1],n[2],uv[0],uv[1]);}return n;}
function buildGroundLC(){const us=US('asphalt'),up=US('panot4'),ug=US('granite');
  const M=(o)=>{const v=o.v,f=o.f;const V=i=>[v[i*3],v[i*3+1],v[i*3+2]];return{V,f};};
  {const {V,f}=M(WD.calzada);TINT=[1,1,1];for(let i=0;i<f.length;i+=3)triInto('asphalt',V(f[i]),V(f[i+1]),V(f[i+2]),true,q=>[q[0]*us,q[2]*us]);}
  {const {V,f}=M(WD.vorera);for(let i=0;i<f.length;i+=3){const A=V(f[i]),B=V(f[i+1]),C=V(f[i+2]);
      const e1=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],e2=[C[0]-A[0],C[1]-A[1],C[2]-A[2]];const ny=e1[2]*e2[0]-e1[0]*e2[2],l=Math.hypot(e1[1]*e2[2]-e1[2]*e2[1],ny,e1[0]*e2[1]-e1[1]*e2[0])||1;
      if(Math.abs(ny/l)>0.5){TINT=[0.97,0.96,0.94];for(const t of subdivNear(A,B,C))triInto('panot4',...t.map(q=>[q[0],q[1]+raiseAt(q[0],q[2]),q[2]]),true,q=>[q[0]*up,q[2]*up]);}
      else{TINT=[0.92,0.91,0.89];triInto('granite',...[A,B,C].map(q=>[q[0],q[1]+KERBH,q[2]]),false,(q,n)=>{const s=Math.abs(n[0])>Math.abs(n[2])?q[2]:q[0];return[s*ug,q[1]*ug];});}}TINT=[1,1,1];}
  {const {V,f}=M(WD.terreny);for(let i=0;i<f.length;i+=3){const A=V(f[i]),B=V(f[i+1]),C=V(f[i+2]);const cx=(A[0]+B[0]+C[0])/3,cz=(A[2]+B[2]+C[2])/3;const k=groundKind(cx,cz);if(k===2||k===3)continue;
      triInto('ortho',...[A,B,C].map(q=>[q[0],q[1]+KERBH,q[2]]),true,q=>OU(q[0],q[2]),-0.03);}}
  buildKerbs();
  // suelo lejano (fuera de la hoja): asfalto plano
  {const g=new THREE.PlaneGeometry(2400,2400);g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0x4a4a48}));m.position.y=-4;scene.add(m);}}
// vados: donde un paso de peatones (cuadros o cebra) toca el bordillo
function prepVados(){VADOG=new Map();const cr=[];for(const q of MARKS.quads){const e1=Math.hypot(q[1][0]-q[0][0],q[1][1]-q[0][1]),e2=Math.hypot(q[2][0]-q[1][0],q[2][1]-q[1][1]);const mn=Math.min(e1,e2),mx=Math.max(e1,e2);
    if((mn>0.3&&mn<0.65&&mx<0.75)||(mn>0.4&&mn<0.65&&mx>1.8&&mx<6.5))cr.push([(q[0][0]+q[2][0])/2,(q[0][1]+q[2][1])/2]);}
  const G=new Map();for(const c of cr){const k=Math.floor(c[0]/3)*10007+Math.floor(c[1]/3);let L=G.get(k);if(!L)G.set(k,L=[]);L.push(c);}
  const near=(x,z,r)=>{const i=Math.floor(x/3),j=Math.floor(z/3);for(let a=i-1;a<=i+1;a++)for(let b=j-1;b<=j+1;b++){const L=G.get(a*10007+b);if(L)for(const c of L)if(Math.hypot(c[0]-x,c[1]-z)<r)return true;}return false;};
  for(const K of KERBS){for(let i=0;i<K.p.length-1;i++){const a=K.p[i],b=K.p[i+1];const L=Math.hypot(b[0]-a[0],b[2]-a[2]);for(let t=0;t<=L;t+=0.5){const x=a[0]+(b[0]-a[0])*t/L,z=a[2]+(b[2]-a[2])*t/L;
        if(near(x,z,2.2)){const k=Math.floor(x/4)*10007+Math.floor(z/4);let Q=VADOG.get(k);if(!Q)VADOG.set(k,Q=[]);Q.push([x,z]);}}}}}
// triángulos de acera cerca de un vado: se trocean para que la rampa se vea
function subdivNear(A,B,C){const cx=(A[0]+B[0]+C[0])/3,cz=(A[2]+B[2]+C[2])/3;const r=Math.max(Math.hypot(A[0]-cx,A[2]-cz),Math.hypot(B[0]-cx,B[2]-cz),Math.hypot(C[0]-cx,C[2]-cz));
  if(vadoD(cx,cz)>r+2.5)return[[A,B,C]];const out=[];const rec=(a,b,c,d)=>{const l=Math.max(Math.hypot(a[0]-b[0],a[2]-b[2]),Math.hypot(b[0]-c[0],b[2]-c[2]),Math.hypot(c[0]-a[0],c[2]-a[2]));
    if(l<0.7||d>7){out.push([a,b,c]);return;}const m=(p,q)=>[(p[0]+q[0])/2,(p[1]+q[1])/2,(p[2]+q[2])/2];const ab=m(a,b),bc=m(b,c),ca=m(c,a);rec(a,ab,ca,d+1);rec(ab,b,bc,d+1);rec(ca,bc,c,d+1);rec(ab,bc,ca,d+1);};rec(A,B,C,0);return out;}
// bordillo de granito (cara vista + canto achaflanado), rigola de hormigón en la calzada y, en los vados, panot de botones
function buildKerbs(){const ug=US('granite'),uc=US('concrete'),ub=US('panotbotons');
  const quad=(mat,P,uvf,n)=>{const b=bufOf((P[0][0]+P[2][0])/2,(P[0][2]+P[2][2])/2,mat);for(const t of [[0,1,2],[0,2,3]]){let T=t.map(i=>P[i]);
      const e1=[T[1][0]-T[0][0],T[1][1]-T[0][1],T[1][2]-T[0][2]],e2=[T[2][0]-T[0][0],T[2][1]-T[0][1],T[2][2]-T[0][2]];let nn=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
      if(nn[0]*n[0]+nn[1]*n[1]+nn[2]*n[2]<0){T=[T[0],T[2],T[1]];}const l=Math.hypot(...nn)||1;for(const v of T){const uv=uvf(v);pushV(b,v[0],v[1],v[2],n[0],n[1],n[2],uv[0],uv[1]);}}};
  for(const K of KERBS){const P=K.p;for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];const dx=b[0]-a[0],dz=b[2]-a[2],L=Math.hypot(dx,dz);if(L<0.03)continue;
      // troceo a 0,5 m para que la altura siga el vado
      const nseg=Math.max(1,Math.ceil(L/0.5));const nx=dz/L*K.s,nz=-dx/L*K.s;
      for(let s=0;s<nseg;s++){const t0=s/nseg,t1=(s+1)/nseg;const p0=[a[0]+dx*t0,0,a[2]+dz*t0],p1=[a[0]+dx*t1,0,a[2]+dz*t1];
        const r0=K.ry[i]+(K.ry[i+1]-K.ry[i])*t0,r1=K.ry[i]+(K.ry[i+1]-K.ry[i])*t1;const g0=a[1]+(b[1]-a[1])*t0,g1=a[1]+(b[1]-a[1])*t1;
        const h0=raiseAt(p0[0],p0[2]),h1=raiseAt(p1[0],p1[2]);const vado=h0<KERBH*0.6||h1<KERBH*0.6;
        TINT=[0.86,0.85,0.82];// cara vista
        quad('granite',[[p0[0],r0-0.02,p0[2]],[p1[0],r1-0.02,p1[2]],[p1[0],g1+h1,p1[2]],[p0[0],g0+h0,p0[2]]],v=>[(v[0]*nz-v[2]*nx)*ug,v[1]*ug],[nx,0,nz]);
        // canto (20 cm) o panot de botones (1,2 m) en el vado
        const w=vado?1.2:0.2;const col=vado?[0.75,0.62,0.58]:[0.9,0.89,0.86];TINT=col;
        const q0=[p0[0]-nx*w,0,p0[2]-nz*w],q1=[p1[0]-nx*w,0,p1[2]-nz*w];
        quad(vado?'panotbotons':'granite',[[p0[0],g0+h0+0.006,p0[2]],[p1[0],g1+h1+0.006,p1[2]],[q1[0],H0(q1[0],q1[2])+raiseAt(q1[0],q1[2])+0.006,q1[2]],[q0[0],H0(q0[0],q0[2])+raiseAt(q0[0],q0[2])+0.006,q0[2]]],v=>[v[0]*(vado?ub:ug),v[2]*(vado?ub:ug)],[0,1,0]);
        // rigola
        TINT=[0.82,0.81,0.78];const e0=[p0[0]+nx*0.3,0,p0[2]+nz*0.3],e1=[p1[0]+nx*0.3,0,p1[2]+nz*0.3];
        quad('concrete',[[p0[0],r0+0.004,p0[2]],[p1[0],r1+0.004,p1[2]],[e1[0],r1+0.012,e1[2]],[e0[0],r0+0.012,e0[2]]],v=>[v[0]*uc,v[2]*uc],[0,1,0]);}}}
  TINT=[1,1,1];}
// ---------- transición acera-calzada: canto del bordillo de granito (arriba) y rigola de hormigón (abajo, en la calzada) ----------
function kerbFace(A,B,C,n){const hl=Math.hypot(n[0],n[2]);if(hl<0.5)return;let nx=n[0]/hl,nz=n[2]/hl;const V=[A,B,C].sort((p,q)=>p[1]-q[1]);
  const mx=(A[0]+B[0]+C[0])/3,mz=(A[2]+B[2]+C[2])/3;if(groundKind(mx+nx*0.6,mz+nz*0.6)!==2){if(groundKind(mx-nx*0.6,mz-nz*0.6)!==2)return;nx=-nx;nz=-nz;}
  const lo=Math.abs(V[0][1]-V[1][1])<0.05,hi=Math.abs(V[1][1]-V[2][1])<0.05;
  if(lo){const p=V[0],q=V[1];if(Math.hypot(p[0]-q[0],p[2]-q[2])<0.05)return;// rigola: franja de 30 cm de hormigón claro con caída hacia el bordillo
    const b=bufOf(mx,mz,'concrete');TINT=[0.86,0.85,0.82];const w=0.3,us=US('concrete');const P=[[p[0],p[1]+0.008,p[2]],[q[0],q[1]+0.008,q[2]],[q[0]+nx*w,H(q[0]+nx*w,q[2]+nz*w)+0.012,q[2]+nz*w],[p[0]+nx*w,H(p[0]+nx*w,p[2]+nz*w)+0.012,p[2]+nz*w]];
    for(const t of [[0,1,2],[0,2,3]]){let T=t.map(i=>P[i]);const cr=(T[1][0]-T[0][0])*(T[2][2]-T[0][2])-(T[1][2]-T[0][2])*(T[2][0]-T[0][0]);if(cr>0)T=[T[0],T[2],T[1]];for(const v of T)pushV(b,v[0],v[1],v[2],0,1,0,v[0]*us,v[2]*us);}}
  if(hi){const p=V[1],q=V[2];if(Math.hypot(p[0]-q[0],p[2]-q[2])<0.05)return;// canto superior del bordillo (20 cm de granito, achaflanado)
    const b=bufOf(mx,mz,'granite');TINT=[0.88,0.87,0.84];const w=0.2,ug=US('granite');const P=[[p[0]+nx*0.012,p[1]-0.01,p[2]+nz*0.012],[q[0]+nx*0.012,q[1]-0.01,q[2]+nz*0.012],[q[0]-nx*w,q[1]+0.006,q[2]-nz*w],[p[0]-nx*w,p[1]+0.006,p[2]-nz*w]];
    for(const t of [[0,1,2],[0,2,3]]){let T=t.map(i=>P[i]);const cr=(T[1][0]-T[0][0])*(T[2][2]-T[0][2])-(T[1][2]-T[0][2])*(T[2][0]-T[0][0]);if(cr>0)T=[T[0],T[2],T[1]];for(const v of T)pushV(b,v[0],v[1],v[2],0,1,0,v[0]*ug,v[2]*ug);}}
  TINT=[0.92,0.91,0.89];}
// ---------- marcas viales sacadas de la ortofoto ----------
// pintura vial limpia: cada marca es un cuadrilátero (líneas de punta a punta, discontinuas con su ritmo, pasos, cebreados)
const tex30=cTex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#f2f1ea';g.lineWidth=18;g.beginPath();g.arc(128,128,112,0,7);g.stroke();g.fillStyle='#f2f1ea';g.font='bold 120px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('30',128,136);},{});
const mat30=new THREE.MeshLambertMaterial({map:tex30,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-6});
function buildMarks(){TINT=hexTint(PAINTW);for(const q of MARKS.quads){const c=[(q[0][0]+q[2][0])/2,(q[0][1]+q[2][1])/2];const b=bufOf(c[0],c[1],'paint');
    let P=q;const cr=(P[1][0]-P[0][0])*(P[2][1]-P[0][1])-(P[1][1]-P[0][1])*(P[2][0]-P[0][0]);if(cr>0)P=[P[0],P[3],P[2],P[1]];
    for(const t of [[0,1,2],[0,2,3]])for(const k of t){const x=P[k][0],z=P[k][1];pushV(b,x,H(x,z)+0.02,z,0,1,0,x*0.25,z*0.25);}}
  TINT=[1,1,1];
  for(const c of MARKS.circ){const g=new THREE.PlaneGeometry(c[2]*2.2,c[2]*2.2);g.rotateX(-Math.PI/2);if(c[3]!==null&&c[3]!==undefined)g.rotateY(c[3]-Math.PI/2);const m=new THREE.Mesh(g,mat30);m.position.set(c[0],H(c[0],c[1])+0.025,c[1]);scene.add(m);}}
// ---------- edificios: huella real + altura; fachadas detalladas donde dan a la calle ----------
const BLD=[];
function isStreetSide(mx,mz,nx,nz){for(const d of [2.2,3.5]){const k=groundKind(mx+nx*d,mz+nz*d);if(k===2||k===3)return true;}return false;}
function buildBuildingsLC(){for(const b of WD.build){let r=b.r;if(r.length<3)continue;if(polyArea(r)<0)r=r.slice().reverse();// antihorario en (x,z)
    const y0=b.y0,y1=b.y1,hgt=y1-y0;const c=centroid(r);const rec={r,y0,y1,c,edges:[]};BLD.push(rec);
    // colisión: triángulos convexos de la huella
    const tri=THREE.ShapeUtils.triangulateShape(r.map(q=>new THREE.Vector2(q[0],q[1])),[]);for(const t of tri)addPolyV(t.map(i=>r[i]),y0-1.5,y1);
    const st=lcStyle(b,hgt);rec.st=st;
    for(let i=0;i<r.length;i++){const a=r[i],q=r[(i+1)%r.length];const ex=q[0]-a[0],ez=q[1]-a[1],L=Math.hypot(ex,ez);if(L<0.3)continue;
      const nx=ez/L,nz=-ex/L;// normal exterior (anillo antihorario visto desde arriba con z hacia el sur)
      const street=hgt>3.5&&L>2.5&&isStreetSide((a[0]+q[0])/2,(a[1]+q[1])/2,nx,nz);rec.edges.push({a,b:q,nx,nz,L,street});
      if(street)lcFacade(rec,{a,b:q,nx,nz,L});else lcPlainWall(rec,a,q,nx,nz,L);}
    // azotea: losa con el color medio de la ortofoto y pretil
    {const B=bufOf(c[0],c[1],'concrete_wall');TINT=b.rc?b.rc.map(v=>v/255*1.15):[0.75,0.7,0.65];capPoly(B,r,y1,US('concrete_wall'));TINT=[1,1,1];}
    if(hgt>7)for(let i=0;i<r.length;i++){const a=r[i],q=r[(i+1)%r.length];const L=Math.hypot(q[0]-a[0],q[1]-a[1]);if(L<0.5)continue;const nx=(q[1]-a[1])/L,nz=-(q[0]-a[0])/L;
      const B=bufOf(a[0],a[1],st.wall);TINT=st.tint;wall(B,a[0]-nx*0.2,a[1]-nz*0.2,q[0]-nx*0.2,q[1]-nz*0.2,y1,y1+0.9,-nx,-nz,US(st.wall));TINT=[1,1,1];}}}
function lcPlainWall(rec,a,q,nx,nz,L){const st=rec.st;const B=bufOf((a[0]+q[0])/2,(a[1]+q[1])/2,st.side);TINT=st.sideTint;wall(B,a[0],a[1],q[0],q[1],rec.y0-1,rec.y1+(rec.y1-rec.y0>7?0.9:0),nx,nz,US(st.side));TINT=[1,1,1];
  // ventanas de patio de luces / fachada interior (pocas, para no gastar)
  const hgt=rec.y1-rec.y0;if(hgt<7||L<5)return;const F=Math.floor((hgt-4)/2.95);const n=Math.floor(L/4.2);const ux=(q[0]-a[0])/L,uz=(q[1]-a[1])/L;const yaw=Math.atan2(nx,nz);
  for(let f=0;f<F;f++)for(let k=0;k<n;k++){if(Math.random()<0.35)continue;const t=(k+0.5)*L/n;addInst('win',a[0]+ux*t+nx*0.02,rec.y0+4+f*2.95+0.1,a[1]+uz*t+nz*0.02,yaw,1.0,1.3,1,pick([0,1,2,8,12]),Math.random()<0.25?1:0);}}
// ---------- mapa ----------
const MAPS=1.4;const mapC=document.createElement('canvas');mapC.width=Math.ceil((XMAX-XMIN+80)*MAPS);mapC.height=Math.ceil((ZMAX-ZMIN+80)*MAPS);
const mtx=x=>(x-XMIN+40)*MAPS,mtz=z=>(z-ZMIN+40)*MAPS;
function drawMapLC(){const g=mapC.getContext('2d');g.fillStyle='#2a2a2c';g.fillRect(0,0,mapC.width,mapC.height);const d=HMD;
  for(let j=0;j<d.nz;j+=2)for(let i=0;i<d.nx;i+=2){const k=d.k[j*d.nx+i];if(!k)continue;g.fillStyle=k===2?'#4a4a4e':k===3?'#9a958c':'#556b48';g.fillRect(mtx(d.x0+i*d.res),mtz(d.z0+j*d.res),d.res*2*MAPS+0.5,d.res*2*MAPS+0.5);}
  g.fillStyle='#7a6e66';for(const b of BLD){g.beginPath();b.r.forEach((p,k)=>k?g.lineTo(mtx(p[0]),mtz(p[1])):g.moveTo(mtx(p[0]),mtz(p[1])));g.closePath();g.fill();}
  g.fillStyle='#fff';g.font='bold 15px sans-serif';for(const s of LC_STREETS){g.save();g.translate(mtx(s.x),mtz(s.z));g.rotate(s.a||0);g.fillText(s.n,-g.measureText(s.n).width/2,5);g.restore();}}
const LC_STREETS=[{n:'Travessera de les Corts',x:-60,z:20,a:-0.66},{n:'C. del Vallespir',x:-14,z:65,a:1.13}];
let worldBuilt=false;
function buildWorld(){if(worldBuilt)return;worldBuilt=true;const t0=performance.now();
  buildGroundLC();buildMarks();buildBuildingsLC();plantTreesLC();placeLampsLC();streetFurnitureLC();
  finishSigns();buildChunks();buildInst();drawMapLC();console.log('mundo',Math.round(performance.now()-t0),'ms',BLD.length,'edificios');}
// noche en la ciudad: farolas encendidas (charco de luz cálida en el suelo y la luminaria brillando), escaparates iluminados y el resplandor naranja del cielo
const texPool=cTex(256,256,(g,w,h)=>{const gr=g.createRadialGradient(128,128,4,128,128,126);gr.addColorStop(0,'rgba(255,214,150,1)');gr.addColorStop(0.35,'rgba(255,190,120,0.55)');gr.addColorStop(1,'rgba(255,170,90,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);},{});
const lampPoolMat=new THREE.MeshBasicMaterial({map:texPool,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-8,fog:true});
defInst('lampPool',(()=>{const g=new THREE.PlaneGeometry(15,15);g.rotateX(-Math.PI/2);return g;})(),lampPoolMat,1,1,false);
const glowMat=new THREE.MeshBasicMaterial({color:0xfff0d0,transparent:true,opacity:0});
defInst('lampGlow',(()=>{const g=new THREE.PlaneGeometry(0.24,0.56);g.rotateX(Math.PI/2);return g;})(),glowMat,1,1,false);
function lcNight(nf){const on=clamp((nf-0.25)*2,0,1);lampPoolMat.opacity=on*0.85;glowMat.opacity=on;glowMat.visible=lampPoolMat.visible=on>0.01;
  if(MATS.darkglass){MATS.darkglass.emissive.setRGB(0.55,0.45,0.32);MATS.darkglass.emissiveIntensity=on*0.45;}hemi.intensity=Math.max(hemi.intensity,0.36*on);hemi.color.setRGB(0.81+0.19*on,0.89-0.03*on,1-0.3*on);}
// árboles y farolas del IFC
function plantTreesLC(){for(const [x,y,z] of WD.tree){const k=groundKind(x,z);if(k===0)continue;tree(x,z,k===3?R(0.55,0.72):R(0.6,0.85),y);}}
function placeLampsLC(){for(const [x,y,z] of WD.lamp){// el brazo mira a la calzada más cercana
    let best=null,bd=1e9;for(let a=0;a<16;a++){const an=a/16*Math.PI*2;for(const r of [1.5,2.5,4,6]){const k=groundKind(x+Math.sin(an)*r,z+Math.cos(an)*r);if(k===2){if(r<bd){bd=r;best=an;}break;}}}
    const yaw=best===null?R(0,6.28):best;addInst('farola',x,H(x,z),z,yaw);const hx=x+Math.sin(yaw)*2.1,hz=z+Math.cos(yaw)*2.1;addInst('lampPool',hx,H(hx,hz)+0.04,hz,0,1,1,1);addInst('lampGlow',hx,H(x,z)+8.03,hz,yaw);addBoxV(x-0.12,x+0.12,z-0.12,z+0.12,H(x,z),H(x,z)+6);}}
