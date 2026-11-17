// =====================================================================
// EIXAMPLE: CALLES REALES, ACERAS DE PANOT, BORDILLOS DE GRANITO, PINTURA VIAL Y MOBILIARIO
// =====================================================================
// Calles verticales (a lo largo de z, de Llobregat a Besòs) y horizontales (paralelas al mar)
const VSTR=[{n:'C. de Villarroel',w:20,dir:1},{n:'C. de Casanova',w:20,dir:-1},{n:'C. de Muntaner',w:20,dir:1,bus:1},{n:"C. d'Aribau",w:20,dir:-1},{n:"C. d'Enric Granados",w:20,type:'ped'},{n:'C. de Balmes',w:20,dir:1,bus:1},{n:'Rambla de Catalunya',w:30,type:'rambla'}];
const HSTR=[{n:'C. de Provença',w:20,dir:1},{n:'C. de Mallorca',w:20,dir:-1,bus:1},{n:'C. de València',w:20,dir:1},{n:"C. d'Aragó",w:30,dir:-1,type:'wide',bus:1},{n:'C. del Consell de Cent',w:20,type:'superilla'}];
for(const s of VSTR){s.ax='v';s.sw=s.type==='rambla'?4.5:s.type==='ped'||s.type==='superilla'?0:5;}
for(const s of HSTR){s.ax='h';s.sw=s.type==='ped'||s.type==='superilla'?0:5;}
VSTR.forEach((s,i)=>s.pos=SX0+i*BP);HSTR.forEach((s,j)=>s.pos=SZ0+j*BP);
const DEFSTR={w:20,sw:5,dir:1,n:''};
const vs=i=>VSTR[i]||Object.assign({},DEFSTR,{ax:'v',pos:SX0+i*BP,outer:true});
const hs=j=>HSTR[j]||Object.assign({},DEFSTR,{ax:'h',pos:SZ0+j*BP,outer:true});
const CHAMF=14.14;// el xamfrà de Cerdà: corte de 20 m a 45°
const PAINTW=0xefefe8,PAINTY=0xe8b820;
// ---------- materiales de la ciudad ----------

MATS.asphalt=photoMat('asphalt',{ns:0.6,color:0x6a6a6a,roughness:0.95});MATS.asphaltc=photoMat('asphalt_cracked',{ns:0.6,color:0x707070});
MATS.panot4=photoMat('panot4',{ns:1.0,color:0xc8c8c8});MATS.panotflor=photoMat('panotflor',{ns:1.0,color:0xc8c8c8});MATS.panotbotons=photoMat('panotbotons',{ns:1.2});
MATS.granite=photoMat('granite',{ns:0.6,roughness:0.75});MATS.llambordes=photoMat('llambordes',{ns:1.0});
// pintura vial: blanca y limpia, con grano y algún desconchón (se ve el asfalto, no manchas negras)
// pintura vial gastada: zonas peladas por las rodadas, desconchones y grano (se ve el asfalto a través)
const texPaint=cTex(512,512,(g,w,h)=>{g.fillStyle='#ecebe4';g.fillRect(0,0,w,h);const d=g.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const n=(Math.random()-0.5)*30;d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n;}g.putImageData(d,0,0);
  g.globalCompositeOperation='destination-out';
  for(let i=0;i<26;i++){const x=R(0,w),y=R(0,h),r=R(10,46);const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(0,0,0,0.95)');gr.addColorStop(0.6,'rgba(0,0,0,0.55)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();}
  for(let i=0;i<5;i++){const x=R(0,w);g.fillStyle=`rgba(0,0,0,${R(0.25,0.55)})`;g.fillRect(x,0,R(18,40),h);}
  for(let i=0;i<900;i++){g.fillStyle=`rgba(0,0,0,${R(0.5,1)})`;g.beginPath();g.arc(R(0,w),R(0,h),R(0.6,3.2),0,7);g.fill();}
  g.globalCompositeOperation='source-over';},{});
MATS.paint=new THREE.MeshLambertMaterial({map:texPaint,vertexColors:true,alphaTest:0.3,alphaToCoverage:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-6});
// ---------- utilidades de polígonos ----------
function polyArea(P){let a=0;for(let i=0;i<P.length;i++){const p=P[i],q=P[(i+1)%P.length];a+=p[0]*q[1]-q[0]*p[1];}return a/2;}
function centroid(P){let x=0,z=0;for(const p of P){x+=p[0];z+=p[1];}return[x/P.length,z/P.length];}
// desplaza cada lado de un polígono convexo hacia fuera una distancia propia
function offsetPoly(P,D){const c=centroid(P);const n=P.length;const L=[];
  for(let i=0;i<n;i++){const a=P[i],b=P[(i+1)%n];let nx=b[1]-a[1],nz=-(b[0]-a[0]);const l=Math.hypot(nx,nz)||1;nx/=l;nz/=l;const mx=(a[0]+b[0])/2-c[0],mz=(a[1]+b[1])/2-c[1];if(nx*mx+nz*mz<0){nx=-nx;nz=-nz;}
    const d=typeof D==='number'?D:D[i];L.push([a[0]+nx*d,a[1]+nz*d,b[0]-a[0],b[1]-a[1]]);}
  const out=[];for(let i=0;i<n;i++){const A=L[(i+n-1)%n],B=L[i];const den=A[2]*B[3]-A[3]*B[2];if(Math.abs(den)<1e-9){out.push([B[0],B[1]]);continue;}
    const t=((B[0]-A[0])*B[3]-(B[1]-A[1])*B[2])/den;out.push([A[0]+A[2]*t,A[1]+A[3]*t]);}return out;}
