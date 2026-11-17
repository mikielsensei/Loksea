
// =====================================================================
// HUD, PANELES Y MENSAJES
// =====================================================================
const hudC=document.getElementById('hud');const hg=hudC.getContext('2d');const hudTex=new THREE.CanvasTexture(hudC);hudTex.colorSpace=THREE.SRGBColorSpace;
const wrist=new THREE.Mesh(new THREE.PlaneGeometry(0.13,0.1625),new THREE.MeshBasicMaterial({map:hudTex,transparent:true}));wrist.visible=false;wrist.renderOrder=999;wrist.material.depthTest=false;scene.add(wrist);let hudOn=true;
const pnlC=document.getElementById('pnl');const pg=pnlC.getContext('2d');const pnlTex=new THREE.CanvasTexture(pnlC);pnlTex.colorSpace=THREE.SRGBColorSpace;
const pnlMesh=new THREE.Mesh(new THREE.PlaneGeometry(0.96,0.72),new THREE.MeshBasicMaterial({map:pnlTex,transparent:true,depthTest:false}));pnlMesh.renderOrder=1001;pnlMesh.visible=false;scene.add(pnlMesh);
const toastC=document.createElement('canvas');toastC.width=900;toastC.height=96;const tg=toastC.getContext('2d');const toastTex=new THREE.CanvasTexture(toastC);toastTex.colorSpace=THREE.SRGBColorSpace;
const toastPlane=new THREE.Mesh(new THREE.PlaneGeometry(0.9,0.096),new THREE.MeshBasicMaterial({map:toastTex,transparent:true,depthTest:false}));toastPlane.renderOrder=1000;toastPlane.position.set(0,-0.2,-0.95);toastPlane.visible=false;camera.add(toastPlane);
const toastDiv=document.getElementById('toast');let toastT=0;const log=[];
function toast(msg,keep=3){log.unshift(msg);if(log.length>5)log.pop();toastT=keep;toastDiv.textContent=msg;toastDiv.style.display=inVR?'none':'block';
  tg.clearRect(0,0,900,96);tg.fillStyle='rgba(0,0,0,.72)';tg.beginPath();tg.roundRect(4,8,892,80,14);tg.fill();tg.fillStyle='#fff';tg.font='bold 32px sans-serif';tg.textAlign='center';tg.textBaseline='middle';tg.fillText(msg,450,48,870);toastTex.needsUpdate=true;toastPlane.visible=inVR;}
let prompt='';
function bar(y,label,v,col,inv){hg.fillStyle='#ccc';hg.font='21px sans-serif';hg.textAlign='left';hg.fillText(label,14,y+19);hg.fillStyle='#333';hg.fillRect(150,y+4,346,18);hg.fillStyle=col;hg.fillRect(150,y+4,346*clamp(v,0,100)/100,18);
  if(inv?v>80:v<20){hg.strokeStyle='#ff4040';hg.lineWidth=2;hg.strokeRect(149,y+3,348,20);}}
function drawHUD(){const g=hg;g.clearRect(0,0,512,640);g.fillStyle='rgba(10,12,14,0.84)';g.beginPath();g.roundRect(0,0,512,640,22);g.fill();
  const h=hourF();const hh=String(Math.floor(h)).padStart(2,'0'),mm=String(Math.floor((h%1)*60)).padStart(2,'0');
  g.fillStyle='#f0e0b0';g.font='bold 28px sans-serif';g.textAlign='left';g.fillText(`Día ${dayNum()}  ${hh}:${mm}  ${nightF>0.5?'☾':'☀'}`,14,34);
  g.textAlign='right';g.font='20px sans-serif';g.fillStyle='#aaa';g.fillText(`Bajas ${P.kills}`,498,32);
  bar(46,'Salud',P.hp,'#d33');bar(72,'Hambre',P.food,'#e8902a');bar(98,'Sed',P.water,'#3a8ee8');bar(124,'Vejiga',P.bladder,'#d8c83a',true);bar(150,'Intestino',P.bowels,'#8a5a2a',true);
  bar(176,'Energía',P.energy,'#4cc04c');bar(202,'Ánimo',P.mood,'#b070d0');
  g.textAlign='left';g.font='bold 21px sans-serif';g.fillStyle='#fff';
  const wn={manos:'Manos',bate:'Bate',pistola:`Pistola ${G.mag>=0?G.mag:'—'}+${G.chamber?1:0}`}[P.weapon];
  g.fillText(`${wn} · Cinturón ${BELT.map(b=>b===null?'—':b).join('/')} · Balas ${countItem('balas')}${P.light?' · Luz':''}`,14,250,490);
  const st=[];if(P.sick>20)st.push('Intoxicado');if(P.infected&&P.infT>6)st.push('Fiebre');if(invWeight()>invCap())st.push('Sobrecargado');if(P.crouch)st.push('Agachado');
  if(P.inCar)st.push(`Coche ${Math.abs(P.inCar.speed*3.6)|0} km/h · gasolina ${P.inCar.fuel|0}%`);const zn=zoneName(camW.x,camW.z);if(zn)st.push(zn);
  g.fillStyle='#ff9a6a';g.font='20px sans-serif';g.fillText(st.join(' · '),14,276,490);
  if(prompt){g.fillStyle='#ffd84a';g.font='bold 21px sans-serif';g.fillText(prompt,14,302,490);}
  g.font='18px sans-serif';log.slice(0,2).forEach((m,i)=>{g.fillStyle=i===0?'#fff':'#999';g.fillText(m,14,328+i*22,490);});
  const mx=136,my=372,ms=240,range=100;const p=camW;g.save();g.beginPath();g.rect(mx,my,ms,ms);g.clip();g.fillStyle='#111';g.fillRect(mx,my,ms,ms);
  g.drawImage(mapC,mtx(p.x-range),mtz(p.z-range),range*2*MAPS,range*2*MAPS,mx,my,ms,ms);
  const k=ms/(range*2);const toM=(x,z)=>[mx+(x-p.x+range)*k,my+(z-p.z+range)*k];
  for(const c of cars){if(Math.abs(c.x-p.x)>range||Math.abs(c.z-p.z)>range)continue;const [a,b]=toM(c.x,c.z);g.fillStyle='#fff';g.fillRect(a-2,b-2,4,4);}
  for(const q of H_){if(!q.active||q.dead)continue;const d=Math.hypot(q.x-p.x,q.z-p.z);if(q.type==='zombie'&&d>35)continue;if(d>range)continue;const [a,b]=toM(q.x,q.z);
    g.fillStyle=q.type==='zombie'?'#ff3030':hostileToPlayer(q)?'#ff9a20':'#4cd964';g.fillRect(a-2.5,b-2.5,5,5);}
  camera.getWorldDirection(_v4);const ang=Math.atan2(_v4.x,_v4.z);g.translate(mx+ms/2,my+ms/2);g.rotate(-ang);g.fillStyle='#ffd84a';g.beginPath();g.moveTo(0,9);g.lineTo(-6,-6);g.lineTo(6,-6);g.closePath();g.fill();g.restore();
  g.strokeStyle='#555';g.lineWidth=2;g.strokeRect(mx,my,ms,ms);g.fillStyle='#888';g.font='16px sans-serif';g.textAlign='center';g.fillText('N',mx+ms/2,my-5);}
function zoneName(x,z){let best='',bd=1e9;for(const st of VSTR){const d=Math.abs(x-st.pos);if(d<st.w/2+2&&d<bd){bd=d;best=st.n;}}for(const st of HSTR){const d=Math.abs(z-st.pos);if(d<st.w/2+2&&d<bd){bd=d;best=st.n;}}
  if(!best){for(const b of BASES)if(Math.hypot(b.x-x,b.z-z)<b.r+8)return b.name;return 'Eixample';}return best;}
// ---------- paneles ----------
let panel=null,panelStack=[];
const MAIN=[{l:()=>'Inventario',a:()=>pushPanel('inv')},{l:()=>'Estado de salud',a:()=>pushPanel('status')},{l:()=>'Mapa',a:()=>pushPanel('map')},
  {l:()=>'Mear',a:()=>{closePanel();doPee();}},{l:()=>'Cagar',a:()=>{closePanel();doPoop();}},{l:()=>'Dormir 8 horas',a:()=>doSleep()},
  {l:()=>`Repostar coche (bidones: ${countItem('gasolina')})`,a:()=>doRefuel()},{l:()=>'Ajustes de partida',a:()=>pushPanel('set')},{l:()=>'Ajustar posición de las manos',a:()=>pushPanel('hands')},{l:()=>'Recolocar altura y vista',a:()=>{closePanel();recenter();}},{l:()=>'Desatascar jugador (volver a la calle)',a:()=>{closePanel();unstick();}},{l:()=>'Cerrar',a:()=>closePanel()}];
function panelItems(){if(!panel)return[];const m=panel.mode;if(m==='main')return MAIN;
  if(m==='inv'){if(!P.items.length)return[{l:()=>'(Inventario vacío)'}];return P.items.map(e=>({l:()=>itemLabel(e),a:()=>useEntry(e),adj:d=>{if(d<0)dropEntry(e);}}));}
  if(m==='set')return SET_DEFS.filter(d=>!d.start).map(d=>({l:()=>`◀ ▶  ${d.l}: ${fmtS(d)}`,adj:dd=>{const i=d.o.indexOf(S[d.k]);S[d.k]=d.o[clamp(i+dd,0,d.o.length-1)];saveS();}}));
  if(m==='hands'){const it=(k,lab,st,unit)=>({l:()=>`◀ ▶  ${lab}: ${(HC[k]/(unit||1)).toFixed(unit?0:2)}${unit?'°':' m'}`,adj:d=>{HC[k]=+(HC[k]+d*st).toFixed(4);saveHC();applyHC();}});
    return[it('pitch','Inclinar',Math.PI/36,Math.PI/180),it('yaw','Girar',Math.PI/36,Math.PI/180),it('roll','Rotar',Math.PI/36,Math.PI/180),it('fwd','Adelante/atrás',0.01),it('up','Arriba/abajo',0.01),
      {l:()=>'Restablecer',a:()=>{Object.assign(HC,{pitch:0,yaw:0,roll:0,fwd:0,up:0});saveHC();applyHC();}}];}
  return[];}
function openPanel(mode){panel={mode,sel:0};panelStack=[];if(inVR){camera.getWorldPosition(_v);camera.getWorldDirection(_v1);_v1.y=0;_v1.normalize();pnlMesh.position.copy(_v).addScaledVector(_v1,0.85);pnlMesh.position.y-=0.12;pnlMesh.lookAt(_v);pnlMesh.visible=true;}else pnlC.style.display='block';drawPanel();}
function pushPanel(mode){panelStack.push(panel);panel={mode,sel:0};drawPanel();}
function backPanel(){if(panelStack.length){panel=panelStack.pop();drawPanel();}else closePanel();}
function closePanel(){panel=null;panelStack=[];pnlMesh.visible=false;pnlC.style.display='none';}
const TITLES={main:'MENÚ',inv:'INVENTARIO',status:'ESTADO',map:'MAPA DE BARCELONA',set:'AJUSTES DE PARTIDA',hands:'POSICIÓN DE LAS MANOS'};
function drawPanel(){if(!panel)return;const g=pg;g.clearRect(0,0,1024,768);g.fillStyle='rgba(12,13,16,.93)';g.beginPath();g.roundRect(0,0,1024,768,28);g.fill();g.strokeStyle='#5a2a2a';g.lineWidth=3;g.stroke();
  g.fillStyle='#f0e0b0';g.font='bold 40px sans-serif';g.textAlign='left';g.fillText(TITLES[panel.mode],36,60);
  g.fillStyle='#888';g.font='22px sans-serif';g.fillText(inVR?'Stick izq: moverte/ajustar · Gatillo der: elegir · X: volver':'Flechas: moverte/ajustar · Enter: elegir · Retroceso: volver',36,744);
  if(panel.mode==='status'){const L=[`Salud: ${P.hp|0}%`,`Hambre: ${P.food|0}%   Sed: ${P.water|0}%`,`Vejiga: ${P.bladder|0}%   Intestino: ${P.bowels|0}%`,`Energía: ${P.energy|0}%   Ánimo: ${P.mood|0}%`,
      `Intoxicación: ${P.sick<5?'ninguna':P.sick<35?'leve':P.sick<70?'moderada':'grave'}`,`Temperatura: ${P.infected&&P.infT>6?(P.infT>30?'fiebre muy alta':'fiebre'):'normal'}`,
      `Peso: ${invWeight().toFixed(1)} / ${invCap()} kg${P.bag?' (mochila)':''}`,`Días sobrevividos: ${dayNum()}   Zombis abatidos: ${P.kills}`];g.font='30px sans-serif';L.forEach((t,i)=>{g.fillStyle='#ddd';g.fillText(t,50,130+i*62);});return;}
  if(panel.mode==='map'){const s=Math.min(940/mapC.width,640/mapC.height);const w=mapC.width*s,hh=mapC.height*s;const ox=(1024-w)/2,oy=80;g.drawImage(mapC,ox,oy,w,hh);
    const [a,b]=[ox+mtx(camW.x)*s,oy+mtz(camW.z)*s];g.fillStyle='#ffd84a';g.beginPath();g.arc(a,b,8,0,7);g.fill();g.font='16px sans-serif';
    for(const bs of BASES){g.fillStyle=bs.type==='good'&&!bs.angry?'#4cd964':'#ff5050';g.fillText(bs.name,ox+mtx(bs.x)*s+10,oy+mtz(bs.z)*s+5);}
    g.fillStyle='#ccc';g.font='17px sans-serif';g.fillText('Verde: bases aliadas · Rojo: bandidos · Azul: comisarías · Naranja: súper · Verde claro: farmacias · Amarillo: bares',36,712);return;}
  const items=panelItems();const per=15;const start=Math.max(0,Math.min(panel.sel-7,items.length-per));
  for(let i=start;i<Math.min(items.length,start+per);i++){const y=110+(i-start)*40;if(i===panel.sel){g.fillStyle='rgba(255,216,74,.22)';g.fillRect(24,y-28,976,38);}g.fillStyle=i===panel.sel?'#ffd84a':'#ddd';g.font='28px sans-serif';g.fillText(items[i].l(),40,y,940);}
  if(panel.mode==='inv'){g.fillStyle='#aaa';g.font='22px sans-serif';g.fillText(`Peso ${invWeight().toFixed(1)}/${invCap()} kg · Elegir = usar/comer/beber · ◀ = tirar uno`,36,712);}}
function panelInput(){if(!panel)return;const items=panelItems();let ch=false;if(IN.back){backPanel();return;}
  if(IN.up&&items.length){panel.sel=(panel.sel+items.length-1)%items.length;ch=true;}if(IN.down&&items.length){panel.sel=(panel.sel+1)%items.length;ch=true;}
  const it=items[panel.sel];if(it){if(IN.left&&it.adj){it.adj(-1);ch=true;}if(IN.right&&it.adj){it.adj(1);ch=true;}if(IN.ok){if(it.a)it.a();else if(it.adj)it.adj(1);ch=true;}}
  if(ch&&panel){const n=panelItems().length;if(panel.sel>=n)panel.sel=Math.max(0,n-1);drawPanel();}}

// =====================================================================
// ACCIONES: mear (con chorro), cagar (en el baño o el ánimo baja), dormir, repostar, beber
// =====================================================================
const peeMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.011,0),new THREE.MeshBasicMaterial({color:0xe8d24a,transparent:true,opacity:0.75}),260);peeMesh.frustumCulled=false;
for(let i=0;i<260;i++)peeMesh.setMatrixAt(i,ZM);scene.add(peeMesh);const peeP=[];let peeI=0;const puddles=[];
function doPee(){if(P.bladder<12)return toast('No tienes ganas de mear');if(P.peeT>0)return;P.peeT=Math.min(6,1.5+P.bladder/18);P.peeStart=P.bladder;sfx('pee');const t=nearToilet();toast(t?'Meas en el váter. Qué alivio.':'Meas en plena calle…');P.peeToilet=!!t;}
function doPoop(){if(P.bowels<18)return toast('No tienes ganas');const t=nearToilet();P.bowels=0;
  if(t){if(countItem('papel')>0){takeItem('papel',1);P.mood=Math.min(100,P.mood+8);toast(`Usas ${t.kind==='letrina'?'la letrina':'el váter'}. Civilizado.`);}else{P.mood=Math.max(0,P.mood-4);toast('Cagas en el váter, pero sin papel… Ánimo -4');}}
  else{const pen=countItem('papel')>0?20:32;if(countItem('papel')>0)takeItem('papel',1);P.mood=Math.max(0,P.mood-pen);toast(`Cagas en la calle. Te sientes fatal. Ánimo -${pen}`);}fadeBlack(2.5);}
function doSleep(bed){if(P.energy>75)return toast('No tienes sueño');if(P.inCar&&Math.abs(P.inCar.speed)>0.5)return toast('Para el coche primero');
  const danger=H_.some(h=>h.active&&!h.dead&&hostileToPlayer(h)&&Math.hypot(h.x-camW.x,h.z-camW.z)<28);if(danger)return toast('No puedes dormir con enemigos cerca');
  P.sleeping=true;P.sleepLeft=480;P.bedSleep=!!bed;closePanel();toast(bed?'Te metes en la cama…':'Te echas a dormir en el suelo…',4);}
function doRefuel(){const c=nearestCar(4);if(!c)return toast('No hay ningún coche cerca');if(countItem('gasolina')<=0)return toast('No tienes gasolina');takeItem('gasolina',1);c.fuel=Math.min(100,c.fuel+40);toast(`Repostas. Depósito: ${c.fuel|0}%`);}
let blackT=0;const fadeBlack=t=>{blackT=t;};

// =====================================================================
// EFECTOS
// =====================================================================
// gotas de sangre: esferas que se estiran con la velocidad y, al tocar el suelo, quedan como una salpicadura plana
const NBL=420;const blood=new THREE.InstancedMesh(new THREE.SphereGeometry(1,7,5),pbr(new THREE.MeshStandardMaterial({color:0x4a0303,roughness:0.22,metalness:0,envMapIntensity:0.8})),NBL);blood.frustumCulled=false;for(let i=0;i<NBL;i++)blood.setMatrixAt(i,ZM);scene.add(blood);
const parts=[];let partI=0;function spray(pos,dir,n=10){if(!S.gore)n=0;n=Math.round(n*2.2);for(let k=0;k<n;k++){const i=partI++%NBL;const sp=R(0.6,1)*(k<n*0.3?3.5:1.8);
    parts[i]={p:pos.clone().addScaledVector(dir,0.03),v:new V3(dir.x*sp*R(0.6,1.4)+R(-0.9,0.9),dir.y*sp+R(-0.3,1.6),dir.z*sp*R(0.6,1.4)+R(-0.9,0.9)),life:R(0.6,1.2),r:R(0.0025,k<n*0.3?0.005:0.008),ground:false};}}
