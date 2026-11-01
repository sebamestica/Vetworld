# Bitácora de ejecución — plandeimplementacion.md

| Fase | Estado | Evidencia / notas |
|---|---|---|
| FS Skills | en curso | 2 oficiales Anthropic (Apache-2.0, commit ca45fc4) + 13 propias en redacción |
| F0 Saneamiento | en curso | EOL: 27 archivos solo diferían en CR (diff semántico vacío), restaurados; `.gitattributes` LF. Hashes HTML/GLB intactos. Blender 4.5.14 LTS arranca desde WSL. node_modules es de Windows → `scripts/qa/win.sh` |
| F1 Infra | en curso | `scripts/anatomy/merge-batches.ts` (3/3 pruebas), `scripts/qa/gate.ts`, `npm run gate`/`gate:full`/`anatomy:merge` |
| F2–F15 | pendiente | |

## Hallazgos para F11 (skill a11y/i18n, 2026-10-31)
- Pestañas de StructurePanel sin navegación por flechas (ToolsPanel sí).
- meshButtons muestra nodeId en vez de nombre; falta role="group".
- `<aside>` anidado en ficha. Botones cerrar/micrófono 31 px (AA ok, <44 px táctil).
- enableDamping activo con prefers-reduced-motion. Selección en canvas sin aria-live.
- Sin tema de alto contraste/forced-colors. Inter no se carga (solo en pila).
- i18n: ternarios language==='en' dispersos y textos solo-ES (estados del visor, aria-label canvas, etiquetas de campos StructurePanel).
