
// =====================================================================
// MODELOS EXTERNOS
// =====================================================================
const gl=new GLTFLoader();
const TJS=['assets/models/'];
const HAND_BASE=['assets/models/hand_'];
async function loadAny(urls){for(const u of urls){try{return await gl.loadAsync(u);}catch(e){console.warn('No carga',u);}}return null;}
const HEAD=0,CHEST=1,PELVIS=2,LSH=3,RSH=4,LHIP=5,RHIP=6,LELB=7,LHAND=8,RELB=9,RHAND=10,LKNEE=11,LFOOT=12,RKNEE=13,RFOOT=14,NP=15;
const BN=['Head','Neck','Hips','LeftArm','RightArm','LeftUpLeg','RightUpLeg','LeftForeArm','LeftHand','RightForeArm','RightHand','LeftLeg','LeftFoot','RightLeg','RightFoot'];
const EXTRA=['Spine','Spine1','Spine2','LeftShoulder','RightShoulder'];
const BIPMAP={'Pelvis':'Hips','Spine':'Spine','Spine1':'Spine1','Spine2':'Spine2','Neck':'Neck','Head':'Head','L Clavicle':'LeftShoulder','L UpperArm':'LeftArm','L Forearm':'LeftForeArm','L Hand':'LeftHand','L Thigh':'LeftUpLeg','L Calf':'LeftLeg','L Foot':'LeftFoot',
  'R Clavicle':'RightShoulder','R UpperArm':'RightArm','R Forearm':'RightForeArm','R Hand':'RightHand','R Thigh':'RightUpLeg','R Calf':'RightLeg','R Foot':'RightFoot'};
const cleanName=n=>{n=n.replace(/^mixamorig[:_]?/i,'');const m=/^Bip01[ _](.*)$/.exec(n);if(m){const k=m[1].replace(/_/g,' ');return BIPMAP[k]||('bip_'+k);}return n;};
const TPL={};let CHAR_TPLS=[];let ferrariTpl=null;const HANDTPL={};let CARTPL=null,CARVAN=null;
const _fx=new V3(),_fy=new V3(),_fz=new V3(),_fm=new M4();
function frameQ(up,side,out){_fy.copy(up).normalize();_fx.copy(side).addScaledVector(_fy,-side.dot(_fy));if(_fx.lengthSq()<1e-8)_fx.set(1,0,0);_fx.normalize();_fz.crossVectors(_fx,_fy);_fm.makeBasis(_fx,_fy,_fz);return out.setFromRotationMatrix(_fm);}
function prepTpl(gltf,name){if(!gltf)return null;const root=gltf.scene;root.updateMatrixWorld(true);const bones={};
  root.traverse(o=>{if(o.isBone)bones[cleanName(o.name)]=o;if(o.isMesh)o.frustumCulled=false;});
  for(const b of BN.concat(EXTRA))if(!bones[b])return null;
  // esqueletos tipo Biped (Rocketbox): muslos cuelgan de Spine y clavículas de Neck → se recolocan sin mover nada
  for(const [c,pn] of [['LeftUpLeg','Hips'],['RightUpLeg','Hips'],['LeftShoulder','Spine2'],['RightShoulder','Spine2']])if(bones[c].parent!==bones[pn])bones[pn].attach(bones[c]);
  root.updateMatrixWorld(true);
  const par=(c,p)=>bones[c].parent===bones[p];
  if(!(par('Spine','Hips')&&par('Spine1','Spine')&&par('Spine2','Spine1')&&par('Neck','Spine2')&&par('LeftShoulder','Spine2')&&par('LeftArm','LeftShoulder')&&par('LeftForeArm','LeftArm')&&par('LeftUpLeg','Hips')&&par('LeftLeg','LeftUpLeg')&&par('LeftFoot','LeftLeg')))return null;
  const inv=new M4().copy(root.matrixWorld).invert();const bp={},bq={},lq={};
  for(const n of BN.concat(EXTRA,['Head'])){const b=bones[n];const m=new M4().multiplyMatrices(inv,b.matrixWorld);const p=new V3(),q=new Q4(),s=new V3();m.decompose(p,q,s);bp[n]=p;bq[n]=q;lq[n]=b.quaternion.clone();}
  const arm=bones.Hips.parent;const armM=new M4().multiplyMatrices(inv,arm.matrixWorld);const armQ=new Q4();armM.decompose(_v,armQ,_s);
  const minY=Math.min(bp.LeftFoot.y,bp.RightFoot.y)-0.08;const height=bp.Head.y-minY+0.14;if(!(height>0.8&&height<3))return null;
  const Lv=bp.LeftUpLeg.clone().sub(bp.RightUpLeg);const f=new V3().crossVectors(Lv,UP);const yawFix=-Math.atan2(f.x,f.z);const qFix=new Q4().setFromAxisAngle(UP,yawFix);
  const CB=BN.map(n=>bp[n].clone().applyQuaternion(qFix));const pel=CB[PELVIS].clone();for(const p of CB){p.x-=pel.x;p.z-=pel.z;p.y-=minY;}
  const d=(a,b)=>CB[a].distanceTo(CB[b]);
  const pr={thigh:d(LHIP,LKNEE),shin:d(LKNEE,LFOOT),upper:d(LSH,LELB),fore:d(LELB,LHAND),pelH:CB[PELVIS].y,footH:Math.max(0.05,CB[LFOOT].y),
    hipOff:CB[LHIP].clone().sub(CB[PELVIS]),chestOff:CB[CHEST].clone().sub(CB[PELVIS]),shOff:CB[LSH].clone().sub(CB[PELVIS]),headOff:CB[HEAD].clone().sub(CB[CHEST])};
  pr.hipOff.x=Math.abs(pr.hipOff.x);pr.shOff.x=Math.abs(pr.shOff.x);pr.stride=(pr.thigh+pr.shin)*0.75;
  const inv2=q=>q.clone().invert();
  const dirB=(par,a,b)=>bp[b].clone().sub(bp[a]).applyQuaternion(inv2(bq[par])).normalize();
  const Fh=frameQ(bp.Neck.clone().sub(bp.Hips),bp.LeftUpLeg.clone().sub(bp.RightUpLeg),new Q4());const Fs=frameQ(bp.Neck.clone().sub(bp.Hips),bp.LeftArm.clone().sub(bp.RightArm),new Q4());
  const T={name,scene:root,height,minY,yawFix,qFix,CB,pr,armM,armQ,bq,lq,
    C_hips:inv2(Fh).multiply(bq.Hips),C_sp2:inv2(Fs).multiply(bq.Spine2),
    dNeck:dirB('Spine2','Neck','Head'),dLA:dirB('LeftShoulder','LeftArm','LeftForeArm'),dLF:dirB('LeftArm','LeftForeArm','LeftHand'),dRA:dirB('RightShoulder','RightArm','RightForeArm'),dRF:dirB('RightArm','RightForeArm','RightHand'),
    dLU:dirB('Hips','LeftUpLeg','LeftLeg'),dLL:dirB('LeftUpLeg','LeftLeg','LeftFoot'),dRU:dirB('Hips','RightUpLeg','RightLeg'),dRL:dirB('RightUpLeg','RightLeg','RightFoot'),rootQ:root.quaternion.clone()};
  // cara y manos en el espacio local de la malla (para el aspecto zombi) y eje de la mandíbula
  let sm=null;root.traverse(o=>{if(o.isSkinnedMesh&&!sm)sm=o;});
  if(sm&&bones.bip_LEye&&bones.bip_REye){const mi=new M4().copy(sm.matrixWorld).invert();const L=n=>bones[n].getWorldPosition(new V3()).applyMatrix4(mi);
    const rq=new Q4().setFromRotationMatrix(new M4().extractRotation(mi));const ls=new V3().setFromMatrixScale(mi).x;const fu=1/(height*ls);
    const mouth=bones.bip_MUpperLip&&bones.bip_MBottomLip?L('bip_MUpperLip').add(L('bip_MBottomLip')).multiplyScalar(0.5):L('Head');
    const hand=(a,b)=>{const w=bones[b].getWorldPosition(new V3()),e=bones[a].getWorldPosition(new V3());return w.add(w.clone().sub(e).normalize().multiplyScalar(0.045*height)).applyMatrix4(mi);};
    T.face={rq,eyeL:L('bip_LEye'),eyeR:L('bip_REye'),mouth,hl:hand('LeftForeArm','LeftHand'),hr:hand('RightForeArm','RightHand'),up:UP.clone().applyQuaternion(rq).normalize(),fwd:f.clone().normalize().applyQuaternion(rq).normalize(),side:Lv.clone().normalize().applyQuaternion(rq).normalize(),fu};}
  if(bones.bip_MJaw){const jb=bones.bip_MJaw;const jq=jb.getWorldQuaternion(new Q4());const sideW=Lv.clone().normalize();const lip=(bones.bip_MBottomLip||jb).getWorldPosition(new V3()).sub(jb.getWorldPosition(new V3()));
    if(lip.lengthSq()<1e-6)lip.copy(f).normalize();const t=lip.clone().applyAxisAngle(sideW,0.3);T.jawAx=sideW.clone().applyQuaternion(jq.invert()).normalize();T.jawSign=t.y<lip.y?1:-1;T.jawRest=jb.quaternion.clone();}
  return T;}
