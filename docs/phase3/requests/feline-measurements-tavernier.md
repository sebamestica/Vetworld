# Borrador actualizado para Tavernier Amaury — NO ENVIADO (2026-10-31)

Sustituye en contenido, sin borrarlo, al borrador anterior [`feline-measurements.md`](feline-measurements.md). Enviar únicamente si el usuario lo decide o autoriza contacto explícito. No inventar respuesta, medidas, orientación ni identificación del espécimen.

Referencia: Cat Skeleton — Tavernier Amaury — https://sketchfab.com/3d-models/cat-skeleton-7106115b299649e992476f2d3b4fc602 — CC BY-NC-SA 4.0. Archivo descargado por el usuario y conservado sin cambios (SHA-256 `c570679a9f450c32aeded26c7b459993e984ee6fb01677170e4cd7cdf9220783`, 74.235 triángulos, una malla).

---

Hola, Amaury:

Estamos preparando un atlas veterinario educativo y no comercial a partir de su modelo *Cat Skeleton*, respetando atribución, enlace y licencia CC BY-NC-SA 4.0. Hemos delimitado de forma privada algunas superficies (escápulas, húmeros, antebrazos, fémures, regiones crurales, coxales y cabeza) sin modificar la geometría original. Para no atribuir al modelo una precisión, escala o lateralidad que el archivo no documenta, le agradeceríamos cualquiera de estos datos:

1. **Medidas del mismo espécimen.** Dos o más distancias reales entre puntos anatómicos identificables (por ejemplo, longitud máxima de un húmero o fémur concreto, o longitud del cráneo), con unidad, instrumento y precisión aproximada. Nos sirve que diga de qué lado es cada hueso medido. No usaremos medias de la especie para escalar el modelo.
2. **Unidades del archivo.** Si las coordenadas exportadas tienen una unidad o un factor de escala conocidos.
3. **Orientación y reflexiones.** Qué eje corresponde a craneal, dorsal y derecho del animal, y si se aplicó alguna reflexión (espejado), rotación o reescalado durante la captura, la reconstrucción o la exportación. En la escena importada, la cabeza queda hacia −X y los pies en el mínimo de Z; sin confirmar la ausencia de reflexión no podemos asignar izquierda/derecha.
4. **Procedencia del espécimen y método.** Origen, edad, sexo y método de captura (fotogrametría, escaneo u otro), si constan.
5. **Regiones reconstruidas o ausentes.** Piezas sustituidas, unidas, simplificadas o perdidas (por ejemplo, mandíbula, dientes, hioides, patellas, carpo/tarso, falanges, cola) y limitaciones conocidas.
6. **Versión segmentada o de mayor resolución.** Si existe una versión por huesos o de más detalle, y en qué condiciones de licencia podría usarse para adaptación y distribución educativa.

No estamos certificando anatomía a partir del modelo: todas nuestras delimitaciones siguen pendientes de revisión por una persona cualificada. Mantendremos atribución, licencia y registro de cambios. Muchas gracias por cualquier dato disponible.

---

Notas internas (no enviar):

- Hasta recibir respuesta: `scale=unknown`, medidas deshabilitadas en la UI, `side=unknown` en todas las propuestas (`data/osteology/diagnostics/feline-axes-2026-10-31.json`).
- Si llegan medidas, registrarlas con `check-calibration.ts` (dos medidas del mismo espécimen, puntos, evidencia e incertidumbre) y conservar el mensaje original como evidencia privada en `workbench/`.
