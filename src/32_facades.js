// =====================================================================
// FACHADAS DEL EIXAMPLE: atlas de ventanas/balcones, molduras, balcones de hierro, persianas
// =====================================================================
const SHUTC=['#46624a','#5c4630','#3f5446','#6a5236','#4d4d47','#7a6c58','#355a4a','#8a7a60'];
// celda de puerta-balcón (1:2). st: 0 persiana de llibret cerrada, 1 abierta con cortina, 2 enrollable media, 3 cristal roto, 4 tapiada, 5 quemada
function drawBalcDoor(g,x,y,w,h,st,lit){const sh=pick(SHUTC);g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
  g.fillStyle='#d8d0bf';g.fillRect(x,y,w,h);const fx=x+w*0.07,fw=w*0.86,fy=y+h*0.03,fh=h*0.95;
  const glass=()=>{g.fillStyle=lit?'#ffcf86':'#1d2329';g.fillRect(fx,fy,fw,fh);if(!lit){const gr=g.createLinearGradient(fx,fy,fx+fw,fy+fh);gr.addColorStop(0,'rgba(170,190,210,.4)');gr.addColorStop(0.5,'rgba(60,70,80,.1)');gr.addColorStop(1,'rgba(150,170,190,.25)');g.fillStyle=gr;g.fillRect(fx,fy,fw,fh);}
    g.strokeStyle='#e8e2d4';g.lineWidth=w*0.035;g.strokeRect(fx,fy,fw,fh);line(g,fx+fw/2,fy,fx+fw/2,fy+fh);line(g,fx,fy+fh*0.62,fx+fw,fy+fh*0.62);};
  const slats=(sx,sw,sy,shh,col)=>{g.fillStyle=col;g.fillRect(sx,sy,sw,shh);g.strokeStyle='rgba(0,0,0,.38)';g.lineWidth=2;for(let yy=sy+5;yy<sy+shh;yy+=7)line(g,sx+3,yy,sx+sw-3,yy);g.strokeStyle='rgba(255,255,255,.12)';for(let yy=sy+7;yy<sy+shh;yy+=7)line(g,sx+3,yy,sx+sw-3,yy);
    g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=3;g.strokeRect(sx+1,sy+1,sw-2,shh-2);};
  if(st===0){slats(fx,fw/2,fy,fh,sh);slats(fx+fw/2,fw/2,fy,fh,sh);if(lit){g.fillStyle='rgba(255,200,120,.5)';for(let yy=fy+6;yy<fy+fh;yy+=7)g.fillRect(fx+4,yy,fw-8,1.5);}}
  else if(st===1){glass();if(!lit){g.fillStyle=pick(['rgba(235,228,210,.85)','rgba(210,200,180,.8)','rgba(190,160,140,.75)']);g.fillRect(fx+fw*0.06,fy+fh*0.04,fw*0.3,fh*0.9);g.fillRect(fx+fw*0.64,fy+fh*0.04,fw*0.3,fh*0.9);}
    slats(x,w*0.08,fy,fh,sh);slats(x+w*0.92,w*0.08,fy,fh,sh);}
  else if(st===2){glass();const k=R(0.3,0.75);slats(fx,fw,fy,fh*k,pick(['#cfc4ae','#b8ad98','#8a7a62']));}
  else if(st===3){glass();g.fillStyle='#0b0d0f';g.beginPath();g.moveTo(fx+fw*R(0.1,0.4),fy+fh*0.15);for(let i=0;i<9;i++)g.lineTo(fx+fw*R(0.05,0.95),fy+fh*R(0.1,0.85));g.fill();g.strokeStyle='rgba(220,230,240,.7)';g.lineWidth=1.5;for(let i=0;i<8;i++)line(g,fx+fw*0.5,fy+fh*0.45,fx+fw*R(0,1),fy+fh*R(0,1));}
  else if(st===4){g.fillStyle='#1a1a1a';g.fillRect(fx,fy,fw,fh);for(let i=0;i<5;i++){g.save();g.translate(fx+fw/2,fy+fh*(0.15+i*0.18));g.rotate(R(-0.25,0.25));g.fillStyle=pick(['#9a7a52','#8a6a44','#a8865a']);g.fillRect(-fw*0.6,-h*0.035,fw*1.2,h*0.07);g.restore();}}
  else{glass();const gr=g.createRadialGradient(x+w/2,y+h*0.2,4,x+w/2,y+h*0.2,h*0.7);gr.addColorStop(0,'rgba(10,8,6,.95)');gr.addColorStop(1,'rgba(20,16,12,0)');g.fillStyle=gr;g.fillRect(x,y-h*0.1,w,h);}
  g.restore();}
