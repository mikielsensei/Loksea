// =====================================================================
// TEXTURAS Y MATERIALES (todo local, en assets/tex: fotos CC0 de Poly Haven y ambientCG + generadas)
// =====================================================================
function cTex(w,h,draw,o={}){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);
  const t=new THREE.CanvasTexture(c);if(o.srgb!==false)t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;}
function speckle(g,w,h,n,a){for(let i=0;i<n;i++){const v=Math.random()<0.5?0:255;g.fillStyle=`rgba(${v},${v},${v},${Math.random()*a})`;g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);}}
function line(g,x0,y0,x1,y1){g.beginPath();g.moveTo(x0,y0);g.lineTo(x1,y1);g.stroke();}
const texLoader=new THREE.TextureLoader();
let texPending=0,texDone=0;
const TEXCACHE={};
// carga una textura local; devuelve el objeto Texture ya (se rellena al llegar)
function ltex(name,srgb=true,repeat=true){const key=name+(srgb?'':'#l');if(TEXCACHE[key])return TEXCACHE[key];texPending++;
  const t=texLoader.load('assets/tex/'+name,()=>{texDone++;setLoad('t',`Texturas: ${texDone}/${texPending}`);},undefined,()=>{texDone++;console.warn('tex fail',name);});
  if(srgb)t.colorSpace=THREE.SRGBColorSpace;if(repeat)t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;TEXCACHE[key]=t;return t;}
const PBR=new Set();const pbr=m=>{if(m&&(m.isMeshStandardMaterial||m.isMeshPhysicalMaterial))PBR.add(m);return m;};
// material de foto: name -> assets/tex/name_diff.jpg (+_nor.jpg). Las UV de la geometría están en metros*us
function photoMat(name,o={}){const{ns,normal,...rest}=o;const m=new THREE.MeshStandardMaterial(Object.assign({map:ltex(name+'_diff.jpg'),roughness:0.9,metalness:0,vertexColors:true},rest));
  if(normal!==false){m.normalMap=ltex(name+'_nor.jpg',false);m.normalScale=new THREE.Vector2(ns||0.8,ns||0.8);}return pbr(m);}
// metros por repetición de cada textura (escala UV)
const TEXM={asphalt:5,asphalt_cracked:5,panot4:0.8,panotflor:0.8,panotbotons:0.8,granite:1.2,plaster_cream:3,plaster_grey:3,plaster_ochre:3,stone_blocks:2.4,stone_dark:3,brick:2,
  shutter:2.2,shutter_rust:2.2,wood_dark:1.2,wood_door:1.5,rust:1.5,floor_hidraulic:1.6,floor_terrazo:1.6,floor_super:2.4,floor_wood:2,concrete:3,concrete_wall:3,bark_platanus:1.4,bark_palm:1.2,llambordes:1.6};
const US=k=>1/(TEXM[k]||1);
// texturas de detalle (siempre procedurales)
// charco de sangre: borde nítido e irregular (lóbulos) con gotas sueltas alrededor
const texBlood=cTex(256,256,(g,w,h)=>{g.clearRect(0,0,w,h);const c=128;g.fillStyle='rgb(70,4,3)';g.beginPath();const N=40,ph=[R(0,6),R(0,6),R(0,6)];
  for(let i=0;i<=N;i++){const a=i/N*6.283;const r=62+Math.sin(a*3+ph[0])*12+Math.sin(a*5+ph[1])*8+Math.sin(a*9+ph[2])*4;g.lineTo(c+Math.cos(a)*r,c+Math.sin(a)*r);}g.fill();
  for(let i=0;i<7;i++){const a=R(0,6.28),d=R(55,80);g.beginPath();g.arc(c+Math.cos(a)*d,c+Math.sin(a)*d,R(10,22),0,7);g.fill();}
  for(let i=0;i<40;i++){const a=R(0,6.28),d=R(85,122);g.beginPath();g.arc(c+Math.cos(a)*d,c+Math.sin(a)*d,R(1.5,5),0,7);g.fill();}
  const gr=g.createRadialGradient(c-20,c-20,4,c,c,90);gr.addColorStop(0,'rgba(0,0,0,0.35)');gr.addColorStop(1,'rgba(0,0,0,0)');g.globalCompositeOperation='source-atop';g.fillStyle=gr;g.fillRect(0,0,w,h);g.globalCompositeOperation='source-over';},{});
texBlood.wrapS=texBlood.wrapT=THREE.ClampToEdgeWrapping;
const texShadow=cTex(64,64,(g)=>{const gr=g.createRadialGradient(32,32,2,32,32,30);gr.addColorStop(0,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);});

