---
name: blender-headless-automation
description: Ejecutar scripts bpy en el Blender 4.5 portable del repo en modo background, desde PowerShell o WSL, con código de error fiable, verificación por guardado y reapertura, renders de inspección y protección de originales.
---

# Automatización de Blender sin interfaz

Activar al escribir o ejecutar scripts de `scripts/osteology/*.py` u otros bpy. Para criterios de maestros, orientación y escala aplicar skeleton-master-assembly; para ingesta/procedencia, 3d-asset-pipeline. Esta skill cubre solo la mecánica de ejecución. No instala Blender ni complementos.

## Ejecutable y comando

Blender portable (fuera de Git, `.tools/` en `.gitignore`): `.tools/blender-4.5.14/blender-4.5.14-windows-x64/blender.exe` (4.5.14 LTS, Python 3.11 embebido). Ejecutar siempre desde la raíz del repo:

```bash
.tools/blender-4.5.14/blender-4.5.14-windows-x64/blender.exe --background --factory-startup --python-exit-code 1 --python scripts/osteology/<script>.py
```

En PowerShell anteponer `& `. `--factory-startup` evita preferencias y add-ons del usuario; `--python-exit-code 1` convierte una excepción Python en código de salida 1 (sin él Blender termina con 0 aunque el script falle). Comprobar `$?`/`$LASTEXITCODE` y el texto `Error: script failed` antes de dar un paso por bueno. `master-pipeline.md` muestra un comando sin `--python-exit-code`: añadirlo en ejecuciones nuevas.

## WSL y rutas

- Desde WSL el `.exe` corre por interop como proceso Windows. El directorio actual `/mnt/c/dev/Vetworld` se traduce a `C:\dev\Vetworld`, así que rutas **relativas** funcionan.
- Una ruta `/mnt/c/...` pasada como argumento o abierta dentro de Python **no** existe para Blender (comprobado: `Path('/mnt/c/...').exists()` → `False`). Usar rutas relativas, `wslpath -w <ruta>` o, mejor, derivar rutas en el script con `root = Path(__file__).resolve().parents[2]`, como hacen los scripts existentes.
- Los archivos escritos por Blender aparecen en `/mnt/c/...`; no mezclar separadores en JSON de trazabilidad: guardar `relative_to(root).as_posix()`.

## Patrones bpy 4.5 usados en el repo

- Escena limpia: `bpy.ops.wm.read_factory_settings(use_empty=True)`; luego `bpy.ops.import_scene.gltf(filepath=...)` o `bpy.ops.wm.stl_import(filepath=...)` (ver `create-imported-masters.py`, `inspect-user-models.py`).
- Conversión de ejes glTF → Blender al leer posiciones crudas: `(x, -z, y)` (`create-annotation-workspace.py`). Documentar la conversión; no aplicar escala.
- Atributo de cara persistente: `mesh.attributes.new("source_face_index", "INT", "FACE")`, asignado por correspondencia exacta de coordenadas con los triángulos del GLB; si una cara no coincide, `raise RuntimeError` en vez de inferir. El índice de polígono de Blender no equivale al orden del GLB.
- Metadatos como propiedades personalizadas (`scene["reviewStatus"] = "pending"`, `obj["sourceSha256"]`), nunca dentro del nombre del objeto.
- Exportar glTF: `bpy.ops.export_scene.gltf(filepath=..., export_format="GLB", use_selection=..., export_extras=..., export_attributes=...)` existe en 4.5.14; ningún script del repo exporta todavía. Tras exportar, reinspeccionar el GLB (nombres de nodos, triángulos, SHA-256); no asumir que atributos personalizados sobreviven sin comprobarlo.

## Verificar guardando y reabriendo

Todo `.blend` creado se verifica con `bpy.ops.wm.save_as_mainfile(filepath=...)` seguido de `bpy.ops.wm.open_mainfile(filepath=...)` y una aserción sobre lo reabierto (conteo de caras, longitud del atributo, propiedades). Patrón en `create-annotation-workspace.py`, `create-master-drafts.py`, `inspect-pilot-proposal.py`. Usar `assert`/`raise` para que el fallo llegue al código de salida.

## Renders de inspección

Ver `render-inspection.py` y `render-pilot-regions.py`: motor `BLENDER_WORKBENCH`, luz `STUDIO`, cavidad, cámara `ORTHO` encuadrada con `bound_box` en espacio mundo y `clip_start/clip_end` proporcionales a la extensión. Con `--factory-startup` + escena vacía no hay world: crearlo (`if scene.world is None: scene.world = bpy.data.worlds.new(...)`) antes de fijar `background_type = "WORLD"`. Renders a `workbench/...`, privados; una imagen no valida anatomía.

## Argumentos y JSON

- Argumentos propios después de `--`; el script los lee de `sys.argv` (p. ej. `render-inspection.py` busca `--masters`).
- JSON editados en Windows pueden traer BOM. En Python leer con `encoding="utf-8-sig"`; en TS el repo usa `.replace(/^\uFEFF/, '')` (`apply-segmentation-review.ts`, `check-calibration.ts`). Escribir siempre `encoding="utf-8"` sin BOM.

## Protección de datos

- Nunca escribir en `workbench/incoming/` ni sobre la fuente `workbench/processing/feline/cat-skeleton/source/Chat.glb`. Trabajar sobre copias y escenas derivadas.
- No sobrescribir: comprobar `target.exists()` y abortar, o abrir con `open(..., "x")` (`export-selected-faces.py`, `propose-pilot-surfaces.py`). Nombres derivados por hash cuando proceda.
- Salidas solo en `workbench/` (ignorado por Git); nada a `public/`, catálogo ni API desde Blender.

Verificar: código de salida 0 con `--python-exit-code 1`, archivos esperados creados y reabiertos, conteos/hashes impresos en JSON de informe, originales con SHA-256 intacto. Registrar comando y resultado en `docs/PROGRESO.md`.
