// =====================================================================
// INTERIORES DE LOCALES: supermercados, farmacias, bares, hornos, fruterías, ferreterías...
// =====================================================================
MATS.floor_super=photoMat('floor_super',{ns:0.5,roughness:0.5});MATS.floor_hidraulic=photoMat('floor_hidraulic',{ns:0.4,roughness:0.6});MATS.floor_terrazo=photoMat('floor_terrazo',{ns:0.4,roughness:0.45});
MATS.floor_wood=photoMat('floor_wood',{ns:0.5});MATS.concrete=photoMat('concrete',{ns:0.5});
MATS.inner=new THREE.MeshLambertMaterial({vertexColors:true,map:ltex('plaster_grey_diff.jpg')});MATS.ceil=new THREE.MeshLambertMaterial({vertexColors:true,color:0xf4f1ea});
MATS.lightp=new THREE.MeshBasicMaterial({vertexColors:true});MATS.metal=metalMat;MATS.furn=new THREE.MeshLambertMaterial({vertexColors:true});MATS.woodf=photoMat('wood_dark',{ns:0.4});
MATS.glassb=glassMat;
const products=['ARRÒS','LLET','TONYINA','GALETES','AIGUA','CERVESA','OLI','PASTA','CAFÈ','SUC','LLEGUMS','XOCOLATA','CONSERVES','CEREALS','TOMÀQUET','SOPA'];
const texProducts=cTex(1024,1024,(g)=>{for(let k=0;k<16;k++){const x=(k%4)*256,y=Math.floor(k/4)*256;const hue=(k*47)%360;g.fillStyle=`hsl(${hue},55%,45%)`;g.fillRect(x,y,256,256);
  g.fillStyle=`hsl(${(hue+180)%360},60%,85%)`;g.fillRect(x+16,y+60,224,90);g.fillStyle='#111';g.font='bold 34px sans-serif';g.textAlign='center';g.fillText(products[k],x+128,y+118,210);
  g.fillStyle='#fff';g.font='bold 22px sans-serif';g.fillText(pick(['Hacendado','Nostrum','Bon Gust','La Masia','Ca l\'Avi','Estel','Delta','Gallo']),x+128,y+40);g.fillStyle=`hsl(${hue},50%,30%)`;g.fillRect(x,y+200,256,56);g.fillStyle='#fff';g.font='18px sans-serif';g.fillText(pick(['1 kg','500 g','1 L','6 x 33 cl']),x+128,y+235);}},{});
