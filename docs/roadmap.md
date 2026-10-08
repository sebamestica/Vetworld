# Fases y aceptación

| Fase | Alcance | Criterio de aceptación | Estado |
|---|---|---|---|
| 0 | Auditoría, reglas, seguimiento y skills | Archivos comprobados; fuentes y límites explícitos; sin aplicación ni dependencias | Documentación completada; fuentes parcialmente verificadas |
| 1 | Backend REST `/api/v1`, catálogo semilla, contratos, validación, CI | Build, lint, tipos, unidad, integración HTTP, contratos y smoke producción local | Completada localmente; espera revisión del usuario |
| 2 | Visor, fichas y referencias curadas; región inicial miembro torácico | Flujo Canvas → selección → ficha → referencia, controles, responsive y QA | Funcional con fixture técnica; validación académica pendiente |
| 3 | Una estructura muscular individualizada y ficha rastreable | Fuente legítima, revisión humana, selección correcta; sin geometría si no existe | Pendiente de fuente científica |
| 4 | Tejidos profundos y capas disponibles | Solo estructuras conseguidas/revisadas; filtros y referencias autorizadas | Pendiente |
| 5 | Rendimiento, accesibilidad y producción | Pruebas en equipos reales, permisos y despliegue autorizado | Pendiente |

## Plan anterior de fase 1 (sustituido)

La solicitud explícita del usuario del 2026-10-08 sustituye este plan por [backend autorizado](api/design.md). No implementar el visor en la fase actual. Las siguientes líneas conservan el contexto de fase 0.

1. Comprobar versiones compatibles y estrategia de inicialización en esta carpeta no vacía, preservando documentos. Configurar TypeScript estricto, ESLint y un solo lockfile npm.
2. Crear pantalla adaptable y contenedor cliente del visor con carga diferida.
3. Seleccionar un fixture técnico de varios nodos, comprobar licencia y registrar procedencia antes de su adquisición. No usar los cráneos como demo ni inventar anatomía.
4. Implementar rotación/zoom, selección, resaltado y ficha genérica «DEMO técnica», restablecimiento y fallback textual.
5. Ejecutar build, lint, typecheck y comprobaciones de selección/ocultamiento, toque y pantallas pequeñas. Diferenciar emulación de equipos reales.
6. Registrar resultados y entregar para aceptación. Preparar para Vercel no autoriza desplegar ni subir a GitHub.

Pendientes científicos de los cráneos no impiden este backend; sí impiden tratarlos como activos publicables. El siguiente alcance visual debe acordarse con el usuario antes de implementar: el plan antiguo de visor no se ejecuta automáticamente. Cada fase requiere nueva autorización.

Solicitud posterior del usuario: fase 1 aprobada y fase 2 redefinida como sistema visual completo. [Diseño autorizado](phase2/design.md) y [entrega](phase2/README.md). 2A preparación completada; 2B investigación/pipeline legal de fixture técnica completados, adquisición anatómica pendiente; 2C visor, 2D integración de fichas, 2E galería/enlaces y 2F QA local completados. No se declara validación académica de una geometría inexistente.
