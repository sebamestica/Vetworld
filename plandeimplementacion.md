# Plan de implementación — cierre del Atlas Veterinario 3D

Fecha: 2026-10-31 · Rama: `main` · Último commit: `c441491` · Autor del plan: Claude (Opus 5.5)

Este plan sirve para trabajar de forma autónoma y prolongada, por ejemplo toda una noche, con varios agentes de Claude en paralelo. Respeta `AGENTS.md`, que manda sobre cualquier línea de este documento. Antes de empezar se leen [progreso](docs/PROGRESO.md), [roadmap](docs/roadmap.md), [arquitectura](docs/architecture.md) y los planes de fase 3 ([pendientes](docs/phase3/anatomical-pending-plan.md), [despiece felino](docs/phase3/feline-complete-segmentation-plan.md), [integración](docs/phase3/implementation-plan.md)).

---

## 0. Qué significa «terminar» (leer primero)

Lo que se puede terminar sin terceros: todo el software (visor, API, búsqueda, panel, galería, capas, rendimiento, accesibilidad, i18n, pruebas, documentación), las fichas bibliográficas con evidencia por campo, la segmentación privada de superficies felinas, el trabajo privado canino en Blender y los paquetes de revisión y permisos ya listos para enviar.

Lo que no se puede terminar sin terceros, y por eso no se declara completo:

| Bloqueo | Depende de | Qué se hace igualmente |
|---|---|---|
| Revisión anatómica humana cualificada | Veterinario/anatomista | Paquete de revisión completo; `reviewStatus=pending` en todo |
| Licencia web del esqueleto canino (3DExport 285869) | Autor/usuario | Borrador de solicitud; trabajo solo privado; canino web = «Modelo 3D no disponible» |
| Escala métrica felina (Tavernier) | Medidas del espécimen | Escala `unknown`; medidas deshabilitadas en la UI |
| Volúmenes CT felinos (ZIP de 51 GB, cráneos) | Autorización del usuario para descargar | Registrar candidato; no descargar sin un sí explícito |
| Despliegue público | Autorización explícita | Build de producción local y smoke aislado únicamente |

El criterio de «fin» de esta tanda nocturna es el **Nivel N3** de la sección 9. Los niveles N4 y N5 necesitan los desbloqueos de la tabla.

---

## 1. Permisos operativos para la sesión nocturna

Si el usuario aprueba este plan, el agente orquestador **puede, sin volver a preguntar**:

- Leer cualquier archivo del proyecto, `workbench/`, `.tools/` y `C:\dev\agent-hub` (MCP de navegador `chrome-agente`).
- Crear, editar y borrar código, datos, pruebas y documentación dentro de `C:\dev\Vetworld`.
- Ejecutar todos los scripts de `package.json`, Playwright, Vitest, Blender portable `.tools/blender-4.5.14/blender-4.5.14-windows-x64/blender.exe` en `--background`, y scripts Python/TS propios en `scripts/`.
- Lanzar subagentes de Claude (Agent tool, forks, `isolation: "worktree"`) y/o la herramienta Workflow para orquestarlos; usar `/loop` o ScheduleWakeup para continuar mientras quede trabajo.
- Hacer búsquedas web (WebSearch/WebFetch) de fuentes bibliográficas y de activos con licencia abierta, y usar el navegador `chrome-agente` para hacer QA de `localhost`.
- Hacer `git commit` y `git push` (sin fuerza) a `origin/main` después de cada hito verificado.
- Instalar dependencias npm de desarrollo o runtime **gratuitas y con licencia OSI** cuando una fase lo justifique, por ejemplo `meshoptimizer` o `gltf-transform` para compresión, fijando la versión exacta y registrándola en `DECISIONES.md`.

**Prohibido aunque se apruebe el plan:** gastar dinero o contratar servicios; desplegar en Vercel u otro host público; hacer force push o reescribir la historia; repetir peticiones que dieron HTTP 403/401 o eludir captchas y barreras; descargar activos cuya licencia no esté verificada por activo; descargar el ZIP CT de 51 GB; enviar correos o solicitudes a terceros; cambiar `reviewStatus` a otro valor distinto de `pending`; modificar `atlas_veterinario_ui_v2.html` (SHA-256 `2412B2DF…650BB`); publicar en `public/` derivados caninos de 3DExport; inventar anatomía, medidas, licencias o resultados de pruebas.

---

## 2. Equipo de agentes (8 roles, ≥6 en paralelo)