// rectángulo con xamfrans: 8 vértices empezando por el lado norte (z0) de oeste a este
function chamfRect(x0,x1,z0,z1,c){return[[x0+c,z0],[x1-c,z0],[x1,z0+c],[x1,z1-c],[x1-c,z1],[x0+c,z1],[x0,z1-c],[x0,z0+c]];}
// cuadrilátero horizontal en un buffer (y por vértice)
function quadH(b,a,bq,c,d,y,us){const Y=typeof y==='function'?y:()=>y;for(const q of [a,bq,c,a,c,d])pushV(b,q[0],Y(q[0],q[1]),q[1],0,1,0,q[0]*us,q[1]*us);}
function quadHUp(b,a,bq,c,d,y,us){// garantiza normal hacia arriba
  const cr=(bq[0]-a[0])*(c[1]-a[1])-(bq[1]-a[1])*(c[0]-a[0]);if(cr>0)quadH(b,a,d,c,bq,y,us);else quadH(b,a,bq,c,d,y,us);}
// pintura vial: rectángulo orientado (centro, eje u, largo, ancho)
function paintRect(cx,cz,ux,uz,len,wid,col,y){const b=bufOf(cx,cz,'paint');TINT=hexTint(col);const vx=-uz,vz=ux;const hl=len/2,hw=wid/2;
  const A=[cx-ux*hl-vx*hw,cz-uz*hl-vz*hw],B=[cx+ux*hl-vx*hw,cz+uz*hl-vz*hw],C=[cx+ux*hl+vx*hw,cz+uz*hl+vz*hw],D=[cx-ux*hl+vx*hw,cz-uz*hl+vz*hw];
  const Y=(x,z)=>(y===undefined?H(x,z):y)+0.012;quadHUp(b,A,B,C,D,Y,0.25);TINT=[1,1,1];}
function paintDashes(x0,z0,x1,z1,dash,gap,wid,col){const L=Math.hypot(x1-x0,z1-z0);const ux=(x1-x0)/L,uz=(z1-z0)/L;for(let t=gap/2;t+dash<L;t+=dash+gap)paintRect(x0+ux*(t+dash/2),z0+uz*(t+dash/2),ux,uz,dash,wid,col);}
// ---------- placas con el nombre de la calle (mármol blanco, letras negras) ----------
const ALLSTR=[...VSTR,...HSTR];
// placa de Barcelona: losa de mármol blanco con vetas y letras negras grabadas («Carrer de» pequeño y el nombre grande)
const plaqueLines=n=>{const m=/^(C\.|Rambla|Pg\.|Av\.)\s+(de la |de les |del |de |d')?(.*)$/.exec(n);if(!m)return['',n];const t={'C.':'Carrer','Rambla':'Rambla','Pg.':'Passeig','Av.':'Avinguda'}[m[1]];const pre=(m[2]||'').trim();
  return pre.endsWith("'")?[t,pre+m[3]]:[t+(pre?' '+pre:''),m[3]];};
const texPlaques=cTex(1024,1024,(g)=>{const W=256,Hh=128;ALLSTR.forEach((s,i)=>{const x=(i%4)*W,y=Math.floor(i/4)*Hh;
  g.fillStyle='#ecebe5';g.fillRect(x,y,W,Hh);
  for(let k=0;k<5;k++){g.strokeStyle=`rgba(120,120,125,${R(0.08,0.22)})`;g.lineWidth=R(0.6,2.2);g.beginPath();let px=x+R(0,W),py=y;g.moveTo(px,py);for(let q=0;q<10;q++){px+=R(-14,14);py+=Hh/10;g.lineTo(px,py);}g.stroke();}
  const d=g.getImageData(x,y,W,Hh);for(let k=0;k<d.data.length;k+=4){const n=(Math.random()-0.5)*10;d.data[k]+=n;d.data[k+1]+=n;d.data[k+2]+=n;}g.putImageData(d,x,y);
  const [l1,l2]=plaqueLines(s.n);g.textAlign='center';g.textBaseline='middle';
  const eng=(t,cy,font)=>{g.font=font;g.fillStyle='rgba(255,255,255,0.7)';g.fillText(t,x+W/2+1,cy+1.2);g.fillStyle='#16171a';g.fillText(t,x+W/2,cy);};
  if(l1)eng(l1,y+Hh*0.27,'500 24px Georgia,"Times New Roman",serif');let fs=46;g.font=`bold ${fs}px Georgia,"Times New Roman",serif`;while(g.measureText(l2).width>W-26&&fs>18){fs--;g.font=`bold ${fs}px Georgia,"Times New Roman",serif`;}
  eng(l2,y+Hh*(l1?0.63:0.5),`bold ${fs}px Georgia,"Times New Roman",serif`);g.fillStyle='#8c1c22';g.font='bold 13px Arial';g.textAlign='right';g.fillText('2',x+W-10,y+Hh-11);});},{});
defInst('plaqueSlab',mkG([[bx(0.64,0.34,0.03,0,0,0),0xdedcd4]]),plasticMat,1,1,true);
defInst('plaque',(()=>{const g=new THREE.PlaneGeometry(0.6,0.3);return g;})(),(()=>{const m=atlasMat(texPlaques,null,4,8);m.polygonOffset=true;m.polygonOffsetFactor=-2;m.polygonOffsetUnits=-6;return m;})(),4,8,true);
// ---------- registros ----------
const BLOCKS=[],CARSPOTS=[],LOOT=[],TOILETS=[],FOUNTAINS=[],BEDS=[],SHOPS=[],BASES=[];
const MAPD={roads:[],blocks:[],shops:[],pois:[],peds:[]};
const solidBox=(x,z,hw,hd,yaw,y0,y1)=>addOBB(x,z,hw,hd,yaw,y0,y1);
// coloca un objeto instanciado sobre la superficie con su colisión opcional
function put(name,x,z,yaw,col,hw,hd,hh,yo=0){const y=surfY(x,z)+yo;addInst(name,x,y,z,yaw);if(col)solidBox(x,z,hw,hd,yaw,y,y+hh);return y;}

// ---------- suelo: un plano de asfalto inclinado para todo el barrio ----------
function buildGround(){const x0=XMIN-260,x1=XMAX+260,z0=ZMIN-260,z1=ZMAX+260;const g=new THREE.BufferGeometry();const us=US('asphalt');
  const P=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];const pos=[],uv=[],nor=[],col=[];for(const i of [0,3,2,0,2,1]){const p=P[i];pos.push(p[0],H(p[0],p[1]),p[1]);uv.push(p[0]*us,p[1]*us);nor.push(0,1,0);col.push(1,1,1);}
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const m=new THREE.Mesh(g,MATS.asphalt);m.matrixAutoUpdate=false;scene.add(m);}

