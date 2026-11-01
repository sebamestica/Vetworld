---
name: scientific-field-evidence
description: Redactar o ampliar fichas anatómicas del catálogo con evidencia bibliográfica por campo (fieldEvidence), manteniendo campos pendientes, especies separadas y reviewStatus=pending.
---

# Evidencia científica por campo

Activar al crear o editar entradas de `data/anatomy/structures.json`, matrices de cobertura o tablas de afirmaciones. Complementa [anatomy-integrity](../anatomy-integrity/SKILL.md) (especie, nomenclatura, permisos) y [scientific-media-licensing](../scientific-media-licensing/SKILL.md) (imágenes); no repite sus reglas. Para nombres y direcciones usar [veterinary-terminology-nav](../veterinary-terminology-nav/SKILL.md).

## Contrato real (`src/modules/anatomy/schemas/catalog.ts`)

- `structureSchema` es estricto: no añadir claves fuera del esquema. `kind` admite solo `bone, muscle, tendon, ligament, joint, nerve, artery, vein, fascia, cartilage, organ`.
- `fieldEvidence` (opcional) es una lista de `{field, sourceId, locator, claim}`. `field` admite: `canonicalLatinName, spanishName, aliases, summary, detailedDescription, morphology, location, landmarks, function, attachments, vascularSupply, innervation, speciesDifferences`.
- `origin`, `insertion` y `action` solo en `kind: "muscle"`; en huesos usar `attachments`/`function` o dejarlos pendientes.
- `completeness: "partial"` exige `missingFields` no vacío; `"complete"` lo exige vacío.

## Validaciones que aplica `validate-catalog.ts`

- Un campo en `missingFields` debe estar ausente o vacío («campo pendiente ya presente»).
- Cada `fieldEvidence.field` debe tener valor no vacío («evidencia de campo ausente»).
- Cada `sourceId` debe estar en `sourceIds` de la ficha y la fuente en `data/anatomy/sources.json` debe listar la ficha en `supportedStructureIds` (reciprocidad; «evidencia de fuente no asociada» / «fuente sin respaldo recíproco»).

## Reglas de redacción

1. Una entrada de `fieldEvidence` por afirmación: fuente + localizador concreto (sección, página impresa, figura) + `claim` breve que diga qué respalda. Ejemplo existente en `feline:humerus`: `{"field":"detailedDescription","sourceId":"mahoney-feline-imaging-2012","locator":"The limbs, texto junto a Figure 16, primario indexado","claim":"Contenido supracondilar; ausencia supratroclear."}`.
2. Un campo puede tener varias evidencias (p. ej. `detailedDescription` con Reighard/Jennings y Mahoney). Una fuente histórica se coteja con NAV o literatura moderna y se indica en `review.notes`.
3. El localizador nunca apunta a rutas privadas: `tests/unit/field-evidence.test.ts` exige que ningún `locator` contenga `workbench/`. Citar la obra, no la copia local.
4. Sin evidencia, el campo no se escribe y va a `missingFields` (p. ej. `feline:femur`: `function, attachments, vascularSupply, speciesDifferences`). `function: []` vacío solo si también figura como pendiente.
5. `review.status` siempre `"pending"`; las notas dicen qué no está comprobado (lateralidad, identificación en el modelo, revisión humana).
6. Perro y gato separados: IDs `canine:*` y `feline:*`, fuentes por especie. No completar una ficha felina con datos caninos ni al revés, ni con anatomía humana. Las diferencias interespecíficas solo en `speciesDifferences` con fuente que compare explícitamente.
7. Grupos, componentes fusionados, series variables (vértebras caudales, costillas por tipo) y huesos condicionales (os penis) no reciben ficha `bone` que sugiera un hueso único o un recuento universal. Permanecen como filas `group`, `variable_series`, `conditional_bone`, etc. del inventario de referencia hasta acordar una representación.
8. Una ficha bibliográfica no implica geometría: `modelIds: []` si no hay malla admitida (los tests lo exigen para `feline:femur` y `feline:tibia`); el visor debe seguir mostrando «Modelo 3D no disponible» cuando corresponda.

## Archivos auxiliares

- `data/osteology/feline-evidence-coverage.json`: 323 referencias; `evidenceStatus` (`not_curated`/`curated_partial`), `geometryStatus`, `reviewStatus: "pending"`, `anatomicallyAcceptedBones: 0`. Se genera con `npx tsx scripts/osteology/generate-evidence-coverage.ts` (sin script npm; lee `workbench/segmentation/feline/pilot/surface-proposals.json`, solo local). Hoy reconoce únicamente las familias escápula/húmero/fémur/tibia: ampliar su mapa `families` al añadir fichas, y actualizar la cifra 8 de `tests/unit/evidence-coverage.test.ts` con el valor real.
- `data/osteology/research/feline-claims-*.json`: afirmaciones guía con `sourceUrl`, `locator`, `evidence`, `modelObservation`, `reviewStatus`. Son orientación bibliográfica (`productionCatalogUpdated: false`), no fichas ni identificación geométrica.
- `docs/phase3/feline-scientific-workbook.csv`: hoja de trabajo felina; mantener coherente con el catálogo.

## Cierre de un cambio

```bash
npm run anatomy:index     # regenera data/anatomy/search-index.json
npm run validate:data     # debe terminar con 0 errores; las advertencias de pendiente son esperadas
npm test                  # incluye field-evidence y evidence-coverage
```

Registrar fuentes nuevas en `docs/FUENTES_ANATOMICAS.md` y el lote en `docs/PROGRESO.md` con cifras reales (errores/advertencias). No declarar validación anatómica: una IA o la apariencia no sustituyen revisión humana cualificada.
