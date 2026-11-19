// =====================================================================
// MOTOS REALES (modelos de la comunidad: Derbi DS-50 y dos Vespas): aparcadas en la acera como instancias;
// al subirte, el manillar (la pieza HEAD del modelo cuando la tiene) gira con tus manos.
// =====================================================================
const MOTOM=[{k:'derbi',rot:Math.PI/2,len:1.82,head:'HEAD',w:3,tint:0},{k:'vespa',rot:-Math.PI/2,len:1.8,w:4,tint:1},{k:'vespa_s',rot:0,len:1.78,w:2,tint:1}];
const MOTO_TPL={};const MOTO_PEND=[];
const MOTO_TINT=[0xffffff,0xffffff,0xf2f2f2,0xd8e8f0,0xf0d8d0,0xd0e8d0,0x9aa0a6,0x404448,0xf2e6c8,0xc0d8f0];
function prepMoto(g,m){const s=g.scene;s.rotation.y=m.rot;s.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(s);const sc=m.len/(bb.max.z-bb.min.z);
  const cx=(bb.min.x+bb.max.x)/2,cz=(bb.min.z+bb.max.z)/2,y0=bb.min.y;const body=[],head=[],mats=[],hmats=[];
  s.traverse(o=>{if(!o.isMesh)return;let p=o,isH=false;while(p){if(m.head&&p.name===m.head)isH=true;p=p.parent;}
    let gg=o.geometry.clone();for(const k of Object.keys(gg.attributes))if(!['position','normal','uv'].includes(k))gg.deleteAttribute(k);if(!gg.attributes.uv){gg.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(gg.attributes.position.count*2),2));}
    gg.applyMatrix4(o.matrixWorld);gg.translate(-cx,-y0,-cz);gg.scale(sc,sc,sc);if(gg.index)gg=gg.toNonIndexed();if(!gg.attributes.normal)gg.computeVertexNormals();
    const mt=o.material.clone();mt.side=THREE.FrontSide;if(mt.map)mt.map.anisotropy=4;if(mt.transparent&&mt.opacity>0.6)mt.transparent=false;pbr(mt);(isH?head:body).push(gg);(isH?hmats:mats).push(mt);});
  const geo=mergeGeometries(body,true);geo.computeBoundingBox();const T={k:m.k,geo,mats,tint:m.tint,len:m.len,allG:mergeGeometries([...body,...head],true),allM:[...mats,...hmats]};
  if(head.length){const hg=mergeGeometries(head,true);hg.computeBoundingBox();const hb=hg.boundingBox;
    // eje de dirección: de la rueda delantera (abajo) al centro del manillar (arriba)
    const top=new V3((hb.min.x+hb.max.x)/2,hb.max.y-0.12,0),bot=new V3((hb.min.x+hb.max.x)/2,hb.min.y+0.25,0);
    {const pa=hg.attributes.position;let zt=0,nt=0,zb=0,nb=0;for(let i=0;i<pa.count;i++){const y=pa.getY(i);if(y>hb.max.y-0.25){zt+=pa.getZ(i);nt++;}if(y<hb.min.y+0.3){zb+=pa.getZ(i);nb++;}}top.z=nt?zt/nt:0;bot.z=nb?zb/nb:0;}
    T.head={geo:hg,mats:hmats,pivot:bot,ax:top.clone().sub(bot).normalize()};}
  return T;}
async function loadMotos(){for(const m of MOTOM){const g=await loadAny(['models/motos/'+m.k+'.glb']);if(!g)continue;try{MOTO_TPL[m.k]=prepMoto(g,m);MOTO_TPL[m.k].w=m.w;}catch(e){console.warn('moto',m.k,e);}}}
function pickMotoTpl(){let tot=0;for(const k in MOTO_TPL)tot+=MOTO_TPL[k].w;let a=Math.random()*tot;for(const k in MOTO_TPL){a-=MOTO_TPL[k].w;if(a<=0)return MOTO_TPL[k];}return null;}
// se colocan cuando ya están cargados los modelos (al empezar)
function buildMotosLC(){const groups={};
  for(const p of MOTO_PEND){const t=pickMotoTpl();if(!t){placeMotoProc(p);continue;}const col=t.tint?pick(MOTO_TINT):0xffffff;(groups[t.k]||(groups[t.k]=[])).push({p,t,col});}
  for(const k in groups){const L=groups[k];const t=MOTO_TPL[k];const allG=t.allG,allM=t.allM;
    const im=new THREE.InstancedMesh(allG,allM,L.length);L.forEach((q,i)=>{const {p}=q;const y=surfY(p.x,p.z);_m.compose(_p.set(p.x,y,p.z),_q.setFromEuler(_eu.set(0,p.yaw,-0.09,'YXZ')),_s.set(1,1,1));im.setMatrixAt(i,_m);im.setColorAt(i,_c.set(q.col));
      MOTOS.push({x:p.x,y,z:p.z,yaw:p.yaw,model:'m_'+k,col:q.col,ref:['m_'+k,'live',i],fallen:false,ok:Math.random()<0.85,vol:p.vol});});
    im.computeBoundingSphere();scene.add(im);const ch=getChunk(L[0].p.x,L[0].p.z);ch.meshes.push(im);im.userData.name='moto';INST['m_'+k]={geo:allG,mat:allM,byKey:{live:im},lists:new Map(),tpl:t};}}
function placeMotoProc(p){const model=pick(['moto','motoT','motoN','motoX']);const y=surfY(p.x,p.z);addInstLive(model,p.x,y,p.z,p.yaw);MOTOS.push({x:p.x,y,z:p.z,yaw:p.yaw,model,col:0xffffff,ref:[model,'none',0],fallen:false,ok:true});}
// subirse: carrocería + manillar con su pivote
function makeMotoLC(m){const t=INST[m.model].tpl;const g=new THREE.Group();const body=new THREE.Group();g.add(body);const mats=t.mats.map(x=>{const c=x.clone();c.color.multiply(_c.set(m.col));return c;});
  body.add(new THREE.Mesh(t.geo,mats));let head=null;
  if(t.head){const hp=new THREE.Group();hp.position.copy(t.head.pivot);hp.quaternion.setFromUnitVectors(UP,t.head.ax);body.add(hp);head=new THREE.Group();hp.add(head);
    const hm=new THREE.Mesh(t.head.geo,t.head.mats.map(x=>{const c=x.clone();c.color.multiply(_c.set(m.col));return c;}));hp.updateMatrixWorld(true);
    // la geometría está en el marco de la moto: la pasamos al del pivote
    const inv=new M4().compose(t.head.pivot,hp.quaternion,_s.set(1,1,1)).invert();hm.geometry=t.head.geo.clone().applyMatrix4(inv);head.add(hm);}
  g.position.set(m.x,m.y,m.z);g.rotation.y=m.yaw;scene.add(g);
  const c={g,body,sw:null,swp:null,x:m.x,z:m.z,y:m.y,yaw:m.yaw,speed:0,vLat:0,yr:0,steer:0,wheelRot:0,roll:0,rollV:0,pitch:0,pitchV:0,fuel:R(15,60),wheels:[],head,
    seat:new V3(0,0,-0.25),eye:1.38,halfW:0.35,len:t.len,kind:'moto',searched:true,wreck:0,gear:1,shift:{gx:0,gz:0,held:null},wheelR:0.25,auto:true};cars.push(c);return c;}