const prodMat=atlasMat(texProducts,null,4,4);
defInst('prodBox',(()=>{const g=new THREE.BoxGeometry(0.2,0.28,0.14);g.translate(0,0.14,0);return g;})(),prodMat,4,4);
defInst('prodCan',(()=>{const g=new THREE.CylinderGeometry(0.045,0.045,0.12,6);g.translate(0,0.06,0);return g;})(),prodMat,4,4);
defInst('prodBottle',(()=>{const g=new THREE.CylinderGeometry(0.04,0.045,0.3,5);g.translate(0,0.15,0);return g;})(),pbr(new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.15,metalness:0.1})));
const texFruit=cTex(256,256,(g,w,h)=>{g.fillStyle='#6b4a2a';g.fillRect(0,0,w,h);const c=pick(['#c8261a','#e8a020','#8ac83a','#e8d020','#6a2a6a']);for(let i=0;i<70;i++){const x=R(10,w-10),y=R(10,h-10),r=R(12,20);const gr=g.createRadialGradient(x-r*0.3,y-r*0.3,2,x,y,r);gr.addColorStop(0,'#fff8');gr.addColorStop(0.25,c);gr.addColorStop(1,'#0006');g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,7);g.fill();}},{});
defInst('fruit',(()=>{const g=new THREE.BoxGeometry(0.55,0.14,0.38);g.translate(0,0.07,0);return g;})(),new THREE.MeshLambertMaterial({map:texFruit}));
defInst('lightPanel',(()=>{const g=new THREE.PlaneGeometry(0.6,1.2);g.rotateX(Math.PI/2);return g;})(),new THREE.MeshBasicMaterial({color:0xe8eef0}));
function lootSpot(x,z,y,sub,label,refs){LOOT.push({x,z,y,kind:'cont',sub,label,looted:false,refs:refs||[]});}
// mueble: caja en un buffer con colisión
function furn(mat,x,y,z,w,h,d,yaw,col,coll=true){const B=bufOf(x,z,mat);TINT=hexTint(col);boxGeoInto(B,x,y+h/2,z,w,h,d,yaw,mat==='woodf'?US('wood_dark'):1);TINT=[1,1,1];if(coll)addOBB(x,z,w/2,d/2,yaw,y,y+h);}
// ---------- construir el local detrás del hueco ----------
function makeShopInterior(lot,seg,u,ux,uz,boarded){INTERIOR=true;try{makeShopInterior2(lot,seg,u,ux,uz,boarded);}finally{INTERIOR=false;}}
function makeShopInterior2(lot,seg,u,ux,uz,boarded){const{a,nx,nz}=seg;const yb=lot.yb;const ix=-nx,iz=-nz;const d=u.room.d;const w=u.u1-u.u0;
  const P=(uu,ww)=>[a[0]+ux*uu+ix*ww,a[1]+uz*uu+iz*ww];const yF=yb+0.03;const ceil=yb+Math.min(lot.gf-0.25,4.0);const U0=u.u0-0.0,U1=u.u1+0.0;
  const ru0=u.u0-Math.min(0.6,u.u0),ru1=u.u1+0.4;// la sala es algo más ancha que el hueco
  const rp=[P(ru0,0.35),P(ru1,0.35),P(ru1,d),P(ru0,d)];const c=centroid(rp);const t=u.shop.type;
  // suelo, techo y paredes interiores
  const fm=t==='super'?'floor_super':t==='bar'||t==='restaurant'?'floor_hidraulic':t==='ferre'||t==='electro'?'concrete':pick(['floor_terrazo','floor_hidraulic','floor_terrazo']);
  {const B=bufOf(c[0],c[1],fm);TINT=[1,1,1];capPoly(B,rp,yF,US(fm));const Bc=bufOf(c[0],c[1],'ceil');capPoly(Bc,rp,ceil,0.5,true);}
  const Bi=bufOf(c[0],c[1],'inner');TINT=hexTint(t==='farmacia'?'#f4f6f2':t==='bar'?'#e8d8b8':'#efece4');
  const L1=P(ru0,0.35),L2=P(ru0,d),R1=P(ru1,0.35),R2=P(ru1,d);
  wall(Bi,L1[0],L1[1],L2[0],L2[1],yF,ceil,ux,uz,US('plaster_grey'));wall(Bi,R1[0],R1[1],R2[0],R2[1],yF,ceil,-ux,-uz,US('plaster_grey'));wall(Bi,L2[0],L2[1],R2[0],R2[1],yF,ceil,nx,nz,US('plaster_grey'));
  // cara interior del muro de fachada con el hueco
  wallHoles('inner',L1,R1,nx*-1,nz*-1,yF,ceil,[[u.u0-ru0,u.u1-ru0,0,u.y1]],0,US('plaster_grey'),hexTint('#efece4'));
  TINT=[1,1,1];addFloor(rp,yF);
  // luces del techo (paneles)
  for(let uu=ru0+1.2;uu<ru1-0.6;uu+=2.4)for(let ww=1.5;ww<d-0.5;ww+=2.8){const p=P(uu,ww);addInst('lightPanel',p[0],ceil-0.01,p[1],Math.atan2(ux,uz));}
  // frente: cristal + puerta
  const doorW=u.shop.big?2.0:1.0;const front=0.2;const doorU0=u.shop.big?(u.u0+u.u1)/2-doorW:u.u1-doorW-0.15;
  if(!boarded&&u.state!=='closed'){const broken=u.state==='broken'||u.state==='half';
    // escaparates fijos a ambos lados de la puerta
    const pw=[[u.u0+0.05,doorU0-0.05],[doorU0+doorW*(u.shop.big?2:1)+0.05,u.u1-0.05]];
    for(const [p0,p1] of pw){if(p1-p0<0.3)continue;const A=P(p0,front),B=P(p1,front);// zócalo + cristal
      furn('metal',(A[0]+B[0])/2,yb,(A[1]+B[1])/2,0.08,0.35,p1-p0,Math.atan2(ux,uz),'#3a3d40');
      makePane(A,B,yb+0.35,yb+u.y1-0.05,nx,nz,broken&&Math.random()<0.8);}
    // puerta (corredera doble en el súper, abatible de cristal en los demás)
    if(u.shop.big){const hp=P(doorU0,front);const dd1=makeSlideDoor({hx:hp[0],hz:hp[1],ux,uz,w:doorW,h:u.y1-0.1,y:yb,off:broken?doorW*R(0.3,0.9):0});
      const hp2=P(doorU0+doorW,front);const dd2=makeSlideDoor({hx:hp2[0],hz:hp2[1],ux,uz,w:doorW,h:u.y1-0.1,y:yb,off:0});dd2.ux=ux;dd2.uz=uz;dd2.mirror=true;
      if(u.state==='broken'){for(const d2 of [dd1,dd2]){d2.locked=false;}}}
    else{const hp=P(u.u1-0.15,front);const dr=makeDoor({hx:hp[0],hz:hp[1],ux:-ux,uz:-uz,w:doorW,h:Math.min(2.3,u.y1-0.05),y:yb,kind:'glass',sign:1,ang:broken?R(0.4,1.4):0,maxA:1.75});
      if(u.state==='glass'&&Math.random()<0.35)dr.locked=true;}
    if(broken){const p=P((u.u0+u.u1)/2,-0.6);addInst('shards',p[0],surfY(p[0],p[1])+0.003,p[1],R(0,6));const p2=P((u.u0+u.u1)/2,1.2);addInst('shards',p2[0],yF+0.003,p2[1],R(0,6));}}
  else if(u.state==='closed'){/* persiana: ya está puesta en la fachada */}
  u.roomBuilt={d};
  furnishShop(u,P,yF,ceil,ux,uz,nx,nz,ru0,ru1,d,c);
  SHOPS.push({x:P((u.u0+u.u1)/2,-1)[0],z:P((u.u0+u.u1)/2,-1)[1],type:t,name:u.shop.name||t,nx,nz});MAPD.shops.push({x:c[0],z:c[1],type:t});shopCount++;}
