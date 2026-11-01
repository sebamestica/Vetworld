# Rendimiento del visor (F11.1) — 2026-10-31

Agente A5. El GLB público no se modificó: `public/models/feline/tavernier-skeleton.glb` conserva SHA-256 `c570679a9f450c32aeded26c7b459993e984ee6fb01677170e4cd7cdf9220783` (comprobado con `sha256sum` tras los cambios). No se instalaron dependencias.

## Cambios en el visor

| Aspecto | Antes | Después |
|---|---|---|
| `frameloop` | `"demand"` (ya existía; cada cambio llama a `invalidate()`) | sin cambios |
| DPR base | `Canvas dpr={[1, límite]}` + `setDpr(min(dpr, límite, √(4 MP/área)))` en un efecto | misma fórmula en `adaptiveDpr()` (`src/modules/viewer/rendering.ts`), probada en unidad |
| Persistencia del límite de 4 MP | **Defecto**: R3F 9.8.1 (`configure`, `events-*.esm.js`) llama `setDpr(prop)` en cada render del `Canvas` si `viewport.dpr` difiere de la prop; el `setDpr` del efecto se perdía en el siguiente re-render (cambio de capa, selección…) | `Scene` informa el DPR calculado al `AnatomyViewer`, que lo pasa como número a `Canvas dpr`; prop y estado coinciden y el límite se conserva |
| DPR adaptativo | no | `Canvas performance={{ min: 0.5, debounce: 200 }}` + `OrbitControls regress` (drei 10.7.9): durante el giro/zoom el factor baja a 0,5 y se restablece 200 ms después del último cambio. DPR durante la interacción = `max(0,75, base × factor)`, sin superar la base |
| Liberación al desmontar | geometrías, materiales y texturas deduplicadas (`dispose`) | además `ImageBitmap.close()` en texturas decodificadas con `ImageBitmapLoader` |
| Diagnóstico | `data-dpr`, `data-quality`, `data-exposure` | además `data-geometries` y `data-textures` (`renderer.info.memory`, recuento de recursos vivos; no es VRAM). `data-dpr` se actualiza también al cambiar el DPR adaptativo |
| Límite de textura | `validateLoadedScene` rechaza > 4096 px por lado y suma `ancho×alto×4×4/3` al presupuesto de 100 MiB | verificado, sin cambios |
| Carga diferida | `next/dynamic(..., { ssr: false })` en `AppShell`; three/R3F van en el chunk del visor; fetch solo si `availability === "available"` | sin cambios. No hay GLB por región: la «carga diferida por región» del plan no es aplicable con un único activo corporal |

### Por qué no `PerformanceMonitor` ni `AdaptiveDpr` de drei

Ambos existen en drei 10.7.9 (`core/PerformanceMonitor.js`, `core/AdaptiveDpr.js`), pero:

- `PerformanceMonitor` muestrea en `useFrame`; con `frameloop="demand"` no hay frames en reposo y el intervalo entre el primer y el último frame incluye la pausa, de modo que calcularía FPS falsamente bajos y degradaría sin motivo.
- `AdaptiveDpr` fija `setDpr(performance.current × viewport.initialDpr)`; `initialDpr` es el primer valor resuelto desde la prop (sin el límite de 4 MP), y al desmontar restaura ese valor. Rompería el límite por área. Se usa el mismo mecanismo (`performance.current` + `regress`) con nuestra fórmula.

## Mediciones reales

- **Composición del GLB** (parser propio en Python, sin modificar el archivo): 3.765.488 B; JSON 1.636 B; BIN 3.763.824 B. `POSITION` 878.484 B (float32), `NORMAL` 878.484 B, `TEXCOORD_0` 585.656 B, índices 890.820 B (uint32, 222.705 índices = 74.235 triángulos, 73.207 vértices), imagen JPEG 530.378 B de 2048×2048. Sin `extensionsUsed`.
- **Compresión genérica**: `gzip -9` → 2.453.512 B (65,2 %); zlib nivel 6 → 2.455.759 B.
- **Servidor dev** (`curl.exe` desde Windows a `localhost:3000`): `Content-Type: model/gltf-binary`, `Content-Length: 3765488`, **sin `Content-Encoding`** pese a `Accept-Encoding: gzip, br`; `Cache-Control: public, max-age=0`. No se comprobó si `next start` comprime este tipo MIME.
- **Lighthouse / performance trace / renderer.info en navegador: no medidos.** El MCP `chrome-agente` respondió «The browser is already running for C:\dev\agent-hub\tools\browser\chrome-profile» en todos los intentos (perfil bloqueado por otra instancia) y Playwright está reservado al orquestador. No hay cifras de FPS, LCP, memoria ni DPR en ejecución; los atributos `data-geometries`/`data-textures`/`data-dpr` permiten medirlos en la siguiente pasada.

## Propuesta de compresión (no aplicada; requiere autorización y dependencia fijada)

Cifras **calculadas** a partir de los tamaños medidos, no producidas por ninguna herramienta:

| Opción | Efecto esperado | Cálculo | Requisitos |
|---|---|---|---|
| `KHR_mesh_quantization` (POSITION int16, NORMAL int8, UV int16) | menos bytes de red **y** de memoria de vértices | 878.484+878.484+585.656 = 2.342.624 B → 585.656+292.828+292.828 = 1.171.312 B (−1.171.312 B) | `gltf-transform` fijado; three lo lee sin decodificador; revisar precisión de posiciones sobre la escala real |
| `EXT_meshopt_compression` | menos bytes de red; misma memoria tras decodificar | no medido (gltfpack/gltf-transform no instalados) | decodificador `three/examples/jsm/libs/meshopt_decoder.module.js` servido local; `setMeshoptDecoder` en el visor |
| Índices uint16 | — | no aplicable: 73.207 vértices > 65.535 | — |
| KTX2 (ETC1S/UASTC) de la textura 2048² | reduce VRAM de textura | RGBA8 con mips ≈ 2048²×4×4/3 = 22,4 MB estimados; formato de bloque 4 bpp ≈ 2,8 MB, 8 bpp ≈ 5,6 MB | KTX-Software/`gltf-transform`, `KTX2Loader` + transcoder Basis local, `worker-src 'self' blob:` (ya en CSP) |
| Redimensionar textura a 1024² para `low` | reduce VRAM ≈ 4× | ≈ 5,6 MB estimados RGBA8 | derivado nuevo con hash propio; no sustituir el original |

Cualquiera de estas opciones produce un **derivado** con nuevo `sha256`, `byteSize` y `estimatedGpuBytes` en `data/viewer/assets.json`, conservando el original y los nombres de nodo (`chat`). Prioridad sugerida: medir primero con Lighthouse/trace en `localhost`; si la red domina, cuantización + meshopt; si la memoria en móvil domina, KTX2 o textura 1024² para `low`.

## Riesgo E2E

`tests/e2e/ui-v2.spec.ts:38` espera `data-dpr="1"` en calidad baja: se mantiene en reposo (base 1). Durante un arrastre el DPR puede bajar a 0,75 durante ≈ 200 ms; una captura tomada justo tras un gesto podría reflejarlo. No se ejecutó Playwright.

## Afirmaciones no verificadas

- Ganancia real de FPS o de tiempo de frame por el DPR adaptativo (sin medición en navegador).
- Liberación efectiva de memoria GPU (solo hay recuentos de `renderer.info`, sin VRAM medida).
- Resultados en dispositivos físicos: no ejecutados; cualquier medición futura con emulación debe reportarse como tal.
