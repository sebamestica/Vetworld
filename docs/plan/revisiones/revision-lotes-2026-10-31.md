# Revisión adversarial de lotes L-F1/L-F2/L-F3 y L-C1/L-C2 (2026-10-31)

Revisor: A7 (agente de IA; revisión de integridad documental, **no** revisión veterinaria humana). Este informe no valida anatomía: solo contrasta fichas con las fuentes citadas. Todas las fichas siguen con `review.status = "pending"`.

## Alcance y método

- Objeto: 40 fichas de `data/anatomy/_batches/{feline-L-F1,feline-L-F2,feline-L-F3,canine-L-C1,canine-L-C2}.json` (387 `fieldEvidence`: 163 NAV, 91 Reighard/Jennings, 89 Sisson, 28 El-Ghazali/El-behery, 9 Basa, 6 Goldstein, 1 Batista), 18 relaciones y las fuentes nuevas de `data/anatomy/sources.json`.
- Comprobé que `structures.json` contiene exactamente las 40 fichas de los lotes, sin diferencias (comparación campo a campo), y que todas las estructuras del catálogo tienen `review.status = "pending"`. No hallé textos que afirmen validación científica (búsqueda de «validad/verificad/confirmad/revisad/aprobad/exact»).
- Fuentes abiertas y leídas en esta revisión:
  - NAV 6.ª, copia local `nav6.txt` (grep + cabecera «PDF PAGE N» → página impresa).
  - Reighard & Jennings 1901, Gutenberg pg58394 (HTML; las páginas se tomaron de los anclajes `PageN`).
  - Sisson 1914 (reimpresión 1927), texto djvu de Internet Archive `anatomyofdomesti00sissuoft` (páginas impresas pp.195–206 identificadas por las cabeceras «NNN SKELETON OF THE DOG» / «BONES OF THE … LIMB NNN») y metadatos del ítem (`/metadata`).
  - Basa 2023 (PMC10812075), Goldstein 2026 (PMC13281358), Batista 2026 (PMC13398924): XML de Europe PMC y página de PMC (HTTP 200 en las tres).
  - El-Ghazali & El-behery 2018: XML de Europe PMC (PMC6702901) y PDF editorial de bdvets.org (solo pude extraer los enlaces de licencia del PDF; no tenía herramienta para extraer su texto).
- No obtuve ningún 401/403 y no repetí peticiones.
- Muestreo: 84 evidencias de los 5 lotes y de las dos especies (tabla 1). Fuera de la muestra también revisé el texto de los campos de todas las fichas caninas y felinas frente a las mismas páginas, y de ahí salen algunos hallazgos.

## 1. Evidencias muestreadas

Veredictos: CONFIRMADO (la fuente dice lo afirmado en el localizador), DÉBIL (respaldo parcial, localizador impreciso o la ficha va más allá del texto), INCORRECTO (la fuente no lo dice o dice lo contrario), NO VERIFICABLE (no pude abrir el pasaje).