let shopCount=0;
// ---------- mobiliario según el tipo de comercio ----------
function furnishShop(u,P,yF,ceil,ux,uz,nx,nz,u0,u1,d,c){const t=u.shop.type;const yawF=Math.atan2(nx,nz),yawU=Math.atan2(ux,uz);const W=u1-u0;
  const looted=Math.random()<0.4;
  const shelf=(uu,ww,len,alongD,sub,label,prod)=>{// estantería doble de supermercado
    const p=P(uu,ww);const yaw=alongD?yawU:yawF;const sw=alongD?0.9:len,sd=alongD?len:0.9;
    furn('metal',p[0],yF,p[1],alongD?0.08:len,1.9,alongD?len:0.08,yawF,'#8a9096');
    for(let lv=0;lv<4;lv++){const B=bufOf(p[0],p[1],'metal');TINT=hexTint('#c8ccd0');boxGeoInto(B,p[0],yF+0.14+lv*0.46,p[1],alongD?0.9:len,0.03,alongD?len:0.9,yawF,1);}
    {const B=bufOf(p[0],p[1],'metal');TINT=hexTint('#e8eaec');boxGeoInto(B,p[0],yF+0.06,p[1],alongD?0.92:len,0.12,alongD?len:0.92,yawF,1);}
    addOBB(p[0],p[1],(alongD?0.9:len)/2,(alongD?len:0.9)/2,yawF,yF,yF+1.95);TINT=[1,1,1];
    const refs=[];const n=Math.max(2,Math.floor(len/0.24));const fill=looted?0.35:0.8;
    for(let lv=0;lv<4;lv++)for(let side=-1;side<=1;side+=2)for(let i=0;i<n;i++){if(Math.random()>fill)continue;const s=(i+0.5)/n-0.5;const ou=alongD?side*0.25:s*len,ow=alongD?s*len:side*0.25;
      const q=P(uu+ou,ww+ow);const py=yF+0.155+lv*0.46;const kind=prod==='bottle'?'prodBottle':prod==='can'?'prodCan':'prodBox';
      refs.push(addInst(kind,q[0],py,q[1],yawF+(side<0?Math.PI:0)+(alongD?Math.PI/2:0),1,1,1,(Math.random()*16)|0,0,0,kind==='prodBottle'?pick([0x2a7a3a,0xd8e8f0,0x6a3a1a,0xc8a040,0xb8d0e8]):undefined));}
    lootSpot(p[0],p[1],yF,sub,label,refs);
    // productos tirados por el suelo si está saqueado
    if(looted)for(let k=0;k<6;k++){const q=P(uu+R(-1.2,1.2),ww+R(-len/2,len/2));addInst(pick(['prodBox','prodCan']),q[0],yF,q[1],R(0,6),1,1,1,(Math.random()*16)|0,0,R(-1.5,1.5));}};
  if(t==='super'){const aisles=Math.max(1,Math.floor((W-2.5)/2.7));const len=Math.max(3,d-6.5);
    const subs=[['super_conservas','estantería de conservas','can'],['super_bebidas','estantería de bebidas','bottle'],['super_dulces','estantería de galletas y dulces','box'],['super_basicos','estantería de arroz, pasta y legumbres','box'],['super_higiene','estantería de higiene y limpieza','box']];
    for(let r=0;r<aisles;r++){const uu=u0+1.8+r*2.7;if(uu>u1-1.4)break;const sb=subs[r%subs.length];shelf(uu,3.4+len/2,len,true,sb[0],sb[1],sb[2]);}
    // neveras murales al fondo
    for(let uu=u0+0.6;uu<u1-1.6;uu+=2.1){const p=P(uu+1,d-0.45);furn('metal',p[0],yF,p[1],2.0,2.0,0.8,yawF,'#dfe3e5');const Bq=bufOf(p[0],p[1],'lightp');TINT=[0.82,0.92,1];
      const A=P(uu+0.08,d-0.86),B=P(uu+1.92,d-0.86);wall(Bq,A[0],A[1],B[0],B[1],yF+0.35,yF+1.85,nx,nz,1);TINT=[1,1,1];lootSpot(p[0],p[1],yF,'nevera_super','nevera');}
    // cajas registradoras junto a la entrada
    for(let k=0;k<Math.min(3,Math.floor(W/4));k++){const p=P(u0+1.6+k*2.6,1.9);furn('metal',p[0],yF,p[1],0.6,0.9,1.7,yawF,'#5a6066');const p2=P(u0+1.6+k*2.6,1.9);furn('furn',p2[0],yF+0.9,p2[1],0.4,0.25,0.35,yawF,'#222222',false);}
    for(let k=0;k<3;k++){const p=P(R(u0+1,u1-1),R(1.2,2.8));addInst('carro',p[0],yF,p[1],R(0,6));}
    for(let k=0;k<5;k++){const p=P(R(u0+0.8,u1-0.8),R(2.5,d-1.5));addInst('caja',p[0],yF,p[1],R(0,6));}}
  else if(t==='farmacia'){const p=P((u0+u1)/2,d*0.45);furn('woodf',p[0],yF,p[1],0.6,1.0,W-2.2,yawU,'#e8e4dc');const p2=P((u0+u1)/2,d-0.3);furn('furn',p2[0],yF,p2[1],W-0.6,2.4,0.4,yawF,'#f4f6f2');
    for(let lv=0;lv<5;lv++)for(let k=0;k<(W-0.8)/0.22;k++){if(Math.random()<(looted?0.6:0.2))continue;const q=P(u0+0.5+k*0.22,d-0.55);addInst('prodBox',q[0],yF+0.2+lv*0.45,q[1],yawF+Math.PI,0.6,0.5,0.6,(Math.random()*16)|0);}
    lootSpot(p2[0],p2[1],yF,'farmacia','estanterías de la farmacia');lootSpot(p[0],p[1],yF,'farmacia_mostrador','mostrador de la farmacia');}
  else if(t==='bar'||t==='restaurant'){const len=Math.max(2.5,d-3);const p=P(u0+1.2,1.6+len/2);furn('woodf',p[0],yF,p[1],0.65,1.1,len,yawF,'#7a4a28');
    const sh=P(u0+0.3,1.6+len/2);furn('woodf',sh[0],yF+1.0,sh[1],0.28,0.04,len,yawF,'#5a3a22',false);const refs=[];
    for(let i=0;i<len/0.2;i++){const q=P(u0+0.3,1.7+i*0.2);if(Math.random()<0.75)refs.push(addInst('prodBottle',q[0],yF+1.04,q[1],0,1,1,1,0,0,0,pick([0x2a7a3a,0x6a3a1a,0xc8a040,0xd8e8f0])));}
    lootSpot(p[0],p[1],yF,'bar','barra del bar',refs);
    for(let i=0;i<len/1.0;i++){const q=P(u0+2.0,2+i*1.0);furn('metal',q[0],yF,q[1],0.32,0.75,0.32,0,'#333333');}
    for(let ww=2.4;ww<d-1;ww+=2.4)for(let uu=u0+3.4;uu<u1-0.8;uu+=2.2){const q=P(uu,ww);if(Math.random()<0.3){addInst('terrassa',q[0],yF,q[1],R(0,6),1,1,1,0,0,Math.random()<0.4?R(1,1.4):0);}else addInst('terrassa',q[0],yF,q[1],R(0,6));}
    const k=P(u0+0.4,d-0.6);furn('metal',k[0],yF,k[1],0.6,0.9,1.6,yawF,'#c8ccd0');lootSpot(k[0],k[1],yF,'nevera','cámara del bar');}
  else if(t==='forn'||t==='carnisseria'){const p=P((u0+u1)/2,2.2);furn('woodf',p[0],yF,p[1],0.7,1.0,W-1.6,yawU,t==='forn'?'#c8b8a0':'#e8e8e8');
    const Bq=bufOf(p[0],p[1],'glassb');const A=P(u0+0.8,1.85),B=P(u1-0.8,1.85);wall(Bq,A[0],A[1],B[0],B[1],yF+1.0,yF+1.35,nx,nz,1);
    const p2=P((u0+u1)/2,d-0.35);furn('woodf',p2[0],yF,p2[1],W-0.6,2.0,0.45,yawF,'#b8a080');lootSpot(p[0],p[1],yF,t==='forn'?'forn_mostrador':'carnisseria','mostrador');lootSpot(p2[0],p2[1],yF,t==='forn'?'forn':'carnisseria','estantes');}
  else if(t==='fruteria'){for(let r=0;r<3;r++){const p=P(u0+1+r*((W-2)/2),d/2);furn('woodf',p[0],yF,p[1],0.9,0.8,d-3,yawF,'#8a6a42');
      for(let i=0;i<(d-3)/0.42;i++){if(Math.random()<(looted?0.6:0.1))continue;const q=P(u0+1+r*((W-2)/2),d/2-(d-3)/2+0.2+i*0.42);addInst('fruit',q[0],yF+0.8,q[1],yawF+Math.PI/2,1,1,1,0,0,0,pick([0xffffff,0xffe0d0,0xe0ffd0]));}
      lootSpot(p[0],p[1],yF,'fruteria','cajas de fruta');}}
  else if(t==='ferre'||t==='electro'){shelf(u0+1.0,d/2,Math.max(2,d-2.5),true,t==='ferre'?'ferre':'electro','estanterías','box');if(W>5)shelf(u1-1.0,d/2,Math.max(2,d-2.5),true,'ferre','estanterías','box');
    const p=P((u0+u1)/2,1.6);furn('woodf',p[0],yF,p[1],2.2,1.0,0.7,yawF,'#7a6a50');lootSpot(p[0],p[1],yF,'ferre_mostrador','mostrador');}
  else{// genérico: mostrador + estantes
    const p=P((u0+u1)/2,Math.min(2.4,d*0.4));furn('woodf',p[0],yF,p[1],Math.max(1.2,W-2.2),1.0,0.6,yawF,'#a89070');const p2=P((u0+u1)/2,d-0.35);furn('furn',p2[0],yF,p2[1],W-0.6,2.1,0.4,yawF,'#d8d4cc');
    lootSpot(p[0],p[1],yF,t==='estanc'?'estanc':'mesita','mostrador');if(Math.random()<0.5)lootSpot(p2[0],p2[1],yF,'cocina','armario del fondo');}
  // un aseo al fondo en casi todos los locales
  if(d>8&&W>4&&t!=='super'){const p=P(u1-0.6,d-0.5);furn('furn',p[0],yF,p[1],0.42,0.42,0.6,yawF,'#f4f4f4');TOILETS.push({x:p[0],z:p[1],y:yF,kind:'baño'});}
  if(t==='super'){const p=P(u1-0.8,d-1.6);TOILETS.push({x:p[0],z:p[1],y:yF,kind:'baño'});}}
