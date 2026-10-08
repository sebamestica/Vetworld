# Pruebas del backend

Desde la raíz y Node.js 24, ejecutar `npm ci`. El lockfile fija las dependencias; no hay servicios de pruebas de pago.

```powershell
npm run typecheck
npm run lint
npm run validate:data
npm run test
npm run test:integration
npm run test:contracts
npm run build
```

Integración y contratos arrancan una instancia Next de desarrollo en un puerto local libre y la cierran al terminar. En Windows se termina únicamente el árbol del PID iniciado por la prueba; no se buscan ni terminan otros servidores. Las pruebas realizan peticiones HTTP con timeout y comprueban JSON, filtros combinados, paginación, errores 400/404, métodos rechazados 405, HEAD y OPTIONS. Los fallos internos se prueban mediante inyección en pruebas unitarias y mediante peticiones HTTP reales a un adaptador Node temporal del mismo handler: lectura fallida y respuesta inválida deben producir 500 sin filtrar errores internos. Estos dos casos no atraviesan Next; no existe un endpoint público para provocar fallos.

Los contratos validan cada respuesta mediante Zod. Además comparan el esquema del código con `docs/api/openapi.json`, una base pública versionada: cambiar un esquema sin actualizar el contrato publicado falla. No regenerar OpenAPI como parte de CI antes de esa comparación. La actualización intencional del contrato requiere revisar el diff, compatibilidad y versión. No se pretende afirmar que cualquier cambio de contenido sea un cambio incompatible de API.

Para probar desarrollo, ejecutar `npm run dev` en una terminal y en otra:

```powershell
$env:API_BASE_URL = 'http://127.0.0.1:3000'
npm run test:smoke
```

Para probar producción local, cerrar desarrollo y ejecutar `npm run build` y `npm run start`; después ejecutar el mismo smoke. Este script no arranca el servidor y registra endpoint, código recibido/esperado, error, resultado de validación y total real. Un error HTTP, timeout, redirección, JSON incorrecto o contrato inválido termina con código distinto de cero.

También hay comandos reproducibles que arrancan y cierran automáticamente su propia instancia en puerto libre. No requieren un servidor previo y no modifican `API_BASE_URL` de la terminal:

```powershell
npm run test:smoke:local
npm run build
npm run test:smoke:production
```

El smoke de producción usa `next start` y requiere un build previo; no compila implícitamente. Se pueden ejecutar integración y contratos sobre ese mismo modo de producción, con servidores separados y cerrados después de cada conjunto:

```powershell
npm run build
$env:API_TEST_MODE = 'production'
npm run test:integration
npm run test:contracts
Remove-Item Env:API_TEST_MODE
```

Sin `API_TEST_MODE=production`, ambos conjuntos usan desarrollo. Evitar ejecutar build, desarrollo y pruebas de producción simultáneamente en esta misma carpeta: comparten artefactos Next.

Después de autorizar un despliegue, se puede sustituir `API_BASE_URL` por su URL HTTPS Preview accesible o producción. Una Preview protegida puede rechazar solicitudes; ese resultado es un fallo de acceso, no una prueba superada. No se incorpora ningún secreto ni se prueba remotamente por defecto. El workflow GitHub Actions ejecuta instalación reproducible, tipos, lint, integridad del catálogo, unitarias, integración, contratos y build. Su ejecución manual permite una URL opcional para smoke remoto sin desplegar nada.

Las fixtures sintéticas, cuando se utilicen, pertenecen exclusivamente a `tests/fixtures`; nunca se publican como catálogo científico. Los datos reales permanecen pendientes de revisión humana aunque pasen validación estructural y referencial.
