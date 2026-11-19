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
defInst('signBackS',(()=>{const g=new THREE.BoxGeometry(0.6,0.6,0.012);g.translate(0,0,-0.008);return g;})(),SIGNBACK,1,1,false);
defInst('signBackC',(()=>{const g=new THREE.CylinderGeometry(0.3,0.3,0.012,24);g.rotateX(Math.PI/2);g.translate(0,0,-0.008);return g;})(),SIGNBACK,1,1,false);
defInst('signPole',mkG([[cy(0.03,0.03,3.1,0,1.55,0,6),0x8d9194]]),metalMat,1,1,false);

// ---------- farola del Eixample (fanal alto con brazo) ----------
{const p=[[cy(0.16,0.2,0.6,0,0.3,0,10),LAMPG],[cy(0.09,0.13,8.2,0,4.4,0,10),LAMPG],[cy(0.11,0.11,0.12,0,1.2,0,10),LAMPG]];
  const arc=[];for(let i=0;i<6;i++){const a0=i/6*Math.PI/2,a1=(i+1)/6*Math.PI/2;arc.push([tube([0,8.4+Math.sin(a0)*0.6,(1-Math.cos(a0))*0.9],[0,8.4+Math.sin(a1)*0.6,(1-Math.cos(a1))*0.9],0.05),LAMPG]);}
  p.push(...arc,[tube([0,9.0,0.9],[0,9.0,1.6],0.045),LAMPG],[bx(0.42,0.16,0.75,0,8.92,1.75),LAMPG],[bx(0.36,0.03,0.66,0,8.83,1.75),0xe8e2cc]);
  defInst('fanal',mkG(p),paintMat,1,1,false);}
// farola peatonal de rambla (fanal de 5 brazos simplificado)
defInst('fanalR',mkG([[cy(0.12,0.16,4.2,0,2.1,0,10),LAMPG],[sp(0.22,0,4.5,0,10),0xf0ead8],[cy(0.05,0.05,0.3,0,4.2,0),LAMPG],[sp(0.16,0.55,4.1,0,8),0xf0ead8],[sp(0.16,-0.55,4.1,0,8),0xf0ead8],[tube([0,3.9,0],[0.55,3.95,0],0.03),LAMPG],[tube([0,3.9,0],[-0.55,3.95,0],0.03),LAMPG]]),paintMat,1,1,false);
// papelera de Barcelona: cubo gris abatible colgado de un poste con aro
defInst('papelera',mkG([[cy(0.04,0.04,1.02,0,0.51,-0.02,10),0x6d7276],[sp(0.042,0,1.02,-0.02,8),0x6d7276],[tube([0,0.92,-0.02],[0,0.92,0.12],0.018),0x6d7276],
  [lathe([[0.001,0.34],[0.15,0.35],[0.185,0.42],[0.215,0.96],[0.228,0.965],[0.228,0.99],[0.2,0.99],[0.195,0.5],[0.001,0.46]],12,0,0,0.33),0x868b8f],[tor(0.222,0.013,0,0.99,0.33,0,18).rotateX(0),0x55595c],
  [bx(0.2,0.13,0.012,0,0.72,0.545),0xe8e8e2]]),metalMat,1,1,false);
// banco Barcelona: listones de madera sobre dos patas de fundición de aluminio
{const WD=0xb07a48,AL=0x9da2a6;const w=[],m=[];
  // listones siguiendo la curva del asiento y del respaldo
  for(const [z,y,a] of [[-0.215,0.43,0.1],[-0.135,0.425,0.04],[-0.055,0.42,0],[0.025,0.42,-0.04],[0.105,0.425,-0.1],[0.185,0.44,-0.22]])w.push([bx(1.8,0.03,0.068,0,y,z,a),WD]);
  for(const [z,y,a] of [[0.262,0.545,-1.22],[0.292,0.635,-1.25],[0.32,0.725,-1.28],[0.345,0.815,-1.31]])w.push([bx(1.8,0.03,0.07,0,y,z,a),WD]);
  for(const x of [-0.72,0.72]){m.push([tube([x,0,-0.2],[x,0.405,-0.2],0.024,8),AL],[tube([x,0.405,-0.2],[x,0.405,0.2],0.024,8),AL],[tube([x,0,0.3],[x,0.41,0.21],0.024,8),AL],[tube([x,0.41,0.21],[x,0.86,0.335],0.022,8),AL],
      [tube([x,0.2,-0.2],[x,0.2,0.255],0.016,6),AL],[cy(0.04,0.045,0.02,x,0.01,-0.2,10),AL],[cy(0.04,0.045,0.02,x,0.01,0.3,10),AL],[sp(0.026,x,0.86,0.335,8),AL]);}
  defInst('banc',mkG(m),metalMat,1,1,false);defInst('bancWood',mkG(w),woodPropMat,1,1,false);INST.banc.parts=['bancWood'];}
// pilona Barcelona (C-42P): fundición negra, cuello con anilla y cabeza redondeada
defInst('pilona',mkG([[lathe([[0.074,0],[0.07,0.03],[0.058,0.06],[0.054,0.8],[0.047,0.815],[0.047,0.835],[0.06,0.85],[0.062,0.9],[0.055,0.945],[0.035,0.972],[0.001,0.98]],7),0x1e2021]]),metalMat,1,1,false);
// alcorque Barcelona: marco cuadrado con reja circular de fundición (anillos y ranuras radiales)
const texGrate=cTex(256,256,(g,w,h)=>{g.fillStyle='#3a332b';g.fillRect(0,0,w,h);const c=w/2;g.fillStyle='#24211e';g.beginPath();g.arc(c,c,118,0,7);g.fill();
  g.fillStyle='#2b2d2c';g.fillRect(0,0,w,h);g.globalCompositeOperation='destination-out';g.globalCompositeOperation='source-over';
  // tierra del centro y ranuras
  g.fillStyle='#4a3c2c';g.beginPath();g.arc(c,c,40,0,7);g.fill();
  g.strokeStyle='#0c0c0b';g.lineCap='round';for(const [r0,r1,n,lw] of [[50,74,28,5],[82,106,40,5]])for(let i=0;i<n;i++){const a=i/n*6.283;g.lineWidth=lw;g.beginPath();g.moveTo(c+Math.cos(a)*r0,c+Math.sin(a)*r0);g.lineTo(c+Math.cos(a)*r1,c+Math.sin(a)*r1);g.stroke();}
  g.strokeStyle='#454746';g.lineWidth=3;for(const r of [44,78,110,120])  {g.beginPath();g.arc(c,c,r,0,7);g.stroke();}
  g.strokeStyle='#17181a';g.lineWidth=2;line(g,c,4,c,h-4);line(g,4,c,w-4,c);g.strokeStyle='#4a4c4b';g.lineWidth=6;g.strokeRect(3,3,w-6,h-6);
  const d=g.getImageData(0,0,w,h);for(let i=0;i<d.data.length;i+=4){const n=(Math.random()-0.5)*18;d.data[i]+=n;d.data[i+1]+=n;d.data[i+2]+=n;}g.putImageData(d,0,0);},{});
