# Progreso — Atlas Veterinario 3D

Actualizado: 2026-10-08. Fases 0 y 1 aprobadas; fase 2 funcional con fixture técnica; UI V2 integrada y comprobada localmente. Activos anatómicos y revisión humana pendientes; aplicación no publicada.

## Estado recuperado

Al retomar, `C:\dev\Vetworld` contenía únicamente el maestro (39.715 bytes), sin `.git`. El registro de la conversación previa confirma investigación completada de dos subagentes `gpt-6-luna` (fuentes y planificación técnica); la documentación quedó sin crear por una restricción de escritura de aquella sesión. Se reutilizaron sus conclusiones registradas, sin reconstruir informes inexistentes en el proyecto ni invocar nuevos agentes.

Registro de origen: sesión local `01a11987-acb3-7ca0-aec8-aa3fe2565307`, 2026-10-08. La documentación del proyecto queda autosuficiente; no requiere acceder nuevamente a ese historial.

## Tareas y evidencia

| Tarea | Responsable / modelo | Dependencia | Estado y evidencia |
|---|---|---|---|
| Investigación inicial de fuentes | Subagente previo / gpt-6-luna | Maestro | Completada según registro previo; límites persistidos en FUENTES_ANATOMICAS.md |
| Planificación técnica inicial | Subagente previo / gpt-6-luna | Maestro | Completada según registro previo; integrada en architecture.md y roadmap.md |
| Auditoría y entorno | Coordinador actual / modelo de esta sesión | Carpeta actual | Node v24.13.1, npm 11.8.0, Git 2.52.0.windows.1; sin repositorio inicializado |
| Verificación alternativa de cráneos | Coordinador actual | Evidencia previa | Búsquedas indexadas por título/autor corroboran candidatos; ninguna apertura 403 repetida |
| Reglas y seguimiento | Coordinador actual | Resultados recuperados | AGENTS.md y seis documentos docs creados |
| Skills locales | Coordinador actual / skill-creator | Sección 8 del maestro | Tres SKILL.md creados con nombre/descripción YAML |
| Comprobación final | Coordinador actual | Archivos creados | 10 archivos no vacíos; todos los enlaces Markdown locales resuelven; tres encabezados de skills comprobados con PowerShell |

Al cerrar la documentación no se asignó ni verificó un modelo avanzado nuevo. No hubo instalaciones, scaffold, código de aplicación, modelos descargados, inicialización Git ni publicación en esa etapa.

Solicitud adicional del usuario (2026-10-08): subir estos archivos a `https://github.com/sebamestica/Vetworld.git`. Consulta HTTPS del remoto exitosa, sin referencias existentes; se autoriza inicialización local y envío de la documentación en `main`, sin avanzar a fase 1 ni desplegar la web.

Verificación ejecutada: inventario/tamaño y enlaces locales mediante PowerShell; ausencia de `package.json`, `node_modules`, `src`, `.git`, `public` y `workbench`. El validador oficial `quick_validate.py` no pudo ejecutarse por `ModuleNotFoundError: yaml` (PyYAML ausente). No se instaló: se comprobó alternativamente el subconjunto YAML utilizado (dos campos escalares), nombre igual al directorio, caracteres/longitudes admitidos, descripción y ausencia de scaffolds incompletos. Esta comprobación no sustituye una prueba de comportamiento de las skills. No aplica build/lint de aplicación en fase 0.

## Pendientes y riesgos

- Formato, versión de licencia, archivo real, nodos y escala de los cráneos pendientes. Ambos siguen como candidatos, no publicables.
- Disponibilidad legal de músculos individualizados y revisión humana aún no resueltas; no bloquean demo técnica de fase 1.
- No hay mediciones de rendimiento, pruebas en dispositivos ni validación científica realizadas.
- Compatibilidad exacta de versiones y fixture técnico se comprobarán al comenzar fase 1, tras autorización.

## Fase 1 autorizada — backend

El usuario redefinió fase 1: API REST de lectura Next.js/Zod, catálogo JSON, Vitest, validador de integridad, CI y producción local. Visor/UI completa y despliegue público excluidos. [Diseño y secuencia](api/design.md). Commits locales por hitos comprobados.

Trabajo independiente: agente `domain` (esquemas, fuentes/semilla y validación), agente `services` (repositorio/servicios/búsqueda), agente `http_tests` (HTTP real, contratos, smoke y CI); coordinador (inicialización, contratos HTTP, rutas, integración y documentación). Modelos heredados de esta sesión; no se seleccionaron ni afirmaron modelos económicos o tarifas. Resultados reales registrados a continuación.

