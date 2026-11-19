// =====================================================================
// RIFLE DE CERROJO (AWP, modelo que pasaste): todo a mano en VR
//  · cargador extraíble (agarra el cargador con la izquierda; los de repuesto en el cinturón)
//  · cerrojo: levanta la palanca, tira atrás (sale el casquillo o la bala), empuja adelante (mete la siguiente) y bájala
//  · solo dispara con el cerrojo cerrado y abajo y bala en la recámara
//  · agarrando el guardamanos con la izquierda se apunta a dos manos; mira telescópica con aumento real
// =====================================================================
const RF={mag:5,chamber:true,spent:false,lift:0,back:0,kick:0,stroke:0,auto:0};let RBELT=[5,5];let boltGrab=null,foreGrab=false;
const RFMAG=5;
// cargador del AWP (caja negra de 5 cartuchos .338)
function makeRMag(){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.075,0.085),polySmooth);body.position.y=-0.0375;g.add(body);
  const lips=new THREE.Mesh(new THREE.BoxGeometry(0.022,0.006,0.07),gunMetalMat);lips.position.y=0.003;g.add(lips);
  const bul=new THREE.Mesh(new THREE.CylinderGeometry(0.0065,0.0065,0.06,10),brassMat);bul.rotation.x=Math.PI/2;bul.position.set(0,0.008,0);g.add(bul);
  const tip=new THREE.Mesh(new THREE.ConeGeometry(0.0055,0.02,10),new THREE.MeshStandardMaterial({color:0x6a4a2a,metalness:0.9,roughness:0.35}));tip.rotation.x=-Math.PI/2;tip.position.set(0,0.008,-0.04);g.add(tip);
  g.userData.bullet=bul;g.userData.tip=tip;g.userData.rifle=true;return g;}
// grupo del rifle: origen en la empuñadura, cañón hacia -z. Marcas medidas sobre el modelo.
function makeAWPGroup(){const g=new THREE.Group();const mk=(x,y,z)=>{const o=new THREE.Object3D();o.position.set(x,y,z);g.add(o);return o;};
  const flash=new THREE.Mesh(new THREE.SphereGeometry(0.05,8,6),new THREE.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:0}));flash.position.set(0,0.12,-1.06);g.add(flash);
  g.userData={flash,muzzle:mk(0,0.12,-1.04),magwell:mk(0,0.0,-0.17),bolt:mk(0.06,0.077,-0.08),port:mk(0.03,0.115,-0.15),fore:mk(0,0.05,-0.42),eye:mk(0,0.181,0.03),scopeF:mk(0,0.181,-0.36)};
  g.userData.ready=false;return g;}
const RIFLES=[];
function fitAWP(gun,src){const sc=SkeletonUtils.clone(src);sc.rotation.y=Math.PI;sc.position.set(0,-0.114,0.048);gun.add(sc);gun.updateMatrixWorld(true);
  let sk=null;sc.traverse(o=>{if(o.isSkinnedMesh){sk=o;o.frustumCulled=false;const m=o.material;if(m){m.envMapIntensity=0.8;pbr(m);}}});if(!sk)return;
  const B={};for(const b of sk.skeleton.bones){const n=b.name;if(/bolt_rail/.test(n))B.rail=b;else if(/bolt_action/.test(n))B.act=b;else if(/clip/.test(n))B.clip=b;else if(/trigger/.test(n))B.trig=b;}
  const D={gun,sk,B,rest:{}};for(const k in B)D.rest[k]={p:B[k].position.clone(),q:B[k].quaternion.clone()};gun.userData.ready=true;RIFLES.push(D);}
// pose de los huesos: el carril del cerrojo recorre 3,74" (9,5 cm) en su eje y; la palanca gira 0,64 rad sobre su eje y (animación original)
function poseRifle(D,trig){const B=D.B;
  if(B.rail)B.rail.position.y=D.rest.rail.p.y-RF.back*3.74;
  if(B.act)B.act.quaternion.copy(D.rest.act.q).multiply(_q.setFromAxisAngle(_v.set(0,1,0),-0.64*RF.lift));
  if(B.clip)B.clip.scale.setScalar(RF.mag>=0?1:0.0001);
  if(B.trig)B.trig.quaternion.copy(D.rest.trig.q).multiply(_q.setFromAxisAngle(_v.set(0,0,1),-trig*0.3));}
