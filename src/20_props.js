// =====================================================================
// GEOMETRÍA AUXILIAR Y MOBILIARIO URBANO DE BARCELONA (instanciado)
// =====================================================================
const hexTint=h=>{const c=new THREE.Color(h);return[c.r,c.g,c.b];};
function colorize(geo,hex){const c=new THREE.Color(hex);const n=geo.attributes.position.count;const a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b;}geo.setAttribute('color',new THREE.BufferAttribute(a,3));return geo;}
function mkG(parts){return mergeGeometries(parts.map(([g,col])=>{let q=(g.index?g.toNonIndexed():g);for(const k of Object.keys(q.attributes))if(!['position','normal','uv'].includes(k))q.deleteAttribute(k);
  if(q.attributes.uv===undefined)q.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(q.attributes.position.count*2),2));return colorize(q,col);}));}
const bx=(w,h,d,x,y,z,rx=0,ry=0,rz=0)=>{const g=new THREE.BoxGeometry(w,h,d);if(rx||ry||rz)g.applyMatrix4(new M4().makeRotationFromEuler(new THREE.Euler(rx,ry,rz)));g.translate(x,y,z);return g;};
const cy=(r0,r1,h,x,y,z,seg=8,rx=0,rz=0)=>{const g=new THREE.CylinderGeometry(r0,r1,h,seg);if(rx||rz)g.applyMatrix4(new M4().makeRotationFromEuler(new THREE.Euler(rx,0,rz)));g.translate(x,y,z);return g;};
const sp=(r,x,y,z,seg=8)=>{const g=new THREE.SphereGeometry(r,seg,Math.max(4,seg/2|0));g.translate(x,y,z);return g;};
const tor=(r,t,x,y,z,ry=0,seg=14)=>{const g=new THREE.TorusGeometry(r,t,5,seg);g.rotateY(ry);g.translate(x,y,z);return g;};
// tubo entre dos puntos
const tube=(a,b,r,seg=6)=>{const A=new V3(...a),B=new V3(...b);const d=B.clone().sub(A);const g=new THREE.CylinderGeometry(r,r,d.length(),seg);g.applyQuaternion(new Q4().setFromUnitVectors(UP,d.clone().normalize()));const m=A.add(B).multiplyScalar(0.5);g.translate(m.x,m.y,m.z);return g;};
const metalMat=pbr(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.45,metalness:0.55}));
const paintMat=pbr(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.6,metalness:0.15}));
const plasticMat=pbr(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.75,metalness:0}));
const woodPropMat=photoMat('wood_dark',{ns:0.5});
const glassMat=pbr(new THREE.MeshStandardMaterial({color:0xa9c0c8,roughness:0.04,metalness:0.1,transparent:true,opacity:0.28,depthWrite:false,side:THREE.DoubleSide,envMapIntensity:1.5}));
const emisMat=new THREE.MeshBasicMaterial({vertexColors:true});
const IRON=0x2b302d,GREY=0x6a6f73,DGREY=0x2e3236,LAMPG=0x33403b,WOOD=0x8a5a32;
const PLANE=new THREE.PlaneGeometry(1,1);

