// =====================================================================
// LA CIUDAD ABANDONADA: hojas secas, basura, malas hierbas, hiedra en las fachadas y mobiliario volcado
// =====================================================================
// hojas de plátano secas (dibujadas con lóbulos, en ocres y marrones) con transparencia
const texLeafLitter=cTex(512,512,(g,w,h)=>{g.clearRect(0,0,w,h);const cols=['#8a5a24','#a8742e','#6e4a22','#b58a3e','#5a3e1c','#9a6a2a','#7a6a3a'];
  for(let i=0;i<70;i++){const x=R(30,w-30),y=R(30,h-30),s=R(10,24),a=R(0,6.28);g.save();g.translate(x,y);g.rotate(a);g.fillStyle=pick(cols);g.beginPath();
    for(let k=0;k<=10;k++){const t=k/10*Math.PI*2;const r=s*(0.55+0.45*Math.abs(Math.sin(t*2.5)));g.lineTo(Math.cos(t)*r,Math.sin(t)*r*0.9);}g.closePath();g.fill();
    g.strokeStyle='rgba(50,30,10,.6)';g.lineWidth=1.2;g.beginPath();g.moveTo(0,0);g.lineTo(s*0.9,0);g.moveTo(0,0);g.lineTo(-s*0.4,s*0.6);g.moveTo(0,0);g.lineTo(-s*0.4,-s*0.6);g.stroke();
    g.strokeStyle='#4a3014';g.beginPath();g.moveTo(0,0);g.lineTo(-s*1.2,0);g.stroke();g.restore();}},{});
texLeafLitter.wrapS=texLeafLitter.wrapT=THREE.ClampToEdgeWrapping;
const leafLitterMat=new THREE.MeshLambertMaterial({map:texLeafLitter,alphaTest:0.5,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
defInst('leafLitter',(()=>{const g=new THREE.PlaneGeometry(1.4,1.4);g.rotateX(-Math.PI/2);g.translate(0,0.008,0);return g;})(),leafLitterMat,1,1,false);
// malas hierbas: matas de hierba en cruz
const texWeed=cTex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<90;i++){const x=R(30,w-30),l=R(60,220);g.strokeStyle=pick(['#4a6a24','#5f7f2c','#3a5a1c','#7a8a3a','#8a8a4a']);g.lineWidth=R(2,5);
  g.beginPath();g.moveTo(x,h);g.quadraticCurveTo(x+R(-30,30),h-l*0.6,x+R(-50,50),h-l);g.stroke();}},{});
texWeed.wrapS=texWeed.wrapT=THREE.ClampToEdgeWrapping;
defInst('weed',(()=>{const a=new THREE.PlaneGeometry(0.7,0.5);a.translate(0,0.25,0);const b=a.clone();b.rotateY(Math.PI/2);return mergeGeometries([a,b]);})(),new THREE.MeshLambertMaterial({map:texWeed,alphaTest:0.45,side:THREE.DoubleSide}),1,1,false);
// hiedra colgando de las fachadas
const texIvy=cTex(256,512,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<9;i++){let x=R(20,w-20),y=0;g.strokeStyle='#3a2e1c';g.lineWidth=2;g.beginPath();g.moveTo(x,y);const pts=[];while(y<h*R(0.55,1)){x+=R(-14,14);y+=R(8,18);g.lineTo(x,y);pts.push([x,y]);}g.stroke();
  for(const [px,py] of pts)for(let k=0;k<3;k++){g.fillStyle=pick(['#2e4a1c','#3e5e24','#4a6a2a','#253e16','#5a6a2a']);g.beginPath();const lx=px+R(-14,14),ly=py+R(-8,8),s=R(5,10);g.moveTo(lx,ly-s);g.lineTo(lx+s,ly);g.lineTo(lx,ly+s*0.8);g.lineTo(lx-s,ly);g.closePath();g.fill();}}},{});