const vrRifle=makeAWPGroup(),vmRifle=makeAWPGroup();vrWeapon.add(vrRifle);vrRifle.rotation.x=HFIT.gr;vrRifle.position.set(0,HFIT.gy,HFIT.gz);const RF_BASEQ=vrRifle.quaternion.clone();
viewModel.add(vmRifle);vmRifle.position.set(0.0,-0.06,0.12);vmRifle.rotation.set(0.02,0.04,0);vmRifle.visible=false;vrRifle.visible=false;
const leftRMag=makeRMag();leftRMag.visible=false;leftRMag.rotation.x=-Math.PI/2;leftRMag.position.set(0,0,-0.04);
const beltRMags=[];for(let i=0;i<2;i++){const m=makeRMag();m.position.set(0,0.06,i*0.06-0.03);m.rotation.y=Math.PI/2;m.scale.setScalar(0.9);beltPouch.add(m);beltRMags.push(m);m.visible=false;}
// casquillo grande del .338
const rcasingGeo=new THREE.CylinderGeometry(0.0068,0.0068,0.07,8);
function ejectRound(live){const gun=inVR?vrRifle:vmRifle;gun.userData.port.getWorldPosition(_v);const m=new THREE.Mesh(rcasingGeo,brassMat);gun.getWorldQuaternion(m.quaternion);m.quaternion.multiply(_q.setFromAxisAngle(_v1.set(1,0,0),Math.PI/2));
  _v1.set(1,0.7,0.3).applyQuaternion(gun.getWorldQuaternion(_q2)).multiplyScalar(R(1.4,2.2));dropObj(m,_v,_v1,false);if(live&&!inVR)addItem('balas',1,'gift');}
const _q2=new Q4();
// cerrojo: transiciones (abrir saca lo que haya en la recámara; cerrar mete la siguiente del cargador)
function boltSet(lift,back){const pb=RF.back;if(back>0.01)lift=1;// con el cerrojo atrás la palanca va arriba
  if(pb<0.01&&back>=0.01&&RF.lift<0.98)back=0;// no se puede tirar sin levantar la palanca
  RF.lift=clamp(lift,0,1);RF.back=clamp(back,0,1);
  if(pb<0.9&&RF.back>=0.9&&RF.stroke===0){RF.stroke=1;sfx('boltback');haptic(srcL,0.7,40);if(RF.chamber||RF.spent){ejectRound(RF.chamber&&!RF.spent);RF.chamber=false;RF.spent=false;}}
  if(RF.stroke===1&&RF.back<0.05){RF.stroke=0;sfx('boltfwd');haptic(srcL,0.6,40);if(RF.mag>0&&!RF.chamber){RF.mag--;RF.chamber=true;}}}
function rifleReady(){return RF.lift<0.02&&RF.back<0.01;}
function fireRifle(o,d){if(!rifleReady()){sfx('click');if(!inVR)toast('Cierra el cerrojo');return;}if(!RF.chamber||RF.spent){sfx('click');haptic(srcR,0.2,15);if(!inVR){if(RF.spent||RF.mag>0)RF.auto=0.01;else toast('Sin balas: pulsa R');}return;}
  RF.chamber=false;RF.spent=true;RF.kick=1;sfx('rifle');makeNoise(o.x,o.z,140);haptic(srcR,1,110);haptic(srcL,0.8,90);const gun=inVR?vrRifle:vmRifle;gun.userData.flash.material.opacity=1;
  let tb=rayWorld(o,d,400);const pn=rayPanes(o,d,tb);if(pn&&pn.t<tb){breakPane(pn.p);tb=rayWorld(o,d,400);}
  // atraviesa a la primera persona si no le da en la cabeza
  let skip=null;for(let k=0;k<2;k++){const r=rayChars(o,d,tb,skip);if(!r.h){if(k===0){const td=dynShot(o,d,tb);_e2.copy(o).addScaledVector(d,td>=0?td:tb);impactPuff(_e2);tracer(o,_e2);}break;}
    _e2.copy(o).addScaledVector(d,r.t);if(k===0)tracer(o,_e2);const head=r.part==='head';hitChar(r.h,r.part,head?999:160,_imp.copy(d).multiplyScalar(head?9:7),r.pi,'player',_e2,d);spray(_e2,d,head?24:14);sfx(head?'hithead':'hit',0.7);
    if(head)break;skip=r.h;}
  if(!inVR)RF.auto=0.45;}// en pantalla el cerrojo se acciona solo
