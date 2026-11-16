// =====================================================================
// EDIFICIOS: parcelas alrededor de cada manzana (fachada, planta baja con locales, medianeras, colisiones)
// =====================================================================
const BDEPTH=20;// profundidad edificable alrededor del patio de manzana
// ---------- rótulos: atlas 4x16 celdas de 512x128 ----------
const SIGNC=document.createElement('canvas');SIGNC.width=2048;SIGNC.height=2048;const sgc=SIGNC.getContext('2d');let signN=0;const SIGNIDX={};
function signCell(key,draw){if(SIGNIDX[key]!==undefined)return SIGNIDX[key];const i=signN++;const x=(i%4)*512,y=Math.floor(i/4)*128;sgc.save();sgc.translate(x,y);sgc.beginPath();sgc.rect(0,0,512,128);sgc.clip();draw(sgc,512,128);sgc.restore();SIGNIDX[key]=i;return i;}
function textSign(key,text,bg,fg,o={}){return signCell(key,(g,w,h)=>{g.fillStyle=bg;g.fillRect(0,0,w,h);if(o.stripe){g.fillStyle=o.stripe;g.fillRect(0,h-16,w,16);}
  if(o.border){g.strokeStyle=o.border;g.lineWidth=8;g.strokeRect(6,6,w-12,h-12);}
  g.fillStyle=fg;g.textAlign='center';g.textBaseline='middle';let fs=o.fs||74;const font=o.font||'Arial';g.font=`${o.weight||'bold'} ${fs}px ${font}`;while(g.measureText(text).width>w-(o.pad||50)&&fs>20){fs-=2;g.font=`${o.weight||'bold'} ${fs}px ${font}`;}
  if(o.cross){g.fillStyle='#19a347';const cx=70,cy=h/2;g.fillRect(cx-14,cy-40,28,80);g.fillRect(cx-40,cy-14,80,28);g.fillStyle=fg;g.fillText(text,w/2+40,h/2+4);}
  else g.fillText(text,w/2,h/2+(o.stripe?-6:4));
  // suciedad
  for(let i=0;i<40;i++){g.fillStyle=`rgba(40,30,20,${R(0.03,0.12)})`;g.beginPath();g.arc(R(0,w),R(0,h),R(4,30),0,7);g.fill();}});}