defInst('alcorque',(()=>{const g=new THREE.PlaneGeometry(1.25,1.25);g.rotateX(-Math.PI/2);g.translate(0,0.006,0);return g;})(),new THREE.MeshLambertMaterial({map:texGrate,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),1,1,false);
// contenedores de Barcelona (carga lateral): cuerpo gris troncocónico, tapa abombada y franja del color de la fracción
const CONT=[['resta',0x5d6164],['organica',0x7c4a22],['envasos',0xf0c000],['paper',0x1b63b5],['vidre',0x2c8a3a]];
// modelo nuevo (2023-): cuerpo gris casi recto con cantos redondeados, tapa plana gris oscuro con canto y franja del color de la fracción,
// panel de pegatinas, pedal y base negra; el de vidrio con las dos bocas redondas
{const BODY=0x9c9fa0,LID=0x6f7375,DK=0x1b1c1d;const rr=(w,h,y0,r,n=3)=>{const P=[];const c=[[w/2-r,y0+h-r,0],[-w/2+r,y0+h-r,Math.PI/2]];
    for(const [cx,cy,a0] of c)for(let k=0;k<=n;k++){const a=a0+k/n*Math.PI/2;P.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}P.push([-w/2+0.04,y0],[w/2-0.04,y0]);return P.map(q=>q).reverse();};
  for(const [k,col] of CONT){const p=[[prof([[-0.56,0.12],[0.56,0.12],[0.63,0.32],[0.65,1.24],[0.6,1.3],[-0.6,1.3],[-0.65,1.24],[-0.63,0.32]],1.86),BODY],
      [prof([[-0.68,1.29],[0.68,1.29],[0.68,1.35],[0.63,1.42],[-0.63,1.42],[-0.68,1.35]],1.96),LID],
      [bx(1.97,0.07,0.025,0,1.325,0.685),col],[bx(1.86,0.012,0.22,0,1.425,0.42),col],
      [bx(0.62,0.4,0.012,0,0.86,0.648,-0.03),0xf1f1ec],[bx(0.56,0.11,0.014,0,0.99,0.646,-0.03),col],[bx(0.3,0.16,0.014,-0.12,0.78,0.646,-0.03),0x9aa0a4],
      [bx(0.5,0.05,0.16,0,0.16,0.7),DK],[bx(0.06,0.18,0.06,-0.2,0.13,0.64),DK],[bx(0.06,0.18,0.06,0.2,0.13,0.64),DK],
      [bx(1.76,0.12,1.0,0,0.06,0),DK]];
    for(const x of [-0.94,0.94])p.push([bx(0.03,0.5,0.6,x,0.85,0),0x7c8081],[cy(0.05,0.05,0.09,x*1.03,1.05,0,10,0,Math.PI/2),DK]);
    if(k==='vidre')p.push([cy(0.12,0.12,0.03,-0.45,1.43,0.25,14),DK],[cy(0.12,0.12,0.03,0.45,1.43,0.25,14),DK]);
    if(k==='paper')p.push([bx(0.9,0.02,0.08,0,1.43,0.3),DK]);
    defInst('cont_'+k,mkG(p),plasticMat,1,1,false);}}
// Bicing: anclaje y bicicleta roja con guardabarros trasero blanco
defInst('bicingDock',mkG([[cy(0.065,0.075,0.74,0,0.37,0,14),0x73787c],[cy(0.08,0.08,0.13,0,0.8,0,14),0xd0202a],[sp(0.079,0,0.865,0,10),0xd0202a],[bx(0.05,0.1,0.1,0,0.72,0.07),0x1b1c1d],[bx(0.34,0.035,0.2,0,0.018,0),0x55595c]]),paintMat,1,1,false);
{const W=0xf3f3f1,RD=0xd0202a,BK=0x141414,AL=0xa9adb0;const p=[];
  for(const z of [-0.52,0.55]){p.push([tor(0.31,0.03,0,0.34,z,Math.PI/2,14),BK],[tor(0.276,0.011,0,0.34,z,Math.PI/2,14),AL],[cy(0.035,0.035,0.09,0,0.34,z,10,0,Math.PI/2),AL]);for(let k=0;k<4;k++)p.push([bx(0.005,0.54,0.008,0,0.34,z,k*Math.PI/4),AL]);}
  // cuadro de barra baja
  p.push([tube([0,0.6,0.43],[0,1.02,0.33],0.03,6),RD],[tube([0,0.92,0.36],[0,0.5,0.16],0.042,6),RD],[tube([0,0.5,0.16],[0,0.36,-0.12],0.042,6),RD],[sp(0.043,0,0.5,0.16,6),RD],[tube([0,0.36,-0.12],[0,0.92,-0.3],0.03,6),RD],
    [cy(0.05,0.05,0.12,0,0.36,-0.12,10,0,Math.PI/2),AL],[tube([0,0.36,-0.12],[0.16,0.24,-0.06],0.012,6),BK],[tube([0,0.36,-0.12],[-0.16,0.48,-0.18],0.012,6),BK],[bx(0.08,0.02,0.05,0.2,0.24,-0.06),BK],[bx(0.08,0.02,0.05,-0.2,0.48,-0.18),BK]);
  for(const x of [-0.055,0.055])p.push([tube([x,0.36,-0.12],[x,0.34,-0.52],0.016,6),RD],[tube([x,0.74,-0.25],[x,0.34,-0.52],0.014,6),RD],[tube([x,0.6,0.43],[x,0.34,0.55],0.017,6),BK],[bx(0.008,0.24,0.5,x*1.25,0.6,-0.52),W]);
  // guardabarros: trasero blanco y ancho, delantero rojo
  {const g=new THREE.TorusGeometry(0.352,0.022,5,14,Math.PI*0.95);g.rotateZ(0.1);g.rotateY(Math.PI/2);g.scale(3.2,1,1);g.translate(0,0.34,-0.52);p.push([g,W]);
   const g2=new THREE.TorusGeometry(0.35,0.02,5,10,Math.PI*0.6);g2.rotateZ(0.5);g2.rotateY(Math.PI/2);g2.scale(2.2,1,1);g2.translate(0,0.34,0.55);p.push([g2,RD]);}
  // sillín, tija, potencia, manillar con puños y cesta-anclaje delantero
  p.push([tube([0,0.92,-0.3],[0,1.02,-0.33],0.016,6),AL],[ell(0.085,0.03,0.14,0,1.045,-0.35,6),BK],[tube([0,1.02,0.33],[0,1.1,0.27],0.02,6),AL],[tube([-0.3,1.11,0.25],[0.3,1.11,0.25],0.013,6),BK],
    [tube([-0.31,1.11,0.25],[-0.2,1.11,0.25],0.02,6),BK],[tube([0.2,1.11,0.25],[0.31,1.11,0.25],0.02,6),BK],[tube([0,1.1,0.27],[0,1.11,0.25],0.02,6),AL],
    [bx(0.22,0.16,0.22,0,0.9,0.6),RD],[bx(0.24,0.02,0.3,0,0.99,0.62),BK],[bx(0.12,0.07,0.012,0,0.9,0.716),W],[tube([-0.13,0.99,0.48],[-0.13,1.08,0.48],0.008,5),BK],[tube([0.13,0.99,0.48],[0.13,1.08,0.48],0.008,5),BK],[tube([-0.13,1.08,0.48],[0.13,1.08,0.48],0.008,5),BK],
    [tube([-0.13,0.99,0.76],[-0.13,1.08,0.76],0.008,5),BK],[tube([0.13,0.99,0.76],[0.13,1.08,0.76],0.008,5),BK],[tube([-0.13,1.08,0.76],[0.13,1.08,0.76],0.008,5),BK],[tube([-0.13,1.08,0.48],[-0.13,1.08,0.76],0.008,5),BK],[tube([0.13,1.08,0.48],[0.13,1.08,0.76],0.008,5),BK]);
  defInst('bicingBike',mkG(p),paintMat,1,1,false);}
defInst('bicingTotem',mkG([[bx(0.5,2.1,0.2,0,1.05,0),0xd0202a],[bx(0.51,0.4,0.21,0,1.92,0),0xf3f3f1],[bx(0.36,0.3,0.015,0,1.35,0.105),0x101315],[bx(0.56,0.05,0.26,0,0.025,0),0x33373a]]),paintMat,1,1,false);
// marquesina TMB: cubierta con la cara inferior amarilla, fondo de vidrio, panel publicitario y banco
{const ST=0x62686c,YE=0xf2c400;const p=[[bx(4.5,0.07,1.75,0,2.52,0.05),0x4d5357],[bx(4.42,0.035,1.68,0,2.47,0.05),YE],[bx(4.5,0.1,0.05,0,2.5,0.92),ST],
    [bx(0.09,2.5,0.09,-2.1,1.25,-0.74),ST],[bx(0.09,2.5,0.09,0.75,1.25,-0.74),ST],[bx(0.09,2.5,0.09,2.1,1.25,-0.74),ST],[bx(4.3,0.06,0.06,0,0.32,-0.74),ST],[bx(4.3,0.06,0.06,0,2.2,-0.74),ST],
    [bx(1.32,1.95,0.16,1.42,1.28,-0.74),0x2c3033],[bx(1.32,0.08,0.2,1.42,2.3,-0.74),ST],
    [bx(2.3,0.035,0.34,-0.75,0.47,-0.45),0x8d9296],[tube([-1.75,0,-0.45],[-1.75,0.46,-0.45],0.028,8),ST],[tube([0.25,0,-0.45],[0.25,0.46,-0.45],0.028,8),ST],[bx(2.3,0.05,0.04,-0.75,0.44,-0.3),ST]];
  defInst('marquesina',mkG(p),paintMat,1,1,false);
  const gl=mkG([[bx(2.75,1.8,0.02,-0.68,1.27,-0.74),0xffffff]]);defInst('marquesinaGlass',gl,glassMat,1,1,false);
  // cartel del mupi: campañas actuales (inventadas, sin marcas reales), impresas y retroiluminadas
  const texMupi=cTex(2048,2048,(g)=>{const W=512,Hh=1024;
    const grad=(x,y,c0,c1,c2)=>{const q=g.createLinearGradient(x,y,x,y+Hh);q.addColorStop(0,c0);q.addColorStop(0.55,c1);q.addColorStop(1,c2||c1);g.fillStyle=q;g.fillRect(x,y,W,Hh);};
    const txt=(t,x,y,sz,c,w='bold',al='center',f='Helvetica,Arial,sans-serif')=>{g.fillStyle=c;g.textAlign=al;g.textBaseline='alphabetic';g.font=`${w} ${sz}px ${f}`;t.split('\n').forEach((l,i)=>g.fillText(l,x,y+i*sz*1.12));};
    const circ=(x,y,r,c)=>{g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();};
    const rr=(x,y,w,h,r,c)=>{g.fillStyle=c;g.beginPath();g.roundRect(x,y,w,h,r);g.fill();};
    const cells=[
      // 0 festa major: cartel ilustrado con formas geométricas
      (x,y)=>{grad(x,y,'#ffcf3f','#ff7a3d','#e8384f');for(let k=0;k<26;k++){circ(x+R(0,W),y+R(80,700),R(10,70),['#1d3557','#ffffff','#2a9d8f','#e8384f'][k%4]);}
        g.save();g.globalAlpha=0.9;rr(x+30,y+700,W-60,260,18,'#1d3557');g.restore();txt('LA MERCÈ',x+W/2,y+790,78,'#ffffff');txt('Festes de Barcelona',x+W/2,y+850,34,'#ffcf3f','normal');txt('20 — 24 setembre',x+W/2,y+910,38,'#ffffff');},
      // 1 concierto
      (x,y)=>{grad(x,y,'#0b0f2a','#3a0ca3','#7209b7');for(let k=0;k<9;k++){g.strokeStyle=`rgba(255,${120+k*15},220,${0.25+k*0.05})`;g.lineWidth=6;g.beginPath();g.arc(x+W/2,y+380,60+k*26,0,Math.PI*2);g.stroke();}
        circ(x+W/2,y+380,52,'#f72585');txt('NOVA GIRA',x+W/2,y+700,40,'#f8f8ff','normal');txt('LUNA ROJA',x+W/2,y+790,86,'#ffffff');txt('Palau Sant Jordi · 13 desembre',x+W/2,y+860,30,'#f72585');txt('Entrades a la venda',x+W/2,y+930,28,'#d0d0ff','normal');},
      // 2 campaña de residuos: los cinco colores de los contenedores de BCN
      (x,y)=>{grad(x,y,'#f4f6f3','#e7ece6');txt('Cada residu',x+W/2,y+150,62,'#1b1b1b');txt('al seu lloc',x+W/2,y+225,62,'#1b1b1b');
        const C=[['#6f6f6f','Rebuig'],['#f2c500','Envasos'],['#1f5fae','Paper'],['#2f8f3a','Vidre'],['#8a5a2b','Orgànica']];C.forEach(([c,n],k)=>{const bx0=x+38+k*90;rr(bx0,y+380,72,190,10,c);rr(bx0-4,y+366,80,22,6,c);txt(n,bx0+36,y+610,19,'#222','bold');});
        txt('Separa bé.',x+W/2,y+760,46,'#2f8f3a');txt('Barcelona recicla',x+W/2,y+820,32,'#444','normal');g.fillStyle='#d6001c';g.fillRect(x+W/2-90,y+880,180,8);},
      // 3 moda
      (x,y)=>{grad(x,y,'#e9e2d8','#d8cbb8','#b9a88f');g.fillStyle='#2b2622';g.beginPath();g.ellipse(x+W/2,y+230,62,78,0,0,Math.PI*2);g.fill();
        g.beginPath();g.moveTo(x+W/2-70,y+320);g.quadraticCurveTo(x+W/2-150,y+600,x+W/2-120,y+780);g.lineTo(x+W/2+120,y+780);g.quadraticCurveTo(x+W/2+150,y+600,x+W/2+70,y+320);g.fill();
        g.fillStyle='#a33b2a';g.fillRect(x+W/2-120,y+520,240,40);txt('ATELIER NORD',x+W/2,y+880,54,'#2b2622','300');txt('Col·lecció tardor-hivern',x+W/2,y+935,28,'#4b4038','normal');},
      // 4 estreno de cine
      (x,y)=>{grad(x,y,'#0d1b2a','#1b263b','#415a77');for(let k=0;k<60;k++)circ(x+R(0,W),y+R(0,420),R(1,3),'rgba(255,255,255,.8)');
        g.fillStyle='#0a1118';g.beginPath();g.moveTo(x,y+640);for(let k=0;k<=10;k++)g.lineTo(x+k*W/10,y+R(470,600));g.lineTo(x+W,y+640);g.lineTo(x+W,y+Hh);g.lineTo(x,y+Hh);g.fill();
        txt("L'ÚLTIM",x+W/2,y+720,70,'#e0e1dd');txt('HIVERN',x+W/2,y+800,96,'#ffffff');txt('Només als cinemes · 27 novembre',x+W/2,y+875,27,'#c9d6df','normal');g.fillStyle='rgba(255,255,255,.5)';g.fillRect(x+60,y+930,W-120,2);},
      // 5 mercado municipal
      (x,y)=>{grad(x,y,'#fff7e6','#ffe8c2');const F=['#e63946','#f4a261','#2a9d8f','#e9c46a','#8ab17d','#d62828'];for(let k=0;k<14;k++)circ(x+70+(k%4)*125+R(-20,20),y+220+Math.floor(k/4)*110+R(-15,15),R(40,58),F[k%6]);
        rr(x+30,y+690,W-60,240,20,'#2a9d8f');txt('Compra de temporada',x+W/2,y+770,40,'#ffffff');txt('al mercat del barri',x+W/2,y+825,36,'#fff7e6','normal');txt('Mercats de Barcelona',x+W/2,y+895,28,'#ffe8c2','bold');},
      // 6 teléfono
      (x,y)=>{grad(x,y,'#e8eef5','#c9d6e8','#9fb3cf');rr(x+W/2-120,y+150,240,480,36,'#16181d');rr(x+W/2-108,y+166,216,448,28,'#3b82f6');
        const q=g.createLinearGradient(x,y+166,x+W,y+614);q.addColorStop(0,'#60a5fa');q.addColorStop(1,'#a855f7');g.fillStyle=q;g.beginPath();g.roundRect(x+W/2-108,y+166,216,448,28);g.fill();
        txt('Nou. Més prim.',x+W/2,y+760,52,'#16181d');txt('Més llum.',x+W/2,y+820,52,'#16181d');txt('Disponible a botigues',x+W/2,y+890,28,'#33415c','normal');},
      // 7 movilidad en bici
      (x,y)=>{grad(x,y,'#d7263d','#c81d34');const bk=(cx,cy)=>{g.strokeStyle='#ffffff';g.lineWidth=12;g.beginPath();g.arc(cx-95,cy,70,0,Math.PI*2);g.stroke();g.beginPath();g.arc(cx+95,cy,70,0,Math.PI*2);g.stroke();
          g.beginPath();g.moveTo(cx-95,cy);g.lineTo(cx-20,cy-110);g.lineTo(cx+70,cy-110);g.lineTo(cx+95,cy);g.moveTo(cx-20,cy-110);g.lineTo(cx,cy);g.lineTo(cx+70,cy-110);g.moveTo(cx-35,cy-140);g.lineTo(cx,cy-140);g.moveTo(cx+70,cy-110);g.lineTo(cx+60,cy-150);g.lineTo(cx+95,cy-160);g.stroke();};bk(x+W/2,y+470);
        txt('Mou-te',x+W/2,y+700,84,'#ffffff');txt('en bici',x+W/2,y+785,84,'#ffffff');txt('+ de 200 km de carril bici',x+W/2,y+860,30,'#ffe5e8','normal');}];
    cells.forEach((f,k)=>{const x=(k%4)*W,y=Math.floor(k/4)*Hh;g.save();g.beginPath();g.rect(x,y,W,Hh);g.clip();f(x,y);
      const sh=g.createLinearGradient(x,y,x+W,y+Hh);sh.addColorStop(0,'rgba(255,255,255,.06)');sh.addColorStop(0.5,'rgba(255,255,255,0)');sh.addColorStop(1,'rgba(0,0,0,.06)');g.fillStyle=sh;g.fillRect(x,y,W,Hh);g.restore();});},{});
  const mupiMat=atlasMat(texMupi,texMupi,4,2,{});mupiMat.emissiveIntensity=0.3;
  defInst('mupi',PLANE.clone().scale(1.12,1.62,1),mupiMat,4,2,false);}
// poste de parada TMB: cabecera roja y cuadrados de color con las líneas
const texBus=cTex(256,512,(g)=>{g.fillStyle='#f4f4f2';g.fillRect(0,0,256,512);g.fillStyle='#d8202a';g.fillRect(0,0,256,120);g.fillStyle='#fff';g.font='bold 70px Arial';g.textAlign='center';g.textBaseline='middle';g.fillText('Bus',128,64);
  const L=[['H10','#0d4f9e'],['V13','#5a9b2c'],['D40','#7a2b82'],['7','#d8202a'],['22','#d8202a'],['24','#d8202a']];L.forEach(([t,c],i)=>{const x=22+(i%2)*110,y=140+Math.floor(i/2)*118;g.fillStyle=c;g.beginPath();g.roundRect(x,y,100,100,14);g.fill();g.fillStyle='#fff';g.font='bold '+(t.length>2?42:54)+'px Arial';g.fillText(t,x+50,y+54);});},{});
defInst('busPole',mkG([[cy(0.045,0.05,2.95,0,1.47,0,12),0x62686c],[bx(0.46,0.9,0.04,0,2.45,0),0xd8202a]]),paintMat,1,1,false);
defInst('busPlate',(()=>{const a=new THREE.PlaneGeometry(0.42,0.84);a.translate(0,2.45,0.025);const b=new THREE.PlaneGeometry(0.42,0.84);b.rotateY(Math.PI);b.translate(0,2.45,-0.025);return mergeGeometries([a,b]);})(),new THREE.MeshLambertMaterial({map:texBus}),1,1,false);
// semáforos de Barcelona: cabezas con carcasa amarilla y frontal negro, montadas a un lado del poste con abrazaderas;
// en los cruces, báculo curvo que vuela sobre la calzada con otra cabeza colgada. Peatonal más bajo, de lado.
{const YE=0xd9a400,PO=0x7f8488,BK=0x101112;
  const head=(x,y,z)=>{const p=[[bx(0.3,0.86,0.2,x,y,z),YE],[bx(0.32,0.88,0.015,x,y,z+0.105),BK]];
    [[0.28,0x6a1410],[0,0x6a5208],[-0.28,0x0b4f26]].forEach(([dy,c])=>{p.push([cy(0.1,0.1,0.02,x,y+dy,z+0.118,16,Math.PI/2),c]);
      const v=new THREE.CylinderGeometry(0.125,0.125,0.16,12,1,true,Math.PI/2+0.3,Math.PI-0.6);v.rotateX(Math.PI/2);v.translate(x,y+dy,z+0.19);p.push([v,BK]);});return p;};
  const ped=(x,y,z,ry)=>{const p=[[bx(0.24,0.5,0.18,0,0,0),YE],[bx(0.26,0.52,0.012,0,0,0.095),BK],[bx(0.15,0.15,0.01,0,0.12,0.103),0x5a1010],[bx(0.15,0.15,0.01,0,-0.12,0.103),0x0b4a24]];
    return p.map(([g,c])=>{g.rotateY(ry);g.translate(x,y,z);return[g,c];});};
  const pole=h=>[[lathe([[0.1,0],[0.09,0.05],[0.072,0.12],[0.06,0.9],[0.054,h],[0.001,h+0.02]],14),PO]];
  // simple (calles de un carril o salida): cabeza al lado del poste y peatonal de lado
  {const p=pole(3.3);p.push(...head(0.24,2.75,0.02),[bx(0.2,0.05,0.06,0.12,3.05,0),PO],[bx(0.2,0.05,0.06,0.12,2.45,0),PO],...ped(-0.17,2.0,0,-Math.PI/2),[bx(0.1,0.05,0.06,-0.06,2.0,0),PO]);defInst('semafor',mkG(p),paintMat,1,1,false);}
  // báculo: brazo curvo de 3,6 m sobre la calzada (dos versiones, hacia la izquierda o la derecha del poste)
  for(const sg of [1,-1]){const p=pole(5.0);const pts=[];for(let k=0;k<=8;k++){const a=k/8*Math.PI/2;pts.push([sg*(1-Math.cos(a))*0.9,4.6+Math.sin(a)*0.55]);}
    for(let k=0;k<8;k++)p.push([tube([pts[k][0],pts[k][1],0],[pts[k+1][0],pts[k+1][1],0],0.05,8),PO]);p.push([tube([sg*0.9,5.15,0],[sg*4.6,5.55,0],0.042,8),PO],[cy(0.06,0.06,0.12,sg*2.4,5.31,0,8,0,Math.PI/2-0.1*sg),0x2a2c2e]);
    p.push([tube([sg*4.5,5.54,0],[sg*4.5,5.4,0],0.02,6),PO],...head(sg*4.5,4.95,0.0));
    p.push(...head(sg*0.24,2.75,0.02),[bx(0.2,0.05,0.06,sg*0.12,3.05,0),PO],[bx(0.2,0.05,0.06,sg*0.12,2.45,0),PO],...ped(-sg*0.17,2.0,0,-sg*Math.PI/2),[bx(0.1,0.05,0.06,-sg*0.06,2.0,0),PO]);
    defInst(sg>0?'semaforBR':'semaforBL',mkG(p),paintMat,1,1,false);}}
// placa de dirección de calle (en el poste del semáforo): banda azul con el nombre y flecha con la numeración
const VSTR_N=['C. Villarroel','C. Casanova','C. Muntaner','C. Aribau','C. Enric Granados','C. Balmes','Rbla. Catalunya'],HSTR_N=['C. Provença','C. Mallorca','C. València','C. Aragó','C. Consell de Cent'];
const texStPlate=cTex(1024,512,(g)=>{const W=256,Hh=64;let k=0;for(const s of [...VSTR_N,...HSTR_N])for(const dir of [1,-1]){const x=(k%4)*W,y=Math.floor(k/4)*Hh;k++;
  g.fillStyle='#f4f4f2';g.fillRect(x+2,y+2,W-4,Hh-4);g.fillStyle='#1b3d7a';g.fillRect(x+2,y+2,W-4,Hh*0.5);g.fillStyle='#fff';g.textAlign='center';g.textBaseline='middle';
  let fs=22;g.font=`bold ${fs}px Arial,sans-serif`;while(g.measureText(s).width>W-20&&fs>11){fs--;g.font=`bold ${fs}px Arial,sans-serif`;}g.fillText(s,x+W/2,y+Hh*0.27);
  g.fillStyle='#1b1b1b';g.font='bold 15px Arial,sans-serif';const n=10+(k*37)%180;g.fillText(`${n}/${n+6}`,x+W*0.42,y+Hh*0.76);
  g.beginPath();const ax=x+W*0.72,ay=y+Hh*0.76;g.moveTo(ax-24*dir,ay-3);g.lineTo(ax+8*dir,ay-3);g.lineTo(ax+8*dir,ay-9);g.lineTo(ax+22*dir,ay);g.lineTo(ax+8*dir,ay+9);g.lineTo(ax+8*dir,ay+3);g.lineTo(ax-24*dir,ay+3);g.closePath();g.fill();}},{});
texStPlate.wrapS=texStPlate.wrapT=THREE.ClampToEdgeWrapping;
defInst('stPlate',(()=>{const a=new THREE.PlaneGeometry(0.62,0.155);a.translate(0,0,0.075);const b=new THREE.BoxGeometry(0.64,0.17,0.02);b.translate(0,0,0.062);b.deleteAttribute('uv');b.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(b.attributes.position.count*2).fill(0.999),2));
  return mergeGeometries([a,b.toNonIndexed().index?b:b.toNonIndexed()].map(g=>g.index?g.toNonIndexed():g));})(),atlasMat(texStPlate,null,4,8),4,8,false);
