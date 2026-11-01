# Diagnóstico canino privado — 2026-10-31 (F7, A2)

Activo: esqueleto canino de 3DExport, producto 285869, autor hidden.art8 (4 STL). **No tiene licencia web, así que todo el resultado es privado**: nada va a `public/`, `data/viewer/` ni mappings. Originales intactos (SHA-256 verificado al inicio y al final). No hay revisión anatómica humana: `reviewStatus=pending` en todo. Las identificaciones de este documento son **propuestas geométricas** basadas en capturas; una forma reconocible no valida anatomía. El proveedor declara «3D Scan: No» y el autor declara modificación para impresión y reflejo de columna y patas.

## Método

- `scripts/osteology/canine_stl.py` lee el STL binario directamente, sin importador: no fusiona vértices ni elimina triángulos, y el índice de triángulo coincide con el orden del archivo. Verifica el tamaño (`84 + 50·n`) y el hash del recibo.
- `scripts/osteology/diagnose-canine.py` (`python3 -I`, solo biblioteca estándar) calcula los componentes conectados con el mismo método del diagnóstico felino. Une vértices por coordenadas coincidentes, exactas (tolerancia 0) o cuantizadas (1e-6 y 1e-5 unidades fuente), y une los tres vértices de cada triángulo. Además obtiene:
  - cajas envolventes;
  - aristas de borde, de variedad y no variedad;
  - orientación inconsistente;
  - normales guardadas frente a las del orden de vértices;
  - triángulos degenerados y duplicados;
  - área y volumen con signo;
  - caras coplanares con los planos de la caja (tolerancia 0,05; alineación de la normal > 0,99);
  - proximidad entre componentes (≤ 0,5 unidades) y entre piezas.

  Las listas de caras privadas se guardan en `workbench/processing/canine/diagnostics/`.
- `scripts/osteology/build-canine-diagnostics.py` compone `data/osteology/diagnostics/canine.json`, sin geometría y con las propuestas. `scripts/osteology/canine-diagnostics-schema.ts` es el esquema Zod que lo valida.
- `scripts/osteology/build-canine-private-scene.py` (Blender 4.5.14) crea un objeto por componente, con atributo de cara `source_face_index` (índice STL) y sin escala, rotación ni traslación. Guarda, reabre y comprueba conteos. Con `-- --renders-only` reabre la escena y solo renderiza. `scripts/osteology/render-canine-labels.py` genera mapas rotulados `cNN`.
- Limitación del método: la cuantización por redondeo puede separar dos puntos casi coincidentes que caen a ambos lados de una celda. Aquí los tres conteos coinciden y la distancia mínima entre componentes distintos es > 0 (sin pares coincidentes), así que el resultado no depende de esa frontera.

## Resultados por pieza

| Pieza (archivo) | Triángulos | Posiciones únicas | Extensión X×Y×Z (u. fuente) | Componentes tol. 0 / 1e-6 / 1e-5 | Cerrados | Degenerados | Pares duplicados | Aristas de borde | No variedad | Orientación inconsistente |
|---|---:|---:|---|---|---:|---:|---:|---:|---:|---:|
| cráneo (`craneo_dog_skeleton.stl`) | 34.660 | 17.378 | 29,27 × 32,87 × 34,90 | 32 / 32 / 32 | 30 | 0 | 0 | 0 | 18 | 0 |
| columna (`espina dorsal_dog_skeleton.stl`) | 98.081 | 48.730 | 78,29 × 198,87 × 21,28 | 79 / 79 / 79 | 67 | 3 | 177 | 367 | 877 | 48 |
| miembro torácico (`pata delantera_dog_skeleton.stl`) | 21.656 | 10.748 | 20,52 × 120,53 × 78,79 | 30 / 30 / 30 | 28 | 0 | 42 | 0 | 219 | 0 |
| miembro pélvico (`pata trasera_dog_skeleton.stl`) | 25.416 | 12.716 | 28,78 × 120,11 × 65,78 | 28 / 28 / 28 | 27 | 0 | 1 | 0 | 49 | 0 |
| **Total** | **179.813** | | | **169** | | | | | | |