| # | Estructura | Campo | Fuente | Localizador | Veredicto | Nota |
|---|---|---|---|---|---|---|
| 1 | feline:clavicle | canonicalLatinName | NAV | OSTEOLOGIA p.18, Clavicula (or, fe) | CONFIRMADO | Línea «Clavicula (or, fe)», PDF 36 → p.18. |
| 7 | feline:clavicle | detailedDescription | NAV | p.18; nota 1 p.9 | CONFIRMADO | or = *Oryctolagus*, fe = *Felis catus*. |
| 5 | feline:clavicle | summary | R&J | p.64, Fig. 46 | CONFIRMADO | «greatly reduced… connected by fibrous tissue to the apex of the acromion». |
| 8 | feline:clavicle | morphology | R&J | p.64 | CONFIRMADO | «slender curved rod… lateral end slightly enlarged». |
| 12 | feline:clavicle | attachments | R&J | p.117, M. clavotrapezius | DÉBIL | El contenido coincide, pero el texto está en la p.118: 117 es una lámina (Fig. 68) y el índice de la obra da «Clavotrapezius muscle, 118». |
| 13 | feline:clavicle | attachments | R&J | p.120, M. cleidomastoideus | CONFIRMADO | «Insertion into the lateral four-fifths of the clavicle». |
| 20 | feline:radius | detailedDescription | R&J | pp.67–68, Figs. 49–50 | CONFIRMADO | El radio cruza ventralmente a la ulna; cavidad distal para el escafolunar. |
| 21 | feline:radius | detailedDescription | R&J | p.75 | CONFIRMADO | Membrana interósea «about their middle third». |
| 22 | feline:radius | detailedDescription | Basa 2023 | Results, Macroscopic; Fig. 3 | CONFIRMADO | Ligamento triangular entre las caras dorsales del radio y la ulna distales. |
| 27 | feline:radius | attachments | R&J | p.67 | CONFIRMADO | Tuberosidad bicipital para el tendón del bíceps. |
| 28 | feline:radius | attachments | R&J | p.75 | CONFIRMADO | Colateral lateral ventral en la cara lateral del extremo proximal del radio; ligamento anular. |
| 31 | feline:radius | speciesDifferences | Basa 2023 | Introduction; Conclusions | CONFIRMADO | «less extensive interosseous component… compared with the dog and cheetah»; cada especie está atribuida correctamente. |
| 36 | feline:ulna | detailedDescription | R&J | p.69 | CONFIRMADO | Superficie en silla de montar con zona transversal no articular; incisura radial en el proceso coronoides. |
| 37 | feline:ulna | detailedDescription | R&J | p.70, Cuneiform (Os triquetrum BNA) | CONFIRMADO | |
| 44 | feline:ulna | attachments | R&J | p.68, leyenda k, l | CONFIRMADO | «area for insertion of brachialis and clavobrachial»; «rough area… interosseous membrane». |
| 42 | feline:ulna | landmarks | NAV | p.19; nota 49 p.28 | CONFIRMADO | «Margo interosseus. This term applies only to Carnivora». |
| 47 | feline:ulna | speciesDifferences | Basa 2023 | Discussion, párrafos 1 y 3 | DÉBIL | Las «fibrocartilage islets» del perro están confirmadas. En cambio, el artículo atribuye de forma explícita un «fibrocartilage disc» solo al guepardo; para el perro la frase del párrafo 1 es ambigua. La ficha afirma que el disco está «descrito en el perro». |
| 51 | feline:carpus | summary | R&J | p.69, Fig. 51 | CONFIRMADO | Siete huesos, tres proximales y cuatro distales. |
| 52 | feline:carpus | summary | Goldstein 2026 | Methods, Micro CT | CONFIRMADO | Lista de los siete huesos (Cir, Cu, Ca, CI–CIV). |
| 53 | feline:carpus | detailedDescription | R&J | pp.69–71 | DÉBIL | Composición y gatito (escafoides, semilunar y central) confirmados. Pero la ficha presenta «Os trapezium, Os trapezoideum…» como «equivalencias BNA»: R&J dan Os multangulum majus/minus BNA; los corchetes son sinónimos de NAV p.19. |
| 54 | feline:carpus | detailedDescription | R&J | p.73 | CONFIRMADO | Sesamoideo radial aplicado al extremo radial del escafolunar. |
| 62 | feline:carpus | function | R&J | p.75, The Wrist | CONFIRMADO | Tres articulaciones; las dos primeras móviles y la tercera no. |
| 63 | feline:carpus | function | Goldstein 2026 | Discussion | CONFIRMADO | «not only acts as a ginglymus, but also allows movement in other planes». |
| 66 | feline:carpus | attachments | Goldstein 2026 | Results, Cortical analysis | CONFIRMADO | Cortical marcada en el accesorio, en la inserción de tejidos blandos. Los autores dicen que es una observación, sin significación estadística. |
| 67 | feline:carpus | speciesDifferences | Goldstein 2026 | Results; Discussion | CONFIRMADO | En los siete huesos: BV/TV y Tb.Th mayores, Tb.N menor (P<0,001) y cortical de puntuación 3. ≈115° frente a ≈50° citado de bibliografía. |
| 72 | feline:metacarpus | detailedDescription | R&J | pp.71–72 | CONFIRMADO | Articulaciones de las bases I–V; cresta en la mitad ventral de la cabeza. |
| 77 | feline:metacarpus | attachments | R&J | pp.75–76 | CONFIRMADO | Doble ligamento lateral; sesamoideos unidos por un ligamento transverso. |
| 82 | feline:phalanges | detailedDescription | R&J | pp.72–73 | CONFIRMADO | Dos falanges en el dedo I y tres en II–V; falange distal al lado ulnar de la media. |
| 86 | feline:phalanges | landmarks | NAV | p.20; nota 51 p.28 | INCORRECTO (parcial) | El Tuberculum flexorium en Carnivora está confirmado (nota 51). Pero los rótulos «Phalanx proximalis [Os compedale]» y «Phalanx media [Os coronale]» usan términos que la nota 50 reserva a Ungulata («Os compedale, Os coronale, and Os ungulare for Ungulata, and Os unguiculare for Carnivora»). |
| 93 | feline:os-coxae | summary | El-Ghazali 2018 | p.412, Os coxae | CONFIRMADO (contenido) | La unión de los tres huesos «in rabbit and cat» está en el XML de PMC. No pude comprobar la página impresa. |
| 96 | feline:os-coxae | detailedDescription | El-Ghazali 2018 | p.412; Discussion | CONFIRMADO | La discrepancia con Aspinall (pubis excluido) está bien citada. R&J p.78 («about one-sixth the circumference») también confirmado. |
| 97 | feline:os-coxae | morphology | El-Ghazali 2018 | p.412; Fig. 2B, D | CONFIRMADO / DÉBIL | Ala en espátula, cresta gruesa, agujero elíptico, arco poco profundo y espina «low everted» descritos en el gato. «Isquion cuadrilátero» y «pubis en L invertida» se dicen sin distinguir especie. |
| 101 | feline:os-coxae | attachments | R&J | pp.77–79 | CONFIRMADO | Ilio-sacros, tubérculo púbico para el recto del abdomen, surco acetabular para el ligamentum teres. |
| 103 | feline:os-coxae | speciesDifferences | El-Ghazali 2018 | Abstract; Os coxae | CONFIRMADO | Tuberosidad ilíaca y foramen acetabular propios del conejo. |
| 109 | feline:patella | detailedDescription | El-Ghazali 2018 | Patella and fabellae | CONFIRMADO | Piramidal, vértice puntiagudo, cara craneal convexa y rugosa, cara caudal cóncava. R&J p.80 describe la cara externa como «rough and concave», y esa discrepancia no está registrada. |
| 121 | feline:popliteal-sesamoid | summary | R&J | p.80 | CONFIRMADO | «in the tendon of the popliteus muscle, just laterad of the lateral condyle». |
| 118 | feline:popliteal-sesamoid | canonicalLatinName | NAV | p.22 | CONFIRMADO | Sin marca de especie. |
| 127 | feline:fibula | summary | El-Ghazali 2018 | Tibia and fibula; Fig. 4E | DÉBIL | La fuente dice «completely separated along its length», es decir, no fusionados. El resumen («separado de ella en toda su longitud») puede leerse como ausencia de contacto, y eso choca con las carillas tibiales proximal y distal (R&J pp.81–82; la misma fuente: «two facets») y con la relación articulates_with. |
| 128 | feline:fibula | detailedDescription | R&J | p.82 | CONFIRMADO | Cabeza aplanada con carilla proximomedial; borde medial agudo para la membrana interósea; maléolo lateral. |
| 137 | feline:fibula | attachments | NAV | nota 63 p.29 | CONFIRMADO | Dos surcos en el maléolo lateral de Carnivora (fibular largo / extensor lateral + fibular corto). |
| 143 | feline:tarsus | summary | El-Ghazali 2018 | Tarsal bones; Table 1 | CONFIRMADO | Siete en el gato y seis en el conejo. |
| 147 | feline:tarsus | morphology | El-Ghazali 2018 | Tarsal bones | DÉBIL | El propio `claim` admite que «longitud doble que el talus» no distingue especie, pero la ficha lo da como dato felino. Los tarsianos I/IV «cuadriláteros» contradicen a R&J pp.84–85 (cuneiforme medial «flat triangular»; intermedio «small»), y no se registra la discrepancia. |
| 152 | feline:tarsus | landmarks | R&J | pp.82–84 | CONFIRMADO | Tróclea, sustentáculo, tubérculo y surco peroneos. |
| 160 | feline:metatarsus | summary | El-Ghazali 2018 | Metatarsals and digits | CONFIRMADO | «The first in the cat was undeveloped». |
| 163 | feline:metatarsus | morphology | R&J | p.85 | CONFIRMADO | Errata «first metacarpal» bien señalada en `review.notes`. |
| 176 | feline:pes-phalanges | detailedDescription | El-Ghazali 2018 | Metatarsals and digits; Sesamoid bones | CONFIRMADO | Dedos II/V más cortos; proceso ungueal; sesamoideo distal ausente en la muestra. |
| 186 | feline:atlas | detailedDescription | R&J | pp.14–15 | CONFIRMADO | Anillo de sello sin centro, foramen atlantal, surco de la arteria vertebral, arco dorsal 2–3 veces más ancho. |
| 191 | feline:atlas | attachments | R&J | pp.14, 17–18 | CONFIRMADO | Ligamento transverso, membranas atlantooccipitales, ligamentos laterales hasta los procesos yugulares. |
| 182 | feline:atlas | canonicalLatinName | NAV | p.17 | CONFIRMADO | |
| 196 | feline:axis | detailedDescription | R&J | p.15 | CONFIRMADO | |
| 201 | feline:axis | attachments | R&J | pp.16–18 | CONFIRMADO | Ligamento nucal desde T1; ligamentos alares; banda atlantoaxial dorsal. |
| 206 | canine:scapula | detailedDescription | Sisson | pp.197–198 | CONFIRMADO | Incluye la unión del tubérculo a los 6–8 meses (p.198). |
| 208 | canine:scapula | location | Sisson | p.197 | CONFIRMADO | Ángulos frente a la 1.ª espinosa torácica, la 4.ª costilla y la 1.ª costilla. La correspondencia cervical/dorsal/glenoideo → craneal/caudal/ventral es correcta. |
| 217 | canine:humerus | detailedDescription | Sisson | pp.198–199 | CONFIRMADO | Musculo-spiral groove → Sulcus m. brachialis y tuber «teres» → Tuberositas teres major son mapeos razonables. |
| 218 | canine:humerus | detailedDescription | Batista 2026 | Abstract | CONFIRMADO | 123 perros actuales, 73,17 %, más próximo al epicóndilo lateral, alargado en sentido transversal. |
| 224 | canine:humerus | speciesDifferences | NAV | p.19; nota 46 p.27 | DÉBIL | Las marcas (ca)/(fe) y la frase sobre el capítulo están confirmadas. Pero la misma nota 46 dice «A Foramen supratrochleare occurs in Carnivora and occasionally in pig», y la ficha la omite al presentar el foramen como restringido al perro. |
| 221 | canine:humerus | attachments | Sisson | Fig. 219, leyenda 1–2 (p.199) | CONFIRMADO | |
| 229 | canine:radius | detailedDescription | Sisson | pp.198–200 | CONFIRMADO | Edades: proximal 6–8 meses, distal ≈1,5 años. |
| 232 | canine:radius | attachments | Sisson | p.199 | CONFIRMADO | «Crista interossea… interosseous ligament». |
| 239 | canine:ulna | detailedDescription | Sisson | pp.199–200 | CONFIRMADO | Fusión hacia los 15 meses. |
| 243 | canine:ulna | landmarks | Sisson | Fig. 220 (p.200) | CONFIRMADO | «Processus anconeus» rotulado. |
| 248 | canine:manus | detailedDescription | Sisson | pp.200–201 | CONFIRMADO | Nueve sesamoideos palmares; osificación a los 5–6 meses. |
| 255 | canine:skull | detailedDescription | Sisson | pp.195–196 | CONFIRMADO | Índices ≈50/90/70; foramen infraorbitario sobre el 3.er diente yugal; paramastoideo → Processus paracondylaris es correcto. |
| 256 | canine:skull | detailedDescription | Sisson | p.197 | CONFIRMADO | Seno frontal. |
| 262 | canine:carpal-intermedioradial | summary | Sisson | p.200 | DÉBIL | Sisson dice que la reducción «is apparently due to the fusion of the radial and intermediate»; la ficha lo convierte en hecho («resultado de la fusión») y no menciona el central, que R&J sí incluyen en el gato. |
| 261 | canine:carpal-intermedioradial | aliases | NAV | p.19 | CONFIRMADO | «Os carpi intermedioradiale [Os scapholunatum]». |
| 267 | canine:carpal-ulnar | summary | Sisson | p.200 | DÉBIL | «lateral al intermediorradial» no figura en el texto citado; es una inferencia por el orden de descripción. |
| 268 | canine:carpal-ulnar | detailedDescription | Sisson | p.200 | CONFIRMADO | |
| 274 | canine:carpal-accessory | detailedDescription | Sisson | p.200 | CONFIRMADO | |
| 286 | canine:carpal-2 | morphology | Sisson | p.200 | CONFIRMADO | «wedge-shaped, the base being posterior» → palmar. |
| 305 | canine:coxal | attachments | Sisson | Fig. 222, leyenda 9 (p.202) | INCORRECTO | La leyenda dice «tubercle to which rectus femoris is attached», pero la ficha escribe «inserción del m. recto femoral». En ese tubérculo el músculo se origina, no se inserta. |
| 304 | canine:coxal | location | Sisson | p.202 | CONFIRMADO | |
| 312 | canine:femur | detailedDescription | Sisson | p.203 | CONFIRMADO | |
| 314 | canine:femur | attachments | Sisson | p.203 | DÉBIL | Lo que la ficha registra es una carilla articular para los sesamoideos del gastrocnemio, no un punto de fijación. |
| 321 | canine:patella | morphology | Sisson | p.204 | CONFIRMADO | |
| 327 | canine:tibia | detailedDescription | Sisson | pp.203–204 | CONFIRMADO | |
| 337 | canine:fibula | detailedDescription | Sisson | p.204 | CONFIRMADO | |
| 340 | canine:fibula | landmarks | NAV | p.22 | CONFIRMADO | «Malleolus lateralis (Car, su)». |
| 346 | canine:talus | detailedDescription | Sisson | p.205 | CONFIRMADO | tibial tarsal → Talus. |
| 352 | canine:calcaneus | summary | Sisson | p.205 | DÉBIL | «plantar y lateral al talus» no está en la p.205. La posición plantar se deduce de las carillas; la lateral no se menciona. |
| 367 | canine:tarsal-1 | detailedDescription | Sisson | p.206 | CONFIRMADO | «In some cases it fuses with the first tarsal». |
| 384 | canine:tarsal-4 | detailedDescription | Sisson | p.205 | CONFIRMADO | |
| 386 | canine:tarsal-4 | landmarks | NAV | p.22 | CONFIRMADO | «Sulcus tendinis m. fibularis [peron(a)ei] longi» en Os tarsale IV. |
| 380 | canine:tarsal-4 | canonicalLatinName | NAV | p.22 | CONFIRMADO | |

