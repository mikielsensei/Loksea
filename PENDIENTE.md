# Loksea — estado y pendientes (para continuar con cualquier modelo)

Juego: https://mikielsensei.github.io/Loksea/ · código en `src/*.js`, se une con `python3 build.py` en `game.js`.
Tras cada cambio: subir el número de `game.js?v=5&b=N` en `index.html`, `node --check game.js`, commit y push a `main`.

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

## Pendiente (por orden)
1. Probar en las Quest lo anterior (no verificado en el visor): manos contra paredes, agarre de puertas con grip, agacharse, HUD.
2. Carriles y flechas reales desde OpenStreetMap (`turn:lanes`, `lanes`, `psv:lanes` ya están en `w/osm/ways.json`).
2b. Manos con textura realista de piel (esperando fotos del usuario).
2c. Cruce Casanova-Aragó idéntico (gasolinera Cepsa con Carrefour Express en la esquina, carril bici).
3. Bicing montable (manillar con los dos grips).
4. Señales del suelo de Barcelona (flechas macizas, pintura limpia): `arrowPaint`, `texPaint` en `30_streets.js`.
5. Rótulos con más variedad y tipografías; placas de calle de mármol en la pared; escaparates y bares por dentro; mercado tipo Boqueria.
6. Balcones con más variedad (`32_facades.js`).
7. Armas solo donde toca (comisarías, coches de policía, bandidos); mejor pistola y rifle (Poly Haven `service_pistol`, `bolt_action_rifle_7_62`).
8. Rutinas de NPC más claras.
9. Supermercados reales en su sitio (ahora los grandes súper siguen en `SUPERPLAN` aleatorio); interiores de bar; balcones; armas en su sitio.
10. Ampliar el mapa a más barrios (la cuadrícula real ya está calculada en `w/osm/grid.json`).