const _bq=new Q4(),_bs=new V3(),_bv=new V3();
const dust=new THREE.InstancedMesh(new THREE.BoxGeometry(0.03,0.03,0.03),new THREE.MeshBasicMaterial({color:0x9a948a}),60);dust.frustumCulled=false;for(let i=0;i<60;i++)dust.setMatrixAt(i,ZM);scene.add(dust);const dps=[];let dpi=0;
function impactPuff(p){for(let k=0;k<6;k++){const i=dpi++%60;dps[i]={p:p.clone(),v:new V3(R(-1,1),R(0.5,2),R(-1,1)),life:R(0.3,0.6)};}}
const tracers=[];for(let i=0;i<16;i++){const g=new THREE.BufferGeometry().setFromPoints([new V3(),new V3()]);const l=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xffe28a,transparent:true,opacity:0}));l.frustumCulled=false;scene.add(l);tracers.push({l,t:0});}
let trI=0;function tracer(a,b){const t=tracers[trI++%tracers.length];const pa=t.l.geometry.attributes.position;pa.setXYZ(0,a.x,a.y,a.z);pa.setXYZ(1,b.x,b.y,b.z);pa.needsUpdate=true;t.t=0.09;t.l.material.opacity=1;}
const noises=[];const makeNoise=(x,z,r)=>noises.push({x,z,r,t:3});
const blobs=new THREE.InstancedMesh((()=>{const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);return g;})(),new THREE.MeshBasicMaterial({map:texShadow,transparent:true,depthWrite:false}),MAXC+2);blobs.frustumCulled=false;for(let i=0;i<MAXC+2;i++)blobs.setMatrixAt(i,ZM);scene.add(blobs);
const fxSphere=new THREE.Mesh(new THREE.SphereGeometry(0.3,10,8),new THREE.MeshBasicMaterial({color:0x990000,transparent:true,opacity:0,side:THREE.BackSide,depthTest:false}));fxSphere.renderOrder=999;camera.add(fxSphere);let hurtFx=0;
const fxDiv=document.getElementById('fx');

// =====================================================================
// ENTRADA (teclado, ratón, táctil, mandos Quest)
// =====================================================================
const keys={},pressed=new Set();let mouseDown=false,lookDX=0,lookDY=0,rightDown=false;
addEventListener('keydown',e=>{if(!started)return;if(['Tab','ArrowUp','ArrowDown','Space','Backspace'].includes(e.code))e.preventDefault();if(!keys[e.code])pressed.add(e.code);keys[e.code]=true;});
addEventListener('keyup',e=>{keys[e.code]=false;});
const cv=renderer.domElement;cv.addEventListener('contextmenu',e=>e.preventDefault());
cv.addEventListener('mousedown',e=>{if(!started||inVR)return;initAudio();if(e.button===2){rightDown=true;return;}if(document.pointerLockElement!==cv){try{const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(err){}}mouseDown=true;pressed.add('Mouse0');});
addEventListener('mouseup',e=>{if(e.button===2)rightDown=false;else mouseDown=false;});
addEventListener('mousemove',e=>{if(document.pointerLockElement===cv||rightDown){lookDX+=e.movementX;lookDY+=e.movementY;}});
const touchUI=document.getElementById('touch'),stickEl=document.getElementById('stick'),knob=document.getElementById('knob');
let tStick=null,tLook=null,tjx=0,tjy=0,tAtk=false,tRun=false;const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;
touchUI.addEventListener('touchstart',e=>{initAudio();for(const t of e.changedTouches){if(t.target.tagName==='BUTTON')continue;
  if(t.clientX<innerWidth*0.45&&!tStick){tStick={id:t.identifier,x:t.clientX,y:t.clientY};stickEl.style.display='block';stickEl.style.left=(t.clientX-55)+'px';stickEl.style.top=(t.clientY-55)+'px';}else if(!tLook)tLook={id:t.identifier,x:t.clientX,y:t.clientY};}e.preventDefault();},{passive:false});
touchUI.addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(tStick&&t.identifier===tStick.id){const dx=clamp(t.clientX-tStick.x,-50,50),dy=clamp(t.clientY-tStick.y,-50,50);tjx=dx/50;tjy=-dy/50;knob.style.left=(35+dx)+'px';knob.style.top=(35+dy)+'px';}
  if(tLook&&t.identifier===tLook.id){lookDX+=(t.clientX-tLook.x)*1.6;lookDY+=(t.clientY-tLook.y)*1.6;tLook.x=t.clientX;tLook.y=t.clientY;}}e.preventDefault();},{passive:false});
const tEnd=e=>{for(const t of e.changedTouches){if(tStick&&t.identifier===tStick.id){tStick=null;tjx=tjy=0;stickEl.style.display='none';knob.style.left=knob.style.top='35px';}if(tLook&&t.identifier===tLook.id)tLook=null;}};
touchUI.addEventListener('touchend',tEnd);touchUI.addEventListener('touchcancel',tEnd);
const tbtn=(id,down,up)=>{const b=document.getElementById(id);b.addEventListener('touchstart',e=>{e.preventDefault();e.stopPropagation();initAudio();down();},{passive:false});if(up)b.addEventListener('touchend',e=>{e.preventDefault();up();});};
tbtn('t_atk',()=>{tAtk=true;pressed.add('Mouse0');},()=>{tAtk=false;});tbtn('t_run',()=>{tRun=!tRun;document.getElementById('t_run').style.background=tRun?'rgba(255,216,74,.4)':'';});
tbtn('t_use',()=>pressed.add('KeyE'));tbtn('t_wpn',()=>pressed.add('KeyQ'));tbtn('t_light',()=>pressed.add('KeyF'));tbtn('t_menu',()=>pressed.add('KeyM'));tbtn('t_inv',()=>pressed.add('KeyI'));tbtn('t_rel',()=>pressed.add('KeyR'));
tbtn('t_up',()=>pressed.add('ArrowUp'));tbtn('t_down',()=>pressed.add('ArrowDown'));tbtn('t_left',()=>pressed.add('ArrowLeft'));tbtn('t_right',()=>pressed.add('ArrowRight'));tbtn('t_ok',()=>pressed.add('Enter'));tbtn('t_back',()=>pressed.add('Backspace'));
let padL=null,padR=null,srcL=null,srcR=null;const prevB={},BS={};const IN={};
function edge(name,now){const was=prevB[name];prevB[name]=now;return now&&!was;}
function press(name,down,dt){const s=BS[name]||(BS[name]={d:false,t:0,f:false});let ev=null;if(down){if(!s.d){s.d=true;s.t=0;s.f=false;}else{s.t+=dt;if(!s.f&&s.t>0.5){s.f=true;ev='hold';}}}else if(s.d){s.d=false;if(!s.f)ev='tap';}return ev;}
function readInput(dt){Object.assign(IN,{mx:0,my:0,sprint:false,attack:false,attackP:false,use:false,weapon:false,eject:false,light:false,pee:false,inv:false,menu:false,map:false,status:false,crouch:false,reload:false,hud:false,recenter:false,
    back:false,up:false,down:false,left:false,right:false,ok:false,gas:0,brake:0,steer:0,snap:0,turn:0,lgDown:false,lgHeld:false});
  const pk=c=>pressed.has(c);
  if(keys.KeyW)IN.my+=1;if(keys.KeyS)IN.my-=1;if(keys.KeyA)IN.mx-=1;if(keys.KeyD)IN.mx+=1;IN.my+=tjy;IN.mx+=tjx;
  IN.sprint=!!keys.ShiftLeft||!!keys.ShiftRight||tRun;IN.attack=mouseDown||tAtk;IN.attackP=pk('Mouse0');IN.use=pk('KeyE');IN.weapon=pk('KeyQ');IN.light=pk('KeyF');IN.pee=pk('KeyP');
  IN.inv=pk('KeyI');IN.menu=pk('KeyM')||pk('Tab');IN.map=pk('KeyN');IN.status=pk('KeyH');IN.crouch=pk('KeyC');IN.recenter=pk('KeyV');IN.reload=pk('KeyR');
  IN.up=pk('ArrowUp');IN.down=pk('ArrowDown');IN.left=pk('ArrowLeft');IN.right=pk('ArrowRight');IN.ok=pk('Enter')||pk('Space');IN.back=pk('Backspace')||pk('Escape');
  IN.gas=Math.max(0,IN.my);IN.brake=Math.max(0,-IN.my);IN.steer=-IN.mx;pressed.clear();
  padL=padR=srcL=srcR=null;const ses=renderer.xr.getSession();
  if(ses)for(const s of ses.inputSources){if(!s.gamepad)continue;if(s.handedness==='left'){padL=s.gamepad;srcL=s;}else if(s.handedness==='right'){padR=s.gamepad;srcR=s;}}
  const ax=(g,i)=>g&&g.axes.length>i?g.axes[i]:0;const bt=(g,i)=>!!(g&&g.buttons[i]&&g.buttons[i].pressed);const bv=(g,i)=>g&&g.buttons[i]?g.buttons[i].value:0;
  if(padL||padR){const lx=ax(padL,2)||ax(padL,0),ly=ax(padL,3)||ax(padL,1),rx=ax(padR,2)||ax(padR,0);const dz=v=>Math.abs(v)<0.15?0:v;
    if(!panel){IN.mx+=dz(lx);IN.my+=-dz(ly);}IN.sprint=IN.sprint||bv(padL,0)>0.5;IN.attack=IN.attack||bt(padR,0);
    const trig=edge('rt',bt(padR,0));if(panel)IN.ok=IN.ok||trig;else IN.attackP=IN.attackP||trig;IN.use=IN.use||edge('rg',bt(padR,1));IN.rgHeld=bt(padR,1);
    const lg=bt(padL,1);IN.lgDown=edge('lg',lg);IN.lgHeld=lg;
    const a=press('A',bt(padR,4),dt),b=press('B',bt(padR,5),dt),x=press('X',bt(padL,4),dt),y=press('Y',bt(padL,5),dt);
    if(panel){if(x==='tap'||b==='tap')IN.back=true;}
    else{if(a==='tap')IN.weapon=true;if(a==='hold')IN.eject=true;if(b==='tap')IN.light=true;if(b==='hold')IN.pee=true;if(x==='tap')IN.inv=true;if(x==='hold')IN.menu=true;if(y==='tap')IN.map=true;if(y==='hold')IN.status=true;}
    if(edge('rs',bt(padR,3)))IN.crouch=true;{const ls=press('LS',bt(padL,3),dt);if(ls==='tap')IN.hud=true;if(ls==='hold')IN.recenter=true;}
    IN.up=IN.up||edge('lsu',ly<-0.6);IN.down=IN.down||edge('lsd',ly>0.6);IN.left=IN.left||edge('lsl',lx<-0.6);IN.right=IN.right||edge('lsr',lx>0.6);
    if(S.turn==='smooth'){IN.turn=Math.abs(rx)>0.18?rx:0;}else{if(edge('snapR',rx>0.7))IN.snap=1;if(edge('snapL',rx<-0.7))IN.snap=-1;}
    IN.gas=Math.max(IN.gas,bv(padR,0));IN.brake=Math.max(IN.brake,bv(padL,0));IN.steer+=-dz(lx);if(panel){IN.mx=0;IN.my=0;IN.gas=0;IN.steer=0;}}
  IN.mx=clamp(IN.mx,-1,1);IN.my=clamp(IN.my,-1,1);IN.steer=clamp(IN.steer,-1,1);}
function haptic(src,i=0.7,ms=50){try{const a=src&&src.gamepad&&src.gamepad.hapticActuators&&src.gamepad.hapticActuators[0];if(a&&a.pulse)a.pulse(i,ms);}catch(e){}}
const grips=[renderer.xr.getControllerGrip(0),renderer.xr.getControllerGrip(1)];const handFactory=new XRHandModelFactory();
grips.forEach((g,i)=>{rig.add(g);g.addEventListener('connected',e=>{const side=e.data.handedness;if(e.data.hand)return;gripBySide[side]=g;const hr=hands[side];if(hr)g.add(hr.handRoot);if(side==='left')g.add(vrFlash,vrFlT);});
  g.addEventListener('disconnected',()=>{for(const s of ['left','right'])if(gripBySide[s]===g)delete gripBySide[s];g.clear();});
  const hand=renderer.xr.getHand(i);try{hand.add(handFactory.createHandModel(hand,'mesh'));}catch(e){}rig.add(hand);});

// =====================================================================
// INTERACCIÓN
// =====================================================================
function nearestCar(r){let best=null,bd=r;for(const c of cars){const d=Math.hypot(c.x-camW.x,c.z-camW.z);if(d<bd){bd=d;best=c;}}return best;}
const ROLEN={leader:'líder',guard:'guardia',cook:'cocinera',medic:'médico',scavenger:'buscador',resident:'superviviente',raider:'saqueador'};
function findInteract(){const p=camW;if(P.inCar)return{type:'exit',text:inVR?'A: bajar del coche · agarra el volante con los grips':'Usar: bajar del coche'};const fy=p.y-1.6;
  let best=null,bd=9;const consider=(d,lim,o)=>{if(d<lim&&d<bd){bd=d;best=o;}};
  for(const l of lootNear(p.x,p.z)){if(l.looted)continue;if(l.y!==undefined&&Math.abs(l.y-fy)>1.6)continue;const d=Math.hypot(l.x-p.x,l.z-p.z);consider(d,l.sub==='bin'?2.6:1.9,{type:'loot',obj:l,text:`Usar: registrar ${l.label}`});}
  for(const f of FOUNTAINS){const d=Math.hypot(f.x-p.x,f.z-p.z);consider(d,1.5,{type:'fountain',obj:f,text:'Usar: beber agua de la fuente'});}
  for(const d of DOORS){const dx=d.hx-p.x,dz=d.hz-p.z;if(dx*dx+dz*dz>9)continue;doorHandleWorld(d,_v);if(Math.abs(_v.y-p.y+0.5)>1.2)continue;const dd=Math.hypot(_v.x-p.x,_v.z-p.z);consider(dd,1.5,{type:'door',obj:d,text:d.locked?'Usar: probar la puerta':(d.slide?(d.off>0.4?'Usar: cerrar la puerta':'Usar: abrir la puerta'):(d.ang>0.3?'Usar: cerrar la puerta':'Usar: abrir la puerta'))});}
  for(const b of BEDS){const d=Math.hypot(b.x-p.x,b.z-p.z);if(Math.abs(b.y-0.5-fy)<1.5)consider(d,1.6,{type:'bed',obj:b,text:'Usar: dormir en la cama'});}
  for(const h of H_){if(!h.active)continue;const d=Math.hypot(h.sim[PELVIS].x-p.x,h.sim[PELVIS].z-p.z);
    if(h.dead&&h.type!=='zombie'&&!h.searched)consider(d,2,{type:'corpse',obj:h,text:'Usar: registrar cadáver'});
    else if(!h.dead&&h.type!=='zombie'&&!hostileToPlayer(h))consider(d,3,{type:'talk',obj:h,text:`Usar: hablar con ${h.name}${h.role?' ('+ROLEN[h.role]+')':''}`});}
  if(!best){let bm=null,bmd=1.6;for(const m of MOTOS){if(m.taken)continue;const d=Math.hypot(m.x-p.x,m.z-p.z);if(d<bmd){bmd=d;bm=m;}}if(bm)return bm.fallen?{type:'moto',obj:bm,text:'Usar: levantar la moto'}:{type:'moto',obj:bm,text:bm.ok?'Usar: subir a la moto':'Usar: probar la moto'};}
  const car=nearestCar(3.4);if(car&&!best){const lx=(camW.x-car.x)*Math.sin(car.yaw)+(camW.z-car.z)*Math.cos(car.yaw);
    if(lx<-1.6&&!car.searched)return{type:'trunk',obj:car,text:'Usar: registrar maletero'};return{type:'car',obj:car,text:`Usar: subir al coche (gasolina ${car.fuel|0}%)`};}
  return best;}
const LOOTG=new Map();function buildLootGrid(){for(const l of LOOT){const k=vk(Math.floor(l.x/VCG),Math.floor(l.z/VCG));let a=LOOTG.get(k);if(!a)LOOTG.set(k,a=[]);a.push(l);}}
function lootNear(x,z){const out=[];const i=Math.floor(x/VCG),j=Math.floor(z/VCG);for(let a=i-1;a<=i+1;a++)for(let b=j-1;b<=j+1;b++){const L=LOOTG.get(vk(a,b));if(L)out.push(...L);}return out;}
function doInteract(){const it=findInteract();if(!it)return;
  if(it.type==='loot'){const l=it.obj;l.looted=true;lootRoll(l.sub);for(const r of l.refs)hideInst(r);}
  else if(it.type==='fountain'){P.water=Math.min(100,P.water+35);P.bladder=Math.min(100,P.bladder+10);sfx('drink');if(Math.random()<0.06&&S.spoil){P.sick=Math.min(100,P.sick+20);toast('El agua sabía rara…');}else toast('Bebes agua fresca');}
  else if(it.type==='door'){const d=it.obj;if(inVR&&gripBySide.right&&!d.locked)return;if(d.locked){sfx('rattle');toast('Está cerrada con llave',1.5);}else if(d.slide){d.off=d.off>0.4?0:d.maxOff*0.9;applyDoor(d);sfx('thud',0.4);}else{d.target=d.ang>0.3?0:Math.min(d.maxA,1.55);sfx('click');}}
  else if(it.type==='bed')doSleep(true);
  else if(it.type==='corpse'){it.obj.searched=true;lootRoll('corpse');}
  else if(it.type==='trunk'){it.obj.searched=true;lootRoll('trunk');}
  else if(it.type==='talk')talkTo(it.obj);
  else if(it.type==='moto'){const m=it.obj;if(m.fallen){m.fallen=false;const L=INST[m.model].lists.get(m.ref[1]);const t=L[m.ref[2]];t[11]=0;t[1]=m.y;const im=INST[m.model].byKey[m.ref[1]];if(im){_m.compose(_p.set(t[0],t[1],t[2]),_q.setFromEuler(_eu2.set(0,t[3],0,'YXZ')),_s.set(1,1,1));im.setMatrixAt(m.ref[2],_m);im.instanceMatrix.needsUpdate=true;}sfx('thud');toast(m.ok?'Levantas la moto. Parece que arranca.':'Levantas la moto. No arranca.');return;}
    if(!m.ok){sfx('click');toast('No arranca: sin batería');return;}hideInst(m.ref);m.taken=true;const c=makeMoto(m);P.inCar=c;P.carYaw=0;P.carGun=false;toast(inVR?'Subes a la moto · agarra el manillar con los dos grips · gatillo: gas':'Subes a la moto');}
  else if(it.type==='car'){if(it.obj.flip){toast('Está volcado');return;}P.inCar=it.obj;P.carYaw=0;P.carGun=false;carInterior(it.obj);toast(inVR?'Subes al coche · palanca con el grip derecho · B: modo disparo':'Subes al coche');}
  else if(it.type==='exit')exitCar();}
