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
// materiales del mobiliario: el color va por vértice y encima una foto de detalle (grano del metal/plástico, relieve y brillo irregular)
function detMat(name,rough,metal,ns){const m=new THREE.MeshStandardMaterial({vertexColors:true,map:ltex(name+'_diff.jpg'),normalMap:ltex(name+'_nor.jpg',false),roughnessMap:ltex(name+'_rough.jpg',false),roughness:rough,metalness:metal});m.normalScale=new THREE.Vector2(ns,ns);return pbr(m);}
const metalMat=detMat('det_metal',1.35,0.55,0.9);
const paintMat=detMat('det_metal',1.7,0.12,0.7);
const plasticMat=detMat('det_plastic',2.0,0,0.8);
// torneado (perfil [radio,altura]) y perfil 2D [z,y] extruido a lo ancho (x)
const lathe=(pts,seg=16,x=0,y=0,z=0)=>{const g=new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg);g.translate(x,y,z);return g;};
const prof=(pts,w,x=0)=>{const sh=new THREE.Shape();pts.forEach((p,i)=>i?sh.lineTo(p[0],p[1]):sh.moveTo(p[0],p[1]));sh.closePath();const g=new THREE.ExtrudeGeometry(sh,{depth:w,bevelEnabled:false});g.translate(0,0,-w/2);g.rotateY(-Math.PI/2);g.translate(x,0,0);return g;};
const ell=(rx,ry,rz,x,y,z,seg=10)=>{const g=new THREE.SphereGeometry(1,seg,Math.max(6,seg*0.7|0));g.scale(rx,ry,rz);g.translate(x,y,z);return g;};
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
const SIGNBACK=pbr(new THREE.MeshStandardMaterial({color:0x9a9ea2,roughness:0.5,metalness:0.6}));
// trasera de la señal (chapa gris) y abrazaderas al poste
defInst('signBackS',(()=>{const g=new THREE.BoxGeometry(0.6,0.6,0.012);g.translate(0,0,-0.008);return g;})(),SIGNBACK,1,1,true);
defInst('signBackC',(()=>{const g=new THREE.CylinderGeometry(0.3,0.3,0.012,24);g.rotateX(Math.PI/2);g.translate(0,0,-0.008);return g;})(),SIGNBACK,1,1,true);
defInst('signPole',mkG([[cy(0.03,0.03,3.1,0,1.55,0,6),0x8d9194]]),metalMat,1,1,true);

// ---------- farola del Eixample (fanal alto con brazo) ----------
{const p=[[cy(0.16,0.2,0.6,0,0.3,0,10),LAMPG],[cy(0.09,0.13,8.2,0,4.4,0,10),LAMPG],[cy(0.11,0.11,0.12,0,1.2,0,10),LAMPG]];
  const arc=[];for(let i=0;i<6;i++){const a0=i/6*Math.PI/2,a1=(i+1)/6*Math.PI/2;arc.push([tube([0,8.4+Math.sin(a0)*0.6,(1-Math.cos(a0))*0.9],[0,8.4+Math.sin(a1)*0.6,(1-Math.cos(a1))*0.9],0.05),LAMPG]);}
  p.push(...arc,[tube([0,9.0,0.9],[0,9.0,1.6],0.045),LAMPG],[bx(0.42,0.16,0.75,0,8.92,1.75),LAMPG],[bx(0.36,0.03,0.66,0,8.83,1.75),0xe8e2cc]);
  defInst('fanal',mkG(p),paintMat,1,1,true);}
