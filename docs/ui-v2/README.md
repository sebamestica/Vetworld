# UI V2 integrada

La aplicación conserva el diseño grafito de `atlas_veterinario_ui_v2.html`: logo sin texto, búsqueda superior, menú flotante izquierdo, visor central y panel contextual translúcido. El HTML original permanece intacto; se migró a componentes React, no se insertó como documento ni se incorporó su diccionario científico simulado.

## Abrir localmente

```powershell
cd C:\dev\Vetworld
npm ci
npm run dev
```

Abrir `http://localhost:3000`. Mantener la terminal abierta; `Ctrl+C` detiene el servidor. Si Next avisa que el puerto está ocupado, usar la URL que imprima. Para producción local: `npm run build` y luego `npm run start`.

La región inicial miembro torácico permite probar el GLB técnico y sus fichas. Buscar `bíceps`, `escápula` o el error tipográfico `scapulla`; se agrupan resultados de ambas especies. `masetero` no tiene ficha en el catálogo actual y no se inventa una. Menú → Capas/Vistas/Ajustes. Panel → Anatomía/Imágenes reales/Fuentes. En teléfono vertical, continuar o girar según recomendación.

## Funciones verificadas

- API real: especies, regiones por especie, fichas, relaciones, modelos y referencias.
- Raycasting, resaltado, aislamiento, visibilidad y opacidad; mallas ocultas/recortadas no seleccionables.
- Cámara libre, zoom/paneo, presets y clipping geométrico. Los cortes no generan tejido interno ni superficies de cierre.
- Color/hex/presets, contraste legible de superficies y textos, persistencia local, idioma de controles y tamaño de letra.
- Calidad modifica DPR, antialias y sombras del renderer, sin filtros CSS de brillo ni LOD ficticios.
- Búsqueda aproximada del backend, debounce y cancelación; voz opcional con aviso de posible procesamiento del navegador fuera del equipo, transcripción editable y sin selección automática.
- Fallback de GLB/WebGL, reintento, alternativas mediante buscador/fichas y galería con permisos.

## Límites

Sigue habiendo un GLB provisional de cuatro formas geométricas y cero modelos anatómicos académicos aprobados. Sus correspondencias abren fichas reales, pero no representan anatomía o un espécimen. No se afirma orientación anatómica de esa fixture; los presets y planos son cartesianos. Para un modelo científico futuro se requiere orientación revisada antes de habilitar planos/presets anatómicos.

Hay cuatro asociaciones académicas externas y cero fotografías internas autorizadas. Inglés traduce interfaz; los textos veterinarios conservan español/latín y aviso de traducción científica pendiente. Voz no está disponible en todos los navegadores; pruebas sintéticas y fallback, sin prueba con audio real. Chromium emula desktop/tablet/teléfono; Safari/Android físicos pendientes.

Warnings de Three.Clock y PCFSoftShadowMap proceden de compatibilidad del renderer/Three; no fueron errores críticos de aplicación en los recorridos aprobados. La librería aplica fallback PCF para sombras. No se modificó código de dependencias para silenciarlos. Auditoría de dependencias de producción: 0 vulnerabilidades; avisos de desarrollo previamente documentados siguen pendientes de actualización.

## Verificación

`npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:integration`, `npm run test:contracts`, validadores y build. Tras build: `npm run test:e2e` y `npm run test:smoke:production`. CI conserva suites del backend y añade UI.

Resultado local: unidad 99, HTTP 69, contratos 38, todos aprobados. E2E: 33/36 en corrida inicial; después de corregir recorridos móviles, cuatro casos repetidos aprobaron y completaron cobertura de las 36 combinaciones. Las primeras pruebas detectaron/corrigieron ready prematuro y pérdida de contexto durante cambio de calidad.

## Capturas comparativas

- [HTML aprobado, escritorio](screenshots/reference-desktop.png).
- [Aplicación integrada, escritorio](screenshots/result-desktop.png).
- [HTML aprobado, teléfono vertical](screenshots/reference-mobile.png).
- [Aplicación integrada, teléfono](screenshots/result-mobile.png).
- [Aplicación integrada, tablet](screenshots/result-tablet.png).

Mismos tamaños de Playwright; no se buscó una coincidencia de píxeles sustituyendo Canvas por el SVG del boceto. Los marcadores técnicos reemplazan la ilustración no validada y mantienen su rótulo provisional. Sin despliegue público.
