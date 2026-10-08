# Fase 2: visor y referencias curadas

Autorización del usuario: implementar la fase completa, dependencias gratuitas, pruebas locales, skills especializadas y commits/push por hitos. Fase 1 aprobada. No publicar la aplicación ni incorporar medios de permisos inciertos.

## Experiencia

Estación de estudio: navegación por especie/región a la izquierda, visor predominante al centro y ficha a la derecha. Móvil: visor primero y ficha inferior expandible que se puede cerrar. Paleta académica azul tinta (#183d57), fondo blanco grisáceo (#f2f5f7), papel (#ffffff), selección turquesa oscuro (#087e83), texto (#203542) y aviso ámbar (#8c571b). Tipografía del sistema para controles; Georgia en títulos anatómicos y latinos. Contraste y tamaños táctiles antes de decoración. Sin descarga de fuentes externas.

## Integración

Reutilizar `/api/v1` y sus esquemas sin cambiar respuestas aprobadas. Cliente con fetch abortable y validación Zod; carga de fichas y relaciones solo al seleccionar. Región inicial miembro torácico: es donde existen las ocho fichas respaldadas. Los candidatos de cabeza continúan sin archivos.

Visor cliente con carga diferida de R3F/Three.js. Manifiesto de visualización separado del catálogo científico para que una fixture no incremente modelos anatómicos disponibles. Metros internos, presupuesto de bytes/triángulos/memoria estimada, SHA-256 y unidades/orientación. Cada malla seleccionable tiene mapping explícito por especie y capa. Demostración técnica con geometría propia, claramente no anatómica; misma escena sirve para verificar flujo de API sin afirmar equivalencia espacial de tejidos. Solo habilitar activos científicos con disponibilidad y derechos verificados.

OrbitControls, selección por raycasting, resaltado, ocultamiento, aislamiento, transparencia acotada, reset cámara/vista, calidad adaptable y demand rendering. Fallback textual/lista seleccionable ante falta WebGL, contexto perdido o error de archivo. Materiales sobrios con formas legibles, sin inventar detalles histológicos. Modelo cargado una vez por URL, materiales clonados controlados, geometría/texturas liberadas al sustituir activos.

Referencias curadas en catálogo separado, relacionadas por IDs existentes. Añadir endpoint `/api/v1/references` y detalle, sin modificar fichas v1. Fotos/TC/RM/ilustraciones/vídeos diferenciados. Solo imágenes locales aprobadas pueden generar miniatura/ampliación; el resto es enlace académico externo con autor, licencia y revisión. No scraping/hotlinking/proxy. La galería funciona aunque no exista ninguna fotografía aprobada.

## Validación y ejecución

Agente de fuentes: catálogo y licencias de referencias, endpoints nuevos y tests de su módulo. Agente de visor: fixture GLB propia, manifiestos, lógica de visibilidad/selección y Canvas/R3F. Coordinador: skills, diseño responsive, integración API, ficha/galería, seguridad, Playwright, verificación final, commits/push. Archivos asignados sin solapamiento. Máximo tres agentes y modelos heredados; no se afirman tarifas.

Vitest mantiene suites del backend y añade unidad/interacción controlada. Playwright con Chromium local verifica selección real de malla, panel, capas, cambios de especie/región, referencias, errores, desktop/tablet/móvil emulados y capturas. Build y smoke producción local obligatorios. Emulación de WebGL/software no acredita Safari iOS ni Android físicos.

CSP con imágenes/connect solo mismo origen, sin imágenes remotas ni fuentes externas. Scripts Next requieren compatibilidad específica documentada; evitar HTML arbitrario y validar URLs/manifiestos. Sin escrituras o procesamiento gráfico en Functions. Push autorizado guarda el código; no configurar Vercel ni disparar publicación intencional. Verificar el remoto y proteger ramas/historia sin fuerza.