// coche de la comunidad (CC0, «Low Poly Car - Randomness A02 City» de kaytomasu): utilitario tipo Panda, el coche más típico de Barcelona
function prepCarTpl(root,sc){root.scale.setScalar(sc);root.updateMatrixWorld(true);const wheels=[];const parts={};
  root.traverse(o=>{if(o.isMesh){o.castShadow=false;parts[o.name]=o;if(o.material&&o.material.map)o.material.map.anisotropy=4;}});
  for(const n of ['Front_Left_Wheel','Front_Right_Wheel','Rear_Left_Wheel','Rear_Right_Wheel']){const m=parts[n];if(!m)continue;const b=new THREE.Box3().setFromObject(m);const c=b.getCenter(new V3());wheels.push({name:n,c,r:(b.max.y-b.min.y)/2,front:n.startsWith('Front')});}
  const box=new THREE.Box3().setFromObject(root);const ws=parts.Windshield?new THREE.Box3().setFromObject(parts.Windshield):null,mir=parts.Mirrors?new THREE.Box3().setFromObject(parts.Mirrors):null;
  for(const k of ['Windshield','Windows','RearWindow'])if(parts[k]){parts[k].geometry.computeBoundingBox();}
  return{root,wheels,box,ws,mir,wsLocal:parts.Windshield?parts.Windshield.geometry.boundingBox.clone():null,len:box.max.z-box.min.z,halfW:(parts.Car?new THREE.Box3().setFromObject(parts.Car):box).getSize(new V3()).x/2};}
// furgoneta tipo Kangoo/Berlingo a partir del mismo coche: más larga por detrás, techo alto y trasera cuadrada
function makeVanTpl(src){const root=src.clone(true);root.scale.setScalar(1);const zc=0.15,belt=0.76,roofH=1.31;
  root.traverse(o=>{if(!o.isMesh)return;o.geometry=o.geometry.clone();o.material=o.material.clone?o.material.clone():o.material;
    const pa=o.geometry.attributes.position;const isWheel=/Wheel/.test(o.name);
    if(isWheel){o.geometry.computeBoundingBox();const cz=(o.geometry.boundingBox.min.z+o.geometry.boundingBox.max.z)/2;if(cz<0){const dz=(zc+(cz-zc)*1.42)-cz;o.geometry.translate(0,0,dz);}return;}
    const rot=o.quaternion.lengthSq()>0&&Math.abs(o.quaternion.w)<0.999;// los retrovisores vienen girados: se deforman en coordenadas del coche
    const m=o.matrix.clone(),mi=m.clone().invert();const v=new V3();
    for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i);if(rot)v.applyMatrix4(m);let{x,y,z}=v;
      if(z<zc)z=zc+(z-zc)*1.42;
      if(y>belt){const s=THREE.MathUtils.smoothstep(z,-0.2,-1.3);const t=(y-belt)/(roofH-belt);y=belt+(y-belt)*1.38;y+=s*Math.max(0,t)*0.32*(1-Math.max(0,t-0.6));if(z<-1.2&&t>0.15)y=Math.max(y,belt+(roofH-belt)*1.38*Math.min(1,t*1.15));}
      v.set(x,y,z);if(rot)v.applyMatrix4(mi);pa.setXYZ(i,v.x,v.y,v.z);}
    pa.needsUpdate=true;o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();});
  const T=prepCarTpl(root,1.14);T.van=true;return T;}
function prepFerrari(g){if(!g)return null;const root=g.scene;const wn=['wheel_fl','wheel_fr','wheel_rl','wheel_rr'];const w=wn.map(n=>root.getObjectByName(n));if(w.some(x=>!x))return null;
  root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root);const sz=box.getSize(new V3());
  const fr=w[0].getWorldPosition(new V3()).add(w[1].getWorldPosition(new V3())).multiplyScalar(0.5);const re=w[2].getWorldPosition(new V3()).add(w[3].getWorldPosition(new V3())).multiplyScalar(0.5);
  const f=fr.sub(re);return{root,yawFix:-Math.atan2(f.x,f.z),scale:4.5/Math.max(sz.x,sz.z),minY:box.min.y};}
let modelsReady=false;
const TPL_M=[],TPL_F=[];
async function loadModels(){setLoad('m','Descargando personajes…');
  const list=['p_m1','p_m2','p_m3','p_m4','p_m5','p_f1','p_f2','p_f3','p_f4'];let done=0;
  await Promise.all(list.map(async key=>{const g=await loadAny(TJS.map(b=>b+key+'.glb'));const t=prepTpl(g,key);if(t){TPL[key]=t;t.female=key.startsWith('p_f');(t.female?TPL_F:TPL_M).push(t);
      t.scene.traverse(o=>{if(o.isMesh){const ms=Array.isArray(o.material)?o.material:[o.material];for(const m of ms){m.metalness=0;m.roughness=0.9;m.envMapIntensity=0.3;if(m.map)m.map.anisotropy=2;}}});}
    done++;setLoad('m',`Personajes: ${done}/${list.length}`);}));
  CHAR_TPLS=[...TPL_M,...TPL_F];
  if(!CHAR_TPLS.length){setLoad('m','❌ No se han podido descargar los personajes. Revisa la conexión de las gafas y recarga.');return;}
  setLoad('m',`✔ Personajes listos: ${TPL_M.length} hombres y ${TPL_F.length} mujeres`);
  setLoad('h','Descargando manos…');for(const side of ['left','right']){const g=await loadAny(HAND_BASE.map(b=>b+side+'.glb'));HANDTPL[side]=g?g.scene:null;}
  setupHands();setLoad('h',HANDTPL.left&&HANDTPL.right?'✔ Manos listas':'⚠ Manos sencillas');
  {const g=await loadAny(['assets/models/car_panda.glb']);CARTPL=g?prepCarTpl(g.scene,1.14):null;if(g)CARVAN=makeVanTpl(g.scene);}
  {const g=await loadAny(['assets/models/rifle.glb']);if(g){g.scene.updateMatrixWorld(true);let mm=null;g.scene.traverse(o=>{if(o.isMesh&&!mm)mm=o;});
    if(mm){const geo=mm.geometry.clone();geo.applyMatrix4(mm.matrixWorld);for(const k of ['skinIndex','skinWeight'])geo.deleteAttribute(k);geo.computeBoundingBox();const bb=geo.boundingBox;
      // culata hacia -z, cañón hacia +z; el origen en la empuñadura (mano derecha)
      const len=bb.max.z-bb.min.z;geo.translate(-(bb.min.x+bb.max.x)/2,-bb.max.y+0.04,-(bb.min.z+len*0.3));const m=mm.material;const mat=new THREE.MeshStandardMaterial({map:m.map,normalMap:m.normalMap,roughnessMap:m.roughnessMap,metalnessMap:m.metalnessMap,roughness:1,metalness:1});
      RIFLE_T={geo,mat};}}}
  for(const sd in gripBySide){const hr=hands[sd];if(hr&&!hr.handRoot.parent)gripBySide[sd].add(hr.handRoot);}
  modelsReady=true;enableStart();}

// =====================================================================
// PIEL ZOMBI (shader: piel grisácea, suciedad y sangre seca)
// =====================================================================
const NOISE_GLSL=`float zh(vec3 p){p=fract(p*0.3183099+0.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float zn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);return mix(mix(mix(zh(i),zh(i+vec3(1,0,0)),f.x),mix(zh(i+vec3(0,1,0)),zh(i+vec3(1,1,0)),f.x),f.y),mix(mix(zh(i+vec3(0,0,1)),zh(i+vec3(1,0,1)),f.x),mix(zh(i+vec3(0,1,1)),zh(i+vec3(1,1,1)),f.x),f.y),f.z);}`;
const matCache=new Map();
// Material por personaje: los zombis con piel cadavérica; todos con heridas pintadas sobre la propia piel (sin calcomanías flotando)
const WOUND_GLSL=`
        for(int i=0;i<8;i++){vec4 W=uW[i];if(W.w==0.0)continue;
          if(W.w<0.0){float rb=-W.w;float db=length((vZP-W.xyz)*uFU);float nb=zn(zp*12.0+float(i));float br=smoothstep(rb*1.1,rb*0.3,db+(nb-0.5)*rb*0.6);
            zc=mix(zc,zc*vec3(0.55,0.45,0.72)*vec3(0.85,0.7,1.0),br*0.75);zc=mix(zc,vec3(0.25,0.05,0.06)*(0.6+l),br*smoothstep(0.62,0.8,nb)*0.6);continue;}
          float ag=clamp((uTime-uWT[i])/6.0,0.1,1.0);
          vec3 dv=(vZP-W.xyz)*uFU;float dd=length(dv);if(dd>W.w*8.0)continue;
          float n=zn(zp*34.0+float(i)*7.3),n2=zn(zp*9.0+float(i)*3.1);
          float stain=smoothstep(W.w*(0.6+ag*0.6),W.w*(0.3+ag*0.4),dd+(n2-0.5)*W.w*1.1+(n-0.5)*W.w*0.35);
          float core=smoothstep(W.w*0.24,W.w*0.17,dd);
          vec3 gU=-normalize(uWD[i]);float dy=dot(dv,gU);vec3 lt=dv-gU*dy;float lat=length(lt+cross(gU,uFw)*(n2-0.5)*W.w*0.6);float L=W.w*(3.0+n2*4.0)*ag;
          float wd=W.w*0.32*clamp(1.0+dy/L,0.15,1.0);
          float drip=step(dy,0.0)*smoothstep(-L,-L*0.6,dy)*smoothstep(wd,wd*0.35,lat);
          float b=max(max(stain*0.92,drip*0.85),core);
          zc=mix(zc,mix(vec3(0.13,0.008,0.006)*(0.55+l*0.8),vec3(0.03,0.0,0.0),core)*(0.8+n*0.4),b*uGore);}`;