Totales de la muestra (84 evidencias: 51 felinas y 33 caninas): 71 CONFIRMADO, 10 DÉBIL, 2 INCORRECTO (uno parcial) y 1 CONFIRMADO/DÉBIL. Ninguna NO VERIFICABLE en cuanto al contenido. En El-Ghazali las páginas impresas (p.412, 415, 418) **no** están verificadas: comprobé el contenido por secciones en el XML de PMC, no en el PDF.

Comprobaciones adicionales de localizadores NAV hechas en `nav6.txt`: Atlas/Axis p.17; Scapula/Clavicula p.18; Humerus/Radius/Ulna/Ossa carpi p.19; Ossa sesamoidea proximalia/dorsalia p.20; Os femoris p.21; Patella/Tibia/Fibula/Ossa tarsi p.22; notas 46 (p.27), 49/50/51 (p.28), 63 (p.29); Articulatio cubiti p.32, femoropatellaris p.33, tarsocruralis p.34; Cranium p.11. Todos coinciden.

## 2. Relaciones `articulates_with`

Hay 18 relaciones, todas felinas; los lotes caninos no añaden ninguna. Comprobé los dos extremos en R&J (pp.14–17, 67–72, 76–86) y, para tibia–fibula, también en El-Ghazali («two facets in the cat»). Todas las fuentes citadas incluyen ambos extremos en `supportedStructureIds`, incluidos `feline:femur` y `feline:tibia`. No encontré relaciones sin respaldo.

