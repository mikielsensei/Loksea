# Loksea — estado y pendientes (para continuar con cualquier modelo)

Juego: https://mikielsensei.github.io/Loksea/ · código en `src/*.js`, se une con `python3 build.py` en `game.js`.
Tras cada cambio: subir el número de `game.js?v=5&b=N` en `index.html`, `node --check game.js`, commit y push a `main`.


## TUS PETICIONES (escribe aquí lo que quieras; lo leo antes de empezar cada tanda)
- 

## Hecho en v5 (16-nov)
- Personajes realistas (Rocketbox, `assets/models/p_*.glb`); zombis sin armas, piel cadavérica, sangre en boca y manos (`charMat` en `40_chars.js`).
- Ragdoll con tono muscular (`MINC`, `h.rig`): caen estirados, no plegados.
- Mangas hombro-codo-muñeca que se estiran (`setupSleeves` en `50_player.js`).
- Agacharse baja la vista (`P.crouchOff`); persianas a medias con colisión arriba.
- Mando frenado contra lo sólido (rayo pecho→mano en `updateHands`); tocar NPC los desplaza.
- HUD flotante sobre la mano izquierda (`placeHud`), se apaga con el joystick izquierdo.
- Mobiliario rehecho en `20_props.js`: contenedores grises con franja de color, Bicing rojo, banco de listones, pilona C-42P, semáforo amarillo, marquesina TMB, papelera, fuente, jardinera, alcorque circular; materiales con foto de detalle (`detMat`).
- Menos parpadeo a distancia (near 0.07, polygonOffset, alphaToCoverage, foveation 0.5).

## Hecho en v6 (17-nov, Opus)
- Heridas pintadas sobre la malla (uniform `uW` por personaje, `addWound` con raycast); gotas de sangre (`spray`), charco nítido que no flota en bordillos.
- Ragdoll: rodillas bisagra, `segSep` (miembros no se atraviesan), `sepBodies` (cuerpos entre sí).
- Recolocar altura y vista: mantener joystick izquierdo o V (`recenter`).
- Flechas de carril macizas (`arrowPaint`), pintura limpia, señales en el xamfrà (`signOn`), semáforos orientados al tráfico, placas de mármol en el pilar del xamfrà.
- Coche nuevo (`CARGEO` lofted, lunas, interior con relojes), física con agarre, derrape, balanceo y cabeceo (`moveCar`), volante que se agarra con los grips (`steerByHands`); en VR se baja con A.
- Manzanas a escala real: `BP=133.3` (113,3 m de manzana + 20 m de calle).
- Comercios reales de OpenStreetMap (`src/33_pois.js`, ~850 puntos, convertidos con la cuadrícula real de cruces); `realShop` asigna a cada local el comercio más cercano y `poiSign` le hace el rótulo (marcas con sus colores, resto con 16 estilos). Atlas de rótulos 8x32 (256 celdas).
- Mobiliario instanciado por zonas (no global): de 1,75 M a ~0,75 M triángulos.

## Hecho en v7 (17-nov, Opus)
- Coche de la comunidad (CC0, kaytomasu A02 City → `assets/models/car_panda.glb`) con desgaste (`wearMat`), interior que se monta al subir (`carInterior`), matrículas (`plateGeo`).
- Volante corregido; manos pegadas al volante/palanca (`handsOnControls`); cambio en H (`shiftByHand`); B = modo disparo en el coche.
- Atropellos: colisión cuerpo-coche (`carBodies` en `40_chars.js`). Heridas que sangran (`bleeds`), moratones con abolladura para el bate (`HITKIND='blunt'`).
- Ajustes: giro suave/saltos, distancia de visión, bruma.
- Ciudad abandonada (`37_decay.js`), coches siniestrados (`placeWrecks`), cadáveres (`placeCorpses`), motos.
- Báculos (`semaforBR/BL`), placas de dirección (`stPlate`), mupis, interiores por tipo, fachadas gastadas (`weatherMat`), calles pacificadas con rampa y embornales.