// moto aparcada: scooter tipo «SH» (lo que más hay en Barcelona); las piezas blancas toman el color de cada moto
const MOTOCOL=[0xf2f2f0,0xf2f2f0,0x1a1a1c,0x1a1a1c,0x8e9296,0xb01818,0x22325a,0x6a6e72];
// perfiles laterales extruidos con bisel (z hacia delante, y arriba): carrocería redondeada de verdad, no cajas
function xS(pts,w,bev,x=0){const g=new THREE.ExtrudeGeometry(shapeFrom(pts),{depth:Math.max(0.002,w-2*bev),bevelEnabled:bev>0,bevelThickness:bev,bevelSize:bev,bevelSegments:1,curveSegments:3});g.rotateY(-Math.PI/2);g.translate((w-2*bev)/2+x,0,0);return g;}// ligero: en la calle hay cientos
function wheelParts(p,z,r,tw,BK,RIM,disc){p.push([tor(r,tw,0,r+tw,z,Math.PI/2,12),BK],[cy(r-0.02,r-0.02,0.07,0,r+tw,z,10,0,Math.PI/2),RIM],[cy(0.05,0.05,0.16,0,r+tw,z,6,0,Math.PI/2),0x8a8e92]);
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2;p.push([bx(0.035,r*0.9,0.075,0,r+tw+Math.cos(a)*r*0.45,z+Math.sin(a)*r*0.45,a),RIM]);}
  if(disc)p.push([cy(0.11,0.11,0.006,0.075,r+tw,z,8,0,Math.PI/2),0xb8bcc0]);}
