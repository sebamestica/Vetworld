# Fixture técnica y manifiestos del visor

La escena propia `public/models/technical/interaction-demo.glb` contiene una esfera, un cubo, un toro y un cono. **No representa anatomía, proporciones, posición ni profundidad de tejidos.** Los mappings permiten comprobar selección → ficha API, sin atribuir identidad biológica a esas formas. No incrementa los modelos disponibles del catálogo científico. La especie pertenece al mapping, no a la geometría compartida; no hay espécimen y la revisión permanece `pending`.

## Procedencia y permisos

Autoría: geometrías paramétricas originales generadas para este proyecto mediante `scripts/generate-technical-glb.ts`; sin descarga, adquisición externa, textura ni reproducción de modelos científicos. El generador utiliza primitivas de Three.js, dependencia MIT; los parámetros y el contenedor GLB son propios. Se autoriza uso, modificación y redistribución de esta fixture técnica en el proyecto. No se atribuye una licencia científica ni validación veterinaria. Fuente local versionada: el script generador; archivo local: `/models/technical/interaction-demo.glb`. No existe página ni URL de adquisición externa.

Nodos estables: `demo-sphere`, `demo-box`, `demo-torus`, `demo-cone`. Cada manifiesto enlaza explícitamente estos nodos con las cuatro fichas de su especie y capas `skeleton`, `muscles-unclassified`, `nerves`, `tendons`; no se infiere musculatura superficial/profunda. Región de navegación: `thoracic-limb`, abarcando fichas de hombro y brazo.

## Medidas y transformación

- Tamaño GLB medido: **55.732 bytes**; **2.572 triángulos**.
- Memoria de buffers estimada: **52.512 bytes**. No es una medición de memoria GPU del dispositivo.
- Metros como unidad técnica, factor 1; +Y arriba y +Z hacia la cámara. Estas dimensiones no representan dimensiones animales.
- Cuadrícula de centros: `[-1.25,0.9,0]`, `[1.25,0.9,0]`, `[-1.25,-0.9,0]`, `[1.25,-0.9,0]`. Normales, índices y materiales PBR mates están incluidos, sin texturas ni compresión.
- SHA-256 y medidas reproducibles registrados en `data/viewer/assets.json`; ambos manifiestos comparten archivo/checksum. Límites: 12 MiB por archivo, 250.000 triángulos y 100 MiB de buffers estimados.

## Validación realizada

`npx tsx scripts/generate-technical-glb.ts` generó el archivo y manifiestos; `npx tsx scripts/validate-viewer-assets.ts` comprobó cabecera GLB v2, longitud, SHA-256, nodos únicos, buffers autocontenidos, triángulos, presupuesto y los ocho mappings frente a las fichas existentes. `npx vitest run tests/unit/viewer.test.ts`: **11/11 pruebas**, incluidos límites de descarga, URI embebidas/locales y contenido real de escena. `npx tsc --noEmit` y ESLint de archivos asignados: aprobados al integrar el visor. La comprobación real del Canvas, captura, raycasting y recorrido responsive corresponde a la evidencia de integración de fase 2; este documento no da esas comprobaciones por realizadas.

## Contrato e interacción

`AnatomyViewer` carga el mismo archivo una vez por URL durante un cambio de especie; el mapping se actualiza por props. Remontajes reutilizan caché HTTP con URL versionada por checksum; descarga con timeout de 15 segundos y lectura acotada por tamaño registrado. Comprueba SHA-256 antes de parsear y valida luego triángulos/buffers reales, nodos únicos y coordenadas/límites finitos. Limita referencias glTF al mismo origen `/models/`, con excepción de imágenes PNG/JPEG/WebP y buffers embebidos o blobs del mismo origen. Clona materiales y libera geometrías/materiales/texturas al sustituir archivo o desmontar. Canvas utiliza renderizado bajo demanda, DPR acotado, OrbitControls y selección por raycasting con umbral de movimiento de 5 píxeles. Mallas sin mapping u ocultas quedan excluidas de selección. Transparencia acotada a 0,15–1; aislamiento conserva la identidad. Botones suplementarios permiten selección por teclado, con estado visible `aria-pressed`; no sustituyen la comprobación de raycasting real.

WebGL ausente, contexto perdido y errores de archivo ofrecen estado textual y reintento, conservando fichas accesibles en la lista del frontend. Ningún estado visual acredita revisión anatómica humana.
