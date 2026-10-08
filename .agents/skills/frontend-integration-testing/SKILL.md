---
name: frontend-integration-testing
description: Verificar recorridos del atlas desde Canvas y selección hasta fichas de API y referencias, reutilizando Vitest y Playwright con backend local real y emulación responsive explícita.
---

# Integración del frontend

Activar al integrar o cambiar visor, fichas, galería o navegación. Leer `docs/PROGRESO.md` y reutilizar contratos/suites de fase 1, además de mobile-3d-qa para móvil. No crear una suite duplicada de checks ya existentes.

- Unidad: mapping, selección, aislamiento, visibilidad, transparencias y parsers/URLs. Fixtures sintéticas únicamente en tests o modo técnico explícito, separadas del catálogo científico.
- Interacción: comprobar selección → petición API → ficha correcta, cambios de especie/región sin datos anteriores, referencias por licencia y error/vacío. Abortar respuestas obsoletas y verificar que errores no se convierten en éxito.
- Playwright: usar servidor local propio, backend real, Canvas y clic/toque de malla cuando WebGL esté disponible. Documentar un recorrido completo y capturas; probar fallos GLB, imágenes y contexto WebGL con mocks controlados del recurso, no de toda la API.
- Comprobar desktop/tablet/móvil, overflow, foco/teclado, panel expandible/cerrable y controles táctiles. Diferenciar emulación de dispositivos físicos.
- Ejecutar lint, tipos, validadores, suites antiguas/nuevas, build y pruebas contra producción local. No desplegar para probar y no declarar pruebas remotas no realizadas.

Criterio de entrega: resultados/cifras ejecutados, capturas inspectadas, fallos corregidos o límites documentados, servidores propios cerrados y commit/push del hito autorizado.