## Hecho en v8 (17-nov, Opus)
- Manos con piel de las fotos del usuario (`assets/tex/skin_back.jpg`, `skin_palm.jpg`, `skinMat` triplanar).
- Filtros de color en el tonemapping (`CustomToneMapping`, exposición codifica el filtro), nubes (`clouds`, cúpula con fbm), bruma hasta «muy densa».
- Goteo de heridas según la gravedad (`updateWoundGravity`, `uWD`) y hundimiento en el impacto de bala.
- Basura: cajas, bolsas, ropa, maletas, colchones, ramas, troncos caídos, contenedores quemados y volcados; 32 cadáveres.
- Motos: 3 modelos (`moto`, `motoN`, `motoX`) desordenadas o tiradas; se levantan y las que arrancan se conducen (`makeMoto`, manillar con dos grips).
- Volante moderno y bien colocado; interior con pantalla, rejillas y fuelle.

## Pendiente (por orden)
1. Probar en las Quest lo anterior (no verificado en el visor): manos contra paredes, agarre de puertas con grip, agacharse, HUD.
2. Carriles y flechas reales desde OpenStreetMap (`turn:lanes`, `lanes`, `psv:lanes` ya están en `w/osm/ways.json`).
2b. Furgonetas tipo Berlingo/Kangoo y más modelos de coche.
2d. Escaparates reales de cada local (Maps/Street View).
2c. Cruce Casanova-Aragó idéntico (gasolinera Cepsa con Carrefour Express en la esquina, carril bici).
3. Bicing montable (manillar con los dos grips).
4. Señales del suelo de Barcelona (flechas macizas, pintura limpia): `arrowPaint`, `texPaint` en `30_streets.js`.
5. Rótulos con más variedad y tipografías; placas de calle de mármol en la pared; escaparates y bares por dentro; mercado tipo Boqueria.
6. Balcones con más variedad (`32_facades.js`).
7. Armas solo donde toca (comisarías, coches de policía, bandidos); mejor pistola y rifle (Poly Haven `service_pistol`, `bolt_action_rifle_7_62`).
8. Rutinas de NPC más claras.
9. Supermercados reales en su sitio (ahora los grandes súper siguen en `SUPERPLAN` aleatorio); interiores de bar; balcones; armas en su sitio.
10. Ampliar el mapa a más barrios (la cuadrícula real ya está calculada en `w/osm/grid.json`).

## Hecho en v8.3-v8.4 (17-nov, Opus)
- Noche: niebla negra (`cHazeN`), estrellas con halo de colores y tamaños variados (`starMat`), luna con halo, humo de algunas casas (`setupSmoke`/`stepSmoke` en `37_decay.js`).
- Coche: cristal sucio/rayado con arcos de limpiaparabrisas (`dirtyGlass`), escobillas y retrovisores.
- ARREGLADO: "puerta invisible" del Ninot = las cajas de colisión de las parcelas (`box()` en `buildSideLot`) estaban giradas 90°. Ahora usan `atan2(nx,nz)`.
- Nueva columna de manzanas: C. de Villarroel (`NXS=7`, `SX0=-3.5*BP`). Los POIS siguen con i relativo a Casanova (`x=SX0+(i+1)*BP`) y se añadieron 36 comercios reales entre Villarroel y Casanova.
- El Mercat del Ninot pasa a su manzana real (Villarroel-Casanova / Provença-Mallorca, fachada a Mallorca): `BASEPLAN` bi:0,bj:0,side:2.