// ---------- atlas de señales de tráfico (normativa española) ----------
const texSigns=cTex(1024,512,(g)=>{const C=256;const cell=(i,f)=>{const x=(i%4)*C,y=Math.floor(i/4)*C;g.save();g.translate(x,y);f();g.restore();};
  const disc=(fill,ring)=>{g.fillStyle=ring;g.beginPath();g.arc(128,128,118,0,7);g.fill();g.fillStyle=fill;g.beginPath();g.arc(128,128,96,0,7);g.fill();};
  // 0 sentido obligatorio/única (azul con flecha)
  cell(0,()=>{g.fillStyle='#fff';g.fillRect(8,8,240,240);g.fillStyle='#1d56a8';g.fillRect(16,16,224,224);g.fillStyle='#fff';g.beginPath();g.moveTo(40,128);g.lineTo(150,60);g.lineTo(150,100);g.lineTo(216,100);g.lineTo(216,156);g.lineTo(150,156);g.lineTo(150,196);g.closePath();g.fill();});
  // 1 dirección prohibida
  cell(1,()=>{g.fillStyle='#fff';g.beginPath();g.arc(128,128,122,0,7);g.fill();g.fillStyle='#c8102e';g.beginPath();g.arc(128,128,114,0,7);g.fill();g.fillStyle='#fff';g.fillRect(40,106,176,44);});
  // 2 paso de peatones
  cell(2,()=>{g.fillStyle='#fff';g.fillRect(8,8,240,240);g.fillStyle='#1d56a8';g.fillRect(16,16,224,224);g.fillStyle='#fff';g.beginPath();g.moveTo(128,30);g.lineTo(226,214);g.lineTo(30,214);g.closePath();g.fill();
    g.fillStyle='#111';for(let i=0;i<4;i++)g.fillRect(70+i*30,180,18,24);g.beginPath();g.arc(128,92,10,0,7);g.fill();g.lineWidth=9;g.strokeStyle='#111';line(g,128,104,122,140);line(g,122,140,108,170);line(g,122,140,138,168);line(g,126,114,106,130);line(g,126,114,146,126);});
  // 3 limitación 30
  cell(3,()=>{disc('#fff','#c8102e');g.fillStyle='#111';g.font='bold 110px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('30',128,134);});
  // 4 stop
  cell(4,()=>{g.fillStyle='#fff';g.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;g.lineTo(128+124*Math.cos(a),128+124*Math.sin(a));}g.fill();g.fillStyle='#c8102e';g.beginPath();for(let i=0;i<8;i++){const a=Math.PI/8+i*Math.PI/4;g.lineTo(128+114*Math.cos(a),128+114*Math.sin(a));}g.fill();
    g.fillStyle='#fff';g.font='bold 78px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('STOP',128,132);});
  // 5 ceda el paso
  cell(5,()=>{g.fillStyle='#c8102e';g.beginPath();g.moveTo(10,30);g.lineTo(246,30);g.lineTo(128,236);g.closePath();g.fill();g.fillStyle='#fff';g.beginPath();g.moveTo(46,50);g.lineTo(210,50);g.lineTo(128,194);g.closePath();g.fill();});
  // 6 carga y descarga
  cell(6,()=>{g.fillStyle='#fff';g.fillRect(8,8,240,240);g.fillStyle='#1d56a8';g.fillRect(16,16,224,224);g.fillStyle='#fff';g.font='bold 54px Arial';g.textAlign='center';g.fillText('C/D',128,96);g.font='bold 30px Arial';g.fillText('8-20h',128,150);g.fillText('Màx 30 min',128,196);});
  // 7 prohibido estacionar
  cell(7,()=>{disc('#1d56a8','#c8102e');g.strokeStyle='#c8102e';g.lineWidth=22;line(g,60,60,196,196);});
},{});
texSigns.wrapS=texSigns.wrapT=THREE.ClampToEdgeWrapping;
const signMat=atlasMat(texSigns,null,4,2,{side:THREE.DoubleSide,alphaTest:0.5});
// cara de señal (plano de 0.6 m) + palo
defInst('signFace',(()=>{const g=new THREE.PlaneGeometry(0.6,0.6);return g;})(),signMat,4,2,true);
const SIGNBACK=new THREE.MeshLambertMaterial({color:0x8a8e90});
defInst('signPole',mkG([[cy(0.03,0.03,3.1,0,1.55,0,6),0x8d9194]]),metalMat,1,1,true);

// ---------- farola del Eixample (fanal alto con brazo) ----------
{const p=[[cy(0.16,0.2,0.6,0,0.3,0,10),LAMPG],[cy(0.09,0.13,8.2,0,4.4,0,10),LAMPG],[cy(0.11,0.11,0.12,0,1.2,0,10),LAMPG]];
  const arc=[];for(let i=0;i<6;i++){const a0=i/6*Math.PI/2,a1=(i+1)/6*Math.PI/2;arc.push([tube([0,8.4+Math.sin(a0)*0.6,(1-Math.cos(a0))*0.9],[0,8.4+Math.sin(a1)*0.6,(1-Math.cos(a1))*0.9],0.05),LAMPG]);}
  p.push(...arc,[tube([0,9.0,0.9],[0,9.0,1.6],0.045),LAMPG],[bx(0.42,0.16,0.75,0,8.92,1.75),LAMPG],[bx(0.36,0.03,0.66,0,8.83,1.75),0xe8e2cc]);
  defInst('fanal',mkG(p),paintMat,1,1,true);}
// farola peatonal de rambla (fanal de 5 brazos simplificado)
defInst('fanalR',mkG([[cy(0.12,0.16,4.2,0,2.1,0,10),LAMPG],[sp(0.22,0,4.5,0,10),0xf0ead8],[cy(0.05,0.05,0.3,0,4.2,0),LAMPG],[sp(0.16,0.55,4.1,0,8),0xf0ead8],[sp(0.16,-0.55,4.1,0,8),0xf0ead8],[tube([0,3.9,0],[0.55,3.95,0],0.03),LAMPG],[tube([0,3.9,0],[-0.55,3.95,0],0.03),LAMPG]]),paintMat,1,1,true);
// papelera de Barcelona (cilindro gris sobre poste)
defInst('papelera',mkG([[cy(0.045,0.045,0.95,0,0.47,-0.02,8),GREY],[cy(0.21,0.19,0.62,0,0.78,0.2,14),0x7b8085],[cy(0.215,0.215,0.05,0,1.1,0.2,14),0x4c5053],[bx(0.16,0.12,0.02,0,0.95,0.41),0x222222]]),metalMat,1,1,true);
// banco neorromántico (listones de madera, patas de hierro)
{const WD=0x7a4e2c;const p=[];for(let i=0;i<5;i++)p.push([bx(1.75,0.035,0.07,0,0.44,-0.2+i*0.085),WD]);for(let i=0;i<4;i++)p.push([bx(1.75,0.07,0.03,0,0.6+i*0.1,0.26+i*0.03,-0.25),WD]);
  for(const x of [-0.75,0.75]){p.push([bx(0.06,0.44,0.08,x,0.22,-0.18),IRON],[bx(0.06,0.44,0.08,x,0.22,0.2),IRON],[bx(0.06,0.06,0.5,x,0.42,0),IRON],[bx(0.05,0.55,0.05,x,0.72,0.32,-0.25),IRON],[bx(0.06,0.05,0.42,x,0.62,0.02),IRON]);}
  defInst('banc',mkG(p),paintMat,1,1,true);}
// pilona (bolardo de fundición)
defInst('pilona',mkG([[cy(0.08,0.095,0.82,0,0.41,0,7),0x353837],[sp(0.082,0,0.82,0,6),0x353837]]),metalMat,1,1,true);
// alcorque con reja
const texGrate=cTex(128,128,(g,w,h)=>{g.fillStyle='#1c1d1d';g.fillRect(0,0,w,h);g.strokeStyle='#3a3b3a';g.lineWidth=5;for(let i=6;i<w;i+=12){line(g,i,0,i,h);}g.lineWidth=8;g.strokeRect(4,4,w-8,h-8);g.fillStyle='#4a3c2c';g.beginPath();g.arc(64,64,22,0,7);g.fill();},{});
defInst('alcorque',(()=>{const g=new THREE.PlaneGeometry(1.3,1.3);g.rotateX(-Math.PI/2);g.translate(0,0.006,0);return g;})(),new THREE.MeshLambertMaterial({map:texGrate}),1,1,true);
// contenedores de Barcelona (carga lateral): resta, orgànica, envasos, paper, vidre
const CONT=[['resta',0x55595c],['organica',0x6a4a2c],['envasos',0xe0b91a],['paper',0x1c5aa6],['vidre',0x2b7a30]];
for(const [k,col] of CONT){const p=[[bx(1.85,1.45,1.55,0,0.85,0),col],[bx(1.9,0.18,1.62,0,1.62,-0.04,0.12),col],[bx(1.86,0.12,1.56,0,0.09,0),0x1e1e1e],[bx(1.5,0.22,0.03,0,1.05,0.79),0xf2f2f2],[bx(0.08,0.5,0.06,-0.95,1.1,0.3),0x1e1e1e],[bx(0.08,0.5,0.06,0.95,1.1,0.3),0x1e1e1e]];
  if(k==='vidre')p.push([cy(0.12,0.12,0.06,0,1.72,0.2,10),0x1e1e1e]);defInst('cont_'+k,mkG(p),plasticMat,1,1,true);}
// Bicing: anclaje y bicicleta (blanca y roja)
defInst('bicingDock',mkG([[bx(0.12,0.9,0.12,0,0.45,0),0x6c7176],[bx(0.14,0.12,0.16,0,0.95,0),0xd31f26],[bx(0.06,0.25,0.3,0,0.5,0.18),0x45494c]]),metalMat,1,1,true);
{const W=0xf2f2f2,RD=0xd31f26,BK=0x161616;const p=[[tor(0.33,0.022,0,0.34,0.55,Math.PI/2,16),BK],[tor(0.33,0.022,0,0.34,-0.52,Math.PI/2,16),BK],[cy(0.04,0.04,0.06,0,0.34,0.55,8,0,Math.PI/2),0x999999],[cy(0.04,0.04,0.06,0,0.34,-0.52,8,0,Math.PI/2),0x999999]];
  p.push([tube([0,0.36,-0.52],[0,0.6,-0.1],0.03),W],[tube([0,0.6,-0.1],[0,0.95,-0.22],0.03),W],[tube([0,0.42,0.02],[0,0.95,0.42],0.035),W],[tube([0,0.42,0.02],[0,0.6,-0.1],0.04),W],[tube([0,0.42,0.02],[0,0.38,-0.5],0.025),W],
    [tube([0,0.34,0.55],[0,1.0,0.42],0.025),RD],[bx(0.55,0.03,0.03,0,1.06,0.4),BK],[bx(0.18,0.06,0.26,0,0.99,-0.25),BK],[bx(0.32,0.18,0.28,0,0.93,0.66),RD],[bx(0.06,0.4,0.05,0,0.62,0.15),RD],[bx(0.08,0.06,0.9,0,0.7,0.0),RD]);
  defInst('bicingBike',mkG(p),paintMat,1,1,true);}
defInst('bicingTotem',mkG([[bx(0.55,2.15,0.28,0,1.07,0),0xd31f26],[bx(0.56,0.45,0.29,0,1.95,0),0xf2f2f2],[bx(0.36,0.28,0.02,0,1.35,0.15),0x111518],[bx(0.6,0.05,0.32,0,0.03,0),0x333333]]),paintMat,1,1,true);
// marquesina de autobús TMB (techo de vidrio, panel trasero, mupi, banco)
{const ST=0x5c6266;const p=[[bx(4.6,0.07,1.75,0,2.55,0),0x8a9094],[bx(0.08,2.55,0.08,-2.0,1.27,-0.7),ST],[bx(0.08,2.55,0.08,2.0,1.27,-0.7),ST],[bx(1.3,2.3,0.32,-2.6,1.2,-0.62),0x3a3f42],[bx(2.6,0.04,0.38,0.4,0.48,-0.5),ST],[bx(2.6,0.04,0.38,0.4,0.46,-0.5),0x9aa0a4],[bx(0.06,0.46,0.3,-0.7,0.23,-0.5),ST],[bx(0.06,0.46,0.3,1.5,0.23,-0.5),ST],[bx(4.2,0.22,0.06,0,2.4,0.84),0xd8202a]];
  defInst('marquesina',mkG(p),metalMat,1,1,true);
  const gl=mkG([[bx(4.0,2.1,0.02,0,1.35,-0.74),0xffffff],[bx(4.6,0.02,1.75,0,2.6,0),0xffffff]]);defInst('marquesinaGlass',gl,glassMat,1,1,true);
  defInst('mupi',mkG([[bx(1.12,1.75,0.02,0,0,0),0xffffff]]),new THREE.MeshLambertMaterial({map:null,color:0xffffff,emissive:0xffffff,emissiveIntensity:0.0}),1,1,true);}
// poste de parada de bus (rojo TMB)
const texBus=cTex(256,512,(g)=>{g.fillStyle='#d8202a';g.fillRect(0,0,256,512);g.fillStyle='#fff';g.font='bold 92px Arial';g.textAlign='center';g.fillText('BUS',128,110);g.fillStyle='#fff';g.fillRect(16,150,224,340);
  g.fillStyle='#d8202a';g.font='bold 44px Arial';['V13','H10','22','24','7','D40'].forEach((t,i)=>g.fillText(t,128,206+i*48));},{});
defInst('busPole',mkG([[cy(0.04,0.04,2.9,0,1.45,0,8),0xd8202a]]),paintMat,1,1,true);
defInst('busPlate',(()=>{const g=new THREE.PlaneGeometry(0.42,0.84);g.translate(0,2.45,0.05);return g;})(),new THREE.MeshLambertMaterial({map:texBus,side:THREE.DoubleSide}),1,1,true);
// semáforo (vehículos) y peatonal
{const p=[[cy(0.055,0.065,3.4,0,1.7,0,8),0x575c60],[bx(0.32,0.92,0.24,0,3.0,0.18),0x1c1e1f],[bx(0.42,1.0,0.03,0,3.0,0.06),0x1c1e1f]];
  for(const [y,c] of [[3.3,0x6a1010],[3.0,0x6a5208],[2.7,0x0b5a2a]])p.push([cy(0.1,0.1,0.04,0,y,0.31,10,Math.PI/2),c],[bx(0.24,0.03,0.12,0,y+0.13,0.36),0x1c1e1f]);
  p.push([bx(0.24,0.5,0.18,0.0,2.1,-0.14),0x1c1e1f],[bx(0.16,0.16,0.02,0,2.22,-0.24),0x5a1010],[bx(0.16,0.16,0.02,0,1.98,-0.24),0x0b4a24]);
  defInst('semafor',mkG(p),paintMat,1,1,true);}
// moto aparcada (scooter)
{const p=[[tor(0.22,0.06,0,0.24,0.6,Math.PI/2,12),0x151515],[tor(0.22,0.06,0,0.24,-0.62,Math.PI/2,12),0x151515],[bx(0.34,0.3,0.9,0,0.45,-0.25),0xc8ccd0],[bx(0.36,0.18,0.62,0,0.72,-0.28),0x1a1a1a],
  [bx(0.3,0.6,0.2,0,0.6,0.42,-0.3),0xc8ccd0],[bx(0.62,0.04,0.04,0,1.12,0.5),0x222222],[cy(0.025,0.025,0.6,0,0.82,0.55,6,-0.3),0x333333],[bx(0.16,0.1,0.05,0,0.95,0.6),0xeeeedd]];
  defInst('moto',mkG(p),paintMat,1,1,true);}
// parquímetro (àrea verda)
defInst('parquimetre',mkG([[bx(0.32,1.35,0.22,0,0.67,0),0x5d6266],[bx(0.33,0.12,0.23,0,1.2,0),0x2f9a48],[bx(0.2,0.14,0.02,0,1.0,0.12),0x111111]]),metalMat,1,1,true);
// armario eléctrico
defInst('armari',mkG([[bx(0.9,1.25,0.38,0,0.62,0),0x9a9a8e],[bx(0.92,0.06,0.42,0,1.27,0),0x7a7a70]]),plasticMat,1,1,true);
// quiosco de prensa (verde)
defInst('kiosk',mkG([[bx(3,2.5,2,0,1.25,0),0x2f4f3a],[bx(3.4,0.12,2.4,0,2.56,0),0x23392b],[bx(2.7,1.4,0.04,0,1.5,1.02),0x6e7a72]]),paintMat,1,1,true);
// fuente de Barcelona (fundición verde)
defInst('font',mkG([[cy(0.13,0.17,1.35,0,0.68,0,12),0x2c3a30],[cy(0.2,0.14,0.14,0,1.42,0,12),0x2c3a30],[sp(0.1,0,1.55,0,8),0x2c3a30],[bx(0.04,0.04,0.25,0,1.15,0.15),0xa08a40],[cy(0.3,0.26,0.16,0,0.08,0.28,12),0x2c3a30]]),paintMat,1,1,true);
// jardinera de la superilla (madera + arbustos)
defInst('jardinera',mkG([[bx(2.4,0.55,1.1,0,0.27,0),0x8a6a48],[sp(0.45,-0.6,0.75,0,7),0x3d5a2a],[sp(0.5,0.1,0.8,0.05,7),0x4a6b30],[sp(0.4,0.75,0.72,-0.05,7),0x355126]]),plasticMat,1,1,true);
// mesa y sillas de terraza (aluminio)
defInst('terrassa',mkG([[cy(0.35,0.35,0.03,0,0.73,0,14),0xb9bec2],[cy(0.025,0.025,0.72,0,0.36,0,6),0x9aa0a4],[cy(0.2,0.2,0.02,0,0.01,0,10),0x9aa0a4],
  ...[0,1,2].flatMap(i=>{const a=i*2.1,x=Math.cos(a)*0.62,z=Math.sin(a)*0.62;return[[bx(0.42,0.03,0.42,x,0.45,z,0,-a),0xb9bec2],[bx(0.42,0.4,0.03,x+Math.cos(a)*0.2,0.65,z+Math.sin(a)*0.2,0,-a+Math.PI/2),0xb9bec2],[cy(0.015,0.015,0.45,x,0.22,z,5),0x9aa0a4]];})]),metalMat,1,1,true);
// barrera de hormigón (new jersey) y valla militar (límite del mapa)
defInst('jersey',mkG([[bx(2.0,0.25,0.6,0,0.12,0),0xb4b0a6],[bx(2.0,0.6,0.25,0,0.55,0),0xb4b0a6],[bx(2.0,0.1,0.18,0,0.9,0),0xc8c4ba]]),plasticMat,1,1,true);
const texFence=cTex(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#8a8f92';g.lineWidth=2;for(let i=-w;i<w*2;i+=12){line(g,i,0,i+h,h);line(g,i,h,i+h,0);}g.lineWidth=6;g.strokeRect(2,2,w-4,h-4);},{});
defInst('valla',(()=>{const g=new THREE.PlaneGeometry(3.4,2.0);g.translate(0,1.15,0);return g;})(),new THREE.MeshLambertMaterial({map:texFence,alphaTest:0.4,side:THREE.DoubleSide}),1,1,true);
defInst('vallaBase',mkG([[bx(0.6,0.15,0.35,-1.7,0.07,0),0x9a968c],[bx(0.6,0.15,0.35,1.7,0.07,0),0x9a968c],[cy(0.02,0.02,2.1,-1.7,1.1,0,5),0x8a8f92],[cy(0.02,0.02,2.1,1.7,1.1,0,5),0x8a8f92]]),metalMat,1,1,true);
// palé y sacos (barricadas)
defInst('pale',mkG([[bx(1.2,0.03,0.12,0,0.13,-0.5),0xb08a5a],[bx(1.2,0.03,0.12,0,0.13,0),0xb08a5a],[bx(1.2,0.03,0.12,0,0.13,0.5),0xb08a5a],[bx(0.1,0.1,1.1,-0.55,0.06,0),0x8a6a40],[bx(0.1,0.1,1.1,0,0.06,0),0x8a6a40],[bx(0.1,0.1,1.1,0.55,0.06,0),0x8a6a40]]),woodPropMat,1,1,true);
defInst('sacos',mkG([[bx(1.4,0.3,0.5,0,0.15,0),0x9a8a62],[bx(1.3,0.28,0.48,0.1,0.44,0,0,0.1),0x8e7e58],[bx(1.2,0.26,0.46,-0.05,0.71,0,0,-0.08),0xa2926a]]),plasticMat,1,1,true);
defInst('tablon',mkG([[bx(1,0.18,0.03,0,0,0),0xb89a72]]),woodPropMat,1,1,true);
// cajas de cartón / productos caídos
defInst('caja',mkG([[bx(0.5,0.38,0.4,0,0.19,0),0xb08a5a]]),plasticMat,1,1,true);
// carrito de la compra
{const M=0xb8bcc0;const p=[[bx(0.55,0.03,0.85,0,0.55,0),M],[bx(0.03,0.45,0.85,-0.28,0.78,0),M],[bx(0.03,0.45,0.85,0.28,0.78,0),M],[bx(0.55,0.45,0.03,0,0.78,0.42),M],[bx(0.55,0.45,0.03,0,0.78,-0.42),M],[bx(0.6,0.04,0.04,0,1.05,-0.5),0xd8202a],
  ...[[-0.24,0.36],[0.24,0.36],[-0.22,-0.38],[0.22,-0.38]].flatMap(([x,z])=>[[cy(0.012,0.012,0.5,x,0.3,z,5),M],[cy(0.05,0.05,0.04,x,0.05,z,8,0,Math.PI/2),0x222222]])];
  defInst('carro',mkG(p),metalMat,1,1,true);}
// cristales rotos en el suelo
const texShards=cTex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<70;i++){g.fillStyle=`rgba(${200+R(0,40)|0},${220+R(0,30)|0},235,${R(0.35,0.75)})`;g.beginPath();const x=R(10,w-10),y=R(10,h-10),s=R(3,16);g.moveTo(x,y);g.lineTo(x+R(-s,s),y+R(-s,s));g.lineTo(x+R(-s,s),y+R(-s,s));g.fill();}},{});
defInst('shards',(()=>{const g=new THREE.PlaneGeometry(1.6,1.2);g.rotateX(-Math.PI/2);g.translate(0,0.012,0);return g;})(),new THREE.MeshLambertMaterial({map:texShards,transparent:true,depthWrite:false}),1,1,true);
// grafitis (fotos CC0, atlas 4x4 con alfa)
const texGraff=ltex('graffiti.png',true,false);
const graffMat=atlasMat(texGraff,null,4,4,{transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
defInst('graffiti',PLANE,graffMat,4,4,true);
// basura / bolsas
defInst('bolsa',mkG([[sp(0.25,0,0.22,0,7),0x1a1a1a],[sp(0.2,0.3,0.18,0.1,7),0x2a2a2a]]),plasticMat,1,1,true);
