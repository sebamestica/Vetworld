---
name: 3d-asset-pipeline
description: Ingestar y preparar activos veterinarios autorizados en GLB conservando identidad de estructuras, nodos seleccionables y procedencia.
---

# Pipeline de activos 3D

Consultar `docs/sources-and-licenses.md` y `docs/FUENTES_ANATOMICAS.md` desde la raíz. Leer secciones 4.2 y 5 del maestro cuando se requieran destinos o contrato de procedencia. Esta skill no autoriza descargas ni instalación de herramientas.

1. Antes de adquisición, comprobar autorización, archivo real, especie/región, autor, formato, licencia/versión y derechos de modificación/redistribución. Detener adquisición si falta evidencia.
2. Conservar originales intactos en `workbench/incoming/`; trabajar copias separadas. Registrar tamaño y SHA-256, escala, orientación y contenido real.
3. Elegir Blender, 3D Slicer o glTF Transform según el dato y herramientas disponibles. No generar anatomía faltante ni inferir segmentación científica de una textura.
4. Mantener nombres estables de nodos y correspondencia explícita estructura/especie. Una malla conjunta no permite prometer selección individual.
5. Exportar GLB y verificar mallas, normales, materiales, texturas, orientación y escala. Optimizar sin fusionar estructuras seleccionables; comprobar interacción tras la transformación.
6. Registrar transformaciones, pesos medidos, atribución, permisos, checksum y rutas en el manifiesto de procedencia al incorporar el activo. Publicar solo con autorización y permisos verificados; informar límites y revisión humana pendiente.
