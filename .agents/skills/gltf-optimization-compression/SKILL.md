---
name: gltf-optimization-compression
description: Inspeccionar y, solo con beneficio medido y dependencia aprobada, optimizar GLB del atlas (gltf-transform, meshopt, Draco, KTX2) respetando presupuestos de bytes, triángulos y memoria, nodos seleccionables, hash y CSP.
---

# Optimización y compresión de GLB

Activar al evaluar peso, triángulos o memoria de un GLB, o al proponer compresión/LOD. Procedencia, originales y permisos: 3d-asset-pipeline. Medición en dispositivo: mobile-3d-qa. Selección en el visor: threejs-r3f-viewer-engineering. Esta skill no autoriza instalar nada.

## Estado real de herramientas (verificado)

- **No instalados** como dependencia directa ni CLI: `@gltf-transform/*`, `gltf-transform`, `gltfpack`, `toktx`/KTX-Software. `package.json` no los declara.
- En `node_modules` existen `draco3d@1.5.7` (transitiva de `three-stdlib`) y `meshoptimizer@1.1.1` (transitiva de `@types/three`). Que existan no significa que estén aprobados: no importarlos desde código del proyecto.
- `three` trae decodificadores en `three/examples/jsm/libs/` (`draco/`, `basis/`, `meshopt_decoder.module.js`), pero el visor solo usa `GLTFLoader` sin `DRACOLoader`, `KTX2Loader` ni `setMeshoptDecoder`: un GLB con `KHR_draco_mesh_compression`, `EXT_meshopt_compression` o `KHR_texture_basisu` fallaría hoy.
- Lo disponible: `npm run anatomy:inspect` (`scripts/anatomy/inspect-assets.ts`, parser GLB propio: triángulos, vértices, nodos, buffers, imágenes, URIs), `npm run validate:viewer` (`scripts/validate-viewer-assets.ts`), `scripts/anatomy/convert-assets.ts` (Three `GLTFExporter`/`SimplifyModifier`) y Blender `export_scene.gltf` (tiene `export_draco_mesh_compression_enable`).

Incorporar cualquier herramienta exige: autorización del usuario, versión exacta fijada (sin `^`), entrada en `docs/DECISIONES.md` con motivo y alternativa, y, si afecta al visor, decodificador local servido desde el mismo origen (sin CDN) más pruebas.

## Presupuestos

`VIEWER_BUDGET` en `src/modules/viewer/manifest.ts`: 12 MiB de archivo, 250.000 triángulos, 100 MiB de buffers+texturas. El manifiesto (`data/viewer/assets.json`) fija `byteSize`, `triangleCount`, `estimatedGpuBytes` y `sha256` exactos; el visor y `validate:viewer` rechazan discrepancias.

Distinguir tres cifras y no mezclarlas:

- **Bytes en disco/red**: tamaño del GLB (Tavernier: 3.765.488 B).
- **Estimación de VRAM**: `validateLoadedScene` (`src/modules/viewer/loading.ts`) suma buffers de atributos/índices + texturas como `ancho × alto × 4 × 4/3` (RGBA8 con mipmaps) y limita a 4096 px por lado. Ejemplo: la JPEG 2048×2048 de Tavernier ocupa 530.378 B en el archivo pero ≈ 22,4 MB estimados decodificada. `estimatedGpuBytes` del manifiesto solo suma `buffers[].byteLength` (incluye la imagen comprimida), no la textura decodificada.
- **Memoria medida**: solo con herramienta y equipo identificados (p. ej. trazas de Chrome); nunca presentar una estimación como medición.

Draco/meshopt reducen bytes de red, no VRAM (se decodifican). KTX2/Basis sí reduce VRAM de texturas. Elegir según el problema medido.

## Reglas

1. Trabajar sobre copia; el original y su SHA-256 se conservan. Derivados nombrados por hash, sin sobrescribir.
2. Conservar exactamente los nombres de nodo de `meshMappings` y `visualNodes`; no fusionar (`join`/`flatten`/`dedup` de mallas) estructuras seleccionables ni particiones del remanente.
3. Simplificación/LOD solo con medición previa y comparación visual; no simplificar regiones finas de modo que cambien rasgos anatómicos. No sustituir el master por una malla reducida.
4. No cambiar unidades, orientación ni transformaciones en silencio; registrarlas.
5. GLB autocontenido: `validate:viewer` rechaza `buffers[].uri`, y `safeResourceUri` solo admite `data:`/`blob:` del mismo origen y `/models/`.

## Después de optimizar

- Recalcular `byteSize`, `triangleCount`, `estimatedGpuBytes` y `sha256` y actualizar el manifiesto; `npm run validate:viewer` y `npm run anatomy:inspect`.
- Comprobar nodos únicos por mapping (`nodes.get(nodeId) === 1`) y selección real: `npx vitest run tests/unit/viewer.test.ts`, `npx playwright test tests/e2e/whole-body.spec.ts tests/e2e/embedded-texture.spec.ts`.
- CSP (`src/proxy.ts`): `connect-src 'self' blob:` ya permite que `ImageBitmapLoader` lea texturas embebidas por `blob:`; `worker-src 'self' blob:` existiría para decodificadores en worker. No añadir orígenes externos. Nota: `tests/e2e/atlas.spec.ts` aún espera `"connect-src 'self';"`, incompatible con la política actual; revisarlo antes de declarar e2e verde.
- Registrar antes/después (bytes, triángulos, estimación, medición si existe, herramienta y versión) en `docs/PROGRESO.md`.
