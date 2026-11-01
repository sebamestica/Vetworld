# F10 — Galería y medios: procedencia por imagen (2026-11-01)

Fase F10 del plan (`plandeimplementacion.md`). Añade 14 referencias visuales a fichas óseas existentes de perro y gato: 7 imágenes locales de Wikimedia Commons con licencia redistribuible verificada y 7 referencias académicas externas sin reproducir medios. Todas tienen `review.status = pending`: la identificación de especie y estructura procede de la descripción de cada archivo y de una inspección visual no experta, y **no sustituye la revisión veterinaria humana cualificada**. Ninguna imagen es del espécimen ni del modelo 3D del atlas.

## Criterios aplicados

- Solo Commons, con licencia leída en dos sitios: `extmetadata` de la API (`prop=imageinfo&iiprop=url|extmetadata|sha1|size`) y la plantilla de licencia de la página `File:`. Solo se admiten CC0, CC BY y CC BY-SA, sin NC ni ND, que es lo que impone `src/modules/media/provenance.ts`.
- Especie: perro doméstico (*Canis lupus familiaris*) o gato doméstico (*Felis catus*), según la descripción del archivo. Se descartan lobo, zorro, félidos silvestres y ejemplares arqueológicos.
- Estructuras: solo las que se ven en la copia publicada, inspeccionada una por una. Se asocian solo fichas que ya existen en `data/anatomy/structures.json`.
- Sin hotlink. El original se descargó en `workbench/incoming/media/<id>/` (fuera de git) junto con `commons-api.json` y `file-page.html`, y se comprobó contra el SHA-1 que publica Commons. La copia publicable está en `public/media/<especie>/` y la miniatura en `public/media/<especie>/thumbs/`.
- Transformación (`scripts/media/prepare-reference-images.ts`, sharp 0.35.5): se aplica la orientación EXIF, se reduce de forma proporcional a 1600 px en el lado mayor (miniatura a 480 px), se guarda en JPEG de calidad 82 (mozjpeg) y se eliminan los metadatos EXIF/XMP. No hay recorte, retoque ni anotaciones. Las derivadas de obras CC BY-SA se redistribuyen bajo la misma licencia, y así consta en su rótulo visible.
- La atribución visible (autor, título del archivo, licencia con su URL y la indicación «Copia redimensionada») va en `license.label`. El enlace de la tarjeta lleva a la página oficial del archivo.
- Registro completo de cada imagen: `data/anatomy/media-provenance.json`. Lo validan `npm run validate:media` y `tests/unit/media.test.ts`.

## Imágenes locales

### `commons-canine-skull-mwnh` — Cráneo de perro en vista rostral (colección Museum Wiesbaden)

- Especie / región / estructuras: canine / head / `canine:skull`
- Archivo: [File:Canis lupus familiaris 01 MWNH 788.jpg](https://commons.wikimedia.org/wiki/File:Canis_lupus_familiaris_01_MWNH_788.jpg); original `https://upload.wikimedia.org/wikipedia/commons/c/ce/Canis_lupus_familiaris_01_MWNH_788.jpg`
- Autor: Klaus Rassinger und Gerhard Cammerer, Museum Wiesbaden. Licencia: CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/); atribución obligatoria; compartir igual.
- Evidencia de especie: Descripción de la página: «Dog Canis lupus familiaris, skull, Coll. Museum Wiesbaden» (ejemplar MWNH 788); categorías «Dog skulls in anterior aspect» y «Carnivora skulls of the Natural History Collections of the Museum Wiesbaden».
- Original: 4288×2848, 4746925 B, SHA-1 Commons `f14490a95ec890d2cba995fbb0109d7f348298f6`, SHA-256 `360d0067ad34e4ad610e53597b62da71f9e6bf3c6ba0fe6930b5af1653a8f07f`
- Publicable: `/media/canine/commons-canine-skull-mwnh.jpg` 1600×1063, 67024 B, SHA-256 `6f5c8a7141de54f37203058169d8f06206125768ad6bbe447cb9e253ff1a4b1a`
- Miniatura: `/media/canine/thumbs/commons-canine-skull-mwnh.jpg` 480×319, 9113 B, SHA-256 `dd2f2798b28c6e0f0e793bec0a0ab5ab54c2c55ed83b25dde84ed767b3c49ffa`
- Leyenda: Fotografía de un cráneo óseo preparado de perro doméstico (Canis lupus familiaris, ejemplar MWNH 788) en vista rostral; se ven el cráneo con la mandíbula articulada y la dentición. Espécimen osteológico preparado, no disección. No es una fotografía del espécimen ni del modelo 3D del atlas; especie según la descripción de la página del archivo.