## 3. Licencias de fuentes

| Fuente | Registro en `sources.json` | Comprobación | Veredicto |
|---|---|---|---|
| sisson-dog-1914 | «Probable dominio público…», `verified:false`, `redistributionAllowed:false` | Metadatos de IA: `possible-copyright-status: NOT_IN_COPYRIGHT`, `date: 1914`, creador «Sisson, Septimus, 1865-1924». La página de créditos del escaneo dice «Revised, entirely reset, reprinted and recopyrighted September, 1914… Reprinted October, 1927», lo que concuerda con el título del registro. Obra publicada en EE. UU. antes de 1929 y autor fallecido en 1924. | Descripción correcta y conservadora. Estos datos apoyan el dominio público en EE. UU. y en países de vida+70, pero la confirmación jurídica sigue siendo una decisión humana. Mantener `verified:false` es coherente con AGENTS.md. |
| goldstein-feline-carpus-microct-2026 | CC BY 4.0, verificada | La página de PMC y el XML de Europe PMC enlazan CC BY 4.0 («Creative Commons Attribution 4.0 International»). El XML incluye además un enlace CC0, que en BMC corresponde normalmente a los datos. | CONFIRMADO en PMC. No consulté la página de BMC. |
| basa-feline-radioulnar-ligament-2023 | CC BY 4.0, verificada | La página de PMC y el XML dicen CC BY 4.0 y remiten a las condiciones de atribución de SAGE. | CONFIRMADO en PMC. No consulté la página de SAGE. |
| batista-stf-2026 | CC BY 4.0 (XML de Europe PMC) | La página de PMC y el XML dicen CC BY 4.0. | CONFIRMADO en PMC. No consulté la página de Wiley. |
| el-ghazali-el-behery-pelvic-2018 (preexistente, usada 28 veces en L-F2) | «CC BY 4.0 explícita en p.410 del PDF editorial», `verified:true`, `redistributionAllowed:true` | El PDF editorial contiene enlaces a `creativecommons.org/licenses/by/4.0`. En cambio, el depósito de PMC (PMC6702901) declara `by-nc/4.0` con el texto «Creative Commons Attribution-Noncommercial-Share Alike 3.0 Unported». | **Conflicto de licencias** que no está registrado (ver N1). |

