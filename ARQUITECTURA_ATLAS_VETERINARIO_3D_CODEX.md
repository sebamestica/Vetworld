# Atlas Veterinario 3D — Arquitectura maestra para Codex

**Documento:** `ARQUITECTURA_ATLAS_VETERINARIO_3D_CODEX.md`  
**Estado:** planificación; **no iniciar la implementación completa sin aprobar la primera fase**.  
**Alcance:** anatomía macroscópica **canina y felina**, inicialmente osteología y miología; extensible a tendones, ligamentos, fascias, nervios, vasos y órganos.  
**Despliegue:** web adaptable a teléfonos y computadores, alojada en **Vercel**.  
**Prioridad:** exactitud científica y trazabilidad de cada estructura > apariencia de la interfaz.  
**Directorio de trabajo:** lo proporciona el usuario a Codex. No asumir una ruta local ni modificar archivos externos.

---

## 0. Instrucciones obligatorias para Codex

1. Leer este documento completo, inspeccionar el directorio que indique el usuario y **presentar primero**: árbol propuesto, plan de fase 0, riesgos, fuentes de datos y decisiones pendientes. Ejecutar **solo la fase autorizada**.
2. No implementar funcionalidades masivamente en un único turno. Trabajar por fases cerradas con revisión, pruebas y aceptación del usuario.
3. Antes de descargar cualquier activo, verificar **URL real, formato, especie, región anatómica, autor, licencia, posibilidad de modificación y redistribución pública**, y si realmente contiene estructuras individuales. Una URL a un repositorio o página de catálogo **no es una URL directa a un archivo**. No inventar descargas ni datos.
4. **Nunca confundir precisión visual con precisión anatómica.** No inventar músculos, tendones, ligamentos, orígenes, inserciones, trayectos o inervaciones. No asignar anatomía humana a especies veterinarias sin una validación específica.
5. Si no existe modelo validado de cierta estructura, mostrar **«Modelo 3D no disponible»**, con información bibliográfica si está verificada. No crear un músculo ficticio para llenar el vacío.
6. No copiar fotografías, modelos 3D, fichas ni contenidos textuales de atlas comerciales o institucionales si la licencia no autoriza expresamente la reutilización. Enlazar a la fuente no equivale a permiso de redistribución.
7. Código sencillo, legible y modular. No introducir microservicios, GraphQL, CMS, Redux, Kubernetes, motor de simulación, autenticación o IA generativa sin requerimiento y justificación.
8. Integrar progresivamente contenido real de **Canis lupus familiaris** y **Felis catus**; no tratar especies como simples variantes del mismo modelo.
9. Cualquier intervención de anatomía precisa requiere comprobación contra bibliografía veterinaria y, para publicación académica de calidad, **revisión humana por docente/profesional cualificado**. No marcar «validado» solo porque lo dijo un modelo de IA.
10. Documentar en español; nombres anatómicos latinos y sinónimos conservados. Usar TypeScript estricto. Mantener comandos y modificaciones reproducibles.

## 1. Resultado deseado

Un sitio educativo que permita:

- Elegir **perro / gato**, región corporal (cabeza, cuello, tronco, miembro torácico, miembro pélvico) y sistema anatómico.
- Rotar, ampliar y desplazar un **modelo 3D real**, seleccionar una estructura concreta por toque/clic y resaltarla.
- Ocultar / mostrar **huesos, músculos superficiales, músculos profundos, tendones, ligamentos y fascias** de modo independiente **solo cuando exista geometría de esa categoría**.
- Aplicar **aislar**, transparencia, restablecer vista, búsqueda y un modo «sin etiquetas» para autoevaluación.
- Consultar al tocar cada estructura una **ficha anatómica detallada**, bien adaptada a pantallas pequeñas.
- Abrir una referencia de disección/imagen real relacionada, con permisos válidos y trazabilidad.
- Conocer en todo momento **qué estructuras sí existen en 3D, cuáles son aproximaciones y cuáles no están disponibles**.

### Qué significa «realismo» aquí

**Geometría:** silueta, puntos de origen/inserción, orientación de fibras, relaciones espaciales y capas deben ser anatómicamente defendibles.  
**Materiales:** hueso, músculo, fascia, tendón y ligamento deben diferenciarse mediante materiales PBR, color, rugosidad y mapas normales cuando estén disponibles. **Una textura rojiza no demuestra que la segmentación sea correcta.**  
**Evidencia:** distinguir `escaneo_real`, `segmentación_imagen`, `reconstrucción_revisada`, `modelo_ilustrativo`, y **no atribuir precisión de disección a un modelo ilustrativo**.  
**Tejido fino:** tendones, ligamentos, nervios y fascias no se deducen automáticamente de una TC convencional; podrían requerir disecciones, RM, segmentación/manualización y revisión especializada.  
**Visualización:** conservar fotografías anatómicas reales como respaldo opcional, porque un 3D no captura por sí solo todas las características de textura de una preparación real.

## 2. Arquitectura tecnológica, deliberadamente simple

