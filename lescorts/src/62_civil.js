// =====================================================================
// VECINOS DE LES CORTS: gente que pasea por las aceras reales, corre, entra en las tiendas, se sienta en los bancos
// y en las terrazas a tomar algo, charla en corrillos y se ríe, tira la basura al contenedor... Cada uno con su rutina.
// =====================================================================
const CIV={n:0,popT:0};
const CIV_LINES=['Bon dia!','Perdona, que vaig una mica tard.','¿Sabes si el Mercat de les Corts abre por la tarde?','Hoy hace un día buenísimo.','Uf, el 54 siempre tarda un montón.',
  'Ahí en la esquina hacen unos cruasanes increíbles.','¿Tienes hora?','Bona tarda!','Vigila la bici, que por aquí van muy rápido.','Este barrio es tranquilo, ¿eh?','Me voy al Camp Nou, que hoy juega el Barça.','Adéu, que vagi bé!'];
// objetos que llevan en la mano
const CIV_ITEM={
  cup:new THREE.Mesh(mkG([[cy(0.032,0.026,0.1,0,0.05,0,10),0xf4f1ea],[cy(0.034,0.034,0.012,0,0.1,0,10),0x3a2a20]]),plasticMat),
  beer:new THREE.Mesh(mkG([[cy(0.03,0.026,0.13,0,0.065,0,10),0xd9a020],[cy(0.031,0.031,0.025,0,0.14,0,10),0xf6f3ea]]),glassPropMat()),
  bag:new THREE.Mesh(mkG([[bx(0.26,0.3,0.12,0,-0.2,0),0xe8e2d2],[bx(0.02,0.08,0.02,0.06,-0.02,0),0xd8d2c2],[bx(0.02,0.08,0.02,-0.06,-0.02,0),0xd8d2c2]]),plasticMat),
  trash:new THREE.Mesh(mkG([[sp(0.17,0,-0.2,0,8),0x161616],[cy(0.03,0.05,0.08,0,-0.03,0,6),0x161616]]),plasticMat),
  phone:new THREE.Mesh(mkG([[bx(0.07,0.145,0.01,0,0.0,0),0x111214]]),plasticMat)};
function glassPropMat(){return new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.15,metalness:0,transparent:true,opacity:0.85});}
function civItem(h,kind){if(h.item&&h.itemK===kind)return;if(h.item){h.item.parent&&h.item.parent.remove(h.item);h.item=null;}h.itemK=kind;if(!kind)return;const m=CIV_ITEM[kind].clone();scene.add(m);h.item=m;}
function civItemUpdate(h){const m=h.item;if(!m)return;m.visible=h.holder.visible&&!(h.inside>0);if(!m.visible)return;const p=h.sim[RHAND];m.position.copy(p);m.rotation.set(0,h.yaw,0);
  if(h.itemK==='phone'&&h.soc==='phone'){m.rotation.set(0.3,h.yaw+Math.PI/2,0);}else if(h.itemK==='cup'||h.itemK==='beer'){m.position.y-=0.06;}}
// punto de una cadena de acera, desplazado hacia dentro (lado de las fachadas)
function chainPt(ch,i,off,out){const n=ch.pts.length;const k=ch.pts[ch.loop?((i%n)+n)%n:clamp(i,0,n-1)];const o=Math.min(off,Math.max(0.3,k.sw-1.0));out.x=k.x-k.nx*o;out.z=k.z-k.nz*o;return k;}
const _cpt={x:0,z:0};
// rasgos cercanos a cada punto de acera (bancos, tiendas, contenedores, terrazas)
function civPrep(){for(const k of KERB)k.feat=null;const add=(x,z,f)=>{let best=null,bd=6;for(const c of CHAINS)for(const k of c.pts){const d=Math.hypot(k.x-x,k.z-z);if(d<bd){bd=d;best=k;}}if(best)(best.feat||(best.feat=[])).push(f);};
  for(const b of BENCHES)for(let s=0;s<b.n;s++){const a=(s-(b.n-1)/2)*0.62;const ux=Math.cos(b.yaw),uz=-Math.sin(b.yaw);const fx=-Math.sin(b.yaw)*0.1,fz=-Math.cos(b.yaw)*0.1;b.seats=b.seats||[];b.seats.push({x:b.x+ux*a+fx,z:b.z+uz*a+fz,yaw:b.yaw+Math.PI,y:b.y,used:null});}// el banco mira hacia su -z (el respaldo está en +z)
  for(const b of BENCHES)add(b.x,b.z,{t:'bench',o:b});for(const s of SHOPS)add(s.x,s.z,{t:'shop',o:s});for(const c of CONTS)add(c.x,c.z,{t:'cont',o:c});for(const t of TERR)add(t.x,t.z,{t:'terr',o:t});}