## 4. Hallazgos bloqueantes

Hay que corregirlos antes de dar el lote por aceptable.

**B1. `canine:coxal` (L-C2): «inserción» del m. recto femoral (error anatómico).** Sisson, Fig. 222, leyenda 9: «tubercle to which rectus femoris is attached». El recto femoral se origina en el ilion.
Corrección: `attachments` → «Tubérculo craneal al acetábulo, al final de la línea glútea ventral: fijación (origen) del m. recto femoral (rotulado en la figura de la fuente)», o bien «fijación del m. recto femoral» sin decir el tipo. Ajustar el `claim` de la evidencia #305.

**B2. Fichas `kind:"bone"` nuevas que representan grupos.** `feline:tarsus` (Ossa tarsi), `feline:metatarsus` (Ossa metatarsalia) y `feline:pes-phalanges` (Ossa digitorum pedis) son fichas nuevas de L-F2. Incumplen la regla 7 de `scientific-field-evidence` («Grupos… no reciben ficha `bone`… hasta acordar una representación»). Los resúmenes sí dicen «conjunto», pero no hay ninguna decisión en `docs/DECISIONES.md` que autorice fichas de conjunto. Las del miembro torácico (`feline:carpus`, `feline:metacarpus`, `feline:phalanges`, `canine:manus`) y `canine:skull` son anteriores a los lotes, y las notas reconocen el problema.
Corrección: (a) registrar en `DECISIONES.md` una decisión aceptada por el usuario que admita «fichas de conjunto» y su rótulo en la UI (p. ej. «Conjunto óseo, no un hueso único»), aplicable a las siete fichas; o (b) retirar las tres nuevas del catálogo y mantenerlas como filas `group` del inventario hasta tener fichas individuales, como en L-C1/L-C2 para el perro.