- **Cifras anteriores.** El total anterior de 179.590 triángulos (`user-downloads.md`) procede del importador STL de Blender, que eliminó 3 triángulos degenerados y 220 duplicados. Los duplicados medidos aquí suman 177 + 42 + 1 = 220, y 179.813 − 223 = 179.590, así que ambas cifras concuerdan. El conteo de islas de Blender (32/79/30/28) coincide con el de componentes por coordenadas.
- **Normales.** Ninguna normal guardada se opone al orden de vértices. Las 3 normales nulas corresponden a los 3 triángulos degenerados de la columna. Hay volúmenes con signo negativo en 1 componente del cráneo (c07, que reúne dos coronas y tiene 12 aristas no variedad) y en 4 de la columna (c09, c10, c11 y c35, mallas abiertas con 103–104 aristas de borde).
- **Formato.** Cabecera de 80 bytes en cero y palabras de atributo en cero.
- **Unidades: `unknown`.** El STL no tiene campo de unidades, la cabecera está vacía y la página del producto no las declara. No se infirieron unidades a partir de tamaños anatómicos.
- **Componentes separados pero en contacto.** Ningún par de componentes comparte un vértice. Hay componentes separados por menos de 0,5 unidades: 68 pares en el cráneo, 108 en la columna, 35 en el torácico y 39 en el pélvico, con mínimos de 0,018, 0,00099, 0,021 y 0,024 unidades. Son mallas independientes en contacto cercano, típicas de un modelo de impresión.

### Cortes planos

- **Columna.** 7.664 triángulos (1.397,2 de 8.497,0 u², el 16,4 % del área) son coplanares con el plano de Z mínima (≈0) y tocan 45 de los 79 componentes. Son todos los componentes vertebrales y esternales; las costillas no están cortadas. **La pieza es una hemisección**: las estructuras medianas tienen solo media superficie y las costillas son de un solo lado. Esto concuerda con el reflejo que declara el autor. Que Z≈0 sea el plano medio del animal es una interpretación geométrica, no un eje acreditado.
- **Cráneo.** 180 triángulos (177,9 u²) coplanares con el plano de Z mínima, todos en c00, forman la cara caudal del cráneo. En `pieces/skull-bottom-z.png` esa cara ocupa la región occipital; **no se identifican cóndilos occipitales**.
- **Extremidades.** Sin cortes significativos (1–2 caras casuales).

## Registro relativo: no realizado

No se demostraron superficies articulares coincidentes, así que las cuatro piezas permanecen en coordenadas originales y `registration.transformsApplied=[]`. Motivos:

1. **Piezas separadas.** Las cajas envolventes están separadas entre 51,24 (columna–torácico) y 287,93 (cráneo–pélvico) unidades. Ningún par de piezas tiene vértices a menos de 1 unidad.
2. **Disposición de impresión.** Cada pieza apoya su mínimo Z en ≈0 con orientaciones distintas: columna tumbada sobre el plano de corte y cráneo apoyado en su cara caudal plana. No es un animal articulado.
3. **Sin pares articulares completos.** Faltan cóndilos occipitales identificables en el cráneo, y el extremo craneal de la columna (atlas candidato) está seccionado. No hay dos superficies articulares completas que ajustar.
4. **Haría falta fabricar geometría.** El coxal y las extremidades son de un solo lado y la columna es media. Encajarlos exigiría reflejar o inventar geometría, y eso no está permitido sin declarar una aproximación.
5. **Escala sin comprobar.** Las unidades son desconocidas y no se verificó que las piezas compartan escala.

## Propuestas de identificación

Hay 32 propuestas que cubren los 169 componentes sin solapes (lo comprueba Zod). Todas llevan lado `unknown`, `serial=null` y `reviewStatus=pending`. Estados usados:

- `geometric_bone_sufficient_proposal`: componente individual con límites propios.
- `partial_surface_identified`.
- `unidentified_or_non_anatomical`.

No existe el estado «revisado». Los IDs del inventario de referencia se dan como candidatos de los dos lados.

**Componentes individuales con límites propios (8, estado «hueso geométrico suficiente» como propuesta):**

| Pieza | Componente | Propuesta |
|---|---|---|
| Miembro torácico | c00 | Escápula (espina y acromion visibles) |
| Miembro torácico | c01 | Húmero |
| Miembro torácico | c02 | Cúbito (olécranon) |
| Miembro torácico | c03 | Radio |
| Miembro pélvico | c00 | Coxal de un lado (ilion, isquion y pubis en una malla; agujero obturado visible) |
| Miembro pélvico | c02 | Fémur |
| Miembro pélvico | c01 | Tibia |
| Miembro pélvico | c05 | Peroné |

