# Plan de pendientes anatómicos: gato y perro

Propuesta posterior al commit 24203e7. Alcance: identificación y selección ósea, escala, revisión científica, permisos y ensamblaje. Conservar UI V2, API, originales y maestros. Este documento no ejecuta segmentación ni solicita permisos a terceros.

## Estado inicial y prioridades

Gato: conjunto visible en el visor, una malla fotogramétrica de 74.235 triángulos, muchas islas geométricas, sin huesos individualmente identificados ni escala física acreditada. Licencia CC BY-NC-SA 4.0 y procedencia confirmadas. Perro: cuatro STL regionales de un modelo no escaneado según proveedor, separados espacialmente, sin unidades acreditadas ni permiso web suficiente. Las plantillas de 335/323 entradas no son conteos de huesos de un espécimen.

Prioridad: resolver primero la viabilidad de selección felina. Escala y documentación pueden avanzar en paralelo. Permisos caninos constituyen una línea independiente; no deben bloquear el gato.

## Hito A — Diagnóstico de segmentación felina

1. Trabajar sobre copia versionada del maestro candidato; conservar GLB, textura y hashes originales.
2. Generar vistas ortogonales y regiones de interés; estudiar conectividad, tamaño de fragmentos, normales, agujeros, superficies unidas y límites articulares.
3. Proponer un piloto de 2–3 piezas grandes realmente distinguibles, priorizando huesos largos de miembros. No prometer una pieza concreta antes de inspeccionarla.
4. Evaluar si varias islas corresponden a un mismo hueso o si una superficie conecta huesos diferentes. Las 7.349 islas no se convierten automáticamente en huesos.
5. Documentar qué puede separarse con evidencia, qué solo admite una etiqueta regional y qué no es identificable. Conservar fusiones naturales y geometría incierta.

Entrega: informe de viabilidad por pieza, candidatos del piloto y capturas anotadas privadas. Cierre: límites defendibles o bloqueo específico con dato necesario para resolverlo. Si el piloto falla, conservar la visualización de conjunto y requerir mejor escaneo/CT/segmentación fuente autorizada, sin cortes inventados.

## Hito B — Escala y orientación felinas

Buscar en metadatos existentes medidas del mismo espécimen: longitud entre puntos anatómicos identificables, referencia métrica de captura o dimensiones fuente documentadas. Preparar una solicitud de información para Tavernier si no están disponibles; no enviarla sin autorización del usuario.

Cuando exista una medida fiable, calcular factor uniforme `metros reales / distancia fuente`, registrar los dos puntos, unidad, método, incertidumbre y evidencia. Comprobar una segunda medida independiente cuando sea posible. No deformar ejes por separado ni escalar con la talla media de un gato. Registrar orientación anatómica y transformación fuente → Blender → glTF; conservar transformaciones en una copia y recalcular cámara/rangos.

Entrega: calibración rastreable o estado explícito de escala desconocida. Cierre métrico: evidencia del espécimen y comprobación consistente. Sin evidencia, el visor continúa con escala desconocida, mediciones deshabilitadas y sin acreditar dimensiones físicas. El encuadre de cámara no equivale a calibración.

## Hito C — Segmentación e identidad felinas

Separar el piloto no destructivamente conservando coordenadas, UV, materiales y textura. Reunir fragmentos solo con pertenencia defendible. No crear superficie ósea para cerrar agujeros como si fuera dato observado. Registrar cualquier reparación técnica y conservar versión anterior.

Asignar ID anatómico estable, nombre NAV, lateralidad, región, fuente y grado de identificación a cada pieza admitida. Los nombres Blender y similitud visual generan propuestas, no aprobación. Una estructura puede tener varias mallas. Para huesos fusionados conservar el hueso y sus componentes; no sumar dos veces ni trazar separaciones falsas. La selección por caras se reserva para regiones científicamente segmentadas; no implementar ese mecanismo para suplir segmentación ausente.

Entrega: maestro del piloto, manifiesto de correspondencias y exportación GLB derivada con atribución/NC-SA y cambios declarados. Cierre técnico: misma ubicación, identidad rastreable, IDs únicos y correspondencias válidas. Revisión científica pendiente hasta evaluación competente. Extender por regiones solo después de verificar el piloto.

## Hito D — Selección, API y búsqueda

Añadir únicamente las fichas de piezas identificadas; reconciliar IDs con el catálogo existente para evitar duplicados. No copiar toda la plantilla como geometría disponible. Las fichas pueden ser parciales y deberán señalar fuentes, lateralidad y campos pendientes.

Conectar raycasting → mapping explícito → ficha API → resaltado. Habilitar aislamiento, ocultamiento y transparencia por hueso; mallas ocultas no interceptan selección. Mantener vista corporal y cámara estable al abrir ficha. Regiones filtran geometría solo donde la asociación sea fiable; búsqueda por especie/lado distingue ficha existente de malla disponible. Varias mallas de un hueso deben resaltarse y aislarse juntas.

Entrega: recorrido real sobre el piloto, sin fixture como sustituto. Cierre: selección de cada pieza admitida, ficha correcta, controles efectivos y retorno al conjunto. El resto del gato conserva estados pendientes.

## Hito E — Revisión científica y cobertura