texIvy.wrapS=texIvy.wrapT=THREE.ClampToEdgeWrapping;
defInst('ivy',(()=>{const g=new THREE.PlaneGeometry(1,1);g.translate(0,-0.5,0);return g;})(),new THREE.MeshLambertMaterial({map:texIvy,alphaTest:0.5,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),1,1,false);
// papeles y plásticos
defInst('paper',(()=>{const g=new THREE.PlaneGeometry(0.28,0.2);g.rotateX(-Math.PI/2);g.translate(0,0.01,0);return g;})(),new THREE.MeshLambertMaterial({color:0xffffff}),1,1,false);
const LEAFCOL=[0xffffff,0xe8d8b8,0xd8c8a0,0xf0e0c0];
// sangre seca (mancha marrón oscura, mate) en aceras, junto a coches y dentro de locales
defInst('sangreSeca',(()=>{const g=new THREE.PlaneGeometry(1,1);g.rotateX(-Math.PI/2);return g;})(),new THREE.MeshLambertMaterial({map:texBlood,color:0xffd8c8,emissive:0x1a0806,transparent:true,opacity:0.7,alphaTest:0.3,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),1,1,false);
function decayWorld(){
  // sangre seca: en aceras al azar (con regueros), dentro de los locales con interior
  for(const bk of BLOCKS){if(bk.outer)continue;for(let k=0;k<5;k++){const e=RI(0,7);const A=bk.cp[e],B=bk.cp[(e+1)%8];const t=Math.random();const c=centroid(bk.bp);let x=A[0]+(B[0]-A[0])*t,z=A[1]+(B[1]-A[1])*t;const dx=x-c[0],dz=z-c[1],l=Math.hypot(dx,dz)||1;x+=dx/l*R(1,3.5);z+=dz/l*R(1,3.5);
    const s=R(0.6,1.8);addInst('sangreSeca',x,surfY(x,z)+0.008,z,R(0,6.28),s,1,s*R(0.6,1.4));if(Math.random()<0.4){const a=R(0,6.28);for(let j=1;j<4;j++)addInst('sangreSeca',x+Math.cos(a)*j*0.5,surfY(x,z)+0.008,z+Math.sin(a)*j*0.5,R(0,6.28),0.3,1,0.3);}}}
  for(const S of SHOPS)if(Math.random()<0.25){const x=S.x-S.nx*R(3,6),z=S.z-S.nz*R(3,6);const s=R(0.5,1.4);INTERIOR=true;addInst('sangreSeca',x,surfY(x,z,surfY(S.x,S.z)+0.3)+0.01,z,R(0,6.28),s,1,s);INTERIOR=false;}
  // hojas: alrededor de cada árbol y amontonadas junto al bordillo
  for(const t of TREES){const n=RI(3,7);for(let k=0;k<n;k++){const a=R(0,6.28),r=R(0.5,4.5);const x=t.x+Math.cos(a)*r,z=t.z+Math.sin(a)*r;addInst('leafLitter',x,surfY(x,z),z,R(0,6.28),R(0.7,1.6),1,R(0.7,1.6),0,0,0,pick(LEAFCOL));}
    if(Math.random()<0.6){const a=R(0,6.28);addInst('weed',t.x+Math.cos(a)*0.45,t.y,t.z+Math.sin(a)*0.45,R(0,6),R(0.6,1.3),R(0.6,1.4),R(0.6,1.3));}}
  // fachadas: hierba en la base, hiedra en algunas, papeles y bolsas en la acera
  for(const f of FACADES){if(f.outer)continue;const ux=(f.b[0]-f.a[0])/f.L,uz=(f.b[1]-f.a[1])/f.L;const yaw=Math.atan2(f.nx,f.nz);
    for(let t=R(1,5);t<f.L-1;t+=R(3,9)){const x=f.a[0]+ux*t+f.nx*0.15,z=f.a[1]+uz*t+f.nz*0.15;if(Math.random()<0.5)addInst('weed',x,surfY(x,z),z,R(0,6),R(0.5,1.2),R(0.4,1.1),R(0.5,1.2));
      if(Math.random()<0.3){const x2=f.a[0]+ux*t+f.nx*R(0.6,3),z2=f.a[1]+uz*t+f.nz*R(0.6,3);addInst('leafLitter',x2,surfY(x2,z2),z2,R(0,6),R(0.6,1.3),1,R(0.6,1.3),0,0,0,pick(LEAFCOL));}
      if(Math.random()<0.25){const x3=f.a[0]+ux*(t+R(-1,1))+f.nx*R(0.4,4),z3=f.a[1]+uz*(t+R(-1,1))+f.nz*R(0.4,4);addInst('paper',x3,surfY(x3,z3),z3,R(0,6),R(0.7,1.4),1,R(0.7,1.4),0,0,0,pick([0xf2f0e8,0xe8e0d0,0xd8e8f0,0xc8d8c0]));}}
    if(Math.random()<0.22&&f.L>6){const t=R(2,f.L-2),w=R(1.6,4),hh=R(3,Math.min(10,f.gf+f.fh*2));const top=Math.random()<0.5?f.yb+f.gf+f.fh*RI(0,2)+0.2:f.yb+hh;
      const x=f.a[0]+ux*t+f.nx*0.04,z=f.a[1]+uz*t+f.nz*0.04;addInst('ivy',x,top,z,yaw,w,Math.min(hh,top-f.yb),1);}}
  // mobiliario volcado o movido: papeleras tiradas, motos caídas
  for(const name of ['papelera']){const I=INST[name];for(const L of I.lists.values())for(const t of L){if(Math.random()<0.18){t[9]=R(1.3,1.6);t[1]+=0.22;t[3]+=R(-1,1);}}}
  for(const k of ['cont_resta','cont_organica','cont_envasos','cont_paper','cont_vidre']){const I=INST[k];if(!I)continue;for(const L of I.lists.values())for(const t of L){t[3]+=R(-0.25,0.25);t[0]+=R(-0.3,0.3);t[2]+=R(-0.3,0.3);}}
  // contenedores quemados o volcados, basura alrededor
  for(const k of ['cont_resta','cont_organica','cont_envasos','cont_paper','cont_vidre']){const I=INST[k];if(!I)continue;for(const L of I.lists.values())for(const t of L){const r=Math.random();
      if(r<0.12){addInst('contQuemado',t[0],t[1],t[2],t[3]);t[4]=t[5]=t[6]=0.0001;}else if(r<0.2){t[11]=(Math.random()<0.5?1:-1)*1.5;t[1]+=0.85;t[0]+=R(-0.4,0.4);}
      if(Math.random()<0.6){for(let n=0;n<RI(1,3);n++){const a=R(0,6.28),d=R(0.9,2.2);const x=t[0]+Math.cos(a)*d,z=t[2]+Math.sin(a)*d;addInst(pick(['bolsas','caja2','cajaPlana','bolsas']),x,surfY(x,z),z,R(0,6.28),R(0.8,1.2),R(0.8,1.2),R(0.8,1.2));}}}}
  // en aceras y calzadas: cajas, bolsas, ropa, maletas, colchones, ramas y algún árbol caído
  for(const bk of BLOCKS){if(bk.outer)continue;for(let e=0;e<8;e+=2){const a=bk.cp[e],b=bk.cp[(e+1)%8];const L=Math.hypot(b[0]-a[0],b[1]-a[1]);if(L<10)continue;const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;const c=centroid(bk.bp);let nx=-uz,nz=ux;if(nx*((a[0]+b[0])/2-c[0])+nz*((a[1]+b[1])/2-c[1])<0){nx=-nx;nz=-nz;}
    for(let t=R(1,4);t<L-2;t+=R(1.8,5)){const d=R(-6,2.8);const x=a[0]+ux*t+nx*d,z=a[1]+uz*t+nz*d;const y=surfY(x,z);const r=Math.random();
      const k=r<0.22?'caja2':r<0.36?'cajaPlana':r<0.52?'bolsas':r<0.7?'ropa':r<0.76?'maleta':r<0.8?'colchon':'rama';addInst(k,x,y+(k==='colchon'?0.0:0),z,R(0,6.28),R(0.8,1.25),1,R(0.8,1.25));}
    if(Math.random()<0.18){const t=R(10,L-10);const x=a[0]+ux*t+nx*R(1,4),z=a[1]+uz*t+nz*R(1,4);addInst('tronco',x,H(x,z)+0.02,z,Math.atan2(-nz,nx)+R(-0.7,0.7));}}}
  // hojas acumuladas en la calzada junto al bordillo
  for(const bk of BLOCKS){if(bk.outer)continue;for(let e=0;e<8;e+=2){const a=bk.cp[e],b=bk.cp[(e+1)%8];const L=Math.hypot(b[0]-a[0],b[1]-a[1]);const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;const c=centroid(bk.bp);let nx=-uz,nz=ux;if(nx*((a[0]+b[0])/2-c[0])+nz*((a[1]+b[1])/2-c[1])<0){nx=-nx;nz=-nz;}
    for(let t=R(1,4);t<L;t+=R(2,6)){const x=a[0]+ux*t+nx*R(0.3,1.1),z=a[1]+uz*t+nz*R(0.3,1.1);addInst('leafLitter',x,H(x,z),z,R(0,6),R(0.8,1.8),1,R(0.6,1.2),0,0,0,pick(LEAFCOL));}}}}
// ---------- humo: columnas que salen de algunos edificios incendiados (billboards instanciados, baratos) ----------
const SMOKE_N=34,SMOKES=[];let smokeMesh=null;
const smokeMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uFog:{value:new THREE.Color()},uFar:{value:300},uDay:{value:1}},
  vertexShader:`attribute vec4 aP;attribute float aR;varying vec2 vUv;varying float vA;varying float vD;void main(){vUv=uv;vec4 mv=viewMatrix*vec4(aP.xyz,1.0);float c=cos(aR),s=sin(aR);vec2 q=mat2(c,-s,s,c)*position.xy;mv.xy+=q*aP.w;vD=-mv.z;vA=clamp(aR*0.0+1.0,0.0,1.0);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`varying vec2 vUv;varying float vD;uniform vec3 uFog;uniform float uFar,uDay;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
    void main(){vec2 d=vUv-0.5;float r=length(d)*2.0;float m=n(vUv*4.0+vD*0.01)*0.6+n(vUv*9.0)*0.4;float a=smoothstep(1.0,0.2,r+(m-0.5)*0.6)*0.5;if(a<0.01)discard;
      vec3 c=mix(vec3(0.05,0.05,0.055),vec3(0.28,0.27,0.26),uDay)*(0.75+m*0.4);float f=clamp(vD/uFar,0.0,1.0);c=mix(c,uFog,f*0.85);gl_FragColor=vec4(c,a*(1.0-f*0.5));}`});
function setupSmoke(){const src=FACADES.filter(f=>!f.outer&&f.L>8);for(let k=0;k<6&&src.length;k++){const f=src.splice(RI(0,src.length-1),1)[0];const t=R(2,f.L-2);const ux=(f.b[0]-f.a[0])/f.L,uz=(f.b[1]-f.a[1])/f.L;
    SMOKES.push({x:f.a[0]+ux*t-f.nx*4,z:f.a[1]+uz*t-f.nz*4,y:f.yb+f.gf+f.fh*f.F+0.5,p:[]});}
  if(typeof SMOKECARS!=='undefined')for(const [x,z] of SMOKECARS.slice(0,3))SMOKES.push({x,z,y:surfY(x,z)+1.0,p:[]});// coches aún humeando
  const g=new THREE.InstancedBufferGeometry();const pl=new THREE.PlaneGeometry(1,1);g.index=pl.index;g.attributes.position=pl.attributes.position;g.attributes.uv=pl.attributes.uv;
  const n=SMOKES.length*SMOKE_N;g.instanceCount=n;g.setAttribute('aP',new THREE.InstancedBufferAttribute(new Float32Array(n*4),4));g.setAttribute('aR',new THREE.InstancedBufferAttribute(new Float32Array(n),1));
  smokeMesh=new THREE.Mesh(g,smokeMat);smokeMesh.frustumCulled=false;smokeMesh.renderOrder=2;scene.add(smokeMesh);
  for(const s of SMOKES)for(let i=0;i<SMOKE_N;i++)s.p.push({t:Math.random()*14,o:R(0,6.28),sp:R(0.9,1.3)});}
function stepSmoke(dt,fogC,far,day){if(!smokeMesh)return;const P_=smokeMesh.geometry.attributes.aP,R_=smokeMesh.geometry.attributes.aR;let k=0;const wx=1.6,wz=0.6;
  for(const s of SMOKES)for(const q of s.p){q.t+=dt*q.sp;if(q.t>14)q.t-=14;const t=q.t;P_.setXYZW(k,s.x+wx*t*t*0.08+Math.sin(q.o+t*0.3)*0.6,s.y+t*2.2,s.z+wz*t*t*0.08+Math.cos(q.o+t*0.3)*0.6,2+t*1.5);R_.setX(k,q.o+t*0.15);k++;}
  P_.needsUpdate=true;R_.needsUpdate=true;smokeMat.uniforms.uFog.value.copy(fogC);smokeMat.uniforms.uFar.value=far;smokeMat.uniforms.uDay.value=day;}