Cada agente es dueño de ciertos archivos. Fuera de su zona solo propone cambios, y el orquestador los integra. **Ajuste 2026-10-31:** no se usan worktrees porque `node_modules` (instalado en Windows) y `workbench/` (ignorado) no viajan a ellos; todos trabajan en la copia principal con propiedad estricta, y solo A0 ejecuta `build`, `test:e2e` y `gate:full`. Desde WSL, npm se ejecuta con `scripts/qa/win.sh`.

| # | Rol | Tipo / aislamiento | Dueño de (escribe) | Solo lee |
|---|---|---|---|---|
| A0 | **Orquestador / integrador** (sesión principal) | principal | `docs/PROGRESO.md`, `docs/DECISIONES.md`, `docs/ESTADO_ACTUAL.md`, `plandeimplementacion.md`, `docs/plan/bitacora-noche.md`, merges, commits | todo |
| A1 | **Modelador felino** (Blender, segmentación) | general-purpose · worktree | `scripts/osteology/*.py` nuevos, `workbench/segmentation/feline/**`, `data/osteology/diagnostics/feline*.json`, `data/osteology/proposals/feline/**` | catálogo, skills 3D |
| A2 | **Modelador canino** (Blender, privado) | general-purpose · worktree | `workbench/masters/candidates/canine/**`, `workbench/processing/canine/**`, `data/osteology/diagnostics/canine.json`, `docs/phase3/canine-*.md` | originales caninos (solo lectura) |
| A3 | **Redactor científico felino** | general-purpose · worktree | `data/anatomy/structures.json` (entradas `feline:*`), `data/osteology/feline-evidence-coverage.json`, `docs/phase3/feline-scientific-workbook.csv`, `data/osteology/research/feline-*` | NAV local `workbench/references/nav6.txt` |
| A4 | **Redactor científico canino + fuentes** | general-purpose · worktree | entradas `canine:*` del catálogo, `data/osteology/canine-evidence-coverage.json` (nuevo), `docs/FUENTES_ANATOMICAS.md`, `data/anatomy/sources.json` | idem |
| A5 | **Ingeniero frontend/visor/API** | general-purpose · worktree | `src/**`, `data/viewer/**`, `docs/api/**`, `docs/phase3/viewer-integration.md` | datos científicos |
| A6 | **Ingeniero de QA y pruebas** | general-purpose · worktree | `tests/**`, `scripts/validate-*.ts`, `playwright.config.ts`, `docs/api/testing.md` | todo |
| A7 | **Revisor adversarial de integridad y licencias** | general-purpose (solo lectura + informe) | `docs/plan/revisiones/*.md` | todo; nunca edita datos |

Reglas de coordinación:

1. **Un dueño por archivo.** Si A3 y A4 tocan `structures.json`, A3 escribe un parche de lote `data/anatomy/_batches/feline-<lote>.json`, A4 escribe `canine-<lote>.json`, y A0 los fusiona con un script determinista (fase F1). Así se evitan los conflictos en el JSON central.
2. **Brief mínimo:** cada agente recibe objetivo, archivos propios, criterio de aceptación de su fase, skills que debe leer (`.agents/skills/...`) y lo que ya está descartado (403, CT de 51 GB, licencia canina).
3. **Informe estructurado:** cada agente termina con: archivos cambiados, comandos ejecutados con su salida real, pruebas aprobadas y fallidas, pendientes y bloqueos. Lo que no se ejecutó se declara como no ejecutado.
4. **A7 revisa cada lote antes del commit**, sin ver la conclusión del autor (solo el diff y las fuentes). Si encuentra una afirmación sin evidencia, el lote no se integra.
5. **A6 es la puerta de calidad:** ningún merge sin `lint`, `typecheck`, `test`, `validate:data` y los validadores en verde.
6. **Presupuesto:** como máximo 6 o 7 agentes simultáneos. No se relanzan agentes para trabajo ya completado (regla de AGENTS.md). Si un agente falla dos veces en lo mismo, se registra un bloqueo y se sigue con otra cosa.

Paralelismo típico por oleada: A1 + A2 + A3 + A4 + A5 + A6 en paralelo, y A7 detrás revisando lo que sale. A0 integra entre oleadas.

---

## 3. Mapa de fases y dependencias