function talkTo(h){const b=h.base,day=dayNum();
  if(!b){toast(`${h.name}: «${pick(['Cuidado, en el Castell de Montjuïc hay bandidos.','De noche no ven bien, pero oyen muy bien.','En las comisarías de los Mossos aún quedan balas.','Las farmacias tienen antibióticos, si llegas.','El Mercat del Raval es seguro. Pregunta por el líder.'])}»`,5);return;}
  const r=h.role;h.talkT=clockT;
  if(r==='leader'){if(b.lastHelpDay===day)return toast(`${h.name}: «Ya te hemos ayudado hoy. Vuelve mañana.»`,4);b.lastHelpDay=day;for(const [id,n] of [['bocata',1],['agua',2],['vendas',1],['balas',8],['papel',1]])addItem(id,n,'gift');P.mood=Math.min(100,P.mood+10);sfx('loot');toast(`${h.name} (${b.name}): «Toma provisiones. Aquí puedes dormir tranquilo.»`,5);}
  else if(r==='medic'){if(b.lastMedDay===day)return toast(`${h.name}: «Hoy ya no me quedan vendas para ti.»`,4);b.lastMedDay=day;P.hp=Math.min(100,P.hp+40);P.sick=Math.max(0,P.sick-40);toast(`${h.name} te cura las heridas.`,4);}
  else if(r==='cook'){if(b.lastFoodDay===day)return toast(`${h.name}: «La olla está vacía hasta mañana.»`,4);b.lastFoodDay=day;P.food=Math.min(100,P.food+35);P.mood=Math.min(100,P.mood+6);toast(`${h.name} te sirve un plato de lentejas calientes.`,4);}
  else if(r==='guard')toast(`${h.name}: «${pick(['Mantente alerta, ayer entraron tres por la puerta norte.','Si oyes disparos, no corras hacia ellos.','Los corredores son los peores. Apunta a la cabeza.'])}»`,4);
  else if(r==='scavenger')toast(`${h.name}: «${h.lastLoot?'Vengo de '+h.lastLoot+'. Está casi vacío.':'Ahora salgo a buscar comida por el barrio.'}»`,4);
  else toast(`${h.name}: «${pick(['¿Has visto a mi hermano? Se llama Pere.','Echo de menos el ruido del metro.','Dicen que en Montjuïc hay gente armada.'])}»`,4);}
function exitCar(){const c=P.inCar;if(!c)return;if(Math.abs(c.speed)>3)return toast('Vas demasiado rápido para bajar');P.inCar=null;c.speed=0;headlight.intensity=0;
  const s=Math.sin(c.yaw),co=Math.cos(c.yaw);const pt={x:c.x+co*2.3,z:c.z-s*2.3};collide(pt,0.4,surfY(pt.x,pt.z)+0.2,surfY(pt.x,pt.z)+1.7);rig.position.set(pt.x,surfY(pt.x,pt.z),pt.z);P.feetY=rig.position.y;P.yaw=c.yaw+Math.PI;toast('Bajas del coche');}
// desatascar: si te has quedado bajo el suelo o dentro de algo, vuelves al punto libre más cercano en la acera (o al inicio)
function unstick(){if(P.inCar)exitCar();camera.getWorldPosition(_v);let best=null,bd=1e9;for(const bk of BLOCKS){if(bk.outer)continue;for(const p of bk.cp){const c=centroid(bk.bp);const x=p[0]+(p[0]-c[0])*0.02,z=p[1]+(p[1]-c[1])*0.02;const d=Math.hypot(x-_v.x,z-_v.z);if(d<bd&&!insideVol(x,surfY(x,z)+1,z)){bd=d;best=[x,z];}}}
  P.feetY=undefined;P.hOff=0;P.crouchOff=0;P.crouchToggle=false;if(best){const y=surfY(best[0],best[1]);rig.position.set(best[0]-(_v.x-rig.position.x),y,best[1]-(_v.z-rig.position.z));P.feetY=y;}P.lastSafe.copy(camW);toast('Te recolocas en la calle',1.5);}
// recolocar altura y vista (mantener pulsado el joystick izquierdo, o V)
function recenter(){camera.getWorldPosition(_v);P.feetY=surfY(_v.x,_v.z,_v.y+0.2);P.crouchToggle=false;P.crouchOff=0;P.hOff=inVR?clamp(1.62-camera.position.y,-0.4,1.1):0;P.standEye=1.6;
  if(inVR){camera.getWorldDirection(_v1);const look=Math.atan2(-_v1.x,-_v1.z);P.yaw+=-(look-P.yaw)*0+0;}rig.position.y=P.feetY+(P.hOff||0);toast('Altura y vista recolocadas',1.5);}

// =====================================================================
// IA: zombis y supervivientes con roles
// =====================================================================
const hostileToPlayer=h=>h.type==='zombie'||(h.type==='bandit'&&S.bandits)||h.hostile||h.angry||(h.base&&h.base.angry);
function moveH(h,dx,dz,speed,dt){const l=Math.hypot(dx,dz);if(l<1e-4||speed<=0){h.speed*=0.85;h.vx=h.vz=0;return;}dx/=l;dz/=l;
  if(h.avoidT>0){h.avoidT-=dt;const s=h.avoidS;const tx=-dz*s,tz=dx*s;dx=dx*0.3+tx;dz=dz*0.3+tz;const l2=Math.hypot(dx,dz);dx/=l2;dz/=l2;}
  const ty=Math.atan2(dx,dz);let dy=ty-h.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));h.yaw+=dy*Math.min(1,dt*5);
  const ox=h.x,oz=h.z;h.vx=dx*speed;h.vz=dz*speed;_cp.x=h.x+h.vx*dt;_cp.z=h.z+h.vz*dt;collide(_cp,0.3,h.y+0.3,h.y+1.7);
  for(const c of cars){const ex=_cp.x-c.x,ez=_cp.z-c.z,d=Math.hypot(ex,ez);if(d<c.halfW+0.9&&d>0){_cp.x=c.x+ex/d*(c.halfW+0.9);_cp.z=c.z+ez/d*(c.halfW+0.9);}}
  h.x=_cp.x;h.z=_cp.z;const moved=Math.hypot(h.x-ox,h.z-oz);h.speed=moved/Math.max(dt,1e-3);
  if(moved<speed*dt*0.3){h.stuckT=(h.stuckT||0)+dt;if(h.stuckT>0.8){h.avoidT=R(1.2,2.5);h.avoidS=Math.random()<0.5?1:-1;h.stuckT=0;}}else h.stuckT=0;}
function faceTo(h,x,z,dt){const ty=Math.atan2(x-h.x,z-h.z);let dy=ty-h.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));h.yaw+=dy*Math.min(1,dt*7);}
function zombieAI(h,dt,p){h.think-=dt;
  if(h.think<=0){h.think=0.3+Math.random()*0.25;let det=(nightF>0.5?16:28)*S.zSense;let best=null,bd=1e9;const dp=Math.hypot(h.x-p.x,h.z-p.z);
    const dpl=det*(P.crouch?0.5:1)+(P.light&&nightF>0.5?14:0)+(P.sprinting?8:0)+(P.inCar&&Math.abs(P.inCar.speed)>1?14:0);if(P.alive&&dp<dpl&&Math.abs(p.y-1.6-h.y)<3){best='player';bd=dp;}
    for(const o of H_){if(!o.active||o.dead||o.type==='zombie')continue;const d=Math.hypot(o.x-h.x,o.z-h.z);if(d<det&&d<bd){best=o;bd=d;}}
    if(h.target!==best&&best){if(Math.random()<0.7)zombieSound(volAt(h.x,h.z,35),'groan');}h.target=best;
    if(!best){for(const n of noises){if(Math.hypot(n.x-h.x,n.z-h.z)<n.r*S.zSense){h.goal={x:n.x+R(-4,4),z:n.z+R(-4,4)};break;}}
      if(!h.goal&&!h.meal&&Math.random()<0.1){for(const o of H_){if(o.active&&o.dead&&o.type!=='zombie'&&Math.hypot(o.sim[CHEST].x-h.x,o.sim[CHEST].z-h.z)<18){h.meal=o;break;}}}}}
  let tx,tz;const t=h.target;if(t==='player'){tx=p.x;tz=p.z;}else if(t&&t.active&&!t.dead){tx=t.x;tz=t.z;}else if(t)h.target=null;
  if(h.crawler){h.act='crawl';if(tx!==undefined){const dx=tx-h.x,dz=tz-h.z,d=Math.hypot(dx,dz);if(d>0.8)moveH(h,dx,dz,0.35,dt);else{h.speed=0;h.atk-=dt;if(h.atk<=0){h.atk=1.6;if(t==='player')damagePlayer(5,'zombi',true);}}}else h.speed=0;return;}
  if(h.mode==='phys'&&(h.k<0.6||h.down>0||h.act==='getup')){h.speed*=0.85;return;}
  if(Math.abs(h.gp.limp)>0.6&&h.speed>0.3&&Math.random()<dt*(h.gp.drag?0.12:0.05)){enterPhys(h);knockDown(h,null,R(1.2,2.5));return;}
  h.act='stand';
  if(tx!==undefined){h.meal=null;const dx=tx-h.x,dz=tz-h.z,d=Math.hypot(dx,dz);
    if(d>0.95)moveH(h,dx,dz,(h.runner?3.8:0.95)*h.gp.speedMul*(h.broken.lArm||h.broken.rArm?0.85:1),dt);
    else{h.speed*=0.8;h.vx=h.vz=0;faceTo(h,tx,tz,dt);h.atk-=dt;
      if(h.atk<=0){h.atk=1.3;h.atkAnim=0.45;zombieSound(volAt(h.x,h.z,20),'attack');
        if(t==='player'){if(!(P.inCar&&Math.abs(P.inCar.speed)>2))damagePlayer(8,'zombi',true);}
        else{t.bodyHp-=16;if(t.bodyHp<=0)hitChar(t,'body',1,_imp.set(dx,0.5,dz).normalize().multiplyScalar(3),CHEST,'zombie');else if(!t.target)t.target=h;}}}}
  else if(h.meal&&h.meal.active&&h.meal.dead){const m=h.meal.sim[CHEST];const dx=m.x-h.x,dz=m.z-h.z,d=Math.hypot(dx,dz);if(d>0.9)moveH(h,dx,dz,0.8,dt);else{h.speed=0;faceTo(h,m.x,m.z,dt);h.act='eat';h.eatT+=dt;if(h.eatT>25){h.meal=null;h.eatT=0;}}}
  else if(h.goal){const dx=h.goal.x-h.x,dz=h.goal.z-h.z;if(Math.hypot(dx,dz)<2)h.goal=null;else moveH(h,dx,dz,0.85*h.gp.speedMul,dt);}
  else{h.idle-=dt;if(h.idle<=0){h.idle=R(2,7);h.wd=Math.random()<0.45?null:Math.random()*6.28;}if(h.wd!=null)moveH(h,Math.sin(h.wd),Math.cos(h.wd),0.4*h.gp.speedMul,dt);else{h.speed*=0.9;h.vx=h.vz=0;}}
  h.groanT-=dt;if(h.groanT<=0){h.groanT=R(4,12)*(t?0.5:1);zombieSound(volAt(h.x,h.z,32),'groan');}}
function isNight(){const hr=hourF();return hr>=22||hr<7;}
function survivorAI(h,dt,p){h.think-=dt;const b=h.base;
  if(h.think<=0){h.think=0.4+Math.random()*0.3;let best=null,bd=30;
    for(const o of H_){if(!o.active||o.dead||o.type!=='zombie')continue;const d=Math.hypot(o.x-h.x,o.z-h.z);if(d<bd){bd=d;best=o;}}
    if(P.alive&&hostileToPlayer(h)){const d=Math.hypot(p.x-h.x,p.z-h.z);if(d<34&&d<bd+6){best='player';bd=d;}}
    if(h.act==='sleep'&&best&&bd>10)best=null;h.target=best;}
  if(h.mode==='phys'&&(h.k<0.6||h.down>0||h.act==='getup')){h.speed*=0.85;return;}
  const t=h.target;let tx,tz,tpos=null;
  if(t==='player'){tx=p.x;tz=p.z;tpos=_e2.set(p.x,p.y-0.35,p.z);}else if(t&&t.active&&!t.dead){tx=t.x;tz=t.z;tpos=t.sim[CHEST];}else h.target=null;
  if(tpos){h.act='stand';const dx=tx-h.x,dz=tz-h.z,d=Math.hypot(dx,dz);
    if(!h.armed){h.aim=0;if(b)moveH(h,b.x-h.x,b.z-h.z,3,dt);else moveH(h,-dx,-dz,3,dt);return;}
    h.aim=1;if(d>20&&h.role!=='guard')moveH(h,dx,dz,2.8,dt);else if(d<4&&t!=='player')moveH(h,-dx,-dz,2.5,dt);else{h.speed*=0.8;h.vx=h.vz=0;faceTo(h,tx,tz,dt);}
    h.shootT-=dt;if(h.shootT<=0){h.shootT=R(0.9,1.9);npcFire(h,t,tpos,d);}return;}
  h.aim=0;
  // rutinas según el rol y la hora
  if(!b){wanderAI(h,dt);return;}
  const night=isNight();const idx=b.members.indexOf(h);
  let goal=null,act='stand',face=null;
  if(night&&!(h.role==='guard'&&idx%2===0)){const bed=b.beds[idx%Math.max(1,b.beds.length)];if(bed){goal=bed;act='sleep';}}
  else if(h.role==='guard'){const post=b.posts[idx%b.posts.length];goal=post;act='aim';face=[post[0]*2-b.x,post[1]*2-b.z];}
  else if(h.role==='cook'){goal=[b.fire[0]+1.2,b.fire[1]];act='squat';face=b.fire;}
  else if(h.role==='leader'){goal=h.lgoal||(h.lgoal=[b.fire[0]+R(-3,3),b.fire[1]+R(2,4)]);act=(clockT-(h.talkT||-99))<4?'stand':'stand';face=[camW.x,camW.z];}
  else if(h.role==='medic'){goal=b.beds[0]||b.fire;act='stand';}
  else if(h.role==='scavenger'||h.role==='raider'){scavAI(h,dt,b);return;}
  else{if(!h.rgoal||h.actT>R(12,30)){h.rgoal=[b.x+R(-b.r*0.6,b.r*0.6),b.z+R(-b.r*0.6,b.r*0.6)];h.actT=0;h.ract=Math.random()<0.4?'sit':'stand';}goal=h.rgoal;act=h.ract;}
  if(goal){const dx=goal[0]-h.x,dz=goal[1]-h.z,d=Math.hypot(dx,dz);if(d>0.8){h.act='stand';moveH(h,dx,dz,night?1.0:1.2,dt);}else{h.speed*=0.8;h.vx=h.vz=0;h.act=act;if(face)faceTo(h,face[0],face[1],dt);}}}
function wanderAI(h,dt){if(!h.goal||Math.hypot(h.goal.x-h.x,h.goal.z-h.z)<1.5){h.idle-=dt;h.speed*=0.9;if(h.idle<=0){h.idle=R(2,8);h.goal={x:clamp(h.x+R(-60,60),XMIN+20,XMAX-20),z:clamp(h.z+R(-60,60),ZMIN+20,340)};}}
  else{h.act='stand';moveH(h,h.goal.x-h.x,h.goal.z-h.z,1.4,dt);}}
// buscadores: salen de día a registrar tiendas cercanas y vuelven
function scavAI(h,dt,b){const night=isNight();
  if(!h.task){if(night){const bed=b.beds[0];h.act='stand';if(bed){const dx=bed[0]-h.x,dz=bed[1]-h.z;if(Math.hypot(dx,dz)>1)moveH(h,dx,dz,1.2,dt);else{h.act='sleep';h.speed=0;}}return;}
    h.waitT=(h.waitT||R(10,40))-dt;if(h.waitT>0){h.act='stand';h.speed*=0.9;return;}
    const cands=LOOT.filter(l=>!l.looted&&l.kind==='cont'&&l.sub!=='bin'&&l.sub!=='base_caja'&&Math.hypot(l.x-b.x,l.z-b.z)<170&&Math.hypot(l.x-b.x,l.z-b.z)>b.r+5);
    if(!cands.length){h.waitT=60;return;}const l=pick(cands);h.task={l,phase:'go',t:0};}
  const T=h.task;T.t+=dt;
  if(T.phase==='go'){const dx=T.l.x-h.x,dz=T.l.z-h.z,d=Math.hypot(dx,dz);h.act='stand';if(d>1.4)moveH(h,dx,dz,1.5,dt);else{T.phase='loot';T.t=0;}if(T.t>180){T.phase='back';T.t=0;}}
  else if(T.phase==='loot'){h.speed=0;h.act='loot';faceTo(h,T.l.x,T.l.z,dt);if(T.t>6){if(!T.l.looted){T.l.looted=true;for(const r of T.l.refs)hideInst(r);}const s=SHOPS.find(s=>Math.hypot(s.x-T.l.x,s.z-T.l.z)<20);h.lastLoot=s?s.name:'unas casas';T.phase='back';T.t=0;}}
  else{const dx=b.x-h.x,dz=b.z-h.z,d=Math.hypot(dx,dz);h.act='stand';if(d>3)moveH(h,dx,dz,1.5,dt);else{h.task=null;h.waitT=R(60,180);}if(T.t>200){h.task=null;}}}
function npcFire(h,t,tpos,d){const pts=h.sim;_o2.copy(pts[CHEST]);_o2.y+=0.08;_d2.subVectors(tpos,_o2).normalize();_o2.addScaledVector(_d2,0.45);const dist=_o2.distanceTo(tpos);
  if(rayWorld(_o2,_d2,dist)<dist-0.5)return;let acc=clamp(0.9-d*0.02,0.22,0.9)*(nightF>0.5?0.7:1);if(t==='player')acc*=P.crouch?0.5:0.7;
  sfx('shot',volAt(h.x,h.z,90));makeNoise(h.x,h.z,55);const hit=Math.random()<acc;_e2.copy(tpos);if(!hit){_e2.x+=R(-1.5,1.5);_e2.y+=R(-0.5,1);_e2.z+=R(-1.5,1.5);}tracer(_o2,_e2);
  if(hit){if(t==='player')damagePlayer(9,h.type==='bandit'?'bandidos':'disparo');
    else{const r=Math.random();const part=r<0.22?'head':r<0.8?'body':pick(['lArm','rArm','lLeg','rLeg']);const pi=part==='head'?HEAD:part==='body'?CHEST:LIMB_PTS[part][0];
      hitChar(t,part,part==='head'?999:35,_imp.copy(_d2).multiplyScalar(4.5),pi,'npc',_e2,_d2);spray(_e2,_d2,6);}}}