function hourDensity(){const h=hourF();const pts=[[0,0.25],[2,0.12],[5,0.06],[7,0.45],[9,0.9],[12,1],[14,0.8],[16,0.75],[18,1],[20.5,0.95],[22,0.6],[24,0.25]];for(let i=1;i<pts.length;i++)if(h<=pts[i][0]){const a=pts[i-1],b=pts[i];return lerp(a[1],b[1],(h-a[0])/(b[0]-a[0]));}return 0.25;}
const CIV_MAX=34;
function populateCivilians(){civPrep();CIV.ready=true;}
function civTpl(kind){const L=TPL_X[kind];if(!L||!L.length)return null;return pick(L);}
function civSpawnAt(k,o={}){if(!o.tpl){const hr=hourF(),r=Math.random();const kind=o.kind||(hr>7.5&&hr<20&&r<0.14?'office':r<0.17?'medic':r<0.2&&hr>9&&hr<22?'delivery':null);const t=kind&&civTpl(kind);if(t){o.tpl=t;o.female=t.female;}}delete o.kind;
  const h=spawnChar('civil',k.x-k.nx*1.2,k.z-k.nz*1.2,Object.assign({armed:false,variant:RI(0,11)},o));if(!h)return null;
  h.civ={r:'paseo',st:'walk',ch:k.ch,i:k.i,dir:Math.random()<0.5?1:-1,lane:R(1.0,2.2),spd:R(1.05,1.45),t:0,cool:R(5,25)};h.soc=null;h.inside=0;h.hostile=false;h.angry=false;h.name=h.female?pick(NAMES_CIV_F):pick(NAMES_CIV_M);civItem(h,null);return h;}