const texWin=cTex(2048,1024,(g)=>{for(let r=0;r<2;r++)for(let c=0;c<8;c++){const st=[0,0,1,1,2,3,4,5,0,1,1,2,0,3,1,2][r*8+c];drawBalcDoor(g,c*256,r*512,256,512,st,false);}},{});
const texWinL=cTex(2048,1024,(g)=>{g.fillStyle='#000';g.fillRect(0,0,2048,1024);for(let r=0;r<2;r++)for(let c=0;c<8;c++){const st=[0,0,1,1,2,3,4,5,0,1,1,2,0,3,1,2][r*8+c];if(st===4||st===5||st===3)continue;g.save();g.globalCompositeOperation='source-over';drawBalcDoor(g,c*256,r*512,256,512,st,true);g.restore();
  g.fillStyle='rgba(0,0,0,1)';g.fillRect(c*256,r*512,256*0.07,512);g.fillRect(c*256+256*0.93,r*512,256*0.07,512);}},{});
const winMat=atlasMat(texWin,texWinL,8,2);winMat.polygonOffset=true;winMat.polygonOffsetFactor=-2;winMat.polygonOffsetUnits=-6;texWin.anisotropy=4;
defInst('win',(()=>{const g=new THREE.PlaneGeometry(1,1);g.translate(0,0.5,0);return g;})(),winMat,8,2);
// marco de ventana con alféizar y dintel (color de la fachada vía instanceColor)
{const p=[[bx(1.3,0.07,0.16,0,-0.03,0.07),0xffffff],[bx(1.25,0.16,0.12,0,1.12,0.06),0xffffff]];
  defInst('winFrame',mkG(p),new THREE.MeshLambertMaterial({vertexColors:true}));}
// balcón: losa de piedra + barandilla de hierro forjado (textura con alfa)
const texRail=cTex(1024,512,(g,W,Hh)=>{g.clearRect(0,0,W,Hh);const w=512,h=256;const I='#141514';
  // 0: modernista con volutas
  g.save();g.fillStyle=I;g.fillRect(0,0,w,12);g.fillRect(0,h-10,w,10);g.fillRect(0,28,w,5);g.fillRect(0,h-34,w,5);for(let x=6;x<w;x+=24)g.fillRect(x,0,5,h);g.strokeStyle=I;g.lineWidth=5;
  for(let x=0;x<w;x+=96){g.beginPath();g.arc(x+48,h/2,26,0,7);g.stroke();g.beginPath();g.arc(x+48,h/2,10,0,7);g.stroke();g.beginPath();g.moveTo(x+18,h/2);g.bezierCurveTo(x+18,h/2-40,x+78,h/2-40,x+78,h/2);g.stroke();}g.restore();
  // 1: barrotes rectos años 50 con pasamanos
  g.save();g.translate(w,0);g.fillStyle=I;g.fillRect(0,0,w,14);g.fillRect(0,h-12,w,12);for(let x=8;x<w;x+=18)g.fillRect(x,0,4,h);g.fillRect(0,h*0.55,w,4);g.restore();
  // 2: modernismo de látigo con flores
  g.save();g.translate(0,h);g.fillStyle=I;g.fillRect(0,0,w,12);g.fillRect(0,h-12,w,12);g.strokeStyle=I;g.lineWidth=6;
  for(let x=0;x<w;x+=128){g.beginPath();g.moveTo(x+4,h-12);g.bezierCurveTo(x+4,h*0.3,x+64,h*0.9,x+64,h*0.35);g.bezierCurveTo(x+64,h*0.9,x+124,h*0.3,x+124,h-12);g.stroke();
    g.beginPath();g.moveTo(x+64,12);g.lineTo(x+64,h*0.35);g.stroke();for(let k=0;k<5;k++){g.beginPath();g.ellipse(x+64+Math.cos(k*1.256)*14,h*0.3+Math.sin(k*1.256)*14,9,5,k*1.256,0,7);g.stroke();}
    g.beginPath();g.moveTo(x+4,12);g.quadraticCurveTo(x+34,h*0.2,x+4,h*0.45);g.stroke();g.beginPath();g.moveTo(x+124,12);g.quadraticCurveTo(x+94,h*0.2,x+124,h*0.45);g.stroke();}g.restore();
  // 3: balaustrada de piedra
  g.save();g.translate(w,h);const st='#d6ccbb',sh='#a89c88';g.fillStyle=st;g.fillRect(0,0,w,26);g.fillRect(0,h-22,w,22);g.fillStyle=sh;g.fillRect(0,24,w,4);
  for(let x=10;x<w;x+=42){g.fillStyle=st;g.beginPath();g.moveTo(x+10,30);g.lineTo(x+22,30);g.quadraticCurveTo(x+34,h*0.45,x+26,h*0.62);g.quadraticCurveTo(x+36,h*0.82,x+24,h-22);g.lineTo(x+8,h-22);g.quadraticCurveTo(x-4,h*0.82,x+6,h*0.62);g.quadraticCurveTo(x-2,h*0.45,x+10,30);g.fill();
    g.fillStyle='rgba(60,50,40,0.35)';g.fillRect(x+20,40,6,h-70);}
  g.fillStyle='rgba(40,32,24,0.25)';for(let i=0;i<60;i++)g.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*30,1+Math.random()*6);g.restore();},{});
{const slab=mkG([[bx(1,0.15,1,0,0.06,0.5),0xffffff],[bx(1,0.06,0.9,0,-0.04,0.45),0xe2dccf],[bx(1,0.04,0.8,0,-0.09,0.4),0xd4cdbf]]);defInst('balcSlab',slab,new THREE.MeshLambertMaterial({vertexColors:true}));
  const f=new THREE.PlaneGeometry(1,1);f.translate(0,0.5,1);const l=new THREE.PlaneGeometry(1,1);l.rotateY(Math.PI/2);l.translate(-0.5,0.5,0.5);const r=l.clone();r.translate(1,0,0);
  const railM=atlasMat(texRail,null,2,2,{alphaTest:0.18,alphaToCoverage:true,side:THREE.DoubleSide});defInst('balcRail',mergeGeometries([f,l,r]),railM,2,2);
  const fF=new THREE.PlaneGeometry(1,1);fF.translate(0,0.5,1);defInst('balcRailF',fF,railM,2,2);const sS=new THREE.PlaneGeometry(1,1);sS.rotateY(Math.PI/2);sS.translate(0,0.5,0.5);defInst('balcRailS',sS,railM,2,2);}