function charMat(base,type,variant,tpl,h){const key=base.uuid+type+variant+(h?'_'+h.slot:'');let m=matCache.get(key);if(m)return m;m=base.clone();m.metalness=0;m.roughness=0.95;m.envMapIntensity=0.25;
  const tint={zombie:[[1,1,1]],bandit:[[0.82,0.74,0.7],[0.7,0.7,0.72]],good:[[1,1,1],[0.94,0.98,1],[1,0.96,0.92]],wanderer:[[0.95,0.92,0.86],[0.9,0.92,0.95]]}[type]||[[1,1,1]];
  const t=tint[variant%tint.length];m.color.setRGB(t[0],t[1],t[2]);
  const F=tpl&&tpl.face;const zom=type==='zombie';
  if(F&&(zom||h)){const gore=S.gore;const isHead=/head/i.test(base.name)?1:0;m.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,{uFU:{value:F.fu},uSeed:{value:variant*3.7+1.3},uGore:{value:gore/2},uEL:{value:F.eyeL},uER:{value:F.eyeR},uMo:{value:F.mouth},uHL:{value:F.hl},uHR:{value:F.hr},uUp:{value:F.up},uFw:{value:F.fwd},uSd:{value:F.side},
      uHead:{value:isHead},uMK:{value:[1,0.55,1,0.2][variant%4]},uHK:{value:[1,0.2,0.7,1][variant%4]},uW:{value:h?h.woundU:WOUND0},uWT:{value:h?h.woundT:WOUNDT0},uWD:{value:h?h.woundD:WOUNDD0},uTime:WTIME});
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vZP;uniform vec4 uW[8];uniform float uFU;').replace('#include <begin_vertex>','#include <begin_vertex>\nvZP=position;for(int i=0;i<8;i++){vec4 W=uW[i];if(W.w==0.0)continue;float r=abs(W.w);float d=length((position-W.xyz)*uFU);transformed-=objectNormal*(W.w<0.0?smoothstep(r*1.2,0.0,d)*r*0.5:smoothstep(r*0.45,0.0,d)*r*0.35)/uFU;}');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vZP;uniform float uFU,uSeed,uGore,uHead,uMK,uHK;uniform vec3 uEL,uER,uMo,uHL,uHR,uUp,uFw,uSd;uniform vec4 uW[8];uniform float uWT[8];uniform vec3 uWD[8];uniform float uTime;\n'+NOISE_GLSL)
      .replace('#include <map_fragment>','#include <map_fragment>\n        vec3 c0=diffuseColor.rgb;vec3 zp=vZP*uFU*1.75+uSeed;float l=dot(c0,vec3(0.3,0.59,0.11));vec3 zc=c0;\n'+(zom?ZOMBIE_GLSL:'')+WOUND_GLSL+'\n        diffuseColor.rgb=zc;');};
    m.customProgramCacheKey=()=>(zom?'zomb7_':'wnd7_')+gore;}
  matCache.set(key,m);return m;}
const WOUND0=Array.from({length:8},()=>new THREE.Vector4());const WOUNDT0=new Float32Array(8).fill(-99);const WOUNDD0=Array.from({length:8},()=>new V3(0,-1,0));const WTIME={value:0};
const ZOMBIE_GLSL=`
        float sk=smoothstep(0.015,0.09,c0.r-c0.g)*smoothstep(-0.01,0.05,c0.g-c0.b)*smoothstep(0.2,0.38,c0.r);sk=max(sk,uHead*0.55*smoothstep(0.12,0.3,l));
        vec3 cloth=mix(vec3(l),c0,0.5)*vec3(0.84,0.86,0.80);
        vec3 skin=vec3(l)*vec3(0.86,0.90,0.78)*1.08;skin=mix(skin,c0,0.14);
        float nec=zn(zp*9.0)*0.6+zn(zp*23.0)*0.4;skin*=mix(vec3(1.0),vec3(0.60,0.50,0.58),smoothstep(0.52,0.72,nec));
        zc=mix(cloth,skin,sk);
        float d=zn(zp*2.6)*0.65+zn(zp*7.0)*0.35;zc*=mix(1.0,0.55,smoothstep(0.5,0.8,d));
        float de=min(length(vZP-uEL),length(vZP-uER))*uFU;
        zc*=mix(vec3(0.34,0.26,0.30),vec3(1.0),smoothstep(0.009,0.027,de));
        zc=mix(vec3(0.80,0.80,0.74),zc,smoothstep(0.0062,0.0082,de));
        vec3 dm=(vZP-uMo)*uFU;float dy=dot(dm,uUp),dx=dot(dm,uSd),dz=dot(dm,uFw);
        float nb=zn(zp*14.0+5.0)*0.6+zn(zp*38.0)*0.4;
        float lips=smoothstep(0.024,0.009,length(vec3(dx*0.75,dy*1.25,dz*0.5)));
        float tt=clamp(-dy/0.2,0.0,1.0);float w=mix(0.015,0.075,tt);
        float drip=smoothstep(0.006,-0.012,dy)*smoothstep(-0.23,-0.09,dy)*smoothstep(w,w*0.3,abs(dx+(zn(zp*5.0)-0.5)*0.035))*step(-0.05,dz);
        float mb=max(lips*smoothstep(0.2,0.5,nb+0.25),drip*smoothstep(0.3,0.58,nb+(1.0-tt)*0.35))*uMK;
        float dh=min(length(vZP-uHL),length(vZP-uHR))*uFU;float hb=smoothstep(0.085,0.03,dh)*smoothstep(0.3,0.6,nb+0.2)*uHK;
        float b=zn(zp*3.1+17.0)*0.6+zn(zp*9.0+3.0)*0.25+nb*0.15;float bm=smoothstep(0.66,0.72,b)*smoothstep(0.2,0.5,nb+0.2);
        float blood=clamp(max(max(mb,hb),bm),0.0,1.0)*uGore;
        zc=mix(zc,vec3(0.105,0.012,0.008)*(0.5+l*0.7)*(0.75+nb*0.5),blood*0.94);`;

// =====================================================================
// PERSONAJES
// =====================================================================
const STICKS=[[HEAD,CHEST],[HEAD,LSH],[HEAD,RSH],[HEAD,PELVIS],[CHEST,LSH],[CHEST,RSH],[LSH,RSH],[CHEST,PELVIS],[CHEST,LHIP],[CHEST,RHIP],
  [LSH,LHIP],[RSH,RHIP],[LSH,RHIP],[RSH,LHIP],[LHIP,RHIP],[PELVIS,LHIP],[PELVIS,RHIP],[PELVIS,LSH],[PELVIS,RSH],
  [LSH,LELB],[LELB,LHAND],[RSH,RELB],[RELB,RHAND],[LHIP,LKNEE],[LKNEE,LFOOT],[RHIP,RKNEE],[RKNEE,RFOOT]];
const PR=[0.12,0.1,0.11,0.08,0.08,0.09,0.09,0.05,0.045,0.05,0.045,0.06,0.05,0.06,0.05];
const NBW=[];{const adj=[...Array(NP)].map(()=>[]);for(const [a,b] of STICKS){adj[a].push(b);adj[b].push(a);}
  for(let s=0;s<NP;s++){const d=new Array(NP).fill(9);d[s]=0;const q=[s];while(q.length){const u=q.shift();for(const v of adj[u])if(d[v]>d[u]+1){d[v]=d[u]+1;q.push(v);}}NBW[s]=Float32Array.from(d.map(x=>x===0?1:x===1?0.45:x===2?0.15:0.04));}
  // brazos y piernas: el golpe se queda en la extremidad
  for(const [a,b,c] of [[LSH,LELB,LHAND],[RSH,RELB,RHAND],[LHIP,LKNEE,LFOOT],[RHIP,RKNEE,RFOOT]]){NBW[c][b]=0.6;NBW[c][a]=0.2;NBW[b][c]=0.7;NBW[b][a]=0.4;}
  NBW[HEAD].fill(0.03);NBW[HEAD][HEAD]=1;NBW[HEAD][CHEST]=0.3;NBW[HEAD][LSH]=NBW[HEAD][RSH]=0.12;}
const HIT_SEGS=[[CHEST,PELVIS,0.19,'body'],[LSH,LELB,0.07,'lArm'],[LELB,LHAND,0.06,'lArm'],[RSH,RELB,0.07,'rArm'],[RELB,RHAND,0.06,'rArm'],
  [LHIP,LKNEE,0.09,'lLeg'],[LKNEE,LFOOT,0.075,'lLeg'],[RHIP,RKNEE,0.09,'rLeg'],[RKNEE,RFOOT,0.075,'rLeg']];
const LIMB_PTS={lArm:[LELB,LHAND],rArm:[RELB,RHAND],lLeg:[LKNEE,LFOOT],rLeg:[RKNEE,RFOOT]};
const PART_BONE={head:'Head',body:'Spine1',lArm:'LeftForeArm',rArm:'RightForeArm',lLeg:'LeftLeg',rLeg:'RightLeg'};
const NAMES_M=['Jordi','Pau','Marc','Sergi','Toni','Xavi','Manel','Joan','Carles','Albert','Rafa','Dani','Ramon','Íker','Hassan','Óscar'],NAMES_F=['Montse','Laia','Núria','Marta','Anna','Carme','Rosa','Mireia','Fàtima','Sílvia','Júlia','Lucía'];
const H_=[];const MAXC=90;let charSlot=0;
function newRec(tpl){const model=SkeletonUtils.clone(tpl.scene);const inner=new THREE.Group();inner.add(model);const holder=new THREE.Group();holder.add(inner);scene.add(holder);
  const bones={},meshes=[];model.traverse(o=>{if(o.isBone)bones[cleanName(o.name)]=o;if(o.isMesh){o.frustumCulled=false;o.userData.base=o.material;meshes.push(o);}});
  const h={tpl,holder,inner,model,bones,meshes,arm:bones.Hips.parent,sim:[],prev:[],tgt:[],rest:new Float32Array(STICKS.length),kp:new Float32Array(NP),kl:new Float32Array(NP),slot:charSlot++,active:false,wounds:[],prop:null};
  for(let i=0;i<NP;i++){h.sim.push(new V3());h.prev.push(new V3());h.tgt.push(new V3());}H_.push(h);return h;}
