# Revisión adversarial de lotes L-F4/L-F5 y L-C3/L-C4/L-C5, y de `canine:skull` ampliado (2026-11-01)

Revisor: A7, agente de IA. Esta es una revisión de integridad documental y de licencias, **no** una revisión veterinaria humana. No valida anatomía: solo contrasta las fichas con las fuentes citadas. No se editaron datos ni código.

## Alcance y método

- Objeto: lotes sin fusionar `data/anatomy/_batches/{feline-L-F4,feline-L-F5,canine-L-C3,canine-L-C4,canine-L-C5}.json` y la entrada `canine:skull` de `canine-L-C1.json`. Son 46 fichas (3 + 14 + 7 + 13 + 8 + 1) y 3 relaciones (1 en L-F4, 2 en L-F5). Los lotes caninos no traen relaciones.
- Fuentes nuevas: kim-feline-lumbar-count-2026, covasa-lumbosacrocaudal-2024 (L-F4), tagliavia-persian-skull-2026, requicha-feline-orbit-ct-2026, delibas-van-cat-mandibular-canal-2026 y avdc-nomenclature (L-F5).
- Comprobación automática de los 6 lotes:
  - Todas las fichas tienen `review.status = "pending"`.
  - Ninguna ficha `kind: bone` lleva `origin`, `insertion` ni `action`.
  - Las 8 fichas musculares de L-C5 tienen 1–2 `fieldEvidence` cada una, todas en `detailedDescription`.
- Fuentes abiertas y leídas en esta revisión:
  - NAV 6.ª, copia local `nav6.txt`: grep del término y paso de «PDF PAGE N» a página impresa por la línea de subrayado.
  - Reighard & Jennings 1901 (Gutenberg pg58394, HTML, HTTP 200). Las páginas se tomaron de los anclajes `PageN`.
  - Sisson 1914 (texto djvu de Internet Archive, HTTP 200). Las páginas se identificaron por cabeceras impresas («184 SKELETON OF THE DOG», «FACE 193», «494 DIGESTIVE SYSTEM OF THE DOG», «373»…). **No abrí imágenes de página.**
  - Kim 2026 (PMC13280130), Covasa 2024 (PMC11148713), Tagliavia 2026 (PMC13359505), Requicha 2026 (PMC12784816) y Delibaş 2026 (PMC13663499): `fullTextXML` de Europe PMC, HTTP 200 en los cinco.
  - Página web de la AVDC (`avdc.org/avdc-nomenclature/`): una sola petición, HTTP 200.
- No obtuve ningún 401/403/500 y no repetí peticiones fallidas.
- Muestreo: 64 evidencias repartidas entre los 5 lotes y `canine:skull` (tabla 1). Fuera de la muestra leí además el texto de varios campos frente a las mismas páginas: de ahí salen algunos hallazgos, que se indican como tales.

## 1. Evidencias muestreadas

Veredictos:
- **CONFIRMADO**: la fuente dice lo afirmado en el localizador.
- **DÉBIL**: respaldo parcial, localizador impreciso o la ficha va más allá del texto.
- **INCORRECTO**: la fuente no lo dice o dice lo contrario.
- **NO VERIFICABLE**: no pude abrir el pasaje.

La columna # da el índice de la evidencia dentro de la ficha (orden de `fieldEvidence`).

### 1.1 L-F4 (felino)