```
F0 Saneamiento ─► F1 Infra multiagente ─┬─► F2 Fichas felinas (A3) ──────────┐
                                        ├─► F3 Segmentación felina (A1) ─────┼─► F5 Selección científica (A5) ─┐
                                        ├─► F4 Escala/orientación (A1/A3) ───┘                                 │
                                        ├─► F6 Fichas caninas + fuentes (A4) ─┐                                │
                                        ├─► F7 Canino privado Blender (A2) ───┴─► F8 Canino en visor (A5) ─────┤
                                        ├─► F9 Capas/sistemas/tejidos (A5+A3/A4) ──────────────────────────────┤
                                        ├─► F10 Galería y medios (A4+A5) ──────────────────────────────────────┤
                                        └─► F11 Rendimiento/a11y/i18n (A5+A6) ─────────────────────────────────┤
                                                                                                               ▼
                         F12 QA integral (A6) ─► F13 Revisión adversarial (A7) ─► F14 Paquetes externos ─► F15 Cierre
```

---

## 4. Fases detalladas

Cada fase incluye: **objetivo · agentes · tareas · aceptación · verificación · commit**. Al terminar una fase se escribe una entrada en `docs/PROGRESO.md` con evidencia real y una línea en `docs/plan/bitacora-noche.md`.

### F0 — Saneamiento y línea base (A0, A6) · ~30 min

Objetivo: partir de un árbol limpio y una línea base medida.

1. Los 27 archivos que aparecen como modificados **solo difieren en finales de línea** (`git diff --ignore-cr-at-eol` vacío). Se añade `.gitattributes` (`* text=auto eol=lf`, binarios `*.glb *.blend *.png *.stl *.zip *.rar binary`), se normaliza y se comprueba que el diff semántico sigue vacío. Si aparece cualquier diff real, se detiene y se registra.
2. `docs/ESTADO_ACTUAL.md` (sin seguimiento) está desactualizado: dice 3 modelos integrados del 2026-10-08, y eso fue corregido después. Se reescribe a partir de PROGRESO.md hasta el 2026-10-10 (Tavernier felino corporal, permisos retirados, 46 fichas, piloto privado) o se elimina. No se dejan dos verdades.
3. Se verifican los hashes: HTML aprobado `2412B2DF…` y GLB Tavernier `c570679a…`.
4. Línea base: `npm ci` si hace falta, `lint`, `typecheck`, `test`, `test:integration`, `test:contracts`, `validate:data`, `validate:viewer`, `validate:media`, `anatomy:validate`, `osteology:validate`, `build`, `test:smoke:production`, `test:e2e`. Se guardan en `docs/plan/linea-base-2026-10-31.md` con números reales.
5. Se comprueba que Blender portable arranca en `--background` desde WSL (ruta `.exe` vía interop). Si no arranca, se registra y las fases de modelado usan solo los scripts TS headless.

Aceptación: árbol limpio, línea base registrada (con fallos incluidos), Blender comprobado. **Commit:** `chore: normalizar finales de línea y registrar línea base`.

### F1 — Infraestructura para trabajo paralelo (A0, A6) · ~45 min

1. Script `scripts/anatomy/merge-batches.ts`: fusiona `data/anatomy/_batches/*.json` en `structures.json` de forma determinista y ordenada, rechaza IDs duplicados o especies mezcladas, mantiene `reviewStatus=pending` y valida con Zod.
2. Plantilla de lote y de informe de agente en `docs/plan/plantillas/`.
3. `docs/plan/bitacora-noche.md` con una tabla de fases y estado (pendiente / en curso / verificada / bloqueada).
4. Script `scripts/qa/gate.ts` (o `npm run gate`) que encadena lint, typecheck, test, validadores y osteology:validate, y devuelve el resumen y el código de salida.
5. Pruebas unitarias de merge-batches con fixtures explícitas.

Aceptación: `npm run gate` en verde y merge de lotes probado. **Commit.**

### F2 — Fichas científicas felinas por lotes (A3, revisa A7) · varias horas

Base: `feline-scientific-workbook.csv` (323 filas), `feline-evidence-coverage.json` y `feline-claims-2026-10-10.json`. Fuentes ya usadas: NAV 6.ª local, Reighard/Jennings, Mahoney 2012, pelvis 2018 CC BY 4, micro-CT carpal 2026, esternón 2023, AVDC, cavidad nasal 2024.

Lotes, en orden:

1. **L-F1 Miembro torácico:** clavícula (vestigial), escápula ✓, húmero ✓, radio, cúbito, carpianos (con su fusión felina), metacarpianos I–V, falanges, sesamoideos.
2. **L-F2 Miembro pélvico:** coxal (ilion/isquion/pubis), fémur ✓, rótula, tibia ✓, peroné, tarsianos, metatarsianos, falanges.
3. **L-F3 Columna:** vértebras cervicales C1, C2 y C3–C7 como serie; torácicas, lumbares, sacro y caudales como **series variables sin total universal**.
4. **L-F4 Tórax:** costillas (verdaderas, falsas y flotantes como grupos), esternebras y cartílagos.
5. **L-F5 Cráneo:** neurocráneo, esplacnocráneo, mandíbula, hioides, huesecillos del oído; dientes según la fórmula felina (30, registrados como referencia).
6. **L-F6 Especiales:** os penis (condicional por sexo) y variantes.

Por ficha: nombre latino NAV, sinónimos ES/EN, tipo (hueso / componente fusionado / grupo / serie / condicional / diente), región, sistema, descripción, accidentes, articulaciones y relaciones **solo con `fieldEvidence` específico** (fuente + localizador + afirmación). Los campos sin evidencia quedan `pending`. Nunca se completa por analogía canina.

Aceptación por lote: `validate:data` con 0 errores, A7 sin hallazgos bloqueantes, índice de búsqueda regenerado (`anatomy:index`), pruebas de reciprocidad en verde. **Un commit por lote.**

### F3 — Segmentación felina privada por lotes (A1) · varias horas

Base: `workbench/segmentation/feline/feline_annotation.blend` (74.235 caras con `source_face_index`), herramientas de propuesta y partición no destructiva ya construidas, piloto húmero/fémur/tibia (350/369/562 caras).

1. Se refinan las tres hipótesis del piloto: límites por curvatura y conectividad local más ROIs, con capturas ortogonales por pieza.
2. Se extiende a huesos grandes visibles: escápula, radio/cúbito como conjunto si no son separables, coxal, cráneo y mandíbula.
3. Cada propuesta se clasifica en uno de los cuatro estados del plan felino: *dato bibliográfico* · *superficie identificada parcial* · *hueso geométrico suficiente* · *revisado* (este último nunca se marca automáticamente).
4. Lateralidad: solo si los ejes se acreditan. Si no, `side=unknown`.
5. Remanente íntegro: la suma de caras siempre es 74.235. El GLB original no se toca.
6. Exportación privada `workbench/segmentation/feline/exports/*.glb` + hash + render de verificación + `.blend` reabierto.
7. Matriz geométrica separada `data/osteology/feline-geometry-coverage.json`: visible / oculta / no identificable / no representada, por fila de las 323.

Aceptación: propuestas con evidencia visual, Zod en verde, conteo de caras conservado y hashes registrados. Nada se publica en `public/` en esta fase. **Commit** de scripts y JSON; los `.blend`/GLB privados quedan fuera de Git.

### F4 — Orientación y escala felinas (A1 + A3) · ~1 h

1. Ejes anatómicos (craneal/caudal, dorsal/ventral, izquierda/derecha) derivados de la geometría y documentados con capturas. Si hay ambigüedad, quedan `unknown`.
2. Escala: se buscan medidas publicadas **del mismo espécimen** de Tavernier en su página o metadatos. Las medidas de población (longitud media de un húmero felino) **no** calibran el espécimen. Sin dos medidas del espécimen, `scale=unknown` y la UI no muestra medidas.
3. El borrador de solicitud de medidas a Tavernier se actualiza en `docs/phase3/requests/` (sin enviarlo).

Aceptación: la decisión queda documentada en DECISIONES.md, sin escala inventada.

### F5 — Selección científica felina en el visor (A5, prueba A6) · ~2–3 h

Depende de F2 + F3 (al menos el piloto).

1. Nuevo estado de mapping `admissionLevel: "partial-surface"` en `data/viewer/` y en el esquema: permite seleccionar superficies parciales **con un aviso visible en la ficha** («Superficie parcial identificada · revisión pendiente»).
2. Para servir los derivados parciales en `public/` se comprueba la licencia CC BY-NC-SA 4.0 de Tavernier: permite derivados con atribución y misma licencia, sin uso comercial. Se aplica la misma atribución, se registra hash y transformación, y se reutiliza el flujo de admisión existente. Si cualquier campo de procedencia no está completo, no se publica.
3. Clic → resaltado → ficha → evidencia por campo. Aislar, ocultar y opacidad por pieza. Búsqueda que enfoca la pieza en el canvas.
4. API: extensión **aditiva** de OpenAPI (1.4.0), sin romper v1. Contratos regenerados y revisados.
5. Las vistas y cortes anatómicos siguen deshabilitados mientras no haya ejes acreditados (F4).