// farola peatonal de rambla (fanal de 5 brazos simplificado)
defInst('fanalR',mkG([[cy(0.12,0.16,4.2,0,2.1,0,10),LAMPG],[sp(0.22,0,4.5,0,10),0xf0ead8],[cy(0.05,0.05,0.3,0,4.2,0),LAMPG],[sp(0.16,0.55,4.1,0,8),0xf0ead8],[sp(0.16,-0.55,4.1,0,8),0xf0ead8],[tube([0,3.9,0],[0.55,3.95,0],0.03),LAMPG],[tube([0,3.9,0],[-0.55,3.95,0],0.03),LAMPG]]),paintMat,1,1,true);
// papelera de Barcelona: cubo gris abatible colgado de un poste con aro
defInst('papelera',mkG([[cy(0.04,0.04,1.02,0,0.51,-0.02,10),0x6d7276],[sp(0.042,0,1.02,-0.02,8),0x6d7276],[tube([0,0.92,-0.02],[0,0.92,0.12],0.018),0x6d7276],
  [lathe([[0.001,0.34],[0.15,0.35],[0.185,0.42],[0.215,0.96],[0.228,0.965],[0.228,0.99],[0.2,0.99],[0.195,0.5],[0.001,0.46]],18,0,0,0.33),0x868b8f],[tor(0.222,0.013,0,0.99,0.33,0,18).rotateX(0),0x55595c],
  [bx(0.2,0.13,0.012,0,0.72,0.545),0xe8e8e2]]),metalMat,1,1,true);
// banco Barcelona: listones de madera sobre dos patas de fundición de aluminio
{const WD=0xb07a48,AL=0x9da2a6;const w=[],m=[];
  // listones siguiendo la curva del asiento y del respaldo
  for(const [z,y,a] of [[-0.215,0.43,0.1],[-0.135,0.425,0.04],[-0.055,0.42,0],[0.025,0.42,-0.04],[0.105,0.425,-0.1],[0.185,0.44,-0.22]])w.push([bx(1.8,0.03,0.068,0,y,z,a),WD]);
  for(const [z,y,a] of [[0.262,0.545,-1.22],[0.292,0.635,-1.25],[0.32,0.725,-1.28],[0.345,0.815,-1.31]])w.push([bx(1.8,0.03,0.07,0,y,z,a),WD]);
  for(const x of [-0.72,0.72]){m.push([tube([x,0,-0.2],[x,0.405,-0.2],0.024,8),AL],[tube([x,0.405,-0.2],[x,0.405,0.2],0.024,8),AL],[tube([x,0,0.3],[x,0.41,0.21],0.024,8),AL],[tube([x,0.41,0.21],[x,0.86,0.335],0.022,8),AL],
      [tube([x,0.2,-0.2],[x,0.2,0.255],0.016,6),AL],[cy(0.04,0.045,0.02,x,0.01,-0.2,10),AL],[cy(0.04,0.045,0.02,x,0.01,0.3,10),AL],[sp(0.026,x,0.86,0.335,8),AL]);}
  defInst('banc',mkG(m),metalMat,1,1,true);defInst('bancWood',mkG(w),woodPropMat,1,1,true);INST.banc.parts=['bancWood'];}
// pilona Barcelona (C-42P): fundición negra, cuello con anilla y cabeza redondeada
defInst('pilona',mkG([[lathe([[0.074,0],[0.07,0.03],[0.058,0.06],[0.054,0.8],[0.047,0.815],[0.047,0.835],[0.06,0.85],[0.062,0.9],[0.055,0.945],[0.035,0.972],[0.001,0.98]],14),0x1e2021]]),metalMat,1,1,true);
// alcorque Barcelona: marco cuadrado con reja circular de fundición (anillos y ranuras radiales)
const texGrate=cTex(256,256,(g,w,h)=>{g.fillStyle='#3a332b';g.fillRect(0,0,w,h);const c=w/2;g.fillStyle='#24211e';g.beginPath();g.arc(c,c,118,0,7);g.fill();
  g.fillStyle='#2b2d2c';g.fillRect(0,0,w,h);g.globalCompositeOperation='destination-out';g.globalCompositeOperation='source-over';
  // tierra del centro y ranuras
  g.fillStyle='#4a3c2c';g.beginPath();g.arc(c,c,40,0,7);g.fill();
  g.strokeStyle='#0c0c0b';g.lineCap='round';for(const [r0,r1,n,lw] of [[50,74,28,5],[82,106,40,5]])for(let i=0;i<n;i++){const a=i/n*6.283;g.lineWidth=lw;g.beginPath();g.moveTo(c+Math.cos(a)*r0,c+Math.sin(a)*r0);g.lineTo(c+Math.cos(a)*r1,c+Math.sin(a)*r1);g.stroke();}
  g.strokeStyle='#454746';g.lineWidth=3;for(const r of [44,78,110,120])  {g.beginPath();g.arc(c,c,r,0,7);g.stroke();}
  g.strokeStyle='#17181a';g.lineWidth=2;line(g,c,4,c,h-4);line(g,4,c,w-4,c);g.strokeStyle='#4a4c4b';g.lineWidth=6;g.strokeRect(3,3,w-6,h-6);
  const d=g.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const n=(Math.random()-0.5)*18;d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n;}g.putImageData(d,0,0);},{});
