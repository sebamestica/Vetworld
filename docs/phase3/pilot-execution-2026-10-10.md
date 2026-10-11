# Ejecución del piloto felino

## Fichas bibliográficas incorporadas

Cuatro fichas de familia ósea: escápula, húmero, fémur y tibia. Las dos primeras ampliadas, las dos últimas nuevas. Todas parciales y con revisión humana pendiente; no se asignó lado de espécimen ni malla. NAV, descripción histórica felina y artículos modernos se relacionan con campos específicos, con locadores. Función/fijaciones/vascularización no documentadas permanecen vacías y declaradas pendientes. Fémur se normaliza como `Os femoris`, conservando `Femur` como alias.

La API añade `fieldEvidence` opcional, validado con Zod e integridad de campo/fuente. El panel lo muestra en Fuentes, con bibliografía segura; no expone rutas privadas de investigación. Fuentes nuevas permitidas solo como enlaces HTTPS curados, sin imágenes ni hotlink. Datos `2026-10-10.1`, OpenAPI `1.3.0` y API v1. No cambia diseño UI V2.

La primera validación detectó una relación antigua de origen del bíceps que necesitaba conservar su fuente UMN asociada a escápula. Se preservó esa asociación y se reconstruyó la reciprocidad; validación corregida con cero errores. El catálogo contiene 46 estructuras, no un atlas completo. Índice reconstruido desde esos datos.

## Piloto geométrico privado efectuado

Cuatro ampliaciones técnicas de miembros renderizadas e inspeccionadas. Como no hay límites articulares defendibles ni lateralidad confirmada, se ensayaron **ROIs geométricas centrales de superficie**, no huesos desarticulados. Selección por centro de cara y coordenadas de escena, cortes arbitrarios explícitos solo para propuesta privada. Los nombres son hipótesis para revisión; no publicarlos como anatomía admitida.

| Hipótesis de superficie | Caras fuente propuestas |
|---|---:|
| Zona diafisaria humeral | 350 |
| Zona diafisaria femoral | 369 |
| Zona diafisaria tibial | 562 |
| Remanente sin identificar | 72.954 |

Partición GLB real, 4.657.776 bytes; SHA256 `c540990410e973539ef2f4ad00226cde7d57d1dfd16b2eb09032659c9a91d355`. Conserva 74.235 triángulos totales, coordenadas, UV/materiales y transformación del nodo, sin generar superficies para cerrar los recortes. Blender importó cuatro nodos, renderizó dos vistas coloreadas, guardó `workbench/segmentation/feline/pilot/private-surface-pilot.blend` y lo reabrió comprobando conteo. Vistas Y/Z inspeccionadas; no lateralidad anatómica certificada. Archivo original/publicado permanece intacto, SHA256 `c570679a9f450c32aeded26c7b459993e984ee6fb01677170e4cd7cdf9220783`.

Artefactos privados:

- `workbench/segmentation/feline/pilot/surface-proposals.json`: listas source_face_index y limitaciones.
- `workbench/segmentation/feline/exports/proposal-c540990410e973539ef2f4ad00226cde7d57d1dfd16b2eb09032659c9a91d355.glb` y su JSON de trazabilidad.
- `workbench/segmentation/feline/pilot/private-proposals-y.png`, `private-proposals-z.png` y `inspection.json`.

No se incorporaron esos parches a `public/`, mappings científicos ni raycasting de la aplicación. No se presentan como piloto de huesos completos. El cuerpo original continúa visible; fichas consultables por búsqueda, selección ósea/aislamiento científico pendientes.

## Matriz de avance

`data/osteology/feline-evidence-coverage.json`: 323 entradas de referencia; 8 entradas bilaterales remiten a cuatro fichas de familia bibliográfica. No son ocho huesos modelados. Geometría no identificada por fila, tres propuestas privadas y cero huesos anatómicamente admitidos. Denominador esperado del espécimen sigue desconocido. Esquema y pruebas evitan convertir bibliografía o propuestas en cobertura geométrica certificada.

## Reproducción

```powershell
npx tsx scripts/osteology/register-pilot-content.ts
npm run anatomy:index
npx tsx scripts/osteology/generate-evidence-coverage.ts
npm run validate:data
```

El generador de cobertura requiere las propuestas privadas ya creadas. Scripts Blender `render-pilot-regions.py`, `propose-pilot-surfaces.py` e `inspect-pilot-proposal.py` reproducen inspección/propuesta; se niegan a sobrescribir escenas/anotaciones existentes. Requieren fuentes y workspace privado anteriores. Los scripts no se ejecutan en peticiones serverless.

## Qué falta para admitir selección ósea

Revisar identidad y límites en las propuestas; sustitución por anotaciones anatómicas defendibles, no aprobación de cajas geométricas como límites articulares. Determinar lado/ejes y grado de superficie disponible. Registro humano competente antes de admisión prevista por el plan. Para piezas dañadas/internas, nueva evidencia o geometría autorizada; no inventar hueso perdido. Medidas del espécimen pendientes: no se aplicó calibración promedio. La fase completa y los demás lotes siguen abiertos.