Aceptación: E2E en 3 viewports (escritorio, tablet, móvil) para clic, ficha, aislar y búsqueda→foco; contratos verdes; capturas en `docs/phase3/screenshots/`. **Commit + push.**

### F6 — Fichas caninas y fuentes (A4, revisa A7) · varias horas, en paralelo con F2

Mismos lotes que F2 pero para *Canis lupus familiaris* (inventario de 335 entradas, dientes de referencia 42). Fuentes: NAV, Miller's Anatomy of the Dog (citación por capítulo y página solo si se ha consultado el texto; si no, `pending`) y artículos abiertos. Las fichas caninas son independientes de las felinas: no se copian campos entre especies.

Además:

- Se buscan **activos caninos alternativos con licencia abierta verificable por activo** (p. ej. MorphoSource o repositorios universitarios con CC BY / CC0 explícito en la página del archivo). Se registran candidatos en `data/osteology/source-candidates.json` con todos los campos de AGENTS.md. Un candidato solo se descarga si cumple los 8 puntos de verificación, la descarga es gratuita y no exige credenciales; en cualquier otro caso queda registrado sin descarga. Sketchfab (401) y los 403 previos no se reintentan.

Aceptación: lotes con `fieldEvidence`, `validate:data` verde, A7 sin hallazgos bloqueantes. **Commit por lote.**

### F7 — Canino privado en Blender (A2) · varias horas, en paralelo

Base: 4 STL de 3DExport (cráneo, columna, miembro torácico, miembro pélvico), 179.590 triángulos, sin unidades ni licencia web.

1. Inspección por pieza: conectividad, componentes y conteo de islas por coordenadas (mismo método del diagnóstico felino).
2. Registro relativo de las 4 piezas **solo si hay superficies articulares coincidentes demostrables**. Si no las hay, se dejan en sus coordenadas originales y se documenta. No se inventan transformaciones.
3. Propuestas de segmentación de huesos grandes, con el mismo esquema que F3.
4. Todo queda en `workbench/` y nada va a `public/`, porque no hay licencia web (bloqueo F-derechos).
5. Se actualiza el borrador de solicitud de licencia al autor `hidden.art8` (no se envía).

Aceptación: diagnóstico JSON + capturas + `.blend` reabierto y hashes intactos de los originales.

### F8 — Canino en el visor (A5) · condicional

- **Si F6 encontró un activo abierto verificado:** pipeline completo (convert, reconcile, validate, mappings), carga corporal o regional con atribución y E2E.
- **Si no:** el canino muestra «Modelo 3D no disponible» con las fichas navegables por búsqueda y región, un panel de cobertura honesto (fichas sí, geometría no) y pruebas que garanticen que no se carga ningún activo de 3DExport.

Aceptación: el comportamiento elegido queda probado en E2E. **Commit.**

### F9 — Capas, sistemas y tejidos (A5 + A3/A4) · ~2 h

Fase 4 del roadmap, limitada a lo que exista.

1. Se completan en la UI los filtros por sistema y capa (`systems.json` / `layers.json`): óseo, muscular, nervioso, vascular, ligamentos/tendones. Las capas sin geometría aparecen deshabilitadas con el motivo.
2. Fichas bibliográficas de los músculos y nervios principales del miembro torácico (ambas especies, por separado) solo con evidencia por campo. Sin geometría.
3. Relaciones hueso↔músculo (origen e inserción) solo con fuente específica.

Aceptación: tests de filtros, UI coherente con el diseño V2 y sin estructuras inventadas.

### F10 — Galería y medios (A4 + A5) · ~1–2 h

1. Por ficha, referencias externas curadas (enlace a la página, nunca hotlink) con autor, licencia y fecha de consulta.
2. Imágenes locales **solo** con licencia comprobada que permita redistribución (p. ej. Wikimedia Commons CC BY/CC0 verificado en la página del archivo), con atribución visible y hash. Las capturas propias del visor se pueden usar como «vista del modelo».
3. `validate:media` ampliado: toda imagen local tiene un registro de licencia completo.

Aceptación: `validate:media` verde y `contracts/media` verde.