| # | Estructura | Campo | Fuente | Localizador | Veredicto | Nota |
|---|---|---|---|---|---|---|
| 0 | feline:sternum | canonicalLatinName | NAV | OSTEOLOGIA p.18, Sternum | CONFIRMADO | Línea 2697, p.18. |
| 2 | feline:sternum | aliases | NAV | p.18 Sternebrae; nota 43 p.27 | CONFIRMADO | «introduced because the Sternebrae remain separate in some species». |
| 4 | feline:sternum | detailedDescription | R&J | pp.20–21, Fig. 16 | CONFIRMADO | Manubrio en daga, ≈1/5 de la longitud; «body consists of six cylindrical pieces»; xifoides; cartílagos 9.º y 10.º–12.º «if present». La ficha atribuye bien el seis a la obra. |
| 6 | feline:sternum | location | R&J | p.20 | CONFIRMADO | «ventral ends of the first nine ribs»; eje inclinado dorsocranealmente. |
| 8 | feline:sternum | landmarks | NAV | ARTHROLOGIA p.31 | CONFIRMADO | Synchondrosis manubriosternalis, Synchondroses intersternebrales y xiphosternalis, y Articulationes sternocostales en p.31. |
| 9 | feline:sternum | attachments | R&J | pp.139–153 | CONFIRMADO | Pectoral menor «lateral half of the first six divisions… sometimes from the xiphoid» (p.146); transverso del tórax «third to the eighth ribs» (p.151); xifohumeral (p.147); diafragma desde el xifoides (p.153). |
| 3 | feline:ribs | summary | R&J | p.18, II. Ribs | CONFIRMADO | «The cat has thirteen pairs of ribs». La ficha lo atribuye a la obra y añade la variación. |
| 4, 6 | feline:ribs | summary, detailedDescription | Kim 2026 | Results, Table 2 | CONFIRMADO | n=674: hipoplasia de la 13.ª 14 (2,1 %), aplasia 1 (0,1 %), L1 TLTV 59 (8,8 %); la hipoplasia es más frecuente en el grupo 6LV (P<0,001). |
| 5 | feline:ribs | detailedDescription | R&J | pp.18–19, Fig. 15 | CONFIRMADO | Costilla típica del 5.º par; longitud máxima en la 9.ª=10.ª; tubérculos ausentes en las 2–3 últimas; 9 verdaderas y 4 falsas. |
| 10 | feline:ribs | attachments | R&J | pp.140, 150–153 | CONFIRMADO | Esternohioideo desde el primer cartílago (p.140); intercostales (pp.150–151); diafragma en las 5 últimas y oblicuo externo en las 9–10 últimas (p.153). |
| 9 | feline:ribs | landmarks | NAV | p.18; ARTHROLOGIA p.31 | CONFIRMADO | Costae verae [sternales], spuriae [asternales], fluctuantes; Articulatio capitis costae y costotransversaria (p.31). |
| 3 | feline:sacrum | summary | R&J | p.8, Sacral Vertebræ | CONFIRMADO | «three sacral vertebræ are united in the adult»; la ficha lo atribuye a la obra. |
| 4 | feline:sacrum | detailedDescription | R&J | pp.8–11 | CONFIRMADO | Gatito, pirámide, «pseudo-transverse process», arco de unos 120°, dos pares de tubérculos y carilla auricular. |
| 5 | feline:sacrum | detailedDescription | Covasa 2024 | Results, Carnivores; Table 3 | CONFIRMADO | «In one cat… 8 lumbar vertebrae… L8… intensely sacralised. The other cat presented sacralisation of L7»; «three foramina existed instead of two»; sacro de 2 vértebras con la última sacra caudalizada. El rótulo de sección del artículo es «cats», no «Carnivores» (localizador aproximado). |
| 6 | feline:sacrum | detailedDescription | Kim 2026 | Table 2 | CONFIRMADO | LSTV (sacralización parcial de L7) 13/674 (1,9 %). |
| 10 | feline:sacrum | attachments | R&J | pp.86–87, Ligaments of the Pelvis | CONFIRMADO | Anfiartrosis, ligamento iliosacro lateral y banda desde el borde dorsal del ilion (p.87). |
| 11 | feline:sacrum | speciesDifferences | Covasa 2024 | Table 2 (Ferat-Postolache 2021) | CONFIRMADO | Gato y perro 3; conejo y oveja 4; bovino y caballo 5; cerdo 5 (4). La ficha cita bien la fuente secundaria. |
| 9 | feline:sacrum | landmarks | NAV | pp.17–18; ARTHROLOGIA p.33 | CONFIRMADO | Os sacrum [Vertebrae sacrales] p.17; Lineae transversae p.18. |

### 1.2 L-F5 (felino, cabeza)

