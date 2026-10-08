# Arquitectura resumida

Estado vigente: UI V2 integrada sobre backend y visor de fases 1/2; [arquitectura de migración](ui-v2/design.md). AppShell/Topbar/hook de contexto, ToolsPanel/tema/i18n, GlobalSearch/VoiceSearch y panel científico reutilizan API/contratos y Canvas. Se conserva el HTML aprobado como referencia, no como aplicación ni catálogo anatómico.

Actualización 2026-10-08: el usuario redefinió la fase 1 como backend REST completo de lectura antes del frontend. El [diseño de API](api/design.md) prevalece sobre el alcance anterior de demo. Next.js Route Handlers, Zod, Vitest y JSON local; sin servicios externos ni escrituras en runtime. Three.js/R3F/Drei quedan para la fase visual futura y no se instalan ahora.

Referencia: [documento maestro](../ARQUITECTURA_ATLAS_VETERINARIO_3D_CODEX.md), secciones 1–3, 5–7. Este resumen permite retomar sin cargar el documento completo.

Atlas educativo canino/felino, adaptable a móvil y escritorio. Prioridad: precisión científica y procedencia sobre apariencia. Región inicial prevista: cabeza; geometría anatómica solo cuando exista y tenga permisos comprobados.

Stack acordado: Next.js App Router, TypeScript estricto, Three.js, React Three Fiber y Drei; CSS Modules/global; estado/contexto React local. Datos JSON/TS versionados detrás de `catalogRepository`. Sin base de datos, autenticación, CMS ni backend propio en MVP. Zod, Vitest y Playwright se incorporarán únicamente cuando su tarea lo requiera. Hosting previsto: Vercel; publicación no realizada.

El visor será cliente, con carga diferida y alternativa textual ante WebGL ausente o carga fallida. Catálogo separado por especie/región; correspondencia explícita entre ID de estructura, activo y nodo. Las mallas ocultas no serán seleccionables. Capas e interacción individual dependerán de la geometría real, no de etiquetas inferidas.

Procedencia por activo: página y archivo real, autor, licencia/versión, permisos, fecha, SHA-256, transformaciones, especie y estado de revisión. Originales privados en `workbench/incoming/`; copias de trabajo separadas; solo recursos publicables en `public/models/`. Excluir workbench y activos grandes de Git cuando se configure el proyecto.

## Árbol mínimo de fase 0

```text
AGENTS.md
ARQUITECTURA_ATLAS_VETERINARIO_3D_CODEX.md
docs/
  architecture.md
  roadmap.md
  sources-and-licenses.md
  PROGRESO.md
  DECISIONES.md
  FUENTES_ANATOMICAS.md
.agents/skills/
  anatomy-integrity/SKILL.md
  3d-asset-pipeline/SKILL.md
  mobile-3d-qa/SKILL.md
```

La fase 1 actual implementa backend Node.js/Route Handlers, no la demo del visor. El código separa contratos/HTTP (`src/lib/api`), dominio/esquemas/validación y repositorio (`src/modules/anatomy`), servicios (`src/modules/catalog`), búsqueda (`src/modules/search`) y JSON (`data/anatomy`). Archivos/sha256 se verifican fuera de runtime mediante scripts/CI. Los modelos candidatos permanecen sin recurso público. La selección de librerías del visor se comprobará en la futura fase visual.

## Fase 2 visual

Fase 1 aprobada; el [visor de fase 2](phase2/README.md) reutiliza esa API. `AtlasWorkspace` consume listas/fichas sin duplicarlas; `StructurePanel` solicita detalle, relaciones, fuentes y referencias con abort. Canvas se importa solo en cliente, renderizado R3F/Three.js, controles Drei. Selección, ocultamiento, aislamiento y opacidad utilizan mappings explícitos por especie.

`data/viewer/` separa fixtures/manifiestos visuales del catálogo científico. `src/modules/viewer` concentra contratos/guardas de recursos; `src/modules/media` y nuevos endpoints `/api/v1/references` gestionan referencias curadas. No se cambiaron esquemas de respuestas antiguas. Nonce CSP obliga render dinámico del atlas, sin almacenamiento externo ni cálculo gráfico en serverless. La primera región visual es miembro torácico, donde están las fichas verificables, no cabeza sin archivo.