// ---------- manzanas: acera en anillo (panot + bordillo de granito) ----------
function blockGeom(i,j){const A=vs(i),B=vs(i+1),Cc=hs(j),Dd=hs(j+1);
  const x0=A.pos+A.w/2,x1=B.pos-B.w/2,z0=Cc.pos+Cc.w/2,z1=Dd.pos-Dd.w/2;const bp=chamfRect(x0,x1,z0,z1,CHAMF);
  // aceras por lado: N, NE(xamfrà), E, SE, S, SO, O, NO
  const sN=Cc.sw,sE=B.sw,sS=Dd.sw,sW=A.sw;const D=[sN,(sN+sE)/2,sE,(sE+sS)/2,sS,(sS+sW)/2,sW,(sW+sN)/2];
  const cp=offsetPoly(bp,D);return{i,j,x0,x1,z0,z1,bp,cp,D,str:[Cc,B,Dd,A],outer:i<0||j<0||i>=NXS-1||j>=NZS-1};}
function sidewalkRing(bk){const{bp,cp,D}=bk;const cin=offsetPoly(cp,D.map(d=>d>0.4?-0.32:0));// banda de bordillo
  const sideStr=[bk.str[0],null,bk.str[1],null,bk.str[2],null,bk.str[3],null];
  for(let e=0;e<8;e++){const n=(e+1)%8;const s=sideStr[e]||sideStr[(e+7)%8]||sideStr[(e+1)%8];
    if(D[e]<0.05)continue;
    const mat=(s&&(s.n.includes('Muntaner')||s.n.includes('Rambla')||s.n.includes('Aragó')))?'panotflor':'panot4';
    const y=(x,z)=>H(x,z)+CURB;
    let b=bufOf((bp[e][0]+cp[e][0])/2,(bp[e][1]+cp[e][1])/2,mat);TINT=[1,1,1];quadHUp(b,bp[e],bp[n],cin[n],cin[e],y,US(mat));
    b=bufOf((cp[e][0]+cp[n][0])/2,(cp[e][1]+cp[n][1])/2,'granite');TINT=[0.95,0.95,0.95];quadHUp(b,cin[e],cin[n],cp[n],cp[e],y,US('granite'));
    // cara vertical del bordillo
    const ex=cp[n][0]-cp[e][0],ez=cp[n][1]-cp[e][1],l=Math.hypot(ex,ez);let nx=ez/l,nz=-ex/l;const c=centroid(bp);if(nx*((cp[e][0]+cp[n][0])/2-c[0])+nz*((cp[e][1]+cp[n][1])/2-c[1])<0){nx=-nx;nz=-nz;}
    wallQ(b,cp[e][0],cp[e][1],cp[n][0],cp[n][1],H(cp[e][0],cp[e][1])-0.05,H(cp[e][0],cp[e][1])+CURB,H(cp[n][0],cp[n][1])-0.05,H(cp[n][0],cp[n][1])+CURB,nx,nz,US('granite'));}
  TINT=[1,1,1];addSidewalk(cp);}

// ---------- calles peatonales / superilla: plataforma única ----------
// calle pacificada (superilla / eje verde): plataforma única que baja en rampa suave hasta la calzada del cruce,
// con una rigola de granito y embornales en el borde, en vez de un escalón
const RAMP=2.4;
function pedStrip(s,a0,a1){const hw=s.w/2;const rect=(l0,l1,b0,b1)=>s.ax==='v'?[[s.pos+l0,b0],[s.pos+l1,b0],[s.pos+l1,b1],[s.pos+l0,b1]]:[[b0,s.pos+l0],[b1,s.pos+l0],[b1,s.pos+l1],[b0,s.pos+l1]];
  const P=rect(-hw,hw,a0,a1);const c=centroid(P);
  const along=(x,z)=>s.ax==='v'?z:x;const yR=(x,z)=>{const t=along(x,z);return H(x,z)+CURB*clamp(Math.min(t-a0,a1-t)/RAMP,0,1);};
  const bands=[[-hw,-2.2,s.ax==='v'?'panot4':'panotflor'],[-2.2,2.2,s.ax==='v'?'llambordes':'granite'],[2.2,hw,s.ax==='v'?'panot4':'panotflor']];
  const segs=[[a0+0.45,a0+RAMP],[a0+RAMP,a1-RAMP],[a1-RAMP,a1-0.45]];
  for(const [l0,l1,mat] of bands)for(const [b0,b1] of segs){const Q=rect(l0,l1,b0,b1);const cc=centroid(Q);quadHUp(bufOf(cc[0],cc[1],mat),...Q,yR,US(mat));}
  // rigola (franja de granito oscuro a nivel de calzada) y embornales cada 4 m
  for(const [b0,b1] of [[a0,a0+0.45],[a1-0.45,a1]]){const Q=rect(-hw,hw,b0,b1);const cc=centroid(Q);TINT=[0.55,0.55,0.55];quadHUp(bufOf(cc[0],cc[1],'granite'),...Q,(x,z)=>H(x,z)+0.008,US('granite'));TINT=[1,1,1];
    for(let l=-hw+1.5;l<hw-1;l+=4){const m=(b0+b1)/2;const x=s.ax==='v'?s.pos+l:m,z=s.ax==='v'?m:s.pos+l;addInst('embornal',x,H(x,z)+0.012,z,s.ax==='v'?0:Math.PI/2);}}
  addSidewalk(P);addFloor(rect(-hw,hw,a0,a0+RAMP),0,yR);addFloor(rect(-hw,hw,a1-RAMP,a1),0,yR);MAPD.peds.push(P);return P;}