function scooterParts(top){const W=0xffffff,BK=0x161616,GR=0x2c2c2e,CH=0xa8acb0,RIM=0x3a3c3e;const p=[];
  wheelParts(p,0.68,0.235,0.072,BK,RIM,true);wheelParts(p,-0.66,0.235,0.072,BK,RIM,false);
  // escudo delantero y frontal
  p.push([xS([[0.3,0.4],[0.52,0.44],[0.64,0.62,0.68,0.8],[0.66,0.97],[0.6,1.02],[0.5,1.0],[0.44,0.86,0.36,0.62],[0.3,0.5]],0.38,0.035),W]);
  p.push([xS([[0.34,0.42],[0.44,0.82],[0.46,0.92],[0.42,0.93],[0.3,0.52]],0.3,0.02,0),GR]);// contraescudo interior
  // plataforma (piso plano del SH) y faldón
  p.push([xS([[-0.2,0.34],[0.36,0.34],[0.38,0.43],[-0.2,0.43]],0.36,0.02),GR],[xS([[-0.2,0.24],[0.34,0.26],[0.36,0.36],[-0.2,0.36]],0.3,0.03),W]);
  // carenado trasero
  p.push([xS([[-0.22,0.36],[-0.08,0.42],[0.02,0.58,0.06,0.76],[-0.2,0.8],[-0.7,0.84],[-0.92,0.83],[-0.98,0.78],[-0.9,0.64],[-0.62,0.48],[-0.36,0.38]],0.33,0.04),W]);
  for(const sx of [-1,1])p.push([xS([[-0.86,0.66],[-0.3,0.47],[-0.28,0.49],[-0.84,0.69]],0.01,0,sx*0.168),0xb8bcc0]);
  // sillín biplaza
  p.push([xS([[0.06,0.77],[0.02,0.84,-0.08,0.87],[-0.34,0.885],[-0.42,0.9],[-0.66,0.915],[-0.8,0.9],[-0.84,0.86],[-0.78,0.83],[0.04,0.76]],0.3,0.035),0x2a2420]);
  // horquilla, guardabarros y amortiguador trasero
  for(const sx of [-1,1])p.push([tube([sx*0.075,0.31,0.68],[sx*0.06,0.86,0.56],0.022,6),CH]);
  p.push([xS([[0.48,0.47],[0.62,0.6,0.78,0.6],[0.92,0.5],[0.9,0.47],[0.77,0.565,0.62,0.565],[0.5,0.44]],0.15,0.012),W]);
  p.push([tube([-0.12,0.32,-0.66],[-0.13,0.66,-0.48],0.028,6),0xb02020],[tube([-0.12,0.32,-0.66],[-0.12,0.42,-0.2],0.05,6),0x5a5c5e]);// muelle rojo y basculante/motor
  p.push([xS([[-0.18,0.24],[0.0,0.26],[0.04,0.42],[-0.3,0.45],[-0.62,0.4],[-0.66,0.28],[-0.5,0.2]],0.12,0.02,-0.1),0x4a4c4e]);// cárter del motor
  p.push([cy(0.055,0.06,0.42,0.16,0.4,-0.62,7,Math.PI/2-0.12),0x3a3a3a],[cy(0.062,0.062,0.08,0.16,0.42,-0.82,7,Math.PI/2-0.12),CH]);// escape
  // cubremanillar con faro, manillar, puños, maneta y retrovisores
  p.push([xS([[0.42,1.0],[0.5,1.08],[0.64,1.1],[0.72,1.04],[0.7,0.98],[0.58,0.96],[0.44,0.96]],0.5,0.03),W]);
  p.push([xS([[0.66,1.0],[0.72,1.03],[0.735,1.0],[0.7,0.975]],0.24,0.01),0xe6edf2]);// faro
  p.push([tube([-0.38,1.05,0.46],[0.38,1.05,0.46],0.017,6),BK]);for(const sx of [-1,1]){p.push([tube([sx*0.3,1.05,0.46],[sx*0.42,1.05,0.46],0.023,6),BK],[tube([sx*0.2,1.07,0.5],[sx*0.36,1.06,0.53],0.008,4),0x8a8e92]);
    p.push([tube([sx*0.2,1.08,0.5],[sx*0.27,1.22,0.47],0.008,4),BK],[ell(0.075,0.05,0.02,sx*0.29,1.25,0.47,6),BK],[ell(0.065,0.042,0.004,sx*0.29,1.25,0.458,6),0xc8d0d6]);}
  // intermitentes, piloto, matrícula y caballete
  for(const sx of [-1,1])p.push([bx(0.05,0.03,0.05,sx*0.2,1.0,0.64),0xe89a20],[bx(0.04,0.03,0.04,sx*0.12,0.76,-0.97),0xe89a20]);
  p.push([xS([[-0.92,0.74],[-0.99,0.77],[-1.0,0.72],[-0.93,0.7]],0.22,0.008),0xb81010],[bx(0.2,0.14,0.01,0,0.58,-0.97,0.25),0xf2f2ee],[bx(0.22,0.02,0.04,0,0.66,-0.95),BK]);
  p.push([tube([-0.1,0.3,-0.05],[-0.2,0.02,-0.14],0.012,4),BK]);
  if(top){p.push([xS([[-0.68,0.93],[-0.62,1.12,-0.72,1.24],[-1.0,1.25],[-1.08,1.12],[-1.04,0.93]],0.4,0.05),BK],[bx(0.25,0.03,0.012,0,1.08,-1.08),0xb81010],[bx(0.3,0.03,0.42,0,0.92,-0.86),GR]);}
  return p;}
