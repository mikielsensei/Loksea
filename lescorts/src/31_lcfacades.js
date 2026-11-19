// =====================================================================
// FACHADAS DE LES CORTS (Travessera, Vallespir…): bloques de los 60-70 de ladrillo o gresite con balcones corridos de losa
// blanca y barandilla de aluminio, toldos verdes o a rayas, persianas enrollables; casas bajas antiguas; bloques nuevos con
// barandilla de vidrio. Planta baja de locales con escaparate de aluminio y su rótulo.
// =====================================================================
const LC_STY=[
  {w:5,wall:'brick',tints:['#e8c8b4','#d8b0a0','#f0d4c4','#c89884'],slab:'#ecebe6',balc:'cont',rail:1,side:'brick'},
  {w:3,wall:'plaster_cream',tints:['#efe2c8','#f4ead6','#e8d4b0','#f2e4cc'],slab:'#f4f2ec',balc:'ind',rail:1,side:'plaster_cream'},
  {w:2,wall:'plaster_ochre',tints:['#e8c890','#dcb47c','#f0d4a0'],slab:'#f0ece2',balc:'cont',rail:1,side:'plaster_ochre'},
  {w:2,wall:'concrete_wall',tints:['#e6e4de','#d8d6d0','#f0eee8'],slab:'#f6f6f2',balc:'glass',rail:3,side:'concrete_wall'},
  {w:2,wall:'plaster_grey',tints:['#d6d2ca','#c8c4bc','#e0dcd2'],slab:'#ecebe6',balc:'ind',rail:1,side:'plaster_grey'},
  {w:1,wall:'stone_blocks',tints:['#e0d4c0','#d4c8b4'],slab:'#e8e2d6',balc:'ind',rail:0,side:'plaster_cream'}];
const AWNCOL=['#3c6e46','#2f5a3c','#4b7a52','#c8b48a','#7a5a3a','#9a3a2e','#3a4e6e','#d8cdb4'];
const hashN=(x,z)=>{const s=Math.sin(x*12.9898+z*78.233)*43758.5453;return s-Math.floor(s);};
// en Travessera y Vallespir: sobre todo bloques de ladrillo de los 60-70 y edificios grises modernos (como en las fotos)
const MET=[];
// aplacado de granito gris pulido en losas de 120x60 con juntas finas (edificio de la esquina del 365)
const texGranit=cTex(512,512,(g,w,h)=>{g.fillStyle='#808080';g.fillRect(0,0,w,h);const d=g.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const n=(Math.random()-0.5)*34+(Math.random()<0.02?40:0);d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n;}g.putImageData(d,0,0);
  for(let r=0;r<4;r++)for(let c=0;c<2;c++){const k=Math.random()<0.5?0:255;g.fillStyle=`rgba(${k},${k},${k},0.05)`;g.fillRect(c*256,r*128,256,128);}g.strokeStyle='#4a4c4e';g.lineWidth=3;for(let y=0;y<=h;y+=128){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}for(let r=0;r<4;r++)for(let x=(r%2)*128;x<=w;x+=256){g.beginPath();g.moveTo(x,r*128);g.lineTo(x,r*128+128);g.stroke();}},{});
MATS.granitPanel=pbr(new THREE.MeshStandardMaterial({map:texGranit,vertexColors:true,roughness:0.35,metalness:0.05}));TEXM.granitPanel=2.4;
const texMetal=cTex(64,256,(g,w,h)=>{for(let y=0;y<h;y++){const v=170+Math.sin(y/h*Math.PI*24)*45;g.fillStyle=`rgb(${v},${v+2},${v+5})`;g.fillRect(0,y,w,1);}},{});texMetal.wrapS=texMetal.wrapT=THREE.RepeatWrapping;
MATS.metalPanel=pbr(new THREE.MeshStandardMaterial({map:texMetal,vertexColors:true,metalness:0.6,roughness:0.35,side:THREE.DoubleSide}));
const LC_WF=[7,2,1,3,2,0];
// estilos propios de edificios concretos (sacados de las fotos)
const LC_CUST={
  granit:{w:0,wall:'plaster_cream',tints:['#e6dccb'],low:'granitPanel',lowTint:[0.52,0.53,0.55],lowF:2,slab:'#ecebe6',balc:'none',rail:1,side:'plaster_grey',gfMat:'granitPanel',gfTint:[0.85,0.85,0.86],win:'box'},
  metall:{w:0,wall:'plaster_cream',tints:['#e2c4ae'],slab:'#ecebe6',balc:'none',rail:1,side:'brick',metal:true,gfMat:'plaster_cream',gfTint:[0.86,0.76,0.68]},
  maoBlanc:{w:0,wall:'brick',tints:['#c8846a'],slab:'#ecebe6',balc:'none',rail:1,side:'brick',blank:true,gfMat:'brick',gfTint:[0.78,0.5,0.4]}};