function spawnChar(type,x,z,o={}){if(!CHAR_TPLS.length)return null;const female=o.female!==undefined?o.female:Math.random()<0.45;
  const pool=(female?TPL_F:TPL_M).length?(female?TPL_F:TPL_M):CHAR_TPLS;const tpl=o.tpl||pick(pool);
  let h=H_.find(q=>!q.active&&q.tpl===tpl);if(!h){if(H_.length<MAXC)h=newRec(tpl);else{h=H_.find(q=>!q.active);if(!h)return null;}}
  const height=(female?R(1.58,1.72):R(1.68,1.86));const s=height/h.tpl.height;h.s=s;h.inner.scale.setScalar(s);h.inner.quaternion.copy(h.tpl.qFix);h.inner.position.set(0,-h.tpl.minY*s,0);
  const variant=o.variant!==undefined?o.variant:(Math.random()*4)|0;
  if(!h.woundU){h.woundU=Array.from({length:8},()=>new THREE.Vector4());h.woundT=new Float32Array(8);h.woundD=Array.from({length:8},()=>new V3());h.woundB=[];}for(const w of h.woundU)w.set(0,0,0,0);h.woundT.fill(-99);h.woundI=0;h.bleeds=[];
  for(const m of h.meshes){m.material=Array.isArray(m.userData.base)?m.userData.base.map(b=>charMat(b,type,variant,h.tpl,h)):charMat(m.userData.base,type,variant,h.tpl,h);}
  {const jb=h.bones.bip_MJaw;if(jb&&h.tpl.jawAx){jb.quaternion.copy(h.tpl.jawRest);if(type==='zombie')jb.quaternion.multiply(_q.setFromAxisAngle(h.tpl.jawAx,h.tpl.jawSign*R(0.1,0.42)));}}
  const zt=type==='zombie';h.pr={};for(const k in h.tpl.pr){const v=h.tpl.pr[k];h.pr[k]=v.isVector3?v.clone().multiplyScalar(s):v*s;}
  for(let k=0;k<STICKS.length;k++)h.rest[k]=h.tpl.CB[STICKS[k][0]].distanceTo(h.tpl.CB[STICKS[k][1]])*s;
  Object.assign(h,{active:true,type,x,z,y:surfY(x,z),yaw:Math.random()*6.28,vx:0,vz:0,speed:0,phase:Math.random()*6,mode:'kin',k:1,down:0,dead:false,deadT:0,getup:-1,permPhys:false,crawler:false,sleep:0,
    rig:1,headHp:zt?100*S.zTough:60,bodyHp:zt?200*S.zTough:110,limb:{lArm:60,rArm:60,lLeg:60,rLeg:60},broken:{},think:Math.random()*0.3,target:null,goal:null,atk:0,atkAnim:0,
    shootT:R(0.5,1.5),runner:false,base:null,role:null,hostile:false,angry:false,reanimate:false,lastHitT:-9,idle:0,groanT:R(3,12),aim:0,searched:false,acc:0,lod:0,crawlT:0,wd:null,stepT:0,
    act:'stand',actT:0,look:0,eatT:0,name:h.tpl.female?pick(NAMES_F):pick(NAMES_M),female:!!h.tpl.female,armed:zt?false:(type!=='wanderer'?true:Math.random()<0.5),pack:zt&&Math.random()<0.22,lastMoveT:0,
    gp:{lean:zt?R(0.14,0.38):R(0,0.06),droop:zt?R(0.2,0.55):0,tilt:zt?R(-0.35,0.35):0,arms:zt?(Math.random()<0.55?'forward':Math.random()<0.6?'hang':'mixed'):'swing',limp:zt&&Math.random()<0.55?R(0.2,0.75)*(Math.random()<0.5?1:-1):0,sway:zt?R(1.4,2.6):1,twitch:zt?R(0.3,1):0,speedMul:zt?R(0.75,1.15):1}},o);
  h.kp.fill(1);h.kl.fill(1);h.holder.visible=true;for(const w of h.wounds)w.parent&&w.parent.remove(w);h.wounds=[];
  if(h.prop){h.prop.visible=h.armed;}else if(h.armed){h.prop=makeRifle();scene.add(h.prop);}
  poseTargets(h,0);for(let i=0;i<NP;i++){h.sim[i].copy(h.tgt[i]);h.prev[i].copy(h.tgt[i]);}driveBones(h);return h;}
function despawn(h){h.active=false;h.holder.visible=false;if(h.prop)h.prop.visible=false;for(const w of h.wounds)w.parent&&w.parent.remove(w);h.wounds=[];if(h.base){const i=h.base.members.indexOf(h);if(i>=0)h.base.members.splice(i,1);}}
let RIFLE_T=null;
function makeRifle(){if(RIFLE_T){const m=new THREE.Mesh(RIFLE_T.geo,RIFLE_T.mat);m.castShadow=false;return m;}const g=mkG([[bx(0.05,0.07,0.75,0,0,0.2),0x222426],[bx(0.045,0.12,0.25,0,-0.03,-0.25),0x4a3424],[bx(0.03,0.12,0.05,0,-0.08,0.05),0x1a1a1a],[cy(0.012,0.012,0.35,0,0.015,0.7,6,Math.PI/2),0x111111]]);return new THREE.Mesh(g,metalMat);}

// ---------- IK y poses procedurales ----------
const _ia=new V3(),_ib=new V3(),_ic=new V3(),_id=new V3();
function ik2(A,T,l1,l2,pole,outM,outT){_ia.subVectors(T,A);let d=_ia.length();const mx=l1+l2-0.002,mn=Math.abs(l1-l2)+0.01;if(d<1e-5){_ia.set(0,-1,0);d=mn;}_ia.divideScalar(d);d=clamp(d,mn,mx);
  outT.copy(A).addScaledVector(_ia,d);const a=(l1*l1-l2*l2+d*d)/(2*d);const hh=Math.sqrt(Math.max(0,l1*l1-a*a));
  _ib.copy(pole).addScaledVector(_ia,-pole.dot(_ia));if(_ib.lengthSq()<1e-8)_ib.set(0,0,1).addScaledVector(_ia,-_ia.z);_ib.normalize();outM.copy(A).addScaledVector(_ia,a).addScaledVector(_ib,hh);}
const LP=Array.from({length:NP},()=>new V3());const _e1=new THREE.Euler(),_qt1=new Q4(),_tmpA=new V3(),_tmpB=new V3(),_pole=new V3();
// cuerpo local a partir de parámetros (pelvis, inclinación, pies y manos)
function bodyLocal(pr,o){const L=LP;L[PELVIS].copy(o.pel);_e1.set(o.pitch||0,o.twist||0,o.roll||0,'YXZ');_qt1.setFromEuler(_e1);
  L[CHEST].copy(pr.chestOff).applyQuaternion(_qt1).add(o.pel);
  L[LSH].set(pr.shOff.x,pr.shOff.y,pr.shOff.z).applyQuaternion(_qt1).add(o.pel);L[RSH].set(-pr.shOff.x,pr.shOff.y,pr.shOff.z).applyQuaternion(_qt1).add(o.pel);
  _e1.set((o.pitch||0)+(o.headPitch||0),(o.twist||0)+(o.headYaw||0),(o.roll||0)+(o.headRoll||0),'YXZ');_qt1.setFromEuler(_e1);L[HEAD].copy(pr.headOff).applyQuaternion(_qt1).add(L[CHEST]);
  _e1.set((o.pelPitch||0),(o.twist||0)*0.4,(o.roll||0)*0.4,'YXZ');_qt1.setFromEuler(_e1);
  L[LHIP].set(pr.hipOff.x,pr.hipOff.y,pr.hipOff.z).applyQuaternion(_qt1).add(o.pel);L[RHIP].set(-pr.hipOff.x,pr.hipOff.y,pr.hipOff.z).applyQuaternion(_qt1).add(o.pel);
  ik2(L[LHIP],o.lf,pr.thigh,pr.shin,o.kpL||_pole.set(0,0,1),L[LKNEE],L[LFOOT]);ik2(L[RHIP],o.rf,pr.thigh,pr.shin,o.kpR||_pole.set(0,0,1),L[RKNEE],L[RFOOT]);
  ik2(L[LSH],o.lh,pr.upper,pr.fore,o.epL||_tmpA.set(0.2,-0.4,-1),L[LELB],L[LHAND]);ik2(L[RSH],o.rh,pr.upper,pr.fore,o.epR||_tmpB.set(-0.2,-0.4,-1),L[RELB],L[RHAND]);}
const _o={pel:new V3(),lf:new V3(),rf:new V3(),lh:new V3(),rh:new V3()};
function armTarget(pr,side,mode,ph,amp,sh,out,h){const s=side>0?1:-1;const al=(pr.upper+pr.fore);
  if(mode==='forward'){out.set(sh.x*0.8+s*0.03,sh.y-0.22+Math.sin(ph*0.5+side)*0.06,sh.z+al*0.82);}
  else if(mode==='hang'){out.set(sh.x+s*0.08,sh.y-al*0.97,sh.z+0.08+Math.sin(ph+side)*0.05);}
  else if(mode==='reach'){out.set(sh.x*0.6,sh.y+0.08,sh.z+al*0.96);}
  else if(mode==='aim'){out.set(s>0?0.05:-0.12,sh.y-0.12,sh.z+(s>0?0.55:0.3));}
  else{const sw=-Math.sin(ph+(side>0?Math.PI:0))*0.45*amp;out.set(sh.x+s*0.05,sh.y-al*0.95*Math.cos(sw),sh.z+al*0.95*Math.sin(sw));}
  return out;}
