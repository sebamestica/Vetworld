# Modelos entregados por el usuario — 2026-10-08

Se recibieron seis archivos en `workbench/`. Se movieron únicamente esos archivos a `workbench/incoming/feline/originals/` y `workbench/incoming/canine/originals/`. Los hashes SHA-256 antes/después coinciden. Recibo privado: `workbench/incoming/receipt-2026-10-08.json`. Archivos originales y texturas intactos, sin publicar ni agregar binarios a Git.

## Inspección real en Blender 4.5.14

| Archivo | Mallas importadas | Triángulos importados | Islas geométricas |
|---|---:|---:|---:|
| Chat.glb, dentro de cat-skeleton.zip | 1 | 74.235 | 7.349 |
| craneo_dog_skeleton.stl | 1 | 34.660 | 32 |
| espina dorsal_dog_skeleton.stl | 1 | 97.901 | 79 |
| pata delantera_dog_skeleton.stl | 1 | 21.614 | 30 |
| pata trasera_dog_skeleton.stl | 1 | 25.415 | 28 |

Una isla conectada NO equivale a un hueso. El felino tiene muchas islas pequeñas/fracturas; separarlas mecánicamente produciría miles de objetos, no un inventario anatómico. El ZIP contiene `source/Chat.glb` y `textures/chat_0.jpeg`, sin licencia incluida. El número de triángulos coincide con el candidato Tavernier investigado, pero eso solo no prueba procedencia; mantener pendiente la asociación exacta al registro/licencia.

Los cuatro STL coinciden por checksum con los incluidos en `3dexport_esqueleto_perro_1586301243.rar`. No contienen unidades ni licencia. Sus coordenadas preservadas los muestran separados espacialmente, como piezas regionales, no como animal articulado. No se reflejaron extremidades ni se recolocaron o escalaron arbitrariamente. Falta URL del recurso canino, autor, permisos y medidas/referencia para registro anatómico.

Blender informó eliminación automática de 3 triángulos degenerados y 220 duplicados durante la importación STL. Esta limpieza del importador afecta únicamente las copias Blender; los originales conservan sus hashes. No se decimó ni fabricó geometría.

## Escenas y capturas privadas

Escenas guardadas y reabiertas realmente:

- `workbench/masters/candidates/canine_master.blend`: cuatro mallas regionales en posiciones fuente, no ensamblado.
- `workbench/masters/candidates/feline_master.blend`: una malla de conjunto, sin selección ósea individual.

Los borradores vacíos anteriores permanecen en `workbench/masters/drafts/`. Los candidatos NO sustituyen maestros anatómicamente admitidos. Mantienen `physicalScaleStatus=unverified`, revisión pendiente y `webAvailable=false`. La convención glTF no acredita la escala física de un espécimen: dimensiones felinas aproximadas 11,84 × 3,23 × 6,23 unidades requieren comprobación, no convertir automáticamente a una talla universal.

Capturas obtenidas y examinadas: `workbench/inspection/user-models/canine_master.png`, `feline_master.png` y cinco vistas individuales. Felino muestra el conjunto corporal, con zonas fragmentadas/incompletas que impiden certificar cobertura; no se declara un esqueleto completo científicamente válido. Canino confirma piezas separadas. Estas imágenes no se publican porque los derechos de archivos aún necesitan conciliación.

## Reproducción y verificación

```powershell
& .tools/blender-4.5.14/blender-4.5.14-windows-x64/blender.exe --background --factory-startup --python-exit-code 1 --python scripts/osteology/inspect-user-models.py
& .tools/blender-4.5.14/blender-4.5.14-windows-x64/blender.exe --background --factory-startup --python-exit-code 1 --python scripts/osteology/create-imported-masters.py
& .tools/blender-4.5.14/blender-4.5.14-windows-x64/blender.exe --background --factory-startup --python-exit-code 1 --python scripts/osteology/render-inspection.py -- --masters
npx vitest run tests/unit/osteology.test.ts
```

Los dos primeros scripts protegen escenas existentes y se niegan a sobrescribirlas. Fueron ejecutados con éxito durante la primera importación. Reporte técnico completo en `workbench/inspection/user-models/inspection.json`. Las siete pruebas de inventario volvieron a pasar. No cambió la aplicación y no se volvió a ejecutar build/HTTP en este hito.

Siguiente trabajo: confirmar fuente/licencia del canino y correspondencia exacta del felino, verificar orientación y escala contra medidas, segmentación defendible e identificación ósea. No exponer recursos dudosos en `public/`, inventar huesos para rellenar huecos ni asignar nombres científicos por cercanía aproximada.

## Procedencia canina confirmada por el usuario

Página: https://3dexport.com/3d-model-esqueleto-de-perro-dog-skeleton-285869 ; producto 285869, autor hidden.art8, publicado 2020-04-07, STL gratuito. Verificada el 2026-10-08. El proveedor indica 3D Scan: No. El autor describe modificaciones para impresión y duplicación/reflejo de columna y patas para completar el lado izquierdo; no es evidencia de escaneo íntegro ni bilateralidad independiente. Cualquier reflejo futuro debe documentarse como aproximación, no hueso escaneado.

La página condiciona el uso Royalty Free a incorporación en un producto del que terceros no puedan recuperar el recurso por separado. https://help.3dexport.com/item/royalty-free-license/ prohíbe entregar el producto en su forma descargada. No se acredita autorización para distribuir GLB recuperables en un visor web o subir STL a GitHub. Mantener originales/candidatos privados y no integrar en public/ sin permiso compatible específico. El enlace suministrado resuelve procedencia declarada, no escala, precisión anatómica ni autorización de redistribución web. No se contactó al autor.

## Procedencia felina confirmada

El usuario confirmó que cat-skeleton.zip procede del enlace Cat Skeleton de Tavernier Amaury. Se asocia el SHA-256 del archivo recibido con esa declaración y los metadatos primarios previamente verificados. Licencia CC BY-NC-SA 4.0: atribución, uso no comercial, adaptaciones bajo la misma licencia y cambios declarados. Registro en data/osteology/feline-acquisition.json. Hash original nuevamente comprobado. Este permiso condicionado permite continuar el procesamiento; no acredita precisión, escala, cobertura o huesos individualizados. Todavía no se publicó ni incorporó al visor.
