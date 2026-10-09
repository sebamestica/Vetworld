# API REST v1

Base `/api/v1`. Solo lectura, runtime Node.js, sin autenticación ni escrituras. Esquemas ejecutables: `src/lib/api/contracts.ts`; dominio: `src/modules/anatomy/schemas/catalog.ts`. [OpenAPI 3.1 versionado](openapi.json) se genera con `npm run docs:api`, sin dependencia adicional. Revisar diff: regenerarlo es una decisión contractual, no una forma de esconder fallos de contrato.

## Rutas y ejemplos

Todos los ejemplos son sufijos de `http://localhost:3000/api/v1`.

| GET | Ejemplo | Datos |
|---|---|---|
| `/health` | `/health` | Estado, versión API y lectura/versionado del catálogo |
| `/species` | `/species?limit=2` | Perro/gato, disponibilidad por región y cantidad real de estructuras |
| `/regions` | `/regions?species=canine` | Regiones, subdivisiones, IDs asociados y disponibilidades separadas |
| `/regions/{id}` | `/regions/thoracic-limb?species=feline` | Región y descendientes incluidos en asociaciones |
| `/structures` | `/structures?species=canine&region=brachium&kind=muscle&system=muscular` | Fichas específicas por especie |
| `/structures/{id}` | `/structures/canine:biceps-brachii` | Ficha, campos opcionales, pendientes, fuentes y revisión |
| `/structures/{id}/relations` | `/structures/canine:biceps-brachii/relations?type=origin` | Relaciones de entrada/salida, tipo e IDs fuente; direcciones conservadas |
| `/search` | `/search?q=omoplato&species=feline&kind=bone` | `{structure,score}`, nombres/sinónimos, relevancia descendente |
| `/systems` | `/systems` | Sistemas registrados |
| `/layers` | `/layers?species=canine&region=thoracic-limb` | Tipos, IDs de estructuras/modelos y geometría realmente disponible |
| `/models` | `/models?species=feline&region=head` | Manifiestos; candidatos pendientes con `resourceUrl:null` |
| `/models/{id}` | `/models/feline:skull-candidate` | Formato, archivo, autoría, licencia propia, mallas y procedencia |
| `/sources` | `/sources` | Bibliografía y licencia de sus contenidos, distinta de la del modelo |
| `/sources/{id}` | `/sources/umn-proximal-thoracic-limb` | Fuente y estructuras que respalda |
| `/taxonomy` | `/taxonomy` | Tipos, relaciones, estados de revisión y disponibilidad |
| `/stats` | `/stats` | Cantidades reales; verificadas solo las fichas con revisión `validated` |
| `/references` | `/references?structure=canine:biceps-brachii` | Referencias curadas; filtros `structure`, `species`, `region` y paginación |
| `/references/{id}` | `/references/umn-canine-brachium` | Tipo de medio, autor, licencia, revisión y modo externo/interno |

Listas admiten `page` desde 1 (máximo 1.000.000), `limit` entre 1 y 100 (defecto 20). Todas las listas usan orden estable por ID; búsqueda ordena por relevancia y luego ID. Página posterior al total retorna lista vacía con total real. No se admite notación decimal/exponencial ni parámetros repetidos.

En estadísticas, `incompleteRecords` cuenta fichas de estructuras con `completeness=partial`; los modelos pendientes se cuentan aparte en `modelsPending`. Es un indicador editorial, no un dictamen científico. `structuresScientificallyVerified` exige estado humano `validated`, y en la semilla vale cero.

Filtros `species`, `region`, `kind`, `system` en estructuras/búsqueda; especie/región en modelos/capas; especie en regiones. Otros filtros no se admiten. `q` obligatorio en búsqueda, 1–120 caracteres tras trim, con letras o dígitos; normalización de mayúsculas, acentos y espacios. Coincidencia exacta precede prefijo y contenido. Un ID de filtro desconocido es 400; una combinación válida sin datos es 200 con lista vacía. Región padre incluye descendientes.

`contentAvailability` de región es `pending` sin fichas y `partial` con esta semilla: no se afirma cobertura integral. `modelAvailability` es independiente. Capas superficiales/profundas requieren asociaciones explícitas; no se deduce profundidad solo del tipo músculo. `available:false` indica que no hay geometría habilitada. Datos anatómicos incompletos permanecen consultables con `missingFields` y revisión `pending`; no confundir bibliografía comprobada con revisión humana.

