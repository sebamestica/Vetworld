# Integración corporal: primer lote

Página principal inicia en felino / Todo el animal. Usa el GLB original de Tavernier, con 3.765.488 bytes y 74.235 triángulos; textura JPEG embebida 2048 × 2048. No se alteró geometría, escala, orientación ni materiales fuente. La cámara encuadra el conjunto sin normalizar su talla. La escala física permanece desconocida.

El manifiesto distingue `visualNodes` (visibles, controlables por capas, no seleccionables) de `meshMappings` (fichas identificadas). El nodo `chat` pertenece a la capa esqueleto, sin ID de hueso ficticio. Se puede rotar, acercar, desplazar, ocultar/restaurar el conjunto y variar transparencia. Búsqueda y fichas siguen consumiendo API; aislamiento y selección ósea están deshabilitados cuando no hay malla identificada. Regiones filtran fichas y conservan el conjunto sin segmentar, con aviso. Vistas y clipping anatómicos deshabilitados hasta comprobar ejes/segmentación.

UI V2 conservada. Se muestra atribución enlazada, licencia CC BY-NC-SA 4.0 y aviso de escala/cobertura/selección pendientes. El canino devuelve ausencia real del modelo corporal; no se sustituye por un fragmento ni una fixture en la página principal. `/technical-demo` conserva la fixture sintética rotulada para recorridos de selección y recuperación, separada del catálogo científico. Usa render dinámico para respetar CSP con nonce.

Activos regionales sin permiso comprobado, originales y derivados, movidos a `workbench/quarantine/`, privados. API declara los modelos `unavailable`, URL/evidencia de publicación nulas y licencia sin verificar. Se conservan sus fichas/metadatos y los cambios de catálogo ya presentes al comenzar; copia previa en `workbench/phase3/before-integration/`. El historial Git previo no se purgó. El conversor regional general bloquea ejecución si faltan derechos por archivo; no ejecutar conversores individuales/reconciliadores antiguos para readmitir activos sin nueva auditoría.

Presupuesto de archivo 12 MiB y 250.000 triángulos; runtime limita texturas a 4096 × 4096 y buffers + estimación de texturas con mipmaps a 100 MiB. La textura felina supone aproximadamente 21,33 MiB RGBA con mipmaps; los 3,59 MiB informados por el inspector son buffers/archivo embebido, NO memoria GPU total medida. No se midieron FPS, memoria de GPU física ni teléfonos reales. Renderer on-demand y calidad DPR/sombras existentes conservados.

## Inicio local

```powershell
cd C:\dev\Vetworld
npm run dev
```

Abrir http://localhost:3000 . Para producción: `npm run build`, después `npm run start`. Para pruebas: `npm test`, `npm run test:integration`, `npm run test:contracts`, `npm run validate:data`, `npm run validate:viewer`, `npm run lint`, `npm run typecheck`, `npm run test:smoke:production` y `npm run test:e2e` tras build. Smoke producción crea instancia aislada real, sin reutilizar dev.

## Pendientes

Capturas verificadas: [escritorio](screenshots/feline-desktop.png) y [móvil emulado](screenshots/feline-mobile.png). Modelo de Tavernier Amaury, CC BY-NC-SA 4.0; imágenes derivadas conservan atribución. Pruebas finales: 111 unitarias, 69 HTTP, 38 contratos, 18 smoke de producción y 39 Playwright aprobadas. Build, lint y TypeScript aprobados. Las corridas iniciales con fallos están descritas en PROGRESO; el conjunto final se ejecutó íntegramente.

Segmentación felina, identificación científica por hueso, medidas del espécimen, ejes anatómicos, cobertura exhaustiva y revisión humana. Permiso web canino, registro y ensamblaje. No hay dos esqueletos completos individualizados ni nueva fotografía de disección. Integración visual del candidato no cierra la fase científica. Sin despliegue público.