function custStyle(b){if(b.sty&&LC_CUST[b.sty])return LC_CUST[b.sty];if(!CUSTOM)return null;const c=centroid(b.r);for(const s of CUSTOM.styles||[])if(Math.hypot(c[0]-s.at[0],c[1]-s.at[1])<s.r)return LC_CUST[s.sty];return null;}
// color de fachada medido en tus fotos -> material y tinte (sobre la textura fotográfica neutra)
const TEXMEAN={brick:[110,89,67],plaster_cream:[187,177,163],plaster_grey:[171,163,160],plaster_ochre:[139,120,77],stone_dark:[86,83,75],concrete_wall:[92,81,69]};
const lin=v=>Math.pow(v/255,2.2);
function photoStyle(b){const c=centroid(b.r);let best=null;for(const q of BCOL){if(Math.abs(q[0]-c[0])<0.6&&Math.abs(q[1]-c[1])<0.6){best=q[2];break;}}
  // sin muestra propia: el color del edificio con foto más cercano (el mismo inmueble suele estar partido en trozos en el modelo)
  if(!best&&focusD(c[0],c[1])<45){let bd=16;for(const q of BCOL){const d=Math.hypot(q[0]-c[0],q[1]-c[1]);if(d<bd){bd=d;best=q[2];}}}
  if(!best)return null;
  const [r,g,bl]=best.c;const col=new THREE.Color(r/255,g/255,bl/255);const hsl={};col.getHSL(hsl);const mx=Math.max(r,g,bl),mn=Math.min(r,g,bl),sat=mx?(mx-mn)/mx:0,v=mx/255,h=hsl.h;
  let wall;if((h<0.075||h>0.95)&&sat>0.26&&v<0.75)wall='brick';else if(sat<0.12)wall=v<0.5?'stone_dark':'plaster_grey';else if(h<0.17&&sat>0.42)wall='plaster_ochre';else wall='plaster_cream';
  const tm=TEXMEAN[wall];const tint=[0,1,2].map(i=>clamp(lin(best.c[i])/lin(tm[i])*1.12,0.25,2.4));
  const gt=[0.4,0.41,0.43];// planta baja: granito oscuro pulido (lo habitual en Travessera); la muestra de la foto está tapada por coches y gente
  const st={w:0,wall,tints:['#ffffff'],slab:'#ecebe6',balc:(best.c[0]*7+best.c[1]*3+best.c[2])%3<1.2?'cont':'ind',rail:1,side:wall,gfMat:'granitPanel',gfTint:gt};return {st,tint,gf:best.gf};}
function lcStyle(b,hgt){const cs=custStyle(b);if(cs){const tint=hexTint(cs.tints[0]);return Object.assign({},cs,{tint,sideTint:tint.map(v=>v*0.93),awn:null,awnP:0,old:false,cust:true});}{const ps=photoStyle(b);if(ps){const r0=hashN(b.r[0][0],b.r[0][1]);return Object.assign({},ps.st,{tint:ps.tint,sideTint:ps.tint.map(v=>v*0.93),awn:null,awnP:0,old:hgt<10.5,photo:true});}}const r=hashN(b.r[0][0],b.r[0][1]);const c=centroid(b.r);const foc=focusD(c[0],c[1])<45;const ws=LC_STY.map((s,i)=>foc?LC_WF[i]:s.w);let tot=0;for(const w of ws)tot+=w;let a=r*tot,st=LC_STY[0];for(let i=0;i<LC_STY.length;i++){a-=ws[i];if(a<=0){st=LC_STY[i];break;}}
  const old=hgt<10.5;if(old&&r<0.6&&!foc)st=pick([LC_STY[1],LC_STY[4],LC_STY[5]]);
  const tint=hexTint(pick(st.tints));return Object.assign({},st,{tint,sideTint:tint.map(v=>v*0.93),awn:Math.random()<0.65?pick(AWNCOL):null,awnP:R(0.25,0.7),old});}
