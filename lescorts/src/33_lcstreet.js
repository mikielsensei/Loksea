// =====================================================================
// LES CORTS · CALLE: aparcamiento real junto a los bordillos, mobiliario (bancos, papeleras, contenedores, Bicing,
// marquesinas, semáforos, terrazas) y la red de aceras por la que camina la gente.
// Los puntos salen de data/spots.json (calculado a partir de la calzada y las aceras del AMB).
// =====================================================================
let SPOTS=null;
const LC_MOTOCOL=[0xf2f2f0,0xf2f2f0,0x1a1a1c,0x1a1a1c,0x8e9296,0xb01818,0x22325a,0x6a6e72,0x2f6d3a,0xd7d2c4];
const BENCHES=[],CONTS=[],TERR=[],CHAINS=[];let KERB=[];
// ocupación del suelo para no amontonar cosas
const OCC=new Map();const occK=(x,z)=>Math.floor(x/1.2)+','+Math.floor(z/1.2);
function occFree(x,z,r){const i0=Math.floor((x-r)/1.2),i1=Math.floor((x+r)/1.2),j0=Math.floor((z-r)/1.2),j1=Math.floor((z+r)/1.2);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const L=OCC.get(i+','+j);if(L)for(const o of L)if(Math.hypot(o[0]-x,o[1]-z)<r+o[2])return false;}return true;}
function occAdd(x,z,r){const k=occK(x,z);let L=OCC.get(k);if(!L)OCC.set(k,L=[]);L.push([x,z,r]);}
function placeMotoLC(x,z,yaw,o={}){const model=o.model||pick(['moto','motoT','motoT','moto','motoN','motoX','moto','motoT']);const col=o.col||pick(LC_MOTOCOL);const y=surfY(x,z);
  const v=solidBox(x,z,0.32,0.95,yaw,y,y+1.1);MOTO_PEND.push({x,z,yaw,vol:v});occAdd(x,z,0.9);}
