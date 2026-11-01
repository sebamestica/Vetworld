# Segmentación felina privada refinada — 2026-10-31 (F3 + F4, A1)

Activo: Cat Skeleton — Tavernier Amaury — CC BY-NC-SA 4.0. GLB fuente `workbench/processing/feline/cat-skeleton/source/Chat.glb`, SHA-256 `c570679a9f450c32aeded26c7b459993e984ee6fb01677170e4cd7cdf9220783`, 74.235 triángulos, sin modificar (hash comprobado antes y después; `public/models/feline/tavernier-skeleton.glb` tiene el mismo hash). `feline_annotation.blend` solo se abrió en lectura (mtime 2026-10-08, sin guardar). Todo es privado (`workbench/`), con `reviewStatus=pending` y `side=unknown`. **Cero huesos admitidos.** Nada se publicó en `public/` ni en el catálogo o la API.

## 1. Método geométrico

Script principal: `scripts/osteology/segment-feline-proposals.py` (utilidades en `feline_seg_common.py`). Es determinista y lee coordenadas de escena Blender (glTF → Blender + transformación del nodo `chat`).

1. **Conectividad local.** Los vértices se unen virtualmente por posición idéntica y la adyacencia se cuenta por arista *manifold* (2 caras): 111.305 adyacencias; 22 aristas no manifold y 22 de borde se ignoran. Con esta regla salen 86 componentes (mayor: 73.200 caras). El diagnóstico anterior, de 75 componentes y mayor de 73.217, unía por vértice compartido. La diferencia se debe solo a la regla y no contradice ese diagnóstico.
2. **Zonas articulares excluidas.** Los centros (x, z) de hombro, codo, carpo, cadera, rodilla y tarso se leyeron en capturas con retícula (`workbench/inspection/feline-oct31/survey-grid/*.png`). La profundidad y es la mediana de las caras cercanas del mismo semiespacio. Radios: 0,20–0,25 unidades de escena. Las caras articulares quedan en el remanente: no se decide a qué hueso pertenecen.
3. **Huesos largos: cilindro entre planos articulares.** Se toman las caras con proyección t ∈ [r_proximal, L − r_distal] sobre el eje articulación–articulación y una distancia radial menor de 0,32. La propuesta es el componente conexo que contiene la semilla central.
4. **Antebrazo: perfil de sección.** El carpo no se distingue visualmente, así que el límite distal es el primer tramo, después de 0,4 L de la línea codo → contacto distal, cuyo número de caras supera 1,4 × la mediana diafisaria. Ese tramo se cortó en 0,679 L (semiespacio yneg) y 0,714 L (ypos), y es compatible con el extremo distal del antebrazo o el carpo. El autopodio queda en el remanente.
5. **Huesos planos (escápula): banda alrededor del plano de la placa.** Se ajusta un plano por PCA en un radio de 0,45 alrededor de la semilla y se usa una banda de +0,22 lateral y −0,08 medial; además, nada queda por debajo del centro escapulohumeral. En el semiespacio ypos el crecimiento tampoco cruza aristas con ángulo diedro > 60°, porque las costillas estaban en contacto.
6. **Coxales y cabeza.** Coxales: caja por semiespacio que excluye la franja sagital media (sacroilíaca y sínfisis no delimitables) y la cadera. Cabeza: corte en la sección y·z mínima entre cráneo y cuello (x = −4,475, franja de ±0,05 excluida).
7. **Curvatura y ángulo diedro (criterio evaluado, no adoptado como límite).** Dentro de las propuestas, el diedro mediano es 2,5–4,8° y el p90 es 30–99°. En los bordes de corte, la mediana es casi siempre similar a la interior (2,1–3,8°). Excepción: el borde de `scapula-surface-ypos`, con mediana de 64,5°, causado por la regla de diedro. Las aristas de diedro alto están dispersas (pliegues y superficies finas) y no se concentran en límites óseos. Una prueba de crecimiento limitado a 20/30/45/60° fragmentaba las superficies sin aislar la tira compatible con fíbula. **Conclusión: la curvatura de esta malla no marca límites anatómicos y los cortes no coinciden con aristas reales.** Por eso ninguna pieza alcanza el estado «hueso geométrico suficiente».

Nunca se generaron, cerraron ni repararon caras. Las capturas de inspección se hicieron con mallas temporales en memoria, construidas con subconjuntos de caras fuente; la retícula amarilla es un objeto aparte que solo existe en el render.

## 2. Propuestas (13) y estado de admisión

Todas en el estado **superficie identificada parcial**, con `side=unknown`. Ninguna es «hueso geométrico suficiente» ni «revisado». yneg/ypos son semiespacios de escena (y<0 / y≥0), no lados anatómicos.