// reja de embornal (fundición con ranuras)
const texEmb=cTex(128,64,(g,w,h)=>{g.fillStyle='#2a2b2c';g.fillRect(0,0,w,h);g.fillStyle='#0a0a0a';for(let x=8;x<w-6;x+=10)g.fillRect(x,8,5,h-16);g.strokeStyle='#4a4b4c';g.lineWidth=4;g.strokeRect(2,2,w-4,h-4);},{});
defInst('embornal',(()=>{const g=new THREE.PlaneGeometry(0.8,0.36);g.rotateX(-Math.PI/2);return g;})(),new THREE.MeshLambertMaterial({map:texEmb,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),1,1,false);
// ---------- calzada: carriles, pasos de cebra, líneas de detención ----------
// devuelve la descripción de la calzada de un tramo: lista de [d0,d1] (offset transversal desde el eje) por sentido
function roadBands(s){const hw=s.w/2;if(s.type==='rambla')return[{d0:-hw+s.sw,d1:-5,dir:-1,lanes:2,park:true},{d0:5,d1:hw-s.sw,dir:1,lanes:2,park:true}];
  if(s.type==='ped'||s.type==='superilla')return[];return[{d0:-hw+s.sw,d1:hw-s.sw,dir:s.dir||1,lanes:s.type==='wide'?6:3,park:true}];}
// punto en coordenadas de calle: a = a lo largo, d = transversal
const SP=(s,a,d)=>s.ax==='v'?[s.pos+d,a]:[a,s.pos+d];
function roadSegment(s,a0,a1,crossA,crossB){const bands=roadBands(s);const ua=s.ax==='v'?[0,1]:[1,0];
  for(const B of bands){const W=B.d1-B.d0;const parkW=B.park?2.3:0;// carril de aparcamiento a la derecha del sentido
    const parkSide=B.dir>0?(s.ax==='v'?-1:1):(s.ax==='v'?1:-1);// lado del aparcamiento
    const p0=parkSide<0?B.d0:B.d1-parkW,p1=parkSide<0?B.d0+parkW:B.d1;const t0=parkSide<0?B.d0+parkW:B.d0,t1=parkSide<0?B.d1:B.d1-parkW;
    const lanes=B.lanes;const lw=(t1-t0)/lanes;
    const za=a0+8.5,zb=a1-8.5;// los cruces quedan fuera
    // separación de carriles discontinua
    for(let k=1;k<lanes;k++){const d=t0+k*lw;const A=SP(s,za,d),Bq=SP(s,zb,d);paintDashes(A[0],A[1],Bq[0],Bq[1],4,5,0.12,PAINTW);}
    // línea continua del carril de aparcamiento
    {const d=parkSide<0?p1:p0;const A=SP(s,za,d),Bq=SP(s,zb,d);const m=[(A[0]+Bq[0])/2,(A[1]+Bq[1])/2];paintRect(m[0],m[1],ua[0],ua[1],zb-za,0.1,PAINTW);}
    // pasos de cebra en ambos extremos + línea de detención antes del cruce (según el sentido)
    for(const [aZ,isEnd] of [[a0+5,false],[a1-5,true]]){const ss=4,dz=W;for(let d=B.d0+0.3;d<B.d1-0.3;d+=1.0){const q=SP(s,aZ,d+0.25);paintRect(q[0],q[1],ua[0],ua[1],ss,0.5,PAINTW);}
      const approaching=(B.dir>0)===isEnd;if(approaching){const aS=isEnd?aZ-3.2:aZ+3.2;const q=SP(s,aS,(t0+t1)/2);paintRect(q[0],q[1],ua[0],ua[1],0.4,t1-t0,PAINTW);
        // flechas de dirección
        for(let k=0;k<lanes;k++){const d=t0+(k+0.5)*lw;const aa=isEnd?aS-9:aS+9;const q2=SP(s,aa,d);arrowPaint(q2[0],q2[1],ua[0]*B.dir,ua[1]*B.dir);}}}
    // contenido del carril de aparcamiento
    parkingLane(s,B,a0,a1,p0,p1,parkSide);}
  MAPD.roads.push([SP(s,a0,0),SP(s,a1,0),s.w]);}
// flecha de carril reglamentaria (5 m): fuste largo y punta maciza
function paintTri(A,B,C){const c=[(A[0]+B[0]+C[0])/3,(A[1]+B[1]+C[1])/3];const b=bufOf(c[0],c[1],'paint');TINT=hexTint(PAINTW);quadHUp(b,A,B,C,C,(x,z)=>H(x,z)+0.012,0.25);TINT=[1,1,1];}
function arrowPaint(cx,cz,ux,uz){const vx=-uz,vz=ux;paintRect(cx-ux*0.9,cz-uz*0.9,ux,uz,3.5,0.16,PAINTW);
  const P=(a,b)=>[cx+ux*a+vx*b,cz+uz*a+vz*b];paintTri(P(0.82,-0.33),P(0.82,0.33),P(2.5,0));paintTri(P(0.82,-0.08),P(0.82,0.08),P(0.6,0));}
// aparcamiento: contenedores con su caja amarilla, Bicing, carga y descarga, coches
const CONTSET=['resta','resta','organica','envasos','paper','vidre'];
let bicingCount=0;
function parkingLane(s,B,a0,a1,p0,p1,side){const ua=s.ax==='v'?[0,1]:[1,0];const dm=(p0+p1)/2;const yawAlong=s.ax==='v'?0:Math.PI/2;const facing=s.ax==='v'?(side<0?Math.PI/2:-Math.PI/2):(side<0?0:Math.PI);
  let a=a0+16;let end_=a1-16;
  // zona de carga y descarga junto al xamfrà (zigzag amarillo)
  {const q=SP(s,a0+11,dm);paintRect(q[0],q[1],ua[0],ua[1],6,0.12,PAINTY);for(let t=0;t<6;t+=1.2){const qq=SP(s,a0+8.6+t,dm);paintRect(qq[0],qq[1],ua[0],ua[1],1.2,0.1,PAINTY);}}
  // aparcamiento de motos en la calzada (rayas blancas) junto al cruce del otro extremo, lleno de motos en batería
  if(Math.random()<0.75){const e0=a1-22,e1=a1-15;for(let t=e0;t<=e1+0.01;t+=0.9){const q=SP(s,t,dm);paintRect(q[0],q[1],ua[1],ua[0],p1-p0-0.2,0.1,PAINTW);}
    for(let t=e0+0.45;t<e1;t+=0.9){if(Math.random()<0.6){const q=SP(s,t+R(-0.25,0.25),dm+R(-0.35,0.35));const yb=H(q[0],q[1]);placeMoto(q[0],yb,q[1],facing+R(-0.55,0.55)+(Math.random()<0.15?Math.PI:0),Math.random()<0.22);}}end_=e0-1;}
  const plan=[];
  const L=end_-a;
  // contenedores en mitad del tramo (en la calzada, con caja amarilla)
  plan.push({k:'cont',at:a+L*R(0.25,0.6),len:CONTSET.length*2.05+1});
  if(Math.random()<0.28&&bicingCount<6){plan.push({k:'bicing',at:a+L*R(0.05,0.15),len:16});bicingCount++;}
  plan.sort((x,y)=>x.at-y.at);let cur=a;
  for(const it of plan){fillCars(s,cur,it.at-1,dm,yawAlong,B.dir);cur=it.at+it.len+1;
    if(it.k==='cont'){const z0=it.at;CONTSET.forEach((ty,k)=>{const q=SP(s,z0+1+k*2.05+1,dm);const y=H(q[0],q[1]);addInst('cont_'+ty,q[0],y,q[1],facing);solidBox(q[0],q[1],0.95,0.82,facing,y,y+1.8);});
      const q=SP(s,z0+it.len/2,p0+0.05),q2=SP(s,z0+it.len/2,p1-0.05);paintRect(q[0],q[1],ua[0],ua[1],it.len,0.14,PAINTY);paintRect(q2[0],q2[1],ua[0],ua[1],it.len,0.14,PAINTY);
      for(const e of [z0,z0+it.len]){const qq=SP(s,e,dm);paintRect(qq[0],qq[1],ua[1],ua[0],p1-p0,0.14,PAINTY);}
      {const qc=SP(s,z0+it.len/2,dm);lootSpot(qc[0],qc[1],H(qc[0],qc[1]),'bin','los contenedores');}
      if(Math.random()<0.5){const qq=SP(s,z0+R(1,it.len-1),dm+R(-0.5,0.5)*side+side*1.6);addInst('bolsa',qq[0],H(qq[0],qq[1]),qq[1],R(0,6));}}
    else if(it.k==='bicing'){const z0=it.at;const q=SP(s,z0+1,dm);put('bicingTotem',q[0],q[1],facing+Math.PI,true,0.3,0.15,2.2,-CURB*0);
      for(let k=0;k<12;k++){const qq=SP(s,z0+2.6+k*1.05,dm-side*0.55);const y=H(qq[0],qq[1]);addInst('bicingDock',qq[0],y,qq[1],yawAlong+Math.PI/2);
        if(Math.random()<0.55){const qb=SP(s,z0+2.6+k*1.05,dm+side*0.25);if(Math.random()<0.1)addInst('bicingBike',qb[0],y+0.12,qb[1],facing+R(-0.6,0.6),1,1,1,0,0,1.45);else addInst('bicingBike',qb[0],y,qb[1],facing+R(-0.04,0.04));}solidBox(qq[0],qq[1],0.12,0.9,yawAlong,y,y+1.0);}
      const qa=SP(s,z0+it.len/2,p0+0.05),qb2=SP(s,z0+it.len/2,p1-0.05);paintRect(qa[0],qa[1],ua[0],ua[1],it.len,0.12,PAINTW);paintRect(qb2[0],qb2[1],ua[0],ua[1],it.len,0.12,PAINTW);}}
  fillCars(s,cur,end_,dm,yawAlong,B.dir);}
// moto aparcada: modelo al azar, a veces tirada; las que están en pie y enteras se pueden coger
const MOTOS=[];
function placeMoto(x,y,z,yaw,fallen){const model=pick(['moto','moto','moto','motoN','motoX']);const col=pick(MOTOCOL);const side=Math.random()<0.5?1:-1;
  const ref=addInst(model,x,y+(fallen?0.22:0),z,yaw,1,1,1,0,0,fallen?0:0,col);if(fallen){const L=INST[model].lists.get(ref[1]);const t=L[ref[2]];t[9]=0;t[3]=yaw;t.roll=side;}
  if(fallen){const L=INST[model].lists.get(ref[1]);L[ref[2]][11]=side*1.45;}
  else solidBox(x,z,0.3,0.9,yaw,y,y+1.1);MOTOS.push({x,y,z,yaw,model,col,ref,fallen,ok:!fallen&&Math.random()<0.6});}
function fillCars(s,a,b,dm,yaw,dir){for(let t=a+3;t<b-3;t+=5.4){if(Math.random()<0.42){const q=SP(s,t,dm+R(-0.15,0.15));CARSPOTS.push({x:q[0],z:q[1],yaw:(dir>0?0:Math.PI)+(s.ax==='v'?0:Math.PI/2)+R(-0.05,0.05)});}}}

// ---------- mobiliario de acera a lo largo de cada lado de manzana ----------
function sidewalkFurniture(bk){const sides=[[0,1,bk.str[0]],[2,3,bk.str[1]],[4,5,bk.str[2]],[6,7,bk.str[3]]];const c=centroid(bk.bp);
  for(const [e,n,s] of sides){if(!s||s.outer&&bk.outer&&false)continue;const sw=bk.D[e];const a=bk.cp[e],b=bk.cp[n];const ex=b[0]-a[0],ez=b[1]-a[1],L=Math.hypot(ex,ez);const ux=ex/L,uz=ez/L;
    let nx=-uz,nz=ux;if(nx*((a[0]+b[0])/2-c[0])+nz*((a[1]+b[1])/2-c[1])<0){nx=-nx;nz=-nz;}// normal hacia la calle
    const ped=s.type==='ped'||s.type==='superilla';
    const at=(t,d)=>[a[0]+ux*t-nx*d,a[1]+uz*t-nz*d];// d = metros hacia dentro desde el bordillo
    const yawSt=Math.atan2(nx,nz);// mirando a la calle
    if(sw<0.5&&!ped)continue;
    if(ped){// en calles de plataforma única el mobiliario va pegado a la fachada, árboles en la línea de 3 m
      for(let t=6;t<L-6;t+=9){const p=at(t,-3.2);tree(p[0],p[1],0.9);}
      for(let t=10;t<L-8;t+=22){const p=at(t,-1.4);put('fanal',p[0],p[1],yawSt+Math.PI,true,0.12,0.12,8);}
      if(s.type==='superilla')for(let t=14;t<L-10;t+=20){const p=at(t,-6.5);put('jardinera',p[0],p[1],Math.atan2(ux,uz)+Math.PI/2,true,1.2,0.55,0.8);const p2=at(t+6,-6.5);put('banc',p2[0],p2[1],yawSt+Math.PI,true,0.9,0.3,0.9);}
      continue;}
    // árboles cada ~8 m a 1 m del bordillo, farolas cada 3 árboles
    const busT=s.bus&&((bk.i+bk.j)%2===0)?L*0.45:-99;
    let k=0;for(let t=7;t<L-7;t+=R(7.5,8.8),k++){if(Math.abs(t-busT)<4.5||Math.abs(t-busT-4.2)<1)continue;const p=at(t,1.0);if(k%3===1){const pl=at(t,0.5);put('fanal',pl[0],pl[1],yawSt+Math.PI,true,0.12,0.12,8);}else tree(p[0],p[1]);
      if(k%4===2){const pp=at(t+2.2,0.45);put('papelera',pp[0],pp[1],yawSt+Math.PI,true,0.22,0.22,1.1);}}
    {const p=at(L*R(0.35,0.65),0.6);put('parquimetre',p[0],p[1],yawSt+Math.PI,true,0.18,0.12,1.4);}
    if(Math.random()<0.5){const p=at(R(10,L-10),sw-0.35);put('armari',p[0],p[1],yawSt,true,0.45,0.2,1.3);}
    if(Math.random()<0.35){const p=at(R(12,L-12),sw*0.55);put('banc',p[0],p[1],yawSt+Math.PI*(Math.random()<0.5?0:1),true,0.9,0.3,0.9);}
    // parada de bus TMB a mitad de tramo
    if(s.bus&&((bk.i+bk.j)%2===0)){const t=L*0.45;const p=at(t,1.3);const y=put('marquesina',p[0],p[1],yawSt,false);addInst('marquesinaGlass',p[0],y,p[1],yawSt);{const lx=[Math.cos(yawSt),-Math.sin(yawSt)],lz=[Math.sin(yawSt),Math.cos(yawSt)];for(const [dz,yy] of [[-0.74+0.085,yawSt],[-0.74-0.085,yawSt+Math.PI]]){const mx=p[0]+lx[0]*1.42+lz[0]*dz,mz=p[1]+lx[1]*1.42+lz[1]*dz;addInst('mupi',mx,y+1.28,mz,yy,1,1,1,RI(0,7),1);}}solidBox(p[0]-nx*0.6,p[1]-nz*0.6,2.2,0.15,yawSt,y,y+2.6);
      const pp=at(t+4.2,0.35);addInst('busPole',pp[0],surfY(pp[0],pp[1]),pp[1],yawSt);addInst('busPlate',pp[0],surfY(pp[0],pp[1]),pp[1],yawSt);solidBox(pp[0],pp[1],0.06,0.06,0,y,y+3);}
    // motos aparcadas en la acera junto al xamfrà
    if(Math.random()<0.55){const t0=R(3,5);for(let q=0;q<R(3,8);q++){const p=at(t0+q*0.95,sw*0.5);{const y=surfY(p[0],p[1]);placeMoto(p[0]+R(-0.3,0.3),y,p[1]+R(-0.3,0.3),Math.atan2(nx,nz)+R(-0.6,0.6),Math.random()<0.2);}}}}
  // xamfrans: pilonas en el bordillo, señales, semáforos, placas de calle
  for(let e=1;e<8;e+=2){const a=bk.cp[e],b=bk.cp[(e+1)%8];if(bk.D[e]<0.5)continue;const L=Math.hypot(b[0]-a[0],b[1]-a[1]);const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;let nx=-uz,nz=ux;if(nx*((a[0]+b[0])/2-c[0])+nz*((a[1]+b[1])/2-c[1])<0){nx=-nx;nz=-nz;}
    for(let t=1;t<L-0.5;t+=1.6){const p=[a[0]+ux*t-nx*0.3,a[1]+uz*t-nz*0.3];put('pilona',p[0],p[1],0,true,0.09,0.09,0.85);}
    if(Math.random()<0.3){const p=[(a[0]+b[0])/2-nx*3,(a[1]+b[1])/2-nz*3];put('font',p[0],p[1],Math.atan2(nx,nz),true,0.25,0.25,1.5);FOUNTAINS.push({x:p[0],z:p[1]});}
    else if(Math.random()<0.25){const p=[(a[0]+b[0])/2-nx*4,(a[1]+b[1])/2-nz*4];put('kiosk',p[0],p[1],Math.atan2(nx,nz),true,1.5,1.0,2.6);}
    // en cada extremo del xamfrà: semáforo mirando a los coches que llegan por esa calle y señales para los que cruzan
    for(const [p,t,si] of [[a,1,(e-1)/2],[b,-1,((e+1)/2)%4]]){const st=bk.str[si];if(!st||st.type==='ped'||st.type==='superilla')continue;
      // dirección de la calle junto a esta esquina y sentido hacia el cruce
      const sx=st.ax==='v'?0:1,sz=st.ax==='v'?1:0;const tox=-ux*t,toz=-uz*t;let toward=Math.sign(sx*tox+sz*toz)||1;
      const q=[p[0]-nx*0.45+ux*t*0.5,p[1]-nz*0.45+uz*t*0.5];const y=surfY(q[0],q[1]);
      const approach=!st.dir||(st.dir===toward);
      if(approach){const yaw=Math.atan2(-sx*toward,-sz*toward);const cy0=Math.cos(yaw),sy0=Math.sin(yaw);
        // báculo hacia el centro de la calzada de esta calle
        const lat=st.ax==='v'?[Math.sign(st.pos-q[0]),0]:[0,Math.sign(st.pos-q[1])];const side=lat[0]*cy0-lat[1]*sy0;const big=st.w>=20;
        addInst(big?(side>0?'semaforBR':'semaforBL'):'semafor',q[0],y,q[1],yaw);solidBox(q[0],q[1],0.08,0.08,0,y,y+3.5);
        // placa con el nombre de la calle que cruza y hacia dónde se puede girar
        const oi=si===(e-1)/2?((e+1)/2)%4:(e-1)/2;const os=bk.str[oi];
        if(os&&os.n&&os.dir&&os.type!=='ped'&&os.type!=='superilla'){const k=ALLSTR.indexOf(os);if(k>=0){const ox=os.ax==='v'?0:1,oz=os.ax==='v'?1:0;const dvx=sx*toward,dvz=sz*toward;const rx=-dvz,rz=dvx;const right=(ox*os.dir*rx+oz*os.dir*rz)>0;
          addInst('stPlate',q[0],y+3.42,q[1],yaw,1,1,1,k*2+(right?0:1));}}
        if(st.dir&&Math.random()<0.5)signOn(q[0]+sy0*0.075,y+3.8,q[1]+cy0*0.075,yaw,3,true);}
      else if(st.dir){// salida del cruce: dirección prohibida mirando al cruce
        const yaw=Math.atan2(sx*toward,sz*toward);addInst('signPole',q[0],y,q[1],0);signOn(q[0]+sx*toward*0.06,y+2.75,q[1]+sz*toward*0.06,yaw,1,true);solidBox(q[0],q[1],0.05,0.05,0,y,y+3);
        // sentido único (flecha) para los que pasan por la otra calle: dos caras
        const oyaw=Math.atan2(sz,sx);const ar=Math.atan2(-Math.cos(oyaw),Math.sin(oyaw));
        for(const sg of [1,-1]){const yw=oyaw+(sg<0?Math.PI:0);const axx=-Math.cos(yw),azz=Math.sin(yw);const flip=(axx*sx+azz*sz)*(st.dir)<0;signOn(q[0]+Math.sin(yw)*0.05,y+2.1,q[1]+Math.cos(yw)*0.05,yw,0,false,flip);}}}}
  // placas con el nombre de la calle en las esquinas de los edificios
  for(let e=1;e<8;e+=2){const a=bk.bp[e],b=bk.bp[(e+1)%8];const L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<3)continue;const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;let nx=-uz,nz=ux;
    if(nx*((a[0]+b[0])/2-c[0])+nz*((a[1]+b[1])/2-c[1])<0){nx=-nx;nz=-nz;}
    for(const [t,si] of [[0.62,(e-1)/2],[L-0.62,((e+1)/2)%4]]){const s=bk.str[si];if(!s||!s.n)continue;const idx=ALLSTR.indexOf(s);if(idx<0)continue;const x=a[0]+ux*t+nx*0.02,z=a[1]+uz*t+nz*0.02;const y=H(x,z)+CURB+2.95;
      addInst('plaqueSlab',x,y,z,Math.atan2(nx,nz));addInst('plaque',x+nx*0.016,y,z+nz*0.016,Math.atan2(nx,nz),1,1,1,idx);}}
  // señales de sentido único en las esquinas (en el poste del semáforo / poste propio)
}
function trafficSignsOld(){for(let i=0;i<NXS;i++)for(let j=0;j<NZS;j++){const V=VSTR[i],Hh=HSTR[j];
  for(const [s,o] of [[V,Hh],[Hh,V]]){if(!s.dir||s.type==='rambla')continue;const ua=s.ax==='v'?[0,1]:[1,0];
    // señal de sentido obligatorio en la esquina de salida y dirección prohibida en la de entrada
    const cx=V.pos,cz=Hh.pos;const off=o.w/2+2,side=s.w/2-s.sw+0.6;
    for(const sg of [-1,1]){const a=sg*off;const along=s.ax==='v'?cz:cx;const q=SP(s,along+a,(s.w/2-0.6)*(sg>0?1:-1));const y=surfY(q[0],q[1]);
      const yaw=(s.ax==='v'?(sg>0?0:Math.PI):(sg>0?Math.PI/2:-Math.PI/2));addInst('signPole',q[0],y,q[1],0);
      const prohib=(sg>0)!==(s.dir>0);addInst('signFace',q[0],y+2.75,q[1],yaw+Math.PI,1,1,1,prohib?1:0);if(!prohib)addInst('signFace',q[0],y+2.75,q[1],yaw,1,1,1,0);
      addInst('signFace',q[0],y+2.1,q[1],yaw+Math.PI,1,1,1,3);solidBox(q[0],q[1],0.05,0.05,0,y,y+3);}}}}