## Respuestas

```json
{"data":[],"meta":{"apiVersion":"v1","dataVersion":"2026-10-08.1","pagination":{"page":1,"limit":20,"total":0,"totalPages":0}}}
```

Detalles, health, taxonomy y stats no incluyen paginación. Campos de dominio se validan con Zod antes de salir; salida incompatible o catálogo inválido producen 500.

```json
{"error":{"code":"VALIDATION_ERROR","message":"Parámetros inválidos o no admitidos"}}
```

| HTTP | Código | Causa |
|---|---|---|
| 200 | — | Consulta válida |
| 400 | `VALIDATION_ERROR` | ID malformado, filtro desconocido, parámetro extra/repetido, codificación inválida o página/límite/q inválidos |
| 404 | `NOT_FOUND` | Recurso o ruta inexistente |
| 405 | `METHOD_NOT_ALLOWED` | POST/PUT/PATCH/DELETE en rutas existentes; `Allow: GET, HEAD, OPTIONS` |
| 500 | `INTERNAL_ERROR` | Fallo de lectura, servicio o validación de salida; sin trazas, rutas privadas ni credenciales |

GET tiene JSON y `X-Content-Type-Options:nosniff`. HEAD conserva estado/cabeceras y omite cuerpo. OPTIONS devuelve 204 y Allow; no habilita CORS cruzado. Para el frontend del mismo proyecto no hace falta CORS. Métodos ajenos al protocolo HTTP estándar pueden ser rechazados por Next.js antes del handler.

Catálogos exitosos: `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`. Health y errores: `no-store`. La caché es HTTP/CDN; no utiliza almacenamiento externo. Tras editar JSON se requiere build/despliegue de esa versión; no hay API editorial ni escritura en Functions.

## Consumo desde frontend futuro

Consultar species → regions → structures/modelos; seleccionar estructura por ID y pedir ficha/relaciones. Solo cargar un recurso cuando `availability==='available'` y `resourceUrl` exista. `meshMappings` enlaza nodos reales con estructuras y capas. El visor no debe inventar mallas donde solo hay una ficha ni tomar una licencia bibliográfica como permiso de archivo 3D. La API ya permite filtros, búsqueda paginada, atribución y estados de revisión sin requerir geometría.

El acceso a datos se concentra en `CatalogRepository.read()`, con snapshot JSON validado y copias aisladas. Servicios no conocen HTTP. Una migración futura puede sustituir ese repositorio sin múltiples adaptadores ahora ni cambiar los contratos de v1. Cambios incompatibles requieren revisión y versión de API, nunca regeneración silenciosa del baseline.

Fase 2 añade referencias sin cambiar los contratos aprobados: OpenAPI 1.1.0 incorpora dos operaciones y esquemas nuevos, API sigue v1. Las cuatro referencias actuales son asociaciones al mismo capítulo universitario, no cuatro fotografías. `displayMode=external` siempre devuelve imagen y miniatura nulas; `internal` exige licencia verificada, redistribución admitida y rutas locales comprobadas. Whitelist HTTPS de dominios académicos, sin proxy ni parámetros de URL arbitraria. `/stats` sigue contando solo modelos científicos; la fixture técnica del visor se mantiene en `data/viewer/`.

Integración corporal: OpenAPI 1.2.0 documenta `scope` opcional (`regional` / `whole-body`) en modelos y permite `regionId=null` para conjuntos sin una única región. Los modelos regionales conservan su ID regional; los consumidores deben contemplar el caso corporal nulo. No se crea un ID de región ficticio «all»: es estado de navegación del cliente, que omite ese filtro. Consultar `/models?species=feline` o `/models/feline:tavernier-skeleton`; filtrar una región concreta no declara segmentación del conjunto. El modelo felino disponible tiene `structureIds=[]` y `meshMappings=[]`: permite visualizarlo, no seleccionar huesos todavía. `review.status=pending`. No deducir completitud o escala física de `availability=available`. Datos versión `2026-10-08.2`; contratos actualizados explícitamente y probados.
