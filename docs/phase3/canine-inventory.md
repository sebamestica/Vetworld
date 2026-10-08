# Inventario osteológico de referencia canino

Fecha: 2026-10-08. Perfil adulto de referencia, sin espécimen, sexo ni raza asignados. Todos los registros conservan `status=not_located`, `reviewStatus=pending` y `geometryMapping=[]`. «Modelo 3D no disponible».

## Alcance y conteo

335 registros técnicos, distribuidos por tipo: group: 16; bone: 221; tooth: 42; anatomical_component: 28; variable_series: 13; conditional_bone: 15. Estos números son registros del esquema, **no el total de huesos de un animal**. Grupos, dientes, componentes fusionados, series y condicionales no se suman como huesos independientes.

Identificadores bilaterales estables, atlas y axis individuales, C3–C7, T1–T13 y L1–L7; sacro único con S1–S3 como componentes. Trece pares de costillas y ocho segmentos esternales son una referencia habitual, sujetos a variantes. Cola y arcos hemales quedan como series sin cantidad fija.

Cráneo: huesos pares y medios, componentes temporales y occipitales, esfenoides con componentes; interparietal conservado como componente adulto fusionado que debe conciliarse. Los componentes no crean suturas, límites ni cortes de malla. Etmoides conserva sus componentes nasales dentro de la unidad; no duplicar cornetes etmoidales como huesos libres. Mandíbula individualizada por lado; sínfisis no constituye un hueso extra. Tres huesecillos auditivos por lado. Aparato hioideo separado del cráneo; timpanohioides cartilaginoso no contado como hueso.

Dentición: 42 posiciones permanentes habituales individualizadas por arcada/lado; dientes son un tipo propio, no huesos. Premolares P1–P4; molares maxilares M1–M2 y mandibulares M1–M3. Dentición decidua queda fuera del perfil adulto y se concilia si persiste. Pérdidas, agenesia y dientes supernumerarios requieren evidencia individual.

Extremidades: carpo con intermediorradial unido y componentes sin doble conteo; siete unidades carpianas y siete tarsianas de referencia por lado. Coxal único con ilion, isquion y pubis como componentes. Dedo I torácico con dos falanges; II–V con tres. Pie II–V individualizado. Metatarsiano I y falanges pélvicas del I permanecen condicionados; un vestigio no demuestra dedo funcional. Clavícula vestigial con osificación condicionada en perro.

## Incertidumbres y revisión necesaria

- Individualizar los sesamoideos palmares/plantares y dorsales por espécimen; las series no ocultan un total fijo. Fabelas, poplíteo, supinador y abductor del I están registrados con condiciones de osificación/presencia.
- Comprobar espolones pélvicos, duplicación y desarrollo del metatarsiano I. El os penis requiere espécimen macho y edad pertinente.
- En perro, confirmar contra un texto osteológico específico la fórmula esternal y el inventario apendicular; NAV normaliza términos pero no acredita cantidades. En gato, cotejar referencias históricas con el texto moderno.
- Revisar fusiones craneales, sacras, coxales y esternales según edad y espécimen. Este perfil conserva identidad anatómica, no afirma separabilidad geométrica.
- Seleccionar un espécimen trazable antes de asociar mallas, número caudal, escala o transformaciones. No mezclar regiones de animales distintos para simular completitud.
- Revisión humana cualificada pendiente; validación de IDs y referencias no acredita exactitud anatómica.

## Fuentes y reproducción

- [ICVGAN / WAVA: Nomina Anatomica Veterinaria, 6.ª edición, 2017](https://www.wava-amav.org/wava-documents.html): OSTEOLOGIA, páginas impresas 11–28 (PDF 29–46); ORGANA SENSUUM, ossicula auditus; SPLANCHNOLOGIA, dentes y os penis. Texto privado consultado en workbench/references/nav6.txt. Nomenclatura comparada, no prueba de presencia individual ni permiso para geometría.
- [Veterinary Dentistry: A Team Approach, extracto editorial Wiley](https://catalogimages.wiley.com/images/db/pdf/9781118816127.excerpt.pdf): Capítulo 1, fórmula dental permanente de perro y gato. Fórmulas de referencia; pérdida, agenesia, dientes supernumerarios y erupción se concilian por espécimen.
- [American Veterinary Dental College: nomenclatura](https://avdc.org/avdc-nomenclature/): Dentición y sistema Triadan modificado. Numeración conserva posiciones homólogas ausentes en gato; no renumerar sus premolares como P1–P3.
- [Veterinary Information Network: referencia de columna canina](https://www.vin.com/apputil/project/defaultadv1.aspx?SAId=1&catid=93445&id=4953012&pId=17256): Columna: C7, T13, L7, sacro fusionado con tres componentes y cola variable. Consulta indexada del artículo primario clínico del proveedor. No incorporar medios. No respalda un número caudal universal.

Datos: [canine.json](../../data/osteology/reference/canine.json). Generación determinista: `npx tsx scripts/osteology/generate-reference-inventories.ts`. El generador comprueba unicidad, padres de tipo grupo, referencias de fusión y fuentes presentes. No adquiere ni publica geometría.