**Superficie identificada parcial (19 propuestas):**

| Pieza | Componentes | Propuesta |
|---|---|---|
| Cráneo | c00 | Cráneo en una malla, sin límites entre huesos |
| Cráneo | c01 | Ambas mandíbulas unidas |
| Cráneo | c02–c05 | Coronas de caninos |
| Cráneo | c06–c31 | 26 coronas dentarias; algunas dobles, sin correspondencia 1:1 con las 42 posiciones |
| Miembro torácico | c09–c12 | Metacarpianos (4) |
| Miembro torácico | c04–c08 | Falanges distales (5) |
| Miembro torácico | c14–c23 | Falanges proximales y medias: 10 componentes donde la referencia espera 9 (discrepancia sin resolver) |
| Miembro torácico | c13 y c24–c28 | Carpo: 6 componentes frente a 7 unidades de referencia |
| Miembro pélvico | c27 | Rótula candidata, por posición |
| Miembro pélvico | c12–c15 | Metatarsianos (4) |
| Miembro pélvico | c06–c09 | Falanges distales (4) |
| Miembro pélvico | c19–c26 | Falanges proximales y medias (8) |
| Miembro pélvico | c03, c04, c10, c11, c17, c18 | Tarso: 6 componentes frente a 7 de referencia |
| Columna | c00 | Varias vértebras fusionadas en una malla de 29.166 caras, cortada; no se cuentan |
| Columna | 8 componentes | Extremo craneal de la serie (cervicales sin numeral) |
| Columna | 8 componentes | Vértebras junto a las costillas (torácicas sin numeral) |
| Columna | 16 componentes | Caudales; c05 reúne dos y 4 son mallas abiertas |
| Columna | 13 componentes | Segmentos dorsales de costilla de un lado |
| Columna | c36 y c62–c67 | Elementos medianos ventrales (esternón): 7 componentes frente a 8 de referencia |

**No identificados o no anatómicos (5 propuestas, 28 componentes):**

| Pieza | Componentes | Descripción |
|---|---|---|
| Miembro torácico | c29 | Tetraedro de 4 caras |
| Miembro pélvico | c16 | Lámina sobre el ilion |
| Columna | c01, c02 | Elipsoides lisos |
| Columna | 14 componentes | Segmentos ventrales de costilla: la geometría no distingue cartílago de hueso |
| Columna | c69–c78 | 10 fragmentos pequeños |

**Ausencias observadas, no exhaustivas:** aparato hioideo, huesecillos del oído, clavícula, sesamoideos identificables, miembros del otro lado y la mitad contralateral de la columna.

## Escena y capturas privadas

- **Escena.** `workbench/masters/candidates/canine/canine_private_components.blend` (SHA-256 `55b70e8991c8e6cdd19b9ca0a3d1fbf3116520065a49fadb2a6b27c6fe1de467`). Contiene 169 objetos y 179.813 caras. Se guardó y se reabrió con aserciones de conteo por pieza y longitud de `source_face_index`. Luego se reabrió dos veces más para los renders, sin volver a guardarla. Propiedades de escena: `reviewStatus=pending`, `physicalScaleStatus=unknown_no_conversion_applied`, `webAvailable=false`.
- **Capturas.** 727 PNG (207 MB) en `workbench/inspection/canine-oct31/`:
  - `pieces/`: 4 vistas por pieza más el conjunto;
  - `components/`: contexto y 3 vistas ortogonales por componente;
  - `sheets/`: 22 hojas de contacto;
  - `labels/`: mapas rotulados.

  Las vistas usan los ejes de la fuente (top-z, front-y, side-x, bottom-z), no direcciones anatómicas.
- La escena previa `workbench/masters/candidates/canine_master.blend` no se modificó.

## Comandos ejecutados (salida real)