function nearTree(x,z,r){for(const t of TREES){if(Math.abs(t.x-x)<r&&Math.abs(t.z-z)<r&&Math.hypot(t.x-x,t.z-z)<r)return true;}return false;}
function nearLamp(x,z,r){for(const l of WD.lamp){if(Math.abs(l[0]-x)<r&&Math.abs(l[2]-z)<r)return true;}return false;}
function kerbNear(x,z,maxD,f){let best=null,bd=maxD;for(const k of KERB){const d=Math.hypot(k.x-x,k.z-z);if(d<bd&&(!f||f(k))){bd=d;best=k;}}return best;}
function streetFurnitureLC(){
  KERB=SPOTS.kerb.map(q=>({x:q[0],z:q[1],ux:q[2],uz:q[3],nx:q[4],nz:q[5],sw:q[6],W:q[7],trav:q[8],cwd:q[9],cid:q[10]}));
  // cadenas de acera (para caminar): se cortan donde hay huecos
  {let cur=null,last=null;for(const k of KERB){if(!last||k.cid!==last.cid||Math.hypot(k.x-last.x,k.z-last.z)>2.6){if(cur&&cur.pts.length>6)CHAINS.push(cur);cur={pts:[],id:CHAINS.length};}k.ch=cur;k.i=cur.pts.length;cur.pts.push(k);last=k;}
    if(cur&&cur.pts.length>6)CHAINS.push(cur);
    for(const c of CHAINS){c.id=CHAINS.indexOf(c);const a=c.pts[0],b=c.pts[c.pts.length-1];c.loop=Math.hypot(a.x-b.x,a.z-b.z)<2.6;}}
  // alcorques: el árbol del AMB queda en el centro de un hueco orientado como el bordillo
  for(const t of TREES){const k=kerbNear(t.x,t.z,4);if(groundKind(t.x,t.z)!==3)continue;const ya=k?Math.atan2(k.ux,k.uz):0;const y=surfY(t.x,t.z);addInst('alcorqueQ',t.x,y,t.z,ya);if(hashN(t.x,t.z)<0.35)addInst('reixaQ',t.x,y-0.005,t.z,ya);}
  // embornales cada ~22 m en la rigola y junto a los pasos
  {let last=null;for(const k of KERB){if(last&&last.cid===k.cid&&Math.hypot(last.x-k.x,last.z-k.z)<(k.cwd<5?6:22))continue;if(focusD(k.x,k.z)>140)continue;const x=k.x+k.nx*(0.7+0.17),z=k.z+k.nz*(0.7+0.17);if(groundKind(x,z)!==2)continue;addInst('embornal',x,H(x,z)+0.03,z,Math.atan2(k.ux,k.uz));last=k;}}
  // armarios eléctricos («pirulís») cerca de algunas esquinas
  {let n=0;for(const k of KERB){if(k.cwd>2.5||k.cwd<1.6||focusD(k.x,k.z)>60||hashN(k.x*3,k.z*3)>0.12)continue;const x=k.x-k.nx*0.3,z=k.z-k.nz*0.3;if(!occFree(x,z,0.8))continue;addInst('armari',x,H(x,z),z,Math.atan2(-k.nx,-k.nz));addBoxV(x-0.25,x+0.25,z-0.25,z+0.25,H(x,z),H(x,z)+1.6);occAdd(x,z,0.8);n++;}}
  for(const t of TREES)occAdd(t.x,t.z,0.9);for(const l of WD.lamp)occAdd(l[0],l[2],0.5);
  // --- marquesinas de bus en Travessera (posiciones de las fotos) ---
  for(const [px,pz] of [[-57,16],[-26,-20],[52,-74],[96,-108]]){const k=kerbNear(px,pz,14,k=>k.trav&&k.sw>3.2);if(!k)continue;
    const yaw=Math.atan2(k.ux,k.uz)+Math.PI/2;const x=k.x-k.nx*0.6,z=k.z-k.nz*0.6;const y=H(x,z);addInst('marquesina',x,y,z,yaw);addInst('marquesinaGlass',x,y,z,yaw);
    solidBox(x-k.nx*0.6,z-k.nz*0.6,1.9,0.15,yaw+Math.PI/2,y,y+2.5);occAdd(x,z,2.6);BENCHES.push({x:x-k.nx*0.3,z:z-k.nz*0.3,yaw:Math.atan2(k.nx,k.nz),y:y+0.46,n:3,shelter:true});}
  // --- Bicing de Vallespir, en el lado del parque ---
  {const k0=kerbNear(19,80,12,k=>!k.trav);if(k0){const ch=k0.ch;for(let s=-6;s<6;s++){const k=ch.pts[(k0.i+s+ch.pts.length)%ch.pts.length];if(!k)continue;const x=k.x+k.nx*1.5,z=k.z+k.nz*1.5;const y=H(x,z);const ya=Math.atan2(k.ux,k.uz);
      addInst('bicingDock',x,y,z,ya+Math.PI/2);if(Math.random()<0.6)addInst('bicingBike',x+k.nx*0.25,y,z+k.nz*0.25,Math.atan2(-k.nx,-k.nz)+R(-0.04,0.04));solidBox(x,z,0.12,0.9,ya,y,y+1.0);}
    const t=ch.pts[(((k0.i-8)%ch.pts.length)+ch.pts.length)%ch.pts.length];if(t)addInst('bicingTotem',t.x+t.nx*1.4,H(t.x,t.z),t.z+t.nz*1.4,Math.atan2(t.ux,t.uz));}}
  // --- Vallespir escolar: jardineras de madera y amarillas en el carril del lado del parque, con bancos ---
  {let last=null;for(const k of KERB){if(!inVallN(k.x,k.z)||k.nx*VALL_E[0]+k.nz*VALL_E[1]>-0.5||k.cwd<4)continue;if(last&&Math.hypot(last[0]-k.x,last[1]-k.z)<R(5.5,7.5))continue;
    const x=k.x+k.nx*1.6,z=k.z+k.nz*1.6;if(groundKind(x,z)!==2)continue;const y=H(x,z);const ya=Math.atan2(k.ux,k.uz);last=[k.x,k.z];
    if(Math.random()<0.72){addInst('jardiFusta',x,y,z,ya+Math.PI/2);solidBox(x,z,1.25,0.55,ya+Math.PI/2,y,y+0.75);}else{addInst('jardiGroc',x,y,z,ya+Math.PI/2);solidBox(x,z,0.85,0.5,ya+Math.PI/2,y,y+0.6);}occAdd(x,z,1.6);
    if(Math.random()<0.45){const bx2=x+k.ux*1.9,bz2=z+k.uz*1.9,by=H(bx2,bz2),byaw=Math.atan2(-k.nx,-k.nz);addInst('banc',bx2,by,bz2,byaw);solidBox(bx2,bz2,0.95,0.3,byaw,by,by+0.5);occAdd(bx2,bz2,1);BENCHES.push({x:bx2,z:bz2,yaw:byaw,y:by+0.45,n:2});}}}
  // --- vallas de parques y patios de escuela (Vallespir): murete de ladrillo, barrotes verdes y pilares de obra ---
  {let n=0;for(const k of KERB){if(focusD(k.x,k.z)>60||k.cid===undefined)continue;if((k.i||0)%2)continue;const off=k.sw+0.05;const x=k.x-k.nx*off,z=k.z-k.nz*off;
    if(groundKind(x-k.nx*0.6,z-k.nz*0.6)!==1||groundKind(x-k.nx*2.5,z-k.nz*2.5)!==1)continue;if(insideVol(x-k.nx*1.2,H(x,z)+1,z-k.nz*1.2))continue;
    const y=H(x,z),ya=Math.atan2(k.ux,k.uz)+Math.PI/2;addInst('vallaPark',x,y,z,ya);if(n%3===0)addInst('pilarObra',x+k.ux,y,z+k.uz,ya);solidBox(x,z,1.05,0.12,ya,y,y+2);n++;}}
  // --- recorrido de cada bordillo: motos, bancos, papeleras, semáforos, terrazas ---
  let lastBin=new Map(),lastBench=new Map(),lastMoto=new Map(),semaf=new Set();
  for(const k of KERB){const id=k.cid;
    if(k.cwd<1.4&&k.W>6.5){const key=Math.round(k.x/7)+','+Math.round(k.z/7);if(!semaf.has(key)&&(k.trav||k.W>9)){semaf.add(key);const x=k.x+k.nx*0.15,z=k.z+k.nz*0.15;if(occFree(x,z,0.5)){addInst('semafor',x,H(x,z),z,Math.atan2(k.nx,k.nz)+Math.PI);addBoxV(x-0.1,x+0.1,z-0.1,z+0.1,H(x,z),H(x,z)+3.3);occAdd(x,z,0.6);}}}
    if(k.cwd<3.2)continue;const far=focusD(k.x,k.z)>140;if(far&&Math.random()<0.6)continue;
    const dB=lastBin.get(id),dS=lastBench.get(id),dM=lastMoto.get(id);
    // motos aparcadas en la acera (Travessera está llena, como en las fotos)
    if((k.trav?0.09:0.025)>Math.random()&&k.sw>3.0&&(!dM||Math.hypot(dM[0]-k.x,dM[1]-k.z)>(k.trav?22:45))){const n=RI(k.trav?3:2,k.trav?7:4);let ok=0;
      for(let i=0;i<n;i++){const x=k.x+k.ux*i*0.95-k.nx*0.35,z=k.z+k.uz*i*0.95-k.nz*0.35;if(!occFree(x,z,0.55)||groundKind(x,z)!==3)break;placeMotoLC(x,z,Math.atan2(-k.nx,-k.nz)+R(-0.18,0.18)+(Math.random()<0.15?Math.PI:0));ok++;}
      if(ok)lastMoto.set(id,[k.x,k.z]);continue;}
    if(k.sw>2.6&&(!dB||Math.hypot(dB[0]-k.x,dB[1]-k.z)>(k.trav?38:55))&&occFree(k.x,k.z,0.6)){addInst('papelera',k.x,H(k.x,k.z),k.z,Math.atan2(k.nx,k.nz));addBoxV(k.x-0.2,k.x+0.2,k.z-0.2,k.z+0.2,H(k.x,k.z),H(k.x,k.z)+1);occAdd(k.x,k.z,0.6);lastBin.set(id,[k.x,k.z]);continue;}
    if(k.sw>3.6&&(!dS||Math.hypot(dS[0]-k.x,dS[1]-k.z)>(k.trav?45:60))&&occFree(k.x-k.nx*0.2,k.z-k.nz*0.2,1.2)){const x=k.x-k.nx*0.25,z=k.z-k.nz*0.25;const yaw=Math.atan2(-k.nx,-k.nz);// el banco mira hacia la acera
      addInst('banc',x,H(x,z),z,yaw);solidBox(x,z,0.95,0.3,yaw,H(x,z),H(x,z)+0.5);occAdd(x,z,1.2);lastBench.set(id,[k.x,k.z]);BENCHES.push({x:x-k.nx*0.05,z:z-k.nz*0.05,yaw,y:H(x,z)+0.45,n:2,ux:k.ux,uz:k.uz});continue;}}
  // --- terrazas delante de bares y cafeterías con acera ancha ---
  for(const s of SHOPS){if(!/bar|cafe|caf|rest|pizz|bocad|forn|pastis|cerve|tapas|horno|bakery/i.test(s.type+' '+s.name))continue;const k=kerbNear(s.x,s.z,9);if(!k||k.sw<4.2||k.cwd<4)continue;
    const n=k.sw>6?RI(3,5):RI(2,3);for(let i=0;i<n;i++){const a=(i-(n-1)/2)*1.9;const x=k.x+k.ux*a-k.nx*(Math.min(k.sw-1.6,2.6)),z=k.z+k.uz*a-k.nz*(Math.min(k.sw-1.6,2.6));
      if(!occFree(x,z,0.9)||groundKind(x,z)!==3)continue;const y=H(x,z);addInst('terrassa',x,y,z,R(0,6.28));addBoxV(x-0.3,x+0.3,z-0.3,z+0.3,y,y+0.75);occAdd(x,z,1.0);
      const t={x,z,y,seats:[]};const ns=Math.random()<0.6?2:4;for(let c=0;c<ns;c++){const ca=Math.atan2(k.ux,k.uz)+c*(ns===2?Math.PI:Math.PI/2);t.seats.push({x:x+Math.sin(ca)*0.62,z:z+Math.cos(ca)*0.62,yaw:ca+Math.PI,y:y+0.46,used:null});}TERR.push(t);}}}