const motoMat=pbr(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.42,metalness:0.12}));// plástico pintado brillante
defInst('moto',mkG(scooterParts(false)),motoMat,1,1,false);defInst('motoT',mkG(scooterParts(true)),motoMat,1,1,false);
// casco tirado y trozos de carenado (junto a las motos caídas)
defInst('casco',mkG([[ell(0.14,0.13,0.16,0,0.13,0,12),0xffffff],[ell(0.12,0.06,0.02,0,0.14,0.15,10),0x1a1e22],[bx(0.2,0.02,0.05,0,0.03,0.08),0x141414]]),motoMat,1,1,false);
defInst('carenado',mkG([[xS([[0,0],[0.25,0.02],[0.32,0.1],[0.1,0.14]],0.12,0.01),0xffffff],[xS([[0.4,0],[0.55,0.03],[0.5,0.08]],0.08,0.006,0.25),0xffffff],[xS([[0.1,0],[0.2,0.01],[0.18,0.05]],0.04,0.004,-0.2),0xb81010]]),motoMat,1,1,false);
// moto naked (tipo MT-07) y maxiscooter (tipo TMAX), las otras motos que más se ven en Barcelona
{const W=0xffffff,BK=0x141414,CH=0xa8acb0,EN=0x3a3a3c,RIM=0x2a2a2c;const p=[];
  wheelParts(p,0.72,0.24,0.075,BK,RIM,true);wheelParts(p,-0.7,0.24,0.085,BK,RIM,true);
  p.push([xS([[0.02,0.86],[0.12,0.98],[0.38,0.99],[0.48,0.9],[0.44,0.8],[0.08,0.78]],0.34,0.05),W]);// depósito
  for(const sx of [-1,1])p.push([xS([[0.3,0.82],[0.46,0.88],[0.5,0.74],[0.36,0.66]],0.02,0.008,sx*0.16),W]);// tapas laterales del depósito
  p.push([xS([[0.02,0.86],[-0.1,0.88],[-0.42,0.89],[-0.48,0.86],[-0.4,0.82],[0.04,0.8]],0.26,0.04),0x1c1a18]);// asiento
  p.push([xS([[-0.42,0.84],[-0.6,0.9],[-0.86,0.96],[-0.88,0.92],[-0.62,0.84],[-0.46,0.78]],0.16,0.02),W]);// colín
  p.push([xS([[-0.08,0.32],[0.32,0.34],[0.38,0.62],[0.3,0.76],[0.0,0.76],[-0.16,0.6]],0.3,0.03),EN]);// motor
  for(let k=0;k<2;k++)p.push([cy(0.04,0.04,0.22,-0.04+k*0.09,0.7,0.32,8),0x6a6c6e]);// cilindros
  for(const sx of [-1,1])p.push([tube([sx*0.12,0.86,0.42],[sx*0.12,0.42,-0.1],0.016,6),0x8a1a1a],[tube([sx*0.12,0.86,0.42],[sx*0.1,0.8,-0.3],0.016,6),0x8a1a1a],[tube([sx*0.08,0.36,0.72],[sx*0.07,0.92,0.52],0.026,8),0xc8a040]);// chasis tubular y horquilla dorada
  p.push([tube([0,0.34,-0.7],[0.1,0.45,-0.1],0.03,6),CH],[tube([0.12,0.3,0.2],[0.16,0.28,-0.3],0.035,8),0x4a4a4a],[cy(0.06,0.07,0.3,0.16,0.3,-0.42,10,Math.PI/2),0x2a2a2a]);// basculante y escape
  p.push([xS([[0.5,0.92],[0.6,0.98],[0.66,0.92],[0.62,0.84],[0.52,0.84]],0.2,0.02),BK],[xS([[0.6,0.91],[0.665,0.93],[0.67,0.88],[0.63,0.86]],0.14,0.008),0xe6edf2]);// faro
  p.push([tube([-0.36,1.04,0.44],[0.36,1.04,0.44],0.014,6),BK]);for(const sx of [-1,1])p.push([tube([sx*0.28,1.04,0.44],[sx*0.38,1.04,0.44],0.022,8),BK],[tube([sx*0.22,1.05,0.44],[sx*0.26,1.22,0.42],0.008,4),BK],[ell(0.06,0.04,0.015,sx*0.27,1.25,0.42,8),BK]);
  p.push([xS([[0.56,0.58],[0.72,0.64],[0.88,0.58],[0.86,0.55],[0.72,0.6],[0.58,0.55]],0.13,0.01),W],[bx(0.18,0.13,0.01,0,0.72,-0.9,0.3),0xf2f2ee],[xS([[-0.86,0.93],[-0.9,0.95],[-0.91,0.91],[-0.87,0.9]],0.14,0.006),0xb81010]);
  defInst('motoN',mkG(p),motoMat,1,1,false);}
{const W=0xffffff,BK=0x141414,GR=0x2a2a2c,CH=0xa8acb0,RIM=0x2c2c2e;const p=[];
  wheelParts(p,0.76,0.22,0.075,BK,RIM,true);wheelParts(p,-0.72,0.22,0.08,BK,RIM,false);
  p.push([xS([[0.22,0.42],[0.56,0.44],[0.74,0.6,0.8,0.86],[0.76,1.02],[0.62,1.1],[0.42,1.08],[0.4,0.86],[0.34,0.6]],0.6,0.05),W]);// carenado frontal ancho
  p.push([xS([[0.62,1.08],[0.72,1.22],[0.66,1.36],[0.6,1.34],[0.56,1.12]],0.42,0.01),0x5a6a74]);// cúpula ahumada
  for(const sx of [-1,1])p.push([xS([[0.74,0.88],[0.8,0.92],[0.81,0.86],[0.76,0.84]],0.12,0.008,sx*0.15),0xe6edf2]);// doble faro
  p.push([xS([[-0.3,0.4],[0.36,0.42],[0.38,0.5],[-0.3,0.5]],0.44,0.02),GR],[xS([[-0.2,0.48],[0.3,0.5],[0.34,0.72],[0.1,0.76],[-0.2,0.7]],0.2,0.04),W]);// piso y túnel central
  p.push([xS([[-0.24,0.42],[-0.1,0.5],[-0.04,0.8],[-0.4,0.86],[-0.86,0.9],[-1.06,0.86],[-1.02,0.7],[-0.7,0.52],[-0.4,0.42]],0.42,0.05),W]);// cola
  p.push([xS([[-0.04,0.79],[-0.12,0.87],[-0.36,0.88],[-0.46,0.94],[-0.78,0.97],[-0.88,0.94],[-0.82,0.89],[-0.04,0.77]],0.36,0.04),0x1c1a18]);// asiento escalonado
  p.push([tube([0.08,0.3,-0.72],[0.1,0.44,-0.1],0.05,8),0x4a4c4e],[cy(0.05,0.06,0.46,0.2,0.38,-0.64,10,Math.PI/2-0.15),0x3a3a3a]);
  for(const sx of [-1,1])p.push([tube([sx*0.08,0.3,0.76],[sx*0.07,0.92,0.58],0.024,8),CH],[tube([sx*0.24,1.06,0.46],[sx*0.38,1.06,0.46],0.022,8),BK],[tube([sx*0.28,1.0,0.6],[sx*0.36,1.14,0.58],0.008,4),BK],[ell(0.07,0.045,0.016,sx*0.37,1.16,0.58,8),BK]);
  p.push([tube([-0.26,1.06,0.46],[0.26,1.06,0.46],0.016,6),BK],[xS([[0.5,0.48],[0.66,0.58,0.82,0.58],[0.96,0.5],[0.94,0.47],[0.8,0.55,0.66,0.55],[0.52,0.45]],0.14,0.01),W]);
  p.push([bx(0.2,0.14,0.01,0,0.62,-1.04,0.25),0xf2f2ee],[xS([[-1.0,0.82],[-1.07,0.85],[-1.08,0.8],[-1.02,0.78]],0.3,0.008),0xb81010]);
  defInst('motoX',mkG(p),motoMat,1,1,false);}
