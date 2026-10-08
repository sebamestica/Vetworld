# Decisiones — 2026-10-08

UI V2: diseño HTML obligatorio preservado y migrado a React. No reutilizar SVG/diccionario anatómico simulado; conservar backend, fixture y referencias legales. Tema/ajustes persistidos localmente, voz nativa con aviso, búsqueda aproximada compatible con contrato v1. Calidad y cortes afectan Three.js; no aplicar filtros CSS al Canvas. [Detalle](ui-v2/README.md).

Actualización fase 1: por solicitud explícita del usuario se implementa backend REST de lectura antes del visor, en un único Next.js con JSON/Zod/Vitest y presupuesto cero. El alcance anterior de fase 1 y la decisión inicial de no backend quedan sustituidos. Commits locales por hitos; sin despliegue público. Ver [diseño](api/design.md).

## Registro histórico de fase 0

| Decisión | Motivo / estado |
|---|---|
| Ejecutar únicamente fase 0 | Autorización actual: terminar documentación sin instalación ni aplicación |
| Mantener Next.js + TypeScript + R3F/Drei | Selección del documento maestro; versiones concretas aún no fijadas |
| JSON/TS y estado React local | Contenido curado; evitar infraestructura innecesaria |
| Primera región cabeza; activos abiertos/gratuitos; atlas público | Supuestos predefinidos del maestro, sujetos a corrección del usuario |
| Cráneos como candidatos pendientes | Evidencia indexada de autor/descarga/CC Attribution; falta inspección del archivo y licencia exacta |
| No usar Z-PIG como perro/gato | La investigación previa lo identifica como cerdo; referencia de pipeline únicamente |
| No repetir accesos 403 | Reutilizar registro previo y búsqueda indexada; inspección manual autorizada si hace falta |
| Sin nuevos subagentes en esta reanudación | La investigación ya fue completada; integración breve no justifica costo adicional |
| Inicializar Git y subir documentación tras autorización adicional | El usuario autorizó subir la fase 0 el 2026-10-08. HTTPS permite consultar el remoto, sin referencias existentes; usar rama `main` y push sin fuerza. Esto no autoriza fase 1 ni despliegue web |

Cuestiones abiertas: revisor anatómico cualificado y acceso bibliográfico; formato y licencia exacta de cada cráneo; geometría muscular individualizada redistribuible; elección de fixture técnico y versiones para fase 1. No hay modelo anatómico adquirido ni publicación autorizada.

## Decisiones implementadas en fase 1

- Se conserva el maestro y la historia Git; bootstrap manual sobre carpeta no vacía.
- Runtime Next/React/Zod fijado en lockfile; datos importados estáticamente con caché de snapshot y copias aisladas para consumidores. Sin adaptadores redundantes ni escrituras serverless.
- API v1 con entrada estricta, paginación acotada, respuesta validada y caché HTTP; archivos/SHA-256 en CLI/CI separada para evitar rastreo de todo el proyecto en Functions.
- Contenido regional partial/pending por falta de evidencia de cobertura completa; capas de profundidad requieren asociaciones explícitas y tendones/ligamentos/fascias tienen metadatos separados.
- Revisión anatómica humana nunca sustituida por tests. Semilla bibliográfica reducida, modelos pendientes con recurso nulo.
- Pruebas HTTP dev y producción local ejecutadas; contratos comparan OpenAPI versionado sin regenerarlo en CI. Revisor debe evaluar cambios del baseline.
- Commits locales por hitos. CI sin deploy; no push ni Vercel público de esta fase hasta autorización. El fixture del visor queda fuera del backend actual.

## Fase 2

- Usuario aprobó backend y autorizó visor responsive completo con commits/push. No autorizó publicar aplicación ni material científico restringido.
- Región inicial miembro torácico: reutiliza ocho fichas reales; cabeza continúa sin geometría. No rediseñar backend ni inventar descripciones pendientes.
- R3F/Three.js/Drei con Canvas diferido, mappings explícitos, metros y presupuestos. Un GLB propio de cuatro formas técnicas permanece fuera de estadísticas científicas.
- Referencias en catálogo adicional y endpoints aditivos; ninguna modificación incompatible de contratos v1. Cuatro asociaciones académicas externas, cero fotografías internas.
- Reutilizar anatomy-integrity como veterinary-anatomy-accuracy; ampliar pipeline/QA móvil, añadir renderizado, derechos de medios y testing frontend sin duplicados.
- CSP con nonces y estilos controlados permitidos; página dinámica, API/estáticos conservan caché. Sin imágenes remotas ni proxy.
- Chromium con WebGL software y touch emulado para E2E; no representa mediciones en dispositivos físicos. Capturas guardadas con datos de API y modelo temporal explícito.

## Decisiones implementadas en Fase 3

- **Segmentación regional vs. Cuerpo monolítico:** No fusionar activos anatómicos no correlacionados morfológicamente para forzar un "perro completo" artificial. Se implementa arquitectura de visor con carga y montaje regional dinámico (`canine:thoracic-limb`), declarando «Modelo 3D no disponible» en regiones pendientes.
- **Pipeline Three.js headless en Node.js:** Conversor binario automatizado en `scripts/anatomy/convert-assets.ts` con polyfill de `FileReader` para generar GLB estándar sin requerir ejecutable de Blender instalado ni servidores de renderizado.
- **Preservación de identificadores de malla:** Cada nodo en la jerarquía del glTF conserva el identificador original del escaneo/diseño; la correspondencia con las estructuras del catálogo se realiza a través de `meshMappings` auditables.
- **Normalización PBR y escala métrica:** Factor $0{,}01$ aplicado a fuentes FBX en centímetros. Materiales neutros sin texturas fotográficas ficticias.
- **Expansión estricta del catálogo:** Incorporación de 35 nuevas estructuras con terminología NAV 6.ª edición respaldada, conservando `reviewStatus: 'pending'` hasta revisión veterinaria humana.