function poseTargets(h,dt){const pr=h.pr,g=h.gp,o=_o;const v=h.speed;const amp=clamp(v/1.3,0,1.5);const z=h.type==='zombie';
  if(v>0.03)h.phase+=dt*v/pr.stride*Math.PI*(z?1.15:1);else h.phase+=dt*0.6;const ph=h.phase;h.actT+=dt;
  const act=h.act;let lean=g.lean,headP=g.droop,headR=g.tilt+(z?Math.sin(clockT*0.7*g.twitch+h.slot)*0.1*g.twitch:0),headY=z?Math.sin(clockT*0.4+h.slot)*0.2:Math.sin(clockT*0.3+h.slot)*0.5*(v<0.1?1:0.2);
  if(act==='lie'||act==='sleep'){// tumbado boca arriba
    o.pel.set(0,0.14,0);bodyLocal(pr,Object.assign(o,{pitch:-Math.PI/2,roll:0,twist:0,headPitch:-0.2,headRoll:0,headYaw:0,pelPitch:-Math.PI/2}));
    o.lf.set(pr.hipOff.x,0.1,-(pr.thigh+pr.shin));o.rf.set(-pr.hipOff.x,0.1,-(pr.thigh+pr.shin));o.lh.set(0.35,0.08,0.1);o.rh.set(-0.35,0.08,0.1);bodyLocal(pr,o);}
  else if(act==='squat'||act==='eat'||act==='loot'){const d=act==='eat'?0.9:0.55;o.pel.set(0,pr.pelH*0.46,-0.05);o.lf.set(pr.hipOff.x+0.06,pr.footH,0.18);o.rf.set(-pr.hipOff.x-0.06,pr.footH,act==='eat'?-0.25:0.12);
    const sh=_tmpA.copy(pr.shOff);sh.y+=o.pel.y;const hy=act==='eat'?0.12+Math.abs(Math.sin(clockT*6+h.slot))*0.08:0.45+Math.sin(clockT*3+h.slot)*0.05;
    o.lh.set(0.18,hy,0.45);o.rh.set(-0.18,hy+0.03,0.42);bodyLocal(pr,Object.assign(o,{pitch:d,roll:0,twist:0,headPitch:act==='eat'?0.5+Math.sin(clockT*7)*0.15:0.3,headRoll:0,headYaw:0,pelPitch:0.3,kpL:_pole.set(0,0.3,1),kpR:_tmpB.set(0,0.3,1)}));}
  else if(act==='sit'){o.pel.set(0,0.18,0);o.lf.set(pr.hipOff.x+0.08,pr.footH,0.55);o.rf.set(-pr.hipOff.x-0.08,pr.footH,0.5);o.lh.set(0.25,0.2,0.3);o.rh.set(-0.25,0.2,0.3);
    bodyLocal(pr,Object.assign(o,{pitch:0.15,roll:0,twist:0,headPitch:0.1,headRoll:0,headYaw:headY,pelPitch:0,kpL:_pole.set(0,1,0.3),kpR:_tmpB.set(0,1,0.3)}));}
  else if(act==='getup'){getupLocal(h,clamp(h.getup,0,1));}
  else if(act==='crawl'){const t=ph;o.pel.set(Math.sin(t)*0.06,0.16,-0.55);o.lf.set(pr.hipOff.x,0.08,-0.55-pr.thigh-pr.shin+0.1);o.rf.set(-pr.hipOff.x,0.08,-0.5-pr.thigh-pr.shin+0.1);
    o.lh.set(0.25,0.06,0.45+Math.sin(t)*0.25);o.rh.set(-0.25,0.06,0.45-Math.sin(t)*0.25);bodyLocal(pr,Object.assign(o,{pitch:Math.PI/2-0.25,roll:Math.sin(t)*0.12,twist:0,headPitch:-1.0,headRoll:0,headYaw:Math.sin(t*0.5)*0.3,pelPitch:Math.PI/2,
      kpL:_pole.set(0,-1,0),kpR:_tmpB.set(0,-1,0),epL:_v3.set(0.5,-0.5,0),epR:_v4.set(-0.5,-0.5,0)}));}
  else{// de pie / caminando (gait)
    const bob=Math.abs(Math.cos(ph))*0.035*amp,sway=Math.sin(ph)*0.025*amp*g.sway;let pelY=pr.pelH-0.025-0.03*amp-bob;if(h.crouchK){pelY-=pr.pelH*h.crouchK;lean+=h.crouchK*0.5;}
    if(h.atkAnim>0){lean+=0.25;headP-=0.2;}if(act==='aim')lean=0.08;
    o.pel.set(sway,pelY,0);
    for(const side of [1,-1]){const lp=ph+(side>0?0:Math.PI);const limp=g.limp*side>0?Math.abs(g.limp):0;const st=pr.stride*0.5*amp*(1-limp*0.6);
      const lift=Math.max(0,Math.cos(lp))*0.12*amp*(1-limp*0.85)*(z?0.75:1);const f=side>0?o.lf:o.rf;f.set(side*(pr.hipOff.x+0.02)+(z?side*0.04:0),pr.footH+lift,Math.sin(lp)*st);
      if(limp>0&&Math.cos(lp)>0)pelY-=0.04*limp;}
    o.pel.y=pelY;
    const shL=_tmpA.set(pr.shOff.x,pr.shOff.y+pelY,pr.shOff.z),shR=_tmpB.set(-pr.shOff.x,pr.shOff.y+pelY,pr.shOff.z);
    let am=g.arms;if(h.atkAnim>0)am='reach';if(act==='aim'||(h.aim&&h.armed))am='aim';
    armTarget(pr,1,am==='mixed'?'forward':am,ph,amp,shL,o.lh,h);armTarget(pr,-1,am==='mixed'?'hang':am,ph,amp,shR,o.rh,h);
    if(z&&g.twitch){o.lh.x+=Math.sin(clockT*9+h.slot)*0.02*g.twitch;o.rh.y+=Math.sin(clockT*7.3+h.slot*2)*0.03*g.twitch;}
    bodyLocal(pr,Object.assign(o,{pitch:lean+Math.cos(ph*2)*0.02*amp,roll:Math.sin(ph)*0.03*amp*g.sway+(z?g.tilt*0.2:0),twist:Math.sin(ph)*0.08*amp,headPitch:headP,headRoll:headR,headYaw:headY,pelPitch:0,kpL:null,kpR:null,epL:null,epR:null}));}
  // a mundo
  const c=Math.cos(h.yaw),s=Math.sin(h.yaw);const gy=surfY(h.x,h.z,h.y+0.5);h.y=gy;
  for(let i=0;i<NP;i++){const l=LP[i];h.tgt[i].set(h.x+l.x*c+l.z*s,gy+l.y,h.z-l.x*s+l.z*c);}}
// levantarse: boca abajo → manos al suelo → rodilla → de pie (con torpeza zombi)
function getupLocal(h,t){const pr=h.pr,o=_o;const leg=pr.thigh+pr.shin;const z=h.type==='zombie';const wob=z?Math.sin(clockT*5+h.slot)*0.05:0;
  if(t<0.33){const u=t/0.33;const th=lerp(0.05,0.9,u*u);o.pel.set(0,0.14+u*0.06,-0.15);o.lf.set(pr.hipOff.x,0.08,-leg*0.95);o.rf.set(-pr.hipOff.x,0.08,-leg*0.95);
    o.lh.set(0.24,0.06,0.25+0.2*(1-u));o.rh.set(-0.24,0.06,0.25+0.2*(1-u));bodyLocal(pr,Object.assign(o,{pitch:Math.PI/2-th,roll:wob,twist:0,headPitch:-0.9+u*0.5,headRoll:0,headYaw:0,pelPitch:Math.PI/2-th*0.3,kpL:_pole.set(0,-1,0.2),kpR:_tmpB.set(0,-1,0.2),epL:_v3.set(0.6,0,-0.3),epR:_v4.set(-0.6,0,-0.3)}));}
  else if(t<0.66){const u=(t-0.33)/0.33;o.pel.set(0,lerp(0.2,pr.thigh+0.12,u),lerp(-0.15,-0.05,u));o.lf.set(pr.hipOff.x,0.08,lerp(-leg*0.95,0.35,clamp(u*1.6-0.4,0,1)));o.rf.set(-pr.hipOff.x,0.06,lerp(-leg*0.95,-pr.shin,u));
    o.lh.set(0.24,lerp(0.06,0.45,u),lerp(0.35,0.4,u));o.rh.set(-0.24,0.06+u*0.1,0.4);bodyLocal(pr,Object.assign(o,{pitch:lerp(0.7,0.45,u),roll:wob,twist:0,headPitch:-0.2,headRoll:0,headYaw:0,pelPitch:lerp(0.9,0.2,u),kpL:_pole.set(0,0.4,1),kpR:_tmpB.set(0,-0.6,1),epL:null,epR:null}));}
  else{const u=(t-0.66)/0.34;const e=u*u*(3-2*u);o.pel.set(0,lerp(pr.thigh+0.12,pr.pelH-0.03,e),0);o.lf.set(pr.hipOff.x,pr.footH,lerp(0.35,0.05,e));o.rf.set(-pr.hipOff.x,pr.footH,lerp(-pr.shin*0.7,0,e));
    o.lh.set(0.24,lerp(0.45,pr.pelH-0.1,e),lerp(0.4,0.1,e));o.rh.set(-0.24,lerp(0.3,pr.pelH-0.15,e),lerp(0.35,0.1,e));bodyLocal(pr,Object.assign(o,{pitch:lerp(0.45,h.gp.lean,e),roll:wob,twist:0,headPitch:h.gp.droop*e,headRoll:h.gp.tilt*e,headYaw:0,pelPitch:lerp(0.2,0,e),kpL:null,kpR:null}));}}

