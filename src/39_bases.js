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
