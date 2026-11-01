---
name: ui-v2-design-system
description: Aplicar los tokens, temas y componentes reales de la UI V2 del Atlas Veterinario 3D al crear o modificar interfaz, conservando intacta la identidad de atlas_veterinario_ui_v2.html.
---

# Sistema de diseño UI V2

Activar al tocar `src/components/**`, `*.module.css`, `src/app/globals.css` o `src/lib/theme/*`. Leer antes `docs/ui-v2/design.md` y `docs/ui-v2/README.md`. La skill de terceros `vendor/frontend-design` queda subordinada a esta: solo orienta componentes nuevos, nunca rediseña los existentes. Para pruebas usar frontend-integration-testing y mobile-3d-qa; para accesibilidad, accessibility-wcag-3d.

## Archivo aprobado (solo lectura)

`atlas_veterinario_ui_v2.html` (raíz, 65 459 bytes) es la referencia visual. No editarlo, formatearlo ni moverlo. Comprobar su integridad antes y después de cualquier trabajo de UI:

```bash
sha256sum atlas_veterinario_ui_v2.html   # WSL/Linux
# PowerShell: Get-FileHash atlas_veterinario_ui_v2.html -Algorithm SHA256
# Esperado: 2412B2DF1DCCDD76821A7E663C7B7921152B769B0D4112792FFDFFD597A650BB
```

Si no coincide, detenerse e informar; no "restaurar" a mano. Su SVG y diccionario son simulados: no copiar anatomía, textos científicos ni `--modelFilter` (filtros CSS sobre el modelo están descartados; el Canvas no lleva filtros).

## Tokens

Fuente de verdad en runtime: `themeColors(color)` de `src/lib/theme/theme.ts`, aplicado por `useThemeSettings()` como `style` en `.app` de `AppShell`. No declarar variables de tema en `globals.css` (solo reset, `:focus-visible`, `::selection` y fallbacks `var(--accent,#d2e6df)`).

- Color: `--bg`, `--top`, `--stage`, `--panel` (rgba translúcido), `--surface`, `--surface-hover`, `--text`, `--muted`, `--subtle`, `--accent`, `--accent-ink`, `--accent-soft`, `--line`, `--edge`, `--shadow`, `--fontScale`.
- Valores del boceto (`:root` del HTML, grafito): `--bg #22252b`, `--top #24282f`, `--stage #1c2025`, `--panel rgba(39,44,52,.88)`, `--surface #353a43`, `--surface-hover #414650`, `--text #f5f5f6`, `--muted #acb0b7`, `--subtle #777f89`, `--accent #d2e6df`, `--accent-ink #1c312c`, `--shadow 0 22px 60px rgba(0,0,0,.30)`. En la app se derivan del color base y pueden diferir levemente para garantizar contraste.
- Temas: no hay archivos de tema; hay un color base libre (`settings.color`, hex de 6 dígitos) y `THEME_PRESETS` en `src/lib/theme/settings.ts`: `#29303A` grafito (defecto), `#214D4B` bosque, `#343055` noche violeta, `#664134` terracota, `#DFD8CB` arena clara, `#F1F3F5` claro. Claro/oscuro se decide por luminancia (`lum > .47`). No existe tema de alto contraste ni soporte `prefers-contrast`/`forced-colors`; no afirmarlo.
- Contraste: `readable()` empuja `--text/--muted/--subtle` hasta ≥ 4.5:1 sobre `--bg/--top/--surface/--panel/--surface-hover`, y `--accent-ink` sobre `--accent`. `--stage` siempre oscuro; `exposure` 1.15. Probado en `tests/unit/theme.test.ts`.
- Tipografía: pila `Inter,"SF Pro Display",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif`; Inter no se carga (sin `next/font` ni `@font-face`), usa la del sistema si existe. Base `calc(14px * var(--fontScale))`, escalas 0.9/1/1.15/1.3, `letter-spacing:-.012em`; tamaños en `em`; pesos 550–700 (títulos de ficha 650).
- Radios usados: 7, 9–13 px (controles, chips, botones), 14–17 px (pills, barra, buscador), 19 px (popover), 23 px (stage y panel), 40 px (switch), 50 % (puntos).
- Superficies flotantes: `background:var(--panel)`, `border:1px solid var(--line)`, `box-shadow:var(--shadow)`, `backdrop-filter:blur(20–35px)`.
- Alturas: topbar 74 px (66 px ≤ 790 px); controles 43–48 px; barra inferior 44 px.
- Breakpoints existentes: 1150/1100, 790, 700, 650, 580 px; `prefers-reduced-motion` en AppShell y ToolsPanel.
- Colores fijos fuera de tokens (sobre `--stage` oscuro): `#f5f6f7`, `#dce3e9`, `#c0c6cb`, `#e1e6e9`, punto de estado `#9ac9ad`, resaltado 3D `#087e83`, colores de capa en `ToolsPanel.tsx`. No añadir más sin justificar contraste.

## Componentes existentes

- `src/components/layout/`: `AppShell` (export default, importado como `AtlasWorkspace` en `page.tsx`), `Topbar`, `MobileOrientationNotice`; estilos en `AppShell.module.css`.
- `src/components/tools/ToolsPanel` (cajón Capas/Vistas/Ajustes).
- `src/components/search/GlobalSearch` y `VoiceSearch` (`search.module.css`).
- `src/components/anatomy/StructurePanel` (default; pestañas Anatomía/Imágenes reales/Fuentes).
- `src/components/media/ReferenceGallery` (default).
- `src/components/viewer/AnatomyViewer` (default, cargado con `next/dynamic` sin SSR; variantes `classic`/`immersive`).
- Hooks: `useAnatomyWorkspace`, `useAnatomySearch`, `useThemeSettings`. Iconos: `lucide-react` con `aria-hidden="true"`.

## Reglas para componentes nuevos

1. Reutilizar antes de crear: si el patrón existe (pill, `.box`, `.segment`, `.toggleRow`, tarjeta de referencia, tag), copiar su estructura y radios.
2. CSS Module propio junto al componente; solo `var(--…)` de la lista anterior. Nada de hex nuevos, Tailwind, librerías UI, fuentes externas, `<style>` globales ni HTML arbitrario.
3. Superficie flotante = receta `--panel` + `--line` + `--shadow` + blur. Texto secundario `--muted`; acento solo para estado activo/foco.
4. Tamaños en `em` para respetar `--fontScale`; probar 0.9 y 1.3.
5. Verificar en los seis presets y con un color libre extremo (`#000000`, `#FFFFFF`); si un texto nuevo no usa tokens, medir con `contrastRatio()` y añadir caso a `theme.test.ts`.
6. Textos visibles mediante `t()` (ver i18n-es-en). Sin datos anatómicos inventados.
7. Comparar capturas al mismo tamaño que `docs/ui-v2/screenshots/` y recalcular el SHA-256 del HTML al terminar.

Entrega: archivos tocados, presets probados, capturas inspeccionadas, hash del HTML comprobado; cambios de decisión en `docs/DECISIONES.md`.