| Propuesta | Caras | Observación |
|---|---:|---|
| humerus-surface-yneg | 971 | Entre hombro y codo; alineación del eje principal 0,999 |
| humerus-surface-ypos | 1.033 | Ídem |
| antebrachium-radius-ulna-surface-yneg | 1.279 | **Conjunto** radio+cúbito; sin separación defendible |
| antebrachium-radius-ulna-surface-ypos | 1.357 | Ídem |
| femur-surface-yneg | 1.105 | Entre cadera y rodilla |
| femur-surface-ypos | 1.177 | Ídem |
| crus-tibia-fibula-surface-yneg | 1.686 | **Conjunto crural**: incluye una tira delgada conectada compatible con fíbula |
| crus-tibia-fibula-surface-ypos | 1.959 | Hay una superficie paralela no conectada (326 caras) en el remanente; no se sabe cuál es tibia y cuál fíbula |
| scapula-surface-yneg | 1.827 | Placa con espina escapular visible |
| scapula-surface-ypos | 1.728 | Ídem; persiste un pequeño fragmento ventral compatible con costilla bajo la placa (ver captura lateral) |
| os-coxae-surface-yneg | 1.632 | Ilion e isquion; anillo obturado visible pero ventralmente en el remanente |
| os-coxae-surface-ypos | 1.832 | Barra iliaca-isquiática; agujero obturado no legible |
| head-skeleton-surface-midline | 10.672 | Cráneo y mandíbula (si existe) como superficie conjunta |
| **Remanente sin identificar** | **45.977** | |
| **Suma** | **74.235** | Comprobada en Python, en el GLB exportado (Blender) y en Zod/Vitest |

Las listas de caras son disjuntas (comprobado con aserción). Para cada propuesta, `data/osteology/proposals/feline/feline-surface-proposals-2026-10-31.json` registra: rangos de `source_face_index`, el SHA-256 de la lista de índices, los parámetros (caja/semilla/exclusiones/cilindro/plano/perfil) y las métricas (área, contacto con la caja, alineación, diedro).

**No identificables o no propuestas:**

- Mandíbula separada: no hay límite respecto del cráneo.
- Radio y cúbito por separado: sin separación geométrica.
- Tibia y fíbula por separado: identidad de las superficies paralelas no acreditada.
- Componentes de coxal (ilion, isquion, pubis): están fusionados y no tienen límite propio.
- Huesos craneales individuales, dientes, hioides, columna y costillas por ordinal, clavícula, patella, carpo/tarso/metapodios/falanges y sesamoideos: superficie irregular, baja resolución o sin delimitar.
- Oído medio: interno al cráneo («oculta»). No visible ≠ ausente.

## 3. Refinamiento del piloto del 2026-10-10

| ROI piloto | Caras | Hallazgo | Propuesta refinada |
|---|---:|---|---|
| humeral-shaft-surface | 350 | 1 pieza, todo en yneg | humerus-surface-yneg (contiene las 350; 971 en total) |
| femoral-shaft-surface | 369 | **13 caras del otro semiespacio** (otro miembro) y 2 piezas | femur-surface-yneg (contiene 356; descarta las 13 ajenas) |
| tibial-shaft-surface | 562 | 2 piezas (549 + 13) | crus-tibia-fibula-surface-yneg (contiene las 562). Cambia de identidad: la superficie está conectada a una tira compatible con fíbula, así que **no se mantiene como tibia aislada** |

## 4. Exportación privada y verificación

- Propuesta Zod: `workbench/segmentation/feline/refined-2026-10-31/proposals.json` (`status: draft`, `reviewer: null`).
- `npx tsx scripts/osteology/apply-segmentation-review.ts workbench/segmentation/feline/refined-2026-10-31/proposals.json --preview` → `workbench/segmentation/feline/exports/proposal-06904650fb10da7089a3b123dec2ed4bc5746e5deb40f51613282b2af1514cea.glb` (4.662.896 bytes) + `.json`.
- `scripts/osteology/inspect-refined-proposal.py -- <glb>`: comprueba que el nombre coincide con el SHA-256, que el original está intacto y que los 14 nodos tienen los conteos esperados (suma 74.235); renderiza 4 vistas (`workbench/inspection/feline-oct31/export-check/`) y guarda y reabre `workbench/segmentation/feline/refined-2026-10-31/refined-surface-proposals.blend` (SHA-256 `369e2812208cf5e35a9236d404c3f9467492cdb6f5d9ad06d7bb7a7223f01d2e`), con aserción sobre los conteos. Informe: `export-inspection.json`.
- Capturas ortogonales por pieza (lateral del semiespacio, craneal −X, dorsal +Z): `workbench/inspection/feline-oct31/proposals/<propuesta>-from-*.png`, más 6 vistas generales `all-proposals-*`. Se abrieron e inspeccionaron las vistas laterales individuales de humerus-ypos, femur-ypos, antebrachium-yneg, ambas crurales, ambas escápulas, ambos coxales y la cabeza; además, la dorsal de scapula-ypos, versiones intermedias de `all-proposals-from-neg-y/pos-y` (antes del ajuste final de escápulas) y la vista final `export-from-pos-z`. humerus-yneg, femur-yneg y antebrachium-ypos solo se vieron en la vista general. Las demás vistas craneales y dorsales individuales se generaron, pero no se revisaron una por una.

