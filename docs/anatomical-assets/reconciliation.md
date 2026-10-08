# Conciliación Anatómica y Mapeo de Nodos 3D — Vetworld

Este documento describe la conciliación sistemática entre los identificadores de nodos en las mallas 3D y las estructuras del catálogo anatómico de Vetworld, fundamentada en la *Nomina Anatomica Veterinaria* (NAV, 6.ª edición).

---

## 1. Principios de Conciliación

1. **Separación de Especies:** Cada estructura y cada modelo posee un prefijo estricto (`canine:` o `feline:`). No se comparten mallas ni fichas entre especies.
2. **Nombres Canónicos en Latín:** Toda estructura posee su denominación oficial según NAV (ej. *Scapula*, *Musculus biceps brachii*, *Nervus radialis*).
3. **Mapeo Explícito y No Ambiguo:** Cada nodo de la escena 3D se asocia a exactamente una estructura mediante `meshMappings`. Si un nodo no tiene asignación anatómica verificada, no se inventa y el visor lo mantiene no seleccionable.
4. **Estado de Revisión Humana:** Todas las estructuras incorporadas o actualizadas retienen `review.status = 'pending'` hasta que sean examinadas y validadas por un médico veterinario colegiado.

---

## 2. Tabla de Mapeo: Extremidad Torácica Canina (`canine:thoracic-limb-model`)

| Nodo 3D en GLB | Estructura ID | Denominación en Latín (NAV) | Nombre en Español | Capa Funcional |
|---|---|---|---|---|
| `scaplula_bne` | `canine:scapula` | *Scapula* | Escápula | `skeleton` |
| `humerus_bne` | `canine:humerus` | *Humerus* | Húmero | `skeleton` |
| `radius_bne` | `canine:radius` | *Radius* | Radio | `skeleton` |
| `ulna_bne` | `canine:ulna` | *Ulna* | Cúbito | `skeleton` |
| `manus_bne` | `canine:manus` | *Skeleton manus* | Huesos de la mano canina | `skeleton` |
| `L_BicepsBrachii` | `canine:biceps-brachii` | *M. biceps brachii* | Músculo bíceps braquial | `superficial-muscles` |
| `L_Brachialis` | `canine:brachialis` | *M. brachialis* | Músculo braquial | `deep-muscles` |
| `L_Supraspinatus` | `canine:supraspinatus` | *M. supraspinatus* | Músculo supraespinoso | `deep-muscles` |
| `L_Infraspinatus` | `canine:infraspinatus` | *M. infraspinatus* | Músculo infraespinoso | `deep-muscles` |
| `L_Subscapularis` | `canine:subscapularis` | *M. subscapularis* | Músculo subescapular | `deep-muscles` |
| `L_TeresMajor` | `canine:teres-major` | *M. teres major* | Músculo redondo mayor | `deep-muscles` |
| `L_TricepsLH` | `canine:triceps-brachii-long-head` | *M. triceps brachii, caput longum* | Cabeza larga del tríceps braquial | `superficial-muscles` |
| `L_TricepsLatH` | `canine:triceps-brachii-lateral-head` | *M. triceps brachii, caput laterale* | Cabeza lateral del tríceps braquial | `superficial-muscles` |
| `L_TricepsMedH` | `canine:triceps-brachii-medial-head` | *M. triceps brachii, caput mediale* | Cabeza medial del tríceps braquial | `deep-muscles` |
| `L_TricepsAccH` | `canine:triceps-brachii-accessory-head` | *M. triceps brachii, caput accessorium* | Cabeza accesoria del tríceps braquial | `deep-muscles` |
| `L_ECR` | `canine:extensor-carpi-radialis` | *M. extensor carpi radialis* | Músculo extensor radial del carpo | `superficial-muscles` |
| `L_CDE` | `canine:common-digital-extensor` | *M. extensor digitorum communis* | Músculo extensor digital común | `superficial-muscles` |
| `L_LDE` | `canine:lateral-digital-extensor` | *M. extensor digitorum lateralis* | Músculo extensor digital lateral | `superficial-muscles` |
| `L_UlnarisLat` | `canine:ulnaris-lateralis` | *M. ulnaris lateralis* | Músculo ulnar lateral | `superficial-muscles` |
| `L_FCR` | `canine:flexor-carpi-radialis` | *M. flexor carpi radialis* | Músculo flexor radial del carpo | `superficial-muscles` |
| `L_FCU` | `canine:flexor-carpi-ulnaris` | *M. flexor carpi ulnaris* | Músculo flexor ulnar del carpo | `superficial-muscles` |
| `L_SDF` | `canine:superficial-digital-flexor` | *M. flexor digitorum superficialis* | Músculo flexor digital superficial | `superficial-muscles` |
| `L_DDF` | `canine:deep-digital-flexor` | *M. flexor digitorum profundus* | Músculo flexor digital profundo | `deep-muscles` |
| `L_N_Musculocutaneous` | `canine:musculocutaneous-nerve` | *N. musculocutaneus* | Nervio musculocutáneo | `nerves` |
| `L_N_Radial` | `canine:radial-nerve` | *N. radialis* | Nervio radial | `nerves` |
| `L_N_Axillary` | `canine:axillary-nerve` | *N. axillaris* | Nervio axilar | `nerves` |
| `L_N_MedianUlnar` | `canine:median-ulnar-nerve` | *N. medianus et ulnaris* | Tronco de nervios mediano y ulnar | `nerves` |
| `L_N_Suprascapular` | `canine:suprascapular-nerve` | *N. suprascapularis* | Nervio supraescapular | `nerves` |
| `L_N_Subscapular` | `canine:subscapular-nerve` | *N. subscapularis* | Nervio subescapular | `nerves` |