```text
$ python3 -I scripts/osteology/diagnose-canine.py         # 13,3 s
{"piece": "skull", "triangles": 34660, "components": [32, 32, 32]}
{"piece": "vertebral-column", "triangles": 98081, "components": [79, 79, 79]}
{"piece": "thoracic-limb", "triangles": 21656, "components": [30, 30, 30]}
{"piece": "pelvic-limb", "triangles": 25416, "components": [28, 28, 28]}
$ blender.exe --background --factory-startup --python-exit-code 1 --python scripts/osteology/build-canine-private-scene.py
{"savedAndReopened": "workbench/masters/candidates/canine/canine_private_components.blend", "pieces": {"skull": [32, 34660], "vertebral-column": [79, 98081], "thoracic-limb": [30, 21656], "pelvic-limb": [28, 25416]}}   EXIT 0
$ blender.exe ... --python scripts/osteology/build-canine-private-scene.py -- --renders-only
{"reopenedForRenders": "...canine_private_components.blend", "meshes": 169, "faces": 179813}   EXIT 0
$ blender.exe ... --python scripts/osteology/render-canine-labels.py      → labels-done, EXIT 0
$ python3 -I scripts/osteology/build-canine-diagnostics.py
{"pieces": 4, "proposals": 32, "triangles": 179813, "components": 169}
$ scripts/qa/win.sh npx vitest run tests/unit/canine-diagnostics.test.ts
Test Files 1 passed (1) · Tests 6 passed (6)
$ npx tsc --noEmit        → código 0, sin salida
```

El primer render usaba una orientación de cámara errónea en las vistas laterales. Se corrigió, se borraron esos PNG y se volvieron a renderizar desde la escena reabierta.

## Hashes

- **Originales** (inicio y final, sin cambios):
  - cráneo `7a2d498293ed84dce2e039cf239b11fbe0f406ba1a69fc3bf0a3c80922c529d2`;
  - columna `a4b9d4e7503651e7c3bbb79b65e157cbd6633c7d982ad32c3a7b2d140e654f48`;
  - torácico `14f3ba51632f405159d754a8f5c21c1eb22beacfc34835e69a7a9d1641ae2498`;
  - pélvico `6ba7a11ae2874af14972bb2fd4b4ba37de92631fb3ac01bda42958350294fe99`;
  - RAR `4b44a019ac719ef4cdbd25a8aa64a6e6b98084f09965d435595d5ce8d8721573`.

  Las copias de `workbench/processing/canine/3dexport-original/` tienen los mismos hashes.
- **Salidas:**
  - `data/osteology/diagnostics/canine.json`: `0096dd965bc787acf10e2215ccc3d92afbd089213995b9679970bae3bc1d9758`;
  - `workbench/processing/canine/diagnostics/canine-diagnostic-full.json`: `621028c86f3db69bcdb1aa1b996602e676469c319b91551ae46917b53f906554`.

## Conclusiones

**Defendibles:**
- Conteos, defectos y componentes medidos directamente en los STL sin modificar.
- La columna es una hemisección plana y las extremidades son de un solo lado.
- El cráneo tiene una cara caudal plana.
- No hay registro demostrable entre piezas.
- Unidades desconocidas.
- Los huesos largos de las extremidades, la escápula y el coxal son mallas individuales reconocibles en las capturas.

**No defendibles hoy:**
- Exactitud anatómica de cualquier pieza: es un modelo no escaneado y modificado.
- Lateralidad y numerales seriados (vértebras, costillas, dedos, dientes).
- Identidad individual de carpianos y tarsianos.
- Separación de vértebras fusionadas o de huesos craneales.
- Escala física, y que las piezas compartan escala.
- Cualquier uso web.

## Afirmaciones no verificadas

- Que Z≈0 sea el plano medio, y que c01 y c02 de la columna sean auxiliares de impresión.
- Las identificaciones de esta sección: proceden de capturas e inspección hecha por IA, no de un especialista.
- La procedencia de la geometría y las fuentes usadas por el autor.

## Pendientes y bloqueos

- **Licencia web:** el borrador de solicitud está actualizado en `docs/phase3/requests/canine-permission.md`, sin enviar.
- **Revisión humana cualificada:** las propuestas no avanzan sin ella.
- **Unidades y escala:** sin datos del autor no hay escala.
- **Integración de A0:** registrar en `docs/PROGRESO.md` (archivo que A2 no puede editar).
- **Dato publicado en el repositorio:** `data/osteology/diagnostics/canine.json` incluye cajas envolventes y conteos derivados, sin vértices ni caras. A0 o el usuario deben decidir si su publicación en GitHub es aceptable bajo la licencia del proveedor.