## EN CURSO (seguir aquí)
1. (HECHO v8.6, falta pulir con fotos del usuario: figura del ninot, interior más sucio, sangre, toldos exteriores) `src/38_ninot.js`: mercado real. Edificio exento en la mitad Mallorca de la manzana (74 m x 48 m), 7 naves (central 20 m, alero 11,5 / cumbrera 16,5; 3 laterales de 9 m cada lado, más bajas), naves con cumbrera perpendicular a Mallorca. Fachadas de la nave central (Mallorca y pasaje interior) de ladrillo visto con un enorme vitral en arco (ancho 14, arranque 7,5); laterales con lamas metálicas perforadas blancas (Mateo 2015) y persianas de paradas exteriores abajo. Dos patios a los lados accesibles desde los xamfrans; pasaje interior detrás. Dentro: estructura metálica verde, paradas en dos ejes ortogonales (islas de 7x8 m con 4 paradas, pasillo central de 5 m, vestíbulo de 9 m en Mallorca con el campamento), todo sucio y abandonado. Nombres reales de paradas/bares dentro: Barra Perelló 1898, La Bikineria, Tierra, Cuina El Ninot (excluidos de POIS). En `buildBlock`: saltar lado 2 y esquinas S-E/S-W de esa manzana y recortar lados 1 y 3 en zcut=z1-56. `buildBases`: para kind 'mercat' usar el edificio nuevo, gate en la acera de Mallorca.
2. Atlas de rótulos ampliado a 16x32 celdas de 256x64 (512) pero se vuelve a llenar: los locales genéricos deberían reutilizar celdas (solo nombre único por POI real).
3. (HECHO v8.5: balanceo ~3° a 0,8 g, amortiguado y con eje a 0,55 m) Coches: balanceo exagerado (se levantan al mínimo giro) → reducir roll/pitch y que dependa de la velocidad, más peso (GTA IV). Peso y gravedad en todo (zombis, mobiliario) pensando en coger y lanzar objetos.
4. (v8.5: fusil de corredera CC0 'Lightning' de OpenGameArt en `assets/models/rifle.glb`, texturas 512) Armas largas de NPC/zombis "dos rectángulos": modelar fusil/escopeta decentes. Pistola coherente con las manos nuevas.
5. (HECHO v8.7) Texturas fotográficas en mangas (algodón Poly Haven a juego con la camisa) y microdetalle de tejido en la ropa. Falta comprobar en VR.
6. (HECHO v8.8 `buildMoeve` en 38_ninot.js: marquesina, 2 surtidores, tótem de precios) Gasolinera Moeve (antes Cepsa) y Carrefour Express en Casanova-Aragó (lado Villarroel, ahora jugable: POI i≈-0.05, j≈3.15).
7. Rótulos/escaparates realistas: banderolas (cruz verde farmacia, T estanco), letras 3D, marcos por tipo.
8. (v8.9-v9.4) Motos rehechas y caídas con restos; furgonetas tipo Kangoo/Berlingo (deformando el mismo modelo, `makeVanTpl`, 28% de los coches). Falta: coches quemados con más detalle, furgonetas de reparto grandes.
9. Semáforos en posiciones reales (OSM highway=traffic_signals) y modelo mejor; flechas de carril reales (turn:lanes en ways.json).
10. (v9.6-9.8) Machete con cortes y amputaciones (`trySever`), bares por dentro, balcones variados. Falta: NPC con rutinas; miembros amputados más realistas (ahora cilindros).

- Pistola: revisar en VR que la empuñadura encaje con las manos nuevas (no comprobado en render plano).
- (v9.3 `61_dyn.js`) Peso y gravedad: cajas, bolsas, maletas, cascos, carenados, palés, ramas y contenedores pasan a cuerpos con física al arrollarlos (impulso por masas), los ligeros se patean al andar, y en VR se cogen con la mano izquierda (o la derecha si vas sin arma) y se lanzan con la velocidad de la mano. Falta: que las balas los empujen, y coger con la mano real (no la muñeca).

## Hecho en v9.x-v10.5 (17-nov tarde, Opus)
- Motos rehechas (`scooterParts`, motoN, motoX), caídas con restos; furgonetas (`makeVanTpl`); coches quemados (hollín, llantas, mancha `scorch`, humo).
- Física de objetos (`61_dyn.js`): coches arrollan/empujan, patadas, coger y lanzar en VR, las balas los empujan (`dynShot`).
- Machete con amputaciones (`trySever`), bares completos, maniquíes, cajeros, banderolas, balcones x4, flechas de giro reales, rótulos 640 celdas.
- Manos: piel sin costuras con venas; mangas de algodón fotográfico; tejido real en la ropa.
- Rendimiento (v10.2-10.3): menos polígonos en props, culling por niebla de zonas y personajes, lo pequeño se corta antes (`SMALLI`).
- Sangre seca en aceras, locales y el Ninot; comidas en corro en las bases.

## Siguiente
- Semáforos en posiciones reales: Overpass caído al intentarlo (probar `maps.mail.ru` u `overpass-api.de` con node["highway"="traffic_signals"]).
- Menos draw calls (~470): agrupar instancias de varias zonas.
- Comprobar en las Quest: pistola en la mano, mangas, coger/lanzar, machete.