// toldo de balcón (tela tensa inclinada con faldón), color por instancia
defInst('toldoB',(()=>{const g=mkG([[bx(1,0.02,0.9,0,0,0.45,0.55),0xffffff],[bx(1,0.25,0.015,0,-0.27,0.83),0xffffff],[bx(1.02,0.03,0.03,0,0.02,0.02),0x9a9a9a]]);return g;})(),
  pbr(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.9,map:ltex('fabric_diff.jpg')})),1,1,false);
// canto de losa de balcón corrido (frente blanco de hormigón)
defInst('losaCorrida',mkG([[bx(1,0.18,1,0,0.0,0.5),0xffffff],[bx(1,0.04,0.06,0,0.11,0.97),0xd8d8d4]]),new THREE.MeshLambertMaterial({vertexColors:true}),1,1,false);
// barandilla de vidrio con perfil de aluminio
defInst('railGlass',(()=>{const g=new THREE.PlaneGeometry(1,1);g.translate(0,0.5,1);return g;})(),new THREE.MeshLambertMaterial({color:0x9fb4bc,transparent:true,opacity:0.38,side:THREE.DoubleSide,depthWrite:false}),1,1,false);
defInst('railTop',mkG([[bx(1,0.05,0.05,0,1.0,1),0xb8bcc0]]),metalMat,1,1,false);
// persiana enrollable a medio bajar (caja + lamas)
// zona de detalle: Travessera (de C. de les Corts a Numància) y Vallespir (de Travessera a Marquès de Sentmenat)
const LC_FOCUS=[[[-320,232],[170,-172]],[[-29,-8],[32,112]]];
function segD(x,z,A,B){const ex=B[0]-A[0],ez=B[1]-A[1];const t=clamp(((x-A[0])*ex+(z-A[1])*ez)/(ex*ex+ez*ez),0,1);return Math.hypot(x-A[0]-ex*t,z-A[1]-ez*t);}
function focusD(x,z){let d=1e9;for(const [A,B] of LC_FOCUS)d=Math.min(d,segD(x,z,A,B));return d;}
function lcFacade(rec,seg){const{a,b,nx,nz,L}=seg;const st=rec.st;const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;const yaw=Math.atan2(nx,nz);
  const mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;const yb=Math.max(rec.y0,H(mx+nx*1.6,mz+nz*1.6));// suelo de la acera delante
  const fd=focusD(mx,mz),det=fd<32?2:fd<75?1:0;// 2: todo (interiores), 1: fachada completa sin interiores, 0: lejos, lo justo
  const hgt=rec.y1-yb;const gf=hgt<7?Math.min(3.6,hgt-0.4):4.0,fh=2.92;const F=Math.max(0,Math.floor((rec.y1-yb-gf-0.3)/fh));const top=rec.y1;
  // planta baja: locales y portal
  const units=[];const openH=Math.min(3.25,gf-0.6);
  if(L>=3.2){const pw=R(1.9,2.3);const pu=L<9?(Math.random()<0.5?0.4:L-pw-0.4):R(0.2,0.8)*(L-pw);let t=0.35;
    const shopsIn=(from,to)=>{let x=from;while(to-x>2.6){let w=Math.min(to-x-0.3,R(3.6,7.5));if(to-x-w<2.8)w=to-x-0.3;if(w<2.4)break;const sm=pickSmall();const real=POIS.some(p=>Math.hypot(p[0]-(a[0]+ux*(x+2)),p[1]-(a[1]+uz*(x+2)))<9);
        const state=det===2?(Math.random()<0.86?'glass':'closed'):(Math.random()<(det?0.5:0.25)?'dark':'closed');units.push({u0:x,u1:x+w,y1:openH,kind:'shop',state,shop:{type:sm.t,signIdx:undefined,noSign:!real,awning:['bar','fruteria','forn','restaurant'].includes(sm.t)&&Math.random()<0.45},room:{d:R(5,9)},lc:true});x+=w+R(0.35,0.7);}};
    shopsIn(t,pu);units.push({u0:pu,u1:pu+pw,y1:Math.min(3.1,gf-0.5),kind:'portal'});shopsIn(pu+pw+0.35,L-0.3);}
  const lot={yb,gf,fh,F,st:{pb:'stone_dark',up:st.wall},tint:'#ffffff',pbTint:[0.85,0.83,0.8],bk:{outer:false,i:0,j:0},facades:[],units,trimHex:'#d8d8d4',railK:st.rail};
  if(st.blank){units.length=0;}
  const holes=units.map(u=>[u.u0,u.u1,0.25,u.y1+0.25]);wallHoles(st.gfMat||'stone_dark',a,b,nx,nz,rec.y0-1,yb+gf,holes,0.3,US(st.gfMat||'stone_dark'),st.gfTint||[0.82,0.8,0.77]);
  // fascia sobre los escaparates
  moldStrip(a,b,nx,nz,yb+gf-0.05,0.3,0.12,[0.9,0.9,0.88]);
  {let y=yb+gf;if(st.low){const yl=Math.min(top,yb+gf+st.lowF*fh);const B=bufOf(mx,mz,st.low);TINT=st.lowTint;wall(B,a[0],a[1],b[0],b[1],y,yl,nx,nz,US(st.low));y=yl;}
    if(st.blank&&hgt>4.5){const yl=Math.min(top,yb+4.2);const B=bufOf(mx,mz,'brick');TINT=[0.78,0.5,0.4];wall(B,a[0],a[1],b[0],b[1],yb+gf,yl,nx,nz,US('brick'));y=yl;const B2=bufOf(mx,mz,'concrete_wall');TINT=[0.95,0.95,0.94];wall(B2,a[0],a[1],b[0],b[1],y,top,nx,nz,US('concrete_wall'));TINT=[1,1,1];FACADES.push({a,b,nx,nz,L,yb,gf,F:0,fh,outer:false});return;}
    const B=bufOf(mx,mz,st.wall);TINT=st.tint;wall(B,a[0],a[1],b[0],b[1],y,top+(hgt>7?0.9:0),nx,nz,US(st.wall));TINT=[1,1,1];
    if(st.metal&&L>5&&F>1){const m0=L*0.25,m1=Math.min(L,L*0.25+7);const B2=bufOf(mx,mz,'metalPanel');const s0=[a[0]+ux*m0,a[1]+uz*m0],s1=[a[0]+ux*m1,a[1]+uz*m1];
      // panel ondulado que sale en curva hacia la calle en la parte alta
      const yA=yb+gf+fh*0.3,yB=top-0.2;const N=6;for(let k=0;k<N;k++){const t0=k/N,t1=(k+1)/N;const o0=Math.sin(t0*Math.PI/2)*0.9,o1=Math.sin(t1*Math.PI/2)*0.9;
        const y0=yA+(yB-yA)*t0,y1=yA+(yB-yA)*t1;wallQ(B2,s0[0]+nx*o0,s0[1]+nz*o0,s1[0]+nx*o0,s1[1]+nz*o0,y0,y1,y0,y1,nx,nz,1.0);
        // la curva necesita la cara inclinada: aproximamos con dos alturas desplazadas
        if(o1-o0>0.01)capPoly(B2,[[s0[0]+nx*o0,s0[1]+nz*o0],[s1[0]+nx*o0,s1[1]+nz*o0],[s1[0]+nx*o1,s1[1]+nz*o1],[s0[0]+nx*o1,s0[1]+nz*o1]],y1,1.0,true);}
      MET.push({s0,s1,nx,nz,y0:yA,y1:yB});}}
  if(F>0&&!st.old)moldStrip(a,b,nx,nz,top-0.1,0.3,0.15,st.tint.map(v=>v*0.95));
  const n=Math.max(1,Math.round(L/3.3));const bay=L/n;const slabCol=new THREE.Color(st.slab).getHex();
  for(let f=0;f<F;f++){const fy=yb+gf+f*fh;const last=f===F-1&&F>3;
    if(st.balc==='cont'&&L>4&&!last&&(det||f===0)){// losa corrida de lado a lado (canto blanco) con barandilla
      addInst('losaCorrida',mx,fy-0.1,mz,yaw,L-0.1,1,1.15,0,0,0,slabCol);const nr=Math.max(1,Math.round((L-0.4)/1.6)),rw=(L-0.4)/nr;
      if(det)for(let r=0;r<nr;r++){const t=0.2+(r+0.5)*rw;addInst('balcRailF',a[0]+ux*t,fy+0.08,a[1]+uz*t,yaw,rw,1.0,1.12,1);}}
    for(let k=0;k<n;k++){const t=(k+0.5)*bay;const x=a[0]+ux*t+nx*0.015,z=a[1]+uz*t+nz*0.015;const ww=Math.min(bay-0.7,st.balc==='cont'?1.6:1.25),wh=st.balc==='cont'?2.3:1.45;
      const door=st.balc!=='none'&&(st.balc==='cont'||(st.balc==='glass')||Math.random()<0.4);const wy=door?fy+0.02:fy+0.9;const cell=Math.random()<0.6?pick([0,1,2,3,8,12]):(Math.random()*16)|0;
      addInst('win',x,wy,z,yaw,ww,door?2.3:wh,1,cell,Math.random()<0.12?1:0);if(det)addInst('winFrame',x,wy,z,yaw,ww,door?2.3:wh,1,0,0,0,0xd8dadc);if(!det&&f>0)continue;
      if(st.balc==='ind'&&door&&!last){const bw=ww+0.5,bd=R(0.55,0.75);addInst('balcSlab',x,fy-0.02,z,yaw,bw,1,bd,0,0,0,slabCol);addInst('balcRail',x,fy+0.12,z,yaw,bw,1.0,bd,st.rail);}
      if(st.balc==='glass'&&!last){const bw=ww+0.6;addInst('balcSlab',x,fy-0.02,z,yaw,bw,1,1.0,0,0,0,slabCol);addInst('railGlass',x,fy+0.12,z,yaw,bw,1.0,0.98);addInst('railTop',x,fy+0.12,z,yaw,bw,1,0.98);}
      // toldo en muchos balcones (el mismo color en todo el edificio, como en Les Corts)
      if(st.win==='box'&&!door){addInst('winFrame',x,wy,z,yaw,ww*1.15,wh*1.1,1.6,0,0,0,0x8a8d8f);}
      if(st.awn&&door&&Math.random()<st.awnP){const col=new THREE.Color(Math.random()<0.85?st.awn:pick(AWNCOL)).getHex();addInst('toldoB',x,fy+2.42,z,yaw,ww+0.25,1,st.balc==='cont'?1.05:0.8,0,0,0,col);}
      if(Math.random()<0.08)addInst('ac',x+ux*(ww/2+0.45)+nx*0.02,fy+1.7,z+uz*(ww/2+0.45)+nz*0.02,yaw);
      if(Math.random()<0.12)addInst('maceta',x+ux*R(-0.4,0.4)+nx*0.55,fy+0.12,z+uz*R(-0.4,0.4)+nz*0.55,0);
      if(Math.random()<0.04)addInst('laundry',x+nx*0.6,fy+1.95,z+nz*0.6,yaw);}}
  for(const u of units)buildUnit(lot,seg,u,ux,uz,L);
  FACADES.push({a,b,nx,nz,L,yb,gf,F,fh,outer:false});}
// farola de Les Corts: báculo gris de 8 m con brazo curvo y luminaria plana (como las de la Travessera)
{const G=0x6e7276,D=0x3a3c3e;const p=[[cy(0.11,0.075,7.6,0,3.8,0,7),G],[cy(0.16,0.16,0.5,0,0.25,0,7),G]];
  const pts=[];for(let k=0;k<=8;k++){const t=k/8,ang=t*Math.PI/2;pts.push([0,7.6+Math.sin(ang)*0.5,(1-Math.cos(ang))*0.9]);}
  for(let k=0;k<8;k+=2)p.push([tube(pts[k],pts[k+2],0.05,5),G]);p.push([tube([0,8.1,0.9],[0,8.18,1.9],0.045,6),G],[bx(0.32,0.09,0.7,0,8.12,2.1),D],[bx(0.26,0.02,0.6,0,8.065,2.1),0xf0eee0]);
  defInst('farola',mkG(p),metalMat,1,1,false);}
// mobiliario: lo concreto de Travessera y Vallespir llega en 32_lcstreet.js