// macetas y ropa tendida y aire acondicionado
defInst('maceta',mkG([[cy(0.14,0.1,0.25,0,0.12,0,5),0xa0522d],[sp(0.22,0,0.42,0,5),0x3f6a2a]]),plasticMat);
const texLaundry=cTex(256,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#444';g.lineWidth=2;line(g,0,6,w,6);let x=6;while(x<w-20){const ww=R(22,46),hh=R(40,100);g.fillStyle=pick(['#e8e8e8','#6a8ab8','#b84a4a','#e8d86a','#4a4a4a','#8ab86a','#d8a0c0']);g.fillRect(x,6,ww,hh);x+=ww+R(4,10);}},{});
defInst('laundry',(()=>{const g=new THREE.PlaneGeometry(1.4,0.7);g.translate(0,-0.35,0);return g;})(),new THREE.MeshLambertMaterial({map:texLaundry,alphaTest:0.5,side:THREE.DoubleSide}));
defInst('ac',mkG([[bx(0.8,0.55,0.3,0,0,0.15),0xd8d8d4]]),plasticMat);
// materiales de fachada
MATS.plaster_cream=photoMat('plaster_cream',{ns:0.5});MATS.plaster_grey=photoMat('plaster_grey',{ns:0.5});MATS.plaster_ochre=photoMat('plaster_ochre',{ns:0.5});
MATS.stone_blocks=photoMat('stone_blocks',{ns:0.8});MATS.stone_dark=photoMat('stone_dark',{ns:0.8});MATS.brick=photoMat('brick',{ns:0.8});MATS.concrete_wall=photoMat('concrete_wall',{ns:0.6});
MATS.trim=new THREE.MeshLambertMaterial({vertexColors:true});
// años sin mantenimiento: regueros de lluvia bajo cornisas y ventanas, mugre y humedad a pie de calle, manchas de hollín y desconchones
function weatherMat(m,k=1){m.onBeforeCompile=sh=>{sh.uniforms.uWk={value:k};
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;uniform float uWk;\n'+NOISE_GLSL)
    .replace('#include <map_fragment>',`#include <map_fragment>
      vec3 w=vWP;float gy=w.y+w.z*0.012;float hz=w.x+w.z;
      float streak=zn(vec3(hz*3.1,gy*0.18,0.0))*0.65+zn(vec3(hz*9.0,gy*0.5,3.0))*0.35;
      float stain=smoothstep(0.55,0.85,streak)*smoothstep(1.2,4.5,gy);
      float blot=smoothstep(0.58,0.82,zn(w*0.35)*0.7+zn(w*1.3)*0.3);
      float ground=1.0-smoothstep(0.0,1.6+zn(vec3(hz*0.6,0.0,0.0))*1.2,gy);
      float soot=smoothstep(0.62,0.9,zn(vec3(hz*0.15,gy*0.08,7.0)));
      vec3 c=diffuseColor.rgb;
      c*=1.0-uWk*(stain*0.32+blot*0.18+soot*0.22);
      c=mix(c,c*vec3(0.62,0.6,0.52),ground*0.55*uWk);
      // desconchones: aparece el ladrillo/mortero
      float chip=smoothstep(0.86,0.875,zn(w*3.5+11.0)*0.8+zn(w*14.0)*0.2)*step(0.95,uWk);c=mix(c,c*vec3(0.78,0.68,0.6),chip*0.55);
      diffuseColor.rgb=c;`);};m.customProgramCacheKey=()=>'weather'+k;return m;}
for(const k of ['plaster_cream','plaster_grey','plaster_ochre','stone_blocks','stone_dark','brick','concrete_wall'])weatherMat(MATS[k],1);
weatherMat(MATS.trim,0.8);
const FACADE_STY=[// combinaciones reales del Eixample: zócalo de piedra + estuco de color, ladrillo visto, piedra entera
  {pb:'stone_blocks',up:'plaster_cream',tints:['#f1e6cf','#e8d6b5','#f2e2c8','#e6d2c0','#efe4d2']},
  {pb:'stone_dark',up:'plaster_ochre',tints:['#e8c98f','#dcb57f','#e2c290','#d9b98a']},
  {pb:'stone_blocks',up:'plaster_grey',tints:['#e2e0d9','#d8d4cb','#ece8df','#c9c6bd','#e6d9cf']},
  {pb:'stone_blocks',up:'brick',tints:['#ffffff','#f0e0d8']},
  {pb:'stone_blocks',up:'stone_blocks',tints:['#ffffff','#f4ead8']},
  {pb:'stone_dark',up:'plaster_cream',tints:['#f0d8c8','#e8c8b8','#dccab8','#f2d6c2']},
];
// pared con huecos (planta baja): huecos [u0,u1,y0,y1] en metros desde el inicio del segmento y desde la base; con jambas de profundidad dep
function wallHoles(mat,a,b,nx,nz,yb,yt,holes,dep,us,tint){const L=Math.hypot(b[0]-a[0],b[1]-a[1]);const ux=(b[0]-a[0])/L,uz=(b[1]-a[1])/L;const B=bufOf((a[0]+b[0])/2,(a[1]+b[1])/2,mat);TINT=tint||[1,1,1];
  const P=t=>[a[0]+ux*t,a[1]+uz*t];holes=holes.slice().sort((p,q)=>p[0]-q[0]);let cur=0;
  const seg=(t0,t1,y0,y1)=>{if(t1-t0<0.01||y1-y0<0.01)return;const p=P(t0),q=P(t1);wall(B,p[0],p[1],q[0],q[1],yb+y0,yb+y1,nx,nz,us,t0);};
  for(const h of holes){seg(cur,h[0],0,yt-yb);seg(h[0],h[1],h[3],yt-yb);if(h[2]>0)seg(h[0],h[1],0,h[2]);cur=h[1];
    // jambas, dintel y alféizar hacia dentro
    const p=P(h[0]),q=P(h[1]);const ix=-nx*dep,iz=-nz*dep;
    wall(B,p[0],p[1],p[0]+ix,p[1]+iz,yb+h[2],yb+h[3],ux,uz,us);wall(B,q[0],q[1],q[0]+ix,q[1]+iz,yb+h[2],yb+h[3],-ux,-uz,us);
    capPoly(B,[p,q,[q[0]+ix,q[1]+iz],[p[0]+ix,p[1]+iz]],yb+h[3],us,true);if(h[2]>0)capPoly(B,[p,q,[q[0]+ix,q[1]+iz],[p[0]+ix,p[1]+iz]],yb+h[2],us);}
  seg(cur,L,0,yt-yb);TINT=[1,1,1];}
// moldura horizontal (imposta, cornisa) como caja a lo largo de la fachada
function moldStrip(a,b,nx,nz,y,h,out,tint){const L=Math.hypot(b[0]-a[0],b[1]-a[1]);const cx=(a[0]+b[0])/2+nx*out/2,cz=(a[1]+b[1])/2+nz*out/2;const yaw=Math.atan2(b[0]-a[0],b[1]-a[1]);
  const B=bufOf(cx,cz,'trim');TINT=tint;boxGeoInto(B,cx,y+h/2,cz,out,h,L+out*0.5,yaw,1);TINT=[1,1,1];}