| Capa | Selección | Justificación |
|---|---|---|
| Web y rutas | **Next.js + App Router + TypeScript** | Una aplicación única, despliegue sencillo en Vercel. |
| Visualizador | **Three.js + @react-three/fiber + @react-three/drei** | GLB/glTF, raycasting/picking, controles de cámara, capas y materiales. |
| Estilos | **CSS Modules + CSS global** | Evitar un sistema visual o dependencias grandes innecesarias. |
| Estado UI | **React state/context local** | Suficiente para especie, selección, capas y filtros. Evitar store global hasta comprobar necesidad. |
| Validación datos | **Zod** (si aporta valor) | Comprobar fichas, rutas de recursos, licencias y vínculos de meshes. |
| Datos MVP | **JSON/TS versionados en Git** | No requiere base de datos ni API de lectura para contenido inicialmente curado. |
| Objetos 3D MVP | `/public/models/` para archivos pequeños con permiso | Fácil de probar; no subir archivos grandes al repo. |
| Objetos grandes | **Vercel Blob público o almacenamiento S3/R2** *más adelante* | Escalado opcional para GLB, fotografías y variantes de resolución. Los modelos públicos deben tener derecho de distribución. |
| Procesamiento científico (fuera del navegador) | **3D Slicer / Blender / glTF Transform** | Segmentación, limpieza, separación de objetos, LOD, compresión y conversión. |
| Pruebas | **Vitest**, y **Playwright** para un recorrido básico si se necesita | Mantener pocas pruebas, pero cubrir integridad de datos e interacciones. |
| Hosting | **Vercel** | Publicación automática desde Git; la GPU/WebGL funciona en el dispositivo del visitante, no en el servidor de Vercel. |

**Decisión MVP:** sin Supabase, ORM ni backend propio mientras las fichas se actualicen mediante archivos. Si después hace falta un panel editorial, usuarios o contenido dinámico, evaluar **Supabase/Postgres** de manera separada. La interfaz usa una capa `catalogRepository` para facilitar el cambio sin reescribir componentes.

## 3. Árbol de carpetas propuesto

**Raíz del proyecto = carpeta que indique el usuario.** No agregar otra carpeta contenedora si no lo solicita.

```text
<RAIZ_PROYECTO>/
├── AGENTS.md                         # Reglas globales permanentes para Codex
├── README.md                         # Instalación, uso y estado del proyecto
├── package.json
├── package-lock.json                 # Si se usa npm: mantener un solo lockfile
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── .gitignore
├── .env.example                      # Solo cuando haya servicios externos
├── .agents/
│   └── skills/
│       ├── anatomy-integrity/
│       │   └── SKILL.md              # Rigor veterinario, procedencia y licencias
│       ├── 3d-asset-pipeline/
│       │   └── SKILL.md              # Ingesta, GLB y optimización
│       └── mobile-3d-qa/
│           └── SKILL.md              # Rendimiento, accesibilidad y pruebas móvil
├── docs/
│   ├── architecture.md               # Decisiones y límites de arquitectura
│   ├── sources-and-licenses.md       # Catálogo de fuentes admitidas y descartadas
│   ├── anatomical-validation.md      # Protocolo de revisión científica
│   ├── asset-manifest.md             # Qué modelos existen realmente y de dónde vienen
│   ├── roadmap.md                    # Fases, criterios de aceptación y pendientes
│   └── references/                   # Bibliografía/metadatos, NO piratear PDFs
├── data/
│   ├── species.json                  # perro, gato
│   ├── regions.json                  # regiones estables
│   ├── structures/
│   │   ├── dog/                       # fichas anatómicas caninas verificadas
│   │   └── cat/                       # fichas anatómicas felinas verificadas
│   ├── catalogs/
│   │   ├── dog-head.json             # vínculos estructura ↔ mesh ↔ fuente
│   │   └── cat-head.json
│   └── provenance/
│       └── assets.json               # licencias, autores, URI, método y estado
├── public/
│   ├── models/
│   │   ├── dog/
│   │   │   └── head/                  # GLB públicos de tamaño razonable
│   │   └── cat/
│   │       └── head/
│   ├── reference-images/             # únicamente imágenes con permiso
│   │   ├── dog/
│   │   └── cat/
│   └── placeholders/                 # iconos genéricos propios, NO tejidos falsos
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                   # portada y selector de especie
│   │   ├── atlas/
│   │   │   └── [species]/
│   │   │       └── [region]/
│   │   │           └── page.tsx       # URL compartible: /atlas/dog/head
│   │   └── globals.css
│   ├── components/
│   │   ├── atlas/
│   │   │   ├── AnatomyViewer.tsx      # contenedor cliente del lienzo 3D
│   │   │   ├── AnatomyScene.tsx       # GLB, iluminación, cámara
│   │   │   ├── StructureMesh.tsx      # selección/visibilidad de objeto
│   │   │   ├── LayerControls.tsx      # controles reales de capas
│   │   │   └── ViewerToolbar.tsx
│   │   ├── anatomy/
│   │   │   ├── StructureDetails.tsx   # ficha detallada por toque/clic
│   │   │   ├── SpeciesSelector.tsx
│   │   │   ├── RegionSelector.tsx
│   │   │   └── SourceAttribution.tsx
│   │   └── ui/                       # componentes pequeños compartidos
│   ├── lib/
│   │   ├── anatomy/
│   │   │   ├── catalogRepository.ts  # interfaz simple de consulta de fichas
│   │   │   ├── structureSearch.ts
│   │   │   └── sourceValidation.ts
│   │   └── three/
│   │       ├── meshRegistry.ts       # IDs exactos mesh ↔ estructura
│   │       └── cameraPresets.ts
│   ├── hooks/
│   │   └── useAtlasSelection.ts
│   └── types/
│       ├── anatomy.ts
│       └── assets.ts
├── scripts/
│   ├── validate-catalog.ts           # sin estructuras huérfanas ni referencias rotas
│   ├── inspect-glb.mjs               # inspeccionar nodos y tamaños
│   └── ingest-assets.md              # procedimiento de ingesta manual, auditable
├── tests/
│   ├── anatomy-data.test.ts
│   └── anatomy-selection.test.tsx     # añadir cuando haya viewer funcional
└── workbench/                       # material científico de trabajo LOCAL
    ├── incoming/                     # originales adquiridos legalmente
    ├── working/                      # Blender, NRRD, SEG, OBJ, etc.
    ├── optimized/                    # GLB de producción
    └── approvals/                    # registros de autorización y revisión
```