| # | Estructura | Campo | Fuente | Localizador | Veredicto | Nota |
|---|---|---|---|---|---|---|
| 0 | feline:skull | canonicalLatinName | NAV | OSTEOLOGIA p.11, Cranium | CONFIRMADO | Encabezado «CRANIUM» del esqueleto axial en p.11 (línea 1965). |
| 4 | feline:skull | detailedDescription | R&J | pp.21–22 | CONFIRMADO | Tres anillos y «eleven separate bones» craneales. La ficha atribuye el recuento a la obra. |
| 5 | feline:skull | detailedDescription | R&J | pp.49–51, Fig. 39 | CONFIRMADO | Cresta sagital: «in kittens it does not exist»; en un gato muy viejo llega al borde craneal de los parietales. |
| 6 | feline:skull | detailedDescription | R&J | pp.54–58 | CONFIRMADO | Foramen yugular para los nervios IX–XI (pp.54–56); tentorio «formed by the two parietals» (pp.57–58). |
| 7 | feline:skull | detailedDescription | Tagliavia 2026 | Abstract | CONFIRMADO | 15 cráneos (10 persas, 5 domésticos de pelo corto): cráneo redondeado, cara reducida, desviación del eje, prognatismo y maloclusión en la mayoría. La ficha rotula la muestra y la raza. |
| 9 | feline:skull | morphology | Requicha 2026 | Abstract | CONFIRMADO | 24 European Shorthair: 88,06 ± 3,16 (H) y 94,54 ± 4,52 (M). La muestra está rotulada. La ficha no dice que eran gatos castrados de 4–17 años (detalle menor). |
| 3 | feline:mandible | summary | R&J | p.47, Figs. 36–37 | CONFIRMADO | Dos mitades, sínfisis y articulación en la fosa mandibular. |
| 4 | feline:mandible | detailedDescription | R&J | pp.47–48 | CONFIRMADO | Foramen mentoniano «(or sometimes two)», fosa coronoidea/masetérica, foramen mandibular, proceso angular romo; leyenda: 3 incisivos, canino, 2 premolares, molar. |
| 5 | feline:mandible | detailedDescription | AVDC | Jaw anatomy | DÉBIL | La página es una lista terminológica: «Rostral, middle or caudal mental foramina in the dog and cat». Nombra los tres términos; no afirma que existan siempre los tres. La ficha dice «hay forámenes… rostral, medio y caudal» (ver N2). |
| 6 | feline:mandible | detailedDescription | Delibaş 2026 | Abstract | CONFIRMADO | 14 gatos Van (7+7, 4 años): sin diferencias entre lados; Bh mayor en machos; lingual en la región molar y vestibular en la premolar. Muestra rotulada. |
| 12 | feline:mandible | attachments | R&J | pp.107–112 | CONFIRMADO | Digástrico «ventral border… craneal al borde caudal del molar» (p.108); pterigoideo externo entre el foramen mandibular y la base del proceso angular; interno en la cara medial del proceso angular (p.111). |
| 13 | feline:mandible | attachments | R&J | p.113; pp.61–62 | CONFIRMADO | Geniohioideo «inner surface… one millimeter from the symphysis»; ligamento estilomandibular (p.62). |
| 14 | feline:mandible | speciesDifferences | R&J | p.61 | CONFIRMADO | «In man the two halves… united… In the cat… separate… thin interarticular cartilage». |
| 10 | feline:mandible | landmarks | NAV | ARTHROLOGIA p.31; nota 3 p.36 | CONFIRMADO | Articulatio intermandibularis (p.31) y su nota 3 (p.36). |
| 3 | feline:teeth | summary | R&J | p.224 | CONFIRMADO | **Fórmula felina:** «The adult cat has thirty teeth, fourteen in the lower jaw and sixteen in the upper»; i3/3 c1/1 pm3/2 m1/1. Atribuida a la obra, sin presentarla como universal. |
| 4 | feline:teeth | detailedDescription | R&J | pp.224–226 | CONFIRMADO | Incisivos tricúspides; canino superior laterocaudal al inferior; «At birth the cat has no teeth… twenty-six». |
| 5 | feline:teeth | detailedDescription | AVDC | Triadan; Normal Occlusion in a Cat | CONFIRMADO | «first premolar… feline left maxilla is numbered 206… lower right premolars are 407 and 408»; oclusión felina parafraseada, sin copia extensa. |
| 9 | feline:teeth | speciesDifferences | AVDC | Normal Occlusion in a Cat | CONFIRMADO | «Normal occlusion in cats is similar to dogs». |
| 8 | feline:teeth | landmarks | NAV | SPLANCHNOLOGIA p.50 | CONFIRMADO / DÉBIL | Dentes, Cervix dentis, Diastema, Dentes decidui y Dens sectorius (Car) en p.50. NAV escribe «Cuspis [coronae] dentis», no «Cuspis dentis» (grafía abreviada). |
| 4 | feline:occipital | detailedDescription | R&J | pp.22–25 | CONFIRMADO | Cuatro piezas en el gatito, «completely united» en el adulto. |
| 5 | feline:occipital | detailedDescription | R&J | p.58 | CONFIRMADO | «The condyloid canal varies greatly in size in different specimens». |
| 8 | feline:occipital | landmarks | NAV | p.12; nota 14 p.25 | CONFIRMADO | Crista nuchae «sharp crest found in Carnivora». La correspondencia con «lambdoidal ridge» queda bien rotulada como pendiente. |
| 11 | feline:occipital | attachments | R&J | pp.107, 113, 140; p.18 | CONFIRMADO (parcial) | Comprobados el yugulohioideo (p.113, «ventral border of the jugular process») y los ligamentos alares (p.18). El digástrico (p.107) y el esternomastoideo (p.140) no los comprobé línea a línea. |
| 5 | feline:temporal | detailedDescription | NAV | nota 22 p.26 | CONFIRMADO | «Pars endotympanica… present in the cat… Septum bullae… formed by the Pars tympanica as well as by the Pars endotympanica». |
| 10 | feline:temporal | speciesDifferences | R&J | p.32 | CONFIRMADO | «Unlike the tympanic of most other mammals it is developed from two bones». |
| 5 | feline:maxilla | detailedDescription | NAV | nota 7 p.24 | CONFIRMADO | «In Carnivora there is no Sinus maxillaris… Recessus». |
| 6 | feline:maxilla | detailedDescription | Requicha 2026 | Abstract | CONFIRMADO | Conducto infraorbitario 5,02 ± 0,42 (H) y 5,46 ± 0,46 (M). La media global de 5,23 ± 0,49 figura en el «Simple Summary». |
| 10 | feline:maxilla | speciesDifferences | NAV | nota 30 p.26; nota 7 p.24 | CONFIRMADO | Gato y, en menor medida, caballo; en el perro, «also by the Os lacrimale». |
| 9 | feline:basisphenoid | speciesDifferences | NAV | nota 18 p.25 | CONFIRMADO | Fusión temprana en el hombre; entre los domésticos, solo en el cerdo. |
| 10 | feline:basisphenoid | speciesDifferences | R&J | p.25 | CONFIRMADO | «represented in the cat by two entirely distinct bones». |
| 4 | feline:basisphenoid | detailedDescription | R&J | pp.25–28; p.54 | CONFIRMADO | «foramen ovale… third division of the fifth nerve; … rotundum… second division» (p.54). |
| 3 | feline:presphenoid | summary | R&J | p.29 | CONFIRMADO | Tres piezas en el gato joven. El rótulo «(the basisphenoid)» de p.29 está bien señalado como probable errata. |
| 7 | feline:nasal | landmarks | NAV | nota 29 p.26 | CONFIRMADO | La Crista ethmoidalis continúa sobre el Os nasale en los mamíferos domésticos. |
| 4 | feline:parietal | detailedDescription | R&J | pp.36–37; pp.57–58 | CONFIRMADO | Tentorio formado por los parietales. NAV tiene Processus tentoricus (p.12); la correspondencia está rotulada como pendiente. |
| 2 | feline:zygomatic | aliases | R&J | p.47 | CONFIRMADO | «Malar Bone. Jugal Bone. Os zygomaticum». |
| 4 | feline:zygomatic | detailedDescription | R&J | p.47, Fig. 35 | CONFIRMADO | Cresta para el masetero, procesos frontal y cigomático, ligamento orbitario. |
| 3 | feline:hyoid-apparatus | summary | R&J | p.49, Fig. 38 | CONFIRMADO | Cuerpo y astas; craneal de 4 piezas (timpanohioideo incluido en la bulla) y caudal de 1 (tirohioideo). |
| 0 | feline:hyoid-apparatus | canonicalLatinName | NAV | p.17; nota 36 | CONFIRMADO | La nota 36 está en p.26 (PDF 44). La observación de las notas sobre [Cornu minus] = Ceratohyoideum (línea 2573) es correcta. |
| 9 | feline:hyoid-apparatus | attachments | R&J | pp.113, 140 | CONFIRMADO | Estilohioideo «middle of the ventral surface of the body»; esternohioideo «outer half of the ventral surface» (p.140); geniohioideo «lateral half» (p.113). |