// ---------- coches aparcados en su sitio real ----------
function placeCarsLC(){if(!SPOTS)return;let n=0;const conts=[];
  for(const s of SPOTS.cars){const [x,z,ya,nx,nz,W]=s;
    if(inVallN(x,z))continue;// calle escolar: nada aparcado
    // islas de contenedores cada cierto trecho (en Barcelona van en el carril de aparcamiento)
    if(conts.every(c=>Math.hypot(c[0]-x,c[1]-z)>70)&&Math.random()<0.22){conts.push([x,z]);const facing=Math.atan2(-nx,-nz);const ux=Math.sin(ya),uz=Math.cos(ya);
      CONTSET_LC.forEach((ty,i)=>{const t=(i-2.5)*2.05;const qx=x+ux*t+nx*0.15,qz=z+uz*t+nz*0.15;if(groundKind(qx,qz)!==2)return;const y=H(qx,qz);const ref=addInst('cont_'+ty,qx,y,qz,facing);const v=solidBox(qx,qz,0.95,0.82,facing,y,y+1.8);CONTS.push({x:qx-nx*1.2,z:qz-nz*1.2,cx:qx,cz:qz,ty,yaw:facing});});continue;}
    if(Math.random()<(focusD(x,z)<45?0.12:0.5))continue;if(cars.some(c=>Math.hypot(c.x-x,c.z-z)<4.9))continue;
    const yaw=Math.atan2(nz,-nx);// el bordillo queda a la derecha del coche
    const c=Object.keys(VTPL).length?makeParked(x,z,yaw+R(-0.025,0.025)):makeCar(x,z,yaw+R(-0.025,0.025),'proc');c.fuel=R(15,90);n++;}
  buildVInst();for(const k in VTPL)needHi(VTPL[k]);buildMotosLC();
  console.log('coches aparcados',n,'contenedores',CONTS.length);}
