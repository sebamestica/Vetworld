# Fase 3: dos esqueletos maestros

Autorización actual: inventarios completos por especie, adquisición gratuita autorizada, maestros Blender, exportaciones derivadas y conexión al visor existente. No publicar activos sin permiso ni rediseñar UI V2.

## Estado auditado al retomar

Base `cf6a1a5` con activos regionales y cambios previos sin commit. Se preservó el diff y una copia de catálogos en `workbench/phase3/preexisting/`, fuera de Git. El texto privado de NAV 6 está en `workbench/references/nav6.txt`. Hay geometría regional, no dos esqueletos completos. Las afirmaciones anteriores de permisos y escala requieren corrección según [auditoría primaria](source-audit.md).

## Invariantes

- Separar plantilla osteológica de referencia y espécimen elegido: no calcular un total universal ni marcar la plantilla como anatomía adquirida.
- Un estado `downloaded` requiere archivo y origen autorizado; `assembled` necesita transformaciones y continuidad, no solo un nodo. `anatomically_validated` requiere revisor humano y evidencia.
- Conservar huesos fusionados con componentes anatómicos sin sumar dos veces ni dibujar suturas ficticias. Cola, dientes, sesamoideos y variantes se resuelven según espécimen.
- Identificadores independientes del nombre Blender. Una estructura puede tener varias mallas; regiones dentro de una malla solo con selección documentada (p. ej. rangos de caras), no duplicación de geometría.
- Blender: metros, +X derecha, -Y craneal, +Z dorsal. Export glTF: +X derecha, +Y dorsal, +Z craneal. Es un marco planificado; las transformaciones reales necesitan evidencia del espécimen.
- Originales, maestros y web separados; sin decimación destructiva del maestro. Herramientas Blender portables dentro del workspace; sin procesamiento geométrico en peticiones API.
- Maestros vacíos/drafts no se presentan como animales. Solo geometrías autorizadas pueden incorporarse; las dudosas permanecen privadas. El visor no llama completo a un conjunto regional.

## Hitos verificables

1. Plantillas canina/felina, jerarquías, referencias NAV y variabilidad.
2. Auditoría de archivos/derechos. Candidatos LMU canino y Tavernier felino necesitan acceso formal; GitHub educativo y NIH no equivalen a una licencia.
3. Registro por espécimen, cobertura y conciliación; no publicar identificaciones automáticas inciertas.
4. Construcción Blender reproducible, inspección de escenas y pruebas técnicas con fixtures sintéticas separadas. Guardar draft si falta geometría, sin declarar ensamblaje.
5. Exportar GLB únicamente cuando haya estructuras admitidas; preservar IDs, escalas, transformaciones y atributos.
6. Integrar vista inicial del animal entero y filtros regionales sin modificar el diseño. Si falta maestro, estado real de ausencia.
7. Verificadores, backend/UI regresión y reportes de huecos, método y fuentes necesarios. Fase científica abierta mientras falten los dos animales reales.
