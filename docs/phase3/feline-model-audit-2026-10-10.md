# Auditoría visual privada del conjunto felino — 2026-10-10

El GLB sirve como referencia corporal y base de anotación, pero actualmente **no permite ofrecer todos los huesos individualizados**. Hay irregularidad superficial y discontinuidades visibles que dificultan interpretar zonas finas. Eso justifica revisar su calidad geométrica; no permite afirmar que el espécimen tenga malformaciones ni declarar qué huesos faltan. Su exactitud anatómica permanece pendiente de revisión humana cualificada.

## Archivo y evidencia reutilizada

- Fuente: `workbench/processing/feline/cat-skeleton/source/Chat.glb`, intacta. SHA-256 comprobado al renderizar: `c570679a9f450c32aeded26c7b459993e984ee6fb01677170e4cd7cdf9220783`.
- Una malla `chat`; 74.235 triángulos. No existen nodos científicos por hueso. El candidato `workbench/masters/candidates/feline_master.blend` no es un maestro osteológico admitido.
- [Diagnóstico anterior](segmentation-diagnostic.md): 75 componentes por coordenadas exactas y las tolerancias ensayadas; 73.217 caras (98,63 %) en el componente mayor. No repetir la interpretación histórica de 7.349 islas por índices como huesos o fracturas físicas: incluía costuras de vértices duplicados.
- Captura previa inspeccionada: `workbench/inspection/user-models/feline-Chat-inspection.png`.
- Procedencia reutilizada: `data/osteology/feline-acquisition.json`, declaración de descarga del usuario y metadatos previamente registrados. Sin nueva investigación ni descargas.

## Inspección nueva reproducible

Blender portable 4.5.14 LTS importó el GLB original y produjo vistas ortogonales sin alterar vértices, caras ni transformaciones del objeto. Solo se sustituyó el material en memoria por gris neutro y se añadieron cámara/iluminación de inspección. No se guardó ni exportó una geometría derivada.

Artefactos privados en `workbench/inspection/feline-oct10/`:

| Archivo | Qué permite observar |
|---|---|
| `full-axis-y.png` | Conjunto desde un lateral técnico; discontinuidades en región torácica y superficies de miembros |
| `full-axis-x.png` | Vista axial técnica; superposición de ambos lados y superficies estrechas |
| `full-axis-z.png` | Vista superior técnica; ambos lados, estrechamiento y siluetas irregulares |
| `axis-y.png`, `axis-x.png`, `axis-z.png` | Encuadres centrales ampliados; recortan extremos y no sirven para evaluar cobertura total |
| `render-report.json` | Hash, mallas, caras y límites espaciales medidos |
| `render_audit.py` | Reproducción local, sin escrituras sobre fuente/candidato |

Las seis imágenes fueron abiertas e inspeccionadas. La primera corrida usó encuadres demasiado cercanos para una vista total; se conservan como ampliaciones centrales y se repitió el render con encuadres completos. Nombres de ejes indican ejes Blender tras importar glTF, no certificación de orientación anatómica/lateralidad. El marco maestro +X derecha, -Y craneal, +Z dorsal aún debe verificarse antes de adoptar este activo como maestro.

```powershell
& .tools/blender-4.5.14/blender-4.5.14-windows-x64/blender.exe --background --factory-startup --python-exit-code 1 --python workbench/inspection/feline-oct10/render_audit.py
```

## Hallazgos y límites

| Hallazgo | Evidencia y significado defendible | Lo que no demuestra |
|---|---|---|
| Conjunto geométricamente conectado | Diagnóstico previo por coordenadas; separación automática no produce un inventario de huesos | Que cada contacto geométrico sea una fusión anatómica real |
| Superficie irregular, facetas y aperturas visibles | Persisten en gris neutro y varias vistas; no dependen únicamente de la textura del visor | Causa concreta: escaneo, reconstrucción, simplificación o daño del espécimen no se determinan aquí |
| Tiras estrechas, extremos irregulares y pequeños fragmentos en región torácica | Ampliaciones lateral/superior y 75 componentes registrados | Número de costillas ausentes ni lesión del espécimen; faltan inspección localizada y datos fuente |
| Límites articulares y estructuras pequeñas poco legibles | Miembros y extremos superpuestos en vista axial; piezas distales de superficie irregular | Ausencia de patella, sesamoideos, dientes, huesos carpales/tarsales u otras estructuras ocultas |
| Escala física no verificada | Límites de escena medidos: mínimo (-6,38955; -1,50161; -0,31358), máximo (5,51062; 1,61339; 5,88858), en unidades importadas | Que dichas unidades representen una talla real; la convención glTF no calibra el espécimen |

No se contó dentición, vértebras, costillas ni falanges a partir de imágenes. Tampoco se calcularon nuevos índices de calidad manifold, autointersecciones o espesor: cualquier afirmación cuantitativa sobre esos defectos requiere un análisis separado que distinga costuras glTF de discontinuidades espaciales. Las aperturas visibles son observaciones de superficie, no identificación anatómica validada.

## Qué reutilizar y cómo plantear el despiece

1. Conservar el original, licencia y hash; usar el conjunto para contexto corporal y el archivo existente `workbench/segmentation/feline/feline_annotation.blend` para anotaciones con `source_face_index`. Esto mantiene rastreabilidad hasta cada triángulo fuente.
2. Un revisor competente debe delimitar un primer hueso inequívoco y su lateralidad en varias vistas. Un componente conectado o una región de pantalla no es un hueso identificado. Si no existe un límite defendible, registrar el bloqueo y conservar ese tejido geométrico sin asignar.
3. Ejecutar el particionador existente únicamente sobre caras anotadas, dejando remanente íntegro. No cerrar huecos automáticamente, introducir superficies internas, nombrar fragmentos por tamaño ni separar por cortes arbitrarios. Una partición de superficies no reconstruye el volumen completo del hueso.
4. Comparar cada subconjunto con el inventario felino específico del espécimen; registrar presencia comprobada, geometría parcial, no identificable o no representada. El inventario de referencia no permite prometer una cantidad universal o completitud.
5. Para conseguir **todos** los huesos, hacen falta datos que el GLB no aporta por sí solo: versión segmentada identificada del mismo espécimen, imágenes/escaneo fuente suficientes para recuperar límites ocultos, identidad y medidas del espécimen y revisión anatómica documentada. Si esos datos no existen, adquirir geometría autorizada adicional con procedencia por pieza y declarar cualquier combinación de especímenes; no fabricar lo perdido.
6. Dos medidas rastreables del mismo espécimen permiten evaluar calibración uniforme con el comprobador existente. No usar dimensiones universales de gato para hacer encajar piezas.

No se admite ningún hueso nuevo ni se cambia el catálogo. `reviewStatus=pending`; cero huesos científicamente individualizados en este conjunto. La selección individual y la declaración de esqueleto completo siguen bloqueadas por anotación/evidencia, calidad geométrica localizada, escala y revisión humana.

## Atribución y alcance

Cat Skeleton — Tavernier Amaury — [página de origen registrada](https://sketchfab.com/3d-models/cat-skeleton-7106115b299649e992476f2d3b4fc602) — [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Renders privados de inspección con material gris y cámaras de auditoría; cambios de presentación declarados, geometría fuente preservada. Mantener atribución, condición no comercial y compartir adaptaciones bajo la misma licencia cuando corresponda. No se publicaron nuevas geometrías ni se desplegó la aplicación.

No cambió aplicación, HTML UI V2, catálogos, inventarios ni candidato Blender. No se ejecutaron pruebas de frontend/API: este trabajo es una inspección técnica y visual, no validación anatómica ni QA del visor.