### `commons-feline-skull-lateral-fmvz` — Cráneo de gato en vista lateral izquierda (MAV FMVZ USP)

- Especie / región / estructuras: feline / head / `feline:skull`, `feline:mandible`, `feline:teeth`
- Archivo: [File:Cat skull. Felis catus 01.jpg](https://commons.wikimedia.org/wiki/File:Cat_skull._Felis_catus_01.jpg); original `https://upload.wikimedia.org/wikipedia/commons/4/49/Cat_skull._Felis_catus_01.jpg`
- Autor: Wagner Souza e Silva / Museum of Veterinary Anatomy FMVZ USP. Licencia: CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/); atribución obligatoria; compartir igual. Permiso VRTS confirmado en la página del archivo (ticket 2016071210013681; alianza Museum of Veterinary Anatomy FMVZ USP – RIDC NeuroMat – Wikimedia Community User Group Brasil).
- Evidencia de especie: Descripción de la página: «Specimen of cat skull prepared by the bone maceration technique and on display at the Museum of Veterinary Anatomy, FMVZ USP»; título «Cat skull. Felis catus»; categoría «Cat skulls».
- Original: 3274×2592, 3420811 B, SHA-1 Commons `1073eabb67ea971db2f64da3181a40dae4a3a6b9`, SHA-256 `8b7f52457a84013ec11a2a7f1c792aed41d2f895aabc17d8119cf643580c2d6f`
- Publicable: `/media/feline/commons-feline-skull-lateral-fmvz.jpg` 1600×1267, 99996 B, SHA-256 `187e7a3099a0f1d67c13c557441f104fe61568f93eac65d5cb2ef48c8e94649a`
- Miniatura: `/media/feline/thumbs/commons-feline-skull-lateral-fmvz.jpg` 480×380, 14401 B, SHA-256 `5c2d93fbdcd1cdea112f24b6663f8db92b8e0c4bd0103c0d63131376cfa97856`
- Leyenda: Fotografía de un cráneo macerado de gato doméstico (Felis catus) en vista lateral izquierda, con mandíbula y dientes, junto a escala en centímetros. Espécimen osteológico preparado, no disección. No es una fotografía del espécimen ni del modelo 3D del atlas; especie según la descripción de la página del archivo.

### `commons-feline-skull-gape` — Cráneo y mandíbula de gato en apertura máxima

- Especie / región / estructuras: feline / head / `feline:skull`, `feline:mandible`, `feline:teeth`
- Archivo: [File:Felis catus gaping skull and mandible.jpg](https://commons.wikimedia.org/wiki/File:Felis_catus_gaping_skull_and_mandible.jpg); original `https://upload.wikimedia.org/wikipedia/commons/9/93/Felis_catus_gaping_skull_and_mandible.jpg`
- Autor: Coluberssymbol. Licencia: CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0/); atribución obligatoria; compartir igual.
- Evidencia de especie: Descripción de la página: «a profile of felis catus, the common domestic cat, at a maximum gape»; obra propia del autor; categoría «Cat skulls».
- Original: 1981×1710, 543783 B, SHA-1 Commons `f34ffcc94d79459012ca949db4094600046ba65f`, SHA-256 `430db06ee29bac607d872ea2a57c24959067f3f3337459f340b73194711dec1e`
- Publicable: `/media/feline/commons-feline-skull-gape.jpg` 1600×1381, 77710 B, SHA-256 `4c73cacf03fb52598ea67e2ed28a71102ce573f7b8aa610133018fbd5d50ec1c`
- Miniatura: `/media/feline/thumbs/commons-feline-skull-gape.jpg` 480×415, 11702 B, SHA-256 `2f02864c2d8f979dd18c67ab4e1ef5e7e54e3c16076ba55296b00f8ae7260dc3`
- Leyenda: Fotografía de un cráneo de gato doméstico (Felis catus) en vista lateral derecha con la mandíbula en apertura máxima; se ven los dientes superiores e inferiores. Espécimen osteológico preparado, no disección. No es una fotografía del espécimen ni del modelo 3D del atlas; especie según la descripción de la página del archivo.