const NAMES_CIV_M=['Jordi','Pau','Marc','Albert','Carles','Xavi','Toni','Miguel','Joan','Sergi','Iván','Rubén','Karim','Wei','Andrés','Oriol'],NAMES_CIV_F=['Laia','Marta','Núria','Montse','Anna','Carmen','Laura','Sílvia','Fàtima','Lucía','Mei','Rosa','Aina','Elena','Paula','Mireia'];
function civSpawnNear(p,minR,maxR,first){// elige un punto de acera a la distancia pedida, mejor fuera de la vista
  const cand=[];for(let i=0;i<KERB.length;i+=3){const k=KERB[i];if(!k.ch||!CHAINS.includes(k.ch))continue;const d=Math.hypot(k.x-p.x,k.z-p.z);if(d>=minR&&d<=maxR)cand.push(k);}if(!cand.length)return 0;
  for(let tries=0;tries<30;tries++){const k=pick(cand);const ch=k.ch;const d=Math.hypot(k.x-p.x,k.z-p.z);
    if(!first){_sph.center.set(k.x,H(k.x,k.z)+1,k.z);_sph.radius=1.5;if(frustum.intersectsSphere(_sph)&&d<70)continue;}
    const r=Math.random(),night=isNight(),hr=hourF();
    // corrillo charlando
    if(r<0.12&&!night){const n=RI(2,3);const c0=chainPt(ch,k.i,R(1.2,2),{x:0,z:0});const grp=[];for(let j=0;j<n;j++){const a=j/n*Math.PI*2+R(-0.2,0.2);const h=civSpawnAt(k);if(!h)break;h.x=c0.x+Math.sin(a)*0.65;h.z=c0.z+Math.cos(a)*0.65;h.civ.r='charla';h.civ.st='chat';h.civ.cx=c0.x;h.civ.cz=c0.z;h.civ.t=R(40,200);grp.push(h);if(Math.random()<0.2)civItem(h,'cup');}
      for(const h of grp)h.civ.grp=grp;return grp.length;}
    // en una terraza tomando algo
    if(r<0.3&&hr>8&&hr<23.5){const free=TERR.filter(t=>t.seats.every(s=>!s.used)&&Math.hypot(t.x-p.x,t.z-p.z)>minR*0.6&&Math.hypot(t.x-p.x,t.z-p.z)<maxR);if(free.length){const t=pick(free);const n=RI(1,t.seats.length);let c=0;
        for(let j=0;j<n;j++){const s=t.seats[j];const kk=kerbNear(t.x,t.z,10);if(!kk)break;const h=civSpawnAt(kk);if(!h)break;civSit(h,s,'terr');h.civ.t=R(120,900);civItem(h,pick(['cup','beer','beer','cup',null]));c++;}if(c)return c;}}
    // sentado en un banco (leyendo el móvil, descansando)
    if(r>=0.3&&r<0.38){const fb=BENCHES.filter(b=>b.seats&&b.seats.some(q=>!q.used)&&Math.hypot(b.x-p.x,b.z-p.z)>minR*0.6&&Math.hypot(b.x-p.x,b.z-p.z)<maxR);if(fb.length){const b=pick(fb);const q=b.seats.find(q=>!q.used);const kk=kerbNear(b.x,b.z,10);if(kk){const h=civSpawnAt(kk,{});if(h){civSit(h,q,'bench');if(Math.random()<0.5)civItem(h,'phone');return 1;}}}}
    const jog=r>=0.36&&r<0.42&&!night;const h=civSpawnAt(k,jog&&Math.random()<0.75?{kind:'sport'}:{});if(!h)return 0;const c=h.civ;
    if(jog){c.r='correr';c.spd=R(2.5,3.2);c.lane=R(0.9,1.6);}
    else if(r<0.5){c.r='basura';civItem(h,'trash');}
    else if(r<0.62&&!night){civItem(h,'bag');}
    else if(r<0.7)civItem(h,'phone');
    if(c.r==='paseo'&&Math.random()<0.15)c.spd*=0.75;// gente mayor, sin prisa
    return 1;}
  return 0;}
function civSit(h,s,kind){s.used=h;h.civ.st='sit';h.civ.seat=s;h.civ.sk=kind;h.x=s.x;h.z=s.z;h.yaw=s.yaw;h.act='seat';h.seatH=s.y-H(s.x,s.z);h.speed=0;h.vx=h.vz=0;}
function civStand(h){const c=h.civ;if(c.seat){c.seat.used=null;c.seat=null;}h.act='stand';h.soc=null;c.st='walk';const k=kerbNear(h.x,h.z,12);if(k){c.ch=k.ch;c.i=k.i;}c.t=0;c.cool=R(20,60);}
function managePopLC(p,first){if(!CIV.ready)return;CIV.popT-=frameDt;if(CIV.popT>0&&!first)return;CIV.popT=first?0:1.5;let n=0;
  for(const h of H_){if(!h.active||h.type!=='civil')continue;const d=Math.hypot(h.x-p.x,h.z-p.z);
    if((d>125&&!h.holder.visible)||d>170){if(h.civ&&h.civ.seat)h.civ.seat.used=null;civItem(h,null);despawn(h);continue;}n++;}
  const want=Math.round(CIV_MAX*hourDensity());let budget=first?want:2;
  while(n<want&&budget>0){const k=civSpawnNear(p,first?4:45,first?95:115,first);if(!k)break;n+=k;budget--;}}
