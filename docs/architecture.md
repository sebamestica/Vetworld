# Arquitectura resumida

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

En fase 1 se crearán únicamente los directorios/configuraciones necesarios para la demo técnica, sin sobrescribir esta documentación. La compatibilidad concreta Next.js/React/R3F se comprobará al elegir versiones; disponer de Node no prueba por sí solo esa compatibilidad.