### F11 — Rendimiento, accesibilidad e i18n (A5 + A6) · ~2–3 h

1. **Rendimiento:** compresión GLB (meshopt/Draco con `gltf-transform`, versión fijada), KTX2/redimensión de la textura 2048² con presupuesto móvil, carga diferida por región, `dpr` adaptativo y medición con Lighthouse y performance trace vía `chrome-agente` en localhost. Las métricas se reportan como emulación, nunca como resultados de dispositivos físicos.
2. **Accesibilidad:** navegación de piezas por teclado, nombres accesibles, foco visible, contraste en los temas, `prefers-reduced-motion` y alternativa textual del canvas (lista de piezas seleccionables). Lighthouse a11y ≥ 95 como objetivo.
3. **i18n:** todo texto de interfaz en ES/EN y nombres latinos invariables.
4. **Errores:** WebGL ausente, contexto perdido y fallo de textura con mensajes claros (ya existe una base en `c441491`).

Aceptación: Lighthouse registrado (rendimiento, a11y, buenas prácticas), sin regresiones E2E y presupuestos de triángulos y VRAM respetados.

### F12 — QA integral (A6) · ~1–2 h

1. Suite completa: lint, typecheck, unit, integration, contracts, todos los validadores, build, `test:smoke:production` aislado y `test:e2e` en los 3 proyectos.
2. Recorridos manuales con `chrome-agente`: felino corporal, selección, búsqueda por voz con fallback, temas, persistencia, canino «no disponible», `/technical-demo`, consola sin errores y red sin recursos externos.
3. Si hay flaky tests: se repiten, se reporta la primera corrida fallida y se corrige la causa, no la aserción.
4. Hashes finales del HTML aprobado y de los originales.

Aceptación: todo en verde con los números reales en PROGRESO.md, más las capturas.

### F13 — Revisión adversarial global (A7, opcional `/code-review high` y `/security-review`) · ~1 h

1. A7 recorre catálogo, fuentes, licencias y UI buscando afirmaciones sin evidencia, especies mezcladas, `reviewStatus` distinto de `pending`, activos sin procedencia, hotlinks, textos que aseguren validación científica y fixtures mezcladas con el catálogo.
2. Revisión de código (corrección y seguridad: CSP, rutas, entrada de la API).
3. Cada hallazgo se corrige o se registra como pendiente justificado.

### F14 — Paquetes para desbloqueos externos (A0) · ~45 min

Se dejan listos (sin enviar) en `docs/phase3/requests/`:

- Paquete de revisión humana: lista de fichas y piezas, capturas, evidencia por campo y formulario de veredicto. Se ejecuta el flujo `asset-review` con la plantilla vacía para comprobar que bloquea.
- Solicitud de medidas a Tavernier.
- Solicitud de licencia web a hidden.art8 (3DExport 285869).
- Nota de decisión para el usuario sobre la descarga del CT felino (tamaño, licencia CC0, alcance: solo cráneos).

### F15 — Cierre (A0)

1. `docs/ESTADO_ACTUAL.md`, `PROGRESO.md`, `DECISIONES.md`, `FUENTES_ANATOMICAS.md` y `roadmap.md` actualizados.
2. Informe final en `docs/plan/informe-final-noche.md`: qué quedó en N1–N3, qué está bloqueado y por qué, y comandos para reproducir.
3. Commit + push final. **No se declara la fase 3 completa**: se entrega al usuario para aceptación (regla de AGENTS.md).

---

## 5. Oleadas sugeridas para la noche

| Oleada | En paralelo | Integra A0 |
|---|---|---|
| 1 | A0+A6: F0, F1 | línea base, gate |
| 2 | A1: F3 piloto · A2: F7 diagnóstico · A3: F2 L-F1 · A4: F6 L-C1 + búsqueda de activos · A5: F11 a11y/i18n (no depende de datos) · A6: tests de F1/F5 preparados | merge de lotes, A7 revisa |
| 3 | A1: F3 lote 2 + F4 · A2: F7 registro · A3: L-F2/L-F3 · A4: L-C2/L-C3 · A5: F5 selección · A6: E2E de F5 | commit + push |
| 4 | A3: L-F4/L-F5 · A4: L-C4/L-C5 + F10 · A5: F9 + F8 · A6: F11 rendimiento · A1/A2: matrices geométricas | commit + push |
| 5 | A6: F12 · A7: F13 · A0: F14 | correcciones |
| 6 | A0: F15 | push final |