// ---------- huesos a partir de los puntos ----------
const _Mq=new Q4(),_Wh=new Q4(),_Ws1=new Q4(),_Ws2=new Q4(),_Wn=new Q4(),_Wls=new Q4(),_Wla=new Q4(),_Wrs=new Q4(),_Wra=new Q4(),_Wlu=new Q4(),_Wru=new Q4(),_Wll=new Q4(),_Wrl=new Q4(),_Fq=new Q4(),_ql=new Q4(),_qi=new Q4(),_dv=new V3(),_yawQ=new Q4();
const _Mh=new M4(),_Mi=new M4(),_Ma=new M4();
function limbLocal(W_par,dB,a,b,lq,out){_qi.copy(W_par).invert();_dv.subVectors(b,a).applyQuaternion(_qi).normalize();_ql.setFromUnitVectors(dB,_dv);return out.copy(_ql).multiply(lq);}
function driveBones(h){const T=h.tpl,s=h.sim,B=h.bones;_yawQ.setFromAxisAngle(UP,h.yaw);_Mq.copy(_yawQ).multiply(T.qFix).multiply(h.model.quaternion);
  frameQ(_v1.subVectors(s[CHEST],s[PELVIS]),_v2.subVectors(s[LHIP],s[RHIP]),_Fq);_Wh.copy(_Fq).multiply(T.C_hips);
  _qi.copy(_Mq).multiply(T.armQ).invert();B.Hips.quaternion.copy(_qi).multiply(_Wh);
  B.Spine.quaternion.copy(T.lq.Spine);B.Spine1.quaternion.copy(T.lq.Spine1);_Ws1.copy(_Wh).multiply(T.lq.Spine).multiply(T.lq.Spine1);
  frameQ(_v1.subVectors(s[CHEST],s[PELVIS]),_v2.subVectors(s[LSH],s[RSH]),_Fq);_Ws2.copy(_Fq).multiply(T.C_sp2);B.Spine2.quaternion.copy(_Ws1).invert().multiply(_Ws2);
  limbLocal(_Ws2,T.dNeck,s[CHEST],s[HEAD],T.lq.Neck,B.Neck.quaternion);_Wn.copy(_Ws2).multiply(B.Neck.quaternion);B.Head.quaternion.copy(T.lq.Head);
  B.LeftShoulder.quaternion.copy(T.lq.LeftShoulder);_Wls.copy(_Ws2).multiply(T.lq.LeftShoulder);limbLocal(_Wls,T.dLA,s[LSH],s[LELB],T.lq.LeftArm,B.LeftArm.quaternion);_Wla.copy(_Wls).multiply(B.LeftArm.quaternion);
  limbLocal(_Wla,T.dLF,s[LELB],s[LHAND],T.lq.LeftForeArm,B.LeftForeArm.quaternion);
  B.RightShoulder.quaternion.copy(T.lq.RightShoulder);_Wrs.copy(_Ws2).multiply(T.lq.RightShoulder);limbLocal(_Wrs,T.dRA,s[RSH],s[RELB],T.lq.RightArm,B.RightArm.quaternion);_Wra.copy(_Wrs).multiply(B.RightArm.quaternion);
  limbLocal(_Wra,T.dRF,s[RELB],s[RHAND],T.lq.RightForeArm,B.RightForeArm.quaternion);
  limbLocal(_Wh,T.dLU,s[LHIP],s[LKNEE],T.lq.LeftUpLeg,B.LeftUpLeg.quaternion);_Wlu.copy(_Wh).multiply(B.LeftUpLeg.quaternion);limbLocal(_Wlu,T.dLL,s[LKNEE],s[LFOOT],T.lq.LeftLeg,B.LeftLeg.quaternion);
  limbLocal(_Wh,T.dRU,s[RHIP],s[RKNEE],T.lq.RightUpLeg,B.RightUpLeg.quaternion);_Wru.copy(_Wh).multiply(B.RightUpLeg.quaternion);limbLocal(_Wru,T.dRL,s[RKNEE],s[RFOOT],T.lq.RightLeg,B.RightLeg.quaternion);
  if(h.mode==='kin'||h.k>0.5){_Wll.copy(_Wlu).multiply(B.LeftLeg.quaternion);_Wrl.copy(_Wru).multiply(B.RightLeg.quaternion);
    B.LeftFoot.quaternion.copy(_Wll).invert().multiply(_ql.copy(_Mq).multiply(T.bq.LeftFoot));B.RightFoot.quaternion.copy(_Wrl).invert().multiply(_ql.copy(_Mq).multiply(T.bq.RightFoot));}
  // posición de la cadera
  h.holder.position.set(h.x,h.y,h.z);h.holder.quaternion.copy(_yawQ);_Mh.compose(h.holder.position,_yawQ,_s.set(1,1,1));_Mi.compose(h.inner.position,h.inner.quaternion,h.inner.scale);
  _Ma.multiplyMatrices(_Mh,_Mi).multiply(h.model.matrix).multiply(T.armM).invert();B.Hips.position.copy(s[PELVIS]).applyMatrix4(_Ma);
  if(h.prop&&h.prop.visible){const aiming=h.aim||h.act==='aim';h.prop.position.copy(s[RHAND]);if(aiming)_dv.subVectors(s[LHAND],s[RHAND]);else _dv.set(Math.sin(h.yaw)*0.4,-1,Math.cos(h.yaw)*0.4);if(_dv.lengthSq()>1e-6)h.prop.quaternion.setFromUnitVectors(_v.set(0,0,1),_dv.normalize());}}

// ---------- física (ragdoll activo con límites articulares) ----------
const FDT=1/60;
// distancias mínimas entre puntos (fracción de la pierna): [a,b,flácido,con tono muscular]. El «tono» (h.rig) evita que el cuerpo se pliegue como un trapo
const MINC=[[LHIP,LFOOT,0.42,0.9],[RHIP,RFOOT,0.42,0.9],[LSH,LHAND,0.3,0.56],[RSH,RHAND,0.3,0.56],[LFOOT,RFOOT,0.14,0.2],[LKNEE,RKNEE,0.11,0.16],[HEAD,PELVIS,0.82,0.96],[LHAND,RHAND,0.08,0.2],
  [HEAD,LKNEE,0.5,0.98],[HEAD,RKNEE,0.5,0.98],[CHEST,LKNEE,0.3,0.7],[CHEST,RKNEE,0.3,0.7],[HEAD,LFOOT,0.6,1.5],[HEAD,RFOOT,0.6,1.5],[LHAND,LHIP,0.05,0.16],[RHAND,RHIP,0.05,0.16]];
function enterPhys(h){if(h.mode==='phys')return;for(let i=0;i<NP;i++){h.prev[i].copy(h.sim[i]);h.prev[i].x-=h.vx*FDT;h.prev[i].z-=h.vz*FDT;}h.mode='phys';h.k=1;h.acc=0;h.sleep=0;}
function applyImp(h,imp,pi){if(!imp)return;const w=NBW[pi<0?CHEST:pi];for(let i=0;i<NP;i++)h.prev[i].addScaledVector(imp,-FDT*w[i]);h.sleep=0;}
const _cp={x:0,z:0},_kf=new V3(),_km=new V3();
// pares de segmentos (muslos, espinillas, brazos y tronco) que no pueden atravesarse: [a0,a1,b0,b1,distancia mínima]
const LIMBX=[[LHIP,LKNEE,RHIP,RKNEE,0.15],[LKNEE,LFOOT,RKNEE,RFOOT,0.13],[LHIP,LKNEE,RKNEE,RFOOT,0.14],[LKNEE,LFOOT,RHIP,RKNEE,0.14],
  [LSH,LELB,CHEST,PELVIS,0.16],[LELB,LHAND,CHEST,PELVIS,0.15],[RSH,RELB,CHEST,PELVIS,0.16],[RELB,RHAND,CHEST,PELVIS,0.15],[LELB,LHAND,LHIP,LKNEE,0.12],[RELB,RHAND,RHIP,RKNEE,0.12]];
const _sideN=new V3();
// cuerpos caídos que no se atraviesan entre sí
function sepBodies(){const L=[];for(const h of H_)if(h.active&&h.mode==='phys')L.push(h);
  for(let a=0;a<L.length;a++)for(let b=a+1;b<L.length;b++){const A=L[a].sim,B=L[b].sim;if(Math.abs(A[PELVIS].x-B[PELVIS].x)>2||Math.abs(A[PELVIS].z-B[PELVIS].z)>2)continue;
    for(let i=0;i<NP;i++)for(let j=0;j<NP;j++){const p=A[i],q=B[j];const r=PR[i]+PR[j];const dx=q.x-p.x,dy=q.y-p.y,dz=q.z-p.z;const d2=dx*dx+dy*dy+dz*dz;if(d2>=r*r||d2<1e-8)continue;const d=Math.sqrt(d2),k=(r-d)/d*0.5;
      p.x-=dx*k;p.y-=dy*k*0.5;p.z-=dz*k;q.x+=dx*k;q.y+=dy*k*0.5;q.z+=dz*k;L[a].sleep=0;L[b].sleep=0;}}}
