# Plan de despiece felino y fichas científicas

Fecha: 2026-10-10. Nueva etapa dentro de fase anatómica abierta. Entrega actual: investigación, guía, auditoría y plan; no se implementa todavía un despiece de producción. Referencias: [guía científica](feline-scientific-guide.md), [auditoría del modelo](feline-model-audit-2026-10-10.md), [pipeline ya construido](segmentation-diagnostic.md).

## Decisión de base

Conservar Tavernier para contexto y regiones de superficie defendibles. No dar por hecho que cortar su única malla recupera todos los huesos completos: falta geometría interna/articular y hay zonas poco legibles. El producto tendrá cuatro estados explícitos por pieza: dato bibliográfico registrado, superficie identificada parcial, hueso geométrico suficiente y revisado anatómicamente. La selección técnica puede funcionar sobre superficie parcial siempre que la ficha lo indique; eso no cuenta como hueso completo.

Estrategia recomendada: anatomía/documentación y geometría avanzan en paralelo. Completar fichas verificables aunque no tengan malla; segmentar las superficies identificables; buscar escaneo/CT autorizado para piezas que no existen o no pueden delimitarse. Alternativa de insistir solo en fotogrametría no permite recuperar interiores perdidos; alternativa de sustituir todo el espécimen necesita una nueva fuente corporal autorizada que todavía no está adquirida.

## 1. Auditoría fila a fila y diccionario

Usar las 323 entradas como lista de trabajo, no importar todas como huesos disponibles. Conciliar tipos: hueso, componente fusionado, grupo, serie variable, condicional y diente. Resolver IDs estables independientes de nombres Blender; especie, modelo/espécimen, lado y ordinal. Cotejar términos con NAV y sinónimos históricos; grupos no obtienen fichas de hueso engañosas.

Separar evidencia por afirmación: nomenclatura, presencia habitual, descripción/morfología, accidentes, articulaciones, inserciones documentadas, relaciones vasculonerviosas, variantes y observación en el activo. Registrar fuente, página/sección/figura, afirmación respaldada, especie/muestra y limitaciones. Un único sourceIds general no justifica rellenar todos los campos. La tabla de investigación actual propone rutas de consulta y marca lo pendiente; no es una ficha clínica completada.

Aceptación: cada fila tiene clasificación y ruta bibliográfica; cada dato publicado tiene evidencia específica. Nunca completar campos por similitud de nombres ni por tamaño de un fragmento.

## 2. Matriz de cobertura real del activo

Para cada entrada registrar: visible/oculta/no identificable/no representada; integridad de superficie; límite defendible; escala/lado conocidos; método y evidencia. «No visible» no equivale a «ausente». Resolver lateralidad y ejes antes de emitir mallas derecha/izquierda. Mantener datos de espécimen desconocidos si la fuente no los informa.

Usar vistas ortogonales y ampliaciones de la auditoría. Comparar por región con referencias felinas, evitando mezclar imágenes de conejo, perro o Panthera. No diagnosticar fracturas o deformidades del animal a partir de defectos de una malla.

Aceptación: estado por pieza con evidencia, sin porcentaje de completitud si el número esperado del espécimen es desconocido. Una lista de objetivos y una lista de geometrías presentes son tablas distintas.

## 3. Piloto de dos o tres huesos grandes

Inspeccionar húmero/fémur/tibia como candidatos; elegir solo los que tengan límites reconocibles. Anotar triángulos en `feline_annotation.blend`, con source_face_index ya verificado. Crear propuestas privadas con límites/identidad/fuentes y lado desconocido si aún no puede determinarse. Particionar mediante CLI existente, conservando todas las caras no asignadas como remanente.

Comparar segmentación antes/después en varias vistas: ninguna cara perdida o duplicada, coordenadas/UV/materiales conservados y regiones vecinas intactas. No cerrar una superficie cortada como si se hubiese escaneado interior. Un profesional revisa etiquetas/límites; validación técnica no acredita exactitud.

Aceptación: al menos un recorrido real clic → ficha y control de pieza **admitida**, o bloqueo documentado del piloto. No prometer tres huesos si la inspección no lo permite.

## 4. Selección y visor

Registrar uno o varios nodos por estructura; todas sus mallas se resaltan/ocultan/aislan juntas. Mantener el cuerpo en una escena. MeshMappings solo para identidad defendible; remanentes usan visualNodes sin ficha falsa. Añadir estado de geometría parcial en ficha y leyenda discreta.

Raycasting no selecciona objetos ocultos o recortados. La búsqueda abre la ficha aunque no haya geometría, indicando esa disponibilidad. Filtro regional opera sobre mappings reales; restablecer retorna al animal. Para huesos naturalmente fusionados conservar nodo conjunto y, si existen etiquetas revisadas, selección de región por caras; no crear suturas falsas.

