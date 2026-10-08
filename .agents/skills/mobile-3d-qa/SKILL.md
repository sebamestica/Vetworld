---
name: mobile-3d-qa
description: Comprobar selección táctil, accesibilidad y rendimiento del visor Three.js del Atlas Veterinario 3D en móvil y escritorio.
---

# QA móvil del visor

Activar al modificar controles, layout o calidad gráfica. Probar giro con un dedo, zoom con dos/paneo, selección de estructuras pequeñas y panel inferior cerrable; usar presets de DPR/calidad en vez de eliminar detalle científico indiscriminadamente. Ante pérdida de contexto WebGL, ofrecer recuperación y ficha textual. Memoria estimada no equivale a una medición GPU.

Consultar `docs/roadmap.md` y `docs/PROGRESO.md` desde la raíz para conocer fase y pruebas disponibles. No instalar herramientas por ejecutar esta skill.

1. Revisar carga diferida y alternativas textuales ante WebGL ausente, error de descarga o contexto perdido. Comprobar que la ficha puede consultarse sin depender exclusivamente del lienzo.
2. Probar toque/clic, rotación, zoom, scroll de ficha, restablecimiento, aislamiento y ocultamiento según funciones existentes. Una malla oculta no debe seleccionarse; un cambio de especie no debe conservar datos ajenos.
3. Revisar 375, 390, 768 px y escritorio, teclado, foco y controles accesibles. Distinguir emulación de pruebas en Safari iPhone/Android y equipos reales; no afirmar estas últimas si no se ejecutaron.
4. Medir peso de GLB y rendimiento solo con herramientas/equipo identificados; registrar fallos, sin cifras estimadas presentadas como mediciones.
5. Ejecutar build, lint, typecheck y pruebas pertinentes existentes. Si una comprobación no está disponible, explicitarla en lugar de declarar éxito.
6. Documentar escenario, resultado, evidencia y limitaciones en progreso. Proponer optimizaciones según problemas observados, evitando dependencias innecesarias.