**Git:** `workbench/` y materiales con licencias restrictivas deben quedar excluidos en `.gitignore`. Los GLB grandes también deben permanecer fuera de Git; guardar en Git solo manifiesto, enlaces/identificadores, metadatos y scripts. Los caminos `workbench/` son directorios de procesamiento, no activos publicados automáticamente.

**Nota de simplicidad:** los archivos listados son el **destino arquitectónico**; no es obligatorio crearlos vacíos en la fase 0. Crear únicamente los que cada fase requiera.

## 4. Mapa de enlaces de descarga, documentación y destinos

**IMPORTANTE:** no existe una descarga única, libre y científicamente verificada que incluya *todo* el sistema muscular, tendinoso, ligamentoso y nervioso de perros y gatos en modelos 3D individuales. El inventario distingue **instalador/documentación**, **repositorio de búsqueda**, **modelo descargable concreto** y **material solo referencial**. Codex deberá comprobar cada licencia y descarga en el momento de usarla. Esta tabla **no autoriza descargas masivas**.

### 4.1 Desarrollo, visualización y despliegue

| Qué | URL oficial o relevante | Destino/uso | Acción |
|---|---|---|---|
| Node.js LTS | https://nodejs.org/en/download | Equipo del desarrollador, NO `public/` | Instalar versión LTS soportada por Next.js. |
| Next.js | https://nextjs.org/docs/app/getting-started/installation | `src/app/`, configuración raíz | Crear proyecto con TypeScript y ESLint. |
| React Three Fiber | https://r3f.docs.pmnd.rs/getting-started/installation | `src/components/atlas/` | Instalar paquete, no descargar código manualmente. |
| Drei | https://github.com/pmndrs/drei | `src/components/atlas/` | Instalar `@react-three/drei`. |
| Three.js | https://threejs.org/docs/ | `src/lib/three/` | Dependencia `three`. |
| Tipos TS Three.js | https://www.npmjs.com/package/@types/three | configuración TS | Añadir si la versión del ecosistema lo requiere. |
| Zod | https://zod.dev/ | `src/lib/anatomy/` | Opcional, para validar estructura de datos. |
| Blender | https://www.blender.org/download/ | Equipo; exportar a `workbench/optimized/` | Modelos, revisión, nombres de nodos y materiales. |
| 3D Slicer | https://download.slicer.org/ | Equipo; exportar a `workbench/working/` | Segmentar CT/MRI propios o autorizados. |
| glTF Transform | https://gltf-transform.dev/cli | `scripts/` y `workbench/optimized/` | Optimización. No unir mallas anatómicas diferenciables. |
| Khronos glTF Sample Assets | https://github.com/KhronosGroup/glTF-Sample-Assets | `workbench/incoming/technical-fixtures/` | Modelos **no anatómicos** para probar el visor, verificando licencia por modelo. |
| Playwright | https://playwright.dev/docs/intro | `tests/` | Tests E2E y tamaños de pantalla. |
| Vitest | https://vitest.dev/guide/ | `tests/` | Tests de integridad de catálogo. |
| Vercel | https://vercel.com/docs/deployments/overview | Despliegue desde repo Git | Hospeda Next.js; **no renderiza el 3D en servidor**. |
| Vercel Blob | https://vercel.com/docs/vercel-blob | URL pública guardada en `data/provenance/assets.json` | Solo si GLB crece; nunca exponer recursos sin licencia pública. |
| Supabase (fase futura) | https://supabase.com/docs | Migración futura de `catalogRepository` | No instalar para MVP. |

**Comando base orientativo (NO ejecutar hasta aprobación):**