Modificar únicamente manifiestos/visibilidad/carga, hook de contexto y panel necesarios. Reutilizar UI V2. No crear sistema de plugins ni reconstruir backend. Si se necesita un campo nuevo de lado/ordinal/evidencia por afirmación, realizar extensión documentada de contratos y pruebas; no meter metadatos científicos en strings de nombre Blender.

## 5. Escala

Obtener dos medidas del mismo espécimen entre accidentes claramente identificables, con fuente e incertidumbre. Verificar factor uniforme con CLI de calibración y orientación fuente → maestro → glTF. No usar medias de artículos, raza o talla aproximada para acreditar escala. Si no llegan medidas, permitir estudio morfológico con aviso y medición deshabilitada.

## 6. Expansión por lotes

| Lote | Alcance | Riesgo y condición de avance |
|---|---|---|
| A | Huesos largos y escápulas, ambos lados cuando se identifiquen | Confirmar límites articulares, lateralidad y grado de superficie disponible |
| B | Pelvis/sacro, patellas y restantes miembros | Fusionados con componentes, estructuras pequenas sin atribución automática |
| C | Columna y costillas | Series ordinales verificadas; no numerar fragmentos ni imponer fórmula al espécimen |
| D | Carpo/tarso/metapodios/falanges | Probable necesidad de mayor resolución; no manos/pies como bloques seleccionados por nombres genéricos |
| E | Cráneo/mandíbula/dentición | Combinar superficie y datos internos solo con procedencia explícita; un cráneo CT diferente no pasa por Tavernier |
| F | Hioides, oído, sesamoideos y variantes | Escala/resolución específica y presencia por espécimen; no inferir desde la vista exterior |

Cada lote sigue investigar → anotar → particionar/reconstruir con evidencia → verificar → revisar → admitir → probar → commit/push. No esperar todos los huesos para entregar progreso útil; no declarar lote completo con fichas sin malla.

## 7. Completar las tablas de estudio

Preparar campos por tipo. Huesos: nombre/NAV/sinónimos, lado/ordinal, descripción, situación, accidentes, articulaciones, fijaciones musculares/ligamentosas respaldadas, relaciones, variaciones, bibliografía y revisión. No rellenar origen/inserción/acción muscular como campos del hueso; usar attachments/function según contrato actual. Dientes: arcada, posición Triadan, corona/raíces solo con evidencia; nunca kind=bone. Componentes fusionados: parentId y estado de límite identificado/inferido, sin doble conteo.

Incorporar primero hechos bibliográficos verificados, con geometría/modelIds vacíos si no hay correspondencia. Resolver migración de dientes porque el contrato actual no incluye ese tipo: documentación y schema/tests antes de publicar. No introducir datos ficticios para completar campos. Si detalle específico no está respaldado, null/omitido y missingFields explícitos.

Aceptación: relaciones recíprocas, IDs íntegros y campo-fuente rastreable; denominación correcta de tabla bibliográfica frente a tabla de geometría. Revisión humana pending hasta registro competente.

## 8. Reparar o sustituir geometría

Defectos técnicos pueden repararse en copia si se conoce método y no destruye detalle: normales/costuras/materiales. Guardar antes/después y transformaciones. Reparar un agujero no demuestra recuperar una superficie anatómica: si falta información, mantener vacío/parcial o adquirir otra fuente autorizada. Datos CT craneales CC0 localizados se evalúan por volumen individual; no descargar 51 GB indiscriminadamente. Como pertenecen a otros animales, primero usarlos de referencia o con identidad propia; reconstrucción multiespécimen requiere registro y etiquetas de incertidumbre, no un escaneo íntegro ficticio.

## 9. Pruebas y cierre

Unidad: identificación, tipos, lado/ordinal, trazabilidad por afirmación, series variables, mappings múltiples, superficies parciales y límites. Geometría: hashes, triángulos retenidos, fuenteFaceIDs, nodos, UV, transformación/escala y ausencia de geometrías publicables sin permiso. Integración/contratos: ficha, fuentes, búsqueda, registro sin malla, datos incompletos y nuevas propiedades/tipos. E2E: pieza real → selección/resaltado → ficha → ocultar/aislar → región → restaurar; desktop/móvil emulados y capturas inspeccionadas. Build y smoke de producción local. Las pruebas históricas no se presentan como corridas nuevas.

Tres entregas distintas: (1) guía/tablas bibliográficas; (2) atlas parcial con superficies/piezas seleccionables; (3) esqueleto completo específico del espécimen con huesos suficientes e identidades/escala/revisión. Solo la tercera puede cerrar el objetivo científico. No dar fecha garantizada mientras falten datos y revisión. Sin despliegue público y sin contacto a autores por defecto.