function trafficSigns(){}
// señal en un poste: k = celda del atlas (0 sentido obligatorio, 1 prohibido, 3 «30»...), redonda o cuadrada; flip invierte la flecha
function signOn(x,y,z,yaw,k,round,flip){addInst('signFace',x,y,z,yaw,flip?-1:1,1,1,k);addInst(round?'signBackC':'signBackS',x,y,z,yaw);}
// ---------- límite del mapa: barreras militares al final de cada calle ----------
function mapLimits(){const put2=(x,z,yaw)=>{const y=surfY(x,z);addInst('jersey',x,y,z,yaw);addInst('valla',x,y+0.9,z,yaw);};
  for(let i=0;i<NXS;i++){const s=VSTR[i];for(const z of [ZMIN+10,ZMAX-10])for(let d=-s.w/2+1;d<s.w/2;d+=2.05)put2(s.pos+d,z,0);}
  for(let j=0;j<NZS;j++){const s=HSTR[j];for(const x of [XMIN+10,XMAX-10])for(let d=-s.w/2+1;d<s.w/2;d+=2.05)put2(x,s.pos+d,Math.PI/2);}
  addBoxV(XMIN-50,XMAX+50,ZMIN-10,ZMIN+10.5,-50,50);addBoxV(XMIN-50,XMAX+50,ZMAX-10.5,ZMAX+10,-50,50);addBoxV(XMIN-10,XMIN+10.5,ZMIN-50,ZMAX+50,-50,50);addBoxV(XMAX-10.5,XMAX+10,ZMIN-50,ZMAX+50,-50,50);}

