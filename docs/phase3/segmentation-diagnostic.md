# Diagnóstico y herramientas de revisión

## Hallazgo felino real

La inspección inicial contaba 7.349 componentes por índices de vértices. Ese número no distingue discontinuidad espacial de costuras con vértices duplicados. Se corrigió el análisis mediante conectividad virtual por posiciones coincidentes, sin editar geometría: 75 componentes tanto con coincidencia exacta como con cuantización de 1e-7, 1e-6 y 1e-5 unidades fuente. El componente mayor contiene 73.217/74.235 triángulos (98,63 %). Los siguientes tienen 190, 76 y 56 caras, no evidencia de huesos largos separados.

La mayoría del conjunto está conectada; separación automática por componentes no entrega un piloto anatómico fiable. Esto no demuestra que toda segmentación manual sea imposible: requiere anotación de límites defendibles, mejores datos o versión segmentada. No se publicaron nuevas piezas ni asignaron nombres de huesos a componentes por tamaño.

`diagnose-segmentation.py` produjo listados de caras privados y resumen reproducible. Las caras del diagnóstico Blender no se asumen equivalentes al orden del GLB: para el flujo de partición se debe anotar/verificar índices en el archivo original. No se modificaron originales ni el modelo corporal del visor.

Después se creó realmente `feline_annotation.blend`: 74.235 caras cotejadas por coordenadas exactas con los triángulos GLB, con atributo persistente `source_face_index`. Escena guardada y reabierta con éxito. Esto habilita anotación manual rastreable; no implica que se hayan identificado huesos. Script de exportación de selección preparado, sin ejecutar una selección científica inexistente.

## Pipeline implementado

- Zod valida propuestas, versión/hash, especie, caras sin solapamientos y registro de revisión humana.
- `partitionGlb` divide exclusivamente índices de triángulos: conserva posiciones/UV/materiales, buffers fuente y transformación del nodo. Retiene todas las caras sin asignar como remanente no identificado. No genera superficies para cerrar cortes ni certifica anatomía.
- El piloto rechaza animaciones, skin, morphs, jerarquías e instancias que requieran un pipeline adicional, en vez de perder transformaciones silenciosamente.
- CLI genera propuestas solo en workbench; sin registro humano permite únicamente `--preview`. No escribe API, catálogo, public ni IDs científicos admitidos. También se niega a generar un despiece vacío o de otra versión. Archivos derivados se nombran por hash y no se sobrescriben.
- Calibración exige dos medidas del mismo espécimen, puntos/locadores/evidencia e incertidumbre. Calcula conversión uniforme y rechaza medidas incompatibles o puntos coincidentes. Resultado numérico consistente aún requiere revisar fuente y puntos; no valida científicamente la escala.

Comandos:

```powershell
& .tools/blender-4.5.14/blender-4.5.14-windows-x64/blender.exe --background --factory-startup --python-exit-code 1 --python scripts/osteology/diagnose-segmentation.py
npx tsx scripts/osteology/apply-segmentation-review.ts workbench/segmentation/feline/review-template.json --preview
npx tsx scripts/osteology/check-calibration.ts workbench/segmentation/feline/calibration.json
npx vitest run tests/unit/asset-review.test.ts
```

La plantilla actual no contiene grupos ni medidas inventadas: los comandos de partición/calibración deben bloquearse hasta que haya anotaciones/evidencia. No se declara una partición felina real generada. Las pruebas del particionador usan exclusivamente una geometría sintética creada dentro del test y no mezclada con catálogo científico.

## Bloqueos y siguiente intervención

Piloto C/D: límites anatómicos anotados y rastreables. Escala B: dos medidas fuente del mismo espécimen; no recibidas. Revisión E: anatomista competente y registro; no recibidos. Canino F/G/H: permiso de redistribución web y medidas/registro suficientes para ensamblar; no recibidos. Solicitudes listas en `docs/phase3/requests/`, ninguna enviada. El perro sigue privado y no se reflejaron o recolocaron piezas para inventar un ensamblaje.

El visor previo continúa funcionando con conjunto felino y selección ósea pendiente. El alcance científico sigue abierto; se completó el diagnóstico y soporte técnico para una revisión real, no dos esqueletos validados.
