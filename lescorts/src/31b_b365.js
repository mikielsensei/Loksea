// =====================================================================
// Esquina Travessera de les Corts 261 / Vallespir 203 (no está en el modelo del AMB): hecha con las fotos.
// Planta baja y primera de granito gris oscuro, RETRANQUEADAS: la acera de Vallespir mide 17 panots de 20 cm
// (3,4 m + bordillo) y la de Travessera ~7,7 m (lo que marca la rejilla de aceras). En la esquina queda el chaflán
// del 365 con su terraza. Encima, el cuerpo de viviendas vuela sobre la acera (por eso en planta parecía
// que el edificio se comía la acera).
// =====================================================================
const B365={uV:[-0.4415,-0.8973],nV:[-0.8973,0.4415],pV:[3.39,66.33],// bordillo de Vallespir (lado del edificio), normal hacia dentro
  uT:[-0.7604,0.6495],nT:[0.6495,0.7604],pT:[-52.98,10.97],// bordillo de Travessera
  baseV:3.6,baseT:7.7,upV:2.4,upT:5.7,chB:4.0,chU:4.6,hB:7.25,hTop:30.4,endV:47.8,endT:-0.7};
function b365Lines(oV,oT,ch){const B=B365;const a=[B.pV[0]+B.nV[0]*oV,B.pV[1]+B.nV[1]*oV],b=[B.pT[0]+B.nT[0]*oT,B.pT[1]+B.nT[1]*oT];
  // intersección de las dos líneas de fachada
  const d1=B.uV,d2=B.uT;const det=d1[0]*-d2[1]-(-d2[0])*d1[1];const rx=b[0]-a[0],rz=b[1]-a[1];const t=(rx*-d2[1]-(-d2[0])*rz)/det;const C=[a[0]+d1[0]*t,a[1]+d1[1]*t];
  const ang=Math.acos(clamp(B.uV[0]*B.uT[0]*-1+B.uV[1]*B.uT[1]*-1,-1,1));const s=ch/2/Math.sin(ang/2);
  const PV=[C[0]-B.uV[0]*s,C[1]-B.uV[1]*s],PT=[C[0]+B.uT[0]*s,C[1]+B.uT[1]*s];
  const EV=[B.pV[0]+B.uV[0]*B.endV+B.nV[0]*oV,B.pV[1]+B.uV[1]*B.endV+B.nV[1]*oV],ET=[B.pT[0]+B.uT[0]*B.endT+B.nT[0]*oT,B.pT[1]+B.uT[1]*B.endT+B.nT[1]*oT];
  return{C,PV,PT,EV,ET};}
function b365Polys(){const B=B365;const b=b365Lines(B.baseV,B.baseT,B.chB),u=b365Lines(B.upV,B.upT,B.chU);
  const ETb2=[b.ET[0]+B.nT[0]*3.5,b.ET[1]+B.nT[1]*3.5];const back=[[-40,20],[-35,25],[-25,25]];
  const base=[b.EV,b.PV,b.PT,b.ET,ETb2,...back];const up=[u.EV,u.PV,u.PT,u.ET,ETb2,...back,b.EV];
  return{base,up,b,u};}
// la zona que antes ocupaba el edificio (y que la rejilla marcaba como terreno) pasa a ser acera fuera de la planta baja
function b365Patch(old){const d=HMD;B365.old=old;const{base}=b365Polys();let xs=old.map(p=>p[0]),zs=old.map(p=>p[1]);
  for(let x=Math.min(...xs)-1;x<=Math.max(...xs)+1;x+=d.res*0.5)for(let z=Math.min(...zs)-1;z<=Math.max(...zs)+1;z+=d.res*0.5){
    if(!insidePoly(x,z,old)||insidePoly(x,z,base))continue;const i=Math.round((x-d.x0)/d.res),j=Math.round((z-d.z0)/d.res);const k=j*d.nx+i;if(d.k[k]===1)d.k[k]=3;}}