**B3. `feline:phalanges` (L-F1): sinónimos NAV de Ungulata aplicados al gato.** Los landmarks «Phalanx proximalis [Os compedale]» y «Phalanx media [Os coronale]» chocan con la nota 50 de NAV (p.28): «Os compedale, Os coronale, and Os ungulare for Ungulata, and Os unguiculare for Carnivora».
Corrección: dejar «Phalanx proximalis — falange proximal» y «Phalanx media — falange media» sin corchetes. Conservar «Phalanx distalis [Os unguiculare]». Ajustar el `claim` de la evidencia #86.

## 5. Hallazgos no bloqueantes, con corrección propuesta

- **N1. Licencia de El-Ghazali/El-behery en conflicto.** El registro dice CC BY 4.0 verificada, pero PMC declara CC BY-NC 4.0 (y menciona un texto BY-NC-SA 3.0). Corrección: indicar en `license.label` el conflicto entre el PDF editorial (BY 4.0) y PMC (BY-NC 4.0 / BY-NC-SA 3.0), y poner `verified:false` hasta resolverlo. No incorporar figuras. El uso actual (hechos parafraseados con cita) no parece afectado, pero esa valoración corresponde a una persona.
- **N2. `feline:fibula` summary (#127).** Cambiar a «…lateral a la tibia y no fusionado con ella; el espacio interóseo se extiende a lo largo de toda la pierna (El-Ghazali y El-behery, 2018)». Así no contradice las articulaciones tibiofibulares proximal y distal.
- **N3. `feline:tarsus` morphology (#147).** Quitar «de longitud doble que la del talus» o atribuirlo como afirmación sin especie de El-Ghazali. Registrar en `review.notes` que la forma de los cuneiformes difiere entre El-Ghazali (I y IV cuadriláteros; I el más pequeño) y R&J (medial «flat triangular», intermedio «small»).
- **N4. `feline:patella`.** Registrar en `review.notes` la discrepancia sobre la cara craneal/externa: convexa según El-Ghazali, «rough and concave» según R&J p.80.
- **N5. `feline:carpus` detailedDescription (#53).** Separar las dos nomenclaturas: «R&J dan los equivalentes BNA Os triquetrum, Os hamatum, Os capitatum, Os multangulum minus y Os multangulum majus; NAV (p.19) usa Os carpi intermedioradiale [Os scapholunatum]… Os carpale I–IV [Os trapezium…]».
- **N6. `feline:ulna` speciesDifferences (#47).** Reformular como «…presenta un verdadero ligamento radioulnar y no un disco fibrocartilaginoso (Basa et al., 2023); en el perro el ligamento se ha descrito con porciones interósea proximal y articular distal y con islotes fibrocartilaginosos». El disco solo se atribuye explícitamente al guepardo.
- **N7. `canine:humerus` speciesDifferences (#224).** Añadir que la nota 46 de NAV dice que el foramen supratroclear «occurs in Carnivora and occasionally in pig», aunque el término lleve la marca (ca). Así no se presenta como exclusivo del perro.
- **N8. `canine:carpal-intermedioradial` summary (#262).** Matizar: «…que, según Sisson, parece resultar de la fusión de los huesos radial e intermedio». La inclusión del central en el perro queda pendiente de una fuente canina moderna.
- **N9. Posiciones inferidas sin texto.** `canine:carpal-ulnar` («lateral al intermediorradial», #267) y `canine:calcaneus` («plantar y lateral al talus», #352): quitar el adjetivo o citar una fuente que lo diga.
- **N10. Comparaciones con otras especies fuera de `speciesDifferences`.** `canine:femur` morphology («más largo que en el caballo o el bovino») y `canine:humerus` detailedDescription («mejor marcado que en el caballo»). Moverlas a `speciesDifferences` o eliminarlas (regla 6).
- **N11. `canine:femur` attachments (#314).** Una carilla articular no es una fijación. Moverla a `detailedDescription` (donde ya figura) y dejar `attachments` pendiente.
- **N12. Localizador de R&J (#12).** Cambiar «p.117» por «p.118» en `feline:clavicle` attachments (M. clavotrapezius).
- **N13. Localizador de Goldstein (#61).** «Table 1» recoge los animales del estudio; los siete huesos se nombran en «Methods, Micro CT». Corregir el localizador.
- **N14. Solapamiento de grupo e individuos en el perro.** `canine:manus` lista Os carpi intermedioradiale y otros huesos que ahora tienen fichas propias. Conviene decidir junto con B2 si la ficha de conjunto debe enlazar a las individuales.

## 6. Aspectos comprobados sin incidencias

- No hay datos trasladados entre perro y gato. Las fichas felinas no usan Sisson y las caninas no usan R&J, Basa, Goldstein ni El-Ghazali. En las fichas felinas, los datos de conejo (El-Ghazali) y de guepardo/perro (Basa, Goldstein) aparecen solo en `speciesDifferences`, atribuidos de forma explícita.
- Sisson también describe el gato en p.197 («nearly an inch long in a large cat…»), pero no se usó en ninguna ficha felina.
- La normalización de términos de Sisson a NAV es correcta en todo lo revisado: tibial/fibular tarsal → Talus/Calcaneus; volar → palmar; paramastoid → Processus paracondylaris; ilio-pectineal line → Linea arcuata; beak → proceso craneal del calcáneo (NAV: Processus coracoideus). Las notas canina y felina declaran los términos históricos.
- `feline:atlas` conserva «foramen atlantal» con la correspondencia NAV pendiente. `canine:scapula` y `canine:coxal` no incluyen accidentes discutidos (Processus coracoideus, Incisura ischiadica minor), y las notas explican por qué.
- Los modelos no cambian respecto a la versión anterior: `modelIds` se conservan en las fichas que ya los tenían y valen `[]` en las nuevas, con «Modelo 3D no disponible» en las notas de las fichas caninas individuales.

## 7. Lo que no pude verificar

- Las páginas impresas de El-Ghazali (p.410–419): sin herramienta de extracción de texto de PDF, verifiqué el contenido en el XML de PMC por secciones.
- Las páginas de licencia de los editores (BMC, SAGE, Wiley, JAVAR HTML): comprobé solo PMC/Europe PMC y, en el caso de JAVAR, los enlaces del PDF editorial.
- El estatus jurídico de Sisson o de la edición Gutenberg fuera de EE. UU.: requiere decisión humana.
- Ninguna afirmación se ha contrastado con literatura veterinaria moderna más allá de las fuentes citadas, ni ha pasado revisión veterinaria humana.