### 1.3 L-C3, L-C4, L-C5 y `canine:skull` (perro; Sisson 1914 salvo indicación)

| # | Estructura | Campo | Fuente | Localizador | Veredicto | Nota |
|---|---|---|---|---|---|---|
| 3 | canine:atlas | summary | Sisson | p.184 | CONFIRMADO | «wings are wide, flattened, and almost horizontal… alar notch… instead of the alar foramen». |
| 4 | canine:atlas | summary | NAV | p.17, Incisura alaris (Car) | CONFIRMADO | Término marcado (Car), línea 2618. |
| 6 | canine:atlas | detailedDescription | NAV | nota 37 p.27 | CONFIRMADO | «Arcus ventralis… represents a small part of the body of the atlas». |
| 4 | canine:axis | detailedDescription | Sisson | pp.184–186 | CONFIRMADO | Diente «reaching almost to the occipital bone»; espinosa que «overhang[s] the dorsal arch of the atlas»; «anterior notches… never converted into foramina». |
| 3 | canine:cervical-vertebra-7 | summary | Sisson | p.184 | CONFIRMADO | Cita literal exacta. |
| 5 | canine:cervical-vertebra-7 | detailedDescription | Sisson | Fig. 202, p.186 | CONFIRMADO | Leyenda «2, costal facet». |
| 4 | canine:cervical-vertebra-6 | detailedDescription | Sisson | p.184 | CONFIRMADO | Lámina cuadrilátera ventrolateral y parte corta y roma. NAV tiene Lamina ventralis [vertebrae cervicalis VI] (p.17); la correspondencia está bien rotulada como editorial. |
| 3 | canine:sacrum | summary | Sisson | p.187 | CONFIRMADO / DÉBIL | Cita correcta, pero el resumen da «tres vértebras» sin atribuirlas a Sisson, mientras que la ficha felina sí lo hace. Ver N4. |
| 5 | canine:sacrum | detailedDescription | Sisson | p.188, Curves y Variations | CONFIRMADO | «sacral promontory is well marked»; «first coccygeal sometimes unites with the sacrum». |
| 3 | canine:sternum | summary | Sisson | p.188 | CONFIRMADO | «eight sternebrae, which fuse only in exceptional cases and in extreme old age». Atribuido a Sisson y sin presentarse como universal. |
| 5 | canine:sternum | detailedDescription | NAV | nota 43 p.27 | CONFIRMADO | |
| 3 | canine:ribs | summary | Sisson | p.188 | CONFIRMADO | «Thirteen pairs… nine are sternal and four asternal… strongly curved, narrow, and thick». Atribuido. |
| 5 | canine:ribs | detailedDescription | Sisson | p.186 | CONFIRMADO | Carillas de las cabezas «absent on the last three or four»; carillas tuberculares grandes y cóncavas cranealmente. |
| 6 | canine:ribs | detailedDescription | Sisson | p.188, Variations | CONFIRMADO | «thoracic vertebrae may be twelve or fourteen». |
| 3 | canine:occipital | summary | Sisson | p.188 | CONFIRMADO | «nuchal crest is prominent, angular, and directed backward». |
| 6 | canine:occipital | detailedDescription | Sisson | p.189 | CONFIRMADO | «interparietal bone fuses with the occipital before birth… central part of the tentorium osseum». |
| 8 | canine:occipital | attachments | Sisson | p.188 | CONFIRMADO | Sisson no nombra los músculos y la ficha lo dice. |
| 3 | canine:temporal | summary | Sisson | pp.189–190 | CONFIRMADO | «The parts of the temporal bone fuse early» (p.189); bulla «very large… rounded and smooth» (p.190). |
| 3 | canine:maxilla | summary | Sisson | p.191 | CONFIRMADO | «short, but very high posteriorly. The facial crest is absent». |
| 4 | canine:maxilla | detailedDescription | Sisson | pp.191–193 | CONFIRMADO | Alvéolos del canino completados por el premaxilar, 1.er premolar pequeño, 4.º y 5.º con tres partes, conducto infraorbitario corto. |
| 6 | canine:maxilla | landmarks | NAV | pp.15–16 | **INCORRECTO (parcial)** | El landmark «Sinus maxillaris — seno maxilar» contradice la nota 7 de NAV (p.24): «In Carnivora there is no Sinus maxillaris enclosed in the Maxilla; the Recessus…». Sisson (p.197) tampoco lo trata como seno verdadero: «rather a recess than a true sinus». Ver B2. |
| 4 | canine:incisive | detailedDescription | Sisson | p.193 | CONFIRMADO | Tres alvéolos crecientes; «foramen incisivum is very small except in large skulls». |
| 4 | canine:zygomatic | summary | Sisson | p.194 | CONFIRMADO | «The large zygomatic process constitutes the bulk of the malar bone». |
| 3 | canine:mandible | summary | Sisson | p.194 | CONFIRMADO | «do not fuse completely even in old age… permanent symphysis». |
| 4 | canine:mandible | detailedDescription | Sisson | pp.194–195 | CONFIRMADO | Siete alvéolos yugales, «two or three mental foramina», cóndilo bajo, proceso coronoides extenso. |
| 5 | canine:mandible | detailedDescription | Sisson | p.196 | CONFIRMADO | Divergencia de 25–30°. |
| 4 | canine:hyoid-apparatus | detailedDescription | Sisson | p.195 | CONFIRMADO | «no lingual process»; astas tiroideas, pequeñas, medias y grandes. La advertencia sobre «great cornua» ≠ Cornu majus es pertinente. |
| 0 | canine:supraspinatus | detailedDescription | Sisson | p.371 | CONFIRMADO | Cita literal exacta. |
| 0 | canine:infraspinatus | detailedDescription | Sisson | p.371 | CONFIRMADO | «bipennate… groove on the lateral tuberosity… large bursa». |
| 0 | canine:teres-major | detailedDescription | Sisson | p.371 | CONFIRMADO | «thick… upper part of the posterior border… and on the subscapularis… tuberositas teres… common tendon with the latissimus dorsi». |
| 0 | canine:biceps-brachii | detailedDescription | Sisson | p.372 | CONFIRMADO | «one branch… rough mark on the lateral surface of the ulna, just below the semilunar notch; the other… postero-medial aspect… radius, one to two inches below the head». |
| 0 | canine:brachialis | detailedDescription | Sisson | p.373 | CONFIRMADO | «over the medial ligament of the elbow and under the ulnar tendon of the biceps and ends just proximal to the latter». |
| 0 | canine:triceps-brachii-medial-head | detailedDescription | Sisson | p.373 | CONFIRMADO | «proximal fourth of the medial surface… just behind the insertion of the teres major and latissimus dorsi». |
| 0 | canine:triceps-brachii-accessory-head | detailedDescription | Sisson | p.373 | CONFIRMADO | «arises just below the head of the humerus»; bolsa sobre el olécranon. |
| 3 | canine:skull | detailedDescription | Sisson | pp.195–196 | CONFIRMADO | Dolico-, mesati- y braquicéfalos con los ejemplos de la fuente; índice cefálico 50/70/90; foramen infraorbitario «above the third cheek tooth»; procesos paramastoideos pequeños; paladar ≈ ½ del cráneo. |
| 4 | canine:skull | detailedDescription | Sisson | p.197 | CONFIRMADO | Seno frontal «confined to the frontal bone… very small in extreme brachycephalic types». |
| 7 | canine:skull | detailedDescription | Sisson | pp.195–196 | CONFIRMADO | Índice craneofacial 10:3 a 10:7, «stop», prognatismo en el bulldog y braquignatismo en el teckel. |
| 8 | canine:skull | detailedDescription | Sisson | p.493 | CONFIRMADO (parcial, OCR) | **Fórmula canina:** el OCR muestra «THE TEETH / The formula of the permanent teeth is: … 2{ I-C—P—M } = 42», con denominadores 3·4·3 legibles y numeradores ilegibles. **No abrí la imagen de página.** Es coherente con los 7 alvéolos yugales inferiores de p.195. Falta la variación que Sisson da en p.494 (ver N3). |
| 9 | canine:skull | detailedDescription | Sisson | pp.494–495 | CONFIRMADO (con inferencia) | Sisson: «The fourth tooth of the upper row and the fifth of the lower row… sectorial or carnassial» y «upper fourth premolar (Dens sectorius)». «Primer molar inferior» = quinto yugal inferior: deducción editorial correcta, pero sin rotular como deducción. |
| 10 | canine:skull | detailedDescription | NAV | SPLANCHNOLOGIA p.50 | CONFIRMADO | Dens sectorius (Car), línea 5237. |