function inBaseZone(x,z,r=45){return BASES.some(b=>Math.hypot(b.x-x,b.z-z)<r);}
function spawnZombieNear(p,minR,maxR){for(let tries=0;tries<14;tries++){const a=Math.random()*6.28,r=R(minR,maxR);const x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r;
  if(x<XMIN+5||x>XMAX-5||z<ZMIN+5||z>350||inBaseZone(x,z))continue;const y=surfY(x,z);const c={x,z};if(collide(c,0.5,y+0.3,y+1.7))continue;if(insideVol(x,y+1,z))continue;
  return spawnChar('zombie',x,z,{runner:Math.random()*100<S.runners});}return null;}
let popT=0;
function managePop(p,first){popT-=1;if(popT>0&&!first)return;popT=120;let n=0;
  for(const h of H_){if(!h.active||h.type!=='zombie')continue;const d=Math.hypot(h.x-p.x,h.z-p.z);if(d>210&&h.target!=='player'){despawn(h);continue;}if(!h.dead)n++;}
  let need=S.zombies-n,budget=first?S.zombies:3;while(need>0&&budget>0){if(!spawnZombieNear(p,first?25:70,first?140:150))break;need--;budget--;}
  if(n>S.zombies+5)for(const h of H_){if(n<=S.zombies)break;if(h.active&&h.type==='zombie'&&!h.dead&&Math.hypot(h.x-p.x,h.z-p.z)>60){despawn(h);n--;}}}
function populateNPCs(){for(const b of BASES){b.members=[];const roles=b.type==='good'?['leader','guard','guard','cook','medic','scavenger','scavenger','resident']:['leader','guard','guard','raider','raider','resident','resident'];
    for(let k=0;k<Math.min(b.n+1,roles.length);k++){const x=b.x+R(-b.r*0.5,b.r*0.5),z=b.z+R(-b.r*0.5,b.r*0.5);const h=spawnChar(b.type,x,z,{base:b,role:roles[k],armed:b.type==='bandit'||['leader','guard','scavenger'].includes(roles[k])});
      if(h){h.headHp=70;h.bodyHp=140;b.members.push(h);}}}
  for(let k=0;k<6;k++){let x,z,tries=0;do{x=R(XMIN+30,XMAX-30);z=R(ZMIN+30,330);tries++;}while((inBaseZone(x,z,60)||collide({x,z},0.5,surfY(x,z)+0.3,surfY(x,z)+1.7))&&tries<40);spawnChar('wanderer',x,z,{hostile:Math.random()<0.4});}}

// =====================================================================
// COCHES
// =====================================================================
// ---------- coche: carrocería continua (secciones a lo largo del coche), lunas de verdad e interior ----------
// perfiles (z del maletero al morro): bajos, línea de cintura, techo, anchura y anchura del techo
const CARZ=[-2.13,-2.06,-1.9,-1.72,-1.4,-1.0,-0.5,-0.05,0.3,0.62,0.86,1.2,1.6,1.9,2.06,2.13];
const CARP={yt:[0.86,1.0,1.3,1.42,1.45,1.46,1.46,1.43,1.27,1.07,0.93,0.89,0.84,0.76,0.66,0.58],yb:[0.66,0.8,0.92,0.97,0.98,0.97,0.95,0.93,0.92,0.91,0.9,0.88,0.84,0.76,0.66,0.58],
  w:[0.7,0.82,0.86,0.87,0.875,0.875,0.875,0.875,0.875,0.87,0.865,0.86,0.84,0.8,0.72,0.62],wr:[0.6,0.66,0.66,0.67,0.68,0.68,0.68,0.68,0.66,0.62,0.6,0.6,0.6,0.6,0.6,0.55]};
const WB=1.3,WR=0.31;// semibatalla y radio de rueda
const CARGEO=(()=>{const NZ=48,z0=CARZ[0],z1=CARZ[CARZ.length-1];const lerpP=(arr,z)=>{for(let i=0;i<CARZ.length-1;i++)if(z<=CARZ[i+1]){const t=(z-CARZ[i])/(CARZ[i+1]-CARZ[i]);const u=t*t*(3-2*t)*0.35+t*0.65;return arr[i]+(arr[i+1]-arr[i])*u;}return arr[arr.length-1];};
  const y0=z=>{let y=0.27;for(const zc of [-WB,WB]){const d=z-zc;if(Math.abs(d)<0.44)y=Math.max(y,0.37+Math.sqrt(0.44*0.44-d*d));}if(Math.abs(z)>1.95)y=Math.max(y,0.27+(Math.abs(z)-1.95)*0.6);return y;};
  // media sección: [x,y,zona] de abajo-centro a arriba-centro; zona 0 = chapa, 1 = luna lateral, 2 = techo/luna delantera-trasera
  const half=(z)=>{const yt=lerpP(CARP.yt,z),yb=Math.min(lerpP(CARP.yb,z),yt),w=lerpP(CARP.w,z),wr=Math.min(lerpP(CARP.wr,z),w),b=y0(z);const P=[];
    P.push([0,b,0],[w*0.8,b,0],[w*0.96,b+0.05,0],[w,b+0.16,0],[w*1.005,(b+yb)*0.5,0],[w,yb-0.06,0],[w*0.985,yb,0]);
    const gh=yt-yb;P.push([w*0.975,yb+0.005,1],[wr+(w-wr)*0.55,yb+gh*0.45,1],[wr+(w-wr)*0.12,yb+gh*0.9,1],[wr*0.94,yt-0.012,2],[wr*0.6,yt,2],[0,yt+0.005,2]);return P;};
  const NP=13;const pos=[],uv=[],idx=[],zone=[];
  for(let i=0;i<=NZ;i++){const z=z0+(z1-z0)*i/NZ;const H=half(z);for(const sg of [1,-1])for(let jj=0;jj<NP;jj++){const p=H[jj];pos.push(p[0]*sg,p[1],z);uv.push(i/NZ,jj/(NP-1));}}
  const vid=(i,sg,jj)=>i*NP*2+(sg>0?0:NP)+jj;
  // grupo por cara: 0 chapa, 1 cristal, 2 negro (marcos)
  const groups=[[],[],[]];const zw0=0.86,zw1=-0.05,zr0=-1.72,zr1=-2.06;
  for(let i=0;i<NZ;i++){const zm=z0+(z1-z0)*(i+0.5)/NZ;for(const sg of [1,-1])for(let jj=0;jj<NP-1;jj++){
      let g=0;if(jj>=7&&jj<=9){// ventanillas laterales con pilares A, B y C
        const inGlass=zm<zw0-0.05&&zm>zr0+0.02;const pillar=Math.abs(zm-(-0.62))<0.07||(zm<zw0&&zm>zw0-0.1)||(zm>zr0&&zm<zr0+0.12);g=inGlass?(pillar?2:1):0;if(jj===7&&inGlass)g=2;}
      else if(jj>=10){if((zm<zw0-0.02&&zm>zw1+0.04)||(zm<zr0-0.03&&zm>zr1+0.03))g=1;}// parabrisas y luneta
      const a=vid(i,sg,jj),b=vid(i+1,sg,jj),c=vid(i+1,sg,jj+1),d=vid(i,sg,jj+1);const f=sg>0?[a,d,c,a,c,b]:[a,b,c,a,c,d];groups[g].push(...f);}}
  // tapas delantera y trasera
  for(const [i,fl] of [[0,true],[NZ,false]]){for(let jj=0;jj<NP-1;jj++){for(const sg of [1,-1]){const a=vid(i,sg,jj),b=vid(i,sg,jj+1),c=vid(i,1,0);const f=(sg>0)!==fl?[a,b,c]:[a,c,b];groups[0].push(...f);}}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  const all=[];groups.forEach((g,n)=>{geo.addGroup(all.length,g.length,n);all.push(...g);});geo.setIndex(all);geo.computeVertexNormals();
  // detalles exteriores y habitáculo (color por vértice)
  const P=[];const B=(w,h,d,x,y,z,c,rx=0,ry=0,rz=0)=>P.push([bx(w,h,d,x,y,z,rx,ry,rz),c]);const C=(r0,r1,h,x,y,z,c,seg=12,rx=0,rz=0)=>P.push([cy(r0,r1,h,x,y,z,seg,rx,rz),c]);
  // paragolpes, rejilla, faros, pilotos, matrículas (blancas con franja azul), retrovisores, manetas, bajos
  B(1.5,0.2,0.1,0,0.42,2.1,0x1b1c1e,0.1);B(1.5,0.22,0.1,0,0.42,-2.1,0x1b1c1e,-0.1);B(0.86,0.16,0.04,0,0.6,2.12,0x0e0f10);
  for(const sx of [1,-1]){B(0.34,0.1,0.08,sx*0.55,0.72,2.03,0xe8eef2,0.25,sx*0.25);B(0.3,0.1,0.06,sx*0.6,0.86,-2.05,0x8a0d10,-0.3,-sx*0.25);B(0.12,0.08,0.06,sx*0.68,0.76,-2.08,0xd85a10);
    B(0.04,0.09,0.17,sx*0.95,1.0,0.66,0x15161a);B(0.06,0.11,0.2,sx*0.93,1.0,0.7,0x15161a);B(0.03,0.025,0.13,sx*0.885,0.88,-0.15,0x2a2c30);B(0.03,0.025,0.13,sx*0.885,0.88,-1.05,0x2a2c30);
    B(0.04,0.08,2.0,sx*0.875,0.31,0,0x18191b);}
  for(const zc of [-WB,WB]){B(1.36,0.46,0.9,0,0.6,zc,0x0b0b0c);}
  B(0.52,0.12,0.01,0,0.47,2.165,0xf2f2f0);B(0.04,0.12,0.012,-0.24,0.47,2.17,0x1f45a8);B(0.52,0.12,0.01,0,0.62,-2.16,0xf2f2f0);B(0.04,0.12,0.012,0.24,0.62,-2.165,0x1f45a8);
  // salpicadero, consola, asientos de tela, volante aparte
  B(1.6,0.2,0.42,0,0.88,0.62,0x1c1d20,-0.25);B(1.55,0.08,0.3,0,0.99,0.52,0x26272a,-0.1);B(0.36,0.16,0.04,0.38,0.97,0.42,0x0c0c0d,-0.5);B(0.24,0.16,0.03,0,1.0,0.5,0x101820,-0.4);
  B(0.24,0.36,0.62,0,0.5,0.1,0x1e1f22);B(0.05,0.09,0.05,0,0.72,0.05,0x111111);
  B(0.38,0.13,0.11,0.38,1.04,0.52,0x111214);
  const S=[];const SB=(w,h,d,x,y,z,rx=0)=>S.push([bx(w,h,d,x,y,z,rx),0x55585e]);
  for(const sx of [0.38,-0.38]){SB(0.5,0.12,0.52,sx,0.5,-0.2);SB(0.5,0.62,0.13,sx,0.84,-0.5,-0.18);SB(0.28,0.18,0.1,sx,1.21,-0.58,-0.18);SB(0.08,0.16,0.5,sx+0.22,0.6,-0.2);SB(0.08,0.16,0.5,sx-0.22,0.6,-0.2);}
  SB(1.45,0.14,0.5,0,0.52,-1.15);B(1.62,0.04,1.1,0,0.29,0.35,0x141416);B(1.5,0.5,0.04,0,0.55,0.86,0x141416);SB(1.45,0.55,0.12,0,0.82,-1.42,-0.2);B(1.62,0.04,1.2,0,0.29,-0.4,0x141416);
  for(const sx of [1,-1]){B(0.05,0.36,2.0,sx*0.83,0.72,-0.35,0x2a2b2f);B(0.08,0.06,1.6,sx*0.81,0.86,-0.35,0x3a3b40);}
  const trim=mkG(P);const seats=mkG(S);
  // volante: aro, tres radios y buje (gira alrededor de su eje)
  // volante moderno (como el de un Ibiza o un Mégane): aro grueso de cuero, airbag central redondeado, tres radios con mandos y costura
  const ring=new THREE.TorusGeometry(0.185,0.024,10,40);ring.scale(1,1,1.15);const stitch=new THREE.TorusGeometry(0.185,0.0245,4,40,Math.PI*0.9);stitch.rotateZ(Math.PI*0.05);stitch.scale(1,1,0.4);
  const swHub=ell(0.075,0.062,0.032,0,-0.008,-0.03,16);const hubRim=new THREE.TorusGeometry(0.07,0.008,6,24);hubRim.scale(1.07,0.88,1);hubRim.translate(0,-0.008,-0.012);
  const spL=bx(0.11,0.035,0.022,-0.115,-0.012,-0.012),spR=bx(0.11,0.035,0.022,0.115,-0.012,-0.012),spB=bx(0.045,0.1,0.022,0,-0.12,-0.012);
  const pads=[];for(const sx of [-1,1])for(const [dx,dy] of [[0,0.012],[0.022,0.012],[0,-0.012],[0.022,-0.012]])pads.push([cy(0.006,0.006,0.006,sx*(0.105+dx),-0.012+dy,0.0,8,Math.PI/2),0x2a2a2c]);
  const sw=mkG([[ring,0x161617],[stitch,0x5a1a1a],[swHub,0x1b1b1d],[hubRim,0x8a8e92],[spL,0x202022],[spR,0x202022],[spB,0x202022],[bx(0.03,0.018,0.004,0,-0.0,0.024),0xb8bcc0],...pads,[bx(0.035,0.012,0.022,0,-0.165,-0.012),0x8a8e92]]);
  const col=mkG([[cy(0.035,0.045,0.16,0,0,0,12,Math.PI/2),0x18191b],[bx(0.11,0.07,0.1,0,0,0.05),0x1d1e20],[bx(0.09,0.012,0.012,-0.1,0.01,0.03),0x2a2a2c],[bx(0.09,0.012,0.012,0.1,0.01,0.03),0x2a2a2c]]);
  // rueda: neumático con perfil, llanta de radios
  const tire=new THREE.TorusGeometry(WR-0.07,0.075,8,22);tire.rotateY(Math.PI/2);tire.scale(1.35,1,1);
  const rim=[];for(let k=0;k<5;k++){const g=bx(0.03,0.18,0.04,0,0.1,0);g.rotateX(k*Math.PI*2/5);g.translate(0.09,0,0);rim.push([g,0xb5b9bd]);}
  const disc=new THREE.CylinderGeometry(0.205,0.205,0.04,18);disc.rotateZ(Math.PI/2);disc.translate(0.06,0,0);const hub=new THREE.CylinderGeometry(0.05,0.05,0.07,10);hub.rotateZ(Math.PI/2);hub.translate(0.1,0,0);
  const wheel=mkG([[tire,0x141414],[disc,0x2a2c2e],...rim,[hub,0xc8ccd0]]);
  return{body:geo,trim,sw,col,wheel,seats};})();
const seatMat=photoMat('fabric',{color:0x6a6e76,roughness:0.95,ns:0.7});
const trimMat=pbr(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.6,metalness:0.2}));const carGlassMat=pbr(new THREE.MeshStandardMaterial({color:0x1a2228,roughness:0.05,metalness:0.7,transparent:true,opacity:0.5,side:THREE.FrontSide,envMapIntensity:1.6,depthWrite:false}));
const carBlackMat=pbr(new THREE.MeshStandardMaterial({color:0x0d0e10,roughness:0.35,metalness:0.3,side:THREE.DoubleSide}));
// cuadro de instrumentos: velocímetro y cuentarrevoluciones
const texGauges=cTex(512,192,(g,w,h)=>{g.fillStyle='#07080a';g.fillRect(0,0,w,h);for(const [cx,mx,lab] of [[128,220,'km/h'],[384,8,'x1000']]){g.strokeStyle='#3a3d42';g.lineWidth=6;g.beginPath();g.arc(cx,100,82,0,7);g.stroke();
  g.fillStyle='#e8e8e8';g.font='bold 15px Arial';g.textAlign='center';g.textBaseline='middle';for(let k=0;k<=10;k++){const a=Math.PI*0.75+k/10*Math.PI*1.5;g.strokeStyle=k>7&&mx<20?'#d03030':'#d8d8d8';g.lineWidth=3;g.beginPath();g.moveTo(cx+Math.cos(a)*70,100+Math.sin(a)*70);g.lineTo(cx+Math.cos(a)*80,100+Math.sin(a)*80);g.stroke();
    if(k%2===0)g.fillText(String(Math.round(mx*k/10)),cx+Math.cos(a)*56,100+Math.sin(a)*56);}g.font='12px Arial';g.fillText(lab,cx,140);g.strokeStyle='#ff5a1a';g.lineWidth=4;g.beginPath();g.moveTo(cx,100);g.lineTo(cx+Math.cos(Math.PI*0.8)*62,100+Math.sin(Math.PI*0.8)*62);g.stroke();}},{});
const gaugeMat=new THREE.MeshBasicMaterial({map:texGauges});
const wheelMat=pbr(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.75,metalness:0.3}));const cars=[];
const CARCOL=[0xe9e9e6,0xe9e9e6,0xa9adb1,0xa9adb1,0x5d6266,0x111214,0x111214,0x1c2b4a,0x8c1218,0x2d3f2f,0xcfc6b0];
// carrocería: color de serie y años de abandono encima (polvo en las superficies de arriba, mugre, óxido abajo y en los bordes)
function wearMat(base,col,seed,wreck){const m=base.clone();m.color.set(col);m.roughness=0.5;m.metalness=0.25;m.envMapIntensity=0.9;
  m.onBeforeCompile=sh=>{sh.uniforms.uSeed={value:seed};sh.uniforms.uWr={value:wreck};
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCP;varying vec3 vCN;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCP=position;vCN=normal;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vCP;varying vec3 vCN;uniform float uSeed,uWr;\n'+NOISE_GLSL)
      .replace('#include <map_fragment>',`#include <map_fragment>
        vec3 p=vCP*3.0+uSeed;float n1=zn(p*1.3),n2=zn(p*4.0+7.0),n3=zn(p*11.0);float l=dot(diffuseColor.rgb,vec3(0.3,0.59,0.11));
        float paint=step(0.5,l);// solo la chapa pintada (el texto blanco de la textura)
        vec3 c=diffuseColor.rgb;
        // mugre general y regueros
        c*=mix(1.0,0.72,smoothstep(0.4,0.8,n1*0.7+n3*0.3));
        // óxido: abajo, en pasos de rueda y manchas sueltas (mucho más en los siniestros)
        float rr=smoothstep(0.62-uWr*0.35,0.78-uWr*0.3,n2*0.6+n3*0.4+(0.55-vCP.y)*0.35*paint);
        c=mix(c,vec3(0.36,0.17,0.08)*(0.6+n3*0.6),rr*paint);
        // polvo y hojas en las superficies horizontales
        float up=smoothstep(0.55,0.9,vCN.y);c=mix(c,vec3(0.55,0.5,0.42),up*smoothstep(0.3,0.7,n1)*0.75);
        // quemado
        c=mix(c,vec3(0.05,0.045,0.04)*(0.6+n2),uWr>0.9?0.85:0.0);
        diffuseColor.rgb=c;`);};m.customProgramCacheKey=()=>'carwear';return m;}
