// =====================================================================
// MERCAT DEL NINOT (C. Mallorca 133-157, entre Villarroel y Casanova)
// Nave de 1933 (Antoni de Falguera) reformada en 2015 (Josep Lluís Mateo): cuerpo central alto con fachadas de ladrillo
// visto y un enorme vitral en arco (a Mallorca y al pasaje interior), tres cuerpos más bajos a cada lado cerrados con
// lamas metálicas perforadas que se abren abajo en paradas exteriores; dos patios a los lados a los que se entra por los
// xamfrans. Dentro, estructura metálica y paradas en dos ejes ortogonales. Aquí: abandonado, sucio y saqueado.
// =====================================================================
MATS.rust=photoMat('rust',{ns:0.9,roughness:0.75,metalness:0.35});weatherMat(MATS.rust,0.8);
const NINOT_DEPTH=48,NINOT_HW=37,NINOT_CUT=56;
// triángulos de una forma 2D (s a lo largo de U, t hacia arriba) a un buffer de la zona
function shapeInto(b,shape,ox,oz,ux,uz,y0,nx,nz,us){const g=new THREE.ShapeGeometry(shape,20);const p=g.attributes.position,ix=g.index.array;
  const flip=(-uz*nx+ux*nz)<0;// la normal de la forma (+Z local) apunta a U×Y=(-uz,0,ux)
  for(let i=0;i<ix.length;i+=3){const tri=flip?[ix[i],ix[i+2],ix[i+1]]:[ix[i],ix[i+1],ix[i+2]];
    for(const k of tri){const s=p.getX(k),t=p.getY(k);pushV(b,ox+ux*s,y0+t,oz+uz*s,nx,0,nz,s*us,(y0+t)*us);}}g.dispose();}
// cuadrilátero inclinado (tejados)
function quad3(b,A,B,C,D,us,down){const e1=[B[0]-A[0],B[1]-A[1],B[2]-A[2]],e2=[D[0]-A[0],D[1]-A[1],D[2]-A[2]];let n=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];const l=Math.hypot(...n)||1;n=n.map(v=>v/l);
  let P=[A,B,C,D];if((n[1]<0)!==!!down){P=[A,D,C,B];n=n.map(v=>-v);}
  const L1=Math.hypot(...e1);const uv=q=>{const d=[q[0]-A[0],q[1]-A[1],q[2]-A[2]];return[(d[0]*e1[0]+d[1]*e1[1]+d[2]*e1[2])/L1*us,Math.hypot(d[0]-(d[0]*e1[0]+d[1]*e1[1]+d[2]*e1[2])/L1/L1*e1[0],d[1]-(d[0]*e1[0]+d[1]*e1[1]+d[2]*e1[2])/L1/L1*e1[1],d[2]-(d[0]*e1[0]+d[1]*e1[1]+d[2]*e1[2])/L1/L1*e1[2])*us];};
  for(const q of [P[0],P[1],P[2],P[0],P[2],P[3]]){const t=uv(q);pushV(b,q[0],q[1],q[2],n[0],n[1],n[2],t[0],t[1]);}}
// vitral en arco: retícula de hierro, cristal lechoso sucio, paneles rotos
const texNinotArch=cTex(512,512,(g,w,h)=>{g.clearRect(0,0,w,h);const cols=10,rows=11;
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const x=c*w/cols,y=r*h/rows;const br=Math.random();if(br<0.16)continue;
    const a=br<0.24?0.35:0.82;const v=150+Math.random()*40;g.fillStyle=`rgba(${v+20|0},${v+10|0},${v-10|0},${a})`;g.fillRect(x,y,w/cols,h/rows);
    const gr=g.createLinearGradient(0,y,0,y+h/rows);gr.addColorStop(0,'rgba(60,50,35,0)');gr.addColorStop(1,`rgba(60,48,30,${0.25+Math.random()*0.4})`);g.fillStyle=gr;g.fillRect(x,y,w/cols,h/rows);
    if(br<0.35){g.strokeStyle='rgba(255,255,255,0.55)';g.lineWidth=1;g.beginPath();const cx=x+Math.random()*w/cols,cy=y+Math.random()*h/rows;for(let k=0;k<5;k++){g.moveTo(cx,cy);g.lineTo(cx+(Math.random()-0.5)*60,cy+(Math.random()-0.5)*60);}g.stroke();}}
  g.fillStyle='rgba(30,30,28,1)';for(let c=0;c<=cols;c++)g.fillRect(c*w/cols-3,0,6,h);for(let r=0;r<=rows;r++)g.fillRect(0,r*h/rows-3,w,6);
  g.fillStyle='rgba(40,42,40,1)';for(let c=0;c<=cols;c+=5)g.fillRect(c*w/cols-6,0,12,h);
  for(let i=0;i<40;i++){g.fillStyle=`rgba(40,30,20,${Math.random()*0.35})`;g.beginPath();g.arc(Math.random()*w,Math.random()*h,8+Math.random()*30,0,7);g.fill();}});