**Total muestreado:** 64 evidencias: 18 de L-F4, 38 de L-F5 y 8 de cada uno de los grupos caninos. Algunas filas reúnen dos índices. Resultado: 57 CONFIRMADO (incluidos los parciales), 5 DÉBIL, 1 INCORRECTO parcial y 0 NO VERIFICABLE.

**No verificado por lectura:**
- Imágenes de página de Sisson.
- Campos `origin`, `insertion`, `action` e `innervation` previos de L-C5, que vienen de innervate-vr-canine-limb y umn-proximal-thoracic-limb (no abrí esas fuentes).
- Fichas no muestreadas de L-C4 (parietal, frontal, basisfenoides, presfenoides, nasal, palatino) y el resto de evidencias NAV de «Traducción editorial».

## 2. Relaciones `articulates_with`

| Relación | Fuente | Comprobación | Veredicto |
|---|---|---|---|
| feline:sacrum → feline:os-coxae | R&J | p.8 («articulates laterally with the two innominate bones») y pp.10–11, 86–87 (carilla auricular, articulación iliosacra) | CONFIRMADO. Ambos extremos tienen R&J en `sourceIds`; feline:os-coxae ya figura en `supportedStructureIds`. |
| feline:occipital → feline:atlas | R&J | pp.22–24: cóndilos occipitales para el atlas | CONFIRMADO. feline:atlas está en el catálogo con R&J; feline:occipital es nueva y la fusión recalculará la reciprocidad. |
| feline:temporal → feline:mandible | R&J | p.47 («articulates with the temporal bone at the mandibular fossa») y p.61 | CONFIRMADO. feline:mandible pasa a citar R&J en L-F5. |