// interior (salpicadero, relojes, asientos, consola, palanca) para el coche de la comunidad
const CARINT=(()=>{const P=[],S=[];const B=(w,h,d,x,y,z,c,rx=0,ry=0,rz=0)=>P.push([bx(w,h,d,x,y,z,rx,ry,rz),c]);const SB=(w,h,d,x,y,z,rx=0)=>S.push([bx(w,h,d,x,y,z,rx),0x55585e]);
  B(1.3,0.22,0.36,0,0.86,1.04,0x1c1d20,-0.25);B(1.28,0.06,0.28,0,0.98,0.93,0x26272a,-0.1);B(0.32,0.12,0.1,0.33,1.03,0.9,0x111214);B(0.22,0.15,0.03,0,0.97,0.9,0x101820,-0.4);
  B(0.22,0.3,0.55,0,0.46,0.45,0x1e1f22);B(0.12,0.012,0.14,0,0.62,0.4,0x0c0c0d);
  for(const sx of [0.32,-0.32]){SB(0.44,0.12,0.48,sx,0.48,0.12);SB(0.44,0.58,0.12,sx,0.8,-0.15,-0.18);SB(0.26,0.17,0.09,sx,1.15,-0.22,-0.18);}
  SB(1.22,0.13,0.45,0,0.5,-0.72);SB(1.22,0.5,0.11,0,0.78,-0.96,-0.2);
  // carrocería vista desde dentro: paneles de puerta, techo, pilares, piso y mampara trasera
  for(const sx of [1,-1]){B(0.04,0.5,1.75,sx*0.71,0.68,0.1,0x2a2b2f);B(0.06,0.06,1.7,sx*0.69,0.94,0.1,0x3a3b40);
    P.push([tube([sx*0.66,0.97,1.15],[sx*0.6,1.42,0.52],0.035,6),0x2c2d31],[tube([sx*0.66,0.95,-0.32],[sx*0.62,1.43,-0.3],0.05,6),0x2c2d31],[tube([sx*0.66,0.95,-1.0],[sx*0.58,1.42,-0.85],0.06,6),0x2c2d31]);}
  B(1.28,0.02,1.55,0,1.44,-0.2,0x8a8780);B(1.3,0.03,2.3,0,0.3,0.05,0x141416);B(1.3,0.5,0.03,0,0.55,1.18,0x141416);B(1.2,0.3,0.03,0,1.1,-1.15,0x2a2b2f);
  for(const x of [-0.12,0.12,-0.58,0.6])B(0.14,0.06,0.02,x,0.93,0.92,0x0c0c0d,-0.2);B(1.2,0.012,0.012,0,0.9,0.86,0x9a9ea2);
  for(const sx of [1,-1]){B(0.02,0.012,0.6,sx*0.69,0.82,0.15,0x9a9ea2);B(0.025,0.05,0.12,sx*0.69,0.86,0.35,0x2a2b2f);}
  P.push([ell(0.06,0.05,0.07,0,0.6,0.4,10),0x101011]);B(0.24,0.06,0.02,0,1.36,0.6,0x1a1a1b,0.3);
  return{trim:mkG(P),seats:mkG(S)};})();
const texScreen=cTex(256,320,(g,w,h)=>{g.fillStyle='#05070a';g.fillRect(0,0,w,h);g.fillStyle='#16324a';g.fillRect(10,10,w-20,60);g.fillStyle='#d8e4f0';g.font='bold 28px Arial';g.fillText('16:58',20,52);
  for(let i=0;i<4;i++){g.fillStyle=['#2a5a7a','#3a3a4a','#4a2a5a','#2a4a3a'][i];g.fillRect(14+(i%2)*120,90+Math.floor(i/2)*100,110,88);}g.fillStyle='#a02020';g.font='bold 18px Arial';g.fillText('SIN SEÑAL',70,300);},{});
const screenMat=new THREE.MeshBasicMaterial({map:texScreen,color:0x8a8a8a});
// matrículas españolas (4 cifras + 3 consonantes, banda azul de la UE con la «E»)
const PLATEN=32;const texPlates=cTex(2048,896,(g)=>{const L='BCDFGHJKLMNPRSTVWXYZ';for(let k=0;k<PLATEN;k++){const x=(k%4)*512,y=Math.floor(k/4)*112;
  g.fillStyle='#f6f6f2';g.fillRect(x+4,y+4,504,104);g.strokeStyle='#111';g.lineWidth=4;g.strokeRect(x+5,y+5,502,102);g.fillStyle='#003399';g.fillRect(x+6,y+6,56,100);
  g.fillStyle='#ffcc00';for(let i=0;i<12;i++){const a=i/12*6.283;g.beginPath();g.arc(x+34+Math.cos(a)*15,y+40+Math.sin(a)*15,2.6,0,7);g.fill();}g.fillStyle='#fff';g.font='bold 30px Arial,sans-serif';g.textAlign='center';g.fillText('E',x+34,y+96);
  const num=String(RI(0,9999)).padStart(4,'0'),let3=[0,1,2].map(()=>L[RI(0,L.length-1)]).join('');g.save();g.translate(x+290,y+58);g.scale(0.74,1);g.fillStyle='#111';g.font='bold 92px "DIN Condensed","Arial Narrow",Arial,sans-serif';g.textBaseline='middle';g.fillText(num+'  '+let3,0,4);g.restore();}},{});