## 5. Matriz geométrica (separada de la bibliográfica)

`data/osteology/feline-geometry-coverage.json` se genera con `scripts/osteology/generate-geometry-coverage.ts` y el esquema `scripts/osteology/feline-geometry-coverage-schema.ts`. Tiene 323 filas en el mismo orden que el workbook: visible 24 (15 con superficie parcial y 9 grupos/regiones visibles sin propuesta), oculta 8 (oído medio), no_identificable 291, no_representada 0. Ninguna fila se marca «no representada» porque no hay evidencia positiva de ausencia. Las filas izquierda/derecha nunca reciben `proposalId`: listan ambas candidatas con `sideAssignment=unresolved`. Zod rechaza «revisado», un lado asignado, propuestas inexistentes, la pérdida de caras, una admisión sin superficie visible y una escala numérica.

## 6. Ejes y escala (F4)

`data/osteology/diagnostics/feline-axes-2026-10-31.json`:

- **Craneal = −X de escena.** La superficie de la cabeza ocupa x ∈ [−6,384; −4,525] y la cola cuelga en +X.
- **Dorsal = +Z.** Los autopodios están en el mínimo de z (−0,314) y los procesos espinosos y las escápulas apuntan hacia +Z.
- **Derecha = unknown.** Si no hubo reflexión, derecha = craneal × dorsal = +Y. Pero un esqueleto bilateral reflejado globalmente es indistinguible del original, y no hay metadatos ni fotos que lo descarten.
- **Escala = unknown.** No hay dos medidas del mismo espécimen (`physicalScaleVerified=false`). No se usaron medias poblacionales.
- Borrador actualizado, sin enviar: `docs/phase3/requests/feline-measurements-tavernier.md`.

**Observación para A0:** la convención de `skeleton-master-assembly` («+X derecha, −Y craneal, +Z dorsal») contradice derecha = craneal × dorsal en un sistema dextrógiro: (−Y)×(+Z) = −X. Hay que revisarla antes de usarla para asignar lados. La skill no se modificó.

## 7. Reproducción

```bash
B=.tools/blender-4.5.14/blender-4.5.14-windows-x64/blender.exe
$B --background --factory-startup --python-exit-code 1 --python scripts/osteology/survey-feline-regions.py
$B --background --factory-startup --python-exit-code 1 --python scripts/osteology/segment-feline-proposals.py
scripts/qa/win.sh npx tsx scripts/osteology/apply-segmentation-review.ts workbench/segmentation/feline/refined-2026-10-31/proposals.json --preview
$B --background --factory-startup --python-exit-code 1 --python scripts/osteology/inspect-refined-proposal.py -- workbench/segmentation/feline/exports/proposal-<sha>.glb
scripts/qa/win.sh npx tsx scripts/osteology/generate-geometry-coverage.ts
```

Notas de reproducción:

- `apply-segmentation-review.ts` no sobrescribe (`wx`).
- `inspect-refined-proposal.py` se niega a sobrescribir el `.blend` existente.
- Si cambian las caras, el SHA del GLB cambia y hay que actualizar `exportGlbSha256` en el generador de cobertura.
- Las retículas de prueba usadas para localizar las articulaciones están en `workbench/inspection/feline-oct31/probe/` (scripts de sondeo privados).

## 8. Límites

- Ninguna captura ni métrica valida anatomía.
- Las identidades se apoyan en la posición en la cadena del miembro (cintura → estilopodio → zeugopodio) y en rasgos visibles (espina escapular, agujero obturado, órbita), y requieren revisión humana cualificada.
- Los centros articulares se leyeron a mano en capturas (precisión ≈ ±0,05 unidades de escena) y son parámetros explícitos, no límites articulares.
- Las superficies no reconstruyen volumen ni interiores.
