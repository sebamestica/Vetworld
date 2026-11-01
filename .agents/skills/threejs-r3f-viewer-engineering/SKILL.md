---
name: threejs-r3f-viewer-engineering
description: Modificar el visor Three.js/React Three Fiber del atlas siguiendo sus patrones reales de carga verificada, mappings explícitos, selección filtrada, capas, clipping, cámara, liberación de recursos, pérdida de contexto y DPR adaptativo.
---

# Ingeniería del visor Three.js / R3F

Activar al tocar `src/components/viewer/AnatomyViewer.tsx` o `src/modules/viewer/*.ts`. Criterio visual y de materiales: realistic-anatomical-rendering. Pruebas táctiles y responsive: mobile-3d-qa. Versiones: three 0.186.1, @react-three/fiber 9.8.1, @react-three/drei 10.7.9, Next 16.4 (leer `node_modules/next/dist/docs/` antes de cambiar APIs de Next). No alterar la UI V2.

## Mapa de módulos

- `src/components/layout/AppShell.tsx`: `dynamic(() => import('@/components/viewer/AnatomyViewer'), { ssr: false, loading })`. El visor es `"use client"` y nunca se renderiza en servidor; no importar three en componentes de servidor.
- `src/modules/viewer/manifest.ts`: `viewerAssetSchema` (Zod estricto) y `VIEWER_BUDGET`. `assets.ts` parsea `data/viewer/assets.json`.
- `loading.ts`: `readBoundedBody`, `safeResourceUri`, `validateLoadedScene`.
- `visibility.ts`: `meshPresentation` (visibilidad, opacidad, mapping).
- `controls.ts`: `viewDirection`, `cameraFrame`, `zoomDistance`, `clippingPlane`.
- `rendering.ts`: `updateCameraRange`, `updateRendererExposure` (expone `data-dpr`, `data-quality`, `data-exposure` en el canvas para pruebas).

## Carga

Secuencia en `AnatomyViewer`: si `availability !== "available"` mostrar «Modelo 3D no disponible» sin fetch → `fetch(resourceUrl?v=sha256, {cache: "force-cache"})` con `AbortSignal.any([controller, AbortSignal.timeout(15_000)])` → `readBoundedBody` (exactamente `byteSize`) → SHA-256 con `crypto.subtle` → `LoadingManager` con `setURLModifier(safeResourceUri)` y `onError` que marca fallo → `GLTFLoader(manager).parseAsync` → si hubo fallo de recurso, error (no declarar «Visor listo» con texturas perdidas) → `validateLoadedScene` → clonar materiales y liberar originales. Cancelación: bandera `cancelled` + `abort()`; si la carga termina tras desmontar, `dispose(loaded)`.

## Identidad y selección

- `meshMappings` (`nodeId → structureId, layerId`) dan identidad seleccionable; `visualNodes` (`nodeId → layerId`) solo se muestran (p. ej. `chat` de Tavernier) y nunca abren ficha. No inferir estructura del nombre del nodo. El manifiesto exige `structureId` con prefijo de la especie y nodo único (`validateLoadedScene`: `nodes.get(nodeId) === 1`).
- `select()` descarta arrastres (`event.delta > 5`), mallas sin mapping, mallas no visibles según `meshPresentation` y puntos del lado recortado (`plane.distanceToPoint(point) < 0`). No confiar en que el raycast ignore objetos ocultos: filtrar siempre con `meshPresentation`.
- Alternativa accesible: botones por mapping (`meshButtons`), deshabilitados si la malla no está visible.

## Capas, aislamiento, resaltado

Un `useEffect` recorre la escena y aplica `meshPresentation`: visible si la capa lo está y, con aislamiento, solo la estructura aislada; opacidad acotada a 0,15–1 con `transparent`/`depthWrite` coherentes. Resaltado por `emissive` `#087e83` (0,65) en `MeshStandardMaterial`. Los materiales están clonados por carga, por lo que mutarlos no contamina otros activos. Tras cada cambio, `invalidate()` (`frameloop="demand"`).

## Cámara y clipping

- `cameraFrame` encaja la esfera envolvente según FOV y aspecto; fija `minDistance/maxDistance` de `OrbitControls` (drei, `makeDefault`, damping) y `near/far` vía `updateCameraRange`. Re-encuadre por `resetToken`, `viewToken`, tamaño y escala (`scene.scale.setScalar(scaleToMeters)`).
- Presets y planos de corte solo para `purpose === "technical_demo"`: los ejes de `controls.ts` son cartesianos de la fixture, no orientación anatómica. Activos científicos usan `free` y sin clipping hasta documentar ejes.
- Clipping local: `Canvas gl={{ localClippingEnabled: true }}`, `material.clippingPlanes` + `clipShadows`.
- Zoom por botones: `zoomRequest {token, delta}` → `zoomDistance` dentro de los límites.

## Recursos, contexto y calidad

- `<primitive object={scene} dispose={null}>`: R3F no libera la escena; lo hace `dispose()` del componente (geometrías, materiales y texturas deduplicadas) al cambiar de URL, cancelar o fallar.
- `webglcontextlost`: `preventDefault()` y estado de fallo con mensaje que remite a las fichas; recuperación por «Reintentar visor» (incrementa `retry` y remonta `CanvasBoundary`). No hay manejo de `webglcontextrestored`. Errores de render los captura `CanvasBoundary`.
- DPR: `Canvas dpr={[1, low?1:high?2:1.5]}` y `setDpr(min(devicePixelRatio, límite, sqrt(4e6 / (ancho×alto))))` para acotar ~4 MP. `Canvas key={quality}` remonta al cambiar calidad; sombras y antialias desactivados en `low`; `powerPreference: "low-power"`.
- `onReady` reporta triángulos y renderizador (`WEBGL_debug_renderer_info` si existe); `onSceneReady` se emite tras el primer frame con cámara encajada.

## Verificar

`npx vitest run tests/unit/viewer.test.ts tests/unit/camera-controls.test.ts`, `npm run validate:viewer`, `npm run typecheck`, `npm run lint` y e2e pertinentes (`tests/e2e/whole-body.spec.ts`, `embedded-texture.spec.ts`, `ui-v2.spec.ts`). Inspeccionar captura real y consola sin errores de `GLTFLoader`/CSP. Emulación y SwiftShader no sustituyen dispositivos físicos.