const ninotArchMat=new THREE.MeshLambertMaterial({map:texNinotArch,transparent:true,alphaTest:0.04,side:THREE.DoubleSide,depthWrite:false});
const texNinotLetters=cTex(1024,96,(g,w,h)=>{g.clearRect(0,0,w,h);g.font='bold 74px Helvetica, Arial, sans-serif';g.textBaseline='middle';
  const txt='MERCAT DEL NINOT';let x=40;for(const ch of txt){const cw=g.measureText(ch).width;if(ch!==' '&&Math.random()<0.1){x+=cw+6;continue;}// letras arrancadas
    const tilt=Math.random()<0.12?R(-0.25,0.25):0;g.save();g.translate(x+cw/2,h/2+(tilt?8:0));g.rotate(tilt);g.fillStyle='#2a2622';g.fillText(ch,-cw/2+3,3);g.fillStyle=pick(['#8a8478','#7d776c','#6f5a44']);g.fillText(ch,-cw/2,0);g.restore();x+=cw+6;}});
const ninotLetMat=new THREE.MeshLambertMaterial({map:texNinotLetters,transparent:true,alphaTest:0.3});
const ninotSkyMat=new THREE.MeshLambertMaterial({color:0xd8d4c8,emissive:0x4a4840,transparent:true,opacity:0.78,side:THREE.DoubleSide,depthWrite:false});
const NINOT_STALLS=[['Barra Perelló 1898','bar'],['La Bikineria','bar'],['Tierra','bar'],['Cuina El Ninot','bar'],['Fruites i Verdures Montse','fruta'],['Peix Fresc Ninot','peix'],['Carns Ramon','carn'],['Xarcuteria Pujol','carn'],
  ['Formatges i Embotits','carn'],['Ous i Aviram','ous'],['Bacallaneria','peix'],['Olives i Conserves','olives'],['Llegums Cuits','olives'],['Fleca del Mercat','fleca'],['Herbes i Espècies','olives'],['Congelats','peix'],['Marisc Gallec','peix'],['Fruites Tropicals','fruta']];
const STALLCOL={bar:'#3b2a1e',fruta:'#3e6b2a',peix:'#1f5a7a',carn:'#8a2a22',ous:'#c79a2a',olives:'#5e6a2a',fleca:'#9a6a2a'};
function ninotSign(name,type){return signCell('ninotst_'+name,(g,w,h)=>{g.fillStyle='#262829';g.fillRect(0,0,w,h);g.fillStyle=STALLCOL[type]||'#555';g.fillRect(0,h-16,w,16);
  g.fillStyle='#ece6d8';g.textAlign='center';g.textBaseline='middle';let fs=46;g.font=`bold ${fs}px Helvetica, Arial, sans-serif`;while(g.measureText(name).width>w-30&&fs>20){fs-=2;g.font=`bold ${fs}px Helvetica, Arial, sans-serif`;}g.fillText(name,w/2,h/2-6);
  g.fillStyle='rgba(60,45,30,0.35)';for(let i=0;i<14;i++)g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*30,1+Math.random()*12);});}