// basura de calle abandonada: cajas de cartón, bolsas, ropa, ramas, tronco caído, contenedor quemado y volcado, colchón, maleta
{const C=0xa8845a,T=0xc8b58a;defInst('caja2',mkG([[bx(0.55,0.4,0.42,0,0.2,0),C],[bx(0.56,0.05,0.12,0,0.4,0),T],[bx(0.5,0.3,0.36,0.05,0.55,0.03,0,0.3,0.1),0x9a7a50]]),plasticMat,1,1,false);
 defInst('cajaPlana',mkG([[bx(0.9,0.04,0.65,0,0.02,0),C],[bx(0.6,0.04,0.5,0.1,0.06,0.05,0,0.4),0xb8946a]]),plasticMat,1,1,false);
 defInst('bolsas',mkG([[ell(0.28,0.24,0.26,0,0.22,0,6),0x161616],[ell(0.24,0.2,0.22,0.36,0.18,0.12,6),0x1d1d1f],[ell(0.2,0.18,0.2,-0.2,0.16,0.3,5),0x22303a],[ell(0.18,0.2,0.18,0.12,0.45,0.05,5),0x141414]]),plasticMat,1,1,false);
 defInst('ropa',mkG([[bx(0.55,0.02,0.7,0,0.012,0,0,0.3),0xffffff],[bx(0.25,0.02,0.45,0.35,0.02,0.1,0,-0.6),0xffffff],[bx(0.3,0.06,0.12,-0.35,0.03,-0.3,0,0.8),0x222222]]),photoMat('fabric',{roughness:0.95,ns:0.6}),1,1,false);
 defInst('maleta',mkG([[bx(0.45,0.65,0.24,0,0.12,0,Math.PI/2),0x2a3a5a],[bx(0.18,0.03,0.03,0,0.25,0.36),0x111111]]),plasticMat,1,1,false);
 defInst('colchon',mkG([[bx(1.4,0.18,1.95,0,0.09,0),0xd8d0c0],[bx(1.42,0.02,1.97,0,0.18,0),0xc0b8a8]]),photoMat('fabric',{roughness:0.95,ns:0.6}),1,1,false);
 const bark=photoMat('bark_platanus',{ns:1.0});const br=[];const lim=(a,b,r)=>br.push([tube(a,b,r,6),0x8a7a66]);
 lim([0,0.08,0],[1.4,0.18,0.2],0.045);lim([0.6,0.12,0.08],[1.0,0.45,-0.4],0.02);lim([1.0,0.16,0.15],[1.5,0.3,0.6],0.018);lim([0.3,0.1,0.03],[0.4,0.35,0.5],0.015);defInst('rama',mkG(br),bark,1,1,false);
 const tr=[];tr.push([cy(0.24,0.3,7.5,0,0.27,0,10,0,Math.PI/2),0x9a8a76]);tr[0][0].translate(3.6,0,0);
 for(const [x,a,l] of [[5.2,0.6,2.2],[6.3,-0.7,1.8],[4.4,-0.4,1.6],[6.9,0.3,1.5]]){const g=tube([x,0.35,0],[x+Math.cos(a)*l*0.6,0.35+l*0.55,Math.sin(a)*l],0.07,6);tr.push([g,0x9a8a76]);}
 defInst('tronco',mkG(tr),bark,1,1,false);
 const BUR=0x1a1816,AS=0x3a3530;for(const [k,lid] of [['contQuemado',0x0e0d0c]]){const dome=[];for(let i=0;i<=10;i++){const a=i/10*Math.PI;dome.push([Math.cos(a)*0.69,1.14+Math.pow(Math.sin(a),0.75)*0.32]);}dome.push([-0.69,1.08],[0.69,1.08]);
   defInst(k,mkG([[prof([[-0.5,0.13],[0.5,0.13],[0.6,0.5],[0.66,1.0],[-0.62,1.05],[-0.6,0.5]],1.82),BUR],[prof(dome,1.5),lid],[bx(1.7,0.13,0.9,0,0.065,0),AS],[bx(1.5,0.2,0.4,0.2,1.0,0.3,0.4,0,0.1),0x2a2420]]),plasticMat,1,1,false);}}