```bash
npx create-next-app@latest . --ts --eslint --app --src-dir --use-npm
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
# Añadir zod/vitest/playwright solo al implementar sus tareas.
```

Antes de ejecutar, confirmar que el directorio esté vacío o que se puede modificar sin sobrescribir nada; verificar los prompts/opciones de la versión actual de `create-next-app`.

### 4.2 Datos de caninos, felinos y anatomía científica

| Recurso | URL verificada de entrada | Qué se puede obtener | Ruta prevista / límite |
|---|---|---|---|
| **Cráneo de perro (Cambridge Vet School)** | https://sketchfab.com/3d-models/dog-skull-d55bb38a6b584176a3930d2b7657930b | Fotogrametría de cráneo de perro, descarga desde Sketchfab indicada bajo **CC BY**. Revisar términos y atribuir a autora. | `workbench/incoming/dog/head/`; exportación GLB a `public/models/dog/head/` tras validación. **Es un cráneo, no músculos.** |
| **Cráneo de gato (Sergiogocar)** | https://sketchfab.com/3d-models/craneo-gato-cat-skull-c23e1a1ce78e462da2981eb6ca6825af | Modelo descargable de cráneo felino, indicado como **CC BY**. Comprobar descarga, formato, autor y atribución. | `workbench/incoming/cat/head/` → `public/models/cat/head/` validado. **No incluye músculos.** |
| **MorphoSource** | https://www.morphosource.org/ | Repositorio de escaneos 3D y medios científicos; buscar `Canis lupus familiaris`, `Felis catus` y regiones concretas. | Solo resultados individuales autorizados → `workbench/incoming/{dog\|cat}/`. Un registro no garantiza descarga ni redistribución. |
| **API MorphoSource** | https://github.com/MorphoSource/morphosource-api | Documentación para buscar medios y descargar archivos cuando el registro y la autorización lo permitan. | Futura `scripts/` de búsqueda; **no automatizar sin verificar licencia/acceso por registro**. |
| **DigiMorph** | https://www.digimorph.org/ | CT, morfología y recursos científicos como referencia comparativa. | **Referencia/enlace**, no incorporar medios al servidor salvo permiso expreso. |
| **Colorado State: Virtual Canine Anatomy** | https://www.cvmbs.colostate.edu/vca4/Home/Section | Disecciones reales, identificación de músculos y fichas anatómicas. | Fichas de `docs/references/` con enlaces y notas propias. No extraer/republicar fotos o texto automáticamente. |
| **WAVA: Nomina Anatomica Veterinaria** | https://wava-amav.org/ (descarga de NAV 6.ª ed. desde el sitio oficial) | Terminología veterinaria estandarizada (archivo de descarga enlazado por WAVA: `https://wava-amav.org/downloads/nav_6_2017.zip`). | `docs/references/` **solo si los términos de uso lo permiten**; nombres latinos en `data/structures/`. **No es un atlas 3D.** |
| **WAVA: Nomina Histologica Veterinaria** | https://wava-amav.org/ | Vocabulario formal de tejidos/histología. | Fuente de terminología; no confundir nomenclatura con descripciones originales para republicar. |
| **Z-Anatomy veterinaria** | https://github.com/Z-Anatomy/Models-of-veterinary-anatomy | Proyecto abierto, pero el repositorio inspeccionado contiene **Z-PIG** (cerdo): **NO es un atlas canino/felino**. | Solo referencia de pipeline y licencias, **NO usar como geometría de perro/gato**. Parte del material tiene condiciones de terceros: auditar pieza por pieza. |
| **Open Anatomy Project** | https://www.openanatomy.org/ | Metodología y herramientas de atlas abiertos; la disponibilidad de modelos veterinarios completos no está confirmada. | `docs/references/`; no prometer dataset canino/felino desde aquí. |
| **3D Slicer — Segmentations** | https://slicer.readthedocs.io/en/latest/user_guide/modules/segmentations.html | Proceso de convertir una segmentación propia/autorizada a geometría OBJ/STL. | `workbench/working/` → Blender → GLB. La segmentación puede requerir muchísimo trabajo manual y revisión experta. |

**Estado real a fecha de diseño:** se han localizado dos **modelos concretos de cráneos** descargables para arrancar con osteología; **no** se ha verificado un catálogo legal de mallas individualizadas de **todos los músculos, tendones y ligamentos de perros y gatos** apto para redistribuir. Codex tiene que investigar y completar este vacío **antes de afirmar cobertura muscular 3D**.

**Reglas para descargas:**

1. Crear registro en `data/provenance/assets.json` antes de publicar activo.
2. Anotar URL de página + URL de archivo real (si se obtiene), autor, licencia con versión, condiciones, fecha y checksum SHA-256.
3. Descargar manualmente cuando haga falta cuenta o aceptación de términos; jamás eludir barreras de acceso.
4. Guardar original **sin modificar** bajo `workbench/incoming/`; trabajar copias. Si no tiene licencia de redistribución, conservarlo privado y usar solo enlaces externos autorizados.
5. Exportar GLB, optimizar, probar correspondencia de nodos y documentar la transformación.
6. Si un GLB incluye una única malla de muchos músculos, **no** prometer selección muscular individual hasta separarla y validarla.

