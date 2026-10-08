# Pipeline de Procesamiento y Conversión 3D — Vetworld

Este documento describe el flujo técnico y automatizado de ingestión, conversión, normalización geométrica y validación de activos 3D para el Atlas Veterinario 3D.

---

## 1. Principios y Restricciones de Integridad

1. **Unidades estrictamente métricas:** Todos los activos en producción están escalados a metros ($1\text{ unidad} = 1\text{ metro}$). Las fuentes en centímetros (comunes en FBX de software de animación como Maya o 3ds Max) se escalan multiplicando por $0{,}01$.
2. **Sistema de coordenadas estándar de Three.js / WebGL:**
   - Eje $+Y$: Dirección dorsal (superior).
   - Eje $+Z$: Dirección craneal / anterior (hacia la cabeza o avance del animal).
   - Eje $+X$: Dirección lateral derecha (o según lateralidad del miembro).
3. **Presupuesto técnico por modelo:**
   - Máximo $120.000$ triángulos por activo individual.
   - Máximo $10\text{ MB}$ por archivo GLB comprimido.
   - Máximo $12\text{ MB}$ de VRAM proyectada en GPU móvil.
4. **Materiales PBR sobrios y neutros:**
   - No se aplican texturas fotográficas ficticias ni "baking" de oclusión ambiental inventada.
   - Se utilizan colores anatómicos estándar diferenciados por capa funcional:
     - Huesos / Esqueleto: Tono marfil óseo (`#D8D3C8`, roughness: 0.55).
     - Músculos: Tono miológico carnoso sobrio (`#A85858`, roughness: 0.65).
     - Nervios: Amarillo neurológico (`#E5C158`, roughness: 0.40).
     - Cartílago: Blanco nacarado translúcido (`#C0D0D8`, roughness: 0.35).
5. **Nombres de nodos inmutables y trazables:**
   - Cada nodo en la jerarquía del glTF conserva el identificador exacto de su malla original (`scaplula_bne`, `L_BicepsBrachii`, etc.).
   - La correspondencia con la estructura del catálogo se realiza a través de `meshMappings` en `assets.json` y `models.json`.

---

## 2. Herramientas y Scripts del Pipeline

El pipeline reside en el directorio `scripts/anatomy/`:

```
scripts/anatomy/
├── inspect-assets.ts       # Inspección binaria de cabeceras glTF/GLB y buffers
├── convert-assets.ts       # Conversor FBX/GLB headless con Three.js y Node
├── reconcile-structures.ts # Conciliador de identificadores de malla con catálogo NAV
├── validate-assets.ts      # Verificador de integridad geométrica, hashes y licencias
└── build-search-index.ts   # Generador determinista del índice de búsqueda rápida
```

### Comandos de Ejecución

```bash
# 1. Inspeccionar activos fuente o procesados
npm run anatomy:inspect

# 2. Convertir activos desde assets-source/ a public/
npm run anatomy:convert

# 3. Conciliar nodos con catálogo de estructuras
npm run anatomy:reconcile

# 4. Validar geometría, GPU y consistencia con catálogo
npm run anatomy:validate

# 5. Reconstruir índice de búsqueda
npm run anatomy:index
```

---

## 3. Arquitectura del Conversor Headless (`convert-assets.ts`)

Dado que `GLTFExporter` y `FBXLoader` de Three.js fueron diseñados originalmente para entornos de navegador (DOM y Web APIs), el script `convert-assets.ts` implementa:
1. **Polyfill de `FileReader` para Node.js:** Provee soporte para el evento `loadend` y el método `readAsArrayBuffer`, permitiendo que `GLTFExporter` devuelva un `ArrayBuffer` binario sin dependencias externas pesadas.
2. **Carga y normalización de FBX:** Lee la estructura jerárquica de `assets-source/canine/thoracicLimb_bonesSeparated.fbx`, normaliza transformaciones de escala (0.01) y rota hacia el sistema de coordenadas estándar (+Y arriba, +Z adelante).
3. **Ensamblado multi-malla:** En el caso felino (`assets-source/feline/*.glb`), ensambla las piezas óseas individuales en un único archivo GLB articulado manteniendo cada hueso como un nodo seleccionable independiente con su matriz de transformación local.
4. **Cálculo de Hash SHA-256:** Tras escribir cada binario a disco en `public/anatomy/...` y su espejo en `public/models/...`, calcula el hash criptográfico SHA-256 para garantizar la inmutabilidad y auditoría de la evidencia.
