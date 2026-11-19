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
const LC_WF=[7,2,1,3,2,0];
function lcStyle(b,hgt){const r=hashN(b.r[0][0],b.r[0][1]);const c=centroid(b.r);const foc=focusD(c[0],c[1])<45;const ws=LC_STY.map((s,i)=>foc?LC_WF[i]:s.w);let tot=0;for(const w of ws)tot+=w;let a=r*tot,st=LC_STY[0];for(let i=0;i<LC_STY.length;i++){a-=ws[i];if(a<=0){st=LC_STY[i];break;}}
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
    const shopsIn=(from,to)=>{let x=from;while(to-x>2.6){let w=Math.min(to-x-0.3,R(3.6,7.5));if(to-x-w<2.8)w=to-x-0.3;if(w<2.4)break;const sm=pickSmall();
        const state=det===2?(Math.random()<0.86?'glass':'closed'):(Math.random()<(det?0.5:0.25)?'dark':'closed');units.push({u0:x,u1:x+w,y1:openH,kind:'shop',state,shop:{type:sm.t,signIdx:sm.sign(),awning:['bar','fruteria','forn','restaurant'].includes(sm.t)&&Math.random()<0.45},room:{d:R(5,9)},lc:true});x+=w+R(0.35,0.7);}};
    shopsIn(t,pu);units.push({u0:pu,u1:pu+pw,y1:Math.min(3.1,gf-0.5),kind:'portal'});shopsIn(pu+pw+0.35,L-0.3);}
  const lot={yb,gf,fh,F,st:{pb:'stone_dark',up:st.wall},tint:'#ffffff',pbTint:[0.85,0.83,0.8],bk:{outer:false,i:0,j:0},facades:[],units,trimHex:'#d8d8d4',railK:st.rail};
  const holes=units.map(u=>[u.u0,u.u1,0.25,u.y1+0.25]);wallHoles('stone_dark',a,b,nx,nz,rec.y0-1,yb+gf,holes,0.3,US('stone_dark'),[0.82,0.8,0.77]);
  // fascia sobre los escaparates
  moldStrip(a,b,nx,nz,yb+gf-0.05,0.3,0.12,[0.9,0.9,0.88]);
  {const B=bufOf(mx,mz,st.wall);TINT=st.tint;wall(B,a[0],a[1],b[0],b[1],yb+gf,top+(hgt>7?0.9:0),nx,nz,US(st.wall));TINT=[1,1,1];}
  if(F>0&&!st.old)moldStrip(a,b,nx,nz,top-0.1,0.3,0.15,st.tint.map(v=>v*0.95));
  const n=Math.max(1,Math.round(L/3.3));const bay=L/n;const slabCol=new THREE.Color(st.slab).getHex();
  for(let f=0;f<F;f++){const fy=yb+gf+f*fh;const last=f===F-1&&F>3;
    if(st.balc==='cont'&&L>4&&!last&&(det||f===0)){// losa corrida de lado a lado (canto blanco) con barandilla
      addInst('losaCorrida',mx,fy-0.1,mz,yaw,L-0.1,1,1.15,0,0,0,slabCol);const nr=Math.max(1,Math.round((L-0.4)/1.6)),rw=(L-0.4)/nr;
      if(det)for(let r=0;r<nr;r++){const t=0.2+(r+0.5)*rw;addInst('balcRailF',a[0]+ux*t,fy+0.08,a[1]+uz*t,yaw,rw,1.0,1.12,1);}}
    for(let k=0;k<n;k++){const t=(k+0.5)*bay;const x=a[0]+ux*t+nx*0.015,z=a[1]+uz*t+nz*0.015;const ww=Math.min(bay-0.7,st.balc==='cont'?1.6:1.25),wh=st.balc==='cont'?2.3:1.45;
      const door=st.balc==='cont'||(st.balc==='glass')||Math.random()<0.4;const wy=door?fy+0.02:fy+0.9;const cell=Math.random()<0.6?pick([0,1,2,3,8,12]):(Math.random()*16)|0;
      addInst('win',x,wy,z,yaw,ww,door?2.3:wh,1,cell,Math.random()<0.12?1:0);if(det)addInst('winFrame',x,wy,z,yaw,ww,door?2.3:wh,1,0,0,0,0xd8dadc);if(!det&&f>0)continue;
      if(st.balc==='ind'&&door&&!last){const bw=ww+0.5,bd=R(0.55,0.75);addInst('balcSlab',x,fy-0.02,z,yaw,bw,1,bd,0,0,0,slabCol);addInst('balcRail',x,fy+0.12,z,yaw,bw,1.0,bd,st.rail);}
      if(st.balc==='glass'&&!last){const bw=ww+0.6;addInst('balcSlab',x,fy-0.02,z,yaw,bw,1,1.0,0,0,0,slabCol);addInst('railGlass',x,fy+0.12,z,yaw,bw,1.0,0.98);addInst('railTop',x,fy+0.12,z,yaw,bw,1,0.98);}
      // toldo en muchos balcones (el mismo color en todo el edificio, como en Les Corts)
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
