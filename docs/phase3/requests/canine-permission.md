# Borrador para hidden.art8 — no enviado

Actualizado el 2026-10-31 con el diagnóstico privado ([informe](../canine-private-diagnostic-2026-10-31.md)). Es un texto pendiente, no un permiso obtenido. No se contactó al autor. El usuario puede enviarlo o autorizar expresamente el contacto.

Producto: https://3dexport.com/3d-model-esqueleto-de-perro-dog-skeleton-285869 (producto 285869, publicado 2020-04-07, STL gratuito, «3D Scan: No»).

Archivos recibidos, todos STL binarios con cabecera vacía:

| Archivo | SHA-256 | Triángulos |
|---|---|---:|
| `craneo_dog_skeleton.stl` | `7a2d4982…22c529d2` | 34.660 |
| `espina dorsal_dog_skeleton.stl` | `a4b9d4e7…0e654f48` | 98.081 |
| `pata delantera_dog_skeleton.stl` | `14f3ba51…41ae2498` | 21.656 |
| `pata trasera_dog_skeleton.stl` | `6ba7a11a…0294fe99` | 25.416 |

Hashes completos en `workbench/incoming/receipt-2026-10-08.json` y en `data/osteology/diagnostics/canine.json`.

---

Hola:

Descargamos su modelo gratuito de esqueleto de perro para un atlas veterinario educativo sin fines comerciales. Antes de integrarlo necesitamos confirmar permisos específicos, porque el visor web entrega archivos 3D que un usuario puede recuperar. Mientras no tengamos respuesta, los archivos se usan solo de forma privada y no se publican.

**Permisos que solicitamos** para los cuatro archivos y sus derivados:

1. Inspeccionarlos, adaptarlos, segmentarlos, ensamblarlos y convertirlos a Blender/GLB, conservando los originales y documentando los cambios.
2. Servir el GLB recuperable desde una aplicación educativa y distribuir los derivados en nuestro repositorio público de GitHub.
3. Publicar capturas del visor con atribución y enlace a su página.

Le pedimos que indique la licencia o las condiciones de atribución, las limitaciones y si tiene derechos suficientes sobre toda la geometría para conceder esos permisos.

**Preguntas técnicas** surgidas de nuestra inspección (solo geométrica, sin revisión anatómica):

4. **Unidades y escala.** Los STL no declaran unidades. ¿En qué unidad están modelados? ¿Comparten las cuatro piezas la misma escala? ¿Corresponden a un animal concreto, una raza o una talla de referencia?
5. **Columna.** El archivo `espina dorsal` contiene vértebras y esternón cortados por un plano (media superficie, apoyada en la cama de impresión) y costillas de un solo lado. ¿Es la mitad que debe reflejarse para formar la pieza completa? ¿Existe una versión anterior a la modificación para impresión, sin el corte?
6. **Cráneo.** El extremo caudal del cráneo es una cara plana. ¿Se recortó para impresión? ¿Existe una versión con la región occipital completa?
7. **Extremidades.** Cada pata contiene un solo lado. ¿Las extremidades del otro lado se obtienen por reflejo, como indica la descripción del producto?
8. **Componentes.** Cada pieza trae huesos como mallas separadas (32, 79, 30 y 28 componentes). Algunas vértebras aparecen fusionadas en una sola malla, y en la columna hay dos elipsoides lisos junto a las primeras vértebras. ¿Son soportes de impresión? ¿Dispone de una lista de nombres por malla o de un archivo con objetos nombrados?
9. **Fuentes.** ¿Qué referencias usó al modelar (atlas, fotografías, espécimen) y qué partes se simplificaron, se omitieron (por ejemplo el aparato hioideo) o se reconstruyeron?

No presentaremos una pieza reflejada o reconstruida como escaneo independiente, ni anatomía validada sin revisión de un especialista. Si esos usos no están autorizados, mantendremos los archivos privados y no los incorporaremos al visor público.

Gracias.