function segSep(a0,a1,b0,b1,mn){const ux=a1.x-a0.x,uy=a1.y-a0.y,uz=a1.z-a0.z,vx=b1.x-b0.x,vy=b1.y-b0.y,vz=b1.z-b0.z,wx=a0.x-b0.x,wy=a0.y-b0.y,wz=a0.z-b0.z;
  const A=ux*ux+uy*uy+uz*uz,B=ux*vx+uy*vy+uz*vz,C=vx*vx+vy*vy+vz*vz,D=ux*wx+uy*wy+uz*wz,E=vx*wx+vy*wy+vz*wz;const den=A*C-B*B;
  let s=den>1e-9?clamp((B*E-C*D)/den,0,1):0;let t=C>1e-9?clamp((B*s+E)/C,0,1):0;s=A>1e-9?clamp((B*t-D)/A,0,1):0;
  const dx=(a0.x+ux*s)-(b0.x+vx*t),dy=(a0.y+uy*s)-(b0.y+vy*t),dz=(a0.z+uz*s)-(b0.z+vz*t);const d=Math.sqrt(dx*dx+dy*dy+dz*dz);if(d>=mn)return;
  let nx,ny,nz;if(d<1e-5){nx=uy*vz-uz*vy;ny=uz*vx-ux*vz;nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;}else{nx=dx/d;ny=dy/d;nz=dz/d;}
  const c=(mn-d)*0.5;const wa0=1-s,wa1=s,wb0=1-t,wb1=t;const ka=c/(wa0*wa0+wa1*wa1),kb=c/(wb0*wb0+wb1*wb1);
  a0.x+=nx*ka*wa0;a0.y+=ny*ka*wa0;a0.z+=nz*ka*wa0;a1.x+=nx*ka*wa1;a1.y+=ny*ka*wa1;a1.z+=nz*ka*wa1;
  b0.x-=nx*kb*wb0;b0.y-=ny*kb*wb0;b0.z-=nz*kb*wb0;b1.x-=nx*kb*wb1;b1.y-=ny*kb*wb1;b1.z-=nz*kb*wb1;}
function verlet(h){const p=h.sim,q=h.prev,t=h.tgt;const k=h.dead?0:h.k;if(h.dead)h.rig=Math.max(0.5,h.rig-FDT*0.5);const rg=h.dead?h.rig:Math.max(0.55,k);const damp=k>0.05?0.93:0.985;const legL=h.pr.thigh+h.pr.shin;
  for(let i=0;i<NP;i++){const a=p[i],b=q[i];const vx=(a.x-b.x)*damp,vy=(a.y-b.y)*damp,vz=(a.z-b.z)*damp;b.copy(a);a.x+=vx;a.y+=vy-9.81*FDT*FDT;a.z+=vz;}
  const brace=h.brace>0&&!h.dead;if(k>0||brace)for(let i=0;i<NP;i++){const s=brace?(ARMPT[i]?0.42*h.kp[i]:0):k*h.kp[i]*h.kl[i]*0.3;if(s>0){p[i].x+=(t[i].x-p[i].x)*s;p[i].y+=(t[i].y-p[i].y)*s;p[i].z+=(t[i].z-p[i].z)*s;}}
  for(let it=0;it<5;it++){for(let s=0;s<STICKS.length;s++){const a=p[STICKS[s][0]],b=p[STICKS[s][1]];const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;const d=Math.sqrt(dx*dx+dy*dy+dz*dz)||1e-4;const f=(d-h.rest[s])/d*0.5;
      a.x+=dx*f;a.y+=dy*f;a.z+=dz*f;b.x-=dx*f;b.y-=dy*f;b.z-=dz*f;}
    for(const [ia,ib,f0,f1] of MINC){const a=p[ia],b=p[ib];const mn=(f0+(f1-f0)*rg)*(ia===HEAD&&ib===PELVIS?h.rest[3]:legL*(ia===LSH||ia===RSH?0.75:1));const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;const d=Math.sqrt(dx*dx+dy*dy+dz*dz)||1e-4;
      if(d<mn){const f=(d-mn)/d*0.5;a.x+=dx*f;a.y+=dy*f;a.z+=dz*f;b.x-=dx*f;b.y-=dy*f;b.z-=dz*f;}}
    // rodillas hacia delante, codos hacia atrás
    _fx.subVectors(p[LHIP],p[RHIP]);_fy.subVectors(p[CHEST],p[PELVIS]);_kf.crossVectors(_fx,_fy).normalize();_sideN.copy(_fx).normalize();
    for(const [hp,kn,ft,sg] of [[LHIP,LKNEE,LFOOT,1],[RHIP,RKNEE,RFOOT,1],[LSH,LELB,LHAND,-1],[RSH,RELB,RHAND,-1]]){_km.addVectors(p[hp],p[ft]).multiplyScalar(0.5);const dd=_v.subVectors(p[kn],_km).dot(_kf)*sg;
      if(dd<-0.01){p[kn].addScaledVector(_kf,-dd*sg*0.6);p[ft].addScaledVector(_kf,dd*sg*0.2);}
      if(sg>0){_v.subVectors(p[kn],_km);const lat=_v.dot(_sideN);p[kn].addScaledVector(_sideN,-lat*0.75);}}
    for(const [a0,a1,b0,b1,rr] of LIMBX)segSep(p[a0],p[a1],p[b0],p[b1],rr);
    for(let i=0;i<NP;i++){const gy=surfY(p[i].x,p[i].z,p[i].y)+PR[i];if(p[i].y<gy)p[i].y=gy;}}
  let mv=0;for(let i=0;i<NP;i++){const a=p[i],b=q[i];const gy=surfY(a.x,a.z,a.y)+PR[i];
    if(a.y<=gy+0.005){b.x=a.x-(a.x-b.x)*0.5;b.z=a.z-(a.z-b.z)*0.5;if(b.y<a.y)b.y=a.y-(a.y-b.y)*0.15;}
    _cp.x=a.x;_cp.z=a.z;if(collide(_cp,PR[i],a.y)){b.x+=_cp.x-a.x;b.z+=_cp.z-a.z;a.x=_cp.x;a.z=_cp.z;}mv+=Math.abs(a.x-b.x)+Math.abs(a.y-b.y)+Math.abs(a.z-b.z);}
  return mv;}
function carBodies(h){const pv=h.sim[PELVIS];for(const c of cars){const dx0=pv.x-c.x,dz0=pv.z-c.z;if(dx0*dx0+dz0*dz0>16)continue;const s=Math.sin(c.yaw),co=Math.cos(c.yaw);const vx=s*c.speed+co*c.vLat,vz=co*c.speed-s*c.vLat;const hl=c.len/2,hw=c.halfW;
    for(let i=0;i<NP;i++){const p=h.sim[i],q=h.prev[i];const dx=p.x-c.x,dz=p.z-c.z;const lx=dx*co-dz*s,lz=dx*s+dz*co,ly=p.y-c.y;const r=PR[i];
      const top=lz>hl*0.36?0.95:lz<-hl*0.82?1.05:1.5;if(Math.abs(lx)>hw+r||Math.abs(lz)>hl+r||ly>top+r||ly<0.15)continue;
      const dT=top+r-ly,dS=hw+r-Math.abs(lx),dF=hl+r-Math.abs(lz);
      if(dT<dS&&dT<dF){p.y+=dT;const ux=p.x-q.x,uz=p.z-q.z;q.x=p.x-(ux+(vx*FDT-ux)*0.12);q.z=p.z-(uz+(vz*FDT-uz)*0.12);if(q.y<p.y)q.y=p.y-0.001;}
      else if(dS<dF){const sg=Math.sign(lx)||1;p.x+=co*sg*dS;p.z-=s*sg*dS;q.x=p.x-vx*FDT;q.z=p.z-vz*FDT;}
      else{const sg=Math.sign(lz)||1;p.x+=s*sg*dF;p.z+=co*sg*dF;q.x=p.x-vx*FDT*1.05;q.z=p.z-vz*FDT*1.05;const sp=Math.abs(c.speed);if(sp>3&&ly>0.3)q.y=Math.min(q.y,p.y-sp*0.22*FDT*(ly>0.7?1:0.5));}h.sleep=0;}}}
const _wq=new Q4(),_wv=new V3();
function updateWoundGravity(h){if(!h.woundB||!h.tpl.face)return;const rq=h.tpl.face.rq;for(let k=0;k<8;k++){const n=h.woundB[k];if(!n||!h.woundU[k].w)continue;const b=h.bones[n];if(!b)continue;
  b.getWorldQuaternion(_wq);_wv.set(0,-1,0).applyQuaternion(_wq.invert()).applyQuaternion(h.tpl.bq[n]).applyQuaternion(rq);h.woundD[k].copy(_wv);}}
function physStep(h,dt){h.acc+=dt;let n=0,mv=0;while(h.acc>=FDT&&n<3){h.acc-=FDT;n++;mv=verlet(h);carBodies(h);}if(h.acc>FDT*3)h.acc=0;return mv;}
function startGetUp(h){const s=h.sim;h.x=s[PELVIS].x;h.z=s[PELVIS].z;_cp.x=h.x;_cp.z=h.z;collide(_cp,0.3,h.y+0.3);h.x=_cp.x;h.z=_cp.z;
  _v.subVectors(s[HEAD],s[PELVIS]);if(Math.abs(_v.x)+Math.abs(_v.z)>0.2)h.yaw=Math.atan2(_v.x,_v.z);h.down=0;h.act='getup';h.getup=0;h.k=0.25;}