// supermercados reales de Barcelona (solo el nombre con sus colores, sin logotipos)
const SUPERS=[
  {n:'Mercadona',s:()=>textSign('mercadona','MERCADONA','#ffffff','#0b8a3e',{stripe:'#f39200',font:'Arial Black'})},
  {n:'Lidl',s:()=>textSign('lidl','LIDL','#0050aa','#fff000',{border:'#e60a14',font:'Arial Black',fs:90})},
  {n:'Bonpreu',s:()=>textSign('bonpreu','bonpreu','#ffffff','#d50f25',{font:'Arial Black',weight:'',fs:84,stripe:'#ffcc00'})},
  {n:'Esclat',s:()=>textSign('esclat','esclat','#ffffff','#e85a0c',{font:'Arial Black',weight:'',fs:84,stripe:'#d50f25'})},
  {n:'Caprabo',s:()=>textSign('caprabo','Caprabo','#d6001c','#ffffff',{font:'Arial Black',weight:''})},
  {n:'Condis',s:()=>textSign('condis','Condis','#ffffff','#e3001b',{font:'Arial Black',weight:'',stripe:'#e3001b'})},
  {n:'Dia',s:()=>textSign('dia','Dia','#e3001b','#ffffff',{font:'Arial Black',fs:96})},
  {n:'Consum',s:()=>textSign('consum','Consum','#ffffff','#f07d00',{font:'Arial Black',weight:'',stripe:'#f07d00'})},
  {n:'Ametller Origen',s:()=>textSign('ametller','Ametller Origen','#1e3b2a','#ffffff',{font:'Georgia',fs:62})},
  {n:'Carrefour Express',s:()=>textSign('carrefour','Carrefour Express','#ffffff','#1e4fa0',{font:'Arial',stripe:'#e1001a',fs:60})},
  {n:'bonÀrea',s:()=>textSign('bonarea','bonÀrea','#ffffff','#2e8b3a',{font:'Arial Black',weight:'',stripe:'#2e8b3a'})},
  {n:'Sorli',s:()=>textSign('sorli','SORLI','#ffffff','#d3122a',{font:'Arial Black',fs:84,stripe:'#2b6cb0'})},
];
// comercios de barrio (nombres genéricos de rótulo, en catalán, como en la calle)
const SMALL=[
  {t:'farmacia',w:[4,6],sign:()=>textSign('farm','FARMÀCIA','#ffffff','#19a347',{cross:true,font:'Arial'}),enter:0.8},
  {t:'forn',w:[3.5,6],sign:()=>textSign('forn'+(Math.random()*3|0),pick(['FORN DE PA','FLECA','FORN I PASTISSERIA']),pick(['#6b3e1e','#f3e3c3','#3a2a1a']),pick(['#f6e7c8','#6b3e1e','#e8c67a']),{font:'Georgia'}),enter:0.75},
  {t:'bar',w:[4,8],sign:()=>textSign('bar'+(Math.random()*4|0),pick(['BAR','BAR · CAFETERIA','BAR RESTAURANT','CERVESERIA']),pick(['#1d2b3a','#7a1e1e','#2e3a2a','#111']),pick(['#f2e6c8','#ffffff','#e8c67a']),{font:'Georgia'}),enter:0.8},
  {t:'fruteria',w:[3.5,6],sign:()=>textSign('fruit','FRUITES I VERDURES','#2e6b2a','#ffffff'),enter:0.75},
  {t:'ferre',w:[4,7],sign:()=>textSign('ferre','FERRETERIA','#c8102e','#ffffff'),enter:0.8},
  {t:'estanc',w:[3,4.5],sign:()=>signCell('estanc',(g,w,h)=>{g.fillStyle='#8a4b12';g.fillRect(0,0,w,h);g.fillStyle='#f2c23a';g.fillRect(24,20,88,88);g.fillStyle='#8a4b12';g.font='bold 76px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('T',68,68);g.fillStyle='#f2c23a';g.font='bold 60px Arial';g.fillText('ESTANC',300,68);}),enter:0.7},
  {t:'carnisseria',w:[3.5,6],sign:()=>textSign('carn','CARNISSERIA','#8a1c1c','#ffffff',{font:'Georgia'}),enter:0.7},
  {t:'perruqueria',w:[3.5,6],sign:()=>textSign('perr','PERRUQUERIA','#111111','#e8c0d0',{font:'Georgia',weight:''}),enter:0.4},
  {t:'banc',w:[6,10],sign:()=>pick([()=>textSign('caixa','CaixaBank','#ffffff','#007eae'),()=>textSign('bbva','BBVA','#004481','#ffffff',{fs:90}),()=>textSign('sabadell','Banc Sabadell','#ffffff','#0099cc'),()=>textSign('santander','Santander','#ec0000','#ffffff')])(),enter:0.3},
  {t:'locutori',w:[3.5,5],sign:()=>textSign('locu','LOCUTORI · ENVIAMENTS','#f2d01e','#1a1a1a'),enter:0.4},
  {t:'bugaderia',w:[3.5,5],sign:()=>textSign('buga','BUGADERIA','#2b6cb0','#ffffff'),enter:0.4},
  {t:'optica',w:[3.5,5],sign:()=>textSign('opt','ÒPTICA','#ffffff','#1a1a1a',{font:'Georgia',weight:''}),enter:0.3},
  {t:'immo',w:[3.5,5],sign:()=>textSign('immo','IMMOBILIÀRIA','#0f3b5f','#ffffff'),enter:0.2},
  {t:'roba',w:[4,8],sign:()=>textSign('roba'+(Math.random()*2|0),pick(['MODA','BOTIGA']),'#1a1a1a','#ffffff',{font:'Georgia',weight:''}),enter:0.5},
  {t:'electro',w:[4,7],sign:()=>textSign('elec','ELECTRODOMÈSTICS','#ffffff','#e85a0c'),enter:0.5},
  {t:'restaurant',w:[5,9],sign:()=>textSign('rest'+(Math.random()*2|0),pick(['RESTAURANT','PIZZERIA']),pick(['#2a1a10','#7a1e1e']),'#f2e6c8',{font:'Georgia'}),enter:0.7},
];
const SMALLW=[['farmacia',6],['forn',6],['bar',12],['fruteria',6],['ferre',3],['estanc',3],['carnisseria',3],['perruqueria',4],['banc',4],['locutori',3],['bugaderia',2],['optica',2],['immo',3],['roba',4],['electro',2],['restaurant',4]];
function pickSmall(){let tot=0;for(const w of SMALLW)tot+=w[1];let r=Math.random()*tot;for(const w of SMALLW){r-=w[1];if(r<=0)return SMALL.find(s=>s.t===w[0]);}return SMALL[0];}
// planificación de supermercados por lado de manzana
const SUPERPLAN=new Map();
// ---------- materiales e instancias de planta baja ----------
MATS.shutter=photoMat('shutter',{ns:1,roughness:0.6,metalness:0.4});MATS.shutter_rust=photoMat('shutter_rust',{ns:1,roughness:0.7,metalness:0.3});
MATS.wood_door=photoMat('wood_door',{ns:0.6,roughness:0.6});MATS.wood_dark=photoMat('wood_dark',{ns:0.6,roughness:0.6});
const signMatS=new THREE.MeshLambertMaterial({map:null,emissive:0xffffff,emissiveIntensity:0,side:THREE.DoubleSide});
// toldo
const texAwn=cTex(256,128,(g,w,h)=>{const c=pick(['#2e6b2a','#8a1c1c','#1d4f8a','#c8661a']);for(let x=0;x<w;x+=32){g.fillStyle=(x/32)%2?c:'#efe8d8';g.fillRect(x,0,32,h);}g.fillStyle='rgba(0,0,0,.18)';for(let i=0;i<30;i++){g.beginPath();g.arc(R(0,w),R(0,h),R(3,18),0,7);g.fill();}},{});
// relleno de huecos de planta baja: plano a la profundidad del hueco
function fillQuad(mat,a,ux,uz,nx,nz,u0,u1,y0,y1,dep,tint,usOverride){const p=[a[0]+ux*u0-nx*dep,a[1]+uz*u0-nz*dep],q=[a[0]+ux*u1-nx*dep,a[1]+uz*u1-nz*dep];const B=bufOf((p[0]+q[0])/2,(p[1]+q[1])/2,mat);TINT=tint||[1,1,1];
  wall(B,p[0],p[1],q[0],q[1],y0,y1,nx,nz,usOverride||US(mat==='shutter'||mat==='shutter_rust'?'shutter':mat==='wood_door'?'wood_door':mat==='wood_dark'?'wood_dark':'concrete'),u0);TINT=[1,1,1];}
const LOTS=[];
// ---------- generación de una fachada (segmento) ----------
// F: pisos sobre la planta baja; st: estilo; seg {a,b,nx,nz}; base y; units: planta baja [{u0,u1,kind,...}]
function buildFacade(lot,seg,units){const{a,b,nx,nz}=seg;const L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<0.5)return;const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;const st=lot.st,yb=lot.yb,gf=lot.gf,fh=lot.fh,F=lot.F;
  const top=yb+gf+F*fh+0.6;const yaw=Math.atan2(nx,nz);const tint=hexTint(lot.tint);const tPB=lot.pbTint;
  // planta baja con huecos
  const holes=units.map(u=>[u.u0,u.u1,u.y0||0,u.y1]);wallHoles(st.pb,a,b,nx,nz,yb-0.25,yb+gf,holes.map(h=>[h[0],h[1],h[2]+0.25,h[3]+0.25]),0.35,US(st.pb),tPB);
  // pisos superiores
  {const B=bufOf((a[0]+b[0])/2,(a[1]+b[1])/2,st.up);TINT=tint;wall(B,a[0],a[1],b[0],b[1],yb+gf,top,nx,nz,US(st.up));TINT=[1,1,1];}
  moldStrip(a,b,nx,nz,yb+gf-0.05,0.35,0.16,tint.map(v=>v*0.92));moldStrip(a,b,nx,nz,top-0.55,0.5,0.45,tint.map(v=>v*0.9));moldStrip(a,b,nx,nz,top-0.05,0.25,0.2,tint.map(v=>v*0.85));
  // ventanas y balcones por crujía
  const n=Math.max(1,Math.round(L/3.6));const bay=L/n;const contPrinc=lot.contBalc&&L>6;
  const lite=lot.bk.outer;
  for(let f=0;f<F;f++){const fy=yb+gf+f*fh;const topFloor=f===F-1;const wh=topFloor?1.75:(f===0?2.55:2.35),ww=topFloor?1.05:1.2;
    if(f===0&&contPrinc&&!lite){// balcón corrido del principal
      const cx=(a[0]+b[0])/2,cz=(a[1]+b[1])/2;addInst('balcSlab',cx,fy-0.02,cz,yaw,L-0.6,1,0.85,0,0,0,lot.tint);const nr=Math.max(1,Math.round((L-0.6)/1.6)),rw=(L-0.6)/nr;
      for(let r=0;r<nr;r++){const t=0.3+(r+0.5)*rw;addInst('balcRailF',a[0]+ux*t,fy+0.12,a[1]+uz*t,yaw,rw,1.0,0.85);}addInst('balcRailS',a[0]+ux*0.3,fy+0.12,a[1]+uz*0.3,yaw,1,1.0,0.85);addInst('balcRailS',a[0]+ux*(L-0.3),fy+0.12,a[1]+uz*(L-0.3),yaw,1,1.0,0.85);}
    for(let k=0;k<n;k++){const t=(k+0.5)*bay;const x=a[0]+ux*t+nx*0.015,z=a[1]+uz*t+nz*0.015;const wy=topFloor?fy+0.85:fy+0.06;
      let cell=(Math.random()*16)|0;if(Math.random()<0.55)cell=pick([0,1,8,12,2,3]);const lit=(cell===6||cell===7||cell===5||cell===13)?0:(Math.random()<0.18?1:0);
      addInst('win',x,wy,z,yaw,ww,wh,1,cell,lit);if(lite)continue;addInst('winFrame',x,wy,z,yaw,ww,wh,1,0,0,0,lot.trimHex);
      const balc=!topFloor&&!(f===0&&contPrinc)&&(lot.balcAll||f===0||Math.random()<0.75);
      if(balc){const bw=ww+0.55,bd=f===0?0.85:R(0.5,0.7);addInst('balcSlab',x,fy-0.02,z,yaw,bw,1,bd,0,0,0,lot.tint);addInst('balcRail',x,fy+0.12,z,yaw,bw,1.0,bd);
        if(Math.random()<0.18)addInst('maceta',x+ux*R(-0.4,0.4)+nx*bd*0.6,fy+0.12,z+uz*R(-0.4,0.4)+nz*bd*0.6,0);
        if(Math.random()<0.06)addInst('laundry',x+nx*(bd-0.05),fy+2.0,z+nz*(bd-0.05),yaw);}
      if(Math.random()<0.07)addInst('ac',x+ux*(ww/2+0.5)+nx*0.02,fy+1.6,z+uz*(ww/2+0.5)+nz*0.02,yaw);}}
  // grafitis en la planta baja (en pared y persianas)
  for(let t=1;t<L-1;t+=R(3,7)){if(Math.random()<0.35){const x=a[0]+ux*t+nx*0.02,z=a[1]+uz*t+nz*0.02;const s=R(1.2,2.4);addInst('graffiti',x,yb+R(0.9,1.8),z,yaw,s,s,1,(Math.random()*16)|0);}}
  // planta baja: unidades
  for(const u of units)buildUnit(lot,seg,u,ux,uz,L);
  lot.facades.push({a,b,nx,nz,L});}
// ---------- unidades de planta baja: portal, local (persiana / cristal / roto / tapiado), garaje ----------
function buildUnit(lot,seg,u,ux,uz,L){const{a,nx,nz}=seg;const yb=lot.yb;const yaw=Math.atan2(nx,nz);const mid=(u.u0+u.u1)/2;const cx=a[0]+ux*mid,cz=a[1]+uz*mid;const w=u.u1-u.u0;
  const sign=(idx,y)=>{if(idx===undefined)return;{const sw=Math.min(w*0.85,3.4);addInst('shopSign',cx+nx*0.08,y,cz+nz*0.08,yaw,sw,sw/4,1,idx);}};
  if(u.kind==='passage'){lot.bk.passage=passageInterior(lot,seg,u,ux,uz);addInst('shopSign',cx+nx*0.08,yb+u.y1+0.5,cz+nz*0.08,yaw,4.2,1.05,1,signCell('ninot'+lot.bk.i,(g,w,h)=>{g.fillStyle='#2c3a30';g.fillRect(0,0,w,h);g.fillStyle='#f2e6c8';g.font='bold 56px Georgia';g.textAlign='center';g.textBaseline='middle';g.fillText(lot.passageHere.name.toUpperCase(),w/2,h/2);}));}
  else if(u.kind==='portal'){fillQuad('wood_dark',a,ux,uz,nx,nz,u.u0,u.u1,yb,yb+u.y1,0.34);// portal de madera doble
    const dx=cx-nx*0.3,dz=cz-nz*0.3;addInst('portalDeco',dx,yb,dz,yaw,w/2.4,u.y1/3.6,1);
    if(Math.random()<0.6){const x=a[0]+ux*(u.u1+0.35)+nx*0.03,z=a[1]+uz*(u.u1+0.35)+nz*0.03;addInst('buzzer',x,yb+1.3,z,yaw);}}
  else if(u.kind==='garage'){fillQuad(Math.random()<0.5?'shutter':'shutter_rust',a,ux,uz,nx,nz,u.u0,u.u1,yb,yb+u.y1,0.3);addInst('vado',cx+nx*0.03,yb+u.y1+0.25,cz+nz*0.03,yaw);}
  else if(u.kind==='shop'){const s=u.shop;sign(s.signIdx,yb+u.y1+0.42);
    if(u.state==='closed'||u.state==='half'){const top=yb+u.y1;const y0=u.state==='half'?yb+1.05:yb;fillQuad(Math.random()<0.7?'shutter':'shutter_rust',a,ux,uz,nx,nz,u.u0,u.u1,y0,top,0.3);
      if(Math.random()<0.75){const s2=Math.min(w*0.8,2.6);addInst('graffiti',cx-nx*0.28,y0+(top-y0)*0.5,cz-nz*0.28,yaw,s2,s2*0.8,1,(Math.random()*16)|0);}
      if(u.state==='half'&&u.room)makeShopInterior(lot,seg,u,ux,uz);
      else solidBox(cx-nx*0.3,cz-nz*0.3,w/2,0.06,yaw+Math.PI/2*0,yb,top);}
    else if(u.state==='boarded'){fillQuad('wood_dark',a,ux,uz,nx,nz,u.u0,u.u1,yb,yb+u.y1,0.32,[0.5,0.45,0.4]);
      for(let y=yb+0.3;y<yb+u.y1-0.2;y+=R(0.35,0.6)){addInst('tablon',cx-nx*0.12,y,cz-nz*0.12,yaw+R(-0.15,0.15)*0+0,w*1.05,1,1,0,0,R(-0.12,0.12));}
      solidBox(cx-nx*0.2,cz-nz*0.2,w/2,0.12,yaw,yb,yb+u.y1);if(u.room)makeShopInterior(lot,seg,u,ux,uz,true);}
    else makeShopInterior(lot,seg,u,ux,uz);
    if(u.sup&&u.sup.bandit){const P2=(uu,ww)=>[a[0]+ux*uu-nx*ww,a[1]+uz*uu-nz*ww];u.sup.built={out:P2(mid,-3),in:P2(mid,(u.room.d)/2),ux,uz,nx,nz};}
    if(s.awning&&u.state!=='boarded'){addInst('toldo',cx+nx*0.05,yb+u.y1+0.05,cz+nz*0.05,yaw,w,1,1);}}}
// instancias de planta baja
defInst('shopSign',PLANE,new THREE.MeshLambertMaterial(),4,16);// el material se crea al final con el atlas
defInst('portalDeco',mkG([[bx(0.06,3.2,0.04,0,1.6,0.02),0x2a1a10],[bx(2.4,0.08,0.05,0,3.2,0.02),0x2a1a10],[bx(0.18,0.05,0.05,-0.22,1.1,0.06),0xc9a227],[bx(0.18,0.05,0.05,0.22,1.1,0.06),0xc9a227],[bx(1.9,0.9,0.02,0,2.55,0.03),0x0c0e10]]),metalMat);
defInst('buzzer',mkG([[bx(0.16,0.32,0.04,0,0,0.02),0xa8a8a0],[bx(0.1,0.03,0.02,0,0.1,0.045),0x222222]]),metalMat);
defInst('vado',mkG([[bx(0.5,0.3,0.02,0,0,0.01),0x1d56a8],[bx(0.36,0.12,0.025,0,0.03,0.012),0xffffff]]),paintMat);
defInst('toldo',(()=>{const g=new THREE.PlaneGeometry(1,1.1);g.rotateX(-Math.PI/2+0.45);g.translate(0,-0.2,0.5);return g;})(),new THREE.MeshLambertMaterial({map:texAwn,side:THREE.DoubleSide}));

// ---------- parcelas de una manzana ----------
function lotStyle(){const st=pick(FACADE_STY);const tint=pick(st.tints);const c=new THREE.Color(tint);const trim=c.clone().lerp(new THREE.Color(1,1,1),0.35);
  return{st,tint,trimHex:'#'+trim.getHexString(),pbTint:hexTint(st.pb==='stone_dark'?'#d8d0c4':'#f2ede2'),F:RI(5,6),gf:R(4.4,4.9),fh:R(3.05,3.3),contBalc:Math.random()<0.55,balcAll:Math.random()<0.6};}
function buildBlock(bk){const{x0,x1,z0,z1}=bk;const D=BDEPTH,c=CHAMF;
  // lados: N (z0, normal -z), E (x1, +x), S (z1, +z), W (x0, -x). Cada uno: [inicio, fin] a lo largo de la fachada
  const sides=[{k:0,a:[x0+D,z0],b:[x1-D,z0],n:[0,-1],inw:[0,1],str:bk.str[0]},{k:1,a:[x1,z0+D],b:[x1,z1-D],n:[1,0],inw:[-1,0],str:bk.str[1]},
    {k:2,a:[x1-D,z1],b:[x0+D,z1],n:[0,1],inw:[0,-1],str:bk.str[2]},{k:3,a:[x0,z1-D],b:[x0,z0+D],n:[-1,0],inw:[1,0],str:bk.str[3]}];
  const vis=s=>!bk.outer||(s.str&&!s.str.outer&&s.str.n);
  const lots=[];
  for(const s of sides){if(!vis(s))continue;const L=Math.hypot(s.b[0]-s.a[0],s.b[1]-s.a[1]);const ux=(s.b[0]-s.a[0])/L,uz=(s.b[1]-s.a[1])/L;
    // trocear en parcelas de 12-22 m
    const cuts=[0];let t=0;while(L-t>26){t+=R(12,21);cuts.push(t);}cuts.push(L);
    const sp=SUPERPLAN.get(bk.i+','+bk.j+','+s.k);
    for(let q=0;q<cuts.length-1;q++){const u0=cuts[q],u1=cuts[q+1];const A=[s.a[0]+ux*u0,s.a[1]+uz*u0],B=[s.a[0]+ux*u1,s.a[1]+uz*u1];
      const lot=Object.assign(lotStyle(),{bk,side:s,u0,u1,facades:[],rooms:[],A,B,ux,uz,n:s.n,inw:s.inw,corner:false});
      lot.yb=Math.max(H(A[0],A[1]),H(B[0],B[1]))+CURB+0.02;
      lot.superHere=sp&&q===Math.min(sp.lotIdx,cuts.length-2)?sp:null;
      const bpl=BASEPLAN.find(b=>b.bi===bk.i&&b.bj===bk.j&&b.side===s.k);lot.passageHere=bpl&&q===Math.floor((cuts.length-1)/2)?bpl:null;if(lot.passageHere)lot.superHere=null;lots.push(lot);}}
  // esquinas (xamfrà): N-E, S-E, S-W, N-W
  const corners=[{a:[x1-D,z0],m1:[x1-c,z0],m2:[x1,z0+c],b:[x1,z0+D],sN:0,sE:1},{a:[x1,z1-D],m1:[x1,z1-c],m2:[x1-c,z1],b:[x1-D,z1],sN:1,sE:2},
    {a:[x0+D,z1],m1:[x0+c,z1],m2:[x0,z1-c],b:[x0,z1-D],sN:2,sE:3},{a:[x0,z0+D],m1:[x0,z0+c],m2:[x0+c,z0],b:[x0+D,z0],sN:3,sE:0}];
  for(const C of corners){const s1=sides[C.sN],s2=sides[C.sE];if(!vis(s1)&&!vis(s2))continue;const lot=Object.assign(lotStyle(),{bk,corner:true,C,facades:[],rooms:[]});lot.F=RI(6,7);
    lot.yb=Math.max(H(C.m1[0],C.m1[1]),H(C.m2[0],C.m2[1]))+CURB+0.02;lots.push(lot);}
  // alturas similares entre vecinos, con alguna discordante (medianeras a la vista)
  for(const lot of lots)if(Math.random()<0.15)lot.F+=pick([-2,-1,1]);
  for(const lot of lots){LOTS.push(lot);if(lot.corner)buildCornerLot(lot);else buildSideLot(lot);}
  // medianeras: entre parcelas contiguas de distinta altura
  for(const lot of lots){if(lot.corner)continue;const top=l=>l.yb+l.gf+l.F*l.fh+0.6;}
}
function lotTop(l){return l.yb+l.gf+l.F*l.fh+0.6;}
function buildSideLot(lot){const s=lot.side;const L=lot.u1-lot.u0;const{A,B,ux,uz}=lot;const nx=s.n[0],nz=s.n[1];const D=BDEPTH;
  const P=(u,w)=>[A[0]+ux*u+s.inw[0]*w,A[1]+uz*u+s.inw[1]*w];const yb=lot.yb,gf=lot.gf;
  // planta baja: portal + locales (o supermercado)
  const units=[];const openH=Math.min(3.3,gf-0.9);
  if(lot.passageHere){const pw=4.2,pu=(L-pw)/2;units.push({u0:pu,u1:pu+pw,y1:Math.min(4.0,gf-0.4),kind:'passage'});
    for(const [f,t] of [[0.6,pu-0.6],[pu+pw+0.6,L-0.5]])if(t-f>2.5)units.push({u0:f,u1:t,y1:openH,kind:'shop',state:'closed',shop:{type:'x',signIdx:pickSmall().sign()}});}
  else if(lot.superHere){const sup=lot.superHere;const w=Math.min(L-1.2,sup.w||L-1.2);const u0=(L-w)/2;
    units.push({u0:u0,u1:u0+w,y1:openH,kind:'shop',state:sup.state,shop:{type:'super',name:sup.brand.n,signIdx:sup.brand.s(),brand:sup.brand,big:true},room:{d:Math.min(D-1.5,18)},sup});}
  else{const pw=R(2.2,2.6);const pu=R(0.15,0.75)*(L-pw);let cur=0.6;
    const addShops=(from,to)=>{let t=from;while(to-t>2.8){const sm=pickSmall();let w=Math.min(to-t-0.5,R(sm.w[0],sm.w[1]));if(to-t-w<3)w=to-t-0.5;if(w<2.4)break;
        const r=Math.random();const ent=Math.random()<sm.enter;const state=!ent?(r<0.75?'closed':'boarded'):(r<0.4?'glass':r<0.8?'broken':'half');
        const unit={u0:t,u1:t+w,y1:openH,kind:Math.random()<0.06?'garage':'shop',state,shop:{type:sm.t,signIdx:sm.sign(),awning:['bar','fruteria','forn','restaurant'].includes(sm.t)&&Math.random()<0.55},room:ent?{d:R(7,Math.min(14,D-2))}:null};
        if(unit.kind==='garage'){unit.y1=2.6;}units.push(unit);t+=w+R(0.6,1.2);}};
    addShops(cur,pu);units.push({u0:pu,u1:pu+pw,y1:Math.min(3.6,gf-0.5),kind:'portal'});addShops(pu+pw+0.6,L-0.5);}
  buildFacade(lot,{a:A,b:B,nx,nz},units);
  // colisión: parcela maciza salvo los locales con interior
  const rooms=units.filter(u=>u.roomBuilt).map(u=>[u.u0,u.u1,u.roomBuilt.d]);rooms.sort((p,q)=>p[0]-q[0]);
  const top=lotTop(lot);let cur=0;const box=(u0,u1,w0,w1)=>{if(u1-u0<0.05||w1-w0<0.05)return;const c0=P((u0+u1)/2,(w0+w1)/2);solidBox(c0[0],c0[1],(u1-u0)/2,(w1-w0)/2,Math.atan2(ux,uz),yb-2,top);};
  for(const r of rooms){box(cur,r[0],0,D);box(r[0],r[1],r[2],D);cur=r[1];}box(cur,L,0,D);
  // medianeras visibles (si el vecino de al lado es más bajo, se ve la pared lateral)
  for(const end of [0,L]){const p0=P(end,0),p1=P(end,D);const B2=bufOf(p0[0],p0[1],'concrete_wall');TINT=[0.92,0.9,0.86];const sx=end===0?-ux:ux,sz=end===0?-uz:uz;
    wall(B2,p0[0],p0[1],p1[0],p1[1],yb+gf,top,sx,sz,US('concrete_wall'));TINT=[1,1,1];}
  // tejado (losa con pretil) para que desde lo alto no se vea hueco
  {const Bq=bufOf(A[0],A[1],'concrete_wall');TINT=[0.7,0.68,0.64];capPoly(Bq,[P(0,0),P(L,0),P(L,D),P(0,D)],top,0.3);TINT=[1,1,1];}
  lot.units=units;}
function buildCornerLot(lot){const C=lot.C;const pts=[C.a,C.m1,C.m2,C.b];const yb=lot.yb;const c=centroid([...pts,[C.a[0]+(C.b[0]-C.m2[0])*0,0]]);
  // polígono de la parcela: a, m1, m2, b, esquina interior
  const inner=[C.a[0]+C.b[0]-((C.m1[0]+C.m2[0])/2-((C.m1[0]+C.m2[0])/2-C.a[0]))-C.a[0]+C.a[0],0];
  const ic=[C.b[0]===C.m2[0]?C.a[0]:C.b[0],C.a[1]===C.m1[1]?C.b[1]:C.a[1]];// esquina interior del cuadrado de esquina
  const poly=[C.a,C.m1,C.m2,C.b,ic];const cen=centroid(poly);
  const segs=[[C.a,C.m1],[C.m1,C.m2],[C.m2,C.b]];
  for(const [p,q] of segs){const ex=q[0]-p[0],ez=q[1]-p[1],l=Math.hypot(ex,ez);if(l<0.5)continue;let nx=ez/l,nz=-ex/l;if(nx*((p[0]+q[0])/2-cen[0])+nz*((p[1]+q[1])/2-cen[1])<0){nx=-nx;nz=-nz;}
    const units=[];const L=l;const openH=Math.min(3.3,lot.gf-0.9);
    if(L>12){// el xamfrà suele tener un local grande en la esquina: bar, banco o farmacia
      const sm=pick([SMALL.find(s=>s.t==='bar'),SMALL.find(s=>s.t==='banc'),SMALL.find(s=>s.t==='farmacia'),SMALL.find(s=>s.t==='restaurant')]);
      units.push({u0:1.2,u1:L/2-0.8,y1:openH,kind:'shop',state:pick(['closed','closed','boarded']),shop:{type:sm.t,signIdx:sm.sign()}},{u0:L/2+0.8,u1:L-1.2,y1:openH,kind:'shop',state:pick(['closed','boarded','closed']),shop:{type:sm.t,signIdx:sm.sign()}});}
    else if(L>4)units.push({u0:0.8,u1:L-0.8,y1:openH,kind:'shop',state:'closed',shop:{type:'x',signIdx:undefined}});
    buildFacade(lot,{a:p,b:q,nx,nz},units);}
  addPolyV(poly,yb-2,lotTop(lot));
  const Bq=bufOf(cen[0],cen[1],'concrete_wall');TINT=[0.7,0.68,0.64];capPoly(Bq,poly,lotTop(lot),0.3);TINT=[1,1,1];}
function finishSigns(){const t=new THREE.CanvasTexture(SIGNC);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;const m=atlasMat(t,t,4,16,{});INST.shopSign.mat=m;SIGN_MAT=m;}
let SIGN_MAT=null;