// ---------- IA de cada vecino ----------
function civilAI(h,dt,p){const c=h.civ;if(!c)return;c.t+=dt;
  if(h.mode==='phys'&&(h.k<0.6||h.down>0||h.act==='getup')){h.speed*=0.85;return;}
  if(h.inside>0){h.inside-=dt;h.holder.visible=false;if(h.inside<=0){h.holder.visible=true;h.x=c.door.x;h.z=c.door.z;h.yaw=Math.atan2(c.door.nx,c.door.nz);if(Math.random()<0.7)civItem(h,'bag');c.st='walk';c.cool=R(30,90);}return;}
  // si le pegas o le apuntas, huye
  if(h.angry||h.scared>0){if(h.civ.seat)civStand(h);h.scared=Math.max(h.scared||0,h.angry?8:0)-dt;h.angry=false;h.act='stand';h.soc=null;moveH(h,h.x-p.x,h.z-p.z,4.2,dt);if(h.scared<=0){h.scared=0;civStand(h);}return;}
  if(c.st==='sit'){h.speed=0;h.vx=h.vz=0;h.x=c.seat.x;h.z=c.seat.z;h.yaw=c.seat.yaw;h.act='seat';
    // en la terraza beben, hablan y se ríen; en el banco miran el móvil o descansan
    c.socT=(c.socT||0)-dt;if(c.socT<=0){c.socT=R(3,9);const r=Math.random();h.soc=c.sk==='terr'?(r<0.35?'drink':r<0.65?'talk':r<0.8?'laugh':null):(h.itemK==='phone'?(r<0.7?'phone_look':null):(r<0.2?'phone_look':null));if(h.soc==='phone_look'&&!h.item)civItem(h,'phone');}
    if(c.t>(c.sk==='terr'?c.t0||(c.t0=R(240,1200)):c.t0||(c.t0=R(60,400)))){c.t0=0;civStand(h);}return;}
  if(c.st==='chat'){h.speed*=0.8;h.vx=h.vz=0;h.act='stand';faceTo(h,c.cx,c.cz,dt);c.socT=(c.socT||0)-dt;
    if(c.socT<=0){c.socT=R(2.5,7);const r=Math.random();h.soc=r<0.45?'talk':r<0.62?'laugh':r<0.8?'cross':(h.itemK==='cup'?'drink':null);}
    c.t-=dt;if(c.t<=0){for(const o of (c.grp||[h])){if(o.civ&&o.civ.st==='chat'){o.civ.st='walk';o.soc=null;o.civ.dir=Math.random()<0.5?1:-1;}}}return;}
  if(c.st==='act'){h.speed*=0.7;h.vx=h.vz=0;h.act='stand';faceTo(h,c.fx,c.fz,dt);c.t2-=dt;if(c.t2<=0){if(c.soc==='throw'){civItem(h,null);c.r='paseo';}h.soc=null;c.st='walk';c.cool=R(15,40);}return;}
  if(civCrossAI(h,dt))return;
  if(c.st==='go'){const dx=c.gx-h.x,dz=c.gz-h.z,d=Math.hypot(dx,dz);if(d>0.45){h.act='stand';moveH(h,dx,dz,c.spd*0.9,dt);if(c.t>40){c.st='walk';}return;}
    const f=c.goal;c.goal=null;c.t=0;
    if(f.t==='shop'){h.inside=R(20,110);c.door={x:h.x,z:h.z,nx:f.o.nx,nz:f.o.nz};c.st='inside';return;}
    if(f.t==='bench'||f.t==='terr'){if(f.seat.used){c.st='walk';return;}civSit(h,f.seat,f.t);if(f.t==='terr'&&!h.item)civItem(h,pick(['cup','beer']));return;}
    if(f.t==='cont'){c.st='act';c.soc='throw';h.soc='throw';h.socT0=clockT;c.t2=1.6;c.fx=f.o.cx;c.fz=f.o.cz;sfx('click',volAt(h.x,h.z,10)*0.4);return;}
    if(f.t==='window'){c.st='act';c.soc='look';h.soc=Math.random()<0.5?'cross':null;c.t2=R(3,9);c.fx=f.fx;c.fz=f.fz;return;}
    c.st='walk';return;}
  // caminar por la acera
  const run=c.r==='correr';h.soc=(h.itemK==='phone'&&!run&&Math.sin(clockT*0.13+h.slot)>0.3)?'phone':null;
  const k=chainPt(c.ch,c.i,c.lane,_cpt);const dx=_cpt.x-h.x,dz=_cpt.z-h.z,d=Math.hypot(dx,dz);
  if(d<(run?1.4:1.0)){c.i+=c.dir;const n=c.ch.pts.length;if(!c.ch.loop&&(c.i<=0||c.i>=n-1)){c.i=clamp(c.i,0,n-1);c.dir*=-1;}
    const kk=c.ch.pts[((c.i%n)+n)%n];c.cool-=1;
    // cruzar por el paso de peatones
    if(kk.cwd<1.6&&Math.random()<(run?0.25:0.4)&&c.cool<=0){const px=kk.x+kk.nx*(kk.W+0.7),pz=kk.z+kk.nz*(kk.W+0.7);const o=kerbNear(px,pz,3.5,q=>q.ch!==c.ch);
      if(o){c.cross=o;c.st='wait';c.t2=kk.trav?R(4,18):R(0.5,4);c.cool=8;return;}}
    // aprovechar lo que hay cerca
    if(kk.feat&&c.cool<=0&&!run)for(const f of kk.feat){
      if(f.t==='cont'&&c.r==='basura'){c.goal=f;c.gx=f.o.x;c.gz=f.o.z;c.st='go';c.t=0;break;}
      if(f.t==='bench'&&Math.random()<0.18){const s=f.o.seats&&f.o.seats.find(s=>!s.used);if(s){c.goal={t:'bench',seat:s};c.gx=s.x+Math.sin(s.yaw)*0.45;c.gz=s.z+Math.cos(s.yaw)*0.45;c.st='go';c.t=0;break;}}
      if(f.t==='terr'&&Math.random()<0.12&&hourF()>8){const s=f.o.seats.find(s=>!s.used);if(s){c.goal={t:'terr',seat:s};c.gx=s.x;c.gz=s.z;c.st='go';c.t=0;break;}}
      if(f.t==='shop'&&Math.random()<(h.itemK==='bag'?0.05:0.14)&&hourF()>8.5&&hourF()<21){c.goal=f;c.gx=f.o.x;c.gz=f.o.z;c.st='go';c.t=0;break;}
      if(f.t==='shop'&&Math.random()<0.08){c.goal={t:'window',fx:f.o.x-f.o.nx*3,fz:f.o.z-f.o.nz*3};c.gx=f.o.x+f.o.nx*0.6;c.gz=f.o.z+f.o.nz*0.6;c.st='go';c.t=0;break;}}
    return;}
  h.act='stand';moveH(h,dx,dz,c.spd,dt);}
// esperar al semáforo y cruzar
function civCrossAI(h,dt){const c=h.civ;if(c.st==='wait'){h.speed*=0.8;h.vx=h.vz=0;h.act='stand';faceTo(h,c.cross.x,c.cross.z,dt);c.t2-=dt;if(c.t2<=0)c.st='crossing';return true;}
  if(c.st==='crossing'){const o=c.cross;const dx=o.x-o.nx*0.6-h.x,dz=o.z-o.nz*0.6-h.z,d=Math.hypot(dx,dz);if(d<0.8||c.t>40){c.ch=o.ch;c.i=o.i;c.dir=Math.random()<0.5?1:-1;c.st='walk';c.cross=null;c.t=0;return true;}
    h.act='stand';moveH(h,dx,dz,c.spd*(c.r==='correr'?1:1.12),dt);return true;}
  return false;}
function civTalk(h){h.soc='talk';h.civ.socT=3;if(h.civ.st==='walk'){h.civ.st='act';h.civ.t2=3;h.civ.fx=camW.x;h.civ.fz=camW.z;h.civ.soc='talk';}toast(`${h.name}: «${pick(CIV_LINES)}»`,4);}
