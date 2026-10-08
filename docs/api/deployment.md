# Preparación para Vercel Hobby

No se creó proyecto externo ni se desplegó. La comprobación local confirma compilación/ejecución; no demuestra un despliegue remoto exitoso.

## Compatibilidad y límites consultados — 2026-10-08

Vercel Hobby está limitado a uso personal/no comercial. El catálogo educativo debe respetar ese uso al publicarse. Si el proyecto cambia a una actividad comercial, no asumir que Hobby lo cubre. [Plan Hobby](https://vercel.com/docs/plans/hobby), [términos](https://vercel.com/legal/terms).

Cuotas publicadas: 4 horas de CPU activa, 360 GB-h de memoria aprovisionada y 1 millón de invocaciones incluidas; otras cuotas de solicitudes/transferencia/build también aplican. Alcanzarlas puede suspender funciones hasta renovar la ventana de uso. Consultar Usage antes de publicación y durante operación. No hay garantía de capacidad ilimitada ni se contrata ampliación. [Uso Hobby](https://vercel.com/docs/plans/hobby), [límites generales](https://vercel.com/docs/limits).

Functions Node.js: Hobby hasta 2 GB; bundle descomprimido máximo 250 MB. Duración con Fluid Compute: hasta 300 segundos; sin Fluid Compute: defecto 10 y máximo 60 segundos. Los handlers fijan `maxDuration=10`, suficiente para este catálogo pequeño y conservador en ambos modos. El límite efectivo depende de la configuración vigente del proyecto; comprobar dashboard al crear el despliegue. [Límites de Functions](https://vercel.com/docs/functions/limitations).

Diseño: un Next.js, runtime Node.js, JSON importado e incluido por el bundler, sin escritura en disco durante peticiones, base externa, cron, procesos permanentes ni bibliotecas 3D. Caché de consultas públicas reduce trabajo repetido. Node 24 seleccionado en package engines/CI y contemplado entre versiones disponibles por la [documentación oficial de Node.js en Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions); comprobar configuración efectiva en dashboard al publicar. Comprobaciones locales de archivos y SHA-256 se ejecutan solo en CLI/CI, separadas del validador puro de las rutas.

## Pasos cuando se autorice publicar

1. Revisar condiciones Hobby y propietario del repositorio personal. No cambiar de plan ni contratar servicios.
2. Conectar repositorio/branch a un único proyecto Next.js; root del repositorio, `npm ci`, build `npm run build`, Node 24. No secretos necesarios para esta API.
3. Comprobar que checks de GitHub Actions pasan y `validate:data` no declara activos sin permisos. Vigilar tamaño de funciones; no subir workbench/GLB grandes.
4. Autorizar explícitamente Preview/producción según corresponda. Vincular Git puede activar despliegues automáticos; no hacerlo todavía.
5. Ejecutar smoke real contra URL accesible. Una Preview protegida puede requerir acceso; no eludir protección ni declarar prueba pasada si no se obtuvo JSON válido.

```powershell
$env:API_BASE_URL = 'https://URL-AUTORIZADA.vercel.app'
npm run test:smoke
```

En Bash: `API_BASE_URL=https://URL-AUTORIZADA.vercel.app npm run test:smoke`.

El smoke no despliega, no modifica el catálogo y no requiere secretos. CI solo ejecuta smoke remoto cuando se proporciona URL en workflow_dispatch. La ejecución del workflow remoto y límites efectivos de una cuenta Vercel siguen sin comprobar hasta conectar/publicar con autorización.

## Dependencias

Versiones runtime fijadas: Next.js 16.4.0, React/ReactDOM 19.3.0, Zod 4.6.5; TypeScript y herramientas fijadas en lockfile. ESLint 9.39.5 mantiene compatibilidad con los peers de los plugins Next; npm lo marca deprecated, y migrar a ESLint 10 requiere que esos plugins publiquen compatibilidad. `npm audit --omit=dev` no detectó vulnerabilidades durante instalación. Auditoría completa señala `braces` transitivo de eslint-config-next y sus dependientes (5 avisos altos), sin versión corregida publicada al comprobar. Es una herramienta de lint de desarrollo; no recibe términos de búsqueda de la API. No se aplicó `audit fix --force`, que proponía degradar Next ESLint a otra versión mayor. Revisar actualizaciones antes de desplegar. [Aviso GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).

GitHub Actions usa runners estándar Ubuntu y no contiene despliegue ni servicios pagos. Para repositorios privados rigen cuotas de minutos del plan GitHub: mantener presupuesto de Actions en cero y no habilitar ampliación paga. La ejecución remota del workflow aún no se realizó; los mismos comandos se comprobaron localmente.
