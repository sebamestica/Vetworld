# Integración fiel de UI V2

Autorización explícita: migrar `atlas_veterinario_ui_v2.html` a React manteniendo su diseño y archivo intactos. Esta especificación sigue el diseño ya aprobado; no solicita una reinterpretación ni añade datos científicos.

Se auditó el HTML completo: paleta/algoritmo de color, navegación, menú de capas/vistas/ajustes, panel con tres tabs, buscador global/teclado/voz, controles inferiores y orientación. El SVG ilustrativo y el diccionario ficticio no pasan al catálogo; se conserva el Canvas funcional de fase 2, con rótulo mínimo de fixture provisional.

Componentes: AppShell/Topbar/orientación, ToolsPanel, GlobalSearch/VoiceSearch, StructurePanel/ReferenceGallery y AnatomyViewer existente. Hooks para contexto anatómico y ajustes. CSS Modules con variables de tema comunes; no scripts globales ni HTML arbitrario. Iconografía Lucide sin sistema visual adicional.

Catálogo real por API; regiones filtradas por especie, modelos consultados por región y selección por IDs/mappings. Búsqueda global usa `/api/v1/search` sin filtrar especie, agrega similitud acotada en servicio existente sin alterar contratos. Debounce y abort. Panel conserva contenido original en español y latín; i18n solo controles y avisos, con aviso sobre traducción científica pendiente.

Theme/persistencia local validada, todos los planos UI contrastados; fondo de escena oscuro y exposición 3D ajustada, sin filtros CSS sobre el Canvas. Calidad modifica DPR/sombras/antialias donde sea viable; no inventar LOD inexistente. Presets y zoom actúan sobre cámara; clipping usa planos reales y avisa ausencia de tejidos internos. Fixture cartesiana no acredita orientación anatómica de un espécimen.

Voz: permiso solo después de acción explícita y aviso de posible procesamiento del navegador fuera del equipo; transcripción editable, sin selección automática ni almacenamiento de grabaciones. Siempre búsqueda escrita disponible.

Agentes independientes: herramientas/tema/i18n, controles/render de visor, búsqueda/voz. Coordinador: shell, API, panel, captura comparativa, integración y QA. No editar archivos ajenos entre agentes ni recrear funcionalidad aprobada.

Validación: suites backend conservadas, unitarias nuevas, E2E producción con menú/búsqueda/panel/ajustes/persistencia/i18n/cámara/cortes y errores; comparar capturas a tamaños iguales con el HTML local. No publicación y no afirmaciones de anatomía o medios ausentes.