defInst('alcorque',(()=>{const g=new THREE.PlaneGeometry(1.25,1.25);g.rotateX(-Math.PI/2);g.translate(0,0.006,0);return g;})(),new THREE.MeshLambertMaterial({map:texGrate,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),1,1,true);
// contenedores de Barcelona (carga lateral): cuerpo gris troncocónico, tapa abombada y franja del color de la fracción
const CONT=[['resta',0x5d6164],['organica',0x7c4a22],['envasos',0xf0c000],['paper',0x1b63b5],['vidre',0x2c8a3a]];
{const BODY=0x9a9d9c,LID=0x7e8283,DK=0x1b1c1d;const dome=[];for(let k=0;k<=10;k++){const a=k/10*Math.PI;dome.push([Math.cos(a)*0.69,1.14+Math.pow(Math.sin(a),0.75)*0.4]);}dome.push([-0.69,1.08],[0.69,1.08]);
  for(const [k,col] of CONT){const p=[[prof([[-0.5,0.13],[0.5,0.13],[0.6,0.5],[0.66,1.1],[-0.66,1.1],[-0.6,0.5]],1.82),BODY],[prof(dome,1.9),LID],
      [bx(1.9,0.085,0.03,0,1.125,0.695),col],[bx(1.3,0.2,0.03,0,1.36,0.555,-0.95),col],[bx(1.1,0.11,0.02,0,1.36,0.575,-0.95),DK],
      [bx(0.56,0.34,0.012,0,0.78,0.632,-0.15),0xf1f1ec],[bx(0.5,0.1,0.014,0,0.86,0.624,-0.15),col],
      [tube([-0.78,0.1,0.64],[0.78,0.1,0.64],0.02,8),DK],[tube([-0.78,0.1,0.64],[-0.78,0.2,0.5],0.02,6),DK],[tube([0.78,0.1,0.64],[0.78,0.2,0.5],0.02,6),DK],
      [bx(1.7,0.13,0.9,0,0.065,0),DK]];
    for(const x of [-0.925,0.925])p.push([bx(0.03,0.42,0.5,x,0.82,0),0x6c7071],[cy(0.045,0.045,0.09,x*1.03,1.0,0,10,0,Math.PI/2),DK]);
    if(k==='vidre')p.push([cy(0.11,0.11,0.05,-0.45,1.4,0.5,12,0.62),DK],[cy(0.11,0.11,0.05,0.45,1.4,0.5,12,0.62),DK]);
    defInst('cont_'+k,mkG(p),plasticMat,1,1,true);}}
// Bicing: anclaje y bicicleta roja con guardabarros trasero blanco
defInst('bicingDock',mkG([[cy(0.065,0.075,0.74,0,0.37,0,14),0x73787c],[cy(0.08,0.08,0.13,0,0.8,0,14),0xd0202a],[sp(0.079,0,0.865,0,10),0xd0202a],[bx(0.05,0.1,0.1,0,0.72,0.07),0x1b1c1d],[bx(0.34,0.035,0.2,0,0.018,0),0x55595c]]),paintMat,1,1,true);
{const W=0xf3f3f1,RD=0xd0202a,BK=0x141414,AL=0xa9adb0;const p=[];
  for(const z of [-0.52,0.55]){p.push([tor(0.31,0.03,0,0.34,z,Math.PI/2,22),BK],[tor(0.276,0.011,0,0.34,z,Math.PI/2,22),AL],[cy(0.035,0.035,0.09,0,0.34,z,10,0,Math.PI/2),AL]);for(let k=0;k<6;k++)p.push([bx(0.005,0.54,0.008,0,0.34,z,k*Math.PI/6),AL]);}
  // cuadro de barra baja
  p.push([tube([0,0.6,0.43],[0,1.02,0.33],0.03,10),RD],[tube([0,0.92,0.36],[0,0.5,0.16],0.042,10),RD],[tube([0,0.5,0.16],[0,0.36,-0.12],0.042,10),RD],[sp(0.043,0,0.5,0.16,8),RD],[tube([0,0.36,-0.12],[0,0.92,-0.3],0.03,10),RD],
    [cy(0.05,0.05,0.12,0,0.36,-0.12,10,0,Math.PI/2),AL],[tube([0,0.36,-0.12],[0.16,0.24,-0.06],0.012,6),BK],[tube([0,0.36,-0.12],[-0.16,0.48,-0.18],0.012,6),BK],[bx(0.08,0.02,0.05,0.2,0.24,-0.06),BK],[bx(0.08,0.02,0.05,-0.2,0.48,-0.18),BK]);
  for(const x of [-0.055,0.055])p.push([tube([x,0.36,-0.12],[x,0.34,-0.52],0.016,6),RD],[tube([x,0.74,-0.25],[x,0.34,-0.52],0.014,6),RD],[tube([x,0.6,0.43],[x,0.34,0.55],0.017,6),BK],[bx(0.008,0.24,0.5,x*1.25,0.6,-0.52),W]);
  // guardabarros: trasero blanco y ancho, delantero rojo
  {const g=new THREE.TorusGeometry(0.352,0.022,5,14,Math.PI*0.95);g.rotateZ(0.1);g.rotateY(Math.PI/2);g.scale(3.2,1,1);g.translate(0,0.34,-0.52);p.push([g,W]);
   const g2=new THREE.TorusGeometry(0.35,0.02,5,10,Math.PI*0.6);g2.rotateZ(0.5);g2.rotateY(Math.PI/2);g2.scale(2.2,1,1);g2.translate(0,0.34,0.55);p.push([g2,RD]);}
  // sillín, tija, potencia, manillar con puños y cesta-anclaje delantero
  p.push([tube([0,0.92,-0.3],[0,1.02,-0.33],0.016,8),AL],[ell(0.085,0.03,0.14,0,1.045,-0.35,10),BK],[tube([0,1.02,0.33],[0,1.1,0.27],0.02,8),AL],[tube([-0.3,1.11,0.25],[0.3,1.11,0.25],0.013,8),BK],
    [tube([-0.31,1.11,0.25],[-0.2,1.11,0.25],0.02,8),BK],[tube([0.2,1.11,0.25],[0.31,1.11,0.25],0.02,8),BK],[tube([0,1.1,0.27],[0,1.11,0.25],0.02,6),AL],
    [bx(0.22,0.16,0.22,0,0.9,0.6),RD],[bx(0.24,0.02,0.3,0,0.99,0.62),BK],[bx(0.12,0.07,0.012,0,0.9,0.716),W],[tube([-0.13,0.99,0.48],[-0.13,1.08,0.48],0.008,5),BK],[tube([0.13,0.99,0.48],[0.13,1.08,0.48],0.008,5),BK],[tube([-0.13,1.08,0.48],[0.13,1.08,0.48],0.008,5),BK],
    [tube([-0.13,0.99,0.76],[-0.13,1.08,0.76],0.008,5),BK],[tube([0.13,0.99,0.76],[0.13,1.08,0.76],0.008,5),BK],[tube([-0.13,1.08,0.76],[0.13,1.08,0.76],0.008,5),BK],[tube([-0.13,1.08,0.48],[-0.13,1.08,0.76],0.008,5),BK],[tube([0.13,1.08,0.48],[0.13,1.08,0.76],0.008,5),BK]);
  defInst('bicingBike',mkG(p),paintMat,1,1,true);}
defInst('bicingTotem',mkG([[bx(0.5,2.1,0.2,0,1.05,0),0xd0202a],[bx(0.51,0.4,0.21,0,1.92,0),0xf3f3f1],[bx(0.36,0.3,0.015,0,1.35,0.105),0x101315],[bx(0.56,0.05,0.26,0,0.025,0),0x33373a]]),paintMat,1,1,true);
// marquesina TMB: cubierta con la cara inferior amarilla, fondo de vidrio, panel publicitario y banco
{const ST=0x62686c,YE=0xf2c400;const p=[[bx(4.5,0.07,1.75,0,2.52,0.05),0x4d5357],[bx(4.42,0.035,1.68,0,2.47,0.05),YE],[bx(4.5,0.1,0.05,0,2.5,0.92),ST],
    [bx(0.09,2.5,0.09,-2.1,1.25,-0.74),ST],[bx(0.09,2.5,0.09,0.75,1.25,-0.74),ST],[bx(0.09,2.5,0.09,2.1,1.25,-0.74),ST],[bx(4.3,0.06,0.06,0,0.32,-0.74),ST],[bx(4.3,0.06,0.06,0,2.2,-0.74),ST],
    [bx(1.32,1.95,0.16,1.42,1.28,-0.74),0x2c3033],[bx(1.32,0.08,0.2,1.42,2.3,-0.74),ST],
    [bx(2.3,0.035,0.34,-0.75,0.47,-0.45),0x8d9296],[tube([-1.75,0,-0.45],[-1.75,0.46,-0.45],0.028,8),ST],[tube([0.25,0,-0.45],[0.25,0.46,-0.45],0.028,8),ST],[bx(2.3,0.05,0.04,-0.75,0.44,-0.3),ST]];
  defInst('marquesina',mkG(p),paintMat,1,1,true);
  const gl=mkG([[bx(2.75,1.8,0.02,-0.68,1.27,-0.74),0xffffff]]);defInst('marquesinaGlass',gl,glassMat,1,1,true);
  defInst('mupi',mkG([[bx(1.12,1.75,0.02,0,0,0),0xffffff]]),new THREE.MeshLambertMaterial({map:null,color:0xffffff,emissive:0xffffff,emissiveIntensity:0.0}),1,1,true);}
// poste de parada TMB: cabecera roja y cuadrados de color con las líneas
const texBus=cTex(256,512,(g)=>{g.fillStyle='#f4f4f2';g.fillRect(0,0,256,512);g.fillStyle='#d8202a';g.fillRect(0,0,256,120);g.fillStyle='#fff';g.font='bold 70px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('Bus',128,64);
  const L=[['H10','#0d4f9e'],['V13','#5a9b2c'],['D40','#7a2b82'],['7','#d8202a'],['22','#d8202a'],['24','#d8202a']];L.forEach(([t,c],i)=>{const x=22+(i%2)*110,y=140+Math.floor(i/2)*118;g.fillStyle=c;g.beginPath();g.roundRect(x,y,100,100,14);g.fill();g.fillStyle='#fff';g.font='bold '+(t.length>2?42:54)+'px Arial';g.fillText(t,x+50,y+54);});},{});
defInst('busPole',mkG([[cy(0.045,0.05,2.95,0,1.47,0,12),0x62686c],[bx(0.46,0.9,0.04,0,2.45,0),0xd8202a]]),paintMat,1,1,true);
defInst('busPlate',(()=>{const a=new THREE.PlaneGeometry(0.42,0.84);a.translate(0,2.45,0.025);const b=new THREE.PlaneGeometry(0.42,0.84);b.rotateY(Math.PI);b.translate(0,2.45,-0.025);return mergeGeometries([a,b]);})(),new THREE.MeshLambertMaterial({map:texBus}),1,1,true);
// semáforo de Barcelona: báculo oscuro y cabezas amarillas con viseras; el de peatones, más bajo
{const YE=0xe6b000,PO=0x3b4144,BK=0x121314;const p=[[lathe([[0.1,0],[0.09,0.05],[0.07,0.12],[0.058,0.9],[0.052,3.5],[0.001,3.52]],14),PO]];
  const visor=(y,z,r)=>{const a=new THREE.CylinderGeometry(r,r,0.17,12,1,true,Math.PI/2+0.25,Math.PI-0.5);a.rotateX(Math.PI/2);a.translate(0,y,z+0.085);const b=a.clone();b.scale(-1,1,1);return[[a,YE],[b,BK]];};
  p.push([bx(0.1,0.06,0.2,0,3.3,0.1),PO],[bx(0.1,0.06,0.2,0,2.5,0.1),PO]);
  [[3.24,0x7a1410],[2.92,0x7a5a06],[2.6,0x0c5c2c]].forEach(([y,c])=>{p.push([bx(0.31,0.31,0.2,0,y,0.27),YE],[cy(0.105,0.105,0.03,0,y,0.375,18,Math.PI/2),c],[cy(0.118,0.118,0.012,0,y,0.37,18,Math.PI/2),BK],...visor(y,0.37,0.125));});
  // peatones (mira hacia el paso, de lado)
  [[2.12,0x6a1410],[1.84,0x0c5028]].forEach(([y,c])=>{p.push([bx(0.2,0.27,0.27,-0.16,y,0),YE],[bx(0.012,0.18,0.18,-0.262,y,0),c],[bx(0.02,0.215,0.215,-0.256,y,0),BK]);});p.push([bx(0.1,0.05,0.08,-0.06,1.98,0),PO]);
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
// fuente de Barcelona (fundición verde oscuro, torneada)
defInst('font',mkG([[lathe([[0.2,0],[0.2,0.06],[0.15,0.1],[0.13,0.16],[0.105,0.22],[0.095,0.9],[0.12,0.96],[0.125,1.02],[0.1,1.08],[0.11,1.14],[0.15,1.2],[0.15,1.26],[0.09,1.34],[0.05,1.4],[0.06,1.46],[0.03,1.52],[0.001,1.54]],16),0x24352b],
  [tube([0,1.0,0.1],[0,1.0,0.24],0.016,8),0xb09a4a],[tube([0,1.0,0.24],[0,0.94,0.26],0.016,8),0xb09a4a],[sp(0.028,0,1.06,0.1,8),0xb09a4a],
  [lathe([[0.001,0.02],[0.24,0.02],[0.3,0.1],[0.32,0.2],[0.3,0.21],[0.26,0.12],[0.001,0.1]],16,0,0,0.3),0x24352b]]),paintMat,1,1,true);
// jardinera Barcelona: cuenco negro de fundición sobre tres pies, con tierra y arbusto
defInst('jardinera',mkG([[lathe([[0.001,0.16],[0.3,0.17],[0.52,0.3],[0.66,0.5],[0.72,0.62],[0.8,0.63],[0.8,0.67],[0.68,0.67],[0.6,0.52],[0.001,0.5]],22),0x1c1d1e],[cy(0.62,0.62,0.02,0,0.6,0,18),0x3a2e22],
  ...[0,1,2].map(k=>[bx(0.14,0.2,0.2,Math.cos(k*2.094)*0.3,0.1,Math.sin(k*2.094)*0.3,0,-k*2.094),0x1c1d1e]),
  [ell(0.42,0.3,0.4,-0.1,0.85,0.05,9),0x3f5a2c],[ell(0.3,0.26,0.32,0.26,0.82,-0.12,8),0x4b6a31],[ell(0.24,0.2,0.26,0.02,1.02,0.16,8),0x36502a]]),plasticMat,1,1,true);
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
