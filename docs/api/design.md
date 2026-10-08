# Fase 1: backend autorizado

Solicitud del usuario del 2026-10-08 sustituye el alcance anterior de fase 1 (demo de visor). Se implementa toda la API de solo lectura antes del frontend visual, con presupuesto cero y commits por hitos verificados.

## Diseño

Un proyecto Next.js App Router y runtime Node.js. JSON importados estáticamente, validados y encapsulados en un repositorio simple; las peticiones no escriben ni leen archivos variables del cliente. Servicios filtran, buscan y calculan disponibilidad/estadísticas. Route Handlers traducen entrada HTTP a consultas y validan salida mediante Zod. Sin Express, adaptadores extra, servicios externos ni trabajo 3D.

Contrato `/api/v1`: éxito `{data,meta:{apiVersion,dataVersion,pagination?}}`, error `{error:{code,message,details?}}`. Paginación `page` (desde 1) y `limit` (1–100, defecto 20); orden estable. Rechazo de parámetros desconocidos, repetidos y malformados. Filtros `species`, `region`, `kind`, `system` donde correspondan; IDs filtrados inexistentes producen 400. Detalles inexistentes 404, mutaciones 405 con Allow, fallo de catálogo/salida 500 sin trazas. GET cacheable; errores/health no almacenados. HEAD sin cuerpo y OPTIONS explícitos.

Rutas: health, species, regions y detalle, structures y detalle/relations, search, systems, layers, models y detalle, sources y detalle, taxonomy, stats. Capas describen asociaciones reales y su disponibilidad; no implican mallas existentes. Regiones y especies distinguen contenido bibliográfico de geometría disponible. El catálogo solo publica modelos disponibles con archivo y derechos comprobados; candidatos conservan recurso nulo.

Semilla pequeña con referencias primarias veterinarias, ambas especies, regiones principales, nomenclatura/clasificación y relaciones documentadas. Los campos no respaldados permanecen ausentes y en `missingFields`; revisión humana pendiente. Clasificación distingue músculo, tendón, ligamento, articulación, arteria y vena. Fuentes bibliográficas y licencias de modelos independientes. Fixtures sintéticas exclusivamente en tests.

## Ejecución y validación

1. Scaffold mínimo y dependencias fijadas con npm/lockfile; sin visor.
2. Dominio/datos/validador científico (agente independiente), repositorio/servicios/HTTP (coordinador).
3. Pruebas unitarias y contratos; integración HTTP y smoke local (agente de pruebas, archivos asignados); CI gratuita GitHub Actions.
4. Lint, tipos, validación de datos, tests, build; integrar y hacer commits tras hitos aprobados por sus comprobaciones.
5. Ejecutar contra `next dev` y contra `next start` tras build. Documentar cifras ejecutadas y limitaciones. Sin despliegue público; smoke remoto opcional con API_BASE_URL.

Vercel Hobby exige uso personal/no comercial y cuotas finitas. Se usan únicamente funciones de lectura ligeras y caché HTTP para reducir invocaciones; no se promete disponibilidad ilimitada. Verificación de límites en deployment.md. Git ya existe: preservar historia y maestro. No push automático que pueda disparar un despliegue de Vercel; commits locales recuperables.
