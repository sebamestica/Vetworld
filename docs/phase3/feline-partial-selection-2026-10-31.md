# Selección científica felina por superficies parciales — F5, 2026-10-31

Fase F5 del [plan](../../plandeimplementacion.md). Parte de la segmentación privada [feline-segmentation-2026-10-31.md](feline-segmentation-2026-10-31.md). **Revisión anatómica humana pendiente**: nada de lo aquí descrito valida anatomía, límites óseos ni lado.

## 1. Derivado publicado

| Campo | Valor |
|---|---|
| Archivo | `public/models/feline/tavernier-partial-surfaces.glb` |
| SHA-256 | `06904650fb10da7089a3b123dec2ed4bc5746e5deb40f51613282b2af1514cea` |
| Tamaño | 4.662.896 B (presupuesto 12 MiB) · buffers 4.654.644 B (`estimatedGpuBytes`) |
| Triángulos | 74.235 (igual que la fuente) en 14 nodos: 13 superficies + `unidentified-remainder` (45.977) |
| Fuente | `public/models/feline/tavernier-skeleton.glb`, SHA-256 `c570679a…220783`, **sin modificar** (hash recomprobado por el script y por la prueba unitaria) |
| Obra / autor | Cat Skeleton — Tavernier Amaury — [Sketchfab](https://sketchfab.com/3d-models/cat-skeleton-7106115b299649e992476f2d3b4fc602) |
| Licencia | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). El derivado se distribuye con la **misma licencia** (ShareAlike), con atribución, uso no comercial e indicación de cambios |
| Aviso de cambios | «Derivado: partición por caras en superficies parciales, sin geometría añadida» (en `credit.changes`, `attribution`, la atribución visible y `public/models/feline/ATTRIBUTION.txt`) |

### Transformación

Es el mismo archivo que el export privado `workbench/segmentation/feline/exports/proposal-0690….glb` (generado con `apply-segmentation-review.ts --preview`). `scripts/osteology/publish-partial-surfaces.ts` hace lo siguiente:

1. Regenera la partición en memoria con `partitionGlb` a partir de `workbench/segmentation/feline/refined-2026-10-31/proposals.json`.
2. Exige que el resultado sea **byte a byte idéntico** al export privado.
3. Comprueba la conservación frente al original con `comparePartitionedGlb`:
   - accesores y bytes de POSITION, NORMAL y TEXCOORD_0;
   - imagen JPEG embebida;
   - materiales, texturas y muestreadores;
   - transformación de cada nodo igual a la del nodo `chat`;
   - multiconjunto de triángulos idéntico.
4. Copia el resultado a `public/` sin sobrescribir un archivo distinto.

Salida real: `issues: []`, 74.235 triángulos. Diferencias estructurales respecto del original:

- la única malla pasa a ser 14 nodos/mallas con índices uint32 nuevos;
- el accesor de índices original queda en el BIN sin referencias;
- se omite el nodo vacío `Light`, que no tiene malla ni extensión de luces.

No se generaron, cerraron ni repararon caras.

## 2. Contrato: nivel de admisión por mapping (aditivo)

- `data/viewer/assets.json` (`viewerAssetSchema`) y `data/anatomy/models.json` (`modelSchema`): cada mapping de `meshMappings` acepta, de forma opcional:
  - `admission: "partial-surface"`;
  - `includesStructureIds: string[]`: estructuras de la misma especie que contiene la superficie sin separación.
- Si falta `admission`, se mantiene la semántica anterior.
- Reglas Zod y validación del catálogo:
  - una superficie parcial exige revisión `pending`;
  - `includesStructureIds` solo se admite con `partial-surface`, de la misma especie y distinta de la propia estructura;
  - ningún nodo puede ser a la vez `visualNodes` y `meshMappings`.