## 5. Diseño de datos anatómicos: una ficha por estructura y especie

Cada estructura **verificada** tendrá un identificador estable y vínculos a las mallas concretas. No suponer que el mismo músculo tiene detalles idénticos entre especies.

```ts
// src/types/anatomy.ts — CONTRATO de ejemplo, ajustar durante implementación.
type SpeciesId = 'dog' | 'cat';
type StructureKind =
  | 'bone' | 'muscle' | 'tendon' | 'ligament'
  | 'fascia' | 'nerve' | 'vessel' | 'organ';
type EvidenceType =
  | 'real_scan' | 'medical_segmentation'
  | 'expert_reviewed_reconstruction' | 'illustrative_model';
type ReviewStatus = 'pending' | 'reviewed' | 'validated';

type AnatomyStructure = {
  id: string;                     // ej. dog:head:muscle:masseter
  species: SpeciesId;
  regionId: string;
  kind: StructureKind;
  canonicalLatinName: string;     // NAV: verificar denominación
  spanishName: string;
  aliases: string[];
  summary: string;                // descripción introductoria en español
  detailedDescription: string;    // forma, profundidad, relaciones, límites
  locationAndRelations: string[];
  origin?: string[];              // sólo cuando procede y está verificado
  insertion?: string[];
  action?: string[];
  innervation?: string[];
  vascularSupply?: string[];
  fiberOrientation?: string;
  clinicalNotes?: string[];       // opcional, contrastado
  sourceIds: string[];            // respaldo bibliográfico verificable
  model?: {
    assetId: string;
    nodeNames: string[];          // nombres reales de nodos dentro del GLB
    evidence: EvidenceType;
    anatomicalCoverageNote: string;
  };
  review: {
    status: ReviewStatus;
    reviewer?: string;
    reviewedAt?: string;
    notes?: string;
  };
};
```

**Nota metodológica:** `origin`, `insertion` y `action` no son atributos universales de huesos o ligamentos. En tendones debe explicarse la relación con el músculo y sus inserciones; en ligamentos, fijaciones y función estabilizadora; en fascias, planos y conexiones. Evitar campos inventados para completar una ficha.

### Qué ve la persona al tocar un músculo

1. Nombre en español y latín, especie, región, tipo de estructura y estado de validación.
2. **Descripción extensa**: morfología, posición superficial/profunda, dirección de fibras, límites y relación con músculos y huesos vecinos.
3. **Origen**, **inserción**, **acción**, **inervación**, **irrigación**, cuando esas propiedades estén documentadas.
4. **Tendones asociados** y **ligamentos cercanos**: separados anatómicamente, no confundidos con la misma estructura.
5. Fuentes bibliográficas concretas, imagen de disección permitida o enlace a atlas real.
6. Información sobre el propio modelo: «escaneo», «segmentación», «reconstrucción revisada» o «ilustrativo»; si no hay geometría, indicarlo.
7. Opción «ver en contexto», «aislar» y «ocultar» únicamente cuando hay malla correspondiente.

**Jamás usar texto generado sin referencias como si fuera una ficha científica validada.** Priorizar nomenclatura WAVA y bibliografía académica veterinaria. Si dos referencias difieren por especie/autor, registrar diferencia en vez de ocultarla.

### Contrato de fuentes (`data/provenance/assets.json`)

Para cada activo, guardar al menos:

```json
{
  "assetId": "dog-head-skull-001",
  "species": "dog",
  "regionId": "head",
  "type": "3d-model",
  "landingPageUrl": "https://sketchfab.com/3d-models/dog-skull-d55bb38a6b584176a3930d2b7657930b",
  "downloadUrl": null,
  "author": "SusanElaineJones",
  "licenseLabel": "CC BY (verificar versión exacta al descargar)",
  "licenseVerified": false,
  "redistributionApproved": false,
  "originalSha256": null,
  "sourceMethod": "photogrammetry",
  "format": null,
  "publicPath": null,
  "meshNodeIds": [],
  "reviewStatus": "pending",
  "notes": "Registro inicial, NO es un archivo ya descargado ni aprobado"
}
```

Los valores anteriores son **estado pendiente**, no un aval de publicación. Para bibliografía textual se usa un archivo o tipo separado: citas a páginas/ediciones, fragmentos permitidos y revisión.

## 6. Viewer 3D: comportamiento preciso