No hay relaciones sin fuente para ambos extremos.

## 3. Licencias de las fuentes nuevas

| Fuente | Registro en el lote | Comprobación (XML de Europe PMC o página) | Veredicto |
|---|---|---|---|
| kim-feline-lumbar-count-2026 | CC BY-NC-ND 4.0; `verified:true`; `redistributionAllowed:false`; JVMS 88(6):782–788 | `<license>`: «Creative Commons Attribution Non-Commercial No Derivatives… CC-BY-NC-ND 4.0»; `pmc-license-ref` CC BY-NC-ND; vol. 88, núm. 6, pp.782–788. | CORRECTO. La paráfrasis de hechos con cita no es adaptación del texto. No incorporar figuras ni tablas. |
| covasa-lumbosacrocaudal-2024 | Conflicto BY-NC 4.0 (texto) / BY 4.0 (enlace); `verified:false` | La declaración dice «Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)» y el `xlink:href` apunta a `licenses/by/4.0/`. | CORRECTO; aplicar la más restrictiva es la opción adecuada. La paginación «156–168» no la comprobé: el XML solo da `fpage` 156. |
| tagliavia-persian-skull-2026 | CC BY 4.0; Animals 16(13):2001 | «Creative Commons Attribution (CC BY) license», enlace BY 4.0; vol. 16, núm. 13, e2001. | CORRECTO. |
| requicha-feline-orbit-ct-2026 | CC BY 4.0; Animals 16(1):147 | Igual; vol. 16, núm. 1, e147. | CORRECTO. |
| delibas-van-cat-mandibular-canal-2026 | CC BY 4.0; Animals 16(19):3073 | Igual; vol. 16, núm. 19, e3073. | CORRECTO. |
| avdc-nomenclature | © AVDC, sin licencia abierta del texto; permiso solo para imágenes con cita; `verified:false`; `redistributionAllowed:false` | La página dice: «Copyright of these images is owned by AVDC. Download of these images and use in printed materials or presentations is permitted without charge provided that the source is cited». No hay declaración de licencia para el texto. | CORRECTO. Citar la AVDC como fuente bibliográfica es adecuado: citar no es redistribuir. Las fichas parafrasean frases sueltas (numeración 206/407/408 y oclusión) y no copian texto extenso. El permiso para imágenes no autoriza a incorporarlas a la galería sin decisión aparte. |