// ---------- heridas visibles (calcomanías de sangre pegadas al hueso) ----------
const woundMat=new THREE.MeshLambertMaterial({map:texBlood,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4});const woundGeo=new THREE.PlaneGeometry(1,1);
const poolMat=pbr(new THREE.MeshStandardMaterial({map:texBlood,transparent:true,alphaTest:0.4,roughness:0.12,metalness:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}));
const _wr=new THREE.Raycaster(),_wa=new V3(),_wb=new V3(),_wc=new V3(),_wl=new V3(),_wbc=new V3();
// la herida se busca sobre la malla tal y como está ahora y se guarda en la pose de reposo: así se queda pegada a la piel y se mueve con ella
function addWound(h,part,pos,dir,size){if(!S.gore||!h.woundU)return;h.holder.updateMatrixWorld(true);for(const m of h.meshes)m.boundingSphere=null;
  _wr.set(_v.copy(pos).addScaledVector(dir,-0.7),dir);_wr.far=1.6;const hit=_wr.intersectObjects(h.meshes,false)[0];if(!hit||!hit.face)return;const m=hit.object,f=hit.face;
  m.getVertexPosition(f.a,_wa);m.getVertexPosition(f.b,_wb);m.getVertexPosition(f.c,_wc);m.worldToLocal(_wl.copy(hit.point));THREE.Triangle.getBarycoord(_wl,_wa,_wb,_wc,_wbc);
  const P=m.geometry.attributes.position;const x=P.getX(f.a)*_wbc.x+P.getX(f.b)*_wbc.y+P.getX(f.c)*_wbc.z,y=P.getY(f.a)*_wbc.x+P.getY(f.b)*_wbc.y+P.getY(f.c)*_wbc.z,z=P.getZ(f.a)*_wbc.x+P.getZ(f.b)*_wbc.y+P.getZ(f.c)*_wbc.z;
  const k=h.woundI++%8;const blunt=HITKIND==='blunt';{let bi=CHEST,bd=1e9;for(let i=0;i<NP;i++){const d=h.sim[i].distanceToSquared(hit.point);if(d<bd){bd=d;bi=i;}}h.woundB[k]=BN[bi];}h.woundU[k].set(x,y,z,(blunt?-size*0.5:size*0.35)/(h.tpl.height*h.s));h.woundT[k]=clockT;
  if(!blunt){let bi=CHEST,bd=1e9;for(let i=0;i<NP;i++){const d=h.sim[i].distanceToSquared(hit.point);if(d<bd){bd=d;bi=i;}}(h.bleeds||(h.bleeds=[])).push({i:bi,o:hit.point.clone().sub(h.sim[bi]),until:clockT+R(5,9),t:0});if(h.bleeds.length>4)h.bleeds.shift();}}
let HITKIND='';
const pools=[];function bloodPool(x,z,y){if(S.gore<2||pools.length>40)return;y=surfY(x,z,y+0.3);let mx=0;for(let k=0;k<8;k++){const a=k*0.785;for(const r of [0.4,0.8,1.2]){if(Math.abs(surfY(x+Math.cos(a)*r,z+Math.sin(a)*r,y+0.3)-y)>0.04){mx=mx?Math.min(mx,r):r;break;}}}const m=new THREE.Mesh(woundGeo,poolMat);m.rotation.x=-Math.PI/2;m.rotation.z=R(0,6);m.position.set(x,y+0.015,z);m.scale.setScalar(0.2);scene.add(m);pools.push({m,s:0.2,max:mx?Math.max(0.3,mx*1.4):R(1.2,2),t:180});}

// ---------- daño por zonas y reacciones ----------
function anger(h){if(h.type==='zombie')return;if(h.base){if(!h.base.angry&&h.base.type==='good')toast(`¡Has atacado a ${h.base.name}! Ahora son hostiles.`);h.base.angry=true;}else h.angry=true;}
const ARMPT=[0,0,0,0,0,0,0,1,1,1,1,0,0,0,0];
// pierna rota: cae apoyando las manos, se levanta y cojea arrastrándola; con las dos rotas, se arrastra
function breakLimb(h,part){h.broken[part]=true;
  if(part==='lLeg'||part==='rLeg'){const other=part==='lLeg'?'rLeg':'lLeg';
    if(h.broken[other]){for(const i of LIMB_PTS[part])h.kp[i]=0.02;h.permPhys=true;h.crawler=true;h.down=1e9;h.act='crawl';return;}
    h.gp.limp=(part==='lLeg'?1:-1)*1.0;h.gp.speedMul*=0.45;h.gp.drag=part;knockDown(h,null,R(2.5,4));return;}
  for(const i of LIMB_PTS[part])h.kp[i]=0.02;h.permPhys=true;}
function knockDown(h,imp,t){h.k=0;h.down=t||R(1.4,3);h.act='stand';h.brace=0.75;const c=h.sim[CHEST],pv=h.prev[CHEST];let dx=imp?imp.x:c.x-pv.x,dz=imp?imp.z:c.z-pv.z;const l=Math.hypot(dx,dz);
  if(l<1e-4){dx=Math.sin(h.yaw);dz=Math.cos(h.yaw);}else{dx/=l;dz/=l;}h.braceDir=[dx,dz];}
// manos por delante al caer
function braceTargets(h){const p=h.sim,t=h.tgt;const d=h.braceDir||[Math.sin(h.yaw),Math.cos(h.yaw)];const g=surfY(p[PELVIS].x,p[PELVIS].z,p[PELVIS].y)+0.06;
  for(const [sh,el,ha,sd] of [[LSH,LELB,LHAND,1],[RSH,RELB,RHAND,-1]]){const s=p[sh];const px=-d[1]*sd*0.18,pz=d[0]*sd*0.18;
    t[ha].set(s.x+d[0]*0.55+px,Math.max(g,s.y-0.75),s.z+d[1]*0.55+pz);t[el].set((s.x+t[ha].x)/2+px*0.5,(s.y+t[ha].y)/2,(s.z+t[ha].z)/2+pz*0.5);}}
function die(h,by){h.dead=true;h.deadT=0;h.k=0;h.sleep=0;h.rig=1;
  // cae a plomo, como un árbol: el tronco se va en la dirección del golpe (o hacia atrás) y los pies se quedan
  {const c=h.sim[CHEST],pc=h.prev[CHEST];let dx=c.x-pc.x,dz=c.z-pc.z;const l=Math.hypot(dx,dz);if(l<0.004){const a=h.yaw+Math.PI+R(-0.9,0.9);dx=Math.sin(a);dz=Math.cos(a);}else{dx/=l;dz/=l;}
    const fy=Math.min(h.sim[LFOOT].y,h.sim[RFOOT].y);for(let i=0;i<NP;i++){const w=clamp((h.sim[i].y-fy)/1.5,0,1.1)*1.5;h.prev[i].x-=dx*w*FDT;h.prev[i].z-=dz*w*FDT;}}
h.reanimate=!!S.reanimate&&by==='zombie'&&h.type!=='zombie';h.aim=0;
  if(h.type==='zombie'&&by==='player')P.kills++;if(h.type!=='zombie'){h.searched=false;if(h.base){const i=h.base.members.indexOf(h);if(i>=0)h.base.members.splice(i,1);}}
  if(h.prop&&h.prop.visible){const pr=h.prop;h.prop=null;dropObj(pr,pr.position.clone(),_v.set(R(-1,1),1,R(-1,1)),true);}
  setTimeout(()=>{if(h.active&&h.dead)bloodPool(h.sim[CHEST].x,h.sim[CHEST].z,h.sim[CHEST].y-0.1);},1500);}
function hitChar(h,part,dmg,imp,pi,by,pos,dir){if(!h.active)return;if(by==='player')anger(h);
  enterPhys(h);applyImp(h,imp,pi);if(pos&&dir)addWound(h,part,pos,dir,part==='head'?R(0.1,0.16):R(0.12,0.22));if(h.dead)return;h.lastHitT=clockT;
  if(part==='head')h.headHp-=dmg;else if(part==='body')h.bodyHp-=dmg;
  else if(h.limb[part]!==undefined){h.limb[part]-=dmg;h.bodyHp=Math.max(1,h.bodyHp-dmg*0.1);if(h.limb[part]<=0&&!h.broken[part])breakLimb(h,part);}
  if(h.headHp<=0||h.bodyHp<=0){die(h,by);return;}
  const mag=imp?imp.length():0;// golpes flojos: solo cede la zona golpeada; golpes fuertes: tambaleo; muy fuertes: al suelo
  const loc=clamp(mag/5,0.35,1);const w=NBW[pi<0?CHEST:pi];for(let i=0;i<NP;i++)h.kl[i]=Math.min(h.kl[i],1-w[i]*loc);
  h.k=Math.max(0,h.k-Math.max(0,(mag-3.2)/(h.type==='zombie'?7:5.5)));
  if(h.k<0.12&&h.down<=0&&!h.crawler)knockDown(h,imp,R(1.4,3)*(h.type==='zombie'?1:1.3));
  // golpe en una pierna sin romperla: cojea más y puede tropezar
  if((part==='lLeg'||part==='rLeg')&&!h.broken[part]&&!h.dead){const sg=part==='lLeg'?1:-1;h.gp.limp=clamp((Math.sign(h.gp.limp)===sg?Math.abs(h.gp.limp):0)+dmg/70,0,0.9)*sg;h.gp.speedMul=Math.max(0.35,h.gp.speedMul*0.9);
    if(h.down<=0&&Math.random()<clamp(dmg/90,0.15,0.6))knockDown(h,imp,R(1.2,2.2));}
  if(h.type!=='zombie'&&by==='player'&&!h.target)h.target='player';}
const charPoints=h=>h.sim;
const headC=(pts,out)=>out.subVectors(pts[HEAD],pts[CHEST]).normalize().multiplyScalar(0.09).add(pts[HEAD]);
