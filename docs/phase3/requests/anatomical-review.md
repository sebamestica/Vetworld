# Paquete para revisión veterinaria — pendiente de responsable

Activo: felino Tavernier; conjunto visible, una malla. Fuente y licencia en `data/osteology/feline-acquisition.json`. Original SHA256 `c570679a9f450c32aeded26c7b459993e984ee6fb01677170e4cd7cdf9220783` (GLB), ZIP `eeeaf7353db4b7d7befa0432234eba37330fd368c73f055cbdeade8517cd112e`.

Material local:

- Maestro: `workbench/masters/candidates/feline_master.blend`.
- GLB intacto: `workbench/processing/feline/cat-skeleton/source/Chat.glb`.
- Capturas: `docs/phase3/screenshots/` y `workbench/inspection/user-models/`.
- Diagnóstico: `workbench/segmentation/feline/diagnostic-summary.json` y listados de caras por componente.
- Inventario de referencia: `data/osteology/reference/feline.json`, sin espécimen supuesto.

Primero identificar un piloto de piezas grandes donde los límites sean defendibles. Indicar nombre NAV, lado, región, identidad segura/incierta, límites observables, superficies conectadas a vecinos y caras que pertenezcan a cada pieza. No dibujar límites falsos en componentes naturalmente fusionados. Si no hay evidencia suficiente, indicar qué imagen, CT o modelo permitiría resolverlo.

Revisar aparte escala y orientación; ausencia de medidas impide validar escala métrica. Comprobar huesos/segmentos presentes o ausentes, dentición y cola según espécimen documentado. No usar la longitud de un gato promedio ni un total universal como criterio de completitud.

Registro por decisión: responsable, formación pertinente, fecha, versión/hash, piezas evaluadas, fuentes/locadores, observaciones, aceptación o rechazo y correcciones requeridas. El esquema informático comprueba campos, no credenciales ni exactitud científica. Hasta tener revisión competente documentada se mantiene pending.

Formato de anotación: `workbench/segmentation/feline/review-template.json`. `faceIndices` utiliza índice de triángulo del GLB original (0–74234), no un orden de caras Blender supuesto. Si se anotan en Blender, verificar correspondencia tras importación antes de exportar índices. Agrupar todas las mallas de un mismo hueso; no numerar fragmentos como huesos adicionales.

Workspace preparado: `workbench/segmentation/feline/feline_annotation.blend`. Las 74.235 caras se asociaron por coordenadas exactas al GLB fuente, se guardó `source_face_index` y se reabrió el archivo para comprobar persistencia. Seleccionar manualmente caras en Blender; ejecutar `scripts/osteology/export-selected-faces.py` en su editor de texto para exportar solo esa selección privada. El script se niega a exportar selección vacía o el animal entero como una pieza. No se ha ejecutado sobre una selección anatómica real, porque no hay límites aprobados todavía. Añadir esos índices a un grupo de la plantilla con identificación propuesta, fuente y notas; validar/preview con el CLI antes de admitir pieza alguna.

No existe revisión emitida ni firma en este paquete. No se solicita aprobación automática de un ensamblaje solo por parecer coherente.

## Actualización 2026-10-31 — alcance ampliado (no enviado)

Material nuevo para la persona revisora; todo sigue `pending` y nada fue aprobado por personas:

1. **Fichas bibliográficas (75 estructuras, 429 fieldEvidence).** Lotes `data/anatomy/_batches/feline-L-F1..F3.json` y `canine-L-C1..C2.json`. Por cada campo: fuente, localizador y afirmación. Revisar especialmente las equivalencias de términos históricos (Reighard 1901, Sisson 1914) con NAV 6.ª y las discrepancias registradas (forma de la rótula felina, contribución del pubis al acetábulo). Revisión asistida por IA en `docs/plan/revisiones/revision-lotes-2026-10-31.md`; no sustituye esta revisión.
2. **Superficies felinas parciales.** `data/osteology/proposals/feline/feline-surface-proposals-2026-10-31.json`, 13 propuestas + remanente (suma 74.235), capturas en `workbench/inspection/feline-oct31/proposals/`. Confirmar o rechazar la identidad de cada superficie; el lado anatómico sigue `unknown` (posible reflexión global del archivo). Ejes deducidos: craneal −X, dorsal +Z (`data/osteology/diagnostics/feline-axes-2026-10-31.json`).
3. **Canino privado 3DExport.** 32 propuestas de identificación en `data/osteology/diagnostics/canine.json`; modelo no escaneado y modificado para impresión, solo uso privado.
4. **Cráneo canino Zenodo 10327538** (fotogrametría, CC BY 4.0): escala `unknown`; confirmar especie y completitud de la dentición visible.

Formato de veredicto por elemento: id, aceptado/rechazado/corregir, corrección, fuente, responsable, formación, fecha y hash del archivo revisado.