### `commons-canine-forelimb-msu` — Esqueleto del miembro torácico de perro (colección MSU)

- Especie / región / estructuras: canine / thoracic-limb / `canine:scapula`, `canine:humerus`, `canine:radius`, `canine:ulna`, `canine:manus`
- Archivo: [File:Dog fore limb 1.JPG](https://commons.wikimedia.org/wiki/File:Dog_fore_limb_1.JPG); original `https://upload.wikimedia.org/wikipedia/commons/7/78/Dog_fore_limb_1.JPG`
- Autor: Kirill Tsukanov. Licencia: CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/); atribución no obligatoria (se da por cortesía).
- Evidencia de especie: Descripción de la página: «Dog fore limb from the collection of Moscow State University Department of Biology»; obra propia; categoría «Dog leg bones».
- Original: 4912×2760, 3276800 B, SHA-1 Commons `21b47b3cc273bfe24f8a839571e46d1e4558797f`, SHA-256 `78f76039c8bf8798d1a5a02fc8ad4594d45ae9104f8f9c7cea54ebd759c85825`
- Publicable: `/media/canine/commons-canine-forelimb-msu.jpg` 1600×899, 98530 B, SHA-256 `ece76bf082d1739f35c9b44fe0d49e42f82e2321e990e8dee1b83e732086cfb6`
- Miniatura: `/media/canine/thumbs/commons-canine-forelimb-msu.jpg` 480×270, 10505 B, SHA-256 `9e3b32d9e4bff761bfa7ea1238db977c6416f3ae82b9306c0374332fb47f0e1a`
- Leyenda: Fotografía de un miembro torácico de perro desarticulado del tronco y montado con alambre: escápula, húmero, radio, cúbito y esqueleto de la mano en vista lateral. Espécimen osteológico preparado, no disección. No es una fotografía del espécimen ni del modelo 3D del atlas; especie según la descripción de la página del archivo.

### `commons-canine-hindlimb-msu` — Esqueleto de los miembros pelvianos de perro (colección MSU)

- Especie / región / estructuras: canine / pelvic-limb / `canine:femur`, `canine:tibia`, `canine:fibula`
- Archivo: [File:Dog hind limb 1.JPG](https://commons.wikimedia.org/wiki/File:Dog_hind_limb_1.JPG); original `https://upload.wikimedia.org/wikipedia/commons/2/2e/Dog_hind_limb_1.JPG`
- Autor: Kirill Tsukanov. Licencia: CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/); atribución no obligatoria (se da por cortesía).
- Evidencia de especie: Descripción de la página: «Dog hind limb from the collection of Moscow State University Department of Biology»; obra propia; categoría «Dog leg bones».
- Original: 4912×2760, 4653056 B, SHA-1 Commons `59ef3228a819dee30778fab760fda0c5406a861c`, SHA-256 `8d29c80804d0ef46eb18a0243ce651805e86278d3e0bfd409b4c934a8dcce0e9`
- Publicable: `/media/canine/commons-canine-hindlimb-msu.jpg` 1600×899, 179067 B, SHA-256 `3fb9b437dd26558be7471b096b1444317ae7f272be9a80e23ab9ed1d000f7481`
- Miniatura: `/media/canine/thumbs/commons-canine-hindlimb-msu.jpg` 480×270, 17477 B, SHA-256 `90f045409ffc4664a893d0c7203d0173ab0462594c9dec21c5e4c31e501804d9`
- Leyenda: Fotografía de dos miembros pelvianos de perro sin coxal, montados con alambre: fémur, tibia, peroné y huesos del tarso, metatarso y dedos. Espécimen osteológico preparado, no disección. No es una fotografía del espécimen ni del modelo 3D del atlas; especie según la descripción de la página del archivo.

### `commons-canine-pelvis-msu` — Pelvis ósea de perro en vista dorsal (colección MSU)