// ---------- rambla central (Rambla de Catalunya) ----------
function ramblaCenter(s,a0,a1){const hw=5;const P=s.ax==='v'?[[s.pos-hw,a0],[s.pos+hw,a0],[s.pos+hw,a1],[s.pos-hw,a1]]:[[a0,s.pos-hw],[a1,s.pos-hw],[a1,s.pos+hw],[a0,s.pos+hw]];
  const c=centroid(P);const y=(x,z)=>H(x,z)+CURB;quadHUp(bufOf(c[0],c[1],'panotflor'),...P,y,US('panotflor'));
  const b=bufOf(c[0],c[1],'granite');for(let k=0;k<4;k++){const p=P[k],q=P[(k+1)%4];const ex=q[0]-p[0],ez=q[1]-p[1],l=Math.hypot(ex,ez);let nx=ez/l,nz=-ex/l;if(nx*((p[0]+q[0])/2-c[0])+nz*((p[1]+q[1])/2-c[1])<0){nx=-nx;nz=-nz;}
    wallQ(b,p[0],p[1],q[0],q[1],H(p[0],p[1])-0.05,H(p[0],p[1])+CURB,H(q[0],q[1])-0.05,H(q[0],q[1])+CURB,nx,nz,US('granite'));}
  addSidewalk(P);
  for(let a=a0+5;a<a1-4;a+=8){for(const d of [-3.4,3.4]){const q=SP(s,a,d);tree(q[0],q[1]);}const q=SP(s,a+4,0);if(((a-a0)/8|0)%3===0)put('fanalR',q[0],q[1],0,true,0.15,0.15,4.4);
    else if(Math.random()<0.5)put('banc',q[0],q[1],s.ax==='v'?Math.PI/2:0,true,0.9,0.3,0.9);else{for(let k=0;k<2;k++){const t=SP(s,a+3+k*1.6,R(-1,1));put('terrassa',t[0],t[1],R(0,6),true,0.6,0.6,1);}}}
  const qk=SP(s,(a0+a1)/2,0);put('kiosk',qk[0],qk[1],s.ax==='v'?Math.PI/2:0,true,1.5,1.0,2.6);}

