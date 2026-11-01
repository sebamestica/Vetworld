---
name: mesh-segmentation-workflow
description: Particionar de forma no destructiva, por índices de caras, la malla felina Tavernier (74.235 triángulos) mediante propuestas Zod, ROIs privadas y remanente íntegro, sin generar ni reparar anatomía ni admitir piezas sin revisión humana.
---

# Flujo de segmentación por caras

Activar al proponer, revisar o particionar regiones de una malla única. Leer antes `docs/phase3/segmentation-diagnostic.md`, `docs/phase3/pilot-execution-2026-10-10.md` y `docs/phase3/feline-complete-segmentation-plan.md`. Ejecución Blender: blender-headless-automation. Identidad, fuentes y revisión: anatomy-integrity. Ensamblaje y escala: skeleton-master-assembly.

**Prohibido** generar, cerrar, rellenar o reparar superficies para que una pieza parezca completa, nombrar componentes por tamaño o forma, y convertir una ROI geométrica en límite articular.

## Datos de partida (registrados)

- Fuente: `workbench/processing/feline/cat-skeleton/source/Chat.glb`, SHA-256 `c570679a…220783`, una malla/una primitiva, 74.235 triángulos, 73.207 vértices. Publicado como `/models/feline/tavernier-skeleton.glb` con un único nodo visual `chat` y cero `meshMappings` (`data/viewer/assets.json`).
- Contar componentes por índices (7.349) confunde costuras UV duplicadas con discontinuidad. `diagnose-segmentation.py` une vértices por posición coincidente (tolerancias 0, 1e-7, 1e-6, 1e-5): 75 componentes; el mayor tiene 73.217 caras (98,63 %). La separación automática por componentes no produce huesos.
- `workbench/segmentation/feline/feline_annotation.blend` guarda `source_face_index` cotejado por coordenadas exactas con el GLB. Exportar siempre ese atributo, nunca el índice de polígono de Blender.

## Pasos

1. **Seleccionar**: manualmente en el `.blend` y exportar con `export-selected-faces.py` (Text Editor de Blender), que rechaza selección vacía o del animal entero y escribe `selected-faces-<sha>.json` con `identityStatus: manual_selection_requires_identification_and_review`. Alternativa: ROIs por centro de cara y coordenadas de escena (`propose-pilot-surfaces.py`), declaradas como cortes arbitrarios de propuesta privada.
2. **Proponer**: JSON conforme a `segmentationReviewSchema` (`src/modules/anatomy/schemas/asset-review.ts`): `assetId`, `sourceSha256`, `triangleCount`, `status: draft`, `reviewer: null`, `groups[]` con `proposedStructureId` de la especie del activo, `canonicalLatinName`, `regionId`, `side`, `faceIndices`, `evidence[]` (cita + locator) y `notes`. Zod rechaza caras duplicadas, solapadas, fuera de rango o de otra especie. Plantilla vacía: `workbench/segmentation/feline/review-template.json` (tiene BOM; los CLI lo eliminan).
3. **Particionar en vista previa**: `npx tsx scripts/osteology/apply-segmentation-review.ts <json-en-workbench> --preview`. Verifica hash y conteo de la fuente, se niega con `groups` vacío y escribe `workbench/segmentation/feline/exports/proposal-<sha256>.glb` + `.json` con `flag: 'wx'` (sin sobrescritura). Sin `--preview` exige `status: human-reviewed` y registro de revisor dentro de `workbench/`.
4. **Inspeccionar**: `inspect-pilot-proposal.py` importa la propuesta, colorea nodos, comprueba `sum == 74235`, renderiza y guarda/reabre `.blend`. Comparar en varias vistas: ninguna cara perdida ni duplicada, vecinas intactas.
5. **Registrar** en `docs/PROGRESO.md` conteos por grupo, SHA-256 de la salida y limitaciones. Nada pasa a `public/`, mappings científicos ni API sin admisión.

## Invariantes de `partitionGlb`

`src/modules/anatomy/services/partition-glb.ts` reescribe solo índices de triángulos: conserva buffers, posiciones, UV, materiales y transformación del nodo; añade `unidentified-remainder` con todas las caras no asignadas (nombre reservado). Suma de caras de salida = caras fuente. Rechaza animaciones, skins, morphs, jerarquías, instancias, índices sparse y BIN externo. Pruebas: `npx vitest run tests/unit/asset-review.test.ts` (geometría sintética del test, no catálogo).

## Lateralidad

`side` admite `left | right | midline | unknown`. Usar `unknown` mientras no haya ejes del espécimen acreditados (craneal/dorsal/derecha documentados fuente → Blender → glTF). Una vista Y/Z o la simetría aparente no certifica lado.

## Cuatro estados de admisión por pieza

Definidos en el plan felino; aún no son un enum del esquema, por lo que cualquier cambio de contrato requiere documentación, Zod y pruebas.

1. **Dato bibliográfico registrado**: ficha con fuentes, sin malla (`modelIds` vacío).
2. **Superficie identificada parcial**: caras localizadas, sin hueso completo; la ficha lo declara.
3. **Hueso geométrico suficiente**: límites y superficie defendibles, con evidencia.
4. **Revisado anatómicamente**: solo por persona cualificada con registro; nunca por script, captura ni IA.

Hoy: tres ROIs privadas (350, 369, 562 caras) + remanente 72.954, cero huesos admitidos. `reviewStatus` permanece `pending`.

Verificar: hash fuente igual, caras sin solape, suma conservada, propuesta reabierta, estado y lado explícitos, ningún archivo publicado.