- **Una malla identificable = nodo nombrado** (p. ej. `dog__head__muscle__masseter__left`), con un ID de ficha asociado. Validar que todos los `nodeNames` existan en GLB. No basar la identificación en el color visible.
- Picking por evento de React Three Fiber, resolviendo nodo → estructura; no seleccionar estructuras ocultas. Mantener selección sincronizada con ficha, búsqueda y región.
- Capas según anatomía disponible: `bone`, `muscle.superficial`, `muscle.deep`, `tendon`, `ligament`, `fascia`, `nerve`, `vessel`. La profundidad **no se deduce** de un color ni se puede garantizar si la fuente no lo separa.
- Resaltado temporal por contorno/tinte sin reemplazar permanentemente las texturas científicas. Acción de restablecer aspecto original.
- Controles: órbita con límites prudentes, zoom, centrar región/estructura, cámara anterior/lateral/dorsal/ventral y restablecer.
- Aislar malla sin perder contexto opcional del esqueleto en transparencia (si existe). Asegurar botón para devolver visibilidad.
- No prometer cortes anatómicos reales, disección volumétrica ni RA en el MVP: son proyectos específicos que requieren datos/tecnología adicional.
- Para modelos sin mallas individualizadas, mostrar el modelo global como **referencia no seleccionable por estructura**, con aviso.

## 7. Prioridad móvil y computador

**Móvil primero:**

- Un solo visor principal; controles esenciales compactos y siempre alcanzables; ficha anatómica en **panel inferior desplazable** que no cubra permanentemente el 3D. En escritorio, ficha lateral.
- Toque simple selecciona; arrastre rota; gesto de pellizco zoom; botón de **restablecer** siempre visible. Prevenir conflicto entre scroll vertical de ficha y gestos del visor.
- Objetivos táctiles aproximados de **44 × 44 CSS px** o mayores cuando el contexto lo permita; etiquetas no dependientes de hover.
- Mostrar loader real con tamaño/progreso si es viable, estado de error WebGL y alternativa textual con referencias si no se soporta 3D.
- Respetar `prefers-reduced-motion`, foco/teclado, contraste y etiquetas accesibles. El atlas debe permitir buscar estructuras sin interacción 3D.
- No usar texturas enormes por defecto ni cargar todas las regiones/especies al entrar.

**Optimización gradual y medible (NO prometer FPS sin probar):**

1. Cargar solo **especie + región elegidas**; importación dinámica del componente de visor para evitar SSR de WebGL.
2. GLB/glTF con mallas etiquetadas; conservar jerarquía e ID durante la optimización.
3. Versión móvil reducida o LOD si el activo lo requiere; controlar triángulos, draw calls, texturas y memoria.
4. Materiales PBR con iluminación adecuada, evitando sombras dinámicas pesadas/postprocesados innecesarios en móvil.
5. Comprimir GLB y texturas **tras comparar calidad anatómica y rendimiento**; no usar simplificaciones que borren orígenes, inserciones o ligamentos finos.
6. Ajustar `devicePixelRatio` del canvas para dispositivos lentos; opción de calidad gráfica si las pruebas lo justifican.
7. Probar en **iPhone Safari** y Android Chrome reales, y en escritorio. Verificar uso con datos móviles y orientación vertical/horizontal.
8. Registrar en `docs/roadmap.md`: tamaño transferido de GLB, memoria aproximada disponible, FPS observado, tiempos de carga y errores, **sin inventar métricas**.

## 8. Skills específicas para Codex — crear en el repositorio

Ubicación recomendada: `.agents/skills/<nombre>/SKILL.md`. Son **skills locales propias**, no paquetes que aseguren precisión científica. Codex debe crearlas en fase 0 como instrucciones breves y accionables, con encabezado YAML `name` y `description`, y leerlas cuando corresponda. Mantener `AGENTS.md` para reglas permanentes.

### 8.1 `.agents/skills/anatomy-integrity/SKILL.md`

```md
---
name: anatomy-integrity
description: Validar nomenclatura, especie, evidencia, bibliografía y permisos de atlas veterinarios antes de crear o publicar fichas y modelos.
---
1. Verificar explícitamente especie, región, estructura y términos latinos en referencias veterinarias.
2. Registrar origen/inserción/acción/inervación solo con bibliografía rastreable. No trasplantar datos humanos ni de otras especies.
3. Identificar si la geometría es escaneo, segmentación, reconstrucción revisada o ilustración.
4. Verificar licencias, atribución y derecho a redistribuir cada archivo. Rechazar activos sin permiso.
5. Mantener `reviewStatus=pending` hasta revisión humana; no marcar `validated` automáticamente.
6. Señalar estructuras ausentes como ausentes. Entregar un informe breve de cambios y vacíos.
```

### 8.2 `.agents/skills/3d-asset-pipeline/SKILL.md`

```md
---
name: 3d-asset-pipeline
description: Preparar mallas veterinarias en GLB preservando identidad de huesos, músculos, tendones y ligamentos, y registrar su procedencia.
---
1. Inspeccionar contenido original, licencia, formato, cantidad de nodos y escala.
2. Mantener originales intactos en `workbench/incoming/` y procesados separados.
3. Usar Blender/3D Slicer solo según el tipo y autorización del dato.
4. Asignar nombres de nodos estables y especie correcta; no inferir etiquetas sin validación.
5. Exportar GLB, comprobar nodos, normals, mallas, texturas y orientación.
6. Optimizar para móvil sin unir mallas que deban ser seleccionables.
7. Actualizar manifiesto, SHA-256, atribuciones, permisos y rutas de despliegue.
```

