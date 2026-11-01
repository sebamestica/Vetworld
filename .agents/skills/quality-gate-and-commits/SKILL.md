---
name: quality-gate-and-commits
description: Ejecutar la verificación completa del Atlas Veterinario 3D, conservar hashes protegidos, registrar evidencia en PROGRESO y hacer commit convencional en español y push sin fuerza tras un hito verificado.
---

# Puerta de calidad y commits

Activar antes de declarar un hito, fusionar trabajo de agentes o hacer commit. Las pruebas de recorrido y E2E se detallan en [frontend-integration-testing](../frontend-integration-testing/SKILL.md) y [playwright-webgl-e2e](../playwright-webgl-e2e/SKILL.md).

## Secuencia completa (scripts reales de `package.json`)

```bash
npm run lint
npm run typecheck
npm test                      # vitest run tests/unit
npm run test:integration      # levanta servidor local propio (globalSetup)
npm run test:contracts
npm run validate:data         # catálogo; registrar errores y advertencias
npm run validate:viewer
npm run validate:media
npm run anatomy:validate
npm run osteology:validate
npm run build
npm run test:smoke:production # next start en puerto aislado
npm run test:e2e              # requiere build; puerto 3100
```

- Puerta mínima antes de fusionar: `lint`, `typecheck`, `test`, `validate:data` y validadores. `npm run gate` (`scripts/qa/gate.ts`) ejecuta esa lista; `npm run gate:full` añade integración, contratos y build.
- **Desde WSL:** `node_modules` es de Windows (esbuild/SWC nativos). Ejecutar con `scripts/qa/win.sh npm run -s <script>`; `lint` y `typecheck` también funcionan en WSL.
- Scripts que escriben archivos, no son verificación: `anatomy:index` (search-index.json), `docs:api` (docs/api/openapi.json), `osteology:coverage` (data/osteology/coverage.json), `osteology:inventory`, `anatomy:convert`, `anatomy:reconcile`. Ejecutarlos a propósito y revisar el diff.
- `test:smoke` sin sufijo necesita `API_BASE_URL` de un servidor ya levantado; preferir `test:smoke:production` o `test:smoke:local` (dev).
- No se usan servicios externos ni despliegue: la build y el smoke son locales.

## Hashes protegidos

```bash
sha256sum atlas_veterinario_ui_v2.html
# 2412b2df1dccdd76821a7e663c7b7921152b769b0d4112792ffdffd597a650bb
sha256sum public/models/feline/tavernier-skeleton.glb
# c570679a9f450c32aeded26c7b459993e984ee6fb01677170e4cd7cdf9220783
```

Si difieren, detenerse y registrar: el HTML aprobado no se modifica y el GLB fuente coincide con `data/viewer/assets.json` y `data/anatomy/models.json`.

## Finales de línea

- `.gitattributes`: `* text=auto eol=lf`; `atlas_veterinario_ui_v2.html -text` (bytes intactos); `*.glb *.blend *.png *.jpg *.stl *.zip *.rar *.pdf binary`.
- En WSL sobre `/mnt/c` pueden aparecer archivos modificados solo por CRLF. Comprobar con `git diff --ignore-cr-at-eol --stat`: si está vacío, no hay cambio semántico; no mezclar normalizaciones con un commit de contenido.
- `next dev` reescribe `next-env.d.ts` y el bloque final de `AGENTS.md`; no confundirlos con cambios del hito.

## Criterio de commit

1. Solo tras un hito verificado: comandos pertinentes ejecutados, cifras reales registradas, sin errores nuevos. Los fallos que queden se documentan, no se ocultan.
2. Revisar `git status` y `git diff --stat`; añadir archivos por nombre, nunca `workbench/`, `.tools/`, originales con licencia restrictiva ni derivados caninos de 3DExport en `public/`.
3. Formato convencional en español, imperativo y minúsculas, como en `git log`:
   - `feat(anatomy): curar fichas felinas y ejecutar piloto privado de superficies`
   - `fix(viewer): permitir texturas blob y detectar fallos de carga`
   - `docs(osteology): registrar adquisición y licencia felina confirmadas`
   Tipos usados: `feat`, `fix`, `docs`, `chore`; ámbitos: `anatomy`, `viewer`, `osteology`, `feline`, `phase3`. Añadir las líneas de atribución que pida la sesión.
4. `git push origin main` sin `--force` ni reescritura de historia. Push de código no autoriza desplegar ni publicar modelos científicos.
5. No commitear si un agente revisor encontró afirmaciones sin evidencia en el lote.

## Registro de evidencia

Añadir en `docs/PROGRESO.md` una sección `### <Hito> — AAAA-MM-DD` con: qué cambió, comandos y resultados con números (p. ej. «128/128 unitarias, 69/69 HTTP, 38/38 contratos; validate:data 0 errores/105 advertencias»), corridas fallidas y repeticiones, hashes conservados, lo no ejecutado (dispositivos físicos, suites no corridas) y bloqueos. Decisiones en `docs/DECISIONES.md`, fuentes en `docs/FUENTES_ANATOMICAS.md`. No avanzar de fase sin aceptación del usuario.
