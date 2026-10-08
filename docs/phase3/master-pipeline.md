# Maestros: construcción y bloqueos

Los inventarios de `data/osteology/reference/` son plantillas; no identifican un espécimen ni certifican cantidades universales. `data/osteology/coverage.json` separa entradas de referencia de huesos efectivamente ensamblados: actualmente cero para ambas especies.

## Comandos reproducibles

```powershell
npx tsx scripts/osteology/generate-reference-inventories.ts
npx tsx scripts/osteology/validate-inventories.ts --report
npx vitest run tests/unit/osteology.test.ts
& .tools/blender-4.5.14/blender-4.5.14-windows-x64/blender.exe --background --factory-startup --python scripts/osteology/create-master-drafts.py
```

Blender portable permanece fuera de Git. El script crea `workbench/masters/drafts/canine_master.blend` y `feline_master.blend`, con metros, orientación declarada y colecciones regionales. Guarda y vuelve a abrir cada archivo para comprobarlo. No contiene huesos, cámaras, primitivas ni exportaciones GLB. Se niega a sobrescribir un maestro existente. Estos borradores NO cumplen el entregable de animal ensamblado y no se cargan en el visor como anatomía.

## Admisión futura

Conservar originales intactos y su checksum. Registrar permiso por archivo, espécimen, unidades medidas, lateralidad, transformaciones y correspondencias científicas antes de importar geometría. Una pieza puede tener varias mallas; una malla fusionada puede admitir regiones documentadas, sin inventar separaciones. La conciliación automática solo propone identidad; no publica registros inciertos en la API o búsqueda.

Para ambas especies faltan geometrías admitidas del cráneo, hioides, oído, dentición individual, columna, costillas, esternón, pelvis, extremidades, manos/pies, sesamoideos y cola. La presencia en un candidato externo no equivale a adquisición ni segmentación. El número exacto pendiente se resolverá con el espécimen; por ahora es desconocido.

Canino: candidato completo LMU, descarga deshabilitada y sin licencia de archivo comprobada. Felino: candidato Tavernier bajo BY-NC-SA 4.0, acceso oficial de descarga requiere autenticación; petición sin credenciales devolvió HTTP 401. No se eludió. Ver auditoría de fuentes. Se necesitan archivos autorizados, metadatos del espécimen y revisión humana; CT con permiso y segmentación trazable permitirían reconstruir piezas no separables.

La fase científica continúa abierta. No se han construido ni exportado dos esqueletos completos. Los activos regionales previos requieren resolver permisos y escala antes de admitirlos como piezas de maestros.
