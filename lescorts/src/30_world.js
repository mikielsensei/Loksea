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
const LC_SPAWN={x:-37,z:1.5,dx:0.77,dz:-0.64};// esquina Travessera de les Corts / Vallespir, mirando hacia Numància
const PAINTW=0xf2f1ea,PAINTY=0xe8b820;
let WD=null,MARKS=null;
async function loadWorldData(){setLoad('w','Descargando Les Corts (datos del AMB)…');
  const [w,hb,mk,sp,shp]=await Promise.all([fetch('data/world.json').then(r=>r.json()),fetch('data/hm.bin').then(r=>r.arrayBuffer()),fetch('data/marks.json').then(r=>r.json()),fetch('data/spots.json').then(r=>r.json()),fetch('data/shops.json').then(r=>r.json()).catch(()=>[])]);SPOTS=sp;
  {const TM={mercat:'fruteria',super:'super',taller:'ferre',mobles:'electro',floristeria:'fruteria',drogueria:'farmacia',clinica:'farmacia',joieria:'optica',oficina:'immo',motos:'electro'};POIS=shp.map(q=>[q[0],q[1],TM[q[2]]||q[2],q[3]]);}
  const hd=new DataView(hb);const x0=hd.getFloat32(0,true),z0=hd.getFloat32(4,true),res=hd.getFloat32(8,true),nx=hd.getInt32(16,true),nz=hd.getInt32(20,true);
  const u16=new Uint16Array(hb,24,nx*nz);const h=new Float32Array(nx*nz);for(let i=0;i<h.length;i++)h[i]=u16[i]/100-10;
  HMD={x0,z0,res,nx,nz,h,k:new Uint8Array(hb,24+nx*nz*2,nx*nz)};WD=w;MARKS=mk;}
// ---------- materiales propios ----------
const texPaint=cTex(256,256,(g,w,h)=>{g.fillStyle='#ecebe4';g.fillRect(0,0,w,h);const d=g.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const n=Math.random();const v=n<0.06?-60:n<0.2?-22:0;d.data[i]+=v;d.data[i+1]+=v;d.data[i+2]+=v;}g.putImageData(d,0,0);});
MATS.asphalt=photoMat('asphalt',{ns:0.6,color:0x5c5c5c,roughness:0.92});MATS.asphaltc=photoMat('asphalt_cracked',{ns:0.6,color:0x666666});
MATS.panot4=photoMat('panot4',{ns:1.0,color:0xc4c2be});MATS.panotflor=photoMat('panotflor',{ns:1.0,color:0xc8c8c8});MATS.panotbotons=photoMat('panotbotons',{ns:1.2});
MATS.granite=photoMat('granite',{ns:0.6,roughness:0.75});MATS.llambordes=photoMat('llambordes',{ns:1.0});MATS.rust=photoMat('rust',{ns:0.9,roughness:0.75,metalness:0.35});
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
      if(Math.abs(ny/l)>0.5){TINT=[0.97,0.96,0.94];triInto('panot4',A,B,C,true,q=>[q[0]*up,q[2]*up]);}
      else{TINT=[0.9,0.9,0.88];triInto('granite',A,B,C,false,(q,n)=>{const s=Math.abs(n[0])>Math.abs(n[2])?q[2]:q[0];return[s*ug,q[1]*ug];});}}TINT=[1,1,1];}
  {const {V,f}=M(WD.terreny);for(let i=0;i<f.length;i+=3){const A=V(f[i]),B=V(f[i+1]),C=V(f[i+2]);const cx=(A[0]+B[0]+C[0])/3,cz=(A[2]+B[2]+C[2])/3;const k=groundKind(cx,cz);if(k===2||k===3)continue;
      triInto('ortho',A,B,C,true,q=>OU(q[0],q[2]),-0.03);}}
  // suelo lejano (fuera de la hoja): asfalto plano
  {const g=new THREE.PlaneGeometry(2400,2400);g.rotateX(-Math.PI/2);const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:0x4a4a48}));m.position.y=-4;scene.add(m);}}
// ---------- marcas viales sacadas de la ortofoto ----------
function buildMarks(){for(const [key,col] of [['w',PAINTW],['y',PAINTY]]){TINT=hexTint(col);for(const p of MARKS[key]){
    const ring=p.r.map(q=>new THREE.Vector2(q[0],q[1]));const holes=(p.h||[]).map(h=>h.map(q=>new THREE.Vector2(q[0],q[1])));
    let tri;try{tri=THREE.ShapeUtils.triangulateShape(ring,holes);}catch(e){continue;}const all=ring.concat(...holes);const c=centroid(p.r);const b=bufOf(c[0],c[1],'paint');
    for(const t of tri){let P=t.map(i=>all[i]);const cr=(P[1].x-P[0].x)*(P[2].y-P[0].y)-(P[1].y-P[0].y)*(P[2].x-P[0].x);if(cr>0)P=[P[0],P[2],P[1]];
      for(const q of P)pushV(b,q.x,H(q.x,q.y)+0.018,q.y,0,1,0,q.x*0.25,q.y*0.25);}}}TINT=[1,1,1];}
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
