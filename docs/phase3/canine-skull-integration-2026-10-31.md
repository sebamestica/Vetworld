# Integración del cráneo canino Zenodo 10327538 — 2026-10-31

Fase F8, rama «activo abierto verificado». Revisión anatómica humana **pendiente**; nada de lo aquí descrito valida anatomía.

## Procedencia

| Campo | Valor |
|---|---|
| Título | Canis Familiaris (Dog) Skull |
| Autoría | agancz (Zenodo `creators`); `asset.extras.author` del GLB: «Abby Gancz (https://sketchfab.com/agancz)» |
| Espécimen | *Canis familiaris* macho, laboratorios de arqueología de UNC-CH (según la descripción del registro). Raza, edad y procedencia del ejemplar: no informadas |
| Método | Fotogrametría, 88 fotografías, Agisoft PhotoScan (según la descripción) |
| Publicación | Sketchfab (origen); Zenodo DOI [10.5281/zenodo.10327538](https://doi.org/10.5281/zenodo.10327538), `publication_date` 2016-02-04, comunidad 3dbigdataspace, «Source: Objaverse 1.0 / Sketchfab» |
| Página | https://zenodo.org/records/10327538 · origen https://sketchfab.com/3d-models/canis-familiaris-dog-skull-ebb0f8bf169745b4a3757abac29694c0 |
| Licencia | CC BY 4.0 en Zenodo (`license.id = cc-by-4.0`), en la API pública de metadatos de Sketchfab (slug `by`, verificación del orquestador) y en `asset.extras.license` del GLB. Modificación y redistribución permitidas con atribución e indicación de cambios |
| Archivo original | `workbench/incoming/canine/zenodo-10327538/ebb0f8bf169745b4a3757abac29694c0.glb`, 19.576.476 B, SHA-256 `2fbe3164a2aa0734cee4ce6309a834575ae162e45532ecd0804fef5ee7163ea1`, MD5 `b18d8193c61448a80a05536bd5ba89df` (coincide con Zenodo, verificación del orquestador). No modificado; SHA-256 recomprobado en esta sesión |

## Inspección del original (parser GLB propio, salida real)

- glTF 2.0, generador `Sketchfab-12.68.0`; sin `extensionsUsed`/`extensionsRequired`; un buffer embebido (19.569.770 B), sin URIs externas.
- Nodos: `Sketchfab_model` (matriz: rotación de ejes + traslación 0,405/0,0125/0) → `Canis familiaris.obj.cleaner.gles` → `Object_2` … `Object_7`.
- 6 mallas, 1 primitiva cada una, índices uint32: 116.316 + 109.116 + 109.186 + 104.267 + 89.509 + 58.218 = **586.612 triángulos**; 65.532 vértices en cinco de ellas (44.828 en la sexta). Las cajas envolventes de los seis fragmentos se solapan en todo el objeto: es la división GLES por límite de vértices, **no** una separación anatómica.
- 1 material `material_0` (baseColor con textura, metallic 0, roughness 0,6, doble cara). 1 textura JPEG **1024 × 1024** (610.810 B en archivo; estimación RGBA8 con mipmaps ≈ 5.592.405 B ≈ 5,33 MiB). Estimación, no memoria medida.
- Caja envolvente en coordenadas de malla: x −0,888…1,329, y −7,171…−5,983, z −0,450…0,506; diagonal 2,6906 unidades fuente.
- **Escala:** unidades de fotogrametría sin referencia métrica documentada → `unit: source-unverified`, `physicalScaleVerified: false`; medidas no habilitadas.
- **Cráneo/mandíbula:** tras soldar vértices, 28 componentes conexos: uno con 585.868 de 586.611 caras (99,87 %) y 27 fragmentos pequeños (≤ 106 caras). No hay mallas separadas identificables para cráneo y mandíbula; en las imágenes de inspección privadas no se aprecia una pieza mandibular individual, pero su presencia o ausencia queda para revisión humana. En consecuencia **no hay meshMappings** ni `structureIds`.

## Por qué se transformó

Presupuesto del visor (`VIEWER_BUDGET`, `src/modules/viewer/manifest.ts`): 12 MiB y 250.000 triángulos. El original lo excede en bytes (19,58 MB) y triángulos (586.612). La textura ya es pequeña: no se tocó.

## Transformaciones (scripts/anatomy/derive-zenodo-dog-skull.py, Blender 4.5.14 LTS)

Sobre la copia `workbench/processing/canine/zenodo-10327538/source/` (SHA-256 comprobado por el script antes de empezar):

1. Importación glTF con `merge_vertices=True` (suelda duplicados por costura UV dentro de cada fragmento).
2. Unión de los 6 fragmentos GLES en una malla (`agancz_dog_skull_scan`), conservando la jerarquía `Sketchfab_model` → `…cleaner.gles` y su transformación (exportada como rotación cuaternión + traslación equivalentes a la matriz original; comprobado a mano: misma matriz de rotación).
3. `remove_doubles` con 1e-6 unidades fuente: 359.598 → 293.346 vértices; se pierde 1 triángulo degenerado (586.611).
4. Decimación por colapso (`ratio` 0,34094, triangulación) a 199.999 triángulos; el exportador descartó 2 caras degeneradas (aviso «Mesh … is not valid») → **199.997** en el GLB.
5. Normales personalizadas eliminadas y sombreado suave calculado por Blender (no sobreviven fiablemente al colapso).
6. Exportación GLB sin Draco/meshopt/KTX2 ni extras. La imagen JPEG queda **byte a byte idéntica** (SHA-256 de la imagen embebida `076dbdec…1512` en original y derivado). Sampler: se omiten `wrapS/wrapT` = REPEAT, que es el valor por defecto (equivalente).
7. Reapertura del GLB exportado en Blender: 1 malla con el nombre esperado, 199.997 triángulos.

Desviación superficial medida (BVH, distancia al punto más cercano; unidades fuente / fracción de la diagonal 2,6906):

| Sentido | Muestras | Media | p95 | p99 | Máx. |
|---|---|---|---|---|---|
| derivado → original | 100.040 vértices | 9,87e-5 (3,7e-5) | 2,38e-4 (8,8e-5) | 3,02e-4 (1,1e-4) | 4,63e-4 (1,7e-4) |
| original → derivado | 293.346 vértices | 9,74e-5 (3,6e-5) | 2,42e-4 (9,0e-5) | 3,22e-4 (1,2e-4) | 1,67e-3 (6,2e-4) |

Mide distancia geométrica a vértices, no conservación de rasgos anatómicos concretos. Renders comparativos privados en `workbench/processing/canine/zenodo-10327538/inspection/` (original y derivado; sin diferencias visibles a esa resolución; una imagen no valida anatomía). Informe JSON: `workbench/processing/canine/zenodo-10327538/derived/agancz-dog-skull-200000.report.json`.

## Activo publicado

`public/models/canine/agancz-dog-skull.glb`: 6.678.652 B, SHA-256 `c63227d827a8ec33a217150e0a71cc9373a4889848abe4183bfd063cf8e334e4`, 199.997 triángulos, 114.568 vértices, buffers 6.676.952 B (`estimatedGpuBytes`); estimación con textura decodificada ≈ 6,68 MB + 5,59 MB. `public/models/canine/ATTRIBUTION.txt` indica autoría, licencia y cambios.

Registros: `data/viewer/assets.json` y `data/anatomy/models.json` id `canine:agancz-skull-scan` (regionId `head`, scope `regional`, review pending, availability available, `visualNodes` = `agancz_dog_skull_scan`/`skeleton`, `meshMappings` vacío); fuente `agancz-dog-skull-zenodo` en `data/anatomy/sources.json` (`supportedStructureIds` vacío). **No** se añadió a `canine:skull.modelIds`: el contrato lo permitiría (región `head`), pero exigiría afirmar qué estructuras cubre el escaneo (p. ej. con o sin mandíbula), lo que corresponde a la revisión humana.

El manifiesto incorpora `credit {work, author, licenseName}` y una regla: un activo científico `available` exige `attribution`, `sourceUrl`, `licenseUrl` y `credit`. `src/modules/viewer/selection.ts` añade `workspaceAsset()` (corporal → regional de la región elegida → único regional con «Todo el animal», marcado `partial`) y `assetCredit()`.

## Cambio de UI pendiente (no aplicado: archivos de otro agente)

La home sigue mostrando «Modelo 3D no disponible» para el perro hasta aplicar, juntos, los dos cambios (aplicar solo el primero mostraría un CC BY sin atribución):

1. `src/hooks/useAnatomyWorkspace.ts`: sustituir la rama no técnica de `baseAsset` por `workspaceAsset(viewerAssets, speciesId, regionId, new Set((modelQuery?.data?.data ?? []).filter(m => m.availability === 'available').map(m => m.id)))?.asset`, y exponer `assetCoverage` (`'whole-body' | 'region' | 'partial'`).
2. `src/components/layout/AppShell.tsx`: sustituir la condición `data.asset?.scope === 'whole-body'` y el texto fijo «Cat Skeleton · Tavernier Amaury» / «CC BY-NC-SA 4.0» por `assetCredit(data.asset)` (`label`, `licenseName`, `sourceUrl`, `licenseUrl`), conservando `data-testid="asset-attribution"`, `scaleUnverified` y `regionFilterNotice` (este solo con cobertura `whole-body`). Con cobertura `partial` añadir un aviso i18n nuevo, p. ej. «Solo se dispone del cráneo; resto del cuerpo: Modelo 3D no disponible» / «Only the skull is available; rest of the body: 3D model not available». Para el canino conviene además indicar «derivado modificado» (CC BY exige indicar cambios; ya consta en `attribution` y en ATTRIBUTION.txt).

Las E2E que esperan «Modelo 3D no disponible» para el perro deberán actualizarse con ese cambio.

## Límites

Escala física, ejes anatómicos (vistas/clipping siguen deshabilitados para activos científicos), cobertura (cráneo y/o mandíbula, dentición), identificación ósea y revisión humana: pendientes. No se midió rendimiento ni memoria GPU en dispositivos. Sin despliegue público.