function b365Recs(A,y0){const B=B365;const{base,up,b,u}=b365Polys();y0=H0((b.PV[0]+b.PT[0])/2,(b.PV[1]+b.PT[1])/2);
  const sgn=P=>polyArea(P)<0?P.slice().reverse():P;const R0=sgn(base),R1=sgn(up);
  // a qué fachada pertenece un tramo y a qué distancia de la esquina queda cada extremo
  const face=(seg)=>{const{nx,nz}=seg;if(-(nx*B.nT[0]+nz*B.nT[1])>0.95)return'T';if(-(nx*B.nV[0]+nz*B.nV[1])>0.95)return'V';
    const cx=-(B.nT[0]+B.nV[0]),cz=-(B.nT[1]+B.nV[1]),cl=Math.hypot(cx,cz);if((nx*cx+nz*cz)/cl>0.95)return'X';return null;};
  const P365=poiSign([0,0,'forn','365']),PHAIR=poiSign([0,0,'perruqueria','Hair Store']);
  const shop=(d0,d1,type,name,state,o={})=>({d0,d1,kind:'shop',y1:3.25,state,shop:Object.assign({type,name,brand:name||'cerrado',awning:false,signIdx:undefined},o),room:{d:o.deep||7},lc:true});
  const UN={// distancias desde la esquina del chaflán (m)
    X:[shop(0.25,3.75,'forn','365','glass')],
    T:[shop(0.25,3.3,'forn','365','glass'),shop(3.6,6.2,'forn','365','glass'),shop(6.5,9.6,'forn','365','glass'),{d0:10.0,d1:12.0,kind:'portal',y1:3.1},
       shop(12.4,17.0,'perruqueria','Hair Store','glass',{signIdx:PHAIR})],
    V:[shop(0.6,4.6,'immo',null,'dark'),shop(5.4,10.6,'immo',null,'dark'),{d0:11.2,d1:13.0,kind:'portal',y1:3.1},shop(13.6,19.6,'immo',null,'dark')]};
  const toU=(seg,list)=>{const corner=face(seg)==='V'?b.PV:b.PT;const aNear=Math.hypot(seg.a[0]-corner[0],seg.a[1]-corner[1])<Math.hypot(seg.b[0]-corner[0],seg.b[1]-corner[1]);
    return list.filter(q=>q.d1<seg.L-0.2).map(q=>{const r=Object.assign({},q);if(q.shop)r.shop=Object.assign({},q.shop);if(aNear){r.u0=q.d0;r.u1=q.d1;}else{r.u0=seg.L-q.d1;r.u1=seg.L-q.d0;}return r;});};
  const unitsFor=(seg)=>{const f=face(seg);if(!f)return null;if(f==='X'){const r=toU(seg,UN.X);r[0].u0=0.25;r[0].u1=seg.L-0.25;return r;}return toU(seg,UN[f]);};
  // balcones de barandilla blanca apilados en las dos crujías de Travessera junto a la esquina (fotos)
  const balcFor=(seg,k,n,bay)=>{if(face(seg)!=='T')return false;const t=(k+0.5)*bay;const dA=Math.hypot(seg.a[0]-u.PT[0],seg.a[1]-u.PT[1]),dB=Math.hypot(seg.b[0]-u.PT[0],seg.b[1]-u.PT[1]);const d=dA<dB?t:seg.L-t;return d<6.6;};
  const recs=[{r:R0,h:[],y0,y1:y0+B.hB,rc:[120,118,116],sty:'b365base',name:A.name,unitsFor,b365:true},
    {r:R1,h:[],y0:y0+B.hB,y1:y0+B.hTop,rc:[176,166,150],sty:'b365up',name:A.name+' (viviendas)',noGF:true,lift:true,balcFor}];
  return recs;}
