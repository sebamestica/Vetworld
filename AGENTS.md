# Atlas Veterinario 3D — reglas de trabajo

- Trabajar únicamente dentro de este proyecto y sobre la fase autorizada. Fase 0: documentación; fase 1 pendiente de autorización expresa. No instalar, implementar, descargar activos ni publicar durante fase 0.
- Para retomar, leer primero [progreso](docs/PROGRESO.md), [roadmap](docs/roadmap.md) y [arquitectura](docs/architecture.md). Consultar solo los apartados pertinentes del [documento maestro](ARQUITECTURA_ATLAS_VETERINARIO_3D_CODEX.md); no releerlo íntegramente en cada turno.
- Mantener documentación en español, nombres latinos y sinónimos, TypeScript estricto y módulos simples. MVP con archivos versionados, sin backend ni servicios adicionales injustificados.
- Nunca inventar anatomía, activos, fuentes, licencias o resultados de pruebas. Separar perro y gato. Cuando falte geometría, indicar «Modelo 3D no disponible».
- Verificar por activo especie, región, autor, URL de página y archivo, formato, licencia/versionado, modificación y redistribución antes de adquisición/publicación. Un catálogo o resultado indexado no concede permisos. Descargar solo con autorización; conservar originales y trazabilidad.
- Mantener `reviewStatus=pending` hasta revisión humana cualificada. La apariencia o una evaluación de IA no validan anatomía.
- Leer las skills locales cuando corresponda: [integridad](.agents/skills/anatomy-integrity/SKILL.md), [pipeline 3D](.agents/skills/3d-asset-pipeline/SKILL.md), [QA móvil](.agents/skills/mobile-3d-qa/SKILL.md).
- Reutilizar evidencias registradas. No repetir solicitudes que dieron HTTP 403: usar búsqueda indexada, metadatos oficiales accesibles o verificación manual autorizada; no eludir barreras.
- Delegar solo tareas independientes cuyo beneficio justifique el costo, con contexto mínimo y archivos asignados. No reinvocar agentes para trabajo completado ni afirmar tarifas/modelos no comprobados.
- Ejecutar verificaciones pertinentes y registrar evidencia, pendientes y bloqueos en `docs/PROGRESO.md`; decisiones en `docs/DECISIONES.md` y fuentes en `docs/FUENTES_ANATOMICAS.md`. No avanzar de fase sin aceptación del usuario.
