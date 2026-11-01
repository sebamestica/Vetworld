# Candidatos 3D caninos con licencia abierta — 2026-10-31

Autor: A4. Solo se consultaron metadatos y cabeceras HTTP (HEAD, sin cuerpo): **no se descargó ningún activo**. Registro estructurado: [canine-open-candidates-2026-10-31.json](../../data/osteology/research/canine-open-candidates-2026-10-31.json). No modifica `source-candidates.json`. Que una licencia sea abierta no valida la anatomía: `reviewStatus=pending`.

## Método y exclusiones

- APIs oficiales: Zenodo, MorphoSource, Figshare y GitHub, más la página de la entrada NIH 3D. WebSearch no devolvió resultados en esta sesión.
- Sketchfab queda excluido como vía de descarga. Su API pública de metadatos solo se usó para contrastar la licencia de origen de réplicas Objaverse depositadas en Zenodo, como en la auditoría del 2026-10-08.
- 403 nuevos, no repetidos: `open.lib.umn.edu` (guía UMN, con curl) y URL S3 directas de NIH 3D (HEAD). Smithsonian necesita clave de API: no consultado.

## Veredictos

| Candidato | Región | Formato / bytes | Licencia | Especie | Región | Autor | URL pág.+archivo | Formato | Lic./versión | Modif. | Redistr. | Descarga libre | Recomendado | Decisión |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| [Canis Familiaris (Dog) Skull](https://zenodo.org/records/10327538) | head (cráneo) | glb / 19.576.476 | CC BY 4.0 | sí | sí | sí | sí | sí | sí | sí | sí | sí | **sí** | candidate |
| [Roman Dog Skull](https://zenodo.org/records/10233761) | head (cráneo) | glb / 15.988.124 | CC BY 4.0 | sí | sí | sí | sí | sí | sí | sí | sí | sí | **sí** | candidate |
| [Structure and scaling of the middle ear in domestic dog breeds](https://zenodo.org/records/10410546) | head (región del oído; cráneos preparados) | zip (pila JPEG de TC, no malla) / 345.672.424 | CC BY 4.0 | sí | sí | sí | sí | sí | sí | sí | sí | sí | **sí** | candidate |
| [Dog Skull (3DPX-000282, envío versión 3)](https://3d.nih.gov/entries/3DPX-000282) | head (cráneo) | glb (también WRL de entrada 38.197.675 B, BLEND, X3D, FBX) / 51.722.476 | Public Domain (enlazada a CC0 1.0 en la página) | sí | sí | sí | sí | sí | sí | sí | sí | no | **no** | needs_review |
| [NC State College of Vet. Medicine Anatomy Collection — espécimen ncsu:cvm:31](https://www.morphosource.org/api/media/000025766) | esqueleto completo por huesos (cráneo, mandíbulas, vértebras, costillas, escápulas, húmeros, radios, cúbitos, pelvis, fémures, rótulas, tibias, fíbulas…) | Mesh (formato de archivo no comprobado) / 163.199.673 | Sin licencia CC: MorphoSource Standard use agreement; CommercialUseNotPermitted; 3DPrintingLimited | sí | sí | sí | no | no | no | no | no | no | **no** | needs_permission |
| [Poodle Skull - 3D Model](https://zenodo.org/records/4560099) | head (cráneo) | glb / 95.030.220 | CC BY 4.0 | no | sí | sí | sí | sí | sí | sí | sí | sí | **no** | rejected_for_species |
| [Zoolica - Great Dane Dog Skull](https://zenodo.org/records/10335634) | head (cráneo) | glb / 1.799.172 | CC BY 4.0 | sí | sí | sí | sí | sí | sí | sí | sí | sí | **no** | low_priority |
| [Dog Femur: EOA:2022.90](https://zenodo.org/records/10330900) | pelvic-limb (fémur) | glb / 1.521.724 | Contradictoria: Zenodo CC BY-NC-SA 2.0; Sketchfab CC Attribution | sí | sí | sí | sí | sí | no | no | no | sí | **no** | rejected_license_conflict |
| [Front leg of a dog](https://zenodo.org/records/21164473) | thoracic-limb | glb / 2.727.508 | CC BY-NC-SA 4.0 (solo según la réplica) | sí | sí | no | sí | sí | no | no | no | ? | **no** | needs_origin |
| [Dog skull](https://zenodo.org/records/21243371) | head (cráneo) | glb / 5.272.280 | CC BY-NC-SA 4.0 (solo según la réplica) | sí | sí | no | sí | sí | no | no | no | ? | **no** | needs_origin |
| [Dog Vertebra (DB8B.2vL1)](https://zenodo.org/records/21567664) | axial (vértebra lumbar) | glb / 2.902.788 | CC BY 4.0 (según réplica) | sí | sí | sí | sí | sí | no | sí | sí | ? | **no** | low_priority |

## Notas por candidato

- **Canis Familiaris (Dog) Skull** — Ocho puntos verificados en la página y API del archivo, con licencia de origen coincidente. Es solo cráneo, sin huesos individualizados. Escala y separación de mandíbula sin comprobar. La réplica no permite saber si coincide con la versión actual del autor: conservar el md5 y la atribución.
- **Roman Dog Skull** — Ocho puntos verificados. Es un espécimen arqueológico de raza desconocida y la especie la atribuye el museo. Solo cráneo; método de captura y escala no declarados. Útil como alternativa, no como referencia moderna.
- **Structure and scaling of the middle ear in domestic dog breeds** — Ocho puntos verificados en el depósito del autor. Son volúmenes de TC de la región del oído, no mallas: hace falta segmentarlos y conciliar unidades. Cada archivo pesa entre 0,35 y 4,8 GB: descargar un solo ZIP y solo con autorización explícita del usuario.
- **Dog Skull (3DPX-000282, envío versión 3)** — La entrada es la misma fuente que `nih-3d-dog-skull` y el archivo en cuarentena dog_skull_nih.glb. La página muestra ahora una licencia legible (Public Domain/CC0) que la auditoría del 2026-10-08 no encontró. El envío v3 es de 2026-10-05 y no se ha comprobado que el GLB en cuarentena coincida con estos archivos. La URL S3 directa da 403. Para A0: revisar a mano la licencia y el archivo antes de corregir sources.json.
- **NC State College of Vet. Medicine Anatomy Collection — espécimen ncsu:cvm:31** — Es el mejor candidato científico por cobertura (un solo espécimen escaneado hueso a hueso), pero no tiene licencia abierta y requiere cuenta. Solicitar permiso de uso web, modificación y redistribución a NCSU CVM/MorphoSource. No sustituye al maestro LMU.
- **Poodle Skull - 3D Model** — La fuente no confirma la especie (perro o zorro). La réplica 10288701 declara CC0, distinta de la CC BY del depósito de los autores: discrepancia de licencia.
- **Zoolica - Great Dane Dog Skull** — Ocho puntos formales verificados, pero no consta el origen del espécimen ni el método; 25.000 caras sugieren una malla reducida. Valor científico insuficiente frente a otros candidatos.
- **Dog Femur: EOA:2022.90** — La réplica y el origen declaran licencias distintas, y también difiere el identificador (2022.90 frente a 2022.90.3). Hueso arqueológico aislado.
- **Front leg of a dog** — Origen y autor real no verificables (Sketchfab 404; la página original de Scan-the-World no se consultó). Interesante por cubrir el miembro torácico; buscar la página oficial del autor.
- **Dog skull** — Igual que zenodo-21164473: origen no verificable.
- **Dog Vertebra (DB8B.2vL1)** — Vértebra arqueológica patológica (proceso espinoso doblado): no es una referencia normal. Licencia de origen no contrastada.

## Hallazgos para A0

1. **NIH 3DPX-000282**: la página muestra ahora `license: "Public Domain"` con enlace a CC0 1.0 (envío v3 publicado el 2026-10-05). La auditoría del 2026-10-08 no encontró licencia legible. No se ha comprobado que el GLB en cuarentena (`dog_skull_nih.glb`) coincida con la versión actual. Hace falta revisión manual antes de cambiar `nih-3d-dog-skull` en `sources.json`.
2. **MorphoSource ncsu:cvm:31** cubre un esqueleto canino hueso a hueso en un solo espécimen, pero sin licencia CC: acuerdo Standard, uso comercial no permitido y cuenta obligatoria. Tramitar permiso.
3. Las réplicas Objaverse en Zenodo conservan la licencia del origen en la mayoría de los casos, pero el fémur de Portland Museum declara licencias contradictorias. Para cada réplica hay que contrastar la licencia en el origen.
4. Ningún candidato abierto aporta un esqueleto canino completo. Los recomendados (`downloadRecommended: true`) son dos cráneos CC BY y un conjunto de TC del oído CC BY. Su descarga necesita autorización explícita del usuario.