// rótulo pequeño «365» sobre la puerta, como en la foto (placa, no rótulo grande)
function b365Extras(){const{b}=b365Polys();const B=B365;const idx=poiSign([0,0,'forn','365']);if(idx===undefined)return;
  const d=4.9;const x=b.PT[0]+B.uT[0]*d-B.nT[0]*0.05,z=b.PT[1]+B.uT[1]*d-B.nT[1]*0.05;const yaw=Math.atan2(-B.nT[0],-B.nT[1]);addInst('shopSign',x,H(x,z)+3.75,z,yaw,0.62,0.16,1,idx);
  // terraza del 365: mesas negras cuadradas, sillas de lamas y jardineras negras con pintadas entre la terraza y la calzada
  const put=(dAlong,dOut,from,u,n)=>[from[0]+u[0]*dAlong+n[0]*dOut,from[1]+u[1]*dAlong+n[1]*dOut];
  const tbl=(x,z,yaw,ns)=>{const y=H(x,z);addInst('terrassaN',x,y,z,yaw);addBoxV(x-0.36,x+0.36,z-0.36,z+0.36,y,y+0.75);occAdd(x,z,1.0);
    const t={x,z,y,seats:[]};for(let c=0;c<ns;c++){const ca=yaw+c*(ns===2?Math.PI:Math.PI/2);const sx=x+Math.sin(ca)*0.6,sz=z+Math.cos(ca)*0.6;addInst('cadiraN',sx,y,sz,ca+Math.PI);t.seats.push({x:sx,z:sz,yaw:ca+Math.PI,y:y+0.46,used:null});}TERR.push(t);};
  const out=[-B.nT[0],-B.nT[1]];const yT=Math.atan2(B.uT[0],B.uT[1]);
  for(let i=0;i<4;i++)tbl(...put(1.2+i*2.1,2.6,b.PT,B.uT,out),yT,i%2?2:4);
  for(let i=0;i<4;i++)tbl(...put(1.8+i*2.1,4.3,b.PT,B.uT,out),yT,2);
  for(let i=0;i<2;i++){const [x,z]=put(1.0+i*2.0,6.0,b.PT,B.uT,out);if(occFree(x,z,1.2)){const y=H(x,z);addInst('jardNegra',x,y,z,yT,1,1,1,i%2);solidBox(x,z,1.7,0.62,yT,y,y+0.8);occAdd(x,z,1.3);}}
  // estores blancos bajados detrás de los ventanales de Vallespir (fotos 4 y 5)
  {const yb=H(b.PV[0]-B.nV[0]*1.5,b.PV[1]-B.nV[1]*1.5);const Bf=bufOf(b.PV[0],b.PV[1],'plaster_grey');TINT=[1.32,1.32,1.3];
    for(const [d0,d1] of [[0.6,4.6],[5.4,10.6],[13.6,19.6]]){const p0=[b.PV[0]-B.uV[0]*(d0+0.12)+B.nV[0]*0.18,b.PV[1]-B.uV[1]*(d0+0.12)+B.nV[1]*0.18],p1=[b.PV[0]-B.uV[0]*(d1-0.12)+B.nV[0]*0.18,b.PV[1]-B.uV[1]*(d1-0.12)+B.nV[1]*0.18];
      wall(Bf,p0[0],p0[1],p1[0],p1[1],yb+1.0,yb+3.4,-B.nV[0],-B.nV[1],US('plaster_grey'));}TINT=[1,1,1];}
  // en el chaflán, delante del escaparate de la esquina
  const cx=(b.PV[0]+b.PT[0])/2,cz=(b.PV[1]+b.PT[1])/2;const on=[-(B.nT[0]+B.nV[0]),-(B.nT[1]+B.nV[1])];const ol=Math.hypot(on[0],on[1]);on[0]/=ol;on[1]/=ol;const ou=[on[1],-on[0]];
  for(const [aa,oo] of [[-1.0,2.0],[1.0,2.0],[0,3.8]])tbl(cx+ou[0]*aa+on[0]*oo,cz+ou[1]*aa+on[1]*oo,Math.atan2(ou[0],ou[1]),aa?4:2);
  // quiosco de prensa de Travessera (delante del vecino, junto al bordillo)
  {const x=B.pT[0]+B.uT[0]*1.0+B.nT[0]*2.3,z=B.pT[1]+B.uT[1]*1.0+B.nT[1]*2.3,y=H(x,z);const yaw=Math.atan2(B.nT[0],B.nT[1]);addInst('kioskP',x,y,z,yaw);solidBox(x,z,2.9,2.1,yaw+Math.PI/2,y,y+2.7);occAdd(x,z,2.2);}}
// antes de repartir bancos y papeleras por el bordillo se reserva el sitio de la terraza y del quiosco
function b365Reserve(){const{b}=b365Polys();const B=B365;const out=[-B.nT[0],-B.nT[1]];
  for(let d=0.5;d<10.5;d+=1.5)for(const o of [2.6,4.3,6.0])occAdd(b.PT[0]+B.uT[0]*d+out[0]*o,b.PT[1]+B.uT[1]*d+out[1]*o,1.3);
  const cx=(b.PV[0]+b.PT[0])/2,cz=(b.PV[1]+b.PT[1])/2;const on=[-(B.nT[0]+B.nV[0]),-(B.nT[1]+B.nV[1])];const ol=Math.hypot(on[0],on[1]);for(const o of [1.5,3.0,4.5])occAdd(cx+on[0]/ol*o,cz+on[1]/ol*o,2.2);
  occAdd(B.pT[0]+B.uT[0]*1.0+B.nT[0]*2.3,B.pT[1]+B.uT[1]*1.0+B.nT[1]*2.3,2.4);}
