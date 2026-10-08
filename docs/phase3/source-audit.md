# Auditoría de fuentes y permisos — Fase 3

Fecha: 2026-10-08. Investigación de metadatos primarios y lectura de archivos existentes, sin descarga de geometría, cambios a activos existentes, commit ni publicación. Aplicadas las skills locales de medios/licencias y pipeline 3D. Los estados aquí no certifican anatomía; revisión humana pendiente.

## Corrección necesaria en los activos existentes

`data/anatomy/sources.json` declara permisos verificados para dos repositorios educativos y dominio público para NIH. La evidencia primaria obtenida no sostiene esas afirmaciones. Antes de enviar nuevos binarios o activar su disponibilidad científica, aislar originales y derivados del circuito publicable y corregir permisos a no comprobados.

| Activo | Evidencia primaria | Bloqueo concreto |
|---|---|---|
| InNervateVR, FBX de extremidad canina | [Repositorio](https://github.com/TomasArguello/InNervateVR), [README](https://raw.githubusercontent.com/TomasArguello/InNervateVR/main/README.md), [árbol](https://api.github.com/repos/TomasArguello/InNervateVR/git/trees/main?recursive=1). API de repositorio: `license=null`; árbol SHA `cb1ae67f252b06031abc3b6afaf40112b686c52f`. | No se encontró concesión aplicable al FBX. Licencias Oculus/Photon/Unity de dependencias no habilitan este modelo. Solicitar licencia/permiso al titular y procedencia del espécimen. |
| 3D-Cat-Anatomy, GLB felinos | [Repositorio](https://github.com/ezrahmae/3D-Cat-Anatomy), [README](https://raw.githubusercontent.com/ezrahmae/3D-Cat-Anatomy/main/readme.md), [árbol](https://api.github.com/repos/ezrahmae/3D-Cat-Anatomy/git/trees/main?recursive=1). Árbol completo, `truncated=false`, SHA `0ddeb1e9efb2d809dd4923ff48eb55204d48e7cd`; ninguna ruta LICENSE/COPYING; README solo instalación. | 47 GLB en `static/glb`, incluyendo grupos vertebrales, costillas, pelvis y piezas bilaterales; no son 47 huesos individualizados acreditados. Falta permiso y origen de cada modelo. Nombres de archivos no acreditan escaneo, especie o mismo espécimen. |
| `dog_skull_nih.glb` | [Registro exacto 3DPX-000282](https://3d.nih.gov/entries/3DPX-000282): Dog Skull, LeeDock, versión 2, descripción de cráneo desde TC/3D Systems. Campo Licensing sin valor legible en HTML consultado. | [Términos NIH, 4.3](https://3d.nih.gov/terms) exigen comprobar licencia por archivo; aportes de usuarios pueden tener restricciones. Hospedaje gubernamental no prueba dominio público. Obtener licencia específica y correspondencia checksum/archivo/versión. |

No se alteraron estos registros ni binarios durante esta tarea. Se avisó al agente principal del bloqueo antes de cualquier nuevo push de activos.

## Candidatos para maestros y piezas

Los 13 registros estructurados están en [source-candidates.json](../../data/osteology/source-candidates.json). Los modelos Sketchfab se comprobaron por API pública `https://api.sketchfab.com/v3/models/{id}`; se verificaron etiqueta, versión enlazada, autor, descripción e `isDownloadable`, sin consultar buffers del visor. `fileUrl=null` significa que no hay URL de archivo autorizada comprobada; no se inventó una. Formato de descarga, bytes, nodos, huesos individualizados, escala interna y completitud requieren el archivo posterior autorizado. Cantidades poligonales del proveedor no son mediciones nuestras.

| Fuente | Resultado accionable |
|---|---|
| [LMU, esqueleto completo canino](https://sketchfab.com/3d-models/dog-skeleton-annotation-of-extremities-687a49c51e5d4cac9e48318eca7e1947) | Fuente describe escaneo completo con Artec Leo/Space Spider, dimensiones 1150,5 × 567,6 × 85,8 mm. API: descarga deshabilitada y licencia vacía. Buen candidato de identidad académica, necesita permiso y entrega del archivo. No prometer separación ósea. |
| [Tavernier Amaury, esqueleto completo felino](https://sketchfab.com/3d-models/cat-skeleton-7106115b299649e992476f2d3b4fc602) | Fotogrametría completa según autor; API confirma CC BY-NC-SA **4.0**, descarga disponible y 74.235 caras declaradas. Candidato condicionado a uso no comercial, atribución y SA. Acceso mediante descarga oficial/cuenta; sin formato ni URL de archivo comprobados. Modelo articulado no implica huesos seleccionables. Identificador válido de 32 caracteres. |
| [Massey, Partial Dog Skeleton](https://sketchfab.com/3d-models/3d-dog-bone-project-partial-dog-skeleton-65a6c5db1c4c477aba475af5d86d59a5) | API confirma CC BY-SA **4.0** y descarga disponible. Incluye huesos seleccionados y silueta Low poly doggy de Joe McDowall; no cumple maestro esquelético íntegro. Cada hueso tiene licencia propia: Upper skull es BY-SA 4.0, Atlas es BY-NC 4.0. No heredar licencia del conjunto. |
| [RISD, Domestic Cat Skull](https://sketchfab.com/3d-models/domestic-cat-skull-bb6b8398029c45ef9da4e4ff04d2d9d9) | CC BY **4.0**, descarga disponible, espécimen/accession 438.03. Solo cráneo, no esqueleto completo. |
| LMU, tibias canina/felina | API confirma CC BY-NC-ND **4.0** y descarga disponible. No redistribuir adaptaciones sin permiso adicional; no son maestros completos. |
| [Feline Skeleton Dec](https://sketchfab.com/3d-models/feline-skeleton-dec-a5d0bb8f55dc4f49b103cd20d65e0b17) | BY 4.0 y descargable, pero autor describe primera práctica de escultura ecorché. Descartado como maestro científico escaneado. |
| [Fritzchen](https://sketchfab.com/3d-models/real-dog-skeleton-fritzchen-2150bf9f31b7442681f7ee2d44953623) | API: descarga deshabilitada/licencia vacía. Título y salida 3ds Max no prueban método de captura; requiere permisos y origen. |

La búsqueda indexada en MorphoSource no produjo un registro concreto de esqueleto completo de perro/gato con archivo y permisos comprobables en esta investigación acotada. No es prueba de inexistencia. Se conserva MorphoSource como vía pendiente por espécimen, no como licencia. Z-Anatomy veterinaria sigue identificado como Z-PIG en evidencia previa; no trasladar cerdo a perro/gato. Tampoco afirmar inexistencia universal de maestros completos: LMU y Tavernier ya contradicen esa generalización.

## Interpretación de los campos y acceso

`modificationAllowed=false` en ND expresa bloqueo de adaptaciones redistribuibles para el pipeline previsto; no prohíbe estudiar copias privadas. [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/) indica que un cambio exclusivo de formato no crea por sí mismo una adaptación. Eso no habilita reconstrucción, reparación, segmentación o ensamblaje modificado arbitrariamente. `redistributionAllowed=true` en licencias CC es **condicional**: conservar atribución, licencia, cambios, NC/SA/ND correspondientes; nunca permiso incondicional.

El 403 nuevo se produjo únicamente en documentación `https://sketchfab.com/developers/download-api`; no se repitió. No se visitaron de nuevo los dos cráneos con 403 histórico. La API de metadatos fue accesible por HTTPS, sin autenticación ni evasión. No se extrajo geometría protegida, no se creó cuenta, no se usaron credenciales, y no se contactó a autores.

## Siguiente paso concreto

Comprobación posterior: la petición oficial de descarga felina `https://api.sketchfab.com/v3/models/7106115b299649e992476f2d3b4fc602/download`, sin credenciales, devolvió HTTP 401. No se descargó geometría ni se repitió para eludir autenticación. La licencia de metadatos no sustituye el acceso autorizado al archivo.

Primero conciliar inventarios científicos y técnicos. Después, el maestro felino de Tavernier es candidato a adquisición oficial bajo NC-SA si el alcance cumple esas condiciones; el maestro canino LMU necesita permiso de descarga, modificación y redistribución. Los GLB felinos de GitHub podrían cubrir más regiones, pero requieren licencia explícita y origen antes de adquirir más. Mantener por separado especímenes/regiones sin ensamblar cráneos ajenos ni escalar piezas para simular un animal único. Hasta obtener geometría y permisos compatibles, indicar «Modelo 3D no disponible» en las regiones afectadas.