function buildStreets(){buildGround();
  for(let i=-1;i<NXS;i++)for(let j=-1;j<NZS;j++){const bk=blockGeom(i,j);BLOCKS.push(bk);sidewalkRing(bk);MAPD.blocks.push(bk.bp);if(!bk.outer)sidewalkFurniture(bk);}
  // tramos de calle entre cruces
  for(let i=0;i<NXS;i++){const s=VSTR[i];for(let j=-1;j<NZS;j++){const a0=hs(j).pos+hs(j).w/2,a1=hs(j+1).pos-hs(j+1).w/2;if(j<0||j>=NZS-1)continue;
      if(s.type==='ped')pedStrip(s,a0,a1);else{roadSegment(s,a0,a1);if(s.type==='rambla')ramblaCenter(s,a0,a1);}}}
  for(let j=0;j<NZS;j++){const s=HSTR[j];for(let i=-1;i<NXS;i++){const a0=vs(i).pos+vs(i).w/2,a1=vs(i+1).pos-vs(i+1).w/2;if(i<0||i>=NXS-1)continue;
      if(s.type==='superilla'||s.type==='ped')pedStrip(s,a0,a1);else roadSegment(s,a0,a1);}}
  // cruces de la superilla con calles peatonales: plaza
  for(let i=0;i<NXS;i++)for(let j=0;j<NZS;j++){const V=VSTR[i],Hh=HSTR[j];if((V.type==='ped')&&(Hh.type==='superilla'||Hh.type==='ped')){const P=[[V.pos-V.w/2,Hh.pos-Hh.w/2],[V.pos+V.w/2,Hh.pos-Hh.w/2],[V.pos+V.w/2,Hh.pos+Hh.w/2],[V.pos-V.w/2,Hh.pos+Hh.w/2]];
      const c=centroid(P);quadHUp(bufOf(c[0],c[1],'llambordes'),...P,(x,z)=>H(x,z)+CURB,US('llambordes'));addSidewalk(P);put('font',c[0],c[1],0,true,0.25,0.25,1.5);FOUNTAINS.push({x:c[0],z:c[1]});
      for(const [dx,dz] of [[-6,-6],[6,-6],[-6,6],[6,6]])tree(c[0]+dx,c[1]+dz);}}
  trafficSigns();mapLimits();}