### Entrega y resultados reales

Implementados: Next.js App Router/Node.js, TypeScript estricto, Zod, repositorio JSON con snapshot aislado, servicios y búsqueda local, 16 operaciones GET documentadas, contratos OpenAPI 3.1 y errores consistentes. Regiones/capas no afirman cobertura o profundidad que no está documentada. Sin escritura ni procesamiento de activos en peticiones; SHA-256/archivos únicamente en CLI/CI.

Catálogo real: 2 especies (`canine`, `feline`), 9 regiones, 8 estructuras, 6 relaciones, 1 referencia universitaria, 2 modelos candidatos pendientes y 0 modelos disponibles. Todas las fichas son parciales y `review.status=pending`; no hay estructuras con revisión humana `validated`. [Evidencia científica](api/scientific-seed.md).

| Comprobación ejecutada | Resultado |
|---|---|
| `npm ci` | Instalación reproducible completada; aviso de deprecación ESLint 9 documentado |
| `npm run lint` | Aprobado, sin errores |
| `npm run typecheck` | Aprobado, incluidos tipos generados de rutas Next |
| `npm run validate:data` | 0 errores, 18 advertencias explícitas (8 fichas parciales + 8 revisión pendiente + 2 modelos pendientes) |
| `npm run test` | 38/38 pruebas, 4 archivos |
| `npm run test:integration` | 59/59, 2 archivos; también ejecutadas contra producción local |
| `npm run test:contracts` | 35/35; HTTP real y baseline OpenAPI, también contra producción local |
| `npm run test:smoke:local` | 18/18 peticiones correctas contra `next dev` propio |
| `npm run build` | Producción compilada, sin errores ni avisos de rastreo dinámico de archivos |
| `npm run test:smoke:production` | 18/18 peticiones correctas contra `next start` del build final |
| `npm audit --omit=dev` | 0 vulnerabilidades reportadas |
| Integridad del maestro | SHA-256 conservado: `C4EF42D2CC1456D8F78B14D9705E8032470051EDE52A8D568ECACDB23EE27197` |

Las 59 pruebas de integración incluyen 57 sobre Next.js y dos fallos 500 inducidos por HTTP contra un adaptador temporal del mismo handler (lectura fallida/salida inválida), sin endpoint de fallos en producción. Las suites cierran sus propios servidores. Fixtures sintéticas se limitan a pruebas y se eliminan después; no se incorporan al catálogo científico.

El build inicial detectó incompatibilidad de contexto en rutas estáticas y rastreo de filesystem por el validador de activos: ambos corregidos antes del build final. El trace local mayor de las rutas enumera 122 archivos y 1.948.482 bytes; es una medición local de dependencias trazadas, no del bundle final de Vercel.

GitHub Actions configurado para npm ci, tipos, lint, integridad, unidad, integración, contratos y build; smoke remoto manual opcional. Workflow remoto **no ejecutado**. Vercel Preview/producción **no desplegados ni probados**. Compatibilidad prevista con Hobby y límites oficiales documentados en [deployment.md](api/deployment.md).

### Commits y pendientes

Commits locales por hitos: `b44200e` diseño autorizado, `ec7af94` scaffold/herramientas, `529ef94` dominio/datos/servicios, `c8bce2f` API/contratos, `5a1db03` capas independientes y `83af881` pruebas/CI. Consultar `git log --oneline` para el cierre documental. No se hizo push de fase 1 ni se vinculó Vercel: enviar cambios a un repositorio conectado podría disparar despliegues no autorizados.

Pendientes: revisión veterinaria humana/NAV; adquisición y derechos completos de modelos; contenido anatómico adicional y campos opcionales; frontend/visor en una fase posterior autorizada; publicación y smoke remoto. Auditoría completa mantiene cinco avisos altos transitivos de desarrollo por `braces`, sin parche publicado al consultar. ESLint 9 es compatible con los plugins instalados, pero deprecated; actualizar conjuntamente cuando sea viable. No hay un fallo funcional local pendiente ni un servicio pago contratado.

Para continuar: revisar [API y ejemplos](api/README.md), [pruebas](api/testing.md) y [despliegue futuro](api/deployment.md). El frontend podrá consumir especies, regiones, fichas/relaciones, búsqueda, capas, licencias y manifiestos con disponibilidad real. No se autoriza automáticamente implementar la siguiente fase.

## Cierre de fase 2