- Especie / región / estructuras: canine / pelvic-limb / `canine:coxal`
- Archivo: [File:Dog pelvis.JPG](https://commons.wikimedia.org/wiki/File:Dog_pelvis.JPG); original `https://upload.wikimedia.org/wikipedia/commons/8/8c/Dog_pelvis.JPG`
- Autor: Kirill Tsukanov. Licencia: CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/); atribución no obligatoria (se da por cortesía).
- Evidencia de especie: Descripción de la página: «Dog pelvis from the collection of Moscow State University Department of Biology»; obra propia; categoría «Dog bones».
- Original: 2680×3728, 1504875 B, SHA-1 Commons `a8bb08042ba848b971cdf7fd241aa6da57a7d509`, SHA-256 `7f5125bb32de547b188af2dd6639bdc20dabe8c79fe9e2bd57539afd35def45c`
- Publicable: `/media/canine/commons-canine-pelvis-msu.jpg` 1150×1600, 152899 B, SHA-256 `9a4059abe52d1d5de3fcbd722c373c83f6b04d8374dec151f3ea7920aa416c28`
- Miniatura: `/media/canine/thumbs/commons-canine-pelvis-msu.jpg` 345×480, 24033 B, SHA-256 `8b03b960cb1c3c449f608a8f87dec50ad593b69c07ca3909efb1d439bcb26396`
- Leyenda: Fotografía de la pelvis ósea de un perro (ambos coxales) en vista dorsal, con sacro y vértebras lumbares y caudales adyacentes. Espécimen osteológico preparado, no disección. No es una fotografía del espécimen ni del modelo 3D del atlas; especie según la descripción de la página del archivo.

### `commons-feline-skeleton-msu` — Esqueleto montado de gato en vista lateral (colección MSU)

- Especie / región / estructuras: feline / pelvic-limb / `feline:femur`, `feline:tibia`, `feline:os-coxae`
- Archivo: [File:Felis catus skeleton.JPG](https://commons.wikimedia.org/wiki/File:Felis_catus_skeleton.JPG); original `https://upload.wikimedia.org/wikipedia/commons/6/65/Felis_catus_skeleton.JPG`
- Autor: Kirill Tsukanov. Licencia: CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/); atribución no obligatoria (se da por cortesía).
- Evidencia de especie: Descripción de la página: «Cat (Felis catus) skeleton from the collection of Moscow State University Department of Biology»; obra propia; categoría «Cat skeletons».
- Original: 4912×2760, 3899392 B, SHA-1 Commons `de3c953aec9e96b33d80f442491fff61b43d9ca3`, SHA-256 `1262bfcedda3f9f56eec1242c98c3dd73ec79e2f06604678fac5198db69066bf`
- Publicable: `/media/feline/commons-feline-skeleton-msu.jpg` 1600×899, 116856 B, SHA-256 `b33b9f48ea9415b7036fb3c1ee7553443d63fffcfb8c3c9ac9e3bd758cd50bfe`
- Miniatura: `/media/feline/thumbs/commons-feline-skeleton-msu.jpg` 480×270, 18807 B, SHA-256 `63c128b3b87c093eea21ec1569c4a16540bd9632e1ea394153f12db559fe400d`
- Leyenda: Fotografía de un esqueleto completo de gato doméstico (Felis catus) montado en vista lateral izquierda; se asocia aquí solo a coxal, fémur y tibia, visibles en el miembro pelviano. Espécimen osteológico preparado, no disección. No es una fotografía del espécimen ni del modelo 3D del atlas; especie según la descripción de la página del archivo.
## Referencias externas (sin reproducción de medios)

Licencias consultadas de nuevo el 2026-11-01: Europe PMC REST (`resultType=core`, campo `license`) y metadatos de Internet Archive (`possible-copyright-status`). Se reutilizan fuentes que ya estaban en `data/anatomy/sources.json`, y cada estructura asociada figura en su `supportedStructureIds`. Todas usan `kind=academic_reference` porque no se inspeccionaron las figuras.

