---
name: realistic-anatomical-rendering
description: Preparar e inspeccionar renderizado Three.js y React Three Fiber del atlas, con formas legibles, materiales sobrios, selección y capas sin introducir detalles anatómicos ficticios.
---

# Renderizado anatómico

Activar al crear o ajustar escenas, cámara, iluminación, materiales y selección del visor. Consultar el manifiesto del activo y `docs/phase2/design.md` antes de atribuir precisión.

- Trabajar en metros y conservar escala/orientación documentadas. Un centrado de cámara no justifica modificar proporciones de la geometría.
- Usar luz hemisférica/área direccional razonable, tone mapping y materiales PBR mates. No sintetizar fibras, inserciones ni textura histológica. El resaltado debe complementar forma y texto, no ser la única identificación de tejido.
- Selección por mapping explícito, sin inferir identidad del nombre de nodo. Mallas ocultas no reciben selección. Transparencias deben conservar legibilidad y orden; aislamiento no cambia el dato científico.
- Demand rendering, DPR acotado, presupuestos de bytes/triángulos y liberación de recursos. No incorporar postprocesado pesado sin medición que lo justifique.
- Gestionar errores GLB/WebGL y pérdida de contexto; mantener acceso a fichas mediante lista. Una fixture propia permanece «Demostración técnica», separada de modelos científicos.

Verificar: captura real del Canvas, selección/mapeo, ocultamiento, aislamiento/transparencia/reset, ausencia de errores de consola y fallback. Documentar equipo/renderizador, peso y límites; no afirmar revisión anatómica a partir de una captura.
