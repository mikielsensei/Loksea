// =====================================================================
// PLÁTANOS DE SOMBRA (Platanus x hispanica): tronco con corteza real y copa de tarjetas de hojas fotográficas + viento
// =====================================================================
const windU={value:0};
function leafMat(map,extra={}){const m=new THREE.MeshLambertMaterial(Object.assign({map,alphaTest:0.45,side:THREE.DoubleSide,vertexColors:true},extra));
  m.onBeforeCompile=sh=>{sh.uniforms.uTime=windU;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;')
    .replace('#include <begin_vertex>',`#include <begin_vertex>
      float hg=max(0.0,position.y-3.0);
      #ifdef USE_INSTANCING
      vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);
      #else
      vec3 ip=vec3(0.0);
      #endif
      float ph=uTime*1.6+ip.x*0.13+ip.z*0.17;
      // ráfagas que recorren la calle: el viento empuja la copa hacia un lado y las hojas tiemblan
      float gust=0.55+0.45*sin(uTime*0.31+ip.x*0.02)*sin(uTime*0.17+ip.z*0.025);gust=gust*gust*1.6+0.25;
      transformed.x+=(sin(ph+position.y*0.7+position.z)*0.03+0.018*gust)*hg*gust;transformed.z+=(cos(ph*1.27+position.x*0.6)*0.025+0.008*gust)*hg*gust;
      transformed.y+=sin(ph*2.3+position.x*2.0)*0.012*hg*gust;
      float fl=sin(uTime*11.0+position.x*9.0+position.z*7.0+ip.x)*0.035*gust*min(hg,1.0);transformed.x+=fl;transformed.y+=fl*0.6;`);};return m;}
function cardGeo(w,h,cx,cyy,cz,yaw,tilt,center){const g=new THREE.PlaneGeometry(w,h);g.rotateX(tilt);g.rotateY(yaw);g.translate(cx,cyy,cz);
  const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){_v.set(p.getX(i)-center[0],p.getY(i)-center[1],p.getZ(i)-center[2]).normalize();_v.y=Math.abs(_v.y)*0.6+0.4;_v.normalize();n.setXYZ(i,_v.x,_v.y,_v.z);}
  const c=[];const s=0.72+0.28*Math.random();for(let i=0;i<p.count;i++)c.push(s,s,s);g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));return g;}
// tronco curvado: serie de tramos que se van inclinando
function limb(p0,dir,len,r0,r1,segs,bend,texM){const parts=[];let p=p0.clone(),d=dir.clone().normalize();const step=len/segs;
  for(let i=0;i<segs;i++){const ra=r0+(r1-r0)*i/segs,rb=r0+(r1-r0)*(i+1)/segs;const q=p.clone().addScaledVector(d,step);
    const g=new THREE.CylinderGeometry(rb,ra,step*1.04,5,1,true);const uv=g.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*(2*Math.PI*ra)/texM,(uv.getY(k)*step+i*step)/texM);
    g.applyQuaternion(_q.setFromUnitVectors(UP,d));const m=p.clone().add(q).multiplyScalar(0.5);g.translate(m.x,m.y,m.z);parts.push(g);
    p=q;d.add(_v.set(R(-bend,bend),R(-bend*0.3,bend*0.2),R(-bend,bend))).normalize();}
  return{parts,end:p,dir:d};}
const TREEG={};
function buildTreeVariant(seed){const tm=TEXM.bark_platanus;const t=[];
  const trunk=limb(new V3(0,-0.1,0),new V3(R(-0.06,0.06),1,R(-0.06,0.06)),R(3.6,4.4),0.3,0.22,4,0.05,tm);t.push(...trunk.parts);
  const L=[];const C=[0,7.5,0];const nl=R(3,5)|0;
  for(let i=0;i<nl;i++){const a=i/nl*Math.PI*2+R(-0.3,0.3);const d=new V3(Math.cos(a)*0.75,1,Math.sin(a)*0.75);
    const lb=limb(trunk.end,d,R(3.2,4.4),0.16,0.07,3,0.18,tm);t.push(...lb.parts);
    for(let k=0;k<1;k++){const d2=lb.dir.clone().add(new V3(R(-0.6,0.6),R(0,0.3),R(-0.6,0.6)));const sb=limb(lb.end,d2,R(1.4,2.4),0.07,0.03,2,0.25,tm);t.push(...sb.parts);
      for(let n=0;n<4;n++){const e=sb.end;L.push(cardGeo(R(2.2,3.0),R(2.0,2.8),e.x+R(-1.2,1.2),e.y+R(-0.6,0.9),e.z+R(-1.2,1.2),R(0,6.28),R(-0.7,0.7),C));}}
    const e=lb.end;for(let n=0;n<4;n++)L.push(cardGeo(R(2.4,3.2),R(2.2,3.0),e.x+R(-1.5,1.5),e.y+R(-0.4,1.2),e.z+R(-1.5,1.5),R(0,6.28),-Math.PI/2+R(-0.5,0.5),C));}
  // relleno superior de la copa
  for(let n=0;n<22;n++){const a=Math.random()*6.28,r=Math.sqrt(Math.random())*3.2;L.push(cardGeo(R(2.6,3.4),R(2.6,3.4),Math.cos(a)*r,R(7.6,9.4),Math.sin(a)*r,R(0,6.28),-Math.PI/2+R(-0.4,0.4),C));}
  const trunkG=mergeGeometries(t.map(g=>{const q=g.index?g.toNonIndexed():g;const c=[];for(let i=0;i<q.attributes.position.count;i++)c.push(1,1,1);q.setAttribute('color',new THREE.Float32BufferAttribute(c,3));return q;}));
  return{trunk:trunkG,leaves:mergeGeometries(L.map(g=>g.toNonIndexed()))};}
const barkMat=photoMat('bark_platanus',{ns:1.2,roughness:0.95});
const leavesPlatanMat=leafMat(ltex('leaves_platan.png',true,false));
for(let v=0;v<3;v++){const g=buildTreeVariant(v);defInst('trunk'+v,g.trunk,barkMat);defInst('leaves'+v,g.leaves,leavesPlatanMat);}
const TREES=[];
function tree(x,z,s=1,y){y=y===undefined?surfY(x,z):y;const v=(Math.random()*3)|0;const yaw=R(0,6.28);const sc=s*R(1.35,1.7);
  addInst('trunk'+v,x,y,z,yaw,sc,sc,sc);addInst('leaves'+v,x,y,z,yaw,sc,sc*R(0.9,1.08),sc,0,0,0,new THREE.Color().setHSL(R(0.22,0.28),R(0.25,0.45),R(0.62,0.78)).getHex());
  addBoxV(x-0.28*sc,x+0.28*sc,z-0.28*sc,z+0.28*sc,y-1,y+4);addInst('alcorque',x,y,z,0);TREES.push({x,z,y});}
