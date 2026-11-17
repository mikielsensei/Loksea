// =====================================================================
// CONSTRUCCIÓN DEL MUNDO Y MAPA
// =====================================================================
const MAPS=1.4;const mapC=document.createElement('canvas');mapC.width=Math.ceil((XMAX-XMIN+80)*MAPS);mapC.height=Math.ceil((ZMAX-ZMIN+80)*MAPS);
const mtx=x=>(x-XMIN+40)*MAPS,mtz=z=>(z-ZMIN+40)*MAPS;
function drawMap(){const g=mapC.getContext('2d');g.fillStyle='#3a3c40';g.fillRect(0,0,mapC.width,mapC.height);
  for(const b of BLOCKS){g.fillStyle='#8f8a82';g.beginPath();b.cp.forEach((p,k)=>k?g.lineTo(mtx(p[0]),mtz(p[1])):g.moveTo(mtx(p[0]),mtz(p[1])));g.closePath();g.fill();
    g.fillStyle=b.outer?'#55555a':'#6e6a66';g.beginPath();b.bp.forEach((p,k)=>k?g.lineTo(mtx(p[0]),mtz(p[1])):g.moveTo(mtx(p[0]),mtz(p[1])));g.closePath();g.fill();}
  g.fillStyle='#8f8a82';for(const P of MAPD.peds){g.beginPath();P.forEach((p,k)=>k?g.lineTo(mtx(p[0]),mtz(p[1])):g.moveTo(mtx(p[0]),mtz(p[1])));g.closePath();g.fill();}
  for(const s of MAPD.shops){g.fillStyle={super:'#ff7a3a',bar:'#f1c40f',restaurant:'#f1c40f',farmacia:'#2ecc71',forn:'#e8c090',ferre:'#b08060',fruteria:'#9be05a'}[s.type]||'#d0d0d0';g.fillRect(mtx(s.x)-3,mtz(s.z)-3,6,6);}
  for(const p of MAPD.pois){g.fillStyle={good:'#4cd964',bandit:'#ff4444'}[p.t]||'#fff';g.beginPath();g.arc(mtx(p.x),mtz(p.z),9,0,7);g.fill();}
  g.font='bold 15px sans-serif';g.fillStyle='rgba(255,255,255,.85)';g.textAlign='center';
  for(const s of VSTR){g.save();g.translate(mtx(s.pos),mtz(0));g.rotate(-Math.PI/2);g.fillText(s.n,0,5);g.restore();}
  for(const s of HSTR){g.fillText(s.n,mtx(SX0+BP*0.5),mtz(s.pos)+5);}}
let worldBuilt=false;
function buildWorld(){if(worldBuilt)return;worldBuilt=true;const t0=performance.now();
  planSupers();buildStreets();
  for(const bk of BLOCKS)buildBlock(bk);
  finishSigns();buildBases();decayWorld();buildChunks();buildInst();drawMap();
  console.log('mundo',(performance.now()-t0)|0,'ms',BLOCKS.length,'manzanas',shopCount,'locales',LOOT.length,'botín',DOORS.length,'puertas');}