Preparar un paquete para veterinario/anatomista competente: versiones/hashes, vistas, identificación propuesta, nomenclatura, lateralidad, articulaciones, calibración, cambios y fuentes. Evaluar primero el piloto y después cada región. Registrar responsable, fecha, observaciones y decisión por pieza; corregir y volver a revisar las rechazadas.

Automatización verifica integridad, no exactitud anatómica. Mantener pending hasta evidencia humana documentada. El conteo esperado depende del espécimen: edad, dentición, cola, fusiones y variantes; datos desconocidos permanecen desconocidos. Informar por separado geometría presente, identidad confirmada, escala acreditada y revisión humana. No publicar porcentaje de completitud total si falta un denominador defendible.

Entrega: registro de revisión y cobertura por región, con piezas faltantes y método/fuente necesarios. Cierre científico: aprobación trazable; la ausencia de revisor bloquea ese cierre, no las pruebas técnicas.

## Hito F — Derechos caninos

Preparar una solicitud escrita al autor hidden.art8, identificando producto 285869 y los cuatro STL. Solicitar permiso para modificar/segmentar/ensamblar, convertir a GLB, servir archivos recuperables en el visor educativo, alojar derivados en GitHub, publicar capturas y conservar atribución. Pedir licencia aplicable por archivo, procedencia y confirmación de titularidad suficiente. No confundir uso Royalty Free con permiso de redistribución de geometría.

Entrega: borrador de solicitud y matriz de permisos. El usuario puede enviarla; el agente solo contactará al autor con autorización explícita. Cierre: permiso compatible documentado. Si se rechaza o no llega, conservar trabajo privado y cambiar a una fuente autorizada, por ejemplo permiso/archivo del candidato LMU previamente auditado o CT legítima. No repetir 403 ni extraer buffers protegidos.

## Hito G — Registro y ensamblaje caninos

Inspeccionar contenido exacto de cada STL y sus superficies: no asumir que cuatro piezas incluyen todos los huesos. Identificar lateralidad, variantes y posibles orígenes diferentes. El proveedor declara modelo no escaneado: registrar reconstrucción educativa y no inventar un espécimen biológico.

Establecer marco común y medidas documentadas si existen. Separar copias, determinar planos articulares y registrar transformaciones rígidas por pieza sin escalas arbitrarias para hacerlas encajar. Si el modelo exige reflejo, hacerlo únicamente donde esté justificado y rotular la contraparte como aproximación reflejada. No afirmar bilateralidad escaneada. Verificar cabeza-cuello, columna, tórax, pelvis, miembros, manos/pies y cola; conservar vacíos documentados.

Entrega: maestro ensamblado privado con historial de transformaciones, jerarquía y reporte de huecos. Cierre técnico: conjunto coherente y comprobaciones geométricas; cierre anatómico requiere revisión humana. Si faltan puntos de registro o geometría suficiente, declarar bloqueo y especificar medidas/CT/modelo necesarios. Un ensamblaje visualmente plausible no acredita anatomía completa.

## Hito H — Admisión canina, exportaciones y QA final

Solo con derechos y evidencia suficientes, añadir el modelo canino al catálogo y al visor usando el mismo pipeline felino. Inicial corporal, controles por huesos identificados y fichas correspondientes. Mantener originales pesados y escenas maestras intactos; generar variantes web desde copias. Aplicar optimización según mediciones sin fusionar piezas seleccionables.

Pruebas por hito: unidades/transformaciones, duplicados, lateralidad, mappings múltiples, fuentes, permisos, geometría oculta, IDs/fichas, capas y cobertura. Blender debe guardar/reabrir escenas; GLB debe conservar nodos y coordenadas. Playwright ejecuta selección real, panel, ocultar/aislar/restaurar y cambio de especie en desktop/tablet/móvil emulados; registrar lo bloqueado por especie. Capturas revisadas visualmente y pruebas en dispositivos físicos cuando se disponga de ellos, sin confundir emulación con hardware real.

Conservar regresiones de referencia: 111 unitarias, 69 HTTP, 38 contratos, 39 E2E y 18 smoke aprobadas en el lote previo; son resultados históricos hasta repetirlos. Ejecutar lint, TypeScript, validadores, build y producción local según cambios. Medir carga, bytes, triángulos y rendimiento observable sin inventar memoria/FPS. Commit y push por hito verificado, sin binarios de permisos inciertos ni despliegue público.

## Orden de ejecución y bloqueos externos

1. A: diagnóstico/piloto felino; comenzar B y preparar F en paralelo cuando aporte beneficio real.
2. C → D: primeras piezas seleccionables; escala puede seguir desconocida si no hay evidencia, sin habilitar medidas.
3. E: revisión del piloto; extender regiones a medida que se aprueben métodos/identidades.
4. G: trabajo canino privado cuando haya referencias suficientes; publicación depende de F.
5. H: integración canina admitida y verificación conjunta.

Se necesita evidencia externa para acreditar escala felina, un revisor humano para validación científica y permiso compatible para distribuir el canino. No hay plazo defendible para esos factores. Puede avanzarse con diagnóstico, pilotos, contratos y pruebas sin solicitar confirmación para cada operación ordinaria ya autorizada.

Próximo lote recomendado: A y piloto C/D si el diagnóstico lo permite, más paquetes de medidas/revisión/permisos. No prometer huesos concretos o cantidades antes de inspeccionarlos. La fase continúa abierta hasta dos esqueletos completos, individualizados y con límites/revisiones documentados conforme al criterio del usuario.
