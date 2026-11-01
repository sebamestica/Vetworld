---
name: multi-agent-coordination
description: Coordinar subagentes en paralelo en el Atlas Veterinario 3D con un dueño por archivo, lotes JSON fusionados por el orquestador, worktrees, briefs mínimos, informes con salidas reales y revisión adversarial ciega.
---

# Coordinación multiagente

Activar al planificar oleadas de agentes, delegar una fase o integrar su trabajo. Base: `plandeimplementacion.md` §2; `AGENTS.md` prevalece. Delegar solo tareas independientes cuyo beneficio justifique el costo.

## Roles y propiedad (plan §2)

| Rol | Escribe |
|---|---|
| A0 orquestador | `docs/PROGRESO.md`, `docs/DECISIONES.md`, `docs/ESTADO_ACTUAL.md`, `plandeimplementacion.md`, bitácora, merges, commits |
| A1 modelador felino | `scripts/osteology/*.py` nuevos, `workbench/segmentation/feline/**`, diagnósticos y propuestas felinas |
| A2 modelador canino | `workbench/masters/candidates/canine/**`, `workbench/processing/canine/**`, diagnóstico canino |
| A3 redactor felino | entradas `feline:*`, cobertura y research felinos, workbook CSV |
| A4 redactor canino + fuentes | entradas `canine:*`, `sources.json`, `docs/FUENTES_ANATOMICAS.md` |
| A5 frontend/visor/API | `src/**`, `data/viewer/**`, `docs/api/**` |
| A6 QA | `tests/**`, `scripts/validate-*.ts`, `playwright.config.ts` |
| A7 revisor adversarial | `docs/plan/revisiones/*.md`; nunca edita datos |

## Reglas

1. **Un dueño por archivo.** Fuera de su zona, el agente propone el cambio en su informe y A0 lo integra.
2. **Lotes para el JSON central.** A3 y A4 no editan `data/anatomy/structures.json` en paralelo: escriben `data/anatomy/_batches/feline-<lote>.json` o `canine-<lote>.json`. A0 los fusiona con `npm run anatomy:merge` (`scripts/anatomy/merge-batches.ts`, `--dry-run` disponible; pruebas en `tests/unit/merge-batches.test.ts`), seguido de `npm run anatomy:index` y `npm run validate:data`. El script rechaza IDs duplicados o reclamados por dos lotes, especies mezcladas (también en relaciones) y `reviewStatus` distinto de `pending`, y valida con Zod. Plantilla: `docs/plan/plantillas/lote.json`.
3. **Sin worktrees en este entorno.** `node_modules` (instalado en Windows) y `workbench/` (ignorado) no viajan a un worktree, así que todos los agentes trabajan en la copia principal con propiedad estricta de archivos. Solo A0 ejecuta `build`, `test:e2e` y `gate:full` (comparten `.next` y el puerto 3100); los demás ejecutan pruebas acotadas (`npx vitest run <archivo>`, validadores).
4. **Brief mínimo.** Objetivo; archivos propios; criterio de aceptación de la fase; skills a leer (`.agents/skills/...`); lo descartado (URLs con HTTP 403/401, ZIP CT de 51 GB, licencia web canina 3DExport 285869 sin confirmar); prohibiciones (no cambiar `reviewStatus`, no tocar `atlas_veterinario_ui_v2.html`, no publicar derivados caninos en `public/`, no gastar ni desplegar).
5. **Informe estructurado obligatorio:** archivos cambiados; comandos ejecutados con salida real resumida (cifras exactas); pruebas aprobadas y fallidas; pendientes; bloqueos. Lo no ejecutado se declara «no ejecutado». A0 no copia cifras a PROGRESO sin poder rastrearlas a una salida.
6. **Revisor adversarial ciego.** A7 revisa cada lote antes del commit con solo el diff y las fuentes, sin la conclusión ni el razonamiento del autor. Una afirmación sin evidencia bloquea la integración del lote. Su informe va a `docs/plan/revisiones/` (carpeta aún no creada). La revisión de A7 no sustituye la revisión humana cualificada.
7. **Puerta de calidad.** Ningún merge sin `lint`, `typecheck`, `test`, `validate:data` y validadores en verde (ver [quality-gate-and-commits](../quality-gate-and-commits/SKILL.md)).
8. **Presupuesto.** Máximo 6–7 agentes simultáneos. No relanzar agentes para trabajo completado; continuar uno existente con su ID si falta algo. Si un agente falla dos veces en lo mismo, registrar bloqueo y pasar a otra tarea.
9. **Sin predicciones.** No anunciar resultados de un agente pendiente; esperar su informe.

## Flujo por oleada

1. A0 lee `docs/PROGRESO.md` y la fase del plan, y asigna archivos sin solapes.
2. Lanzar en un solo mensaje los agentes independientes (p. ej. A1 + A2 + A3 + A4 + A5 + A6).
3. Al volver cada informe: comprobar el diff contra la zona asignada; descartar escrituras ajenas.
4. Enviar el diff a A7; integrar solo lotes sin hallazgos bloqueantes.
5. Ejecutar la puerta, registrar evidencia y hacer commit del hito (un commit por lote científico).
6. Anotar el estado de la fase en la bitácora `docs/plan/bitacora-noche.md` .
