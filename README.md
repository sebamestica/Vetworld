# Atlas Veterinario 3D

Estación de estudio canina/felina con visor interactivo, fichas de API y referencias curadas. Backend Next.js App Router, TypeScript estricto, Zod y JSON versionado; visor React Three Fiber/Three.js. Sin base de datos externa, cuentas, claves ni escrituras en runtime. La geometría actual es una **demostración técnica no anatómica**; no representa especímenes ni anatomía validada.

Requisitos: Node.js 24 y npm. Desde la raíz:

```powershell
npm ci
npm run dev
```

Atlas local: `http://localhost:3000`. API: `http://localhost:3000/api/v1/health`. [UI V2 integrada y capturas](docs/ui-v2/README.md), [guía del visor](docs/phase2/README.md), [contratos y ejemplos](docs/api/README.md), [OpenAPI](docs/api/openapi.json), [pruebas](docs/api/testing.md), [despliegue futuro](docs/api/deployment.md), [progreso](docs/PROGRESO.md).

```powershell
npm run lint
npm run typecheck
npm run validate:data
npm run validate:media
npm run validate:viewer
npm run test
npm run test:integration
npm run test:contracts
npm run build
npx playwright install chromium
npm run test:e2e
npm run start
```

`test:integration` y `test:contracts` arrancan y cierran su propia instancia de desarrollo con puerto libre. Ejecutarlos secuencialmente; no iniciar otro `next dev` sobre la misma carpeta mientras corren. Para smoke, mantener el servidor iniciado y usar otra terminal:

```powershell
$env:API_BASE_URL = 'http://127.0.0.1:3000'
npm run test:smoke
```

También se puede ejecutar `npm run test:smoke:local` sin iniciar un servidor: lo arranca y cierra automáticamente. Tras `npm run build`, `npm run test:smoke:production` hace lo mismo con `next start`. El smoke configurable por `API_BASE_URL` permanece disponible para servidores ya iniciados o URLs autorizadas.

La semilla contiene 2 especies, 9 regiones, 8 estructuras y 6 relaciones bibliográficas; revisión veterinaria humana pendiente. Modelos científicos: 2 candidatos, 0 archivos disponibles. Hay 1 GLB técnico propio con 2 manifiestos por especie y 4 asociaciones académicas externas, sin fotografías internas autorizadas. La completitud de una ficha no certifica cobertura de la región ni exactitud revisada. [Evidencia y límites científicos](docs/api/scientific-seed.md).

Los datos cambian en `data/anatomy/*.json`; actualizar `metadata.json`, validar y hacer commit. No agregar fotografías ni geometría hasta verificar derechos, archivo y revisión. No desplegar públicamente sin autorización.