const plateMat=new THREE.MeshLambertMaterial({map:texPlates,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
function plateGeo(k,front,back){const u0=(k%4)/4,v1=1-Math.floor(k/4)/8,v0=v1-1/8;const gs=[];for(const [z,ry] of [[front,0],[back,Math.PI]]){const g=new THREE.PlaneGeometry(0.52,0.11);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,u0+uv.getX(i)/4,v0+uv.getY(i)/8);g.rotateY(ry);g.translate(0,z[1],z[0]);gs.push(g);}return mergeGeometries(gs);}
const shiftKnobGeo=mkG([[cy(0.009,0.009,0.2,0,0.1,0,6),0x2a2a2a],[sp(0.032,0,0.21,0,10),0x111111]]);
function makeCar(x,z,yaw,kind,o={}){const T=CARTPL;if(!T)return makeCarProc(x,z,yaw,kind);
  const g=new THREE.Group();const body=new THREE.Group();body.position.y=0.5;g.add(body);const wheels=[];const wreck=o.wreck||0;
  const inner=T.root.clone(true);inner.position.y=-0.5;body.add(inner);const taxi=!wreck&&Math.random()<0.12;const col=taxi?0x111214:wreck>0.9?0x222222:pick(CARCOL);
  let bodyMesh=null,winMesh=[];inner.traverse(q=>{if(!q.isMesh)return;if(q.name==='Car'){q.material=wearMat(q.material,col,Math.random()*50,wreck);q.material.side=THREE.FrontSide;bodyMesh=q;}else if(/Window|Windshield/.test(q.name)){q.material=carGlassMat;winMesh.push(q);}else if(q.material.side!==THREE.FrontSide){q.material=q.material.clone();q.material.side=THREE.FrontSide;}});
  if(taxi){const tp=new THREE.Mesh(mkG([[bx(0.02,0.36,1.5,0.8,0.62,0.0),0xf2c400],[bx(0.02,0.36,1.5,-0.8,0.62,0.0),0xf2c400],[bx(0.36,0.11,0.14,0,1.52,0.1),0xf2f2f0],[bx(0.07,0.05,0.04,0.55,1.04,1.0),0x22c040]]),trimMat);tp.position.y=-0.5;body.add(tp);}
  {const pm=new THREE.Mesh(plateGeo(RI(0,PLATEN-1),[T.box.max.z+0.012,0.4-0.5],[T.box.min.z-0.012,0.62-0.5]),plateMat);body.add(pm);}
  if(wreck&&Math.random()<0.6)for(const w of winMesh)w.visible=false;// lunas reventadas
  // ruedas: cada una en su pivote
  for(const w of T.wheels){const src=inner.getObjectByName(w.name);if(!src)continue;const piv=new THREE.Group();piv.position.set(w.c.x,w.c.y,w.c.z);piv.rotation.order='YXZ';g.add(piv);piv.attach(src);
    if(wreck&&Math.random()<0.4){piv.rotation.z=R(-0.3,0.3);piv.position.y-=0.08;}wheels.push({node:piv,front:w.front});}
  const y=surfY(x,z);g.position.set(x,y,z);g.rotation.y=yaw;scene.add(g);
  const car={g,body,bodyMesh,sw:null,swp:null,x,z,y,yaw,speed:0,vLat:0,yr:0,steer:0,wheelRot:0,roll:0,rollV:0,pitch:0,pitchV:0,fuel:wreck?0:R(5,60),wheels,seat:new V3(0.32,0.3,0.12),eye:1.17,halfW:T.halfW,len:T.len,kind:'panda',searched:false,wreck,gear:0,shift:{gx:0,gz:0,held:null},wheelR:0.29};cars.push(car);return car;}
// el interior y el volante solo se montan cuando te subes (ahorra triángulos en los coches aparcados)
function carInterior(car){if(car.swp||!car.bodyMesh)return;const b=car.body;const tm=new THREE.Mesh(CARINT.trim,plasticMat),sm=new THREE.Mesh(CARINT.seats,seatMat);tm.position.y=sm.position.y=-0.5;b.add(tm,sm);
  const sc=new THREE.Mesh(new THREE.PlaneGeometry(0.16,0.2),screenMat);sc.position.set(0,1.02-0.5,0.86);sc.rotation.set(-0.25,Math.PI,0);b.add(sc);
  const gm=new THREE.Mesh(new THREE.PlaneGeometry(0.28,0.105),gaugeMat);gm.position.set(0.33,1.035-0.5,0.845);gm.rotation.set(0,Math.PI,0);b.add(gm);
  const swp=new THREE.Group();swp.position.set(0.33,0.9-0.5,0.6);swp.rotation.x=-0.38;const swm=new THREE.Mesh(CARGEO.sw,trimMat);swp.add(swm);const colm=new THREE.Mesh(CARGEO.col,trimMat);colm.position.z=0.1;swp.add(colm);b.add(swp);car.sw=swm;car.swp=swp;
  const kp=new THREE.Group();kp.position.set(0,0.62-0.5,0.4);const kn=new THREE.Mesh(shiftKnobGeo,trimMat);kp.add(kn);b.add(kp);car.knob=kp;
}
function makeCarProc(x,z,yaw,kind){const g=new THREE.Group();const body=new THREE.Group();body.position.y=0.5;g.add(body);const wheels=[];
  const taxi=Math.random()<0.15;const bodyM=pbr(new THREE.MeshStandardMaterial({color:taxi?0x0f1012:pick(CARCOL),metalness:0.45,roughness:0.32,envMapIntensity:1.3,side:THREE.DoubleSide}));
  const bm=new THREE.Mesh(CARGEO.body,[bodyM,carGlassMat,carBlackMat]);const tm=new THREE.Mesh(CARGEO.trim,plasticMat);const sm=new THREE.Mesh(CARGEO.seats,seatMat);bm.position.y=tm.position.y=sm.position.y=-0.5;body.add(bm,tm,sm);
  if(taxi){const tp=new THREE.Mesh(mkG([[bx(0.02,0.42,2.0,0.885,0.66,-0.4),0xf2c400],[bx(0.02,0.42,2.0,-0.885,0.66,-0.4),0xf2c400],[bx(0.42,0.12,0.16,0,1.52,-0.3),0xf2f2f0],[bx(0.08,0.06,0.05,0.62,1.0,0.75),0x22c040]]),trimMat);tp.position.y=-0.5;body.add(tp);}
  // volante del conductor (a la izquierda: +x); su eje apunta hacia el conductor
  const gm=new THREE.Mesh(new THREE.PlaneGeometry(0.3,0.112),gaugeMat);gm.position.set(0.38,1.045-0.5,0.462);gm.rotation.set(0,Math.PI,0);body.add(gm);
  const swp=new THREE.Group();swp.position.set(0.38,0.98-0.5,0.3);swp.rotation.x=-0.42;const swm=new THREE.Mesh(CARGEO.sw,trimMat);swp.add(swm);const colm=new THREE.Mesh(CARGEO.col,trimMat);colm.position.z=0.13;swp.add(colm);body.add(swp);
  for(const [wx,wz] of [[0.76,WB],[-0.76,WB],[0.76,-WB],[-0.76,-WB]]){const piv=new THREE.Group();piv.position.set(wx,WR,wz);piv.rotation.order='YXZ';const wm=new THREE.Mesh(CARGEO.wheel,wheelMat);if(wx<0)wm.scale.x=-1;piv.add(wm);g.add(piv);wheels.push({node:piv,front:wz>0});}
  const y=surfY(x,z);g.position.set(x,y,z);g.rotation.y=yaw;scene.add(g);
  const car={g,body,sw:swm,swp,x,z,y,yaw,speed:0,vLat:0,yr:0,steer:0,wheelRot:0,roll:0,rollV:0,pitch:0,pitchV:0,fuel:R(5,60),wheels,seat:new V3(0.38,0.3,-0.22),eye:1.13,halfW:0.92,len:4.3,kind,searched:false};cars.push(car);return car;}
const _eu2=new THREE.Euler();
// moto como vehículo: carrocería del mismo modelo que la aparcada, se inclina en las curvas
function makeMoto(m){const g=new THREE.Group();const body=new THREE.Group();g.add(body);const mat=paintMat.clone();mat.color.set(m.col);const me=new THREE.Mesh(INST[m.model].geo,mat);body.add(me);
  g.position.set(m.x,m.y,m.z);g.rotation.y=m.yaw;scene.add(g);const c={g,body,sw:null,swp:null,x:m.x,z:m.z,y:m.y,yaw:m.yaw,speed:0,vLat:0,yr:0,steer:0,wheelRot:0,roll:0,rollV:0,pitch:0,pitchV:0,fuel:R(15,60),wheels:[],
    seat:new V3(0,0,-0.18),eye:1.42,halfW:0.35,len:1.9,kind:'moto',searched:true,wreck:0,gear:1,shift:{gx:0,gz:0,held:null},wheelR:0.27,auto:true};cars.push(c);return c;}
function steerMoto(car){if(!inVR)return null;const gl=gripBySide.left,gr=gripBySide.right;if(!gl||!gr||!IN.lgHeld||!IN.rgHeld)return null;gl.getWorldPosition(_v);gr.getWorldPosition(_v1);
  const dx=_v1.x-_v.x,dz=_v1.z-_v.z;const a=Math.atan2(dz,dx);const rel=Math.atan2(Math.sin(a+car.yaw),Math.cos(a+car.yaw));return clamp(-rel*3.2,-2.4,2.4);}
function placeCars(){const spots=CARSPOTS.slice();for(let i=spots.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[spots[i],spots[j]]=[spots[j],spots[i]];}
  spots.sort((a,b)=>(b.crash?1:0)-(a.crash?1:0));let n=0;for(const s of spots){if(n>=70)break;if(cars.some(c=>Math.hypot(c.x-s.x,c.z-s.z)<5.2))continue;const c=makeCar(s.x,s.z,s.yaw,'proc');if(s.crash){c.crashed=true;c.fuel=0;}n++;}
  const b=BASES.find(x=>x.type==='good');if(b)makeCar(b.x+8,b.z-30,Math.PI/2,'proc').fuel=55;}
// coches abandonados y siniestrados en mitad de la calzada (algunos volcados o quemados)
function placeWrecks(){let n=0;for(let tries=0;tries<120&&n<26;tries++){const v=Math.random()<0.5;const L=v?VSTR:HSTR;const st=pick(L);if(st.type==='ped'||st.type==='superilla')continue;const k=RI(0,(v?NZS:NXS)-2);
    const a0=(v?HSTR[k]:VSTR[k]).pos+14,a1=(v?HSTR[k+1]:VSTR[k+1]).pos-14;const along=R(a0,a1);const lat=R(-1,1)*(st.w/2-st.sw-1.6);const x=v?st.pos+lat:along,z=v?along:st.pos+lat;
    if(cars.some(c=>Math.hypot(c.x-x,c.z-z)<5))continue;const wreck=Math.random()<0.35?1:R(0.5,0.85);const c=makeCar(x,z,R(0,6.28),'proc',{wreck});if(!c)continue;
    const r=Math.random();c.flip=r<0.1?Math.PI:r<0.22?Math.PI/2*(Math.random()<0.5?1:-1):0;if(c.flip){c.g.rotation.z=c.flip;c.g.position.y+=Math.abs(c.flip)>3?1.5:c.halfW;c.y=c.g.position.y;c.fixedY=true;}
    solidBox(x,z,c.halfW,c.len/2,c.yaw,c.y-0.2,c.y+1.5);n++;}}
// cadáveres de atrezo repartidos por las calles (caen con física, luego se quedan quietos; se pueden registrar)
function placeCorpses(){let n=0;for(let tries=0;tries<300&&n<32;tries++){const bk=pick(BLOCKS);if(bk.outer)continue;const e=RI(0,7);const A=bk.cp[e],B=bk.cp[(e+1)%8];const t=Math.random();const c=centroid(bk.bp);
    let x=A[0]+(B[0]-A[0])*t,z=A[1]+(B[1]-A[1])*t;const dx=x-c[0],dz=z-c[1],l=Math.hypot(dx,dz);const off=R(-2.5,3.5);x+=dx/l*off;z+=dz/l*off;
    const h=spawnChar('wanderer',x,z,{armed:false});if(!h)continue;h.corpse=true;h.yaw=R(0,6.28);enterPhys(h);die(h,'x');for(let i=0;i<NP;i++){h.prev[i].x-=R(-1,1)*0.02;h.prev[i].z-=R(-1,1)*0.02;}n++;}}
// volante: se agarra con el grip (una o dos manos) y se gira de verdad; si no, el joystick. La mano se queda pegada al aro mientras lo agarras
const swGrab={left:null,right:null};const _swl=new V3();
function steerByHands(car){if(!inVR||!car.swp)return null;let sum=0,n=0;car.swp.updateMatrixWorld(true);
  for(const side of ['left','right']){const g=gripBySide[side];const held=side==='left'?IN.lgHeld:IN.rgHeld;if(!g||!held||(side==='right'&&car.shift.held)){swGrab[side]=null;continue;}
    g.updateMatrixWorld(true);g.getWorldPosition(_swl);car.swp.worldToLocal(_swl);const r=Math.hypot(_swl.x,_swl.y);const ang=Math.atan2(_swl.y,_swl.x);
    if(!swGrab[side]){if(Math.abs(r-0.185)<0.12&&Math.abs(_swl.z)<0.15){swGrab[side]={a:ang,w:car.wheelRot,loc:ang-car.wheelRot};haptic(side==='left'?srcL:srcR,0.4,30);}else continue;}
    let d=ang-swGrab[side].a;d=Math.atan2(Math.sin(d),Math.cos(d));sum+=swGrab[side].w+d;swGrab[side].w+=d;swGrab[side].a=ang;n++;}
  return n?sum/n:null;}
// mano pegada al volante o a la palanca: se mueve el mando virtual hasta el punto agarrado
function snapHandTo(side,world){const g=gripBySide[side];if(!g)return;rig.getWorldQuaternion(_q).invert();g.getWorldPosition(_v);_v1.subVectors(world,_v).applyQuaternion(_q);const e=g.matrix.elements;e[12]+=_v1.x;e[13]+=_v1.y;e[14]+=_v1.z;g.position.set(e[12],e[13],e[14]);g.updateMatrixWorld(true);}
function handsOnControls(car){if(!car.swp)return;for(const side of ['left','right']){const G=swGrab[side];if(G){const a=car.wheelRot+G.loc;_v.set(Math.cos(a)*0.185,Math.sin(a)*0.185,0);car.swp.localToWorld(_v);snapHandTo(side,_v.clone());}}
  if(car.shift.held&&car.knob){car.knob.updateMatrixWorld(true);_v.set(0,0.21,0);car.knob.children[0].localToWorld(_v);snapHandTo('right',_v.clone());}}
// cambio manual en H con la palanca (grip derecho): 1 izquierda-arriba, 2 izquierda-abajo, 3 centro-arriba, 4 centro-abajo, 5 derecha-arriba, R derecha-abajo
const GEARS=[{v:0,a:0},{v:13,a:6.2},{v:22,a:4.4},{v:32,a:3.2},{v:41,a:2.4},{v:50,a:1.8}];const GEARNAME=['N','1','2','3','4','5','R'];
function shiftByHand(car){const S=car.shift;if(!inVR||!car.knob){return;}const g=gripBySide.right;if(!g)return;g.updateMatrixWorld(true);const hp=g.getWorldPosition(_v2);
  car.knob.parent.updateMatrixWorld(true);_v3.copy(hp);car.knob.parent.worldToLocal(_v3);const bx0=car.knob.userData.base||(car.knob.userData.base=car.knob.position.clone());
  if(!S.held){if(IN.rgHeld&&!swGrab.right&&Math.hypot(_v3.x-bx0.x-S.gx*0.06,_v3.y-(bx0.y+0.2),_v3.z-bx0.z+S.gz*0.07)<0.13&&!S.wasHeld){S.held=true;haptic(srcR,0.3,25);}S.wasHeld=IN.rgHeld;}
  if(S.held&&!IN.rgHeld){S.held=false;S.wasHeld=false;}
  if(S.held){// la mano a la izquierda del conductor es +x en el coche
    const tx=clamp((_v3.x-bx0.x)/0.06,-1,1),tz=clamp(-(_v3.z-bx0.z)/0.07,-1,1);const cols=[1,0,-1];
    if(Math.abs(S.gz)<0.25){S.gx+=(tx-S.gx)*0.5;S.gz+=(tz-S.gz)*0.5;const col=cols.reduce((a,c)=>Math.abs(c-S.gx)<Math.abs(a-S.gx)?c:a,0);if(Math.abs(S.gz)>0.15)S.gx=col;}
    else{const col=cols.reduce((a,c)=>Math.abs(c-S.gx)<Math.abs(a-S.gx)?c:a,0);S.gx=col;S.gz+=(tz-S.gz)*0.5;}
    S.gz=clamp(S.gz,-1,1);}
  else if(Math.abs(S.gz)<0.8)S.gz*=0.8;
  car.knob.position.set(bx0.x+S.gx*0.06,bx0.y,bx0.z-S.gz*0.07);car.knob.rotation.set(-S.gz*0.3,0,-S.gx*0.25);
  let gear=0;if(Math.abs(S.gz)>0.75){const up=S.gz>0;gear=S.gx>0.5?(up?1:2):S.gx<-0.5?(up?5:6):(up?3:4);}
  if(gear!==car.gear){if(gear&&car.gear===0){sfx('click');haptic(srcR,0.5,40);}if(gear)toast('Marcha '+GEARNAME[gear],0.8);car.gear=gear;}}
function driveCar(car,dt){if(!car.swp&&car.kind!=='moto')carInterior(car);let thr=IN.gas;const brk=IN.brake;if(car.fuel<=0||car.wreck){thr=0;if(Math.random()<0.004)toast(car.wreck?'Este coche está destrozado':'Sin gasolina');}
  if(P.carGun){thr=0;}
  shiftByHand(car);
  // sin gafas: cambio automático
  if(!inVR||car.auto){if(thr>0.05)car.gear=car.speed<GEARS[1].v*0.85?1:car.speed<GEARS[2].v*0.85?2:car.speed<GEARS[3].v*0.85?3:car.speed<GEARS[4].v*0.85?4:5;if(brk>0.05&&car.speed<0.3)car.gear=6;}
  const v=car.speed;const G=car.gear===6?{v:-7,a:3.5}:GEARS[car.gear]||GEARS[0];
  if(thr>0.05&&car.gear){if(car.gear===6){if(v>-7)car.speed-=thr*3.5*dt;}else{const lug=clamp(v/(G.v*0.3),0.25,1);if(v<G.v)car.speed+=thr*G.a*lug*dt;}}
  if(car.gear&&car.gear!==6&&v>G.v)car.speed-=(v-G.v)*0.8*dt;// freno motor por encima del régimen
  if(brk>0.05){if(Math.abs(car.speed)>0.3)car.speed-=Math.sign(car.speed)*brk*16*dt;else if(!inVR&&car.gear===6)car.speed-=brk*3.5*dt;else car.speed=0;}
  car.speed-=car.speed*0.06*dt;if(thr<0.05&&brk<0.05)car.speed-=Math.sign(car.speed)*Math.min(Math.abs(car.speed),0.8*dt);car.speed=clamp(car.speed,-7,50);
  const LOCK=2.4;const hw=car.kind==='moto'?steerMoto(car):steerByHands(car);if(hw!==null)car.wheelRot=clamp(hw,-LOCK,LOCK);else car.wheelRot+=(-IN.steer*LOCK-car.wheelRot)*Math.min(1,dt*6);
  car.steer=-car.wheelRot/LOCK*0.58;moveCar(car,dt,true);handsOnControls(car);car.fuel=Math.max(0,car.fuel-Math.abs(car.speed)*dt*0.012);
  if(engine){const rpm=car.gear&&car.gear!==6?clamp(Math.abs(car.speed)/GEARS[car.gear].v,0.15,1.1):clamp(thr,0.12,1);engine.o.frequency.value=34+rpm*95;engine.g.gain.value=0.05+Math.min(0.06,thr*0.06);}
  if(nightF>0.3){const s=Math.sin(car.yaw),c=Math.cos(car.yaw);headlight.position.set(car.x+s*2.3,car.y+0.9,car.z+c*2.3);hlT.position.set(car.x+s*20,car.y,car.z+c*20);headlight.intensity=45;}else headlight.intensity=0;}
// física: modelo de bicicleta con agarre limitado (si te pasas de velocidad en una curva cerrada, derrapa) y carrocería con balanceo y cabeceo sobre muelles
function moveCar(car,dt,player){const vs=car.speed;const grip=9;const yl=grip*1.12/Math.max(Math.abs(car.speed),1);const yrT=clamp(car.speed*Math.tan(car.steer)/(WB*2),-yl,yl);
  car.yr+=(yrT-car.yr)*Math.min(1,dt*(Math.abs(car.vLat)>1.5?2.5:7));
  // al girar, la velocidad se queda «atrás» en el sistema del coche (aparece velocidad lateral) y las ruedas la frenan hasta su límite de agarre
  const dLat=-car.speed*car.yr*dt;let vl=car.vLat+dLat;const cap=grip*(Math.abs(vl)>2?0.75:1)*dt;vl-=clamp(vl,-cap,cap);
  // al derrapar la cola se va un poco más y se pierde velocidad
  car.yr+=-vl*0.06*dt*Math.sign(car.speed||1);car.speed-=Math.sign(car.speed)*Math.min(Math.abs(car.speed),Math.abs(vl)*0.6*dt);car.vLat=vl*Math.pow(0.6,dt);
  const latA=car.speed*car.yr,lonA=(car.speed-vs)/Math.max(dt,1e-3);
  const rT=car.kind==='moto'?clamp(latA*0.09,-0.75,0.75):clamp(-latA*0.016,-0.09,0.09);car.rollV+=((rT-car.roll)*55-car.rollV*7)*dt;car.roll+=car.rollV*dt;car.pitchV+=((clamp(lonA*0.008,-0.06,0.06)-car.pitch)*60-car.pitchV*8)*dt;car.pitch+=car.pitchV*dt;
  car.yaw+=car.yr*dt;const s=Math.sin(car.yaw),c=Math.cos(car.yaw);const vx=s*car.speed+c*car.vLat,vz=c*car.speed-s*car.vLat;const nx=car.x+vx*dt,nz=car.z+vz*dt;let blocked=false;
  for(const off of [-1.5,0,1.5]){const pt={x:nx+s*off,z:nz+c*off};if(collide(pt,car.halfW+0.05,car.y+0.4,car.y+1.3)){blocked=true;break;}}
  for(const o of cars){if(o===car)continue;const dn=Math.hypot(o.x-nx,o.z-nz);if(dn<3.4&&dn<Math.hypot(o.x-car.x,o.z-car.z)){blocked=true;o.speed+=vs*0.35;o.vLat+=car.vLat*0.3;}}
  if(blocked){const hit=Math.hypot(vs,car.vLat);if(hit>7&&player){sfx('crash',clamp(hit/20,0.3,1));damagePlayer(hit*0.8,'accidente');toast('¡Choque!');}car.speed=-vs*0.25;car.vLat*=-0.2;car.yr*=0.3;car.rollV+=car.vLat*0.3;car.pitchV-=vs*0.04;}else{car.x=nx;car.z=nz;}
  if(!car.fixedY)car.y+=(surfY(car.x,car.z)-car.y)*Math.min(1,dt*8);
  if(Math.abs(car.speed)>2.2)for(const h of H_){if(!h.active)continue;const hx=h.sim[PELVIS].x,hz=h.sim[PELVIS].z;const dx=hx-car.x,dz=hz-car.z;if(dx*dx+dz*dz>9)continue;
    const lx=dx*c-dz*s,lz=dx*s+dz*c;if(Math.abs(lx)<car.halfW+0.2&&Math.abs(lz)<car.len/2+0.1&&clockT-h.lastHitT>0.4){const sp=Math.abs(car.speed);
      _imp.set(s*car.speed,0,c*car.speed).multiplyScalar(1.15);_imp.y=1+sp*0.12;_e2.copy(h.sim[LKNEE]);hitChar(h,'body',sp*5,_imp,LKNEE,player?'player':'car',_e2,_v.set(s,0,c));applyImp(h,_imp.set(s*car.speed*0.9,1+sp*0.1,c*car.speed*0.9),RKNEE);applyImp(h,_imp.set(s*car.speed*0.25,sp*0.18,c*car.speed*0.25),CHEST);h.k=0;
      if(!h.dead){h.headHp-=sp*1.5;if(h.headHp<=0)die(h,player?'player':'car');}h.lastHitT=clockT;sfx('hit',volAt(hx,hz,50));spray(h.sim[CHEST],_v.set(s,0,c),10);car.speed*=0.9;}}
  car.g.position.set(car.x,car.y,car.z);car.g.rotation.y=car.yaw;if(car.body){car.body.rotation.set(-car.pitch,0,car.roll);if(car.sw)car.sw.rotation.z=car.wheelRot;}if(car.wreck)car.g.rotation.z=car.flip||0;
  for(const w of car.wheels){w.node.rotation.x+=car.speed*dt/(car.wheelR||WR);if(w.front)w.node.rotation.y=car.steer;}}

// =====================================================================
// NECESIDADES
// =====================================================================
function updateNeeds(hrs){P.food=Math.max(0,P.food-4.2*S.hunger*hrs);P.water=Math.max(0,P.water-6*S.thirst*hrs);P.bladder=Math.min(100,P.bladder+11*S.physio*hrs);P.bowels=Math.min(100,P.bowels+4.2*S.physio*hrs);
  if(P.sleeping)P.energy=Math.min(100,P.energy+(P.bedSleep?16:11)*hrs);else P.energy=Math.max(0,P.energy-(P.sprinting?14:5)*S.fatigue*hrs);
  if(P.food<=0)P.hp-=5*hrs;if(P.water<=0)P.hp-=8*hrs;if(P.food>45&&P.water>45&&P.sick<20&&!(P.infected&&P.infT>24)&&P.hp<100)P.hp=Math.min(100,P.hp+(P.sleeping?4:1.5)*hrs);
  if(P.sick>0){P.hp-=P.sick*0.05*hrs;P.mood=Math.max(0,P.mood-2*hrs);P.sick=Math.max(0,P.sick-6*hrs);P.vomitT-=hrs;if(P.sick>40&&P.vomitT<=0){P.vomitT=R(1,2.5);P.food=Math.max(0,P.food-15);P.water=Math.max(0,P.water-15);sfx('vomit');toast('Vomitas…');}}
  if(P.infected){P.infT+=hrs;if(P.infT>6&&P.infT-hrs<=6)toast('Te sientes febril…',4);if(P.infT>24)P.hp-=2*hrs;if(P.infT>48)P.hp-=6*hrs;}
  const sad=(P.food<20)+(P.water<20)+(P.energy<20)+(P.hp<30);P.mood=clamp(P.mood+(sad?-3*sad:0.8)*hrs,0,100);
  if(P.bladder>=100){P.bladder=0;P.mood=Math.max(0,P.mood-18);toast('Te has meado encima… Ánimo -18');}if(P.bowels>=100){P.bowels=0;P.mood=Math.max(0,P.mood-30);toast('Te has cagado encima. Qué asco. Ánimo -30');}
  if(P.hp<=0&&P.alive){P.hp=0.01;damagePlayer(1,P.infected&&P.infT>24?'infección':'hambre, sed o enfermedad');}
  P.accT-=hrs;if(P.accT<=0){P.accT=2;if(P.bladder>80)toast('Necesitas mear urgentemente');else if(P.bowels>80)toast('Necesitas cagar (busca un baño)');else if(P.food<15)toast('Te mueres de hambre');else if(P.water<15)toast('Te mueres de sed');else if(P.energy<12)toast('Estás agotado. Necesitas dormir');}}

// =====================================================================
// CIELO
// =====================================================================
const cNight=new THREE.Color(0x070a14),cDay=new THREE.Color(0xa9bdd0),cDusk=new THREE.Color(0xd49a72),cFog=new THREE.Color(),_sunDir=new V3();
const cHaze=new THREE.Color(0.66,0.6,0.5);
// nubes con volumen aparente: cúpula alrededor de la cámara que proyecta cada dirección sobre una capa a 600 m y la rellena con ruido fractal que avanza con el viento
const CU={uTime:{value:0},uSun:{value:new V3(0,1,0)},uDay:{value:1},uCov:{value:0.6},uFog:{value:new THREE.Color()}};
const clouds=new THREE.Mesh(new THREE.SphereGeometry(1,32,12,0,Math.PI*2,0,Math.PI*0.5),new THREE.ShaderMaterial({uniforms:CU,transparent:true,depthWrite:false,side:THREE.BackSide,fog:false,
  vertexShader:`varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`varying vec3 vD;uniform float uTime,uDay,uCov;uniform vec3 uSun,uFog;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<5;i++){v+=a*n(p);p=mat2(1.6,1.2,-1.2,1.6)*p+vec2(1.7,9.2);a*=0.5;}return v;}
    float dens(vec2 p){vec2 q=vec2(fbm(p*0.7+uTime*0.002),fbm(p*0.7+vec2(5.2,1.3)));float c=fbm(p*1.3+q*1.4);return smoothstep(1.0-uCov,1.0-uCov+0.32,c);}
    void main(){vec3 d=normalize(vD);if(d.y<0.0)discard;float hy=max(d.y,0.03);vec2 p=d.xz/hy*0.75+vec2(uTime*0.005,uTime*0.002);
      float c=dens(p);if(c<0.005)discard;
      // luz: cuánto se aclara la nube hacia el sol (bordes plateados) y transluciencia cerca del sol
      vec2 sd=normalize(uSun.xz+1e-4)*0.06;float cs=dens(p+sd);float edge=clamp((c-cs)*3.0+0.35,0.0,1.0);
      float toSun=max(dot(d,normalize(uSun)),0.0);float glow=pow(toSun,6.0)*(1.0-c*0.6)+pow(toSun,40.0)*1.5;
      float lowSun=1.0-smoothstep(0.0,0.45,uSun.y);
      vec3 under=mix(vec3(0.05,0.05,0.07),vec3(0.24,0.24,0.27),uDay);
      vec3 lit=mix(vec3(0.75,0.74,0.72),vec3(1.0,0.66,0.38),lowSun)*mix(0.25,1.25,uDay);
      vec3 col=mix(under,lit,edge*edge)+vec3(1.0,0.62,0.3)*glow*uDay*(0.6+lowSun);
      col*=1.0-c*0.35;
      float hor=smoothstep(0.0,0.22,d.y);col=mix(uFog*mix(1.0,1.3,glow),col,hor);
      gl_FragColor=vec4(col,clamp(c*1.15,0.0,1.0)*mix(0.75,1.0,hor));}`}));
clouds.renderOrder=-1;clouds.frustumCulled=false;scene.add(clouds);
function updateSky(){const h=hourF();const ang=(h-6)/24*Math.PI*2;const sy=Math.sin(ang),sx=Math.cos(ang);const day=THREE.MathUtils.smoothstep(sy,-0.1,0.2);nightF=1-day;
  _sunDir.set(sx*0.9,sy,0.35).normalize();su.sunPosition.value.copy(_sunDir);su.rayleigh.value=0.5+day*0.9;su.turbidity.value=9+(1-day)*4;su.mieCoefficient.value=0.012+(S.haze||0)*0.004;su.mieDirectionalG.value=0.88;
  sky.position.copy(camW);stars.position.copy(camW);starMat.opacity=clamp(nightF*1.3-0.3,0,1);
  sun.position.copy(rig.position).addScaledVector(_sunDir,150);sun.target.position.copy(rig.position);sun.intensity=day*2.3;sun.color.setRGB(1,0.8+0.2*day,0.62+0.38*day);
  hemi.intensity=0.08+day*0.9;cFog.copy(cNight).lerp(cDay,day);cFog.lerp(cDusk,clamp(1-Math.abs(sy)/0.28,0,1)*0.5);{const hz=S.haze||0;cFog.lerp(cHaze,[0,0.35,0.55,0.75,0.85][hz]*(0.4+day*0.6));scene.fog.color.copy(cFog);const vf=S.view||6000;const hf=[6000,420,200,110,70][hz];const far=Math.min(vf,hf*(0.45+day*0.55),vf);scene.fog.far=far;scene.fog.near=far*(hz?0.05:0.3);
    const cf=(S.view||3000)+60;if(Math.abs(camera.far-cf)>1){camera.far=cf;camera.updateProjectionMatrix();}sky.scale.setScalar(Math.min(1200,cf*0.85));
    clouds.position.copy(camW);clouds.scale.setScalar(Math.min(900,cf*0.8));CU.uTime.value=clockT;CU.uSun.value.copy(_sunDir);CU.uDay.value=day;CU.uCov.value=[0,0.45,0.8][S.clouds??2]+hz*0.03;CU.uFog.value.copy(cFog);clouds.visible=(S.clouds??2)>0;}
  renderer.toneMappingExposure=(0.72+day*0.2)*(S.filter===1?1.08:1)+10*(S.filter||0);winMat.emissiveIntensity=nightF*1.0;if(SIGN_MAT)SIGN_MAT.emissiveIntensity=0.05+nightF*0.35;for(const m of PBR)m.envMapIntensity=0.1+0.9*day;
  flashlight.intensity=P.light&&!inVR?32:0;vrFlash.intensity=P.light&&inVR?32:0;windU.value=clockT;}

// =====================================================================
// BUCLE PRINCIPAL
// =====================================================================
let started=false,inVR=false,clockT=0,last=performance.now()/1000,hudT=0,promptT=0,frameNo=0,chunkT=0;
const frustum=new THREE.Frustum(),_pm=new M4(),_sph=new THREE.Sphere();
function updateChars(dt,p){camera.updateMatrixWorld();_pm.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(_pm);
  for(const h of H_){if(!h.active)continue;const kin=h.mode==='kin'&&!h.dead;const hx=kin?h.x:h.sim[PELVIS].x,hz=kin?h.z:h.sim[PELVIS].z;const d=Math.hypot(hx-p.x,hz-p.z);
    for(let i=0;i<NP;i++)if(h.kl[i]<1)h.kl[i]=Math.min(1,h.kl[i]+dt*1.8);
    if(h.dead){h.deadT+=dt;if(h.sleep<1){const mv=physStep(h,dt);h.sleep=mv<0.003?h.sleep+dt:0;driveBones(h);}
      if(h.reanimate&&h.deadT>12){h.reanimate=false;h.type='zombie';h.dead=false;h.headHp=80;h.bodyHp=140;h.base=null;h.role=null;h.armed=false;h.k=0;h.down=0.01;h.gp=Object.assign(h.gp,{lean:R(0.15,0.35),droop:R(0.2,0.5),arms:'forward',limp:R(-0.6,0.6),twitch:0.7,speedMul:R(0.8,1.1)});
        for(const m of h.meshes)m.material=charMat(m.userData.base,'zombie',0,1/h.tpl.height);if(d<40)toast(`${h.name} se levanta convertido en zombi…`);}
      else if(h.deadT>90&&d>25)despawn(h);
      _m.compose(_p.set(hx,surfY(hx,hz,h.sim[PELVIS].y)+0.02,hz),_q.identity(),_s.set(1.3,1,1.3));blobs.setMatrixAt(h.slot,_m);continue;}
    if(d>140&&h.mode==='kin'){h.holder.visible=false;if(h.prop)h.prop.visible=false;blobs.setMatrixAt(h.slot,ZM);if(h.target==='player'&&h.type==='zombie'&&frameNo%4===0)moveH(h,p.x-h.x,p.z-h.z,h.runner?3.7:1,dt*4);continue;}
    h.holder.visible=true;if(h.prop)h.prop.visible=h.armed;if(h.atkAnim>0)h.atkAnim-=dt;
    if(h.type==='zombie')zombieAI(h,dt,p);else survivorAI(h,dt,p);
    _sph.center.set(h.x,h.y+1,h.z);_sph.radius=2.2;const vis=(frustum.intersectsSphere(_sph)&&d<(inVR?75:110))||h.mode==='phys';const lodN=d>60?4:d>30?2:1;h.holder.visible=vis||d<3;if(h.prop)h.prop.visible=h.armed&&h.holder.visible;
    h.lodAcc=(h.lodAcc||0)+dt;
    if(h.mode==='phys'){if(h.act==='getup'){h.getup+=dt/(h.type==='zombie'?R(2.6,3.4):2.2);h.k=Math.min(0.9,0.25+h.getup*0.8);if(h.getup>=1){h.act='stand';h.getup=-1;}}
      poseTargets(h,dt);if(h.brace>0){h.brace-=dt;braceTargets(h);}
      if(h.crawler){h.k=0.35;h.down=1e9;}else if(h.down>0){h.down-=dt;h.k=0;if(h.down<=0)startGetUp(h);}
      else if(h.act!=='getup'){h.k=Math.min(1,h.k+dt*1.4);const tp=h.tgt[PELVIS],spp=h.sim[PELVIS];h.x+=(spp.x-tp.x)*Math.min(1,dt*3);h.z+=(spp.z-tp.z)*Math.min(1,dt*3);
        if(h.k>=1&&!h.permPhys){let err=0,klm=1;for(let i=0;i<NP;i++){err+=h.sim[i].distanceTo(h.tgt[i]);klm=Math.min(klm,h.kl[i]);}if(err/NP<0.05&&klm>0.98)h.mode='kin';}}
      physStep(h,dt);driveBones(h);}
    else if(vis&&(frameNo+h.slot)%lodN===0){poseTargets(h,h.lodAcc);h.lodAcc=0;for(let i=0;i<NP;i++)h.sim[i].copy(h.tgt[i]);driveBones(h);}
    else if(!vis){h.lodAcc=Math.min(h.lodAcc,0.2);h.holder.position.set(h.x,h.y,h.z);}
    _m.compose(_p.set(hx,h.y+0.02,hz),_q.identity(),_s.set(0.9,1,0.9));blobs.setMatrixAt(h.slot,_m);
    if(h.mode==='kin'&&d<40&&frameNo%2===0)for(const o of H_){if(o===h||!o.active||o.dead||o.mode!=='kin')continue;const ex=h.x-o.x,ez=h.z-o.z,dd=ex*ex+ez*ez;if(dd<0.3&&dd>1e-6){const l=Math.sqrt(dd);h.x+=ex/l*(0.55-l)*0.5;h.z+=ez/l*(0.55-l)*0.5;}}
    if(h.type==='zombie'&&d<14&&h.speed>0.3){h.stepT-=dt*h.speed;if(h.stepT<=0){h.stepT=0.7;sfx('step',volAt(h.x,h.z,14));}}}
  blobs.instanceMatrix.needsUpdate=true;}
function updateWeapons(dt){const vrOn=inVR&&!!gripBySide.right;
  vrBat.visible=P.weapon==='bate';vrGun.visible=P.weapon==='pistola';vmBat.visible=P.weapon==='bate'&&!P.inCar&&!inVR;vmGun.visible=P.weapon==='pistola'&&!P.inCar&&!inVR;
  for(const gun of [vrGun,vmGun]){const u=gun.userData;u.slide.position.z=(G.locked?0.03:0)+G.kick+(gun===vrGun&&slideGrab?slideGrab.off:0);u.mag.visible=G.mag>=0;u.mag.userData.bullet.visible=u.mag.userData.tip.visible=G.mag>0;u.flash.material.opacity=Math.max(0,u.flash.material.opacity-dt*25);}
  G.kick=Math.max(0,G.kick-dt*0.4);
  if(swingT>0){swingT-=dt;const k=1-swingT/0.28;vmBat.rotation.set(0.9-Math.sin(k*Math.PI)*1.6,0.25+Math.sin(k*Math.PI)*0.9,0);}else vmBat.rotation.set(0.9,0.25,0);
  if(inVR&&!P.inCar&&P.alive)vrMelee(dt);
  refillBelt();
  const lhr=hands.left;const showBelt=vrOn&&P.weapon==='pistola'&&!P.inCar;camera.getWorldPosition(_v);camera.getWorldDirection(_v1);_v1.y=0;_v1.normalize();const rx=-_v1.z,rz=_v1.x;
  beltPouch.visible=showBelt;if(showBelt){const by=Math.max(surfY(_v.x,_v.z,_v.y-1.6)+0.6,_v.y-0.68);beltPouch.position.set(_v.x-rx*0.2+_v1.x*0.04,by,_v.z-rz*0.2+_v1.z*0.04);beltPouch.rotation.y=Math.atan2(_v1.x,_v1.z);
    for(let i=0;i<2;i++){beltMags[i].visible=BELT[i]!==null;beltMags[i].userData.bullet.visible=beltMags[i].userData.tip.visible=(BELT[i]||0)>0;}}
  leftMag.visible=!!leftHold;if(leftHold)leftMag.userData.bullet.visible=leftMag.userData.tip.visible=leftHold.n>0;
  if(vrOn&&lhr&&lhr.handRoot.parent&&!P.inCar){lhr.wristObj.getWorldPosition(_v2);_v2.addScaledVector(_v1.set(0,0,0),0);leftMag.getWorldPosition(_v3);const handP=_v3.clone();
    if(IN.lgDown&&!leftHold){
      if(P.weapon==='pistola'&&G.mag>=0){vrGun.userData.magwell.getWorldPosition(_v4);if(handP.distanceTo(_v4)<0.09){leftHold={n:ejectMag(false),armed:false};haptic(srcL,0.6,40);}}
      if(!leftHold&&P.weapon==='pistola'){vrGun.userData.slideRear.getWorldPosition(_v4);if(handP.distanceTo(_v4)<0.09){vrGun.worldToLocal(_v4.copy(handP));slideGrab={z0:_v4.z,off:0,done:false};}}
      if(!leftHold&&!slideGrab&&showBelt){for(let i=0;i<2;i++){beltMags[i].getWorldPosition(_v4);if(BELT[i]!==null&&handP.distanceTo(_v4)<0.16){leftHold={n:BELT[i],armed:true};BELT[i]=null;sfx('click');haptic(srcL,0.5,30);break;}}}
      if(!leftHold&&!slideGrab){for(const d of dropped){if(d.rounds===undefined)continue;if(d.o.position.distanceTo(handP)<0.18){leftHold={n:d.rounds,armed:true};d.t=0;sfx('click');break;}}}}
    if(leftHold&&P.weapon==='pistola'&&G.mag<0){vrGun.userData.magwell.getWorldPosition(_v4);const dm=handP.distanceTo(_v4);if(dm>0.14)leftHold.armed=true;if(leftHold.armed&&dm<0.06){insertMag(leftHold.n);leftHold=null;haptic(srcL,0.8,40);}}
    if(slideGrab&&IN.lgHeld){vrGun.worldToLocal(_v4.copy(handP));slideGrab.off=clamp(_v4.z-slideGrab.z0,0,0.045);if(slideGrab.off>0.032&&!slideGrab.done){slideGrab.done=true;rack();}}
    if(!IN.lgHeld){if(leftHold){const m=makeMag();m.userData.bullet.visible=m.userData.tip.visible=leftHold.n>0;leftMag.getWorldQuaternion(m.quaternion);
        const vel=lhr.vel||_v4.set(0,0,0);dropObj(m,handP,vel,true,leftHold.n);leftHold=null;}slideGrab=null;}
    // velocidad de la mano izquierda para lanzar el cargador
    lhr.prevP=lhr.prevP||handP.clone();lhr.vel=(lhr.vel||new V3()).subVectors(handP,lhr.prevP).divideScalar(Math.max(dt,0.008));lhr.prevP.copy(handP);}
  else if(leftHold&&!IN.lgHeld){addItem('balas',leftHold.n,'gift');leftHold=null;}}
function updateHands(){for(const side of ['left','right']){const hr=hands[side];if(!hr||!hr.handRoot.parent)continue;const gp=side==='left'?padL:padR;
    const bv=i=>gp&&gp.buttons[i]?gp.buttons[i].value:0,tch=i=>!!(gp&&gp.buttons[i]&&(gp.buttons[i].touched||gp.buttons[i].pressed));const c=hr.curl;const thumb=(tch(3)||tch(4)||tch(5))?0.85:0.3;
    if(side==='right'&&P.weapon!=='manos'&&!P.inCar){c.middle=c.ring=c.pinky=1;c.thumb=P.weapon==='pistola'?1.0:0.85;c.index=P.weapon==='pistola'?(tch(0)?0.62+bv(0)*0.3:0.42):0.95;}
    else if(side==='left'&&leftHold){c.middle=c.ring=c.pinky=0.95;c.index=0.85;c.thumb=0.75;}
    else{const g=bv(1);c.middle=c.ring=c.pinky=0.15+g*0.85;c.index=tch(0)?0.35+bv(0)*0.65:0.05;c.thumb=thumb;}
    if(window.__CURL)Object.assign(c,window.__CURL);
    // las manos (y lo que llevan) no atraviesan lo sólido: el mando se frena donde el rayo pecho→mano toca pared, puerta, persiana o mueble
    {const g=hr.handRoot.parent;g.getWorldPosition(_v);hr.real=(hr.real||new V3()).copy(_v);if(inVR&&!P.inCar&&g.matrixAutoUpdate===false){camera.getWorldPosition(_v1);_v1.y-=0.18;_v2.subVectors(_v,_v1);const d=_v2.length();
        if(d>0.08){_v2.divideScalar(d);const pad=0.075;const t=rayWorld(_v1,_v2,d+pad);if(t>0.03&&t<d+pad){_v3.copy(_v2).multiplyScalar(t-pad-d);rig.getWorldQuaternion(_q).invert();_v3.applyQuaternion(_q);const e=g.matrix.elements;e[12]+=_v3.x;e[13]+=_v3.y;e[14]+=_v3.z;
            g.position.set(e[12],e[13],e[14]);g.updateMatrixWorld(true);if(!hr.blocked){hr.blocked=true;haptic(side==='left'?srcL:srcR,0.35,25);}}else hr.blocked=false;}}}
    hr.off.set(0,0,0);applyHC();poseHand(hr);
    // puertas: agarrar la manilla con el grip; con la mano libre se empujan
    const hp=hr.handRoot.parent.getWorldPosition(_v5);const free=side==='left'?!leftHold:(P.weapon==='manos');
    if(free||doorGrab[side])handDoors(side,hp,side==='left'?IN.lgDown:IN.use,side==='left'?IN.lgHeld:IN.rgHeld,frameDt);
    hr.pv=hr.pv||hp.clone();const vx=(hp.x-hr.pv.x)/Math.max(frameDt,0.008),vz=(hp.z-hr.pv.z)/Math.max(frameDt,0.008);hr.pv.copy(hp);
    if(!doorGrab[side])pushDoorsAt(hr.real.x,hr.real.z,hr.real.y,0.09,vx,vz,0.5);
    // tocar a alguien: la mano es sólida, desplaza el punto del cuerpo que toca (vivo o muerto) y el resto del cuerpo reacciona
    for(const h of H_){if(!h.active)continue;const c=h.sim[CHEST];if(Math.abs(c.x-hp.x)>1.1||Math.abs(c.z-hp.z)>1.1||Math.abs(c.y-hp.y)>1.6)continue;let hit=-1;
      for(let i=0;i<NP;i++){const q=h.sim[i];const rr=PR[i]+0.065;const dx=q.x-hp.x,dy=q.y-hp.y,dz=q.z-hp.z;const d2=dx*dx+dy*dy+dz*dz;if(d2>=rr*rr||d2<1e-7)continue;const d=Math.sqrt(d2),push=rr-d;
        if(hit<0){hit=i;if(!h.dead&&h.mode!=='phys'){enterPhys(h);}h.sleep=0;}q.x+=dx/d*push;q.y+=dy/d*push*0.4;q.z+=dz/d*push;}
      if(hit>=0){const sp=Math.hypot(vx,vz);if(sp>0.25&&sp<3)applyImp(h,_imp.set(vx*0.3,0.05,vz*0.3),hit);if(!h.dead)for(let k=0;k<NP;k++)h.kl[k]=Math.min(h.kl[k],0.6+0.4*(k!==hit));
        if(clockT-(h.touchT||0)>0.2){h.touchT=clockT;haptic(side==='left'?srcL:srcR,0.3,25);}}}}}
function placeHud(){const g=gripBySide.left;const on=inVR&&hudOn&&g&&!panel&&P.alive;wrist.visible=!!on;if(!on)return;g.getWorldPosition(_v);camera.getWorldPosition(_v1);
  // panel flotante encima de la mano izquierda, siempre mirando a la cara; se enciende y apaga pulsando el joystick izquierdo
  _v2.subVectors(_v1,_v);_v2.y=0;const l=_v2.length()||1;wrist.position.set(_v.x+_v2.x/l*0.03,_v.y+0.17,_v.z+_v2.z/l*0.03);wrist.lookAt(_v1);}
const doorGrab={left:null,right:null};const _v5=new V3(),_v6=new V3();let frameDt=0.016;
function handAng(d,hp){if(d.slide)return (hp.x-d.sx)*d.ux+(hp.z-d.sz)*d.uz;const th=Math.atan2(-(hp.z-d.hz),hp.x-d.hx);let a=(th-d.base)*d.sign;return Math.atan2(Math.sin(a),Math.cos(a));}
function handDoors(side,hp,down,held,dt){let g=doorGrab[side];const src=side==='left'?srcL:srcR;
  if(down&&!g){for(const d of DOORS){const dx=d.hx-hp.x,dz=d.hz-hp.z;if(dx*dx+dz*dz>6)continue;doorHandleWorld(d,_v6);if(_v6.distanceTo(hp)>0.3)continue;
      if(d.locked){sfx('rattle');haptic(src,0.6,80);toast('Está cerrada con llave',1.2);break;}g=doorGrab[side]={d,a0:handAng(d,hp)-(d.slide?d.off:d.ang)};d.held=side;haptic(src,0.4,30);sfx('click');break;}}
  if(!g)return;const d=g.d;if(!held){d.held=null;doorGrab[side]=null;return;}
  const prev=d.slide?d.off:d.ang;const tgt=handAng(d,hp)-g.a0;if(d.slide)d.off=clamp(tgt,0,d.maxOff);else{d.ang=clamp(tgt,0,d.maxA);d.vel=(d.ang-prev)/Math.max(dt,0.008);d.target=null;}applyDoor(d);
  if(doorHandleWorld(d,_v6).distanceTo(hp)>0.8){d.held=null;doorGrab[side]=null;}}
function update(dt){frameNo++;frameDt=dt;readInput(dt);camera.getWorldPosition(camW);const p=camW;
  if(panel)panelInput();else if(P.alive&&!P.sleeping){if(IN.inv)openPanel('inv');else if(IN.menu)openPanel('main');else if(IN.map)openPanel('map');else if(IN.status)openPanel('status');}
  if(!inVR&&!P.sleeping){const sens=0.0024;if(P.inCar)P.carYaw-=lookDX*sens;else P.yaw-=lookDX*sens;P.pitch=clamp(P.pitch-lookDY*sens,-1.35,1.35);}lookDX=lookDY=0;
  if(IN.turn&&!P.sleeping&&!panel){const a=IN.turn*dt*2.3;camera.getWorldPosition(_v);if(P.inCar)P.carYaw-=a;else P.yaw-=a;rig.rotation.y=P.inCar?P.inCar.yaw+Math.PI+P.carYaw:P.yaw;rig.updateMatrixWorld(true);camera.getWorldPosition(_v1);if(!P.inCar){rig.position.x+=_v.x-_v1.x;rig.position.z+=_v.z-_v1.z;}}
  if(IN.snap&&!P.sleeping){camera.getWorldPosition(_v);if(P.inCar)P.carYaw-=IN.snap*Math.PI/6;else P.yaw-=IN.snap*Math.PI/6;rig.rotation.y=P.inCar?P.inCar.yaw+Math.PI+P.carYaw:P.yaw;rig.updateMatrixWorld(true);camera.getWorldPosition(_v1);if(!P.inCar){rig.position.x+=_v.x-_v1.x;rig.position.z+=_v.z-_v1.z;}}
  if(P.alive&&!P.sleeping&&!panel){if(IN.use&&!(inVR&&(doorGrab.right||doorGrab.left||P.inCar)))doInteract();if(IN.weapon&&P.inCar&&inVR)exitCar();
    if(IN.light&&P.inCar){IN.light=false;P.carGun=!P.carGun;toast(P.carGun?'Modo disparo: el gatillo dispara':'Modo conducción: el gatillo acelera',1.5);}
    if(IN.weapon&&!P.inCar){P.weapon=P.weapon==='manos'?'bate':P.weapon==='bate'?'pistola':'manos';toast({manos:'Manos libres',bate:'Bate',pistola:'Pistola'}[P.weapon],1.5);}
    if(IN.eject&&P.weapon==='pistola')ejectMag(true);if(IN.reload&&P.weapon==='pistola')reloadFlat();if(IN.light){P.light=!P.light;sfx('click');}if(IN.pee)doPee();
    if(IN.crouch){P.crouchToggle=!P.crouchToggle;toast(P.crouchToggle?'Te agachas':'Te levantas',1.2);}if(IN.hud){hudOn=!hudOn;sfx('click');}if(IN.recenter&&!P.inCar)recenter();
    if((!P.inCar||P.carGun)&&IN.attackP){if(P.weapon==='pistola'){if(inVR&&gripBySide.right){vrGun.userData.muzzle.getWorldPosition(_o2);_d2.set(0,0,-1).applyQuaternion(vrGun.getWorldQuaternion(_q));fireGun(_o2,_d2);}else{camera.getWorldPosition(_o2);camera.getWorldDirection(_d2);_o2.addScaledVector(_d2,0.3);fireGun(_o2,_d2);}}else meleeFlat();}}
  P.crouchOff+=((inVR&&P.crouchToggle&&!P.inCar?0.75:0)-P.crouchOff)*Math.min(1,dt*7);if(P.crouchOff<0.004)P.crouchOff=0;P.crouch=P.crouchToggle||(inVR&&camera.position.y<1.12);
  if(P.alive&&!P.sleeping){if(P.inCar)driveCar(P.inCar,panel?0:dt);
    else if(!panel){camera.getWorldDirection(_d2);_d2.y=0;if(_d2.lengthSq()<1e-6)_d2.set(0,0,-1);_d2.normalize();const rx=-_d2.z,rz=_d2.x;let mx=IN.mx,my=IN.my;const ml=Math.hypot(mx,my);if(ml>1){mx/=ml;my/=ml;}
      const spr=IN.sprint&&P.energy>5&&my>0.3&&!P.crouch;P.sprinting=spr&&ml>0.2;const sp=(spr?4.8:P.crouch?1.2:2.3)*(P.energy<12?0.6:1)*(P.hp<25?0.75:1)*(invWeight()>invCap()?0.65:1);
      const fy=P.feetY!==undefined?P.feetY:rig.position.y;P.vx=(_d2.x*my+rx*mx)*sp;P.vz=(_d2.z*my+rz*mx)*sp;const pt={x:p.x+P.vx*dt,z:p.z+P.vz*dt};collide(pt,0.3,fy+0.35,fy+(inVR?clamp(p.y-fy+0.08,0.6,1.95):(P.crouch?1.0:1.75)));
      for(const c of cars){const ex=pt.x-c.x,ez=pt.z-c.z,d=Math.hypot(ex,ez);if(d<c.halfW+1&&d>0){pt.x=c.x+ex/d*(c.halfW+1);pt.z=c.z+ez/d*(c.halfW+1);}}
      rig.position.x+=pt.x-p.x;rig.position.z+=pt.z-p.z;if(ml>0.2){P.stepT-=dt*sp;if(P.stepT<=0){P.stepT=0.8;makeNoise(p.x,p.z,P.crouch?2:P.sprinting?14:6);}}}}
  if(P.inCar){const c=P.inCar;const s=Math.sin(c.yaw),co=Math.cos(c.yaw);const lx=c.seat.x,lz=c.seat.z;const camY=inVR?camera.position.y:1.2;rig.position.set(c.x+lx*co+lz*s,c.y+c.eye-camY,c.z-lx*s+lz*co);rig.rotation.y=c.yaw+Math.PI+P.carYaw;}
  else{rig.rotation.y=P.yaw;let fy=P.feetY===undefined?rig.position.y:P.feetY;const gy=surfY(p.x,p.z,fy);if(gy-fy<0.7)fy+=(gy-fy)*Math.min(1,dt*12);P.feetY=fy;rig.position.y=fy-P.crouchOff+(P.hOff||0);if(engine)engine.g.gain.value*=0.9;
    // cabeza dentro de una pared: atrás y oscuro
    if(!P.inCar&&insideVol(p.x,p.y,p.z)){rig.position.x+=P.lastSafe.x-p.x;rig.position.z+=P.lastSafe.z-p.z;blackT=Math.max(blackT,0.25);}else P.lastSafe.copy(p);}
  if(!inVR){camera.position.set(0,P.inCar?1.2:(P.crouch?1.05:1.65),0);camera.rotation.set(P.pitch,0,0);}
  const gmps=P.sleeping?80:1440/(S.dayMin*60);const gm=dt*gmps;gameMin+=gm;if(P.alive)updateNeeds(gm/60);
  if(P.sleeping){P.sleepLeft-=gm;if(P.sleepLeft<=0||P.energy>=100){P.sleeping=false;toast('Te despiertas descansado');P.mood=Math.min(100,P.mood+(P.bedSleep?14:6));}}
  if(P.peeT>0){P.peeT-=dt;P.bladder=Math.max(0,P.bladder-P.peeStart/6*dt*1.6);camera.getWorldPosition(_v);camera.getWorldDirection(_v1);const fx=_v1.x,fz=_v1.z,fl=Math.hypot(fx,fz)||1;
    for(let k=0;k<4;k++){const i=peeI++%260;const gy=surfY(_v.x,_v.z,_v.y-1.5);peeP[i]={p:new V3(_v.x+fx/fl*0.2,gy+Math.max(0.7,(_v.y-gy)*0.55),_v.z+fz/fl*0.2),v:new V3(fx/fl*2.1+R(-0.08,0.08),0.5+clamp(_v1.y,-0.6,0.4)*1.5+R(-0.05,0.05),fz/fl*2.1+R(-0.08,0.08)),life:1.2};}
    if(P.peeT<=0){P.bladder=0;P.mood=Math.min(100,P.mood+(P.peeToilet?5:1));if(!P.peeToilet)makeNoise(p.x,p.z,6);}}
  for(let i=0;i<peeP.length;i++){const q=peeP[i];if(!q)continue;if(q.life<=0){peeMesh.setMatrixAt(i,ZM);continue;}q.life-=dt;q.v.y-=9.81*dt;q.p.addScaledVector(q.v,dt);const gy=surfY(q.p.x,q.p.z,q.p.y);
    if(q.p.y<gy){q.life=0;if(Math.random()<0.04){let pd=puddles.find(u=>u.p.distanceTo(q.p)<0.4);if(!pd&&puddles.length<8){const m=new THREE.Mesh(new THREE.CircleGeometry(1,14),new THREE.MeshBasicMaterial({color:0xc9b03a,transparent:true,opacity:0.45,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(q.p.x,gy+0.012,q.p.z);m.scale.setScalar(0.05);scene.add(m);pd={p:m.position,m,s:0.05,t:90};puddles.push(pd);}if(pd){pd.s=Math.min(0.5,pd.s+0.02);pd.m.scale.setScalar(pd.s);}}}
    _m.makeTranslation(q.p.x,q.p.y,q.p.z);peeMesh.setMatrixAt(i,q.life>0?_m:ZM);}peeMesh.instanceMatrix.needsUpdate=true;
  for(let i=puddles.length-1;i>=0;i--){puddles[i].t-=dt;if(puddles[i].t<=0){scene.remove(puddles[i].m);puddles.splice(i,1);}}
  for(const pl of pools){if(pl.s<pl.max){pl.s+=dt*0.08;pl.m.scale.setScalar(pl.s);}}
  updateChars(dt,p);sepBodies();managePop(p,false);
  for(const c of cars)if(c!==P.inCar&&(Math.abs(c.speed)>0.05||Math.abs(c.vLat||0)>0.05||Math.abs(c.rollV||0)>0.01)){c.speed*=Math.pow(0.3,dt);c.vLat=(c.vLat||0)*Math.pow(0.2,dt);c.steer=0;moveCar(c,dt,false);}
  chunkT-=dt;if(chunkT<=0){chunkT=0.4;const VD=(S.view||3000)+40;for(const c of chunks.values()){const v=Math.hypot(c.cx-p.x,c.cz-p.z)<(c.inner?(inVR?60:75):Math.min(VD,inVR?2000:3000));for(const m of c.meshes)m.visible=v;}for(const c of cars)c.g.visible=Math.hypot(c.x-p.x,c.z-p.z)<(inVR?90:130);
    for(const d of DOORS)d.g.visible=Math.abs(d.hx-p.x)<38&&Math.abs(d.hz-p.z)<38;for(const pn of PANES)pn.m.visible=Math.abs(pn.cx-p.x)<45&&Math.abs(pn.cz-p.z)<45;}
  updateWeapons(dt);updateHands();placeHud();updateBody(dt);stepDropped(dt);
  WTIME.value=clockT;if(S.gore)for(const h of H_){if(!h.active||!h.holder.visible)continue;if(h.woundI)updateWoundGravity(h);if(!h.bleeds||!h.bleeds.length)continue;for(const b of h.bleeds){if(clockT>b.until)continue;b.t-=dt;if(b.t<=0){b.t=R(0.12,0.35)*(1+(clockT-(b.until-8))*0.1);_v.copy(h.sim[b.i]).add(b.o);spray(_v,_v1.set(R(-0.1,0.1),-0.3,R(-0.1,0.1)),0.5);}}}
  for(let i=0;i<parts.length;i++){const q=parts[i];if(!q)continue;if(q.life<=0){blood.setMatrixAt(i,ZM);continue;}q.life-=dt;
    if(!q.ground){q.v.y-=9.81*dt;q.v.multiplyScalar(1-dt*0.6);q.p.addScaledVector(q.v,dt);const gy=surfY(q.p.x,q.p.z,q.p.y)+0.004;
      if(q.p.y<gy){q.p.y=gy;q.ground=true;q.life=R(25,40);q.rot=R(0,6.28);q.r*=R(2.4,3.6);}
      const sp=q.v.length();_bv.copy(q.v).divideScalar(sp||1);_bq.setFromUnitVectors(UP,sp>0.01?_bv:UP);_bs.set(q.r,q.r*(1+Math.min(sp,5)*0.35),q.r);}
    else{_bq.setFromAxisAngle(UP,q.rot);_bs.set(q.r*1.3,0.0012,q.r);}
    _m.compose(q.p,_bq,_bs);blood.setMatrixAt(i,_m);}blood.instanceMatrix.needsUpdate=true;
  for(let i=0;i<dps.length;i++){const q=dps[i];if(!q)continue;if(q.life<=0){dust.setMatrixAt(i,ZM);continue;}q.life-=dt;q.v.y-=4*dt;q.p.addScaledVector(q.v,dt);_m.makeTranslation(q.p.x,q.p.y,q.p.z);dust.setMatrixAt(i,q.life>0?_m:ZM);}dust.instanceMatrix.needsUpdate=true;
  for(const t of tracers)if(t.t>0){t.t-=dt;t.l.material.opacity=Math.max(0,t.t/0.09);}
  for(let i=noises.length-1;i>=0;i--){noises[i].t-=dt;if(noises[i].t<=0)noises.splice(i,1);}
  stepDoors(dt);if(!P.inCar)pushDoorsAt(p.x,p.z,rig.position.y+0.9,0.34,P.vx||0,P.vz||0,1);
  for(const h of H_){if(!h.active||h.dead||h.mode!=='kin'||h.speed<0.2)continue;if(Math.abs(h.x-p.x)>25||Math.abs(h.z-p.z)>25)continue;pushDoorsAt(h.x,h.z,h.y+0.9,0.32,h.vx||0,h.vz||0,0.7);}
  hurtFx=Math.max(0,hurtFx-dt*0.8);if(blackT>0)blackT-=dt;
  const dark=P.sleeping?0.92:(!P.alive?0.75:blackT>0?0.95:0);fxSphere.material.color.setHex(dark>0?0x000000:0x990000);
  fxSphere.material.opacity=Math.max(dark,hurtFx+(P.hp<25?0.12+Math.sin(clockT*4)*0.05:0)+(P.sick>50?0.05:0));fxSphere.visible=fxSphere.material.opacity>0.01;
  fxDiv.style.background=dark>0?'#000':'#900';fxDiv.style.opacity=inVR?0:fxSphere.material.opacity;
  if(!P.alive){P.deadT+=dt;if(P.deadT>6){resetPlayer();toast('Vuelves a empezar junto al Mercat del Raval.',4);}}
  if(toastT>0){toastT-=dt;if(toastT<=0){toastDiv.style.display='none';toastPlane.visible=false;}}
  if(panel&&inVR){camera.getWorldPosition(_v);pnlMesh.lookAt(_v);}
  promptT-=dt;if(promptT<=0){promptT=0.2;const it=P.alive?findInteract():null;prompt=it?it.text:'';}
  hudT-=dt;if(hudT<=0){hudT=0.16;drawHUD();if(inVR)hudTex.needsUpdate=true;if(panel&&(panel.mode==='status'||panel.mode==='map'))drawPanel();if(inVR&&panel)pnlTex.needsUpdate=true;}
  if(!inVR&&panel)pnlTex.needsUpdate=true;}
function loop(){if(DEBUG.has('shot')&&!window.__go)return;const now=performance.now()/1000;const dt=Math.min(0.05,now-last);last=now;clockT+=dt;
  if(started)update(dt);else{P.yaw+=dt*0.05;rig.rotation.y=P.yaw;camera.position.set(0,14,0);camera.rotation.set(-0.12,0,0);camera.getWorldPosition(camW);}
  if(window.__freeCam){const f=window.__freeCam;if(body)body.holder.visible=false;viewModel.visible=false;fxSphere.visible=false;blackT=0;rig.position.set(f.x,f.y,f.z);rig.rotation.y=f.yaw;camera.position.set(0,0,0);camera.rotation.set(f.pitch,0,0);camera.getWorldPosition(camW);}
  updateSky();renderer.render(scene,camera);}

// =====================================================================
// INICIO
// =====================================================================
const startEl=document.getElementById('start'),vrmsg=document.getElementById('vrmsg'),bvr=document.getElementById('bvr'),bflat=document.getElementById('bflat');
let worldReady=false;
function enableStart(){if(!modelsReady)return;bflat.disabled=false;bvr.disabled=!navigator.xr;}
function begin(vr){initAudio();started=true;startEl.style.display='none';gameMin=S.startHour*60;
  if(!worldReady){worldReady=true;setupBody();placeCars();placeWrecks();populateNPCs();placeCorpses();}
  resetPlayer();camera.getWorldPosition(camW);managePop(camW,true);
  if(!vr){hudC.style.display='block';document.getElementById('cross').style.display='block';if(isTouch){touchUI.style.display='block';document.querySelectorAll('.mn').forEach(b=>b.style.display='block');}}
  toast('Día 1. Eixample de Barcelona. Al lado tienes el Mercat del Ninot: una base de supervivientes. Habla con su líder.',7);}
bflat.onclick=()=>begin(false);
if(!navigator.xr)vrmsg.textContent='Este navegador no tiene WebXR. Abre esta página en el navegador de las Quest 3.';
else navigator.xr.isSessionSupported('immersive-vr').then(ok=>{if(!ok)vrmsg.textContent='Aquí no hay visor VR. En las Quest 3 este botón entra en realidad virtual.';}).catch(()=>{});
bvr.onclick=async()=>{initAudio();try{const ses=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor','bounded-floor','hand-tracking']});
    renderer.xr.setFoveation(0.5);await renderer.xr.setSession(ses);inVR=true;camera.position.set(0,0,0);camera.rotation.set(0,0,0);viewModel.visible=false;
    ses.addEventListener('end',()=>{inVR=false;viewModel.visible=true;hudC.style.display='block';document.getElementById('cross').style.display='block';closePanel();});begin(true);}
  catch(e){vrmsg.innerHTML='No se ha podido abrir la VR ('+(e&&e.name||'error')+'). Si estás dentro de claude.ai, la página bloquea la VR: abre el juego desde tu enlace de GitHub Pages.';}};
// arranque: construir Barcelona y descargar recursos
setLoad('w','Construyendo Barcelona…');
setTimeout(()=>{try{buildWorld();buildLootGrid();setLoad('w',`✔ Barcelona generada: ${BLOCKS.length} manzanas, ${shopCount} locales con interior, ${BASES.length} bases`);}catch(e){console.error(e);setLoad('w','❌ Error generando la ciudad: '+e.message);}
  resetPlayer();camera.getWorldPosition(camW);renderer.setAnimationLoop(loop);loadModels();},50);
// ---- ganchos de depuración (solo con ?shot=1) ----
if(DEBUG.has('shot')){window.__T={setHour:h=>{gameMin=Math.floor(gameMin/1440)*1440+h*60;},addWound,SHOPS,physStep,driveBones,carInterior,chunks,BLOCKS,spray,makeCar,moveCar,get poiUsed(){return POIUSED.size},get signN(){return signN},THREE,scene,camera,rig,renderer,P,G,S,BELT,H_,BASES,SHOPS,LOOT,DOORS,PANES,cars,INST,surfY,collide,insideVol,begin,hands,gripBySide,setVR:v=>{inVR=v;},keys,pressed,IN,
  get started(){return started},get modelsReady(){return modelsReady},get leftHold(){return leftHold},spawnChar,hitChar,doInteract,findInteract,vrGun,vrBat,beltMags,leftMag,setGame:m=>{gameMin=m},get gameMin(){return gameMin},
  applyDoor,TPL,poseHand,gl,viewModel,updateBody,get body(){return body},setupHands,applyImp,enterPhys,despawn,BLOCKS,VSTR,HSTR,toast};
  window.__ready=()=>texDone>=texPending&&modelsReady;}
