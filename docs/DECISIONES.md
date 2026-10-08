# Decisiones — 2026-10-08

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