### 8.3 `.agents/skills/mobile-3d-qa/SKILL.md`

```md
---
name: mobile-3d-qa
description: Revisar rendimiento y usabilidad táctil de un atlas anatómico Three.js en Safari iPhone, Android y escritorio.
---
1. Revisar cargas diferidas, manejo WebGL ausente, selección táctil y scroll de la ficha.
2. Comprobar que tocar/aislar/ocultar una estructura no selecciona mallas erróneas.
3. Inspeccionar visualmente a 375px, 390px, 768px y escritorio, sin sustituir pruebas en equipos reales.
4. Registrar peso GLB y fallos observados, sin cifras inventadas.
5. Ejecutar lint, typecheck y tests existentes; informar fallos concretos.
6. No introducir librerías de UI o performance complejas sin evidencia.
```

### 8.4 Enlaces de skills/documentación de Codex

| Recurso | Enlace | Instrucción |
|---|---|---|
| Guía oficial para crear skills | https://developers.openai.com/plugins/build/skills | Seguir la estructura y metadatos de `SKILL.md`. |
| Documentación del concepto de skill | https://developers.openai.com/api/docs/guides/tools-skills | Usar buenas descripciones de activación, referencias y scripts solo si son necesarios. |
| Catálogo actual de plugins/skills OpenAI | https://github.com/openai/plugins | Consultar patrones disponibles; **no instalar indiscriminadamente**. |
| Ejemplos de flujo web | https://github.com/openai/plugins/tree/main/plugins/build-web-apps | Revisar instrucciones pertinentes antes de integrar procesos. |
| Ejemplos de tests/skills | https://github.com/openai/plugins/tree/main/plugins/superpowers/skills | Referencia opcional para planificación, debugging y diseño de procesos, sin obligación de instalar el conjunto. |
| Reglas globales de Codex | https://github.com/openai/codex | Crear `AGENTS.md` simple, con reglas específicas de este proyecto. |

> Evitar el repositorio antiguo `openai/skills` como referencia principal: actualmente remite al catálogo `openai/plugins`. Ninguna skill garantiza precisión médica por sí sola.

**Contenido mínimo para `AGENTS.md`:** leer arquitectura/roadmap antes de cambios, mantener TypeScript estricto y código modular, nunca inventar datos anatómicos/activos/licencias, descargar solamente fuentes autorizadas, no hacer cambios fuera de la carpeta, implementar una fase por vez, ejecutar pruebas y reportar lo realizado/pediente. No duplicar allí todo este documento.

## 9. Fases de construcción: no avanzar sin aprobación

### Fase 0 — Auditoría del directorio y fundamentos (PRIMERA INTERACCIÓN CON CODEX)

**Entrada:** carpeta que el usuario indique y este archivo MD.  
**Tareas:**

1. Confirmar ubicación actual y archivos existentes.
2. Inspeccionar entorno Node/npm/Git y versión compatible con Next.js.
3. Proponer árbol definitivo mínimo; señalar si alguna dependencia o directorio sobra.
4. Generar `AGENTS.md`, `docs/architecture.md`, `docs/roadmap.md`, `docs/sources-and-licenses.md`, y las tres skills descritas **solo cuando el usuario autorice escribir archivos**.
5. Abrir/verificar fuentes de cráneo canino y felino, formato disponible y condiciones de descarga; **no** descargarlos todavía sin aprobación.
6. Entregar «riesgos», «fuentes permitidas», «fuentes descartadas», «cuestiones abiertas» y plan de Fase 1.

**Aceptación:** documentación clara, repositorio intacto salvo archivos autorizados, sin afirmar geometría no conseguida. **Detenerse y pedir confirmación.**

### Fase 1 — Esqueleto de la web + visor genérico probado

Crear Next.js con TypeScript, pantalla móvil/escritorio y viewer Three.js, usando un activo **técnico NO anatómico** licenciado. Probar seleccionar nodos y abrir una ficha genérica que indique «DEMO técnica». No venderlo como atlas científico.

**Aceptación:** build, lint, typecheck y controles táctiles básicos sin errores; desplegable en Vercel. Solicitar aprobación.

### Fase 2 — Primeros activos anatómicos reales

Ingestar con permisos verificados **cráneo de perro + cráneo de gato**, registrar atribuciones y pruebas de nodos/escala, y construir selector de especie/región «cabeza». Es osteología, **no** prometer músculos.

**Aceptación:** ambos cráneos se cargan, metadata y atribución visibles, no se mezclan especies, y se comportan bien en móvil. Solicitar aprobación.

### Fase 3 — Primera estructura muscular real y sus fichas

**Bloqueo científico:** conseguir una fuente con licencia apta que incluya **un músculo canino verdaderamente individualizado** (idealmente de cabeza o miembro), o realizar segmentación/reconstrucción con supervisión anatómica. No construir músculo 3D inventado. Incorporar las fichas detalladas y referencias de origen/inserción/acción/inervación. Si no aparece un activo 3D legítimo, entregar una ficha ilustrada/referenciada **sin malla 3D** mientras se resuelve el dato.

