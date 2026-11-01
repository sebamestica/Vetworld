# Bitácora de ejecución — plandeimplementacion.md

| Fase | Estado | Evidencia / notas |
|---|---|---|
| FS Skills | verificada | 2 oficiales Anthropic (Apache-2.0, commit ca45fc4) + 13 propias; índice `.agents/skills/README.md`; sync a `.claude/skills`. Commit 388ce11 (push vía git de Windows) |
| F0 Saneamiento | verificada | EOL: 27 archivos solo diferían en CR (diff semántico vacío), restaurados; `.gitattributes` LF. Hashes HTML/GLB intactos. Blender 4.5.14 LTS arranca desde WSL. node_modules es de Windows → `scripts/qa/win.sh` |
| F1 Infra | verificada | `scripts/anatomy/merge-batches.ts` (3/3 pruebas), `scripts/qa/gate.ts`, `npm run gate`/`gate:full`/`anatomy:merge` |
| F2 Fichas felinas | en curso | L-F1..F3 fusionados (2884467), corregidos tras A7 (1b7751e); L-F4/L-F5 en redacción |
| F3/F4 Segmentación felina | verificada | 13 superficies parciales, matriz 323 filas, ejes; lado/escala unknown (d982dd5) |
| F5 Selección felina | en curso | agente integrador |
| F6 Fichas caninas | en curso | L-C1/L-C2 (3ac2e20) + candidatos abiertos; L-C3/L-C4 en redacción |
| F7 Canino privado | verificada | diagnóstico 3DExport (00c1a14) |
| F8 Canino en visor | verificada | cráneo Zenodo CC BY 4.0, derivado 200k tris (93f10a0) |
| F9 Capas/sistemas | verificada | filtros y capas sin geometría (7ca2ab9) |
| F10 Galería | pendiente | |
| F11 a11y/i18n/rendimiento | verificada | 14c7bdd, 7ca2ab9; Lighthouse pendiente (perfil chrome-agente bloqueado) |
| F12 QA integral | parcial | E2E 48/48 tras cada hito |
| F13 Revisión adversarial | verificada (lotes 1) | 84 evidencias, 3 bloqueantes corregidos |
| F14 Paquetes externos | verificada | 96edc62 |
| F15 Cierre | pendiente | |

## Hallazgos para F11 (skill a11y/i18n, 2026-10-31)
- Pestañas de StructurePanel sin navegación por flechas (ToolsPanel sí).
- meshButtons muestra nodeId en vez de nombre; falta role="group".
- `<aside>` anidado en ficha. Botones cerrar/micrófono 31 px (AA ok, <44 px táctil).
- enableDamping activo con prefers-reduced-motion. Selección en canvas sin aria-live.
- Sin tema de alto contraste/forced-colors. Inter no se carga (solo en pila).
- i18n: ternarios language==='en' dispersos y textos solo-ES (estados del visor, aria-label canvas, etiquetas de campos StructurePanel).

## Línea base 2026-10-31 (Node Windows 24.13.1)
- gate:full: lint, typecheck, 131/131 unitarias, validate:data 0 errores/105 advertencias, viewer, media, anatomy, osteology, 69/69 HTTP, 38/38 contratos, build: todo OK.
- E2E: 44 aprobadas / 4 fallidas (6,1 min). 3 = aserción CSP desactualizada tras c441491 (`connect-src 'self' blob:`), corregida en la prueba sin relajar el bloqueo de orígenes remotos. 1 = timeout móvil en «archivo fallido… reintento» con máquina cargada (5 agentes); se repite en F12.
- Push desde WSL sin credenciales: usar `cmd.exe /c git push` (Windows).
