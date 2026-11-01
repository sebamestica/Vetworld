---
name: playwright-webgl-e2e
description: Escribir, ejecutar y reportar pruebas E2E Playwright con WebGL software del Atlas Veterinario 3D en proyectos desktop, tablet y móvil emulados, y el smoke de producción aislado.
---

# E2E Playwright con WebGL

Activar al crear o modificar `tests/e2e/*.spec.ts`, `playwright.config.ts` o al verificar el visor. Qué recorridos cubrir lo define [frontend-integration-testing](../frontend-integration-testing/SKILL.md); criterios móviles, [mobile-3d-qa](../mobile-3d-qa/SKILL.md). Esta skill trata solo la mecánica en este repo.

## Configuración real (`playwright.config.ts`)

- `testDir: ./tests/e2e`, `workers: 1`, `fullyParallel: false`, `timeout: 45000`, `expect.timeout: 15000`, reporter `list` + `html` (sin abrir).
- `webServer`: `next start` en `127.0.0.1:3100`, salud en `/api/v1/health`. Usa la build existente: ejecutar `npm run build` antes. `reuseExistingServer` está activo fuera de CI: si ya hay algo en el puerto 3100 (otra build o un servidor huérfano), se reutiliza; comprobarlo antes de confiar en el resultado.
- WebGL por software: Chromium con `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --enable-webgl`. Registrar el renderizador como «Chromium WebGL software SwiftShader», no como GPU.
- Proyectos: `desktop` 1440×1050; `tablet` 768×1024 táctil; `mobile` 390×844 táctil `isMobile`. Todos Chromium.

```bash
npm run build
npm run test:e2e                         # tres proyectos
npm run test:e2e:desktop                 # solo desktop
npx playwright test tests/e2e/whole-body.spec.ts --project=mobile
npm run test:smoke:production            # API contra next start en puerto libre aleatorio
```

`test:smoke:production` (`scripts/smoke-local.ts --production`) arranca su propio servidor con `tests/helpers/http-server.ts` en un puerto libre, ejecuta `scripts/smoke-api.ts` y lo detiene; no usa el 3100 ni un servidor del usuario.

## Patrones del repo

1. Esperar el visor antes de interactuar: `await expect(page.getByTestId('viewer-status')).toHaveText('Visor listo')`. Solo después cerrar el aviso de orientación, que aparece tarde en móvil:
   ```ts
   const portrait = page.getByRole('button', { name: 'Continuar en vertical' });
   if (await portrait.isVisible()) await portrait.click();
   ```
   Cerrarlo antes de «Visor listo» causó fallos móviles intermitentes (PROGRESO, 2026-10-10). Reutilizar los helpers `ready`/`dismissOrientation` de `atlas.spec.ts` y `ui-v2.spec.ts`.
2. Vigilar errores desde el inicio, antes de `goto`:
   ```ts
   page.on('pageerror', e => errors.push(e.message));
   page.on('console', m => { if (m.type() === 'error' && /GLTFLoader|Content Security Policy|Fetch API cannot load blob/.test(m.text())) errors.push(m.text()); });
   ```
   y terminar con `expect(errors).toEqual([])`. Solo `pageerror` no detectó el fallo de textura por CSP.
3. Selectores accesibles (`getByRole`, `getByLabel`, `getByTestId('viewer-canvas'|'detail-panel'|'viewer-status')`), con `exact: true` en nombres cortos.
4. Interacción con el lienzo: `canvas.click` en `desktop` y `canvas.tap` en táctiles (`info.project.name`). Para cambios visuales, comparar `canvas.screenshot()` con `expect.poll(...).toBe(false)`; no usar esperas fijas.
5. Fallos controlados: `page.route('**/models/technical/*.glb*', r => r.abort())` para un recurso, `WEBGL_lose_context` para contexto perdido; no simular toda la API. Esperar «Modelo 3D no disponible» y ausencia de canvas.
6. Las capturas a `docs/ui-v2/screenshots/` son versionadas; las de `workbench/` son privadas. Inspeccionar las capturas antes de citarlas.
7. La geometría `/technical-demo` es una fixture sintética: rotularla así en adjuntos y no presentarla como anatomía.

## Ejecución y reporte

- Si una prueba falla, guardar la salida, repetir y reportar todas las corridas (p. ej. «3/3 aprobadas, 3 timeouts; repetición 4/2; tras corrección 6/6»). No quitar pruebas, no subir timeouts ni añadir `retries` para ocultar intermitencias sin causa registrada.
- Para depurar: `npx playwright show-report` o la traza `trace: retain-on-failure` en `test-results/`.
- Declarar qué specs y proyectos se ejecutaron; no afirmar la suite completa si solo corrieron algunos.
- La emulación de viewport/touch en Chromium no equivale a Safari iOS, Chrome Android ni dispositivos físicos; decirlo en el informe y en `docs/PROGRESO.md`.
- Cerrar servidores propios al terminar; no desplegar para probar.