const CONTSET_LC=['resta','resta','organica','envasos','paper','vidre'];
// alcorque de Les Corts: hueco cuadrado con marco de granito, tierra y a veces reja de fundición
{const G=0xb8b3aa,S=0x4a3a2a;defInst('alcorqueQ',mkG([[bx(1.3,0.06,0.1,0,0.0,0.6),G],[bx(1.3,0.06,0.1,0,0.0,-0.6),G],[bx(0.1,0.06,1.1,0.6,0.0,0),G],[bx(0.1,0.06,1.1,-0.6,0.0,0),G],[bx(1.12,0.02,1.12,0,-0.06,0),S]]),paintMat,1,1,false);}
{const tg=cTex(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#2c2d2e';g.lineWidth=5;for(let i=6;i<w;i+=13){g.beginPath();g.moveTo(i,4);g.lineTo(i,h-4);g.stroke();}g.lineWidth=7;g.strokeRect(4,4,w-8,h-8);g.beginPath();g.arc(64,64,24,0,7);g.fillStyle='rgba(0,0,0,0)';g.clearRect(40,40,48,48);g.stroke();},{});
  defInst('reixaQ',(()=>{const g=new THREE.PlaneGeometry(1.12,1.12);g.rotateX(-Math.PI/2);return g;})(),new THREE.MeshLambertMaterial({map:tg,transparent:true,alphaTest:0.4,side:THREE.DoubleSide}),1,1,false);}
// embornal: reja de fundición en la rigola
{const te=cTex(128,64,(g,w,h)=>{g.fillStyle='#2a2b2c';g.fillRect(0,0,w,h);g.fillStyle='#070707';for(let x=8;x<w-6;x+=10)g.fillRect(x,8,5,h-16);g.strokeStyle='#4a4b4c';g.lineWidth=4;g.strokeRect(2,2,w-4,h-4);},{});
  defInst('embornal',(()=>{const g=new THREE.PlaneGeometry(0.85,0.38);g.rotateX(-Math.PI/2);return g;})(),new THREE.MeshLambertMaterial({map:te,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-6}),1,1,false);}
{const B=0x9a4a32,G=0x2e4a36;const p=[[bx(2.04,0.5,0.24,0,0.25,0),B],[bx(2.08,0.05,0.28,0,0.52,0),0xb8b0a4],[bx(2.04,0.04,0.04,0,0.62,0),G],[bx(2.04,0.04,0.04,0,1.95,0),G]];for(let i=0;i<14;i++)p.push([bx(0.022,1.4,0.022,-0.95+i*0.146,1.27,0),G]);defInst('vallaPark',mkG(p),paintMat,1,1,false);}
defInst('pilarObra',mkG([[bx(0.42,2.2,0.42,0,1.1,0),0x9a4a32],[bx(0.5,0.08,0.5,0,2.24,0),0xb8b0a4]]),paintMat,1,1,false);
// Vallespir junto al parque: calle escolar pacificada (jardineras de madera y bancos donde antes se aparcaba)
const VALL_N=[[-30,-9],[9,66]];const VALL_E=[0.89,-0.46];
const inVallN=(x,z)=>segD(x,z,VALL_N[0],VALL_N[1])<9;
// jardinera de madera de la «superilla»: caja de listones con arbustos y flores
{const W=0x8a5e34,D=0x6e4a28,G=0x3f6a2a,G2=0x55823a;const p=[];for(let i=0;i<5;i++)p.push([bx(2.4,0.11,0.06,0,0.08+i*0.12,0.5),i%2?W:D],[bx(2.4,0.11,0.06,0,0.08+i*0.12,-0.5),i%2?D:W]);
  p.push([bx(0.06,0.6,1.0,1.2,0.32,0),D],[bx(0.06,0.6,1.0,-1.2,0.32,0),D],[bx(2.36,0.04,0.96,0,0.58,0),0x3a2a1e]);
  for(let i=0;i<7;i++)p.push([sp(R(0.22,0.36),R(-1,1),0.72+R(0,0.15),R(-0.3,0.3),6),Math.random()<0.5?G:G2]);p.push([sp(0.12,0.7,0.85,0.2,5),0xd8c040],[sp(0.1,-0.5,0.82,-0.2,5),0xc85a8a]);
  defInst('jardiFusta',mkG(p),woodPropMat,1,1,false);}
{const p=[[bx(1.6,0.45,0.9,0,0.225,0),0xe8c21e],[bx(1.5,0.04,0.8,0,0.46,0),0x3a2a1e]];for(let i=0;i<4;i++)p.push([sp(R(0.2,0.3),R(-0.6,0.6),0.6,R(-0.2,0.2),6),0x4a7a32]);defInst('jardiGroc',mkG(p),plasticMat,1,1,false);}