| id | especie | estructuras | fuente | licencia | URL |
|---|---|---|---|---|---|
| `pmc-tagliavia-feline-skull` | feline | skull | Tagliavia et al. 2026, Animals 16(13):2001 | CC BY (Europe PMC) | https://pmc.ncbi.nlm.nih.gov/articles/PMC13359505/ |
| `pmc-requicha-feline-orbit-ct` | feline | skull | Requicha et al. 2026, Animals 16(1):147 | CC BY (Europe PMC) | https://pmc.ncbi.nlm.nih.gov/articles/PMC12784816/ |
| `pmc-delibas-feline-mandibular-canal` | feline | mandible | Delibaş y Kaya 2026, Animals 16(19):3073 | CC BY (Europe PMC) | https://pmc.ncbi.nlm.nih.gov/articles/PMC13663499/ |
| `pmc-goldstein-feline-carpus-microct` | feline | carpus | Goldstein et al. 2026, Acta Vet Scand | CC BY (Europe PMC) | https://pmc.ncbi.nlm.nih.gov/articles/PMC13281358/ |
| `pmc-basa-feline-radioulnar` | feline | radius, ulna, carpus | Basa et al. 2023, J Feline Med Surg | CC BY (Europe PMC) | https://pmc.ncbi.nlm.nih.gov/articles/PMC10812075/ |
| `ia-sisson-canine-thoracic-limb` | canine | scapula, humerus, radius, ulna, manus | Sisson 1914 | IA `NOT_IN_COPYRIGHT`; dominio público sin confirmar jurídicamente (`verified=false`) | https://archive.org/details/anatomyofdomesti00sissuoft |
| `ia-sisson-canine-pelvic-limb` | canine | coxal, femur, patella, tibia, fibula, talus, calcaneus | Sisson 1914 | ídem | ídem |

## Candidatos descartados

- `File:Dog skull 01.jpg` y `File:Cat skull 01.jpg` (MAV FMVZ USP, CC BY-SA 4.0 con VRTS). Llegaron a descargarse, pero en la escala de la foto miden unos 4–5 cm y no tienen dientes erupcionados. Parecen ejemplares fetales o neonatos, así que no sirven como referencia general. Se eliminaron sus originales y sus derivadas.
- `File:Dog skull. Canis lupus familiaris 00.jpg` y `… 03.jpg` (FMVZ). Son cráneos de unos 5 cm. Según la inspección de miniaturas de evaluación (no publicadas), uno tiene una morfología que no permite confirmar la especie descrita. Se descartan por duda.
- `File:Dog ilium.jpg` (FMVZ). Sus categorías lo sitúan en el intestino (diafanización), no en el hueso ilion.
- SVG de DBCLS (escápula y húmero caninos, CC BY 4.0). Están en la categoría «License review needed» y son SVG, que la galería no admite. Pendientes.
- Batista et al. 2026 (foramen supratroclear). El estudio abarca *Canis lupus* ssp., así que se omite para no mezclar perro con otras subespecies.

## Comprobaciones (salidas reales, 2026-11-01)

- `npm run validate:media` → `18 referencias válidas; 7 medios internos con procedencia, licencia redistribuible, atribución y SHA-256 comprobados; originales verificados 7/7. Revisión humana pendiente.`
- `vitest run tests/unit/media.test.ts tests/contracts/media.test.ts` → 2 archivos, 26 pruebas superadas. `npm run test` → 27 archivos, 185 pruebas superadas. `npm run test:contracts` → 2 archivos, 38 pruebas superadas.
- `vitest run tests/integration/media.test.ts` → 11 pruebas superadas.
- `npm run typecheck` sin errores. `eslint` sobre los archivos de medios sin errores.
- No se ejecutaron build ni Playwright: no se ha comprobado la carga de `/media/...` en el navegador ni en dispositivos.

## Pendientes

1. Revisión veterinaria humana de especie y estructura en cada imagen. Ninguna pasa de `pending`.
2. No existe un tipo de medio «fotografía de espécimen osteológico». Se usa `dissection_photo` como el tipo más cercano y la leyenda aclara «Espécimen osteológico preparado, no disección». Añadir un tipo propio requiere tocar el enum (OpenAPI), `ReferenceGallery.tsx` e i18n.
3. La tarjeta muestra la URL de la licencia como texto dentro del rótulo, no como enlace. Hacerla clicable requiere tocar `ReferenceGallery.tsx`.
4. Las referencias internas usan su propio `referenceId` como `sourceId`, que se resuelve en `media-provenance.json`. No se añadieron a `sources.json`. Los `photoRefs` en `structures.json` son opcionales y no los exige el esquema.
5. Las referencias que abarcan subregiones (miembro torácico con escápula y húmero) aparecen al filtrar por estructura o por la región `thoracic-limb`, pero no al filtrar por `region=shoulder`.