// ---------- mobiliario propio ----------
{const BK=0x1e1f21;
  defInst('terrassaN',mkG([[bx(0.7,0.03,0.7,0,0.73,0),0x26282a],[cy(0.03,0.03,0.7,0,0.36,0,6),BK],[bx(0.5,0.02,0.06,0,0.01,0),BK],[bx(0.06,0.02,0.5,0,0.01,0),BK]]),plasticMat,1,1,false);
  const ch=[[bx(0.44,0.03,0.42,0,0.45,0),BK]];for(let i=0;i<5;i++)ch.push([bx(0.44,0.035,0.025,0,0.52+i*0.085,-0.21+Math.sin(0)*0,0,-0.12,0),BK]);
  for(const [x,z] of [[-0.2,-0.19],[0.2,-0.19],[-0.2,0.19],[0.2,0.19]])ch.push([cy(0.014,0.014,0.45,x,0.22,z,5),BK]);ch.push([bx(0.03,0.45,0.03,-0.2,0.68,-0.2),BK],[bx(0.03,0.45,0.03,0.2,0.68,-0.2),BK],[bx(0.03,0.03,0.4,-0.21,0.66,0),BK],[bx(0.03,0.03,0.4,0.21,0.66,0),BK]);
  defInst('cadiraN',mkG(ch),plasticMat,1,1,false);
  // jardinera negra con pintadas (dos variantes) y plantas encima
  const texJN=cTex(512,256,(g,w,h)=>{for(let v=0;v<2;v++){const y0=v*128;g.fillStyle='#1b1c1e';g.fillRect(0,y0,w,128);for(let i=0;i<300;i++){g.fillStyle=`rgba(255,255,255,${R(0.01,0.04)})`;g.fillRect(R(0,w),y0+R(0,128),R(1,4),R(1,4));}
      g.save();g.translate(w/2,y0+70);g.rotate(R(-0.08,0.05));g.strokeStyle='#e8e8e2';g.lineWidth=7;g.lineJoin='round';g.font=`bold ${v?78:70}px "Comic Sans MS",cursive`;g.textAlign='center';g.textBaseline='middle';g.strokeText(v?'BSKO':'toner',0,0);g.lineWidth=2;g.strokeStyle='#9a9a96';g.strokeText(v?'BSKO':'toner',3,3);g.restore();}},{});
  const jb=bx(1.7,0.72,0.62,0,0.36,0);defInst('jardNegra',jb,new THREE.MeshLambertMaterial({map:texJN}),1,2,false);
  const pl=[];for(let i=0;i<7;i++)pl.push([ell(0.2,0.32,0.2,-0.7+i*0.23,0.95,R(-0.12,0.12),6),i%2?0x4e6b35:0x5f7f3c]);for(let i=0;i<6;i++)pl.push([bx(0.03,0.5,0.12,-0.6+i*0.24,1.05,0.05,0.3,0,R(-0.4,0.4)),0x6f8f45]);
  defInst('jardNegraPl',mkG(pl),plasticMat,1,1,false);INST.jardNegra.parts=['jardNegraPl'];
  // quiosco de elPeriódico: caja metálica clara, cabecera roja, revistas colgadas en el frente y los lados
  const texK=cTex(512,256,(g,w,h)=>{g.fillStyle='#c8102e';g.fillRect(0,0,w,56);g.fillStyle='#fff';g.font='bold 40px Georgia,serif';g.textAlign='center';g.textBaseline='middle';g.fillText('elPeriódico',w/2,30);
    g.fillStyle='#d9dbd8';g.fillRect(0,56,w,200);const C=['#e63946','#1d3557','#f4a261','#2a9d8f','#ffb703','#8338ec','#ff006e','#3a86ff','#fb5607','#06d6a0','#118ab2','#ef476f'];
    for(let r=0;r<3;r++)for(let c=0;c<9;c++){const x=10+c*55,y=66+r*62;g.fillStyle=C[(r*9+c*5)%C.length];g.fillRect(x,y,46,56);g.fillStyle='rgba(255,255,255,.85)';g.fillRect(x+4,y+4,38,10);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x+6,y+22,30,4);g.fillRect(x+6,y+30,22,4);}},{});
  const kb=new THREE.BoxGeometry(2.9,2.3,2.1);kb.translate(0,1.15+0.05,0);const kt=new THREE.BoxGeometry(3.3,0.12,2.5);kt.translate(0,2.42,0);
  defInst('kioskP',mergeGeometries([kb,kt].map(g=>g.toNonIndexed())),new THREE.MeshLambertMaterial({map:texK}),1,1,false);
  defInst('kioskPBase',mkG([[bx(3.0,0.1,2.2,0,0.05,0),0x8e9290],[bx(0.06,2.2,0.06,1.42,1.2,1.02),0xb0b2b0],[bx(0.06,2.2,0.06,-1.42,1.2,1.02),0xb0b2b0]]),paintMat,1,1,false);INST.kioskP.parts=['kioskPBase'];}