- API v1 sin rupturas. OpenAPI **1.4.0** regenerado con `npm run docs:api`: solo añade dos propiedades opcionales en `models` y `model`. `test:contracts` pasa. Nota en `docs/api/README.md`.
- Nuevo modelo de catálogo `feline:tavernier-partial-surfaces`:
  - `scope: whole-body`, `regionId: null`;
  - `evidenceType: photogrammetry-derived-partial-surfaces`;
  - `fileEvidence` con hash y tamaño, `review.status: pending`.

  `modelIds` recíproco en las 5 fichas mapeadas. `search-index.json` se regeneró: `has3DModel` pasa a `true` en esas 5 fichas. `dataVersion` es `2026-10-31.4`.
- `feline:tavernier-skeleton` se conserva sin cambios: sigue disponible, con 0 mappings y su nodo `chat`.

## 3. Nodos → fichas (decisión)

| Nodo(s) | Ficha | Nota |
|---|---|---|
| `proposal-scapula-surface-yneg` / `-ypos` | `feline:scapula` | Dos semiespacios de escena → misma ficha; sin lado |
| `proposal-humerus-surface-yneg` / `-ypos` | `feline:humerus` | Ídem |
| `proposal-femur-surface-yneg` / `-ypos` | `feline:femur` | Ídem |
| `proposal-os-coxae-surface-yneg` / `-ypos` | `feline:os-coxae` | Ídem |
| `proposal-head-skeleton-surface-midline` | `feline:skull` | `includesStructureIds: ["feline:mandible"]`: la ficha avisa «Incluye Mandíbula sin separar.». La mandíbula **no** recibe `modelIds` |
| `proposal-antebrachium-radius-ulna-surface-*` | — (visual, no seleccionable) | Ver abajo |
| `proposal-crus-tibia-fibula-surface-*` | — (visual, no seleccionable) | Ver abajo |
| `unidentified-remainder` | — (visual, no seleccionable) | 45.977 caras sin identificar |

**Radio+cúbito y tibia+fíbula: visibles pero no seleccionables.**

- Mapearlas a `feline:radius` o `feline:tibia` abriría la ficha de un hueso aislado sobre una superficie que la segmentación declara expresamente «NO es radio aislado» / «NO es tibia aislada».
- En la crural, además, ni siquiera se sabe cuál de las superficies paralelas es tibia y cuál fíbula.
- No hay fichas de conjunto (antebrazo, pierna) en el catálogo, y no se crean sin fuente.

La cabeza sí se mapea: `feline:skull` (Cranium) es la ficha de grupo que la propia propuesta asigna, la mandíbula queda declarada como incluida y el aviso lo indica. Esto se debe revisar junto con las demás identidades.

No se asigna izquierda/derecha. `yneg/ypos` son semiespacios de escena y los ejes no están acreditados (ver §6 de la segmentación).

## 4. Interfaz

- **Home felina.** `workspaceAsset` prefiere, entre los activos corporales disponibles, el que tiene piezas seleccionables, es decir, el derivado. Sin él, vuelve al original. El modelo se ve completo: 13 superficies y el remanente, todos en la capa Huesos (captura `feline-partial-search-focus-*`).
- **Clic o toque en una superficie mapeada** (o un botón de la lista accesible «Piezas seleccionables del modelo», con una entrada por ficha y el rótulo «{nombre} · superficie parcial»). Al seleccionar:
  - se resaltan en verde azulado todas las mallas de esa ficha (ambos semiespacios);
  - se abre la ficha.
- **Aviso en la ficha** (`data-testid="partial-surface-notice"`, i18n ES/EN):
  - «Superficie parcial identificada · límites aproximados · revisión pendiente»;
  - con dos nodos, «Se resaltan 2 superficies de la escena vinculadas a esta ficha; no se asigna lado izquierdo ni derecho.»;
  - en la cabeza, «Incluye Mandíbula sin separar.» (en inglés, el nombre latino NAV).
