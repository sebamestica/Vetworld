---
name: i18n-es-en
description: Mantener el selector español/inglés de la interfaz del Atlas Veterinario 3D con el diccionario real del repositorio, sin traducir contenido científico sin fuente y conservando nombres latinos NAV invariables.
---

# Interfaz ES/EN

Activar al añadir o cambiar textos visibles, `aria-label`, mensajes de estado o el selector de idioma. Contenido anatómico: anatomy-integrity. Microcopy: anatomy-viewer-ux-patterns.

## Mecanismo real

- Sin librería i18n (no hay next-intl, i18next ni rutas por locale). Diccionario propio en `src/lib/ui/i18n.ts`: objeto `es` (fuente de las claves), `type UiKey = keyof typeof es`, `const en: Record<UiKey, string>` y `t(language, key)`. TypeScript estricto obliga a que `en` tenga todas las claves.
- Idioma: `UISettings.language: 'es' | 'en'` en `src/lib/theme/settings.ts` (zod), defecto `es`, persistido en `localStorage` bajo `vetworld.ui.v2` por `useThemeSettings`. Selector en ToolsPanel → Ajustes → «Idioma».
- `AppShell` lee `theme.settings.language`, pone `lang={language}` en `.app` y pasa `language` como prop a Topbar, ToolsPanel, StructurePanel, AnatomyViewer, MobileOrientationNotice; GlobalSearch, VoiceSearch y ReferenceGallery lo reciben indirectamente. `<html lang="es">` en `layout.tsx` es estático.
- Reconocimiento de voz: `es-CL` o `en-US` según idioma.
- La búsqueda normaliza con `toLocaleLowerCase('es')` y quita diacríticos; busca en español, latín y sinónimos del catálogo, no en inglés.

## Deuda existente (no ampliar)

Muchos textos usan ternarios `language === 'en' ? … : …` en el componente (Topbar «Todo el animal», GlobalSearch, VoiceSearch, ReferenceGallery, AppShell, etiqueta de revisión en StructurePanel) y otros solo existen en español: estados de `AnatomyViewer`, `aria-label` del canvas, «Cargando 3D…», «Reintentar», etiquetas de campos/tipos/relaciones de StructurePanel y tipos de ReferenceGallery. Al tocar uno de esos archivos, mover a `t()` los textos de interfaz afectados; no reescribir todo de golpe sin tarea autorizada.

## Reglas

1. Texto nuevo de interfaz: clave en `es` y en `en` de `i18n.ts`, usado vía `t()`. No añadir ternarios nuevos ni cadenas sueltas en JSX. Ejemplo de migración (la clave `wholeAnimal` aún no existe):

   ```ts
   // i18n.ts — en `es`: wholeAnimal: 'Todo el animal',  en `en`: wholeAnimal: 'Whole animal',
   <option value="all">{t(language, 'wholeAnimal')}</option>
   ```

2. Interfaz sí se traduce: controles, ayudas, estados, errores, avisos de licencia/revisión, `aria-label`.
3. Contenido científico no se traduce sin fuente revisada: `spanishName`, `summary`, campos descriptivos, relaciones, notas de revisión, títulos y leyendas de referencias permanecen como vienen del catálogo. En inglés mostrar `t('translationNotice')` (lo hace StructurePanel).
4. `canonicalLatinName` (NAV) es invariable en ambos idiomas: no traducir, no anglicizar, no cambiar mayúsculas/cursiva. Nombres de especie científicos (`scientificName`) igual.
5. Sinónimos (`aliases`) son datos del catálogo con fuente: no generar sinónimos ingleses por traducción automática ni añadirlos a la búsqueda sin fuente registrada en `docs/FUENTES_ANATOMICAS.md`.
6. Términos de orientación (Craneal/Cranial, Caudal, Dorsal, Ventral, Sagital/Sagittal) siguen la terminología veterinaria, no la humana (no «anterior/posterior»).
7. Atribuciones y licencias (p. ej. «CC BY-NC-SA 4.0», nombres de autor) no se traducen.
8. No traducir con IA textos destinados al catálogo; el inglés de interfaz puede redactarse, el científico requiere fuente y revisión humana.

## Pruebas

- Existentes: `tests/unit/panel.test.tsx` (inglés mantiene «Escápula»/«Scapula», muestra el aviso de traducción y traduce pestañas y cerrar), `tests/unit/tools.test.tsx` (selector emite `{ language: 'en' }`), `tests/unit/theme-storage.test.tsx` (persistencia del idioma), `tests/e2e/ui-v2.spec.ts` (cambio a inglés en la UI real).
- Al añadir claves: `npm run typecheck` detecta faltantes en `en`; añadir aserción por rol/nombre accesible en ambos idiomas para controles nuevos y comprobar que el nombre latino no cambia.
- Comprobar desbordes del inglés en 390 px y en la barra inferior (los textos se ocultan ≤ 580 px; el `aria-label` debe seguir traducido).
- Ejecutar `npm run lint`, `npm run typecheck`, `npm run test` y, si cambia UI visible, `npm run test:e2e` tras build. Registrar resultados en `docs/PROGRESO.md`.