// parquímetro (àrea verda)
defInst('parquimetre',mkG([[bx(0.32,1.35,0.22,0,0.67,0),0x5d6266],[bx(0.33,0.12,0.23,0,1.2,0),0x2f9a48],[bx(0.2,0.14,0.02,0,1.0,0.12),0x111111]]),metalMat,1,1,false);
// armario eléctrico
defInst('armari',mkG([[bx(0.9,1.25,0.38,0,0.62,0),0x9a9a8e],[bx(0.92,0.06,0.42,0,1.27,0),0x7a7a70]]),plasticMat,1,1,false);
// quiosco de prensa (verde)
defInst('kiosk',mkG([[bx(3,2.5,2,0,1.25,0),0x2f4f3a],[bx(3.4,0.12,2.4,0,2.56,0),0x23392b],[bx(2.7,1.4,0.04,0,1.5,1.02),0x6e7a72]]),paintMat,1,1,false);
// fuente de Barcelona (fundición verde oscuro, torneada)
defInst('font',mkG([[lathe([[0.2,0],[0.2,0.06],[0.15,0.1],[0.13,0.16],[0.105,0.22],[0.095,0.9],[0.12,0.96],[0.125,1.02],[0.1,1.08],[0.11,1.14],[0.15,1.2],[0.15,1.26],[0.09,1.34],[0.05,1.4],[0.06,1.46],[0.03,1.52],[0.001,1.54]],16),0x24352b],
  [tube([0,1.0,0.1],[0,1.0,0.24],0.016,8),0xb09a4a],[tube([0,1.0,0.24],[0,0.94,0.26],0.016,8),0xb09a4a],[sp(0.028,0,1.06,0.1,8),0xb09a4a],
  [lathe([[0.001,0.02],[0.24,0.02],[0.3,0.1],[0.32,0.2],[0.3,0.21],[0.26,0.12],[0.001,0.1]],16,0,0,0.3),0x24352b]]),paintMat,1,1,false);