function reloadRifleFlat(){if(RF.mag>=RFMAG&&RF.chamber)return;if(RF.mag>0)addItem('balas',RF.mag,'gift');RF.mag=-1;const n=takeItem('balas',RFMAG);if(!n){toast('No te quedan balas');return;}RF.mag=n;sfx('magin');
  if(!RF.chamber||RF.spent){RF.auto=0.3;}toast(`Recargas el rifle (${RF.mag}${RF.chamber&&!RF.spent?'+1':''})`);}
function refillRBelt(){for(let i=0;i<2;i++)if(RBELT[i]===null||RBELT[i]===0){const n=takeItem('balas',RFMAG);if(n)RBELT[i]=n;else if(RBELT[i]===0)RBELT[i]=null;}}
// mira telescópica: una cámara de campo estrecho pinta en la lente del ocular cuando acercas el ojo
const SCOPE={rt:null,cam:new THREE.PerspectiveCamera(3.2,1,0.5,900),lens:null,on:false,t:0};
{const g=new THREE.CircleGeometry(0.0215,24);const m=new THREE.MeshBasicMaterial({color:0x101418});SCOPE.lens=new THREE.Mesh(g,m);SCOPE.lens.position.set(0,0.181,0.0075);vrRifle.add(SCOPE.lens);
  // retícula Mil-Dot dibujada encima de la imagen
  const rc=cTex(256,256,(g2,w,h)=>{g2.clearRect(0,0,w,h);g2.strokeStyle='rgba(0,0,0,.95)';g2.lineWidth=2;g2.beginPath();g2.moveTo(0,h/2);g2.lineTo(w,h/2);g2.moveTo(w/2,0);g2.lineTo(w/2,h);g2.stroke();g2.lineWidth=7;g2.beginPath();g2.moveTo(0,h/2);g2.lineTo(w*0.3,h/2);g2.moveTo(w*0.7,h/2);g2.lineTo(w,h/2);g2.moveTo(w/2,h*0.7);g2.lineTo(w/2,h);g2.stroke();
    g2.fillStyle='#000';for(let i=-4;i<=4;i++){if(!i)continue;g2.beginPath();g2.arc(w/2+i*13,h/2,2.2,0,7);g2.fill();g2.beginPath();g2.arc(w/2,h/2+i*13,2.2,0,7);g2.fill();}
    const v=g2.createRadialGradient(w/2,h/2,w*0.36,w/2,h/2,w*0.5);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,1)');g2.fillStyle=v;g2.fillRect(0,0,w,h);},{});
  const rm=new THREE.Mesh(new THREE.CircleGeometry(0.0215,24),new THREE.MeshBasicMaterial({map:rc,transparent:true,depthWrite:false}));rm.position.set(0,0.181,0.008);vrRifle.add(rm);SCOPE.ret=rm;}
function scopeRender(){if(!(inVR&&P.weapon==='rifle'&&vrRifle.visible&&vrRifle.userData.ready)){SCOPE.on=false;return;}
  vrRifle.userData.eye.getWorldPosition(_v);camera.getWorldPosition(_v1);const near=_v.distanceTo(_v1)<0.2;
  if(!near){if(SCOPE.on){SCOPE.lens.material.map=null;SCOPE.lens.material.color.set(0x101418);SCOPE.lens.material.needsUpdate=true;SCOPE.on=false;}return;}
  if(!SCOPE.rt)SCOPE.rt=new THREE.WebGLRenderTarget(384,384);if(!SCOPE.on){SCOPE.lens.material.map=SCOPE.rt.texture;SCOPE.lens.material.color.set(0xffffff);SCOPE.lens.material.needsUpdate=true;SCOPE.on=true;}
  SCOPE.t^=1;if(SCOPE.t)return;// a medio ritmo para no ahogar las Quest
  vrRifle.userData.scopeF.getWorldPosition(SCOPE.cam.position);vrRifle.getWorldQuaternion(SCOPE.cam.quaternion);SCOPE.cam.updateMatrixWorld(true);
  const xr=renderer.xr.enabled;renderer.xr.enabled=false;const vis=vrWeapon.visible;vrWeapon.visible=false;const cur=renderer.getRenderTarget();renderer.setRenderTarget(SCOPE.rt);renderer.render(scene,SCOPE.cam);renderer.setRenderTarget(cur);vrWeapon.visible=vis;renderer.xr.enabled=xr;}
// a dos manos: la izquierda en el guardamanos orienta el rifle (de la empuñadura hacia la mano izquierda)
const _rf1=new V3(),_rf2=new V3(),_rq=new Q4(),_rq2=new Q4();
function rifleTwoHand(handP){vrRifle.quaternion.copy(RF_BASEQ);vrRifle.updateMatrixWorld(true);if(!handP)return;
  vrRifle.getWorldPosition(_rf1);const fl=vrRifle.userData.fore.getWorldPosition(_rf2);const cur=fl.sub(_rf1).normalize();const want=_v4.copy(handP).sub(_rf1);if(want.length()<0.2)return;want.normalize();
  _rq.setFromUnitVectors(cur,want);vrRifle.getWorldQuaternion(_rq2);_rq2.premultiply(_rq);vrRifle.parent.getWorldQuaternion(_rq).invert();vrRifle.quaternion.copy(_rq.multiply(_rq2));}
// manejo con la mano izquierda (lo llama updateWeapons): cerrojo, cargador, guardamanos
function rifleLeft(handP,showBelt){const u=vrRifle.userData;
  if(IN.lgDown&&!leftHold&&!boltGrab){
    u.bolt.getWorldPosition(_v4);if(handP.distanceTo(_v4)<0.08){vrRifle.worldToLocal(_v4.copy(handP));boltGrab={p0:_v4.clone(),l0:RF.lift,b0:RF.back};haptic(srcL,0.4,25);return true;}
    if(RF.mag>=0){u.magwell.getWorldPosition(_v4);if(handP.distanceTo(_v4)<0.09){leftHold={n:RF.mag,armed:false,rifle:true};RF.mag=-1;sfx('magout');haptic(srcL,0.6,40);return true;}}
    if(showBelt){for(let i=0;i<2;i++){beltRMags[i].getWorldPosition(_v4);if(RBELT[i]!==null&&handP.distanceTo(_v4)<0.16){leftHold={n:RBELT[i],armed:true,rifle:true};RBELT[i]=null;sfx('click');haptic(srcL,0.5,30);return true;}}}
    for(const d of dropped){if(d.rounds===undefined||!d.o.userData.rifle)continue;if(d.o.position.distanceTo(handP)<0.18){leftHold={n:d.rounds,armed:true,rifle:true};d.t=0;sfx('click');return true;}}
    u.fore.getWorldPosition(_v4);vrRifle.worldToLocal(_v3.copy(handP));if(_v3.z<-0.22&&_v3.z>-0.75&&Math.abs(_v3.x)<0.09&&_v3.y>-0.08&&_v3.y<0.16){foreGrab=true;haptic(srcL,0.3,20);return true;}}
  if(boltGrab&&IN.lgHeld){vrRifle.worldToLocal(_v4.copy(handP));const dy=_v4.y-boltGrab.p0.y,dz=_v4.z-boltGrab.p0.z;
    const lift=boltGrab.b0>0.01?1:clamp(boltGrab.l0+dy/0.035,0,1);const back=clamp(boltGrab.b0+dz/0.095,0,1);boltSet(lift,RF.lift>=0.98||boltGrab.b0>0.01?back:0);
    if(RF.back<0.01&&dz<0.005&&boltGrab.b0>0.01){boltGrab.b0=0;boltGrab.p0.copy(_v4);boltGrab.l0=1;}}// cerrado del todo: ahora bajar la palanca
  if(leftHold&&leftHold.rifle&&RF.mag<0){u.magwell.getWorldPosition(_v4);const dm=handP.distanceTo(_v4);if(dm>0.14)leftHold.armed=true;if(leftHold.armed&&dm<0.07){RF.mag=leftHold.n;leftHold=null;sfx('magin');haptic(srcL,0.8,40);haptic(srcR,0.6,40);}}
  if(!IN.lgHeld){boltGrab=null;foreGrab=false;}
  return false;}
// mira en pantalla (botón derecho con el ratón capturado)
const scopeOverlay=document.createElement('div');scopeOverlay.style.cssText='position:fixed;inset:0;pointer-events:none;display:none;z-index:5;background:radial-gradient(circle at 50% 50%,rgba(0,0,0,0) 0,rgba(0,0,0,0) 38vmin,#000 39vmin);';
scopeOverlay.innerHTML='<div style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:#000;transform:translateX(-1px)"></div><div style="position:absolute;top:50%;left:0;right:0;height:2px;background:#000;transform:translateY(-1px)"></div>';document.body.appendChild(scopeOverlay);
