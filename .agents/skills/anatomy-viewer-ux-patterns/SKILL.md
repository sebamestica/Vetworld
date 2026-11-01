---
name: anatomy-viewer-ux-patterns
description: Patrones de interacción y microcopy del Atlas Veterinario 3D para estados vacíos, carga, error, selección, búsqueda, controles deshabilitados, avisos de revisión y atribución de licencias sin afirmar validación científica.
---

# Patrones UX del visor anatómico

Activar al diseñar o cambiar flujos del visor, fichas, búsqueda o avisos. Complementa ui-v2-design-system (aspecto), accessibility-wcag-3d (semántica) e i18n-es-en (textos). Integridad del contenido: anatomy-integrity. Pruebas: frontend-integration-testing.

## Principio

La interfaz informa lo que existe, no lo que se desea. Nunca mostrar geometría, fotos, campos o validaciones ausentes. Toda limitación se dice en el lugar donde el usuario la encontraría, en español claro y con una salida alternativa.

## Estados del visor (`AnatomyViewer` + `AppShell`)

- Catálogo cargando: `role="status"` «Consultando catálogo…». Error de catálogo: `role="alert"` con mensaje y botón «Reintentar».
- Sin activo o `availability !== "available"`: estado «Modelo 3D no disponible» (`t('noModel')`), sin Canvas. Mostrar la lista «Consultar estructura» (`fallbackList`) y, si la región no tiene fichas, «Todavía no hay fichas registradas en esta región.».
- Cargando GLB: «Cargando modelo 3D…» o «Cargando demostración técnica…».
- Fallo de descarga, integridad SHA-256 o texturas: «No se pudo abrir el visor 3D. Las fichas siguen disponibles en la lista.» + «Reintentar visor».
- WebGL ausente o contexto perdido: «WebGL no disponible o contexto perdido. Las fichas siguen disponibles en la lista.».
- Listo: «Visor listo» (oculto visualmente en `immersive`, presente para lectores).

Patrón de error útil: qué falló + qué sigue funcionando + acción. Evitar «Error», códigos HTTP o trazas. No convertir un error en éxito ni en vacío.

## Avisos de alcance

- Fixture técnica: «Geometría provisional · no anatómica» siempre visible; nunca sugerir orientación anatómica de la fixture.
- Modelo de cuerpo completo (`scope === 'whole-body'`): atribución visible y enlazada «Cat Skeleton · Tavernier Amaury · CC BY-NC-SA 4.0» (desde `asset.sourceUrl`/`asset.licenseUrl`), más «Escala y cobertura sin verificar · selección ósea pendiente». Con región filtrada: «La región filtra fichas; el modelo sin segmentar permanece visible.».
- Cortes: `clippingNotice` mientras haya plano activo; no representan tejido interno.
- Revisión: etiqueta «Revisión humana pendiente» en la cabecera de la ficha y en cada referencia; campos ausentes listados como «Campos pendientes de documentación». No usar «validado», «verificado» ni «exacto» salvo `review.status` documentado.
- Galería: sin fotos autorizadas decirlo («Aún no hay fotografías autorizadas para mostrar.»); externas solo como enlace, sin hotlink; la búsqueda externa lleva su descargo.

## Flujo canvas → selección → ficha → evidencia

1. Clic/toque en malla visible y mapeada (`meshMappings`, arrastre ≤ 5 px, no recortada) o botón equivalente de la lista accesible.
2. `selectId` / `selectStructure` en `useAnatomyWorkspace`: hace visible la capa de la malla, abre panel, anula aislamiento ajeno.
3. `StructurePanel` consulta ficha, relaciones, fuentes y referencias con `AbortController`; muestra «Cargando ficha anatómica…», error con «Reintentar» o contenido. Comprueba que la respuesta corresponde al ID pedido.
4. Pestañas: Anatomía (campos con dato, relaciones navegables), Imágenes reales, Fuentes (bibliografía y «Evidencia por campo» con localizador).
Una relación hacia otra región/especie navega cambiando contexto; si falla: «No se pudo abrir la estructura relacionada.».

## Búsqueda → foco

`GlobalSearch` busca en todo el catálogo (sin filtrar especie), agrupa por especie y muestra nombre español + latino. Seleccionar un resultado de otra especie o región reinicia el contexto (`reset`) y luego abre la ficha; nunca mezclar datos de perro y gato. Estados: «Buscando…», «No hay estructuras coincidentes en el catálogo.», «Búsqueda no disponible. Inténtalo de nuevo.». La voz nunca selecciona automáticamente: rellena el campo para revisar.

## Controles deshabilitados

Deshabilitar solo con causa real y hacerla visible cerca del control: capas sin geometría (`title` «Sin geometría disponible» + nota `layerNotice`), vistas/planos solo en la fixture técnica, Aislar sin selección mapeada, zoom sin activo. `title` no basta en táctil ni teclado: al añadir un control deshabilitado, acompañarlo de texto visible o `aria-describedby`. No ocultar la función para fingir completitud.

## Microcopy

- Español neutro con tuteo («Inténtalo», «Puedes escribir»), como el código actual; algunos textos antiguos usan usted («Seleccione», «Consulte»): no mezclar en un mismo componente nuevo.
- Nombres: español + latino NAV en cursiva; especie como «Canino/Felino».
- Frases cortas, sin exclamaciones ni promesas («pronto», «preciso»). Explicar límites sin culpar al usuario.
- Nada de «IA validó», «anatomía real» o «modelo exacto».

Verificación: recorrer cada estado (mock de GLB fallido, región vacía, búsqueda sin resultados, error API) según frontend-integration-testing y anotar resultados en `docs/PROGRESO.md`.