// jardinera Barcelona: cuenco negro de fundición sobre tres pies, con tierra y arbusto
defInst('jardinera',mkG([[lathe([[0.001,0.16],[0.3,0.17],[0.52,0.3],[0.66,0.5],[0.72,0.62],[0.8,0.63],[0.8,0.67],[0.68,0.67],[0.6,0.52],[0.001,0.5]],22),0x1c1d1e],[cy(0.62,0.62,0.02,0,0.6,0,18),0x3a2e22],
  ...[0,1,2].map(k=>[bx(0.14,0.2,0.2,Math.cos(k*2.094)*0.3,0.1,Math.sin(k*2.094)*0.3,0,-k*2.094),0x1c1d1e]),
  [ell(0.42,0.3,0.4,-0.1,0.85,0.05,9),0x3f5a2c],[ell(0.3,0.26,0.32,0.26,0.82,-0.12,8),0x4b6a31],[ell(0.24,0.2,0.26,0.02,1.02,0.16,8),0x36502a]]),plasticMat,1,1,false);
// mesa y sillas de terraza (aluminio)
defInst('terrassa',mkG([[cy(0.35,0.35,0.03,0,0.73,0,10),0xb9bec2],[cy(0.025,0.025,0.72,0,0.36,0,5),0x9aa0a4],[cy(0.2,0.2,0.02,0,0.01,0,8),0x9aa0a4],
  ...[0,1,2].flatMap(i=>{const a=i*2.1,x=Math.cos(a)*0.62,z=Math.sin(a)*0.62;return[[bx(0.42,0.03,0.42,x,0.45,z,0,-a),0xb9bec2],[bx(0.42,0.4,0.03,x+Math.cos(a)*0.2,0.65,z+Math.sin(a)*0.2,0,-a+Math.PI/2),0xb9bec2],[cy(0.015,0.015,0.45,x,0.22,z,5),0x9aa0a4]];})]),metalMat,1,1,false);
// barrera de hormigón (new jersey) y valla militar (límite del mapa)
defInst('jersey',mkG([[bx(2.0,0.25,0.6,0,0.12,0),0xb4b0a6],[bx(2.0,0.6,0.25,0,0.55,0),0xb4b0a6],[bx(2.0,0.1,0.18,0,0.9,0),0xc8c4ba]]),plasticMat,1,1,false);
const texFence=cTex(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#8a8f92';g.lineWidth=2;for(let i=-w;i<w*2;i+=12){line(g,i,0,i+h,h);line(g,i,h,i+h,0);}g.lineWidth=6;g.strokeRect(2,2,w-4,h-4);},{});
defInst('valla',(()=>{const g=new THREE.PlaneGeometry(3.4,2.0);g.translate(0,1.15,0);return g;})(),new THREE.MeshLambertMaterial({map:texFence,alphaTest:0.4,side:THREE.DoubleSide}),1,1,false);
defInst('vallaBase',mkG([[bx(0.6,0.15,0.35,-1.7,0.07,0),0x9a968c],[bx(0.6,0.15,0.35,1.7,0.07,0),0x9a968c],[cy(0.02,0.02,2.1,-1.7,1.1,0,5),0x8a8f92],[cy(0.02,0.02,2.1,1.7,1.1,0,5),0x8a8f92]]),metalMat,1,1,false);
// palé y sacos (barricadas)
defInst('pale',mkG([[bx(1.2,0.03,0.12,0,0.13,-0.5),0xb08a5a],[bx(1.2,0.03,0.12,0,0.13,0),0xb08a5a],[bx(1.2,0.03,0.12,0,0.13,0.5),0xb08a5a],[bx(0.1,0.1,1.1,-0.55,0.06,0),0x8a6a40],[bx(0.1,0.1,1.1,0,0.06,0),0x8a6a40],[bx(0.1,0.1,1.1,0.55,0.06,0),0x8a6a40]]),woodPropMat,1,1,false);
defInst('sacos',mkG([[bx(1.4,0.3,0.5,0,0.15,0),0x9a8a62],[bx(1.3,0.28,0.48,0.1,0.44,0,0,0.1),0x8e7e58],[bx(1.2,0.26,0.46,-0.05,0.71,0,0,-0.08),0xa2926a]]),plasticMat,1,1,false);
defInst('tablon',mkG([[bx(1,0.18,0.03,0,0,0),0xb89a72]]),woodPropMat,1,1,false);
// cajas de cartón / productos caídos
defInst('caja',mkG([[bx(0.5,0.38,0.4,0,0.19,0),0xb08a5a]]),plasticMat,1,1,false);
// carrito de la compra
{const M=0xb8bcc0;const p=[[bx(0.55,0.03,0.85,0,0.55,0),M],[bx(0.03,0.45,0.85,-0.28,0.78,0),M],[bx(0.03,0.45,0.85,0.28,0.78,0),M],[bx(0.55,0.45,0.03,0,0.78,0.42),M],[bx(0.55,0.45,0.03,0,0.78,-0.42),M],[bx(0.6,0.04,0.04,0,1.05,-0.5),0xd8202a],
  ...[[-0.24,0.36],[0.24,0.36],[-0.22,-0.38],[0.22,-0.38]].flatMap(([x,z])=>[[cy(0.012,0.012,0.5,x,0.3,z,5),M],[cy(0.05,0.05,0.04,x,0.05,z,8,0,Math.PI/2),0x222222]])];
  defInst('carro',mkG(p),metalMat,1,1,false);}
// cristales rotos en el suelo
const texShards=cTex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);for(let i=0;i<70;i++){g.fillStyle=`rgba(${200+R(0,40)|0},${220+R(0,30)|0},235,${R(0.35,0.75)})`;g.beginPath();const x=R(10,w-10),y=R(10,h-10),s=R(3,16);g.moveTo(x,y);g.lineTo(x+R(-s,s),y+R(-s,s));g.lineTo(x+R(-s,s),y+R(-s,s));g.fill();}},{});
defInst('shards',(()=>{const g=new THREE.PlaneGeometry(1.6,1.2);g.rotateX(-Math.PI/2);g.translate(0,0.012,0);return g;})(),new THREE.MeshLambertMaterial({map:texShards,transparent:true,depthWrite:false}),1,1,false);
// grafitis (fotos CC0, atlas 4x4 con alfa)
const texGraff=ltex('graffiti.png',true,false);
const graffMat=atlasMat(texGraff,null,4,4,{transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
defInst('graffiti',PLANE,graffMat,4,4,true);
// basura / bolsas
defInst('bolsa',mkG([[sp(0.25,0,0.22,0,7),0x1a1a1a],[sp(0.2,0.3,0.18,0.1,7),0x2a2a2a]]),plasticMat,1,1,false);