---

## 3. Tabla de Mapeo: Extremidad Torácica Felina (`feline:thoracic-limb-model`)

| Nodo 3D en GLB | Estructura ID | Denominación en Latín (NAV) | Nombre en Español | Capa Funcional |
|---|---|---|---|---|
| `scapula1` | `feline:scapula` | *Scapula* | Escápula | `skeleton` |
| `humerus1` | `feline:humerus` | *Humerus* | Húmero | `skeleton` |
| `radius1` | `feline:radius` | *Radius* | Radio | `skeleton` |
| `ulna1` | `feline:ulna` | *Ulna* | Cúbito | `skeleton` |
| `carpus1` | `feline:carpus` | *Ossa carpi* | Carpo felino | `skeleton` |
| `metacarpus1` | `feline:metacarpus` | *Ossa metacarpalia* | Metacarpo felino | `skeleton` |
| `phalanges1` | `feline:phalanges` | *Ossa digitorum manus* | Falanges de la extremidad anterior | `skeleton` |

---

## 4. Tabla de Mapeo: Cráneo y Cabeza Felina (`feline:skull-model`)

| Nodo 3D en GLB | Estructura ID | Denominación en Latín (NAV) | Nombre en Español | Capa Funcional |
|---|---|---|---|---|
| `skull` | `feline:skull` | *Cranium* | Cráneo | `skeleton` |
| `mandible` | `feline:mandible` | *Mandibula* | Mandíbula | `skeleton` |
| `teeth` | `feline:teeth` | *Dentes* | Dientes felinos | `skeleton` |

---

## 5. Estructuras Sin Modelo 3D ("Modelo 3D no disponible")

Las estructuras caninas y felinas de regiones como *Tórax*, *Abdomen*, *Pelvis* y *Extremidad Pélvica* que se encuentran catalogadas en `data/anatomy/structures.json` declaran explícitamente:
- `modelIds: []`
- El visor y el panel muestran: **«Modelo 3D no disponible»**.
- No se introducen geometrías aproximadas ni cuerpos ficticios en cumplimiento de la regla de integridad anatómica.
