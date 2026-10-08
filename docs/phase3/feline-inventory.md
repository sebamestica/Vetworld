# Inventario osteológico de referencia felino

Fecha: 2026-10-08. Perfil adulto de referencia, sin espécimen, sexo ni raza asignados. Todos los registros conservan `status=not_located`, `reviewStatus=pending` y `geometryMapping=[]`. «Modelo 3D no disponible».

## Alcance y conteo

323 registros técnicos, distribuidos por tipo: group: 16; bone: 223; tooth: 30; anatomical_component: 28; variable_series: 13; conditional_bone: 13. Estos números son registros del esquema, **no el total de huesos de un animal**. Grupos, dientes, componentes fusionados, series y condicionales no se suman como huesos independientes.

Identificadores bilaterales estables, atlas y axis individuales, C3–C7, T1–T13 y L1–L7; sacro único con S1–S3 como componentes. Trece pares de costillas y ocho segmentos esternales son una referencia habitual, sujetos a variantes. Cola y arcos hemales quedan como series sin cantidad fija.

Cráneo: huesos pares y medios, componentes temporales y occipitales, esfenoides con componentes; interparietal conservado como componente adulto fusionado que debe conciliarse. Los componentes no crean suturas, límites ni cortes de malla. Etmoides conserva sus componentes nasales dentro de la unidad; no duplicar cornetes etmoidales como huesos libres. Mandíbula individualizada por lado; sínfisis no constituye un hueso extra. Tres huesecillos auditivos por lado. Aparato hioideo separado del cráneo; timpanohioides cartilaginoso no contado como hueso.

Dentición: 30 posiciones permanentes habituales individualizadas por arcada/lado; dientes son un tipo propio, no huesos. P2–P4 maxilares y P3–P4 mandibulares mantienen la homología dental; no renumerar los premolares ausentes. Dentición decidua queda fuera del perfil adulto y se concilia si persiste. Pérdidas, agenesia y dientes supernumerarios requieren evidencia individual.

Extremidades: carpo con intermediorradial unido y componentes sin doble conteo; siete unidades carpianas y siete tarsianas de referencia por lado. Coxal único con ilion, isquion y pubis como componentes. Dedo I torácico con dos falanges; II–V con tres. Pie II–V individualizado. Metatarsiano I y falanges pélvicas del I permanecen condicionados; un vestigio no demuestra dedo funcional. Clavícula ósea de referencia felina.

## Incertidumbres y revisión necesaria

- Individualizar los sesamoideos palmares/plantares y dorsales por espécimen; las series no ocultan un total fijo. Fabelas, poplíteo, supinador y abductor del I están registrados con condiciones de osificación/presencia.
- El metatarsiano I rudimentario y cifras sesamoideas históricas de Reighard/Jennings requieren cotejo moderno; no trasladarlas a perro. Epihioides felino diferenciado de Pantherinae. El os penis puede osificarse: presencia variable, sexo/edad desconocidos.
- En perro, confirmar contra un texto osteológico específico la fórmula esternal y el inventario apendicular; NAV normaliza términos pero no acredita cantidades. En gato, cotejar referencias históricas con el texto moderno.
- Revisar fusiones craneales, sacras, coxales y esternales según edad y espécimen. Este perfil conserva identidad anatómica, no afirma separabilidad geométrica.
- Seleccionar un espécimen trazable antes de asociar mallas, número caudal, escala o transformaciones. No mezclar regiones de animales distintos para simular completitud.
- Revisión humana cualificada pendiente; validación de IDs y referencias no acredita exactitud anatómica.

## Fuentes y reproducción

- [ICVGAN / WAVA: Nomina Anatomica Veterinaria, 6.ª edición, 2017](https://www.wava-amav.org/wava-documents.html): OSTEOLOGIA, páginas impresas 11–28 (PDF 29–46); ORGANA SENSUUM, ossicula auditus; SPLANCHNOLOGIA, dentes y os penis. Texto privado consultado en workbench/references/nav6.txt. Nomenclatura comparada, no prueba de presencia individual ni permiso para geometría.
- [Veterinary Dentistry: A Team Approach, extracto editorial Wiley](https://catalogimages.wiley.com/images/db/pdf/9781118816127.excerpt.pdf): Capítulo 1, fórmula dental permanente de perro y gato. Fórmulas de referencia; pérdida, agenesia, dientes supernumerarios y erupción se concilian por espécimen.
- [American Veterinary Dental College: nomenclatura](https://avdc.org/avdc-nomenclature/): Dentición y sistema Triadan modificado. Numeración conserva posiciones homólogas ausentes en gato; no renumerar sus premolares como P1–P3.
- [Paul Mahoney: Musculoskeletal Imaging in the Cat, 2012](https://doi.org/10.1177/1098612X11432823): Esqueleto axial y apendicular, carpo/tarso y sesamoideos. Referencia felina moderna, identificada en investigación previa. Revisión humana pendiente.
- [Jacob Reighard y H. S. Jennings: Anatomy of the Cat, 1901](https://www.gutenberg.org/ebooks/58394): The Skeleton: metatarsus y sesamoid bones. Observación histórica felina: metatarsiano I rudimentario, sin primer dedo funcional habitual. Cotejo moderno pendiente; no copiar ilustraciones ni aplicar a perro.
- [Abby Brown / University of Minnesota: Appendix A, Supplemental Feline Notes](https://open.lib.umn.edu/dogcatanatomylabguide/chapter/appendix-a-supplemental-feline-notes/): Clavículas y diferencias felinas. Evidencia primaria reutilizada de investigación previa; no repetir accesos 403 al portal. Referencia, sin incorporar medios.
- [Estudio tomográfico del os penis felino](https://pmc.ncbi.nlm.nih.gov/articles/PMC10814501/): Resultados: os penis detectable en 20 de 23 gatos. Presencia y osificación variables; no afirmar ausencia universal en gato.
- [Estudio comparativo del aparato hioideo en Felidae](https://pmc.ncbi.nlm.nih.gov/articles/PMC1570911/): Comparación del epihioides osificado y flexible en Felidae. No trasladar hioides de Pantherinae al gato doméstico.

Datos: [feline.json](../../data/osteology/reference/feline.json). Generación determinista: `npx tsx scripts/osteology/generate-reference-inventories.ts`. El generador comprueba unicidad, padres de tipo grupo, referencias de fusión y fuentes presentes. No adquiere ni publica geometría.