Si una oleada se bloquea, A0 adelanta otra tarea independiente. Nunca hay que esperar a un tercero.

---

## 6. Cómo se ejecuta el modo nocturno

1. El usuario aprueba el plan y escribe, por ejemplo: «ejecuta plandeimplementacion.md con workflow / fan out agents, modo noche». Esa petición explícita habilita la herramienta Workflow. Alternativa: `/loop` sin intervalo, con el prompt «continúa plandeimplementacion.md desde docs/plan/bitacora-noche.md».
2. En cada ciclo A0 lee la bitácora, elige la siguiente oleada, lanza los agentes con su brief, espera las notificaciones, integra, pasa `npm run gate`, hace commit y push, y actualiza la bitácora.
3. **Condiciones de parada:** todas las fases verificadas o bloqueadas; un fallo que exige una decisión del usuario (p. ej. una licencia ambigua); riesgo de una acción prohibida; o el gate en rojo sin solución tras dos intentos (se revierte el lote, se registra y se sigue con otra fase).
4. Si el contexto se compacta, la bitácora y PROGRESO.md permiten retomar sin repetir trabajo.

---

## 7. Comandos de verificación (referencia rápida)

```bash
npm run lint && npm run typecheck && npm test
npm run test:integration && npm run test:contracts
npm run validate:data && npm run validate:viewer && npm run validate:media
npm run anatomy:validate && npm run osteology:validate && npm run osteology:coverage
npm run build && npm run test:smoke:production
npm run test:e2e            # desktop + tablet + móvil (emulados)
".tools/blender-4.5.14/blender-4.5.14-windows-x64/blender.exe" --background --factory-startup --python-exit-code 1 --python <script.py>
```

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Conflictos entre agentes en JSON centrales | Lotes por agente + `merge-batches.ts` + worktrees |
| Afirmaciones científicas sin respaldo | `fieldEvidence` obligatorio + A7 ciego + `pending` |
| Segmentación que «inventa» huesos | Partición solo por caras existentes, remanente íntegro y estados de admisión |
| Publicar algo sin permiso | Validadores de procedencia bloqueantes; 3DExport nunca en `public/` |
| E2E inestables (WebGL software) | Esperar a que el visor esté listo, repetir y reportar la primera corrida |
| Blender no ejecutable desde WSL | Interop `.exe`; si falla, pipeline TS headless y registro del bloqueo |
| Consumo excesivo de agentes | Máx. 6–7 simultáneos, sin relanzar trabajo completado, briefs mínimos |

---

## 9. Niveles de entrega

| Nivel | Contenido | ¿Alcanzable esta noche? |
|---|---|---|
| N1 | Software completo y probado (visor, API, UI V2, capas, galería, a11y, rendimiento) | Sí |
| N2 | Fichas felinas y caninas por lotes con evidencia por campo; matrices de cobertura | Sí, en buena parte (depende del acceso a fuentes) |
| N3 | Felino con superficies parciales seleccionables y canino privado diagnosticado; paquetes externos listos | Sí, si la segmentación da piezas defendibles |
| N4 | Escala acreditada, canino publicable y piezas «hueso geométrico suficiente» | Requiere medidas, licencia o fuente nueva |
| N5 | Revisión anatómica humana y despliegue público | Requiere revisor y autorización del usuario |

---

## 10. Estado al cierre de la sesión nocturna (2026-11-01)

El usuario detuvo la ejecución en este punto. Todo lo listado como logrado está commiteado y subido a `origin/main`, con el gate completo y el E2E verificados en el último commit (`8c8088c`).

### Logrado