**Aceptación:** una estructura correctamente seleccionable, anatomía revisada, fuentes rastreables, y ausencia explícita de geometría cuando corresponda. Solicitar aprobación.

### Fase 4 — Tejidos profundos, tendones, ligamentos y capas

Agregar únicamente estructuras conseguidas y revisadas; jerarquía superficial/profunda, filtros por tipo, aislado/transparencia, fotografías reales autorizadas, validación de niveles de detalle. Incluir felinos conforme existan datos, no mediante copia de perro.

### Fase 5 — Rendimiento, accesibilidad y producción

Probar equipos reales, optimizar activos, fallbacks, permisos, atribuciones y fuentes; decidir si mover GLB pesados a Blob/S3/R2; desplegar en Vercel y verificar links. No introducir base de datos hasta que exista demanda editorial real.

## 10. Reglas de calidad y criterios de rechazo

**Rechazar una entrega** si: (a) afirma mostrar todos los músculos y contiene solo una malla externa; (b) confunde un tendón con ligamento/fascia; (c) muestra tejido «realista» creado únicamente por prompt sin evidencia; (d) presenta fichas sin fuentes o mezclando especies; (e) publica modelos de licencias no verificadas; (f) rompe selección táctil o vuelve inutilizable Safari móvil; (g) descarga datasets enormes sin permiso; (h) introduce servicios/backend innecesarios; (i) marca `validated` sin revisión humana.

**Comprobaciones mínimas automatizables:** tipos TS; IDs únicos por especie/región; estructura → activo/nodos existentes; nodos → fichas; fuentes bibliográficas existentes; publicación bloqueada para licencia sin verificar; nodos ocultos no seleccionables; una especie jamás carga datos de otra; prueba de carga fallida muestra alternativa textual.

## 11. Primera instrucción lista para pegar en Codex

```text
Estoy en la carpeta raíz del proyecto, cuya ubicación yo te he indicado.
Lee completo ARQUITECTURA_ATLAS_VETERINARIO_3D_CODEX.md.
Vamos por fases: por ahora SOLO quiero la FASE 0.
Primero inspecciona el directorio y el entorno, explica la estructura mínima que propones,
comprueba las fuentes y licencias de los posibles activos anatómicos,
y detalla los archivos AGENTS.md, docs/ y .agents/skills que crearías.
NO ejecutes descargas grandes, NO instales dependencias, NO generes modelos anatómicos,
NO inicialices el proyecto Next.js y NO edites archivos hasta que te autorice.
Distingue fuentes verificadas de enlaces de catálogo y enumera las decisiones pendientes.
Una vez me entregues el plan de fase 0, detente y espera mi confirmación.
```

## 12. Preguntas que Codex debe elevar al usuario cuando corresponda

- ¿Se permitirá publicar el atlas libremente o solo usarlo de forma privada/educativa? **Afecta licencias y selección de activos.**
- ¿Cuál será la primera región anatómica? Se sugiere **cabeza**, porque ya existen cráneos de ambas especies con condiciones de descarga conocidas.
- ¿Se dispone de acceso institucional a bibliografía veterinaria y revisión por estudiante/docente/profesional de anatomía?
- ¿Se prefieren inicialmente solo activos abiertos y gratuitos, aunque la cobertura muscular tarde más?

**Decisión predefinida hasta obtener respuesta:** MVP abierto/gratuito y sin activos de licencias restrictivas; primera región cabeza; verificación humana aún pendiente; no inventar cobertura 3D.

---

## 13. Registro de enlaces científicos/técnicos para verificación continua

- WAVA — https://wava-amav.org/
- NAV 6.ª ed. (ZIP enlazado en WAVA) — https://wava-amav.org/downloads/nav_6_2017.zip
- MorphoSource API — https://github.com/MorphoSource/morphosource-api
- MorphoSource: derechos y licencias — https://duke.atlassian.net/wiki/spaces/MD/pages/35422314/Rights+Licenses+and+Usage+Settings+for+Media
- Fotogrametría cráneo perro — https://sketchfab.com/3d-models/dog-skull-d55bb38a6b584176a3930d2b7657930b
- Modelo cráneo gato — https://sketchfab.com/3d-models/craneo-gato-cat-skull-c23e1a1ce78e462da2981eb6ca6825af
- CSU anatomía canina real — https://www.cvmbs.colostate.edu/vca4/Home/Section
- Exportación de segmentaciones 3D Slicer — https://slicer.readthedocs.io/en/5.4/user_guide/modules/segmentations.html
- Instalación React Three Fiber — https://r3f.docs.pmnd.rs/getting-started/installation
- Compresión glTF — https://gltf-transform.dev/cli
- Vercel Blob — https://vercel.com/docs/vercel-blob
- Guía OpenAI para skills — https://developers.openai.com/plugins/build/skills
- Catálogo actual de OpenAI — https://github.com/openai/plugins

**FIN — Este documento especifica el sistema; no certifica disponibilidad universal de mallas anatómicas ni concede derechos de uso sobre material de terceros.**
