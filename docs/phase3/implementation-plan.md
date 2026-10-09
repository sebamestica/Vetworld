# Plan de pendientes e integración en el visor

Estado: propuesta de ejecución basada en archivos inspeccionados, sin implementación nueva de aplicación. Fecha: 2026-10-08. Objetivo: mostrar cada animal como conjunto, identificar únicamente huesos defendibles y conservar UI V2, API y originales. No supone completitud científica ni despliegue autorizado.

## Punto de partida

- Felino Tavernier: procedencia confirmada, CC BY-NC-SA 4.0, una malla, 74.235 triángulos, 7.349 islas geométricas; escala física y cobertura no comprobadas. Candidato Blender guardado y reabierto. Las islas no son huesos identificados.
- Canino 3DExport/hidden.art8: cuatro STL regionales, 179.590 triángulos importados. Coordenadas no articuladas, unidades desconocidas, modelo no escaneado según proveedor; reflejos previstos por autor. Permiso para distribución web de archivos extraíbles no acreditado.
- Inventarios: 335/323 entradas de referencia, no totales de huesos adquiridos. Sin espécimen documentado ni huesos nuevos científicamente identificados.
- Visor existente: GLB, integridad/hash, cámara, selección, capas, calidad, panel y API. El hook comienza en miembro torácico y filtra el activo por estructuras conocidas; la visibilidad oculta mallas sin mapping. Presets y clipping científicos están restringidos. Estos puntos impiden incorporar correctamente un conjunto no segmentado.
- Conservar cambios previos sin commit. No mezclar su integración con los nuevos hitos ni publicar binarios de permisos inciertos.

## Estrategia elegida

Primero integrar el conjunto felino como candidato visual con limitaciones explícitas, sin atribuir IDs de huesos a la malla completa. En paralelo continuar inventario y evaluación canina privada. Después habilitar selección por piezas identificadas. Esta secuencia produce una experiencia útil sin esperar un atlas completo y sin confundir visualización con validación.

No reconstruir primitivas para rellenar huecos, no separar todas las islas del gato como huesos, no espejar piezas caninas automáticamente y no escalar a una talla universal. Si la geometría no permite individualización, conservarla y registrar las piezas pendientes.

## Hitos y aceptación

| Orden | Trabajo | Entregable verificable | Condición para cerrar |
|---|---|---|---|
| 1 | Sanear permisos y estados heredados | Auditoría por archivo; originales privados; disponibilidad y licencia corregidas | Ningún recurso dudoso se sirve como aprobado ni entra en Git nuevo |
| 2 | Caracterizar candidatos | Informe de orientación, límites, fragmentación, normales, materiales, texturas, unidades y cobertura visible | Archivo abierto, medido técnicamente y límites documentados; sin acreditar escala por apariencia |
| 3 | Evolucionar el contrato visual | Manifiesto de conjunto, capacidades y mappings validados | Permite mallas visibles no seleccionables y escala desconocida sin falsos IDs científicos |
| 4 | Integración felina del conjunto | Exportación GLB derivada y vista inicial corporal en UI V2 | Carga real, cámara/zoom/rotación, atribución y limitaciones visibles; sin selección ósea ficticia |
| 5 | Segmentación e identificación felina | Copia de trabajo con piezas defendibles y propuestas de correspondencia | Identidades rastreables; regiones/huesos que no pueden separarse siguen pendientes |
| 6 | Backend y búsqueda | Fichas parciales, fuentes, mappings y cobertura por pieza admitida | IDs únicos, especie/lado correctos, respuestas válidas, búsqueda sin registros inventados |
| 7 | Interacción anatómica | Selección, panel, ocultar, aislar, transparencia y filtro regional | Solo actúan sobre geometría efectivamente identificada; vista completa recuperable |
| 8 | Construcción canina | Ensamblaje privado rastreable y evaluación de piezas faltantes | Permisos web resueltos antes de integración; escala/orientación/registro defendibles |
| 9 | QA y exportaciones | Pruebas, capturas, build y reportes de cobertura | Evidencia real por especie; funciones bloqueadas separadas de aprobadas |

### 1. Permisos y admisión

Conciliar catálogos científicos y visuales heredados con la auditoría; retirar afirmaciones de redistribución no verificadas. Preservar en privado fuentes y derivados dudosos con hashes. Ajustar validadores y expectativas para que disponibilidad real sustituya conteos históricos. No reescribir historial Git ni hacer force push. Felino: atribución Tavernier, enlace, NC-SA y cambios declarados también en derivados. Canino: solicitar permiso específico para recursos recuperables del visor web; sin contacto automático con el autor. Este bloqueo no impide trabajar en el felino.

### 2. Orientación, escala y cobertura

Examinar distintas vistas del felino, cráneo, columna, costillas, miembros, pies y cola. Registrar presencia geométrica probable separada de identificación anatómica. Intentar obtener medidas o metadatos fuente reutilizando evidencia disponible; no repetir 403. Si faltan medidas, conservar unidades fuente y declarar escala física desconocida. El encuadre por bounding box permite ver el modelo sin modificar proporciones; no habilitar medición métrica fiable. Cuando haya evidencia, registrar conversión al marco anatómico global, transformación completa y motivo.

### 3. Contrato visual y responsabilidades

Extender el manifiesto existente con alcance corporal/regional, estado de precisión, escala verificada/desconocida, procedencia, derechos, cobertura y capacidades. Mantener metadatos de geometría visibles separados de correspondencias anatómicas seleccionables. Un mesh sin identificación puede dibujarse, pero no recibir ID de hueso, ficha ni raycast anatómico. La opacidad/visibilidad del conjunto no depende de un mapping falso.