Visor R3F/Three.js con GLB propio técnico, raycasting/mapping, resaltado, órbita/zoom/paneo, capas/opacidad/aislamiento, reset y recuperación WebGL. Fichas y relaciones reales de API, galería segura y cuatro enlaces académicos curados. Cero modelos científicos y cero fotografías internas autorizadas. [Entrega y capturas](phase2/README.md).

Resultados locales ejecutados: lint/tipos/build aprobados; unidad 75/75, integración HTTP 69/69, contratos 38/38, Playwright 21/21 (desktop/tablet/teléfono emulados), smoke de producción 18/18. Validadores de catálogo (0 errores/18 advertencias), referencias (4 externas/0 internas) y GLB/mappings aprobados. Skills: tres existentes ampliadas y tres nuevas; validador oficial no pudo ejecutarse por falta de PyYAML, comprobación alternativa de encabezados aplicada a seis skills.

Commits/push: `2b8bb02` preparación, `1294d9b` implementación y `38bdea3` incluye el GLB omitido en el commit anterior. CI `37776082982` falló en validate:viewer por esa omisión; corregido y [CI 37776169180](https://github.com/sebamestica/Vetworld/actions/runs/37776169180) completó success sobre `38bdea3`. No hay despliegue Vercel. Capturas desktop/móvil inspeccionadas; no se probaron teléfonos físicos ni se midieron FPS/GPU total. Fixture: 55.732 bytes, 2.572 triángulos, buffers estimados 52.512 bytes.

## Integración del HTML aprobado UI V2

Referencia recibida: `atlas_veterinario_ui_v2.html`; SHA-256 inicial `2412B2DF1DCCDD76821A7E663C7B7921152B769B0D4112792FFDFFD597A650BB`. Conservar íntegro. Migrar diseño grafito, búsqueda superior, menú flotante, panel translúcido y ajustes a React; no copiar diccionario anatómico ni SVG ilustrativo del boceto como anatomía real. Reutilizar API y visor existentes. Añadir búsqueda aproximada/voz nativa, preferencias locales/contraste/i18n, presets/clipping reales y QA comparativa. Sin publicación; commits y push autorizados por hitos.

### Resultado UI V2

Implementados AppShell/Topbar/orientación, menú flotante con capas/vistas/ajustes, panel contextual con pestañas y datos reales, búsqueda global con similitud acotada/abort/debounce, voz nativa con aviso y activación explícita, temas por variables/contraste, persistencia local, ES/EN de interfaz y tipografía. Renderer reutilizado: presets/zoom/clipping efectivos sobre fixture, exposición, DPR y calidad real de sombras/antialias. No se importó el diccionario o SVG anatómico ficticio del HTML. Archivo original conservó el SHA-256 indicado.

Verificaciones nuevas: lint, TypeScript y build aprobados; 99/99 unitarias, 69/69 HTTP, 38/38 contratos; validadores de datos/medios/GLB aprobados; auditoría runtime 0 vulnerabilidades. E2E general ejecutó 33/36 aprobadas y detectó tres errores de recorrido en móviles (selector de región dentro de menú y orientación tras reload). Corregidos los recorridos: rerun de cuatro casos tablet/móvil aprobado 4/4; cobertura final de las 36 combinaciones aprobada entre ambas ejecuciones. No se presenta la primera corrida con fallos como aprobada. Capturas de referencia HTML y resultado en [UI V2](ui-v2/README.md).

Se corrigieron dos fallos reales detectados por navegador: aviso de listo antes del primer frame y falsa pérdida de WebGL al cambiar calidad por desmontaje intencional. Selección sobre Canvas, temas, persistencia, clipping, galerías y navegación volvieron a pasar. Voz se verificó con pruebas sintéticas y fallback; no se grabó audio real ni se probaron teléfonos físicos.

Pendientes científicos: cero mallas anatómicas aprobadas, cero fotografías internas; las fichas siguen parciales/revisión humana pendiente. Presets/cortes usan ejes cartesianos de la fixture, no acreditan planos de un animal real. Archivo GLB técnico y cuatro referencias académicas conservados. No despliegue público.

## Fase 3: Adquisición e Integración de Anatomía 3D Real

Objetivo: Adquisición, procesamiento 3D headless, validación científica e integración de modelos anatómicos tridimensionales caninos y felinos reales, conservando intacto el frontend UI V2 aprobado.

### Estado del Cuerpo Completo Canino vs. Segmentación Regional Rigurosa
- En repositorios anatómicos abiertos (Z-Anatomy, MorphoSource, Sketchfab), no existe un espécimen canino completo escaneado con despiece individualizado de músculos, nervios y vísceras bajo licencia abierta directa en un solo archivo volumétrico.
- Conforme a la regla de oro del proyecto (*«Nunca inventar anatomía»* y *«No mezclar cráneos ni escalarlos arbitrariamente para hacerlos coincidir con un esqueleto de otro espécimen»*), el atlas adopta una **arquitectura multi-modelo por región anatómica**:
  - **Extremidad Torácica Canina (`canine:thoracic-limb`):** Integrada con 29 estructuras individualizadas (5 huesos, 18 músculos en planos superficial y profundo, 6 troncos nerviosos).
  - **Otras regiones caninas (Cabeza, Columna/Tórax, Abdomen, Extremidad Pélvica):** Las estructuras están catalogadas con su terminología NAV y relaciones fisiológicas en el backend. Cuando el usuario selecciona una región sin activo 3D adquirido, el visor y panel declaran de forma transparente **«Modelo 3D no disponible»**, en lugar de renderizar mallas fusionadas inexactas o aproximaciones ficticias.
  - El soporte para renderizar cuerpos articulados completos se encuentra diseñado modularmente para montar escenas compuestas conforme se liberen y validen piezas de un mismo espécimen o estándares morfométricos certificados.

### Activos 3D Integrados y Optimizados
1. **Extremidad Torácica Canina (`canine:thoracic-limb-model`):**
   - Fuente: *TomasArguello / InNervateVR* (`assets-source/canine/thoracicLimb_bonesSeparated.fbx`).
   - Binario: `public/anatomy/canine/skeleton/thoracic-limb.glb` (7.965.716 bytes, 82.525 triángulos, GPU ~7,55 MB).
   - 29 nodos mapeados a estructuras NAV caninas individuales.
2. **Extremidad Torácica Felina (`feline:thoracic-limb-model`):**
   - Fuente: *ezrahmae / 3D-Cat-Anatomy* (7 escaneos óseos independientes ensamblados).
   - Binario: `public/anatomy/feline/skeleton/thoracic-limb.glb` (4.071.588 bytes, 52.104 triángulos, GPU ~3,87 MB).
   - 7 nodos óseos articulados individualmente seleccionables.
3. **Cráneo y Mandíbula Felinos (`feline:skull-model`):**
   - Fuente: *ezrahmae / 3D-Cat-Anatomy* (Cráneo, mandíbula y dentición carnívora).
   - Binario: `public/anatomy/feline/skeleton/skull.glb` (5.319.424 bytes, 64.496 triángulos, GPU ~5,07 MB).
   - 3 nodos óseos individualizados.

### Pipeline Automatizado en `scripts/anatomy/`
- `inspect-assets.ts`: Auditoría binaria de cabeceras glTF/GLB, buffers, vértices y cómputo de GPU estimada.
- `convert-assets.ts`: Conversor y ensamblador headless Three.js en Node.js con polyfill de `FileReader`, escala métrica y materiales PBR sobrios.
- `reconcile-structures.ts`: Conciliación automática de identificadores con el catálogo, terminología NAV y reciprocidad.
- `validate-assets.ts`: Validador integral de hashes SHA-256, tamaños, límites poligonales y licencias.
- `build-search-index.ts`: Reconstrucción determinista del índice de búsqueda en `data/anatomy/search-index.json`.

### Verificaciones Ejecutadas
- `npm run validate:data`: 0 errores, 88 advertencias controladas de revisión pendiente.
- `npm run validate:viewer`: 5/5 modelos aprobados (3 científicos + 2 demos técnicos).
- `npm run anatomy:validate`: APROBADO (199.125 triángulos totales, 16,50 MB VRAM estimada).
- `npm test`: 14 suites pasadas, 99/99 pruebas unitarias aprobadas.
- `npm run test:integration`: 3 suites pasadas, 69/69 pruebas HTTP reales aprobadas.
- `npm run test:contracts`: 2 suites pasadas, 38/38 contratos OpenAPI aprobados.
- `npm run test:smoke`: 18/18 endpoints HTTP aprobados.
- `npm run typecheck`: 0 errores TypeScript.
- `npm run lint`: 0 errores, 0 advertencias ESLint.
- `npm run build`: Compilación de producción Next.js exitosa.


## Fase 3 — continuación auditada, 2026-10-08

Estado: EN CURSO / construcción bloqueada por geometría autorizada y espécimen. No existen todavía dos esqueletos completos construidos. Esta actualización corrige las generalizaciones y permisos declarados en la sección anterior: no se ha probado inexistencia universal de modelos completos; los repositorios educativos inspeccionados no contienen una licencia aplicable comprobada para sus activos, y el alojamiento NIH no convierte automáticamente un archivo en dominio público. Los indicadores históricos de licencia y disponibilidad de los catálogos regionales requieren corrección antes de publicar o admitir esas piezas en maestros; no se modificaron silenciosamente los cambios previos del usuario.

Completado: inventarios de referencia canino (335 entradas) y felino (323), dientes de referencia 42/30, jerarquías, componentes fusionados, lateralidad y series variables sin total universal. Todos not_located/pending; no son huesos adquiridos. Generador determinista, esquema Zod y reporte de cobertura por región: cero mallas admitidas y cero huesos ensamblados para ambas especies; conteo específico del espécimen desconocido. Auditoría y candidatos en docs/phase3/source-audit.md y data/osteology/source-candidates.json. Nueva skill skeleton-master-assembly con encabezado/instrucciones inspeccionados; no se ejecutó validador oficial de skills.

Blender portable 4.5.14 LTS descargado de Blender.org: checksum SHA-256 b9533d2397ac1984db4466fb23a7a4649391cca93f6e84209f9bcc60d071c8b9 coincide con archivo oficial. Ambos borradores workbench/masters/drafts/canine_master.blend y feline_master.blend guardados y reabiertos realmente con Blender, unidades métricas, colecciones regionales, cero objetos/mallas. No son maestros anatómicos completos; no hay GLB derivados nuevos ni capturas de animales ensamblados. Herramientas, PDF privado y borradores permanecen fuera de Git.

Verificaciones nuevas: Zod dos inventarios aprobado; 7/7 pruebas nuevas, conjunto unitario 106/106, TypeScript y ESLint de archivos nuevos aprobados. No se volvieron a ejecutar HTTP, contratos, build, smoke o pruebas visuales en este hito; sus resultados anteriores son históricos. No cambió frontend, API ni HTML aprobado.

Bloqueos: canino completo LMU sin descarga/licencia comprobada; felino completo Tavernier BY-NC-SA 4.0 con descarga oficial HTTP 401 sin credenciales. No evasión ni nuevas peticiones a páginas con 403. Faltan archivo autorizado, espécimen/escala, segmentación e identificación y revisión humana. Los inventarios aún necesitan cotejo de cantidades osteológicas y variantes; NAV aporta nomenclatura, no certificación de presencia. Pendientes: admisión geométrica, ensamblajes completos, correspondencias definitivas, exportación y flujo de selección de ambos animales. Ver docs/phase3/master-pipeline.md. No despliegue ni publicación de activos nuevos.
### Recepción e inspección de modelos del usuario — 2026-10-08

Se organizaron seis archivos en workbench/incoming/canine/originals y feline/originals, conservando hashes. ZIP felino: Chat.glb + textura, una malla y 74.235 triángulos; no huesos separados. RAR canino: cuatro STL idénticos a los sueltos, 179.590 triángulos importados, sin unidades/licencia. Importador retiró 3 triángulos degenerados y 220 duplicados solo de copias de trabajo. Candidatos Blender con geometría guardados/reabiertos en workbench/masters/candidates; canino mantiene cuatro piezas en coordenadas originales no articuladas; felino conjunto de una malla fragmentada, revisión pendiente. Escala no verificada en ambos; no se inventaron transformaciones ni huesos. Cinco capturas individuales y dos de candidatos renderizadas; vistas de felino, columna canina, miembro torácico y conjunto canino inspeccionadas. Corregido fallo inicial de render por world inexistente y repetido con éxito, usando --python-exit-code 1. Siete pruebas de inventario aprobadas nuevamente. No build/API/UI nuevos ni publicación de activos. Detalles en docs/phase3/user-downloads.md; pendiente URL/licencia canina solicitada al usuario y procedencia exacta del archivo felino. La fase sigue abierta: no hay dos maestros completos individualizados.

Procedencia canina recibida: 3DExport 285869, hidden.art8. Página verificada: no escaneo 3D, modificación para impresión y reflejos descritos por autor. Royalty Free no acredita permiso para publicar archivos extraíbles en visor web/GitHub. Se mantiene privado; pendiente permiso específico y validación científica. Ver docs/phase3/user-downloads.md.


Usuario confirmó procedencia felina Tavernier Amaury: se registró archivo/hash y licencia CC BY-NC-SA 4.0 con atribución y condiciones. Original intacto verificado; desbloqueada trazabilidad para procesamiento felino. Continúan pendientes escala, segmentación, identificación científica e integración; webAvailable=false. Sin nuevas pruebas de aplicación en esta actualización de metadatos.
