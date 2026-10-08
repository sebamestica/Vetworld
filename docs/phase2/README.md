# Visor de estudio — fase 2

Estado funcional: visor y flujo de fichas operativos sobre fixture técnica. La adquisición/validación del primer modelo anatómico académico y fotografías internas continúa pendiente. No se publicó la aplicación.

## Uso local

```powershell
cd C:\dev\Vetworld
npm ci
npm run dev
```

Abrir `http://localhost:3000`. Seleccionar perro/gato y miembro torácico. Las formas geométricas permiten comprobar selección → ficha de API → fuente académica. Se pueden abrir las mismas fichas desde la lista accesible, incluso sin WebGL.

Arrastrar: giro. Rueda o dos dedos: zoom. Botón derecho o gesto con dos dedos: paneo. Clic/toque: selección. Capas: ocultamiento y opacidad. Aislar: solo estructura seleccionada. Restablecer: cámara, visibilidad y selección originales. En móvil la ficha abre una hoja inferior de altura contenida, ampliable y cerrable; cerrarla conserva el resaltado para seguir trabajando en el visor.

Regiones sin fichas/modelos muestran ausencia real; cambiar especie/región limpia el contexto. No hay geometría de músculos superficiales/profundos individualizada ni ligamentos disponibles. Las cuatro capas del modo técnico están asociadas a IDs, sin significado de anatomía espacial.

## Pruebas reproducibles

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
npm run test:smoke:production
```

E2E arranca y cierra `next start` propio en puerto 3100; requiere build previo y puerto libre. Suites HTTP arrancan su servidor propio. Ejecutarlas secuencialmente; no recompilar el mismo build mientras lo consume un servidor de pruebas. En Linux, instalar Chromium con `npx playwright install --with-deps chromium` cuando falten bibliotecas del sistema. CI usa runner Ubuntu estándar, sin despliegues.

`test:smoke` conserva soporte API_BASE_URL para backend local/URL autorizada; no se ejecutaron pruebas públicas de Vercel. Chromium usa configuración de WebGL software para que las pruebas locales no dependan de GPU dedicada; esto no acredita Safari iOS o Android físicos.

## Activos y referencias

- Un archivo técnico original: `public/models/technical/interaction-demo.glb`, 55.732 bytes, 2.572 triángulos, buffers GPU estimados 52.512 bytes. SHA-256 y unidades m documentados. Dos manifiestos asignan IDs distintos de perro/gato al mismo archivo. Posiciones/proporciones no tienen significado anatómico ni dimensiones de espécimen. [Manifiesto y límites](assets.md).
- Cero modelos científicos disponibles. Los dos cráneos existentes siguen pendientes de archivo, formatos, licencia exacta, escala y mallas.
- Cuatro referencias externas curadas al capítulo de University of Minnesota. No son cuatro fotos ni cuatro archivos independientes. No se incorpora material del libro CC BY-NC-ND mediante hotlink o miniatura. [Fuentes y investigación](sources.md).
- Galería admite fotos de disección, TC, RM, ilustraciones/vídeos. Imágenes internas solo con permisos y archivos locales; miniatura/ampliación/reintento se comprueban con una ilustración sintética interceptada en Playwright, no en el catálogo científico.

Pipeline: editar manifiestos bajo `data/viewer`, registrar fuente/especímenes/unidades/licencia/presupuesto y mapping de cada nodo, preparar GLB offline y validar antes de habilitarlo. El cargador soporta GLB/glTF con recursos locales o embebidos; el validador offline actual audita la fixture GLB autocontenida. La admisión de glTF con archivos auxiliares, texturas científicas y compresores requiere auditoría adicional antes de incorporarlos. No se promete esa adquisición ni una optimización inexistente.

## Seguridad y rendimiento

Carga diferida de Canvas; demanda de frames, DPR acotado por calidad, URL versionada por SHA y caché local de archivo. Abort/timeouts en API y cargas, cuerpo limitado, checksum y nodos/triángulos/buffers/bounds comprobados. Presupuestos actuales: 12 MiB por archivo, 250.000 triángulos y 100 MiB estimados de buffers; ajustarlos con mediciones y revisión de detalle, no eliminando anatomía sin evidencia. No medimos memoria GPU total o FPS.

URLs de modelos solo bajo `/models/` del mismo origen; texturas embebidas PNG/JPEG/WebP o recursos locales, sin proxy abierto. Imágenes de galería solo bajo `/reference-images/`; enlaces académicos con dominios HTTPS admitidos, `noopener noreferrer`. React escapa metadatos; no hay HTML arbitrario ni imágenes de Google. La búsqueda Google es solo un enlace opcional con nombres codificados y advertencia de verificación.

CSP por nonce de scripts, `connect-src` e imágenes restringidos, objetos/frames bloqueados y referrer ausente. Estilos inline controlados se permiten para Canvas/React; `unsafe-eval` solo desarrollo. El nonce exige rendering dinámico de página; catálogos públicos conservan caché HTTP y archivos estáticos quedan fuera del proxy. Verificación de producción local incluyó CSP funcional.

La prueba final de recorrido se completó en aproximadamente 2,5 s escritorio, 2,4 s tablet y 2,2 s teléfono emulado, incluyendo API y capturas; son duraciones del test en este entorno, no benchmarks de carga, FPS ni teléfonos reales. El GLB es pequeño: no extrapolar rendimiento a un escaneo de miles de estructuras.

## Capturas verificadas

- [Escritorio con ficha](screenshots/desktop-selected.png).
- [Teléfono emulado con ficha](screenshots/mobile-selected.png).
- [Tablet emulada](screenshots/tablet-selected.png).
- [Referencias en escritorio](screenshots/desktop-references.png).

Capturas de Chromium/Playwright con datos reales de API y geometría sintética rotulada. Se inspeccionaron visualmente las de escritorio y móvil; se comprobó ausencia de overflow en los tres tamaños. La validación académica de proporciones, tejidos y relaciones espaciales sigue pendiente porque no hay espécimen real adquirido.

## Próximo hito científico

Adquirir legalmente un activo canino/felino verificable, auditar escala/especímenes y nodos, completar bibliografía veterinaria/NAV y obtener revisión humana. Registrar fotografías aprobadas con autoría/derechos y verificación de especie/estructura. Probar Safari iOS y Chrome Android en equipos físicos; medir GPU/FPS/carga de esos activos. Autorizar por separado cualquier publicación en Vercel.