// geometría completa; bk = manzana, devuelve datos del campamento
function buildNinot(bk){const{x0,x1,z0,z1}=bk;const cx=(x0+x1)/2,F=z1,zb=F-NINOT_DEPTH,zc=F-NINOT_CUT;const yF=H(cx,F)+CURB+0.02;const D=BDEPTH,c=CHAMF;
  const naves=[[-37,-28,6.4,8.4],[-28,-19,7.2,9.3],[-19,-10,8.0,10.2],[-10,10,11.5,16.5],[10,19,8.0,10.2],[19,28,7.2,9.3],[28,37,6.4,8.4]];// [x0,x1,alero,cumbrera]
  const BRICK=hexTint('#c98a64'),SLAT=[0.86,0.88,0.87],ROOF=[0.62,0.58,0.54];
  // ---------- suelos exteriores: patios, pasaje y patio de manzana ----------
  const yG=(x,z)=>H(x,z)+CURB+0.01;
  const patios=[[[x0,zc],[cx-NINOT_HW,zc],[cx-NINOT_HW,F],[x0+c,F],[x0,F-c]],[[cx+NINOT_HW,zc],[x1,zc],[x1,F-c],[x1-c,F],[cx+NINOT_HW,F]],
    [[cx-NINOT_HW,zc],[cx+NINOT_HW,zc],[cx+NINOT_HW,zb],[cx-NINOT_HW,zb]],[[x0+D,z0+D],[x1-D,z0+D],[x1-D,zc],[x0+D,zc]]];
  patios.forEach((P,k)=>{const ctr=centroid(P);const m=k===2?'llambordes':k===3?'concrete':'panot4';TINT=k===3?[0.8,0.78,0.74]:[0.86,0.84,0.8];capPoly(bufOf(ctr[0],ctr[1],m),P,yG,US(m));TINT=[1,1,1];addFloor(P,0,yG);});
  // paredes traseras de las casas que dan al patio de manzana y testeros de las de Villarroel y Casanova
  {const tint=hexTint('#ddd2be');TINT=tint;const B=bufOf(cx,z0+D,'plaster_cream');
    wall(B,x0+D,z0+D,x1-D,z0+D,yG(cx,z0+D)-0.3,yG(cx,z0+D)+21,0,1,US('plaster_cream'));
    wall(B,x0+D,z0+D,x0+D,zc,yG(x0,zc)-0.3,yG(x0,zc)+19,1,0,US('plaster_cream'));wall(B,x1-D,z0+D,x1-D,zc,yG(x1,zc)-0.3,yG(x1,zc)+19,-1,0,US('plaster_cream'));
    TINT=[0.9,0.88,0.84];const Bc=bufOf(cx,zc,'concrete_wall');wall(Bc,x0,zc+0.02,x0+D,zc+0.02,yG(x0,zc)-0.3,yG(x0,zc)+4.95,0,1,US('concrete_wall'));wall(Bc,x1-D,zc+0.02,x1,zc+0.02,yG(x1,zc)-0.3,yG(x1,zc)+4.95,0,1,US('concrete_wall'));TINT=[1,1,1];
    for(const [xa,xb,zz,nx,nz] of [[x0+D,x1-D,z0+D,0,1]]){const L=xb-xa,n=Math.floor(L/3.3);for(let f=1;f<6;f++)for(let q=0;q<n;q++){const x=xa+(q+0.5)*L/n;addInst('win',x,yG(x,zz)+4.6+(f-1)*3.15,zz+0.02,Math.atan2(nx,nz),1.0,1.5,1,pick([2,3,4,0,1]),Math.random()<0.1?1:0);}}
    for(const [xx,nx] of [[x0+D,1],[x1-D,-1]]){const L=zc-(z0+D),n=Math.floor(L/3.3);for(let f=1;f<6;f++)for(let q=0;q<n;q++){const z=z0+D+(q+0.5)*L/n;addInst('win',xx+nx*0.02,yG(xx,z)+4.6+(f-1)*3.15,z,Math.atan2(nx,0),1.0,1.5,1,pick([2,3,4,0,1]),0);}}}
  // ---------- fachadas ----------
  const B=bufOf(cx,F,'brick'),Bs=bufOf(cx,F,'shutter'),Bsr=bufOf(cx,F,'shutter_rust'),Br=bufOf(cx,F-24,'rust');
  for(const [zz,nz,front] of [[F,1,true],[zb,-1,false]]){
    for(const [a,b2,E,Rr] of naves){const xa=cx+a,xb=cx+b2,xm=(xa+xb)/2,w=xb-xa;
      if(a===-10){// cuerpo central: ladrillo con el vitral en arco (el hueco baja hasta el suelo: la entrada)
        const s=new THREE.Shape();s.moveTo(-10,-0.8);s.lineTo(-7,-0.8);s.lineTo(-7,7.5);s.absarc(0,7.5,7,Math.PI,0,true);s.lineTo(7,-0.8);s.lineTo(10,-0.8);s.lineTo(10,E);s.lineTo(0,Rr);s.lineTo(-10,E);s.lineTo(-10,-0.8);
        TINT=BRICK;shapeInto(B,s,xm,zz,nz>0?1:-1,0,yF,0,nz,US('brick'));TINT=[0.78,0.6,0.5];shapeInto(B,s,xm,zz-nz*0.3,nz>0?1:-1,0,yF,0,-nz,US('brick'));TINT=[1,1,1];
        // pilastras, impostas y cornisa de piedra
        for(const px of [-10,-7.2,7.2,10])furn('stone_blocks',xm+px,yF-0.5,zz+nz*0.18,0.7,E+0.5+(Math.abs(px)<8?-3.5:0),0.36,0,'#d8cfc0',false);
        furn('stone_blocks',xm,yF+E-0.2,zz+nz*0.2,21,0.45,0.42,0,'#cfc6b6',false);
        // vitral (de 4 m hasta el arco) y travesaño con las letras
        const sg=new THREE.Shape();sg.moveTo(-7,4.4);sg.lineTo(7,4.4);sg.lineTo(7,7.5);sg.absarc(0,7.5,7,0,Math.PI,false);sg.lineTo(-7,4.4);
        const gg=new THREE.ShapeGeometry(sg,24);const uv=gg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)+7)/14,(uv.getY(i)-4.4)/10.1);
        const gm=new THREE.Mesh(gg,ninotArchMat);gm.position.set(xm,yF,zz-nz*0.12);gm.rotation.y=nz>0?0:Math.PI;gm.renderOrder=2;scene.add(gm);
        furn('stone_blocks',xm,yF+3.9,zz,14.2,0.55,0.5,0,'#c9c0b0',false);
        for(let k=-2;k<=2;k++){furn('woodf',xm+k*3.3,yF,zz-nz*0.15,0.14,3.9,0.14,0,'#2b2e2c',false);}// montantes de las puertas
        if(front){const lg=new THREE.PlaneGeometry(13,1.2);const lm=new THREE.Mesh(lg,ninotLetMat);lm.position.set(xm,yF+4.95,zz+nz*0.3);scene.add(lm);
          // persiana medio arrancada y puertas de cristal rotas
          for(let i=0;i<14;i++)addInst('shards',xm+R(-6,6),yF+0.02,zz+nz*R(-1.5,2),R(0,6.28));}
        else{TINT=[0.7,0.68,0.64];shapeInto(Bsr,(()=>{const q=new THREE.Shape();q.moveTo(-7,-0.8);q.lineTo(7,-0.8);q.lineTo(7,3.9);q.lineTo(-7,3.9);q.lineTo(-7,-0.8);return q;})(),xm,zz+nz*0.05,nz>0?1:-1,0,yF,0,nz,US('shutter_rust'));TINT=[1,1,1];}
        continue;}
      // cuerpos laterales: lamas metálicas (ahora mugrientas) y persianas de las paradas exteriores abajo
      const s=new THREE.Shape();s.moveTo(-w/2,-0.8);s.lineTo(w/2,-0.8);s.lineTo(w/2,E);s.lineTo(0,Rr);s.lineTo(-w/2,E);s.lineTo(-w/2,-0.8);
      TINT=SLAT;shapeInto(Bs,s,xm,zz,nz>0?1:-1,0,yF,0,nz,US('shutter')*0.6);TINT=[0.55,0.56,0.55];shapeInto(Bs,s,xm,zz-nz*0.12,nz>0?1:-1,0,yF,0,-nz,US('shutter')*0.6);TINT=[1,1,1];
      const sh=new THREE.Shape();sh.moveTo(-w/2+0.4,0);sh.lineTo(w/2-0.4,0);sh.lineTo(w/2-0.4,3.1);sh.lineTo(-w/2+0.4,3.1);sh.lineTo(-w/2+0.4,0);
      TINT=[0.82,0.8,0.76];shapeInto(Bsr,sh,xm,zz+nz*0.07,nz>0?1:-1,0,yF,0,nz,US('shutter_rust'));TINT=[1,1,1];
      furn('woodf',xm,yF+3.1,zz+nz*0.25,w-0.4,0.25,0.5,0,'#3a3c3a',false);// marquesina de la parada exterior
      if(Math.random()<0.8)addInst('graffiti',xm+R(-1.5,1.5),yF+1.6,zz+nz*0.1,nz>0?0:Math.PI,R(2,3.4),R(1.3,2),1,(Math.random()*16)|0);}}
  // fachadas laterales a los patios (lamas, persianas abajo y una puerta a cada patio)
  for(const sx of [-1,1]){const xx=cx+sx*NINOT_HW;const E=6.4;const dz0=F-9,dz1=F-4.6;
    for(const [za,zb2] of [[zb,dz0],[dz1,F]]){TINT=SLAT;wall(Bs,xx,za,xx,zb2,yF-0.8,yF+E,sx,0,US('shutter')*0.6);TINT=[0.55,0.56,0.55];wall(Bs,xx-sx*0.12,za,xx-sx*0.12,zb2,yF-0.8,yF+E,-sx,0,US('shutter')*0.6);TINT=[1,1,1];addOBB(xx,(za+zb2)/2,0.15,(zb2-za)/2,0,yF-1,yF+E);}
    TINT=SLAT;wall(Bs,xx,dz0,xx,dz1,yF+3.3,yF+E,sx,0,US('shutter')*0.6);TINT=[0.55,0.56,0.55];wall(Bs,xx-sx*0.12,dz0,xx-sx*0.12,dz1,yF+3.3,yF+E,-sx,0,US('shutter')*0.6);TINT=[1,1,1];
    for(let z=zb+2;z<dz0-3;z+=6){TINT=[0.8,0.78,0.74];wall(Bsr,xx+sx*0.07,z,xx+sx*0.07,z+4.6,yF,yF+3.0,sx,0,US('shutter_rust'));TINT=[1,1,1];if(Math.random()<0.6)addInst('graffiti',xx+sx*0.1,yF+1.5,z+2.3,sx>0?Math.PI/2:-Math.PI/2,R(2,3.2),R(1.2,1.9),1,(Math.random()*16)|0);}
    furn('woodf',xx+sx*0.2,yF+3.3,(dz0+dz1)/2,0.4,0.3,dz1-dz0+0.6,0,'#2b2e2c',false);}
  // colisión: frente (menos la entrada), fondo
  addOBB(cx-(NINOT_HW+7)/2,F-0.15,(NINOT_HW-7)/2,0.2,0,yF-1,yF+12);addOBB(cx+(NINOT_HW+7)/2,F-0.15,(NINOT_HW-7)/2,0.2,0,yF-1,yF+12);addOBB(cx,zb+0.15,NINOT_HW,0.2,0,yF-1,yF+12);
  // ---------- tejados ----------
  for(const [a,b2,E,Rr] of naves){const xa=cx+a,xb=cx+b2,xm=(xa+xb)/2;const za=zb-0.5,zz=F+0.5;
    for(const [xe,xr] of [[xa,xm],[xb,xm]]){const xe2=xe+(xe<xm?-0.3:0.3);
      const A=[xe2,yF+E-0.15,za],Bq=[xe2,yF+E-0.15,zz],C=[xr,yF+Rr,zz],Dq=[xr,yF+Rr,za];TINT=ROOF;quad3(Br,A,Bq,C,Dq,US('rust'));TINT=[0.32,0.3,0.28];quad3(Br,[xe,yF+E-0.25,za],[xe,yF+E-0.25,zz],[xr,yF+Rr-0.1,zz],[xr,yF+Rr-0.1,za],US('rust'),true);TINT=[1,1,1];}
    // claraboya lechosa a lo largo de la cumbrera
    const sg=new THREE.PlaneGeometry(2.2,NINOT_DEPTH-4);sg.rotateX(-Math.PI/2);const sm=new THREE.Mesh(sg,ninotSkyMat);sm.position.set(xm,yF+Rr-0.35,(zb+F)/2);scene.add(sm);}
  // paños entre naves de distinta altura (lucernarios)
  for(let k=0;k<naves.length-1;k++){const A=naves[k],Bn=naves[k+1];const x=cx+A[1];const lo=Math.min(A[2],Bn[2]),hi=Math.max(A[2],Bn[2]);if(hi-lo<0.3)continue;
    const g=new THREE.PlaneGeometry(NINOT_DEPTH,hi-lo);g.rotateY(Math.PI/2);const m=new THREE.Mesh(g,ninotSkyMat);m.position.set(x,yF+(hi+lo)/2,(zb+F)/2);scene.add(m);}
  // ---------- estructura metálica (una sola malla) ----------
  {const parts=[],GR=0x34463c;const rows=[];for(let z=F-4;z>zb+1;z-=8)rows.push(z);
    for(const [a,b2,E,Rr] of naves){const xa=a,xb=b2,xm=(a+b2)/2,w=b2-a;const ang=Math.atan2(Rr-E,w/2),rl=Math.hypot(w/2,Rr-E);
      for(const z of rows){const lz=z-(zb+F)/2;
        parts.push([bx(w,0.16,0.12,xm,E-0.6,lz),GR],[bx(rl,0.18,0.12,(xa+xm)/2,(E+Rr)/2-0.25,lz,0,0,ang),GR],[bx(rl,0.18,0.12,(xb+xm)/2,(E+Rr)/2-0.25,lz,0,0,-ang),GR],[bx(0.1,Rr-E+0.4,0.1,xm,(E+Rr)/2-0.6,lz),GR]);
        for(const f of [0.25,0.75]){const x=xa+w*f,top=E+(Rr-E)*(1-Math.abs(f-0.5)*2)-0.3;parts.push([bx(0.06,top-(E-0.6),0.06,x,(top+E-0.6)/2,lz,0,0,f<0.5?0.35:-0.35),GR]);}}
      parts.push([bx(0.14,0.2,NINOT_DEPTH,xm,Rr-0.45,0),GR],[bx(0.14,0.2,NINOT_DEPTH,xa+0.2,E-0.5,0),GR],[bx(0.14,0.2,NINOT_DEPTH,xb-0.2,E-0.5,0),GR]);}
    for(const x of [-28,-19,-10,10,19,28])for(const z of rows){const lz=z-(zb+F)/2;const E=Math.max(...naves.filter(n=>n[0]===x||n[1]===x).map(n=>n[2]));
      parts.push([cy(0.13,0.16,E,x,E/2,lz,8),GR],[bx(0.42,0.3,0.42,x,0.15,lz),0x5a5a54],[bx(0.6,0.12,0.6,x,E-0.65,lz),GR]);addBoxV(cx+x-0.16,cx+x+0.16,z-0.16,z+0.16,yF,yF+E);}
    const m=landmarkMesh(mkG(parts),paintMat);m.position.set(cx,yF,(zb+F)/2);}
  // ---------- suelo interior ----------
  {const P=[[cx-NINOT_HW,zb],[cx+NINOT_HW,zb],[cx+NINOT_HW,F],[cx-NINOT_HW,F]];INTERIOR=true;TINT=[0.66,0.62,0.56];capPoly(bufOf(cx,F-24,'floor_terrazo'),P,yF,US('floor_terrazo'));TINT=[1,1,1];INTERIOR=false;addFloor(P,yF);}
  // ---------- paradas: islas en dos ejes ortogonales ----------
  INTERIOR=true;let si=0;const nameOf=()=>NINOT_STALLS[(si++)%NINOT_STALLS.length];
  const xb2=[[2.6,9.4],[12.6,19.4],[22.6,29.4]],zb3=[[10,18],[21,29],[33,41]];
  for(const sx of [-1,1])for(const [u0,u1] of xb2)for(const [v0,v1] of zb3){const ix=cx+sx*(u0+u1)/2,iz=F-(v0+v1)/2,W=u1-u0,Dd=v1-v0;
    addOBB(ix,iz,W/2,Dd/2,0,yF,yF+1.2);// la isla es maciza a la altura de los mostradores
    furn('floor_super',ix,yF,iz,0.25,2.3,Dd-0.4,0,'#d9d4c8',false,3.3);furn('floor_super',ix,yF,iz,W-0.4,2.3,0.25,0,'#d9d4c8',false,3.3);// tabiques de azulejo entre paradas
    for(const qx of [-1,1])for(const qz of [-1,1]){const [nm,ty]=nameOf();const px=ix+qx*W/4,pz=iz+qz*Dd/4;const fx=ix+qx*(W/2-0.4),fz=iz+qz*(Dd/2-0.4);
      const col=ty==='peix'?'#c9cfd2':ty==='bar'?'#5a3a24':'#bdb6a8';const mat=ty==='bar'?'woodf':'floor_super';
      const tipped=Math.random()<0.12;
      const us2=mat==='woodf'?undefined:3.3;furn(mat,fx,yF,pz,0.7,tipped?0.5:0.95,Dd/2-0.5,tipped?0.4:0,col,false,us2);furn(mat,px,yF,fz,W/2-0.5,0.95,0.7,0,col,false,us2);// mostrador en L hacia los dos pasillos
      furn('granite',fx,yF+0.95,pz,0.8,0.05,Dd/2-0.45,0,'#8a8680',false);
      const sign=ninotSign(nm,ty);if(sign!==undefined){addInst('shopSign',fx+qx*0.45,yF+2.75,pz,qx>0?Math.PI/2:-Math.PI/2,2.6,0.65,1,sign);addInst('shopSign',px,yF+2.75,fz+qz*0.45,qz>0?0:Math.PI,2.6,0.65,1,sign);}
      furn('woodf',fx,yF+2.4,pz,0.08,0.08,Dd/2-0.3,0,'#2b2e2c',false);addInst('lightPanel',px,yF+2.95,pz,0);
      // género podrido, cajas, bolsas
      if(ty==='fruta'||ty==='olives')for(let k=0;k<4;k++)addInst('fruit',fx+R(-0.2,0.2),yF+0.98,pz+R(-1.4,1.4),R(0,6));
      if(Math.random()<0.6)addInst(pick(['crate','caja2','cajaPlana','bolsas']),fx+qx*R(0.7,1.4),yF,pz+R(-1.5,1.5),R(0,6.28));
      if(Math.random()<0.25)addInst('carro',fx+qx*R(1,1.6),yF,pz+R(-1,1),R(0,6.28));
      if(Math.random()<0.5)lootSpot(fx+qx*0.6,pz,yF,'mercat',ty==='bar'?'barra del mercado':'parada del mercado');
      if(ty==='peix'&&Math.random()<0.5)addInst('prodBox',fx,yF+0.98,pz+R(-1,1),0);}}
  // paradas adosadas a las fachadas laterales
  for(const sx of [-1,1])for(let v=11;v<44;v+=4.2){const px=cx+sx*(NINOT_HW-1.6),pz=F-v-2;const [nm,ty]=nameOf();
    furn('floor_super',px-sx*0.9,yF,pz,0.7,0.95,3.6,0,'#c4beb2',true,3.3);furn('granite',px-sx*0.9,yF+0.95,pz,0.8,0.05,3.7,0,'#8a8680',false);furn('floor_super',px+sx*0.5,yF,pz,0.4,2.4,3.8,0,'#d6d0c4',false,3.3);
    const sign=ninotSign(nm,ty);if(sign!==undefined)addInst('shopSign',px-sx*1.3,yF+2.75,pz,sx>0?-Math.PI/2:Math.PI/2,2.8,0.7,1,sign);
    if(Math.random()<0.5)lootSpot(px-sx*1.4,pz,yF,'mercat','parada del mercado');}
  INTERIOR=false;
  // suciedad: hojas, papeles y basura que entran por la puerta rota, cristales
  for(let i=0;i<70;i++){const x=cx+R(-NINOT_HW+1,NINOT_HW-1),z=F-R(1,NINOT_DEPTH-1);if(Math.abs(x-cx)<2.5||Math.random()<0.5)addInst(pick(['leafLitter','paper','paper','leafLitter']),x,yF+0.01,z,R(0,6.28));}
  for(let i=0;i<10;i++)addInst(pick(['bolsas','caja2','ropa']),cx+R(-2.3,2.3),yF,F-R(10,44),R(0,6.28));
  // patios: furgonetas y coches de los paradistas, palés y cajas
  for(const sx of [-1,1]){const px=cx+sx*(NINOT_HW+9);CARSPOTS.push({x:px,z:F-22,yaw:R(-0.3,0.3)},{x:px+sx*2,z:F-36,yaw:Math.PI+R(-0.3,0.3)});
    for(let k=0;k<5;k++){const x=px+R(-6,6),z=F-R(8,50);addInst(pick(['pale','crate','caja2','sacos']),x,yG(x,z),z,R(0,6.28));}}
  // la figura del ninot (mascarón de proa) sobre su peana junto a la entrada
  furn('stone_blocks',cx+8.6,yF,F+0.9,0.9,1.2,0.9,0,'#cfc6b6',true);
  return{cx,cz:F-5,y:yF,gate:[cx,F+5],F};}