Permitir varios nodos para una estructura. Una malla con regiones segmentadas requiere identificación y representación explícitas de esas regiones; evitar implementar selección por caras hasta disponer de segmentación defendible. Conservar el esquema API v1; cambios aditivos se documentan y prueban. Los registros de adquisición internos no exponen rutas privadas en la API.

Archivos centrales: `src/modules/viewer/manifest.ts`, `loading.ts`, `visibility.ts`, `assets.ts`; `src/hooks/useAnatomyWorkspace.ts`; `src/components/viewer/AnatomyViewer.tsx`; catálogos de `data/viewer` y `data/anatomy`. Reutilizar panel y buscador existentes.

### 4. Animal entero y controles

Añadir estado de navegación «Todo el animal», separado de IDs regionales científicos: omitir filtro region en consultas generales, no inventar una región en el backend. Seleccionar el modelo corporal por especie y alcance. Cambiar región filtra mallas del conjunto cuando existen mappings; no reemplaza el animal por un cráneo. Si faltan regiones segmentadas, deshabilitar ese filtro con explicación breve y conservar el conjunto visible.

El felino puede tener geometría visual disponible y selección ósea pendiente. El canino sin activo admitido conserva «Modelo 3D no disponible». No usar la fixture para simular su esqueleto. Cambiar especie cancela carga anterior y limpia selección. Restablecer muestra el animal entero.

Usar cámara calculada sobre límites completos. Activar presets anatómicos únicamente con orientación comprobada. Clipping puede mostrar una superficie abierta, no un interior anatómico reconstruido; mantenerlo deshabilitado si no es interpretable. Eliminar mensajes de carga de «demostración técnica» para candidatos científicos, conservando las etiquetas necesarias de revisión pendiente. No cambiar identidad visual del HTML.

### 5–7. Segmentación, fichas y búsqueda

Analizar fragmentación y conectividad sobre copias. Conservar textura y geometría original como referencia. Separar componentes solo donde la identidad y los límites sean defendibles; superficies conectadas requieren segmentación documentada, no cortes arbitrarios. Cada propuesta registra fuente, lado, especie, método e incertidumbre.

Conciliar con el inventario de referencia sin convertirlo automáticamente en catálogo de producción. Añadir fichas trazables aunque incompletas; revisión humana siempre pending hasta evidencia del revisor. No llamar «validado anatómicamente» a una inspección de IA. Búsqueda global incluye solamente registros científicos admitidos y puede abrir una ficha sin malla disponible. Cargar listas paginadas y detalles por ID; no descargar miles de fichas para encontrar un modelo. Exponer cobertura geométrica/identificación/revisión como dimensiones separadas, con cantidad esperada por espécimen desconocida donde corresponda.

### 8. Canino

Una vez autorizados derechos de integración: estudiar identidad de piezas, plano de simetría y medidas. Duplicar/reflejar solo con método documentado y etiqueta de aproximación; no afirmar escaneo bilateral. Registrar articulaciones y transformación de cada objeto en una copia. El modelo comercial no se convierte en espécimen real documentado por ensamblarlo. Si no proporciona evidencia suficiente de huesos o fidelidad, mantenerlo candidato educativo y buscar geometría de referencia/CT autorizada para los pendientes. No completar mediante formas genéricas.

## Validación y conservación

- Originales: ZIP/RAR/STL intactos y hashes comprobados, privados.
- Maestros: candidatos/versiones revisadas en carpetas distintas; scripts que se niegan a sobrescribir. No decimación destructiva.
- Derivados: GLB con fuente, cambios, hash, tamaños, límites y atribución. Publicar solo derivados admitidos, sin despliegue de aplicación en esta fase.
- Pruebas unitarias: manifiestos, mallas no identificadas, mappings múltiples, filtros regionales, capas, selección, permisos y cobertura.
- Integración/contratos: fichas reales, IDs, modelos/capacidades y búsqueda paginada; mantener respuestas/error de v1.
- Playwright: felino corporal → manipulación → selección de pieza solo si existe → ficha → ocultar/restaurar; cambio canino verifica ausencia o activo autorizado real. Separar recorridos de candidatos y de selección anatómica. Desktop/tablet/móvil emulados, sin afirmar pruebas físicas.
- Fallos: archivo ausente, hash incorrecto, textura faltante, mesh sin mapping, respuesta tardía/obsoleta, WebGL perdido.
- Rendimiento: medir carga, bytes, triángulos y comportamiento observado; no inventar FPS/GPU. Calidad baja/media/alta efectiva, texturas y DPR adaptativos. Optimizar solo derivados tras comprobar necesidad.
- Ejecutar lint, typecheck, unidad, integración, contratos, validate:data, validate:viewer, validación de activos, build, smoke de producción local y E2E pertinentes. Capturas fieles a UI V2.

Commit/push por hito verificado, exclusivamente código/metadatos/documentación y activos con permisos admitidos. Registrar pruebas nuevas, limitaciones y bloqueos en PROGRESO. No prometer fecha de completitud científica: depende de evidencia, geometría y revisión humana.

## Criterio de entrega por niveles

1. Integración visual: felino corporal renderizado y manipulable, atribución y límites correctos. No requiere afirmar que todos sus huesos están separados.
2. Atlas interactivo parcial: piezas realmente identificadas seleccionables y vinculadas a API; cobertura exacta.
3. Dos esqueletos completos: anatomía esperada del espécimen representada, individualización adecuada y permisos/escala/identidades comprobados. Solo entonces puede evaluarse el cierre científico, con revisión humana pendiente o completada claramente indicada.

Próximo lote recomendado: hitos 1–4 para entregar el felino corporal en el visor, sin esperar el permiso canino. Este documento organiza ejecución futura y no declara realizados esos cambios.
