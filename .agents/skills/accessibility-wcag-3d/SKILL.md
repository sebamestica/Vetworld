---
name: accessibility-wcag-3d
description: Aplicar y auditar WCAG 2.2 AA en el visor WebGL y los paneles del Atlas Veterinario 3D, con alternativa textual al canvas, teclado, foco, ARIA, contraste por tema, movimiento reducido y anuncios de estado.
---

# Accesibilidad WCAG 2.2 AA para el visor 3D

Activar al crear o cambiar controles, paneles, pestañas, búsqueda o el Canvas. Complementa mobile-3d-qa (táctil, rendimiento) y frontend-integration-testing (suites). No sustituye pruebas con lectores de pantalla ni usuarios reales; no declarar conformidad AA sin auditoría manual documentada.

## Alternativa al canvas (1.1.1, 2.1.1)

- El Canvas es decorativo-interactivo; todo lo que permite debe existir sin él. Hoy: lista de botones `meshButtons` (una por `meshMapping`, `aria-pressed`, deshabilitada si la malla está oculta), visualmente oculta en `immersive` y visible con `:focus-within`; `<select>` «Consultar estructura» cuando no hay modelo; búsqueda global; relaciones de la ficha.
- El `<canvas>` recibe `aria-label` en `onCreated`; `<section aria-label="Visor tridimensional">` lo envuelve.
- Pendiente observado: el grupo `meshButtons` no tiene `role="group"` y en activos científicos muestra `nodeId` en vez del nombre de la estructura. Al tocarlo, etiquetar con `spanishName` y agrupar.

## Teclado y foco (2.1, 2.4.3, 2.4.7, 2.4.11)

- `:focus-visible` global: `outline:2px solid var(--accent); outline-offset:3px`. No eliminar outlines; comprobar que no queden tapados por paneles fijos (2.4.11).
- ToolsPanel: foco al botón cerrar al abrir y retorno al disparador al cerrar, `Escape` cierra, `inert`/`aria-hidden` cuando está cerrado. Replicar en cajones/diálogos nuevos.
- Pestañas: ToolsPanel implementa roving tabindex con ←/→/Inicio/Fin; StructurePanel aún no (solo clic/Tab). Patrón obligatorio para pestañas nuevas: `role="tablist"`, `role="tab"` + `aria-selected` + `aria-controls`, `role="tabpanel"` + `aria-labelledby` + `hidden`.
- Búsqueda: `combobox` + `listbox` + `option` con `aria-activedescendant`, ↑/↓/Enter/Escape. Mantener.
- OrbitControls no es operable por teclado: compensar con barra inferior (zoom, vista, aislar, restaurar) y presets.

## Nombres, roles y estado (4.1.2, 4.1.3)

- Botones solo icono: `aria-label` desde `t()`; icono Lucide `aria-hidden="true"`. Toggles: `aria-pressed` (Aislar, vistas, micrófono). Menú: `aria-expanded` + `aria-controls`.
- Mensajes de estado: `role="status"` en estado del visor, carga de ficha, búsqueda y voz; `role="alert"` para errores. Al añadir selección por canvas, anunciar el nombre seleccionado en una región `aria-live="polite"` existente o nueva (hoy la selección solo se refleja abriendo el panel con `aria-busy`).
- Pendiente observado: textos del visor, `aria-label` del canvas y `aria-label` del `<aside>` de la ficha están fijos en español; `<html lang="es">` es estático y el idioma se marca con `lang` en `.app`.
- Evitar landmarks anidados redundantes (hoy `<aside>` dentro de `<aside>` en la ficha).

## Contraste (1.4.3, 1.4.11) por tema

- `themeColors()` garantiza ≥ 4.5:1 para `--text/--muted/--subtle` y `--accent-ink/--accent`; `tests/unit/theme.test.ts` lo prueba en presets y extremos. Comprobar también 3:1 de bordes/indicadores de foco (`--accent` sobre `--panel`/`--surface`) y de los colores fijos sobre `--stage` (`#c0c6cb`, `#dce3e9`).
- Probar los seis `THEME_PRESETS` y un color libre claro y otro oscuro. No hay modo alto contraste ni `forced-colors`: si se añade, documentarlo en `docs/DECISIONES.md`.
- La selección 3D (emisivo `#087e83`) no debe ser la única señal: la ficha abierta y `aria-pressed` la acompañan (1.4.1).

## Movimiento, tamaño y reflujo

- `prefers-reduced-motion` desactiva transiciones en AppShell y ToolsPanel; `OrbitControls enableDamping` sigue activo. Al añadir animaciones, respetar la preferencia (CSS y, si aplica, `matchMedia` en JS).
- 2.5.8 (AA) exige ≥ 24×24 px: los botones cerrar y micrófono miden 31 px (cumplen AA; bajo los 44 px recomendados en táctil). Controles nuevos: ≥ 44 px salvo justificación.
- `--fontScale` 1.3 y zoom del navegador al 200 % sin pérdida de contenido (1.4.4, 1.4.10); 320 px sin scroll horizontal.
- Gestos multipunto (zoom con pellizco) tienen alternativa de un puntero en la barra inferior (2.5.1).

## Auditoría

1. Revisión manual con teclado completo y foco visible en escritorio y 390 px.
2. Lighthouse vía MCP `chrome-agente` (`mcp__chrome-agente__lighthouse_audit`, categoría accesibilidad) contra `npm run start` local; ver la skill global `navegador-chrome`. La puntuación es orientativa: Lighthouse no evalúa el contenido del Canvas.
3. axe: `axe-core@4.14.0` existe solo como dependencia transitiva de `eslint-plugin-jsx-a11y`; no hay `@axe-core/playwright` ni script de axe. No instalarlo sin autorización; mientras tanto, `npm run lint` aplica las reglas jsx-a11y de `eslint-config-next`.
4. Registrar herramienta, URL, tema, viewport, hallazgos y pendientes en `docs/PROGRESO.md`. Lectores de pantalla (NVDA, VoiceOver) solo si se ejecutaron realmente.
