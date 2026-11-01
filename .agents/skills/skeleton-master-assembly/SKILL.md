---
name: skeleton-master-assembly
description: Construir y auditar maestros osteológicos caninos y felinos en Blender con inventario por espécimen, jerarquías seleccionables y exportaciones derivadas sin falsear completitud.
---

# Maestros osteológicos

Activar al ensamblar un animal completo, conciliar piezas o exportar un maestro. Leer inventario por especie y auditoría de fuentes; aplicar anatomy-integrity y 3d-asset-pipeline existentes.

- Elegir espécimen y marco métrico antes de colocar huesos. Una plantilla de referencia no determina su dentición, cola, sesamoideos o fusiones reales.
- Ejes por espécimen, derivados de la geometría y documentados. Lado anatómico derecho = craneal × dorsal (mano derecha): con -Y craneal y +Z dorsal, la derecha del animal es -X (la +X de la vista frontal de Blender es la derecha del observador). Un archivo reflejado no se detecta por geometría: sin evidencia, lado `unknown`. Documentar la conversión al glTF del visor (+Y arriba). Verificar escala física contra mediciones fuente; no normalizar piezas para hacerlas encajar.
- Preservar originales y separar colecciones fuente, pendientes y ensambladas. Huesos visibles quedan en objetos individualizados; grupos y empties no cuentan como geometría.
- Registrar ID estable, espécimen, lado, serial, fuente, transformaciones y revisión. Modelos multiespécimen o reflejados deben declararlo; no clasificarlos como escaneo íntegro.
- Componentes de huesos fusionados pueden compartir una malla con regiones verificadas; no introducir cortes geométricos falsos. Varios meshes de un hueso conservan un único ID anatómico.
- No completar huecos con primitivas. Reconstrucción requiere datos y método defendible; sin datos, conservar bloqueo. Publicar solo archivos y licencias admitidos.
- Exportar variantes desde copias; nunca sustituir el master por una malla reducida. La disponibilidad web depende de archivos, mapping y permisos, no del estado del build.

Verificar: Blender abre la escena, unidades/orientación coherentes, IDs únicos, jerarquías sin ciclos, meshes con mapping, transforms rastreables, lateralidad y escala documentadas, cobertura específica del espécimen. La inspección técnica no reemplaza revisión humana; drafts o parciales mantienen su condición explícita.