| Fase | Resultado | Commits |
|---|---|---|
| FS Skills | 13 skills propias (Blender headless, segmentación, glTF, visor R3F, sistema de diseño UI V2, UX del visor, WCAG 3D, i18n, evidencia por campo, NAV, Playwright WebGL, gate y commits, coordinación multiagente) y 2 oficiales de Anthropic revisadas. Índice en `.agents/skills/README.md` | 388ce11 |
| F0/F1 | EOL normalizado, línea base medida, `merge-batches` (reciprocidad, conserva modelIds/photoRefs), `gate`, `win.sh` (node_modules de Windows) | 388ce11, d6dcb14 |
| F2 fichas felinas | L-F1..L-F5: miembros, atlas/axis, tórax, sacro y cabeza (cráneo, mandíbula, dientes y 11 huesos craneales) | 2884467, 8c8088c |
| F6 fichas caninas | L-C1..L-C5: miembros, columna, tórax, cráneo (13 huesos) y músculos del miembro torácico | 3ac2e20, 8c8088c |
| F13 revisión adversarial | 2 rondas (84 y 97 evidencias muestreadas); 5 bloqueantes y 20 no bloqueantes corregidos | 1b7751e, 8c8088c |
| F3/F4 segmentación felina | 13 superficies parciales y un remanente (suma de caras 74.235), matriz geométrica de 323 filas, ejes; lado y escala `unknown` | d982dd5 |
| F5 selección felina | Escápula, húmero, fémur, coxal y cabeza seleccionables con aviso «superficie parcial · revisión pendiente»; aislar, ocultar y opacidad por pieza; la búsqueda encuadra la pieza | 6a49ceb |
| F7 canino privado | Diagnóstico de los STL de 3DExport (169 componentes, 32 propuestas); nada publicado | 00c1a14 |
| F8 canino en el visor | Cráneo de perro Zenodo 10327538 (CC BY 4.0, verificado en origen y réplica), derivado de 200k triángulos con desviación medida, atribución visible | 93f10a0 |
| F9 capas | Filtros por sistema y tejido; capas sin geometría deshabilitadas con el motivo visible | 7ca2ab9 |
| F10 galería | 7 imágenes locales de Wikimedia Commons (CC0/CC BY-SA, SHA verificado) y 7 enlaces abiertos; `validate:media` estricto | 8c8088c |
| F11 a11y/i18n/rendimiento | Teclado, ARIA, aria-live, 44 px táctil, movimiento reducido, ~120 claves ES/EN, DPR adaptativo (corrige un bug de R3F) | 14c7bdd, 7ca2ab9 |
| F14 paquetes externos | Revisión humana ampliada, solicitudes de medidas y de licencia, nota de decisión sobre el CT (nada enviado) | 96edc62 |

**Cifras finales verificadas:** 109 estructuras (todas `pending`), 34 relaciones, 20 fuentes, 3 modelos 3D disponibles (gato corporal, gato con superficies seleccionables, cráneo de perro). Pruebas: lint, typecheck, 185 unitarias, 70 HTTP, 38 contratos, validadores, build y **E2E 48/48** (escritorio, tablet y móvil emulados).

### Falta

**Software (sin bloqueos externos):**
1. Galería: etiqueta propia «espécimen osteológico» (hoy aparece como «Fotografía de disección») y enlace de licencia clicable en `ReferenceGallery.tsx`. También que el filtro `region=shoulder/brachium` devuelva las referencias del miembro torácico.
2. `photoRefs` recíprocos en `structures.json` (la lista exacta está en `docs/phase3/gallery-media-2026-11-01.md`; son opcionales).
3. Lighthouse y perfil de rendimiento: el perfil de `chrome-agente` estuvo bloqueado durante toda la sesión.
4. Compresión de los GLB (meshopt/KTX2): propuesta en `docs/phase3/performance-2026-10-31.md`; requiere fijar la versión de `gltf-transform`.
5. Decisiones de esquema: tipo propio para dientes (hoy `kind: bone`), enlace entre fichas de conjunto y fichas individuales (cráneo↔huesos, mano↔carpianos), `has3DModel` para superficies parciales.
6. Clic directo en el canvas cubierto en E2E (hoy se prueba con la lista accesible equivalente); foco que se conserve al cambiar de especie.
7. Fichas restantes: vértebras torácicas, lumbares y caudales (serie sin ficha, por decisión), lagrimal, etmoides, vómer y pterigoideo; campo `vascularSupply` en casi todas; músculos y nervios felinos; tejidos blandos.
8. F12 (QA integral final con recorrido manual) y F15 (cierre formal y entrega).

**Bloqueado por terceros o por decisión del usuario:**
- Revisión anatómica humana cualificada (todo sigue `pending`).
- Licencia web del esqueleto canino de 3DExport (borrador de solicitud listo, sin enviar).
- Medidas del espécimen Tavernier, necesarias para la escala del gato.
- Autorizar la descarga de los volúmenes CT felinos (CC0, 51 GB): ver `docs/phase3/requests/decision-ct-felino.md`.
- Decidir la licencia en conflicto de El-Ghazali 2018 (CC BY en el PDF del editor, CC BY-NC en PMC).
- Despliegue público (no autorizado).
