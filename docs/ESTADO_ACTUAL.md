# Vetworld — Estado actual

Actualizado: 2026-10-31 · Rama `main` · Base `c441491`. Este archivo resume y **no sustituye** a [PROGRESO.md](PROGRESO.md), que conserva la evidencia completa. La versión anterior (2026-10-08) describía tres modelos regionales integrados; eso fue corregido el mismo día al retirar activos con permisos no comprobados (ver PROGRESO, «Fase 3 — continuación auditada» e «Integración corporal felina»).

## Fase

Fase 3 abierta (esqueletos maestros y despiece). Plan de ejecución vigente: [plandeimplementacion.md](../plandeimplementacion.md).

## Estado funcional

- API REST v1 (Route Handlers, Zod, JSON versionado), OpenAPI 1.3.0, datos `2026-10-10.1`.
- UI V2 migrada (HTML aprobado intacto, SHA-256 `2412b2df…650bb`).
- Visor: felino «Todo el animal» con GLB Tavernier (CC BY-NC-SA 4.0, atribución visible), una malla, 74.235 triángulos, sin piezas científicas seleccionables. Canino: «Modelo 3D no disponible». Fixture técnica en `/technical-demo`.
- Catálogo: 46 estructuras, todas `reviewStatus=pending`; cuatro fichas felinas con evidencia por campo (escápula, húmero, fémur, tibia).
- Piloto privado de superficies felinas (húmero 350, fémur 369, tibia 562 caras) en `workbench/`, no publicado.

## Bloqueos externos

Revisión humana cualificada; licencia web del canino 3DExport 285869; medidas del espécimen Tavernier; autorización para descargar volúmenes CT (51 GB); despliegue público.

## Entorno

`node_modules` está instalado para Windows: desde WSL ejecutar comandos npm con `scripts/qa/win.sh npm run -s <script>`. Blender portable: `.tools/blender-4.5.14/blender-4.5.14-windows-x64/blender.exe` (verificado 4.5.14 LTS el 2026-10-31).