- **Atribución visible.** Muestra obra, autor y licencia enlazados, el aviso de derivado y la línea «Superficies parciales seleccionables: límites aproximados, sin lado asignado.».
- **Por pieza:**
  - *Aislar*: oculta todo salvo las mallas de la ficha y encuadra la pieza.
  - *Ocultar y opacidad*: Herramientas → Capas → «Piezas del modelo», con un interruptor y un control deslizante por ficha. Se combinan con la capa: la opacidad se multiplica y se acota a 0,15–1. Ocultar la pieza seleccionada cierra la ficha.
- **Búsqueda → foco.**
  - Elegir una ficha mapeada desde la búsqueda global o desde la lista de fichas filtradas encuadra sus mallas visibles.
  - El encuadre mantiene la dirección de la cámara y salta de forma inmediata, sin animación.
  - Las cajas se calculan con los vértices **indexados**: todas las piezas comparten el búfer completo de posiciones, y `Box3.setFromObject` devolvía la caja del animal.
  - El encuadre sobrevive al cambio de tamaño que provoca la ficha y se anula con Restaurar.
  - El canvas expone `data-focus` y `data-camera-distance` para las pruebas.
- **Vistas y cortes anatómicos:** siguen deshabilitados (solo para la fixture técnica).

## 5. Verificación (salidas reales, 2026-10-31/11-01)

- `publish-partial-surfaces.ts`: SHA del export = regeneración; `issues: []`; nodos y conteos de la tabla de segmentación.
- `validate:viewer`: `feline:tavernier-partial-surfaces: GLB 4662896 bytes; 74235 triángulos; GPU estimada 4654644 bytes; 9 mappings válidos; revisión pending.`
- `validate:data`: 0 errores. `anatomy:validate`: APROBADO, 3 modelos disponibles.
- Unitarias: 178/178. Incluye:
  - `tests/unit/partial-surfaces.test.tsx`: manifiesto, mappings, catálogo, comparación de los GLB públicos, detección de un triángulo alterado y aviso ES/EN;
  - `camera-controls.test.ts`: caja indexada.
- E2E `tests/e2e/whole-body.spec.ts`, 3/3 (desktop, tablet y móvil emulados, WebGL SwiftShader, `next start` en el puerto 3100). Recorrido:
  1. lista de piezas → ficha con aviso;
  2. Aislar con foco;
  3. cabeza con «Incluye Mandíbula»;
  4. ocultar y opacidad por pieza;
  5. Vistas y Sagital deshabilitados;
  6. búsqueda «femur» → aviso, `data-focus=feline:femur` y distancia de cámara < 0,6 × la inicial;
  7. Restaurar anula el foco;
  8. canino sin cambios.
- `gate:full`: todo OK (lint, typecheck, test, validadores, integración, contratos, build).
- Capturas: `docs/phase3/screenshots/feline-partial-{isolated,search-focus}-{desktop,tablet,mobile}.png`.

**No verificado:**

- El clic directo sobre el canvas no está cubierto por E2E. La selección por raycast reutiliza el `select()` existente y la prueba usa la lista accesible equivalente.
- `tests/e2e/pilot-evidence.spec.ts` se actualizó (fémur: Aislar habilitado y aviso) pero **no se ejecutó**.
- Tampoco se ejecutaron `atlas.spec.ts` ni `ui-v2.spec.ts`.
- No se probó en dispositivos físicos. La emulación no los sustituye.

## 6. Límites y pendientes

- Los límites son cortes geométricos de propuesta, no límites articulares. Las zonas articulares, el autopodio y el resto quedan en el remanente.
- `scapula-surface-ypos` conserva un pequeño fragmento compatible con costilla (visible al aislar; ver captura).
- Las identidades son propuestas por posición en la cadena del miembro. Requieren revisión humana cualificada.
- La escala física y el lado siguen siendo `unknown`. Las medidas no están habilitadas.
- El encuadre por búsqueda que cambia de especie no se conserva tras cargar el otro activo.
- Sin despliegue público. La publicación del GLB en `public/` sirve a la aplicación local; no autoriza publicar la aplicación.
